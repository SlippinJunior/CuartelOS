import { describe, expect, it } from "vitest";
import {
  agruparAsignaciones,
  cantidadLegible,
  describirArticulo,
  esGestorMaterial,
  esTenienteSegundo,
  etiquetaEstadoSolicitud,
  etiquetaTipoBitacora,
  puedeEditarBitacora,
  puedeResolverSolicitud,
  puedeVerInventarioBomberos,
  solicitudAbierta,
  solicitudCancelable,
} from "@/features/material/logica";
import type { AsignacionMaterial } from "@/types/tipos";

const asignacion = (persona_id: string, persona: string, registro: number, articulo: string): AsignacionMaterial => ({
  id: registro * 10 + articulo.length,
  persona_id,
  registro,
  persona,
  rango: "bombero",
  articulo_id: 1,
  articulo,
  cantidad: 1,
  talla: "L",
  fecha_entrega: "2026-03-01",
  fecha_devolucion: null,
  origen: "compania",
  observacion: null,
});

describe("roles del pañol", () => {
  it("solo el Teniente 2° y el admin resuelven solicitudes", () => {
    expect(puedeResolverSolicitud(["teniente_2"])).toBe(true);
    expect(puedeResolverSolicitud(["admin"])).toBe(true);
    expect(puedeResolverSolicitud(["capitan"])).toBe(false);
    expect(puedeResolverSolicitud(["bombero"])).toBe(false);
  });

  it("la oficialidad ve el inventario de los bomberos, no así el bombero", () => {
    for (const rol of ["capitan", "teniente_1", "teniente_3", "ayudante", "director"]) {
      expect(puedeVerInventarioBomberos([rol])).toBe(true);
    }
    expect(puedeVerInventarioBomberos(["bombero"])).toBe(false);
    expect(puedeVerInventarioBomberos(["consejo"])).toBe(false);
  });

  it("reconoce al Teniente 2° con roles combinados", () => {
    expect(esTenienteSegundo(["bombero", "teniente_2"])).toBe(true);
  });
});

describe("estados de la solicitud", () => {
  it("solo pendiente o aprobada admiten entrega", () => {
    expect(solicitudAbierta("pendiente")).toBe(true);
    expect(solicitudAbierta("aprobada")).toBe(true);
    expect(solicitudAbierta("entregada")).toBe(false);
  });

  it("solo la pendiente se puede cancelar", () => {
    expect(solicitudCancelable("pendiente")).toBe(true);
    expect(solicitudCancelable("aprobada")).toBe(false);
  });

  it("traduce los estados a etiquetas legibles", () => {
    expect(etiquetaEstadoSolicitud("entregada")).toBe("Entregada");
    expect(etiquetaEstadoSolicitud("desconocido")).toBe("desconocido");
  });
});

describe("presentación del pañol", () => {
  it("agrupa el EPP por persona y ordena por registro", () => {
    const grupos = agruparAsignaciones([
      asignacion("b", "Benjamín Soto", 202, "Guantes"),
      asignacion("a", "Alejandra Rojas", 201, "Casco"),
      asignacion("a", "Alejandra Rojas", 201, "Botas"),
    ]);
    expect(grupos).toHaveLength(2);
    expect(grupos[0].registro).toBe(201);
    expect(grupos[0].articulos).toHaveLength(2);
    expect(grupos[1].persona).toBe("Benjamín Soto");
  });

  it("no muestra decimales innecesarios", () => {
    expect(cantidadLegible("2.00")).toBe("2");
    expect(cantidadLegible(1.5)).toBe("1,5");
  });

  it("describe el artículo con talla y cantidad", () => {
    expect(describirArticulo("Guantes de protección", "L", 2)).toBe("Guantes de protección × 2 (talla L)");
    expect(describirArticulo("Linterna de casco", null, 1)).toBe("Linterna de casco × 1");
  });
});

describe("bitácora de unidades y gestión por módulo", () => {
  it("habilita edición de bitácora a oficialidad de material y excepciones de módulo", () => {
    expect(puedeEditarBitacora(["capitan"])).toBe(true);
    expect(puedeEditarBitacora(["teniente_3"])).toBe(true);
    expect(puedeEditarBitacora(["teniente_2"])).toBe(true);
    expect(puedeEditarBitacora(["bombero"])).toBe(false);
    expect(puedeEditarBitacora(["bombero"], { material: "gestion" })).toBe(true);
    expect(esGestorMaterial(["bombero"], { material: "gestion" })).toBe(true);
  });

  it("etiqueta tipos de bitácora", () => {
    expect(etiquetaTipoBitacora("mantencion")).toBe("Mantención");
    expect(etiquetaTipoBitacora("accidente")).toBe("Accidente");
    expect(etiquetaTipoBitacora("combustible")).toBe("Combustible");
  });
});
