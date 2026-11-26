# Guía de diseño (Multi-edad y accesible)

## Principios
1. **Celular y pantalla de cuartel primero.** Adaptable desde `390×844` hasta pantallas de sala de máquinas (`1440+`).
2. **Legible para todas las edades (18 a 75+ años).** Texto base ≥ 16 px, etiquetas mínimas de 12–13 px, alto contraste WCAG AA+ y control **`A / A+`** en la cabecera para subir la escala base a 18 px (`html.texto-grande`).
3. **El rojo es institucional, no alarmista.** Se usa en acciones primarias e identidad; los estados usan semáforo semántico.
4. **Todo se puede tocar con guantes o sin precisión fina.** Objetivos táctiles ≥ 44 px (`min-h-11`).
5. **Navegación simple y directa.** Secciones agrupadas (*Diario · Compañía · Sistema*) + buscador global `Ctrl+K`.

## Tokens
Definidos en `app/src/app/tema.css`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo` | `#faf7f2` | `#171310` | Fondo general |
| `--superficie` | `#fffdf9` | `#211b17` | Tarjetas |
| `--texto` | `#231d1a` | `#f5efe8` | Texto principal |
| `--apagado-texto` | `#5e5047` | `#c8bcb2` | Texto secundario (alto contraste) |
| `--primario` | `#9b1c1c` | `#e0615a` | Marca y acciones |
| `--borde` | `#dfd3c5` | `#473b34` | Bordes |
| `--exito` | `#176c42` | `#4ade80` | Al día |
| `--aviso` | `#925406` | `#fbbf24` | Por vencer |
| `--peligro` | `#b42318` | `#f87171` | Vencido / falta |

## Componentes y accesibilidad
- Base `shadcn/ui` (incluye `command`, `popover`, `dropdown-menu`, `tooltip`, `scroll-area`) + wrappers nativos accesibles en español (`Dialog`, `Sheet`, `Tabs`).
- Foco visible reforzado (`outline: 3px solid var(--color-ring)`).
- Respeta `prefers-reduced-motion: reduce` y `color-scheme: light dark`.

## Relacionado con
`docs/ux/patrones.md`, `app/src/app/tema.css`, `app/src/app/index.css`.
