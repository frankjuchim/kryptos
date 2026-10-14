'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../src/krypto').registriere();
const F = require('../src/content/format');
const { validiereWelt } = require('../src/content/validator');
const CHOICE = [{ kind: 'choice', optionen: [{ id: 'a', md: 'a' }, { id: 'b', md: 'b' }] }, { richtig: ['a'] }];
function welt(inhalt, [ia, lo] = CHOICE) {
  return { version: 2, welt: 9, titel: 'Blocktest', farbe: '#5B6B7C', epoche: 'T', jahr: { von: 1, bis: 2, anzeige: '1–2' }, akzentHell: '#C9D3DD',
    levels: [{ id: 'W9-L1', titel: 'L', niveau: 'kern', rolle: 'kryptografie', aufgaben: ['W9-L1-01'] }],
    aufgaben: [{ id: 'W9-L1-01', titel: 'A', stufe: 1, kategorie: 'begriffe', inhalt, interaktion: ia, loesung: lo, erklaerung: [{ t: 'text', md: 'x' }] }] };
}
const meld = (inhalt, il) => { const r = validiereWelt(welt(inhalt, il), { datei: 't' }); return { f: r.fehler.map((x) => x.meldung).join(' | '), w: r.warnungen.map((x) => x.meldung).join(' | ') }; };
const KLAR = 'abcdefghijklmnopqrstuvwxyz';
const GAPS3 = [{ kind: 'gaps', felder: { g1: { typ: 'text', norm: 'krypto' }, g2: { typ: 'text', norm: 'krypto' }, g3: { typ: 'text', norm: 'krypto' } } }, { g1: ['A'], g2: ['B'], g3: ['C'] }];
const ZEILE = [...'DEFGHIJKLMNOPQRSTUVWXYZ', '[[g1]]', '[[g2]]', '[[g3]]'];

test('alphabet: 26 Einträge, basis Pflicht, Lücken, Bijektion als Hinweis', () => {
  assert.equal(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'Klartext', werte: KLAR }, { label: 'Geheimtext', werte: ZEILE }] }], GAPS3).f, '');
  assert.match(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'K', werte: ZEILE.slice(1) }] }], GAPS3).f, /26/);
  assert.match(meld([{ t: 'alphabet', zeilen: [{ label: 'K', werte: KLAR }] }]).f, /basis/);
  assert.match(meld([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'K', werte: KLAR }, { label: 'G', werte: 'ABCDEFGHIJKLMNOPQRSTUVWXYA' }] }]).w, /Bijektion/);
  assert.deepEqual(F.luecken([{ t: 'alphabet', basis: 1, zeilen: [{ label: 'G', werte: ZEILE }] }]).map((l) => l.id), ['g1', 'g2', 'g3']);
});

