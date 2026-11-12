# scripts/generar-seed-ficticio/ · Seed de desarrollo

## Propósito
Generar datos ficticios deterministas para probar todos los roles, la
asistencia, el material y la tesorería sin usar información real.

## Contenido
`generar.py`: produce `supabase/seed.sql` con:
- 30 personas (201–230), cargos 2026 y situaciones especiales.
- 13 usuarios de Auth (`<rol>@demo.local` / `demo1234`), roles manuales y
  consentimiento (el bombero demo queda sin aceptar para probar el flujo).
- 40 listas de asistencia y más de mil marcas.
- 3 unidades, vistas, cajoneras, artículos y asignaciones.
- 6 meses de movimientos, compromisos, recurrentes, cuotas, cierre y campaña.
- Guardias, disciplina y filas de staging.

## Cómo se usa
```bash
python3 scripts/generar-seed-ficticio/generar.py > supabase/seed.sql
pnpm supabase db reset
```
El script usa `random.seed(20261112)` y UUIDv5: el resultado es reproducible.

## Convenciones
- Ningún nombre, RUT, dirección o monto corresponde a una persona real.
- Las contraseñas demo son públicas y solo sirven en local.
- Si cambia el modelo, actualizar este generador y volver a ejecutarlo.

## Relacionado con
`supabase/seed.sql`, `README.md` raíz.
