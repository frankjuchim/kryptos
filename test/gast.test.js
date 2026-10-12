'use strict';
// Gastmodus (/gast): Demo-Aufgaben ohne Anmeldung, nichts wird gespeichert, keine echten Aufgaben/Lösungen,
// Demo-Kurs nur mit erfundenen Daten und ohne Download-Links.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const H = require('./helpers');

// Kryptos: Demo-Aufgaben aus der Kern-Fixture (test/fixtures/seed_beispiel/gast/demo.json), Lab-Welt = Fixture Welt 9
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const opts = { seedDir: SEED, weltDateien: [H.FIXTURE] };

test('Gast-Schüler: sechs Demo-Aufgaben, Aufgabe ohne Lösung/Erklärung/Tipps, Seite /gast erreichbar', async () => {
  const app = H.makeApp(opts);
  const c = H.client(app);
  await c.get('/gast').expect(200).expect('Content-Type', /html/);
  const s = (await c.get('/api/gast/schueler').expect(200)).body;
  assert.equal(s.vorhanden, true);
  assert.equal(s.aufgaben.length, 6);
  for (const a of s.aufgaben) {
    assert.match(a.id, /^W8-L1-0\d$/);
    const d = (await c.get(`/api/gast/aufgaben/${a.id}`).expect(200)).body;
    const text = JSON.stringify(d);
    for (const verboten of ['"loesung"', '"erklaerung"', '"tipps":["', '"muster"']) assert.ok(!text.includes(verboten), `${a.id}: ${verboten}`);
    assert.equal(d.zustand.tipps.length, 0);
  }
});

test('Gast-Schüler: Prüfung serverseitig, Lösung erst nach dem Lösen, Punkte nur angezeigt – nichts gespeichert', async () => {
  const app = H.makeApp(opts);
  const c = H.client(app);
  const db = app.locals.db;
  const vorher = db.prepare('SELECT (SELECT COUNT(*) FROM fortschritt) + (SELECT COUNT(*) FROM schueler) AS n').get().n;
  const falsch = (await c.post('/api/gast/aufgaben/W8-L1-01/pruefen').send({ antwort: { g1: '8', g2: '16', g3: '30', r3: '3' } }).expect(200)).body;
  assert.equal(falsch.ok, false);
  assert.equal(falsch.felder.g3, false);
  assert.equal(falsch.zustand.fehlversuche, 1);
  assert.ok(!('loesung' in falsch) && !('erklaerung' in falsch));
  const tipp = (await c.post('/api/gast/aufgaben/W8-L1-01/tipp').send({ fehlversuche: 1, tipps: 0 }).expect(200)).body;
  assert.equal(tipp.zustand.tipps.length, 1);
  const ok = (await c.post('/api/gast/aufgaben/W8-L1-01/pruefen').send({ antwort: { g1: '8', g2: '16', g3: '32', r3: '3' }, fehlversuche: 1, tipps: 1 }).expect(200)).body;
  assert.equal(ok.ok, true);
  assert.equal(ok.geloest, true);
  assert.equal(ok.punkteErhalten, 6, '10 × (1 − 0,25 − 0,2) = 5,5 → 6');
  assert.ok(Array.isArray(ok.erklaerung) && ok.erklaerung.length);
  // Bug-Hunt gestuft: Teil a) einzeln prüfbar
  const teilA = (await c.post('/api/gast/aufgaben/W8-L1-03/pruefen').send({ antwort: [4], teilweise: true, teil: 0 }).expect(200)).body;
  assert.equal(teilA.ok, true);
  const auf = (await c.post('/api/gast/aufgaben/W8-L1-05/aufdecken').send({}).expect(200)).body;
  assert.deepEqual(auf.loesung, { inhalt: ['2', '9', '7', '1'] });
  const nachher = db.prepare('SELECT (SELECT COUNT(*) FROM fortschritt) + (SELECT COUNT(*) FROM schueler) AS n').get().n;
  assert.equal(nachher, vorher, 'Gastmodus schreibt nichts in die Datenbank');
  await c.post('/api/gast/aufgaben/W8-L1-01/pruefen').send({}).expect(400);
});

test('Gastmodus gibt keine echten Lab-Aufgaben heraus', async () => {
  const app = H.makeApp(opts);
  const c = H.client(app);
  for (const id of ['W9-L1-01', 'W9-L2-01', 'W9-B-01', '..%2fW9-L1-01']) {
    await c.get(`/api/gast/aufgaben/${id}`).expect(404);
    await c.post(`/api/gast/aufgaben/${id}/aufdecken`).send({}).expect(404);
    await c.get(`/api/gast/vorschau/${id}`).expect(404);
  }
});

