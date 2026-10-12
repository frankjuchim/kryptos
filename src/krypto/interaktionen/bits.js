'use strict';
// Interaktion bits-rechnen (AUFGABENFORMAT_KRYPTO §8.4): XOR, ASCII (beide Richtungen), KRYPTOS-16-Runden
// (SPEC W3 §0a), Lawine (Bit-Verfolgung) und fremde Verfahren (frei). Feedback je Bit (nicht bei lawine/zu-text),
// Fallen-Diagnose §9.4, Validator mit Neuberechnung über die Bibliothek.
// Kanonische Antwort: Bitfolge ohne Trenner (Text) · ascii/zu-text: Text (getrimmt, Groß/Klein bleibt) ·
// lawine: sortierte Liste der Positionen 0–15 (0 = höchstwertiges Bit).

const K = require('../../../public/static/js/shared/krypto');
const C = require('../../content/checker');
const D = require('../diagnose');
const { FALLEN_IDS } = require('../../domain');

const { AntwortFehler } = C;
const OPERATIONEN = ['xor', 'ascii', 'kryptos16', 'lawine', 'frei'];
const MAX_BITS = 64;
const MAX_ZEICHEN = 8;

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/** 16-Bit-Zahl aus einer Bitfolge (genau 16 Bit) bzw. Bitfolge aus einer Zahl. */
const zahl16 = (bits) => parseInt(K.normBits(bits), 2);
const bits16 = (n) => K.byteZuBits(n, 16);

const istTextAntwort = (ia) => ia.operation === 'ascii' && ia.richtung === 'zu-text';

/** Erwartetes Ergebnis (Neuberechnung, auch für die Diagnose); frei → undefined. Wirft KryptoFehler. */
function erwartet(ia) {
  switch (ia.operation) {
    case 'xor':
      return K.xorBits(...ia.operanden);
    case 'ascii':
      return ia.richtung === 'zu-text' ? K.bitsZuText(ia.bits) : K.textZuBits(ia.text, { gruppe: 0 });
    case 'kryptos16': {
      const f = ia.richtung === 'ent' ? K.kryptos16.entschluesseln : K.kryptos16.verschluesseln;
      return bits16(f(zahl16(ia.block), zahl16(ia.schluessel), { runden: ia.runden }));
    }
    case 'lawine': {
      const r = K.kryptos16.lawine(zahl16(ia.block), zahl16(ia.schluessel), ia.kippe + 1, { runden: ia.runden });
      return r[r.length - 1].positionen.map((p) => p - 1);
    }
    default:
      return undefined;
  }
}

function auspacken(antwort, schluessel) {
  if (istObjekt(antwort)) {
    for (const k of schluessel) if (Object.hasOwn(antwort, k)) return antwort[k];
    throw new AntwortFehler('Antwort hat eine unbekannte Form.');
  }
  return antwort;
}

function bitsAntwort(x) {
  if (x === undefined || x === null) return '';
  if (typeof x !== 'string') throw new AntwortFehler('Antwort muss eine Bitfolge sein.');
  if (x.length > 4 * MAX_BITS) throw new AntwortFehler('Antwort ist zu lang.');
  const b = K.normBits(x);
  if (/[^01]/.test(b)) throw new AntwortFehler('Nur 0 und 1.');
  if (b.length > MAX_BITS) throw new AntwortFehler('Antwort ist zu lang.');
  return b;
}

function textAntwort(x) {
  if (x === undefined || x === null) return '';
  if (typeof x !== 'string') throw new AntwortFehler('Antwort muss Text sein.');
  const t = x.trim();
  if (t.length > MAX_ZEICHEN) throw new AntwortFehler('Antwort ist zu lang.');
  return t;
}

