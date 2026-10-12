'use strict';
// Plattform-Manifest nach dem Verbundvertrag (VERTRAG.md v1.2 im Repo frankjuchim/labs, §7): öffentlich unter
// GET /api/plattform.
// Das Portal liest es, um Plattformen zu verlinken, ihren Stand anzuzeigen und die Vertragsversion zu prüfen.

const VERTRAG = '1.2';
const PLATTFORM = {
  id: 'algoquest',
  name: 'Algo Quest',
  titel: 'Algo Quest – Das Dungeon der Datenstrukturen',
  themenfeld: 'Algorithmik und Datenstrukturen',
  kurs: 'Informatik eA und gA, Niedersachsen, Abitur ab 2027',
  // Anforderungsniveaus (ab v1.2): für Leistungs- und Grundkurs; Übersicht unter urls.niveaus
  niveaus: ['eA', 'gA'],
  beschreibung: 'Übungsplattform mit automatisch geprüften Aufgaben im Abitur-Stil: Java-Grundlagen, Klassen, Suchen und Sortieren, Rekursion, Stapel und Schlange, Bäume – mit Bossen, Trainingsplatz und Warm-up-Karten.',
  farbe: '#1F4E79'
};
const FAEHIGKEITEN = ['gast', 'themen', 'lehrkraft-materialien', 'boss', 'training', 'warmup', 'scoreboard', 'beamer', 'urkunden', 'fallen-profil'];

/**
 * @param {{inhalte: object, version: string, konfig: object}} opt  konfig aus verbundKonfig()
 */
function createManifest({ inhalte, version, konfig }) {
  return function manifest(basis) {
    const welten = [...inhalte.katalog.welten.values()].sort((a, b) => a.nr - b.nr);
    return {
      vertrag: VERTRAG,
      ...PLATTFORM,
      id: konfig.id,
      version,
      basis: konfig.url || basis,
      icon: '/static/favicon.svg',
      urls: {
        start: '/',
        gast: '/gast',
        themen: '/themen',
        lehrkraft: '/lehrer',
        datenschutz: '/datenschutz',
        healthz: '/healthz',
        ssoStart: konfig.sso ? '/sso/start' : null,
        ssoEnde: konfig.sso ? '/sso/ende' : null,
        niveaus: '/themen#niveaus'
      },
      auth: { modus: konfig.modus, portal: konfig.portal, sso: konfig.sso },
      umfang: {
        welten: welten.length,
        level: welten.reduce((s, w) => s + w.levels.length, 0),
        aufgaben: welten.reduce((s, w) => s + (w.aufgabenAnzahl || 0) + (w.boss ? w.boss.pool.length : 0), 0),
        bosse: welten.filter((w) => w.boss).length
      },
      welten: welten.map((w) => ({ nr: w.nr, titel: w.titel, farbe: w.farbe, level: w.levels.length })),
      faehigkeiten: FAEHIGKEITEN
    };
  };
}

module.exports = { createManifest, VERTRAG };
