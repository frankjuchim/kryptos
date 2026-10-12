#!/usr/bin/env node
// Vergleich shared/krypto.js ↔ Python-Zwilling werkzeuge/krypto/krypto.py (TECHNIK §5.3, Plan Task 17).
// Je Funktion feste Grenzfälle (leerer Text, k = 0/25/26/−1, „AAAA“, ungerade Playfair-Länge, Doppelbuchstaben, XX,
// unvollständige Matrizen, Umfang > Textlänge …) und Zufallsfälle aus mulberry32(Seed) mit gültigen und ungültigen
// Parametern. JS wird direkt gerufen, Python über EINEN Prozess `python3 -I bruecke.py` (JSON-Zeilen).
// Aufruf: node werkzeuge/krypto/vergleich.js [--anzahl N] [--seed S] [--nur name,name]
// Exit-Code 1 bei Abweichung (erstes Gegenbeispiel wird ausgegeben).
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const K = require('../../public/static/js/shared/krypto.js');

// ───────────────────────────── Aufrufparameter ─────────────────────────────
const argv = process.argv.slice(2);
const option = (name, standard) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : standard;
};
const ANZAHL = Number(option('anzahl', '2000'));
const SEED = Number(option('seed', String(Math.floor(Math.random() * 2 ** 32)))) >>> 0;
const NUR = option('nur', '') ? option('nur', '').split(',') : null;
const ALLE = argv.includes('--alle'); // erstes Gegenbeispiel je Funktion ausgeben
if (!Number.isInteger(ANZAHL) || ANZAHL < 1) {
  console.error('--anzahl muss eine positive ganze Zahl sein');
  process.exit(2);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const zufall = mulberry32(SEED);
const ganz = (min, max) => min + Math.floor(zufall() * (max - min + 1));
const wahl = (liste) => liste[ganz(0, liste.length - 1)];
const selten = (p = 0.1) => zufall() < p;

// ───────────────────────────── Bausteine für Zufallsfälle ─────────────────────────────
const GROSS = K.ALPHABET;
const ZEICHEN = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüßÄÖÜẞéèçñÉ  ,.!?-–\n0123456789';
const WOERTER = ['der', 'die', 'das', 'und', 'nachricht', 'hafen', 'schiff', 'morgen', 'abend', 'kurier', 'brief', 'treffen',
  'galeere', 'venedig', 'gesandte', 'wache', 'tor', 'turm', 'brücke', 'straße', 'über', 'öffnen', 'geheim', 'funk', 'die', 'der'];
function text(max = 300, vorrat = ZEICHEN) {
  let s = '';
  const n = ganz(0, max);
  for (let i = 0; i < n; i++) s += vorrat[ganz(0, vorrat.length - 1)];
  if (selten(0.05)) s += 'ü'; // zerlegtes ü (NFC)
  return s;
}
function deutsch(maxWoerter = 50) {
  const n = ganz(0, maxWoerter);
  const w = [];
  for (let i = 0; i < n; i++) w.push(wahl(WOERTER));
  return w.join(' ');
}
const buchstaben = (min, max) => {
  let s = '';
  const n = ganz(min, max);
  for (let i = 0; i < n; i++) s += GROSS[ganz(0, 25)];
  return s;
};
const asciiText = (max = 40) => text(max, ' !"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~');
const textOderDeutsch = (max = 300) => (zufall() < 0.5 ? text(max) : deutsch(max / 6));
const RICHTUNGEN = ['ver', 'ent'];
const richtung = () => (selten(0.03) ? wahl(['quer', '', 'VER']) : wahl(RICHTUNGEN));
const schluesselwort = () =>
  selten(0.1) ? wahl(['', 'AAAA', 'A', '123', 'Ä', 'äöü', 'k a l i f', 'Zwölf']) : zufall() < 0.3 ? buchstaben(1, 8).toLowerCase() : buchstaben(1, 12);
const kWert = () => (selten(0.3) ? wahl([0, 25, 26, -1, 52, -27]) : selten(0.05) ? wahl([1.5, '3', null, true]) : ganz(-60, 60));
const bits = (n) => Array.from({ length: n }, () => ganz(0, 1)).join('');
const mitLeerraum = (s) => s.replace(/(.{4})/g, (m) => m + wahl(['', ' ', ' ', '_', '|', '.', '\n']));
const bytes = (n, min = 0, max = 255) => Array.from({ length: n }, () => ganz(min, max));
const PRIM = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 251, 257, 509, 997, 1009, 2003, 4999, 7919, 9973, 10007];
const GERADE_GROESSEN = [2, 4, 6, 8];

function schablone(n) {
  // je Drehgruppe (Feld im linken oberen Viertel) eine zufällige Stellung → gültige Schablone
  const h = n / 2;
  const liste = [];
  for (let z = 1; z <= h; z++) {
    for (let s = 1; s <= h; s++) {
      let [a, b] = [z, s];
      for (let r = ganz(0, 3); r > 0; r--) [a, b] = [b, n + 1 - a];
      liste.push([a, b]);
    }
  }
  return liste;
}
function schabloneVielleicht(n) {
  const s = schablone(n);
  if (selten(0.15)) s[ganz(0, s.length - 1)] = [ganz(0, n + 1), ganz(0, n + 1)];
  if (selten(0.05)) s.pop();
  return s;
}
const quadrat36 = () =>
  wahl([buchstaben(0, 8) + ganz(0, 99), 'ZEPPELIN18', 'ZEPLIN18ABCDFGHJKMOQRSTUVWXY02345679', K.quadrat(buchstaben(2, 6) + '7', { groesse: 6 }).join(''), K.quadrat('FERNSPRECHER9', { groesse: 6 })]);
const spaltenSchluessel = (min = 1, max = 9) => {
  if (zufall() < 0.25) {
    const n = ganz(min, max);
    const p = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) {
      const j = ganz(0, i);
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (selten(0.1)) p[0] = p.length > 1 ? p[1] : 0;
    return p;
  }
  return selten(0.05) ? wahl(['', 'AAAA', 'ANNA', '12']) : buchstaben(min, max);
};
const fuell = () => (selten(0.1) ? wahl(['1', 'XY', '', 'j', 5]) : wahl(['X', 'Q', 'Z', 'x', null]));
const zahlenschluessel = () =>
  selten(0.1) ? wahl(['', '35', '3a', [1, 7], [], '3 1']) : zufall() < 0.3 ? bytes(ganz(1, 6), 0, 4) : bytes(ganz(1, 6), 0, 4).join('');

