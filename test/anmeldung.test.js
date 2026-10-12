'use strict';
// Schüler: Beitritt, Wiederanmeldung, Namenskonflikt, Rate-Limits, Sitzungen.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

test('Beitritt: Kurscode + Name → persönlicher Code im Format ABC-123', async () => {
  const { app, kurs } = await H.szenario();
  const c = H.client(app);
  const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code.toLowerCase(), name: '  Tom   K. ' });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(r.body.code, /^[A-HJ-NP-Z]{3}-[2-9]{3}$/);
  assert.equal(r.body.name, 'Tom K.', 'getrimmt und Leerzeichen zusammengefasst');
  assert.equal(r.body.kurs, 'LK Informatik 13');
  // Sitzung ist sofort aktiv
  const s = await c.get('/api/sitzung');
  assert.equal(s.body.schueler.name, 'Tom K.');
  assert.equal((await c.get('/api/welten')).status, 200);
});

test('Namenskonflikt: gleicher Name (case-insensitiv, getrimmt) → 409', async () => {
  const { app, kurs } = await H.szenario(); // „Lena S.“ existiert
  const c = H.client(app);
  for (const name of ['Lena S.', 'lena s.', '  LENA   S. ']) {
    const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name });
    assert.equal(r.status, 409, name);
    assert.match(r.body.error, /Weiterspielen/);
  }
});

test('Namensregeln: 2–30 Zeichen, nur Buchstaben/Ziffern/Leerzeichen/.-\'', async () => {
  const { app, kurs } = await H.szenario();
  const c = H.client(app);
  for (const name of ['L', 'x'.repeat(31), 'Lena<script>', 'Lena@S', '']) {
    const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name });
    assert.equal(r.status, 400, name);
  }
  for (const name of ["O'Neil J.", 'Jan-Ole M.', 'Ömer Ç.', 'Max 2']) {
    const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name });
    assert.equal(r.status, 201, name + ' ' + JSON.stringify(r.body));
  }
});

test('Unbekannter Kurscode → 404; Anmeldung geschlossen → 403', async () => {
  const { app, lk, kurs } = await H.szenario();
  const c = H.client(app);
  assert.equal((await c.post('/api/schueler/beitreten').send({ kurscode: 'ZZZZZZ', name: 'Anna B.' })).status, 404);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { anmeldung: false } });
  const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name: 'Anna B.' });
  assert.equal(r.status, 403);
  assert.equal((await c.get(`/api/kurs/${kurs.code}`)).body.anmeldung, false);
});

test('Wiederanmeldung auf anderem Gerät mit Kurscode + Name + Code (Code-Eingabe tolerant)', async () => {
  const { app, kurs, s } = await H.szenario();
  const c = H.client(app);
  const roh = s.code.replace('-', '').toLowerCase();
  const r = await c.post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'lena s.', code: roh });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.name, 'Lena S.');
  assert.equal((await c.get('/api/profil')).body.name, 'Lena S.');
  // falscher Code
  const f = await H.client(app).post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: 'ABC-234' });
  assert.equal(f.status, 401);
});

test('Weiterspielen nur mit Name + Code (ohne Kurscode)', async () => {
  const { app, s } = await H.szenario();
  const c = H.client(app);
  const r = await c.post('/api/schueler/anmelden').send({ name: 'LENA S.', code: s.code.replace('-', ' ') });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.name, 'Lena S.');
  assert.equal((await c.get('/api/profil')).body.name, 'Lena S.');
  // falscher Code, falscher Name
  assert.equal((await H.client(app).post('/api/schueler/anmelden').send({ name: 'Lena S.', code: 'ABC-234' })).status, 401);
  assert.equal((await H.client(app).post('/api/schueler/anmelden').send({ name: 'Tom K.', code: s.code })).status, 401);
  assert.equal((await H.client(app).post('/api/schueler/anmelden').send({ name: 'Lena S.' })).status, 401);
});

test('Gleicher Name in zwei Kursen: Code unterscheidet; Codes werden kursübergreifend eindeutig vergeben', async () => {
  const { app, lk, s } = await H.szenario();
  const kurs2 = await H.kursAnlegen(lk, 'LK Informatik 12');
  const s2 = await H.schuelerClient(app, kurs2.code, 'Lena S.');
  assert.notEqual(s2.code, s.code);
  const r1 = await H.client(app).post('/api/schueler/anmelden').send({ name: 'Lena S.', code: s.code });
  const r2 = await H.client(app).post('/api/schueler/anmelden').send({ name: 'Lena S.', code: s2.code });
  assert.equal(r1.body.kurs, 'LK Informatik 13');
  assert.equal(r2.body.kurs, 'LK Informatik 12');
  // Vergabe weicht belegten Codes aus (Zufall erzwingt zuerst einen schon vergebenen Code)
  const db = app.locals.db;
  const S = require('../src/security');
  const orig = S.schuelerCode;
  const folge = [s.code, s2.code, 'XYZ-789'];
  S.schuelerCode = () => folge.shift() || orig();
  try {
    const s3 = await H.schuelerClient(app, kurs2.code, 'Tom K.');
    assert.equal(s3.code, 'XYZ-789');
  } finally {
    S.schuelerCode = orig;
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schueler WHERE code = ?').get(s.code).n, 1);
});

test('Alte doppelte Codes (vor 2.3): Name + Code mehrdeutig → 409 kurscodeNoetig, mit Kurscode eindeutig', async () => {
  const { app, lk, kurs, s } = await H.szenario();
  const kurs2 = await H.kursAnlegen(lk, 'LK Informatik 12');
  const s2 = await H.schuelerClient(app, kurs2.code, 'Lena S.');
  app.locals.db.prepare('UPDATE schueler SET code = ? WHERE code = ?').run(s.code, s2.code); // Altbestand nachstellen
  const c = H.client(app);
  const r = await c.post('/api/schueler/anmelden').send({ name: 'Lena S.', code: s.code });
  assert.equal(r.status, 409);
  assert.equal(r.body.kurscodeNoetig, true);
  const ok = await c.post('/api/schueler/anmelden').send({ name: 'Lena S.', code: s.code, kurscode: kurs2.code });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.kurs, 'LK Informatik 12');
  const falsch = await H.client(app).post('/api/schueler/anmelden').send({ name: 'Lena S.', code: 'ABC-234', kurscode: kurs.code });
  assert.equal(falsch.status, 401);
});

