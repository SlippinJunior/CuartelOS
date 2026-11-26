-- =====================================================================
-- 20261126000300 · Permisos por módulo, Bitácora de Unidades,
--                  Partes y Libro de Asistencia 2026, y Estadísticas
-- =====================================================================
set search_path = seguridad, nucleo, material, asistencia, personal, secretaria, public;

-- ---------------------------------------------------------------------
-- 1. Permisos por módulo sobre bloques de rol
-- ---------------------------------------------------------------------
create table if not exists seguridad.usuario_modulo (
  user_id         uuid not null references seguridad.usuario(user_id) on delete cascade,
  modulo          text not null check (modulo in (
    'personal', 'asistencia', 'guardia', 'material', 'tesoreria',
    'secretaria', 'documentos', 'administracion', 'disciplina', 'estadisticas'
  )),
  nivel           text not null check (nivel in ('ninguno', 'lectura', 'gestion')),
  actualizado_por uuid references auth.users(id) default auth.uid(),
  actualizado_en  timestamptz not null default now(),
  primary key (user_id, modulo)
);
comment on table seguridad.usuario_modulo is
  'Excepciones de permisos por módulo por usuario sobre los bloques automáticos asignados por rol.';

drop trigger if exists aud_usuario_modulo on seguridad.usuario_modulo;
create trigger aud_usuario_modulo
  after insert or update or delete on seguridad.usuario_modulo
  for each row execute function seguridad.fn_auditar();

alter table seguridad.usuario_modulo enable row level security;

drop policy if exists usuario_modulo_propio on seguridad.usuario_modulo;
create policy usuario_modulo_propio on seguridad.usuario_modulo
  for select using (user_id = auth.uid() and not seguridad.es_solo_cuartel());

drop policy if exists usuario_modulo_admin on seguridad.usuario_modulo;
create policy usuario_modulo_admin on seguridad.usuario_modulo
  for all
  using (seguridad.puede_administrar_usuarios())
  with check (seguridad.puede_administrar_usuarios());

create or replace function seguridad.nivel_por_roles(p_user_id uuid, p_modulo text)
returns text
language plpgsql
stable
security definer
set search_path = seguridad, public
as $$
declare
  v_roles text[];
  v_es_oficial boolean;
begin
  select coalesce(array_agg(r.rol::text), '{}')
    into v_roles
  from seguridad.usuario u
  join seguridad.usuario_rol r on r.user_id = u.user_id
  where u.user_id = p_user_id
    and u.activo
    and r.desde <= current_date
    and (r.hasta is null or r.hasta >= current_date);

  if 'admin' = any(v_roles) then
    return 'gestion';
  end if;

  if 'cuartel' = any(v_roles) and not exists (
    select 1 from unnest(v_roles) x where x <> 'cuartel'
  ) then
    return 'ninguno';
  end if;

  v_es_oficial := v_roles && array[
    'director', 'secretario', 'prosecretario',
    'tesorero', 'protesorero', 'capitan',
    'teniente_1', 'teniente_2', 'teniente_3', 'ayudante'
  ];

  case p_modulo
    when 'personal' then
      if v_roles && array['director', 'secretario', 'prosecretario', 'capitan', 'ayudante'] then
        return 'gestion';
      end if;
      if v_es_oficial or 'consejo' = any(v_roles) or 'bombero' = any(v_roles) then
        return 'lectura';
      end if;
    when 'asistencia' then
      if v_roles && array['ayudante', 'capitan', 'secretario'] then
        return 'gestion';
      end if;
      if v_es_oficial or 'bombero' = any(v_roles) then
        return 'lectura';
      end if;
    when 'guardia' then
      if v_roles && array['capitan', 'teniente_1', 'ayudante', 'director'] then
        return 'gestion';
      end if;
      if v_es_oficial or 'bombero' = any(v_roles) or 'consejo' = any(v_roles) then
        return 'lectura';
      end if;
    when 'material' then
      if v_roles && array['teniente_2', 'teniente_3', 'capitan', 'director'] then
        return 'gestion';
      end if;
      if v_es_oficial or 'bombero' = any(v_roles) then
        return 'lectura';
      end if;
    when 'tesoreria' then
      if v_roles && array['tesorero', 'protesorero', 'director'] then
        return 'gestion';
      end if;
    when 'secretaria' then
      if v_roles && array['secretario', 'prosecretario', 'director'] then
        return 'gestion';
      end if;
      if v_es_oficial then
        return 'lectura';
      end if;
    when 'documentos' then
      if v_es_oficial then
        return 'gestion';
      end if;
      if 'bombero' = any(v_roles) then
        return 'lectura';
      end if;
    when 'administracion' then
      if 'director' = any(v_roles) then
        return 'gestion';
      end if;
    when 'disciplina' then
      if 'consejo' = any(v_roles) then
        return 'gestion';
      end if;
    when 'estadisticas' then
      if 'director' = any(v_roles) then
        return 'gestion';
      end if;
      if v_es_oficial then
        return 'lectura';
      end if;
    else
      return 'ninguno';
  end case;

  return 'ninguno';
end
$$;
comment on function seguridad.nivel_por_roles(uuid, text) is
  'Nivel de acceso heredado automáticamente desde los roles asignados al usuario.';

