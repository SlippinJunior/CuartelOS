# Guía de diseño

## Principios
1. **Celular primero.** Se diseña a 390×844 y luego se amplía.
2. **Un objetivo por pantalla.** Título, acción principal y contenido.
3. **El rojo es institucional, no alarmista.** Se usa en la cabecera, enlaces y
   acciones primarias; los estados usan semáforo semántico.
4. **Todo se puede tocar con guantes.** 44 px o más y separación de 8 px.
5. **El sistema no esconde información crítica.** Los vacíos explican qué
   hacer; los errores dicen cómo resolver.

## Tokens
Definidos en `app/src/app/tema.css`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo` | `#faf7f2` | `#171310` | Fondo general |
| `--superficie` | `#fffdf9` | `#211b17` | Tarjetas |
| `--texto` | `#2b2522` | `#f5efe8` | Texto principal |
| `--primario` | `#9b1c1c` | `#d9564f` | Marca y acciones |
| `--borde` | `#e7ddd2` | `#3a302a` | Bordes |
| `--exito` | `#1f7a4d` | `#4ade80` | Al día |
| `--aviso` | `#a16207` | `#fbbf24` | Por vencer |
| `--peligro` | `#b42318` | `#f87171` | Vencido / falta |
| `--sin-dato` | `#8a817b` | `#a8a29e` | Sin información |

Radios: `0.5rem`, `0.75rem`, `1rem`. Sombra suave para tarjetas.

## Tipografía
- Familia del sistema (`ui-sans-serif`, `system-ui`, `Segoe UI`, `Roboto`).
- Base 16 px; título de página 20–24 px; etiquetas 12–14 px.
- Números tabulares para montos y registros.
- Sin mayúsculas sostenidas salvo etiquetas cortas.

## Espaciado y layout
- Escala de 4 px (1, 2, 3, 4, 5, 6, 8).
- Contenido máximo 72 rem en escritorio.
- Barra inferior fija en celular; barra lateral de 16 rem en escritorio.
- `env(safe-area-inset-bottom)` en la barra inferior.

## Modo oscuro
- Selector manual persistido en `localStorage` (`erp-tema`).
- Por defecto sigue `prefers-color-scheme`.
- Contraste mínimo AA en ambos modos.

## Semáforo semántico
| Estado | Color | Uso |
|---|---|---|
| 🟢 Al día | `--exito` | Documentos, cuotas, asistencia |
| 🟡 Por vencer | `--aviso` | 30 días antes |
| 🔴 Vencido / falta | `--peligro` | Plazo pasado |
| ⚪ Sin dato | `--sin-dato` | No registrado |

No se usan estos colores para decorar; solo para estado.

## Relacionado con
`docs/ux/patrones.md`, `app/src/app/tema.css`.
