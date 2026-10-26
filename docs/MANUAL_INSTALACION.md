# Manual de Instalación y Despliegue
## Segundo Concurso de Disfraces FMVZ — UNAM (3 de noviembre de 2026)

Este documento detalla el procedimiento para instalar, ejecutar y desplegar la plataforma web del **Segundo Concurso de Disfraces de la Facultad de Medicina Veterinaria y Zootecnia (FMVZ) de la UNAM**.

---

## 1. Arquitectura Técnica

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js (v20+ o v24), Express, TypeScript, Zod, Helmet, Multer, Bcrypt, JWT, CSV Parse/Stringify.
- **Base de Datos:** PostgreSQL 16 con migraciones versionadas, restricciones de unicidad, aislamiento de transacciones e índices de alto rendimiento.
  - *Modo Desarrollo Local:* Motor PostgreSQL 16 en WebAssembly (`@electric-sql/pglite`) con persistencia en `./server/data/postgres_db`, permitiendo ejecución inmediata sin requerir la instalación de demonios externos.
  - *Modo Producción UNAM:* Conexión nativa a PostgreSQL mediante pool de conexiones `pg` configurando la variable de entorno `DATABASE_URL`.
- **Almacenamiento de Fotografías:** Directorio persistente `./server/uploads/` con validación de cabeceras binarias (Magic Bytes) para prevenir archivos maliciosos disfrazados de imágenes.

---

## 2. Requisitos Previos

- **Node.js:** Versión 20.x o superior (verificado con Node v24.20.0).
- **npm:** Versión 10.x u 11.x (verificado con npm 11.19.0).
- **Docker & Docker Compose (Opcional):** Si se desea ejecutar en contenedores aislados con PostgreSQL nativo.
- **Nginx (Producción):** Para terminación TLS/HTTPS y proxy inverso.

---

## 3. Instalación y Ejecución Local (Paso a Paso)

### Paso 1: Clonar o ingresar al repositorio
```bash
cd "CONCURSO FMVZ"
```

### Paso 2: Instalar dependencias de workspaces
```bash
npm install
```
Esto instalará simultáneamente las dependencias del `root`, del `server` y del `client`.

### Paso 3: Inicializar la base de datos y sembrar los 57 participantes
Ejecuta el script de migración y siembra:
```bash
npm run seed
```
Este comando:
1. Crea todas las tablas e índices PostgreSQL (`schema.sql`).
2. Configura los parámetros del evento (3 de noviembre de 2026, cupo de 100 participantes).
3. Inserta los premios ($10,000, $7,000, $6,000 y 20 premios de $5,000).
4. Registra los 57 participantes iniciales con disfraces humanos, números oficiales 01 a 57 y fotografías vectoriales temáticas.
5. Crea las cuentas de administrador y operador.
6. Exporta el archivo de respaldo CSV en `server/data/participantes_57_existentes.csv`.

### Paso 4: Iniciar en Modo Desarrollo (Hot-Reload)
```bash
npm run dev
```
- **Frontend Vite:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000` (el cliente redirige automáticamente las peticiones `/api` y `/uploads` al puerto 4000).

### Paso 5: Compilar y Ejecutar en Modo Producción
Para compilar la aplicación y servir tanto el frontend como el backend en un solo puerto:
```bash
npm run build
npm start
```
La aplicación completa estará disponible en `http://localhost:4000`.

---

## 4. Despliegue en Infraestructura Institucional UNAM (Docker Compose)

En un servidor institucional con Docker instalado:

### 1. Variables de entorno (`.env`)
Crear un archivo `.env` en la raíz del proyecto:
```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://fmvz_admin:fmvz_secure_password_2026@db:5432/fmvz_halloween
JWT_SECRET=tu_clave_secreta_super_segura_fmvz_2026
```

### 2. Levantar servicios
```bash
docker-compose up -d --build
```

### 3. Ejecutar la siembra inicial dentro del contenedor
```bash
docker-compose exec app npm run seed
```

---

## 5. Configuración del Proxy Inverso Nginx con HTTPS

Para servir el concurso en un subdominio institucional (ej. `https://concurso.fmvz.unam.mx`), configurar Nginx:

```nginx
# /etc/nginx/sites-available/concurso_fmvz.conf

upstream fmvz_backend {
    server 127.0.0.1:4000;
    keepalive 64;
}

server {
    listen 80;
    server_name concurso.fmvz.unam.mx;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name concurso.fmvz.unam.mx;

    ssl_certificate /etc/letsencrypt/live/concurso.fmvz.unam.mx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/concurso.fmvz.unam.mx/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 12M;

    # Encabezados de seguridad
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Enrutamiento a la aplicación Node.js
    location / {
        proxy_pass http://fmvz_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Caché estática para fotografías de disfraces
    location /uploads/ {
        proxy_pass http://fmvz_backend/uploads/;
        proxy_cache_valid 200 1h;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 6. Pruebas Automatizadas

Para validar que todos los servicios y restricciones funcionan correctamente:

```bash
# Ejecutar suite de pruebas unitarias y de integración
npm run test

# Ejecutar prueba de concurrencia y carga (100, 250, 500 usuarios virtuales)
npm run load-test
```
