-- =====================================================================
-- 20261119000200 · Sistema de guardias nocturnas por ciclos
-- =====================================================================
set search_path = operaciones, personal, nucleo, seguridad, public;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type operaciones.estado_ciclo as enum ('planificado', 'abierto', 'en_curso', 'cerrado');
create type operaciones.estado_turno as enum ('programada', 'constituida', 'firmada');
create type operaciones.charlie_modalidad as enum ('Z8', 'Z20', 'sin_maquinista');
create type operaciones.origen_integrante as enum ('inscripcion', 'asignacion_capitania', 'reemplazo', 'llegada_tardia', 'charlie_z8');
create type operaciones.estado_integrante as enum ('inscrito', 'reemplazado', 'cumplida', 'ausente');
create type operaciones.tipo_notificacion_guardia as enum ('convocatoria_semana', 'llegada_tardia', 'reemplazo', 'situacion_especial');
create type operaciones.estado_situacion_guardia as enum ('pendiente', 'aprobada', 'rechazada');

-- ---------------------------------------------------------------------
-- Ciclo de guardias (14 días: Semana 1 y Semana 2)
-- ---------------------------------------------------------------------
create table operaciones.guardia_ciclo (
  id            bigint generated always as identity primary key,
  nombre        text not null,
  fecha_inicio  date not null,
  fecha_fin     date not null,
  cupo_base     smallint not null default 3 check (cupo_base between 1 and 20),
  estado        operaciones.estado_ciclo not null default 'planificado',
  orden_capitania_id bigint references operaciones.orden_capitania(id) on delete set null,
  notificado_s1_en timestamptz,
  notificado_s2_en timestamptz,
  creado_por    uuid default auth.uid(),
  creado_en     timestamptz not null default now(),
  unique (fecha_inicio),
  constraint ciclo_fechas check (fecha_fin = fecha_inicio + 13)
);
comment on table operaciones.guardia_ciclo is 'Ciclo de guardias de 14 días agendado por Capitanía o Teniente 1°.';

-- ---------------------------------------------------------------------
-- Ampliación de turnos
-- ---------------------------------------------------------------------
alter table operaciones.guardia_turno
  add column if not exists ciclo_id bigint references operaciones.guardia_ciclo(id) on delete cascade,
  add column if not exists semana_num smallint check (semana_num in (1, 2)),
  add column if not exists estado operaciones.estado_turno not null default 'programada',
  add column if not exists hora_aviso_central timestamptz,
  add column if not exists charlie_modalidad operaciones.charlie_modalidad,
  add column if not exists charlie_codigo text,
  add column if not exists charlie_persona_id uuid references personal.persona(id) on delete set null,
  add column if not exists reportado_por uuid references personal.persona(id) on delete set null,
  add column if not exists reportado_en timestamptz,
  add column if not exists firmado_por uuid references personal.persona(id) on delete set null,
  add column if not exists firmado_en timestamptz;

comment on column operaciones.guardia_turno.semana_num is '1 para los días 1–7 del ciclo y 2 para los días 8–14.';
comment on column operaciones.guardia_turno.charlie_modalidad is 'Z8 en cuartel (cuenta como guardián), Z20 a la escucha o sin maquinista.';

-- Un solo turno nocturno por fecha.
create unique index if not exists guardia_turno_nocturna_uk
  on operaciones.guardia_turno (fecha)
  where tipo = 'nocturna' and ciclo_id is not null;

alter table operaciones.guardia_turno
  drop constraint if exists guardia_turno_fechas;
alter table operaciones.guardia_turno
  add constraint guardia_turno_fechas check (termino is null or termino >= inicio);

-- ---------------------------------------------------------------------
-- Ampliación de integrantes
-- ---------------------------------------------------------------------
alter table operaciones.guardia_integrante
  add column if not exists origen operaciones.origen_integrante not null default 'inscripcion',
  add column if not exists estado operaciones.estado_integrante not null default 'inscrito',
  add column if not exists hora_llegada timestamptz,
  add column if not exists reemplaza_a_persona_id uuid references personal.persona(id) on delete set null,
  add column if not exists reemplazo_nota text,
  add column if not exists notificado_jefe_en timestamptz,
  add column if not exists creado_en timestamptz not null default now();

-- Compatibilidad: tras la ampliación, `cumplida` sigue existiendo; se mantiene
-- sincronizada con `estado` mediante trigger para no romper consultas antiguas.
create or replace function operaciones.fn_sincronizar_cumplida()
returns trigger
language plpgsql
as $$
begin
  new.cumplida := new.estado = 'cumplida';
  return new;
end
$$;

drop trigger if exists guardia_integrante_cumplida on operaciones.guardia_integrante;
create trigger guardia_integrante_cumplida
  before insert or update on operaciones.guardia_integrante
  for each row execute function operaciones.fn_sincronizar_cumplida();

