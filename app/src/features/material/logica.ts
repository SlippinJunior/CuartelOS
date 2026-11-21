import type { AsignacionMaterial, EstadoSolicitud } from "@/types/tipos";

/** Roles que administran el pañol y resuelven solicitudes. */
const ROLES_TENIENTE_2 = ["teniente_2", "admin"];

/** Oficialidad que puede leer el inventario de los bomberos. */
const ROLES_OFICIALES = [
  "director", "secretario", "prosecretario",
  "tesorero", "protesorero", "capitan",
  "teniente_1", "teniente_2", "teniente_3", "ayudante", "admin",
];

export function esTenienteSegundo(roles: readonly string[]): boolean {
  return roles.some((r) => ROLES_TENIENTE_2.includes(r));
}

export function puedeVerInventarioBomberos(roles: readonly string[]): boolean {
  return roles.some((r) => ROLES_OFICIALES.includes(r));
}

export function puedeResolverSolicitud(roles: readonly string[]): boolean {
  return esTenienteSegundo(roles);
}

/** Estados en los que la solicitud todavía admite una decisión. */
export function solicitudAbierta(estado: EstadoSolicitud): boolean {
  return estado === "pendiente" || estado === "aprobada";
}

export function solicitudCancelable(estado: EstadoSolicitud): boolean {
  return estado === "pendiente";
}

export const ETIQUETAS_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  entregada: "Entregada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export function etiquetaEstadoSolicitud(estado: string): string {
  return ETIQUETAS_ESTADO[estado as EstadoSolicitud] ?? estado;
}

/** Formatea cantidades del pañol sin decimales innecesarios. */
export function cantidadLegible(valor: number | string): string {
  return Number(valor).toLocaleString("es-CL", { maximumFractionDigits: 2 });
}

export interface GrupoAsignaciones {
  persona_id: string;
  persona: string;
  registro: number;
  rango: string;
  articulos: AsignacionMaterial[];
}

/** Agrupa el EPP a cargo por persona, ordenado por registro. */
export function agruparAsignaciones(filas: readonly AsignacionMaterial[]): GrupoAsignaciones[] {
  const mapa = new Map<string, GrupoAsignaciones>();
  for (const fila of filas) {
    let grupo = mapa.get(fila.persona_id);
    if (!grupo) {
      grupo = {
        persona_id: fila.persona_id,
        persona: fila.persona,
        registro: fila.registro,
        rango: fila.rango,
        articulos: [],
      };
      mapa.set(fila.persona_id, grupo);
    }
    grupo.articulos.push(fila);
  }
  return [...mapa.values()].sort((a, b) => a.registro - b.registro);
}

/** Descripción corta de un artículo con talla, para listas y avisos. */
export function describirArticulo(nombre: string, talla: string | null, cantidad: number | string): string {
  const variante = talla ? ` (talla ${talla})` : "";
  return `${nombre} × ${cantidadLegible(cantidad)}${variante}`;
}
