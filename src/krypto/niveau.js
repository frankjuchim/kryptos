'use strict';
// Niveau gA/eA (TECHNIK §8): Sichtbarkeit, Rangrelevanz, Boss-Pool, Bezug der Boss-Freischaltung, Generatoren.
// Effektives Niveau einer Aufgabe = a._niveau (Spalte aufgaben.niveau: a.niveau ?? level.niveau ?? 'kern'),
// Level und rohe Objekte: x.niveau, Standard 'kern'. einst = Kurs-Einstellungen { niveau: 'eA'|'gA', kuer: 'frei'|'gesperrt' }.

/** Effektives Niveau (Katalog-Aufgabe: _niveau, sonst niveau, Standard kern). */
function niveauVon(x) {
  return (x && (x._niveau ?? x.niveau)) || 'kern';
}

const gAKurs = (einst) => !!einst && einst.niveau === 'gA';
const kuerGesperrt = (einst) => !!einst && einst.kuer === 'gesperrt';

/** §8.1: kern/ergaenzung immer; eA nur außerhalb des gA-Kurses; kuer nur, wenn die Kür nicht gesperrt ist. */
function sichtbar(x, einst) {
  const n = niveauVon(x);
  if (n === 'eA') return !gAKurs(einst);
  if (n === 'kuer') return !kuerGesperrt(einst);
  return true;
}

/** Level sichtbar ⇔ selbst sichtbar und mindestens eine sichtbare Aufgabe (aufgabeVon: id → Aufgabe). */
function levelSichtbar(level, einst, aufgabeVon) {
  if (!level || !sichtbar(level, einst)) return false;
  return (Array.isArray(level.aufgaben) ? level.aufgaben : []).some((id) => {
    const a = aufgabeVon(id);
    return !!a && sichtbar(a, einst);
  });
}

/**
 * Rangrelevanz (Rang, anteil, Kursübersicht): nach labs-Vertrag v1.2 §6/§9 = sichtbar (Ergänzung und Kür zählen mit).
 * Eigene Funktion als Erweiterungsstelle für Vorschlag V2 „nur Kern/eA“ (docs/VERTRAG_VORSCHLAEGE.md, TECHNIK §8.1).
 */
function rangrelevant(a, einst) {
  return sichtbar(a, einst);
}

/** Boss-Ziehung (Delta §10): gA-Kurs nur kern, sonst kern + eA. */
function bossPool(aufgaben, einst) {
  return (aufgaben || []).filter((a) => {
    const n = niveauVon(a);
    return n === 'kern' || (n === 'eA' && !gAKurs(einst));
  });
}

/**
 * Bezugsmenge der Boss-Freischaltung (60 %) und des Abzeichens „Welt gemeistert“ (plattformintern, TECHNIK §8.2):
 * kern, im eA-Kurs zusätzlich eA – ohne Ergänzung und Kür, unabhängig von der Vertragsversion.
 */
function bossBezug(a, einst) {
  const n = niveauVon(a);
  return n === 'kern' || (n === 'eA' && !gAKurs(einst));
}

/** Trainingsplatz (§8.2): eA-Generatoren nur außerhalb des gA-Kurses, Kür nach Einstellung, sonst (kern, ergaenzung) immer. */
function generatorSichtbar(gen, einst) {
  const n = (gen && gen.niveau) || 'kern';
  if (n === 'eA') return !gAKurs(einst);
  if (n === 'kuer') return !kuerGesperrt(einst);
  return true;
}

module.exports = { niveauVon, sichtbar, levelSichtbar, rangrelevant, bossPool, bossBezug, generatorSichtbar };
