# Arquitectura Objetivo — Migración a Hostinger VPS
## Sistema de Votación del Concurso de Disfraces FMVZ 2026

---

## 1. Visión General y Objetivos de la Arquitectura

La arquitectura objetivo tiene como meta **independizar al 100% el sistema de Supabase**, eliminando costos variables, restricciones de poolers remotos y límites del plan gratuito de Render, garantizando soberanía de datos institucional y control total sobre el servidor, base de datos y archivos multimedia.

### Objetivos Clave:
1. **Soberanía y Persistencia:** Base de datos PostgreSQL 16 propia alojada en un VPS de Hostinger con almacenamiento SSD NVMe y volúmenes persistentes.
2. **Alto Rendimiento en Multimedia:** Sustitución de cadenas Base64 dentro de la base de datos por archivos físicos en un volumen persistente servidos directamente por Nginx con compresión gzip y encabezados de caché.
3. **Consistencia Transaccional Estricta:** Motor PostgreSQL 16 local con transacciones ACID, constraints de unicidad y pool de conexiones `pg` configurado directamente en la red interna de Docker.
4. **Continuidad del Enlace Público:** Capacidad de mantener el dominio actual `concurso-fmvz.onrender.com` o redirigir transparentemente mediante dominio propio (`concurso.fmvz.unam.mx`).

---

## 2. Diagrama de la Arquitectura Objetivo

```
                                    [ Usuarios / Comunidad UNAM ]
                                     (Móviles, Tablets, Laptops)
                                                  │
                                                  │ HTTPS (443)
                                                  ▼
                         ┌─────────────────────────────────────────────────┐
                         │              Hostinger VPS (Ubuntu)             │
                         │              Dirección IP Pública               │
                         │                                                 │
                         │  ┌───────────────────────────────────────────┐  │
                         │  │        Nginx 1.24+ (Reverse Proxy)        │  │
                         │  │  - Terminación SSL/TLS (Let's Encrypt)    │  │
                         │  │  - Redirección 301 HTTP -> HTTPS          │  │
                         │  │  - Rate Limiting (Votos y API)            │  │
                         │  │  - Compresión Gzip (Nivel 6)              │  │
                         │  │  - Streaming SSE (/api/live/stream)       │  │
                         │  │  - Servidor de Fotos (/uploads/)          │  │
                         │  └─────────────────────┬─────────────────────┘  │
                         │                        │                        │
                         │       (Proxy HTTP)     │                        │
                         │       127.0.0.1:4000   │                        │
                         │                        ▼                        │
                         │  ┌───────────────────────────────────────────┐  │
                         │  │     Docker Network (fmvz_internal)        │  │
                         │  │                                           │  │
                         │  │  ┌─────────────────────────────────────┐  │  │
                         │  │  │ Contenedor Backend: Express / Node  │  │  │
                         │  │  │  - Node.js 20 Alpine (Non-root user)│  │  │
                         │  │  │  - REST API & Validaciones Zod      │  │  │
                         │  │  │  - JWT Auth (Admin / Operador)      │  │  │
                         │  │  │  - SSE Live Engine (Heartbeat 15s)  │  │  │
                         │  │  │  - Storage Service (Disk Mode)      │  │  │
                         │  │  └──────────────────┬──────────────────┘  │  │
                         │  │                     │                        │
                         │  │                     │ PostgreSQL (TCP 5432)  │
                         │  │                     │ Pool 'pg' (25 conn)    │
                         │  │                     ▼                        │
                         │  │  ┌─────────────────────────────────────┐  │  │
                         │  │  │ Contenedor Base de Datos: Postgres  │  │  │
                         │  │  │  - PostgreSQL 16 Alpine             │  │  │
                         │  │  │  - 10 Tablas + Índices B-Tree       │  │  │
                         │  │  │  - Transacciones atómicas de voto   │  │  │
                         │  │  └──────────────────┬──────────────────┘  │  │
                         │  │                     │                        │
                         │  └─────────────────────┼─────────────────────┘  │
                         │                        │                        │
                         │  ┌─────────────────────┴─────────────────────┐  │
                         │  │         Volúmenes Persistentes            │  │
                         │  │  1. fmvz_pgdata: /var/lib/postgresql/data │  │
                         │  │  2. fmvz_uploads_data: /app/server/uploads│  │
                         │  └───────────────────────────────────────────┘  │
                         └─────────────────────────────────────────────────┘
```

