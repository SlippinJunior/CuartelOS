import Dexie, { type EntityTable } from "dexie";
import type { Asistencia, Lista, Marca, Persona } from "@/types/tipos";

export interface ListaLocal {
  id: number;
  datos: Lista;
  actualizadoEn: number;
}

export interface PersonaLocal {
  id: string;
  datos: Persona;
  actualizadoEn: number;
}

export interface MarcaLocal {
  clave: string;
  lista_id: number;
  persona_id: string;
  marca: Marca;
  observacion: string | null;
  pendiente: boolean;
  actualizadoEn: number;
}

const db = new Dexie("erp-offline") as Dexie & {
  listas: EntityTable<ListaLocal, "id">;
  personas: EntityTable<PersonaLocal, "id">;
  marcas: EntityTable<MarcaLocal, "clave">;
};

db.version(1).stores({
  listas: "id, actualizadoEn",
  personas: "id, registro, actualizadoEn",
  marcas: "clave, lista_id, pendiente",
});

export { db as offlineDB };

export function claveMarca(listaId: number, personaId: string) {
  return `${listaId}:${personaId}`;
}

export async function cachearLista(lista: Lista, personas: Persona[], marcas: Asistencia[]) {
  const ahora = Date.now();
  await db.transaction("rw", db.listas, db.personas, db.marcas, async () => {
    await db.listas.put({ id: lista.id, datos: lista, actualizadoEn: ahora });
    if (personas.length) {
      await db.personas.bulkPut(
        personas.map((p) => ({ id: p.id, datos: p, actualizadoEn: ahora })),
      );
    }
    const existentes = await db.marcas.where("lista_id").equals(lista.id).toArray();
    const pendientes = new Map(existentes.filter((m) => m.pendiente).map((m) => [m.clave, m]));
    const filas: MarcaLocal[] = marcas.map((m) => ({
      clave: claveMarca(lista.id, m.persona_id),
      lista_id: lista.id,
      persona_id: m.persona_id,
      marca: m.marca,
      observacion: m.observacion,
      pendiente: false,
      actualizadoEn: ahora,
    }));
    // Las marcas pendientes locales no se pisan con la copia del servidor.
    for (const [clave, local] of pendientes) {
      const i = filas.findIndex((f) => f.clave === clave);
      if (i >= 0) filas[i] = local;
      else filas.push(local);
    }
    if (filas.length) await db.marcas.bulkPut(filas);
  });
}

export async function leerListaLocal(listaId: number) {
  const lista = await db.listas.get(listaId);
  if (!lista) return null;
  const marcas = await db.marcas.where("lista_id").equals(listaId).toArray();
  const personas = await db.personas.toArray();
  return { lista: lista.datos, personas: personas.map((p) => p.datos), marcas };
}

export async function guardarMarcaLocal(
  listaId: number,
  personaId: string,
  marca: Marca,
  observacion: string | null = null,
) {
  await db.marcas.put({
    clave: claveMarca(listaId, personaId),
    lista_id: listaId,
    persona_id: personaId,
    marca,
    observacion,
    pendiente: true,
    actualizadoEn: Date.now(),
  });
}

export async function marcarSincronizada(clave: string) {
  await db.marcas.update(clave, { pendiente: false });
}

export async function pendientesDeLista(listaId: number) {
  return db.marcas.where("lista_id").equals(listaId).filter((m) => m.pendiente).toArray();
}

export async function contarPendientes(): Promise<number> {
  return db.marcas.filter((m) => m.pendiente).count();
}

export async function limpiarCache() {
  await db.delete();
  await db.open();
}
