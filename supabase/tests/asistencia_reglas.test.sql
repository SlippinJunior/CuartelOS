-- Reglas de asistencia: lista cerrada protegida y corrección con motivo.
begin;
select plan(6);

select set_config('test.ayudante', (select user_id::text from seguridad.usuario where email = 'ayudante@demo.local'), true);
select set_config('request.jwt.claim.sub', current_setting('test.ayudante'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Lista enviada y una marca existente
select set_config('test.lista', (select id::text from asistencia.lista where estado = 'enviada' order by id limit 1), true);
select set_config('test.persona', (select persona_id::text from asistencia.asistencia
                                    where lista_id = current_setting('test.lista')::bigint limit 1), true);

set local role authenticated;
select throws_ok(
  format('update asistencia.asistencia set marca = %L where lista_id = %s and persona_id = %L',
         'F', current_setting('test.lista'), current_setting('test.persona')),
  '42501', null, 'no se edita una lista cerrada sin motivo');

select lives_ok(
  format('select asistencia.corregir_marca(%s, %L, %L, %L)',
         current_setting('test.lista'), current_setting('test.persona'), 'F', 'Corrección de prueba'),
  'se corrige con motivo');

select is(
  (select marca::text from asistencia.asistencia
    where lista_id = current_setting('test.lista')::bigint
      and persona_id = current_setting('test.persona')::uuid),
  'F', 'la marca quedó corregida');

-- Cerrar la lista borrador
select lives_ok('select asistencia.cerrar_lista(40)', 'se cierra la lista borrador');
select is((select estado::text from asistencia.lista where id = 40), 'cerrada', 'la lista quedó cerrada');

select throws_ok(
  $$insert into asistencia.lista (compania_id, anio, numero, fecha, tipo_acto_clave, es_abono)
    values (1, 2026, 999, '2026-11-12', 'RO', true)$$,
  '23514', null, 'una lista de abono exige justificación');
reset role;

select * from finish();
rollback;
