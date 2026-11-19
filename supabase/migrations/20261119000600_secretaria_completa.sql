-- =====================================================================
-- 20261119000600 · Secretaría completa: actas, acuerdos, correspondencia,
-- postulaciones, altas y bajas
-- =====================================================================
set search_path = secretaria, personal, documentos, nucleo, seguridad, public;

-- ---------------------------------------------------------------------
-- Actas: secciones reglamentarias y protección de actas aprobadas
-- ---------------------------------------------------------------------
alter table secretaria.acta
  add column if not exists secciones jsonb,
  add column if not exists actualizado_en timestamptz not null default now();

comment on column secretaria.acta.secciones is 'Editor estructurado: hora_inicio, hora_termino, preside, acta_anterior, correspondencia, cuenta_oficiales, incidentes, varios.';
comment on column secretaria.acta.actualizado_en is 'Última modificación del acta.';

drop trigger if exists acta_actualizado on secretaria.acta;
create trigger acta_actualizado
  before update on secretaria.acta
  for each row execute function nucleo.actualizado_en();

-- Un acta aprobada solo puede ser corregida por Director o admin.
create or replace function secretaria.fn_proteger_acta_aprobada()
returns trigger
language plpgsql
security definer
set search_path = secretaria, seguridad, public
as $$
begin
  if old.aprobada_en_acta_id is not null
     and (new.texto is distinct from old.texto
          or new.secciones is distinct from old.secciones)
     and not (seguridad.tiene_rol('director', 'admin')
              or coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') in ('service_role', 'postgres')) then
    raise exception 'El acta ya está aprobada: solo Director o admin pueden corregir su contenido.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end
$$;

drop trigger if exists acta_protegida on secretaria.acta;
create trigger acta_protegida
  before update on secretaria.acta
  for each row execute function secretaria.fn_proteger_acta_aprobada();

-- ---------------------------------------------------------------------
-- Postulaciones (Reglamento arts. 6, 7 y 8)
-- ---------------------------------------------------------------------
alter table personal.postulacion
  add column if not exists fecha_nacimiento date,
  add column if not exists direccion text,
  add column if not exists comuna text,
  add column if not exists profesion text,
  add column if not exists patrocinante_1_id uuid references personal.persona(id) on delete set null,
  add column if not exists patrocinante_2_id uuid references personal.persona(id) on delete set null,
  add column if not exists requisitos jsonb not null default '{}'::jsonb,
  add column if not exists resultado_votacion text,
  add column if not exists fecha_votacion date,
  add column if not exists acta_votacion_id bigint references secretaria.acta(id) on delete set null,
  add column if not exists puede_repostular_desde date,
  add column if not exists persona_creada_id uuid references personal.persona(id) on delete set null,
  add column if not exists plazo_bombero_inicial date,
  add column if not exists prorroga_hasta date,
  add column if not exists prorroga_motivo text;

alter table personal.postulacion
  drop constraint if exists postulacion_resultado_votacion_check;
alter table personal.postulacion
  add constraint postulacion_resultado_votacion_check
  check (resultado_votacion is null or resultado_votacion in ('aceptada', 'rechazada'));

comment on column personal.postulacion.requisitos is 'Checklist art. 7: mayor_18, ensenanza_media, declaracion_jurada, cert_nacimiento, cert_antecedentes, salud_fisica, salud_mental, cert_estudios.';
comment on column personal.postulacion.resultado_votacion is 'Solo aceptada o rechazada; el art. 7 no registra número de votos.';
comment on column personal.postulacion.puede_repostular_desde is 'Seis meses después de un rechazo (art. 7).';
comment on column personal.postulacion.plazo_bombero_inicial is 'Seis meses desde la aceptación para completar el período de bombero inicial (art. 8).';
comment on column personal.postulacion.prorroga_hasta is 'Prórroga única de hasta 3 meses autorizada por el Capitán (art. 8).';

create index if not exists postulacion_estado_idx on personal.postulacion (estado, fecha_solicitud desc);

-- ---------------------------------------------------------------------
-- RPC: crear acta con ID seguro y número correlativo
-- ---------------------------------------------------------------------
create or replace function secretaria.crear_acta(
  p_tipo text,
  p_fecha date,
  p_lista_id bigint default null,
  p_quorum boolean default null,
  p_secciones jsonb default null,
  p_texto text default null
)
returns bigint
language plpgsql
security definer
set search_path = secretaria, seguridad, public
as $$
declare
  v_id bigint;
  v_numero integer;
begin
  if not seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin') then
    raise exception 'Solo Secretaría o Director pueden crear actas.' using errcode = 'insufficient_privilege';
  end if;

  -- Siguiente número por tipo y año; se protege contra concurrencia con el
  -- bloqueo de la tabla de actas durante el cálculo.
  perform pg_advisory_xact_lock(hashtext('acta_' || p_tipo || '_' || extract(year from p_fecha)::text));

  select coalesce(max(a.numero), 0) + 1 into v_numero
    from secretaria.acta a
   where a.tipo_sesion_codigo = p_tipo
     and a.anio = extract(year from p_fecha)::int;

  -- El seed y la importación cargan IDs explícitos; se avanza la secuencia
  -- antes de insertar para no repetir un ID existente.
  perform setval(
    pg_get_serial_sequence('secretaria.acta', 'id'),
    greatest(coalesce((select max(a.id) from secretaria.acta a), 0), 1)
  );

  insert into secretaria.acta (tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok, secciones, texto)
  values (p_tipo, v_numero, extract(year from p_fecha)::int, p_fecha, p_lista_id, p_quorum, p_secciones, p_texto)
  returning id into v_id;

  return v_id;
end
$$;
comment on function secretaria.crear_acta(text, date, bigint, boolean, jsonb, text) is 'Crea un acta con número correlativo por tipo y año, sin depender de la secuencia interna.';

grant execute on function secretaria.crear_acta(text, date, bigint, boolean, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- RPC: compromiso desde un acuerdo
-- ---------------------------------------------------------------------
create or replace function secretaria.crear_compromiso_desde_acuerdo(
  p_acuerdo_id bigint,
  p_categoria_id bigint default null,
  p_fecha_estimada date default null
)
returns bigint
language plpgsql
security definer
set search_path = secretaria, tesoreria, seguridad, public
as $$
declare
  v_acuerdo secretaria.acuerdo;
  v_id bigint;
begin
  if not seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'tesorero', 'admin') then
    raise exception 'Solo Secretaría, Tesorería o Director pueden crear compromisos desde acuerdos.'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_acuerdo from secretaria.acuerdo where id = p_acuerdo_id;
  if v_acuerdo.id is null then raise exception 'El acuerdo no existe.'; end if;
  if v_acuerdo.monto is null or v_acuerdo.monto <= 0 then
    raise exception 'El acuerdo no tiene monto para generar un compromiso.';
  end if;

  select c.id into v_id from tesoreria.compromiso c where c.acuerdo_id = p_acuerdo_id limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into tesoreria.compromiso (
    descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id
  ) values (
    left('Acuerdo: ' || v_acuerdo.texto, 240),
    v_acuerdo.monto,
    coalesce(p_fecha_estimada, v_acuerdo.plazo),
    'comprometido',
    p_acuerdo_id,
    p_categoria_id
  ) returning id into v_id;

  if v_acuerdo.estado = 'pendiente' then
    update secretaria.acuerdo set estado = 'en_curso' where id = p_acuerdo_id;
  end if;

  return v_id;
end
$$;
comment on function secretaria.crear_compromiso_desde_acuerdo(bigint, bigint, date) is 'Genera el compromiso de tesorería de un acuerdo con monto, sin duplicar.';

-- ---------------------------------------------------------------------
-- RPC: votación de postulación (art. 7, sin conteo de votos)
-- ---------------------------------------------------------------------
create or replace function secretaria.registrar_votacion_postulacion(
  p_postulacion_id bigint,
  p_resultado text,
  p_fecha date default current_date,
  p_acta_id bigint default null,
  p_observaciones text default null
)
returns void
language plpgsql
security definer
set search_path = personal, secretaria, seguridad, public
as $$
begin
  if not seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin') then
    raise exception 'Solo Secretaría o Director registran la votación de ingreso.'
      using errcode = 'insufficient_privilege';
  end if;
  if p_resultado not in ('aceptada', 'rechazada') then
    raise exception 'El resultado debe ser aceptada o rechazada.';
  end if;
  if not exists (select 1 from personal.postulacion where id = p_postulacion_id) then
    raise exception 'La postulación no existe.';
  end if;

  update personal.postulacion
     set estado = p_resultado::personal.estado_postulacion,
         resultado_votacion = p_resultado,
         fecha_votacion = p_fecha,
         acta_votacion_id = p_acta_id,
         observaciones = coalesce(p_observaciones, observaciones),
         puede_repostular_desde = case when p_resultado = 'rechazada'
                                       then (p_fecha + interval '6 months')::date
                                  end,
         plazo_bombero_inicial = case when p_resultado = 'aceptada'
                                      then (p_fecha + interval '6 months')::date
                                 end,
         decidido_por = seguridad.mi_persona(),
         decidido_en = now()
   where id = p_postulacion_id;
end
$$;
comment on function secretaria.registrar_votacion_postulacion(bigint, text, date, bigint, text) is 'Registra aceptada o rechazada sin número de votos (art. 7).';

-- ---------------------------------------------------------------------
-- RPC: incorporar aspirante (art. 8)
-- ---------------------------------------------------------------------
create or replace function secretaria.incorporar_aspirante(
  p_postulacion_id bigint,
  p_registro integer
)
returns uuid
language plpgsql
security definer
set search_path = personal, secretaria, seguridad, public
as $$
declare
  v_post personal.postulacion;
  v_id uuid;
begin
  if not seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin') then
    raise exception 'Solo Secretaría o Director incorporan aspirantes.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_post from personal.postulacion where id = p_postulacion_id;
  if v_post.id is null then raise exception 'La postulación no existe.'; end if;
  if v_post.resultado_votacion is distinct from 'aceptada' then
    raise exception 'Solo se incorpora una postulación aceptada.';
  end if;
  if v_post.persona_creada_id is not null then
    raise exception 'La postulación ya generó una ficha de persona.';
  end if;
  if exists (select 1 from personal.persona where registro = p_registro) then
    raise exception 'El registro % ya está en uso.', p_registro;
  end if;

  insert into personal.persona (
    compania_id, registro, rut, nombres, apellido_paterno, apellido_materno,
    fecha_nacimiento, email, telefono, direccion, fecha_ingreso, rango, estado
  ) values (
    1, p_registro, v_post.rut, v_post.nombres, v_post.apellido_paterno, v_post.apellido_materno,
    v_post.fecha_nacimiento, v_post.email, v_post.telefono, v_post.direccion,
    current_date, 'aspirante', 'activo'
  ) returning id into v_id;

  update personal.postulacion
     set persona_creada_id = v_id,
         plazo_bombero_inicial = coalesce(plazo_bombero_inicial, (current_date + interval '6 months')::date)
   where id = p_postulacion_id;

  return v_id;
end
$$;
comment on function secretaria.incorporar_aspirante(bigint, integer) is 'Crea la ficha de persona como aspirante desde una postulación aceptada.';

-- ---------------------------------------------------------------------
-- RPC: prórroga de bombero inicial (art. 8, una sola, hasta 3 meses)
-- ---------------------------------------------------------------------
create or replace function secretaria.prorrogar_aspirante(
  p_postulacion_id bigint,
  p_nueva_fecha date,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = personal, seguridad, public
as $$
declare
  v_post personal.postulacion;
  v_base date;
  v_limite date;
begin
  if not seguridad.tiene_rol('capitan', 'director', 'admin') then
    raise exception 'Solo Capitán, Director o admin autorizan la prórroga.' using errcode = 'insufficient_privilege';
  end if;
  if length(trim(coalesce(p_motivo, ''))) < 3 then
    raise exception 'Debe indicar el motivo de la prórroga.';
  end if;

  select * into v_post from personal.postulacion where id = p_postulacion_id;
  if v_post.id is null then raise exception 'La postulación no existe.'; end if;
  if v_post.plazo_bombero_inicial is null then
    raise exception 'La postulación no tiene plazo de bombero inicial.';
  end if;
  if v_post.prorroga_hasta is not null then
    raise exception 'La prórroga ya fue usada: solo se permite una vez.';
  end if;

  v_base := v_post.plazo_bombero_inicial;
  v_limite := (v_base + interval '3 months')::date;

  if p_nueva_fecha <= v_base or p_nueva_fecha > v_limite then
    raise exception 'La prórroga debe ser posterior al plazo actual (%) y no superar 3 meses (%).',
      v_base, v_limite;
  end if;

  update personal.postulacion
     set prorroga_hasta = p_nueva_fecha,
         prorroga_motivo = p_motivo
   where id = p_postulacion_id;
end
$$;
comment on function secretaria.prorrogar_aspirante(bigint, date, text) is 'Prórroga única de hasta 3 meses del período de bombero inicial (art. 8).';

-- ---------------------------------------------------------------------
-- RPC: altas y bajas (art. 51 i)
-- ---------------------------------------------------------------------
create or replace function secretaria.altas_y_bajas(
  p_desde date default (current_date - 90),
  p_hasta date default current_date
)
returns table (
  evento_id bigint,
  persona_id uuid,
  registro integer,
  nombre text,
  tipo personal.tipo_evento,
  fecha date,
  estado_actual personal.estado_persona,
  vence_plazo date,
  dentro_plazo boolean,
  comunicado boolean,
  documento_id uuid
)
language plpgsql
stable
security definer
set search_path = personal, documentos, seguridad, public
as $$
begin
  if not seguridad.es_oficial() then
    raise exception 'Sin permiso para ver altas y bajas.' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    e.id,
    p.id,
    p.registro,
    p.nombres || ' ' || p.apellido_paterno,
    e.tipo,
    e.fecha,
    p.estado,
    (e.fecha + 3)::date as vence_plazo,
    current_date <= (e.fecha + 3)::date as dentro_plazo,
    exists (
      select 1 from documentos.documento_emitido d
      where d.tipo_documento_codigo = 'P4'
        and d.referencia like '%EVENTO:' || e.id || '%'
    ) as comunicado,
    (
      select d.id from documentos.documento_emitido d
      where d.tipo_documento_codigo = 'P4'
        and d.referencia like '%EVENTO:' || e.id || '%'
      order by d.emitido_en desc limit 1
    ) as documento_id
  from personal.persona_evento e
  join personal.persona p on p.id = e.persona_id
  where e.tipo in ('alta', 'cambio_estado', 'reincorporacion', 'traslado')
    and e.fecha between p_desde and p_hasta
  order by e.fecha desc;
end
$$;
comment on function secretaria.altas_y_bajas(date, date) is 'Eventos de alta, cambio de estado, reincorporación y traslado con plazo de comunicación de 3 días (art. 51 i).';

-- ---------------------------------------------------------------------
-- Alertas R15 y R16
-- ---------------------------------------------------------------------
insert into nucleo.regla_alerta (codigo, nombre, descripcion, severidad) values
  ('R15_CORRESPONDENCIA_VENCE', 'Correspondencia por vencer', 'Carta recibida con plazo de respuesta en 3 días o vencido, sin respuesta registrada.', 2),
  ('R16_ASPIRANTE_PLAZO_BI', 'Plazo de bombero inicial', 'Aspirante aceptado cuyo plazo de bombero inicial o prórroga vence en 30 días o menos.', 2)
on conflict (codigo) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion, severidad = excluded.severidad;

create or replace function secretaria.generar_alertas_secretaria()
returns integer
language plpgsql
security definer
set search_path = secretaria, personal, nucleo, seguridad, public
as $$
declare
  n integer := 0;
  k integer;
begin
  -- R15 · correspondencia recibida por vencer o vencida sin respuesta.
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R15_CORRESPONDENCIA_VENCE', 'correspondencia', c.id::text,
         format('Carta N° %s de %s: plazo de respuesta %s.',
                coalesce(c.numero, 's/n'),
                coalesce((select n.nombre from nucleo.contraparte n where n.id = c.contraparte_id), 'sin contraparte'),
                to_char(c.plazo_respuesta, 'DD-MM-YYYY')), 2
  from secretaria.correspondencia c
  where c.sentido = 'recibida'
    and c.plazo_respuesta is not null
    and c.plazo_respuesta <= current_date + 3
    and not exists (
      select 1 from secretaria.correspondencia r where r.responde_a_id = c.id
    )
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  -- R16 · plazo de bombero inicial por vencer.
  insert into nucleo.alerta (regla, entidad, entidad_id, detalle, severidad)
  select 'R16_ASPIRANTE_PLAZO_BI', 'postulacion', p.id::text,
         format('%s %s: el plazo de bombero inicial vence el %s.',
                p.nombres, p.apellido_paterno,
                to_char(coalesce(p.prorroga_hasta, p.plazo_bombero_inicial), 'DD-MM-YYYY')), 2
  from personal.postulacion p
  where p.resultado_votacion = 'aceptada'
    and coalesce(p.prorroga_hasta, p.plazo_bombero_inicial) is not null
    and coalesce(p.prorroga_hasta, p.plazo_bombero_inicial) <= current_date + 30
  on conflict (regla, entidad, entidad_id) do nothing;
  get diagnostics k = row_count; n := n + k;

  return n;
end
$$;
comment on function secretaria.generar_alertas_secretaria() is 'Reglas R15 y R16 de Secretaría.';

-- ---------------------------------------------------------------------
-- Integrar en la función nocturna
-- ---------------------------------------------------------------------
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('seguridad.generar_alertas()'::regprocedure) into v_def;
  if v_def not like '%generar_alertas_secretaria%' then
    v_def := replace(v_def,
      '  n := n + operaciones.generar_alertas_guardia();',
      '  n := n + operaciones.generar_alertas_guardia();' || chr(10) ||
      '  n := n + secretaria.generar_alertas_secretaria();');
    execute v_def;
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- RLS y permisos
-- ---------------------------------------------------------------------
create policy postulacion_secretaria on personal.postulacion for select
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin', 'capitan'));

create policy postulacion_escritura_secretaria on personal.postulacion for all
  using (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'))
  with check (seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin'));

-- Documentos emitidos P1, P2 y P4: solo Secretaría y Director.
create policy documento_secretaria on documentos.documento_emitido for select
  using (
    tipo_documento_codigo in ('P1', 'P2', 'P4')
    and seguridad.tiene_rol('secretario', 'prosecretario', 'director', 'admin')
  );

grant execute on function secretaria.crear_compromiso_desde_acuerdo(bigint, bigint, date) to authenticated;
grant execute on function secretaria.registrar_votacion_postulacion(bigint, text, date, bigint, text) to authenticated;
grant execute on function secretaria.incorporar_aspirante(bigint, integer) to authenticated;
grant execute on function secretaria.prorrogar_aspirante(bigint, date, text) to authenticated;
grant execute on function secretaria.altas_y_bajas(date, date) to authenticated;
grant execute on function secretaria.generar_alertas_secretaria() to service_role;
