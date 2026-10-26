/**
 * FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
 * Concurrency & High Load Benchmark Script (100, 250, 500 concurrent virtual users)
 */

import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4000';

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve) => {
    const start = performance.now();
    const parsed = new URL(url);

    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: new http.Agent({ keepAlive: true, maxSockets: 600 }),
    };

    if (postData) {
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          status: res.statusCode,
          duration,
          data,
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        status: 0,
        duration,
        error: err.message,
        success: false,
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  return {
    min: sorted[0].toFixed(2),
    avg: (sum / sorted.length).toFixed(2),
    p50: sorted[Math.floor(sorted.length * 0.50)].toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
    p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2),
    max: sorted[sorted.length - 1].toFixed(2),
  };
}

async function runConcurrentBatch(name, concurrency, totalRequests, requestGenerator) {
  console.log(`\n======================================================`);
  console.log(`🔥 Invocando Prueba de Carga: [${name}]`);
  console.log(`   Usuarios concurrentes: ${concurrency} | Total solicitudes: ${totalRequests}`);
  console.log(`======================================================`);

  const startTime = performance.now();
  const results = [];
  let inFlight = 0;
  let currentIndex = 0;

  await new Promise((resolve) => {
    function launchNext() {
      if (currentIndex >= totalRequests && inFlight === 0) {
        resolve();
        return;
      }

      while (inFlight < concurrency && currentIndex < totalRequests) {
        const reqIdx = currentIndex++;
        inFlight++;
        const { url, options, postData } = requestGenerator(reqIdx);

        makeRequest(url, options, postData).then((res) => {
          results.push(res);
          inFlight--;
          launchNext();
        });
      }
    }

    launchNext();
  });

  const totalTimeSec = (performance.now() - startTime) / 1000;
  const latencies = results.map(r => r.duration);
  const stats = calculatePercentiles(latencies);
  const successes = results.filter(r => r.success).length;
  const errors = results.length - successes;
  const rps = (results.length / totalTimeSec).toFixed(2);

  console.log(`⏱️  Tiempo total: ${totalTimeSec.toFixed(2)}s`);
  console.log(`⚡ Rendimiento: ${rps} req/segundo`);
  console.log(`✅ Solicitudes exitosas: ${successes} (${((successes / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📊 Latencias: Min=${stats.min}ms | p50=${stats.p50}ms | p95=${stats.p95}ms | p99=${stats.p99}ms | Max=${stats.max}ms`);

  return {
    name,
    concurrency,
    totalRequests,
    totalTimeSec: totalTimeSec.toFixed(2),
    rps,
    successes,
    errors,
    stats,
  };
}

async function runAllLoadTests() {
  console.log(`🎃 FMVZ HALLOWEEN — Invocando Suite de Pruebas de Carga y Concurrencia`);
  console.log(`Objetivo institucional: 500 usuarios simultáneos en alta concurrencia.`);

  const summary = [];

  // 1. Tier 1: 100 concurrent users reading gallery
  const t1 = await runConcurrentBatch('Galería y Catálogo (100 VU)', 100, 300, (i) => ({
    url: `${BASE_URL}/api/participants?page=1&limit=20&type=${i % 2 === 0 ? 'student' : 'worker'}`,
  }));
  summary.push(t1);

  // 2. Tier 2: 250 concurrent users reading gallery + settings
  const t2 = await runConcurrentBatch('Galería y Configuración (250 VU)', 250, 500, (i) => ({
    url: i % 3 === 0 ? `${BASE_URL}/api/contest/settings` : `${BASE_URL}/api/participants?search=${encodeURIComponent('catrina')}`,
  }));
  summary.push(t2);

  // 3. Tier 3: 500 concurrent users (Full Target Concurrency)
  const t3 = await runConcurrentBatch('Alta Concurrencia de Galería (500 VU)', 500, 1000, (i) => ({
    url: `${BASE_URL}/api/participants`,
  }));
  summary.push(t3);

  // 4. Simultaneous Race Condition Test: 50 simultaneous votes for the EXACT same ID at the same instant
  console.log(`\n======================================================`);
  console.log(`🛡️  Prueba de Integridad: Detección de Condiciones de Carrera (Race Conditions)`);
  console.log(`   50 solicitudes concurrentes intentando votar con la MISMA identidad simultáneamente`);
  console.log(`======================================================`);

  const raceStudentId = '318000999';
  const racePromises = Array.from({ length: 50 }).map(() =>
    makeRequest(`${BASE_URL}/api/vote/cast`, { method: 'POST' }, JSON.stringify({
      full_name: 'Votante Carrera Concurrente',
      voter_type: 'student',
      institutional_identifier: raceStudentId,
      participant_number: 1,
    }))
  );

  const raceResults = await Promise.all(racePromises);
  const raceSuccesses = raceResults.filter(r => r.status === 201).length;
  const raceConflicts = raceResults.filter(r => r.status === 409).length;

  console.log(`Resultados de Carrera:`);
  console.log(`- Votos permitidos y registrados: ${raceSuccesses} (DEBE SER EXACTAMENTE 1)`);
  console.log(`- Votos rechazados por duplicidad (409 Conflict): ${raceConflicts} (DEBE SER EXACTAMENTE 49)`);

  if (raceSuccesses === 1 && raceConflicts === 49) {
    console.log(`🎯 PRUEBA SUPERADA: Integridad transaccional 100% garantizada. Cero votos duplicados.`);
  } else {
    console.error(`🚨 FALLO DE INTEGRIDAD: Se permitieron ${raceSuccesses} votos para la misma identidad!`);
  }

  // 5. Concurrent unique votes: 200 distinct users casting votes simultaneously
  console.log(`\n======================================================`);
  console.log(`🗳️  Prueba de Votación Masiva: 200 identidades únicas emitiendo votos simultáneamente`);
  console.log(`======================================================`);

  const voteBatch = await runConcurrentBatch('Votación Masiva Concurrente (100 VU)', 100, 200, (i) => ({
    url: `${BASE_URL}/api/vote/cast`,
    options: { method: 'POST' },
    postData: JSON.stringify({
      full_name: `Estudiante Concurrente ${i}`,
      voter_type: 'student',
      institutional_identifier: String(320000000 + i),
      participant_number: (i % 55) + 1,
    }),
  }));
  summary.push(voteBatch);

  console.log(`\n======================================================`);
  console.log(`📋 RESUMEN GENERAL DE PRUEBAS DE CARGA`);
  console.log(`======================================================`);
  console.table(summary.map(s => ({
    Escenario: s.name,
    Concurrencia: s.concurrency,
    Total_Req: s.totalRequests,
    RPS: s.rps,
    p50_ms: s.stats.p50,
    p95_ms: s.stats.p95,
    p99_ms: s.stats.p99,
    Tasa_Exito: `${((s.successes / s.totalRequests) * 100).toFixed(1)}%`
  })));
}

runAllLoadTests().catch(err => {
  console.error('Error durante pruebas de carga:', err);
});
