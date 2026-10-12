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
require('../src/krypto').registriere();

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
  // Zahlen aus der Fixture berechnen (spätere Tasks ergänzen Aufgaben ohne Testbruch)
  const W = basis();
  const F = require('../src/content/format');
  assert.equal(r.stats.levels, W.levels.length);
  assert.equal(r.stats.aufgaben, W.aufgaben.length);
  assert.equal(r.stats.bossPool, W.boss.pool.length);
  const arten = new Set(W.aufgaben.flatMap((a) => F.teile(a).map((t) => F.artVon(t.interaktion))));
  assert.deepEqual(Object.keys(r.stats.interaktionen).sort(), [...arten].sort(), 'alle Interaktionsarten');
  const typen = new Set();
  const sammle = (bl) => (Array.isArray(bl) ? bl : []).forEach((b) => b && typen.add(b.t));
  for (const l of W.levels) sammle(l.intro);
  for (const a of W.aufgaben) {
    sammle(a.inhalt);
    sammle(a.erklaerung);
    for (const t of F.teile(a)) sammle(t.interaktion && t.interaktion.inhalt);
  }
  assert.deepEqual(Object.keys(r.stats.bloecke).sort(), [...typen].sort(), 'alle Blocktypen');
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
  erwarteFehler((w) => (w.boss.mix = { 1: 1, 2: 1, 3: 3 }) && (w.boss.anzahl = 5), /Boss-Mix nicht erfüllbar: 3 Aufgaben der Stufe 3/);
  erwarteFehler((w) => (w.boss.anzahl = 6), /Summe von mix \(3\) muss anzahl \(6\)/);
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

const V = require('../src/content/validator');
const F = require('../src/content/format');
V.registriereValidierung({
  welt: (d, f) => { if (d.titel === 'Hooktest' && !d.testfeld) f('datei', 'testfeld', 'testfeld fehlt.'); },
  level: (l, o, f, w, { data }) => { if (data.titel === 'Hooktest' && !l.rolle) f('level', o, 'rolle fehlt.'); },
  aufgabe: (a, fa, wa, { data }) => { if (data.titel === 'Hooktest' && a.stufe === 3) wa('stufe', 'Stufe 3 im Hooktest.'); },
  boss: (b, f, w, { data }) => { if (data.titel === 'Hooktest') w('boss', 'boss', 'Boss-Hook lief.'); },
  dateien: (eintraege, ergebnisse) => { for (const r of ergebnisse) if (r.datei === 'hook.json') r.warnungen.push({ datei: r.datei, ebene: 'datei', ort: '', meldung: 'Dateien-Hook lief.', aufgabe: null }); }
});
const hookWelt = () => ({ ...basis(), titel: 'Hooktest' });

test('Validator-Hooks: welt, level, aufgabe, boss, dateien', () => {
  const r = validiereWelt(hookWelt(), { datei: 'hook.json' });
  const t = (x) => x.map((e) => e.meldung).join(' | ');
  assert.match(t(r.fehler), /testfeld fehlt/);
  assert.match(t(r.fehler), /rolle fehlt/);
  assert.match(t(r.warnungen), /Stufe 3 im Hooktest/);
  assert.match(t(r.warnungen), /Boss-Hook lief/);
  const fs2 = require('node:fs'); const os2 = require('node:os');
  const d = fs2.mkdtempSync(path.join(os2.tmpdir(), 'kr-hook-')); const p = path.join(d, 'hook.json');
  fs2.writeFileSync(p, JSON.stringify(hookWelt()));
  assert.match(t(V.validiereDateien([p])[0].warnungen), /Dateien-Hook lief/);
  assert.equal(validiereWelt(basis(), { datei: 'x.json' }).fehler.length, 0, 'andere Welten unberührt');
});

test('Archivfund-ids W<n>-A-<nn>: gültig, nicht in Level/Boss, kein Hinweis „nicht verwendet“', () => {
  // id W9-A-09: die Fixture bekommt in Task 25 ihren echten Archivfund W9-A-01 – dieser Test bleibt davon unberührt
  const w = basis();
  w.aufgaben.push({ ...aufgabe(w, 'W9-L1-04'), id: 'W9-A-09' });
  const r = validiereWelt(w, { datei: 't.json' });
  assert.deepEqual(r.fehler, []);
  assert.ok(!r.warnungen.some((x) => x.ort === 'W9-A-09' && /in keinem Level/.test(x.meldung)));
  erwarteFehler((x) => { x.aufgaben.push({ ...aufgabe(x, 'W9-L1-04'), id: 'W9-A-09' }); x.levels[0].aufgaben.push('W9-A-09'); }, /Archivfund-Aufgabe „W9-A-09“ darf in keinem Level/);
  erwarteFehler((x) => { x.aufgaben.push({ ...aufgabe(x, 'W9-L1-04'), id: 'W9-A-09' }); x.boss.pool.push('W9-A-09'); }, /Archivfund-Aufgabe „W9-A-09“ darf in keinem Level/);
});

