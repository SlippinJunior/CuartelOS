# Material, Administración, Asistencia (Libro 2026) y Estadísticas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el renombre a *Inventario Compañía* y la *Bitácora de Unidades*, añadir *CRUD de Unidades* y *permisos por usuario/módulo* en Administración, digitalizar los *partes del Ayudante y el Libro de Asistencia 2026* para toda la Compañía, e incorporar un *Panel de Estadísticas* con `recharts`.

**Architecture:** Una migración SQL única (`20261126000300`) extiende `seguridad` (tabla `usuario_modulo` y `tiene_permiso_modulo` sobre los bloques por rol), `material` (`bitacora_unidad` enriquecida y trigger de `km_actual`), `asistencia` (claves 2026, `citacion_id`/`comentarios` y RPCs `libro_anual` / `detalle_parte` sin filtrar datos sensibles) y `nucleo` (`estadisticas_compania`). En el frontend (`app/`), `permisos.ts` combina rol + excepciones de módulo, y cada feature consume directamente los nuevos contratos con tests unitarios en Vitest y pgTAP.

**Tech Stack:** PostgreSQL 17 / Supabase RLS + pgTAP, React 19, TypeScript, Vite 7, TanStack Router & Query, Tailwind CSS, shadcn/ui (envoltorios en español), `recharts`, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-26-material-admin-asistencia-estadisticas-design.md`](file:///home/papic/Documents/ProyectoBomba/docs/superpowers/specs/2026-11-26-material-admin-asistencia-estadisticas-design.md)

## Global Constraints

- **Aislamiento `cuartel`:** El rol `cuartel` (`es_solo_cuartel()`) solo accede a `/` (*Tablero de Cuartel*) y debe recibir `false`/0 filas en `usuario_modulo`, `bitacora_unidad`, `libro_anual`, `detalle_parte`, `estadisticas_compania` y `asistencia.lista`.
- **Privacidad de datos personales:** `asistencia.libro_anual` y `asistencia.detalle_parte` solo exponen `registro`, `nombre`, `fecha_ingreso`, `cargo_grado`, `marca`, `observacion` — nunca `rut`, `telefono`, `direccion` ni `dato_sensible`.
- **Compatibilidad UI en español:** No sobrescribir `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `select.tsx`, `button.tsx`, `badge.tsx`, `switch.tsx`. Mantener contraste WCAG AA (`>= 4.5:1`), objetivos táctiles `>= 44 px` y `0` warnings en ESLint (`--max-warnings=0`).
- **Renombre exacto:** Todo texto visible de *"Pañol del 2°"* / *"Pañol"* pasa a **Inventario Compañía** (se conservan nombres internos de tabla SQL `material.panol_stock` y RPCs existentes para no romper compatibilidad).

## Review Focus

1. **Usuario `cuartel` frente a RPCs `security definer` (`libro_anual`, `detalle_parte`, `estadisticas_compania`):** podría saltarse RLS si no se verifica `seguridad.es_solo_cuartel()` al inicio de cada función — cubierto por tests pgTAP en Task 1.
2. **Excepción `ninguno` en `seguridad.usuario_modulo` sobre un rol oficial (p. ej. `bombero` o `capitan`):** la excepción explícita debe anular la herencia del rol tanto en `tiene_permiso_modulo()` como en `permisos.ts` — cubierto en Task 1 (pgTAP) y Task 2 (`permisos.test.ts`).
3. **Actualización de `km_actual` desde `bitacora_unidad` con km menor o nulo:** un registro histórico antiguo no debe retroceder el kilometraje actual de `material.unidad` — cubierto por condición `new.km > coalesce(km_actual, 0)` en trigger y test en Task 1.
4. **Cálculo de acumulado y `N/A` en Libro 2026:** listas anteriores a `fecha_ingreso` deben mostrarse `N/A`, `R`/`S` no suman asistencia, y `A` incrementa el acumulado `1, 2, 3…` — cubierto por `features/asistencia/logica.test.ts` en Task 5.
5. **División por cero en Estadísticas con año sin datos:** `estadisticas_compania` con un año vacío debe retornar arreglos vacíos `[]` y porcentajes `0` sin `NaN` ni `null` que rompa `recharts` — cubierto en Task 1 (pgTAP) y Task 6 (`features/estadisticas/logica.test.ts`).

---

### Task 1: Migración SQL, Seed Demo y Suite pgTAP

