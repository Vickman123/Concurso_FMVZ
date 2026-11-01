# 21 — Suite de Pruebas Automatizadas del Gateway (Fase 1)

## 1. Resumen de Ejecución y Cobertura

La suite de pruebas automatizadas (`gateway/tests/gateway.test.mjs`) fue diseñada para certificar el desacoplamiento total entre el Gateway de Render y el Backend en OVHcloud.

- **Total de pruebas en batería:** 12 suites principales
- **Aserciones individuales validadas:** 28 verificaciones
- **Resultado final:** **28 / 28 PASADAS (100% de éxito)**
- **Tiempo total de ejecución:** 1.83 segundos
- **Comando de ejecución:** `npm run test:gateway`

---

## 2. Detalle de Pruebas Obligatorias Ejecutadas

### Prueba 1: Diagnóstico de Enlace Interno (`GET /gateway-health`)
- **Objetivo:** Verificar el estado del Gateway y su enlace con el VPS.
- **Aserciones:**
  1. `HTTP Status 200` en `/gateway-health`.
  2. `target_connectivity === 'connected'` (latencia detectada: ~135-140 ms).
  3. `client_dist_exists === true` (SPA React lista para entrega).

### Prueba 2: Salud del Backend en OVHcloud (`GET /api/health`)
- **Objetivo:** Verificar que el proxy transparente alcanza el backend de OVHcloud.
- **Aserciones:**
  1. `HTTP Status 200` en `/api/health`.
  2. Payload JSON con `status: "ok"` y metadatos del evento FMVZ UNAM.

### Prueba 3: Consulta de Configuración del Concurso (`GET /api/contest/settings`)
- **Objetivo:** Validar consulta de lectura a PostgreSQL a través del Gateway.
- **Aserciones:**
  1. `HTTP Status 200` en `/api/contest/settings`.
  2. Validación de nombre oficial del evento.
  3. Validación de estado de votación (`open`).

### Prueba 4: Galería Pública de Participantes (`GET /api/participants`)
- **Objetivo:** Validar lectura y serialización de participantes registrados.
- **Aserciones:**
  1. `HTTP Status 200` en `/api/participants`.
  2. Arreglo estructurado de participantes con conteo total.

### Prueba 5: Registro de Participante Multipart con Fotografía (`POST /api/participants/register`)
- **Objetivo:** Validar la subida de un formulario `multipart/form-data` con archivo binario de imagen (JPEG) a través del Gateway hacia el disco del VPS.
- **Aserciones:**
  1. `HTTP Status 201` de creación exitosa.
  2. Emisión de folio oficial de registro (`FMVZ-REG-2026-004-C082B6`).

### Prueba 6: Consulta y Descarga de Fotografías Persistentes (`GET /uploads/costume_01.jpg`)
- **Objetivo:** Validar que los recursos estáticos en el almacenamiento de OVH se entreguen correctamente con cabeceras de caché.
- **Aserciones:**
  1. `HTTP Status 200` al solicitar fotografía.
  2. Cabecera `Content-Type: image/jpeg`.
  3. Cabecera `Cache-Control: public, max-age=604800, no-transform`.

### Prueba 7: Streaming SSE en Tiempo Real sin Buffering (`GET /api/live/stream`)
- **Objetivo:** Validar que la conexión Server-Sent Events se establezca de inmediato sin retención de buffer en el Gateway.
- **Aserciones:**
  1. `HTTP Status 200` y `Content-Type: text/event-stream`.
  2. Recepción inmediata de eventos iniciales (`:connected`, `INITIAL_STATE`, `VIEWER_JOINED`) en menos de 100 ms.

### Prueba 8: Login Administrativo (`POST /api/admin/login`)
- **Objetivo:** Validar autenticación de usuario administrador con contraseña cifrada (bcrypt) en base de datos.
- **Aserciones:**
  1. `HTTP Status 200` en credenciales válidas.
  2. Emisión y recepción de token JWT administrativo.

### Prueba 9: Autorización JWT (`GET /api/admin/me`)
- **Objetivo:** Validar que el Gateway retransmita intacta la cabecera `Authorization: Bearer <JWT>`.
- **Aserciones:**
  1. `HTTP Status 200` con token válido.
  2. Validación de identidad y rol administrativo devuelto.

### Prueba 10: Votación Atómica y Protección contra Duplicados (`POST /api/vote/cast`)
- **Objetivo:** Certificar la protección atómica contra votos dobles a través del Gateway.
- **Aserciones:**
  1. **Primer voto:** Retorna `HTTP 201 Created` con folio de confirmación (`FMVZ-VOTO-2026-F15686F8`).
  2. **Segundo voto (idéntico identificador):** Retorna `HTTP 409 Conflict` con mensaje `"Esta identidad institucional ya cuenta con un voto registrado en el concurso."`

### Prueba 11: Rutas de React Router (SPA History API Fallback)
- **Objetivo:** Validar que las rutas no-API sirvan el archivo `client/dist/index.html`.
- **Aserciones:**
  1. `HTTP Status 200` en ruta raíz `/`.
  2. `HTTP Status 200` en ruta SPA `/gallery`.
  3. Ambas entregan el bundle HTML de React.

