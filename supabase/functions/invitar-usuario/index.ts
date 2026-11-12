import { corsHeaders, json } from "../_shared/cors.ts";
import { autenticar, invitarPorCorreo, rolPermitido, rpc } from "../_shared/clientes.ts";

/**
 * Invita a un usuario por correo y lo vincula con una persona de la compañía.
 * Body: { email, persona_id, rol }
 * Solo Director o admin.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { user, authorization, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError }, 401);

    const { data: perfil } = await rpc("nucleo", "mi_perfil", {}, { authorization });
    if (!rolPermitido(perfil, ["director", "admin"])) {
      return json({ error: "Solo Director o admin pueden invitar usuarios." }, 403);
    }

    const { email, persona_id, rol } = await req.json();
    if (!email || !persona_id) return json({ error: "Faltan email o persona_id." }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Correo inválido." }, 400);

    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
    const { user: invitado, error: inviteError } = await invitarPorCorreo(
      email,
      `${siteUrl}/auth/establecer`,
      { persona_id },
    );
    if (inviteError || !invitado?.id) {
      return json({ error: inviteError ?? "Supabase no devolvió el usuario invitado." }, 400);
    }

    const { error: vinculoError } = await rpc(
      "nucleo",
      "registrar_usuario",
      {
        p_user_id: invitado.id,
        p_email: email,
        p_persona_id: persona_id,
        p_rol: rol ?? "bombero",
        p_motivo: "Invitación desde Administración",
      },
      { authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`, servicio: true },
    );
    if (vinculoError) return json({ error: vinculoError }, 400);

    return json({ user_id: invitado.id, email, invitado: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
