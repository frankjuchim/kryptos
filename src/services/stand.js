'use strict';
// Punktestand, Ränge, Abzeichen (SPEC §2, §8) – Regeln im Code.
// K07: Archivfund-Aufgaben (Delta §2) zählen weder bei geloest noch bei Punkten, Abzeichen oder Weltenbummler.
// Niveau (TECHNIK §8.2/§8.3): Sichtbarkeit (optionen.sichtbar), Bezugsmenge für Rang/anteil (optionen.rangrelevant, labs
// v1.2: = sichtbar) und für Boss-Freischaltung/„Welt gemeistert“ (optionen.bossBezug); Abzeichen-Hooks zusatzAbzeichen/
// zusatzBedingungen, abzeichenAnzeige (K42).

const { rangFuer, BOSS_AUTO_ANTEIL, BOSS_BESIEGT_ANTEIL, FALLEN_IDS } = require('../domain');

function createStand(ctx, { inhalte, kurse }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const kat = () => inhalte.katalog;

  function istFrei(einst, nr) {
    return Array.isArray(einst.welten) && einst.welten.includes(nr);
  }

  /* ---------- Sichtbarkeit und Bezugsmengen (TECHNIK §8) ---------- */

  const opt = () => ctx.optionen;
  const sichtbar = (x, einst) => !!x && opt().sichtbar(x, einst) !== false;
  /** Sichtbare Aufgaben-ids eines Levels (Reihenfolge des Levels). */
  const sichtbareAufgaben = (l, einst) => l.aufgaben.filter((id) => sichtbar(kat().aufgaben.get(id), einst));
  /** Level sichtbar ⇔ selbst sichtbar und mindestens eine sichtbare Aufgabe. */
  const levelSichtbar = (l, einst) => !!l && sichtbar(l, einst) && sichtbareAufgaben(l, einst).length > 0;
  const sichtbareLevels = (w, einst) => w.levels.filter((l) => levelSichtbar(l, einst));

  /** Map<welt, { max, ids: Set }> über die sichtbaren Level-Aufgaben sichtbarer Level, die filter(a, einst) erfüllen. */
  function bezugsmenge(einst, filter) {
    const out = new Map();
    for (const w of kat().welten.values()) {
      const ids = new Set();
      let max = 0;
      for (const l of sichtbareLevels(w, einst)) {
        for (const id of sichtbareAufgaben(l, einst)) {
          const a = kat().aufgaben.get(id);
          if (filter(a, einst) === false) continue;
          ids.add(id);
          max += a.punkte;
        }
      }
      out.set(w.nr, { max, ids });
    }
    return out;
  }

  /** Bezugsmenge B für Rang, anteil, Kursübersicht (§8.3; labs-Vertrag v1.2: rangrelevant = sichtbar). */
  const bezug = (einst) => bezugsmenge(einst, (a, e) => opt().rangrelevant(a, e));
  /** Bezugsmenge der Boss-Freischaltung (60 %) und des Abzeichens „Welt gemeistert“ (kern, im eA-Kurs auch eA). */
  const bossBezugsmenge = (einst) => bezugsmenge(einst, (a, e) => opt().bossBezug(a, e));
  /** Erreichte Punkte einer Teilnahme (staende-Eintrag) über die ids einer Bezugsmenge. */
  const istVon = (e, ids) => {
    let ist = 0;
    for (const id of ids) ist += e.aufgabenPunkte.get(id) || 0;
    return ist;
  };

  /* ---------- Punkte ---------- */

  /** Punkte aller Schüler eines Kurses (oder eines einzelnen) je Welt. */
  function staende(kursId, nurSchuelerId = null) {
    const k = kat();
    const filter = nurSchuelerId ? 's.id = ?' : 's.kurs_id = ?';
    const param = nurSchuelerId || kursId;
    const schueler = db.prepare(`SELECT s.* FROM schueler s WHERE ${filter} ORDER BY s.name_key`).all(param);
    const map = new Map();
    for (const s of schueler) map.set(s.id, { id: s.id, name: s.name, row: s, level: {}, aufgabenPunkte: new Map(), boss: {}, training: {}, geloest: 0, abzeichen: 0 });
    if (!schueler.length) return map;
    const f = db
      .prepare(
        `SELECT f.schueler_id AS sid, f.aufgabe_id AS aid, f.punkte, f.status, f.nachgeloest
         FROM fortschritt f JOIN schueler s ON s.id = f.schueler_id WHERE ${filter}`
      )
      .all(param);
    for (const r of f) {
      const a = k.aufgaben.get(r.aid);
      const e = map.get(r.sid);
      if (!a || a._boss || a._archivfund || !e) continue;
      e.level[a._welt] = (e.level[a._welt] || 0) + r.punkte;
      e.aufgabenPunkte.set(a.id, r.punkte);
      if (r.status === 'geloest' || r.nachgeloest) e.geloest++;
    }
    const b = db
      .prepare(
        `SELECT b.schueler_id AS sid, b.welt, b.punkte, b.max_punkte FROM boss_versuche b JOIN schueler s ON s.id = b.schueler_id
         WHERE ${filter} AND b.ende_at IS NOT NULL`
      )
      .all(param);
    for (const r of b) {
      const e = map.get(r.sid);
      if (!e) continue;
      const cur = e.boss[r.welt];
      if (!cur || r.punkte > cur.punkte) e.boss[r.welt] = { punkte: r.punkte, max: r.max_punkte };
    }
    const t = db
      .prepare(`SELECT t.schueler_id AS sid, t.welt, SUM(t.punkte) AS p FROM training t JOIN schueler s ON s.id = t.schueler_id WHERE ${filter} GROUP BY 1, 2`)
      .all(param);
    for (const r of t) if (map.get(r.sid)) map.get(r.sid).training[r.welt] = r.p;
    const ab = db.prepare(`SELECT a.schueler_id AS sid, COUNT(*) AS n FROM abzeichen a JOIN schueler s ON s.id = a.schueler_id WHERE ${filter} GROUP BY 1`).all(param);
    for (const r of ab) if (map.get(r.sid)) map.get(r.sid).abzeichen = r.n;
    for (const e of map.values()) {
      const sum = (o) => Object.values(o).reduce((x, y) => x + (typeof y === 'number' ? y : y.punkte), 0);
      e.punkteLevel = sum(e.level);
      e.punkteBoss = sum(e.boss);
      e.punkteTraining = sum(e.training);
      e.gesamt = e.punkteLevel + e.punkteBoss + e.punkteTraining;
    }
    return map;
  }

  function weltPunkte(e, nr) {
    return (e.level[nr] || 0) + (e.boss[nr] ? e.boss[nr].punkte : 0) + (e.training[nr] || 0);
  }

  /** Rang aus dem Anteil der erreichbaren Level-Punkte (Bezugsmenge B, §8.3) aller freigeschalteten Welten. */
  function rangVon(e, einst, b = bezug(einst)) {
    let ist = 0;
    let max = 0;
    for (const w of kat().welten.values()) {
      if (!istFrei(einst, w.nr)) continue;
      const x = b.get(w.nr);
      max += x.max;
      ist += istVon(e, x.ids);
    }
    const anteil = max ? Math.min(1, ist / max) : 0;
    return { ...rangFuer(anteil), punkte: ist, maxPunkte: max };
  }

  function stand(schuelerRow) {
    return staende(schuelerRow.kurs_id, schuelerRow.id).get(schuelerRow.id);
  }

  /* ---------- Boss-Freischaltung ---------- */

  function bossZugang(einst, e, nr) {
    const w = kat().welten.get(nr);
    if (!w || !w.boss) return { vorhanden: false, frei: false, grund: 'Für diese Welt gibt es keinen Boss.' };
    if (!istFrei(einst, nr)) return { vorhanden: true, frei: false, grund: 'Diese Welt ist noch nicht freigeschaltet.' };
    if (einst.boss === 'offen') return { vorhanden: true, frei: true };
    if (einst.boss === 'gesperrt') return { vorhanden: true, frei: false, grund: 'Die Bosse sind in deinem Kurs noch gesperrt.' };
    // 60 % der Level-Punkte der Welt aus der Boss-Bezugsmenge (kern, im eA-Kurs auch eA; TECHNIK §8.2)
    const x = bossBezugsmenge(einst).get(nr);
    const ist = istVon(e, x.ids);
    const noetig = Math.ceil(BOSS_AUTO_ANTEIL * x.max);
    if (ist >= noetig) return { vorhanden: true, frei: true };
    return { vorhanden: true, frei: false, grund: `Sammle mindestens 60 % der Level-Punkte dieser Welt (${ist} von ${noetig} nötigen Punkten).`, noetig, ist };
  }

  /* ---------- Abzeichen ---------- */

  function definitionen() {
    const liste = [
      { key: 'erste_schritte', icon: '👣', name: 'Erste Schritte', beschreibung: 'Die erste Aufgabe gelöst.' },
      { key: 'zehnerserie', icon: '🔟', name: 'Zehnerserie', beschreibung: '10 Aufgaben in Folge ohne Fehlversuch gelöst.' },
      { key: 'fleissig', icon: '🐝', name: 'Fleißig', beschreibung: '50 Aufgaben gelöst.' },
      { key: 'unermuedlich', icon: '🔥', name: 'Unermüdlich', beschreibung: '150 Aufgaben gelöst.' },
      { key: 'weltenbummler', icon: '🧭', name: 'Weltenbummler', beschreibung: 'In jeder Welt mindestens eine Aufgabe gelöst.' }
    ];
    for (const w of kat().welten.values()) {
      if (w.aufgabenAnzahl) liste.push({ key: `welt${w.nr}_gemeistert`, icon: '🏆', name: `${w.titel} gemeistert`, beschreibung: `Alle Pflichtaufgaben der Level von Welt ${w.nr} gelöst.`, welt: w.nr });
      if (w.boss) liste.push({ key: `boss${w.nr}_besiegt`, icon: '⚔️', name: `${w.boss.titel} besiegt`, beschreibung: `Den Boss von Welt ${w.nr} mit mindestens 50 % besiegt.`, welt: w.nr });
    }
    liste.push(
      { key: 'makellos', icon: '💎', name: 'Makellos', beschreibung: 'Einen Boss mit 100 % besiegt.' },
      { key: 'fallensucher', icon: '🪤', name: 'Fallensucher', beschreibung: 'Zu jeder Falle P1–P10 drei Aufgaben ohne Fehlversuch gelöst.' },
      { key: 'trainingsprofi', icon: '🏋️', name: 'Trainingsprofi', beschreibung: '100 Trainingsaufgaben gelöst.' },
      { key: 'ohne_tipp', icon: '🧠', name: 'Ohne Tipp', beschreibung: '20 Aufgaben der Stufe 3 ohne Tipp gelöst.' },
      { key: 'kata_meister', icon: '🔥', name: 'Warm-up-Meister', beschreibung: '30 Warm-up-Karten in Fach 5.' }
    );
    // Hook (TECHNIK §4.2): z. B. Artefakte, Funkraum-/Arena-Abzeichen
    const zusatz = opt().zusatzAbzeichen(kat());
    if (Array.isArray(zusatz)) liste.push(...zusatz);
    // K42: Anzeige-Hook (Kryptos: Artefakt-Namen, Sprite-Kennungen als Icon); Kern: Identität
    return liste.map((d) => opt().abzeichenAnzeige(d));
  }

  /** Bedingungen auswerten und neue Abzeichen vergeben. Liefert die neu erhaltenen. */
  function pruefeAbzeichen(schuelerRow) {
    const k = kat();
    const sid = schuelerRow.id;
    const s = db.prepare('SELECT * FROM schueler WHERE id = ?').get(sid);
    if (!s) return [];
    const hat = new Set(db.prepare('SELECT schluessel FROM abzeichen WHERE schueler_id = ?').all(sid).map((r) => r.schluessel));
    const rows = db.prepare('SELECT * FROM fortschritt WHERE schueler_id = ?').all(sid);
    const geloest = [];
    for (const r of rows) {
      const a = k.aufgaben.get(r.aufgabe_id);
      if (!a || a._boss || a._archivfund) continue;
      if (r.status === 'geloest' || r.nachgeloest) geloest.push({ a, r });
    }
    const n = geloest.length;
    const proWelt = new Map();
    for (const g of geloest) proWelt.set(g.a._welt, (proWelt.get(g.a._welt) || 0) + 1);
    const erfuellt = new Set();
    if (n >= 1) erfuellt.add('erste_schritte');
    if (s.serie_max >= 10) erfuellt.add('zehnerserie');
    if (n >= 50) erfuellt.add('fleissig');
    if (n >= 150) erfuellt.add('unermuedlich');
    const weltenMitAufgaben = [...k.welten.values()].filter((w) => w.aufgabenAnzahl);
    if (weltenMitAufgaben.length && weltenMitAufgaben.every((w) => proWelt.get(w.nr) > 0)) erfuellt.add('weltenbummler');
    // „Welt gemeistert“: alle Aufgaben der Boss-Bezugsmenge gelöst (kern, im eA-Kurs auch eA – ohne Ergänzung/Kür)
    const kursRow = kurse.kursRow(s.kurs_id);
    const einst = kurse.einstellungen(kursRow ? kursRow.einstellungen : '{}');
    const geloestIds = new Set(geloest.map((g) => g.a.id));
    const bb = bossBezugsmenge(einst);
    for (const w of weltenMitAufgaben) {
      const x = bb.get(w.nr);
      if (x && x.ids.size && [...x.ids].every((id) => geloestIds.has(id))) erfuellt.add(`welt${w.nr}_gemeistert`);
    }
    const bosse = db.prepare('SELECT welt, MAX(CAST(punkte AS REAL) / max_punkte) AS q FROM boss_versuche WHERE schueler_id = ? AND ende_at IS NOT NULL AND max_punkte > 0 GROUP BY welt').all(sid);
    for (const b of bosse) {
      if (b.q >= BOSS_BESIEGT_ANTEIL - 1e-9 && k.welten.get(b.welt) && k.welten.get(b.welt).boss) erfuellt.add(`boss${b.welt}_besiegt`);
      if (b.q >= 1 - 1e-9) erfuellt.add('makellos');
    }
    // Fallensucher: je Falle (die im Inhalt vorkommt) min(3, Anzahl Aufgaben) ohne Fehlversuch gelöst
    const imInhalt = {};
    for (const a of k.aufgaben.values()) if (!a._boss && a._level) for (const p of a.fallen) imInhalt[p] = (imInhalt[p] || 0) + 1;
    const ohneFehler = {};
    for (const g of geloest) if (g.r.status === 'geloest' && g.r.fehlversuche === 0) for (const p of g.a.fallen) ohneFehler[p] = (ohneFehler[p] || 0) + 1;
    const relevante = FALLEN_IDS.filter((p) => imInhalt[p]);
    if (relevante.length && relevante.every((p) => (ohneFehler[p] || 0) >= Math.min(3, imInhalt[p]))) erfuellt.add('fallensucher');
    const tr = db.prepare("SELECT COUNT(*) AS n FROM training WHERE schueler_id = ? AND status = 'geloest'").get(sid).n;
    if (tr >= 100) erfuellt.add('trainingsprofi');
    const ohneTipp = geloest.filter((g) => g.r.status === 'geloest' && g.a.stufe === 3 && g.r.tipps === 0).length;
    if (ohneTipp >= 20) erfuellt.add('ohne_tipp');
    const kata5 = db.prepare('SELECT COUNT(*) AS n FROM leitner WHERE schueler_id = ? AND box = 5').get(sid).n;
    if (kata5 >= 30) erfuellt.add('kata_meister');
    for (const key of opt().zusatzBedingungen(sid, db) || []) erfuellt.add(key);

    const defs = new Map(definitionen().map((d) => [d.key, d]));
    const neu = [];
    const jetzt = iso();
    const ins = db.prepare('INSERT OR IGNORE INTO abzeichen (schueler_id, schluessel, at) VALUES (?, ?, ?)');
    for (const key of erfuellt) {
      if (hat.has(key) || !defs.has(key)) continue;
      ins.run(sid, key, jetzt);
      const d = defs.get(key);
      neu.push(d);
      erfolg(s, erfolgText('{name}', d)); // Name wird beim Anzeigen eingesetzt (Umbenennen wirkt sofort)
    }
    return neu;
  }

  function erfolgText(name, d) {
    if (d.key.startsWith('boss')) {
      const w = kat().welten.get(d.welt);
      return `${name} hat den ${w ? w.name : 'Welt-' + d.welt}-Boss besiegt`;
    }
    if (d.key.endsWith('_gemeistert')) {
      const w = kat().welten.get(d.welt);
      return `${name} hat Welt ${d.welt} („${w ? w.titel : ''}“) gemeistert`;
    }
    return `${name} hat das Abzeichen „${d.name}“ erhalten`;
  }

  function erfolg(s, text) {
    db.prepare('INSERT INTO erfolge (kurs_id, schueler_id, text, at) VALUES (?, ?, ?, ?)').run(s.kurs_id, s.id, text, iso());
  }

  function abzeichenVon(sid) {
    const hat = new Map(db.prepare('SELECT schluessel, at FROM abzeichen WHERE schueler_id = ?').all(sid).map((r) => [r.schluessel, r.at]));
    return definitionen().map((d) => ({ ...d, erhalten: hat.has(d.key), am: hat.get(d.key) || null }));
  }

  return { istFrei, staende, stand, weltPunkte, rangVon, bossZugang, definitionen, pruefeAbzeichen, abzeichenVon, erfolg, kurse, sichtbar, sichtbareAufgaben, levelSichtbar, sichtbareLevels, bezug, bossBezugsmenge, istVon };
}

module.exports = { createStand };
