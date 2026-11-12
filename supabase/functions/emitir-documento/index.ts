import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import qrcode from "https://esm.sh/qrcode-generator@1.4.4";
import { corsHeaders, json } from "../_shared/cors.ts";
import { autenticar, clienteAdmin } from "../_shared/clientes.ts";

const ROJO = rgb(0.608, 0.11, 0.11);
const GRIS = rgb(0.48, 0.42, 0.38);
const NEGRO = rgb(0.17, 0.145, 0.13);
const CREMA = rgb(0.98, 0.97, 0.95);
const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 48;

function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "-";
  if (Array.isArray(valor)) return valor.join(", ");
  return String(valor);
}

function fecha(valor: unknown): string {
  const s = aTexto(valor);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { cliente, user, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError?.message }, 401);

    const { data: perfil } = await cliente.schema("nucleo").rpc("mi_perfil");
    if (!(perfil as { es_oficial?: boolean } | null)?.es_oficial) {
      return json({ error: "Solo la oficialidad puede emitir documentos." }, 403);
    }

    const body = await req.json();
    const tipo = body.tipo ?? "P3";
    const personaId = body.persona_id;
    if (!personaId) return json({ error: "Falta persona_id." }, 400);
    if (tipo !== "P3") return json({ error: "Por ahora solo se emite P3 (hoja de vida)." }, 400);

    const admin = clienteAdmin();
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    const { data: hv, error: hvError } = await admin
      .schema("personal")
      .from("v_hoja_vida")
      .select("datos")
      .eq("persona_id", personaId)
      .single();
    if (hvError || !hv) return json({ error: "No se encontró la hoja de vida." }, 404);
    const d = (hv as { datos: Record<string, any> }).datos;

    const { data: folioData, error: folioError } = await admin
      .schema("documentos")
      .rpc("siguiente_folio", { p_tipo: tipo });
    if (folioError) return json({ error: folioError.message }, 400);
    const folio = Number(folioData);
    const anio = new Date().getFullYear();
    const folioTexto = `${anio}-${String(folio).padStart(4, "0")}`;
    const token = crypto.randomUUID().replaceAll("-", "");
    const urlVerificacion = `${siteUrl}/verificar/${token}`;

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([ANCHO, ALTO]);
    let y = 770;

    const nuevaPagina = (minimo = 120) => {
      if (y < minimo) {
        page = pdf.addPage([ANCHO, ALTO]);
        y = 790;
      }
    };

    const texto = (t: string, x: number, yy: number, size = 10, font = normal, color = NEGRO) => {
      page.drawText(t, { x, y: yy, size, font, color });
    };

    const ajustar = (t: string, size: number, font = normal, max = ANCHO - MARGEN * 2): string[] => {
      const palabras = t.split(/\s+/);
      const lineas: string[] = [];
      let actual = "";
      for (const palabra of palabras) {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (font.widthOfTextAtSize(prueba, size) > max && actual) {
          lineas.push(actual);
          actual = palabra;
        } else {
          actual = prueba;
        }
      }
      if (actual) lineas.push(actual);
      return lineas;
    };

    const parrafo = (t: string, size = 10, color = NEGRO, x = MARGEN) => {
      for (const linea of ajustar(t, size, normal, ANCHO - MARGEN * 2)) {
        nuevaPagina();
        texto(linea, x, y, size, normal, color);
        y -= size + 3;
      }
    };

    const seccion = (titulo: string) => {
      nuevaPagina(140);
      y -= 8;
      texto(titulo.toUpperCase(), MARGEN, y, 9.5, negrita, ROJO);
      y -= 5;
      page.drawLine({
        start: { x: MARGEN, y },
        end: { x: ANCHO - MARGEN, y },
        thickness: 0.6,
        color: ROJO,
      });
      y -= 14;
    };

    const campo = (etiqueta: string, valor: unknown, x: number, yy: number, ancho = 110) => {
      texto(etiqueta, x, yy, 7.5, normal, GRIS);
      const lineas = ajustar(aTexto(valor), 9.5, normal, ancho);
      texto(lineas[0] ?? "-", x, yy - 11, 9.5, negrita, NEGRO);
      return lineas.length;
    };

    // Encabezado institucional
    page.drawRectangle({ x: 0, y: 792, width: ANCHO, height: 50, color: ROJO });
    texto("CUERPO DE BOMBEROS DE LIMACHE", MARGEN, 823, 8.5, normal, rgb(1, 1, 1));
    texto("SEGUNDA COMPAÑÍA", MARGEN, 806, 15, negrita, rgb(1, 1, 1));
    texto("ATENCIÓN · SACRIFICIO · LEALTAD", MARGEN, 797, 6.5, normal, rgb(1, 0.95, 0.92));
    texto("FOLIO", ANCHO - MARGEN - 70, 823, 7.5, normal, rgb(1, 0.9, 0.88));
    texto(folioTexto, ANCHO - MARGEN - 70, 806, 13, negrita, rgb(1, 1, 1));

    y = 755;
    texto("HOJA DE VIDA DEL BOMBERO", MARGEN, y, 15, negrita, NEGRO);
    y -= 8;
    page.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 1.4, color: ROJO });
    y -= 22;

    // Ficha
    page.drawRectangle({ x: MARGEN, y: y - 92, width: ANCHO - MARGEN * 2, height: 98, color: CREMA });
    const c1 = MARGEN + 12;
    const c2 = MARGEN + 190;
    const c3 = MARGEN + 360;
    let fy = y - 14;
    campo("Nombre", d.nombre, c1, fy, 320);
    fy -= 22;
    campo("Registro", d.registro, c1, fy, 80);
    campo("RUT", d.rut, c2, fy, 120);
    campo("Rango", d.rango, c3, fy, 120);
    fy -= 22;
    campo("Estado", d.estado, c1, fy, 90);
    campo("Ingreso", fecha(d.fecha_ingreso), c2, fy, 100);
    campo("Antigüedad", d.antiguedad === null ? "-" : `${d.antiguedad} años`, c3, fy, 100);
    fy -= 22;
    campo("Cargo actual", d.cargo_actual, c1, fy, 290);
    campo("Nivel ANB", d.nivel_anb, c3, fy, 120);
    y -= 112;

    // Asistencia
    seccion(`Asistencia ${aTexto(d.asistencia?.periodo)}`);
    const cajas = [
      ["Asistencias", d.asistencia?.a ?? 0],
      ["Faltas", d.asistencia?.f ?? 0],
      ["Permisos", d.asistencia?.p ?? 0],
      ["Porcentaje", `${d.asistencia?.pct ?? 0}%`],
    ];
    const anchoCaja = (ANCHO - MARGEN * 2 - 18) / 4;
    cajas.forEach(([etiqueta, valor], i) => {
      const x = MARGEN + i * (anchoCaja + 6);
      page.drawRectangle({ x, y: y - 34, width: anchoCaja, height: 38, borderColor: rgb(0.85, 0.8, 0.75), borderWidth: 0.5, color: rgb(1, 1, 1) });
      texto(String(valor), x + anchoCaja / 2 - 8, y - 14, 14, negrita, NEGRO);
      texto(String(etiqueta), x + anchoCaja / 2 - normal.widthOfTextAtSize(String(etiqueta), 7) / 2, y - 27, 7, normal, GRIS);
    });
    y -= 52;

    // Cargos
    seccion("Cargos y nombramientos");
    const cargos = (d.cargos ?? []) as Array<Record<string, unknown>>;
    if (cargos.length === 0) parrafo("Sin registro.", 9.5, GRIS);
    for (const c of cargos) {
      nuevaPagina(120);
      texto(aTexto(c.cargo), MARGEN, y, 9.5, negrita);
      texto(`${fecha(c.desde)} a ${c.hasta ? fecha(c.hasta) : "vigente"}`, MARGEN + 260, y, 9, normal, GRIS);
      y -= 15;
    }

    // Formación
    seccion("Formación (ANB y otros cursos)");
    const cursos = (d.cursos ?? []) as Array<Record<string, unknown>>;
    if (cursos.length === 0) parrafo("Sin registro.", 9.5, GRIS);
    for (const c of cursos) {
      nuevaPagina(120);
      texto(aTexto(c.nombre), MARGEN, y, 9.5, normal);
      texto(`${aTexto(c.nivel)} · ${fecha(c.fecha)}`, ANCHO - MARGEN - 130, y, 8.5, normal, GRIS);
      y -= 15;
    }

    // Premios
    seccion("Premios y distinciones");
    const premios = (d.premios ?? []) as Array<Record<string, unknown>>;
    if (premios.length === 0) parrafo("Sin registro.", 9.5, GRIS);
    for (const p of premios) {
      nuevaPagina(120);
      texto(aTexto(p.tipo), MARGEN, y, 9.5, normal);
      texto(`${p.anios ? `${p.anios} años` : "-"} · ${fecha(p.fecha)}`, ANCHO - MARGEN - 130, y, 8.5, normal, GRIS);
      y -= 15;
    }

    // Material
    seccion("Material a cargo");
    const material = (d.material ?? []) as Array<Record<string, unknown>>;
    if (material.length === 0) parrafo("Sin registro.", 9.5, GRIS);
    for (const m of material) {
      nuevaPagina(120);
      texto(aTexto(m.articulo), MARGEN, y, 9.5, normal);
      texto(`${aTexto(m.cantidad)} un. · ${aTexto(m.origen)}`, ANCHO - MARGEN - 150, y, 8.5, normal, GRIS);
      y -= 15;
    }

    // Cuotas y campaña
    seccion(`Cuotas sociales ${aTexto(d.cuotas?.periodo)}`);
    parrafo(`Pagadas: ${aTexto(d.cuotas?.pagadas)}. Pendientes: ${aTexto(d.cuotas?.pendientes)}.`, 9.5);
    if (d.campana) {
      y -= 4;
      parrafo(
        `Campaña ${aTexto(d.campana.anio)}: venta total ${aTexto(d.campana.venta)}, aporte adicional ${aTexto(d.campana.adicional)}, saldo a favor ${aTexto(d.campana.saldo)}.`,
        9.5,
      );
      if (d.campana.obs) parrafo(`Observación: ${aTexto(d.campana.obs)}`, 9, GRIS);
    }

    // Pie de página y QR en la última página
    const paginas = pdf.getPages();
    paginas.forEach((p, i) => {
      p.drawLine({
        start: { x: MARGEN, y: 62 },
        end: { x: ANCHO - MARGEN, y: 62 },
        thickness: 0.4,
        color: GRIS,
      });
      p.drawText(
        `Documento emitido por el sistema de gestión de la Segunda Compañía. Folio ${folioTexto}.`,
        { x: MARGEN, y: 50, size: 7, font: normal, color: GRIS },
      );
      p.drawText(`Verifique en ${urlVerificacion}`, { x: MARGEN, y: 40, size: 6.5, font: normal, color: GRIS });
      p.drawText(`Página ${i + 1} de ${paginas.length}`, {
        x: ANCHO - MARGEN - 60,
        y: 40,
        size: 7,
        font: normal,
        color: GRIS,
      });
    });

    const ultima = paginas[paginas.length - 1];
    const qr = qrcode(0, "M");
    qr.addData(urlVerificacion);
    qr.make();
    const modulos = qr.getModuleCount();
    const tam = 62;
    const qx = ANCHO - MARGEN - tam;
    const qy = 70;
    ultima.drawRectangle({ x: qx - 4, y: qy - 4, width: tam + 8, height: tam + 8, color: rgb(1, 1, 1) });
    for (let fila = 0; fila < modulos; fila++) {
      for (let col = 0; col < modulos; col++) {
        if (qr.isDark(fila, col)) {
          ultima.drawRectangle({
            x: qx + (col * tam) / modulos,
            y: qy + tam - ((fila + 1) * tam) / modulos,
            width: tam / modulos,
            height: tam / modulos,
            color: NEGRO,
          });
        }
      }
    }

    const bytes = new Uint8Array(await pdf.save());
    const hash = hex(await crypto.subtle.digest("SHA-256", bytes));
    const ruta = `emitidos/${tipo}/${anio}/${String(folio).padStart(4, "0")}.pdf`;
    const nombre = `hoja-de-vida-${d.registro}-${folioTexto}.pdf`;

    const { error: subidaError } = await admin.storage
      .from("documentos")
      .upload(ruta, bytes, { contentType: "application/pdf", upsert: true });
    if (subidaError) return json({ error: `No se pudo subir el PDF: ${subidaError.message}` }, 500);

    const { data: doc, error: registroError } = await admin.schema("documentos").rpc("registrar_emision", {
      p_tipo: tipo,
      p_persona_id: personaId,
      p_referencia: `P3:${personaId}`,
      p_hash: hash,
      p_pdf_bucket: "documentos",
      p_pdf_path: ruta,
      p_nombre_archivo: nombre,
      p_mime: "application/pdf",
      p_tamano: bytes.length,
      p_folio: folio,
      p_token: token,
      p_emitido_por: user.id,
    });
    if (registroError) return json({ error: registroError.message }, 500);

    const { data: firmada } = await admin.storage.from("documentos").createSignedUrl(ruta, 3600);

    return json({
      documento_id: (doc as { id?: string } | null)?.id ?? null,
      tipo,
      anio,
      folio,
      token,
      hash_sha256: hash,
      url: firmada?.signedUrl ?? null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
