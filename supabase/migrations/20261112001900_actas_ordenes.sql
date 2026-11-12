-- =====================================================================
-- 20261112001900 · Documentos: actas de reunión y órdenes de capitanía
-- =====================================================================
set search_path = documentos, operaciones, secretaria, public;

insert into documentos.tipo_documento (codigo, nombre, descripcion, modulo, requiere_firma) values
  ('ACTA', 'Acta de reunión', 'Acta de sesión de compañía, oficiales o asamblea.', 'secretaria', true),
  ('ORDEN_CAPITANIA', 'Orden de capitanía', 'Orden emitida por la Capitanía y comunicada a la compañía.', 'operaciones', true)
on conflict (codigo) do update
  set nombre = excluded.nombre,
      descripcion = excluded.descripcion,
      modulo = excluded.modulo;

alter table operaciones.orden_capitania
  add column if not exists enviada_en timestamptz,
  add column if not exists correo_estado text,
  add column if not exists correo_destinatarios integer;

comment on column operaciones.orden_capitania.enviada_en is 'Última vez que la orden se envió por correo.';
comment on column operaciones.orden_capitania.correo_estado is 'Resultado legible del último envío (por ejemplo "30/30 enviados").';
comment on column operaciones.orden_capitania.correo_destinatarios is 'Cantidad de destinatarios a los que se intentó enviar.';

create index if not exists orden_capitania_fecha_idx on operaciones.orden_capitania (fecha desc, anio desc, numero desc);
