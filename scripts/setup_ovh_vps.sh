#!/usr/bin/env bash
# ==============================================================================
# FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
# Script de Aprovisionamiento Automatizado para OVHcloud VPS (Ubuntu 24.04/26.04)
# Ejecutar como usuario ubuntu con privilegios sudo
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "🎃 Iniciando Aprovisionamiento de Infraestructura Espejo en OVHcloud"
echo "🎯 Host: 135.148.166.89 | Usuario: ubuntu"
echo "=================================================================="

# 1. Actualización del Sistema
echo "[1/7] Actualizando repositorios y paquetes del sistema..."
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git ufw fail2ban unzip build-essential nginx postgresql postgresql-contrib

# 2. Configuración de Seguridad Perimetral (UFW & Fail2ban)
echo "[2/7] Configurando cortafuegos UFW y Fail2ban..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
# Asegurar que PostgreSQL NO tenga puerto externo abierto
sudo ufw delete allow 5432/tcp 2>/dev/null || true
echo "y" | sudo ufw enable

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 3. Instalación de Node.js 20 LTS
echo "[3/7] Instalando Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1) != "v20" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "✅ Node.js: $(node -v) | NPM: $(npm -v)"

# 4. Configuración de Base de Datos PostgreSQL 16 Local
echo "[4/7] Configurando PostgreSQL local (127.0.0.1:5432)..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

DB_USER="fmvz_admin"
DB_NAME="fmvz_halloween"
DB_PASS="fmvz_prod_$(head -c 16 /dev/urandom | xxd -p)"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "✅ Base de datos $DB_NAME y usuario $DB_USER creados exitosamente."

# 5. Despliegue del Repositorio y Permisos
echo "[5/7] Configurando directorio de aplicación y clonando repositorio..."
APP_DIR="/var/www/concurso-fmvz"
sudo mkdir -p "$APP_DIR"
sudo chown -R ubuntu:ubuntu "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b migration/ovh-mirror https://github.com/Vickman123/Concurso_FMVZ.git "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git checkout migration/ovh-mirror
  git pull origin migration/ovh-mirror
fi

cd "$APP_DIR"
mkdir -p server/uploads /var/backups/concurso-fmvz/db /var/backups/concurso-fmvz/uploads
sudo chown -R www-data:ubuntu server/uploads
sudo chmod -R 775 server/uploads

# Configurar .env de producción
JWT_SECRET=$(head -c 32 /dev/urandom | base64)
cat << EOF > .env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
DATABASE_SSL=false
DB_POOL_MAX=25
DB_IDLE_TIMEOUT=30000
DB_CONNECT_TIMEOUT=5000
STORAGE_MODE=disk
UPLOAD_DIR=${APP_DIR}/server/uploads
JWT_SECRET=${JWT_SECRET}
VITE_API_URL=
EOF
chmod 600 .env

# 6. Compilación de la Aplicación
echo "[6/7] Instalando dependencias y compilando aplicación..."
npm install
npm run build

# Inicializar esquema de base de datos
npx tsx server/src/db/migrate.ts

# 7. Configuración de Servicios (systemd y Nginx)
echo "[7/7] Configurando servicios systemd y Nginx..."
sudo cat << EOF > /etc/systemd/system/fmvz-backend.service
[Unit]
Description=Concurso FMVZ Backend API (Node.js)
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${APP_DIR}/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
EnvironmentFile=${APP_DIR}/.env
StandardOutput=append:/var/log/concurso-fmvz-backend.log
StandardError=append:/var/log/concurso-fmvz-backend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable fmvz-backend
sudo systemctl restart fmvz-backend

# Configurar Nginx
sudo cp nginx/conf.d/concurso-fmvz.conf /etc/nginx/sites-available/concurso-fmvz.conf
sudo ln -sf /etc/nginx/sites-available/concurso-fmvz.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=================================================================="
echo "🎉 Despliegue de Infraestructura Espejo en OVHcloud Completado"
echo "🌐 API en escucha en http://127.0.0.1:4000"
echo "🌐 Verificación de salud: curl http://127.0.0.1:4000/api/health"
echo "=================================================================="
