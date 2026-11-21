# features/material/ · Pañol del Teniente 2° y EPP

## Propósito
Que los bomberos consulten el pañol del Teniente 2° y soliciten artículos, y
que el Teniente 2° administre el stock, resuelva pedidos y mantenga el EPP a
cargo de cada bombero.

## Contenido
| Archivo | Qué hace |
|---|---|
| `MaterialPage.tsx` | Pestañas Pañol, Solicitudes, Bomberos y Unidades |
| `dialogos.tsx` | Alta/edición de stock, solicitud, resolución y asignación |
| `logica.ts` | Roles, estados, agrupación y formato de cantidades |
| `VistaUnidades.tsx` | Maqueta 2D por lado del carro (Etapa 3) |

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
