# Importación CSV / Excel

## Flujo
1. Guarda el archivo en `data/privado/` (nunca en git).
2. Carga cada fila en `nucleo.staging_importacion` con `origen`, `archivo` y
   `fila`.
3. Revisa en Administración o con SQL.
4. Transforma a las tablas de negocio solo lo validado.
5. Deja el resto como `estado = 'pendiente'` con un `error` claro.

## Plantillas

### Asistencia
| Columna | Ejemplo | Obligatorio |
|---|---|---|
| lista_numero | 132 | Sí |
| lista_anio | 2026 | Sí |
| fecha | 2026-11-12 | Sí |
| tipo_acto | RO | Sí |
| registro | 217 | Sí |
| marca | A | Sí (A/F/P/R/S/L) |
| observacion | — | No |

### Inventario
| Columna | Ejemplo | Obligatorio |
|---|---|---|
| unidad_codigo | M-21 | No (vacío = bodega) |
| ubicacion | Cajonera 5.1 | No |
| articulo | Hacha de bombero | Sí |
| categoria | HERR | No |
| marca | Genérica | No |
| n_serie | 181453 | No |
| cantidad | 1 | Sí |
| estado | bueno | Sí (bueno/regular/malo/baja/sin_revisar) |
| valor | 45000 | No |

### Personas
| Columna | Ejemplo | Obligatorio |
|---|---|---|
| registro | 217 | Sí |
| rut | 12345678-9 | No |
| nombres | Ana María | Sí |
| apellido_paterno | Pérez | Sí |
| apellido_materno | Soto | No |
| fecha_ingreso | 2015-03-01 | No |
| rango | bombero | Sí |
| estado | activo | Sí |

## Carga
Con `psql` puedes cargar un CSV a staging:
```bash
psql "$DATABASE_URL" <<'SQL'
\copy staging_tmp from 'data/privado/asistencia.csv' csv header
SQL
```
Luego transforma con un `insert ... select` similar a
`scripts/importar-legado/10_transformar.sql`.

## Validaciones mínimas
- Registro existe en `personal.persona`.
- Fecha y número de lista son coherentes.
- Marca está en el enum.
- Cantidad > 0; serie única si el artículo la exige.
- Monto y período válidos en tesorería.
- Nada se aprueba sin revisar el staging.

## Informe
Cada carga debe terminar con conteos origen/destino y una lista de filas
pendientes. Guárdalo junto al archivo en `data/privado/`.

## Relacionado con
`docs/integraciones/viper.md`, `nucleo.staging_importacion`.
