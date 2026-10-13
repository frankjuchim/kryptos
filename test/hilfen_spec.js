'use strict';
// Abgleich-Helfer Spec ↔ Seed (Plan M5 Task 73): liest die Aufgaben-Tabellen der Welt-Specs W0–W2
// (quellen/specs/SPEC_Kryptos_W<n>_*.md), bildet die Spec-ids auf die technischen ids ab (E38) und leitet aus der
// Spec-Spalte „Interaktion“ die erwarteten Teil-Interaktionen ab (Interaktions-Mapping, E40, E64, E65).
// Genutzt von inhalte_spec, inhalte_pruefwerte, inhalte_plan, inhalte_videos (und den Inhalts-Tasks 74–89).
//
// API (Plan M5 „Gemeinsame Bausteine“):
//   UMFANG                    { welt: [Abschnitt, …] } – Abschnitte, die vollständig im Seed stehen müssen
//   specAufgaben(welt)        [{ specId, id, abschnitt, art, titel, stufe, niveau, kategorie, interaktion, fallen,
//                                inhalt, loesung, tipps, erklaerung, minuten, zeile }]
//   specLevels(welt)          [{ nr, id, titel, niveau, ds, rolle, werkzeug, merkkasten }]
//   technischeId(specId)      'W2-L21-03' → 'W2-L1-03', 'W2-K1-02' → 'W2-L5-02', 'W0-AF' → 'W0-A-01', 'W2-A' → 'W2-A-01'
//   abschnittVon(id)          'W0-L1-03' → 'W0-L1', 'W0-B-02' → 'W0-B', 'W0-A-01' → 'W0-A', 'WU-W0-03' → 'WU-W0'
//   kindsErwartet(spec, id?)  Spec-Interaktion → Arten der Teil-Interaktionen (gleiche Nachbarn zusammengefasst)
//   kindsSeed(aufgabe)        Arten der Teil-Interaktionen einer Seed-Aufgabe (gleiche Nachbarn zusammengefasst)
//   choiceLoesung(spec, teil) Kennungen (klein) der richtigen Optionen für den Seed-Teil mit Index teil (E62)
//   seed(welt), warmup(welt)  JSON aus seed/welten/welt<n>.json bzw. seed/warmup/w<n>.json oder null
//   normalisiert(text)        Krypto.normalisieren (A–Z, 0–9)
//   texte(wert)               alle Zeichenketten/Zahlen eines JSON-Werts, mit Leerzeichen verbunden

const fs = require('node:fs');
const path = require('node:path');
const Krypto = require('../public/static/js/shared/krypto.js');

const WURZEL = path.join(__dirname, '..');
const SPEC_DATEIEN = { 0: 'SPEC_Kryptos_W0_Antike.md', 1: 'SPEC_Kryptos_W1_Bagdad.md', 2: 'SPEC_Kryptos_W2_Renaissance.md' };

/**
 * Abschnitte, die vollständig und spec-treu im Seed stehen müssen. Jede Inhalts-Task (74–89) ergänzt hier ihren
 * Abschnitt in Step 1 (z. B. 'W0-L1', 'W0-B', 'W0-A', 'WU-W0'); bis dahin sind die Abgleich-Tests leer grün.
 */
const UMFANG = { 0: ['W0-A', 'W0-L1', 'W0-L2', 'W0-L3', 'W0-L4', 'W0-B'], 1: ['W1-A', 'W1-L1', 'W1-L2', 'W1-L3', 'W1-B'], 2: [] };

/* ---------- Entscheidungen des Plans als Tabellen ---------- */

/** E39: ein Rollenwert je Level */
const ROLLE = {
  '0.1': 'kryptografie', '0.2': 'kryptografie', '0.3': 'kryptografie', '0.4': 'kryptografie',
  '1.1': 'kryptoanalyse', '1.2': 'kryptografie', '1.3': 'kryptoanalyse',
  '2.1': 'kryptografie', '2.2': 'kryptoanalyse', '2.3': 'kryptoanalyse', '2.4': 'kryptografie', K1: 'kryptoanalyse'
};

