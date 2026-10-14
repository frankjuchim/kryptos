'use strict';
// Abgleich-Helfer Spec ↔ Seed (Plan M5 Task 73, für W3–W6 erweitert in Plan M8 Task 171): liest die Aufgaben-Tabellen
// der Welt-Specs W0–W6
// (quellen/specs/SPEC_Kryptos_W<n>_*.md), bildet die Spec-ids auf die technischen ids ab (E38) und leitet aus der
// Spec-Spalte „Interaktion“ die erwarteten Teil-Interaktionen ab (Interaktions-Mapping, E40, E64, E65).
// Genutzt von inhalte_spec, inhalte_pruefwerte, inhalte_plan, inhalte_videos (und den Inhalts-Tasks 74–89).
//
// API (Plan M5 „Gemeinsame Bausteine“):
//   UMFANG                    { welt: [Abschnitt, …] } – Abschnitte, die vollständig im Seed stehen müssen
//   specAufgaben(welt)        [{ specId, id, abschnitt, art, titel, stufe, niveau, kategorie, interaktion, fallen,
//                                inhalt, loesung, tipps, erklaerung, minuten, zeile }]
//   specLevels(welt)          [{ nr, id, titel, niveau, ds, rolle, werkzeug, merkkasten }]
//   technischeId(specId)      'W2-L21-03' → 'W2-L1-03', 'W2-K1-02' → 'W2-L5-02', 'W0-AF' → 'W0-A-01', 'W2-A' → 'W2-A-01',
//                             'W3-L1-00' → 'W3-A-01', 'W3-K2-04' → 'W3-L5-04', 'W4-K3-02' → 'W4-L3-02' (M8 E120)
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
const SPEC_DATEIEN = {
  0: 'SPEC_Kryptos_W0_Antike.md', 1: 'SPEC_Kryptos_W1_Bagdad.md', 2: 'SPEC_Kryptos_W2_Renaissance.md',
  3: 'SPEC_Kryptos_W3_Maschinen.md', 4: 'SPEC_Kryptos_W4_Schluesselproblem.md', 5: 'SPEC_Kryptos_W5_Netz.md', 6: 'SPEC_Kryptos_W6_Zeitmaschine.md'
};

/**
 * Abschnitte, die vollständig und spec-treu im Seed stehen müssen. Jede Inhalts-Task (74–89) ergänzt hier ihren
 * Abschnitt in Step 1 (z. B. 'W0-L1', 'W0-B', 'W0-A', 'WU-W0'); bis dahin sind die Abgleich-Tests leer grün.
 */
const UMFANG = {
  0: ['W0-A', 'W0-L1', 'W0-L2', 'W0-L3', 'W0-L4', 'W0-B', 'WU-W0'], 1: ['W1-A', 'W1-L1', 'W1-L2', 'W1-L3', 'W1-B', 'WU-W1'],
  2: ['W2-A', 'W2-L1', 'W2-L2', 'W2-L3', 'W2-L4', 'W2-L5', 'W2-B', 'WU-W2'],
  // Plan M8: die Inhalts-Tasks 172–190 tragen ihre Abschnitte ein
  3: ['W3-A', 'W3-L1', 'W3-L2', 'W3-L3', 'W3-L4', 'W3-L5', 'W3-B'], 4: ['W4-A', 'W4-L1', 'W4-L2', 'W4-L3', 'W4-B'], 5: ['W5-A', 'W5-L1', 'W5-L2', 'W5-L3', 'W5-B'], 6: ['W6-A', 'W6-L1', 'W6-L2', 'W6-L3', 'W6-B']
};
/** Welten mit Spec (Abgleich-Tests laufen über alle) */
const WELTEN = [0, 1, 2, 3, 4, 5, 6];

/* ---------- Entscheidungen des Plans als Tabellen ---------- */

