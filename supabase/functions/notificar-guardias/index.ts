import { corsHeaders, json } from "../_shared/cors.ts";
import { actualizar, autenticar, esLlamadaServicio, insertar, rpc, rpcFilas, seleccionar } from "../_shared/clientes.ts";
import { enviarCorreosDetallado } from "../_shared/correo.ts";
import { enviarPlantillaWhatsApp, textoParaGrupo } from "../_shared/whatsapp.ts";
import { registrarDespacho } from "../_shared/despacho.ts";

/**
 * Avisos de guardia.
 * Modos:
 *  - convocatoria_semana: { ciclo_id, semana_num }
 *  - llegadas_tardias:    { }
 * Permitido a Capitanía / Teniente 1° / Ayudante / Director / admin, o con
 * el token interno CRON_SECRET (pg_net, Cloudflare Cron o GitHub Actions).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const cuerpo = await req.json().catch(() => ({}));
    const modo = String(cuerpo.modo ?? "llegadas_tardias");
    const servicio = esLlamadaServicio(req);
    let authorization = "";
    let userId: string | null = null;

    if (!servicio) {
      const { user, authorization: auth, error } = await autenticar(req);
      if (!user) return json({ error: "Sesión no válida", detalle: error }, 401);
      authorization = auth;
      userId = user.id;
      const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
      const roles = (perfil as { roles?: string[] } | null)?.roles ?? [];
      if (!roles.some((r) => ["capitan", "teniente_1", "ayudante", "director", "admin"].includes(r))) {
        return json({ error: "Solo Capitanía o Teniente 1° pueden enviar avisos de guardia." }, 403);
      }
    }

    if (modo === "convocatoria_semana") {
      const cicloId = Number(cuerpo.ciclo_id);
      const semana = Number(cuerpo.semana_num ?? 1);
      if (!cicloId) return json({ error: "Falta ciclo_id." }, 400);

      const { data: grilla } = await rpc("operaciones", "grilla_ciclo", { p_ciclo_id: cicloId }, { authorization: "", servicio: true });
      if (!grilla) return json({ error: "El ciclo no existe." }, 404);

      const dias = (grilla.dias as Array<Record<string, any>>).filter((d) => Number(d.semana_num) === semana);
      const conCupo = dias.filter((d) => Number(d.guardianes) < Number(grilla.ciclo.cupo_base));
      const fechas = dias.map((d) => String(d.fecha).slice(8, 10) + "-" + String(d.fecha).slice(5, 7));

      // Solo se avisa a quienes deben cubrir guardia esta semana según la
      // Orden 01/2026 (no a los exentos ni a quienes ya cumplieron su período).
      const { data: personas } = await rpcFilas(
        "operaciones",
        "destinatarios_convocatoria",
        { p_ciclo: cicloId, p_semana: semana },
        { authorization: "", servicio: true },
      );

      const destinatarios = ((personas ?? []) as Array<Record<string, any>>).map((p) => ({
        persona_id: p.persona_id ? String(p.persona_id) : null,
        nombre: String(p.nombre ?? ""),
        email: p.email ?? null,
        telefono: p.telefono ?? null,
      }));

      const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
      const titulo = `Guardia Semana ${semana} · ${grilla.ciclo.nombre}`;
      const lineas = [
        `Días con cupo disponible: ${conCupo.length ? conCupo.map((d) => String(d.fecha)).join(", ") : "todos cubiertos"}`,
        conCupo.length ? `Fechas: ${fechas.join(", ")}` : "La semana está completa; se liberan cupos extra.",
        "Ingresa a la app → Guardia para inscribirte.",
      ];

      const correo = await enviarCorreosDetallado(
        destinatarios,
        titulo,
        [titulo, "", ...lineas, "", `Portal: ${siteUrl}`, "Segunda Compañía · Cuerpo de Bomberos de Limache"].join("\n"),
      );
      const whatsapp = await enviarPlantillaWhatsApp(
        destinatarios,
        {
          plantilla: Deno.env.get("WHATSAPP_TEMPLATE_GUARDIA") || "guardia_aviso",
          parametrosBody: [titulo, lineas.join(" · "), `${siteUrl}/guardia`],
        },
        textoParaGrupo(titulo, lineas),
      );

      await registrarDespacho({
        origen_tipo: "guardia",
        origen_id: cicloId,
        titulo,
        resumen: `Convocatoria Semana ${semana}`,
        url_portal: `${siteUrl}/guardia`,
        creado_por: userId,
        correo,
        whatsapp,
      });

      const marca = semana === 1 ? "notificado_s1_en" : "notificado_s2_en";
      await actualizar("operaciones", "guardia_ciclo", `id=eq.${cicloId}`, { [marca]: new Date().toISOString() }, { authorization: "", servicio: true });

      await insertar(
        "operaciones",
        "guardia_notificacion",
        {
          ciclo_id: cicloId,
          tipo: "convocatoria_semana",
          canal: "correo",
          asunto: titulo,
          mensaje: lineas.join("\n"),
          destinatario: `${correo.enviados}/${correo.total}`,
          estado: correo.error ? "parcial" : "enviada",
          error: correo.error,
        },
        { authorization: "", servicio: true },
      );

      return json({ modo, titulo, correo, whatsapp, texto_grupo: textoParaGrupo(titulo, lineas) });
    }

    // llegadas_tardias
    const { data: filas } = await seleccionar(
      "operaciones",
      "guardia_integrante",
      "select=turno_id,persona_id,hora_llegada&origen=eq.llegada_tardia&notificado_jefe_en=is.null&order=turno_id",
      { authorization: "", servicio: true },
    );

    const pendientes = (filas ?? []) as Array<{ turno_id: number; persona_id: string; hora_llegada: string }>;
    if (pendientes.length === 0) return json({ modo, enviados: 0, detalle: "Sin llegadas tardías pendientes." });

    const turnoIds = Array.from(new Set(pendientes.map((p) => p.turno_id)));
    const resultado: Array<Record<string, unknown>> = [];

    for (const turnoId of turnoIds) {
      const { data: turnos } = await seleccionar(
        "operaciones",
        "guardia_turno",
        `select=id,fecha,jefe_persona_id&id=eq.${turnoId}`,
        { authorization: "", servicio: true },
      );
      const turno = ((turnos ?? []) as Array<Record<string, any>>)[0];
      if (!turno) continue;

      const llegadas = pendientes.filter((p) => p.turno_id === turnoId);
      const ids = llegadas.map((l) => l.persona_id);
      const { data: personas } = await seleccionar(
        "personal",
        "persona",
        `select=id,nombres,apellido_paterno,registro,email,telefono&id=in.(${ids.join(",")})`,
        { authorization: "", servicio: true },
      );
      const nombres = ((personas ?? []) as Array<Record<string, any>>).map(
        (p) => `${p.nombres} ${p.apellido_paterno} (Reg. ${p.registro}) a las ${new Date(llegadas.find((l) => l.persona_id === p.id)!.hora_llegada).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`,
      );

      let jefe: Record<string, any> | null = null;
      if (turno.jefe_persona_id) {
        const { data: jefes } = await seleccionar(
          "personal",
          "persona",
          `select=id,nombres,apellido_paterno,email,telefono&id=eq.${turno.jefe_persona_id}`,
          { authorization: "", servicio: true },
        );
        jefe = ((jefes ?? []) as Array<Record<string, any>>)[0] ?? null;
      }

      const titulo = `Llegadas tardías · Guardia del ${String(turno.fecha).slice(8, 10)}-${String(turno.fecha).slice(5, 7)}-${String(turno.fecha).slice(0, 4)}`;
      const lineas = nombres.length ? nombres : ["Llegadas registradas en el turno."];
      const correo = jefe?.email
        ? await enviarCorreosDetallado(
            [{ persona_id: jefe.id, nombre: `${jefe.nombres} ${jefe.apellido_paterno}`, email: jefe.email }],
            titulo,
            [titulo, "", ...lineas].join("\n"),
          )
        : { enviados: 0, total: 0, error: null };
      const whatsapp = jefe
        ? await enviarPlantillaWhatsApp(
            [{ persona_id: jefe.id, nombre: jefe.nombres, telefono: jefe.telefono }],
            {
              plantilla: Deno.env.get("WHATSAPP_TEMPLATE_LLEGADA_TARDIA") || "guardia_llegada_tardia",
              parametrosBody: [titulo, lineas.join(" · ")],
            },
            textoParaGrupo(titulo, lineas),
          )
        : null;

      await actualizar(
        "operaciones",
        "guardia_integrante",
        `turno_id=eq.${turnoId}&origen=eq.llegada_tardia&notificado_jefe_en=is.null`,
        { notificado_jefe_en: new Date().toISOString() },
        { authorization: "", servicio: true },
      );

      resultado.push({ turno_id: turnoId, correo, whatsapp });
    }

    return json({ modo, turnos: resultado.length, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
