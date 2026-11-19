-- =====================================================================
-- 20261119000500 · Guardias: correcciones de auditoría
-- =====================================================================
-- 1. Exención automática con la antigüedad efectiva (incluye ajuste manual).
-- 2. Categoría de guardia `stable` (usa current_date).
-- 3. Obligación de guardia por tramos de la Orden N° 01/2026.
-- 4. Autoasignación y convocatorias solo a quienes les vence en la semana.
-- 5. Baja libre de autoasignados y asignaciones de Capitanía.
-- 6. Notificación de reemplazo con el nombre, no el UUID.
-- 7. Estadísticas sin la condición duplicada.
-- =====================================================================
set search_path = operaciones, personal, nucleo, seguridad, public;

-- ---------------------------------------------------------------------
-- 1 y 2. Categoría de guardia y vista de antigüedad
-- ---------------------------------------------------------------------
create or replace function personal.categoria_guardia_de(
  p_anios integer,
  p_fecha_nacimiento date,
  p_exento boolean
)
returns text
language sql
stable
as $$
  select case
    when coalesce(p_exento, false) then 'exento'
    when p_fecha_nacimiento is not null
      and extract(year from age(current_date, p_fecha_nacimiento)) >= 60 then 'exento'
    when coalesce(p_anios, 0) >= 35 then 'exento'
    when coalesce(p_anios, 0) <= 4 then '0_4'
    when coalesce(p_anios, 0) <= 9 then '5_9'
    when coalesce(p_anios, 0) <= 19 then '10_19'
    else '20_34'
  end
$$;
comment on function personal.categoria_guardia_de(integer, date, boolean) is 'Categoría de guardia según años de servicio, edad y exención (Orden 01/2026 §3).';

create or replace view personal.v_antiguedad_persona
with (security_invoker = on)
as
select
  p.id as persona_id,
  p.registro,
  p.nombres || ' ' || p.apellido_paterno as nombre,
  p.codigo_charlie,
  coalesce(max(pp.anios), 0)::int as anios_premios,
  coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0)::numeric as anios_abonos,
  (coalesce(max(pp.anios), 0) + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0))::numeric as anios_calculados,
  p.anios_servicio_manual,
  coalesce(
    p.anios_servicio_manual,
    floor(coalesce(max(pp.anios), 0) + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0))::int,
    0
  ) as anios_servicio,
  case when p.anios_servicio_manual is not null then 'manual' else 'calculado' end as origen_antiguedad,
  case when p.fecha_nacimiento is null then null
       else extract(year from age(current_date, p.fecha_nacimiento))::int end as edad,
  p.exento_guardia,
  -- La exención por 35 años usa la antigüedad efectiva (manual o calculada).
  -- Se usa una expresión booleana completa para no depender del orden de
  -- evaluación de COALESCE con tipos mixtos (integer >= 35).
  (
    coalesce(p.exento_guardia, false)
    or (p.fecha_nacimiento is not null
        and extract(year from age(current_date, p.fecha_nacimiento)) >= 60)
    or coalesce(p.anios_servicio_manual,
                floor(coalesce(max(pp.anios), 0)
                      + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0))::int,
                0) >= 35
  ) as exento_efectivo,
  p.motivo_exencion,
  personal.categoria_guardia_de(
    coalesce(
      p.anios_servicio_manual,
      floor(coalesce(max(pp.anios), 0) + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0))::int,
      0
    ),
    p.fecha_nacimiento,
    p.exento_guardia
  ) as categoria_guardia,
  p.fecha_ingreso,
  p.estado
from personal.persona p
left join personal.persona_premio pp
  on pp.persona_id = p.id
 and pp.premio_tipo_id in (select pt.id from personal.premio_tipo pt where pt.codigo = 'CONSTANCIA')
group by p.id;
comment on view personal.v_antiguedad_persona is 'Años de servicio (premios + abonos con ajuste manual), exención efectiva y categoría de guardia.';

-- ---------------------------------------------------------------------
-- 3. Obligación de guardia por tramos (Orden 01/2026 §3)
-- ---------------------------------------------------------------------
create or replace function operaciones.periodo_guardia(
  p_categoria text,
  p_ciclo_id bigint,
  p_semana integer
)
returns table (inicio date, fin date, vence_esta_semana boolean, descripcion text)
language plpgsql
stable
security definer
set search_path = operaciones, public
as $$
declare
  v_ciclo operaciones.guardia_ciclo;
  v_inicio_semana date;
  v_fin_semana date;
  v_bimestre_inicio date;
  v_trimestre_inicio date;
  v_ultimo_turno date;
