'use strict';
// Nachrechnen von Block-Inhalten im Validator (Review M3 W3, K8; Delta §7.1, §7.3, §7.4, §11):
//  - Lücken [[id]] in einem bits-Block mit pruefe: xor, in einer Alphabetzeile (Caesar- bzw. Schlüsselwort-Alphabet) und
//    in den Zellen eines quadrat-Blocks (Schlüssel bzw. erkennbares Schlüsselwort-Quadrat) werden gegen die Lösung des
//    gaps-Felds nachgerechnet (Fehler bei Abweichung);
//  - gaps-Aufgaben der Rechen-Kategorien, deren Felder so nicht nachgerechnet werden, brauchen einen pruefnachweis
//    (Hinweis);
//  - Blöcke quadrat/alphabet und das verfahren einer chiffre-Interaktion derselben Aufgabe müssen denselben Schlüssel
//    nennen (Hinweis).
// Rechnen ausschließlich über public/static/js/shared/krypto.js.

const K = require('../../public/static/js/shared/krypto');
const F = require('../content/format');

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const LUECKE = /^\[\[([A-Za-z0-9_-]{1,40})\]\]$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Kategorien, deren gaps-Felder Rechenergebnisse sind (Hinweis „pruefnachweis angeben“). */
const RECHEN_KATEGORIEN = Object.freeze(['modulo', 'verschluesseln', 'entschluesseln', 'bits-xor', 'blockchiffre', 'schluesselaustausch', 'asymmetrisch', 'hash', 'signatur', 'schluesselraum']);

const lueckenId = (x) => {
  const m = typeof x === 'string' ? LUECKE.exec(x.trim()) : null;
  return m ? m[1] : null;
};

/** Ergebnis einer Bibliotheksrechnung oder null bei KryptoFehler. */
function rechne(fn) {
  try {
    return fn();
  } catch (e) {
    if (e && e.name === 'KryptoFehler') return null;
    throw e;
  }
}

/** gaps-Felder aller Teile: id → { feld, akzeptiert: [Text…], ort }. */
function gapsFelder(a) {
  const out = new Map();
  const teile = F.teile(a);
  teile.forEach(({ interaktion: ia, loesung: lo }, i) => {
    if (!istObjekt(ia) || ia.kind !== 'gaps' || !istObjekt(ia.felder) || !istObjekt(lo)) return;
    for (const [id, feld] of Object.entries(ia.felder)) {
      if (!Object.hasOwn(lo, id)) continue;
      const akzeptiert = (Array.isArray(lo[id]) ? lo[id] : [lo[id]]).filter((x) => typeof x === 'string' || typeof x === 'number').map(String);
      out.set(id, { feld, akzeptiert, ort: `${teile.length > 1 ? `loesung[${i}]` : 'loesung'}.${id}` });
    }
  });
  return out;
}

/* ---------- bits mit pruefe: xor ---------- */

/** Erwartete Bits je Lücke eines bits-Blocks (genau eine Lücke unter den Datenzeilen): XOR aller anderen Zeilen. */
function bitsLuecken(b) {
  if (b.pruefe !== 'xor' || !Array.isArray(b.zeilen)) return [];
  const daten = b.zeilen.filter((z) => istObjekt(z) && typeof z.bits === 'string');
  if (daten.length < 3) return [];
  const luecken = daten.filter((z) => lueckenId(z.bits));
  if (luecken.length !== 1) return [];
  const andere = daten.filter((z) => !lueckenId(z.bits)).map((z) => K.normBits(z.bits));
  if (!andere.every((x) => /^[01]+$/.test(x) && x.length === andere[0].length)) return [];
  const erwartet = rechne(() => K.xorBits(...andere));
  return erwartet ? [{ id: lueckenId(luecken[0].bits), erwartet, art: 'XOR', gleich: (v) => K.normBits(v) === erwartet }] : [];
}

/* ---------- alphabet: Caesar- bzw. Schlüsselwort-Alphabet ---------- */

/** Einträge einer Alphabetzeile (26) oder null. */
function eintraege(z) {
  if (!istObjekt(z)) return null;
  if (typeof z.werte === 'string' && [...z.werte].length === 26) return [...z.werte];
  if (Array.isArray(z.werte) && z.werte.length === 26 && z.werte.every((x) => typeof x === 'string')) return z.werte;
  return null;
}

const istBuchstabe = (x) => typeof x === 'string' && /^[A-Za-z]$/.test(x);
const istNormalzeile = (e) => e && e.every((x, i) => istBuchstabe(x) && x.toUpperCase() === ALPHABET[i]);

