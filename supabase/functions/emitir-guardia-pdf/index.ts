import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { autenticar, rpc, subirArchivo } from "../_shared/clientes.ts";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Emite el PDF P7 (Rol y Libro de Guardia) de un ciclo o una semana. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    const roles = (perfil as { roles?: string[] } | null)?.roles ?? [];
    if (!roles.some((r) => ["capitan", "teniente_1", "ayudante", "director", "admin"].includes(r))) {
      return json({ error: "Solo Capitanía o Teniente 1° pueden emitir el rol de guardia." }, 403);
    }

    const cuerpo = await req.json().catch(() => ({}));
    const cicloId = Number(cuerpo.ciclo_id);
    const semana = cuerpo.semana_num ? Number(cuerpo.semana_num) : null;
    if (!cicloId) return json({ error: "Falta ciclo_id." }, 400);

    const { data: grilla, error: grillaError } = await rpc(
      "operaciones",
      "grilla_ciclo",
      { p_ciclo_id: cicloId },
      { authorization: "", servicio: true },
    );
    if (grillaError || !grilla) return json({ error: grillaError ?? "El ciclo no existe." }, 404);

    const dias = (grilla.dias as Array<Record<string, any>>).filter(
      (d) => semana === null || Number(d.semana_num) === semana,
    );
    if (dias.length === 0) return json({ error: "No hay días para ese ciclo o semana." }, 404);

    const { data: folioData, error: folioError } = await rpc(
      "documentos",
      "siguiente_folio",
      { p_tipo: "ROL_GUARDIA" },
      { authorization: "", servicio: true },
    );
    if (folioError) return json({ error: folioError }, 400);
    const folio = Number(folioData);
    const anio = new Date().getFullYear();
    const folioTexto = `${anio}-${String(folio).padStart(4, "0")}`;
    const token = crypto.randomUUID().replaceAll("-", "");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const urlVerificacion = `${siteUrl}/verificar/${token}`;

    const titulo = semana ? `ROL DE GUARDIA · SEMANA ${semana}` : "ROL DE GUARDIA";
    const pdf = await DocumentoPdf.crear(titulo, grilla.ciclo.nombre, folioTexto, urlVerificacion);
    pdf.caja([
      ["Ciclo", grilla.ciclo.nombre],
      ["Período", `${textoFecha(grilla.ciclo.fecha_inicio)} al ${textoFecha(grilla.ciclo.fecha_fin)}`],
      ["Cupo por día", String(grilla.ciclo.cupo_base)],
      ["Estado", grilla.ciclo.estado],
      ["Emitido", textoFecha(new Date().toISOString().slice(0, 10))],
    ]);

    for (const dia of dias) {
      const fecha = new Date(`${dia.fecha}T12:00:00`);
      const integrantes = (dia.integrantes as Array<Record<string, any>>) ?? [];
      const activos = integrantes.filter((i) => i.estado === "inscrito" || i.estado === "cumplida");
      pdf.seccion(`${DIAS[fecha.getDay()]} ${textoFecha(dia.fecha)}${dia.feriado ? ` · ${dia.feriado}` : ""}`);
      const lineas = [
        `Guardianes: ${activos.length}/${grilla.ciclo.cupo_base}`,
        `Hora de aviso a central: ${dia.hora_aviso_central ? new Date(dia.hora_aviso_central).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "sin registro"}`,
        `Maquinista (Charlie): ${dia.charlie_modalidad ?? "sin registro"}${dia.charlie_codigo ? ` · ${dia.charlie_codigo}` : ""}`,
        `Jefe de guardia: ${activos.find((i) => i.es_jefe)?.nombre ?? "sin determinar"}`,
      ];
      if (activos.length > 0) {
        lineas.push(
          ...activos.map(
            (i) =>
              `Reg. ${i.registro} · ${i.nombre}${i.codigo_charlie ? ` (${i.codigo_charlie})` : ""}${i.origen === "charlie_z8" ? " · Charlie Z8" : ""}${i.origen === "llegada_tardia" ? " · llegada tardía" : ""}${i.origen === "reemplazo" ? " · reemplazo" : ""}`,
          ),
        );
      }
      if (dia.observacion) lineas.push(`Observaciones: ${dia.observacion}`);
      pdf.lista(lineas);
    }

    pdf.seccion("Firma");
    pdf.parrafo("El presente rol se firma digitalmente en la aplicación por el Oficial operativo de mayor rango presente o, en su defecto, por el bombero con menor número de registro.");

    pdf.finalizar();
    const bytes = await pdf.bytes();
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const ruta = `emitidos/ROL_GUARDIA/${anio}/${String(folio).padStart(4, "0")}.pdf`;
    const nombre = `rol-guardia-${String(grilla.ciclo.fecha_inicio)}-${folioTexto}.pdf`;

    const { error: subidaError } = await subirArchivo("documentos", ruta, bytes, "application/pdf");
    if (subidaError) return json({ error: subidaError }, 500);

    const { data: doc, error: registroError } = await rpc(
      "documentos",
      "registrar_emision",
      {
        p_tipo: "ROL_GUARDIA",
        p_persona_id: null,
        p_referencia: `CICLO:${cicloId}`,
        p_hash: hash,
        p_pdf_bucket: "documentos",
        p_pdf_path: ruta,
        p_nombre_archivo: nombre,
        p_mime: "application/pdf",
        p_tamano: bytes.length,
        p_folio: folio,
        p_token: token,
        p_emitido_por: user.id,
      },
      { authorization: "", servicio: true },
    );
    if (registroError) return json({ error: registroError }, 500);

    const documento = doc as { id?: string } | null;

    return json({
      documento_id: documento?.id ?? null,
      tipo: "ROL_GUARDIA",
      anio,
      folio,
      token,
      hash_sha256: hash,
      pdf_bucket: "documentos",
      pdf_path: ruta,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
