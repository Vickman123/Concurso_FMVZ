# Guía Maestra de Migración a Hostinger VPS
## Segundo Concurso de Disfraces FMVZ — UNAM 2026

---

## 1. Visión General del Procedimiento

Esta guía describe el procedimiento paso a paso para realizar la migración del sistema desde la infraestructura actual (Render + Supabase) hacia el nuevo servidor VPS en Hostinger.

> [!IMPORTANT]
> **Principio de Cero Pérdida de Datos y Disponibilidad:**  
> La migración se realiza manteniendo la base de datos de origen (Supabase) en modo **solo lectura** durante la ventana final de sincronización. No se ejecuta doble escritura no coordinada. El enlace actual de Render se conserva como fallback en todo momento.

---

## 2. Cronograma y Fases de la Migración

```
[ Fase 1: Pre-migración ] ➔ [ Fase 2: Configuración VPS ] ➔ [ Fase 3: Migración DB y Fotos ]
         │                                                            │
         ▼                                                            ▼
[ Fase 6: Reversión (Si falla) ] ◄── [ Fase 5: Conmutación ] ◄── [ Fase 4: Pruebas y Validación ]
```

---

## 3. Procedimiento Detallado Paso a Paso

### Paso 1: Contratación y Acceso Inicial al VPS
1. Contratar un VPS en Hostinger (Plan KVM 2 o KVM 4) con **Ubuntu 22.04 LTS** o **Ubuntu 24.04 LTS**.
2. Configurar llave pública SSH en el panel de control de Hostinger.
3. Conectarse por terminal desde la máquina administradora:
   ```bash
   ssh root@IP_DEL_VPS
   ```

### Paso 2: Aprovisionamiento del Sistema y Docker
Ejecutar la actualización del sistema e instalar Docker Engine y Nginx:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Instalar Docker oficial
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalación
docker --version
docker compose version
```

### Paso 3: Configuración del Firewall UFW
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```
*(PostgreSQL puerto 5432 permanece cerrado para internet).*

### Paso 4: Clonar el Repositorio en el Servidor
```bash
mkdir -p /var/www
cd /var/www
git clone -b migration/hostinger-preparation https://github.com/Vickman123/Concurso_FMVZ.git concurso-fmvz
cd concurso-fmvz
```

### Paso 5: Configurar Variables de Entorno de Producción
Crear el archivo `.env` a partir de la plantilla segura:
```bash
cp .env.example .env
nano .env
```
Ajustar los siguientes valores con claves seguras generadas:
```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://fmvz_admin:TU_PASSWORD_POSTGRES_PROD@db:5432/fmvz_halloween
DATABASE_SSL=false
DB_POOL_MAX=25
STORAGE_MODE=disk
UPLOAD_DIR=/app/server/uploads
POSTGRES_DB=fmvz_halloween
POSTGRES_USER=fmvz_admin
POSTGRES_PASSWORD=TU_PASSWORD_POSTGRES_PROD
JWT_SECRET=TU_CLAVE_JWT_SUPER_SEGURA_DE_64_CARACTERES
```

### Paso 6: Desplegar Contenedores (PostgreSQL y Backend)
```bash
docker compose up -d --build
```
Verificar que ambos contenedores estén saludables:
```bash
docker compose ps
docker compose logs -f app
```
El log confirmará:
`[DB Migration] Discovered 1 versioned migration file(s)`  
`[DB Migration] Successfully applied: 001_initial_schema.sql ✅`

### Paso 7: Migración Segura de Datos desde Supabase
Desde la terminal del VPS o equipo de administración:
```bash
# Definir origen y destino
export SOURCE_DATABASE_URL="postgresql://postgres.tqtlmhoplkgkdexhznwp:MV2HUU4SswINKtvW@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
export TARGET_DATABASE_URL="postgres://fmvz_admin:TU_PASSWORD_POSTGRES_PROD@127.0.0.1:5432/fmvz_halloween"

# Ejecutar migrador idempotente
./scripts/migrate_from_supabase.sh
```

### Paso 8: Extracción de Fotografías a Almacenamiento Persistente
Para los participantes cuyas fotografías estaban guardadas en Base64 en la base de datos:
```bash
docker compose exec app node scripts/extract_photos_to_disk.mjs --update-db
```
Esto guardará los archivos físicos en `/app/server/uploads` (volumen persistente `fmvz_uploads_data`) y actualizará las URLs a `/uploads/costume_pXX_xxxx.jpg`.

### Paso 9: Verificación de Integridad
```bash
./scripts/verify_db_integrity.sh
```
El script confirmará:
- Todas las tablas presentes con conteos exactos.
- Cero votos huérfanos.
- Cero identidades duplicadas.
- Secuencias alineadas con `MAX(id)`.

### Paso 10: Configuración de Nginx y Certificados TLS (SSL)
1. Copiar la configuración de Nginx:
   ```bash
   cp nginx/conf.d/concurso-fmvz.conf /etc/nginx/sites-available/concurso-fmvz.conf
   ln -s /etc/nginx/sites-available/concurso-fmvz.conf /etc/nginx/sites-enabled/
   rm -f /etc/nginx/sites-enabled/default
   ```
2. Reemplazar `concurso.fmvz.unam.mx` por el dominio real o IP.
3. Emitir certificado SSL con Certbot:
   ```bash
   certbot --nginx -d TU_DOMINIO.com
   ```
4. Recargar Nginx:
   ```bash
   nginx -t && systemctl reload nginx
   ```

### Paso 11: Pruebas Funcionales y de Carga Previas
1. Probar carga de la galería: `https://TU_DOMINIO.com/participantes`
2. Probar acceso administrativo: `https://TU_DOMINIO.com/admin/login`
3. Ejecutar suite de pruebas de carga:
   ```bash
   TEST_URL="http://127.0.0.1:4000" node scripts/load-test.mjs
   ```

### Paso 12: Ventana Controlada de Conmutación y DNS
1. Colocar el concurso en estatus `paused` 5 minutos antes del cambio si hay votación activa.
2. Ejecutar un último pase de `./scripts/migrate_from_supabase.sh` para capturar cualquier voto o participante de último momento.
3. Actualizar el registro DNS tipo `A` del dominio oficial hacia la IP del VPS de Hostinger.
4. Si el frontend se conserva temporalmente en Render: actualizar la variable `VITE_API_URL=https://TU_DOMINIO_VPS.com` en el dashboard de Render y pulsar *Manual Deploy*.
5. Verificar el funcionamiento en vivo y reabrir la votación (`open`).
