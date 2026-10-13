'use strict';
// Rechte und Kurs-Isolation, CSRF-Schutz, entfernte lokale Anmeldung (TECHNIK §6.5).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

test('Kurs-Isolation: Lehrkraft A sieht und ändert Kurse von B nicht (404); Superadmin sieht alle', async () => {
  const app = H.makeApp();
  const admin = await H.adminClient(app);
  const a = await H.lehrkraftClient(app, { name: 'Herr A.' });
  const b = await H.lehrkraftClient(app, { name: 'Frau B.' });
  const kb = await H.kursAnlegen(b, 'Kurs von B');
  await H.schuelerClient(app, kb, 'Bea B.');
  const base = `/api/lehrer/kurse/${kb.id}`;
  assert.deepEqual((await a.get('/api/lehrer/kurse')).body, []);
  for (const [m, url, body] of [
    ['get', base],
    ['patch', base, { einstellungen: { scoreboard: false } }],
    ['get', base + '/schueler'],
    ['get', base + '/auswertung'],
    ['get', base + '/scoreboard'],
    ['get', base + '/urkunden'],
    ['get', base + '/export.csv']
  ]) {
    const r = await a[m](url).send(body);
    assert.equal(r.status, 404, `${m} ${url}`);
  }
  // B selbst darf
  assert.equal((await b.get(base)).body.name, 'Kurs von B');
  // Kurs fehlt im letzten Token (kurs_lehrkraefte.aktiv = 0) → kein Zugriff mehr
  H.zuordnen(app, kb, b.sub, { aktiv: false });
  assert.equal((await b.get(base)).status, 404);
  assert.deepEqual((await b.get('/api/lehrer/kurse')).body, []);
  H.zuordnen(app, kb, b.sub);
  // Superadmin sieht alles
  const alle = (await admin.get('/api/lehrer/kurse')).body;
  assert.equal(alle.length, 1);
  assert.equal(alle[0].lehrkraft, 'Frau B.');
  assert.equal(alle[0].kurs, kb.kurs);
  assert.equal((await admin.get(base + '/schueler')).status, 200);
});

test('Kursname kommt aus dem Portal: PATCH mit name → 400, Einstellungen bleiben änderbar', async () => {
  const { lk, kurs } = await H.szenario();
  assert.equal((await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ name: 'gekapert' })).status, 400);
  const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { scoreboard: false } }).expect(200);
  assert.equal(r.body.name, 'LK Informatik 13');
  assert.equal(r.body.einstellungen.scoreboard, false);
});

test('Entfernte lokale Anmeldung und Verwaltung (TECHNIK §6.5): Routen gibt es nicht mehr', async () => {
  const { app, admin, lk, kurs, s } = await H.szenario();
  const base = `/api/lehrer/kurse/${kurs.id}`;
  for (const [c, m, url] of [
    [lk, 'post', '/api/lehrer/registrieren'],
    [lk, 'post', '/api/lehrer/anmelden'],
    [lk, 'post', '/api/lehrer/passwort'],
    [lk, 'post', '/api/lehrer/kurse'],
    [lk, 'delete', base],
    [lk, 'patch', `${base}/schueler/${s.id}`],
    [lk, 'post', `${base}/schueler/${s.id}/neuer-code`],
    [lk, 'delete', `${base}/schueler/${s.id}`],
    [lk, 'post', `${base}/alle-schueler-loeschen`],
    [lk, 'get', `${base}/qr.svg`],
    [admin, 'get', '/api/admin/lehrkraefte'],
    [admin, 'post', '/api/admin/lehrkraefte/1/einmalpasswort'],
    [admin, 'post', '/api/admin/verbund/zuordnung'],
    [s, 'post', '/api/schueler/beitreten'],
    [s, 'post', '/api/schueler/anmelden'],
    [s, 'get', '/api/kurs/ABCDEF']
  ]) {
    const r = await c[m](url).send({});
    assert.equal(r.status, 404, `${m} ${url}`);
  }
  assert.equal((await H.client(app).get('/k/ABCDEF')).status, 404);
  assert.equal(app.locals.db.prepare('SELECT COUNT(*) AS n FROM schueler').get().n, 1, 'nichts gelöscht');
});

test('Rollen: Schüler → Lehrer-API 401, Lehrkraft → Admin-API 403; API ohne Sitzung → 401 mit SSO-Hinweis', async () => {
  const { app, s, lk } = await H.szenario();
  assert.equal((await s.get('/api/lehrer/kurse')).status, 401);
  assert.equal((await s.get('/api/admin/inhalte')).status, 401);
  assert.equal((await lk.get('/api/admin/inhalte')).status, 403);
  assert.equal((await lk.get('/api/admin/backup')).status, 403);
  assert.equal((await lk.post('/api/admin/katas/import').send({ version: 1, karten: [] })).status, 403);
  // Lehrkraft ist kein Schüler
  assert.equal((await lk.get('/api/welten')).status, 401);
  const r = await H.client(app).get('/api/welten');
  assert.equal(r.status, 401);
  assert.deepEqual([r.body.anmelden, r.body.sso], [true, '/sso/start']);
  const l = await H.client(app).get('/api/lehrer/kurse');
  assert.deepEqual([l.status, l.body.anmelden, l.body.sso], [401, true, '/sso/start']);
});

