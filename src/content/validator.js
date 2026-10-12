'use strict';
// Inhalts-Validator für seed/welten/*.json (SPEC §3–§5, §9).
// Nutzbar als Modul (validiereWelt, validiereDateien) und über scripts/validate.js.

const fs = require('node:fs');
const path = require('node:path');
const Baum = require('../../public/static/js/shared/baum');
const F = require('./format');
const C = require('./checker');
const { LAB_KATEGORIEN, FALLEN_IDS, STUFEN_PUNKTE, NIVEAU_IDS } = require('../domain');

const AUFGABE_ID = /^W(\d)-(L\d{1,2}[a-z]?|B)-\d{2,3}$/;
const LEVEL_ID = /^W(\d)-L\d{1,2}[a-z]?$/;
const FARBE = /^#[0-9A-Fa-f]{6}$/;
const BEDINGUNGSSPALTE = /(<=|>=|==|!=|(?<![-<])<(?![-=])|(?<![-=])>(?!=)|≤|≥|≠|Bedingung|w\/f|wahr\/falsch)/;
const MARKIER_FARBEN = ['gold', 'gruen', 'grün', 'rot', 'blau', 'grau', 'orange', 'lila'];
const SG_SCHLUESSEL = ['anw', 'wenn', 'solange', 'zaehle', 'fuer', 'wiederhole', 'gib', 'aufruf', 'kommentar'];

function istObjekt(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}
function istText(x, leerOk = false) {
  return typeof x === 'string' && (leerOk || x.trim() !== '');
}
function istSkalar(x) {
  return typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean';
}

/**
 * Eine Welt-Datei prüfen.
 * @param {object} data geparstes JSON
 * @param {{datei?: string}} [opt]
 * @returns {{fehler: object[], warnungen: object[], stats: object}}
 */
