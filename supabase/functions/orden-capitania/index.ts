import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { actualizar, autenticar, insertar, rpc, seleccionar, subirArchivo } from "../_shared/clientes.ts";
import { enviarCorreos } from "../_shared/correo.ts";

/** Crea una orden de capitanía, emite su PDF y la envía por correo. */
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
    if (documento?.pdf_archivo_id) {
      await actualizar("operaciones", "orden_capitania", `id=eq.${orden.id}`, { archivo_id: documento.pdf_archivo_id }, { authorization: "", servicio: true });
    }

    let correo = { enviados: 0, total: 0, error: null as string | null };
    if (body.enviar_correo !== false) {
      const { data: personas } = await seleccionar(
        "personal",
        "persona",
        "select=email,nombres,apellido_paterno&estado=eq.activo&email=not.is.null",
        { authorization: "", servicio: true },
      );
      const destinatarios = ((personas ?? []) as Array<{ email: string | null }>)
        .map((p) => p.email ?? "")
        .filter(Boolean);
      const cuerpo = [
        `ORDEN DE CAPITANÍA N° ${numero}/${anio}`,
        "",
        `Fecha: ${textoFecha(fecha)}`,
        `Materia: ${materia}`,
        "",
        texto,
        "",
        `Verifique el documento en: ${urlVerificacion}`,
        "",
        "Segunda Compañía de Bomberos de Limache",
      ].join("\n");
      correo = await enviarCorreos(destinatarios, `Orden de capitanía N° ${numero}/${anio}`, cuerpo);
      await actualizar(
        "operaciones",
        "orden_capitania",
        `id=eq.${orden.id}`,
        {
          enviada_en: correo.enviados > 0 ? new Date().toISOString() : null,
          correo_estado: `${correo.enviados}/${correo.total} enviados${correo.error ? ` · ${correo.error}` : ""}`,
          correo_destinatarios: correo.total,
        },
        { authorization: "", servicio: true },
      );
    }

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
      correo,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
