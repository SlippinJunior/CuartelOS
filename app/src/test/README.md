# src/test/ · Pruebas unitarias

## Propósito
Configuración compartida de Vitest y pruebas de componentes base.

## Contenido
- `setup.ts`: jest-dom y `fake-indexeddb`.
- `componentes.test.tsx`: botón, vacío, badges.

## Cómo se usa
```bash
pnpm -C app test
pnpm -C app test -- --watch
```
Las pruebas de lógica están junto al archivo probado (`*.test.ts`).

## Convenciones
- Probar permisos, formato, cola offline y reglas visibles.
- No probar detalles de implementación de Radix o del navegador.
- Para Dexie usar `limpiarCache()` en `beforeEach`.

## Relacionado con
`app/vite.config.ts`, `docs/operacion/instalacion-local.md`.
