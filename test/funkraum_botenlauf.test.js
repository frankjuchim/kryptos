'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const K = require('../public/static/js/shared/krypto.js');

test('Botenlauf: drei Runden, Quittung, Eve knackt, Sonderkarte, Auswertung je Runde, Beenden löscht', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  const sende = (t, text, klartext) => t.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext });
  // Klartext gesendet → 400
  assert.match((await sende(alice, 'haltet den pass', 'haltet den pass').expect(400)).body.error, /verschlüssele zuerst/);
  // Runde 1: k = 7
  const g1 = K.gruppieren(K.caesar('haltet den pass', 7)); // OHSAL AKLUW HZZ
  const n1 = (await sende(alice, g1, 'haltet den pass').expect(200)).body.nachricht;
  await bob.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n1.id, klartext: 'haltet den pass' }).expect(200);
  f.uhr.vor(10_000);
  const q1 = (await sende(bob, K.gruppieren(K.caesar('befehl erhalten', 7)), 'befehl erhalten').expect(200)).body.nachricht;
  assert.equal(q1.an, alice.id);
  f.uhr.vor(60_000);
  assert.equal((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n1.id, klartext: K.caesar(g1.replace(/ /g, ''), 7, 'ent') }).expect(200)).body.richtig, true);
  // Eve-Werkzeug: Scheibe mit Brute-Force-Reiter, eingebettet (E98)
  assert.deepEqual((await F.stand(eve.c, sz.id)).body.werkzeuge, [{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }]);
  // Runde 2 und 3 (Sonderkarte nur in Runde 3, nur Alice-Team)
  await F.aktion(f, sz.id, 'phase').expect(200);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'zaun' }).expect(409);
  await F.aktion(f, sz.id, 'phase').expect(200);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: eve.id, karte: 'zaun' }).expect(400);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'zaun' }).expect(200);
  f.uhr.vor(10_000);
  const n3 = (await sende(alice, K.gruppieren(K.gartenzaun('schickt zwei kohorten', 3)), 'schickt zwei kohorten').expect(200)).body.nachricht;
  await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
  await sende(alice, 'ABC', 'x').expect(409);
  const ausw = (await F.regie(f, sz.id)).body.anzeigen.auswertung;
  assert.deepEqual(ausw.zeilen.map((z) => [z.nachricht, z.runde, z.angekommen, z.geknackt, z.besonderheit]), [[n1.id, 1, true, true, null], [q1.id, 1, false, false, null], [n3.id, 3, false, false, 'zaun']]);
  assert.equal(ausw.zeilen[0].sekunden, 70);
  // Beenden: Inhalte weg, Auswertung bleibt, Teilnahme für alle drei Teams
  await F.aktion(f, sz.id, 'beenden').expect(200);
  for (const nadel of ['OHSAL', 'ILMLO']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM funk_teilnahmen WHERE typ = 'botenlauf'").get().n, 3);
  assert.equal((await F.stand(alice.c, sz.id)).body.auswertung.zeilen.length, 3);
});

test('Botenlauf: Sicht – Alice, Bob und Eve sehen die Nachricht genau einmal, Beamer sieht Geheimtexte, keine Hashes', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  await alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
  for (const c of [alice.c, bob.c, eve.c]) assert.equal((await F.stand(c, sz.id)).body.nachrichten.length, 1);
  const beamer = JSON.stringify((await F.regie(f, sz.id, 0, 'beamer')).body);
  assert.ok(beamer.includes('OHSAL AKLUW HZZ') && !/[0-9a-f]{64}/.test(beamer));
});

test('Botenlauf: Runde bleibt die Sende-Runde, auch wenn Eve erst später knackt; Sonderkarte prüft Karte und Typ', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, , eve] = f.teams;
  const n1 = (await alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200)).body.nachricht;
  await F.aktion(f, sz.id, 'phase').expect(200); // runde-2
  f.uhr.vor(30_000);
  assert.equal((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n1.id, klartext: 'haltet den pass' }).expect(200)).body.richtig, true);
  await F.aktion(f, sz.id, 'phase').expect(200); // runde-3
  await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'vigenere' }).expect(400);
  await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
  const ausw = (await F.regie(f, sz.id)).body.anzeigen;
  assert.deepEqual(ausw.auswertung.zeilen.map((z) => [z.runde, z.geknackt, z.sekunden]), [[1, true, 30]]);
  assert.deepEqual(ausw.auswertung.je, { 1: { gesendet: 1, geknackt: 1 }, 2: { gesendet: 0, geknackt: 0 }, 3: { gesendet: 0, geknackt: 0 } });
  assert.match(ausw.merksatz, /Kerckhoffs/);
  assert.equal((await F.stand(alice.c, sz.id)).body.anzeigen.auswertung, undefined, 'Teams sehen die Auswertung erst nach dem Beenden');
  // Sonderkarte gibt es nur im Botenlauf
  const g = await F.kursMitTeams(3);
  const sm = await F.starte(g, 'mallory');
  await g.lk.post(`/api/lehrer/funk/${sm.id}/sonderkarte`).send({ teamId: g.teams[0].id, karte: 'zaun' }).expect(400);
});

test('Botenlauf: Ereignis „sonderkarte“ (mit Team-id) erreicht keine Schüler-Teams und den Beamer erst in der Auflösung', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice] = f.teams;
  await F.aktion(f, sz.id, 'phase').expect(200); // runde-2
  await F.aktion(f, sz.id, 'phase').expect(200); // runde-3
  await f.lk.post(`/api/lehrer/funk/${sz.id}/sonderkarte`).send({ teamId: alice.id, karte: 'zaun' }).expect(200);
  const codes = (b) => b.ereignisse.map((e) => e.code);
  for (const t of f.teams) {
    const b = (await F.stand(t.c, sz.id)).body;
    assert.ok(!codes(b).includes('sonderkarte'), `Team ${t.id} sieht keine Sonderkarte`);
    assert.doesNotMatch(JSON.stringify(b), /sonderkarte/);
  }
  assert.ok(!codes((await F.regie(f, sz.id, 0, 'beamer')).body).includes('sonderkarte'), 'Beamer vor der Auflösung ohne Sonderkarte');
  assert.ok(codes((await F.regie(f, sz.id)).body).includes('sonderkarte'), 'Regie sieht die Sonderkarte');
  await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
  assert.ok(codes((await F.regie(f, sz.id, 0, 'beamer')).body).includes('sonderkarte'), 'Beamer in der Auflösung');
  for (const t of f.teams) assert.ok(!codes((await F.stand(t.c, sz.id)).body).includes('sonderkarte'));
});
