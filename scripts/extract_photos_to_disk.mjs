import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no definida.');
  process.exit(1);
}

const isLocalHost =
  dbUrl.includes('@localhost') ||
  dbUrl.includes('@127.0.0.1') ||
  dbUrl.includes('@db:') ||
  dbUrl.includes('@postgres:') ||
  dbUrl.includes('sslmode=disable');

const isSsl = !isLocalHost && (dbUrl.includes('supabase') || dbUrl.includes('neon') || dbUrl.includes('sslmode=require'));

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
});

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../server/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const shouldUpdateDb = process.argv.includes('--update-db') || process.env.UPDATE_DB === 'true';

async function extractPhotos() {
  console.log('==================================================================');
  console.log('📷 Extractor de Fotografías Base64 a Disco Persistente');
  console.log(`📂 Directorio destino: ${uploadDir}`);
  console.log(`📝 Actualizar base de datos: ${shouldUpdateDb ? 'SÍ (--update-db activo)' : 'NO (Solo extracción física)'}`);
  console.log('==================================================================\n');

  try {
    const res = await pool.query(`
      SELECT id, contest_number, public_display_name, photo_original_key
      FROM participants
      WHERE photo_original_key LIKE 'data:image/%'
      ORDER BY contest_number ASC
    `);

    console.log(`ℹ️  Se encontraron ${res.rowCount} participantes con imagen en formato Base64.\n`);

    if (res.rowCount === 0) {
      console.log('✅ No hay fotografías en Base64 pendientes de migrar.');
      return;
    }

    let extractedCount = 0;

    for (const row of res.rows) {
      const match = row.photo_original_key.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!match) continue;

      let ext = match[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `costume_p${String(row.contest_number).padStart(2, '0')}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      const relativeUrl = `/uploads/${filename}`;
      extractedCount++;

      console.log(`✅ [#${row.contest_number} ${row.public_display_name}] extraída a: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

      if (shouldUpdateDb) {
        await pool.query(
          'UPDATE participants SET photo_original_key = $1, photo_thumbnail_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [relativeUrl, row.id]
        );
      }
    }

    console.log('\n==================================================================');
    console.log(`🎉 Extracción finalizada: ${extractedCount} fotografías guardadas en disco.`);
    if (!shouldUpdateDb) {
      console.log('💡 Tip: Para actualizar las URLs en la BD ejecuta: node scripts/extract_photos_to_disk.mjs --update-db');
    } else {
      console.log('✅ Registros en base de datos actualizados a rutas relativas /uploads/...');
    }
    console.log('==================================================================');

  } catch (err) {
    console.error('❌ Error durante la extracción:', err);
  } finally {
    await pool.end();
  }
}

extractPhotos();
