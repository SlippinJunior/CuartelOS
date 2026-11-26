# app/src/components/ui/ · Primitivas de interfaz

## Propósito
Componentes base al estilo shadcn/ui, generados a mano para no depender de un
CLI. Son la única fuente de estilos de controles.

## Contenido
- **Envoltorios base (props en español, NO sobreescribir con el CLI):** `button`, `input`, `textarea`, `label`, `select`, `card`, `badge`, `table`, `tabs`, `dialog` (dialog nativo), `sheet` (hoja inferior), `switch`, `skeleton`, `separator`.
- **Componentes instalados vía shadcn/ui CLI:** `command`, `popover`, `dropdown-menu`, `tooltip`, `scroll-area`.

## Cómo se usa
```tsx
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">Acción</Button>
```
`components.json` mantiene la configuración de shadcn por si se agregan más
componentes con el CLI.

## Convenciones
- **Regla de compatibilidad:** Nunca sobrescribir `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `select.tsx`, `button.tsx`, `badge.tsx` o `switch.tsx` con el CLI de shadcn sin adaptar antes sus props en español (`abierto`, `onCambio`, `titulo`, `pie`, `variant="exito"|"aviso"|"peligro"|"apagado"`).
- No incluir lógica de negocio ni llamadas a Supabase.
- Altura mínima táctil de 44 px (`h-11`/`min-h-11`).
- Usar los tokens (`bg-card`, `text-muted-foreground`, `border-border`), nunca
  colores sueltos.
- Accesibilidad: `aria-label` cuando el contenido es solo un icono.

## Relacionado con
`docs/ux/componentes.md`, `app/src/app/tema.css`.
