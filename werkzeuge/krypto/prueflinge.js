'use strict';
// Prüflinge für die Verrat-Tests der Werkzeuge (Plan M11 Task 241, E211, E212, E224, E225) und Helfer des
// Lösungsverrat-Tests (test/inhalte_loesungsverrat.test.js importiert loesungsWerte, loesungen, zaehlt, papierPrueflinge …
// von hier – K1–K10 unverändert).
//
// Prüfling = alles, was Lernende vor dem Lösen sehen und dessen Lösung ein Werkzeug ausrechnen könnte:
//   lab, archivfund, boss (Seeds W0–W6), gast (seed/gast/demo.json), warmup (seed/warmup/w<n>.json) und papier
//   (Schülerfassungen: Papier-Bosse, Probeklausuren, Warm-up-Karten der Materialien, Akten-Aufträge, Abi-Checks).
// angaben(p) liest aus dem sichtbaren Teil die Werte, die Lernende in ein Werkzeug eintippen könnten (Texte, Schlüssel,
// Zahlen, Bits); istVerrat(ausgaben, p) entscheidet nach E225, ob eine Werkzeug-Ausgabe eine Lösung enthält.
// Nur Lesen der Seeds und Materialquellen, keine Rechnung außer über Krypto.* (Normalisierung, KRYPTOS-Hash).
const fs = require('node:fs');
const path = require('node:path');
const Krypto = require('../../public/static/js/shared/krypto.js');

const WURZEL = path.join(__dirname, '..', '..');
const WELTEN = [0, 1, 2, 3, 4, 5, 6];
const MAT = path.join(WURZEL, 'quellen', 'material');
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const N = (t) => Krypto.normalisieren(String(t ?? ''));
const kurz = (x) => typeof x === 'string' && [...x].length <= 2;
// Layout-Angaben (Zahlen, die kein Inhalt sind)
const LAYOUT = new Set(['breite', 'breiten', 'hoehe', 'stufe', 'punkte', 'version', 'groesse', 'schrift', 'anteil', 'nach', 'breite_cm', 'minuten', 'anzahl', 'block', 'basis', 'nr']);

let chiffreModul = null;
function CHIFFRE() {
  if (!chiffreModul) {
    require('../../src/krypto').registriere();
    chiffreModul = require('../../src/krypto/interaktionen/chiffre');
  }
  return chiffreModul;
}

const seedCache = new Map();
/** Seed der Welt (0–6), Gast (8) oder null */
function seed(welt) {
  if (!seedCache.has(welt)) {
    const p = welt === 8 ? path.join(WURZEL, 'seed', 'gast', 'demo.json') : path.join(WURZEL, 'seed', 'welten', `welt${welt}.json`);
    seedCache.set(welt, fs.existsSync(p) ? json(p) : null);
  }
  return seedCache.get(welt);
}
function warmup(welt) {
  const p = path.join(WURZEL, 'seed', 'warmup', `w${welt}.json`);
  return fs.existsSync(p) ? json(p) : null;
}

/** Rohtexte eines JSON-Werts. Listen aus Einzelzeichen (Zeilen, Zellen) zusätzlich als ein Stück; Playfair-/Polybios-
 * Quadrate mit Schlüssel ausgerechnet; Akten-Quadrate als ein Stück; bits-Zeilen einzeln. */
function rohtexte(wert, { ohne = [], verbinden = true } = {}) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string') return out.push(x);
    if (Array.isArray(x)) {
      const flach = x.flat();
      if (verbinden && flach.length >= 2 && flach.every(kurz)) out.push(flach.join(''));
      return x.forEach(lauf);
    }
    if (!x || typeof x !== 'object') return;
    if (x.nur_loesung === true) return;
    // Häufigkeitsdiagramm: der Text erscheint nur als Balken (Zählung), nie lesbar
    if (x.t === 'haeufigkeit' && typeof x.text === 'string') return lauf({ ...x, text: undefined, t: undefined });
    // Alphabet-/Quadratzeile mit „leer“: in der Schülerfassung leer gedruckt (kr_docx.py), Werte nur in der Lösung
    if (x.leer === true) return;
    if (x.t === 'quadrat' && (x.art === 'playfair' || x.art === 'polybios') && typeof x.schluessel === 'string' && !Array.isArray(x.zellen)) {
      out.push(Krypto.quadrat(x.schluessel, { groesse: x.groesse || 5 }).join(''));
    }
    if (x.t === 'quadrat' && Array.isArray(x.zeilen) && x.zeilen.every((z) => typeof z === 'string')) out.push(x.zeilen.join(''));
    for (const [k, v] of Object.entries(x)) {
      if (ohne.includes(k) || k.startsWith('_')) continue;
      if (typeof v === 'number') { if (!LAYOUT.has(k)) out.push(String(v)); continue; }
      lauf(v);
    }
  })(wert);
  return out;
}

