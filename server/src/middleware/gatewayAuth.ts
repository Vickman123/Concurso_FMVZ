import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticación inter-servidor entre el Gateway de Render y el Backend OVHcloud.
 * 
 * Reglas:
 * 1. Si GATEWAY_SECRET no está configurado en las variables de entorno, permite todas las solicitudes
 *    (modo retrocompatible para desarrollo local y transición segura).
 * 2. Si GATEWAY_SECRET está configurado, valida que la solicitud incluya la cabecera 'X-Gateway-Secret'
 *    con el valor exacto esperado.
 * 3. Las rutas de diagnóstico como '/api/health' están exentas de la validación para permitir monitoreo.
 */
export function validateGatewaySecret(req: Request, res: Response, next: NextFunction): void {
  const expectedSecret = process.env.GATEWAY_SECRET;

  // Si no está definido el secreto en el servidor, permitir paso transparente
  if (!expectedSecret || expectedSecret.trim() === '') {
    return next();
  }

  // Rutas públicas de diagnóstico exentas
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  const rawSecret = req.headers['x-gateway-secret'];
  const incomingSecret = (Array.isArray(rawSecret) ? rawSecret[0] : (rawSecret || '')).split(',')[0].trim();

  if (!incomingSecret || incomingSecret !== expectedSecret.trim()) {
    console.warn(`[GatewayAuth] Rechazada solicitud a ${req.method} ${req.path} sin X-Gateway-Secret válido desde ${req.ip}`);
    res.status(403).json({
      error: 'Acceso no autorizado: Gateway secret inválido o ausente',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}