-- ---------------------------------------------------------------------
-- Situaciones especiales y notificaciones
-- ---------------------------------------------------------------------
create table operaciones.guardia_situacion (
  id            bigint generated always as identity primary key,
  persona_id    uuid not null references personal.persona(id) on delete cascade,
  fecha_inicio  date not null,
  fecha_fin     date not null,
  motivo        text not null,
  estado        operaciones.estado_situacion_guardia not null default 'pendiente',
  resuelto_por  uuid references personal.persona(id) on delete set null,
  resuelto_en   timestamptz,
  respuesta     text,
  situacion_especial_id bigint references personal.situacion_especial(id) on delete set null,
  creado_en     timestamptz not null default now(),
  constraint situacion_guardia_fechas check (fecha_fin >= fecha_inicio)
);
comment on table operaciones.guardia_situacion is 'Solicitudes de situación especial de guardia (Orden 01/2026 §3).';

create table operaciones.guardia_notificacion (
  id            bigint generated always as identity primary key,
  turno_id      bigint references operaciones.guardia_turno(id) on delete cascade,
  ciclo_id      bigint references operaciones.guardia_ciclo(id) on delete cascade,
  persona_id    uuid references personal.persona(id) on delete cascade,
  tipo          operaciones.tipo_notificacion_guardia not null,
  canal         text not null check (canal in ('correo', 'whatsapp', 'app', 'sms')),
  asunto        text,
  mensaje       text,
  destinatario  text,
  estado        text not null default 'enviada',
  error         text,
  leida_en      timestamptz,
  creado_en     timestamptz not null default now()
);
comment on table operaciones.guardia_notificacion is 'Trazabilidad de avisos de guardia por canal y destinatario.';

create index guardia_notificacion_persona_idx
  on operaciones.guardia_notificacion (persona_id, leida_en, creado_en desc);
create index guardia_ciclo_estado_idx on operaciones.guardia_ciclo (estado, fecha_inicio);

-- Auditoría de las tablas nuevas
create trigger aud_guardia_ciclo
  after insert or update or delete on operaciones.guardia_ciclo
  for each row execute function seguridad.fn_auditar();
create trigger aud_guardia_situacion
  after insert or update or delete on operaciones.guardia_situacion
  for each row execute function seguridad.fn_auditar();
create trigger aud_guardia_notificacion
  after insert or update or delete on operaciones.guardia_notificacion
  for each row execute function seguridad.fn_auditar();

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function operaciones.puede_gestionar_guardias()
returns boolean
language sql
stable
as $$
  select seguridad.tiene_rol('capitan', 'teniente_1', 'ayudante', 'director', 'admin')
      or current_user in ('postgres', 'supabase_admin')
      or auth.role() = 'service_role'
$$;
comment on function operaciones.puede_gestionar_guardias() is 'Roles que agendan, asignan y envían avisos de guardia.';