const woerterVon = (s) => String(s).split(/[^0-9A-Za-zÄÖÜäöüß]+/).map(N).filter(Boolean);
// ganze Zahlen und Dezimalzahlen (Komma); nicht Teil von Kennungen (W3, P7), Potenzen (10²⁶, 15^4^) oder Datumsangaben
const HOCH = '⁰¹²³⁴⁵⁶⁷⁸⁹^';
const ZAHL = new RegExp(`(?<![\\d,.A-Za-z_])\\d+(?:,\\d+)?(?![\\d${HOCH}]|[,.]\\d)`, 'g');
const zahlenVon = (s) => String(s).match(ZAHL) || [];
const BITS = /[01]{4}(?:[  ·|_]*[01]{4})*/g;
const bitsVon = (s) => (String(s).replace(/`/g, '').match(BITS) || []).map((b) => b.replace(/[^01]/g, '')).filter((b) => b.length >= 8);

/** Fundstelle aus Rohtexten */
function stelle(quelle, roh, extra = {}) {
  return {
    quelle, ...extra, roh,
    stuecke: roh.map(N).filter(Boolean),
    woerter: new Set(roh.flatMap(woerterVon)),
    zahlen: roh.map(zahlenVon),
    bits: roh.flatMap(bitsVon)
  };
}

const istBits = (w) => /^[01][01\s]*$/.test(w) && w.replace(/\s/g, '').length >= 8;
const istZahl = (w) => /^-?\d+(,\d+)?$/.test(w.trim());
const bedeutend = (z) => z.includes(',') || z.replace(/\D/g, '').length >= 3;

/** Lösungswerte einer Aufgabe: [{ teil, feld, art: text|bits|zahl, wert, n }] */
function loesungsWerte(a) {
  const out = [];
  const teile = [].concat(a.interaktion || []);
  for (const [i, lo] of [].concat(a.loesung || []).entries()) {
    if (!lo || typeof lo !== 'object') continue;
    const ia = teile[i] || {};
    // match: Lösung = ids der Kategorien (Begriffe, im Client sichtbar) – kein Lösungstext (Plan M8 Task 179)
    if (ia.kind === 'match') continue;
    // Klapplisten: die Lösung steht ohnehin als Option im Client (Plan M8 Task 178)
    const auswahl = new Set(Object.entries(ia.felder || {}).filter(([, f]) => f && f.typ === 'auswahl').map(([id]) => id));
    const luecken = [];
    for (const [k, v] of Object.entries(lo)) {
      if (k.startsWith('_') || ['richtig', 'zuordnung', 'reihenfolge'].includes(k) || auswahl.has(k)) continue;
      const werte = (Array.isArray(v) ? v : [v]).filter((x) => typeof x === 'string' || typeof x === 'number').map(String);
      const bitsFeld = ia.kind === 'bits-rechnen' || (ia.felder && ia.felder[k] && ia.felder[k].norm === 'bits');
      for (const w of werte) out.push({ teil: i, feld: k, wert: w, bitsFeld });
      if (Array.isArray(v) && typeof v[0] === 'string') luecken.push(v[0]);
    }
    // Lückenwerte hintereinander (Zeilen eines Quadrats, ein Alphabet) und Folgen kurzer Lückenwerte für sich
    // (z. B. eine Lesereihenfolge 0 5 2 7 4 1 6 3 neben einem Zwischentext, Plan M8 E137)
    if (luecken.length > 1 && !luecken.every(istZahl)) out.push({ teil: i, feld: '*', wert: luecken.join(''), folge: true });
    let lauf = [];
    for (const x of [...luecken, null]) {
      if (x !== null && kurz(x)) { lauf.push(x); continue; }
      if (lauf.length > 1 && lauf.length < luecken.length) out.push({ teil: i, feld: '*', wert: lauf.join(''), folge: true });
      lauf = [];
    }
  }
  return out.map((x) => {
    const w = String(x.wert).trim();
    if (istBits(w) || (x.bitsFeld && /^[01\s]+$/.test(w))) return { ...x, art: 'bits', n: w.replace(/\s/g, '') };
    if (istZahl(w) && !x.folge) return { ...x, art: 'zahl', n: w.replace(/^-/, '') };
    return { ...x, art: 'text', n: N(w) };
  });
}

/** Zählt der Wert für K1–K3? */
function zaehlt(x) {
  if (x.art === 'bits') return x.n.length >= 8;
  if (x.art === 'zahl') return bedeutend(x.n);
  return x.n.length >= 4 && new Set(x.n).size >= 3 && !/^[01]+$/.test(x.n);
}

/** Lösungen (K1–K3) als normalisierte Liste – für den Muster-Test und andere Tests */
function loesungen(a) {
  return [...new Set(loesungsWerte(a).filter(zaehlt).map((x) => x.n))];
}

/** Sichtbarer Teil einer Aufgabe (was der Server vor dem Lösen schickt): Kopf und je Teil die Interaktion */
function sichtbar(a, rolle) {
  const mitRolle = { ...a, _rolle: rolle };
  const ein = (ia) => (ia && ia.kind === 'chiffre' ? CHIFFRE().oeffentlich(ia, { aufgabe: mitRolle }) : ia);
  const teile = [].concat(a.interaktion || []).map(ein);
  return {
    kopf: rohtexte({ titel: a.titel, inhalt: a.inhalt }),
    teile: teile.map((ia) => rohtexte(ia)),
    interaktionen: teile,
    einzeln: rohtexte({ titel: a.titel, inhalt: a.inhalt, teile }, { verbinden: false })
  };
}

/* ---------- Papier-Materialien (Schülerfassungen) ---------- */

/** Felder der Lösungs-/EH-Fassung (nie in der Schülerfassung, kr_docx.py) */
const NUR_LSG = ['loesung', 'erwartung', 'alternativen', 'fehler', 'notenschluessel', 'notizen'];
const quellDateien = (ordner, muster) => (fs.existsSync(ordner) ? fs.readdirSync(ordner).filter((x) => muster.test(x)).sort() : []);

/** Papier-Prüfungen, die Lernende vor dem Lösen sehen: Papier-Bosse W0–W5 (ihre Welt) und die Probeklausuren (Welt 6, Stoff aller Welten) */
function papierPruefungen() {
  const out = [];
  for (const w of WELTEN) for (const d of quellDateien(path.join(MAT, `W${w}`), /^boss_W\d\.json$/)) out.push({ datei: d, welt: w, q: json(path.join(MAT, `W${w}`, d)) });
  for (const d of quellDateien(path.join(MAT, 'Pruefungen'), /Probeklausur.*\.json$/)) out.push({ datei: d, welt: 6, alle: true, q: json(path.join(MAT, 'Pruefungen', d)) });
  return out;
}

/** Bewertungs-, Fach- und Füllwörter, die in Lösungen fett/kursiv betont werden (auch am Anfang einer Wendung) – kein Klar- oder Geheimtext */
const BEWERTUNG = new Set(['nicht', 'dann', 'alle', 'beide', 'beiden', 'einem', 'viele', 'anderen', 'denselben', 'rechts', 'oberen', 'unteren',
  'hinteren', 'nein', 'falsch', 'falschen', 'korrekt', 'richtig', 'gültig', 'ungültig', 'sicher', 'unsicher', 'prüfen', 'finden', 'existieren',
  'paarweise', 'effektiven', 'teilerfremd', 'symmetrisch', 'asymmetrisch', 'monoalphabetisch', 'polyalphabetisch', 'permutationsinvariant',
  'öffentlichen', 'privaten', 'nur', 'ihrem', 'mit', 'ein', 'eine', 'kein', 'genau', 'immer'].map(N));
/** Feste Konstanten (Design §6: I_D, I_Z) – überall gegeben, kein Ergebnis */
const KONSTANTEN = new Set(['0,076', '0,038']);
const MARKE = /\*\*([^*]+?)\*\*|(?<![*\w])\*([^*\s][^*]*?)\*(?![*\w])|`([^`]+)`|==([^=]+)==/g;
/**
 * Lösungswerte aus einem Lösungstext (Erwartungshorizont, Lösungskasten, Kartenrückseite): Bitfolgen (≥ 8 Bit), Zahlen
 * als Ergebnis (fett oder nach ≈; ≥ 3 Ziffern oder mit Komma – Zwischenrechnungen wie 13² = 169 zählen nicht), markierte Geheimtexte (GROSS) und Klartexte
 * (klein, ein Wort) sowie ganze Zellen in GROSS.
 */
function werteAusLoesung(roh) {
  const out = [];
  const neu = (x) => { if (zaehlt(x) && !KONSTANTEN.has(x.n) && !out.some((o) => o.art === x.art && o.n === x.n)) out.push(x); };
  for (const t of roh) {
    const s = String(t);
    for (const b of bitsVon(s)) if (/0/.test(b) && /1/.test(b)) neu({ art: 'bits', n: b });
    // Zahlen ohne führende Null (0100 ist eine Bitgruppe)
    for (const m of s.matchAll(new RegExp(`(?:≈\\s*\\**\\s*|\\*\\*)((?:0|[1-9]\\d*)(?:,\\d+)?)(?![\\d${HOCH}]|[,.]\\d)`, 'g'))) neu({ art: 'zahl', n: m[1] });
    for (const m of s.matchAll(MARKE)) {
      const v = (m[1] ?? m[2] ?? m[3] ?? m[4]).trim().replace(/^[„“"»]+|[“"«]+$/g, '').trim();
      // „`ZIGNS HEGYW` → *diegaleere*“: links vom Pfeil steht die Eingabe
      if (/^\s*→/.test(s.slice(m.index + m[0].length))) continue;
      if (/^[01\s]+$/.test(v)) continue;
      // Zahl, Geheimtext (GROSS) oder Klartext (klein, Design §6) – außer betonten Bewertungs- und Fachwörtern
      if (/^(?:0|[1-9]\d*)(,\d+)?$/.test(v)) neu({ art: 'zahl', n: v });
      else if (/^[A-ZÄÖÜ]+(?:\s[A-ZÄÖÜ]+)*$/.test(v)) neu({ art: 'text', n: N(v) });
      else if (/^[a-zäöüß]+(?: [a-zäöüß]+)*$/.test(v) && !BEWERTUNG.has(N(v)) && !BEWERTUNG.has(N(v.split(' ')[0]))) neu({ art: 'text', n: N(v) });
    }
    if (/^\s*[A-Z]{4,}(?:\s[A-Z]+)*\s*$/.test(s)) neu({ art: 'text', n: N(s) });
  }
  return out;
}

/** Steht der Wert x schon im eigenen Text (dann ist er gegeben, keine Lösung)? – großzügig: auch als Teilstück */
function gegeben(x, eigen) {
  if (x.art === 'bits') return eigen.bits.some((b) => b.includes(x.n));
  if (x.art === 'zahl') return eigen.zahlen.some((l) => l.includes(x.n));
  return eigen.stuecke.some((t) => t.includes(x.n));
}

/**
 * Prüflinge aus Papier-Materialien: Teilaufgaben der Papier-Bosse und Probeklausuren, Warm-up-Karten, Aufträge und
 * Abi-Check-Teile der Akten – je { id, welt, alle, werte, ich (eigene Fundstellen), folien (Folien zählen), eigen (Rohtexte) }.
 */
function papierPrueflinge() {
  const out = [];
  const neu = (p, eigenRoh, loesungRoh, sicht = eigenRoh) => {
    const eigen = stelle('', eigenRoh);
    out.push({ ...p, sicht, werte: werteAusLoesung(loesungRoh).filter((x) => !gegeben(x, eigen)) });
  };
  for (const pr of papierPruefungen()) {
    const kopf = rohtexte({ titel: pr.q.titel, rahmen: pr.q.rahmen, hinweise: pr.q.hinweise }, { ohne: NUR_LSG });
    for (const a of pr.q.aufgaben || []) {
      for (const t of a.teile || []) {
        const teil = `${a.nr || ''}${t.bez}`;
        const eigen = [...kopf, ...rohtexte({ text: t.text, material: t.material }, { ohne: NUR_LSG })];
        neu({ id: `${pr.datei} ${teil}`, welt: pr.welt, alle: pr.alle, folien: !pr.alle, ich: (s) => s.doc === pr.datei && s.teil === teil },
          eigen, rohtexte(t.erwartung || []), [...eigen, ...rohtexte({ titel: a.titel, material: a.material }, { ohne: NUR_LSG })]);
      }
    }
  }
  for (const w of WELTEN) {
    for (const d of quellDateien(path.join(MAT, `W${w}`), /^warmup_W\d\.json$/)) {
      for (const k of json(path.join(MAT, `W${w}`, d)).karten) {
        neu({ id: k.id, welt: w, folien: true, ich: (s) => s.karte === k.id }, rohtexte([k.titel, k.aufgabe]), rohtexte(k.loesung));
      }
    }
    for (const d of quellDateien(path.join(MAT, `W${w}`), /^akte_.*\.json$/)) {
      json(path.join(MAT, `W${w}`, d)).bloecke.forEach((b, i) => {
        if (b.t === 'auftrag' && b.loesung) {
          neu({ id: `${d} Auftrag ${b.nr}`, welt: w, ich: (s) => s.doc === d && s.block === String(i) }, rohtexte(b, { ohne: NUR_LSG }), rohtexte(b.loesung));
        }
        if (b.t === 'abicheck') {
          for (const t of b.teile || []) {
            neu({ id: `${d} Abi-Check ${t.bez}`, welt: w, ich: (s) => s.doc === d && s.block === `${i}${t.bez}` },
              rohtexte({ material: b.material, teil: t }, { ohne: NUR_LSG }), rohtexte(t.loesung || []));
          }
        }
      });
    }
  }
  return out;
}

/* ---------- Beschriftungen (Etiketten) der Zahlen-Lücken (K5, E225) ---------- */

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Nummerierung und ASCII-Konstanten aus einem Text entfernen (A = 1 … Z = 26, a = 1 … z = 26, A = 65) */
const ohneNummerierung = (t) => String(t)
  .replace(/(^|[^\p{L}])[A-Za-z]\s*=\s*\d+\s*…\s*[A-Za-z]\s*=\s*\d+/gu, '$1')
  .replace(/[`'„“"]?[Aa][`'“"]?\s*=\s*(65|97)\b/g, '');

/**
 * Beschriftungen der Zahlen-Lücken einer Aufgabe: { feld: [Beschriftung] } – das Wort bzw. Zeichen direkt vor der Lücke
 * („d = [[d]]“, „φ(N) = [[phi]]“, „die [[die]]“, „43 = [[b1]] + …“) oder die Kopfzelle der Tabellenzeile („O | [[o_w]]“).
 */
function beschriftungen(a) {
  const out = {};
  const neu = (f, b) => { if (b) (out[f] = out[f] || []).push(b); };
  for (const t of rohtexte({ inhalt: a.inhalt, interaktion: a.interaktion })) {
    for (const m of String(t).matchAll(/([\p{L}][\p{L}\p{N}]*|\d+)(?:\([^)]*\))?\s*[=:]?\s*\[\[([^\]]+)\]\]/gu)) neu(m[2], m[1]);
  }
  (function lauf(x) {
    if (Array.isArray(x)) {
      for (const z of x) {
        if (Array.isArray(z) && typeof z[0] === 'string' && /\p{L}/u.test(z[0]) && !z[0].includes('[[')) {
          for (const c of z.slice(1)) for (const m of String(c).matchAll(/^\[\[([^\]]+)\]\]$/g)) neu(m[1], z[0].trim());
        }
      }
      return x.forEach(lauf);
    }
    if (x && typeof x === 'object') Object.values(x).forEach(lauf);
  })(a.inhalt);
  return out;
}

/**
 * Etiketten, unter denen Werkzeuge Zahlen ausgeben (E225: 1–2-stellige Zahlen zählen nur beschriftet). Schlüssel =
 * normalisierte Beschriftung der Aufgabe (Kleinbuchstaben, ohne Klammerzusatz), Wert = Etikett der Werkzeug-Modelle.
 */
const ETIKETTEN = Object.freeze({
  n: 'N', φ: 'φ', phi: 'φ', d: 'd', e: 'e', c: 'c', m: 'm', s: 's', g: 'g', k: 'k', h: 'h', kh: 'h', a: 'A', b: 'B', x: 'x',
  ggt: 'ggT', inverse: 'inv', inverses: 'inv', schlüsselbuchstabe: 's', verschiebung: 's'
});
/** Felder, die als Exponent einer Zehnerpotenz gefragt sind („≈ 1,3 · 10^[[e]] Jahre“) – Etikett 'exp' */
function exponentFelder(a) {
  const out = new Set();
  for (const t of rohtexte({ inhalt: a.inhalt, interaktion: a.interaktion })) for (const m of String(t).matchAll(/10\s*\^\s*\[\[([^\]]+)\]\]/g)) out.add(m[1]);
  return out;
}
const etikettVon = (b) => ETIKETTEN[String(b).trim().toLowerCase().replace(/\(.*$/, '')] || null;

/* ---------- Prüflinge ---------- */

/**
 * Alle Prüflinge: { id, quelle, welt, level?, aufgabe?, sichtbar: string[], werte: Lösungswerte, interaktionen? }.
 * papier = false lässt die Papier-Materialien weg (schneller).
 */
function prueflinge({ papier = true } = {}) {
  const out = [];
  for (const welt of [...WELTEN, 8]) {
    const w = seed(welt);
    if (!w) continue;
    const level = {};
    const rolle = {};
    for (const l of w.levels || []) for (const id of l.aufgaben || []) { level[id] = l.id; rolle[id] = l.rolle; }
    for (const a of w.aufgaben || []) {
      const quelle = welt === 8 ? 'gast' : /-B-/.test(a.id) ? 'boss' : /-A-/.test(a.id) ? 'archivfund' : 'lab';
      const s = sichtbar(a, rolle[a.id]);
      const b = beschriftungen(a);
      const hoch = exponentFelder(a);
      const werte = loesungsWerte(a).map((x) => ({ ...x, etiketten: [...(b[x.feld] || []).map(etikettVon).filter(Boolean), ...(hoch.has(x.feld) ? ['exp'] : [])] }));
      out.push({ id: a.id, quelle, welt, level: level[a.id] || null, aufgabe: a, sichtbar: [...s.kopf, ...s.teile.flat()], einzeln: s.einzeln, interaktionen: s.interaktionen, werte });
    }
  }
  for (const welt of WELTEN) {
    for (const k of (warmup(welt) || { karten: [] }).karten) {
      const eigen = rohtexte([k.titel, k.aufgabe]);
      const st = stelle('', eigen);
      out.push({ id: k.id, quelle: 'warmup', welt, sichtbar: eigen, werte: werteAusLoesung(rohtexte(k.loesung)).filter((x) => !gegeben(x, st)) });
    }
  }
  if (papier) {
    for (const p of papierPrueflinge()) out.push({ id: `Papier ${p.id}`, quelle: 'papier', welt: p.welt, sichtbar: p.sicht, werte: p.werte });
  }
  return out;
}

/* ---------- Angaben (E212, E224) ---------- */

const SCHLUESSEL_BUCHSTABE = { k: 'k', u: 'u', n: 'n', t: 't' };
/** Wörter, die GROSS geschrieben, aber keine Angaben sind (Abkürzungen der Fachsprache) */
const KEINE_ANGABE = new Set(['ASCII', 'RSA', 'XOR', 'AES', 'DES', 'SHA', 'TLS', 'HTTPS', 'CBC', 'ECB', 'KRYPTOS', 'NOMEN', 'DSGVO', 'ADFGVX', 'ADFGX', 'BE', 'EH', 'KC', 'IV', 'MAC', 'CA', 'DH', 'II', 'III', 'IV', 'VI']);

/**
 * Angaben eines Prüflings: { texte, schluessel, zahlen, bits, verfahren }. Texte normalisiert (A–Z, 0–9): Eingaben der
 * chiffre-Teile, `…`, „…“, GROSS geschriebene Wörter und Fünfergruppen. Schlüssel: Parameter der sichtbaren Verfahren
 * (k=12, u=4, n=3, t=5, st=A, loch=…, Wörter) und aus dem Text („k = 12“, **WORT**, GROSS geschriebene Wörter). Zahlen ≥ 2
 * ohne Nummerierung (A = 1 … Z = 26, A = 65) und Lücken; Bits in Bytes (bits) und als ganze Folgen (bitfolgen).
 */
function angaben(p) {
  const texte = new Set();
  const schluessel = new Set();
  const zahlen = new Set();
  const bits = [];
  const bitfolgen = [];
  const verfahren = [];
  const klartexte = new Set();
  const text = (t) => {
    const n = N(t);
    if (n.length >= 2 && !/^[01]+$/.test(n) && !/^\d+$/.test(n)) {
      texte.add(n);
      // Klartext klein (Design §6): natürliche Sprache – allein nur als ganzer Text erkannt (kein Fehlalarm bei Wörtern)
      if (/[a-zäöüß]/.test(String(t)) && !/[A-ZÄÖÜ]/.test(String(t))) klartexte.add(n);
    }
  };
  const wort = (w) => {
    const n = Krypto.nurBuchstaben(String(w ?? ''));
    if (n.length >= 2 && !KEINE_ANGABE.has(n)) schluessel.add(n);
  };
  for (const ia of p.interaktionen || []) {
    if (!ia || ia.kind !== 'chiffre') continue;
    if (typeof ia.eingabe === 'string') text(ia.eingabe);
    const v = ia.verfahren && typeof ia.verfahren === 'object' ? ia.verfahren : null;
    if (!v) continue;
    verfahren.push({ ...v, richtung: ia.richtung || 'ver', eingabe: ia.eingabe });
    if (Number.isInteger(v.k)) schluessel.add(`k=${v.k}`);
    if (Number.isInteger(v.umfang)) schluessel.add(`u=${v.umfang}`);
    if (Number.isInteger(v.zeilen)) schluessel.add(`n=${v.zeilen}`);
    if (Number.isInteger(v.t)) schluessel.add(`t=${v.t}`);
    if (typeof v.stellung === 'string') schluessel.add(`st=${v.stellung}`);
    if (Array.isArray(v.schablone)) schluessel.add(`loch=${v.schablone.map((x) => x.join(',')).join(';')}`);
    for (const f of ['schluessel', 'schluesselwort', 'pendel', 'oben', 'unten']) if (typeof v[f] === 'string') wort(v[f]);
  }
  const roh = (p.einzeln || p.sichtbar || []).map(String);
  for (const s of roh) {
    for (const m of s.matchAll(/`([^`]+)`/g)) {
      text(m[1]);
      // 16-Bit-Blöcke in Hex (KRYPTOS-16: K = `A36D`, IV = `1917`)
      if (/^[0-9A-F]{4}$/.test(m[1].trim())) bitfolgen.push(Krypto.vonHex(m[1].trim()).map((x) => Krypto.byteZuBits(x)).join(''));
    }
    for (const m of s.matchAll(/[„"]([^“"„]{2,80})[“"]/g)) text(m[1]);
    for (const m of s.matchAll(/(?<![\p{L}\d])[A-ZÄÖÜ]{2,}(?:[ ·][A-ZÄÖÜ]{1,5})*(?![\p{L}\d])/gu)) {
      const t = m[0];
      if (!t.includes(' ') && KEINE_ANGABE.has(t)) continue;
      if (t.length >= 3) text(t);
    }
    // Schlüsselwörter: fett, nach „Schlüsselwort“, „Pendelwort“, „Quadrat“ …, GROSS in Klammern („Vigenère (LUNA)“)
    for (const m of s.matchAll(/\*\*([A-ZÄÖÜ]{2,})\*\*/g)) wort(m[1]);
    for (const m of s.matchAll(/(?:Schlüsselworts?|Schlüsselwörter|Pendelworts?|Kennworts?|Quadrats?|Schlüssels?|Wortes|Salz)\s*(?::\s*)?(?:\*\*|`|„|")?([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]{1,24})/g)) if (m[1] === m[1].toUpperCase() || /[`„"*]/.test(s[m.index + m[0].length - m[1].length - 1] || '')) wort(m[1]);
    for (const m of s.matchAll(/\(([A-ZÄÖÜ]{3,20})\)/g)) wort(m[1]);
    for (const m of s.matchAll(/(?<![\p{L}])([kuntKUNT])\s*=\s*(\d{1,2})(?!\d)/gu)) schluessel.add(`${SCHLUESSEL_BUCHSTABE[m[1].toLowerCase()]}=${m[2]}`);
    for (const m of s.matchAll(/Startstellung\s+([A-H])\b/g)) schluessel.add(`st=${m[1]}`);
    for (const m of s.matchAll(/Löcher[n]?\s*((?:\(\d,\s*\d\)[,\s]*(?:und\s*)?)+)/g)) {
      const paare = [...m[1].matchAll(/\((\d),\s*(\d)\)/g)].map((x) => `${x[1]},${x[2]}`);
      if (paare.length) schluessel.add(`loch=${paare.join(';')}`);
    }
    for (const b of bitsVon(s)) {
      if (b.length % 8 === 0) bitfolgen.push(b);
      for (let i = 0; i + 8 <= b.length; i += 8) bits.push(b.slice(i, i + 8));
    }
    const ohne = ohneNummerierung(s).replace(/\[\[[^\]]*\]\]/g, ' ').replace(BITS, ' ');
    for (const z of ohne.match(ZAHL) || []) {
      if (z.includes(',')) continue;
      const n = Number(z);
      if (Number.isSafeInteger(n) && n >= 2) zahlen.add(n);
    }
  }
  return { texte: [...texte], klartexte: [...klartexte], schluessel: [...schluessel], zahlen: [...zahlen], bits: [...new Set(bits)], bitfolgen: [...new Set(bitfolgen)], verfahren };
}

