# Hoja de ruta

Estado real del sistema frente a `plataforma_etapa1_lectura.pdf` y los pasos siguientes, en orden de prioridad.

## Estado actual (30 migraciones, 10 esquemas)

| Módulo / Elemento | Estado | Notas |
|---|---|---|
| Base de datos (10 esquemas, RLS, auditoría con IP, R01–R16) | ✅ | Normalizada y con `GRANT` completos a `service_role` |
| **Tablero de Cuartel + rol `cuartel`** | ✅ | Órdenes del día, Órdenes de capitanía, Circulares CBL/Compañía y Citaciones |
| **Despacho unificado (Portal + Correo + Meta WhatsApp)** | ✅ | Plantillas aprobadas 1-a-1 en Meta v21.0 + trazabilidad en `nucleo.despacho` |
| Personal / Hoja de vida (antigüedad, categoría guardia, Charlie) | ✅ | Incluye datos sensibles auditados (Ley 21.719) |
| Asistencia con pase de lista sin conexión (PWA) | ✅ | Sincronización automática en IndexedDB |
| Guardias nocturnas (ciclos 14d, cupo semanal, reporte, firma, autoasignación) | ✅ | Conforme a Orden de Capitanía N° 01/2026 |
| Secretaría (actas estructuradas, acuerdos, correspondencia, postulaciones, P1/P2/P4) | ✅ | Centralizada en `/secretaria` |
| Material: Pañol Teniente 2° + solicitudes + EPP | ✅ | Vista 2D de carros (`VistaUnidades`) sigue en mock |
| Tesorería: cuotas con cartola automática y proyección | 🟡 Base | Falta ingreso/egreso general con comprobantes, cierres mensuales y P13/P21 |
| Documentos (P3, ACTA, ORDEN_CAPITANIA, ROL_GUARDIA, P1/P2/P4, Tablero + QR) | ✅ | Emisión con folio y SHA-256 |
| Administración (usuarios, roles incl. `cuartel`, catálogos, parámetros) | ✅ | Guards de ruta por rol activos |
| Campaña económica (talonarios, saldos) · Staging UI · Disciplina | 🧱 Modelo listo | Tablas listas; falta pantalla de gestión |
| Modelo dimensional `analitica` · API VIPER | 📄 Documentado | Diseño listo en `docs/datos/modelo-dimensional.md` |

## Próximos pasos

| Paso | Contenido | Por qué en este orden |
|---|---|---|
| **Siguiente · Paso A** | **Completar Tesorería (Etapa 2)**: registro de ingresos/egresos con comprobantes, compromisos y recurrentes editables, conciliación mensual, gráficos y PDFs P13/P21 | Cierra la parte contable del PDF original |
| **Paso B** | **Material mayor 2D (Etapa 3)**: editor interactivo 2D sobre fotos reales de las unidades, inventario por cajonera, P8, P9 y bitácora P10 | Queda listo para la actualización de inventario real |
| **Paso C** | **Cierre de Etapa 1 pendiente**: UI de Campaña económica, visor de `staging_importacion` y módulo de Disciplina | Completa al 100 % los módulos del PDF base |
| **Paso D (Transversal)** | **Salida a producción**: proyecto Supabase (São Paulo), Cloudflare Pages, dominio propio, secrets Meta WhatsApp y carga de `seed_real.sql` | Permite operar en vivo en el cuartel y móviles |
| **Paso E (Opcional)** | **Actas con NVIDIA Nemotron 3.5 Transcribe** (`docs/integraciones/nemotron-actas.md`) | Se activa cuando el Director apruebe el costo mensual |
| **Paso F** | Premios de constancia (P12), Electoral (P15), Traspaso (P17), `analitica` e integración API VIPER | Requiere historial acumulado en producción |

## Deuda técnica conocida
- PDF con `pdf-lib` en Edge Functions; plantilla Typst como diseño canónico (ADR 0004).
- Mock estático de carros 2D en `VistaUnidades.tsx`.
- Postulaciones: subida de certificados al bucket privado `sensibles`.
- Auditoría automatizada de accesibilidad con `axe`.

## Relacionado con
`docs/modulos/`, `docs/operacion/whatsapp.md`, `docs/ux/guia-de-diseno.md`.
