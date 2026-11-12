-- =====================================================================
-- 0003 · Vistas de cruce y generación automática de alertas
-- =====================================================================
set search_path = gestion, public;

-- Asistencia por persona (excluye eximidos R y actos no obligatorios del denominador)
create or replace view v_asistencia_persona with (security_invoker = on) as
select p.id persona_id, p.registro, p.nombres || ' ' || p.apellido_paterno as nombre, l.anio,
  count(*) filter (where a.marca = 'A') asistencias,
  count(*) filter (where a.marca = 'F') faltas,
  count(*) filter (where a.marca in ('P','L')) permisos,
  count(*) filter (where a.marca = 'R') eximido,
  round(100.0 * count(*) filter (where a.marca = 'A')
        / nullif(count(*) filter (where a.marca in ('A','F','P','L')), 0), 1) pct
from persona p
join asistencia a on a.persona_id = p.id
join lista l on l.id = a.lista_id
group by p.id, l.anio;

-- Presupuesto vs ejecución (solo movimientos no anulados)
create or replace view v_presupuesto_ejecucion with (security_invoker = on) as
select pr.anio, pl.id linea_id, pl.tipo, pl.item, pl.monto_anual,
  coalesce(sum(m.monto) filter (where not m.anulado), 0) ejecutado,
  round(100.0 * coalesce(sum(m.monto) filter (where not m.anulado), 0) / nullif(pl.monto_anual, 0), 1) pct
from presupuesto pr
join presupuesto_linea pl on pl.presupuesto_id = pr.id
left join movimiento m on m.presupuesto_linea_id = pl.id and extract(year from m.fecha) = pr.anio
where pr.vigente
group by pr.anio, pl.id;

-- Cuotas: meses adeudados del año en curso
create or replace view v_cuotas_pendientes with (security_invoker = on) as
select p.id persona_id, p.registro, p.nombres || ' ' || p.apellido_paterno nombre, gs.periodo::date
from persona p
cross join generate_series(date_trunc('year', current_date), date_trunc('month', current_date), interval '1 month') gs(periodo)
left join cuota c on c.persona_id = p.id and c.periodo = gs.periodo::date
where p.estado = 'activo' and p.rango <> 'honorario' and c.persona_id is null;

-- Saldo de campaña disponible para EPP
create or replace view v_saldo_campana with (security_invoker = on) as
select cs.persona_id, ca.anio, cs.venta_total, cs.adicional, cs.saldo_arrastre,
  cs.adicional + cs.saldo_arrastre
    - coalesce((select sum(i.valor) from item_inventario i join asignacion s on s.item_id = i.id
                where s.persona_id = cs.persona_id and s.origen = 'campana'), 0) saldo_disponible
from campana_saldo cs join campana ca on ca.id = cs.campana_id;

