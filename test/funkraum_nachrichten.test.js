'use strict';
// Funkraum: Senden, Empfang und Knacken über Hash, Ausblenden, Stummschalten (Plan M7 Task 136, TECHNIK §12.3/§12.5, E108, E109).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const sende = (t, id, body) => t.c.post(`/api/funk/${id}/nachrichten`).send(body);

test('Senden: Whitelist über die Route, Kleinbuchstaben groß, Klartext nur als Hash gespeichert', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice] = f.teams;
  await sende(alice, sz.id, { text: 'grüße', klartext: 'x' }).expect(400);
  await sende(alice, sz.id, { text: 'X'.repeat(161), klartext: 'x' }).expect(400);
  const r = await sende(alice, sz.id, { text: 'ohsal aklUW hzz', klartext: 'haltet den pass' }).expect(200);
  assert.equal(r.body.nachricht.inhalt, 'OHSAL AKLUW HZZ');
  assert.deepEqual(F.fundstellen(f.db, 'HALTETDENPASS'), []);
  assert.deepEqual(F.fundstellen(f.db, 'haltet den pass'), []);
  assert.match(f.db.prepare('SELECT klartext_hash FROM funk_nachrichten').get().klartext_hash, /^[0-9a-f]{64}$/);
});

test('Grenzen: 1 je Team in 10 s, stumm 60 s, pausiert 409, 200 je Szenario', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob] = f.teams;
  await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(200);
  const r = await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(429);
  assert.ok(Number(r.headers['retry-after']) >= 1);
  await sende(bob, sz.id, { text: 'ILMLO', klartext: 'befehl' }).expect(200); // anderes Team ist frei
  await f.lk.post(`/api/lehrer/funk/${sz.id}/teams/${alice.id}/stumm`).send({ sekunden: 60 }).expect(200);
  f.uhr.vor(10_000);
  assert.match((await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(429)).body.error, /stummgeschaltet/);
  f.uhr.vor(60_000);
  await F.aktion(f, sz.id, 'pausieren').expect(200);
  await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(409);
  await F.aktion(f, sz.id, 'fortsetzen').expect(200);
  const zahl = f.db.prepare('SELECT COUNT(*) AS n FROM funk_nachrichten').get().n;
  const st = f.db.prepare("INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, von_schueler_id, art, inhalt, version, zeit) VALUES (?, ?, ?, ?, 'nachricht', 'X', 1, 'z')");
  for (let i = zahl; i < 200; i++) st.run(sz.id, alice.id, bob.id, alice.c.id);
  await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(409);
});

test('Empfangen und Knacken über Hash (Normalform mit Ziffern), erster Treffer zählt, Versuche begrenzt', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  const n = (await sende(alice, sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200)).body.nachricht;
  assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'HALTET DEN PAS' }).expect(200)).body, { richtig: false });
  assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'Haltet den Pass!' }).expect(200)).body, { richtig: true });
  await eve.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'x' }).expect(403); // nicht Empfänger
  await bob.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'x' }).expect(403);    // nicht Eve
  f.uhr.vor(95_000);
  assert.deepEqual((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'haltet den pass' }).expect(200)).body, { richtig: true });
  const st = (await F.regie(f, sz.id)).body;
  assert.deepEqual([st.nachrichten[0].angekommen, st.nachrichten[0].geknackt], [true, true]);
  assert.equal(st.ereignisse.find((e) => e.code === 'geknackt').daten.sekunden, 95);
  for (let i = 0; i < 29; i++) await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'falsch' }).expect(200); // 1 + 29 = 30
  await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'falsch' }).expect(429);
  assert.deepEqual(F.fundstellen(f.db, 'FALSCH'), []);
});

test('Ausblenden leert den Inhalt sofort; Polling mit seit liefert die Nachricht erneut (E109)', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  const n = (await sende(alice, sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200)).body.nachricht;
  const v = (await F.stand(eve.c, sz.id)).body.version;
  await f.lk.post(`/api/lehrer/funk/${sz.id}/nachrichten/${n.id}/ausblenden`).send({}).expect(200);
  const zeile = f.db.prepare('SELECT * FROM funk_nachrichten WHERE id = ?').get(n.id);
  assert.deepEqual([zeile.inhalt, zeile.klartext_hash, zeile.sichtbar], ['', null, 0]);
  const neu = (await F.stand(eve.c, sz.id, v).expect(200)).body.nachrichten;
  assert.deepEqual(neu.map((x) => [x.id, x.inhalt, x.ausgeblendet]), [[n.id, '', true]]);
  assert.deepEqual((await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'haltet den pass' }).expect(200)).body, { richtig: false });
});

test('Ereignisse enthalten nur Codes und Zahlen', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  await sende(f.teams[0], sz.id, { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
  for (const e of f.db.prepare('SELECT code, daten FROM funk_ereignisse').all()) {
    assert.match(e.code, /^[a-z-]+$/);
    assert.match(e.daten, /^[{}\[\]":,a-z0-9._-]*$/i);
    assert.ok(!e.daten.includes('OHSAL'));
  }
});

test('Rechte und Eingaben: Eve sendet nicht, an nur Partner, Klartext Pflicht, stumm 1–300 s, beendet 409, fremde Lehrkraft 404', async () => {
  const H = require('./helpers');
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  await sende(eve, sz.id, { text: 'ABC', klartext: 'abc' }).expect(403);
  await sende(alice, sz.id, { text: 'ABC', klartext: 'abc', an: eve.id }).expect(400);
  await sende(alice, sz.id, { text: 'ABC' }).expect(400);
  await sende(alice, sz.id, { text: 'ABC', klartext: '' }).expect(400);
  for (const sekunden of [0, 301, 'x', 1.5]) await f.lk.post(`/api/lehrer/funk/${sz.id}/teams/${alice.id}/stumm`).send({ sekunden }).expect(400);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/teams/999999/stumm`).send({ sekunden: 60 }).expect(404);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/nachrichten/999999/ausblenden`).send({}).expect(404);
  const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
  await fremd.post(`/api/lehrer/funk/${sz.id}/teams/${alice.id}/stumm`).send({ sekunden: 60 }).expect(404);
  const n = (await sende(alice, sz.id, { text: 'OHSAL', klartext: 'haltet' }).expect(200)).body.nachricht;
  await alice.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n.id, klartext: 'haltet' }).expect(403);
  await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: 999999, klartext: 'haltet' }).expect(404);
  // Stand zeigt die Stummschaltung dem eigenen Team
  await f.lk.post(`/api/lehrer/funk/${sz.id}/teams/${bob.id}/stumm`).send({ sekunden: 30 }).expect(200);
  assert.ok((await F.stand(bob.c, sz.id)).body.ich.stummBis);
  assert.equal((await F.stand(alice.c, sz.id)).body.ich.stummBis, null);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/nachrichten/${n.id}/ausblenden`).send({}).expect(409);
  await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'haltet' }).expect(409);
  assert.deepEqual(F.fundstellen(f.db, 'OHSAL'), []);
});
