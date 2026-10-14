'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');

test('Mallory Phase 1: Schlüssel ersetzen, Umschlag öffnen und ändern, Bob merkt nichts; Phase 2: Zertifikat entlarvt', async () => {
  const f = await F.kursMitTeams(3); // fester Zufall = Nullbytes → Auftragskarte 0
  const [alice, bob, mallory] = f.teams;
  const sz = await F.starte(f, 'mallory');
  const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
  const ich = async (t) => (await F.stand(t.c, sz.id)).body.ich;
  assert.equal((await ich(bob)).etikett, 'S23');
  assert.deepEqual((await ich(mallory)).etiketten, ['S41', 'S42']);
  assert.equal((await ich(alice)).auftrag, 'LIEFERE 5 KISTEN AN TOR 3');
  // Bob veröffentlicht, Mallory schiebt S41 unter
  await post(bob, 'oeffentlich', {}).expect(200);
  const sk = (await ich(mallory)).station[0];
  await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: sk.id, etikett: 'S41' }).expect(200);
  const angebot = (await ich(alice)).schluessel[0];
  assert.deepEqual([angebot.etikett, angebot.von, angebot.zertifikat.status], ['S41', bob.id, 'fehlt']);
  // Alice verschlüsselt mit S41, Mallory öffnet, ändert TOR 3 → TOR 8, verschließt mit S23
  await post(alice, 'nachrichten', { etikett: 'S41' }).expect(200);
  const umschlag = (await ich(mallory)).station[0];
  assert.equal(umschlag.inhalt, 'LIEFERE 5 KISTEN AN TOR 3');
  await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: umschlag.id, text: 'liefere 5 kisten an tor 8', etikett: 'S23' }).expect(200);
  await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: umschlag.id, text: 'grüße' }).expect(400);
  const post_ = (await F.stand(bob.c, sz.id)).body.nachrichten.filter((n) => n.an === bob.id && n.art === 'nachricht');
  assert.deepEqual(post_.map((n) => [n.inhalt, n.lesbar, n.angezeigtVon]), [['LIEFERE 5 KISTEN AN TOR 8', true, alice.id]]);
  await post(bob, 'empfangen', { nachricht: post_[0].id }).expect(200);
  // Eve gibt es nicht; Beamer sieht in Phase 1 nur Umschläge
  assert.ok((await F.regie(f, sz.id, 0, 'beamer')).body.nachrichten.every((n) => n.art !== 'nachricht' || n.inhalt === 'UMSCHLAG'));
  // Phase 2: Trent stellt Bob ein Zertifikat aus; Mallory schiebt S42 mit verändertem Zertifikat unter
  await F.aktion(f, sz.id, 'phase').expect(200);
  f.uhr.vor(10_000); // 1 Sendung je Team in 10 s
  await f.lk.post(`/api/lehrer/funk/${sz.id}/zertifikat`).send({ teamId: bob.id, etikett: 'S23', ausstellen: true }).expect(200);
  await post(bob, 'oeffentlich', {}).expect(200);
  const sk2 = (await ich(mallory)).station.find((n) => n.art === 'schluessel');
  await post(mallory, 'mallory', { aktion: 'weiterleiten', nachricht: sk2.id }).expect(200);
  await post(mallory, 'mallory', { aktion: 'schluessel', an: alice.id, etikett: 'S42', zertifikat: 'veraendert' }).expect(200);
  const angebote = (await ich(alice)).schluessel.filter((s) => s.phase === 'mit-zertifikaten');
  assert.deepEqual(angebote.map((s) => [s.etikett, s.zertifikat.status]).sort(), [['S23', 'gueltig'], ['S42', 'siegel']]);
  assert.equal(angebote.find((s) => s.etikett === 'S23').zertifikat.text, 'ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE');
  // Mallory kann einen S23-Umschlag nicht öffnen
  await post(alice, 'nachrichten', { etikett: 'S23' }).expect(200);
  const u2 = (await ich(mallory)).station.find((n) => n.art === 'nachricht');
  assert.deepEqual([u2.inhalt, u2.lesbar], ['UMSCHLAG S23', false]);
  await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: u2.id, text: 'TOR 8' }).expect(403);
  // Auflösung
  await F.aktion(f, sz.id, 'phase').expect(200);
  const ausw = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung;
  assert.deepEqual(ausw.map((z) => [z.phase, z.veraendert, z.schluesselErsetzt]), [['ohne-zertifikate', true, true], ['mit-zertifikaten', false, false]]);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  for (const nadel of ['KISTEN', 'S41', 'ZERTIFIKAT']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
});

