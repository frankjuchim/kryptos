/* Kryptos – Chiffren-Werkstatt und Knack-Arena: Dienst (TECHNIK §9, §13.3/§13.4, Plan M7 Tasks 143–146, E101–E104).
   Phasen werkstatt → angriff → beurteilung → geschlossen; Ende der Angriffsphase `angriff_bis` beim nächsten Zugriff
   (jede Arena-Route, Beamer-Polling) und im Wartungsjob als Rückfall (E102). Klartexte und Schlüssel der Teams werden nie
   gespeichert – nur HMAC-SHA256(arena.salz, nurBuchstaben(klartext)); das Salz verlässt den Server nie.
   Zeit nur über `now`, Zufall nur über `zufallBytes` (E113). */
'use strict';
const crypto = require('node:crypto');
const V = require('../../validate');
const S = require('../../security');
const Krypto = require('../../../public/static/js/shared/krypto');
const T = require('../funkraum/text');

const PHASEN = Object.freeze(['werkstatt', 'angriff', 'beurteilung', 'geschlossen']);
const PHASE_NAME = Object.freeze({ werkstatt: 'Werkstatt', angriff: 'Angriff', beurteilung: 'Beurteilung', geschlossen: 'geschlossen' });
/** Übergänge: Zielphase → Ausgangsphase */
const VON = Object.freeze({ angriff: 'werkstatt', beurteilung: 'angriff', geschlossen: 'beurteilung' });
const MIN_CHIFFREN = 2;
const ANGRIFF_MAX_MS = 3 * 3600 * 1000;
/** Grenzen (TECHNIK §9.3/§9.4, §13.3): Klartext 150–300 Buchstaben, Darstellung ≤ 900, Beschreibung ≤ 2000;
    Einreichen 20 je Team in 10 min, Prüfen 60 je Teilnahme und Minute */
const GRENZEN = Object.freeze({
  klartextMin: 150,
  klartextMax: 300,
  darstellungMax: 900,
  beschreibungMax: 2000,
  rohMax: 20000,
  einreichen: { max: 20, ms: 10 * 60 * 1000 },
  pruefen: { max: 60, ms: 60 * 1000 },
  /** Angriffe (E101): 1 je 30 s je Team und Chiffre (W3 §9.4), 60 je Team in 10 min (TECHNIK §9.5) */
  angriffChiffreMs: 30 * 1000,
  angriffTeam: { max: 60, ms: 10 * 60 * 1000 },
  schluesselEintraege: 12,
  schluesselWortMax: 26,
  angriffKlartextMax: 2000
});
const VERFAHREN_FELDER = ['version', 'name', 'stufen'];
const STUFE_FELDER = ['typ', 'param'];
const EINREICHEN_FELDER = ['verfahren', 'schluessel', 'klartext', 'beschreibung'];

const GESPERRT = 'Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.';

/** 429 mit Retry-After (die Routen setzen den Kopf) */
class ZuVieleError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.status = 429;
    this.retryAfter = Math.max(1, Math.ceil(retryAfter));
  }
}

/** HMAC-SHA256(salz, nurBuchstaben(text)) – Arena normalisiert nur A–Z (E93, TECHNIK §9.4) */
function klartextHash(salz, text) {
  return crypto.createHmac('sha256', String(salz)).update(Krypto.nurBuchstaben(String(text)), 'utf8').digest('hex');
}

/** Geheimtext-Darstellung: Buchstaben in Fünfergruppen, nach XOR (letzte Stufe) Hex-Paare */
function darstellung(verfahren, roh) {
  const letzte = verfahren.stufen[verfahren.stufen.length - 1];
  return letzte && letzte.typ === 'xor' ? T.hexPaare(roh) : Krypto.gruppieren(roh, 5);
}

