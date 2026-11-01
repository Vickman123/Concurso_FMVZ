# Manual de Instalación y Aprovisionamiento del VPS
## Sistema de Votación FMVZ — Hostinger Ubuntu 22.04 / 24.04 LTS

---

## 1. Configuración Inicial del Sistema Operativo

Al recibir las credenciales del VPS en el panel de Hostinger:

### 1.1 Acceso SSH y Actualización de Paquetes
```bash
ssh root@IP_DEL_VPS

# Actualizar repositorios y paquetes instalados
apt update && apt upgrade -y
apt install -y curl wget git htop net-tools ufw fail2ban unzip software-properties-common
```

### 1.2 Configuración de Zona Horaria (CDMX)
Para garantizar que las marcas de tiempo de votos y bitácoras coincidan con el evento:
```bash
timedatectl set-timezone America/Mexico_City
timedatectl status
```

### 1.3 Creación de Usuario no Root para Despliegues
```bash
# Crear usuario 'deploy'
adduser deploy
usermod -aG sudo deploy

# Copiar llaves SSH autorizadas al nuevo usuario
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 2. Configuración de Memoria de Intercambio (SWAP)

Para prevenir caídas por falta de memoria (OOM Killer) durante picos de carga:
```bash
# Crear archivo de swap de 4GB
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Hacer permanente el swap
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Ajustar agresividad de swap (swappiness = 10 para servidores)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf
```

---

## 3. Instalación de Docker y Docker Compose

Instalar el motor oficial de Docker utilizando el repositorio oficial:
```bash
# Eliminar paquetes conflictivos
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do apt-get remove -y $pkg; done

# Instalar clave GPG oficial de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Añadir repositorio a las fuentes de APT
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir a 'deploy' ejecutar Docker sin sudo
usermod -aG docker deploy
```

Verificar la instalación:
```bash
docker --version
docker compose version
```

---

## 4. Configuración de Seguridad y Firewall (UFW & Fail2ban)

```bash
# Configuración de UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# Configuración de Fail2ban para proteger contra ataques de fuerza bruta SSH
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban
systemctl enable fail2ban
```

---

## 5. Estructura de Directorios del Proyecto

```bash
mkdir -p /var/www/concurso-fmvz
chown -R deploy:deploy /var/www/concurso-fmvz

# Directorio para respaldos automatizados
mkdir -p /var/backups/fmvz/db
mkdir -p /var/backups/fmvz/uploads
chown -R deploy:deploy /var/backups/fmvz
```

---

## 6. Servicio Systemd para Autoarranque

Para asegurar que los contenedores arranquen automáticamente si el VPS se reinicia:
```bash
cat << 'EOF' > /etc/systemd/system/fmvz-docker.service
[Unit]
Description=FMVZ Halloween Docker Compose Application
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/concurso-fmvz
User=deploy
Group=docker
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fmvz-docker.service
```
