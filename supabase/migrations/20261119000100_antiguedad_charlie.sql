-- =====================================================================
-- 20261119000100 · Antigüedad de servicio y Código Charlie
-- =====================================================================
set search_path = personal, nucleo, seguridad, public;

-- ---------------------------------------------------------------------
-- Campos nuevos en personal.persona
-- ---------------------------------------------------------------------
alter table personal.persona
  add column if not exists anios_servicio_manual integer,
  add column if not exists exento_guardia boolean not null default false,
  add column if not exists motivo_exencion text,
  add column if not exists codigo_charlie text;

alter table personal.persona
  drop constraint if exists persona_anios_servicio_manual_check;
alter table personal.persona
  add constraint persona_anios_servicio_manual_check
  check (anios_servicio_manual is null or anios_servicio_manual >= 0);

comment on column personal.persona.anios_servicio_manual is 'Ajuste manual de años de servicio. Solo Director, Secretario o admin.';
comment on column personal.persona.exento_guardia is 'Exención manual de guardia (Oficiales Generales, Miembros Honorarios del Directorio General).';
comment on column personal.persona.motivo_exencion is 'Motivo de la exención manual de guardia.';
comment on column personal.persona.codigo_charlie is 'Código de maquinista (Charlie), por ejemplo CH-201. Único sin distinguir mayúsculas.';

create unique index if not exists persona_codigo_charlie_uk
  on personal.persona (upper(trim(codigo_charlie)))
  where codigo_charlie is not null and trim(codigo_charlie) <> '';

-- ---------------------------------------------------------------------
-- Protección: solo Director / Secretario / admin ajustan antigüedad manual
-- y exenciones. El resto de la oficialidad puede editar la ficha.
-- ---------------------------------------------------------------------
create or replace function personal.fn_proteger_campos_sensibles()
returns trigger
language plpgsql
security definer
set search_path = personal, seguridad, public
as $$
begin
  if (new.anios_servicio_manual is distinct from old.anios_servicio_manual
      or new.exento_guardia is distinct from old.exento_guardia
      or new.motivo_exencion is distinct from old.motivo_exencion)
     and not (seguridad.tiene_rol('director', 'secretario', 'admin')
              -- Semilla, importación, migraciones y Edge Functions usan el rol de servicio.
              or auth.role() = 'service_role'
              or current_user in ('postgres', 'supabase_admin')) then
    raise exception 'Solo Director, Secretario o admin pueden ajustar la antigüedad manual o la exención de guardia.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end
$$;
comment on function personal.fn_proteger_campos_sensibles() is 'Impide que roles distintos de Director, Secretario o admin cambien antigüedad manual y exenciones.';

drop trigger if exists persona_campos_sensibles on personal.persona;
create trigger persona_campos_sensibles
  before update on personal.persona
  for each row execute function personal.fn_proteger_campos_sensibles();

-- ---------------------------------------------------------------------
-- Categoría de guardia (Orden 01/2026 §3)
-- ---------------------------------------------------------------------
create or replace function personal.categoria_guardia_de(
  p_anios integer,
  p_fecha_nacimiento date,
  p_exento boolean
)
returns text
language sql
immutable
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

-- ---------------------------------------------------------------------
-- Vista de antigüedad
-- ---------------------------------------------------------------------
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
  coalesce(
    p.exento_guardia,
    (p.fecha_nacimiento is not null and extract(year from age(current_date, p.fecha_nacimiento)) >= 60),
    floor(coalesce(max(pp.anios), 0) + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0)) >= 35,
    false
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
comment on view personal.v_antiguedad_persona is 'Años de servicio calculados desde premios de constancia + abonos, con ajuste manual opcional; incluye categoría de guardia.';

-- Vista plana de abonos para la pestaña Premios.
create or replace view personal.v_abono_persona
with (security_invoker = on)
as
select
  a.id,
  a.persona_id,
  a.anios,
  a.fecha,
  a.motivo,
  a.resolucion,
  a.archivo_id,
  a.creado_en
from personal.antiguedad_abono a;
comment on view personal.v_abono_persona is 'Abonos de antigüedad por persona.';

