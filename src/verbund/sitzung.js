'use strict';
// Kern-Kandidat lab-kern: Sitzungen nach der Portal-Anmeldung (TECHNIK §6.4).
//   kr_s (Schüler):              S.sign({ sub, g, t })  – g = konten.session_gen, t = id der aktiven Teilnahme, 30 Tage
//                                (Kurswahl/Rückfall setzen t neu, behalten aber exp – keine Verlängerung)
//   kr_l (Lehrkraft/Superadmin): S.sign({ sub, g })                                                         8 Stunden
// helpers.schueler(req) liefert die Teilnahme-Zeile (Tabelle „schueler“), damit alle Kerndienste unverändert mit
// s.id/s.kurs_id arbeiten; helpers.lehrkraft(req) liefert { konto, kurse } (lokale Kurs-ids, Superadmin: alle).
// Dazu: Seiten-Wächter (stille Weiterleitung zu /sso/start), GET /api/sitzung, Kurswahl, Abmelden (TECHNIK §6.4, §13.1).

const S = require('../security');
const V = require('../validate');

const SCHUELER_MS = 30 * 24 * 3600 * 1000; // 30 Tage
const LEHRKRAFT_MS = 8 * 3600 * 1000; // 8 Stunden

/**
 * @param {{ db: import('better-sqlite3').Database, secret: string }} o
 */