/** E63: Labor-Werkzeuge je Level (Registry-ids); [] = keins */
const WERKZEUG = {
  '0.1': ['skytale'], '0.2': ['scheibe'], '0.3': ['scheibe'], '0.4': [],
  '1.1': ['haeufigkeit', 'substitution'], '1.2': ['haeufigkeit'], '1.3': ['substitution'],
  '2.1': ['vigenere', 'scheibe'], '2.2': ['vigenere'], '2.3': ['vigenere'], '2.4': ['haeufigkeit'], K1: ['vigenere']
};

/** E40: Spec-Interaktion `grid` → Seed-Interaktion (Ausfülltabellen als gaps, Fleißner-Schablone als chiffre) */
const GRID = { 'W0-L1-07': 'chiffre', 'W0-L3-05': 'gaps', 'W2-L2-04': 'gaps', 'W2-L4-01': 'gaps' };

/** E64: Teil ohne Eingabe (offene Begründungsfrage – Spec-Antwort in der Erklärung); Wert = entfallener Teil */
const TEIL_OHNE_EINGABE = { 'W1-L1-05': 'c', 'W1-L3-06': 'c' };

/** E65: in der Spec eine Interaktion, im Seed die verlangten Ergebnisse als Teile */
const TEILE_ERGAENZT = { 'W2-L1-05': ['gaps', 'chiffre'], 'W2-L1-06': ['chiffre', 'chiffre'] };

/* ---------- ids ---------- */

function technischeId(specId) {
  const s = String(specId);
  let m = /^W(\d)-AF$/.exec(s) || /^W(\d)-A$/.exec(s);
  if (m) return `W${m[1]}-A-01`;
  m = /^W(\d)-L(\d)(\d)-(\d{2})$/.exec(s); // W2-L21-03: Welt 2, Level 1
  if (m) return `W${m[1]}-L${m[3]}-${m[4]}`;
  m = /^W(\d)-K(\d)-(\d{2})$/.exec(s); // Kür K1 → Level 5 (nach den vier Leveln der Welt 2)
  if (m) return `W${m[1]}-L${KUER_LEVEL[m[1]] + Number(m[2]) - 1}-${m[3]}`;
  return s;
}
/** Nummer des ersten Kür-Levels je Welt (nach den regulären Leveln) */
const KUER_LEVEL = { 2: 5 };

function abschnittVon(id) {
  const s = String(id);
  let m = /^(WU-W\d)-\d{2}$/.exec(s);
  if (m) return m[1];
  m = /^(W\d-(?:L\d+|B|A))-\d{2}$/.exec(s);
  return m ? m[1] : null;
}

/* ---------- Spec lesen ---------- */

const cache = new Map();
function specText(welt) {
  if (!cache.has(welt)) cache.set(welt, fs.readFileSync(path.join(WURZEL, 'quellen', 'specs', SPEC_DATEIEN[welt]), 'utf8'));
  return cache.get(welt);
}
function specZeilen(welt) {
  return specText(welt).split('\n');
}