function validiereWelt(data, opt = {}) {
  const datei = opt.datei || 'welt.json';
  const fehler = [];
  const warnungen = [];
  const f = (ebene, ort, meldung, aufgabe) => fehler.push({ datei, ebene, ort, meldung, aufgabe: aufgabe || null });
  const w = (ebene, ort, meldung, aufgabe) => warnungen.push({ datei, ebene, ort, meldung, aufgabe: aufgabe || null });
  const stats = { levels: 0, aufgaben: 0, bossPool: 0, interaktionen: {}, bloecke: {}, stufen: { 1: 0, 2: 0, 3: 0 }, jeLevel: [] };

  if (!istObjekt(data)) {
    f('datei', '', 'Die Datei muss ein JSON-Objekt { "version": 2, "welt": …, "levels": […], "aufgaben": […] } enthalten.');
    return { fehler, warnungen, stats };
  }
  if (data.version !== 2) f('datei', 'version', `version muss 2 sein (gefunden: ${JSON.stringify(data.version)}).`);
  const welt = data.welt;
  if (!Number.isInteger(welt) || welt < 0 || welt > 9) f('datei', 'welt', 'welt muss eine ganze Zahl 0–9 sein.');
  if (!istText(data.titel)) f('datei', 'titel', 'titel (Name der Welt) fehlt.');
  if (data.farbe !== undefined && !FARBE.test(String(data.farbe))) f('datei', 'farbe', 'farbe muss im Format #RRGGBB angegeben werden.');
  if (data.farbe === undefined) w('datei', 'farbe', 'farbe fehlt – es wird die Standardfarbe der Welt verwendet.');
  if (!Array.isArray(data.levels)) f('datei', 'levels', 'levels muss eine Liste sein.');
  if (!Array.isArray(data.aufgaben)) f('datei', 'aufgaben', 'aufgaben muss eine Liste sein.');
  if (fehler.length) return { fehler, warnungen, stats };

  /* ---------- Aufgaben ---------- */
  const aufgaben = new Map();
  data.aufgaben.forEach((a, i) => {
    const ort0 = `aufgaben[${i}]`;
    if (!istObjekt(a)) return f('aufgabe', ort0, 'Aufgabe ist kein Objekt.');
    const id = typeof a.id === 'string' ? a.id : null;
    if (!id) return f('aufgabe', ort0, 'id fehlt.');
    if (aufgaben.has(id)) return f('aufgabe', id, `id „${id}“ kommt doppelt vor.`, id);
    aufgaben.set(id, a);
    validiereAufgabe(a, id, welt, f, w, stats);
  });

  /* ---------- Levels ---------- */
  const verwendet = new Map(); // aufgabeId → Ort
  const levelIds = new Set();
  data.levels.forEach((l, i) => {
    const ort = `levels[${i}]`;
    if (!istObjekt(l)) return f('level', ort, 'Level ist kein Objekt.');
    const lid = typeof l.id === 'string' ? l.id : '';
    const o = lid || ort;
    if (!LEVEL_ID.test(lid)) f('level', o, `Level-id „${lid}“ hat nicht das Format W<n>-L<k> (z. B. W4-L1).`);
    else if (Number(LEVEL_ID.exec(lid)[1]) !== welt) f('level', o, `Level-id „${lid}“ passt nicht zu welt ${welt}.`);
    if (levelIds.has(lid)) f('level', o, `Level-id „${lid}“ kommt doppelt vor.`);
    levelIds.add(lid);
    if (!istText(l.titel)) f('level', o, 'titel fehlt.');
    if (l.nr !== undefined && !istText(String(l.nr))) f('level', o, 'nr muss Text sein (z. B. "4.1").');
    if (l.ds !== undefined && (!Array.isArray(l.ds) || !l.ds.every(Number.isInteger))) f('level', o, 'ds muss eine Liste ganzer Zahlen sein.');
    for (const k of ['ab', 'ide']) if (l[k] !== undefined && typeof l[k] !== 'string') f('level', o, `${k} muss Text sein.`);
    if (l.niveau !== undefined && !NIVEAU_IDS.includes(l.niveau)) f('level', o, `niveau muss ${NIVEAU_IDS.join(' | ')} sein.`);
    if (l.intro !== undefined) validiereBloecke(l.intro, `${o} › intro`, f, w, null, stats);
    if (!Array.isArray(l.aufgaben) || !l.aufgaben.length) {
      f('level', o, 'aufgaben (Liste der Aufgaben-ids) fehlt oder ist leer.');
      return;
    }
    const st = { level: lid, titel: l.titel, aufgaben: 0, punkte: 0, stufen: { 1: 0, 2: 0, 3: 0 }, interaktionen: new Set() };
    for (const aid of l.aufgaben) {
      if (!aufgaben.has(aid)) {
        f('level', o, `verweist auf unbekannte Aufgabe „${aid}“.`);
        continue;
      }
      if (/-B-/.test(aid)) f('level', o, `Boss-Aufgabe „${aid}“ darf nicht in einem Level stehen.`);
      if (verwendet.has(aid)) f('level', o, `Aufgabe „${aid}“ wird mehrfach verwendet (auch in ${verwendet.get(aid)}).`);
      verwendet.set(aid, lid);
      if (lid && !aid.startsWith(lid + '-')) w('level', o, `Aufgabe „${aid}“ gehört dem Namen nach nicht zu Level ${lid}.`);
      const a = aufgaben.get(aid);
      st.aufgaben++;
      st.punkte += aufgabePunkte(a);
      if ([1, 2, 3].includes(a.stufe)) st.stufen[a.stufe]++;
      for (const t of F.teile(a)) st.interaktionen.add(F.artVon(t.interaktion));
    }
    st.interaktionen = [...st.interaktionen];
    stats.jeLevel.push(st);
    stats.levels++;
  });

  /* ---------- Boss ---------- */
  if (data.boss !== undefined && data.boss !== null) {
    const b = data.boss;
    if (b && b.niveau !== undefined && !NIVEAU_IDS.includes(b.niveau)) f('boss', 'boss', `niveau muss ${NIVEAU_IDS.join(' | ')} sein.`);
    const o = 'boss';
    if (!istObjekt(b)) f('boss', o, 'boss muss ein Objekt sein.');
    else {
      if (!istText(b.id)) f('boss', o, 'id fehlt (z. B. "W4-BOSS").');
      if (!istText(b.titel)) f('boss', o, 'titel fehlt.');
      if (!Number.isInteger(b.dauerMin) || b.dauerMin < 1 || b.dauerMin > 240) f('boss', o, 'dauerMin muss eine ganze Zahl 1–240 sein.');
      if (!Number.isInteger(b.anzahl) || b.anzahl < 1) f('boss', o, 'anzahl muss eine ganze Zahl ≥ 1 sein.');
      if (!Array.isArray(b.pool) || !b.pool.length) f('boss', o, 'pool (Liste der Boss-Aufgaben) fehlt oder ist leer.');
      const proStufe = { 1: 0, 2: 0, 3: 0 };
      for (const aid of Array.isArray(b.pool) ? b.pool : []) {
        if (!aufgaben.has(aid)) {
          f('boss', o, `pool verweist auf unbekannte Aufgabe „${aid}“.`);
          continue;
        }
        if (verwendet.has(aid)) f('boss', o, `Aufgabe „${aid}“ steht im Boss-Pool und in ${verwendet.get(aid)} – Boss-Aufgaben müssen eigene Aufgaben sein.`);
        verwendet.set(aid, 'boss');
        if (!/-B-/.test(aid)) w('boss', o, `Boss-Aufgabe „${aid}“ sollte die id-Form W<n>-B-<nn> haben.`);
        const st = aufgaben.get(aid).stufe;
        if (proStufe[st] !== undefined) proStufe[st]++;
        stats.bossPool++;
      }
      if (b.mix !== undefined) {
        if (!istObjekt(b.mix)) f('boss', o, 'mix muss ein Objekt { "1": n, "2": n, "3": n } sein.');
        else {
          let summe = 0;
          for (const [s, n] of Object.entries(b.mix)) {
            if (!['1', '2', '3'].includes(s) || !Number.isInteger(n) || n < 0) {
              f('boss', o, `mix: ungültiger Eintrag „${s}: ${n}“.`);
              continue;
            }
            summe += n;
            if (proStufe[s] < n) f('boss', o, `Boss-Mix nicht erfüllbar: ${n} Aufgaben der Stufe ${s} verlangt, im Pool sind nur ${proStufe[s]}.`);
          }
          if (Number.isInteger(b.anzahl) && summe !== b.anzahl) f('boss', o, `Summe von mix (${summe}) muss anzahl (${b.anzahl}) ergeben.`);
        }
      } else if (Number.isInteger(b.anzahl) && Array.isArray(b.pool) && b.pool.length < b.anzahl) {
        f('boss', o, `pool enthält nur ${b.pool.length} Aufgaben, anzahl ist ${b.anzahl}.`);
      }
    }
  }

  for (const id of aufgaben.keys()) if (!verwendet.has(id)) w('aufgabe', id, `Aufgabe „${id}“ wird in keinem Level und keinem Boss-Pool verwendet.`, id);
  stats.aufgaben = aufgaben.size;
  return { fehler, warnungen, stats };
}

