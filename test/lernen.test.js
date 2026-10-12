'use strict';
// Aufgaben über die API: Lösung bleibt geheim, Punkteformel, Tipps, Aufdecken, Schrittprüfung, Freischaltung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { RICHTIG, FALSCH, LEVEL_AUFGABEN } = require('./fixtures/antworten');
const { punkteFuer } = require('../src/domain');

test('Punkteformel: round(punkte × max(0.25, 1 − 0.25·F − 0.2·T))', () => {
  assert.equal(punkteFuer(10, 0, 0), 10);
  assert.equal(punkteFuer(10, 1, 0), 8); // 7.5 → 8
  assert.equal(punkteFuer(20, 1, 1), 11); // 20 × 0.55
  assert.equal(punkteFuer(30, 2, 0), 15);
  assert.equal(punkteFuer(30, 0, 2), 18);
  assert.equal(punkteFuer(30, 3, 0), 8); // 30 × 0.25 = 7.5 → 8
  assert.equal(punkteFuer(30, 10, 5), 8, 'Untergrenze 25 %');
  assert.equal(punkteFuer(10, 2, 1), 3); // 10 × 0.3
});

test('Lösung verlässt den Server nicht vor dem Lösen/Aufdecken', async () => {
  const { s } = await H.szenario();
  for (const id of LEVEL_AUFGABEN) {
    const r = await s.get('/api/aufgaben/' + id);
    assert.equal(r.status, 200, id);
    const text = JSON.stringify(r.body);
    assert.ok(!('loesung' in r.body) && !('erklaerung' in r.body) && !('muster' in r.body), id);
    assert.ok(!text.includes('"loesung"') && !text.includes('"richtig"') && !text.includes('"reihenfolgen"') && !text.includes('"tausche"'), id);
    assert.equal(r.body.zustand.tipps.length, 0, 'keine Tipps ohne Anfrage');
  }
  // falsche Antwort: keine Lösung in der Antwort
  const f = await s.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: FALSCH['W9-L1-01'] });
  assert.ok(!('loesung' in f.body));
  // Welt- und Level-Ansicht ebenfalls ohne Lösungen
  const w = JSON.stringify((await s.get('/api/welten')).body) + JSON.stringify((await s.get('/api/levels/W9-L2')).body);
  assert.ok(!w.includes('loesung'));
});

test('Boss-Aufgaben sind außerhalb des Kampfes nicht abrufbar', async () => {
  const { s } = await H.szenario();
  assert.equal((await s.get('/api/aufgaben/W9-B-01')).status, 404);
  assert.equal((await s.post('/api/aufgaben/W9-B-01/pruefen').send({ antwort: { g1: '3' } })).status, 404);
  assert.equal((await s.post('/api/aufgaben/W9-B-01/aufdecken').send({})).status, 404);
});

test('Prüfen: Fehlversuche, Tipp, Punkte beim ersten Lösen, danach keine weiteren Punkte', async () => {
  const { s } = await H.szenario();
  const id = 'W9-L1-02'; // Stufe 2, 20 Punkte, 2 Tipps
  let r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: FALSCH[id] });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, false);
  assert.deepEqual(r.body.felder, { c1: true, c2: false, c3: true, art: false, op: false });
  assert.equal(r.body.zustand.fehlversuche, 1);
  assert.equal(r.body.zustand.moeglich, 15);
  r = await s.post(`/api/aufgaben/${id}/tipp`).send({});
  assert.equal(r.body.zustand.tipps.length, 1);
  assert.equal(r.body.zustand.moeglich, 11);
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.equal(r.body.ok, true);
  assert.equal(r.body.geloest, true);
  assert.equal(r.body.punkteErhalten, 11);
  assert.ok(Array.isArray(r.body.erklaerung) && r.body.loesung, 'Lösung + Erklärung nach dem Lösen');
  // erneut lösen: keine Punkte, keine Fehlversuche mehr
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: FALSCH[id] });
  assert.equal(r.body.zustand.fehlversuche, 1);
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.equal(r.body.punkteErhalten, 0);
  const p = (await s.get('/api/profil')).body;
  assert.equal(p.punkte.gesamt, 11);
  // Tipps nach dem Lösen: alle sichtbar, zählen nicht
  const g = (await s.get(`/api/aufgaben/${id}`)).body;
  assert.equal(g.zustand.tipps.length, 2);
  assert.equal(g.zustand.status, 'geloest');
  assert.ok(g.loesung && g.erklaerung);
});

