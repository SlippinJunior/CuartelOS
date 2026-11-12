-- =====================================================================
-- 20261112000700 · Material: unidades, ubicaciones 2D, inventario
-- =====================================================================
set search_path = material, personal, documentos, seguridad, public;

create type material.clase_unidad as enum ('convencional', 'rescate', 'forestal', 'hazmat', 'escala', 'otro');
create type material.lado as enum ('izquierda', 'derecha', 'trasera', 'delantera', 'techo', 'superior');
create type material.tipo_ubicacion as enum ('bodega', 'cabina', 'cajonera', 'techo', 'exterior', 'otro');
create type material.estado_item as enum ('bueno', 'regular', 'malo', 'baja', 'sin_revisar');
create type material.origen_bien as enum ('compania', 'campana', 'donacion', 'cuerpo', 'propio', 'municipal', 'fiscal');
create type material.tipo_documento_unidad as enum ('revision_tecnica', 'seguro', 'permiso_circulacion', 'otro');

create table material.tipo_unidad (
  id     bigint generated always as identity primary key,
  codigo text not null unique,
  nombre text not null
);
comment on table material.tipo_unidad is 'Catálogo de tipos de unidad (convencional, rescate, forestal…).';

insert into material.tipo_unidad (codigo, nombre) values
  ('CONV', 'Convencional'),
  ('RESC', 'Rescate'),
  ('FOR',  'Forestal'),
  ('HAZ',  'Materiales peligrosos'),
  ('ESC',  'Escala'),
  ('OTRO', 'Otro');

