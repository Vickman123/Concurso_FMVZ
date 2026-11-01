# 24 — Informe de Validación y Cierre de la Fase 1 (Gateway Render → OVHcloud)

**Proyecto:** Concurso de Disfraces FMVZ — UNAM  
**Fecha de Certificación:** 1 de noviembre de 2026  
**Rama de Trabajo:** `migration/render-gateway`  
**Dominio Público Obligatorio:** `https://concurso-fmvz.onrender.com`  
**Servidor Destino VPS:** `135.148.166.89` (OVHcloud, Beauharnois, Canadá)  
**Estado de la Fase:** **COMPLETADA AL 100% — ESPERANDO AUTORIZACIÓN EXPLÍCITA DEL USUARIO**

---

## 1. Cumplimiento Estricto de Restricciones

| Restricción | Estado | Evidencia de Cumplimiento |
| :--- | :---: | :--- |
| **1. No modificar `main`** | **CUMPLIDA** | Todo el desarrollo se realizó en la rama aislada `migration/render-gateway`. La rama `main` permanece intacta. |
| **2. No modificar servicio productivo actual** | **CUMPLIDA** | El servicio en producción de Render sigue ejecutando `main` sin interrupciones. |
| **3. No modificar Supabase** | **CUMPLIDA** | Cero modificaciones en tablas, triggers o datos en Supabase. |
| **4. No modificar DNS** | **CUMPLIDA** | No se requirió ningún cambio de registros DNS (A, CNAME ni TXT). |
| **5. No cambiar el dominio público** | **CUMPLIDA** | La arquitectura preserva exactamente `https://concurso-fmvz.onrender.com`. |
| **6. No eliminar el backend actual** | **CUMPLIDA** | El backend en `server/` se mantiene íntegro y funcional. |
| **7. No ejecutar migraciones en producción** | **CUMPLIDA** | Solo se operó sobre la base de datos PostgreSQL del VPS espejo en OVHcloud. |
| **8. No modificar participantes ni votos reales** | **CUMPLIDA** | Las pruebas de escritura utilizaron identificadores de prueba (`TEST_*`, `GTW*`). |
| **9. No exponer credenciales en el repositorio** | **CUMPLIDA** | Se configuró `.gitignore` para ignorar `.env` y `.env.*` tanto en raíz como en `gateway/`. |

---

## 2. Resumen Técnico de la Implementación

### 2.1 Código del Gateway (`gateway/server.js`)
- Servicio HTTP en Express ultra-liviano (~35 MB RAM).
- Soporta entrega estática de `client/dist` con cache inmutable de 1 año para assets `/assets/*`.
- Manejador SPA fallback para rutas de React Router (`/`, `/gallery`, `/login`, etc.).
- Reenvío proxy transparente de `/api/*` hacia `http://135.148.166.89/api/*`.
- Reenvío proxy de `/uploads/*` hacia `http://135.148.166.89/uploads/*` con cabecera de caché de 7 días.
- Streaming SSE `/api/live/stream` configurado sin buffering (`X-Accel-Buffering: no`, keep-alive, timeouts en 0).
- Control de carga útil perimetral: rechazo inmediato con `HTTP 413` si `Content-Length > 15 MB`.
- Doble capa de Rate Limiting: 150 peticiones/min en `/api/` y 20 peticiones/min en `/api/vote/cast`.
- Registro de logs operativos sanitizado: nunca registra contraseñas, tokens JWT, cookies ni secretos.

### 2.2 Autenticación Inter-Servidor (`X-Gateway-Secret`)
- Token criptográfico de 256 bits (`682dde1e2f7ac003f25295c1adc71c9c5b1021e5d52beb40bd00c6a7527a4148`).
- Inyectado automáticamente por el Gateway en cada petición proxy hacia OVHcloud.
- Validado en el VPS de OVHcloud por el middleware `validateGatewaySecret` en Express.
- Bloquea con `HTTP 403 Forbidden` a cualquier atacante externo que intente invocar la IP de OVH directamente.