test('Leere Antwort zählt nicht als Fehlversuch (400)', async () => {
  const { s } = await H.szenario();
  const r = await s.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: { g1: '', g2: ' ' } });
  assert.equal(r.status, 400);
  const g = (await s.get('/api/aufgaben/W9-L1-01')).body;
  assert.equal(g.zustand.fehlversuche, 0);
  assert.equal((await s.post('/api/aufgaben/W9-L1-04/pruefen').send({ antwort: 'a' })).status, 400, 'falsche Form');
});

test('Lösung zeigen: 0 Punkte, Status „angesehen“, Aufgabe bleibt übbar (nachgelöst)', async () => {
  const { s } = await H.szenario();
  const id = 'W9-L2-07';
  let r = await s.post(`/api/aufgaben/${id}/aufdecken`).send({});
  assert.equal(r.status, 200);
  assert.equal(r.body.zustand.status, 'angesehen');
  assert.deepEqual(r.body.loesung.zellen.length, 5);
  assert.deepEqual(r.body.muster, r.body.loesung.zellen);
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
  assert.equal(r.body.ok, true);
  assert.equal(r.body.punkteErhalten, 0);
  const lv = (await s.get('/api/levels/W9-L2')).body.aufgaben.find((a) => a.id === id);
  assert.equal(lv.status, 'angesehen');
  assert.equal(lv.nachgeloest, true);
  assert.equal((await s.get('/api/profil')).body.punkte.gesamt, 0);
});

test('Schrittprüfung (teilweise): falscher Schritt = Fehlversuch, letzter richtiger Schritt löst die Aufgabe', async () => {
  const { s } = await H.szenario();
  const id = 'W9-L2-06';
  let r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: [4], teilweise: true });
  assert.deepEqual([r.body.ok, r.body.vollstaendig, r.body.geloest], [true, false, false]);
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: [4, 6], teilweise: true });
  assert.deepEqual([r.body.ok, r.body.ersteFalschePosition], [false, 1]);
  assert.equal(r.body.zustand.fehlversuche, 1);
  r = await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: [4, 7, 5], teilweise: true });
  assert.deepEqual([r.body.ok, r.body.vollstaendig, r.body.geloest, r.body.punkteErhalten], [true, true, true, 8]);
  // Mehrteilig: Schrittprüfung nur für erlaubte Teile
  // Bug-Hunt: nur Teil a) (Zeilenwahl) ist einzeln prüfbar, Teil b) (Lücken) nicht
  assert.equal((await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: { g1: '<' }, teilweise: true, teil: 1 })).status, 400);
});

test('Fallen-Zähler: Fehlversuche je P-Kategorie im Profil', async () => {
  const { s } = await H.szenario();
  await s.post('/api/aufgaben/W9-L2-09/pruefen').send({ antwort: FALSCH['W9-L2-09'] }); // P1, P6
  await s.post('/api/aufgaben/W9-L1-01/pruefen').send({ antwort: FALSCH['W9-L1-01'] }); // P6
  const f = Object.fromEntries((await s.get('/api/profil')).body.fallen.map((x) => [x.p, x.fehlversuche]));
  assert.equal(f.P1, 1);
  assert.equal(f.P6, 2);
  assert.equal(f.P9, 0);
});

test('Welt-Freischaltung: gesperrte Welt → 403 für Level und Aufgaben', async () => {
  const { s, lk, kurs } = await H.szenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [0, 1] } });
  const w = (await s.get('/api/welten')).body.welten.find((x) => x.nr === 9);
  assert.equal(w.frei, false);
  assert.equal((await s.get('/api/levels/W9-L1')).status, 403);
  assert.equal((await s.get('/api/aufgaben/W9-L1-01')).status, 403);
});

