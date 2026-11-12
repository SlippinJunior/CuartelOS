-- =====================================================================
-- Transformación del legado (esquema `legado`) al esquema nuevo.
-- Corrige: series con .0, nombres, cajoneras jerárquicas, guardias por
-- turno, REO/RE, presupuesto por categoría, contrapartes y actas.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------
insert into personal.persona (
  id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno,
  fecha_nacimiento, email, telefono, direccion, fecha_ingreso, rango, estado,
  fecha_estado, observaciones
)
select
  p.id, 1, p.registro, p.rut, p.nombres, p.apellido_paterno, p.apellido_materno,
  p.fecha_nacimiento, p.email, p.telefono, p.direccion, p.fecha_ingreso,
  p.rango::text::personal.rango, p.estado::text::personal.estado_persona,
  p.fecha_estado, p.observaciones
from legado.persona p
on conflict (compania_id, registro) do nothing;

insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo)
select p.id, p.grupo_sanguineo
from legado.persona p
where nullif(trim(p.grupo_sanguineo), '') is not null
  and exists (select 1 from personal.persona x where x.id = p.id)
on conflict (persona_id) do nothing;

-- ---------------------------------------------------------------------
-- Asistencia
-- ---------------------------------------------------------------------
insert into asistencia.tipo_acto (clave, descripcion, obligatorio, cuenta_para_premio)
select t.clave, t.descripcion, t.obligatorio, t.cuenta_para_premio
from legado.tipo_acto t
on conflict (clave) do nothing;

insert into asistencia.lista (
  id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion,
  direccion, estado, origen, ref_externa
)
overriding system value
select
  l.id, 1, extract(year from l.fecha)::int, l.numero, l.fecha, l.clave,
  l.descripcion, l.direccion, 'borrador',
  case when l.origen in ('importacion', 'viper') then l.origen else 'importacion' end,
  l.ref_externa
from legado.lista l
on conflict (compania_id, anio, numero) do nothing;

insert into asistencia.asistencia (lista_id, persona_id, marca, observacion)
select a.lista_id, a.persona_id, a.marca::text::asistencia.marca, a.observacion
from legado.asistencia a
where exists (select 1 from asistencia.lista l where l.id = a.lista_id)
  and exists (select 1 from personal.persona p where p.id = a.persona_id)
on conflict (lista_id, persona_id) do nothing;

-- Las listas históricas quedan cerradas; las de los últimos días, cerradas sin enviar.
update asistencia.lista l
   set estado = (case when l.fecha < current_date - 2 then 'enviada' else 'cerrada' end)::asistencia.estado_lista,
       cerrada_en = (l.fecha + time '22:00')::timestamptz,
       enviada_en = case when l.fecha < current_date - 2 then (l.fecha + time '23:30')::timestamptz end
 where l.estado = 'borrador';

-- ---------------------------------------------------------------------
-- Secretaría: actas y acuerdos (primero, porque cargos y presupuesto los usan)
-- ---------------------------------------------------------------------
insert into secretaria.acta (
  id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok, texto
)
overriding system value
select
  a.id,
  case
    when upper(coalesce(a.tipo, '')) in ('RO', 'REO', 'JO', 'CD', 'ASAMBLEA') then upper(a.tipo)
    when lower(a.tipo) like '%consejo%' then 'CD'
    when lower(a.tipo) like '%extraordinaria%' then 'REO'
    when lower(a.tipo) like '%oficiales%' then 'JO'
    else 'OTRA'
  end,
  coalesce(a.numero, a.id),
  extract(year from a.fecha)::int,
  a.fecha,
  case when exists (select 1 from asistencia.lista l where l.id = a.lista_id) then a.lista_id end,
  a.quorum_ok,
  a.texto
from legado.acta a
on conflict (tipo_sesion_codigo, anio, numero) do nothing;

update secretaria.acta a
   set aprobada_en_acta_id = x.aprobada_en
  from legado.acta x
 where x.id = a.id and x.aprobada_en is not null
   and exists (select 1 from secretaria.acta y where y.id = x.aprobada_en)
   and a.aprobada_en_acta_id is null;

