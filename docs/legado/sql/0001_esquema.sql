-- =====================================================================
-- Plataforma de Gestión · Segunda Compañía de Bomberos de Limache
-- 0001 · Esquema base (PostgreSQL 15+ / Supabase)
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists unaccent;

create schema if not exists gestion;
set search_path = gestion, public;

-- ---------- Tipos ----------
create type estado_persona as enum ('activo','suspendido','renunciado','separado','expulsado','fallecido','trasladado');
create type rango_bombero  as enum ('aspirante','bombero','honorario','insigne','martir');
create type marca_asistencia as enum ('A','F','P','R','S','L');  -- Asiste, Falta, Permiso, eximido(R), Suspendido, Licencia
create type tipo_movimiento as enum ('ingreso','egreso');
create type estado_item as enum ('bueno','regular','malo','baja','sin_revisar');
create type origen_bien as enum ('compania','campana','donacion','cuerpo','propio');
create type estado_acuerdo as enum ('pendiente','en_curso','cumplido','anulado');
create type estado_alerta as enum ('abierta','en_revision','resuelta','descartada');
create type rol_sistema as enum ('admin','director','secretario','prosecretario','tesorero','protesorero','capitan','teniente','ayudante','consejo','bombero');

-- ---------- Compañía (preparado para más de una) ----------
create table compania (
  id smallint primary key,
  nombre text not null,
  cuerpo text not null,
  lema text
);

-- ---------- Personas ----------
create table persona (
  id uuid primary key default gen_random_uuid(),
  compania_id smallint not null references compania(id),
  registro int not null,                         -- N° de registro de compañía (204, 205…)
  rut text unique,
  nombres text not null,
  apellido_paterno text not null,
  apellido_materno text,
  fecha_nacimiento date,
  email text,
  telefono text,
  direccion text,
  grupo_sanguineo text,
  fecha_ingreso date,
  rango rango_bombero not null default 'bombero',
  estado estado_persona not null default 'activo',
  fecha_estado date,
  observaciones text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (compania_id, registro)
);
create or replace function normalizar(t text) returns text
language sql immutable parallel safe as $$ select lower(public.unaccent('public.unaccent'::regdictionary, coalesce(t,''))) $$;
create index persona_nombre_idx on persona (normalizar(apellido_paterno || ' ' || nombres));

-- Antigüedad calculada (no se guarda: siempre exacta)
create or replace function antiguedad_anios(p persona) returns int
language sql stable as $$ select case when p.fecha_ingreso is null then null
  else extract(year from age(current_date, p.fecha_ingreso))::int end $$;

-- Usuarios del sistema (Supabase Auth) ↔ persona y roles
create table usuario (
  user_id uuid primary key,            -- = auth.users.id
  persona_id uuid unique references persona(id),
  activo boolean not null default true
);
create table usuario_rol (
  user_id uuid references usuario(user_id) on delete cascade,
  rol rol_sistema not null,
  desde date not null default current_date,
  hasta date,
  primary key (user_id, rol, desde)
);

-- Cargos (oficialidad, consejo, comisiones) con historial
create table cargo_periodo (
  id bigserial primary key,
  persona_id uuid not null references persona(id),
  cargo text not null,                 -- 'Director', 'Secretario', 'Teniente 2-3', 'Consejero'…
  codigo text,                         -- 'P-21', '2-3', 'CH. 202'…
  desde date not null,
  hasta date,
  acta_id bigint,                      -- elección o nombramiento
  check (hasta is null or hasta >= desde)
);

-- Formación ANB y otros cursos
create table curso (
  id bigserial primary key,
  persona_id uuid not null references persona(id),
  nombre text not null,
  institucion text not null default 'Academia Nacional de Bomberos',
  nivel text,                          -- nivel ANB según malla vigente
  horas numeric(6,1),
  fecha_aprobacion date,
  vigente_hasta date,
  certificado_path text
);

-- Premios y distinciones
create table premio (
  id bigserial primary key,
  persona_id uuid not null references persona(id),
  tipo text not null,                  -- 'Constancia', 'Asistencia', 'Distinción'…
  anios int,                           -- 5, 10, 15… para constancia
  otorgado_por text,                   -- Compañía, Cuerpo, Junta Nacional
  fecha date,
  acta_id bigint,
  observacion text
);

-- Sanciones y Consejo de Disciplina
create table sancion (
  id bigserial primary key,
  persona_id uuid not null references persona(id),
  causa text not null,
  medida text not null,
  fecha date not null,
  desde date, hasta date,
  acta_id bigint,
  reservado boolean not null default true
);