create or replace function operaciones.es_integrante(p_id_turno bigint, p_persona_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = operaciones, seguridad, public
as $$
  select exists (
    select 1
    from operaciones.guardia_integrante gi
    where gi.turno_id = p_id_turno
      and gi.persona_id = coalesce(p_persona_id, seguridad.mi_persona())
      and gi.estado in ('inscrito', 'cumplida')
  )
$$;
comment on function operaciones.es_integrante(bigint, uuid) is 'Verdadero si la persona pertenece a la dotación activa del turno.';

create or replace function operaciones.jefe_guardia_de_turno(p_id_turno bigint)
returns uuid
language sql
stable
security definer
set search_path = operaciones, personal, public
as $$
  with candidatos as (
    select
      gi.persona_id,
      p.registro,
      coalesce((
        select min(case c.codigo
                     when 'CAP' then 1
                     when 'T1' then 2
                     when 'T2' then 3
                     when 'T3' then 4
                     else 99
                   end)
        from personal.cargo_periodo cp
        join personal.cargo c on c.id = cp.cargo_id
        where cp.persona_id = gi.persona_id
          and cp.desde <= current_date
          and (cp.hasta is null or cp.hasta >= current_date)
      ), 99) as prioridad
    from operaciones.guardia_integrante gi
    join personal.persona p on p.id = gi.persona_id
    where gi.turno_id = p_id_turno
      and gi.estado in ('inscrito', 'cumplida')
  )
  select c.persona_id
  from candidatos c
  order by c.prioridad, c.registro
  limit 1
$$;
comment on function operaciones.jefe_guardia_de_turno(bigint) is 'Oficial operativo de mayor rango presente; si no hay, el bombero con menor número de registro.';

create or replace function operaciones.guardianes_del_dia(p_id_turno bigint)
returns integer
language sql
stable
security definer
set search_path = operaciones, public
as $$
  select count(*)::int
  from operaciones.guardia_integrante
  where turno_id = p_id_turno
    and estado in ('inscrito', 'cumplida')
$$;

create or replace function operaciones.semana_cubierta(p_ciclo_id bigint, p_semana integer, p_cupo integer)
returns boolean
language sql
stable
security definer
set search_path = operaciones, public
as $$
  select coalesce(
    bool_and((
      select count(*)
      from operaciones.guardia_integrante gi
      where gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
    ) >= p_cupo),
    false
  )
  from operaciones.guardia_turno t
  where t.ciclo_id = p_ciclo_id and t.semana_num = p_semana::smallint
$$;
comment on function operaciones.semana_cubierta(bigint, integer, integer) is 'Verdadero si los 7 días de la semana tienen al menos el cupo base.';

-- ---------------------------------------------------------------------
-- RPC: crear ciclo
-- ---------------------------------------------------------------------
create or replace function operaciones.crear_ciclo_guardia(
  p_nombre text,
  p_fecha_inicio date,
  p_cupo_base integer default 3
)
returns bigint
language plpgsql
security definer
set search_path = operaciones, nucleo, seguridad, public
as $$
declare
  v_id bigint;
  v_fecha date;
  v_fin_semana boolean;
  v_inicio timestamptz;
  v_termino timestamptz;
begin
  if not operaciones.puede_gestionar_guardias() then
    raise exception 'Solo Capitanía, Teniente 1°, Ayudante, Director o admin pueden agendar guardias.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into operaciones.guardia_ciclo (nombre, fecha_inicio, fecha_fin, cupo_base, estado, creado_por)
  values (p_nombre, p_fecha_inicio, p_fecha_inicio + 13, coalesce(p_cupo_base, 3)::smallint, 'planificado', auth.uid())
  returning id into v_id;

  for v_dia in 0..13 loop
    v_fecha := p_fecha_inicio + v_dia;
    v_fin_semana := extract(isodow from v_fecha) in (6, 7)
      or exists (select 1 from nucleo.feriado f where f.fecha = v_fecha);
    -- Horario de Chile: 23:30 y levantada 09:30 (10:30 fines de semana y feriados).
    v_inicio := (v_fecha::timestamp + time '23:30') at time zone 'America/Santiago';
    v_termino := case when v_fin_semana
                      then ((v_fecha + 1)::timestamp + time '10:30') at time zone 'America/Santiago'
                      else ((v_fecha + 1)::timestamp + time '09:30') at time zone 'America/Santiago'
                 end;

    insert into operaciones.guardia_turno (ciclo_id, semana_num, fecha, tipo, inicio, termino, estado)
    values (v_id, case when v_dia < 7 then 1 else 2 end, v_fecha, 'nocturna', v_inicio, v_termino, 'programada');
  end loop;

  return v_id;
end
$$;
comment on function operaciones.crear_ciclo_guardia(text, date, integer) is 'Crea un ciclo de 14 días y sus 14 turnos nocturnos.';

-- ---------------------------------------------------------------------
-- RPC: grilla del ciclo
-- ---------------------------------------------------------------------
create or replace function operaciones.grilla_ciclo(p_ciclo_id bigint default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = operaciones, personal, nucleo, seguridad, public
as $$
declare
  v_ciclo operaciones.guardia_ciclo;
  v_resultado jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sesión no autenticada.' using errcode = 'insufficient_privilege';
  end if;

  if p_ciclo_id is null then
    select * into v_ciclo
      from operaciones.guardia_ciclo
     order by case estado when 'en_curso' then 0 when 'abierto' then 1 when 'planificado' then 2 else 3 end,
              fecha_inicio
     limit 1;
  else
    select * into v_ciclo from operaciones.guardia_ciclo where id = p_ciclo_id;
  end if;

  if v_ciclo.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'ciclo', jsonb_build_object(
      'id', v_ciclo.id,
      'nombre', v_ciclo.nombre,
      'fecha_inicio', v_ciclo.fecha_inicio,
      'fecha_fin', v_ciclo.fecha_fin,
      'cupo_base', v_ciclo.cupo_base,
      'estado', v_ciclo.estado,
      'notificado_s1_en', v_ciclo.notificado_s1_en,
      'notificado_s2_en', v_ciclo.notificado_s2_en
    ),
    'semana_1_cubierta', operaciones.semana_cubierta(v_ciclo.id, 1, v_ciclo.cupo_base::integer),
    'semana_2_cubierta', operaciones.semana_cubierta(v_ciclo.id, 2, v_ciclo.cupo_base::integer),
    'dias', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'turno_id', t.id,
          'fecha', t.fecha,
          'semana_num', t.semana_num,
          'estado', t.estado,
          'inicio', t.inicio,
          'termino', t.termino,
          'feriado', (select f.nombre from nucleo.feriado f where f.fecha = t.fecha),
          'hora_aviso_central', t.hora_aviso_central,
          'charlie_modalidad', t.charlie_modalidad,
          'charlie_codigo', t.charlie_codigo,
          'observacion', t.observacion,
          'jefe_persona_id', t.jefe_persona_id,
          'firmado_en', t.firmado_en,
          'guardianes', (
            select count(*)::int from operaciones.guardia_integrante gi
            where gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
          ),
          'integrantes', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'persona_id', gi.persona_id,
                'registro', p.registro,
                'nombre', p.nombres || ' ' || p.apellido_paterno,
                'codigo_charlie', p.codigo_charlie,
                'origen', gi.origen,
                'estado', gi.estado,
                'hora_llegada', gi.hora_llegada,
                'reemplaza_a_persona_id', gi.reemplaza_a_persona_id,
                'reemplazo_nota', gi.reemplazo_nota,
                'es_jefe', gi.persona_id = t.jefe_persona_id
              )
              order by p.registro
            )
            from operaciones.guardia_integrante gi
            join personal.persona p on p.id = gi.persona_id
            where gi.turno_id = t.id
          ), '[]'::jsonb)
        )
        order by t.fecha
      )
      from operaciones.guardia_turno t
      where t.ciclo_id = v_ciclo.id
    ), '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end
