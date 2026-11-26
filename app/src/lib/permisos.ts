/**
 * Roles manuales, excepciones por módulo, grupos de navegación y mapa rol → secciones.
 * Es la única fuente para el menú y los guards de la interfaz.
 * La seguridad real la impone RLS en PostgreSQL.
 */

import type { NivelPermiso, PermisosModulo, TipoPublicacionTablero } from "@/types/tipos";

export const ROLES = [
  "admin",
  "director",
  "secretario",
  "prosecretario",
  "tesorero",
  "protesorero",
  "capitan",
  "teniente_1",
  "teniente_2",
  "teniente_3",
  "ayudante",
  "consejo",
  "bombero",
  "cuartel",
] as const;

export type Rol = (typeof ROLES)[number];

export type Seccion =
  | "inicio"
  | "personal"
  | "asistencia"
  | "guardia"
  | "material"
  | "tesoreria"
  | "secretaria"
  | "documentos"
  | "estadisticas"
  | "administracion"
  | "disciplina";

export interface DefinicionSeccion {
  id: Seccion;
  titulo: string;
  ruta: string;
  descripcion: string;
}

export const SECCIONES: Record<Seccion, DefinicionSeccion> = {
  inicio: { id: "inicio", titulo: "Tablero e Inicio", ruta: "/", descripcion: "Órdenes, circulares, citaciones y tareas" },
  personal: { id: "personal", titulo: "Personal", ruta: "/personal", descripcion: "Hoja de vida y antecedentes" },
  asistencia: { id: "asistencia", titulo: "Asistencia", ruta: "/asistencia", descripcion: "Partes, libro anual y pase de lista" },
  guardia: { id: "guardia", titulo: "Guardia", ruta: "/guardia", descripcion: "Turnos, inscripciones y reportes" },
  material: { id: "material", titulo: "Material", ruta: "/material", descripcion: "Unidades, inventario compañía y bitácora" },
  tesoreria: { id: "tesoreria", titulo: "Tesorería", ruta: "/tesoreria", descripcion: "Cartola, cuotas y proyecciones" },
  secretaria: { id: "secretaria", titulo: "Secretaría", ruta: "/secretaria", descripcion: "Actas, acuerdos y correspondencia" },
  documentos: { id: "documentos", titulo: "Documentos", ruta: "/documentos", descripcion: "Emisión y verificación de PDF" },
  estadisticas: { id: "estadisticas", titulo: "Estadísticas", ruta: "/estadisticas", descripcion: "Indicadores gráficos de emergencias, asistencia e inventario" },
  administracion: { id: "administracion", titulo: "Administración", ruta: "/administracion", descripcion: "Usuarios, permisos, unidades y parámetros" },
  disciplina: { id: "disciplina", titulo: "Disciplina", ruta: "/disciplina", descripcion: "Expedientes reservados del Consejo" },
};

export const MODULOS_CONFIGURABLES: Seccion[] = [
  "personal",
  "asistencia",
  "guardia",
  "material",
  "tesoreria",
  "secretaria",
  "documentos",
  "estadisticas",
  "administracion",
  "disciplina",
];

export interface GrupoNavegacion {
  titulo: string;
  secciones: Seccion[];
}

export const GRUPOS_NAVEGACION: GrupoNavegacion[] = [
  { titulo: "Diario", secciones: ["inicio", "guardia", "asistencia"] },
  { titulo: "Compañía", secciones: ["personal", "material", "secretaria", "tesoreria", "documentos", "estadisticas"] },
  { titulo: "Sistema", secciones: ["disciplina", "administracion"] },
];

const TODAS: Seccion[] = Object.keys(SECCIONES) as Seccion[];

const BASE_BOMBERO: Seccion[] = ["inicio", "personal", "asistencia", "material", "documentos", "guardia"];