// Verfahrens-Objekte (Delta §6) und Baukasten-Verfahren (TECHNIK §9.2)
const STUFENTYPEN = ['caesar', 'substitution', 'vigenere', 'spaltentransposition', 'gartenzaun', 'blockrotation', 'umkehrung', 'xor'];
function stufe(typ, zuletzt) {
  if (typ === 'xor' && !zuletzt && !selten(0.1)) typ = 'umkehrung';
  const param = {};
  if (typ === 'caesar') param.k = selten(0.1) ? wahl([26, -1, 1.5]) : ganz(0, 25);
  if (typ === 'substitution') param.schluesselwort = selten(0.05) ? wahl(['', 'ÄBC', 'A'.repeat(27)]) : buchstaben(1, 12);
  if (typ === 'vigenere' || typ === 'xor') param.schluessel = selten(0.05) ? wahl(['', 'A'.repeat(21), 'AB1']) : selten(0.1) ? 'A'.repeat(ganz(1, 4)) : buchstaben(1, 12);
  if (typ === 'spaltentransposition') param.schluessel = selten(0.05) ? wahl(['A', 'ABCDEFGHIJK']) : selten(0.1) ? 'ABCDE' : buchstaben(2, 10);
  if (typ === 'gartenzaun') param.zeilen = selten(0.05) ? wahl([1, 7]) : ganz(2, 6);
  if (typ === 'blockrotation') {
    param.block = selten(0.05) ? wahl([1, 10]) : ganz(2, 9);
    param.um = selten(0.05) ? wahl([0, param.block]) : ganz(1, Math.max(1, param.block - 1));
  }
  if (selten(0.03)) param.unbekannt = 1;
  return typ === 'umkehrung' && !selten(0.1) ? { typ } : { typ, param };
}
function baukastenVerfahren() {
  const n = selten(0.05) ? wahl([0, 5]) : ganz(1, 4);
  const stufen = [];
  for (let j = 0; j < n; j++) stufen.push(stufe(wahl(STUFENTYPEN), j === n - 1));
  const schluessel = {};
  // Platzhalter: einen Parameter in den geheimen Schlüssel verschieben
  for (const st of stufen) {
    if (st.param && zufall() < 0.4) {
      const name = Object.keys(st.param)[0];
      if (!name) continue;
      const ph = selten(0.05) ? 'K' : wahl(['wort', 'k', 'zahl2', 'x']);
      schluessel[ph] = st.param[name];
      st.param[name] = `$${ph}`;
    }
  }
  if (selten(0.05)) schluessel.unbenutzt = 3;
  const v = { version: selten(0.03) ? 2 : 1, stufen };
  if (zufall() < 0.3) v.name = selten(0.1) ? wahl(['x'.repeat(41), '<b>']) : wahl(['Die Zickzack-Lawine', 'Funkgitter 2', 'A']);
  return { verfahren: v, schluessel };
}
function verfahrensObjekt() {
  const typ = wahl(['caesar', 'atbash', 'affin', 'substitution', 'vigenere', 'autokey', 'porta', 'playfair', 'kreuzquadrat', 'zweiquadrat_zahl', 'polybios', 'adfgvx', 'gartenzaun', 'skytale', 'fleissner', 'spaltentransposition', 'umkehrung', 'blockrotation', 'xor', 'baukasten', 'frei']);
  const v = { typ };
  const ungueltig = selten(0.12);
  switch (typ) {
    case 'caesar': v.k = ungueltig ? wahl([26, -1, 2.5, '3']) : ganz(0, 25); break;
    case 'affin':
      v.a = ungueltig ? wahl([13, 2, 0]) : wahl([1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]);
      if (zufall() < 0.7) v.b = ganz(0, 25);
      if (zufall() < 0.4) v.basis = ganz(0, 1);
      break;
    case 'substitution':
      if (zufall() < 0.5) v.schluesselwort = buchstaben(1, 10);
      else v.alphabet = ungueltig ? 'ABC' : K.schluesselwortAlphabet(buchstaben(1, 10));
      if (v.schluesselwort && zufall() < 0.4) v.rest = wahl(['alphabetisch', 'ab_letztem']);
      if (ungueltig && v.schluesselwort) v.alphabet = GROSS;
      break;
    case 'vigenere': case 'autokey': case 'porta': v.schluessel = ungueltig ? wahl(['', '123']) : buchstaben(1, 8); break;
    case 'playfair':
      v.schluessel = buchstaben(0, 10);
      if (zufall() < 0.3) v.fuellzeichen = ungueltig ? 'J' : wahl(['X', 'Q', 'Z']);
      if (zufall() < 0.3) v.fuellzeichenX = wahl(['Q', 'Z', 'V']);
      if (zufall() < 0.2) v.ij = wahl(['I', 'J']);
      break;
    case 'kreuzquadrat':
      v.oben = buchstaben(1, 8);
      v.unten = buchstaben(1, 8);
      if (zufall() < 0.3) v.fuellzeichen = ungueltig ? '1' : wahl(['X', 'Q']);
      break;
    case 'zweiquadrat_zahl': v.q1 = buchstaben(1, 8); v.q2 = buchstaben(1, 8); v.zahlenschluessel = ungueltig ? '3152' : zahlenschluessel(); break;
    case 'polybios':
      if (zufall() < 0.5) v.schluessel = buchstaben(0, 8);
      if (zufall() < 0.5) v.kopf = ungueltig ? '1234' : wahl(['12345', 'ADFGX', 'ADFGVX', '123456']);
      break;
    case 'adfgvx': v.quadrat = ungueltig ? 'ZEPPELIN18' : K.quadrat(buchstaben(0, 8) + ganz(0, 99), { groesse: 6 }).join(''); v.schluessel = spaltenSchluessel(1, 8); break;
    case 'gartenzaun': v.zeilen = ungueltig ? wahl([1, 11]) : ganz(2, 10); break;
    case 'skytale': v.umfang = ungueltig ? wahl([1, 21]) : ganz(2, 20); if (zufall() < 0.4) v.fuellzeichen = wahl(['X', 'Q', null]); break;
    case 'fleissner': {
      v.groesse = ungueltig ? 5 : wahl([4, 6, 8]);
      v.schablone = schablone(v.groesse === 5 ? 4 : v.groesse);
      if (zufall() < 0.4) v.drehung = wahl(['rechts', 'links']);
      break;
    }
    case 'spaltentransposition': v.schluessel = spaltenSchluessel(1, 9); if (zufall() < 0.3) v.fuellzeichen = wahl(['X', 'Q']); break;
    case 'blockrotation': v.block = ganz(2, 16); v.um = ungueltig ? 0 : ganz(1, v.block - 1); break;
    case 'xor':
      if (zufall() < 0.6) v.schluessel = ungueltig ? '' : asciiText(6) || 'K';
      else v.schluesselBits = ungueltig ? '0100' : mitLeerraum(bits(8 * ganz(1, 3)));
      break;
    case 'baukasten': { const b = baukastenVerfahren(); v.verfahren = b.verfahren; v.schluessel = b.schluessel; break; }
    case 'frei': if (zufall() < 0.5) v.name = 'domino'; break;
    default:
  }
  if (selten(0.03)) v.zusatz = 1;
  return v;
}

