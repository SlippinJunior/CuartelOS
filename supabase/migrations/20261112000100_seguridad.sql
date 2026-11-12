-- =====================================================================
-- 20261112000100 · Seguridad: usuarios, roles, consentimiento, auditoría
-- =====================================================================
set search_path = seguridad, nucleo, public;

-- ---------------------------------------------------------------------
-- Roles manuales (separados del historial de cargos)
-- ---------------------------------------------------------------------
create type seguridad.rol as enum (
  'admin', 'director', 'secretario', 'prosecretario',
  'tesorero', 'protesorero', 'capitan',
  'teniente_1', 'teniente_2', 'teniente_3',
  'ayudante', 'consejo', 'bombero'
);
comment on type seguridad.rol is 'Roles de permisos. Se asignan a mano; no se derivan del cargo.';

create table seguridad.usuario (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  persona_id   uuid unique,
  email        text,
  activo       boolean not null default true,
  invitado_en  timestamptz,
  ultimo_acceso timestamptz,
  creado_en    timestamptz not null default now()
);
comment on table seguridad.usuario is 'Cuenta del sistema (Supabase Auth) vinculada a una persona de la compañía.';
comment on column seguridad.usuario.persona_id is 'Persona asociada. La FK se agrega en la migración de personal.';

create table seguridad.usuario_rol (
  user_id     uuid not null references seguridad.usuario(user_id) on delete cascade,
  rol         seguridad.rol not null,
  desde       date not null default current_date,
  hasta       date,
  motivo      text,
  asignado_por uuid references auth.users(id),
  creado_en   timestamptz not null default now(),
  primary key (user_id, rol, desde),
  constraint usuario_rol_fechas check (hasta is null or hasta >= desde)
);
comment on table seguridad.usuario_rol is 'Historial de roles por usuario. Un rol vence solo si tiene fecha hasta.';

create index usuario_rol_usuario_idx on seguridad.usuario_rol (user_id) where hasta is null;

-- ---------------------------------------------------------------------
-- Consentimiento informado (Ley 21.719)
-- ---------------------------------------------------------------------
create table seguridad.consentimiento_texto (
  id           bigint generated always as identity primary key,
  version      integer not null unique,
  titulo       text not null,
  texto        text not null,
  vigente      boolean not null default false,
  publicado_en timestamptz not null default now()
);
comment on table seguridad.consentimiento_texto is 'Versiones del texto de consentimiento de datos personales. Si cambia el texto, se vuelve a pedir.';

create unique index consentimiento_texto_un_vigente
  on seguridad.consentimiento_texto (vigente) where vigente;

create table seguridad.consentimiento (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references seguridad.usuario(user_id) on delete cascade,
  texto_id    bigint not null references seguridad.consentimiento_texto(id),
  aceptado_en timestamptz not null default now(),
  ip          inet,
  user_agent  text,
  unique (usuario_id, texto_id)
);
comment on table seguridad.consentimiento is 'Registro de aceptación del consentimiento por versión y usuario.';

-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------
create table seguridad.auditoria (
  id          bigint generated always as identity primary key,
  esquema     text not null,
  tabla       text not null,
  fila_id     text,
  accion      text not null,
  antes       jsonb,
  despues     jsonb,
  usuario_id  uuid,
  ip          inet,
  user_agent  text,
  ocurrido_en timestamptz not null default now()
);
comment on table seguridad.auditoria is 'Bitácora de cambios. Guarda IP y agente desde request.headers (ERP §9).';
create index auditoria_tabla_idx on seguridad.auditoria (esquema, tabla, fila_id);
create index auditoria_fecha_idx on seguridad.auditoria (ocurrido_en desc);

create or replace function seguridad.fn_auditar()
returns trigger
language plpgsql
security definer
set search_path = seguridad, public
as $$
declare
  v_id text;
  v_ip inet;
  v_ua text;
  v_headers jsonb;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    v_ip  := nullif(v_headers->>'x-forwarded-for', '')::inet;
    v_ua  := v_headers->>'user-agent';
  exception when others then
    v_ip := null;
    v_ua := null;
  end;

  v_id := coalesce(
    to_jsonb(new)->>'id', to_jsonb(old)->>'id',
    nullif(concat_ws('/',
      to_jsonb(coalesce(new, old))->>'persona_id',
      to_jsonb(coalesce(new, old))->>'lista_id',
      to_jsonb(coalesce(new, old))->>'periodo'), ''),
    nullif(concat_ws('/',
      to_jsonb(coalesce(new, old))->>'unidad_id',
      to_jsonb(coalesce(new, old))->>'codigo'), '')
  );

  insert into seguridad.auditoria(esquema, tabla, fila_id, accion, antes, despues, usuario_id, ip, user_agent)
  values (
    tg_table_schema, tg_table_name, v_id, tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid(), v_ip, v_ua
  );
  return coalesce(new, old);
end
$$;
comment on function seguridad.fn_auditar() is 'Trigger de auditoría con IP tomada de request.headers (x-forwarded-for).';

-- ---------------------------------------------------------------------
-- Funciones de apoyo para RLS
-- ---------------------------------------------------------------------
create or replace function seguridad.mi_usuario_id()
returns uuid
language sql
stable
as $$ select auth.uid() $$;

create or replace function seguridad.mi_persona()
returns uuid
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select u.persona_id
  from seguridad.usuario u
  where u.user_id = auth.uid() and u.activo