---

## 3. Comparativa: Arquitectura Actual vs. Arquitectura Objetivo

| Criterio | Arquitectura Actual (Render + Supabase) | Arquitectura Objetivo (Hostinger VPS) | Beneficio Técnico |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | Supabase Cloud (AWS US-East Pooler) | PostgreSQL 16 Alpine en contenedor Docker local | Latencia de conexión reducida de ~120ms a < 1ms; sin límite de conexiones externas. |
| **Almacenamiento de Fotos** | Cadenas Base64 Data URL guardadas en columnas `TEXT` de PostgreSQL | Archivos binarios (`.jpg`, `.png`, `.webp`) en volumen persistente `fmvz_uploads_data` | Reducción del tamaño de la base de datos en >90%; Nginx sirve las imágenes con caché HTTP de 7 días. |
| **Proxy y Servidor Web** | Proxy nativo de Render Cloud (sin control de configuración) | Nginx 1.24+ configurado con rate limiting y buffering desactivado para Server-Sent Events | Control de encabezados de seguridad (HSTS, CSP, X-Frame), límites de carga de 15MB y buffers de streaming en vivo. |
| **Gestión de Sesiones** | 1 Instancia gratuita de Render sujeta a suspensión por inactividad (cold starts) | Contenedor Node.js 20 con reinicio automático (`restart: unless-stopped`) en VPS dedicado | Cero cold starts; disponibilidad 24/7 sin latencia de inicio. |
| **Respaldos** | Respaldos manuales o dependientes de consola web de Supabase | Scripts automatizados Bash (`backup_db.sh`, `backup_uploads.sh`) programados en Cron con rotación y SHA256 | Respaldos locales y remotos totalmente automatizados y verificables. |
| **Aislamiento de Red** | Base de datos accesible públicamente en internet con TLS | PostgreSQL bound exclusivamente a `127.0.0.1` y red interna Docker `fmvz_internal` | Cero exposición pública del puerto de base de datos (5432). |

---

## 4. Opciones de Despliegue del Frontend

La arquitectura preparada soporta dos modalidades de operación del frontend:

### Opción A — Todo en el VPS (Recomendada):
- El contenedor backend de Docker empaqueta el bundle compilado de `client/dist` y Express sirve tanto la API como la aplicación web pública.
- Nginx actúa como fachada pública única en `https://concurso.fmvz.unam.mx`.
- **Ventajas:** Máxima simplicidad, un solo servidor, sin problemas de CORS ni solicitudes cross-origin.

### Opción B — Híbrida (Frontend en Render + Backend en VPS):
- El frontend permanece desplegado en el enlace existente `https://concurso-fmvz.onrender.com`.
- Se configura la variable de entorno de compilación de Render:
  `VITE_API_URL=https://api.concurso-fmvz.unam.mx` (o la IP con dominio del VPS).
- Todas las peticiones `fetch()` y el stream SSE de `EventSource` consumen automáticamente el nuevo backend de Hostinger.
- **Ventajas:** Conserva exactamente el enlace público actual sin requerir migración inmediata de dominio.

---

## 5. Especificaciones Mínimas Recomendadas del VPS

Para soportar con holgura los picos del certamen institucional y hasta 500 usuarios concurrentes en la pasarela en vivo:

- **Plan Sugerido en Hostinger:** KVM 2 o KVM 4.
- **CPU:** 2 a 4 vCPU cores (arquitectura x86_64).
- **RAM:** 4 GB a 8 GB de memoria RAM.
- **Almacenamiento:** 50 GB a 100 GB SSD NVMe.
- **Sistema Operativo:** Ubuntu 22.04 LTS o Ubuntu 24.04 LTS (64-bit).
- **Ancho de Banda:** Conexión de 100 Mbps o superior con tráfico mensual no medido.
