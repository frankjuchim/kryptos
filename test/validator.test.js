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
  assert.match(ok, /W9-L2 Alle Interaktionen: 10 Aufgaben/);
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
  level: (l, o, f, w, { data }) => { if (data.titel === 'Hooktest' && !l.hookfeld) f('level', o, 'hookfeld fehlt.'); },
  aufgabe: (a, fa, wa, { data }) => { if (data.titel === 'Hooktest' && a.stufe === 3) wa('stufe', 'Stufe 3 im Hooktest.'); },
  boss: (b, f, w, { data }) => { if (data.titel === 'Hooktest') w('boss', 'boss', 'Boss-Hook lief.'); },
  dateien: (eintraege, ergebnisse) => { for (const r of ergebnisse) if (r.datei === 'hook.json') r.warnungen.push({ datei: r.datei, ebene: 'datei', ort: '', meldung: 'Dateien-Hook lief.', aufgabe: null }); }
});
const hookWelt = () => ({ ...basis(), titel: 'Hooktest' });

test('Validator-Hooks: welt, level, aufgabe, boss, dateien', () => {
  const r = validiereWelt(hookWelt(), { datei: 'hook.json' });
  const t = (x) => x.map((e) => e.meldung).join(' | ');
  assert.match(t(r.fehler), /testfeld fehlt/);
  assert.match(t(r.fehler), /hookfeld fehlt/);
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
  // Review M3 K5: nicht erklärbare Alternative ist ein Fehler (vorher Hinweis)
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFIKRHIT']; }, /alternative „NHQZSFIKRHIT“ ist durch keine bekannte Variante erklärbar/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-05').loesung.alternativen = ['NHQZSFJKRHJT']; }, /keine bekannte Variante/);
});

test('chiffre-Validator: mehrere Füllzeichen X am Ende als Alternative (Plan M5 E45, W0-L1-04 „+ xxx“)', () => {
  const mitX = (alternativen) => {
    const w = basis();
    const a = aufgabe(w, 'W9-L5-01');
    a.interaktion.eingabe = 'CXYHU ODHVV LJAAA'; // k = 3: A → x
    a.loesung = { text: 'zuverlaessigxxx', alternativen };
    return fehlerVon(w);
  };
  assert.deepEqual(mitX(['zuverlaessig', 'zuverlaessigx']), []);
  assert.ok(mitX(['zuverlaessigxy']).some((x) => /keine bekannte Variante/.test(x)));
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

test('bits-rechnen-Validator: Neuberechnung je Operation', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-01').loesung.bits = '00100011'; }, /Neuberechnung ergibt 00100001/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-03').loesung.bits = '01001010'; }, /Neuberechnung ergibt 01001011/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-04').loesung.text = 'B'; }, /Neuberechnung ergibt A/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-03').loesung.bits = '1101100001101111'; }, /Neuberechnung ergibt 1101100001101110/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-04').loesung.positionen = [3, 5, 7]; }, /Neuberechnung ergibt \[3, 5, 7, 13\]|3,5,7,13/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-01').interaktion.operanden = ['0100 1011', '0110 101']; }, /gleich lang/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-03').interaktion.runden = 5; }, /runden/);
});

test('bits-rechnen-Validator: KRYPTOS-16-Schritte (schritt, text) und Operanden bis 64 Bit (Plan M8 E124, E125)', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-05').loesung.bits = '0111000101000111'; }, /Neuberechnung ergibt 0110111101110110/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-06').loesung.bits = '1101011000100011'; }, /Neuberechnung ergibt 1011010000111001/);
  erwarteFehler((w) => { Object.assign(aufgabe(w, 'W9-L3-05').interaktion, { schritt: 'nach-xor', richtung: 'ent' }); }, /Kettenzustände nur mit richtung ver/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-05').interaktion.schritt = 'nach-runde'; }, /schritt muss/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-05').interaktion.block = '0100 1110 0100 1111'; }, /genau eins von block und text/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L3-06').interaktion.block; }, /genau eins von block und text/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-05').interaktion.text = 'NOT'; }, /text muss genau 2 Buchstaben/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-05').interaktion.text = 'no'; }, /text muss genau 2 Buchstaben/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L3-05').interaktion.schluessel; }, /schluessel fehlt/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L3-06').interaktion.richtung = 'ver'; }, /richtung gibt es bei Einzelschritten nicht/);
  erwarteFehler((w) => { Object.assign(aufgabe(w, 'W9-L3-06').interaktion, { schritt: 'rundenschluessel', schluessel: '0011 1010 1100 0101', runden: 3 }); aufgabe(w, 'W9-L3-06').loesung.bits = '1100010100111010'; }, /rundenschluessel braucht nur schluessel und runden/);
  // Rundenschlüssel ohne block/text: fehlerfrei
  const w = basis();
  aufgabe(w, 'W9-L3-06').interaktion = { kind: 'bits-rechnen', operation: 'kryptos16', schluessel: '0011 1010 1100 0101', runden: 3, schritt: 'rundenschluessel' };
  aufgabe(w, 'W9-L3-06').loesung.bits = '1100010100111010';
  assert.deepEqual(fehlerVon(w), []);
  // Operanden 8–64 Bit: 48 Bit ok, 72 Bit Fehler
  const w48 = basis();
  aufgabe(w48, 'W9-L6-01').interaktion.operanden = ['0011 1111 1110 0011 0100 1001 1010 0000 1101 0011 0110 0011', '0010 0010 1111 1001 0101 1110 1010 0000 1101 0011 0110 0011'];
  aufgabe(w48, 'W9-L6-01').loesung.bits = '000111010001101000010111000000000000000000000000';
  assert.deepEqual(fehlerVon(w48), []);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-01').interaktion.operanden = ['0'.repeat(72), '1'.repeat(72)]; }, /8–64 Bit/);
});

