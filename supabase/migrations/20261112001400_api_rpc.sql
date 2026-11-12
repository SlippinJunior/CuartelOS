-- =====================================================================
-- 20261112001400 · RPC expuestas a la aplicación
-- =====================================================================
set search_path = nucleo, seguridad, personal, public;

-- ---------------------------------------------------------------------
-- Identidad y roles
-- ---------------------------------------------------------------------
create or replace function nucleo.mis_roles()
returns table (rol text)
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select r.rol::text
  from seguridad.usuario u
  join seguridad.usuario_rol r on r.user_id = u.user_id
  where u.user_id = auth.uid()
    and u.activo
    and r.desde <= current_date
    and (r.hasta is null or r.hasta >= current_date)
  order by r.rol
$$;

create or replace function nucleo.mi_perfil()
returns jsonb
language sql
stable
security definer
set search_path = seguridad, personal, nucleo, public
as $$
  select jsonb_build_object(
    'usuario_id', auth.uid(),
    'email', u.email,
    'activo', u.activo,
    'persona', case when p.id is null then null else jsonb_build_object(
      'id', p.id, 'registro', p.registro,
      'nombres', p.nombres, 'apellido_paterno', p.apellido_paterno,
      'apellido_materno', p.apellido_materno,
      'nombre', p.nombres || ' ' || p.apellido_paterno,
      'rango', p.rango, 'estado', p.estado, 'email', p.email
    ) end,
    'roles', coalesce((
      select jsonb_agg(r.rol::text order by r.rol)
      from seguridad.usuario_rol r
      where r.user_id = u.user_id and r.desde <= current_date
        and (r.hasta is null or r.hasta >= current_date)
    ), '[]'::jsonb),
    'es_oficial', seguridad.es_oficial(),
    'es_admin', seguridad.es_admin(),
    'compania', (
      select jsonb_build_object('id', c.id, 'nombre', c.nombre, 'cuerpo', c.cuerpo, 'lema', c.lema)
      from nucleo.compania c order by c.id limit 1
    ),
    'consentimiento', (
      select jsonb_build_object(
        'version', t.version,
        'titulo', t.titulo,
        'texto', t.texto,
        'aceptado', exists (
          select 1 from seguridad.consentimiento co
          where co.usuario_id = u.user_id and co.texto_id = t.id
        )
      )
      from seguridad.consentimiento_texto t
      where t.vigente
      limit 1
    )
  )
  from seguridad.usuario u
  left join personal.persona p on p.id = u.persona_id
  where u.user_id = auth.uid()
$$;
comment on function nucleo.mi_perfil() is 'Perfil de la sesión: persona, roles, compañía y estado del consentimiento.';

-- ---------------------------------------------------------------------
-- Consentimiento
-- ---------------------------------------------------------------------
create or replace function nucleo.aceptar_consentimiento(p_version integer default null)
returns void
language plpgsql
security definer
set search_path = seguridad, nucleo, public
as $$
declare
  v_texto seguridad.consentimiento_texto;
  v_headers jsonb;
  v_ip inet;
  v_ua text;
begin
  if auth.uid() is null then
    raise exception 'Sesión no autenticada.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_texto
  from seguridad.consentimiento_texto
  where vigente and (p_version is null or version = p_version)
  limit 1;

  if not found then
    raise exception 'No hay un texto de consentimiento vigente para la versión indicada.';
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    v_ip := nullif(v_headers->>'x-forwarded-for', '')::inet;
    v_ua := v_headers->>'user-agent';
  exception when others then
    v_ip := null; v_ua := null;
  end;

  insert into seguridad.consentimiento (usuario_id, texto_id, ip, user_agent)
  values (auth.uid(), v_texto.id, v_ip, v_ua)
  on conflict (usuario_id, texto_id) do nothing;
end
$$;
comment on function nucleo.aceptar_consentimiento(integer) is 'Registra la aceptación del consentimiento vigente.';

