'use strict';
// Fachliche Konstanten (SPEC_AlgoLab §2–§8): Welten, Kategorien, Fallen, Ränge, Abzeichen-Grundlagen.
// Kryptos: Listen aus src/krypto/fach.js, Kern-Namen und Kern-Form bleiben (TECHNIK §2.1, Naht-Regel).

const FACH = require('./krypto/fach');

/** Plattformdaten (Kryptos, Design §2.1). */
const PLATTFORM = FACH.PLATTFORM;

/** Standardwerte je Welt (werden von den Welt-Dateien überschrieben, falls dort titel/farbe gesetzt sind). */
const WELTEN = FACH.WELTEN;
const WELT_MAP = Object.fromEntries(WELTEN.map((w) => [w.nr, w]));

/** LAB_KATEGORIEN (Slugs, Design §3.4) – Anzeigenamen in LAB_KATEGORIE_NAMEN. */
const LAB_KATEGORIEN = FACH.LAB_KATEGORIEN;
const LAB_KATEGORIE_NAMEN = FACH.LAB_KATEGORIE_NAMEN;

/** Kategorien der Warm-up-Karten = dieselbe Liste (AUFGABENFORMAT_KRYPTO §4.2). */
const KATA_KATEGORIEN = [...LAB_KATEGORIEN];

/** Fallen P1–P10 (Design §3.3) in der Kern-Form [{ p, titel, text }]. */
const FALLEN = Object.entries(FACH.FALLEN).map(([p, f]) => ({ p, titel: f.titel, text: f.text }));
const FALLEN_IDS = FALLEN.map((f) => f.p);

/** Ränge: Anteil der erreichbaren Level-Punkte aller freigeschalteten Welten (Design §2.4). */
const RAENGE = FACH.RAENGE;

/** Teamnamen (feste Liste, TECHNIK §12.2). */
const TEAM_NAMEN = FACH.TEAM_NAMEN;

function rangFuer(anteil) {
  let idx = 0;
  for (let i = 0; i < RAENGE.length; i++) if (anteil >= RAENGE[i].ab - 1e-9) idx = i;
  const next = RAENGE[idx + 1] || null;
  return {
    name: RAENGE[idx].name,
    index: idx,
    anteil,
    naechster: next ? { name: next.name, ab: next.ab } : null
  };
}

/** Standardpunkte je Stufe. */
const STUFEN_PUNKTE = { 1: 10, 2: 20, 3: 30 };

/** Punkteformel (SPEC §5): beim ersten Lösen. */
function punkteFuer(punkte, fehlversuche, tipps) {
  const faktor = Math.max(0.25, 1 - 0.25 * fehlversuche - 0.2 * tipps);
  return Math.round(punkte * faktor);
}

/** Kurseinstellungen (Standard). */
const STANDARD_EINSTELLUNGEN = {
  welten: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // alle (auch spätere Zusatzwelten)
  boss: 'auto', // auto | gesperrt | offen
  scoreboard: true,
  beamer: false,
  anmeldung: true,
  kursart: 'eA' // 'eA' Leistungskurs · 'gA' Grundkurs (Hinweise zum Niveau, Boss-Ziehung)
};

/**
 * Niveau nach KC 2017 (Lernfeld Algorithmen und Datenstrukturen): „alle“ = Grund- und Leistungskurs,
 * „eA“ = Spalte „Erweiterung eA“ (nur Leistungskurs), „plus“ = über das Kerncurriculum hinaus.
 */
const NIVEAUS = {
  alle: { kurz: 'GK + LK', lang: 'Grund- und Leistungskurs (gA und eA)' },
  eA: { kurz: 'nur LK', lang: 'nur Leistungskurs (eA)' },
  plus: { kurz: 'Zusatz', lang: 'über das Kerncurriculum hinaus' }
};
const NIVEAU_IDS = Object.keys(NIVEAUS);

const BOSS_AUTO_ANTEIL = 0.6;
const BOSS_BESIEGT_ANTEIL = 0.5;
const BOSS_SPERRE_MS = 12 * 3600 * 1000;
const BOSS_KULANZ_MS = 30 * 1000;
const TRAINING_MAX_PUNKTE_TAG = 30;

/** Leitner: Wartezeit in Tagen je Fach (1..5). */
const LEITNER_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

module.exports = {
  PLATTFORM,
  WELTEN,
  WELT_MAP,
  LAB_KATEGORIEN,
  LAB_KATEGORIE_NAMEN,
  KATA_KATEGORIEN,
  FALLEN,
  FALLEN_IDS,
  RAENGE,
  rangFuer,
  TEAM_NAMEN,
  STUFEN_PUNKTE,
  punkteFuer,
  STANDARD_EINSTELLUNGEN,
  NIVEAUS,
  NIVEAU_IDS,
  BOSS_AUTO_ANTEIL,
  BOSS_BESIEGT_ANTEIL,
  BOSS_SPERRE_MS,
  BOSS_KULANZ_MS,
  TRAINING_MAX_PUNKTE_TAG,
  LEITNER_INTERVAL_DAYS
};
