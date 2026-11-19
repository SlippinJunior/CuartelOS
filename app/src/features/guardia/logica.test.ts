import { describe, expect, it } from "vitest";
import {
  diasCubiertos,
  etiquetaCategoria,
  evaluarInscripcion,
  horaCorta,
  periodoCategoria,
  puedeBajarseLibremente,
  semaforoDotacion,
  varianteDotacion,
} from "@/features/guardia/logica";
import type { GuardiaTurnoGrilla } from "@/types/tipos";

function turno(guardianes: number, estado: GuardiaTurnoGrilla["estado"] = "programada"): GuardiaTurnoGrilla {
  return {
    turno_id: 1,
    fecha: "2026-11-19",
    semana_num: 1,
    estado,
    inicio: "2026-11-19T23:30:00",
    termino: null,
    feriado: null,
    hora_aviso_central: null,
    charlie_modalidad: null,
    charlie_codigo: null,
    observacion: null,
    jefe_persona_id: null,
    firmado_en: null,
    guardianes,
    integrantes: [],
  };
}

describe("guardias · reglas de UI", () => {
  it("etiqueta las categorías de la Orden 01/2026", () => {
    expect(etiquetaCategoria("0_4")).toBe("0 a 4 años");
    expect(etiquetaCategoria("20_34")).toBe("20 a 34 años");
    expect(etiquetaCategoria("exento")).toBe("Exento");
    expect(etiquetaCategoria(null)).toBe("Sin dato");
  });

  it("sugiere el período según la categoría", () => {
    expect(periodoCategoria("0_4")).toBe("Semanal");
    expect(periodoCategoria("5_9")).toBe("14 días");
    expect(periodoCategoria("10_19")).toBe("Bimestral");
    expect(periodoCategoria("20_34")).toBe("Trimestral");
  });

  it("pinta el semáforo de dotación", () => {
    expect(semaforoDotacion(0, 3)).toBe("vacio");
    expect(semaforoDotacion(2, 3)).toBe("incompleto");
    expect(semaforoDotacion(3, 3)).toBe("completo");
    expect(semaforoDotacion(4, 3)).toBe("extra");
    expect(varianteDotacion("vacio")).toBe("peligro");
    expect(varianteDotacion("extra")).toBe("secondary");
  });

  it("permite inscribirse cuando el día tiene cupo", () => {
    const r = evaluarInscripcion(turno(1), false, 3, false, false);
    expect(r.puedeInscribirse).toBe(true);
    expect(r.motivo).toContain("2 cupos");
  });

  it("bloquea el cuarto cupo si otro día de la semana falta", () => {
    const r = evaluarInscripcion(turno(3), false, 3, false, false);
    expect(r.puedeInscribirse).toBe(false);
    expect(r.motivo).toMatch(/Día lleno/);
  });

  it("libera cupos extra si los 7 días están cubiertos", () => {
    const r = evaluarInscripcion(turno(3), true, 3, false, false);
    expect(r.puedeInscribirse).toBe(true);
    expect(r.motivo).toMatch(/cupos extra/);
  });

  it("no permite inscribirse a un exento ni a quien ya está inscrito", () => {
    expect(evaluarInscripcion(turno(0), false, 3, false, true).puedeInscribirse).toBe(false);
    expect(evaluarInscripcion(turno(1), false, 3, true, false).motivo).toMatch(/Ya estás inscrito/);
  });

  it("permite bajarse libremente solo con más de 3 guardianes", () => {
    expect(puedeBajarseLibremente(3)).toBe(false);
    expect(puedeBajarseLibremente(4)).toBe(true);
  });

  it("cuenta los días cubiertos de la semana", () => {
    const dias = [turno(3), turno(3), turno(2), turno(1), turno(3), turno(3), turno(0)];
    expect(diasCubiertos(dias, 3)).toBe(4);
  });

  it("formatea la hora", () => {
    expect(horaCorta(null)).toBe("—");
    expect(horaCorta("2026-11-19T23:30:00-03:00")).toMatch(/\d{2}:\d{2}/);
  });
});