**Files:**
- Create: `supabase/migrations/20261126000300_material_admin_asistencia_estadisticas.sql`
- Create: `supabase/tests/material_admin_asistencia_estadisticas.test.sql`
- Modify: `scripts/generar-seed-ficticio/generar.py`
- Modify: `supabase/seed.sql`

**Interfaces:**
- Produces SQL tables/columns: `seguridad.usuario_modulo`, `material.bitacora_unidad (tipo, titulo, costo, proxima_fecha, estado_unidad_post)`, `asistencia.tipo_acto (categoria)`, `asistencia.lista (citacion_id, comentarios, hora_inicio, hora_termino)`.
- Produces SQL RPCs: `seguridad.tiene_permiso_modulo(text, text)`, `nucleo.modulos_efectivos()`, `nucleo.admin_definir_permiso_modulo(uuid, text, text)`, `asistencia.libro_anual(integer, text)`, `asistencia.detalle_parte(bigint)`, `nucleo.estadisticas_compania(integer)`.
- Updates SQL RPCs: `nucleo.mi_perfil()` (agrega `modulos`), `nucleo.listar_usuarios()` (agrega `permisos_modulo`).

- [ ] **Step 1: Escribir los tests pgTAP que verifican permisos por módulo, aislamiento `cuartel`, bitácora y RPCs**

Crear `supabase/tests/material_admin_asistencia_estadisticas.test.sql` con `select plan(14);` probando:
- `admin_definir_permiso_modulo` otorga `'gestion'` en `'material'` a un `bombero` y `tiene_permiso_modulo('material', 'gestion')` retorna `true`.
- Excepción `'ninguno'` revoca acceso a `'estadisticas'` para un `capitan` (`tiene_permiso_modulo('estadisticas', 'lectura')` = `false`).
- `admin_definir_permiso_modulo(..., null)` restaura el permiso heredado del rol.
- Usuario `cuartel` recibe excepción de privilegios en `asistencia.libro_anual`, `asistencia.detalle_parte` y `nucleo.estadisticas_compania`, y 0 filas en `material.bitacora_unidad`.
- Insertar en `material.bitacora_unidad` con `km` mayor actualiza `material.unidad.km_actual`, y un registro con `km` menor NO lo retrocede.
- `asistencia.libro_anual(2026, null)` retorna listas, filas de personas y claves reales (`10-1`, `RO`, etc.) para un `bombero`.
- `nucleo.estadisticas_compania(2099)` (año sin listas) retorna estructura JSON válida sin nulls en arrays.

- [ ] **Step 2: Crear la migración `supabase/migrations/20261126000300_material_admin_asistencia_estadisticas.sql`**

Implementar en orden:
1. `seguridad.usuario_modulo`, `seguridad.tiene_permiso_modulo(p_modulo text, p_nivel text default 'lectura')`, `nucleo.modulos_efectivos()`, actualización de `nucleo.mi_perfil()`, `nucleo.listar_usuarios()`, y `nucleo.admin_definir_permiso_modulo()`.
2. Enriquecimiento de `material.bitacora_unidad`, trigger `material.fn_bitacora_actualizar_unidad()`, políticas RLS actualizadas para `material.unidad`, `material.bitacora_unidad`, `material.panol_stock`, `material.asignacion` usando `tiene_permiso_modulo('material', ...)`, y política de escritura en `material.unidad` para `puede_administrar_usuarios()` o `tiene_permiso_modulo('administracion', 'gestion')`.
3. Columna `categoria` en `asistencia.tipo_acto` + `insert ... on conflict do update` de las claves del Libro 2026 (`RO`, `RE`, `REO`, `1`, `1-1`, `2`, `2-1`, `2-2`, `2-3`, `3`, `3-1`, `3-2`, `4-1`..`4-4`, `5`..`5-2`, `6`..`6-5`, `7`, `8`, `8-1`, `8X1`, `8X3`, `8X11`, `9-1`, `10-1`, `10-2`, `11-1`, `12`..`12-3`, `14-1`, `14-2`, `15`..`15-2`, `ACAD`, `EJER`, `SERV`, `OTRO`).
4. Columnas `citacion_id`, `comentarios`, `hora_inicio`, `hora_termino` en `asistencia.lista`; políticas RLS de `asistencia.lista` y `asistencia.asistencia` incluyendo `tiene_permiso_modulo('asistencia', 'gestion')`; RPCs `asistencia.libro_anual(p_anio int, p_clave text default null)` y `asistencia.detalle_parte(p_lista_id bigint)`.
5. RPC `nucleo.estadisticas_compania(p_anio int default extract(year from current_date)::int)` con guard `tiene_permiso_modulo('estadisticas', 'lectura')`.
6. Grants correspondientes a `authenticated` y `service_role`.

