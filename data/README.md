# data/ · Datos privados

## Propósito
Guardar los datos reales y respaldos **fuera de git**. Esta carpeta casi vacía
es intencional.

## Contenido
| Ruta | Qué hay |
|---|---|
| `privado/legado/seed_original.sql` | Seed antiguo real (ignorado) |
| `privado/seed_real.sql` | Respaldo generado por la importación (ignorado) |
| `privado/.gitkeep` | Mantiene la carpeta en el repositorio |

## Cómo se usa
- Copia el seed real a `data/privado/legado/seed_original.sql`.
- Ejecuta `bash scripts/importar-legado/importar.sh`.
- Restaura con `psql "$DATABASE_URL" -f data/privado/seed_real.sql`.

## Convenciones
- `.gitignore` excluye `data/privado/`. No lo cambies.
- Los respaldos se cifran o se guardan en un medio seguro antes de salir del
  equipo.
- Nunca pegues datos reales en issues, capturas o documentación.

## Relacionado con
`docs/operacion/respaldos.md`, `scripts/importar-legado/`.
