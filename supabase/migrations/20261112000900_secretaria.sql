-- =====================================================================
-- 20261112000900 · Secretaría: actas, acuerdos, correspondencia, elecciones
-- =====================================================================
set search_path = secretaria, personal, asistencia, documentos, seguridad, public;

create type secretaria.estado_acuerdo as enum ('pendiente', 'en_curso', 'cumplido', 'anulado');
create type secretaria.sentido_correspondencia as enum ('recibida', 'despachada');

create table secretaria.tipo_sesion (
  codigo      text primary key,
  nombre      text not null,
  obligatoria boolean not null default true,
  quorum      integer
);
comment on table secretaria.tipo_sesion is 'Tipos de sesión y acta (reemplaza el texto libre del legado).';

insert into secretaria.tipo_sesion (codigo, nombre, obligatoria) values
  ('RO', 'Reunión ordinaria', true),
  ('REO', 'Reunión extraordinaria de oficiales', true),
  ('JO', 'Junta de Oficiales', true),
  ('CD', 'Consejo de Disciplina', true),
  ('ASAMBLEA', 'Asamblea de compañía', true),
  ('OTRA', 'Otra sesión', false);

create table secretaria.acta (
  id              bigint generated always as identity primary key,
  tipo_sesion_codigo text not null references secretaria.tipo_sesion(codigo),
  numero          integer not null,
  anio            integer not null,
  fecha           date not null,
  lista_id        bigint references asistencia.lista(id),
  quorum_ok       boolean,
  aprobada_en_acta_id bigint references secretaria.acta(id),
  archivo_id      uuid references documentos.archivo(id) on delete set null,
  texto           text,
  creado_por      uuid default auth.uid(),
  creado_en       timestamptz not null default now(),
  unique (tipo_sesion_codigo, anio, numero)
);
comment on table secretaria.acta is 'Acta de sesión. Presentes y permisos se derivan de la lista asociada.';
comment on column secretaria.acta.lista_id is 'Lista de asistencia del acto, fuente de presentes y permisos.';

create table secretaria.acuerdo (
  id          bigint generated always as identity primary key,
  acta_id     bigint not null references secretaria.acta(id) on delete cascade,
  numero      integer not null,
  texto       text not null,
  votos_favor integer,
  votos_contra integer,
  abstenciones integer,
  resultado   text,
  monto       numeric(14,0),
  responsable_persona_id uuid references personal.persona(id) on delete set null,
  plazo       date,
  estado      secretaria.estado_acuerdo not null default 'pendiente',
  seguimiento text,
  creado_en   timestamptz not null default now(),
  unique (acta_id, numero)
);
comment on table secretaria.acuerdo is 'Acuerdos del acta. Los acuerdos con monto originan compromisos en tesorería.';
create index acuerdo_estado_idx on secretaria.acuerdo (estado, plazo);

create table secretaria.correspondencia (
  id          bigint generated always as identity primary key,
  sentido     secretaria.sentido_correspondencia not null,
  numero      text,
  fecha       date not null,
  contraparte_id bigint references nucleo.contraparte(id),
  materia     text,
  responde_a_id bigint references secretaria.correspondencia(id),
  plazo_respuesta date,
  archivo_id  uuid references documentos.archivo(id) on delete set null,
  creado_en   timestamptz not null default now()
);
comment on table secretaria.correspondencia is 'Correspondencia recibida y despachada, vinculada a contrapartes.';

create table secretaria.eleccion (
  id         bigint generated always as identity primary key,
  fecha      date not null,
  tipo       text not null default 'ordinaria',
  acta_id    bigint references secretaria.acta(id),
  observacion text,
  creado_en  timestamptz not null default now()
);
comment on table secretaria.eleccion is 'Proceso electoral de la compañía (P15).';