test('Level-Feld werkstatt (Plan M8 E140): Objekt mit titel ≤ 60, nicht im Gastmodus', () => {
  const lv = (w, id) => w.levels.find((l) => l.id === id);
  erwarteFehler((w) => { lv(w, 'W9-L3').werkstatt = true; }, /werkstatt muss ein Objekt mit titel/);
  erwarteFehler((w) => { lv(w, 'W9-L3').werkstatt = { titel: '' }; }, /werkstatt muss ein Objekt mit titel/);
  erwarteFehler((w) => { lv(w, 'W9-L3').werkstatt = { titel: 'x'.repeat(61) }; }, /werkstatt muss ein Objekt mit titel/);
  erwarteFehler((w) => { lv(w, 'W9-L3').werkstatt = { titel: 'Zur Werkstatt', link: '/x' }; }, /werkstatt erlaubt nur titel/);
  const g = basis();
  g.welt = 8;
  const fe = validiereWelt(g, { datei: 'demo.json' }).fehler.map((f) => `${f.ort}: ${f.meldung}`);
  assert.ok(fe.some((x) => /werkstatt gibt es im Gastmodus nicht/.test(x)), fe.join('\n'));
});

test('gaps-Feld toleranz (K43, Plan M8 E139): Zahl ≥ 0, nur bei typ zahl', () => {
  const mitFeld = (feld) => (w) => {
    const a = w.aufgaben.find((x) => x.interaktion && x.interaktion.kind === 'gaps' && Object.values(x.interaktion.felder).some((f) => f.typ === 'zahl'));
    const fid = Object.keys(a.interaktion.felder).find((k) => a.interaktion.felder[k].typ === 'zahl');
    Object.assign(a.interaktion.felder[fid], feld);
  };
  erwarteFehler(mitFeld({ toleranz: -1 }), /toleranz muss eine Zahl ≥ 0 sein/);
  erwarteFehler(mitFeld({ toleranz: '0,5' }), /toleranz muss eine Zahl ≥ 0 sein/);
  erwarteFehler((w) => {
    const a = w.aufgaben.find((x) => x.interaktion && x.interaktion.kind === 'gaps' && Object.values(x.interaktion.felder).some((f) => (f.typ || 'text') === 'text'));
    const fid = Object.keys(a.interaktion.felder).find((k) => (a.interaktion.felder[k].typ || 'text') === 'text');
    a.interaktion.felder[fid].toleranz = 1;
  }, /toleranz nur bei typ zahl/);
  const w = basis();
  mitFeld({ toleranz: 0.5 })(w);
  assert.deepEqual(fehlerVon(w), []);
});

test('hash-ziel-Validator: Ziel, ungleich/praefix, Musterantwort nachgerechnet (Plan M8 E126)', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-07').loesung.beispiel = 'tee'; }, /Neuberechnung ergibt KH\(tee\) = 26 statt 4/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-07').loesung.beispiel = 'eis'; }, /beispiel darf nicht in ungleich stehen/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-07').interaktion.ziel = 29; }, /ziel muss eine ganze Zahl 0–28/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-07').interaktion.verfahren = 'sha256'; }, /verfahren muss kryptosHash/);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-07').interaktion.ungleich = ['Eis']; }, /ungleich muss eine Liste von Wörtern aus a–z/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L6-07').interaktion.ungleich; }, /ungleich \(Kollision\) oder praefix/);
  erwarteFehler((w) => { Object.assign(aufgabe(w, 'W9-L6-07').interaktion, { ziel: 20, praefix: 'ab' }); aufgabe(w, 'W9-L6-07').loesung.beispiel = 'zoot'; }, /beispiel beginnt nicht mit praefix|Neuberechnung/);
  erwarteFehler((w) => { delete aufgabe(w, 'W9-L6-07').loesung.beispiel; }, /beispiel \(Musterantwort/);
});

