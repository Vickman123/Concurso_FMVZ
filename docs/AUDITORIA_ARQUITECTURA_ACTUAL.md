# Auditoría Técnica de la Arquitectura Actual
## Sistema de Votación — Concurso de Disfraces FMVZ 2026
**Fecha de auditoría:** 30 de octubre de 2026  
**Repositorio:** `https://github.com/Vickman123/Concurso_FMVZ`  
**URL en producción:** `https://concurso-fmvz.onrender.com`  
**Rama de trabajo:** `migration/hostinger-preparation`  

---

## 1. Resumen Ejecutivo

Esta auditoría técnica documenta el estado real del código fuente, infraestructura, almacenamiento, base de datos y dependencias externas del proyecto **Concurso de Disfraces FMVZ**. El objetivo es establecer una línea base estricta y transparente antes de preparar los componentes para la futura migración a un VPS de Hostinger con PostgreSQL 16 y Nginx.

> [!IMPORTANT]
> **Hallazgo Clave sobre Supabase:**  
> A pesar de que en la documentación histórica se menciona "Supabase", la aplicación **NO utiliza el SDK de Supabase (`@supabase/supabase-js`) ni en el frontend ni en el backend**. Supabase es utilizado únicamente como proveedor de alojamiento remoto de la base de datos PostgreSQL, consumido a través del driver estándar `pg` (node-postgres) mediante una cadena de conexión `DATABASE_URL` conectada al *Transaction Pooler* (puerto 6543). Tampoco se utiliza Supabase Storage; las fotografías dinámicas se almacenan actualmente como cadenas **Base64 (Data URLs)** directamente en columnas `TEXT` de PostgreSQL.

---

## 2. Mapa de Componentes y Arquitectura Actual

```
                        [ Usuario / Navegador Web ]
                                     │
                                     ▼ HTTPS (Puerto 443)
                         [ Render Cloud Platform ]
                                     │
                   ┌─────────────────┴─────────────────┐
                   │  Servicio Web Unificado (Node.js)  │
                   │                                   │
                   │  1. Express.js sirve estáticos:   │
                   │     client/dist (React + Vite)    │
                   │                                   │
                   │  2. Express.js maneja API:        │
                   │     /api/contest                  │
                   │     /api/participants             │
                   │     /api/vote                     │
                   │     /api/admin                    │
                   │     /api/live (SSE Stream)        │
                   └─────────────────┬─────────────────┘
                                     │
                                     │ PostgreSQL Connection Pool
                                     │ (pg / node-postgres sobre TLS)
                                     ▼
                      [ Supabase Cloud Database ]
                      aws-0-us-east-1.pooler.supabase.com:6543
                      - 10 Tablas relacionales
                      - Fotografías en Base64 (photo_original_key)
                      - Transacciones ACID nativas
```

### 2.1 Frontend
- **Tecnologías:** React 18.3, TypeScript 5.7, Vite 6.2, Tailwind CSS 3.4.
- **Librerías visuales:** Lucide React, GSAP 3.15, canvas-confetti, qrcode.
- **Enrutamiento:** `react-router-dom` v6.29 con rutas públicas y rutas protegidas por guardas de contexto (`ProtectedAdminRoute`).
- **Consumo de API:** Todas las llamadas HTTP se realizan mediante `fetch()` utilizando rutas relativas directas (ejemplo: `/api/participants`, `/api/vote/cast`, `/api/admin/login`).
- **Modo Desarrollo:** `client/vite.config.ts` utiliza un proxy inverso de desarrollo hacia `http://localhost:4000`.
- **Modo Producción:** El cliente se compila como un bundle estático en `client/dist` y es servido directamente por el backend de Express mediante `express.static(clientDistPath)`.