/* ---------- Lösungskriterium (E225) ---------- */

/** Ausnahmen (E204, L60): Verrat ist hier ausdrücklich erlaubt */
const AUSNAHMEN = Object.freeze([
  Object.freeze({ aufgabe: 'W0-L2-04', wr: 'scheibe.alle', grund: 'L60: Brute-Force-Liste erlaubt – das Erkennen des Klartexts unter 25 Zeilen ist die Lernleistung (E204).' })
]);

/** Normalisierte Bits einer Ausgabe */
const reineBits = (t) => String(t ?? '').replace(/[^01]/g, '');
/** Zahlenfolgen-Werte einer Aufgabe je Teil in Feldreihenfolge (Wertetabellen, E225) */
function zahlenFolgen(p) {
  const je = new Map();
  for (const x of p.werte || []) {
    if (x.art !== 'zahl' || x.feld === '*') continue;
    const l = je.get(x.teil) || [];
    if (!l.some((y) => y.feld === x.feld)) l.push(x);
    je.set(x.teil, l);
  }
  return [...je.values()].map((l) => l.map((x) => x.n));
}
/** hash-ziel-Teile: [{ ziel, ungleich }] */
function hashZiele(p) {
  return (p.interaktionen || []).filter((ia) => ia && ia.kind === 'hash-ziel' && Number.isInteger(ia.ziel)).map((ia) => ({ ziel: ia.ziel, ungleich: (ia.ungleich || []).map(N) }));
}

