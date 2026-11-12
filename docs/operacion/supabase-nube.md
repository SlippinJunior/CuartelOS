# Supabase en la nube

## 1. Crear el proyecto
1. Entra a `supabase.com` y crea un proyecto.
2. Región: **South America (São Paulo)**.
3. Guarda la contraseña de la base de datos en un gestor de contraseñas.
4. Anota `Project URL`, `anon key` y `service_role key`.

## 2. Vincular el repositorio
```bash
supabase login
supabase link --project-ref <project-ref>
```

## 3. Aplicar migraciones
```bash
supabase db push
```
No ejecutes el seed ficticio en producción.

## 4. Configurar Auth
En Authentication → URL Configuration:
- Site URL: `https://<tu-dominio>`
- Redirect URLs: `https://<tu-dominio>/auth/establecer`

Verifica que el registro abierto esté desactivado. El sistema solo invita.

## 5. Esquemas expuestos
El `config.toml` ya declara `nucleo`, `personal`, `asistencia`, `operaciones`,
`material`, `tesoreria`, `secretaria`, `disciplina` y `documentos`.
`seguridad` **no** se expone. Confirma en Settings → API → Exposed schemas.

## 6. Storage
La migración `…_storage.sql` crea los buckets privados `documentos`,
`sensibles` y `material` con sus políticas. Verifica en Storage.

## 7. Edge Functions
```bash
supabase secrets set SITE_URL="https://<tu-dominio>"
supabase functions deploy invitar-usuario
supabase functions deploy emitir-documento
```
La `service_role` ya está disponible como variable del entorno de funciones.

## 8. pg_cron
Activa la extensión desde Database → Extensions si no quedó activa. La
migración programa `alertas-nocturnas` a las 06:00 UTC (03:00 Chile).

## 9. Datos reales
1. Importa el legado en local y genera `data/privado/seed_real.sql`.
2. Restaura en la nube:
```bash
psql "$DATABASE_URL_NUBE" -f data/privado/seed_real.sql
```
3. Verifica conteos y ejecuta `select seguridad.generar_alertas();`.
4. Invita al Director y luego al resto.

## 10. Primer usuario
El primer usuario se crea desde Authentication → Users (invitación) y se vincula
con:
```sql
select nucleo.registrar_usuario('<uuid>', 'director@…', '<persona-uuid>', 'director');
```
Después, ese Director invita al resto desde Administración.

## Checklist de salida a producción
- [ ] Registro abierto desactivado
- [ ] Redirect URLs correctas
- [ ] Buckets privados y políticas activas
- [ ] `seguridad` no expuesto
- [ ] Funciones desplegadas y secrets cargados
- [ ] pg_cron activo
- [ ] Respaldo inicial descargado
- [ ] Texto de consentimiento revisado por el Directorio
- [ ] Prueba de emisión P3 y verificación QR
- [ ] Prueba de pase de lista offline

## Relacionado con
`docs/operacion/cloudflare-pages.md`, `docs/arquitectura/seguridad.md`.
