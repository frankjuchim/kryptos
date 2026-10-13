'use strict';
// Themenübersicht /themen: öffentlich, ohne Lösungen, Verweise auf Level und Arbeitsblatt-PDFs; PDF-Auslieferung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const H = require('./helpers');

// Kryptos: bis zu den eigenen Welten und Akten (M5) prüft die Kern-Fixture (Testwelt 9, Fixture-PDFs).
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const MAT = path.join(__dirname, 'fixtures', 'materialien');
const PDF_DIR = path.join(MAT, 'Arbeitsblaetter_PDF');

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
  // Jedes Level mit Arbeitsblatt-Angabe (ab) ist zugeordnet, und jedes Arbeitsblatt hat eine ausgelieferte PDF
  for (const l of levels.filter((x) => x.ab)) assert.ok(l.abBlatt && l.abBlatt.url, `Level ${l.id} ohne Arbeitsblatt (${l.ab})`);
  assert.ok(levels.some((x) => x.abBlatt && x.abBlatt.url));
  const abs = d.welten.flatMap((w) => w.arbeitsblaetter);
  assert.equal(abs.length, 2);
  for (const a of abs) assert.match(a.url, /^\/arbeitsblaetter\/Welt_\d_[A-Za-z]+\/KR_W\d-AB\d_[A-Za-z0-9_-]+\.pdf$/);
  assert.ok(d.werkzeugkarten.url.endsWith('.pdf'));
  // Papier-Boss und Warm-up-Karten je Welt
  const weitere = d.welten.flatMap((w) => w.weitere);
  assert.equal(weitere.length, 2);
  assert.deepEqual(d.welten.map((w) => w.weitere.map((x) => x.art).join('+')), ['boss+warmup']);
  for (const x of weitere) assert.match(x.url, /^\/arbeitsblaetter\/Welt_\d_[A-Za-z]+\/KR_W\d-(Boss|Probeklausur|Warm-up-Karten)[A-Za-z0-9_-]*\.pdf$/);
  // Querschnitte: Kategorien und Fallen verweisen auf existierende Level
  const ids = new Set(levels.map((l) => l.id));
  for (const k of d.kategorien) for (const o of k.orte) assert.ok(ids.has(o.id));
  assert.equal(d.fallen.length, 10);
  assert.equal(d.fallen[0].p, 'P1');
  assert.equal(d.fallen[2].titel, 'Umkehrung falsch');
  assert.ok(d.fallen.some((f) => f.anzahl > 0));
});

test('Arbeitsblatt-PDFs: nur Demo-PDFs ohne Anmeldung, alle anderen für Schüler und Lehrkräfte; Pfad-Tricks nicht', async () => {
  const sz = await H.szenario({ seedDir: SEED, arbeitsblaetterDir: PDF_DIR });
  const app = sz.app;
  const d = (await request(app).get('/api/themen')).body;
  const url = d.welten[0].arbeitsblaetter[1].url;
  assert.equal(d.welten[0].arbeitsblaetter[1].demo, false);
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
  const demos = [d.werkzeugkarten, ...d.welten.flatMap((w) => [...w.arbeitsblaetter, ...(w.weitere || [])])].filter((a) => a.demo);
  assert.deepEqual(demos.map((a) => a.url.split('/').pop()), ['KR_Werkzeugkarten_Test.pdf', 'KR_W9-AB1_Bloecke_und_Luecken.pdf']);
  for (const a of demos) await request(app).get(a.url).expect(200);
  // Papier-Boss, Probeklausur, Warm-up-Karten: nur angemeldet
  for (const x of d.welten.flatMap((w) => w.weitere || [])) await request(app).get(x.url).expect(401);
  await request(app).get('/arbeitsblaetter/Welt_9_Testwelt/gibt_es_nicht.pdf').expect(404);
  await request(app).get('/arbeitsblaetter/').expect(404);
  await request(app).get('/arbeitsblaetter/Welt_9_Testwelt/').expect(404);
  await request(app).get('/arbeitsblaetter/..%2f..%2fpackage.json').expect(404);
  await request(app).get('/arbeitsblaetter/%2e%2e/%2e%2e/seed/arbeitsblaetter.json').expect(404);
  await request(app).get('/themen').expect(200).expect('Content-Type', /html/);
});