$$;
comment on function operaciones.grilla_ciclo(bigint) is 'Estado completo de un ciclo: días, cobertura, dotación y jefe calculado.';

-- ---------------------------------------------------------------------
-- RPC: mi cumplimiento
-- ---------------------------------------------------------------------
create or replace function operaciones.mi_cumplimiento_guardia(p_ciclo_id bigint default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_ciclo operaciones.guardia_ciclo;
  v_anti personal.v_antiguedad_persona;
  v_cumplidas integer;
  v_inscripciones integer;
  v_sin_leer integer;
begin
  if v_persona is null then
    return jsonb_build_object('vinculado', false);
  end if;

  select * into v_anti from personal.v_antiguedad_persona where persona_id = v_persona;

  if p_ciclo_id is null then
    select * into v_ciclo
      from operaciones.guardia_ciclo
     order by case estado when 'en_curso' then 0 when 'abierto' then 1 when 'planificado' then 2 else 3 end,
              fecha_inicio
     limit 1;
  else
    select * into v_ciclo from operaciones.guardia_ciclo where id = p_ciclo_id;
  end if;

  select
    count(*) filter (where gi.estado = 'cumplida')::int,
    count(*) filter (where gi.estado = 'inscrito')::int
    into v_cumplidas, v_inscripciones
  from operaciones.guardia_integrante gi
  join operaciones.guardia_turno t on t.id = gi.turno_id
  where gi.persona_id = v_persona
    and (v_ciclo.id is null or t.ciclo_id = v_ciclo.id);

  select count(*)::int into v_sin_leer
    from operaciones.guardia_notificacion n
   where n.persona_id = v_persona and n.leida_en is null and n.canal = 'app';

  return jsonb_build_object(
    'vinculado', true,
    'persona_id', v_persona,
    'anios_servicio', coalesce(v_anti.anios_servicio, 0),
    'origen_antiguedad', v_anti.origen_antiguedad,
    'categoria_guardia', v_anti.categoria_guardia,
    'exento', coalesce(v_anti.exento_efectivo, false),
    'motivo_exencion', v_anti.motivo_exencion,
    'ciclo_id', v_ciclo.id,
    'ciclo_inicio', v_ciclo.fecha_inicio,
    'ciclo_fin', v_ciclo.fecha_fin,
    'cumplidas', v_cumplidas,
    'inscritas', v_inscripciones,
    'requiere_guardia', not coalesce(v_anti.exento_efectivo, false),
    'pendiente', (not coalesce(v_anti.exento_efectivo, false)) and v_cumplidas = 0 and v_inscripciones = 0,
    'notificaciones_sin_leer', v_sin_leer
  );
end
$$;

-- ---------------------------------------------------------------------
-- RPC: inscribirse
-- ---------------------------------------------------------------------
create or replace function operaciones.inscribirse_guardia(
  p_turno_id bigint,
  p_persona_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_persona uuid := coalesce(p_persona_id, seguridad.mi_persona());
  v_turno operaciones.guardia_turno;
  v_ciclo operaciones.guardia_ciclo;
  v_guardianes integer;
  v_semana_cubierta boolean;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;

  if p_persona_id is not null and p_persona_id <> seguridad.mi_persona()
     and not operaciones.puede_gestionar_guardias() then
    raise exception 'Solo Capitanía puede inscribir a otro bombero.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_turno from operaciones.guardia_turno where id = p_turno_id;
  if v_turno.id is null then raise exception 'El turno no existe.'; end if;
  if v_turno.estado = 'firmada' then raise exception 'El turno ya está firmado.'; end if;

  select * into v_ciclo from operaciones.guardia_ciclo where id = v_turno.ciclo_id for update;
  if v_ciclo.estado not in ('abierto', 'en_curso') then
    raise exception 'El ciclo no está abierto para inscripciones.';
  end if;

  if exists (
    select 1 from operaciones.guardia_integrante gi
    where gi.turno_id = p_turno_id and gi.persona_id = v_persona
      and gi.estado in ('inscrito', 'cumplida')
  ) then
    raise exception 'Ya estás inscrito en esta guardia.';
  end if;

  if not coalesce((select exento_efectivo from personal.v_antiguedad_persona where persona_id = v_persona), false)
     and exists (
       select 1 from operaciones.guardia_integrante gi
       where gi.turno_id = p_turno_id and gi.persona_id = v_persona and gi.estado = 'reemplazado'
     ) then
    raise exception 'Fuiste reemplazado en esta guardia.';
  end if;

  -- Bloqueo por ciclo para que el control de cupo sea atómico.
  perform pg_advisory_xact_lock(hashtext('guardia_ciclo_' || v_turno.ciclo_id::text));

  v_guardianes := operaciones.guardianes_del_dia(p_turno_id);
  v_semana_cubierta := operaciones.semana_cubierta(v_turno.ciclo_id, v_turno.semana_num::integer, v_ciclo.cupo_base::integer);

  if v_guardianes >= v_ciclo.cupo_base and not v_semana_cubierta then
    raise exception 'Día lleno (%/%). Elige un día que aún falte cubrir.', v_guardianes, v_ciclo.cupo_base;
  end if;

  insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado)
  values (p_turno_id, v_persona, 'inscripcion', 'inscrito')
  on conflict (turno_id, persona_id) do update
    set origen = excluded.origen, estado = excluded.estado;
end
$$;

-- ---------------------------------------------------------------------
-- RPC: bajarse
-- ---------------------------------------------------------------------
create or replace function operaciones.bajarse_guardia(p_turno_id bigint)
returns void
language plpgsql
security definer
set search_path = operaciones, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_guardianes integer;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;

  perform pg_advisory_xact_lock(hashtext('guardia_turno_' || p_turno_id::text));

  v_guardianes := operaciones.guardianes_del_dia(p_turno_id);
  if v_guardianes <= 3 then
    raise exception 'Esta guardia tiene 3 o menos guardianes. Debes gestionar un reemplazo formal indicando quién te cubre.';
  end if;

  delete from operaciones.guardia_integrante
   where turno_id = p_turno_id
     and persona_id = v_persona
     and estado in ('inscrito', 'cumplida')
     and origen in ('inscripcion', 'asignacion_capitania');

  if not found then
    raise exception 'No estás inscrito en esta guardia.';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- RPC: reemplazo
-- ---------------------------------------------------------------------
create or replace function operaciones.registrar_reemplazo(
  p_turno_id bigint,
  p_reemplazante_id uuid,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_reemplazante personal.persona;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;
  if v_persona = p_reemplazante_id then
    raise exception 'El reemplazante debe ser otra persona.';
  end if;

  select * into v_reemplazante from personal.persona where id = p_reemplazante_id;
  if v_reemplazante.id is null then raise exception 'El reemplazante no existe.'; end if;

  if not exists (
    select 1 from operaciones.guardia_integrante gi
    where gi.turno_id = p_turno_id and gi.persona_id = v_persona and gi.estado in ('inscrito', 'cumplida')
  ) then
    raise exception 'Solo el titular inscrito puede delegar su guardia.';
  end if;

  update operaciones.guardia_integrante
     set estado = 'reemplazado', reemplazo_nota = p_motivo
   where turno_id = p_turno_id and persona_id = v_persona;

  insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado, reemplaza_a_persona_id, reemplazo_nota)
  values (p_turno_id, p_reemplazante_id, 'reemplazo', 'inscrito', v_persona, p_motivo)
  on conflict (turno_id, persona_id) do update
    set estado = 'inscrito', origen = 'reemplazo', reemplaza_a_persona_id = v_persona;

  insert into operaciones.guardia_notificacion (turno_id, persona_id, tipo, canal, mensaje)
  values (p_turno_id, p_reemplazante_id, 'reemplazo', 'app',
          format('Quedaste como reemplazante de %s en la guardia.', v_persona));
end
$$;

-- ---------------------------------------------------------------------
-- RPC: reporte nocturno
-- ---------------------------------------------------------------------
create or replace function operaciones.guardar_reporte_guardia(
  p_turno_id bigint,
  p_hora_aviso_central time,
  p_charlie_modalidad operaciones.charlie_modalidad,
  p_charlie_codigo text default null,
  p_presentes uuid[] default null,
  p_ausentes uuid[] default null,
  p_observacion text default null
)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_quien uuid := seguridad.mi_persona();
  v_turno_row operaciones.guardia_turno;
  v_maquinista uuid;
  v_jefe_calculado uuid;
begin
  select * into v_turno_row from operaciones.guardia_turno where guardia_turno.id = p_turno_id;
  if v_turno_row.id is null then raise exception 'El turno no existe.'; end if;

  if not (
    exists (
      select 1 from operaciones.guardia_integrante gi
      where gi.turno_id = p_turno_id
        and gi.persona_id = v_quien
        and gi.estado in ('inscrito', 'cumplida')
    )
    or operaciones.puede_gestionar_guardias()
  ) then
    raise exception 'Solo la dotación del turno o Capitanía pueden informar el reporte.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_charlie_codigo is not null and trim(p_charlie_codigo) <> '' then
    select p.id into v_maquinista
      from personal.persona p
     where upper(trim(p.codigo_charlie)) = upper(trim(p_charlie_codigo))
     limit 1;
    if v_maquinista is null then
      raise exception 'No se encontró un maquinista con el código % .', p_charlie_codigo;
    end if;
  end if;

  update operaciones.guardia_turno g
     set hora_aviso_central = case
           when p_hora_aviso_central is null then g.hora_aviso_central
           else (g.fecha::timestamp + p_hora_aviso_central) at time zone 'America/Santiago' 
         end,
         charlie_modalidad = coalesce(p_charlie_modalidad, g.charlie_modalidad),
         charlie_codigo = nullif(trim(p_charlie_codigo), ''),
         charlie_persona_id = case
           when coalesce(p_charlie_modalidad, g.charlie_modalidad) = 'sin_maquinista' then null
           else v_maquinista
         end,
         observacion = coalesce(nullif(p_observacion, ''), g.observacion),
         reportado_por = coalesce(g.reportado_por, v_quien),
         reportado_en = coalesce(g.reportado_en, now()),
         estado = case when g.estado = 'programada' then 'constituida' else g.estado end
   where g.id = p_turno_id;

  if p_presentes is not null then
    update operaciones.guardia_integrante gi
       set estado = 'cumplida'
     where gi.turno_id = p_turno_id and gi.persona_id = any(p_presentes);
  end if;

  if p_ausentes is not null then
    update operaciones.guardia_integrante gi
       set estado = 'ausente'
     where gi.turno_id = p_turno_id and gi.persona_id = any(p_ausentes);
  end if;

  if v_turno_row.charlie_persona_id is not null
     and (p_charlie_modalidad <> 'Z8' or v_maquinista is distinct from v_turno_row.charlie_persona_id) then
    delete from operaciones.guardia_integrante gi
     where gi.turno_id = p_turno_id
       and gi.persona_id = v_turno_row.charlie_persona_id
       and gi.origen = 'charlie_z8';
  end if;

  if p_charlie_modalidad = 'Z8' and v_maquinista is not null then
    insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado)
    values (p_turno_id, v_maquinista, 'charlie_z8', 'cumplida')
    on conflict (turno_id, persona_id) do nothing;
  end if;

  -- Si el reporte se informa sin presentes (ningún integrante marcado como
  -- cumplida), el jefe se calcula sobre la dotación inscrita.
  select operaciones.jefe_guardia_de_turno(p_turno_id) into v_jefe_calculado;

  if v_jefe_calculado is null then
    select gi.persona_id into v_jefe_calculado
      from operaciones.guardia_integrante gi
      join personal.persona p on p.id = gi.persona_id
     where gi.turno_id = p_turno_id
       and gi.estado <> 'reemplazado'
     order by p.registro
     limit 1;
  end if;

  update operaciones.guardia_turno g
     set jefe_persona_id = v_jefe_calculado
   where g.id = p_turno_id;