/* ---------- Task 30: Welt- und Level-Felder (Delta §2, §3), Negativ-Fixtures (Delta §13, E15) ---------- */

const FEHLER_DIR = path.join(__dirname, 'fixtures', 'fehler');

/** Änderungen einer Negativ-Fixture anwenden: pfad mit Punkten, Segment liste#ID wählt nach id, Zahl = Index. */
function wendeAn(w, aenderungen) {
  for (const a of aenderungen) {
    const teile = a.pfad.split('.');
    let ziel = w;
    const schritt = (o, seg) => {
      const [name, id] = seg.split('#');
      const x = name === '' ? o : o[name];
      return id ? x.find((e) => e.id === id) : /^\d+$/.test(seg) ? o[Number(seg)] : x;
    };
    for (const seg of teile.slice(0, -1)) ziel = schritt(ziel, seg);
    const letzt = teile[teile.length - 1];
    if (a.loeschen) delete ziel[letzt];
    else if ('anhaengen' in a) schritt(ziel, letzt).push(a.anhaengen);
    else ziel[/^\d+$/.test(letzt) ? Number(letzt) : letzt] = a.wert;
  }
  return w;
}

/** Fixture laden, optional als Inhaltswelt alsWelt (ids und Akten-Nummern umgeschrieben). */
function ladeWelt(alsWelt) {
  let t = fs.readFileSync(H.FIXTURE, 'utf8');
  if (alsWelt === undefined) return JSON.parse(t);
  t = t.replace(/W9-/g, `W${alsWelt}-`).replace(/W9·/g, `W${alsWelt}·`);
  const w = JSON.parse(t);
  w.welt = alsWelt;
  return w;
}

test('Fixture auch als Welt 0 fehlerfrei (alle Pflichtfelder einer Inhaltswelt)', () => assert.deepEqual(fehlerVon(ladeWelt(0)), []));

test('Negativ-Fixtures: je Datei der erwartete Fehler (Delta §11, §13)', () => {
  const dateien = fs.readdirSync(FEHLER_DIR).filter((d) => d.endsWith('.json')).sort();
  assert.ok(dateien.length >= 32, `nur ${dateien.length} Negativ-Fixtures`);
  for (const d of dateien) {
    const spec = JSON.parse(fs.readFileSync(path.join(FEHLER_DIR, d), 'utf8'));
    const f = fehlerVon(wendeAn(ladeWelt(spec.alsWelt), spec.aenderungen));
    assert.ok(f.some((x) => new RegExp(spec.erwartet).test(x)), `${d}: erwartet /${spec.erwartet}/ in\n${f.join('\n')}`);
  }
});

test('Welt/Level-Hinweise: akte, ab, kapitel, video', () => {
  const hin = (w, opt = {}) => validiereWelt(w, { datei: 't', ...opt }).warnungen.map((x) => x.meldung).join(' | ');
  let w = ladeWelt(0);
  delete w.levels.find((l) => l.id === 'W0-L2').akte;
  assert.match(hin(w), /akte fehlt/);
  w = basis();
  delete w.levels[0].akte;
  assert.match(hin(w), /bitte `?akte`? verwenden/);
  w = ladeWelt(0);
  delete w.kapitel;
  assert.match(hin(w), /kapitel fehlt/);
  assert.match(hin(basis(), { videos: [{ nr: 2, titel: 'x', url: 'https://www.youtube.com/watch?v=x' }] }), /video.*1/);
  assert.doesNotMatch(hin(basis(), { videos: [{ nr: 1, titel: 'x', url: 'https://www.youtube.com/watch?v=x' }] }), /video/);
  const k = require('../src/krypto/validierung');
  assert.equal(Math.round(k.kontrast('#8A5F1A', '#FBF7EE') * 100) / 100, 5.26);
  assert.equal(Math.round(k.kontrast('#B07D2B', '#FBF7EE') * 100) / 100, 3.38);
});

/* ---------- Task 31: Aufgaben, Boss-Regeln, dateiübergreifende Hinweise (Delta §4, §5.3, §10, §11) ---------- */