- [ ] **Step 3: Actualizar `scripts/generar-seed-ficticio/generar.py` y regenerar `supabase/seed.sql`**

Agregar al seed ficticio:
- Claves reales variadas (`10-1`, `6-4`, `12-2`, `1`, `2`, `RO`, `RE`) y `comentarios` en listas recientes.
- Entradas en `material.bitacora_unidad` (`mantencion`, `revision`, `accidente`, `combustible`) para `M-21` y `M-22`.
- Variación de asignaciones EPP en `material.asignacion` para que Estadísticas muestre artículos más y menos asignados.
Ejecutar: `python3 scripts/generar-seed-ficticio/generar.py > supabase/seed.sql`.

- [ ] **Step 4: Validar sintaxis SQL y seed**

Si Docker está disponible, correr `supabase db reset && supabase db lint && supabase test db`. Si Docker no está disponible en el entorno local, validar que `generar.py` genere `seed.sql` sin errores y que las funciones/vistas no tengan errores de sintaxis evidentes, dejando `supabase test db` para CI / entorno con Docker.

---

### Task 2: Motor de Permisos por Módulo y Navegación (`permisos.ts` + Layout)

**Files:**
- Modify: `app/src/types/tipos.ts`
- Modify: `app/src/lib/permisos.ts`
- Modify: `app/src/lib/permisos.test.ts`
- Modify: `app/src/components/layout/iconos.ts`
- Modify: `app/src/app/AppShell.tsx`
- Modify: `app/src/components/layout/Sidebar.tsx`
- Modify: `app/src/components/layout/BottomNav.tsx`
- Modify: `app/src/components/layout/BuscadorGlobal.tsx`
- Modify: `app/src/features/inicio/InicioPage.tsx`
- Modify: `app/src/features/secretaria/SecretariaPage.tsx`

**Interfaces:**
- Consumes: `Perfil.modulos?: Partial<Record<Seccion, NivelPermiso>>` desde `nucleo.mi_perfil()`.
- Produces:
  - `export type NivelPermiso = "ninguno" | "lectura" | "gestion";`
  - `export type Seccion = ... | "estadisticas";`
  - `nivelPermiso(roles: readonly string[], seccion: Seccion, modulos?: Partial<Record<Seccion, NivelPermiso>>): NivelPermiso`
  - `puedeVer(roles: readonly string[], seccion: Seccion, modulos?: Partial<Record<Seccion, NivelPermiso>>): boolean`
  - `puedeGestionar(roles: readonly string[], seccion: Seccion, modulos?: Partial<Record<Seccion, NivelPermiso>>): boolean`
  - `seccionesDe(roles: readonly string[], modulos?: Partial<Record<Seccion, NivelPermiso>>): Seccion[]`
  - `barraInferior(roles: readonly string[], modulos?: Partial<Record<Seccion, NivelPermiso>>): Seccion[]`
  - `restantesDeBarra(roles: readonly string[], modulos?: Partial<Record<Seccion, NivelPermiso>>): Seccion[]`

- [ ] **Step 1: Escribir tests unitarios en `app/src/lib/permisos.test.ts` (TDD)**

Agregar tests verificando:
- `nivelPermiso(["bombero"], "estadisticas")` === `"ninguno"`, pero con `{ estadisticas: "lectura" }` retorna `"lectura"` y `puedeVer(..., modulos)` === `true`.
- `nivelPermiso(["capitan"], "material", { material: "ninguno" })` === `"ninguno"` (excepción bloquea herencia).
- `nivelPermiso(["cuartel"], "estadisticas", { estadisticas: "gestion" })` === `"ninguno"` (`cuartel` jamás sale de `inicio`).
- `puedeGestionar(["teniente_2"], "material")` === `true` y `puedeGestionar(["bombero"], "material", { material: "gestion" })` === `true`.
- `seccionesDe(["director"])` incluye `"estadisticas"`.

- [ ] **Step 2: Ejecutar Vitest para confirmar que los nuevos tests fallan**

Run: `./app/node_modules/.bin/vitest run --root app src/lib/permisos.test.ts`
Expected: FAIL (`nivelPermiso` / `puedeGestionar` / `estadisticas` no definidos).

- [ ] **Step 3: Actualizar `tipos.ts`, `permisos.ts`, `iconos.ts` y los componentes de layout**

