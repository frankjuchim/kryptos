'use strict';
// Prüfer für alle Interaktionsarten (SPEC §5). Prüfung NUR serverseitig.
// Jede Funktion ist rein (keine DB), damit sie einzeln testbar ist.

const Baum = require('../../public/static/js/shared/baum');
const F = require('./format');

class AntwortFehler extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const MAX_LISTE = 300;
const MAX_TEXT = 500;

/* ---------- Antworten vereinheitlichen (großzügig: Objekt-Hüllen wie in der Lösung erlaubt) ---------- */

function auspacken(antwort, schluessel) {
  if (antwort && typeof antwort === 'object' && !Array.isArray(antwort) && schluessel in antwort) return antwort[schluessel];
  return antwort;
}

function liste(v, name) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new AntwortFehler(`Antwort (${name}) muss eine Liste sein.`);
  if (v.length > MAX_LISTE) throw new AntwortFehler(`Antwort (${name}) ist zu lang.`);
  return v;
}

function text(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v !== 'string') throw new AntwortFehler('Antwort muss Text sein.');
  if (v.length > MAX_TEXT) throw new AntwortFehler('Antwort ist zu lang.');
  return v;
}

function ganzzahl(v) {
  const n = typeof v === 'string' && /^-?\d+$/.test(v.trim()) ? Number(v) : v;
  if (!Number.isInteger(n)) throw new AntwortFehler('Antwort muss ganze Zahlen enthalten.');
  return n;
}

/** Antwort eines Teils in die kanonische Form bringen (wirft AntwortFehler bei unbrauchbarer Form). */
function bereinige(ia, antwort) {
  switch (F.artVon(ia)) {
    case 'gaps': {
      const a = antwort && typeof antwort === 'object' && !Array.isArray(antwort) ? antwort : {};
      const out = {};
      for (const id of Object.keys(ia.felder || {})) out[id] = text(a[id]);
      return out;
    }
    case 'choice':
      return [...new Set(liste(auspacken(antwort, 'gewaehlt'), 'Auswahl').map((x) => text(x)))];
    case 'order':
      return liste(auspacken(antwort, 'reihenfolge'), 'Reihenfolge').map((x) => text(x));
    case 'lines':
      return [...new Set(liste(auspacken(antwort, 'zeilen'), 'Zeilen').map(ganzzahl))];
    case 'match': {
      const a = antwort && typeof antwort === 'object' && !Array.isArray(antwort) ? antwort : {};
      const out = {};
      for (const e of ia.elemente || []) if (a[e.id] !== undefined && a[e.id] !== null && a[e.id] !== '') out[e.id] = text(a[e.id]);
      return out;
    }
    case 'tree:klick':
      return liste(auspacken(antwort, 'folge'), 'Folge').map((x) => {
        const p = text(x);
        if (!/^[LR]*$/.test(p)) throw new AntwortFehler('Ungültiger Knotenpfad.');
        return p;
      });
    case 'tree:bauen': {
      const s = text(auspacken(antwort, 'baum'));
      return s.trim() === '' ? '-' : s;
    }
    case 'array:tausch':
      return liste(auspacken(antwort, 'tausche'), 'Tausche').map((p) => {
        if (!Array.isArray(p) || p.length !== 2) throw new AntwortFehler('Ein Tausch besteht aus zwei Indizes.');
        return [ganzzahl(p[0]), ganzzahl(p[1])];
      });
    case 'array:klick':
      return liste(auspacken(antwort, 'folge'), 'Folge').map(ganzzahl);
    case 'grid':
      return liste(auspacken(antwort, 'zellen'), 'Zellen').map((p) => {
        if (!Array.isArray(p) || p.length !== 2) throw new AntwortFehler('Eine Zelle besteht aus Zeile und Spalte.');
        return [ganzzahl(p[0]), ganzzahl(p[1])];
      });
    case 'adtsim':
      return liste(auspacken(antwort, 'inhalt'), 'Inhalt').map((x) => text(x));
    default:
      throw new AntwortFehler('Unbekannte Interaktion.');
  }
}

