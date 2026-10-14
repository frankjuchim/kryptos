'use strict';
// Kein Lösungsverrat (M5-Inhaltsprüfung, Befunde K1/K2/W1–W5; verschärft nach der Entscheidung der Lehrkraft vom
// 14.10.2026: „Es ist nicht gewollt, dass Lösungen durch vorherige Teilaufgaben, Aufgabentexte oder ähnliches verraten
// werden.“ – keine Ausnahmen). Aufgaben sind frei anwählbar, also verrät jede andere Stelle die Antwort.
//
// Prüflinge: Lab-, Boss- und Archivfund-Aufgaben der Welten 0–6, die Gast-Demo (Welt 8) und Stichproben aller
// Trainingsplatz-Generatoren. Fundklassen:
//   K1 Lösungstext (≥ 4 Zeichen A–Z/0–9 nach Normalisierung; 4–5 Zeichen als ganzes Wort, ab 6 Zeichen auch als Teil,
//      z. B. in Fünfergruppen) in einem anderen Schülertext derselben Welt – andere Aufgabe (sichtbarer Teil), Level-Intro,
//      Archivfund/Kapitel, Boss-Kopf, Akte (Schülerfassung), Werkzeugkarte, Warm-up-Karte (auch Lösungsseite).
//   K2 Bitfolge (≥ 8 Bit, an Byte- bzw. Vierergrenzen) in einem solchen Text.
//   K3 Zahl mit Komma oder mit ≥ 3 Ziffern (z. B. 312, 0,048, 67,5) in einem solchen Text.
//   K4 Lösung im sichtbaren Teil der eigenen Aufgabe: Titel, Inhalt, Fragen und Optionen aller Teile, Platzhalter
//      (K1–K3-Werte überall; mehrstellige Zahlen auch in einem anderen Teil oder beschriftet wie in K5).
//   K5 Beschriftete Zahl (≥ 2 Ziffern): Die Lücke hat eine Beschriftung (Wort oder Zeichen davor wie „d = [[d]]“,
//      „die [[die]]“, Tabellenzeile „O | [[o_w]]“), und ein anderer Text nennt Beschriftung und Wert zusammen
//      („d = 29“, „die 58“, „O = 79“, „43 = 32 + …“ für „43 = [[b1]] + …“); die Nummerierung (A = 1 … Z = 26) zählt nicht.
//   K6 Optionen: alle Optionen richtig, oder die Zahl der Optionen eines choice-Teils ist die Zahlen-Lösung eines anderen
//      Teils mit nur einer Lücke (z. B. „vier Optionen“ bei „Wie viele Schlüssel …? 4“).
//   K9 Tipps (ab 16 Zeichen) und Erklärungen (ab 24 Zeichen) einer Aufgabe stehen nicht schon in einem sichtbaren Text –
//      eigene Aufgabe, irgendein Schülertext aller Welten oder die Fallen-Texte (/api/themen) –, wie im API-Crawler
//      test/sicherheit_loesungen.test.js (dort nur Diagnose „inhaltlich“).
//   K7 Behobene Einzelfälle mit zweistelligen Zahlen (Liste BEHOBEN, keine Ausnahmen): Prüfungen, die verhindern, dass die
//      Werte wieder an der genannten Stelle auftauchen (Inversen-Tabelle, Paarzahlen, Schlüsselanzahlen, Wertetabelle …).
//   K8 Klartext-Krippe: Ein Wort des Titels (≥ 5 Buchstaben, keine Fachwörter) deckt mindestens ein Viertel eines
//      Klartexts ab; bei Knack-Teilen (verdeckter Schlüssel, Zuordnung ohne Schlüsselfrage) zählt jedes Wort aus Titel
//      und Aufgabentext, das im Klartext steht („Kuriere kommen nie an“ bei „kurierkamniean…“).
// Der sichtbare Teil einer Aufgabe ist das, was der Server vor dem Lösen schickt (ohne Lösung, Tipps, Erklärung;
// verdeckte Schlüssel ohne Parameter, Hook oeffentlich der chiffre-Interaktion).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');
const Krypto = require('../public/static/js/shared/krypto.js');
require('../src/krypto').registriere();
const G = require('../src/content/generators');
const CHIFFRE = require('../src/krypto/interaktionen/chiffre');

