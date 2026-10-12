'use strict';
// Datenschutz (TECHNIK §15): Löschung nach sub entfernt alle personenbezogenen Zeilen (VERTRAG §6, TECHNIK §7.3).
// Die Abfrage ist generisch: jede Tabelle mit einer Spalte sub, schueler_id oder von_schueler_id wird durchsucht –
// neue Tabellen fallen so automatisch unter den Test.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const H = require('./helpers');

const PERSONEN_SPALTEN = ['sub', 'schueler_id', 'von_schueler_id'];

/** { tabelle: [spalten] } aller Tabellen mit personenbezogenen Spalten. */
function personenTabellen(db) {
  const out = {};
  for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) {
    const spalten = db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name).filter((c) => PERSONEN_SPALTEN.includes(c));
    if (spalten.length) out[name] = spalten;
  }
  return out;
}

/** Zeilen je Tabelle, die zur sub bzw. zu ihren Teilnahme-ids gehören. */
function treffer(db, sub, teilnahmeIds) {
  const out = {};
  for (const [tab, spalten] of Object.entries(personenTabellen(db))) {
    let n = 0;
    for (const s of spalten) {
      if (s === 'sub') n += db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE sub = ?`).get(sub).n;
      else if (teilnahmeIds.length) n += db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE ${s} IN (${teilnahmeIds.map(() => '?').join(',')})`).get(...teilnahmeIds).n;
    }
    out[tab] = n;
  }
  return out;
}

test('Löschung nach sub: keine Zeile mit der sub oder ihren Teilnahme-ids in irgendeiner Tabelle', async () => {
  const app = H.makeApp();
  const db = app.locals.db;
  const k1 = H.kurs(app, 'LK 13 (eA)');
  const k2 = H.kurs(app, 'GK 12 (gA)');
  const mika = H.konto(app, 'schueler', 'Mika R.');
  const ida = H.konto(app, 'schueler', 'Ida K.');
  const t = [H.teilnahme(app, k1, mika, 'Mika R.'), H.teilnahme(app, k2, mika, 'Mika R.', { aktiv: false })];
  const tIda = [H.teilnahme(app, k1, ida, 'Ida K.'), H.teilnahme(app, k2, ida, 'Ida K.')];
  H.befuelle(app, k1, [t[0], tIda[0]], { gemeinsamesTeam: true });
  H.befuelle(app, k2, [t[1], tIda[1]]);

  const tabellen = personenTabellen(db);
  for (const tab of ['konten', 'schueler', 'kurs_lehrkraefte', 'fortschritt', 'fallen_zaehler', 'ide_erledigt', 'abzeichen', 'erfolge', 'training', 'boss_versuche', 'leitner', 'team_mitglieder', 'funk_nachrichten', 'funk_teilnahmen', 'arena_versuche']) {
    assert.ok(tabellen[tab], `${tab} wird durchsucht`);
  }
  const vorher = treffer(db, mika, t);
  for (const tab of Object.keys(tabellen).filter((x) => x !== 'kurs_lehrkraefte')) assert.ok(vorher[tab] > 0, `Testdaten in ${tab}`);

  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen')).send({ sub: mika });
  assert.deepEqual([r.status, r.body], [200, { geloescht: 3 }]);
  const nachher = treffer(db, mika, t);
  for (const [tab, n] of Object.entries(nachher)) assert.equal(n, 0, `${tab}: noch ${n} Zeile(n)`);
  // Ida bleibt vollständig
  const idaRest = treffer(db, ida, tIda);
  for (const tab of ['konten', 'schueler', 'fortschritt', 'team_mitglieder', 'funk_nachrichten', 'arena_versuche']) assert.ok(idaRest[tab] > 0, `Ida: ${tab}`);
  // Volltextsuche: Name taucht nirgends mehr auf
  for (const tab of Object.keys(tabellen)) {
    const spalten = db.prepare(`PRAGMA table_info(${tab})`).all().filter((c) => /TEXT/i.test(c.type)).map((c) => c.name);
    for (const s of spalten) assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${tab} WHERE ${s} LIKE '%Mika%'`).get().n, 0, `${tab}.${s}`);
  }
});

test('Löschung nach sub einer Lehrkraft: Konto und Kurszuordnungen weg, Kurse bleiben', async () => {
  const app = H.makeApp();
  const k = H.kurs(app);
  const lk = H.konto(app, 'lehrkraft', 'Frau K.');
  H.zuordnen(app, k, lk);
  const r = await request(app).post('/api/verbund/loeschen').set('Authorization', 'Bearer ' + H.verbundToken('loeschen')).send({ sub: lk });
  assert.deepEqual(r.body, { geloescht: 1 });
  for (const [tab, n] of Object.entries(treffer(app.locals.db, lk, []))) assert.equal(n, 0, tab);
  assert.equal(H.zaehle(app, 'kurse'), 1);
});
