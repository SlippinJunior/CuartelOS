import { describe, expect, it } from "vitest";
import { barraInferior, etiquetaRol, puedeVer, restantesDeBarra, seccionesDe } from "@/lib/permisos";

describe("permisos por rol", () => {
  it("el admin ve todas las secciones", () => {
    const s = seccionesDe(["admin"]);
    expect(s).toContain("administracion");
    expect(s).toContain("disciplina");
    expect(s).toContain("tesoreria");
  });

  it("el bombero no ve tesorería, administración ni disciplina", () => {
    const s = seccionesDe(["bombero"]);
    expect(s).not.toContain("tesoreria");
    expect(s).not.toContain("administracion");
    expect(s).not.toContain("disciplina");
    expect(s).toContain("personal");
    expect(s).toContain("asistencia");
  });

  it("el tesorero ve tesorería y no secretaría", () => {
    expect(puedeVer(["tesorero"], "tesoreria")).toBe(true);
    expect(puedeVer(["tesorero"], "secretaria")).toBe(false);
  });

  it("el consejo ve disciplina", () => {
    expect(puedeVer(["consejo"], "disciplina")).toBe(true);
    expect(puedeVer(["consejo"], "administracion")).toBe(false);
  });

  it("el ayudante ve asistencia", () => {
    expect(puedeVer(["ayudante"], "asistencia")).toBe(true);
  });

  it("la unión de roles suma secciones", () => {
    const s = seccionesDe(["tesorero", "ayudante"]);
    expect(s).toContain("tesoreria");
    expect(s).toContain("asistencia");
  });

  it("la barra inferior tiene 4 accesos y el resto va a Más", () => {
    const barra = barraInferior(["director"]);
    expect(barra).toHaveLength(4);
    expect(barra[0]).toBe("inicio");
    const restantes = restantesDeBarra(["director"]);
    expect(restantes.length).toBeGreaterThan(0);
    expect(restantes.some((s) => barra.includes(s))).toBe(false);
  });

  it("etiqueta los roles largos", () => {
    expect(etiquetaRol("teniente_1")).toBe("Teniente 1°");
    expect(etiquetaRol("consejo")).toBe("Consejo de Disciplina");
  });
});
