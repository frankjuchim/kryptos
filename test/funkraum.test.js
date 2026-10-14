'use strict';
// Funkraum: Zustandsautomat, Szenario-Konfiguration, Rollenvorschlag, Regie-Routen (Plan M7 Task 134, TECHNIK §12.1/§12.2, E107).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const S = require('../src/krypto/funkraum/szenarien');
const WETT = require('node:path').join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json'); // Option ab Task 138

test('Rollenvorschlag (E107): Paare aus kleinen Nummern, Sonderrolle für die höchsten', () => {
  const t = (n) => Array.from({ length: n }, (_, i) => ({ id: 100 + i, nr: i + 1 }));
  const kurz = (r) => r.map((x) => `${x.teamId}:${x.rolle}${x.partnerId ? '>' + x.partnerId : ''}`).join(' ');
  assert.equal(kurz(S.rollenVorschlag('botenlauf', t(3))), '100:alice>101 101:bob>100 102:eve');
  assert.equal(kurz(S.rollenVorschlag('botenlauf', t(4))), '100:alice>101 101:bob>100 102:eve 103:eve');
  assert.equal(kurz(S.rollenVorschlag('mallory', t(5))), '100:alice>101 101:bob>100 102:alice>103 103:bob>102 104:mallory');
  assert.equal(kurz(S.rollenVorschlag('wettknacken', t(2))), '100:knacker 101:knacker');
});

test('Rollen prüfen: Paar nicht gegenseitig, drei Eve, zu wenige Teams, fremdes Team → 400', () => {
  const ids = [1, 2, 3, 4, 5];
  assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 3 }, { teamId: 3, rolle: 'eve' }], ids), /Paar/);
  assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'eve' }, { teamId: 4, rolle: 'eve' }, { teamId: 5, rolle: 'eve' }], ids), /höchstens 2/);
  assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }], ids), /mindestens 3/);
  assert.throws(() => S.pruefeRollen('botenlauf', [{ teamId: 9, rolle: 'eve' }], ids), /Team/);
});

test('Zustandsautomat: erlaubte Übergänge, alles andere 409; version steigt; höchstens ein Szenario je Kurs', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.anlegen(f, 'botenlauf');
  assert.equal(sz.status, 'vorbereitung');
  assert.equal('salz' in sz, false);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'mallory' }).expect(409);
  const schritte = [['pausieren', 409], ['phase', 409], ['beenden', 409], ['starten', 200], ['starten', 409], ['phase', 200], ['pausieren', 200], ['phase', 409], ['fortsetzen', 200], ['phase', 200], ['phase', 200], ['phase', 409], ['beenden', 200], ['fortsetzen', 409], ['schliessen', 200]];
  let v = sz.version;
  for (const [a, code] of schritte) {
    const r = await F.aktion(f, sz.id, a).expect(code);
    if (code === 200 && a !== 'schliessen') { assert.ok(r.body.version > v, a); v = r.body.version; }
  }
  assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario, null);
});

test('Phasen Botenlauf laut E91; Rollen tauschen nur in vorbereitung; abbrechen löscht', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.anlegen(f, 'botenlauf');
  const [a, b, c] = f.teams.map((t) => t.id);
  await f.lk.put(`/api/lehrer/funk/${sz.id}/rollen`).send({ rollen: [{ teamId: c, rolle: 'alice', partnerId: b }, { teamId: b, rolle: 'bob', partnerId: c }, { teamId: a, rolle: 'eve' }] }).expect(200);
  const gest = (await F.aktion(f, sz.id, 'starten').expect(200)).body;
  assert.deepEqual([gest.phase, gest.phasen], ['runde-1', ['runde-1', 'runde-2', 'runde-3', 'aufloesung']]);
  await f.lk.put(`/api/lehrer/funk/${sz.id}/rollen`).send({ rollen: [] }).expect(409);
  const f2 = await F.kursMitTeams(3);
  const sz2 = await F.anlegen(f2, 'mallory');
  await F.aktion(f2, sz2.id, 'abbrechen').expect(200);
  assert.equal(f2.db.prepare('SELECT COUNT(*) AS n FROM funk_szenarien').get().n, 0);
});

test('Anlegen: zu wenige Teams, unbekannter Typ → 400; 24-h-Frist gesetzt; fremde Lehrkraft 404; gesperrter Kurs 403', async () => {
  const f = await F.kursMitTeams(2, { extra: { funkraumDatei: WETT } });
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'botenlauf' }).expect(400);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'abi-duell' }).expect(400);
  const sz = await F.anlegen(f, 'wettknacken');
  const zeile = f.db.prepare('SELECT * FROM funk_szenarien WHERE id = ?').get(sz.id);
  assert.equal(Date.parse(zeile.endet_spaetestens) - Date.parse(zeile.created_at), 24 * 3600e3);
  const H = require('./helpers');
  const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
  await fremd.post(`/api/lehrer/funk/${sz.id}/status`).send({ aktion: 'starten' }).expect(404);
  f.db.prepare('UPDATE kurse SET aktiv = 0').run();
  await F.aktion(f, sz.id, 'starten').expect(403);
});

test('Kurs gesperrt (Verbund): laufendes Szenario wird über den Funkraum-Dienst beendet, Teilnahmen vermerkt (E111)', async () => {
  const request = require('supertest');
  const H = require('./helpers');
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const kurs = f.kurs.kurs;
  await request(f.app).post(`/api/verbund/kurse/${encodeURIComponent(kurs)}`).set('Authorization', 'Bearer ' + H.verbundToken('kurs-aendern', {}, { app: f.app })).send({ aktiv: false }).expect(200);
  const zeile = f.db.prepare('SELECT status, konfig FROM funk_szenarien WHERE id = ?').get(sz.id);
  assert.equal(zeile.status, 'auswertung');
  assert.deepEqual(Object.keys(JSON.parse(zeile.konfig)), ['auswertung']);
  assert.deepEqual(Object.keys(JSON.parse(zeile.konfig).auswertung), ['zeilen', 'je'], 'typ-spezifische Auswertung des Botenlaufs (Task 137)');
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM funk_teilnahmen WHERE typ = 'botenlauf'").get().n, 3);
  // Regie liest weiter (gesperrter Kurs: nur lesend), Status-Aktionen → 403; Schließen (löschen) bleibt erlaubt (Review M7 K1)
  assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario.status, 'auswertung');
  await F.aktion(f, sz.id, 'pausieren').expect(403);
  await F.aktion(f, sz.id, 'schliessen').expect(200);
});

test('Optionen je Typ: unbekannte Option oder fremdes Team → 400; Regie-Ansicht ohne Salz', async () => {
  const f = await F.kursMitTeams(3);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'botenlauf', optionen: { wiederholerTeamId: f.teams[0].id } }).expect(400);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'doppelter-schluessel', optionen: { wiederholerTeamId: 999 } }).expect(400);
  const sz = await F.anlegen(f, 'doppelter-schluessel', { optionen: { wiederholerTeamId: f.teams[0].id } });
  assert.deepEqual(sz.optionen, { wiederholerTeamId: f.teams[0].id });
  const text = JSON.stringify((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body);
  const salz = JSON.parse(f.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig).salz;
  assert.ok(salz && !text.includes(salz) && !text.includes('salz'));
});
