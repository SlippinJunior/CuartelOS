-- =====================================================================
-- 20261112000800 · Tesorería: cuentas, fondos, movimientos, proyecciones
-- =====================================================================
set search_path = tesoreria, personal, nucleo, documentos, seguridad, public;

create type tesoreria.tipo_movimiento as enum ('ingreso', 'egreso');
create type tesoreria.medio_pago as enum ('transferencia', 'efectivo', 'cheque', 'tarjeta', 'otro');
create type tesoreria.estado_compromiso as enum ('comprometido', 'devengado', 'pagado', 'anulado');
create type tesoreria.frecuencia as enum ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'unica');
create type tesoreria.tipo_fondo as enum ('propio', 'publico', 'donacion', 'otro');

create table tesoreria.cuenta (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  banco     text,
  numero    text,
  tipo      text not null default 'corriente',
  moneda    text not null default 'CLP',
  activa    boolean not null default true,
  creado_en timestamptz not null default now()
);
comment on table tesoreria.cuenta is 'Cuenta bancaria de la compañía. Preparada para más de una.';

create table tesoreria.fondo (
  id        bigint generated always as identity primary key,
  codigo    text not null unique,
  nombre    text not null,
  tipo      tesoreria.tipo_fondo not null default 'propio',
  requiere_rendicion boolean not null default false,
  activo    boolean not null default true
);
comment on table tesoreria.fondo is 'Origen de los recursos: propios, públicos, donaciones. Habilita la rendición P14.';

insert into tesoreria.fondo (codigo, nombre, tipo, requiere_rendicion) values
  ('PROPIO', 'Fondos propios', 'propio', false),
  ('PUBLICO', 'Aporte fiscal o municipal', 'publico', true),
  ('DONACION', 'Donaciones', 'donacion', false);

create table tesoreria.categoria (
  id       bigint generated always as identity primary key,
  codigo   text not null unique,
  nombre   text not null,
  tipo     tesoreria.tipo_movimiento not null,
  padre_id bigint references tesoreria.categoria(id),
  activa   boolean not null default true
);
comment on table tesoreria.categoria is 'Categorías presupuestarias de ingreso y egreso. La ejecución se calcula por categoría y año.';

create table tesoreria.presupuesto (
  id       bigint generated always as identity primary key,
  anio     integer not null,
  version  integer not null default 1,
  acta_id  bigint,
  vigente  boolean not null default false,
  creado_en timestamptz not null default now(),
  unique (anio, version)
);
comment on table tesoreria.presupuesto is 'Presupuesto anual versionado. Solo uno vigente por año.';
create unique index presupuesto_un_vigente on tesoreria.presupuesto (anio) where vigente;

create table tesoreria.presupuesto_linea (
  id            bigint generated always as identity primary key,
  presupuesto_id bigint not null references tesoreria.presupuesto(id) on delete cascade,
  categoria_id  bigint not null references tesoreria.categoria(id),
  item          text,
  monto_anual   numeric(14,0) not null default 0 check (monto_anual >= 0),
  detalle       text,
  unique (presupuesto_id, categoria_id)
);
comment on table tesoreria.presupuesto_linea is 'Una línea por (presupuesto, categoría). Elimina el doble vínculo categoría/línea del legado.';

