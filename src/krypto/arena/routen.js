/* Kryptos – Routen der Chiffren-Werkstatt und Knack-Arena (TECHNIK §13.3, §13.4, Plan M7 Tasks 143–146).
   Schüler: /api/arena (Status, Team, eigene Chiffre), Werkstatt-Prüfung, Einreichen, Angriff, Chiffren-Liste, Beurteilung.
   Lehrkraft: Arena anlegen, Phase, Löschen, Stand je Kurs, Gesamtansicht, Beamer-Stand (ETag).
   Rechte: Lehrkraft nur eigene Kurse (fremde → 404), gesperrter Kurs → 403 beim Schreiben; Schüler ohne Sitzung 401,
   gesperrter Kurs 403. 429 aus dem Dienst mit Retry-After. */
'use strict';
const V = require('../../validate');
const S = require('../../security');

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

    // 429 aus dem Dienst mit Retry-After
    const mit429 = (f) => (req, res) => {
      try {
        res.json(f(req));
      } catch (e) {
        if (e && e.status === 429) {
          res.set('Retry-After', String(e.retryAfter || 1));
          return res.status(429).json({ error: e.message });
        }
        throw e;
      }
    };

    /* Schüler */
    api.get('/arena', schueler, (req, res) => res.json(arena.aktuell(req.schueler)));
    api.post('/werkstatt/pruefen', schueler, mit429((req) => arena.pruefen(req.schueler, req.body)));
    api.post('/arena/:id/chiffren/:cid/angriff', schueler, mit429((req) => arena.angriff(req.schueler, req.params.id, req.params.cid, req.body)));
    api.get('/arena/:id/chiffren', schueler, (req, res) => res.json(arena.chiffren(req.schueler, req.params.id)));
    api.put('/arena/:id/beurteilung', schueler, (req, res) => res.json(arena.beurteilen(req.schueler, req.params.id, req.body)));
    api.post('/arena/:id/chiffre', schueler, mit429((req) => arena.einreichen(req.schueler, req.params.id, req.body)));

    /* Lehrkraft */
    api.get('/lehrer/kurse/:kursId/arena', lehrkraft, (req, res) => res.json(arena.aktuellFuerKurs(req.lk, kid(req))));
    api.post('/lehrer/kurse/:kursId/arena', lehrkraft, (req, res) => res.json(arena.anlegen(req.lk, kid(req), req.body)));
    api.post('/lehrer/arena/:id/phase', lehrkraft, (req, res) => res.json(arena.phase(req.lk, req.params.id, req.body)));
    api.get('/lehrer/arena/:id', lehrkraft, (req, res) => res.json(arena.lehrkraftAnsicht(req.lk, req.params.id)));
    // Beamer-Stand (E103): ETag/304, 120 Abfragen je Lehrkraft und Minute
    const beamerLimit = new S.Limiter({ max: 120, windowMs: 60 * 1000 });
    api.get('/lehrer/arena/:id/beamer', lehrkraft, (req, res) => {
      const key = 'l:' + (req.lk.konto ? req.lk.konto.sub : req.lk.id);
      if (!beamerLimit.take(key, h.now())) {
        res.set('Retry-After', String(beamerLimit.retryAfterSec(key, h.now())));
        return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte kurz.' });
      }
      const { etag, daten } = arena.beamer(req.lk, req.params.id, { etag: req.get('If-None-Match') });
      res.set('ETag', etag);
      res.set('Cache-Control', 'no-store');
      if (!daten) return res.status(304).end();
      res.json(daten);
    });
    api.delete('/lehrer/arena/:id', lehrkraft, (req, res) => res.json(arena.loesche(req.lk, req.params.id)));
  };
}

module.exports = { arenaRouten };