-- ---------- Reglas de alerta ----------
create or replace function generar_alertas() returns int
language plpgsql security definer set search_path = gestion, public as $$
declare n int := 0; k int;
begin
  -- R01 · EPP a cargo y asistencia bajo 10 % en el año
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R01_EPP_SIN_ASISTENCIA', 'persona', v.persona_id::text,
         format('%s tiene %s artículos a cargo y %s%% de asistencia en %s.', v.nombre, x.n, coalesce(v.pct,0), v.anio), 1
  from v_asistencia_persona v
  join (select persona_id, count(*) n from asignacion where fecha_devolucion is null group by 1) x using (persona_id)
  where v.anio = extract(year from current_date) and coalesce(v.pct,0) < 10
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R02 · Egreso sin comprobante
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R02_EGRESO_SIN_COMPROBANTE', 'movimiento', m.id::text,
         format('Egreso de $%s el %s (%s) sin comprobante adjunto.', to_char(m.monto,'FM999G999G999'), m.fecha, m.glosa), 1
  from movimiento m where m.tipo = 'egreso' and not m.anulado and not m.tiene_comprobante
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R03 · Movimiento sin línea de presupuesto
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R03_SIN_PRESUPUESTO', 'movimiento', m.id::text,
         format('%s de $%s (%s) no está imputado a una línea del presupuesto.', initcap(m.tipo::text), to_char(m.monto,'FM999G999G999'), m.glosa), 2
  from movimiento m where m.presupuesto_linea_id is null and not m.anulado
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R04 · Acuerdo con monto y sin pago asociado después de su plazo (o 60 días)
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R04_ACUERDO_SIN_PAGO', 'acuerdo', ac.id::text,
         format('Acuerdo del %s por $%s sin movimiento asociado: %s', a.fecha, to_char(ac.monto,'FM999G999G999'), left(ac.texto, 120)), 2
  from acuerdo ac join acta a on a.id = ac.acta_id
  where ac.monto is not null and ac.estado in ('pendiente','en_curso')
    and coalesce(ac.plazo, a.fecha + 60) < current_date
    and not exists (select 1 from acuerdo_movimiento am where am.acuerdo_id = ac.id)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R05 · Persona no activa con prendas sin devolver
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R05_PRENDAS_SIN_DEVOLVER', 'persona', p.id::text,
         format('%s %s (%s) mantiene %s artículos sin devolver.', p.nombres, p.apellido_paterno, p.estado, count(*)), 1
  from persona p join asignacion s on s.persona_id = p.id and s.fecha_devolucion is null
  where p.estado <> 'activo' group by p.id
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R06 · Cierre mensual que no cuadra con la cartola
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R06_CARTOLA_NO_CUADRA', 'cierre_mensual', c.periodo::text,
         format('%s: saldo libro $%s vs cartola $%s (diferencia $%s; cheques no cobrados $%s).', to_char(c.periodo,'MM-YYYY'),
           to_char(c.saldo_final,'FM999G999G999'), to_char(c.saldo_cartola,'FM999G999G999'),
           to_char(c.saldo_cartola - c.saldo_final,'FM999G999G999'), to_char(coalesce(c.cheques_no_cobrados,0),'FM999G999G999')), 2
  from cierre_mensual c
  where c.saldo_cartola is not null and c.saldo_cartola - c.saldo_final <> coalesce(c.cheques_no_cobrados, 0)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R07 · Ítems de unidades en mal estado o sin revisar hace más de 6 meses
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R07_ITEM_MALO', 'item_inventario', i.id::text,
         format('%s · %s (%s) en estado malo.', u.codigo, ar.nombre, coalesce(i.ubicacion,'s/ubicación')), 2
  from item_inventario i join articulo ar on ar.id = i.articulo_id left join unidad u on u.id = i.unidad_id
  where i.estado = 'malo'
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R08_UNIDAD_SIN_REVISION', 'unidad', u.id::text,
         format('%s sin revisión de inventario desde %s.', u.codigo, coalesce(max(r.fecha)::text, 'nunca')), 3
  from unidad u left join revision_inventario r on r.unidad_id = u.id
  group by u.id having coalesce(max(r.fecha), date '1900-01-01') < current_date - 180
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R09 · Documentación de unidades por vencer (30 días)
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R09_DOC_UNIDAD_VENCE', 'unidad', u.id::text,
         format('%s: revisión técnica vence %s, seguro vence %s.', u.codigo, u.revision_tecnica_vence, u.seguro_vence), 1
  from unidad u
  where least(coalesce(u.revision_tecnica_vence,'9999-12-31'), coalesce(u.seguro_vence,'9999-12-31')) < current_date + 30
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R10 · Cargo de oficial sin la antigüedad mínima (parámetro: 2 años; ajustar al reglamento)
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R10_CARGO_SIN_ANTIGUEDAD', 'cargo_periodo', c.id::text,
         format('%s asumió %s el %s con %s años de antigüedad (mínimo configurado: 2).', p.nombres || ' ' || p.apellido_paterno, c.cargo, c.desde,
                extract(year from age(c.desde, p.fecha_ingreso))), 2
  from cargo_periodo c join persona p on p.id = c.persona_id
  where c.hasta is null and p.fecha_ingreso is not null and age(c.desde, p.fecha_ingreso) < interval '2 years'
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R11 · Candidatos a premio de constancia (múltiplos de 5 años este año sin premio registrado)
  insert into alerta(regla, entidad, entidad_id, detalle, severidad)
  select 'R11_PREMIO_CONSTANCIA_' || extract(year from current_date), 'persona', p.id::text,
         format('%s cumple %s años de servicio en %s; no hay premio registrado (verificar requisitos del reglamento).',
                p.nombres || ' ' || p.apellido_paterno, extract(year from current_date) - extract(year from p.fecha_ingreso), extract(year from current_date)), 3
  from persona p
  where p.estado = 'activo' and p.fecha_ingreso is not null
    and (extract(year from current_date) - extract(year from p.fecha_ingreso))::int % 5 = 0
    and (extract(year from current_date) - extract(year from p.fecha_ingreso)) > 0
    and not exists (select 1 from premio pr where pr.persona_id = p.id and pr.tipo = 'Constancia'
                    and pr.anios = (extract(year from current_date) - extract(year from p.fecha_ingreso))::int)
  on conflict do nothing;
  get diagnostics k = row_count; n := n + k;

  return n;
end $$;

-- Ejecutar cada noche a las 03:00 (Supabase: extensión pg_cron)
-- create extension if not exists pg_cron;
-- select cron.schedule('alertas-nocturnas', '0 6 * * *', $$select gestion.generar_alertas()$$);  -- 06:00 UTC ≈ 03:00 Chile
