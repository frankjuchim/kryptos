'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');

test('Liste: in der Werkstatt nur die eigene; ab Angriff alle ohne Schlüssel; Hinweise erst ab Beurteilung', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'werkstatt' });
  const liste = async (t) => (await f.teams[t].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200)).body;
  assert.deepEqual((await liste(0)).map((c) => c.eigene), [true]);
  await f.phase('angriff');
  const alle = await liste(0);
  assert.equal(alle.length, 2);
  const fremd = alle.find((c) => !c.eigene);
  assert.deepEqual(fremd.stufen.map((s) => [s.kuerzel, s.param]), [['CAE', { k: 'geheim' }]]);
  assert.equal('hinweise' in fremd, false);
  assert.ok(!JSON.stringify(alle).includes('LATERNE') && !JSON.stringify(alle).includes('klartext_hash'));
  await f.phase('beurteilung');
  assert.deepEqual((await liste(0)).find((c) => !c.eigene).hinweise.map((h) => h.p), [null]);
});

test('Beurteilung: nur in Phase beurteilung, nur eigenes Team sichtbar, Lehrkraft sieht alle', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'angriff' });
  const put = (t, text) => f.teams[t].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text });
  await put(0, 'Zu früh').expect(409);
  await f.phase('beurteilung');
  await put(0, 'x'.repeat(4001)).expect(400);
  await put(0, 'Insgesamt ist das Verfahren mäßig sicher, weil der Schlüsselraum klein ist.').expect(200);
  await put(1, 'Caesar allein fällt in Minuten.').expect(200);
  const a0 = (await f.teams[0].c.get('/api/arena').expect(200)).body;
  assert.match(a0.eigene.beurteilung, /mäßig sicher/);
  assert.ok(!JSON.stringify(a0).includes('Minuten') && !JSON.stringify((await f.teams[0].c.get(`/api/arena/${f.arenaId}/chiffren`)).body).includes('Minuten'));
  const lk = (await f.lk.get(`/api/lehrer/arena/${f.arenaId}`).expect(200)).body;
  assert.deepEqual(lk.chiffren.map((c) => !!c.beurteilung), [true, true]);
});

test('Beamer: ETag/304, Änderung nach Angriff → 200, keine Freitexte, Stufen erst ab Beurteilung', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'angriff', beschreibung: 'GEHEIME BESCHREIBUNG' });
  const r1 = await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200);
  await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).set('If-None-Match', r1.headers.etag).expect(304);
  await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200);
  const r2 = await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).set('If-None-Match', r1.headers.etag).expect(200);
  assert.notEqual(r2.headers.etag, r1.headers.etag);
  assert.deepEqual(r2.body.ticker.map((t) => [t.von, t.ziel]), [['Team Skytale', 'Team Scheibe']]);
  assert.ok(!JSON.stringify(r2.body).includes('GEHEIME BESCHREIBUNG'));
  assert.equal(r2.body.karten[0].stufen, undefined);
  await f.phase('beurteilung');
  assert.deepEqual((await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200)).body.karten.map((k) => k.stufen), [['VIG', 'SPA'], ['CAE']]);
});

