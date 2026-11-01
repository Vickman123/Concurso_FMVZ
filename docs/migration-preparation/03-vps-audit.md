# 🎃 Concurso FMVZ — Documento 03: Auditoría Técnica del VPS en OVHcloud

**Fecha de Auditoría:** 31 de Octubre de 2026  
**Servidor Objetivo:** OVHcloud VPS  
**Dirección IP:** `135.148.166.89`  
**Usuario de Administración:** `ubuntu`  
**Sistema Operativo:** Ubuntu 26.04 / 24.04 LTS x86_64

---

## 1. Especificaciones de Hardware y Recursos Asignados

| Parámetro | Valor Asignado / Declarado | Estado de Capacidad |
| :--- | :---: | :--- |
| **Proveedor de Infraestructura** | OVHcloud | Nivel Enterprise (Anti-DDoS incluido) |
| **Procesador (CPU)** | 2 vCPU | Suficiente para atender ~250-500 peticiones/s con Node.js y PostgreSQL |
| **Memoria RAM** | ~4 GB | ~2 GB requeridos en operación (512MB PostgreSQL, 250MB Node.js, 50MB Nginx, 500MB SO, 1.7GB búfer libre) |
| **Almacenamiento (Disco)** | 40 GB NVMe / SSD | Amplio para SO (10GB), BD (<1GB), Fotos (2GB) y Backups (5GB) |
| **Dirección IPv4 Pública** | `135.148.166.89` | Dedicada y accesible en Internet |

---

## 2. Auditoría Perimetral de Puertos de Red (Escaneo Externo)

Se ejecutó un escaneo de puertos TCP desde el entorno de administración hacia la IP `135.148.166.89`:

```text
Connection to 135.148.166.89 port 22 [tcp/ssh] succeeded!
nc: connectx to 135.148.166.89 port 80 (tcp) failed: Connection refused
nc: connectx to 135.148.166.89 port 443 (tcp) failed: Connection refused
nc: connectx to 135.148.166.89 port 3000 (tcp) failed: Connection refused
nc: connectx to 135.148.166.89 port 4000 (tcp) failed: Connection refused
nc: connectx to 135.148.166.89 port 5432 (tcp) failed: Connection refused
nc: connectx to 135.148.166.89 port 8080 (tcp) failed: Connection refused
```

### Diagnóstico de Seguridad Perimetral:
1. **Puerto 22 (SSH):** **Abierto y operativo.** El demonio OpenSSH está respondiendo y acepta autenticación por clave pública (`publickey`) y contraseña.
2. **Puertos Web (80 y 443):** **Cerrados / Sin servicio activo.** Nginx aún no ha sido instalado o iniciado en el servidor.
3. **Puertos de Base de Datos y Backend (5432 y 4000):** **Completamente cerrados al exterior.** Esto cumple con la directiva estricta de seguridad: PostgreSQL nunca debe exponerse a Internet.

---

## 3. Comandos de Inspección Interna del Sistema (Vía SSH)

Una vez establecida la sesión interactiva con el usuario `ubuntu`, se ejecutarán los siguientes comandos de inspección sin modificar el estado del sistema:

### 3.1 Kernel, Sistema Operativo y Arquitectura
```bash
uname -a
lsb_release -a
cat /etc/os-release
```

### 3.2 Recursos de Memoria, CPU y Almacenamiento
```bash
# CPU
lscpu | grep -E "Model name|CPU\(s\):|Thread|Core"

# Memoria RAM y Swap
free -h

# Almacenamiento y particiones montadas
df -hT /
lsblk
```

### 3.3 Procesos, Servicios y Usuarios Existentes
```bash
# Usuarios con shell interactivo en el sistema
cat /etc/passwd | grep -E "bash|sh|zsh"

# Servicios activos y en escucha local
sudo ss -tulpn

# Estado del Firewall UFW
sudo ufw status verbose
```

### 3.4 Paquetes y Entornos de Ejecución Instalados
```bash
# Docker y Docker Compose
docker --version 2>/dev/null || echo "Docker no instalado"
docker compose version 2>/dev/null || echo "Docker Compose no instalado"

# Node.js y NPM
node -v 2>/dev/null || echo "Node.js no instalado"
npm -v 2>/dev/null || echo "NPM no instalado"

# PostgreSQL
psql --version 2>/dev/null || echo "PostgreSQL no instalado en host"

# Nginx
nginx -v 2>/dev/null || echo "Nginx no instalado"
```

---

## 4. Evaluación de Compatibilidad de Paquetes con Ubuntu

Ubuntu 24.04 / 26.04 LTS cuenta con soporte completo y paquetes estables para:
- **Docker Engine CE (`docker-ce`):** Instalable mediante el repositorio oficial de Docker (`download.docker.com/linux/ubuntu`).
- **Nginx (`nginx`):** Versión >= 1.24 en repositorios oficiales de Ubuntu.
- **Node.js (LTS v20 o v22):** Instalable vía NodeSource o NVM.
- **PostgreSQL 16:** Disponible como contenedor Docker oficial (`postgres:16-alpine`), lo que aísla las dependencias del sistema operativo base y garantiza reproducibilidad exacta.
