-- Secretaria: permisos, actas aprobadas y RPCs de Secretaria.
begin;
select plan(22);

select set_config('test.secretario', (select u.user_id::text from seguridad.usuario u where u.email = 'secretario@demo.local'), true);
select set_config('test.bombero', (select u.user_id::text from seguridad.usuario u where u.email = 'bombero@demo.local'), true);
select set_config('test.capitan', (select u.user_id::text from seguridad.usuario u where u.email = 'capitan@demo.local'), true);
select set_config('test.prosecretario', (select u.user_id::text from seguridad.usuario u where u.email = 'prosecretario@demo.local'), true);
select set_config('test.director', (select u.user_id::text from seguridad.usuario u where u.email = 'director@demo.local'), true);

-- 1. El bombero ve las actas aprobadas
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select cmp_ok(
  (select count(*)::int from secretaria.acta where aprobada_en_acta_id is not null),
  '>=', 1,
  'el bombero ve las actas aprobadas'
);

-- 2. El bombero no ve los borradores
select is(
  (select count(*)::int from secretaria.acta where aprobada_en_acta_id is null),
  0,
  'el bombero no ve actas en borrador'
);

-- 3. El bombero no ve correspondencia
select is((select count(*)::int from secretaria.correspondencia), 0, 'el bombero no ve correspondencia');

-- 4. El bombero no ve postulaciones
select is((select count(*)::int from personal.postulacion), 0, 'el bombero no ve postulaciones');

-- 5. El bombero no puede crear compromisos desde acuerdos
select throws_ok(
  'select secretaria.crear_compromiso_desde_acuerdo(1)',
  '42501', null, 'el bombero no crea compromisos desde acuerdos');

-- 6. El bombero no puede registrar votaciones
select throws_ok(
  $$select secretaria.registrar_votacion_postulacion(1, 'aceptada')$$,
  '42501', null, 'el bombero no registra votaciones');

reset role;

-- 7. El capitán lee acuerdos y correspondencia
select set_config('request.jwt.claim.sub', current_setting('test.capitan'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select cmp_ok((select count(*)::int from secretaria.acuerdo), '>=', 1, 'el capitán ve los acuerdos');
reset role;

-- 8. El prosecretario no puede editar un acta aprobada
select set_config(
  'test.acta_aprobada',
  (select id::text from secretaria.acta where aprobada_en_acta_id is not null order by id limit 1),
  true
);

select set_config('request.jwt.claim.sub', current_setting('test.prosecretario'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
select throws_ok(
  format($$update secretaria.acta set texto = 'Cambio no permitido' where id = %s$$,
         current_setting('test.acta_aprobada')),
  '42501', null, 'el prosecretario no edita un acta aprobada');
reset role;

-- 9. El secretario crea acta con secciones y la aprueba
select set_config('request.jwt.claim.sub', current_setting('test.secretario'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, quorum_ok, secciones) overriding system value
    values (90, 'RO', 90, 2026, current_date, true,
            '{"hora_inicio":"20:00","preside":"Director","correspondencia":"Sin novedades"}'::jsonb)$$,
  'el secretario crea un acta con secciones'
);

-- 10. Un acta aprobada queda protegida
select is(
  (select secciones ->> 'preside' from secretaria.acta where numero = 90),
  'Director',
  'las secciones se guardan'
);

update secretaria.acta set aprobada_en_acta_id = id where numero = 90;

select throws_ok(
  $$update secretaria.acta set texto = 'Intento' where numero = 90$$,
  '42501', null, 'un acta aprobada no se edita por Secretaría');

reset role;

-- 11. Compromiso desde acuerdo: crea sin duplicar
select set_config(
  'test.acuerdo',
  (select id::text from secretaria.acuerdo where monto is not null and monto > 0
    and not exists (select 1 from tesoreria.compromiso c where c.acuerdo_id = secretaria.acuerdo.id)
    order by id limit 1),
  true
);
select isnt(current_setting('test.acuerdo', true), '', 'hay un acuerdo con monto sin compromiso');

select set_config('request.jwt.claim.sub', current_setting('test.secretario'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('test.compromiso_1', secretaria.crear_compromiso_desde_acuerdo(current_setting('test.acuerdo')::bigint)::text, true);
select set_config('test.compromiso_2', secretaria.crear_compromiso_desde_acuerdo(current_setting('test.acuerdo')::bigint)::text, true);

select is(
  current_setting('test.compromiso_2'),
  current_setting('test.compromiso_1'),
  'no se duplica el compromiso'
);

reset role;

-- 12. Votación: rechazo fija 6 meses de espera
select set_config('request.jwt.claim.sub', current_setting('test.secretario'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$insert into personal.postulacion (nombres, apellido_paterno, rut)
    values ('Postulante', 'Rechazado', '11111111-1')$$,
  'se crea una postulación'
);

select set_config('test.post_rechazo', (select id::text from personal.postulacion where rut = '11111111-1'), true);

select lives_ok(
  format($$select secretaria.registrar_votacion_postulacion(%s, 'rechazada', current_date)$$,
         current_setting('test.post_rechazo')),
  'se registra el rechazo'
);

reset role;

select is(
  (select puede_repostular_desde from personal.postulacion where id = current_setting('test.post_rechazo')::bigint),
  (current_date + interval '6 months')::date,
  'el rechazo deja 6 meses de espera'
);

-- 13. Votación aceptada + incorporación como aspirante
select set_config('request.jwt.claim.sub', current_setting('test.secretario'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok(
  $$insert into personal.postulacion (nombres, apellido_paterno, rut)
    values ('Postulante', 'Aceptado', '22222222-2')$$,
  'se crea la segunda postulación'
);

select set_config('test.post_aceptada', (select id::text from personal.postulacion where rut = '22222222-2'), true);

select lives_ok(
  format($$select secretaria.registrar_votacion_postulacion(%s, 'aceptada', current_date)$$,
         current_setting('test.post_aceptada')),
  'se registra la aceptación'
);

select lives_ok(
  format('select secretaria.incorporar_aspirante(%s, %s)',
         current_setting('test.post_aceptada'), 9991),
  'se incorpora como aspirante'
);

reset role;

select is(
  (select rango::text from personal.persona where registro = 9991),
  'aspirante',
  'la persona creada tiene rango aspirante'
);

select throws_ok(
  format('select secretaria.prorrogar_aspirante(%s, %L::date, %L)',
         current_setting('test.post_aceptada'),
         (current_date + interval '10 months')::date,
         'Motivo'),
  '42501', null,
  'solo Capitán, Director o admin autorizan la prórroga'
);

select set_config('request.jwt.claim.sub', current_setting('test.capitan'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_like(
  format('select secretaria.prorrogar_aspirante(%s, %L::date, %L)',
         current_setting('test.post_aceptada'),
         (current_date + interval '10 months')::date,
         'Motivo'),
  '%no superar 3 meses%',
  'la prórroga no puede superar 3 meses'
);

select * from finish();
rollback;
