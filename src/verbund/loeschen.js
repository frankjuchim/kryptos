'use strict';
// Kern-Kandidat lab-kern: Löschregeln nach VERTRAG §6 und TECHNIK §7.3 (Verbund `loeschen`, Kurs sperren).
// Alles läuft über die Fremdschlüssel-Kaskaden des Schemas (PRAGMA foreign_keys = ON, src/db.js), je Aufruf eine
// Transaktion. Rückgabe = Anzahl gelöschter Konten + Teilnahmen (nachSub) bzw. Kurse + Teilnahmen (nachKurs).
// Jede Löschung hinterlässt einen Löschvermerk in `loeschungen` (nur Kennung + Zeit, kein Name): Eine spätere
// Rücksicherung eines älteren Backups filtert diese Konten/Kurse wieder heraus (TECHNIK §7.3).
//
// Funkraum/Arena bei einer Löschung nach `sub` (Schüler-Teilnahme; Plan M7 Task 142, Test test/funkraum_betrieb.test.js):
//   - team_mitglieder der Teilnahme (Kaskade über schueler.id)
//   - funk_nachrichten mit von_schueler_id = Teilnahme – auch Weiterleitungen (Mallory-Station übernimmt die id der
//     Original-Sendung) –, samt ihrem Inhalt und Klartext-Hash
//   - funk_teilnahmen und arena_versuche der Teilnahme
//   - ist das Team danach leer: teams-Zeile und über teams.id funk_rollen (samt Zustand: Schlüsselblöcke, Zuordnungen,
//     Meldungen), alle Nachrichten von/an/„angezeigt von“ dem Team, arena_chiffren (Beschreibung, Beurteilung, Hash) und
//     deren Versuche; Partner-Rollen behalten ihre Zeile mit partner_id = NULL („Euer Partnerteam ist nicht mehr
//     dabei.“), geknackt_von wird NULL
//   - funk_ereignisse enthalten nur Codes/ids und bleiben bis zum Schließen bzw. 24 h nach Anlage

const SUB_MUSTER = /^[asl]:\d{1,15}$/;
const KURS_MUSTER = /^k:\d{1,15}$/;

/** Löschvermerk schreiben bzw. Zeit aktualisieren (in der Transaktion des Aufrufers). */
function vermerke(db, art, schluessel, jetztIso) {
  db.prepare('INSERT INTO loeschungen (art, schluessel, zeit) VALUES (?, ?, ?) ON CONFLICT(art, schluessel) DO UPDATE SET zeit = excluded.zeit').run(
    art,
    schluessel,
    jetztIso || new Date().toISOString()
  );
}

/**
 * Konto mit allem, was daran hängt: Teilnahmen (Kaskade: Lernstand, Teammitgliedschaften, eigene Funkraum-Nachrichten
 * `von_schueler_id`, Funkraum-Teilnahmen, eigene Arena-Versuche, Erfolge), `kurs_lehrkraefte`, das Konto selbst.
 * Danach Teams, die dadurch leer geworden sind, samt deren Funkraum-Rollen/-Nachrichten und Arena-Chiffren/-Versuchen
 * (Kaskade über teams.id). Teams mit verbleibenden Mitgliedern behalten ihre Team-Ergebnisse (ohne Personenbezug).
 * @param {{ jetzt?: string, merken?: boolean }} [o]  jetzt = ISO-Zeit des Löschvermerks; merken: false beim
 *   Herausfiltern während einer Rücksicherung (Vermerk bleibt unverändert)
 * @returns {number} gelöschte Konten + Teilnahmen (idempotent: zweiter Aufruf 0)
 */
function nachSub(db, sub, { jetzt, merken = true } = {}) {
  if (typeof sub !== 'string' || !SUB_MUSTER.test(sub)) throw new Error('loeschen.nachSub: ungültige sub');
  return db.transaction(() => {
    if (merken) vermerke(db, 'sub', sub, jetzt);
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
 * @param {{ jetzt?: string, merken?: boolean }} [o]  wie nachSub
 * @returns {number} gelöschte Kurse + Teilnahmen
 */
function nachKurs(db, kursId, { jetzt, merken = true } = {}) {
  if (typeof kursId !== 'string' || !KURS_MUSTER.test(kursId)) throw new Error('loeschen.nachKurs: ungültige Kurs-ID');
  return db.transaction(() => {
    if (merken) vermerke(db, 'kurs', kursId, jetzt);
    const k = db.prepare('SELECT id FROM kurse WHERE kurs_id = ?').get(kursId);
    if (!k) return 0;
    const teilnahmen = db.prepare('SELECT COUNT(*) AS n FROM schueler WHERE kurs_id = ?').get(k.id).n;
    return teilnahmen + db.prepare('DELETE FROM kurse WHERE id = ?').run(k.id).changes;
  })();
}

/**
 * Inhalte eines gesperrten Kurses (kurs-aendern aktiv:false, TECHNIK §6.7/§7.3, Plan M7 E111) in der Transaktion des
 * Aufrufers:
 * - Funkraum-Szenario in `vorbereitung` wird gelöscht (wie „abbrechen“, keine Funkraum-Teilnahme);
 * - laufendes/pausiertes Szenario wird beendet: mit Callback `szenarioBeenden(db, szenarioId, jetzt)` – der
 *   Funkraum-Dienst beendet mit Auswertung (§12.7; `src/verbund/` bleibt krypto-frei) –, ohne Callback generisch
 *   (Inhalte, Klartext-Hashes, Schlüssel-Etiketten, Rollen-Zustände und konfig geleert, Teilnahmen vermerkt, Status
 *   `auswertung`, keine Auswertung);
 * - offene Arena (Status ≠ geschlossen) gelöscht – mit Chiffren, Beurteilungen und Versuchen (Kaskade).
 * @param {number} kursLokal  kurse.id
 * @param {string} jetztIso
 * @param {{ szenarioBeenden?: Function }} [o]
 */
function kursInhalteBeenden(db, kursLokal, jetztIso, { szenarioBeenden } = {}) {
  const sz = db.prepare("SELECT id, typ, status FROM funk_szenarien WHERE kurs_id = ? AND status IN ('vorbereitung', 'laeuft', 'pausiert')").get(kursLokal);
  if (sz && sz.status === 'vorbereitung') {
    db.prepare('DELETE FROM funk_szenarien WHERE id = ?').run(sz.id);
  } else if (sz && szenarioBeenden) {
    szenarioBeenden(db, sz.id, jetztIso);
  } else if (sz) {
    db.prepare("UPDATE funk_nachrichten SET inhalt = '', klartext_hash = NULL, fuer_schluessel = NULL WHERE szenario_id = ?").run(sz.id);
    db.prepare("UPDATE funk_rollen SET zustand = '{}' WHERE szenario_id = ?").run(sz.id);
    db.prepare(
      `INSERT OR IGNORE INTO funk_teilnahmen (schueler_id, typ, at)
       SELECT m.schueler_id, ?, ? FROM funk_rollen r JOIN team_mitglieder m ON m.team_id = r.team_id WHERE r.szenario_id = ?`
    ).run(sz.typ, jetztIso, sz.id);
    db.prepare("UPDATE funk_szenarien SET status = 'auswertung', konfig = '{}', beendet_at = ?, version = version + 1 WHERE id = ?").run(jetztIso, sz.id);
  }
  db.prepare("DELETE FROM arena WHERE kurs_id = ? AND status != 'geschlossen'").run(kursLokal);
}

module.exports = { nachSub, nachKurs, kursInhalteBeenden, SUB_MUSTER, KURS_MUSTER };