- Añadir `"estadisticas"` a `Seccion`, `SECCIONES`, `GRUPOS_NAVEGACION` (en `"Compañía"`), `SECCIONES_POR_ROL` (todas las oficialidades + `admin`) e `ICONOS` (`BarChart3`).
- Actualizar `SECCIONES.material.descripcion` a `"Unidades, inventario compañía y bitácora"`.
- Implementar `nivelPermiso` y `puedeGestionar` en `permisos.ts` (con compatibilidad opcional del 3er argumento `modulos`).
- Pasar `perfil?.modulos` desde `AppShell.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `BuscadorGlobal.tsx`, `InicioPage.tsx` y `SecretariaPage.tsx`.

- [ ] **Step 4: Re-ejecutar `permisos.test.ts`**

Run: `./app/node_modules/.bin/vitest run --root app src/lib/permisos.test.ts`
Expected: PASS (todos los tests verdes).

---

### Task 3: Administración — Permisos por Módulo y CRUD de Unidades

**Files:**
- Create: `app/src/features/administracion/PermisosUsuarioDialog.tsx`
- Create: `app/src/features/administracion/UnidadesAdminTab.tsx`
- Modify: `app/src/features/administracion/AdministracionPage.tsx`
- Modify: `app/src/types/tipos.ts` (tipos `UnidadAdminForm`, `PermisoModuloUsuario`)

**Interfaces:**
- Consumes: `nucleo.listar_usuarios()`, `nucleo.admin_definir_permiso_modulo`, `material.unidad`, `material.tipo_unidad`, `personal.persona`.
- Produces:
  - `PermisosUsuarioDialog({ usuario, onCerrar })`
  - `UnidadesAdminTab()`

- [ ] **Step 1: Agregar tipos `PermisoModuloUsuario` y ampliar `UsuarioAdmin` y `Unidad` en `app/src/types/tipos.ts`**

Incluir `permisos_modulo?: Array<{ modulo: Seccion; nivel: NivelPermiso }>` en `UsuarioAdmin` y `transmision`, `n_motor`, `n_chasis`, `responsable_persona_id` en `Unidad`.

- [ ] **Step 2: Crear `PermisosUsuarioDialog.tsx`**

Diálogo que muestra los roles actuales del usuario (bloque heredado), la lista de módulos controlables con un `<Select>` por módulo (`Heredado del rol (...)`, `Sin acceso`, `Lectura`, `Gestión`) y guarda los cambios llamando a `db.nucleo.rpc("admin_definir_permiso_modulo", ...)` invalidando `["usuarios-admin"]` y `["mi-perfil"]`.

- [ ] **Step 3: Crear `UnidadesAdminTab.tsx` e integrarlo en `AdministracionPage.tsx`**

- Tabla/tarjetas responsivas con unidades existentes (`codigo`, `tipo_unidad`, `patente`, `marca`, `modelo`, `anio`, `km_actual`, `estado`), buscador y diálogo **Nueva unidad / Editar unidad** con validaciones mínimas (`codigo` obligatorio).
- En `AdministracionPage.tsx`: habilitar acceso si `puedeVer(roles, "administracion", perfil?.modulos)`, agregar botón **Permisos** en `UsuariosTab` y agregar la pestaña `"unidades"` (`Unidades`).

- [ ] **Step 4: Verificar compilación y lint de `administracion/`**

Run: `./app/node_modules/.bin/tsc -p app/tsconfig.json --noEmit && ./app/node_modules/.bin/eslint --config app/eslint.config.js app/src/features/administracion --max-warnings=0`
Expected: PASS con 0 errores y 0 warnings.

---

### Task 4: Material — Renombre a Inventario Compañía, Unidades Reales y Bitácora de Unidades

**Files:**
- Create: `app/src/features/material/BitacoraUnidades.tsx`
- Modify: `app/src/features/material/logica.ts`
- Modify: `app/src/features/material/logica.test.ts`
- Modify: `app/src/features/material/MaterialPage.tsx`
- Modify: `app/src/features/material/dialogos.tsx`
- Modify: `app/src/features/material/VistaUnidades.tsx`
- Modify: `app/src/features/inicio/InicioPage.tsx`
- Modify: `app/src/types/tipos.ts`

**Interfaces:**
- Consumes: `material.unidad`, `material.unidad_documento`, `material.bitacora_unidad`, `puedeGestionar(roles, "material", modulos)`.
- Produces:
  - `BitacoraEntrada`, `TipoBitacoraUnidad` en `tipos.ts`.
  - `ETIQUETAS_BITACORA`, `esGestorMaterial(roles, modulos)`, `puedeEditarBitacora(roles, modulos)` en `features/material/logica.ts`.
  - `BitacoraUnidades({ puedeEditar })` en `BitacoraUnidades.tsx`.

- [ ] **Step 1: Escribir tests unitarios de Bitácora y permisos en `app/src/features/material/logica.test.ts` (TDD)**

Agregar tests para `puedeEditarBitacora` (Capitán, Teniente 3°, Teniente 2°, Director, Admin, y bombero con excepción `gestion` en `material`), `etiquetaTipoBitacora` y orden/resumen de entradas de bitácora.

- [ ] **Step 2: Ejecutar Vitest para confirmar fallo previo**

Run: `./app/node_modules/.bin/vitest run --root app src/features/material/logica.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `logica.ts`, renombre a *Inventario Compañía*, `VistaUnidades.tsx` y `BitacoraUnidades.tsx`**

