'use strict';
// Funkraum: Polling-Protokoll (200/304/seit, ETag), Sichtbarkeit je Rolle, Rate-Limits (Plan M7 Task 135, TECHNIK §12.4, E99, E109, E110).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');

function einfuegen(f, szId, von, an, inhalt, art = 'nachricht') {
  const db = f.db;
  return db.transaction(() => {
    db.prepare('UPDATE funk_szenarien SET version = version + 1 WHERE id = ?').run(szId);
    const v = db.prepare('SELECT version FROM funk_szenarien WHERE id = ?').get(szId).version;
    const sid = db.prepare('SELECT schueler_id FROM team_mitglieder WHERE team_id = ?').get(von).schueler_id;
    return Number(db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, von_schueler_id, art, inhalt, klartext_hash, version, zeit) VALUES (?, ?, ?, ?, ?, ?, 'deadbeef', ?, '2026-10-13T08:00:00Z')").run(szId, von, an, sid, art, inhalt, v).lastInsertRowid);
  })();
}

test('200 mit ETag, 304 bei If-None-Match und bei seit = Version; Neues nur mit version > seit', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  const r1 = await F.stand(alice.c, sz.id, 0).expect(200);
  assert.match(r1.headers.etag, new RegExp(`^"${sz.id}-\\d+"$`));
  await alice.c.get(`/api/funk/${sz.id}/stand?seit=0`).set('If-None-Match', r1.headers.etag).expect(304);
  await F.stand(alice.c, sz.id, r1.body.version).expect(304);
  einfuegen(f, sz.id, alice.id, bob.id, 'OHSAL AKLUW HZZ');
  const r2 = await F.stand(alice.c, sz.id, r1.body.version).expect(200);
  assert.deepEqual(r2.body.nachrichten.map((n) => n.inhalt), ['OHSAL AKLUW HZZ']);
  assert.equal(r2.body.ich.rolle, 'alice');
  assert.equal(r2.body.ich.partner, bob.id);
  const ohneNeues = await F.stand(alice.c, sz.id, r2.body.version).expect(304);
  assert.equal(ohneNeues.text, '');
});

test('Vollstand bei seit fehlt/0/negativ/keine Zahl/größer als Version (E110)', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  einfuegen(f, sz.id, f.teams[0].id, f.teams[1].id, 'ABC');
  for (const q of ['', '?seit=0', '?seit=-3', '?seit=abc', '?seit=999999']) {
    const r = await f.teams[0].c.get(`/api/funk/${sz.id}/stand${q}`).expect(200);
    assert.equal(r.body.nachrichten.length, 1, q);
  }
});

test('Sichtbarkeit: Alice/Bob eigene, Eve alle, nie Hash oder Schüler-id', async () => {
  const f = await F.kursMitTeams(5);
  const sz = await F.starte(f, 'botenlauf'); // 1↔2, 3↔4, 5 = Eve
  const [t1, t2, t3, t4, t5] = f.teams;
  einfuegen(f, sz.id, t1.id, t2.id, 'AAA');
  einfuegen(f, sz.id, t3.id, t4.id, 'BBB');
  const sicht = async (t) => (await F.stand(t.c, sz.id)).body.nachrichten.map((n) => n.inhalt).sort();
  assert.deepEqual(await sicht(t1), ['AAA']);
  assert.deepEqual(await sicht(t4), ['BBB']);
  assert.deepEqual(await sicht(t5), ['AAA', 'BBB']);
  const text = JSON.stringify((await F.stand(t5.c, sz.id)).body);
  assert.ok(!/deadbeef|klartext_hash|von_schueler|schueler_id|salz/.test(text));
});

test('Ohne Team 403; Team ohne Rolle sieht nur den Rahmen; fremdes Szenario 404; GET /api/funk für den Kopfzeilen-Punkt', async () => {
  const H = require('./helpers');
  const f = await F.kursMitTeams(4);
  const sz = await F.anlegen(f, 'botenlauf', { rollen: [{ teamId: f.teams[0].id, rolle: 'alice', partnerId: f.teams[1].id }, { teamId: f.teams[1].id, rolle: 'bob', partnerId: f.teams[0].id }, { teamId: f.teams[2].id, rolle: 'eve' }] });
  await F.aktion(f, sz.id, 'starten').expect(200);
  const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
  await F.stand(ohne, sz.id).expect(403);
  assert.deepEqual((await ohne.get('/api/funk').expect(200)).body.team, null);
  const frei = (await F.stand(f.teams[3].c, sz.id).expect(200)).body;
  assert.deepEqual([frei.ich.rolle, frei.nachrichten], [null, []]);
  assert.deepEqual((await f.teams[0].c.get('/api/funk').expect(200)).body.szenario.status, 'laeuft');
  // fremdes Szenario: zweiter Kurs in derselben App (eine zweite App hätte eine eigene Datenbank mit denselben ids)
  const k2 = await H.kursAnlegen(f.lk, 'LK 12 (eA)');
  const fremde = [];
  for (const n of ['Lea W.', 'Tom H.', 'Ela S.']) fremde.push(await H.schuelerClient(f.app, k2, n));
  const { TEAM_NAMEN } = require('../src/krypto/fach');
  await f.lk.put(`/api/lehrer/kurse/${k2.id}/teams`).send({ teams: fremde.map((c, i) => ({ nr: i + 1, name: TEAM_NAMEN[i], mitglieder: [c.id] })) }).expect(200);
  const szG = await F.starte({ ...f, kurs: k2 }, 'botenlauf');
  assert.notEqual(szG.id, sz.id);
  await F.stand(f.teams[0].c, szG.id).expect(404);
  await F.stand(fremde[0], sz.id).expect(404);
});

