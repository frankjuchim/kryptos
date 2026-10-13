/* Kryptos – Funkraum-Routen (TECHNIK §13.2, §13.4, Plan M7 Tasks 134–136). Lehrkraft: Szenario anlegen, Status, Rollen, Stand
   (regie/beamer); Schüler: /api/funk, Stand mit ETag/seit (Task 135). Rechte: Lehrkraft nur eigene Kurse (fremde → 404), gesperrter Kurs → 403 beim Schreiben. */
'use strict';
const V = require('../../validate');
const S = require('../../security');

function zuViele(res, limiter, key, jetzt, text) {
  res.set('Retry-After', String(limiter.retryAfterSec(key, jetzt)));
  return res.status(429).json({ error: text || 'Zu viele Anfragen. Bitte warte kurz.' });
}

/** Stand-Antwort mit ETag; null-Daten → 304 ohne Körper */
function sendeStand(res, { etag, daten }) {
  res.set('ETag', etag);
  res.set('Cache-Control', 'no-store');
  if (!daten) return res.status(304).end();
  res.json(daten);
}

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
    // Schüler: wie die Kern-Schülerrouten (401 ohne Sitzung, 403 bei gesperrtem Kurs)
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
    // Rate-Limits (TECHNIK §12.4, §13.2): Uhr der App (in Tests steuerbar)
    const limit = (limiter, schluessel) => (req, res, next) => {
      const key = schluessel(req);
      if (!limiter.take(key, h.now())) return zuViele(res, limiter, key, h.now());
      next();
    };
    const funkLimit = new S.Limiter({ max: 6, windowMs: 60 * 1000 });
    const standLimit = new S.Limiter({ max: 60, windowMs: 60 * 1000 });
    const lkLimit = new S.Limiter({ max: 120, windowMs: 60 * 1000 });
    const proSchueler = (req) => 's:' + req.schueler.id;
    const proLk = (req) => 'l:' + (req.lk.konto ? req.lk.konto.sub : req.lk.id);
    const abfrage = (req) => ({ seit: req.query.seit, etag: req.get('If-None-Match') });

    /* Schüler (Plan M7 Task 135) */
    api.get('/funk', schueler, limit(funkLimit, proSchueler), (req, res) => res.json(funk.aktuell(req.schueler)));
    api.get('/funk/:id/stand', schueler, limit(standLimit, proSchueler), (req, res) => sendeStand(res, funk.stand(req.schueler, req.params.id, abfrage(req))));

    api.get('/lehrer/kurse/:kursId/funk', lehrkraft, (req, res) => res.json(funk.aktuellFuerKurs(req.lk, kid(req))));
    api.post('/lehrer/kurse/:kursId/funk', lehrkraft, (req, res) => res.json(funk.anlegen(req.lk, kid(req), req.body)));
    api.post('/lehrer/funk/:id/status', lehrkraft, (req, res) => res.json(funk.status(req.lk, req.params.id, req.body)));
    api.put('/lehrer/funk/:id/rollen', lehrkraft, (req, res) => res.json(funk.rollenSetzen(req.lk, req.params.id, req.body)));
    api.get('/lehrer/funk/:id/stand', lehrkraft, limit(lkLimit, proLk), (req, res) =>
      sendeStand(res, funk.standLehrkraft(req.lk, req.params.id, { ...abfrage(req), ansicht: req.query.ansicht === undefined ? 'regie' : req.query.ansicht }))
    );
  };
}

module.exports = { funkRouten };
