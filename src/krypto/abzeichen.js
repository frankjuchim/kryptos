'use strict';
/* Kryptos – Abzeichen über die Kern-Hooks (TECHNIK §4.2, §9.6, §12.7; Plan M7 Task 147, E100, E112):
   - Zusatz-Abzeichen „Funkraum-Veteran“, „Arena-Knacker“, „Unknackbar“ (zusatzAbzeichen/zusatzBedingungen),
   - Artefakte = die Boss-Abzeichen der Epochen 0–6 (Name „Artefakt: …“, Sprite des Artefakts),
   - Server-Icons: jede Definition trägt eine Sprite-Kennung `a-…` aus public/static/img/abzeichen.svg (abzeichenAnzeige, K42).
   Bedingungen lesen nur Zähler und Zustände (funk_teilnahmen, arena_versuche, arena_chiffren) – nie Inhalte. */

/** Artefakt-Sprites und -Namen je Epoche 0–6 (gleich KRProfil.ARTEFAKT/ARTEFAKT_NAME, Test) */
const ARTEFAKT = Object.freeze(['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen', 'a-schluessel', 'a-siegel', 'a-kern']);
const ARTEFAKT_NAME = Object.freeze(['Skytale', 'Al-Kindis Manuskript', 'Vigenère-Tafel', 'Lochstreifen', 'Schlüsselpaar', 'Siegel', 'Chronoskop-Kern']);

/** feste Icons je Abzeichen-Schlüssel (bisher KRProfil FEST, M4 E32) */
const ICONS = Object.freeze({
  erste_schritte: 'a-stern',
  fleissig: 'a-stern',
  unermuedlich: 'a-stern',
  weltenbummler: 'a-stern',
  ohne_tipp: 'a-stern',
  zehnerserie: 'a-serie',
  makellos: 'a-siegel',
  fallensucher: 'a-falle',
  trainingsprofi: 'a-training',
  kata_meister: 'a-warmup',
  funkraum_veteran: 'a-funk',
  arena_knacker: 'a-knacker',
  unknackbar: 'a-unknackbar'
});

/** Mindestzahl verschiedener Szenario-Typen für „Funkraum-Veteran“ (TECHNIK §12.7) */
const VETERAN_TYPEN = 3;

const ZUSATZ = Object.freeze([
  Object.freeze({ key: 'funkraum_veteran', icon: 'a-funk', name: 'Funkraum-Veteran', beschreibung: 'An drei verschiedenen Funkraum-Szenarien teilgenommen.' }),
  Object.freeze({ key: 'arena_knacker', icon: 'a-knacker', name: 'Arena-Knacker', beschreibung: 'Mit deinem Team eine fremde Chiffre in der Knack-Arena geknackt.' }),
  Object.freeze({ key: 'unknackbar', icon: 'a-unknackbar', name: 'Unknackbar', beschreibung: 'Die Chiffre deines Teams blieb in der Knack-Arena ungeknackt.' })
]);

/** Hook zusatzAbzeichen(katalog) → Definitionen (Kopien, damit der Kern sie nicht verändert) */
function zusatzAbzeichen() {
  return ZUSATZ.map((d) => ({ ...d }));
}

const SQL = {
  veteran: 'SELECT COUNT(DISTINCT typ) AS n FROM funk_teilnahmen WHERE schueler_id = ?',
  // erfolgreicher Angriff des eigenen Teams auf eine fremde Chiffre
  knacker: `SELECT 1 FROM team_mitglieder m
              JOIN arena_versuche v ON v.team_id = m.team_id AND v.erfolg = 1
              JOIN arena_chiffren c ON c.id = v.chiffre_id AND c.team_id <> v.team_id
             WHERE m.schueler_id = ? LIMIT 1`,
  // Chiffre des eigenen Teams nach dem Ende der Angriffsphase ungeknackt (E100)
  unknackbar: `SELECT 1 FROM team_mitglieder m
                 JOIN arena_chiffren c ON c.team_id = m.team_id AND c.geknackt_at IS NULL
                 JOIN arena a ON a.id = c.arena_id AND a.status IN ('beurteilung', 'geschlossen')
                WHERE m.schueler_id = ? LIMIT 1`
};

/** Hook zusatzBedingungen(sid, db) → Set der erfüllten Zusatz-Abzeichen */
function zusatzBedingungen(sid, db) {
  const erfuellt = new Set();
  if (db.prepare(SQL.veteran).get(sid).n >= VETERAN_TYPEN) erfuellt.add('funkraum_veteran');
  if (db.prepare(SQL.knacker).get(sid)) erfuellt.add('arena_knacker');
  if (db.prepare(SQL.unknackbar).get(sid)) erfuellt.add('unknackbar');
  return erfuellt;
}

/** Sprite-Kennung zu einem Abzeichen-Schlüssel (null = unbekannt) */
function iconFuer(key) {
  let m = /^boss(\d+)_besiegt$/.exec(key);
  if (m) return ARTEFAKT[Number(m[1])] || 'a-siegel';
  m = /^welt\d+_gemeistert$/.exec(key);
  if (m) return 'a-welt';
  return Object.prototype.hasOwnProperty.call(ICONS, key) ? ICONS[key] : null;
}

/** Hook abzeichenAnzeige(definition) → definition' (K42): Artefakte benennen, Server-Icons setzen */
function abzeichenAnzeige(d) {
  if (!d || typeof d.key !== 'string') return d;
  const m = /^boss(\d+)_besiegt$/.exec(d.key);
  if (m && Number(m[1]) < ARTEFAKT.length) {
    const n = Number(m[1]);
    return { ...d, icon: ARTEFAKT[n], name: 'Artefakt: ' + ARTEFAKT_NAME[n], beschreibung: `${d.name} – das Artefakt der Epoche gehört dir.` };
  }
  const icon = iconFuer(d.key);
  return icon ? { ...d, icon } : d;
}

module.exports = { ARTEFAKT, ARTEFAKT_NAME, ICONS, ZUSATZ, VETERAN_TYPEN, zusatzAbzeichen, zusatzBedingungen, abzeichenAnzeige, iconFuer };