function aufgabePunkte(a) {
  return Number.isInteger(a.punkte) ? a.punkte : STUFEN_PUNKTE[a.stufe] || 10;
}

function validiereAufgabe(a, id, welt, f, w, stats) {
  const fa = (ort, m) => f('aufgabe', `${id}${ort ? ' › ' + ort : ''}`, m, id);
  const wa = (ort, m) => w('aufgabe', `${id}${ort ? ' › ' + ort : ''}`, m, id);
  const m = AUFGABE_ID.exec(id);
  if (!m) fa('id', `id „${id}“ hat nicht das Format W<n>-L<k>-<nn> bzw. W<n>-B-<nn>.`);
  else if (Number(m[1]) !== welt) fa('id', `id „${id}“ passt nicht zu welt ${welt}.`);
  if (!istText(a.titel)) fa('titel', 'titel fehlt.');
  if (![1, 2, 3].includes(a.stufe)) fa('stufe', 'stufe muss 1, 2 oder 3 sein.');
  else stats.stufen[a.stufe]++;
  if (a.punkte !== undefined) {
    if (!Number.isInteger(a.punkte) || a.punkte < 1 || a.punkte > 200) fa('punkte', 'punkte muss eine ganze Zahl 1–200 sein.');
    else if (STUFEN_PUNKTE[a.stufe] && a.punkte !== STUFEN_PUNKTE[a.stufe]) wa('punkte', `punkte ${a.punkte} weicht vom Standard der Stufe ${a.stufe} (${STUFEN_PUNKTE[a.stufe]}) ab.`);
  }
  if (!LAB_KATEGORIEN.includes(a.kategorie)) fa('kategorie', `unbekannte kategorie „${a.kategorie}“ (erlaubt: ${LAB_KATEGORIEN.join(' | ')}).`);
  if (a.niveau !== undefined && !NIVEAU_IDS.includes(a.niveau)) fa('niveau', `niveau muss ${NIVEAU_IDS.join(' | ')} sein.`);
  if (a.fallen !== undefined) {
    if (!Array.isArray(a.fallen)) fa('fallen', 'fallen muss eine Liste sein (z. B. ["P1"]).');
    else for (const p of a.fallen) if (!FALLEN_IDS.includes(p)) fa('fallen', `unbekannte Falle „${p}“ (erlaubt: P1–P10).`);
  }
  if (!Array.isArray(a.inhalt) || !a.inhalt.length) fa('inhalt', 'inhalt (Liste von Blöcken) fehlt oder ist leer.');
  else validiereBloecke(a.inhalt, `${id} › inhalt`, f, w, id, stats);
  if (a.tipps !== undefined && (!Array.isArray(a.tipps) || !a.tipps.every((t) => istText(t)))) fa('tipps', 'tipps muss eine Liste von Texten sein.');
  if (a.erklaerung === undefined || (Array.isArray(a.erklaerung) && !a.erklaerung.length)) wa('erklaerung', 'erklaerung fehlt (jede Aufgabe sollte erklären, warum).');
  else validiereBloecke(a.erklaerung, `${id} › erklaerung`, f, w, id, stats, { lueckenVerboten: true });

  // Interaktionen
  const ia = a.interaktion;
  if (Array.isArray(ia)) {
    if (!ia.length) return fa('interaktion', 'interaktion darf keine leere Liste sein.');
    if (!Array.isArray(a.loesung) || a.loesung.length !== ia.length) {
      return fa('loesung', 'Bei mehrteiligen Aufgaben (interaktion = Liste) muss loesung eine Liste gleicher Länge sein.');
    }
  } else if (!istObjekt(ia)) {
    return fa('interaktion', 'interaktion fehlt.');
  } else if (Array.isArray(a.loesung) && ia.kind !== undefined) {
    return fa('loesung', 'loesung ist eine Liste, interaktion aber keine – bei einteiligen Aufgaben ist loesung ein Objekt.');
  }
  if (a.loesung === undefined) return fa('loesung', 'loesung fehlt.');
  const teile = F.teile(a);
  const felderBesitzer = new Map();
  let fehlerVorher = 0;
  teile.forEach((t, i) => {
    const ort = teile.length > 1 ? `interaktion[${i}]` : 'interaktion';
    const n0 = fehlerZaehler.n;
    validiereInteraktion(t.interaktion, t.loesung, a, ort, (o, msg) => {
      fehlerZaehler.n++;
      fa(o, msg);
    }, wa);
    if (fehlerZaehler.n !== n0) fehlerVorher++;
    const art = F.artVon(t.interaktion);
    stats.interaktionen[art] = (stats.interaktionen[art] || 0) + 1;
    if (art === 'gaps' && istObjekt(t.interaktion.felder)) {
      for (const fid of Object.keys(t.interaktion.felder)) {
        if (felderBesitzer.has(fid)) fa(ort, `Feld „${fid}“ ist in mehreren Teilen definiert.`);
        felderBesitzer.set(fid, i);
      }
    }
    if (istText(t.interaktion && t.interaktion.frage) === false && t.interaktion && t.interaktion.frage !== undefined) fa(ort, 'frage muss Text sein.');
    if (t.interaktion && t.interaktion.inhalt !== undefined) validiereBloecke(t.interaktion.inhalt, `${id} › ${ort} › inhalt`, f, w, id, stats);
  });

  // Lücken ↔ felder
  const vorkommen = F.alleLuecken(a);
  const gezaehlt = new Map();
  for (const v of vorkommen) gezaehlt.set(v.id, (gezaehlt.get(v.id) || 0) + 1);
  for (const [gid, n] of gezaehlt) {
    if (!felderBesitzer.has(gid)) fa('inhalt', `Lücke [[${gid}]] hat kein Feld in einer gaps-Interaktion.`);
    if (n > 1) fa('inhalt', `Lücke [[${gid}]] kommt ${n}-mal vor (jede Lücke genau einmal).`);
  }
  for (const fid of felderBesitzer.keys()) if (!gezaehlt.has(fid)) fa('interaktion', `Feld „${fid}“ hat keine Lücke [[${fid}]] im Inhalt.`);

  // Konsistenz: Die Musterantwort aus der Lösung muss vom Prüfer als richtig erkannt werden.
  if (!fehlerVorher) {
    try {
      const r = C.pruefeAufgabe(a, C.musterantwortAufgabe(a));
      if (!r.ok) fa('loesung', 'Die Lösung wird vom Prüfer nicht als richtig erkannt (Musterantwort ≠ Lösung) – bitte loesung prüfen.');
    } catch (e) {
      fa('loesung', `Lösung nicht prüfbar: ${e.message}`);
    }
  }
}
const fehlerZaehler = { n: 0 };

