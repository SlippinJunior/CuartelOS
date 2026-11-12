-- Cuotas: el pago crea el movimiento de cartola y se puede anular.
begin;
select plan(7);

select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config(
  'test.persona',
  (select persona_id::text from tesoreria.fn_cuotas_estado(2026) where estado = 'pendiente' limit 1),
  true
);
select set_config(
  'test.periodo',
  (select periodo::text from tesoreria.fn_cuotas_estado(2026) where estado = 'pendiente' limit 1),
  true
);

select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  format(
    'select tesoreria.registrar_pago_cuota(%L, %L, %L, %L, %L, %L, %L)',
    current_setting('test.persona'),
    current_setting('test.periodo'),
    3000,
    current_date,
    'transferencia',
    'TEST-001',
    'Pago de prueba'
  ),
  'se registra el pago de la cuota'
);

select is(
  (select count(*)::int from tesoreria.cuota_pago
    where persona_id = current_setting('test.persona')::uuid
      and periodo = current_setting('test.periodo')::date
      and not anulada),
  1,
  'la cuota queda pagada'
);

select ok(
  (select movimiento_id is not null from tesoreria.cuota_pago
    where persona_id = current_setting('test.persona')::uuid
      and periodo = current_setting('test.periodo')::date),
  'la cuota queda vinculada a un movimiento'
);

select is(
  (select tipo::text from tesoreria.movimiento
    where id = (select movimiento_id from tesoreria.cuota_pago
                 where persona_id = current_setting('test.persona')::uuid
                   and periodo = current_setting('test.periodo')::date)),
  'ingreso',
  'el movimiento de cartola es un ingreso'
);

select throws_ok(
  format('select tesoreria.registrar_pago_cuota(%L, %L)',
         current_setting('test.persona'), current_setting('test.periodo')),
  'P0001', null, 'no se permite pagar dos veces la misma cuota'
);

select lives_ok(
  format('select tesoreria.anular_pago_cuota(%s, %L)',
    (select id from tesoreria.cuota_pago
      where persona_id = current_setting('test.persona')::uuid
        and periodo = current_setting('test.periodo')::date),
    'Prueba de anulación'),
  'se anula el pago con motivo'
);

reset role;

select is(
  (select anulado from tesoreria.movimiento
    where id = (select movimiento_id from tesoreria.cuota_pago
                 where persona_id = current_setting('test.persona')::uuid
                   and periodo = current_setting('test.periodo')::date)),
  true,
  'el movimiento quedó anulado en la cartola'
);

select * from finish();
rollback;
