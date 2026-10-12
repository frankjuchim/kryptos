'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const H = require('./helpers');
const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'krypto', 'seed_pruefen.py');
const PRUEFWERTE = path.join(__dirname, 'fixtures', 'pruefwerte');
const py = spawnSync('python3', ['--version']);
test('seed_pruefen.py: Fixture ohne Abweichung, manipulierte Lösung mit Exit-Code 1', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
  let r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', PRUEFWERTE, H.FIXTURE], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 Abweichungen/);
  const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  w.aufgaben.find((a) => a.id === 'W9-L3-03').loesung.bits = '1101100001101111';
  w.aufgaben.find((a) => a.id === 'W9-L5-08').loesung.text = 'UVMGEOVFCCX';
  const d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kr-seed-')), 'w.json'); fs.writeFileSync(d, JSON.stringify(w));
  r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', PRUEFWERTE, d], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /W9-L3-03/);
  assert.match(r.stdout, /W9-L5-08/);
});

test('seed_pruefen.py: gaps mit pruefnachweis (Prüfwert) und Lücke im bits-Block (pruefe xor) – Review M3 W3', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
  const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
  w.aufgaben.find((a) => a.id === 'W9-L5-10').loesung.c = ['32'];
  w.aufgaben.find((a) => a.id === 'W9-L6-02').loesung.c1 = ['0110 1000'];
  const d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kr-seed-')), 'w.json'); fs.writeFileSync(d, JSON.stringify(w));
  const r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', PRUEFWERTE, d], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /W9-L5-10 › loesung\.c: erwartet 31 gefunden 32/);
  assert.match(r.stdout, /W9-L6-02 › .*c1.*erwartet 01101001 gefunden 01101000/);
  assert.match(r.stdout, /2 Abweichungen/);
  // ohne Prüfwert-Ordner fehlt der Eintrag W9.json#W9-L5-10 → Abweichung (kein stilles Durchwinken)
  const ohne = spawnSync('python3', ['-I', SKRIPT, H.FIXTURE], { encoding: 'utf8' });
  assert.equal(ohne.status, 1);
  assert.match(ohne.stdout, /W9-L5-10 › pruefnachweis: erwartet Eintrag quellen\/pruefwerte\/W9\.json#W9-L5-10/);
});