test('Aufgaben-Hinweise: Nummerierung, Altbegriffe, Fünfergruppen, Kern-Bestandteile, doppelte krypto-Lösung', () => {
  const hin = (w) => validiereWelt(w, { datei: 't' }).warnungen.map((x) => `${x.ort}: ${x.meldung}`).join('\n');
  let w = basis();
  aufgabe(w, 'W9-L5-03').inhalt[0].md = 'Verschlüssele mit c = (5 · p + 6) mod 26.';
  assert.match(hin(w), /W9-L5-03.*P1: Nummerierung nicht genannt/);
  w = basis();
  aufgabe(w, 'W9-L5-01').tipps = ['Das Chiffrat ist kurz.'];
  assert.match(hin(w), /Altbegriff.*Chiffrat/);
  w = basis();
  aufgabe(w, 'W9-L5-01').inhalt[0].md += ' Geheimtext: `CXYHUOD HVVLJ`';
  assert.match(hin(w), /Fünfergruppen/);
  assert.match(hin(basis()), /W9-L2-03.*tree/);
  w = basis();
  aufgabe(w, 'W9-L5-09').loesung.g1 = ['A', 'a'];
  assert.match(hin(w), /doppelte Lösung nach Normalisierung/);
  w = basis();
  aufgabe(w, 'W9-L3-01').inhalt[2].voreinstellung = { text: 'IMQRH', schluessel: 'GEHEIMNIS' };
  assert.match(hin(w), /verrät den Schlüssel/);
  assert.doesNotMatch(hin(basis()), /W9-L5-0[1-8].*Nummerierung/);
});

test('Hinweis „Lernende duzen“: „Die Lernenden …“ in Aufgabentexten und Level-Intro', () => {
  const hin = (w) => validiereWelt(w, { datei: 't' }).warnungen.map((x) => `${x.ort}: ${x.meldung}`).join('\n');
  assert.doesNotMatch(hin(basis()), /duzen/);
  let w = basis();
  aufgabe(w, 'W9-L5-01').inhalt[0].md = 'Die Lernenden verschlüsseln das Wort.';
  assert.match(hin(w), /W9-L5-01.*Lernende duzen/);
  w = basis();
  w.levels[0].intro = [{ t: 'text', md: '**Lernziel:** Die Lernenden beschreiben das Verfahren.' }];
  assert.match(hin(w), new RegExp(`${w.levels[0].id}.*Lernende duzen`));
});

test('Boss: zuordnung mit Häufigkeitsleiste verboten', () => {
  erwarteFehler((w) => {
    const z = { ...aufgabe(w, 'W9-L3-01'), id: 'W9-B-07', niveau: 'kern' };
    w.aufgaben.push(z);
    w.boss.pool.push('W9-B-07');
  }, /haeufigkeit/);
});

test('Boss: Interaktion mit boss.erlaubt === false verboten; boss.niveau entfallen (Hinweis)', () => {
  F.registriereInteraktion('vtestohneboss', { bereinige: (ia, a) => a, istLeer: () => false, pruefe: (ia, lo, a) => ({ ok: a === 'x' }), muster: () => 'x', validiere: () => {}, boss: { erlaubt: false } });
  erwarteFehler((w) => {
    const a = aufgabe(w, 'W9-B-01');
    a.interaktion = { kind: 'vtestohneboss' };
    a.loesung = {};
    a.inhalt = [{ t: 'text', md: 'Test' }];
  }, /vtestohneboss.*Boss/);
  const w = basis();
  w.boss.niveau = 'kern';
  assert.match(validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | '), /boss\.niveau ist entfallen.*Niveau je Aufgabe/);
});

test('Boss-Hinweise der Inhaltswelten: Pool-Größe, anzahl, mix, dauerMin; gA-Mix', () => {
  const hin = (w) => validiereWelt(w, { datei: 't' }).warnungen.map((x) => x.meldung).join(' | ');
  const w0 = ladeWelt(0);
  const h = hin(w0);
  assert.match(h, /Pool.*14–16/);
  assert.match(h, /anzahl.*8/);
  assert.match(h, /mix.*3\/3\/2/);
  assert.doesNotMatch(h, /dauerMin/);
  w0.boss.dauerMin = 30;
  assert.match(hin(w0), /dauerMin.*25/);
  assert.doesNotMatch(hin(basis()), /14–16/, 'Welt 9: keine Standard-Hinweise');
  const g = basis();
  aufgabe(g, 'W9-B-03').stufe = 1;
  assert.match(hin(g), /gA-Pool.*Stufe 2/);
});

test('Dateien: Zeitleiste und Abdeckung fremde Chiffre (Hinweise)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-zeit-'));
  const a = (() => {
    const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8').replace(/W9-/g, 'W0-').replace(/W9·/g, 'W0·'));
    w.welt = 0;
    w.jahr = { von: 1900, bis: 2000, anzeige: 'x' };
    return w;
  })();
  const b = (() => {
    const w = JSON.parse(fs.readFileSync(H.FIXTURE, 'utf8').replace(/W9-/g, 'W1-').replace(/W9·/g, 'W1·'));
    w.welt = 1;
    w.jahr = { von: -500, bis: 0, anzeige: 'x' };
    for (const x of w.aufgaben) if (x.kategorie === 'fremde-chiffre') x.kategorie = 'modulo';
    return w;
  })();
  fs.writeFileSync(path.join(tmp, 'a.json'), JSON.stringify(a));
  fs.writeFileSync(path.join(tmp, 'b.json'), JSON.stringify(b));
  const r = require('../src/content/validator').validiereDateien([path.join(tmp, 'a.json'), path.join(tmp, 'b.json')]);
  const alle = r.flatMap((x) => x.warnungen.map((y) => y.meldung)).join(' | ');
  assert.match(alle, /Zeitleiste nicht aufsteigend/);
  assert.match(alle, /Abdeckung fremde Chiffre/);
});

