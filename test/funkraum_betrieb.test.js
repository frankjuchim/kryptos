'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const F = require('./hilfen_funk');
const loeschen = (app, body) => request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen', {}, { app })).send(body);
const sperren = (app, kurs, aktiv) => request(app).post(`/api/verbund/kurse/${encodeURIComponent(kurs)}`).set('Authorization', 'Bearer ' + H.verbundToken('kurs-aendern', {}, { app })).send({ aktiv });

test('Löschung nach sub mitten im Botenlauf: eigene Nachrichten weg, leeres Team samt Rolle weg, Partner spielt weiter', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const [alice, bob, eve] = f.teams;
  await alice.c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
  await loeschen(f.app, { sub: alice.c.sub }).expect(200);
  assert.equal(H.zaehle(f.app, 'funk_nachrichten', 'szenario_id = ?', sz.id), 0);
  assert.equal(H.zaehle(f.app, 'funk_rollen', 'team_id = ?', alice.id), 0);
  const st = (await F.stand(bob.c, sz.id).expect(200)).body;
  assert.equal(st.ich.partner, null);
  assert.equal((await F.stand(eve.c, sz.id).expect(200)).body.nachrichten.length, 0);
  assert.deepEqual(F.fundstellen(f.db, 'OHSAL'), []);
});

test('Kurs gesperrt mitten im Szenario: beendet mit Auswertung, Schüler 403, Lehrkraft nur lesend, Schließen erlaubt', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  await f.teams[0].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text: 'OHSAL', klartext: 'haltet' }).expect(200);
  await sperren(f.app, f.kurs.kurs, false).expect(200);
  const zeile = f.db.prepare('SELECT status, konfig FROM funk_szenarien WHERE id = ?').get(sz.id);
  assert.equal(zeile.status, 'auswertung');
  assert.equal(JSON.parse(zeile.konfig).auswertung.zeilen.length, 1, 'Typ-Auswertung (Botenlauf), nicht generisch');
  await F.stand(f.teams[0].c, sz.id).expect(403);
  await F.regie(f, sz.id).expect(200);
  await F.aktion(f, sz.id, 'pausieren').expect(403);
  // Review M7 K1: Schließen (löschen) bleibt auch im gesperrten Kurs möglich
  await F.aktion(f, sz.id, 'schliessen').expect(200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM funk_szenarien').get().n, 0);
});

test('Jeder Typ: Beenden lässt keine Geheimnisse zurück (Salz, Schlüsselblock, Lösung, Etiketten, Karten, Meldungen)', async () => {
  const datei = path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json');
  // Nadeln, die vor dem Beenden in den Funkraum-Tabellen stehen müssen (sonst prüft die Suche danach nichts)
  const VORHER = {
    botenlauf: ['OHSAL'],
    wettknacken: ['"zuordnung"', '"U":"'],
    'doppelter-schluessel': ['CDCDCDCD'],
    schluesseltausch: ['"k":{', '"oeffentlich":{'],
    mallory: ['S23', 'TREFFEN UM 14'] // zweiter Zufallsblock cdcdcdcd → Auftragskarte 1 in Phase 1
  };
  const imFunkraum = (db, nadel) => F.fundstellen(db, nadel).filter((t) => t.startsWith('funk_'));
  for (const typ of ['botenlauf', 'wettknacken', 'doppelter-schluessel', 'schluesseltausch', 'mallory']) {
    const f = await F.kursMitTeams(3, { zufallBytes: F.festerZufall(['ab'.repeat(32), 'cd'.repeat(64)]), extra: { funkraumDatei: datei } });
    const sz = await F.starte(f, typ);
    const [t0, t1] = f.teams;
    const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
    if (typ === 'botenlauf') await post(t0, 'nachrichten', { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
    if (typ === 'wettknacken') await t0.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
    if (typ === 'schluesseltausch') {
      await post(t0, 'oeffentlich', { wert: 17 }).expect(200);
      await post(t0, 'k-melden', { k: 8 }).expect(200);
    }
    if (typ === 'mallory') {
      await post(t1, 'oeffentlich', {}).expect(200);
      await f.lk.post(`/api/lehrer/funk/${sz.id}/station`).send({}).expect(200);
      await post(t0, 'nachrichten', { etikett: 'S23' }).expect(200);
    }
    const konfig = JSON.parse(f.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig);
    assert.match(konfig.salz, /^[A-Za-z0-9_-]{43}$/);
    for (const nadel of VORHER[typ]) assert.notDeepEqual(imFunkraum(f.db, nadel), [], `${typ} vorher: ${nadel}`);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    assert.deepEqual(Object.keys(JSON.parse(f.db.prepare('SELECT konfig FROM funk_szenarien').get().konfig)), ['auswertung'], typ);
    for (const nadel of [konfig.salz, 'CDCDCDCD', 'cdcdcdcd', 'S23', 'LIEFERE', 'TREFFEN UM 14', 'OHSAL']) assert.deepEqual(F.fundstellen(f.db, nadel), [], `${typ}: ${nadel}`);
    // JSON-Schlüssel nur in den Funkraum-Tabellen suchen (die Fixture-Aufgaben haben die Interaktion „zuordnung“)
    for (const nadel of ['"zuordnung"', '"U":"', '"k":{', '"oeffentlich":{']) assert.deepEqual(imFunkraum(f.db, nadel), [], `${typ}: ${nadel}`);
  }
});

test('Backup enthält keine Funkraum-Szenarien; nach 24 h ist das Szenario weg (Stand 404)', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  const b = f.app.locals.services.daten.exportieren();
  for (const t of ['funk_szenarien', 'funk_rollen', 'funk_nachrichten', 'funk_ereignisse']) assert.ok(!(t in b.tables), t);
  assert.ok('funk_teilnahmen' in b.tables && 'teams' in b.tables);
  f.uhr.vor(24 * 3600e3 + 1000);
  f.app.locals.wartung.lauf();
  await F.stand(f.teams[0].c, sz.id).expect(404);
  assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario, null);
});