function validiereInteraktion(ia, lo, aufgabe, ort, fa, wa) {
  if (!istObjekt(ia)) return fa(ort, 'Interaktion ist kein Objekt.');
  if (!F.INTERAKTIONEN.includes(ia.kind)) return fa(ort, `unbekannte kind „${ia.kind}“ (erlaubt: ${F.INTERAKTIONEN.join(', ')}).`);
  const lort = ort.replace('interaktion', 'loesung');
  if (!istObjekt(lo)) return fa(lort, 'Lösung dieses Teils muss ein Objekt sein.');
  switch (ia.kind) {
    case 'gaps': {
      if (!istObjekt(ia.felder) || !Object.keys(ia.felder).length) return fa(ort, 'felder fehlt oder ist leer.');
      for (const [fid, feld] of Object.entries(ia.felder)) {
        const o = `${ort}.felder.${fid}`;
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(fid)) fa(o, 'Feld-id darf nur A–Z, a–z, 0–9, _ und - enthalten.');
        if (!istObjekt(feld)) {
          fa(o, 'Feld muss ein Objekt sein ({ "typ": "text" }).');
          continue;
        }
        const typ = feld.typ || 'text';
        if (!['text', 'zahl', 'auswahl'].includes(typ)) fa(o, `typ „${feld.typ}“ unbekannt (text | zahl | auswahl).`);
        if (feld.norm !== undefined && !['code', 'text', 'exakt'].includes(feld.norm)) fa(o, `norm „${feld.norm}“ unbekannt (code | text | exakt).`);
        if (feld.breite !== undefined && (!Number.isInteger(feld.breite) || feld.breite < 1 || feld.breite > 80)) fa(o, 'breite muss eine ganze Zahl 1–80 sein.');
        if (typ === 'auswahl' && (!Array.isArray(feld.optionen) || feld.optionen.length < 2 || !feld.optionen.every(istSkalar))) {
          fa(o, 'auswahl braucht optionen (Liste mit mind. 2 Texten).');
        }
        let acc = lo[fid];
        if (acc === undefined) {
          fa(`${lort}.${fid}`, `Lösung für Feld „${fid}“ fehlt.`);
          continue;
        }
        if (!Array.isArray(acc)) {
          wa(`${lort}.${fid}`, 'Lösung sollte eine Liste akzeptierter Antworten sein (["…"]).');
          acc = [acc];
        }
        if (!acc.length || !acc.every(istSkalar)) fa(`${lort}.${fid}`, 'Liste akzeptierter Antworten ist leer oder enthält keine Texte/Zahlen.');
        if (typ === 'zahl' && acc.some((x) => !Number.isFinite(F.alsZahl(x)))) wa(`${lort}.${fid}`, 'Feld vom typ zahl hat eine nicht-numerische Lösung (Vergleich dann als Text).');
        if (typ === 'auswahl' && Array.isArray(feld.optionen) && acc.some((x) => !feld.optionen.map(String).includes(String(x)))) {
          fa(`${lort}.${fid}`, 'Lösung eines auswahl-Feldes muss eine der optionen sein.');
        }
      }
      for (const k of Object.keys(lo)) if (!(k in ia.felder)) wa(lort, `Lösung enthält unbekanntes Feld „${k}“.`);
      break;
    }
    case 'choice': {
      if (!Array.isArray(ia.optionen) || ia.optionen.length < 2) return fa(ort, 'optionen braucht mind. 2 Einträge { id, md }.');
      const ids = ia.optionen.map((o) => (istObjekt(o) ? o.id : undefined));
      if (ids.some((x) => !istText(x))) fa(ort, 'Jede Option braucht eine id.');
      if (new Set(ids).size !== ids.length) fa(ort, 'Options-ids müssen eindeutig sein.');
      if (ia.optionen.some((o) => istObjekt(o) && !istText(o.md) && !istText(o.code))) fa(ort, 'Jede Option braucht einen Text (md).');
      if (ia.mehrfach !== undefined && typeof ia.mehrfach !== 'boolean') fa(ort, 'mehrfach muss true oder false sein.');
      if (!Array.isArray(lo.richtig) || !lo.richtig.length) return fa(lort, 'richtig (Liste der richtigen Options-ids) fehlt.');
      for (const r of lo.richtig) if (!ids.includes(r)) fa(lort, `richtig enthält unbekannte Option „${r}“.`);
      if (!ia.mehrfach && lo.richtig.length !== 1) fa(lort, 'Einfachauswahl (mehrfach: false) braucht genau eine richtige Option.');
      break;
    }
    case 'order': {
      if (!Array.isArray(ia.teile) || ia.teile.length < 2) return fa(ort, 'teile braucht mind. 2 Einträge { id, code | md }.');
      const ids = ia.teile.map((t) => (istObjekt(t) ? t.id : undefined));
      if (ids.some((x) => !istText(x))) fa(ort, 'Jedes Teil braucht eine id.');
      if (new Set(ids).size !== ids.length) fa(ort, 'Teil-ids müssen eindeutig sein.');
      if (ia.teile.some((t) => istObjekt(t) && typeof t.code !== 'string' && typeof t.md !== 'string')) fa(ort, 'Jedes Teil braucht code oder md.');
      if (!Array.isArray(lo.reihenfolgen) || !lo.reihenfolgen.length) return fa(lort, 'reihenfolgen (Liste von id-Listen) fehlt.');
      lo.reihenfolgen.forEach((r, i) => {
        if (!Array.isArray(r) || !r.length) return fa(lort, `reihenfolgen[${i}] muss eine nicht-leere Liste sein.`);
        for (const x of r) if (!ids.includes(x)) fa(lort, `reihenfolgen[${i}] enthält unbekannte id „${x}“.`);
        if (new Set(r).size !== r.length) fa(lort, `reihenfolgen[${i}] enthält eine id mehrfach.`);
      });
      break;
    }
    case 'lines': {
      const b = Array.isArray(aufgabe.inhalt) ? aufgabe.inhalt[ia.block] : undefined;
      if (!Number.isInteger(ia.block) || !b || b.t !== 'code') return fa(ort, `block muss der Index eines code-Blocks in inhalt sein (gefunden: ${ia.block}).`);
      const n = String(b.code).split('\n').length;
      if (!Number.isInteger(ia.anzahl) || ia.anzahl < 1) fa(ort, 'anzahl muss eine ganze Zahl ≥ 1 sein.');
      if (!Array.isArray(lo.zeilen) || !lo.zeilen.length) return fa(lort, 'zeilen (1-basierte Zeilennummern) fehlt.');
      for (const z of lo.zeilen) if (!Number.isInteger(z) || z < 1 || z > n) fa(lort, `Zeile ${z} liegt nicht im Code (1–${n}).`);
      if (Number.isInteger(ia.anzahl) && lo.zeilen.length !== ia.anzahl) fa(lort, `zeilen hat ${lo.zeilen.length} Einträge, anzahl ist ${ia.anzahl}.`);
      break;
    }
    case 'match': {
      if (!Array.isArray(ia.elemente) || !ia.elemente.length) return fa(ort, 'elemente fehlt.');
      if (!Array.isArray(ia.kategorien) || ia.kategorien.length < 2) return fa(ort, 'kategorien braucht mind. 2 Einträge.');
      const eids = ia.elemente.map((e) => (istObjekt(e) ? e.id : undefined));
      const kids = ia.kategorien.map((e) => (istObjekt(e) ? e.id : undefined));
      if (eids.some((x) => !istText(x)) || new Set(eids).size !== eids.length) fa(ort, 'elemente brauchen eindeutige ids.');
      if (kids.some((x) => !istText(x)) || new Set(kids).size !== kids.length) fa(ort, 'kategorien brauchen eindeutige ids.');
      for (const e of eids) {
        if (lo[e] === undefined) fa(lort, `Zuordnung für Element „${e}“ fehlt.`);
        else if (!kids.includes(lo[e])) fa(lort, `Element „${e}“ ist der unbekannten Kategorie „${lo[e]}“ zugeordnet.`);
      }
      for (const k of Object.keys(lo)) if (!eids.includes(k)) fa(lort, `Lösung enthält unbekanntes Element „${k}“.`);
      break;
    }
    case 'tree': {
      if (ia.modus === 'klick') {
        let t;
        try {
          t = Baum.parse(String(ia.baum));
        } catch (e) {
          return fa(ort, `baum ist kein gültiger Klammerbaum: ${e.message}`);
        }
        if (!Array.isArray(lo.folge) || !lo.folge.length) return fa(lort, 'folge (Liste von Pfaden "", "L", "LR", …) fehlt.');
        for (const p of lo.folge) {
          if (typeof p !== 'string' || !/^[LR]*$/.test(p) || !Baum.knotenAn(t, p)) fa(lort, `Pfad „${p}“ existiert im Baum nicht.`);
        }
        if (new Set(lo.folge).size !== lo.folge.length) wa(lort, 'folge enthält einen Knoten mehrfach.');
      } else if (ia.modus === 'bauen') {
        try {
          Baum.parse(ia.start === undefined ? '-' : String(ia.start));
        } catch (e) {
          fa(ort, `start ist kein gültiger Klammerbaum: ${e.message}`);
        }
        try {
          Baum.parse(String(lo.baum));
        } catch (e) {
          fa(lort, `baum der Lösung ist kein gültiger Klammerbaum: ${e.message}`);
        }
        if (ia.werte !== undefined && (!Array.isArray(ia.werte) || !ia.werte.every(istSkalar))) fa(ort, 'werte muss eine Liste von Werten sein.');
      } else fa(ort, 'modus muss "klick" oder "bauen" sein.');
      break;
    }
    case 'array': {
      if (!Array.isArray(ia.start) || !ia.start.length || !ia.start.every(istSkalar)) return fa(ort, 'start (nicht-leere Liste von Werten) fehlt.');
      const n = ia.start.length;
      if (ia.modus === 'tausch') {
        if (!Array.isArray(lo.tausche)) return fa(lort, 'tausche (Liste von Index-Paaren) fehlt.');
        lo.tausche.forEach((p, i) => {
          if (!Array.isArray(p) || p.length !== 2 || !p.every((x) => Number.isInteger(x) && x >= 0 && x < n)) fa(lort, `tausche[${i}] muss ein Paar gültiger Indizes (0–${n - 1}) sein.`);
          else if (p[0] === p[1]) fa(lort, `tausche[${i}] tauscht ein Element mit sich selbst.`);
        });
        if (!lo.tausche.length && !ia.fertigKnopf) wa(ort, 'Lösung ohne Tausch – fertigKnopf: true empfohlen.');
      } else if (ia.modus === 'klick') {
        if (!Array.isArray(lo.folge) || !lo.folge.length) return fa(lort, 'folge (Liste von Indizes) fehlt.');
        for (const x of lo.folge) if (!Number.isInteger(x) || x < 0 || x >= n) fa(lort, `Index ${x} liegt nicht in der Reihung (0–${n - 1}).`);
      } else fa(ort, 'modus muss "tausch" oder "klick" sein.');
      break;
    }
    case 'grid': {
      if (!Array.isArray(ia.raster) || !ia.raster.length || !ia.raster.every(Array.isArray)) return fa(ort, 'raster (Liste von Zeilen) fehlt.');
      const zeilen = ia.raster.length;
      const spalten = Math.max(...ia.raster.map((z) => z.length));
      if (ia.raster.some((z) => z.length !== spalten)) wa(ort, 'raster ist nicht rechteckig.');
      if (!Array.isArray(lo.zellen) || !lo.zellen.length) return fa(lort, 'zellen (Liste von [zeile, spalte]) fehlt.');
      lo.zellen.forEach((p, i) => {
        if (!Array.isArray(p) || p.length !== 2 || !Number.isInteger(p[0]) || !Number.isInteger(p[1]) || p[0] < 0 || p[0] >= zeilen || p[1] < 0 || p[1] >= spalten) {
          fa(lort, `zellen[${i}] liegt nicht im Raster.`);
        }
      });
      if (lo.reihenfolge !== undefined && typeof lo.reihenfolge !== 'boolean') fa(lort, 'reihenfolge muss true oder false sein.');
      break;
    }
    case 'adtsim': {
      if (!F.ADT_ARTEN.includes(ia.art)) fa(ort, `art muss ${F.ADT_ARTEN.join(' | ')} sein.`);
      if (ia.start !== undefined && (!Array.isArray(ia.start) || !ia.start.every(istSkalar))) fa(ort, 'start muss eine Liste von Werten sein.');
      if (!Array.isArray(lo.inhalt) || !lo.inhalt.every(istSkalar)) fa(lort, 'inhalt (Liste der Elemente im Endzustand) fehlt.');
      if (ia.werte !== undefined && (!Array.isArray(ia.werte) || !ia.werte.every(istSkalar))) fa(ort, 'werte muss eine Liste von Werten sein.');
      break;
    }
    default:
      break;
  }
}

