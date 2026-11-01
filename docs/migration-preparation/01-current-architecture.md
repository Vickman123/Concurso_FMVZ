# 🎃 Concurso FMVZ — Documento 01: Arquitectura Actual del Sistema

**Fecha de Auditoría:** 31 de Octubre de 2026  
**Entorno Analizado:** Producción Actual (`concurso-fmvz.onrender.com`)  
**Repositorio:** `https://github.com/Vickman123/Concurso_FMVZ`  
**Rama:** `migration/ovh-mirror`

---

## 1. Visión General del Sistema

El sistema "Concurso FMVZ" es una plataforma web desarrollada para gestionar el **Segundo Concurso de Disfraces de la Facultad de Medicina Veterinaria y Zootecnia (UNAM) 2026**. Proporciona registro de participantes (alumnos y trabajadores), validación de identidades institucionales, catálogo público de disfraces, votación popular protegida contra votos duplicados, pantalla gigante para auditorio en tiempo real y un panel de administración con control de acceso por roles.

```mermaid
flowchart TB
    subgraph Clientes ["Clientes y Dispositivos"]
        NavPublico["Votantes Móviles / Web"]
        NavAuditorio["Pantalla Gigante Proyector (/en-vivo)"]
        NavAdmin["Panel de Administración (/admin)"]
    end

    subgraph HostingRender ["Hosting Actual (Render)"]
        SPA["Frontend SPA (React 18 + Vite)"]
        API["Backend Node.js 20 (Express)"]
    end

    subgraph SupabaseCloud ["Base de Datos Cloud (Supabase)"]
        PG["PostgreSQL 15/16 (AWS us-west-1)"]
        Pooler["PgBouncer Pooler (Puerto 6543)"]
    end

    NavPublico -->|HTTPS| SPA
    NavAuditorio -->|HTTPS / SSE| SPA
    NavAdmin -->|HTTPS| SPA

    SPA -->|Llamadas REST /api/*| API
    NavAuditorio -.->|EventSource /api/live/stream| API
    
    API -->|node-postgres (SSL)| Pooler
    Pooler --> PG
```

---

## 2. Componentes de la Arquitectura Actual

### 2.1 Frontend (React 18 + Vite + Tailwind CSS)
- **Tipo:** Single Page Application (SPA).
- **Rutas Públicas:**
  - `/`: Página principal (Hero con contador, accesos directos, bases y cartel oficial en alta resolución).
  - `/participantes`: Galería con filtros (`all`, `student`, `worker`), búsqueda en vivo y paginación (12 por página).
  - `/participantes/:number`: Ficha detallada del concursante con botón directo de votación.
  - `/registrar`: Formulario de registro con captura de foto, recorte, validación de cuenta/trabajador y generación de folio.
  - `/registro/estado`: Consulta de estado de aprobación mediante folio de registro.
  - `/votar`: Paso 1 de votación: ingreso de nombre, tipo de votante y número de cuenta o trabajador.
  - `/votar/confirmar/:numero`: Paso 2 de votación: confirmación de la elección y emisión del voto.
  - `/voto/confirmado`: Pantalla de éxito con folio criptográfico de comprobación.
  - `/en-vivo` / `/proyector`: Vista para proyector de auditorio con animación de disfraces en tarima, reacciones de confeti y marcador.
  - `/votar/en-vivo`: Interfaz móvil interactiva para el público del auditorio con botones de reacciones emoji (👻, 🎃, 🦇, 💀, 🔥, 👏).
  - `/preguntas-frecuentes`, `/aviso-de-privacidad`, `/logos`.
- **Rutas Administrativas (Protegidas con JWT):**
  - `/admin/login`: Inicio de sesión con correo y contraseña.
  - `/admin`: Dashboard ejecutivo con métricas de votos totales, participantes activos, avance de votación y gráficos.
  - `/admin/en-vivo`: Consola de control de escenario para avanzar concursantes en tarima, abrir/cerrar temporizador y lanzar avisos.
  - `/admin/participantes`: Gestión de concursantes (aprobación, rechazo, edición, corrección).
  - `/admin/fotografías`: Moderación visual rápida de imágenes.
  - `/admin/votos`: Auditoría de votos emitidos, anulación motivada y exportación CSV.
  - `/admin/resultados`: Cómputo final de ganadores por categoría.
  - `/admin/configuracion`: Parámetros del concurso (límite de registros, fechas, apertura/cierre de votación).
  - `/admin/auditoria`: Bitácora inmutable de eventos administrativos con metadatos JSONB.

