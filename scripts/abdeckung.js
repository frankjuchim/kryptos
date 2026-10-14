#!/usr/bin/env node
'use strict';
// Abdeckungsprüfung der Inhalte (Plan M8 Task 200, E141; TECHNIK §16.1): Quelle sind die Abdeckungsmatrizen §11 der
// sieben Welt-Specs, die Seeds (seed/welten, seed/warmup), seed/akten.json, WELT_PLAN (src/krypto/fach.js) und die
// Generator-Registry. Regeln je Welt:
//   1  kc        jede KC-Zeile der Matrix hat ≥ 1 Level-Aufgabe, eine Akte und eine Boss-Aufgabe (außer Zelle „–“)
//   2  fremd     ≥ 1 Lab-Aufgabe der Kategorie fremde-chiffre; Boss-Pool ≥ 3 (W4/W5: 4, wie Spec §5)
//   3  fallen    jede P-Nummer der Zeile „Fallen-Abdeckung“ unter §11 kommt in Lab oder Boss vor
//   4  gesamt    (über alle Welten) jede Lab-Kategorie und jede Kryptos-Interaktion kommt vor
//   5  plan      Level und Aufgaben je Niveau wie WELT_PLAN; gA-Pool ≥ 8 und Mix je Stufe ziehbar
//   6  warmup    12 Warm-up-Karten; ≥ 1 Generator der Welt
// Ausgabe: Tabelle „Welt · Regel · Lücke“, Exit 1 bei Lücke. Aufruf:
//   node scripts/abdeckung.js [--welt <N>] [--json] [--seed <Ordner>] [--specs <Ordner>]
// Die Spec-Parser hier sind bewusst klein und eigenständig (Produkt-Skript, nicht test/hilfen_spec.js); --selbsttest
// prüft sie an festen Beispielen.

const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const arg = (name, std) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : std;
};
const SEED = path.resolve(arg('--seed', path.join(WURZEL, 'seed')));
const SPECS = path.resolve(arg('--specs', path.join(WURZEL, 'quellen', 'specs')));
const NUR_WELT = arg('--welt', null);
const JSON_AUSGABE = process.argv.includes('--json');

const SPEC_DATEIEN = {
  0: 'SPEC_Kryptos_W0_Antike.md', 1: 'SPEC_Kryptos_W1_Bagdad.md', 2: 'SPEC_Kryptos_W2_Renaissance.md',
  3: 'SPEC_Kryptos_W3_Maschinen.md', 4: 'SPEC_Kryptos_W4_Schluesselproblem.md', 5: 'SPEC_Kryptos_W5_Netz.md',
  6: 'SPEC_Kryptos_W6_Zeitmaschine.md'
};
/** Boss-Pool: Mindestzahl fremder Chiffren (Design §7.6: 3; SPEC W4 §5 und W5 §5: vier fremde Verfahren) */
const FREMD_BOSS = { 4: 4, 5: 4 };
/** Kür-Level je Welt (technische ids, Plan M8 E120) */
const KUER_LEVEL = { 2: 5, 3: 5, 4: 3 };
/** Interaktionen des übernommenen Kerns (src/content/format.js); alles andere hat src/krypto registriert */
const KERN_INTERAKTIONEN = ['gaps', 'choice', 'order', 'lines', 'match', 'tree', 'array', 'grid', 'adtsim'];

/**
 * Bewusste Lücken der Specs (mit Zitat). Schlüssel `welt:regel:Meldung`, Wert = Begründung aus der Spec.
 * Zellen „–“ der Matrix gelten ohnehin nicht als Lücke.
 */
const AUSNAHMEN = {
  '5:fremd:keine Lab-Aufgabe der Kategorie fremde-chiffre':
    'SPEC W5 §2: alle Lab-Aufgaben tragen die Kategorien hash, signatur, zertifikat, protokoll, gesellschaft; fremde ' +
    'Prüfverfahren nur in Akte W5·2 A6 („Siegel-Code“) und im Boss (W5-B-07, -08, -12, -15: „Produkt-Hash“, ' +
    '„Tausch-Siegel“, „Kurz-Signatur“); §11 „beurteilen die Sicherheit gegebener Verfahren (Toy-Hash, fremde ' +
    'Prüfverfahren)“ ordnet die Lab-Aufgaben W5-L1-07, -08, W5-L2-07 (Kategorien hash/signatur) zu.'
};

/* ---------- kleine Parser ---------- */

