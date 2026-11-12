import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "anon-key-no-configurada";

/**
 * Indica si las variables de entorno están presentes y si la clave parece
 * una ANON_KEY real (JWT). La PUBLISHABLE_KEY nueva no funciona para las
 * llamadas anónimas de PostgREST con esta versión del cliente.
 */
export const hayConfiguracion = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    String(import.meta.env.VITE_SUPABASE_ANON_KEY).split(".").length === 3 &&
    String(import.meta.env.VITE_SUPABASE_ANON_KEY).startsWith("eyJ"),
);

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: { "x-application-name": "erp-segunda-compania" },
  },
});

/**
 * Cliente por esquema. PostgreSQL impone RLS; el esquema nunca cambia la
 * seguridad, solo la ruta de PostgREST.
 */
export const db = {
  nucleo: supabase.schema("nucleo"),
  personal: supabase.schema("personal"),
  asistencia: supabase.schema("asistencia"),
  operaciones: supabase.schema("operaciones"),
  material: supabase.schema("material"),
  tesoreria: supabase.schema("tesoreria"),
  secretaria: supabase.schema("secretaria"),
  disciplina: supabase.schema("disciplina"),
  documentos: supabase.schema("documentos"),
};

export type ClienteEsquema = typeof db.personal;
