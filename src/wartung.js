'use strict';
// Wartungsjob (TECHNIK §7.4): läuft beim Start und danach stündlich (Timer mit unref), jede Aufgabe in eigener
// Transaktion; ein Fehler in einer Aufgabe hält die anderen nicht auf. Der letzte Bericht (Zeitpunkt, Anzahlen,
// Fehler) bleibt im Speicher für GET /api/admin/wartung.
//   1. Funkraum: Szenarien nach `endet_spaetestens` (24 h nach Anlage) löschen (Kaskade: Rollen, Nachrichten, Ereignisse)
//   2. Arena: abgelaufene Angriffsphasen (`angriff_bis`) beenden – Rückfall, sonst beim nächsten Zugriff (Plan M7 E102);
//      geschlossene Arenen 30 Tage nach `geschlossen_at` löschen (Kaskade: Chiffren, Beurteilungen, Versuche)
//   3. sso_jti: Einträge mit exp < jetzt − 60 s
//   4. Boss: laufende Kämpfe mit abgelaufener Frist auswerten (Kern-Funktion boss.raeumeAuf je Teilnahme)
//   5. Löschvermerke (loeschungen) 400 Tage nach der Löschung entfernen
//   6. WAL leeren (wal_checkpoint(TRUNCATE), damit Gelöschtes nicht im -wal stehen bleibt; Plan M7 Task 160)
//   7. PRAGMA optimize (höchstens wöchentlich)

const { BOSS_KULANZ_MS } = require('./domain');
const { walLeeren } = require('./verbund/loeschen');

const STUNDE_MS = 3600 * 1000;
const ARENA_FRIST_MS = 30 * 24 * STUNDE_MS;
const OPTIMIZE_MS = 7 * 24 * STUNDE_MS;
const LOESCHVERMERK_MS = 400 * 24 * STUNDE_MS;

/**
 * @param {object} o
 * @param {import('better-sqlite3').Database} o.db
 * @param {object} o.svc       Dienste (boss.raeumeAuf)
 * @param {Function} [o.now]   Uhr (ms) – in Tests steuerbar
 * @param {Function} [o.log]
 * @param {Function} [o.arenaFrist]  () → Anzahl beendeter Angriffsphasen (Arena-Dienst, Plan M7 Task 143)
 */
function createWartung({ db, svc, now = () => Date.now(), log = () => {}, arenaFrist = () => 0 }) {
  let letzter = null;
  let optimiertAm = null;
  let timer = null;

  function lauf() {
    const t = now();
    const iso = (ms) => new Date(ms).toISOString();
    const anzahlen = { funkraum: 0, arenaFrist: 0, arena: 0, jti: 0, boss: 0, loeschungen: 0 };
    const fehler = [];
    const schritt = (name, fn) => {
      try {
        anzahlen[name] = db.transaction(fn)();
      } catch (e) {
        fehler.push(`${name}: ${e.message}`);
      }
    };

    schritt('funkraum', () => db.prepare('DELETE FROM funk_szenarien WHERE endet_spaetestens < ?').run(iso(t)).changes);
    schritt('arenaFrist', () => arenaFrist());
    schritt('arena', () => db.prepare("DELETE FROM arena WHERE status = 'geschlossen' AND geschlossen_at IS NOT NULL AND geschlossen_at < ?").run(iso(t - ARENA_FRIST_MS)).changes);
    schritt('jti', () => db.prepare('DELETE FROM sso_jti WHERE exp < ?').run(Math.floor(t / 1000) - 60).changes);
    schritt('boss', () => {
      const offen = db.prepare('SELECT id, schueler_id, deadline_at FROM boss_versuche WHERE ende_at IS NULL').all();
      const faellig = offen.filter((r) => t > Date.parse(r.deadline_at) + BOSS_KULANZ_MS);
      const teilnahmen = [...new Set(faellig.map((r) => r.schueler_id))];
      for (const sid of teilnahmen) {
        const s = db.prepare('SELECT * FROM schueler WHERE id = ?').get(sid);
        if (s) svc.boss.raeumeAuf(s);
      }
      return faellig.length;
    });

    schritt('loeschungen', () => db.prepare('DELETE FROM loeschungen WHERE zeit < ?').run(iso(t - LOESCHVERMERK_MS)).changes);
    walLeeren(db); // gelöschte Inhalte auch aus dem WAL (Plan M7 Task 160)

    let optimiert = false;
    if (optimiertAm === null || t - optimiertAm >= OPTIMIZE_MS) {
      try {
        db.pragma('optimize');
        optimiertAm = t;
        optimiert = true;
      } catch (e) {
        fehler.push(`optimize: ${e.message}`);
      }
    }

    letzter = { zeit: iso(t), anzahlen, optimiert, fehler };
    if (fehler.length) log(`Wartung: ${fehler.join(' · ')}`);
    return letzter;
  }

  /** Sofort laufen lassen und danach stündlich; der Timer hält den Prozess nicht offen. */
  function starte(intervallMs = STUNDE_MS) {
    stop();
    lauf();
    timer = setInterval(lauf, intervallMs);
    timer.unref();
    return timer;
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { lauf, starte, stop, bericht: () => letzter };
}

module.exports = { createWartung };
