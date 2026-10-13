'use strict';
// Schüler-Seite: Weltkarte, Level, Aufgaben prüfen/Tipps/Aufdecken, IDE-Häkchen, Profil, Scoreboard.
// K06: Archivfund je Welt (Delta §2: 0 Punkte, zählt für nichts, wird gespeichert), Welt-Felder auf der Weltkarte;
// Fallen-Diagnose (optionen.diagnose, fallenAusErgebnis); Sichtbarkeit nach Niveau (optionen.sichtbar, TECHNIK §8).
// K38: Level-Detail mit akteDatei und video { nr, titel, url } über optionen.levelMedien (Plan M5 Task 98).

const V = require('../validate');
const C = require('../content/checker');
const F = require('../content/format');
const { punkteFuer, FALLEN } = require('../domain');
const { generatorenFuerWelt } = require('../content/generators');

const { NotFoundError, ForbiddenError, ValidationError } = V;

function createLernen(ctx, { inhalte, kurse, stand }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const kat = () => inhalte.katalog;

  function einstellungenVon(s) {
    const k = kurse.kursRow(s.kurs_id);
    return kurse.einstellungen(k ? k.einstellungen : '{}');
  }

  function fortschrittMap(sid) {
    return new Map(db.prepare('SELECT * FROM fortschritt WHERE schueler_id = ?').all(sid).map((r) => [r.aufgabe_id, r]));
  }

  function statusVon(r) {
    if (!r) return 'offen';
    return r.status;
  }

  /* ---------- Sichtbarkeit nach Niveau (optionen.sichtbar, TECHNIK §8.1/§8.2; Helfer aus stand.js) ---------- */

  const { sichtbar, sichtbareAufgaben, levelSichtbar, sichtbareLevels } = stand;

  /* ---------- Weltkarte ---------- */

  function welten(s) {
    const einst = einstellungenVon(s);
    const fm = fortschrittMap(s.id);
    const e = stand.stand(s);
    const b = stand.bezug(einst);
    const out = [];
    for (const w of kat().welten.values()) {
      const frei = stand.istFrei(einst, w.nr);
      // nur sichtbare Level, Zahlen nur über sichtbare Aufgaben (TECHNIK §8.2)
      const levels = sichtbareLevels(w, einst).map((l) => {
        const ids = sichtbareAufgaben(l, einst);
        let punkte = 0;
        let geloest = 0;
        let maxPunkte = 0;
        for (const id of ids) {
          maxPunkte += kat().aufgaben.get(id).punkte;
          const r = fm.get(id);
          if (r) {
            punkte += r.punkte;
            if (r.status === 'geloest' || r.nachgeloest) geloest++;
          }
        }
        return { id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, rolle: l.rolle, kuer: l.kuer, werkzeug: l.werkzeug, akte: l.akte, video: l.video, anzahl: ids.length, geloest, punkte, maxPunkte, anteil: maxPunkte ? punkte / maxPunkte : 0 };
      });
      const boss = w.boss ? bossKurz(s, w, einst, e) : null;
      out.push({
        nr: w.nr,
        titel: w.titel,
        name: w.name,
        farbe: w.farbe,
        epoche: w.epoche,
        jahr: w.jahr,
        akzentHell: w.akzentHell,
        archivfund: w.archivfund ? { titel: w.archivfund.titel, status: statusVon(fm.get(w.archivfund.aufgabe)) } : null,
        // Kapiteltext erst nach besiegtem Boss (Delta §2)
        kapitel: boss && boss.besiegt ? w.kapitel : null,
        frei,
        levels,
        boss,
        // erspielte Punkte; Maximum und Fortschrittsring über die Bezugsmenge (TECHNIK §8.2/§8.3)
        punkte: e.level[w.nr] || 0,
        maxPunkte: b.get(w.nr).max,
        anteil: b.get(w.nr).max ? Math.min(1, stand.istVon(e, b.get(w.nr).ids) / b.get(w.nr).max) : 0,
        training: generatorenFuerWelt(w.nr, { sichtbar: (g) => ctx.optionen.generatorSichtbar(g, einst) }).length > 0
      });
    }
    return { welten: out, scoreboard: !!einst.scoreboard, niveau: einst.niveau === 'gA' ? 'gA' : 'eA' };
  }

  function bossKurz(s, w, einst, e) {
    const z = stand.bossZugang(einst, e, w.nr);
    const best = e.boss[w.nr];
    const anteil = best && best.max ? best.punkte / best.max : null;
    return { titel: w.boss.titel, gemischt: !!w.boss.gemischt, frei: z.frei, grund: z.grund || null, bester: best || null, besiegt: anteil !== null && anteil >= 0.5 - 1e-9 };
  }

  function pruefeWeltFrei(s, nr) {
    const einst = einstellungenVon(s);
    if (!stand.istFrei(einst, nr)) throw new ForbiddenError('Diese Welt ist in deinem Kurs noch nicht freigeschaltet.');
    return einst;
  }

  /* ---------- Level ---------- */

  /** Sichtbares Level oder 404 (unsichtbar = nicht vorhanden, damit nichts verraten wird), danach Welt-Freischaltung (403). */
  function sichtbaresLevel(s, levelId) {
    const l = kat().levels.get(String(levelId));
    if (!l || !levelSichtbar(l, einstellungenVon(s))) throw new NotFoundError('Level nicht gefunden.');
    const einst = pruefeWeltFrei(s, l.welt);
    return { l, einst };
  }

  function level(s, levelId) {
    const { l, einst } = sichtbaresLevel(s, levelId);
    const w = kat().welten.get(l.welt);
    const fm = fortschrittMap(s.id);
    const levels = sichtbareLevels(w, einst);
    const idx = levels.findIndex((x) => x.id === l.id);
    const ids = sichtbareAufgaben(l, einst);
    const maxPunkte = ids.reduce((x, id) => x + kat().aufgaben.get(id).punkte, 0);
    const ide = db.prepare('SELECT 1 FROM ide_erledigt WHERE schueler_id = ? AND level_id = ?').get(s.id, l.id);
    const medien = ctx.optionen.levelMedien(l); // K38: akteDatei { titel, url } | null, video { nr, titel, url } | null
    return {
      welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
      niveau: einst.niveau === 'gA' ? 'gA' : 'eA',
      level: { id: l.id, nr: l.nr, titel: l.titel, niveau: l.niveau, gemischt: l.gemischt, rolle: l.rolle, kuer: l.kuer, werkzeug: l.werkzeug, akte: l.akte, akteDatei: medien.akteDatei, video: medien.video, ds: l.ds, ab: l.ab, ide: l.ide, intro: l.intro, maxPunkte },
      aufgaben: ids.map((id) => {
        const a = kat().aufgaben.get(id);
        const r = fm.get(id);
        return {
          id,
          titel: a.titel,
          stufe: a.stufe,
          punkte: a.punkte,
          kategorie: a.kategorie,
          niveau: a._niveau || 'kern',
          status: statusVon(r),
          nachgeloest: !!(r && r.nachgeloest),
          erreicht: r ? r.punkte : 0,
          arten: F.teile(a).map((t) => F.artVon(t.interaktion))
        };
      }),
      ideErledigt: !!ide,
      vorher: idx > 0 ? { id: levels[idx - 1].id, titel: levels[idx - 1].titel } : null,
      nachher: idx >= 0 && idx < levels.length - 1 ? { id: levels[idx + 1].id, titel: levels[idx + 1].titel } : null
    };
  }

  function ideSetzen(s, levelId, erledigt) {
    const { l } = sichtbaresLevel(s, levelId);
    if (V.bool(erledigt, 'erledigt')) db.prepare('INSERT OR IGNORE INTO ide_erledigt (schueler_id, level_id, at) VALUES (?, ?, ?)').run(s.id, l.id, iso());
    else db.prepare('DELETE FROM ide_erledigt WHERE schueler_id = ? AND level_id = ?').run(s.id, l.id);
    return { erledigt: V.bool(erledigt, 'erledigt') };
  }

  /* ---------- Aufgaben ---------- */

  /**
   * Level-Aufgabe für den Schüler (Boss-Aufgaben sind nur im Boss-Kampf zugänglich). Archivfund-Aufgaben werden für
   * pruefen/tipp/aufdecken angenommen; angezeigt werden sie nur über archivfund(s, welt).
   */
  function levelAufgabe(s, id) {
    const a = kat().aufgaben.get(String(id));
    if (!a || a._boss || (!a._level && !a._archivfund)) throw new NotFoundError('Aufgabe nicht gefunden.');
    // Niveau (TECHNIK §8.2): unsichtbare Aufgabe oder Aufgabe eines unsichtbaren Levels → 404 (nicht 403)
    const einst = einstellungenVon(s);
    if (!sichtbar(a, einst) || (a._level && !levelSichtbar(kat().levels.get(a._level), einst))) throw new NotFoundError('Aufgabe nicht gefunden.');
    pruefeWeltFrei(s, a._welt);
    return a;
  }

  /** Archivfund-Aufgabe einer Welt (Welt ohne Archivfund → 404, gesperrte Welt → 403). */
  function archivfundAufgabe(s, weltRoh) {
    const nr = V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    const w = kat().welten.get(nr);
    if (!w || !w.archivfund || !kat().aufgaben.has(w.archivfund.aufgabe)) throw new NotFoundError('Für diese Welt gibt es keinen Archivfund.');
    pruefeWeltFrei(s, nr);
    return { w, a: kat().aufgaben.get(w.archivfund.aufgabe) };
  }

  function zeile(sid, aid) {
    return db.prepare('SELECT * FROM fortschritt WHERE schueler_id = ? AND aufgabe_id = ?').get(sid, aid);
  }

  function sichereZeile(sid, aid) {
    db.prepare("INSERT OR IGNORE INTO fortschritt (schueler_id, aufgabe_id, status, updated_at) VALUES (?, ?, 'offen', ?)").run(sid, aid, iso());
    return zeile(sid, aid);
  }

  function zustand(a, r) {
    const tipps = r ? Math.min(r.tipps, a.tipps.length) : 0;
    return {
      status: statusVon(r),
      nachgeloest: !!(r && r.nachgeloest),
      fehlversuche: r ? r.fehlversuche : 0,
      tippsGenutzt: tipps,
      tipps: a.tipps.slice(0, statusVon(r) === 'offen' ? tipps : a.tipps.length),
      punkte: r ? r.punkte : 0,
      moeglich: statusVon(r) === 'offen' ? punkteFuer(a.punkte, r ? r.fehlversuche : 0, tipps) : 0
    };
  }

  function aufgabe(s, id) {
    const a = levelAufgabe(s, id);
    if (a._archivfund) throw new NotFoundError('Aufgabe nicht gefunden.');
    const r = zeile(s.id, a.id);
    const l = kat().levels.get(a._level);
    const w = kat().welten.get(a._welt);
    const liste = sichtbareAufgaben(l, einstellungenVon(s));
    const i = liste.indexOf(a.id);
    const z = zustand(a, r);
    return {
      aufgabe: inhalte.oeffentlich(a),
      zustand: z,
      ...(z.status !== 'offen' ? inhalte.loesungsteil(a) : {}),
      ort: {
        welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
        level: { id: l.id, nr: l.nr, titel: l.titel },
        index: i,
        anzahl: liste.length,
        vorher: i > 0 ? liste[i - 1] : null,
        nachher: i < liste.length - 1 ? liste[i + 1] : null
      }
    };
  }

  /** Archivfund: zählt für nichts (Delta §2) – auch nicht für die Serie (Abzeichen „Zehnerserie“). */
  const serieZaehlt = (a) => !a._archivfund;

  /** Fehlversuch zählen; Fallen nach optionen.fallenAusErgebnis (erkannte Falle der Diagnose, sonst aufgabe.fallen). */
  function fehlerVerbuchen(s, a, erg, voll) {
    const antworten = erg.antworten;
    db.prepare('UPDATE fortschritt SET fehlversuche = fehlversuche + 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
    if (serieZaehlt(a)) db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
    const up = db.prepare('INSERT INTO fallen_zaehler (schueler_id, falle, anzahl) VALUES (?, ?, 1) ON CONFLICT(schueler_id, falle) DO UPDATE SET anzahl = anzahl + 1');
    for (const p of ctx.optionen.fallenAusErgebnis(a, erg) || []) up.run(s.id, p);
    if (voll) {
      const kurz = C.antwortKurz(antworten);
      if (kurz) {
        db.prepare(
          'INSERT INTO falsche_antworten (kurs_id, aufgabe_id, antwort, anzahl) VALUES (?, ?, ?, 1) ON CONFLICT(kurs_id, aufgabe_id, antwort) DO UPDATE SET anzahl = anzahl + 1'
        ).run(s.kurs_id, a.id, kurz);
      }
    }
  }

  /**
   * Antwort prüfen (SPEC §5). Body: { antwort, teilweise?, teil? }.
   * Zählt Fehlversuche nur, solange die Aufgabe offen ist; Punkte nur beim ERSTEN Lösen.
   */
  function pruefen(s, id, body) {
    const a = levelAufgabe(s, id);
    const b = body || {};
    const teilweise = b.teilweise === true;
    const erg = C.pruefeAufgabe(a, b.antwort, { teilweise, teil: b.teil, diagnose: ctx.optionen.diagnose });
    if (!teilweise && erg.leer) throw new ValidationError('Bitte gib zuerst eine Antwort ein.');
    const neu = { geloest: false, punkte: 0, abzeichen: [] };
    const tx = db.transaction(() => {
      const r = sichereZeile(s.id, a.id);
      const fertig = erg.ok && (!teilweise || erg.vollstaendig);
      if (r.status === 'offen') {
        if (!erg.ok) fehlerVerbuchen(s, a, erg, !teilweise);
        else if (fertig) {
          const p = punkteFuer(a.punkte, r.fehlversuche, Math.min(r.tipps, a.tipps.length));
          db.prepare("UPDATE fortschritt SET status = 'geloest', punkte = ?, geloest_at = ?, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?").run(p, iso(), iso(), s.id, a.id);
          if (serieZaehlt(a)) {
            if (r.fehlversuche === 0) db.prepare('UPDATE schueler SET serie = serie + 1, serie_max = MAX(serie_max, serie + 1) WHERE id = ?').run(s.id);
            else db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
          }
          neu.geloest = true;
          neu.punkte = p;
        }
      } else if (r.status === 'angesehen' && fertig && !r.nachgeloest) {
        db.prepare('UPDATE fortschritt SET nachgeloest = 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
        neu.geloest = true;
      }
    });
    tx();
    if (neu.geloest) neu.abzeichen = stand.pruefeAbzeichen(s);
    const r2 = zeile(s.id, a.id);
    const z = zustand(a, r2);
    const out = { ok: erg.ok, zustand: z, geloest: neu.geloest, punkteErhalten: neu.punkte, neueAbzeichen: neu.abzeichen };
    if (teilweise) Object.assign(out, { teilweise: true, teil: erg.teil, vollstaendig: erg.vollstaendig, ersteFalschePosition: erg.ersteFalschePosition });
    else {
      out.teile = erg.teile;
      if ('ersteFalschePosition' in erg) out.ersteFalschePosition = erg.ersteFalschePosition;
      // Teil-Feedback (felder, elemente, zeichen, bits, anteil, buchstaben) und Fallen-Diagnose (K02)
      for (const k of C.FELDER_OBEN) if (erg[k] !== undefined) out[k] = erg[k];
    }
    if (teilweise && erg.diagnose) out.diagnose = erg.diagnose;
    if (z.status !== 'offen' && (neu.geloest || erg.ok)) Object.assign(out, inhalte.loesungsteil(a));
    return out;
  }

  function tipp(s, id) {
    const a = levelAufgabe(s, id);
    const r = sichereZeile(s.id, a.id);
    if (!a.tipps.length) throw new ValidationError('Zu dieser Aufgabe gibt es keine Tipps.');
    if (r.status === 'offen' && r.tipps < a.tipps.length) {
      db.prepare('UPDATE fortschritt SET tipps = tipps + 1, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?').run(iso(), s.id, a.id);
    }
    return { zustand: zustand(a, zeile(s.id, a.id)) };
  }

  function aufdecken(s, id) {
    const a = levelAufgabe(s, id);
    const r = sichereZeile(s.id, a.id);
    if (r.status === 'offen') {
      db.prepare("UPDATE fortschritt SET status = 'angesehen', punkte = 0, updated_at = ? WHERE schueler_id = ? AND aufgabe_id = ?").run(iso(), s.id, a.id);
      if (serieZaehlt(a)) db.prepare('UPDATE schueler SET serie = 0 WHERE id = ?').run(s.id);
    }
    return { zustand: zustand(a, zeile(s.id, a.id)), ...inhalte.loesungsteil(a) };
  }

  /* ---------- Archivfund (Delta §2) ---------- */

  function archivfund(s, welt) {
    const { w, a } = archivfundAufgabe(s, welt);
    const z = zustand(a, zeile(s.id, a.id));
    return {
      welt: { nr: w.nr, titel: w.titel, farbe: w.farbe },
      titel: w.archivfund.titel,
      aufgabe: inhalte.oeffentlich(a),
      zustand: z,
      ...(z.status !== 'offen' ? inhalte.loesungsteil(a) : {})
    };
  }

  const archivfundPruefen = (s, welt, body) => pruefen(s, archivfundAufgabe(s, welt).a.id, body);
  const archivfundTipp = (s, welt) => tipp(s, archivfundAufgabe(s, welt).a.id);
  const archivfundAufdecken = (s, welt) => aufdecken(s, archivfundAufgabe(s, welt).a.id);

  /* ---------- Profil und Scoreboard ---------- */

  function profil(s) {
    const einst = einstellungenVon(s);
    const e = stand.stand(s);
    const b = stand.bezug(einst);
    const rang = stand.rangVon(e, einst, b);
    const k = kurse.kursRow(s.kurs_id);
    const fallenRows = db.prepare('SELECT falle, anzahl FROM fallen_zaehler WHERE schueler_id = ?').all(s.id);
    const fm = new Map(fallenRows.map((r) => [r.falle, r.anzahl]));
    const welten_ = [...kat().welten.values()].map((w) => ({
      nr: w.nr,
      titel: w.titel,
      farbe: w.farbe,
      frei: stand.istFrei(einst, w.nr),
      punkte: e.level[w.nr] || 0,
      maxPunkte: b.get(w.nr).max,
      boss: e.boss[w.nr] || null,
      training: e.training[w.nr] || 0
    }));
    return {
      name: s.name,
      kurs: { name: k.name },
      punkte: { gesamt: e.gesamt, level: e.punkteLevel, boss: e.punkteBoss, training: e.punkteTraining },
      geloest: e.geloest,
      rang,
      serie: db.prepare('SELECT serie, serie_max FROM schueler WHERE id = ?').get(s.id),
      abzeichen: stand.abzeichenVon(s.id),
      welten: welten_,
      fallen: FALLEN.map((f) => ({ ...f, fehlversuche: fm.get(f.p) || 0 })),
      scoreboard: !!einst.scoreboard
    };
  }

  /**
   * Scoreboard eines Kurses: gesamt oder je Welt. Gleichstand → gleicher Platz. Kryptos: inaktive Teilnahmen (Kurs fehlt
   * im letzten SSO-Token) erscheinen nicht – außer mit { inaktive: true } (Urkunden der Lehrkraft).
   */
  function scoreboard(kursId, welt = null, eigeneId = null, { inaktive = false } = {}) {
    const map = stand.staende(kursId);
    const rows = [...map.values()].filter((e) => inaktive || e.row.aktiv === 1).map((e) => ({
      id: e.id,
      name: e.name,
      punkte: welt === null ? e.gesamt : stand.weltPunkte(e, welt),
      abzeichen: e.abzeichen,
      geloest: e.geloest,
      ich: e.id === eigeneId
    }));
    rows.sort((x, y) => y.punkte - x.punkte || x.name.localeCompare(y.name, 'de'));
    let platz = 0;
    let vorher = null;
    rows.forEach((r, i) => {
      if (r.punkte !== vorher) platz = i + 1;
      vorher = r.punkte;
      r.platz = platz;
    });
    return rows;
  }

  function scoreboardFuerSchueler(s, weltRoh) {
    const einst = einstellungenVon(s);
    if (!einst.scoreboard) throw new ForbiddenError('Das Scoreboard ist in deinem Kurs ausgeschaltet.');
    const welt = weltRoh === undefined || weltRoh === '' || weltRoh === null ? null : V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    const liste = scoreboard(s.kurs_id, welt, s.id).map(({ id, ...rest }) => rest); // keine internen ids
    return { welt, liste, welten: [...kat().welten.values()].filter((w) => stand.istFrei(einst, w.nr)).map((w) => ({ nr: w.nr, titel: w.titel })) };
  }

  return { welten, level, ideSetzen, aufgabe, levelAufgabe, pruefen, tipp, aufdecken, archivfund, archivfundPruefen, archivfundTipp, archivfundAufdecken, profil, scoreboard, scoreboardFuerSchueler, einstellungenVon, pruefeWeltFrei };
}

module.exports = { createLernen };
