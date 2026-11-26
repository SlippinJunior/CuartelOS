-- =====================================================================
-- 20261126000200 · Tablero de Cuartel, 5 fuentes por dominio,
--                  aislamiento rol cuartel y trazabilidad de despachos
-- =====================================================================
set search_path = nucleo, operaciones, secretaria, documentos, seguridad, personal, public;

-- ---------------------------------------------------------------------
-- 1. Helper de aislamiento para cuentas de pantalla de cuartel
-- ---------------------------------------------------------------------
create or replace function seguridad.es_solo_cuartel()
returns boolean
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select seguridad.tiene_rol('cuartel')
     and not seguridad.es_oficial()
     and not seguridad.tiene_rol('bombero')
     and not seguridad.tiene_rol('consejo')
$$;
comment on function seguridad.es_solo_cuartel() is 'Verdadero si la sesión corresponde únicamente a una cuenta de pantalla de cuartel (sin acceso a datos privados).';
grant execute on function seguridad.es_solo_cuartel() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Actualizar mi_perfil() con es_cuartel y exención de consentimiento
-- ---------------------------------------------------------------------
create or replace function nucleo.mi_perfil()
returns jsonb
language sql
stable
security definer
set search_path = seguridad, personal, nucleo, public
as $$
  select jsonb_build_object(
    'usuario_id', auth.uid(),
    'email', u.email,
    'activo', u.activo,
    'persona', case when p.id is null then null else jsonb_build_object(
      'id', p.id, 'registro', p.registro,
      'nombres', p.nombres, 'apellido_paterno', p.apellido_paterno,
      'apellido_materno', p.apellido_materno,
      'nombre', p.nombres || ' ' || p.apellido_paterno,
      'rango', p.rango, 'estado', p.estado, 'email', p.email,
      'codigo_charlie', p.codigo_charlie,
      'anios_servicio', (select v.anios_servicio from personal.v_antiguedad_persona v where v.persona_id = p.id),
      'categoria_guardia', (select v.categoria_guardia from personal.v_antiguedad_persona v where v.persona_id = p.id),
      'exento_guardia', (select v.exento_efectivo from personal.v_antiguedad_persona v where v.persona_id = p.id)
    ) end,
    'roles', coalesce((
      select jsonb_agg(r.rol::text order by r.rol)
      from seguridad.usuario_rol r
      where r.user_id = u.user_id and r.desde <= current_date
        and (r.hasta is null or r.hasta >= current_date)
    ), '[]'::jsonb),
    'es_oficial', seguridad.es_oficial(),
    'es_admin', seguridad.es_admin(),
    'es_cuartel', seguridad.es_solo_cuartel(),
    'compania', (
      select jsonb_build_object('id', c.id, 'nombre', c.nombre, 'cuerpo', c.cuerpo, 'lema', c.lema)
      from nucleo.compania c order by c.id limit 1
    ),
    'consentimiento', case
      when seguridad.es_solo_cuartel() then jsonb_build_object(
        'version', 0,
        'titulo', 'Cuenta de cuartel',
        'texto', '',
        'aceptado', true,
        'requerido', false
      )
      else (
        select jsonb_build_object(
          'version', t.version,
          'titulo', t.titulo,
          'texto', t.texto,
          'aceptado', exists (
            select 1 from seguridad.consentimiento co
            where co.usuario_id = u.user_id and co.texto_id = t.id
          ),
          'requerido', true
        )
        from seguridad.consentimiento_texto t
        where t.vigente
        limit 1
      )
    end
  )
  from seguridad.usuario u
  left join personal.persona p on p.id = u.persona_id
  where u.user_id = auth.uid()
$$;
comment on function nucleo.mi_perfil() is 'Perfil de la sesión: persona, roles, compañía, modo cuartel y estado del consentimiento.';

-- ---------------------------------------------------------------------
-- 3. Tablas de publicaciones por dominio (5 fuentes del Tablero)
-- ---------------------------------------------------------------------

