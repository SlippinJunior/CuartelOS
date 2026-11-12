-- =====================================================================
-- 20261112001100 · Documentos emitidos, folios y verificación pública
-- =====================================================================
set search_path = documentos, personal, seguridad, public;

create table documentos.folio_contador (
  tipo  text not null,
  anio  integer not null,
  ultimo integer not null default 0,
  primary key (tipo, anio)
);
comment on table documentos.folio_contador is 'Correlativo por tipo y año, sin saltos. No se expone por API.';

create table documentos.documento_emitido (
  id            uuid primary key default gen_random_uuid(),
  tipo_documento_codigo text not null references documentos.tipo_documento(codigo),
  anio          integer not null default extract(year from current_date),
  folio         integer not null,
  persona_id    uuid references personal.persona(id) on delete set null,
  referencia    text,
  hash_sha256   text not null,
  token_verificacion text not null unique default encode(extensions.gen_random_bytes(12), 'hex'),
  pdf_archivo_id uuid references documentos.archivo(id) on delete set null,
  emitido_por   uuid default auth.uid(),
  emitido_en    timestamptz not null default now(),
  anulado       boolean not null default false,
  motivo_anulacion text,
  anulado_por   uuid,
  anulado_en    timestamptz,
  unique (tipo_documento_codigo, anio, folio),
  constraint documento_anulacion check (not anulado or length(trim(coalesce(motivo_anulacion, ''))) > 0)
);
comment on table documentos.documento_emitido is 'PDF emitido con folio, SHA-256 y token de verificación QR.';
create index documento_persona_idx on documentos.documento_emitido (persona_id, emitido_en desc);

create or replace function documentos.siguiente_folio(p_tipo text)
returns integer
language plpgsql
security definer
set search_path = documentos, seguridad, public
as $$
declare
  v integer;
begin
  if not (seguridad.es_oficial() or auth.role() = 'service_role') then
    raise exception 'Sin permiso para emitir documentos.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from documentos.tipo_documento where codigo = p_tipo) then
    raise exception 'Tipo de documento % no existe.', p_tipo;
  end if;

  insert into documentos.folio_contador (tipo, anio, ultimo)
  values (p_tipo, extract(year from current_date)::int, 1)
  on conflict (tipo, anio) do update set ultimo = documentos.folio_contador.ultimo + 1
  returning ultimo into v;
  return v;
end
$$;
comment on function documentos.siguiente_folio(text) is 'Reserva el siguiente folio correlativo del tipo en el año en curso.';

create or replace function documentos.registrar_emision(
  p_tipo text,
  p_persona_id uuid,
  p_referencia text,
  p_hash text,
  p_pdf_bucket text,
  p_pdf_path text,
  p_nombre_archivo text default null,
  p_mime text default 'application/pdf',
  p_tamano bigint default null,
  p_folio integer default null,
  p_token text default null,
  p_emitido_por uuid default null
)
returns documentos.documento_emitido
language plpgsql
security definer
set search_path = documentos, personal, seguridad, public
as $$
declare
  v_folio integer;
  v_archivo_id uuid;
  v_doc documentos.documento_emitido;
begin
  if not (seguridad.es_oficial() or auth.role() = 'service_role') then
    raise exception 'Sin permiso para emitir documentos.' using errcode = 'insufficient_privilege';
  end if;
  if p_hash is null or length(p_hash) < 32 then
    raise exception 'Se requiere el SHA-256 del PDF.';
  end if;

  if p_folio is null then
    v_folio := documentos.siguiente_folio(p_tipo);
  else
    v_folio := p_folio;
  end if;

  insert into documentos.archivo (bucket, path, nombre, mime, tamano, hash_sha256, subido_por)
  values (p_pdf_bucket, p_pdf_path, coalesce(p_nombre_archivo, p_pdf_path), p_mime, p_tamano, p_hash,
          coalesce(p_emitido_por, auth.uid()))
  on conflict (bucket, path) do update set hash_sha256 = excluded.hash_sha256
  returning id into v_archivo_id;

  insert into documentos.documento_emitido (
    tipo_documento_codigo, anio, folio, persona_id, referencia, hash_sha256,
    token_verificacion, pdf_archivo_id, emitido_por
  ) values (
    p_tipo, extract(year from current_date)::int, v_folio, p_persona_id, p_referencia,
    p_hash, coalesce(p_token, encode(extensions.gen_random_bytes(12), 'hex')),
    v_archivo_id, coalesce(p_emitido_por, auth.uid())
  ) returning * into v_doc;

  return v_doc;
end
$$;
comment on function documentos.registrar_emision(text, uuid, text, text, text, text, text, text, bigint, integer, text, uuid) is 'Registra el PDF ya subido a Storage, asigna folio y token, y guarda el hash.';

create or replace function documentos.anular_documento(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = documentos, seguridad, public
as $$
begin
  if not seguridad.es_oficial() then
    raise exception 'Sin permiso para anular documentos.' using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Debe indicar el motivo de anulación.';
  end if;

  update documentos.documento_emitido
     set anulado = true, motivo_anulacion = p_motivo, anulado_por = auth.uid(), anulado_en = now()
   where id = p_id and not anulado;
end
$$;

create or replace function documentos.verificar_documento(p_token text)
returns table (tipo text, folio text, emitido_en timestamptz, valido boolean)
language sql
stable
security definer
set search_path = documentos, public
as $$
  select
    d.tipo_documento_codigo,
    d.anio || '-' || lpad(d.folio::text, 4, '0'),
    d.emitido_en,
    not d.anulado
  from documentos.documento_emitido d
  where d.token_verificacion = p_token
$$;
comment on function documentos.verificar_documento(text) is 'Verificación pública por token: devuelve solo tipo, folio, fecha y validez.';
grant execute on function documentos.verificar_documento(text) to anon, authenticated;

alter table documentos.folio_contador    enable row level security;
alter table documentos.documento_emitido enable row level security;

-- Nadie consulta el contador directamente.
create policy folio_sin_acceso on documentos.folio_contador for select using (false);

create policy documento_propio on documentos.documento_emitido for select
  using (persona_id = seguridad.mi_persona());
create policy documento_oficialidad on documentos.documento_emitido for select
  using (seguridad.es_oficial());
create policy documento_emision on documentos.documento_emitido for insert
  with check (seguridad.es_oficial() or auth.role() = 'service_role');
create policy documento_anulacion on documentos.documento_emitido for update
  using (seguridad.es_oficial())
  with check (seguridad.es_oficial());

revoke all on documentos.folio_contador from authenticated, anon;

grant select, insert, update, delete on documentos.archivo, documentos.tipo_documento,
  documentos.documento_emitido to authenticated;
grant usage, select on all sequences in schema documentos to authenticated;
grant execute on function documentos.siguiente_folio(text) to authenticated;
grant execute on function documentos.registrar_emision(text, uuid, text, text, text, text, text, text, bigint, integer, text, uuid) to authenticated;
grant execute on function documentos.anular_documento(uuid, text) to authenticated;