test('Rate-Limits: Stand 60/min je Teilnahme, /api/funk 6/min, Lehrkraft 120/min – 429 mit Retry-After', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  for (let i = 0; i < 60; i++) await F.stand(f.teams[0].c, sz.id).expect(200);
  const r = await F.stand(f.teams[0].c, sz.id).expect(429);
  assert.ok(Number(r.headers['retry-after']) >= 1);
  for (let i = 0; i < 6; i++) await f.teams[1].c.get('/api/funk').expect(200);
  await f.teams[1].c.get('/api/funk').expect(429);
  f.uhr.vor(60_000);
  await F.stand(f.teams[0].c, sz.id).expect(200);
  for (let i = 0; i < 120; i++) await F.regie(f, sz.id).expect(200);
  await F.regie(f, sz.id).expect(429);
});

test('Regie sieht alles, Beamer-Sicht ist öffentlich (E99) – hier Botenlauf: beide sehen Geheimtexte', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  einfuegen(f, sz.id, f.teams[0].id, f.teams[1].id, 'OHSAL');
  assert.deepEqual((await F.regie(f, sz.id)).body.nachrichten.map((n) => n.inhalt), ['OHSAL']);
  assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.nachrichten.map((n) => n.inhalt), ['OHSAL']);
  await f.lk.get(`/api/lehrer/funk/${sz.id}/stand?ansicht=alles`).expect(400);
});

test('Stand-Abfragen schreiben nichts; Regie und Beamer haben getrennte ETags; Antwortform', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const vorher = f.db.prepare('SELECT version, konfig FROM funk_szenarien WHERE id = ?').get(sz.id);
  const r = (await F.stand(f.teams[2].c, sz.id).expect(200)).body;
  for (const feld of ['id', 'typ', 'version', 'status', 'phase', 'phasen', 'ich', 'teams', 'nachrichten', 'ereignisse', 'anzeigen', 'werkzeuge', 'boss', 'auswertung']) assert.ok(feld in r, feld);
  assert.deepEqual(r.ich.team, { id: f.teams[2].id, nr: 3, name: f.teams[2].name });
  assert.equal(r.ich.rolle, 'eve');
  assert.ok(r.ereignisse.every((e) => /^[a-z-]+$/.test(e.code)));
  const regie = await F.regie(f, sz.id).expect(200);
  const beamer = await F.regie(f, sz.id, 0, 'beamer').expect(200);
  assert.notEqual(regie.headers.etag, beamer.headers.etag);
  await f.lk.get(`/api/lehrer/funk/${sz.id}/stand?ansicht=beamer`).set('If-None-Match', beamer.headers.etag).expect(304);
  assert.deepEqual(f.db.prepare('SELECT version, konfig FROM funk_szenarien WHERE id = ?').get(sz.id), vorher);
});

test('QR-Code für den Beamer (Task 155, E114): nur Lehrkraft, SVG ohne Skript, ziel funkraum|werkstatt', async () => {
  const f = await F.kursMitTeams(2);
  const r = await f.lk.get('/api/lehrer/qr.svg?ziel=funkraum').expect(200);
  assert.match(r.headers['content-type'], /^image\/svg\+xml/);
  assert.equal(r.headers['cache-control'], 'no-store');
  const svg = r.text || (r.body && r.body.toString());
  assert.match(svg, /^<svg/);
  assert.doesNotMatch(svg, /<script/i);
  await f.lk.get('/api/lehrer/qr.svg?ziel=werkstatt').expect(200);
  await f.lk.get('/api/lehrer/qr.svg?ziel=x').expect(400);
  await f.lk.get('/api/lehrer/qr.svg').expect(400);
  await f.teams[0].c.get('/api/lehrer/qr.svg?ziel=funkraum').expect(401);
  const QR = require('qrcode');
  const erwartet = await QR.toString('http://kryptos.test/funkraum', { type: 'svg', margin: 1 });
  const g = await F.kursMitTeams(2, { extra: { plattformUrl: 'http://kryptos.test' } });
  const r2 = await g.lk.get('/api/lehrer/qr.svg?ziel=funkraum').expect(200);
  assert.equal(r2.text || r2.body.toString(), erwartet, 'QR-Code auf PLATTFORM_URL + /funkraum');
});
