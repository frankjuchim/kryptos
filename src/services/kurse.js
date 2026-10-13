'use strict';
// Kurse kommen vom Portal (TECHNIK §2.1 „kurse.js E“, §6.6): Kurs-ID k:<n>, Name aus dem Token, lokale id für die
// Lehrkraft-API. Lehrkräfte sehen nur Kurse mit aktiver Zeile in kurs_lehrkraefte, der Superadmin alle.
// Beitritt, Kurscodes, Anlegen, Umbenennen und Löschen gibt es hier nicht mehr (Portal). upsertAusToken gleicht beim
// SSO Kurse, Teilnahmen bzw. kurs_lehrkraefte mit der Kursliste des Tokens ab (TECHNIK §6.6).

const V = require('../validate');
const S = require('../security');
const { STANDARD_EINSTELLUNGEN } = require('../domain');
const { WERKZEUG_IDS } = require('../krypto/werkzeuge');

const { ValidationError, NotFoundError } = V;

/**
 * Einstellungen, die es in Kryptos nicht mehr gibt (werden ignoriert und nicht angezeigt, TECHNIK §6.5);
 * `kursart` (Kern) heißt in Kryptos `niveau` (TECHNIK §7.2, Plan M3 E4).
 */
const ENTFALLEN = ['anmeldung', 'kursart'];

