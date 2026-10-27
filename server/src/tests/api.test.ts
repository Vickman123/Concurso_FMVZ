import assert from 'node:assert';
import test, { describe } from 'node:test';
import app from '../index';
import { runSeed } from '../db/seed';
import { closeDb } from '../db/connection';

let server: any;
const baseUrl = 'http://localhost:4003';

describe('FMVZ Halloween Backend API Test Suite', () => {
  test.before(async () => {
    // Seed DB first
    await runSeed();
    await new Promise<void>((resolve) => {
      server = app.listen(4003, () => {
        resolve();
      });
    });
  });

  test.after(async () => {
    if (server) server.close();
    await closeDb();
  });

  test('1. GET /api/contest/settings returns valid contest config', async () => {
    const res = await fetch(`${baseUrl}/api/contest/settings`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.contest_name, 'Segundo Concurso de Disfraces FMVZ');
    assert.strictEqual(data.registration_limit, 100);
    assert.strictEqual(data.total_registered >= 57, true);
  });

  test('2. GET /api/participants returns approved participants only and not private IDs', async () => {
    const res = await fetch(`${baseUrl}/api/participants`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.participants.length > 50, true);
    // Verify no participant leaks institutional_identifier or full_name
    const first = data.participants[0];
    assert.strictEqual(first.institutional_identifier, undefined);
    assert.strictEqual(first.full_name, undefined);
    assert.strictEqual(typeof first.public_display_name, 'string');
    assert.strictEqual(typeof first.contest_number, 'number');
  });

  test('3. GET /api/participants/:number returns specific detail', async () => {
    const res = await fetch(`${baseUrl}/api/participants/1`);
    assert.strictEqual(res.status, 200);
    const data: any = await res.json();
    assert.strictEqual(data.participant.contest_number, 1);
    assert.strictEqual(data.participant.costume_title, 'Catrina Universitaria');
  });

  test('4. POST /api/vote/identify validates 9 digits for student and 6 for worker', async () => {
    // Invalid student ID (too short)
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

    // Valid student ID
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

  test('5. POST /api/vote/cast casts a vote and strictly prevents duplicate voting', async () => {
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
    assert.strictEqual(res1.status, 201);
    const data1: any = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.match(data1.confirmation_folio, /^FMVZ-VOTO-2026-/);

    // Second vote with same student ID: MUST FAIL with 409 Conflict
    const res2 = await fetch(`${baseUrl}/api/vote/cast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...voterPayload,
        participant_number: 2 // Even trying to vote for a different participant
      })
    });
    assert.strictEqual(res2.status, 409);
    const data2: any = await res2.json();
    assert.match(data2.error, /ya cuenta con un voto registrado/);
  });

  test('6. POST /api/admin/login and protected routes verification', async () => {
    // Bad login
    const resBad = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fmvz.unam.mx', password: 'WrongPassword' })
    });
    assert.strictEqual(resBad.status, 401);

    // Good login
    const resGood = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fmvz.unam.mx', password: 'Halloween2026!' })
    });
    assert.strictEqual(resGood.status, 200);
    const dataGood: any = await resGood.json();
    assert.ok(dataGood.token);
    assert.strictEqual(dataGood.admin.role, 'admin');

    // Access protected dashboard stats
    const resStats = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${dataGood.token}` }
    });
    assert.strictEqual(resStats.status, 200);
    const dataStats: any = await resStats.json();
    assert.strictEqual(dataStats.total_participants >= 57, true);
    assert.strictEqual(dataStats.total_votes >= 1, true);
  });
});