insert into secretaria.acuerdo (
  id, acta_id, numero, texto, votos_favor, votos_contra, abstenciones,
  resultado, monto, responsable_persona_id, plazo, estado, seguimiento
)
overriding system value
select
  ac.id, ac.acta_id, coalesce(ac.numero, 1), ac.texto, ac.votos_favor,
  ac.votos_contra, ac.abstenciones, ac.resultado, ac.monto,
  case when exists (select 1 from personal.persona p where p.id = ac.responsable_id)
       then ac.responsable_id end,
  ac.plazo, ac.estado::text::secretaria.estado_acuerdo, ac.seguimiento
from legado.acuerdo ac
where exists (select 1 from secretaria.acta a where a.id = ac.acta_id)
on conflict (acta_id, numero) do nothing;

-- ---------------------------------------------------------------------
-- Cargos (texto libre → catálogo)
-- ---------------------------------------------------------------------
insert into personal.cargo (codigo, nombre, tipo, es_unico, orden)
select
  'LEG-' || row_number() over (order by s.cargo),
  s.cargo,
  case
    when nucleo.normalizar(s.cargo) like '%consej%' then 'consejo'::personal.tipo_cargo
    when nucleo.normalizar(s.cargo) like '%director%' then 'director'::personal.tipo_cargo
    when nucleo.normalizar(s.cargo) ~ '(comisi|comision)' then 'comision'::personal.tipo_cargo
    else 'oficial'::personal.tipo_cargo
  end,
  false,
  100
from (select distinct cargo from legado.cargo_periodo where nullif(trim(cargo), '') is not null) s
on conflict (codigo) do nothing;

insert into personal.cargo_periodo (persona_id, cargo_id, desde, hasta, acta_id, observacion)
select
  cp.persona_id, c.id, cp.desde, cp.hasta,
  case when exists (select 1 from secretaria.acta a where a.id = cp.acta_id) then cp.acta_id end,
  cp.codigo
from legado.cargo_periodo cp
join personal.cargo c on nucleo.normalizar(c.nombre) = nucleo.normalizar(cp.cargo)
where exists (select 1 from personal.persona p where p.id = cp.persona_id)
  and not exists (
    select 1 from personal.cargo_periodo x
    where x.persona_id = cp.persona_id and x.cargo_id = c.id and x.desde = cp.desde
  );

-- ---------------------------------------------------------------------
-- Formación y premios
-- ---------------------------------------------------------------------
insert into personal.curso (nombre, institucion, nivel, horas)
select distinct
  c.nombre,
  coalesce(nullif(trim(c.institucion), ''), 'Academia Nacional de Bomberos'),
  coalesce(nullif(trim(c.nivel), ''), 'Sin nivel'),
  c.horas
from legado.curso c
on conflict (nombre, institucion, nivel) do nothing;

insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta)
select
  c.persona_id, cat.id, c.fecha_aprobacion, c.vigente_hasta
from legado.curso c
join personal.curso cat
  on cat.nombre = c.nombre
 and cat.institucion = coalesce(nullif(trim(c.institucion), ''), 'Academia Nacional de Bomberos')
 and cat.nivel = coalesce(nullif(trim(c.nivel), ''), 'Sin nivel')
where exists (select 1 from personal.persona p where p.id = c.persona_id)
on conflict (persona_id, curso_id, fecha_aprobacion) do nothing;

insert into personal.premio_tipo (codigo, nombre, requiere_anios)
select 'LEG-' || row_number() over (order by s.tipo), s.tipo, s.tipo = 'Constancia'
from (select distinct tipo from legado.premio where nullif(trim(tipo), '') is not null) s
on conflict (codigo) do nothing;

insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha, acta_id, observacion)
select
  pr.persona_id, pt.id, pr.anios, pr.otorgado_por, pr.fecha,
  case when exists (select 1 from secretaria.acta a where a.id = pr.acta_id) then pr.acta_id end,
  pr.observacion
from legado.premio pr
join personal.premio_tipo pt on nucleo.normalizar(pt.nombre) = nucleo.normalizar(pr.tipo)
where exists (select 1 from personal.persona p where p.id = pr.persona_id)
  and not exists (
    select 1 from personal.persona_premio x
    where x.persona_id = pr.persona_id and x.premio_tipo_id = pt.id
      and x.fecha is not distinct from pr.fecha
  );

