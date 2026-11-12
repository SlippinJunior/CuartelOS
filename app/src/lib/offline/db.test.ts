import { beforeEach, describe, expect, it } from "vitest";
import {
  cachearLista,
  claveMarca,
  contarPendientes,
  guardarMarcaLocal,
  leerListaLocal,
  limpiarCache,
  marcarSincronizada,
  pendientesDeLista,
} from "@/lib/offline/db";
import type { Asistencia, Lista, Persona } from "@/types/tipos";

const lista = {
  id: 1,
  compania_id: 1,
  anio: 2026,
  numero: 1,
  fecha: "2026-11-10",
  tipo_acto_clave: "RO",
  descripcion: "Reunión",
  direccion: null,
  estado: "borrador",
  es_abono: false,
  abono_justificacion: null,
  origen: "manual",
  cerrada_en: null,
  enviada_en: null,
} as Lista;

const personas = [
  { id: "p1", registro: 1, nombres: "Ana", apellido_paterno: "Pérez", apellido_materno: null, rango: "bombero", estado: "activo" },
  { id: "p2", registro: 2, nombres: "Luis", apellido_paterno: "Soto", apellido_materno: null, rango: "bombero", estado: "activo" },
] as Persona[];

const marcas = [
  { lista_id: 1, persona_id: "p1", marca: "A", observacion: null, registrado_por: null, registrado_en: "", actualizado_en: "" },
] as Asistencia[];

describe("cola offline del pase de lista", () => {
  beforeEach(async () => {
    await limpiarCache();
  });

  it("cachea la lista, personas y marcas", async () => {
    await cachearLista(lista, personas, marcas);
    const local = await leerListaLocal(1);
    expect(local?.lista.numero).toBe(1);
    expect(local?.personas).toHaveLength(2);
    expect(local?.marcas).toHaveLength(1);
  });

  it("guarda marcas pendientes y las cuenta", async () => {
    await cachearLista(lista, personas, marcas);
    await guardarMarcaLocal(1, "p1", "F");
    await guardarMarcaLocal(1, "p2", "A");
    expect(await contarPendientes()).toBe(2);

    const local = await leerListaLocal(1);
    const p1 = local?.marcas.find((m) => m.persona_id === "p1");
    expect(p1?.marca).toBe("F");
    expect(p1?.pendiente).toBe(true);
  });

  it("marca una fila como sincronizada", async () => {
    await guardarMarcaLocal(1, "p1", "A");
    await marcarSincronizada(claveMarca(1, "p1"));
    expect(await contarPendientes()).toBe(0);
    const pendientes = await pendientesDeLista(1);
    expect(pendientes).toHaveLength(0);
  });

  it("no pisa marcas pendientes al refrescar desde el servidor", async () => {
    await cachearLista(lista, personas, marcas);
    await guardarMarcaLocal(1, "p1", "F");
    await cachearLista(lista, personas, marcas);
    const local = await leerListaLocal(1);
    expect(local?.marcas.find((m) => m.persona_id === "p1")?.marca).toBe("F");
  });
});