-- 3.1 Órdenes del día (operaciones)
create table if not exists operaciones.orden_dia (
  id               bigint generated always as identity primary key,
  numero           integer not null,
  anio             integer not null default extract(year from current_date)::int,
  fecha            date not null default current_date,
  vigente_hasta    date,
  titulo           text not null,
  texto            text not null,
  archivo_id       uuid references documentos.archivo(id) on delete set null,
  despacho_resumen text,
  creado_por       uuid default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (anio, numero)
);
comment on table operaciones.orden_dia is 'Órdenes del día de la compañía para consulta rápida en el cuartel.';
create index if not exists orden_dia_fecha_idx on operaciones.orden_dia (fecha desc, numero desc);

drop trigger if exists orden_dia_actualizado on operaciones.orden_dia;
create trigger orden_dia_actualizado before update on operaciones.orden_dia
  for each row execute function nucleo.actualizado_en();

drop trigger if exists aud_orden_dia on operaciones.orden_dia;
create trigger aud_orden_dia after insert or update or delete on operaciones.orden_dia
  for each row execute function seguridad.fn_auditar();

-- 3.2 Extender órdenes de capitanía con trazabilidad WhatsApp/despacho
alter table operaciones.orden_capitania
  add column if not exists whatsapp_estado text,
  add column if not exists despacho_resumen text;

-- 3.3 Circulares (secretaría: origen CBL o Compañía)
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'secretaria' and t.typname = 'origen_circular'
  ) then
    create type secretaria.origen_circular as enum ('cbl', 'compania');
  end if;
end $$;

create table if not exists secretaria.circular (
  id               bigint generated always as identity primary key,
  origen           secretaria.origen_circular not null,
  numero           text not null,
  anio             integer not null default extract(year from current_date)::int,
  fecha            date not null default current_date,
  titulo           text not null,
  resumen          text,
  texto            text,
  archivo_id       uuid references documentos.archivo(id) on delete set null,
  despacho_resumen text,
  creado_por       uuid default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (origen, anio, numero)
);
comment on table secretaria.circular is 'Circulares del Cuerpo de Bomberos de Limache (cbl) y de la Segunda Compañía (compania).';
create index if not exists circular_fecha_idx on secretaria.circular (fecha desc, origen);

drop trigger if exists circular_actualizado on secretaria.circular;
create trigger circular_actualizado before update on secretaria.circular
  for each row execute function nucleo.actualizado_en();

drop trigger if exists aud_circular on secretaria.circular;
create trigger aud_circular after insert or update or delete on secretaria.circular
  for each row execute function seguridad.fn_auditar();

-- 3.4 Citaciones (secretaría / capitanía)
create table if not exists secretaria.citacion (
  id               bigint generated always as identity primary key,
  numero           integer not null,
  anio             integer not null default extract(year from current_date)::int,
  fecha_emision    date not null default current_date,
  fecha_evento     date not null,
  hora_evento      time not null,
  lugar            text not null,
  tenida           text,
  obligatoria      boolean not null default true,
  tipo_acto_clave  text references asistencia.tipo_acto(clave) on delete set null,
  titulo           text not null,
  detalle          text,
  archivo_id       uuid references documentos.archivo(id) on delete set null,
  despacho_resumen text,
  creado_por       uuid default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (anio, numero)
);
comment on table secretaria.citacion is 'Citaciones oficiales de compañía con fecha, hora, lugar, tenida y obligatoriedad.';
create index if not exists citacion_evento_idx on secretaria.citacion (fecha_evento desc, hora_evento desc);

drop trigger if exists citacion_actualizado on secretaria.citacion;
create trigger citacion_actualizado before update on secretaria.citacion
  for each row execute function nucleo.actualizado_en();

drop trigger if exists aud_citacion on secretaria.citacion;
create trigger aud_citacion after insert or update or delete on secretaria.citacion
  for each row execute function seguridad.fn_auditar();

-- ---------------------------------------------------------------------
-- 4. RLS de las nuevas tablas del Tablero
-- ---------------------------------------------------------------------
alter table operaciones.orden_dia  enable row level security;
alter table secretaria.circular    enable row level security;
alter table secretaria.citacion    enable row level security;

create policy orden_dia_lectura on operaciones.orden_dia
  for select using (auth.uid() is not null);