/** Form des Verfahrens (nur bekannte Felder) → neu serialisierbares Objekt aus den geprüften Feldern; sonst 400 */
function verfahrenForm(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new V.ValidationError('Das Verfahren muss ein Objekt sein.');
  const fremd = Object.keys(v).filter((k) => !VERFAHREN_FELDER.includes(k));
  if (fremd.length) throw new V.ValidationError(`Unbekanntes Feld im Verfahren: ${fremd[0]}`);
  if (!Array.isArray(v.stufen)) throw new V.ValidationError('Das Verfahren braucht eine Liste von Stufen.');
  const stufen = v.stufen.map((st) => {
    if (!st || typeof st !== 'object' || Array.isArray(st)) throw new V.ValidationError('Eine Stufe ist ungültig.');
    const f = Object.keys(st).filter((k) => !STUFE_FELDER.includes(k));
    if (f.length) throw new V.ValidationError(`Unbekanntes Feld im Verfahren: ${f[0]}`);
    if (st.param === undefined) return { typ: st.typ };
    if (!st.param || typeof st.param !== 'object' || Array.isArray(st.param)) throw new V.ValidationError('Parameter einer Stufe müssen ein Objekt sein.');
    const param = {};
    for (const [k, w] of Object.entries(st.param)) {
      if (typeof w !== 'string' && typeof w !== 'number') throw new V.ValidationError('Parameterwerte sind Zahlen, Wörter oder Platzhalter.');
      param[k] = w;
    }
    return { typ: st.typ, param };
  });
  const out = { version: v.version };
  if (v.name !== undefined) out.name = v.name;
  out.stufen = stufen;
  return out;
}

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
    loesche: db.prepare('DELETE FROM arena WHERE id = ?'),
    chiffreTeam: db.prepare('SELECT * FROM arena_chiffren WHERE arena_id = ? AND team_id = ?'),
    upsert: db.prepare(
      `INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, hinweise, eingereicht_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(arena_id, team_id) DO UPDATE SET verfahren = excluded.verfahren, beschreibung = excluded.beschreibung,
         geheimtext = excluded.geheimtext, klartext_hash = excluded.klartext_hash, klartext_laenge = excluded.klartext_laenge,
         hinweise = excluded.hinweise, eingereicht_at = excluded.eingereicht_at`
    )
  };
  const sqlV = {
    chiffre: db.prepare('SELECT * FROM arena_chiffren WHERE id = ? AND arena_id = ?'),
    letzterAufChiffre: db.prepare('SELECT MAX(zeit) AS zeit FROM arena_versuche WHERE chiffre_id = ? AND team_id = ?'),
    imFenster: db.prepare('SELECT COUNT(*) AS n, MIN(zeit) AS erster FROM arena_versuche WHERE arena_id = ? AND team_id = ? AND zeit > ?'),
    neu: db.prepare('INSERT INTO arena_versuche (arena_id, chiffre_id, team_id, schueler_id, art, erfolg, zeit) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    geknackt: db.prepare('UPDATE arena_chiffren SET geknackt_at = ? WHERE id = ? AND geknackt_at IS NULL')
  };
  const einreichLimit = new S.Limiter({ max: GRENZEN.einreichen.max, windowMs: GRENZEN.einreichen.ms });
  const pruefLimit = new S.Limiter({ max: GRENZEN.pruefen.max, windowMs: GRENZEN.pruefen.ms });

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

  /** eigene Chiffre des Teams (nur für Teammitglieder; eigene Hinweise sofort, E104) */
  function eigeneAnsicht(c) {
    if (!c) return null;
    return {
      verfahren: JSON.parse(c.verfahren),
      geheimtext: c.geheimtext,
      beschreibung: c.beschreibung,
      beurteilung: c.beurteilung,
      klartextLaenge: c.klartext_laenge,
      hinweise: JSON.parse(c.hinweise || '[]')
    };
  }

  /** GET /api/arena → { arena: { id, status, angriffBis } | null, team, eigene } */
  function aktuell(s) {
    const a = arenaVonKurs(s.kurs_id);
    const team = teams.teamVon(s.id);
    return {
      arena: a ? { id: a.id, status: a.status, angriffBis: a.angriff_bis } : null,
      team: team ? { id: team.id, nr: team.nr, name: team.name } : null,
      eigene: a && team ? eigeneAnsicht(sql.chiffreTeam.get(a.id, team.id)) : null
    };
  }

  /** Arena des eigenen Kurses (fremde → 404, Frist geprüft) und Team der Teilnahme (ohne → 403) */
  function teilnehmer(s, id) {
    const aid = V.id(id, 'Arena');
    const roh = sql.eine.get(aid);
    if (!roh || roh.kurs_id !== s.kurs_id) throw new V.NotFoundError('Arena nicht gefunden.');
    const team = teams.teamVon(s.id);
    if (!team) throw new V.ForbiddenError('Du bist keinem Team zugeteilt.');
    return { a: pruefeFrist(roh), team };
  }

  /** KryptoFehler der Bibliothek → 400; alles andere weiterwerfen */
  function bibliothek(f) {
    try {
      return f();
    } catch (e) {
      if (e && e.name === 'KryptoFehler') throw new V.ValidationError(e.message);
      throw e;
    }
  }

  /**
   * POST /api/werkstatt/pruefen { verfahren, schluessel, text } → { ok, fehler, geheimtext, zwischen, rueck } – ohne
   * Hinweise (TECHNIK §13.3), speichert nichts. 60 je Teilnahme und Minute.
   */
  function pruefen(s, body) {
    const jetzt = now();
    const key = 's:' + s.id;
    if (!pruefLimit.take(key, jetzt)) throw new ZuVieleError('Zu viele Prüfungen – höchstens 60 in der Minute.', pruefLimit.retryAfterSec(key, jetzt));
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    if (typeof b.text !== 'string' || b.text.length > GRENZEN.rohMax) throw new V.ValidationError('Gib einen Text zum Prüfen an.');
    const p = bibliothek(() => Krypto.baukasten.pruefe(b.verfahren, b.schluessel, { klartext: b.text }));
    if (!p.ok) return { ok: false, fehler: p.fehler, geheimtext: null, zwischen: [], rueck: false };
    const v = bibliothek(() => Krypto.baukasten.verschluesseln(b.verfahren, b.schluessel, b.text));
    const rueck = bibliothek(() => Krypto.baukasten.entschluesseln(b.verfahren, b.schluessel, v.geheimtext)) === Krypto.nurBuchstaben(b.text);
    return { ok: true, fehler: [], geheimtext: v.geheimtext ? darstellung(b.verfahren, v.geheimtext) : '', zwischen: v.zwischen, rueck };
  }

  /**
   * POST /api/arena/:id/chiffre { verfahren, schluessel, klartext, beschreibung } → { ok, geheimtext }.
   * Speichert Verfahren, Beschreibung, Geheimtext, HMAC des Klartexts, Länge, Hinweise – Schlüssel und Klartext nie.
   */
  function einreichen(s, id, body) {
    const { a, team } = teilnehmer(s, id);
    const jetzt = now();
    const key = 't:' + team.id;
    if (!einreichLimit.take(key, jetzt)) throw new ZuVieleError('Höchstens 20 Einreichungen je Team in 10 Minuten.', einreichLimit.retryAfterSec(key, jetzt));
    if (a.status !== 'werkstatt') throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[a.status]}‘ nicht.`);
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const fremd = Object.keys(b).filter((k) => !EINREICHEN_FELDER.includes(k));
    if (fremd.length) throw new V.ValidationError(`Unbekanntes Feld: ${fremd[0]}`);
    const verfahren = verfahrenForm(b.verfahren);
    if (typeof b.klartext !== 'string' || b.klartext.length > GRENZEN.rohMax) throw new V.ValidationError('Euer Klartext fehlt.');
    const p = bibliothek(() => Krypto.baukasten.pruefe(verfahren, b.schluessel, { klartext: b.klartext }));
    if (!p.ok) throw new V.ValidationError(p.fehler[0], p.fehler);
    const laenge = Krypto.nurBuchstaben(b.klartext).length;
    if (laenge < GRENZEN.klartextMin || laenge > GRENZEN.klartextMax) {
      throw new V.ValidationError(`Euer Text braucht ${GRENZEN.klartextMin} bis ${GRENZEN.klartextMax} Buchstaben (jetzt ${laenge}).`);
    }
    const roh = bibliothek(() => Krypto.baukasten.verschluesseln(verfahren, b.schluessel, b.klartext)).geheimtext;
    const geheimtext = darstellung(verfahren, roh);
    if (geheimtext.length > GRENZEN.darstellungMax) throw new V.ValidationError(`Der Geheimtext ist zu lang (höchstens ${GRENZEN.darstellungMax} Zeichen).`);
    const beschreibung = typeof b.beschreibung === 'string' ? b.beschreibung.trim() : '';
    if (beschreibung.length < 1 || beschreibung.length > GRENZEN.beschreibungMax) {
      throw new V.ValidationError(`Die Beschreibung braucht 1 bis ${GRENZEN.beschreibungMax} Zeichen.`);
    }
    db.transaction(() => {
      const frisch = sql.eine.get(a.id);
      if (!frisch || frisch.status !== 'werkstatt') throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[frisch ? frisch.status : a.status]}‘ nicht.`);
      sql.upsert.run(a.id, team.id, JSON.stringify(verfahren), beschreibung, geheimtext, klartextHash(frisch.salz, b.klartext), laenge, JSON.stringify(p.hinweise), iso(jetzt));
    })();
    return { ok: true, geheimtext };
  }

  /** Form eines geratenen Schlüssels: Objekt, ≤ 12 Einträge, Namen wie Platzhalter, Werte Text ≤ 26 oder Ganzzahl → 400 */
  function schluesselForm(k) {
    const meldung = `Der Schlüssel ist ein Objekt mit höchstens ${GRENZEN.schluesselEintraege} Einträgen (Wörter bis ${GRENZEN.schluesselWortMax} Zeichen oder ganze Zahlen).`;
    if (!k || typeof k !== 'object' || Array.isArray(k)) throw new V.ValidationError(meldung);
    const eintraege = Object.entries(k);
    if (eintraege.length < 1 || eintraege.length > GRENZEN.schluesselEintraege) throw new V.ValidationError(meldung);
    for (const [name, w] of eintraege) {
      if (!/^[a-z][a-z0-9]{0,11}$/.test(name)) throw new V.ValidationError(meldung);
      const ok = (typeof w === 'string' && w.length >= 1 && w.length <= GRENZEN.schluesselWortMax) || (Number.isInteger(w) && Math.abs(w) <= 1e6);
      if (!ok) throw new V.ValidationError(meldung);
    }
  }

  /**
   * Orakel-Grenzen aus arena_versuche (gezählte Versuche, gleitendes Fenster): 1 je 30 s je Team und Chiffre, 60 je Team in
   * 10 min. Erst beide prüfen, dann zählt der Aufrufer (Zeile in arena_versuche). → Anzahl im Team-Fenster vor diesem Versuch
   */
  function pruefeGrenzen(a, c, team, jetzt) {
    const letzter = sqlV.letzterAufChiffre.get(c.id, team.id).zeit;
    if (letzter && Date.parse(letzter) > jetzt - GRENZEN.angriffChiffreMs) {
      throw new ZuVieleError('Ein Versuch je 30 Sekunden auf dieselbe Chiffre.', (Date.parse(letzter) + GRENZEN.angriffChiffreMs - jetzt) / 1000);
    }
    const f = sqlV.imFenster.get(a.id, team.id, iso(jetzt - GRENZEN.angriffTeam.ms));
    if (f.n >= GRENZEN.angriffTeam.max) {
      throw new ZuVieleError(
        `Euer Team hat in 10 Minuten ${GRENZEN.angriffTeam.max} Angriffe gestartet – Brute Force gehört ins Kryptolabor.`,
        (Date.parse(f.erster) + GRENZEN.angriffTeam.ms - jetzt) / 1000
      );
    }
    return f.n;
  }

  /**
   * POST /api/arena/:id/chiffren/:cid/angriff { klartext } | { schluessel } → { erfolg, geknackt, rest: { chiffre, team } }.
   * Eingereichte Klartexte und Schlüssel werden nie gespeichert; arena_versuche ohne Inhalt. Abgelehnte Versuche zählen nicht.
   */
  function angriff(s, id, cidRoh, body) {
    const { a, team } = teilnehmer(s, id);
    if (a.status !== 'angriff') throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[a.status]}‘ nicht.`);
    const c = sqlV.chiffre.get(V.id(cidRoh, 'Chiffre'), a.id);
    if (!c) throw new V.NotFoundError('Chiffre nicht gefunden.');
    if (c.team_id === team.id) throw new V.ValidationError('Eure eigene Chiffre könnt ihr nicht angreifen.');
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const mitK = b.klartext !== undefined && b.klartext !== null;
    const mitS = b.schluessel !== undefined && b.schluessel !== null;
    if (mitK === mitS) throw new V.ValidationError('Gebt entweder einen Klartext oder einen Schlüssel an.');
    const verfahren = JSON.parse(c.verfahren);
    let art;
    if (mitK) {
      art = 'klartext';
      if (typeof b.klartext !== 'string' || b.klartext.length > GRENZEN.angriffKlartextMax || !Krypto.nurBuchstaben(b.klartext).length) {
        throw new V.ValidationError(`Der Klartext braucht Buchstaben (höchstens ${GRENZEN.angriffKlartextMax} Zeichen).`);
      }
    } else {
      art = 'schluessel';
      schluesselForm(b.schluessel);
      // fehlende oder ungültige Platzhalterwerte → 400 (zählt nicht)
      const p = bibliothek(() => Krypto.baukasten.pruefe(verfahren, b.schluessel));
      if (!p.ok) throw new V.ValidationError(p.fehler[0]);
    }
    const jetzt = now();
    const vorher = pruefeGrenzen(a, c, team, jetzt);
    let kandidat = null;
    if (art === 'klartext') kandidat = b.klartext;
    else {
      try {
        kandidat = Krypto.baukasten.entschluesseln(verfahren, b.schluessel, c.geheimtext.replace(/ /g, ''));
      } catch (e) {
        if (!(e && e.name === 'KryptoFehler')) throw e;
        kandidat = null; // z. B. nicht druckbare Bytes nach falschem XOR-Schlüssel → Fehlversuch (zählt)
      }
    }
    const erfolg = kandidat !== null && T.gleich(klartextHash(a.salz, kandidat), c.klartext_hash);
    const geknackt = db.transaction(() => {
      const frisch = sql.eine.get(a.id);
      if (!frisch || frisch.status !== 'angriff') throw new V.ConflictError(`Das geht in der Phase ‚${PHASE_NAME[frisch ? frisch.status : a.status]}‘ nicht.`);
      pruefeGrenzen(a, c, team, jetzt);
      sqlV.neu.run(a.id, c.id, team.id, s.id, art, erfolg ? 1 : 0, iso(jetzt));
      if (erfolg) sqlV.geknackt.run(iso(jetzt), c.id);
      return !!sqlV.chiffre.get(c.id, a.id).geknackt_at;
    })();
    // Abzeichen „Arena-Knacker“ (Task 147) an alle aktuellen Mitglieder des angreifenden Teams
    if (erfolg) for (const m of teams.mitglieder(team.id)) svc.stand.pruefeAbzeichen({ id: m.id });
    return { erfolg, geknackt, rest: { chiffre: Math.ceil(GRENZEN.angriffChiffreMs / 1000), team: Math.max(0, GRENZEN.angriffTeam.max - vorher - 1) } };
  }

  return {
    PHASEN,
    anlegen,
    phase,
    loesche,
    aktuellFuerKurs,
    aktuell,
    pruefen,
    einreichen,
    angriff,
    GRENZEN,
    pruefeFrist,
    fristenPruefen,
    beimPhasenwechsel,
    regieAnsicht,
    _intern: { sql, log }
  };
}

module.exports = { createArena, PHASEN, GRENZEN, klartextHash, darstellung };