begin
  select * into v_ciclo from operaciones.guardia_ciclo where id = p_ciclo_id;
  if v_ciclo.id is null then
    raise exception 'El ciclo no existe.';
  end if;

  v_inicio_semana := v_ciclo.fecha_inicio + case when p_semana = 1 then 0 else 7 end;
  v_fin_semana := v_inicio_semana + 6;

  case p_categoria
    when '0_4' then
      return query select v_inicio_semana, v_fin_semana, true, 'Guardia semanal';
    when '5_9' then
      return query select v_ciclo.fecha_inicio, v_ciclo.fecha_fin, p_semana = 2, 'Guardia por ciclo de 14 días';
    when '10_19' then
      -- Bimestre calendario (ene-feb, mar-abr, …, nov-dic).
      v_bimestre_inicio := make_date(
        extract(year from v_inicio_semana)::int,
        ((extract(month from v_inicio_semana)::int - 1) / 2) * 2 + 1,
        1);
      select max(t.fecha) into v_ultimo_turno
        from operaciones.guardia_turno t
       where t.fecha >= v_bimestre_inicio
         and t.fecha < (v_bimestre_inicio + interval '2 months');
      return query select
        v_bimestre_inicio,
        (v_bimestre_inicio + interval '2 months - 1 day')::date,
        v_fin_semana >= coalesce(v_ultimo_turno, v_fin_semana),
        'Guardia bimestral';
    when '20_34' then
      -- Trimestre calendario (ene-mar, abr-jun, jul-sep, oct-dic).
      v_trimestre_inicio := make_date(
        extract(year from v_inicio_semana)::int,
        ((extract(month from v_inicio_semana)::int - 1) / 3) * 3 + 1,
        1);
      select max(t.fecha) into v_ultimo_turno
        from operaciones.guardia_turno t
       where t.fecha >= v_trimestre_inicio
         and t.fecha < (v_trimestre_inicio + interval '3 months');
      return query select
        v_trimestre_inicio,
        (v_trimestre_inicio + interval '3 months - 1 day')::date,
        v_fin_semana >= coalesce(v_ultimo_turno, v_fin_semana),
        'Guardia trimestral';
    else
      return query select v_inicio_semana, v_fin_semana, false, 'Exento de guardia';
  end case;
end
$$;
comment on function operaciones.periodo_guardia(text, bigint, integer) is 'Período y vencimiento de la obligación de guardia según la categoría de la Orden 01/2026.';

create or replace function operaciones.obligacion_guardia(
  p_persona_id uuid,
  p_ciclo_id bigint,
  p_semana integer
)
returns table (
  categoria text,
  exento boolean,
  periodo_inicio date,
  periodo_fin date,
  vence_esta_semana boolean,
  descripcion text,
  cumplido_en_periodo boolean,
  guardias_en_periodo integer
)
language plpgsql
stable
security definer
set search_path = operaciones, personal, public
as $$
declare
  v_anti personal.v_antiguedad_persona;
  v_periodo record;
  v_cumplidas integer;
begin
  select * into v_anti from personal.v_antiguedad_persona where persona_id = p_persona_id;
  if v_anti.persona_id is null then
    raise exception 'La persona no existe.';
  end if;

  select * into v_periodo from operaciones.periodo_guardia(v_anti.categoria_guardia, p_ciclo_id, p_semana);

  select count(*)::int into v_cumplidas
    from operaciones.guardia_integrante gi
    join operaciones.guardia_turno t on t.id = gi.turno_id
   where gi.persona_id = p_persona_id
     and gi.estado in ('inscrito', 'cumplida')
     and t.fecha between v_periodo.inicio and v_periodo.fin;

  return query select
    v_anti.categoria_guardia,
    coalesce(v_anti.exento_efectivo, false),
    v_periodo.inicio,
    v_periodo.fin,
    v_periodo.vence_esta_semana,
    v_periodo.descripcion,
    v_cumplidas > 0,
    v_cumplidas;
end
$$;
comment on function operaciones.obligacion_guardia(uuid, bigint, integer) is 'Obligación de guardia de una persona en la semana indicada, según su categoría.';

