# Dominio y DNS

## 1. Comprar el dominio
Sugerencia: un dominio corto y recordable de la compañía, por ejemplo
`segundacompanialimache.cl`. Compra en un registrador con soporte de DNS y
transferencia.

## 2. Apuntar a Cloudflare
1. Agrega el dominio a Cloudflare (plan gratuito basta).
2. Cambia los nameservers en el registrador.
3. Espera la propagación (puede tardar hasta 24 h).

## 3. Conectar Pages
1. En el proyecto de Pages → Custom domains → Set up.
2. Agrega `erp.<dominio>` o el dominio raíz.
3. Cloudflare crea el registro DNS y el certificado TLS automáticamente.

## 4. Actualizar Supabase
En Authentication → URL Configuration:
- Site URL: `https://erp.<dominio>`
- Redirect URLs: `https://erp.<dominio>/auth/establecer`

En los secrets de la función:
```bash
supabase secrets set SITE_URL="https://erp.<dominio>"
```

## 5. Verificación
- Abre `/verificar/<token>` desde el celular y escanea un QR real.
- Revisa el certificado TLS y que `http` redirija a `https`.
- Comprueba el correo de invitación (remitente y enlace).

## 6. Correo
Para invitaciones masivas conviene configurar SMTP propio en Supabase
(Authentication → SMTP). Sin eso, usa el remitente de Supabase y limita la
cantidad de invitaciones por hora.

## Relacionado con
`docs/operacion/cloudflare-pages.md`, `docs/operacion/supabase-nube.md`.
