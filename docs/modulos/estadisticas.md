# Estadísticas

**Estado:** ✅ funcional (`/estadisticas`)

## Alcance
- **Emergencias y actos:** tendencia mensual (emergencias vs reuniones/academias) y ranking de claves más frecuentes del Libro de Asistencia.
- **Asistencia:** promedio anual, distribución de marcas (`A / F / P / R / L / S`), top mayor participación y seguimiento de menor asistencia activa.
- **Inventario Compañía y EPP:** materiales que **más** y **menos** tienen asignados los bomberos, alertas de stock bajo mínimo y solicitudes.
- **Unidades y Guardias:** mantenciones, accidentes, gasto en bitácora por carro y cobertura del ciclo de guardias.

## Seguridad
- Por defecto habilitado para oficialidad y administrador.
- Se puede otorgar o revocar a cualquier usuario mediante `seguridad.usuario_modulo` desde Administración.
- Bloqueado por RLS/RPC (`nucleo.estadisticas_compania`) para cuentas solo `cuartel`.
