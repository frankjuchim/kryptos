'use strict';
// Kryptolabor „Vigenère-Werkbank“ (W2 §9.1, W6 §9.1, Plan M6 Tasks 116/117): Anzeige = Krypto.* im Test-Realm.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { oeffne, Krypto: K } = require('./hilfen_labor');
/** Feld leeren und neu tippen (k.tippe hängt bei maxlength > 1 an). */
function neu(w, sel, text) {
  const el = w.k.eins(w.flaeche, sel);
  el.value = '';
  w.k.tippe(el, text);
}
const stromZellen = (w) => w.k.alle(w.k.eins(w.flaeche, 'table.vg-zeilen tr.strom'), 'td').map((z) => w.k.text(z)).join('');

test('Quadrat: Zelle wählen hebt Zeile/Spalte hervor, Rechner und Rechenzeile über die Bibliothek', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['quadrat'] } });
  w.k.klick(w.k.eins(w.flaeche, 'table.quadrat-vigenere td[data-zeile="L"][data-spalte="K"]'));
  assert.equal(w.k.eins(w.flaeche, 'td[data-zeile="L"][data-spalte="K"]').classList.contains('schnitt'), true);
  assert.equal(w.k.eins(w.flaeche, 'input.vq-geheim').value, K.vigenere('K', 'L'));
  assert.match(w.text('.vq-rechnung'), /\(\(11 \+ 12 − 2\) mod 26\) \+ 1 = 22 → V/);
  assert.deepEqual(w.zustand().zelle, { zeile: 'L', spalte: 'K' });
  w.k.tippe(w.k.eins(w.flaeche, 'input.vq-klar'), '');
  w.k.tippe(w.k.eins(w.flaeche, 'input.vq-geheim'), 'V');
  assert.equal(w.k.eins(w.flaeche, 'input.vq-klar').value.toUpperCase(), K.vigenere('V', 'L', 'ent'));
  assert.match(w.text('.vq-rechnung'), /p = \(\(c − s\) mod 26\) \+ 1 = \(\(22 − 12\) mod 26\) \+ 1 = 11 → k/);
  // Schlüssel aus Klar- und Geheimbuchstabe
  w.k.tippe(w.k.eins(w.flaeche, 'input.vq-klar'), 'e');
  w.k.tippe(w.k.eins(w.flaeche, 'input.vq-geheim'), 'G');
  w.k.eins(w.flaeche, 'input.vq-schluessel').value = '';
  w.k.tippe(w.k.eins(w.flaeche, 'input.vq-klar'), 'e');
  assert.equal(K.vigenere('E', w.k.eins(w.flaeche, 'input.vq-schluessel').value), 'G');
  // Alphabetleiste umschaltbar: Verschiebung 0 … 25
  w.k.klick(w.k.eins(w.flaeche, '.labor-basis [data-basis="0"]'));
  assert.match(w.text('.vq-alphabet'), /A = 0 … Z = 25/);
});

test('Quadrat: Tastatur – Pfeile bewegen den Fokus, Enter wählt', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['quadrat'] } });
  const z = (a, b) => w.k.eins(w.flaeche, `td[data-zeile="${a}"][data-spalte="${b}"]`);
  z('A', 'A').focus();
  w.k.taste(z('A', 'A'), 'ArrowDown');
  w.k.taste(z('B', 'A'), 'Enter');
  assert.deepEqual(w.zustand().zelle, { zeile: 'B', spalte: 'A' });
  assert.equal(w.k.eins(w.flaeche, 'input.vq-geheim').value, 'B');
});

test('Ver-/Entschlüsseln: Vigenère, Autokey (Strom), Porta (Hinweis) = Bibliothek', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], text: 'kerze' } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'LICHT');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.vigenere('kerze', 'LICHT'));
  assert.equal(w.zustand().strom, 'LICHT');
  w.k.klick(w.k.eins(w.flaeche, '.vg-modus [data-modus="autokey"]'));
  neu(w, 'textarea.labor-eingabe', 'treffen');
  neu(w, 'input.vg-schluessel', 'ZU');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'SLXWJJS');
  assert.equal(w.zustand().strom, K.schluesselstrom('treffen', 'ZU', { modus: 'autokey' }));
  w.k.klick(w.k.eins(w.flaeche, '.vg-modus [data-modus="porta"]'));
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.porta('treffen', 'ZU'));
  assert.match(w.text('.labor-hinweis'), /Ver- = Entschlüsseln/);
  assert.equal(w.k.alle(w.flaeche, 'table.porta-tafel tbody tr').length, 13);
});