/** Kandidaten-Alphabete (26 Großbuchstaben) für eine Zeile mit bekannten Buchstaben: Caesar k = 0…25, Schlüsselwort-Präfixe. */
function kandidatenAlphabete(e) {
  const out = [];
  for (let k = 0; k < 26; k++) out.push(ALPHABET.slice(k) + ALPHABET.slice(0, k));
  for (let n = 1; n <= 26; n++) {
    const praefix = e.slice(0, n);
    if (!praefix.every(istBuchstabe)) break;
    for (const rest of ['alphabetisch', 'ab_letztem']) {
      const alph = rechne(() => K.schluesselwortAlphabet(praefix.join(''), { rest }));
      if (typeof alph === 'string' && alph.length === 26) out.push(alph.toUpperCase());
    }
  }
  return out;
}

/** Erwartete Buchstaben je Lücke einer Alphabetzeile – nur bei eindeutiger Ergänzung (sonst keine). */
function alphabetLuecken(b) {
  if (!Array.isArray(b.zeilen)) return [];
  const zeilen = b.zeilen.map(eintraege);
  if (!zeilen.some(istNormalzeile)) return [];
  const out = [];
  for (const e of zeilen) {
    if (!e || istNormalzeile(e)) continue;
    const luecken = e.map((x, i) => [i, lueckenId(x)]).filter(([, id]) => id);
    if (!luecken.length) continue;
    const bekannt = e.map((x, i) => [i, x]).filter(([, x]) => istBuchstabe(x));
    const passend = kandidatenAlphabete(e).filter((alph) => bekannt.every(([i, x]) => alph[i] === x.toUpperCase()));
    const fuellungen = new Set(passend.map((alph) => luecken.map(([i]) => alph[i]).join('')));
    if (fuellungen.size !== 1) continue;
    const alph = passend[0];
    for (const [i, id] of luecken) out.push({ id, erwartet: alph[i], art: 'Alphabet', gleich: (v) => K.nurBuchstaben(v) === alph[i] });
  }
  return out;
}

/* ---------- quadrat: Lücken in Zellen (Playfair/Polybios mit Schlüssel bzw. erkennbares Schlüsselwort-Quadrat) ---------- */

/** Erwartete Zeichen je Lücke eines quadrat-Blocks mit zellen – nur bei eindeutiger Ergänzung. */
function quadratLuecken(b) {
  if (!Array.isArray(b.zellen) || !b.zellen.every(Array.isArray) || b.art === 'vigenere') return [];
  const groesse = b.groesse === 6 ? 6 : 5;
  const flach = b.zellen.flat();
  if (flach.length !== groesse * groesse) return [];
  const luecken = flach.map((x, i) => [i, lueckenId(x)]).filter(([, id]) => id);
  if (!luecken.length) return [];
  const bekannt = flach.map((x, i) => [i, x]).filter(([, x]) => typeof x === 'string' && [...x].length === 1);
  const kandidaten = [];
  const ijs = b.ij ? [b.ij] : ['I', 'J'];
  if ((b.art === 'playfair' || b.art === 'polybios') && typeof b.schluessel === 'string') {
    for (const ij of ijs) kandidaten.push(rechne(() => K.quadrat(b.schluessel, { groesse, ij })));
  } else {
    // Schlüsselwort aus dem Anfang der Zellen (auch leer = Quadrat ohne Schlüsselwort)
    for (let n = 0; n <= flach.length; n++) {
      if (n > 0 && !(typeof flach[n - 1] === 'string' && /^[A-Za-z0-9]$/.test(flach[n - 1]))) break;
      const wort = flach.slice(0, n).join('');
      for (const ij of ijs) kandidaten.push(rechne(() => K.quadrat(wort, { groesse, ij })));
    }
  }
  const passend = kandidaten.filter(Array.isArray).map((q) => q.join('')).filter((q) => q.length === flach.length && bekannt.every(([i, x]) => q[i] === x.toUpperCase()));
  const fuellungen = new Set(passend.map((q) => luecken.map(([i]) => q[i]).join('')));
  if (fuellungen.size !== 1) return [];
  const q = passend[0];
  return luecken.map(([i, id]) => ({ id, erwartet: q[i], art: 'Quadrat', gleich: (v) => K.normalisieren(v) === q[i] }));
}

/**
 * Hook-Teil der Aufgabenprüfung (W3): Lücken in bits/alphabet nachrechnen (Fehler), Rechen-Kategorien ohne
 * nachrechenbare Felder und ohne pruefnachweis → Hinweis. bloecke = Blöcke der Aufgabe ohne Erklärung.
 */