create policy orden_dia_escritura on operaciones.orden_dia
  for all
  using (seguridad.tiene_rol('capitan', 'teniente_1', 'ayudante', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_1', 'ayudante', 'director', 'admin'));

create policy circular_lectura on secretaria.circular
  for select using (auth.uid() is not null);
create policy circular_escritura on secretaria.circular
  for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy citacion_lectura on secretaria.citacion
  for select using (auth.uid() is not null);
create policy citacion_escritura on secretaria.citacion
  for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'ayudante', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'ayudante', 'director', 'admin'));

-- ---------------------------------------------------------------------
-- 5. Tipos de documento y acceso seguro a PDFs del Tablero
-- ---------------------------------------------------------------------
insert into documentos.tipo_documento (codigo, nombre, descripcion, modulo, requiere_firma) values
  ('ORDEN_DIA',    'Orden del día',        'Orden del día vigente para el cuartel.',                 'operaciones', true),
  ('CIRCULAR_CBL', 'Circular CBL',         'Circular emitida por el Cuerpo de Bomberos de Limache.', 'secretaria',  false),
  ('CIRCULAR_CIA', 'Circular de compañía', 'Circular interna de la Segunda Compañía.',               'secretaria',  true),
  ('CITACION',     'Citación',             'Citación oficial a acto, academia o reunión.',           'secretaria',  true)
on conflict (codigo) do update
  set nombre = excluded.nombre,
      descripcion = excluded.descripcion,
      modulo = excluded.modulo,
      requiere_firma = excluded.requiere_firma;

create policy documento_tablero_lectura on documentos.documento_emitido
  for select using (
    tipo_documento_codigo in ('ORDEN_DIA', 'CIRCULAR_CBL', 'CIRCULAR_CIA', 'CITACION')
  );

create policy archivo_tablero_visible on documentos.archivo
  for select using (
    exists (select 1 from operaciones.orden_dia od where od.archivo_id = documentos.archivo.id)
    or exists (select 1 from operaciones.orden_capitania oc where oc.archivo_id = documentos.archivo.id)
    or exists (select 1 from secretaria.circular c where c.archivo_id = documentos.archivo.id)
    or exists (select 1 from secretaria.citacion ci where ci.archivo_id = documentos.archivo.id)
  );

