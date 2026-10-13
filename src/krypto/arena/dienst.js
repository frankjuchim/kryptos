/* Kryptos – Chiffren-Werkstatt und Knack-Arena: Dienst (TECHNIK §9, §13.3/§13.4, Plan M7 Tasks 143–146, E101–E104).
   Phasen werkstatt → angriff → beurteilung → geschlossen; Ende der Angriffsphase `angriff_bis` beim nächsten Zugriff
   (jede Arena-Route, Beamer-Polling) und im Wartungsjob als Rückfall (E102). Klartexte und Schlüssel der Teams werden nie
   gespeichert – nur HMAC-SHA256(arena.salz, nurBuchstaben(klartext)); das Salz verlässt den Server nie.
   Zeit nur über `now`, Zufall nur über `zufallBytes` (E113). */
'use strict';
const V = require('../../validate');
const T = require('../funkraum/text');

const PHASEN = Object.freeze(['werkstatt', 'angriff', 'beurteilung', 'geschlossen']);
const PHASE_NAME = Object.freeze({ werkstatt: 'Werkstatt', angriff: 'Angriff', beurteilung: 'Beurteilung', geschlossen: 'geschlossen' });
/** Übergänge: Zielphase → Ausgangsphase */
const VON = Object.freeze({ angriff: 'werkstatt', beurteilung: 'angriff', geschlossen: 'beurteilung' });
const MIN_CHIFFREN = 2;
const ANGRIFF_MAX_MS = 3 * 3600 * 1000;

const GESPERRT = 'Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.';

/**
 * @param {{ db: import('better-sqlite3').Database, svc: object, teams: object, now: () => number,
 *           zufallBytes: (n: number) => Buffer, log?: Function }} o
 */