test('Mallory: Station leeren (Regie) leitet alles unverändert weiter; nur Mallory darf mallory-Aktionen', async () => {
  const f = await F.kursMitTeams(3);
  const [alice, bob, mallory] = f.teams;
  const sz = await F.starte(f, 'mallory');
  await bob.c.post(`/api/funk/${sz.id}/oeffentlich`).send({}).expect(200);
  await alice.c.post(`/api/funk/${sz.id}/mallory`).send({ aktion: 'weiterleiten', nachricht: 1 }).expect(403);
  assert.deepEqual((await f.lk.post(`/api/lehrer/funk/${sz.id}/station`).send({}).expect(200)).body, { weitergeleitet: 1 });
  assert.equal((await F.stand(alice.c, sz.id)).body.ich.schluessel[0].etikett, 'S23');
  assert.equal((await F.stand(mallory.c, sz.id)).body.ich.station.length, 0);
});

test('Mallory: Datenleck je Rolle, Whitelist auf allen Wegen, Zertifikate nur in Phase 2, zwei Mallory-Teams', async () => {
  // Zufall: 1. Salz, dann je Alice-Team die Karten für Phase 1 und 2 (Alice 1: Karte 0, Alice 2: Karte 1)
  const f = await F.kursMitTeams(6, { zufallBytes: F.festerZufall(['00'.repeat(32), '00000000', '00000000', '00000001', '00000001']) }); // 1↔2, 3↔4, 5 und 6 = Mallory
  const [a1, b1, a2, b2, m1, m2] = f.teams;
  const paar = (x, y) => [{ teamId: x.id, rolle: 'alice', partnerId: y.id }, { teamId: y.id, rolle: 'bob', partnerId: x.id }];
  // zwei Mallory-Teams setzt die Lehrkraft (der Vorschlag nimmt 2 erst ab 9 Teams, K9)
  const sz = await F.starte(f, 'mallory', { rollen: [...paar(a1, b1), ...paar(a2, b2), { teamId: m1.id, rolle: 'mallory' }, { teamId: m2.id, rolle: 'mallory' }] });
  const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
  const ich = async (t) => (await F.stand(t.c, sz.id)).body.ich;
  assert.deepEqual([(await ich(b1)).etikett, (await ich(b2)).etikett], ['S23', 'S27']);
  assert.deepEqual([(await ich(m1)).etiketten, (await ich(m2)).etiketten], [['S41', 'S42'], ['S51', 'S52']]);
  // Zertifikate erst in Phase 2
  await f.lk.post(`/api/lehrer/funk/${sz.id}/zertifikat`).send({ teamId: b1.id, etikett: 'S23', ausstellen: true }).expect(409);
  await post(m1, 'mallory', { aktion: 'schluessel', an: a1.id, etikett: 'S41', zertifikat: 'eigenes' }).expect(409);
  // Paar 2 läuft über die zweite Station
  await post(b2, 'oeffentlich', {}).expect(200);
  assert.equal((await ich(m2)).station.length, 1);
  assert.equal((await ich(m1)).station.length, 0);
  // Alice: nur erhaltene Schlüssel, Text vom Client wird ignoriert
  await post(a2, 'nachrichten', { etikett: 'S27' }).expect(400);
  const sk = (await ich(m2)).station[0];
  await post(m2, 'mallory', { aktion: 'weiterleiten', nachricht: sk.id }).expect(200);
  await post(m2, 'mallory', { aktion: 'weiterleiten', nachricht: sk.id }).expect(409); // schon unterwegs
  await post(m1, 'mallory', { aktion: 'weiterleiten', nachricht: sk.id }).expect(404); // fremde Station
  const gesendet = (await post(a2, 'nachrichten', { etikett: 'S27', text: 'ZAHLE 1000 TALER' }).expect(200)).body.nachricht;
  assert.equal(gesendet.inhalt, (await ich(a2)).auftrag);
  // Mallory 2 kann den S27-Umschlag nicht öffnen und nicht neu verschließen
  const u = (await ich(m2)).station[0];
  assert.deepEqual([u.inhalt, u.lesbar], ['UMSCHLAG S27', false]);
  await post(m2, 'mallory', { aktion: 'ersetzen', nachricht: u.id, etikett: 'S51' }).expect(403);
  // Whitelist und Etiketten-Form auf allen Wegen
  await post(m2, 'mallory', { aktion: 'ersetzen', nachricht: u.id, text: 'TOR ä' }).expect(400);
  await post(m2, 'mallory', { aktion: 'ersetzen', nachricht: u.id, text: 'X'.repeat(161) }).expect(400);
  await post(m2, 'mallory', { aktion: 'ersetzen', nachricht: u.id, etikett: 's27; DROP' }).expect(400);
  await post(m2, 'mallory', { aktion: 'oeffnen', nachricht: u.id }).expect(400);
  await post(m2, 'mallory', { aktion: 'weiterleiten', nachricht: u.id }).expect(200);
  // Datenleck: Bob 1 und Alice 1 sehen nichts von Paar 2; niemand außer Alice 2 und Bob 2 liest den Auftrag
  const auftrag = (await ich(a2)).auftrag;
  for (const t of [a1, b1, m1, m2]) assert.ok(!JSON.stringify((await F.stand(t.c, sz.id)).body).includes(auftrag), t.name);
  assert.ok(JSON.stringify((await F.stand(b2.c, sz.id)).body).includes(auftrag));
  assert.ok(!JSON.stringify((await F.regie(f, sz.id, 0, 'beamer')).body).includes(auftrag), 'Beamer verdeckt bis zur Auflösung');
  assert.ok(JSON.stringify((await F.regie(f, sz.id)).body).includes(auftrag), 'Regie sieht alles');
  // Mallorys Eingriffe nicht im Ticker von Alice/Bob/Beamer
  for (const c of [a2.c, b2.c]) assert.ok((await F.stand(c, sz.id)).body.ereignisse.every((e) => !['weitergeleitet', 'ersetzt'].includes(e.code)));
  assert.ok((await F.regie(f, sz.id, 0, 'beamer')).body.ereignisse.every((e) => e.code !== 'weitergeleitet'));
  assert.ok((await F.stand(m2.c, sz.id)).body.ereignisse.some((e) => e.code === 'weitergeleitet'));
  // Bob 1 kann einen fremden Umschlag nicht melden
  const fuerBob2 = (await F.stand(b2.c, sz.id)).body.nachrichten.find((n) => n.art === 'nachricht');
  await post(b1, 'empfangen', { nachricht: fuerBob2.id }).expect(403);
  await post(b2, 'empfangen', { nachricht: fuerBob2.id }).expect(200);
  // Phase 2: Mallorys eigenes Zertifikat → Name passt nicht; Trent nur für Bob-Teams mit eigener Nummer
  await F.aktion(f, sz.id, 'phase').expect(200);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/zertifikat`).send({ teamId: m1.id, etikett: 'S41', ausstellen: true }).expect(400);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/zertifikat`).send({ teamId: b1.id, etikett: 'S27', ausstellen: true }).expect(400);
  await post(m1, 'mallory', { aktion: 'schluessel', an: a1.id, etikett: 'S41', zertifikat: 'eigenes' }).expect(200);
  const [k] = (await ich(a1)).schluessel;
  assert.deepEqual([k.etikett, k.von, k.zertifikat], ['S41', b1.id, { status: 'name', text: `ZERTIFIKAT ${m1.name.toUpperCase()} S41 GUELTIG HEUTE` }]);
  // Auflösung: Texte für Regie/Beamer, nach dem Beenden nur Wahrheitswerte
  await F.aktion(f, sz.id, 'phase').expect(200);
  const z2 = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung.find((z) => z.team === a2.id && z.phase === 'ohne-zertifikate');
  assert.deepEqual([z2.original, z2.empfangen, z2.veraendert, z2.schluesselErsetzt, z2.gemeldet, z2.weg.length], [auftrag, auftrag, false, false, true, 2]);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  const ausw = JSON.stringify((await F.stand(a1.c, sz.id)).body.auswertung);
  assert.ok(!/UMSCHLAG|TALER|KISTEN|HAFEN|LAGER|S\d\d/.test(ausw), ausw);
  assert.deepEqual(F.fundstellen(f.db, 'S27'), []);
});