test('Rückblick: geknacktVon, Zeit, Versuche je Team (Lehrkraft); Beamer in der Werkstatt ohne Geheimtext; Rechte; kein Hash/Salz', async () => {
  const H = require('./helpers');
  const f = await F.arenaMitChiffren(3, { phase: 'werkstatt' });
  const beamer = async () => (await f.lk.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(200)).body;
  const w = await beamer();
  assert.deepEqual(w.karten.map((k) => [k.team.name, k.ausschnitt, k.name]), [['Team Skytale', null, null], ['Team Scheibe', null, null], ['Team Quadrat', null, null]]);
  await f.phase('angriff');
  assert.equal((await beamer()).karten[0].ausschnitt, 'MRESE IEAUI SIRUT ' + (await f.lk.get(`/api/lehrer/arena/${f.arenaId}`)).body.chiffren[0].geheimtext.slice(18, 29) + '…');
  await f.angriff(0, 1, { klartext: 'falsch' }).expect(200);
  f.uhr.vor(45_000);
  await f.angriff(0, 1, { klartext: F.TEXT2 }).expect(200);
  f.uhr.vor(5_000);
  await f.angriff(2, 1, { schluessel: { k: 7 } }).expect(200);
  await f.angriff(1, 0, { klartext: 'falsch' }).expect(200);
  // ohne Team 403, Team ohne Chiffre 409 beim Beurteilen, Beurteilung nur Leerzeichen 400
  const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
  await ohne.get(`/api/arena/${f.arenaId}/chiffren`).expect(403);
  await f.phase('beurteilung');
  await f.teams[0].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text: '   ' }).expect(400);
  const liste = (await f.teams[0].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200)).body;
  const scheibe = liste.find((c) => c.team.name === 'Team Scheibe');
  assert.deepEqual([scheibe.geknacktVon.map((t) => t.name), scheibe.geknacktNachSek, scheibe.versuche], [['Team Skytale', 'Team Quadrat'], 45, 3]);
  const lk = (await f.lk.get(`/api/lehrer/arena/${f.arenaId}`).expect(200)).body;
  assert.deepEqual(lk.chiffren.find((c) => c.team.name === 'Team Scheibe').versucheJeTeam, { [f.teams[0].id]: { gesamt: 2, erfolg: 1 }, [f.teams[2].id]: { gesamt: 1, erfolg: 1 } });
  const b = await beamer();
  assert.deepEqual(b.ticker.map((t) => [t.von, t.ziel]), [['Team Skytale', 'Team Scheibe'], ['Team Quadrat', 'Team Scheibe']]);
  assert.deepEqual(b.karten.map((k) => [k.geknackt, k.angriffe, k.sekunden]), [[false, 1, null], [true, 3, 45], [false, 0, null]]);
  const geheim = f.db.prepare('SELECT a.salz, c.klartext_hash FROM arena a JOIN arena_chiffren c ON c.arena_id = a.id').all();
  for (const body of [liste, lk, b]) for (const g of geheim) assert.ok(!JSON.stringify(body).includes(g.salz) && !JSON.stringify(body).includes(g.klartext_hash));
  // fremde Lehrkraft 404; gesperrter Kurs: Beamer und Ansicht lesbar, Beurteilen 403
  const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
  await fremd.get(`/api/lehrer/arena/${f.arenaId}`).expect(404);
  await fremd.get(`/api/lehrer/arena/${f.arenaId}/beamer`).expect(404);
  f.db.prepare('UPDATE kurse SET aktiv = 0').run();
  await beamer();
  await f.lk.get(`/api/lehrer/arena/${f.arenaId}`).expect(200);
  await f.teams[0].c.put(`/api/arena/${f.arenaId}/beurteilung`).send({ text: 'Gut' }).expect(403);
});

test('Liste: Schlüsselfelder je Platzhalter (Name, Art, Bereich, Stufen) für den Angriff per Schlüssel – nie Werte', async () => {
  const f = await F.arenaMitChiffren(2, { phase: 'angriff' });
  const alle = (await f.teams[1].c.get(`/api/arena/${f.arenaId}/chiffren`).expect(200)).body;
  const funk = alle.find((c) => c.name === 'FUNKGITTER');
  // $wort in VIG (1–20) und SPA (2–10): gemeinsamer Bereich 2–10
  assert.deepEqual(funk.schluesselFelder, [{ name: 'wort', art: 'wort', min: 2, max: 10, stufen: [1, 2] }]);
  assert.deepEqual(alle.find((c) => c.name === 'Nur Caesar').schluesselFelder, [{ name: 'k', art: 'zahl', min: 0, max: 25, stufen: [1] }]);
  assert.ok(!JSON.stringify(alle).includes('LATERNE'));
  // Angriff mit genau diesen Feldern
  assert.equal((await f.angriff(1, 0, { schluessel: { wort: 'LATERNE' } }).expect(200)).body.erfolg, true);
});
