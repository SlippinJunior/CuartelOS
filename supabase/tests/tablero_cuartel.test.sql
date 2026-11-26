-- =====================================================================
-- Pruebas pgTAP · Tablero de Cuartel, rol cuartel y despachos
-- =====================================================================
begin;
select plan(13);

-- Crear usuarios de prueba: cuartel, teniente_1, secretario, bombero
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pgtap-cuartel@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'pgtap-t1@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'pgtap-sec@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'pgtap-bomb@demo.local')
on conflict (id) do nothing;

insert into personal.persona (id, compania_id, registro, nombres, apellido_paterno, estado) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 1, 902, 'Teniente', 'Uno', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 1, 903, 'Secretario', 'Cia', 'activo'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 1, 904, 'Bombero', 'Raso', 'activo')
on conflict (id) do nothing;

insert into seguridad.usuario (user_id, persona_id, email, activo) values
  ('aaaaaaaa-0000-0000-0000-000000000001', null, 'pgtap-cuartel@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'pgtap-t1@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000003', 'pgtap-sec@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000004', 'pgtap-bomb@demo.local', true)
on conflict (user_id) do nothing;

insert into seguridad.usuario_rol (user_id, rol, desde) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cuartel', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'teniente_1', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'secretario', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'bombero', '2026-01-01')
on conflict do nothing;

-- 1-3: Teniente 1° puede publicar orden_dia, no circular; Secretario puede publicar circular y citacion
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000002', true);
select lives_ok(
  $$insert into operaciones.orden_dia (numero, anio, fecha, titulo, texto) values (9901, 2026, '2026-11-26', 'Orden prueba', 'Texto de prueba')$$,
  'Teniente 1 puede crear orden del día'
);
select throws_ok(
  $$insert into secretaria.circular (origen, numero, anio, fecha, titulo) values ('cbl', '9901', 2026, '2026-11-26', 'Circular no')$$,
  '42501', null,
  'Teniente 1 NO puede crear circulares'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000003', true);
select lives_ok(
  $$insert into secretaria.circular (origen, numero, anio, fecha, titulo) values ('cbl', '9902', 2026, '2026-11-26', 'Circular CBL prueba')$$,
  'Secretario puede crear circular CBL'
);
select lives_ok(
  $$insert into secretaria.citacion (numero, anio, fecha_evento, hora_evento, lugar, titulo) values (9902, 2026, '2026-11-29', '20:00', 'Cuartel', 'Citación prueba')$$,
  'Secretario puede crear citación'
);

-- 4-11: Usuario cuartel solo lee el tablero y está completamente aislado de datos privados
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select is(
  (nucleo.mi_perfil() ->> 'es_cuartel')::boolean,
  true,
  'mi_perfil reconoce es_cuartel = true'
);
select is(
  (nucleo.mi_perfil() -> 'consentimiento' ->> 'aceptado')::boolean,
  true,
  'Cuenta cuartel no queda bloqueada por consentimiento individual'
);
select ok(
  jsonb_array_length(nucleo.tablero_cuartel() -> 'publicaciones') >= 3,
  'Usuario cuartel lee las publicaciones del tablero'
);
select is(
  (select count(*) from personal.persona),
  0::bigint,
  'Usuario cuartel no ve personal.persona'
);
select is(
  (select count(*) from tesoreria.movimiento),
  0::bigint,
  'Usuario cuartel no ve tesoreria.movimiento'
);
select is(
  (select count(*) from material.panol_stock),
  0::bigint,
  'Usuario cuartel no ve material.panol_stock'
);
select is(
  (select count(*) from asistencia.lista),
  0::bigint,
  'cuartel no puede leer asistencia.lista'
);
select throws_ok(
  $$insert into operaciones.orden_dia (numero, anio, fecha, titulo, texto) values (9909, 2026, '2026-11-26', 'No', 'No')$$,
  '42501', null,
  'Usuario cuartel NO puede publicar en el tablero'
);

-- 12: Bombero no puede publicar citaciones
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000004', true);
select throws_ok(
  $$insert into secretaria.citacion (numero, anio, fecha_evento, hora_evento, lugar, titulo) values (9909, 2026, '2026-11-29', '20:00', 'Cuartel', 'No')$$,
  '42501', null,
  'Bombero raso NO puede crear citaciones'
);

select * from finish();
rollback;
