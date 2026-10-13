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
  [/\b(charCodeAt|fromCharCode|codePointAt|fromCodePoint)\b/, 'Zeichencodes – Krypto.wert/ascii verwenden'],
  [/Math\.(floor|trunc)\([^)]*\/[^)]*\)\s*\*|\*\s*Math\.(floor|trunc)\([^)]*\//, 'Rest von Hand (a − m · ⌊a/m⌋) – Krypto.mod/teileMitRest'],
  [/[\w)\]]\s*(\^|<<|>>>?|~)\s*[\w(]/, 'Bit-Operator – Krypto.xorBits/…'],
  [/[\w)\]]\s*(?<![&|])[&|](?![&|=])\s*[\w(]/, 'Bit-Operator & | – Krypto.undBits/oderBits'],
  [/\*\*|\bMath\.pow\b|\bBigInt\b/, 'Potenz – Krypto.modpow'],
  [/\.toString\(\s*(2|16)\s*\)|parseInt\([^)]*,\s*(2|16)\s*\)/, 'Basiswechsel – Krypto.byteZuBits/hex'],
  [/\b[A-Z][A-Z_]*\.indexOf\(|""\.indexOf/, 'Alphabetposition (ALPHABET/BUCHSTABEN.indexOf) – Krypto.wert'],
  [/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|WebSocket|EventSource)\b|\bimport\s*\(|AQ\.api|document\.cookie/, 'kein Server, keine Speicherung'],
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
  // Review M6: weitere Umgehungen
  assert.equal(treffer('const x = a&b;').length, 1);
  assert.equal(treffer('const x = (a)|0;').length, 1);
  assert.equal(treffer('x &= 1; const y = a&&b || c;').length, 0);
  assert.equal(treffer('const c = String.fromCodePoint(65 + k);').length, 1);
  assert.equal(treffer('const r = a - m * Math.floor(a / m);').length, 1);
  assert.equal(treffer('const r = a - Math.trunc(a / m) * m;').length, 1);
  assert.equal(treffer('const i = ALPHABET.indexOf(b);').length, 1);
  assert.equal(treffer('const i = BUCHSTABEN.indexOf(b);').length, 1);
  assert.equal(treffer('navigator.sendBeacon("/x", d);').length, 1);
  assert.equal(treffer('new WebSocket(u); new EventSource(u);').length, 1);
  assert.equal(treffer('import("./x.js").then(f);').length, 1);
  assert.equal(treffer('const liste = reiter.indexOf(r); Math.floor(n / 2);').length, 0);
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

/** Wörter ≥ 5 Buchstaben (klein) aus einem Text (Review M6: Mindestlänge 5). */
const woerterVon = (s) => String(s).toLowerCase().match(/[a-zäöüß]{5,}/g) || [];
const Krypto = require('../public/static/js/shared/krypto.js');

/**
 * Verbotene Wörter sammeln (Review M6): aus allen Zeichenketten die markierten Stellen – `Code`, **fett**, „zitiert“,
 * "zitiert", GROSSBUCHSTABEN (Geheimtexte, Schlüsselwörter, auch in Fünfergruppen zusammengezogen) – und ganz die
 * Felder interaktion, loesung, titel und mono (Geheimtexte, Lösungen, Akten-/Folientitel, Schreibmaschinentexte).
 */
function sammle(x, ziel, ganz = false) {
  if (typeof x === 'string') {
    if (ganz) for (const w of woerterVon(x)) ziel.add(w);
    for (const m of x.matchAll(/`([^`]+)`|\*\*([^*]+)\*\*|„([^“]+)“|"([^"]+)"/g)) for (const w of woerterVon(m[1] ?? m[2] ?? m[3] ?? m[4])) ziel.add(w);
    for (const m of x.matchAll(/\b[A-ZÄÖÜ]{2,}(?:\s+[A-ZÄÖÜ]{2,})*\b/g)) for (const w of [...woerterVon(m[0]), ...woerterVon(m[0].replace(/\s+/g, ''))]) ziel.add(w);
  } else if (Array.isArray(x)) for (const e of x) sammle(e, ziel, ganz);
  else if (x && typeof x === 'object') for (const [k, e] of Object.entries(x)) sammle(e, ziel, ganz || ['interaktion', 'loesung', 'titel', 'mono'].includes(k));
}
const jsonDateien = (ordner, re = /\.json$/) => (fs.existsSync(ordner) ? fs.readdirSync(ordner, { recursive: true }).filter((f) => re.test(f)).map((f) => path.join(ordner, f)) : []);
const WURZEL = path.join(__dirname, '..');
/** Quellen: Seeds (Welten, Gast-Demo, Akten-Verzeichnis, Warm-up), Materialquellen W0–W6/Prüfungen/Videos, Video-Dateien. */
const QUELLEN = () => [
  ...jsonDateien(path.join(SEED, 'welten')),
  path.join(SEED, 'gast', 'demo.json'),
  path.join(SEED, 'akten.json'),
  ...jsonDateien(path.join(SEED, 'warmup')),
  ...jsonDateien(path.join(WURZEL, 'quellen', 'material')),
  ...jsonDateien(path.join(WURZEL, 'materialien', 'Videos'), /video\.json$/)
].filter((d) => fs.existsSync(d));

/**
 * Verdeckte Klartexte verschlüsselter Standardwerte (nur hier, nicht im Werkzeug): die Bibliothek rechnet sie nach, dann
 * gelten für sie dieselben Regeln. Caesar-Geheimtexte (nur GROSSBUCHSTABEN) prüft der Test zusätzlich für alle 26 k.
 */
const VERDECKT = {
  'substitution.js': (b) => {
    const klar = 'der stoepsel huepft quer auf zwoelf kacheln im bad';
    assert.equal(Krypto.substitution(klar, Krypto.schluesselwortAlphabet('wimpel')), Krypto.nurBuchstaben(b.text), 'substitution.js: Beispiel = Bibliothek');
    return [klar, 'wimpel'];
  },
  'bitlupe.js': (b) => {
    const [p1, p2, schluessel] = ['GURKE', 'WOLLE', 'Q7z!p'];
    assert.equal(Krypto.xor(p1, schluessel), b.c1.replace(/\s+/g, ''), 'bitlupe.js: C1 = Bibliothek');
    assert.equal(Krypto.xor(p2, schluessel), b.c2.replace(/\s+/g, ''), 'bitlupe.js: C2 = Bibliothek');
    return [p1, p2];
  }
};

test('Beispieltexte der Werkzeuge kommen nicht aus Seeds, Akten, Warm-up, Materialien oder Videos (auch verschlüsselt)', () => {
  const VIDEO = require('../quellen/pruefwerte/videos.json');
  const verboten = new Set();
  for (const v of VIDEO.werte) for (const w of woerterVon(JSON.stringify([v.eingabe, v.erwartet]))) verboten.add(w);
  const quellen = QUELLEN();
  assert.ok(quellen.length > 40, 'Quellen gefunden');
  for (const d of quellen) sammle(JSON.parse(fs.readFileSync(d, 'utf8')), verboten);
  for (const w of ['papyrus', 'kerze', 'licht', 'hafen']) assert.ok(verboten.has(w), `Selbstprüfung: „${w}“ wird erkannt`);
  assert.ok(verboten.size > 1000, 'Wörter gesammelt');
  for (const f of werkzeugModule()) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const beispiele = [...src.matchAll(/BEISPIEL\w*\s*=\s*(\{[\s\S]*?\});/g)].map((m) => m[1]);
    assert.ok(beispiele.length <= 1, `${f}: Beispieltexte in genau einer Konstante BEISPIEL`);
    for (const b of beispiele) {
      // nur die Werte (String-Literale), nicht die Schlüsselnamen der Konstante
      const werte = [...b.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]);
      const kandidaten = new Map(); // Wort → Herkunft
      for (const t of werte) {
        for (const w of woerterVon(t)) kandidaten.set(w, t);
        if (/^[A-Z ]+$/.test(t) && /[A-Z]{3}/.test(t)) for (let k = 0; k < 26; k++) for (const w of woerterVon(Krypto.caesar(t, k, 'ent'))) kandidaten.set(w, `${t} (Caesar k = ${k})`);
      }
      if (VERDECKT[f]) {
        const objekt = Function(`return (${b});`)();
        for (const t of VERDECKT[f](objekt)) for (const w of woerterVon(t)) kandidaten.set(w, `${t} (verdeckt)`);
      }
      for (const [w, herkunft] of kandidaten) assert.ok(!verboten.has(w), `${f}: Beispielwort „${w}“ aus „${herkunft}“ steht in Seeds/Material/Videos`);
    }
  }
});