test('IDE-Häkchen: nur Überblick, 0 Punkte', async () => {
  const { s } = await H.szenario();
  assert.equal((await s.post('/api/levels/W9-L1/ide').send({ erledigt: true })).body.erledigt, true);
  assert.equal((await s.get('/api/levels/W9-L1')).body.ideErledigt, true);
  assert.equal((await s.get('/api/profil')).body.punkte.gesamt, 0);
  await s.post('/api/levels/W9-L1/ide').send({ erledigt: false });
  assert.equal((await s.get('/api/levels/W9-L1')).body.ideErledigt, false);
});

test('Rang: Anteil der Level-Punkte aller freigeschalteten Welten', async () => {
  const { s } = await H.szenario();
  // MAX = Level-Punkte aller Level-Aufgaben der Fixture; 30 Punkte (W9-L2-02, Stufe 3) → Rang aus dem Anteil
  const W = require('./fixtures/welt_beispiel.json');
  const { rangFuer } = require('../src/domain');
  const auf = new Map(W.aufgaben.map((a) => [a.id, a]));
  const MAX = W.levels.flatMap((l) => l.aufgaben).reduce((sum, id) => sum + (auf.get(id).punkte ?? { 1: 10, 2: 20, 3: 30 }[auf.get(id).stufe]), 0);
  await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: RICHTIG['W9-L2-02'] });
  const p = (await s.get('/api/profil')).body;
  assert.equal(p.rang.maxPunkte, MAX);
  assert.equal(p.rang.name, rangFuer(30 / MAX).name);
  assert.deepEqual(p.rang.naechster && p.rang.naechster.name, rangFuer(30 / MAX).naechster && rangFuer(30 / MAX).naechster.name);
});

test('Bug-Hunt gestuft: Teil a) (Zeilenwahl) einzeln prüfbar – falsch = Fehlversuch, richtig löst noch nicht; andere Teile nicht', async () => {
  const { s } = await H.szenario();
  let r = await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: [1], teilweise: true, teil: 0 }).expect(200);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.zustand.fehlversuche, 1);
  assert.equal(r.body.loesung, undefined);
  r = await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: [3], teilweise: true, teil: 0 }).expect(200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.geloest, false);
  assert.equal(r.body.zustand.status, 'offen');
  assert.equal(r.body.loesung, undefined, 'keine Lösung vor dem vollständigen Lösen');
  // Teil b) (Lücken) bleibt von der Teilprüfung ausgeschlossen
  await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: { g1: '<' }, teilweise: true, teil: 1 }).expect(400);
  r = await s.post('/api/aufgaben/W9-L2-02/pruefen').send({ antwort: [[3], { g1: '<' }] }).expect(200);
  assert.equal(r.body.geloest, true);
});

test('Archivfund: 0 Punkte, zählt für nichts, wird aber gespeichert (Delta §2)', async () => {
  const { s } = await H.szenario();
  const a = (await s.get('/api/archivfund/9').expect(200)).body;
  assert.equal(a.titel, 'Die Testdepesche');
  assert.equal(a.aufgabe.punkte, 0);
  assert.ok(!JSON.stringify(a).includes('TREFFPUNKT'), 'keine Lösung vorab');
  await s.get('/api/aufgaben/W9-A-01').expect(404);
  let r = (await s.post('/api/archivfund/9/pruefen').send({ antwort: 'HFSTTDIBYH' }).expect(200)).body;
  assert.equal(r.ok, false);
  r = (await s.post('/api/archivfund/9/pruefen').send({ antwort: 'treffpunkt' }).expect(200)).body;
  assert.deepEqual([r.ok, r.geloest, r.punkteErhalten], [true, true, 0]);
  const p = (await s.get('/api/profil')).body;
  assert.deepEqual([p.punkte.gesamt, p.geloest], [0, 0]);
  assert.deepEqual(p.abzeichen.filter((x) => x.erhalten), [], 'kein „Erste Schritte“ durch den Archivfund');
  const w9 = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9);
  assert.deepEqual(w9.archivfund, { titel: 'Die Testdepesche', status: 'geloest' });
  assert.equal(w9.epoche, 'Testepoche, 1900 – 2000');
  assert.equal(w9.kapitel, null, 'erst nach besiegtem Boss');
  await s.get('/api/archivfund/4').expect(404);
});

