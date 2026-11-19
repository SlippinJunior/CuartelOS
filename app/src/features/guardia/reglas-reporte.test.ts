import { describe, expect, it } from "vitest";
import {
  dentroVentanaLlegada,
  lineaObservacionLlegada,
  puedeFirmar,
  responsableFirma,
} from "@/features/guardia/reglas-reporte";

const integrantes = [
  { persona_id: "a", registro: 201, nombre: "Ana", es_jefe: false },
  { persona_id: "b", registro: 240, nombre: "Beto", es_jefe: false },
  { persona_id: "c", registro: 215, nombre: "Carla", es_jefe: false },
];

describe("guardias · reporte y firma", () => {
  it("elige al oficial de mayor rango como responsable", () => {
    const r = responsableFirma(integrantes, { a: 99, b: 2, c: 1 });
    expect(r?.nombre).toBe("Carla");
  });

  it("con el mismo rango u operando, firma el de menor registro", () => {
    const r = responsableFirma(integrantes, { a: 99, b: 99, c: 99 });
    expect(r?.nombre).toBe("Ana");
  });

  it("sin integrantes no hay responsable", () => {
    expect(responsableFirma([], {})).toBeNull();
  });

  it("permite firmar al responsable o con respaldo de Capitanía", () => {
    expect(puedeFirmar(true, false)).toBe(true);
    expect(puedeFirmar(false, true)).toBe(true);
    expect(puedeFirmar(false, false)).toBe(false);
  });

  it("acepta la llegada tardía hasta el mediodía siguiente", () => {
    expect(dentroVentanaLlegada("2026-11-19", new Date("2026-11-20T11:30:00"))).toBe(true);
    expect(dentroVentanaLlegada("2026-11-19", new Date("2026-11-20T13:00:00"))).toBe(false);
  });

  it("arma la línea de observación con hora, nombre y registro", () => {
    expect(lineaObservacionLlegada("Ana Pérez", 201, "23:58")).toBe(
      "[23:58] Llegada tardía: Ana Pérez (Reg. 201)",
    );
    expect(lineaObservacionLlegada("Ana Pérez", 201, "23:58", "avisó por radio")).toContain("avisó por radio");
  });
});
