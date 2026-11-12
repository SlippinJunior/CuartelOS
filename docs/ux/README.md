# UX / UI

## Propósito
Definir el sistema visual y los patrones de interacción para que la app se
sienta consistente, rápida y usable con guantes y a una mano.

## Contenido
| Archivo | Tema |
|---|---|
| `guia-de-diseno.md` | Tokens, color, tipografía, espaciado y modo oscuro |
| `patrones.md` | Lista/detalle, filtros, formularios, estados y offline |
| `componentes.md` | Inventario de componentes y cuándo usarlos |
| `accesibilidad.md` | Contraste, foco, tamaño táctil y lectores de pantalla |

## Cómo se usa
- Antes de crear una pantalla, elige el patrón en `patrones.md`.
- Usa los tokens de `app/src/app/tema.css`; no inventes colores.
- Si un componente falta, agrégalo a `components/ui` y documenta aquí.

## Convenciones
- Español de Chile, tono directo y amable.
- Montos `$1.234.567` y fechas `dd-mm-aaaa`.
- Rojo institucional `#9B1C1C`; neutros cálidos.
- Objetivos táctiles ≥ 44 px.

## Relacionado con
`app/src/app/tema.css`, `docs/modulos/`.
