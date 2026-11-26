# Diseño · Material, Administración, Asistencia (Libro 2026) y Estadísticas

**Fecha:** 2026-11-26
**Estado:** Aprobado por el usuario (Enfoque 1)
**Compañía:** Segunda Compañía de Bomberos de Limache (`CuartelOS`)

---

## 1. Propósito y contexto

Consolidar cuatro frentes operativos clave del ERP sobre la arquitectura existente (`Supabase PostgreSQL 17 + RLS` y `React 19 + Vite 7 + TanStack Router/Query + Tailwind/shadcn/ui`):

1. **Material e Inventario:** renombrar *"Pañol del 2°"* a **Inventario Compañía**, conectar las **Unidades** a `material.unidad` y habilitar la **Bitácora de Unidades** (mantenciones, accidentes, revisiones, combustible y novedades).
2. **Administración:** gestionar **Unidades** (crear, editar y cambiar estado operativo) y permitir que el administrador modifique **permisos por módulo por usuario**, manteniendo las **categorías de oficiales** que asignan bloques automáticos por rol.
3. **Asistencia y trabajo del Ayudante:** incorporar el catálogo real de **claves** del *Libro de Asistencia 2026*, permitir registrar partes (tipo de acto/clave, vínculo opcional a citación, asistencia y comentarios), y habilitar la consulta de **partes**, **Libro anual** y **claves + asistencia propia** para todos los bomberos activos.
4. **Panel de Estadísticas:** nueva vista gráfica con `recharts` para apoyar decisiones (emergencias/claves, asistencia de bomberos, materiales más/menos asignados, stock bajo mínimo, bitácora de unidades y guardias).

---

## 2. Objetivos, no-objetivos y anti-objetivos

### Objetivos
- Renombrar de forma consistente *"Pañol del 2°"* → **Inventario Compañía** en interfaz, avisos de inicio y documentación.
- Registrar y consultar la historia operativa completa de cada unidad en `material.bitacora_unidad`, actualizando `km_actual` automáticamente cuando corresponda.
- Permitir CRUD de `material.unidad` desde `/administracion`.
- Mantener la herencia automática de permisos por rol (`director`, `capitan`, `teniente_1/2/3`, `ayudante`, `secretario`, `tesorero`, `consejo`, `bombero`) y superponer excepciones por usuario y módulo (`ninguno` | `lectura` | `gestion`) respetadas tanto por el frontend como por PostgreSQL RLS.
- Digitalizar el flujo completo del Ayudante y la consulta del Libro de Asistencia 2026 (claves reales, conteos acumulados `1, 2, 3…`, marcas `A/F/P/R/S/L/N/A` y comentarios del parte) visibles para todos los bomberos activos.
- Entregar un panel gráfico claro y responsivo (`/estadisticas`) alimentado por un RPC consolidado en SQL.

### No-objetivos (fuera de esta entrega)
- Editor interactivo de polígonos 2D sobre fotografías reales de cada cajonera (se mantiene el visor 2D existente conectado a unidades reales).
- Transcripción automática de actas con IA.