-- ---------------------------------------------------------------------
-- Disciplina (sanciones reservadas)
-- ---------------------------------------------------------------------
insert into disciplina.expediente (
  id, numero, anio, persona_id, fecha_apertura, fecha_cierre, estado, causa,
  acta_id, reservado
)
overriding system value
select
  s.id, s.id, extract(year from s.fecha)::int, s.persona_id, s.fecha, s.fecha,
  'resuelto', s.causa,
  case when exists (select 1 from secretaria.acta a where a.id = s.acta_id) then s.acta_id end,
  coalesce(s.reservado, true)
from legado.sancion s
where exists (select 1 from personal.persona p where p.id = s.persona_id)
on conflict (anio, numero) do nothing;

insert into disciplina.sancion (
  expediente_id, persona_id, tipo_medida, descripcion, fecha, desde, hasta,
  ejecutoriada, fecha_ejecutoriada, acta_id
)
select
  e.id, s.persona_id,
  case nucleo.normalizar(s.medida)
    when 'suspension' then 'suspension'
    when 'multa' then 'multa'
    when 'separacion' then 'separacion'
    when 'expulsion' then 'expulsion'
    else 'amonestacion'
  end::disciplina.tipo_medida,
  s.medida, s.fecha, s.desde, s.hasta,
  s.fecha < current_date,
  case when s.fecha < current_date then s.fecha end,
  case when exists (select 1 from secretaria.acta a where a.id = s.acta_id) then s.acta_id end
from legado.sancion s
join disciplina.expediente e on e.id = s.id
where not exists (
  select 1 from disciplina.sancion x
  where x.expediente_id = e.id and x.persona_id = s.persona_id and x.fecha = s.fecha
);

-- ---------------------------------------------------------------------
-- Tesorería · base (cuenta, categorías, presupuesto, campaña)
-- ---------------------------------------------------------------------
insert into tesoreria.cuenta (id, nombre, banco, numero, tipo)
overriding system value
select 1, 'Cuenta principal (importada)', 'Sin dato', null, 'corriente'
on conflict (id) do nothing;

insert into tesoreria.categoria (id, codigo, nombre, tipo)
overriding system value
select c.id, coalesce(nullif(trim(c.codigo), ''), 'CAT-' || c.id), c.nombre,
       c.tipo::text::tesoreria.tipo_movimiento
from legado.categoria c
on conflict (codigo) do nothing;

select setval(pg_get_serial_sequence('tesoreria.categoria', 'id'),
              coalesce((select max(id) from tesoreria.categoria), 1));

insert into tesoreria.presupuesto (id, anio, version, acta_id, vigente)
overriding system value
select
  p.id, p.anio, p.version,
  case when exists (select 1 from secretaria.acta a where a.id = p.acta_id) then p.acta_id end,
  p.vigente
from legado.presupuesto p
on conflict (anio, version) do nothing;

-- Categorías implícitas para líneas sin categoría.
insert into tesoreria.categoria (codigo, nombre, tipo)
select 'IMP-' || pl.id, left(coalesce(pl.item, 'Sin categoría'), 180),
       pl.tipo::text::tesoreria.tipo_movimiento
from legado.presupuesto_linea pl
where pl.categoria_id is null
  and not exists (
    select 1 from tesoreria.categoria c
    where nucleo.normalizar(c.nombre) = nucleo.normalizar(pl.item)
  )
on conflict (codigo) do nothing;

with mapeadas as (
  select
    pl.presupuesto_id,
    coalesce(
      pl.categoria_id,
      (select c.id from tesoreria.categoria c
        where nucleo.normalizar(c.nombre) = nucleo.normalizar(pl.item) limit 1),
      (select c.id from tesoreria.categoria c where c.codigo = 'IMP-' || pl.id limit 1)
    ) as categoria_id,
    pl.item,
    pl.monto_anual
  from legado.presupuesto_linea pl
)
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual)
select presupuesto_id, categoria_id, min(item), sum(monto_anual)
from mapeadas
where categoria_id is not null
group by presupuesto_id, categoria_id
on conflict (presupuesto_id, categoria_id) do update
  set monto_anual = tesoreria.presupuesto_linea.monto_anual + excluded.monto_anual;

insert into tesoreria.campana (id, anio, meta, valor_talonario, acta_id)
overriding system value
select
  c.id, c.anio, c.meta, c.valor_talonario,
  case when exists (select 1 from secretaria.acta a where a.id = c.acta_id) then c.acta_id end
