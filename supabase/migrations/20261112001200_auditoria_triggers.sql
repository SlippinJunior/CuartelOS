-- =====================================================================
-- 20261112001200 · Auditoría en todas las tablas de negocio
-- =====================================================================
set search_path = seguridad, public;

do $$
declare
  r record;
  v_schema text;
begin
  for r in
    select t.schemaname, t.tablename
    from pg_tables t
    where t.schemaname in (
      'nucleo', 'personal', 'asistencia', 'operaciones',
      'material', 'tesoreria', 'secretaria', 'disciplina', 'documentos'
    )
      and not (t.schemaname = 'documentos' and t.tablename = 'folio_contador')
  loop
    execute format(
      'create trigger %I after insert or update or delete on %I.%I for each row execute function seguridad.fn_auditar()',
      'aud_' || r.tablename,
      r.schemaname,
      r.tablename
    );
  end loop;
end
$$;
