'use strict';
// Themenübersicht /themen: öffentlich, ohne Lösungen, Verweise auf Level und Akten-PDFs; PDF-Auslieferung unter /akten/
// (Kryptos K15: seed/akten.json statt arbeitsblaetter.json, Route /akten statt /arbeitsblaetter; Plan M5 Task 97).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const H = require('./helpers');

// Kryptos: bis zu den eigenen Welten und Akten (M5) prüft die Kern-Fixture (Testwelt 9, Fixture-PDFs).
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const MAT = path.join(__dirname, 'fixtures', 'materialien');
const PDF_DIR = path.join(MAT, 'Akten_PDF');

test('Themenübersicht: öffentlich, alle Welten und Level, keine Lösungen/Erklärungen/Tipps', async () => {
  const app = H.makeApp({ seedDir: SEED, arbeitsblaetterDir: PDF_DIR });
  const r = await request(app).get('/api/themen').expect(200);
  const d = r.body;
  assert.equal(d.welten.length, 1);
  const levels = d.welten.flatMap((w) => w.levels);
  const W = require('./fixtures/welt_beispiel.json');
  assert.equal(levels.length, W.levels.length);
  const text = JSON.stringify(d);
  for (const verboten of ['"loesung"', '"erklaerung"', '"tipps"', '"inhalt"', '"interaktion"']) assert.ok(!text.includes(verboten), verboten);
  // Akte je Level aus seed/akten.json (Zuordnung über `level`), mit ausgelieferter PDF
  const l1 = levels.find((l) => l.id === 'W9-L1');
  assert.deepEqual(l1.akte, { titel: 'Akte W9·1 – Blöcke und Lücken', url: '/akten/Welt_9_Testwelt/KR_W9-AB1_Bloecke_und_Luecken.pdf', demo: true });
  assert.equal(levels.find((l) => l.id === 'W9-L2').akte.titel, 'Akte W9·2 – Alle Interaktionen');
  assert.equal(levels.find((l) => l.id === 'W9-L6').akte, null);
  for (const l of levels) assert.ok(!('abBlatt' in l), 'abBlatt (Kern) ersetzt durch akte');
  for (const w of d.welten) assert.ok(!('arbeitsblaetter' in w), 'Welt hat akten statt arbeitsblaetter');
  const akten = d.welten.flatMap((w) => w.akten);
  assert.equal(akten.length, 2);
  for (const a of akten) assert.match(a.url, /^\/akten\/Welt_\d_[A-Za-z]+\/KR_W\d-AB\d_[A-Za-z0-9_-]+\.pdf$/);
  assert.deepEqual(akten.map((a) => a.nr), ['1', '2']);
  // Werkzeugkarten sind eine Liste
  assert.ok(Array.isArray(d.werkzeugkarten));
  assert.deepEqual(d.werkzeugkarten.map((x) => [x.nr, x.titel]), [[1, 'Werkzeugkarten (Test)']]);
  assert.match(d.werkzeugkarten[0].url, /^\/akten\/00_Werkzeugkarten\/.+\.pdf$/);
  // Papier-Boss und Warm-up-Karten je Welt
  const weitere = d.welten.flatMap((w) => w.weitere);
  assert.equal(weitere.length, 2);
  assert.deepEqual(d.welten.map((w) => w.weitere.map((x) => x.art).join('+')), ['boss+warmup']);
  for (const x of weitere) assert.match(x.url, /^\/akten\/Welt_\d_[A-Za-z]+\/KR_W\d-(Boss|Probeklausur|Warm-up-Karten)[A-Za-z0-9_-]*\.pdf$/);
  // Querschnitte: Kategorien und Fallen verweisen auf existierende Level
  const ids = new Set(levels.map((l) => l.id));
  for (const k of d.kategorien) for (const o of k.orte) assert.ok(ids.has(o.id));
  assert.equal(d.fallen.length, 10);
  assert.equal(d.fallen[0].p, 'P1');
  assert.equal(d.fallen[2].titel, 'Umkehrung falsch');
  assert.ok(d.fallen.some((f) => f.anzahl > 0));
});

