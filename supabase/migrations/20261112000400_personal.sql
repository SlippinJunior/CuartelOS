-- =====================================================================
-- 20261112000400 · Personal: personas, cargos, formación, premios
-- =====================================================================
set search_path = personal, seguridad, nucleo, documentos, public;

create type personal.rango as enum ('aspirante', 'bombero', 'honorario', 'insigne', 'martir');
create type personal.estado_persona as enum ('activo', 'suspendido', 'renunciado', 'separado', 'expulsado', 'fallecido', 'trasladado');
create type personal.sexo as enum ('masculino', 'femenino', 'otro', 'no_informa');
create type personal.tipo_evento as enum ('alta', 'cambio_rango', 'cambio_estado', 'cambio_datos', 'reincorporacion', 'traslado', 'otro');
create type personal.tipo_situacion as enum ('licencia_medica', 'embarazo', 'accidente', 'suspension', 'comision', 'permiso_especial', 'otro');
create type personal.tipo_cargo as enum ('director', 'oficial', 'consejo', 'comision', 'administrativo', 'otro');
create type personal.estado_postulacion as enum ('recibida', 'en_evaluacion', 'aceptada', 'rechazada', 'retirada');

-- ---------------------------------------------------------------------
-- Persona
-- ---------------------------------------------------------------------
create table personal.persona (
  id                 uuid primary key default gen_random_uuid(),
  compania_id        smallint not null default 1 references nucleo.compania(id),
  registro           integer not null,
  rut                text,
  nombres            text not null,
  apellido_paterno   text not null,
  apellido_materno   text,
  fecha_nacimiento   date,
  sexo               personal.sexo,
  email              text,
  telefono           text,
  direccion          text,
  fecha_ingreso      date,
  rango              personal.rango not null default 'bombero',
  estado             personal.estado_persona not null default 'activo',
  fecha_estado       date,
  observaciones      text,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  unique (compania_id, registro)
);
comment on table personal.persona is 'Bombero o aspirante. rango y estado son caché mantenidos por persona_evento (fuente de verdad).';
comment on column personal.persona.rut is 'RUT chileno. Se guarda como texto para preservar el dígito verificador.';

create unique index persona_rut_uk on personal.persona (rut) where rut is not null;
create index persona_nombre_idx on personal.persona (nucleo.normalizar(apellido_paterno || ' ' || nombres));
create index persona_estado_idx on personal.persona (estado);

create trigger persona_actualizado before update on personal.persona
  for each row execute function nucleo.actualizado_en();

create table personal.persona_evento (
  id            bigint generated always as identity primary key,
  persona_id    uuid not null references personal.persona(id) on delete cascade,
  tipo          personal.tipo_evento not null,
  rango         personal.rango,
  estado        personal.estado_persona,
  fecha         date not null default current_date,
  motivo        text,
  archivo_id    uuid references documentos.archivo(id) on delete set null,
  registrado_por uuid default auth.uid(),
  creado_en     timestamptz not null default now()
);
comment on table personal.persona_evento is 'Historial de alta, cambios de rango o estado, traslados y reincorporaciones. Fuente de verdad.';
create index persona_evento_persona_idx on personal.persona_evento (persona_id, fecha desc);

create or replace function personal.fn_aplicar_evento()
returns trigger
language plpgsql
security definer
set search_path = personal, public
as $$
begin
  update personal.persona
     set rango = coalesce(new.rango, rango),
         estado = coalesce(new.estado, estado),
         fecha_estado = case when new.estado is not null then new.fecha else fecha_estado end
   where id = new.persona_id;
  return new;
end
$$;
comment on function personal.fn_aplicar_evento() is 'Un solo camino de escritura: persona_evento actualiza el estado y rango actuales.';

create trigger persona_evento_aplicar after insert on personal.persona_evento
  for each row execute function personal.fn_aplicar_evento();