create table tesoreria.compromiso (
  id             bigint generated always as identity primary key,
  descripcion    text not null,
  monto          numeric(14,0) not null check (monto > 0),
  fecha_estimada date,
  fecha_devengado date,
  fecha_pago     date,
  estado         tesoreria.estado_compromiso not null default 'comprometido',
  acuerdo_id     bigint,
  cuenta_id      bigint references tesoreria.cuenta(id),
  categoria_id   bigint references tesoreria.categoria(id),
  fondo_id       bigint references tesoreria.fondo(id),
  contraparte_id bigint references nucleo.contraparte(id),
  observacion    text,
  creado_por     uuid default auth.uid(),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table tesoreria.compromiso is 'Flujo Comprometido → Devengado → Pagado, origen de los movimientos.';
create index compromiso_estado_idx on tesoreria.compromiso (estado, fecha_estimada);

create table tesoreria.movimiento (
  id             bigint generated always as identity primary key,
  fecha          date not null,
  tipo           tesoreria.tipo_movimiento not null,
  cuenta_id      bigint not null references tesoreria.cuenta(id),
  fondo_id       bigint references tesoreria.fondo(id),
  categoria_id   bigint references tesoreria.categoria(id),
  compromiso_id  bigint references tesoreria.compromiso(id),
  monto          numeric(14,0) not null check (monto > 0),
  glosa          text not null,
  contraparte_id bigint references nucleo.contraparte(id),
  persona_id     uuid references personal.persona(id),
  n_documento    text,
  medio_pago     tesoreria.medio_pago not null default 'transferencia',
  comprobante_archivo_id uuid references documentos.archivo(id) on delete set null,
  tiene_comprobante boolean generated always as (comprobante_archivo_id is not null) stored,
  acuerdo_id     bigint,
  anulado        boolean not null default false,
  motivo_anulacion text,
  anulado_por    uuid,
  anulado_en     timestamptz,
  creado_por     uuid default auth.uid(),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint movimiento_anulacion check (not anulado or length(trim(coalesce(motivo_anulacion, ''))) > 0)
);
comment on table tesoreria.movimiento is 'Movimiento de cartola. No se elimina: se anula con motivo. Bloqueado en períodos cerrados.';
create index movimiento_fecha_idx on tesoreria.movimiento (fecha desc, id desc);
create index movimiento_cuenta_idx on tesoreria.movimiento (cuenta_id, fecha desc);
create index movimiento_categoria_idx on tesoreria.movimiento (categoria_id, fecha);

create trigger movimiento_actualizado before update on tesoreria.movimiento
  for each row execute function nucleo.actualizado_en();
create trigger compromiso_actualizado before update on tesoreria.compromiso
  for each row execute function nucleo.actualizado_en();

create or replace function tesoreria.fn_no_borrar()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Los movimientos no se eliminan: anúlelos indicando el motivo.'
    using errcode = 'insufficient_privilege';
end
$$;

create trigger movimiento_no_borrar before delete on tesoreria.movimiento
  for each row execute function tesoreria.fn_no_borrar();

create or replace function tesoreria.fn_validar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = tesoreria, nucleo, public
as $$
declare
  v_cerrado boolean;
begin
  if tg_op = 'UPDATE' and old.anulado and not new.anulado then
    raise exception 'Un movimiento anulado no puede reactivarse.';
  end if;

  if tg_op = 'INSERT' or (new.fecha is distinct from old.fecha) or (new.cuenta_id is distinct from old.cuenta_id) then
    select exists (
      select 1 from tesoreria.cierre_mensual c
      where c.cuenta_id = new.cuenta_id
        and c.periodo = nucleo.periodo_de(new.fecha)
    ) into v_cerrado;
    if v_cerrado then
      raise exception 'El período % de la cuenta % está cerrado.', nucleo.periodo_de(new.fecha), new.cuenta_id
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return new;
end
$$;

create trigger movimiento_validar before insert or update on tesoreria.movimiento
  for each row execute function tesoreria.fn_validar_movimiento();

create table tesoreria.recurrente (
  id          bigint generated always as identity primary key,
  descripcion text not null,
  tipo        tesoreria.tipo_movimiento not null,
  cuenta_id   bigint references tesoreria.cuenta(id),
  fondo_id    bigint references tesoreria.fondo(id),
  categoria_id bigint references tesoreria.categoria(id),
  contraparte_id bigint references nucleo.contraparte(id),
  monto_estimado numeric(14,0) not null check (monto_estimado > 0),
  frecuencia  tesoreria.frecuencia not null default 'mensual',
  dia_mes     smallint check (dia_mes is null or dia_mes between 1 and 31),
  desde       date not null default current_date,
  hasta       date,
  activo      boolean not null default true,
  constraint recurrente_fechas check (hasta is null or hasta >= desde)
);
comment on table tesoreria.recurrente is 'Gastos e ingresos fijos usados por la proyección de saldo.';

create table tesoreria.escenario (
  id          bigint generated always as identity primary key,
  nombre      text not null unique,
  descripcion text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);
comment on table tesoreria.escenario is 'Escenario de simulación (optimista, base, pesimista).';

create table tesoreria.escenario_ajuste (
  id          bigint generated always as identity primary key,
  escenario_id bigint not null references tesoreria.escenario(id) on delete cascade,
  mes         date not null,
  categoria_id bigint references tesoreria.categoria(id),
  tipo        tesoreria.tipo_movimiento not null,
  monto       numeric(14,0) not null check (monto <> 0),
  descripcion text,
  constraint ajuste_mes check (extract(day from mes) = 1)
);
comment on table tesoreria.escenario_ajuste is 'Ajustes mensuales que simula un escenario.';

create table tesoreria.cuota_valor (
  id          bigint generated always as identity primary key,
  anio        integer not null,
  monto       numeric(10,0) not null check (monto >= 0),
  vigente_desde date not null,
  vigente_hasta date,
  acta_id     bigint,
  unique (anio, vigente_desde)
);
comment on table tesoreria.cuota_valor is 'Valor de la cuota social por año. Se configura desde Tesorería.';

create table tesoreria.cuota_pago (
  id          bigint generated always as identity primary key,
  persona_id  uuid not null references personal.persona(id),
  periodo     date not null,
  monto       numeric(10,0) not null check (monto >= 0),
  movimiento_id bigint unique references tesoreria.movimiento(id),
  exento      boolean not null default false,
  condonada   boolean not null default false,
  observacion text,
  creado_en   timestamptz not null default now(),
  unique (persona_id, periodo),
  constraint cuota_primer_dia check (extract(day from periodo) = 1)
);
comment on table tesoreria.cuota_pago is 'Pago de cuota social de un bombero por mes.';

create table tesoreria.cierre_mensual (
  periodo      date not null,
  cuenta_id    bigint not null references tesoreria.cuenta(id),
  saldo_cartola numeric(14,0),
  saldo_libro   numeric(14,0),
  cheques_no_cobrados numeric(14,0) not null default 0,
  aprobado_acta_id bigint,
  observacion  text,
  cerrado_por  uuid default auth.uid(),
  cerrado_en   timestamptz not null default now(),
  primary key (periodo, cuenta_id),
  constraint cierre_primer_dia check (extract(day from periodo) = 1)
);
comment on table tesoreria.cierre_mensual is 'Concilia cartola bancaria. Bloquea nuevos movimientos del período. Guarda instantánea del saldo libro.';

create table tesoreria.campana (
  id       bigint generated always as identity primary key,
  anio     integer not null unique,
  meta     numeric(14,0),
  valor_talonario numeric(10,0),
  acta_id  bigint,
  creado_en timestamptz not null default now()
);
comment on table tesoreria.campana is 'Campaña económica anual.';

create table tesoreria.talonario (
  id         bigint generated always as identity primary key,
  campana_id bigint not null references tesoreria.campana(id) on delete cascade,
  numero     integer not null,
  folio_desde integer,
  folio_hasta integer,
  persona_id uuid references personal.persona(id),
  fecha_retiro date,
  fecha_devolucion date,
  monto_rendido numeric(12,0),
  movimiento_id bigint references tesoreria.movimiento(id),
  unique (campana_id, numero)
);
comment on table tesoreria.talonario is 'Talonarios entregados a cada bombero en la campaña.';

create table tesoreria.campana_participacion (
  campana_id bigint not null references tesoreria.campana(id) on delete cascade,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  venta_total numeric(12,0) not null default 0,
  aporte_obligatorio numeric(12,0) not null default 0,
  aporte_adicional numeric(12,0) not null default 0,
  saldo_arrastre numeric(12,0) not null default 0,
  observacion text,
  primary key (campana_id, persona_id)
);
comment on table tesoreria.campana_participacion is 'Saldo a favor por bombero para EPP (reemplaza campana_saldo).';

create table tesoreria.beneficio (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  descripcion text,
  monto     numeric(12,0),
  activo    boolean not null default true
);
comment on table tesoreria.beneficio is 'Beneficios otorgados por la compañía (P22).';

create table tesoreria.donacion (
  id          bigint generated always as identity primary key,
  contraparte_id bigint references nucleo.contraparte(id),
  fecha       date not null,
  monto       numeric(14,0),
  especie     text,
  descripcion text,
  movimiento_id bigint references tesoreria.movimiento(id),
  archivo_id  uuid references documentos.archivo(id) on delete set null,
  creado_en   timestamptz not null default now()
);
comment on table tesoreria.donacion is 'Registro de donaciones y su respaldo (P22).';

-- ---------------------------------------------------------------------
-- FKs desde material (creado antes)
-- ---------------------------------------------------------------------
alter table material.item
  add constraint item_campana_fk foreign key (campana_id) references tesoreria.campana(id) on delete set null;
alter table material.item
  add constraint item_movimiento_fk foreign key (movimiento_id) references tesoreria.movimiento(id) on delete set null;
alter table material.asignacion
  add constraint asignacion_campana_fk foreign key (campana_id) references tesoreria.campana(id) on delete set null;
alter table material.mantencion
  add constraint mantencion_movimiento_fk foreign key (movimiento_id) references tesoreria.movimiento(id) on delete set null;

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------
create view tesoreria.v_cartola
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
  sum(case when m.anulado then 0 when m.tipo = 'ingreso' then m.monto else -m.monto end)
    over (partition by m.cuenta_id order by m.fecha, m.id
          rows between unbounded preceding and current row) as saldo
from tesoreria.movimiento m;
comment on view tesoreria.v_cartola is 'Cartola con saldo corriente por cuenta.';

create view tesoreria.v_presupuesto_ejecucion
with (security_invoker = on)
as
select
  p.anio,
  p.version,
  c.id as categoria_id,
  c.codigo as categoria_codigo,
  c.nombre as categoria,
  c.tipo,
  l.id as linea_id,
  l.item,
  l.monto_anual,
  coalesce(sum(m.monto), 0) as ejecutado,
  case when l.monto_anual = 0 then null
       else round(100.0 * coalesce(sum(m.monto), 0) / l.monto_anual, 1)
  end as pct
from tesoreria.presupuesto p
join tesoreria.presupuesto_linea l on l.presupuesto_id = p.id
join tesoreria.categoria c on c.id = l.categoria_id
left join tesoreria.movimiento m
  on m.categoria_id = c.id
 and extract(year from m.fecha) = p.anio
 and not m.anulado
where p.vigente
group by p.anio, p.version, c.id, c.codigo, c.nombre, c.tipo, l.id, l.item, l.monto_anual;
comment on view tesoreria.v_presupuesto_ejecucion is 'Ejecución por categoría y año; corrige el desfase del legado.';

create view tesoreria.v_compromisos_pendientes
with (security_invoker = on)
as
select
  c.id,
  c.descripcion,
  c.monto,
  c.fecha_estimada,
  c.estado,
  coalesce(sum(m.monto) filter (where not m.anulado), 0) as pagado,
  c.monto - coalesce(sum(m.monto) filter (where not m.anulado), 0) as pendiente
from tesoreria.compromiso c
left join tesoreria.movimiento m on m.compromiso_id = c.id
where c.estado <> 'anulado'
group by c.id;
comment on view tesoreria.v_compromisos_pendientes is 'Monto comprometido menos lo pagado.';

create view tesoreria.v_cuotas_pendientes
with (security_invoker = on)
as
select p.id as persona_id, p.registro,
       p.nombres || ' ' || p.apellido_paterno as nombre,
       gs.periodo::date as periodo
from personal.persona p
cross join generate_series(date_trunc('year', current_date), date_trunc('month', current_date), interval '1 month') gs(periodo)
left join tesoreria.cuota_pago c
  on c.persona_id = p.id and c.periodo = gs.periodo::date
where p.estado = 'activo' and p.rango <> 'honorario' and c.persona_id is null;

create view tesoreria.v_saldo_campana
with (security_invoker = on)
as
select cp.persona_id, ca.anio,
       cp.venta_total, cp.aporte_adicional, cp.saldo_arrastre,
       cp.aporte_adicional + cp.saldo_arrastre
         - coalesce((select sum(i.valor) from material.item i
                     join material.asignacion s on s.item_id = i.id
                     where s.persona_id = cp.persona_id and s.origen = 'campana'), 0) as saldo_disponible
from tesoreria.campana_participacion cp
join tesoreria.campana ca on ca.id = cp.campana_id;

-- ---------------------------------------------------------------------
-- Proyección de saldo
-- ---------------------------------------------------------------------
create or replace function tesoreria.fn_proyeccion(
  p_meses integer default 12,
  p_escenario_id bigint default null
)
returns table (
  mes date,
  saldo_inicial numeric,
  ingresos numeric,
  egresos numeric,
  compromisos numeric,
  saldo_proyectado numeric
)
language plpgsql
stable
security definer
set search_path = tesoreria, seguridad, public
as $$
declare
  v_saldo numeric;
begin
  if not seguridad.es_oficial() then
    raise exception 'Sin permiso para ver proyecciones.' using errcode = 'insufficient_privilege';
  end if;
  if p_meses is null or p_meses < 1 or p_meses > 60 then
    raise exception 'p_meses debe estar entre 1 y 60.';
  end if;

  select coalesce(sum(case when tipo = 'ingreso' then monto else -monto end), 0)
    into v_saldo
  from tesoreria.movimiento where not anulado;

  return query
  with meses as (
    select (date_trunc('month', current_date) + (n || ' months')::interval)::date as mes
    from generate_series(0, p_meses - 1) n
  ),
  base as (
    select
      m.mes,
      coalesce((
        select sum(r.monto_estimado) from tesoreria.recurrente r
        where r.activo and r.tipo = 'ingreso'
          and m.mes >= date_trunc('month', r.desde)::date
          and (r.hasta is null or m.mes <= r.hasta)
          and ((extract(year from m.mes)::int * 12 + extract(month from m.mes)::int)
             - (extract(year from r.desde)::int * 12 + extract(month from r.desde)::int))
              % (case r.frecuencia when 'mensual' then 1 when 'bimestral' then 2 when 'trimestral' then 3
                                  when 'semestral' then 6 when 'anual' then 12 else 9999 end) = 0
      ), 0)
      + coalesce((
        select sum(a.monto) from tesoreria.escenario_ajuste a
        where p_escenario_id is not null and a.escenario_id = p_escenario_id
          and a.tipo = 'ingreso' and a.mes = m.mes
      ), 0) as ingresos,
      coalesce((
        select sum(r.monto_estimado) from tesoreria.recurrente r
        where r.activo and r.tipo = 'egreso'
          and m.mes >= date_trunc('month', r.desde)::date
          and (r.hasta is null or m.mes <= r.hasta)
          and ((extract(year from m.mes)::int * 12 + extract(month from m.mes)::int)
             - (extract(year from r.desde)::int * 12 + extract(month from r.desde)::int))
              % (case r.frecuencia when 'mensual' then 1 when 'bimestral' then 2 when 'trimestral' then 3
                                  when 'semestral' then 6 when 'anual' then 12 else 9999 end) = 0
      ), 0)
      + coalesce((
        select sum(a.monto) from tesoreria.escenario_ajuste a
        where p_escenario_id is not null and a.escenario_id = p_escenario_id
          and a.tipo = 'egreso' and a.mes = m.mes
      ), 0) as egresos,
      coalesce((
        select sum(v.pendiente) from tesoreria.v_compromisos_pendientes v
        where v.estado in ('comprometido', 'devengado')
          and date_trunc('month', coalesce(v.fecha_estimada, current_date))::date = m.mes
      ), 0) as compromisos
    from meses m
  ),
  acumulado as (
    select b.*,
           sum(b.ingresos - b.egresos - b.compromisos) over (order by b.mes) as delta
    from base b
  )
  select a.mes,
         v_saldo + a.delta - (a.ingresos - a.egresos - a.compromisos) as saldo_inicial,
         a.ingresos, a.egresos, a.compromisos,
         v_saldo + a.delta as saldo_proyectado
  from acumulado a
  order by a.mes;
end
$$;
comment on function tesoreria.fn_proyeccion(integer, bigint) is 'Saldo actual + recurrentes + compromisos ± ajustes del escenario, mes a mes.';

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table tesoreria.cuenta        enable row level security;
alter table tesoreria.fondo         enable row level security;
alter table tesoreria.categoria     enable row level security;
alter table tesoreria.presupuesto   enable row level security;
alter table tesoreria.presupuesto_linea enable row level security;
alter table tesoreria.compromiso    enable row level security;
alter table tesoreria.movimiento    enable row level security;
alter table tesoreria.recurrente    enable row level security;
alter table tesoreria.escenario     enable row level security;
alter table tesoreria.escenario_ajuste enable row level security;
alter table tesoreria.cuota_valor   enable row level security;
alter table tesoreria.cuota_pago    enable row level security;
alter table tesoreria.cierre_mensual enable row level security;
alter table tesoreria.campana       enable row level security;
alter table tesoreria.talonario     enable row level security;
alter table tesoreria.campana_participacion enable row level security;
alter table tesoreria.beneficio     enable row level security;
alter table tesoreria.donacion      enable row level security;

create policy cuenta_lectura on tesoreria.cuenta for select using (seguridad.es_oficial());
create policy cuenta_escritura on tesoreria.cuenta for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy fondo_lectura on tesoreria.fondo for select using (seguridad.es_oficial());
create policy fondo_escritura on tesoreria.fondo for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy categoria_lectura on tesoreria.categoria for select using (seguridad.es_oficial());
create policy categoria_escritura on tesoreria.categoria for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy presupuesto_lectura on tesoreria.presupuesto for select using (seguridad.es_oficial());
create policy presupuesto_escritura on tesoreria.presupuesto for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy linea_lectura on tesoreria.presupuesto_linea for select using (seguridad.es_oficial());
create policy linea_escritura on tesoreria.presupuesto_linea for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy compromiso_lectura on tesoreria.compromiso for select using (seguridad.es_oficial());
create policy compromiso_escritura on tesoreria.compromiso for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy movimiento_lectura on tesoreria.movimiento for select using (seguridad.es_oficial());
create policy movimiento_insercion on tesoreria.movimiento for insert
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));
create policy movimiento_actualizacion on tesoreria.movimiento for update
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy recurrente_lectura on tesoreria.recurrente for select using (seguridad.es_oficial());
create policy recurrente_escritura on tesoreria.recurrente for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy escenario_lectura on tesoreria.escenario for select using (seguridad.es_oficial());
create policy escenario_escritura on tesoreria.escenario for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy ajuste_lectura on tesoreria.escenario_ajuste for select using (seguridad.es_oficial());
create policy ajuste_escritura on tesoreria.escenario_ajuste for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy cuota_valor_lectura on tesoreria.cuota_valor for select using (auth.uid() is not null);
create policy cuota_valor_escritura on tesoreria.cuota_valor for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy cuota_propia on tesoreria.cuota_pago for select
  using (persona_id = seguridad.mi_persona());
