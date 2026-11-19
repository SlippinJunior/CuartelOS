/**
 * Roles manuales y mapa rol → secciones.
 * Es la única fuente para el menú y los guards de la interfaz.
 * La seguridad real la impone RLS en PostgreSQL.
 */

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
  | "administracion"
  | "disciplina";

export interface DefinicionSeccion {
  id: Seccion;
  titulo: string;
  ruta: string;
  descripcion: string;
}

export const SECCIONES: Record<Seccion, DefinicionSeccion> = {
  inicio: { id: "inicio", titulo: "Inicio", ruta: "/", descripcion: "Tareas, alertas y accesos rápidos" },
  personal: { id: "personal", titulo: "Personal", ruta: "/personal", descripcion: "Hoja de vida y antecedentes" },
  asistencia: { id: "asistencia", titulo: "Asistencia", ruta: "/asistencia", descripcion: "Listas y pase de lista" },
  guardia: { id: "guardia", titulo: "Guardia", ruta: "/guardia", descripcion: "Turnos, órdenes y accidentes" },
  material: { id: "material", titulo: "Material", ruta: "/material", descripcion: "Unidades e inventario" },
  tesoreria: { id: "tesoreria", titulo: "Tesorería", ruta: "/tesoreria", descripcion: "Cartola, presupuesto y proyecciones" },
  secretaria: { id: "secretaria", titulo: "Secretaría", ruta: "/secretaria", descripcion: "Actas, acuerdos y correspondencia" },
  documentos: { id: "documentos", titulo: "Documentos", ruta: "/documentos", descripcion: "Emisión y verificación de PDF" },
  administracion: { id: "administracion", titulo: "Administración", ruta: "/administracion", descripcion: "Usuarios, roles y parámetros" },
  disciplina: { id: "disciplina", titulo: "Disciplina", ruta: "/disciplina", descripcion: "Expedientes reservados del Consejo" },
};

const TODAS: Seccion[] = Object.keys(SECCIONES) as Seccion[];

const BASE_BOMBERO: Seccion[] = ["inicio", "personal", "asistencia", "material", "documentos", "guardia"];

export const SECCIONES_POR_ROL: Record<Rol, Seccion[]> = {
  admin: TODAS,
  director: [
    "inicio", "personal", "asistencia", "guardia", "material", "tesoreria",
    "secretaria", "documentos", "administracion",
  ],
  secretario: ["inicio", "personal", "asistencia", "secretaria", "documentos", "guardia", "material"],
  prosecretario: ["inicio", "personal", "asistencia", "secretaria", "documentos", "guardia"],
  tesorero: ["inicio", "personal", "tesoreria", "documentos", "material", "guardia", "secretaria"],
  protesorero: ["inicio", "personal", "tesoreria", "documentos", "guardia", "secretaria"],
  capitan: ["inicio", "personal", "asistencia", "guardia", "material", "documentos", "secretaria"],
  teniente_1: ["inicio", "personal", "guardia", "asistencia", "documentos", "secretaria"],
  teniente_2: ["inicio", "personal", "material", "guardia", "documentos", "secretaria"],
  teniente_3: ["inicio", "personal", "material", "guardia", "documentos", "secretaria"],
  ayudante: ["inicio", "personal", "asistencia", "documentos", "guardia", "secretaria"],
  consejo: ["inicio", "disciplina", "personal", "guardia"],
  bombero: BASE_BOMBERO,
};

/** Secciones visibles para un conjunto de roles (unión). */
export function seccionesDe(roles: readonly string[]): Seccion[] {
  if (!roles || roles.length === 0) return ["inicio"];
  const set = new Set<Seccion>(["inicio"]);
  for (const rol of roles) {
    const definidas = SECCIONES_POR_ROL[rol as Rol];
    if (definidas) definidas.forEach((s) => set.add(s));
  }
  return TODAS.filter((s) => set.has(s));
}

export function puedeVer(roles: readonly string[], seccion: Seccion): boolean {
  return seccionesDe(roles).includes(seccion);
}

/** Orden preferente de la barra inferior en el celular. */
const PREFERENCIA_BARRA: Seccion[] = [
  "inicio", "guardia", "asistencia", "personal", "tesoreria", "material",
  "documentos", "secretaria", "administracion", "disciplina",
];

export function barraInferior(roles: readonly string[]): Seccion[] {
  const visibles = seccionesDe(roles);
  const elegidas = PREFERENCIA_BARRA.filter((s) => visibles.includes(s)).slice(0, 4);
  if (!elegidas.includes("inicio")) elegidas.unshift("inicio");
  return elegidas.slice(0, 4);
}

export function restantesDeBarra(roles: readonly string[]): Seccion[] {
  const visibles = seccionesDe(roles);
  const barra = barraInferior(roles);
  return visibles.filter((s) => !barra.includes(s));
}

/** Roles que gestionan el ciclo de guardias (Capitanía y Ayudantía). */
export function puedeGestionarGuardias(roles: readonly string[]): boolean {
  return roles.some((r) =>
    ["capitan", "teniente_1", "ayudante", "director", "admin"].includes(r),
  );
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
  };
  return etiquetas[rol] ?? rol;
}
