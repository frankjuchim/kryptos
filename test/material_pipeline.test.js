// Material-Pipeline (TECHNIK §14.3, §16.1, M5 Tasks 94–96, 102): Online-IDE-Prüfstand, Workspace-Dateien und die
// `--pruefen`-Aufrufe der PDF-Skripte (akten, loesungen, lehrkraft).
// Ohne javac/python3 übersprungen (die CI prüft im Job `inhalte` mit Java 21).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const vorhanden = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return !r.error && r.status === 0;
};
const python = vorhanden('python3', ['--version']);
const ohneJava = !python || !vorhanden('javac', ['-version']) ? 'python3/javac fehlen – Online-IDE-Prüfstand übersprungen' : false;

const GERUEST = 'materialien/Welt0_Antike/3_Online-IDE/KR_W0_CaesarWerkstatt_Geruest.txt';
const LSG = 'materialien/Welt0_Antike/5_Loesungen/KR_W0_CaesarWerkstatt_LSG.txt';

function idePruefen(...dateien) {
  const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge/ide-pruefung/ide_pruefen.py'), ...dateien, '--json'], {
    cwd: WURZEL, encoding: 'utf8', timeout: 300000, maxBuffer: 1 << 26,
  });
  let bericht = null;
  try { bericht = JSON.parse(r.stdout); } catch { /* unten gemeldet */ }
  assert.ok(Array.isArray(bericht), `keine JSON-Ausgabe:\n${r.stdout}\n${r.stderr}`);
  return { status: r.status, bericht };
}

test('Online-IDE Caesar-Werkstatt: Gerüst kompiliert, 1/23 Tests zufällig grün, Testklassen wie in der LSG', { skip: ohneJava }, () => {
  const { bericht } = idePruefen(GERUEST);
  const [g] = bericht;
  assert.equal(g.kompiliert, true, JSON.stringify(g.fehler));
  assert.equal(g.hauptprogramm, 'ok');
  assert.equal(g.gesamt, 23);
  assert.equal(g.gruen, 1);
  assert.deepEqual(g.testklassen, ['CaesarBasisTest', 'CaesarErweiterungTest', 'CaesarExperteTest']);
  assert.equal(g.lsg, LSG);
  assert.deepEqual(g.probleme, [], 'Gerüst ↔ LSG: identische Testklassen');
});

test('Online-IDE Caesar-Werkstatt: LSG 23/23 grün, Hauptprogramm wie SPEC W0 §2a/§12', { skip: ohneJava }, () => {
  const { status, bericht } = idePruefen(LSG);
  const [l] = bericht;
  assert.equal(status, 0, JSON.stringify(l.probleme));
  assert.equal(l.kompiliert, true);
  assert.equal(l.gruen, 23);
  assert.equal(l.gesamt, 23);
  const aus = l.ausgabe;
  assert.equal(aus[0], 'Klartext:      Die Legion zieht nach Norden');
  assert.equal(aus[1], 'Geheimtext:    KPLSL NPVUG PLOAU HJOUV YKLU');
  assert.equal(aus[2], 'Zurueck:       dielegionziehtnachnorden');
  assert.equal(aus[3], 'Geraten (e):   k = 7');
  assert.equal(aus[4], '0: zudbzdrzq');
  assert.equal(aus[5], '1: ytcaycqyp');
  assert.equal(aus[29], '25: avecaesar');
  assert.equal(aus.length, 30);
});

