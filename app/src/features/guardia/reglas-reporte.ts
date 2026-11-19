/** Reglas del reporte nocturno y de la llegada tardía. */

export interface IntegranteReporte {
  persona_id: string;
  registro: number;
  nombre: string;
  es_jefe: boolean;
}

/** Orden de responsabilidad: oficial de mayor rango, luego menor registro. */
export function responsableFirma(
  integrantes: IntegranteReporte[],
  prioridadPorPersona: Record<string, number>,
): IntegranteReporte | null {
  const presentes = integrantes.filter((i) => i.persona_id);
  if (presentes.length === 0) return null;
  return [...presentes].sort((a, b) => {
    const pa = prioridadPorPersona[a.persona_id] ?? 99;
    const pb = prioridadPorPersona[b.persona_id] ?? 99;
    return pa !== pb ? pa - pb : a.registro - b.registro;
  })[0];
}

export function puedeFirmar(
  esResponsable: boolean,
  tieneRespaldo: boolean,
): boolean {
  return esResponsable || tieneRespaldo;
}

/** Ventana de llegada tardía: misma noche y hasta mediodía del día siguiente. */
export function dentroVentanaLlegada(fechaTurno: string, ahora: Date): boolean {
  const fin = new Date(`${fechaTurno}T12:00:00`);
  fin.setDate(fin.getDate() + 1);
  return ahora.getTime() <= fin.getTime();
}

/** Texto que se agrega a la observación del turno. */
export function lineaObservacionLlegada(
  nombre: string,
  registro: number,
  hora: string,
  nota?: string | null,
): string {
  const base = `[${hora}] Llegada tardía: ${nombre} (Reg. ${registro})`;
  return nota ? `${base} — ${nota}` : base;
}