function createSitzung({ db, secret }) {
  const kontoStmt = db.prepare('SELECT * FROM konten WHERE sub = ?');
  const teilnahmeStmt = db.prepare(
    'SELECT s.* FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.id = ? AND s.sub = ? AND s.aktiv = 1 AND k.aktiv = 1'
  );
  const ersteStmt = db.prepare(
    'SELECT s.* FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = ? AND s.aktiv = 1 AND k.aktiv = 1 ORDER BY k.name COLLATE NOCASE, k.id LIMIT 1'
  );

  /** Signierte Cookies lesen (einmal je Anfrage, in app.js). */
  function lesen(req) {
    const c = S.parseCookies(req.headers.cookie);
    req.sS = c[S.COOKIE_SCHUELER] ? S.verify(c[S.COOKIE_SCHUELER], secret) : null;
    req.sL = c[S.COOKIE_LEHRKRAFT] ? S.verify(c[S.COOKIE_LEHRKRAFT], secret) : null;
  }

  function konto(p, rollen) {
    if (!p || typeof p.sub !== 'string' || !Number.isInteger(p.g)) return null;
    const k = kontoStmt.get(p.sub);
    if (!k || k.session_gen !== p.g || !rollen.includes(k.rolle)) return null;
    return k;
  }

  /**
   * Teilnahme der Schüler-Sitzung oder null. Ist die gemerkte Teilnahme nicht (mehr) aktiv, gilt die erste aktive
   * Teilnahme in einem aktiven Kurs (alphabetisch nach Kursname); mit `res` wird das Cookie dann erneuert.
   */
  function schueler(req, res) {
    const p = req.sS;
    const k = konto(p, ['schueler']);
    if (!k) return null;
    let t = Number.isInteger(p.t) ? teilnahmeStmt.get(p.t, k.sub) : null;
    if (!t) {
      t = ersteStmt.get(k.sub);
      if (t && res) setzeSchueler(req, res, k, t.id, p.exp); // Restlaufzeit bleibt (keine Verlängerung)
    }
    return t || null;
  }

  /** { konto, kurse } der Lehrkraft-Sitzung oder null. kurse = lokale Kurs-ids (aktive kurs_lehrkraefte; Superadmin alle). */
  function lehrkraft(req) {
    const k = konto(req.sL, ['lehrkraft', 'superadmin']);
    if (!k) return null;
    const kurse =
      k.rolle === 'superadmin'
        ? db.prepare('SELECT id FROM kurse ORDER BY id').all().map((r) => r.id)
        : db.prepare('SELECT kurs_id FROM kurs_lehrkraefte WHERE sub = ? AND aktiv = 1 ORDER BY kurs_id').all(k.sub).map((r) => r.kurs_id);
    return { konto: k, kurse };
  }

  /**
   * kr_s setzen. Ohne `exp`: neue Sitzung mit voller Laufzeit (nur /sso/ende). Mit `exp` (ms, aus dem bisherigen
   * Cookie): Teilnahme wechseln ohne Verlängerung – exp bleibt, Max-Age = Restlaufzeit (Kurswahl, Rückfall).
   */
  function setzeSchueler(req, res, k, teilnahmeId, exp) {
    const nutzlast = { sub: k.sub, g: k.session_gen, t: teilnahmeId };
    if (!Number.isFinite(exp)) return S.setCookie(req, res, S.COOKIE_SCHUELER, nutzlast, secret, SCHUELER_MS);
    const ende = Math.min(exp, Date.now() + SCHUELER_MS);
    res.cookie(S.COOKIE_SCHUELER, S.sign({ ...nutzlast, exp: ende }, secret), {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      path: '/',
      maxAge: Math.max(0, ende - Date.now())
    });
  }

  function setzeLehrkraft(req, res, k) {
    S.setCookie(req, res, S.COOKIE_LEHRKRAFT, { sub: k.sub, g: k.session_gen }, secret, LEHRKRAFT_MS);
  }

  /**
   * Hat die Schüler-Sitzung (gültiges Konto) nur noch Teilnahmen in gesperrten Kursen? Dann 403 statt 401
   * („Kryptos ist für deinen Kurs abgeschaltet“), solange keine aktive Teilnahme in einem aktiven Kurs besteht.
   */
  function gesperrt(req) {
    const k = konto(req.sS, ['schueler']);
    if (!k) return false;
    return !!db.prepare('SELECT 1 FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = ? AND s.aktiv = 1 AND k.aktiv = 0 LIMIT 1').get(k.sub);
  }

  /**
   * Seiten-Wächter (vor sendFile): rolle 'schueler' braucht kr_s (Lehrkraft-Sitzung → 302 /lehrer), rolle 'lehrkraft'
   * braucht kr_l (Schüler-Sitzung → 302 /spiel – sonst Schleife über das SSO, weil das Portal den Schüler wieder als
   * Schüler anmeldet). Ohne Sitzung still 302 /sso/start?ziel=<Pfad> (ungültiges Cookie wird gelöscht).
   */
  function waechter(rolle) {
    return (req, res, next) => {
      if (rolle === 'schueler') {
        if (schueler(req, res)) return next();
        if (lehrkraft(req)) return res.redirect(302, '/lehrer');
        if (req.sS) S.clearCookie(req, res, S.COOKIE_SCHUELER);
      } else {
        if (lehrkraft(req)) return next();
        if (schueler(req, res)) return res.redirect(302, '/spiel');
        if (req.sL) S.clearCookie(req, res, S.COOKIE_LEHRKRAFT);
      }
      res.set('Cache-Control', 'no-store');
      res.redirect(302, '/sso/start?ziel=' + encodeURIComponent(req.originalUrl));
    };
  }

  /** Erste aktive Teilnahme in einem aktiven Kurs (alphabetisch nach Kursname) oder null – für /sso/ende. */
  function ersteTeilnahme(sub) {
    return ersteStmt.get(sub) || null;
  }

  /**
   * API-Routen der Sitzung (TECHNIK §13.1): GET /sitzung, POST /sitzung/kurs, POST /abmelden.
   * @param {import('express').Router} api   API-Router (mit Origin-Prüfung und JSON-Pflicht)
   * @param {{ svc: object, konfig: object, version: string }} o
   */
  function routen(api, { svc, konfig, version }) {
    const kurswahlLimit = new S.Limiter({ max: 30, windowMs: 60 * 1000 });

    api.get('/sitzung', (req, res) => {
      const basis = { rolle: null, name: null, kurs: null, kurse: [], portal: konfig.portalUrl || null, version };
      const s = schueler(req, res);
      if (s) {
        const k = svc.kurse.kursRow(s.kurs_id);
        const e = svc.kurse.einstellungen(k.einstellungen);
        return res.json({
          ...basis,
          rolle: 'schueler',
          name: s.name,
          kurs: { id: k.kurs_id, name: k.name, niveau: e.niveau === 'gA' ? 'gA' : 'eA' },
          kurse: svc.konten.teilnahmen(s.sub).map((t) => ({ id: t.kurs, name: t.name, aktiv: t.aktiv }))
        });
      }
      const l = lehrkraft(req);
      if (l) {
        return res.json({
          ...basis,
          rolle: l.konto.rolle,
          name: l.konto.name,
          kurse: svc.kurse.kursListe(l).map((k) => ({ id: k.kurs, name: k.name, aktiv: k.aktiv }))
        });
      }
      res.json(basis);
    });

    api.post('/sitzung/kurs', (req, res) => {
      const s = schueler(req, res);
      if (!s) {
        if (gesperrt(req)) return res.status(403).json({ error: 'Kryptos ist für deinen Kurs abgeschaltet.' });
        return res.status(401).json({ error: 'Bitte melde dich an.', anmelden: true, sso: '/sso/start' });
      }
      const key = 'k:' + s.sub;
      if (!kurswahlLimit.take(key)) {
        res.set('Retry-After', String(kurswahlLimit.retryAfterSec(key)));
        return res.status(429).json({ error: 'Zu viele Kurswechsel. Bitte warte kurz.' });
      }
      const kurs = (req.body || {}).kurs;
      if (typeof kurs !== 'string' || !/^k:\d{1,15}$/.test(kurs)) throw new V.ValidationError('Bitte einen Kurs angeben.');
      const t = db
        .prepare('SELECT s.id, k.kurs_id, k.name FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = ? AND k.kurs_id = ? AND s.aktiv = 1 AND k.aktiv = 1')
        .get(s.sub, kurs);
      if (!t) throw new V.NotFoundError('Kurs nicht gefunden.');
      setzeSchueler(req, res, kontoStmt.get(s.sub), t.id, req.sS.exp); // keine Verlängerung
      res.json({ ok: true, kurs: { id: t.kurs_id, name: t.name } });
    });

    api.post('/abmelden', (req, res) => {
      const ueberall = (req.body || {}).ueberall;
      if (ueberall !== undefined && typeof ueberall !== 'boolean') throw new V.ValidationError('ueberall muss true oder false sein.');
      // „Überall abmelden“: session_gen erhöhen → Sitzungen dieses Kontos auf anderen Geräten (geteilte Tablets) enden
      if (ueberall) {
        const subs = new Set([konto(req.sS, ['schueler']), konto(req.sL, ['lehrkraft', 'superadmin'])].filter(Boolean).map((k) => k.sub));
        const erhoehe = db.prepare('UPDATE konten SET session_gen = session_gen + 1 WHERE sub = ?');
        for (const sub of subs) erhoehe.run(sub);
      }
      S.clearCookie(req, res, S.COOKIE_SCHUELER);
      S.clearCookie(req, res, S.COOKIE_LEHRKRAFT);
      if (ueberall && konfig.portalUrl && konfig.plattformUrl) {
        return res.json({ weiter: `${konfig.portalUrl}/sso/abmelden?ruecksprung=${encodeURIComponent(konfig.plattformUrl + '/')}` });
      }
      res.json({ weiter: '/' });
    });
  }

  return {
    lesen,
    ersteTeilnahme,
    gesperrt,
    waechter,
    routen,
    schueler,
    lehrkraft,
    setzeSchueler,
    setzeLehrkraft,
    loescheSchueler: (req, res) => S.clearCookie(req, res, S.COOKIE_SCHUELER),
    loescheLehrkraft: (req, res) => S.clearCookie(req, res, S.COOKIE_LEHRKRAFT)
  };
}

module.exports = { createSitzung, SCHUELER_MS, LEHRKRAFT_MS };
