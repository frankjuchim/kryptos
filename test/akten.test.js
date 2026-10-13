// seed/akten.json – Verzeichnis der Schülermaterialien (TECHNIK §14.2, Plan M5 Task 95, E49) und Akten-PDFs.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const MAT = path.join(WURZEL, 'materialien');
const AKTEN = JSON.parse(fs.readFileSync(path.join(WURZEL, 'seed', 'akten.json'), 'utf8'));
const VERBOTEN = /_LSG|_EH|Klausur|Loesung|Erwartungshorizont/i;

function seed(welt) {
  const p = path.join(WURZEL, 'seed', 'welten', `welt${welt}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function alleEintraege() {
  const erg = AKTEN.werkzeugkarten.map((w) => ({ ...w, ziel: w.datei }));
  for (const w of AKTEN.welten) {
    for (const a of w.akten) erg.push({ ...a, ziel: `${w.ordner}/${a.datei}` });
    for (const x of w.weitere || []) erg.push({ ...x, ziel: `${w.ordner}/${x.datei}` });
  }
  return erg;
}

test('akten.json: jede Quelle existiert, jede Datei ist .pdf, keine Lösungen/Erwartungshorizonte/Klausuren', () => {
  const ziele = new Set();
  for (const e of alleEintraege()) {
    assert.ok(fs.existsSync(path.join(MAT, e.quelle)), `Quelle fehlt: ${e.quelle}`);
    assert.match(e.datei, /^[\w./-]+\.pdf$/, `Dateiname ohne Umlaute/Leerzeichen, .pdf: ${e.datei}`);
    assert.ok(!VERBOTEN.test(e.quelle) && !VERBOTEN.test(e.datei), `keine Lösung: ${e.quelle}`);
    assert.ok(!ziele.has(e.ziel), `doppelt: ${e.ziel}`);
    ziele.add(e.ziel);
    assert.equal(path.basename(e.datei, '.pdf'), path.basename(e.quelle, path.extname(e.quelle)), 'PDF gleichnamig zur Quelle');
  }
  assert.equal(AKTEN.werkzeugkarten.length, 7);
  assert.deepEqual(AKTEN.werkzeugkarten.map((w) => w.nr), [1, 2, 3, 4, 5, 6, 7]);
  for (const w of AKTEN.welten) {
    for (const x of w.weitere || []) assert.ok(['boss', 'probeklausur', 'warmup', 'funkraum'].includes(x.art), x.art);
  }
});

test('akten.json ↔ Seeds W0–W2: jede Akte verweist auf vorhandene Level, jedes Level hat genau eine Akte', () => {
  for (const welt of [0, 1, 2]) {
    const s = seed(welt);
    assert.ok(s, `seed/welten/welt${welt}.json fehlt`);
    const w = AKTEN.welten.find((x) => x.welt === welt);
    assert.ok(w, `Welt ${welt} fehlt in akten.json`);
    const levelIds = new Set(s.levels.map((l) => l.id));
    for (const a of w.akten) for (const id of a.level) assert.ok(levelIds.has(id), `Akte W${welt}·${a.nr}: Level ${id} fehlt`);
    for (const l of s.levels) {
      const treffer = w.akten.filter((a) => a.level.includes(l.id));
      assert.equal(treffer.length, 1, `Level ${l.id}: ${treffer.length} Akten`);
      const a = treffer[0];
      assert.ok(l.akte.startsWith(`Akte W${welt}·${a.nr} – ${a.titel}`), `${l.id}: „${l.akte}“ ↔ Akte W${welt}·${a.nr} – ${a.titel}`);
      assert.equal(a.niveau, l.niveau, `${l.id}: Niveau`);
      assert.deepEqual(a.ds, l.ds || [], `${l.id}: DS`);
    }
  }
});

test('Kür-Akte K1 und eA-Akte W2·3 (Plan Task 95)', () => {
  const w2 = AKTEN.welten.find((x) => x.welt === 2);
  const k1 = w2.akten.find((a) => a.nr === 'K1');
  assert.equal(k1.niveau, 'kuer');
  assert.deepEqual(k1.level, ['W2-L5']);
  assert.equal(w2.akten.find((a) => a.nr === '3').niveau, 'eA');
});

const python = spawnSync('python3', ['-c', 'import pypdf'], { encoding: 'utf8' });
const ohnePypdf = python.error || python.status !== 0 ? 'python3/pypdf fehlen – akten_pdf.py --pruefen übersprungen' : false;

test('Akten-PDFs vollständig, ohne überzählige Dateien und ohne Lösungsstempel (akten_pdf.py --pruefen)', { skip: ohnePypdf }, () => {
  const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge/akten_pdf.py'), '--pruefen'], { cwd: WURZEL, encoding: 'utf8', timeout: 300000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('Validator: keine Hinweise „akte ↔ akten.json“ für die echten Seeds', () => {
  require('../src/krypto').registriere();
  const { validiereDateien } = require('../src/content/validator');
  const dateien = [0, 1, 2].map((w) => path.join(WURZEL, 'seed', 'welten', `welt${w}.json`));
  const hinweise = validiereDateien(dateien).flatMap((e) => e.warnungen).filter((w) => /akten\.json/.test(w.meldung));
  assert.deepEqual(hinweise, []);
});

test('Validator: Hinweis bei Level-akte ohne passenden Eintrag in akten.json und umgekehrt (TECHNIK §14.2)', () => {
  const os = require('node:os');
  require('../src/krypto').registriere();
  const { validiereDateien } = require('../src/content/validator');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'akten-'));
  try {
    fs.mkdirSync(path.join(tmp, 'welten'));
    const s = seed(0);
    s.levels[1].akte = 'Akte W0·2 – Falscher Titel';
    fs.writeFileSync(path.join(tmp, 'welten', 'welt0.json'), JSON.stringify(s));
    const akten = JSON.parse(JSON.stringify(AKTEN));
    akten.welten[0].akten[0].level = ['W0-L9'];
    fs.writeFileSync(path.join(tmp, 'akten.json'), JSON.stringify(akten));
    const meldungen = validiereDateien([path.join(tmp, 'welten', 'welt0.json')]).flatMap((e) => e.warnungen)
      .map((w) => w.meldung).filter((m) => /akten\.json/.test(m));
    assert.ok(meldungen.some((m) => m.includes('W0-L2')), meldungen.join('\n'));
    assert.ok(meldungen.some((m) => m.includes('W0-L9')), meldungen.join('\n'));
    assert.ok(meldungen.some((m) => m.includes('W0-L1')), meldungen.join('\n'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