from legado.campana c
on conflict (anio) do nothing;

-- ---------------------------------------------------------------------
-- Material mayor y menor
-- ---------------------------------------------------------------------
insert into material.tipo_unidad (codigo, nombre)
select 'LEG-' || row_number() over (order by s.tipo), s.tipo
from (select distinct tipo from legado.unidad where nullif(trim(tipo), '') is not null) s
on conflict (codigo) do nothing;

insert into material.unidad (
  id, codigo, tipo_unidad_id, patente, marca, modelo, anio, transmision,
  n_motor, n_chasis, responsable_persona_id, estado, km_actual
)
overriding system value
select
  u.id, u.codigo, t.id, u.patente, u.marca, u.modelo, u.anio, u.transmision,
  u.n_motor, u.n_chasis, u.responsable_id, u.estado, u.km_actual
from legado.unidad u
left join material.tipo_unidad t on t.nombre = u.tipo
on conflict (codigo) do nothing;

insert into material.unidad_documento (unidad_id, tipo, vence)
select u.id, 'revision_tecnica', u.revision_tecnica_vence
from legado.unidad u
where u.revision_tecnica_vence is not null
  and exists (select 1 from material.unidad x where x.id = u.id)
on conflict (unidad_id, tipo) do nothing;

insert into material.unidad_documento (unidad_id, tipo, vence)
select u.id, 'seguro', u.seguro_vence
from legado.unidad u
where u.seguro_vence is not null
  and exists (select 1 from material.unidad x where x.id = u.id)
on conflict (unidad_id, tipo) do nothing;

insert into material.categoria_articulo (codigo, nombre)
select 'LEG-CAT-' || row_number() over (order by s.categoria), s.categoria
from (select distinct categoria from legado.articulo where nullif(trim(categoria), '') is not null) s
on conflict (codigo) do nothing;

insert into material.articulo (id, nombre, categoria_id, requiere_serie)
overriding system value
select
  a.id, a.nombre, c.id, false
from legado.articulo a
left join material.categoria_articulo c on c.nombre = a.categoria
on conflict (nombre) do nothing;

-- Ubicaciones jerárquicas a partir de "Cajonera 5.1".
insert into material.ubicacion (unidad_id, tipo, codigo, nombre)
select distinct
  i.unidad_id,
  'cajonera'::material.tipo_ubicacion,
  regexp_replace(nucleo.normalizar(i.ubicacion), '[^a-z0-9.]+', '_', 'g'),
  i.ubicacion
from legado.item_inventario i
where i.unidad_id is not null and nullif(trim(i.ubicacion), '') is not null
  and exists (select 1 from material.unidad u where u.id = i.unidad_id)
on conflict (unidad_id, codigo) do nothing;

-- "Cajonera 5.1" cuelga de "Cajonera 5".
update material.ubicacion c
   set padre_id = (
     select p.id
     from material.ubicacion p
     where p.unidad_id = c.unidad_id
       and c.codigo like p.codigo || '.%'
       and p.codigo <> c.codigo
     order by length(p.codigo) desc
     limit 1
   )
 where c.padre_id is null and c.codigo like '%.%';

insert into material.ubicacion (unidad_id, tipo, codigo, nombre)
select null, 'bodega', 'BOD', 'Bodega del cuartel'
where not exists (
  select 1 from material.ubicacion where unidad_id is null and codigo = 'BOD'
);

insert into material.item (
  id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen,
  campana_id, fecha_adquisicion, valor, observacion
)
overriding system value
select
  i.id,
  i.articulo_id,
  coalesce(
    (select u.id from material.ubicacion u
      where u.unidad_id = i.unidad_id
        and u.codigo = regexp_replace(nucleo.normalizar(i.ubicacion), '[^a-z0-9.]+', '_', 'g')
      limit 1),
    (select u.id from material.ubicacion u where u.unidad_id is null and u.codigo = 'BOD' limit 1)
  ),
  i.marca,
  nullif(replace(i.n_serie, '.0', ''), ''),
  case
    when nullif(replace(i.n_serie, '.0', ''), '') is not null then 1
    when i.cantidad is null or i.cantidad <= 0 then 1
    else i.cantidad
  end,
  i.estado::text::material.estado_item,
  i.origen::text::material.origen_bien,
  case when exists (select 1 from tesoreria.campana c where c.id = i.campana_id) then i.campana_id end,
  i.fecha_adquisicion,
  i.valor,
  i.observacion
