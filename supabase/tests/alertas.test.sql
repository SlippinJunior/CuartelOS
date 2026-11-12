-- Alertas R01–R12: se generan y son idempotentes.
begin;
select plan(5);

select cmp_ok((select count(*)::int from nucleo.alerta), '>', 0, 'la semilla generó alertas');
select is(seguridad.generar_alertas(), 0, 'regenerar no duplica alertas');
select cmp_ok((select count(*)::int from nucleo.alerta where regla = 'R02_EGRESO_SIN_COMPROBANTE'), '>=', 1,
  'existe alerta de egreso sin comprobante');
select cmp_ok((select count(*)::int from nucleo.alerta where regla = 'R12_LISTA_SIN_CERRAR'), '>=', 1,
  'existe alerta de lista sin cerrar');
select ok((select count(*)::int from nucleo.alerta where severidad = 1) > 0, 'hay alertas de severidad alta');

select * from finish();
rollback;
