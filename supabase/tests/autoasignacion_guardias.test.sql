-- Autoasignacion al cierre de la semana: dia con menos guardianes, empates al azar.
begin;
select plan(13);

select set_config('test.ciclo', (select id::text from operaciones.guardia_ciclo order by fecha_inicio desc limit 1), true);
select set_config('request.jwt.claim.sub', (select u.user_id::text from seguridad.usuario u where u.email = 'director@demo.local'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- 1. El ciclo tiene dias bajo el cupo antes de cerrar
select cmp_ok(
  (select count(*)::int from operaciones.guardia_turno t
    where t.ciclo_id = current_setting('test.ciclo')::bigint
      and operaciones.guardianes_del_dia(t.id) < 3),
  '>', 0,
  'hay dias bajo el cupo antes de cerrar'
);

-- 2. Hay bomberos activos no exentos sin participacion en la semana 2
select cmp_ok(
  (select count(*)::int from operaciones.pendientes_de_semana(
     current_setting('test.ciclo')::bigint, 2)),
  '>', 0,
  'hay bomberos pendientes de inscripcion'
);

-- 3. Los pendientes no estan exentos
select ok(
  not exists (
    select 1
    from operaciones.pendientes_de_semana(current_setting('test.ciclo')::bigint, 2) p
    join personal.v_antiguedad_persona v on v.persona_id = p.persona_id
    where v.exento_efectivo
  ),
  'los exentos no entran en la asignacion'
);

-- 4. La semana 1 se cierra el dia previo a su inicio
select is(
  (operaciones.estado_cierre_semana(current_setting('test.ciclo')::bigint, 1) ->> 'vence'),
  ((select fecha_inicio::text from operaciones.guardia_ciclo
     where id = current_setting('test.ciclo')::bigint)::date - 1)::text,
  'la semana 1 se cierra el dia previo a su inicio'
);

-- 5. La semana 2 se cierra el domingo previo a su inicio
select is(
  (operaciones.estado_cierre_semana(current_setting('test.ciclo')::bigint, 2) ->> 'vence'),
  ((select fecha_inicio + 6 from operaciones.guardia_ciclo
     where id = current_setting('test.ciclo')::bigint))::text,
  'la semana 2 se cierra el domingo previo'
);

-- 6. Cerrar la semana asigna a todos los pendientes
select is(
  operaciones.cerrar_semana_guardia(current_setting('test.ciclo')::bigint, 2, true),
  (select count(*)::int from operaciones.pendientes_de_semana(
     current_setting('test.ciclo')::bigint, 2)),
  'la asignacion automatica cubre a todos los pendientes'
);

select is(
  (select count(*)::int from operaciones.pendientes_de_semana(
     current_setting('test.ciclo')::bigint, 2)),
  0,
  'ya no quedan pendientes en la semana 2'
);

-- 7. Ninguno queda con mas de un dia en la semana
select is(
  (
    select count(*)::int from (
      select gi.persona_id
      from operaciones.guardia_integrante gi
      join operaciones.guardia_turno t on t.id = gi.turno_id
      where t.ciclo_id = current_setting('test.ciclo')::bigint
        and t.semana_num = 2
        and gi.origen = 'autoasignacion'
      group by gi.persona_id
      having count(*) > 1
    ) repetidos
  ),
  0,
  'cada bombero asignado queda en un solo dia'
);

-- 8. El reparto deja los dias equilibrados
select cmp_ok(
  (select max(operaciones.guardianes_del_dia(t.id)) - min(operaciones.guardianes_del_dia(t.id))
     from operaciones.guardia_turno t
    where t.ciclo_id = current_setting('test.ciclo')::bigint and t.semana_num = 2),
  '<=', 1,
  'el reparto deja los dias equilibrados'
);

-- 9. Solo se asigno a quienes les vence en la semana (no a todos los activos)
select ok(
  (select count(*)::int from operaciones.pendientes_de_semana(
     current_setting('test.ciclo')::bigint, 2)) = 0,
  'solo se asigna a quienes les vence la obligacion esta semana'
);

select ok(
  (select count(*)::int from personal.v_antiguedad_persona v
    where v.estado = 'activo'
      and not v.exento_efectivo) >
  (select count(*)::int from operaciones.guardia_integrante gi
    join operaciones.guardia_turno t on t.id = gi.turno_id
    where t.ciclo_id = current_setting('test.ciclo')::bigint
      and t.semana_num = 2
      and gi.origen = 'autoasignacion'),
  'no se asigna a todos los activos, solo a los que deben guardia'
);

-- 10. Cada asignado recibe un aviso in-app
select cmp_ok(
  (select count(*)::int from operaciones.guardia_notificacion n
    where n.tipo = 'convocatoria_semana'
      and n.mensaje like 'Fuiste asignado autom%'),
  '>=', 1,
  'los asignados reciben un aviso'
);

-- 11. Un segundo cierre no duplica asignaciones
select is(
  operaciones.cerrar_semana_guardia(current_setting('test.ciclo')::bigint, 2, true),
  0,
  'cerrar de nuevo no asigna a nadie mas'
);

select * from finish();
rollback;