-- ---------------------------------------------------------------------
-- 6. Aislamiento estricto del rol cuartel en tablas existentes
-- ---------------------------------------------------------------------
drop policy if exists ciclo_lectura on operaciones.guardia_ciclo;
create policy ciclo_lectura on operaciones.guardia_ciclo
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists turno_compania on operaciones.guardia_turno;
create policy turno_compania on operaciones.guardia_turno
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists integrante_compania on operaciones.guardia_integrante;
create policy integrante_compania on operaciones.guardia_integrante
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists panol_lectura on material.panol_stock;
create policy panol_lectura on material.panol_stock
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists parametro_lectura on nucleo.parametro;
create policy parametro_lectura on nucleo.parametro
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists archivo_escritura on documentos.archivo;
create policy archivo_escritura on documentos.archivo
  for all
  using (auth.uid() is not null and not seguridad.es_solo_cuartel())
  with check (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists eleccion_lectura on secretaria.eleccion;
create policy eleccion_lectura on secretaria.eleccion
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists candidatura_lectura on secretaria.candidatura;
create policy candidatura_lectura on secretaria.candidatura
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

drop policy if exists acta_aprobada_lectura on secretaria.acta;
create policy acta_aprobada_lectura on secretaria.acta
  for select using ((aprobada_en_acta_id is not null and not seguridad.es_solo_cuartel()) or seguridad.es_oficial());

drop policy if exists acuerdo_lectura on secretaria.acuerdo;
create policy acuerdo_lectura on secretaria.acuerdo
  for select using (seguridad.es_oficial() or seguridad.tiene_rol('bombero'));

drop policy if exists lista_lectura on asistencia.lista;
create policy lista_lectura on asistencia.lista
  for select using (auth.uid() is not null and not seguridad.es_solo_cuartel());

-- Bloquear RPCs de guardia/personas para cuentas solo-cuartel
create or replace function operaciones.catalogo_guardia_personas()
returns table (
  id uuid,
  registro integer,
  nombre text,
  codigo_charlie text,
  anios_servicio integer,
  categoria_guardia text,
  exento boolean
)
language sql
stable
security definer
set search_path = operaciones, personal, seguridad, public
as $$
  select p.id, p.registro,
         p.nombres || ' ' || p.apellido_paterno,
         p.codigo_charlie,
         v.anios_servicio,
         v.categoria_guardia,
         v.exento_efectivo
  from personal.persona p
  join personal.v_antiguedad_persona v on v.persona_id = p.id
  where p.estado = 'activo'
    and auth.uid() is not null
    and not seguridad.es_solo_cuartel()
  order by p.registro
$$;

create or replace function operaciones.grilla_ciclo(p_ciclo_id bigint default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = operaciones, personal, nucleo, seguridad, public
as $$
declare
  v_ciclo operaciones.guardia_ciclo;
  v_resultado jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' and (auth.uid() is null or seguridad.es_solo_cuartel()) then
    raise exception 'Sesión no autorizada.' using errcode = 'insufficient_privilege';
  end if;

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
    return null;
  end if;

  select jsonb_build_object(
    'ciclo', jsonb_build_object(
      'id', v_ciclo.id,
      'nombre', v_ciclo.nombre,
      'fecha_inicio', v_ciclo.fecha_inicio,
      'fecha_fin', v_ciclo.fecha_fin,
      'cupo_base', v_ciclo.cupo_base,
      'estado', v_ciclo.estado,
      'notificado_s1_en', v_ciclo.notificado_s1_en,
      'notificado_s2_en', v_ciclo.notificado_s2_en
    ),
    'semana_1_cubierta', operaciones.semana_cubierta(v_ciclo.id, 1, v_ciclo.cupo_base::integer),
    'semana_2_cubierta', operaciones.semana_cubierta(v_ciclo.id, 2, v_ciclo.cupo_base::integer),
    'dias', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'turno_id', t.id,
          'fecha', t.fecha,
          'semana_num', t.semana_num,
          'estado', t.estado,
          'inicio', t.inicio,
          'termino', t.termino,
          'feriado', (select f.nombre from nucleo.feriado f where f.fecha = t.fecha),
          'hora_aviso_central', t.hora_aviso_central,
          'charlie_modalidad', t.charlie_modalidad,
          'charlie_codigo', t.charlie_codigo,
          'observacion', t.observacion,
          'jefe_persona_id', t.jefe_persona_id,
          'firmado_en', t.firmado_en,
          'guardianes', (
            select count(*)::int from operaciones.guardia_integrante gi
            where gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
          ),
          'integrantes', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'persona_id', gi.persona_id,
                'registro', p.registro,
                'nombre', p.nombres || ' ' || p.apellido_paterno,
                'codigo_charlie', p.codigo_charlie,
                'origen', gi.origen,
                'estado', gi.estado,
                'hora_llegada', gi.hora_llegada,
                'reemplaza_a_persona_id', gi.reemplaza_a_persona_id,
                'reemplazo_nota', gi.reemplazo_nota,
                'es_jefe', gi.persona_id = t.jefe_persona_id
              )
              order by p.registro
            )
            from operaciones.guardia_integrante gi
            join personal.persona p on p.id = gi.persona_id
            where gi.turno_id = t.id
          ), '[]'::jsonb)
        )
        order by t.fecha
      )
      from operaciones.guardia_turno t
      where t.ciclo_id = v_ciclo.id
    ), '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end
$$;

-- ---------------------------------------------------------------------
-- 7. Trazabilidad de despachos (Portal + Correo + Meta WhatsApp)
-- ---------------------------------------------------------------------
create table if not exists nucleo.despacho (
  id                 bigint generated always as identity primary key,
  origen_tipo        text not null check (origen_tipo in (
                       'orden_dia', 'orden_capitania', 'circular_cbl',
                       'circular_compania', 'citacion', 'guardia'
                     )),
  origen_id          bigint not null,
  titulo             text not null,
  resumen            text,
  url_portal         text,
  correo_enviados    integer not null default 0,
  correo_total       integer not null default 0,
  correo_error       text,
  whatsapp_enviados  integer not null default 0,
  whatsapp_total     integer not null default 0,
  whatsapp_error     text,
  whatsapp_plantilla text,
  creado_por         uuid default auth.uid(),
  creado_en          timestamptz not null default now()
);
comment on table nucleo.despacho is 'Resumen de cada despacho simultáneo (Portal + Correo + Meta WhatsApp Cloud API).';
create index if not exists despacho_origen_idx on nucleo.despacho (origen_tipo, origen_id, creado_en desc);

