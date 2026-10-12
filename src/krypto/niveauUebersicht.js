'use strict';
// Niveau-Übersicht „Was ist für welches Niveau?“ (VERTRAG labs v1.2 §9, Manifest urls.niveaus = /themen#niveaus):
// welche Welten, Level, Lab-Aufgaben, Bosse und Akten für gA (Grundkurs) und eA (Leistungskurs) gedacht sind.
// Öffentlich (GET /api/niveaus, ohne Anmeldung) – deshalb nur Titel, Niveaus und Anzahlen: keine Aufgabentexte,
// Lösungen, Kurs- oder Schülerdaten. Quelle je Welt: der Katalog (Seed, ab M5), solange die Welt dort fehlt der Plan
// aus src/krypto/fach.js (WELT_PLAN, Design §5.1 + Welt-Specs).

const { WELTEN, NIVEAU_KATEGORIEN, WELT_PLAN } = require('./fach');

const NIVEAU_IDS = NIVEAU_KATEGORIEN.map((n) => n.id);
/** Kern-Werte des übernommenen Formats (alle/plus) bis zur Umstellung in M3 (Task 23) auf Kryptos-Niveaus abbilden. */
const ALT = { alle: 'kern', plus: 'kuer' };
const niveauAus = (wert, rueckfall = 'kern') => {
  const v = ALT[wert] || wert;
  return NIVEAU_IDS.includes(v) ? v : rueckfall;
};

/** Archivfund-Aufgaben (W<n>-A-<nn>, 0 Punkte) zählen nicht (wie im Manifest, TECHNIK §6.9). */
const istArchivfund = (a) => !!a && (a.archivfund === true || a.archivfund === 1 || /^W\d+-A-\d+$/.test(a.id || ''));

/** { kern: n, … } in fester Reihenfolge, nur Niveaus mit Anzahl > 0 */
function zaehlung(werte) {
  const z = {};
  for (const id of NIVEAU_IDS) if (werte[id]) z[id] = werte[id];
  return z;
}

/** Plan-Welt → Ausgabeformat */
function ausPlan(plan) {
  return {
    quelle: 'plan',
    levels: plan.levels.map((l) => ({
      id: l.id,
      titel: l.titel,
      niveau: l.niveau,
      aufgaben: zaehlung(l.aufgaben),
      hinweis: l.aufgabenHinweis || null,
      akte: l.akte ? { name: 'Akte ' + l.akte, niveau: l.niveau, hinweis: l.akteHinweis || null } : null
    })),
    boss: plan.boss ? { titel: plan.boss.titel, pool: zaehlung(plan.boss.pool) } : null
  };
}

/** Katalog-Welt (Seed) → Ausgabeformat; Akten-Hinweise kommen dann aus dem Plan, sofern die Level-Nummer passt. */
function ausKatalog(w, kat, plan) {
  const aufgabe = (id) => kat.aufgaben.get(id) || { id };
  const planLevel = new Map((plan ? plan.levels : []).map((l) => [l.id, l]));
  return {
    quelle: 'katalog',
    levels: w.levels.map((l) => {
      const niveau = niveauAus(l.niveau);
      const werte = {};
      for (const id of l.aufgaben) {
        const a = aufgabe(id);
        if (istArchivfund(a)) continue;
        const n = niveauAus(a._niveau || a.niveau, niveau);
        werte[n] = (werte[n] || 0) + 1;
      }
      const nr = String(l.nr || l.id);
      const p = planLevel.get(nr);
      const akte = l.akte || (p && p.akte) || null;
      return {
        id: nr,
        titel: l.titel,
        niveau,
        aufgaben: zaehlung(werte),
        hinweis: null,
        akte: akte ? { name: 'Akte ' + String(akte).replace(/^Akte\s+/i, ''), niveau, hinweis: (p && p.akteHinweis) || null } : null
      };
    }),
    boss: w.boss
      ? {
          titel: w.boss.titel,
          pool: zaehlung(
            w.boss.pool.reduce((z, id) => {
              const a = aufgabe(id);
              if (!istArchivfund(a)) {
                const n = niveauAus(a._niveau || a.niveau);
                z[n] = (z[n] || 0) + 1;
              }
              return z;
            }, {})
          )
        }
      : null
  };
}

/**
 * @param {{ inhalte: { katalog: object } }} deps
 * @returns {{ uebersicht: () => object }}
 */
function createNiveauUebersicht({ inhalte }) {
  function uebersicht() {
    const kat = inhalte.katalog;
    const welten = WELTEN.map((std) => {
      const plan = WELT_PLAN.find((p) => p.nr === std.nr) || null;
      const kw = kat && kat.welten ? kat.welten.get(std.nr) : null;
      const teil = kw && kw.levels && kw.levels.length ? ausKatalog(kw, kat, plan) : plan ? ausPlan(plan) : { quelle: 'plan', levels: [], boss: null };
      return { nr: std.nr, titel: (kw && kw.titel) || std.titel, epoche: std.epoche, farbe: (kw && kw.farbe) || std.farbe, ...teil };
    });
    return {
      niveaus: ['eA', 'gA'],
      kategorien: NIVEAU_KATEGORIEN.map((k) => ({ ...k })),
      welten,
      weitere: [
        { titel: 'Online-Bosse', text: 'Der Online-Boss zieht im gA-Kurs nur Kern-Aufgaben, im eA-Kurs Kern- und eA-Aufgaben. Ergänzung und Kür kommen in keinem Online-Boss vor.' },
        { titel: 'Akten (Arbeitsblätter)', text: 'Jede Akte trägt im Kopf das Niveau ihres Levels; einzelne eA- oder Ergänzungsaufträge in Kern-Akten sind im Auftrag gekennzeichnet.' },
        { titel: 'Papier-Bosse', text: 'Für gA und eA; RSA- und Diffie-Hellman-Rechnungen kommen nie vor, höchstens das Prinzip mit Material.' },
        { titel: 'Probeklausur und Klausur (Lehrkraft)', text: 'Je eine Fassung für eA und für gA: die gA-Probeklausur ist stärker vorstrukturiert, die gA-Klausuren enthalten dieselben Aufgaben ohne eA-Teile.' },
        { titel: 'Trainingsplatz', text: 'Generatoren zu eA-Inhalten (KRYPTOS-16) gibt es nur im eA-Kurs; Generatoren zu Ergänzungen (Diffie-Hellman, RSA) stehen beiden Niveaus offen.' },
        { titel: 'Chiffren-Werkstatt und Knack-Arena', text: 'Gehören zu Level 3.3 und damit nur zum eA-Kurs.' },
        { titel: 'Kursniveau', text: 'Die Lehrkraft stellt je Kurs gA oder eA ein. Im gA-Kurs sind eA-Level und eA-Aufgaben ausgeblendet; Ergänzungen bleiben freiwillig sichtbar, die Kür kann die Lehrkraft sperren.' }
      ]
    };
  }
  return { uebersicht };
}

module.exports = { createNiveauUebersicht, niveauAus };
