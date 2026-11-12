# docs/ · Documentación

## Propósito
Explicar el sistema sin obligar a leer el código: decisiones, modelo de datos,
alcance de cada módulo, guía visual y operación.

## Contenido
| Carpeta | Qué encontrarás |
|---|---|
| `arquitectura/` | Visión, stack, seguridad y ADRs |
| `datos/` | ER por dominio, diccionario, normalización y modelo dimensional |
| `modulos/` | Un archivo por módulo: alcance, artículos y estado |
| `ux/` | Guía de diseño, patrones, componentes y accesibilidad |
| `operacion/` | Instalación local, Supabase nube, Cloudflare, dominio y respaldos |
| `integraciones/` | VIPER (futuro) e importación CSV/Excel |
| `legado/` | PDF originales, SQL 0001–0004 y seed antiguo (intactos) |
| `hoja-de-ruta.md` | Etapas 2 a 6 |

## Cómo se usa
- Antes de tocar un módulo, lee `modulos/<modulo>.md`.
- Antes de agregar una tabla, revisa `datos/normalizacion.md` y el ER.
- Antes de escribir CSS, revisa `ux/guia-de-diseno.md`.
- Para desplegar, sigue `operacion/`.

## Convenciones
- Documentos en español, con tablas y ejemplos concretos.
- Los enlaces son relativos y deben funcionar en GitHub.
- Si una decisión cambia, se agrega un ADR; no se reescribe la historia.

## Relacionado con
`README.md` raíz.
