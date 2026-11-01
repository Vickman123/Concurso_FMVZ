# 🎃 Concurso FMVZ — Documento 17: Protocolo de Validación de Datos y Consistencia

**Fecha:** 31 de Octubre de 2026  
**Herramienta de Verificación:** `scripts/verify_db_integrity.sh` y `scripts/verify_db_integrity.mjs`

---

## 1. Reglas de Validación de Integridad de Datos

Para certificar que la base de datos de OVHcloud es idéntica y consistente con los datos de origen:

### 1.1 Verificación de las 10 Tablas Obligatorias
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
*Esperado:* `admins`, `audit_logs`, `contest_settings`, `live_reactions`, `live_stage_session`, `live_votes`, `participants`, `prize_categories`, `voters`, `votes`.

### 1.2 Detección de Votos Huérfanos (Anti-Join)
Un voto es considerado inválido o huérfano si apunta a un `voter_id` inexistente o a un `participant_id` eliminado:

```sql
SELECT v.id AS orphan_vote_id, v.voter_id, v.participant_id
FROM votes v
LEFT JOIN voters vt ON v.voter_id = vt.id
LEFT JOIN participants p ON v.participant_id = p.id
WHERE vt.id IS NULL OR p.id IS NULL;
```
*Criterio de Aceptación Estricto:* **Exactamente 0 registros retornados.**

### 1.3 Validación de Restricción 1 a 1 de Votantes
```sql
SELECT voter_id, count(*) 
FROM votes 
GROUP BY voter_id 
HAVING count(*) > 1;
```
*Criterio de Aceptación Estricto:* **Exactamente 0 registros retornados.**

---

## 2. Validación de Archivos Físicos de Fotografías

Cada registro en la tabla `participants` que posea una URL de tipo `/uploads/nombre_archivo.jpg` debe tener un archivo correspondiente en el sistema de archivos:

```bash
node -e '
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkPhotos() {
  const { rows } = await pool.query("SELECT id, contest_number, photo_url FROM participants WHERE photo_url LIKE \x27/uploads/%\x27");
  let missing = 0;
  for (const r of rows) {
    const filePath = path.resolve("./server", "." + r.photo_url);
    if (!fs.existsSync(filePath)) {
      console.error(`Foto faltante para participante #${r.contest_number}: ${filePath}`);
      missing++;
    }
  }
  console.log(`Verificación terminada: ${rows.length} fotos comprobadas, ${missing} faltantes.`);
  await pool.end();
}
checkPhotos();
'
```