/** Antwort in die kanonische Form bringen (wirft AntwortFehler → 400). */
function kanonisch(ia, antwort) {
  if (ia.operation === 'lawine') {
    let a = auspacken(antwort, ['positionen']);
    if (a === undefined || a === null) a = [];
    if (!Array.isArray(a) || a.length > 16) throw new AntwortFehler('Antwort muss eine Liste von Bitpositionen sein.');
    const n = a.map((x) => (typeof x === 'string' && /^\s*\d+\s*$/.test(x) ? Number(x) : x));
    if (!n.every((x) => Number.isInteger(x) && x >= 0 && x <= 15)) throw new AntwortFehler('Bitpositionen sind ganze Zahlen von 0 bis 15.');
    return [...new Set(n)].sort((x, y) => x - y);
  }
  if (istTextAntwort(ia)) return textAntwort(auspacken(antwort, ['text']));
  if (ia.operation === 'frei') {
    const a = auspacken(antwort, ['bits', 'text']);
    if (istObjekt(antwort) && Object.hasOwn(antwort, 'text')) return textAntwort(a);
    if (typeof a === 'string' && /^[01\s_|.]*$/.test(a)) return bitsAntwort(a);
    return textAntwort(a);
  }
  return bitsAntwort(auspacken(antwort, ['bits']));
}

const bereinige = (ia, antwort) => kanonisch(ia, antwort);

function istLeer(ia, a) {
  return Array.isArray(a) ? a.length === 0 : a === '';
}

/** Lösung in kanonischer Form (oder null, wenn keine passende Lösung vorhanden ist). */
function loesungVon(ia, lo) {
  if (!istObjekt(lo)) return null;
  if (ia.operation === 'lawine') return Array.isArray(lo.positionen) ? [...new Set(lo.positionen)].sort((x, y) => x - y) : null;
  if (istTextAntwort(ia)) return typeof lo.text === 'string' ? lo.text.trim() : null;
  if (ia.operation === 'frei' && typeof lo.bits !== 'string') return typeof lo.text === 'string' ? lo.text.trim() : null;
  return typeof lo.bits === 'string' ? K.normBits(lo.bits) : null;
}

const istBitErgebnis = (ia, lo) => ia.operation !== 'lawine' && !istTextAntwort(ia) && !(ia.operation === 'frei' && istObjekt(lo) && typeof lo.bits !== 'string');

function pruefe(ia, lo, a, teilweise, opt = {}) {
  const soll = loesungVon(ia, lo);
  let ok;
  if (Array.isArray(a)) ok = Array.isArray(soll) && a.length === soll.length && a.every((x, i) => x === soll[i]);
  else ok = soll !== null && a === soll;
  const r = { ok };
  if (istBitErgebnis(ia, lo) && typeof soll === 'string') {
    const n = Math.max(a.length, soll.length);
    r.bits = [];
    for (let i = 0; i < n; i++) r.bits.push(i < a.length && i < soll.length && a[i] === soll[i]);
  }
  if (!ok && opt.diagnose && !istLeer(ia, a)) {
    const d = D.bits(ia, lo, a, { loesung: soll, kanon: (t) => kanonisch(ia, t), erwartet });
    if (d.length) r.diagnose = d;
  }
  return r;
}

function muster(ia, lo) {
  if (!istObjekt(lo)) return '';
  if (ia.operation === 'lawine') return lo.positionen || [];
  if (istTextAntwort(ia)) return lo.text || '';
  if (ia.operation === 'frei') return typeof lo.bits === 'string' ? lo.bits : lo.text || '';
  return lo.bits || '';
}

/** Bitfolge prüfen: Text, nur 0/1 nach normBits, Länge im Bereich. */
function pruefeBitfolge(x, name, min, max, fa, ort) {
  if (typeof x !== 'string') {
    fa(ort, `${name} fehlt (Bitfolge).`);
    return null;
  }
  const b = K.normBits(x);
  if (/[^01]/.test(b)) {
    fa(ort, `${name}: nur 0 und 1.`);
    return null;
  }
  if (b.length < min || b.length > max) {
    fa(ort, min === max ? `${name} muss ${min} Bit haben.` : `${name} muss ${min}–${max} Bit haben.`);
    return null;
  }
  return b;
}

