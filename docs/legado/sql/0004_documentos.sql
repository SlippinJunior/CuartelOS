-- =====================================================================
-- 0004 · Documentos emitidos: folio correlativo y verificación por QR
-- =====================================================================
set search_path = gestion, public;

create table documento_emitido (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,                  -- HOJA_VIDA, CERT_ANTIGUEDAD, CUENTA_MENSUAL, ACTA, CITACION, NOMINA_PREMIOS
  anio int not null default extract(year from current_date),
  folio int not null,
  persona_id uuid references persona(id),
  referencia text,                     -- id de la entidad documentada
  hash_sha256 text not null,           -- huella del PDF emitido
  token_verificacion text not null unique default encode(gen_random_bytes(12), 'hex'),
  pdf_path text not null,
  emitido_por uuid default auth.uid(),
  emitido_en timestamptz not null default now(),
  anulado boolean not null default false,
  unique (tipo, anio, folio)
);
alter table documento_emitido enable row level security;
create policy doc_lectura on documento_emitido for select using (es_oficial() or persona_id = mi_persona());
create policy doc_emitir  on documento_emitido for insert with check (es_oficial());
create trigger aud_documento_emitido after insert or update or delete on documento_emitido for each row execute function fn_auditar();

-- Folio correlativo por tipo y año, sin saltos aunque haya emisiones simultáneas
create table folio_contador (tipo text, anio int, ultimo int not null default 0, primary key (tipo, anio));
alter table folio_contador enable row level security;

create or replace function siguiente_folio(p_tipo text) returns int
language plpgsql security definer set search_path = gestion, public as $$
declare v int;
begin
  if not es_oficial() then raise exception 'Sin permiso para emitir documentos'; end if;
  insert into folio_contador(tipo, anio, ultimo) values (p_tipo, extract(year from current_date), 1)
  on conflict (tipo, anio) do update set ultimo = folio_contador.ultimo + 1
  returning ultimo into v;
  return v;
end $$;

-- Verificación pública: devuelve solo lo mínimo, sin datos personales sensibles
create or replace function verificar_documento(p_token text)
returns table (tipo text, folio text, emitido_en timestamptz, valido boolean)
language sql stable security definer set search_path = gestion, public as $$
  select d.tipo, d.anio || '-' || lpad(d.folio::text, 4, '0'), d.emitido_en, not d.anulado
  from documento_emitido d where d.token_verificacion = p_token $$;
grant execute on function verificar_documento(text) to anon;
