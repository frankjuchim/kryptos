#!/usr/bin/env node
'use strict';
/*
 * Erkenner-Daten bauen (Plan M11 Task 242, E211, E212, E224): spielt alle Werkzeug-Modelle (werkzeug_modelle.js) mit den
 * Angaben jedes Prüflings (prueflinge.js: Lab, Archivfund, Boss, Gast, Warm-up, Papier) durch. Gibt ein Zustand eine
 * Lösung aus (istVerrat, E225), werden die Signaturen seiner Eingaben als Kennung eingetragen – als Paar Text + Schlüssel,
 * wenn alle Parameter aus den Angaben stammen, sonst der Text allein. Katalog-Zustände mit Verrat sind nicht abdeckbar
 * (Umbau nötig). Zusätzlich: Ketten aus zwei Stufen (E224 (8)), Handeinträge HAND (Lösung nicht automatisch prüfbar)
 * und die frühere D17-Sperrliste (Quadrat-Schlüsselwörter aus Seeds, Materialien, Videos – Signatur = kürzestes
 * Schlüsselwort des Quadrats). Ausnahme L60 (W0-L2-04, scheibe.alle) trägt nichts ein.
 *
 * Aufruf: node werkzeuge/krypto/erkenner_bauen.js             schreibt public/static/js/krypto/labor/erkenner/<id>.js
 *         node werkzeuge/krypto/erkenner_bauen.js --pruefen   Exit 1, wenn eine Datei veraltet ist
 *         node werkzeuge/krypto/erkenner_bauen.js --bericht   Einträge je Reiter, Prüflinge mit Verrat je Quelle
 */
const fs = require('node:fs');
const path = require('node:path');
const Krypto = require('../../public/static/js/shared/krypto.js');
const P = require('./prueflinge');
const M = require('./werkzeug_modelle');
const E = require('../../public/static/js/krypto/labor/erkenner.js');

const ZIEL = path.join(P.WURZEL, 'public', 'static', 'js', 'krypto', 'labor', 'erkenner');
const KOPF = '/* Kryptos – Erkenner-Daten (erzeugt: npm run labor:erkenner – nicht von Hand ändern). Nur Kennungen. */';

/**
 * Handeinträge (E225): Lösung ist Auswahl, Zeilenwahl oder eine ein-/zweistellige Zahl ohne Beschriftung – der Erkenner
 * schaltet mit diesen Werten trotzdem in den geführten Modus bzw. auf „nicht verfügbar“.
 */
