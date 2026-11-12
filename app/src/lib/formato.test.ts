import { describe, expect, it } from "vitest";
import {
  edad,
  fechaISO,
  formatearCLP,
  formatearFecha,
  formatearFechaHora,
  formatearPorcentaje,
  semaforo,
} from "@/lib/formato";

describe("formato es-CL", () => {
  it("formatea CLP sin decimales", () => {
    expect(formatearCLP(1234567)).toBe("$1.234.567");
    expect(formatearCLP("3500")).toBe("$3.500");
    expect(formatearCLP(null)).toBe("—");
  });

  it("formatea fechas dd-mm-aaaa sin desfase de zona", () => {
    expect(formatearFecha("2026-11-12")).toBe("12-11-2026");
    expect(formatearFecha(new Date(2026, 0, 5))).toBe("05-01-2026");
    expect(formatearFecha(null)).toBe("—");
  });

  it("formatea fecha y hora", () => {
    const d = new Date(2026, 10, 12, 8, 5);
    expect(formatearFechaHora(d)).toBe("12-11-2026 08:05");
  });

  it("formatea porcentajes con coma", () => {
    expect(formatearPorcentaje(87.5)).toBe("87,5%");
    expect(formatearPorcentaje(null)).toBe("—");
  });

  it("calcula edad", () => {
    expect(edad("2000-11-13", new Date(2026, 10, 12))).toBe(25);
    expect(edad("2000-11-12", new Date(2026, 10, 12))).toBe(26);
    expect(edad(null)).toBeNull();
  });

  it("entrega fecha ISO local", () => {
    expect(fechaISO(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});

describe("semáforo", () => {
  it("clasifica vencido, por vencer y al día", () => {
    expect(semaforo("2020-01-01")).toBe("vencido");
    const enDiezDias = new Date();
    enDiezDias.setDate(enDiezDias.getDate() + 10);
    expect(semaforo(fechaISO(enDiezDias))).toBe("por_vencer");
    const enUnAnio = new Date();
    enUnAnio.setFullYear(enUnAnio.getFullYear() + 1);
    expect(semaforo(fechaISO(enUnAnio))).toBe("al_dia");
    expect(semaforo(null)).toBe("sin_dato");
  });
});
