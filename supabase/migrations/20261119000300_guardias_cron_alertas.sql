-- =====================================================================
-- 20261119000300 · Guardias: documento P7, alertas, panel y cron
-- =====================================================================
set search_path = operaciones, personal, nucleo, seguridad, documentos, public;

-- Tipo de documento P7 (Rol y Libro de Guardia).
insert into documentos.tipo_documento (codigo, nombre, descripcion, modulo, requiere_firma) values
  ('ROL_GUARDIA', 'Rol y Libro de Guardia', 'Rol semanal de guardia nocturna con dotación, maquinista y firmas.', 'operaciones', true)
on conflict (codigo) do update
  set nombre = excluded.nombre,
      descripcion = excluded.descripcion,
      modulo = excluded.modulo;

create policy documento_rol_guardia on documentos.documento_emitido
  for select using (tipo_documento_codigo = 'ROL_GUARDIA');

-- ---------------------------------------------------------------------
-- Reglas de alerta nuevas
-- ---------------------------------------------------------------------
insert into nucleo.regla_alerta (codigo, nombre, descripcion, severidad) values
  ('R13_GUARDIA_SIN_COBERTURA', 'Guardia sin cobertura', 'Turno nocturno de los próximos 7 días con menos del cupo base.', 1),
  ('R14_REPORTE_GUARDIA_SIN_FIRMAR', 'Reporte de guardia sin firmar', 'Turno constituido hace más de 12 horas sin firma del jefe.', 2)
on conflict (codigo) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion, severidad = excluded.severidad;

create or replace function operaciones.generar_alertas_guardia()
returns integer
language plpgsql
security definer
set search_path = operaciones, nucleo, personal, seguridad, public
as $$
declare
  n integer := 0;
  k integer;
begin
  -- R13 · turnos de la próxima semana con menos guardianes que el cupo base.
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R13_GUARDIA_SIN_COBERTURA', 'guardia_turno', t.id::text,
         format('Guardia del %s: %s de %s guardianes.', to_char(t.fecha, 'DD-MM-YYYY'),
                operaciones.guardianes_del_dia(t.id), c.cupo_base), 1
  from operaciones.guardia_turno t
  join operaciones.guardia_ciclo c on c.id = t.ciclo_id
  where t.fecha between current_date and current_date + 7
    and operaciones.guardianes_del_dia(t.id) < c.cupo_base
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R14 · reportes constituidos sin firma.
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R14_REPORTE_GUARDIA_SIN_FIRMAR', 'guardia_turno', t.id::text,
         format('Guardia del %s informada el %s sin firma del jefe.',
                to_char(t.fecha, 'DD-MM-YYYY'), to_char(t.reportado_en, 'DD-MM-YYYY HH24:MI')), 2
  from operaciones.guardia_turno t
  where t.estado = 'constituida'
    and t.reportado_en is not null
    and t.reportado_en < now() - interval '12 hours'
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  return n;
end
$$;

-- Se integra a la función nocturna existente.
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

  -- R13 y R14
  n := n + operaciones.generar_alertas_guardia();

  return n;
end
$$;

-- ---------------------------------------------------------------------
-- Parámetros de guardia
-- ---------------------------------------------------------------------
insert into nucleo.parametro (clave, valor, descripcion, grupo) values
  ('guardia_cupo_base', '3'::jsonb, 'Guardianes por día (Orden 01/2026 §2).', 'guardia'),
  ('guardia_aviso_dias_antes', '7'::jsonb, 'Días de anticipación del aviso de convocatoria.', 'guardia'),
  ('guardia_hora_aviso_llegada_tardia', '"09:00"'::jsonb, 'Hora de aviso matinal de llegadas tardías.', 'guardia'),
  ('guardia_notificar_url', '""'::jsonb, 'URL pública de la Edge Function notificar-guardias (opcional).', 'guardia')
on conflict (clave) do nothing;

-- ---------------------------------------------------------------------
-- Panel de inicio con contexto de guardia
-- ---------------------------------------------------------------------
create or replace function nucleo.panel_inicio()
returns jsonb
language sql
stable
security definer
set search_path = nucleo, seguridad, asistencia, tesoreria, personal, operaciones, public
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
    'guardia', operaciones.mi_cumplimiento_guardia(),
    'notificaciones_guardia', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'tipo', n.tipo, 'turno_id', n.turno_id,
        'mensaje', n.mensaje, 'creado_en', n.creado_en) order by n.creado_en desc)
      from operaciones.guardia_notificacion n
      where n.persona_id = seguridad.mi_persona()
        and n.leida_en is null
        and n.canal = 'app'
      limit 5
    ), '[]'::jsonb),
    'reportes_por_firmar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'turno_id', t.id, 'fecha', t.fecha,
        'detalle', format('Guardia del %s informada y sin firma.', to_char(t.fecha, 'DD-MM-YYYY')))
        order by t.fecha)
      from operaciones.guardia_turno t
      where t.estado = 'constituida'
        and (seguridad.mi_persona() = operaciones.jefe_guardia_de_turno(t.id)
             or seguridad.tiene_rol('capitan', 'teniente_1', 'director', 'admin'))
      limit 5
    ), '[]'::jsonb),
    'roles', coalesce((
      select jsonb_agg(r.rol::text)
      from seguridad.usuario_rol r
      where r.user_id = auth.uid() and r.desde <= current_date
        and (r.hasta is null or r.hasta >= current_date)
    ), '[]'::jsonb)
  )
$$;

grant execute on function operaciones.generar_alertas_guardia() to service_role;

-- ---------------------------------------------------------------------
-- pg_cron: aviso matinal de llegadas tardías (si hay pg_net configurado)
-- ---------------------------------------------------------------------
do $$
declare
  v_url text;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('guardias-avisos');
    exception when others then
      null;
    end;

    if exists (select 1 from pg_extension where extname = 'pg_net')
       and (select valor from nucleo.parametro where clave = 'guardia_notificar_url') is not null then
      v_url := trim(both '"' from ((select valor from nucleo.parametro where clave = 'guardia_notificar_url')::text));
    end if;

    if v_url is not null and v_url <> '' then
      perform cron.schedule(
        'guardias-avisos',
        '0 12 * * *', -- 12:00 UTC ≈ 09:00 Chile
        format(
          $job$select net.http_post(url := %L, headers := jsonb_build_object('Content-Type', 'application/json'), body := '{"modo":"llegadas_tardias"}'::jsonb)$job$,
          v_url
        )
      );
    end if;
  end if;
end
$$;
