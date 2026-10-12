'use strict';
// Themenübersicht (/themen): Welten, Level, Arbeitsblätter, Boss, Trainingsplatz und Warm-up auf einen Blick,
// dazu Querschnitte nach Aufgabentyp (LAB_KATEGORIEN) und nach Fallen P1–P10. Enthält keine Lösungen.

const G = require('../content/generators');
const { LAB_KATEGORIEN, FALLEN } = require('../domain');

/**
 * @param {object} ctx
 * @param {{inhalte: object}} deps
 * @param {{verzeichnis: object|null, pdfVorhanden: (datei: string) => boolean}} ab
 *   verzeichnis = seed/arbeitsblaetter.json, pdfVorhanden prüft, ob die PDF ausgeliefert werden kann
 */
function createThemen(ctx, { inhalte }, ab = { verzeichnis: null, pdfVorhanden: () => false }) {
  const { db } = ctx;
  /** Demo-PDF (ohne Anmeldung abrufbar)? Alle anderen nur nach Anmeldung. */
  const istDemo = (datei) => !!(ab.demo && datei && ab.demo(datei));

  function pdfLink(datei) {
    return datei && ab.pdfVorhanden(datei) ? '/arbeitsblaetter/' + datei.split('/').map(encodeURIComponent).join('/') : null;
  }

  function arbeitsblaetterDerWelt(nr) {
    const w = ab.verzeichnis && (ab.verzeichnis.welten || []).find((x) => x.welt === nr);
    if (!w) return [];
    return (w.arbeitsblaetter || []).map((a) => ({ nr: a.nr, titel: a.titel, ds: a.ds || [], url: pdfLink(`${w.ordner}/${a.datei}`), demo: istDemo(`${w.ordner}/${a.datei}`) }));
  }

  /** Papier-Boss, Probeklausur, Warm-up-Karten (PDF) einer Welt */
  function weitereDerWelt(nr) {
    const w = ab.verzeichnis && (ab.verzeichnis.welten || []).find((x) => x.welt === nr);
    if (!w) return [];
    return (w.weitere || []).map((x) => ({ art: x.art, titel: x.titel, url: pdfLink(`${w.ordner}/${x.datei}`), demo: istDemo(`${w.ordner}/${x.datei}`) }));
  }

  /** „AB 2 – Teil 1“, „AB W1·1 …“, „AB 1 „Das Portal“ …“ → 2 bzw. 1 */
  function abNummer(text) {
    const m = /AB\s*(?:W\d\s*·\s*)?(\d+)/.exec(String(text || ''));
    return m ? Number(m[1]) : null;
  }

  function uebersicht() {
    const k = inhalte.katalog;
    const warmup = new Map(db.prepare('SELECT welt, COUNT(*) AS n FROM katas GROUP BY welt').all().map((r) => [r.welt, r.n]));
    const kategorien = new Map(LAB_KATEGORIEN.map((kat) => [kat, new Map()]));
    const fallen = new Map(FALLEN.map((f) => [f.p, new Map()]));
    const zaehle = (map, level) => map.set(level.id, (map.get(level.id) || 0) + 1);

    const welten = [...k.welten.values()].map((w) => {
      const abs = arbeitsblaetterDerWelt(w.nr);
      const levels = w.levels.map((l) => {
        const aufgaben = l.aufgaben.map((id) => k.aufgaben.get(id));
        for (const a of aufgaben) {
          if (kategorien.has(a.kategorie)) zaehle(kategorien.get(a.kategorie), l);
          for (const p of a.fallen || []) if (fallen.has(p)) zaehle(fallen.get(p), l);
        }
        const nr = abNummer(l.ab);
        const blatt = abs.find((x) => x.nr === nr) || null;
        return {
          id: l.id,
          welt: w.nr,
          nr: l.nr || '',
          titel: l.titel,
          niveau: l.niveau || 'alle',
          gemischt: !!l.gemischt,
          ds: Array.isArray(l.ds) ? l.ds : [],
          ab: l.ab || '',
          abBlatt: blatt ? { titel: blatt.titel, url: blatt.url, demo: blatt.demo } : null,
          ide: l.ide || '',
          aufgaben: aufgaben.length,
          punkte: l.maxPunkte
        };
      });
      const ds = levels.flatMap((l) => l.ds);
      return {
        nr: w.nr,
        titel: w.titel,
        farbe: w.farbe,
        ds: ds.length ? [Math.min(...ds), Math.max(...ds)] : null,
        aufgaben: w.aufgabenAnzahl,
        levels,
        arbeitsblaetter: abs,
        weitere: weitereDerWelt(w.nr),
        boss: w.boss ? { titel: w.boss.titel, niveau: w.boss.niveau || 'alle', gemischt: !!w.boss.gemischt, dauerMin: w.boss.dauerMin, anzahl: w.boss.anzahl } : null,
        training: G.generatorenFuerWelt(w.nr).map((g) => g.titel),
        warmup: warmup.get(w.nr) || 0
      };
    });

    const ort = (levelId, anzahl) => {
      const l = k.levels.get(levelId);
      return { id: l.id, nr: l.nr || '', titel: l.titel, welt: l.welt, anzahl };
    };
    const querschnitt = (map) => [...map.entries()].map(([id, n]) => ort(id, n));
    const wz = ab.verzeichnis && ab.verzeichnis.werkzeugkarten;

    return {
      welten,
      werkzeugkarten: wz ? { titel: wz.titel, url: pdfLink(wz.datei), demo: istDemo(wz.datei) } : null,
      kategorien: [...kategorien.entries()]
        .map(([kategorie, m]) => ({ kategorie, anzahl: [...m.values()].reduce((s, n) => s + n, 0), orte: querschnitt(m) }))
        .filter((x) => x.anzahl > 0),
      fallen: FALLEN.map((f) => {
        const m = fallen.get(f.p);
        return { p: f.p, titel: f.titel, text: f.text, anzahl: [...m.values()].reduce((s, n) => s + n, 0), orte: querschnitt(m) };
      })
    };
  }

  return { uebersicht, abNummer };
}

module.exports = { createThemen };
