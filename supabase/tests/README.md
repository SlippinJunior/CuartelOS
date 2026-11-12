# supabase/tests/ · Pruebas pgTAP

## Propósito
Verificar la matriz RLS y las reglas de negocio directamente en PostgreSQL,
con usuarios simulados. Son la red de seguridad de la interfaz.

## Contenido
| Archivo | Qué prueba |
|---|---|
| `rls_personal.test.sql` | Bombero ve lo propio; oficialidad ve todo; sensibles por RPC auditada |
| `rls_sensible.test.sql` | Acceso propio, oficialidad auditada y bloqueo de terceros |
| `rls_tesoreria.test.sql` | Bombero no ve cartola; tesorero sí; cuotas propias |
| `rls_disciplina.test.sql` | Solo consejo; director ve sanciones ejecutoriadas |
| `asistencia_reglas.test.sql` | Lista cerrada protegida, corrección con motivo, abono justificado |
| `tesoreria_reglas.test.sql` | No borrar movimientos, período cerrado, anulación con motivo |
| `folio_correlativo.test.sql` | Folios sin saltos, registro y verificación pública |
| `consentimiento.test.sql` | Se exige y registra la aceptación |
| `alertas.test.sql` | R01–R12 se generan y son idempotentes |
| `cuotas.test.sql` | Pago crea movimiento, doble pago bloqueado, anulación con motivo |

## Cómo se usa
```bash
pnpm supabase test db
# o un archivo
supabase test db rls_personal
```
Requieren que `supabase db reset` haya cargado el seed ficticio, porque usan los
usuarios `@demo.local` y datos de ejemplo. Cada archivo abre una transacción y
hace `rollback` al final, de modo que no ensucia la base.

## Convenciones
- Simular sesión con `set_config('request.jwt.claim.sub', …, true)` y
  `set local role authenticated`.
- Usar `plan(n)` y `finish()`.
- Cada prueba debe describir el permiso o la regla en español.
- Agregar una prueba al crear una tabla o política nueva.

## Relacionado con
`docs/arquitectura/seguridad.md`, `supabase/migrations/`.