end
$$;


-- ---------------------------------------------------------------------
-- RPC: firma
-- ---------------------------------------------------------------------
create or replace function operaciones.firmar_reporte_guardia(p_turno_id bigint)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_turno operaciones.guardia_turno;
  v_jefe uuid;
begin
  select * into v_turno from operaciones.guardia_turno where id = p_turno_id;
  if v_turno.id is null then raise exception 'El turno no existe.'; end if;
  if v_turno.hora_aviso_central is null and v_turno.charlie_modalidad is null then
    raise exception 'Guarda el reporte antes de firmarlo.';
  end if;

  v_jefe := operaciones.jefe_guardia_de_turno(p_turno_id);

  if v_persona <> v_jefe
     and not seguridad.tiene_rol('capitan', 'teniente_1', 'director', 'admin') then
    raise exception 'Solo el Jefe de Guardia (%) o Capitanía pueden firmar el reporte.', v_jefe
      using errcode = 'insufficient_privilege';
  end if;

  update operaciones.guardia_turno
     set jefe_persona_id = v_jefe,
         firmado_por = v_persona,
         firmado_en = now(),
         estado = 'firmada'
   where id = p_turno_id;
end
$$;

-- ---------------------------------------------------------------------
-- RPC: llegada tardía
-- ---------------------------------------------------------------------
create or replace function operaciones.registrar_llegada_tardia(
  p_turno_id bigint,
  p_observacion text default null
)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_turno operaciones.guardia_turno;
  v_nombre text;
  v_registro integer;
  v_hora text := to_char(now() at time zone 'America/Santiago', 'HH24:MI');
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;

  select * into v_turno from operaciones.guardia_turno where id = p_turno_id;
  if v_turno.id is null then raise exception 'El turno no existe.'; end if;
  if v_turno.estado not in ('constituida', 'firmada') then
    raise exception 'Solo se puede registrar una llegada cuando la guardia ya está constituida.';
  end if;
  if now() > (v_turno.fecha + 1)::timestamp at time zone 'America/Santiago' + time '12:00' then
    raise exception 'La ventana para registrar la llegada tardía ya terminó.';
  end if;

  select nombres || ' ' || apellido_paterno, registro into v_nombre, v_registro
    from personal.persona where id = v_persona;

  insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado, hora_llegada)
  values (p_turno_id, v_persona, 'llegada_tardia', 'cumplida', now())
  on conflict (turno_id, persona_id) do update
    set estado = 'cumplida', origen = 'llegada_tardia', hora_llegada = now();

  update operaciones.guardia_turno
     set observacion = concat_ws(E'\n', observacion,
           format('[%s] Llegada tardía: %s (Reg. %s)%s',
                  v_hora, v_nombre, v_registro,
                  case when p_observacion is null then '' else ' — ' || p_observacion end))
   where id = p_turno_id;

  insert into operaciones.guardia_notificacion (turno_id, persona_id, tipo, canal, mensaje)
  values (
    p_turno_id,
    coalesce(v_turno.jefe_persona_id, (select jefe from (select operaciones.jefe_guardia_de_turno(p_turno_id) as jefe) s)),
    'llegada_tardia',
    'app',
    format('%s (Reg. %s) llegó a las %s a la guardia del %s.', v_nombre, v_registro, v_hora, to_char(v_turno.fecha, 'DD-MM-YYYY'))
  );
