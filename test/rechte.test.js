'use strict';
// Rechte und Kurs-Isolation, CSRF-Schutz, Freigabe-Workflow, Einmal-Passwort, Superadmin aus ENV.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

test('Kurs-Isolation: Lehrkraft A sieht und ändert Kurse von B nicht (404)', async () => {
  const app = H.makeApp();
  const admin = await H.adminClient(app);
  const a = await H.lehrkraftClient(app, admin, 'a@schule.de');
  const b = await H.lehrkraftClient(app, admin, 'b@schule.de');
  const kb = await H.kursAnlegen(b, 'Kurs von B');
  await H.schuelerClient(app, kb.code, 'Bea B.');
  const base = `/api/lehrer/kurse/${kb.id}`;
  assert.deepEqual((await a.get('/api/lehrer/kurse')).body, []);
  for (const [m, url, body] of [
    ['get', base],
    ['patch', base, { name: 'gekapert' }],
    ['delete', base, { bestaetigung: 'Kurs von B' }],
    ['get', base + '/schueler'],
    ['get', base + '/auswertung'],
    ['get', base + '/scoreboard'],
    ['get', base + '/export.csv'],
    ['get', base + '/qr.svg'],
    ['post', base + '/alle-schueler-loeschen', { bestaetigung: 'Kurs von B' }]
  ]) {
    const r = await a[m](url).send(body);
    assert.equal(r.status, 404, `${m} ${url}`);
  }
  const sid = (await b.get(base + '/schueler')).body[0].id;
  assert.equal((await a.delete(`${base}/schueler/${sid}`)).status, 404);
  assert.equal((await a.post(`${base}/schueler/${sid}/neuer-code`).send({})).status, 404);
  assert.equal((await a.patch(`${base}/schueler/${sid}`).send({ name: 'X Y' })).status, 404);
  // B selbst darf
  assert.equal((await b.get(base)).body.name, 'Kurs von B');
  // Superadmin sieht alles
  const alle = (await admin.get('/api/lehrer/kurse')).body;
  assert.equal(alle.length, 1);
  assert.equal(alle[0].lehrkraft, 'Frau Lehrer');
  assert.equal((await admin.get(base + '/schueler')).status, 200);
});

test('Rollen: Schüler → Lehrer-API 401, Lehrkraft → Admin-API 403', async () => {
  const { s, lk } = await H.szenario();
  assert.equal((await s.get('/api/lehrer/kurse')).status, 401);
  assert.equal((await s.get('/api/admin/lehrkraefte')).status, 401);
  assert.equal((await lk.get('/api/admin/lehrkraefte')).status, 403);
  assert.equal((await lk.get('/api/admin/backup')).status, 403);
  assert.equal((await lk.post('/api/admin/katas/import').send({ version: 1, karten: [] })).status, 403);
  // Lehrkraft ist kein Schüler
  assert.equal((await lk.get('/api/welten')).status, 401);
});

test('CSRF: schreibende Anfragen nur mit passender Herkunft und als JSON', async () => {
  const { app, kurs } = await H.szenario();
  const ohne = await request(app).post('/api/schueler/beitreten').set('Host', H.HOST).send({ kurscode: kurs.code, name: 'Eve E.' });
  assert.equal(ohne.status, 403);
  const fremd = await request(app).post('/api/schueler/beitreten').set('Host', H.HOST).set('Origin', 'http://boese.example').send({ kurscode: kurs.code, name: 'Eve E.' });
  assert.equal(fremd.status, 403);
  const form = await request(app).post('/api/schueler/beitreten').set('Host', H.HOST).set('Origin', H.ORIGIN).type('form').send({ kurscode: kurs.code, name: 'Eve E.' });
  assert.equal(form.status, 415);
  const ok = await request(app).post('/api/schueler/beitreten').set('Host', H.HOST).set('Referer', H.ORIGIN + '/').send({ kurscode: kurs.code, name: 'Eve E.' });
  assert.equal(ok.status, 201);
});

test('Sicherheits-Header: CSP ohne Inline-Skripte, noindex', async () => {
  const app = H.makeApp();
  const r = await request(app).get('/');
  assert.match(r.headers['content-security-policy'], /script-src 'self'/);
  assert.doesNotMatch(r.headers['content-security-policy'], /unsafe-inline/);
  assert.match(r.headers['x-robots-tag'], /noindex/);
  const b = await request(app).get('/board/ABCDEF');
  assert.match(b.headers['x-robots-tag'], /noindex/);
});

