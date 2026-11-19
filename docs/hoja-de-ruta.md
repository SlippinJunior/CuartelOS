# Hoja de ruta

Estado real del sistema y los pasos siguientes, en orden de prioridad.

## Estado actual

| Módulo | Estado |
|---|---|
| Base de datos (10 esquemas, RLS, auditoría, 25 migraciones) | ✅ |
| Personal / Hoja de vida (antigüedad, categoría de guardia, Charlie) | ✅ |
| Asistencia con pase de lista sin conexión | ✅ |
| Guardias nocturnas (ciclos, cupo semanal, reporte, firma, autoasignación) | ✅ |
| Tesorería: cuotas con cartola automática, proyección | ✅ (base) |
| Secretaría: actas estructuradas, acuerdos, correspondencia, postulaciones, altas y bajas | ✅ |
| Documentos: P3, actas, órdenes de capitanía, P1, P2, P4, verificación QR | ✅ |
| Administración (usuarios, roles, catálogos, parámetros) | ✅ |
| Material mayor 2D, vestuario y EPP | 🧱 esqueleto con mock |
| Disciplina (Consejo) | 🧱 modelo y RLS listos |
| Modelo dimensional `analitica`, VIPER | 📄 documentado |

## Próximos pasos

| Paso | Contenido | Por qué en este orden |
|---|---|---|
| **Siguiente · Paso A** | **Completar Tesorería (Etapa 2)**: registro de ingresos y egresos con comprobantes, compromisos y recurrentes editables, conciliación mensual, gráficos de proyección y PDFs P13/P21 | Ya está el 60 % construido (`TesoreriaPage` con cuotas y cartola); cerrarlo da control financiero total al Tesorero |
| **Paso B** | **Material mayor 2D + Vestuario/EPP (Etapa 3)**: editor interactivo 2D sobre fotos reales de las unidades, inventario por cajonera, hojas de cargo P8, paz y salvo P9 y bitácora P10 | Queda listo justo cuando llegue la actualización de inventario real de la compañía |
| **Paso C (Transversal)** | **Salida a producción**: proyecto Supabase en São Paulo, Cloudflare Pages, dominio propio, carga de `seed_real.sql` e invitación de oficiales | Con Personal, Asistencia, Guardias, Secretaría y Tesorería listos, la compañía ya puede operar en vivo |
| **Paso D (Opcional)** | **Actas con NVIDIA Nemotron 3.5 Transcribe** | Ver `docs/integraciones/nemotron-actas.md`; se activa cuando el Director apruebe el costo mensual (menos de $2.000 CLP) y usa el editor de actas ya construido |
| **Pasos E–F** | Premios de constancia (P12) → Electoral (P15), Disciplina (P16), Traspaso (P17) → esquema dimensional `analitica` e integración API VIPER | Requieren datos históricos acumulados en producción |

## Deuda técnica conocida

- PDF con `pdf-lib` en la Edge Function; la plantilla Typst sigue como diseño
  canónico (ADR 0004).
- Mock estático de material 2D.
- Postulaciones: los certificados sensibles aún no se suben al bucket
  `sensibles`; hoy solo se marca el checklist.
- Autoasignación de guardias: el aviso es in-app; falta enviarlo también por
  correo y WhatsApp.
- Búsqueda global `Ctrl K` y command palette pendientes.
- Auditoría de accesibilidad con axe.

## Relacionado con
`docs/modulos/`, `docs/integraciones/nemotron-actas.md`.
