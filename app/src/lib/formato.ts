/** Formato chileno: CLP sin decimales y fechas dd-mm-aaaa. */

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const numero = new Intl.NumberFormat("es-CL");

export function formatearCLP(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return "—";
  return clp.format(n);
}

export function formatearNumero(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (!Number.isFinite(n)) return "—";
  return numero.format(n);
}

function aFecha(valor: string | Date): Date | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (!valor) return null;
  // Las fechas de Postgres llegan como YYYY-MM-DD: se interpretan sin zona.
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) {
    const [, y, m, d] = soloFecha;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFecha(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const f = aFecha(valor);
  if (!f) return "—";
  const dd = String(f.getDate()).padStart(2, "0");
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${f.getFullYear()}`;
}

export function formatearFechaHora(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const f = aFecha(valor);
  if (!f) return "—";
  const hh = String(f.getHours()).padStart(2, "0");
  const mi = String(f.getMinutes()).padStart(2, "0");
  return `${formatearFecha(f)} ${hh}:${mi}`;
}

export function fechaISO(valor: Date): string {
  const y = valor.getFullYear();
  const m = String(valor.getMonth() + 1).padStart(2, "0");
  const d = String(valor.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatearPorcentaje(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—";
  return `${valor.toFixed(decimales).replace(".", ",")}%`;
}

export function edad(fechaNacimiento: string | null | undefined, hoy = new Date()): number | null {
  if (!fechaNacimiento) return null;
  const f = aFecha(fechaNacimiento);
  if (!f) return null;
  let anios = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) anios--;
  return anios;
}

/** Estado del semáforo fijo del sistema. */
export type Semaforo = "al_dia" | "por_vencer" | "vencido" | "sin_dato";

export function semaforo(vence: string | null | undefined, diasAviso = 30): Semaforo {
  if (!vence) return "sin_dato";
  const f = aFecha(vence);
  if (!f) return "sin_dato";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + diasAviso);
  if (f < hoy) return "vencido";
  if (f <= limite) return "por_vencer";
  return "al_dia";
}
