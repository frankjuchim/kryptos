/* Kryptos – Teams (Tischgruppen) je Kurs für Funkraum und Arena (TECHNIK §12.2, §13.4, Plan M7 Task 133, E106).
   PUT beschreibt den Sollstand: Teams bleiben je `nr` erhalten (Update in place), fehlende werden gelöscht – außer sie
   sind im Einsatz (Rolle in einem nicht beendeten Funkraum-Szenario oder Chiffre in einer offenen Arena) → 409.
   Namen nur aus TEAM_NAMEN (nie frei), Mitglieder nur aktive Teilnahmen des Kurses, jede höchstens einmal. */
'use strict';
const { TEAM_NAMEN } = require('./fach');
const V = require('../validate');

const MAX_TEAMS = 12;

/**
 * @param {{ db: import('better-sqlite3').Database, svc: object }} o
 */
function createTeams({ db, svc }) {
  const sql = {
    teams: db.prepare('SELECT id, nr, name FROM teams WHERE kurs_id = ? ORDER BY nr'),
    mitglieder: db.prepare(
      'SELECT s.id, s.name FROM team_mitglieder m JOIN schueler s ON s.id = m.schueler_id WHERE m.team_id = ? AND s.aktiv = 1 ORDER BY s.id'
    ),
    ohneTeam: db.prepare(
      'SELECT s.id, s.name FROM schueler s WHERE s.kurs_id = ? AND s.aktiv = 1 AND NOT EXISTS (SELECT 1 FROM team_mitglieder m WHERE m.schueler_id = s.id) ORDER BY s.id'
    ),
    teamVon: db.prepare('SELECT t.id, t.nr, t.name FROM team_mitglieder m JOIN teams t ON t.id = m.team_id WHERE m.schueler_id = ?'),
    imFunk: db.prepare(
      "SELECT 1 FROM funk_rollen r JOIN funk_szenarien z ON z.id = r.szenario_id WHERE r.team_id = ? AND z.status IN ('vorbereitung', 'laeuft', 'pausiert') LIMIT 1"
    ),
    inArena: db.prepare("SELECT 1 FROM arena_chiffren c JOIN arena a ON a.id = c.arena_id WHERE c.team_id = ? AND a.status != 'geschlossen' LIMIT 1"),
    teilnahme: db.prepare('SELECT id, kurs_id, aktiv FROM schueler WHERE id = ?'),
    upsert: db.prepare('INSERT INTO teams (kurs_id, nr, name) VALUES (?, ?, ?) ON CONFLICT(kurs_id, nr) DO UPDATE SET name = excluded.name'),
    teamId: db.prepare('SELECT id FROM teams WHERE kurs_id = ? AND nr = ?'),
    mitgliederLeeren: db.prepare('DELETE FROM team_mitglieder WHERE team_id IN (SELECT id FROM teams WHERE kurs_id = ?)'),
    mitglied: db.prepare('INSERT INTO team_mitglieder (team_id, schueler_id) VALUES (?, ?)'),
    loesche: db.prepare('DELETE FROM teams WHERE id = ?')
  };

  /** aktive Mitglieder eines Teams (Teilnahme-Zeilen: id, name) */
  const mitglieder = (teamId) => sql.mitglieder.all(teamId);

  /** Team einer Teilnahme oder null */
  const teamVon = (schuelerId) => sql.teamVon.get(schuelerId) || null;

  /** 'funkraum' | 'arena' | null */
  function imEinsatz(teamId) {
    if (sql.imFunk.get(teamId)) return 'funkraum';
    if (sql.inArena.get(teamId)) return 'arena';
    return null;
  }

  function ansicht(kursLokal) {
    return {
      teams: sql.teams.all(kursLokal).map((t) => ({ ...t, mitglieder: mitglieder(t.id) })),
      ohneTeam: sql.ohneTeam.all(kursLokal),
      namen: TEAM_NAMEN
    };
  }

  /** GET: auch bei gesperrtem Kurs lesbar; fremder Kurs → 404 */
  function liste(lk, kursId) {
    const k = svc.kurse.kursFuer(lk, kursId);
    return ansicht(k.id);
  }

  /** Eingabe vollständig prüfen (vor dem ersten Schreiben) → [{ nr, name, mitglieder }] */
  function pruefe(kursLokal, body) {
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.teams)) throw new V.ValidationError('teams muss eine Liste sein.');
    if (body.teams.length > MAX_TEAMS) throw new V.ValidationError(`Höchstens ${MAX_TEAMS} Teams.`);
    const nrn = new Set();
    const namen = new Set();
    const vergeben = new Set();
    return body.teams.map((t) => {
      if (!t || typeof t !== 'object' || Array.isArray(t)) throw new V.ValidationError('Ein Team ist ungültig.');
      const fremd = Object.keys(t).filter((x) => !['nr', 'name', 'mitglieder'].includes(x));
      if (fremd.length) throw new V.ValidationError(`Unbekanntes Feld: ${fremd[0]}`);
      if (!Number.isInteger(t.nr) || t.nr < 1 || t.nr > MAX_TEAMS) throw new V.ValidationError(`Die Team-Nummer muss 1 bis ${MAX_TEAMS} sein.`);
      if (nrn.has(t.nr)) throw new V.ValidationError(`Die Team-Nummer ${t.nr} ist doppelt.`);
      nrn.add(t.nr);
      if (!TEAM_NAMEN.includes(t.name)) throw new V.ValidationError('Bitte einen Teamnamen aus der Liste wählen.');
      if (namen.has(t.name)) throw new V.ValidationError(`Der Teamname „${t.name}“ ist doppelt.`);
      namen.add(t.name);
      if (!Array.isArray(t.mitglieder)) throw new V.ValidationError('mitglieder muss eine Liste sein.');
      for (const sid of t.mitglieder) {
        if (!Number.isInteger(sid) || sid < 1) throw new V.ValidationError('Ein Mitglied ist ungültig.');
        const s = sql.teilnahme.get(sid);
        if (!s || s.kurs_id !== kursLokal || !s.aktiv) throw new V.ValidationError('Ein Mitglied gehört nicht (mehr) zu diesem Kurs.');
        if (vergeben.has(sid)) throw new V.ValidationError('Jede Schülerin und jeder Schüler gehört zu höchstens einem Team.');
        vergeben.add(sid);
      }
      return { nr: t.nr, name: t.name, mitglieder: t.mitglieder };
    });
  }

  /** PUT: Sollstand setzen (eine Transaktion) → wie liste */
  function setzen(lk, kursId, body) {
    const k = svc.kurse.kursFuer(lk, kursId);
    if (!k.aktiv) throw new V.ForbiddenError('Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.');
    const soll = pruefe(k.id, body);
    db.transaction(() => {
      const nrn = new Set(soll.map((t) => t.nr));
      const weg = sql.teams.all(k.id).filter((t) => !nrn.has(t.nr));
      for (const t of weg) {
        const e = imEinsatz(t.id);
        if (e === 'funkraum') throw new V.ConflictError(`${t.name} spielt gerade im Funkraum.`);
        if (e === 'arena') throw new V.ConflictError(`${t.name} hat eine Chiffre in der offenen Arena.`);
      }
      for (const t of weg) sql.loesche.run(t.id);
      sql.mitgliederLeeren.run(k.id);
      for (const t of soll) {
        sql.upsert.run(k.id, t.nr, t.name);
        const id = sql.teamId.get(k.id, t.nr).id;
        for (const sid of t.mitglieder) sql.mitglied.run(id, sid);
      }
    })();
    return ansicht(k.id);
  }

  /** Lehrkraft-Routen GET/PUT /api/lehrer/kurse/:kursId/teams (Anmeldepflicht wie lehrerRoutes) */
  function routen(api, h) {
    const auth = (req, res, next) => {
      const l = h.lehrkraft(req);
      if (!l) {
        if (req.sL) h.clearLehrkraft(req, res);
        return res.status(401).json({ error: 'Bitte als Lehrkraft anmelden.', anmelden: true, sso: '/sso/start' });
      }
      req.lk = l;
      next();
    };
    const kid = (req) => V.id(req.params.kursId, 'Kurs');
    api.get('/lehrer/kurse/:kursId/teams', auth, (req, res) => res.json(liste(req.lk, kid(req))));
    api.put('/lehrer/kurse/:kursId/teams', auth, (req, res) => res.json(setzen(req.lk, kid(req), req.body)));
  }

  return { liste, setzen, teamVon, mitglieder, imEinsatz, routen };
}

module.exports = { createTeams, MAX_TEAMS };
