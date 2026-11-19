/**
 * Adaptador de WhatsApp Cloud API (Meta).
 *
 * Si no hay credenciales, no falla: devuelve enlaces wa.me y un texto listo
 * para copiar al grupo de WhatsApp de la compañía.
 */

const API = "https://graph.facebook.com/v21.0";

export interface EnlaceWhatsApp {
  nombre: string;
  telefono: string | null;
  enlace: string | null;
}

export interface ResultadoWhatsApp {
  configurado: boolean;
  enviados: number;
  total: number;
  error: string | null;
  enlaces: EnlaceWhatsApp[];
  texto_grupo: string;
}

/** Normaliza un teléfono chileno a 569XXXXXXXX. */
export function normalizarTelefonoChile(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  if (digitos.startsWith("56")) digitos = digitos.slice(2);
  if (digitos.startsWith("9") && digitos.length === 9) return `56${digitos}`;
  if (digitos.length === 8) return `569${digitos}`;
  return digitos.length >= 10 ? digitos : null;
}

export function textoParaGrupo(titulo: string, lineas: string[]): string {
  return [titulo, "", ...lineas.map((l) => `• ${l}`), "", "Segunda Compañía · Cuerpo de Bomberos de Limache"].join("\n");
}

export function enlacesWhatsApp(
  destinatarios: Array<{ nombre: string; telefono: string | null }>,
  mensaje: string,
): EnlaceWhatsApp[] {
  return destinatarios.map((d) => {
    const telefono = normalizarTelefonoChile(d.telefono);
    return {
      nombre: d.nombre,
      telefono,
      enlace: telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` : null,
    };
  });
}

async function enviarTexto(destinatario: string, mensaje: string, token: string, phoneId: string) {
  const resp = await fetch(`${API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destinatario,
      type: "text",
      text: { body: mensaje.slice(0, 4096) },
    }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.error?.message ?? `WhatsApp ${resp.status}`);
  }
}

export async function enviarWhatsApp(
  destinatarios: Array<{ nombre: string; telefono: string | null }>,
  titulo: string,
  lineas: string[],
): Promise<ResultadoWhatsApp> {
  const token = Deno.env.get("WHATSAPP_TOKEN") ?? "";
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
  const mensaje = textoParaGrupo(titulo, lineas);
  const enlaces = enlacesWhatsApp(destinatarios, mensaje);

  if (!token || !phoneId) {
    return {
      configurado: false,
      enviados: 0,
      total: destinatarios.length,
      error: null,
      enlaces,
      texto_grupo: mensaje,
    };
  }

  let enviados = 0;
  let ultimoError: string | null = null;
  for (const d of destinatarios) {
    const telefono = normalizarTelefonoChile(d.telefono);
    if (!telefono) continue;
    try {
      await enviarTexto(telefono, mensaje, token, phoneId);
      enviados++;
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
    }
  }

  return {
    configurado: true,
    enviados,
    total: destinatarios.length,
    error: enviados === destinatarios.length ? null : ultimoError ?? "Algunos mensajes no se enviaron.",
    enlaces,
    texto_grupo: mensaje,
  };
}
