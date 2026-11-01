# 🎃 Concurso FMVZ — Documento 15: Guía de Despliegue en OVHcloud VPS

**Fecha:** 31 de Octubre de 2026  
**Servidor:** `135.148.166.89`  
**Usuario:** `ubuntu`  
**Ruta del Proyecto en Servidor:** `/var/www/concurso-fmvz`

---

## 1. Actualización y Dependencias Base del Sistema

En una sesión SSH como usuario `ubuntu`:

```bash
# Actualizar repositorios y paquetes
sudo apt update && sudo apt upgrade -y

# Instalar herramientas esenciales
sudo apt install -y curl wget git ufw fail2ban unzip build-essential nginx postgresql postgresql-contrib
```

---

## 2. Instalación de Node.js 20 LTS

```bash
# Configurar repositorio oficial NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar versiones
node -v  # v20.x
npm -v
```

---

## 3. Configuración de PostgreSQL 16

```bash
# Cambiar al usuario postgres para crear usuario y base de datos
sudo -u postgres psql << 'EOF'
CREATE USER fmvz_admin WITH PASSWORD 'DEFINIR_CONTRASENA_PRODUCCION_AQUI';
CREATE DATABASE fmvz_halloween OWNER fmvz_admin;
GRANT ALL PRIVILEGES ON DATABASE fmvz_halloween TO fmvz_admin;
EOF

# Verificar conexión local
psql -U fmvz_admin -d fmvz_halloween -h 127.0.0.1 -W
```

---

## 4. Despliegue del Código Fuente y Permisos

```bash
# Crear directorio de la aplicación
sudo mkdir -p /var/www/concurso-fmvz
sudo chown -R ubuntu:ubuntu /var/www/concurso-fmvz

# Clonar el repositorio sobre la rama espejo
git clone -b migration/ovh-mirror https://github.com/Vickman123/Concurso_FMVZ.git /var/www/concurso-fmvz

cd /var/www/concurso-fmvz

# Crear carpetas de almacenamiento y respaldos
mkdir -p server/uploads /var/backups/concurso-fmvz/db /var/backups/concurso-fmvz/uploads
sudo chown -R www-data:ubuntu server/uploads
sudo chmod -R 775 server/uploads

# Configurar variables de entorno de producción
cp .env.example .env
nano .env  # Configurar contraseñas reales y seguras
```

---

## 5. Compilación del Proyecto

```bash
cd /var/www/concurso-fmvz

# Instalar dependencias limpias
npm install

# Compilar backend y frontend
npm run build
```

---

## 6. Configuración de Servicio `systemd` para Node.js

Crear `/etc/systemd/system/fmvz-backend.service`:

```ini
[Unit]
Description=Concurso FMVZ Backend API (Node.js)
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/concurso-fmvz/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
EnvironmentFile=/var/www/concurso-fmvz/.env
StandardOutput=append:/var/log/concurso-fmvz-backend.log
StandardError=append:/var/log/concurso-fmvz-backend-error.log

[Install]
WantedBy=multi-user.target
```

Habilitar e iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fmvz-backend
sudo systemctl start fmvz-backend
sudo systemctl status fmvz-backend
```

---

## 7. Configuración de Nginx y Certificados SSL

```bash
# Copiar configuración de Nginx
sudo cp /var/www/concurso-fmvz/nginx/conf.d/concurso-fmvz.conf /etc/nginx/sites-available/concurso-fmvz.conf
sudo ln -s /etc/nginx/sites-available/concurso-fmvz.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Validar sintaxis
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```
