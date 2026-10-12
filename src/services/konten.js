'use strict';
// Konten nach `sub` (TECHNIK §6.6): Konten kommen ausschließlich vom Portal (SSO-Token). Keine Registrierung,
// keine Passwörter, keine Freigabe – das verwaltet das Portal. Upsert beim SSO folgt mit /sso/ende (Plan Task 6).

function createKonten(ctx) {
  const { db } = ctx;

  function row(sub) {
    return typeof sub === 'string' ? db.prepare('SELECT * FROM konten WHERE sub = ?').get(sub) || null : null;
  }

  /** Öffentliche Sicht auf ein Konto (für /api/lehrer/ich, /api/sitzung). */
  function ansicht(k) {
    if (!k) return null;
    return { sub: k.sub, name: k.name, rolle: k.rolle, erstellt: k.created_at, letzterLogin: k.last_login_at };
  }

  /** Teilnahmen eines Schülerkontos (alle, auch inaktive) mit Kursdaten, alphabetisch nach Kursname. */
  function teilnahmen(sub) {
    return db
      .prepare(
        `SELECT s.id, s.kurs_id AS kursLokal, k.kurs_id AS kurs, k.name AS kursName, s.aktiv AS teilnahmeAktiv, k.aktiv AS kursAktiv
         FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.sub = ? ORDER BY k.name COLLATE NOCASE, k.id`
      )
      .all(sub)
      .map((r) => ({ id: r.id, kursLokal: r.kursLokal, kurs: r.kurs, name: r.kursName, aktiv: r.teilnahmeAktiv === 1 && r.kursAktiv === 1 }));
  }

  return { row, ansicht, teilnahmen };
}

module.exports = { createKonten };
