/* Kryptos – Funkraum-Dienst: Zustandsautomat, Regie (TECHNIK §12.1, §12.2, §12.5, Plan M7 Task 134, E107, E111, E113).
   Der Dienst kennt nur Zustandsautomat, Sichtbarkeit, Versionen, Grenzen und Löschung; jeder Szenario-Typ liefert seine
   Regeln als Modul `typen/<typ>.js` (Vertrag im Plan M7 „Gemeinsame Bausteine“). Jede Änderung erhöht
   `funk_szenarien.version` in derselben Transaktion. Zufall nur über `zufallBytes`, Zeit nur über `now`. */
'use strict';
const V = require('../../validate');
const Krypto = require('../../../public/static/js/shared/krypto');
const T = require('./text');
const L = require('./loeschen');
const Sz = require('./szenarien');

const TYP_MODULE = Object.freeze({
  botenlauf: require('./typen/botenlauf'),
  wettknacken: require('./typen/wettknacken'),
  'doppelter-schluessel': require('./typen/doppelter_schluessel'),
  schluesseltausch: require('./typen/schluesseltausch'),
  mallory: require('./typen/mallory')
});

const FRIST_MS = 24 * 3600 * 1000;
const STATUS_NAME = { vorbereitung: 'Vorbereitung', laeuft: 'läuft', pausiert: 'pausiert', auswertung: 'Auswertung' };
const AKTIONEN = ['starten', 'pausieren', 'fortsetzen', 'phase', 'beenden', 'schliessen', 'abbrechen'];
/** Übergänge: aktion → erlaubte Ausgangszustände */
const VON = {
  starten: ['vorbereitung'],
  pausieren: ['laeuft'],
  fortsetzen: ['pausiert'],
  phase: ['laeuft'],
  beenden: ['laeuft', 'pausiert'],
  schliessen: ['auswertung'],
  abbrechen: ['vorbereitung']
};
/** zulässige Optionen je Typ (Inhalte prüfen die Typen ab Task 138/139) */
const OPTIONEN = { 'doppelter-schluessel': ['wiederholerTeamId'], wettknacken: ['textId'] };

const GESPERRT = 'Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.';

/**
 * @param {{ db: import('better-sqlite3').Database, svc: object, teams: object, now: () => number,
 *           zufallBytes: (n: number) => Buffer, log?: Function, quelle?: string|null }} o
 *   quelle: Seed-Datei des Wettknackens (Tests; Standard SZENARIEN.wettknacken.quelle, Task 138)
 */
