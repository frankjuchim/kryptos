#!/usr/bin/env node
'use strict';
/*
 * Sperrliste der Schlüsselwörter für das Werkzeug „Polybios & Playfair“ (M10-Review, Fund 1): Kein Schüler soll im freien
 * Kryptolabor ein Quadrat aufbauen können, das in einer Aufgabe, einer Akte, einem Boss, einer Warm-up-Karte oder einem
 * Video vorkommt – sonst rechnete das Werkzeug die Lösung vor (z. B. RIALTO + wasserweg).
 *
 * Gesammelt werden aus Seeds (Welten mit Bossen, Gast-Demo, Akten-Verzeichnis, Warm-up), Materialquellen und Videos:
 *  - Zeichenketten-Felder schluessel/schluesselwort/oben/unten (nur Buchstaben, ≥ 3),
 *  - 5 × 5-Gitter (Feld zellen, Zeilen aus je fünf Buchstaben) → ihr Schlüsselwort (kürzester Anfang, nach dem der Rest
 *    des Quadrats alphabetisch folgt),
 *  - Wörter nach „Schlüsselwort“, „Quadrat“, „Kennwort“, „Schlüssel“ (GROSS oder markiert mit ** ` „ ").
 * Gespeichert wird je Quadrat das kürzeste Schlüsselwort (gleiches Quadrat = gleicher Eintrag); Wörter, deren Quadrat das
 * Standardquadrat ist oder deren kürzestes Schlüsselwort unter 3 Buchstaben hat, entfallen (Standardquadrat bleibt frei).
 *
 * Aufruf: node werkzeuge/krypto/quadrat_sperre.js            schreibt die Liste in public/static/js/krypto/labor/quadrat.js
 *         node werkzeuge/krypto/quadrat_sperre.js --pruefen  Exit 1, wenn die Liste veraltet ist
 */
const fs = require('node:fs');
const path = require('node:path');
const Krypto = require('../../public/static/js/shared/krypto.js');

const WURZEL = path.join(__dirname, '..', '..');
const MODUL = path.join(WURZEL, 'public', 'static', 'js', 'krypto', 'labor', 'quadrat.js');
const START = '// SPERRLISTE-START (erzeugt: node werkzeuge/krypto/quadrat_sperre.js – nicht von Hand ändern)';
const ENDE = '// SPERRLISTE-ENDE';

const jsonDateien = (ordner, re = /\.json$/) =>
  fs.existsSync(ordner) ? fs.readdirSync(ordner, { recursive: true }).filter((f) => re.test(f)).map((f) => path.join(ordner, f)) : [];

/** Quellen wie im Beispieltext-Test (test/labor_regeln.test.js) */
function quellen() {
  const SEED = path.join(WURZEL, 'seed');
  return [
    ...jsonDateien(path.join(SEED, 'welten')),
    path.join(SEED, 'gast', 'demo.json'),
    path.join(SEED, 'akten.json'),
    ...jsonDateien(path.join(SEED, 'warmup')),
    ...jsonDateien(path.join(WURZEL, 'quellen', 'material')),
    ...jsonDateien(path.join(WURZEL, 'materialien', 'Videos'), /video\.json$/)
  ].filter((d) => fs.existsSync(d));
}

const STANDARD = Krypto.quadrat('').join('');
const quadratVon = (w) => {
  try {
    return Krypto.quadrat(w).join('');
  } catch {
    return null;
  }
};

/** kürzestes Schlüsselwort eines Quadrats (25 Zeichen): Anfang, nach dem der Rest alphabetisch folgt */
function schluesselVon(q) {
  for (let n = 0; n <= 25; n++) if (quadratVon(q.slice(0, n)) === q) return q.slice(0, n);
  return q;
}

