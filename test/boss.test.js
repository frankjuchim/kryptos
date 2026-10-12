'use strict';
// Boss-Kampf: Freischaltung, Ziehung nach Mix, Timer (+Kulanz), kein Feedback, Auswertung, bester Versuch, 12-h-Sperre.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { RICHTIG, FALSCH, LEVEL_AUFGABEN } = require('./fixtures/antworten');
const W = require('./fixtures/welt_beispiel.json');

const STUFE = Object.fromEntries(W.aufgaben.map((a) => [a.id, a.stufe]));
const PUNKTE = Object.fromEntries(W.aufgaben.map((a) => [a.id, a.punkte || [0, 10, 20, 30][a.stufe]]));

async function bossSzenario() {
  const uhr = H.uhr();
  const sz = await H.szenario({ now: uhr });
  return { ...sz, uhr };
}

test('Freischaltung: automatisch erst ab 60 % der Level-Punkte; „offen“/„gesperrt“ per Kurseinstellung', async () => {
  const { s, lk, kurs } = await bossSzenario();
  let st = (await s.get('/api/boss/9')).body;
  assert.equal(st.frei, false);
  assert.match(st.grund, /60 %/);
  assert.equal((await s.post('/api/boss/9/start').send({})).status, 403);
  // nötige Punkte aus dem Grund lesen (fixture-unabhängig) und Level-Aufgaben der Reihe nach lösen
  const noetig = Number(st.grund.match(/\((\d+) von (\d+) nötigen Punkten\)/)[2]);
  let summe = 0;
  // nur kern/eA zählen für die Freischaltung (TECHNIK §8.2: ohne Ergänzung und Kür)
  const NIV = Object.fromEntries(W.levels.flatMap((l) => l.aufgaben.map((id) => [id, W.aufgaben.find((a) => a.id === id).niveau ?? l.niveau ?? 'kern'])));
  for (const id of LEVEL_AUFGABEN.filter((x) => ['kern', 'eA'].includes(NIV[x]))) {
    if (summe >= noetig) break;
    await s.post(`/api/aufgaben/${id}/pruefen`).send({ antwort: RICHTIG[id] });
    summe += PUNKTE[id];
  }
  st = (await s.get('/api/boss/9')).body;
  assert.equal(st.frei, true);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'gesperrt' } });
  assert.equal((await s.get('/api/boss/9')).body.frei, false);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  assert.equal((await s.get('/api/boss/9')).body.frei, true);
});

test('Ziehung nach Mix, kein Feedback während des Kampfes, Auswertung mit Erklärung', async () => {
  const { s, lk, kurs } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  assert.equal(k.laeuft, true);
  assert.equal(k.aufgaben.length, 3);
  const stufen = k.aufgaben.map((a) => STUFE[a.id]);
  assert.deepEqual([stufen.filter((x) => x === 1).length, stufen.filter((x) => x === 2).length, stufen.filter((x) => x === 3).length], [1, 1, 1], 'Mix 1/1/1');
  assert.deepEqual([...stufen].sort(), stufen, 'leichte zuerst');
  assert.ok(k.aufgaben.every((a) => a.id.includes('-B-')), 'nur Pool-Aufgaben');
  assert.ok(!JSON.stringify(k).includes('loesung') && !JSON.stringify(k).includes('erklaerung'), 'keine Lösungen im laufenden Kampf');
  // Antworten speichern: keine Bewertung
  const [a1, a2] = k.aufgaben;
  let r = await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a1.id, antwort: FALSCH[a1.id] });
  assert.deepEqual(r.body, { gespeichert: true, anzahl: 1 });
  r = await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a1.id, antwort: RICHTIG[a1.id] }); // änderbar
  assert.equal(r.body.anzahl, 1);
  await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a2.id, antwort: FALSCH[a2.id] });
  assert.equal((await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-L1-01', antwort: {} })).status, 400, 'fremde Aufgabe');
  // erneuter Start liefert denselben laufenden Kampf
  assert.equal((await s.post('/api/boss/9/start').send({})).body.id, k.id);
  const zwischen = (await s.get(`/api/boss/kampf/${k.id}`)).body;
  assert.deepEqual(zwischen.aufgaben[0].antwort, RICHTIG[a1.id], 'gespeicherte Antwort kommt zurück');
  // beenden
  const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.equal(e.laeuft, false);
  assert.equal(e.punkte, PUNKTE[a1.id]);
  assert.equal(e.aufgaben[0].ok, true);
  assert.equal(e.aufgaben[1].ok, false);
  assert.ok(e.aufgaben[0].erklaerung.length && e.aufgaben[0].loesung, 'Erklärung nach dem Kampf');
  assert.equal((await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a1.id, antwort: RICHTIG[a1.id] })).status, 409);
});