test('Registrierte Blöcke/Interaktionen: Validierung, Lücken-Besitz über lueckenFelder, _-Lösungsschlüssel, NORMEN', () => {
  F.registriereBlock('vtestblock', { texte: (b) => [b.text], validiere: (b, fe) => { if (!b.text) fe('text fehlt.'); } });
  F.registriereInteraktion('vtestia', { bereinige: (ia, a) => a, istLeer: () => false, pruefe: (ia, lo, a) => ({ ok: a === 'x' }), muster: () => 'x', validiere: (ia, lo, a, ort, fa) => { if (!ia.pflicht) fa(ort, 'pflicht fehlt.'); }, lueckenFelder: (ia) => Object.keys(ia.felder || {}) });
  erwarteFehler((x) => { aufgabe(x, 'W9-L1-04').inhalt.push({ t: 'vtestblock' }); }, /text fehlt/);
  erwarteFehler((x) => { const a = aufgabe(x, 'W9-L1-04'); a.interaktion = { kind: 'vtestia' }; a.loesung = {}; }, /pflicht fehlt/);
  const w = basis(); const a = aufgabe(w, 'W9-L1-04');
  a.inhalt.push({ t: 'vtestblock', text: 'Feld [[z1]]' }); a.interaktion = { kind: 'vtestia', pflicht: true, felder: { z1: {} } }; a.loesung = {};
  assert.deepEqual(fehlerVon(w), [], 'Lücke z1 gehört der registrierten Interaktion');
  erwarteFehler((x) => { aufgabe(x, 'W9-L1-04').inhalt.push({ t: 'vtestblock', text: '[[zz]]' }); }, /Lücke \[\[zz\]\] hat kein Feld/);
  const g = basis(); aufgabe(g, 'W9-L1-01').loesung._fehlmuster = {};
  assert.ok(!validiereWelt(g, { datei: 't' }).warnungen.some((x) => /_fehlmuster/.test(x.meldung)));
  F.registriereNorm('vtestnorm', (s) => s);
  const n = basis(); aufgabe(n, 'W9-L1-01').interaktion.felder.g1.norm = 'vtestnorm';
  assert.deepEqual(fehlerVon(n), []);
  erwarteFehler((x) => { aufgabe(x, 'W9-L1-01').interaktion.felder.g1.norm = 'gibtsnicht'; }, /norm „gibtsnicht“ unbekannt/);
});

test('CLI: registriere() vor dem Validieren – norm „krypto“ ist bekannt', () => {
  const skript = path.join(__dirname, '..', 'scripts', 'validate.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-cli-norm-'));
  const datei = path.join(dir, 'welt9.json');
  const w = basis();
  aufgabe(w, 'W9-L1-01').interaktion.felder.g4.norm = 'krypto';
  fs.writeFileSync(datei, JSON.stringify(w));
  const r = spawnSync(process.execPath, [skript, datei], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Alles in Ordnung/);
});

test('chiffre-Validator: Neuberechnung, Parameter, Alternativen, frei', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-01').loesung.text = 'ZUVERLAESSIX'; }, /Neuberechnung ergibt ZUVERLAESSIG statt ZUVERLAESSIX/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-03').loesung.text = '9 11 19 5 15'; }, /Neuberechnung ergibt 9 11 19 5 14/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-03').interaktion.verfahren.a = 13; }, /„a“ muss teilerfremd zu 26 sein/);
  erwarteFehler((w) => { const a = aufgabe(w, 'W9-L5-05'); a.interaktion.richtung = 'ent'; a.interaktion.eingabe = 'ABC'; }, /Verfahren nicht anwendbar: Ein Playfair-Geheimtext hat eine gerade Anzahl/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFIKRHIS']; }, /alternative/i);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L5-08').pruefnachweis; }, /pruefnachweis fehlt/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-01').loesung.fehlmuster = [{ text: 'X', p: 'P3', code: 'richtung' }]; }, /fehlmuster nur bei fremden Chiffren/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-02').interaktion.ausgabe = 'hex'; }, /hex/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-06').interaktion.hilfszeilen = ['schluessel']; }, /hilfszeilen/);
  const w = basis(); aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFIKRHIT'];
  assert.match(validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | '), /bekannte Variante/);
});

test('_fehlmuster: Format und kein Treffer auf eine akzeptierte Lösung', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.wert[0].wert = '26'; }, /_fehlmuster gleicht einer akzeptierten Lösung/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.gibts = [{ wert: '1', p: 'P2', code: 'x' }]; }, /_fehlmuster.*gibts/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.wert[0].p = 'P11'; }, /P1–P10/);
});

test('zuordnung-Validator: Neuberechnung, Injektivität, Abdeckung, Vorgabe, P6-Hinweis', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').loesung.klartext = 'GEHEIMTREFFENIMKELLEX'; }, /Neuberechnung ergibt GEHEIMTREFFENIMKELLER/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').loesung.zuordnung.A = 'E'; }, /injektiv/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L3-02').loesung.zuordnung.T; }, /alle Geheimtextbuchstaben|deckt/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-01').interaktion.vorgabe = { M: 'x' }; }, /vorgabe/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-02').interaktion.geheimtext = 'SMAMB'; }, /20/);
  const w = basis(); aufgabe(w, 'W9-L3-02').kategorie = 'haeufigkeitsanalyse';
  assert.match(validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | '), /P6/);
});

test('schaubild-ergaenzen-Validator: Block, Lücken ↔ Felder, Inhaber/Arten angeboten', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').interaktion.block = 0; }, /schaubild-Block/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').loesung.s1 = [{ art: 'privat', inhaber: 'X' }]; }, /inhaber/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-05').interaktion.felder.s1.arten = ['oeffentlich']; }, /art/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L6-05').interaktion.felder.s2; delete aufgabe(w, 'W9-L6-05').loesung.s2; }, /\[\[s2\]\]/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-06').loesung.z1 = ['Schlüssel']; }, /optionen/);
});
