'use strict';
// Testhilfe Funkraum/Arena (Plan M7 Tasks 132/133). Task 132: Volltextsuche `fundstellen`; Task 133 ergänzt Kurs mit
// Teams über die echte API, festen Zufall usw.

/** Volltextsuche über alle TEXT-Spalten aller Tabellen → [`tabelle.spalte`] mit Treffer. Groß/Klein zählt (instr):
    „GEHEIMTEXT“ soll nicht das Wort „Geheimtext“ in Aufgabentexten finden. */
function fundstellen(db, nadel) {
  const treffer = [];
  const tabellen = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  for (const { name } of tabellen) {
    const spalten = db.prepare(`PRAGMA table_info("${name}")`).all().filter((s) => /TEXT|CHAR|CLOB|^$/i.test(s.type));
    for (const s of spalten) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM "${name}" WHERE instr(CAST("${s.name}" AS TEXT), ?) > 0`).get(String(nadel)).n;
      if (n > 0) treffer.push(`${name}.${s.name}`);
    }
  }
  return treffer;
}

module.exports = { fundstellen };