const anzeige = (x) => (Array.isArray(x) ? `[${x.join(', ')}]` : String(x));

function validiere(ia, lo, aufgabe, ort, fa, wa) {
  const lort = ort.replace('interaktion', 'loesung');
  if (!OPERATIONEN.includes(ia.operation)) return fa(ort, `operation muss ${OPERATIONEN.join(' | ')} sein.`);
  let strukturOk = true;
  const fs = (o, m) => {
    strukturOk = false;
    fa(o, m);
  };
  switch (ia.operation) {
    case 'xor': {
      if (!Array.isArray(ia.operanden) || ia.operanden.length < 2 || ia.operanden.length > 4) {
        fs(ort, 'operanden muss 2–4 Bitfolgen enthalten.');
        break;
      }
      ia.operanden.forEach((x, i) => pruefeBitfolge(x, `operanden[${i}]`, 8, 32, fs, ort));
      // gleiche Länge auch dann melden, wenn ein Operand außerhalb 8–32 Bit liegt
      const b = ia.operanden.map((x) => (typeof x === 'string' ? K.normBits(x) : null));
      if (b.every((x) => x !== null) && !b.every((x) => x.length === b[0].length)) fs(ort, 'operanden müssen gleich lang sein.');
      break;
    }
    case 'ascii':
      if (ia.richtung === 'zu-bits') {
        if (typeof ia.text !== 'string' || ia.text.length < 1 || ia.text.length > 4 || ![...ia.text].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126)) {
          fs(ort, 'text muss 1–4 Zeichen mit ASCII-Wert 32–126 haben.');
        }
      } else if (ia.richtung === 'zu-text') {
        const b = pruefeBitfolge(ia.bits, 'bits', 8, 32, fs, ort);
        if (b !== null && b.length % 8) fs(ort, 'bits muss ein Vielfaches von 8 Bit haben.');
      } else fs(ort, 'richtung muss zu-bits oder zu-text sein.');
      break;
    case 'kryptos16':
    case 'lawine':
      pruefeBitfolge(ia.block, 'block', 16, 16, fs, ort);
      pruefeBitfolge(ia.schluessel, 'schluessel', 16, 16, fs, ort);
      if (!Number.isInteger(ia.runden) || ia.runden < 1 || ia.runden > 4) fs(ort, 'runden muss 1–4 sein.');
      if (ia.operation === 'kryptos16') {
        if (ia.richtung !== undefined && !['ver', 'ent'].includes(ia.richtung)) fs(ort, 'richtung muss ver oder ent sein.');
        if (ia.kippe !== undefined) fs(ort, 'kippe gibt es nur bei lawine.');
      } else {
        if (!Number.isInteger(ia.kippe) || ia.kippe < 0 || ia.kippe > 15) fs(ort, 'kippe muss eine Bitposition 0–15 sein.');
        if (ia.richtung !== undefined) fs(ort, 'richtung gibt es bei lawine nicht.');
      }
      break;
    default:
      if (typeof aufgabe.pruefnachweis !== 'string' || !aufgabe.pruefnachweis.trim()) fa('pruefnachweis', 'pruefnachweis fehlt (fremdes Verfahren).');
  }
  if (ia.gruppe !== undefined && ia.gruppe !== 4 && ia.gruppe !== 8) fa(ort, 'gruppe muss 4 oder 8 sein.');
  if (ia.labels !== undefined && (!Array.isArray(ia.labels) || !ia.labels.every((x) => typeof x === 'string'))) fa(ort, 'labels muss eine Liste von Texten sein.');
  if (ia.laenge !== undefined && (!Number.isInteger(ia.laenge) || ia.laenge < 1 || ia.laenge > MAX_BITS)) fa(ort, `laenge muss eine ganze Zahl 1–${MAX_BITS} sein.`);
  if (ia.diagnose !== undefined && typeof ia.diagnose !== 'boolean') fa(ort, 'diagnose muss true oder false sein.');

  // Lösung (Form)
  let soll;
  if (ia.operation === 'lawine') {
    if (!Array.isArray(lo.positionen) || !lo.positionen.every((x) => Number.isInteger(x) && x >= 0 && x <= 15)) {
      return fa(lort, 'positionen (Liste von Bitpositionen 0–15) fehlt.');
    }
    soll = loesungVon(ia, lo);
  } else if (istTextAntwort(ia)) {
    if (typeof lo.text !== 'string' || !lo.text.trim()) return fa(lort, 'text (Lösung) fehlt.');
    soll = lo.text.trim();
  } else if (ia.operation === 'frei') {
    if (typeof lo.bits !== 'string' && typeof lo.text !== 'string') return fa(lort, 'bits oder text (Lösung) fehlt.');
    try {
      soll = kanonisch(ia, typeof lo.bits === 'string' ? { bits: lo.bits } : { text: lo.text });
    } catch (e) {
      return fa(lort, `Lösung ist keine gültige Antwort: ${e.message}`);
    }
  } else {
    if (typeof lo.bits !== 'string') return fa(lort, 'bits (Lösung) fehlt.');
    try {
      soll = bitsAntwort(lo.bits);
    } catch (e) {
      return fa(lort, `bits (Lösung): ${e.message}`);
    }
  }
  if (ia.laenge !== undefined && !Array.isArray(soll) && soll.length !== ia.laenge) fa(ort, `laenge ${ia.laenge} passt nicht zur Länge des Ergebnisses (${soll.length}).`);

  // fehlmuster nur bei frei (wie chiffre)
  if (lo.fehlmuster !== undefined) {
    if (ia.operation !== 'frei') fa(lort, 'fehlmuster nur bei fremden Verfahren (operation frei).');
    else if (!Array.isArray(lo.fehlmuster) || lo.fehlmuster.length > 5) fa(lort, 'fehlmuster muss eine Liste mit höchstens 5 Einträgen sein.');
    else
      lo.fehlmuster.forEach((f, i) => {
        const o = `${lort}.fehlmuster[${i}]`;
        if (!istObjekt(f) || typeof f.text !== 'string') return fa(o, 'Eintrag braucht text, p und code.');
        let k = null;
        try {
          k = kanonisch(ia, typeof lo.bits === 'string' ? { bits: f.text } : { text: f.text });
        } catch (e) {
          fa(o, `text ist keine gültige Antwort: ${e.message}`);
        }
        if (k !== null && k === soll) fa(o, 'text eines Fehlmusters darf nicht die Lösung sein.');
        if (!FALLEN_IDS.includes(f.p)) fa(o, 'p muss P1–P10 sein.');
        if (typeof f.code !== 'string' || !/^[a-z_]{1,30}$/.test(f.code)) fa(o, 'code muss aus a–z und _ bestehen (höchstens 30 Zeichen).');
      });
  }

  // Neuberechnung
  if (ia.operation === 'frei' || !strukturOk) return;
  let ist;
  try {
    ist = erwartet(ia);
  } catch (e) {
    if (e && e.name === 'KryptoFehler') return fa(ort, `Verfahren nicht anwendbar: ${e.message}`);
    throw e;
  }
  if (anzeige(ist) !== anzeige(soll)) fa(lort, `Neuberechnung ergibt ${anzeige(ist)} statt ${anzeige(soll)}.`);
  if (wa && ia.operation === 'lawine' && Array.isArray(lo.positionen) && lo.positionen.join() !== soll.join()) wa(lort, 'positionen sollten aufsteigend und ohne Doppelte angegeben sein.');
}

const vertrag = Object.freeze({
  bereinige,
  istLeer,
  pruefe,
  muster,
  validiere,
  schritt: false,
  boss: Object.freeze({ erlaubt: true })
});

function registriere(F) {
  F.registriereInteraktion('bits-rechnen', vertrag);
}

module.exports = { vertrag, registriere, erwartet, kanonisch };