from legado.item_inventario i
where exists (select 1 from material.articulo a where a.id = i.articulo_id)
on conflict (id) do nothing;

insert into material.asignacion (
  persona_id, articulo_id, item_id, cantidad, talla, fecha_entrega, fecha_devolucion,
  origen, campana_id, observacion
)
select
  s.persona_id, s.articulo_id, s.item_id, s.cantidad, s.talla, s.fecha_entrega,
  s.fecha_devolucion, s.origen::text::material.origen_bien,
  case when exists (select 1 from tesoreria.campana c where c.id = s.campana_id) then s.campana_id end,
  s.observacion
from legado.asignacion s
where exists (select 1 from personal.persona p where p.id = s.persona_id)
  and exists (select 1 from material.articulo a where a.id = s.articulo_id);

insert into material.mantencion (unidad_id, item_id, fecha, tipo, detalle, costo, proxima)
select
  m.unidad_id, m.item_id, m.fecha, m.tipo, m.detalle, m.costo, m.proxima
from legado.mantencion m
where (m.unidad_id is null or exists (select 1 from material.unidad u where u.id = m.unidad_id))
  and (m.item_id is null or exists (select 1 from material.item i where i.id = m.item_id));

insert into material.revision_inventario (unidad_id, fecha, responsable_persona_id, observacion)
select r.unidad_id, r.fecha, r.responsable_id, r.observacion
from legado.revision_inventario r
where r.unidad_id is not null
  and exists (select 1 from material.unidad u where u.id = r.unidad_id);

-- ---------------------------------------------------------------------
-- Tesorería · movimientos, cuotas, cierres, campaña
-- ---------------------------------------------------------------------
insert into nucleo.contraparte (nombre, tipo)
select distinct on (nucleo.normalizar(trim(m.contraparte)))
  initcap(trim(m.contraparte)), 'proveedor'::nucleo.contraparte_tipo
from legado.movimiento m
where nullif(trim(m.contraparte), '') is not null
  and not exists (
    select 1 from nucleo.contraparte c
    where nucleo.normalizar(c.nombre) = nucleo.normalizar(m.contraparte)
  );

insert into nucleo.contraparte (nombre, tipo)
select distinct on (nucleo.normalizar(trim(c.contraparte)))
  initcap(trim(c.contraparte)), 'institucion'::nucleo.contraparte_tipo
from legado.correspondencia c
where nullif(trim(c.contraparte), '') is not null
  and not exists (
    select 1 from nucleo.contraparte x
    where nucleo.normalizar(x.nombre) = nucleo.normalizar(c.contraparte)
  );

insert into tesoreria.movimiento (
  id, fecha, tipo, cuenta_id, fondo_id, categoria_id, monto, glosa,
  contraparte_id, persona_id, n_documento, medio_pago, acuerdo_id,
  anulado, motivo_anulacion
)
overriding system value
select
  m.id, m.fecha, m.tipo::text::tesoreria.tipo_movimiento, 1,
  (select f.id from tesoreria.fondo f where f.codigo = 'PROPIO'),
  case when exists (select 1 from tesoreria.categoria c where c.id = m.categoria_id)
       then m.categoria_id end,
  m.monto, m.glosa,
  (select c.id from nucleo.contraparte c
    where nucleo.normalizar(c.nombre) = nucleo.normalizar(m.contraparte) limit 1),
  case when exists (select 1 from personal.persona p where p.id = m.persona_id)
       then m.persona_id end,
  m.n_documento,
  case lower(coalesce(m.medio_pago, 'transferencia'))
    when 'efectivo' then 'efectivo'::tesoreria.medio_pago
    when 'cheque' then 'cheque'::tesoreria.medio_pago
    when 'tarjeta' then 'tarjeta'::tesoreria.medio_pago
    else 'transferencia'::tesoreria.medio_pago
  end,
  case when exists (select 1 from secretaria.acuerdo a where a.id = m.acuerdo_id)
       then m.acuerdo_id end,
  m.anulado, m.motivo_anulacion
from legado.movimiento m
on conflict (id) do nothing;

