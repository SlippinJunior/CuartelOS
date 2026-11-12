/**
 * Cliente HTTP mínimo para Edge Functions, sin dependencias externas.
 * Usa directamente Auth, PostgREST y Storage, de modo que la función
 * arranca aunque el contenedor no tenga salida a esm.sh/npm.
 */

const URL_BASE = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function hayServicio(): boolean {
  return Boolean(SERVICIO);
}

function cabeceras(opciones: {
  authorization: string;
  key?: string;
  esquema?: string;
  contentType?: string;
  extra?: Record<string, string>;
}): HeadersInit {
  const headers: Record<string, string> = {
    apikey: opciones.key ?? ANON,
    Authorization: opciones.authorization,
  };
  if (opciones.contentType) headers["Content-Type"] = opciones.contentType;
  if (opciones.esquema) {
    headers["Accept-Profile"] = opciones.esquema;
    headers["Content-Profile"] = opciones.esquema;
  }
  return { ...headers, ...(opciones.extra ?? {}) };
}

async function leer(resp: Response) {
  const texto = await resp.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

export interface Sesion {
  user: { id: string; email?: string } | null;
  authorization: string;
  error: string | null;
}

/** Valida el JWT del llamador contra Auth. */
export async function autenticar(req: Request): Promise<Sesion> {
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization) return { user: null, authorization, error: "Falta Authorization" };

  const resp = await fetch(`${URL_BASE}/auth/v1/user`, {
    headers: cabeceras({ authorization }),
  });

  if (!resp.ok) {
    return { user: null, authorization, error: (await leer(resp))?.msg ?? "Sesión inválida" };
  }
  const user = await leer(resp);
  return { user, authorization, error: null };
}

/** Llama a una RPC de PostgREST en un esquema expuesto. */
export async function rpc(
  esquema: string,
  funcion: string,
  args: Record<string, unknown>,
  opciones: { authorization: string; servicio?: boolean },
): Promise<{ data: any; error: string | null }> {
  const authorization = opciones.servicio ? `Bearer ${SERVICIO}` : opciones.authorization;
  const resp = await fetch(`${URL_BASE}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: cabeceras({
      authorization,
      key: opciones.servicio ? SERVICIO : ANON,
      esquema,
      contentType: "application/json",
    }),
    body: JSON.stringify(args),
  });
  const data = await leer(resp);
  if (!resp.ok) {
    return { data: null, error: data?.message ?? `Error ${resp.status} en ${funcion}` };
  }
  return { data, error: null };
}

/** SELECT de PostgREST en un esquema expuesto. */
export async function seleccionar(
  esquema: string,
  tabla: string,
  query: string,
  opciones: { authorization: string; servicio?: boolean },
): Promise<{ data: any; error: string | null }> {
  const authorization = opciones.servicio ? `Bearer ${SERVICIO}` : opciones.authorization;
  const resp = await fetch(`${URL_BASE}/rest/v1/${tabla}?${query}`, {
    headers: cabeceras({
      authorization,
      key: opciones.servicio ? SERVICIO : ANON,
      esquema,
      extra: { Accept: "application/json" },
    }),
  });
  const data = await leer(resp);
  if (!resp.ok) {
    return { data: null, error: data?.message ?? `Error ${resp.status} en ${tabla}` };
  }
  return { data, error: null };
}

export async function invitarPorCorreo(
  email: string,
  redirectTo: string,
  metadata: Record<string, unknown>,
): Promise<{ user: { id: string } | null; error: string | null }> {
  const resp = await fetch(`${URL_BASE}/auth/v1/invite`, {
    method: "POST",
    headers: cabeceras({
      authorization: `Bearer ${SERVICIO}`,
      key: SERVICIO,
      contentType: "application/json",
    }),
    body: JSON.stringify({ email, data: metadata, redirect_to: redirectTo }),
  });
  const data = await leer(resp);
  if (!resp.ok) return { user: null, error: data?.msg ?? data?.message ?? "No se pudo invitar" };
  return { user: data, error: null };
}

export async function subirArchivo(
  bucket: string,
  ruta: string,
  bytes: Uint8Array,
  mime: string,
): Promise<{ error: string | null }> {
  const resp = await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${ruta}`, {
    method: "POST",
    headers: cabeceras({
      authorization: `Bearer ${SERVICIO}`,
      key: SERVICIO,
      contentType: mime,
      extra: { "x-upsert": "true" },
    }),
    body: bytes,
  });
  if (!resp.ok) {
    const data = await leer(resp);
    return { error: data?.message ?? `Error ${resp.status} al subir` };
  }
  return { error: null };
}

export async function urlFirmada(
  bucket: string,
  ruta: string,
  segundos = 3600,
): Promise<string | null> {
  const resp = await fetch(`${URL_BASE}/storage/v1/object/sign/${bucket}/${ruta}`, {
    method: "POST",
    headers: cabeceras({
      authorization: `Bearer ${SERVICIO}`,
      key: SERVICIO,
      contentType: "application/json",
    }),
    body: JSON.stringify({ expiresIn: segundos }),
  });
  if (!resp.ok) return null;
  const data = await leer(resp);
  return data?.signedURL ? `${URL_BASE}/storage/v1${data.signedURL}` : null;
}

export function rolPermitido(perfil: unknown, roles: string[]): boolean {
  const p = perfil as { roles?: string[] } | null;
  return Boolean(p?.roles?.some((r) => roles.includes(r) || r === "admin"));
}

/** INSERT de PostgREST en un esquema expuesto. Devuelve la fila creada. */
export async function insertar(
  esquema: string,
  tabla: string,
  datos: Record<string, unknown>,
  opciones: { authorization: string; servicio?: boolean },
): Promise<{ data: any; error: string | null }> {
  const authorization = opciones.servicio ? `Bearer ${SERVICIO}` : opciones.authorization;
  const resp = await fetch(`${URL_BASE}/rest/v1/${tabla}`, {
    method: "POST",
    headers: cabeceras({
      authorization,
      key: opciones.servicio ? SERVICIO : ANON,
      esquema,
      contentType: "application/json",
      extra: { Prefer: "return=representation" },
    }),
    body: JSON.stringify(datos),
  });
  const data = await leer(resp);
  if (!resp.ok) {
    return { data: null, error: data?.message ?? `Error ${resp.status} al insertar en ${tabla}` };
  }
  return { data, error: null };
}

/** UPDATE de PostgREST con un filtro ya armado (por ejemplo `id=eq.3`). */
export async function actualizar(
  esquema: string,
  tabla: string,
  filtro: string,
  datos: Record<string, unknown>,
  opciones: { authorization: string; servicio?: boolean },
): Promise<{ error: string | null }> {
  const authorization = opciones.servicio ? `Bearer ${SERVICIO}` : opciones.authorization;
  const resp = await fetch(`${URL_BASE}/rest/v1/${tabla}?${filtro}`, {
    method: "PATCH",
    headers: cabeceras({
      authorization,
      key: opciones.servicio ? SERVICIO : ANON,
      esquema,
      contentType: "application/json",
      extra: { Prefer: "return=minimal" },
    }),
    body: JSON.stringify(datos),
  });
  if (!resp.ok) {
    const data = await leer(resp);
    return { error: data?.message ?? `Error ${resp.status} al actualizar ${tabla}` };
  }
  return { error: null };
}
