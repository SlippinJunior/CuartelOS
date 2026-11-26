# features/material/ · Inventario Compañía, Unidades y Bitácora

## Propósito
Que los bomberos consulten el **Inventario Compañía** y soliciten artículos, que el Teniente 2° (o gestor autorizado) administre existencias/EPP a cargo, y que Capitanía/Tenientes lleven la **Bitácora de Unidades** (mantenciones, accidentes, revisiones, combustible y novedades).

## Contenido
| Archivo | Qué hace |
|---|---|
| `MaterialPage.tsx` | Pestañas Inventario Compañía, Solicitudes, Bomberos, Bitácora de Unidades y Unidades |
| `dialogos.tsx` | Alta/edición de stock, solicitud, resolución y asignación |
| `BitacoraUnidades.tsx` | Registro y línea de tiempo de mantenciones, accidentes y novedades por unidad |
| `logica.ts` | Permisos por rol/módulo, bitácora, estados, agrupación y formato |
| `VistaUnidades.tsx` | Ficha real de carros (`material.unidad`) y esquema 2D de cajoneras |

## Cómo se usa
- **Bombero**: entra a Material, busca el artículo, toca *Solicitar* e indica
  cantidad y motivo. Sigue el estado en *Solicitudes*.
- **Teniente 2°**: agrega o edita el stock, resuelve cada pedido y asigna EPP
  desde *Bomberos*.
- **Capitanía y oficialidad**: leen el pañol, las solicitudes y el EPP; no
  modifican nada.

## Convenciones
- Toda la seguridad vive en RLS y en `material.resolver_solicitud`. El
  frontend solo oculta acciones.
- Los avisos se leen de `material.notificacion`; no se inventan en el cliente.
- Las cantidades se muestran con `cantidadLegible()` para evitar `2.00`.

## Relacionado con
`docs/modulos/material.md`, `docs/datos/er-material.md`,
`supabase/migrations/20261121000100_inventario_teniente.sql`.
