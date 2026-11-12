# Integraciones

## Propósito
Documentar cómo entran datos externos al ERP sin contaminar el modelo:
VIPER Gestión (futuro) y planillas CSV/Excel.

## Contenido
| Archivo | Tema |
|---|---|
| `viper.md` | Integración futura con VIPER (requiere API del Cuerpo) |
| `importacion.md` | Plantillas CSV/Excel y flujo de staging |

## Cómo se usa
Toda carga externa pasa por `nucleo.staging_importacion`, se valida y recién
después se transforma. Nunca se escribe directo en las tablas de negocio.

## Convenciones
- Un archivo = un origen (`viper_asistencia`, `excel_inventario`, …).
- Cada fila conserva el JSON original y un `error` legible.
- Los datos importados se marcan con `origen = 'importacion'` o `'viper'`.

## Relacionado con
`docs/datos/normalizacion.md`, `scripts/importar-legado/`.