const N = (t) => S.normalisiert(t);
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const kurz = (x) => typeof x === 'string' && [...x].length <= 2;
// Layout-Angaben (Zahlen, die kein Inhalt sind)
const LAYOUT = new Set(['breite', 'breiten', 'hoehe', 'stufe', 'punkte', 'version', 'groesse', 'schrift', 'anteil', 'nach', 'breite_cm', 'minuten', 'anzahl', 'block', 'basis', 'nr']);

/** Rohtexte eines JSON-Werts. Listen aus Einzelzeichen (Zeilen, Zellen) zusätzlich als ein Stück; Playfair-/Polybios-
 * Quadrate mit Schlüssel ausgerechnet; Akten-Quadrate als ein Stück; bits-Zeilen einzeln. */
function rohtexte(wert, { ohne = [] } = {}) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string') return out.push(x);
    if (Array.isArray(x)) {
      const flach = x.flat();
      if (flach.length >= 2 && flach.every(kurz)) out.push(flach.join(''));
      return x.forEach(lauf);
    }
    if (!x || typeof x !== 'object') return;
    if (x.nur_loesung === true) return;
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

/** Normalisierte Textstücke (wie bisher exportiert) */
const stuecke = (wert, opts) => rohtexte(wert, opts).map(N).filter(Boolean);

const woerterVon = (s) => String(s).split(/[^0-9A-Za-zÄÖÜäöüß]+/).map(N).filter(Boolean);
// ganze Zahlen und Dezimalzahlen (Komma); nicht Teil von Kennungen (W3, P7), Potenzen (10²⁶, 15^4^) oder Datumsangaben
const HOCH = '⁰¹²³⁴⁵⁶⁷⁸⁹^';
const ZAHL = new RegExp(`(?<![\\d,.A-Za-z_])\\d+(?:,\\d+)?(?![\\d${HOCH}]|[,.]\\d)`, 'g');
const zahlenVon = (s) => String(s).match(ZAHL) || [];
const BITS = /[01]{4}(?:[  ·|_]*[01]{4})*/g;
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

/** Lösungswerte einer Aufgabe: [{ teil, art: text|bits|zahl, wert }] */
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

/** Lösungen (K1–K3) als normalisierte Liste – für den Muster-Test und andere Tests */
function loesungen(a) {
  return [...new Set(loesungsWerte(a).filter(zaehlt).map((x) => x.n))];
}

/** Zählt der Wert für K1–K3? */
function zaehlt(x) {
  if (x.art === 'bits') return x.n.length >= 8;
  if (x.art === 'zahl') return bedeutend(x.n);
  return x.n.length >= 4 && new Set(x.n).size >= 3 && !/^[01]+$/.test(x.n);
}

/** Steht der Wert x in der Fundstelle s? */
function steht(x, s) {
  if (x.art === 'bits') {
    const schritt = x.n.length % 8 === 0 ? 8 : 4;
    return s.bits.some((b) => {
      for (let i = b.indexOf(x.n); i >= 0; i = b.indexOf(x.n, i + 1)) if (i % schritt === 0) return true;
      return false;
    });
  }
  if (x.art === 'zahl') return x.n.includes(',') ? s.zahlen.some((l) => l.includes(x.n)) : alsErgebnis(x.n, s.roh);
  if (x.n.length <= 5) return s.woerter.has(x.n);
  return s.stuecke.some((t) => t.includes(x.n));
}

/**
 * Ganze Zahl (≥ 3 Ziffern) als Ergebnis genannt: nach „=“, „≈“, „→“, vor „=“, fett oder allein in einer Tabellenzelle –
 * nicht als Position, Abstand o. Ä. in einer Aufzählung („EPKW (106, 116)“).
 */
function alsErgebnis(n, roh) {
  const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ende = `(?![\\d${HOCH}]|[,.]\\d)`;
  const re = new RegExp(`[=≈→]\\s*\\**\\s*${e}${ende}|(?<![\\d,.])${e}\\s*=|\\*\\*${e}\\*\\*|^\\s*\\**${e}\\**\\s*$`);
  return roh.some((t) => re.test(String(t)));
}

/** Sichtbarer Teil einer Aufgabe (was der Server vor dem Lösen schickt): Kopf und je Teil die Interaktion */
function sichtbar(a, rolle) {
  const mitRolle = { ...a, _rolle: rolle };
  const ein = (ia) => (ia && ia.kind === 'chiffre' ? CHIFFRE.oeffentlich(ia, { aufgabe: mitRolle }) : ia);
  const teile = [].concat(a.interaktion || []).map(ein);
  return {
    kopf: rohtexte({ titel: a.titel, inhalt: a.inhalt }),
    teile: teile.map((ia) => rohtexte(ia))
  };
}