test('CSRF: schreibende Anfragen nur mit passender Herkunft und als JSON', async () => {
  const { lk, kurs } = await H.szenario();
  const url = `/api/lehrer/kurse/${kurs.id}`;
  const body = { einstellungen: { beamer: true } };
  assert.equal((await lk.patch(url).unset('Origin').send(body)).status, 403, 'ohne Herkunft');
  assert.equal((await lk.patch(url).set('Origin', 'http://boese.example').send(body)).status, 403, 'fremde Herkunft');
  assert.equal((await lk.patch(url).type('form').send('einstellungen=x')).status, 415, 'kein JSON');
  assert.equal((await lk.patch(url).unset('Origin').set('Referer', H.ORIGIN + '/').send(body)).status, 200, 'Referer genügt');
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

test('Entfernte Routen (TECHNIK §6.5) liefern auch ohne Sitzung 404 statt 401', async () => {
  const app = H.makeApp();
  const c = H.client(app);
  for (const [m, url] of [
    ['post', '/api/lehrer/registrieren'],
    ['post', '/api/lehrer/anmelden'],
    ['post', '/api/lehrer/passwort'],
    ['post', '/api/lehrer/kurse'],
    ['delete', '/api/lehrer/kurse/1'],
    ['get', '/api/lehrer/kurse/1/qr.svg'],
    ['post', '/api/lehrer/kurse/1/schueler/1/neuer-code'],
    ['get', '/api/admin/lehrkraefte'],
    ['post', '/api/admin/lehrkraefte/1/einmalpasswort'],
    ['post', '/api/schueler/beitreten'],
    ['post', '/api/schueler/anmelden'],
    ['get', '/api/kurs/ABCDEF'],
    ['post', '/api/kurs-wechseln'],
    ['post', '/api/lehrer/abmelden'],
    ['post', '/api/schueler/abmelden'],
    ['post', '/api/admin/lehrkraefte'],
    ['post', '/api/admin/verbund/zuordnung']
  ]) {
    const r = await c[m](url).send({});
    assert.equal(r.status, 404, `${m} ${url}`);
  }
  // vorhandene Routen ohne Sitzung weiterhin 401
  assert.equal((await c.get('/api/lehrer/kurse')).status, 401);
  assert.equal((await c.get('/api/admin/backup')).status, 401);
});

test('Gesperrter Kurs (Verbund aktiv:false): Lehrkraft sieht ihn nur lesend – Einstellungen ändern → 403', async () => {
  const { app, lk, kurs } = await H.szenario();
  app.locals.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(kurs.id);
  const g = await lk.get(`/api/lehrer/kurse/${kurs.id}`).expect(200);
  assert.equal(g.body.aktiv, false);
  assert.equal((await lk.get(`/api/lehrer/kurse/${kurs.id}/auswertung`)).status, 200);
  const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { beamer: true } });
  assert.equal(r.status, 403);
  assert.match(r.body.error, /abgeschaltet/);
});

test('Einstellung „anmeldung“ (Kern) wird ignoriert und nicht angezeigt (TECHNIK §6.5)', async () => {
  const { lk, kurs } = await H.szenario();
  const r = await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { anmeldung: false, beamer: true } }).expect(200);
  assert.equal(r.body.einstellungen.anmeldung, undefined);
  assert.equal(r.body.einstellungen.beamer, true);
});

test('Archivfund-Routen (Delta §2): nur für Schüler – Lehrkraft und ohne Sitzung 401', async () => {
  const { app, lk } = await H.szenario();
  const ohne = H.client(app);
  for (const c of [lk, ohne]) {
    assert.equal((await c.get('/api/archivfund/9')).status, 401);
    for (const p of ['pruefen', 'tipp', 'aufdecken']) assert.equal((await c.post(`/api/archivfund/9/${p}`).send({ antwort: 'x' })).status, 401, p);
  }
});

test('Werkzeug-Freigaben und Board-Schlüssel (M4 Task 49): Rollen, fremder/gesperrter Kurs, Herkunft', async () => {
  const { app, s, lk, kurs } = await H.szenario();
  const ohne = H.client(app);
  // Werkzeugliste nur für Lehrkräfte
  assert.equal((await s.get('/api/lehrer/werkzeuge')).status, 401);
  assert.equal((await ohne.get('/api/lehrer/werkzeuge')).status, 401);
  assert.equal((await lk.get('/api/lehrer/werkzeuge')).status, 200);
  // Labor-Freigaben nur für Schüler
  assert.equal((await ohne.get('/api/labor')).status, 401);
  assert.equal((await s.get('/api/labor')).status, 200);
  // Board-Schlüssel: fremder Kurs 404, ohne Herkunft 403, Schüler 401, gesperrter Kurs 403
  const fremd = await H.lehrkraftClient(app, { name: 'Herr A.' });
  const url = `/api/lehrer/kurse/${kurs.id}/board-schluessel`;
  assert.equal((await fremd.post(url).send({})).status, 404);
  assert.equal((await s.post(url).send({})).status, 401);
  assert.equal((await lk.post(url).unset('Origin').send({})).status, 403);
  app.locals.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(kurs.id);
  assert.equal((await lk.post(url).send({})).status, 403);
});