test('Themenübersicht ohne Arbeitsblatt-Ordner: Level ja, PDF-Links leer', async () => {
  const app = H.makeApp({ seedDir: SEED, arbeitsblaetterDir: null });
  const d = (await request(app).get('/api/themen').expect(200)).body;
  assert.equal(d.welten.length, 1);
  assert.ok(d.welten[0].levels.length > 0);
  assert.ok(d.welten.flatMap((w) => w.arbeitsblaetter).every((a) => a.url === null));
});

test('Verzeichnis seed/arbeitsblaetter.json passt zu den erzeugten PDFs', () => {
  const v = JSON.parse(fs.readFileSync(path.join(SEED, 'arbeitsblaetter.json'), 'utf8'));
  const alle = [
    v.werkzeugkarten,
    ...v.welten.flatMap((w) => [...w.arbeitsblaetter, ...(w.weitere || [])].map((a) => ({ ...a, datei: `${w.ordner}/${a.datei}` })))
  ];
  for (const a of alle) {
    assert.ok(fs.existsSync(path.join(PDF_DIR, a.datei)), `PDF fehlt: ${a.datei} (python3 werkzeuge/arbeitsblaetter_pdf.py)`);
    assert.match(path.basename(a.datei), /^[A-Za-z0-9_.-]+$/, 'Dateiname ohne Umlaute und Leerzeichen');
  }
});

test('Öffentlicher PDF-Ordner enthält nie Klausuren, Erwartungshorizonte oder Lösungen', () => {
  const v = JSON.parse(fs.readFileSync(path.join(SEED, 'arbeitsblaetter.json'), 'utf8'));
  const quellen = [v.werkzeugkarten.quelle, ...v.welten.flatMap((w) => [...w.arbeitsblaetter, ...(w.weitere || [])].map((a) => a.quelle))];
  for (const q of quellen) {
    assert.ok(!/5_Loesungen|_LSG|Erwartungshorizont|(^|[/_])Klausur|Nachschreib/i.test(q), `nicht öffentlich: ${q}`);
  }
  const dateien = fs.readdirSync(PDF_DIR, { recursive: true }).map(String);
  for (const f of dateien) assert.ok(!/LSG|Loesung|Erwartungshorizont|Nachschreib|(^|[/_-])Klausur/i.test(f), `nicht öffentlich: ${f}`);
  // Warm-up-Karten nur ohne Lösungsteil
  for (const w of v.welten) for (const x of w.weitere || []) if (x.art === 'warmup') assert.equal(x.ohneLoesungsteil, true, x.datei);
});

test('Lösungen: nie über /arbeitsblaetter oder statisch erreichbar; im Image nur Loesungen_Portal/Lehrkraft_PDF unter materialien/', async () => {
  const app = H.makeApp({ seedDir: SEED, arbeitsblaetterDir: PDF_DIR });
  const lsg = path.join(MAT, 'Loesungen_Portal', 'Welt_9_Testwelt');
  const datei = fs.existsSync(lsg) ? fs.readdirSync(lsg)[0] : 'x.pdf';
  for (const url of [
    `/arbeitsblaetter/..%2fLoesungen_Portal/Welt_9_Testwelt/${datei}`,
    `/arbeitsblaetter/%2e%2e/Loesungen_Portal/Welt_9_Testwelt/${datei}`,
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
  for (const d of verboten) await request(app).get(`/arbeitsblaetter/${d}`).expect(401);
  await request(app).get(`/arbeitsblaetter/${erlaubt}`).expect(200);
});