function validiereBloecke(bloecke, ort, f, w, aufgabe, stats, opt = {}) {
  const ebene = aufgabe ? 'aufgabe' : 'level';
  if (!Array.isArray(bloecke)) return f(ebene, ort, 'muss eine Liste von Blöcken sein.', aufgabe);
  bloecke.forEach((b, i) => {
    const o = `${ort}[${i}]`;
    if (!istObjekt(b)) return f(ebene, o, 'Block ist kein Objekt.', aufgabe);
    if (!F.BLOCK_TYPEN.includes(b.t)) return f(ebene, o, `unbekannter Blocktyp t: „${b.t}“ (erlaubt: ${F.BLOCK_TYPEN.join(', ')}).`, aufgabe);
    if (stats) stats.bloecke[b.t] = (stats.bloecke[b.t] || 0) + 1;
    const fe = (m) => f(ebene, `${o} (${b.t})`, m, aufgabe);
    switch (b.t) {
      case 'text':
      case 'hinweis':
        if (typeof b.md !== 'string') fe('md (Text) fehlt.');
        break;
      case 'code': {
        if (typeof b.code !== 'string') return fe('code fehlt.');
        const n = b.code.split('\n').length;
        if (b.nummern !== undefined && typeof b.nummern !== 'boolean') fe('nummern muss true oder false sein.');
        if (b.markiere !== undefined) {
          if (!Array.isArray(b.markiere)) fe('markiere muss eine Liste von Zeilennummern sein.');
          else for (const z of b.markiere) if (!Number.isInteger(z) || z < 1 || z > n) fe(`markiere: Zeile ${z} liegt nicht im Code (1–${n}).`);
        }
        break;
      }
      case 'struktogramm':
        if (b.kopf !== undefined && typeof b.kopf !== 'string') fe('kopf muss Text sein.');
        if (!Array.isArray(b.rumpf)) fe('rumpf (Liste von Knoten) fehlt.');
        else validiereKnoten(b.rumpf, fe, 0);
        break;
      case 'tabelle':
        if (!Array.isArray(b.kopf) || !b.kopf.every(istSkalar)) fe('kopf (Liste der Spaltenköpfe) fehlt.');
        if (!Array.isArray(b.zeilen) || !b.zeilen.every((z) => Array.isArray(z) && z.every((c) => istSkalar(c) || c === null))) fe('zeilen muss eine Liste von Zeilen (Listen von Texten) sein.');
        else if (Array.isArray(b.kopf) && b.zeilen.some((z) => z.length !== b.kopf.length)) w(ebene, o, 'Nicht alle Zeilen haben so viele Zellen wie der Kopf.', aufgabe);
        // Tracetabellen nur mit Variablen; Eintragsstellen stehen im Code als „// → Tabellenzeile“
        if (Array.isArray(b.kopf) && b.kopf.length > 1 && !/^(Ausdruck|Abzeichen)/.test(String(b.kopf[0])))
          for (const k of b.kopf) if (BEDINGUNGSSPALTE.test(String(k))) w(ebene, o, `Bedingungsspalte „${k}“ – Tracetabellen enthalten nur Variablen (Stellen im Code mit „// → Tabellenzeile“ markieren).`, aufgabe);
        break;
      case 'baum':
        try {
          Baum.parse(String(b.baum));
        } catch (e) {
          fe(`baum ist kein gültiger Klammerbaum: ${e.message}`);
        }
        break;
      case 'reihung':
        if (!Array.isArray(b.werte) || !b.werte.every((x) => istSkalar(x) || x === null)) fe('werte (Liste) fehlt.');
        if (b.markiert !== undefined) {
          if (!istObjekt(b.markiert)) fe('markiert muss ein Objekt { "index": "farbe" } sein.');
          else
            for (const [k, v] of Object.entries(b.markiert)) {
              if (!/^\d+$/.test(k) || (Array.isArray(b.werte) && Number(k) >= b.werte.length)) fe(`markiert: Index ${k} liegt nicht in der Reihung.`);
              if (!MARKIER_FARBEN.includes(String(v)) && !FARBE.test(String(v))) w(ebene, o, `markiert: unbekannte Farbe „${v}“ (gold, gruen, rot, blau, grau, orange, lila oder #RRGGBB).`, aufgabe);
            }
        }
        break;
      case 'raster':
        if (!Array.isArray(b.zeilen) || !b.zeilen.every(Array.isArray)) fe('zeilen (Liste von Zeilen) fehlt.');
        break;
      case 'klassenkarte':
        if (!istText(b.name)) fe('name fehlt.');
        for (const k of ['attribute', 'methoden']) if (b[k] !== undefined && (!Array.isArray(b[k]) || !b[k].every((x) => typeof x === 'string'))) fe(`${k} muss eine Liste von Texten sein.`);
        break;
      case 'adt':
        if (!F.ADT_ARTEN.includes(b.art)) fe(`art muss ${F.ADT_ARTEN.join(' | ')} sein.`);
        if (!Array.isArray(b.inhalt) || !b.inhalt.every(istSkalar)) fe('inhalt (Liste) fehlt.');
        break;
      default:
        break;
    }
    if (opt.lueckenVerboten && F.luecken([b]).length) fe('Lücken [[…]] sind hier nicht erlaubt.');
  });
}