const HAND = Object.freeze([
  { aufgabe: 'W4-L3-07', wr: 'rsa.rechenwerk', eingaben: { zahlen: [6, 7, 11] }, grund: 'Warnung „e nicht teilerfremd“ beantwortet die Auswahl' },
  { aufgabe: 'W4-L2-07', wr: 'rsa.rechenwerk', eingaben: { zahlen: [5, 7, 13] }, grund: 'Warnung „schwacher Schlüssel (d = e)“ beantwortet b)' },
  { aufgabe: 'W6-L1-03', wr: 'scheibe.text', eingaben: { texte: ['EBJN'], schluessel: ['k=5'] }, grund: 'richtige Zeile der Fehlersuche' },
  { aufgabe: 'W6-L1-03', wr: 'scheibe.scheibe', eingaben: { texte: ['EBJN'], schluessel: ['k=5'] }, grund: 'richtige Zeile der Fehlersuche' },
  { aufgabe: 'W6-L1-04', wr: 'vigenere.verschluesseln', eingaben: { texte: ['SZFFKEWD', 'DWEKFFZS'], schluessel: ['OHR'] }, grund: 'richtige Zeile der Fehlersuche' },
  { aufgabe: 'W6-L1-06', wr: 'baukasten', eingaben: { texte: ['SNWDOEINNN'] }, grund: 'richtige Zeile der Fehlersuche' },
  { aufgabe: 'W1-L2-02', wr: 'modulo.inverses', eingaben: { zahlen: [19, 26] }, grund: 'Inverses zweistellig ohne Beschriftung' },
  { aufgabe: 'W1-L2-02', wr: 'modulo.inverses', eingaben: { zahlen: [17, 26] }, grund: 'Inverses zweistellig ohne Beschriftung' },
  { aufgabe: 'W1-L2-02', wr: 'modulo.inverses', eingaben: { zahlen: [25, 26] }, grund: 'Inverses zweistellig ohne Beschriftung' },
  { aufgabe: 'W0-L2-03', wr: 'scheibe.text', eingaben: { texte: ['QUIZ'], schluessel: ['k=9'] }, grund: 'p und c je Buchstabe ein-/zweistellig' },
  { aufgabe: 'W0-L2-03', wr: 'scheibe.scheibe', eingaben: { texte: ['QUIZ'], schluessel: ['k=9'] }, grund: 'p und c je Buchstabe ein-/zweistellig' },
  { aufgabe: 'W0-L2-05', wr: 'scheibe.alle', eingaben: { texte: ['FCA'] }, grund: 'Liste zeigt die Verschiebung v = 12 zum Wort rom' },
  { aufgabe: 'W3-L2-07', wr: 'runden.fehler', eingaben: { texte: ['SEHR GUT'], bits: ['1010001101101101', '0001100100010111'] }, grund: 'Anzahl betroffener Blöcke einstellig' },
  { aufgabe: 'W3-L2-07', wr: 'runden.modi', eingaben: { texte: ['SEHR GUT'], bits: ['1010001101101101', '0001100100010111'] }, grund: 'Anzahl betroffener Blöcke einstellig' },
  { aufgabe: 'W4-L3-05', wr: 'rsa.rechenwerk', eingaben: { zahlen: [53] }, grund: 'Zweierpotenzen des Exponenten (Rechenvorlage)' },
  // Review-Fund 1: KH-Werte sind zweistellig ohne Beschriftung – Salz + Passwort bzw. Passwort allein (nur ganzer Text)
  { aufgabe: 'W5-L1-06', wr: 'hash.schritte', eingaben: { texte: ['MWREGEN'] }, klar: true, grund: 'KH(mw + regen) = 18 beantwortet a)' },
  { aufgabe: 'W5-L1-06', wr: 'hash.schritte', eingaben: { texte: ['REGEN'] }, klar: true, grund: 'KH(regen) = 3 beantwortet b)' },
  { aufgabe: 'W5-L1-06', wr: 'hash.passwort', eingaben: { texte: ['MWREGEN'] }, klar: true, grund: 'KH(mw + regen) = 18 beantwortet a)' }
]);

/** Reiter, deren Ausgabe als Zwischentext in eine zweite Stufe geht (E224 (8): zwei Stufen verkettet) */
const KETTE = new Set(['scheibe.text', 'vigenere.verschluesseln', 'skytale.ring', 'skytale.skytale', 'skytale.gartenzaun']);
const MAX_ZWISCHEN = 40;

const ausnahme = (p, wr) => P.AUSNAHMEN.some((a) => a.aufgabe === p.id && a.wr === wr);
const idVon = (wr) => E.teile(wr);

/** Quadrat-Reiter: Schlüsselwort → kürzestes Schlüsselwort desselben Quadrats (D17: gleiches Quadrat = gleicher Eintrag) */
function quadratSchluessel(w) {
  let q;
  try {
    q = Krypto.quadrat(w).join('');
  } catch {
    return w;
  }
  for (let n = 0; n <= 25; n++) {
    try {
      if (Krypto.quadrat(q.slice(0, n)).join('') === q) return q.slice(0, n);
    } catch {
      /* weiter */
    }
  }
  return w;
}
/** Eingaben eines Reiters normalisieren (Quadrat-Schlüssel) – genauso rechnet quadrat.js vor dem Erkennen */
function normalisiere(wr, e) {
  if (!wr.startsWith('quadrat.')) return e;
  return { ...e, schluessel: (e.schluessel || []).map((s) => (s.includes('=') ? s : quadratSchluessel(s))) };
}

