# features/guardia/ · Guardias nocturnas

## Propósito
Agendar ciclos de 14 días, inscribirse en los turnos, informar la guardia y
firmar el reporte con el Jefe de Guardia calculado.

## Contenido
| Archivo | Rol |
|---|---|
| `GuardiaPage.tsx` | Contenedor con Grilla · Mis guardias · Estadísticas · Gestión |
| `GrillaGuardia.tsx` | Estado personal, selector de ciclo/semana y tarjetas por día |
| `dialogos.tsx` | Reporte nocturno, reemplazo y llegada tardía |
| `EstadisticasGuardia.tsx` | Cumplimiento por categoría, día de la semana y maquinistas |
| `GestionGuardia.tsx` | Nuevo ciclo, estado, convocatorias, PDF P7 y situaciones |
| `MisGuardias.tsx` | Historial personal y reportes del ciclo |
| `logica.ts` | Etiquetas, semáforo, regla de cupo y períodos |
| `reglas-reporte.ts` | Responsable de firma, ventana de llegada tardía |

## Cómo se usa
- **Grilla**: muestra los 7 días de la semana elegida. Botones grandes
  *Inscribirme*, *Bajarme* o *Gestionar reemplazo*, *Llegué a la guardia* y
  *Reporte*.
- **Reporte**: cualquier integrante informa; *Firmar reporte* solo aparece
  habilitado para el Jefe de Guardia o respaldo de Capitanía.
- **Gestión**: solo Capitanía, Teniente 1°, Ayudante, Director y admin.

## Convenciones
- Los datos vienen de `operaciones.grilla_ciclo`; no se arma la lógica en el
  navegador.
- `logica.ts` y `reglas-reporte.ts` replican las reglas de UI para probarlas con
  Vitest, pero la autoridad es la base.
- El semáforo usa los colores institucionales: rojo vacío, ámbar incompleto,
  verde completo, azul cupo extra.

## Relacionado con
`docs/modulos/guardia.md`, `supabase/tests/guardias.test.sql`.
