import { DocumentoPdf, textoFecha } from "../_shared/pdf-simple.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { autenticar, insertar, rpc, seleccionar, subirArchivo } from "../_shared/clientes.ts";

const REQUISITOS: Array<[string, string]> = [
  ["mayor_18", "Mayor de 18 años"],
  ["ensenanza_media", "Enseñanza media completa"],
  ["declaracion_jurada", "Declaración jurada"],
  ["cert_nacimiento", "Certificado de nacimiento"],
  ["cert_antecedentes", "Certificado de antecedentes"],
  ["salud_fisica", "Salud física compatible"],
  ["salud_mental", "Salud mental compatible"],
  ["cert_estudios", "Certificado de estudios"],
];

/**
 * Emite los documentos de Secretaría:
 *  - P1: expediente de postulación
 *  - P2: acta de votación de ingreso (solo aceptada/rechazada, sin votos)
 *  - P4: comunicación de altas y bajas
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    const roles = (perfil as { roles?: string[] } | null)?.roles ?? [];
    if (!roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r))) {
      return json({ error: "Solo Secretaría o Director pueden emitir estos documentos." }, 403);
    }

    const body = await req.json();
    const tipo = String(body.tipo ?? "");
    if (!["P1", "P2", "P4"].includes(tipo)) return json({ error: "Tipo no soportado." }, 400);

    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const titulos: Record<string, string> = {
      P1: "EXPEDIENTE DE POSTULACIÓN",
      P2: "ACTA DE VOTACIÓN DE INGRESO",
      P4: "COMUNICACIÓN DE ALTAS Y BAJAS",
    };

    const { data: folioData, error: folioError } = await rpc(
      "documentos",
      "siguiente_folio",
      { p_tipo: tipo },
      { authorization: "", servicio: true },
    );
    if (folioError) return json({ error: folioError }, 400);
    const folio = Number(folioData);
    const anio = new Date().getFullYear();
    const folioTexto = `${anio}-${String(folio).padStart(4, "0")}`;
    const token = crypto.randomUUID().replaceAll("-", "");
    const urlVerificacion = `${siteUrl}/verificar/${token}`;

    let referencia = `${tipo}:${Date.now()}`;
    let personaId: string | null = null;
    const pdf = await DocumentoPdf.crear(titulos[tipo], "", folioTexto, urlVerificacion);

    if (tipo === "P1" || tipo === "P2") {
      const postulacionId = Number(body.postulacion_id);
      if (!postulacionId) return json({ error: "Falta postulacion_id." }, 400);

      const { data: filas } = await seleccionar(
        "personal",
        "postulacion",
        `select=*&id=eq.${postulacionId}&limit=1`,
        { authorization: "", servicio: true },
      );
      const p = ((filas ?? []) as Array<Record<string, any>>)[0];
      if (!p) return json({ error: "La postulación no existe." }, 404);

      const nombre = `${p.nombres} ${p.apellido_paterno}${p.apellido_materno ? ` ${p.apellido_materno}` : ""}`;
      referencia = `${tipo}:POSTULACION:${postulacionId}`;

      const patrocinantes: string[] = [];
      for (const campo of ["patrocinante_1_id", "patrocinante_2_id"]) {
        const id = p[campo];
        if (!id) continue;
        const { data: pat } = await seleccionar(
          "personal",
          "persona",
          `select=registro,nombres,apellido_paterno&id=eq.${id}`,
          { authorization: "", servicio: true },
        );
        const fila = ((pat ?? []) as Array<Record<string, any>>)[0];
        if (fila) patrocinantes.push(`${fila.nombres} ${fila.apellido_paterno} (Reg. ${fila.registro})`);
      }

      if (tipo === "P1") {
        pdf.caja([
          ["Postulante", nombre],
          ["RUT", p.rut ?? "-"],
          ["Nacimiento", textoFecha(p.fecha_nacimiento)],
          ["Domicilio", p.direccion ?? "-"],
          ["Fecha de solicitud", textoFecha(p.fecha_solicitud)],
          ["Estado", String(p.estado ?? "")],
        ]);
        pdf.seccion("Patrocinantes (art. 7)");
        pdf.lista(patrocinantes.length ? patrocinantes : ["Sin patrocinantes registrados."]);
        pdf.seccion("Requisitos (art. 7)");
        const requisitos = (p.requisitos ?? {}) as Record<string, boolean>;
        pdf.lista(
          REQUISITOS.map(([clave, etiqueta]) => `${requisitos[clave] ? "Cumple" : "Pendiente"} · ${etiqueta}`),
        );
        if (p.observaciones) {
          pdf.seccion("Observaciones");
          pdf.parrafo(p.observaciones);
        }
      } else {
        pdf.caja([
          ["Postulante", nombre],
          ["RUT", p.rut ?? "-"],
          ["Resultado", p.resultado_votacion ?? "sin registrar"],
          ["Fecha de votación", textoFecha(p.fecha_votacion)],
          ["Acta de respaldo", p.acta_votacion_id ? `N° ${p.acta_votacion_id}` : "sin acta adjunta"],
        ]);
        pdf.seccion("Resultado de la votación");
        if (p.resultado_votacion === "aceptada") {
          pdf.parrafo(
            "La Junta de Oficiales aprobó el ingreso del postulante. Conforme al art. 7 del Reglamento, esta acta deja constancia únicamente del resultado, sin el número de votos.",
          );
          pdf.parrafo(
            `El postulante inicia su período de bombero inicial con plazo hasta ${textoFecha(p.plazo_bombero_inicial)}.`,
          );
        } else if (p.resultado_votacion === "rechazada") {
          pdf.parrafo(
            "La Junta de Oficiales rechazó el ingreso del postulante. Conforme al art. 7 del Reglamento, esta acta deja constancia únicamente del resultado, sin el número de votos.",
          );
          pdf.parrafo(`Podrá volver a postular desde el ${textoFecha(p.puede_repostular_desde)}.`);
        } else {
          pdf.parrafo("El resultado de la votación aún no está registrado.");
        }
      }
      personaId = null;
    } else {
      // P4: comunicación de altas y bajas
      const eventos: Array<Record<string, any>> = [];

      if (Array.isArray(body.evento_ids) && body.evento_ids.length > 0) {
        const ids = body.evento_ids.map((n: unknown) => Number(n)).join(",");
        const { data } = await seleccionar(
          "personal",
          "persona_evento",
          `select=*,persona:persona(registro,nombres,apellido_paterno)&id=in.(${ids})`,
          { authorization: "", servicio: true },
        );
        eventos.push(...((data ?? []) as Array<Record<string, any>>));
      } else if (body.desde && body.hasta) {
        const { data } = await seleccionar(
          "personal",
          "persona_evento",
          `select=*,persona:persona(registro,nombres,apellido_paterno)&tipo=in.(alta,cambio_estado,reincorporacion,traslado)&fecha=gte.${body.desde}&fecha=lte.${body.hasta}&order=fecha`,
          { authorization: "", servicio: true },
        );
        eventos.push(...((data ?? []) as Array<Record<string, any>>));
      }

      if (eventos.length === 0) return json({ error: "No hay eventos para comunicar." }, 400);

      referencia = `P4:EVENTO:${eventos.map((e) => e.id).join(",")}`;

      pdf.caja([
        ["Destinatarios", "Secretaría General y Comandancia"],
        ["Base reglamentaria", "Art. 51 i - plazo de 3 días"],
        ["Eventos", String(eventos.length)],
      ]);
      pdf.seccion("Movimientos de personal");
      pdf.lista(
        eventos.map(
          (e) =>
            `Reg. ${e.persona?.registro ?? "-"} · ${e.persona?.nombres ?? ""} ${e.persona?.apellido_paterno ?? ""} · ${String(e.tipo).replace("_", " ")} · ${textoFecha(e.fecha)}${e.motivo ? ` · ${e.motivo}` : ""}`,
        ),
        true,
      );
    }

    pdf.seccion("Firmas");
    pdf.parrafo("Secretario(a) de Compañía y Director(a) de Compañía.");
    pdf.finalizar();

    const bytes = await pdf.bytes();
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const ruta = `emitidos/${tipo}/${anio}/${String(folio).padStart(4, "0")}.pdf`;

    const { error: subidaError } = await subirArchivo("documentos", ruta, bytes, "application/pdf");
    if (subidaError) return json({ error: subidaError }, 500);

    const { data: doc, error: registroError } = await rpc(
      "documentos",
      "registrar_emision",
      {
        p_tipo: tipo,
        p_persona_id: personaId,
        p_referencia: referencia,
        p_hash: hash,
        p_pdf_bucket: "documentos",
        p_pdf_path: ruta,
        p_nombre_archivo: `${tipo.toLowerCase()}-${folioTexto}.pdf`,
        p_mime: "application/pdf",
        p_tamano: bytes.length,
        p_folio: folio,
        p_token: token,
        p_emitido_por: user.id,
      },
      { authorization: "", servicio: true },
    );
    if (registroError) return json({ error: registroError }, 500);

    void insertar;

    return json({
      documento_id: (doc as { id?: string } | null)?.id ?? null,
      tipo,
      anio,
      folio,
      token,
      hash_sha256: hash,
      pdf_bucket: "documentos",
      pdf_path: ruta,
      url_verificacion: urlVerificacion,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
