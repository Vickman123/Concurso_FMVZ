# Render HTTP Gateway — Concurso FMVZ UNAM

Gateway HTTP perimetral ligero desarrollado en Node.js / Express para servir como punto de enlace entre el dominio público alojado en Render (`https://concurso-fmvz.onrender.com`) y la infraestructura independiente en OVHcloud (`135.148.166.89`).

---

## 🎯 Objetivos de la Arquitectura

1. **Conservar el Dominio Público:** Mantiene el dominio `https://concurso-fmvz.onrender.com` con certificado TLS de Render sin requerir adquisición de nuevos dominios ni cambios en DNS.
2. **Eliminar Problemas de Mixed Content:** El navegador del usuario interactúa exclusivamente con el Gateway vía HTTPS (`/api/*`, `/uploads/*`, `/`). El Gateway reenvía internamente las peticiones hacia el VPS de OVHcloud.
3. **Optimización de Recursos en Render:** Al no requerir la compilación de TypeScript del backend ni la ejecución de bases de datos en Render, el Gateway consume menos de **35 MB de RAM** (dentro del plan gratuito de Render).
4. **Streaming SSE sin Buffering:** El endpoint `/api/live/stream` transfiere chunks SSE en tiempo real mediante `X-Accel-Buffering: no`, keep-alive y anulación de timeouts.
5. **Autenticación Inter-Servidor:** Cada petición dirigida a OVHcloud incluye la cabecera `X-Gateway-Secret`, impidiendo accesos directos de terceros que omitan la pasarela perimetral.
6. **Seguridad y Logs Sanitizados:** Rate limiting perimetral, límite de subida de 15 MB y logs que nunca registran tokens, contraseñas ni cabeceras sensibles.

---

## 📁 Estructura del Módulo

```text
gateway/
├── server.js               # Código principal del Gateway HTTP
├── package.json            # Metadatos del servicio
├── .env.example            # Plantilla de variables de entorno
├── README.md               # Este documento
└── tests/
    └── gateway.test.mjs    # Batería automatizada de 28 pruebas de integración
```

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP donde escucha el Gateway en Render | `3000` (Asignado dinámicamente por Render) |
| `OVH_BACKEND_URL` | URL base del servidor backend en OVHcloud | `http://135.148.166.89` |
| `GATEWAY_SECRET` | Token secreto de autenticación inter-servidor | 64 caracteres hexadecimales |
| `CLIENT_DIST_PATH` | Ruta hacia el directorio de la SPA React compilada | `../client/dist` |

---

## 🚀 Ejecución y Pruebas

### 1. Compilación del Frontend (prerrequisito)
```bash
npm run build --workspace=client
```

### 2. Iniciar el Gateway Localmente
```bash
npm run start:gateway
# o directamente:
node gateway/server.js
```

### 3. Ejecutar la Batería Automatizada de Pruebas
```bash
npm run test:gateway
```

### 4. Diagnóstico Interno del Gateway
Con el Gateway corriendo, puedes consultar:
```bash
curl http://localhost:3000/gateway-health
```

Respuesta típica:
```json
{
  "gateway": "operational",
  "service": "concurso-fmvz-gateway",
  "domain": "concurso-fmvz.onrender.com",
  "target_vps": "http://135.148.166.89",
  "target_connectivity": "connected",
  "target_latency_ms": 136,
  "client_dist_exists": true,
  "timestamp": "2026-11-01T06:37:17.104Z"
}
```
