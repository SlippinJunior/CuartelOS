#!/usr/bin/env bash
# =====================================================================
# Verifica el entorno local antes de `pnpm supabase start`.
# Uso: bash scripts/dev/verificar-entorno.sh
# =====================================================================
set -uo pipefail

rojo="\033[31m"; verde="\033[32m"; amarillo="\033[33m"; reset="\033[0m"

falla=0

echo "== Node y pnpm"
if command -v node >/dev/null; then
  echo "  node: $(node --version)"
else
  echo -e "  ${rojo}✗ falta node${reset}"; falla=1
fi
if command -v pnpm >/dev/null; then
  echo "  pnpm: $(pnpm --version)"
else
  echo -e "  ${rojo}✗ falta pnpm${reset}"; falla=1
fi

echo "== Docker"
if ! command -v docker >/dev/null; then
  echo -e "  ${rojo}✗ Docker no está instalado${reset}"
  echo "    En Arch/CachyOS: sudo pacman -S docker docker-compose"
  falla=1
elif docker info >/dev/null 2>&1; then
  echo -e "  ${verde}✓ daemon activo${reset}"
  echo "  $(docker --version)"
else
  echo -e "  ${amarillo}! el daemon no responde${reset}"
  if systemctl is-enabled docker >/dev/null 2>&1 && systemctl is-active docker >/dev/null 2>&1; then
    echo "    El servicio dice estar activo, pero el socket no responde."
    echo "    Revisa: sudo systemctl status docker"
  else
    echo "    Ejecuta una vez (pide tu contraseña):"
    echo -e "      ${verde}sudo systemctl enable --now docker${reset}"
    echo "    Luego verifica:"
    echo "      docker info"
    echo "    Si tu usuario no está en el grupo docker:"
    echo "      sudo usermod -aG docker \$USER && newgrp docker"
  fi
  falla=1
fi

echo "== Supabase CLI"
if command -v supabase >/dev/null; then
  echo "  $(supabase --version 2>/dev/null | head -1)"
else
  echo "  se usará el binario del workspace: pnpm supabase"
fi

echo "== Puerto 54322"
if ss -ltn 2>/dev/null | grep -q ':54322 '; then
  echo -e "  ${amarillo}! ocupado: puede haber otra instancia de Supabase${reset}"
else
  echo "  libre"
fi

echo
if [ "$falla" -eq 0 ]; then
  echo -e "${verde}Entorno listo.${reset} Siguiente paso: pnpm supabase start"
else
  echo -e "${rojo}Falta corregir lo indicado arriba.${reset}"
fi
exit "$falla"
