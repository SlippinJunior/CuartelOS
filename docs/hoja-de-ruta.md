# Hoja de ruta

La Etapa 1 deja la fundación y dos módulos funcionales. Las siguientes etapas se
construyen sobre el mismo modelo, sin migraciones destructivas.

| Etapa | Contenido | Depende de |
|---|---|---|
| **1** | Fundación + Personal/Hoja de vida + Asistencia + documentos P3 + importación | — |
| **2** | **Tesorería cartola**: registro, conciliación mensual, compromisos, recurrentes, escenarios, gráficos (saldo 3/6/12 meses, ejecución, ingresos vs egresos), P13 y P21 | Etapa 1 |
| **3** | **Material mayor 2D**: editor de zonas sobre foto, inventario por cajonera, revisión en terreno, vestuario/EPP (P8, P9), guardia nocturna (P7), bitácoras (P10) | Etapa 1 |
| **4** | Premios de constancia con quinquenios y arrastre (P12) | Personal + asistencia |
| **5** | Electoral (P15), disciplina (P16), traspaso anual (P17), memoria y carpeta anual | Secretaría + actas |
| **6** | Esquema `analitica` (modelo dimensional), módulo de informes, integración API VIPER | Datos estables |
| Transversal | Dominio, Cloudflare Pages, Supabase nube, respaldos y capacitación | Etapa 1 |

## Criterios de cierre de cada etapa
1. Migraciones aplicadas y `db lint` limpio.
2. pgTAP de las nuevas reglas.
3. Pantallas probadas en celular y escritorio.
4. Documentación del módulo actualizada.
5. Respaldo y plan de reversa.

## Deuda técnica conocida
- PDF con `pdf-lib` en vez de Typst (ver ADR 0004).
- Mock estático de material 2D y tesorería.
- Búsqueda global `Ctrl K` y command palette pendientes.
- Notificaciones push y correo masivo.
- Auditoría de accesibilidad con axe.

## Relacionado con
`plan_implementacion.md`, `docs/modulos/`.
