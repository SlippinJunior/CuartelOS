-- =====================================================================
-- 20261121000100 · Inventario del Teniente 2° y solicitudes de material
-- =====================================================================
-- El Teniente 2° administra su propio pañol. Los bomberos lo consultan y
-- piden artículos; Capitanía y el resto de la oficialidad lo leen. La
-- asignación y las notificaciones quedan a nombre del Teniente 2° de turno.
--
-- Reglas:
--   * Cualquier usuario autenticado lee el stock disponible.
--   * Solo el Teniente 2° (y admin) modifica el pañol o resuelve solicitudes.
--   * Un bombero solo ve sus propias solicitudes y notificaciones.
--   * Al entregar se descuenta stock y se crea la asignación de EPP.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roles: quién ejerce el Teniente 2° hoy
-- ---------------------------------------------------------------------
create or replace function seguridad.persona_con_rol(p_rol seguridad.rol)
returns uuid
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select u.persona_id
  from seguridad.usuario u
  join seguridad.usuario_rol r on r.user_id = u.user_id
  where u.activo
    and u.persona_id is not null
    and r.rol = p_rol
    and r.desde <= current_date
    and (r.hasta is null or r.hasta >= current_date)
  order by r.desde desc, u.user_id
  limit 1
$$;
comment on function seguridad.persona_con_rol(seguridad.rol) is
  'Persona activa que ejerce un rol a la fecha. Se usa para direccionar avisos (p. ej. Teniente 2°).';

grant execute on function seguridad.persona_con_rol(seguridad.rol) to authenticated;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type material.estado_solicitud as enum
  ('pendiente', 'aprobada', 'entregada', 'rechazada', 'cancelada');

create type material.tipo_notificacion_material as enum
  ('solicitud_nueva', 'solicitud_resuelta', 'stock_bajo');

-- ---------------------------------------------------------------------
-- Pañol del Teniente 2°
-- ---------------------------------------------------------------------
create table material.panol_stock (
  id              bigint generated always as identity primary key,
  articulo_id     bigint not null references material.articulo(id),
  talla           text,
  cantidad        numeric(10,2) not null default 0 check (cantidad >= 0),
  minimo          numeric(10,2) not null default 0 check (minimo >= 0),
  ubicacion       text not null default 'Pañol Teniente 2°',
  estado          material.estado_item not null default 'bueno',
  observacion     text,
  actualizado_por uuid references auth.users(id) default auth.uid(),
  actualizado_en  timestamptz not null default now(),
  unique nulls not distinct (articulo_id, talla)
);
comment on table material.panol_stock is
  'Existencias del pañol administrado por el Teniente 2°. Es la fuente de los artículos que los bomberos pueden solicitar.';
comment on column material.panol_stock.minimo is
  'Cantidad mínima deseada. Si el stock queda en o bajo este valor se avisa al Teniente 2°.';
comment on column material.panol_stock.talla is
  'Talla o variante del artículo. NULL cuando el artículo no tiene talla.';

create trigger panol_actualizado before update on material.panol_stock
  for each row execute function nucleo.actualizado_en();

create trigger aud_panol_stock
  after insert or update or delete on material.panol_stock
  for each row execute function seguridad.fn_auditar();

-- ---------------------------------------------------------------------
-- Solicitudes de los bomberos
-- ---------------------------------------------------------------------
create table material.solicitud (
  id                      bigint generated always as identity primary key,
  persona_id              uuid not null references personal.persona(id),
  stock_id                bigint references material.panol_stock(id) on delete set null,
  articulo_id             bigint not null references material.articulo(id),
  talla                   text,
  cantidad                numeric(8,2) not null default 1 check (cantidad > 0),
  motivo                  text,
  estado                  material.estado_solicitud not null default 'pendiente',
  destinatario_persona_id uuid references personal.persona(id),
  resuelto_por            uuid references auth.users(id),
  resuelto_en             timestamptz,
  respuesta               text,
  asignacion_id           bigint references material.asignacion(id) on delete set null,
  creado_en               timestamptz not null default now(),
  actualizado_en          timestamptz not null default now()
);
comment on table material.solicitud is
  'Pedido de un bombero al pañol del Teniente 2°. La entrega descuenta stock y crea una asignación.';
comment on column material.solicitud.destinatario_persona_id is
  'Teniente 2° a cargo cuando se creó la solicitud. Direcciona la notificación.';