/** Schülertexte einer Welt: [Fundstelle mit aufgabe (id oder null)] */
function schuelertexte(welt) {
  const w = welt === 8 ? json(path.join(S.WURZEL, 'seed', 'gast', 'demo.json')) : S.seed(welt);
  const liste = [];
  if (!w) return liste;
  const rolle = {};
  for (const l of w.levels || []) for (const id of l.aufgaben || []) rolle[id] = l.rolle;
  liste.push(stelle(`W${welt} Kapitel/Archivfund`, rohtexte([w.kapitel, w.archivfund, w.titel])));
  for (const l of w.levels || []) liste.push(stelle(`${l.id} Intro`, rohtexte(l.intro)));
  if (w.boss) liste.push(stelle(`W${welt}-B Boss-Kopf`, rohtexte({ ...w.boss, pool: undefined })));
  for (const a of w.aufgaben || []) {
    const s = sichtbar(a, rolle[a.id]);
    liste.push(stelle(`${a.id} Aufgabe`, [...s.kopf, ...s.teile.flat()], { aufgabe: a.id }));
  }
  if (welt === 8) return liste;
  const wu = S.warmup(welt);
  for (const k of (wu && wu.karten) || []) liste.push(stelle(`${k.id} Warm-up`, rohtexte([k.titel, k.aufgabe, k.loesung])));
  const ordner = path.join(S.WURZEL, 'quellen', 'material', `W${welt}`);
  if (fs.existsSync(ordner)) {
    for (const d of fs.readdirSync(ordner).filter((x) => /^akte_.*\.json$/.test(x)).sort()) {
      liste.push(stelle(`Akte ${d}`, rohtexte(json(path.join(ordner, d)).bloecke, { ohne: ['loesung'] })));
    }
  }
  // Werkzeugkarten außer WK1 (Abitur-Anlage mit Lernhilfe: Nachschlagewerk wie Alphabet, ASCII-Tabelle und
  // Vigenère-Quadrat – Nachschlagen dort ist eine Arbeitstechnik, kein Verrat)
  const wk = path.join(S.WURZEL, 'quellen', 'material', 'Werkzeugkarten');
  for (const d of fs.readdirSync(wk).filter((x) => /^werkzeugkarte_.*\.json$/.test(x) && !/_WK1_/.test(x)).sort()) {
    liste.push(stelle(`Werkzeugkarte ${d}`, rohtexte(json(path.join(wk, d)).bloecke, { ohne: ['loesung'] })));
  }
  return liste;
}

