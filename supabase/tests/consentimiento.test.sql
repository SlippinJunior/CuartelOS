-- Consentimiento informado: se exige antes de usar el sistema.
begin;
select plan(5);

select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select is((nucleo.mi_perfil()->'consentimiento'->>'aceptado')::boolean, false,
  'el bombero demo parte sin consentimiento');
select is((nucleo.mi_perfil()->'consentimiento'->>'version')::int, 1,
  'se informa la versión vigente');

select lives_ok('select nucleo.aceptar_consentimiento()', 'acepta el consentimiento');
select is((nucleo.mi_perfil()->'consentimiento'->>'aceptado')::boolean, true,
  'el consentimiento queda aceptado');
reset role;

select is((select count(*)::int from seguridad.consentimiento c
           join seguridad.usuario u on u.user_id = c.usuario_id
           where u.email = 'bombero@demo.local'), 1,
  'queda un registro de consentimiento');

select * from finish();
rollback;