-- ---------------------------------------------------------------------
-- Administración de usuarios y roles
-- ---------------------------------------------------------------------
create or replace function nucleo.admin_asignar_rol(
  p_user_id uuid,
  p_rol text,
  p_desde date default current_date,
  p_hasta date default null,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = seguridad, public
as $$
begin
  if not seguridad.puede_administrar_usuarios() then
    raise exception 'Solo Director o admin pueden asignar roles.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from seguridad.usuario where user_id = p_user_id) then
    raise exception 'El usuario no existe en seguridad.usuario.';
  end if;

  insert into seguridad.usuario_rol (user_id, rol, desde, hasta, motivo, asignado_por)
  values (p_user_id, p_rol::seguridad.rol, coalesce(p_desde, current_date), p_hasta, p_motivo, auth.uid())
  on conflict (user_id, rol, desde) do update
    set hasta = excluded.hasta, motivo = excluded.motivo;
end
$$;

create or replace function nucleo.admin_revocar_rol(
  p_user_id uuid,
  p_rol text,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = seguridad, public
as $$
begin
  if not seguridad.puede_administrar_usuarios() then
    raise exception 'Solo Director o admin pueden revocar roles.' using errcode = 'insufficient_privilege';
  end if;
  update seguridad.usuario_rol
     set hasta = current_date - 1, motivo = coalesce(p_motivo, motivo)
   where user_id = p_user_id and rol = p_rol::seguridad.rol and hasta is null;
end
$$;

create or replace function nucleo.listar_usuarios()
returns table (
  user_id uuid,
  email text,
  persona_id uuid,
  nombre text,
  registro integer,
  activo boolean,
  roles text[]
)
language sql
stable
security definer
set search_path = seguridad, personal, public
as $$
  select u.user_id, u.email, u.persona_id,
         case when p.id is null then null else p.nombres || ' ' || p.apellido_paterno end,
         p.registro, u.activo,
         coalesce(array_agg(r.rol::text order by r.rol) filter (where r.rol is not null), '{}')
  from seguridad.usuario u
  left join personal.persona p on p.id = u.persona_id
  left join seguridad.usuario_rol r on r.user_id = u.user_id
    and r.desde <= current_date and (r.hasta is null or r.hasta >= current_date)
  where seguridad.puede_administrar_usuarios()
  group by u.user_id, u.email, u.persona_id, p.id, p.nombres, p.apellido_paterno, p.registro, u.activo
$$;

-- ---------------------------------------------------------------------
-- Panel de inicio
-- ---------------------------------------------------------------------
create or replace function nucleo.panel_inicio()
returns jsonb
language sql
stable
security definer
set search_path = nucleo, seguridad, asistencia, tesoreria, personal, public
as $$
  select jsonb_build_object(
    'alertas', case when seguridad.es_oficial() then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'regla', a.regla, 'severidad', a.severidad,
        'detalle', a.detalle, 'entidad', a.entidad, 'entidad_id', a.entidad_id,
        'detectada_en', a.detectada_en) order by a.severidad, a.detectada_en desc)
      from nucleo.alerta a
      where a.estado = 'abierta'
      limit 10
    ), '[]'::jsonb) else '[]'::jsonb end,
    'tareas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'tipo', 'lista', 'id', l.id,
        'titulo', format('Lista %s-%s del %s (%s)', l.anio, l.numero, l.fecha, l.estado),
        'vence', (l.fecha + interval '48 hours'),
        'ruta', '/asistencia/' || l.id) order by l.fecha)
      from asistencia.lista l
      where seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
        and ((l.estado = 'borrador' and l.fecha < current_date)
             or l.estado = 'cerrada')
      limit 10
    ), '[]'::jsonb),
    'compromisos_pendientes', case when seguridad.es_oficial() then (
      select count(*) from tesoreria.compromiso c where c.estado in ('comprometido', 'devengado')
    ) else 0 end,
    'es_oficial', seguridad.es_oficial(),
    'roles', coalesce((
      select jsonb_agg(r.rol::text)
      from seguridad.usuario_rol r
      where r.user_id = auth.uid() and r.desde <= current_date
        and (r.hasta is null or r.hasta >= current_date)
    ), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------
-- Parámetros
-- ---------------------------------------------------------------------
create or replace function nucleo.guardar_parametro(p_clave text, p_valor jsonb)
returns void
language plpgsql
security definer
set search_path = nucleo, seguridad, public
as $$
begin
  if not seguridad.tiene_rol('admin', 'director') then
    raise exception 'Solo Director o admin pueden cambiar parámetros.' using errcode = 'insufficient_privilege';
  end if;
  insert into nucleo.parametro (clave, valor, actualizado_por)
  values (p_clave, p_valor, auth.uid())
  on conflict (clave) do update
    set valor = excluded.valor, actualizado_por = auth.uid();
end
$$;


create or replace function nucleo.registrar_usuario(
  p_user_id uuid,
  p_email text,
  p_persona_id uuid,
  p_rol text default 'bombero',
  p_motivo text default 'Invitación'
)
returns void
language plpgsql
security definer
set search_path = seguridad, public
as $$
begin
  if not (seguridad.puede_administrar_usuarios() or auth.role() = 'service_role') then
    raise exception 'Solo Director, admin o la Edge Function pueden registrar usuarios.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into seguridad.usuario (user_id, persona_id, email, invitado_en, activo)
  values (p_user_id, p_persona_id, p_email, now(), true)
  on conflict (user_id) do update
    set persona_id = excluded.persona_id,
        email = excluded.email,
        activo = true;

  insert into seguridad.usuario_rol (user_id, rol, desde, motivo)
  values (p_user_id, p_rol::seguridad.rol, current_date, p_motivo)
  on conflict (user_id, rol, desde) do nothing;
end
$$;
comment on function nucleo.registrar_usuario(uuid, text, uuid, text, text) is 'Vincula una cuenta de Auth con una persona y le asigna un rol inicial. Uso de la Edge Function invitar-usuario.';

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
grant execute on function nucleo.mis_roles() to authenticated;
grant execute on function nucleo.mi_perfil() to authenticated;
grant execute on function nucleo.aceptar_consentimiento(integer) to authenticated;
grant execute on function nucleo.admin_asignar_rol(uuid, text, date, date, text) to authenticated;
grant execute on function nucleo.admin_revocar_rol(uuid, text, text) to authenticated;
grant execute on function nucleo.listar_usuarios() to authenticated;
grant execute on function nucleo.panel_inicio() to authenticated;
grant execute on function nucleo.guardar_parametro(text, jsonb) to authenticated;
grant execute on function nucleo.registrar_usuario(uuid, text, uuid, text, text) to authenticated, service_role;