create index solicitud_estado_idx on material.solicitud (estado, creado_en desc);
create index solicitud_persona_idx on material.solicitud (persona_id, creado_en desc);

create trigger solicitud_actualizado before update on material.solicitud
  for each row execute function nucleo.actualizado_en();

create trigger aud_solicitud
  after insert or update or delete on material.solicitud
  for each row execute function seguridad.fn_auditar();

-- Prepara la solicitud: estado inicial, destinatario y datos del artículo.
create or replace function material.fn_solicitud_preparar()
returns trigger
language plpgsql
security definer
set search_path = material, seguridad, public
as $$
declare
  v_stock material.panol_stock;
begin
  new.estado := 'pendiente';
  new.resuelto_por := null;
  new.resuelto_en := null;
  new.asignacion_id := null;

  if new.stock_id is not null then
    select * into v_stock from material.panol_stock where id = new.stock_id;
    if not found then
      raise exception 'El artículo del pañol no existe.' using errcode = 'no_data_found';
    end if;
    new.articulo_id := v_stock.articulo_id;
    new.talla := coalesce(new.talla, v_stock.talla);
    if new.cantidad > v_stock.cantidad then
      raise exception 'Solo quedan % unidades de ese artículo en el pañol.', v_stock.cantidad
        using errcode = 'check_violation';
    end if;
  end if;

  if new.destinatario_persona_id is null then
    new.destinatario_persona_id := seguridad.persona_con_rol('teniente_2');
  end if;

  return new;
end
$$;
comment on function material.fn_solicitud_preparar() is
  'Fuerza el estado pendiente, completa artículo/talla desde el stock y direcciona al Teniente 2° de turno.';

create trigger solicitud_preparar before insert on material.solicitud
  for each row execute function material.fn_solicitud_preparar();

-- ---------------------------------------------------------------------
-- Notificaciones (siempre al Teniente 2° o al solicitante)
-- ---------------------------------------------------------------------
create table material.notificacion (
  id                      bigint generated always as identity primary key,
  destinatario_persona_id uuid not null references personal.persona(id) on delete cascade,
  tipo                    material.tipo_notificacion_material not null,
  solicitud_id            bigint references material.solicitud(id) on delete cascade,
  titulo                  text not null,
  detalle                 text,
  leida_en                timestamptz,
  creado_en               timestamptz not null default now()
);
comment on table material.notificacion is
  'Avisos del pañol. Las solicitudes nuevas se notifican al Teniente 2°; las respuestas, al solicitante.';

create index notificacion_destino_idx
  on material.notificacion (destinatario_persona_id, leida_en, creado_en desc);

create trigger aud_notificacion_material
  after insert or update or delete on material.notificacion
  for each row execute function seguridad.fn_auditar();

create or replace function material.fn_solicitud_notificar()
returns trigger
language plpgsql
security definer
set search_path = material, seguridad, personal, public
as $$
declare
  v_articulo text;
  v_persona text;
  v_detalle text;
begin
  select a.nombre into v_articulo from material.articulo a where a.id = new.articulo_id;

  if tg_op = 'INSERT' then
    if new.destinatario_persona_id is null or new.destinatario_persona_id = new.persona_id then
      return new;
    end if;
    select trim(p.nombres || ' ' || p.apellido_paterno) into v_persona
      from personal.persona p where p.id = new.persona_id;
    insert into material.notificacion
      (destinatario_persona_id, tipo, solicitud_id, titulo, detalle)
    values (
      new.destinatario_persona_id, 'solicitud_nueva', new.id,
      'Nueva solicitud de material',
      format('%s solicita %s × %s%s.', v_persona, v_articulo, trim_scale(new.cantidad),
             case when new.talla is not null then ' (talla ' || new.talla || ')' else '' end)
    );
    return new;
  end if;

  if new.estado is not distinct from old.estado then
    return new;
  end if;

  if new.estado = 'cancelada' then
    if new.destinatario_persona_id is not null and new.destinatario_persona_id <> new.persona_id then
      select trim(p.nombres || ' ' || p.apellido_paterno) into v_persona
        from personal.persona p where p.id = new.persona_id;
      insert into material.notificacion
        (destinatario_persona_id, tipo, solicitud_id, titulo, detalle)
      values (
        new.destinatario_persona_id, 'solicitud_resuelta', new.id,
        'Solicitud cancelada',
        format('%s canceló el pedido de %s × %s.', v_persona, v_articulo, trim_scale(new.cantidad))
      );
    end if;
    return new;
  end if;

  if new.estado in ('aprobada', 'entregada', 'rechazada') then
    v_detalle := case new.estado
      when 'aprobada' then format('Tu solicitud de %s × %s fue aprobada.', v_articulo, trim_scale(new.cantidad))
      when 'entregada' then format('Retira %s × %s en el pañol del Teniente 2°.', v_articulo, trim_scale(new.cantidad))
      else format('Tu solicitud de %s × %s fue rechazada.', v_articulo, trim_scale(new.cantidad))
    end;
    if new.respuesta is not null and length(trim(new.respuesta)) > 0 then
      v_detalle := v_detalle || ' ' || trim(new.respuesta);
    end if;

    insert into material.notificacion
      (destinatario_persona_id, tipo, solicitud_id, titulo, detalle)
    values (
      new.persona_id, 'solicitud_resuelta', new.id,
      'Solicitud de material ' || new.estado::text, v_detalle
    );
  end if;

  return new;