end
$$;

-- ---------------------------------------------------------------------
-- RPC: catálogo público y notificaciones
-- ---------------------------------------------------------------------
create or replace function operaciones.catalogo_guardia_personas()
returns table (
  id uuid,
  registro integer,
  nombre text,
  codigo_charlie text,
  anios_servicio integer,
  categoria_guardia text,
  exento boolean
)
language sql
stable
security definer
set search_path = operaciones, personal, seguridad, public
as $$
  select p.id, p.registro,
         p.nombres || ' ' || p.apellido_paterno,
         p.codigo_charlie,
         v.anios_servicio,
         v.categoria_guardia,
         v.exento_efectivo
  from personal.persona p
  join personal.v_antiguedad_persona v on v.persona_id = p.id
  where p.estado = 'activo' and auth.uid() is not null
  order by p.registro
$$;
comment on function operaciones.catalogo_guardia_personas() is 'Datos públicos mínimos de bomberos activos para selectores de guardia.';

create or replace function operaciones.mis_notificaciones_guardia()
returns table (
  id bigint,
  tipo operaciones.tipo_notificacion_guardia,
  turno_id bigint,
  mensaje text,
  creado_en timestamptz,
  leida_en timestamptz
)
language sql
stable
security definer
set search_path = operaciones, seguridad, public
as $$
  select n.id, n.tipo, n.turno_id, n.mensaje, n.creado_en, n.leida_en
  from operaciones.guardia_notificacion n
  where n.persona_id = seguridad.mi_persona()
    and n.canal = 'app'
  order by n.creado_en desc
  limit 50
