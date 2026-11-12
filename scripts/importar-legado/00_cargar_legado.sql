-- Prepara el esquema temporal `legado`.
-- Se elimina cualquier intento anterior para que la importación sea repetible.
drop schema if exists legado cascade;

do $$
begin
  if exists (select 1 from personal.persona) then
    raise warning 'La base destino ya tiene personas: la importación puede fallar por duplicados.';
  end if;
end
$$;
