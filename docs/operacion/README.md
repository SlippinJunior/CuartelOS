# Operación

## Propósito
Guías paso a paso para instalar, desplegar y respaldar el sistema sin depender
de memoria o de la persona que lo construyó.

## Contenido
| Archivo | Tema |
|---|---|
| `instalacion-local.md` | Docker, Supabase CLI, seed, pruebas y verificación manual |
| `supabase-nube.md` | Crear el proyecto, aplicar migraciones y secrets |
| `cloudflare-pages.md` | Build y publicación manual |
| `dominio.md` | Compra, DNS y correo |
| `respaldos.md` | Política de respaldo y restauración |

## Cómo se usa
Sigue el orden: local → nube → dominio → respaldos. Marca cada paso en una
bitácora interna.

## Convenciones
- Nunca se pegan claves en git ni en capturas.
- Cada cambio de infraestructura se anota con fecha y responsable.
- Las pruebas se repiten antes de invitar a bomberos reales.

## Relacionado con
`README.md` raíz, `docs/arquitectura/`.