test('Freigabe-Workflow: Registrierung → wartet → Freigabe / Ablehnung / Deaktivierung', async () => {
  const app = H.makeApp();
  const admin = await H.adminClient(app);
  const c = H.client(app);
  const reg = { name: 'Herr Neu', email: 'Neu@Schule.de', schule: 'MPG', passwort: 'sicheres-pw-123', nachricht: 'Bitte freischalten' };
  let r = await c.post('/api/lehrer/registrieren').send(reg);
  assert.equal(r.status, 201);
  assert.equal(r.body.status, 'wartet');
  assert.equal((await c.post('/api/lehrer/registrieren').send(reg)).status, 409, 'doppelt');
  assert.equal((await c.post('/api/lehrer/registrieren').send({ ...reg, email: 'x@y.de', passwort: 'kurz' })).status, 400, 'Passwort zu kurz');
  r = await c.post('/api/lehrer/anmelden').send({ email: 'neu@schule.de', passwort: reg.passwort });
  assert.equal(r.status, 403);
  assert.match(r.body.error, /wartet/);
  const lk = (await admin.get('/api/admin/lehrkraefte')).body.find((x) => x.email === 'neu@schule.de');
  assert.equal(lk.status, 'wartet');
  assert.equal(lk.nachricht, 'Bitte freischalten');
  assert.ok(!('pw_hash' in lk) && !JSON.stringify(lk).includes('scrypt'), 'kein Passwort-Hash in der Liste');
  // Ungültiger Statuswechsel
  assert.equal((await admin.post(`/api/admin/lehrkraefte/${lk.id}/status`).send({ status: 'deaktiviert' })).status, 400);
  assert.equal((await admin.post(`/api/admin/lehrkraefte/${lk.id}/status`).send({ status: 'aktiv' })).status, 200);
  r = await c.post('/api/lehrer/anmelden').send({ email: 'NEU@schule.de', passwort: reg.passwort });
  assert.equal(r.status, 200);
  assert.equal((await c.get('/api/lehrer/kurse')).status, 200);
  // Deaktivieren beendet die Sitzung
  assert.equal((await admin.post(`/api/admin/lehrkraefte/${lk.id}/status`).send({ status: 'deaktiviert' })).status, 200);
  assert.equal((await c.get('/api/lehrer/kurse')).status, 401);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'neu@schule.de', passwort: reg.passwort })).status, 403);
  // Ablehnen
  const c2 = H.client(app);
  await c2.post('/api/lehrer/registrieren').send({ ...reg, email: 'zwei@schule.de' });
  const lk2 = (await admin.get('/api/admin/lehrkraefte')).body.find((x) => x.email === 'zwei@schule.de');
  assert.equal((await admin.post(`/api/admin/lehrkraefte/${lk2.id}/status`).send({ status: 'abgelehnt' })).status, 200);
  const r2 = await c2.post('/api/lehrer/anmelden').send({ email: 'zwei@schule.de', passwort: reg.passwort });
  assert.equal(r2.status, 403);
  assert.match(r2.body.error, /abgelehnt/);
  // Superadmin kann nicht verändert werden
  const su = (await admin.get('/api/admin/lehrkraefte')).body.find((x) => x.rolle === 'superadmin');
  assert.equal((await admin.post(`/api/admin/lehrkraefte/${su.id}/status`).send({ status: 'deaktiviert' })).status, 403);
  assert.equal((await admin.delete(`/api/admin/lehrkraefte/${su.id}`)).status, 403);
});

