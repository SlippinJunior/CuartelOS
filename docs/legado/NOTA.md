# Legado · Nota de archivo

## Propósito
Conservar intactos los archivos originales entregados por el director y dejar
claro qué se reutilizó y qué se reemplazó.

## Contenido
| Archivo | Origen | Estado |
|---|---|---|
| `sql/0001_esquema.sql` | Base original (35 tablas en `gestion`) | Archivado; se usa solo como fuente de importación |
| `sql/0002_seguridad.sql` | RLS y auditoría originales | Reemplazado por `…_seguridad.sql` |
| `sql/0003_cruces.sql` | Vistas y alertas R01–R11 | Reemplazado por `…_vistas_cruces.sql` (R01–R12) |
| `sql/0004_documentos.sql` | Folio y verificación | Reemplazado por `…_documentos_emision.sql` |
| `migrar_desde_json.py` | Generador del seed antiguo | Archivado; superado por `scripts/importar-legado/` |
| `README.md` | README original | Intacto |
| `pdf/` | Documento ERP, lectura de Etapa 1 y PDF de ejemplo | Referencia funcional |

## Cómo se usa
- `scripts/importar-legado/importar.sh` lee `sql/0001_esquema.sql` y lo aplica
  como esquema temporal `legado`.
- Nadie debe editar estos archivos: son evidencia de lo recibido.
- Las correcciones y decisiones nuevas viven en `docs/arquitectura/adr/` y en
  las migraciones nuevas.

## Relacionado con
`docs/arquitectura/adr/0003-importacion-legado.md`,
`scripts/importar-legado/`.
