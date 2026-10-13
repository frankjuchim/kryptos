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

test('seed_pruefen.py: Prüfwert-Gruppe (gapsFeld, gapsFelder) für mehrfeldrige gaps', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-gruppe-'));
  fs.mkdirSync(path.join(dir, 'pw'));
  const welt = { version: 2, welt: 7, titel: 'Gruppe', farbe: '#5B6B7C', levels: [], aufgaben: [
    { id: 'W7-L1-01', titel: 'Z-Falle', stufe: 2, kategorie: 'modulo', fallen: [], inhalt: [{ t: 'text', md: 'q: [[p1]] [[c1]], z: [[p2]] [[c2]]' }],
      interaktion: { kind: 'gaps', felder: { p1: { typ: 'zahl' }, c1: { typ: 'zahl' }, p2: { typ: 'zahl' }, c2: { typ: 'zahl' } } },
      loesung: { p1: ['17'], c1: ['26'], p2: ['26'], c2: ['9'] }, pruefnachweis: 'quellen/pruefwerte/W7.json#W7-L1-01' },
    { id: 'W7-L1-02', titel: 'Alphabet', stufe: 1, kategorie: 'substitution-mono', fallen: [], inhalt: [{ t: 'text', md: '[[a1]][[a2]][[a3]]' }],
      interaktion: { kind: 'gaps', felder: { a1: { typ: 'text', norm: 'krypto' }, a2: { typ: 'text', norm: 'krypto' }, a3: { typ: 'text', norm: 'krypto' } } },
      loesung: { a1: ['S'], a2: ['U'], a3: ['L'] }, pruefnachweis: 'quellen/pruefwerte/W7.json#W7-L1-02' } ] };
  const pw = { beschreibung: 'Test', werte: [
    { id: 'W7-L1-01-p1', aufgabe: 'W7-L1-01', gapsFeld: 'p1', ort: 't', art: 'lab', verfahren: 'wert', eingabe: ['q'], erwartet: 17 },
    { id: 'W7-L1-01-c1', aufgabe: 'W7-L1-01', gapsFeld: 'c1', ort: 't', art: 'lab', verfahren: 'verfahren.anwenden', eingabe: [{ typ: 'caesar', k: 9 }, 'q', 'ver'], optionen: { ausgabe: 'zahlen', basis: 1 }, erwartet: [26] },
    { id: 'W7-L1-01-c2', aufgabe: 'W7-L1-01', gapsFeld: 'c2', ort: 't', art: 'lab', verfahren: 'mod', eingabe: [34, 26], erwartet: 8 },
    { id: 'W7-L1-02-a', aufgabe: 'W7-L1-02', gapsFelder: ['a1', 'a2', 'a3'], ort: 't', art: 'lab', verfahren: 'schluesselwortAlphabet', eingabe: ['SULTAN'], ausschnitt: [0, 3], erwartet: 'SUL' } ] };
  fs.writeFileSync(path.join(dir, 'w.json'), JSON.stringify(welt));
  fs.writeFileSync(path.join(dir, 'pw', 'W7.json'), JSON.stringify(pw));
  const r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', path.join(dir, 'pw'), path.join(dir, 'w.json')], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);                      // c2: erwartet 8, Lösung 9 → genau eine Abweichung
  assert.match(r.stdout, /W7-L1-01 › loesung\.c2/);
  assert.doesNotMatch(r.stdout, /W7-L1-02|p1|c1/);                      // gapsFelder und Einzelfelder stimmen, p2 ohne Eintrag ist ok
  assert.match(r.stdout, /1 Abweichungen/);
});

test('seed_pruefen.py: gapsFelder mit falscher Länge ist eine Abweichung', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-gruppe-'));
  fs.mkdirSync(path.join(dir, 'pw'));
  const welt = { version: 2, welt: 7, titel: 'Gruppe', farbe: '#5B6B7C', levels: [], aufgaben: [
    { id: 'W7-L1-02', titel: 'Alphabet', stufe: 1, kategorie: 'substitution-mono', fallen: [], inhalt: [{ t: 'text', md: '[[a1]][[a2]]' }],
      interaktion: { kind: 'gaps', felder: { a1: { typ: 'text', norm: 'krypto' }, a2: { typ: 'text', norm: 'krypto' } } },
      loesung: { a1: ['S'], a2: ['U'] }, pruefnachweis: 'quellen/pruefwerte/W7.json#W7-L1-02' } ] };
  const pw = { beschreibung: 'Test', werte: [
    { id: 'W7-L1-02-a', aufgabe: 'W7-L1-02', gapsFelder: ['a1', 'a2'], ort: 't', art: 'lab', verfahren: 'schluesselwortAlphabet', eingabe: ['SULTAN'], ausschnitt: [0, 3], erwartet: 'SUL' } ] };
  fs.writeFileSync(path.join(dir, 'w.json'), JSON.stringify(welt));
  fs.writeFileSync(path.join(dir, 'pw', 'W7.json'), JSON.stringify(pw));
  const r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', path.join(dir, 'pw'), path.join(dir, 'w.json')], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /W7-L1-02 › .*Länge/);
});

test('seed_pruefen.py: chiffre mit ausgabe „paare“ (Polybios) wird wie Buchstaben nachgerechnet', { skip: py.status !== 0 && 'python3 fehlt' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-paare-'));
  const welt = { version: 2, welt: 7, titel: 'Paare', farbe: '#5B6B7C', levels: [], aufgaben: [
    { id: 'W7-L1-03', titel: 'Polybios', stufe: 1, kategorie: 'substitution-mono', fallen: [], inhalt: [{ t: 'text', md: '`rom`' }],
      interaktion: { kind: 'chiffre', richtung: 'ver', verfahren: { typ: 'polybios' }, ausgabe: 'paare', eingabe: 'rom' },
      loesung: { text: '423432' } } ] };
  fs.writeFileSync(path.join(dir, 'w.json'), JSON.stringify(welt));
  const r = spawnSync('python3', ['-I', SKRIPT, '--pruefwerte', PRUEFWERTE, path.join(dir, 'w.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 Abweichungen/);
});
