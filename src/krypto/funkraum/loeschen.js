/* Kryptos – Funkraum: Beenden und Löschen (TECHNIK §7.3, §12.7, Plan M7 Task 132, E111).
   Beenden (Status `auswertung`) leert in EINER Transaktion alle Inhalte (Nachrichten, Klartext-Hashes, Schlüssel-Etiketten
   der Umschläge), alle Rollen-Zustände (Schlüssel, Zuordnungen) und alle Geheimnisse in `konfig` (Salz, Schlüssel,
   Lösungen); übrig bleibt nur die anonyme Auswertung (Zahlen, ids, Codes) bis zum Schließen bzw. 24 h nach Anlage.
   Kurs gesperrt: `vorbereitung` → löschen (wie „abbrechen“), `laeuft`/`pausiert` → beenden mit Auswertung.
   Nach Beenden und Löschen wird das WAL geleert (`walLeeren`, Plan M7 Task 160). */
'use strict';

const { walLeeren } = require('../../verbund/loeschen');

const OFFEN = ['vorbereitung', 'laeuft', 'pausiert'];

/** anonyme Auswertung: je Team mit Rolle gesendet/angekommen/geknackt, Ereignis-Codes gezählt – nur Zahlen */
function auswertungGenerisch(db, szId) {
  const teams = {};
  for (const r of db.prepare('SELECT team_id FROM funk_rollen WHERE szenario_id = ? ORDER BY team_id').all(szId)) {
    teams[r.team_id] = { gesendet: 0, angekommen: 0, geknackt: 0 };
  }
  const zeilen = db
    .prepare(
      `SELECT von_team_id AS team, COUNT(*) AS gesendet, SUM(angekommen != 0) AS angekommen, SUM(geknackt_von IS NOT NULL) AS geknackt
       FROM funk_nachrichten WHERE szenario_id = ? GROUP BY von_team_id`
    )
    .all(szId);
  for (const z of zeilen) {
    teams[z.team] = { gesendet: z.gesendet, angekommen: z.angekommen || 0, geknackt: z.geknackt || 0 };
  }
  const ereignisse = {};
  for (const e of db.prepare('SELECT code, COUNT(*) AS n FROM funk_ereignisse WHERE szenario_id = ? GROUP BY code ORDER BY code').all(szId)) {
    ereignisse[e.code] = e.n;
  }
  return { teams, ereignisse };
}

/**
 * Szenario beenden (eine Transaktion). Bereits beendet → nichts (false).
 * @param {{ jetzt: string, auswertung?: Function, typ?: string }} o  auswertung(db, szId) → nur Zahlen/ids/Codes;
 *   typ = Funkraum-Teilnahme (Standard: Typ des Szenarios)
 * @returns {boolean} beendet
 */
function beenden(db, szId, { jetzt, auswertung = auswertungGenerisch, typ } = {}) {
  if (typeof jetzt !== 'string') throw new Error('funkraum.beenden: jetzt fehlt');
  const beendet = db.transaction(() => {
    const sz = db.prepare('SELECT id, typ, status, version FROM funk_szenarien WHERE id = ?').get(szId);
    if (!sz) throw new Error('funkraum.beenden: Szenario unbekannt');
    if (sz.status === 'auswertung') return false;
    const ergebnis = auswertung(db, szId); // vor dem Leeren berechnen
    const version = sz.version + 1;
    db.prepare("UPDATE funk_nachrichten SET inhalt = '', klartext_hash = NULL, fuer_schluessel = NULL WHERE szenario_id = ?").run(szId);
    db.prepare("UPDATE funk_rollen SET zustand = '{}' WHERE szenario_id = ?").run(szId);
    db.prepare(
      `INSERT OR IGNORE INTO funk_teilnahmen (schueler_id, typ, at)
       SELECT m.schueler_id, ?, ? FROM funk_rollen r JOIN team_mitglieder m ON m.team_id = r.team_id WHERE r.szenario_id = ?`
    ).run(typ || sz.typ, jetzt, szId);
    db.prepare("UPDATE funk_szenarien SET status = 'auswertung', konfig = ?, beendet_at = ?, version = ? WHERE id = ?").run(
      JSON.stringify({ auswertung: ergebnis }),
      jetzt,
      version,
      szId
    );
    db.prepare("INSERT INTO funk_ereignisse (szenario_id, code, daten, version, zeit) VALUES (?, 'status', ?, ?, ?)").run(
      szId,
      JSON.stringify({ status: 'auswertung' }),
      version,
      jetzt
    );
    return true;
  })();
  if (beendet) walLeeren(db); // alte Seitenstände mit Inhalten nicht im WAL lassen (in einer Transaktion: Aufrufer)
  return beendet;
}

/** Szenario löschen (Schließen, Abbrechen, Wartung) – Kaskade auf Rollen, Nachrichten, Ereignisse. → Anzahl */
function loesche(db, szId) {
  const n = db.prepare('DELETE FROM funk_szenarien WHERE id = ?').run(szId).changes;
  walLeeren(db);
  return n;
}

/**
 * Kurs gesperrt (E111): `vorbereitung` → löschen (keine Teilnahme), `laeuft`/`pausiert` → beenden mit Auswertung.
 * @param {{ beenden?: (db, szId, jetzt) => void }} o  Beenden des Funkraum-Dienstes (typ-spezifische Auswertung);
 *   ohne Callback die generische Auswertung
 */
function kursGesperrt(db, kursLokal, jetzt, { beenden: beende } = {}) {
  const sz = db.prepare(`SELECT id, status FROM funk_szenarien WHERE kurs_id = ? AND status IN (${OFFEN.map(() => '?').join(', ')})`).get(kursLokal, ...OFFEN);
  if (!sz) return;
  if (sz.status === 'vorbereitung') loesche(db, sz.id);
  else if (beende) beende(db, sz.id, jetzt);
  else beenden(db, sz.id, { jetzt });
}

module.exports = { auswertungGenerisch, beenden, loesche, kursGesperrt };