### 2.2 Backend
- **Tecnologías:** Node.js 20, Express 4.21, TypeScript 5.7 ejecutado con `tsx` en desarrollo y compilado a `dist/` en producción.
- **Validación de esquemas:** Zod v3.24 para validación estricta de payloads (registro, identificación de votante, emisión de voto, login).
- **Seguridad HTTP:**
  - `helmet`: Encabezados HTTP de seguridad configurados con política permisiva para contenido estático e imágenes Base64.
  - `cors`: Habilitado para todos los orígenes (`*`).
  - `express-rate-limit`: Limitadores por ventana de tiempo en votos (60 req/min/IP), registros (15 req/5min/IP) y login administrativo (10 req/15min/IP).
- **Autenticación y Autorización:**
  - JSON Web Tokens (`jsonwebtoken` v9.0) con expiración de 12 horas.
  - Firma mediante secreto `JWT_SECRET`.
  - Roles: `admin` (control total, exportación, ajustes, resultados) y `operator` (mesa de ayuda y moderación de fotos).
  - Middleware `authenticate` valida el token contra la tabla `admins` en cada solicitud sensible.
  - Middleware `requireAdmin` restringe operaciones críticas exclusivamente al rol `admin`.

---

## 3. Estado de Conexiones y Dependencias de Supabase

| Aspecto | Implementación Actual | Dependencia Real de Supabase |
| :--- | :--- | :--- |
| **SDK Supabase** | Ninguno. No instalado en `package.json`. | ❌ Nula |
| **Autenticación Supabase (GoTrue)** | Autenticación propia en Express con JWT y contraseñas hasheadas con `bcryptjs` (salt 10). | ❌ Nula |
| **Supabase Storage** | No se utiliza la API ni los buckets de Supabase. | ❌ Nula |
| **Supabase Realtime** | No se utiliza. El tiempo real se gestiona mediante Server-Sent Events (SSE) nativos en Express. | ❌ Nula |
| **Base de Datos** | Conexión TCP/TLS estándar vía `DATABASE_URL` contra el pooler `aws-0-us-east-1.pooler.supabase.com:6543`. | ⚠️ Dependencia exclusiva de infraestructura de hospedaje PostgreSQL. |

**Conclusión técnica de Supabase:**  
Independizar el proyecto de Supabase consiste técnicamente en desplegar una instancia propia de **PostgreSQL 16**, ejecutar el esquema relacional, migrar los datos existentes y apuntar la variable `DATABASE_URL` a dicha instancia.

---

## 4. Origen de Datos y Estructura de la Base de Datos

El esquema relacional consta de 10 tablas creadas en `server/src/db/schema.sql`:

1. `contest_settings`: Parámetros globales del certamen (fechas, cupo límite, estatus de votación `open/paused/closed`, publicación de resultados, bandera de escenario en vivo).
2. `prize_categories`: Categorías y montos de premiación (1er, 2do, 3er lugar y premios adicionales).
3. `admins`: Cuentas de organizadores y operadores (`id`, `name`, `email`, `password_hash`, `role`, `status`).
4. `participants`: Catálogo de concursantes (`contest_number`, `full_name`, `public_display_name`, `costume_title`, `description`, `participant_type`, `institutional_identifier`, `photo_original_key`, `photo_thumbnail_key`, `status`, `registration_folio`).
5. `voters`: Padrón anonimizado de votantes universitarios con restricción de unicidad:
   `CONSTRAINT unique_voter_identity UNIQUE (voter_type, normalized_identifier)`.
6. `votes`: Sufragios tradicionales emitidos con folio criptográfico:
   `voter_id INT UNIQUE NOT NULL REFERENCES voters(id) ON DELETE CASCADE`.
7. `audit_logs`: Bitácora inmutable de eventos administrativos (`admin_id`, `action`, `entity_type`, `entity_id`, `reason`, `metadata JSONB`).
8. `live_stage_session`: Control del participante en escenario en vivo (modo Kahoot), temporizador y vítores.
9. `live_votes`: Votos emitidos durante la presentación en vivo con restricción:
   `CONSTRAINT unique_live_voter_participant UNIQUE (voter_id, participant_id)`.
10. `live_reactions`: Registro de emojis de reacción comunitaria (aplausos, calabazas, etc.).

