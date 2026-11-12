export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Tabla = {
  Row: any;
  Insert: any;
  Update: any;
  Relationships: [];
};

type Vista = { Row: any; Relationships: [] };
type Funcion = { Args: any; Returns: any };

interface Esquema {
  Tables: Record<string, Tabla>;
  Views: Record<string, Vista>;
  Functions: Record<string, Funcion>;
  Enums: Record<string, string>;
  CompositeTypes: Record<string, { Returns: any }>;
}

/**
 * Tipos de la base. En un proyecto conectado se regenera con:
 *   supabase gen types typescript --local > app/src/types/database.ts
 * Mientras no haya CLI disponible, este archivo mantiene la forma que
 * Supabase espera y los tipos de negocio viven en `types/tipos.ts`.
 */
export interface Database {
  public: Esquema;
  nucleo: Esquema;
  personal: Esquema;
  asistencia: Esquema;
  operaciones: Esquema;
  material: Esquema;
  tesoreria: Esquema;
  secretaria: Esquema;
  disciplina: Esquema;
  documentos: Esquema;
}
