# 🎃 Concurso FMVZ — Documento 04: Arquitectura Objetivo para OVHcloud

**Fecha:** 31 de Octubre de 2026  
**Infraestructura Objetivo:** OVHcloud VPS (`135.148.166.89`)  
**Filosofía de Diseño:** Infraestructura Paralela / Espejo, Independencia Absoluta de Supabase, Máximo Rendimiento con Recursos Limitados (2 vCPU, 4 GB RAM).

---

## 1. Diagrama de la Arquitectura Objetivo (Espejo)

```mermaid
flowchart TB
    subgraph Internet ["Tráfico Externo (Internet)"]
        Votantes["Votantes Móviles y Web"]
        Auditorio["Pantalla Gigante Auditorio (/en-vivo)"]
        Admins["Administradores FMVZ (/admin)"]
    end

    subgraph CDN_Frontend ["Capa Frontend (Render o Nginx)"]
        ReactApp["React 18 SPA (Build Optimizado)\nVITE_API_URL configurado"]
    end

    subgraph OVHcloud_VPS ["OVHcloud VPS (135.148.166.89)"]
        subgraph Perimetro ["Seguridad Perimetral"]
            UFW["Firewall UFW (22, 80, 443)"]
            Fail2ban["Fail2ban (Protección Brute-Force SSH)"]
        end

        subgraph WebServer ["Servidor Web y Proxy Inverso"]
            Nginx["Nginx 1.24+ (HTTP/2, SSL TLS 1.3)\nRate Limiting | Gzip | Buffering OFF para SSE"]
        end

        subgraph AppTier ["Capa de Aplicación"]
            NodeAPI["Node.js 20 Backend (Express)\nSystemd Service / PM2\nPuerto Interno 127.0.0.1:4000"]
        end

        subgraph DataTier ["Capa de Persistencia"]
            PostgreSQL["PostgreSQL 16\nEscuchando exclusivamente en 127.0.0.1:5432\nPool: max 25 conexiones"]
            UploadsDir["Almacenamiento Local de Fotos\n/var/www/concurso-fmvz/server/uploads\nAcceso controlado vía Nginx / API"]
        end
    end

    Votantes -->|HTTPS| ReactApp
    Auditorio -->|HTTPS| ReactApp
    Admins -->|HTTPS| ReactApp

    ReactApp -->|REST / API| UFW
    ReactApp -.->|SSE / Live Stream| UFW

    UFW --> Nginx
    Nginx -->|Proxy Pass 127.0.0.1:4000| NodeAPI
    Nginx -->|Archivos Estáticos con Caché| UploadsDir

    NodeAPI -->|Conexión Local Unix/TCP| PostgreSQL
    NodeAPI -->|I/O Disco Seguro (UUIDv4)| UploadsDir
```

---

## 2. Evaluación Arquitectónica: ¿Servicios Nativos (systemd) vs Contenedores (Docker)?

Siguiendo el requerimiento explícito: *"Evalúa el uso de Docker, pero no lo implementes por defecto. Considera las limitaciones de 2 vCPU, 4 GB RAM y 40 GB de disco. Prioriza bajo consumo, simplicidad y mantenibilidad."*

### Matriz Comparativa

| Criterio | Despliegue Nativo (`systemd` + Nginx) | Despliegue en Docker Compose | Recomendación |
| :--- | :--- | :--- | :--- |
| **Consumo de Memoria RAM** | **~1.6 GB en operación** (sin demonios de containerización). | **~2.1 GB** (Docker daemon, bridge networks, containerd). | **Nativo gana:** 500 MB más de RAM libre para caché de consultas en PostgreSQL. |
| **Sobrecarga de CPU** | **0% sobrecarga.** Ejecución directa en kernel de Linux. | **~3-5% sobrecarga** por capas de abstracción de red y puentes. | **Nativo gana:** En 2 vCPU, cada ciclo cuenta durante el pico del auditorio. |
| **I/O de Fotografías en Disco** | **Acceso directo nativo** al sistema de archivos ext4. | Montajes de volúmenes compartidos (`bind mounts`). | **Nativo gana:** Mayor tasa de I/O para entrega de imágenes. |
| **Simplicidad Operativa** | Comandos estándar de Linux (`systemctl restart fmvz-backend`, `journalctl`). | Comandos Docker (`docker compose logs`, `docker exec`). | Empate técnico según preferencia del administrador. |
| **Reproducibilidad** | Requiere script de aprovisionamiento (`setup_vps.sh`). | Inmediata mediante `docker-compose.yml`. | Docker gana en portabilidad de clonación rápida. |

### Decisión Arquitectónica Adoptada:
1. **Infraestructura Primaria Recomendada:** **Nativa con `systemd` y paquetes oficiales de Ubuntu.** Esto maximiza la memoria RAM disponible (dejando 2.4 GB libres para el buffer cache del sistema) y elimina intermediarios de red para las peticiones de votación.
2. **Infraestructura Secundaria / Contingencia:** Se conserva y mantiene el `docker-compose.yml` parametrizado ya probado, permitiendo al usuario elegir levantar en Docker si desea portabilidad inmediata.

---

## 3. Especificación de Componentes Objetivo

### 3.1 Backend
- **Entorno:** Node.js v20 LTS x86_64 gestionado por servicio `systemd` (`fmvz-backend.service`).
- **Escucha:** `127.0.0.1:4000`.
- **Variables Críticas:**
  - `PORT=4000`
  - `NODE_ENV=production`
  - `DATABASE_URL=postgres://fmvz_admin:[PASSWORD]@127.0.0.1:5432/fmvz_halloween`
  - `DATABASE_SSL=false`
  - `DB_POOL_MAX=25`
  - `STORAGE_MODE=disk`
  - `UPLOAD_DIR=/var/www/concurso-fmvz/server/uploads`
  - `JWT_SECRET=[SECRET_64_BYTES]`

### 3.2 Base de Datos PostgreSQL 16
- **Instalación:** PostgreSQL 16 en host local.
- **Configuración de Memoria para 4 GB RAM:**
  - `shared_buffers = 512MB`
  - `work_mem = 16MB`
  - `maintenance_work_mem = 128MB`
  - `effective_cache_size = 2GB`
  - `max_connections = 100`
- **Seguridad:** `listen_addresses = '127.0.0.1'` en `postgresql.conf` y autenticación `scram-sha-256` en `pg_hba.conf`.

### 3.3 Almacenamiento de Fotografías
- **Ruta Física:** `/var/www/concurso-fmvz/server/uploads`
- **Permisos:** `chmod 750` y `chown -R www-data:ubuntu`.
- **Mecanismo:** Procesado mediante `storageService.ts` que valida magic bytes (`image/jpeg`, `image/png`, `image/webp`), sanitiza con UUIDv4 y escribe en disco.
- **Servido:** Nginx entrega directamente las imágenes con cabecera `Cache-Control: public, max-age=86400`, liberando a Node.js de tareas de I/O estático.

### 3.4 Tiempo Real (Server-Sent Events)
- **Protocolo:** HTTP/1.1 persistente con `text/event-stream`.
- **Optimización Nginx:** `proxy_buffering off; chunked_transfer_encoding off;` para que los votos y emojis de reacciones se proyecten instantáneamente en el auditorio sin demoras de buffer.
