/* Kryptos – Funkraum-Routen (TECHNIK §13.2, §13.4, Plan M7 Tasks 134–136). Lehrkraft: Szenario anlegen, Status, Rollen;
   Schüler-Routen ab Task 135. Rechte: Lehrkraft nur eigene Kurse (fremde → 404), gesperrter Kurs → 403 beim Schreiben. */
'use strict';
const V = require('../../validate');

/**
 * @param {object} funk  Dienst aus createFunkraum
 */
function funkRouten(funk) {
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
    const kid = (req) => V.id(req.params.kursId, 'Kurs');

    api.get('/lehrer/kurse/:kursId/funk', lehrkraft, (req, res) => res.json(funk.aktuellFuerKurs(req.lk, kid(req))));
    api.post('/lehrer/kurse/:kursId/funk', lehrkraft, (req, res) => res.json(funk.anlegen(req.lk, kid(req), req.body)));
    api.post('/lehrer/funk/:id/status', lehrkraft, (req, res) => res.json(funk.status(req.lk, req.params.id, req.body)));
    api.put('/lehrer/funk/:id/rollen', lehrkraft, (req, res) => res.json(funk.rollenSetzen(req.lk, req.params.id, req.body)));
  };
}

module.exports = { funkRouten };
