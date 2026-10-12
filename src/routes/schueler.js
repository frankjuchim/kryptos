'use strict';
// API für Schüler: Beitritt, Anmeldung, Lernen, Training, Boss, Profil, Scoreboard, Kata.

const S = require('../security');

function zuViele(res, limiter, key, text, jetzt) {
  res.set('Retry-After', String(limiter.retryAfterSec(key, jetzt)));
  return res.status(429).json({ error: text || 'Zu viele Versuche. Bitte warte ein paar Minuten.' });
}

function schuelerRoutes(api, h) {
  const { svc } = h;
  const beitrittIp = new S.Limiter({ max: 60, windowMs: 10 * 60 * 1000 }); // eine Schule = oft eine IP
  const loginIpFehler = new S.Limiter({ max: 100, windowMs: 15 * 60 * 1000 });
  const loginKontoFehler = new S.Limiter({ max: 8, windowMs: 15 * 60 * 1000 });
  const kursInfoIp = new S.Limiter({ max: 120, windowMs: 10 * 60 * 1000 });
  const pruefLimit = new S.Limiter({ max: 90, windowMs: 60 * 1000 });

  /* ---------- Öffentlich ---------- */

  api.get('/kurs/:code', (req, res) => {
    const key = 'ip:' + req.ip;
    if (!kursInfoIp.take(key)) return zuViele(res, kursInfoIp, key);
    const k = svc.kurse.kursPerCode(req.params.code);
    if (!k) return res.status(404).json({ error: 'Diesen Kurscode gibt es nicht.' });
    res.json({ name: k.name, anmeldung: !!k.einstellungen.anmeldung });
  });

  // AUTH_MODUS=portal: Beitritt und Anmeldung nur über das Portal InfoLabs
  const nurPortal = (req, res, next) => (h.konfig.lokal ? next() : res.status(403).json({ error: 'Die Anmeldung läuft über das Portal InfoLabs.', portal: true }));

  api.post('/schueler/beitreten', nurPortal, (req, res) => {
    const key = 'ip:' + req.ip;
    if (!beitrittIp.take(key)) return zuViele(res, beitrittIp, key, 'Zu viele Anmeldungen von diesem Netzwerk. Bitte warte ein paar Minuten.');
    const b = req.body || {};
    const r = svc.kurse.beitreten(b.kurscode, b.name);
    h.setSchuelerCookie(req, res, r.row);
    res.status(201).json({ name: r.schueler.name, code: r.schueler.code, kurs: r.kurs.name, kurscode: r.kurs.code });
  });

  api.post('/schueler/anmelden', nurPortal, (req, res) => {
    const b = req.body || {};
    const ipKey = 'ip:' + req.ip;
    const kontoKey = `n:${String(b.name || '').trim().toLowerCase()}`;
    if (loginIpFehler.isBlocked(ipKey)) return zuViele(res, loginIpFehler, ipKey);
    if (loginKontoFehler.isBlocked(kontoKey)) return zuViele(res, loginKontoFehler, kontoKey, 'Zu viele Fehlversuche für diesen Namen. Warte 15 Minuten oder frag deine Lehrkraft nach deinem Code.');
    // Weiterspielen: Name + persönlicher Code; Kurscode nur nötig, wenn beides zu mehreren Kursen passt (alte Codes)
    const row = svc.kurse.anmelden(b.name, b.code, b.kurscode);
    if (!row) {
      loginIpFehler.hit(ipKey);
      loginKontoFehler.hit(kontoKey);
      return res.status(401).json({ error: b.kurscode ? 'Kurscode, Name oder Code stimmen nicht.' : 'Name oder Code stimmen nicht.' });
    }
    loginKontoFehler.reset(kontoKey);
    h.setSchuelerCookie(req, res, row);
    const k = svc.kurse.kursRow(row.kurs_id);
    res.json({ name: row.name, kurs: k.name });
  });

  api.post('/schueler/abmelden', (req, res) => {
    h.clearSchueler(req, res);
    res.json({ ok: true });
  });

  /* ---------- Angemeldet ---------- */

  const auth = (req, res, next) => {
    const s = h.schueler(req);
    if (!s) {
      if (req.sS) h.clearSchueler(req, res);
      return res.status(401).json({ error: 'Bitte melde dich an.', anmelden: true });
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
  // Portal-Schüler in mehreren Kursen: Kurs wechseln (gleiche sub, eigene Zeile je Kurs)
  st.post('/kurs-wechseln', (req, res) => {
    const kursId = (req.body || {}).kursId;
    if (!Number.isInteger(kursId)) return res.status(400).json({ error: 'kursId fehlt.' });
    const row = svc.verbund.kursWechseln(req.schueler, kursId);
    h.setSchuelerCookie(req, res, row, { portal: true });
    res.json({ ok: true });
  });
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