create or replace function seguridad.tiene_permiso_modulo(p_modulo text, p_nivel text default 'lectura')
returns boolean
language plpgsql
stable
security definer
set search_path = seguridad, public
as $$
declare
  v_uid uuid := auth.uid();
  v_activo boolean;
  v_nivel text;
begin
  if v_uid is null then
    return false;
  end if;

  select u.activo into v_activo from seguridad.usuario u where u.user_id = v_uid;
  if coalesce(v_activo, false) = false then
    return false;
  end if;

  if seguridad.es_admin() then
    return true;
  end if;

  if seguridad.es_solo_cuartel() then
    return p_modulo = 'inicio';
  end if;

  select um.nivel
    into v_nivel
  from seguridad.usuario_modulo um
  where um.user_id = v_uid and um.modulo = p_modulo;

  if v_nivel is null then
    v_nivel := seguridad.nivel_por_roles(v_uid, p_modulo);
  end if;

  if p_nivel = 'gestion' then
    return v_nivel = 'gestion';
  end if;

  return v_nivel in ('lectura', 'gestion');
end
$$;
comment on function seguridad.tiene_permiso_modulo(text, text) is
  'Evalúa si la sesión tiene al menos lectura o gestión en un módulo (rol + excepción por usuario).';

create or replace function seguridad.modulos_efectivos(p_user_id uuid default auth.uid())
returns jsonb
language sql
stable
security definer
set search_path = seguridad, public
as $$
  select case
    when p_user_id is null then '{}'::jsonb
    else (
      select jsonb_object_agg(
        m,
        coalesce(
          (select um.nivel from seguridad.usuario_modulo um where um.user_id = p_user_id and um.modulo = m),
          seguridad.nivel_por_roles(p_user_id, m)
        )
      )
      from unnest(array[
        'personal', 'asistencia', 'guardia', 'material', 'tesoreria',
        'secretaria', 'documentos', 'administracion', 'disciplina', 'estadisticas'
      ]) as m
    )
  end
$$;

grant execute on function seguridad.nivel_por_roles(uuid, text) to authenticated;
grant execute on function seguridad.tiene_permiso_modulo(text, text) to authenticated;
grant execute on function seguridad.modulos_efectivos(uuid) to authenticated;

-- Actualizar nucleo.mi_perfil() incluyendo modulos efectivos
create or replace function nucleo.mi_perfil()
returns jsonb
language sql
stable
security definer
set search_path = seguridad, personal, nucleo, public
as $$
  select jsonb_build_object(
    'usuario_id', auth.uid(),
    'email', u.email,
    'activo', u.activo,
    'persona', case when p.id is null then null else jsonb_build_object(
      'id', p.id, 'registro', p.registro,
      'nombres', p.nombres, 'apellido_paterno', p.apellido_paterno,
      'apellido_materno', p.apellido_materno,
      'nombre', p.nombres || ' ' || p.apellido_paterno,
      'rango', p.rango, 'estado', p.estado, 'email', p.email,
      'codigo_charlie', p.codigo_charlie,
      'anios_servicio', (select v.anios_servicio from personal.v_antiguedad_persona v where v.persona_id = p.id),
      'categoria_guardia', (select v.categoria_guardia from personal.v_antiguedad_persona v where v.persona_id = p.id),
      'exento_guardia', (select v.exento_efectivo from personal.v_antiguedad_persona v where v.persona_id = p.id)
    ) end,
    'roles', coalesce((
      select jsonb_agg(r.rol::text order by r.rol)
      from seguridad.usuario_rol r
      where r.user_id = u.user_id and r.desde <= current_date
        and (r.hasta is null or r.hasta >= current_date)
    ), '[]'::jsonb),
    'modulos', coalesce(seguridad.modulos_efectivos(u.user_id), '{}'::jsonb),
    'es_oficial', seguridad.es_oficial(),
    'es_admin', seguridad.es_admin(),
    'es_cuartel', seguridad.es_solo_cuartel(),
    'compania', (
      select jsonb_build_object('id', c.id, 'nombre', c.nombre, 'cuerpo', c.cuerpo, 'lema', c.lema)
      from nucleo.compania c order by c.id limit 1
    ),
    'consentimiento', case
      when seguridad.es_solo_cuartel() then jsonb_build_object(
        'version', 0,
        'titulo', 'Cuenta de cuartel',
        'texto', '',
        'aceptado', true,
        'requerido', false
      )
      else (
        select jsonb_build_object(
          'version', t.version,
          'titulo', t.titulo,
          'texto', t.texto,
          'aceptado', exists (
            select 1 from seguridad.consentimiento co
            where co.usuario_id = u.user_id and co.texto_id = t.id
          ),
          'requerido', true
        )
        from seguridad.consentimiento_texto t
        where t.vigente
        limit 1
      )
    end
  )
  from seguridad.usuario u
  left join personal.persona p on p.id = u.persona_id
  where u.user_id = auth.uid()
$$;
comment on function nucleo.mi_perfil() is 'Perfil de la sesión: persona, roles, permisos efectivos por módulo, modo cuartel y consentimiento.';

