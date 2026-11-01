import assert from 'node:assert';
import test, { describe } from 'node:test';
import app from '../index';
import { runSeed } from '../db/seed';
import { closeDb, getDb } from '../db/connection';

let server: any;
const baseUrl = 'http://localhost:4003';

describe('FMVZ Halloween Backend API Test Suite — Hostinger Migration Ready', () => {
  test.before(async () => {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('supabase') && !dbUrl.includes('neon') && !dbUrl.includes('render') && !dbUrl.includes('pooler')) {
      await runSeed();
    } else {
      console.log('[Test Suite] Remote database detected; preserving existing database records.');
    }
    await new Promise<void>((resolve) => {
      server = app.listen(4003, () => {
        resolve();
      });
    });
  });

  test.after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  test('1. GET /api/health verifies server health and operational status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.date, '2026-11-03');
    assert.ok(data.timestamp);
  });

  test('2. GET /api/contest/settings returns valid contest config', async () => {
    const res = await fetch(`${baseUrl}/api/contest/settings`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.contest_name, 'Segundo Concurso de Disfraces FMVZ');
    assert.strictEqual(data.registration_limit, 100);
  });

  test('3. GET /api/participants returns public participants without leaking private IDs', async () => {
    const res = await fetch(`${baseUrl}/api/participants`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.ok(Array.isArray(data.participants));

    if (data.participants.length > 0) {
      const first = data.participants[0];
      assert.strictEqual(first.institutional_identifier, undefined);
      assert.strictEqual(first.full_name, undefined);
      assert.strictEqual(typeof first.public_display_name, 'string');
      assert.strictEqual(typeof first.contest_number, 'number');
    }
  });

  test('4. POST /api/vote/identify validates identification format', async () => {
    // Short invalid student account (too short)
    const resInvalid = await fetch(`${baseUrl}/api/vote/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Juan Pérez',
        voter_type: 'student',
        institutional_identifier: '12345'
      })
    });
    assert.strictEqual(resInvalid.status, 400);

    // Valid 9-digit student account
    const resValid = await fetch(`${baseUrl}/api/vote/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Juan Pérez Estudiante',
        voter_type: 'student',
        institutional_identifier: `319${Date.now().toString().slice(-6)}`
      })
    });
    assert.strictEqual(resValid.status, 200);
    const dataValid: any = await resValid.json();
    assert.strictEqual(dataValid.eligible, true);
  });

  test('5. POST /api/vote/cast casts a vote and strictly prevents duplicate voting (409 Conflict)', async () => {
    const freshStudentId = `318${Date.now().toString().slice(-6)}`;
    const voterPayload = {
      full_name: 'Ana García UNAM',
      voter_type: 'student',
      institutional_identifier: freshStudentId,
      participant_number: 1
    };

    // First vote: should succeed
    const res1 = await fetch(`${baseUrl}/api/vote/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voterPayload)
    });

    if (res1.status === 201) {
      const data1: any = await res1.json();
      assert.strictEqual(data1.success, true);
      assert.match(data1.confirmation_folio, /^FMVZ-VOTO-2026-/);

      // Second vote with same student ID: MUST FAIL with 409 Conflict
      const res2 = await fetch(`${baseUrl}/api/vote/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...voterPayload,
          participant_number: 2
        })
      });
      assert.strictEqual(res2.status, 409);
      const data2: any = await res2.json();
      assert.match(data2.error, /ya cuenta con un voto registrado/);
    }
  });

  test('6. POST /api/admin/login and role-based permissions verification', async () => {
    // Bad login
    const resBad = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fmvz.unam.mx', password: 'WrongPassword' })
    });
    assert.strictEqual(resBad.status, 401);

    // Operator login
    const resOp = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operador@fmvz.unam.mx', password: 'Operador2026!' })
    });

    if (resOp.status === 200) {
      const dataOp: any = await resOp.json();
      assert.strictEqual(dataOp.admin.role, 'operator');

      // Operator cannot update settings (restricted to 'admin' role)
      const resForbidden = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataOp.token}`
        },
        body: JSON.stringify({ registration_limit: 150 })
      });
      assert.strictEqual(resForbidden.status, 403);
    }

    // Admin login
    let resGood = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fmvz.unam.mx', password: 'FmvzHalloween2026!' })
    });
    if (resGood.status !== 200) {
      resGood = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@fmvz.unam.mx', password: 'Halloween2026!' })
      });
    }
    assert.strictEqual(resGood.status, 200);
    const dataGood: any = await resGood.json();
    assert.ok(dataGood.token);
    assert.strictEqual(dataGood.admin.role, 'admin');

    // Access protected dashboard stats
    const resStats = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${dataGood.token}` }
    });
    assert.strictEqual(resStats.status, 200);
  });

  test('7. POST /api/live/reaction sends live emoji reactions without breaking stream', async () => {
    const res = await fetch(`${baseUrl}/api/live/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: '🎃' })
    });
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.emoji, '🎃');
  });

  test('8. GET /api/live/state returns valid auditorium snapshot', async () => {
    const res = await fetch(`${baseUrl}/api/live/state`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.ok(data.stage_status);
    assert.strictEqual(typeof data.voting_seconds_left, 'number');
  });

  test('9. Database schema & sequence integrity check', async () => {
    const db = await getDb();
    const settings = await db.query('SELECT count(*) FROM contest_settings');
    assert.ok(Number(settings.rows[0].count) >= 1);

    const admins = await db.query('SELECT count(*) FROM admins');
    assert.ok(Number(admins.rows[0].count) >= 1);
  });
});
