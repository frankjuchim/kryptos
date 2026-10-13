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
