/**
 * Envío de correo sin dependencias: Resend por HTTP o SMTP directo.
 * En local, apunta al Mailpit de Supabase (SMTP_HOST=inbucket, SMTP_PORT=1025).
 */

const CORREO_FROM = Deno.env.get("SMTP_FROM") ?? "Segunda Compania <no-reply@segundacompania.local>";

export interface DestinatarioCorreo {
  persona_id?: string | null;
  nombre?: string;
  email: string | null;
}

export interface DetalleEnvioCorreo {
  persona_id: string | null;
  nombre: string | null;
  email: string | null;
  estado: "enviado" | "fallido" | "omitido" | "no_configurado";
  proveedor_id: string | null;
  error: string | null;
}

export interface ResultadoCorreoDetallado {
  enviados: number;
  fallidos: number;
  omitidos: number;
  total: number;
  error: string | null;
  detalles: DetalleEnvioCorreo[];
}

function correoDe(from: string): string {
  const m = /<([^>]+)>/.exec(from);
  return m ? m[1] : from;
}

function base64Utf8(texto: string, envolver = false): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  const trozo = 8192;
  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  const codificado = btoa(binario);
  return envolver ? codificado.replace(/(.{76})/g, "$1\r\n") : codificado;
}

function escaparHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Construye un correo HTML sobrio institucional para despachos de la Compañía. */
export function construirHtmlComunicado(opciones: {
  categoria: string;
  titulo: string;
  subtitulo?: string;
  cuerpo: string;
  urlPortal: string;
}): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#faf7f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2b2522;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #e7ddd2;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#9b1c1c;color:#fff8f2;padding:18px 24px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Segunda Compañía · Cuerpo de Bomberos de Limache</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;">${escaparHtml(opciones.categoria)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;color:#2b2522;">${escaparHtml(opciones.titulo)}</h1>
        ${opciones.subtitulo ? `<p style="margin:0 0 16px;font-size:14px;color:#5e5047;">${escaparHtml(opciones.subtitulo)}</p>` : ""}
        <div style="font-size:15px;line-height:1.6;white-space:pre-line;background:#faf7f2;border:1px solid #e7ddd2;border-radius:8px;padding:16px;">${escaparHtml(opciones.cuerpo)}</div>
        <p style="margin:22px 0 0;">
          <a href="${escaparHtml(opciones.urlPortal)}" style="display:inline-block;background:#9b1c1c;color:#fff8f2;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">Ver en el Portal de la Compañía</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 24px;border-top:1px solid #e7ddd2;font-size:12px;color:#5e5047;">
        Este aviso fue despachado automáticamente por el ERP de la Segunda Compañía.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function enviarResend(
  destinatario: string,
  asunto: string,
  texto: string,
  apiKey: string,
  html?: string,
): Promise<string | null> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: CORREO_FROM,
      to: [destinatario],
      subject: asunto,
      text: texto,
      ...(html ? { html } : {}),
    }),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.message ?? `Resend ${resp.status}`);
  }
  return data?.id ?? null;
}

async function enviarSmtp(destinatario: string, asunto: string, texto: string) {
  const host = Deno.env.get("SMTP_HOST") ?? "";
  const puerto = Number(Deno.env.get("SMTP_PORT") ?? "1025");
  const seguro = Deno.env.get("SMTP_SECURE") === "true" || puerto === 465;
  const starttls = Deno.env.get("SMTP_STARTTLS") === "true" || puerto === 587;
  const usuario = Deno.env.get("SMTP_USER") ?? "";
  const clave = Deno.env.get("SMTP_PASSWORD") ?? "";

  const conexion = seguro
    ? await Deno.connectTls({ hostname: host, port: puerto })
    : await Deno.connect({ hostname: host, port: puerto });

  let conn: Deno.Conn = conexion;
  let reader = conn.readable.getReader();
  let writer = conn.writable.getWriter();
  let buffer = new Uint8Array(0);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const leerLinea = async (): Promise<string> => {
    while (true) {
      const idx = buffer.indexOf(10);
      if (idx >= 0) {
        const linea = buffer.slice(0, idx + 1);
        buffer = buffer.slice(idx + 1);
        return decoder.decode(linea).replace(/\r?\n$/, "");
      }
      const { value, done } = await reader.read();
      if (done) throw new Error("SMTP cerró la conexión.");
      const nuevo = new Uint8Array(buffer.length + value.length);
      nuevo.set(buffer);
      nuevo.set(value, buffer.length);
      buffer = nuevo;
    }
  };

  const leerRespuesta = async (): Promise<string> => {
    const lineas: string[] = [];
    let linea = await leerLinea();
    lineas.push(linea);
    while (linea.length >= 4 && linea[3] === "-") {
      linea = await leerLinea();
      lineas.push(linea);
    }
    const codigo = Number(linea.slice(0, 3));
    if (codigo >= 400) throw new Error(`SMTP: ${lineas.join(" | ")}`);
    return lineas.join("\n");
  };

  const orden = async (comando: string) => {
    await writer.write(encoder.encode(comando + "\r\n"));
    return leerRespuesta();
  };

  try {
    await leerRespuesta();
    await orden(`EHLO ${host || "localhost"}`);

    if (starttls) {
      await orden("STARTTLS");
      const tls = await Deno.startTls(conn, { hostname: host });
      conn = tls;
      reader = conn.readable.getReader();
      writer = conn.writable.getWriter();
      buffer = new Uint8Array(0);
      await orden(`EHLO ${host || "localhost"}`);
    }

    if (usuario) {
      await orden("AUTH LOGIN");
      await orden(base64Utf8(usuario));
      await orden(base64Utf8(clave));
    }

    await orden(`MAIL FROM:<${correoDe(CORREO_FROM)}>`);
    await orden(`RCPT TO:<${destinatario}>`);
    await orden("DATA");

    const mensaje = [
      `From: ${CORREO_FROM}`,
      `To: ${destinatario}`,
      `Subject: =?UTF-8?B?${base64Utf8(asunto)}?=`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: base64",
      "",
      base64Utf8(texto, true),
      ".",
    ].join("\r\n");

    await writer.write(encoder.encode(mensaje + "\r\n"));
    await leerRespuesta();
    await orden("QUIT");
  } finally {
    try {
      writer.releaseLock();
      conn.close();
    } catch {
      // La conexión ya puede estar cerrada.
    }
  }
}

