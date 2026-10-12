'use strict';
// Hilfsfunktionen rund um das Aufgabenformat (SPEC §3–§5): Lücken finden, Interaktionen normalisieren.
// Registry: TECHNIK §4.2 (K01) – Blöcke, Interaktionen, Normalisierungen und Zusatzdiagnosen lassen sich von außen
// registrieren (Kryptos: src/krypto/index.js → registriere()); der Kern bleibt ohne Registrierung lauffähig.

const GAP_RE = /\[\[([A-Za-z0-9_-]{1,40})\]\]/g;

const BLOCK_TYPEN = ['text', 'code', 'struktogramm', 'tabelle', 'baum', 'reihung', 'raster', 'klassenkarte', 'adt', 'hinweis'];
const INTERAKTIONEN = ['gaps', 'choice', 'order', 'lines', 'match', 'tree', 'array', 'grid', 'adtsim'];
const ADT_ARTEN = ['stapel', 'schlange', 'dynarray'];
/** Interaktionen, für die eine Schrittprüfung (teilweise: true) erlaubt ist. */
const SCHRITT_ARTEN = ['tree:klick', 'array:tausch', 'array:klick', 'order'];
/** Bekannte Normalisierungen für gaps-Felder (Kern + registrierte). */
const NORMEN = ['code', 'text', 'exakt'];

/* ---------- Registry (K01) ---------- */

const BLOCK_REG = new Map();
const IA_REG = new Map();
const NORM_REG = new Map();
const DIAG_REG = new Map();
const IA_PFLICHT = ['bereinige', 'istLeer', 'pruefe', 'muster', 'validiere'];

function pruefeName(name, art) {
  if (typeof name !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(name)) throw new Error(`${art}: ungültiger Name „${name}“.`);
}

/** Blocktyp bekannt machen: { texte(b) → string[], validiere?(b, fe, we, kontext) }. */
function registriereBlock(typ, vertrag) {
  pruefeName(typ, 'Blocktyp');
  if (BLOCK_TYPEN.includes(typ) || BLOCK_REG.has(typ)) throw new Error(`Blocktyp „${typ}“ ist bereits registriert.`);
  if (!vertrag || typeof vertrag.texte !== 'function') throw new Error(`Blocktyp „${typ}“: texte(b) fehlt.`);
  if (vertrag.validiere !== undefined && typeof vertrag.validiere !== 'function') throw new Error(`Blocktyp „${typ}“: validiere ist keine Funktion.`);
  BLOCK_REG.set(typ, vertrag);
  BLOCK_TYPEN.push(typ);
}

/** Interaktion bekannt machen (Vertrag TECHNIK §4.3); art = kind ohne Modus. */
function registriereInteraktion(art, vertrag) {
  pruefeName(art, 'Interaktion');
  if (INTERAKTIONEN.includes(art) || IA_REG.has(art)) throw new Error(`Interaktion „${art}“ ist bereits registriert.`);
  for (const k of IA_PFLICHT) {
    if (!vertrag || typeof vertrag[k] !== 'function') throw new Error(`Interaktion „${art}“: ${k}() fehlt.`);
  }
  IA_REG.set(art, vertrag);
  INTERAKTIONEN.push(art);
}

/** Normalisierung für gaps-Felder (norm: name). */
function registriereNorm(name, fn) {
  pruefeName(name, 'Normalisierung');
  if (NORMEN.includes(name) || NORM_REG.has(name)) throw new Error(`Normalisierung „${name}“ ist bereits registriert.`);
  if (typeof fn !== 'function') throw new Error(`Normalisierung „${name}“: keine Funktion.`);
  NORM_REG.set(name, fn);
  NORMEN.push(name);
}

/** Zusatzdiagnose für Kern-Arten: fn(ia, lo, antwort, ergebnis) → Diagnose[]. */
function registriereDiagnose(art, fn) {
  if (typeof art !== 'string' || !art) throw new Error('Zusatzdiagnose: Art fehlt.');
  if (DIAG_REG.has(art)) throw new Error(`Zusatzdiagnose „${art}“ ist bereits registriert.`);
  if (typeof fn !== 'function') throw new Error(`Zusatzdiagnose „${art}“: keine Funktion.`);
  DIAG_REG.set(art, fn);
}

function interaktionVertrag(art) {
  return IA_REG.get(art) || null;
}
function blockVertrag(typ) {
  return BLOCK_REG.get(typ) || null;
}
function diagnoseFuer(art) {
  return DIAG_REG.get(art) || null;
}

function artVon(ia) {
  if (!ia || typeof ia !== 'object') return '';
  if (ia.kind === 'tree' || ia.kind === 'array') return `${ia.kind}:${ia.modus}`;
  return ia.kind;
}

function schrittErlaubt(ia) {
  const art = artVon(ia);
  if (SCHRITT_ARTEN.includes(art)) return true;
  const v = IA_REG.get(art);
  if (!v) return false;
  if (typeof v.schritt === 'function') return v.schritt(ia) === true;
  return v.schritt === true;
}

/** Feld-ids einer Interaktion, die Lücken [[id]] besitzen. */
function lueckenFelder(ia) {
  if (!ia || typeof ia !== 'object') return [];
  if (ia.kind === 'gaps') return ia.felder && typeof ia.felder === 'object' ? Object.keys(ia.felder) : [];
  const v = IA_REG.get(artVon(ia));
  if (v && typeof v.lueckenFelder === 'function') {
    const r = v.lueckenFelder(ia);
    return Array.isArray(r) ? r : [];
  }
  return [];
}

