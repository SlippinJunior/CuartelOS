# Módulo · Inicio y Tablero

**Estado:** ✅ funcional

## Alcance
- **Rol `cuartel`**: ve exclusivamente el **Tablero de Cuartel** a pantalla completa con reloj en vivo, botón de tamaño de texto (`A / A+`), modo oscuro, pantalla completa y auto-refresco cada 5 minutos.
- **Bomberos y Oficiales**: ven un resumen personal compacto arriba (estado de guardia, tareas pendientes con plazo, avisos del pañol y alertas `R01–R16` para oficiales), el **Tablero de Cuartel** completo en el centro, y los accesos rápidos según rol.

## Implementación
- `nucleo.panel_inicio()` (resumen por rol) + `nucleo.tablero_cuartel()` (5 fuentes del tablero + guardia de hoy).
- `features/inicio/InicioPage.tsx` + `features/tablero/TableroCuartel.tsx`.
- Guards de ruta y menú en `lib/permisos.ts` y `app/AppShell.tsx`.

## Relacionado con
`docs/modulos/tablero.md`, `docs/ux/guia-de-diseno.md`, `app/src/features/inicio/README.md`.
