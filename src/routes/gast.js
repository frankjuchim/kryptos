'use strict';
// Gastmodus (/gast): Demo-Aufgaben und Demo-Kurs ohne Anmeldung – nichts wird gespeichert.

const S = require('../security');

function gastRoutes(api, h) {
  const { gast } = h;
  const ipLimit = new S.Limiter({ max: 300, windowMs: 10 * 60 * 1000 });
  const begrenzt = (req, res, next) => {
    const key = 'gast:' + req.ip;
    if (!ipLimit.take(key)) {
      res.set('Retry-After', String(ipLimit.retryAfterSec(key)));
      return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte ein paar Minuten.' });
    }
    next();
  };

  api.get('/gast/schueler', begrenzt, (req, res) => res.json(gast.schueler()));
  api.get('/gast/aufgaben/:id', begrenzt, (req, res) => res.json(gast.aufgabe(req.params.id)));
  api.post('/gast/aufgaben/:id/pruefen', begrenzt, (req, res) => res.json(gast.pruefen(req.params.id, req.body)));
  api.post('/gast/aufgaben/:id/tipp', begrenzt, (req, res) => res.json(gast.tipp(req.params.id, req.body)));
  api.post('/gast/aufgaben/:id/aufdecken', begrenzt, (req, res) => res.json(gast.aufdecken(req.params.id)));
  api.get('/gast/lehrkraft', begrenzt, (req, res) => res.json(gast.lehrkraft()));
  api.get('/gast/vorschau/:id', begrenzt, (req, res) => res.json(gast.vorschau(req.params.id)));
}

module.exports = { gastRoutes };
