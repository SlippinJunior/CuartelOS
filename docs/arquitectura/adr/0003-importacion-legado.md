# ADR 0003 · Importación del legado con staging

- **Estado:** aceptado
- **Fecha:** 2026-11-12

## Contexto
El seed original tiene errores: series `'181453.0'`, nombres mal partidos,
`REO` vs `RE`, cuotas sin bombero y un valor `'gasto'` que no existe en el enum.
No se puede confiar en una conversión automática ciega.

## Decisión
Cargar el esquema antiguo en `legado`, transformar con SQL explícito y enviar
todo lo dudoso a `nucleo.staging_importacion`. Generar un informe de
conciliación y exportar `data/privado/seed_real.sql`. El esquema temporal se
elimina al final.

## Consecuencias
- La importación es auditable y repetible.
- Los datos reales nunca entran a git.
- Cada corrección queda documentada en `scripts/importar-legado/README.md`.
- La misma zona de staging sirve para VIPER y planillas Excel.
