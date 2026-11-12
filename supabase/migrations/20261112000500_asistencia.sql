-- =====================================================================
-- 20261112000500 · Asistencia: tipos de acto, listas y marcas
-- =====================================================================
set search_path = asistencia, personal, seguridad, nucleo, public;

create type asistencia.marca as enum ('A', 'F', 'P', 'R', 'S', 'L');
comment on type asistencia.marca is 'A asiste · F falta · P permiso · R eximido · S suspendido · L licencia.';

create type asistencia.estado_lista as enum ('borrador', 'cerrada', 'enviada', 'anulada');

create table asistencia.tipo_acto (
  clave             text primary key,
  descripcion       text not null,
  obligatorio       boolean not null default false,
  cuenta_para_premio boolean not null default true,
  activo            boolean not null default true
);
comment on table asistencia.tipo_acto is 'Claves de acto del libro de asistencia (RO, RE, claves numéricas, etc.).';
comment on column asistencia.tipo_acto.descripcion is 'Las claves sin descripción del legado quedan como "Clave X (completar descripción)".';

insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values
  ('RO',   'Reunión ordinaria', true),
  ('RE',   'Reunión extraordinaria', true),
  ('REO',  'Reunión extraordinaria de oficiales', true),
  ('ACAD', 'Academia', false),
  ('EJER', 'Ejercicio o instrucción', false),
  ('SERV', 'Servicio o emergencia', false),
  ('OTRO', 'Otro acto', false)
on conflict (clave) do nothing;

create table asistencia.lista (
  id             bigint generated always as identity primary key,
  compania_id    smallint not null default 1 references nucleo.compania(id),
  anio           integer not null,
  numero         integer not null,
  fecha          date not null,
  tipo_acto_clave text references asistencia.tipo_acto(clave),
  descripcion    text,
  direccion      text,
  estado         asistencia.estado_lista not null default 'borrador',
  es_abono       boolean not null default false,
  abono_justificacion text,
  origen         text not null default 'manual' check (origen in ('manual', 'importacion', 'viper')),
  ref_externa    text,
  cerrada_en     timestamptz,
  enviada_en     timestamptz,
  cerrada_por    uuid,
  enviada_por    uuid,
  creado_por     uuid default auth.uid(),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (compania_id, anio, numero),
  constraint lista_abono_justificado check (not es_abono or length(trim(coalesce(abono_justificacion, ''))) > 0),
  constraint lista_anio_coherente check (extract(year from fecha)::int = anio)
);
comment on table asistencia.lista is 'Lista de asistencia de un acto. Cerrada y enviada queda protegida contra ediciones sin motivo.';
comment on column asistencia.lista.es_abono is 'Lista de abono (reposición de asistencia) con justificación obligatoria.';

create index lista_fecha_idx on asistencia.lista (anio desc, numero desc);
create trigger lista_actualizado before update on asistencia.lista
  for each row execute function nucleo.actualizado_en();

create table asistencia.asistencia (
  lista_id       bigint not null references asistencia.lista(id) on delete cascade,
  persona_id     uuid not null references personal.persona(id) on delete cascade,
  marca          asistencia.marca not null,
  observacion    text,
  registrado_por uuid default auth.uid(),
  registrado_en  timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  primary key (lista_id, persona_id)
);
comment on table asistencia.asistencia is 'Marca de una persona en una lista. La clave compuesta hace el upsert idempotente.';
create index asistencia_persona_idx on asistencia.asistencia (persona_id);

create or replace function asistencia.motivo_edicion()
returns text
language sql
stable
as $$ select nullif(current_setting('app.motivo_edicion', true), '') $$;

create or replace function asistencia.fn_proteger_lista()
returns trigger
language plpgsql
as $$
begin
  if old.estado in ('cerrada', 'enviada')
     and asistencia.motivo_edicion() is null
     and (new.numero <> old.numero
          or new.fecha <> old.fecha
          or new.tipo_acto_clave is distinct from old.tipo_acto_clave
          or new.es_abono <> old.es_abono
          or new.abono_justificacion is distinct from old.abono_justificacion) then
    raise exception 'La lista %-% está % y no puede modificarse sin motivo.', old.anio, old.numero, old.estado
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end
$$;

create trigger lista_protegida before update on asistencia.lista
  for each row execute function asistencia.fn_proteger_lista();

create or replace function asistencia.fn_proteger_asistencia()
returns trigger
language plpgsql
security definer
set search_path = asistencia, public
as $$
declare
  v_estado asistencia.estado_lista;
  v_lista bigint := coalesce(new.lista_id, old.lista_id);
begin
  select estado into v_estado from asistencia.lista where id = v_lista;
  if v_estado in ('cerrada', 'enviada') and asistencia.motivo_edicion() is null then
    raise exception 'La lista % está %; indique un motivo para corregir una marca.', v_lista, v_estado
      using errcode = 'insufficient_privilege';
  end if;
  return coalesce(new, old);
