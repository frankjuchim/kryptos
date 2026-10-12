'use strict';
// API für Schüler: Lernen, Training, Boss, Profil, Scoreboard, Kata. Anmeldung nur über das Portal (SSO, TECHNIK §6.5).

const S = require('../security');

function zuViele(res, limiter, key, text, jetzt) {
  res.set('Retry-After', String(limiter.retryAfterSec(key, jetzt)));
  return res.status(429).json({ error: text || 'Zu viele Versuche. Bitte warte ein paar Minuten.' });
}

function schuelerRoutes(api, h) {
  const { svc } = h;
  const pruefLimit = new S.Limiter({ max: 90, windowMs: 60 * 1000 });

  /* ---------- Angemeldet ---------- */

  const auth = (req, res, next) => {
    const s = h.schueler(req, res);
    if (!s) {
      if (req.sS) h.clearSchueler(req, res);
      return res.status(401).json({ error: 'Bitte melde dich an.', anmelden: true, sso: '/sso/start' });
    }
    req.schueler = s;
    svc.kurse.aktiv(s.id);
    next();
  };
  // Routen mit Anmeldepflicht (Middleware je Route, damit andere Bereiche nicht betroffen sind)
  const st = {
    get: (p, ...f) => api.get(p, auth, ...f),
    post: (p, ...f) => api.post(p, auth, ...f),
    put: (p, ...f) => api.put(p, auth, ...f)
  };
  const limit = (req, res, next) => {
    const key = 's:' + req.schueler.id;
    // Uhr der App (in Tests steuerbar)
    if (!pruefLimit.take(key, h.now())) return zuViele(res, pruefLimit, key, 'Langsam! Zu viele Prüfungen in kurzer Zeit – atme kurz durch.', h.now());
    next();
  };

  st.get('/welten', (req, res) => res.json(svc.lernen.welten(req.schueler)));
  st.get('/levels/:id', (req, res) => res.json(svc.lernen.level(req.schueler, req.params.id)));
  st.post('/levels/:id/ide', (req, res) => res.json(svc.lernen.ideSetzen(req.schueler, req.params.id, (req.body || {}).erledigt)));

  st.get('/aufgaben/:id', (req, res) => res.json(svc.lernen.aufgabe(req.schueler, req.params.id)));
  st.post('/aufgaben/:id/pruefen', limit, (req, res) => res.json(svc.lernen.pruefen(req.schueler, req.params.id, req.body)));
  st.post('/aufgaben/:id/tipp', limit, (req, res) => res.json(svc.lernen.tipp(req.schueler, req.params.id)));
  st.post('/aufgaben/:id/aufdecken', limit, (req, res) => res.json(svc.lernen.aufdecken(req.schueler, req.params.id)));

  st.get('/training/aufgabe/:id', (req, res) => res.json(svc.training.holen(req.schueler, req.params.id)));
  st.post('/training/aufgabe/:id/pruefen', limit, (req, res) => res.json(svc.training.pruefen(req.schueler, req.params.id, req.body)));
  st.post('/training/aufgabe/:id/aufdecken', limit, (req, res) => res.json(svc.training.aufdecken(req.schueler, req.params.id)));
  st.get('/training/:welt', (req, res) => res.json(svc.training.info(req.schueler, req.params.welt)));
  st.post('/training/:welt/neu', limit, (req, res) => res.status(201).json(svc.training.neu(req.schueler, req.params.welt, req.body)));

  st.get('/boss/kampf/:id', (req, res) => res.json(svc.boss.ansicht(req.schueler, req.params.id)));
  st.put('/boss/kampf/:id/antwort', limit, (req, res) => res.json(svc.boss.antworten(req.schueler, req.params.id, req.body)));
  st.post('/boss/kampf/:id/beenden', (req, res) => res.json(svc.boss.beenden(req.schueler, req.params.id)));
  st.get('/boss/:welt', (req, res) => res.json(svc.boss.status(req.schueler, req.params.welt)));
  st.post('/boss/:welt/start', (req, res) => res.status(201).json(svc.boss.starten(req.schueler, req.params.welt)));

  st.get('/profil', (req, res) => res.json(svc.lernen.profil(req.schueler)));
  st.get('/scoreboard', (req, res) => res.json(svc.lernen.scoreboardFuerSchueler(req.schueler, req.query.welt)));

  const kataFilter = (q) => ({
    welt: q.welt === undefined || q.welt === '' ? undefined : q.welt,
    kategorie: typeof q.kategorie === 'string' && q.kategorie ? q.kategorie : undefined
  });
  st.get('/kata/meta', (req, res) => res.json(svc.kata.meta()));
  st.get('/kata/statistik', (req, res) => res.json(svc.kata.statistik(req.schueler.id, kataFilter(req.query))));
  st.post('/kata/ziehen', (req, res) => {
    const b = req.body || {};
    res.json(svc.kata.ziehen(req.schueler.id, kataFilter(b), { excludeId: typeof b.excludeId === 'string' ? b.excludeId : null, force: b.force === true }));
  });
  st.post('/kata/antwort', (req, res) => {
    const b = req.body || {};
    const r = svc.kata.antworten(req.schueler.id, String(b.kataId || ''), b.ergebnis);
    const neu = svc.stand.pruefeAbzeichen(req.schueler);
    res.json({ ...r, neueAbzeichen: neu });
  });
}

module.exports = { schuelerRoutes };
