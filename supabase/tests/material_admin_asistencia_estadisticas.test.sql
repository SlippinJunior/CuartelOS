-- =====================================================================
-- Pruebas pgTAP · Permisos por módulo, Bitácora, Libro 2026 y Estadísticas
-- =====================================================================
begin;
select plan(14);

-- Usuarios de prueba: cuartel, bombero, capitan, director
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'pgtap2-cuartel@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'pgtap2-bomb@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'pgtap2-cap@demo.local'),
  ('aaaaaaaa-0000-0000-0000-000000000014', 'pgtap2-dir@demo.local')
on conflict (id) do nothing;

insert into personal.persona (id, compania_id, registro, nombres, apellido_paterno, estado, fecha_ingreso) values
  ('bbbbbbbb-0000-0000-0000-000000000012', 1, 912, 'Bombero', 'Prueba', 'activo', '2024-01-01'),
  ('bbbbbbbb-0000-0000-0000-000000000013', 1, 913, 'Capitan', 'Prueba', 'activo', '2020-01-01'),
  ('bbbbbbbb-0000-0000-0000-000000000014', 1, 914, 'Director', 'Prueba', 'activo', '2015-01-01')
on conflict (id) do nothing;

insert into seguridad.usuario (user_id, persona_id, email, activo) values
  ('aaaaaaaa-0000-0000-0000-000000000011', null, 'pgtap2-cuartel@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000012', 'pgtap2-bomb@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000013', 'pgtap2-cap@demo.local', true),
  ('aaaaaaaa-0000-0000-0000-000000000014', 'bbbbbbbb-0000-0000-0000-000000000014', 'pgtap2-dir@demo.local', true)
on conflict (user_id) do nothing;

insert into seguridad.usuario_rol (user_id, rol, desde) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'cuartel', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'bombero', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'capitan', '2026-01-01'),
  ('aaaaaaaa-0000-0000-0000-000000000014', 'director', '2026-01-01')
on conflict do nothing;

-- Datos mínimos de unidad y lista para las pruebas
insert into material.unidad (id, codigo, marca, modelo, km_actual, estado)
overriding system value
values (901, 'U-901', 'Volvo', 'Test', 50000, 'operativa')
on conflict (id) do nothing;

insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, comentarios)
overriding system value
values (9901, 1, 2026, 9901, '2026-05-10', '10-1', 'Parte prueba', 'cerrada', 'Incendio estructural controlado')
on conflict (id) do nothing;

insert into asistencia.asistencia (lista_id, persona_id, marca) values
  (9901, 'bbbbbbbb-0000-0000-0000-000000000012', 'A'),
  (9901, 'bbbbbbbb-0000-0000-0000-000000000013', 'F')
on conflict do nothing;

-- 1-3: Director configura excepciones por módulo sobre los bloques de rol
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000014', true);

select lives_ok(
  $$select nucleo.admin_definir_permiso_modulo('aaaaaaaa-0000-0000-0000-000000000012', 'material', 'gestion')$$,
  'Director puede otorgar gestión de material a un bombero'
);
select lives_ok(
  $$select nucleo.admin_definir_permiso_modulo('aaaaaaaa-0000-0000-0000-000000000013', 'estadisticas', 'ninguno')$$,
  'Director puede restringir estadísticas a un capitán'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000012', true);
select is(
  seguridad.tiene_permiso_modulo('material', 'gestion'),
  true,
  'Bombero con excepción gestion tiene acceso de gestión en material'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000013', true);
select is(
  seguridad.tiene_permiso_modulo('estadisticas', 'lectura'),
  false,
  'Excepción ninguno anula herencia de rol en estadísticas'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000014', true);
select nucleo.admin_definir_permiso_modulo('aaaaaaaa-0000-0000-0000-000000000013', 'estadisticas', null);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000013', true);
select is(
  seguridad.tiene_permiso_modulo('estadisticas', 'lectura'),
  true,
  'Eliminar excepción restaura permiso heredado del rol capitán'
);

-- 4-7: Aislamiento estricto del usuario cuartel
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000011', true);
select throws_ok(
  $$select asistencia.libro_anual(2026, null)$$,
  '42501', null,
  'Usuario cuartel no puede consultar libro_anual'
);
select throws_ok(
  $$select asistencia.detalle_parte(9901)$$,
  '42501', null,
  'Usuario cuartel no puede consultar detalle_parte'
);
select throws_ok(
  $$select nucleo.estadisticas_compania(2026)$$,
  '42501', null,
  'Usuario cuartel no puede consultar estadisticas_compania'
);
select is(
  (select count(*) from material.bitacora_unidad),
  0::bigint,
  'Usuario cuartel ve 0 filas en material.bitacora_unidad'
);

-- 8-9: Bitácora actualiza km_actual solo cuando el nuevo km es mayor
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000013', true);
insert into material.bitacora_unidad (unidad_id, fecha, tipo, titulo, km, novedades)
values (901, '2026-05-10', 'mantencion', 'Cambio aceite', 52000, 'OK');
select is(
  (select km_actual from material.unidad where id = 901),
  52000,
  'Bitácora con km mayor actualiza km_actual de la unidad'
);

insert into material.bitacora_unidad (unidad_id, fecha, tipo, titulo, km, novedades)
values (901, '2025-12-01', 'revision', 'Registro histórico', 40000, 'Histórico');
select is(
  (select km_actual from material.unidad where id = 901),
  52000,
  'Bitácora con km menor no retrocede km_actual'
);

-- 10-12: Bombero consulta Libro 2026 y detalle de parte sin filtrar datos privados
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000012', true);
select ok(
  jsonb_array_length(asistencia.libro_anual(2026, null) -> 'listas') >= 1
  and not ((asistencia.libro_anual(2026, null) -> 'personas' -> 0) ? 'rut'),
  'Bombero consulta libro_anual sin exposición de RUT ni datos sensibles'
);
select is(
  (asistencia.detalle_parte(9901) -> 'lista' ->> 'comentarios'),
  'Incendio estructural controlado',
  'Bombero consulta detalle_parte y comentarios del Ayudante'
);
select ok(
  exists (select 1 from asistencia.tipo_acto where clave = '10-1')
  and exists (select 1 from asistencia.tipo_acto where clave = '6-4')
  and exists (select 1 from asistencia.tipo_acto where clave = 'RO'),
  'Catálogo de claves reales 2026 cargado en asistencia.tipo_acto'
);

-- 13-14: Estadísticas válidas incluso para años sin registros
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000013', true);
select ok(
  (nucleo.estadisticas_compania(2099) -> 'resumen' ->> 'total_actos')::int = 0
  and jsonb_array_length(nucleo.estadisticas_compania(2099) -> 'actos_por_mes') = 12,
  'estadisticas_compania(2099) retorna 12 meses y 0 actos sin nulls ni división por cero'
);

select * from finish();
rollback;
