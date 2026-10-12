'use strict';
// Gastmodus (/gast): kleiner Einblick ohne Anmeldung.
//  - Schüler: eigene Demo-Aufgaben aus seed/gast/demo.json (nicht aus den Welten 0–6), Prüfung serverseitig,
//    nichts wird gespeichert (Fehlversuche/Tipps zählt der Browser und schickt sie nur zur Punkte-Anzeige mit).
//  - Lehrkraft: erfundener Demo-Kurs (Namen, Lernstände) – nur lesend; Materialien nur als Titel ohne Downloads.

const fs = require('node:fs');
const C = require('../content/checker');
const F = require('../content/format');
const { validiereWelt, aufgabePunkte } = require('../content/validator');
const { punkteFuer, FALLEN, rangFuer } = require('../domain');
const { NotFoundError, ValidationError } = require('../validate');

const DEMO_NAMEN = ['Lena S.', 'Tom K.', 'Aylin D.', 'Jonas B.', 'Mia W.', 'Noah F.', 'Emma R.', 'Ben T.'];

/** kleiner deterministischer Zufall (gleiche Demo-Daten bei jedem Aufruf) */
function zufall(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * @param {object} ctx
 * @param {{datei: string|null, inhalte: object, material: object, log?: Function}} opt
 */
function createGast(ctx, { datei, inhalte, material, log = () => {} }) {
  let demo = null;
  if (datei && fs.existsSync(datei)) {
    try {
      const data = JSON.parse(fs.readFileSync(datei, 'utf8'));
      const v = validiereWelt(data, { datei: 'gast/demo.json' });
      if (v.fehler.length) throw new Error(v.fehler.map((x) => x.meldung).join('; '));
      const aufgaben = new Map(
        data.aufgaben.map((a) => [a.id, { ...a, punkte: aufgabePunkte(a), fallen: a.fallen || [], tipps: Array.isArray(a.tipps) ? a.tipps : [] }])
      );
      const level = data.levels[0];
      demo = { titel: data.titel, farbe: data.farbe, level: { titel: level.titel, intro: level.intro || [], aufgaben: level.aufgaben.filter((id) => aufgaben.has(id)) }, aufgaben };
    } catch (e) {
      log(`Gastmodus: Demo-Aufgaben nicht ladbar: ${e.message}`);
      demo = null;
    }
  }

  function demoAufgabe(id) {
    const a = demo && demo.aufgaben.get(id);
    if (!a) throw new NotFoundError('Diese Demo-Aufgabe gibt es nicht.');
    return a;
  }

  const zahl = (v, max) => (Number.isInteger(v) && v > 0 ? Math.min(v, max) : 0);

  /** Zustand wie im Lab – aus den Zählern, die der Browser mitschickt (nichts wird gespeichert). */
  function zustand(a, { fehlversuche = 0, tipps = 0, status = 'offen', punkte = 0 } = {}) {
    const t = Math.min(tipps, a.tipps.length);
    return {
      status,
      nachgeloest: false,
      fehlversuche,
      tippsGenutzt: t,
      tipps: a.tipps.slice(0, status === 'offen' ? t : a.tipps.length),
      punkte,
      moeglich: status === 'offen' ? punkteFuer(a.punkte, fehlversuche, t) : 0
    };
  }

  /* ---------- Schüler ---------- */

  function schueler() {
    if (!demo) return { vorhanden: false };
    return {
      vorhanden: true,
      titel: demo.titel,
      farbe: demo.farbe,
      level: demo.level.titel,
      intro: demo.level.intro,
      aufgaben: demo.level.aufgaben.map((id) => {
        const a = demo.aufgaben.get(id);
        return { id, titel: a.titel, stufe: a.stufe, punkte: a.punkte, kategorie: a.kategorie, arten: F.teile(a).map((t) => F.artVon(t.interaktion)) };
      })
    };
  }

  function aufgabe(id) {
    const a = demoAufgabe(id);
    const liste = demo.level.aufgaben;
    const i = liste.indexOf(id);
    return {
      aufgabe: inhalte.oeffentlich(a),
      zustand: zustand(a),
      ort: { index: i, anzahl: liste.length, vorher: i > 0 ? liste[i - 1] : null, nachher: i < liste.length - 1 ? liste[i + 1] : null }
    };
  }

  function pruefen(id, body) {
    const a = demoAufgabe(id);
    const b = body || {};
    const teilweise = b.teilweise === true;
    const erg = C.pruefeAufgabe(a, b.antwort, { teilweise, teil: b.teil });
    if (!teilweise && erg.leer) throw new ValidationError('Bitte gib zuerst eine Antwort ein.');
    const fehlversuche = zahl(b.fehlversuche, 50) + (erg.ok ? 0 : 1);
    const tipps = zahl(b.tipps, 20);
    const fertig = erg.ok && (!teilweise || erg.vollstaendig);
    const angesehen = b.angesehen === true;
    const punkte = fertig && !angesehen ? punkteFuer(a.punkte, zahl(b.fehlversuche, 50), Math.min(tipps, a.tipps.length)) : 0;
    const z = zustand(a, { fehlversuche, tipps, status: fertig ? (angesehen ? 'angesehen' : 'geloest') : angesehen ? 'angesehen' : 'offen', punkte });
    const out = { ok: erg.ok, zustand: z, geloest: fertig, punkteErhalten: punkte, neueAbzeichen: [], gast: true };
    if (teilweise) Object.assign(out, { teilweise: true, teil: erg.teil, vollstaendig: erg.vollstaendig, ersteFalschePosition: erg.ersteFalschePosition });
    else {
      out.teile = erg.teile;
      if ('ersteFalschePosition' in erg) out.ersteFalschePosition = erg.ersteFalschePosition;
      if (erg.felder) out.felder = erg.felder;
      if (erg.elemente) out.elemente = erg.elemente;
    }
    if (fertig) Object.assign(out, inhalte.loesungsteil(a));
    return out;
  }

  function tipp(id, body) {
    const a = demoAufgabe(id);
    if (!a.tipps.length) throw new ValidationError('Zu dieser Aufgabe gibt es keine Tipps.');
    const b = body || {};
    return { zustand: zustand(a, { fehlversuche: zahl(b.fehlversuche, 50), tipps: zahl(b.tipps, 20) + 1 }) };
  }

  function aufdecken(id) {
    const a = demoAufgabe(id);
    return { zustand: zustand(a, { status: 'angesehen' }), ...inhalte.loesungsteil(a) };
  }

  /* ---------- Lehrkraft: erfundener Demo-Kurs ---------- */

  function lehrkraft() {
    const rnd = zufall(2027);
    const kat = inhalte.katalog;
    const welten = [...kat.welten.values()].filter((w) => w.nr <= 2).sort((x, y) => x.nr - y.nr);
    const levels = welten.flatMap((w) => w.levels.map((l) => ({ id: l.id, nr: l.nr, titel: l.titel, welt: w.nr, maxPunkte: l.maxPunkte || 0 })));
    const maxGesamt = levels.reduce((s, l) => s + l.maxPunkte, 0) || 1;
    const jetzt = ctx.now();
    const schuelerListe = DEMO_NAMEN.map((name, i) => {
      const fleiss = 0.95 - i * 0.1 + rnd() * 0.1;
      const werte = levels.map((l, k) => {
        const anteil = Math.max(0, Math.min(1, fleiss * 1.15 - k * 0.07 - rnd() * 0.25));
        const geloest = Math.round(anteil * 7);
        return { anteil: Math.round(anteil * 100) / 100, punkte: Math.round(anteil * l.maxPunkte), geloest, angesehen: anteil > 0.2 && rnd() < 0.3 ? 1 : 0 };
      });
      const punkte = werte.reduce((s, w) => s + w.punkte, 0);
      return {
        name,
        code: '•••-•••',
        punkte,
        geloest: werte.reduce((s, w) => s + w.geloest, 0),
        rang: rangFuer(punkte / maxGesamt).name,
        zuletztAktiv: new Date(jetzt - Math.round((i * 7 + rnd() * 20) * 3600 * 1000)).toISOString(),
        werte
      };
    });
    const fallen = FALLEN.map((f, i) => {
      const n = Math.round(([9, 6, 4, 7, 5, 12, 8, 10, 6, 3][i] || 4) * (0.8 + rnd() * 0.4));
      return { p: f.p, titel: f.titel, fehlversuche: n, schueler: Math.min(DEMO_NAMEN.length, 1 + Math.round(n / 2)), schuelerGesamt: DEMO_NAMEN.length };
    });
    const aufgabenStat = demo
      ? demo.level.aufgaben.map((id, i) => {
          const a = demo.aufgaben.get(id);
          const quote = [0.88, 0.63, 0.5, 0.75, 0.81, 0.69][i] ?? 0.7;
          return {
            id, titel: a.titel, stufe: a.stufe, kategorie: a.kategorie, fallen: a.fallen,
            versucht: DEMO_NAMEN.length, quote, fehlversucheSchnitt: Math.round((1 - quote) * 30) / 10, angesehen: i % 3 === 1 ? 1 : 0,
            falscheAntworten: [[{ antwort: 'g3: 30', anzahl: 2 }], [{ antwort: 'g1: =', anzahl: 3 }, { antwort: 'g2: länge(r)', anzahl: 2 }], [{ antwort: 'Zeile 5', anzahl: 2 }], [{ antwort: '20, 10, 5 …', anzahl: 1 }], [], [{ antwort: '(1,2) zusätzlich', anzahl: 1 }]][i] || []
          };
        })
      : [];
    const boss = {
      welten: welten.filter((w) => w.boss).slice(0, 2).map((w) => ({ nr: w.nr, titel: w.boss.titel })),
      zeilen: schuelerListe.map((s, i) => ({ name: s.name, werte: [i < 6 ? { punkte: 100 - i * 9, max: 120, versuche: 1 + (i % 2) } : null, i < 3 ? { punkte: 80 - i * 12, max: 140, versuche: 1 } : null] }))
    };
    // Materialien: Titel und Art (Welt 0); Links nur für die Demo-Dateien (seed/demo_materialien.json)
    const m = material && material.uebersicht();
    const materialien = m
      ? {
          // Demo-Dateien mit Link, alle anderen nur als Titel
          welt0: (m.welten.find((w) => w.nr === 0) || { eintraege: [] }).eintraege.map((e) => ({ art: e.art, titel: e.titel, dateien: e.dateien.map((d) => ({ label: d.label, lehrkraft: d.lehrkraft, url: d.demo ? d.url : null })) })),
          weitere: m.welten.filter((w) => w.nr !== 0).reduce((s, w) => s + w.eintraege.length, 0)
        }
      : { welt0: [], weitere: 0 };
    return {
      kurs: { name: 'Demo-Kurs Informatik 12', code: 'DEMO-K', schueler: DEMO_NAMEN.length },
      einstellungen: { welten: welten.map((w) => w.nr), boss: 'auto', scoreboard: true, beamer: true, anmeldung: false },
      levels: levels.map(({ id, nr, titel, maxPunkte }) => ({ id, nr, titel, maxPunkte })),
      schueler: schuelerListe.map(({ werte, ...s }) => s),
      matrix: { zeilen: schuelerListe.map((s) => ({ name: s.name, werte: s.werte })) },
      boss,
      fallen,
      aufgaben: aufgabenStat,
      materialien,
      weltenGesamt: kat.welten.size
    };
  }

  /** Aufgaben-Vorschau der Demo-Aufgaben mit Lösung (die Demo-Aufgaben sind ohnehin öffentlich). */
  function vorschau(id) {
    const a = demoAufgabe(id);
    return { aufgabe: inhalte.oeffentlich(a), ...inhalte.loesungsteil(a), tipps: a.tipps };
  }

  return { schueler, aufgabe, pruefen, tipp, aufdecken, lehrkraft, vorschau, vorhanden: () => !!demo };
}

module.exports = { createGast };