test('Mallory: Beamer verdeckt Schlüssel-Etiketten (S23, S41 …) bis zur Auflösung – Schlüssel-Sendungen und Umschläge', async () => {
  const f = await F.kursMitTeams(3);
  const [alice, bob, mallory] = f.teams;
  const sz = await F.starte(f, 'mallory');
  const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
  const ich = async (t) => (await F.stand(t.c, sz.id)).body.ich;
  await post(bob, 'oeffentlich', {}).expect(200);
  const sk = (await ich(mallory)).station[0];
  await post(mallory, 'mallory', { aktion: 'ersetzen', nachricht: sk.id, etikett: 'S41' }).expect(200);
  await post(alice, 'nachrichten', { etikett: 'S41' }).expect(200);
  const beamer = async () => (await F.regie(f, sz.id, 0, 'beamer').expect(200)).body;
  const vorher = await beamer();
  assert.ok(vorher.nachrichten.length >= 3);
  assert.ok(!/S\d{2}/.test(JSON.stringify(vorher)), 'kein Etikett im Beamer-Stand vor der Auflösung');
  assert.deepEqual([...new Set(vorher.nachrichten.map((n) => [n.art, n.inhalt, n.lesbar].join('|')))].sort(), ['nachricht|UMSCHLAG|false', 'schluessel|SCHLUESSEL|false']);
  // Regie sieht alles, die Teams wie bisher
  assert.ok(JSON.stringify((await F.regie(f, sz.id)).body.nachrichten).includes('S41'));
  assert.equal((await ich(alice)).schluessel[0].etikett, 'S41');
  await F.aktion(f, sz.id, 'phase').expect(200);
  await F.aktion(f, sz.id, 'phase').expect(200); // Auflösung
  const nachher = await beamer();
  assert.ok(nachher.nachrichten.some((n) => n.art === 'schluessel' && n.inhalt === 'S41' && n.lesbar));
  assert.ok(nachher.nachrichten.some((n) => n.art === 'nachricht' && n.inhalt === 'LIEFERE 5 KISTEN AN TOR 3'));
});
