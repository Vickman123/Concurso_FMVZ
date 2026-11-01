# Evidencias Técnicas de Auditoría — Fase 2
**Fecha:** 2026-11-01T06:52:46.375Z
**Entorno de Prueba:** Gateway local (Puerto 3388) -> VPS OVHcloud (135.148.166.89)


### VALIDACIÓN 4: Funcionamiento del Gateway y Rutas SPA


- **[VAL-4.1] Diagnóstico interno del Gateway (/gateway-health):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s http://127.0.0.1:3388/gateway-health`
  - **Código HTTP:** `200` | **Latencia:** `148 ms`
  - **Detalle de Evidencia:** Conectividad: connected, Latencia VPS: 137ms, client/dist: true

- **[VAL-4.2] Entrega de SPA React en ruta raíz (/):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s -I http://127.0.0.1:3388/`
  - **Código HTTP:** `200` | **Latencia:** `5 ms`
  - **Detalle de Evidencia:** Longitud HTML: 1372 bytes, Cache-Control: no-cache, no-store, must-revalidate

- **[VAL-4.3] Soporte SPA History API en ruta interna (/gallery):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s -I http://127.0.0.1:3388/gallery`
  - **Código HTTP:** `200` | **Latencia:** `3 ms`
  - **Detalle de Evidencia:** Fallback a index.html verificado, Cache-Control: no-cache, no-store, must-revalidate