create table if not exists nucleo.despacho_detalle (
  id           bigint generated always as identity primary key,
  despacho_id  bigint not null references nucleo.despacho(id) on delete cascade,
  persona_id   uuid references personal.persona(id) on delete set null,
  nombre       text,
  canal        text not null check (canal in ('correo', 'whatsapp')),
  destino      text,
  estado       text not null check (estado in ('enviado', 'fallido', 'omitido', 'no_configurado')),
  proveedor_id text,
  error        text,
  intentado_en timestamptz not null default now()
);
comment on table nucleo.despacho_detalle is 'Resultado individual por destinatario y canal; permite reintentar fallidos.';
create index if not exists despacho_detalle_idx on nucleo.despacho_detalle (despacho_id, canal, estado);

alter table nucleo.despacho         enable row level security;
alter table nucleo.despacho_detalle enable row level security;

create policy despacho_lectura on nucleo.despacho
  for select using (seguridad.es_oficial());
create policy despacho_detalle_lectura on nucleo.despacho_detalle
  for select using (seguridad.es_oficial());

-- ---------------------------------------------------------------------
-- 8. Vista y RPC unificadas del Tablero de Cuartel
-- ---------------------------------------------------------------------
create or replace view nucleo.v_tablero_cuartel
with (security_invoker = on)
as
  select
    'orden_dia'::text as tipo,
    od.id,
    od.numero::text as numero,
    od.anio,
    od.fecha,
    null::date as fecha_evento,
    null::time as hora_evento,
    od.vigente_hasta,
    od.titulo,
    left(od.texto, 220) as resumen,
    od.texto,
    null::text as lugar,
    null::text as tenida,
    null::boolean as obligatoria,
    od.archivo_id,
    od.despacho_resumen,
    od.creado_en
  from operaciones.orden_dia od

  union all

  select
    'orden_capitania'::text as tipo,
    oc.id,
    oc.numero::text as numero,
    oc.anio,
    oc.fecha,
    null::date as fecha_evento,
    null::time as hora_evento,
    null::date as vigente_hasta,
    coalesce(oc.materia, 'Orden de capitanía') as titulo,
    left(coalesce(oc.texto, ''), 220) as resumen,
    coalesce(oc.texto, '') as texto,
    null::text as lugar,
    null::text as tenida,
    null::boolean as obligatoria,
    oc.archivo_id,
    coalesce(oc.despacho_resumen, oc.correo_estado) as despacho_resumen,
    oc.creado_en
  from operaciones.orden_capitania oc

  union all

  select
    case when c.origen = 'cbl' then 'circular_cbl' else 'circular_compania' end as tipo,
    c.id,
    c.numero,
    c.anio,
    c.fecha,
    null::date as fecha_evento,
    null::time as hora_evento,
    null::date as vigente_hasta,
    c.titulo,
    coalesce(c.resumen, left(coalesce(c.texto, ''), 220)) as resumen,
    coalesce(c.texto, c.resumen, '') as texto,
    null::text as lugar,
    null::text as tenida,
    null::boolean as obligatoria,
    c.archivo_id,
    c.despacho_resumen,
    c.creado_en
  from secretaria.circular c

  union all

  select
    'citacion'::text as tipo,
    ci.id,
    ci.numero::text as numero,
    ci.anio,
    ci.fecha_emision as fecha,
    ci.fecha_evento,
    ci.hora_evento,
    ci.fecha_evento as vigente_hasta,
    ci.titulo,
    left(coalesce(ci.detalle, ci.lugar), 220) as resumen,
    coalesce(ci.detalle, '') as texto,
    ci.lugar,
    ci.tenida,
    ci.obligatoria,
    ci.archivo_id,
    ci.despacho_resumen,
    ci.creado_en
  from secretaria.citacion ci;

comment on view nucleo.v_tablero_cuartel is 'Unión normalizada de las 5 fuentes del Tablero de Cuartel.';