test('Akten-PDFs (/akten/): nur Demo-PDFs ohne Anmeldung, alle anderen für Schüler und Lehrkräfte; Pfad-Tricks nicht', async () => {
  const sz = await H.szenario({ seedDir: SEED, arbeitsblaetterDir: PDF_DIR });
  const app = sz.app;
  const d = (await request(app).get('/api/themen')).body;
  const url = d.welten[0].akten[1].url;
  assert.equal(url, '/akten/Welt_9_Testwelt/KR_W9-AB2_Alle_Interaktionen.pdf');
  assert.equal(d.welten[0].akten[1].demo, false);
  const g = await request(app).get(url).expect(401);
  assert.match(g.text, /Nur nach Anmeldung/);
  assert.match(g.text, /\/static\/css\/tokens\.css\?v=/, 'Hinweisseite im neuen CSS (K20, E36)');
  assert.match(g.text, /Akten/);
  assert.doesNotMatch(g.text, /Arbeitsblätter|class="(?:btn|card|narrow)/);
  for (const c of [sz.s, sz.lk]) {
    const r = await c.get(url).expect(200);
    assert.equal(r.headers['content-type'], 'application/pdf');
    assert.equal(r.body.subarray(0, 5).toString(), '%PDF-');
    assert.match(r.headers['cache-control'], /private/);
  }
  // Demo-PDFs (seed/demo_materialien.json): ohne Anmeldung
  const demos = [...d.werkzeugkarten, ...d.welten.flatMap((w) => [...w.akten, ...(w.weitere || [])])].filter((a) => a.demo);
  assert.deepEqual(demos.map((a) => a.url.split('/').pop()), ['KR_Werkzeugkarten_Test.pdf', 'KR_W9-AB1_Bloecke_und_Luecken.pdf']);
  for (const a of demos) {
    const r = await request(app).get(a.url).expect(200);
    assert.equal(r.headers['content-type'], 'application/pdf');
  }
  // Papier-Boss, Probeklausur, Warm-up-Karten: nur angemeldet
  for (const x of d.welten.flatMap((w) => w.weitere || [])) await request(app).get(x.url).expect(401);
  await request(app).get('/akten/Welt_9_Testwelt/gibt_es_nicht.pdf').expect(404);
  await request(app).get('/akten/').expect(404);
  await request(app).get('/akten/Welt_9_Testwelt/').expect(404);
  await request(app).get('/akten/..%2f..%2fpackage.json').expect(404);
  await request(app).get('/akten/../seed/akten.json').expect(404);
  await request(app).get('/akten/%2e%2e/%2e%2e/seed/akten.json').expect(404);
  await sz.s.get('/akten/%2e%2e/%2e%2e/seed/akten.json').expect(404);
  await sz.s.get('/akten/Welt_9_Testwelt/KR_W9-AB1_Bloecke_und_Luecken.txt').expect(404);
  // die Kern-Route /arbeitsblaetter gibt es nicht mehr
  await request(app).get('/arbeitsblaetter/Welt_9_Testwelt/KR_W9-AB1_Bloecke_und_Luecken.pdf').expect(404);
  await sz.s.get('/arbeitsblaetter/Welt_9_Testwelt/KR_W9-AB2_Alle_Interaktionen.pdf').expect(404);
  await request(app).get('/themen').expect(200).expect('Content-Type', /html/);
});

test('Themenübersicht ohne Akten-Ordner: Level ja, PDF-Links leer', async () => {
  const app = H.makeApp({ seedDir: SEED, arbeitsblaetterDir: null });
  const d = (await request(app).get('/api/themen').expect(200)).body;
  assert.equal(d.welten.length, 1);
  assert.ok(d.welten[0].levels.length > 0);
  assert.ok(d.welten.flatMap((w) => w.akten).every((a) => a.url === null));
  assert.equal(d.welten[0].levels[0].akte.url, null);
});

test('Verzeichnis akten.json (Fixture) passt zu den PDFs', () => {
  const v = JSON.parse(fs.readFileSync(path.join(SEED, 'akten.json'), 'utf8'));
  const alle = [
    ...v.werkzeugkarten,
    ...v.welten.flatMap((w) => [...w.akten, ...(w.weitere || [])].map((a) => ({ ...a, datei: `${w.ordner}/${a.datei}` })))
  ];
  for (const a of alle) {
    assert.ok(fs.existsSync(path.join(PDF_DIR, a.datei)), `PDF fehlt: ${a.datei}`);
    assert.match(path.basename(a.datei), /^[A-Za-z0-9_.-]+$/, 'Dateiname ohne Umlaute und Leerzeichen');
  }
});

test('Öffentlicher PDF-Ordner enthält nie Klausuren, Erwartungshorizonte oder Lösungen', () => {
  const v = JSON.parse(fs.readFileSync(path.join(SEED, 'akten.json'), 'utf8'));
  const quellen = [...v.werkzeugkarten.map((x) => x.quelle), ...v.welten.flatMap((w) => [...w.akten, ...(w.weitere || [])].map((a) => a.quelle))];
  for (const q of quellen) {
    assert.ok(!/5_Loesungen|_LSG|Erwartungshorizont|(^|[/_])Klausur|Nachschreib/i.test(q), `nicht öffentlich: ${q}`);
  }
  const dateien = fs.readdirSync(PDF_DIR, { recursive: true }).map(String);
  for (const f of dateien) assert.ok(!/LSG|Loesung|Erwartungshorizont|Nachschreib|(^|[/_-])Klausur/i.test(f), `nicht öffentlich: ${f}`);
  // Warm-up-Karten nur ohne Lösungsteil
  for (const w of v.welten) for (const x of w.weitere || []) if (x.art === 'warmup') assert.equal(x.ohneLoesungsteil, true, x.datei);
});

test('Lösungen: nie über /akten oder statisch erreichbar; im Image nur Loesungen_Portal/Lehrkraft_PDF unter materialien/', async () => {
  const app = H.makeApp({ seedDir: SEED, arbeitsblaetterDir: PDF_DIR });
  const lsg = path.join(MAT, 'Loesungen_Portal', 'Welt_9_Testwelt');
  const datei = fs.existsSync(lsg) ? fs.readdirSync(lsg)[0] : 'x.pdf';
  for (const url of [
    `/akten/..%2fLoesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/akten/%2e%2e/Loesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/Loesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/materialien/Loesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/lehrkraft/dateien/Loesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/materialien/Loesungen_Arbeitsblaetter/03_Klausuren/AQ_W6-Klausur_Ladepark_Erwartungshorizont.pdf`
  ]) {
    await request(app).get(url).expect(404);
  }
  const ignore = fs.readFileSync(path.join(__dirname, '..', '.dockerignore'), 'utf8').split('\n').map((z) => z.trim());
  assert.ok(ignore.includes('materialien/*'), '.dockerignore muss materialien/* ausschließen');
  assert.deepEqual(ignore.filter((z) => z.startsWith('!')), ['!docs/AUFGABENFORMAT.md', '!docs/AUFGABENFORMAT_KRYPTO.md', '!materialien/Akten_PDF', '!materialien/Loesungen_Portal', '!materialien/Lehrkraft_PDF', '!scripts/validate.js', '!scripts/vertrag_pruefen.js'], 'nur Formatdateien, Skripte, Akten + Lehrkraft-Downloads ins Image');
  const docker = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
  const kopien = docker.split('\n').filter((z) => /^COPY\s+materialien/.test(z)).map((z) => z.split(/\s+/).slice(1).join(' '));
  assert.deepEqual(kopien, [
    'materialien/Akten_PDF ./akten',
    'materialien/Loesungen_Portal ./materialien/Loesungen_Portal',
    'materialien/Lehrkraft_PDF ./materialien/Lehrkraft_PDF'
  ], 'Lösungen nie in den öffentlichen Ordner ./akten');
});

test('demo_materialien.json: _LSG, _EH und Klausuren werden nie öffentlich (Plan M5 E55)', async () => {
  const os = require('node:os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-demo-'));
  const seed = path.join(tmp, 'seed'); const pdf = path.join(tmp, 'Akten_PDF');
  fs.cpSync(SEED, seed, { recursive: true });
  const verboten = ['Welt_0_Antike/KR_W0_Akte1_X_LSG.pdf', 'Welt_0_Antike/KR_W0_Boss0_Y_EH.pdf', 'Welt_6/KR_W6_Klausur_eA.pdf', 'Welt_6/KR_W6_Probeklausur.pdf'];
  const erlaubt = 'Welt_0_Antike/KR_W0_Akte1_Skytale.pdf';
  for (const d of [...verboten, erlaubt]) {
    fs.mkdirSync(path.dirname(path.join(pdf, d)), { recursive: true });
    fs.copyFileSync(path.join(PDF_DIR, 'Welt_9_Testwelt', 'KR_W9-AB1_Bloecke_und_Luecken.pdf'), path.join(pdf, d));
  }
  fs.writeFileSync(path.join(seed, 'demo_materialien.json'), JSON.stringify({ schueler: [...verboten, erlaubt], lehrkraft: [] }));
  const app = H.makeApp({ seedDir: seed, arbeitsblaetterDir: pdf });
  for (const d of verboten) await request(app).get(`/akten/${d}`).expect(401);
  await request(app).get(`/akten/${erlaubt}`).expect(200);
});