### Índices B-Tree Existentes:
- `idx_participants_contest_number`
- `idx_participants_status`
- `idx_participants_type`
- `idx_voters_normalized`
- `idx_votes_participant`
- `idx_votes_confirmation_folio`
- `idx_audit_logs_timestamp`
- `idx_live_votes_participant`
- `idx_live_reactions_created`

---

## 5. Almacenamiento de Fotografías

Actualmente existen dos mecanismos coexistentes en el proyecto:

1. **Fotografías iniciales / precargadas:**  
   Archivos estáticos servidos desde el directorio local `server/uploads/` (`costume_01.jpg` a `costume_57.jpg` y sus contrapartes vectoriales `.svg`). Se acceden vía la ruta `/uploads/costume_XX.jpg`.
2. **Fotografías registradas dinámicamente o actualizadas:**  
   En `participantController.ts` y `adminController.ts`, cuando un usuario o administrador sube una foto mediante `multipart/form-data`:
   - `multer` almacena temporalmente el buffer en memoria RAM (`multer.memoryStorage()`).
   - Se valida el tamaño máximo (8 MB).
   - Se validan los *magic bytes* del archivo para asegurar que sea JPEG, PNG o WebP genuino.
   - **El buffer se convierte en una cadena Base64 Data URL:**  
     `photoPath = \`data:${mime};base64,${req.file.buffer.toString('base64')}\``
   - Dicha cadena se almacena directamente en la columna `photo_original_key` de la tabla `participants`.

### Diagnóstico del Almacenamiento Actual:
- **Ventaja temporal:** No requirió configurar buckets ni volúmenes persistentes en Render durante la fase inicial de pruebas.
- **Riesgo crítico de rendimiento:** Almacenar imágenes en Base64 dentro de PostgreSQL multiplica el tamaño de los datos un 33%, sobrecarga la memoria de Node.js al consultar el catálogo completo (`SELECT * FROM participants`) y satura el ancho de banda del pooler.
- **Adaptación requerida para VPS:** Implementar almacenamiento en archivos físicos en un volumen persistente montado (`/var/www/uploads` o volumen Docker `uploads_data`), guardando únicamente la ruta relativa `/uploads/archivo.jpg` en la base de datos y permitiendo que Nginx o Express sirvan directamente los archivos estáticos con compresión y caché HTTP.

---

## 6. Sistema de Votación y Prevención de Votos Duplicados

El sistema implementa prevención en tres capas:

1. **Capa de Validación:** `utils/validation.ts` normaliza los números de cuenta (9 dígitos para alumnos) y números de trabajador (6 dígitos para personal) eliminando espacios y caracteres no numéricos.
2. **Capa Transaccional:** `voteController.ts` ejecuta `db.transaction()` con validación previa de elegibilidad. Si la identidad ya votó, responde `409 Conflict`.
3. **Capa de Integridad de Base de Datos (Constraint Absoluto):**  
   - La tabla `voters` tiene una restricción `UNIQUE (voter_type, normalized_identifier)`.
   - La tabla `votes` tiene la columna `voter_id INT UNIQUE`.
   - Aunque 50 peticiones simultáneas intenten registrar un voto para la misma identidad (condición de carrera), el motor PostgreSQL aborta 49 transacciones por violación de llave única y solo permite exactamente 1 inserción.

---

## 7. Comunicación en Tiempo Real

- **Mecanismo:** Server-Sent Events (SSE) a través de `GET /api/live/stream`.
- **Implementación:** `liveController.ts` mantiene un `Set<Response>` en memoria de Node.js (`liveSubscribers`).
- **Heartbeat:** Envía un ping de comentario `: keepalive\n\n` cada 15 segundos para evitar que proxies intermediarios o balanceadores de carga corten la conexión inactiva.
- **Riesgo al migrar a Nginx:** Nginx por defecto bufferiza las respuestas de los upstream (`proxy_buffering on;`). Si no se desactiva explícitamente para `/api/live/stream`, los eventos en vivo no llegarán en tiempo real a los navegadores.