create or replace function personal.fn_alta_evento()
returns trigger
language plpgsql
security definer
set search_path = personal, public
as $$
begin
  insert into personal.persona_evento (persona_id, tipo, rango, estado, fecha, motivo, registrado_por)
  values (
    new.id, 'alta', new.rango, new.estado,
    coalesce(new.fecha_estado, new.fecha_ingreso, current_date),
    'Alta registrada automáticamente', auth.uid()
  );
  return new;
end
$$;

create trigger persona_alta_evento after insert on personal.persona
  for each row execute function personal.fn_alta_evento();

-- ---------------------------------------------------------------------
-- Datos sensibles (1 a 1, con acceso auditado)
-- ---------------------------------------------------------------------
create table personal.persona_dato_sensible (
  persona_id      uuid primary key references personal.persona(id) on delete cascade,
  grupo_sanguineo text,
  alergias        text,
  condiciones     text,
  medicamentos    text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  notas           text,
  actualizado_en  timestamptz not null default now()
);
comment on table personal.persona_dato_sensible is 'Datos de salud y contacto de emergencia. Cada lectura de la oficialidad queda auditada vía RPC.';

create trigger persona_dato_sensible_actualizado before update on personal.persona_dato_sensible
  for each row execute function nucleo.actualizado_en();

create table personal.licencia_conducir (
  id         bigint generated always as identity primary key,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  clase      text not null,
  numero     text,
  vence      date,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  notas      text,
  creado_en  timestamptz not null default now()
);
comment on table personal.licencia_conducir is 'Licencias de conducir del bombero, con vencimiento para alertas.';

create table personal.antiguedad_abono (
  id         bigint generated always as identity primary key,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  anios      numeric(5,2) not null check (anios > 0),
  fecha      date not null,
  motivo     text not null,
  resolucion text,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  creado_en  timestamptz not null default now()
);
comment on table personal.antiguedad_abono is 'Abonos de antigüedad reconocidos por acuerdo (no alteran fecha_ingreso).';

-- ---------------------------------------------------------------------
-- Cargos
-- ---------------------------------------------------------------------
create table personal.cargo (
  id         bigint generated always as identity primary key,
  codigo     text not null unique,
  nombre     text not null,
  tipo       personal.tipo_cargo not null default 'oficial',
  es_unico   boolean not null default true,
  orden      smallint not null default 0
);
comment on table personal.cargo is 'Catálogo de cargos de la compañía. es_unico impide dos titulares simultáneos.';

insert into personal.cargo (codigo, nombre, tipo, es_unico, orden) values
  ('DIR',  'Director de Compañía',              'director', true, 10),
  ('SEC',  'Secretario de Compañía',            'oficial',  true, 20),
  ('PROSEC','Prosecretario de Compañía',        'oficial',  true, 21),
  ('TES',  'Tesorero de Compañía',              'oficial',  true, 30),
  ('PROTES','Protesorero de Compañía',          'oficial',  true, 31),
  ('CAP',  'Capitán de Compañía',               'oficial',  true, 40),
  ('T1',   'Teniente Primero',                  'oficial',  true, 50),
  ('T2',   'Teniente Segundo',                  'oficial',  true, 51),
  ('T3',   'Teniente Tercero',                  'oficial',  true, 52),
  ('AYU',  'Ayudante de Compañía',              'oficial',  true, 60),
  ('CONS', 'Consejero de Compañía',             'consejo',  false, 70),
  ('COM',  'Comisión de Trabajo',               'comision', false, 80),
  ('ADM',  'Administrativo',                    'administrativo', false, 90);

create table personal.cargo_periodo (
  id         bigint generated always as identity primary key,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  cargo_id   bigint not null references personal.cargo(id),
  desde      date not null,
  hasta      date,
  acta_id    bigint,
  observacion text,
  creado_en  timestamptz not null default now(),
  constraint cargo_periodo_fechas check (hasta is null or hasta >= desde)
);
comment on table personal.cargo_periodo is 'Ejercicio de un cargo con fechas. Impide superposición de cargos únicos e incompatibilidad oficial ↔ consejo.';
comment on column personal.cargo_periodo.acta_id is 'Acta de elección o nombramiento (FK en migración de secretaría).';
create index cargo_periodo_persona_idx on personal.cargo_periodo (persona_id, desde desc);
create index cargo_periodo_cargo_idx on personal.cargo_periodo (cargo_id, desde desc);

