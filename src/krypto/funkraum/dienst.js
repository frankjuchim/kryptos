/* Kryptos – Funkraum-Dienst: Zustandsautomat, Regie, Stand/Polling (TECHNIK §12.1–§12.5, Plan M7 Tasks 134–136,
   E99, E107, E109–E111, E113).
   Der Dienst kennt nur Zustandsautomat, Sichtbarkeit, Versionen, Grenzen und Löschung; jeder Szenario-Typ liefert seine
   Regeln als Modul `typen/<typ>.js` (Vertrag im Plan M7 „Gemeinsame Bausteine“). Jede Änderung erhöht
   `funk_szenarien.version` in derselben Transaktion. Zufall nur über `zufallBytes`, Zeit nur über `now`. */
'use strict';
const V = require('../../validate');
const Krypto = require('../../../public/static/js/shared/krypto');
const T = require('./text');
const L = require('./loeschen');
const Sz = require('./szenarien');
const { BOSS_KULANZ_MS } = require('../../domain');
const S = require('../../security');
const { walLeeren } = require('../../verbund/loeschen');

const TYP_MODULE = Object.freeze({
  botenlauf: require('./typen/botenlauf'),
  wettknacken: require('./typen/wettknacken'),
  'doppelter-schluessel': require('./typen/doppelter_schluessel'),
  schluesseltausch: require('./typen/schluesseltausch'),
  mallory: require('./typen/mallory')
});

const FRIST_MS = 24 * 3600 * 1000;
/** letzte Phase jedes Szenarios (TECHNIK §12.6): nur Anzeige, keine Team-Aktionen mehr (Review M7 W1) */
const AUFLOESUNG = 'aufloesung';
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

