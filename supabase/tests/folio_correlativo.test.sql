-- Folio correlativo y verificación pública.
begin;
select plan(6);

select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.persona', (select persona_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

set local role authenticated;
select set_config('test.folio1', documentos.siguiente_folio('P3')::text, true);
select set_config('test.folio2', documentos.siguiente_folio('P3')::text, true);
select is(current_setting('test.folio2')::int, current_setting('test.folio1')::int + 1,
  'los folios son correlativos por tipo y año');

select lives_ok(
  format($$select documentos.registrar_emision('P3', %L, 'prueba', repeat('a', 64),
    'documentos', 'emitidos/prueba.pdf', 'prueba.pdf')$$, current_setting('test.persona')),
  'se registra una emisión');

select is((select count(*)::int from documentos.documento_emitido where referencia = 'prueba'), 1,
  'la emisión quedó guardada');
reset role;

select is((select valido from documentos.verificar_documento(
    (select token_verificacion from documentos.documento_emitido where referencia = 'prueba'))),
  true, 'la verificación pública devuelve válido');

-- Anulación con motivo y nueva verificación
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
set local role authenticated;
select lives_ok(
  format('select documentos.anular_documento(%L, %L)',
    (select id::text from documentos.documento_emitido where referencia = 'prueba'),
    'Documento de prueba'),
  'se anula con motivo');
reset role;

select is((select valido from documentos.verificar_documento(
    (select token_verificacion from documentos.documento_emitido where referencia = 'prueba'))),
  false, 'la verificación pública devuelve inválido tras anular');

select * from finish();
rollback;