/**
 * Nutzt ein Zustand Angaben der Aufgabe? Nur dann ist er eine naheliegende Bedienung (E200, E224): alle Parameter aus
 * den Angaben oder wenigstens ein eingegebener Text (Schlüssel dazu ausprobiert). Zufallstreffer ganz ohne Angaben
 * (z. B. Ringschritt t = 1 ergibt 0 1 2 …) zählen nicht.
 */
/** Klartexte und je zwei hintereinander (Salz + Passwort): auch zusammengesetzt nur als ganzer Text erkennen */
const klartexteMitPaaren = (k) => [...k, ...k.flatMap((a) => k.filter((b) => b !== a && a.length <= 12 && b.length <= 12).map((b) => a + b))];
const nutztAngaben = (z) => z.ausAngaben || (z.eingaben.texte || []).length > 0;

/** Signaturen, die für einen Verrat-Zustand eingetragen werden (E211, E212); klartexte: Klartexte (klein) der Angaben */
function eintragSignaturen(wr, z, klartexte = []) {
  const e = normalisiere(wr, z.eingaben);
  const klar = new Set(klartexte);
  const nurText = (texte) => texte.flatMap((t) => {
    const n = Krypto.normalisieren(t);
    // Klartext allein: nur als ganzer Text (sonst schlügen deutsche Wörter in eigenen Texten an)
    if (klar.has(n) && n.length >= E.FENSTER) return [`g:${n}`];
    // Viererfenster (v:, Chiffrierscheibe) nur aus Texten ab 5 Zeichen – kurze Wörter bleiben ganze Tokens
    return E.signaturen(wr, { texte: [t] }).filter((s) => s.startsWith('t:') || (s.startsWith('v:') && E.FORM(t).length >= E.FENSTER));
  });
  if (z.ausAngaben) {
    const alle = E.signaturen(wr, e);
    const hatText = (e.texte || []).length > 0;
    const hatSchluessel = (e.schluessel || []).length > 0;
    const hatBits = (e.bits || []).length > 0;
    return alle.filter((s) => {
      if (s.startsWith('z:')) return s === `z:${[...new Set(e.zahlen)].sort((a, b) => a - b).join(',')}`; // ganze Zahlenmenge (eine Zahl: ab 10)
      if (hatText && (hatSchluessel || hatBits)) return (s.startsWith('t:') || (s.startsWith('v:') && (e.texte || []).every((t) => E.FORM(t).length >= E.FENSTER))) && s.includes('|');
      if (hatText) return false; // Text allein: unten (nurText)
      if (hatSchluessel) return s.startsWith('s:');
      // mehrere Bitfolgen (Block + Schlüssel): nur Paare – eine einzelne Folge (z. B. „OK“) allein ist kein Verrat
      if (hatBits) return s.startsWith('b:') && ((e.bits || []).length < 2 || s.includes('|'));
      return true;
    }).concat((e.texte || []).length && !(e.schluessel || []).length && !(e.bits || []).length ? nurText(e.texte) : []);
  }
  // Review-Fund 2: kurze Texte (unter einem Fenster) zusätzlich mit dem ausprobierten Schlüssel – so erkennt der Erkenner
  // sie auch mit Füllzeichen davor/dahinter (Teilstücke zählen nur zusammen mit einem Schlüssel)
  const kurz = (e.texte || []).filter((t) => E.FORM(t).length >= 3 && E.FORM(t).length < E.FENSTER);
  const schl = (e.schluessel || []).map((s) => String(s).toUpperCase().replace(/[^A-Z0-9=,;]/g, '')).filter(Boolean);
  return nurText(e.texte || []).concat(kurz.flatMap((t) => schl.map((s) => `t:${E.FORM(t)}|s:${s}`)));
}

/* ---------- frühere D17-Sperrliste: Quadrat-Schlüsselwörter aus Seeds, Materialien und Videos ---------- */