const NUR = (s) => (typeof s === 'string' && /^[A-Za-zÄÖÜäöüß]{3,25}$/.test(s.trim()) ? s.trim() : null);
const NACH_WORT = /(?:Schlüsselworts?|Schlüsselwörter|Kennworts?|Quadrats?|Playfair-Quadrats?|Polybios-Quadrats?|Schlüssels?)\s*(?::\s*)?(\*\*|`|„|")?([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]{2,24})/g;

/** → Set der Kandidaten-Wörter aus einem JSON-Wert */
function sammle(x, ziel) {
  if (typeof x === 'string') {
    for (const m of x.matchAll(NACH_WORT)) if (m[1] || m[2] === m[2].toUpperCase()) ziel.add(m[2]);
  } else if (Array.isArray(x)) {
    // 5 × 5-Gitter: fünf Zeilen aus je fünf Buchstaben (auch Listen von Zellen)
    const zeilen = x.map((z) => (Array.isArray(z) ? z.join('') : z));
    if (zeilen.length === 5 && zeilen.every((z) => typeof z === 'string' && /^[A-Z]{5}$/.test(z.replace(/\s+/g, '')))) {
      const q = zeilen.join('').replace(/\s+/g, '');
      if (new Set(q).size === 25) ziel.add({ quadrat: q });
    }
    for (const e of x) sammle(e, ziel);
  } else if (x && typeof x === 'object') {
    for (const [k, e] of Object.entries(x)) {
      if (/^(schluessel|schluesselwort|oben|unten|wort)$/.test(k) && NUR(e)) ziel.add(NUR(e));
      sammle(e, ziel);
    }
  }
}

/** → sortierte Liste kürzester Schlüsselwörter (GROSS), ohne Standardquadrat */
function sperrliste(dateien = quellen()) {
  const roh = new Set();
  for (const d of dateien) sammle(JSON.parse(fs.readFileSync(d, 'utf8')), roh);
  const nachQuadrat = new Map();
  for (const r of roh) {
    const q = typeof r === 'string' ? quadratVon(r) : r.quadrat;
    if (!q || q === STANDARD) continue;
    if (!nachQuadrat.has(q)) nachQuadrat.set(q, schluesselVon(q));
  }
  // Schlüssel unter 3 Buchstaben ergeben fast das Standardquadrat (z. B. „Schlüssel D“ einer Caesar-Aufgabe) – kein Fund
  return [...new Set(nachQuadrat.values())].filter((k) => k.length >= 3).sort();
}

/** Liste aus quadrat.js lesen */
function gespeichert(src = fs.readFileSync(MODUL, 'utf8')) {
  const a = src.indexOf(START);
  const b = src.indexOf(ENDE, a);
  if (a < 0 || b < 0) return null;
  const m = /'([A-Z ]*)'/.exec(src.slice(a, b));
  return m ? m[1].split(' ').filter(Boolean) : [];
}

function block(liste) {
  return `${START}\n  const GESPERRT = '${liste.join(' ')}'.split(' ');\n  ${ENDE}`;
}

if (require.main === module) {
  const liste = sperrliste();
  const src = fs.readFileSync(MODUL, 'utf8');
  const alt = gespeichert(src);
  if (process.argv.includes('--pruefen')) {
    const ok = alt && alt.join(' ') === liste.join(' ');
    console.log(ok ? `Sperrliste aktuell (${liste.length} Schlüsselwörter).` : 'Sperrliste veraltet – node werkzeuge/krypto/quadrat_sperre.js ausführen.');
    process.exit(ok ? 0 : 1);
  }
  const a = src.indexOf(START);
  const b = src.indexOf(ENDE, a);
  if (a < 0 || b < 0) throw new Error(`Marken ${START} … ${ENDE} fehlen in quadrat.js`);
  fs.writeFileSync(MODUL, src.slice(0, a) + block(liste).trimStart().replace(/^/, '') + src.slice(b + ENDE.length));
  console.log(`Sperrliste geschrieben: ${liste.length} Schlüsselwörter.`);
}

module.exports = { sperrliste, gespeichert, quellen, schluesselVon, START, ENDE };
