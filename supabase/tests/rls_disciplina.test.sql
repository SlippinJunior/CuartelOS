-- RLS · Disciplina: solo el Consejo; el Director ve sanciones ejecutoriadas.
begin;
select plan(6);

select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.consejo', (select user_id::text from seguridad.usuario where email = 'consejo@demo.local'), true);

-- Bombero: nada
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select is((select count(*)::int from disciplina.expediente), 0, 'bombero no ve expedientes');
select is((select count(*)::int from disciplina.sancion), 0, 'bombero no ve sanciones');
reset role;

-- Director: solo sanciones ejecutoriadas
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
set local role authenticated;
select is((select count(*)::int from disciplina.expediente), 0, 'director no ve expedientes');
select cmp_ok((select count(*)::int from disciplina.sancion), '>=', 1, 'director ve sanciones ejecutoriadas');
select is((select count(*)::int from disciplina.sancion where not ejecutoriada), 0,
  'director no ve sanciones no ejecutoriadas');
reset role;

-- Consejo: todo
select set_config('request.jwt.claim.sub', current_setting('test.consejo'), true);
set local role authenticated;
select cmp_ok((select count(*)::int from disciplina.expediente), '>=', 2, 'consejo ve los expedientes');
reset role;

select * from finish();
rollback;
