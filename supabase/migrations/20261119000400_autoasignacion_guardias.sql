-- =====================================================================
-- 20261119000400 · Autoasignación de guardias al cierre de la semana
-- =====================================================================
-- Regla: si un bombero debe guardia y no se inscribió, en el último día
-- previo al inicio de la semana (domingo 20:00) el sistema lo asigna
-- automáticamente, priorizando el día con menos guardianes. En caso de
-- empate elige al azar entre esos días.
-- =====================================================================
set search_path = operaciones, personal, nucleo, seguridad, public;

-- Nuevo origen para distinguir la asignación automática.
alter type operaciones.origen_integrante add value if not exists 'autoasignacion';

-- Momento en que se cerró la semana y se ejecutó la asignación automática.
alter table operaciones.guardia_turno
  add column if not exists autoasignado_en timestamptz;

comment on column operaciones.guardia_turno.autoasignado_en is 'Momento en que la semana pasó a modo cierre y se asignaron los bomberos que no se inscribieron.';

-- ---------------------------------------------------------------------
-- ¿Puede el bombero cubrir guardia? (activo y no exento)
-- ---------------------------------------------------------------------
create or replace function operaciones.puede_cumplir_guardia(p_persona uuid)
returns boolean
language sql
stable
security definer
set search_path = personal, public
as $$
  select exists (
    select 1
    from personal.v_antiguedad_persona v
    where v.persona_id = p_persona
      and v.estado = 'activo'
      and not coalesce(v.exento_efectivo, false)
  )
$$;
comment on function operaciones.puede_cumplir_guardia(uuid) is 'Activo y no exento de guardia.';

-- ---------------------------------------------------------------------
-- Bomberos que aún no participan en una semana del ciclo
-- ---------------------------------------------------------------------
create or replace function operaciones.pendientes_de_semana(p_ciclo bigint, p_semana integer)
returns table (persona_id uuid, registro integer)
language sql
stable
security definer
set search_path = operaciones, personal, public
as $$
  select v.persona_id, v.registro
  from personal.v_antiguedad_persona v
  where v.estado = 'activo'
    and not coalesce(v.exento_efectivo, false)
    and not exists (
      select 1
      from operaciones.guardia_integrante gi
      join operaciones.guardia_turno t on t.id = gi.turno_id
      where t.ciclo_id = p_ciclo
        and t.semana_num = p_semana::smallint
        and gi.persona_id = v.persona_id
        and gi.estado in ('inscrito', 'cumplida', 'reemplazado')
    )
  order by v.registro
$$;
comment on function operaciones.pendientes_de_semana(bigint, integer) is 'Bomberos activos no exentos sin participación en la semana indicada.';

-- ---------------------------------------------------------------------
-- Día con menos guardianes; empate resuelto al azar
-- ---------------------------------------------------------------------
create or replace function operaciones.dia_con_menos_guardianes(
  p_ciclo bigint,
  p_semana integer,
  p_cupo integer,
  p_respetar_cupo boolean default true
)
returns bigint
language plpgsql
volatile
security definer
set search_path = operaciones, public
as $$
declare
  v_minimo integer;
  v_rotulo bigint;
begin
  select min(
           case when p_respetar_cupo
                then case when operaciones.guardianes_del_dia(t.id) < p_cupo
                          then operaciones.guardianes_del_dia(t.id)
                     end
                else operaciones.guardianes_del_dia(t.id)
           end
         )
    into v_minimo
  from operaciones.guardia_turno t
  where t.ciclo_id = p_ciclo
    and t.semana_num = p_semana::smallint
    and t.estado in ('programada', 'constituida');

  if v_minimo is null then
    return null;
  end if;

  select t.id
    into v_rotulo
  from operaciones.guardia_turno t
  where t.ciclo_id = p_ciclo
    and t.semana_num = p_semana::smallint
    and t.estado in ('programada', 'constituida')
    and operaciones.guardianes_del_dia(t.id) = v_minimo
  order by random()
  limit 1;

  return v_rotulo;
