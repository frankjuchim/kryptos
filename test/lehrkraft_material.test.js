'use strict';
// Materialien für Lehrkräfte (Lösungen, Präsentationen, Lehrerhinweise, Klausuren): nur angemeldete Lehrkräfte,
// nur verzeichnete Dateien; Schüler und Gäste bekommen weder Übersicht noch Dateien.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const H = require('./helpers');

// Kern-Fixture (Testwelt 9, Fixture-PDFs unter Akten_PDF); echtes Material siehe unten (M5 Tasks 96/97).
const MAT = path.join(__dirname, 'fixtures', 'materialien');
const SEED = path.join(__dirname, 'fixtures', 'seed_beispiel');
const PDF_DIR = path.join(MAT, 'Akten_PDF');
const opts = { seedDir: SEED, materialienDir: MAT, arbeitsblaetterDir: PDF_DIR };

const alleDateien = (m) => [...m.allgemein, ...m.welten.flatMap((w) => w.eintraege)].flatMap((e) => e.dateien);

test('Materialien-Übersicht: vollständig je Welt, Lösungen nur unter /lehrkraft/dateien, Schülerfassung unter /akten/', async () => {
  const { lk } = await H.szenario(opts);
  const m = (await lk.get('/api/lehrer/materialien').expect(200)).body;
  assert.equal(m.welten.length, 1);
  const dateien = alleDateien(m);
  assert.equal(dateien.length, 14);
  for (const d of dateien) {
    assert.ok(d.url, `Datei fehlt: ${d.label}`);
    if (d.lehrkraft) assert.match(d.url, /^\/lehrkraft\/dateien\/(Lehrkraft_PDF|Loesungen_Portal)\//);
    else assert.match(d.url, /^\/akten\//);
    if (/^(Lösung|Lösungen|Erwartungshorizont|Klausur|Folien|Lehrerhinweise)$/.test(d.label)) assert.ok(d.lehrkraft, `${d.label} muss geschützt sein`);
  }
  // je Welt: Präsentation, Lehrerhinweise, Arbeitsblätter mit Lösung, Warm-up-Lösungen
  for (const w of m.welten) {
    const arten = new Set(w.eintraege.map((e) => e.art));
    for (const a of ['praesentation', 'hinweise', 'ab', 'warmup']) assert.ok(arten.has(a), `Welt ${w.nr} ohne ${a}`);
    for (const e of w.eintraege.filter((x) => x.art === 'ab')) assert.ok(e.dateien.some((d) => d.label === 'Lösung' && d.url));
  }
  const w9 = m.welten.find((w) => w.nr === 9);
  assert.equal(w9.eintraege.filter((e) => e.art === 'klausur').length, 1);
});

test('Lehrkraft lädt Lösung, Präsentation und Klausur-EH als PDF', async () => {
  const { lk } = await H.szenario(opts);
  const m = (await lk.get('/api/lehrer/materialien')).body;
  const geschuetzt = alleDateien(m).filter((d) => d.lehrkraft);
  for (const label of ['Lösung', 'Folien', 'Erwartungshorizont', 'Klausur', 'Lehrerhinweise']) {
    const d = geschuetzt.find((x) => x.label === label);
    const r = await lk.get(d.url).expect(200);
    assert.equal(r.headers['content-type'], 'application/pdf');
    assert.match(r.headers['cache-control'], /private/);
    assert.equal(r.body.subarray(0, 5).toString(), '%PDF-');
  }
});

test('Gäste und Schüler: keine Übersicht, keine Lösungs-PDFs (404); keine Pfad-Tricks, nur verzeichnete Dateien', async () => {
  const { app, lk, s } = await H.szenario(opts);
  const m = (await lk.get('/api/lehrer/materialien')).body;
  const url = alleDateien(m).find((d) => d.label === 'Lösung').url;
  await request(app).get(url).expect(404);
  await s.get(url).expect(404);
  await H.client(app).get('/api/lehrer/materialien').expect(401);
  await s.get('/api/lehrer/materialien').expect(401);
  // nach dem Ende der Sitzung (z. B. „Überall abmelden“: neue session_gen) ist die Datei wieder weg
  const lk2 = await H.adminClient(app);
  await lk2.get(url).expect(200);
  app.locals.db.prepare('UPDATE konten SET session_gen = session_gen + 1 WHERE sub = ?').run(lk2.sub);
  await lk2.get(url).expect(404);
  // Pfad-Tricks und nicht verzeichnete Dateien
  for (const u of [
    '/lehrkraft/dateien/Lehrkraft_PDF/verzeichnis.json',
    '/lehrkraft/dateien/Loesungen_Portal/',
    '/lehrkraft/dateien/..%2fpackage.json',
    '/lehrkraft/dateien/Loesungen_Portal/..%2f..%2fpackage.json',
    '/lehrkraft/dateien/%2e%2e/%2e%2e/src/app.js',
    '/lehrkraft/dateien/Loesungen_Arbeitsblaetter/03_Klausuren/KR_W9-Klausur_Testklausur_Erwartungshorizont.pdf',
    '/lehrkraft/dateien/Welt9_Testwelt/5_Loesungen/KR_W9_Klausur_Erwartungshorizont.docx'
  ]) {
    await lk.get(u).expect(404);
  }
});

test('Ohne Materialordner: leere Übersicht, Downloads 404', async () => {
  const { lk } = await H.szenario({ materialienDir: null, arbeitsblaetterDir: PDF_DIR });
  const m = (await lk.get('/api/lehrer/materialien').expect(200)).body;
  assert.deepEqual(m, { allgemein: [], welten: [] });
  await lk.get('/lehrkraft/dateien/Loesungen_Portal/Welt_9_Testwelt/x.pdf').expect(404);
});

test('verzeichnis.json: nur Lehrkraft_PDF, Loesungen_Portal und Akten_PDF; alle Dateien vorhanden', () => {
  const v = JSON.parse(fs.readFileSync(path.join(MAT, 'Lehrkraft_PDF', 'verzeichnis.json'), 'utf8'));
  const pfade = [...v.allgemein, ...v.welten.flatMap((w) => w.eintraege)].flatMap((e) => e.dateien.map((d) => d.pfad));
  for (const p of pfade) {
    assert.match(p, /^(Lehrkraft_PDF|Loesungen_Portal|Akten_PDF)\/[A-Za-z0-9_./-]+\.pdf$/, p);
    assert.ok(fs.existsSync(path.join(MAT, p)), `fehlt: ${p} (npm run lehrkraft)`);
  }
});

test('Demo-Dateien (seed/demo_materialien.json): ohne Anmeldung abrufbar, alle anderen Lehrkraft-Dateien nicht', async () => {
  const { app, s } = await H.szenario(opts);
  const demo = JSON.parse(require('node:fs').readFileSync(require('node:path').join(SEED, 'demo_materialien.json'), 'utf8'));
  assert.ok(demo.lehrkraft.length >= 1 && demo.lehrkraft.length <= 4, 'nur einzelne Demo-Dateien');
  for (const rel of [...demo.lehrkraft, ...demo.schueler]) assert.ok(!/loesung|erwartungshorizont|klausur/i.test(rel), `keine Lösungen/Klausuren als Demo: ${rel}`);
  for (const rel of demo.lehrkraft) {
    const r = await request(app).get('/lehrkraft/dateien/' + rel.split('/').map(encodeURIComponent).join('/')).expect(200);
    assert.equal(r.headers['content-type'], 'application/pdf');
  }
  // andere Präsentationen/Lehrerhinweise: Gäste und Schüler 404
  for (const rel of ['Lehrkraft_PDF/Welt_9_Testwelt/KR_W9-Lehrerhinweise.pdf', 'Lehrkraft_PDF/Welt_9_Testwelt/KR_W9-Klausur_Testklausur.pdf']) {
    const u = '/lehrkraft/dateien/' + rel.split('/').map(encodeURIComponent).join('/');
    await request(app).get(u).expect(404);
    await s.get(u).expect(404);
  }
});

/* ---------- Echtes Material (M5 Task 96): materialien/Lehrkraft_PDF/verzeichnis.json ---------- */

const ECHT = path.join(__dirname, '..', 'materialien');
const echtesVerzeichnis = () => JSON.parse(fs.readFileSync(path.join(ECHT, 'Lehrkraft_PDF', 'verzeichnis.json'), 'utf8'));
const LOESUNGSARTIG = /_LSG|_EH|Klausur/;
const ARTEN = ['praesentation', 'lehrerhinweise', 'akte', 'boss', 'warmup', 'funkraum', 'klausur', 'probeklausur', 'werkzeug'];

test('echtes verzeichnis.json: Pfade vorhanden, Lösungen/EH/Klausuren nie unter Akten_PDF, Arten nach Plan', () => {
  const v = echtesVerzeichnis();
  const eintraege = [...v.allgemein, ...v.welten.flatMap((w) => w.eintraege)];
  for (const e of eintraege) assert.ok(ARTEN.includes(e.art), `Art ${e.art}`);
  const pfade = eintraege.flatMap((e) => e.dateien.map((d) => d.pfad));
  for (const p of pfade) {
    assert.match(p, /^(Lehrkraft_PDF|Loesungen_Portal|Akten_PDF)\/[A-Za-z0-9_./-]+\.pdf$/, p);
    assert.ok(fs.existsSync(path.join(ECHT, p)), `fehlt: ${p} (python3 werkzeuge/lehrkraft_pdf.py)`);
    if (LOESUNGSARTIG.test(p)) assert.ok(!p.startsWith('Akten_PDF/'), `Lösung im Schülerbereich: ${p}`);
  }
  // W0–W2 vollständig: jede Akte mit Lösung, Boss mit EH, Warm-up mit Lösungen, Präsentationen und Lehrerhinweise
  for (const nr of [0, 1, 2]) {
    const w = v.welten.find((x) => x.welt === nr);
    const arten = w.eintraege.map((e) => e.art);
    for (const a of ['praesentation', 'lehrerhinweise', 'akte', 'boss', 'warmup']) assert.ok(arten.includes(a), `Welt ${nr} ohne ${a}`);
    for (const e of w.eintraege.filter((x) => x.art === 'akte')) {
      assert.deepEqual(e.dateien.map((d) => d.label), ['Akte', 'Lösung'], e.titel);
    }
  }
  // Funkraum-Rollenkarten (Regie-Teile) nur für Lehrkräfte (E49 geändert): W0/W1 unter Lehrkraft_PDF, nie unter Akten_PDF
  for (const p of pfade) assert.ok(!(p.startsWith('Akten_PDF/') && /funkraum/i.test(p)), `Funkraum im Schülerbereich: ${p}`);
  for (const nr of [0, 1]) {
    const funk = v.welten.find((x) => x.welt === nr).eintraege.filter((e) => e.art === 'funkraum');
    assert.equal(funk.length, 1, `Welt ${nr}: Funkraum-Rollenkarten`);
    assert.match(funk[0].dateien[0].pfad, /^Lehrkraft_PDF\/Welt_\d_\w+\/KR_W\d_Funkraum_\w+\.pdf$/);
  }
  assert.equal(v.welten.find((x) => x.welt === 0).eintraege[0].titel, 'Kickoff-Präsentation (Start der Einheit)', 'Kickoff zuerst');
  const w6 = v.welten.find((x) => x.welt === 6);
  assert.equal(w6.eintraege.filter((e) => e.art === 'klausur').length, 4, 'Klausur und Nachschreibklausur je eA/gA');
  assert.equal(w6.eintraege.filter((e) => e.art === 'probeklausur').length, 2, 'Probeklausur eA/gA');
});

test('echtes Material: Lösungs-/Lehrkraft-PDFs nur mit Lehrkraft-Sitzung, ohne Sitzung und für Schüler 404', async () => {
  const { app, lk, s } = await H.szenario({ seedDir: SEED, materialienDir: ECHT, arbeitsblaetterDir: path.join(ECHT, 'Akten_PDF') });
  const m = (await lk.get('/api/lehrer/materialien').expect(200)).body;
  const dateien = alleDateien(m);
  assert.ok(dateien.length > 60, `${dateien.length} Dateien`);
  const geschuetzt = dateien.filter((d) => d.url && d.url.startsWith('/lehrkraft/dateien/') && /Loesungen_Portal|Lehrkraft_PDF/.test(d.url));
  assert.ok(geschuetzt.length > 40);
  for (const d of geschuetzt.filter((_, i) => i % 7 === 0)) {
    const r = await lk.get(d.url).expect(200);
    assert.equal(r.headers['content-type'], 'application/pdf');
    await request(app).get(d.url).expect(404);
    await s.get(d.url).expect(404);
  }
  for (const d of dateien.filter((x) => x.url && LOESUNGSARTIG.test(decodeURIComponent(x.url)))) {
    assert.ok(d.lehrkraft && d.url.startsWith('/lehrkraft/dateien/'), `${d.url} muss geschützt sein`);
  }
});

test('echtes Material: Schülerfassungen (Akten_PDF/…) zeigen auf /akten/…', async () => {
  const { lk } = await H.szenario({ seedDir: SEED, materialienDir: ECHT, arbeitsblaetterDir: path.join(ECHT, 'Akten_PDF') });
  const m = (await lk.get('/api/lehrer/materialien').expect(200)).body;
  const schueler = alleDateien(m).filter((d) => !d.lehrkraft);
  assert.ok(schueler.length >= 25);
  for (const d of schueler) assert.match(d.url, /^\/akten\//);
});
