# e2e/ · Pruebas de extremo a extremo

## Propósito
Recorrer los flujos críticos en un navegador real, en tamaño celular y
escritorio.

## Contenido
`flujo.spec.ts`: login por rol, menú filtrado y pase de lista sin conexión.

## Cómo se usa
```bash
supabase start && supabase db reset
E2E=1 pnpm -C app e2e
```
Sin `E2E=1` los casos se omiten para no fallar en un entorno sin Supabase.

## Convenciones
- Selectores por rol y texto visible, no por clases CSS.
- Un caso = un flujo de negocio.
- No crear datos reales; usar los usuarios `@demo.local`.
- Si un flujo cambia, actualizar el caso en el mismo commit.

## Relacionado con
`app/playwright.config.ts`, `docs/operacion/instalacion-local.md`.
