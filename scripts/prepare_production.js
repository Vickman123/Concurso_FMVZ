const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function prepareProduction() {
  console.log('🚀 Iniciando preparación oficial de la base de datos de producción...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Purga total de datos de prueba
    console.log('🧹 Vaciando tablas: votes, live_votes, live_reactions, voters, audit_logs, participants...');
    await client.query('TRUNCATE TABLE votes, live_votes, live_reactions, voters, audit_logs, participants RESTART IDENTITY CASCADE');

    // 2. Reset de la sesión del escenario en vivo
    console.log('🎭 Reiniciando mesa de control del escenario en vivo...');
    await client.query(`
      INSERT INTO live_stage_session (id, stage_status, current_participant_id, voting_seconds_left, total_cheers, is_active, updated_at)
      VALUES (1, 'waiting', NULL, 30, 0, false, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        stage_status = 'waiting',
        current_participant_id = NULL,
        voting_seconds_left = 30,
        total_cheers = 0,
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
    `);

    // 3. Reset de configuración del certamen
    console.log('⚙️ Reiniciando configuración del concurso a estado limpio...');
    await client.query(`
      INSERT INTO contest_settings (id, registration_limit, voting_status, results_publication_status, additional_prizes_method, is_live_active, updated_at)
      VALUES (1, 100, 'open', 'hidden', 'none', false, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        voting_status = 'open',
        results_publication_status = 'hidden',
        is_live_active = false,
        registration_limit = 100,
        updated_at = CURRENT_TIMESTAMP
    `);

    // 4. Creación de las 3 cuentas de administrador oficiales
    console.log('👥 Generando cuentas de administrador institucionales...');
    const adminsToCreate = [
      {
        name: 'Comité Directivo FMVZ',
        email: 'director.fmvz@unam.mx',
        password: 'Fmvz2026*Directivo!',
        role: 'admin',
      },
      {
        name: 'Coordinación Pasarela en Vivo',
        email: 'pasarela.fmvz@unam.mx',
        password: 'Fmvz2026*PasarelaLive!',
        role: 'admin',
      },
      {
        name: 'Jurado Calificador y Mesa de Control',
        email: 'jurado.fmvz@unam.mx',
        password: 'Fmvz2026*JuradoOficial!',
        role: 'admin',
      },
      {
        name: 'Administrador General FMVZ',
        email: 'admin@fmvz.unam.mx',
        password: 'FmvzHalloween2026!',
        role: 'admin',
      },
    ];

    for (const adm of adminsToCreate) {
      const hash = await bcrypt.hash(adm.password, 10);
      await client.query(`
        INSERT INTO admins (name, email, password_hash, role, status, created_at)
        VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = 'active'
      `, [adm.name, adm.email.toLowerCase(), hash, adm.role]);
      console.log(`✅ Administrador configurado: ${adm.email} (${adm.role})`);
    }

    // 5. Asignar ID 1 de admins para el log inicial
    const firstAdminRes = await client.query('SELECT id FROM admins WHERE email = $1', ['director.fmvz@unam.mx']);
    const adminId = firstAdminRes.rows[0]?.id || 1;

    // 6. Registro inicial en la bitácora limpia de auditoría
    console.log('📝 Creando registro de inicialización en bitácora inmutable...');
    await client.query(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, reason, metadata)
      VALUES ($1, 'SYSTEM_INIT', 'system', '1', 'Inicialización oficial y purga de datos de prueba para producción', $2)
    `, [adminId, JSON.stringify({
      status: 'production_ready',
      date: new Date().toISOString(),
      authorized_by: 'Comité Organizador FMVZ UNAM'
    })]);

    await client.query('COMMIT');
    console.log('\n🎉 ¡PRODUCCIÓN LISTA! Base de datos vaciada y administradores listos para el evento.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante la preparación de producción:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

prepareProduction();
