'use strict';
// Interaktion bits-rechnen (AUFGABENFORMAT_KRYPTO §8.4): XOR, ASCII (beide Richtungen), KRYPTOS-16-Runden
// (SPEC W3 §0a), Lawine (Bit-Verfolgung) und fremde Verfahren (frei). Feedback je Bit (nicht bei lawine/zu-text),
// Fallen-Diagnose §9.4, Validator mit Neuberechnung über die Bibliothek.
// Kanonische Antwort: Bitfolge ohne Trenner (Text), ? = leere Bit-Stelle (bleibt positionsgenau stehen, nur ? = leer) · ascii/zu-text: Text (getrimmt, Groß/Klein bleibt) ·
// lawine: sortierte Liste der Positionen 0–15 (0 = höchstwertiges Bit).

const K = require('../../../public/static/js/shared/krypto');
const C = require('../../content/checker');
const D = require('../diagnose');
const { FALLEN_IDS } = require('../../domain');

const { AntwortFehler } = C;
const OPERATIONEN = ['xor', 'ascii', 'kryptos16', 'lawine', 'frei'];
/** KRYPTOS-16-Schritte (Plan M8 E124): Kettenzustände nach diesem Schritt in Runde `runden` (nur ver) und Einzelschritte. */
const KETTENZUSTAENDE = Object.freeze({ 'nach-xor': 'nachXor', 'nach-sbox': 'nachSBox', 'nach-transposition': 'nachTransposition' });
const EINZELSCHRITTE = Object.freeze(['sbox', 'sbox-inv', 'transposition', 'rundenschluessel']);
const SCHRITTE = Object.freeze([...Object.keys(KETTENZUSTAENDE), ...EINZELSCHRITTE]);
const MAX_BITS = 64;
const MAX_ZEICHEN = 8;

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

/** 16-Bit-Zahl aus einer Bitfolge (genau 16 Bit) bzw. Bitfolge aus einer Zahl. */
const zahl16 = (bits) => parseInt(K.normBits(bits), 2);
const bits16 = (n) => K.byteZuBits(n, 16);

const istTextAntwort = (ia) => ia.operation === 'ascii' && ia.richtung === 'zu-text';

/** Startblock einer KRYPTOS-16-Aufgabe: `text` (2 Zeichen, ASCII nach SPEC W3 §0a.1) oder `block`. */
const startblock = (ia) => (typeof ia.text === 'string' ? K.kryptos16.textZuBloecken(ia.text)[0] : zahl16(ia.block));

/** KRYPTOS-16 mit optionalem schritt (Plan M8 E124) als Zahl. */
function kryptos16Wert(ia) {
  const k16 = K.kryptos16;
  if (ia.schritt === 'rundenschluessel') return k16.rundenschluessel(zahl16(ia.schluessel), ia.runden);
  const x0 = startblock(ia);
  if (ia.schritt === 'sbox') return k16.sbox(x0);
  if (ia.schritt === 'sbox-inv') return k16.sbox(x0, 'ent');
  if (ia.schritt === 'transposition') return k16.transponiere(x0);
  if (Object.hasOwn(KETTENZUSTAENDE, ia.schritt || '')) {
    const r = k16.verschluesseln(x0, zahl16(ia.schluessel), { runden: ia.runden, protokoll: true }).runden;
    return r[ia.runden - 1][KETTENZUSTAENDE[ia.schritt]];
  }
  const f = ia.richtung === 'ent' ? k16.entschluesseln : k16.verschluesseln;
  return f(x0, zahl16(ia.schluessel), { runden: ia.runden });
}

