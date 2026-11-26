import type { PublicacionTablero, TipoPublicacionTablero } from "@/types/tipos";

export interface MetaTipoPublicacion {
  etiqueta: string;
  etiquetaCorta: string;
  descripcion: string;
  badgeVariant: "default" | "secondary" | "outline" | "exito" | "aviso";
}

export const META_TIPO_TABLERO: Record<TipoPublicacionTablero, MetaTipoPublicacion> = {
  orden_dia: {
    etiqueta: "Orden del día",
    etiquetaCorta: "Órd. día",
    descripcion: "Instrucción diaria vigente para el servicio en el cuartel.",
    badgeVariant: "default",
  },
  citacion: {
    etiqueta: "Citación",
    etiquetaCorta: "Citaciones",
    descripcion: "Convocatoria a reunión, academia, ejercicio o acto oficial.",
    badgeVariant: "aviso",
  },
  orden_capitania: {
    etiqueta: "Orden de capitanía",
    etiquetaCorta: "Capitanía",
    descripcion: "Disposición oficial emitida por Capitanía.",
    badgeVariant: "secondary",
  },
  circular_compania: {
    etiqueta: "Circular de compañía",
    etiquetaCorta: "Circ. Compañía",
    descripcion: "Comunicado interno de la Segunda Compañía.",
    badgeVariant: "outline",
  },
  circular_cbl: {
    etiqueta: "Circular CBL",
    etiquetaCorta: "Circ. CBL",
    descripcion: "Circular emanada del Cuerpo de Bomberos de Limache.",
    badgeVariant: "outline",
  },
};

export const ORDEN_FILTROS_TABLERO: Array<TipoPublicacionTablero | "todas"> = [
  "todas",
  "orden_dia",
  "citacion",
  "orden_capitania",
  "circular_compania",
  "circular_cbl",
];

/** Determina si una orden del día está vigente en la fecha indicada (YYYY-MM-DD). */
export function ordenDiaVigente(p: PublicacionTablero, hoy: string): boolean {
  if (p.tipo !== "orden_dia") return false;
  if (p.fecha > hoy) return false;
  if (!p.vigente_hasta) return p.fecha === hoy;
  return p.vigente_hasta >= hoy;
}

/** Determina si una citación aún no ha ocurrido (hoy o futura). */
export function citacionProxima(p: PublicacionTablero, hoy: string): boolean {
  if (p.tipo !== "citacion") return false;
  return (p.fecha_evento ?? p.fecha) >= hoy;
}

/** Filtra publicaciones por categoría y texto libre (título, número, lugar, tenida). */
export function filtrarPublicaciones(
  lista: PublicacionTablero[],
  filtro: TipoPublicacionTablero | "todas",
  busqueda: string,
): PublicacionTablero[] {
  const q = busqueda
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return lista.filter((p) => {
    if (filtro !== "todas" && p.tipo !== filtro) return false;
    if (!q) return true;
    const texto = [p.numero, p.titulo, p.resumen, p.texto, p.lugar, p.tenida]
      .filter(Boolean)
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return texto.includes(q);
  });
}

/** Cuenta cuántas publicaciones hay por cada categoría. */
export function contarPorTipo(lista: PublicacionTablero[]): Record<TipoPublicacionTablero | "todas", number> {
  const conteo: Record<TipoPublicacionTablero | "todas", number> = {
    todas: lista.length,
    orden_dia: 0,
    orden_capitania: 0,
    circular_cbl: 0,
    circular_compania: 0,
    citacion: 0,
  };
  for (const item of lista) {
    conteo[item.tipo] = (conteo[item.tipo] ?? 0) + 1;
  }
  return conteo;
}

/** Combina circulares de compañía y del Cuerpo ordenadas de más reciente a más antigua. */
export function combinarCirculares(lista: PublicacionTablero[]): PublicacionTablero[] {
  return lista
    .filter((p) => p.tipo === "circular_compania" || p.tipo === "circular_cbl")
    .slice()
    .sort((a, b) => {
      const porFecha = (b.fecha ?? "").localeCompare(a.fecha ?? "");
      if (porFecha !== 0) return porFecha;
      return (b.creado_en ?? "").localeCompare(a.creado_en ?? "");
    });
}

/** Pagina una lista de elementos acotando la página actual al rango válido. */
export function paginarPublicaciones<T>(
  items: T[],
  pagina: number,
  porPagina: number,
): { visibles: T[]; totalPaginas: number; paginaActual: number } {
  const tamano = Math.max(1, porPagina);
  const totalPaginas = Math.max(1, Math.ceil(items.length / tamano));
  const paginaActual = Math.min(Math.max(0, pagina), totalPaginas - 1);
  const inicio = paginaActual * tamano;
  return {
    visibles: items.slice(inicio, inicio + tamano),
    totalPaginas,
    paginaActual,
  };
}
