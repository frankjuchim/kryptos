'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const K = require('../public/static/js/shared/krypto.js');
// Schlüsselblock: Abschnitt 1 beginnt mit dem Demonstrationsschlüssel aus W3 §9.3
const DEMO = '1DC0FD7AB36CB4DB689ED374B56E06AB8A96CA68';
const BLOCK = DEMO + '00'.repeat(12) + 'A5'.repeat(32);
const C1 = '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26';
const C2 = '50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E';

test('Doppelter Schlüssel: Sparschwein nutzt Abschnitt 1 zweimal, Eve knackt, Auflösung zeigt C1 ⊕ C2 mit 16 von 19 Nullen', async () => {
  const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) }); // 1. Salz, 2. Schlüsselblock
  const [alice, bob, eve] = f.teams;
  const sz = await F.starte(f, 'doppelter-schluessel', { optionen: { wiederholerTeamId: alice.id } });
  const ich = (await F.stand(alice.c, sz.id)).body.ich;
  assert.equal(ich.abschnitte[0].slice(0, 59), '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68');
  assert.equal(ich.erneutErlaubt, true);
  assert.equal((await F.stand(bob.c, sz.id)).body.ich.erneutErlaubt, false);
  assert.equal((await F.stand(eve.c, sz.id)).body.ich.abschnitte, undefined, 'Eve sieht keinen Schlüssel');
  const sende = (text, klartext, abschnitt) => alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext, abschnitt });
  await sende(C1, 'HEUTE 8 UHR AM BAHNHOF', 1).expect(400);                           // passt nicht
  await sende(C1, 'HEUTE 8 UHR AM HAFEN', 2).expect(400);                             // falscher Abschnitt
  await sende('41 42', 'HALLO', 1).expect(400);                                       // kein Baustein
  const n1 = (await sende(C1, 'HEUTE 8 UHR AM HAFEN', 1).expect(200)).body.nachricht;
  assert.equal(n1.inhalt, C1);
  f.uhr.vor(10_000);
  const n2 = (await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(200)).body.nachricht;  // Sparschwein
  f.uhr.vor(10_000);
  await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(409);                               // dritter Spruch
  assert.deepEqual((await F.stand(eve.c, sz.id)).body.ich.paare, [[n1.id, n2.id]]);
  await F.aktion(f, sz.id, 'phase').expect(200);                                     // lauschen
  assert.equal((await eve.c.post(`/api/funk/${sz.id}/knacken`).send({ nachricht: n2.id, klartext: 'morgen bahnhof nord' }).expect(200)).body.richtig, true);
  await F.aktion(f, sz.id, 'phase').expect(200);                                     // aufloesung
  const auf = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
  assert.deepEqual(auf.sprueche.map((s) => [s.m, s.abschnitt]), [['HEUTE 8 UHR AM HAFEN', 1], ['MORGEN BAHNHOF NORD', 1]]);
  assert.deepEqual(auf.vergleiche[0], { a: n1.id, b: n2.id, xor: '05 0A 07 13 00 6E 18 62 14 00 1C 68 0E 0B 00 06 0E 14 01', nullen: 16, laenge: 19 });
  assert.equal(auf.eveGewinnt, true);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  for (const nadel of ['1DC0', '1D C0', '55 85', 'HEUTE8UHR']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
});

test('Ohne Sparschwein: Abschnitt 1 zweimal → 409; Spruch 2 mit Abschnitt 2 geht', async () => {
  const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) });
  const [alice] = f.teams;
  const sz = await F.starte(f, 'doppelter-schluessel');
  const sende = (text, klartext, abschnitt) => alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext, abschnitt });
  await sende(C1, 'HEUTE 8 UHR AM HAFEN', 1).expect(200);
  f.uhr.vor(10_000);
  await sende(C2, 'MORGEN BAHNHOF NORD', 1).expect(409);
  const k2 = K.vonHex('A5'.repeat(32));
  await sende(K.xor('MORGEN BAHNHOF NORD', k2), 'MORGEN BAHNHOF NORD', 2).expect(200);
});

test('Doppelter Schlüssel: Schlüsselblöcke nur beim eigenen Paar, Beamer erst in der Auflösung, Reihenfolge der Abschnitte', async () => {
  const B2 = 'C3'.repeat(64);
  const f = await F.kursMitTeams(5, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK, B2]) }); // 1↔2, 3↔4, 5 = Eve
  const [a1, b1, a2, b2, eve] = f.teams;
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'doppelter-schluessel', optionen: { wiederholerTeamId: b1.id } }).expect(400);
  const sz = await F.starte(f, 'doppelter-schluessel');
  assert.equal((await F.stand(b2.c, sz.id)).body.ich.abschnitte[0].slice(0, 5), 'C3 C3');
  for (const t of [a2, b2, eve]) {
    const text = JSON.stringify((await F.stand(t.c, sz.id)).body);
    assert.ok(!text.includes('1D C0') && !text.includes('1DC0'), 'fremder Schlüsselblock unsichtbar');
  }
  const sende = (t, text, klartext, abschnitt) => t.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext, abschnitt });
  const k2 = K.vonHex('C3'.repeat(32));
  await sende(a2, K.xor('ZUG UM 9', k2), 'ZUG UM 9', 2).expect(409);                // Spruch 1 nimmt Abschnitt 1
  await sende(a2, K.xor('ZUG UM 9', k2), 'ZUG UM 9', 3).expect(400);
  await sende(a2, K.xor('ZUG UM 9 UHR AM HAFEN BEIM', k2), 'ZUG UM 9 UHR AM HAFEN BEIM', 1).expect(400); // > 24 Zeichen
  const n = (await sende(a2, K.xor('ZUG UM 9', k2), 'zug um 9', 1).expect(200)).body.nachricht;
  assert.equal((await b2.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'ZUG UM 9' }).expect(200)).body.richtig, true);
  assert.equal((await b1.c.post(`/api/funk/${sz.id}/empfangen`).send({ nachricht: n.id, klartext: 'ZUG UM 9' }).expect(403)).body.error.length > 0, true);
  const beamer = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
  assert.deepEqual(beamer, { eveGewinnt: false });
  assert.deepEqual((await F.regie(f, sz.id)).body.anzeigen.sprueche.map((s) => [s.m, s.abschnitt]), [['ZUG UM 9', 1]]);
  await F.aktion(f, sz.id, 'phase').expect(200); // lauschen
  f.uhr.vor(10_000);
  await sende(a1, C1, 'HEUTE 8 UHR AM HAFEN', 1).expect(409);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  const ausw = (await F.stand(eve.c, sz.id)).body.auswertung;
  assert.deepEqual(ausw, { sprueche: [{ nachricht: n.id, team: a2.id, abschnitt: 1, geknackt: false }], vergleiche: [], eveGewinnt: false });
  assert.deepEqual(F.fundstellen(f.db, 'C3C3'), []);
});