---

## 8. Variables de Entorno

### Entorno Actual:
| Variable | Propósito | Valor en Producción Actual |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha del servidor HTTP | `4000` (o asignado dinámicamente por Render) |
| `NODE_ENV` | Entorno de ejecución (`production` / `development`) | `production` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | Apunta a Supabase Pooler (`aws-0-us-east-1.pooler.supabase.com:6543`) |
| `JWT_SECRET` | Llave criptográfica para firma de tokens de sesión | Clave secreta fija del concurso |

### Variables a Añadir para la Arquitectura Hostinger VPS:
- `UPLOAD_DIR`: Ruta física del directorio persistente de imágenes (ej. `/app/uploads` en contenedor o `/var/www/uploads` en host).
- `DATABASE_SSL`: Bandera booleana (`true` / `false`) para controlar si la conexión a Postgres requiere SSL. (En Docker local o red privada de VPS, debe ser `false`).
- `DB_POOL_MAX`: Conexiones máximas del pool (ej. `25` o `30`).
- `VITE_API_URL`: Variable de build/runtime en el frontend para apuntar hacia el backend en caso de separar el hosting de frontend (Render) y backend (VPS).

---

## 9. Dependencias y Configuración en Render

Actualmente Render utiliza el archivo `render.yaml`:
```yaml
services:
  - type: web
    name: concurso-fmvz
    env: node
    plan: free
    buildCommand: npm install --include=dev && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
```
En el plan gratuito de Render:
- El contenedor entra en suspensión tras 15 minutos de inactividad (cold start de ~30 a 50 segundos).
- El sistema de archivos es efímero (cualquier archivo guardado en disco se borra al reiniciar).
- Límite de 512 MB de memoria RAM.

---

## 10. Matriz de Riesgos Técnicos y Elementos que Requieren Adaptación

| # | Componente | Riesgo Técnico Identificado | Acción Correctiva para Hostinger VPS |
| :-: | :--- | :--- | :--- |
| **1** | **Conexión DB (SSL)** | `connection.ts` asume `isSsl = true` si `NODE_ENV === 'production'`. Al conectar a PostgreSQL local en Docker (`@db:5432`), la conexión falla porque Postgres local no tiene TLS habilitado. | Hacer el SSL configurable mediante `DATABASE_SSL=false` o detección inteligente de hosts locales/internos. |
| **2** | **Frontend URL** | Las llamadas `fetch('/api/...')` están fijadas de forma relativa. Si el frontend permanece en Render y el backend migra al VPS, las llamadas fallarán si no hay proxy o URL base configurable. | Incorporar `VITE_API_URL` centralizada en cliente con fallback transparente a rutas relativas para retrocompatibilidad total. |
| **3** | **Almacenamiento Fotos** | Guardar Base64 en Postgres satura la BD y la memoria RAM del VPS bajo alta concurrencia. | Adaptar el backend para guardar archivos físicos con nombres aleatorios y hash en `UPLOAD_DIR`, manteniendo retrocompatibilidad con las Base64 existentes. |
| **4** | **Nginx & SSE** | Nginx bufferiza por defecto las conexiones HTTP persistentes, lo que rompería el streaming en vivo (`/api/live/stream`). | Configurar directivas `proxy_buffering off;`, `chunked_transfer_encoding off;` y `proxy_read_timeout 3600s;` en Nginx. |
| **5** | **Migraciones SQL** | `migrate.ts` divide un archivo único con `.split(';')`, lo que puede fallar con funciones PL/pgSQL o cadenas con punto y coma. | Implementar un sistema de migraciones versionadas y ordenadas por versión (`001_initial_schema.sql`, etc.). |
| **6** | **Respaldos** | No existen scripts de respaldo automatizado ni verificación de integridad en el repositorio. | Crear scripts Bash validados: `backup_db.sh`, `restore_db.sh`, `backup_uploads.sh`, `verify_db_integrity.sh`. |

---
**Auditoría finalizada y verificada contra el código fuente del repositorio.**