/** E39 (M5), E121 (M8): ein Rollenwert je Level */
const ROLLE = {
  '0.1': 'kryptografie', '0.2': 'kryptografie', '0.3': 'kryptografie', '0.4': 'kryptografie',
  '1.1': 'kryptoanalyse', '1.2': 'kryptografie', '1.3': 'kryptoanalyse',
  '2.1': 'kryptografie', '2.2': 'kryptoanalyse', '2.3': 'kryptoanalyse', '2.4': 'kryptografie', K1: 'kryptoanalyse',
  '3.1': 'kryptografie', '3.2': 'kryptografie', '3.3': 'kryptografie', '3.4': 'kryptoanalyse', K2: 'kryptoanalyse',
  '4.1': 'kryptografie', '4.2': 'kryptografie', K3: 'kryptografie',
  '5.1': 'kryptografie', '5.2': 'kryptografie', '5.3': 'kryptoanalyse',
  '6.1': 'kryptoanalyse', '6.2': 'kryptoanalyse', '6.3': 'kryptografie'
};

/** E63: Labor-Werkzeuge je Level (Registry-ids); [] = keins */
const WERKZEUG = {
  '0.1': ['skytale'], '0.2': ['scheibe'], '0.3': ['scheibe'], '0.4': [],
  '1.1': ['haeufigkeit', 'substitution'], '1.2': ['haeufigkeit'], '1.3': ['substitution'],
  '2.1': ['vigenere', 'scheibe'], '2.2': ['vigenere'], '2.3': ['vigenere'], '2.4': ['haeufigkeit'], K1: ['vigenere'],
  // M8 E122: Level-Feld nur, wo die Spec das Werkzeug für das ganze Level nennt (Aufgaben-Einbettung als Block werkzeug)
  '3.1': ['bitlupe'], '3.2': ['runden'], '3.3': [], '3.4': [], K2: ['runden'],
  '4.1': [], '4.2': [], K3: ['rsa'],
  '5.1': ['hash'], '5.2': ['signatur'], '5.3': ['signatur'],
  '6.1': [], '6.2': ['skytale', 'vigenere'], '6.3': []
};

/** M6 E70: Reiter-Voreinstellungen der Level-Köpfe (Spec §2 „Labor-Werkzeug: … nur Reiter …“); fehlt ein Eintrag → keine */
const REITER = {
  '2.1': { vigenere: ['quadrat', 'verschluesseln'] },
  '2.4': { haeufigkeit: ['bigramme', 'histogramm'] },
  // M8 „Werkzeuge je Level“ (E122)
  '3.2': { runden: ['runden', 'lawine', 'verfolgung', 'modi', 'fehler'] },
  K2: { runden: ['enigma'] },
  K3: { rsa: ['euklid', 'rechenwerk'] },
  '5.1': { hash: ['lawine'] },
  '5.2': { signatur: ['signatur'] },
  '5.3': { signatur: ['zertifikat'] },
  '6.2': { skytale: ['ring'], vigenere: ['verschluesseln'] }
};

/** M8 E146: DS je Level der Welten 3–6 fest (die §0.3-Tabellen der W3–W6-Specs sind verschieden gebaut) */
const DS_FEST = {
  '3.1': [9], '3.2': [10], '3.3': [11], '3.4': [11], K2: [],
  '4.1': [12], '4.2': [13], K3: [],
  '5.1': [14], '5.2': [15], '5.3': [16],
  '6.1': [17], '6.2': [17], '6.3': [17, 18]
};

/** E40: Spec-Interaktion `grid` → Seed-Interaktion (Ausfülltabellen als gaps, Fleißner-Schablone als chiffre) */
const GRID = {
  'W0-L1-07': 'chiffre', 'W0-L3-05': 'gaps', 'W2-L2-04': 'gaps', 'W2-L4-01': 'gaps',
  // M8: Euklid-Tabelle, Quadrierkette, Wertetabelle, KH-Rundentabelle (technische ids: W4-K3-nn → W4-L3-nn)
  'W4-L1-06': 'gaps', 'W4-L3-02': 'gaps', 'W4-L3-06': 'gaps', 'W5-L1-02': 'gaps'
};