insert into tesoreria.cuota_pago (persona_id, periodo, monto, movimiento_id, exento)
select c.persona_id, c.periodo, c.monto,
       case when exists (select 1 from tesoreria.movimiento m where m.id = c.movimiento_id)
            then c.movimiento_id end,
       c.exento
from legado.cuota c
where exists (select 1 from personal.persona p where p.id = c.persona_id)
on conflict (persona_id, periodo) do nothing;

insert into tesoreria.cierre_mensual (
  periodo, cuenta_id, saldo_cartola, saldo_libro, cheques_no_cobrados,
  aprobado_acta_id, observacion
)
select
  c.periodo, 1, c.saldo_cartola,
  coalesce(c.saldo_anterior, 0) + coalesce(c.ingresos, 0) - coalesce(c.egresos, 0),
  coalesce(c.cheques_no_cobrados, 0),
  case when exists (select 1 from secretaria.acta a where a.id = c.aprobado_acta_id)
       then c.aprobado_acta_id end,
  'Importado del legado'
from legado.cierre_mensual c
on conflict (periodo, cuenta_id) do nothing;

insert into tesoreria.campana_participacion (
  campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional,
  saldo_arrastre, observacion
)
select cs.campana_id, cs.persona_id, cs.venta_total, cs.obligatorio, cs.adicional,
       cs.saldo_arrastre, cs.observacion
from legado.campana_saldo cs
where exists (select 1 from tesoreria.campana c where c.id = cs.campana_id)
  and exists (select 1 from personal.persona p where p.id = cs.persona_id)
on conflict (campana_id, persona_id) do nothing;

insert into tesoreria.talonario (
  campana_id, numero, folio_desde, folio_hasta, persona_id, fecha_retiro,
  fecha_devolucion, monto_rendido, movimiento_id
)
select
  t.campana_id, t.numero, t.folio_desde, t.folio_hasta,
  case when exists (select 1 from personal.persona p where p.id = t.persona_id)
       then t.persona_id end,
  t.fecha_retiro, t.fecha_devolucion, t.monto_rendido,
  case when exists (select 1 from tesoreria.movimiento m where m.id = t.movimiento_id)
       then t.movimiento_id end
from legado.talonario t
where exists (select 1 from tesoreria.campana c where c.id = t.campana_id)
on conflict (campana_id, numero) do nothing;

insert into secretaria.correspondencia (sentido, numero, fecha, contraparte_id, materia, plazo_respuesta)
select
  c.sentido::text::secretaria.sentido_correspondencia, c.numero, c.fecha,
  (select x.id from nucleo.contraparte x
    where nucleo.normalizar(x.nombre) = nucleo.normalizar(c.contraparte) limit 1),
  c.materia, c.plazo_respuesta
from legado.correspondencia c;

-- ---------------------------------------------------------------------
-- Operaciones: órdenes y guardias por turno
-- ---------------------------------------------------------------------
insert into operaciones.orden_capitania (id, numero, anio, fecha, materia, texto)
overriding system value
select o.id, o.numero, o.anio, o.fecha, o.materia, o.texto
from legado.orden_capitania o
on conflict (numero, anio) do nothing;

insert into operaciones.guardia_turno (id, orden_id, fecha, tipo, inicio, termino)
overriding system value
select
  row_number() over (order by g.inicio, g.orden_id),
  g.orden_id, g.inicio::date,
  case when lower(coalesce(g.tipo, 'nocturna')) like '%diurn%'
       then 'diurna'::operaciones.tipo_guardia
       else 'nocturna'::operaciones.tipo_guardia end,
  g.inicio, g.termino
from (select distinct orden_id, inicio, termino, tipo from legado.guardia) g
where g.orden_id is null or exists (select 1 from operaciones.orden_capitania o where o.id = g.orden_id);

insert into operaciones.guardia_integrante (turno_id, persona_id, cumplida)
select
  t.id, g.persona_id, coalesce(g.cumplida, true)
from legado.guardia g
join lateral (
  select t.id from operaciones.guardia_turno t
  where t.orden_id is not distinct from g.orden_id and t.inicio = g.inicio
  order by t.id limit 1
) t on true
where exists (select 1 from personal.persona p where p.id = g.persona_id)
on conflict (turno_id, persona_id) do nothing;

