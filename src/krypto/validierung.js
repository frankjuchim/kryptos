'use strict';
// Krypto-Zusatzprüfungen für den Validator (Hooks nach TECHNIK §4.2, registriert in src/krypto/index.js).
// Welt- und Level-Felder (Delta §2, §3), Kontraste (WCAG 2.1), loesung._fehlmuster in gaps-Teilen (Delta §9.6);
// Task 31 ergänzt Aufgaben-, Boss- und Dateiregeln (Delta §4, §10, §11).

const fs = require('node:fs');
const path = require('node:path');
const C = require('../content/checker');
const F = require('../content/format');
const { FALLEN_IDS, NIVEAU_IDS } = require('../domain');
const { WERKZEUG_IDS } = require('./werkzeuge');

const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const CODE = /^[a-z_]{1,30}$/;

/** _fehlmuster eines gaps-Teils: { feld: [{ wert, p, code }, …] } (1–5 je Feld), nie gleich einer akzeptierten Lösung. */
function pruefeFehlmuster(ia, lo, lort, fa) {
  const fm = lo._fehlmuster;
  const o = `${lort}._fehlmuster`;
  if (!istObjekt(fm)) return fa(o, '_fehlmuster muss ein Objekt { feld: [ … ] } sein.');
  const felder = istObjekt(ia.felder) ? ia.felder : {};
  for (const [id, liste] of Object.entries(fm)) {
    if (!(id in felder)) {
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

/** Hook aufgabe: je gaps-Teil mit _fehlmuster. */
function aufgabe(a, fa) {
  F.teile(a).forEach((t, i, alle) => {
    const ia = t.interaktion;
    const lo = t.loesung;
    if (!istObjekt(ia) || ia.kind !== 'gaps' || !istObjekt(lo) || lo._fehlmuster === undefined) return;
    pruefeFehlmuster(ia, lo, alle.length > 1 ? `loesung[${i}]` : 'loesung', fa);
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
      if (liste && !liste.some((x) => istObjekt(x) && x.nr === v.nr && typeof x.url === 'string' && x.url.trim())) {
        wl(`video.nr ${v.nr} hat noch keinen Eintrag in seed/videos.json.`);
      }
    }
  }
  // Akte (ersetzt ab, Delta §3)
  if (l.akte === undefined) wl(typeof l.ab === 'string' && l.ab.trim() ? 'bitte `akte` verwenden (ab ist veraltet).' : 'akte fehlt.');
  else {
    const m = /^W(\d)-L(\d{1,2})/.exec(typeof l.id === 'string' ? l.id : '');
    const praefix = m ? `Akte W${m[1]}·${m[2]}` : 'Akte W';
    if (typeof l.akte !== 'string' || !l.akte.startsWith(praefix)) wl(`akte muss mit „${praefix}“ beginnen.`);
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

/** Hooks für registriereValidierung (TECHNIK §4.2). */
const HOOKS = Object.freeze({ welt, level, aufgabe });

module.exports = { HOOKS, aufgabe, welt, level, kontrast, PAPIER, TINTE, DUNKELPAPIER };
