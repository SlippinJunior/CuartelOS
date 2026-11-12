-- Datos sensibles: propio acceso, acceso auditado de oficiales y bloqueo.
begin;
select plan(6);

select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.director_persona', (select persona_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.bombero_persona', (select persona_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);

-- El director tiene dato sensible; el bombero no.
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select ok((personal.leer_dato_sensible(current_setting('test.director_persona')::uuid)).grupo_sanguineo is not null,
  'el director lee su propio dato sensible');
reset role;

select is((select count(*)::int from seguridad.auditoria
           where accion = 'SELECT' and fila_id = current_setting('test.director_persona')), 1,
  'la lectura propia quedó auditada');

-- Escritura: el bombero puede escribir su propio dato
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select lives_ok(
  format($$insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo)
           values (%L, 'O+')$$, current_setting('test.bombero_persona')),
  'el bombero registra su propio dato sensible');
reset role;

-- Nadie sin rol oficial puede leer el de otro
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select throws_ok(
  format('select personal.leer_dato_sensible(%L)', current_setting('test.director_persona')),
  '42501', null, 'un bombero no lee datos sensibles ajenos');
select throws_ok('select * from personal.persona_dato_sensible', '42501', null,
  'la tabla no se lee directamente');
reset role;

select is((select count(*)::int from personal.persona_dato_sensible
           where persona_id = current_setting('test.bombero_persona')::uuid), 1,
  'el dato propio quedó guardado');

select * from finish();
rollback;
