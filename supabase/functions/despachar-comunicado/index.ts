import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { actualizar, autenticar, insertar, rpc, seleccionar, subirArchivo } from "../_shared/clientes.ts";
import { construirHtmlComunicado, enviarCorreosDetallado } from "../_shared/correo.ts";
import { enviarPlantillaWhatsApp } from "../_shared/whatsapp.ts";
import { registrarDespacho, resumirDespacho } from "../_shared/despacho.ts";

type TipoComunicado = "orden_dia" | "circular_cbl" | "circular_compania" | "citacion";

const ROLES_POR_TIPO: Record<TipoComunicado, string[]> = {
  orden_dia: ["capitan", "teniente_1", "ayudante", "director", "admin"],
  circular_cbl: ["secretario", "prosecretario", "director", "admin"],
  circular_compania: ["secretario", "prosecretario", "director", "admin"],
  citacion: ["secretario", "prosecretario", "capitan", "ayudante", "director", "admin"],
};

const DOC_POR_TIPO: Record<TipoComunicado, { codigo: string; tituloPdf: string; etiqueta: string }> = {
  orden_dia: { codigo: "ORDEN_DIA", tituloPdf: "ORDEN DEL DÍA", etiqueta: "Orden del día" },
  circular_cbl: { codigo: "CIRCULAR_CBL", tituloPdf: "CIRCULAR CBL", etiqueta: "Circular CBL" },
  circular_compania: { codigo: "CIRCULAR_CIA", tituloPdf: "CIRCULAR DE COMPAÑÍA", etiqueta: "Circular de compañía" },
  citacion: { codigo: "CITACION", tituloPdf: "CITACIÓN OFICIAL", etiqueta: "Citación" },
};

async function generarPdfComunicado(opciones: {
  tipo: TipoComunicado;
  registroId: number;
  numero: string;
  anio: number;
  fecha: string;
  titulo: string;
  cuerpo: string;
  cajasExtra?: Array<[string, string]>;
  emitidoPorNombre: string;
  userId: string;
}): Promise<{ archivoId: string | null; token: string | null }> {
  const meta = DOC_POR_TIPO[opciones.tipo];
  const { data: folioData, error: folioError } = await rpc(
    "documentos",
    "siguiente_folio",
    { p_tipo: meta.codigo },
    { authorization: "", servicio: true },
  );
  if (folioError) throw new Error(folioError);
  const folio = Number(folioData);
  const folioTexto = `${opciones.anio}-${String(folio).padStart(4, "0")}`;
  const token = crypto.randomUUID().replaceAll("-", "");
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
  const urlVerificacion = `${siteUrl}/verificar/${token}`;

  const pdf = await DocumentoPdf.crear(
    meta.tituloPdf,
    `N° ${opciones.numero}/${opciones.anio}`,
    folioTexto,
    urlVerificacion,
  );
  pdf.caja([
    ["Número", `${opciones.numero}/${opciones.anio}`],
    ["Fecha", textoFecha(opciones.fecha)],
    ["Título", opciones.titulo],
    ...(opciones.cajasExtra ?? []),
    ["Emitido por", opciones.emitidoPorNombre],
  ]);
  pdf.seccion("Detalle");
  pdf.parrafo(opciones.cuerpo || "Sin contenido adicional.");
  pdf.finalizar();

  const bytes = await pdf.bytes();
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ruta = `emitidos/${meta.codigo}/${opciones.anio}/${String(folio).padStart(4, "0")}.pdf`;
  const nombre = `${opciones.tipo}-${opciones.numero}-${folioTexto}.pdf`;

  const { error: subidaError } = await subirArchivo("documentos", ruta, bytes, "application/pdf");
  if (subidaError) throw new Error(subidaError);

  const { data: doc, error: registroError } = await rpc(
    "documentos",
    "registrar_emision",
    {
      p_tipo: meta.codigo,
      p_persona_id: null,
      p_referencia: `${meta.codigo}:${opciones.registroId}`,
      p_hash: hash,
      p_pdf_bucket: "documentos",
      p_pdf_path: ruta,
      p_nombre_archivo: nombre,
      p_mime: "application/pdf",
      p_tamano: bytes.length,
      p_folio: folio,
      p_token: token,
      p_emitido_por: opciones.userId,
    },
    { authorization: "", servicio: true },
  );
  if (registroError) throw new Error(registroError);

  const documento = doc as { pdf_archivo_id?: string } | null;
  return { archivoId: documento?.pdf_archivo_id ?? null, token };
}