-- ---------- Asistencia ----------
create table tipo_acto (
  clave text primary key,              -- '1','2','15-2','RO','REO','ACAD'…
  descripcion text not null,
  obligatorio boolean not null default false,
  cuenta_para_premio boolean not null default true
);
create table lista (
  id bigserial primary key,
  compania_id smallint not null references compania(id),
  numero int not null,
  anio int not null,
  fecha date not null,
  clave text references tipo_acto(clave),
  descripcion text,
  direccion text,
  origen text not null default 'manual', -- manual | importacion | viper
  ref_externa text,                      -- id del acto en VIPER u otro sistema
  unique (compania_id, anio, numero)
);
create table asistencia (
  lista_id bigint references lista(id) on delete cascade,
  persona_id uuid references persona(id),
  marca marca_asistencia not null,
  observacion text,
  primary key (lista_id, persona_id)
);

-- ---------- Capitanía: órdenes y guardias ----------
create table orden_capitania (
  id bigserial primary key,
  numero int not null, anio int not null,
  fecha date not null,
  materia text,
  texto text,
  archivo_path text,
  unique (numero, anio)
);
create table guardia (
  id bigserial primary key,
  orden_id bigint references orden_capitania(id),
  persona_id uuid not null references persona(id),
  inicio timestamptz not null,
  termino timestamptz,
  tipo text default 'nocturna',
  cumplida boolean
);

-- ---------- Material: unidades, inventario, prendas ----------
create table unidad (
  id bigserial primary key,
  codigo text unique not null,         -- 'M-21'
  tipo text not null,                  -- Convencional, Rescate, Forestal
  patente text, marca text, modelo text, anio int,
  transmision text, n_motor text, n_chasis text,
  responsable_id uuid references persona(id),
  estado text not null default 'operativa',
  km_actual int,
  revision_tecnica_vence date,
  seguro_vence date
);
create table articulo (                -- catálogo
  id bigserial primary key,
  nombre text not null,
  categoria text,                      -- EPP, tenida, herramienta, ERA, radio…
  vida_util_meses int,
  unique (nombre)
);
create table item_inventario (         -- un bien físico o lote
  id bigserial primary key,
  articulo_id bigint not null references articulo(id),
  unidad_id bigint references unidad(id),     -- null = bodega / persona
  ubicacion text,                      -- 'Cabina', 'Cajonera 3', 'Bodega'
  marca text,
  n_serie text,
  cantidad numeric(8,2) not null default 1,
  estado estado_item not null default 'sin_revisar',
  origen origen_bien not null default 'compania',
  campana_id bigint,
  fecha_adquisicion date,
  valor numeric(12,0),
  movimiento_id bigint,                -- compra en tesorería
  observacion text
);
create table asignacion (              -- prendas / EPP a cargo de un bombero
  id bigserial primary key,
  persona_id uuid not null references persona(id),
  articulo_id bigint not null references articulo(id),
  item_id bigint references item_inventario(id),
  cantidad numeric(6,1) not null default 1,
  talla text,
  fecha_entrega date,
  fecha_devolucion date,
  origen origen_bien not null default 'compania',
  campana_id bigint,
  acta_entrega_path text,
  observacion text
);
create table mantencion (
  id bigserial primary key,
  unidad_id bigint references unidad(id),
  item_id bigint references item_inventario(id),
  fecha date not null,
  tipo text not null,                  -- preventiva, correctiva, prueba hidrostática…
  detalle text,
  costo numeric(12,0),
  proxima date,
  movimiento_id bigint
);
create table revision_inventario (
  id bigserial primary key,
  unidad_id bigint references unidad(id),
  fecha date not null,
  responsable_id uuid references persona(id),
  observacion text
);

-- ---------- Tesorería ----------
create table categoria (
  id bigserial primary key,
  codigo text unique,                  -- '1001001'
  nombre text not null,
  tipo tipo_movimiento not null
);
create table presupuesto (
  id bigserial primary key,
  anio int not null,
  version int not null default 1,
  acta_id bigint,                      -- acta que lo aprueba
  vigente boolean not null default false,
  unique (anio, version)
);
create table presupuesto_linea (
  id bigserial primary key,
  presupuesto_id bigint not null references presupuesto(id) on delete cascade,
  categoria_id bigint references categoria(id),
  item text not null,
  tipo tipo_movimiento not null,
  monto_anual numeric(14,0) not null,
  detalle text
);
create table movimiento (
  id bigserial primary key,
  fecha date not null,
  tipo tipo_movimiento not null,
  categoria_id bigint references categoria(id),
  presupuesto_linea_id bigint references presupuesto_linea(id),
  monto numeric(14,0) not null check (monto > 0),
  glosa text not null,
  contraparte text,
  persona_id uuid references persona(id),
  n_documento text,
  medio_pago text,                     -- transferencia, efectivo, cheque
  comprobante_path text,
  tiene_comprobante boolean generated always as (comprobante_path is not null) stored,
  acuerdo_id bigint,
  anulado boolean not null default false,
  motivo_anulacion text,
  creado_en timestamptz not null default now()
);
create index movimiento_fecha_idx on movimiento (fecha);
create table cuota (
  persona_id uuid references persona(id),
  periodo date not null check (extract(day from periodo) = 1),  -- primer día del mes
  monto numeric(10,0) not null,
  movimiento_id bigint references movimiento(id),
  exento boolean not null default false,
  primary key (persona_id, periodo)
);
create table cierre_mensual (
  periodo date primary key,
  saldo_anterior numeric(14,0) not null,
  ingresos numeric(14,0) not null,
  egresos numeric(14,0) not null,
  saldo_final numeric(14,0) generated always as (saldo_anterior + ingresos - egresos) stored,
  saldo_cartola numeric(14,0),
  cheques_no_cobrados numeric(14,0) default 0,
  aprobado_acta_id bigint
);