test('quadrat: Schlüssel ↔ Zellen (Neuberechnung), frei ohne Doppelte, polybios 6×6, vigenere-Ausschnitt', () => {
  const pf = ['ARCHI', 'VBDEF', 'GKLMN', 'OPQST', 'UWXYZ'].map((z) => [...z]);
  assert.equal(meld([{ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', zellen: pf }]).f, '');
  const falsch = pf.map((z) => [...z]); [falsch[0][0], falsch[0][1]] = ['R', 'A'];
  assert.match(meld([{ t: 'quadrat', art: 'playfair', schluessel: 'ARCHIV', zellen: falsch }]).f, /passen nicht zum Schlüssel/);
  const doppelt = pf.map((z) => [...z]); doppelt[4][4] = 'A';
  assert.match(meld([{ t: 'quadrat', art: 'frei', zellen: doppelt }]).f, /doppelt/);
  assert.equal(meld([{ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGVX', schluessel: 'KRYPTOS9' }]).f, '');
  assert.match(meld([{ t: 'quadrat', art: 'polybios', groesse: 6, kopf: 'ADFGV' }]).f, /kopf/);
  assert.equal(meld([{ t: 'quadrat', art: 'vigenere', ausschnitt: ['R', 'O', 'T'], hervorheben: { zeile: 'R', spalte: 'K' } }]).f, '');
  assert.match(meld([{ t: 'quadrat', art: 'playfair', ausschnitt: ['R'] }]).f, /ausschnitt/);
});

test('bits: Längen, Lücke, Neuberechnung pruefe xor', () => {
  const z = (c) => [{ label: 'M', bits: '0100 1011' }, { label: 'K', bits: '0110 1010' }, { trenner: '⊕' }, { label: 'C', bits: c }];
  assert.equal(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('0010 0001') }]).f, '');
  assert.match(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('0010 0011') }]).f, /Neuberechnung: letzte Zeile muss 00100001 sein/);
  assert.match(meld([{ t: 'bits', zeilen: z('0010 001') }]).f, /gleich lang/);
  assert.match(meld([{ t: 'bits', zeilen: z('0010 0021') }]).f, /nur 0 und 1/);
  assert.equal(meld([{ t: 'bits', pruefe: 'xor', zeilen: z('[[c1]]') }], [{ kind: 'gaps', felder: { c1: { typ: 'text', norm: 'bits' } } }, { c1: ['0010 0001'] }]).f, '');
});

test('schaubild: ids, Schrittnummern, Verweise', () => {
  const ak = [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }, { id: 'M', name: 'Mallory', art: 'angreifer' }, { id: 'CA', name: 'Zertifizierungsstelle', art: 'ca' }];
  const sch = [{ nr: 1, von: 'A', an: 'B', text: 'sendet m' }, { nr: 2, von: 'B', an: 'B', text: 'prüft' }];
  assert.equal(meld([{ t: 'schaubild', akteure: ak, schritte: sch }]).f, '');
  assert.match(meld([{ t: 'schaubild', akteure: ak, schritte: [sch[0], { ...sch[1], nr: 3 }] }]).f, /lückenlos/);
  assert.match(meld([{ t: 'schaubild', akteure: ak, schritte: [{ ...sch[0], von: 'E' }] }]).f, /unbekannt/);
  assert.match(meld([{ t: 'schaubild', akteure: [ak[0], { ...ak[1], id: 'A' }], schritte: sch }]).f, /doppelt/);
});

test('matrix: Spaltentransposition und Fleißner (Neuberechnung der Schablone, Löcher ab 1)', () => {
  const sp = { t: 'matrix', kopf: ['T', 'O', 'R'], reihenfolge: true, zeilen: [['t', 'r', 'e'], ['f', 'f', 'p'], ['u', 'n', 'k'], ['t', '', '']], leserichtung: 'spaltenweise' };
  assert.equal(meld([sp]).f, '');
  assert.match(meld([{ ...sp, kopf: ['T', 'O'] }]).f, /kopf/);
  assert.match(meld([{ ...sp, reihenfolge: [1, 1, 2] }]).f, /Permutation/);
  assert.equal(meld([{ t: 'matrix', groesse: 4, schablone: [[1, 1], [1, 2], [2, 1], [2, 2]], zeige: 'stellungen' }]).f, '');
  assert.match(meld([{ t: 'matrix', groesse: 4, schablone: [[1, 1], [2, 3], [3, 2], [4, 4]] }]).f, /mehrfach frei/);
});

test('werkzeug und haeufigkeit', () => {
  assert.equal(meld([{ t: 'werkzeug', id: 'haeufigkeit', voreinstellung: { text: 'ABC', ansicht: 'absteigend' } }]).f, '');
  assert.match(meld([{ t: 'werkzeug', id: 'zauberwuerfel' }]).f, /Werkzeug „zauberwuerfel“ ist unbekannt/); // seit M10 gibt es „enigma“
  assert.match(meld([{ t: 'werkzeug', id: 'scheibe', voreinstellung: { schluessel: 'X' } }]).f, /voreinstellung/);
  assert.match(meld([{ t: 'haeufigkeit', quelle: 'text', text: '1234 !' }]).f, /Buchstaben/);
  assert.match(meld([{ t: 'haeufigkeit', quelle: 'text', text: 'TCHTA TBTCG' }]).w, /P6/);
  assert.match(meld([{ t: 'haeufigkeit', quelle: 'werte', werte: { E: -1 } }]).f, /werte/);
});
