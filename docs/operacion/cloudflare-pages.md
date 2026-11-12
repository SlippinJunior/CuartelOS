# Cloudflare Pages

## Requisitos
- Cuenta de Cloudflare
- Repositorio en GitHub
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de producción

## Opción A · Despliegue manual con el workflow
El repositorio incluye `.github/workflows/deploy.yml`. Configura en GitHub:
- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Variable: `CLOUDFLARE_PROJECT_NAME`.

Luego ejecuta el workflow *Deploy a Cloudflare Pages* desde Actions.

## Opción B · Desde el panel de Cloudflare
1. Workers & Pages → Create → Pages → Connect to Git.
2. Build command: `pnpm -C app build`.
3. Build output: `app/dist`.
4. Variables de entorno: las dos `VITE_*`.
5. Compatibilidad: Node 22.

## Opción C · Local con Wrangler
```bash
pnpm -C app build
npx wrangler pages deploy app/dist --project-name=erp-segunda-compania
```

## SPA y rutas
Cloudflare Pages sirve `index.html` para rutas desconocidas. `/verificar/*` es
una ruta de la SPA y funciona sin sesión. No requiere reglas especiales, pero
verifica que un refresh en `/personal/<uuid>` no dé 404.

## PWA
`vite-plugin-pwa` genera `sw.js` y el manifest. La app se puede instalar desde
el navegador del celular. El pase de lista sigue funcionando sin red.

## Cabeceras recomendadas
Agrega un archivo `app/public/_headers` si necesitas:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```
Evita una CSP estricta hasta comprobar las conexiones a Supabase y las fuentes.

## Relacionado con
`docs/operacion/dominio.md`, `.github/workflows/deploy.yml`.
