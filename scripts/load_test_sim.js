/**
 * Script de prueba de carga y concurrencia (Benchmark / Stress Test)
 * Simula N votantes simultáneos votando por el participante en escenario.
 *
 * Uso:
 *   node scripts/load_test_sim.js [TARGET_URL] [NUM_VOTANTES]
 * Ejemplo:
 *   node scripts/load_test_sim.js http://localhost:4000 50
 *   node scripts/load_test_sim.js https://concurso-fmvz.onrender.com 100
 */

const targetUrl = process.argv[2] || 'http://localhost:4000';
const numVoters = parseInt(process.argv[3] || '50', 10);

console.log(`\n==============================================`);
console.log(`🎃 INICIANDO TEST DE RENDIMIENTO EN VIVO`);
console.log(`🎯 URL Destino: ${targetUrl}`);
console.log(`👥 Votantes Simulados: ${numVoters}`);
console.log(`==============================================\n`);

async function run() {
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  let latencies = [];

  const promises = [];

  for (let i = 1; i <= numVoters; i++) {
    const voterId = `318${String(i).padStart(6, '0')}`;
    const voteChoice = i % 4 === 0 ? 'no' : 'yes'; // 75% vota sí, 25% pasa
    const reqStart = Date.now();

    const p = fetch(`${targetUrl}/api/live/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter_type: 'student',
        institutional_identifier: voterId,
        full_name: `Alumno Prueba #${i}`,
        vote: voteChoice,
      }),
    })
      .then(async (res) => {
        const latency = Date.now() - reqStart;
        latencies.push(latency);
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
          const err = await res.text();
          console.error(`[Error Votante ${i}]: HTTP ${res.status} - ${err.slice(0, 80)}`);
        }
      })
      .catch((err) => {
        errorCount++;
        console.error(`[Network Error Votante ${i}]: ${err.message}`);
      });

    promises.push(p);

    // Stagger slightly over a realistic window
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  await Promise.all(promises);

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(1);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const rps = (numVoters / totalTimeSec).toFixed(1);

  console.log(`\n📊 RESULTADOS DE LA PRUEBA:`);
  console.log(`----------------------------------------------`);
  console.log(`✅ Votos exitosos: ${successCount} / ${numVoters} (${((successCount / numVoters) * 100).toFixed(1)}%)`);
  console.log(`❌ Errores / Caídas: ${errorCount}`);
  console.log(`⏱️ Tiempo total de ráfaga: ${totalTimeSec} segundos`);
  console.log(`🚀 Rendimiento: ${rps} peticiones por segundo`);
  console.log(`⚡ Latencia promedio: ${avgLatency} ms`);
  console.log(`⚡ Latencia mínima: ${minLatency} ms | máxima: ${maxLatency} ms`);
  console.log(`==============================================\n`);
}

run();
