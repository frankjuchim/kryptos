/* Kryptos – Routen der Chiffren-Werkstatt und Knack-Arena (TECHNIK §13.3, §13.4, Plan M7 Tasks 143–146).
   Schüler: /api/arena (Status, Team, eigene Chiffre). Lehrkraft: Arena anlegen, Phase, Löschen, Stand je Kurs.
   Rechte: Lehrkraft nur eigene Kurse (fremde → 404), gesperrter Kurs → 403 beim Schreiben; Schüler ohne Sitzung 401,
   gesperrter Kurs 403. 429 aus dem Dienst mit Retry-After. */
'use strict';
const V = require('../../validate');

/**
 * @param {object} arena  Dienst aus createArena
 */
function arenaRouten(arena) {
  return function routen(api, h) {
    const lehrkraft = (req, res, next) => {
      const l = h.lehrkraft(req);
      if (!l) {
        if (req.sL) h.clearLehrkraft(req, res);
        return res.status(401).json({ error: 'Bitte als Lehrkraft anmelden.', anmelden: true, sso: '/sso/start' });
      }
      req.lk = l;
      next();
    };
    const schueler = (req, res, next) => {
      const s = h.schueler(req, res);
      if (!s) {
        if (h.gesperrt(req)) return res.status(403).json({ error: 'Kryptos ist für deinen Kurs abgeschaltet.' });
        if (req.sS) h.clearSchueler(req, res);
        return res.status(401).json({ error: 'Bitte melde dich an.', anmelden: true, sso: '/sso/start' });
      }
      req.schueler = s;
      next();
    };
    const kid = (req) => V.id(req.params.kursId, 'Kurs');

    /* Schüler */
    api.get('/arena', schueler, (req, res) => res.json(arena.aktuell(req.schueler)));

    /* Lehrkraft */
    api.get('/lehrer/kurse/:kursId/arena', lehrkraft, (req, res) => res.json(arena.aktuellFuerKurs(req.lk, kid(req))));
    api.post('/lehrer/kurse/:kursId/arena', lehrkraft, (req, res) => res.json(arena.anlegen(req.lk, kid(req), req.body)));
    api.post('/lehrer/arena/:id/phase', lehrkraft, (req, res) => res.json(arena.phase(req.lk, req.params.id, req.body)));
    api.delete('/lehrer/arena/:id', lehrkraft, (req, res) => res.json(arena.loesche(req.lk, req.params.id)));
  };
}

module.exports = { arenaRouten };
