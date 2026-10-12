'use strict';
// Inhalts-Validator (Modul + CLI): Schema, ids, Verweise, Lücken ↔ felder, Lösung ↔ Interaktion, Bäume, Kategorien, Boss-Mix.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { validiereWelt, validiereDateien } = require('../src/content/validator');
const H = require('./helpers');

const basis = () => JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8'));
const aufgabe = (w, id) => w.aufgaben.find((a) => a.id === id);

function fehlerVon(w) {
  return validiereWelt(w, { datei: 'test.json' }).fehler.map((f) => `${f.ort}: ${f.meldung}`);
}

function erwarteFehler(aendern, muster) {
  const w = basis();
  aendern(w);
  const f = fehlerVon(w);
  assert.ok(f.some((x) => muster.test(x)), `erwartet ${muster} in:\n${f.join('\n')}`);
}

test('Fixture ist fehlerfrei; Statistik je Level', () => {
  const r = validiereWelt(basis(), { datei: 'welt_beispiel.json' });
  assert.deepEqual(r.fehler, []);
  assert.equal(r.stats.levels, 2);
  assert.equal(r.stats.aufgaben, 21);
  assert.equal(r.stats.bossPool, 6);
  assert.equal(Object.keys(r.stats.interaktionen).length, 11, 'alle Interaktionsarten');
  assert.equal(Object.keys(r.stats.bloecke).length, 10, 'alle Blocktypen');
});

test('Schema/Datei: version, welt, levels', () => {
  assert.match(fehlerVon({ version: 1, welt: 'x', titel: 'T', levels: [], aufgaben: [] }).join('\n'), /version muss 2/);
  assert.match(fehlerVon({ version: 2, welt: 1, titel: 'T' }).join('\n'), /levels muss eine Liste/);
  assert.match(fehlerVon([]).join('\n'), /JSON-Objekt/);
});

test('ids: Format, Welt-Nummer, doppelt', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').id = 'Aufgabe1'), /Format W<n>-L<k>-<nn>/);
  erwarteFehler((w) => w.aufgaben.push({ ...aufgabe(w, 'W9-L1-04') }), /kommt doppelt vor/);
  erwarteFehler((w) => (w.levels[0].id = 'W4-L1'), /passt nicht zu welt 9/);
});

test('Verweise: unbekannte Aufgabe im Level, Aufgabe mehrfach, Boss-Aufgabe im Level', () => {
  erwarteFehler((w) => w.levels[0].aufgaben.push('W9-L1-99'), /unbekannte Aufgabe „W9-L1-99“/);
  erwarteFehler((w) => w.levels[1].aufgaben.push('W9-L1-01'), /mehrfach verwendet/);
  erwarteFehler((w) => w.levels[0].aufgaben.push('W9-B-01'), /Boss-Aufgabe/);
});

test('Lücken ↔ felder', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').inhalt[0].md += ' [[neu]]'), /Lücke \[\[neu\]\] hat kein Feld/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').interaktion.felder.zz = { typ: 'text' }), /Feld „zz“ hat keine Lücke/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').inhalt[0].md += ' [[g1]]'), /kommt 2-mal vor/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').erklaerung[0].md += ' [[g1]]'), /Lücken \[\[…\]\] sind hier nicht erlaubt/);
});

test('Lösung passt zur Interaktion', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').loesung.g3 = ['7']), /eine der optionen/);
  erwarteFehler((w) => delete aufgabe(w, 'W9-L1-01').loesung.g2, /Lösung für Feld „g2“ fehlt/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-04').loesung.richtig = ['a', 'b']), /genau eine richtige Option/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-05').loesung.richtig = ['z']), /unbekannte Option/);
  erwarteFehler((w) => aufgabe(w, 'W9-L2-01').loesung.reihenfolgen[0].push('q'), /unbekannte id „q“/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-02').interaktion[0].block = 0), /code-Blocks/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-02').loesung[0].zeilen = [99]), /Zeile 99 liegt nicht im Code/);
  erwarteFehler((w) => aufgabe(w, 'W9-L2-02').loesung.pop(), /Liste gleicher Länge/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-06').loesung.e1 = 'x'), /unbekannten Kategorie/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-03').loesung.folge = ['', 'LLLL']), /Pfad „LLLL“ existiert im Baum nicht/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-05').loesung.tausche = [[0, 9]]), /gültiger Indizes/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-06').loesung.folge = [10]), /liegt nicht in der Reihung/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-07').loesung.zellen = [[5, 5]]), /liegt nicht im Raster/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-08').interaktion.art = 'liste'), /art muss/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').interaktion.kind = 'freitext'), /unbekannte kind/);
});

