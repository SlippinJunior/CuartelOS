-- =====================================================================
-- 20261112001800 · Tesorería: registro de cuotas y cartola automática
-- =====================================================================
set search_path = tesoreria, personal, nucleo, seguridad, public;

alter table tesoreria.cuota_pago
  add column if not exists anulada boolean not null default false,
  add column if not exists motivo_anulacion text,
  add column if not exists anulada_por uuid,
  add column if not exists anulada_en timestamptz;

comment on column tesoreria.cuota_pago.anulada is 'Pago anulado: se conserva la fila y se anula el movimiento asociado.';

-- La categoría de cuotas (1001001) se crea desde la RPC si no existe, para
-- no chocar con los IDs explícitos del seed o de la importación.

-- ---------------------------------------------------------------------
-- Registrar pago: crea el movimiento de cartola y la cuota en una sola
-- transacción. Devuelve el id del movimiento.
-- ---------------------------------------------------------------------
create or replace function tesoreria.registrar_pago_cuota(
  p_persona_id uuid,
  p_periodo date,
  p_monto numeric default null,
  p_fecha date default current_date,
  p_medio_pago tesoreria.medio_pago default 'transferencia',
  p_n_documento text default null,
  p_observacion text default null
)
returns bigint
language plpgsql
security definer
set search_path = tesoreria, personal, nucleo, seguridad, public
as $$
declare
  v_monto numeric(10,0);
  v_categoria bigint;
  v_cuenta bigint;
  v_fondo bigint;
  v_movimiento bigint;
  v_nombre text;
  v_cuota tesoreria.cuota_pago;
begin
  if not seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin') then
    raise exception 'Solo Tesorería, Director o admin pueden registrar cuotas.'
      using errcode = 'insufficient_privilege';
  end if;

  if extract(day from p_periodo) <> 1 then
    raise exception 'El período debe ser el primer día del mes.';
  end if;

  if not exists (select 1 from personal.persona where id = p_persona_id) then
    raise exception 'La persona no existe.';
  end if;

  select coalesce(
    p_monto,
    (select cv.monto
       from tesoreria.cuota_valor cv
      where cv.anio = extract(year from p_periodo)::int
        and cv.vigente_desde <= p_periodo
        and (cv.vigente_hasta is null or cv.vigente_hasta >= p_periodo)
      order by cv.vigente_desde desc
      limit 1)
  ) into v_monto;

  if v_monto is null or v_monto <= 0 then
    raise exception 'No hay un valor de cuota configurado para ese período.';
  end if;

  select id into v_categoria
    from tesoreria.categoria
   where codigo = '1001001'
   limit 1;
  if v_categoria is null then
    insert into tesoreria.categoria (codigo, nombre, tipo)
    values ('1001001', 'Cuotas sociales', 'ingreso')
    returning id into v_categoria;
  end if;

  select id into v_cuenta from tesoreria.cuenta where activa order by id limit 1;
  if v_cuenta is null then
    raise exception 'No hay una cuenta activa en tesorería.';
  end if;

  select id into v_fondo from tesoreria.fondo where codigo = 'PROPIO' limit 1;

  select nombres || ' ' || apellido_paterno into v_nombre
    from personal.persona where id = p_persona_id;

  select * into v_cuota
    from tesoreria.cuota_pago
   where persona_id = p_persona_id and periodo = p_periodo
   for update;

  if found and not v_cuota.anulada then
    raise exception 'La cuota de % ya está pagada.', to_char(p_periodo, 'MM-YYYY');
  end if;

  insert into tesoreria.movimiento (
    fecha, tipo, cuenta_id, fondo_id, categoria_id, monto, glosa,
    persona_id, medio_pago, n_documento, creado_por
  ) values (
    coalesce(p_fecha, current_date), 'ingreso', v_cuenta, v_fondo, v_categoria, v_monto,
    'Cuota social ' || to_char(p_periodo, 'MM-YYYY') || ' · ' || v_nombre,
    p_persona_id, p_medio_pago, p_n_documento, auth.uid()
  ) returning id into v_movimiento;

  if found and v_cuota.id is not null then
    update tesoreria.cuota_pago
       set monto = v_monto,
           movimiento_id = v_movimiento,
           observacion = p_observacion,
           anulada = false,
           motivo_anulacion = null,
           anulada_por = null,
           anulada_en = null
     where id = v_cuota.id;
  else
    insert into tesoreria.cuota_pago (persona_id, periodo, monto, movimiento_id, observacion)
    values (p_persona_id, p_periodo, v_monto, v_movimiento, p_observacion);
  end if;

  return v_movimiento;
end
$$;
comment on function tesoreria.registrar_pago_cuota(uuid, date, numeric, date, tesoreria.medio_pago, text, text) is 'Registra el pago de una cuota y su ingreso en la cartola en una sola transacción.';

