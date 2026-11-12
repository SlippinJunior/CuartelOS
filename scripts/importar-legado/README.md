# scripts/importar-legado/ · Importación del esquema antiguo

## Propósito
Convertir el esquema `gestion` de 35 tablas (y el seed real) al modelo nuevo,
corrigiendo los problemas detectados y dejando un informe de conciliación.

## Contenido
| Archivo | Rol |
|---|---|
| `importar.sh` | Orquesta carga, transformación, respaldo y limpieza |
| `00_cargar_legado.sql` | Elimina un intento previo y advierte si hay datos |
| `10_transformar.sql` | Mapea y corrige los datos; imprime conciliación |

## Cómo se usa
```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
bash scripts/importar-legado/importar.sh
```
Antes:
1. Base con migraciones aplicadas y **sin datos reales**.
2. `data/privado/legado/seed_original.sql` con el seed real.
3. Revisar `docs/legado/sql/0001_esquema.sql` (origen).

Correcciones aplicadas:
- `'gasto'` se normaliza a `'egreso'` (el seed original traía un valor inválido).
- Series con `.0` se limpian.
- Nombres de 4+ palabras no se re-parten.
- `Cajonera 5.1` se convierte en ubicación jerárquica.
- `guardia` pasa a turnos con integrantes.
- `REO`/`RE` se conservan como claves de acto.
- Categorías de presupuesto se vinculan por nombre y se crean las implícitas.
- Correspondencia y movimientos usan `nucleo.contraparte`.
- Actas y acuerdos se cargan antes de cargos, premios y presupuesto.
- Lo dudoso queda en `nucleo.staging_importacion`.

Resultado esperado del seed entregado: **56 personas, 135 listas, 7.383
asistencias, 246 movimientos, 574 ítems, 3 unidades, 5 actas, 15 acuerdos**.
El respaldo queda en `data/privado/seed_real.sql` (ignorado por git) y el
esquema temporal `legado` se elimina.

## Convenciones
- No modificar los archivos de `docs/legado/`: son la evidencia original.
- Si aparece un dato nuevo dudoso, va a staging con `error` explicativo.
- Revisar el informe y `select * from nucleo.staging_importacion where estado = 'pendiente'`.

## Relacionado con
`docs/integraciones/importacion.md`, `docs/legado/`.