const jsonDateien = (ordner, re = /\.json$/) =>
  fs.existsSync(ordner) ? fs.readdirSync(ordner, { recursive: true }).filter((f) => re.test(f)).map((f) => path.join(ordner, f)) : [];
/** Quellen wie im Beispieltext-Test (test/labor_regeln.test.js) */
function d17Quellen() {
  const SEED = path.join(P.WURZEL, 'seed');
  return [
    ...jsonDateien(path.join(SEED, 'welten')),
    path.join(SEED, 'gast', 'demo.json'),
    path.join(SEED, 'akten.json'),
    ...jsonDateien(path.join(SEED, 'warmup')),
    ...jsonDateien(path.join(P.WURZEL, 'quellen', 'material')),
    ...jsonDateien(path.join(P.WURZEL, 'materialien', 'Videos'), /video\.json$/)
  ].filter((d) => fs.existsSync(d));
}
const NUR = (s) => (typeof s === 'string' && /^[A-Za-zÄÖÜäöüß]{3,25}$/.test(s.trim()) ? s.trim() : null);
const NACH_WORT = /(?:Schlüsselworts?|Schlüsselwörter|Kennworts?|Quadrats?|Playfair-Quadrats?|Polybios-Quadrats?|Schlüssels?)\s*(?::\s*)?(\*\*|`|„|")?([A-ZÄÖÜ][A-ZÄÖÜa-zäöüß]{2,24})/g;
/** Kandidaten: Felder schluessel/schluesselwort/oben/unten/wort, Wörter nach „Schlüsselwort“, „Quadrat“ …, 5 × 5-Gitter */
function d17Sammle(x, ziel) {
  if (typeof x === 'string') {
    for (const m of x.matchAll(NACH_WORT)) if (m[1] || m[2] === m[2].toUpperCase()) ziel.add(m[2]);
  } else if (Array.isArray(x)) {
    const zeilen = x.map((z) => (Array.isArray(z) ? z.join('') : z));
    if (zeilen.length === 5 && zeilen.every((z) => typeof z === 'string' && /^[A-Z]{5}$/.test(z.replace(/\s+/g, '')))) {
      const q = zeilen.join('').replace(/\s+/g, '');
      if (new Set(q).size === 25) ziel.add({ quadrat: q });
    }
    for (const e of x) d17Sammle(e, ziel);
  } else if (x && typeof x === 'object') {
    for (const [k, e] of Object.entries(x)) {
      if (/^(schluessel|schluesselwort|oben|unten|wort)$/.test(k) && NUR(e)) ziel.add(NUR(e));
      d17Sammle(e, ziel);
    }
  }
}
/** kürzeste Schlüsselwörter (GROSS, ≥ 3 Buchstaben) aller Quadrate außer dem Standardquadrat */
function d17Woerter() {
  const standard = Krypto.quadrat('').join('');
  const roh = new Set();
  for (const d of d17Quellen()) d17Sammle(JSON.parse(fs.readFileSync(d, 'utf8')), roh);
  const aus = new Set();
  for (const r of roh) {
    let q = null;
    try {
      q = typeof r === 'string' ? Krypto.quadrat(r).join('') : r.quadrat;
    } catch {
      q = null;
    }
    if (!q || q === standard) continue;
    const k = quadratSchluessel(q);
    if (k.length >= 3) aus.add(k);
  }
  return [...aus].sort();
}

function bauen({ bericht = false } = {}) {
  const daten = {}; // id → reiter → Set(kennung)
  const herkunft = {}; // wr → Set(quelle)
  const nichtAbdeckbar = [];
  const trage = (wr, sigs, quelle) => {
    const [id, reiter] = idVon(wr);
    const d = (daten[id] = daten[id] || {});
    const s = (d[reiter] = d[reiter] || new Set());
    for (const x of sigs) s.add(E.kennung(x));
    if (quelle) (herkunft[`${id}.${reiter}`] = herkunft[`${id}.${reiter}`] || new Set()).add(quelle);
  };
  const prueflinge = P.prueflinge();
  const mitVerrat = {};
  for (const p of prueflinge) {
    const A = P.angaben(p);
    const zwischen = new Set();
    for (const [wr, m] of Object.entries(M.MODELLE)) {
      for (const z of m.zustaende(A)) {
        if (z.art === 'allgemein') continue;
        // Zwischentexte: nur mit Schlüsseln, die als Schlüssel in den Angaben stehen (kein Text als Schlüssel)
        if (KETTE.has(wr) && z.art === 'angaben' && z.ausAngaben && (z.eingaben.texte || []).length && (z.eingaben.schluessel || []).length && z.eingaben.schluessel.every((k) => A.schluessel.includes(k)) && zwischen.size < MAX_ZWISCHEN && !P.istVerrat(z.ausgaben, p).verrat) {
          for (const a of z.ausgaben.slice(0, 1)) if (a.art === 'text' && !a.nach) { const t = Krypto.normalisieren(a.wert); if (t.length >= 5 && t.length <= 200) zwischen.add(t); }
        }
        if (ausnahme(p, wr) || !nutztAngaben(z)) continue;
        if (!P.istVerrat(z.ausgaben, p).verrat) continue;
        if (z.art === 'katalog') {
          nichtAbdeckbar.push({ aufgabe: p.id, wr, bedienung: z.bedienung });
          continue;
        }
        trage(wr, eintragSignaturen(wr, z, klartexteMitPaaren(A.klartexte)), p.quelle);
        (mitVerrat[p.quelle] = mitVerrat[p.quelle] || new Set()).add(p.id);
      }
    }
    // Review-Fund 2: kurze Angaben mit einem Füllzeichen X davor bzw. dahinter (Skytale füllt selbst mit X auf) – nur
    // Zustände mit Schlüssel bzw. Bits oder bei der Chiffrierscheibe (wie K11b)
    for (const f of [(t) => `X${t}`, (t) => `${t}X`]) {
      const texte = A.texte.filter((t) => /^[A-Z]{2,12}$/.test(t)).map(f);
      if (!texte.length) continue;
      const AF = { ...A, texte };
      for (const [wr, m] of Object.entries(M.MODELLE)) {
        for (const z of m.zustaende(AF)) {
          if (z.art !== 'angaben' || ausnahme(p, wr) || !nutztAngaben(z) || !(z.eingaben.texte || []).length) continue;
          if ((z.eingaben.schluessel || []).some((k) => AF.texte.includes(k))) continue;
          if (!(z.eingaben.schluessel || []).length && !(z.eingaben.bits || []).length && !wr.startsWith('scheibe.')) continue;
          if (!P.istVerrat(z.ausgaben, p).verrat) continue;
          trage(wr, eintragSignaturen(wr, z, klartexteMitPaaren(A.klartexte).flatMap((k) => [k, `X${k}`, `${k}X`])), p.quelle);
        }
      }
    }
    // zweite Stufe: Zwischentexte mit den Schlüsseln der Angaben (E224 (8))
    if (zwischen.size && A.schluessel.length) {
      const A2 = { texte: [...zwischen], schluessel: A.schluessel, zahlen: [], bits: [], bitfolgen: [] };
      for (const wr of KETTE) {
        for (const z of M.MODELLE[wr].zustaende(A2)) {
          if (z.art !== 'angaben' || !z.ausAngaben || ausnahme(p, wr)) continue;
          if (!P.istVerrat(z.ausgaben, p).verrat) continue;
          trage(wr, eintragSignaturen(wr, z, A.klartexte), p.quelle);
          (mitVerrat[p.quelle] = mitVerrat[p.quelle] || new Set()).add(p.id);
        }
      }
    }
  }
  for (const x of HAND) trage(x.wr, eintragSignaturen(x.wr, { eingaben: { texte: [], schluessel: [], zahlen: [], bits: [], bitpaare: [], ...x.eingaben }, ausAngaben: true }, x.klar ? x.eingaben.texte : []), 'hand');
  // D17: Quadrat-Schlüsselwörter (Polybios und Playfair bauen diese Quadrate nur geführt auf)
  for (const w of d17Woerter()) for (const wr of ['quadrat.polybios', 'quadrat.playfair']) trage(wr, [`s:${quadratSchluessel(w)}`], 'd17');
  // jede Werkzeug-id bekommt eine Datei (auch leer) – das Labor lädt sie ohne 404 nach (labor/registry.js lade)
  for (const w of require('../../src/krypto/werkzeuge').WERKZEUGE) daten[w.id] = daten[w.id] || {};
  const dateien = {};
  for (const id of Object.keys(daten).sort()) {
    const tab = {};
    for (const r of Object.keys(daten[id]).sort()) tab[r] = [...daten[id][r]].sort();
    const zeilen = Object.entries(tab).map(([r, l]) => `  ${JSON.stringify(r)}: [\n${l.map((x) => `'${x}'`).join(',').replace(/(.{1,110})(,|$)/g, '    $1$2\n').trimEnd()}\n  ]`);
    dateien[`${id}.js`] = `${KOPF}\n'use strict';\nKRErkenner.daten('${id}', {${zeilen.length ? `\n${zeilen.join(',\n')}\n` : ''}});\n`;
  }
  const info = {
    eintraege: Object.fromEntries(Object.entries(daten).flatMap(([id, t]) => Object.entries(t).map(([r, s]) => [`${id}.${r}`, s.size]))),
    verrat: Object.fromEntries(Object.entries(mitVerrat).map(([q, s]) => [q, s.size])),
    nichtAbdeckbar,
    herkunft: Object.fromEntries(Object.entries(herkunft).map(([wr, s]) => [wr, [...s].sort()]))
  };
  if (bericht) return { dateien, info };
  return { dateien, info };
}

function main() {
  const pruefen = process.argv.includes('--pruefen');
  const bericht = process.argv.includes('--bericht');
  const { dateien, info } = bauen({ bericht });
  if (pruefen) {
    const vorhanden = fs.existsSync(ZIEL) ? fs.readdirSync(ZIEL).filter((f) => f.endsWith('.js')) : [];
    const fehler = [];
    for (const [d, inhalt] of Object.entries(dateien)) {
      const p = path.join(ZIEL, d);
      if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== inhalt) fehler.push(`${d} veraltet`);
    }
    for (const d of vorhanden) if (!dateien[d]) fehler.push(`${d} überzählig`);
    if (fehler.length) {
      console.error(`Erkenner-Daten veraltet – npm run labor:erkenner ausführen:\n  ${fehler.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`Erkenner-Daten aktuell (${Object.keys(dateien).length} Dateien).`);
    return;
  }
  fs.mkdirSync(ZIEL, { recursive: true });
  for (const d of fs.readdirSync(ZIEL).filter((f) => f.endsWith('.js'))) if (!dateien[d]) fs.unlinkSync(path.join(ZIEL, d));
  for (const [d, inhalt] of Object.entries(dateien)) fs.writeFileSync(path.join(ZIEL, d), inhalt);
  if (bericht) {
    console.log('Einträge je Reiter:');
    for (const [wr, n] of Object.entries(info.eintraege)) console.log(`  ${wr}: ${n}${info.herkunft[wr] ? ` (${info.herkunft[wr].join(', ')})` : ''}`);
    console.log(`Prüflinge mit Verrat je Quelle: ${Object.entries(info.verrat).map(([q, n]) => `${q} ${n}`).join(', ')}`);
    console.log(`Nicht abdeckbar (Katalog, Umbau nötig): ${[...new Set(info.nichtAbdeckbar.map((x) => `${x.aufgabe} ${x.wr}`))].join(', ') || '–'}`);
  }
  console.log(`${Object.keys(dateien).length} Erkenner-Dateien geschrieben.`);
}

if (require.main === module) main();
module.exports = { bauen, HAND, eintragSignaturen, quadratSchluessel, normalisiere, nutztAngaben, ZIEL };