function createArena({ db, svc, teams, now, zufallBytes, log = () => {} }) {
  const iso = (ms = now()) => new Date(ms).toISOString();
  const sql = {
    eine: db.prepare('SELECT * FROM arena WHERE id = ?'),
    offen: db.prepare("SELECT * FROM arena WHERE kurs_id = ? AND status != 'geschlossen'"),
    juengste: db.prepare("SELECT * FROM arena WHERE kurs_id = ? AND status = 'geschlossen' ORDER BY geschlossen_at DESC, id DESC LIMIT 1"),
    neu: db.prepare("INSERT INTO arena (kurs_id, status, salz, angriff_bis, created_at) VALUES (?, 'werkstatt', ?, ?, ?)"),
    anzahl: db.prepare('SELECT COUNT(*) AS n FROM arena_chiffren WHERE arena_id = ?'),
    faellig: db.prepare("SELECT * FROM arena WHERE status = 'angriff' AND angriff_bis IS NOT NULL AND angriff_bis <= ?"),
    loesche: db.prepare('DELETE FROM arena WHERE id = ?')
  };

  /** Haken beim Übergang angriff → beurteilung (Abzeichen „Unknackbar“, Task 147): f(arenaZeile) in der Transaktion */
  const beimPhasenwechsel = [];

  /** Regie-Ansicht (nie das Salz) */
  function regieAnsicht(a) {
    if (!a) return null;
    return {
      id: a.id,
      kursId: a.kurs_id,
      status: a.status,
      angriffBis: a.angriff_bis,
      createdAt: a.created_at,
      geschlossenAt: a.geschlossen_at,
      chiffren: sql.anzahl.get(a.id).n
    };
  }

  /** Übergang in eine neue Phase (in der Transaktion des Aufrufers; prüft den Ausgangszustand erneut) */
  function wechsle(a, ziel, { angriffBis } = {}) {
    const frisch = sql.eine.get(a.id);
    if (!frisch || frisch.status !== VON[ziel]) throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[frisch ? frisch.status : a.status]}‘ nicht.`);
    if (ziel === 'angriff') {
      db.prepare("UPDATE arena SET status = 'angriff', angriff_bis = ? WHERE id = ?").run(angriffBis === undefined ? frisch.angriff_bis : angriffBis, a.id);
    } else if (ziel === 'beurteilung') {
      db.prepare("UPDATE arena SET status = 'beurteilung' WHERE id = ?").run(a.id);
      const neu = sql.eine.get(a.id);
      for (const f of beimPhasenwechsel) f(neu);
    } else {
      db.prepare("UPDATE arena SET status = 'geschlossen', geschlossen_at = ? WHERE id = ?").run(iso(), a.id);
    }
    return sql.eine.get(a.id);
  }

  /** Frist der Angriffsphase: abgelaufen → beurteilung (E102). → aktuelle Zeile */
  function pruefeFrist(a) {
    if (!a || a.status !== 'angriff' || !a.angriff_bis || Date.parse(a.angriff_bis) > now()) return a;
    return db.transaction(() => {
      const frisch = sql.eine.get(a.id);
      if (!frisch || frisch.status !== 'angriff') return frisch;
      return wechsle(frisch, 'beurteilung');
    })();
  }

  /** Wartungsjob (Rückfall): alle fälligen Angriffsphasen beenden → Anzahl */
  function fristenPruefen() {
    let n = 0;
    for (const a of sql.faellig.all(iso())) {
      const neu = pruefeFrist(a);
      if (neu && neu.status === 'beurteilung') n++;
    }
    return n;
  }

  /** angriffBis: fehlt/null → null; sonst ISO, in der Zukunft, höchstens 3 h ab jetzt → 400 */
  function pruefeAngriffBis(wert) {
    if (wert === undefined || wert === null) return null;
    const t = typeof wert === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(wert) ? Date.parse(wert) : NaN;
    if (!Number.isFinite(t)) throw new V.ValidationError('angriffBis muss eine Zeitangabe (ISO) sein.');
    if (t <= now()) throw new V.ValidationError('Das Ende der Angriffsphase muss in der Zukunft liegen.');
    if (t - now() > ANGRIFF_MAX_MS) throw new V.ValidationError('Die Angriffsphase dauert höchstens 3 Stunden.');
    return new Date(t).toISOString();
  }

  /** Arena der Lehrkraft (fremder Kurs → 404); Frist geprüft → { a, kurs } */
  function ladeLk(lk, id) {
    const aid = V.id(id, 'Arena');
    const roh = sql.eine.get(aid);
    if (!roh) throw new V.NotFoundError('Arena nicht gefunden.');
    let kurs;
    try {
      kurs = svc.kurse.kursFuer(lk, roh.kurs_id);
    } catch (e) {
      if (e instanceof V.NotFoundError) throw new V.NotFoundError('Arena nicht gefunden.');
      throw e;
    }
    return { a: pruefeFrist(roh), kurs };
  }

  /** POST /api/lehrer/kurse/:kursId/arena { angriffBis? } → Regie-Ansicht */
  function anlegen(lk, kursId, body) {
    const kurs = svc.kurse.kursFuer(lk, kursId);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const fremd = Object.keys(b).filter((k) => k !== 'angriffBis');
    if (fremd.length) throw new V.ValidationError(`Unbekanntes Feld: ${fremd[0]}`);
    const angriffBis = pruefeAngriffBis(b.angriffBis);
    const id = db.transaction(() => {
      if (sql.offen.get(kurs.id)) throw new V.ConflictError('In diesem Kurs ist schon eine Arena offen.');
      return Number(sql.neu.run(kurs.id, T.neuesSalz(zufallBytes), angriffBis, iso()).lastInsertRowid);
    })();
    return regieAnsicht(sql.eine.get(id));
  }

  /** POST /api/lehrer/arena/:id/phase { phase, angriffBis? } → Regie-Ansicht */
  function phase(lk, id, body) {
    const { a, kurs } = ladeLk(lk, id);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const ziel = b.phase;
    if (typeof ziel !== 'string' || !PHASEN.includes(ziel)) throw new V.ValidationError('Unbekannte Phase.');
    if (VON[ziel] !== a.status) throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[a.status]}‘ nicht.`);
    let angriffBis;
    if (ziel === 'angriff') {
      if (b.angriffBis !== undefined) angriffBis = pruefeAngriffBis(b.angriffBis);
      if (sql.anzahl.get(a.id).n < MIN_CHIFFREN) throw new V.ConflictError('Für die Arena braucht ihr mindestens zwei eingereichte Chiffren.');
    } else if (b.angriffBis !== undefined) {
      throw new V.ValidationError('angriffBis gilt nur beim Start der Angriffsphase.');
    }
    const neu = db.transaction(() => wechsle(a, ziel, { angriffBis }))();
    return regieAnsicht(neu);
  }

  /** DELETE /api/lehrer/arena/:id – jederzeit (Kaskade: Chiffren, Beurteilungen, Versuche) */
  function loesche(lk, id) {
    const { a, kurs } = ladeLk(lk, id);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    sql.loesche.run(a.id);
    return { ok: true };
  }

  /** offene Arena des Kurses, sonst die jüngste geschlossene, sonst null (Frist geprüft) */
  function arenaVonKurs(kursLokal) {
    const offen = sql.offen.get(kursLokal);
    if (offen) return pruefeFrist(offen);
    return sql.juengste.get(kursLokal) || null;
  }

  /** GET /api/lehrer/kurse/:kursId/arena → { arena } (auch bei gesperrtem Kurs lesbar) */
  function aktuellFuerKurs(lk, kursId) {
    const kurs = svc.kurse.kursFuer(lk, kursId);
    return { arena: regieAnsicht(arenaVonKurs(kurs.id)) };
  }

  /** GET /api/arena → { arena: { id, status, angriffBis } | null, team, eigene } */
  function aktuell(s) {
    const a = arenaVonKurs(s.kurs_id);
    const team = teams.teamVon(s.id);
    return {
      arena: a ? { id: a.id, status: a.status, angriffBis: a.angriff_bis } : null,
      team: team ? { id: team.id, nr: team.nr, name: team.name } : null,
      eigene: null
    };
  }

  return {
    PHASEN,
    anlegen,
    phase,
    loesche,
    aktuellFuerKurs,
    aktuell,
    pruefeFrist,
    fristenPruefen,
    beimPhasenwechsel,
    regieAnsicht,
    _intern: { sql, log }
  };
}

module.exports = { createArena, PHASEN };
