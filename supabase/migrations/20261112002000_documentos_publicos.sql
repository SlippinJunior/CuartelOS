-- =====================================================================
-- 20261112002000 · Documentos consultables por la compañía
-- =====================================================================
-- Las órdenes de capitanía y las actas aprobadas son documentos internos
-- que todo bombero autenticado puede consultar. No exponen datos sensibles.
set search_path = documentos, secretaria, seguridad, public;

create policy documento_orden_lectura on documentos.documento_emitido
  for select using (tipo_documento_codigo = 'ORDEN_CAPITANIA');

create policy documento_acta_aprobada on documentos.documento_emitido
  for select using (
    tipo_documento_codigo = 'ACTA'
    and exists (
      select 1
      from secretaria.acta a
      where a.id = nullif(split_part(documentos.documento_emitido.referencia, ':', 2), '')::bigint
        and a.aprobada_en_acta_id is not null
    )
  );

-- Permite leer la ruta del archivo cuando el documento vinculado es visible
-- para el llamador. La RLS de documento_emitido filtra el resto.
create policy archivo_documento_visible on documentos.archivo
  for select using (
    exists (
      select 1
      from documentos.documento_emitido d
      where d.pdf_archivo_id = documentos.archivo.id
    )
  );
