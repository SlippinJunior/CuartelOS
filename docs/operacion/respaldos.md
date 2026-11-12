# Respaldos y restauración

## Qué respaldar
1. **Base de datos** (esquemas de negocio, sin `seguridad.auditoria` si el
   volumen es alto).
2. **Storage** (`documentos`, `sensibles`, `material`).
3. **Configuración**: `config.toml`, secrets (en gestor de contraseñas) y
   versión del repositorio.

## Frecuencia sugerida
| Dato | Frecuencia | Retención |
|---|---|---|
| Base de datos | Diaria automática (Supabase) + semanal manual | 30 días / 12 semanas |
| Storage | Semanal | 8 semanas |
| Respaldo antes de migrar | Siempre | Permanente hasta validar |

## Respaldo manual de la base
```bash
pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges \
  --exclude-table=seguridad.auditoria \
  -Fc -f data/privado/respaldo_$(date +%F).dump
```
Para un respaldo lógico legible:
```bash
pg_dump "$DATABASE_URL" --data-only --inserts --on-conflict-do-nothing \
  --exclude-table=seguridad.auditoria -f data/privado/seed_real.sql
```

## Restauración
```bash
# base vacía con migraciones aplicadas
pg_restore --no-owner --no-privileges -d "$DATABASE_URL" data/privado/respaldo_2026-11-12.dump
```
O con SQL:
```bash
psql "$DATABASE_URL" -f data/privado/seed_real.sql
```
Después:
```sql
select count(*) from personal.persona;
select count(*) from asistencia.lista;
select seguridad.generar_alertas();
```

## Storage
```bash
supabase storage download --experimental documentos ./respaldo/documentos
```
O usa la API de Storage con la clave de servicio. Verifica que los objetos
conserven la ruta registrada en `documentos.archivo`.

## Prueba de restauración
Una vez al trimestre:
1. Restaura en una base de prueba.
2. Compara conteos con producción.
3. Abre un PDF emitido y verifica su hash.
4. Documenta el resultado.

## Rotación de claves
- Si se filtra la `service_role`, rótala de inmediato y vuelve a desplegar las
  funciones.
- La `anon key` es pública; su seguridad depende de RLS.
- Las contraseñas de usuarios se gestionan en Supabase Auth.

## Relacionado con
`docs/operacion/supabase-nube.md`, `data/README.md`.
