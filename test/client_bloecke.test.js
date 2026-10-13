'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const K = require('../public/static/js/shared/krypto.js');
const SKRIPTE = ['common.js', 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/oberflaeche.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/bloecke.js'];
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
test('haeufigkeit (M6 Task 114): referenzRang – Deutsch sortiert daneben, Spalte „Deutsch (Rang)“; Einheit umschaltbar', () => {
  const text = 'TCHTA TBTCG TNYBM COQCN QHSMN INCYB TMVCT CBMNY BFSTN NTF';
  const gemeldet = [];
  const { k, el } = bau({ t: 'haeufigkeit', quelle: 'text', text, referenz: 'deutsch', sortierung: 'absteigend', referenzRang: true, einheitUmschalter: true, beiAnsicht: (a) => gemeldet.push(a) });
  const tab = k.eins(el, 'table.haeufigkeit-tabelle');
  assert.deepEqual(k.alle(tab, 'thead th').map(k.text), ['Buchstabe', 'Anzahl', 'Prozent', 'Deutsch %', 'Deutsch (Rang)']);
  const rangDeutsch = Object.keys(K.DEUTSCH).sort((a, b) => K.DEUTSCH[b] - K.DEUTSCH[a] || a.localeCompare(b));
  assert.deepEqual(k.alle(tab, 'td.deutsch-rang').map((z) => k.text(z).slice(0, 1)), rangDeutsch);
  assert.match(k.text(k.eins(tab, 'td.deutsch-rang')), /^E 17,40$/);
  // Referenzbalken in Rang-Reihenfolge (Slot i = i-häufigster deutscher Buchstabe)
  assert.deepEqual(k.alle(el, 'svg rect.balken-deutsch').map((r) => r.getAttribute('data-buchstabe')), rangDeutsch);
  // alphabetisch: Referenz wieder je Buchstabe, Rang-Spalte = deutscher Buchstabe gleichen Rangs
  k.klick(k.eins(el, 'button[data-sortierung="alphabetisch"]'));
  assert.equal(k.alle(el, 'svg rect.balken-deutsch')[0].getAttribute('data-buchstabe'), 'A');
  const zeileT = k.alle(tab, 'tbody tr').find((z) => k.text(z.querySelector('th')) === 'T');
  assert.equal(k.text(zeileT.querySelector('td.deutsch-rang')).slice(0, 1), 'E', 'T ist im Text am häufigsten');
  // Einheit: absolut ↔ relativ (aria-pressed), Rückmeldung an das Werkzeug
  const rel = k.eins(el, 'button[data-einheit="relativ"]');
  assert.equal(k.eins(el, 'button[data-einheit="absolut"]').getAttribute('aria-pressed'), 'true');
  const hoeheT = () => Number(k.alle(el, 'svg rect.balken').find((r) => r.getAttribute('data-buchstabe') === 'T').getAttribute('height'));
  const vorher = hoeheT();
  k.klick(rel);
  assert.equal(rel.getAttribute('aria-pressed'), 'true');
  assert.ok(Math.abs(hoeheT() - vorher) < 0.01, 'gleiche Skala, nur andere Einheit');
  assert.deepEqual(k.roh(gemeldet), [{ sortierung: 'alphabetisch', einheit: 'absolut' }, { sortierung: 'alphabetisch', einheit: 'relativ' }]);
  // ohne die Optionen: keine Rang-Spalte, keine Einheit-Knöpfe (Lab-Blöcke unverändert)
  const ohne = bau({ t: 'haeufigkeit', quelle: 'text', text, referenz: 'deutsch' });
  assert.equal(ohne.el.querySelectorAll('td.deutsch-rang, button[data-einheit]').length, 0);
});
test('bits:Gruppen à 4, ⊕-Trennzeile, Lückenzeile, markierte Spalten, Screenreader-Text', () => {
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
test('werkzeug: Karte öffnet Dialog mit Fokusfalle; Boss rendert nichts; gesperrt mit Grund', () => {
  let { k, el } = bau({ t: 'werkzeug', id: 'haeufigkeit', titel: 'Zähle im Häufigkeits-Analysator', voreinstellung: { text: 'ABC' } });
  k.klick(k.eins(el, 'button.werkzeug-oeffnen'));
  const d = k.eins(k.document, 'dialog.werkzeug-dialog');
  assert.equal(d.hasAttribute('open'), true);
  assert.match(k.text(d), /Häufigkeits-Analysator/);
  assert.match(k.text(d), /Wird geladen/, 'Modul wird nachgeladen (M6 E72)');
  assert.ok(k.skripte.some((x) => /\/krypto\/labor\/bausteine\.js/.test(x)), 'erst die Bausteine, dann das Modul');
  k.taste(d, 'Escape');
  assert.equal(d.hasAttribute('open'), false);
  assert.equal(k.wert('AQR').block({ t: 'werkzeug', id: 'scheibe' }, 0, { modus: 'boss' }), null);
  ({ k, el } = bau({ t: 'werkzeug', id: 'scheibe' }, { werkzeugFrei: () => false }));
  assert.ok(el.classList.contains('gesperrt'));
  assert.equal(k.eins(el, 'button.werkzeug-oeffnen').disabled, true);
  assert.match(k.text(el), /Deine Lehrkraft schaltet dieses Werkzeug später frei/);
});

test('werkzeug: Block reicht ctx.laborUmgebung und Voreinstellung an KRLabor.dialog weiter (M6 Task 110)', () => {
  const { k, el } = bau({ t: 'werkzeug', id: 'vigenere', voreinstellung: { reiter: ['quadrat'] } }, { laborUmgebung: { rolle: 'schueler', niveau: 'gA', welten: [0, 1, 2] } });
  k.wert('globalThis.__dialog = []; KRLabor.dialog = (id, v, u) => { __dialog.push([id, v, u]); };');
  k.klick(k.eins(el, 'button.werkzeug-oeffnen'));
  assert.deepEqual(k.roh(k.wert('__dialog')), [['vigenere', { reiter: ['quadrat'] }, { modus: 'lab', rolle: 'schueler', niveau: 'gA', welten: [0, 1, 2] }]]);
});
test('Geheimtext-Zeile mit Markierungen: mark.markiert, Art als Klasse, Beschreibung über aria-describedby (M6 E86)', () => {
  const k = D.lade(SKRIPTE);
  const el = k.wert('KRB').geheimtext('AVEEDYAAFGXVEE', { markiert: [{ von: 3, laenge: 4, art: 'a' }, { von: 11, laenge: 3, art: 'a' }] });
  k.document.body.appendChild(el);
  const marken = k.alle(el, 'mark.markiert');
  assert.deepEqual(marken.map(k.text), ['ED', 'YA', 'VEE'], 'Markierung über eine Gruppengrenze wird geteilt');
  assert.ok(marken.every((m) => m.classList.contains('art-a')));
  assert.deepEqual(k.alle(el, 'span.gruppe').map((g) => g.textContent), ['AVEED', 'YAAFG', 'XVEE'], 'Gruppen bleiben');
  const id = el.getAttribute('aria-describedby');
  assert.ok(id);
  assert.match(k.text(k.document.getElementById(id)), /Markiert: Position 3 bis 6, Position 11 bis 13/);
});