### 2.2 Backend (Node.js 20 + Express + TypeScript)
- **Framework:** Express 4.x con TypeScript compilado.
- **Seguridad Perimetral:**
  - `helmet`: Protección de cabeceras HTTP.
  - `cors`: Habilitado para comunicación flexible.
  - `express-rate-limit`: Límite de peticiones generales (100 req/min) y límite estricto para votaciones (10 req/min por IP).
  - `bcrypt`: Encriptación unidireccional de contraseñas de administradores (salt rounds: 10).
  - `jsonwebtoken` (JWT): Firma de sesiones administrativas con expiración de 8 horas.
- **Manejo de Cargas:** `express.json({ limit: '15mb' })` para recibir fotografías Base64.
- **Tiempo Real:** Server-Sent Events (SSE) nativo sobre HTTP en el endpoint `/api/live/stream` con mantenimiento de conexión mediante `:ping` periódico cada 15 segundos.

### 2.3 Capa de Datos (PostgreSQL en Supabase)
- **Alojamiento:** Supabase Cloud sobre infraestructura AWS `us-west-1`.
- **Conexión:** Driver `pg` (`node-postgres`) apuntando al pooler PgBouncer en puerto `6543`.
- **Tablas:** 10 tablas relacionales (`contest_settings`, `prize_categories`, `admins`, `participants`, `voters`, `votes`, `audit_logs`, `live_stage_session`, `live_votes`, `live_reactions`).
- **Restricción Crítica:** `UNIQUE(voter_type, normalized_identifier)` en la tabla `voters` que previene matemáticamente cualquier duplicidad de voto a nivel de motor SQL.

---

## 3. Flujo de Datos Críticos

### 3.1 Flujo de Registro
1. El concursante completa el formulario y adjunta su fotografía.
2. El frontend procesa la imagen a Base64 o la envía en multipart.
3. El backend valida:
   - Formato institucional de la cuenta UNAM (9 dígitos) o trabajador (6-8 dígitos).
   - Límite máximo de participantes configurado (`registration_limit = 100`).
   - Asigna número correlativo oficial de concursante (`contest_number`).
   - Genera folio criptográfico de seguimiento (ej. `REG-FMVZ-XXXX`).
4. Se almacena el registro en estado `pending`.

### 3.2 Flujo de Votación
1. El votante introduce sus datos en `/votar`.
2. El backend normaliza el identificador eliminando guiones y espacios.
3. Se inicia una transacción en PostgreSQL (`BEGIN`):
   - Intenta insertar en `voters (full_name, voter_type, normalized_identifier)`.
   - Si la identidad ya existe, la base de datos lanza error `23505 (unique_violation)`, el backend aborta con `ROLLBACK` y responde `HTTP 409 Conflict`.
   - Si la identidad es nueva, inserta el voto en `votes (voter_id, participant_id, confirmation_folio)` y confirma con `COMMIT`.
4. El backend emite el evento de voto al canal SSE para actualizar el proyector en vivo.
5. El cliente recibe el `confirmation_folio` único.

---

## 4. Limitaciones y Vulnerabilidades de la Arquitectura Actual
1. **Dependencia de Red Externa:** Cada consulta a la base de datos viaja desde los servidores de Render hasta AWS `us-west-1` (Supabase), introduciendo entre 80 ms y 180 ms de latencia por petición.
2. **Fotografías en Base64 en Base de Datos:** Guardar imágenes de 2 MB a 5 MB como cadenas Base64 en la columna `photo_url` infla el tamaño de la base de datos y satura el ancho de banda del pooler.
3. **Punto Único de Falla:** Render suspende o reinicia servicios gratuitos/starter tras inactividad, lo que generaría un retraso de 50 segundos al abrir el concurso.
4. **Tiempo Real en Memoria Monolítica:** El pool de conexiones SSE reside en la memoria de una única instancia de Node.js. Si la instancia se reinicia, todos los navegadores del auditorio pierden la conexión.