/**
 * Publica comunicados del Tablero (Órdenes del día, Circulares CBL,
 * Circulares de compañía y Citaciones) y despacha simultáneamente
 * a Portal + Correo + Meta WhatsApp Cloud API (plantillas aprobadas).
 * También soporta `accion: "reintentar"` sobre un `despacho_id`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    const roles = (perfil as { roles?: string[]; es_oficial?: boolean } | null)?.roles ?? [];
    const esOficial = Boolean((perfil as { es_oficial?: boolean } | null)?.es_oficial) || roles.includes("admin");
    const emisorNombre = (perfil as { persona?: { nombre?: string } } | null)?.persona?.nombre ?? "Oficialidad";

    const body = await req.json();
    const accion = String(body.accion ?? "publicar");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    if (accion === "reintentar") {
      if (!esOficial) return json({ error: "Solo la oficialidad puede reintentar despachos." }, 403);
      const despachoId = Number(body.despacho_id);
      if (!despachoId) return json({ error: "Falta despacho_id." }, 400);

      const { data: despachos } = await seleccionar(
        "nucleo",
        "despacho",
        `select=*&id=eq.${despachoId}&limit=1`,
        { authorization: "", servicio: true },
      );
      const despacho = Array.isArray(despachos) ? despachos[0] : null;
      if (!despacho) return json({ error: "El despacho no existe." }, 404);

      const { data: detalles } = await seleccionar(
        "nucleo",
        "despacho_detalle",
        `select=*&despacho_id=eq.${despachoId}&estado=in.(fallido,no_configurado)`,
        { authorization: "", servicio: true },
      );
      const pendientes = (detalles ?? []) as Array<Record<string, any>>;
      if (pendientes.length === 0) return json({ ok: true, reintentados: 0 });

      const canal = String(body.canal ?? "ambos");
      const pendientesCorreo = canal === "whatsapp" ? [] : pendientes.filter((d) => d.canal === "correo" && d.destino);
      const pendientesWa = canal === "correo" ? [] : pendientes.filter((d) => d.canal === "whatsapp" && d.destino);

      let nuevosCorreosOk = 0;
      if (pendientesCorreo.length > 0) {
        const texto = `${despacho.titulo}\n\n${despacho.resumen ?? ""}\n\nRevisa el detalle en: ${despacho.url_portal ?? siteUrl}`;
        const r = await enviarCorreosDetallado(
          pendientesCorreo.map((p) => ({ persona_id: p.persona_id, nombre: p.nombre, email: p.destino })),
          despacho.titulo,
          texto,
          construirHtmlComunicado({
            categoria: "Reenvío de comunicado",
            titulo: despacho.titulo,
            cuerpo: despacho.resumen ?? "",
            urlPortal: despacho.url_portal ?? siteUrl,
          }),
        );
        for (const d of r.detalles) {
          const orig = pendientesCorreo.find((p) => p.destino === d.email);
          if (!orig) continue;
          if (d.estado === "enviado") nuevosCorreosOk++;
          await actualizar(
            "nucleo",
            "despacho_detalle",
            `id=eq.${orig.id}`,
            { estado: d.estado, proveedor_id: d.proveedor_id, error: d.error, intentado_en: new Date().toISOString() },
            { authorization: "", servicio: true },
          );
        }
      }

      let nuevosWaOk = 0;
      if (pendientesWa.length > 0) {
        const plantilla = despacho.whatsapp_plantilla || Deno.env.get("WHATSAPP_TEMPLATE_COMUNICADO") || "comunicado_compania";
        const r = await enviarPlantillaWhatsApp(
          pendientesWa.map((p) => ({ persona_id: p.persona_id, nombre: p.nombre ?? "Bombero", telefono: p.destino })),
          {
            plantilla,
            parametrosBody: [despacho.titulo, despacho.resumen ?? "Revisa el Tablero del Portal.", despacho.url_portal ?? siteUrl],
          },
          `${despacho.titulo} · ${despacho.resumen ?? ""}`,
        );
        for (const d of r.detalles) {
          const orig = pendientesWa.find((p) => p.persona_id === d.persona_id || p.nombre === d.nombre);
          if (!orig) continue;
          if (d.estado === "enviado") nuevosWaOk++;
          await actualizar(
            "nucleo",
            "despacho_detalle",
            `id=eq.${orig.id}`,
            { estado: d.estado, proveedor_id: d.proveedor_id, error: d.error, intentado_en: new Date().toISOString() },
            { authorization: "", servicio: true },
          );
        }
      }

      await actualizar(
        "nucleo",
        "despacho",
        `id=eq.${despachoId}`,
        {
          correo_enviados: Number(despacho.correo_enviados ?? 0) + nuevosCorreosOk,
          whatsapp_enviados: Number(despacho.whatsapp_enviados ?? 0) + nuevosWaOk,
        },
        { authorization: "", servicio: true },
      );

      return json({ ok: true, correo_reintentados_ok: nuevosCorreosOk, whatsapp_reintentados_ok: nuevosWaOk });
    }

    // Acción: publicar
    const tipo = String(body.tipo ?? "") as TipoComunicado;
    if (!(tipo in ROLES_POR_TIPO)) return json({ error: "Tipo de comunicado inválido." }, 400);
    if (!roles.some((r) => ROLES_POR_TIPO[tipo].includes(r))) {
      return json({ error: `Tu rol no tiene permiso para publicar ${DOC_POR_TIPO[tipo].etiqueta}.` }, 403);
    }

    const datos = (body.datos ?? {}) as Record<string, any>;
    const titulo = String(datos.titulo ?? "").trim();
    if (titulo.length < 3) return json({ error: "El título es obligatorio (mínimo 3 caracteres)." }, 400);

    const hoy = new Date().toISOString().slice(0, 10);
    const fecha = String(datos.fecha || datos.fecha_emision || hoy);
    const anio = Number(fecha.slice(0, 4)) || new Date().getFullYear();
    let archivoId: string | null = body.archivo_id ?? null;

    let tabla = "";
    let esquema = "";
    let origenId = 0;
    let numeroFinal = String(datos.numero ?? "").trim();
    let resumenTexto = "";
    let cuerpoTexto = "";
    const cajasExtra: Array<[string, string]> = [];

    if (tipo === "orden_dia") {
      esquema = "operaciones";
      tabla = "orden_dia";
      cuerpoTexto = String(datos.texto ?? "").trim();
      if (cuerpoTexto.length < 5) return json({ error: "El texto de la orden del día es obligatorio." }, 400);
      let num = Number(numeroFinal || 0);
      if (!num) {
        const { data: ult } = await seleccionar(esquema, tabla, `select=numero&anio=eq.${anio}&order=numero.desc&limit=1`, { authorization: "", servicio: true });
        num = (Array.isArray(ult) && ult.length ? Number(ult[0].numero) : 0) + 1;
      }
      numeroFinal = String(num);
      const { data: creada, error: insErr } = await insertar(
        esquema,
        tabla,
        {
          numero: num,
          anio,
          fecha,
          vigente_hasta: datos.vigente_hasta || null,
          titulo,
          texto: cuerpoTexto,
          archivo_id: archivoId,
          creado_por: user.id,
        },
        { authorization: "", servicio: true },
      );
      if (insErr) return json({ error: insErr }, 400);
      origenId = Number((Array.isArray(creada) ? creada[0] : creada)?.id ?? 0);
      resumenTexto = cuerpoTexto.slice(0, 160);
      if (datos.vigente_hasta) cajasExtra.push(["Vigente hasta", textoFecha(datos.vigente_hasta)]);
    } else if (tipo === "circular_cbl" || tipo === "circular_compania") {
      esquema = "secretaria";
      tabla = "circular";
      const origen = tipo === "circular_cbl" ? "cbl" : "compania";
      cuerpoTexto = String(datos.texto ?? datos.resumen ?? "").trim();
      const resumen = String(datos.resumen ?? "").trim() || cuerpoTexto.slice(0, 200);
      if (!numeroFinal) {
        const { data: ult } = await seleccionar(esquema, tabla, `select=id&origen=eq.${origen}&anio=eq.${anio}&order=id.desc&limit=1`, { authorization: "", servicio: true });
        numeroFinal = String((Array.isArray(ult) ? ult.length : 0) + 1).padStart(2, "0");
      }
      const { data: creada, error: insErr } = await insertar(
        esquema,
        tabla,
        {
          origen,
          numero: numeroFinal,
          anio,
          fecha,
          titulo,
          resumen,
          texto: cuerpoTexto || null,
          archivo_id: archivoId,
          creado_por: user.id,
        },
        { authorization: "", servicio: true },
      );
      if (insErr) return json({ error: insErr }, 400);
      origenId = Number((Array.isArray(creada) ? creada[0] : creada)?.id ?? 0);
      resumenTexto = resumen;
      cajasExtra.push(["Origen", origen === "cbl" ? "Cuerpo de Bomberos de Limache" : "Segunda Compañía"]);
    } else {
      esquema = "secretaria";
      tabla = "citacion";
      const fechaEvento = String(datos.fecha_evento ?? "");
      const horaEvento = String(datos.hora_evento ?? "");
      const lugar = String(datos.lugar ?? "").trim();
      if (!fechaEvento || !horaEvento || !lugar) {
        return json({ error: "Fecha, hora y lugar del evento son obligatorios en una citación." }, 400);
      }
      let num = Number(numeroFinal || 0);
      if (!num) {
        const { data: ult } = await seleccionar(esquema, tabla, `select=numero&anio=eq.${anio}&order=numero.desc&limit=1`, { authorization: "", servicio: true });
        num = (Array.isArray(ult) && ult.length ? Number(ult[0].numero) : 0) + 1;
      }
      numeroFinal = String(num);
      cuerpoTexto = String(datos.detalle ?? "").trim();
      const { data: creada, error: insErr } = await insertar(
        esquema,
        tabla,
        {
          numero: num,
          anio,
          fecha_emision: fecha,
          fecha_evento: fechaEvento,
          hora_evento: horaEvento,
          lugar,
          tenida: datos.tenida || null,
          obligatoria: datos.obligatoria !== false,
          tipo_acto_clave: datos.tipo_acto_clave || null,
          titulo,
          detalle: cuerpoTexto || null,
          archivo_id: archivoId,
          creado_por: user.id,
        },
        { authorization: "", servicio: true },
      );
      if (insErr) return json({ error: insErr }, 400);
      origenId = Number((Array.isArray(creada) ? creada[0] : creada)?.id ?? 0);
      resumenTexto = `${textoFecha(fechaEvento)} ${horaEvento.slice(0, 5)} h · ${lugar}${datos.tenida ? ` · Tenida: ${datos.tenida}` : ""}`;
      cajasExtra.push(
        ["Fecha evento", `${textoFecha(fechaEvento)} ${horaEvento.slice(0, 5)} h`],
        ["Lugar", lugar],
        ["Tenida", String(datos.tenida || "Por confirmar")],
        ["Asistencia", datos.obligatoria !== false ? "Obligatoria" : "Voluntaria"],
      );
    }

    if (!archivoId && body.emitir_pdf) {
      const generado = await generarPdfComunicado({
        tipo,
        registroId: origenId,
        numero: numeroFinal,
        anio,
        fecha,
        titulo,
        cuerpo: cuerpoTexto || resumenTexto,
        cajasExtra,
        emitidoPorNombre: emisorNombre,
        userId: user.id,
      });
      if (generado.archivoId) {
        archivoId = generado.archivoId;
        await actualizar(esquema, tabla, `id=eq.${origenId}`, { archivo_id: archivoId }, { authorization: "", servicio: true });
      }
    }

    const { data: personas } = await seleccionar(
      "personal",
      "persona",
      "select=id,nombres,apellido_paterno,email,telefono&estado=eq.activo",
      { authorization: "", servicio: true },
    );
    const destinatarios = ((personas ?? []) as Array<Record<string, any>>).map((p) => ({
      persona_id: String(p.id),
      nombre: `${p.nombres} ${p.apellido_paterno}`,
      email: (p.email as string | null) ?? null,
      telefono: (p.telefono as string | null) ?? null,
    }));

    const etiqueta = DOC_POR_TIPO[tipo].etiqueta;
    const asunto = `${etiqueta} N° ${numeroFinal}/${anio} · ${titulo}`;
    const textoCorreo = [
      asunto,
      "",
      resumenTexto,
      cuerpoTexto && cuerpoTexto !== resumenTexto ? `\n${cuerpoTexto}` : "",
      "",
      `Consulta en el Portal de la Compañía: ${siteUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const correo = body.enviar_correo !== false
      ? await enviarCorreosDetallado(
          destinatarios,
          asunto,
          textoCorreo,
          construirHtmlComunicado({
            categoria: etiqueta,
            titulo: `N° ${numeroFinal}/${anio} · ${titulo}`,
            subtitulo: resumenTexto,
            cuerpo: cuerpoTexto || resumenTexto,
            urlPortal: siteUrl,
          }),
        )
      : null;

    const plantilla = tipo === "citacion"
      ? Deno.env.get("WHATSAPP_TEMPLATE_CITACION") || "citacion_compania"
      : Deno.env.get("WHATSAPP_TEMPLATE_COMUNICADO") || "comunicado_compania";

    const whatsapp = body.enviar_whatsapp !== false
      ? await enviarPlantillaWhatsApp(
          destinatarios,
          {
            plantilla,
            parametrosBody:
              tipo === "citacion"
                ? [titulo, `${textoFecha(datos.fecha_evento)} ${String(datos.hora_evento).slice(0, 5)} h`, String(datos.lugar), String(datos.tenida || "Por confirmar"), siteUrl]
                : [`${etiqueta} N° ${numeroFinal}/${anio}`, titulo, resumenTexto || "Revisa el detalle en el portal.", siteUrl],
          },
          `${asunto} · ${resumenTexto}`,
        )
      : null;

    const despachoResumen = resumirDespacho(correo, whatsapp);
    await actualizar(esquema, tabla, `id=eq.${origenId}`, { despacho_resumen: despachoResumen }, { authorization: "", servicio: true });

    const despachoId = await registrarDespacho({
      origen_tipo: tipo,
      origen_id: origenId,
      titulo: asunto,
      resumen: resumenTexto,
      url_portal: siteUrl,
      creado_por: user.id,
      correo,
      whatsapp,
    });

    return json({
      id: origenId,
      tipo,
      numero: numeroFinal,
      anio,
      archivo_id: archivoId,
      despacho_id: despachoId,
      despacho_resumen: despachoResumen,
      correo,
      whatsapp,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
