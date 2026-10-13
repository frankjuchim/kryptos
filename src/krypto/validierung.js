'use strict';
// Krypto-Zusatzprüfungen für den Validator (Hooks nach TECHNIK §4.2, registriert in src/krypto/index.js).
// Welt- und Level-Felder (Delta §2, §3), Kontraste (WCAG 2.1), loesung._fehlmuster in gaps-Teilen (Delta §9.6);
// Aufgaben-, Boss- und Dateiregeln (Delta §4, §5.3, §10, §11). Alle Fehler- und Hinweistexte ohne Lösungszeichen.

const fs = require('node:fs');
const path = require('node:path');
const C = require('../content/checker');
const F = require('../content/format');
const { FALLEN_IDS, NIVEAU_IDS } = require('../domain');
const { WERKZEUG_IDS } = require('./werkzeuge');
const CHIFFRE = require('./interaktionen/chiffre');
const N = require('./neuberechnung');
const { FALLEN_PLAUSIBEL } = require('./fach');

const Krypto = require('../../public/static/js/shared/krypto.js');
const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const CODE = /^[a-z_]{1,30}$/;

/** _fehlmuster eines gaps-Teils: { feld: [{ wert, p, code }, …] } (1–5 je Feld), nie gleich einer akzeptierten Lösung. */
function pruefeFehlmuster(ia, lo, lort, fa) {
  const fm = lo._fehlmuster;
  const o = `${lort}._fehlmuster`;
  if (!istObjekt(fm)) return fa(o, '_fehlmuster muss ein Objekt { feld: [ … ] } sein.');
  const felder = istObjekt(ia.felder) ? ia.felder : {};
  for (const [id, liste] of Object.entries(fm)) {
    if (!Object.hasOwn(felder, id)) {
      fa(o, `_fehlmuster: Feld „${id}“ gibt es nicht in felder.`);
      continue;
    }
    if (!Array.isArray(liste) || liste.length < 1 || liste.length > 5) {
      fa(`${o}.${id}`, '_fehlmuster: je Feld eine Liste mit 1–5 Einträgen.');
      continue;
    }
    liste.forEach((m, i) => {
      const oi = `${o}.${id}[${i}]`;
      if (!istObjekt(m) || !(typeof m.wert === 'string' || typeof m.wert === 'number') || String(m.wert).trim() === '') {
        return fa(oi, '_fehlmuster: Eintrag braucht wert (Text oder Zahl), p und code.');
      }
      if (!FALLEN_IDS.includes(m.p)) fa(oi, '_fehlmuster: p muss P1–P10 sein.');
      if (typeof m.code !== 'string' || !CODE.test(m.code)) fa(oi, '_fehlmuster: code muss aus a–z und _ bestehen (höchstens 30 Zeichen).');
      if (lo[id] !== undefined && C.feldRichtig(felder[id], m.wert, Array.isArray(lo[id]) ? lo[id] : [lo[id]])) {
        fa(oi, `_fehlmuster gleicht einer akzeptierten Lösung („${m.wert}“).`);
      }
    });
  }
}

/* ---------- Aufgaben (Delta §4, §5.3) ---------- */