$$;
comment on function seguridad.mi_persona() is 'Persona vinculada a la sesión actual.';

create or replace function seguridad.tiene_rol(variadic p_roles seguridad.rol[])
returns boolean
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select exists (
    select 1
    from seguridad.usuario u
    join seguridad.usuario_rol r on r.user_id = u.user_id
    where u.user_id = auth.uid()
      and u.activo
      and r.desde <= current_date
      and (r.hasta is null or r.hasta >= current_date)
      and (r.rol = any(p_roles) or r.rol = 'admin')
  )
$$;
comment on function seguridad.tiene_rol(seguridad.rol[]) is 'Verdadero si la sesión tiene alguno de los roles (admin siempre).';

create or replace function seguridad.es_admin()
returns boolean
language sql stable
as $$ select seguridad.tiene_rol('admin') $$;

create or replace function seguridad.es_oficial()
returns boolean
language sql stable
as $$
  select seguridad.tiene_rol(
    'director', 'secretario', 'prosecretario',
    'tesorero', 'protesorero', 'capitan',
    'teniente_1', 'teniente_2', 'teniente_3', 'ayudante'
  )
$$;
comment on function seguridad.es_oficial() is 'Oficialidad (sin consejo ni bomberos). Habilita lectura general.';

create or replace function seguridad.es_oficial_o_consejo()
returns boolean
language sql stable
as $$ select seguridad.es_oficial() or seguridad.tiene_rol('consejo') $$;

create or replace function seguridad.puede_administrar_usuarios()
returns boolean
language sql stable
as $$ select seguridad.tiene_rol('admin', 'director') $$;

create or replace function seguridad.puede_leer_sensible()
returns boolean
language sql stable
as $$ select seguridad.es_oficial() $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table seguridad.usuario             enable row level security;
alter table seguridad.usuario_rol         enable row level security;
alter table seguridad.consentimiento_texto enable row level security;
alter table seguridad.consentimiento      enable row level security;
alter table seguridad.auditoria           enable row level security;

create policy usuario_propio on seguridad.usuario
  for select using (user_id = auth.uid());
create policy usuario_admin on seguridad.usuario
  for all using (seguridad.puede_administrar_usuarios())
  with check (seguridad.puede_administrar_usuarios());

create policy roles_propios on seguridad.usuario_rol
  for select using (user_id = auth.uid());
create policy roles_admin on seguridad.usuario_rol
  for all using (seguridad.puede_administrar_usuarios())
  with check (seguridad.puede_administrar_usuarios());

create policy consentimiento_texto_lectura on seguridad.consentimiento_texto
  for select using (vigente or seguridad.puede_administrar_usuarios());
create policy consentimiento_texto_admin on seguridad.consentimiento_texto
  for all using (seguridad.puede_administrar_usuarios())
  with check (seguridad.puede_administrar_usuarios());

create policy consentimiento_propio on seguridad.consentimiento
  for select using (usuario_id = auth.uid());
create policy consentimiento_admin on seguridad.consentimiento
  for all using (seguridad.puede_administrar_usuarios())
  with check (seguridad.puede_administrar_usuarios());

create policy auditoria_director on seguridad.auditoria
  for select using (seguridad.tiene_rol('director'));
-- El consejo solo ve lo relativo a disciplina (además de sus propios roles y consentimiento).
create policy auditoria_consejo on seguridad.auditoria
  for select using (
    seguridad.tiene_rol('consejo')
    and (esquema = 'disciplina' or tabla in ('usuario_rol', 'consentimiento'))
  );

-- El esquema seguridad no expone tablas: solo se usa mediante RPC de nucleo.
revoke all on all tables in schema seguridad from anon, authenticated;
revoke all on all sequences in schema seguridad from anon, authenticated;

-- Pero las políticas RLS y las RPC necesitan ejecutar los helpers.
grant usage on schema seguridad to authenticated;
grant execute on function seguridad.mi_usuario_id() to authenticated;
grant execute on function seguridad.mi_persona() to authenticated;
grant execute on function seguridad.tiene_rol(seguridad.rol[]) to authenticated;
grant execute on function seguridad.es_admin() to authenticated;
grant execute on function seguridad.es_oficial() to authenticated;
grant execute on function seguridad.es_oficial_o_consejo() to authenticated;
grant execute on function seguridad.puede_administrar_usuarios() to authenticated;
grant execute on function seguridad.puede_leer_sensible() to authenticated;

-- Texto de consentimiento inicial (borrador; debe revisarlo el Directorio).
insert into seguridad.consentimiento_texto (version, titulo, texto, vigente)
values (
  1,
  'Consentimiento para el tratamiento de datos personales',
  'Declaro que he sido informado/a por la Segunda Compañía de Bomberos de Limache sobre el tratamiento de mis datos personales, incluidos datos sensibles de salud estrictamente necesarios para mi labor bomberil (grupo sanguíneo, alergias, condiciones médicas y contacto de emergencia). Autorizo su uso exclusivo para la gestión interna, la seguridad en actos de servicio y el cumplimiento de obligaciones legales y reglamentarias. Puedo solicitar acceso, rectificación, oposición o eliminación de mis datos conforme a la Ley 21.719. Este texto es un borrador que debe ser validado por el Directorio o asesoría legal antes de su uso con bomberos reales.',
  true
);