export async function enviarCorreosDetallado(
  destinatarios: DestinatarioCorreo[],
  asunto: string,
  texto: string,
  html?: string,
): Promise<ResultadoCorreoDetallado> {
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const smtpHost = Deno.env.get("SMTP_HOST") ?? "";

  if (!resendKey && !smtpHost) {
    const detalles: DetalleEnvioCorreo[] = destinatarios.map((d) => ({
      persona_id: d.persona_id ?? null,
      nombre: d.nombre ?? null,
      email: d.email?.trim() || null,
      estado: d.email?.trim() ? "no_configurado" : "omitido",
      proveedor_id: null,
      error: d.email?.trim() ? "Correo no configurado: define RESEND_API_KEY o SMTP_HOST." : "Sin correo",
    }));
    return {
      enviados: 0,
      fallidos: 0,
      omitidos: detalles.filter((d) => d.estado === "omitido").length,
      total: destinatarios.length,
      error: "Correo no configurado: define RESEND_API_KEY o SMTP_HOST.",
      detalles,
    };
  }

  const detalles: DetalleEnvioCorreo[] = [];
  const vistos = new Set<string>();

  for (const d of destinatarios) {
    const email = d.email?.trim().toLowerCase() ?? "";
    if (!email) {
      detalles.push({
        persona_id: d.persona_id ?? null,
        nombre: d.nombre ?? null,
        email: null,
        estado: "omitido",
        proveedor_id: null,
        error: "Sin correo registrado",
      });
      continue;
    }
    if (vistos.has(email)) continue;
    vistos.add(email);

    try {
      let proveedorId: string | null = null;
      if (resendKey) proveedorId = await enviarResend(email, asunto, texto, resendKey, html);
      else await enviarSmtp(email, asunto, texto);
      detalles.push({
        persona_id: d.persona_id ?? null,
        nombre: d.nombre ?? null,
        email,
        estado: "enviado",
        proveedor_id: proveedorId,
        error: null,
      });
    } catch (e) {
      detalles.push({
        persona_id: d.persona_id ?? null,
        nombre: d.nombre ?? null,
        email,
        estado: "fallido",
        proveedor_id: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const enviados = detalles.filter((d) => d.estado === "enviado").length;
  const fallidos = detalles.filter((d) => d.estado === "fallido").length;
  const omitidos = detalles.filter((d) => d.estado === "omitido").length;
  const primerError = detalles.find((d) => d.estado === "fallido")?.error ?? null;

  return {
    enviados,
    fallidos,
    omitidos,
    total: enviados + fallidos,
    error: fallidos > 0 ? primerError ?? "Algunos correos no se enviaron." : null,
    detalles,
  };
}

export async function enviarCorreos(
  destinatarios: string[],
  asunto: string,
  texto: string,
): Promise<{ enviados: number; total: number; error: string | null }> {
  const unicos = Array.from(new Set(destinatarios.map((d) => d.trim()).filter(Boolean)));
  if (unicos.length === 0) return { enviados: 0, total: 0, error: "No hay destinatarios con correo." };
  const r = await enviarCorreosDetallado(
    unicos.map((email) => ({ email })),
    asunto,
    texto,
  );
  return { enviados: r.enviados, total: r.total, error: r.error };
}
