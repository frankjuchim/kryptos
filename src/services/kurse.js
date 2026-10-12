'use strict';
// Kurse (Lehrkraft) und Schüler (Selbstanmeldung mit Kurscode + Name → persönlicher Code; Weiterspielen mit Name + Code).

const V = require('../validate');
const S = require('../security');
const { STANDARD_EINSTELLUNGEN } = require('../domain');

const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = V;

function createKurse(ctx) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();

  /* ---------- Kurse ---------- */

  function einstellungen(json) {
    let e = {};
    try {
      e = JSON.parse(json) || {};
    } catch {
      e = {};
    }
    const out = { ...STANDARD_EINSTELLUNGEN, ...e };
    if (!Array.isArray(out.welten)) out.welten = [...STANDARD_EINSTELLUNGEN.welten];
    return out;
  }

  function kursAnsicht(r) {
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      lehrkraftId: r.lehrkraft_id,
      einstellungen: einstellungen(r.einstellungen),
      erstellt: r.created_at,
      portal: !!r.portal_id,
      aktiv: r.aktiv !== 0
    };
  }

  function kursRow(id) {
    return db.prepare('SELECT * FROM kurse WHERE id = ?').get(id);
  }

  /**
   * Darf die Lehrkraft den Kurs sehen? Superadmin: alle. Portal-Kurse: Lehrkräfte laut letztem SSO-Token
   * (Inhaberin und Mitlehrkräfte, Tabelle kurs_lehrkraefte). Lokale Kurse: eigene.
   */
  function darf(lk, r) {
    if (lk.rolle === 'superadmin') return true;
    if (r.portal_id) return !!db.prepare('SELECT 1 FROM kurs_lehrkraefte WHERE kurs_id = ? AND lehrkraft_id = ?').get(r.id, lk.id);
    return r.lehrkraft_id === lk.id;
  }

  /** Kurs mit Zugriffsprüfung. Fremde Kurse → 404 (Existenz nicht verraten). */
  function kursFuer(lk, kursId) {
    const r = kursRow(kursId);
    if (!r || !darf(lk, r)) throw new NotFoundError('Kurs nicht gefunden.');
    return kursAnsicht(r);
  }

  function kursPerCode(code) {
    if (typeof code !== 'string') return null;
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(c)) return null;
    return kursAnsicht(db.prepare('SELECT * FROM kurse WHERE code = ?').get(c));
  }

  function kursListe(lk) {
    const where =
      lk.rolle === 'superadmin'
        ? ''
        : 'WHERE (k.portal_id IS NULL AND k.lehrkraft_id = ?) OR k.id IN (SELECT kurs_id FROM kurs_lehrkraefte WHERE lehrkraft_id = ?)';
    const params = lk.rolle === 'superadmin' ? [] : [lk.id, lk.id];
    return db
      .prepare(
        `SELECT k.*,
           CASE WHEN k.portal_id IS NULL THEN l.name ELSE COALESCE((SELECT GROUP_CONCAT(x.name, ', ') FROM kurs_lehrkraefte kl JOIN lehrkraefte x ON x.id = kl.lehrkraft_id WHERE kl.kurs_id = k.id), '–') END AS lk_name,
           CASE WHEN k.portal_id IS NULL THEN l.email ELSE 'Portal' END AS lk_email,
           (SELECT COUNT(*) FROM schueler s WHERE s.kurs_id = k.id) AS anzahl,
           (SELECT MAX(last_active_at) FROM schueler s WHERE s.kurs_id = k.id) AS zuletzt
         FROM kurse k JOIN lehrkraefte l ON l.id = k.lehrkraft_id ${where}
         ORDER BY k.created_at DESC, k.id DESC`
      )
      .all(...params)
      .map((r) => ({ ...kursAnsicht(r), lehrkraft: r.lk_name, lehrkraftEmail: r.lk_email, schueler: r.anzahl, zuletztAktiv: r.zuletzt }));
  }

  function neuerKursCode() {
    for (let i = 0; i < 100; i++) {
      const c = S.kursCode();
      if (!db.prepare('SELECT 1 FROM kurse WHERE code = ?').get(c)) return c;
    }
    throw new Error('Kein freier Kurscode gefunden.');
  }

  function kursAnlegen(lk, input) {
    if (lk.sub) throw new ForbiddenError('Kurse legen Sie im Portal an.');
    const name = V.str((input || {}).name, 'Kursname', { min: 2, max: 80 });
    const info = db
      .prepare('INSERT INTO kurse (lehrkraft_id, name, code, einstellungen, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(lk.id, name, neuerKursCode(), JSON.stringify(STANDARD_EINSTELLUNGEN), iso());
    return kursAnsicht(kursRow(info.lastInsertRowid));
  }

  function pruefeEinstellungen(alt, e) {
    const out = { ...alt };
    if (!e || typeof e !== 'object' || Array.isArray(e)) throw new ValidationError('Einstellungen fehlen.');
    if (e.welten !== undefined) {
      if (!Array.isArray(e.welten) || e.welten.length > 10) throw new ValidationError('welten muss eine Liste von Weltnummern sein.');
      out.welten = [...new Set(e.welten.map((x) => V.int(x, 'Welt', { min: 0, max: 9 })))].sort((a, b) => a - b);
    }
    if (e.boss !== undefined) {
      if (!['auto', 'gesperrt', 'offen'].includes(e.boss)) throw new ValidationError('boss muss auto, gesperrt oder offen sein.');
      out.boss = e.boss;
    }
    for (const k of ['scoreboard', 'beamer', 'anmeldung']) if (e[k] !== undefined) out[k] = V.bool(e[k], k);
    if (e.kursart !== undefined) {
      if (!['eA', 'gA'].includes(e.kursart)) throw new ValidationError('kursart muss eA (Leistungskurs) oder gA (Grundkurs) sein.');
      out.kursart = e.kursart;
    }
    return out;
  }

  function kursAendern(lk, kursId, input) {
    const k = kursFuer(lk, kursId);
    const b = input || {};
    // Name eines Portal-Kurses kommt aus dem Portal
    const name = b.name === undefined || k.portal ? k.name : V.str(b.name, 'Kursname', { min: 2, max: 80 });
    const e = b.einstellungen === undefined ? k.einstellungen : pruefeEinstellungen(k.einstellungen, b.einstellungen);
    db.prepare('UPDATE kurse SET name = ?, einstellungen = ? WHERE id = ?').run(name, JSON.stringify(e), k.id);
    return kursAnsicht(kursRow(k.id));
  }

  function bestaetige(k, bestaetigung) {
    if (typeof bestaetigung !== 'string' || bestaetigung.trim() !== k.name.trim()) {
      throw new ValidationError('Zur Bestätigung bitte den Kursnamen exakt eintippen.');
    }
  }

  function kursLoeschen(lk, kursId, bestaetigung) {
    const k = kursFuer(lk, kursId);
    if (k.portal) throw new ForbiddenError('Portal-Kurse werden im Portal gelöscht.');
    bestaetige(k, bestaetigung);
    db.prepare('DELETE FROM kurse WHERE id = ?').run(k.id);
  }

  /* ---------- Schüler ---------- */

  function schuelerAnsicht(r) {
    return { id: r.id, kursId: r.kurs_id, name: r.name, code: r.code, erstellt: r.created_at, zuletztAktiv: r.last_active_at, portal: !!r.sub };
  }

  /** Persönlicher Code, der noch an keinen Schüler vergeben ist (kursübergreifend) – damit sind Name + Code eindeutig. */
  function freierSchuelerCode() {
    const belegt = db.prepare('SELECT 1 FROM schueler WHERE code = ?');
    for (let i = 0; i < 100; i++) {
      const c = S.schuelerCode();
      if (!belegt.get(c)) return c;
    }
    throw new Error('Kein freier Schülercode gefunden.');
  }

  /** Beitritt: Kurscode + Name → neuer Schüler mit persönlichem Code. */
  function beitreten(kurscode, nameRoh) {
    const k = kursPerCode(kurscode);
    if (!k) throw new NotFoundError('Diesen Kurscode gibt es nicht. Bitte prüfe die Eingabe.');
    if (k.portal) throw new ForbiddenError('Dieser Kurs nutzt die Anmeldung über das Portal InfoLabs. Melde dich dort an.');
    if (!k.aktiv) throw new ForbiddenError('Dieser Kurs ist gesperrt.');
    if (!k.einstellungen.anmeldung) throw new ForbiddenError('Die Anmeldung neuer Schüler ist in diesem Kurs geschlossen. Frag deine Lehrkraft.');
    const { name, key } = V.schuelerName(nameRoh);
    if (db.prepare('SELECT 1 FROM schueler WHERE kurs_id = ? AND name_key = ?').get(k.id, key)) {
      throw new ConflictError('Diesen Namen gibt es im Kurs schon. Wenn du das bist: nutze „Weiterspielen“ mit deinem Code. Sonst wähle einen anderen Namen (z. B. mit Initial).');
    }
    if (db.prepare('SELECT COUNT(*) AS n FROM schueler WHERE kurs_id = ?').get(k.id).n >= 300) throw new ForbiddenError('Der Kurs ist voll.');
    const code = freierSchuelerCode();
    const info = db
      .prepare('INSERT INTO schueler (kurs_id, name, name_key, code, created_at, last_active_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(k.id, name, key, code, iso(), iso());
    return { schueler: schuelerAnsicht(db.prepare('SELECT * FROM schueler WHERE id = ?').get(info.lastInsertRowid)), kurs: k, row: db.prepare('SELECT * FROM schueler WHERE id = ?').get(info.lastInsertRowid) };
  }

  /**
   * Wiederanmeldung: Name + persönlicher Code (Kurscode optional). Liefert die Zeile oder null.
   * Ohne Kurscode wird kursübergreifend gesucht; passen mehrere Schüler (nur bei Codes von vor 2.3 möglich),
   * ist der Kurscode nötig (ConflictError mit kurscodeNoetig).
   */
  function anmelden(nameRoh, codeRoh, kurscode) {
    let key;
    try {
      key = V.schuelerName(nameRoh).key;
    } catch {
      return null;
    }
    const code = S.normSchuelerCode(codeRoh);
    if (!code) return null;
    let treffer;
    if (typeof kurscode === 'string' && kurscode.trim()) {
      const k = kursPerCode(kurscode);
      if (!k) return null;
      treffer = db.prepare('SELECT * FROM schueler WHERE kurs_id = ? AND name_key = ?').all(k.id, key);
    } else {
      treffer = db.prepare('SELECT * FROM schueler WHERE name_key = ? AND code = ?').all(key, code);
    }
    treffer = treffer.filter((r) => !r.sub && S.safeEqual(r.code, code));
    if (treffer.length > 1) {
      throw Object.assign(new ConflictError('Name und Code passen zu mehreren Kursen. Gib bitte zusätzlich deinen Kurscode an.'), { extra: { kurscodeNoetig: true } });
    }
    const r = treffer[0];
    if (!r) return null;
    if (kursRow(r.kurs_id).aktiv === 0) throw new ForbiddenError('Dieser Kurs ist gesperrt.');
    db.prepare('UPDATE schueler SET last_active_at = ? WHERE id = ?').run(iso(), r.id);
    return r;
  }

  function ausSession(id, gen) {
    const r = db.prepare('SELECT s.*, k.aktiv AS kurs_aktiv FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE s.id = ?').get(id);
    if (!r || r.session_gen !== gen || r.zugang === 0 || r.kurs_aktiv === 0) return null;
    delete r.kurs_aktiv;
    return r;
  }

  let letzteAktivitaet = new Map();
  /** „zuletzt aktiv“ höchstens einmal pro Minute schreiben. */
  function aktiv(schuelerId) {
    const t = ctx.now();
    if ((letzteAktivitaet.get(schuelerId) || 0) > t - 60000) return;
    letzteAktivitaet.set(schuelerId, t);
    if (letzteAktivitaet.size > 5000) letzteAktivitaet = new Map();
    db.prepare('UPDATE schueler SET last_active_at = ? WHERE id = ?').run(iso(), schuelerId);
  }

  function schuelerFuer(lk, kursId, schuelerId) {
    const k = kursFuer(lk, kursId);
    const r = db.prepare('SELECT * FROM schueler WHERE id = ? AND kurs_id = ?').get(schuelerId, k.id);
    if (!r) throw new NotFoundError('Schüler nicht gefunden.');
    return { k, r };
  }

  function nichtPortal(r) {
    if (r.sub) throw new ForbiddenError('Name und Zugang dieses Schülers werden im Portal verwaltet.');
  }

  function umbenennen(lk, kursId, schuelerId, nameRoh) {
    const { k, r } = schuelerFuer(lk, kursId, schuelerId);
    nichtPortal(r);
    const { name, key } = V.schuelerName(nameRoh);
    const konflikt = db.prepare('SELECT id FROM schueler WHERE kurs_id = ? AND name_key = ? AND id != ?').get(k.id, key, r.id);
    if (konflikt) throw new ConflictError('Diesen Namen gibt es im Kurs schon.');
    db.prepare('UPDATE schueler SET name = ?, name_key = ? WHERE id = ?').run(name, key, r.id);
    return schuelerAnsicht(db.prepare('SELECT * FROM schueler WHERE id = ?').get(r.id));
  }

  /** Neuen Code erzeugen – alte Sitzungen werden ungültig. */
  function neuerCode(lk, kursId, schuelerId) {
    const { r } = schuelerFuer(lk, kursId, schuelerId);
    nichtPortal(r);
    const code = freierSchuelerCode();
    db.prepare('UPDATE schueler SET code = ?, session_gen = session_gen + 1 WHERE id = ?').run(code, r.id);
    return schuelerAnsicht(db.prepare('SELECT * FROM schueler WHERE id = ?').get(r.id));
  }

  function schuelerLoeschen(lk, kursId, schuelerId) {
    const { r } = schuelerFuer(lk, kursId, schuelerId);
    db.prepare('DELETE FROM schueler WHERE id = ?').run(r.id);
  }

  function alleSchuelerLoeschen(lk, kursId, bestaetigung) {
    const k = kursFuer(lk, kursId);
    bestaetige(k, bestaetigung);
    const n = db.transaction(() => {
      const c = db.prepare('DELETE FROM schueler WHERE kurs_id = ?').run(k.id).changes;
      db.prepare('DELETE FROM falsche_antworten WHERE kurs_id = ?').run(k.id);
      return c;
    })();
    return { geloescht: n };
  }

  return {
    neuerKursCode,
    einstellungen,
    kursAnsicht,
    kursRow,
    kursFuer,
    kursPerCode,
    kursListe,
    kursAnlegen,
    kursAendern,
    kursLoeschen,
    beitreten,
    anmelden,
    ausSession,
    aktiv,
    schuelerAnsicht,
    umbenennen,
    neuerCode,
    schuelerLoeschen,
    alleSchuelerLoeschen
  };
}

module.exports = { createKurse };
