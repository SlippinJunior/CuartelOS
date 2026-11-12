-- =====================================================================
-- 20261112001700 · Permisos del rol de servicio
-- =====================================================================
-- El rol `service_role` omite RLS, pero en esquemas propios igual necesita
-- USAGE y privilegios de tabla. Lo usan las Edge Functions y pg_cron.
-- =====================================================================
grant usage on schema extensions to service_role;

grant usage on schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

grant select, insert, update, delete on all tables in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

grant usage, select on all sequences in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

grant execute on all functions in schema
  nucleo, personal, asistencia, operaciones, material,
  tesoreria, secretaria, disciplina, documentos
to service_role;

-- Funciones internas: solo el rol de servicio puede ejecutar generar_alertas.
grant usage on schema seguridad to service_role;
grant execute on function seguridad.generar_alertas() to service_role;
