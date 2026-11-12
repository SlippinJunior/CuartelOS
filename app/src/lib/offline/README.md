# lib/offline/ · Pase de lista sin conexión

## Propósito
Permitir que el pase de lista funcione con la red cortada y sincronizar después,
sin duplicar ni pisar datos de forma accidental.

## Contenido
| Archivo | Rol |
|---|---|
| `db.ts` | Dexie: listas, personas y marcas; funciones de caché y cola |
| `useConexion.ts` | Estado en línea/fuera de línea y contador de pendientes |

## Cómo funciona
1. Al abrir la lista, se copia lista + personas + marcas a IndexedDB.
2. Cada marca se guarda localmente con `pendiente = true`.
3. Si hay red y la lista es borrador, se hace upsert idempotente por
   `(lista_id, persona_id)`.
4. Si la lista ya está cerrada, se usa `asistencia.corregir_marca` con un motivo.
5. Al reconectar, se recorren las pendientes y se avisa si el servidor cambió.

## Convenciones
- La clave local es `listaId:personaId`.
- Las marcas pendientes no se pisan con la copia del servidor al refrescar.
- No se guardan datos sensibles en IndexedDB.
- La caché se puede limpiar con `limpiarCache()` (botón futuro en Administración).

## Relacionado con
`docs/modulos/asistencia.md`, `app/src/features/asistencia/ListaPage.tsx`.
