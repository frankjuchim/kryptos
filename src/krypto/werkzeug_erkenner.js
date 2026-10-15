'use strict';
// Erkenner auf dem Server (Plan M11 Task 247, E217): Voreinstellungen von Werkzeug-Blöcken mit den Erkenner-Daten des
// Kryptolabors abgleichen. Lädt public/static/js/krypto/labor/erkenner.js (UMD) und die erzeugten Daten
// labor/erkenner/<id>.js einmal; bildet die Voreinstellung je Reiter auf die Eingaben ab, die das Modul dem Erkenner
// übergibt (wie in den Modulen: Text, k=…, u=…, n=…, t=…, st=…, Schlüsselwort, Zahlen, Bitfolgen, Bytepaare).
const fs = require('node:fs');
const path = require('node:path');
const Krypto = require('../../public/static/js/shared/krypto.js');

const ORDNER = path.join(__dirname, '..', '..', 'public', 'static', 'js', 'krypto', 'labor');
let E = null;
function erkenner() {
  if (E) return E;
  E = require(path.join(ORDNER, 'erkenner.js'));
  const daten = path.join(ORDNER, 'erkenner');
  // Daten nur lesen, nicht ausführen (Vertrag v1.3 §9: kein eval/new Function): id, Reiter und 8-Hex-Kennungen
  for (const f of fs.readdirSync(daten).filter((x) => x.endsWith('.js')).sort()) {
    const src = fs.readFileSync(path.join(daten, f), 'utf8');
    const id = /KRErkenner\.daten\('([a-z]+)'/.exec(src);
    if (!id) continue;
    const tabelle = {};
    for (const m of src.matchAll(/"([a-z*]+)":\s*\[([^\]]*)\]/g)) tabelle[m[1]] = [...m[2].matchAll(/'([0-9a-f]{8})'/g)].map((x) => x[1]);
    E.daten(id[1], tabelle);
  }
  return E;
}

const istZahl = (x) => Number.isInteger(x);
const text = (x) => (typeof x === 'string' ? x : null);
const wort = (x) => (typeof x === 'string' && /[A-Za-zÄÖÜäöüß]/.test(x) ? Krypto.nurBuchstaben(x) : null);
const bits16 = (n) => Krypto.byteZuBits(n, 16);
/** Block/Schlüssel des Runden-Labors (2 Zeichen oder 4 Hex) als 16 Bit oder null */
function block16(x) {
  const t = String(x ?? '').replace(/\s+/g, '');
  try {
    if (/^[0-9A-Fa-f]{4}$/.test(t)) return Krypto.vonHex(t).map((b) => Krypto.byteZuBits(b)).join('');
    if ([...t].length === 2) return Krypto.textZuBytes(t).map((b) => Krypto.byteZuBits(b)).join('');
  } catch {
    return null;
  }
  return null;
}
const paare = (a, b) => (a && b ? [[a.slice(0, 8), b.slice(0, 8)], [a.slice(8), b.slice(8)]] : []);
function bytesVon(x, art) {
  try {
    if (art === 'hex') return Krypto.vonHex(String(x));
    if (art === 'bits') {
      const b = Krypto.normBits(String(x)).replace(/[^01]/g, '');
      const out = [];
      for (let i = 0; i + 8 <= b.length; i += 8) out.push(Krypto.bitsZuByte(b.slice(i, i + 8)));
      return out;
    }
    return Krypto.textZuBytes(String(x));
  } catch {
    return [];
  }
}
const bytepaare = (a, b) => (a.length && b.length ? a.map((x, i) => [Krypto.byteZuBits(x), Krypto.byteZuBits(b[Krypto.mod(i, b.length)])]) : []);

/** Eingaben für den Erkenner, wie sie das Modul im Reiter r mit der Voreinstellung v übergäbe */
function eingabenVon(id, r, v) {
  const texte = [text(v.text), text(v.text2)].filter(Boolean);
  const z = (...xs) => xs.filter(istZahl);
  switch (id) {
    case 'scheibe':
      return { texte, schluessel: istZahl(v.k) ? [`k=${v.k}`] : [] };
    case 'skytale': {
      const p = { skytale: ['u', v.umfang], gartenzaun: ['n', v.zeilen], pfluegen: ['k', v.k], ring: ['t', v.t] }[r];
      return { texte, schluessel: p && istZahl(p[1]) ? [`${p[0]}=${p[1]}`] : [] };
    }
    case 'quadrat':
      return { texte, schluessel: [wort(v.schluesselwort)].filter(Boolean) };
    case 'vigenere':
      if (r === 'verschluesseln') return { texte, schluessel: [wort(v.schluessel)].filter(Boolean) };
      return { texte, schluessel: r === 'teiltexte' && istZahl(v.schluessellaenge) ? [`k=${v.schluessellaenge}`] : [] };
    case 'haeufigkeit':
      return { texte, schluessel: r === 'teiltexte' && istZahl(v.teiltexte) ? [`k=${v.teiltexte}`] : [] };
    case 'bitlupe':
      if (r === 'doppelnutzung') return { bitpaare: bytepaare(bytesVon(v.c1, 'hex'), bytesVon(v.c2, 'hex')) };
      if (r === 'xor') return { bitpaare: bytepaare(bytesVon(v.text, 'text'), bytesVon(v.schluessel, v.schluesselart || 'text')) };
      return {};
    case 'runden': {
      if (r === 'enigma') return { texte, schluessel: typeof v.stellung === 'string' ? [`st=${v.stellung.toUpperCase()}`] : [] };
      const b = block16(v.block);
      const k = block16(v.schluessel);
      return { bits: [b, k].filter(Boolean), bitpaare: paare(b, k) };
    }
    case 'modulo':
      return { zahlen: { uhr: z(v.a, v.b, v.modul), tabelle: z(v.g, v.modul), inverses: z(v.a, v.modul), farbmischer: z(v.p, v.g, v.alice, v.bob) }[r] || [] };
    case 'rsa': {
      if (r === 'euklid' && istZahl(v.p) && istZahl(v.q)) return { zahlen: z(v.p, v.q, v.e, (v.p - 1) * (v.q - 1)) };
      return { texte: r === 'text' ? texte : [], zahlen: z(v.p, v.q, v.e) };
    }
    case 'hash':
      return { texte };
    default:
      return { texte };
  }
}

/** Reiter des Werkzeugs, deren Voreinstellungs-Werte der Erkenner erkennt */
function erkannteReiter(wz, v) {
  const E = erkenner();
  const reiter = Array.isArray(v.reiter) && v.reiter.length ? v.reiter.filter((r) => wz.reiter.includes(r)) : wz.reiter.length ? wz.reiter : ['*'];
  return reiter.filter((r) => E.erkannt(r === '*' ? wz.id : `${wz.id}.${r}`, eingabenVon(wz.id, r, v), { rolle: 'schueler' }, null));
}

module.exports = { erkannteReiter, eingabenVon };
