-- =====================================================================
-- 20261112000200 · Núcleo: compañía, parámetros, feriados, contrapartes
-- =====================================================================
set search_path = nucleo, seguridad, public;

create type nucleo.contraparte_tipo as enum ('proveedor', 'institucion', 'donante', 'organismo', 'persona', 'otro');
create type nucleo.estado_alerta as enum ('abierta', 'en_revision', 'resuelta', 'descartada');
create type nucleo.estado_staging as enum ('pendiente', 'valida', 'error', 'importada');

create table nucleo.compania (
  id          smallint primary key default 1,
  nombre      text not null,
  cuerpo      text not null,
  lema        text,
  rut         text,
  direccion   text,
  telefono    text,
  email       text,
  sitio_web   text,
  logo_archivo_id uuid,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint compania_unica check (id = 1)
);
comment on table nucleo.compania is 'Fila única de configuración de la compañía. Una instancia = una compañía.';
comment on column nucleo.compania.logo_archivo_id is 'Escudo institucional usado en PDF (FK a documentos.archivo, migración de documentos).';

insert into nucleo.compania (id, nombre, cuerpo, lema)
values (1, 'Segunda Compañía', 'Cuerpo de Bomberos de Limache', 'Atención · Sacrificio · Lealtad');

create trigger compania_actualizado before update on nucleo.compania
  for each row execute function nucleo.actualizado_en();

create table nucleo.parametro (
  clave        text primary key,
  valor        jsonb not null,
  descripcion  text,
  grupo        text not null default 'general',
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid
);
comment on table nucleo.parametro is 'Parámetros configurables desde Administración (reglamento, plazos, valores).';

insert into nucleo.parametro (clave, valor, descripcion, grupo) values
  ('antiguedad_minima_cargo_anios', '2'::jsonb, 'Antigüedad mínima para asumir un cargo de oficial (R10).', 'reglamento'),
  ('premio_honorario_anios', '35'::jsonb, 'Años de servicio para Miembro Honorario (art. 49).', 'reglamento'),
  ('plazo_cerrar_lista_horas', '48'::jsonb, 'Horas para cerrar y enviar una lista de asistencia (art. 188).', 'asistencia'),
  ('aviso_documento_dias', '30'::jsonb, 'Días de anticipación para alertar documentos por vencer.', 'material'),
  ('cuota_moneda', '"CLP"'::jsonb, 'Moneda de las cuotas sociales.', 'tesoreria'),
  ('consentimiento_version_actual', '1'::jsonb, 'Versión vigente del consentimiento de datos personales.', 'seguridad');

create trigger parametro_actualizado before update on nucleo.parametro
  for each row execute function nucleo.actualizado_en();

create table nucleo.feriado (
  fecha date primary key,
  nombre text not null,
  irrenunciable boolean not null default false
);
comment on table nucleo.feriado is 'Feriados legales de Chile, usados para calcular plazos.';
comment on column nucleo.feriado.irrenunciable is 'Feriado irrenunciable (comercio), útil para planificación de guardias.';

