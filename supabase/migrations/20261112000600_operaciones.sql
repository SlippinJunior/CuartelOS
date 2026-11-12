-- =====================================================================
-- 20261112000600 · Operaciones: órdenes, guardias y accidentes
-- =====================================================================
set search_path = operaciones, personal, documentos, seguridad, public;

create type operaciones.tipo_guardia as enum ('nocturna', 'diurna', 'cuartel', 'especial');

create table operaciones.orden_capitania (
  id         bigint generated always as identity primary key,
  numero     integer not null,
  anio       integer not null,
  fecha      date not null,
  materia    text,
  texto      text,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  creado_por uuid default auth.uid(),
  creado_en  timestamptz not null default now(),
  unique (numero, anio)
);
comment on table operaciones.orden_capitania is 'Órdenes de capitanía, con su documento adjunto.';

create table operaciones.guardia_turno (
  id         bigint generated always as identity primary key,
  orden_id   bigint references operaciones.orden_capitania(id) on delete set null,
  fecha      date not null,
  tipo       operaciones.tipo_guardia not null default 'nocturna',
  jefe_persona_id uuid references personal.persona(id) on delete set null,
  inicio     timestamptz not null,
  termino    timestamptz,
  observacion text,
  creado_en  timestamptz not null default now(),
  constraint guardia_fechas check (termino is null or termino >= inicio)
);
comment on table operaciones.guardia_turno is 'Turno de guardia con jefe y dotación. Reemplaza la fila por persona del legado.';
create index guardia_turno_fecha_idx on operaciones.guardia_turno (fecha desc);

create table operaciones.guardia_integrante (
  turno_id   bigint not null references operaciones.guardia_turno(id) on delete cascade,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  funcion    text,
  cumplida   boolean not null default true,
  observacion text,
  primary key (turno_id, persona_id)
);
comment on table operaciones.guardia_integrante is 'Dotación de un turno de guardia.';

create table operaciones.accidente_servicio (
  id          bigint generated always as identity primary key,
  persona_id  uuid not null references personal.persona(id),
  fecha       date not null,
  descripcion text not null,
  unidad_id   bigint,
  lesiones    text,
  dias_perdidos integer,
  parte_archivo_id uuid references documentos.archivo(id) on delete set null,
  estado      text not null default 'abierto',
  creado_por  uuid default auth.uid(),
  creado_en   timestamptz not null default now()
);
comment on table operaciones.accidente_servicio is 'Accidentes en acto de servicio (P6) y su seguimiento.';

alter table operaciones.orden_capitania    enable row level security;
alter table operaciones.guardia_turno      enable row level security;
alter table operaciones.guardia_integrante enable row level security;
alter table operaciones.accidente_servicio enable row level security;

create policy orden_lectura on operaciones.orden_capitania for select
  using (auth.uid() is not null);
create policy orden_escritura on operaciones.orden_capitania for all
  using (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'));

create policy turno_propio on operaciones.guardia_turno for select
  using (
    jefe_persona_id = seguridad.mi_persona()
    or exists (select 1 from operaciones.guardia_integrante gi
               where gi.turno_id = id and gi.persona_id = seguridad.mi_persona())
  );
create policy turno_oficialidad on operaciones.guardia_turno for select
  using (seguridad.es_oficial());
create policy turno_escritura on operaciones.guardia_turno for all
  using (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'));

create policy integrante_propio on operaciones.guardia_integrante for select
  using (persona_id = seguridad.mi_persona());
create policy integrante_oficialidad on operaciones.guardia_integrante for select
  using (seguridad.es_oficial());
create policy integrante_escritura on operaciones.guardia_integrante for all
  using (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'director', 'admin'));

create policy accidente_propio on operaciones.accidente_servicio for select
  using (persona_id = seguridad.mi_persona());
create policy accidente_oficialidad on operaciones.accidente_servicio for select
  using (seguridad.es_oficial());
create policy accidente_escritura on operaciones.accidente_servicio for all
  using (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'secretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'ayudante', 'teniente_1', 'secretario', 'director', 'admin'));

grant usage on schema operaciones to authenticated;
grant select, insert, update, delete on all tables in schema operaciones to authenticated;
grant usage, select on all sequences in schema operaciones to authenticated;
