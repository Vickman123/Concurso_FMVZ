import rateLimit from 'express-rate-limit';

export const voteRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de votación desde esta red. Por favor espera un momento.',
  },
});

export const registrationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 registrations per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Has alcanzado el límite temporal de registros. Por favor intenta más tarde.',
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de acceso fallidos. Por seguridad, la cuenta está bloqueada temporalmente.',
  },
});