-- El permiso de gestión no debe depender de `current_user`, que dentro de
-- una función SECURITY DEFINER pasa a ser el dueño (postgres) y dejaría
-- pasar a cualquiera. Se usa el rol de la sesión.
create or replace function operaciones.puede_gestionar_guardias()
returns boolean
language sql
stable
as $$
  select seguridad.tiene_rol('capitan', 'teniente_1', 'ayudante', 'director', 'admin')
      or coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') in ('service_role', 'postgres')
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
$$;
comment on function operaciones.puede_gestionar_guardias() is 'Roles que agendan, asignan y envían avisos de guardia.';

-- ---------------------------------------------------------------------
-- 4. Pendientes y destinatarios según la obligación real
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
  cross join lateral operaciones.obligacion_guardia(v.persona_id, p_ciclo, p_semana) o
  where v.estado = 'activo'
    and not o.exento
    and o.vence_esta_semana
    and not o.cumplido_en_periodo
    and not exists (
      select 1
      from operaciones.guardia_integrante gi
      join operaciones.guardia_turno t on t.id = gi.turno_id
      where t.ciclo_id = p_ciclo
        and t.semana_num = p_semana::smallint
        and gi.persona_id = v.persona_id
        and gi.estado in ('inscrito', 'cumplida')
    )
  order by v.registro
$$;
comment on function operaciones.pendientes_de_semana(bigint, integer) is 'Bomberos a quienes les vence la guardia esta semana y aún no la cumplen.';

create or replace function operaciones.destinatarios_convocatoria(p_ciclo bigint, p_semana integer)
returns table (persona_id uuid, registro integer, nombre text, email text, telefono text, categoria text)
language sql
stable
security definer
set search_path = operaciones, personal, public
as $$
  select p.id, v.registro,
         p.nombres || ' ' || p.apellido_paterno,
         p.email, p.telefono,
         o.categoria
  from personal.persona p
  join personal.v_antiguedad_persona v on v.persona_id = p.id
  cross join lateral operaciones.obligacion_guardia(p.id, p_ciclo, p_semana) o
  where p.estado = 'activo'
    and not o.exento
    and o.vence_esta_semana
    and not o.cumplido_en_periodo
  order by v.registro
$$;
comment on function operaciones.destinatarios_convocatoria(bigint, integer) is 'Destinatarios del aviso semanal: solo quienes deben cubrir guardia y no la han cumplido.';

-- `puede_cumplir_guardia` y el cierre usan ahora la obligación real.
create or replace function operaciones.puede_cumplir_guardia(p_persona uuid)
returns boolean
language sql
stable
security definer
set search_path = personal, public
as $$
  select exists (
    select 1 from personal.v_antiguedad_persona v
    where v.persona_id = p_persona
      and v.estado = 'activo'
      and not coalesce(v.exento_efectivo, false)
  )
$$;

-- ---------------------------------------------------------------------
-- 5. Cierre de semana con validación de rol y obligación por categoría
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
  if not operaciones.puede_gestionar_guardias() then
    raise exception 'Solo Capitanía, Teniente 1°, Ayudante, Director o admin pueden cerrar la semana.'
      using errcode = 'insufficient_privilege';
  end if;

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

-- ---------------------------------------------------------------------
-- 6. Inscribirse: origen según quién asigna
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
  v_yo uuid := seguridad.mi_persona();
  v_persona uuid := coalesce(p_persona_id, v_yo);
  v_turno operaciones.guardia_turno;
  v_ciclo operaciones.guardia_ciclo;
  v_guardianes integer;
  v_semana_cubierta boolean;
  v_por_capitania boolean := false;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;

  if v_persona <> v_yo then
    if not operaciones.puede_gestionar_guardias() then
      raise exception 'Solo Capitanía puede inscribir a otro bombero.' using errcode = 'insufficient_privilege';
    end if;
    v_por_capitania := true;
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

  perform pg_advisory_xact_lock(hashtext('guardia_ciclo_' || v_turno.ciclo_id::text));

  v_guardianes := operaciones.guardianes_del_dia(p_turno_id);
  v_semana_cubierta := operaciones.semana_cubierta(v_turno.ciclo_id, v_turno.semana_num::integer, v_ciclo.cupo_base::integer);

  -- La asignación de Capitanía puede sobrepasar el tope.
  if not v_por_capitania and v_guardianes >= v_ciclo.cupo_base and not v_semana_cubierta then
    raise exception 'Día lleno (%/%). Elige un día que aún falte cubrir.', v_guardianes, v_ciclo.cupo_base;
  end if;

  insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado)
  values (p_turno_id, v_persona,
          case when v_por_capitania
               then 'asignacion_capitania'::operaciones.origen_integrante
               else 'inscripcion'::operaciones.origen_integrante
          end,
          'inscrito')
  on conflict (turno_id, persona_id) do update
    set origen = excluded.origen, estado = excluded.estado;