test('12-h-Sperre nach einem Kampf; bester Versuch zählt; besiegt ab 50 %; Makellos bei 100 %', async () => {
  const { app, s, lk, kurs, uhr } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', beamer: true } });
  // Versuch 1: alles richtig
  let k = (await s.post('/api/boss/9/start').send({})).body;
  for (const a of k.aufgaben) await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a.id, antwort: RICHTIG[a.id] });
  let e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.equal(e.punkte, e.maxPunkte);
  assert.equal(e.besiegt, true);
  // Sperre
  uhr.vor(11 * 3600 * 1000);
  let r = await s.post('/api/boss/9/start').send({});
  assert.equal(r.status, 409);
  assert.match(r.body.error, /12 Stunden/);
  assert.ok((await s.get('/api/boss/9')).body.gesperrtBis);
  uhr.vor(1 * 3600 * 1000 + 1000);
  // Versuch 2: alles falsch → bester Versuch bleibt
  k = (await s.post('/api/boss/9/start').send({})).body;
  assert.equal(k.laeuft, true);
  e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.equal(e.punkte, 0);
  const st = (await s.get('/api/boss/9')).body;
  assert.equal(st.versuche.length, 2);
  assert.equal(st.bester.punkte, st.bester.maxPunkte);
  const p = (await s.get('/api/profil')).body;
  assert.equal(p.punkte.boss, st.bester.punkte);
  const keys = p.abzeichen.filter((a) => a.erhalten).map((a) => a.key);
  assert.ok(keys.includes('boss9_besiegt') && keys.includes('makellos'));
  // Beamer-Board-Erfolg
  const b = (await H.client(app).get('/api/board/' + kurs.boardSchluessel)).body;
  assert.ok(b.erfolge.some((x) => x.text === 'Lena S. hat den Testwelt-Boss besiegt'), JSON.stringify(b.erfolge));
});

test('Timer: serverseitig mit 30 s Kulanz; danach automatisch ausgewertet', async () => {
  const { s, lk, kurs, uhr } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  assert.equal(Date.parse(k.deadline) - Date.parse(k.start), 25 * 60000);
  const [a1, a2] = k.aufgaben;
  uhr.vor(25 * 60000 + 20000); // 20 s nach Ablauf: Kulanz
  assert.equal((await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a1.id, antwort: RICHTIG[a1.id] })).status, 200);
  uhr.vor(15000); // 35 s nach Ablauf
  const r = await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: a2.id, antwort: RICHTIG[a2.id] });
  assert.equal(r.status, 409);
  const e = (await s.get(`/api/boss/kampf/${k.id}`)).body;
  assert.equal(e.laeuft, false);
  assert.equal(e.punkte, PUNKTE[a1.id], 'nur die rechtzeitig gespeicherte Antwort zählt');
  assert.equal(Date.parse(e.ende), Date.parse(k.deadline) + 30000);
});

test('Nicht beendeter Kampf wird beim nächsten Abruf nach Ablauf ausgewertet', async () => {
  const { s, lk, kurs, uhr } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  uhr.vor(2 * 3600 * 1000);
  const st = (await s.get('/api/boss/9')).body;
  assert.equal(st.laufend, null);
  assert.equal(st.versuche.length, 1);
  assert.equal((await s.get(`/api/boss/kampf/${k.id}`)).body.laeuft, false);
});

test('Fremde Kämpfe sind nicht abrufbar', async () => {
  const { app, s, lk, kurs } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  const t = await H.schuelerClient(app, kurs, 'Tim T.');
  assert.equal((await t.get(`/api/boss/kampf/${k.id}`)).status, 404);
  assert.equal((await t.post(`/api/boss/kampf/${k.id}/beenden`).send({})).status, 404);
});

test('Ziehung: deterministisch prüfbar über den Dienst (Mix nicht erfüllbar → Auffüllen)', async () => {
  const { app } = await bossSzenario();
  const boss = app.locals.services.boss;
  const ids = boss.ziehe({ pool: ['W9-B-01', 'W9-B-02', 'W9-B-03', 'W9-B-04', 'W9-B-05', 'W9-B-06'], anzahl: 5, mix: { 1: 0, 2: 0, 3: 4 } });
  assert.equal(ids.length, 5, 'nur 2 Stufe-3-Aufgaben vorhanden – Rest wird aufgefüllt');
  assert.equal(new Set(ids).size, 5);
});

