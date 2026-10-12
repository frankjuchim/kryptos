'use strict';
// Hilfsfunktionen rund um das Aufgabenformat (SPEC §3–§5): Lücken finden, Interaktionen normalisieren.

const GAP_RE = /\[\[([A-Za-z0-9_-]{1,40})\]\]/g;

const BLOCK_TYPEN = ['text', 'code', 'struktogramm', 'tabelle', 'baum', 'reihung', 'raster', 'klassenkarte', 'adt', 'hinweis'];
const INTERAKTIONEN = ['gaps', 'choice', 'order', 'lines', 'match', 'tree', 'array', 'grid', 'adtsim'];
const ADT_ARTEN = ['stapel', 'schlange', 'dynarray'];
/** Interaktionen, für die eine Schrittprüfung (teilweise: true) erlaubt ist. */
const SCHRITT_ARTEN = ['tree:klick', 'array:tausch', 'array:klick', 'order'];

function artVon(ia) {
  if (!ia || typeof ia !== 'object') return '';
  if (ia.kind === 'tree' || ia.kind === 'array') return `${ia.kind}:${ia.modus}`;
  return ia.kind;
}

function schrittErlaubt(ia) {
  return SCHRITT_ARTEN.includes(artVon(ia));
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
    default:
      break;
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
