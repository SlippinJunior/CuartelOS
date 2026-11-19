-- Antigüedad de servicio: premios + abonos, ajuste manual y exenciones.
begin;
select plan(14);

-- 1. La vista calcula desde premios de constancia + abonos
select is(
  (select anios_servicio::int from personal.v_antiguedad_persona where registro = 203),
  (select (max(pp.anios) + coalesce((select sum(a.anios) from personal.antiguedad_abono a where a.persona_id = p.id), 0))::int
     from personal.persona p
     left join personal.persona_premio pp on pp.persona_id = p.id
     where p.registro = 203
     group by p.id),
  'anios_servicio suma premios de constancia y abonos'
);

-- 2. Origen calculado cuando no hay ajuste manual
select is(
  (select origen_antiguedad from personal.v_antiguedad_persona where registro = 203),
  'calculado',
  'sin ajuste manual el origen es calculado'
);

-- 3. Categorías de la Orden 01/2026
select is(personal.categoria_guardia_de(3, date '1990-01-01', false), '0_4', '0 a 4 años');
select is(personal.categoria_guardia_de(7, date '1990-01-01', false), '5_9', '5 a 9 años');
select is(personal.categoria_guardia_de(15, date '1990-01-01', false), '10_19', '10 a 19 años');
select is(personal.categoria_guardia_de(25, date '1990-01-01', false), '20_34', '20 a 34 años');
select is(personal.categoria_guardia_de(10, date '1950-01-01', false), 'exento', '60 años exime');
select is(personal.categoria_guardia_de(35, date '1990-01-01', false), 'exento', '35 años de servicio eximen');
select is(personal.categoria_guardia_de(10, date '1990-01-01', true), 'exento', 'exención manual');

-- Exención automática por edad (60 años) sin bandera manual, sobre una persona creada al efecto
select lives_ok(
  $$insert into personal.persona (compania_id, registro, nombres, apellido_paterno, fecha_nacimiento)
    values (1, 9990, 'Prueba', 'Mayor', current_date - interval '65 years')$$,
  'se crea un bombero de 65 años'
);

select is(
  (select exento_efectivo from personal.v_antiguedad_persona where registro = 9990),
  true,
  'un bombero de más de 60 años queda exento automáticamente'
);

select is(
  (select categoria_guardia from personal.v_antiguedad_persona where registro = 9990),
  'exento',
  'su categoría de guardia es exento'
);

-- Exención automática por 35 años de servicio
select is(
  personal.categoria_guardia_de(35, date '1990-01-01', false),
  'exento',
  '35 años de servicio eximen'
);

-- El ajuste manual también cuenta para la exención por antigüedad
select ok(
  exists (
    select 1
    from personal.v_antiguedad_persona v
    where v.anios_servicio_manual >= 35
      and v.exento_efectivo
  ),
  'la antigüedad manual de 35 años o más exime'
);

select * from finish();
rollback;
