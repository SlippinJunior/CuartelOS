-- =====================================================================
-- 20261112000300 · Documentos: archivos y tipos P1–P23
-- =====================================================================
set search_path = documentos, nucleo, seguridad, public;

create table documentos.archivo (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null,
  path        text not null,
  nombre      text not null,
  mime        text,
  tamano      bigint check (tamano is null or tamano >= 0),
  hash_sha256 text,
  subido_por  uuid default auth.uid(),
  subido_en   timestamptz not null default now(),
  unique (bucket, path)
);
comment on table documentos.archivo is 'Metadatos de cualquier archivo en Storage. Reemplaza el adjunto polimórfico y los *_path repetidos.';
comment on column documentos.archivo.hash_sha256 is 'Huella del contenido, usada en documentos emitidos.';

create table documentos.tipo_documento (
  codigo      text primary key,
  nombre      text not null,
  descripcion text,
  modulo      text not null,
  requiere_firma boolean not null default true
);
comment on table documentos.tipo_documento is 'Catálogo de puntos de impresión P1–P23 del ERP.';

insert into documentos.tipo_documento (codigo, nombre, descripcion, modulo) values
  ('P1',  'Expediente de postulación', 'Solicitud de ingreso con antecedentes del postulante.', 'secretaria'),
  ('P2',  'Acta de votación de ingreso', 'Votación de la Junta de Oficiales sobre el ingreso.', 'secretaria'),
  ('P3',  'Hoja de vida', 'Hoja de vida completa del bombero con folio y verificación QR.', 'personal'),
  ('P4',  'Comunicación de altas y bajas', 'Comunicación al Cuerpo y a la Comandancia.', 'secretaria'),
  ('P5',  'Certificado de concurrencia a emergencia', 'Certificado para el empleador del voluntario.', 'operaciones'),
  ('P6',  'Informe de accidente en acto de servicio', 'Parte de accidente dentro de 24 horas.', 'operaciones'),
  ('P7',  'Rol de guardia nocturna y libro de guardia', 'Rol e informe diario de guardia.', 'operaciones'),
  ('P8',  'Hoja de cargo de vestuario y EPP', 'Entrega y devolución de vestuario y equipos.', 'material'),
  ('P9',  'Certificado de paz y salvo de cargo', 'Certificado al devolver el cargo.', 'material'),
  ('P10', 'Bitácora e informe de unidades', 'Bitácora mensual de cada unidad.', 'material'),
  ('P11', 'Listas de asistencia y abono', 'Respaldo de asistencia y abonos.', 'asistencia'),
  ('P12', 'Informe de premios de constancia', 'Cortes al 30 de noviembre y 30 de marzo.', 'personal'),
  ('P13', 'Estado financiero mensual y cuadro de deudas', 'Estado mensual y deudas pendientes.', 'tesoreria'),
  ('P14', 'Rendición de fondos públicos', 'Rendición conforme a Res. 30/2015 CGR.', 'tesoreria'),
  ('P15', 'Padrón electoral certificado', 'Padrón para elecciones de la compañía.', 'secretaria'),
  ('P16', 'Notificaciones disciplinarias', 'Notificación al afectado por el Consejo.', 'disciplina'),
  ('P17', 'Acta de entrega o recepción de cargo', 'Traspaso de cargo entre saliente y electo.', 'secretaria'),
  ('P18', 'Inventarios de apertura', 'Inventario anual de apertura.', 'material'),
  ('P19', 'Nómina anual de voluntarios', 'Nómina oficial de voluntarios al 1 de enero.', 'personal'),
  ('P20', 'Memoria anual', 'Memoria de la compañía para la Comandancia.', 'secretaria'),
  ('P21', 'Balance anual de ingresos y gastos', 'Balance anual de la compañía.', 'tesoreria'),
  ('P22', 'Informe de beneficios y registro de donaciones', 'Beneficios y donaciones por evento y año.', 'tesoreria'),
  ('P23', 'Carpeta anual de cumplimiento', 'Carpeta de cumplimiento al cierre del año.', 'secretaria');

alter table documentos.archivo        enable row level security;
alter table documentos.tipo_documento enable row level security;

create policy archivo_lectura on documentos.archivo for select
  using (subido_por = auth.uid() or seguridad.es_oficial());
create policy archivo_escritura on documentos.archivo for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
create policy tipo_documento_lectura on documentos.tipo_documento for select using (true);
create policy tipo_documento_admin on documentos.tipo_documento for all
  using (seguridad.tiene_rol('admin', 'director'))
  with check (seguridad.tiene_rol('admin', 'director'));

grant usage on schema documentos to authenticated, anon;
grant select, insert, update, delete on all tables in schema documentos to authenticated;
grant usage, select on all sequences in schema documentos to authenticated;

alter table nucleo.compania
  add constraint compania_logo_fk
  foreign key (logo_archivo_id) references documentos.archivo(id) on delete set null;