test('Klammerbäume müssen parsebar sein', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-06').inhalt[0].baum = '8(3,'), /kein gültiger Klammerbaum/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-04').loesung.baum = '5(3(1,4),8(-,9)'), /baum der Lösung ist kein gültiger Klammerbaum/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-04').interaktion.start = '5)'), /start ist kein gültiger Klammerbaum/);
});

test('Punkte/Stufen, Kategorien, Fallen, Blöcke', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').stufe = 4), /stufe muss 1, 2 oder 3/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').punkte = 0), /punkte muss/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').kategorie = 'Arrays'), /unbekannte kategorie „Arrays“/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-01').fallen = ['P11']), /unbekannte Falle „P11“/);
  erwarteFehler((w) => aufgabe(w, 'W9-L1-01').inhalt.push({ t: 'bild' }), /unbekannter Blocktyp/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-03').inhalt[1].rumpf[0] = { anw: 'x', gib: 'y' }), /genau einer von/);
  erwarteFehler((w) => (aufgabe(w, 'W9-L1-02').inhalt[0].markiere = [9]), /markiere: Zeile 9/);
  const w = basis();
  aufgabe(w, 'W9-L1-01').punkte = 15;
  assert.ok(validiereWelt(w).warnungen.some((x) => /weicht vom Standard/.test(x.meldung)), 'abweichende Punkte nur Hinweis');
});

test('Boss: Mix erfüllbar, Summe = anzahl, Pool-Verweise', () => {
  erwarteFehler((w) => (w.boss.mix = { 1: 2, 2: 2, 3: 3 }), /Boss-Mix nicht erfüllbar: 3 Aufgaben der Stufe 3/);
  erwarteFehler((w) => (w.boss.anzahl = 6), /Summe von mix \(5\) muss anzahl \(6\)/);
  erwarteFehler((w) => w.boss.pool.push('W9-B-77'), /pool verweist auf unbekannte Aufgabe/);
  erwarteFehler((w) => w.boss.pool.push('W9-L1-01'), /Boss-Aufgaben müssen eigene Aufgaben sein/);
});

test('Konsistenz: Lösung, die der Prüfer nicht als richtig erkennt, wird gemeldet', () => {
  erwarteFehler((w) => (aufgabe(w, 'W9-L2-02').interaktion[1].felder.g1.typ = 'zahl') && (aufgabe(w, 'W9-L2-02').loesung[1].g1 = ['']), /leer|nicht als richtig/);
});

test('Mehrere Dateien: doppelte Weltnummer und ids über Dateien hinweg', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aql-val-'));
  const a = path.join(dir, 'a.json');
  const b = path.join(dir, 'b.json');
  fs.writeFileSync(a, JSON.stringify(basis()));
  fs.writeFileSync(b, JSON.stringify(basis()));
  const r = validiereDateien([a, b]);
  const f = r[1].fehler.map((x) => x.meldung).join('\n');
  assert.match(f, /welt 9 ist auch in a\.json/);
  assert.match(f, /auch in a\.json vergeben/);
});

test('CLI: node scripts/validate.js <datei> – Exit-Code 0 bzw. 1 mit verständlichen Meldungen', () => {
  const skript = path.join(__dirname, '..', 'scripts', 'validate.js');
  const ok = execFileSync(process.execPath, [skript, H.FIXTURE], { encoding: 'utf8' });
  assert.match(ok, /Alles in Ordnung/);
  assert.match(ok, /W9-L2 Alle Interaktionen: 9 Aufgaben/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aql-cli-'));
  const kaputt = path.join(dir, 'welt9.json');
  const w = basis();
  aufgabe(w, 'W9-L1-01').kategorie = 'Arrays';
  fs.writeFileSync(kaputt, JSON.stringify(w));
  const r = spawnSync(process.execPath, [skript, kaputt], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /✖ welt9\.json/);
  assert.match(r.stdout, /W9-L1-01 › kategorie: unbekannte kategorie „Arrays“/);
  const syntax = path.join(dir, 'syntax.json');
  fs.writeFileSync(syntax, '{"version": 2,');
  const r2 = spawnSync(process.execPath, [skript, syntax], { encoding: 'utf8' });
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /Kein gültiges JSON/);
  const j = spawnSync(process.execPath, [skript, '--json', H.FIXTURE], { encoding: 'utf8' });
  assert.equal(JSON.parse(j.stdout)[0].fehler.length, 0);
});
