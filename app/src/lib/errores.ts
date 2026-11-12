import type { PostgrestError } from "@supabase/supabase-js";

export function mensajeError(error: unknown): string {
  if (!error) return "Ocurrió un error inesperado.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  const pg = error as PostgrestError;
  if (pg.message) {
    if (pg.code === "42501") return "No tienes permisos para esta acción.";
    if (pg.code === "23505") return "Ese registro ya existe.";
    if (pg.code === "23514") return "Los datos no cumplen una regla de la compañía.";
    if (pg.code === "23503") return "El registro está vinculado a otros datos.";
    if (pg.code === "PGRST116") return "No se encontró el registro.";
    return pg.message;
  }
  return "Ocurrió un error inesperado.";
}
