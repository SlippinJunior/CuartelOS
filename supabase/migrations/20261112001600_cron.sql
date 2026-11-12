-- =====================================================================
-- 20261112001600 · pg_cron: alertas nocturnas
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('alertas-nocturnas');
    exception when others then
      null;
    end;
    perform cron.schedule(
      'alertas-nocturnas',
      '0 6 * * *', -- 06:00 UTC ≈ 03:00 Chile
      'select seguridad.generar_alertas()'
    );
  end if;
end
$$;