end
$$;
comment on function operaciones.dia_con_menos_guardianes(bigint, integer, integer, boolean) is 'Turno con menos guardianes de la semana; empates al azar. Respeta el cupo si se indica.';

-- ---------------------------------------------------------------------
-- Asignación automática de una semana
-- ---------------------------------------------------------------------
create or replace function operaciones.asignar_automaticamente_semana(
  p_ciclo bigint,
  p_semana integer
)
returns integer
language plpgsql
security definer
set search_path = operaciones, seguridad, public
as $$
declare
  v_ciclo operaciones.guardia_ciclo;
  v_pendiente record;
  v_turno bigint;
  v_asignados integer := 0;
  v_semana_incompleta boolean;
begin
  select * into v_ciclo from operaciones.guardia_ciclo where id = p_ciclo;
  if v_ciclo.id is null then
    raise exception 'El ciclo no existe.';
  end if;

  perform pg_advisory_xact_lock(hashtext('guardia_cierre_' || p_ciclo::text || '_' || p_semana::text));

  v_semana_incompleta := not operaciones.semana_cubierta(p_ciclo, p_semana, v_ciclo.cupo_base::integer);

  for v_pendiente in
    select * from operaciones.pendientes_de_semana(p_ciclo, p_semana)
  loop
    -- Primero los días bajo el cupo; si la semana ya está completa se reparte
    -- entre el día con menos guardianes (cupos extra).
    v_turno := operaciones.dia_con_menos_guardianes(
      p_ciclo, p_semana, v_ciclo.cupo_base::integer, v_semana_incompleta
    );

    if v_turno is null then
      exit;
    end if;

    insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado)
    values (v_turno, v_pendiente.persona_id, 'autoasignacion', 'inscrito')
    on conflict (turno_id, persona_id) do nothing;

    if found then
      v_asignados := v_asignados + 1;

      insert into operaciones.guardia_notificacion (turno_id, ciclo_id, persona_id, tipo, canal, mensaje)
      select v_turno, p_ciclo, v_pendiente.persona_id, 'convocatoria_semana', 'app',
             format('Fuiste asignado automáticamente a la guardia del %s porque no te inscribiste.',
                    to_char(t.fecha, 'DD-MM-YYYY'))
      from operaciones.guardia_turno t
      where t.id = v_turno;
    end if;

    v_semana_incompleta := not operaciones.semana_cubierta(p_ciclo, p_semana, v_ciclo.cupo_base::integer);
  end loop;

  update operaciones.guardia_turno t
     set autoasignado_en = coalesce(t.autoasignado_en, now())
   where t.ciclo_id = p_ciclo
     and t.semana_num = p_semana::smallint;

  return v_asignados;
end
$$;
comment on function operaciones.asignar_automaticamente_semana(bigint, integer) is 'Asigna a los bomberos pendientes al día con menos guardianes; empates al azar.';

-- ---------------------------------------------------------------------
-- Cierre semanal: se ejecuta el último día antes del inicio de cada semana
-- ---------------------------------------------------------------------
create or replace function operaciones.cerrar_semana_guardia(
  p_ciclo bigint,
  p_semana integer,
  p_forzar boolean default false
)
returns integer
language plpgsql
security definer
set search_path = operaciones, nucleo, public
as $$
declare
  v_ciclo operaciones.guardia_ciclo;
  v_inicio date;
  v_vence date;
  v_hoy date := (now() at time zone 'America/Santiago')::date;
begin
  select * into v_ciclo from operaciones.guardia_ciclo where id = p_ciclo;
  if v_ciclo.id is null then
    raise exception 'El ciclo no existe.';
  end if;

  v_inicio := v_ciclo.fecha_inicio + case when p_semana = 1 then 0 else 7 end;
  v_vence := v_inicio - 1;

  if not p_forzar and v_hoy < v_vence then
    raise exception 'La semana % se cierra el %.', p_semana, to_char(v_vence, 'DD-MM-YYYY');
  end if;

  if exists (
    select 1 from operaciones.guardia_turno t
    where t.ciclo_id = p_ciclo and t.semana_num = p_semana::smallint
      and t.autoasignado_en is not null
  ) then
    return 0;
  end if;

  return operaciones.asignar_automaticamente_semana(p_ciclo, p_semana);