test('Autokey-Entschlüsseln: Nachspiel baut den Strom Zeichen für Zeichen auf', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], modus: 'autokey', richtung: 'ent', text: 'SLXWJJS' } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'ZU');
  assert.equal(stromZellen(w), 'ZUTREFF', 'ohne Nachspiel: ganzer Strom');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'treffen');
  const leiste = w.k.eins(w.flaeche, '.nachspiel');
  // Start = noch kein Schritt (ganzer Strom), dann Schritt 1, 2, 3 (Plan: zwei Schritte ab Schritt 1)
  w.k.taste(leiste, 'ArrowRight'); w.k.taste(leiste, 'ArrowRight'); w.k.taste(leiste, 'ArrowRight');
  assert.equal(stromZellen(w), 'ZUT');
  assert.ok(w.k.eins(w.flaeche, 'table.vg-zeilen td.aktuell'));
});

test('Pendel und frei nur ab Welt 6; Pendel = Vigenère mit der Pendelfolge (W6)', () => {
  const ohne = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'] }, umgebung: { welten: [0, 1, 2] } });
  assert.deepEqual(ohne.k.alle(ohne.flaeche, '.vg-modus [data-modus]').map((b) => b.dataset.modus), ['vigenere', 'autokey', 'porta']);
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], modus: 'pendel', text: 'ZAICMESTHRNIFIEE' } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'SAND');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), 'RAVFZEKTUUAIXIRH');
  assert.match(w.text('.vg-pendel'), /SANDNA.*2L − 2 = 6/s);
  w.k.klick(w.k.eins(w.flaeche, '.vg-modus [data-modus="frei"]'));
  assert.equal(w.ohneLeer('output.labor-ausgabe'), K.vigenere('ZAICMESTHRNIFIEE', 'SAND'));
});

test('Reiter-Einschränkung aus der Level-Voreinstellung (Level 2.1, E70)', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['quadrat', 'verschluesseln'] } });
  assert.deepEqual(w.k.alle(w.flaeche, '[role="tab"]').map((t) => t.dataset.reiter), ['quadrat', 'verschluesseln']);
});

/* ---------- Task 117: Angriff (W2 §9.1 Reiter 3–7, Testfälle 1–3; Testfall 4 nur über die Bibliothek, E84) ---------- */
const W2 = require('../quellen/pruefwerte/W2.json').werte;
const EVE = W2.find((x) => x.id === 'W2-2-v1').eingabe[0];
const LAB = 'JSCGU UPHSD QDKBR WJWPJ KGLQJ HPQGA DRTBE DMRTH MSDDT REHTP CLTUP QKRWH MSDFN SYNKO FVMSY XGRTH CONKK OXWUF OHYDL OGGEH YYPQT HOLKU PVGBO WKBYL IVEXT RWDKG DWJWP JKGLQ JHPQT ONKJS CPKGD HNSCH OB';

test('W2 §9.1 Testfall 1 (Eves Brief): Kasiski, Teilertabelle, Zufallstreffer, IC, Friedman, Teiltext-IC, WACHS', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur'], text: EVE } });
  const z = w.zustand();
  assert.deepEqual(z.wiederholungen.map((x) => [x.folge, x.positionen]), [['AVEEDYAAFG', [133, 173]], ['EPKW', [106, 116]], ['ZIG', [0, 60, 100]], ['VEE', [134, 174, 189]], ['SHE', [4, 129]], ['KWN', [43, 108]], ['VAR', [69, 154]], ['CEP', [125, 210]]]);
  assert.equal(z.maximum, 5);
  assert.match(w.text('table.teiler tr.maximum'), /5.*9/);
  assert.equal(w.k.alle(w.flaeche, 'table.wiederholungen tbody tr').length, 8);
  assert.match(w.text('table.wiederholungen'), /125 = 5 · 5 · 5/);
  assert.ok(w.k.alle(w.flaeche, '.geheimtext mark.markiert').length >= 8, 'Wiederholungen im Text markiert');
  assert.deepEqual(w.k.alle(w.flaeche, '.geheimtext .gruppe-spalte .position').slice(0, 3).map(w.k.text), ['0', '5', '10']);
  w.k.klick(w.k.eins(w.flaeche, 'input.zufall[data-abstand="125"]'));
  assert.equal(w.zustand().teiler[5], 8);
  assert.equal(w.k.eins(w.flaeche, 'input.zufall[data-abstand="125"]').checked, true);
  w.reiter('koinzidenz');
  assert.match(w.text('.kennzahl-bruch'), /2434 \/ 51756/);
  assert.match(w.text('.kennzahl-wert'), /0,0470/);
  assert.match(w.text('.friedman'), /4,15/);
  assert.match(w.k.text(w.k.eins(w.flaeche, 'table.ic-mittel tr[data-k="5"]')), /0,0961/);
  assert.ok(w.k.eins(w.flaeche, 'table.ic-mittel tr[data-k="10"]').classList.contains('hoch'));
  assert.match(w.k.text(w.k.eins(w.flaeche, 'table.ic-mittel tr[data-k="10"]')), /▲/);
  w.reiter('teiltexte');
  w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'Home');
  for (let i = 1; i < 5; i++) w.k.taste(w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]'), 'ArrowUp');
  assert.equal(w.k.alle(w.flaeche, '.vg-teiltext').length, 5);
  assert.equal(w.ohneLeer('.vg-teiltext .geheimtext'), K.teiltexte(EVE, 5)[0]);
  w.reiter('verschiebung');
  assert.equal(w.zustand().vorschlag, 'WACHS');
  assert.match(w.text('.labor-hinweis'), /Prüfe am Klartext!/);
  assert.match(w.text('table.verschiebung'), /W \(Nummer 23\)/);
  w.reiter('korrektur');
  assert.equal(w.zustand().klartext.slice(0, 10), 'diegaleere');
  w.k.klick(w.k.eins(w.flaeche, '.korrektur-feld[data-spalte="0"] .zahl-plus'));
  assert.equal(w.zustand().schluessel, 'XACHS');
  assert.equal(w.zustand().klartext, K.klein(K.vigenere(EVE, 'XACHS', 'ent')));
  assert.equal(w.text('.korrektur-klartext').replace(/\s/g, ''), w.zustand().klartext);
  assert.ok(w.k.eins(w.flaeche, '.korrektur-klartext span.spalte-0').getAttribute('title').includes('Spalte 1'));
  // Buchstabeneingabe im Feld
  const f = w.k.eins(w.flaeche, '.korrektur-feld[data-spalte="0"] input');
  w.k.tippe(f, 'w');
  assert.equal(w.zustand().schluessel, 'WACHS');
});