/* ---------- Review M3 W3, K5, K8: Rechenergebnisse in gaps, Alternativen, Schlüssel in Blöcken ---------- */

const hinweiseVon = (w) => validiereWelt(w, { datei: 'test.json' }).warnungen.map((f) => `${f.ort}: ${f.meldung}`);
function erwarteHinweis(aendern, muster, { nicht = false } = {}) {
  const w = basis();
  aendern(w);
  const h = hinweiseVon(w);
  assert.equal(h.some((x) => muster.test(x)), !nicht, `${nicht ? 'nicht ' : ''}erwartet ${muster} in:\n${h.join('\n')}`);
}

test('W3a: bits-Block mit pruefe xor – Lücke in der Ergebnis- oder Operandenzeile wird gegen die Lösung nachgerechnet', () => {
  assert.deepEqual(fehlerVon(basis()), []);
  erwarteFehler((w) => { aufgabe(w, 'W9-L6-02').loesung.c1 = ['0110 1000']; }, /W9-L6-02.*Lücke c1: Neuberechnung \(XOR\) ergibt 01101001/);
  erwarteFehler((w) => {
    const a = aufgabe(w, 'W9-L6-02');
    const z = a.inhalt[0].zeilen;
    z[1].bits = '[[k1]]';
    z[3].bits = '0110 1001';
    a.interaktion.felder = { k1: { typ: 'text', norm: 'bits' } };
    a.loesung = { k1: ['1010 1011'] };
  }, /Lücke k1: Neuberechnung \(XOR\) ergibt 10101010/);
});

test('W3b: alphabet-Block (Caesar- bzw. Schlüsselwort-Alphabet) – Lücken gegen das berechnete Alphabet', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L5-09').loesung.g1 = ['Q']; }, /W9-L5-09.*Lücke g1: Neuberechnung \(Alphabet\) ergibt A/);
  // Schlüsselwort-Alphabet KRYPTO (Rest ab A) mit Lücken im Rest
  erwarteFehler((w) => {
    const a = aufgabe(w, 'W9-L5-09');
    const zeile = [...'KRYPTOABCDEFGHIJLMNQSUVWXZ'];
    zeile[8] = '[[g1]]'; zeile[9] = '[[g2]]'; zeile[25] = '[[g3]]';
    a.inhalt[1].zeilen[1].werte = zeile;
    a.loesung.g1 = ['C']; a.loesung.g2 = ['D']; a.loesung.g3 = ['Y'];
  }, /Lücke g3: Neuberechnung \(Alphabet\) ergibt Z/);
  // dieselbe Zeile richtig → fehlerfrei
  const w = basis();
  const a = aufgabe(w, 'W9-L5-09');
  const zeile = [...'KRYPTOABCDEFGHIJLMNQSUVWXZ'];
  zeile[8] = '[[g1]]'; zeile[9] = '[[g2]]'; zeile[25] = '[[g3]]';
  a.inhalt[1].zeilen[1].werte = zeile;
  a.loesung.g1 = ['C']; a.loesung.g2 = ['D']; a.loesung.g3 = ['Z'];
  assert.deepEqual(fehlerVon(w), []);
});

test('W3b: quadrat-Block mit Lücke (ohne Schlüssel = Standardquadrat) wird nachgerechnet', () => {
  erwarteFehler((w) => { aufgabe(w, 'W9-L4-01').loesung.q1 = ['Z']; }, /W9-L4-01.*Lücke q1: Neuberechnung \(Quadrat\) ergibt S/);
});

test('W3c: gaps-Rechenaufgabe ohne prüfbare Struktur → Hinweis „pruefnachweis angeben“; pruefnachweis auch für gaps', () => {
  erwarteHinweis((w) => { delete aufgabe(w, 'W9-L5-10').pruefnachweis; }, /W9-L5-10.*Rechenergebnis nicht nachgerechnet – pruefnachweis angeben/);
  erwarteHinweis(() => {}, /W9-L5-10.*Rechenergebnis nicht nachgerechnet/, { nicht: true });
  erwarteHinweis(() => {}, /W9-L5-10.*pruefnachweis ist überflüssig/, { nicht: true });
  erwarteHinweis(() => {}, /W9-L6-02.*Rechenergebnis nicht nachgerechnet/, { nicht: true }); // per Block nachgerechnet
  erwarteHinweis(() => {}, /W9-L5-09.*Rechenergebnis nicht nachgerechnet/, { nicht: true }); // Kategorie substitution-mono
  // Plan M8 Task 178 (W4-L1-03): Klapplisten (typ auswahl) sind keine Rechenergebnisse
  erwarteHinweis((w) => {
    const a = aufgabe(w, 'W9-L5-10');
    delete a.pruefnachweis;
    a.interaktion = { kind: 'gaps', felder: { g1: { typ: 'auswahl', optionen: ['öffentlichen', 'privaten'] } } };
    a.loesung = { g1: ['privaten'] };
    a.inhalt = [{ t: 'text', md: 'Entschlüsselt wird mit dem [[g1]] Schlüssel.' }];
  }, /W9-L5-10.*Rechenergebnis nicht nachgerechnet/, { nicht: true });
});

