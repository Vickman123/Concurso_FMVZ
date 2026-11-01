import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDb, closeDb } from './db/connection';
import { runMigrations } from './db/migrate';
import contestRoutes from './routes/contestRoutes';
import participantRoutes from './routes/participantRoutes';
import voteRoutes from './routes/voteRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Allows flexible inline SVGs and canvas-confetti
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gateway-Secret'],
}));

import { validateGatewaySecret } from './middleware/gatewayAuth';
app.use(validateGatewaySecret);

// Body Parsers (Support rich Base64 image payloads and large multipart files)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads folder (Configurable for VPS persistent storage)
const uploadsPath = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

import liveRoutes from './routes/liveRoutes';

// API Routes
app.use('/api/contest', contestRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/live', liveRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: 'Segundo Concurso de Disfraces FMVZ - UNAM',
    date: '2026-11-03',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Frontend] Serving production bundle from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Error interno del servidor', details: err.message || 'Error inesperado' });
});

async function startServer() {
  try {
    await initDb();
    await runMigrations();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🎃 FMVZ HALLOWEEN — Segundo Concurso de Disfraces UNAM`);
      console.log(`🚀 Web Application running on http://localhost:${PORT}`);
      console.log(`📂 Uploads directory served from ${uploadsPath}`);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[Process] HTTP server closed.');
        try {
          await closeDb();
          console.log('[Process] Database connection pool closed.');
          process.exit(0);
        } catch (closeErr) {
          console.error('[Process Error] Error during db pool close:', closeErr);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('[Process Error] Forcefully terminating process after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
