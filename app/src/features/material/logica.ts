import { puedeGestionar, puedeVer } from "@/lib/permisos";
import type {
  AsignacionMaterial,
  BitacoraUnidad,
  EstadoSolicitud,
  PermisosModulo,
  TipoBitacoraUnidad,
} from "@/types/tipos";

/** Roles que administran el Inventario Compañía y resuelven solicitudes. */
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

export function esGestorMaterial(roles: readonly string[], modulos?: PermisosModulo): boolean {
  if (esTenienteSegundo(roles)) return true;
  if (modulos?.material === "gestion") return true;
  return false;
}

export function puedeEditarBitacora(roles: readonly string[], modulos?: PermisosModulo): boolean {
  if (puedeGestionar(roles, "material", modulos)) return true;
  return roles.some((r) => ["capitan", "teniente_3", "teniente_2", "director", "admin"].includes(r));
}

export function puedeVerInventarioBomberos(roles: readonly string[], modulos?: PermisosModulo): boolean {
  if (modulos && !puedeVer(roles, "material", modulos)) return false;
  return roles.some((r) => ROLES_OFICIALES.includes(r)) || modulos?.material === "gestion";
}

export const ETIQUETAS_BITACORA: Record<TipoBitacoraUnidad, string> = {
  mantencion: "Mantención",
  accidente: "Accidente",
  revision: "Revisión",
  combustible: "Combustible",
  novedad: "Novedad",
};

export function etiquetaTipoBitacora(tipo: string): string {
  return ETIQUETAS_BITACORA[tipo as TipoBitacoraUnidad] ?? tipo;
}

export function resumirBitacora(entradas: readonly BitacoraUnidad[]): {
  total: number;
  mantenciones: number;
  accidentes: number;
  costoTotal: number;
} {
  let mantenciones = 0;
  let accidentes = 0;
  let costoTotal = 0;
  for (const e of entradas) {
    if (e.tipo === "mantencion") mantenciones++;
    if (e.tipo === "accidente") accidentes++;
    if (e.costo) costoTotal += Number(e.costo);
  }
  return { total: entradas.length, mantenciones, accidentes, costoTotal };
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
