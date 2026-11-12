-- Reglas de tesorería: no borrar, período cerrado y anulación con motivo.
begin;
select plan(6);

select set_config('test.tesorero', (select user_id::text from seguridad.usuario where email = 'tesorero@demo.local'), true);

-- Como owner: el trigger impide borrar
select throws_ok('delete from tesoreria.movimiento where id = 1', '42501',
  'Los movimientos no se eliminan: anúlelos indicando el motivo.',
  'un movimiento no se elimina');

-- Como tesorero: período cerrado
select set_config('request.jwt.claim.sub', current_setting('test.tesorero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok(
  $$insert into tesoreria.movimiento (fecha, tipo, cuenta_id, categoria_id, monto, glosa)
    values ('2026-09-20', 'egreso', 1, 5, 1000, 'Movimiento en período cerrado')$$,
  '42501', null, 'no se registra un movimiento en un período cerrado');

-- Anulación
select throws_ok(
  $$update tesoreria.movimiento set anulado = true where id = 2$$,
  '23514', null, 'anular sin motivo viola la restricción');
select lives_ok(
  $$update tesoreria.movimiento set anulado = true, motivo_anulacion = 'Error de digitación' where id = 2$$,
  'anular con motivo funciona');
reset role;

select is((select anulado from tesoreria.movimiento where id = 2), true, 'el movimiento quedó anulado');
select is((select count(*)::int from tesoreria.movimiento where id = 2), 1, 'el movimiento sigue existiendo');

select * from finish();
rollback;
