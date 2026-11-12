# ADR 0001 · Un esquema por dominio

- **Estado:** aceptado
- **Fecha:** 2026-11-12

## Contexto
El legado concentra 35 tablas en `gestion`. Los permisos se vuelven difíciles de
razonar y una consulta puede tocar personas, tesorería y disciplina al mismo
tiempo. Supabase exige que las migraciones sean planas y expone esquemas
completos a PostgREST.

## Decisión
Separar en 10 esquemas: `nucleo`, `seguridad`, `personal`, `asistencia`,
`operaciones`, `material`, `tesoreria`, `secretaria`, `disciplina` y
`documentos`. `seguridad` no se expone a la API. Cada feature del frontend
corresponde a un esquema.

## Consecuencias
- Las políticas RLS se agrupan por dominio y son más fáciles de auditar.
- Las FKs entre dominios se agregan en migraciones posteriores o con
  `alter table` al final.
- El frontend usa `db.<esquema>` y no un cliente global indistinto.
- Las migraciones deben ser planas; el prefijo numérico mantiene el orden.
