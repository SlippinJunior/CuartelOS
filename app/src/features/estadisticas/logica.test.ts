import { describe, expect, it } from "vitest";
import { normalizarEstadisticas } from "@/features/estadisticas/logica";

describe("normalizarEstadisticas", () => {
  it("devuelve estructura segura con ceros y arreglos vacíos si recibe null", () => {
    const res = normalizarEstadisticas(null, 2026);
    expect(res.anio).toBe(2026);
    expect(res.resumen.total_actos).toBe(0);
    expect(res.resumen.asistencia_promedio_pct).toBe(0);
    expect(res.actos_por_mes).toHaveLength(12);
    expect(res.material_mas_asignado).toEqual([]);
    expect(res.material_menos_asignado).toEqual([]);
  });

  it("preserva datos numéricos y arreglos válidos", () => {
    const res = normalizarEstadisticas(
      {
        anio: 2026,
        resumen: {
          total_actos: 40,
          total_emergencias: 22,
          asistencia_promedio_pct: 76.4,
          bomberos_activos: 30,
          total_asignaciones_activas: 18,
          stock_bajo_count: 2,
          eventos_bitacora: 5,
          costo_mantenciones: 620000,
        },
        actos_por_mes: [{ mes: 1, etiqueta: "Ene", emergencias: 3, otros: 1, total: 4 }],
        actos_por_clave: [{ clave: "10-1", descripcion: "Incendio", categoria: "emergencia", cantidad: 10 }],
        distribucion_marcas: [{ marca: "A", cantidad: 500 }],
        top_asistencia: [{ registro: 208, nombre: "Gonzalo Mena", asistencias: 38, faltas: 2, pct: 95 }],
        menor_asistencia: [],
        material_mas_asignado: [{ articulo: "Casco", categoria: "EPP", asignados: 14, stock_disponible: 12 }],
        material_menos_asignado: [{ articulo: "Traje Hazmat", categoria: "EPP", asignados: 0, stock_disponible: 1 }],
        stock_bajo: [],
        solicitudes_estado: [{ estado: "pendiente", cantidad: 2 }],
        unidades_resumen: [],
        guardias_resumen: { ciclo_nombre: "Ciclo 1", turnos_totales: 14, turnos_cubiertos: 12, pct_cobertura: 85.7 },
      },
      2026,
    );
    expect(res.resumen.total_emergencias).toBe(22);
    expect(res.material_mas_asignado[0].articulo).toBe("Casco");
    expect(res.material_menos_asignado[0].asignados).toBe(0);
    expect(res.guardias_resumen.pct_cobertura).toBe(85.7);
  });
});