end
$$;

create trigger asistencia_protegida before insert or update or delete on asistencia.asistencia
  for each row execute function asistencia.fn_proteger_asistencia();

-- ---------------------------------------------------------------------
-- RPC de operación
-- ---------------------------------------------------------------------
create or replace function asistencia.corregir_marca(
  p_lista_id bigint,
  p_persona_id uuid,
  p_marca asistencia.marca,
  p_motivo text,
  p_observacion text default null
)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
begin
  if not seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin') then
    raise exception 'Sin permiso para corregir asistencia.' using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Debe indicar un motivo de al menos 3 caracteres.';
  end if;

  perform set_config('app.motivo_edicion', p_motivo, true);

  insert into asistencia.asistencia (lista_id, persona_id, marca, observacion, registrado_por)
  values (p_lista_id, p_persona_id, p_marca, p_observacion, auth.uid())
  on conflict (lista_id, persona_id) do update
    set marca = excluded.marca,
        observacion = excluded.observacion,
        registrado_por = auth.uid(),
        actualizado_en = now();
end
$$;
comment on function asistencia.corregir_marca(bigint, uuid, asistencia.marca, text, text) is 'Corrige una marca incluso en lista cerrada, dejando el motivo en auditoría.';

create or replace function asistencia.cerrar_lista(p_lista_id bigint)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
declare
  v_lista asistencia.lista;
begin
  if not seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin') then
    raise exception 'Sin permiso para cerrar listas.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_lista from asistencia.lista where id = p_lista_id for update;
  if not found then raise exception 'Lista % no existe.', p_lista_id; end if;
  if v_lista.estado <> 'borrador' then raise exception 'La lista ya está %.', v_lista.estado; end if;
  if v_lista.es_abono and length(trim(coalesce(v_lista.abono_justificacion, ''))) = 0 then
    raise exception 'Una lista de abono requiere justificación.';
  end if;

  update asistencia.lista
     set estado = 'cerrada', cerrada_en = now(), cerrada_por = auth.uid()
   where id = p_lista_id;
end
$$;

create or replace function asistencia.enviar_lista(p_lista_id bigint)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
declare
  v_lista asistencia.lista;
begin
  if not seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin') then
    raise exception 'Sin permiso para enviar listas.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_lista from asistencia.lista where id = p_lista_id for update;
  if not found then raise exception 'Lista % no existe.', p_lista_id; end if;
  if v_lista.estado = 'borrador' then perform asistencia.cerrar_lista(p_lista_id); end if;

  update asistencia.lista
     set estado = 'enviada', enviada_en = now(), enviada_por = auth.uid()
   where id = p_lista_id and estado in ('cerrada');
end
$$;

create or replace function asistencia.marcar_resto_falta(p_lista_id bigint)
returns integer
language plpgsql
security definer
set search_path = asistencia, personal, seguridad, public
as $$
declare
  v_n integer;
begin
  if not seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin') then
    raise exception 'Sin permiso para marcar asistencia.' using errcode = 'insufficient_privilege';
  end if;

  insert into asistencia.asistencia (lista_id, persona_id, marca, registrado_por)
  select p_lista_id, p.id, 'F', auth.uid()
  from personal.persona p
  where p.estado = 'activo'
    and not exists (
      select 1 from asistencia.asistencia a
      where a.lista_id = p_lista_id and a.persona_id = p.id
    );
  get diagnostics v_n = row_count;
  return v_n;
end
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table asistencia.tipo_acto enable row level security;
alter table asistencia.lista     enable row level security;
alter table asistencia.asistencia enable row level security;

create policy tipo_acto_lectura on asistencia.tipo_acto for select using (auth.uid() is not null);
create policy tipo_acto_escritura on asistencia.tipo_acto for all
  using (seguridad.tiene_rol('capitan', 'secretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('capitan', 'secretario', 'director', 'admin'));

create policy lista_lectura on asistencia.lista for select
  using (auth.uid() is not null);
create policy lista_escritura on asistencia.lista for all
  using (seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin'))
  with check (seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin'));

create policy asistencia_propia on asistencia.asistencia for select
  using (persona_id = seguridad.mi_persona());
create policy asistencia_oficialidad on asistencia.asistencia for select
  using (seguridad.es_oficial());
create policy asistencia_escritura on asistencia.asistencia for all
  using (seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin'))
  with check (seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin'));

grant usage on schema asistencia to authenticated;
grant select, insert, update, delete on all tables in schema asistencia to authenticated;
grant usage, select on all sequences in schema asistencia to authenticated;
grant execute on function asistencia.corregir_marca(bigint, uuid, asistencia.marca, text, text) to authenticated;
grant execute on function asistencia.cerrar_lista(bigint) to authenticated;
grant execute on function asistencia.enviar_lista(bigint) to authenticated;
grant execute on function asistencia.marcar_resto_falta(bigint) to authenticated;