function pruefeGapsRechnung(a, bloecke, fa, wa) {
  const felder = gapsFelder(a);
  if (!felder.size) return;
  const geprueft = new Set();
  for (const b of bloecke) {
    const erwartungen = b.t === 'bits' ? bitsLuecken(b) : b.t === 'alphabet' ? alphabetLuecken(b) : b.t === 'quadrat' ? quadratLuecken(b) : [];
    for (const x of erwartungen) {
      const f = felder.get(x.id);
      if (!f) continue;
      geprueft.add(x.id);
      for (const v of f.akzeptiert) if (!x.gleich(v)) fa(f.ort, `Lücke ${x.id}: Neuberechnung (${x.art}) ergibt ${x.erwartet}, Lösung „${v}“.`);
    }
  }
  const offen = [...felder.keys()].filter((id) => !geprueft.has(id));
  if (offen.length && RECHEN_KATEGORIEN.includes(a.kategorie) && a.pruefnachweis === undefined) {
    wa('loesung', `Rechenergebnis nicht nachgerechnet – pruefnachweis angeben (quellen/pruefwerte/W<n>.json#<id>; Felder ${offen.join(', ')}).`);
  }
}

/* ---------- K8: Schlüssel in quadrat/alphabet ↔ verfahren ---------- */

const buchstabenMenge = (s) => [...new Set(K.nurBuchstaben(String(s)))].sort().join('');

/** Geheimtextalphabet eines Verfahrens (Klartext a…z → Geheimtext) oder null. */
function geheimAlphabet(v) {
  if (v.typ === 'caesar' && Number.isInteger(v.k)) return ALPHABET.slice(v.k) + ALPHABET.slice(0, v.k);
  if (v.typ === 'atbash') return [...ALPHABET].reverse().join('');
  if (v.typ === 'substitution') {
    if (typeof v.alphabet === 'string') return K.nurBuchstaben(v.alphabet);
    if (typeof v.schluesselwort === 'string') return rechne(() => K.schluesselwortAlphabet(v.schluesselwort, v.rest ? { rest: v.rest } : {}));
  }
  return null;
}

/** Passt eine Alphabetzeile (bekannte Buchstaben) zum Geheimtextalphabet – vorwärts oder als Umkehrtabelle? */
function zeilePasst(e, geheim) {
  const bekannt = e.map((x, i) => [i, x]).filter(([, x]) => istBuchstabe(x));
  if (!bekannt.length) return true;
  const umkehr = Array(26);
  [...geheim].forEach((c, i) => (umkehr[ALPHABET.indexOf(c)] = ALPHABET[i]));
  return [geheim, umkehr.join('')].some((alph) => bekannt.every(([i, x]) => alph[i] === x.toUpperCase()));
}

/** Hinweise, wenn Blöcke quadrat/alphabet und das verfahren einer chiffre-Interaktion verschiedene Schlüssel nennen. */
function pruefeSchluesselBloecke(a, bloecke, wa) {
  const verfahren = F.teile(a)
    .map(({ interaktion: ia }) => ia)
    .filter((ia) => istObjekt(ia) && ia.kind === 'chiffre' && istObjekt(ia.verfahren))
    .map((ia) => ia.verfahren);
  if (!verfahren.length) return;
  const melde = (block, v) => wa('inhalt', `Block ${block} und verfahren (${v.typ}) nennen verschiedene Schlüssel – bitte angleichen.`);
  for (const b of bloecke) {
    if (b.t === 'quadrat') {
      for (const v of verfahren) {
        if ((b.art === 'playfair' || b.art === 'polybios') && v.typ === b.art && typeof b.schluessel === 'string' && typeof v.schluessel === 'string') {
          const groesse = b.groesse === 6 ? 6 : 5;
          const q1 = rechne(() => K.quadrat(b.schluessel, { groesse, ij: b.ij || 'I' }));
          const q2 = rechne(() => K.quadrat(v.schluessel, { groesse, ij: v.ij || b.ij || 'I' }));
          if (q1 && q2 && JSON.stringify(q1) !== JSON.stringify(q2)) melde('quadrat', v);
        }
        if (b.art === 'vigenere' && Array.isArray(b.ausschnitt) && ['vigenere', 'autokey', 'porta'].includes(v.typ) && typeof v.schluessel === 'string') {
          if (buchstabenMenge(b.ausschnitt.join('')) !== buchstabenMenge(v.schluessel)) melde('quadrat', v);
        }
      }
    }
    if (b.t === 'alphabet' && Array.isArray(b.zeilen)) {
      const zeilen = b.zeilen.map(eintraege);
      if (!zeilen.some(istNormalzeile)) continue;
      for (const v of verfahren) {
        const geheim = geheimAlphabet(v);
        if (typeof geheim !== 'string' || geheim.length !== 26) continue;
        if (zeilen.some((e) => e && !istNormalzeile(e) && !zeilePasst(e, geheim))) melde('alphabet', v);
      }
    }
  }
}

module.exports = { RECHEN_KATEGORIEN, pruefeGapsRechnung, pruefeSchluesselBloecke, bitsLuecken, alphabetLuecken, quadratLuecken };