- Renombrar *"Pañol del 2°"* / *"Pañol"* → **Inventario Compañía** en `MaterialPage.tsx`, `dialogos.tsx`, `InicioPage.tsx` (`Avisos de Inventario Compañía` / `Ir al inventario`).
- En `VistaUnidades.tsx`: consultar `material.unidad` y `material.unidad_documento`, permitir seleccionar cualquier carro de la compañía (M-21, M-22, o los nuevos creados en Administración) y mostrar su ficha real + visor de cajoneras.
- En `BitacoraUnidades.tsx`: listar entradas de `material.bitacora_unidad` con filtros por unidad y tipo (`Mantención`, `Accidente`, `Revisión`, `Combustible`, `Novedad`), badges semánticos y diálogo para registrar evento (`unidad_id`, `fecha`, `tipo`, `titulo`, `km`, `horas_bomba`, `costo`, `proxima_fecha`, `estado_unidad_post`, `novedades`).
- Agregar pestaña **Bitácora de Unidades** en `MaterialPage.tsx`.

- [ ] **Step 4: Ejecutar Vitest de material**

Run: `./app/node_modules/.bin/vitest run --root app src/features/material/logica.test.ts`
Expected: PASS.

---

### Task 5: Asistencia — Partes del Ayudante, Libro de Asistencia 2026 y Claves

**Files:**
- Create: `app/src/features/asistencia/logica.ts`
- Create: `app/src/features/asistencia/logica.test.ts`
- Create: `app/src/features/asistencia/LibroAsistenciaTab.tsx`
- Create: `app/src/features/asistencia/ParteDetalleDialog.tsx`
- Modify: `app/src/features/asistencia/AsistenciaPage.tsx`
- Modify: `app/src/features/asistencia/ListaPage.tsx`
- Modify: `app/src/features/asistencia/MiAsistenciaPage.tsx`
- Modify: `app/src/types/tipos.ts`

**Interfaces:**
- Consumes: `asistencia.libro_anual`, `asistencia.detalle_parte`, `asistencia.tipo_acto`, `secretaria.citacion`, `puedeGestionar(roles, "asistencia", modulos)`.
- Produces:
  - `calcularAcumuladosLibro(marcas, fechaIngreso, listas)` en `features/asistencia/logica.ts`.
  - `exportarLibroCsv(libro)` en `features/asistencia/logica.ts`.
  - `LibroAsistenciaTab()` y `ParteDetalleDialog({ listaId, onCerrar })`.

- [ ] **Step 1: Escribir tests en `app/src/features/asistencia/logica.test.ts` (TDD)**

Probar:
- Conteo acumulado en el Libro: `["A", "F", "A", "R", "P", "A"]` produce celdas `["1", "F", "2", "R", "P", "3"]` y total `3`.
- Listas con `fecha < fecha_ingreso` producen `"N/A"` aunque no tengan marca o tengan `"F"`.
- Generación de CSV escapando comas y encabezados `Reg.,Bombero,Total,...`.

- [ ] **Step 2: Ejecutar Vitest para confirmar fallo previo**

Run: `./app/node_modules/.bin/vitest run --root app src/features/asistencia/logica.test.ts`
Expected: FAIL (`Cannot find module`).

- [ ] **Step 3: Implementar `logica.ts`, `LibroAsistenciaTab.tsx`, `ParteDetalleDialog.tsx` y actualizar las páginas**

