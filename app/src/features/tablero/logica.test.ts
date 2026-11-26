import { describe, expect, it } from "vitest";
import {
  citacionProxima,
  combinarCirculares,
  contarPorTipo,
  filtrarPublicaciones,
  ordenDiaVigente,
  paginarPublicaciones,
} from "./logica";
import type { PublicacionTablero } from "@/types/tipos";

const BASE: PublicacionTablero[] = [
  {
    tipo: "orden_dia",
    id: 1,
    numero: "42",
    anio: 2026,
    fecha: "2026-11-26",
    fecha_evento: null,
    hora_evento: null,
    vigente_hasta: "2026-11-27",
    titulo: "Mantención unidad M-21",
    resumen: "Revisión de bomba",
    texto: "Detalle",
    lugar: null,
    tenida: null,
    obligatoria: null,
    archivo_id: null,
    archivo_bucket: null,
    archivo_path: null,
    archivo_nombre: null,
    token_verificacion: null,
    despacho_resumen: null,
    creado_en: "2026-11-26T09:00:00Z",
  },
  {
    tipo: "citacion",
    id: 2,
    numero: "13",
    anio: 2026,
    fecha: "2026-11-26",
    fecha_evento: "2026-11-28",
    hora_evento: "19:30",
    vigente_hasta: "2026-11-28",
    titulo: "Academia de Rescate",
    resumen: "Cuartel",
    texto: "Detalle",
    lugar: "Cuartel Segunda Compañía",
    tenida: "Tenida de trabajo",
    obligatoria: true,
    archivo_id: null,
    archivo_bucket: null,
    archivo_path: null,
    archivo_nombre: null,
    token_verificacion: null,
    despacho_resumen: null,
    creado_en: "2026-11-26T09:00:00Z",
  },
  {
    tipo: "circular_cbl",
    id: 3,
    numero: "08",
    anio: 2026,
    fecha: "2026-11-20",
    fecha_evento: null,
    hora_evento: null,
    vigente_hasta: null,
    titulo: "Circular CBL Claves Radiales",
    resumen: "Normativa",
    texto: "Detalle",
    lugar: null,
    tenida: null,
    obligatoria: null,
    archivo_id: null,
    archivo_bucket: null,
    archivo_path: null,
    archivo_nombre: null,
    token_verificacion: null,
    despacho_resumen: null,
    creado_en: "2026-11-20T09:00:00Z",
  },
];

describe("logica del Tablero de Cuartel", () => {
  it("identifica orden del día vigente y citaciones próximas", () => {
    expect(ordenDiaVigente(BASE[0], "2026-11-26")).toBe(true);
    expect(ordenDiaVigente(BASE[0], "2026-11-28")).toBe(false);
    expect(citacionProxima(BASE[1], "2026-11-26")).toBe(true);
    expect(citacionProxima(BASE[1], "2026-11-29")).toBe(false);
  });

  it("filtra por categoría y búsqueda ignorando acentos", () => {
    expect(filtrarPublicaciones(BASE, "citacion", "")).toHaveLength(1);
    expect(filtrarPublicaciones(BASE, "todas", "mantencion")).toHaveLength(1);
    expect(filtrarPublicaciones(BASE, "todas", "tenida de trabajo")).toHaveLength(1);
  });

  it("cuenta correctamente las publicaciones por tipo", () => {
    const c = contarPorTipo(BASE);
    expect(c.todas).toBe(3);
    expect(c.orden_dia).toBe(1);
    expect(c.citacion).toBe(1);
    expect(c.circular_cbl).toBe(1);
    expect(c.orden_capitania).toBe(0);
  });

  it("combina circulares de compañía y CBL ordenadas por fecha descendente", () => {
    const lista: PublicacionTablero[] = [
      ...BASE,
      {
        ...BASE[2],
        tipo: "circular_compania",
        id: 9,
        numero: "14",
        fecha: "2026-11-25",
        titulo: "Circular interna",
      },
    ];
    const circulares = combinarCirculares(lista);
    expect(circulares).toHaveLength(2);
    expect(circulares[0].id).toBe(9);
    expect(circulares[1].id).toBe(3);
  });

  it("pagina publicaciones sin desbordar el rango", () => {
    const p1 = paginarPublicaciones([1, 2, 3, 4, 5], 0, 3);
    expect(p1).toEqual({ visibles: [1, 2, 3], totalPaginas: 2, paginaActual: 0 });
    const p2 = paginarPublicaciones([1, 2, 3, 4, 5], 10, 3);
    expect(p2).toEqual({ visibles: [4, 5], totalPaginas: 2, paginaActual: 1 });
  });
});