create or replace function nucleo.tablero_cuartel(p_limite integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = nucleo, operaciones, secretaria, documentos, personal, public
as $$
declare
  v_hoy date := (now() at time zone 'America/Santiago')::date;
begin
  if auth.uid() is null then
    raise exception 'Sesión no autenticada.' using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'hoy', v_hoy,
    'actualizado_en', now(),
    'feriado_hoy', (select f.nombre from nucleo.feriado f where f.fecha = v_hoy),
    'publicaciones', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select
          v.*,
          (select a.bucket from documentos.archivo a where a.id = v.archivo_id) as archivo_bucket,
          (select a.path from documentos.archivo a where a.id = v.archivo_id) as archivo_path,
          (select a.nombre from documentos.archivo a where a.id = v.archivo_id) as archivo_nombre,
          (select d.token_verificacion from documentos.documento_emitido d
           where d.pdf_archivo_id = v.archivo_id and not d.anulado
           order by d.emitido_en desc limit 1) as token_verificacion
        from nucleo.v_tablero_cuartel v
        order by
          case when v.tipo = 'orden_dia' and (v.vigente_hasta is null or v.vigente_hasta >= v_hoy) and v.fecha <= v_hoy then 0
               when v.tipo = 'citacion' and v.fecha_evento >= v_hoy then 1
               else 2 end,
          coalesce(v.fecha_evento, v.fecha) desc,
          v.creado_en desc
        limit greatest(coalesce(p_limite, 50), 1)
      ) t
    ), '[]'::jsonb),
    'guardia_hoy', (
      select jsonb_build_object(
        'fecha', gt.fecha,
        'estado', gt.estado,
        'hora_aviso_central', gt.hora_aviso_central,
        'charlie_modalidad', gt.charlie_modalidad,
        'dotacion', coalesce((
          select jsonb_agg(jsonb_build_object(
            'registro', p.registro,
            'nombre', p.nombres || ' ' || p.apellido_paterno,
            'es_jefe', gi.persona_id = gt.jefe_persona_id
          ) order by p.registro)
          from operaciones.guardia_integrante gi
          join personal.persona p on p.id = gi.persona_id
          where gi.turno_id = gt.id and gi.estado in ('inscrito', 'cumplida')
        ), '[]'::jsonb)
      )
      from operaciones.guardia_turno gt
      where gt.fecha = v_hoy and gt.tipo = 'nocturna'
      order by gt.id desc
      limit 1
    )
  );
end
$$;
comment on function nucleo.tablero_cuartel(integer) is 'Datos del Tablero de Cuartel (5 fuentes + guardia de hoy en versión mínima).';

-- ---------------------------------------------------------------------
-- 9. Actualizar panel_inicio() para no exponer tareas/alertas al rol cuartel
-- ---------------------------------------------------------------------
create or replace function nucleo.panel_inicio()
returns jsonb
language plpgsql
stable
security definer
set search_path = nucleo, seguridad, asistencia, tesoreria, personal, operaciones, material, public
as $$
begin
  if seguridad.es_solo_cuartel() then
    return jsonb_build_object(
      'es_cuartel', true,
      'es_oficial', false,
      'alertas', '[]'::jsonb,
      'tareas', '[]'::jsonb,
      'compromisos_pendientes', 0,
      'solicitudes_material_pendientes', 0,
      'notificaciones_material', '[]'::jsonb,
      'notificaciones_guardia', '[]'::jsonb,
      'reportes_por_firmar', '[]'::jsonb,
      'roles', jsonb_build_array('cuartel')
    );
  end if;

  return (
    select jsonb_build_object(
      'es_cuartel', false,
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
            'titulo', format('Solicitud de %s: %s × %s', p.nombres, a.nombre, trim_scale(s.cantidad)),
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
  );
end
$$;

-- ---------------------------------------------------------------------
-- 10. Privilegios completos (auditoría service_role + authenticated)
-- ---------------------------------------------------------------------
grant select, insert, update, delete on operaciones.orden_dia, secretaria.circular, secretaria.citacion to authenticated;
grant select on nucleo.despacho, nucleo.despacho_detalle, nucleo.v_tablero_cuartel to authenticated;
grant usage, select on sequence operaciones.orden_dia_id_seq, secretaria.circular_id_seq, secretaria.citacion_id_seq to authenticated;
grant execute on function nucleo.tablero_cuartel(integer) to authenticated;

grant select, insert, update, delete on all tables in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

grant usage, select on all sequences in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

grant execute on all functions in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;
