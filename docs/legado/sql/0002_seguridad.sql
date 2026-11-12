-- =====================================================================
-- 0002 · Seguridad: roles por cargo, RLS y auditoría
-- =====================================================================
set search_path = gestion, public;

-- ---------- Funciones de apoyo ----------
create or replace function yo() returns uuid
language sql stable as $$ select auth.uid() $$;

create or replace function mi_persona() returns uuid
language sql stable security definer set search_path = gestion, public as $$
  select persona_id from usuario where user_id = auth.uid() and activo $$;

create or replace function tiene_rol(variadic roles rol_sistema[]) returns boolean
language sql stable security definer set search_path = gestion, public as $$
  select exists (
    select 1 from usuario u join usuario_rol r using (user_id)
    where u.user_id = auth.uid() and u.activo
      and (r.rol = any(roles) or r.rol = 'admin')
      and r.desde <= current_date and (r.hasta is null or r.hasta >= current_date)) $$;

-- Oficialidad = puede ver datos de todos (lectura)
create or replace function es_oficial() returns boolean
language sql stable as $$ select tiene_rol('director','secretario','prosecretario','tesorero','protesorero','capitan','teniente','ayudante','consejo') $$;

-- ---------- Auditoría ----------
create table auditoria (
  id bigserial primary key,
  tabla text not null,
  fila_id text,
  accion text not null,                -- INSERT | UPDATE | DELETE
  antes jsonb, despues jsonb,
  usuario uuid default auth.uid(),
  ocurrido_en timestamptz not null default now()
);
create or replace function fn_auditar() returns trigger
language plpgsql security definer set search_path = gestion, public as $$
declare v_id text;
begin
  v_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id',
                   concat_ws('/', to_jsonb(coalesce(new,old))->>'persona_id', to_jsonb(coalesce(new,old))->>'lista_id', to_jsonb(coalesce(new,old))->>'periodo'));
  insert into auditoria(tabla, fila_id, accion, antes, despues)
  values (tg_table_name, v_id, tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create or replace function fn_actualizado() returns trigger
language plpgsql as $$ begin new.actualizado_en := now(); return new; end $$;
create trigger persona_actualizado before update on persona for each row execute function fn_actualizado();

-- Auditoría en todas las tablas de negocio
do $$ declare t text; begin
  for t in select unnest(array['persona','usuario_rol','cargo_periodo','curso','premio','sancion','lista','asistencia',
    'orden_capitania','guardia','unidad','articulo','item_inventario','asignacion','mantencion','categoria','presupuesto',
    'presupuesto_linea','movimiento','cuota','cierre_mensual','campana','talonario','campana_saldo','acta','acuerdo',
    'acuerdo_movimiento','correspondencia','adjunto','alerta']) loop
    execute format('create trigger aud_%1$s after insert or update or delete on %1$I for each row execute function fn_auditar()', t);
  end loop; end $$;

-- Tesorería: nada se borra, se anula
create or replace function fn_no_borrar() returns trigger language plpgsql as $$
begin raise exception 'Los movimientos no se eliminan: anúlelos indicando el motivo.'; end $$;
create trigger movimiento_no_borrar before delete on movimiento for each row execute function fn_no_borrar();

-- ---------- RLS ----------
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'gestion' loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

-- Lectura general para la oficialidad
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'gestion'
           and tablename not in ('auditoria','sancion','usuario','usuario_rol') loop
    execute format('create policy lectura_oficiales on %I for select using (es_oficial())', t);
  end loop; end $$;

-- Cada bombero ve su propia hoja de vida
create policy propia_persona     on persona    for select using (id = mi_persona());
create policy propia_asistencia  on asistencia for select using (persona_id = mi_persona());
create policy propia_cuota       on cuota      for select using (persona_id = mi_persona());
create policy propia_asignacion  on asignacion for select using (persona_id = mi_persona());
create policy propio_curso       on curso      for select using (persona_id = mi_persona());
create policy propio_premio      on premio     for select using (persona_id = mi_persona());
create policy propia_guardia     on guardia    for select using (persona_id = mi_persona());
create policy propio_saldo_camp  on campana_saldo for select using (persona_id = mi_persona());
create policy lista_bomberos     on lista      for select using (mi_persona() is not null);
create policy tipo_acto_todos    on tipo_acto  for select using (true);
create policy compania_todos     on compania   for select using (true);

-- Escritura por área
create policy esc_secretaria on persona         for all using (tiene_rol('secretario','prosecretario','director')) with check (tiene_rol('secretario','prosecretario','director'));
create policy esc_secretaria on cargo_periodo   for all using (tiene_rol('secretario','prosecretario','director')) with check (tiene_rol('secretario','prosecretario','director'));
create policy esc_secretaria on curso           for all using (tiene_rol('secretario','prosecretario','capitan')) with check (tiene_rol('secretario','prosecretario','capitan'));
create policy esc_secretaria on premio          for all using (tiene_rol('secretario','prosecretario')) with check (tiene_rol('secretario','prosecretario'));
create policy esc_secretaria on acta            for all using (tiene_rol('secretario','prosecretario')) with check (tiene_rol('secretario','prosecretario'));
create policy esc_secretaria on acuerdo         for all using (tiene_rol('secretario','prosecretario')) with check (tiene_rol('secretario','prosecretario'));
create policy esc_secretaria on correspondencia for all using (tiene_rol('secretario','prosecretario','director')) with check (tiene_rol('secretario','prosecretario','director'));

create policy esc_capitania on lista           for all using (tiene_rol('capitan','ayudante','secretario')) with check (tiene_rol('capitan','ayudante','secretario'));
create policy esc_capitania on asistencia      for all using (tiene_rol('capitan','ayudante','secretario')) with check (tiene_rol('capitan','ayudante','secretario'));
create policy esc_capitania on orden_capitania for all using (tiene_rol('capitan','ayudante')) with check (tiene_rol('capitan','ayudante'));
create policy esc_capitania on guardia         for all using (tiene_rol('capitan','ayudante','teniente')) with check (tiene_rol('capitan','ayudante','teniente'));
create policy esc_capitania on tipo_acto       for all using (tiene_rol('capitan','secretario')) with check (tiene_rol('capitan','secretario'));

create policy esc_material on unidad              for all using (tiene_rol('capitan','teniente')) with check (tiene_rol('capitan','teniente'));
create policy esc_material on articulo            for all using (tiene_rol('capitan','teniente','tesorero')) with check (tiene_rol('capitan','teniente','tesorero'));
create policy esc_material on item_inventario     for all using (tiene_rol('capitan','teniente')) with check (tiene_rol('capitan','teniente'));
create policy esc_material on asignacion          for all using (tiene_rol('capitan','teniente')) with check (tiene_rol('capitan','teniente'));
create policy esc_material on mantencion          for all using (tiene_rol('capitan','teniente')) with check (tiene_rol('capitan','teniente'));
create policy esc_material on revision_inventario for all using (tiene_rol('capitan','teniente')) with check (tiene_rol('capitan','teniente'));

create policy esc_tesoreria on categoria          for all using (tiene_rol('tesorero','protesorero')) with check (tiene_rol('tesorero','protesorero'));
create policy esc_tesoreria on presupuesto        for all using (tiene_rol('tesorero','director')) with check (tiene_rol('tesorero','director'));
create policy esc_tesoreria on presupuesto_linea  for all using (tiene_rol('tesorero','director')) with check (tiene_rol('tesorero','director'));
create policy esc_tesoreria on movimiento         for insert with check (tiene_rol('tesorero','protesorero'));
create policy upd_tesoreria on movimiento         for update using (tiene_rol('tesorero','protesorero'));
create policy esc_tesoreria on cuota              for all using (tiene_rol('tesorero','protesorero')) with check (tiene_rol('tesorero','protesorero'));
create policy esc_tesoreria on cierre_mensual     for all using (tiene_rol('tesorero')) with check (tiene_rol('tesorero'));
create policy esc_tesoreria on campana            for all using (tiene_rol('tesorero','director')) with check (tiene_rol('tesorero','director'));
create policy esc_tesoreria on talonario          for all using (tiene_rol('tesorero','protesorero')) with check (tiene_rol('tesorero','protesorero'));
create policy esc_tesoreria on campana_saldo      for all using (tiene_rol('tesorero')) with check (tiene_rol('tesorero'));
create policy esc_tesoreria on acuerdo_movimiento for all using (tiene_rol('tesorero','secretario')) with check (tiene_rol('tesorero','secretario'));

create policy esc_oficiales on adjunto  for all using (es_oficial()) with check (es_oficial());
create policy esc_oficiales on alerta   for update using (es_oficial());
create policy esc_staging   on staging_importacion for all using (es_oficial()) with check (es_oficial());

-- Datos reservados: sanciones solo Director, Capitán, Secretario y Consejo
create policy sancion_reservada on sancion for all
  using (tiene_rol('director','capitan','secretario','consejo'))
  with check (tiene_rol('director','capitan','secretario','consejo'));

-- Usuarios y roles: solo admin / director
create policy usuarios_admin on usuario     for all using (tiene_rol('director')) with check (tiene_rol('director'));
create policy usuario_propio on usuario     for select using (user_id = auth.uid());
create policy roles_admin    on usuario_rol for all using (tiene_rol('director')) with check (tiene_rol('director'));
create policy roles_propios  on usuario_rol for select using (user_id = auth.uid());

-- Auditoría: solo lectura para Director y Consejo
create policy auditoria_lectura on auditoria for select using (tiene_rol('director','consejo'));

-- ---------- Permisos de API (Supabase) ----------
-- Recuerde agregar el esquema "gestion" en Settings → API → Exposed schemas.
grant usage on schema gestion to authenticated, anon;
grant select, insert, update, delete on all tables in schema gestion to authenticated;
grant usage, select on all sequences in schema gestion to authenticated;
grant execute on all functions in schema gestion to authenticated;
alter default privileges in schema gestion grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema gestion grant usage, select on sequences to authenticated;
