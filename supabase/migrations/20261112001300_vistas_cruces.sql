-- =====================================================================
-- 20261112001300 · Vistas de cruce, hoja de vida, plazos y alertas R01–R12
-- =====================================================================
set search_path = personal, asistencia, material, tesoreria, secretaria, nucleo, seguridad, public;

-- ---------------------------------------------------------------------
-- Asistencia por persona y año
-- ---------------------------------------------------------------------
create view personal.v_asistencia_persona
with (security_invoker = on)
as
select
  p.id as persona_id,
  p.registro,
  p.nombres || ' ' || p.apellido_paterno as nombre,
  l.anio,
  count(*) filter (where a.marca = 'A') as asistencias,
  count(*) filter (where a.marca = 'F') as faltas,
  count(*) filter (where a.marca in ('P', 'L')) as permisos,
  count(*) filter (where a.marca = 'R') as eximidos,
  count(*) filter (where a.marca = 'S') as suspensiones,
  round(
    100.0 * count(*) filter (where a.marca = 'A')
    / nullif(count(*) filter (where a.marca in ('A', 'F', 'P', 'L')), 0),
    1
  ) as pct
from personal.persona p
join asistencia.asistencia a on a.persona_id = p.id
join asistencia.lista l on l.id = a.lista_id
group by p.id, p.registro, p.nombres, p.apellido_paterno, l.anio;
comment on view personal.v_asistencia_persona is 'Asistencias, faltas, permisos y porcentaje anual. R y S no entran al denominador.';

-- ---------------------------------------------------------------------
-- Hoja de vida (P3) como JSON
-- ---------------------------------------------------------------------
create view personal.v_hoja_vida
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
comment on view personal.v_hoja_vida is 'Hoja de vida (P3) completa en JSON, sin datos sensibles. Insumo de la Edge Function emitir-documento.';

-- ---------------------------------------------------------------------
-- Plazos y semáforo
-- ---------------------------------------------------------------------
create view material.v_plazos
with (security_invoker = on)
as
select
  u.id as unidad_id,
  u.codigo as unidad,
  d.tipo::text as tipo,
  d.vence,
  case
    when d.vence is null then 'sin_dato'
    when d.vence < current_date then 'vencido'
    when d.vence <= current_date + 30 then 'por_vencer'
    else 'al_dia'
  end as semaforo
from material.unidad_documento d
join material.unidad u on u.id = d.unidad_id;

create view personal.v_plazos
with (security_invoker = on)
as
select
  p.id as persona_id,
  p.registro,
  p.nombres || ' ' || p.apellido_paterno as nombre,
  'licencia_conducir'::text as tipo,
  l.clase as detalle,
  l.vence,
  case
    when l.vence is null then 'sin_dato'
    when l.vence < current_date then 'vencido'
    when l.vence <= current_date + 30 then 'por_vencer'
    else 'al_dia'
  end as semaforo
from personal.licencia_conducir l
join personal.persona p on p.id = l.persona_id;

-- ---------------------------------------------------------------------
-- Reglas de alerta
-- ---------------------------------------------------------------------
insert into nucleo.regla_alerta (codigo, nombre, descripcion, severidad) values
  ('R01_EPP_SIN_ASISTENCIA', 'EPP a cargo sin asistencia', 'Tiene artículos a cargo y menos de 10% de asistencia anual.', 1),
  ('R02_EGRESO_SIN_COMPROBANTE', 'Egreso sin comprobante', 'Egreso registrado sin comprobante adjunto.', 1),
  ('R03_SIN_PRESUPUESTO', 'Movimiento sin categoría', 'Movimiento no imputado a una categoría presupuestaria.', 2),
  ('R04_ACUERDO_SIN_PAGO', 'Acuerdo sin pago', 'Acuerdo con monto, vencido, sin compromiso ni movimiento.', 2),
  ('R05_PRENDAS_SIN_DEVOLVER', 'Prendas sin devolver', 'Persona no activa con artículos sin devolver.', 1),
  ('R06_CARTOLA_NO_CUADRA', 'Cartola no cuadra', 'Cierre mensual con diferencia no explicada por cheques.', 2),
  ('R07_ITEM_MALO', 'Ítem en mal estado', 'Artículo del inventario marcado como malo.', 2),
  ('R08_UNIDAD_SIN_REVISION', 'Unidad sin revisión', 'Unidad sin revisión de inventario en 6 meses.', 3),
  ('R09_DOC_UNIDAD_VENCE', 'Documento de unidad por vencer', 'Revisión técnica, seguro o permiso vence en 30 días.', 1),
  ('R10_CARGO_SIN_ANTIGUEDAD', 'Cargo sin antigüedad mínima', 'Oficial asumió sin la antigüedad configurada.', 2),
  ('R11_PREMIO_CONSTANCIA', 'Premio de constancia pendiente', 'Cumple un quinquenio sin premio registrado.', 3),
  ('R12_LISTA_SIN_CERRAR', 'Lista sin cerrar', 'Lista de asistencia con más de 48 horas sin cerrar.', 2)
