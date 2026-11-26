import { describe, expect, it } from "vitest";
import {
  barraInferior,
  esSoloCuartel,
  etiquetaRol,
  GRUPOS_NAVEGACION,
  nivelPermiso,
  puedeGestionar,
  puedePublicarTablero,
  puedeVer,
  restantesDeBarra,
  seccionesDe,
  tiposPublicablesPor,
} from "@/lib/permisos";

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

  it("el tesorero ve tesorería y secretaría (lectura)", () => {
    expect(puedeVer(["tesorero"], "tesoreria")).toBe(true);
    expect(puedeVer(["tesorero"], "secretaria")).toBe(true);
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

describe("secretaría para la oficialidad", () => {
  it("la oficialidad accede a Secretaría", () => {
    for (const rol of ["director", "secretario", "prosecretario", "tesorero", "protesorero", "capitan", "teniente_1", "teniente_2", "teniente_3", "ayudante", "admin"]) {
      expect(puedeVer([rol], "secretaria")).toBe(true);
    }
  });

  it("el bombero y el consejo no ven Secretaría en el menú", () => {
    expect(puedeVer(["bombero"], "secretaria")).toBe(false);
    expect(puedeVer(["consejo"], "secretaria")).toBe(false);
  });
});

describe("rol cuartel y tablero", () => {
  it("el usuario cuartel solo ve inicio (Tablero) y se identifica como solo-cuartel", () => {
    expect(esSoloCuartel(["cuartel"])).toBe(true);
    expect(esSoloCuartel(["cuartel", "bombero"])).toBe(false);
    expect(seccionesDe(["cuartel"])).toEqual(["inicio"]);
    expect(puedeVer(["cuartel"], "personal")).toBe(false);
    expect(puedeVer(["cuartel"], "guardia")).toBe(false);
    expect(puedePublicarTablero(["cuartel"])).toBe(false);
    expect(etiquetaRol("cuartel")).toBe("Pantalla de Cuartel");
  });

  it("los permisos de publicación por tipo corresponden al rol", () => {
    expect(tiposPublicablesPor(["teniente_1"])).toEqual(["orden_dia", "orden_capitania"]);
    expect(tiposPublicablesPor(["secretario"])).toEqual(["circular_compania", "circular_cbl", "citacion"]);
    expect(tiposPublicablesPor(["bombero"])).toEqual([]);
  });

  it("los grupos de navegación cubren las secciones principales", () => {
    const todas = GRUPOS_NAVEGACION.flatMap((g) => g.secciones);
    expect(todas).toContain("inicio");
    expect(todas).toContain("secretaria");
    expect(todas).toContain("administracion");
    expect(todas).toContain("estadisticas");
  });
});

describe("permisos por módulo sobre bloques de rol", () => {
  it("la oficialidad y el director acceden a estadísticas por defecto, pero el bombero raso no", () => {
    expect(puedeVer(["capitan"], "estadisticas")).toBe(true);
    expect(puedeVer(["director"], "estadisticas")).toBe(true);
    expect(puedeVer(["bombero"], "estadisticas")).toBe(false);
    expect(nivelPermiso(["bombero"], "estadisticas")).toBe("ninguno");
  });

  it("una excepción por módulo habilita lectura o gestión a un bombero", () => {
    expect(puedeVer(["bombero"], "estadisticas", { estadisticas: "lectura" })).toBe(true);
    expect(puedeGestionar(["bombero"], "estadisticas", { estadisticas: "lectura" })).toBe(false);
    expect(puedeGestionar(["bombero"], "material", { material: "gestion" })).toBe(true);
    expect(seccionesDe(["bombero"], { estadisticas: "lectura" })).toContain("estadisticas");
  });

  it("una excepción 'ninguno' anula el bloque heredado de un oficial", () => {
    expect(puedeVer(["capitan"], "material", { material: "ninguno" })).toBe(false);
    expect(puedeGestionar(["teniente_2"], "material", { material: "lectura" })).toBe(false);
  });

  it("el usuario cuartel nunca sale de inicio aunque tenga excepciones", () => {
    expect(nivelPermiso(["cuartel"], "estadisticas", { estadisticas: "gestion" })).toBe("ninguno");
    expect(puedeVer(["cuartel"], "estadisticas", { estadisticas: "gestion" })).toBe(false);
    expect(seccionesDe(["cuartel"], { material: "gestion" })).toEqual(["inicio"]);
  });
});
