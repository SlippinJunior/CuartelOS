-- =====================================================================
-- 20261126000100 · Rol cuartel (solo lectura del Tablero de Cuartel)
-- =====================================================================
-- ALTER TYPE ... ADD VALUE se ejecuta en su propia migración porque
-- PostgreSQL no permite usar un valor de enum recién agregado dentro de
-- la misma transacción.
-- =====================================================================
alter type seguridad.rol add value if not exists 'cuartel';

comment on type seguridad.rol is 'Roles de permisos. Se asignan a mano; incluye cuartel (pantalla solo lectura del tablero).';