-- Actualizar listar_usuarios() para incluir excepciones de módulo
drop function if exists nucleo.listar_usuarios();
create function nucleo.listar_usuarios()
returns table (
  user_id uuid,
  email text,
  persona_id uuid,
  nombre text,
  registro integer,
  activo boolean,
  roles text[],
  permisos_modulo jsonb
)
language sql
stable
security definer
set search_path = seguridad, personal, public
as $$
  select u.user_id, u.email, u.persona_id,
         case when p.id is null then null else p.nombres || ' ' || p.apellido_paterno end,
         p.registro, u.activo,
         coalesce(array_agg(r.rol::text order by r.rol) filter (where r.rol is not null), '{}'),
         coalesce((
           select jsonb_agg(jsonb_build_object('modulo', um.modulo, 'nivel', um.nivel) order by um.modulo)
           from seguridad.usuario_modulo um
           where um.user_id = u.user_id
         ), '[]'::jsonb)
  from seguridad.usuario u
  left join personal.persona p on p.id = u.persona_id
  left join seguridad.usuario_rol r on r.user_id = u.user_id
    and r.desde <= current_date and (r.hasta is null or r.hasta >= current_date)
  where seguridad.puede_administrar_usuarios() or seguridad.tiene_permiso_modulo('administracion', 'lectura')
  group by u.user_id, u.email, u.persona_id, p.id, p.nombres, p.apellido_paterno, p.registro, u.activo
$$;
grant execute on function nucleo.listar_usuarios() to authenticated;

create or replace function nucleo.admin_definir_permiso_modulo(
  p_user_id uuid,
  p_modulo text,
  p_nivel text default null
)
returns void
language plpgsql
security definer
set search_path = seguridad, public
as $$
begin
  if not (seguridad.puede_administrar_usuarios() or seguridad.tiene_permiso_modulo('administracion', 'gestion')) then
    raise exception 'Solo Director o administrador pueden modificar permisos por módulo.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from seguridad.usuario where user_id = p_user_id) then
    raise exception 'El usuario indicado no existe.';
  end if;

  if p_modulo not in (
    'personal', 'asistencia', 'guardia', 'material', 'tesoreria',
    'secretaria', 'documentos', 'administracion', 'disciplina', 'estadisticas'
  ) then
    raise exception 'Módulo inválido: %', p_modulo;
  end if;

  if p_nivel is null then
    delete from seguridad.usuario_modulo where user_id = p_user_id and modulo = p_modulo;
  else
    if p_nivel not in ('ninguno', 'lectura', 'gestion') then
      raise exception 'Nivel inválido: %', p_nivel;
    end if;
    insert into seguridad.usuario_modulo (user_id, modulo, nivel, actualizado_por, actualizado_en)
    values (p_user_id, p_modulo, p_nivel, auth.uid(), now())
    on conflict (user_id, modulo) do update
      set nivel = excluded.nivel,
          actualizado_por = auth.uid(),
          actualizado_en = now();
  end if;
