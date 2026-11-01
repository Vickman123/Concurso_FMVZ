/**
 * ============================================================================
 * CONCURSO FMVZ — HTTP GATEWAY (RENDER → OVHCLOUD)
 * ============================================================================
 * 
 * Este servicio actúa como Gateway HTTP perimetral ejecutándose en Render:
 * 1. Mantiene el dominio público https://concurso-fmvz.onrender.com
 * 2. Sirve el paquete compilado de producción de la SPA React (client/dist) con soporte SPA History API.
 * 3. Enruta /api/* de forma transparente hacia el backend en OVHcloud (135.148.166.89).
 * 4. Enruta /uploads/* hacia el almacenamiento persistente en OVHcloud.
 * 5. Preserva el streaming de eventos Server-Sent Events (SSE) sin buffering ni timeouts.
 * 6. Aplica cabeceras de seguridad, control de tamaño de carga (15 MB) y limitación de tasa (rate limiting).
 * 7. Inyecta autenticación inter-servidor mediante cabecera 'X-Gateway-Secret'.
 * 8. Registra logs operativos sanitizados (sin registrar contraseñas, tokens ni credenciales).
 * ============================================================================
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

// Cargar variables de entorno (desde carpeta gateway o raíz del proyecto)
const gatewayEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(gatewayEnvPath)) {
  dotenv.config({ path: gatewayEnvPath });
}
dotenv.config(); // Fallback o variables raíz

const app = express();

// Configuración general
const PORT = process.env.PORT || 3000;
const OVH_BACKEND_URL = (process.env.OVH_BACKEND_URL || 'http://135.148.166.89').trim().replace(/\/+$/, '');
const GATEWAY_SECRET = (process.env.GATEWAY_SECRET || '').trim();
const rawClientPath = process.env.CLIENT_DIST_PATH || '../client/dist';
const CLIENT_DIST_PATH = path.isAbsolute(rawClientPath) ? rawClientPath : path.resolve(__dirname, rawClientPath);
const MAX_PAYLOAD_BYTES = 15 * 1024 * 1024; // 15 Megabytes

console.log('=======================================================');
console.log('🌐 FMVZ HALLOWEEN — Render Gateway -> OVHcloud');
console.log(`🎯 Target VPS Backend: ${OVH_BACKEND_URL}`);
console.log(`🔐 Inter-Server Auth: ${GATEWAY_SECRET ? 'Configurada (X-Gateway-Secret activo)' : 'Modo abierto / sin secreto'}`);
console.log(`📁 Client Dist Path:   ${CLIENT_DIST_PATH} (Existe: ${fs.existsSync(CLIENT_DIST_PATH)})`);
console.log('=======================================================');

// 1. Cabeceras de seguridad perimetral (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Permite SVGs inline, QR codes y canvas-confetti
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Deshabilitar cabecera publicitaria de Express
app.disable('x-powered-by');

// 2. Middleware de Registro de Logs Sanitizado
// Regla estricta: Jamás registrar contraseñas, tokens JWT, cookies ni secretos inter-servidor
app.use((req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    // Sanitizar path de parámetros de consulta con posibles tokens (ej. ?auth=... o ?token=...)
    const sanitizedUrl = req.originalUrl.replace(/([?&])(auth|token|jwt|password|secret)=[^&]+/gi, '$1$2=[REDACTED]');
    const logLine = `[Gateway] ${new Date().toISOString()} | ${req.method} ${sanitizedUrl} | ${statusCode} | ${duration}ms | ${clientIp}`;
    
    if (statusCode >= 500) {
      console.error(logLine);
    } else if (statusCode >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
});

// 3. Control de Tamaño de Carga (Límite 15 MB)
app.use((req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({
      error: 'Payload Too Large: El archivo o contenido excede el límite máximo permitido de 15 MB.',
    });
  }
  next();
});

// 4. Limitación de Tasa (Rate Limiting)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 150, // 150 peticiones por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes al gateway. Por favor, intente de nuevo en un minuto.' },
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 intentos de emisión de voto por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de emisión de voto. Espere un momento antes de reintentar.' },
});

app.use('/api/vote/cast', voteLimiter);
app.use('/api/', generalLimiter);

// 5. Diagnóstico interno del Gateway
app.get('/gateway-health', async (req, res) => {
  let ovhStatus = 'unknown';
  let ovhLatencyMs = null;
  const t0 = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const checkHeaders = {};
    if (GATEWAY_SECRET) {
      checkHeaders['X-Gateway-Secret'] = GATEWAY_SECRET;
    }

    const ovhRes = await fetch(`${OVH_BACKEND_URL}/api/health`, {
      signal: controller.signal,
      headers: checkHeaders,
    });
    clearTimeout(timeoutId);

    ovhLatencyMs = Date.now() - t0;
    ovhStatus = ovhRes.ok ? 'connected' : `http_${ovhRes.status}`;
  } catch (err) {
    ovhStatus = `unreachable: ${err.message}`;
  }

  res.json({
    gateway: 'operational',
    service: 'concurso-fmvz-gateway',
    domain: 'concurso-fmvz.onrender.com',
    target_vps: OVH_BACKEND_URL,
    target_connectivity: ovhStatus,
    target_latency_ms: ovhLatencyMs,
    client_dist_exists: fs.existsSync(CLIENT_DIST_PATH),
    timestamp: new Date().toISOString(),
  });
});

// Helper para adjuntar cabeceras seguras a peticiones hacia el VPS
function onProxyReq(proxyReq, req, res) {
  // Inyectar el secreto inter-servidor si está configurado
  if (GATEWAY_SECRET) {
    proxyReq.setHeader('X-Gateway-Secret', GATEWAY_SECRET);
  }

  // Preservar la IP del cliente real para auditoría y rate limiting en OVH
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (clientIp) {
    proxyReq.setHeader('X-Forwarded-For', clientIp);
  }

  // Indicar que la conexión original del cliente en Render fue HTTPS
  proxyReq.setHeader('X-Forwarded-Proto', req.headers['x-forwarded-proto'] || 'https');
  proxyReq.setHeader('X-Forwarded-Host', req.headers['x-forwarded-host'] || req.headers.host || 'concurso-fmvz.onrender.com');
}

// 6. Proxy específico para SSE (/api/live/stream)
// Configuración estricta para evitar buffering, desconexiones o timeouts en el streaming
const sseStreamProxy = createProxyMiddleware({
  target: OVH_BACKEND_URL,
  changeOrigin: true,
  ws: false,
  timeout: 0,
  proxyTimeout: 0,
  on: {
    proxyReq: (proxyReq, req, res) => {
      onProxyReq(proxyReq, req, res);
      proxyReq.setHeader('Connection', 'keep-alive');
      proxyReq.setHeader('Cache-Control', 'no-cache');
      // Deshabilitar compresión en origen para evitar empaquetado de chunks SSE
      proxyReq.setHeader('Accept-Encoding', 'identity');
    },
    proxyRes: (proxyRes, req, res) => {
      // Cabecera clave para que proxies intermedios (Nginx/Envoy en Render) no almacenen en buffer
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Connection', 'keep-alive');

      // Desactivar timeouts del socket HTTP de Node
      req.setTimeout(0);
      res.setTimeout(0);
    },
    error: (err, req, res) => {
      console.error('[Gateway SSE Error]:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Error de comunicación SSE con el backend OVH', details: err.message });
      }
    },
  },
});

app.use((req, res, next) => {
  if (req.path === '/api/live/stream' || req.path.startsWith('/api/live/stream')) {
    return sseStreamProxy(req, res, next);
  }
  next();
});

// 7. Proxy para todas las demás rutas de API (/api/*)
const apiProxy = createProxyMiddleware({
  target: OVH_BACKEND_URL,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  on: {
    proxyReq: onProxyReq,
    error: (err, req, res) => {
      console.error('[Gateway API Proxy Error]:', err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Error de pasarela: No fue posible comunicarse con el backend en OVHcloud',
          details: err.message,
          timestamp: new Date().toISOString(),
        });
      }
    },
  },
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return apiProxy(req, res, next);
  }
  next();
});

// 8. Proxy para el almacenamiento de fotografías (/uploads/*)
const uploadsProxy = createProxyMiddleware({
  target: OVH_BACKEND_URL,
  changeOrigin: true,
  timeout: 20000,
  proxyTimeout: 20000,
  on: {
    proxyReq: onProxyReq,
    proxyRes: (proxyRes, req, res) => {
      // Optimización de caché para imágenes de disfraces (7 días)
      if (proxyRes.statusCode === 200) {
        res.setHeader('Cache-Control', 'public, max-age=604800, no-transform');
      }
    },
    error: (err, req, res) => {
      console.error('[Gateway Uploads Proxy Error]:', err.message);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Recurso de imagen no encontrado o VPS inaccesible' });
      }
    },
  },
});

app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return uploadsProxy(req, res, next);
  }
  next();
});

// 9. Servir Frontend Estático (client/dist) y Fallback de React Router (SPA)
if (fs.existsSync(CLIENT_DIST_PATH)) {
  // Servir archivos estáticos cacheados
  app.use(express.static(CLIENT_DIST_PATH, {
    index: false, // El index.html se maneja explícitamente para controlar caché
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/')) {
        // Los bundles de Vite tienen hash inmutable
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  }));

  // Fallback para React Router: cualquier ruta web entrega index.html sin caché
  app.get('*', (req, res, next) => {
    // Si la ruta es /api o /uploads, pasar al siguiente manejador de error 404
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }

    const indexPath = path.join(CLIENT_DIST_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(indexPath);
    }
    next();
  });
} else {
  console.warn(`[Gateway Warning] ${CLIENT_DIST_PATH} no encontrado. Ejecute 'npm run build --workspace=client'.`);
  app.get('/', (req, res) => {
    res.status(503).json({
      error: 'Frontend React aún no compilado. Ejecute npm run build --workspace=client',
      timestamp: new Date().toISOString(),
    });
  });
}

// 10. Manejador 404 para rutas no reconocidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en el Gateway', path: req.originalUrl });
});

// 11. Manejo Global de Errores
app.use((err, req, res, next) => {
  console.error('[Gateway Fatal Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno en el Gateway', message: err.message });
  }
});

// 12. Arranque y Cierre Grácil del Servidor
let serverInstance = null;

function startGateway(port = PORT) {
  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      console.log(`🚀 Concurso FMVZ Gateway listening on http://localhost:${port}`);
      resolve(serverInstance);
    });
  });
}

function stopGateway() {
  return new Promise((resolve, reject) => {
    if (!serverInstance) return resolve();
    serverInstance.close((err) => {
      if (err) return reject(err);
      console.log('[Gateway] Server instance closed gracefully.');
      resolve();
    });
  });
}

if (require.main === module) {
  startGateway();

  const handleShutdown = (signal) => {
    console.log(`\n[Gateway] Received ${signal}. Starting graceful shutdown...`);
    stopGateway().then(() => {
      console.log('[Gateway] Exiting process.');
      process.exit(0);
    }).catch((err) => {
      console.error('[Gateway Error closing]:', err);
      process.exit(1);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = { app, startGateway, stopGateway };
