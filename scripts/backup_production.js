const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const photosDir = path.join(backupDir, `photos_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Iniciando respaldo integral del sistema FMVZ [${timestamp}]...`);
  const client = await pool.connect();

  try {
    // 1. Extraer datos de todas las tablas principales secuencialmente
    const participantsRes = await client.query('SELECT * FROM participants ORDER BY contest_number ASC');
    const votesRes = await client.query('SELECT * FROM votes ORDER BY created_at ASC');
    const liveVotesRes = await client.query('SELECT * FROM live_votes ORDER BY created_at ASC');
    const votersRes = await client.query('SELECT * FROM voters ORDER BY created_at ASC');
    const auditRes = await client.query('SELECT * FROM audit_logs ORDER BY timestamp ASC');
    const settingsRes = await client.query('SELECT * FROM contest_settings WHERE id = 1');

    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        institution: 'Facultad de Medicina Veterinaria y Zootecnia (FMVZ - UNAM)',
        event: 'Segundo Concurso de Disfraces de Halloween',
        total_participants: participantsRes.rowCount,
        total_votes: votesRes.rowCount,
        total_live_votes: liveVotesRes.rowCount,
        total_voters: votersRes.rowCount,
        total_audit_logs: auditRes.rowCount,
      },
      contest_settings: settingsRes.rows[0] || {},
      participants: participantsRes.rows,
      votes: votesRes.rows,
      live_votes: liveVotesRes.rows,
      voters: votersRes.rows,
      audit_logs: auditRes.rows,
    };

    // 2. Guardar JSON maestro con todos los datos e imágenes en Base64
    const jsonPath = path.join(backupDir, `backup_FMVZ_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`✅ Respaldo JSON maestro generado: ${jsonPath}`);

    // 3. Extraer fotografías a archivos de imagen individuales (.jpg/.png)
    if (participantsRes.rowCount > 0) {
      if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
      }
      let extractedPhotosCount = 0;

      for (const p of participantsRes.rows) {
        if (p.photo_original_key && p.photo_original_key.startsWith('data:image/')) {
          const match = p.photo_original_key.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const base64Data = match[2];
            const sanitizedTitle = (p.costume_title || 'disfraz').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            const filename = `part_${String(p.contest_number).padStart(2, '0')}_${sanitizedTitle}.${ext}`;
            fs.writeFileSync(path.join(photosDir, filename), Buffer.from(base64Data, 'base64'));
            extractedPhotosCount++;
          }
        }
      }
      console.log(`📸 Se extrajeron ${extractedPhotosCount} fotografías originales a: ${photosDir}`);
    }

    // 4. Crear resumen rápido de respaldo
    console.log('\n📊 RESUMEN DEL RESPALDO:');
    console.log(`   - Participantes inscritos: ${backupData.metadata.total_participants}`);
    console.log(`   - Votos web tradicionales: ${backupData.metadata.total_votes}`);
    console.log(`   - Votos en vivo auditorio: ${backupData.metadata.total_live_votes}`);
    console.log(`   - Votantes identificados:   ${backupData.metadata.total_voters}`);
    console.log(`   - Registros de auditoría:  ${backupData.metadata.total_audit_logs}`);
    console.log(`\n💾 Archivo listo para sincronizar con Google Drive o respaldar en memoria externa.`);

    return { success: true, jsonPath, timestamp, metadata: backupData.metadata };
  } catch (err) {
    console.error('❌ Error al realizar el respaldo:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runBackup();
}

module.exports = { runBackup };
