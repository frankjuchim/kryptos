// Material-Pipeline (TECHNIK §14.3, M5 Tasks 94–96): Online-IDE-Prüfstand und Workspace-Dateien.
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

for (const skript of ['loesungen_pdf.py', 'lehrkraft_pdf.py']) {
  test(`Lehrkraft-PDFs vollständig und aktuell (${skript} --pruefen)`, { skip: python ? false : 'python3 fehlt' }, () => {
    const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge', skript), '--pruefen'], { cwd: WURZEL, encoding: 'utf8', timeout: 300000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
}
