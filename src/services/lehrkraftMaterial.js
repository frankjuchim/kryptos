'use strict';
// Materialien für Lehrkräfte (Lehrkraft-Bereich → Materialien): Lösungen, Erwartungshorizonte, Präsentationen,
// Lehrerhinweise, Klausuren als PDF. Grundlage ist materialien/Lehrkraft_PDF/verzeichnis.json (erzeugt von
// werkzeuge/lehrkraft_pdf.py). Ausgeliefert werden NUR Dateien, die dort verzeichnet sind; Schülerfassungen
// (Arbeitsblaetter_PDF/…) verweisen auf /arbeitsblaetter/… (nur nach Anmeldung, außer Demo-PDFs), alles andere auf
// /lehrkraft/dateien/…, die nur angemeldete Lehrkräfte erreichen (außer den Demo-Dateien aus seed/demo_materialien.json).

const fs = require('node:fs');
const path = require('node:path');

const OEFFENTLICH = 'Arbeitsblaetter_PDF/';
const URL_LEHRKRAFT = '/lehrkraft/dateien/';
const kodiert = (rel) => rel.split('/').map(encodeURIComponent).join('/');

/**
 * @param {{materialienDir: string|null, abDir: string|null, log?: Function}} opts
 *   materialienDir: Ordner mit Lehrkraft_PDF/ und Loesungen_Portal/; abDir: öffentliche Arbeitsblatt-PDFs
 */
function createLehrkraftMaterial({ materialienDir, abDir, demo = { schueler: new Set(), lehrkraft: new Set() }, log = () => {} }) {
  let verzeichnis = null;
  const datei = materialienDir && path.join(materialienDir, 'Lehrkraft_PDF', 'verzeichnis.json');
  if (datei && fs.existsSync(datei)) {
    try {
      verzeichnis = JSON.parse(fs.readFileSync(datei, 'utf8'));
    } catch (e) {
      log(`Lehrkraft_PDF/verzeichnis.json nicht lesbar: ${e.message}`);
    }
  }

  /** Whitelist: URL-Pfad (ohne Präfix, dekodiert) → absolute Datei */
  const geschuetzt = new Map();

  function link(rel) {
    if (typeof rel !== 'string' || rel.includes('..') || !rel.toLowerCase().endsWith('.pdf')) return null;
    if (rel.startsWith(OEFFENTLICH)) {
      const r = rel.slice(OEFFENTLICH.length);
      return abDir && fs.existsSync(path.join(abDir, r)) ? '/arbeitsblaetter/' + kodiert(r) : null;
    }
    const abs = path.join(materialienDir, rel);
    if (!fs.existsSync(abs)) return null;
    geschuetzt.set(rel, abs);
    return URL_LEHRKRAFT + kodiert(rel);
  }

  const eintrag = (e) => ({
    art: e.art,
    titel: e.titel,
    ds: Array.isArray(e.ds) ? e.ds : [],
    dateien: (e.dateien || []).map((d) => {
      const p = String(d.pfad);
      const istDemo = p.startsWith(OEFFENTLICH) ? demo.schueler.has(p.slice(OEFFENTLICH.length)) : demo.lehrkraft.has(p);
      return { label: d.label, url: link(d.pfad), lehrkraft: !p.startsWith(OEFFENTLICH), demo: istDemo };
    })
  });

  const uebersicht = verzeichnis
    ? {
        allgemein: (verzeichnis.allgemein || []).map(eintrag),
        welten: (verzeichnis.welten || []).map((w) => ({ nr: w.welt, eintraege: (w.eintraege || []).map(eintrag) }))
      }
    : null;

  return {
    /** Übersicht für /api/lehrer/materialien (null = keine Materialien auf diesem Server) */
    uebersicht: () => uebersicht,
    /** Absolute Datei zu einem URL-Pfad unter /lehrkraft/dateien/ – nur verzeichnete Dateien, sonst null */
    datei: (relDekodiert) => geschuetzt.get(relDekodiert) || null
  };
}

module.exports = { createLehrkraftMaterial, URL_LEHRKRAFT };