test('Rate-Limit: 8 Fehlversuche je Konto → 429 (auch mit richtigem Code)', async () => {
  const { app, kurs, s } = await H.szenario();
  const c = H.client(app);
  for (let i = 0; i < 8; i++) {
    const r = await c.post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: 'AAA-222' });
    assert.equal(r.status, 401);
  }
  const r = await c.post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: s.code });
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers['retry-after']) > 0);
});

test('Rate-Limit: Beitritte je IP begrenzt (60 / 10 min)', async () => {
  const { app, kurs } = await H.szenario();
  const c = H.client(app);
  let letzter;
  // ein Beitritt lief schon im Szenario (gleiche IP)
  for (let i = 0; i < 59; i++) letzter = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name: 'Schueler ' + i });
  assert.equal(letzter.status, 201);
  const r = await c.post('/api/schueler/beitreten').send({ kurscode: kurs.code, name: 'Noch einer' });
  assert.equal(r.status, 429);
});

test('Rate-Limit: Lehrkraft-Login (8 Fehlversuche je Konto)', async () => {
  const app = H.makeApp();
  const c = H.client(app);
  for (let i = 0; i < 8; i++) assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'admin', passwort: 'falsch-falsch' })).status, 401);
  assert.equal((await c.post('/api/lehrer/anmelden').send({ email: 'admin', passwort: H.ADMIN_PW })).status, 429);
});

test('Rate-Limit: Registrierung (5 / Stunde je IP) und Prüfen (90 / Minute je Schüler)', async () => {
  const { app, s } = await H.szenario();
  const c = H.client(app);
  for (let i = 0; i < 4; i++) {
    // eine Registrierung lief schon im Szenario
    const r = await c.post('/api/lehrer/registrieren').send({ name: 'Herr X', email: `x${i}@schule.de`, schule: 'MPG', passwort: 'passwort-123456' });
    assert.equal(r.status, 201);
  }
  assert.equal((await c.post('/api/lehrer/registrieren').send({ name: 'Herr Y', email: 'y@schule.de', schule: 'MPG', passwort: 'passwort-123456' })).status, 429);
  let r;
  for (let i = 0; i < 91; i++) r = await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: ['b'] });
  assert.equal(r.status, 429);
});

test('Neuer Code durch Lehrkraft macht alte Sitzung ungültig', async () => {
  const { app, lk, kurs, s } = await H.szenario();
  const liste = (await lk.get(`/api/lehrer/kurse/${kurs.id}/schueler`)).body;
  const r = await lk.post(`/api/lehrer/kurse/${kurs.id}/schueler/${liste[0].id}/neuer-code`).send({});
  assert.equal(r.status, 200);
  assert.notEqual(r.body.code, s.code);
  assert.equal((await s.get('/api/welten')).status, 401);
  const neu = await H.client(app).post('/api/schueler/anmelden').send({ kurscode: kurs.code, name: 'Lena S.', code: r.body.code });
  assert.equal(neu.status, 200);
});

test('Abmelden löscht das Cookie; ohne Sitzung 401', async () => {
  const { s } = await H.szenario();
  assert.equal((await s.post('/api/schueler/abmelden').send({})).status, 200);
  assert.equal((await s.get('/api/welten')).status, 401);
});

test('Gefälschtes oder manipuliertes Cookie wird verworfen', async () => {
  const { app } = await H.szenario();
  const c = H.client(app);
  const S = require('../src/security');
  const token = S.sign({ s: 1, g: 1, exp: Date.now() + 100000 }, 'falsches-geheimnis-123456');
  const r = await c.get('/api/welten').set('Cookie', `${S.COOKIE_SCHUELER}=${token}`);
  assert.equal(r.status, 401);
});

test('Session-Cookie: httpOnly, SameSite=Lax', async () => {
  const { app, kurs } = await H.szenario();
  const r = await H.client(app).post('/api/schueler/beitreten').send({ kurscode: kurs.code, name: 'Cookie T.' });
  const sc = r.headers['set-cookie'].join(';');
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Lax/i);
});