test('Archivfund: Tipp/Aufdecken über die eigene Route, gesperrte Welt 403, Kapitel ohne Boss null', async () => {
  const { s, lk, kurs } = await H.szenario();
  const d = (await s.post('/api/archivfund/9/aufdecken').send({}).expect(200)).body;
  assert.equal(d.zustand.status, 'angesehen');
  assert.ok(d.loesung, 'Lösungsteil nach dem Aufdecken');
  assert.equal((await s.get('/api/archivfund/9').expect(200)).body.zustand.status, 'angesehen');
  assert.equal((await s.get('/api/profil')).body.serie.serie, 0);
  await s.get('/api/archivfund/x').expect(400);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { welten: [0] } }).expect(200);
  await s.get('/api/archivfund/9').expect(403);
  await s.post('/api/archivfund/9/pruefen').send({ antwort: 'treffpunkt' }).expect(403);
});

test('Diagnose: erkannte Falle wird gezählt (statt der Liste fallen), Feedback je Zeichen, Schrittprüfung', async () => {
  const { s } = await H.szenario();
  const f = async () => Object.fromEntries((await s.get('/api/profil')).body.fallen.map((x) => [x.p, x.fehlversuche]));
  let r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'FABKXRGKYYOM' }).expect(200)).body;
  assert.deepEqual(r.diagnose.map((d) => [d.p, d.code]), [['P3', 'richtung']]);
  assert.equal(r.zeichen.length, 12);
  assert.deepEqual([(await f()).P3, (await f()).P1], [1, 0], 'nur die erkannte Falle');
  r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'AAAAAAAAAAAA' }).expect(200)).body;
  assert.equal(r.diagnose, undefined);
  assert.deepEqual([(await f()).P3, (await f()).P1], [2, 1], 'ohne Diagnose: Liste fallen (P1, P3)');
  r = (await s.post('/api/aufgaben/W9-L5-01/pruefen').send({ antwort: 'ZUB', teilweise: true }).expect(200)).body;
  assert.deepEqual([r.ok, r.ersteFalschePosition, r.diagnose[0].p], [false, 2, 'P3']);
  assert.equal((await f()).P3, 3);
  assert.equal(r.zustand.fehlversuche, 3);
});

test('fehlmuster/_fehlmuster (interne Prüfdaten) verlassen den Server nie – auch nicht nach dem Lösen oder in der Vorschau', async () => {
  const { s, lk } = await H.szenario();
  const sauber = (x, wo) => assert.ok(!/fehlmuster/.test(JSON.stringify(x)), `${wo}: fehlmuster in der Antwort`);
  // W9-L5-08: chiffre frei mit loesung.fehlmuster; W9-L5-09: gaps mit loesung._fehlmuster
  sauber((await s.post('/api/aufgaben/W9-L5-08/pruefen').send({ antwort: FALSCH['W9-L5-08'] }).expect(200)).body, 'falsch');
  const ok = (await s.post('/api/aufgaben/W9-L5-08/pruefen').send({ antwort: RICHTIG['W9-L5-08'] }).expect(200)).body;
  assert.equal(ok.geloest, true);
  assert.equal(ok.loesung.text, 'UVMGEOVFCCF', 'Lösung selbst bleibt erhalten');
  sauber(ok, 'gelöst');
  sauber((await s.get('/api/aufgaben/W9-L5-08').expect(200)).body, 'Aufgabe nach dem Lösen');
  const auf = (await s.post('/api/aufgaben/W9-L5-09/aufdecken').send({}).expect(200)).body;
  assert.deepEqual(auf.loesung.wert, ['26']);
  sauber(auf, 'aufgedeckt');
  sauber((await s.get('/api/aufgaben/W9-L5-09').expect(200)).body, 'Aufgabe nach dem Aufdecken');
  for (const id of ['W9-L5-08', 'W9-L5-09']) sauber((await lk.get(`/api/lehrer/vorschau/${id}`).expect(200)).body, `Vorschau ${id}`);
  sauber((await lk.get('/api/lehrer/vorschau').expect(200)).body, 'Vorschau-Liste');
  // der Katalog im Server behält die Prüfdaten (Diagnose braucht sie)
  assert.ok(s.app.locals.services.inhalte.katalog.aufgaben.get('W9-L5-09').loesung._fehlmuster);
});