create or replace function personal.fn_validar_cargo_periodo()
returns trigger
language plpgsql
security definer
set search_path = personal, public
as $$
declare
  v_tipo personal.tipo_cargo;
  v_unico boolean;
  v_rango daterange;
begin
  select tipo, es_unico into v_tipo, v_unico from personal.cargo where id = new.cargo_id;
  v_rango := daterange(new.desde, new.hasta, '[)');

  if v_unico and exists (
    select 1 from personal.cargo_periodo cp
    where cp.cargo_id = new.cargo_id
      and cp.id <> coalesce(new.id, 0)
      and daterange(cp.desde, cp.hasta, '[)') && v_rango
  ) then
    raise exception 'Ya existe un titular del cargo % en ese período.', new.cargo_id
      using errcode = 'exclusion_violation';
  end if;

  if v_tipo = 'oficial' and exists (
    select 1 from personal.cargo_periodo cp
    join personal.cargo c on c.id = cp.cargo_id
    where cp.persona_id = new.persona_id
      and c.tipo = 'consejo'
      and cp.id <> coalesce(new.id, 0)
      and daterange(cp.desde, cp.hasta, '[)') && v_rango
  ) then
    raise exception 'Incompatibilidad art. 44: un oficial no puede ser consejero en el mismo período.';
  end if;

  if v_tipo = 'consejo' and exists (
    select 1 from personal.cargo_periodo cp
    join personal.cargo c on c.id = cp.cargo_id
    where cp.persona_id = new.persona_id
      and c.tipo = 'oficial'
      and cp.id <> coalesce(new.id, 0)
      and daterange(cp.desde, cp.hasta, '[)') && v_rango
  ) then
    raise exception 'Incompatibilidad art. 44: un consejero no puede ser oficial en el mismo período.';
  end if;

  return new;
end
$$;

create trigger cargo_periodo_validar before insert or update on personal.cargo_periodo
  for each row execute function personal.fn_validar_cargo_periodo();

-- ---------------------------------------------------------------------
-- Formación y premios
-- ---------------------------------------------------------------------
create table personal.curso (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  institucion text not null default 'Academia Nacional de Bomberos',
  nivel       text,
  horas       numeric(6,1),
  unique (nombre, institucion, nivel)
);
comment on table personal.curso is 'Catálogo de cursos (ANB y otros).';

create table personal.persona_curso (
  id                bigint generated always as identity primary key,
  persona_id        uuid not null references personal.persona(id) on delete cascade,
  curso_id          bigint not null references personal.curso(id),
  fecha_aprobacion  date,
  vigente_hasta     date,
  nota              numeric(3,1),
  certificado_archivo_id uuid references documentos.archivo(id) on delete set null,
  observacion       text,
  unique (persona_id, curso_id, fecha_aprobacion)
);
comment on table personal.persona_curso is 'Cursos aprobados por cada bombero.';

create table personal.premio_tipo (
  id            bigint generated always as identity primary key,
  codigo        text not null unique,
  nombre        text not null,
  requiere_anios boolean not null default false,
  descripcion   text
);
comment on table personal.premio_tipo is 'Tipos de premio y distinción.';

insert into personal.premio_tipo (codigo, nombre, requiere_anios, descripcion) values
  ('CONSTANCIA', 'Premio de Constancia', true,  'Quinquenios de servicio activo.'),
  ('ASISTENCIA', 'Premio de Asistencia', false, 'Reconocimiento a la asistencia anual.'),
  ('DISTINCION', 'Distinción', false, 'Distinción especial acordada por la compañía.'),
  ('HONORARIO', 'Miembro Honorario', true, 'Reconocimiento a los 35 años de servicio (art. 49).'),
  ('INSIGNE', 'Bombero Insigne', true, 'Rango de insigne.');