test('K8: quadrat- bzw. alphabet-Block und verfahren derselben Aufgabe mit verschiedenen Schlüsseln → Hinweis', () => {
  erwarteHinweis(() => {}, /verschiedene Schlüssel/, { nicht: true });
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-05').inhalt[1].schluessel = 'ARCHIX'; }, /W9-L5-05.*quadrat.*verschiedene Schlüssel/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-02').inhalt[1].ausschnitt = ['R', 'O', 'S']; }, /W9-L5-02.*quadrat.*verschiedene Schlüssel/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').interaktion.verfahren.k = 4; }, /W9-L5-01.*alphabet.*verschiedene Schlüssel/);
});

test('K4: Falle bzw. Fehlmuster-Falle passt nicht zur Kategorie → Hinweis', () => {
  erwarteHinweis(() => {}, /W9-L5-0[1-9].*passt nicht zur Kategorie/, { nicht: true });
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').fallen = ['P10']; }, /W9-L5-01.*Falle P10 passt nicht zur Kategorie entschluesseln/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-08').loesung.fehlmuster[0].p = 'P9'; }, /W9-L5-08.*fehlmuster.*Falle P9 passt nicht zur Kategorie fremde-chiffre/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-09').loesung._fehlmuster.wert[0].p = 'P9'; }, /W9-L5-09.*_fehlmuster.*Falle P9 passt nicht zur Kategorie substitution-mono/);
});

test('Level ↔ Aufgabe: kuer-Aufgabe in einem kern-Level ist erlaubt (Delta §3, Tabelle „Regeln Level ↔ Aufgabe“)', () => {
  const w = basis();
  aufgabe(w, 'W9-L1-01').niveau = 'kuer';
  assert.deepEqual(fehlerVon(w), []);
  erwarteFehler((x) => { aufgabe(x, 'W9-L4-01').niveau = 'kern'; }, /Level-Niveau kuer erlaubt nur kuer-Aufgaben/);
});

/* ---------- M5 Task 71: Welt 8/9 ohne Akten-Hinweis, Kür-Akte, Videos ohne URL, Klartext klein (E51, E58, E59) ---------- */

const demoWelt = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'e2e', 'seed', 'gast', 'demo.json'), 'utf8'));
const warnungenVon = (w, opt = {}) => validiereWelt(w, { datei: 't', ...opt }).warnungen;

test('Welt 8: kein Hinweis „akte fehlt“; Kür-Level erwartet „Akte W<n>·K<k>“', () => {
  assert.ok(!warnungenVon(demoWelt()).some((x) => /akte fehlt/.test(x.meldung)));
  assert.ok(!warnungenVon(basis()).some((x) => /akte fehlt/.test(x.meldung)), 'Fixture-Welt 9: kein akte-Hinweis');
  let w = basis();
  const l = w.levels.find((x) => x.id === 'W9-L4');
  l.akte = 'Akte W9·K1 – Quadrate'; l.nr = 'K1';
  assert.ok(!warnungenVon(w).some((x) => /akte muss/.test(x.meldung)), warnungenVon(w).map((x) => x.meldung).join(' | '));
  w = ladeWelt(2);
  w.levels.find((x) => x.id === 'W2-L4').akte = 'Akte W2·4 – Quadrate';
  assert.ok(warnungenVon(w).some((x) => /akte muss mit „Akte W2·K1“ beginnen/.test(x.meldung)));
  w.levels.find((x) => x.id === 'W2-L4').akte = 'Akte W2·K1 – Quadrate';
  assert.ok(!warnungenVon(w).some((x) => /akte muss/.test(x.meldung)));
});

test('Hinweis „Klartext klein“ bei GROSSER Entschlüsselungs-Lösung', () => {
  const w = basis();
  aufgabe(w, 'W9-L5-01').loesung.text = 'ZUVERLAESSIG';
  assert.ok(warnungenVon(w).some((x) => x.ort.includes('W9-L5-01') && /Klartext klein/.test(x.meldung)));
  assert.ok(!warnungenVon(basis()).some((x) => /Klartext klein/.test(x.meldung)), 'Fixture nach Korrektur sauber');
});

