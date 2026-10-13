'use strict';
// Rechenregel des Kryptolabors (Plan M6, Orchestrator): Werkzeug-Module rechnen nur über Krypto.*, speichern nichts,
// fragen keinen Server; Beispieltexte stammen nicht aus Videos, Seeds oder der Gast-Demo.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DIR = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor');
const SEED = path.join(__dirname, '..', 'seed');
const RAHMEN = new Set(['registry.js', 'seite.js', 'bausteine.js']);
const werkzeugModule = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && !RAHMEN.has(f));

/** Kommentare und Text in String-/Template-Literalen entfernen, ${…}-Ausdrücke behalten. */
function ohneTexte(src) {
  let aus = '';
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === '"' || c === "'") { const q = c; i++; while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1; i++; aus += '""'; continue; }
    if (c === '`') {
      i++; aus += '`';
      while (i < src.length && src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { let tiefe = 1; i += 2; const start = i; while (tiefe) { if (src[i] === '{') tiefe++; else if (src[i] === '}') tiefe--; i++; } aus += '${' + ohneTexte(src.slice(start, i - 1)) + '}'; continue; }
        i++;
      }
      i++; aus += '`'; continue;
    }
    aus += c; i++;
  }
  return aus;
}
const VERBOTEN = [
  [/%/, 'Rest-Operator – Krypto.mod verwenden'],
  [/\b(charCodeAt|fromCharCode|codePointAt)\b/, 'Zeichencodes – Krypto.wert/ascii verwenden'],
  [/[\w)\]]\s*(\^|<<|>>>?|~)\s*[\w(]/, 'Bit-Operator – Krypto.xorBits/…'],
  [/[\w)\]] [&|] [\w(]/, 'Bit-Operator & | – Krypto.undBits/oderBits'],
  [/\*\*|\bMath\.pow\b|\bBigInt\b/, 'Potenz – Krypto.modpow'],
  [/\.toString\(\s*(2|16)\s*\)|parseInt\([^)]*,\s*(2|16)\s*\)/, 'Basiswechsel – Krypto.byteZuBits/hex'],
  [/ALPHABET\.indexOf|""\.indexOf/, 'Alphabetposition – Krypto.wert'],
  [/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB)\b|AQ\.api|document\.cookie/, 'kein Server, keine Speicherung'],
  [/innerHTML|outerHTML|insertAdjacentHTML|document\.write/, 'CSP']
];

test('Regeltest-Selbstprüfung: ohneTexte und Muster erkennen Verstöße, Texte bleiben unberührt', () => {
  const treffer = (src) => VERBOTEN.filter(([m]) => ohneTexte(src).split('\n').some((z) => m.test(z))).map(([, g]) => g);
  assert.deepEqual(treffer("const a = 'mod 26 % ok'; // 5 % 3\n/* x ^ y */ const t = `k = ${k}`;"), []);
  assert.equal(treffer('const r = a % 26;').length, 1);
  assert.equal(treffer('const c = s.charCodeAt(0);').length, 1);
  assert.equal(treffer('const x = a ^ b;').length, 1);
  assert.equal(treffer('const x = a & b;').length, 1);
  assert.equal(treffer('const ok = a && b || c;').length, 0);
  assert.equal(treffer('const p = 2 ** 8;').length, 1);
  assert.equal(treffer('const t = `${n.toString(2)}`;').length, 1);
  assert.equal(treffer('localStorage.setItem("x", 1);').length, 1);
});

test('Rechenregel: kein Werkzeug rechnet selbst (M6, Orchestrator)', () => {
  for (const f of werkzeugModule()) {
    const src = ohneTexte(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const [muster, grund] of VERBOTEN) {
      // E80: einzige Ausnahme – Math.pow für die sRGB-Gammakurve in modulo.js, nur in Zeilen mit „srgb“ (Farbmischer)
      const erlaubt = (z) => f === 'modulo.js' && /\bMath\.pow\b/.test(z) && /srgb/i.test(z) && !/\*\*|BigInt/.test(z);
      const treffer = src.split('\n').filter((z) => muster.test(z) && !erlaubt(z));
      assert.deepEqual(treffer, [], `${f}: ${grund}`);
    }
    assert.match(src, /\bKrypto\./, `${f}: rechnet über Krypto.*`);
    assert.match(src, /KRLabor\.registriere\(/, `${f}: registriert sich`);
    assert.doesNotMatch(src, /\b(setInterval)\b/, `${f}: keine eigenen Abspieler (KRLabor.nachspiel)`);
  }
});

/** Wörter ≥ 6 Buchstaben (klein) aus einem Text. */
const woerterVon = (s) => String(s).toLowerCase().match(/[a-zäöüß]{6,}/g) || [];

/**
 * Seed-Wörter sammeln: Backtick-Texte aller Zeichenketten (Lab, Boss, Archivfund) und alle Texte in interaktion und
 * loesung (Geheimtexte, Lösungen).
 */
function sammleSeed(x, ziel, ganz = false) {
  if (typeof x === 'string') {
    if (ganz) for (const w of woerterVon(x)) ziel.add(w);
    for (const m of x.matchAll(/`([^`]+)`/g)) for (const w of woerterVon(m[1])) ziel.add(w);
  } else if (Array.isArray(x)) for (const e of x) sammleSeed(e, ziel, ganz);
  else if (x && typeof x === 'object') for (const [k, e] of Object.entries(x)) sammleSeed(e, ziel, ganz || k === 'interaktion' || k === 'loesung');
}

test('Beispieltexte der Werkzeuge kommen nicht aus Videos, Seeds oder Gast-Demo', () => {
  const VIDEO = require('../quellen/pruefwerte/videos.json');
  const video = new Set();
  for (const v of VIDEO.werte) for (const w of woerterVon(JSON.stringify([v.eingabe, v.erwartet]))) video.add(w);
  const seed = new Set();
  const dateien = [
    ...fs.readdirSync(path.join(SEED, 'welten')).filter((d) => d.endsWith('.json')).map((d) => path.join(SEED, 'welten', d)),
    path.join(SEED, 'gast', 'demo.json')
  ].filter((d) => fs.existsSync(d));
  for (const d of dateien) sammleSeed(JSON.parse(fs.readFileSync(d, 'utf8')), seed);
  assert.ok(seed.size > 20, 'Seed-Wörter gesammelt');
  for (const f of werkzeugModule()) {
    const beispiele = [...fs.readFileSync(path.join(DIR, f), 'utf8').matchAll(/BEISPIEL\w*\s*=\s*(\{[\s\S]*?\});/g)].map((m) => m[1]);
    assert.ok(beispiele.length <= 1, `${f}: Beispieltexte in genau einer Konstante BEISPIEL`);
    for (const b of beispiele) {
      // nur die Werte (String-Literale), nicht die Schlüsselnamen der Konstante
      const werte = [...b.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]).join(' ');
      for (const w of woerterVon(werte)) {
        assert.ok(!video.has(w), `${f}: Beispielwort „${w}“ stammt aus einem Video`);
        assert.ok(!seed.has(w), `${f}: Beispielwort „${w}“ steht in einem Seed (Lab/Boss/Gast)`);
      }
    }
  }
});
