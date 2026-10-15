'use strict';
// K11b (Fix-Runde nach dem M11-Review, Fund 1–3): Der Erkenner darf sich nicht durch abgewandelte Eingaben umgehen lassen.
// Für jeden Verrat-Zustand aus K11 (alle Prüflinge × alle Werkzeug-Modelle) werden die Texte abgewandelt, die das Werkzeug
// beim Rechnen ohnehin entfernt oder angleicht (Ziffern, Satzzeichen, Leerzeichen, Groß/Klein) – der Erkenner muss sie
// trotzdem erkennen. Füllzeichen vorn/hinten und Häppchen (auch über ein Neuladen) folgen in eigenen Tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../werkzeuge/krypto/prueflinge');
const M = require('../werkzeuge/krypto/werkzeug_modelle');
const B = require('../werkzeuge/krypto/erkenner_bauen');
const E = require('../public/static/js/krypto/labor/erkenner.js');

const DATEN = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'erkenner');
const RE_DATEN = /KRErkenner\.daten\('([a-z]+)', (\{[\s\S]*\})\);/;
for (const d of fs.readdirSync(DATEN).filter((f) => f.endsWith('.js'))) {
  const m = RE_DATEN.exec(fs.readFileSync(path.join(DATEN, d), 'utf8'));
  E.daten(m[1], JSON.parse(m[2].replace(/'/g, '"')));
}
const S = { rolle: 'schueler' };

/** Verrat-Zustände (wie K11), je Reiter und Eingabe einmal */
let faelle = null;
function verrat() {
  if (faelle) return faelle;
  const gesehen = new Set();
  faelle = [];
  for (const p of P.prueflinge()) {
    const A = P.angaben(p);
    for (const [wr, m] of Object.entries(M.MODELLE)) {
      for (const z of m.zustaende(A)) {
        if (z.art === 'allgemein' || z.art === 'katalog' || !B.nutztAngaben(z)) continue;
        if (P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr)) continue;
        if (!P.istVerrat(z.ausgaben, p).verrat) continue;
        const e = B.normalisiere(wr, z.eingaben);
        if (!(e.texte || []).length) continue;
        const k = `${wr}|${JSON.stringify(e)}`;
        if (gesehen.has(k)) continue;
        gesehen.add(k);
        faelle.push({ p, wr, e });
      }
    }
  }
  return faelle;
}

// Abwandlungen, die die Werkzeuge beim Rechnen wieder entfernen (Krypto.nurBuchstaben) – nur für reine Buchstabentexte
const nurBuchstabenText = (t) => /^[A-Za-zÄÖÜäöüß ]+$/.test(t);
const ABWANDLUNG = {
  ziffern: (t) => t.replace(/(.{3})/g, '$11'),
  satzzeichen: (t) => t.replace(/(.{2})/g, '$1, '),
  leerzeichen: (t) => [...t.replace(/ /g, '')].join(' '),
  klein: (t) => t.toLowerCase(),
  gemischt: (t) => [...t].map((c, i) => (i % 2 ? c.toLowerCase() : c.toUpperCase())).join('')
};

for (const [name, f] of Object.entries(ABWANDLUNG)) {
  test(`k11b_${name}_wird_erkannt`, () => {
    const fehlt = [];
    for (const { p, wr, e } of verrat()) {
      if (!e.texte.every(nurBuchstabenText)) continue;
      const x = { ...e, texte: e.texte.map(f) };
      if (!E.erkannt(wr, x, S)) fehlt.push(`${p.id} ${wr}: ${JSON.stringify(x.texte).slice(0, 60)}`);
    }
    assert.deepEqual(fehlt.slice(0, 15), [], `${fehlt.length} Abwandlungen unerkannt`);
  });
}

test('review_fund1_beispiele: eingestreute Ziffern umgehen den Erkenner nicht', () => {
  const faelle = [
    ['scheibe.alle', { texte: ['TDAR1NATJ1VWRN1JWBL1QUDN1BBNU1ENAU1XANW'] }, 'W4-A-01'],
    ['skytale.skytale', { texte: ['NUMR1ABOU1CKRE1HOGH1SMEX1CMNX1HTFX'], schluessel: ['u=4'] }, 'W0-L1-04'],
    ['vigenere.verschluesseln', { texte: ['JSAD1VBZA1ERWL'], schluessel: ['ROSA'] }, 'W2-L1-04'],
    ['hash.schritte', { texte: ['tee1'] }, 'W5-L1-02'],
    ['hash.schritte', { texte: ['mwrege1n'] }, 'W5-L1-06']
  ];
  for (const [wr, e, id] of faelle) assert.ok(E.erkannt(wr, e, S), `${id} ${wr} ${e.texte[0]}`);
});
