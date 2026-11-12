-- =====================================================================
-- 20261112000000 · Extensiones, esquemas y utilidades
-- ERP Segunda Compañía · un esquema por dominio
-- =====================================================================
-- Nota: Supabase ya instala pgcrypto/unaccent en el esquema `extensions`.
--       La creación es idempotente para que el mismo archivo sirva en
--       PostgreSQL local (supabase db reset) y en la nube.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists btree_gist with schema extensions;

create schema if not exists nucleo;
create schema if not exists seguridad;
create schema if not exists personal;
create schema if not exists asistencia;
create schema if not exists operaciones;
create schema if not exists material;
create schema if not exists tesoreria;
create schema if not exists secretaria;
create schema if not exists disciplina;
create schema if not exists documentos;

comment on schema nucleo      is 'Configuración de la compañía, parámetros, feriados, contrapartes, alertas e importación.';
comment on schema seguridad   is 'Usuarios, roles, consentimiento y auditoría. No se expone a la API: solo mediante RPC.';
comment on schema personal    is 'Personas, cargos, formación, premios, situaciones especiales y datos sensibles.';
comment on schema asistencia  is 'Tipos de acto, listas y marcas de asistencia.';
comment on schema operaciones is 'Órdenes de capitanía, guardias y accidentes en acto de servicio.';
comment on schema material    is 'Material mayor y menor, ubicaciones físicas y revisiones.';
comment on schema tesoreria   is 'Cuentas, fondos, presupuesto, movimientos, compromisos, proyecciones y campañas.';
comment on schema secretaria  is 'Actas, acuerdos, correspondencia, elecciones y traspasos de cargo.';
comment on schema disciplina  is 'Expedientes reservados del Consejo de Disciplina (art. 125 B 25).';
comment on schema documentos  is 'Archivos, tipos de documento P1–P23, folios y emisiones con verificación pública.';

-- ---------------------------------------------------------------------
-- Utilidades transversales
-- ---------------------------------------------------------------------
create or replace function nucleo.normalizar(p_texto text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(extensions.unaccent(coalesce(p_texto, '')))
$$;
comment on function nucleo.normalizar(text) is 'Minúsculas sin tildes, para búsquedas por nombre.';

-- La función se usa en índices y políticas: los roles de API necesitan el esquema.
grant usage on schema extensions to anon, authenticated;
grant execute on function nucleo.normalizar(text) to anon, authenticated;

create or replace function nucleo.actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end
$$;
comment on function nucleo.actualizado_en() is 'Trigger genérico: mantiene actualizado_en.';

-- Marca de tiempo de la transacción, útil en triggers de auditoría.
create or replace function nucleo.periodo_de(p_fecha date)
returns date
language sql
immutable
as $$ select date_trunc('month', p_fecha)::date $$;
comment on function nucleo.periodo_de(date) is 'Primer día del mes de una fecha.';
