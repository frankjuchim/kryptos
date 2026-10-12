'use strict';
// Wartungsjob (TECHNIK §7.4) mit steuerbarer Uhr: Funkraum nach 24 h, geschlossene Arena nach 30 Tagen, sso_jti nach
// Ablauf, abgelaufene Boss-Kämpfe auswerten, PRAGMA optimize wöchentlich; Bericht für /api/admin/wartung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { createWartung } = require('../src/wartung');

const STUNDE = 3600 * 1000;
const TAG = 24 * STUNDE;

function aufbau() {
  const uhr = H.uhr();
  const app = H.makeApp({ now: uhr });
  const db = app.locals.db;
  const iso = (ms) => new Date(ms).toISOString();
  const k = H.kurs(app);
  const s = H.konto(app, 'schueler', 'Mika R.');
  const t = H.teilnahme(app, k, s, 'Mika R.');
  const team = Number(db.prepare("INSERT INTO teams (kurs_id, nr, name) VALUES (?, 1, 'Team Skytale')").run(k.id).lastInsertRowid);
  db.prepare('INSERT INTO team_mitglieder (team_id, schueler_id) VALUES (?, ?)').run(team, t);
  return { uhr, app, db, iso, k, t, team };
}

test('Wartung: Funkraum-Szenario nach 24 h gelöscht (mit Nachrichten), vorher nicht', () => {
  const { uhr, app, db, iso, k, t, team } = aufbau();
  const sz = Number(
    db.prepare("INSERT INTO funk_szenarien (kurs_id, typ, status, phase, endet_spaetestens, created_at) VALUES (?, 'botenlauf', 'laeuft', 'senden', ?, ?)").run(k.id, iso(uhr() + TAG), iso(uhr())).lastInsertRowid
  );
  db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, von_schueler_id, art, inhalt, version, zeit) VALUES (?, ?, ?, 'nachricht', 'ABC', 1, ?)").run(sz, team, t, iso(uhr()));
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  uhr.vor(23 * STUNDE);
  assert.equal(w.lauf().anzahlen.funkraum, 0);
  assert.equal(H.zaehle(app, 'funk_szenarien'), 1);
  uhr.vor(2 * STUNDE);
  const b = w.lauf();
  assert.equal(b.anzahlen.funkraum, 1);
  assert.equal(H.zaehle(app, 'funk_szenarien'), 0);
  assert.equal(H.zaehle(app, 'funk_nachrichten'), 0);
  assert.deepEqual(b.fehler, []);
});

test('Wartung: geschlossene Arena nach 30 Tagen gelöscht (mit Chiffren und Versuchen), offene nie', () => {
  const { uhr, app, db, iso, k, t, team } = aufbau();
  const zu = Number(db.prepare("INSERT INTO arena (kurs_id, status, salz, created_at, geschlossen_at) VALUES (?, 'geschlossen', 's', ?, ?)").run(k.id, iso(uhr()), iso(uhr())).lastInsertRowid);
  const ch = Number(
    db.prepare("INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, eingereicht_at) VALUES (?, ?, '{}', 'B', 'ABC', 'h', 3, ?)").run(zu, team, iso(uhr())).lastInsertRowid
  );
  db.prepare("INSERT INTO arena_versuche (arena_id, chiffre_id, team_id, schueler_id, art, erfolg, zeit) VALUES (?, ?, ?, ?, 'klartext', 0, ?)").run(zu, ch, team, t, iso(uhr()));
  db.prepare("INSERT INTO arena (kurs_id, status, salz, created_at) VALUES (?, 'angriff', 's', ?)").run(k.id, iso(uhr()));
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  uhr.vor(29 * TAG);
  assert.equal(w.lauf().anzahlen.arena, 0);
  uhr.vor(2 * TAG);
  assert.equal(w.lauf().anzahlen.arena, 1);
  assert.equal(H.zaehle(app, 'arena'), 1, 'offene Arena bleibt');
  assert.equal(H.zaehle(app, 'arena_chiffren'), 0);
  assert.equal(H.zaehle(app, 'arena_versuche'), 0);
});