export const SECCIONES_POR_ROL: Record<Rol, Seccion[]> = {
  admin: TODAS,
  director: [
    "inicio", "personal", "asistencia", "guardia", "material", "tesoreria",
    "secretaria", "documentos", "estadisticas", "administracion",
  ],
  secretario: ["inicio", "personal", "asistencia", "secretaria", "documentos", "guardia", "material", "estadisticas"],
  prosecretario: ["inicio", "personal", "asistencia", "secretaria", "documentos", "guardia", "estadisticas"],
  tesorero: ["inicio", "personal", "tesoreria", "documentos", "material", "guardia", "secretaria", "estadisticas"],
  protesorero: ["inicio", "personal", "tesoreria", "documentos", "guardia", "secretaria", "estadisticas"],
  capitan: ["inicio", "personal", "asistencia", "guardia", "material", "documentos", "secretaria", "estadisticas"],
  teniente_1: ["inicio", "personal", "guardia", "asistencia", "documentos", "secretaria", "estadisticas"],
  teniente_2: ["inicio", "personal", "material", "guardia", "documentos", "secretaria", "estadisticas"],
  teniente_3: ["inicio", "personal", "material", "guardia", "documentos", "secretaria", "estadisticas"],
  ayudante: ["inicio", "personal", "asistencia", "documentos", "guardia", "secretaria", "estadisticas"],
  consejo: ["inicio", "disciplina", "personal", "guardia"],
  bombero: BASE_BOMBERO,
  cuartel: ["inicio"],
};

const ROLES_GESTION_MODULO: Record<Seccion, Rol[]> = {
  inicio: ["admin", "director", "capitan", "teniente_1", "ayudante", "secretario", "prosecretario"],
  personal: ["admin", "director", "secretario", "prosecretario", "capitan", "ayudante"],
  asistencia: ["admin", "ayudante", "capitan", "secretario"],
  guardia: ["admin", "capitan", "teniente_1", "ayudante", "director"],
  material: ["admin", "teniente_2", "teniente_3", "capitan", "director"],
  tesoreria: ["admin", "tesorero", "protesorero", "director"],
  secretaria: ["admin", "secretario", "prosecretario", "director"],
  documentos: [
    "admin", "director", "secretario", "prosecretario",
    "tesorero", "protesorero", "capitan", "teniente_1", "teniente_2", "teniente_3", "ayudante",
  ],
  estadisticas: ["admin", "director"],
  administracion: ["admin", "director"],
  disciplina: ["admin", "consejo"],
};

/** Verdadero si el usuario solo cumple rol de pantalla de cuartel. */
export function esSoloCuartel(roles: readonly string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.includes("cuartel") && roles.every((r) => r === "cuartel");
}

/** Nivel heredado exclusivamente desde los roles asignados (bloque por rol). */
export function nivelPorRoles(roles: readonly string[], seccion: Seccion): NivelPermiso {
  if (seccion === "inicio") return "lectura";
  if (esSoloCuartel(roles)) return "ninguno";
  if (roles.includes("admin")) return "gestion";

  const rolesGestion = ROLES_GESTION_MODULO[seccion] ?? [];
  if (roles.some((r) => rolesGestion.includes(r as Rol))) {
    return "gestion";
  }

  for (const rol of roles) {
    const definidas = SECCIONES_POR_ROL[rol as Rol];
    if (definidas?.includes(seccion)) return "lectura";
  }

  return "ninguno";
}

/** Nivel efectivo combinando bloque por rol + excepción explícita por módulo. */
export function nivelPermiso(
  roles: readonly string[],
  seccion: Seccion,
  modulos?: PermisosModulo,
): NivelPermiso {
  if (seccion === "inicio") return "lectura";
  if (esSoloCuartel(roles)) return "ninguno";
  if (roles.includes("admin")) return "gestion";

  const excepcion = modulos?.[seccion];
  if (excepcion === "ninguno" || excepcion === "lectura" || excepcion === "gestion") {
    return excepcion;
  }

  return nivelPorRoles(roles, seccion);
}

