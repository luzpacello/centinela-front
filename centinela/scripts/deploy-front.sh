#!/usr/bin/env bash
#
# deploy-front.sh — Compila y despliega el SPA de El Centinela en el entorno de PRUEBAS.
#
# Flujo:
#   1. Compila el front (pnpm build) con VITE_API_BASE_URL.
#   2. Empaqueta dist/ y lo sube al host Proxmox.
#   3. Lo instala dentro del contenedor del front (por defecto CT 103).
#   4. Valida y recarga nginx.
#
# Requisitos:
#   - pnpm disponible en la máquina donde se ejecuta (Node LTS).
#   - Acceso SSH al host Proxmox con la clave indicada.
#   - El host Proxmox debe poder ejecutar `pct`.
#   - nginx del contenedor ya debe servir APP_DIR con fallback SPA:
#       location / { try_files $uri $uri/ /index.html; }
#     (configuración inicial documentada en el informe de despliegue).
#
# Uso:
#   ./scripts/deploy-front.sh
#   SSH_KEY=~/.ssh/mi_clave CT=103 APP_DIR=/var/www/centinela-front ./scripts/deploy-front.sh
#
# Variables (todas opcionales, con default razonable):
#   SSH_KEY       Clave SSH privada para el host Proxmox.
#   SSH_USER      Usuario SSH del host Proxmox.         (default: root)
#   HOST          Alias/host del Proxmox.                  (default: proxmox)
#   CT            ID del contenedor del front.             (default: 103)
#   APP_DIR       Directorio web dentro del contenedor.    (default: /var/www/centinela-front)
#   VITE_API_BASE_URL  Base del API para el build.         (default: /api)
#   WEB_USER      Usuario dueño de los archivos.           (default: www-data)

set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/opencode_centinela}"
SSH_USER="${SSH_USER:-root}"
HOST="${HOST:-proxmox}"
CT="${CT:-103}"
APP_DIR="${APP_DIR:-/var/www/centinela-front}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"
WEB_USER="${WEB_USER:-www-data}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SRC="${APP_SRC:-$(cd "$SCRIPT_DIR/.." && pwd)}"
BUILD_DIR="$APP_SRC/dist"
TAR_NAME="centinela-front-dist.tar.gz"
LOCAL_TAR="$(mktemp -t centinela-front-dist.XXXXXX.tar.gz)"
REMOTE_TAR="/tmp/$TAR_NAME"

log()  { printf '\033[1;34m[deploy-front]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[deploy-front] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15)
SSH_TARGET="$SSH_USER@$HOST"

cleanup() {
  rm -f "$LOCAL_TAR"
  # El tar remoto se elimina dentro del contenedor; se limpia también el del host por si quedó a medias.
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "rm -f '$REMOTE_TAR'" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# --- 0. Validaciones locales -------------------------------------------------
[ -f "$APP_SRC/package.json" ] || fail "No se encontró package.json en $APP_SRC"
command -v pnpm >/dev/null 2>&1 || fail "pnpm no está instalado. Instalá Node LTS y ejecutá: corepack enable pnpm"

# --- 1. Build ----------------------------------------------------------------
log "Compilando en $APP_SRC (VITE_API_BASE_URL=$VITE_API_BASE_URL)"
( cd "$APP_SRC" && pnpm install --frozen-lockfile && VITE_API_BASE_URL="$VITE_API_BASE_URL" pnpm build )
[ -f "$BUILD_DIR/index.html" ] || fail "El build no generó dist/index.html"

# --- 2. Empaquetar y subir ---------------------------------------------------
log "Empaquetando dist/ y subiendo a $SSH_TARGET"
tar -czf "$LOCAL_TAR" -C "$BUILD_DIR" .
scp "${SSH_OPTS[@]}" "$LOCAL_TAR" "$SSH_TARGET:$REMOTE_TAR" >/dev/null

# --- 3. Instalar dentro del contenedor --------------------------------------
log "Instalando en CT $CT:$APP_DIR"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  set -e
  pct push '$CT' '$REMOTE_TAR' '$REMOTE_TAR'
  pct exec '$CT' -- sh -c '
    rm -rf \"$APP_DIR\" &&
    mkdir -p \"$APP_DIR\" &&
    tar xzf \"$REMOTE_TAR\" -C \"$APP_DIR\" &&
    rm -f \"$REMOTE_TAR\" &&
    chown -R $WEB_USER:$WEB_USER \"$APP_DIR\" &&
    find \"$APP_DIR\" -type f -exec chmod 644 {} + &&
    find \"$APP_DIR\" -type d -exec chmod 755 {} +
  '
"

# --- 4. Validar y recargar nginx --------------------------------------------
log "Validando y recargando nginx en CT $CT"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  set -e
  pct exec '$CT' -- nginx -t
  pct exec '$CT' -- systemctl reload nginx
"

log "Despliegue completado: $HOST -> CT $CT -> $APP_DIR"
log "Verificá con: curl -H 'Host: pruebas.centinela.test' http://100.93.128.111/ (ajustá al proxy de tu red)"
