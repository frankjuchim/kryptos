'use strict';
// Gemeinsame Test-Helfer (node:test + supertest).
process.env.AQL_SCRYPT_N = process.env.AQL_SCRYPT_N || '1024'; // schnelleres Hashing nur in Tests

const path = require('node:path');
const request = require('supertest');
const { createApp } = require('../src/app');

const ADMIN_EMAIL = 'admin';
const ADMIN_PW = 'admin-passwort-123';
const HOST = 'lab.test';
const ORIGIN = 'http://' + HOST;
const FIXTURE = path.join(__dirname, 'fixtures', 'welt_beispiel.json');

/** Steuerbare Uhr für Timer-Tests. */
function uhr(start = Date.parse('2026-10-08T08:00:00Z')) {
  let t = start;
  const f = () => t;
  f.vor = (ms) => {
    t += ms;
    return t;
  };
  f.setze = (x) => {
    t = x;
  };
  return f;
}

function makeApp(extra = {}) {
  return createApp({
    dbFile: ':memory:',
    sessionSecret: 'test-secret-0123456789abcdef',
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PW,
    seedDir: null,
    weltDateien: [FIXTURE],
    trustProxy: false,
    ...extra
  });
}

/** supertest-Agent mit Cookie-Speicher und gleicher Herkunft (Origin = Host). */
function client(app) {
  const agent = request.agent(app);
  agent.set('Host', HOST).set('Origin', ORIGIN);
  return agent;
}

async function adminClient(app) {
  const c = client(app);
  const r = await c.post('/api/lehrer/anmelden').send({ email: ADMIN_EMAIL, passwort: ADMIN_PW });
  if (r.status !== 200) throw new Error('Admin-Login fehlgeschlagen: ' + r.status + ' ' + JSON.stringify(r.body));
  return c;
}

/** Lehrkraft registrieren, vom Superadmin freigeben lassen und anmelden. */
async function lehrkraftClient(app, admin, email = 'lena.lehrer@schule.de', pw = 'lehrkraft-pw-123') {
  const c = client(app);
  const r = await c.post('/api/lehrer/registrieren').send({ name: 'Frau Lehrer', email, schule: 'MPG', passwort: pw, nachricht: 'Hallo' });
  if (r.status !== 201) throw new Error('Registrierung fehlgeschlagen: ' + JSON.stringify(r.body));
  const liste = (await admin.get('/api/admin/lehrkraefte')).body;
  const lk = liste.find((x) => x.email === email);
  const f = await admin.post(`/api/admin/lehrkraefte/${lk.id}/status`).send({ status: 'aktiv' });
  if (f.status !== 200) throw new Error('Freigabe fehlgeschlagen: ' + JSON.stringify(f.body));
  const l = await c.post('/api/lehrer/anmelden').send({ email, passwort: pw });
  if (l.status !== 200) throw new Error('Login fehlgeschlagen: ' + JSON.stringify(l.body));
  c.lkId = lk.id;
  return c;
}

async function kursAnlegen(lk, name = 'LK Informatik 13') {
  const r = await lk.post('/api/lehrer/kurse').send({ name });
  if (r.status !== 201) throw new Error('Kurs anlegen fehlgeschlagen: ' + JSON.stringify(r.body));
  return r.body;
}

async function schuelerClient(app, kurscode, name = 'Lena S.') {
  const c = client(app);
  const r = await c.post('/api/schueler/beitreten').send({ kurscode, name });
  if (r.status !== 201) throw new Error('Beitritt fehlgeschlagen: ' + r.status + ' ' + JSON.stringify(r.body));
  c.code = r.body.code;
  c.name = r.body.name;
  return c;
}

/** Komplett: App + Admin + Lehrkraft + Kurs + Schüler. */
async function szenario(extra = {}) {
  const app = makeApp(extra);
  const admin = await adminClient(app);
  const lk = await lehrkraftClient(app, admin);
  const kurs = await kursAnlegen(lk);
  const s = await schuelerClient(app, kurs.code);
  return { app, admin, lk, kurs, s };
}

module.exports = { makeApp, client, adminClient, lehrkraftClient, kursAnlegen, schuelerClient, szenario, uhr, ADMIN_EMAIL, ADMIN_PW, HOST, ORIGIN, FIXTURE };
