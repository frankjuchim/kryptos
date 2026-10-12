'use strict';
// Kern-Kandidat lab-kern: Sitzungen nach der Portal-Anmeldung (TECHNIK §6.4).
//   kr_s (Schüler):              S.sign({ sub, g, t })  – g = konten.session_gen, t = id der aktiven Teilnahme, 30 Tage
//   kr_l (Lehrkraft/Superadmin): S.sign({ sub, g })                                                         8 Stunden
// helpers.schueler(req) liefert die Teilnahme-Zeile (Tabelle „schueler“), damit alle Kerndienste unverändert mit
// s.id/s.kurs_id arbeiten; helpers.lehrkraft(req) liefert { konto, kurse } (lokale Kurs-ids, Superadmin: alle).

const S = require('../security');

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
      if (t && res) setzeSchueler(req, res, k, t.id);
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

  function setzeSchueler(req, res, k, teilnahmeId) {
    S.setCookie(req, res, S.COOKIE_SCHUELER, { sub: k.sub, g: k.session_gen, t: teilnahmeId }, secret, SCHUELER_MS);
  }

  function setzeLehrkraft(req, res, k) {
    S.setCookie(req, res, S.COOKIE_LEHRKRAFT, { sub: k.sub, g: k.session_gen }, secret, LEHRKRAFT_MS);
  }

  return {
    lesen,
    schueler,
    lehrkraft,
    setzeSchueler,
    setzeLehrkraft,
    loescheSchueler: (req, res) => S.clearCookie(req, res, S.COOKIE_SCHUELER),
    loescheLehrkraft: (req, res) => S.clearCookie(req, res, S.COOKIE_LEHRKRAFT)
  };
}

module.exports = { createSitzung, SCHUELER_MS, LEHRKRAFT_MS };