- **[VAL-4.4] Entrega de assets JS con cache inmutable (/assets/*.js):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s -I http://127.0.0.1:3388/assets/index-BfRBvU4A.js`
  - **Código HTTP:** `200` | **Latencia:** `3 ms`
  - **Detalle de Evidencia:** Cache-Control: public, max-age=31536000, immutable, Content-Type: application/javascript; charset=UTF-8


### VALIDACIÓN 5: Proxy de Rutas de Negocio (/api/*)


- **[VAL-5.1] Proxy transparente de salud del backend (GET /api/health):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s http://127.0.0.1:3388/api/health`
  - **Código HTTP:** `200` | **Latencia:** `141 ms`
  - **Detalle de Evidencia:** Evento: "Segundo Concurso de Disfraces FMVZ - UNAM", Timestamp backend: 2026-11-01T06:52:35.202Z

- **[VAL-5.2] Proxy de configuración del concurso (GET /api/contest/settings):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s http://127.0.0.1:3388/api/contest/settings`
  - **Código HTTP:** `200` | **Latencia:** `89 ms`
  - **Detalle de Evidencia:** Concurso: "Segundo Concurso de Disfraces FMVZ", Votación: open

- **[VAL-5.3] Proxy de galería de participantes (GET /api/participants):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s http://127.0.0.1:3388/api/participants`
  - **Código HTTP:** `200` | **Latencia:** `77 ms`
  - **Detalle de Evidencia:** Total participantes registrados y aprobados: 1

- **[VAL-5.4] Protección de cabeceras: X-Gateway-Secret nunca expuesto al cliente:** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `Header Inspection on client responses`
  - **Código HTTP:** `200` | **Latencia:** `1 ms`
  - **Detalle de Evidencia:** Cabecera X-Gateway-Secret en respuesta al cliente: OCULTA Y PROTEGIDA


### VALIDACIÓN 6: Proxy de Almacenamiento de Fotografías (/uploads/*)


- **[VAL-6.1] Descarga de fotografía persistente (GET /uploads/costume_01.jpg):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s -I http://127.0.0.1:3388/uploads/costume_01.jpg`
  - **Código HTTP:** `200` | **Latencia:** `73 ms`
  - **Detalle de Evidencia:** Tamaño: 41077 bytes, Content-Type: image/jpeg, Cache-Control: max-age=604800, public, no-transform

- **[VAL-6.2] Manejo correcto de recurso fotográfico no encontrado (404):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -s -I http://127.0.0.1:3388/uploads/inexistente_9999.jpg`
  - **Código HTTP:** `404` | **Latencia:** `68 ms`
  - **Detalle de Evidencia:** Código HTTP recibido: 404


### VALIDACIÓN 7: Streaming SSE y Conexiones Prolongadas (/api/live/stream)


- **[VAL-7.1] Cabeceras anti-buffering para SSE (X-Accel-Buffering, text/event-stream):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `curl -N -i http://127.0.0.1:3388/api/live/stream`
  - **Código HTTP:** `200` | **Latencia:** `65 ms`
  - **Detalle de Evidencia:** X-Accel-Buffering: no, Cache-Control: no-cache, Content-Type: text/event-stream

- **[VAL-7.2] Transmisión en tiempo real sin almacenamiento en buffer:** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `Live chunk receiver (4s test)`
  - **Código HTTP:** `200` | **Latencia:** `0 ms`
  - **Detalle de Evidencia:** Eventos recibidos sin demora: [:connected, VIEWER_JOINED, INITIAL_STATE], Conexión sostenida: 4.0s


### VALIDACIÓN 8: Autenticación Administrativa y Tokens JWT


- **[VAL-8.1] Rechazo de credenciales administrativas incorrectas (401):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST http://127.0.0.1:3388/api/admin/login (bad password)`
  - **Código HTTP:** `401` | **Latencia:** `253 ms`
  - **Detalle de Evidencia:** Código recibido: 401

- **[VAL-8.2] Autenticación exitosa y emisión de token JWT firmado (200):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST http://127.0.0.1:3388/api/admin/login (valid credentials)`
  - **Código HTTP:** `200` | **Latencia:** `200 ms`
  - **Detalle de Evidencia:** Token JWT emitido (248 chars), Usuario: Administrador Concurso FMVZ

- **[VAL-8.3] Bloqueo de endpoint protegido sin Authorization header (401):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `GET http://127.0.0.1:3388/api/admin/me (sin token)`
  - **Código HTTP:** `401` | **Latencia:** `67 ms`
  - **Detalle de Evidencia:** Código recibido: 401

- **[VAL-8.4] Autorización concedida con Bearer <JWT> válido (200):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `GET http://127.0.0.1:3388/api/admin/me (Bearer <token>)`
  - **Código HTTP:** `200` | **Latencia:** `72 ms`
  - **Detalle de Evidencia:** Admin verificado: admin@concurso.fmvz (admin)


### VALIDACIÓN 9: Protección de Solicitudes de Escritura


- **[VAL-9.1] Bloqueo estricto de peticiones directas al VPS que omiten el Gateway (403):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST http://135.148.166.89/api/vote/cast (sin X-Gateway-Secret)`
  - **Código HTTP:** `403` | **Latencia:** `127 ms`
  - **Detalle de Evidencia:** Código recibido: 403 Forbidden (Ataque perimetral neutralizado)

- **[VAL-9.2] Emisión de voto transaccional a través del Gateway (201):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST http://127.0.0.1:3388/api/vote/cast (voto nuevo)`
  - **Código HTTP:** `201` | **Latencia:** `78 ms`
  - **Detalle de Evidencia:** Folio emitido: FMVZ-VOTO-2026-21DC13E4

- **[VAL-9.3] Bloqueo atómico de voto duplicado en base de datos (409 Conflict):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST http://127.0.0.1:3388/api/vote/cast (mismo identificador)`
  - **Código HTTP:** `409` | **Latencia:** `76 ms`
  - **Detalle de Evidencia:** Código: 409, Motivo: "Esta identidad institucional ya cuenta con un voto registrado en el concurso."


### VALIDACIÓN 10: Límites de Tasa (Rate Limiting) y Filtro de Tamaño


- **[VAL-10.1] Filtro perimetral: Rechazo de archivos > 15 MB (413 Payload Too Large):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `POST /api/participants/register (Content-Length: 16MB)`
  - **Código HTTP:** `413` | **Latencia:** `1 ms`
  - **Detalle de Evidencia:** Código recibido: 413 Payload Too Large en < 2ms (rechazo antes de buffering)

- **[VAL-10.2] Limitador de tasa (Rate Limiting) activo en /api/vote/cast (429 Too Many Requests):** `EXITOSO (PASÓ)`
  - **Endpoint/Comando:** `Burst 25 requests to /api/vote/cast`
  - **Código HTTP:** `429` | **Latencia:** `15 ms`
  - **Detalle de Evidencia:** Rate limit activado correctamente tras umbral perimetral (HTTP 429 recibido)
