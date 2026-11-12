import { corsHeaders, json } from "../_shared/cors.ts";
import { autenticar, clienteAdmin, rolPermitido } from "../_shared/clientes.ts";

/**
 * Invita a un usuario por correo y lo vincula con una persona de la compañía.
 * Body: { email, persona_id, rol }
 * Solo Director o admin.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const { cliente, user, error: authError } = await autenticar(req);
    if (!user) return json({ error: "Sesión no válida", detalle: authError?.message }, 401);

    const { data: perfil } = await cliente.schema("nucleo").rpc("mi_perfil");
    if (!rolPermitido(perfil, ["director", "admin"])) {
      return json({ error: "Solo Director o admin pueden invitar usuarios." }, 403);
    }

    const { email, persona_id, rol } = await req.json();
    if (!email || !persona_id) return json({ error: "Faltan email o persona_id." }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Correo inválido." }, 400);

    const admin = clienteAdmin();
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

    const { data: invitacion, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/establecer`,
      data: { persona_id },
    });
    if (inviteError) return json({ error: inviteError.message }, 400);

    const userId = invitacion.user?.id;
    if (!userId) return json({ error: "Supabase no devolvió el usuario invitado." }, 500);

    const { error: vinculoError } = await admin.schema("nucleo").rpc("registrar_usuario", {
      p_user_id: userId,
      p_email: email,
      p_persona_id: persona_id,
      p_rol: rol ?? "bombero",
      p_motivo: "Invitación desde Administración",
    });
    if (vinculoError) return json({ error: vinculoError.message }, 400);

    return json({ user_id: userId, email, invitado: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