$$;

create or replace function operaciones.marcar_notificacion_leida(p_id bigint)
returns void
language plpgsql
security definer
set search_path = operaciones, seguridad, public
as $$
begin
  update operaciones.guardia_notificacion
     set leida_en = now()
   where id = p_id and persona_id = seguridad.mi_persona();
end
$$;

-- ---------------------------------------------------------------------
-- RPC: estadísticas
-- ---------------------------------------------------------------------
create or replace function operaciones.estadisticas_guardia(
  p_desde date default (current_date - 180),
  p_hasta date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_resultado jsonb;
begin
  if not (seguridad.es_oficial() or seguridad.es_oficial()) then
    raise exception 'Sin permiso para ver estadísticas.' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'periodo', jsonb_build_object('desde', p_desde, 'hasta', p_hasta),
    'por_categoria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'categoria', c.categoria,
        'personas', c.personas,
        'cumplidas', c.cumplidas,
        'llegadas_tardias', c.llegadas_tardias
      ) order by c.categoria)
      from (
        select v.categoria_guardia as categoria,
               count(distinct v.persona_id)::int as personas,
               count(gi.persona_id) filter (where gi.estado = 'cumplida')::int as cumplidas,
               count(gi.persona_id) filter (where gi.origen = 'llegada_tardia')::int as llegadas_tardias
        from personal.v_antiguedad_persona v
        left join operaciones.guardia_integrante gi on gi.persona_id = v.persona_id
        left join operaciones.guardia_turno t on t.id = gi.turno_id and t.fecha between p_desde and p_hasta
        where v.estado = 'activo'
        group by v.categoria_guardia
      ) c
    ), '[]'::jsonb),
    'por_dia_semana', coalesce((
      select jsonb_agg(jsonb_build_object('dia', d.dia, 'guardianes', d.guardianes) order by d.dia)
      from (
        select to_char(t.fecha, 'ID')::int as dia, count(gi.persona_id)::int as guardianes
        from operaciones.guardia_turno t
        left join operaciones.guardia_integrante gi on gi.turno_id = t.id and gi.estado = 'cumplida'
        where t.fecha between p_desde and p_hasta
        group by 1
      ) d
    ), '[]'::jsonb),
    'maquinistas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'persona_id', m.charlie_persona_id,
        'codigo', m.charlie_codigo,
        'z8', m.z8,
        'z20', m.z20
      ) order by m.z8 + m.z20 desc)
      from (
        select charlie_persona_id, min(charlie_codigo) as charlie_codigo,
               count(*) filter (where charlie_modalidad = 'Z8')::int as z8,
               count(*) filter (where charlie_modalidad = 'Z20')::int as z20
        from operaciones.guardia_turno
        where fecha between p_desde and p_hasta and charlie_persona_id is not null
        group by charlie_persona_id
      ) m
    ), '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end
$$;

-- ---------------------------------------------------------------------
-- Situaciones especiales (§3)
-- ---------------------------------------------------------------------
create or replace function operaciones.solicitar_situacion_guardia(
  p_fecha_inicio date,
  p_fecha_fin date,
  p_motivo text
)
returns bigint
language plpgsql
security definer
set search_path = operaciones, seguridad, public
as $$
declare
  v_persona uuid := seguridad.mi_persona();
  v_id bigint;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;
  if p_fecha_fin < p_fecha_inicio then
    raise exception 'La fecha de término debe ser igual o posterior al inicio.';
  end if;

  insert into operaciones.guardia_situacion (persona_id, fecha_inicio, fecha_fin, motivo)
  values (v_persona, p_fecha_inicio, p_fecha_fin, p_motivo)
  returning id into v_id;

  return v_id;