function createFunkraum({ db, svc, teams, now, zufallBytes, log = () => {}, quelle = null }) {
  const iso = (ms = now()) => new Date(ms).toISOString();
  const sql = {
    sz: db.prepare('SELECT * FROM funk_szenarien WHERE id = ?'),
    szKurs: db.prepare('SELECT * FROM funk_szenarien WHERE kurs_id = ?'),
    rollen: db.prepare(
      'SELECT r.team_id, r.rolle, r.partner_id, r.zustand, t.nr, t.name FROM funk_rollen r JOIN teams t ON t.id = r.team_id WHERE r.szenario_id = ? ORDER BY t.nr'
    ),
    kursTeams: db.prepare('SELECT id, nr, name FROM teams WHERE kurs_id = ? ORDER BY nr'),
    mitMitgliedern: db.prepare(
      'SELECT t.id, t.nr, t.name FROM teams t WHERE t.kurs_id = ? AND EXISTS (SELECT 1 FROM team_mitglieder m JOIN schueler s ON s.id = m.schueler_id WHERE m.team_id = t.id AND s.aktiv = 1) ORDER BY t.nr'
    ),
    neu: db.prepare(
      "INSERT INTO funk_szenarien (kurs_id, typ, status, phase, konfig, version, endet_spaetestens, created_at) VALUES (?, ?, 'vorbereitung', ?, ?, 1, ?, ?)"
    ),
    rolleNeu: db.prepare('INSERT INTO funk_rollen (szenario_id, team_id, rolle, partner_id) VALUES (?, ?, ?, ?)'),
    rollenLeeren: db.prepare('DELETE FROM funk_rollen WHERE szenario_id = ?'),
    zustand: db.prepare('UPDATE funk_rollen SET zustand = ? WHERE szenario_id = ? AND team_id = ?'),
    version: db.prepare('UPDATE funk_szenarien SET version = version + 1 WHERE id = ?'),
    ereignis: db.prepare('INSERT INTO funk_ereignisse (szenario_id, code, daten, version, zeit) VALUES (?, ?, ?, ?, ?)')
  };

  /** Kontext für die Typ-Module (Plan M7 „Szenario-Typ-Vertrag“) */
  function typCtx(sz) {
    const konfig = JSON.parse(sz.konfig || '{}');
    return {
      db,
      now,
      zufallBytes,
      krypto: Krypto,
      log,
      quelle,
      hash: (text) => T.hash(konfig.salz, text),
      version: () => sql.sz.get(sz.id).version
    };
  }

  /** Szenario-Zeile oder 404 (abgelaufene gelten als gelöscht – der Wartungsjob entfernt sie) */
  function lade(id) {
    const szId = V.id(id, 'Szenario');
    const sz = sql.sz.get(szId);
    if (!sz || Date.parse(sz.endet_spaetestens) <= now()) throw new V.NotFoundError('Szenario nicht gefunden.');
    return sz;
  }

  /** Szenario der Lehrkraft (fremder Kurs → 404) → { sz, kurs } */
  function ladeLk(lk, id) {
    const sz = lade(id);
    const kurs = svc.kurse.kursFuer(lk, sz.kurs_id);
    return { sz, kurs };
  }

  /** neue Version vergeben (in der Transaktion des Aufrufers) → Versionsnummer */
  function naechsteVersion(szId) {
    sql.version.run(szId);
    return sql.sz.get(szId).version;
  }

  function ereignis(szId, code, daten, version) {
    sql.ereignis.run(szId, code, JSON.stringify(daten || {}), version, iso());
  }

  function konfigVon(sz) {
    return JSON.parse(sz.konfig || '{}');
  }

  /** Regie-Ansicht – nie Salz, Schlüssel oder Lösungen aus konfig */
  function regieAnsicht(szId) {
    const sz = sql.sz.get(szId);
    if (!sz) return null;
    const k = Sz.SZENARIEN[sz.typ];
    const konfig = konfigVon(sz);
    return {
      id: sz.id,
      typ: sz.typ,
      titel: k.titel,
      status: sz.status,
      phase: sz.phase,
      phasen: [...k.phasen],
      version: sz.version,
      rollen: sql.rollen.all(sz.id).map((r) => ({ teamId: r.team_id, team: r.name, rolle: r.rolle, partnerId: r.partner_id })),
      optionen: konfig.optionen || {},
      endetSpaetestens: sz.endet_spaetestens,
      gestartetAt: sz.gestartet_at
    };
  }

  function pruefeOptionen(typ, optionen, teamIds) {
    if (optionen === undefined || optionen === null) return {};
    if (typeof optionen !== 'object' || Array.isArray(optionen)) throw new V.ValidationError('optionen muss ein Objekt sein.');
    const erlaubt = OPTIONEN[typ] || [];
    const out = {};
    for (const [key, wert] of Object.entries(optionen)) {
      if (!erlaubt.includes(key)) throw new V.ValidationError(`Unbekannte Option: ${key}`);
      if (wert === undefined || wert === null) continue;
      if (key === 'wiederholerTeamId' && (!Number.isInteger(wert) || !teamIds.includes(wert))) throw new V.ValidationError('Das Team gehört nicht zu diesem Kurs.');
      if (key === 'textId' && (typeof wert !== 'string' || !/^[a-z0-9-]{1,40}$/.test(wert))) throw new V.ValidationError('Unbekannter Text.');
      out[key] = wert;
    }
    return out;
  }

  /** POST /api/lehrer/kurse/:kursId/funk → Regie-Ansicht (Status vorbereitung) */
  function anlegen(lk, kursId, body) {
    const kurs = svc.kurse.kursFuer(lk, kursId);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const typ = b.typ;
    if (typeof typ !== 'string' || !Sz.TYPEN.includes(typ)) throw new V.ValidationError('Unbekannter Szenario-Typ.');
    const k = Sz.SZENARIEN[typ];
    const alleTeams = sql.kursTeams.all(kurs.id).map((t) => t.id);
    const rollen = b.rollen === undefined || b.rollen === null ? Sz.rollenVorschlag(typ, sql.mitMitgliedern.all(kurs.id)) : b.rollen;
    if (Array.isArray(rollen) && rollen.length < k.teamsMin) throw new V.ValidationError(`Für dieses Szenario braucht ihr mindestens ${k.teamsMin} Teams.`);
    const liste = Sz.pruefeRollen(typ, rollen, alleTeams);
    const optionen = pruefeOptionen(typ, b.optionen, alleTeams);
    const id = db.transaction(() => {
      if (sql.szKurs.get(kurs.id)) throw new V.ConflictError('In diesem Kurs gibt es schon ein Funkraum-Szenario.');
      const jetzt = now();
      const konfig = { salz: T.neuesSalz(zufallBytes), optionen };
      const szId = Number(sql.neu.run(kurs.id, typ, k.phasen[0], JSON.stringify(konfig), iso(jetzt + FRIST_MS), iso(jetzt)).lastInsertRowid);
      for (const r of liste) sql.rolleNeu.run(szId, r.teamId, r.rolle, r.partnerId);
      ereignis(szId, 'status', { status: 'vorbereitung' }, 1);
      return szId;
    })();
    return regieAnsicht(id);
  }

  /** PUT /api/lehrer/funk/:id/rollen – nur in vorbereitung */
  function rollenSetzen(lk, id, body) {
    const { sz, kurs } = ladeLk(lk, id);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    if (sz.status !== 'vorbereitung') throw new V.ConflictError('Rollen lassen sich nur vor dem Start tauschen.');
    const rollen = body && typeof body === 'object' ? body.rollen : undefined;
    const liste = Sz.pruefeRollen(sz.typ, rollen, sql.kursTeams.all(kurs.id).map((t) => t.id));
    db.transaction(() => {
      sql.rollenLeeren.run(sz.id);
      for (const r of liste) sql.rolleNeu.run(sz.id, r.teamId, r.rolle, r.partnerId);
      naechsteVersion(sz.id);
    })();
    return regieAnsicht(sz.id);
  }

  /** Callback für Beenden (Lehrkraft, Kurs gesperrt E111): typ-spezifische Auswertung, eine Transaktion */
  function beendeIntern(szId, jetztIso = iso()) {
    const sz = sql.sz.get(szId);
    if (!sz) return false;
    const typ = TYP_MODULE[sz.typ];
    return L.beenden(db, szId, {
      jetzt: jetztIso,
      auswertung: () => (typ && typeof typ.auswertung === 'function' ? typ.auswertung(typCtx(sz), sz) : L.auswertungGenerisch(db, szId))
    });
  }

  /** POST /api/lehrer/funk/:id/status { aktion } → Regie-Ansicht bzw. { geschlossen: true } */
  function status(lk, id, body) {
    const { sz, kurs } = ladeLk(lk, id);
    const aktion = body && typeof body === 'object' ? body.aktion : undefined;
    if (!AKTIONEN.includes(aktion)) throw new V.ValidationError('Unbekannte Aktion.');
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    const k = Sz.SZENARIEN[sz.typ];
    const typ = TYP_MODULE[sz.typ];
    const nein = () => new V.ConflictError(`Das geht im Zustand ‚${STATUS_NAME[sz.status] || sz.status}‘ nicht.`);
    if (!VON[aktion].includes(sz.status)) throw nein();
    if (aktion === 'schliessen' || aktion === 'abbrechen') {
      L.loesche(db, sz.id);
      return { geschlossen: true };
    }
    if (aktion === 'beenden') {
      beendeIntern(sz.id, iso());
      return regieAnsicht(sz.id);
    }
    db.transaction(() => {
      const aktuell = sql.sz.get(sz.id);
      if (!VON[aktion].includes(aktuell.status)) throw nein();
      if (aktion === 'starten') {
        const rollen = sql.rollen.all(sz.id);
        const ergebnis = (typ.start && typ.start(typCtx(aktuell), aktuell, rollen)) || {};
        const konfig = { ...konfigVon(aktuell), ...(ergebnis.konfig || {}) };
        for (const [teamId, z] of Object.entries(ergebnis.zustaende || {})) sql.zustand.run(JSON.stringify(z), sz.id, Number(teamId));
        const v = naechsteVersion(sz.id);
        db.prepare("UPDATE funk_szenarien SET status = 'laeuft', phase = ?, konfig = ?, gestartet_at = ? WHERE id = ?").run(k.phasen[0], JSON.stringify(konfig), iso(), sz.id);
        ereignis(sz.id, 'status', { status: 'laeuft' }, v);
        ereignis(sz.id, 'phase', { phase: k.phasen[0] }, v);
      } else if (aktion === 'pausieren' || aktion === 'fortsetzen') {
        const neu = aktion === 'pausieren' ? 'pausiert' : 'laeuft';
        const v = naechsteVersion(sz.id);
        db.prepare('UPDATE funk_szenarien SET status = ? WHERE id = ?').run(neu, sz.id);
        ereignis(sz.id, 'status', { status: neu }, v);
      } else if (aktion === 'phase') {
        const i = k.phasen.indexOf(aktuell.phase);
        if (i < 0 || i + 1 >= k.phasen.length) throw new V.ConflictError('Das ist schon die letzte Phase.');
        const v = naechsteVersion(sz.id);
        db.prepare('UPDATE funk_szenarien SET phase = ? WHERE id = ?').run(k.phasen[i + 1], sz.id);
        ereignis(sz.id, 'phase', { phase: k.phasen[i + 1] }, v);
      }
    })();
    return regieAnsicht(sz.id);
  }

  /** GET /api/lehrer/kurse/:kursId/funk → { szenario | null } (auch bei gesperrtem Kurs lesbar) */
  function aktuellFuerKurs(lk, kursId) {
    const kurs = svc.kurse.kursFuer(lk, kursId);
    const sz = sql.szKurs.get(kurs.id);
    return { szenario: sz && Date.parse(sz.endet_spaetestens) > now() ? regieAnsicht(sz.id) : null };
  }

  return { anlegen, rollenSetzen, status, aktuellFuerKurs, beendeIntern, regieAnsicht, TYP_MODULE, _intern: { lade, typCtx, sql, naechsteVersion, ereignis, konfigVon } };
}

module.exports = { createFunkraum, TYP_MODULE };