end
$$;
grant execute on function nucleo.admin_definir_permiso_modulo(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Material: Bitácora de Unidades enriquecida + RLS por módulo
-- ---------------------------------------------------------------------
alter table material.bitacora_unidad
  add column if not exists tipo text not null default 'novedad'
    check (tipo in ('mantencion', 'accidente', 'revision', 'combustible', 'novedad')),
  add column if not exists titulo text,
  add column if not exists costo numeric(12,0),
  add column if not exists proxima_fecha date,
  add column if not exists estado_unidad_post text
    check (estado_unidad_post is null or estado_unidad_post in ('operativa', 'mantencion', 'fuera_servicio', 'baja'));

create index if not exists bitacora_unidad_fecha_idx on material.bitacora_unidad (unidad_id, fecha desc, id desc);

create or replace function material.fn_bitacora_actualizar_unidad()
returns trigger
language plpgsql
security definer
set search_path = material, public
as $$
begin
  update material.unidad
     set km_actual = case
           when new.km is not null and new.km > coalesce(km_actual, 0) then new.km
           else km_actual
         end,
         estado = coalesce(new.estado_unidad_post, estado),
         actualizado_en = now()
   where id = new.unidad_id;
  return new;
end
$$;

drop trigger if exists bitacora_actualizar_unidad on material.bitacora_unidad;
create trigger bitacora_actualizar_unidad
  after insert on material.bitacora_unidad
  for each row execute function material.fn_bitacora_actualizar_unidad();

-- Políticas RLS de Material y Unidades
drop policy if exists unidad_lectura on material.unidad;
create policy unidad_lectura on material.unidad
  for select using (
    not seguridad.es_solo_cuartel()
    and (
      seguridad.tiene_permiso_modulo('material', 'lectura')
      or seguridad.tiene_permiso_modulo('administracion', 'lectura')
    )
  );

drop policy if exists unidad_escritura on material.unidad;
create policy unidad_escritura on material.unidad
  for all
  using (
    seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('administracion', 'gestion')
  )
  with check (
    seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('administracion', 'gestion')
  );

drop policy if exists unidad_documento_lectura on material.unidad_documento;
create policy unidad_documento_lectura on material.unidad_documento
  for select using (
    not seguridad.es_solo_cuartel()
    and (
      seguridad.tiene_permiso_modulo('material', 'lectura')
      or seguridad.tiene_permiso_modulo('administracion', 'lectura')
    )
  );

drop policy if exists unidad_documento_escritura on material.unidad_documento;
create policy unidad_documento_escritura on material.unidad_documento
  for all
  using (
    seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('administracion', 'gestion')
  )
  with check (
    seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('administracion', 'gestion')
  );

drop policy if exists bitacora_lectura on material.bitacora_unidad;
create policy bitacora_lectura on material.bitacora_unidad
  for select using (
    not seguridad.es_solo_cuartel()
    and seguridad.tiene_permiso_modulo('material', 'lectura')
  );

drop policy if exists bitacora_escritura on material.bitacora_unidad;
create policy bitacora_escritura on material.bitacora_unidad
  for all
  using (
    not seguridad.es_solo_cuartel()
    and (
      seguridad.tiene_rol('capitan', 'teniente_3', 'teniente_2', 'director', 'admin')
      or seguridad.tiene_permiso_modulo('material', 'gestion')
    )
  )
  with check (
    not seguridad.es_solo_cuartel()
    and (
      seguridad.tiene_rol('capitan', 'teniente_3', 'teniente_2', 'director', 'admin')
      or seguridad.tiene_permiso_modulo('material', 'gestion')
    )
  );

drop policy if exists panol_escritura on material.panol_stock;
create policy panol_escritura on material.panol_stock
  for all
  using (
    seguridad.tiene_rol('teniente_2', 'admin')
    or seguridad.tiene_permiso_modulo('material', 'gestion')
  )
  with check (
    seguridad.tiene_rol('teniente_2', 'admin')
    or seguridad.tiene_permiso_modulo('material', 'gestion')
  );

drop policy if exists asignacion_escritura on material.asignacion;
create policy asignacion_escritura on material.asignacion
  for all
  using (
    seguridad.tiene_rol('capitan', 'teniente_2', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('material', 'gestion')
  )
  with check (
    seguridad.tiene_rol('capitan', 'teniente_2', 'director', 'admin')
    or seguridad.tiene_permiso_modulo('material', 'gestion')
  );

-- ---------------------------------------------------------------------
-- 3. Asistencia: Claves 2026, Partes del Ayudante y Libro anual
-- ---------------------------------------------------------------------
alter table asistencia.tipo_acto
  add column if not exists categoria text not null default 'otro'
    check (categoria in ('emergencia', 'reunion', 'academia', 'citacion', 'otro'));

insert into asistencia.tipo_acto (clave, descripcion, categoria, obligatorio, cuenta_para_premio, activo) values
  ('RO',   'Reunión Ordinaria de Compañía',                 'reunion',    true,  true, true),
  ('RE',   'Reunión Extraordinaria de Compañía',            'reunion',    true,  true, true),
  ('REO',  'Reunión Extraordinaria de Oficiales',           'reunion',    true,  true, true),
  ('ACAD', 'Academia de Compañía',                          'academia',   false, true, true),
  ('EJER', 'Ejercicio o instrucción práctica',              'academia',   false, true, true),
  ('SERV', 'Servicio especial o guardia extraordinaria',    'citacion',   false, true, true),
  ('OTRO', 'Otro acto oficial',                             'otro',       false, true, true),
  ('1',    'Clave 1 · Llamado de comandancia / citación',   'citacion',   false, true, true),
  ('1-1',  'Clave 1-1 · Citación de compañía',              'citacion',   false, true, true),
  ('2',    'Clave 2 · Academia o instrucción programada',   'academia',   false, true, true),
  ('2-1',  'Clave 2-1 · Ejercicio de compañía',             'academia',   false, true, true),
  ('2-2',  'Clave 2-2 · Ejercicio general de Cuerpo',       'academia',   false, true, true),
  ('2-3',  'Clave 2-3 · Práctica operativa de unidad',      'academia',   false, true, true),
  ('3',    'Clave 3 · Comisión o desfile institucional',    'citacion',   false, true, true),
  ('3-1',  'Clave 3-1 · Ceremonia / romería',               'citacion',   false, true, true),
  ('3-2',  'Clave 3-2 · Acto oficial de aniversario',       'citacion',   false, true, true),
  ('4-1',  'Clave 4-1 · Respaldo o acuartelamiento',        'citacion',   false, true, true),
  ('4-2',  'Clave 4-2 · Guardia preventiva diurna',         'citacion',   false, true, true),
  ('4-3',  'Clave 4-3 · Servicio preventivo',               'citacion',   false, true, true),
  ('4-4',  'Clave 4-4 · Apoyo logístico',                   'citacion',   false, true, true),
  ('5',    'Clave 5 · Reunión / citación interna',          'citacion',   false, true, true),
  ('5-1',  'Clave 5-1 · Citación extraordinaria',           'citacion',   false, true, true),
  ('5-2',  'Clave 5-2 · Citación administrativa',           'citacion',   false, true, true),
  ('6',    'Clave 6 · Falsa alarma / sin novedad',          'emergencia', false, true, true),
  ('6-1',  'Clave 6-1 · Emergencia menor verificada',       'emergencia', false, true, true),
  ('6-2',  'Clave 6-2 · Apoyo en ruta / despacho',          'emergencia', false, true, true),
  ('6-3',  'Clave 6-3 · Emergencia eléctrica / poste',      'emergencia', false, true, true),
  ('6-4',  'Clave 6-4 · Rescate / apertura de inmueble',    'emergencia', false, true, true),
  ('6-5',  'Clave 6-5 · Derrame / incidente vial menor',    'emergencia', false, true, true),
  ('7',    'Clave 7 · Servicio especial fuera de jurisdicción', 'emergencia', false, true, true),
  ('8',    'Clave 8 · Apoyo de material mayor',             'emergencia', false, true, true),
  ('8-1',  'Clave 8-1 · Apoyo a otra compañía',             'emergencia', false, true, true),
  ('8X1',  'Clave 8X1 · Emergencia múltiple',               'emergencia', false, true, true),
  ('8X3',  'Clave 8X3 · Apoyo en incendio de magnitud',     'emergencia', false, true, true),
  ('8X11', 'Clave 8X11 · Alarma general / refuerzo',        'emergencia', false, true, true),
  ('9-1',  'Clave 9-1 · Incidente con materiales peligrosos', 'emergencia', false, true, true),
  ('10-1', 'Clave 10-1 · Incendio estructural',             'emergencia', false, true, true),
  ('10-2', 'Clave 10-2 · Incendio de pastizal / forestal',  'emergencia', false, true, true),
  ('11-1', 'Clave 11-1 · Rescate en altura / desnivel',     'emergencia', false, true, true),
  ('12',   'Clave 12 · Accidente vehicular',                'emergencia', false, true, true),
  ('12-1', 'Clave 12-1 · Rescate vehicular simple',         'emergencia', false, true, true),
  ('12-2', 'Clave 12-2 · Rescate vehicular complejo',       'emergencia', false, true, true),
  ('12-3', 'Clave 12-3 · Colisión con múltiples lesionados','emergencia', false, true, true),
  ('14-1', 'Clave 14-1 · Incendio vehicular',               'emergencia', false, true, true),
  ('14-2', 'Clave 14-2 · Principio de incendio',            'emergencia', false, true, true),
  ('15',   'Clave 15 · Emergencia médica / apoyo SAMU',     'emergencia', false, true, true),
  ('15-1', 'Clave 15-1 · Atención prehospitalaria',         'emergencia', false, true, true),
  ('15-2', 'Clave 15-2 · Emergencia por escape de gas',     'emergencia', false, true, true)
on conflict (clave) do update
  set categoria = excluded.categoria,
      descripcion = case
        when asistencia.tipo_acto.descripcion ilike '%completar descripción%'
          or asistencia.tipo_acto.clave in ('RO','RE','REO','ACAD','EJER','SERV','OTRO')
        then excluded.descripcion
        else asistencia.tipo_acto.descripcion
      end;

alter table asistencia.lista
  add column if not exists citacion_id bigint references secretaria.citacion(id) on delete set null,
  add column if not exists comentarios text,
  add column if not exists hora_inicio time,
  add column if not exists hora_termino time;

-- Permitir gestión en asistencia también por excepción de módulo
drop policy if exists lista_lectura on asistencia.lista;
create policy lista_lectura on asistencia.lista
  for select using (
    auth.uid() is not null
    and not seguridad.es_solo_cuartel()
    and seguridad.tiene_permiso_modulo('asistencia', 'lectura')
  );

drop policy if exists lista_escritura on asistencia.lista;
create policy lista_escritura on asistencia.lista
  for all
  using (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  )
  with check (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  );

drop policy if exists asistencia_escritura on asistencia.asistencia;
create policy asistencia_escritura on asistencia.asistencia
  for all
  using (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  )
  with check (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  );

create or replace function asistencia.corregir_marca(
  p_lista_id bigint,
  p_persona_id uuid,
  p_marca asistencia.marca,
  p_motivo text,
  p_observacion text default null
)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
begin
  if not (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  ) then
    raise exception 'Sin permiso para corregir asistencia.' using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Debe indicar un motivo de al menos 3 caracteres.';
  end if;

  perform set_config('app.motivo_edicion', p_motivo, true);

  insert into asistencia.asistencia (lista_id, persona_id, marca, observacion, registrado_por)
  values (p_lista_id, p_persona_id, p_marca, p_observacion, auth.uid())
  on conflict (lista_id, persona_id) do update
    set marca = excluded.marca,
        observacion = excluded.observacion,
        registrado_por = auth.uid(),
        actualizado_en = now();
end
$$;

create or replace function asistencia.cerrar_lista(p_lista_id bigint)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
declare
  v_lista asistencia.lista;
begin
  if not (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  ) then
    raise exception 'Sin permiso para cerrar listas.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_lista from asistencia.lista where id = p_lista_id for update;
  if not found then raise exception 'Lista % no existe.', p_lista_id; end if;
  if v_lista.estado <> 'borrador' then raise exception 'La lista ya está %.', v_lista.estado; end if;
  if v_lista.es_abono and length(trim(coalesce(v_lista.abono_justificacion, ''))) = 0 then
    raise exception 'Una lista de abono requiere justificación.';
  end if;

  update asistencia.lista
     set estado = 'cerrada', cerrada_en = now(), cerrada_por = auth.uid()
   where id = p_lista_id;
end
$$;

create or replace function asistencia.enviar_lista(p_lista_id bigint)
returns void
language plpgsql
security definer
set search_path = asistencia, seguridad, public
as $$
declare
  v_lista asistencia.lista;
begin
  if not (
    seguridad.tiene_rol('ayudante', 'capitan', 'secretario', 'admin')
    or seguridad.tiene_permiso_modulo('asistencia', 'gestion')
  ) then
    raise exception 'Sin permiso para enviar listas.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_lista from asistencia.lista where id = p_lista_id for update;
  if not found then raise exception 'Lista % no existe.', p_lista_id; end if;
  if v_lista.estado = 'borrador' then perform asistencia.cerrar_lista(p_lista_id); end if;

  update asistencia.lista
     set estado = 'enviada', enviada_en = now(), enviada_por = auth.uid()
   where id = p_lista_id and estado in ('cerrada');
end
$$;

-- RPC Libro de Asistencia anual (visible para toda la compañía excepto cuartel, sin datos privados)
create or replace function asistencia.libro_anual(
  p_anio integer default extract(year from current_date)::int,
  p_clave text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = asistencia, personal, seguridad, public
as $$
begin
  if auth.uid() is null or seguridad.es_solo_cuartel() or not seguridad.tiene_permiso_modulo('asistencia', 'lectura') then
    raise exception 'Sin permiso para consultar el libro de asistencia.'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'anio', p_anio,
    'listas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'numero', l.numero,
          'fecha', l.fecha,
          'clave', coalesce(l.tipo_acto_clave, 'OTRO'),
          'descripcion', coalesce(ta.descripcion, l.descripcion, 'Acto'),
          'categoria', coalesce(ta.categoria, 'otro'),
          'estado', l.estado,
          'comentarios', l.comentarios
        )
        order by l.numero asc
      )
      from asistencia.lista l
      left join asistencia.tipo_acto ta on ta.clave = l.tipo_acto_clave
      where l.anio = p_anio
        and l.estado <> 'anulada'
        and (p_clave is null or l.tipo_acto_clave = p_clave)
    ), '[]'::jsonb),
    'personas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'persona_id', p.id,
          'registro', p.registro,
          'nombre', p.nombres || ' ' || p.apellido_paterno,
          'fecha_ingreso', p.fecha_ingreso,
          'cargo_grado', coalesce((
            select c.codigo
            from personal.cargo_periodo cp
            join personal.cargo c on c.id = cp.cargo_id
            where cp.persona_id = p.id and (cp.hasta is null or cp.hasta >= current_date)
            order by cp.desde desc
            limit 1
          ), initcap(p.rango::text)),
          'estado', p.estado,
          'marcas', coalesce((
            select jsonb_object_agg(a.lista_id::text, a.marca::text)
            from asistencia.asistencia a
            join asistencia.lista l on l.id = a.lista_id
            where a.persona_id = p.id
              and l.anio = p_anio
              and l.estado <> 'anulada'
              and (p_clave is null or l.tipo_acto_clave = p_clave)
          ), '{}'::jsonb)
        )
        order by p.registro asc
      )
      from personal.persona p
      where p.estado in ('activo', 'suspendido')
    ), '[]'::jsonb)
  );