end
$$;
comment on function material.fn_solicitud_notificar() is
  'Genera el aviso al Teniente 2° al crear la solicitud y al solicitante al resolverla.';

create trigger solicitud_notificar
  after insert or update on material.solicitud
  for each row execute function material.fn_solicitud_notificar();

-- ---------------------------------------------------------------------
-- RPC: resolver una solicitud (solo Teniente 2°)
-- ---------------------------------------------------------------------
create or replace function material.resolver_solicitud(
  p_solicitud_id bigint,
  p_decision material.estado_solicitud,
  p_respuesta text default null
)
returns jsonb
language plpgsql
security definer
set search_path = material, seguridad, personal, public
as $$
declare
  v_sol      material.solicitud;
  v_stock    material.panol_stock;
  v_asig     bigint;
  v_articulo text;
  v_destino  uuid;
begin
  if not seguridad.tiene_rol('teniente_2') then
    raise exception 'Solo el Teniente 2° puede resolver solicitudes de material.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_decision not in ('aprobada', 'entregada', 'rechazada') then
    raise exception 'Decisión inválida: usa aprobada, entregada o rechazada.'
      using errcode = 'check_violation';
  end if;

  select * into v_sol from material.solicitud where id = p_solicitud_id for update;
  if not found then
    raise exception 'La solicitud no existe.' using errcode = 'no_data_found';
  end if;
  if v_sol.estado in ('entregada', 'rechazada', 'cancelada') then
    raise exception 'La solicitud ya está %.', v_sol.estado using errcode = 'check_violation';
  end if;

  if p_decision = 'entregada' then
    if v_sol.stock_id is null then
      raise exception 'La solicitud no tiene un artículo del pañol asociado.' using errcode = 'check_violation';
    end if;

    select * into v_stock from material.panol_stock where id = v_sol.stock_id for update;
    if not found then
      raise exception 'El artículo del pañol ya no existe.' using errcode = 'no_data_found';
    end if;
    if v_stock.cantidad < v_sol.cantidad then
      raise exception 'Stock insuficiente: quedan % y se piden %.', v_stock.cantidad, v_sol.cantidad
        using errcode = 'check_violation';
    end if;

    update material.panol_stock
       set cantidad = cantidad - v_sol.cantidad,
           actualizado_por = auth.uid()
     where id = v_stock.id;

    insert into material.asignacion
      (persona_id, articulo_id, cantidad, talla, fecha_entrega, observacion)
    values
      (v_sol.persona_id, v_sol.articulo_id, v_sol.cantidad, v_sol.talla, current_date,
       coalesce(nullif(trim(p_respuesta), ''), 'Entrega por solicitud de pañol'))
    returning id into v_asig;

    -- Aviso de reposición si el stock quedó en o bajo el mínimo.
    if (v_stock.cantidad - v_sol.cantidad) <= v_stock.minimo then
      select a.nombre into v_articulo from material.articulo a where a.id = v_sol.articulo_id;
      v_destino := coalesce(v_sol.destinatario_persona_id, seguridad.persona_con_rol('teniente_2'));
      if v_destino is not null then
        insert into material.notificacion
          (destinatario_persona_id, tipo, solicitud_id, titulo, detalle)
        values (
          v_destino, 'stock_bajo', v_sol.id,
          'Stock bajo: ' || v_articulo,
          format('Quedan %s unidades (mínimo %s). Repón el pañol.', trim_scale(v_stock.cantidad - v_sol.cantidad), trim_scale(v_stock.minimo))
        );
      end if;
    end if;
  end if;

  update material.solicitud
     set estado = p_decision,
         resuelto_por = auth.uid(),
         resuelto_en = now(),
         respuesta = nullif(trim(p_respuesta), ''),
         asignacion_id = coalesce(v_asig, asignacion_id)
   where id = p_solicitud_id
   returning * into v_sol;

  return jsonb_build_object(
    'id', v_sol.id,
    'estado', v_sol.estado,
    'asignacion_id', v_sol.asignacion_id
  );