test('Gast-Lehrkraft: erfundener Demo-Kurs, nur lesend, Download-Links nur auf Demo-Dateien, keine echten Codes', async () => {
  // Der Demo-Kurs zeigt die Welten 0–2; bis zu den Kryptos-Welten (M5) dient die Fixture als Welt 0.
  const fs = require('node:fs');
  const os = require('node:os');
  const welt0 = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8').replace(/W9-/g, 'W0-'));
  welt0.welt = 0;
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kr-gast-')), 'welt0.json');
  fs.writeFileSync(datei, JSON.stringify(welt0));
  const app = H.makeApp({ ...opts, weltDateien: [datei] });
  const c = H.client(app);
  const d = (await c.get('/api/gast/lehrkraft').expect(200)).body;
  assert.equal(d.kurs.code, 'DEMO-K');
  assert.equal(d.schueler.length, 8);
  assert.ok(d.schueler.every((s) => s.code === '•••-•••'));
  assert.ok(d.levels.length > 0 && d.matrix.zeilen.every((z) => z.werte.length === d.levels.length));
  assert.equal(d.fallen.length, 10);
  const text = JSON.stringify(d);
  // Links nur auf die Demo-Dateien (seed/demo_materialien.json) – nie Lösungen; Kryptos hat noch keine Demo-PDFs (M5)
  const links = [...text.matchAll(/"url":"([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
  assert.deepEqual(links, []);
  assert.ok(!/loesung|erwartungshorizont/i.test(links.join(' ')));
  assert.ok(!text.includes('"loesung"'), 'keine Lösungen');
  // Vorschau nur für Demo-Aufgaben (mit Lösung)
  const v = (await c.get('/api/gast/vorschau/W8-L1-04').expect(200)).body;
  assert.ok(v.loesung && v.erklaerung.length);
  // kein Zugriff auf echte Lehrkraft-API
  await c.get('/api/lehrer/kurse').expect(401);
});

test('Ohne Demo-Datei: Schüler-Gastmodus meldet „nicht vorhanden“, App läuft', async () => {
  const app = H.makeApp({ ...opts, gastDatei: null });
  const c = H.client(app);
  assert.deepEqual((await c.get('/api/gast/schueler').expect(200)).body, { vorhanden: false });
  await c.get('/api/gast/aufgaben/W8-L1-01').expect(404);
});

test('Gast-Schüler: Fallen-Diagnose und Feedback je Zeichen; fehlmuster verlassen den Server nie', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const W = require('./fixtures/welt_beispiel.json');
  const kopie = (quelle, id) => ({ ...JSON.parse(JSON.stringify(W.aufgaben.find((a) => a.id === quelle))), id });
  const demo = {
    version: 2,
    welt: 8,
    titel: 'Probe-Level',
    farbe: '#1F4E79',
    levels: [{ id: 'W8-L1', nr: 'Probe', titel: 'Diagnose', niveau: 'kern', rolle: 'kryptoanalyse', aufgaben: ['W8-L1-01', 'W8-L1-02'] }],
    aufgaben: [kopie('W9-L5-01', 'W8-L1-01'), kopie('W9-L5-08', 'W8-L1-02')]
  };
  const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-gast-')), 'demo.json');
  fs.writeFileSync(datei, JSON.stringify(demo));
  const app = H.makeApp({ ...opts, gastDatei: datei });
  const c = H.client(app);
  assert.equal((await c.get('/api/gast/schueler').expect(200)).body.aufgaben.length, 2);
  const r = (await c.post('/api/gast/aufgaben/W8-L1-01/pruefen').send({ antwort: 'FABKXRGKYYOM' }).expect(200)).body;
  assert.equal(r.diagnose[0].p, 'P3');
  assert.equal(r.zeichen.length, 12);
  const sauber = (x, wo) => assert.ok(!/fehlmuster/.test(JSON.stringify(x)), wo);
  const f = (await c.post('/api/gast/aufgaben/W8-L1-02/pruefen').send({ antwort: 'FCCFVOEGMVU' }).expect(200)).body;
  assert.equal(f.diagnose[0].code, 'regel');
  sauber(f, 'falsch');
  sauber((await c.post('/api/gast/aufgaben/W8-L1-02/pruefen').send({ antwort: 'UVMGEOVFCCF' }).expect(200)).body, 'gelöst');
  sauber((await c.post('/api/gast/aufgaben/W8-L1-02/aufdecken').send({}).expect(200)).body, 'aufgedeckt');
  sauber((await c.get('/api/gast/aufgaben/W8-L1-02').expect(200)).body, 'Aufgabe');
  sauber((await c.get('/api/gast/vorschau/W8-L1-02').expect(200)).body, 'Vorschau');
});