end
$$;
comment on function asistencia.libro_anual(integer, text) is
  'Matriz del Libro de Asistencia anual por clave y fecha (visible para toda la compañía; sin datos privados).';

create or replace function asistencia.detalle_parte(p_lista_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = asistencia, personal, secretaria, seguridad, public
as $$
declare
  v_res jsonb;
begin
  if auth.uid() is null or seguridad.es_solo_cuartel() or not seguridad.tiene_permiso_modulo('asistencia', 'lectura') then
    raise exception 'Sin permiso para consultar el parte de asistencia.'
      using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'lista', jsonb_build_object(
      'id', l.id,
      'anio', l.anio,
      'numero', l.numero,
      'fecha', l.fecha,
      'clave', l.tipo_acto_clave,
      'tipo_descripcion', ta.descripcion,
      'categoria', coalesce(ta.categoria, 'otro'),
      'descripcion', l.descripcion,
      'direccion', l.direccion,
      'hora_inicio', l.hora_inicio,
      'hora_termino', l.hora_termino,
      'comentarios', l.comentarios,
      'estado', l.estado,
      'citacion_id', l.citacion_id,
      'citacion_titulo', (select c.titulo from secretaria.citacion c where c.id = l.citacion_id)
    ),
    'resumen', jsonb_build_object(
      'A', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'A'),
      'F', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'F'),
      'P', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'P'),
      'R', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'R'),
      'S', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'S'),
      'L', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id and a.marca = 'L'),
      'total', (select count(*)::int from asistencia.asistencia a where a.lista_id = l.id)
    ),
    'asistencias', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'persona_id', p.id,
          'registro', p.registro,
          'nombre', p.nombres || ' ' || p.apellido_paterno,
          'marca', a.marca,
          'observacion', a.observacion
        )
        order by p.registro asc
      )
      from asistencia.asistencia a
      join personal.persona p on p.id = a.persona_id
      where a.lista_id = l.id
    ), '[]'::jsonb)
  )
  into v_res
  from asistencia.lista l
  left join asistencia.tipo_acto ta on ta.clave = l.tipo_acto_clave
  where l.id = p_lista_id;

  return v_res;