test('Video-Eintrag mit url null zählt als vorhanden', () => {
  const r = warnungenVon(basis(), { videos: [{ nr: 1, titel: 'Testvideo', url: null }] });
  assert.ok(!r.some((x) => /video\.nr/.test(x.meldung)), r.map((x) => x.meldung).join(' | '));
  assert.ok(warnungenVon(basis(), { videos: [{ nr: 2, titel: 'Testvideo', url: null }] }).some((x) => /video\.nr 1 fehlt in seed\/videos\.json/.test(x.meldung)));
});

test('Boss-Rahmentext: optional, höchstens 800 Zeichen, Hinweis fehlt nur in Inhaltswelten (Plan M5 E52)', () => {
  assert.equal(typeof basis().boss.rahmen, 'string');
  erwarteFehler((w) => { w.boss.rahmen = 'x'.repeat(801); }, /rahmen: höchstens 800 Zeichen/);
  erwarteFehler((w) => { w.boss.rahmen = 42; }, /rahmen/);
  const w = basis(); w.boss.rahmen = 'x'.repeat(800);
  assert.deepEqual(fehlerVon(w), []);
  const hin = (x) => validiereWelt(x, { datei: 't' }).warnungen.map((y) => y.meldung).join(' | ');
  const ohne = basis(); delete ohne.boss.rahmen;
  assert.doesNotMatch(hin(ohne), /rahmen fehlt/, 'Fixture-Welt 9: kein Hinweis');
  const w0 = ladeWelt(0); delete w0.boss.rahmen;
  assert.match(hin(w0), /rahmen fehlt/);
});

test('Durchsicht W1: Häufigkeitsleiste doppelt (Block haeufigkeit + Werkbank mit haeufigkeit: true über denselben Text) → Hinweis', () => {
  // Fixture W9-L3-01: Block quelle „text“ mit dem Geheimtext der zuordnung, haeufigkeit: true
  erwarteHinweis(() => {}, /W9-L3-01.*Häufigkeitsleiste doppelt/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L3-01').interaktion.haeufigkeit = false; }, /W9-L3-01.*Häufigkeitsleiste doppelt/, { nicht: true });
  // quelle „werte“ mit den Häufigkeiten desselben Textes ebenfalls doppelt
  const K = require('../public/static/js/shared/krypto.js');
  erwarteHinweis((w) => {
    const a = aufgabe(w, 'W9-L3-01');
    const b = a.inhalt.find((x) => x.t === 'haeufigkeit');
    b.quelle = 'werte'; delete b.text;
    b.werte = Object.fromEntries(Object.entries(K.haeufigkeiten(a.interaktion.geheimtext)).filter(([, n]) => n > 0));
  }, /W9-L3-01.*Häufigkeitsleiste doppelt/);
  // anderer Text im Block → kein Hinweis
  erwarteHinweis((w) => { aufgabe(w, 'W9-L3-01').inhalt.find((x) => x.t === 'haeufigkeit').text = 'ABCDE FGHIJ'; }, /W9-L3-01.*Häufigkeitsleiste doppelt/, { nicht: true });
});

// M5-Inhaltsprüfung: Boss-Aufgaben ohne Fallen-Nummer und Verweise auf andere Aufgaben in Schülertexten → Hinweis
test('Hinweis: Boss-Aufgabe ohne fallen (Diagnose und Auswertung brauchen eine P-Nummer)', () => {
  // Fixture W9-B-02 hat fallen [] – das ist der Hinweis
  erwarteHinweis(() => {}, /W9-B-02.*ohne fallen/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-B-02').fallen = ['P4']; }, /W9-B-02.*ohne fallen/, { nicht: true });
  erwarteHinweis((w) => { delete aufgabe(w, 'W9-B-01').fallen; }, /W9-B-01.*ohne fallen/);
  // Lab-Aufgaben ohne fallen sind erlaubt (z. B. Einführungen)
  erwarteHinweis((w) => { aufgabe(w, 'W9-L1-01').fallen = []; }, /W9-L1-01.*ohne fallen/, { nicht: true });
});

test('Hinweis: Verweis auf eine andere Aufgabe (id) in einem Schülertext – Aufgaben sind frei anwählbar', () => {
  erwarteHinweis(() => {}, /Verweis auf die Aufgabe/, { nicht: true });
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').inhalt[0].md = 'Material wie in W9-B-03.'; }, /W9-L5-01.*Verweis auf die Aufgabe W9-B-03/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').tipps = ['Siehe WU-W9-02.']; }, /W9-L5-01.*Verweis auf die Aufgabe WU-W9-02/);
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').erklaerung = [{ t: 'text', md: 'Wie W9-L1-02.' }]; }, /W9-L5-01.*Verweis auf die Aufgabe W9-L1-02/);
  // die eigene id (z. B. in einer Überschrift) ist kein Verweis
  erwarteHinweis((w) => { aufgabe(w, 'W9-L5-01').inhalt[0].md = 'Aufgabe W9-L5-01'; }, /Verweis auf die Aufgabe/, { nicht: true });
});