/** Secciones visibles para un conjunto de roles y excepciones por módulo. */
export function seccionesDe(roles: readonly string[], modulos?: PermisosModulo): Seccion[] {
  if (!roles || roles.length === 0) return ["inicio"];
  if (esSoloCuartel(roles)) return ["inicio"];
  return TODAS.filter((s) => s === "inicio" || nivelPermiso(roles, s, modulos) !== "ninguno");
}

export function puedeVer(roles: readonly string[], seccion: Seccion, modulos?: PermisosModulo): boolean {
  return seccionesDe(roles, modulos).includes(seccion);
}

export function puedeGestionar(roles: readonly string[], seccion: Seccion, modulos?: PermisosModulo): boolean {
  return nivelPermiso(roles, seccion, modulos) === "gestion";
}

/** Determina la sección correspondiente a una ruta del router. */
export function seccionDeRuta(pathname: string): Seccion | null {
  if (pathname === "/" || pathname.startsWith("/consentimiento")) return "inicio";
  if (pathname.startsWith("/mis-cuotas")) return "inicio";
  const encontrada = (Object.values(SECCIONES) as DefinicionSeccion[])
    .filter((s) => s.id !== "inicio")
    .find((s) => pathname === s.ruta || pathname.startsWith(`${s.ruta}/`));
  return encontrada?.id ?? null;
}

/** Orden preferente de la barra inferior en el celular. */
const PREFERENCIA_BARRA: Seccion[] = [
  "inicio", "guardia", "asistencia", "personal", "material", "tesoreria",
  "estadisticas", "documentos", "secretaria", "administracion", "disciplina",
];

export function barraInferior(roles: readonly string[], modulos?: PermisosModulo): Seccion[] {
  const visibles = seccionesDe(roles, modulos);
  const elegidas = PREFERENCIA_BARRA.filter((s) => visibles.includes(s)).slice(0, 4);
  if (!elegidas.includes("inicio")) elegidas.unshift("inicio");
  return elegidas.slice(0, 4);
}

export function restantesDeBarra(roles: readonly string[], modulos?: PermisosModulo): Seccion[] {
  const visibles = seccionesDe(roles, modulos);
  const barra = barraInferior(roles, modulos);
  return visibles.filter((s) => !barra.includes(s));
}

/** Roles que gestionan el ciclo de guardias (Capitanía y Ayudantía). */
export function puedeGestionarGuardias(roles: readonly string[], modulos?: PermisosModulo): boolean {
  return puedeGestionar(roles, "guardia", modulos);
}

/** Tipos de publicación del Tablero que puede emitir el conjunto de roles. */
export function tiposPublicablesPor(roles: readonly string[]): TipoPublicacionTablero[] {
  const tipos: TipoPublicacionTablero[] = [];
  if (roles.some((r) => ["capitan", "teniente_1", "ayudante", "director", "admin"].includes(r))) {
    tipos.push("orden_dia", "orden_capitania");
  }
  if (roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r))) {
    tipos.push("circular_compania", "circular_cbl");
  }
  if (roles.some((r) => ["secretario", "prosecretario", "capitan", "ayudante", "director", "admin"].includes(r))) {
    tipos.push("citacion");
  }
  return tipos;
}

export function puedePublicarTablero(roles: readonly string[]): boolean {
  return tiposPublicablesPor(roles).length > 0;
}

/** Etiqueta legible de un rol. */
export function etiquetaRol(rol: string): string {
  const etiquetas: Record<string, string> = {
    admin: "Administrador",
    director: "Director",
    secretario: "Secretario",
    prosecretario: "Prosecretario",
    tesorero: "Tesorero",
    protesorero: "Protesorero",
    capitan: "Capitán",
    teniente_1: "Teniente 1°",
    teniente_2: "Teniente 2°",
    teniente_3: "Teniente 3°",
    ayudante: "Ayudante",
    consejo: "Consejo de Disciplina",
    bombero: "Bombero",
    cuartel: "Pantalla de Cuartel",
  };
  return etiquetas[rol] ?? rol;
}
