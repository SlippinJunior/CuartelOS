# Datos

## Propósito
Documentar el modelo normalizado, el diccionario y el modelo dimensional que
alimentará los informes.

## Contenido
| Archivo | Tema |
|---|---|
| `normalizacion.md` | Problemas del legado y cómo se corrigieron |
| `er-personal.md` | Personas, eventos, cargos, asistencia |
| `er-material.md` | Unidades, vistas 2D, ubicaciones, inventario |
| `er-tesoreria.md` | Cartola, compromisos, presupuesto y proyecciones |
| `diccionario.md` | Cómo generar el diccionario desde PostgreSQL |
| `modelo-dimensional.md` | Modelo estrella y mapeo de informes |

## Cómo se usa
Antes de agregar una tabla o columna, revisa el ER del dominio y la sección de
normalización. Si el dato es derivable, no se guarda.

## Convenciones
- Nombres en singular, snake_case y sin prefijo de esquema en la tabla.
- Fechas `date`; instantes `timestamptz`; montos `numeric(14,0)` en CLP.
- Catálogos con FK real, no texto libre.
- `comment on` en tablas y columnas no obvias.

## Relacionado con
`supabase/migrations/`, `docs/arquitectura/`.