/* ---------- M6 Task 109: Werkzeug-Voreinstellungen (E70, E73, E75) ---------- */

/** Welt mit verändertem Level W9-L1 (Felder) und optional einem Block in dessen erster Aufgabe. */
function levelMit(felder, block) {
  const w = basis();
  const l = w.levels.find((x) => x.id === 'W9-L1');
  Object.assign(l, felder);
  if (block) aufgabe(w, l.aufgaben[0]).inhalt.push(block);
  return w;
}
const levelFehler = (w) => fehlerVon(w);
const levelHinweise = (w) => validiereWelt(w, { datei: 'test.json' }).warnungen.map((f) => `${f.ort}: ${f.meldung}`);
const validiereBlock = (b) => levelFehler(levelMit({}, b));
/** Hinweise einer Aufgabe (W9-L1-01) mit geänderten Feldern und zusätzlichem Block. */
function aufgabeHinweise(felder, block) {
  const w = basis();
  const a = aufgabe(w, 'W9-L1-01');
  Object.assign(a, felder);
  a.inhalt.push(block);
  return validiereWelt(w, { datei: 'test.json' }).warnungen.filter((f) => f.ort.includes('W9-L1-01')).map((f) => f.meldung);
}

test('M6: werkzeug-Voreinstellung reiter/richtung/modus geprüft, Level-Objekte, Schlüsselverrat erweitert, KH-Hinweis', () => {
  const fehler = (b) => validiereBlock({ t: 'werkzeug', ...b });
  assert.deepEqual(fehler({ id: 'vigenere', voreinstellung: { reiter: ['quadrat', 'verschluesseln'] } }), []);
  assert.match(fehler({ id: 'vigenere', voreinstellung: { reiter: ['bigramme'] } }).join(), /reiter/);
  assert.match(fehler({ id: 'vigenere', voreinstellung: { reiter: [] } }).join(), /reiter/);
  assert.match(fehler({ id: 'vigenere', voreinstellung: { reiter: ['quadrat', 'quadrat'] } }).join(), /doppelt/);
  assert.match(fehler({ id: 'scheibe', voreinstellung: { richtung: 'quer' } }).join(), /richtung/);
  assert.match(fehler({ id: 'vigenere', voreinstellung: { modus: 'beaufort' } }).join(), /modus/);
  assert.match(fehler({ id: 'runden', voreinstellung: { variante: 'aes' } }).join(), /variante/);
  assert.match(fehler({ id: 'bitlupe', voreinstellung: { schluesselart: 'dez' } }).join(), /schluesselart/);
  assert.deepEqual(fehler({ id: 'bitlupe', voreinstellung: { schluesselart: 'hex', c1: '55 85', c2: '50 8F' } }), []);
  assert.match(fehler({ id: 'substitution', voreinstellung: { reiter: ['x'] } }).join(), /nicht erlaubt/);
  const l = levelMit({ werkzeug: [{ id: 'vigenere', voreinstellung: { reiter: ['quadrat'] } }, 'scheibe'] });
  assert.deepEqual(levelFehler(l), []);
  assert.match(levelFehler(levelMit({ werkzeug: [{ id: 'vigenere' }, { id: 'vigenere' }] })).join(), /doppelt/);
  assert.match(levelFehler(levelMit({ werkzeug: [{ id: 'vigenere', voreinstellung: { reiter: ['bigramme'] } }] })).join(), /reiter/);
  assert.match(levelFehler(levelMit({ werkzeug: [{ id: 'zauberstab' }] })).join(), /unbekannt/);
  assert.match(levelFehler(levelMit({ werkzeug: [{ id: 'vigenere', extra: 1 }] })).join(), /werkzeug/);
  assert.match(levelHinweise(levelMit({ rolle: 'kryptoanalyse' }, { t: 'werkzeug', id: 'substitution', voreinstellung: { vorgabe: { A: 'e' } } })).join(), /verrät den Schlüssel/);
  assert.match(levelHinweise(levelMit({ rolle: 'kryptoanalyse', werkzeug: [{ id: 'skytale', voreinstellung: { t: 3 } }] })).join(), /verrät den Schlüssel/);
  assert.match(aufgabeHinweise({ kategorie: 'hash' }, { t: 'werkzeug', id: 'hash' }).join(), /Reiter einschränken/);
  assert.match(aufgabeHinweise({ kategorie: 'hash' }, { t: 'werkzeug', id: 'hash', voreinstellung: { reiter: ['lawine', 'schritte'] } }).join(), /Reiter einschränken/);
  assert.doesNotMatch(aufgabeHinweise({ kategorie: 'hash' }, { t: 'werkzeug', id: 'hash', voreinstellung: { reiter: ['lawine'] } }).join(), /Reiter einschränken/);
});