### Prueba 12: Filtro de Seguridad de Tamaño de Carga (> 15 MB)
- **Objetivo:** Proteger el ancho de banda y memoria rechazando peticiones excesivas antes del reenrutamiento.
- **Aserciones:**
  1. Petición con `Content-Length: 16777216` (16 MB) es rechazada perimetralmente con `HTTP 413 Payload Too Large` en 0 ms.

---

## 3. Registro de Ejecución (Log de Salida de Consola)

```text
> fmvz-halloween-concurso@1.0.0 test:gateway
> node gateway/tests/gateway.test.mjs

=======================================================
🌐 FMVZ HALLOWEEN — Render Gateway -> OVHcloud
🎯 Target VPS Backend: http://135.148.166.89
🔐 Inter-Server Auth: Configurada (X-Gateway-Secret activo)
📁 Client Dist Path:   /Users/vickcarg/Downloads/CONCURSO FMVZ/client/dist (Existe: true)
=======================================================

===================================================================
🧪 INICIANDO BATERÍA DE PRUEBAS OBLIGATORIAS — RENDER GATEWAY
   Objetivo: Validar desacoplamiento perimetral Render -> OVHcloud
   Puerto de prueba Gateway: 3123
===================================================================

🚀 Concurso FMVZ Gateway listening on http://localhost:3123

[1/12] Diagnóstico de enlace interno del Gateway (/gateway-health)
  ✔ PASÓ: HTTP Status 200 en /gateway-health Status: 200
  ✔ PASÓ: Conectividad activa hacia VPS OVHcloud VPS: http://135.148.166.89 (135ms)
  ✔ PASÓ: Directorio client/dist presente y accesible 

[2/12] Salud del backend en OVHcloud vía Gateway (GET /api/health)
  ✔ PASÓ: HTTP Status 200 en /api/health 
  ✔ PASÓ: Respuesta válida del backend de producción/espejo Evento: Segundo Concurso de Disfraces FMVZ - UNAM

[3/12] Consulta de configuración del concurso (GET /api/contest/settings)
  ✔ PASÓ: HTTP Status 200 en /api/contest/settings 
  ✔ PASÓ: Nombre del concurso recibido correctamente "Segundo Concurso de Disfraces FMVZ"
  ✔ PASÓ: Estado de votación válido Estado: open

[4/12] Consulta de participantes en galería (GET /api/participants)
  ✔ PASÓ: HTTP Status 200 en /api/participants 
  ✔ PASÓ: Estructura con arreglo de participantes Total devuelto: 1

[5/12] Registro de participante multipart con foto (POST /api/participants/register)
  ✔ PASÓ: HTTP Status 201 en registro exitoso Status: 201
  ✔ PASÓ: Folio de registro emitido Folio: FMVZ-REG-2026-004-C082B6

[6/12] Consulta y descarga de fotografías persistentes (/uploads/*)
  ✔ PASÓ: HTTP Status 200 al consultar fotografía existente en VPS Status: 200
  ✔ PASÓ: Content-Type de imagen JPEG verificado Tipo: image/jpeg
  ✔ PASÓ: Cabecera Cache-Control activa para assets estáticos Cache: max-age=604800, public, no-transform

[7/12] Streaming en tiempo real SSE sin buffering (/api/live/stream)
  ✔ PASÓ: HTTP 200 y Content-Type: text/event-stream vía Gateway 
  ✔ PASÓ: Recepción inmediata de eventos SSE sin retención ni buffering Bytes iniciales recibidos: 64

[8/12] Autenticación administrativa (POST /api/admin/login)
  ✔ PASÓ: HTTP Status 200 en login administrativo correcto 
  ✔ PASÓ: Token JWT recibido satisfactoriamente 

[9/12] Verificación de sesión protegida con JWT (GET /api/admin/me)
  ✔ PASÓ: HTTP Status 200 con Authorization: Bearer <JWT> 
  ✔ PASÓ: Identidad administrativa validada Usuario: Administrador Concurso FMVZ (admin)

[10/12] Emisión de voto de prueba y protección atómica contra duplicados
  ✔ PASÓ: Primer voto registrado exitosamente (HTTP 201) Folio: FMVZ-VOTO-2026-F15686F8
  ✔ PASÓ: Intento de voto duplicado bloqueado con HTTP 409 Conflict Motivo: Esta identidad institucional ya cuenta con un voto registrado en el concurso.

[11/12] Entrega de la SPA React y soporte de rutas internas
  ✔ PASÓ: HTTP 200 en ruta raíz / 
  ✔ PASÓ: index.html servido en ruta / 
  ✔ PASÓ: HTTP 200 en ruta interna /gallery (React Router) 
  ✔ PASÓ: SPA fallback entrega index.html en /gallery 

[12/12] Filtro de seguridad: Rechazo perimetral de payload > 15 MB
  ✔ PASÓ: Rechazo inmediato con HTTP 413 Payload Too Large Status recibido: 413

===================================================================
📊 RESUMEN FINAL DE CERTIFICACIÓN DE LA PASARELA
===================================================================
  Total de pruebas ejecutadas: 28
  Pruebas exitosas:          28
  Pruebas fallidas:          0

🎉 TODAS LAS PRUEBAS OBLIGATORIAS PASARON SATISFACTORIAMENTE.
```
