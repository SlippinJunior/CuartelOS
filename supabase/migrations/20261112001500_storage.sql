-- =====================================================================
-- 20261112001500 · Storage: buckets privados y políticas
-- =====================================================================
-- Se ejecuta solo si el esquema storage de Supabase está disponible, para
-- que el mismo archivo pueda aplicarse en PostgreSQL puro (pruebas).
-- Buckets: documentos (PDF y adjuntos), sensibles (salud), material (fotos 2D).
-- =====================================================================
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values
      ('documentos', 'documentos', false, 20971520),
      ('sensibles', 'sensibles', false, 10485760),
      ('material', 'material', false, 20971520)
    on conflict (id) do update set public = false;

    execute 'drop policy if exists documentos_lectura on storage.objects';
    execute $p$
      create policy documentos_lectura on storage.objects for select
      using (bucket_id = 'documentos' and auth.role() = 'authenticated')
    $p$;

    execute 'drop policy if exists documentos_escritura on storage.objects';
    execute $p$
      create policy documentos_escritura on storage.objects for insert
      with check (
        bucket_id = 'documentos'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] in ('emitidos', 'adjuntos', 'comprobantes')
      )
    $p$;

    execute 'drop policy if exists documentos_actualizacion on storage.objects';
    execute $p$
      create policy documentos_actualizacion on storage.objects for update
      using (bucket_id = 'documentos' and auth.role() = 'authenticated');
    $p$;

    execute 'drop policy if exists material_lectura on storage.objects';
    execute $p$
      create policy material_lectura on storage.objects for select
      using (bucket_id = 'material' and auth.role() = 'authenticated')
    $p$;

    execute 'drop policy if exists material_escritura on storage.objects';
    execute $p$
      create policy material_escritura on storage.objects for insert
      with check (
        bucket_id = 'material'
        and seguridad.tiene_rol('capitan', 'teniente_3', 'director', 'admin')
      )
    $p$;

    execute 'drop policy if exists sensibles_lectura on storage.objects';
    execute $p$
      create policy sensibles_lectura on storage.objects for select
      using (bucket_id = 'sensibles' and seguridad.es_oficial())
    $p$;

    execute 'drop policy if exists sensibles_escritura on storage.objects';
    execute $p$
      create policy sensibles_escritura on storage.objects for insert
      with check (
        bucket_id = 'sensibles'
        and seguridad.tiene_rol('secretario', 'director', 'admin')
      )
    $p$;
  end if;
end
$$;