function validiereKnoten(knoten, fe, tiefe) {
  if (tiefe > 30) return fe('Struktogramm zu tief verschachtelt.');
  knoten.forEach((k, i) => {
    if (!istObjekt(k)) return fe(`Knoten ${i + 1} ist kein Objekt.`);
    // fußgesteuert: { "wiederhole": [...], "bis": "…" } (großzügig auch "solange" als Fußbedingung)
    const art = SG_SCHLUESSEL.filter((s) => s in k && !('wiederhole' in k && s === 'solange'));
    if (art.length !== 1 && !(art.length === 2 && art.includes('kommentar'))) {
      return fe(`Knoten ${i + 1}: genau einer von ${SG_SCHLUESSEL.join(', ')} erwartet (gefunden: ${Object.keys(k).join(', ') || 'nichts'}).`);
    }
    if ('wenn' in k) {
      if (typeof k.wenn !== 'string') fe(`Knoten ${i + 1}: wenn muss Text sein.`);
      if (!Array.isArray(k.dann)) fe(`Knoten ${i + 1}: wenn braucht dann (Liste).`);
      else validiereKnoten(k.dann, fe, tiefe + 1);
      if (k.sonst !== undefined) {
        if (!Array.isArray(k.sonst)) fe(`Knoten ${i + 1}: sonst muss eine Liste sein.`);
        else validiereKnoten(k.sonst, fe, tiefe + 1);
      }
    } else if ('solange' in k || 'zaehle' in k || 'fuer' in k) {
      const key = 'solange' in k ? 'solange' : 'zaehle' in k ? 'zaehle' : 'fuer';
      if (typeof k[key] !== 'string') fe(`Knoten ${i + 1}: ${key} muss Text sein.`);
      if (!Array.isArray(k.rumpf)) fe(`Knoten ${i + 1}: ${key} braucht rumpf (Liste).`);
      else validiereKnoten(k.rumpf, fe, tiefe + 1);
    } else if ('wiederhole' in k) {
      if (!Array.isArray(k.wiederhole)) fe(`Knoten ${i + 1}: wiederhole muss eine Liste sein.`);
      else validiereKnoten(k.wiederhole, fe, tiefe + 1);
      if (typeof k.bis !== 'string' && typeof k.solange !== 'string') fe(`Knoten ${i + 1}: wiederhole braucht bis (Text).`);
    } else {
      const key = art.find((a) => a !== 'kommentar') || 'kommentar';
      if (typeof k[key] !== 'string') fe(`Knoten ${i + 1}: ${key} muss Text sein.`);
    }
  });
}

