-- =====================================================================
-- 20261112001000 · Disciplina: expedientes reservados del Consejo
-- =====================================================================
set search_path = disciplina, personal, secretaria, documentos, seguridad, public;

create type disciplina.estado_expediente as enum ('abierto', 'en_investigacion', 'resuelto', 'archivado');
create type disciplina.tipo_medida as enum ('amonestacion', 'suspension', 'multa', 'separacion', 'expulsion', 'absolucion');

create table disciplina.expediente (
  id          bigint generated always as identity primary key,
  numero      integer not null,
  anio        integer not null,
  persona_id  uuid not null references personal.persona(id),
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  estado      disciplina.estado_expediente not null default 'abierto',
  causa       text not null,
  instructor_persona_id uuid references personal.persona(id) on delete set null,
  acta_id     bigint references secretaria.acta(id) on delete set null,
  reservado   boolean not null default true,
  observacion text,
  creado_por  uuid default auth.uid(),
  creado_en   timestamptz not null default now(),
  unique (anio, numero)
);
comment on table disciplina.expediente is 'Expediente del Consejo de Disciplina. Aislado en su propio esquema (art. 125 B 25).';

create table disciplina.sancion (
  id          bigint generated always as identity primary key,
  expediente_id bigint references disciplina.expediente(id) on delete cascade,
  persona_id  uuid not null references personal.persona(id),
  tipo_medida disciplina.tipo_medida not null,
  descripcion text not null,
  fecha       date not null default current_date,
  desde       date,
  hasta       date,
  ejecutoriada boolean not null default false,
  fecha_ejecutoriada date,
  acta_id     bigint references secretaria.acta(id) on delete set null,
  notificada_en timestamptz,
  creado_en   timestamptz not null default now(),
  constraint sancion_fechas check (hasta is null or desde is null or hasta >= desde)
);
comment on table disciplina.sancion is 'Sanciones. El Director solo ve las que están ejecutoriadas.';

create table disciplina.medida_preventiva (
  id          bigint generated always as identity primary key,
  expediente_id bigint not null references disciplina.expediente(id) on delete cascade,
  persona_id  uuid not null references personal.persona(id),
  medida      text not null,
  desde       date not null default current_date,
  hasta       date,
  motivo      text,
  creado_en   timestamptz not null default now(),
  constraint preventiva_fechas check (hasta is null or hasta >= desde)
);
comment on table disciplina.medida_preventiva is 'Suspensiones u otras medidas cautelares mientras dura el expediente.';

create table disciplina.plazo_disciplinario (
  id          bigint generated always as identity primary key,
  expediente_id bigint not null references disciplina.expediente(id) on delete cascade,
  etapa       text not null,
  vence       date not null,
  cumplido    boolean not null default false,
  cumplido_en timestamptz,
  observacion text
);
comment on table disciplina.plazo_disciplinario is 'Control de plazos del procedimiento disciplinario.';

-- El Consejo puede leer el acta asociada a un expediente.
create policy acta_consejo on secretaria.acta for select
  using (
    seguridad.tiene_rol('consejo')
    and exists (select 1 from disciplina.expediente e where e.acta_id = secretaria.acta.id)
  );

alter table disciplina.expediente        enable row level security;
alter table disciplina.sancion           enable row level security;
alter table disciplina.medida_preventiva enable row level security;
alter table disciplina.plazo_disciplinario enable row level security;

create policy expediente_consejo on disciplina.expediente for all
  using (seguridad.tiene_rol('consejo'))
  with check (seguridad.tiene_rol('consejo'));

create policy sancion_consejo on disciplina.sancion for all
  using (seguridad.tiene_rol('consejo'))
  with check (seguridad.tiene_rol('consejo'));
create policy sancion_director_ejecutoriada on disciplina.sancion for select
  using (seguridad.tiene_rol('director') and ejecutoriada);

create policy preventiva_consejo on disciplina.medida_preventiva for all
  using (seguridad.tiene_rol('consejo'))
  with check (seguridad.tiene_rol('consejo'));

create policy plazo_consejo on disciplina.plazo_disciplinario for all
  using (seguridad.tiene_rol('consejo'))
  with check (seguridad.tiene_rol('consejo'));

grant usage on schema disciplina to authenticated;
grant select, insert, update, delete on all tables in schema disciplina to authenticated;
grant usage, select on all sequences in schema disciplina to authenticated;
