'use strict';
// Sitzungen kr_s / kr_l (TECHNIK §6.4, src/verbund/sitzung.js) mit Cookies aus den Test-Helfern; SSO, Seiten-Wächter,
// Kurswahl und Abmelden prüft test/sso.test.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/security');
const H = require('./helpers');

test('Cookie-Namen kr_s, kr_l, kr_sso_state; zufallsText liefert base64url', () => {
  assert.deepEqual([S.COOKIE_SCHUELER, S.COOKIE_LEHRKRAFT, S.COOKIE_SSO_STATE], ['kr_s', 'kr_l', 'kr_sso_state']);
  assert.match(S.zufallsText(9), /^[A-Za-z0-9_-]{12}$/);
  assert.match(S.zufallsText(16), /^[A-Za-z0-9_-]{22}$/);
  for (const weg of ['hashPasswort', 'pruefePasswort', 'kursCode', 'schuelerCode', 'normSchuelerCode', 'einmalPasswort']) assert.equal(S[weg], undefined, weg);
});

test('Schüler-Sitzung: Teilnahme-Zeile; gefälschtes, fremd signiertes oder abgelaufenes Cookie → 401', async () => {
  const { app, s, kurs } = await H.szenario();
  const p = (await s.get('/api/profil').expect(200)).body;
  assert.equal(p.name, 'Lena S.');
  assert.deepEqual(p.kurs, { name: 'LK Informatik 13' });
  assert.ok(!('code' in p) && !('portal' in p));
  const g = 1;
  for (const wert of [
    'kaputt',
    S.sign({ sub: s.sub, g, t: s.id, exp: Date.now() + 60000 }, 'falsches-geheimnis-0123456789abcdef'),
    S.sign({ sub: s.sub, g, t: s.id, exp: Date.now() - 1 }, H.SECRET),
    S.sign({ s: s.id, g, exp: Date.now() + 60000 }, H.SECRET) // altes Algo-Quest-Format
  ]) {
    const c = H.client(app);
    c.jar.setCookie(`kr_s=${wert}; Path=/`, '127.0.0.1', '/');
    const r = await c.get('/api/welten');
    assert.equal(r.status, 401, wert);
  }
  // Teilnahme gehört einem anderen Konto → nicht nutzbar
  const t = await H.schuelerClient(app, kurs, 'Tim T.');
  const fremd = H.alsSchueler(app, t.sub, s.id);
  assert.equal((await fremd.get('/api/profil')).body.name, 'Tim T.', 'fremde Teilnahme wird ignoriert, eigene gilt');
});

test('session_gen: neue Generation beendet alle Sitzungen des Kontos', async () => {
  const { app, s, lk } = await H.szenario();
  app.locals.db.prepare('UPDATE konten SET session_gen = session_gen + 1 WHERE sub IN (?, ?)').run(s.sub, lk.sub);
  assert.equal((await s.get('/api/welten')).status, 401);
  assert.equal((await lk.get('/api/lehrer/kurse')).status, 401);
});

test('Rollen passen zum Cookie: Lehrkraft-Konto mit kr_s und Schülerkonto mit kr_l → 401', async () => {
  const { app, s, lk } = await H.szenario();
  const lkAlsSchueler = H.client(app);
  lkAlsSchueler.jar.setCookie(`kr_s=${S.sign({ sub: lk.sub, g: 1, t: s.id, exp: Date.now() + 60000 }, H.SECRET)}; Path=/`, '127.0.0.1', '/');
  assert.equal((await lkAlsSchueler.get('/api/welten')).status, 401);
  const sAlsLk = H.alsLehrkraft(app, s.sub);
  assert.equal((await sAlsLk.get('/api/lehrer/kurse')).status, 401);
});

test('Teilnahme inaktiv oder Kurs gesperrt: erste aktive Teilnahme (nach Kursname) gilt, Cookie wird erneuert; keine → 401', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const zebra = H.kurs(app, 'Zebra-Kurs');
  const alpha = H.kurs(app, 'Alpha-Kurs');
  const beta = H.kurs(app, 'Beta-Kurs');
  const sub = H.konto(app, 'schueler', 'Mika R.');
  const tz = H.teilnahme(app, zebra, sub, 'Mika R.');
  const ta = H.teilnahme(app, alpha, sub, 'Mika R.');
  const tb = H.teilnahme(app, beta, sub, 'Mika R.');
  const c = H.alsSchueler(app, sub, tz);
  assert.equal((await c.get('/api/sitzung')).body.kurs.name, 'Zebra-Kurs');
  db.prepare('UPDATE schueler SET aktiv = 0 WHERE id = ?').run(tz);
  const r = await c.get('/api/profil').expect(200);
  assert.equal(r.body.kurs.name, 'Alpha-Kurs');
  const cookie = (r.headers['set-cookie'] || []).join(';');
  assert.match(cookie, /kr_s=.*HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//);
  // gesperrter Kurs (Verbund kurs-aendern aktiv:false) zählt nicht
  db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(alpha.id);
  assert.equal((await c.get('/api/profil')).body.kurs.name, 'Beta-Kurs');
  const sitz = (await c.get('/api/sitzung')).body;
  assert.equal(sitz.kurs.id, beta.kurs);
  assert.deepEqual(sitz.kurse, [
    { id: alpha.kurs, name: 'Alpha-Kurs', aktiv: false },
    { id: beta.kurs, name: 'Beta-Kurs', aktiv: true },
    { id: zebra.kurs, name: 'Zebra-Kurs', aktiv: false }
  ]);
  db.prepare('UPDATE schueler SET aktiv = 0 WHERE id = ?').run(tb);
  // nur noch die Teilnahme im gesperrten Alpha-Kurs → 403 (Sitzung bleibt, Task 7)
  const gesperrt = await c.get('/api/welten');
  assert.equal(gesperrt.status, 403);
  assert.doesNotMatch((gesperrt.headers['set-cookie'] || []).join(';'), /kr_s=;/);
  db.prepare('UPDATE schueler SET aktiv = 0 WHERE id = ?').run(ta);
  const weg = await c.get('/api/welten');
  assert.equal(weg.status, 401);
  assert.match((weg.headers['set-cookie'] || []).join(';'), /kr_s=;/, 'Cookie gelöscht');
});

test('Lehrkraft-Sitzung: /api/lehrer/ich zeigt das Konto ohne interne Felder', async () => {
  const { lk } = await H.szenario();
  const ich = (await lk.get('/api/lehrer/ich').expect(200)).body;
  assert.deepEqual([ich.sub, ich.name, ich.rolle], [lk.sub, 'Frau Lehrer', 'lehrkraft']);
  assert.ok(!('session_gen' in ich));
});

test('Rate-Limit: Prüfen 90 / Minute je Teilnahme', async () => {
  const { s } = await H.szenario();
  let r;
  for (let i = 0; i < 91; i++) r = await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: ['b'] });
  assert.equal(r.status, 429);
});