/** Spec-id → technische id (Plan M5 E38, M8 E120): W2-L21-03 → W2-L1-03, W0-AF/W3-L1-00 → Archivfund, Kür → Level nach den regulären */
function technischeId(id) {
  let m = /^W(\d)-(AF|A|L\d-00)$/.exec(id);
  if (m) return `W${m[1]}-A-01`;
  m = /^W(\d)-L(\d)(\d)-(\d{2})$/.exec(id);
  if (m) return `W${m[1]}-L${m[3]}-${m[4]}`;
  m = /^W(\d)-K\d-(\d{2})$/.exec(id);
  if (m) return `W${m[1]}-L${KUER_LEVEL[m[1]]}-${m[2]}`;
  return id;
}

/** Aufgaben-ids aus einer Matrixzelle: „W0-L1-03 – 08“, „W2-L21-01 … 08“, „W3-L1-03, -06“, „W1-B-11 – 14“, „B01, B02“, „B-03“ */
function idsAusZelle(welt, zelle) {
  const out = [];
  const text = String(zelle).replace(/\*\*/g, '');
  let praefix = null; // z. B. „W0-L1“ für Folgenummern „, 05“ bzw. „-05“
  const re = /(W\d-(?:L\d{1,2}|K\d|B))-(\d{2})|\bB-?(\d{2})\b|(W\d-AF)\b|[–…]\s*-?(\d{2})\b|,\s*-?(\d{2})\b/g;
  let m;
  let letzte = null;
  while ((m = re.exec(text))) {
    if (m[1]) {
      praefix = m[1];
      letzte = Number(m[2]);
      out.push(`${praefix}-${m[2]}`);
    } else if (m[3]) {
      praefix = `W${welt}-B`;
      letzte = Number(m[3]);
      out.push(`${praefix}-${m[3]}`);
    } else if (m[4]) out.push(m[4]);
    else if (m[5] && praefix && letzte !== null) {
      // Bereich bis
      for (let n = letzte + 1; n <= Number(m[5]); n++) out.push(`${praefix}-${String(n).padStart(2, '0')}`);
      letzte = Number(m[5]);
    } else if (m[6] && praefix) {
      letzte = Number(m[6]);
      out.push(`${praefix}-${m[6]}`);
    }
  }
  return [...new Set(out.map(technischeId))];
}

/** Akten-Nummern aus einer Matrixzelle: „W0·1 A2“, „W3·K2“, „Kür-Akte K2“ */
function aktenAusZelle(welt, zelle) {
  const out = new Set();
  for (const m of String(zelle).matchAll(/W(\d)·(K?\d)/g)) if (Number(m[1]) === welt) out.add(m[2]);
  for (const m of String(zelle).matchAll(/Kür-Akte (K\d)/g)) out.add(m[1]);
  return [...out];
}

const leer = (zelle) => /^\s*[–-]/.test(String(zelle));

