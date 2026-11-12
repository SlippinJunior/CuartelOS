# ADR 0002 · Roles manuales separados del cargo

- **Estado:** aceptado
- **Fecha:** 2026-11-12

## Contexto
El legado derivaba permisos del cargo (`es_oficial()`) y tenía un único rol
`teniente`. Eso mezcla el historial de cargos con el control de acceso y no
permite delegar tareas temporalmente.

## Decisión
`seguridad.usuario_rol` guarda roles manuales con `desde`, `hasta`, `motivo` y
`asignado_por`. `teniente` se divide en `teniente_1`, `teniente_2` y
`teniente_3`. Solo Director y admin asignan roles, vía RPC auditada.

## Consecuencias
- Un cambio de cargo no cambia permisos por sí solo.
- Se pueden cubrir reemplazos con fechas de término.
- La matriz RLS se prueba por rol, no por cargo.
- La interfaz usa `lib/permisos.ts` como espejo, pero RLS manda.
