'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const { TEXT1, TEXT2, CAESAR } = F;

/** Arena in der Angriffsphase mit einer Chiffre je Team (Helfer aus hilfen_funk.js, Plan M7 Task 146) */
const angriffsphase = (n) => F.arenaMitChiffren(n);

test('Angriff per Klartext (Normalisierung, Umlaute) und per Schlüssel; eigene Chiffre 400; nichts gespeichert', async () => {
  const f = await angriffsphase(2);
  await f.angriff(0, 0, { klartext: TEXT1 }).expect(400);
  assert.deepEqual((await f.angriff(0, 1, { klartext: TEXT2.replace('Leuchtturm', 'Leuchtfeuer') }).expect(200)).body.erfolg, false);
  f.uhr.vor(30_000);
  const r = (await f.angriff(0, 1, { klartext: TEXT2.toUpperCase().replace(/[ ,.]/g, '') }).expect(200)).body;
  assert.deepEqual([r.erfolg, r.geknackt], [true, true]);
  assert.ok(f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at);
  assert.equal((await f.angriff(1, 0, { schluessel: { wort: 'LATERNA' } }).expect(200)).body.erfolg, false);
  f.uhr.vor(30_000);
  await f.angriff(1, 0, { schluessel: { x: 'A' } }).expect(400);
  assert.equal((await f.angriff(1, 0, { schluessel: { wort: 'LATERNE' } }).expect(200)).body.erfolg, true);
  await f.angriff(1, 0, { klartext: 'a', schluessel: { wort: 'A' } }).expect(400);
  assert.deepEqual(f.db.prepare('SELECT art, erfolg FROM arena_versuche ORDER BY id').all().map((v) => [v.art, v.erfolg]), [['klartext', 0], ['klartext', 1], ['schluessel', 0], ['schluessel', 1]]);
  for (const nadel of ['LEUCHTFEUER', 'Leuchtfeuer', 'LATERNA', 'LATERNE', 'DERLEUCHTTURM']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
});

test('Grenzen: 1 je 30 s je Team und Chiffre; 60 je Team in 10 min über alle Chiffren (E101)', async () => {
  const f = await angriffsphase(5);
  await f.angriff(0, 1, { klartext: 'falsch' }).expect(200);
  const r = await f.angriff(0, 1, { klartext: 'falsch' }).expect(429);
  assert.match(r.body.error, /30 Sekunden/);
  assert.ok(Number(r.headers['retry-after']) >= 1);
  await f.angriff(0, 2, { klartext: 'falsch' }).expect(200); // andere Chiffre geht
  await f.angriff(1, 2, { klartext: 'falsch' }).expect(200); // anderes Team geht
  let n = 2;
  for (let runde = 1; n < 60; runde++) {
    f.uhr.vor(30_000);
    for (const ziel of [1, 2, 3, 4]) if (n < 60) { await f.angriff(0, ziel, { klartext: 'falsch' }).expect(200); n++; } // n = 60 nach Runde 15 (t0 + 450 s)
  }
  const zuViel = await f.angriff(0, 3, { klartext: 'falsch' }).expect(429); // Chiffre 3 in dieser Runde noch frei, Team-Grenze erreicht
  assert.match(zuViel.body.error, /60 Angriffe/);
});

test('Falsche Phase 409, fremde Arena 404, nach geknackt weiter angreifbar ohne zweites geknackt_at', async () => {
  const f = await angriffsphase(2);
  await f.angriff(0, 1, { klartext: TEXT2 }).expect(200);
  const erst = f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at;
  f.uhr.vor(30_000);
  assert.equal((await f.angriff(0, 1, { klartext: TEXT2 }).expect(200)).body.geknackt, true);
  assert.equal(f.db.prepare('SELECT geknackt_at FROM arena_chiffren WHERE id = ?').get(f.cid(1)).geknackt_at, erst);
  // fremde Arena: zweiter Kurs in derselben App (eine zweite App hätte eine eigene Datenbank mit denselben ids)
  const H = require('./helpers');
  const k2 = await H.kursAnlegen(f.lk, 'GK 12 (gA)');
  const a2 = (await f.lk.post(`/api/lehrer/kurse/${k2.id}/arena`).send({}).expect(200)).body;
  await f.teams[0].c.post(`/api/arena/${a2.id}/chiffren/${f.cid(1)}/angriff`).send({ klartext: 'x' }).expect(404);
  await f.teams[0].c.post(`/api/arena/${f.arenaId}/chiffren/999/angriff`).send({ klartext: 'x' }).expect(404);
  await f.lk.post(`/api/lehrer/arena/${f.arenaId}/phase`).send({ phase: 'beurteilung' }).expect(200);
  f.uhr.vor(30_000);
  await f.angriff(1, 0, { klartext: TEXT1 }).expect(409);
});

test('XOR-Chiffre per Schlüssel, rest-Angaben, Schlüssel-Form, abgelehnte Versuche zählen nicht, Rechte', async () => {
  const H = require('./helpers');
  const ZAUN_XOR = { version: 1, name: 'Zaun und XOR', stufen: [{ typ: 'gartenzaun', param: { zeilen: 3 } }, { typ: 'xor', param: { schluessel: '$w' } }] };
  const f = await F.kursMitTeams(2);
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  await f.teams[0].c.post(`/api/arena/${a.id}/chiffre`).send({ verfahren: ZAUN_XOR, schluessel: { w: 'FUNK' }, klartext: TEXT2, beschreibung: 'B' }).expect(200);
  await f.teams[1].c.post(`/api/arena/${a.id}/chiffre`).send({ verfahren: CAESAR, schluessel: { k: 7 }, klartext: TEXT2, beschreibung: 'B' }).expect(200);
  const vorPhase = await f.teams[1].c.post(`/api/arena/${a.id}/chiffren/1/angriff`).send({ klartext: TEXT2 });
  assert.equal(vorPhase.status, 409);
  await f.lk.post(`/api/lehrer/arena/${a.id}/phase`).send({ phase: 'angriff' }).expect(200);
  const cid = f.db.prepare('SELECT id FROM arena_chiffren WHERE team_id = ?').get(f.teams[0].id).id;
  const angriff = (body) => f.teams[1].c.post(`/api/arena/${a.id}/chiffren/${cid}/angriff`).send(body);
  for (const k of [{}, [], 'FUNK', { w: 'X'.repeat(27) }, { w: { x: 1 } }, Object.fromEntries([...Array(13)].map((_, i) => ['k' + i, 'A'])), { W: 'FUNK' }]) {
    await angriff({ schluessel: k }).expect(400);
  }
  await angriff({ klartext: '1234 !!' }).expect(400);
  await angriff({ schluessel: { w: 'FUNK', z: 3 } }).expect(400); // Schlüsselwert ohne Stufe
  const r1 = (await angriff({ schluessel: { w: 'FUNX' } }).expect(200)).body; // abgelehnte Versuche zählten nicht
  assert.deepEqual(r1, { erfolg: false, geknackt: false, rest: { chiffre: 30, team: 59 } });
  f.uhr.vor(10_000);
  const zu = await angriff({ schluessel: { w: 'FUNK' } }).expect(429);
  assert.equal(zu.headers['retry-after'], '20');
  f.uhr.vor(20_000);
  const r2 = (await angriff({ schluessel: { w: 'FUNK' } }).expect(200)).body;
  assert.deepEqual([r2.erfolg, r2.geknackt, r2.rest.team], [true, true, 58]);
  assert.deepEqual(F.fundstellen(f.db, 'FUNX'), []);
  // ohne Team 403, gesperrter Kurs 403
  const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
  await ohne.post(`/api/arena/${a.id}/chiffren/${cid}/angriff`).send({ klartext: TEXT2 }).expect(403);
  f.db.prepare('UPDATE kurse SET aktiv = 0').run();
  f.uhr.vor(30_000);
  await angriff({ klartext: TEXT2 }).expect(403);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM arena_versuche').get().n, 2);
});
