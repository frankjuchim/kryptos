'use strict';
// Funkraum: Prüf- und Team-Aktionen nur in den Spielphasen (Review M7 W1). In der Auflösung zeigt der Beamer die
// Klartexte – danach darf niemand mehr knacken, empfangen oder Team-Aktionen ausführen (409), sonst änderte sich die
// Auswertung nachträglich. Doppelter Schlüssel nach W3 §9.3: Bob empfängt nur in „funken“, Eve knackt in „funken“ und
// „lauschen“ (Typ-Hook `aktionsPhasen`).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const K = require('../public/static/js/shared/krypto.js');

const DEMO = '1DC0FD7AB36CB4DB689ED374B56E06AB8A96CA68';
const BLOCK = DEMO + '00'.repeat(12) + 'A5'.repeat(32);
const C1 = '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26';

const post = (t, sz, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);

test('Botenlauf: in der Auflösung knackt Eve nicht mehr und Bob empfängt nicht mehr (409); Auswertung bleibt gleich', async () => {
  const f = await F.kursMitTeams(3);
  const [alice, bob, eve] = f.teams;
  const sz = await F.starte(f, 'botenlauf');
  await post(alice, sz, 'nachrichten', { text: 'KDOWHW GHQ SDVV', klartext: 'haltet den pass' }).expect(200);
  for (let i = 0; i < 3; i++) await F.aktion(f, sz.id, 'phase').expect(200);
  const vorher = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung;
  const nid = (await F.stand(eve.c, sz.id)).body.nachrichten[0].id;
  const k = await post(eve, sz, 'knacken', { nachricht: nid, klartext: 'haltet den pass' }).expect(409);
  assert.match(k.body.error, /Auflösung/);
  await post(bob, sz, 'empfangen', { nachricht: nid, klartext: 'haltet den pass' }).expect(409);
  assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung, vorher, 'Auswertung unverändert');
});

test('Doppelter Schlüssel: Bob empfängt nur in „funken“, Eve knackt in „lauschen“, nach der Auflösung nichts mehr', async () => {
  const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) });
  const [alice, bob, eve] = f.teams;
  const sz = await F.starte(f, 'doppelter-schluessel', { optionen: { wiederholerTeamId: alice.id } });
  const n1 = (await post(alice, sz, 'nachrichten', { text: C1, klartext: 'HEUTE 8 UHR AM HAFEN', abschnitt: 1 }).expect(200)).body.nachricht;
  f.uhr.vor(10_000);
  const m2 = 'MORGEN BAHNHOF NORD';
  const n2 = (await post(alice, sz, 'nachrichten', { text: K.xor(m2, K.vonHex(DEMO)), klartext: m2, abschnitt: 1 }).expect(200)).body.nachricht;
  // funken: Bob bestätigt Spruch 1
  assert.equal((await post(bob, sz, 'empfangen', { nachricht: n1.id, klartext: 'heute 8 uhr am hafen' }).expect(200)).body.richtig, true);
  await F.aktion(f, sz.id, 'phase').expect(200); // lauschen
  const spaet = await post(bob, sz, 'empfangen', { nachricht: n2.id, klartext: m2 }).expect(409);
  assert.match(spaet.body.error, /Phase/);
  assert.equal((await post(eve, sz, 'knacken', { nachricht: n2.id, klartext: m2 }).expect(200)).body.richtig, true);
  await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
  const vorher = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
  const spruch = vorher.sprueche.find((s) => s.nachricht === n1.id);
  assert.equal(spruch.m, 'HEUTE 8 UHR AM HAFEN', 'Beamer zeigt die Klartexte');
  await post(eve, sz, 'knacken', { nachricht: n1.id, klartext: spruch.m }).expect(409);
  await post(bob, sz, 'empfangen', { nachricht: n2.id, klartext: m2 }).expect(409);
  const nachher = (await F.regie(f, sz.id, 0, 'regie')).body;
  assert.deepEqual(nachher.nachrichten.map((n) => [n.id, n.geknackt, n.angekommen]), [[n1.id, false, true], [n2.id, true, false]]);
  assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.eveGewinnt, vorher.eveGewinnt);
});

test('Doppelter Schlüssel ohne geknackten Spruch: Eve gewinnt nach der Auflösung nicht mehr nachträglich', async () => {
  const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['00'.repeat(32), BLOCK]) });
  const [alice, , eve] = f.teams;
  const sz = await F.starte(f, 'doppelter-schluessel');
  await post(alice, sz, 'nachrichten', { text: C1, klartext: 'HEUTE 8 UHR AM HAFEN', abschnitt: 1 }).expect(200);
  await F.aktion(f, sz.id, 'phase').expect(200);
  await F.aktion(f, sz.id, 'phase').expect(200);
  const b = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
  assert.equal(b.eveGewinnt, false);
  await post(eve, sz, 'knacken', { nachricht: b.sprueche[0].nachricht, klartext: b.sprueche[0].m }).expect(409);
  assert.equal((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.eveGewinnt, false);
});

test('Schlüsseltausch, Mallory, Wettknacken: Team-Aktionen in der Auflösung → 409', async () => {
  const st = await F.kursMitTeams(3);
  const sz1 = await F.starte(st, 'schluesseltausch');
  await F.aktion(st, sz1.id, 'phase').expect(200);
  await F.aktion(st, sz1.id, 'phase').expect(200);
  await post(st.teams[0], sz1, 'oeffentlich', { wert: 5 }).expect(409);
  await post(st.teams[0], sz1, 'k-melden', { k: 5 }).expect(409);
  await post(st.teams[2], sz1, 'knacken', { paar: st.teams[0].id, k: 5 }).expect(409);

  const m = await F.kursMitTeams(3);
  const sz2 = await F.starte(m, 'mallory');
  await post(m.teams[1], sz2, 'oeffentlich', {}).expect(200);
  await F.aktion(m, sz2.id, 'phase').expect(200);
  await F.aktion(m, sz2.id, 'phase').expect(200);
  m.uhr.vor(10_000);
  await post(m.teams[1], sz2, 'oeffentlich', {}).expect(409);
  await post(m.teams[2], sz2, 'mallory', { aktion: 'weiterleiten', nachricht: 1 }).expect(409);

  const w = await F.kursMitTeams(2, { extra: { funkraumDatei: require('node:path').join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json') } });
  const sz3 = await F.starte(w, 'wettknacken');
  await F.aktion(w, sz3.id, 'phase').expect(200);
  await w.teams[0].c.put(`/api/funk/${sz3.id}/zuordnung`).send({ zuordnung: { U: 'E' } }).expect(409);
});

test('Typ-Hook aktionsPhasen: nur Doppelter Schlüssel schränkt ein; Phasen gehören zum Typ', () => {
  const { TYP_MODULE } = require('../src/krypto/funkraum/dienst');
  const { SZENARIEN } = require('../src/krypto/funkraum/szenarien');
  const ds = TYP_MODULE['doppelter-schluessel'].aktionsPhasen;
  assert.deepEqual(ds, { empfangen: ['funken'], knacken: ['funken', 'lauschen'] });
  for (const [typ, mod] of Object.entries(TYP_MODULE)) {
    for (const phasen of Object.values(mod.aktionsPhasen || {})) {
      for (const p of phasen) assert.ok(SZENARIEN[typ].phasen.includes(p) && p !== 'aufloesung', `${typ}: ${p}`);
    }
  }
});