test('Einmal-Passwort: wird einmal angezeigt, Login nur noch zum Passwortwechsel', async () => {
  const app = H.makeApp();
  const admin = await H.adminClient(app);
  const lk = await H.lehrkraftClient(app, admin, 'vergesslich@schule.de', 'altes-passwort-1');
  const r = await admin.post(`/api/admin/lehrkraefte/${lk.lkId}/einmalpasswort`).send({});
  assert.equal(r.status, 200);
  const ep = r.body.passwort;
  assert.ok(ep.length >= 12);
  assert.equal((await lk.get('/api/lehrer/kurse')).status, 401, 'alte Sitzung beendet');
  const c = H.client(app);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'vergesslich@schule.de', passwort: 'altes-passwort-1' })).status, 401, 'altes Passwort ungültig');
  const l = await c.post('/api/lehrer/anmelden').send({ email: 'vergesslich@schule.de', passwort: ep });
  assert.equal(l.status, 200);
  assert.equal(l.body.konto.mussPasswortAendern, true);
  const gesperrt = await c.get('/api/lehrer/kurse');
  assert.equal(gesperrt.status, 403);
  assert.equal(gesperrt.body.mussPasswortAendern, true);
  assert.equal((await c.get('/api/lehrer/ich')).status, 200);
  assert.equal((await c.post('/api/lehrer/passwort').send({ alt: 'falsch', neu: 'neues-passwort-123' })).status, 400);
  assert.equal((await c.post('/api/lehrer/passwort').send({ alt: ep, neu: 'neues-passwort-123' })).status, 200);
  assert.equal((await c.get('/api/lehrer/kurse')).status, 200, 'nach Wechsel wieder frei');
  assert.equal((await H.client(app).post('/api/lehrer/anmelden').send({ email: 'vergesslich@schule.de', passwort: ep })).status, 401, 'Einmal-Passwort verbraucht');
  assert.equal((await H.client(app).post('/api/lehrer/anmelden').send({ email: 'vergesslich@schule.de', passwort: 'neues-passwort-123' })).status, 200);
});

test('Superadmin aus ENV: ohne ADMIN_PASSWORD kein Login; Passwortwechsel per ENV beendet Sitzungen', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aql-su-'));
  const dbFile = path.join(dir, 'algoquest.db');
  let app = H.makeApp({ dbFile, adminPassword: 'erstes-passwort-1' });
  let c = H.client(app);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'admin', passwort: 'erstes-passwort-1' })).status, 200);
  app.locals.db.close();
  app = H.makeApp({ dbFile, adminPassword: 'zweites-passwort-2', adminEmail: 'chef@schule.de' });
  c = H.client(app);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'admin', passwort: 'zweites-passwort-2' })).status, 401, 'E-Mail geändert');
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'chef@schule.de', passwort: 'erstes-passwort-1' })).status, 401);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'chef@schule.de', passwort: 'zweites-passwort-2' })).status, 200);
  app.locals.db.close();
  app = H.makeApp({ dbFile, adminPassword: '', adminEmail: 'chef@schule.de' });
  const r = await H.client(app).post('/api/lehrer/anmelden').send({ email: 'chef@schule.de', passwort: 'zweites-passwort-2' });
  assert.equal(r.status, 403);
  app.locals.db.close();
});

test('Passwörter werden mit scrypt gespeichert (Salt, Parameter im Hash)', async () => {
  const app = H.makeApp();
  const admin = await H.adminClient(app);
  await H.lehrkraftClient(app, admin, 'hash@schule.de', 'mein-passwort-123');
  const row = app.locals.db.prepare('SELECT pw_hash FROM lehrkraefte WHERE email = ?').get('hash@schule.de');
  assert.match(row.pw_hash, /^scrypt\$\d+\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.ok(!row.pw_hash.includes('mein-passwort'));
});

test('Keine Gilden/XP in Oberfläche und README', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const basis = path.join(__dirname, '..');
  const dateien = ['README.md', 'docs/AUFGABENFORMAT.md', ...fs.readdirSync(path.join(basis, 'public')).filter((f) => f.endsWith('.html')).map((f) => 'public/' + f), ...fs.readdirSync(path.join(basis, 'public/static/js')).filter((f) => f.endsWith('.js')).map((f) => 'public/static/js/' + f)];
  for (const f of dateien) {
    const t = fs.readFileSync(path.join(basis, f), 'utf8');
    assert.doesNotMatch(t, /gilde|guild|\bXP\b/i, f);
  }
});

test('Rate-Limiter: abgelaufene Einträge (IP-Adressen) werden entfernt, Aufräum-Timer hält den Prozess nicht offen', () => {
  const { Limiter } = require('../src/security');
  const l = new Limiter({ max: 2, windowMs: 1000 });
  l.hit('ip:203.0.113.7', 0);
  l.hit('ip:203.0.113.7', 0);
  assert.equal(l.isBlocked('ip:203.0.113.7', 500), true);
  l.prune(500);
  assert.equal(l.map.size, 1, 'noch im Zeitfenster');
  l.prune(1000);
  assert.equal(l.map.size, 0, 'nach Ablauf des Zeitfensters gelöscht');
  assert.equal(l.aufraeumer.hasRef(), false);
  clearInterval(l.aufraeumer);
});