/** Grenzen (TECHNIK §12.3): 1 Nachricht je Team in 10 s, 200 je Szenario, 30 Prüfversuche je Team in 5 min, stumm 1–300 s */
const GRENZEN = Object.freeze({ sendenMs: 10 * 1000, maxNachrichten: 200, versuche: 30, versucheMs: 5 * 60 * 1000, stummMax: 300 });

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

  /**
   * Kontext für die Typ-Module (Plan M7 „Szenario-Typ-Vertrag“). Lesende Hilfen gelten überall; die schreibenden
   * (`neueVersion`, `ereignis`, `setzeKonfig`, `setzeZustand`, `neueNachricht`, `aendereNachricht`) rufen die Typen nur in
   * Aktionen, die der Dienst in EINE Transaktion legt (Tasks 137–141). Inhalte gehen nur über die Whitelist.
   */
  function typCtx(sz) {
    const konfig = JSON.parse(sz.konfig || '{}');
    const ctx = {
      db,
      now,
      iso,
      zufallBytes,
      krypto: Krypto,
      log,
      quelle,
      hash: (text) => T.hash(konfig.salz, text),
      version: () => sql.sz.get(sz.id).version,
      /** frische Szenario-Zeile */
      szenario: () => sql.sz.get(sz.id),
      konfig: () => konfigVon(sql.sz.get(sz.id)),
      setzeKonfig: (k) => db.prepare('UPDATE funk_szenarien SET konfig = ? WHERE id = ?').run(JSON.stringify(k), sz.id),
      rollen: () => sql.rollen.all(sz.id).map((r) => ({ ...r, zustand: JSON.parse(r.zustand || '{}') })),
      zustand: (teamId) => {
        const r = db.prepare('SELECT zustand FROM funk_rollen WHERE szenario_id = ? AND team_id = ?').get(sz.id, teamId);
        return r ? JSON.parse(r.zustand || '{}') : null;
      },
      setzeZustand: (teamId, z) => sql.zustand.run(JSON.stringify(z), sz.id, teamId),
      nachricht: (nid) => db.prepare('SELECT * FROM funk_nachrichten WHERE id = ? AND szenario_id = ?').get(nid, sz.id),
      nachrichten: () => db.prepare('SELECT * FROM funk_nachrichten WHERE szenario_id = ? ORDER BY id').all(sz.id),
      ereignisse: (code) =>
        db
          .prepare('SELECT id, code, daten, version, zeit FROM funk_ereignisse WHERE szenario_id = ? AND code = ? ORDER BY id')
          .all(sz.id, code)
          .map((e) => ({ ...e, daten: JSON.parse(e.daten || '{}') })),
      /** Runde (Phase) zu einer Version: Phase, deren phase-Ereignis die größte Version ≤ v hat (E91) */
      phaseZu: (v) => {
        let p = null;
        for (const e of ctx.ereignisse('phase')) if (e.version <= v) p = e.daten.phase;
        return p;
      },
      neueVersion: () => naechsteVersion(sz.id),
      ereignis: (code, daten, v) => ereignis(sz.id, code, daten, v),
      /** neue Nachricht (Inhalt über die Whitelist, 200er-Grenze) → id */
      neueNachricht: ({ von, an = null, angezeigtVon = null, schuelerId, art = 'nachricht', inhalt, fuerSchluessel = null, klartextHash = null }, v) => {
        if (sqlN.anzahl.get(sz.id).n >= GRENZEN.maxNachrichten) throw new V.ConflictError(`In diesem Szenario wurden schon ${GRENZEN.maxNachrichten} Nachrichten gesendet.`);
        return Number(sqlN.neu.run(sz.id, von, an, angezeigtVon, schuelerId, art, T.pruefeInhalt(inhalt), fuerSchluessel, klartextHash, v, iso()).lastInsertRowid);
      },
      /** Nachricht ändern (angekommen, geknackt_von …) – setzt die Version neu (E109) */
      aendereNachricht: (nid, felder, v) => {
        const erlaubt = ['angekommen', 'geknackt_von'];
        for (const [k, w] of Object.entries(felder)) {
          if (!erlaubt.includes(k)) throw new Error('aendereNachricht: Feld ' + k);
          db.prepare(`UPDATE funk_nachrichten SET ${k} = ? WHERE id = ?`).run(w, nid);
        }
        db.prepare('UPDATE funk_nachrichten SET version = ? WHERE id = ?').run(v, nid);
      }
    };
    return ctx;
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
    // Typ-Vorbedingung (Wettknacken: Seed-Text vorhanden, Task 138)
    const typMod = TYP_MODULE[typ];
    if (typeof typMod.pruefeAnlegen === 'function') typMod.pruefeAnlegen({ quelle, log, krypto: Krypto }, optionen, liste);
    let abgelaufenWeg = false;
    const id = db.transaction(() => {
      const alt = sql.szKurs.get(kurs.id);
      // abgelaufen (24 h), aber der Wartungsjob lief noch nicht: vorher löschen statt 409 (Review M7 K2)
      if (alt && Date.parse(alt.endet_spaetestens) <= now()) {
        db.prepare('DELETE FROM funk_szenarien WHERE id = ?').run(alt.id);
        abgelaufenWeg = true;
      } else if (alt) throw new V.ConflictError('In diesem Kurs gibt es schon ein Funkraum-Szenario.');
      const jetzt = now();
      const konfig = { salz: T.neuesSalz(zufallBytes), optionen };
      const szId = Number(sql.neu.run(kurs.id, typ, k.phasen[0], JSON.stringify(konfig), iso(jetzt + FRIST_MS), iso(jetzt)).lastInsertRowid);
      for (const r of liste) sql.rolleNeu.run(szId, r.teamId, r.rolle, r.partnerId);
      ereignis(szId, 'status', { status: 'vorbereitung' }, 1);
      return szId;
    })();
    if (abgelaufenWeg) walLeeren(db);
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
    const beendet = L.beenden(db, szId, {
      jetzt: jetztIso,
      auswertung: () => (typ && typeof typ.auswertung === 'function' ? typ.auswertung(typCtx(sz), sz) : L.auswertungGenerisch(db, szId))
    });
    // „Funkraum-Veteran“ (TECHNIK §12.7, Plan M7 Task 147): alle aktiven Mitglieder der Teams mit Rolle prüfen
    if (beendet) for (const r of sql.rollen.all(szId)) for (const m of teams.mitglieder(r.team_id)) svc.stand.pruefeAbzeichen({ id: m.id });
    return beendet;
  }

  /** POST /api/lehrer/funk/:id/status { aktion } → Regie-Ansicht bzw. { geschlossen: true } */
  function status(lk, id, body) {
    const { sz, kurs } = ladeLk(lk, id);
    const aktion = body && typeof body === 'object' ? body.aktion : undefined;
    if (!AKTIONEN.includes(aktion)) throw new V.ValidationError('Unbekannte Aktion.');
    const k = Sz.SZENARIEN[sz.typ];
    const typ = TYP_MODULE[sz.typ];
    const nein = () => new V.ConflictError(`Das geht im Zustand ‚${STATUS_NAME[sz.status] || sz.status}‘ nicht.`);
    // Löschende Aktionen auch im gesperrten Kurs (Datensparsamkeit, Review M7 K1)
    if (aktion === 'schliessen' || aktion === 'abbrechen') {
      if (!VON[aktion].includes(sz.status)) throw nein();
      L.loesche(db, sz.id);
      return { geschlossen: true };
    }
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    if (!VON[aktion].includes(sz.status)) throw nein();
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

  /* ---------- Stand und Polling (TECHNIK §12.4, Plan M7 Task 135, E99, E109, E110) ---------- */

  const sqlStand = {
    nachrichten: db.prepare('SELECT * FROM funk_nachrichten WHERE szenario_id = ? AND version > ? ORDER BY id'),
    ereignisse: db.prepare('SELECT id, code, daten, version, zeit FROM funk_ereignisse WHERE szenario_id = ? AND version > ? ORDER BY id'),
    laufenderBoss: db.prepare('SELECT 1 FROM boss_versuche WHERE schueler_id = ? AND ende_at IS NULL AND deadline_at > ? LIMIT 1'),
    wechsel: db.prepare("SELECT 1 FROM funk_ereignisse WHERE szenario_id = ? AND version > ? AND code IN ('phase', 'status') LIMIT 1")
  };

  /** Sicht-Teil des ETags (Review M7 K3): Beamer, Regie oder Team + Rolle – ein Team- oder Rollenwechsel ändert den ETag */
  const sichtVon = (ansicht, betrachter) =>
    ansicht === 'beamer' ? '-beamer' : ansicht === 'regie' || !betrachter ? '' : `-t${betrachter.teamId}-${betrachter.rolle || 'ohne'}`;
  const etagVon = (sz, ansicht, betrachter) => `"${sz.id}-${sz.version}${sichtVon(ansicht, betrachter)}"`;
  /** Sicht-Teil eines (alten) ETags `"<id>-<version><sicht>"` oder null */
  function sichtAusEtag(etag) {
    const m = typeof etag === 'string' ? /^"\d+-\d+(.*)"$/.exec(etag) : null;
    return m ? m[1] : null;
  }

  /** seit nach E110: fehlt, nicht ganzzahlig, ≤ 0 oder > Version → 0 (Vollstand) */
  function seitVon(seit, version) {
    const n = typeof seit === 'string' && /^\d{1,15}$/.test(seit) ? Number(seit) : Number.isInteger(seit) ? seit : 0;
    return n > 0 && n <= version ? n : 0;
  }

  /** 304 nach E110: If-None-Match = aktueller ETag; ohne ETag: seit = Version. Ein mitgeschickter ETag einer anderen
      Sicht (Team-/Rollenwechsel, K3) ist nie „unverändert“ – auch wenn seit = Version. */
  function unveraendert(sz, { seit, etag }, ansicht, betrachter) {
    const aktuell = etagVon(sz, ansicht, betrachter);
    if (typeof etag === 'string' && etag !== '') return etag === aktuell;
    return seitVon(seit, sz.version) === sz.version;
  }

  /** wirksames seit (Review M7 W2/K3): 0 = Vollstand, wenn seit ungültig ist, der Client eine andere Sicht hatte (ETag)
      oder sich Phase bzw. Status seit `seit` geändert haben – dann ändert sich die Sichtbarkeit älterer Inhalte (Mallory-
      Umschläge, verdeckte Ereignisse), ein Delta mit version > seit enthielte sie nicht. */
  function seitWirksam(sz, { seit, etag }, ansicht, betrachter) {
    const n = seitVon(seit, sz.version);
    if (n === 0) return 0;
    const alt = sichtAusEtag(etag);
    if (alt !== null && alt !== sichtVon(ansicht, betrachter)) return 0;
    return sqlStand.wechsel.get(sz.id, n) ? 0 : n;
  }

  /** Nachricht für einen Betrachter → Stand-Objekt oder null (nicht sichtbar). Nie klartext_hash, von_schueler_id. */
  function nachrichtFuer(sz, typ, ctx, n, betrachter) {
    const k = Sz.SZENARIEN[sz.typ];
    const sicht = k.sicht || {};
    let s = null;
    if (betrachter.art === 'regie') s = { sichtbar: true, lesbar: true };
    else if (betrachter.art === 'team') {
      const eigen = n.von_team_id === betrachter.teamId || n.an_team_id === betrachter.teamId;
      const alle = betrachter.rolle && sicht[betrachter.rolle] === 'alle';
      const oeffentlich = n.an_team_id === null || (sicht.alle === 'oeffentlich' && n.art === 'oeffentlich');
      // typ.sichtVorrang (Mallory, Task 141): der Typ entscheidet auch über eigene Nachrichten (verschlossene Umschläge)
      if (typ.sichtVorrang && typeof typ.sicht === 'function') s = typ.sicht(ctx, sz, n, betrachter);
      else if (eigen || alle || oeffentlich) s = { sichtbar: true, lesbar: true };
      else if (typeof typ.sicht === 'function') s = typ.sicht(ctx, sz, n, betrachter);
    } else {
      // Beamer: öffentliche Sicht – alles außer verdeckten Arten, die der Typ festlegt (E99)
      s = typeof typ.sicht === 'function' ? typ.sicht(ctx, sz, n, betrachter) : { sichtbar: true, lesbar: true };
    }
    if (!s || !s.sichtbar) return null;
    const ausgeblendet = n.sichtbar === 0;
    const inhalt = ausgeblendet ? '' : s.lesbar ? (typeof s.inhalt === 'string' ? s.inhalt : n.inhalt) : typeof s.inhalt === 'string' ? s.inhalt : '';
    return {
      id: n.id,
      von: n.von_team_id,
      an: n.an_team_id,
      angezeigtVon: n.angezeigt_von,
      art: n.art,
      inhalt,
      lesbar: !!s.lesbar && !ausgeblendet,
      ausgeblendet,
      angekommen: !!n.angekommen,
      geknackt: n.geknackt_von !== null,
      zeit: n.zeit,
      version: n.version
    };
  }

  /** gemeinsamer Teil der Stand-Antwort */
  function standDaten(sz, seit, betrachter, ansicht) {
    const k = Sz.SZENARIEN[sz.typ];
    const typ = TYP_MODULE[sz.typ];
    const ctx = typCtx(sz);
    const rollen = sql.rollen.all(sz.id);
    const rolleVon = new Map(rollen.map((r) => [r.team_id, r]));
    const ohneRolle = betrachter.art === 'team' && !betrachter.rolle;
    const nachrichten = ohneRolle
      ? []
      : sqlStand.nachrichten.all(sz.id, seit).map((n) => nachrichtFuer(sz, typ, ctx, n, betrachter)).filter(Boolean);
    const ereignisse = sqlStand.ereignisse
      .all(sz.id, seit)
      .filter((e) => typeof typ.ereignisSicht !== 'function' || typ.ereignisSicht(ctx, sz, e, betrachter))
      .map((e) => ({ id: e.id, code: e.code, daten: JSON.parse(e.daten || '{}'), zeit: e.zeit, version: e.version }));
    const konfig = konfigVon(sz);
    let auswertung = null;
    if (sz.status === 'auswertung') auswertung = konfig.auswertung || null;
    else if (betrachter.art !== 'team' && sz.phase === 'aufloesung' && typeof typ.auswertung === 'function') auswertung = typ.auswertung(ctx, sz);
    return {
      id: sz.id,
      typ: sz.typ,
      titel: k.titel,
      version: sz.version,
      // true = vollständiger Stand (Client ersetzt), false = nur Neues seit `seit` (Client führt zusammen), Review M7 W2
      voll: seit === 0,
      status: sz.status,
      phase: sz.phase,
      phasen: [...k.phasen],
      teams: sql.kursTeams.all(sz.kurs_id).map((t) => ({ id: t.id, nr: t.nr, name: t.name, rolle: rolleVon.has(t.id) ? rolleVon.get(t.id).rolle : null })),
      nachrichten,
      ereignisse,
      anzeigen: (typeof typ.anzeigen === 'function' && !ohneRolle && typ.anzeigen(ctx, sz, betrachter.art === 'team' ? 'schueler' : ansicht, betrachter)) || {},
      auswertung
    };
  }

  /** GET /api/funk → Szenario des Kurses und eigenes Team (Kopfzeilen-Punkt) */
  function aktuell(s) {
    const sz = sql.szKurs.get(s.kurs_id);
    const team = teams.teamVon(s.id);
    return {
      szenario: sz && Date.parse(sz.endet_spaetestens) > now() ? { id: sz.id, typ: sz.typ, titel: Sz.SZENARIEN[sz.typ].titel, status: sz.status, phase: sz.phase } : null,
      team: team ? { id: team.id, nr: team.nr, name: team.name } : null
    };
  }

  /** Team + Rolle einer Teilnahme in einem Szenario ihres Kurses (fremdes → 404, ohne Team → 403) */
  function teilnehmer(s, id) {
    const sz = lade(id);
    if (sz.kurs_id !== s.kurs_id) throw new V.NotFoundError('Szenario nicht gefunden.');
    const team = teams.teamVon(s.id);
    if (!team) throw new V.ForbiddenError('Du bist keinem Team zugeteilt.');
    const r = db.prepare('SELECT rolle, partner_id, zustand FROM funk_rollen WHERE szenario_id = ? AND team_id = ?').get(sz.id, team.id);
    const betrachter = { art: 'team', teamId: team.id, rolle: r ? r.rolle : null, partner: r ? r.partner_id : null, schuelerId: s.id };
    return { sz, team, rolleZeile: r || null, betrachter };
  }

  /** GET /api/funk/:id/stand → { etag, daten | null } (null = 304). Schreibt nichts. */
  function stand(s, id, { seit, etag } = {}) {
    const { sz, team, rolleZeile, betrachter } = teilnehmer(s, id);
    const tag = etagVon(sz, 'schueler', betrachter);
    if (unveraendert(sz, { seit, etag }, 'schueler', betrachter)) return { etag: tag, daten: null };
    const typ = TYP_MODULE[sz.typ];
    const ctx = typCtx(sz);
    const daten = standDaten(sz, seitWirksam(sz, { seit, etag }, 'schueler', betrachter), betrachter, 'schueler');
    const stumm = (konfigVon(sz).stumm || {})[team.id];
    daten.ich = {
      team: { id: team.id, nr: team.nr, name: team.name },
      rolle: betrachter.rolle,
      partner: betrachter.partner,
      stummBis: stumm && Date.parse(stumm) > now() ? stumm : null,
      ...(rolleZeile && typeof typ.ich === 'function' ? typ.ich(ctx, sz, { ...rolleZeile, team_id: team.id }, sql.rollen.all(sz.id)) || {} : {})
    };
    // E98: Szenario-Werkzeuge nur eingebettet; ein laufender Boss-Kampf sperrt auch sie
    const boss = !!sqlStand.laufenderBoss.get(s.id, iso(now() - BOSS_KULANZ_MS));
    daten.boss = boss;
    daten.werkzeuge = boss || !rolleZeile || typeof typ.werkzeuge !== 'function' ? [] : typ.werkzeuge(sz, betrachter.rolle, ctx) || [];
    return { etag: tag, daten };
  }

  /** GET /api/lehrer/funk/:id/stand?ansicht=regie|beamer → { etag, daten | null } */
  function standLehrkraft(lk, id, { seit, etag, ansicht = 'regie' } = {}) {
    if (!['regie', 'beamer'].includes(ansicht)) throw new V.ValidationError('ansicht muss regie oder beamer sein.');
    const { sz } = ladeLk(lk, id);
    const tag = etagVon(sz, ansicht);
    if (unveraendert(sz, { seit, etag }, ansicht)) return { etag: tag, daten: null };
    const daten = standDaten(sz, seitWirksam(sz, { seit, etag }, ansicht), { art: ansicht }, ansicht);
    daten.ich = null;
    daten.werkzeuge = [];
    daten.boss = false;
    if (ansicht === 'regie') {
      const konfig = konfigVon(sz);
      daten.rollen = sql.rollen.all(sz.id).map((r) => ({ teamId: r.team_id, team: r.name, rolle: r.rolle, partnerId: r.partner_id }));
      daten.optionen = konfig.optionen || {};
      daten.stumm = konfig.stumm || {};
    }
    return { etag: tag, daten };
  }

  /* ---------- Nachrichten, Prüfen über Hash, Moderation (TECHNIK §12.3, §12.5, Plan M7 Task 136, E108, E109) ---------- */

  const sendeLimit = new S.Limiter({ max: 1, windowMs: GRENZEN.sendenMs });
  const versuchLimit = new S.Limiter({ max: GRENZEN.versuche, windowMs: GRENZEN.versucheMs });
  const sqlN = {
    anzahl: db.prepare('SELECT COUNT(*) AS n FROM funk_nachrichten WHERE szenario_id = ?'),
    eine: db.prepare('SELECT * FROM funk_nachrichten WHERE id = ? AND szenario_id = ?'),
    neu: db.prepare(
      'INSERT INTO funk_nachrichten (szenario_id, von_team_id, an_team_id, angezeigt_von, von_schueler_id, art, inhalt, fuer_schluessel, klartext_hash, version, zeit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    angekommen: db.prepare('UPDATE funk_nachrichten SET angekommen = 1, version = ? WHERE id = ?'),
    geknackt: db.prepare('UPDATE funk_nachrichten SET geknackt_von = ?, version = ? WHERE id = ?'),
    ausblenden: db.prepare("UPDATE funk_nachrichten SET inhalt = '', klartext_hash = NULL, sichtbar = 0, version = ? WHERE id = ?"),
    konfig: db.prepare('UPDATE funk_szenarien SET konfig = ? WHERE id = ?')
  };

  /** Teilnehmer mit Rolle in einem laufenden Szenario; Aktion muss der Rolle erlaubt sein */
  function aktiverTeilnehmer(s, id, aktion) {
    const t = teilnehmer(s, id);
    if (!t.betrachter.rolle) throw new V.ForbiddenError('Dein Team spielt diesmal nicht mit – schau auf den Beamer.');
    if (t.sz.status === 'pausiert') throw new V.ConflictError('Das Szenario ist pausiert.');
    if (t.sz.status !== 'laeuft') throw new V.ConflictError('Das Szenario läuft nicht.');
    const erlaubt = (Sz.SZENARIEN[t.sz.typ].aktionen || {})[t.betrachter.rolle] || [];
    if (!erlaubt.includes(aktion)) throw new V.ForbiddenError('Das darf deine Rolle in diesem Szenario nicht.');
    // Review M7 W1: in der Auflösung zeigt der Beamer die Klartexte – danach wird nichts mehr geprüft oder geändert
    // (sonst änderte sich die Auswertung nachträglich); Typ-Hook aktionsPhasen schränkt einzelne Aktionen weiter ein
    if (t.sz.phase === AUFLOESUNG) throw new V.ConflictError('Die Auflösung läuft – jetzt wird nichts mehr geprüft oder gesendet.');
    const phasen = (TYP_MODULE[t.sz.typ].aktionsPhasen || {})[aktion];
    if (Array.isArray(phasen) && !phasen.includes(t.sz.phase)) throw new V.ConflictError('In dieser Phase geht das nicht mehr.');
    return t;
  }

  class ZuVieleError extends Error {
    constructor(message, retryAfter) {
      super(message);
      this.status = 429;
      this.retryAfter = Math.max(1, Math.ceil(retryAfter));
    }
  }

  /** POST /api/funk/:id/nachrichten { an?, text, klartext? } → { nachricht } */
  function senden(s, id, body) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const { sz, team, betrachter } = teilnehmer(s, id);
    if (!betrachter.rolle) throw new V.ForbiddenError('Dein Team spielt diesmal nicht mit – schau auf den Beamer.');
    if (sz.status === 'pausiert') throw new V.ConflictError('Das Szenario ist pausiert.');
    if (sz.status !== 'laeuft') throw new V.ConflictError('Das Szenario läuft nicht.');
    const k = Sz.SZENARIEN[sz.typ];
    const typ = TYP_MODULE[sz.typ];
    const sendePhasen = k.senden || k.phasen.filter((p) => p !== 'aufloesung');
    if (!sendePhasen.includes(sz.phase)) throw new V.ConflictError('In dieser Phase wird nicht gesendet.');
    if (!((k.aktionen || {})[betrachter.rolle] || []).includes('senden')) throw new V.ForbiddenError('Deine Rolle sendet in diesem Szenario nicht.');
    const jetzt = now();
    const stummBis = (konfigVon(sz).stumm || {})[team.id];
    if (stummBis && Date.parse(stummBis) > jetzt) throw new ZuVieleError('Euer Team ist für eine Minute stummgeschaltet.', (Date.parse(stummBis) - jetzt) / 1000);
    const key = `${sz.id}:${team.id}`;
    if (sendeLimit.isBlocked(key, jetzt)) throw new ZuVieleError('Höchstens eine Nachricht je Team in 10 Sekunden.', sendeLimit.retryAfterSec(key, jetzt));
    if (sqlN.anzahl.get(sz.id).n >= GRENZEN.maxNachrichten) throw new V.ConflictError(`In diesem Szenario wurden schon ${GRENZEN.maxNachrichten} Nachrichten gesendet.`);
    // Typen mit vorgegebenem Text (Mallory: Auftragskarte) übernehmen den Inhalt nicht vom Client
    const inhalt = typ.textVomServer ? null : T.pruefeInhalt(b.text);
    let klartext = null;
    if (b.klartext !== undefined && b.klartext !== null) klartext = T.pruefeKlartext(b.klartext);
    else if (typ.klartextPflicht) throw new V.ValidationError('Gib zum Prüfen auch den Klartext an.');
    let an = betrachter.partner;
    if (b.an !== undefined && b.an !== null && b.an !== an) throw new V.ValidationError('Du kannst nur an dein Partner-Team senden.');
    // Typ-spezifische Prüfungen (ab Task 137): typ.aktionen.senden(ctx, sz, betrachter, { inhalt, klartext, an, body })
    // → Ergänzungen { an?, inhalt?, art?, fuerSchluessel?, angezeigtVon? } (Inhalt erneut durch die Whitelist)
    const extra = (typeof (typ.aktionen || {}).senden === 'function' && typ.aktionen.senden(typCtx(sz), sz, betrachter, { inhalt, klartext, an, body: b })) || {};
    const endInhalt = extra.inhalt !== undefined ? T.pruefeInhalt(extra.inhalt) : inhalt;
    if (endInhalt === null) throw new V.ValidationError('Die Nachricht ist leer.');
    if (extra.an !== undefined) an = extra.an;
    if (an === null || an === undefined) throw new V.ValidationError('Dein Team hat kein Partner-Team.');
    const salz = konfigVon(sz).salz;
    const nid = db.transaction(() => {
      if (sqlN.anzahl.get(sz.id).n >= GRENZEN.maxNachrichten) throw new V.ConflictError(`In diesem Szenario wurden schon ${GRENZEN.maxNachrichten} Nachrichten gesendet.`);
      const v = naechsteVersion(sz.id);
      const neu = Number(
        sqlN.neu.run(sz.id, team.id, an, extra.angezeigtVon ?? null, s.id, extra.art || 'nachricht', endInhalt, extra.fuerSchluessel ?? null, klartext === null ? null : T.hash(salz, klartext), v, iso(jetzt))
          .lastInsertRowid
      );
      ereignis(sz.id, 'gesendet', { nachricht: neu, von: team.id, an }, v);
      return neu;
    })();
    sendeLimit.hit(key, jetzt);
    const aktuellSz = sql.sz.get(sz.id);
    return { nachricht: nachrichtFuer(aktuellSz, typ, typCtx(aktuellSz), sqlN.eine.get(nid, sz.id), betrachter) };
  }

  /** gemeinsame Prüfaktion empfangen/knacken über den Klartext-Hash; der eingereichte Klartext wird nie gespeichert */
  function pruefe(s, id, body, aktion) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const { sz, team, betrachter } = aktiverTeilnehmer(s, id, aktion);
    const typ = TYP_MODULE[sz.typ];
    // Typ mit eigener Aktion (z. B. Schlüsseltausch-Tipps, Task 140) übernimmt ganz – in einer Transaktion, mit derselben
    // Versuchsgrenze (gezählt erst nach gültiger Eingabe)
    if (typeof (typ.aktionen || {})[aktion] === 'function') {
      const key = `${sz.id}:${team.id}`;
      const jetzt = now();
      if (versuchLimit.isBlocked(key, jetzt)) throw new ZuVieleError('Zu viele Versuche – höchstens 30 in 5 Minuten.', versuchLimit.retryAfterSec(key, jetzt));
      const antwort = db.transaction(() => typ.aktionen[aktion](typCtx(sz), sql.sz.get(sz.id), betrachter, b))();
      versuchLimit.hit(key, jetzt);
      return antwort;
    }
    const nid = V.id(b.nachricht, 'Nachricht');
    const n = sqlN.eine.get(nid, sz.id);
    if (!n) throw new V.NotFoundError('Nachricht nicht gefunden.');
    if (aktion === 'empfangen' && n.an_team_id !== team.id) throw new V.ForbiddenError('Diese Nachricht ist nicht an euer Team.');
    if (aktion === 'knacken') {
      if ((Sz.SZENARIEN[sz.typ].sicht || {})[betrachter.rolle] !== 'alle') throw new V.ForbiddenError('Das darf deine Rolle in diesem Szenario nicht.');
      if (n.von_team_id === team.id) throw new V.ValidationError('Eigene Nachrichten knackt ihr nicht.');
    }
    const klartext = T.pruefeKlartext(b.klartext);
    const jetzt = now();
    const key = `${sz.id}:${team.id}`;
    if (!versuchLimit.take(key, jetzt)) throw new ZuVieleError('Zu viele Versuche – höchstens 30 in 5 Minuten.', versuchLimit.retryAfterSec(key, jetzt));
    const richtig = n.klartext_hash !== null && T.gleich(T.hash(konfigVon(sz).salz, klartext), n.klartext_hash);
    if (richtig) {
      db.transaction(() => {
        const frisch = sqlN.eine.get(nid, sz.id);
        if (aktion === 'empfangen' && !frisch.angekommen) {
          const v = naechsteVersion(sz.id);
          sqlN.angekommen.run(v, nid);
          ereignis(sz.id, 'angekommen', { nachricht: nid, team: team.id }, v);
        } else if (aktion === 'knacken' && frisch.geknackt_von === null) {
          const v = naechsteVersion(sz.id);
          sqlN.geknackt.run(team.id, v, nid);
          ereignis(sz.id, 'geknackt', { nachricht: nid, team: team.id, sekunden: Math.max(0, Math.round((jetzt - Date.parse(frisch.zeit)) / 1000)) }, v);
        }
      })();
    }
    return { richtig };
  }

  const empfangen = (s, id, body) => pruefe(s, id, body, 'empfangen');
  const knacken = (s, id, body) => pruefe(s, id, body, 'knacken');

  /* ---------- Typ-spezifische Aktionen (Plan M7 Tasks 137–141) ---------- */

  /** Grenzen typ-spezifischer Team-Aktionen: typ.grenzen[name] = 'senden' (wie Nachrichten: stumm, 1 je 10 s) oder
      { max, ms, text } (eigener Zähler je Szenario und Team); gezählt wird erst nach einer gültigen Aktion */
  const aktionsLimits = new Map();
  function aktionsLimit(typName, name, g) {
    const key = `${typName}:${name}`;
    if (!aktionsLimits.has(key)) aktionsLimits.set(key, new S.Limiter({ max: g.max, windowMs: g.ms }));
    return aktionsLimits.get(key);
  }

  /** POST/PUT /api/funk/:id/<aktion> – Aktion des Typs (zuordnung, oeffentlich, k-melden, mallory) für die eigene Rolle */
  function teamAktion(s, id, name, body) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const { sz, team, betrachter } = aktiverTeilnehmer(s, id, name);
    const typ = TYP_MODULE[sz.typ];
    const f = (typ.aktionen || {})[name];
    if (typeof f !== 'function') throw new V.ForbiddenError('Das darf deine Rolle in diesem Szenario nicht.');
    const g = (typ.grenzen || {})[name];
    const jetzt = now();
    const key = `${sz.id}:${team.id}`;
    let limiter = null;
    let text = 'Zu viele Anfragen. Bitte warte kurz.';
    if (g === 'senden') {
      const stummBis = (konfigVon(sz).stumm || {})[team.id];
      if (stummBis && Date.parse(stummBis) > jetzt) throw new ZuVieleError('Euer Team ist für eine Minute stummgeschaltet.', (Date.parse(stummBis) - jetzt) / 1000);
      limiter = sendeLimit;
      text = 'Höchstens eine Nachricht je Team in 10 Sekunden.';
    } else if (g) {
      limiter = aktionsLimit(sz.typ, name, g);
      text = g.text || text;
    }
    if (limiter && limiter.isBlocked(key, jetzt)) throw new ZuVieleError(text, limiter.retryAfterSec(key, jetzt));
    const antwort = db.transaction(() => f(typCtx(sz), sql.sz.get(sz.id), { ...betrachter, team }, b))();
    if (limiter) limiter.hit(key, jetzt);
    return antwort;
  }

  /** POST /api/lehrer/funk/:id/<aktion> – Regie-Aktion des Typs (sonderkarte, hinweis, zertifikat, station) */
  function regieAktion(lk, id, name, body) {
    const sz = ladeLkOffen(lk, id);
    const typ = TYP_MODULE[sz.typ];
    const f = (typ.regie || {})[name];
    if (typeof f !== 'function') throw new V.ValidationError(`Diese Aktion gibt es im Szenario „${Sz.SZENARIEN[sz.typ].titel}“ nicht.`);
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    return db.transaction(() => f(typCtx(sz), sql.sz.get(sz.id), b, { lk }))();
  }

  /** schreibende Lehrkraft-Aktion in einem offenen Szenario (gesperrter Kurs 403, beendet 409) */
  function ladeLkOffen(lk, id) {
    const { sz, kurs } = ladeLk(lk, id);
    if (!kurs.aktiv) throw new V.ForbiddenError(GESPERRT);
    if (sz.status === 'auswertung') throw new V.ConflictError('Das Szenario ist schon beendet.');
    return sz;
  }

  /** POST /api/lehrer/funk/:id/nachrichten/:nid/ausblenden – Inhalt und Hash sofort leeren (E109: neue Version) */
  function ausblenden(lk, id, nachrichtId) {
    const sz = ladeLkOffen(lk, id);
    const nid = V.id(nachrichtId, 'Nachricht');
    if (!sqlN.eine.get(nid, sz.id)) throw new V.NotFoundError('Nachricht nicht gefunden.');
    db.transaction(() => {
      const v = naechsteVersion(sz.id);
      sqlN.ausblenden.run(v, nid);
      ereignis(sz.id, 'ausgeblendet', { nachricht: nid }, v);
    })();
    walLeeren(db); // der alte Inhalt soll auch im WAL nicht stehen bleiben (Plan M7 Task 160)
    return { ok: true };
  }

  /** POST /api/lehrer/funk/:id/teams/:teamId/stumm { sekunden } – 1–300 s keine Nachrichten */
  function stumm(lk, id, teamIdRoh, body) {
    const sz = ladeLkOffen(lk, id);
    const teamId = V.id(teamIdRoh, 'Team');
    if (!sql.kursTeams.all(sz.kurs_id).some((x) => x.id === teamId)) throw new V.NotFoundError('Team nicht gefunden.');
    const roh = body && typeof body === 'object' && body.sekunden !== undefined ? body.sekunden : 60;
    if (!Number.isInteger(roh) || roh < 1 || roh > GRENZEN.stummMax) throw new V.ValidationError(`sekunden muss 1 bis ${GRENZEN.stummMax} sein.`);
    db.transaction(() => {
      const aktuellSz = sql.sz.get(sz.id);
      const konfig = konfigVon(aktuellSz);
      konfig.stumm = { ...(konfig.stumm || {}), [teamId]: iso(now() + roh * 1000) };
      const v = naechsteVersion(sz.id);
      sqlN.konfig.run(JSON.stringify(konfig), sz.id);
      ereignis(sz.id, 'stumm', { team: teamId, sekunden: roh }, v);
    })();
    return { ok: true };
  }

  return {
    senden,
    teamAktion,
    regieAktion,
    empfangen,
    knacken,
    ausblenden,
    stumm,
    GRENZEN,
    anlegen,
    rollenSetzen,
    status,
    aktuellFuerKurs,
    beendeIntern,
    regieAnsicht,
    aktuell,
    stand,
    standLehrkraft,
    TYP_MODULE,
    _intern: { lade, typCtx, sql, naechsteVersion, ereignis, konfigVon, teilnehmer, nachrichtFuer }
  };
}

module.exports = { createFunkraum, TYP_MODULE };