/** Erwartetes Ergebnis (Neuberechnung, auch für die Diagnose); frei → undefined. Wirft KryptoFehler. */
function erwartet(ia) {
  switch (ia.operation) {
    case 'xor':
      return K.xorBits(...ia.operanden);
    case 'ascii':
      return ia.richtung === 'zu-text' ? K.bitsZuText(ia.bits) : K.textZuBits(ia.text, { gruppe: 0 });
    case 'kryptos16':
      return bits16(kryptos16Wert(ia));
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

/**
 * Bitfolge einer Antwort (Delta §5.2/§8.4): Trenner weg (normBits), ? = leere Stelle bleibt erhalten (Option A), damit
 * sich die Positionen nach einer Lücke nicht verschieben; nur ? → '' (leer, kein Fehlversuch). Lösungen: luecken false.
 */
function bitsAntwort(x, { luecken = true } = {}) {
  if (x === undefined || x === null) return '';
  if (typeof x !== 'string') throw new AntwortFehler('Antwort muss eine Bitfolge sein.');
  if (x.length > 4 * MAX_BITS) throw new AntwortFehler('Antwort ist zu lang.');
  const b = K.normBits(x);
  if (luecken ? /[^01?]/.test(b) : /[^01]/.test(b)) throw new AntwortFehler('Nur 0 und 1.');
  if (b.length > MAX_BITS) throw new AntwortFehler('Antwort ist zu lang.');
  return /^\?*$/.test(b) ? '' : b;
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
    if (typeof a === 'string' && /^[01?\s_|.]*$/.test(a)) return bitsAntwort(a);
    return textAntwort(a);
  }
  return bitsAntwort(auspacken(antwort, ['bits']));
}

const bereinige = (ia, antwort) => kanonisch(ia, antwort);

function istLeer(ia, a) {
  if (Array.isArray(a)) return a.length === 0;
  return a === '' || (typeof a === 'string' && !istTextAntwort(ia) && /^\?+$/.test(a));
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

/**
 * kryptos16 (Delta §8.4, Plan M8 E124): schritt aus der Liste; Kettenzustände nur mit richtung ver; genau eins von block
 * und text (2 Buchstaben A–Z), außer rundenschluessel (nur schluessel + runden); schluessel/runden Pflicht außer bei
 * sbox, sbox-inv, transposition (dort optional, ohne Wirkung); Einzelschritte ohne richtung.
 */
function validiereKryptos16(ia, fs, ort) {
  const schritt = ia.schritt;
  if (schritt !== undefined && !SCHRITTE.includes(schritt)) fs(ort, `schritt muss ${SCHRITTE.join(' | ')} sein.`);
  const kette = schritt === undefined || Object.hasOwn(KETTENZUSTAENDE, schritt);
  const einzel = EINZELSCHRITTE.includes(schritt);
  const ohneSchluessel = ['sbox', 'sbox-inv', 'transposition'].includes(schritt);
  if (schritt === 'rundenschluessel') {
    if (ia.block !== undefined || ia.text !== undefined) fs(ort, 'rundenschluessel braucht nur schluessel und runden (kein block, kein text).');
  } else if ((ia.block === undefined) === (ia.text === undefined)) {
    fs(ort, 'Es braucht genau eins von block und text.');
  } else if (ia.block !== undefined) {
    pruefeBitfolge(ia.block, 'block', 16, 16, fs, ort);
  } else if (typeof ia.text !== 'string' || !/^[A-Z]{2}$/.test(ia.text)) {
    fs(ort, 'text muss genau 2 Buchstaben A–Z haben (ASCII nach SPEC W3 §0a.1).');
  }
  if (!ohneSchluessel || ia.schluessel !== undefined) {
    if (ia.schluessel === undefined) fs(ort, 'schluessel fehlt (Bitfolge).');
    else pruefeBitfolge(ia.schluessel, 'schluessel', 16, 16, fs, ort);
  }
  if (!ohneSchluessel || ia.runden !== undefined) {
    if (!Number.isInteger(ia.runden) || ia.runden < 1 || ia.runden > 4) fs(ort, 'runden muss 1–4 sein.');
  }
  if (einzel && ia.richtung !== undefined) fs(ort, 'richtung gibt es bei Einzelschritten nicht.');
  else if (kette && schritt !== undefined && ia.richtung !== undefined && ia.richtung !== 'ver') fs(ort, 'Kettenzustände nur mit richtung ver.');
  else if (ia.richtung !== undefined && !['ver', 'ent'].includes(ia.richtung)) fs(ort, 'richtung muss ver oder ent sein.');
  if (ia.kippe !== undefined) fs(ort, 'kippe gibt es nur bei lawine.');
}

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
      ia.operanden.forEach((x, i) => pruefeBitfolge(x, `operanden[${i}]`, 8, 64, fs, ort));
      // gleiche Länge auch dann melden, wenn ein Operand außerhalb 8–64 Bit liegt
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
      validiereKryptos16(ia, fs, ort);
      break;
    case 'lawine':
      pruefeBitfolge(ia.block, 'block', 16, 16, fs, ort);
      pruefeBitfolge(ia.schluessel, 'schluessel', 16, 16, fs, ort);
      if (!Number.isInteger(ia.runden) || ia.runden < 1 || ia.runden > 4) fs(ort, 'runden muss 1–4 sein.');
      if (ia.text !== undefined || ia.schritt !== undefined) fs(ort, 'text und schritt gibt es bei lawine nicht.');
      if (!Number.isInteger(ia.kippe) || ia.kippe < 0 || ia.kippe > 15) fs(ort, 'kippe muss eine Bitposition 0–15 sein.');
      if (ia.richtung !== undefined) fs(ort, 'richtung gibt es bei lawine nicht.');
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
      if (typeof lo.bits === 'string') soll = bitsAntwort(lo.bits, { luecken: false });
      else soll = kanonisch(ia, { text: lo.text });
    } catch (e) {
      return fa(lort, `Lösung ist keine gültige Antwort: ${e.message}`);
    }
  } else {
    if (typeof lo.bits !== 'string') return fa(lort, 'bits (Lösung) fehlt.');
    try {
      soll = bitsAntwort(lo.bits, { luecken: false });
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
