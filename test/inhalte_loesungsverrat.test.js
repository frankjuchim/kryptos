'use strict';
// Kein Lösungsverrat innerhalb einer Welt (M5-Inhaltsprüfung, Befunde K1/K2/W1–W5): Die Lösung einer Lab-, Boss- oder
// Archivfund-Aufgabe darf nicht wörtlich in einem anderen Schülertext derselben Welt stehen – andere Aufgabe (Text,
// Interaktion, Tipps, Erklärung), Level-Intro, Archivfund/Kapitel, Akte-Quelle (ohne Lösungsteile) oder Warm-up-Karte.
// Aufgaben sind frei anwählbar, also verrät jede andere Stelle die Antwort.
// Verglichen wird normalisiert (A–Z, 0–9): Lösungstexte und Lückenwerte mit ≥ 6 Zeichen (und ≥ 3 verschiedenen; Bitfolgen
// aus nur 0/1 ab 16 Zeichen, Plan M8 Task 171), dazu
// die Lückenwerte einer Aufgabe hintereinander (z. B. Zeilen eines Quadrats, ein ganzes Geheimtextalphabet). Blöcke
// werden so gelesen, wie sie erscheinen: Zellen einer Zeile/eines Quadrats zusammen, Playfair-/Polybios-Quadrate mit
// Schlüssel ausgerechnet.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');
const Krypto = require('../public/static/js/shared/krypto.js');

/** Begründete Ausnahmen: { aufgabe, quelle (Anfang der Fundstelle), begruendung } */
const AUSNAHMEN = [
  {
    aufgabe: 'W6-L2-01', quelle: 'Akte akte_W6-2',
    begruendung: 'Plan M8 E137: Die Lesereihenfolge 0 5 2 7 4 1 6 3 (t = 5) steht als Archivwissen-Tabelle in Akte W6·2 – Nachschlagen im Archivwissen ist in dieser Aufgabe gewollt.'
  }
];
const GENUTZT = new Set();

const N = (t) => S.normalisiert(t);
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const kurz = (x) => typeof x === 'string' && [...x].length <= 2;

/** Textstücke eines JSON-Werts (normalisiert). Listen aus Einzelzeichen (Zeilen, Zellen) zählen als ein Stück. */
function stuecke(wert, { ohne = [] } = {}) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string') return out.push(N(x));
    if (Array.isArray(x)) {
      const flach = x.flat();
      if (flach.length >= 2 && flach.every(kurz)) out.push(N(flach.join('')));
      return x.forEach(lauf);
    }
    if (!x || typeof x !== 'object') return;
    if (x.nur_loesung === true) return;
    if (x.t === 'quadrat' && (x.art === 'playfair' || x.art === 'polybios') && typeof x.schluessel === 'string') {
      out.push(Krypto.quadrat(x.schluessel, { groesse: x.groesse || 5 }).join(''));
    }
    // Blöcke bits: jede Bitfolge als ein Stück (Trenner weg), Plan M8 Task 171
    if (x.t === 'bits' && Array.isArray(x.zeilen)) for (const z of x.zeilen) if (z && typeof z.bits === 'string') out.push(N(z.bits));
    // Akten-Quadrate: Zeilen als Zeichenketten („RIALT“, „OBCDE“, …) – ganzes Quadrat als ein Stück
    if (x.t === 'quadrat' && Array.isArray(x.zeilen) && x.zeilen.every((z) => typeof z === 'string')) out.push(N(x.zeilen.join('')));
    for (const [k, v] of Object.entries(x)) if (!ohne.includes(k) && !k.startsWith('_')) lauf(v);
  })(wert);
  return out.filter(Boolean);
}

/** Lösungen einer Aufgabe: normalisierte Zeichenketten (≥ 6 Zeichen, ≥ 3 verschiedene; nur 0/1: ≥ 16 Zeichen) */
function loesungen(a) {
  const roh = [];
  for (const lo of [].concat(a.loesung || [])) {
    if (!lo || typeof lo !== 'object') continue;
    const luecken = [];
    for (const [k, v] of Object.entries(lo)) {
      if (k.startsWith('_') || k === 'richtig' || k === 'zuordnung' || k === 'reihenfolge') continue;
      if (typeof v === 'string') roh.push(v);
      else if (Array.isArray(v)) {
        v.filter((x) => typeof x === 'string').forEach((x) => roh.push(x));
        if (typeof v[0] === 'string') luecken.push(v[0]);
      }
    }
    if (luecken.length > 1) roh.push(luecken.join(''));
  }
  const zaehlt = (t) => (/^[01]+$/.test(t) ? t.length >= 16 : t.length >= 6 && new Set(t).size >= 3);
  return [...new Set(roh.map(N))].filter(zaehlt);
}