/** Tabellenzeile in Zellen (| außerhalb von Backticks trennt; \| ist ein Zeichen) */
function zellen(zeile) {
  const out = [];
  let cur = '';
  let backtick = false;
  const s = zeile.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') backtick = !backtick;
    if (c === '|' && !backtick) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const ZEILEN_ID = /^\|\s*(W\d-(?:L\d{1,2}-\d{2}|K\d-\d{2}|B-\d{2}|AF)|WU-W\d-\d{2})\s*\|/;
const fallenAus = (text) => [...new Set(String(text || '').match(/P\d+/g) || [])];
const stufeAus = (text) => (String(text || '').match(/★/g) || []).length;

/** Archivfund-Titel aus §0.1 („Archivfund „…““) */
function archivfundTitel(welt) {
  const m = /\*\*Archivfund „([^“]+)“/.exec(specText(welt));
  return m ? m[1] : null;
}

/** Alle Aufgaben-Zeilen einer Welt-Spec (Lab 11, Boss 8, Archivfund 5, Warm-up 6 Spalten). */
function specAufgaben(welt) {
  const liste = [];
  const zeilen = specZeilen(welt);
  zeilen.forEach((z, i) => {
    const m = ZEILEN_ID.exec(z);
    if (!m) return;
    const specId = m[1];
    const c = zellen(z);
    const id = technischeId(specId);
    const basis = { specId, id, abschnitt: abschnittVon(id), zeile: i + 1 };
    if (/^WU-/.test(specId)) {
      // | ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
      liste.push({ ...basis, art: 'warmup', titel: c[1], inhalt: c[2], loesung: c[3], minuten: Number(c[4]) || null, kategorie: c[5], fallen: [], stufe: null, niveau: null, interaktion: null, tipps: [], erklaerung: '' });
    } else if (/-B-/.test(specId)) {
      // | ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung | Lösung | Erklärung |  – Fallen aus der Erklärung (E53)
      liste.push({ ...basis, art: 'boss', titel: null, stufe: stufeAus(c[1]), niveau: c[2], kategorie: c[3], interaktion: c[4], inhalt: c[5], loesung: c[6], erklaerung: c[7], fallen: fallenAus(c[7]), tipps: [] });
    } else if (/-AF$/.test(specId)) {
      // | ID | Titel | Interaktion | Inhalt | Lösung |
      liste.push({ ...basis, art: 'archivfund', titel: archivfundTitel(welt) || c[1], stufe: null, niveau: 'kern', kategorie: null, interaktion: c[2], inhalt: c[3], loesung: c[4], erklaerung: '', fallen: [], tipps: [] });
    } else {
      // | ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
      liste.push({ ...basis, art: 'lab', titel: c[1], stufe: stufeAus(c[2]), niveau: c[3], kategorie: c[4], interaktion: c[5], fallen: fallenAus(c[6]), inhalt: c[7], loesung: c[8], tipps: c[9] ? c[9].split(' / ').map((t) => t.trim()) : [], erklaerung: c[10] });
    }
  });
  // W2: Archivfund ohne Tabelle in §2 („### Archivfund W2-A“)
  if (!liste.some((a) => a.art === 'archivfund')) {
    const i = zeilen.findIndex((z) => /^### Archivfund W\d-A\b/.test(z));
    if (i >= 0) {
      const specId = /(W\d-A)\b/.exec(zeilen[i])[1];
      const id = technischeId(specId);
      liste.unshift({ specId, id, abschnitt: abschnittVon(id), zeile: i + 1, art: 'archivfund', titel: archivfundTitel(welt), stufe: null, niveau: 'kern', kategorie: null, interaktion: null, inhalt: '', loesung: '', erklaerung: '', fallen: [], tipps: [] });
    }
  }
  return liste;
}

/** DS je Level aus der Tabelle §0.3 („| DS | Thema | Level | …“) */
function dsTabelle(welt) {
  const ds = {};
  for (const z of specZeilen(welt)) {
    const m = /^\|\s*(\d+)\s*\|[^|]*\|\s*([\dK., ]+)\s*\|/.exec(z);
    if (!m) continue;
    for (const nr of m[2].split(',').map((x) => x.trim()).filter(Boolean)) (ds[nr] = ds[nr] || []).push(Number(m[1]));
  }
  return ds;
}

/** Level-Köpfe der Spec (§2): Nummer, Titel, Niveau, DS, Merkkasten (+ Rolle/Werkzeug nach E39/E63). */
function specLevels(welt) {
  const zeilen = specZeilen(welt);
  const tabelle = dsTabelle(welt);
  const levels = [];
  zeilen.forEach((z, i) => {
    const m = /^### (?:Level (\d\.\d)|Kür (K\d)) – (.+)$/.exec(z);
    if (!m) return;
    const nr = m[1] || m[2];
    const titel = m[3].replace(/\s*\((?:eA|kuer)\)\s*$/, '').trim();
    let ende = zeilen.findIndex((x, j) => j > i && /^#{2,3} /.test(x));
    if (ende < 0) ende = zeilen.length;
    const abschnitt = zeilen.slice(i + 1, ende);
    const kopf = abschnitt.join('\n');
    const niveau = (/\*\*Niveau:\*\*\s*(\w+)/.exec(kopf) || [])[1] || null;
    // DS aus dem Kopf („**DS:** 6“; „frei“ bei der Kür → null), sonst aus der Tabelle §0.3
    const dsKopf = /\*\*DS:\*\*\s*(\d[\d, ]*|frei)/.exec(kopf);
    const ds = dsKopf ? (dsKopf[1] === 'frei' ? null : dsKopf[1].split(',').map((x) => x.trim()).filter(Boolean).map(Number)) : tabelle[nr] || null;
    // Merkkasten: erste Blockzitat-Zeilen nach „Merkkasten“
    const mk = abschnitt.findIndex((x) => /Merkkasten/.test(x));
    let merkkasten = null;
    if (mk >= 0) {
      const zitat = [];
      for (const x of abschnitt.slice(mk + 1)) {
        if (/^\s*>/.test(x)) zitat.push(x.replace(/^\s*>\s?/, '').trim());
        else if (zitat.length) break;
      }
      merkkasten = zitat.join(' ').trim() || null;
    }
    const lk = m[2] ? KUER_LEVEL[welt] + Number(m[2].slice(1)) - 1 : Number(nr.split('.')[1]);
    levels.push({ nr, id: `W${welt}-L${lk}`, titel, niveau, ds, rolle: ROLLE[nr] || null, werkzeug: WERKZEUG[nr] || [], merkkasten, kuer: !!m[2] });
  });
  return levels;
}

/* ---------- Interaktionen ---------- */

const KINDS = ['chiffre', 'zuordnung', 'gaps', 'choice', 'match', 'order', 'lines', 'grid', 'bits-rechnen', 'schaubild-ergaenzen'];

/** gleiche Nachbarn zusammenfassen (die Spec nennt eine Art je Gruppe, z. B. „gaps (mehrteilig)“) */
const verdichte = (liste) => liste.filter((x, i) => i === 0 || x !== liste[i - 1]);

/**
 * Spec-Spalte „Interaktion“ → erwartete Arten der Teil-Interaktionen. Blöcke (matrix, alphabet, quadrat, Tabelle,
 * Porta-Tafel) zählen nicht; „`quadrat` (ergänzen)“ ist eine gaps-Lücke im Quadrat; `grid` nach E40 (GRID, sonst gaps).
 * Mit id: Ausnahmen TEILE_ERGAENZT (E65) und TEIL_OHNE_EINGABE (E64) werden angewendet.
 */
function kindsErwartet(specInteraktion, id) {
  if (id && TEILE_ERGAENZT[id]) return verdichte(TEILE_ERGAENZT[id]);
  const s = String(specInteraktion || '');
  const teile = s.replace(/^mehrteilig:\s*/, '').split(/\s\+\s/);
  const kinds = [];
  for (const t of teile) {
    if (/^`?quadrat`?\s*\(ergänzen\)/.test(t.trim())) { kinds.push('gaps'); continue; }
    const m = /^`?([a-z-]+)`?/.exec(t.trim());
    if (!m || !KINDS.includes(m[1])) continue;
    kinds.push(m[1] === 'grid' ? (id && GRID[id]) || 'gaps' : m[1]);
  }
  if (id && TEIL_OHNE_EINGABE[id] && kinds.length > 1) kinds.pop(); // der entfallene Teil steht in der Spec zuletzt
  return verdichte(kinds);
}

/** Teile einer Seed-Aufgabe: [{ interaktion, loesung }] */
function teile(a) {
  if (Array.isArray(a.interaktion)) return a.interaktion.map((ia, i) => ({ interaktion: ia, loesung: Array.isArray(a.loesung) ? a.loesung[i] : undefined }));
  return [{ interaktion: a.interaktion, loesung: a.loesung }];
}
const kindsSeed = (a) => verdichte(teile(a).map((t) => t.interaktion && t.interaktion.kind));

/** Lösungstext in Teile „a) … b) …“ zerlegen ({ a: '…', … }) oder null */
function loesungsTeile(text) {
  const re = /(?:^|[;\s(])([a-e])\)\s/g;
  const st = [];
  let m;
  while ((m = re.exec(text))) st.push({ b: m[1], start: m.index + m[0].length, kopf: m.index });
  if (!st.length || st[0].b !== 'a') return null;
  const o = {};
  st.forEach((x, k) => { o[x.b] = text.slice(x.start, k + 1 < st.length ? st[k + 1].kopf : text.length).trim(); });
  return o;
}

/** Kennungen der richtigen Optionen in einem Lösungsstück: „(B)“, „(1), (3)“, „A, B, C ✔ …“, „nein – …“ (E62, E64) */
function kennungen(stueck) {
  if (!stueck) return null;
  const s = String(stueck).replace(/✔.*$/, '').trim();
  const jn = /^(ja|nein)\b/i.exec(s);
  if (jn) return [jn[1].toLowerCase()];
  const kopf = s.split(/\s[–—-]\s|;/)[0];
  let r = [...kopf.matchAll(/\(([A-F]|\d)\)/g)].map((x) => x[1].toLowerCase());
  if (!r.length) {
    const m = /^([A-F](?:\s*,\s*[A-F])*)\b/.exec(kopf);
    if (m) r = m[1].split(/\s*,\s*/).map((x) => x.toLowerCase());
  }
  return r.length ? r : null;
}

/** Richtige Optionen (Kennungen klein) für den choice-Teil mit Index teil der Seed-Aufgabe (a = 0, b = 1, …). */
function choiceLoesung(spec, teil = 0) {
  const t = loesungsTeile(String(spec.loesung || ''));
  if (!t) return teil === 0 ? kennungen(spec.loesung) : null;
  return kennungen(t[String.fromCharCode(97 + teil)]);
}

/* ---------- Seeds ---------- */

function ladeJson(datei) {
  try {
    return JSON.parse(fs.readFileSync(datei, 'utf8'));
  } catch {
    return null;
  }
}
const seed = (welt) => ladeJson(path.join(WURZEL, 'seed', 'welten', `welt${welt}.json`));
const warmup = (welt) => ladeJson(path.join(WURZEL, 'seed', 'warmup', `w${welt}.json`));

const normalisiert = (text) => Krypto.normalisieren(String(text ?? ''));

/** Alle Zeichenketten und Zahlen eines JSON-Werts, mit Leerzeichen verbunden */
function texte(wert) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string' || typeof x === 'number') out.push(String(x));
    else if (Array.isArray(x)) x.forEach(lauf);
    else if (x && typeof x === 'object') Object.values(x).forEach(lauf);
  })(wert);
  return out.join(' ');
}

module.exports = {
  WURZEL, SPEC_DATEIEN, UMFANG, ROLLE, WERKZEUG, GRID, TEIL_OHNE_EINGABE, TEILE_ERGAENZT,
  technischeId, abschnittVon, specAufgaben, specLevels, specZeilen, archivfundTitel, zellen,
  kindsErwartet, kindsSeed, teile, choiceLoesung, loesungsTeile, kennungen,
  seed, warmup, normalisiert, texte
};
