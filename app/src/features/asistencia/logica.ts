import type { LibroAnualData, LibroAnualLista, LibroAnualPersona, Marca } from "@/types/tipos";

export const CLASE_CELDA_LIBRO: Record<Marca | "NA" | "VACIO", string> = {
  A: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 font-semibold",
  F: "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 font-semibold",
  R: "bg-amber-200 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 font-semibold",
  P: "bg-sky-200 text-sky-950 dark:bg-sky-900/60 dark:text-sky-100 font-semibold",
  S: "bg-orange-400 text-white dark:bg-orange-700 dark:text-orange-50 font-semibold",
  L: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-semibold",
  NA: "bg-emerald-900/20 text-muted-foreground dark:bg-emerald-950/40 text-xs",
  VACIO: "text-muted-foreground",
};

export interface CeldaLibro {
  listaId: number;
  texto: string;
  clase: string;
  marca: Marca | "NA" | null;
}

export function calcularFilaLibro(
  persona: LibroAnualPersona,
  listas: readonly LibroAnualLista[],
): { total: number; celdas: CeldaLibro[] } {
  let acumulado = 0;
  const celdas: CeldaLibro[] = [];

  for (const lista of listas) {
    if (persona.fecha_ingreso && lista.fecha < persona.fecha_ingreso) {
      celdas.push({ listaId: lista.id, texto: "N/A", clase: CLASE_CELDA_LIBRO.NA, marca: "NA" });
      continue;
    }

    const marca = persona.marcas[String(lista.id)];
    if (!marca) {
      celdas.push({ listaId: lista.id, texto: "—", clase: CLASE_CELDA_LIBRO.VACIO, marca: null });
      continue;
    }

    if (marca === "A") {
      acumulado += 1;
      celdas.push({
        listaId: lista.id,
        texto: String(acumulado),
        clase: CLASE_CELDA_LIBRO.A,
        marca: "A",
      });
    } else {
      celdas.push({
        listaId: lista.id,
        texto: marca,
        clase: CLASE_CELDA_LIBRO[marca] ?? CLASE_CELDA_LIBRO.VACIO,
        marca,
      });
    }
  }

  return { total: acumulado, celdas };
}

function csvCelda(valor: string | number | null | undefined): string {
  const s = String(valor ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportarLibroCsv(data: LibroAnualData): string {
  const cabeceras = [
    "Registro",
    "Bombero",
    "Ingreso",
    "Cargo/Grado",
    "Total",
    ...data.listas.map((l) => `L${l.numero} (${l.clave})`),
  ];

  const filas = data.personas.map((p) => {
    const { total, celdas } = calcularFilaLibro(p, data.listas);
    return [
      p.registro,
      csvCelda(p.nombre),
      p.fecha_ingreso ?? "",
      csvCelda(p.cargo_grado),
      total,
      ...celdas.map((c) => c.texto),
    ].join(",");
  });

  return [cabeceras.join(","), ...filas].join("\n");
}

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  emergencia: "Emergencia",
  reunion: "Reunión",
  academia: "Academia",
  citacion: "Citación",
  otro: "Otro acto",
};

export function etiquetaCategoriaClave(categoria: string): string {
  return ETIQUETAS_CATEGORIA[categoria] ?? categoria;
}