end
$$;
comment on function material.resolver_solicitud(bigint, material.estado_solicitud, text) is
  'Aprueba, entrega o rechaza una solicitud. Al entregar descuenta stock y crea la asignación. Solo Teniente 2°.';

-- ---------------------------------------------------------------------
-- RPC: cancelar una solicitud propia
-- ---------------------------------------------------------------------
create or replace function material.cancelar_solicitud(p_solicitud_id bigint)
returns void
language plpgsql
security definer
set search_path = material, seguridad, public
as $$
declare
  v_sol material.solicitud;
begin
  select * into v_sol from material.solicitud where id = p_solicitud_id for update;
  if not found then
    raise exception 'La solicitud no existe.' using errcode = 'no_data_found';
  end if;
  if v_sol.persona_id <> seguridad.mi_persona() then
    raise exception 'Solo puedes cancelar tus propias solicitudes.' using errcode = 'insufficient_privilege';
  end if;
  if v_sol.estado <> 'pendiente' then
    raise exception 'Solo se cancela una solicitud pendiente.' using errcode = 'check_violation';
  end if;

  update material.solicitud
     set estado = 'cancelada', resuelto_en = now()
   where id = p_solicitud_id;
end
$$;
comment on function material.cancelar_solicitud(bigint) is
  'El solicitante cancela su pedido mientras siga pendiente.';

-- ---------------------------------------------------------------------
-- Vistas de lectura
-- ---------------------------------------------------------------------
create view material.v_panol
with (security_invoker = on)
as
select
  s.id,
  s.articulo_id,
  a.nombre as articulo,
  c.nombre as categoria,
  s.talla,
  s.cantidad,
  s.minimo,
  s.ubicacion,
  s.estado,
  s.observacion,
  (s.cantidad <= s.minimo) as stock_bajo,
  s.actualizado_en
from material.panol_stock s
join material.articulo a on a.id = s.articulo_id
left join material.categoria_articulo c on c.id = a.categoria_id;
comment on view material.v_panol is
  'Stock del pañol del Teniente 2° con artículo, categoría y marca de reposición. Usa RLS del llamador.';

create view material.v_solicitudes
with (security_invoker = on)
as
select
  s.id,
  s.persona_id,
  trim(p.nombres || ' ' || p.apellido_paterno || coalesce(' ' || p.apellido_materno, '')) as solicitante,
  p.registro,
  p.rango,
  s.stock_id,
  s.articulo_id,
  a.nombre as articulo,
  s.talla,
  s.cantidad,
  s.motivo,
  s.estado,
  s.destinatario_persona_id,
  s.respuesta,
  s.asignacion_id,
  s.creado_en,
  s.resuelto_en
from material.solicitud s
join personal.persona p on p.id = s.persona_id
join material.articulo a on a.id = s.articulo_id;
comment on view material.v_solicitudes is
  'Solicitudes con nombre del solicitante y del artículo. Un bombero ve solo las suyas.';

create view material.v_asignaciones_persona
with (security_invoker = on)
as
select
  s.id,
  s.persona_id,
  p.registro,
  trim(p.nombres || ' ' || p.apellido_paterno || coalesce(' ' || p.apellido_materno, '')) as persona,
  p.rango,
  s.articulo_id,
  a.nombre as articulo,
  s.cantidad,
  s.talla,
  s.fecha_entrega,
  s.fecha_devolucion,
  s.origen,
  s.observacion
from material.asignacion s
join personal.persona p on p.id = s.persona_id
join material.articulo a on a.id = s.articulo_id;
comment on view material.v_asignaciones_persona is
  'EPP y vestuario a cargo de cada bombero. La oficialidad ve todo; cada bombero ve lo propio.';

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table material.panol_stock    enable row level security;
alter table material.solicitud      enable row level security;
alter table material.notificacion   enable row level security;

