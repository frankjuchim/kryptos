'use strict';
// Kern-Kandidat lab-kern: Löschregeln nach VERTRAG §6 und TECHNIK §7.3 (Verbund `loeschen`, Kurs sperren).
// Alles läuft über die Fremdschlüssel-Kaskaden des Schemas (PRAGMA foreign_keys = ON, src/db.js), je Aufruf eine
// Transaktion. Rückgabe = Anzahl gelöschter Konten + Teilnahmen (nachSub) bzw. Kurse + Teilnahmen (nachKurs).

const SUB_MUSTER = /^[asl]:\d{1,15}$/;
const KURS_MUSTER = /^k:\d{1,15}$/;

/**
 * Konto mit allem, was daran hängt: Teilnahmen (Kaskade: Lernstand, Teammitgliedschaften, eigene Funkraum-Nachrichten
 * `von_schueler_id`, Funkraum-Teilnahmen, eigene Arena-Versuche, Erfolge), `kurs_lehrkraefte`, das Konto selbst.
 * Danach Teams, die dadurch leer geworden sind, samt deren Funkraum-Rollen/-Nachrichten und Arena-Chiffren/-Versuchen
 * (Kaskade über teams.id). Teams mit verbleibenden Mitgliedern behalten ihre Team-Ergebnisse (ohne Personenbezug).
 * @returns {number} gelöschte Konten + Teilnahmen (idempotent: zweiter Aufruf 0)
 */
function nachSub(db, sub) {
  if (typeof sub !== 'string' || !SUB_MUSTER.test(sub)) throw new Error('loeschen.nachSub: ungültige sub');
  return db.transaction(() => {
    const teams = db
      .prepare('SELECT DISTINCT m.team_id AS id FROM team_mitglieder m JOIN schueler s ON s.id = m.schueler_id WHERE s.sub = ?')
      .all(sub)
      .map((r) => r.id);
    let n = db.prepare('DELETE FROM schueler WHERE sub = ?').run(sub).changes;
    db.prepare('DELETE FROM kurs_lehrkraefte WHERE sub = ?').run(sub);
    n += db.prepare('DELETE FROM konten WHERE sub = ?').run(sub).changes;
    const leer = db.prepare('DELETE FROM teams WHERE id = ? AND NOT EXISTS (SELECT 1 FROM team_mitglieder WHERE team_id = ?)');
    for (const id of teams) leer.run(id, id);
    return n;
  })();
}

/**
 * Kurs und alles darunter (Kaskade über kurse.id: Teilnahmen + Lernstand, kurs_lehrkraefte, Teams, Funkraum, Arena,
 * falsche_antworten, erfolge). Konten bleiben – das Portal löscht kurslose Schüler separat.
 * @param {string} kursId  Portal-Kurs-ID „k:<n>“
 * @returns {number} gelöschte Kurse + Teilnahmen
 */
function nachKurs(db, kursId) {
  if (typeof kursId !== 'string' || !KURS_MUSTER.test(kursId)) throw new Error('loeschen.nachKurs: ungültige Kurs-ID');
  return db.transaction(() => {
    const k = db.prepare('SELECT id FROM kurse WHERE kurs_id = ?').get(kursId);
    if (!k) return 0;
    const teilnahmen = db.prepare('SELECT COUNT(*) AS n FROM schueler WHERE kurs_id = ?').get(k.id).n;
    return teilnahmen + db.prepare('DELETE FROM kurse WHERE id = ?').run(k.id).changes;
  })();
}

/**
 * Inhalte eines gesperrten Kurses (kurs-aendern aktiv:false, TECHNIK §6.7/§7.3) in der Transaktion des Aufrufers:
 * - laufendes Funkraum-Szenario wie „Beenden“ (§12.7): Status `auswertung`, Nachrichteninhalte und Klartext-Hashes
 *   geleert, Rollen-Zustände (Schlüssel, Zuordnungen) geleert, Funkraum-Teilnahme der Teammitglieder vermerkt;
 * - offene Arena (Status ≠ geschlossen) gelöscht – mit Chiffren, Beurteilungen und Versuchen (Kaskade).
 * Die anonyme Auswertung (Zähler je Team in konfig.auswertung) schreibt der Funkraum-Dienst, sobald es ihn gibt.
 * @param {number} kursLokal  kurse.id
 * @param {string} jetztIso
 */
function kursInhalteBeenden(db, kursLokal, jetztIso) {
  const sz = db.prepare("SELECT id, typ FROM funk_szenarien WHERE kurs_id = ? AND status IN ('vorbereitung', 'laeuft', 'pausiert')").get(kursLokal);
  if (sz) {
    db.prepare("UPDATE funk_nachrichten SET inhalt = '', klartext_hash = NULL WHERE szenario_id = ?").run(sz.id);
    db.prepare("UPDATE funk_rollen SET zustand = '{}' WHERE szenario_id = ?").run(sz.id);
    db.prepare(
      `INSERT OR IGNORE INTO funk_teilnahmen (schueler_id, typ, at)
       SELECT m.schueler_id, ?, ? FROM funk_rollen r JOIN team_mitglieder m ON m.team_id = r.team_id WHERE r.szenario_id = ?`
    ).run(sz.typ, jetztIso, sz.id);
    db.prepare("UPDATE funk_szenarien SET status = 'auswertung', beendet_at = ?, version = version + 1 WHERE id = ?").run(jetztIso, sz.id);
  }
  db.prepare("DELETE FROM arena WHERE kurs_id = ? AND status != 'geschlossen'").run(kursLokal);
}

module.exports = { nachSub, nachKurs, kursInhalteBeenden, SUB_MUSTER, KURS_MUSTER };
