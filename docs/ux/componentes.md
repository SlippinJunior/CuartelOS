# Componentes

## Primitivas (`components/ui`)
| Componente | Uso | Notas |
|---|---|---|
| `Button` | Acción | Variantes default, secondary, outline, ghost, destructive, link |
| `Input` | Texto corto | 44 px de alto |
| `Textarea` | Texto largo | Altura mínima 96 px |
| `Select` | Catálogo | Select nativo por accesibilidad |
| `Label` | Etiqueta | Asociar siempre con `htmlFor` |
| `Card` | Contenedor | Cabecera, contenido y pie |
| `Badge` | Estado | Variantes semáforo |
| `Table` | Datos tabulares | Solo escritorio |
| `Tabs` | Secciones | Controlado o no |
| `Dialog` | Confirmación / formulario corto | `<dialog>` nativo |
| `Sheet` | Hoja inferior / panel lateral | `<dialog>` nativo |
| `Switch` | Sí/no | `role="switch"` |
| `Skeleton` | Carga | No abusar |
| `Separator` | División | — |

## Comunes (`components/common`)
| Componente | Uso |
|---|---|
| `ResponsiveList` | Tarjetas en celular, tabla en escritorio |
| `EmptyState` | Vacío con icono, explicación y acción |
| `ConfirmDialog` | Acción irreversible con motivo obligatorio |
| `StatusBadge` | Estado y semáforo de vencimiento |
| `Proximamente` | Esqueleto de módulo con alcance |

## Layout (`components/layout`)
`Sidebar`, `BottomNav`, `MoreSheet`, `PageHeader`, `ThemeToggle`,
`ConnectionIndicator`.

## Reglas
- No dupliques un componente: si se usa dos veces, sube a `common`.
- Un componente no llama a Supabase; recibe datos y callbacks.
- Los textos de botones son verbos concretos ("Guardar ficha", "Cerrar lista").
- Los iconos solos llevan `aria-label`.

## Relacionado con
`app/src/components/`, `app/components.json`.