/** E64: Teil ohne Eingabe (offene Begründungsfrage – Spec-Antwort in der Erklärung); Wert = entfallener Teil */
const TEIL_OHNE_EINGABE = {
  'W1-L1-05': 'c', 'W1-L3-06': 'c',
  // M8 E129: „lines“ als Begründung/Urteil in Sätzen (technische ids: W3-K2-nn → W3-L5-nn)
  'W3-L2-08': 'Begründung', 'W3-L4-07': 'Urteil', 'W3-L5-03': 'Begründung', 'W3-L5-05': 'Beurteilung'
};

/**
 * E65: in der Spec eine Interaktion, im Seed die verlangten Ergebnisse als Teile. (W2-L1-06 seit der M5-Inhaltsprüfung
 * mit zwei chiffre-Teilen – b) entschlüsselt einen eigenen Geheimtext statt des Rückwegs aus a) –, keine Ausnahme mehr.)
 */
const TEILE_ERGAENZT = {
  'W2-L1-05': ['gaps', 'chiffre'],
  // M8 E128 (Ketten mit XOR), E131 (W3-L2-07), E134 (Archivfund W5)
  'W3-L1-04': ['bits-rechnen', 'gaps'], 'W3-L2-07': ['choice', 'gaps', 'choice'], 'W4-L1-08': ['bits-rechnen', 'gaps'],
  'W4-B-15': ['gaps'], 'W5-A-01': ['gaps', 'choice'],
  // „gültig? [2] … [4]“ (ja/nein in den Lücken) als Klappliste gaps typ auswahl wie E130 (Festlegung Task 171)
  'W5-L2-05': ['gaps'],
  // Spec-Spalte „choice + gaps“, Teile aber a) d bestimmen (gaps), b) entscheiden (choice)
  'W4-L2-07': ['gaps', 'choice'],
  // Spec-Spalte „chiffre + gaps“, Teile aber a) k bestimmen (gaps), b) Klartext (chiffre) – Plan M8 Task 174
  'W3-L3-07': ['gaps', 'chiffre'],
  // Boss W3 (Plan M8 Task 177): B-06 als gaps (die OST-Bits als Operand wären die Lösung von W3-L1-04 a), E128-Muster),
  // B-12 „gaps“ der Spec als zwei Auswahlen P₁–P₅ (E131-Muster)
  'W3-B-06': ['gaps'], 'W3-B-12': ['choice', 'choice'],
  // Plan M8 Task 187 (E128-Muster): a) Zwischentext (gaps), b) Geheimtext (chiffre uhrwerk)
  'W6-L2-03': ['gaps', 'chiffre']
};

/** Plan M8 Task 184: Spec-Lücken ohne Eingabefeld (Begründung „weil …“ – Musterantwort in der Erklärung, wie E129) */
const LUECKE_OHNE_FELD = { 'W5-L3-05': ['4'] };

/** M8 E127: Spec-„zuordnung“ als Kategorien-Zuordnung → Kern-match */
const ZUORDNUNG_ALS_MATCH = ['W4-L2-03', 'W5-L3-08'];

/**
 * Plan M8 Task 179: Schaubild-Lücken der Spec („Lücke 1: öffentlicher Schlüssel von Bob“, „L1 Sitzungsschlüssel K“)
 * → erwartete Seed-Antwort { art, inhaber? } (inhaber fehlt: jeder Inhaber erlaubt, z. B. gemeinsamer Sitzungsschlüssel).
 */