test('W2 §9.1 Testfall 2 (Lab-Text W2-L2-07): längste Wiederholung, Teiler 2 und 4, IC, Friedman, GOLD', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski', 'teiltexte', 'koinzidenz', 'verschiebung'], text: LAB, schluessellaenge: 4 } });
  const z = w.zustand();
  assert.deepEqual([z.wiederholungen[0].folge, z.wiederholungen[0].positionen], ['WJWPJKGLQJHPQ', [15, 131]]);
  assert.deepEqual([z.teiler[2], z.teiler[4]], [7, 7]);
  assert.equal(z.ic.toFixed(4), '0.0434');
  assert.equal(z.friedman.toFixed(2), '6.78');
  assert.equal(z.icMittel[4].toFixed(4), '0.0914');
  assert.equal(z.vorschlag, 'GOLD');
});

test('W2 §9.1 Testfall 3 (Archivfund, LAGUNE): Entschlüsseln im Reiter 2', () => {
  const W = require('../seed/welten/welt2.json');
  const a = W.aufgaben.find((x) => x.id === 'W2-A-01');
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['verschluesseln'], richtung: 'ent', text: a.interaktion[1].eingabe } });
  w.k.tippe(w.k.eins(w.flaeche, 'input.vg-schluessel'), 'LAGUNE');
  assert.equal(w.ohneLeer('output.labor-ausgabe'), a.loesung[1].text);
});

test('Koinzidenz-Reiter nur eA; Friedman erst ab n ≥ 30; I ≤ I_Z', () => {
  const gA = oeffne('vigenere', { umgebung: { niveau: 'gA', welten: [2] } });
  assert.ok(!gA.k.alle(gA.flaeche, '[role="tab"]').some((t) => t.dataset.reiter === 'koinzidenz'));
  const kurz = oeffne('vigenere', { voreinstellung: { reiter: ['koinzidenz'], text: 'ABCAB CABCA BC' } });
  assert.match(kurz.text('.friedman'), /Text zu kurz/);
  const flach = oeffne('vigenere', { voreinstellung: { reiter: ['koinzidenz'], text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(2) } });
  assert.match(flach.text('.friedman'), /I ≤ I_Z: Schlüssel etwa so lang wie der Text/);
});

test('Analyse: kein Speicher, keine Anfragen, kein automatisch „richtiger“ Schlüssel markiert', () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski', 'verschiebung', 'korrektur'], text: EVE } });
  for (const r of ['kasiski', 'verschiebung', 'korrektur']) {
    w.reiter(r);
    assert.equal(w.k.alle(w.flaeche, '.richtig, [data-richtig]').length, 0);
  }
  assert.deepEqual(w.k.anfragen, []);
  assert.equal(w.k.window.localStorage.length, 0);
});

test('Analyse-Reiter: Eingabe entprellt (300 ms) – Kasiski & Co. rechnen erst nach einer Tipp-Pause (Review M6)', async () => {
  const w = oeffne('vigenere', { voreinstellung: { reiter: ['kasiski'], text: 'ABCDEFGH' } });
  const vorher = w.text('.vg-textzeile');
  w.k.tippe(w.k.eins(w.flaeche, 'textarea.labor-eingabe'), 'XYZABCXYZ');
  assert.equal(w.text('.vg-textzeile'), vorher, 'noch nicht neu gezeichnet');
  assert.ok(w.k.timer.some((t) => t.ms === 300), 'Entprellung 300 ms');
  await w.k.ruhe();
  assert.notEqual(w.text('.vg-textzeile'), vorher);
  assert.deepEqual(w.zustand().wiederholungen.map((x) => x.folge), ['ABC', 'XYZ']);
});
