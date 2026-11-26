import type { EstadisticasCompania } from "@/types/tipos";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function normalizarEstadisticas(
  raw: Partial<EstadisticasCompania> | null | undefined,
  anioFallback: number,
): EstadisticasCompania {
  const anio = Number(raw?.anio ?? anioFallback) || anioFallback;
  const r = raw?.resumen;
  const mesesBase = MESES.map((etiqueta, idx) => ({
    mes: idx + 1,
    etiqueta,
    emergencias: 0,
    otros: 0,
    total: 0,
  }));

  return {
    anio,
    resumen: {
      total_actos: Number(r?.total_actos ?? 0),
      total_emergencias: Number(r?.total_emergencias ?? 0),
      asistencia_promedio_pct: Number(r?.asistencia_promedio_pct ?? 0),
      bomberos_activos: Number(r?.bomberos_activos ?? 0),
      total_asignaciones_activas: Number(r?.total_asignaciones_activas ?? 0),
      stock_bajo_count: Number(r?.stock_bajo_count ?? 0),
      eventos_bitacora: Number(r?.eventos_bitacora ?? 0),
      costo_mantenciones: Number(r?.costo_mantenciones ?? 0),
    },
    actos_por_mes: Array.isArray(raw?.actos_por_mes) && raw.actos_por_mes.length > 0 ? raw.actos_por_mes : mesesBase,
    actos_por_clave: Array.isArray(raw?.actos_por_clave) ? raw.actos_por_clave : [],
    distribucion_marcas: Array.isArray(raw?.distribucion_marcas) ? raw.distribucion_marcas : [],
    top_asistencia: Array.isArray(raw?.top_asistencia) ? raw.top_asistencia : [],
    menor_asistencia: Array.isArray(raw?.menor_asistencia) ? raw.menor_asistencia : [],
    material_mas_asignado: Array.isArray(raw?.material_mas_asignado) ? raw.material_mas_asignado : [],
    material_menos_asignado: Array.isArray(raw?.material_menos_asignado) ? raw.material_menos_asignado : [],
    stock_bajo: Array.isArray(raw?.stock_bajo) ? raw.stock_bajo : [],
    solicitudes_estado: Array.isArray(raw?.solicitudes_estado) ? raw.solicitudes_estado : [],
    unidades_resumen: Array.isArray(raw?.unidades_resumen) ? raw.unidades_resumen : [],
    guardias_resumen: {
      ciclo_nombre: raw?.guardias_resumen?.ciclo_nombre ?? null,
      turnos_totales: Number(raw?.guardias_resumen?.turnos_totales ?? 0),
      turnos_cubiertos: Number(raw?.guardias_resumen?.turnos_cubiertos ?? 0),
      pct_cobertura: Number(raw?.guardias_resumen?.pct_cobertura ?? 0),
    },
  };
}
