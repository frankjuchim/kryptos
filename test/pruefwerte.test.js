// Prüfwerte der Materialien (Plan Task 18, Design §13.1, TECHNIK §15): werkzeuge/krypto/pruefwerte.py rechnet jede
// Rechnung aus quellen/pruefwerte/*.json mit dem Python-Zwilling nach. Die Fixtures entstehen je Test in einem
// temporären Ordner (--ordner). Ohne python3 übersprungen.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const SKRIPT = path.join(WURZEL, 'werkzeuge/krypto/pruefwerte.py');
const python = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const ohnePython = python.error || python.status !== 0 ? 'python3 fehlt – Prüfwerte übersprungen' : false;

function fixture(dateien) {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'pruefwerte-'));
  for (const [name, werte] of Object.entries(dateien)) {
    fs.writeFileSync(path.join(ordner, name), JSON.stringify({ beschreibung: 'Test', werte }));
  }
  return ordner;
}

function pruefe(ordner) {
  const args = ['-I', SKRIPT, ...(ordner ? ['--ordner', ordner] : [])];
  const r = spawnSync('python3', args, { cwd: WURZEL, encoding: 'utf8' });
  if (ordner) fs.rmSync(ordner, { recursive: true, force: true });
  return r;
}

const RICHTIG = { id: 'T-1', ort: 'Fixture Akte 1 Auftrag 1', art: 'akte', verfahren: 'caesar', eingabe: ['abc', 3], richtung: 'ver', erwartet: 'DEF' };

test('Prüfwerte: absichtlich falscher Eintrag → Exit-Code 1, Meldung nennt den Ort', { skip: ohnePython }, () => {
  const falsch = { ...RICHTIG, id: 'T-2', ort: 'Fixture Akte 7 Auftrag 9 (Lösung)', erwartet: 'XYZ' };
  const r = pruefe(fixture({ 'W0.json': [RICHTIG, falsch] }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /ABWEICHUNG T-2 \(Fixture Akte 7 Auftrag 9 \(Lösung\)\)/);
  assert.match(r.stdout, /'DEF'/); // Ergebnis des Zwillings steht in der Meldung
  assert.match(r.stdout, /2 Werte geprüft, 1 Abweichungen, 0 Überschneidungen/);
});

test('Prüfwerte: leere Fixture → Exit-Code 0', { skip: ohnePython }, () => {
  const r = pruefe(fixture({ 'W0.json': [] }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /0 Werte geprüft, 0 Abweichungen, 0 Überschneidungen/);
});

test('Prüfwerte: Optionen, Feld, Rundung, Darstellung als Bits', { skip: ohnePython }, () => {
  const r = pruefe(fixture({
    'W2.json': [
      { id: 'T-3', ort: 'Fixture', verfahren: 'friedmanWert', eingabe: [1001, 0.0475], runden: 2, erwartet: 3.99 },
      { id: 'T-4', ort: 'Fixture', verfahren: 'polybios', eingabe: ['sieg'], optionen: { schluessel: 'KORINTH' }, richtung: 'ver', erwartet: '44 14 32 34' },
      { id: 'T-5', ort: 'Fixture', verfahren: 'kryptosHash', eingabe: ['nebel'], feld: 'wert', erwartet: 9 },
      { id: 'T-6', ort: 'Fixture', verfahren: 'kryptos16.verschluesseln', eingabe: ['0b0100 1111 0100 1011', '0xA36D'], optionen: { runden: 2 }, als: 'bits16', erwartet: '1110 1111 0011 1101' },
      { id: 'T-7', ort: 'Fixture', verfahren: 'schluesselwortAlphabet', eingabe: ['OASE'], ausschnitt: [0, 8], erwartet: 'OASEBCDF' },
      { id: 'T-8', ort: 'Fixture', verfahren: 'rsa.schluessel', eingabe: [7, 11, 7], erwartet: { N: 77, d: 43 } },
    ],
  }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /6 Werte geprüft, 0 Abweichungen/);
});

test('Prüfwerte: gleiche Eingabe in Video und Prüfung → Überschneidung, Exit-Code 1', { skip: ohnePython }, () => {
  const video = { ...RICHTIG, id: 'V-1', ort: 'Fixture Video 9', art: 'video' };
  const klausur = { ...RICHTIG, id: 'K-1', ort: 'Fixture Klausur Aufgabe 1 a)', art: 'pruefung' };
  const r = pruefe(fixture({ 'videos.json': [video], 'pruefungen.json': [klausur] }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /ÜBERSCHNEIDUNG V-1 \(Fixture Video 9\) ↔ K-1 \(Fixture Klausur Aufgabe 1 a\)\)/);
  assert.match(r.stdout, /0 Abweichungen, 1 Überschneidungen/);
});

test('Prüfwerte: gemeldete Abweichung bzw. Überschneidung wird gesondert ausgewiesen (Exit-Code 0)', { skip: ohnePython }, () => {
  const gemeldet = { ...RICHTIG, id: 'T-9', erwartet: 'DEG', bekannt_abweichend: true, begruendung: 'möglicher Materialfehler, Lehrkraft prüft' };
  const video = { ...RICHTIG, id: 'V-2', ort: 'Fixture Video', art: 'video', ueberschneidung_bekannt: true, begruendung: 'gemeldet' };
  const boss = { ...RICHTIG, id: 'B-1', ort: 'Fixture Boss', art: 'boss' };
  const r = pruefe(fixture({ 'W0.json': [gemeldet, boss], 'videos.json': [video] }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /BEKANNT ABWEICHEND T-9/);
  assert.match(r.stdout, /BEKANNTE ÜBERSCHNEIDUNG V-2/);
  assert.match(r.stdout, /0 Abweichungen, 0 Überschneidungen; gesondert ausgewiesen: 1 bekannte Abweichungen, 1 bekannte Überschneidungen/);
});

test('Prüfwerte: Formatfehler (Ort fehlt, unbekanntes Verfahren) → Exit-Code 1', { skip: ohnePython }, () => {
  const ohneOrt = { ...RICHTIG, id: 'T-10' };
  delete ohneOrt.ort;
  const fremd = { ...RICHTIG, id: 'T-11', verfahren: 'enigma' };
  const r = pruefe(fixture({ 'W0.json': [ohneOrt, fremd] }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /T-10 ohne Feld „ort“/);
  assert.match(r.stdout, /Verfahren enigma gibt es in der Bibliothek nicht/);
});

test('Prüfwerte: die Materialien (quellen/pruefwerte) stimmen mit dem Zwilling überein', { skip: ohnePython }, () => {
  const r = pruefe(null);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\d+ Werte geprüft, 0 Abweichungen, 0 Überschneidungen/);
  for (const datei of ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'pruefungen', 'videos']) {
    assert.ok(fs.existsSync(path.join(WURZEL, 'quellen/pruefwerte', `${datei}.json`)), `${datei}.json fehlt`);
  }
});
