# features/estadisticas/ · Panel de Estadísticas

## Propósito
Visualización gráfica (`recharts`) para apoyar la toma de decisiones de la oficialidad y usuarios autorizados: emergencias/claves, asistencia, Inventario Compañía (materiales más y menos asignados), bitácora de unidades y cobertura de guardias.

## Contenido
| Archivo | Qué hace |
|---|---|
| `EstadisticasPage.tsx` | Panel KPI y gráficos interactivos por año |
| `logica.ts` | Normalización segura (`normalizarEstadisticas`) frente a años sin datos |
| `logica.test.ts` | Pruebas unitarias |

## Relacionado con
`docs/modulos/estadisticas.md`, `supabase/migrations/20261126000300_material_admin_asistencia_estadisticas.sql`.