test('Wartung: sso_jti-Einträge 60 s nach Ablauf entfernt', () => {
  const { uhr, app, db } = aufbau();
  const sek = Math.floor(uhr() / 1000);
  db.prepare('INSERT INTO sso_jti (jti, exp) VALUES (?, ?), (?, ?)').run('s:alt', sek - 61, 'v:neu', sek - 30);
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  assert.equal(w.lauf().anzahlen.jti, 1);
  assert.deepEqual(db.prepare('SELECT jti FROM sso_jti').all().map((r) => r.jti), ['v:neu']);
});

test('Wartung: abgelaufene Boss-Kämpfe werden ausgewertet, laufende nicht', () => {
  const { uhr, app, db, iso, t } = aufbau();
  const neu = (deadline) =>
    Number(db.prepare("INSERT INTO boss_versuche (schueler_id, welt, aufgaben, start_at, deadline_at, max_punkte) VALUES (?, 9, '[\"W9-B-01\"]', ?, ?, 10)").run(t, iso(uhr()), iso(deadline)).lastInsertRowid);
  const alt = neu(uhr() + 10 * 60 * 1000);
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  uhr.vor(2 * STUNDE);
  const laufend = neu(uhr() + 30 * 60 * 1000);
  const b = w.lauf();
  assert.equal(b.anzahlen.boss, 1);
  assert.ok(db.prepare('SELECT ende_at FROM boss_versuche WHERE id = ?').get(alt).ende_at);
  assert.equal(db.prepare('SELECT ende_at FROM boss_versuche WHERE id = ?').get(laufend).ende_at, null);
});

test('Wartung: PRAGMA optimize höchstens wöchentlich; Bericht mit Zeitpunkt; Fehler einer Aufgabe stoppt die anderen nicht', () => {
  const { uhr, app, db } = aufbau();
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  assert.equal(w.bericht(), null, 'vor dem ersten Lauf kein Bericht');
  assert.equal(w.lauf().optimiert, true);
  uhr.vor(STUNDE);
  assert.equal(w.lauf().optimiert, false);
  uhr.vor(7 * 24 * STUNDE);
  const b = w.lauf();
  assert.equal(b.optimiert, true);
  assert.equal(b.zeit, new Date(uhr()).toISOString());
  assert.deepEqual(w.bericht(), b);
  // Fehler in der Boss-Auswertung → gemeldet, übrige Aufgaben laufen
  const kaputt = createWartung({ db, svc: { boss: { raeumeAuf: () => { throw new Error('kaputt'); } } }, now: uhr });
  const sek = Math.floor(uhr() / 1000);
  db.prepare('INSERT INTO sso_jti (jti, exp) VALUES (?, ?)').run('s:x', sek - 100);
  db.prepare("INSERT INTO boss_versuche (schueler_id, welt, aufgaben, start_at, deadline_at, max_punkte) VALUES ((SELECT id FROM schueler LIMIT 1), 9, '[]', ?, ?, 10)").run(new Date(uhr() - 2 * STUNDE).toISOString(), new Date(uhr() - STUNDE).toISOString());
  const k = kaputt.lauf();
  assert.equal(k.anzahlen.jti, 1);
  assert.equal(k.fehler.length, 1);
  assert.match(k.fehler[0], /boss/);
});

test('Wartung: starte() läuft sofort und dann stündlich, Timer hält den Prozess nicht offen', () => {
  const { app, db, uhr } = aufbau();
  const w = createWartung({ db, svc: app.locals.services, now: uhr });
  const timer = w.starte();
  assert.ok(w.bericht(), 'Lauf beim Start');
  assert.equal(timer.hasRef(), false);
  w.stop();
});

test('Wartungsbericht nur für den Superadmin: GET /api/admin/wartung', async () => {
  const { app, admin, lk } = await H.szenario();
  assert.equal((await lk.get('/api/admin/wartung')).status, 403);
  const leer = await admin.get('/api/admin/wartung').expect(200);
  assert.deepEqual(leer.body, { bericht: null });
  app.locals.wartung.lauf();
  const r = await admin.get('/api/admin/wartung').expect(200);
  assert.ok(r.body.bericht.zeit);
  assert.deepEqual(Object.keys(r.body.bericht.anzahlen).sort(), ['arena', 'boss', 'funkraum', 'jti']);
});