- En `AsistenciaPage.tsx`:
  - Organizar en 3 pestañas: **Partes y listas**, **Libro de Asistencia**, **Mi asistencia y claves**.
  - En **Nueva lista / parte**: permitir vincular una citación reciente (`secretaria.citacion`), seleccionar `tipo_acto_clave` (agrupado o filtrable con descripción), `direccion`, `hora_inicio`, `hora_termino`, `comentarios` (observaciones del parte).
  - Para cualquier bombero: clic en un parte abre `ParteDetalleDialog` (consulta de clave, horario, dirección, comentarios del Ayudante y nómina de marcas) o ir a `Pasar lista` si tiene gestión.
- En `ListaPage.tsx`: mostrar los comentarios y dirección del parte arriba y permitir editar `comentarios` mientras la lista está en borrador o por el Ayudante.
- En `LibroAsistenciaTab.tsx`: matriz anual fiel al PDF 2026 con columna fija de bombero, filtros por año/clave/búsqueda, leyenda de colores (`A`, `F`, `R`, `P`, `S`, `N/A`) y botón **Exportar CSV**.
- En `MiAsistenciaPage.tsx`: incluir pestaña/bloque de **Consulta de claves de acto** (`asistencia.tipo_acto`) y mostrar la clave junto a cada acto del bombero.

- [ ] **Step 4: Ejecutar Vitest de asistencia**

Run: `./app/node_modules/.bin/vitest run --root app src/features/asistencia/logica.test.ts`
Expected: PASS.

---

### Task 6: Panel de Estadísticas (`recharts`), Documentación y Verificación Final

**Files:**
- Modify: `app/package.json` & `pnpm-lock.yaml` (instalar `recharts`)
- Create: `app/src/features/estadisticas/logica.ts`
- Create: `app/src/features/estadisticas/logica.test.ts`
- Create: `app/src/features/estadisticas/EstadisticasPage.tsx`
- Create: `app/src/features/estadisticas/README.md`
- Create: `docs/modulos/estadisticas.md`
- Modify: `app/src/app/router.tsx`
- Modify: `docs/modulos/README.md`, `docs/modulos/material.md`, `docs/modulos/asistencia.md`, `docs/modulos/administracion.md`, `app/src/features/material/README.md`, `app/src/features/asistencia/README.md`, `app/src/features/administracion/README.md`, `supabase/migrations/README.md`

**Interfaces:**
- Consumes: `db.nucleo.rpc("estadisticas_compania", { p_anio })`.
- Produces: ruta `/estadisticas` y componente `EstadisticasPage`.

- [ ] **Step 1: Instalar `recharts` en `app/`**

Run: `pnpm --filter erp-segunda-compania-app add recharts`

- [ ] **Step 2: Escribir tests de normalización en `app/src/features/estadisticas/logica.test.ts` (TDD)**

Probar `normalizarEstadisticas(raw)` con payload vacío/null y con payload completo (verificando fallback seguro a `0` y `[]` y cálculo de variación/etiquetas).

- [ ] **Step 3: Implementar `logica.ts`, `EstadisticasPage.tsx` y registrar `/estadisticas` en `router.tsx`**

Secciones visuales con `recharts` (`ResponsiveContainer`, `BarChart`, `AreaChart`, `PieChart`) y tarjetas KPI:
1. Selector de año + 4 tarjetas KPI (Actos y emergencias, % Asistencia promedio, Solicitudes/EPP activos, Eventos bitácora unidades).
2. **Emergencias y actos:** tendencia mensual (`AreaChart`) y ranking de claves (`BarChart` horizontal).
3. **Asistencia de bomberos:** distribución `A/F/P/R/S/L` + top mayor participación y menor participación activa.
4. **Material Compañía y EPP:** materiales que **más** tienen asignados los bomberos vs los que **menos** tienen, más alerta de stock bajo mínimo.
5. **Unidades y Guardias:** mantenciones/accidentes/gasto por carro y cobertura de guardias.

- [ ] **Step 4: Actualizar documentación MD por módulo**

Actualizar READMEs en `app/src/features/*`, `docs/modulos/*` y `supabase/migrations/README.md`.

- [ ] **Step 5: Verificación completa end-to-end**

Run:
```bash
./app/node_modules/.bin/tsc -p app/tsconfig.json --noEmit \
  && ./app/node_modules/.bin/eslint --config app/eslint.config.js app/src --max-warnings=0 \
  && ./app/node_modules/.bin/vitest run --root app \
  && (cd app && ./node_modules/.bin/vite build)
```
Expected: `tsc` exit 0, `eslint` 0 errors / 0 warnings, `vitest` all suites pass, `vite build` limpio.
