# app/src/components/ui/ · Primitivas de interfaz

## Propósito
Componentes base al estilo shadcn/ui, generados a mano para no depender de un
CLI. Son la única fuente de estilos de controles.

## Contenido
`button`, `input`, `textarea`, `label`, `select`, `card`, `badge`, `table`,
`tabs`, `dialog` (dialog nativo), `sheet` (hoja inferior), `switch`, `skeleton`,
`separator`.

## Cómo se usa
```tsx
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">Acción</Button>
```
`components.json` mantiene la configuración de shadcn por si se agregan más
componentes con el CLI.

## Convenciones
- No incluir lógica de negocio ni llamadas a Supabase.
- Altura mínima táctil de 44 px (`h-11`/`min-h-11`).
- Usar los tokens (`bg-card`, `text-muted-foreground`, `border-border`), nunca
  colores sueltos.
- Accesibilidad: `aria-label` cuando el contenido es solo un icono.

## Relacionado con
`docs/ux/componentes.md`, `app/src/app/tema.css`.
