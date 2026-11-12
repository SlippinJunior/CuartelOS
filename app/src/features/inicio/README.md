# features/inicio/ · Inicio por rol

## Propósito
Pantalla de entrada distinta según el cargo: tareas con plazo, alertas R01–R12
y accesos rápidos filtrados por rol.

## Contenido
`InicioPage.tsx`: saludo, fecha, tarjetas de tareas/alertas/compromisos,
listados de plazos y accesos rápidos (pase de lista, mi hoja de vida, mis
cuotas, registrar movimiento, emitir documento).

## Cómo se usa
Consume `nucleo.panel_inicio()`, que arma tareas y alertas en el servidor. Los
accesos se derivan de `seccionesDe(roles)`.

## Convenciones
- Un bombero sin cargo ve su hoja de vida, asistencia, material, cuotas y
  documentos; no ve Tesorería ni Administración.
- No se muestran alertas a quien no es oficialidad.

## Relacionado con
`docs/ux/guia-de-diseno.md`, `nucleo.panel_inicio()`.
