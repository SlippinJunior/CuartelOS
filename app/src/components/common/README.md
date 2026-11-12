# components/common/ · Componentes compartidos

## Propósito
Piezas que se usan en dos o más módulos y que no son primitivas de formulario.

## Contenido
`ResponsiveList` (tarjetas/tabla), `EmptyState`, `ConfirmDialog`, `StatusBadge`
(estado y semáforo), `Proximamente`.

## Cómo se usa
```tsx
<ResponsiveList filas={filas} columnas={columnas} claveFila={(f) => f.id} />
```
No consultan Supabase: reciben datos y callbacks. Los textos son parámetros.

## Convenciones
- Deben funcionar en 390 px y en 1440 px.
- No introducir lógica de permisos: el llamador decide qué mostrar.
- Un vacío siempre ofrece una acción cuando el usuario puede resolverlo.

## Relacionado con
`docs/ux/componentes.md`.
