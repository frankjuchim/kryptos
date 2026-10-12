'use strict';
// Plattform-Manifest nach dem Verbundvertrag (VERTRAG §7, TECHNIK §6.9): öffentlich unter GET /api/plattform.
// Das Portal liest es, um Plattformen zu verlinken, ihren Stand anzuzeigen und die Vertragsversion zu prüfen.
// vertrag = VERTRAG_VERSION (Standard 1.1); umfang/welten werden aus dem Katalog berechnet (nie fest eingetragen).
// Ab v1.2 zusätzlich „niveaus“. Das Manifest enthält nie Kurs-, Schüler- oder Lösungsdaten.

const { PLATTFORM } = require('../domain');

const BESCHREIBUNG =
  'Eine Zeitreise durch 2500 Jahre Geheimschriften: von der Skytale über Vigenère und das One-Time-Pad bis zu Signaturen und Zertifikaten – mit automatisch geprüften Aufgaben im Abitur-Stil, Kryptolabor, Live-Szenarien im Funkraum, Knack-Arena, Bossen und Warm-up-Karten.';
const FAEHIGKEITEN = ['gast', 'themen', 'lehrkraft-materialien', 'boss', 'training', 'warmup', 'scoreboard', 'beamer', 'urkunden', 'fallen-profil', 'labor', 'funkraum', 'arena', 'niveau'];

/** Archivfund-Aufgaben (W<n>-A-<nn>, 0 Punkte) zählen im Umfang nicht (TECHNIK §6.9). */
const istArchivfund = (a) => !!a && (a.archivfund === true || a.archivfund === 1 || /^W\d+-A-\d+$/.test(a.id || ''));

/**
 * @param {{inhalte: object, version: string, konfig: object}} opt  konfig aus src/verbund/konfig.js (ladeKonfig)
 */
function createManifest({ inhalte, version, konfig }) {
  return function manifest(basis) {
    const kat = inhalte.katalog;
    const welten = [...kat.welten.values()].sort((a, b) => a.nr - b.nr);
    const zaehle = (ids) => ids.filter((id) => !istArchivfund(kat.aufgaben.get(id) || { id })).length;
    const m = {
      vertrag: konfig.vertragVersion || '1.1',
      id: konfig.plattformId || PLATTFORM.id,
      name: PLATTFORM.name,
      titel: PLATTFORM.titel,
      themenfeld: PLATTFORM.themenfeld,
      kurs: PLATTFORM.kurs,
      beschreibung: BESCHREIBUNG,
      farbe: PLATTFORM.farbe,
      version,
      basis: konfig.plattformUrl || basis,
      icon: '/static/favicon.svg',
      urls: {
        start: '/',
        gast: '/gast',
        themen: '/themen',
        lehrkraft: '/lehrer',
        datenschutz: '/datenschutz',
        healthz: '/healthz',
        ssoStart: '/sso/start',
        ssoEnde: '/sso/ende'
      },
      // Kryptos kennt nur die Anmeldung über das Portal (AUTH_MODUS=portal, TECHNIK §6.1)
      auth: { modus: 'portal', portal: konfig.portalUrl, sso: true },
      umfang: {
        welten: welten.length,
        level: welten.reduce((s, w) => s + w.levels.length, 0),
        aufgaben: welten.reduce((s, w) => s + w.levels.reduce((x, l) => x + zaehle(l.aufgaben), 0) + (w.boss ? zaehle(w.boss.pool) : 0), 0),
        bosse: welten.filter((w) => w.boss).length
      },
      welten: welten.map((w) => ({ nr: w.nr, titel: w.titel, farbe: w.farbe, level: w.levels.length })),
      faehigkeiten: [...FAEHIGKEITEN]
    };
    if (m.vertrag === '1.2') m.niveaus = ['eA', 'gA'];
    return m;
  };
}

module.exports = { createManifest, FAEHIGKEITEN };
