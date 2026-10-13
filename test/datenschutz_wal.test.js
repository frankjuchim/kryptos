'use strict';
// Datenschutz in der Datenbankdatei (Plan M7 Task 160, Befund e2e 5): Die Datenbank läuft im WAL-Modus; gelöschte bzw.
// geleerte Inhalte dürfen nach Beenden, Ausblenden, Schließen, Arena-Löschen, Verbund-Löschung und Kurs-Sperre weder in
// `kryptos.db` noch in `kryptos.db-wal` stehen bleiben (secure_delete wirkt nur auf die Seiten der Datenbankdatei, alte
// Seitenstände bleiben sonst bis zum nächsten Checkpoint im WAL).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const H = require('./helpers');
const F = require('./hilfen_funk');

const verbund = (app, pfad, zweck, body) => request(app).post(pfad).set('Authorization', 'Bearer ' + H.verbundToken(zweck, {}, { app })).send(body);

/** Kurs mit drei Teams auf einer echten Datenbankdatei (WAL) */
async function mitDatei(n = 3) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-wal-'));
  const dbFile = path.join(dir, 'kryptos.db');
  const f = await F.kursMitTeams(n, { extra: { dbFile } });
  f.dbFile = dbFile;
  f.aufraeumen = () => {
    f.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  };
  return f;
}

/** Dateien (Datenbank und WAL), die die Nadel als Bytes enthalten */
function inDateien(f, nadel) {
  return ['', '-wal'].map((e) => f.dbFile + e).filter((p) => fs.existsSync(p) && fs.readFileSync(p).includes(nadel)).map((p) => path.basename(p));
}

const GEHEIM = 'OHSAL AKLUW HZZ';
const sende = (f, sz, i = 0, text = GEHEIM) => f.teams[i].c.post(`/api/funk/${sz.id}/nachrichten`).send({ text, klartext: 'haltet den pass' }).expect(200);

test('Beenden: Geheimtext danach weder in der Datenbankdatei noch im WAL', async () => {
  const f = await mitDatei();
  try {
    const sz = await F.starte(f, 'botenlauf');
    await sende(f, sz);
    assert.notDeepEqual(inDateien(f, GEHEIM), [], 'vorher auf der Platte (Probe greift)');
    await F.aktion(f, sz.id, 'beenden').expect(200);
    assert.deepEqual(inDateien(f, GEHEIM), []);
  } finally {
    f.aufraeumen();
  }
});

test('Ausblenden und Schließen: Inhalt danach nicht mehr auf der Platte', async () => {
  const f = await mitDatei();
  try {
    const sz = await F.starte(f, 'botenlauf');
    const nid = (await sende(f, sz)).body.nachricht.id;
    await f.lk.post(`/api/lehrer/funk/${sz.id}/nachrichten/${nid}/ausblenden`).send({}).expect(200);
    assert.deepEqual(inDateien(f, GEHEIM), [], 'ausgeblendet');
    await sende(f, sz, 1, 'QUITT UNGXY');
    await F.aktion(f, sz.id, 'pausieren').expect(200);
    await F.aktion(f, sz.id, 'beenden').expect(200);
    await F.aktion(f, sz.id, 'schliessen').expect(200);
    assert.deepEqual(inDateien(f, 'QUITT UNGXY'), [], 'geschlossen');
  } finally {
    f.aufraeumen();
  }
});

test('Verbund: Löschung nach sub und Kurs-Sperre lassen nichts im WAL', async () => {
  const f = await mitDatei();
  try {
    const sz = await F.starte(f, 'botenlauf');
    await sende(f, sz);
    await verbund(f.app, '/api/verbund/loeschen', 'loeschen', { sub: f.teams[0].c.sub }).expect(200);
    assert.deepEqual(inDateien(f, GEHEIM), [], 'nach sub');
  } finally {
    f.aufraeumen();
  }
  const g = await mitDatei();
  try {
    const sz = await F.starte(g, 'botenlauf');
    await sende(g, sz, 1, 'QUITT UNGXY');
    await verbund(g.app, `/api/verbund/kurse/${encodeURIComponent(g.kurs.kurs)}`, 'kurs-aendern', { aktiv: false }).expect(200);
    assert.deepEqual(inDateien(g, 'QUITT UNGXY'), [], 'Kurs gesperrt');
  } finally {
    g.aufraeumen();
  }
});

test('Arena löschen: Beschreibung danach nicht mehr auf der Platte', async () => {
  const f = await mitDatei(2);
  try {
    const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
    const beschreibung = 'Zuerst Vigenere mit dem Wort, dann Spalten mit demselben Wort WALPROBE';
    await f.teams[0].c.post(`/api/arena/${a.id}/chiffre`).send({ verfahren: F.FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: F.TEXT1, beschreibung }).expect(200);
    assert.notDeepEqual(inDateien(f, 'WALPROBE'), [], 'vorher auf der Platte');
    await f.lk.delete(`/api/lehrer/arena/${a.id}`).expect(200);
    assert.deepEqual(inDateien(f, 'WALPROBE'), []);
  } finally {
    f.aufraeumen();
  }
});

test('Wartung: 24-h-Löschung leert auch das WAL', async () => {
  const f = await mitDatei();
  try {
    const sz = await F.starte(f, 'botenlauf');
    await sende(f, sz);
    f.uhr.vor(25 * 3600 * 1000);
    f.app.locals.wartung.lauf();
    assert.equal(H.zaehle(f.app, 'funk_szenarien', 'id = ?', sz.id), 0);
    assert.deepEqual(inDateien(f, GEHEIM), []);
  } finally {
    f.aufraeumen();
  }
});
