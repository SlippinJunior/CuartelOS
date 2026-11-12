/**
 * Envío de correo sin dependencias: Resend por HTTP o SMTP directo.
 * En local, apunta al Mailpit de Supabase (SMTP_HOST=inbucket, SMTP_PORT=1025).
 */

const CORREO_FROM = Deno.env.get("SMTP_FROM") ?? "Segunda Compania <no-reply@segundacompania.local>";

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

async function enviarResend(destinatario: string, asunto: string, texto: string, apiKey: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: CORREO_FROM, to: [destinatario], subject: asunto, text: texto }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.message ?? `Resend ${resp.status}`);
  }
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

export async function enviarCorreos(
  destinatarios: string[],
  asunto: string,
  texto: string,
): Promise<{ enviados: number; total: number; error: string | null }> {
  const unicos = Array.from(new Set(destinatarios.map((d) => d.trim()).filter(Boolean)));
  if (unicos.length === 0) return { enviados: 0, total: 0, error: "No hay destinatarios con correo." };

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const smtpHost = Deno.env.get("SMTP_HOST") ?? "";

  if (!resendKey && !smtpHost) {
    return {
      enviados: 0,
      total: unicos.length,
      error: "Correo no configurado: define RESEND_API_KEY o SMTP_HOST.",
    };
  }

  let enviados = 0;
  let ultimoError: string | null = null;

  for (const destinatario of unicos) {
    try {
      if (resendKey) await enviarResend(destinatario, asunto, texto, resendKey);
      else await enviarSmtp(destinatario, asunto, texto);
      enviados++;
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    enviados,
    total: unicos.length,
    error: enviados === unicos.length ? null : ultimoError ?? "Algunos correos no se enviaron.",
  };
}
