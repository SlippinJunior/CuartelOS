import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { actualizar, autenticar, rpc, seleccionar, subirArchivo } from "../_shared/clientes.ts";

const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

/** Emite el PDF de un acta de reunión y lo registra con folio. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    const roles = (perfil as { roles?: string[] } | null)?.roles ?? [];
    if (!roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r))) {
      return json({ error: "Solo Secretaría, Director o admin pueden emitir actas." }, 403);
    }

    const { acta_id } = await req.json();
    if (!acta_id) return json({ error: "Falta acta_id." }, 400);

    const { data: actas, error: actaError } = await seleccionar(
      "secretaria",
      "acta",
      `select=*,tipo_sesion:tipo_sesion(nombre)&id=eq.${Number(acta_id)}&limit=1`,
      { authorization: "", servicio: true },
    );
    if (actaError || !Array.isArray(actas) || actas.length === 0) {
      return json({ error: actaError ?? "El acta no existe." }, 404);
    }
    const acta = actas[0] as Record<string, any>;

    const { data: acuerdosData } = await seleccionar(
      "secretaria",
      "acuerdo",
      `select=*&acta_id=eq.${Number(acta_id)}&order=numero`,
      { authorization: "", servicio: true },
    );
    const acuerdos = (acuerdosData ?? []) as Array<Record<string, any>>;

    let asistencias = 0;
    let faltas = 0;
    let permisos = 0;
    if (acta.lista_id) {
      const { data: marcas } = await seleccionar(
        "asistencia",
        "asistencia",
        `select=marca&lista_id=eq.${acta.lista_id}`,
        { authorization: "", servicio: true },
      );
      for (const m of (marcas ?? []) as Array<{ marca: string }>) {
        if (m.marca === "A") asistencias++;
        else if (m.marca === "F") faltas++;
        else permisos++;
      }
    }

    const { data: folioData, error: folioError } = await rpc(
      "documentos",
      "siguiente_folio",
      { p_tipo: "ACTA" },
      { authorization: "", servicio: true },
    );
    if (folioError) return json({ error: folioError }, 400);
    const folio = Number(folioData);
    const anio = new Date().getFullYear();
    const folioTexto = `${anio}-${String(folio).padStart(4, "0")}`;
    const token = crypto.randomUUID().replaceAll("-", "");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const urlVerificacion = `${siteUrl}/verificar/${token}`;

    const pdf = await DocumentoPdf.crear(
      "ACTA DE REUNIÓN",
      `${acta.tipo_sesion?.nombre ?? "Sesión"} N° ${acta.numero}/${acta.anio}`,
      folioTexto,
      urlVerificacion,
    );
    pdf.caja([
      ["Fecha", textoFecha(acta.fecha)],
      ["Tipo de sesión", acta.tipo_sesion?.nombre ?? acta.tipo_sesion_codigo ?? "-"],
      ["Estado", acta.aprobada_en_acta_id ? `Aprobada (acta N° ${acta.aprobada_en_acta_id})` : "Borrador"],
      ["Quórum", acta.quorum_ok ? "Cumplido" : "No registrado"],
      ["Asistencia", `${asistencias} asisten · ${permisos} permisos/licencias · ${faltas} faltas`],
    ]);

    // Secciones reglamentarias del editor estructurado. Las actas heredadas
    // solo tienen `texto` y siguen imprimiéndose igual.
    const secciones = (acta.secciones ?? {}) as Record<string, string>;
    const bloques: Array<[string, string]> = [
      ["hora_inicio", "Hora de inicio"],
      ["hora_termino", "Hora de término"],
      ["preside", "Preside la sesión"],
      ["acta_anterior", "Lectura del acta anterior"],
      ["correspondencia", "Correspondencia"],
      ["cuenta_oficiales", "Cuenta de los oficiales"],
      ["incidentes", "Incidentes"],
      ["varios", "Varios"],
    ];
    if (Object.keys(secciones).length > 0) {
      for (const [clave, etiqueta] of bloques) {
        const valor = String(secciones[clave] ?? "").trim();
        if (!valor) continue;
        pdf.seccion(etiqueta);
        pdf.parrafo(valor, 9.5);
      }
    }

    if (acta.texto) {
      pdf.seccion("Observaciones generales");
      pdf.parrafo(acta.texto);
    }
    pdf.seccion("Acuerdos");
    pdf.lista(
      acuerdos.map((a) =>
        `N° ${a.numero}: ${a.texto}${a.monto ? ` — monto ${clp.format(Number(a.monto))}` : ""}${a.plazo ? ` — plazo ${textoFecha(a.plazo)}` : ""}`,
      ),
      true,
    );
    pdf.finalizar();

    const bytes = await pdf.bytes();
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const ruta = `emitidos/ACTA/${anio}/${String(folio).padStart(4, "0")}.pdf`;
    const nombre = `acta-${acta.anio}-${acta.numero}-${folioTexto}.pdf`;

    const { error: subidaError } = await subirArchivo("documentos", ruta, bytes, "application/pdf");
    if (subidaError) return json({ error: subidaError }, 500);

    const { data: doc, error: registroError } = await rpc(
      "documentos",
      "registrar_emision",
      {
        p_tipo: "ACTA",
        p_persona_id: null,
        p_referencia: `ACTA:${acta.id}`,
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
      await actualizar("secretaria", "acta", `id=eq.${acta.id}`, { archivo_id: documento.pdf_archivo_id }, { authorization: "", servicio: true });
    }

    return json({
      documento_id: documento?.id ?? null,
      tipo: "ACTA",
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