create table material.unidad (
  id         bigint generated always as identity primary key,
  codigo     text not null unique,
  tipo_unidad_id bigint references material.tipo_unidad(id),
  patente    text,
  marca      text,
  modelo     text,
  anio       integer,
  transmision text,
  n_motor    text,
  n_chasis   text,
  responsable_persona_id uuid references personal.persona(id) on delete set null,
  estado     text not null default 'operativa',
  km_actual  integer,
  creado_en  timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table material.unidad is 'Material mayor de la compañía.';

create table material.unidad_documento (
  id         bigint generated always as identity primary key,
  unidad_id  bigint not null references material.unidad(id) on delete cascade,
  tipo       material.tipo_documento_unidad not null,
  vence      date,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  notas      text,
  unique (unidad_id, tipo)
);
comment on table material.unidad_documento is 'Documentos con vencimiento de cada unidad (revisión técnica, seguro, permiso).';

create table material.unidad_vista (
  id         bigint generated always as identity primary key,
  unidad_id  bigint not null references material.unidad(id) on delete cascade,
  lado       material.lado not null,
  imagen_archivo_id uuid references documentos.archivo(id) on delete set null,
  orden      smallint not null default 0,
  unique (unidad_id, lado)
);
comment on table material.unidad_vista is 'Vista 2D (foto o SVG) de un lado del carro, base del inventario gráfico.';

create table material.ubicacion (
  id         bigint generated always as identity primary key,
  unidad_id  bigint references material.unidad(id) on delete cascade,
  padre_id   bigint references material.ubicacion(id) on delete cascade,
  vista_id   bigint references material.unidad_vista(id) on delete set null,
  tipo       material.tipo_ubicacion not null default 'cajonera',
  codigo     text not null,
  nombre     text not null,
  forma      jsonb,
  orden      smallint not null default 0,
  unique (unidad_id, codigo),
  constraint ubicacion_forma_array check (forma is null or jsonb_typeof(forma) = 'array')
);
comment on table material.ubicacion is 'Lugares físicos donde se guarda material: bodega, cabina, cajoneras y subcajoneras de cada unidad.';
comment on column material.ubicacion.forma is 'Polígono normalizado 0–1 sobre la imagen de la vista, para tocar la zona en el celular.';
comment on column material.ubicacion.unidad_id is 'NULL representa la bodega del cuartel.';
create index ubicacion_unidad_idx on material.ubicacion (unidad_id, padre_id);

create table material.categoria_articulo (
  id     bigint generated always as identity primary key,
  codigo text not null unique,
  nombre text not null,
  padre_id bigint references material.categoria_articulo(id)
);
comment on table material.categoria_articulo is 'Categorías de artículos (EPP, tenida, herramienta, ERA, radio…).';

insert into material.categoria_articulo (codigo, nombre) values
  ('EPP', 'Equipo de protección personal'),
  ('TENIDA', 'Tenida y vestuario'),
  ('HERR', 'Herramientas'),
  ('ERA', 'Equipos de respiración autónoma'),
  ('RADIO', 'Comunicaciones'),
  ('MED', 'Material médico'),
  ('OTRO', 'Otros');

create table material.articulo (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  categoria_id bigint references material.categoria_articulo(id),
  vida_util_meses integer check (vida_util_meses is null or vida_util_meses > 0),
  requiere_serie boolean not null default false,
  unidad_medida text not null default 'unidad',
  unique (nombre)
);
comment on table material.articulo is 'Catálogo de artículos. requiere_serie obliga a cantidad 1 por ítem físico.';

create table material.item (
  id          bigint generated always as identity primary key,
  articulo_id bigint not null references material.articulo(id),
  ubicacion_id bigint references material.ubicacion(id) on delete set null,
  marca       text,
  n_serie     text,
  cantidad    numeric(10,2) not null default 1 check (cantidad > 0),
  estado      material.estado_item not null default 'sin_revisar',
  origen      material.origen_bien not null default 'compania',
  campana_id  bigint,
  fecha_adquisicion date,
  valor       numeric(12,0),
  movimiento_id bigint,
  observacion text,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table material.item is 'Bien físico o lote. La ubicación jerárquica reemplaza el texto "Cajonera 5.1".';
create index item_articulo_idx on material.item (articulo_id);
create index item_ubicacion_idx on material.item (ubicacion_id);

create or replace function material.fn_validar_item()
returns trigger
language plpgsql
security definer
set search_path = material, public
as $$
declare
  v_requiere boolean;
begin
  select requiere_serie into v_requiere from material.articulo where id = new.articulo_id;
  if v_requiere and new.cantidad <> 1 then
    raise exception 'El artículo exige número de serie: la cantidad debe ser 1.' using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger item_validar before insert or update on material.item
  for each row execute function material.fn_validar_item();

create table material.asignacion (
  id          bigint generated always as identity primary key,
  persona_id  uuid not null references personal.persona(id),
  articulo_id bigint not null references material.articulo(id),
  item_id     bigint references material.item(id) on delete set null,
  cantidad    numeric(8,2) not null default 1 check (cantidad > 0),
  talla       text,
  fecha_entrega date,
  fecha_devolucion date,
  origen      material.origen_bien not null default 'compania',
  campana_id  bigint,
  acta_archivo_id uuid references documentos.archivo(id) on delete set null,
  observacion text,
  creado_en   timestamptz not null default now(),
  constraint asignacion_fechas check (fecha_devolucion is null or fecha_entrega is null or fecha_devolucion >= fecha_entrega)
);
comment on table material.asignacion is 'Vestuario y EPP a cargo de un bombero (P8, P9).';

create table material.mantencion (
  id         bigint generated always as identity primary key,
  unidad_id  bigint references material.unidad(id) on delete cascade,
  item_id    bigint references material.item(id) on delete cascade,
  fecha      date not null,
  tipo       text not null,
  detalle    text,
  costo      numeric(12,0),
  proxima    date,
  movimiento_id bigint,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  check (unidad_id is not null or item_id is not null)
);
comment on table material.mantencion is 'Mantenciones preventivas y correctivas de unidades o ítems.';

create table material.revision_inventario (
  id         bigint generated always as identity primary key,
  unidad_id  bigint references material.unidad(id) on delete cascade,
  fecha      date not null,
  responsable_persona_id uuid references personal.persona(id) on delete set null,
  observacion text,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  creado_en  timestamptz not null default now()
);
comment on table material.revision_inventario is 'Cabecera de una revisión de inventario en terreno.';

create table material.revision_detalle (
  id          bigint generated always as identity primary key,
  revision_id bigint not null references material.revision_inventario(id) on delete cascade,
  item_id     bigint not null references material.item(id) on delete cascade,
  estado      material.estado_item not null,
  observacion text,
  unique (revision_id, item_id)
);
comment on table material.revision_detalle is 'Resultado por ítem de una revisión de inventario.';

create table material.bitacora_unidad (
  id         bigint generated always as identity primary key,
  unidad_id  bigint not null references material.unidad(id) on delete cascade,
  fecha      date not null default current_date,
  km         integer,
  horas_bomba numeric(8,1),
  novedades  text,
  responsable_persona_id uuid references personal.persona(id) on delete set null,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  creado_en  timestamptz not null default now()
);
comment on table material.bitacora_unidad is 'Bitácora de kilómetros y horas de bomba (P10).';

-- FK desde operaciones (se creó antes que material)
alter table operaciones.accidente_servicio
  add constraint accidente_unidad_fk foreign key (unidad_id)
  references material.unidad(id) on delete set null;

-- ---------------------------------------------------------------------
-- Vista de inventario
-- ---------------------------------------------------------------------
create view material.v_inventario
with (security_invoker = on)
as
select
  i.id,
  a.nombre as articulo,
  c.nombre as categoria,
  u.codigo as unidad,
  ubi.codigo as ubicacion_codigo,
  ubi.nombre as ubicacion,
  i.marca,
  i.n_serie,
  i.cantidad,
  i.estado,
  i.origen,
  i.valor,
  i.observacion
from material.item i
join material.articulo a on a.id = i.articulo_id
left join material.categoria_articulo c on c.id = a.categoria_id
left join material.ubicacion ubi on ubi.id = i.ubicacion_id
left join material.unidad u on u.id = ubi.unidad_id;

comment on view material.v_inventario is 'Inventario plano con artículo, categoría, unidad y ubicación. Usa RLS del llamador.';

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table material.tipo_unidad           enable row level security;
alter table material.categoria_articulo    enable row level security;
alter table material.articulo              enable row level security;
alter table material.unidad                enable row level security;
alter table material.unidad_documento      enable row level security;
alter table material.unidad_vista          enable row level security;
alter table material.ubicacion             enable row level security;
alter table material.item                  enable row level security;
alter table material.asignacion            enable row level security;
alter table material.mantencion            enable row level security;
alter table material.revision_inventario   enable row level security;
alter table material.revision_detalle      enable row level security;
alter table material.bitacora_unidad       enable row level security;

create policy tipo_unidad_lectura on material.tipo_unidad for select using (auth.uid() is not null);
create policy tipo_unidad_escritura on material.tipo_unidad for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy categoria_lectura on material.categoria_articulo for select using (auth.uid() is not null);
create policy categoria_escritura on material.categoria_articulo for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy articulo_lectura on material.articulo for select using (auth.uid() is not null);
create policy articulo_escritura on material.articulo for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'tesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'tesorero', 'director', 'admin'));

create policy unidad_lectura on material.unidad for select using (seguridad.es_oficial());
create policy unidad_escritura on material.unidad for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy unidad_documento_lectura on material.unidad_documento for select using (seguridad.es_oficial());
create policy unidad_documento_escritura on material.unidad_documento for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy unidad_vista_lectura on material.unidad_vista for select using (seguridad.es_oficial());
create policy unidad_vista_escritura on material.unidad_vista for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy ubicacion_lectura on material.ubicacion for select using (seguridad.es_oficial());
create policy ubicacion_escritura on material.ubicacion for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy item_lectura on material.item for select using (seguridad.es_oficial());
create policy item_escritura on material.item for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy asignacion_propia on material.asignacion for select
  using (persona_id = seguridad.mi_persona());
create policy asignacion_oficialidad on material.asignacion for select using (seguridad.es_oficial());
create policy asignacion_escritura on material.asignacion for all
  using (seguridad.tiene_rol('capitan', 'teniente_2', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_2', 'director', 'admin'));

create policy mantencion_lectura on material.mantencion for select using (seguridad.es_oficial());
create policy mantencion_escritura on material.mantencion for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy revision_lectura on material.revision_inventario for select using (seguridad.es_oficial());
create policy revision_escritura on material.revision_inventario for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy revision_detalle_lectura on material.revision_detalle for select using (seguridad.es_oficial());
create policy revision_detalle_escritura on material.revision_detalle for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

create policy bitacora_lectura on material.bitacora_unidad for select using (seguridad.es_oficial());
create policy bitacora_escritura on material.bitacora_unidad for all
  using (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin'));

grant usage on schema material to authenticated;
grant select, insert, update, delete on all tables in schema material to authenticated;
grant select on material.v_inventario to authenticated;
grant usage, select on all sequences in schema material to authenticated;