test('Boss: keine Diagnose im Kampf, Diagnose in der Auswertung, keine Fallen-Zählung', async () => {
  const { s, lk, kurs } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  assert.ok(k.aufgaben.some((a) => a.id === 'W9-B-05'));
  await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-B-05', antwort: FALSCH['W9-B-05'] }).expect(200);
  assert.ok(!JSON.stringify((await s.get(`/api/boss/kampf/${k.id}`)).body).includes('diagnose'));
  const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.deepEqual(e.aufgaben.find((a) => a.id === 'W9-B-05').diagnose.map((d) => [d.p, d.code]), [['P3', 'richtung']]);
  assert.deepEqual(e.aufgaben.find((a) => a.id === 'W9-B-01').diagnose, []);
  const fallen = (await s.get('/api/profil')).body.fallen;
  assert.ok(fallen.every((x) => x.fehlversuche === 0), 'Boss zählt nicht in fallen_zaehler');
});

/** Fixture-Kopie: W9-B-01 = fremde Chiffre mit fehlmuster (wie W9-L5-08), W9-B-03 = Signatur-Schaubild (wie W9-L6-05). */
function bossWeltMitSchaubild() {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const d = JSON.parse(JSON.stringify(W));
  const von = (id) => d.aufgaben.find((a) => a.id === id);
  const ersetze = (ziel, quelle) => {
    const i = d.aufgaben.findIndex((a) => a.id === ziel);
    const alt = d.aufgaben[i];
    d.aufgaben[i] = { ...JSON.parse(JSON.stringify(von(quelle))), id: ziel, stufe: alt.stufe, niveau: alt.niveau, kategorie: alt.kategorie };
  };
  ersetze('W9-B-01', 'W9-L5-08');
  ersetze('W9-B-03', 'W9-L6-05');
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-boss-'));
  const datei = path.join(ordner, 'welt9.json');
  fs.writeFileSync(datei, JSON.stringify(d));
  return datei;
}

test('Boss: Antwort wird mit Kontext (Aufgabe) bereinigt – unbekannter Akteur im Schaubild → 400; fehlmuster nie in der Auswertung', async () => {
  const uhr = H.uhr();
  const { app, s, lk, kurs } = await H.szenario({ now: uhr, weltDateien: [bossWeltMitSchaubild()] });
  assert.ok(app.locals.services.inhalte.katalog.aufgaben.get('W9-B-03').interaktion.kind === 'schaubild-ergaenzen', 'Seed der Kopie');
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } });
  const k = (await s.post('/api/boss/9/start').send({}).expect(201)).body;
  assert.deepEqual(k.aufgaben.map((a) => a.id).sort(), ['W9-B-01', 'W9-B-03', 'W9-B-05']);
  assert.ok(!/fehlmuster/.test(JSON.stringify(k)), 'laufender Kampf ohne fehlmuster');
  const put = (antwort) => s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-B-03', antwort });
  await put({ s1: { art: 'privat', inhaber: 'X' }, s2: { art: 'oeffentlich', inhaber: 'A' } }).expect(400);
  await put({ s1: { art: 'privat', inhaber: 'A' }, s2: { art: 'oeffentlich', inhaber: 'A' } }).expect(200);
  await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-B-01', antwort: 'FCCFVOEGMVU' }).expect(200);
  const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.equal(e.aufgaben.find((a) => a.id === 'W9-B-03').ok, true);
  assert.deepEqual(e.aufgaben.find((a) => a.id === 'W9-B-01').diagnose.map((d) => [d.p, d.code]), [['P4', 'regel']]);
  assert.ok(!/fehlmuster/.test(JSON.stringify(e)), 'Auswertung ohne fehlmuster');
  assert.ok(!/fehlmuster/.test(JSON.stringify((await s.get(`/api/boss/kampf/${k.id}`)).body)));
  // auch der gespeicherte Versuch (ergebnis mit Diagnose) enthält keine Prüfdaten
  assert.ok(!/fehlmuster/.test(JSON.stringify(app.locals.db.prepare('SELECT * FROM boss_versuche').all())));
});

test('Boss: gespeicherte chiffre-Antwort mit leerem Kästchen bleibt falsch (kanonische Form idempotent, Review M3 K1)', async () => {
  const { s, lk, kurs } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen', niveau: 'gA' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  assert.ok(k.aufgaben.some((a) => a.id === 'W9-B-05'));
  // TREFF·PUNKT mit leerem 6. Kästchen: P steht an Position 6 statt 5
  const liste = ['T', 'R', 'E', 'F', 'F', '', 'P', 'U', 'N', 'K', 'T'];
  await s.put(`/api/boss/kampf/${k.id}/antwort`).send({ aufgabeId: 'W9-B-05', antwort: liste }).expect(200);
  const e = (await s.post(`/api/boss/kampf/${k.id}/beenden`).send({})).body;
  assert.equal(e.aufgaben.find((a) => a.id === 'W9-B-05').ok, false);
});
