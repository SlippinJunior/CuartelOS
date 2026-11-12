-- RLS · Tesorería: el bombero ve sus cuotas, no la cartola.
begin;
select plan(7);

select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.bombero_persona', (select persona_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.tesorero', (select user_id::text from seguridad.usuario where email = 'tesorero@demo.local'), true);

-- Bombero
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select is((select count(*)::int from tesoreria.movimiento), 0, 'bombero no ve movimientos');
select is((select count(*)::int from tesoreria.cuenta), 0, 'bombero no ve cuentas');
select ok((select count(*)::int from tesoreria.cuota_pago) > 0, 'bombero ve sus cuotas');
select is((select count(*)::int from tesoreria.cuota_pago where persona_id <> current_setting('test.bombero_persona')::uuid), 0,
  'bombero no ve cuotas ajenas');
select throws_ok(
  $$insert into tesoreria.movimiento (fecha, tipo, cuenta_id, categoria_id, monto, glosa)
    values (current_date, 'egreso', 1, 5, 1000, 'Intento sin permiso')$$,
  '42501', null, 'bombero no puede registrar movimientos');
reset role;

-- Tesorero
select set_config('request.jwt.claim.sub', current_setting('test.tesorero'), true);
set local role authenticated;
select cmp_ok((select count(*)::int from tesoreria.movimiento), '>=', 40, 'tesorero ve la cartola');
select is((select count(*)::int from tesoreria.fn_proyeccion(6, null)), 6, 'tesorero obtiene proyección de 6 meses');
reset role;

select * from finish();
rollback;
