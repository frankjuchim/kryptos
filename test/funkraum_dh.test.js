'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');

test('Schlüsseltausch Runde 1 (23, 5) und Runde 2 (101, 2): öffentliche Werte, verdeckte Meldungen, Eve ohne Orakel', async () => {
  const f = await F.kursMitTeams(3);
  const [alice, bob, eve] = f.teams;
  const sz = await F.starte(f, 'schluesseltausch');
  const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
  assert.deepEqual((await F.stand(eve.c, sz.id)).body.anzeigen, { runde: 1, p: 23, g: 5 });
  await post(alice, 'oeffentlich', { wert: 0 }).expect(400);
  await post(alice, 'oeffentlich', { wert: 23 }).expect(400);
  await post(alice, 'oeffentlich', { wert: 17 }).expect(200);   // a = 7
  await post(bob, 'oeffentlich', { wert: 4 }).expect(200);      // b = 4
  assert.deepEqual((await F.stand(eve.c, sz.id)).body.nachrichten.map((n) => n.inhalt), ['A 17', 'B 4']);
  await post(alice, 'k-melden', { k: 8 }).expect(200);
  await post(bob, 'k-melden', { k: 8 }).expect(200);
  await post(eve, 'k-melden', { k: 8 }).expect(403);
  assert.deepEqual((await post(eve, 'knacken', { paar: alice.id, k: 3 }).expect(200)).body, { ok: true });
  await post(eve, 'knacken', { paar: alice.id, k: 8 }).expect(200); // überschreibt
  const regie = (await F.regie(f, sz.id)).body.anzeigen.meldungen;
  assert.deepEqual(regie, [{ paar: alice.id, runde: 1, kAlice: 8, kBob: 8, kWahr: 8, eve: { k: 8, richtig: true } }]);
  assert.equal((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.meldungen, undefined);
  assert.ok(!JSON.stringify((await F.stand(eve.c, sz.id)).body).includes('kWahr'));
  // Runde 2
  await F.aktion(f, sz.id, 'phase').expect(200);
  assert.deepEqual((await F.stand(alice.c, sz.id)).body.anzeigen, { runde: 2, p: 101, g: 2 });
  f.uhr.vor(10_000);
  await post(alice, 'oeffentlich', { wert: 55 }).expect(200);   // a = 37
  await post(bob, 'oeffentlich', { wert: 47 }).expect(200);     // b = 58
  await post(alice, 'k-melden', { k: 82 }).expect(200);
  await post(bob, 'k-melden', { k: 81 }).expect(200);           // Rechenfehler
  const r2 = (await F.regie(f, sz.id)).body.anzeigen.meldungen.find((m) => m.runde === 2);
  assert.deepEqual([r2.kWahr, r2.kAlice, r2.kBob, r2.eve], [82, 82, 81, null]);
  await F.aktion(f, sz.id, 'phase').expect(200);
  const ausw = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.auswertung;
  assert.deepEqual(ausw.map((z) => [z.runde, z.kGleich, z.eveRichtig]), [[1, true, true], [2, false, false]]);
});

test('Schlüsseltausch: Modulo-Uhr nur mit Reiter „uhr“ (kein dlog, E98)', async () => {
  const f = await F.kursMitTeams(3);
  const sz = await F.starte(f, 'schluesseltausch');
  assert.deepEqual((await F.stand(f.teams[2].c, sz.id)).body.werkzeuge, [{ id: 'modulo', voreinstellung: { reiter: ['uhr'], modul: 23, g: 5 } }]);
});

test('Schlüsseltausch: zwei Eve-Teams, Zeitbedarf, Grenzen der Eingaben, Meldungen nie bei Teams, Beenden löscht', async () => {
  const f = await F.kursMitTeams(4); // 1↔2, 3 und 4 = Eve (von der Lehrkraft so gesetzt; der Vorschlag nimmt 1 Eve, K9)
  const [alice, bob, eve1, eve2] = f.teams;
  const sz = await F.starte(f, 'schluesseltausch', { rollen: [{ teamId: alice.id, rolle: 'alice', partnerId: bob.id }, { teamId: bob.id, rolle: 'bob', partnerId: alice.id }, { teamId: eve1.id, rolle: 'eve' }, { teamId: eve2.id, rolle: 'eve' }] });
  const post = (t, pfad, body) => t.c.post(`/api/funk/${sz.id}/${pfad}`).send(body);
  await post(alice, 'oeffentlich', { wert: 'x' }).expect(400);
  await post(alice, 'oeffentlich', { wert: 10 }).expect(200);   // a = 3
  await post(alice, 'oeffentlich', { wert: 10 }).expect(429);   // 1 je Team in 10 s
  f.uhr.vor(5_000);
  await post(bob, 'oeffentlich', { wert: 9 }).expect(200);      // b = 10 → K = 16
  await post(eve1, 'oeffentlich', { wert: 5 }).expect(403);
  await post(bob, 'k-melden', { k: 23 }).expect(400);
  await post(eve1, 'knacken', { paar: bob.id, k: 16 }).expect(400); // Paar = Alice-Team
  await post(eve1, 'knacken', { paar: alice.id, k: 23 }).expect(400);
  f.uhr.vor(40_000);
  await post(eve2, 'knacken', { paar: alice.id, k: 16 }).expect(200);
  await post(eve1, 'knacken', { paar: alice.id, k: 6 }).expect(200);
  const [m] = (await F.regie(f, sz.id)).body.anzeigen.meldungen;
  assert.deepEqual(m, { paar: alice.id, runde: 1, kAlice: null, kBob: null, kWahr: 16, eve: { k: 6, richtig: false }, eve2: { k: 16, richtig: true } });
  for (const t of f.teams) {
    const text = JSON.stringify((await F.stand(t.c, sz.id)).body);
    assert.ok(!/meldungen|kWahr|richtig/.test(text), 'keine Meldungen, kein wahres K bei Teams');
  }
  assert.deepEqual((await F.stand(eve1.c, sz.id)).body.ich.tipps, { [alice.id]: 6 });
  for (const e of f.db.prepare('SELECT daten FROM funk_ereignisse').all()) assert.ok(!/"k"/.test(e.daten));
  await F.aktion(f, sz.id, 'phase').expect(200);
  await F.aktion(f, sz.id, 'phase').expect(200); // aufloesung
  await post(eve1, 'knacken', { paar: alice.id, k: 16 }).expect(409);
  const ausw = (await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen;
  assert.equal(ausw.meldungen.length, 2);
  assert.deepEqual(ausw.auswertung[0], { paar: alice.id, runde: 1, kGleich: false, eveRichtig: true, eveSekunden: 40 });
  assert.deepEqual((await F.stand(alice.c, sz.id)).body.anzeigen, { runde: null, p: null, g: null });
  await F.aktion(f, sz.id, 'beenden').expect(200);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM funk_rollen WHERE zustand != '{}'").get().n, 0);
  assert.deepEqual(F.fundstellen(f.db, 'A 10'), []);
  assert.equal((await F.stand(eve2.c, sz.id)).body.auswertung[0].eveSekunden, 40);
});