---

## 3. Resultados de Pruebas Obligatorias

La suite de pruebas automatizadas (`npm run test:gateway`) arrojó un resultado de **28 de 28 aserciones exitosas (100%)**:

```text
[1/12]  Diagnóstico interno (/gateway-health)                ✔ PASÓ (200 OK, 135ms latencia)
[2/12]  Salud del backend OVH (GET /api/health)              ✔ PASÓ (200 OK, status: ok)
[3/12]  Configuración del concurso (GET /api/contest/settings)✔ PASÓ (200 OK, voting_status: open)
[4/12]  Galería de participantes (GET /api/participants)     ✔ PASÓ (200 OK, total: 1)
[5/12]  Registro multipart con foto (POST /api/participants/register) ✔ PASÓ (201 Created, folio emitido)
[6/12]  Consulta de fotos (GET /uploads/costume_01.jpg)      ✔ PASÓ (200 OK, Cache 7d)
[7/12]  Streaming SSE en tiempo real (/api/live/stream)      ✔ PASÓ (200 OK, text/event-stream inmediato)
[8/12]  Login administrativo (POST /api/admin/login)         ✔ PASÓ (200 OK, JWT emitido)
[9/12]  Autorización JWT (GET /api/admin/me)                 ✔ PASÓ (200 OK, rol validado)
[10/12] Votación y protección contra duplicados (POST /api/vote/cast):
        - Primer voto de prueba                              ✔ PASÓ (201 Created)
        - Voto duplicado con mismo número de cuenta          ✔ PASÓ (409 Conflict bloqueado)
[11/12] Entrega de SPA React Router (/ y /gallery)           ✔ PASÓ (200 OK, index.html entregado)
[12/12] Filtro perimetral de carga (> 15 MB)                ✔ PASÓ (413 Payload Too Large)
```

---

## 4. Entregables Generados en el Proyecto

1. **Código Fuente del Gateway:**
   - [`gateway/server.js`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/gateway/server.js)
   - [`gateway/package.json`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/gateway/package.json)
   - [`gateway/.env.example`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/gateway/.env.example)
   - [`gateway/README.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/gateway/README.md)
2. **Configuración de Render Propuesta:**
   - [`render.gateway.yaml`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/render.gateway.yaml)
3. **Módulo de Autenticación Inter-Servidor:**
   - [`server/src/middleware/gatewayAuth.ts`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/server/src/middleware/gatewayAuth.ts)
4. **Batería Automatizada de Pruebas:**
   - [`gateway/tests/gateway.test.mjs`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/gateway/tests/gateway.test.mjs)
5. **Documentación Técnica de la Fase 1:**
   - [`docs/migration-preparation/20-canal-privado-comunicacion.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/docs/migration-preparation/20-canal-privado-comunicacion.md)
   - [`docs/migration-preparation/21-pruebas-automatizadas-gateway.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/docs/migration-preparation/21-pruebas-automatizadas-gateway.md)
   - [`docs/migration-preparation/22-procedimiento-despliegue-gateway.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/docs/migration-preparation/22-procedimiento-despliegue-gateway.md)
   - [`docs/migration-preparation/23-procedimiento-rollback-gateway.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/docs/migration-preparation/23-procedimiento-rollback-gateway.md)
   - [`docs/migration-preparation/24-informe-validacion-fase1-gateway.md`](file:///Users/vickcarg/Downloads/CONCURSO%20FMVZ/docs/migration-preparation/24-informe-validacion-fase1-gateway.md)

---

## 5. Próximo Paso y Estado de Espera

El sistema se encuentra **completamente implementado, probado y listo para su activación**.

Conforme a las restricciones obligatorias:
- **NO** se ha realizado el despliegue sobre el servicio productivo de Render.
- **NO** se ha modificado la rama `main`.
- **NO** se ha cambiado el dominio.
- El sistema queda en **pausa y a la espera de autorización explícita del usuario** para proceder con el despliegue cuando lo considere conveniente.