/**
 * Mehrere Welten gemeinsam prüfen (zusätzlich: doppelte Weltnummern, doppelte ids über Dateien hinweg).
 * @param {{datei: string, data?: object, parseFehler?: string}[]} eintraege
 */
function validiereWelten(eintraege) {
  const ergebnisse = [];
  const weltNr = new Map();
  const ids = new Map();
  for (const e of eintraege) {
    if (e.parseFehler) {
      ergebnisse.push({ datei: e.datei, fehler: [{ datei: e.datei, ebene: 'datei', ort: '', meldung: e.parseFehler, aufgabe: null }], warnungen: [], stats: null });
      continue;
    }
    const r = validiereWelt(e.data, { datei: e.datei });
    if (e.data && Number.isInteger(e.data.welt)) {
      if (weltNr.has(e.data.welt)) r.fehler.push({ datei: e.datei, ebene: 'datei', ort: 'welt', meldung: `welt ${e.data.welt} ist auch in ${weltNr.get(e.data.welt)} definiert.`, aufgabe: null });
      weltNr.set(e.data.welt, e.datei);
    }
    if (e.data && Array.isArray(e.data.aufgaben)) {
      for (const a of e.data.aufgaben) {
        if (!a || typeof a.id !== 'string') continue;
        if (ids.has(a.id) && ids.get(a.id) !== e.datei) r.fehler.push({ datei: e.datei, ebene: 'aufgabe', ort: a.id, meldung: `id „${a.id}“ ist auch in ${ids.get(a.id)} vergeben.`, aufgabe: a.id });
        ids.set(a.id, e.datei);
      }
    }
    ergebnisse.push({ datei: e.datei, ...r });
  }
  return ergebnisse;
}

