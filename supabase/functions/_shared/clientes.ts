import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/** Cliente con el JWT del llamador: respeta RLS. */
export function clienteUsuario(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente de servicio: solo para operaciones internas ya autorizadas. */
export function clienteAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function autenticar(req: Request) {
  const cliente = clienteUsuario(req);
  const { data, error } = await cliente.auth.getUser();
  if (error || !data.user) return { cliente, user: null as null, error };
  return { cliente, user: data.user, error: null };
}

export function rolPermitido(perfil: unknown, roles: string[]): boolean {
  const p = perfil as { roles?: string[] } | null;
  return Boolean(p?.roles?.some((r) => roles.includes(r) || r === "admin"));
}