// ───────────────────────────── Fälle je Funktion ─────────────────────────────
// Jeder Eintrag: feste Grenzfälle (Liste von Argumentlisten) und ein Zufallsgenerator.
const FAELLE = {
  mod: { fest: [[-6, 26], [26, 26], [0, 1], [3, 0], [1.5, 26], [-26, 26]], zufall: () => [ganz(-1000, 1000), selten() ? wahl([0, -3, 1.5]) : ganz(1, 60)] },
  wert: { fest: [['A'], ['z', 0], ['AB'], ['1'], [''], ['ä']], zufall: () => [selten() ? wahl(['AB', '1', '', 'ä', ' ']) : wahl([...GROSS, ...GROSS.toLowerCase()]), ...(zufall() < 0.5 ? [ganz(-2, 2)] : [])] },
  buchstabe: { fest: [[26, 1], [0, 1], [27], [0, 0], [26, 0], [-1, 1], [1.5]], zufall: () => [ganz(-100, 100), ...(zufall() < 0.5 ? [ganz(0, 1)] : [])] },
  verschiebung: { fest: [['A'], ['L'], ['z'], ['AA']], zufall: () => [wahl([...GROSS, 'q', 'ä', 'AB'])] },
  normalisieren: { fest: [[''], ['Treffpunkt am Hafen!'], ['Café – 12 Uhr', { ziffern: false }], ['ÄÖÜẞ äöüß'], ['Grüße'], [null], [42]], zufall: () => [text(), ...(zufall() < 0.4 ? [{ ziffern: zufall() < 0.5 }] : [])] },
  nurBuchstaben: { fest: [[''], ['1234 !?'], [42]], zufall: () => [text()] },
  normBits: { fest: [['0100 0001'], [' 01_00|00.01\n'], ['0102'], ['']], zufall: () => [mitLeerraum(bits(ganz(0, 32))) + (selten() ? '2' : '')] },
  gruppieren: { fest: [['ABCDEFGHIJKL'], ['ABCDE FGHIJ KL'], ['ABCDEF', 2, '·'], ['', 5], ['ABC', 0]], zufall: () => [text(60), ganz(-1, 8), wahl([' ', '·', '-', ''])] },
  klein: { fest: [['GEHEIMBOTSCHAFT'], ['']], zufall: () => [text(60, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabc ÄÖÜ,.')] },
  zahlen: { fest: [['Abz'], ['ABZ', 0], ['']], zufall: () => [text(60), ...(zufall() < 0.5 ? [ganz(0, 1)] : [])] },
  ausZahlen: { fest: [[[1, 2, 26]], [[0, 27, 52]], [[0, 1, 25], 0], [[1.5]], [[]]], zufall: () => [selten() ? [1, 'A'] : bytes(ganz(0, 20), 0, 80).map((x) => x - 20), ...(zufall() < 0.5 ? [ganz(0, 1)] : [])] },
  caesar: {
    fest: [['ABC', 0], ['ABC', 26], ['ABC', -1], ['ABC', 25], ['', 5], ['Grüße!', 1], ['ABC', 1.5], ['ABC', '3'], ['ABC', 3, 'rueck']],
    zufall: () => [textOderDeutsch(), kWert(), richtung()],
  },
  alleCaesar: { fest: [[''], ['GTVAMPTVAX']], zufall: () => [text(40)] },
  atbash: { fest: [['']], zufall: () => [text()] },
  affin: {
    fest: [['dattel', 5, 6], ['VGXXAJ', 5, 6, 'ent'], ['A', 2, 0], ['A', 13], ['A', 5, 6, 'ver', 2], ['A', 5, 0.5], ['', 3], ['dattel', 5, 6, 'ver', 1], ['dinar', -1, 9]],
    zufall: () => [textOderDeutsch(), selten() ? wahl([1.5, '5']) : ganz(-30, 60), ganz(-5, 40), richtung(), selten(0.05) ? 2 : ganz(0, 1)],
  },
  affinSchluesselGueltig: { fest: [[13], [2], [0], [1.5], [27], [-1], ['5'], [null]], zufall: () => [ganz(-60, 60)] },
  schluesselwortAlphabet: {
    fest: [['SCHERAZADE'], ['KALIF', { rest: 'ab_letztem' }], ['', {}], ['', { rest: 'ab_letztem' }], ['AAAA'], ['ANNA', { rest: 'ab_letztem' }], ['Zwölf'], ['KALIF', { rest: 'rueckwaerts' }], [42]],
    zufall: () => [schluesselwort(), ...(zufall() < 0.6 ? [{ rest: selten(0.05) ? 'x' : wahl(['alphabetisch', 'ab_letztem']) }] : [])],
  },
  substitution: {
    fest: [['', K.schluesselwortAlphabet('KALIF')], ['abc', 'ABC'], ['abc', 'A'.repeat(26)], ['abc', K.schluesselwortAlphabet('KALIF').toLowerCase()]],
    zufall: () => {
      let a = K.schluesselwortAlphabet(buchstaben(0, 12), { rest: wahl(['alphabetisch', 'ab_letztem']) });
      if (selten()) a = wahl([a.slice(1), a.slice(0, 25) + a[0], a.toLowerCase(), a.slice(0, 13) + ' ' + a.slice(13), 'ÄBCDEFGHIJKLMNOPQRSTUVWXYZ']);
      return [textOderDeutsch(), a, richtung()];
    },
  },
  umkehrAlphabet: { fest: [[GROSS], ['ABCDEFGHIJKLMNOPQRSTUVWXYY']], zufall: () => [selten() ? 'ABC' : K.schluesselwortAlphabet(buchstaben(0, 12))] },
  vigenere: { fest: [['abc', 'A'], ['abc', 'AAAA'], ['', 'KEY'], ['a b-c!', 'b'], ['aaa', 'Ä'], ['abc', ''], ['abc', '123'], ['abc', null], ['abc', 'KEY', 'zurueck']], zufall: () => [textOderDeutsch(), schluesselwort(), richtung()] },
  autokey: { fest: [['ALVEHRA', 'ZU', 'ent'], ['', 'ZU'], ['abc', 'AAAA'], ['abc', '']], zufall: () => [textOderDeutsch(), schluesselwort(), richtung()] },
  porta: { fest: [['a', 'A'], ['a', 'C'], ['', 'LUNA'], ['abc', ''], ['abc', 'KEY', 'quer']], zufall: () => [textOderDeutsch(), schluesselwort(), richtung()] },
  quadrat: {
    fest: [[], [''], ['RIALTO'], ['JOJO'], ['', { ij: 'J' }], ['ZEPPELIN18', { groesse: 6 }], ['ABC', { groesse: 4 }], ['ABC', { ij: 'K' }], [['ABCDE', 'FGHIK', 'LMNOP', 'QRSTU', 'VWXYZ']], ['RIALTOBCDEFGHKMNPQSUVWXYZ']],
    zufall: () => [selten() ? text(30) : buchstaben(0, 12) + (selten() ? '42' : ''), { groesse: selten(0.05) ? 7 : wahl([5, 6]), ij: selten(0.05) ? 'K' : wahl(['I', 'J']) }],
  },
  playfairPaare: {
    fest: [['ballett'], ['kaffee'], ['jagd'], [''], ['a'], ['xx'], ['abx'], ['aaa'], ['aab', { fuellzeichen: 'Q', fuellzeichenX: 'Z' }], ['abc', { fuellzeichen: 'XY' }], ['abc', { fuellzeichen: 'X', fuellzeichenX: 'X' }], ['abc', { fuellzeichen: 'J' }], ['iiij', { ij: 'J' }], ['xxqq', { fuellzeichen: 'Q', fuellzeichenX: 'X' }]],
    zufall: () => [selten(0.3) ? wahl(['x', 'xx', 'xxx', 'qq', 'aabb', 'jij']) + text(20) : textOderDeutsch(100), ...(zufall() < 0.4 ? [{ fuellzeichen: fuell() ?? 'X', fuellzeichenX: wahl(['Q', 'Z', 'X']), ij: wahl(['I', 'J']) }] : [])],
  },
  playfair: {
    fest: [['', 'RIALTO'], ['xx', 'RIALTO'], ['XQXQ', 'RIALTO'], ['abc', 'RIALTO'], ['ABC', 'RIALTO', 'ent'], ['AABB', 'RIALTO', 'ent'], ['ab', 'RIALTO', 'seitwaerts'], ['HU', 'RIALTOBCDEFGHKMNPQSUVWXYZ'], ['jagd', 'RIALTO']],
    zufall: () => {
      const s = selten() ? '' : buchstaben(0, 10);
      const opt = zufall() < 0.3 ? [{ fuellzeichen: wahl(['X', 'Q', 'Z']), fuellzeichenX: wahl(['Q', 'V']), ij: wahl(['I', 'J']) }] : [];
      if (zufall() < 0.5) return [textOderDeutsch(), s, 'ver', ...opt];
      const g = zufall() < 0.7 ? K.playfair(textOderDeutsch(), s, 'ver', ...opt) : buchstaben(0, 20);
      return [g, s, 'ent', ...opt];
    },
  },
  kreuzquadrat: {
    fest: [['', 'GONDEL', 'MURANO'], ['m', 'GONDEL', 'MURANO'], ['m', 'GONDEL', 'MURANO', 'ver', { fuellzeichen: 'Q' }], ['ja', 'GONDEL', 'MURANO'], ['ABC', 'GONDEL', 'MURANO', 'ent'], ['ab', 'GONDEL', 'MURANO', 'ver', { fuellzeichen: '1' }], ['ab', 'GONDEL', 'MURANO', 'ver', { fuellzeichen: 'J' }], ['FBNSROBNCM', 'GONDEL', 'MURANO', 'ent']],
    zufall: () => [zufall() < 0.5 ? textOderDeutsch() : buchstaben(0, 30), buchstaben(0, 8), buchstaben(0, 8), richtung(), ...(zufall() < 0.3 ? [{ fuellzeichen: fuell() ?? 'X' }] : [])],
  },
  zweiQuadratZahl: {
    fest: [['', 'BRIEFTAUBE', 'KOMPASS', '3142'], ['anna', 'BRIEFTAUBE', 'KOMPASS', [2, 2, 2, 2]], ['abc', 'B', 'K', '35'], ['abc', 'B', 'K', ''], ['abc', 'B', 'K', '3a'], ['abc', 'B', 'K', [1, 7]], ['jagd', 'B', 'K', '0']],
    zufall: () => [textOderDeutsch(), buchstaben(0, 10), buchstaben(0, 10), zahlenschluessel(), richtung()],
  },
  polybios: {
    fest: [[''], ['j'], ['Café – 12'], ['123', {}, 'ent'], ['16', {}, 'ent'], ['ab', { kopf: '1234' }], ['ab', { kopf: '11234' }], ['ab', {}, 'quer'], ['33 15 43 44 34 42', {}, 'ent'], ['AAGXFD', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }, 'ent'], ['nebel4', { schluessel: 'ZEPPELIN18', kopf: 'ADFGVX' }], ['adfgx', { kopf: 'adfgx' }, 'ent']],
    zufall: () => {
      const opt = { schluessel: buchstaben(0, 8) + (selten(0.3) ? ganz(0, 99) : ''), kopf: selten(0.05) ? wahl(['1234', '11234', 'ABCDEFG']) : wahl(['12345', 'ADFGX', 'ADFGVX', '123456', 'abcde']), ij: wahl(['I', 'J']) };
      if (zufall() < 0.5) return [text(), opt, 'ver'];
      let g = selten() ? text(20, '1234567ADFGVX ') : K.polybios(text(80), opt, 'ver');
      if (zufall() < 0.3) g = g.replace(/(..)/g, '$1 ');
      return [g, opt, 'ent'];
    },
  },
  adfgvx: {
    fest: [['', 'ZEPPELIN18', 'KARL'], ['a', 'ZEPPELIN18', 'KARLSRUHE'], ['FD', 'ZEPPELIN18', 'KARLSRUHE', 'ent'], ['nebel4', 'ZEPPELIN18', 'AAAA'], ['nebel4', 'ZEPPELIN18', [1, 2, 3, 4]], ['abc', 'ZEPPELIN18', [1, 1, 2]], ['abc', 'ZEPPELIN18', ''], ['ADF', 'ZEPPELIN18', 'KARL', 'ent'], ['ADFB', 'ZEPPELIN18', 'KARL', 'ent'], ['nebel4', K.quadrat('ZEPPELIN18', { groesse: 6 }), 'KARL'], ['abc', 42, 'KARL']],
    zufall: () => {
      const q = quadrat36();
      const s = spaltenSchluessel(1, 9);
      if (zufall() < 0.5) return [text(), q, s, 'ver'];
      let g;
      try {
        g = selten() ? buchstaben(0, 9) : K.adfgvx(text(100), q, s);
      } catch {
        g = text(20, 'ADFGVX');
      }
      return [g, q, s, 'ent'];
    },
  },
  gartenzaun: {
    fest: [['', 3], ['abc', 5], ['ABC', 5, 'ent'], ['abcdef', 6], ['abc', 1], ['abc', 3, 'quer'], ['abc', 2.5]],
    zufall: () => [textOderDeutsch(), selten() ? wahl([0, 1, -2, 2.5]) : ganz(2, 15), richtung()],
  },
  skytale: {
    fest: [['', 3], ['', 3, 'ent'], ['abc', 5], ['ABCXX', 5, 'ent'], ['abcdefg', 3, 'ver', { fuellzeichen: 'Q' }], ['wir halten den pass', 3, 'ver', { fuellzeichen: null }], ['WTPIEARNSHDSAELN', 3, 'ent', { fuellzeichen: null }], ['abcde', 4, 'ver', { fuellzeichen: null }], ['ACEBD', 4, 'ent', { fuellzeichen: null }], ['ABCDE', 3, 'ent'], ['abc', 1], ['abc', 2.5], ['abc', 3, 'ver', { fuellzeichen: '1' }]],
    zufall: () => [zufall() < 0.5 ? textOderDeutsch() : buchstaben(0, 40), selten() ? wahl([0, 1, 2.5]) : ganz(2, 30), richtung(), ...(zufall() < 0.5 ? [{ fuellzeichen: fuell() }] : [])],
  },
  fleissner: {
    fest: [['', 4, [[1, 3], [2, 2], [3, 1], [4, 4]]], ['a', 4, [[1, 3], [2, 2], [3, 1], [4, 4]]], ['abc', 4, [[1, 1], [1, 4], [2, 2], [3, 3]]], ['abc', 4, [[1, 3], [2, 2], [3, 1], [4, 4]], 'ver', { drehung: 'oben' }], ['ABC', 4, [[1, 3], [2, 2], [3, 1], [4, 4]], 'ent'], ['abc', 5, [[1, 3], [2, 2], [3, 1], [4, 4]]], ['athen sendet hilfe', 4, [[1, 3], [2, 2], [3, 1], [4, 4]], 'ver', { drehung: 'links' }]],
    zufall: () => {
      const n = selten(0.05) ? wahl([3, 5, 0]) : wahl(GERADE_GROESSEN);
      const s = schabloneVielleicht(n % 2 ? n + 1 : Math.max(n, 2));
      const t = zufall() < 0.6 ? textOderDeutsch(120) : buchstaben(0, 3) + 'A'.repeat(n * n * ganz(0, 3));
      return [t, n, s, richtung(), ...(zufall() < 0.5 ? [{ drehung: selten(0.05) ? 'oben' : wahl(['rechts', 'links']), fuellzeichen: wahl(['X', 'Q']) }] : [])];
    },
  },
  schablonePruefen: {
    fest: [[4, [[1, 1], [1, 4], [2, 2], [3, 3]]], [4, [[1, 3], [2, 2], [3, 1], [4, 4]]], [4, [[1, 1], [1, 2], [1, 3]]], [4, [[0, 1], [1, 2], [1, 3], [2, 2]]], [5, []], [2, [[1, 1]]], [6, [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 4], [3, 3]]]],
    zufall: () => {
      const n = wahl(GERADE_GROESSEN);
      if (zufall() < 0.5) return [n, schabloneVielleicht(n)];
      return [n, Array.from({ length: n * n / 4 }, () => [ganz(1, n), ganz(1, n)])];
    },
  },
  spaltenReihenfolge: { fest: [['ANNA'], ['KARL'], ['TAL'], ['funke'], ['AAAA'], [[3, 1, 2]], [''], [[1, 1, 2]], [[0, 1]], [[]]], zufall: () => [spaltenSchluessel(1, 12)] },
  spaltentransposition: {
    fest: [['', 'TAL'], ['', 'TAL', 'ent'], ['ab', 'KARLSRUHE'], ['BA', 'KARLSRUHE', 'ent'], ['lochkarten', [3, 1, 2]], ['lochkarten', 'TAL', 'ver', { fuellzeichen: 'X' }], ['OKTXCAEXLHRN', 'TAL', 'ent'], ['abc', ''], ['abc', 'TAL', 'ver', { fuellzeichen: '1' }], ['OKTCAELHRN', 'TAL', 'ent', { fuellzeichen: 'X' }]],
    zufall: () => [zufall() < 0.5 ? textOderDeutsch() : buchstaben(0, 40), spaltenSchluessel(1, 12), richtung(), ...(zufall() < 0.4 ? [{ fuellzeichen: fuell() }] : [])],
  },
  umkehrung: { fest: [[''], ['Grüße']], zufall: () => [text()] },
  blockrotation: {
    fest: [['', 4, 1], ['abc', 5, 2], ['abcdefg', 3, 2, 'ent'], [[1, 2, 3, 4, 5], 2, 1], [[2, 1, 4, 3, 5], 2, 1, 'ent'], ['abc', 1, 1], ['abc', 3, 1.5], [[1, 300], 2, 1], ['anderquelle', 4, 4]],
    zufall: () => [zufall() < 0.7 ? textOderDeutsch(100) : bytes(ganz(0, 30)), selten() ? wahl([0, 1, 2.5]) : ganz(2, 20), ganz(-10, 25), richtung()],
  },
  ascii: { fest: [['A'], [' '], ['~'], ['ä'], ['AB'], ['\n'], ['']], zufall: () => [selten(0.2) ? wahl(['ä', 'AB', '\t', '\u007f', '']) : String.fromCharCode(ganz(32, 126))] },
  zeichenAusAscii: { fest: [[82], [127], [31], [32], [126], [65.5]], zufall: () => [ganz(20, 140)] },
  textZuBytes: { fest: [['OK ok'], ['Grüße'], ['']], zufall: () => [selten() ? 'äb' : asciiText()] },
  bytesZuText: { fest: [[[79, 75]], [[200]], [[]], [[31]]], zufall: () => [bytes(ganz(0, 20), selten(0.2) ? 0 : 32, selten(0.2) ? 255 : 126)] },
  byteZuBits: { fest: [[65], [5, 4], [256], [-1], [0, 1], [65535, 16]], zufall: () => [ganz(-5, 300), ...(zufall() < 0.5 ? [ganz(1, 16)] : [])] },
  bitsZuByte: { fest: [['0100 0001'], ['0102'], [''], ['1'], ['11111111']], zufall: () => [mitLeerraum(bits(ganz(1, 8))) + (selten(0.05) ? '2' : '')] },
  textZuBits: { fest: [['OK'], ['OK', { gruppe: 8 }], ['OK', { gruppe: 0 }], [''], ['ä'], ['OK', { gruppe: -1 }]], zufall: () => [asciiText(20), ...(zufall() < 0.6 ? [{ gruppe: ganz(0, 9) }] : [])] },
  bitsZuText: { fest: [['0100 1111 0100 1011'], ['0100 111'], [''], ['00000000']], zufall: () => [selten() ? bits(ganz(0, 30)) : mitLeerraum(K.textZuBits(asciiText(10), { gruppe: 0 }))] },
  xorBits: {
    fest: [['0100 1111', '1010 0110'], ['1100', '1010', '0110'], ['0101', '011'], ['0102', '0110'], ['', '']],
    zufall: () => {
      const n = ganz(0, 24);
      const liste = [mitLeerraum(bits(n)), mitLeerraum(bits(selten() ? n + 1 : n))];
      if (zufall() < 0.3) liste.push(bits(n));
      return liste;
    },
  },
  undBits: { fest: [['1100', '1010'], ['1', '10']], zufall: () => { const n = ganz(0, 16); return [bits(n), bits(selten() ? n + 1 : n)]; } },
  oderBits: { fest: [['1100', '1010'], ['1', '10']], zufall: () => { const n = ganz(0, 16); return [bits(n), bits(selten() ? n + 1 : n)]; } },
  xor: {
    fest: [['FUNK', 'AB'], ['07 17 0F 09', 'AB', 'ent'], ['', 'AB'], ['', 'AB', 'ent'], ['ABC', ''], ['ABC', []], ['Grüße', 'A'], ['00', 'A', 'ent'], ['41', 'A', 'ent'], ['4', 'A', 'ent'], ['OST', [166, 92, 240]]],
    zufall: () => {
      const k = zufall() < 0.6 ? asciiText(8) || 'K' : bytes(ganz(0, 5));
      if (zufall() < 0.5) return [zufall() < 0.7 ? asciiText(40) : bytes(ganz(0, 10)), k, 'ver'];
      let g;
      try {
        g = K.xor(asciiText(30), selten() ? 'A' : k);
      } catch {
        g = '00';
      }
      if (zufall() < 0.3) g = g.toLowerCase().replace(/(..)/g, '$1 ');
      return [selten() ? bytes(4) : g, k, 'ent'];
    },
  },
  hex: { fest: [[[7, 23, 15, 9]], [0x4f4b], [0x0202], [65536], [[256]], [[]], [-1]], zufall: () => [zufall() < 0.5 ? bytes(ganz(0, 10)) : ganz(-5, 70000)] },
  vonHex: { fest: [['07 17 0f 09'], ['0G'], ['071'], ['']], zufall: () => [selten() ? wahl(['0G', '071', 'xyz']) : mitLeerraum(K.hex(bytes(ganz(0, 8)))).replace(/[_|.]/g, ' ')] },
  rotiereBits: { fest: [['0100 0011', 1], ['10000110', -1], ['1011', 4], ['', 3], ['0102', 1]], zufall: () => [mitLeerraum(bits(ganz(0, 20))).replace(/[_|.]/g, ''), ganz(-20, 20)] },
  'kryptos16.rundenschluessel': { fest: [[0xa36d, 1], [0xa36d, 5], [0x10000, 1], [1, 0], [0x7777, 2]], zufall: () => [selten() ? wahl([-1, 65536, 1.5]) : ganz(0, 65535), ganz(selten() ? -1 : 1, 10)] },
  'kryptos16.sbox': { fest: [[0xecc6], [0xdb38, 'ent'], [0x10000]], zufall: () => [ganz(0, 65535), ...(zufall() < 0.6 ? [richtung()] : [])] },
  'kryptos16.transponiere': { fest: [[0xdb38], [0xf000], [-1]], zufall: () => [ganz(0, 65535)] },
  'kryptos16.runde': { fest: [[0x4f4b, 0xa36d], [0xd86e, 0xa36d, 'ent']], zufall: () => [ganz(0, 65535), ganz(0, 65535), ...(zufall() < 0.6 ? [richtung()] : [])] },
  'kryptos16.verschluesseln': {
    fest: [[0x4f4b, 0xa36d], [0x4f4b, 0xa36d, { runden: 2, protokoll: true }], [0x10000, 1], [1, 1, { runden: 0 }]],
    zufall: () => [ganz(0, 65535), ganz(0, 65535), ...(zufall() < 0.7 ? [{ runden: selten(0.05) ? 0 : ganz(1, 8), protokoll: zufall() < 0.3 }] : [])],
  },
  'kryptos16.entschluesseln': { fest: [[0xf5f8, 0xa36d], [1, 1, { runden: 0 }]], zufall: () => [ganz(0, 65535), ganz(0, 65535), ...(zufall() < 0.7 ? [{ runden: ganz(1, 8) }] : [])] },
  'kryptos16.lawine': { fest: [[0x4f4b, 0xa36d, 16], [0x4a41, 0x5c9e, 16], [0x4f4b, 0xa36d, 16, { runden: 1 }], [0, 0, 17], [0, 0, 0]], zufall: () => [ganz(0, 65535), ganz(0, 65535), ganz(selten() ? 0 : 1, selten() ? 17 : 16), ...(zufall() < 0.5 ? [{ runden: ganz(1, 6) }] : [])] },
  'kryptos16.modus': {
    fest: [[[0x4a41, 0x4a41], 0x5c9e, 'ECB', null, { runden: 1 }], [[0x4a41, 0x4a41], 0x5c9e, 'CBC', 0x30c3, { runden: 1 }], [[1], 1, 'CBC'], [[1], 1, 'OFB', 0], [[], 1, 'ECB'], [[], 1, 'CBC', 5]],
    zufall: () => [bytes(ganz(0, 6), 0, 65535), ganz(0, 65535), selten(0.05) ? 'OFB' : wahl(['ECB', 'CBC']), selten(0.1) ? null : ganz(0, 65535), { richtung: wahl(RICHTUNGEN), runden: ganz(1, 6) }],
  },
  'kryptos16.textZuBloecken': { fest: [['OST'], ['JA'], [''], ['NEIN'], ['Grüße']], zufall: () => [asciiText(15)] },
  'kryptos16.bloeckeZuText': {
    fest: [[[0x4a41]], [[0x4a41, 0x0203]], [[0x0202]], [[]], [[0x4101]], [[0x0201]]],
    zufall: () => {
      const b = K.kryptos16.textZuBloecken(asciiText(10));
      if (selten(0.3)) b[ganz(0, b.length - 1)] = ganz(0, 65535);
      return [b];
    },
  },
  kryptosHash: { fest: [[''], ['nebel', { protokoll: true }], ['Überweise 2 Euro']], zufall: () => [text(80), ...(zufall() < 0.5 ? [{ protokoll: zufall() < 0.5 }] : [])] },
  'kryptosHash.kollisionSuchen': {
    fest: [['nebel'], ['heute', { alphabet: 'xyz' }], ['heute', { alphabet: 'a', max: 5 }], ['x', { alphabet: '' }], ['i'], ['', { max: 3 }]],
    zufall: () => [selten(0.2) ? wahl(GROSS) : text(20), { max: ganz(0, 400), alphabet: selten(0.2) ? 'abc' : buchstaben(1, 4).toLowerCase() }],
  },
  haeufigkeiten: { fest: [[''], ['Grüße']], zufall: () => [text()] },
  anteile: { fest: [['']], zufall: () => [text()] },
  rangfolge: { fest: [['']], zufall: () => [text()] },
  teiltexte: { fest: [['ABC', 5], ['ABC', 0], ['YLYTXEBYWUTPRP', 3]], zufall: () => [text(), selten() ? wahl([0, -1, 1.5]) : ganz(1, 25)] },
  bigramme: { fest: [['A'], ['AAA'], ['']], zufall: () => [text(), ...(zufall() < 0.6 ? [{ top: ganz(1, 30) }] : [])] },
  koinzidenzindex: { fest: [['A'], [''], ['BALLADE'], ['LAGUNE']], zufall: () => [textOderDeutsch()] },
  friedman: { fest: [['A'], [''], ['AB'], ['ABCDEFGHIJKLMNOPQRSTUVWXYZ'], ['AA']], zufall: () => [textOderDeutsch(), ...(zufall() < 0.3 ? [{ iD: wahl([0.076, 0.0765]), iZ: wahl([0.038, 0.0385]) }] : [])] },
  friedmanWert: {
    fest: [[601, 0.0507], [1001, 0.0475], [1, 0.05], [100, -1], [100, 410 / 9900, { iD: 0.0765, iZ: 0.0385 }], [2, 0]],
    zufall: () => [selten() ? wahl([0, 1, 2.5]) : ganz(2, 2000), selten() ? wahl([-0.1, 1.5, '0,05']) : zufall() * 0.1, ...(zufall() < 0.3 ? [{ iD: 0.0765, iZ: 0.0385 }] : [])],
  },
  kasiski: {
    fest: [['ABCDEFG'], [''], ['ABCABCABC'], ['ABC', { min: 2 }], ['ABC', { min: 7 }], ['AAAAAAAAAA'], ['ABABABABAB'], ['XYZXYZ'], ['ABCDABCDXABCD']],
    zufall: () => {
      const t = zufall() < 0.7 ? K.vigenere(deutsch(60), buchstaben(2, 7)) : zufall() < 0.5 ? text(300, 'ABCD') : text(100);
      return [t, ...(zufall() < 0.4 ? [{ min: selten() ? wahl([2, 7]) : ganz(3, 6), anzahl: ganz(1, 40) }] : [])];
    },
  },
  verschiebungSchaetzen: { fest: [[''], ['E'], ['AB']], zufall: () => [zufall() < 0.5 ? K.caesar(deutsch(30), ganz(0, 25)) : text(80)] },
  chiQuadrat: { fest: [[''], ['EEN']], zufall: () => [textOderDeutsch()] },
  ggT: { fest: [[60, 7], [-12, 18], [0, 0], [1.5, 2]], zufall: () => [ganz(-1000, 1000), ganz(-1000, 1000)] },
  erweiterterEuklid: { fest: [[60, 7], [192, 5], [42, 63], [-3, 5], [0, 0], [5, 0], [0, 5]], zufall: () => [ganz(selten() ? -10 : 0, 2000), ganz(0, 2000)] },
  inverses: { fest: [[7, 60], [2, 26], [-17, 60], [3, 0], [3, 1], [0, 7]], zufall: () => [ganz(-200, 400), selten() ? wahl([0, 1, -5]) : ganz(2, 400)] },
  modpow: {
    fest: [[9, 7, 77], [37, 43, 77, { protokoll: true }], [5, 0, 7], [5, 3, 1], [-2, 3, 7], [2, -1, 7], [2, 3, 0], [123456789, 987654321, 1000000007], [5, 0, 7, { protokoll: true }]],
    zufall: () => [ganz(-500, 5000), selten() ? -1 : ganz(0, 3000), selten() ? wahl([0, -7]) : ganz(2, 100000), ...(zufall() < 0.3 ? [{ protokoll: true }] : [])],
  },
  istPrim: { fest: [[2], [1], [0], [-7], [9999991], [10000000], [2.5]], zufall: () => [selten() ? ganz(9999000, 10000010) : ganz(-5, 20000)] },
  'rsa.schluessel': {
    fest: [[7, 11, 7], [5, 13, 5], [7, 11], [5, 11], [7, 7], [7, 9], [7, 11, 6], [7, 11, 1], [7, 11, 61], [7, 11, null]],
    zufall: () => {
      const p = selten() ? ganz(1, 50) : wahl(PRIM.slice(1, 30));
      const q = selten() ? ganz(1, 50) : wahl(PRIM.slice(1, 30));
      return zufall() < 0.4 ? [p, q] : [p, q, ganz(1, 200)];
    },
  },
  'rsa.verschluesseln': { fest: [[9, 7, 77], [77, 7, 77], [-1, 7, 77]], zufall: () => { const n = ganz(2, 5000); return [ganz(selten() ? -2 : 0, selten() ? n + 2 : n - 1), ganz(0, 500), n]; } },
  'rsa.entschluesseln': { fest: [[37, 43, 77], [-1, 43, 77]], zufall: () => { const n = ganz(2, 5000); return [ganz(selten() ? -2 : 0, selten() ? n + 2 : n - 1), ganz(0, 500), n]; } },
  'dh.oeffentlich': { fest: [[3, 4, 17], [2, 3, 1], [2, -1, 7]], zufall: () => [ganz(-5, 200), ganz(selten() ? -1 : 0, 500), selten() ? ganz(-1, 1) : wahl(PRIM)] },
  'dh.gemeinsam': { fest: [[15, 4, 17], [3, 3, 29]], zufall: () => [ganz(0, 200), ganz(0, 500), selten() ? ganz(-1, 1) : wahl(PRIM)] },
  'dh.dlogKlein': {
    fest: [[3, 13, 17], [3, 12, 17], [2, 3, 7], [2, 3, 10007], [0, 0, 7], [2, 1, 7], [2, 9, 7], [5, 0, 25]],
    zufall: () => { const p = selten() ? ganz(2, 60) : wahl(PRIM.slice(0, 25)); return [ganz(-3, 60), ganz(-2, p + 3), p]; },
  },
  schluesselanzahl: { fest: [[2], [1], [2.5], [30]], zufall: () => [ganz(-2, 200)] },
  'verfahren.pruefe': { fest: [[null], [{ typ: 'enigma' }], [{ typ: 'frei', name: 'domino' }]], zufall: () => [verfahrensObjekt()] },
  'verfahren.anwenden': {
    fest: [[{ typ: 'caesar', k: 3 }, 'W', 'ver', { ausgabe: 'zahlen' }], [{ typ: 'caesar', k: 3 }, 'W', 'ver', { ausgabe: 'zahlen', basis: 0 }], [{ typ: 'frei' }, 'abc', 'ver'], [{ typ: 'caesar', k: 99 }, 'abc', 'ver'], [{ typ: 'caesar', k: 3 }, 'abc', 'ver', { ausgabe: 'roemisch' }], [{ typ: 'xor', schluessel: 'AB' }, 'FUNK', 'ver'], [{ typ: 'xor', schluesselBits: '0100 0001 0100 0010' }, '07170F09', 'ent']],
    zufall: () => {
      const v = verfahrensObjekt();
      const r = wahl(RICHTUNGEN);
      let t = textOderDeutsch(120);
      if (r === 'ent') {
        try {
          t = K.verfahren.anwenden(v, t, 'ver');
        } catch { /* ungültig: Text bleibt */ }
      }
      const zahlenErlaubt = !['polybios', 'adfgvx', 'xor', 'baukasten', 'frei'].includes(v.typ);
      return [v, t, r, ...(zufall() < 0.3 ? [{ ausgabe: zahlenErlaubt && zufall() < 0.7 ? 'zahlen' : 'buchstaben', basis: ganz(0, 1) }] : [])];
    },
  },
  'verfahren.varianten': {
    fest: [[{ typ: 'frei' }, 'abc', 'ver'], [{ typ: 'caesar', k: 6 }, 'treffpunkt', 'ver'], [{ typ: 'caesar', k: 3 }, 'WXY', 'ver', { ausgabe: 'zahlen' }], [{ typ: 'caesar', k: 3 }, 'ABC', 'ent', { ausgabe: 'zahlen' }], [{ typ: 'playfair', schluessel: 'RIALTO' }, 'ballett', 'ver'], [{ typ: 'atbash' }, 'abc', 'ver']],
    zufall: () => {
      let v = verfahrensObjekt();
      if (v.typ === 'frei' && zufall() < 0.8) v = { typ: 'caesar', k: ganz(0, 25) };
      const r = wahl(RICHTUNGEN);
      let t = textOderDeutsch(60);
      if (r === 'ent') {
        try {
          t = K.verfahren.anwenden(v, t, 'ver');
        } catch { /* ungültig */ }
      }
      const zahlenErlaubt = ['caesar', 'vigenere', 'affin', 'atbash', 'autokey', 'substitution'].includes(v.typ);
      return [v, t, r, ...(zahlenErlaubt && zufall() < 0.4 ? [{ ausgabe: 'zahlen', basis: zufall() < 0.8 ? 1 : 0 }] : [])];
    },
  },
  'baukasten.pruefe': {
    fest: [[null, {}], [{ version: 1, stufen: [] }, {}], [{ version: 1, stufen: [{ typ: 'caesar', param: { k: 0 } }] }, {}], [{ version: 1, stufen: [{ typ: 'spaltentransposition', param: { schluessel: 'ABCDE' } }] }, {}, { klartext: 'abc' }], [{ version: 1, stufen: [{ typ: 'xor', param: { schluessel: 'A' } }] }, {}]],
    zufall: () => { const b = baukastenVerfahren(); return [b.verfahren, b.schluessel, ...(zufall() < 0.5 ? [{ klartext: textOderDeutsch(60) }] : [])]; },
  },
  'baukasten.verschluesseln': {
    fest: [[{ version: 1, stufen: [{ typ: 'umkehrung' }, { typ: 'caesar', param: { k: '$k' } }] }, { k: 11 }, 'ab', { protokoll: true }], [{ version: 1, stufen: [{ typ: 'xor', param: { schluessel: 'AB' } }] }, {}, 'FUNK']],
    zufall: () => { const b = baukastenVerfahren(); return [b.verfahren, b.schluessel, textOderDeutsch(120), ...(zufall() < 0.3 ? [{ protokoll: true }] : [])]; },
  },
  'baukasten.entschluesseln': {
    fest: [[{ version: 1, stufen: [{ typ: 'xor', param: { schluessel: 'AB' } }] }, {}, '07 17 0F 09'], [{ version: 1, stufen: [{ typ: 'spaltentransposition', param: { schluessel: 'TAL' } }] }, {}, 'OKTCA ELHRN']],
    zufall: () => {
      const b = baukastenVerfahren();
      let g = buchstaben(0, 30);
      try {
        if (zufall() < 0.8) g = K.baukasten.verschluesseln(b.verfahren, b.schluessel, textOderDeutsch(120)).geheimtext;
      } catch { /* ungültiges Verfahren */ }
      return [b.verfahren, b.schluessel, g];
    },
  },
};

// Vergleich nur über die fachlich festgelegten Teile (TECHNIK §5.2); Rest ist Darstellung (Meldungstexte).
const PROJEKTION = {
  schablonePruefen: (r) => ({ ok: r.ok, abgedeckt: r.abgedeckt }),
  'verfahren.pruefe': (r) => r.ok,
  'baukasten.pruefe': (r) => ({ ok: r.ok, hinweise: r.ok ? [...new Set(r.hinweise.map((h) => String(h.p)))].sort() : [] }),
  verschiebungSchaetzen: (r) => ({ k: r.k, buchstabe: r.buchstabe, werte: r.werte, kandidaten: r.kandidaten.map((c) => ({ k: c.k, wert: c.wert })) }),
};

// ───────────────────────────── Ausführen ─────────────────────────────
function jsAufruf(name, args) {
  const teile = name.split('.');
  let objekt = K;
  for (const t of teile.slice(0, -1)) objekt = objekt[t];
  const f = objekt[teile[teile.length - 1]];
  try {
    const r = f.apply(objekt, args);
    return { ok: true, r: JSON.parse(JSON.stringify({ r })).r ?? null };
  } catch (e) {
    return { ok: false, art: e instanceof K.KryptoFehler ? 'KryptoFehler' : 'intern', fehler: `${e.name}: ${e.message}` };
  }
}

function gleich(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isInteger(a) && Number.isInteger(b)) return a === b;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && gleich(a[k], b[k]));
}