/** JSON-Datei lesen (mit verständlicher Meldung bei Syntaxfehlern). */
function leseDatei(pfad) {
  const datei = path.basename(pfad);
  let text;
  try {
    text = fs.readFileSync(pfad, 'utf8');
  } catch (e) {
    return { datei, pfad, parseFehler: `Datei nicht lesbar: ${e.message}` };
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try {
    return { datei, pfad, data: JSON.parse(text), text };
  } catch (e) {
    return { datei, pfad, parseFehler: `Kein gültiges JSON: ${e.message}`, text };
  }
}

function validiereDateien(pfade) {
  return validiereWelten(pfade.map(leseDatei));
}

/** Ergebnis als lesbarer Text (für CLI und Logs). */
function formatiere(ergebnisse, { warnungen = true } = {}) {
  const zeilen = [];
  let nF = 0;
  let nW = 0;
  for (const r of ergebnisse) {
    nF += r.fehler.length;
    nW += r.warnungen.length;
    const st = r.stats;
    const kopf = st ? `${r.datei}: ${st.levels} Level, ${st.aufgaben} Aufgaben, Boss-Pool ${st.bossPool}` : r.datei;
    zeilen.push(`${r.fehler.length ? '✖' : '✔'} ${kopf}${r.fehler.length ? ` – ${r.fehler.length} Fehler` : ''}${r.warnungen.length ? `, ${r.warnungen.length} Warnung(en)` : ''}`);
    for (const x of r.fehler) zeilen.push(`    Fehler:  ${x.ort ? x.ort + ': ' : ''}${x.meldung}`);
    if (warnungen) for (const x of r.warnungen) zeilen.push(`    Hinweis: ${x.ort ? x.ort + ': ' : ''}${x.meldung}`);
    if (st && st.jeLevel.length) {
      for (const l of st.jeLevel) {
        zeilen.push(`    · ${l.level} ${l.titel || ''}: ${l.aufgaben} Aufgaben, ${l.punkte} Punkte, Stufen ${l.stufen[1]}/${l.stufen[2]}/${l.stufen[3]}, ${l.interaktionen.join(', ')}`);
      }
      const arten = Object.keys(st.interaktionen);
      zeilen.push(`    Interaktionsarten (${arten.length}): ${arten.map((a) => `${a} ×${st.interaktionen[a]}`).join(', ')}`);
    }
  }
  zeilen.push('');
  zeilen.push(nF ? `${nF} Fehler, ${nW} Warnung(en).` : `Alles in Ordnung (${nW} Warnung(en)).`);
  return zeilen.join('\n');
}

module.exports = { validiereWelt, validiereWelten, validiereDateien, leseDatei, formatiere, aufgabePunkte };