const ARCHIVFUND = /^W\d-A-\d{2,3}$/;
const PRUEFNACHWEIS = [/^quellen\/pruefwerte\/W\d\.json#[A-Za-z0-9-]+$/, /^werkzeuge\/krypto\/fremde_verfahren\.py:[a-z_][a-z0-9_]*$/];
const NUMMERIERUNG = /Nummerierung:\s*A\s*=\s*[01]/;
const ALTBEGRIFFE = { Chiffrat: 'Geheimtext', Friedmann: 'Friedman', Merkel: 'Merkle', Kerkhoff: 'Kerckhoffs' };
const ALTBEGRIFF = /\b(Chiffrat\w*|Friedmann|Merkel|Kerkhoffs?)\b/g;
const FUENFERGRUPPEN = /^[A-Z]{5}( [A-Z]{5})*( [A-Z]{1,5})?$/;
// Lernende werden geduzt (CLAUDE.md): „Die Lernenden …“ ist Spec-Sprache für Lehrkräfte, nicht für Schülertexte
const DIE_LERNENDEN = /\b[Dd]ie Lernenden\b/;
const DUZEN = 'Lernende duzen: „Die Lernenden …“ in Du-Form umschreiben (Spec-Lernziele sind für Lehrkräfte formuliert).';
const KERN_BLOECKE = ['baum', 'adt', 'klassenkarte'];

/** Alle Blöcke einer Aufgabe (Inhalt, Teil-Inhalte, Erklärung). */
function alleBloecke(a, { erklaerung = true } = {}) {
  const liste = (x) => (Array.isArray(x) ? x.filter(istObjekt) : []);
  const out = [...liste(a.inhalt)];
  for (const t of F.teile(a)) if (istObjekt(t.interaktion)) out.push(...liste(t.interaktion.inhalt));
  if (erklaerung) out.push(...liste(a.erklaerung));
  return out;
}

/** Fließtexte (Text-/Hinweisblöcke, Fragen, Tipps) – Grundlage der Inhalts-Hinweise. */
function fliesstexte(a) {
  const out = [];
  for (const b of alleBloecke(a)) if ((b.t === 'text' || b.t === 'hinweis') && typeof b.md === 'string') out.push(b.md);
  for (const t of F.teile(a)) {
    const ia = t.interaktion;
    if (istObjekt(ia)) for (const k of ['frage', 'md']) if (typeof ia[k] === 'string') out.push(ia[k]);
  }
  if (Array.isArray(a.tipps)) for (const t of a.tipps) if (typeof t === 'string') out.push(t);
  return out;
}

/** Enthält die Aufgabe ein fremdes Verfahren (chiffre typ frei, bits-rechnen operation frei)? */
function hatFrei(a) {
  return F.teile(a).some(({ interaktion: ia }) => istObjekt(ia) && ((ia.kind === 'chiffre' && istObjekt(ia.verfahren) && ia.verfahren.typ === 'frei') || (ia.kind === 'bits-rechnen' && ia.operation === 'frei')));
}

/** Wird mit Buchstabenwerten gerechnet (chiffre affin oder ausgabe zahlen)? */
function rechnetMitZahlen(a) {
  return F.teile(a).some(({ interaktion: ia }) => istObjekt(ia) && ia.kind === 'chiffre' && ((istObjekt(ia.verfahren) && ia.verfahren.typ === 'affin') || ia.ausgabe === 'zahlen'));
}

/** Kategorien, in denen „bestimme den Schlüssel“ eine Knack-Aufgabe ankündigt (Review M3 W1). */
const KNACK_KATEGORIEN = ['entschluesseln', 'haeufigkeitsanalyse', 'kasiski-friedman', 'fremde-chiffre'];
const KNACK_OPERATOR = /\b(bestimme|ermittle|finde)\b/i;
const SCHLUESSEL_WORT = /schlüssel/i;

/** Rolle des Levels, in dem die Aufgabe steht (oder null). */
function rolleVon(id, data) {
  const l = (istObjekt(data) && Array.isArray(data.levels) ? data.levels : []).find((x) => istObjekt(x) && Array.isArray(x.aufgaben) && x.aufgaben.includes(id));
  return l ? l.rolle : null;
}

/**
 * Verdeckter Schlüssel (Delta §8.1, Review M3 W1): schluesselVerdeckt boolean; verdeckt (explizit oder automatisch im
 * Kryptoanalyse-Level) verträgt keine Hilfszeile schluessel (Fehler); Knack-Formulierung ohne Verdecken → Hinweis.
 */
function pruefeVerdeckt(a, fa, wa, data) {
  if (a.schluesselVerdeckt !== undefined && typeof a.schluesselVerdeckt !== 'boolean') fa('schluesselVerdeckt', 'schluesselVerdeckt muss true oder false sein.');
  const kontext = { ...a, _rolle: rolleVon(a.id, data) };
  const teile = F.teile(a);
  let offen = false;
  teile.forEach(({ interaktion: ia }, i) => {
    if (!istObjekt(ia) || ia.kind !== 'chiffre') return;
    const ort = teile.length > 1 ? `interaktion[${i}]` : 'interaktion';
    if (CHIFFRE.schluesselVerdeckt(ia, kontext)) {
      if (Array.isArray(ia.hilfszeilen) && ia.hilfszeilen.includes('schluessel')) {
        fa(ort, 'hilfszeilen: schluessel verrät den verdeckten Schlüssel (Kryptoanalyse-Level bzw. schluesselVerdeckt) – Hilfszeile entfernen oder schluesselVerdeckt: false setzen.');
      }
    } else offen = true;
  });
  if (offen && KNACK_KATEGORIEN.includes(a.kategorie)) {
    const texte = fliesstexte(a).filter((t) => !(Array.isArray(a.tipps) && a.tipps.includes(t)));
    if (texte.some((t) => SCHLUESSEL_WORT.test(t) && KNACK_OPERATOR.test(t))) {
      wa('interaktion', 'Knack-Aufgabe? Der Schlüssel ist nicht verdeckt und steht im Verfahren für den Client – schluesselVerdeckt: true setzen (Delta §8.1).');
    }
  }
}

/**
 * Fallen-Plausibilität (Review M3 K4): fallen der Aufgabe sowie p der erwarteten Fehlantworten (chiffre/bits
 * fehlmuster, gaps _fehlmuster) müssen zur Kategorie passen (FALLEN_PLAUSIBEL) – sonst Hinweis.
 */
function pruefeFallenPlausibel(a, wa) {
  const liste = FALLEN_PLAUSIBEL[a.kategorie];
  if (!liste) return;
  const melde = (ort, p, was) => wa(ort, `${was}Falle ${p} passt nicht zur Kategorie ${a.kategorie} (plausibel: ${liste.join(', ')}).`);
  if (Array.isArray(a.fallen)) for (const p of a.fallen) if (FALLEN_IDS.includes(p) && !liste.includes(p)) melde('fallen', p, '');
  const teile = F.teile(a);
  teile.forEach(({ loesung: lo }, i) => {
    if (!istObjekt(lo)) return;
    const lort = teile.length > 1 ? `loesung[${i}]` : 'loesung';
    if (Array.isArray(lo.fehlmuster)) {
      lo.fehlmuster.forEach((f, j) => {
        if (istObjekt(f) && FALLEN_IDS.includes(f.p) && !liste.includes(f.p)) melde(`${lort}.fehlmuster[${j}]`, f.p, 'fehlmuster: ');
      });
    }
    if (istObjekt(lo._fehlmuster)) {
      for (const [id, l] of Object.entries(lo._fehlmuster)) {
        (Array.isArray(l) ? l : []).forEach((f, j) => {
          if (istObjekt(f) && FALLEN_IDS.includes(f.p) && !liste.includes(f.p)) melde(`${lort}._fehlmuster.${id}[${j}]`, f.p, '_fehlmuster: ');
        });
      }
    }
  });
}

/** Hook aufgabe: Archivfund, pruefnachweis, _fehlmuster, verdeckter Schlüssel, Fallen-Plausibilität, Inhalts-Hinweise. */
function aufgabe(a, fa, wa, { data } = {}) {
  const id = typeof a.id === 'string' ? a.id : '';
  pruefeVerdeckt(a, fa, wa, data);
  pruefeFallenPlausibel(a, wa);
  // Archivfund (Delta §2, §4.1): 0 Punkte, niveau kern
  if (ARCHIVFUND.test(id)) {
    if (a.punkte !== undefined) fa('punkte', 'Archivfund-Aufgaben haben keine punkte (immer 0).');
    if (a.niveau !== undefined && a.niveau !== 'kern') fa('niveau', 'Archivfund-Aufgaben haben niveau kern.');
  }
  // pruefnachweis (Delta §4.1): Pflicht bei frei (prüfen die Interaktionen), Format, sonst überflüssig
  if (a.pruefnachweis !== undefined) {
    if (typeof a.pruefnachweis !== 'string' || !PRUEFNACHWEIS.some((r) => r.test(a.pruefnachweis))) {
      fa('pruefnachweis', 'pruefnachweis muss auf quellen/pruefwerte/W<n>.json#<id> oder werkzeuge/krypto/fremde_verfahren.py:<name> verweisen.');
    } else if (!hatFrei(a) && !F.teile(a).some(({ interaktion: ia }) => istObjekt(ia) && ia.kind === 'gaps')) {
      wa('pruefnachweis', 'pruefnachweis ist überflüssig – die Neuberechnung ersetzt den Nachweis.');
    }
  }
  // Rechenergebnisse in gaps (Lücken in bits/alphabet nachrechnen, sonst pruefnachweis) und Schlüssel in Blöcken (W3, K8)
  const bloecke = alleBloecke(a, { erklaerung: false });
  N.pruefeGapsRechnung(a, bloecke, fa, wa);
  N.pruefeSchluesselBloecke(a, bloecke, wa);
  // _fehlmuster in gaps-Teilen (Delta §9.6)
  F.teile(a).forEach((t, i, alle) => {
    const ia = t.interaktion;
    const lo = t.loesung;
    if (!istObjekt(ia) || ia.kind !== 'gaps' || !istObjekt(lo) || lo._fehlmuster === undefined) return;
    pruefeFehlmuster(ia, lo, alle.length > 1 ? `loesung[${i}]` : 'loesung', fa);
  });
  const texte = fliesstexte(a);
  // Nummerierung (P1)
  if (rechnetMitZahlen(a) && !alleBloecke(a, { erklaerung: false }).some((b) => b.t === 'alphabet') && !texte.some((t) => NUMMERIERUNG.test(t))) {
    wa('inhalt', 'P1: Nummerierung nicht genannt (Block alphabet oder „Nummerierung: A = 1 … Z = 26“).');
  }
  // Altbegriffe und Geheimtexte in Fünfergruppen (Design §6)
  const alt = new Set();
  for (const t of texte) for (const m of t.matchAll(ALTBEGRIFF)) alt.add(m[1]);
  for (const x of alt) {
    const ersatz = ALTBEGRIFFE[Object.keys(ALTBEGRIFFE).find((k) => x.startsWith(k))];
    wa('inhalt', `Altbegriff „${x}“ – bitte „${ersatz}“ schreiben.`);
  }
  if (texte.some((t) => DIE_LERNENDEN.test(t))) wa('inhalt', DUZEN);
  // Klartext klein (Design §6.2, Plan M5 E58): Entschlüsselungs-Lösungen mit Buchstabenausgabe
  F.teile(a).forEach((t, i, alle) => {
    const ia = t.interaktion;
    const lo = t.loesung;
    if (!istObjekt(ia) || ia.kind !== 'chiffre' || ia.richtung !== 'ent' || !istObjekt(lo) || typeof lo.text !== 'string') return;
    const typ = istObjekt(ia.verfahren) ? ia.verfahren.typ : undefined;
    if (typ === 'frei' || typ === 'xor' || (ia.ausgabe !== undefined && ia.ausgabe !== 'buchstaben')) return;
    if (/[A-Z]/.test(lo.text) && !/[a-zäöüß]/.test(lo.text)) {
      wa(alle.length > 1 ? `loesung[${i}]` : 'loesung', 'Klartext klein schreiben (Design §6.2): Lösung einer Entschlüsselung in Kleinbuchstaben.');
    }
  });
  for (const t of texte) {
    for (const m of t.matchAll(/`([^`]+)`/g)) {
      const g = m[1];
      if (/^[A-Z ]+$/.test(g) && g.replace(/ /g, '').length >= 6 && !FUENFERGRUPPEN.test(g)) wa('inhalt', `Geheimtext „${g}“ steht nicht in Fünfergruppen.`);
    }
  }
  // Häufigkeitsleiste doppelt (Durchsicht W1): Die Werkbank (zuordnung mit haeufigkeit: true) zeigt die Häufigkeiten des
  // Geheimtextes schon – ein Block haeufigkeit über denselben Text wiederholt sie.
  for (const { interaktion: ia } of F.teile(a)) {
    if (!istObjekt(ia) || ia.kind !== 'zuordnung' || ia.haeufigkeit !== true || typeof ia.geheimtext !== 'string') continue;
    const zaehle = (t) => Object.entries(Krypto.haeufigkeiten(String(t))).filter(([, n]) => n > 0).sort().join(';');
    const soll = zaehle(ia.geheimtext);
    for (const b of alleBloecke(a, { erklaerung: false })) {
      if (b.t !== 'haeufigkeit') continue;
      const ist = b.quelle === 'werte' && istObjekt(b.werte) ? Object.entries(b.werte).filter(([, n]) => n > 0).sort().join(';') : typeof b.text === 'string' ? zaehle(b.text) : null;
      if (ist === soll) wa('inhalt', 'Häufigkeitsleiste doppelt: Der Block haeufigkeit zählt denselben Text wie die Werkbank (zuordnung mit haeufigkeit: true) – Block weglassen oder haeufigkeit: false.');
    }
  }
  // Kern-Bestandteile ohne Kryptos-Verwendung (Delta §1)
  const kern = new Set();
  for (const { interaktion: ia } of F.teile(a)) {
    if (!istObjekt(ia)) continue;
    if (ia.kind === 'tree' || ia.kind === 'adtsim') kern.add(ia.kind);
    if (ia.kind === 'array' && ia.modus === 'tausch') kern.add('array:tausch');
  }
  for (const b of alleBloecke(a)) if (KERN_BLOECKE.includes(b.t)) kern.add(b.t);
  for (const k of kern) wa('', `Kern-Bestandteil „${k}“ wird in Kryptos-Inhalten nicht verwendet (Delta §1).`);
  // norm krypto: akzeptierte Lösungen nach Normalisierung nicht leer und verschieden (Delta §5.3)
  F.teile(a).forEach(({ interaktion: ia, loesung: lo }, i, alle) => {
    if (!istObjekt(ia) || ia.kind !== 'gaps' || !istObjekt(ia.felder) || !istObjekt(lo)) return;
    for (const [fid, feld] of Object.entries(ia.felder)) {
      if (!istObjekt(feld) || feld.norm !== 'krypto' || lo[fid] === undefined) continue;
      const werte = (Array.isArray(lo[fid]) ? lo[fid] : [lo[fid]]).map((x) => F.normText(x, 'krypto'));
      const o = `${alle.length > 1 ? `loesung[${i}]` : 'loesung'}.${fid}`;
      if (werte.some((x) => x === '')) wa(o, 'leere Lösung nach Normalisierung (norm krypto).');
      if (new Set(werte).size !== werte.length) wa(o, 'doppelte Lösung nach Normalisierung (norm krypto).');
    }
  });
}

/* ---------- Farben und Kontrast (Delta §2, DESIGNSYSTEM) ---------- */

const PAPIER = '#FBF7EE';
const TINTE = '#14213D';
const DUNKELPAPIER = '#1A2238';
const FARBE = /^#[0-9A-Fa-f]{6}$/;
const MIN_KONTRAST = 4.5;

/** Relative Leuchtdichte nach WCAG 2.1. */
function leuchtdichte(hex) {
  const kanal = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(1) + 0.7152 * kanal(3) + 0.0722 * kanal(5);
}

/** Kontrastverhältnis zweier Farben #RRGGBB: (L1 + 0,05) / (L2 + 0,05) mit L1 ≥ L2. */
function kontrast(hex1, hex2) {
  const [a, b] = [leuchtdichte(hex1), leuchtdichte(hex2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const verhaeltnis = (k) => (Math.round(k * 100) / 100).toFixed(2).replace('.', ',');
const istInhaltswelt = (n) => Number.isInteger(n) && n >= 0 && n <= 6;
const istText = (x, max) => typeof x === 'string' && x.trim() !== '' && x.length <= max;

/* ---------- Welt (Delta §2) ---------- */

/** Hook welt: Pflichtfelder der Inhaltswelten, Kontraste, archivfund, kapitel. */
function welt(data, f, w) {
  const nr = data.welt;
  const inhalt = istInhaltswelt(nr);
  if (data.farbe === undefined) f('datei', 'farbe', 'farbe fehlt (Pflicht).');
  else if (FARBE.test(String(data.farbe))) {
    const k = kontrast(data.farbe, PAPIER);
    if (k < MIN_KONTRAST) f('datei', 'farbe', `Kontrast der Weltfarbe zu Papier ${verhaeltnis(k)} : 1 – mindestens 4,5 : 1.`);
  }
  if (inhalt) {
    if (!istText(data.epoche, 80)) f('datei', 'epoche', data.epoche === undefined ? 'epoche fehlt.' : 'epoche muss Text mit 1–80 Zeichen sein.');
    const j = data.jahr;
    const jahrOk = istObjekt(j) && Number.isInteger(j.von) && Number.isInteger(j.bis) && j.von <= j.bis && istText(j.anzeige, 40);
    if (!jahrOk) f('datei', 'jahr', 'jahr braucht von ≤ bis (ganze Zahlen) und anzeige (1–40 Zeichen).');
    if (data.akzentHell === undefined) f('datei', 'akzentHell', 'akzentHell fehlt.');
  }
  if (data.akzentHell !== undefined) {
    if (!FARBE.test(String(data.akzentHell))) f('datei', 'akzentHell', 'akzentHell muss im Format #RRGGBB angegeben werden.');
    else
      for (const [name, hg] of [['Tinte', TINTE], ['Dunkelpapier', DUNKELPAPIER]]) {
        const k = kontrast(data.akzentHell, hg);
        if (k < MIN_KONTRAST) f('datei', 'akzentHell', `Kontrast von akzentHell zu ${name} ${verhaeltnis(k)} : 1 – mindestens 4,5 : 1.`);
      }
  }
  if (data.archivfund !== undefined) {
    const af = data.archivfund;
    if (!istObjekt(af)) f('datei', 'archivfund', 'archivfund muss ein Objekt { aufgabe, titel } sein.');
    else {
      const muster = new RegExp(`^W${Number.isInteger(nr) ? nr : '\\d'}-A-\\d{2}$`);
      const ids = Array.isArray(data.aufgaben) ? data.aufgaben.filter(istObjekt).map((a) => a.id) : [];
      if (typeof af.aufgabe !== 'string' || !muster.test(af.aufgabe)) f('datei', 'archivfund', `archivfund.aufgabe muss die Form W${nr}-A-<nn> haben.`);
      else if (!ids.includes(af.aufgabe)) f('datei', 'archivfund', `archivfund.aufgabe „${af.aufgabe}“ gibt es nicht.`);
      if (!istText(af.titel, 80)) f('datei', 'archivfund', 'archivfund.titel fehlt (1–80 Zeichen).');
    }
  } else if (inhalt) w('datei', 'archivfund', 'archivfund fehlt (Einstiegsrätsel der Welt empfohlen).');
  if (data.kapitel !== undefined) {
    const k = data.kapitel;
    if (!istObjekt(k) || !istText(k.titel, 80) || !istText(k.md, 1500)) f('datei', 'kapitel', 'kapitel braucht titel (1–80 Zeichen) und md (1–1500 Zeichen).');
  } else if (inhalt) w('datei', 'kapitel', 'kapitel fehlt.');
}

/* ---------- Level (Delta §3) ---------- */

const ROLLEN = ['kryptografie', 'kryptoanalyse'];
let videoCache;

/** Videoliste: opt.videos oder seed/videos.json ({ videos: [{ nr, titel, url }] }); null = keine Liste (Prüfung entfällt). */
function videoListe(opt) {
  if (opt && Array.isArray(opt.videos)) return opt.videos;
  if (videoCache === undefined) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'seed', 'videos.json'), 'utf8'));
      videoCache = Array.isArray(d && d.videos) ? d.videos : [];
    } catch {
      videoCache = null;
    }
  }
  return videoCache;
}

/** Effektives Niveau einer Level-Aufgabe (TECHNIK §8.1). */
const effektivesNiveau = (a, l) => (istObjekt(a) && a.niveau !== undefined ? a.niveau : l.niveau);

/** Hook level: niveau, rolle, kuer, werkzeug, video, akte und die Niveau-Regeln Level ↔ Aufgabe. */
function level(l, o, f, w, { aufgaben, opt }) {
  const fl = (m) => f('level', o, m);
  const wl = (m) => w('level', o, m);
  if (l.niveau === undefined) fl('niveau fehlt (kern | eA | ergaenzung | kuer).');
  if (!ROLLEN.includes(l.rolle)) fl('rolle muss kryptografie oder kryptoanalyse sein.');
  if (l.kuer !== undefined && typeof l.kuer !== 'boolean') fl('kuer muss true oder false sein.');
  if ((l.kuer === true) !== (l.niveau === 'kuer')) fl('kuer: true verlangt niveau kuer und umgekehrt.');
  if (l.werkzeug !== undefined) {
    const liste = Array.isArray(l.werkzeug) ? l.werkzeug : [l.werkzeug];
    if (!liste.length || liste.length > 3) fl('werkzeug muss eine Werkzeug-id oder eine Liste mit 1–3 ids sein.');
    for (const id of liste) if (!WERKZEUG_IDS.includes(id)) fl(`werkzeug „${id}“ ist unbekannt (${WERKZEUG_IDS.join(' | ')}).`);
  }
  if (l.video !== undefined) {
    const v = l.video;
    if (!istObjekt(v) || !Number.isInteger(v.nr) || v.nr < 0 || v.nr > 7 || !istText(v.titel, 200)) fl('video braucht nr 0–7 und titel.');
    else {
      const liste = videoListe(opt);
      // Eintrag zählt auch mit url null (Videos sind bis zur Veröffentlichung nicht öffentlich, Plan M5 E51)
      if (liste && !liste.some((x) => istObjekt(x) && x.nr === v.nr)) wl(`video.nr ${v.nr} fehlt in seed/videos.json.`);
    }
  }
  if (Array.isArray(l.intro) && l.intro.some((b) => istObjekt(b) && typeof b.md === 'string' && DIE_LERNENDEN.test(b.md))) wl(DUZEN);
  // Akte (ersetzt ab, Delta §3); Gast-Demo (Welt 8) und Fixture (Welt 9) haben keine Akten (Plan M5 E59)
  const m = /^W(\d)-L(\d{1,2})/.exec(typeof l.id === 'string' ? l.id : '');
  const ohneAkten = m && Number(m[1]) >= 8;
  if (l.akte === undefined) {
    if (typeof l.ab === 'string' && l.ab.trim()) wl('bitte `akte` verwenden (ab ist veraltet).');
    else if (!ohneAkten) wl('akte fehlt.');
  } else {
    // Kür-Level: „Akte W2·K1“ (k aus nr), sonst „Akte W<n>·<k>“
    const kuerNr = l.kuer === true && typeof l.nr === 'string' && /^K\d+$/.test(l.nr) ? l.nr : null;
    const praefix = m ? `Akte W${m[1]}·${kuerNr || m[2]}` : 'Akte W';
    if (typeof l.akte !== 'string' || !l.akte.startsWith(praefix)) wl(`akte muss mit „${praefix}“ beginnen.`);
  }
  // Kryptoanalyse-Level: Werkzeug-Voreinstellung darf den Schlüssel nicht verraten (Delta §7.7)
  if (l.rolle === 'kryptoanalyse' && Array.isArray(l.aufgaben) && aufgaben instanceof Map) {
    for (const id of l.aufgaben) {
      const a = aufgaben.get(id);
      if (!istObjekt(a)) continue;
      for (const b of alleBloecke(a)) {
        if (b.t === 'werkzeug' && istObjekt(b.voreinstellung) && (Object.hasOwn(b.voreinstellung, 'schluessel') || Object.hasOwn(b.voreinstellung, 'k'))) {
          wl(`${id}: Voreinstellung verrät den Schlüssel (werkzeug „${b.id}“ in einem Kryptoanalyse-Level).`);
        }
      }
    }
  }
  // Niveau-Regeln Level ↔ Aufgabe (Delta §3)
  if (!NIVEAU_IDS.includes(l.niveau) || !Array.isArray(l.aufgaben) || !(aufgaben instanceof Map)) return;
  const liste = l.aufgaben.filter((id) => aufgaben.has(id)).map((id) => [id, effektivesNiveau(aufgaben.get(id), l)]);
  for (const [id, n] of liste) {
    if (l.niveau === 'ergaenzung' && (n === 'kern' || n === 'eA')) fl(`Level-Niveau ergaenzung erlaubt keine Aufgabe mit Niveau ${n} (${id}).`);
    if (l.niveau === 'kuer' && n !== 'kuer') fl(`Level-Niveau kuer erlaubt nur kuer-Aufgaben (${id}: ${n}).`);
    if (l.niveau === 'eA' && n === 'kern') wl(`Aufgabe ${id} (kern) ist im gA-Kurs unsichtbar, da das Level ausgeblendet ist.`);
  }
  if (l.niveau === 'kern' && liste.length && liste.every(([, n]) => n === 'eA')) fl(`Level ${l.id} wäre im gA-Kurs leer (nur eA-Aufgaben).`);
}

/* ---------- Boss (Delta §10) ---------- */

const BOSS_NIVEAUS = ['kern', 'eA'];
const STANDARD_MIX = { 1: 3, 2: 3, 3: 2 };

/** Hook boss: Niveau je Pool-Aufgabe, verbotene Bestandteile, gA-Pool, fremde Chiffren, Standardwerte. */
function boss(b, f, w, { data, aufgaben }) {
  const fb = (m, aid) => f('boss', aid ? `boss › ${aid}` : 'boss', m, aid);
  const wb = (m) => w('boss', 'boss', m);
  if (b.niveau !== undefined) wb('boss.niveau ist entfallen – Niveau je Aufgabe (Pool-Aufgaben tragen niveau kern oder eA).');
  // Rahmentext (Plan M5 E52): optional, Mini-Markdown, höchstens 800 Zeichen; in den Inhaltswelten erwartet
  if (b.rahmen !== undefined) {
    if (typeof b.rahmen !== 'string' || !b.rahmen.trim()) fb('rahmen muss ein Text sein (Mini-Markdown).');
    else if (b.rahmen.length > 800) fb(`rahmen: höchstens 800 Zeichen (gefunden: ${b.rahmen.length}).`);
  } else if (istInhaltswelt(data.welt)) wb('rahmen fehlt (Rahmentext der Specs §5, geduzt).');
  const pool = (Array.isArray(b.pool) ? b.pool : []).filter((id) => aufgaben instanceof Map && istObjekt(aufgaben.get(id))).map((id) => aufgaben.get(id));
  for (const a of pool) {
    const aid = a.id;
    if (a.niveau === undefined) fb('niveau fehlt (Boss-Aufgaben: kern | eA).', aid);
    else if (!BOSS_NIVEAUS.includes(a.niveau)) fb(`niveau ${a.niveau} ist im Boss nicht erlaubt (nur kern | eA).`, aid);
    if (alleBloecke(a, { erklaerung: false }).some((x) => x.t === 'werkzeug')) fb('Block werkzeug ist in Boss-Aufgaben nicht erlaubt.', aid);
    for (const { interaktion: ia } of F.teile(a)) {
      if (!istObjekt(ia)) continue;
      if (ia.kind === 'zuordnung' && ia.haeufigkeit === true) fb('zuordnung mit haeufigkeit: true ist in Boss-Aufgaben nicht erlaubt.', aid);
      const v = F.interaktionVertrag(ia.kind);
      if (v && istObjekt(v.boss) && v.boss.erlaubt === false) fb(`Interaktion „${ia.kind}“ ist in Boss-Aufgaben nicht erlaubt.`, aid);
    }
  }
  // gA-Pool (nur kern) und fremde Chiffren
  const gA = pool.filter((a) => a.niveau === 'kern');
  if (Number.isInteger(b.anzahl) && gA.length < b.anzahl) fb(`gA-Pool (nur kern) hat ${gA.length} Aufgaben, anzahl ist ${b.anzahl}.`);
  const fremd = pool.filter((a) => a.kategorie === 'fremde-chiffre');
  if (fremd.length < 3) fb(`Mindestens 3 Pool-Aufgaben mit kategorie fremde-chiffre nötig (gefunden: ${fremd.length}).`);
  else if (fremd.filter((a) => a.niveau === 'kern').length < 2) fb(`Von den Aufgaben mit kategorie fremde-chiffre müssen mindestens 2 niveau kern haben (gefunden: ${fremd.filter((a) => a.niveau === 'kern').length}).`);
  if (istObjekt(b.mix)) {
    for (const [st, n] of Object.entries(b.mix)) {
      const da = gA.filter((a) => String(a.stufe) === st).length;
      if (Number.isInteger(n) && da < n) wb(`gA-Pool: Mix nicht je Stufe erfüllbar – Stufe ${st} verlangt ${n}, im gA-Pool ${da}.`);
    }
  }
  // Standardwerte der Inhaltswelten (Hinweise)
  if (!istInhaltswelt(data.welt)) return;
  const n = Array.isArray(b.pool) ? b.pool.length : 0;
  if (n < 14 || n > 16) wb(`Pool hat ${n} Aufgaben (Standard 14–16).`);
  if (b.anzahl !== 8) wb(`anzahl ${b.anzahl} weicht vom Standard 8 ab.`);
  const mix = istObjekt(b.mix) ? b.mix : {};
  if (!['1', '2', '3'].every((st) => mix[st] === STANDARD_MIX[st]) || Object.keys(mix).length !== 3) {
    wb(`mix ${['1', '2', '3'].map((st) => mix[st] ?? 0).join('/')} weicht vom Standard 3/3/2 ab.`);
  }
  const dauer = data.welt === 6 ? 30 : 25;
  if (b.dauerMin !== dauer) wb(`dauerMin ${b.dauerMin} weicht vom Standard ${dauer} ab.`);
}

/* ---------- Dateiübergreifend (Delta §2, §11) ---------- */

/** Hook dateien: Zeitleiste aufsteigend, Abdeckung fremde Chiffre je Inhaltswelt (Hinweise). */
function dateien(eintraege, ergebnisse) {
  const hinweis = (i, meldung) => ergebnisse[i].warnungen.push({ datei: ergebnisse[i].datei, ebene: 'datei', ort: '', meldung, aufgabe: null });
  const welten = eintraege
    .map((e, i) => ({ i, d: e && e.data }))
    .filter(({ i, d }) => ergebnisse[i] && istObjekt(d) && istInhaltswelt(d.welt))
    .sort((x, y) => x.d.welt - y.d.welt);
  let vorher = null;
  for (const x of welten) {
    const von = istObjekt(x.d.jahr) && Number.isInteger(x.d.jahr.von) ? x.d.jahr.von : null;
    if (von === null) continue;
    if (vorher && von < vorher.von) hinweis(x.i, `Zeitleiste nicht aufsteigend: Welt ${x.d.welt} beginnt (${von}) vor Welt ${vorher.welt} (${vorher.von}).`);
    vorher = { welt: x.d.welt, von };
  }
  for (const x of welten) {
    const auf = Array.isArray(x.d.aufgaben) ? x.d.aufgaben.filter(istObjekt) : [];
    if (!auf.some((a) => a.kategorie === 'fremde-chiffre' && typeof a.id === 'string' && !ARCHIVFUND.test(a.id))) {
      hinweis(x.i, `Abdeckung fremde Chiffre: Welt ${x.d.welt} hat keine Level- oder Boss-Aufgabe mit kategorie fremde-chiffre (Design §1).`);
    }
  }
}

/** Hooks für registriereValidierung (TECHNIK §4.2). */
const HOOKS = Object.freeze({ welt, level, aufgabe, boss, dateien });

module.exports = { HOOKS, aufgabe, welt, level, boss, dateien, kontrast, PAPIER, TINTE, DUNKELPAPIER };