/** Ist die (bereinigte) Antwort leer, sodass kein Fehlversuch gezählt werden sollte? */
function istLeer(ia, a) {
  switch (F.artVon(ia)) {
    case 'gaps':
      return Object.values(a).every((v) => String(v).trim() === '');
    case 'match':
      return Object.keys(a).length === 0;
    case 'choice':
    case 'order':
    case 'lines':
    case 'tree:klick':
    case 'array:klick':
    case 'grid':
      return a.length === 0;
    default:
      return false;
  }
}

/* ---------- Einzelprüfer ---------- */

function feldRichtig(feld, eingabe, akzeptiert) {
  const liste = Array.isArray(akzeptiert) ? akzeptiert : [akzeptiert];
  const typ = (feld && feld.typ) || 'text';
  if (String(eingabe).trim() === '') return false;
  for (const acc of liste) {
    if (acc === undefined || acc === null) continue;
    if (typ === 'zahl') {
      const a = F.alsZahl(eingabe);
      const b = F.alsZahl(acc);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        if (Math.abs(a - b) <= 1e-9) return true;
        continue;
      }
      if (F.normText(eingabe, 'code') === F.normText(acc, 'code')) return true;
    } else if (typ === 'auswahl') {
      if (String(eingabe) === String(acc)) return true;
    } else if (F.normText(eingabe, feld.norm || 'code') === F.normText(acc, feld.norm || 'code')) {
      return true;
    }
  }
  return false;
}

function pruefeGaps(ia, lo, a) {
  const felder = {};
  let ok = true;
  for (const [id, feld] of Object.entries(ia.felder || {})) {
    const r = feldRichtig(feld, a[id] ?? '', lo ? lo[id] : undefined);
    felder[id] = r;
    if (!r) ok = false;
  }
  return { ok, felder };
}

function mengeGleich(a, b) {
  const sa = new Set(a.map(String));
  const sb = new Set(b.map(String));
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

function pruefeChoice(ia, lo, a) {
  return { ok: mengeGleich(a, (lo && lo.richtig) || []) };
}

/** Längstes gemeinsames Präfix mit einer der Lösungsfolgen; vergleiche(x, y) → bool. */
function folgenPruefung(antwort, loesungen, vergleiche, teilweise) {
  let best = 0;
  let voll = false;
  for (const l of loesungen) {
    let k = 0;
    while (k < antwort.length && k < l.length && vergleiche(antwort[k], l[k])) k++;
    if (k > best) best = k;
    if (k === antwort.length && k === l.length) voll = true;
  }
  if (teilweise) {
    const ok = best === antwort.length;
    return { ok, vollstaendig: ok && voll, ersteFalschePosition: ok ? null : best };
  }
  return { ok: voll, ersteFalschePosition: voll ? null : best };
}

function pruefeOrder(ia, lo, a, teilweise) {
  const loesungen = (lo && Array.isArray(lo.reihenfolgen) ? lo.reihenfolgen : []).filter(Array.isArray);
  return folgenPruefung(a, loesungen, (x, y) => String(x) === String(y), teilweise);
}

function pruefeLines(ia, lo, a) {
  return { ok: mengeGleich(a, (lo && lo.zeilen) || []) };
}

function pruefeMatch(ia, lo, a) {
  const elemente = {};
  let ok = true;
  for (const e of ia.elemente || []) {
    const r = a[e.id] !== undefined && lo && String(lo[e.id]) === String(a[e.id]);
    elemente[e.id] = r;
    if (!r) ok = false;
  }
  return { ok, elemente };
}

function pruefeTreeKlick(ia, lo, a, teilweise) {
  return folgenPruefung(a, [(lo && lo.folge) || []], (x, y) => x === y, teilweise);
}

function pruefeTreeBauen(ia, lo, a) {
  try {
    return { ok: Baum.normalize(a) === Baum.normalize(String(lo && lo.baum)) };
  } catch {
    return { ok: false };
  }
}

function paarGleich(x, y) {
  return (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0]);
}

