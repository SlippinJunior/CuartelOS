# features/asistencia/ · Asistencia y pase de lista

## Propósito
Listas del libro de asistencia, pase de lista en el celular —también sin
conexión— cierre y envío dentro de 48 horas, abonos justificados y resumen
personal.

## Contenido
| Archivo | Rol |
|---|---|
| `AsistenciaPage.tsx` | Listado por año/estado y creación de listas |
| `ListaPage.tsx` | Pase de lista con cola offline y conflictos |
| `MiAsistenciaPage.tsx` | Resumen anual y detalle por acto |

## Cómo se usa
- `ListaPage` cachea lista, personas y marcas en IndexedDB.
- Al marcar, escribe primero en el dispositivo y luego intenta el upsert
  idempotente `(lista_id, persona_id)`.
- Si no hay red, las marcas quedan pendientes y se sincronizan al reconectar;
  en listas cerradas se usa la RPC `asistencia.corregir_marca` con motivo.
- Las situaciones especiales vigentes (licencia, embarazo, suspensión) se
  premarcan y se explica el motivo.

## Convenciones
- Marcas: A asiste, F falta, P permiso, R eximido, S suspendido, L licencia.
- R y S no entran al denominador del porcentaje.
- Una lista enviada no se edita sin motivo; el trigger y la auditoría lo exigen.
- El plazo de cierre es un parámetro (`plazo_cerrar_lista_horas`).

## Relacionado con
`docs/modulos/asistencia.md`, `app/src/lib/offline/`.
