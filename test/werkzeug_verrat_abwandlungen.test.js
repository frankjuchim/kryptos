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

/* ---------- Review-Fund 3: Häppchen und Teilstücke (auch über ein Neuladen) ---------- */

/** Geheimtexte (nicht Klartexte), die allein – ohne Schlüssel – schon Verrat sind */
function textAllein() {
  return verrat().filter(({ p, e }) => !(e.schluessel || []).length && !(e.bits || []).length && !(e.zahlen || []).length && e.texte.every((t) => !P.angaben(p).klartexte.includes(E.FORM(t)) && /^[A-Z]+$/.test(E.FORM(t))));
}

test('k11b_teilstueck_wird_erkannt (Scheibe ab 4 Zeichen, W4-A-01: TDAR in „Alle Verschiebungen“; sonst ab 5)', () => {
  assert.ok(E.erkannt('scheibe.alle', { texte: ['TDAR'] }, S), 'TDAR');
  assert.equal(E.fensterFuer('scheibe.alle'), 4);
  assert.equal(E.fensterFuer('skytale.skytale'), 5);
  const fehlt = [];
  for (const { p, wr, e } of textAllein()) {
    const t = E.FORM(e.texte[0]);
    const f = E.fensterFuer(wr);
    for (let i = 0; i + f <= t.length; i += 3) if (!E.erkannt(wr, { texte: [t.slice(i, i + f)] }, S)) fehlt.push(`${p.id} ${wr} ${t.slice(i, i + f)}`);
  }
  assert.deepEqual(fehlt.slice(0, 15), [], `${fehlt.length} Teilstücke unerkannt`);
});

test('k11b_haeppchen_zu_zweit_im_verlauf', () => {
  const fehlt = [];
  for (const { p, wr, e } of verrat()) {
    if (e.texte.length !== 1 || !/^[A-Z]{6,}$/.test(E.FORM(e.texte[0]))) continue;
    const t = E.FORM(e.texte[0]);
    const v = E.verlauf();
    let erkannt = false;
    for (let i = 0; i < t.length && !erkannt; i += 2) {
      const stueck = { ...e, texte: [t.slice(i, i + 2)] };
      v.merke(stueck); // wie KRLaborBau.erkenne: erst merken, dann erkennen
      erkannt = E.erkannt(wr, stueck, S, v);
    }
    if (!erkannt) fehlt.push(`${p.id} ${wr}`);
  }
  assert.deepEqual(fehlt.slice(0, 15), [], `${fehlt.length} Häppchen-Folgen unerkannt`);
});

test('k11b_haeppchen_mit_neuladen (Speicher je Tab, nur Fortsetzungen aus den Aufgabendaten)', () => {
  const ablage = new Map();
  const speicher = { lade: (id) => ablage.get(id) || null, speichere: (id, x) => ablage.set(id, JSON.parse(JSON.stringify(x))) };
  // W4-A-01: je zwei bzw. drei Zeichen, dazwischen „neu laden“ (neuer Verlauf mit demselben Speicher)
  for (const n of [2, 3]) {
    ablage.clear();
    const t = 'TDARNATJVWRNJWBL';
    let erkannt = false;
    for (let i = 0; i < t.length && !erkannt; i += n) {
      const v = E.verlauf({ speicher });
      const stueck = { texte: [t.slice(i, i + n)] };
      v.merke(stueck);
      erkannt = E.erkannt('scheibe.alle', stueck, S, v); // sichert dabei die Fortsetzungen
    }
    assert.ok(erkannt, `Häppchen zu ${n} mit Neuladen`);
    // gespeichert sind nur Fortsetzungen (1–2 Zeichen der Aufgabendaten) je Reiter, nie die Eingabe selbst
    for (const x of ablage.values()) for (const [r, liste] of Object.entries(x)) {
      assert.equal(typeof r, 'string');
      for (const f of liste) assert.match(f, /^[A-Z0-9]{1,2}$/);
    }
  }
  // eigener Text: nichts gespeichert, nichts erkannt
  ablage.clear();
  const v = E.verlauf({ speicher });
  v.merke({ texte: ['WALD'] });
  assert.equal(E.erkannt('scheibe.alle', { texte: ['WALD'] }, S, v), false);
  assert.ok([...ablage.values()].every((x) => Object.values(x).every((l) => !l.length)), 'eigener Text: keine Fortsetzung gespeichert');
});