-- ---------------------------------------------------------------------
-- Hoja de vida: antigüedad efectiva y Charlie
-- ---------------------------------------------------------------------
create or replace view personal.v_hoja_vida
with (security_invoker = on)
as
select
  p.id as persona_id,
  jsonb_build_object(
    'persona_id', p.id,
    'nombre', p.nombres || ' ' || p.apellido_paterno || coalesce(' ' || p.apellido_materno, ''),
    'nombres', p.nombres,
    'apellido_paterno', p.apellido_paterno,
    'apellido_materno', p.apellido_materno,
    'registro', p.registro,
    'rut', p.rut,
    'rango', p.rango,
    'estado', p.estado,
    'fecha_nacimiento', p.fecha_nacimiento,
    'fecha_ingreso', p.fecha_ingreso,
    'email', p.email,
    'telefono', p.telefono,
    'direccion', p.direccion,
    'codigo_charlie', p.codigo_charlie,
    'anios_servicio', (select anios_servicio from personal.v_antiguedad_persona v where v.persona_id = p.id),
    'origen_antiguedad', (select origen_antiguedad from personal.v_antiguedad_persona v where v.persona_id = p.id),
    'categoria_guardia', (select categoria_guardia from personal.v_antiguedad_persona v where v.persona_id = p.id),
    'exento_guardia', (select exento_efectivo from personal.v_antiguedad_persona v where v.persona_id = p.id),
    'antiguedad', case when p.fecha_ingreso is null then null
                       else extract(year from age(current_date, p.fecha_ingreso))::int end,
    'cargo_actual', (
      select c.nombre from personal.cargo_periodo cp
      join personal.cargo c on c.id = cp.cargo_id
      where cp.persona_id = p.id and (cp.hasta is null or cp.hasta >= current_date)
      order by cp.desde desc limit 1
    ),
    'nivel_anb', (
      select c.nivel from personal.persona_curso pc
      join personal.curso c on c.id = pc.curso_id
      where pc.persona_id = p.id
      order by pc.fecha_aprobacion desc nulls last limit 1
    ),
    'asistencia', coalesce((
      select jsonb_build_object(
        'periodo', v.anio, 'a', v.asistencias, 'f', v.faltas,
        'p', v.permisos, 'pct', coalesce(v.pct, 0)
      )
      from personal.v_asistencia_persona v
      where v.persona_id = p.id and v.anio = extract(year from current_date)::int
    ), jsonb_build_object('periodo', extract(year from current_date)::int, 'a', 0, 'f', 0, 'p', 0, 'pct', 0)),
    'cargos', coalesce((
      select jsonb_agg(jsonb_build_object('cargo', c.nombre, 'desde', cp.desde, 'hasta', cp.hasta) order by cp.desde desc)
      from personal.cargo_periodo cp
      join personal.cargo c on c.id = cp.cargo_id
      where cp.persona_id = p.id
    ), '[]'::jsonb),
    'cursos', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', c.nombre, 'nivel', c.nivel, 'fecha', pc.fecha_aprobacion) order by pc.fecha_aprobacion desc nulls last)
      from personal.persona_curso pc
      join personal.curso c on c.id = pc.curso_id
      where pc.persona_id = p.id
    ), '[]'::jsonb),
    'premios', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', pt.nombre, 'anios', pp.anios, 'fecha', pp.fecha) order by pp.fecha desc nulls last)
      from personal.persona_premio pp
      join personal.premio_tipo pt on pt.id = pp.premio_tipo_id
      where pp.persona_id = p.id
    ), '[]'::jsonb),
    'material', coalesce((
      select jsonb_agg(jsonb_build_object('articulo', a.nombre, 'cantidad', s.cantidad, 'origen', s.origen) order by a.nombre)
      from material.asignacion s
      join material.articulo a on a.id = s.articulo_id
      where s.persona_id = p.id and s.fecha_devolucion is null
    ), '[]'::jsonb),
    'cuotas', jsonb_build_object(
      'periodo', extract(year from current_date)::int,
      'pagadas', (
        select count(*) from tesoreria.cuota_pago cp
        where cp.persona_id = p.id and extract(year from cp.periodo) = extract(year from current_date)
          and not cp.condonada
      ),
      'pendientes', (
        select greatest(
          extract(month from current_date)::int
            - (select count(*)::int from tesoreria.cuota_pago cp
               where cp.persona_id = p.id and extract(year from cp.periodo) = extract(year from current_date)),
          0)
      )
    ),
    'campana', (
      select jsonb_build_object(
        'anio', ca.anio, 'venta', cp.venta_total,
        'adicional', cp.aporte_adicional, 'saldo', cp.aporte_adicional + cp.saldo_arrastre,
        'obs', coalesce(cp.observacion, '')
      )
      from tesoreria.campana_participacion cp
      join tesoreria.campana ca on ca.id = cp.campana_id
      where cp.persona_id = p.id
      order by ca.anio desc limit 1
    ),
    'compania', (
      select jsonb_build_object('nombre', co.nombre, 'cuerpo', co.cuerpo, 'lema', co.lema)
      from nucleo.compania co order by co.id limit 1
    )
  ) as datos
from personal.persona p;
comment on view personal.v_hoja_vida is 'Hoja de vida (P3) completa en JSON, sin datos sensibles. Incluye antigüedad efectiva y categoría de guardia.';

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
grant select on personal.v_antiguedad_persona, personal.v_abono_persona to authenticated;
grant select on personal.v_antiguedad_persona, personal.v_abono_persona to service_role;
grant execute on function personal.categoria_guardia_de(integer, date, boolean) to authenticated, service_role;
