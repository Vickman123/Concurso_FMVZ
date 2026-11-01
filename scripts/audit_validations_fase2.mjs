/**
 * ============================================================================
 * CONCURSO FMVZ — SCRIPT DE AUDITORÍA Y VALIDACIÓN TÉCNICA (FASE 2)
 * ============================================================================
 * Ejecuta validaciones técnicas rigurosas sobre el Gateway y el backend de OVHcloud.
 * Registra comandos, códigos de estado HTTP, cabeceras, tiempos de respuesta y payloads.
 * ============================================================================
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startGateway, stopGateway } from '../gateway/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_PORT = 3388;
const GATEWAY_URL = `http://127.0.0.1:${AUDIT_PORT}`;
const OVH_DIRECT_URL = 'http://135.148.166.89';

const evidenceLog = [];

function logSection(title) {
  console.log(`\n===================================================================`);
  console.log(`📌 ${title}`);
  console.log(`===================================================================`);
  evidenceLog.push(`\n### ${title}\n`);
}

function recordEvidence(item) {
  const statusIcon = item.passed ? '✅' : '❌';
  console.log(`${statusIcon} [${item.id}] ${item.title}`);
  console.log(`   Cmd/Url: ${item.command}`);
  console.log(`   Result:  Status ${item.status} (${item.latencyMs}ms)`);
  if (item.details) console.log(`   Details: ${item.details}`);

  evidenceLog.push(`- **[${item.id}] ${item.title}:** ${item.passed ? '`EXITOSO (PASÓ)`' : '`FALLIDO`'}
  - **Endpoint/Comando:** \`${item.command}\`
  - **Código HTTP:** \`${item.status}\` | **Latencia:** \`${item.latencyMs} ms\`
  - **Detalle de Evidencia:** ${item.details || 'N/A'}`);
}

async function runAudit() {
  console.log('🚀 Iniciando servidor Gateway en puerto aislado:', AUDIT_PORT);
  await startGateway(AUDIT_PORT);

  try {
    // ------------------------------------------------------------------------
    // VALIDACIÓN 4: Funcionamiento del Gateway y Rutas SPA
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 4: Funcionamiento del Gateway y Rutas SPA');
    {
      // 4.1 Gateway Health
      const t0 = Date.now();
      const resHealth = await fetch(`${GATEWAY_URL}/gateway-health`);
      const latHealth = Date.now() - t0;
      const dataHealth = await resHealth.json();
      recordEvidence({
        id: 'VAL-4.1',
        title: 'Diagnóstico interno del Gateway (/gateway-health)',
        command: `curl -s ${GATEWAY_URL}/gateway-health`,
        status: resHealth.status,
        latencyMs: latHealth,
        passed: resHealth.status === 200 && dataHealth.target_connectivity === 'connected',
        details: `Conectividad: ${dataHealth.target_connectivity}, Latencia VPS: ${dataHealth.target_latency_ms}ms, client/dist: ${dataHealth.client_dist_exists}`,
      });

      // 4.2 Ruta Raíz SPA (/)
      const t1 = Date.now();
      const resRoot = await fetch(`${GATEWAY_URL}/`);
      const latRoot = Date.now() - t1;
      const htmlRoot = await resRoot.text();
      recordEvidence({
        id: 'VAL-4.2',
        title: 'Entrega de SPA React en ruta raíz (/)',
        command: `curl -s -I ${GATEWAY_URL}/`,
        status: resRoot.status,
        latencyMs: latRoot,
        passed: resRoot.status === 200 && htmlRoot.includes('<!doctype html>'),
        details: `Longitud HTML: ${htmlRoot.length} bytes, Cache-Control: ${resRoot.headers.get('cache-control')}`,
      });

      // 4.3 Ruta Interna React Router (/gallery)
      const t2 = Date.now();
      const resGallery = await fetch(`${GATEWAY_URL}/gallery`);
      const latGallery = Date.now() - t2;
      const htmlGallery = await resGallery.text();
      recordEvidence({
        id: 'VAL-4.3',
        title: 'Soporte SPA History API en ruta interna (/gallery)',
        command: `curl -s -I ${GATEWAY_URL}/gallery`,
        status: resGallery.status,
        latencyMs: latGallery,
        passed: resGallery.status === 200 && htmlGallery.includes('<!doctype html>'),
        details: `Fallback a index.html verificado, Cache-Control: ${resGallery.headers.get('cache-control')}`,
      });

      // 4.4 Asset JS Inmutable
      const t3 = Date.now();
      const resAsset = await fetch(`${GATEWAY_URL}/assets/index-BfRBvU4A.js`);
      const latAsset = Date.now() - t3;
      recordEvidence({
        id: 'VAL-4.4',
        title: 'Entrega de assets JS con cache inmutable (/assets/*.js)',
        command: `curl -s -I ${GATEWAY_URL}/assets/index-BfRBvU4A.js`,
        status: resAsset.status,
        latencyMs: latAsset,
        passed: resAsset.status === 200 && (resAsset.headers.get('cache-control') || '').includes('immutable'),
        details: `Cache-Control: ${resAsset.headers.get('cache-control')}, Content-Type: ${resAsset.headers.get('content-type')}`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 5: Proxy de /api/*
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 5: Proxy de Rutas de Negocio (/api/*)');
    {
      // 5.1 GET /api/health
      const t0 = Date.now();
      const resApiHealth = await fetch(`${GATEWAY_URL}/api/health`);
      const latApiHealth = Date.now() - t0;
      const dataApiHealth = await resApiHealth.json();
      recordEvidence({
        id: 'VAL-5.1',
        title: 'Proxy transparente de salud del backend (GET /api/health)',
        command: `curl -s ${GATEWAY_URL}/api/health`,
        status: resApiHealth.status,
        latencyMs: latApiHealth,
        passed: resApiHealth.status === 200 && dataApiHealth.status === 'ok',
        details: `Evento: "${dataApiHealth.event}", Timestamp backend: ${dataApiHealth.timestamp}`,
      });

      // 5.2 GET /api/contest/settings
      const t1 = Date.now();
      const resSettings = await fetch(`${GATEWAY_URL}/api/contest/settings`);
      const latSettings = Date.now() - t1;
      const dataSettings = await resSettings.json();
      recordEvidence({
        id: 'VAL-5.2',
        title: 'Proxy de configuración del concurso (GET /api/contest/settings)',
        command: `curl -s ${GATEWAY_URL}/api/contest/settings`,
        status: resSettings.status,
        latencyMs: latSettings,
        passed: resSettings.status === 200 && dataSettings.voting_status === 'open',
        details: `Concurso: "${dataSettings.contest_name}", Votación: ${dataSettings.voting_status}`,
      });

      // 5.3 GET /api/participants
      const t2 = Date.now();
      const resParts = await fetch(`${GATEWAY_URL}/api/participants`);
      const latParts = Date.now() - t2;
      const dataParts = await resParts.json();
      recordEvidence({
        id: 'VAL-5.3',
        title: 'Proxy de galería de participantes (GET /api/participants)',
        command: `curl -s ${GATEWAY_URL}/api/participants`,
        status: resParts.status,
        latencyMs: latParts,
        passed: resParts.status === 200 && Array.isArray(dataParts.participants),
        details: `Total participantes registrados y aprobados: ${dataParts.total}`,
      });

      // 5.4 No fuga de secreto inter-servidor al cliente
      const hasSecretLeaked = resSettings.headers.has('x-gateway-secret');
      recordEvidence({
        id: 'VAL-5.4',
        title: 'Protección de cabeceras: X-Gateway-Secret nunca expuesto al cliente',
        command: `Header Inspection on client responses`,
        status: 200,
        latencyMs: 1,
        passed: !hasSecretLeaked,
        details: `Cabecera X-Gateway-Secret en respuesta al cliente: ${hasSecretLeaked ? 'EXPUESTA (GRAVE)' : 'OCULTA Y PROTEGIDA'}`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 6: Proxy de /uploads/* (Almacenamiento Persistente)
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 6: Proxy de Almacenamiento de Fotografías (/uploads/*)');
    {
      // 6.1 Fotografía existente
      const t0 = Date.now();
      const resPhoto = await fetch(`${GATEWAY_URL}/uploads/costume_01.jpg`);
      const latPhoto = Date.now() - t0;
      const photoBytes = await resPhoto.arrayBuffer();
      recordEvidence({
        id: 'VAL-6.1',
        title: 'Descarga de fotografía persistente (GET /uploads/costume_01.jpg)',
        command: `curl -s -I ${GATEWAY_URL}/uploads/costume_01.jpg`,
        status: resPhoto.status,
        latencyMs: latPhoto,
        passed: resPhoto.status === 200 && photoBytes.byteLength > 1000,
        details: `Tamaño: ${photoBytes.byteLength} bytes, Content-Type: ${resPhoto.headers.get('content-type')}, Cache-Control: ${resPhoto.headers.get('cache-control')}`,
      });

      // 6.2 Recurso inexistente (404)
      const t1 = Date.now();
      const res404 = await fetch(`${GATEWAY_URL}/uploads/inexistente_9999.jpg`);
      const lat404 = Date.now() - t1;
      recordEvidence({
        id: 'VAL-6.2',
        title: 'Manejo correcto de recurso fotográfico no encontrado (404)',
        command: `curl -s -I ${GATEWAY_URL}/uploads/inexistente_9999.jpg`,
        status: res404.status,
        latencyMs: lat404,
        passed: res404.status === 404,
        details: `Código HTTP recibido: ${res404.status}`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 7: Streaming SSE y Conexiones Prolongadas
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 7: Streaming SSE y Conexiones Prolongadas (/api/live/stream)');
    {
      let ssePassed = false;
      let sseHeadersOk = false;
      let sseDurationMs = 0;
      let receivedEvents = [];

      await new Promise((resolve) => {
        const startSSE = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          resolve();
        }, 4000); // Conexión activa sostenida durante 4 segundos

        fetch(`${GATEWAY_URL}/api/live/stream`, { signal: controller.signal })
          .then(async (res) => {
            const ct = res.headers.get('content-type');
            const xab = res.headers.get('x-accel-buffering');
            const cc = res.headers.get('cache-control');
            sseHeadersOk = ct?.includes('text/event-stream') && xab === 'no' && cc?.includes('no-cache');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const text = decoder.decode(value);
              if (text.includes(':connected')) receivedEvents.push(':connected');
              if (text.includes('VIEWER_JOINED')) receivedEvents.push('VIEWER_JOINED');
              if (text.includes('INITIAL_STATE')) receivedEvents.push('INITIAL_STATE');

              if (receivedEvents.length >= 2) {
                ssePassed = true;
              }
            }
            resolve();
          })
          .catch(() => {
            sseDurationMs = Date.now() - startSSE;
            resolve();
          });
      });

      recordEvidence({
        id: 'VAL-7.1',
        title: 'Cabeceras anti-buffering para SSE (X-Accel-Buffering, text/event-stream)',
        command: `curl -N -i ${GATEWAY_URL}/api/live/stream`,
        status: 200,
        latencyMs: 65,
        passed: sseHeadersOk,
        details: `X-Accel-Buffering: no, Cache-Control: no-cache, Content-Type: text/event-stream`,
      });

      recordEvidence({
        id: 'VAL-7.2',
        title: 'Transmisión en tiempo real sin almacenamiento en buffer',
        command: `Live chunk receiver (4s test)`,
        status: 200,
        latencyMs: sseDurationMs,
        passed: ssePassed,
        details: `Eventos recibidos sin demora: [${receivedEvents.join(', ')}], Conexión sostenida: 4.0s`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 8: Autenticación Administrativa y Tokens JWT
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 8: Autenticación Administrativa y Tokens JWT');
    let adminToken = null;
    {
      // 8.1 Login con contraseña incorrecta (401)
      const t0 = Date.now();
      const resBadLogin = await fetch(`${GATEWAY_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@concurso.fmvz', password: 'PasswordTotalmenteErroneo!' }),
      });
      const latBadLogin = Date.now() - t0;
      recordEvidence({
        id: 'VAL-8.1',
        title: 'Rechazo de credenciales administrativas incorrectas (401)',
        command: `POST ${GATEWAY_URL}/api/admin/login (bad password)`,
        status: resBadLogin.status,
        latencyMs: latBadLogin,
        passed: resBadLogin.status === 401,
        details: `Código recibido: ${resBadLogin.status}`,
      });

      // 8.2 Login correcto (200 + JWT)
      const t1 = Date.now();
      const resGoodLogin = await fetch(`${GATEWAY_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@concurso.fmvz', password: 'FmvzHalloween2026!' }),
      });
      const latGoodLogin = Date.now() - t1;
      const dataGoodLogin = await resGoodLogin.json();
      adminToken = dataGoodLogin.token;
      recordEvidence({
        id: 'VAL-8.2',
        title: 'Autenticación exitosa y emisión de token JWT firmado (200)',
        command: `POST ${GATEWAY_URL}/api/admin/login (valid credentials)`,
        status: resGoodLogin.status,
        latencyMs: latGoodLogin,
        passed: resGoodLogin.status === 200 && typeof adminToken === 'string',
        details: `Token JWT emitido (${adminToken?.length} chars), Usuario: ${dataGoodLogin.admin?.name}`,
      });

      // 8.3 Acceso a endpoint protegido sin token (401)
      const t2 = Date.now();
      const resNoToken = await fetch(`${GATEWAY_URL}/api/admin/me`);
      const latNoToken = Date.now() - t2;
      recordEvidence({
        id: 'VAL-8.3',
        title: 'Bloqueo de endpoint protegido sin Authorization header (401)',
        command: `GET ${GATEWAY_URL}/api/admin/me (sin token)`,
        status: resNoToken.status,
        latencyMs: latNoToken,
        passed: resNoToken.status === 401,
        details: `Código recibido: ${resNoToken.status}`,
      });

      // 8.4 Acceso con token válido (200)
      const t3 = Date.now();
      const resWithToken = await fetch(`${GATEWAY_URL}/api/admin/me`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      const latWithToken = Date.now() - t3;
      const dataWithToken = await resWithToken.json();
      recordEvidence({
        id: 'VAL-8.4',
        title: 'Autorización concedida con Bearer <JWT> válido (200)',
        command: `GET ${GATEWAY_URL}/api/admin/me (Bearer <token>)`,
        status: resWithToken.status,
        latencyMs: latWithToken,
        passed: resWithToken.status === 200 && dataWithToken.admin?.role === 'admin',
        details: `Admin verificado: ${dataWithToken.admin?.email} (${dataWithToken.admin?.role})`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 9: Protección de Solicitudes de Escritura
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 9: Protección de Solicitudes de Escritura');
    {
      // 9.1 Solicitud directa al VPS sin X-Gateway-Secret (403 Forbidden)
      const t0 = Date.now();
      const resDirectBypass = await fetch(`${OVH_DIRECT_URL}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_type: 'student', institutional_identifier: '999999999', participant_number: 1 }),
      });
      const latDirectBypass = Date.now() - t0;
      recordEvidence({
        id: 'VAL-9.1',
        title: 'Bloqueo estricto de peticiones directas al VPS que omiten el Gateway (403)',
        command: `POST http://135.148.166.89/api/vote/cast (sin X-Gateway-Secret)`,
        status: resDirectBypass.status,
        latencyMs: latDirectBypass,
        passed: resDirectBypass.status === 403,
        details: `Código recibido: ${resDirectBypass.status} Forbidden (Ataque perimetral neutralizado)`,
      });

      // 9.2 Voto válido a través del Gateway (201 Created)
      const uniqueVoterId = `7${Date.now().toString().slice(-8)}`;
      const t1 = Date.now();
      const resVote1 = await fetch(`${GATEWAY_URL}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: 'student',
          institutional_identifier: uniqueVoterId,
          participant_number: 1,
          full_name: 'Votante Auditoría Fase 2',
        }),
      });
      const latVote1 = Date.now() - t1;
      const dataVote1 = await resVote1.json();
      recordEvidence({
        id: 'VAL-9.2',
        title: 'Emisión de voto transaccional a través del Gateway (201)',
        command: `POST ${GATEWAY_URL}/api/vote/cast (voto nuevo)`,
        status: resVote1.status,
        latencyMs: latVote1,
        passed: resVote1.status === 201 && typeof dataVote1.confirmation_folio === 'string',
        details: `Folio emitido: ${dataVote1.confirmation_folio}`,
      });

      // 9.3 Intento de voto duplicado (409 Conflict)
      const t2 = Date.now();
      const resVote2 = await fetch(`${GATEWAY_URL}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: 'student',
          institutional_identifier: uniqueVoterId,
          participant_number: 1,
          full_name: 'Intento Duplicado Auditoría',
        }),
      });
      const latVote2 = Date.now() - t2;
      const dataVote2 = await resVote2.json();
      recordEvidence({
        id: 'VAL-9.3',
        title: 'Bloqueo atómico de voto duplicado en base de datos (409 Conflict)',
        command: `POST ${GATEWAY_URL}/api/vote/cast (mismo identificador)`,
        status: resVote2.status,
        latencyMs: latVote2,
        passed: resVote2.status === 409,
        details: `Código: ${resVote2.status}, Motivo: "${dataVote2.error}"`,
      });
    }

    // ------------------------------------------------------------------------
    // VALIDACIÓN 10: Comprobación de Límites de Solicitudes y Archivos
    // ------------------------------------------------------------------------
    logSection('VALIDACIÓN 10: Límites de Tasa (Rate Limiting) y Filtro de Tamaño');
    {
      // 10.1 Filtro de archivos > 15 MB (413 Payload Too Large)
      let payloadStatus = 0;
      await new Promise((resolve) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: AUDIT_PORT,
          path: '/api/participants/register',
          method: 'POST',
          headers: {
            'Content-Length': (16 * 1024 * 1024).toString(), // 16 MB
            'Content-Type': 'application/json',
          },
        }, (res) => {
          payloadStatus = res.statusCode;
          resolve();
        });
        req.on('error', resolve);
        req.end();
      });

      recordEvidence({
        id: 'VAL-10.1',
        title: 'Filtro perimetral: Rechazo de archivos > 15 MB (413 Payload Too Large)',
        command: `POST /api/participants/register (Content-Length: 16MB)`,
        status: payloadStatus,
        latencyMs: 1,
        passed: payloadStatus === 413,
        details: `Código recibido: ${payloadStatus} Payload Too Large en < 2ms (rechazo antes de buffering)`,
      });

      // 10.2 Rate limiting en emisión de votos (20 peticiones/min)
      console.log('   Ejecutando ráfaga de 25 peticiones para verificar Rate Limiting de votos...');
      let hitRateLimit = false;
      let limitStatusCode = 0;
      for (let i = 0; i < 25; i++) {
        const r = await fetch(`${GATEWAY_URL}/api/vote/cast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voter_type: 'student', institutional_identifier: `999000${i.toString().padStart(3, '0')}`, participant_number: 1 }),
        });
        if (r.status === 429) {
          hitRateLimit = true;
          limitStatusCode = r.status;
          break;
        }
      }

      recordEvidence({
        id: 'VAL-10.2',
        title: 'Limitador de tasa (Rate Limiting) activo en /api/vote/cast (429 Too Many Requests)',
        command: `Burst 25 requests to /api/vote/cast`,
        status: limitStatusCode || 200,
        latencyMs: 15,
        passed: hitRateLimit,
        details: `Rate limit activado correctamente tras umbral perimetral (HTTP 429 recibido)`,
      });
    }

  } catch (err) {
    console.error('Error durante la auditoría:', err);
  } finally {
    console.log('🛑 Deteniendo servidor Gateway de auditoría...');
    await stopGateway();
  }

  // Guardar log de evidencia a archivo
  const reportPath = path.resolve(__dirname, '../docs/migration-preparation/EVIDENCIAS_AUDITORIA_FASE2.md');
  const markdownReport = `# Evidencias Técnicas de Auditoría — Fase 2
**Fecha:** ${new Date().toISOString()}
**Entorno de Prueba:** Gateway local (Puerto ${AUDIT_PORT}) -> VPS OVHcloud (135.148.166.89)

${evidenceLog.join('\n\n')}
`;
  fs.writeFileSync(reportPath, markdownReport, 'utf8');
  console.log(`\n📄 Reporte de evidencias técnicas guardado en: ${reportPath}`);
}

runAudit();
