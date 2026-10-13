'use strict';
// Funkraum-Löschregeln (Plan M7 Task 132, TECHNIK §7.3, §12.7, E111) – Tests zuerst. Roh-SQL über H.befuelle, weil der
// Funkraum-Dienst erst ab Task 134 existiert; Task 137 wiederholt den Durchlauf über die API.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const L = require('../src/krypto/funkraum/loeschen');
const { fundstellen } = require('./hilfen_funk');

function aufbau() {
  const app = H.makeApp();
  const db = app.locals.db;
  const k = H.kurs(app);
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const t = [H.teilnahme(app, k, mika, 'Mika R.'), H.teilnahme(app, k, ida, 'Ida K.')];
  const b = H.befuelle(app, k, t);
  db.prepare('UPDATE funk_szenarien SET konfig = ? WHERE id = ?').run(JSON.stringify({ salz: 'geheimes-salz', schluessel: { a: '1DC0' } }), b.szenario);
  db.prepare("UPDATE funk_nachrichten SET fuer_schluessel = 'S23' WHERE szenario_id = ?").run(b.szenario);
  return { app, db, k, t, ...b };
}

test('Beenden: Inhalte, Hashes, Rollen-Zustände, Geheimnisse in konfig weg; Auswertung und Teilnahme bleiben', () => {
  const { app, db, szenario, t } = aufbau();
  const v0 = db.prepare('SELECT version FROM funk_szenarien WHERE id = ?').get(szenario).version;
  L.beenden(db, szenario, { jetzt: '2026-10-13T10:00:00.000Z', typ: 'botenlauf' });
  assert.equal(H.zaehle(app, 'funk_nachrichten', "szenario_id = ? AND (inhalt != '' OR klartext_hash IS NOT NULL OR fuer_schluessel IS NOT NULL)", szenario), 0);
  assert.equal(H.zaehle(app, 'funk_rollen', "szenario_id = ? AND zustand != '{}'", szenario), 0);
  const sz = db.prepare('SELECT * FROM funk_szenarien WHERE id = ?').get(szenario);
  assert.equal(sz.status, 'auswertung');
  assert.equal(sz.beendet_at, '2026-10-13T10:00:00.000Z');
  assert.equal(sz.version, v0 + 1);
  assert.deepEqual(Object.keys(JSON.parse(sz.konfig)), ['auswertung']);
  const aus = JSON.parse(sz.konfig).auswertung;
  assert.ok(Object.values(aus.teams).every((x) => Number.isInteger(x.gesendet) && Number.isInteger(x.angekommen) && Number.isInteger(x.geknackt)));
  assert.match(JSON.stringify(aus), /^[{}\[\]":,a-z0-9._-]*$/i, 'Auswertung nur Zahlen, ids, Codes');
  const ev = db.prepare("SELECT * FROM funk_ereignisse WHERE szenario_id = ? AND code = 'status'").get(szenario);
  assert.deepEqual(JSON.parse(ev.daten), { status: 'auswertung' });
  assert.equal(ev.version, v0 + 1);
  for (const sid of t) assert.equal(H.zaehle(app, 'funk_teilnahmen', 'schueler_id = ? AND typ = ?', sid, 'botenlauf'), 1);
  // Volltextsuche: kein Geheimtext, kein Hash, kein Salz, kein Schlüssel mehr in irgendeiner Spalte
  for (const nadel of ['GEHEIMTEXT', 'geheimes-salz', '1DC0', 'S23']) assert.deepEqual(fundstellen(db, nadel), [], nadel);
});

test('Beenden trägt Teilnahmen für alle Mitglieder der Teams mit Rolle ein (Typ aus der Zeile)', () => {
  const { app, db, szenario, t } = aufbau();
  db.prepare("UPDATE funk_szenarien SET typ = 'wettknacken' WHERE id = ?").run(szenario);
  L.beenden(db, szenario, { jetzt: '2026-10-13T10:00:00.000Z' });
  for (const sid of t) assert.equal(H.zaehle(app, 'funk_teilnahmen', 'schueler_id = ? AND typ = ?', sid, 'wettknacken'), 1);
  // zweites Beenden ändert nichts mehr
  const v = db.prepare('SELECT version FROM funk_szenarien WHERE id = ?').get(szenario).version;
  L.beenden(db, szenario, { jetzt: '2026-10-13T11:00:00.000Z' });
  assert.equal(db.prepare('SELECT version FROM funk_szenarien WHERE id = ?').get(szenario).version, v);
});

test('Beenden ist eine Transaktion: Fehler in der Auswertung lässt alles unverändert', () => {
  const { app, db, szenario } = aufbau();
  assert.throws(() => L.beenden(db, szenario, { jetzt: '2026-10-13T10:00:00.000Z', auswertung: () => { throw new Error('kaputt'); } }));
  assert.equal(H.zaehle(app, 'funk_nachrichten', "szenario_id = ? AND inhalt = 'GEHEIMTEXT'", szenario), 2);
  assert.equal(db.prepare('SELECT status FROM funk_szenarien WHERE id = ?').get(szenario).status, 'laeuft');
  assert.equal(H.zaehle(app, 'funk_ereignisse', "szenario_id = ? AND code = 'status'", szenario), 0);
});

test('Schließen löscht das Szenario samt Rollen, Nachrichten, Ereignissen', () => {
  const { app, db, szenario } = aufbau();
  assert.equal(L.loesche(db, szenario), 1);
  for (const tab of ['funk_rollen', 'funk_nachrichten', 'funk_ereignisse']) assert.equal(H.zaehle(app, tab, 'szenario_id = ?', szenario), 0, tab);
  assert.ok(H.zaehle(app, 'funk_teilnahmen') > 0, 'Teilnahme (Abzeichen) bleibt');
  assert.equal(L.loesche(db, szenario), 0);
});

test('Kurs gesperrt (E111): vorbereitung → gelöscht ohne Teilnahme; laeuft → beendet mit Auswertung', () => {
  const a = aufbau();
  a.db.prepare("UPDATE funk_szenarien SET status = 'vorbereitung'").run();
  a.db.prepare('DELETE FROM funk_teilnahmen').run();
  L.kursGesperrt(a.db, a.k.id, '2026-10-13T10:00:00.000Z', {});
  assert.equal(H.zaehle(a.app, 'funk_szenarien'), 0);
  assert.equal(H.zaehle(a.app, 'funk_teilnahmen'), 0);
  const b = aufbau();
  L.kursGesperrt(b.db, b.k.id, '2026-10-13T10:00:00.000Z', {});
  assert.equal(b.db.prepare('SELECT status FROM funk_szenarien').get().status, 'auswertung');
  assert.ok(JSON.parse(b.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig).auswertung);
  // pausiert ebenso; eigener Beenden-Callback wird benutzt
  const c = aufbau();
  c.db.prepare("UPDATE funk_szenarien SET status = 'pausiert'").run();
  const gerufen = [];
  L.kursGesperrt(c.db, c.k.id, '2026-10-13T10:00:00.000Z', { beenden: (db, id, jetzt) => gerufen.push([id, jetzt]) });
  assert.deepEqual(gerufen, [[c.szenario, '2026-10-13T10:00:00.000Z']]);
});

test('24 h nach Anlage: Wartungsjob löscht auch ein beendetes Szenario', () => {
  const uhr = H.uhr();
  const app = H.makeApp({ now: uhr });
  const k = H.kurs(app);
  const s = H.konto(app, 'schueler', 'Mika R.');
  const b = H.befuelle(app, k, [H.teilnahme(app, k, s, 'Mika R.')]);
  app.locals.db.prepare('UPDATE funk_szenarien SET endet_spaetestens = ? WHERE id = ?').run(new Date(uhr() + 24 * 3600e3).toISOString(), b.szenario);
  L.beenden(app.locals.db, b.szenario, { jetzt: new Date(uhr()).toISOString() });
  uhr.vor(24 * 3600e3 - 1000);
  assert.equal(app.locals.wartung.lauf().anzahlen.funkraum, 0);
  uhr.vor(2000);
  assert.equal(app.locals.wartung.lauf().anzahlen.funkraum, 1);
  assert.equal(H.zaehle(app, 'funk_szenarien'), 0);
});
