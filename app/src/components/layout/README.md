# components/layout/ · Estructura de la aplicación

## Propósito
Navegación y marco visual: barra lateral en escritorio, barra inferior y hoja
"Más" en celular, cabecera de página, tema y estado de conexión.

## Contenido
`Sidebar`, `BottomNav`, `MoreSheet`, `PageHeader`, `ThemeToggle`,
`ConnectionIndicator` e `iconos.ts`.

## Cómo se usa
`AppShell` monta `Sidebar`, la cabecera y `BottomNav`. Las páginas usan
`PageHeader` para título, descripción y acciones.

## Convenciones
- La barra inferior muestra hasta 4 accesos; el resto va a "Más".
- Los iconos salen de `iconos.ts` para que el menú y los accesos rápidos
  coincidan.
- No incluir consultas de negocio aquí.

## Relacionado con
`docs/ux/patrones.md`, `app/src/lib/permisos.ts`.