-- Campaña económica
create table campana (
  id bigserial primary key,
  anio int unique not null,
  meta numeric(14,0),
  valor_talonario numeric(10,0),
  acta_id bigint
);
create table talonario (
  id bigserial primary key,
  campana_id bigint not null references campana(id),
  numero int not null,
  folio_desde int, folio_hasta int,
  persona_id uuid references persona(id),
  fecha_retiro date, fecha_devolucion date,
  monto_rendido numeric(12,0),
  movimiento_id bigint references movimiento(id),
  unique (campana_id, numero)
);
create table campana_saldo (           -- saldo a favor por bombero (para EPP)
  campana_id bigint references campana(id),
  persona_id uuid references persona(id),
  venta_total numeric(12,0) not null default 0,
  obligatorio numeric(12,0) not null default 0,
  adicional numeric(12,0) not null default 0,
  saldo_arrastre numeric(12,0) not null default 0,
  observacion text,
  primary key (campana_id, persona_id)
);

-- ---------- Secretaría ----------
create table acta (
  id bigserial primary key,
  tipo text not null,                  -- RO, REO, Junta de Oficiales, Consejo
  numero int,
  fecha date not null,
  lista_id bigint references lista(id),
  presentes int, permisos int,
  quorum_ok boolean,
  aprobada_en bigint references acta(id),
  archivo_path text,
  texto text
);
create table acuerdo (
  id bigserial primary key,
  acta_id bigint not null references acta(id) on delete cascade,
  numero int,
  texto text not null,
  votos_favor int, votos_contra int, abstenciones int,
  resultado text,
  monto numeric(14,0),
  responsable_id uuid references persona(id),
  plazo date,
  estado estado_acuerdo not null default 'pendiente',
  seguimiento text
);
create table acuerdo_movimiento (
  acuerdo_id bigint references acuerdo(id) on delete cascade,
  movimiento_id bigint references movimiento(id),
  primary key (acuerdo_id, movimiento_id)
);
create table correspondencia (
  id bigserial primary key,
  sentido text not null check (sentido in ('recibida','despachada')),
  numero text, fecha date not null,
  contraparte text, materia text,
  responde_a bigint references correspondencia(id),
  plazo_respuesta date,
  archivo_path text
);

-- Documentos adjuntos genéricos (Storage)
create table adjunto (
  id bigserial primary key,
  entidad text not null, entidad_id text not null,
  nombre text not null, path text not null,
  subido_por uuid, subido_en timestamptz not null default now()
);

-- ---------- Alertas (resultado de los cruces) ----------
create table alerta (
  id bigserial primary key,
  regla text not null,                 -- código de la regla (ver 0003)
  entidad text not null, entidad_id text not null,
  detalle text not null,
  severidad smallint not null default 2,  -- 1 alta · 2 media · 3 baja
  estado estado_alerta not null default 'abierta',
  responsable_id uuid references persona(id),
  evidencia text,
  detectada_en timestamptz not null default now(),
  resuelta_en timestamptz,
  unique (regla, entidad, entidad_id)
);

-- Llaves foráneas diferidas (tablas creadas después)
alter table cargo_periodo add foreign key (acta_id) references acta(id);
alter table premio add foreign key (acta_id) references acta(id);
alter table sancion add foreign key (acta_id) references acta(id);
alter table presupuesto add foreign key (acta_id) references acta(id);
alter table campana add foreign key (acta_id) references acta(id);
alter table cierre_mensual add foreign key (aprobado_acta_id) references acta(id);
alter table movimiento add foreign key (acuerdo_id) references acuerdo(id);
alter table item_inventario add foreign key (campana_id) references campana(id);
alter table item_inventario add foreign key (movimiento_id) references movimiento(id);
alter table asignacion add foreign key (campana_id) references campana(id);
alter table mantencion add foreign key (movimiento_id) references movimiento(id);

-- Área de carga para importar desde VIPER / Excel antes de validar
create table staging_importacion (
  id bigserial primary key,
  origen text not null,                -- 'viper_asistencia', 'excel_inventario'…
  archivo text,
  fila int,
  datos jsonb not null,
  estado text not null default 'pendiente',   -- pendiente | valida | error | importada
  error text,
  cargado_en timestamptz not null default now()
);