const SCHAUBILD_TEXT = {
  'öffentlicher schlüssel von bob': { art: 'oeffentlich', inhaber: 'B' }, 'privater schlüssel von bob': { art: 'privat', inhaber: 'B' },
  'öffentlicher schlüssel von alice': { art: 'oeffentlich', inhaber: 'A' }, 'privater schlüssel von alice': { art: 'privat', inhaber: 'A' },
  'sitzungsschlüssel k': { art: 'sitzung' }
};
/** Spec-Lösung eines Schaubilds → { l1: { art, inhaber? }, … } (Nummern der Lücken) oder null */
function schaubildLoesung(text) {
  const out = {};
  for (const m of String(text || '').replace(/\*\*/g, '').matchAll(/(?:Lücke |L)(\d):?\s*([^·;]+)/g)) {
    const e = SCHAUBILD_TEXT[m[2].trim().toLowerCase()];
    if (e) out[`l${m[1]}`] = e;
  }
  // W6-L2-09: Lücken mit Buchstaben „A: …; B: …“ → Felder la, lb (Plan M8 Task 187)
  for (const m of String(text || '').replace(/\*\*/g, '').matchAll(/(?:^|;\s*)([A-Z]):\s*([^;]+)/g)) {
    const e = SCHAUBILD_TEXT[m[2].trim().toLowerCase()];
    if (e) out[`l${m[1].toLowerCase()}`] = e;
  }
  return Object.keys(out).length ? out : null;
}

/** M8 E126: Sonderformen (Spec-Interaktion → Seed-Arten) */
const SONDERFORM = { 'W5-L1-07': ['hash-ziel'], 'W3-B-08': ['bits-rechnen'] }; // W3-B-08: K₃ über bits-rechnen schritt rundenschluessel (E124)

/**
 * M8 E130: choice ohne Kennungen in der Spec – Options-ids a, b, … in Spec-Reihenfolge, die Lösung ist die Option mit
 * dem Lösungstext (der Abgleich vergleicht den Optionstext, choiceText).
 */
const CHOICE_OHNE_KENNUNG = {
  'W4-L1-01': { 0: ['6'] }, 'W4-L2-02': { 0: ['Bobs öffentlicher Schlüssel'] },
  'W3-B-13': { 1: ['0000 0000', '1111 1111'] }, 'W5-L1-05': { 1: ['G'] }
};

/** M8 E131: choice-Lösungen, die die Spec nur in Worten nennt – Teil-Index → Options-ids (W3-L2-07: ids 1–5 = P₁–P₅) */
const CHOICE_FEST = { 'W3-L2-07': { 0: ['2', '3'], 2: ['2'] }, 'W3-B-12': { 0: ['3', '4'], 1: ['4'] },
  // E134: Archivfund W5 b) – die drei Spec-Befunde (b1–b3) neben ihren Verneinungen (v1–v3)
  'W5-A-01': { 1: ['b1', 'b2', 'b3'] } };

/* ---------- ids ---------- */

function technischeId(specId) {
  const s = String(specId);
  let m = /^W(\d)-AF$/.exec(s) || /^W(\d)-A$/.exec(s) || /^W(\d)-L\d-00$/.exec(s); // M8 E120: W3-L1-00 = Archivfund
  if (m) return `W${m[1]}-A-01`;
  m = /^W(\d)-L(\d)(\d)-(\d{2})$/.exec(s); // W2-L21-03: Welt 2, Level 1
  if (m) return `W${m[1]}-L${m[3]}-${m[4]}`;
  m = /^W(\d)-K(\d)-(\d{2})$/.exec(s); // Kür → Level nach den regulären Leveln (W2-K1 → L5, W3-K2 → L5, W4-K3 → L3)
  if (m) return `W${m[1]}-L${KUER_LEVEL[m[1]]}-${m[3]}`;
  return s;
}
/** Level-Nummer des (einzigen) Kür-Levels je Welt, nach den regulären Leveln (M8 E120) */
const KUER_LEVEL = { 2: 5, 3: 5, 4: 3 };

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
/** „kern (D: eA)“ (W6-L2-10, M8 E132) → „kern“ – Niveau gilt je Aufgabe */
const erstesWort = (text) => String(text || '').trim().split(/\s+/)[0];

/** Archivfund-Titel aus §0 („**Archivfund „…“**“, W3 „**Archivfund:** „…““, W6 „### 0.1 Archivfund „…““) */
function archivfundTitel(welt) {
  const m = /\*\*Archivfund(?::\*\*)? „([^“]+)“/.exec(specText(welt)) || /^### [\d.]+ Archivfund „([^“]+)“/m.exec(specText(welt));
  return m ? m[1] : null;
}

