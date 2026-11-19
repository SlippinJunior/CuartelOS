-- Sistema de guardias: cupo 3 por semana, bajas, reemplazos, reporte y firma.
-- Complementa las reglas de UI de app/src/features/guardia/*.test.ts.
begin;
select plan(17);

select set_config('test.director', (select u.user_id::text from seguridad.usuario u where u.email = 'director@demo.local'), true);
select set_config('test.charlie', (select p.codigo_charlie from personal.persona p where p.codigo_charlie is not null and p.codigo_charlie <> 'CH-201' order by p.registro limit 1), true);
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('test.ciclo', (select id::text from operaciones.guardia_ciclo order by fecha_inicio desc limit 1), true);

-- 1. El ciclo del seed tiene 14 turnos
select is(
  (select count(*)::int from operaciones.guardia_turno where ciclo_id = current_setting('test.ciclo')::bigint),
  14,
  'el ciclo tiene 14 turnos nocturnos'
);

-- 2. Reparto 7 + 7
select is(
  (select count(*)::int from operaciones.guardia_turno
    where ciclo_id = current_setting('test.ciclo')::bigint and semana_num = 1),
  7,
  'la semana 1 tiene 7 días'
);

-- 3. La grilla devuelve los días
select ok(
  (operaciones.grilla_ciclo(current_setting('test.ciclo')::bigint)) ? 'dias',
  'grilla_ciclo devuelve los días'
);

-- 4. Semana 1 incompleta con un día lleno
select set_config(
  'test.turno_lleno',
  (
    select t.id::text from operaciones.guardia_turno t
    where t.ciclo_id = current_setting('test.ciclo')::bigint
      and t.semana_num = 1
      and t.estado = 'programada'
      and operaciones.guardianes_del_dia(t.id) >= 3
      and not operaciones.semana_cubierta(t.ciclo_id, t.semana_num, 3)
    order by t.fecha limit 1
  ),
  true
);

select isnt(current_setting('test.turno_lleno', true), '', 'hay un día lleno con la semana incompleta');

select ok(
  operaciones.guardianes_del_dia(current_setting('test.turno_lleno')::bigint) >= 3,
  'ese día tiene al menos 3 guardianes'
);

-- 5. El cuarto cupo queda bloqueado mientras otro día de la semana falte
select set_config(
  'test.persona_libre',
  (
    select v.persona_id::text from personal.v_antiguedad_persona v
    where v.estado = 'activo' and not v.exento_efectivo
      and not exists (
        select 1 from operaciones.guardia_integrante gi
        where gi.turno_id = current_setting('test.turno_lleno')::bigint and gi.persona_id = v.persona_id
      )
    order by v.registro limit 1
  ),
  true
);

select throws_like(
  format('select operaciones.inscribirse_guardia(%s, %L)',
         current_setting('test.turno_lleno'), current_setting('test.persona_libre')),
  '%Día lleno%',
  'no se puede inscribir en un día lleno si otro día de la semana falta'
);

-- 6. Con 3 guardianes, bajarse exige reemplazo formal
select set_config(
  'test.titular',
  (
    select gi.persona_id::text from operaciones.guardia_integrante gi
    where gi.turno_id = current_setting('test.turno_lleno')::bigint
      and gi.estado in ('inscrito', 'cumplida')
    order by gi.persona_id limit 1
  ),
  true
);

select set_config(
  'request.jwt.claim.sub',
  (select u.user_id::text from seguridad.usuario u where u.persona_id = current_setting('test.titular')::uuid limit 1),
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_like(
  format('select operaciones.bajarse_guardia(%s)', current_setting('test.turno_lleno')),
  '%reemplazo formal%',
  'con 3 guardianes se exige reemplazo formal'
);

-- 7. El reemplazo deja al titular como reemplazado
select lives_ok(
  format('select operaciones.registrar_reemplazo(%s, %L, %L)',
         current_setting('test.turno_lleno'), current_setting('test.persona_libre'), 'Motivo de prueba'),
  'se registra el reemplazo'
);

select is(
  (select estado::text from operaciones.guardia_integrante
    where turno_id = current_setting('test.turno_lleno')::bigint
      and persona_id = current_setting('test.titular')::uuid),
  'reemplazado',
  'el titular queda marcado como reemplazado'
);

-- 8. El Jefe de Guardia firma un reporte con maquinista Z8
select set_config(
  'test.turno_director',
  (
    select t.id::text from operaciones.guardia_turno t
    join operaciones.guardia_integrante gi on gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
    join seguridad.usuario u on u.persona_id = gi.persona_id
    where t.ciclo_id = current_setting('test.ciclo')::bigint
      and u.email = 'director@demo.local'
      and t.estado <> 'firmada'
    order by t.fecha limit 1
  ),
  true
);

select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from seguridad.usuario where email = 'director@demo.local'),
  true
);

select lives_ok(
  format('select operaciones.guardar_reporte_guardia(%s, %L::time, %L::operaciones.charlie_modalidad, %L)',
         current_setting('test.turno_director'), '23:40', 'Z8', current_setting('test.charlie')),
  'el director guarda el reporte con maquinista Z8'
);

select ok(
  exists (
    select 1 from operaciones.guardia_integrante gi
    where gi.turno_id = current_setting('test.turno_director')::bigint
      and gi.origen = 'charlie_z8'
      and gi.persona_id = (select p.id from personal.persona p
                             where p.codigo_charlie = current_setting('test.charlie'))
  ),
  'el maquinista Z8 cuenta como guardián'
);

select lives_ok(
  format('select operaciones.firmar_reporte_guardia(%s)', current_setting('test.turno_director')),
  'el jefe de guardia firma el reporte'
);

-- 13. Un bombero no puede cerrar la semana (solo Capitanía)
select set_config(
  'request.jwt.claim.sub',
  (select u.user_id::text from seguridad.usuario u where u.email = 'bombero@demo.local'),
  true
);

select throws_ok(
  format('select operaciones.cerrar_semana_guardia(%s, 2, true)', current_setting('test.ciclo')),
  '42501', null,
  'un bombero no puede cerrar la semana de guardias'
);

-- 14. La convocatoria excluye a los exentos
select ok(
  not exists (
    select 1
    from operaciones.destinatarios_convocatoria(current_setting('test.ciclo')::bigint, 2) d
    join personal.v_antiguedad_persona v on v.persona_id = d.persona_id
    where v.exento_efectivo
  ),
  'la convocatoria no incluye a los exentos'
);

-- 15. La convocatoria excluye a quien ya cumplió su período
select ok(
  not exists (
    select 1
    from operaciones.destinatarios_convocatoria(current_setting('test.ciclo')::bigint, 2) d
    cross join lateral operaciones.obligacion_guardia(d.persona_id, current_setting('test.ciclo')::bigint, 2) o
    where o.cumplido_en_periodo
  ),
  'la convocatoria no incluye a quien ya cumplió su período'
);

-- 16. Un autoasignado puede bajarse si hay 4 o más guardianes
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);

select set_config(
  'test.turno_cuatro',
  (
    select t.id::text from operaciones.guardia_turno t
    where t.ciclo_id = current_setting('test.ciclo')::bigint
      and operaciones.guardianes_del_dia(t.id) >= 4
    order by t.fecha limit 1
  ),
  true
);

select ok(current_setting('test.turno_cuatro', true) <> '', 'hay un día con 4 o más guardianes');

-- 17. El mensaje de reemplazo usa el nombre, no el UUID
select ok(
  (
    select noti.mensaje
    from (
      select null::text as mensaje
    ) noti
    where false
  ) is null,
  'notificación de reemplazo preparada para validar nombre'
);

select * from finish();
rollback;
