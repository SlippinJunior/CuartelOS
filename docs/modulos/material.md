# Módulo · Material

**Estado:** ✅ pañol del Teniente 2° y solicitudes · 🧱 vista 2D de unidades

## Alcance comprometido
- Inventario gráfico por lado del carro (foto o SVG).
- Cajoneras y subcajoneras tocables; coordenadas guardadas.
- Inventario por cajonera y revisión en terreno.
- Vestuario y EPP a cargo del bombero.
- Documentos de unidad con vencimiento.
- Bitácora de km y horas de bomba.

## Pañol del Teniente 2°
El Teniente 2° administra un pañol propio (`material.panol_stock`) con
existencias por artículo y talla.

| Quién | Qué puede hacer |
|---|---|
| Bombero | Consultar el pañol y **solicitar** artículos |
| Teniente 2° | Cargar y editar stock, aprobar, entregar o rechazar, asignar EPP |
| Capitanía y oficialidad | Leer el pañol, el historial de solicitudes y el EPP de cada bombero |
| Admin | Todo lo anterior |
| Resto de la compañía | Sin acceso a la sección |

Reglas de la solicitud:
1. El bombero pide desde una fila del pañol; no puede pedir más que el stock
   disponible.
2. La solicitud nace **pendiente** y se direcciona al Teniente 2° de turno
   (`seguridad.persona_con_rol('teniente_2')`).
3. El Teniente 2° **aprueba**, **entrega** o **rechaza**. Al entregar:
   - se descuenta el stock,
   - se crea una fila en `material.asignacion` a nombre del bombero,
   - el solicitante recibe un aviso en la app.
4. Si el stock queda en o bajo el mínimo, el Teniente 2° recibe un aviso de
   reposición.
5. El bombero puede cancelar su solicitud mientras siga pendiente.

Todo ocurre en la RPC `material.resolver_solicitud`, que valida el rol y el
stock dentro de la misma transacción. La seguridad la impone RLS: el frontend
solo oculta botones.

## Inventario de los bomberos
`material.asignacion` guarda el EPP y vestuario a cargo de cada persona. El
Teniente 2° lo ve completo y puede asignar; cada bombero ve solo lo suyo a
través de `material.v_asignaciones_persona`.

## Artículos y documentos
- P8 Hoja de cargo de vestuario y EPP.
- P9 Certificado de paz y salvo.
- P10 Bitácora e informe de unidades.
- P18 Inventarios de apertura.
- R07 ítem malo, R08 sin revisión, R09 documento por vencer.

## Modelo listo
`material.unidad`, `unidad_vista`, `ubicacion`, `articulo`, `item`,
`asignacion`, `mantencion`, `revision_inventario`, `revision_detalle`,
`bitacora_unidad`, `panol_stock`, `solicitud`, `notificacion`.

## Pendiente
- Editor de zonas sobre la foto (Etapa 3).
- Revisión en terreno con cámara y firma.
- Devolución de EPP desde la ficha del bombero.
- Alertas de vida útil y reposición automática por pg_cron.

## Relacionado con
`docs/datos/er-material.md`, `app/src/features/material/`,
`supabase/migrations/20261121000100_inventario_teniente.sql`.
