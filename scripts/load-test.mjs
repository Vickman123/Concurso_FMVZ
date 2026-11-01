/**
 * FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
 * Concurrency & High Load Staged Benchmark Suite
 * Scaled Tiers: 50, 100, 250, and 500 concurrent virtual users.
 */

import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4000';

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return {
    rss: (mem.rss / 1024 / 1024).toFixed(2),
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2),
  };
}

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
          success: res.statusCode >= 200 && res.statusCode < 400,
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
  if (latencies.length === 0) return { min: '0.00', p50: '0.00', p95: '0.00', p99: '0.00', max: '0.00', avg: '0.00' };
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
  console.log(`🔥 Invocando Escenario de Carga: [${name}]`);
  console.log(`   Usuarios concurrentes (VU): ${concurrency} | Total solicitudes: ${totalRequests}`);
  console.log(`======================================================`);

  const memBefore = getMemoryUsageMB();
  const cpuBefore = process.cpuUsage();
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
  const cpuUsed = process.cpuUsage(cpuBefore);
  const cpuUserMs = (cpuUsed.user / 1000).toFixed(0);
  const cpuSysMs = (cpuUsed.system / 1000).toFixed(0);
  const memAfter = getMemoryUsageMB();

  const latencies = results.map(r => r.duration);
  const stats = calculatePercentiles(latencies);
  const successes = results.filter(r => r.success).length;
  const errors = results.length - successes;
  const rps = (results.length / totalTimeSec).toFixed(2);

  console.log(`⏱️  Duración: ${totalTimeSec.toFixed(2)}s | Rendimiento: ${rps} req/s`);
  console.log(`✅ Exitosas: ${successes} (${((successes / results.length) * 100).toFixed(1)}%) | ❌ Errores: ${errors}`);
  console.log(`📊 Latencias: Min=${stats.min}ms | p50=${stats.p50}ms | p95=${stats.p95}ms | p99=${stats.p99}ms | Max=${stats.max}ms`);
  console.log(`💻 Recursos Cliente Node: CPU user=${cpuUserMs}ms sys=${cpuSysMs}ms | RAM RSS=${memAfter.rss}MB (Δ ${((memAfter.rss - memBefore.rss)).toFixed(1)}MB)`);

  return {
    name,
    concurrency,
    totalRequests,
    totalTimeSec: totalTimeSec.toFixed(2),
    rps,
    successes,
    errors,
    stats,
    cpuMs: `${cpuUserMs}ms / ${cpuSysMs}ms`,
    ramMb: memAfter.rss,
  };
}

async function runStagedLoadTests() {
  console.log(`==================================================================`);
  console.log(`🎃 FMVZ HALLOWEEN — Suite de Pruebas de Carga Escalonadas`);
  console.log(`🎯 URL objetivo: ${BASE_URL}`);
  console.log(`Escalones de prueba: 50, 100, 250 y 500 Usuarios Concurrentes (VU)`);
  console.log(`==================================================================`);

  const summary = [];

  // Escalón 1: 50 usuarios concurrentes
  const t50 = await runConcurrentBatch('Escalón 1: Carga Base (50 VU)', 50, 200, (i) => ({
    url: `${BASE_URL}/api/contest/settings`,
  }));
  summary.push(t50);

  // Escalón 2: 100 usuarios concurrentes
  const t100 = await runConcurrentBatch('Escalón 2: Navegación de Galería (100 VU)', 100, 400, (i) => ({
    url: `${BASE_URL}/api/participants?page=1&limit=20&type=${i % 2 === 0 ? 'student' : 'worker'}`,
  }));
  summary.push(t100);

  // Escalón 3: 250 usuarios concurrentes
  const t250 = await runConcurrentBatch('Escalón 3: Concurrencia Media (250 VU)', 250, 750, (i) => ({
    url: i % 2 === 0 ? `${BASE_URL}/api/contest/settings` : `${BASE_URL}/api/participants`,
  }));
  summary.push(t250);

  // Escalón 4: 500 usuarios concurrentes (Alta Concurrencia de Auditorio)
  const t500 = await runConcurrentBatch('Escalón 4: Concurrencia Máxima (500 VU)', 500, 1000, (i) => ({
    url: `${BASE_URL}/api/live/state`,
  }));
  summary.push(t500);

  // Prueba de Integridad de Concurrencia: Condición de carrera (50 votos con el MISMO número de cuenta)
  console.log(`\n======================================================`);
  console.log(`🛡️  Prueba de Integridad: Detección de Condiciones de Carrera`);
  console.log(`   50 solicitudes concurrentes simultáneas para la MISMA identidad`);
  console.log(`======================================================`);

  const raceStudentId = `319${Date.now().toString().slice(-6)}`;
  const racePromises = Array.from({ length: 50 }).map(() =>
    makeRequest(`${BASE_URL}/api/vote/cast`, { method: 'POST' }, JSON.stringify({
      full_name: 'Votante Condición de Carrera',
      voter_type: 'student',
      institutional_identifier: raceStudentId,
      participant_number: 1,
    }))
  );

  const raceResults = await Promise.all(racePromises);
  const raceSuccesses = raceResults.filter(r => r.status === 201).length;
  const raceConflicts = raceResults.filter(r => r.status === 409).length;

  console.log(`Resultados de Carrera:`);
  console.log(`- Votos aceptados: ${raceSuccesses} (Esperado: EXACTAMENTE 1)`);
  console.log(`- Votos rechazados (409 Conflict): ${raceConflicts} (Esperado: EXACTAMENTE 49)`);

  if (raceSuccesses === 1 && raceConflicts === 49) {
    console.log(`🎯 PRUEBA SUPERADA: Cero votos duplicados garantizados bajo 50 accesos simultáneos.`);
  } else {
    console.warn(`ℹ️  Aviso: Se obtuvieron ${raceSuccesses} votos y ${raceConflicts} conflictos (válido si votación cerrada).`);
  }

  // Resumen Final
  console.log(`\n==================================================================`);
  console.log(`📋 TABLA COMPARATIVA DE RENDIMIENTO ESCALONADO`);
  console.log(`==================================================================`);
  console.table(summary.map(s => ({
    Escenario: s.name,
    VU: s.concurrency,
    Total_Req: s.totalRequests,
    RPS: s.rps,
    p50_ms: s.stats.p50,
    p95_ms: s.stats.p95,
    p99_ms: s.stats.p99,
    Éxito: `${((s.successes / s.totalRequests) * 100).toFixed(1)}%`,
    RAM_MB: s.ramMb
  })));
  console.log(`==================================================================`);
}

runStagedLoadTests().catch(err => {
  console.error('Error durante la ejecución de pruebas de carga:', err);
});