### Anti-objetivos (reglas inviolables)
- **Nunca** romper el aislamiento estricto del rol `cuartel` (solo ve `/` Tablero de Cuartel, bloqueado por router y RLS en todas las tablas y RPC nuevas).
- **Nunca** exponer datos personales sensibles (`rut`, `telefono`, `direccion`, `grupo_sanguineo`, etc.) de `personal.persona` a bomberos rasos al abrir el Libro o los partes de asistencia.
- **Nunca** sobrescribir los envoltorios UI existentes en español (`dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `select.tsx`, `button.tsx`, `badge.tsx`, `switch.tsx`).

---

## 3. Enfoques evaluados

1. **Enfoque 1 — Entrega integral coordinada con `recharts` y Bitácora unificada *(Elegido)***
   - Migración SQL única, `recharts` para gráficos interactivos, permisos por módulo integrados desde el día uno y Bitácora unificada por categoría.
2. **Enfoque 2 — Dividir en dos entregas independientes**
   - Descartado por requerir doble ciclo de diseño, plan y despliegue cuando Estadísticas y Administración dependen de los mismos contratos de permisos y bitácora.
3. **Enfoque 3 — SVG manual sin librería de gráficos y 3 formularios separados**
   - Descartado por menor legibilidad/interactividad en móvil y mayor fricción operativa para registrar novedades de carros.

---

## 4. Diseño por bloque

### 4.1 Permisos por módulo sobre bloques de rol (`seguridad` y `nucleo`)
- Tabla `seguridad.usuario_modulo (user_id, modulo, nivel, actualizado_por, actualizado_en)` con `nivel in ('ninguno', 'lectura', 'gestion')`.
- Módulos controlables: `personal`, `asistencia`, `guardia`, `material`, `tesoreria`, `secretaria`, `documentos`, `administracion`, `disciplina`, `estadisticas` (`inicio` permanece siempre accesible excepto `cuartel` que queda fijado solo a `inicio`).
- Función SQL `seguridad.tiene_permiso_modulo(p_modulo text, p_nivel text default 'lectura')`:
  1. `admin` siempre retorna `true`.
  2. `es_solo_cuartel()` siempre retorna `false` para cualquier módulo distinto de `inicio`.
  3. Si hay fila explícita en `seguridad.usuario_modulo` para `(auth.uid(), p_modulo)`, aplica esa excepción (`ninguno` → `false`; `lectura` → `p_nivel = 'lectura'`; `gestion` → `true`).
  4. Sin fila explícita, hereda el bloque por rol (oficialidad, bomberos, consejo).
- `nucleo.mi_perfil()` incluye `modulos: Record<Seccion, 'ninguno'|'lectura'|'gestion'>`.
- `nucleo.listar_usuarios()` incluye `permisos_modulo` (lista de excepciones activas).
- Nuevo RPC `nucleo.admin_definir_permiso_modulo(p_user_id uuid, p_modulo text, p_nivel text)` (si `p_nivel is null` elimina la excepción y vuelve al bloque del rol).
- **Administración (`/administracion`):**
  - Pestaña **Usuarios y roles**: agrega botón **Permisos** junto a cada usuario para abrir `PermisosUsuarioDialog` con selector por módulo (*Heredado del rol · Sin acceso · Lectura · Gestión*).
  - Nueva pestaña **Unidades** (`UnidadesAdminTab`) para crear y editar registros de `material.unidad` (`codigo`, `tipo_unidad_id`, `patente`, `marca`, `modelo`, `anio`, `km_actual`, `estado`, `responsable_persona_id`).

### 4.2 Material: Inventario Compañía, Unidades y Bitácora
- Renombre visible de *"Pañol del 2°"* a **Inventario Compañía** en `MaterialPage.tsx`, `dialogos.tsx`, `InicioPage.tsx` y `README.md`.
- Enriquecimiento de `material.bitacora_unidad` con `tipo` (`mantencion | accidente | revision | combustible | novedad`), `titulo`, `costo`, `proxima_fecha`, `estado_unidad_post`.
- Trigger `bitacora_actualizar_unidad` que actualiza `km_actual` (cuando `new.km > coalesce(km_actual, 0)`) y opcionalmente `estado` cuando `estado_unidad_post` es informado.
- RLS: lectura para cualquier usuario con permiso en `material` (no `cuartel`); escritura para `capitan`, `teniente_3`, `teniente_2`, `director`, `admin` o `seguridad.tiene_permiso_modulo('material', 'gestion')`.
- UI: `VistaUnidades.tsx` consulta `material.unidad` reales con selector de carro y fichas técnicas; nueva pestaña **Bitácora de Unidades** (`BitacoraUnidades.tsx`) con filtro por carro y tipo, y diálogo de registro.

### 4.3 Asistencia: Claves 2026, Partes del Ayudante y Libro de Asistencia
- `asistencia.tipo_acto` recibe columna `categoria` (`emergencia | reunion | academia | citacion | otro`) y el catálogo real de claves del PDF 2026 (`1`, `1-1`, `2`, `2-1`, `2-2`, `2-3`, `3`, `3-1`, `3-2`, `4-1`…`4-4`, `5`…`5-2`, `6`…`6-5`, `7`, `8`, `8-1`, `8X1`, `8X3`, `8X11`, `9-1`, `10-1`, `10-2`, `11-1`, `12`…`12-3`, `14-1`, `14-2`, `15`…`15-2`, `RO`, `RE`, `REO`, `ACAD`, `EJER`, `SERV`, `OTRO`).
- `asistencia.lista` suma `citacion_id bigint references secretaria.citacion(id) on delete set null`, `comentarios text`, `hora_inicio time`, `hora_termino time`.
- Dos RPC `security definer` (bloqueadas para `cuartel`, accesibles para bomberos activos y oficialidad):
  - `asistencia.libro_anual(p_anio int, p_clave text default null)` → devuelve listas del año y filas por bombero activo (`registro`, `nombre`, `fecha_ingreso`, `cargo_grado`, marcas por lista y total de asistencias `A`) sin exponer `rut`/`telefono`/`direccion`.
  - `asistencia.detalle_parte(p_lista_id bigint)` → devuelve cabecera del parte (`numero`, `fecha`, `clave`, `descripcion`, `direccion`, `comentarios`, `citacion`, resumen de conteos) y marcas nominales (`registro`, `nombre`, `marca`, `observacion`).
- UI en `/asistencia`:
  - **Partes y listas:** creación de parte con selección de citación previa opcional, clave, dirección, horario y comentarios; clic en cualquier parte permite ver el detalle completo (para todos los bomberos) o pasar lista (Ayudante/gestión).
  - **Libro de Asistencia:** tabla matricial estilo PDF con columna fija de bombero y acumulado total, badges de color (`A` verde/número acumulado, `F` rosado, `R` amarillo, `P` celeste, `S` naranjo, `N/A` gris), filtros por año/clave/búsqueda y exportación CSV.
  - **Mi asistencia y claves:** resumen personal anual + buscador de claves de acto (`asistencia.tipo_acto`).

### 4.4 Panel de Estadísticas (`/estadisticas`)
- Nueva ruta `/estadisticas` y sección `estadisticas` en `SECCIONES` (por defecto oficialidad + admin, delegable por módulo).
- RPC `nucleo.estadisticas_compania(p_anio int)` retorna JSONB con:
  - `resumen` (total actos, emergencias, % asistencia promedio, bomberos activos, total asignaciones EPP, stock bajo mínimo, eventos bitácora).
  - `emergencias_por_mes` y `actos_por_clave` (top claves).
  - `asistencia_bomberos` (top participación y menor asistencia entre activos).
  - `material_asignado` (`mas_asignados` y `menos_asignados`) y `solicitudes_estado`.
  - `unidades_bitacora` (eventos y gasto por unidad) y `guardias_cobertura`.
- Interfaz con `recharts` (`ResponsiveContainer`, `BarChart`, `AreaChart`, `PieChart`) y tarjetas KPI de alto contraste aptas para pantallas de todas las edades y móvil.

---

## 5. Restricciones técnicas y de verificación
- React 19 + Vite 7 + TanStack Router/Query + `recharts` + `lucide-react`.
- `tsc --noEmit`, `eslint --max-warnings=0`, `vitest run` y `vite build` deben aprobar sin errores ni advertencias.
- Migración SQL y suite pgTAP deben pasar en CI (`supabase db reset`, `supabase db lint`, `supabase test db`).