create policy cuota_oficialidad on tesoreria.cuota_pago for select using (seguridad.es_oficial());
create policy cuota_escritura on tesoreria.cuota_pago for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy cierre_lectura on tesoreria.cierre_mensual for select using (seguridad.es_oficial());
create policy cierre_escritura on tesoreria.cierre_mensual for all
  using (seguridad.tiene_rol('tesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'director', 'admin'));

create policy campana_lectura on tesoreria.campana for select using (seguridad.es_oficial());
create policy campana_escritura on tesoreria.campana for all
  using (seguridad.tiene_rol('tesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'director', 'admin'));

create policy talonario_lectura on tesoreria.talonario for select using (seguridad.es_oficial());
create policy talonario_escritura on tesoreria.talonario for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy participacion_propia on tesoreria.campana_participacion for select
  using (persona_id = seguridad.mi_persona());
create policy participacion_oficialidad on tesoreria.campana_participacion for select
  using (seguridad.es_oficial());
create policy participacion_escritura on tesoreria.campana_participacion for all
  using (seguridad.tiene_rol('tesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'director', 'admin'));

create policy beneficio_lectura on tesoreria.beneficio for select using (seguridad.es_oficial());
create policy beneficio_escritura on tesoreria.beneficio for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

create policy donacion_lectura on tesoreria.donacion for select using (seguridad.es_oficial());
create policy donacion_escritura on tesoreria.donacion for all
  using (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('tesorero', 'protesorero', 'director', 'admin'));

grant usage on schema tesoreria to authenticated;
grant select, insert, update, delete on all tables in schema tesoreria to authenticated;
grant select on tesoreria.v_cartola, tesoreria.v_presupuesto_ejecucion,
  tesoreria.v_compromisos_pendientes, tesoreria.v_cuotas_pendientes,
  tesoreria.v_saldo_campana to authenticated;
grant usage, select on all sequences in schema tesoreria to authenticated;
grant execute on function tesoreria.fn_proyeccion(integer, bigint) to authenticated;
