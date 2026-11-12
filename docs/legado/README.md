# Plataforma de Gestión · Segunda Compañía de Bomberos de Limache
Etapa 1: base de datos, seguridad por cargo, cruces automáticos, migración y documentos PDF.

## Contenido
| Archivo | Qué hace |
|---|---|
| `supabase/migrations/0001_esquema.sql` | 35 tablas: personas, cargos, cursos ANB, premios, sanciones, listas y asistencia, órdenes y guardias, unidades, inventario, prendas a cargo, mantenciones, tesorería (categorías, presupuesto, movimientos, cuotas, cierres), campaña (talonarios y saldos), actas, acuerdos, correspondencia, adjuntos, alertas y área de importación. |
| `0002_seguridad.sql` | Roles por cargo, seguridad por fila (cada bombero ve solo su hoja de vida), historial de cambios en todas las tablas, movimientos que no se borran (se anulan) y sanciones reservadas. |
| `0003_cruces.sql` | Vistas de asistencia, presupuesto vs ejecución, cuotas pendientes y saldo de campaña; 11 reglas de alerta (R01–R11) que se ejecutan cada noche. |
| `0004_documentos.sql` | Folio correlativo por tipo y año, huella SHA-256 de cada PDF y verificación pública por QR sin exponer datos personales. |
| `scripts/migrar_desde_json.py` | Genera `supabase/seed.sql` desde los datos de muestra. Lo dudoso va a `staging_importacion` para revisión. |
| `plantillas/hoja_de_vida.typ` | Plantilla PDF de hoja de vida (Typst) con escudo, folio, QR y firmas. |
| `docs/ejemplo_hoja_de_vida.pdf` | Ejemplo generado (marcado EJEMPLO). |

## Instalación (30 minutos)
1. Crear proyecto en supabase.com, región **South America (São Paulo)**. Guardar la contraseña de la base de datos.
2. Settings → API → *Exposed schemas*: agregar `gestion`.
3. SQL Editor: ejecutar en orden `0001`, `0002`, `0003`, `0004`.
4. Generar y cargar los datos de muestra:
   `python3 scripts/migrar_desde_json.py data_segunda.json > supabase/seed.sql` y ejecutar `seed.sql` en el SQL Editor (o `psql`).
5. Crear los usuarios en Authentication → Users y vincularlos:
   ```sql
   insert into gestion.usuario(user_id, persona_id) values ('<uuid de auth>', (select id from gestion.persona where registro = 217));
   insert into gestion.usuario_rol(user_id, rol) values ('<uuid de auth>', 'director');
   ```
6. Ejecutar `select gestion.generar_alertas();` y revisar `gestion.alerta`.
7. Activar `pg_cron` (Database → Extensions) y programar la línea comentada al final de `0003`.
8. Storage: crear el bucket privado `documentos` para actas, comprobantes y PDF emitidos.

## Roles
`director`, `secretario`, `prosecretario`, `tesorero`, `protesorero`, `capitan`, `teniente`, `ayudante`, `consejo`, `bombero`, `admin`.
La oficialidad lee todo (salvo sanciones y auditoría); cada área escribe solo lo suyo; el bombero ve su propia hoja de vida, asistencia, cuotas, material y saldo de campaña.

## Generar un PDF
```bash
pip install typst qrcode
typst compile --input datos=hv.json plantillas/hoja_de_vida.typ hv.pdf
```
En producción, una Edge Function arma `hv.json` desde la base, pide `gestion.siguiente_folio('HOJA_VIDA')`, compila, calcula el SHA-256, guarda el PDF en Storage y registra `documento_emitido`.

## Pendientes antes de producción
- Cargar niveles ANB oficiales, premios históricos y fechas de ingreso faltantes (`staging_importacion`).
- Confirmar con el reglamento: antigüedad mínima por cargo (R10, configurado en 2 años) y requisitos de premios (R11).
- Asignar a cada cuota el bombero y los meses pagados (quedan en `staging_importacion`).
- Si el Cuerpo usa VIPER Gestión, importar su asistencia por `staging_importacion` (origen `viper_asistencia`) en vez de digitarla dos veces.
- Completar descripciones de las claves de acto en `tipo_acto`.
- Validar todo en un proyecto de prueba antes de cargar datos reales; los scripts pasaron revisión de sintaxis PostgreSQL, pero aún no se ejecutaron en un servidor.

## Etapa 2 (siguiente)
Aplicación Next.js + shadcn/ui sobre este esquema: inicio por cargo, hoja de vida, pase de lista en el celular (PWA), tesorería con adjuntos, actas con acuerdos y emisión de PDF.