on conflict (codigo) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion, severidad = excluded.severidad;

create or replace function seguridad.generar_alertas()
returns integer
language plpgsql
security definer
set search_path = nucleo, personal, asistencia, material, tesoreria, secretaria, seguridad, public
as $$
declare
  n integer := 0;
  k integer;
begin
  -- R01
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R01_EPP_SIN_ASISTENCIA', 'persona', v.persona_id::text,
         format('%s tiene %s artículos a cargo y %s%% de asistencia en %s.',
                v.nombre, x.n, coalesce(v.pct, 0), v.anio), 1
  from personal.v_asistencia_persona v
  join (select persona_id, count(*) n from material.asignacion
        where fecha_devolucion is null group by 1) x using (persona_id)
  where v.anio = extract(year from current_date) and coalesce(v.pct, 0) < 10
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R02
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R02_EGRESO_SIN_COMPROBANTE', 'movimiento', m.id::text,
         format('Egreso de $%s el %s (%s) sin comprobante adjunto.',
                to_char(m.monto, 'FM999G999G999'), m.fecha, m.glosa), 1
  from tesoreria.movimiento m
  where m.tipo = 'egreso' and not m.anulado and not m.tiene_comprobante
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R03
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R03_SIN_PRESUPUESTO', 'movimiento', m.id::text,
         format('%s de $%s (%s) no está imputado a una categoría.',
                initcap(m.tipo::text), to_char(m.monto, 'FM999G999G999'), m.glosa), 2
  from tesoreria.movimiento m
  where m.categoria_id is null and not m.anulado
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R04
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R04_ACUERDO_SIN_PAGO', 'acuerdo', ac.id::text,
         format('Acuerdo del %s por $%s sin compromiso ni pago: %s',
                a.fecha, to_char(ac.monto, 'FM999G999G999'), left(ac.texto, 120)), 2
  from secretaria.acuerdo ac
  join secretaria.acta a on a.id = ac.acta_id
  where ac.monto is not null and ac.estado in ('pendiente', 'en_curso')
    and coalesce(ac.plazo, a.fecha + 60) < current_date
    and not exists (select 1 from tesoreria.compromiso c where c.acuerdo_id = ac.id)
    and not exists (select 1 from tesoreria.movimiento m where m.acuerdo_id = ac.id)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R05
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R05_PRENDAS_SIN_DEVOLVER', 'persona', p.id::text,
         format('%s %s (%s) mantiene %s artículos sin devolver.',
                p.nombres, p.apellido_paterno, p.estado, count(*)), 1
  from personal.persona p
  join material.asignacion s on s.persona_id = p.id and s.fecha_devolucion is null
  where p.estado <> 'activo'
  group by p.id
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R06
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R06_CARTOLA_NO_CUADRA', 'cierre_mensual', c.periodo::text,
         format('%s: saldo libro $%s vs cartola $%s (diferencia $%s; cheques $%s).',
                to_char(c.periodo, 'MM-YYYY'),
                to_char(c.saldo_libro, 'FM999G999G999'), to_char(c.saldo_cartola, 'FM999G999G999'),
                to_char(c.saldo_cartola - c.saldo_libro, 'FM999G999G999'),
                to_char(coalesce(c.cheques_no_cobrados, 0), 'FM999G999G999')), 2
  from tesoreria.cierre_mensual c
  where c.saldo_cartola is not null and c.saldo_libro is not null
    and c.saldo_cartola - c.saldo_libro <> coalesce(c.cheques_no_cobrados, 0)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R07
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R07_ITEM_MALO', 'item', i.id::text,
         format('%s · %s (%s) en estado malo.',
                coalesce(u.codigo, 'Bodega'), a.nombre, coalesce(ub.nombre, 'sin ubicación')), 2
  from material.item i
  join material.articulo a on a.id = i.articulo_id
  left join material.ubicacion ub on ub.id = i.ubicacion_id
  left join material.unidad u on u.id = ub.unidad_id
  where i.estado = 'malo'
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R08
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R08_UNIDAD_SIN_REVISION', 'unidad', u.id::text,
         format('%s sin revisión de inventario desde %s.',
                u.codigo, coalesce(max(r.fecha)::text, 'nunca')), 3
  from material.unidad u
  left join material.revision_inventario r on r.unidad_id = u.id
  group by u.id
  having coalesce(max(r.fecha), date '1900-01-01') < current_date - 180
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R09
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R09_DOC_UNIDAD_VENCE', 'unidad_documento', d.id::text,
         format('%s: %s vence %s.', u.codigo, d.tipo, d.vence), 1
  from material.unidad_documento d
  join material.unidad u on u.id = d.unidad_id
  where d.vence is not null and d.vence <= current_date + 30
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R10
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R10_CARGO_SIN_ANTIGUEDAD', 'cargo_periodo', cp.id::text,
         format('%s asumió %s el %s con %s años de antigüedad (mínimo %s).',
                p.nombres || ' ' || p.apellido_paterno, c.nombre, cp.desde,
                extract(year from age(cp.desde, p.fecha_ingreso)),
                coalesce((select valor::text from nucleo.parametro where clave = 'antiguedad_minima_cargo_anios'), '2')), 2
  from personal.cargo_periodo cp
  join personal.persona p on p.id = cp.persona_id
  join personal.cargo c on c.id = cp.cargo_id
  where cp.hasta is null and p.fecha_ingreso is not null
    and age(cp.desde, p.fecha_ingreso) < make_interval(years =>
      coalesce((select (valor)::int from nucleo.parametro where clave = 'antiguedad_minima_cargo_anios'), 2))
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R11
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R11_PREMIO_CONSTANCIA', 'persona', p.id::text,
         format('%s cumple %s años de servicio en %s; no hay premio de constancia registrado.',
                p.nombres || ' ' || p.apellido_paterno,
                extract(year from current_date) - extract(year from p.fecha_ingreso),
                extract(year from current_date)), 3
  from personal.persona p
  where p.estado = 'activo' and p.fecha_ingreso is not null
    and (extract(year from current_date) - extract(year from p.fecha_ingreso))::int % 5 = 0
    and (extract(year from current_date) - extract(year from p.fecha_ingreso)) > 0
    and not exists (
      select 1 from personal.persona_premio pp
      join personal.premio_tipo pt on pt.id = pp.premio_tipo_id
      where pp.persona_id = p.id and pt.codigo = 'CONSTANCIA'
        and pp.anios = (extract(year from current_date) - extract(year from p.fecha_ingreso))::int
    )
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R12
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R12_LISTA_SIN_CERRAR', 'lista', l.id::text,
         format('Lista %s-%s del %s sigue en %s; plazo de 48 h vencido.',
                l.anio, l.numero, l.fecha, l.estado), 2
  from asistencia.lista l
  where l.estado = 'borrador'
    and l.fecha < current_date - 1
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  return n;
end
$$;
comment on function seguridad.generar_alertas() is 'Ejecuta las reglas R01–R12 y devuelve cuántas alertas nuevas creó. Uso interno (pg_cron).';

revoke all on function seguridad.generar_alertas() from public, anon, authenticated;
grant execute on function seguridad.generar_alertas() to service_role;

grant select on personal.v_asistencia_persona, personal.v_hoja_vida, personal.v_plazos to authenticated;
grant select on material.v_plazos to authenticated;
