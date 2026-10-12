'use strict';
// Trainingsplatz (SPEC §2, §6): Zufallsaufgaben aus Generatoren, 1 Punkt je gelöster Aufgabe, max. 30 Punkte pro Tag.

const crypto = require('node:crypto');
const V = require('../validate');
const C = require('../content/checker');
const G = require('../content/generators');
const { TRAINING_MAX_PUNKTE_TAG } = require('../domain');

const { NotFoundError, ValidationError } = V;

/** Kalendertag in Deutschland (für das Tageslimit). */
function tagBerlin(t) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}

function createTraining(ctx, { inhalte, stand, lernen }) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();
  const seedQuelle = ctx.trainingSeed || (() => crypto.randomInt(1, 2 ** 31));

  function punkteHeute(sid) {
    return db.prepare('SELECT COALESCE(SUM(punkte), 0) AS p FROM training WHERE schueler_id = ? AND tag = ?').get(sid, tagBerlin(ctx.now())).p;
  }

  function info(s, weltRoh) {
    const nr = V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    lernen.pruefeWeltFrei(s, nr);
    const gens = G.generatorenFuerWelt(nr);
    if (!gens.length) throw new NotFoundError('Für diese Welt gibt es keinen Trainingsplatz.');
    const w = inhalte.weltInfo(nr);
    const gesamt = db.prepare("SELECT COUNT(*) AS n FROM training WHERE schueler_id = ? AND status = 'geloest'").get(s.id).n;
    const offen = db.prepare("SELECT id FROM training WHERE schueler_id = ? AND welt = ? AND status = 'offen' ORDER BY id DESC LIMIT 1").get(s.id, nr);
    return {
      welt: { nr, titel: w.titel, farbe: w.farbe },
      generatoren: gens,
      heute: punkteHeute(s.id),
      maxProTag: TRAINING_MAX_PUNKTE_TAG,
      geloestGesamt: gesamt,
      offen: offen ? offen.id : null
    };
  }

  function row(sid, id) {
    const r = db.prepare('SELECT * FROM training WHERE id = ? AND schueler_id = ?').get(id, sid);
    if (!r) throw new NotFoundError('Trainingsaufgabe nicht gefunden.');
    return r;
  }

  function ansicht(r) {
    const a = JSON.parse(r.daten);
    const out = {
      id: r.id,
      welt: r.welt,
      generator: r.generator,
      aufgabe: { ...inhalte.oeffentlich(a), id: `T${r.id}` },
      status: r.status,
      fehlversuche: r.fehlversuche,
      punkte: r.punkte
    };
    if (r.status !== 'offen') Object.assign(out, inhalte.loesungsteil(a));
    return out;
  }

  function neu(s, weltRoh, body) {
    const nr = V.int(weltRoh, 'Welt', { min: 0, max: 9 });
    lernen.pruefeWeltFrei(s, nr);
    const gens = G.generatorenFuerWelt(nr);
    if (!gens.length) throw new NotFoundError('Für diese Welt gibt es keinen Trainingsplatz.');
    const wunsch = body && typeof body.generator === 'string' && body.generator ? body.generator : null;
    let key;
    if (wunsch) {
      if (!gens.some((g) => g.key === wunsch)) throw new ValidationError('Diesen Aufgabentyp gibt es hier nicht.');
      key = wunsch;
    } else key = gens[crypto.randomInt(gens.length)].key;
    const seed = seedQuelle() >>> 0;
    const a = G.erzeuge(key, seed);
    // alte offene Trainingsaufgaben dieser Welt verwerfen (nur eine offene je Welt)
    db.prepare("DELETE FROM training WHERE schueler_id = ? AND welt = ? AND status = 'offen'").run(s.id, nr);
    const info_ = db
      .prepare('INSERT INTO training (schueler_id, welt, generator, seed, daten, tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(s.id, nr, key, seed, JSON.stringify(a), tagBerlin(ctx.now()), iso());
    return ansicht(row(s.id, Number(info_.lastInsertRowid)));
  }

  function holen(s, idRoh) {
    return ansicht(row(s.id, V.id(idRoh, 'Trainingsaufgabe')));
  }

  function pruefen(s, idRoh, body) {
    const r = row(s.id, V.id(idRoh, 'Trainingsaufgabe'));
    const a = JSON.parse(r.daten);
    const b = body || {};
    const teilweise = b.teilweise === true;
    const erg = C.pruefeAufgabe(a, b.antwort, { teilweise, teil: b.teil });
    if (!teilweise && erg.leer) throw new ValidationError('Bitte gib zuerst eine Antwort ein.');
    let punkte = 0;
    let geloest = false;
    let neueAbzeichen = [];
    if (r.status === 'offen') {
      if (!erg.ok) db.prepare('UPDATE training SET fehlversuche = fehlversuche + 1 WHERE id = ?').run(r.id);
      else if (!teilweise || erg.vollstaendig) {
        const tag = tagBerlin(ctx.now());
        punkte = punkteHeute(s.id) < TRAINING_MAX_PUNKTE_TAG ? 1 : 0;
        db.prepare("UPDATE training SET status = 'geloest', punkte = ?, tag = ?, geloest_at = ? WHERE id = ?").run(punkte, tag, iso(), r.id);
        geloest = true;
        neueAbzeichen = stand.pruefeAbzeichen(s);
      }
    }
    const nachher = row(s.id, r.id);
    const out = { ok: erg.ok, geloest, punkteErhalten: punkte, status: nachher.status, fehlversuche: nachher.fehlversuche, heute: punkteHeute(s.id), neueAbzeichen };
    if (teilweise) Object.assign(out, { teilweise: true, teil: erg.teil, vollstaendig: erg.vollstaendig, ersteFalschePosition: erg.ersteFalschePosition });
    else {
      out.teile = erg.teile;
      if ('ersteFalschePosition' in erg) out.ersteFalschePosition = erg.ersteFalschePosition;
      if (erg.felder) out.felder = erg.felder;
      if (erg.elemente) out.elemente = erg.elemente;
    }
    if (nachher.status !== 'offen' && erg.ok) Object.assign(out, inhalte.loesungsteil(a));
    return out;
  }

  function aufdecken(s, idRoh) {
    const r = row(s.id, V.id(idRoh, 'Trainingsaufgabe'));
    if (r.status === 'offen') db.prepare("UPDATE training SET status = 'angesehen' WHERE id = ?").run(r.id);
    return ansicht(row(s.id, r.id));
  }

  return { info, neu, holen, pruefen, aufdecken, punkteHeute };
}

module.exports = { createTraining, tagBerlin };