test('Online-IDE: nur erlaubte Zeichenketten-Operationen, println ohne System.out (CLAUDE.md)', () => {
  const fs = require('node:fs');
  for (const datei of [GERUEST, LSG]) {
    const text = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '""');
    for (const verboten of ['System.out', 'toUpperCase', 'toLowerCase', 'indexOf', '.split', '.trim', '.replace', 'Character.']) {
      assert.ok(!code.includes(verboten), `${datei}: ${verboten}`);
    }
    for (const m of code.matchAll(/\.(\w+)\(/g)) {
      assert.ok(['length', 'charAt', 'substring', 'equals', 'contains', 'compareTo', 'verschluesseln', 'entschluesseln',
        'buchstabeZuZahl', 'zahlZuBuchstabe', 'alphabetNummer', 'verschiebe', 'grossbuchstabe', 'fuenfergruppen',
        'bruteForce', 'findeSchluessel', 'rateSchluessel'].includes(m[1]), `${datei}: .${m[1]}(`);
    }
    assert.ok(!/[äöüÄÖÜß]/.test(text.replace(/"(?:[^"\\]|\\.)*"/g, '')), `${datei}: Umlaute in Kommentaren als ae/oe/ue/ss`);
  }
});

test('Workspace-Dateien für online-ide.de sind aktuell (workspaces_erzeugen.py --pruefen)', { skip: python ? false : 'python3 fehlt' }, () => {
  const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge/workspaces_erzeugen.py'), '--pruefen'], { cwd: WURZEL, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const fs = require('node:fs');
  const schueler = JSON.parse(fs.readFileSync(path.join(WURZEL, 'materialien/Online-IDE/KR_Welt0_Antike_Workspaces.json'), 'utf8'));
  const lehrkraft = JSON.parse(fs.readFileSync(path.join(WURZEL, 'materialien/Online-IDE/Lehrkraft/KR_Welt0_Antike_LSG_Workspaces.json'), 'utf8'));
  assert.equal(schueler.length, 1);
  assert.equal(schueler[0].modules[0].text, fs.readFileSync(path.join(WURZEL, GERUEST), 'utf8'));
  assert.deepEqual(schueler[0].settings, { language: 'Java', libraries: [] });
  assert.equal(lehrkraft[0].modules[0].text, fs.readFileSync(path.join(WURZEL, LSG), 'utf8'));
  assert.ok(!JSON.stringify(schueler).includes('MUSTERLOESUNG'), 'keine Musterlösung im Schüler-Workspace');
});

// akten_pdf.py --pruefen liest die PDFs mit pypdf (Lösungsstempel) – ohne pypdf übersprungen (CI-Job `inhalte` installiert es)
const ohnePypdf = !python ? 'python3 fehlt' : !vorhanden('python3', ['-I', '-c', 'import pypdf']) ? 'pypdf fehlt – Akten-Prüfung übersprungen' : false;
const PDF_SKRIPTE = [
  ['akten_pdf.py', 'Akten-PDFs (Schülerfassungen) vollständig, ohne Lösungen und Funkraum-Regieteile', ohnePypdf],
  ['loesungen_pdf.py', 'Lösungs-PDFs vollständig und aktuell', python ? false : 'python3 fehlt'],
  ['lehrkraft_pdf.py', 'Lehrkraft-PDFs vollständig und aktuell', python ? false : 'python3 fehlt']
];
for (const [skript, titel, skip] of PDF_SKRIPTE) {
  test(`${titel} (${skript} --pruefen)`, { skip }, () => {
    const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge', skript), '--pruefen'], { cwd: WURZEL, encoding: 'utf8', timeout: 300000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
}

// Plan M8 Task 195: Materialquellen nutzen repo-relative Pfade (keine absoluten Pfade einer anderen Maschine)
test('Materialquellen enthalten keine absoluten /home/-Pfade (JSON und Python)', () => {
  const fs = require('node:fs');
  const funde = [];
  const lauf = (ordner) => {
    for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
      const p = path.join(ordner, e.name);
      if (e.isDirectory()) lauf(p);
      else if (/\.(json|py)$/.test(e.name) && fs.readFileSync(p, 'utf8').includes('/home/')) funde.push(path.relative(WURZEL, p));
    }
  };
  lauf(path.join(WURZEL, 'quellen', 'material'));
  assert.deepEqual(funde, []);
});

// Plan M9 Task 211: Begriffsprüfung nach Design §6.3 (werkzeuge/materialien_pruefen.py)
test('materialien_pruefen.py: Altbegriffe gefunden, Ausnahmen wirken, echtes Repo ohne Funde', { skip: python ? false : 'python3 fehlt' }, () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const SKRIPT = path.join(WURZEL, 'werkzeuge', 'materialien_pruefen.py');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-begriffe-'));
  try {
    const datei = path.join(tmp, 'probe.json');
    fs.writeFileSync(datei, JSON.stringify({ bloecke: [{ md: 'Das Chiffrat nach Friedmann' }], id: 'vigenere_1', datei: 'KR_Vigenere.pdf' }));
    const r = spawnSync('python3', ['-I', SKRIPT, '--json', datei], { cwd: WURZEL, encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    const funde = JSON.parse(r.stdout);
    assert.deepEqual(funde.map((f) => [f.begriff, f.richtig]).sort(), [['Chiffrat', 'Geheimtext'], ['Friedmann', 'Friedman']]);
    assert.ok(funde.every((f) => f.pfad === 'bloecke[0].md'), JSON.stringify(funde));
    const ausnahmen = path.join(tmp, 'ausnahmen.json');
    fs.writeFileSync(ausnahmen, JSON.stringify([{ datei: 'probe.json', begriff: 'Chiffrat', grund: 'Test' }, { datei: 'probe.json', begriff: 'Friedmann', grund: 'Test' }]));
    const r2 = spawnSync('python3', ['-I', SKRIPT, '--ausnahmen', ausnahmen, datei], { cwd: WURZEL, encoding: 'utf8' });
    assert.equal(r2.status, 0, r2.stdout + r2.stderr);
    // Kerckhoff ohne s, Vigenere ohne Akzent, XP, Gilde, Algo Quest; richtige Schreibweisen bleiben unbeanstandet
    fs.writeFileSync(datei, JSON.stringify({ t: 'Kerckhoff sagt; Vigenere; 10 XP; die Gilde; Algo Quest; Kerckhoffs, Vigenère, Friedman, Merkle, Geheimtext' }));
    const r3 = spawnSync('python3', ['-I', SKRIPT, '--json', datei], { cwd: WURZEL, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(r3.stdout).map((f) => f.begriff).sort(), ['Algo Quest', 'Gilde', 'Kerckhoff', 'Vigenere', 'XP']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  const echt = spawnSync('python3', ['-I', SKRIPT], { cwd: WURZEL, encoding: 'utf8', timeout: 120000 });
  assert.equal(echt.status, 0, echt.stdout + echt.stderr);
  assert.match(echt.stdout, /0 Funde/);
  // jede Ausnahme hat einen Grund
  const liste = JSON.parse(fs.readFileSync(path.join(WURZEL, 'werkzeuge', 'material', 'begriffe_ausnahmen.json'), 'utf8'));
  for (const a of liste.ausnahmen || liste) assert.ok(a.grund && a.grund.length >= 10 && a.datei && a.begriff, JSON.stringify(a));
});

// Plan M9 Task 213: Erklärvideos mit echten Bildern statt Platzhaltern
const VIDEOS = (() => {
  const fs = require('node:fs');
  const basis = path.join(WURZEL, 'materialien', 'Videos');
  return fs.readdirSync(basis).filter((d) => /^\d\d_/.test(d) && fs.statSync(path.join(basis, d)).isDirectory()).sort().map((d) => ({ ordner: d, pfad: path.join(basis, d), v: JSON.parse(fs.readFileSync(path.join(basis, d, 'video.json'), 'utf8')) }));
})();
/** alle Bildangaben einer video.json: Einträge in `bilder` und Inline-`bild`-Objekte der Folien */
function bildAngaben(v) {
  const aus = Object.entries(v.bilder || {}).map(([name, b]) => ({ ort: `bilder.${name}`, b }));
  for (const [i, f] of (v.folien || []).entries()) if (f.bild && typeof f.bild === 'object') aus.push({ ort: `folien[${i}].bild`, b: f.bild });
  return aus;
}

test('Erklärvideos: keine Bildplatzhalter mehr (weder in bilder noch inline)', () => {
  const offen = [];
  for (const { ordner, v } of VIDEOS) for (const { ort, b } of bildAngaben(v)) if (b.t === 'platzhalter' || (!b.t && !b.typ)) offen.push(`${ordner} ${ort}`);
  assert.deepEqual(offen, []);
});

test('Erklärvideos: jede Bilddatei existiert, ist PNG, ≤ 1,5 MB und mindestens 1200 px breit', () => {
  const fs = require('node:fs');
  let n = 0;
  for (const { ordner, pfad, v } of VIDEOS) {
    for (const { ort, b } of bildAngaben(v)) {
      if (b.t !== 'bild') continue;
      n++;
      const datei = path.join(pfad, b.pfad);
      assert.ok(fs.existsSync(datei), `${ordner} ${ort}: ${b.pfad} fehlt`);
      const kopf = fs.readFileSync(datei);
      assert.equal(kopf.subarray(1, 4).toString('latin1'), 'PNG', `${ordner} ${ort}: kein PNG`);
      assert.ok(kopf.length <= 1.5 * 1024 * 1024, `${ordner} ${ort}: ${(kopf.length / 1048576).toFixed(2)} MB`);
      assert.ok(kopf.readUInt32BE(16) >= 1200, `${ordner} ${ort}: Breite ${kopf.readUInt32BE(16)} px`);
    }
  }
  assert.ok(n >= 11, `Bilder: ${n}`);
});

test('video_folien.bildblock: {"t":"bild","pfad":"bilder/a.png"} → Pfad relativ zum Repo', { skip: python ? false : 'python3 fehlt' }, () => {
  const code = 'import sys, json; sys.path.insert(0, "werkzeuge/material"); import video_folien as V; print(json.dumps(V.bildblock({"t": "bild", "pfad": "bilder/a.png"}, {"nr": 1, "kurz": "Caesar_und_Modulo"})))';
  const r = spawnSync('python3', ['-c', code], { cwd: WURZEL, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()), { t: 'bild', pfad: 'materialien/Videos/01_Caesar_und_Modulo/bilder/a.png' });
});
