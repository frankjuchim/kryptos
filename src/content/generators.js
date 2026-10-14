'use strict';
// Generatoren für den Trainingsplatz: deterministisch aus einem Seed, Ausgabe im Aufgabenformat. Der Kern stellt nur
// den Rahmen (Zufall, Registry, Erzeugung); die Generatoren selbst registriert die Plattform
// (Kryptos: src/krypto/generatoren/, TECHNIK §2.4). Niveau je Generator für die Sichtbarkeit (TECHNIK §8.2).

/* ---------- Zufall (deterministisch) ---------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function zufall(seed) {
  const r = mulberry32(seed);
  const z = {
    r,
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    bool: (p = 0.5) => r() < p,
    mische(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    verschiedene(n, lo, hi) {
      const s = new Set();
      while (s.size < n) s.add(z.int(lo, hi));
      return [...s];
    }
  };
  return z;
}

/* ---------- Registry ---------- */

const NIVEAUS = ['kern', 'eA', 'ergaenzung', 'kuer'];
const KEY = /^[a-z0-9_]+$/;

/** Registry-Objekt key → { titel, welten, niveau, make(z) } (Registrierungsreihenfolge). */
const GENERATOREN = {};

/**
 * Generator eintragen. make(z) erhält das Zufallsobjekt (zufall(seed)) und liefert eine Aufgabe ohne id
 * (stufe darf gesetzt werden). Doppelte Registrierung wirft (Startabbruch, TECHNIK §4.1).
 */
function registriereGenerator(key, { titel, welten, niveau = 'kern', make } = {}) {
  if (typeof key !== 'string' || !KEY.test(key)) throw new Error(`Generator-Schlüssel „${key}“ ist ungültig (a–z, 0–9, _).`);
  if (Object.prototype.hasOwnProperty.call(GENERATOREN, key)) throw new Error(`Generator „${key}“ ist bereits registriert.`);
  if (typeof titel !== 'string' || !titel.trim()) throw new Error(`Generator „${key}“: titel fehlt.`);
  if (!Array.isArray(welten) || !welten.length || !welten.every(Number.isInteger)) throw new Error(`Generator „${key}“: welten muss eine Liste ganzer Zahlen sein.`);
  if (!NIVEAUS.includes(niveau)) throw new Error(`Generator „${key}“: niveau muss ${NIVEAUS.join(' | ')} sein.`);
  if (typeof make !== 'function') throw new Error(`Generator „${key}“: make fehlt.`);
  GENERATOREN[key] = { titel, welten: [...welten], niveau, make };
}

/** Generatoren einer Welt [{ key, titel, niveau }]; sichtbar(gen) filtert (z. B. nach Kursniveau). */
function generatorenFuerWelt(welt, { sichtbar } = {}) {
  return Object.entries(GENERATOREN)
    .filter(([, g]) => g.welten.includes(welt))
    .map(([key, g]) => ({ key, titel: g.titel, niveau: g.niveau }))
    .filter((g) => (typeof sichtbar === 'function' ? sichtbar(g) !== false : true));
}

/** Aufgabe erzeugen (deterministisch). Punkte: immer 1 (Trainingsplatz). niveau = Niveau des Generators (Kryptos K44). */
function erzeuge(key, seed) {
  const g = GENERATOREN[key];
  if (!g) throw new Error(`Unbekannter Generator „${key}“.`);
  const s = seed >>> 0;
  return { id: `T-${key}-${s}`, stufe: 1, punkte: 1, tipps: [], niveau: g.niveau, ...g.make(zufall(s)) };
}

module.exports = { GENERATOREN, NIVEAUS, registriereGenerator, generatorenFuerWelt, erzeuge, mulberry32, zufall };