/** Nummerierung und ASCII-Konstanten aus einem Text entfernen (A = 1 … Z = 26, a = 1 … z = 26, A = 65) */
const ohneNummerierung = (t) => String(t)
  .replace(/(^|[^\p{L}])[A-Za-z]\s*=\s*\d+\s*…\s*[A-Za-z]\s*=\s*\d+/gu, '$1')
  .replace(/[`'„“"]?[Aa][`'“"]?\s*=\s*(65|97)\b/g, '');

const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

/** Steht „Beschriftung Wert“ (mit = oder :) in einem der Texte? Zahlen-Beschriftungen nur mit „=“ („43 = 32“). */
function beschriftetIn(beschriftung, wert, texte) {
  const zahl = /^\d+$/.test(beschriftung);
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${esc(beschriftung)}(?:\\([^)]*\\))?\\s*${zahl ? '=' : '[=:]?'}\\s*${esc(wert)}(?![\\d${HOCH}]|[,.]\\d)`, 'u');
  return texte.some((t) => re.test(ohneNummerierung(t)));
}

/** Zahlen-Lösungen (≥ 2 Ziffern) mit Beschriftung: [{ x, beschriftung }] */
function beschrifteteZahlen(a) {
  const b = beschriftungen(a);
  const out = [];
  for (const x of loesungsWerte(a)) {
    if (x.art !== 'zahl' || x.n.replace(/\D/g, '').length < 2) continue;
    for (const l of b[x.feld] || []) out.push({ x, beschriftung: l });
  }
  return out;
}

/** Fachwörter, die in fast jedem Aufgabentext stehen – als Krippe wertlos (K8) */
const FACHWOERTER = new Set(['SCHLUESSEL', 'GEHEIMTEXT', 'KLARTEXT', 'NACHRICHT', 'VERFAHREN']);

/** Funde innerhalb einer Aufgabe (K4, K6): [{ aufgabe, loesung, quelle }] */
function eigeneFunde(a, rolle) {
  const out = [];
  const s = sichtbar(a, rolle);
  const werte = loesungsWerte(a);
  const alle = [...s.kopf, ...s.teile.flat()];
  const alleStelle = stelle('eigene Aufgabe', alle);
  for (const x of werte) {
    if (zaehlt(x) && steht(x, alleStelle)) out.push({ aufgabe: a.id, loesung: x.n, quelle: 'eigene Aufgabe (Text, Titel oder Teil)' });
    if (x.art !== 'zahl' || bedeutend(x.n) || x.n.length < 2) continue;
    // mehrstellige Zahl in einem anderen Teil (Frage, Optionen) derselben Aufgabe
    s.teile.forEach((t, j) => {
      if (j !== x.teil && stelle('', t).zahlen.some((l) => l.includes(x.n))) out.push({ aufgabe: a.id, loesung: x.n, quelle: `eigene Aufgabe, Teil ${j + 1}` });
    });
  }
  // beschriftet im eigenen Text, ohne die Lücke selbst („d = [[g3]] … (prüfe d = 29)“)
  for (const { x, beschriftung } of beschrifteteZahlen(a)) {
    if (beschriftetIn(beschriftung, x.n, alle)) out.push({ aufgabe: a.id, loesung: x.n, quelle: `eigene Aufgabe („${beschriftung} … ${x.n}“)` });
  }
  // K8: Titel nennt Wörter (≥ 5 Buchstaben) eines Klartexts; bei Knack-Teilen (verdeckter Schlüssel, Zuordnung) ohne
  // eigene Schlüsselfrage auch der Text der Aufgabe (Krippe: „Kuriere kommen nie an“ bei „kurierkamniean…“)
  const teile = [].concat(a.interaktion || []);
  const los = [].concat(a.loesung || []);
  const klartexte = werte.filter((x) => x.art === 'text' && x.n.length >= 8);
  const fach = (w) => FACHWOERTER.has(w);
  const mitSchluesselfrage = teile.some((ia) => ia && ia.kind === 'gaps');
  const knack = (ia) => !!ia && !mitSchluesselfrage && (ia.kind === 'zuordnung' || (ia.kind === 'chiffre' && CHIFFRE.schluesselVerdeckt(ia, { ...a, _rolle: rolle })));
  // Titel: ein Wort, das mindestens ein Viertel des Klartexts abdeckt, bei Knack-Teilen jedes Wort
  for (const w of woerterVon(a.titel || '').filter((t) => t.length >= 5 && !fach(t))) {
    for (const x of klartexte) if (x.n.includes(w) && (4 * w.length >= x.n.length || knack(teile[x.teil]))) out.push({ aufgabe: a.id, loesung: w, quelle: 'Titel (Wort des Klartexts)' });
  }
  teile.forEach((ia, i) => {
    if (!knack(ia)) return;
    const md = [];
    (function lauf(x) {
      if (Array.isArray(x)) return x.forEach(lauf);
      if (!x || typeof x !== 'object') return;
      for (const k of ['md', 'frage']) if (typeof x[k] === 'string') md.push(x[k]);
      for (const v of Object.values(x)) if (v && typeof v === 'object') lauf(v);
    })([a.inhalt, ia]);
    const woerter = new Set(md.flatMap(woerterVon).filter((t) => t.length >= 5 && !fach(t)));
    for (const x of klartexte.filter((k) => k.teil === i)) for (const w of woerter) if (x.n.includes(w)) out.push({ aufgabe: a.id, loesung: w, quelle: 'Aufgabentext (Wort des Klartexts bei verdecktem Schlüssel)' });
  });
  // K6: Optionen
  teile.forEach((ia, i) => {
    if (!ia || ia.kind !== 'choice') return;
    const richtig = (los[i] && los[i].richtig) || [];
    const n = (ia.optionen || []).length;
    if (n > 1 && richtig.length === n) out.push({ aufgabe: a.id, loesung: '(alle Optionen)', quelle: `Teil ${i + 1}: alle Optionen richtig` });
    teile.forEach((tj, j) => {
      if (j === i || !tj || tj.kind !== 'gaps' || Object.keys(tj.felder || {}).length !== 1) return;
      const x = werte.find((w) => w.teil === j && w.art === 'zahl');
      if (x && Number(x.n) === n && n >= 3) out.push({ aufgabe: a.id, loesung: x.n, quelle: `Teil ${i + 1}: Anzahl der Optionen` });
    });
  });
  return out;
}

/** Funde einer Welt (K1–K5): [{ aufgabe, loesung, quelle }] */
function funde(welt) {
  const w = welt === 8 ? json(path.join(S.WURZEL, 'seed', 'gast', 'demo.json')) : S.seed(welt);
  if (!w) return [];
  const rolle = {};
  for (const l of w.levels || []) for (const id of l.aufgaben || []) rolle[id] = l.rolle;
  const texte = schuelertexte(welt);
  const out = [];
  for (const a of w.aufgaben || []) {
    out.push(...eigeneFunde(a, rolle[a.id]));
    const werte = loesungsWerte(a).filter(zaehlt);
    const beschriftet = beschrifteteZahlen(a);
    for (const t of texte) {
      if (t.aufgabe === a.id) continue;
      for (const x of werte) if (steht(x, t)) out.push({ aufgabe: a.id, loesung: x.n, quelle: t.quelle });
      for (const { x, beschriftung } of beschriftet) if (beschriftetIn(beschriftung, x.n, t.roh)) out.push({ aufgabe: a.id, loesung: `${beschriftung} ${x.n}`, quelle: t.quelle });
    }
  }
  return out;
}
/**
 * K7 – behobene Einzelfälle mit zweistelligen Zahlen (Entscheidung der Lehrkraft 14.10.2026): Die Lösungswerte der
 * Aufgabe dürfen an den genannten Stellen nicht (wieder) stehen. Keine Ausnahmen – nur Wächter gegen Rückfälle.
 */
const aufgabeVon = (id) => S.seed(Number(/^W(\d)/.exec(id)[1])).aufgaben.find((x) => x.id === id);
const zahlenIn = (wert) => new Set(rohtexte(wert).flatMap(zahlenVon));
const quelleText = (welt, anfang) => schuelertexte(welt).filter((q) => q.quelle.startsWith(anfang)).flatMap((q) => q.roh);
const BEHOBEN = [
  { fall: 'W1-L2-02, W1-B-07: keine Tabelle aller Inversen in Akte W1·2 (Archivwissen 2)', pruefe: () => {
    const akte = json(path.join(S.WURZEL, 'quellen', 'material', 'W1', 'akte_W1-2.json'));
    const tab = [];
    (function lauf(x) { if (Array.isArray(x)) return x.forEach(lauf); if (!x || typeof x !== 'object') return; if (x.t === 'tabelle') tab.push(x); Object.values(x).forEach(lauf); })(akte.bloecke);
    return tab.filter((t) => (t.zeilen || []).some((z) => /^m\^?−1\^?$/.test(String(z[0]).trim()) && z.slice(1).some((c) => /^\d+$/.test(String(c).trim())))).map(() => 'Tabelle der Inversen');
  } },
  { fall: 'W1-L2-02, W1-B-07: Inverse nicht als Beispiel im Merkkasten 1.2 oder in Akte W1·2', pruefe: () => {
    const texte = [...quelleText(1, 'W1-L2 Intro'), ...quelleText(1, 'Akte akte_W1-2')].join(' ');
    return ['19 · 11', '11 · 19', '17 · 23', '23 · 17'].filter((x) => texte.includes(x));
  } },
  { fall: 'W2-L5-05: der Text nennt die Lösungen von W2-L5-01 … -03 nicht', pruefe: () => {
    const z = zahlenIn(aufgabeVon('W2-L5-05').inhalt);
    return ['W2-L5-01', 'W2-L5-02', 'W2-L5-03'].flatMap((id) => loesungsWerte(aufgabeVon(id)).filter((x) => x.art === 'zahl' && z.has(x.n)).map((x) => `${id} ${x.n}`));
  } },
  { fall: 'W4-L2-04: W4-L2-05 nennt N und d aus W4-L2-04 nicht', pruefe: () => {
    const lo = aufgabeVon('W4-L2-04').loesung;
    const z = zahlenIn(aufgabeVon('W4-L2-05').inhalt);
    return z.has(lo.g1[0]) && z.has(lo.g3[0]) ? [`(${lo.g1[0]}, ${lo.g3[0]})`] : [];
  } },
  { fall: 'W4-B-02: keine Akte der Welt 4 nennt beide Schlüsselanzahlen zusammen', pruefe: () => {
    const lo = aufgabeVon('W4-B-02').loesung;
    return quelleText(4, 'Akte').filter((t) => { const z = zahlenVon(t); return z.includes(lo.sym[0]) && z.includes(lo.asym[0]); }).map((t) => t.slice(0, 60));
  } },
  { fall: 'W4-L1-06: der gesuchte Wert steht nicht in der vorgegebenen Hälfte der Wertetabelle', pruefe: () => {
    const a = aufgabeVon('W4-L1-06');
    const ziel = /mod 17 = (\d+)\./.exec(a.inhalt[0].md)[1];
    return a.inhalt[1].zeilen.filter((z) => !String(z[1]).startsWith('[[') && z[1] === ziel).map((z) => `x = ${z[0]}`);
  } },
  { fall: 'W6-L3-01, -02: Minutenwerte stehen nicht im Merkkasten 6.3 oder in Akte W6·3', pruefe: () => {
    const texte = [...quelleText(6, 'W6-L3 Intro'), ...quelleText(6, 'Akte akte_W6-3')].join(' ');
    const alsMinuten = (n) => new RegExp(`(?<![\\d,])${n.replace(',', ',')}\\s*(min|Minuten)|≈\\s*${n}(?![\\d,])`).test(texte);
    return ['W6-L3-01', 'W6-L3-02', 'W6-L3-03'].flatMap((id) => loesungsWerte(aufgabeVon(id)).filter((x) => x.art === 'zahl' && alsMinuten(x.n)).map((x) => `${id} ${x.n}`));
  } }
];

for (const welt of [...S.WELTEN, 8]) {
  test(`Welt ${welt}: keine Lösung einer Aufgabe in einem anderen Schülertext derselben Welt oder im eigenen Aufgabentext`, () => {
    const f = funde(welt).map((x) => `${x.aufgabe}: „${x.loesung}“ in ${x.quelle}`);
    assert.deepEqual([...new Set(f)], []);
  });
}

test('K9: Tipps und Erklärungen stehen vor dem Abruf nirgends sichtbar (alle Welten, Gast, Fallen-Texte)', () => {
  const { FALLEN } = require('../src/krypto/fach');
  const welten = [...S.WELTEN, 8];
  const quellen = welten.flatMap((w) => schuelertexte(w));
  quellen.push(stelle('Fallen-Texte (fach.js)', rohtexte(FALLEN)));
  const f = [];
  for (const welt of welten) {
    const w = welt === 8 ? json(path.join(S.WURZEL, 'seed', 'gast', 'demo.json')) : S.seed(welt);
    for (const a of w.aufgaben || []) {
      const geheim = [
        ...rohtexte(a.tipps || []).map(N).filter((t) => t.length >= 16),
        ...rohtexte(a.erklaerung || []).map(N).filter((t) => t.length >= 24)
      ];
      for (const g of geheim) for (const q of quellen) if (q.stuecke.some((t) => t.includes(g))) f.push(`${a.id}: „${g.slice(0, 40)}“ in ${q.quelle}`);
    }
  }
  assert.deepEqual([...new Set(f)], []);
});

test('K7: behobene Fälle mit zweistelligen Zahlen bleiben behoben', () => {
  const f = BEHOBEN.flatMap((b) => b.pruefe().map((x) => `${b.fall}: ${x}`));
  assert.deepEqual(f, []);
});

test('Trainingsplatz: keine Lösung im sichtbaren Teil der erzeugten Aufgabe (K4, K6; je Generator 40 Seeds)', () => {
  const f = [];
  for (const key of Object.keys(G.GENERATOREN)) {
    for (let i = 0; i < 40; i++) {
      const a = G.erzeuge(key, i * 7919 + 1);
      for (const x of eigeneFunde(a, null)) f.push(`${key}/${i}: „${x.loesung}“ in ${x.quelle}`);
    }
  }
  assert.deepEqual([...new Set(f)].slice(0, 20), []);
});

test('Lösungsverrat-Prüfung erkennt die Muster (Alphabet, Quadrat, Bits, Wörter, Zahlen, Gleichungen, Optionen)', () => {
  const lo = loesungen({ loesung: { a1: ['S'], a2: ['U'], a3: ['L'], a4: ['T'], a5: ['A'], a6: ['N'] } });
  assert.deepEqual(lo, ['SULTAN']);
  assert.ok(loesungen({ loesung: { f0: ['0'], f1: ['5'], f2: ['2'], f3: ['7'], f4: ['4'], f5: ['1'], z: ['ZAICMEST'] } }).includes('052741'), 'Ziffernfolge neben einem Wort (E137)');
  const st = stuecke({ t: 'alphabet', zeilen: [{ label: 'Geheimtext', werte: 'SULTANBCDEFGHIJKMOPQRVWXYZ' }] });
  assert.ok(st.some((s) => s.includes('SULTAN')));
  const q = stuecke({ t: 'quadrat', art: 'playfair', schluessel: 'RIALTO' });
  assert.ok(q.some((s) => s.includes('FGHKMNPQSU')));
  const z = stuecke({ t: 'quadrat', art: 'frei', zellen: [['F', 'G', 'H', 'K', 'M'], ['N', 'P', 'Q', 'S', 'U']] });
  assert.ok(z.some((s) => s === 'FGHKMNPQSU'));
  assert.ok(stuecke({ t: 'quadrat', zeilen: ['RIALT', 'OBCDE', 'FGHKM', 'NPQSU', 'VWXYZ'] }).some((s) => s.includes('FGHKMNPQSU')));
  assert.deepEqual(stuecke({ t: 'p', md: 'Lösung', nur_loesung: true }), []);
  assert.ok(!stuecke({ t: 'alphabet', zeilen: [{ label: 'Geheimtext', werte: 'SCHERAZDBF', leer: true }] }).some((t) => t.includes('SCHERAZ')), 'leer gedruckte Zeile');
  assert.deepEqual(loesungen({ loesung: { text: 'XXXXXX' } }), [], 'zu wenig verschiedene Zeichen');
  assert.deepEqual(loesungen({ interaktion: { kind: 'gaps', felder: { g: { typ: 'auswahl', optionen: ['öffentlichen', 'privaten'] } } }, loesung: { g: ['öffentlichen'] } }), [], 'Klappliste (Plan M8 Task 178)');
  assert.deepEqual(loesungen({ interaktion: { kind: 'match' }, loesung: { e1: 'hybrid' } }), [], 'match-Kategorien (Plan M8 Task 179)');
  // K1: kurze Wörter nur als ganzes Wort (FUNK nicht in „Funkraum“), lange auch in Fünfergruppen
  const funk = { art: 'text', n: 'FUNK' };
  assert.equal(steht(funk, stelle('', ['Im Funkraum'])), false);
  assert.equal(steht(funk, stelle('', ['Das Wort FUNK steht da.'])), true);
  assert.equal(steht({ art: 'text', n: 'KURIERWARTET' }, stelle('', ['`KURIE RWART ET`'])), true);
  // K2: Bitfolgen ab 8 Bit an Bytegrenzen
  assert.deepEqual(loesungen({ loesung: { bits: '01101010' } }), ['01101010']);
  const b = stelle('', ['0110 1010 1101 0100']);
  assert.equal(steht({ art: 'bits', n: '01101010' }, b), true);
  assert.equal(steht({ art: 'bits', n: '10101101' }, b), false, 'nicht an der Bytegrenze');
  assert.ok(stelle('', [stuecke({ t: 'bits', zeilen: [{ label: 'T', bits: '0110 1010 1101 0100' }] }).join(' ')]).bits.length);
  // K3: Zahlen mit Komma oder ≥ 3 Ziffern als ganze Zahl
  assert.deepEqual(loesungen({ loesung: { a: ['312'], b: ['12'], c: ['0,048'] } }), ['312', '0,048']);
  assert.equal(steht({ art: 'zahl', n: '312' }, stelle('', ['12 · 26 = 312 Schlüssel'])), true);
  assert.equal(steht({ art: 'zahl', n: '312' }, stelle('', ['3120 und 1312'])), false);
  assert.equal(steht({ art: 'zahl', n: '2,25' }, stelle('', ['Takt 2,25 min'])), true);
  // K4: Gleichung im eigenen Text, Wert in einem anderen Teil, Nummerierung zählt nicht
  const a1 = { id: 'X', inhalt: [{ t: 'text', md: 'p = 5, q = 13. d = [[d]] (prüfe d = 29). A = 1 … Z = 26.' }], interaktion: { kind: 'gaps', felder: { d: { typ: 'zahl' } } }, loesung: { d: ['29'] } };
  assert.equal(eigeneFunde(a1).length, 1);
  const a2 = { id: 'X', inhalt: [{ t: 'text', md: 'Nummerierung: A = 1 … Z = 26. c = [[c]]' }], interaktion: { kind: 'gaps', felder: { c: { typ: 'zahl' } } }, loesung: { c: ['26'] } };
  assert.deepEqual(eigeneFunde(a2), []);
  const a3 = { id: 'X', titel: 'T', inhalt: [], interaktion: [{ kind: 'gaps', frage: 'q = [[q]]', felder: { q: { typ: 'zahl' } } }, { kind: 'choice', frage: 'b)', optionen: [{ id: 'a', md: 'Der Geheimtext `31` …' }, { id: 'b', md: 'nein' }] }], loesung: [{ q: ['31'] }, { richtig: ['a'] }] };
  assert.equal(eigeneFunde(a3).length, 1);
  const a4 = { id: 'X', titel: 'Die Wache', inhalt: [], interaktion: { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 12 }, eingabe: 'IMOTQ' }, loesung: { text: 'wache' } };
  assert.equal(eigeneFunde(a4).length, 1, 'Titel verrät den Klartext');
  const a5 = { id: 'X', inhalt: [], schluesselVerdeckt: true, interaktion: [{ kind: 'gaps', frage: 'k = [[k]]', felder: { k: { typ: 'zahl' } } }, { kind: 'chiffre', richtung: 'ent', verfahren: { typ: 'caesar', k: 17 }, eingabe: 'BLIZV' }], loesung: [{ k: ['17'] }, { text: 'kurie' }] };
  assert.deepEqual(eigeneFunde(a5), [], 'verdeckter Schlüssel ist nicht sichtbar');
  // K5: beschriftete Zahl in einem anderen Text (Codebuch, Zerlegung), Nummerierung zählt nicht
  const cb = { inhalt: [], interaktion: { kind: 'gaps', frage: 'die [[die]] · karawane [[k]]', felder: { die: { typ: 'zahl' }, k: { typ: 'zahl' } } }, loesung: { die: ['58'], k: ['62'] } };
  assert.deepEqual(beschrifteteZahlen(cb).map((b) => b.beschriftung), ['die', 'karawane']);
  assert.equal(beschriftetIn('die', '58', ['bagdad 35 · der 39 · die 58 · gold 27']), true);
  assert.equal(beschriftetIn('die', '58', ['die Zahl 158']), false);
  const zl = { inhalt: [], interaktion: { kind: 'gaps', frage: '43 = [[b1]] + [[b2]]', felder: { b1: { typ: 'zahl' }, b2: { typ: 'zahl' } } }, loesung: { b1: ['32'], b2: ['11'] } };
  assert.deepEqual(beschrifteteZahlen(zl).map((b) => b.beschriftung), ['43']);
  assert.equal(beschriftetIn('43', '32', ['für 43 = 32 + 8 + 2 + 1.']), true);
  assert.equal(beschriftetIn('z', '26', ['Nummerierung a = 1 … z = 26']), false);
  const tab = { inhalt: [{ t: 'tabelle', zeilen: [['O', '[[o_w]]']] }], interaktion: { kind: 'gaps', felder: { o_w: { typ: 'zahl' } } }, loesung: { o_w: ['79'] } };
  assert.deepEqual(beschrifteteZahlen(tab).map((b) => b.beschriftung), ['O']);
  assert.equal(beschriftetIn('O', '79', ['*Beispiel* „OK“: O = 79 = `0100 1111`']), true);
  // K6: Anzahl der Optionen verrät die Zahl aus einem anderen Teil; alle Optionen richtig
  const a6 = { id: 'X', inhalt: [], interaktion: [{ kind: 'gaps', felder: { n: { typ: 'zahl' } } }, { kind: 'choice', mehrfach: true, optionen: [{ id: 'a', md: 'x' }, { id: 'b', md: 'y' }, { id: 'c', md: 'z' }, { id: 'd', md: 'w' }] }], loesung: [{ n: ['4'] }, { richtig: ['a', 'b'] }] };
  assert.equal(eigeneFunde(a6).length, 1);
  const a7 = { id: 'X', inhalt: [], interaktion: { kind: 'choice', mehrfach: true, optionen: [{ id: 'a', md: 'x' }, { id: 'b', md: 'y' }] }, loesung: { richtig: ['a', 'b'] } };
  assert.equal(eigeneFunde(a7).length, 1);
});

module.exports = { funde, loesungen, loesungsWerte, stuecke, eigeneFunde, schuelertexte, beschrifteteZahlen };