create table personal.persona_premio (
  id            bigint generated always as identity primary key,
  persona_id    uuid not null references personal.persona(id) on delete cascade,
  premio_tipo_id bigint not null references personal.premio_tipo(id),
  anios         integer,
  otorgado_por  text,
  fecha         date,
  acta_id       bigint,
  observacion   text
);
comment on table personal.persona_premio is 'Premios recibidos por el bombero.';
comment on column personal.persona_premio.acta_id is 'Acta que otorga el premio (FK en migración de secretaría).';

-- ---------------------------------------------------------------------
-- Situaciones especiales y postulaciones
-- ---------------------------------------------------------------------
create table personal.situacion_especial (
  id         bigint generated always as identity primary key,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  tipo       personal.tipo_situacion not null,
  desde      date not null,
  hasta      date,
  motivo     text,
  archivo_id uuid references documentos.archivo(id) on delete set null,
  creado_en  timestamptz not null default now(),
  constraint situacion_fechas check (hasta is null or hasta >= desde)
);
comment on table personal.situacion_especial is 'Licencias, embarazo, suspensiones y comisiones. Premarcan el pase de lista.';
create index situacion_vigente_idx on personal.situacion_especial (persona_id, desde, hasta);

create table personal.postulacion (
  id          bigint generated always as identity primary key,
  nombres     text not null,
  apellido_paterno text not null,
  apellido_materno text,
  rut         text,
  email       text,
  telefono    text,
  fecha_solicitud date not null default current_date,
  estado      personal.estado_postulacion not null default 'recibida',
  observaciones text,
  decidido_por uuid references personal.persona(id),
  decidido_en timestamptz,
  creado_en   timestamptz not null default now()
);
comment on table personal.postulacion is 'Expediente de postulación (P1) antes de crear la persona.';

-- ---------------------------------------------------------------------
-- FKs que llegan desde seguridad y núcleo
-- ---------------------------------------------------------------------
alter table seguridad.usuario
  add constraint usuario_persona_fk foreign key (persona_id)
  references personal.persona(id) on delete set null;

alter table nucleo.alerta
  add constraint alerta_responsable_fk foreign key (responsable_persona_id)
  references personal.persona(id) on delete set null;

-- ---------------------------------------------------------------------
-- Lectura auditada de datos sensibles
-- ---------------------------------------------------------------------
create or replace function personal.leer_dato_sensible(p_persona_id uuid)
returns personal.persona_dato_sensible
language plpgsql
security definer
set search_path = personal, seguridad, public
as $$
declare
  v_dato personal.persona_dato_sensible;
begin
  if not (p_persona_id = seguridad.mi_persona() or seguridad.es_oficial()) then
    raise exception 'Sin permiso para leer datos sensibles de esta persona.' using errcode = 'insufficient_privilege';
  end if;

  insert into seguridad.auditoria (esquema, tabla, fila_id, accion, usuario_id)
  values ('personal', 'persona_dato_sensible', p_persona_id::text, 'SELECT', auth.uid());

  select * into v_dato from personal.persona_dato_sensible where persona_id = p_persona_id;
  return v_dato;
end
$$;
comment on function personal.leer_dato_sensible(uuid) is 'Único camino de lectura de datos sensibles. Registra la lectura en auditoría.';

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table personal.persona              enable row level security;
alter table personal.persona_evento       enable row level security;
alter table personal.persona_dato_sensible enable row level security;
alter table personal.licencia_conducir    enable row level security;
alter table personal.antiguedad_abono     enable row level security;
alter table personal.cargo                enable row level security;
alter table personal.cargo_periodo        enable row level security;
alter table personal.curso                enable row level security;
alter table personal.persona_curso        enable row level security;
alter table personal.premio_tipo          enable row level security;
alter table personal.persona_premio       enable row level security;
alter table personal.situacion_especial   enable row level security;
alter table personal.postulacion          enable row level security;

create policy persona_propia on personal.persona for select
  using (id = seguridad.mi_persona());
create policy persona_oficialidad on personal.persona for select
  using (seguridad.es_oficial() or seguridad.tiene_rol('consejo'));
