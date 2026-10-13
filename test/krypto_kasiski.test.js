'use strict';
// Review M6 W6: Krypto.kasiski war quadratisch in der Folgenlänge (2000 × „A“ ≈ 1,9 s). Der neue Algorithmus erweitert
// Positionsgruppen ohne Teilzeichenketten und speichert nur maximale Gruppen – Ergebnis unverändert (Vergleich mit der
// bisherigen Fassung hier im Test, Spec-Vektoren in krypto.test.js, Zwilling in krypto_zwilling.test.js).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const K = require('../public/static/js/shared/krypto.js');

/** Bisherige Fassung (bis 0.3.0) als Referenz: Gruppen gleicher Folgen je Länge, danach Filter „maximal“. */
function kasiskiAlt(text, { min = 3, anzahl = 30 } = {}) {
  const t = K.nurBuchstaben(text);
  const n = t.length;
  const gruppen = [];
  let L = min;
  let aktuell = new Map();
  for (let i = 0; i + L <= n; i++) {
    const f = t.slice(i, i + L);
    if (!aktuell.has(f)) aktuell.set(f, []);
    aktuell.get(f).push(i);
  }
  while (L <= Math.floor(n / 2)) {
    const wiederholt = [...aktuell.values()].filter((p) => p.length >= 2);
    if (wiederholt.length === 0) break;
    for (const p of wiederholt) gruppen.push({ laenge: L, positionen: p });
    const naechste = new Map();
    for (const p of wiederholt) for (const i of p) {
      if (i + L + 1 > n) continue;
      const f = t.slice(i, i + L + 1);
      if (!naechste.has(f)) naechste.set(f, []);
      naechste.get(f).push(i);
    }
    aktuell = naechste;
    L++;
  }
  const maximal = gruppen.filter(({ laenge, positionen: p }) => {
    const rechts = p.every((i) => i + laenge < n && t[i + laenge] === t[p[0] + laenge]);
    const links = p.every((i) => i > 0 && t[i - 1] === t[p[0] - 1]);
    return !rechts && !links;
  });
  maximal.sort((a, b) => b.laenge - a.laenge || b.positionen.length - a.positionen.length || a.positionen[0] - b.positionen[0]);
  const wiederholungen = maximal.slice(0, anzahl).map(({ laenge, positionen }) => ({ folge: t.slice(positionen[0], positionen[0] + laenge), positionen: positionen.slice() }));
  const abstaende = [];
  const paare = [];
  for (const w of wiederholungen) {
    const l = w.folge.length;
    for (let i = 1; i < w.positionen.length; i++) {
      const a = w.positionen[i - 1];
      const d = w.positionen[i] - a;
      if (!paare.some((q) => q.d === d && q.a <= a && a + l <= q.ende)) {
        abstaende.push(d);
        paare.push({ a, ende: a + l, d });
      }
    }
  }
  return { wiederholungen, abstaende };
}

function zufallsgenerator(saat) {
  let x = saat >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

test('kasiski: dieselben Wiederholungen und Abstände wie die bisherige Fassung (zufällige, periodische, Vigenère-Texte)', () => {
  const z = zufallsgenerator(20261013);
  const text = (n, alphabet) => Array.from({ length: n }, () => alphabet[Math.floor(z() * alphabet.length)]).join('');
  const faelle = ['', 'ABCABCABC', 'AAAAAAAAAA', 'ABABABABAB', 'ABCDABCDXABCD', 'A'.repeat(120), 'KRYPTOS'.repeat(30)];
  for (let i = 0; i < 300; i++) {
    const n = 1 + Math.floor(z() * 260);
    faelle.push(text(n, i % 3 === 0 ? 'AB' : i % 3 === 1 ? 'ABCD' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  }
  for (let i = 0; i < 40; i++) faelle.push(K.vigenere(text(200, 'EEEENNNIIRSAT HDUL'), text(2 + (i % 6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')));
  for (const t of faelle) {
    for (const o of [{}, { min: 4, anzahl: 5 }, { min: 6, anzahl: 40 }]) {
      const r = K.kasiski(t, o);
      const neu = { wiederholungen: r.wiederholungen.map(({ folge, positionen }) => ({ folge, positionen })), abstaende: r.abstaende };
      assert.deepEqual(neu, kasiskiAlt(t, o), `${t.slice(0, 40)}… ${JSON.stringify(o)}`);
    }
  }
});

test('kasiski: 3000 Zeichen periodisch in unter 200 ms', () => {
  for (const t of ['A'.repeat(3000), 'KRYPTOS'.repeat(429), K.vigenere('dieleuchtturmwaerterinzaehltdiesterne'.repeat(82), 'MOND')]) {
    K.kasiski(t.slice(0, 300)); // Aufwärmen
    let ms = Infinity;
    let r = null;
    for (let i = 0; i < 3; i++) {
      // bester von drei Läufen (npm test läuft parallel)
      const t0 = process.hrtime.bigint();
      r = K.kasiski(t);
      ms = Math.min(ms, Number(process.hrtime.bigint() - t0) / 1e6);
    }
    assert.ok(ms < 200, `${t.slice(0, 10)}…: ${ms.toFixed(0)} ms`);
    assert.ok(r.wiederholungen.length > 0);
  }
});