test('Jeder Typ: Löschung nach sub eines Teams mitten im Spiel – übrige Stände, Regie, Beamer und Beenden laufen weiter', async () => {
  const datei = path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json');
  for (const typ of ['botenlauf', 'wettknacken', 'doppelter-schluessel', 'schluesseltausch', 'mallory']) {
    for (const weg of [0, 1, 2]) {
      const f = await F.kursMitTeams(3, { extra: { funkraumDatei: datei } });
      const sz = await F.starte(f, typ);
      const [t0, t1] = f.teams;
      const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
      if (typ === 'botenlauf') await post(t0, 'nachrichten', { text: 'OHSAL AKLUW HZZ', klartext: 'haltet den pass' }).expect(200);
      if (typ === 'wettknacken') await t0.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
      if (typ === 'schluesseltausch') await post(t0, 'oeffentlich', { wert: 17 }).expect(200);
      if (typ === 'mallory') await post(t1, 'oeffentlich', {}).expect(200);
      await loeschen(f.app, { sub: f.teams[weg].c.sub }).expect(200);
      const rest = f.teams.filter((_, i) => i !== weg);
      for (const t of rest) await F.stand(t.c, sz.id).expect(200);
      await F.regie(f, sz.id).expect(200);
      await F.regie(f, sz.id, 0, 'beamer').expect(200);
      for (let i = 1; i < sz.phasen.length; i++) {
        await F.aktion(f, sz.id, 'phase').expect(200);
        await F.regie(f, sz.id, 0, 'beamer').expect(200);
        for (const t of rest) await F.stand(t.c, sz.id).expect(200);
      }
      await F.aktion(f, sz.id, 'beenden').expect(200);
      await F.regie(f, sz.id).expect(200);
      for (const t of rest) await F.stand(t.c, sz.id).expect(200);
    }
  }
});

test('Szenario ohne verbleibende Rolle: Regie und Beamer lesbar, Beenden mit leerer Auswertung, Schließen', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'botenlauf');
  for (const t of f.teams) await loeschen(f.app, { sub: t.c.sub }).expect(200);
  assert.equal(H.zaehle(f.app, 'funk_rollen', 'szenario_id = ?', sz.id), 0);
  assert.deepEqual((await F.regie(f, sz.id).expect(200)).body.rollen, []);
  await F.regie(f, sz.id, 0, 'beamer').expect(200);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  assert.equal(f.db.prepare('SELECT status FROM funk_szenarien').get().status, 'auswertung');
  await F.aktion(f, sz.id, 'schliessen').expect(200);
  assert.equal(H.zaehle(f.app, 'funk_szenarien', '1 = 1'), 0);
});

test('Review M7 K1: Abbrechen in vorbereitung auch im gesperrten Kurs', async () => {
  const f = await F.kursMitTeams(3);
  const sz = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'botenlauf' }).expect(200)).body;
  f.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(f.kurs.id);
  await F.aktion(f, sz.id, 'starten').expect(403);
  await F.aktion(f, sz.id, 'abbrechen').expect(200);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM funk_szenarien').get().n, 0);
});

test('Review M7 K2: abgelaufenes Szenario (24 h, Wartung noch nicht gelaufen) blockiert kein neues – es wird vorher gelöscht', async () => {
  const f = await F.kursMitTeams(3);
  const alt = await F.starte(f, 'botenlauf');
  await f.teams[0].c.post(`/api/funk/${alt.id}/nachrichten`).send({ text: 'OHSAL', klartext: 'haltet' }).expect(200);
  f.uhr.vor(24 * 3600e3 + 1000);
  assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/funk`).expect(200)).body.szenario, null);
  const neu = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ: 'botenlauf' }).expect(200)).body;
  assert.notEqual(neu.id, alt.id);
  assert.deepEqual(f.db.prepare('SELECT id FROM funk_szenarien').all().map((r) => r.id), [neu.id]);
  assert.deepEqual(F.fundstellen(f.db, 'OHSAL'), []);
});
