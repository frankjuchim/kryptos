'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const K = require('../public/static/js/shared/krypto.js');
const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/bloecke.js'];
function bau(b, ctx = {}) {
  const k = D.lade(SKRIPTE);
  const gaps = {};
  const el = k.wert('AQR').block(b, 0, { modus: 'lab', gap: (id) => (gaps[id] = k.document.createElement('input')), ...ctx });
  k.document.body.appendChild(el);
  return { k, el, gaps };
}
test('Geheimtext-Zeile: Fünfergruppen, buchstabiert für Screenreader, Kopieren ohne Leerzeichen', async () => {
  const k = D.lade(SKRIPTE);
  const el = k.wert('KRB').geheimtext('aylmm wbura', { positionen: true });
  k.document.body.appendChild(el);
  assert.deepEqual(k.alle(el, 'span.gruppe').map(k.text), ['AYLMM', 'WBURA']);
  assert.equal(k.text(k.eins(el, 'span.sr')), 'Geheimtext, buchstabiert: A Y L M M, W B U R A');
  assert.deepEqual(k.alle(el, '.positionen span').map(k.text), ['0', '5']);
  k.klick(k.eins(el, 'button.kopieren'));
  await k.ruhe();
  assert.equal(k.zwischenablage.at(-1), 'AYLMMWBURA');
});
test('alphabet: zwei Hälften, Zahlenzeile A = 1, Klartext klein, Lücke mit aria-label, markierte Spalten, caption', () => {
  const { k, el, gaps } = bau({ t: 'alphabet', basis: 1, zeilen: [{ label: 'Klartext', werte: 'abcdefghijklmnopqrstuvwxyz' }, { label: 'Geheimtext', werte: [...'DEFGHIJKLMNOPQRSTUVWXYZ', '[[g1]]', '[[g2]]', '[[g3]]'] }], markiert: [0, 23], titel: 'Caesar mit k = 3' });
  const teile = k.alle(el, 'table.alphabet-teil');
  assert.equal(teile.length, 2);
  assert.deepEqual(k.alle(teile[0], 'thead th[scope="col"]').map(k.text), [...'ABCDEFGHIJKLM']);
  assert.deepEqual(k.alle(teile[1], 'thead th[scope="col"]').map(k.text), [...'NOPQRSTUVWXYZ']);
  assert.equal(k.text(k.eins(el, 'figcaption')), 'Caesar mit k = 3');
  assert.equal(k.text(k.eins(teile[0], 'tr.zahlen th')), 'A = 1 … Z = 26');
  assert.deepEqual(k.alle(teile[1], 'tr.zahlen td').map(k.text).slice(-1), ['26']);
  assert.equal(k.text(k.alle(teile[0], 'tbody tr')[1].querySelector('td')), 'a');
  assert.equal(gaps.g1.getAttribute('aria-label'), 'Geheimtext zu X');
  assert.deepEqual(k.alle(el, 'thead th.markiert').map(k.text), ['A', 'X']);
  const null_ = bau({ t: 'alphabet', basis: 0, zahlen: true, zeilen: [{ label: 'Klartext', werte: 'abcdefghijklmnopqrstuvwxyz' }] });
  assert.equal(null_.k.text(null_.k.eins(null_.el, 'tr.zahlen th')), 'A = 0 … Z = 25');
  assert.equal(bau({ t: 'alphabet', basis: 1, zahlen: false, zeilen: [{ label: 'K', werte: 'abcdefghijklmnopqrstuvwxyz' }] }).el.querySelectorAll('tr.zahlen').length, 0);
});
test('haeufigkeit: Balken aus Krypto.haeufigkeiten, Referenz schraffiert, markiert, Sortierung umschaltbar, Tabelle', () => {
  const text = 'TCHTA TBTCG TNYBM COQCN QHSMN INCYB TMVCT CBMNY BFSTN NTF';
  const H = K.haeufigkeiten(text);
  const { k, el } = bau({ t: 'haeufigkeit', quelle: 'text', text, referenz: 'deutsch', sortierung: 'absteigend', einheit: 'prozent', markiert: ['T', 'C'], titel: 'Häufigkeiten im Geheimtext' });
  const svg = k.eins(el, 'svg.histogramm');
  const tab = k.eins(el, 'table.haeufigkeit-tabelle');
  assert.equal(svg.getAttribute('aria-describedby'), tab.getAttribute('id'));
  const balken = k.alle(svg, 'rect.balken');
  const soll = Object.keys(H).sort((a, b) => H[b] - H[a] || a.localeCompare(b));
  assert.deepEqual(balken.map((r) => r.getAttribute('data-buchstabe')), soll);
  const hoehe = (b) => Number(balken.find((r) => r.getAttribute('data-buchstabe') === b).getAttribute('height'));
  assert.ok(Math.abs(hoehe('T') / hoehe('C') - H.T / H.C) < 0.01);
  assert.equal(k.alle(svg, 'rect.balken-deutsch').length, 26);
  assert.deepEqual(k.alle(svg, 'rect.balken.markiert').map((r) => r.getAttribute('data-buchstabe')).sort(), ['C', 'T']);
  assert.equal(tab.hidden, true);
  k.klick(k.eins(el, 'button.als-tabelle'));
  assert.equal(tab.hidden, false);
  assert.deepEqual(k.alle(tab, 'thead th').map(k.text), ['Buchstabe', 'Anzahl', 'Prozent', 'Deutsch %']);
  k.klick(k.alle(el, 'button[aria-pressed]').find((b) => k.text(b) === 'alphabetisch'));
  assert.equal(k.alle(svg, 'rect.balken')[0].getAttribute('data-buchstabe'), 'A');
  assert.equal(k.text(k.eins(tab, 'tbody tr th')), 'A');
});
test('bits: Gruppen à 4, ⊕-Trennzeile, Lückenzeile, markierte Spalten, Screenreader-Text', () => {
  const { k, el, gaps } = bau({ t: 'bits', gruppe: 4, pruefe: 'xor', zeilen: [{ label: 'M', bits: '0100 1011' }, { label: 'K', bits: '0110 1010' }, { trenner: '⊕' }, { label: 'C', bits: '[[c1]]' }], markiert: [2, 7] });
  const zeilen = k.alle(el, '.bits-zeile');
  assert.equal(k.alle(zeilen[0], 'span.bit').length, 8);
  assert.equal(k.alle(zeilen[0], 'span.bit.gruppe-ende').length, 1);
  assert.equal(k.text(k.eins(el, '.bits-trenner')), '⊕');
  assert.equal(gaps.c1.getAttribute('aria-label'), 'C: Bits eintragen');
  assert.equal(k.alle(zeilen[0], 'span.bit.markiert[aria-current="true"]').length, 2);
  assert.equal(k.text(k.eins(zeilen[0], 'span.sr')), 'M: 0 1 0 0, 1 0 1 1');
});
test('quadrat vigenere: Ausschnitt, Schnittpunkt U/R = L, Hinweistext; playfair I/J; polybios 6×6 ADFGVX', () => {
  let { k, el } = bau({ t: 'quadrat', art: 'vigenere', ausschnitt: ['L', 'U', 'N', 'A'], hervorheben: { zeile: 'U', spalte: 'R' } });
  assert.deepEqual(k.alle(el, 'tbody th[scope="row"]').map(k.text), ['L', 'U', 'N', 'A']);
  assert.equal(k.text(k.eins(el, 'td.schnitt')), 'L');
  assert.equal(k.alle(el, 'tr.hervor').length, 1);
  assert.match(k.text(k.eins(el, 'p.quadrat-hinweis')), /Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe/);
  ({ k, el } = bau({ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', ij: 'I' }));
  const zellen = k.alle(el, 'tbody td').map(k.text);
  assert.deepEqual(zellen.slice(0, 5), ['A', 'R', 'C', 'H', 'I/J']);
  assert.equal(zellen.length, 25);
  ({ k, el } = bau({ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGVX', zellen: [['N', 'A', '1', 'C', '3', 'H'], ['8', 'T', 'B', '2', 'O', 'M'], ['E', '5', 'W', 'R', 'P', 'D'], ['4', 'F', '6', 'G', '7', 'I'], ['9', 'J', '0', 'K', 'L', 'Q'], ['S', 'U', 'V', 'X', 'Y', 'Z']] }));
  assert.deepEqual(k.alle(el, 'thead th[scope="col"]').map(k.text), [...'ADFGVX']);
  assert.equal(k.alle(el, 'tbody td').length, 36);
});
test('quadrat frei mit Lücke: Eingabe über ctx.gap mit Zeile/Spalte im aria-label', () => {
  const { gaps } = bau({ t: 'quadrat', art: 'frei', zellen: [['A', 'B'], ['[[q1]]', 'D']] });
  assert.equal(gaps.q1.getAttribute('aria-label'), 'Zelle Zeile 2, Spalte 1');
});
test('matrix: Kopf + Reihenfolge aus Krypto.spaltenReihenfolge, leere Zellen, Leserichtung', () => {
  const kopf = [...'SCHLUESSEL'];
  const { k, el, gaps } = bau({ t: 'matrix', kopf, reihenfolge: true, zeilen: [[...'diebotscha'], ['f', 't', 'i', 's', 't', '[[m1]]', '', '', '', '']], leserichtung: 'spaltenweise', titel: 'Spaltentransposition' });
  assert.deepEqual(k.alle(el, 'tr.reihenfolge td').map(k.text).map(Number), K.spaltenReihenfolge('SCHLUESSEL'));
  assert.equal(k.alle(el, 'td.leer').length, 4);
  assert.ok(gaps.m1);
  assert.equal(k.text(k.eins(el, 'p.matrix-leserichtung')), '↓ spaltenweise lesen');
});
test('matrix Fleißner: vier Stellungen, Löcher ab 1, Drehung rechts, jede Zelle genau einmal', () => {
  const { k, el } = bau({ t: 'matrix', groesse: 4, schablone: [[1, 1], [1, 2], [2, 1], [2, 2]], drehung: 'rechts', zeige: 'stellungen' });
  const st = k.alle(el, 'figure.stellung');
  assert.deepEqual(st.map((f) => k.text(f.querySelector('figcaption'))), ['Stellung 1', 'Stellung 2', 'Stellung 3', 'Stellung 4']);
  const zellen = new Set();
  st.forEach((f) => k.alle(f, 'td.loch').forEach((td) => zellen.add(td.getAttribute('data-zelle'))));
  assert.equal(zellen.size, 16);
});
test('schaubild: Liste mit Nummern und Pfeilen, Angreifer/CA markiert, Lücken als Chips in der Liste (E27)', () => {
  const { k, el, gaps } = bau({ t: 'schaubild', titel: 'Digitale Signatur', akteure: [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }, { id: 'M', name: 'Mallory', art: 'angreifer' }, { id: 'CA', name: 'Zertifizierungsstelle', art: 'ca' }], schritte: [{ nr: 1, von: 'A', an: 'A', text: 'bildet den Hashwert h(m)' }, { nr: 2, von: 'A', an: 'A', text: 'verschlüsselt h(m) mit [[s1]]' }, { nr: 3, von: 'A', an: 'B', text: 'sendet m und s' }] });
  const li = k.alle(el, 'ol.schaubild-liste li');
  assert.equal(k.text(li[2]), '③ Alice → Bob: sendet m und s');
  assert.match(k.text(li[0]), /^① Alice: bildet/);
  assert.ok(li[1].contains(gaps.s1), 'Lücke als Chip in der Liste');
  assert.ok(k.eins(el, 'ol.schaubild-liste').classList.contains('sichtbar'));
  assert.ok(k.eins(el, 'svg .akteur-angreifer') && k.eins(el, 'svg .akteur-ca'));
  assert.equal(k.eins(el, 'svg.schaubild-svg').getAttribute('aria-hidden'), 'true');
});