end
$$;
comment on function operaciones.cerrar_semana_guardia(bigint, integer, boolean) is 'Cierra la inscripción de la semana y autoasigna a quienes no se registraron.';

-- ---------------------------------------------------------------------
-- RPC para el programa nocturno: cierra las semanas que vencen hoy
-- ---------------------------------------------------------------------
create or replace function operaciones.cerrar_semanas_pendientes()
returns integer
language plpgsql
security definer
set search_path = operaciones, nucleo, public
as $$
declare
  v_ciclo record;
  v_total integer := 0;
  v_hoy date := (now() at time zone 'America/Santiago')::date;
begin
  for v_ciclo in
    select
      c.id,
      s.semana
    from operaciones.guardia_ciclo c
    cross join (values (1), (2)) as s(semana)
    where c.estado in ('abierto', 'en_curso')
      and (c.fecha_inicio + case when s.semana = 1 then 0 else 7 end) - 1 <= v_hoy
      and (c.fecha_inicio + case when s.semana = 1 then 0 else 7 end) - 1 >= current_date - 30
  loop
    v_total := v_total + operaciones.cerrar_semana_guardia(v_ciclo.id, v_ciclo.semana, false);
  end loop;

  return v_total;
end
$$;
comment on function operaciones.cerrar_semanas_pendientes() is 'Cierra todas las semanas cuyo plazo venció. Uso interno (pg_cron).';

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
grant execute on function operaciones.puede_cumplir_guardia(uuid) to authenticated, service_role;
grant execute on function operaciones.pendientes_de_semana(bigint, integer) to authenticated, service_role;
grant execute on function operaciones.dia_con_menos_guardianes(bigint, integer, integer, boolean) to authenticated, service_role;
grant execute on function operaciones.asignar_automaticamente_semana(bigint, integer) to service_role;
grant execute on function operaciones.cerrar_semana_guardia(bigint, integer, boolean) to authenticated, service_role;
grant execute on function operaciones.cerrar_semanas_pendientes() to service_role;

-- ---------------------------------------------------------------------
-- Programar el cierre nocturno con pg_cron (domingo 20:00 Chile ≈ 23:00 UTC)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('guardias-cierre-semanal');
    exception when others then
      null;
    end;

    perform cron.schedule(
      'guardias-cierre-semanal',
      '0 23 * * *',
      'select operaciones.cerrar_semanas_pendientes()'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- Cuándo se cierra cada semana (para la interfaz)
-- ---------------------------------------------------------------------
create or replace function operaciones.estado_cierre_semana(p_ciclo bigint, p_semana integer)
returns jsonb
language sql
stable
security definer
set search_path = operaciones, public
as $$
  select jsonb_build_object(
    'cerrada', exists (
      select 1 from operaciones.guardia_turno t
      where t.ciclo_id = c.id
        and t.semana_num = p_semana::smallint
        and t.autoasignado_en is not null
    ),
    'vence', (c.fecha_inicio + case when p_semana = 1 then 0 else 7 end) - 1,
    'dias_para_cierre',
      (c.fecha_inicio + case when p_semana = 1 then 0 else 7 end) - 1
      - (now() at time zone 'America/Santiago')::date,
    'vence_hoy', (now() at time zone 'America/Santiago')::date =
                 (c.fecha_inicio + case when p_semana = 1 then 0 else 7 end) - 1
  )
  from operaciones.guardia_ciclo c
  where c.id = p_ciclo
$$;
comment on function operaciones.estado_cierre_semana(bigint, integer) is 'Fecha de cierre, si ya se cerró y si corresponde cerrarla hoy.';

grant execute on function operaciones.estado_cierre_semana(bigint, integer) to authenticated, service_role;