/** Interaktion(en) einer Aufgabe immer als Liste (mehrteilige Aufgaben = Array). */
function teile(aufgabe) {
  const ia = aufgabe.interaktion;
  const lo = aufgabe.loesung;
  if (Array.isArray(ia)) return ia.map((x, i) => ({ interaktion: x, loesung: Array.isArray(lo) ? lo[i] : undefined }));
  return [{ interaktion: ia, loesung: lo }];
}

/** Alle Zeichenketten eines Struktogramm-Knotens (rekursiv) einsammeln. */
function struktogrammTexte(knoten, out) {
  if (!Array.isArray(knoten)) return out;
  for (const k of knoten) {
    if (!k || typeof k !== 'object') continue;
    for (const key of ['anw', 'wenn', 'solange', 'zaehle', 'fuer', 'bis', 'gib', 'aufruf', 'kommentar']) {
      if (typeof k[key] === 'string') out.push(k[key]);
    }
    for (const key of ['dann', 'sonst', 'rumpf', 'wiederhole']) if (Array.isArray(k[key])) struktogrammTexte(k[key], out);
  }
  return out;
}

/** Alle Texte eines Blocks, in denen Lücken [[id]] stehen dürfen. */
function blockTexte(b) {
  const out = [];
  if (!b || typeof b !== 'object') return out;
  const push = (v) => {
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'number') out.push(String(v));
  };
  switch (b.t) {
    case 'text':
    case 'hinweis':
      push(b.md);
      break;
    case 'code':
      push(b.code);
      break;
    case 'struktogramm':
      push(b.kopf);
      struktogrammTexte(b.rumpf, out);
      break;
    case 'tabelle':
      (Array.isArray(b.kopf) ? b.kopf : []).forEach(push);
      (Array.isArray(b.zeilen) ? b.zeilen : []).forEach((z) => (Array.isArray(z) ? z.forEach(push) : null));
      break;
    case 'reihung':
      (Array.isArray(b.werte) ? b.werte : []).forEach(push);
      break;
    case 'raster':
      (Array.isArray(b.zeilen) ? b.zeilen : []).forEach((z) => (Array.isArray(z) ? z.forEach(push) : null));
      break;
    case 'klassenkarte':
      push(b.name);
      (Array.isArray(b.attribute) ? b.attribute : []).forEach(push);
      (Array.isArray(b.methoden) ? b.methoden : []).forEach(push);
      break;
    case 'adt':
      (Array.isArray(b.inhalt) ? b.inhalt : []).forEach(push);
      break;
    default: {
      const v = BLOCK_REG.get(b.t);
      if (v) {
        const t = v.texte(b);
        (Array.isArray(t) ? t : []).forEach((x) => (typeof x === 'string' ? out.push(x) : null));
      }
      break;
    }
  }
  return out;
}

/** Lücken-IDs in einer Blockliste (mit Vorkommen). */
function luecken(bloecke) {
  const res = [];
  (Array.isArray(bloecke) ? bloecke : []).forEach((b, i) => {
    for (const s of blockTexte(b)) {
      for (const m of s.matchAll(GAP_RE)) res.push({ id: m[1], block: i });
    }
  });
  return res;
}

/** Alle Lücken einer Aufgabe: im Inhalt und in optionalen Teil-Inhalten/Fragen. */
function alleLuecken(aufgabe) {
  const res = luecken(aufgabe.inhalt).map((x) => ({ ...x, ort: 'inhalt' }));
  const ias = Array.isArray(aufgabe.interaktion) ? aufgabe.interaktion : [aufgabe.interaktion];
  ias.forEach((ia, t) => {
    if (!ia || typeof ia !== 'object') return;
    if (Array.isArray(ia.inhalt)) for (const x of luecken(ia.inhalt)) res.push({ ...x, ort: `teil${t}` });
    for (const k of ['frage', 'md']) {
      if (typeof ia[k] === 'string') for (const m of ia[k].matchAll(GAP_RE)) res.push({ id: m[1], block: -1, ort: `teil${t}` });
    }
  });
  return res;
}

/* ---------- Normalisierung von Texteingaben ---------- */

/** Typografische Zeichen vereinheitlichen (iPad-Tastatur setzt „smarte“ Anführungszeichen usw.). */
function vereinheitliche(s) {
  return String(s)
    .normalize('NFC')
    .replace(/[“”„‟«»″]/g, '"')
    .replace(/[‘’‚‛′´`]/g, "'")
    .replace(/[−–—]/g, '-')
    .replace(/ /g, ' ')
    .replace(/<-/g, '←')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=');
}

function normText(s, norm) {
  const v = String(s);
  const fn = NORM_REG.get(norm);
  if (fn) return fn(v);
  switch (norm) {
    case 'exakt':
      return v.trim();
    case 'text':
      return vereinheitliche(v).trim().replace(/\s+/g, ' ').toLowerCase();
    case 'code':
    default:
      return vereinheitliche(v).replace(/\s+/g, '');
  }
}

/** Zahl aus Eingabe (Komma = Punkt), sonst NaN. */
function alsZahl(s) {
  if (typeof s === 'number') return s;
  const t = vereinheitliche(String(s)).trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return NaN;
  return Number(t);
}

module.exports = {
  GAP_RE,
  BLOCK_TYPEN,
  INTERAKTIONEN,
  ADT_ARTEN,
  SCHRITT_ARTEN,
  NORMEN,
  registriereBlock,
  registriereInteraktion,
  registriereNorm,
  registriereDiagnose,
  interaktionVertrag,
  blockVertrag,
  diagnoseFuer,
  lueckenFelder,
  artVon,
  schrittErlaubt,
  teile,
  blockTexte,
  luecken,
  alleLuecken,
  struktogrammTexte,
  vereinheitliche,
  normText,
  alsZahl
};
