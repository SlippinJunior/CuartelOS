# Módulo · Tablero de Cuartel

**Estado:** ✅ funcional

## Propósito
Homepage unificado de consulta rápida en el cuartel y en el celular. Reúne 5 fuentes desde sus esquemas de dominio en `nucleo.v_tablero_cuartel` y `nucleo.tablero_cuartel()`:

| Bloque | Tabla origen | Quién publica |
|---|---|---|
| Órdenes del día | `operaciones.orden_dia` | Capitán, Teniente 1°, Ayudante, Director, Admin |
| Órdenes de capitanía | `operaciones.orden_capitania` | Capitán, Teniente 1°, Ayudante, Director, Admin |
| Circulares CBL | `secretaria.circular` (`origen = 'cbl'`) | Secretario, Prosecretario, Director, Admin |
| Circulares de compañía | `secretaria.circular` (`origen = 'compania'`) | Secretario, Prosecretario, Director, Admin |
| Citaciones | `secretaria.citacion` | Secretario, Prosecretario, Capitán, Ayudante, Director, Admin |

## Rol `cuartel`
- Cuenta pensada para un PC, tablet o TV del cuartel (`cuartel@demo.local`).
- Entra directo a pantalla completa en `/` sin menú lateral, sin barra inferior ni consentimiento individual, con auto-refresco cada 5 minutos.
- Bloqueada en el router y por RLS (`seguridad.es_solo_cuartel()`): no puede ver datos personales, tesorería, asistencia, pañol ni editar registros.

## Despacho simultáneo
Al publicar desde `DialogoPublicar` (`despachar-comunicado` / `orden-capitania`), el sistema publica en el Portal, envía correo (HTML + texto) y envía mensajes 1-a-1 por **Meta WhatsApp Cloud API** usando plantillas aprobadas, registrando trazabilidad en `nucleo.despacho` y `nucleo.despacho_detalle`.

## Relacionado con
`app/src/features/tablero/README.md`, `docs/operacion/whatsapp.md`, `supabase/migrations/20261126000200_tablero_cuartel_despacho.sql`.