function pruefeArrayTausch(ia, lo, a, teilweise) {
  const sol = ((lo && lo.tausche) || []).map((p) => [Number(p[0]), Number(p[1])]);
  return folgenPruefung(a, [sol], paarGleich, teilweise);
}

function pruefeArrayKlick(ia, lo, a, teilweise) {
  return folgenPruefung(a, [((lo && lo.folge) || []).map(Number)], (x, y) => x === y, teilweise);
}

function pruefeGrid(ia, lo, a) {
  const sol = ((lo && lo.zellen) || []).map((p) => `${Number(p[0])},${Number(p[1])}`);
  const ant = a.map((p) => `${p[0]},${p[1]}`);
  if (lo && lo.reihenfolge === true) {
    return { ok: sol.length === ant.length && sol.every((x, i) => x === ant[i]) };
  }
  return { ok: mengeGleich(ant, sol) };
}

function adtWert(x) {
  return F.normText(x, 'code');
}

function pruefeAdtsim(ia, lo, a) {
  const sol = ((lo && lo.inhalt) || []).map((x) => adtWert(x));
  const ant = a.map(adtWert);
  let k = 0;
  while (k < ant.length && k < sol.length && ant[k] === sol[k]) k++;
  const ok = k === ant.length && k === sol.length;
  return { ok, ersteFalschePosition: ok ? null : k };
}

/**
 * Einen Teil prüfen.
 * @param {object} ia Interaktion
 * @param {*} lo Lösung des Teils
 * @param {*} antwort bereinigte Antwort
 * @param {boolean} teilweise Schrittprüfung
 */
function pruefeTeil(ia, lo, antwort, teilweise = false) {
  const art = F.artVon(ia);
  if (teilweise && !F.schrittErlaubt(ia)) throw new AntwortFehler('Schrittprüfung ist für diese Interaktion nicht vorgesehen.');
  switch (art) {
    case 'gaps':
      return pruefeGaps(ia, lo, antwort);
    case 'choice':
      return pruefeChoice(ia, lo, antwort);
    case 'order':
      return pruefeOrder(ia, lo, antwort, teilweise);
    case 'lines':
      return pruefeLines(ia, lo, antwort);
    case 'match':
      return pruefeMatch(ia, lo, antwort);
    case 'tree:klick':
      return pruefeTreeKlick(ia, lo, antwort, teilweise);
    case 'tree:bauen':
      return pruefeTreeBauen(ia, lo, antwort);
    case 'array:tausch':
      return pruefeArrayTausch(ia, lo, antwort, teilweise);
    case 'array:klick':
      return pruefeArrayKlick(ia, lo, antwort, teilweise);
    case 'grid':
      return pruefeGrid(ia, lo, antwort);
    case 'adtsim':
      return pruefeAdtsim(ia, lo, antwort);
    default:
      throw new AntwortFehler('Unbekannte Interaktion.');
  }
}

/**
 * Ganze Aufgabe prüfen.
 * @param {object} aufgabe vollständige Aufgabe (mit loesung)
 * @param {*} antwort Einzelantwort oder (mehrteilig) Liste von Antworten
 * @param {{teilweise?: boolean, teil?: number}} [opt]
 * @returns {{ok:boolean, leer:boolean, teile:object[], vollstaendig?:boolean, ersteFalschePosition?:number|null, antworten:any[]}}
 */