/** §11 einer Spec: { zeilen: [{ kc, level, akte, boss }], fallen: [P…] } */
function matrix(text) {
  const zeilen = text.split('\n');
  const start = zeilen.findIndex((z) => /^## §11\b/.test(z));
  if (start < 0) throw new Error('§11 fehlt');
  const ende = zeilen.findIndex((z, i) => i > start && /^## /.test(z));
  const abschnitt = zeilen.slice(start, ende < 0 ? undefined : ende);
  const tab = abschnitt.filter((z) => /^\|/.test(z) && !/^\|\s*-/.test(z));
  const kopf = tab[0].split('|').slice(1, -1).map((s) => s.trim());
  const spalte = (re) => kopf.findIndex((k) => re.test(k));
  const [iLevel, iAkte, iBoss] = [spalte(/Level/), spalte(/Akte/), spalte(/Boss(?! \()|Boss online|Boss-Aufgaben/)];
  const daten = tab.slice(1).map((z) => z.split('|').slice(1, -1).map((s) => s.trim()));
  const fallenText = abschnitt.join(' ').match(/Fallen-Abdeckung:([^]*?)(?:---|$)/);
  const fallen = fallenText ? [...new Set([...fallenText[1].matchAll(/\b(P\d{1,2}) \(/g)].map((m) => m[1]))] : [];
  return { zeilen: daten.map((d) => ({ kc: d[0].replace(/\*\*/g, ''), level: d[iLevel], akte: d[iAkte], boss: d[iBoss] })), fallen };
}

/* ---------- Prüfung ---------- */

function lies(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function pruefe() {
  require(path.join(WURZEL, 'src', 'krypto')).registriere();
  const { WELT_PLAN, LAB_KATEGORIEN } = require(path.join(WURZEL, 'src', 'krypto', 'fach'));
  const G = require(path.join(WURZEL, 'src', 'content', 'generators'));
  const F = require(path.join(WURZEL, 'src', 'content', 'format'));
  const akten = lies(path.join(SEED, 'akten.json'));
  const luecken = [];
  const luecke = (welt, regel, text) => {
    if (AUSNAHMEN[`${welt}:${regel}:${text}`]) return;
    luecken.push({ welt, regel, luecke: text });
  };
  const kategorienGesehen = new Set();
  const artenGesehen = new Set();
  const welten = Object.keys(SPEC_DATEIEN).map(Number).filter((w) => NUR_WELT === null || w === Number(NUR_WELT));
  for (const welt of welten) {
    const datei = path.join(SEED, 'welten', `welt${welt}.json`);
    if (!fs.existsSync(datei)) {
      luecke(welt, 'plan', `seed/welten/welt${welt}.json fehlt`);
      continue;
    }
    const w = lies(datei);
    const ids = new Set(w.aufgaben.map((a) => a.id));
    const aufgabe = (id) => w.aufgaben.find((a) => a.id === id);
    const pool = (w.boss && w.boss.pool) || [];
    const lab = (w.levels || []).flatMap((l) => l.aufgaben.map(aufgabe));
    const bossA = pool.map(aufgabe).filter(Boolean);
    for (const a of [...lab, ...bossA]) {
      kategorienGesehen.add(a.kategorie);
      for (const ia of [].concat(a.interaktion || [])) if (ia && ia.kind) artenGesehen.add(ia.kind);
    }
    const aw = (akten.welten || []).find((x) => x.welt === welt);
    const aktenNr = new Set(aw ? aw.akten.map((a) => a.nr) : []);
    // 1 KC-Matrix
    const m = matrix(fs.readFileSync(path.join(SPECS, SPEC_DATEIEN[welt]), 'utf8'));
    for (const z of m.zeilen) {
      const kc = z.kc.length > 60 ? `${z.kc.slice(0, 57)}…` : z.kc;
      if (!leer(z.level)) {
        const l = idsAusZelle(welt, z.level).filter((id) => !/-B-/.test(id));
        if (!l.some((id) => ids.has(id))) luecke(welt, 'kc', `„${kc}“: keine Level-Aufgabe im Seed (${z.level})`);
      }
      if (!leer(z.akte)) {
        const nr = aktenAusZelle(welt, z.akte);
        const allgemein = /alle|Abi-Check/.test(z.akte) && !nr.length;
        if (!allgemein && !nr.some((n) => aktenNr.has(n))) luecke(welt, 'kc', `„${kc}“: keine Akte in akten.json (${z.akte})`);
      }
      if (!leer(z.boss)) {
        const b = idsAusZelle(welt, z.boss).filter((id) => /-B-/.test(id));
        const alle = /^alle\b/.test(z.boss) && pool.length > 0;
        if (!alle && !b.some((id) => pool.includes(id))) luecke(welt, 'kc', `„${kc}“: keine Boss-Aufgabe im Pool (${z.boss})`);
      }
    }
    // 2 fremde Chiffren
    if (!lab.some((a) => a.kategorie === 'fremde-chiffre')) luecke(welt, 'fremd', 'keine Lab-Aufgabe der Kategorie fremde-chiffre');
    const fremdBoss = bossA.filter((a) => a.kategorie === 'fremde-chiffre').length;
    if (fremdBoss < (FREMD_BOSS[welt] || 3)) luecke(welt, 'fremd', `Boss-Pool: ${fremdBoss} fremde Chiffren (mindestens ${FREMD_BOSS[welt] || 3})`);
    // 3 Fallen
    const fallen = new Set([...lab, ...bossA].flatMap((a) => a.fallen || []));
    for (const p of m.fallen) if (!fallen.has(p)) luecke(welt, 'fallen', `${p} (Fallen-Abdeckung §11) kommt nicht vor`);
    // 5 Plan
    const plan = WELT_PLAN.find((p) => p.nr === welt);
    if (plan) {
      if (plan.levels.length !== (w.levels || []).length) luecke(welt, 'plan', `${(w.levels || []).length} Level statt ${plan.levels.length}`);
      for (const p of plan.levels) {
        const l = (w.levels || []).find((x) => x.nr === p.id);
        if (!l) {
          luecke(welt, 'plan', `Level ${p.id} fehlt`);
          continue;
        }
        const zaehl = {};
        for (const id of l.aufgaben) {
          const n = (aufgabe(id) && aufgabe(id).niveau) || l.niveau;
          zaehl[n] = (zaehl[n] || 0) + 1;
        }
        if (JSON.stringify(Object.entries(zaehl).sort()) !== JSON.stringify(Object.entries(p.aufgaben).sort())) {
          luecke(welt, 'plan', `Level ${p.id}: Aufgaben je Niveau ${JSON.stringify(zaehl)} statt ${JSON.stringify(p.aufgaben)}`);
        }
      }
    }
    if (!w.boss) luecke(welt, 'plan', 'Boss fehlt');
    else {
      const gA = bossA.filter((a) => (a.niveau || 'kern') === 'kern');
      if (gA.length < 8) luecke(welt, 'plan', `gA-Pool hat ${gA.length} Aufgaben (mindestens 8)`);
      for (const [st, n] of Object.entries(w.boss.mix || {})) {
        if (gA.filter((a) => String(a.stufe) === st).length < n) luecke(welt, 'plan', `gA-Pool: Stufe ${st} nicht ${n}-mal ziehbar`);
      }
    }
    // 6 Warm-up, Generatoren
    const wu = path.join(SEED, 'warmup', `w${welt}.json`);
    const karten = fs.existsSync(wu) ? (lies(wu).karten || []).length : 0;
    if (karten !== 12) luecke(welt, 'warmup', `${karten} Warm-up-Karten statt 12`);
    if (!G.generatorenFuerWelt(welt).length) luecke(welt, 'warmup', 'kein Trainingsplatz-Generator');
  }
  // 4 gesamt (nur ohne --welt)
  if (NUR_WELT === null) {
    for (const k of LAB_KATEGORIEN) if (!kategorienGesehen.has(k)) luecke('alle', 'gesamt', `Kategorie ${k} kommt in keiner Welt vor`);
    // Kryptos-Interaktionen = alle über registriereInteraktion hinzugekommenen (Kern-Arten aus AlgoQuest ausgenommen)
    const kryptos = F.INTERAKTIONEN.filter((a) => !KERN_INTERAKTIONEN.includes(a));
    if (!kryptos.length) luecke('alle', 'gesamt', 'keine Kryptos-Interaktion registriert');
    for (const k of kryptos) if (!artenGesehen.has(k)) luecke('alle', 'gesamt', `Interaktion ${k} kommt in keiner Welt vor`);
  }
  return luecken;
}

/* ---------- Selbsttest der Parser ---------- */

function selbsttest() {
  const gleich = (a, b, was) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Selbsttest ${was}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
  };
  gleich(idsAusZelle(0, 'W0-L1-03 – 05, W0-AF'), ['W0-L1-03', 'W0-L1-04', 'W0-L1-05', 'W0-A-01'], 'Bereich');
  gleich(idsAusZelle(2, 'W2-L22-01, 06; W2-K1-01 … 02'), ['W2-L2-01', 'W2-L2-06', 'W2-L5-01', 'W2-L5-02'], 'W2-ids');
  gleich(idsAusZelle(3, 'W3-L1-03, -06; B-03, B-06'), ['W3-L1-03', 'W3-L1-06', 'W3-B-03', 'W3-B-06'], 'Bindestrich');
  gleich(idsAusZelle(2, 'B01, B02, B15'), ['W2-B-01', 'W2-B-02', 'W2-B-15'], 'B ohne Bindestrich');
  gleich(idsAusZelle(1, 'W1-B-11 – 14'), ['W1-B-11', 'W1-B-12', 'W1-B-13', 'W1-B-14'], 'Boss-Bereich');
  gleich(aktenAusZelle(3, 'W3·1 A4; W3·4 A3; Kür-Akte K2'), ['1', '4', 'K2'], 'Akten');
  gleich(leer('– (kein Code im Boss)'), true, 'leer');
}

/* ---------- Ausgabe ---------- */

if (require.main === module) {
  selbsttest();
  if (process.argv.includes('--selbsttest')) {
    console.log('Selbsttest ok');
    process.exit(0);
  }
  const luecken = pruefe();
  if (JSON_AUSGABE) console.log(JSON.stringify({ luecken }, null, 1));
  else {
    for (const l of luecken) console.log(`✘ Welt ${l.welt} · ${l.regel} · ${l.luecke}`);
    console.log(`Abdeckung: ${luecken.length} Lücke(n).`);
  }
  process.exit(luecken.length ? 1 : 0);
}

module.exports = { technischeId, idsAusZelle, aktenAusZelle, matrix, selbsttest };