/** Zelle mit <br>-Listen → Zeilenumbrüche (W6) */
const br = (x) => String(x ?? '').replace(/<br\s*\/?>/g, '\n');

/** Tipps: „T1: … T2: …“ (W4, W5), „1: … / 2: …“ (W6), sonst „… / …“; Präfixe weg */
function tippsAus(zelle) {
  const t = String(zelle || '').trim();
  if (!t) return [];
  const teile = /^T1:/.test(t) ? t.split(/\s*T2:\s*/) : t.split(' / ');
  return teile.map((x) => x.replace(/^(?:T\d|\d):\s*/, '').trim()).filter(Boolean);
}

/** Alle Aufgaben-Zeilen einer Welt-Spec (Lab 11, Boss 8, Archivfund 5, Warm-up 6 Spalten). */
function specAufgaben(welt) {
  const liste = [];
  const zeilen = specZeilen(welt);
  zeilen.forEach((z, i) => {
    const m = ZEILEN_ID.exec(z);
    if (!m) return;
    const specId = m[1];
    const c = zellen(z).map(br);
    // nur die Aufgaben-Tabellen (Lab 11, Boss 8, Archivfund 5, Warm-up 6 Spalten) – keine Zeilen aus §11/§12
    const noetig = /^WU-/.test(specId) ? 6 : /-B-/.test(specId) ? 8 : /-AF$/.test(specId) ? 5 : 11;
    if (c.length < noetig) return;
    const id = technischeId(specId);
    const basis = { specId, id, abschnitt: abschnittVon(id), zeile: i + 1 };
    if (/^WU-/.test(specId)) {
      // | ID | Titel | Aufgabe (Vorderseite) | Lösung (Rückseite) | Min. | Kategorie |
      liste.push({ ...basis, art: 'warmup', titel: c[1], inhalt: c[2], loesung: c[3], minuten: Number(c[4]) || null, kategorie: c[5], fallen: [], stufe: null, niveau: null, interaktion: null, tipps: [], erklaerung: '' });
    } else if (/-B-/.test(specId)) {
      // | ID | Stufe | Niveau | Kategorie | Interaktion | Aufgabenstellung | Lösung | Erklärung |  – Fallen aus der Erklärung (E53)
      liste.push({ ...basis, art: 'boss', titel: null, stufe: stufeAus(c[1]), niveau: erstesWort(c[2]), kategorie: c[3], interaktion: c[4], inhalt: c[5], loesung: c[6], erklaerung: c[7], fallen: fallenAus(c[7]), tipps: [] });
    } else if (/-AF$/.test(specId)) {
      // | ID | Titel | Interaktion | Inhalt | Lösung |
      liste.push({ ...basis, art: 'archivfund', titel: archivfundTitel(welt) || c[1], stufe: null, niveau: 'kern', kategorie: null, interaktion: c[2], inhalt: c[3], loesung: c[4], erklaerung: '', fallen: [], tipps: [] });
    } else {
      // | ID | Titel | Stufe | Niveau | Kategorie | Interaktion | Fallen | Inhalt | Lösung | Tipp 1 / Tipp 2 | Erklärung |
      liste.push({ ...basis, art: 'lab', titel: c[1], stufe: stufeAus(c[2]), niveau: erstesWort(c[3]), kategorie: c[4], interaktion: c[5], fallen: fallenAus(c[6]), inhalt: c[7], loesung: c[8], tipps: tippsAus(c[9]), erklaerung: c[10] });
    }
  });
  // W2: Archivfund ohne Tabelle in §2 („### Archivfund W2-A“); W3 „**Archivfund W3-L1-00**“, W4/W5 „**Archivfund „…“**“,
  // W6 „### 0.1 Archivfund „…““ (M8): synthetische Zeile W<n>-A
  if (!liste.some((a) => a.art === 'archivfund')) {
    const i = zeilen.findIndex((z) => /^### Archivfund W\d-A\b/.test(z) || /^\*\*Archivfund (?:W\d-L\d-00\*\*|„)/.test(z) || /^### [\d.]+ Archivfund „/.test(z));
    if (i >= 0) {
      const specId = `W${welt}-A`;
      const id = technischeId(specId);
      // W3: „**Archivfund W3-L1-00** (ohne Punkte, `bits-rechnen` + `gaps`)“ nennt die Interaktion
      const ia = /\(ohne Punkte, (`[^)]*`)\)/.exec(zeilen[i]);
      liste.unshift({ specId, id, abschnitt: abschnittVon(id), zeile: i + 1, art: 'archivfund', titel: archivfundTitel(welt), stufe: null, niveau: 'kern', kategorie: null, interaktion: ia ? ia[1] : null, inhalt: '', loesung: '', erklaerung: '', fallen: [], tipps: [] });
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
    const titel = m[3].replace(/\s*\([^)]*\)\s*$/, '').trim(); // ohne Klammerzusatz („(eA)“, „(vereinfacht)“)
    let ende = zeilen.findIndex((x, j) => j > i && /^#{2,3} /.test(x));
    if (ende < 0) ende = zeilen.length;
    const abschnitt = zeilen.slice(i + 1, ende);
    const kopf = abschnitt.join('\n');
    // „**Niveau:** kern“ (W0–W2, W6), „**Niveau** kern“ (W3), „**Niveau:** `kern`“ (W4/W5)
    const niveau = (/\*\*Niveau:?\*\*:?\s*`?(\w+)`?/.exec(kopf) || [])[1] || null;
    // DS aus dem Kopf („**DS:** 6“; „frei“ bei der Kür → null), sonst aus der Tabelle §0.3
    const dsKopf = /\*\*DS:\*\*\s*(\d[\d, ]*|frei)/.exec(kopf);
    let ds = dsKopf ? (dsKopf[1] === 'frei' ? null : dsKopf[1].split(',').map((x) => x.trim()).filter(Boolean).map(Number)) : tabelle[nr] || null;
    if (welt >= 3) ds = DS_FEST[nr] || null; // M8 E146
    // Merkkasten: erste Blockzitat-Zeilen nach „Merkkasten“
    const mk = abschnitt.findIndex((x) => /Merkkasten/.test(x));
    let merkkasten = null;
    if (mk >= 0) {
      const zitat = [];
      for (const x of abschnitt.slice(mk + 1)) {
        if (/^\s*>/.test(x)) zitat.push(x.replace(/^\s*>\s?/, '').trim());
        else if (zitat.length) break;
      }
      // W6: Merkkasten als eingerückter Fließtext unter dem Listenpunkt (M8)
      if (!zitat.length) {
        for (const x of abschnitt.slice(mk + 1)) {
          if (/^ {2,}\S/.test(x)) zitat.push(x.trim());
          else break;
        }
      }
      merkkasten = zitat.join(' ').trim() || null;
    }
    const lk = m[2] ? KUER_LEVEL[welt] : Number(nr.split('.')[1]);
    levels.push({ nr, id: `W${welt}-L${lk}`, titel, niveau, ds, rolle: ROLLE[nr] || null, werkzeug: WERKZEUG[nr] || [], merkkasten, kuer: !!m[2] });
  });
  return levels;
}

/* ---------- Interaktionen ---------- */

const KINDS = ['chiffre', 'zuordnung', 'gaps', 'choice', 'match', 'order', 'lines', 'grid', 'bits-rechnen', 'schaubild-ergaenzen', 'hash-ziel'];

/** gleiche Nachbarn zusammenfassen (die Spec nennt eine Art je Gruppe, z. B. „gaps (mehrteilig)“) */
const verdichte = (liste) => liste.filter((x, i) => i === 0 || x !== liste[i - 1]);

/**
 * Spec-Spalte „Interaktion“ → erwartete Arten der Teil-Interaktionen. Blöcke (matrix, alphabet, quadrat, Tabelle,
 * Porta-Tafel) zählen nicht; „`quadrat` (ergänzen)“ ist eine gaps-Lücke im Quadrat; `grid` nach E40 (GRID, sonst gaps).
 * Mit id: Ausnahmen TEILE_ERGAENZT (E65) und TEIL_OHNE_EINGABE (E64) werden angewendet.
 */
function kindsErwartet(specInteraktion, id) {
  if (id && TEILE_ERGAENZT[id]) return verdichte(TEILE_ERGAENZT[id]);
  if (id && SONDERFORM[id]) return verdichte(SONDERFORM[id]);
  const s = String(specInteraktion || '');
  const teile = s.replace(/^mehrteilig:\s*/, '').split(/\s\+\s/);
  const kinds = [];
  for (const t of teile) {
    if (/^`?quadrat`?\s*\(ergänzen\)/.test(t.trim())) { kinds.push('gaps'); continue; }
    const m = /^`?([a-z-]+)`?/.exec(t.trim());
    if (!m || !KINDS.includes(m[1])) continue;
    if (m[1] === 'zuordnung' && id && ZUORDNUNG_ALS_MATCH.includes(id)) { kinds.push('match'); continue; }
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

/**
 * Kennungen der richtigen Optionen in einem Lösungsstück: „(B)“, „(1), (3)“, „A, B, C ✔ …“, „nein – …“ (E62, E64);
 * M8: „**B**“ fett, „(1) w (2) w (3) f …“ (w/f je Aussage → die Kennungen mit w, E130), „korrekt: (1), (2)“.
 */
function kennungen(stueck) {
  if (!stueck) return null;
  const s = String(stueck).replace(/✔.*$/, '').replace(/\*\*/g, '').replace(/^korrekt:\s*/i, '').trim();
  const wf = [...s.matchAll(/\((\d)\)\s*([wf])\b/g)];
  if (wf.length >= 2) return wf.filter((x) => x[2] === 'w').map((x) => x[1]);
  const jn = /^(ja|nein|korrekt|falsch)\b/i.exec(s); // M8: Einzelaussage „korrekt. Begründung: …“ (W3-L2-08)
  if (jn) return [jn[1].toLowerCase()];
  const kopf = s.split(/\s[–—-]\s|;/)[0];
  let r = [...kopf.matchAll(/\(([A-F]|\d)\)/g)].map((x) => x[1].toLowerCase());
  if (!r.length) {
    const m = /^([A-F](?:\s*,\s*[A-F])*)\b/.exec(kopf);
    if (m) r = m[1].split(/\s*,\s*/).map((x) => x.toLowerCase());
  }
  return r.length ? r : null;
}

/** Lösungstexte des choice-Teils teil einer Aufgabe ohne Kennungen (E130, Tabelle CHOICE_OHNE_KENNUNG) oder null */
const choiceText = (spec, teil = 0) => ((CHOICE_OHNE_KENNUNG[spec.id] || {})[teil]) || null;

/** Richtige Optionen (Kennungen klein) für den choice-Teil mit Index teil der Seed-Aufgabe (a = 0, b = 1, …). */
function choiceLoesung(spec, teil = 0) {
  if (spec.id && CHOICE_FEST[spec.id]) return CHOICE_FEST[spec.id][teil] || null;
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
  WURZEL, SPEC_DATEIEN, UMFANG, WELTEN, ROLLE, WERKZEUG, REITER, DS_FEST, GRID, TEIL_OHNE_EINGABE, TEILE_ERGAENZT,
  ZUORDNUNG_ALS_MATCH, SONDERFORM, LUECKE_OHNE_FELD, SCHAUBILD_TEXT, schaubildLoesung, CHOICE_OHNE_KENNUNG, CHOICE_FEST, KUER_LEVEL,
  technischeId, abschnittVon, specAufgaben, specLevels, specZeilen, archivfundTitel, zellen, tippsAus,
  kindsErwartet, kindsSeed, teile, choiceLoesung, choiceText, loesungsTeile, kennungen,
  seed, warmup, normalisiert, texte
};