create policy persona_escritura on personal.persona for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy evento_propio on personal.persona_evento for select
  using (persona_id = seguridad.mi_persona());
create policy evento_oficialidad on personal.persona_evento for select
  using (seguridad.es_oficial() or seguridad.tiene_rol('consejo'));
create policy evento_escritura on personal.persona_evento for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy sensible_propio on personal.persona_dato_sensible for select
  using (persona_id = seguridad.mi_persona());
create policy sensible_escritura on personal.persona_dato_sensible for all
  using (
    persona_id = seguridad.mi_persona()
    or seguridad.tiene_rol('secretario', 'director', 'admin')
  )
  with check (
    persona_id = seguridad.mi_persona()
    or seguridad.tiene_rol('secretario', 'director', 'admin')
  );

create policy licencia_propia on personal.licencia_conducir for select
  using (persona_id = seguridad.mi_persona());
create policy licencia_oficialidad on personal.licencia_conducir for select
  using (seguridad.es_oficial());
create policy licencia_escritura on personal.licencia_conducir for all
  using (persona_id = seguridad.mi_persona() or seguridad.tiene_rol('secretario', 'director', 'admin'))
  with check (persona_id = seguridad.mi_persona() or seguridad.tiene_rol('secretario', 'director', 'admin'));

create policy abono_propio on personal.antiguedad_abono for select
  using (persona_id = seguridad.mi_persona());
create policy abono_oficialidad on personal.antiguedad_abono for select
  using (seguridad.es_oficial());
create policy abono_escritura on personal.antiguedad_abono for all
  using (seguridad.tiene_rol('secretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'director', 'admin'));

create policy cargo_lectura on personal.cargo for select using (auth.uid() is not null);
create policy cargo_escritura on personal.cargo for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy cargo_periodo_propio on personal.cargo_periodo for select
  using (persona_id = seguridad.mi_persona());
create policy cargo_periodo_oficialidad on personal.cargo_periodo for select
  using (seguridad.es_oficial() or seguridad.tiene_rol('consejo'));
create policy cargo_periodo_escritura on personal.cargo_periodo for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy curso_lectura on personal.curso for select using (auth.uid() is not null);
create policy curso_escritura on personal.curso for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'director', 'admin'));

create policy persona_curso_propio on personal.persona_curso for select
  using (persona_id = seguridad.mi_persona());
create policy persona_curso_oficialidad on personal.persona_curso for select
  using (seguridad.es_oficial());
create policy persona_curso_escritura on personal.persona_curso for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'capitan', 'director', 'admin'));

create policy premio_tipo_lectura on personal.premio_tipo for select using (auth.uid() is not null);
create policy premio_tipo_escritura on personal.premio_tipo for all
  using (seguridad.tiene_rol('director', 'admin'))
  with check (seguridad.tiene_rol('director', 'admin'));

create policy persona_premio_propio on personal.persona_premio for select
  using (persona_id = seguridad.mi_persona());
create policy persona_premio_oficialidad on personal.persona_premio for select
  using (seguridad.es_oficial());
create policy persona_premio_escritura on personal.persona_premio for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy situacion_propia on personal.situacion_especial for select
  using (persona_id = seguridad.mi_persona());
create policy situacion_oficialidad on personal.situacion_especial for select
  using (seguridad.es_oficial());
create policy situacion_escritura on personal.situacion_especial for all
  using (seguridad.tiene_rol('secretario', 'capitan', 'ayudante', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'capitan', 'ayudante', 'director', 'admin'));

create policy postulacion_lectura on personal.postulacion for select
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));
create policy postulacion_escritura on personal.postulacion for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

-- Permisos de API
grant usage on schema personal to authenticated;
grant select, insert, update, delete on all tables in schema personal to authenticated;
grant usage, select on all sequences in schema personal to authenticated;
grant execute on function personal.leer_dato_sensible(uuid) to authenticated;

-- Los datos sensibles no se leen directamente: solo por la RPC auditada.
revoke select on personal.persona_dato_sensible from authenticated;