create table nucleo.contraparte (
  id        bigint generated always as identity primary key,
  tipo      nucleo.contraparte_tipo not null default 'otro',
  nombre    text not null,
  rut       text,
  email     text,
  telefono  text,
  direccion text,
  notas     text,
  activo    boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table nucleo.contraparte is 'Proveedores, instituciones, donantes y organismos compartidos por tesorería y secretaría.';
create unique index contraparte_nombre_uk on nucleo.contraparte (nucleo.normalizar(nombre));
create trigger contraparte_actualizado before update on nucleo.contraparte
  for each row execute function nucleo.actualizado_en();

create table nucleo.regla_alerta (
  codigo      text primary key,
  nombre      text not null,
  descripcion text,
  severidad   smallint not null default 2 check (severidad between 1 and 3),
  activa      boolean not null default true
);
comment on table nucleo.regla_alerta is 'Catálogo de reglas R01–R12 que generan alertas automáticas.';

create table nucleo.alerta (
  id          bigint generated always as identity primary key,
  regla       text not null references nucleo.regla_alerta(codigo),
  entidad     text not null,
  entidad_id  text not null,
  detalle     text not null,
  severidad   smallint not null default 2 check (severidad between 1 and 3),
  estado      nucleo.estado_alerta not null default 'abierta',
  responsable_persona_id uuid,
  evidencia   text,
  detectada_en timestamptz not null default now(),
  resuelta_en timestamptz,
  unique (regla, entidad, entidad_id)
);
comment on table nucleo.alerta is 'Alertas generadas por los cruces nocturnos. Se actualizan sin duplicar.';
create index alerta_estado_idx on nucleo.alerta (estado, severidad, detectada_en desc);

create table nucleo.staging_importacion (
  id        bigint generated always as identity primary key,
  origen    text not null,
  archivo   text,
  fila      integer,
  datos     jsonb not null,
  estado    nucleo.estado_staging not null default 'pendiente',
  error     text,
  cargado_en timestamptz not null default now()
);
comment on table nucleo.staging_importacion is 'Zona de carga para VIPER, Excel o datos dudosos del legado. Nada entra al modelo sin revisión.';
create index staging_estado_idx on nucleo.staging_importacion (origen, estado);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table nucleo.compania            enable row level security;
alter table nucleo.parametro           enable row level security;
alter table nucleo.feriado             enable row level security;
alter table nucleo.contraparte         enable row level security;
alter table nucleo.regla_alerta        enable row level security;
alter table nucleo.alerta              enable row level security;
alter table nucleo.staging_importacion enable row level security;

create policy compania_lectura on nucleo.compania for select using (true);
create policy compania_admin on nucleo.compania for all
  using (seguridad.tiene_rol('admin', 'director'))
  with check (seguridad.tiene_rol('admin', 'director'));

create policy parametro_lectura on nucleo.parametro for select using (auth.uid() is not null);
create policy parametro_admin on nucleo.parametro for all
  using (seguridad.tiene_rol('admin', 'director'))
  with check (seguridad.tiene_rol('admin', 'director'));

create policy feriado_lectura on nucleo.feriado for select using (true);
create policy feriado_admin on nucleo.feriado for all
  using (seguridad.tiene_rol('admin', 'director', 'secretario'))
  with check (seguridad.tiene_rol('admin', 'director', 'secretario'));

create policy contraparte_lectura on nucleo.contraparte for select
  using (seguridad.es_oficial());
create policy contraparte_escritura on nucleo.contraparte for all
  using (seguridad.tiene_rol('admin', 'director', 'tesorero', 'protesorero', 'secretario'))
  with check (seguridad.tiene_rol('admin', 'director', 'tesorero', 'protesorero', 'secretario'));

create policy regla_lectura on nucleo.regla_alerta for select using (seguridad.es_oficial());
create policy regla_admin on nucleo.regla_alerta for all
  using (seguridad.tiene_rol('admin', 'director'))
  with check (seguridad.tiene_rol('admin', 'director'));

create policy alerta_lectura on nucleo.alerta for select using (seguridad.es_oficial());
create policy alerta_gestion on nucleo.alerta for update
  using (seguridad.es_oficial()) with check (seguridad.es_oficial());

create policy staging_lectura on nucleo.staging_importacion for select using (seguridad.es_oficial());
create policy staging_escritura on nucleo.staging_importacion for all
  using (seguridad.tiene_rol('admin', 'director', 'secretario', 'tesorero'))
  with check (seguridad.tiene_rol('admin', 'director', 'secretario', 'tesorero'));

-- Permisos de API (los esquemas expuestos se configuran en supabase/config.toml)
grant usage on schema nucleo to authenticated, anon;
grant select, insert, update, delete on all tables in schema nucleo to authenticated;
grant usage, select on all sequences in schema nucleo to authenticated;
grant select on nucleo.compania, nucleo.feriado to anon;

-- El logo de la compañía se referencia luego de crear documentos.archivo.
