# ERP · Segunda Compañía de Bomberos de Limache

> Repositorio: [`SlippinJunior/CuartelOS`](https://github.com/SlippinJunior/CuartelOS)

[![CI](https://github.com/SlippinJunior/CuartelOS/actions/workflows/ci.yml/badge.svg)](https://github.com/SlippinJunior/CuartelOS/actions/workflows/ci.yml)

Sistema de gestión de la Segunda Compañía, construido a partir del documento
*ERP Segunda Compañía CBL*. La Etapa 1 deja una fundación completa y funcional:
base de datos normalizada con seguridad por fila, **Personal / Hoja de vida** y
**Asistencia** operativos, emisión de PDF con folio y verificación pública, y
esqueletos navegables para los módulos de las etapas siguientes.

> **Datos reales nunca en git.** El seed versionado es ficticio. El legado y el
> respaldo real se guardan en `data/privado/`, que está ignorado.

---

## Demo pública

La demo corre en Vercel contra un proyecto Supabase con **datos ficticios**.
Los usuarios demo (`director@demo.local`, `tesorero@demo.local`,
`bombero@demo.local`…, contraseña `demo1234`) aparecen como botones en el login.

Pasos completos para desplegarla: [`docs/operacion/demo-vercel.md`](docs/operacion/demo-vercel.md).

## Empezar en 5 minutos

Requisitos: Node 22+, pnpm 10+, Docker, Supabase CLI.

```bash
pnpm install
pnpm supabase start          # primera vez: descarga imágenes (varios minutos)
pnpm supabase db reset       # aplica las 27 migraciones + seed ficticio
cp app/.env.example app/.env # pega la URL y la anon key que imprime el CLI
pnpm dev
```

Abre `http://localhost:5173` y usa los usuarios demo:

| Correo | Contraseña | Rol |
|---|---|---|
| `director@demo.local` | `demo1234` | Director |
| `secretario@demo.local` | `demo1234` | Secretario |
| `tesorero@demo.local` | `demo1234` | Tesorero |
| `capitan@demo.local` | `demo1234` | Capitán |
| `ayudante@demo.local` | `demo1234` | Ayudante |
| `consejo@demo.local` | `demo1234` | Consejo de Disciplina |
| `bombero@demo.local` | `demo1234` | Bombero (parte sin consentimiento) |
| `admin@demo.local` | `demo1234` | Administrador |

El correo de invitaciones y recuperación se ve en Inbucket:
`http://127.0.0.1:54324`.

Para probar en el celular, abre `http://<tu-ip>:5173` en la misma red.

---

## Mapa del repositorio

```
.
├── vercel.json          Configuración de la demo en Vercel
├── Dockerfile           Imagen de la demo (nginx)
├── app/                 Frontend React + Vite + TypeScript (PWA)
├── supabase/            Migraciones, seed, pruebas pgTAP y Edge Functions
├── plantillas/          Diseño Typst de la hoja de vida y escudo
├── scripts/             Importación del legado y generación del seed
├── data/privado/        Datos reales, respaldos y seed original (ignorado)
├── docs/                Arquitectura, datos, módulos, UX y operación
└── .github/workflows/   CI y despliegue manual a Cloudflare Pages
```

Cada carpeta tiene un `README.md` con **Propósito · Contenido · Cómo se usa ·
Convenciones · Relacionado con**.

---

## Qué está construido

| Área | Estado |
|---|---|
| Base de datos (10 esquemas, RLS, auditoría con IP, alertas R1–R12) | ✅ |
| Importación del legado (56 personas, 135 listas, 246 movimientos) | ✅ |
| Login por invitación, recuperación y consentimiento Ley 21.719 | ✅ |
| Inicio por rol, navegación móvil y de escritorio, modo oscuro | ✅ |
| Personal: lista, ficha con pestañas, alta/edición, eventos, cargos, cursos, premios, sensibles | ✅ |
| Asistencia: listas, pase de lista **sin conexión**, cierre/envío, mi asistencia | ✅ |
| Documentos: emisión P3, actas, órdenes de capitanía, folio, SHA-256, QR y verificación pública | ✅ |
| Tesorería: cuotas con grilla anual, cartola automática y proyección | ✅ (base) |
| Administración: usuarios, roles, catálogos y parámetros | ✅ |
| Guardia: ciclos de 14 días, cupo por semana, Charlie, reporte y firma | ✅ |
| Material 2D, Tesorería cartola, Secretaría y Disciplina | 🧱 esqueleto con mock y README |
| Modelo dimensional e integración VIPER | 📄 documentados |

---

## Comandos

```bash
pnpm dev                    # frontend
pnpm build                  # build estático
pnpm typecheck  pnpm lint   # calidad
pnpm test                   # Vitest
pnpm -C app e2e             # Playwright (requiere E2E=1 y Supabase local)
pnpm db:reset               # migraciones + seed
pnpm db:lint                # linter de Postgres
pnpm db:test                # pgTAP
pnpm seed:ficticio          # regenera supabase/seed.sql
pnpm importar:legado        # importa data/privado/legado/seed_original.sql
```

Verificación completa y criterios de aceptación en
[`docs/operacion/instalacion-local.md`](docs/operacion/instalacion-local.md).

---

## Seguridad en una frase

La interfaz oculta lo que no corresponde, pero **la seguridad real vive en
PostgreSQL**: RLS por rol, datos sensibles en tabla aparte con lectura auditada,
funciones internas en `seguridad` (no expuesto) y emisión de PDF con folio y
hash. Los roles son manuales y no se derivan del cargo.

---

## Licencia y uso

Uso interno de la Segunda Compañía de Bomberos de Limache. El texto de
consentimiento incluido es un **borrador** y debe ser revisado por el Directorio
o asesoría legal antes de usarse con personas reales.
