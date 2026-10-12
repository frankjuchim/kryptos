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
  // 60 % von 260 = 156 Punkte: alle Level-Aufgaben außer den 10er-Aufgaben lösen reicht (250 − …)
  let summe = 0;
  for (const id of LEVEL_AUFGABEN) {
    if (summe >= 156) break;
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
  assert.equal(k.aufgaben.length, 5);
  const stufen = k.aufgaben.map((a) => STUFE[a.id]);
  assert.deepEqual([stufen.filter((x) => x === 1).length, stufen.filter((x) => x === 2).length, stufen.filter((x) => x === 3).length], [2, 2, 1], 'Mix 2/2/1');
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
  const b = (await H.client(app).get('/api/board/' + kurs.code)).body;
  assert.ok(b.erfolge.some((x) => x.text === 'Lena S. hat den Testwelt-Boss besiegt'), JSON.stringify(b.erfolge));
});

test('Timer: serverseitig mit 30 s Kulanz; danach automatisch ausgewertet', async () => {
  const { s, lk, kurs, uhr } = await bossSzenario();
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { boss: 'offen' } });
  const k = (await s.post('/api/boss/9/start').send({})).body;
  assert.equal(Date.parse(k.deadline) - Date.parse(k.start), 10 * 60000);
  const [a1, a2] = k.aufgaben;
  uhr.vor(10 * 60000 + 20000); // 20 s nach Ablauf: Kulanz
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
  const t = await H.schuelerClient(app, kurs.code, 'Tim T.');
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