end
$$;

-- ---------------------------------------------------------------------
-- 7. Bajarse: permite autoasignados, reemplazos y asignaciones
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
  v_estado operaciones.estado_turno;
begin
  if v_persona is null then
    raise exception 'No hay una persona vinculada a la sesión.';
  end if;

  select estado into v_estado from operaciones.guardia_turno where id = p_turno_id;
  if v_estado = 'firmada' then
    raise exception 'La guardia ya está firmada.';
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
     and origen in ('inscripcion', 'asignacion_capitania', 'autoasignacion', 'reemplazo');

  if not found then
    raise exception 'No estás inscrito en esta guardia.';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 8. Reemplazo: notificación con el nombre
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
  v_nombre text;
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

  select p.nombres || ' ' || p.apellido_paterno || ' (Reg. ' || p.registro || ')'
    into v_nombre
    from personal.persona p
   where p.id = v_persona;

  update operaciones.guardia_integrante
     set estado = 'reemplazado', reemplazo_nota = p_motivo
   where turno_id = p_turno_id and persona_id = v_persona;

  insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado, reemplaza_a_persona_id, reemplazo_nota)
  values (p_turno_id, p_reemplazante_id, 'reemplazo', 'inscrito', v_persona, p_motivo)
  on conflict (turno_id, persona_id) do update
    set estado = 'inscrito', origen = 'reemplazo', reemplaza_a_persona_id = v_persona;

  insert into operaciones.guardia_notificacion (turno_id, persona_id, tipo, canal, mensaje)
  values (p_turno_id, p_reemplazante_id, 'reemplazo', 'app',
          format('Quedaste como reemplazante de %s en la guardia.', v_nombre));
end
$$;

-- ---------------------------------------------------------------------
-- 9. Estadísticas sin la condición duplicada
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
  if not seguridad.es_oficial() then
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
-- 10. Mi cumplimiento con el estado real por categoría
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
  v_obligacion record;
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

  if v_ciclo.id is null then
    return jsonb_build_object(
      'vinculado', true,
      'persona_id', v_persona,
      'anios_servicio', v_anti.anios_servicio,
      'origen_antiguedad', v_anti.origen_antiguedad,
      'categoria_guardia', v_anti.categoria_guardia,
      'exento', coalesce(v_anti.exento_efectivo, false),
      'motivo_exencion', v_anti.motivo_exencion,
      'requiere_guardia', not coalesce(v_anti.exento_efectivo, false),
      'pendiente', false
    );
  end if;

  select * into v_obligacion from operaciones.obligacion_guardia(v_persona, v_ciclo.id, 2);

  select
    count(*) filter (where gi.estado = 'cumplida')::int,
    count(*) filter (where gi.estado = 'inscrito')::int
    into v_cumplidas, v_inscripciones
  from operaciones.guardia_integrante gi
  join operaciones.guardia_turno t on t.id = gi.turno_id
  where gi.persona_id = v_persona
    and t.ciclo_id = v_ciclo.id;

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
    'periodo_inicio', v_obligacion.periodo_inicio,
    'periodo_fin', v_obligacion.periodo_fin,
    'periodo_descripcion', v_obligacion.descripcion,
    'vence_esta_semana', v_obligacion.vence_esta_semana,
    'cumplido_en_periodo', v_obligacion.cumplido_en_periodo,
    'guardias_en_periodo', v_obligacion.guardias_en_periodo,
    'cumplidas', v_cumplidas,
    'inscritas', v_inscripciones,
    'requiere_guardia', not coalesce(v_anti.exento_efectivo, false),
    'pendiente', not coalesce(v_anti.exento_efectivo, false)
                and v_obligacion.vence_esta_semana
                and not v_obligacion.cumplido_en_periodo
                and v_inscripciones = 0,
    'notificaciones_sin_leer', v_sin_leer
  );
end
$$;

-- Permisos
grant execute on function operaciones.periodo_guardia(text, bigint, integer) to authenticated, service_role;
grant execute on function operaciones.obligacion_guardia(uuid, bigint, integer) to authenticated, service_role;
grant execute on function operaciones.destinatarios_convocatoria(bigint, integer) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 11. Reporte: solo dotación o Capitanía según el rol de la sesión
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
    or coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') = 'service_role'
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