function vergleiche(name, js, py) {
  if (js.ok !== py.ok) return false;
  if (!js.ok) return js.art === 'KryptoFehler' && py.art === 'KryptoFehler';
  const p = PROJEKTION[name] || ((r) => r);
  return gleich(p(js.r), p(py.r));
}

const namen = Object.keys(FAELLE).filter((n) => !NUR || NUR.includes(n));
console.log(`Zwilling-Vergleich: Seed ${SEED}, ${ANZAHL} Zufallsfälle je Funktion, ${namen.length} Funktionen`);

const faelle = [];
for (const name of namen) {
  for (const args of FAELLE[name].fest) faelle.push({ name, args });
  for (let i = 0; i < ANZAHL; i++) {
    // Generatoren, die für den Geheimtext selbst die JS-Bibliothek rufen, können an ungültigen Parametern scheitern
    for (let versuch = 0; versuch < 20; versuch++) {
      try {
        faelle.push({ name, args: FAELLE[name].zufall() });
        break;
      } catch (e) {
        if (!(e instanceof K.KryptoFehler)) throw e;
      }
    }
  }
}
for (const f of faelle) f.js = jsAufruf(f.name, f.args);

const eingabe = faelle.map((f) => JSON.stringify({ f: f.name, args: f.args })).join('\n') + '\n';
const py = spawnSync('python3', ['-I', path.join(__dirname, 'bruecke.py')], { input: eingabe, encoding: 'utf8', maxBuffer: 1 << 30 });
if (py.error || py.status !== 0) {
  console.error('python3 -I bruecke.py ist fehlgeschlagen:', py.error || py.stderr);
  process.exit(2);
}
const zeilen = py.stdout.split('\n').filter((z) => z.trim());
if (zeilen.length !== faelle.length) {
  console.error(`Brücke lieferte ${zeilen.length} statt ${faelle.length} Antworten.`);
  process.exit(2);
}