test('Themenübersicht mit den echten Seeds: drei Welten, je Level Akte mit URL, Boss 8 Aufgaben/25 min, Trainingsplatz, Warm-up 12 (Plan M5 Task 100)', async () => {
  const app = H.makeApp({ seedDir: path.join(__dirname, '..', 'seed'), weltDateien: [] });
  const d = (await request(app).get('/api/themen').expect(200)).body;
  // Plan M8: W3–W6 kommen Task für Task dazu (Akten Task 199, Warm-up Task 190, Generatoren Tasks 192–194) – die
  // vollständige Prüfung gilt für W0–W2, für die übrigen Welten mit Seed nur, dass sie erscheinen
  const mitSeed = fs.readdirSync(path.join(__dirname, '..', 'seed', 'welten')).map((x) => /^welt(\d)\.json$/.exec(x)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
  assert.deepEqual(d.welten.map((w) => w.nr), mitSeed);
  const fertig = d.welten.filter((w) => w.nr <= 2);
  assert.deepEqual(fertig.map((w) => w.boss.titel), ['Der Bote des Feldherrn', 'Der Kalif und der Kurier', 'Die Venezianische Depesche']);
  for (const w of fertig) {
    assert.deepEqual([w.boss.anzahl, w.boss.dauerMin], [8, 25], `Welt ${w.nr}: Boss`);
    assert.equal(w.warmup, 12, `Welt ${w.nr}: Warm-up`);
    assert.ok(w.training.length >= 5, `Welt ${w.nr}: Trainingsplatz`);
    assert.deepEqual(w.weitere.map((x) => x.art), ['boss', 'warmup']);
    for (const l of w.levels) {
      assert.ok(l.akte && l.akte.url, `${l.id}: Akte`);
      assert.match(l.akte.url, new RegExp(`^/akten/Welt_${w.nr}_\\w+/KR_W${w.nr}_Akte`));
      assert.ok(l.akte.titel.startsWith(`Akte W${w.nr}·${l.nr === 'K1' ? 'K1' : l.nr.split('.')[1]} – `), l.akte.titel);
    }
  }
  assert.deepEqual(fertig.map((w) => w.levels.length), [4, 3, 5]);
  assert.equal(d.werkzeugkarten.length, 7);
  assert.ok(d.werkzeugkarten.every((x) => x.url && x.url.startsWith('/akten/00_Werkzeugkarten/')));
  const text = JSON.stringify(d);
  for (const verboten of ['"loesung"', '"erklaerung"', '"tipps"', '_LSG', '_EH', 'Funkraum']) assert.ok(!text.includes(verboten), verboten);
});