-- ---------------------------------------------------------------------
-- Anular un pago: anula la cuota y su movimiento, con motivo.
-- ---------------------------------------------------------------------
create or replace function tesoreria.anular_pago_cuota(
  p_cuota_id bigint,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = tesoreria, seguridad, public
as $$
declare
  v_cuota tesoreria.cuota_pago;
begin
  if not seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin') then
    raise exception 'Solo Tesorería, Director o admin pueden anular cuotas.'
      using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Debe indicar el motivo de anulación.';
  end if;

  select * into v_cuota from tesoreria.cuota_pago where id = p_cuota_id for update;
  if not found then raise exception 'La cuota no existe.'; end if;
  if v_cuota.anulada then raise exception 'La cuota ya está anulada.'; end if;

  update tesoreria.cuota_pago
     set anulada = true,
         motivo_anulacion = p_motivo,
         anulada_por = auth.uid(),
         anulada_en = now()
   where id = p_cuota_id;

  if v_cuota.movimiento_id is not null then
    update tesoreria.movimiento
       set anulado = true,
           motivo_anulacion = p_motivo,
           anulado_por = auth.uid(),
           anulado_en = now()
     where id = v_cuota.movimiento_id;
  end if;
end
$$;
comment on function tesoreria.anular_pago_cuota(bigint, text) is 'Anula un pago de cuota y su movimiento de cartola, dejando el motivo.';

-- ---------------------------------------------------------------------
-- Estado de cuotas por año (grilla de 12 meses)
-- ---------------------------------------------------------------------
create or replace function tesoreria.fn_cuotas_estado(p_anio integer)
returns table (
  persona_id uuid,
  registro integer,
  nombre text,
  rango personal.rango,
  periodo date,
  estado text,
  monto numeric,
  monto_esperado numeric,
  cuota_id bigint,
  movimiento_id bigint,
  motivo_anulacion text
)
language sql
stable
security invoker
set search_path = tesoreria, personal, public
as $$
  with meses as (
    select (make_date(p_anio, 1, 1) + (n || ' months')::interval)::date as periodo
    from generate_series(0, 11) n
  ),
  base as (
    select
      p.id as persona_id,
      p.registro,
      p.nombres || ' ' || p.apellido_paterno as nombre,
      p.rango,
      p.fecha_ingreso,
      m.periodo,
      cp.id as cuota_id,
      cp.monto as monto_pagado,
      cp.movimiento_id,
      cp.anulada,
      cp.exento,
      cp.condonada,
      cp.motivo_anulacion,
      coalesce((
        select cv.monto from tesoreria.cuota_valor cv
        where cv.anio = extract(year from m.periodo)::int
          and cv.vigente_desde <= m.periodo
          and (cv.vigente_hasta is null or cv.vigente_hasta >= m.periodo)
        order by cv.vigente_desde desc limit 1
      ), 0) as monto_esperado
    from personal.persona p
    cross join meses m
    left join tesoreria.cuota_pago cp
      on cp.persona_id = p.id
     and cp.periodo = m.periodo
     and not cp.anulada
    where p.estado in ('activo', 'suspendido')
  )
  select
    b.persona_id,
    b.registro,
    b.nombre,
    b.rango,
    b.periodo,
    case
      when b.rango = 'honorario' then 'exento'
      when b.fecha_ingreso is not null
       and b.periodo < date_trunc('month', b.fecha_ingreso)::date then 'no_aplica'
      when b.cuota_id is not null and b.condonada then 'condonada'
      when b.cuota_id is not null and b.exento then 'exento'
      when b.cuota_id is not null then 'pagada'
      when b.periodo > date_trunc('month', current_date)::date then 'futura'
      else 'pendiente'
    end as estado,
    b.monto_pagado as monto,
    b.monto_esperado,
    b.cuota_id,
    b.movimiento_id,
    b.motivo_anulacion
  from base b
  order by b.registro, b.periodo
$$;
comment on function tesoreria.fn_cuotas_estado(integer) is 'Grilla de cuotas por persona y mes. Respeta RLS del llamador.';

-- Vista plana de cartola con categoría y fondo para la interfaz.
create or replace view tesoreria.v_cartola_detalle
with (security_invoker = on)
as
select
  m.id,
  m.cuenta_id,
  m.fecha,
  m.tipo,
  m.monto,
  m.glosa,
  m.anulado,
  m.motivo_anulacion,
  m.medio_pago,
  m.n_documento,
  c.nombre as categoria,
  f.nombre as fondo,
  sum(case when m.anulado then 0 when m.tipo = 'ingreso' then m.monto else -m.monto end)
    over (partition by m.cuenta_id order by m.fecha, m.id
          rows between unbounded preceding and current row) as saldo
from tesoreria.movimiento m
left join tesoreria.categoria c on c.id = m.categoria_id
left join tesoreria.fondo f on f.id = m.fondo_id;
comment on view tesoreria.v_cartola_detalle is 'Cartola con saldo corriente, categoría y fondo.';

grant execute on function tesoreria.registrar_pago_cuota(uuid, date, numeric, date, tesoreria.medio_pago, text, text) to authenticated;
grant execute on function tesoreria.anular_pago_cuota(bigint, text) to authenticated;
grant execute on function tesoreria.fn_cuotas_estado(integer) to authenticated;
grant select on tesoreria.v_cartola_detalle to authenticated;
