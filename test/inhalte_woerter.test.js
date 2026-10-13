'use strict';
// Generator-Wortlisten W0–W2 (Plan M5 Task 90, E46 „Regel vor Beispiel“): kein Generator-Wort kommt in Lab, Akten,
// Bossen, Warm-up, Präsentationen, Funkraum-Material, Gast-Demo oder Videos vor. Wörter mit ≥ 4 Buchstaben dürfen in
// keinem Wort des Korpus als Teilfolge stehen, Wörter mit 3 Buchstaben nicht als ganzes Wort. Dazu Mindestgrößen,
// Längen, keine Doppelten, nur a–z (bzw. A–Z). Wird ein Wort durch spätere Inhalte verboten, schlägt der Test an.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');
const W = require('../src/krypto/generatoren/woerter');

const R = S.WURZEL;
const norm = (t) => String(t).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dateien = (ordner, re) => (fs.existsSync(ordner) ? fs.readdirSync(ordner).filter((f) => re.test(f)).map((f) => path.join(ordner, f)) : []);

/** Korpus: alle Zeichenketten der Inhalte und Materialquellen (ohne Lehrerhinweise), normalisiert, als Wortmenge. */
function korpus() {
  const liste = [
    ...dateien(path.join(R, 'seed', 'welten'), /\.json$/),
    ...dateien(path.join(R, 'seed', 'warmup'), /\.json$/),
    path.join(R, 'seed', 'gast', 'demo.json'),
    path.join(R, 'test', 'e2e', 'seed', 'gast', 'demo.json'),
    path.join(R, 'quellen', 'pruefwerte', 'videos.json')
  ];
  const mat = path.join(R, 'quellen', 'material');
  for (const w of fs.readdirSync(mat).filter((x) => /^W\d$/.test(x))) liste.push(...dateien(path.join(mat, w), /^(akte|boss|warmup|praesentation|funkraum)_.*\.json$/));
  const vid = path.join(R, 'materialien', 'Videos');
  for (const v of fs.readdirSync(vid)) {
    const p = path.join(vid, v, 'video.json');
    if (fs.existsSync(p)) liste.push(p);
  }
  const woerter = new Set();
  let n = 0;
  for (const p of liste) {
    if (!fs.existsSync(p)) continue;
    n++;
    for (const t of norm(S.texte(json(p))).match(/[a-z]+/g) || []) woerter.add(t);
  }
  return { woerter, gross: [...woerter].join(' '), dateien: n };
}

const K = korpus();
const verboten = (w) => (w.length <= 3 ? K.woerter.has(w) : K.gross.includes(w));

/** Schlüssel der Seeds (verfahren.schluessel, schluesselwort) – Schlüssel- und Koinzidenzlisten zusätzlich dagegen. */
function seedSchluessel() {
  const out = new Set();
  const lauf = (x) => {
    if (Array.isArray(x)) return x.forEach(lauf);
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) {
      if ((k === 'schluessel' || k === 'schluesselwort') && typeof v === 'string') out.add(norm(v).replace(/[^a-z]/g, ''));
      else lauf(v);
    }
  };
  for (const p of dateien(path.join(R, 'seed', 'welten'), /\.json$/)) lauf(json(p));
  return out;
}

const LISTEN = {
  WOERTER_ANTIKE: { min: 60, laenge: [3, 12], klein: true },
  WOERTER_BAGDAD: { min: 60, laenge: [3, 12], klein: true },
  SCHLUESSELWOERTER_W1: { min: 40, laenge: [4, 12], klein: true, schluessel: true },
  KLARTEXTE_W2: { min: 20, laenge: [5, 12], klein: true },
  SCHLUESSEL_W2: { min: 8, laenge: [2, 5], klein: false, schluessel: true },
  KOINZIDENZ_W2: { min: 5, laenge: [6, 12], klein: false, doppelt: true, schluessel: true },
  PLAYFAIR_W2: { min: 4, laenge: [4, 12], klein: false, schluessel: true }
};

test('Korpus für den Wortlisten-Abgleich ist vollständig (Seeds W0–W2, Warm-up, Material, Videos)', () => {
  assert.ok(K.dateien >= 30, `nur ${K.dateien} Dateien im Korpus`);
  for (const w of ['skytale', 'nachtwache', 'kalif', 'gondel']) assert.ok(K.woerter.has(w), `${w} fehlt im Korpus`);
});

for (const [name, regel] of Object.entries(LISTEN)) {
  test(`${name}: Größe, Länge, Schreibweise, keine Doppelten, kein Wort aus Lab/Akten/Bossen/Warm-up/Videos`, () => {
    const liste = W[name];
    assert.ok(Array.isArray(liste) && Object.isFrozen(liste), `${name} fehlt oder ist nicht eingefroren`);
    assert.ok(liste.length >= regel.min, `${name}: ${liste.length} < ${regel.min} Wörter`);
    assert.equal(new Set(liste).size, liste.length, `${name}: doppelte Wörter`);
    const re = new RegExp(`^${regel.klein ? '[a-z]' : '[A-Z]'}{${regel.laenge[0]},${regel.laenge[1]}}$`);
    const schl = regel.schluessel ? seedSchluessel() : new Set();
    const funde = [];
    for (const w of liste) {
      assert.match(w, re, `${name}: „${w}“`);
      if (regel.doppelt) assert.ok(new Set(w).size < w.length, `${name}: „${w}“ ohne doppelten Buchstaben`);
      const k = w.toLowerCase();
      if (verboten(k)) funde.push(`${k} (Korpus)`);
      if (schl.has(k)) funde.push(`${k} (Seed-Schlüssel)`);
    }
    assert.deepEqual(funde, [], `${name}: verbotene Wörter`);
  });
}
