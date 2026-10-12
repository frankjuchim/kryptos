// Python-Zwilling der Krypto-Bibliothek (TECHNIK §5.3, Plan Task 17): werkzeuge/krypto/vergleich.js vergleicht
// shared/krypto.js mit werkzeuge/krypto/krypto.py über Zufallsfälle und Grenzfälle. Ohne python3 übersprungen.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const python = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const ohnePython = python.error || python.status !== 0 ? 'python3 fehlt – Zwilling-Vergleich übersprungen' : false;

test('Zwilling: JS und Python liefern dieselben Ergebnisse (300 Fälle je Funktion)', { skip: ohnePython }, () => {
  const r = spawnSync(process.execPath, [path.join(WURZEL, 'werkzeuge/krypto/vergleich.js'), '--anzahl', '300', '--seed', '20261012'], {
    cwd: WURZEL,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /0 Abweichungen/);
});

test('Zwilling: feste Vektoren in Python (test_krypto.py)', { skip: ohnePython }, () => {
  const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge/krypto/test_krypto.py')], { cwd: WURZEL, encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
});
