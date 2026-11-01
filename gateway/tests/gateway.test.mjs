/**
 * ============================================================================
 * CONCURSO FMVZ — SUITE DE PRUEBAS AUTOMATIZADAS DEL GATEWAY
 * ============================================================================
 * 
 * Valida todas las pruebas obligatorias definidas en la Fase 1:
 * 1. GET /gateway-health (Diagnóstico de enlace Gateway -> VPS)
 * 2. GET /api/health (Salud del backend OVHcloud a través del Gateway)
 * 3. GET /api/contest/settings (Configuración general del concurso)
 * 4. GET /api/participants (Galería pública de participantes)
 * 5. POST /api/participants/register (Registro multipart con foto en ambiente espejo)
 * 6. GET /uploads/:photo (Consulta y entrega optimizada de fotografías)
 * 7. GET /api/live/stream (Streaming SSE en tiempo real y reconexión sin buffering)
 * 8. POST /api/admin/login (Autenticación administrativa)
 * 9. GET /api/admin/me (Autorización con token JWT administrativo)
 * 10. POST /api/vote/cast (Votación de prueba y protección estricta contra duplicados)
 * 11. GET / y /gallery (Soporte SPA History API de React Router)
 * 12. Control de carga útil (Rechazo inmediato de payloads > 15 MB con HTTP 413)
 * ============================================================================
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, startGateway, stopGateway } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3123;
const GATEWAY_URL = `http://127.0.0.1:${TEST_PORT}`;

// Paleta de colores para consola
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
};

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ${colors.green}✔ PASÓ:${colors.reset} ${testName} ${colors.dim}${details}${colors.reset}`);
    results.push({ name: testName, status: 'PASSED', details });
  } else {
    console.error(`  ${colors.red}✖ FALLÓ:${colors.reset} ${testName} ${colors.bold}${details}${colors.reset}`);
    results.push({ name: testName, status: 'FAILED', details });
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}===================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 INICIANDO BATERÍA DE PRUEBAS OBLIGATORIAS — RENDER GATEWAY${colors.reset}`);
  console.log(`${colors.cyan}   Objetivo: Validar desacoplamiento perimetral Render -> OVHcloud${colors.reset}`);
  console.log(`${colors.cyan}   Puerto de prueba Gateway: ${TEST_PORT}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}===================================================================${colors.reset}\n`);

  // Iniciar servidor del Gateway localmente
  await startGateway(TEST_PORT);

  try {
    // ------------------------------------------------------------------------
    // PRUEBA 1: GET /gateway-health
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[1/12] Diagnóstico de enlace interno del Gateway (/gateway-health)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/gateway-health`);
      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 en /gateway-health', `Status: ${res.status}`);
      assert(data.target_connectivity === 'connected', 'Conectividad activa hacia VPS OVHcloud', `VPS: ${data.target_vps} (${data.target_latency_ms}ms)`);
      assert(data.client_dist_exists === true, 'Directorio client/dist presente y accesible');
    }

    // ------------------------------------------------------------------------
    // PRUEBA 2: GET /api/health
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[2/12] Salud del backend en OVHcloud vía Gateway (GET /api/health)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/api/health`);
      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 en /api/health');
      assert(data.status === 'ok', 'Respuesta válida del backend de producción/espejo', `Evento: ${data.event}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 3: GET /api/contest/settings
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[3/12] Consulta de configuración del concurso (GET /api/contest/settings)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/api/contest/settings`);
      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 en /api/contest/settings');
      assert(typeof data.contest_name === 'string' && data.contest_name.length > 0, 'Nombre del concurso recibido correctamente', `"${data.contest_name}"`);
      assert(data.voting_status === 'open' || data.voting_status === 'paused' || data.voting_status === 'closed', 'Estado de votación válido', `Estado: ${data.voting_status}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 4: GET /api/participants
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[4/12] Consulta de participantes en galería (GET /api/participants)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/api/participants`);
      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 en /api/participants');
      assert(Array.isArray(data.participants), 'Estructura con arreglo de participantes', `Total devuelto: ${data.total}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 5: POST /api/participants/register (Ambiente de pruebas)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[5/12] Registro de participante multipart con foto (POST /api/participants/register)${colors.reset}`);
    let registeredFolio = null;
    {
      const timestamp = Date.now();
      // Formato UNAM alumno: exactamente 9 dígitos numéricos
      const testIdentifier = `9${timestamp.toString().slice(-8)}`;
      const formData = new FormData();
      formData.append('full_name', `Participante Test Gateway ${timestamp.toString().slice(-4)}`);
      formData.append('institutional_identifier', testIdentifier);
      formData.append('email', `gateway_test_${timestamp.toString().slice(-4)}@fmvz.unam.mx`);
      formData.append('public_display_name', `Catrina Gateway ${timestamp.toString().slice(-4)}`);
      formData.append('costume_title', 'Disfraz Automatizado Gateway');
      formData.append('description', 'Registro automático para certificar la pasarela Render -> OVH');
      formData.append('participant_type', 'student');
      formData.append('accepts_terms', 'true');

      // 1x1 JPEG válido para prueba de carga fotográfica
      const jpegBytes = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
        0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
        0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
        0x00, 0xbf, 0x00, 0xff, 0xd9
      ]);
      formData.append('photo', new Blob([jpegBytes], { type: 'image/jpeg' }), 'costume_gateway.jpg');

      const res = await fetch(`${GATEWAY_URL}/api/participants/register`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      assert(res.status === 201, 'HTTP Status 201 en registro exitoso', `Status: ${res.status}`);
      assert(data.success === true && typeof data.registration_folio === 'string', 'Folio de registro emitido', `Folio: ${data.registration_folio}`);
      registeredFolio = data.registration_folio;
    }

    // ------------------------------------------------------------------------
    // PRUEBA 6: Consulta de fotografías (/uploads/...)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[6/12] Consulta y descarga de fotografías persistentes (/uploads/*)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/uploads/costume_01.jpg`);
      assert(res.status === 200, 'HTTP Status 200 al consultar fotografía existente en VPS', `Status: ${res.status}`);
      const contentType = res.headers.get('content-type');
      assert(contentType?.includes('image/jpeg'), 'Content-Type de imagen JPEG verificado', `Tipo: ${contentType}`);
      const cacheControl = res.headers.get('cache-control');
      assert(cacheControl?.includes('max-age'), 'Cabecera Cache-Control activa para assets estáticos', `Cache: ${cacheControl}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 7: Streaming SSE y reconexión (/api/live/stream)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[7/12] Streaming en tiempo real SSE sin buffering (/api/live/stream)${colors.reset}`);
    {
      let sseReceivedChunk = false;
      let sseHeaderCheck = false;
      let streamData = '';

      await new Promise((resolve) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          resolve();
        }, 3000);

        fetch(`${GATEWAY_URL}/api/live/stream`, { signal: controller.signal })
          .then(async (res) => {
            sseHeaderCheck = res.status === 200 && res.headers.get('content-type')?.includes('text/event-stream');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              streamData += chunk;
              if (streamData.includes(':connected') || streamData.includes('INITIAL_STATE') || streamData.includes('VIEWER_JOINED')) {
                sseReceivedChunk = true;
                clearTimeout(timeout);
                controller.abort();
                break;
              }
            }
            resolve();
          })
          .catch(() => resolve());
      });

      assert(sseHeaderCheck, 'HTTP 200 y Content-Type: text/event-stream vía Gateway');
      assert(sseReceivedChunk, 'Recepción inmediata de eventos SSE sin retención ni buffering', `Bytes iniciales recibidos: ${streamData.length}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 8: Login administrativo (POST /api/admin/login)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[8/12] Autenticación administrativa (POST /api/admin/login)${colors.reset}`);
    let adminJwtToken = null;
    {
      const res = await fetch(`${GATEWAY_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@concurso.fmvz',
          password: 'FmvzHalloween2026!',
        }),
      });

      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 en login administrativo correcto');
      assert(typeof data.token === 'string' && data.token.length > 20, 'Token JWT recibido satisfactoriamente');
      adminJwtToken = data.token;
    }

    // ------------------------------------------------------------------------
    // PRUEBA 9: Autorización JWT (GET /api/admin/me)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[9/12] Verificación de sesión protegida con JWT (GET /api/admin/me)${colors.reset}`);
    {
      const res = await fetch(`${GATEWAY_URL}/api/admin/me`, {
        headers: {
          'Authorization': `Bearer ${adminJwtToken}`,
        },
      });

      const data = await res.json();
      assert(res.status === 200, 'HTTP Status 200 con Authorization: Bearer <JWT>');
      assert(data.admin?.email === 'admin@concurso.fmvz', 'Identidad administrativa validada', `Usuario: ${data.admin?.name} (${data.admin?.role})`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 10: Votación de prueba y protección contra duplicados (POST /api/vote/cast)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[10/12] Emisión de voto de prueba y protección atómica contra duplicados${colors.reset}`);
    {
      // 9 dígitos numéricos para alumno UNAM
      const uniqueVoterId = `8${Date.now().toString().slice(-8)}`;

      // 10.1 Primer voto (debe tener éxito con HTTP 201)
      const resVote1 = await fetch(`${GATEWAY_URL}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: 'student',
          institutional_identifier: uniqueVoterId,
          participant_number: 1,
          full_name: 'Votante Certificación Gateway 1',
        }),
      });

      const data1 = await resVote1.json();
      assert(resVote1.status === 201, 'Primer voto registrado exitosamente (HTTP 201)', `Folio: ${data1.confirmation_folio}`);

      // 10.2 Segundo voto idéntico (debe ser rechazado con HTTP 409 Conflict)
      const resVote2 = await fetch(`${GATEWAY_URL}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_type: 'student',
          institutional_identifier: uniqueVoterId,
          participant_number: 1,
          full_name: 'Intento de Voto Duplicado',
        }),
      });

      const data2 = await resVote2.json();
      assert(resVote2.status === 409, 'Intento de voto duplicado bloqueado con HTTP 409 Conflict', `Motivo: ${data2.error}`);
    }

    // ------------------------------------------------------------------------
    // PRUEBA 11: Rutas de React Router (SPA History API Fallback)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[11/12] Entrega de la SPA React y soporte de rutas internas${colors.reset}`);
    {
      const resRoot = await fetch(`${GATEWAY_URL}/`);
      const htmlRoot = await resRoot.text();
      assert(resRoot.status === 200, 'HTTP 200 en ruta raíz /');
      assert(htmlRoot.includes('<div id="root">') || htmlRoot.includes('<!DOCTYPE html>'), 'index.html servido en ruta /');

      const resGallery = await fetch(`${GATEWAY_URL}/gallery`);
      const htmlGallery = await resGallery.text();
      assert(resGallery.status === 200, 'HTTP 200 en ruta interna /gallery (React Router)');
      assert(htmlGallery.includes('<div id="root">') || htmlGallery.includes('<!DOCTYPE html>'), 'SPA fallback entrega index.html en /gallery');
    }

    // ------------------------------------------------------------------------
    // PRUEBA 12: Límite de Tamaño de Carga (> 15 MB)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.bold}[12/12] Filtro de seguridad: Rechazo perimetral de payload > 15 MB${colors.reset}`);
    await new Promise((resolve) => {
      const oversizedBytes = 16 * 1024 * 1024; // 16 MB
      const req = http.request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/participants/register',
        method: 'POST',
        headers: {
          'Content-Length': oversizedBytes.toString(),
          'Content-Type': 'application/json',
        },
      }, (res) => {
        assert(res.statusCode === 413, 'Rechazo inmediato con HTTP 413 Payload Too Large', `Status recibido: ${res.statusCode}`);
        resolve();
      });

      req.on('error', (err) => {
        assert(false, 'Rechazo con HTTP 413', err.message);
        resolve();
      });

      req.end();
    });

  } catch (err) {
    console.error(`\n${colors.red}Error catastrófico en la ejecución de pruebas:${colors.reset}`, err);
  } finally {
    await stopGateway();
  }

  // Resumen final
  console.log(`\n${colors.bold}${colors.cyan}===================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}📊 RESUMEN FINAL DE CERTIFICACIÓN DE LA PASARELA${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}===================================================================${colors.reset}`);

  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;

  console.log(`  Total de pruebas ejecutadas: ${results.length}`);
  console.log(`  Pruebas exitosas:          ${colors.green}${passed}${colors.reset}`);
  console.log(`  Pruebas fallidas:          ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.bold}${colors.green}🎉 TODAS LAS PRUEBAS OBLIGATORIAS PASARON SATISFACTORIAMENTE.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.error(`\n${colors.bold}${colors.red}⚠️ SE DETECTARON FALLOS EN LA SUITE DE VALIDACIÓN.${colors.reset}\n`);
    process.exit(1);
  }
}

runTests();
