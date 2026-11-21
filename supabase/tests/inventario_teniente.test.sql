-- Inventario del Teniente 2°: pañol, solicitudes, entrega y avisos.
-- Verifica la matriz RLS y la RPC que descuenta stock y crea la asignación.
begin;
select plan(16);

select set_config('test.t2', (select user_id::text from seguridad.usuario where email = 'teniente_2@demo.local'), true);
select set_config('test.t2_persona', (select persona_id::text from seguridad.usuario where email = 'teniente_2@demo.local'), true);
select set_config('test.bombero', (select user_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.bombero_persona', (select persona_id::text from seguridad.usuario where email = 'bombero@demo.local'), true);
select set_config('test.director', (select user_id::text from seguridad.usuario where email = 'director@demo.local'), true);
select set_config('test.consejo', (select user_id::text from seguridad.usuario where email = 'consejo@demo.local'), true);

-- El stock de prueba queda en el mínimo para provocar el aviso de reposición.
select set_config('test.stock', (select id::text from material.panol_stock order by id limit 1), true);
update material.panol_stock set cantidad = 1, minimo = 1 where id = current_setting('test.stock')::bigint;

-- ---------------------------------------------------------------------
-- El bombero consulta el pañol, pero no lo modifica
-- ---------------------------------------------------------------------
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select cmp_ok((select count(*)::int from material.panol_stock), '>', 0,
  'el bombero consulta el inventario del Teniente 2°');

select throws_ok(
  'insert into material.panol_stock (articulo_id, cantidad) values (1, 1)',
  '42501', null,
  'el bombero no puede modificar el pañol');

update material.panol_stock set cantidad = 99 where id = current_setting('test.stock')::bigint;
reset role;

select is(
  (select cantidad from material.panol_stock where id = current_setting('test.stock')::bigint),
  1::numeric,
  'el bombero no puede alterar el stock');

-- ---------------------------------------------------------------------
-- El bombero solicita un artículo y la notificación va al Teniente 2°
-- ---------------------------------------------------------------------
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;

select lives_ok(
  format($sql$
    insert into material.solicitud (persona_id, stock_id, articulo_id, cantidad, motivo)
    select %L, s.id, s.articulo_id, 1, 'Prueba pgTAP'
    from material.panol_stock s where s.id = %s
  $sql$, current_setting('test.bombero_persona'), current_setting('test.stock')),
  'el bombero crea una solicitud para sí mismo');

select set_config('test.solicitud', (select max(id)::text from material.solicitud), true);

select is(
  (select estado::text from material.solicitud where id = current_setting('test.solicitud')::bigint),
  'pendiente',
  'la solicitud nace pendiente');

reset role;
select is(
  (select count(*)::int from material.notificacion
    where solicitud_id = current_setting('test.solicitud')::bigint
      and tipo = 'solicitud_nueva'
      and destinatario_persona_id = current_setting('test.t2_persona')::uuid),
  1,
  'la solicitud nueva se notifica al Teniente 2°');

-- El bombero solo ve sus propias solicitudes.
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select is(
  (select count(*)::int from material.solicitud
    where persona_id <> current_setting('test.bombero_persona')::uuid),
  0,
  'el bombero no ve solicitudes ajenas');

-- ---------------------------------------------------------------------
-- La oficialidad y el Teniente 2° ven todas las solicitudes
-- ---------------------------------------------------------------------
select set_config('request.jwt.claim.sub', current_setting('test.director'), true);
set local role authenticated;
select cmp_ok((select count(*)::int from material.solicitud), '>=', 5,
  'la oficialidad ve todas las solicitudes');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.consejo'), true);
set local role authenticated;
select is((select count(*)::int from material.solicitud), 0,
  'quien no es oficial ni solicitante no ve solicitudes');
reset role;

-- ---------------------------------------------------------------------
-- Solo el Teniente 2° resuelve
-- ---------------------------------------------------------------------
select set_config('request.jwt.claim.sub', current_setting('test.bombero'), true);
set local role authenticated;
select throws_ok(
  format('select material.resolver_solicitud(%s, %L)', current_setting('test.solicitud'), 'entregada'),
  '42501', null,
  'un bombero no puede entregar su propia solicitud');
reset role;

select set_config('request.jwt.claim.sub', current_setting('test.t2'), true);
set local role authenticated;
select lives_ok(
  format('select material.resolver_solicitud(%s, %L, %L)', current_setting('test.solicitud'), 'entregada', 'Entrega de prueba'),
  'el Teniente 2° entrega la solicitud');
reset role;

select is(
  (select estado::text from material.solicitud where id = current_setting('test.solicitud')::bigint),
  'entregada',
  'la solicitud queda entregada');

select is(
  (select cantidad from material.panol_stock where id = current_setting('test.stock')::bigint),
  0::numeric,
  'la entrega descuenta el stock');

select is(
  (select count(*)::int from material.asignacion
    where persona_id = current_setting('test.bombero_persona')::uuid
      and observacion = 'Entrega de prueba'),
  1,
  'la entrega crea la asignación de EPP');

select is(
  (select count(*)::int from material.notificacion
    where solicitud_id = current_setting('test.solicitud')::bigint
      and tipo = 'solicitud_resuelta'
      and destinatario_persona_id = current_setting('test.bombero_persona')::uuid),
  1,
  'el solicitante recibe el aviso de entrega');

select is(
  (select count(*)::int from material.notificacion
    where tipo = 'stock_bajo'
      and destinatario_persona_id = current_setting('test.t2_persona')::uuid),
  1,
  'el Teniente 2° recibe el aviso de stock bajo');

select * from finish();
rollback;
