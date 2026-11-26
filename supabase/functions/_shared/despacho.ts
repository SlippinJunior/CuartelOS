import { insertar } from "./clientes.ts";
import type { ResultadoCorreoDetallado } from "./correo.ts";
import type { ResultadoWhatsApp } from "./whatsapp.ts";

export function resumirDespacho(
  correo: { enviados: number; total: number; error: string | null } | null,
  whatsapp: ResultadoWhatsApp | null,
): string {
  const partes = ["Portal"];
  if (correo) {
    partes.push(`Correo ${correo.enviados}/${correo.total}`);
  }
  if (whatsapp) {
    partes.push(
      whatsapp.configurado
        ? `WhatsApp ${whatsapp.enviados}/${whatsapp.total}`
        : "WhatsApp pendiente config.",
    );
  }
  return partes.join(" · ");
}

export async function registrarDespacho(opciones: {
  origen_tipo: string;
  origen_id: number;
  titulo: string;
  resumen: string;
  url_portal: string;
  creado_por: string | null;
  correo: ResultadoCorreoDetallado | null;
  whatsapp: ResultadoWhatsApp | null;
}): Promise<number | null> {
  const { data: creado } = await insertar(
    "nucleo",
    "despacho",
    {
      origen_tipo: opciones.origen_tipo,
      origen_id: opciones.origen_id,
      titulo: opciones.titulo,
      resumen: opciones.resumen,
      url_portal: opciones.url_portal,
      correo_enviados: opciones.correo?.enviados ?? 0,
      correo_total: opciones.correo?.total ?? 0,
      correo_error: opciones.correo?.error ?? null,
      whatsapp_enviados: opciones.whatsapp?.enviados ?? 0,
      whatsapp_total: opciones.whatsapp?.total ?? 0,
      whatsapp_error: opciones.whatsapp?.error ?? null,
      whatsapp_plantilla: opciones.whatsapp?.plantilla ?? null,
      creado_por: opciones.creado_por,
    },
    { authorization: "", servicio: true },
  );

  const row = (Array.isArray(creado) ? creado[0] : creado) as { id?: number } | null;
  const despachoId = row?.id ?? null;
  if (!despachoId) return null;

  const filasDetalle: Array<Record<string, unknown>> = [];
  for (const d of opciones.correo?.detalles ?? []) {
    filasDetalle.push({
      despacho_id: despachoId,
      persona_id: d.persona_id,
      nombre: d.nombre,
      canal: "correo",
      destino: d.email,
      estado: d.estado,
      proveedor_id: d.proveedor_id,
      error: d.error,
    });
  }
  for (const d of opciones.whatsapp?.detalles ?? []) {
    filasDetalle.push({
      despacho_id: despachoId,
      persona_id: d.persona_id,
      nombre: d.nombre,
      canal: "whatsapp",
      destino: d.telefono,
      estado: d.estado,
      proveedor_id: d.proveedor_id,
      error: d.error,
    });
  }

  for (const fila of filasDetalle) {
    await insertar("nucleo", "despacho_detalle", fila, { authorization: "", servicio: true });
  }

  return despachoId;
}
