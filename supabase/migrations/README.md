# supabase/migrations/ · Migraciones

## Propósito
Construir el modelo nuevo desde cero. Las migraciones originales (`0001`–`0004`)
se conservan intactas en `docs/legado/sql/`.

## Contenido
| Orden | Archivo | Qué crea |
|---|---|---|
| 000000 | `…_extensiones_esquemas.sql` | pgcrypto, unaccent, btree_gist; 10 esquemas y utilidades |
| 000100 | `…_seguridad.sql` | Rol enum, usuarios, roles, consentimiento, auditoría con IP, helpers RLS |
| 000200 | `…_nucleo.sql` | Compañía única, parámetros, feriados, contrapartes, alertas, staging |
| 000300 | `…_documentos_archivo.sql` | `archivo`, tipos P1–P23 y logo de la compañía |
| 000400 | `…_personal.sql` | Persona, eventos, sensibles, licencias, abonos, cargos, cursos, premios, postulaciones |
| 000500 | `…_asistencia.sql` | Tipos de acto, listas, marcas, triggers de lista cerrada y RPC |
| 000600 | `…_operaciones.sql` | Órdenes, turnos de guardia e integrantes, accidentes |
| 000700 | `…_material.sql` | Unidades, vistas 2D, ubicaciones, artículos, ítems, revisiones |
| 000800 | `…_tesoreria.sql` | Cuentas, fondos, presupuesto, movimientos, compromisos, recurrentes, proyección |
| 000900 | `…_secretaria.sql` | Actas, acuerdos, correspondencia, elecciones, traspasos y FKs diferidas |
| 001000 | `…_disciplina.sql` | Expedientes, sanciones, medidas y plazos reservados |
| 001100 | `…_documentos_emision.sql` | Folios, documento emitido, emisión y verificación pública |
| 001200 | `…_auditoria_triggers.sql` | Auditoría en todas las tablas de negocio |
| 001300 | `…_vistas_cruces.sql` | Asistencia, hoja de vida, plazos y alertas R01–R12 |
| 001400 | `…_api_rpc.sql` | `mi_perfil`, `mis_roles`, consentimiento, admin de roles, panel |
| 001500 | `…_storage.sql` | Buckets privados y políticas |
| 001600 | `…_cron.sql` | Alerta nocturna con pg_cron |
| 001700 | `…_grants_servicio.sql` | USAGE y privilegios del rol `service_role` para Edge Functions |
| 001800 | `…_tesoreria_cuotas.sql` | Pago de cuotas, anulación y grilla `fn_cuotas_estado` |
| 001900 | `…_actas_ordenes.sql` | Tipos de documento ACTA y ORDEN_CAPITANIA; seguimiento de correo |
| 002000 | `…_documentos_publicos.sql` | Lectura de órdenes y actas aprobadas por parte de la compañía |
| 20261119000100 | `…_antiguedad_charlie.sql` | Antigüedad efectiva, Charlie, exenciones y vista |
| 20261119000200 | `…_sistema_guardias.sql` | Ciclos, turnos, integrantes, RPC, situaciones y notificaciones |
| 20261119000300 | `…_guardias_cron_alertas.sql` | P7, R13/R14, panel y parámetros de guardia |
| 20261119000400 | `…_autoasignacion_guardias.sql` | Cierre semanal y autoasignación al día con menos guardianes |

## Cómo se usa
```bash
supabase migration new nombre_dominio   # crea el archivo con timestamp
supabase db reset                        # aplica todo + seed
supabase db lint
```
No edites una migración ya aplicada en producción: agrega una nueva.

## Convenciones
- Nombres `YYYYMMDDHHMMSS_dominio.sql`.
- `comment on` en tablas y columnas no obvias.
- RLS y `grant` al final de cada migración.
- Funciones internas en `seguridad` con `revoke`; RPC explícitas en esquemas
  expuestos.
- Nunca se ejecutan `drop table` de datos de negocio sin respaldo.

## Relacionado con
`docs/datos/diccionario.md`, `supabase/tests/`.
