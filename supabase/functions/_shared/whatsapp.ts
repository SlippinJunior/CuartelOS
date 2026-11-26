/**
 * Adaptador oficial de WhatsApp Cloud API (Meta Graph API v21.0).
 *
 * Envía mensajes 1-a-1 usando plantillas preaprobadas (`type: "template"`),
 * exigidas por Meta fuera de la ventana de 24 horas.
 * Si no hay credenciales, no falla: reporta `no_configurado` por destinatario.
 */

const API = "https://graph.facebook.com/v21.0";
const LOTE_CONCURRENCIA = 8;

export interface DestinatarioWhatsApp {
  persona_id?: string | null;
  nombre: string;
  telefono: string | null;
}

export interface OpcionesPlantillaWhatsApp {
  plantilla: string;
  idioma?: string;
  parametrosBody: string[];
  botonUrlParam?: string;
}

export interface DetalleEnvioWhatsApp {
  persona_id: string | null;
  nombre: string;
  telefono: string | null;
  estado: "enviado" | "fallido" | "omitido" | "no_configurado";
  proveedor_id: string | null;
  error: string | null;
}

export interface ResultadoWhatsApp {
  configurado: boolean;
  plantilla: string;
  enviados: number;
  fallidos: number;
  omitidos: number;
  total: number;
  error: string | null;
  detalles: DetalleEnvioWhatsApp[];
  enlaces: Array<{ nombre: string; telefono: string | null; enlace: string | null }>;
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

function enlacesWhatsApp(destinatarios: DestinatarioWhatsApp[], mensaje: string) {
  return destinatarios.map((d) => {
    const telefono = normalizarTelefonoChile(d.telefono);
    return {
      nombre: d.nombre,
      telefono,
      enlace: telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` : null,
    };
  });
}

function limpiarParametro(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, 1024) || "-";
}

async function enviarTemplateUno(
  telefono: string,
  opciones: OpcionesPlantillaWhatsApp,
  token: string,
  phoneId: string,
): Promise<{ ok: true; wamid: string | null } | { ok: false; error: string }> {
  const components: Array<Record<string, unknown>> = [
    {
      type: "body",
      parameters: opciones.parametrosBody.map((p) => ({
        type: "text",
        text: limpiarParametro(p),
      })),
    },
  ];

  if (opciones.botonUrlParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: opciones.botonUrlParam.slice(0, 512) }],
    });
  }

  const resp = await fetch(`${API}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telefono,
      type: "template",
      template: {
        name: opciones.plantilla,
        language: { code: opciones.idioma ?? (Deno.env.get("WHATSAPP_LANG") || "es_CL") },
        components,
      },
    }),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    return { ok: false, error: data?.error?.message ?? `Meta WhatsApp HTTP ${resp.status}` };
  }
  const wamid = Array.isArray(data?.messages) ? (data.messages[0]?.id ?? null) : null;
  return { ok: true, wamid };
}

export async function enviarPlantillaWhatsApp(
  destinatarios: DestinatarioWhatsApp[],
  opciones: OpcionesPlantillaWhatsApp,
  textoResumen = "",
): Promise<ResultadoWhatsApp> {
  const token = Deno.env.get("WHATSAPP_TOKEN") ?? "";
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
  const mensaje = textoResumen || opciones.parametrosBody.join(" · ");
  const enlaces = enlacesWhatsApp(destinatarios, mensaje);

  if (!token || !phoneId) {
    const detalles: DetalleEnvioWhatsApp[] = destinatarios.map((d) => {
      const tel = normalizarTelefonoChile(d.telefono);
      return {
        persona_id: d.persona_id ?? null,
        nombre: d.nombre,
        telefono: tel,
        estado: tel ? "no_configurado" : "omitido",
        proveedor_id: null,
        error: tel ? "Meta WhatsApp Cloud API no configurado." : "Sin teléfono válido",
      };
    });
    return {
      configurado: false,
      plantilla: opciones.plantilla,
      enviados: 0,
      fallidos: 0,
      omitidos: detalles.filter((d) => d.estado === "omitido").length,
      total: destinatarios.length,
      error: "Meta WhatsApp Cloud API no configurado (define WHATSAPP_TOKEN y WHATSAPP_PHONE_ID).",
      detalles,
      enlaces,
      texto_grupo: mensaje,
    };
  }

  const detalles: DetalleEnvioWhatsApp[] = [];
  for (let i = 0; i < destinatarios.length; i += LOTE_CONCURRENCIA) {
    const lote = destinatarios.slice(i, i + LOTE_CONCURRENCIA);
    const resultados = await Promise.all(
      lote.map(async (d): Promise<DetalleEnvioWhatsApp> => {
        const tel = normalizarTelefonoChile(d.telefono);
        if (!tel) {
          return {
            persona_id: d.persona_id ?? null,
            nombre: d.nombre,
            telefono: null,
            estado: "omitido",
            proveedor_id: null,
            error: "Sin teléfono móvil chileno válido",
          };
        }
        try {
          const r = await enviarTemplateUno(tel, opciones, token, phoneId);
          if (r.ok) {
            return {
              persona_id: d.persona_id ?? null,
              nombre: d.nombre,
              telefono: tel,
              estado: "enviado",
              proveedor_id: r.wamid,
              error: null,
            };
          }
          return {
            persona_id: d.persona_id ?? null,
            nombre: d.nombre,
            telefono: tel,
            estado: "fallido",
            proveedor_id: null,
            error: r.error,
          };
        } catch (e) {
          return {
            persona_id: d.persona_id ?? null,
            nombre: d.nombre,
            telefono: tel,
            estado: "fallido",
            proveedor_id: null,
            error: e instanceof Error ? e.message : String(e),
          };
        }
      }),
    );
    detalles.push(...resultados);
  }

  const enviados = detalles.filter((d) => d.estado === "enviado").length;
  const fallidos = detalles.filter((d) => d.estado === "fallido").length;
  const omitidos = detalles.filter((d) => d.estado === "omitido").length;
  const primerError = detalles.find((d) => d.estado === "fallido")?.error ?? null;

  return {
    configurado: true,
    plantilla: opciones.plantilla,
    enviados,
    fallidos,
    omitidos,
    total: destinatarios.length,
    error: fallidos > 0 ? primerError ?? `${fallidos} envíos fallaron.` : null,
    detalles,
    enlaces,
    texto_grupo: mensaje,
  };
}

/** Wrapper retrocompatible para llamadas simples basadas en título + líneas. */
export async function enviarWhatsApp(
  destinatarios: DestinatarioWhatsApp[],
  titulo: string,
  lineas: string[],
): Promise<ResultadoWhatsApp> {
  const plantilla = Deno.env.get("WHATSAPP_TEMPLATE_GUARDIA") || "guardia_aviso";
  return enviarPlantillaWhatsApp(
    destinatarios,
    {
      plantilla,
      parametrosBody: [titulo, lineas.join(" · ")],
    },
    textoParaGrupo(titulo, lineas),
  );
}