function pruefeAufgabe(aufgabe, antwort, opt = {}) {
  const ts = F.teile(aufgabe);
  const mehrteilig = Array.isArray(aufgabe.interaktion);
  if (opt.teilweise) {
    const t = mehrteilig ? Number(opt.teil ?? 0) : 0;
    if (!Number.isInteger(t) || t < 0 || t >= ts.length) throw new AntwortFehler('Ungültiger Teil.');
    // Bei der Schrittprüfung ist „antwort“ immer die Antwort des einen Teils „teil“.
    const a = bereinige(ts[t].interaktion, antwort);
    // Bug-Hunt gestuft: Teil a) (Zeilenwahl) einer mehrteiligen Aufgabe darf einzeln geprüft werden, bevor die
    // späteren Teile (die die Zeile verraten) angezeigt werden – Ergebnis nur richtig/falsch, nie „vollständig“.
    const bugHuntTeilA = mehrteilig && t === 0 && ts.length > 1 && F.artVon(ts[0].interaktion) === 'lines';
    const r = bugHuntTeilA ? { ok: pruefeLines(ts[0].interaktion, ts[0].loesung, a).ok } : pruefeTeil(ts[t].interaktion, ts[t].loesung, a, true);
    return { ok: r.ok, teilweise: true, teil: t, vollstaendig: !!r.vollstaendig, ersteFalschePosition: r.ersteFalschePosition ?? null, leer: false, antworten: [a] };
  }
  let roh;
  if (mehrteilig) {
    if (!Array.isArray(antwort)) throw new AntwortFehler('Mehrteilige Aufgabe: Antwort muss eine Liste (je Teil) sein.');
    if (antwort.length > ts.length) throw new AntwortFehler('Zu viele Teilantworten.');
    roh = ts.map((_, i) => antwort[i]);
  } else {
    roh = [antwort];
  }
  const antworten = ts.map((t, i) => bereinige(t.interaktion, roh[i]));
  const leer = ts.every((t, i) => istLeer(t.interaktion, antworten[i]));
  const ergebnisse = ts.map((t, i) => pruefeTeil(t.interaktion, t.loesung, antworten[i], false));
  const ok = ergebnisse.every((r) => r.ok);
  const out = { ok, leer, teile: ergebnisse, antworten };
  if (!mehrteilig) {
    const r = ergebnisse[0];
    if ('ersteFalschePosition' in r) out.ersteFalschePosition = r.ersteFalschePosition;
    if (r.felder) out.felder = r.felder;
    if (r.elemente) out.elemente = r.elemente;
  }
  return out;
}

/** „Musterantwort“ eines Teils aus der Lösung (für Validator und Anzeige). */
function musterantwort(ia, lo) {
  switch (F.artVon(ia)) {
    case 'gaps': {
      const out = {};
      for (const id of Object.keys(ia.felder || {})) {
        const v = lo ? lo[id] : undefined;
        out[id] = Array.isArray(v) ? String(v[0]) : v === undefined ? '' : String(v);
      }
      return out;
    }
    case 'choice':
      return (lo && lo.richtig) || [];
    case 'order':
      return (lo && lo.reihenfolgen && lo.reihenfolgen[0]) || [];
    case 'lines':
      return (lo && lo.zeilen) || [];
    case 'match':
      return lo || {};
    case 'tree:klick':
      return (lo && lo.folge) || [];
    case 'tree:bauen':
      return (lo && lo.baum) || '-';
    case 'array:tausch':
      return (lo && lo.tausche) || [];
    case 'array:klick':
      return (lo && lo.folge) || [];
    case 'grid':
      return (lo && lo.zellen) || [];
    case 'adtsim':
      return (lo && lo.inhalt) || [];
    default:
      return null;
  }
}

function musterantwortAufgabe(aufgabe) {
  const ts = F.teile(aufgabe);
  const m = ts.map((t) => musterantwort(t.interaktion, t.loesung));
  return Array.isArray(aufgabe.interaktion) ? m : m[0];
}

/** Kurzform einer Antwort für die Statistik „häufig falsche Antworten“. */
function antwortKurz(antworten) {
  try {
    const s = JSON.stringify(antworten.length === 1 ? antworten[0] : antworten);
    return s.length > 300 ? s.slice(0, 297) + '…' : s;
  } catch {
    return '';
  }
}

module.exports = {
  AntwortFehler,
  bereinige,
  istLeer,
  feldRichtig,
  pruefeTeil,
  pruefeAufgabe,
  musterantwort,
  musterantwortAufgabe,
  antwortKurz
};