/**
 * Enthält eine Werkzeug-Ausgabe eine Lösung des Prüflings? ausgaben: [{ art: 'text'|'bits'|'zahl'|'folge', wert, etikett?, werte? }].
 * Text ≥ 4 als Teilstring (K1-Regel zaehlt), 3 Zeichen nur als ganzes Wort; Bits ≥ 8 als Teilstring; Zahlen mit Komma
 * oder ≥ 3 Ziffern als Teilstring, 1–2-stellig nur mit passendem Etikett; Folgen ≥ 3 Werte einer Wertetabelle in Reihe;
 * Prädikat hash-ziel (Text mit dem Ziel-Hash, nicht gegeben). → { verrat, wert?, regel? }
 */
function istVerrat(ausgaben, p) {
  const werte = p.werte || [];
  const folgen = zahlenFolgen(p);
  // gegebene Zahlen der Aufgabe (eine Lösung, die schon dasteht – z. B. m = 3 beim Hin- und Rückweg – verrät nichts)
  if (!p._gegeben) Object.defineProperty(p, '_gegeben', { value: new Set(angaben(p).zahlen.map(String)), enumerable: false });
  const ziele = hashZiele(p);
  for (const a of ausgaben || []) {
    if (!a) continue;
    if (a.art === 'text') {
      const roh = String(a.wert ?? '');
      const n = N(roh);
      const woerter = new Set(roh.split(/[^0-9A-Za-zÄÖÜäöüß]+/).map(N).filter(Boolean));
      for (const x of werte) {
        if (x.art !== 'text') continue;
        if (zaehlt(x) && n.includes(x.n)) return { verrat: true, wert: x.n, regel: 'text' };
        if (x.n.length === 3 && (n === x.n || woerter.has(x.n))) return { verrat: true, wert: x.n, regel: 'token' };
        if (x.n.length <= 2 && a.etikett && n === x.n && (x.etiketten || []).includes(a.etikett)) return { verrat: true, wert: x.n, regel: 'etikett' };
      }
      for (const z of ziele) {
        if (/^[A-Z]+$/.test(n) && n.length >= 1 && !z.ungleich.includes(n) && Krypto.kryptosHash(n) === z.ziel) return { verrat: true, wert: n, regel: 'hash-ziel' };
      }
    } else if (a.art === 'bits') {
      const b = reineBits(a.wert);
      for (const x of werte) if (x.art === 'bits' && x.n.length >= 8 && b.includes(x.n)) return { verrat: true, wert: x.n, regel: 'bits' };
    } else if (a.art === 'zahl') {
      const w = String(a.wert ?? '').trim().replace(/^-/, '');
      for (const x of werte) {
        if (x.art !== 'zahl') continue;
        if (bedeutend(x.n) && w.includes(x.n)) return { verrat: true, wert: x.n, regel: 'zahl' };
        if (!bedeutend(x.n) && w === x.n && a.etikett && (x.etiketten || []).includes(a.etikett) && !p._gegeben.has(x.n)) return { verrat: true, wert: x.n, regel: 'etikett' };
      }
    } else if (a.art === 'folge') {
      const aus = (a.werte || []).map(String);
      for (const f of folgen) {
        for (let i = 0; i + 3 <= f.length; i++) {
          const drei = f.slice(i, i + 3);
          // triviale Folgen (1, 1, 1 oder 1, 2, 2) zählen nicht: mindestens ein Wert ≥ 10 oder drei verschiedene Werte
          if (!drei.some((x) => x.replace(/\D/g, '').length >= 2) && new Set(drei).size < 3) continue;
          const stueck = drei.join('|');
          for (let j = 0; j + 3 <= aus.length; j++) if (aus.slice(j, j + 3).join('|') === stueck) return { verrat: true, wert: stueck, regel: 'folge' };
        }
      }
    }
  }
  return { verrat: false };
}

module.exports = {
  WURZEL, WELTEN, MAT, LAYOUT, NUR_LSG, ETIKETTEN, AUSNAHMEN,
  seed, warmup, rohtexte, stelle, woerterVon, zahlenVon, bitsVon, istBits, istZahl, bedeutend,
  loesungsWerte, loesungen, zaehlt, sichtbar, werteAusLoesung, gegeben, papierPruefungen, papierPrueflinge,
  beschriftungen, ohneNummerierung, quellDateien,
  prueflinge, angaben, istVerrat, etikettVon
};