create table secretaria.candidatura (
  eleccion_id bigint not null references secretaria.eleccion(id) on delete cascade,
  persona_id uuid not null references personal.persona(id) on delete cascade,
  cargo_id   bigint not null references personal.cargo(id),
  votos      integer,
  electo     boolean not null default false,
  primary key (eleccion_id, persona_id, cargo_id)
);
comment on table secretaria.candidatura is 'Candidaturas y resultados por cargo.';

create table secretaria.traspaso_cargo (
  id          bigint generated always as identity primary key,
  cargo_id    bigint not null references personal.cargo(id),
  persona_sale_id uuid references personal.persona(id),
  persona_entra_id uuid references personal.persona(id),
  fecha       date not null,
  acta_id     bigint references secretaria.acta(id),
  observacion text,
  creado_en   timestamptz not null default now()
);
comment on table secretaria.traspaso_cargo is 'Acta de entrega y recepción de cargo (P17).';

-- ---------------------------------------------------------------------
-- FKs diferidas que apuntan a actas, acuerdos y sesiones
-- ---------------------------------------------------------------------
alter table personal.cargo_periodo
  add constraint cargo_periodo_acta_fk foreign key (acta_id) references secretaria.acta(id) on delete set null;
alter table personal.persona_premio
  add constraint persona_premio_acta_fk foreign key (acta_id) references secretaria.acta(id) on delete set null;
alter table tesoreria.presupuesto
  add constraint presupuesto_acta_fk foreign key (acta_id) references secretaria.acta(id) on delete set null;
alter table tesoreria.campana
  add constraint campana_acta_fk foreign key (acta_id) references secretaria.acta(id) on delete set null;
alter table tesoreria.cierre_mensual
  add constraint cierre_acta_fk foreign key (aprobado_acta_id) references secretaria.acta(id) on delete set null;
alter table tesoreria.cuota_valor
  add constraint cuota_valor_acta_fk foreign key (acta_id) references secretaria.acta(id) on delete set null;
alter table tesoreria.movimiento
  add constraint movimiento_acuerdo_fk foreign key (acuerdo_id) references secretaria.acuerdo(id) on delete set null;
alter table tesoreria.compromiso
  add constraint compromiso_acuerdo_fk foreign key (acuerdo_id) references secretaria.acuerdo(id) on delete set null;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table secretaria.tipo_sesion    enable row level security;
alter table secretaria.acta           enable row level security;
alter table secretaria.acuerdo        enable row level security;
alter table secretaria.correspondencia enable row level security;
alter table secretaria.eleccion       enable row level security;
alter table secretaria.candidatura    enable row level security;
alter table secretaria.traspaso_cargo enable row level security;

create policy tipo_sesion_lectura on secretaria.tipo_sesion for select using (auth.uid() is not null);
create policy tipo_sesion_escritura on secretaria.tipo_sesion for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy acta_aprobada_lectura on secretaria.acta for select
  using (aprobada_en_acta_id is not null or seguridad.es_oficial());
create policy acta_escritura on secretaria.acta for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy acuerdo_lectura on secretaria.acuerdo for select
  using (seguridad.es_oficial() or seguridad.tiene_rol('bombero'));
create policy acuerdo_escritura on secretaria.acuerdo for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'tesorero', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'tesorero', 'director', 'admin'));

create policy correspondencia_lectura on secretaria.correspondencia for select using (seguridad.es_oficial());
create policy correspondencia_escritura on secretaria.correspondencia for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy eleccion_lectura on secretaria.eleccion for select using (auth.uid() is not null);
create policy eleccion_escritura on secretaria.eleccion for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy candidatura_lectura on secretaria.candidatura for select using (auth.uid() is not null);
create policy candidatura_escritura on secretaria.candidatura for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

create policy traspaso_lectura on secretaria.traspaso_cargo for select using (seguridad.es_oficial());
create policy traspaso_escritura on secretaria.traspaso_cargo for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

grant usage on schema secretaria to authenticated;
grant select, insert, update, delete on all tables in schema secretaria to authenticated;
grant usage, select on all sequences in schema secretaria to authenticated;