let abweichungen = 0;
const jeFunktion = {};
const erstesJe = {};
faelle.forEach((f, i) => {
  f.py = JSON.parse(zeilen[i]);
  if (!vergleiche(f.name, f.js, f.py)) {
    abweichungen++;
    jeFunktion[f.name] = (jeFunktion[f.name] || 0) + 1;
    if (!erstesJe[f.name]) erstesJe[f.name] = f;
  }
});
const erstes = Object.values(erstesJe)[0];

if (abweichungen) {
  console.log(`${abweichungen} Abweichungen in ${faelle.length} Fällen (Seed ${SEED}):`);
  for (const [n, a] of Object.entries(jeFunktion)) console.log(`  ${n}: ${a}`);
  const kurz = (x) => {
    const s = JSON.stringify(x);
    return s.length > 2000 ? s.slice(0, 2000) + ' …' : s;
  };
  for (const f of ALLE ? Object.values(erstesJe) : [erstes]) {
    console.log(ALLE ? `Gegenbeispiel ${f.name}:` : 'Erstes Gegenbeispiel:');
    console.log(`  Funktion: ${f.name}`);
    console.log(`  Argumente: ${kurz(f.args)}`);
    console.log(`  JS:     ${kurz(f.js)}`);
    console.log(`  Python: ${kurz(f.py)}`);
  }
  process.exit(1);
}
console.log(`0 Abweichungen in ${faelle.length} Fällen (Seed ${SEED}).`);
