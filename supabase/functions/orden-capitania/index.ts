import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { actualizar, autenticar, insertar, rpc, seleccionar, subirArchivo } from "../_shared/clientes.ts";
import { construirHtmlComunicado, enviarCorreosDetallado } from "../_shared/correo.ts";
import { enviarPlantillaWhatsApp } from "../_shared/whatsapp.ts";
import { registrarDespacho, resumirDespacho } from "../_shared/despacho.ts";

/** Crea una orden de capitanía, emite su PDF y despacha a Portal, Correo y Meta WhatsApp. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    const roles = (perfil as { roles?: string[] } | null)?.roles ?? [];
    if (!roles.some((r) => ["capitan", "ayudante", "teniente_1", "director", "admin"].includes(r))) {
      return json({ error: "Solo Capitanía, Teniente 1°, Director o admin pueden emitir órdenes." }, 403);
    }

    const body = await req.json();
    const materia = String(body.materia ?? "").trim();
    const texto = String(body.texto ?? "").trim();
    if (materia.length < 3) return json({ error: "La materia es obligatoria." }, 400);
    if (texto.length < 10) return json({ error: "El texto de la orden es demasiado corto." }, 400);

    const fecha = body.fecha ?? new Date().toISOString().slice(0, 10);
    const anio = Number(String(fecha).slice(0, 4)) || new Date().getFullYear();

    let numero = Number(body.numero ?? 0);
    if (!numero) {
      const { data: ultimas } = await seleccionar(
        "operaciones",
        "orden_capitania",
        `select=numero&anio=eq.${anio}&order=numero.desc&limit=1`,
        { authorization: "", servicio: true },
      );
      numero = (Array.isArray(ultimas) && ultimas.length ? Number(ultimas[0].numero) : 0) + 1;
    }

    const { data: creada, error: insertError } = await insertar(
      "operaciones",
      "orden_capitania",
      { numero, anio, fecha, materia, texto, creado_por: user.id },
      { authorization: "", servicio: true },
    );
    if (insertError) return json({ error: insertError }, 400);
    const orden = (Array.isArray(creada) ? creada[0] : creada) as Record<string, any>;
    if (!orden?.id) return json({ error: "No se pudo crear la orden." }, 500);

    const { data: folioData, error: folioError } = await rpc(
      "documentos",
      "siguiente_folio",
      { p_tipo: "ORDEN_CAPITANIA" },
      { authorization: "", servicio: true },
    );
    if (folioError) return json({ error: folioError }, 400);
    const folio = Number(folioData);
    const folioTexto = `${anio}-${String(folio).padStart(4, "0")}`;
    const token = crypto.randomUUID().replaceAll("-", "");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const urlVerificacion = `${siteUrl}/verificar/${token}`;

    const pdf = await DocumentoPdf.crear(
      "ORDEN DE CAPITANÍA",
      `N° ${numero}/${anio}`,
      folioTexto,
      urlVerificacion,
    );
    pdf.caja([
      ["Número", `${numero}/${anio}`],
      ["Fecha", textoFecha(fecha)],
      ["Materia", materia],
      ["Emitida por", (perfil as { persona?: { nombre?: string } } | null)?.persona?.nombre ?? "Capitanía"],
    ]);
    pdf.seccion("Texto de la orden");
    pdf.parrafo(texto);
    pdf.finalizar();

    const bytes = await pdf.bytes();
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const ruta = `emitidos/ORDEN_CAPITANIA/${anio}/${String(folio).padStart(4, "0")}.pdf`;
    const nombre = `orden-capitania-${numero}-${folioTexto}.pdf`;

    const { error: subidaError } = await subirArchivo("documentos", ruta, bytes, "application/pdf");
    if (subidaError) return json({ error: subidaError }, 500);

    const { data: doc, error: registroError } = await rpc(
      "documentos",
      "registrar_emision",
      {
        p_tipo: "ORDEN_CAPITANIA",
        p_persona_id: null,
        p_referencia: `ORDEN:${orden.id}`,
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
    const documento = doc as { id?: string; pdf_archivo_id?: string } | null;

    const { data: personas } = await seleccionar(
      "personal",
      "persona",
      "select=id,email,telefono,nombres,apellido_paterno&estado=eq.activo",
      { authorization: "", servicio: true },
    );
    const destinatarios = ((personas ?? []) as Array<Record<string, any>>).map((p) => ({
      persona_id: String(p.id),
      nombre: `${p.nombres} ${p.apellido_paterno}`,
      email: (p.email as string | null) ?? null,
      telefono: (p.telefono as string | null) ?? null,
    }));

    const asunto = `Orden de capitanía N° ${numero}/${anio} · ${materia}`;
    const cuerpo = [
      `ORDEN DE CAPITANÍA N° ${numero}/${anio}`,
      "",
      `Fecha: ${textoFecha(fecha)}`,
      `Materia: ${materia}`,
      "",
      texto,
      "",
      `Portal: ${siteUrl}`,
      `Verifique el documento en: ${urlVerificacion}`,
      "",
      "Segunda Compañía de Bomberos de Limache",
    ].join("\n");

    const correo = body.enviar_correo !== false
      ? await enviarCorreosDetallado(
          destinatarios,
          asunto,
          cuerpo,
          construirHtmlComunicado({
            categoria: "Orden de Capitanía",
            titulo: `N° ${numero}/${anio} · ${materia}`,
            subtitulo: `Emitida el ${textoFecha(fecha)}`,
            cuerpo: texto,
            urlPortal: siteUrl,
          }),
        )
      : null;

    const whatsapp = body.enviar_whatsapp !== false
      ? await enviarPlantillaWhatsApp(
          destinatarios,
          {
            plantilla: Deno.env.get("WHATSAPP_TEMPLATE_COMUNICADO") || "comunicado_compania",
            parametrosBody: [`Orden de Capitanía N° ${numero}/${anio}`, materia, texto.slice(0, 180), siteUrl],
          },
          `Orden de Capitanía N° ${numero}/${anio}: ${materia}`,
        )
      : null;

    const despachoResumen = resumirDespacho(correo, whatsapp);
    const whatsappEstado = whatsapp
      ? whatsapp.configurado
        ? `${whatsapp.enviados}/${whatsapp.total} enviados${whatsapp.error ? ` · ${whatsapp.error}` : ""}`
        : "Pendiente configuración Meta"
      : "No enviado";

    await actualizar(
      "operaciones",
      "orden_capitania",
      `id=eq.${orden.id}`,
      {
        ...(documento?.pdf_archivo_id ? { archivo_id: documento.pdf_archivo_id } : {}),
        ...(correo ? {
          enviada_en: correo.enviados > 0 ? new Date().toISOString() : null,
          correo_estado: `${correo.enviados}/${correo.total} enviados${correo.error ? ` · ${correo.error}` : ""}`,
          correo_destinatarios: correo.total,
        } : {}),
        whatsapp_estado: whatsappEstado,
        despacho_resumen: despachoResumen,
      },
      { authorization: "", servicio: true },
    );

    const despachoId = await registrarDespacho({
      origen_tipo: "orden_capitania",
      origen_id: Number(orden.id),
      titulo: asunto,
      resumen: materia,
      url_portal: siteUrl,
      creado_por: user.id,
      correo,
      whatsapp,
    });

    return json({
      orden_id: orden.id,
      numero,
      anio,
      fecha,
      materia,
      folio,
      token,
      hash_sha256: hash,
      pdf_bucket: "documentos",
      pdf_path: ruta,
      despacho_id: despachoId,
      despacho_resumen: despachoResumen,
      correo,
      whatsapp,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