end
$$;
comment on function asistencia.detalle_parte(bigint) is
  'Detalle completo de un parte de asistencia (clave, dirección, comentarios y marcas nominales).';

grant execute on function asistencia.libro_anual(integer, text) to authenticated;
grant execute on function asistencia.detalle_parte(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Panel de Estadísticas (nucleo.estadisticas_compania)
-- ---------------------------------------------------------------------
create or replace function nucleo.estadisticas_compania(
  p_anio integer default extract(year from current_date)::int
)
returns jsonb
language plpgsql
stable
security definer
set search_path = nucleo, asistencia, personal, material, operaciones, seguridad, public
as $$
declare
  v_total_actos int;
  v_total_emergencias int;
  v_bomberos_activos int;
  v_asist_pct numeric;
  v_asignaciones_activas int;
  v_stock_bajo int;
  v_eventos_bitacora int;
  v_costo_mantenciones numeric;
begin
  if auth.uid() is null or seguridad.es_solo_cuartel() or not seguridad.tiene_permiso_modulo('estadisticas', 'lectura') then
    raise exception 'Sin permiso para consultar estadísticas.'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*)::int,
         count(*) filter (where coalesce(ta.categoria, 'otro') = 'emergencia')::int
    into v_total_actos, v_total_emergencias
  from asistencia.lista l
  left join asistencia.tipo_acto ta on ta.clave = l.tipo_acto_clave
  where l.anio = p_anio and l.estado <> 'anulada';

  select count(*)::int into v_bomberos_activos
  from personal.persona p
  where p.estado = 'activo';

  select coalesce(round(
    100.0 * count(*) filter (where a.marca = 'A')
    / nullif(count(*) filter (where a.marca in ('A', 'F', 'P', 'L')), 0),
    1
  ), 0)
  into v_asist_pct
  from asistencia.asistencia a
  join asistencia.lista l on l.id = a.lista_id
  where l.anio = p_anio and l.estado <> 'anulada';

  select count(*)::int into v_asignaciones_activas
  from material.asignacion
  where fecha_devolucion is null;

  select count(*)::int into v_stock_bajo
  from material.panol_stock
  where cantidad <= minimo;

  select count(*)::int,
         coalesce(sum(costo), 0)
    into v_eventos_bitacora, v_costo_mantenciones
  from material.bitacora_unidad
  where extract(year from fecha)::int = p_anio;

  return jsonb_build_object(
    'anio', p_anio,
    'resumen', jsonb_build_object(
      'total_actos', coalesce(v_total_actos, 0),
      'total_emergencias', coalesce(v_total_emergencias, 0),
      'asistencia_promedio_pct', coalesce(v_asist_pct, 0),
      'bomberos_activos', coalesce(v_bomberos_activos, 0),
      'total_asignaciones_activas', coalesce(v_asignaciones_activas, 0),
      'stock_bajo_count', coalesce(v_stock_bajo, 0),
      'eventos_bitacora', coalesce(v_eventos_bitacora, 0),
      'costo_mantenciones', coalesce(v_costo_mantenciones, 0)
    ),
    'actos_por_mes', (
      select jsonb_agg(
        jsonb_build_object(
          'mes', m.num,
          'etiqueta', m.etiqueta,
          'emergencias', coalesce(c.emergencias, 0),
          'otros', coalesce(c.otros, 0),
          'total', coalesce(c.total, 0)
        )
        order by m.num
      )
      from (values
        (1,'Ene'),(2,'Feb'),(3,'Mar'),(4,'Abr'),(5,'May'),(6,'Jun'),
        (7,'Jul'),(8,'Ago'),(9,'Sep'),(10,'Oct'),(11,'Nov'),(12,'Dic')
      ) as m(num, etiqueta)
      left join (
        select extract(month from l.fecha)::int as mes,
               count(*) filter (where coalesce(ta.categoria, 'otro') = 'emergencia')::int as emergencias,
               count(*) filter (where coalesce(ta.categoria, 'otro') <> 'emergencia')::int as otros,
               count(*)::int as total
        from asistencia.lista l
        left join asistencia.tipo_acto ta on ta.clave = l.tipo_acto_clave
        where l.anio = p_anio and l.estado <> 'anulada'
        group by 1
      ) c on c.mes = m.num
    ),
    'actos_por_clave', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select coalesce(l.tipo_acto_clave, 'OTRO') as clave,
               coalesce(ta.descripcion, 'Otro acto') as descripcion,
               coalesce(ta.categoria, 'otro') as categoria,
               count(*)::int as cantidad
        from asistencia.lista l
        left join asistencia.tipo_acto ta on ta.clave = l.tipo_acto_clave
        where l.anio = p_anio and l.estado <> 'anulada'
        group by 1, 2, 3
        order by cantidad desc, clave asc
        limit 12
      ) t
    ), '[]'::jsonb),
    'distribucion_marcas', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select a.marca::text as marca, count(*)::int as cantidad
        from asistencia.asistencia a
        join asistencia.lista l on l.id = a.lista_id
        where l.anio = p_anio and l.estado <> 'anulada'
        group by a.marca
        order by cantidad desc
      ) t
    ), '[]'::jsonb),
    'top_asistencia', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select v.registro, v.nombre,
               v.asistencias::int, v.faltas::int,
               coalesce(v.pct, 0) as pct
        from personal.v_asistencia_persona v
        join personal.persona p on p.id = v.persona_id
        where v.anio = p_anio and p.estado = 'activo'
        order by coalesce(v.pct, 0) desc, v.asistencias desc, v.registro asc
        limit 10
      ) t
    ), '[]'::jsonb),
    'menor_asistencia', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select v.registro, v.nombre,
               v.asistencias::int, v.faltas::int,
               coalesce(v.pct, 0) as pct
        from personal.v_asistencia_persona v
        join personal.persona p on p.id = v.persona_id
        where v.anio = p_anio and p.estado = 'activo'
          and (v.asistencias + v.faltas + v.permisos) > 0
        order by coalesce(v.pct, 0) asc, v.faltas desc, v.registro asc
        limit 10
      ) t
    ), '[]'::jsonb),
    'material_mas_asignado', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select art.nombre as articulo,
               coalesce(cat.nombre, 'Otros') as categoria,
               coalesce(sum(asig.cantidad) filter (where asig.fecha_devolucion is null), 0)::numeric as asignados,
               coalesce((select sum(ps.cantidad) from material.panol_stock ps where ps.articulo_id = art.id), 0)::numeric as stock_disponible
        from material.articulo art
        left join material.categoria_articulo cat on cat.id = art.categoria_id
        left join material.asignacion asig on asig.articulo_id = art.id
        group by art.id, art.nombre, cat.nombre
        order by asignados desc, art.nombre asc
        limit 8
      ) t
    ), '[]'::jsonb),
    'material_menos_asignado', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select art.nombre as articulo,
               coalesce(cat.nombre, 'Otros') as categoria,
               coalesce(sum(asig.cantidad) filter (where asig.fecha_devolucion is null), 0)::numeric as asignados,
               coalesce((select sum(ps.cantidad) from material.panol_stock ps where ps.articulo_id = art.id), 0)::numeric as stock_disponible
        from material.articulo art
        left join material.categoria_articulo cat on cat.id = art.categoria_id
        left join material.asignacion asig on asig.articulo_id = art.id
        group by art.id, art.nombre, cat.nombre
        order by asignados asc, stock_disponible asc, art.nombre asc
        limit 8
      ) t
    ), '[]'::jsonb),
    'stock_bajo', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select a.nombre as articulo, ps.talla, ps.cantidad, ps.minimo, ps.ubicacion
        from material.panol_stock ps
        join material.articulo a on a.id = ps.articulo_id
        where ps.cantidad <= ps.minimo
        order by (ps.cantidad - ps.minimo) asc, a.nombre asc
        limit 10
      ) t
    ), '[]'::jsonb),
    'solicitudes_estado', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select s.estado::text as estado, count(*)::int as cantidad
        from material.solicitud s
        group by s.estado
        order by cantidad desc
      ) t
    ), '[]'::jsonb),
    'unidades_resumen', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select u.id, u.codigo, u.marca, u.modelo, u.estado, u.km_actual,
               count(b.id) filter (where b.tipo = 'mantencion')::int as mantenciones,
               count(b.id) filter (where b.tipo = 'accidente')::int as accidentes,
               count(b.id)::int as total_eventos,
               coalesce(sum(b.costo), 0)::numeric as costo_total
        from material.unidad u
        left join material.bitacora_unidad b on b.unidad_id = u.id and extract(year from b.fecha)::int = p_anio
        group by u.id, u.codigo, u.marca, u.modelo, u.estado, u.km_actual
        order by u.codigo
      ) t
    ), '[]'::jsonb),
    'guardias_resumen', coalesce((
      select jsonb_build_object(
        'ciclo_nombre', c.nombre,
        'turnos_totales', count(t.id)::int,
        'turnos_cubiertos', count(t.id) filter (
          where (
            select count(*) from operaciones.guardia_integrante gi
            where gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
          ) >= c.cupo_base
        )::int,
        'pct_cobertura', coalesce(round(
          100.0 * count(t.id) filter (
            where (
              select count(*) from operaciones.guardia_integrante gi
              where gi.turno_id = t.id and gi.estado in ('inscrito', 'cumplida')
            ) >= c.cupo_base
          ) / nullif(count(t.id), 0),
          1
        ), 0)
      )
      from operaciones.guardia_ciclo c
      left join operaciones.guardia_turno t on t.ciclo_id = c.id
      where c.id = (
        select id from operaciones.guardia_ciclo
        order by case estado when 'en_curso' then 0 when 'abierto' then 1 else 2 end, fecha_inicio desc
        limit 1
      )
      group by c.id, c.nombre, c.cupo_base
    ), jsonb_build_object('ciclo_nombre', null, 'turnos_totales', 0, 'turnos_cubiertos', 0, 'pct_cobertura', 0))
  );
end
$$;
comment on function nucleo.estadisticas_compania(integer) is
  'Métricas consolidadas de emergencias, asistencia, inventario EPP, bitácora de unidades y guardias.';

grant execute on function nucleo.estadisticas_compania(integer) to authenticated;
