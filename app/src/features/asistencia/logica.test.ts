import { describe, expect, it } from "vitest";
import {
  calcularFilaLibro,
  CLASE_CELDA_LIBRO,
  etiquetaCategoriaClave,
  exportarLibroCsv,
} from "@/features/asistencia/logica";
import type { LibroAnualData, LibroAnualLista, LibroAnualPersona } from "@/types/tipos";

const listas: LibroAnualLista[] = [
  { id: 1, numero: 1, fecha: "2026-01-01", clave: "15-2", descripcion: "Clave 15-2", categoria: "emergencia", estado: "enviada", comentarios: null },
  { id: 2, numero: 2, fecha: "2026-01-04", clave: "2", descripcion: "Academia", categoria: "academia", estado: "enviada", comentarios: null },
  { id: 3, numero: 3, fecha: "2026-01-10", clave: "10-1", descripcion: "Incendio", categoria: "emergencia", estado: "enviada", comentarios: null },
  { id: 4, numero: 4, fecha: "2026-02-01", clave: "RO", descripcion: "Reunión Ordinaria", categoria: "reunion", estado: "enviada", comentarios: null },
  { id: 5, numero: 5, fecha: "2026-02-15", clave: "5", descripcion: "Citación", categoria: "citacion", estado: "enviada", comentarios: null },
  { id: 6, numero: 6, fecha: "2026-03-01", clave: "1", descripcion: "Llamado", categoria: "citacion", estado: "enviada", comentarios: null },
];

describe("Libro de Asistencia 2026", () => {
  it("calcula el acumulado correlativo de asistencias (1, 2, 3...) y respeta F/R/P", () => {
    const persona: LibroAnualPersona = {
      persona_id: "p1",
      registro: 208,
      nombre: "Gonzalo Mena",
      fecha_ingreso: "1991-06-09",
      cargo_grado: "2-2",
      estado: "activo",
      marcas: { "1": "A", "2": "F", "3": "A", "4": "R", "5": "P", "6": "A" },
    };
    const res = calcularFilaLibro(persona, listas);
    expect(res.total).toBe(3);
    expect(res.celdas.map((c) => c.texto)).toEqual(["1", "F", "2", "R", "P", "3"]);
    expect(res.celdas[0].clase).toBe(CLASE_CELDA_LIBRO.A);
    expect(res.celdas[1].clase).toBe(CLASE_CELDA_LIBRO.F);
    expect(res.celdas[3].clase).toBe(CLASE_CELDA_LIBRO.R);
    expect(res.celdas[4].clase).toBe(CLASE_CELDA_LIBRO.P);
  });

  it("muestra N/A para listas anteriores a la fecha de ingreso", () => {
    const persona: LibroAnualPersona = {
      persona_id: "p2",
      registro: 264,
      nombre: "Ignacio Torres",
      fecha_ingreso: "2026-01-20",
      cargo_grado: "Bombero",
      estado: "activo",
      marcas: { "1": "F", "2": "F", "3": "F", "4": "A", "5": "A" },
    };
    const res = calcularFilaLibro(persona, listas);
    expect(res.total).toBe(2);
    expect(res.celdas.slice(0, 3).map((c) => c.texto)).toEqual(["N/A", "N/A", "N/A"]);
    expect(res.celdas[3].texto).toBe("1");
    expect(res.celdas[4].texto).toBe("2");
    expect(res.celdas[5].texto).toBe("—");
  });

  it("exporta CSV con encabezados del libro y totales", () => {
    const data: LibroAnualData = {
      anio: 2026,
      listas: listas.slice(0, 2),
      personas: [
        {
          persona_id: "p1",
          registro: 208,
          nombre: "Gonzalo Mena",
          fecha_ingreso: "1991-06-09",
          cargo_grado: "2-2",
          estado: "activo",
          marcas: { "1": "A", "2": "F" },
        },
      ],
    };
    const csv = exportarLibroCsv(data);
    expect(csv).toContain("Registro,Bombero,Ingreso,Cargo/Grado,Total,L1 (15-2),L2 (2)");
    expect(csv).toContain("208,Gonzalo Mena,1991-06-09,2-2,1,1,F");
  });

  it("etiqueta categorías de claves", () => {
    expect(etiquetaCategoriaClave("emergencia")).toBe("Emergencia");
    expect(etiquetaCategoriaClave("reunion")).toBe("Reunión");
    expect(etiquetaCategoriaClave("academia")).toBe("Academia");
  });
});