-- ---------------------------------------------------------------------
-- Zona de importación
-- ---------------------------------------------------------------------
insert into nucleo.staging_importacion (origen, archivo, fila, datos, estado, error, cargado_en)
select s.origen, s.archivo, s.fila, s.datos,
       s.estado::text::nucleo.estado_staging, s.error, s.cargado_en
from legado.staging_importacion s;

-- ---------------------------------------------------------------------
-- Secuencias de columnas identity que recibieron IDs explícitos
-- ---------------------------------------------------------------------
select setval(pg_get_serial_sequence('asistencia.lista', 'id'), coalesce((select max(id) from asistencia.lista), 1));
select setval(pg_get_serial_sequence('secretaria.acta', 'id'), coalesce((select max(id) from secretaria.acta), 1));
select setval(pg_get_serial_sequence('secretaria.acuerdo', 'id'), coalesce((select max(id) from secretaria.acuerdo), 1));
select setval(pg_get_serial_sequence('material.unidad', 'id'), coalesce((select max(id) from material.unidad), 1));
select setval(pg_get_serial_sequence('material.articulo', 'id'), coalesce((select max(id) from material.articulo), 1));
select setval(pg_get_serial_sequence('material.item', 'id'), coalesce((select max(id) from material.item), 1));
select setval(pg_get_serial_sequence('tesoreria.categoria', 'id'), coalesce((select max(id) from tesoreria.categoria), 1));
select setval(pg_get_serial_sequence('tesoreria.presupuesto', 'id'), coalesce((select max(id) from tesoreria.presupuesto), 1));
select setval(pg_get_serial_sequence('tesoreria.movimiento', 'id'), coalesce((select max(id) from tesoreria.movimiento), 1));
select setval(pg_get_serial_sequence('tesoreria.campana', 'id'), coalesce((select max(id) from tesoreria.campana), 1));
select setval(pg_get_serial_sequence('operaciones.orden_capitania', 'id'), coalesce((select max(id) from operaciones.orden_capitania), 1));
select setval(pg_get_serial_sequence('operaciones.guardia_turno', 'id'), coalesce((select max(id) from operaciones.guardia_turno), 1));
select setval(pg_get_serial_sequence('disciplina.expediente', 'id'), coalesce((select max(id) from disciplina.expediente), 1));
select setval(pg_get_serial_sequence('nucleo.contraparte', 'id'), coalesce((select max(id) from nucleo.contraparte), 1));

commit;

-- ---------------------------------------------------------------------
-- Informe de conciliación
-- ---------------------------------------------------------------------
\echo 'Tabla                         Origen   Destino'
select 'personas' as tabla, (select count(*) from legado.persona) as origen,
       (select count(*) from personal.persona) as destino
union all select 'listas', (select count(*) from legado.lista), (select count(*) from asistencia.lista)
union all select 'asistencias', (select count(*) from legado.asistencia), (select count(*) from asistencia.asistencia)
union all select 'actas', (select count(*) from legado.acta), (select count(*) from secretaria.acta)
union all select 'acuerdos', (select count(*) from legado.acuerdo), (select count(*) from secretaria.acuerdo)
union all select 'cargos', (select count(*) from legado.cargo_periodo), (select count(*) from personal.cargo_periodo)
union all select 'cursos', (select count(*) from legado.curso), (select count(*) from personal.persona_curso)
union all select 'premios', (select count(*) from legado.premio), (select count(*) from personal.persona_premio)
union all select 'unidades', (select count(*) from legado.unidad), (select count(*) from material.unidad)
union all select 'items', (select count(*) from legado.item_inventario), (select count(*) from material.item)
union all select 'asignaciones', (select count(*) from legado.asignacion), (select count(*) from material.asignacion)
union all select 'movimientos', (select count(*) from legado.movimiento), (select count(*) from tesoreria.movimiento)
union all select 'cuotas', (select count(*) from legado.cuota), (select count(*) from tesoreria.cuota_pago)
union all select 'cierres', (select count(*) from legado.cierre_mensual), (select count(*) from tesoreria.cierre_mensual)
union all select 'guardias', (select count(*) from legado.guardia), (select count(*) from operaciones.guardia_integrante)
union all select 'staging', (select count(*) from legado.staging_importacion), (select count(*) from nucleo.staging_importacion)
order by 1;
