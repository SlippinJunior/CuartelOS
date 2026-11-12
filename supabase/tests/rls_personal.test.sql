-- RLS · Personal: cada bombero ve lo propio; la oficialidad ve todo.
begin;
select plan(8);

select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.bombero_persona', (select persona_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.director_persona', (select persona_id::text from seguridad.usuario where email = 'director@demo.local'), true);

-- 1. El bombero ve exactamente su propia ficha
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select is((select count(*)::int from personal.persona), 1, 'bombero ve solo su persona');
select is((select id::text from personal.persona), current_setting('test.bombero_persona'), 'bombero ve su propio id');
reset role;

-- 2. La oficialidad ve a todas las personas
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
set local role authenticated;
select cmp_ok((select count(*)::int from personal.persona), '>=', 30, 'director ve a toda la compañía');
select cmp_ok((select count(*)::int from personal.cargo_periodo), '>=', 10, 'director ve los cargos');
reset role;

-- 3. No se leen datos sensibles por tabla directa
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select throws_ok('select * from personal.persona_dato_sensible', '42501', null,
  'bombero no puede leer la tabla de datos sensibles directamente');
reset role;

-- 4. La lectura auditada funciona para la oficialidad y deja registro
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
set local role authenticated;
select ok((personal.leer_dato_sensible(current_setting('test.director_persona')::uuid)).persona_id is not null,
  'director lee el dato sensible mediante RPC');
reset role;

select is((select count(*)::int from seguridad.auditoria
           where accion = 'SELECT' and tabla = 'persona_dato_sensible'), 1,
  'la lectura sensible quedó auditada');

-- 5. El bombero no puede leer el dato sensible de otra persona
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select throws_ok(
  format('select personal.leer_dato_sensible(%L)', current_setting('test.director_persona')),
  '42501', null, 'bombero no puede leer datos sensibles ajenos');
reset role;

select * from finish();
rollback;