/** Schülertexte einer Welt: [{ quelle, aufgabe (id oder null), stuecke }] */
function schuelertexte(welt) {
  const w = S.seed(welt);
  const liste = [];
  if (!w) return liste;
  liste.push({ quelle: `W${welt} Kapitel/Archivfund`, aufgabe: null, stuecke: stuecke([w.kapitel, w.archivfund, w.titel]) });
  for (const l of w.levels || []) liste.push({ quelle: `${l.id} Intro`, aufgabe: null, stuecke: stuecke(l.intro) });
  if (w.boss) liste.push({ quelle: `W${welt}-B Boss-Kopf`, aufgabe: null, stuecke: stuecke({ ...w.boss, pool: undefined }) });
  for (const a of w.aufgaben || []) {
    liste.push({ quelle: `${a.id} Aufgabe`, aufgabe: a.id, stuecke: stuecke(a, { ohne: ['loesung', 'pruefnachweis', 'fallen', 'id'] }) });
  }
  const wu = S.warmup(welt);
  for (const k of (wu && wu.karten) || []) liste.push({ quelle: `${k.id} Warm-up`, aufgabe: null, stuecke: stuecke([k.titel, k.aufgabe, k.loesung]) });
  const ordner = path.join(S.WURZEL, 'quellen', 'material', `W${welt}`);
  if (fs.existsSync(ordner)) {
    for (const d of fs.readdirSync(ordner).filter((x) => /^akte_.*\.json$/.test(x)).sort()) {
      const akte = json(path.join(ordner, d));
      liste.push({ quelle: `Akte ${d}`, aufgabe: null, stuecke: stuecke(akte.bloecke, { ohne: ['loesung'] }) });
    }
  }
  return liste;
}

/** Funde einer Welt: [{ aufgabe, loesung, quelle }] */
function funde(welt) {
  const w = S.seed(welt);
  if (!w) return [];
  const texte = schuelertexte(welt);
  const out = [];
  for (const a of w.aufgaben || []) {
    for (const lo of loesungen(a)) {
      for (const t of texte) {
        if (t.aufgabe === a.id) continue;
        if (!t.stuecke.some((s) => s.includes(lo))) continue;
        const ausnahme = AUSNAHMEN.find((x) => x.aufgabe === a.id && t.quelle.startsWith(x.quelle));
        if (ausnahme) {
          GENUTZT.add(ausnahme);
          continue;
        }
        out.push({ aufgabe: a.id, loesung: lo, quelle: t.quelle });
      }
    }
  }
  return out;
}

test('Lösungsverrat-Prüfung erkennt die Muster (Alphabet in Alphabet-Block, Quadrat-Zeilen in Playfair-Quadrat)', () => {
  const lo = loesungen({ loesung: { a1: ['S'], a2: ['U'], a3: ['L'], a4: ['T'], a5: ['A'], a6: ['N'] } });
  assert.deepEqual(lo, ['SULTAN']);
  const st = stuecke({ t: 'alphabet', zeilen: [{ label: 'Geheimtext', werte: 'SULTANBCDEFGHIJKMOPQRVWXYZ' }] });
  assert.ok(st.some((s) => s.includes('SULTAN')));
  const q = stuecke({ t: 'quadrat', art: 'playfair', schluessel: 'RIALTO' });
  assert.ok(q.some((s) => s.includes('FGHKMNPQSU')));
  const z = stuecke({ t: 'quadrat', art: 'frei', zellen: [['F', 'G', 'H', 'K', 'M'], ['N', 'P', 'Q', 'S', 'U']] });
  assert.ok(z.some((s) => s === 'FGHKMNPQSU'));
  assert.ok(stuecke({ t: 'quadrat', zeilen: ['RIALT', 'OBCDE', 'FGHKM', 'NPQSU', 'VWXYZ'] }).some((s) => s.includes('FGHKMNPQSU')));
  assert.deepEqual(stuecke({ t: 'p', md: 'Lösung', nur_loesung: true }), []);
  assert.deepEqual(loesungen({ loesung: { text: 'XXXXXX' } }), [], 'zu wenig verschiedene Zeichen');
  // Plan M8 Task 171: Bitlösungen ab 16 Bit, gefunden in einem bits-Block
  assert.deepEqual(loesungen({ loesung: { bits: '0110101011010100' } }), ['0110101011010100']);
  assert.deepEqual(loesungen({ loesung: { bits: '01101010' } }), [], 'kürzere Bitfolgen zählen nicht');
  const b = stuecke({ t: 'bits', zeilen: [{ label: 'T', bits: '0110 1010 1101 0100' }, { trenner: '⊕' }] });
  assert.ok(b.some((s) => s.includes('0110101011010100')));
});

for (const welt of S.WELTEN) {
  test(`Welt ${welt}: keine Lösung einer Aufgabe wörtlich in einem anderen Schülertext derselben Welt`, () => {
    const f = funde(welt).map((x) => `${x.aufgabe}: „${x.loesung}“ in ${x.quelle}`);
    assert.deepEqual(f, []);
  });
}

test('Ausnahmen der Lösungsverrat-Prüfung sind begründet und werden gebraucht', () => {
  for (const welt of S.WELTEN) funde(welt);
  for (const x of AUSNAHMEN) {
    assert.ok(x.begruendung && x.begruendung.length >= 20, `${x.aufgabe}: Begründung fehlt`);
    // erst prüfbar, wenn die Aufgabe im Seed steht (W3–W6 entstehen in Plan M8)
    const welt = Number(/^W(\d)/.exec(x.aufgabe)[1]);
    const imSeed = (S.seed(welt) || { aufgaben: [] }).aufgaben.some((a) => a.id === x.aufgabe);
    if (imSeed) assert.ok(GENUTZT.has(x), `${x.aufgabe} (${x.quelle}): Ausnahme wird nicht mehr gebraucht`);
  }
});

module.exports = { funde, loesungen, stuecke };