end
$$;

create or replace function operaciones.resolver_situacion_guardia(
  p_id bigint,
  p_aprobar boolean,
  p_respuesta text default null,
  p_crear_situacion boolean default true
)
returns void
language plpgsql
security definer
set search_path = operaciones, personal, seguridad, public
as $$
declare
  v_solicitud operaciones.guardia_situacion;
  v_persona uuid := seguridad.mi_persona();
  v_situacion bigint;
begin
  if not operaciones.puede_gestionar_guardias() then
    raise exception 'Solo Capitanía o Teniente 1° resuelven las situaciones.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_solicitud from operaciones.guardia_situacion where id = p_id;
  if v_solicitud.id is null then raise exception 'La solicitud no existe.'; end if;

  if p_aprobar and p_crear_situacion then
    insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo)
    values (v_solicitud.persona_id, 'permiso_especial', v_solicitud.fecha_inicio, v_solicitud.fecha_fin, v_solicitud.motivo)
    returning id into v_situacion;
  end if;

  update operaciones.guardia_situacion
     set estado = case when p_aprobar
                       then 'aprobada'::operaciones.estado_situacion_guardia
                       else 'rechazada'::operaciones.estado_situacion_guardia
                  end,
         resuelto_por = v_persona,
         resuelto_en = now(),
         respuesta = p_respuesta,
         situacion_especial_id = v_situacion
   where id = p_id;
end
$$;

-- ---------------------------------------------------------------------
-- RLS de las tablas nuevas
-- ---------------------------------------------------------------------
alter table operaciones.guardia_ciclo         enable row level security;
alter table operaciones.guardia_situacion     enable row level security;
alter table operaciones.guardia_notificacion  enable row level security;

create policy ciclo_lectura on operaciones.guardia_ciclo for select using (auth.uid() is not null);
create policy ciclo_gestion on operaciones.guardia_ciclo for all
  using (operaciones.puede_gestionar_guardias())
  with check (operaciones.puede_gestionar_guardias());

create policy situacion_propia on operaciones.guardia_situacion for select
  using (persona_id = seguridad.mi_persona() or seguridad.es_oficial());
create policy situacion_insertar on operaciones.guardia_situacion for insert
  with check (persona_id = seguridad.mi_persona());
create policy situacion_gestion on operaciones.guardia_situacion for update
  using (operaciones.puede_gestionar_guardias())
  with check (operaciones.puede_gestionar_guardias());

create policy notificacion_propia on operaciones.guardia_notificacion for select
  using (persona_id = seguridad.mi_persona() or operaciones.puede_gestionar_guardias());
create policy notificacion_update on operaciones.guardia_notificacion for update
  using (persona_id = seguridad.mi_persona() or operaciones.puede_gestionar_guardias())
  with check (persona_id = seguridad.mi_persona() or operaciones.puede_gestionar_guardias());

-- Toda la compañía puede ver los turnos de guardia programados (grilla pública).
create policy turno_compania on operaciones.guardia_turno for select
  using (auth.uid() is not null);
create policy integrante_compania on operaciones.guardia_integrante for select
  using (auth.uid() is not null);

grant select, insert, update, delete on operaciones.guardia_ciclo, operaciones.guardia_situacion, operaciones.guardia_notificacion to authenticated;
grant usage, select on all sequences in schema operaciones to authenticated;

grant execute on function operaciones.crear_ciclo_guardia(text, date, integer) to authenticated;
grant execute on function operaciones.grilla_ciclo(bigint) to authenticated;
grant execute on function operaciones.mi_cumplimiento_guardia(bigint) to authenticated;
grant execute on function operaciones.inscribirse_guardia(bigint, uuid) to authenticated;
grant execute on function operaciones.bajarse_guardia(bigint) to authenticated;
grant execute on function operaciones.registrar_reemplazo(bigint, uuid, text) to authenticated;
grant execute on function operaciones.guardar_reporte_guardia(bigint, time, operaciones.charlie_modalidad, text, uuid[], uuid[], text) to authenticated;
grant execute on function operaciones.firmar_reporte_guardia(bigint) to authenticated;
grant execute on function operaciones.registrar_llegada_tardia(bigint, text) to authenticated;
grant execute on function operaciones.catalogo_guardia_personas() to authenticated;
grant execute on function operaciones.mis_notificaciones_guardia() to authenticated;
grant execute on function operaciones.marcar_notificacion_leida(bigint) to authenticated;
grant execute on function operaciones.estadisticas_guardia(date, date) to authenticated;
grant execute on function operaciones.solicitar_situacion_guardia(date, date, text) to authenticated;
grant execute on function operaciones.resolver_situacion_guardia(bigint, boolean, text, boolean) to authenticated;
grant execute on function operaciones.jefe_guardia_de_turno(bigint) to authenticated;
grant execute on function operaciones.guardianes_del_dia(bigint) to authenticated;
grant execute on function operaciones.semana_cubierta(bigint, integer, integer) to authenticated;
grant execute on function operaciones.es_integrante(bigint, uuid) to authenticated;
grant execute on function operaciones.puede_gestionar_guardias() to authenticated;