-- Todos leen el pañol; solo el Teniente 2° lo modifica.
create policy panol_lectura on material.panol_stock
  for select using (auth.uid() is not null);
create policy panol_gestion on material.panol_stock
  for all using (seguridad.tiene_rol('teniente_2'))
  with check (seguridad.tiene_rol('teniente_2'));

-- Cada bombero ve sus solicitudes; la oficialidad ve todas.
create policy solicitud_propia on material.solicitud
  for select using (persona_id = seguridad.mi_persona());
create policy solicitud_oficialidad on material.solicitud
  for select using (seguridad.es_oficial());
create policy solicitud_crear on material.solicitud
  for insert with check (persona_id = seguridad.mi_persona() and estado = 'pendiente');
create policy solicitud_gestion on material.solicitud
  for update using (seguridad.tiene_rol('teniente_2'))
  with check (seguridad.tiene_rol('teniente_2'));

-- Cada persona ve y marca sus avisos.
create policy notificacion_propia on material.notificacion
  for select using (destinatario_persona_id = seguridad.mi_persona());
create policy notificacion_leer on material.notificacion
  for update using (destinatario_persona_id = seguridad.mi_persona())
  with check (destinatario_persona_id = seguridad.mi_persona());

-- ---------------------------------------------------------------------
-- Privilegios
-- ---------------------------------------------------------------------
grant select, insert, update, delete on material.panol_stock, material.solicitud to authenticated;
grant select, update on material.notificacion to authenticated;
grant select on material.v_panol, material.v_solicitudes, material.v_asignaciones_persona to authenticated;
grant usage, select on all sequences in schema material to authenticated;

grant execute on function material.resolver_solicitud(bigint, material.estado_solicitud, text) to authenticated;
grant execute on function material.cancelar_solicitud(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Panel de inicio: tareas y avisos del pañol
-- ---------------------------------------------------------------------
create or replace function nucleo.panel_inicio()
returns jsonb
language sql
stable
security definer
set search_path = nucleo, seguridad, asistencia, tesoreria, personal, operaciones, material, public
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
    'tareas', (
      select coalesce(jsonb_agg(t.x order by t.orden, t.vence), '[]'::jsonb)
      from (
        (select 1 as orden, (l.fecha + interval '48 hours') as vence, jsonb_build_object(
          'tipo', 'lista', 'id', l.id,
          'titulo', format('Lista %s-%s del %s (%s)', l.anio, l.numero, l.fecha, l.estado),
          'vence', (l.fecha + interval '48 hours'),
          'ruta', '/asistencia/' || l.id) as x
         from asistencia.lista l
         where seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
           and ((l.estado = 'borrador' and l.fecha < current_date)
                or l.estado = 'cerrada')
         order by l.fecha
         limit 10)
        union all
        (select 0 as orden, (s.creado_en + interval '1 day') as vence, jsonb_build_object(
          'tipo', 'material', 'id', s.id,
          'titulo', format('Solicitud de %s: %s × %s', p.nombres, a.nombre, s.cantidad),
          'vence', (s.creado_en + interval '1 day'),
          'ruta', '/material') as x
         from material.solicitud s
         join personal.persona p on p.id = s.persona_id
         join material.articulo a on a.id = s.articulo_id
         where seguridad.tiene_rol('teniente_2') and s.estado = 'pendiente'
         order by s.creado_en
         limit 10)
      ) t
    ),
    'compromisos_pendientes', case when seguridad.es_oficial() then (
      select count(*) from tesoreria.compromiso c where c.estado in ('comprometido', 'devengado')
    ) else 0 end,
    'solicitudes_material_pendientes', case when seguridad.tiene_rol('teniente_2') then (
      select count(*) from material.solicitud s where s.estado = 'pendiente'
    ) else 0 end,
    'notificaciones_material', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'tipo', n.tipo, 'titulo', n.titulo,
        'detalle', n.detalle, 'creado_en', n.creado_en) order by n.creado_en desc)
      from material.notificacion n
      where n.destinatario_persona_id = seguridad.mi_persona()
        and n.leida_en is null
      limit 5
    ), '[]'::jsonb),
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

grant execute on function nucleo.panel_inicio() to authenticated;