function createKurse(ctx) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();

  function einstellungen(json) {
    let e = {};
    try {
      e = JSON.parse(json) || {};
    } catch {
      e = {};
    }
    const out = { ...STANDARD_EINSTELLUNGEN, ...e };
    // gespeicherte Kern-Einstellung kursart übernehmen, solange niveau fehlt
    if (e.niveau === undefined && ['eA', 'gA'].includes(e.kursart)) out.niveau = e.kursart;
    for (const k of ENTFALLEN) delete out[k];
    if (!['eA', 'gA'].includes(out.niveau)) out.niveau = STANDARD_EINSTELLUNGEN.niveau;
    if (!['frei', 'gesperrt'].includes(out.kuer)) out.kuer = STANDARD_EINSTELLUNGEN.kuer;
    if (!Array.isArray(out.welten)) out.welten = [...STANDARD_EINSTELLUNGEN.welten];
    out.werkzeuge = werkzeugeLesen(out.werkzeuge);
    return out;
  }

  /** Gespeicherte Werkzeug-Freigaben: nur bekannte ids mit 'frei'/'gesperrt' (Ungültiges wird verworfen), immer neue Kopie. */
  function werkzeugeLesen(w) {
    const out = {};
    if (!w || typeof w !== 'object' || Array.isArray(w)) return out;
    for (const id of WERKZEUG_IDS) if (w[id] === 'frei' || w[id] === 'gesperrt') out[id] = w[id];
    return out;
  }

  function kursAnsicht(r) {
    if (!r) return null;
    return {
      id: r.id,
      kurs: r.kurs_id,
      name: r.name,
      einstellungen: einstellungen(r.einstellungen),
      boardSchluessel: r.board_schluessel,
      erstellt: r.created_at,
      aktiv: r.aktiv !== 0
    };
  }

  function kursRow(id) {
    return db.prepare('SELECT * FROM kurse WHERE id = ?').get(id);
  }

  /** Darf die Lehrkraft (helpers.lehrkraft: { konto, kurse }) den Kurs sehen? */
  function darf(lk, r) {
    return lk.konto.rolle === 'superadmin' || lk.kurse.includes(r.id);
  }

  /** Kurs mit Zugriffsprüfung. Fremde Kurse → 404 (Existenz nicht verraten). */
  function kursFuer(lk, kursId) {
    const r = kursRow(kursId);
    if (!r || !darf(lk, r)) throw new NotFoundError('Kurs nicht gefunden.');
    return kursAnsicht(r);
  }

  /** Kurs zum Board-Schlüssel (Beamer-Board, öffentlich) oder null. */
  function kursPerBoardSchluessel(schluessel) {
    if (typeof schluessel !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(schluessel)) return null;
    return kursAnsicht(db.prepare('SELECT * FROM kurse WHERE board_schluessel = ?').get(schluessel));
  }

  function kursListe(lk) {
    const superadmin = lk.konto.rolle === 'superadmin';
    return db
      .prepare(
        `SELECT k.*,
           COALESCE((SELECT GROUP_CONCAT(x.name, ', ') FROM kurs_lehrkraefte kl JOIN konten x ON x.sub = kl.sub
                     WHERE kl.kurs_id = k.id AND kl.aktiv = 1 AND x.rolle = 'lehrkraft'), '–') AS lk_name,
           (SELECT COUNT(*) FROM schueler s WHERE s.kurs_id = k.id) AS anzahl,
           (SELECT MAX(last_active_at) FROM schueler s WHERE s.kurs_id = k.id) AS zuletzt
         FROM kurse k
         ${superadmin ? '' : 'WHERE k.id IN (SELECT kurs_id FROM kurs_lehrkraefte WHERE sub = ? AND aktiv = 1)'}
         ORDER BY k.name COLLATE NOCASE, k.id`
      )
      .all(...(superadmin ? [] : [lk.konto.sub]))
      .map((r) => ({ ...kursAnsicht(r), lehrkraft: r.lk_name, schueler: r.anzahl, zuletztAktiv: r.zuletzt }));
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
    for (const k of ['scoreboard', 'beamer']) if (e[k] !== undefined) out[k] = V.bool(e[k], k);
    if (e.niveau !== undefined) {
      if (!['eA', 'gA'].includes(e.niveau)) throw new ValidationError('niveau muss eA oder gA sein.');
      out.niveau = e.niveau;
    }
    if (e.kuer !== undefined) {
      if (!['frei', 'gesperrt'].includes(e.kuer)) throw new ValidationError('kuer muss frei oder gesperrt sein.');
      out.kuer = e.kuer;
    }
    if (e.werkzeuge !== undefined) {
      // zusammenführen: 'auto' entfernt den Eintrag (TECHNIK §7.2, §10.3)
      const w = e.werkzeuge;
      if (!w || typeof w !== 'object' || Array.isArray(w)) throw new ValidationError('werkzeuge muss ein Objekt { Werkzeug: auto, frei oder gesperrt } sein.');
      const neu = werkzeugeLesen(out.werkzeuge);
      for (const [id, wert] of Object.entries(w)) {
        if (!WERKZEUG_IDS.includes(id)) throw new ValidationError(`werkzeuge: unbekanntes Werkzeug „${String(id).slice(0, 40)}“.`);
        if (!['auto', 'frei', 'gesperrt'].includes(wert)) throw new ValidationError(`werkzeuge: ${id} muss auto, frei oder gesperrt sein.`);
        if (wert === 'auto') delete neu[id];
        else neu[id] = wert;
      }
      out.werkzeuge = neu;
    }
    for (const k of ENTFALLEN) delete out[k];
    return out;
  }

  /** Board-Schlüssel neu vergeben (der alte wird sofort ungültig); gesperrter Kurs → 403, fremder → 404. */
  function boardSchluesselNeu(lk, kursId) {
    const k = kursFuer(lk, kursId);
    if (!k.aktiv) throw new V.ForbiddenError('Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.');
    const neu = S.zufallsText(9);
    db.prepare('UPDATE kurse SET board_schluessel = ?, updated_at = ? WHERE id = ?').run(neu, iso(), k.id);
    return { boardSchluessel: neu };
  }

  /** Nur Einstellungen; den Namen verwaltet das Portal (TECHNIK §6.5: `name` wird abgelehnt). */
  function kursAendern(lk, kursId, input) {
    const k = kursFuer(lk, kursId);
    const b = input || {};
    if (b.name !== undefined) throw new ValidationError('Den Kursnamen ändern Sie im Portal.');
    // vom Portal gesperrt (Verbund kurs-aendern aktiv:false, TECHNIK §6.7): nur lesend
    if (!k.aktiv) throw new V.ForbiddenError('Kryptos ist für diesen Kurs im Portal abgeschaltet. Der Kurs ist nur lesbar.');
    const e = b.einstellungen === undefined ? k.einstellungen : pruefeEinstellungen(k.einstellungen, b.einstellungen);
    db.prepare('UPDATE kurse SET einstellungen = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(e), iso(), k.id);
    return kursAnsicht(kursRow(k.id));
  }

  /** Teilnahme-Name nach der Kernregel (2–30 Zeichen, Buchstaben/Ziffern/„ .-'“); Ungültiges wird bereinigt. */
  function teilnahmeName(name, sub) {
    try {
      return V.schuelerName(name);
    } catch {
      let n = String(name)
        .normalize('NFC')
        .replace(/[^\p{L}\p{N} .\-']/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 30)
        .trim();
      if (n.length < 2) n = `Schüler ${sub.slice(2)}`.slice(0, 30);
      return V.schuelerName(n);
    }
  }

  /**
   * Kursabgleich aus dem SSO-Token (TECHNIK §6.6 Schritte 2–4) – Aufruf innerhalb der Transaktion von /sso/ende,
   * nach konten.upsert. Neue Kurse: Standard-Einstellungen, aktiv, neuer Board-Schlüssel; vorhandene: nur der Name
   * (aktiv steuert allein die Verbund-API). Schüler: Teilnahmen der Token-Kurse aktiv, alle anderen inaktiv (Lernstand
   * bleibt). Lehrkraft: kurs_lehrkraefte entsprechend; Superadmin: keine kurs_lehrkraefte-Zeilen (sieht alle Kurse).
   * Liefert die lokalen Kurs-ids der Token-Kurse.
   */
  function upsertAusToken(sub, rolle, liste) {
    const jetzt = iso();
    const standard = { ...STANDARD_EINSTELLUNGEN };
    for (const k of ENTFALLEN) delete standard[k];
    const suche = db.prepare('SELECT id, name FROM kurse WHERE kurs_id = ?');
    const neu = db.prepare('INSERT INTO kurse (kurs_id, name, einstellungen, aktiv, board_schluessel, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)');
    const umbenennen = db.prepare('UPDATE kurse SET name = ?, updated_at = ? WHERE id = ?');
    const ids = [];
    for (const k of liste) {
      const name = k.name.trim();
      const r = suche.get(k.id);
      if (r) {
        if (r.name !== name) umbenennen.run(name, jetzt, r.id);
        ids.push(r.id);
      } else {
        ids.push(Number(neu.run(k.id, name, JSON.stringify(standard), S.zufallsText(9), jetzt, jetzt).lastInsertRowid));
      }
    }
    const idListe = JSON.stringify([...new Set(ids)]);
    if (rolle === 'schueler') {
      const konto = db.prepare('SELECT name FROM konten WHERE sub = ?').get(sub);
      const { name, key } = teilnahmeName(konto ? konto.name : '', sub);
      const teilnahme = db.prepare(
        `INSERT INTO schueler (kurs_id, sub, name, name_key, aktiv, created_at) VALUES (?, ?, ?, ?, 1, ?)
         ON CONFLICT(kurs_id, sub) DO UPDATE SET name = excluded.name, name_key = excluded.name_key, aktiv = 1`
      );
      for (const id of new Set(ids)) teilnahme.run(id, sub, name, key, jetzt);
      db.prepare('UPDATE schueler SET aktiv = 0 WHERE sub = ? AND kurs_id NOT IN (SELECT value FROM json_each(?))').run(sub, idListe);
    } else if (rolle === 'superadmin') {
      // Superadmin sieht ohnehin alle Kurse (sitzung.lehrkraft) – keine Zuordnung, sonst stünde er als Lehrkraft im Kurs
      db.prepare('DELETE FROM kurs_lehrkraefte WHERE sub = ?').run(sub);
    } else {
      const zuordnung = db.prepare('INSERT INTO kurs_lehrkraefte (kurs_id, sub, aktiv) VALUES (?, ?, 1) ON CONFLICT(kurs_id, sub) DO UPDATE SET aktiv = 1');
      for (const id of new Set(ids)) zuordnung.run(id, sub);
      db.prepare('UPDATE kurs_lehrkraefte SET aktiv = 0 WHERE sub = ? AND kurs_id NOT IN (SELECT value FROM json_each(?))').run(sub, idListe);
    }
    return ids;
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

  return { einstellungen, kursAnsicht, kursRow, kursFuer, kursPerBoardSchluessel, kursListe, kursAendern, pruefeEinstellungen, boardSchluesselNeu, aktiv, upsertAusToken };
}

module.exports = { createKurse };
