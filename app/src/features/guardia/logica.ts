/** Lógica pura del módulo de guardias (probada con Vitest). */
import type { CategoriaGuardia, GuardiaTurnoGrilla } from "@/types/tipos";

export const CATEGORIAS_GUARDIA: Record<CategoriaGuardia, string> = {
  "0_4": "0 a 4 años",
  "5_9": "5 a 9 años",
  "10_19": "10 a 19 años",
  "20_34": "20 a 34 años",
  exento: "Exento",
};

export const DESCRIPCION_CATEGORIA: Record<CategoriaGuardia, string> = {
  "0_4": "Guardia semanal (Orden 01/2026 §3)",
  "5_9": "Guardia cada 14 días",
  "10_19": "Guardia bimestral",
  "20_34": "Guardia trimestral",
  exento: "No cumple guardia: mayor de 60 años, 35 de servicio u exención del Directorio",
};

export function etiquetaCategoria(categoria: CategoriaGuardia | null | undefined): string {
  if (!categoria) return "Sin dato";
  return CATEGORIAS_GUARDIA[categoria] ?? categoria;
}

export function semaforoDotacion(guardianes: number, cupoBase: number): "vacio" | "incompleto" | "completo" | "extra" {
  if (guardianes <= 0) return "vacio";
  if (guardianes < cupoBase) return "incompleto";
  if (guardianes === cupoBase) return "completo";
  return "extra";
}

export function varianteDotacion(estado: ReturnType<typeof semaforoDotacion>): "peligro" | "aviso" | "exito" | "secondary" {
  switch (estado) {
    case "vacio":
      return "peligro";
    case "incompleto":
      return "aviso";
    case "completo":
      return "exito";
    default:
      return "secondary";
  }
}

export function diasCubiertos(dias: GuardiaTurnoGrilla[], cupoBase: number): number {
  return dias.filter((d) => d.guardianes >= cupoBase).length;
}

export interface EstadoInscripcion {
  puedeInscribirse: boolean;
  motivo: string;
}

/**
 * Regla de cupo: se permite inscribirse si el día tiene menos que el cupo o
 * si los 7 días de la semana ya alcanzaron el cupo (se liberan cupos extra).
 */
export function evaluarInscripcion(
  turno: GuardiaTurnoGrilla,
  semanaCubierta: boolean,
  cupoBase: number,
  yaInscrito: boolean,
  exento: boolean,
): EstadoInscripcion {
  if (exento) return { puedeInscribirse: false, motivo: "Estás exento de guardia." };
  if (yaInscrito) return { puedeInscribirse: false, motivo: "Ya estás inscrito en este día." };
  if (turno.estado === "firmada") return { puedeInscribirse: false, motivo: "La guardia ya está cerrada." };
  if (turno.guardianes < cupoBase) {
    return { puedeInscribirse: true, motivo: `Quedan ${cupoBase - turno.guardianes} cupos.` };
  }
  if (semanaCubierta) {
    return { puedeInscribirse: true, motivo: "Semana completa: se liberan cupos extra." };
  }
  return {
    puedeInscribirse: false,
    motivo: "Día lleno. Elige un día que aún falte cubrir.",
  };
}

export function puedeBajarseLibremente(guardianes: number): boolean {
  return guardianes > 3;
}

/** Período sugerido según la categoría (Orden 01/2026 §3). */
export function periodoCategoria(categoria: CategoriaGuardia | null | undefined): string {
  switch (categoria) {
    case "0_4":
      return "Semanal";
    case "5_9":
      return "14 días";
    case "10_19":
      return "Bimestral";
    case "20_34":
      return "Trimestral";
    case "exento":
      return "Exento";
    default:
      return "Sin dato";
  }
}

/** Formatea una hora ISO a HH:MM en horario de Chile, en formato 24 horas. */
export function horaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  });
}
