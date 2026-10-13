'use strict';
// Testhilfe Funkraum/Arena (Plan M7 Tasks 132/133): Kurs mit n Teams (Pseudonyme), Lehrkraft „Frau M.“, steuerbare Uhr,
// fester Zufall, Volltextsuche. Teams entstehen über die echte Route PUT /api/lehrer/kurse/:id/teams.
const H = require('./helpers');
const { TEAM_NAMEN } = require('../src/krypto/fach');
const NAMEN = ['Mika R.', 'Ida K.', 'Ole B.', 'Nia T.', 'Jan P.', 'Lea W.', 'Tom H.', 'Ela S.', 'Ben F.', 'Uma D.', 'Kai L.', 'Zoe M.'];

/** zufallBytes-Ersatz: jeder Aufruf nimmt den nächsten Block (Hex, auf n gekürzt bzw. mit 00 aufgefüllt), danach
    nur Nullbytes – deterministisch (Aufrufe: 1. Salz beim Anlegen, 2. … Start des Szenarios, Reihenfolge im Typ-Modul). */
function festerZufall(bloecke = []) {
  let i = 0;
  return (n) => {
    const b = Buffer.alloc(n);
    if (i < bloecke.length) Buffer.from(bloecke[i++], 'hex').copy(b, 0, 0, n);
    return b;
  };
}

/** App + Lehrkraft „Frau M.“ + Kurs „LK 13 (eA)“ + n Teams mit je proTeam Schülern (Clients) über die echte Route */
async function kursMitTeams(n = 3, { uhr = H.uhr(), zufallBytes = festerZufall(), proTeam = 1, extra = {} } = {}) {
  const app = H.makeApp({ now: uhr, zufallBytes, ...extra });
  const lk = await H.lehrkraftClient(app, { name: 'Frau M.' });
  const kurs = await H.kursAnlegen(lk, 'LK 13 (eA)');
  const teams = [];
  for (let t = 0; t < n; t++) {
    const s = [];
    for (let j = 0; j < proTeam; j++) {
      const i = t * proTeam + j;
      s.push(await H.schuelerClient(app, kurs, NAMEN[i % 12] + (i >= 12 ? ' 2' : '')));
    }
    teams.push({ nr: t + 1, name: TEAM_NAMEN[t], s, c: s[0] });
  }
  const r = await lk
    .put(`/api/lehrer/kurse/${kurs.id}/teams`)
    .send({ teams: teams.map((t) => ({ nr: t.nr, name: t.name, mitglieder: t.s.map((c) => c.id) })) })
    .expect(200);
  for (const t of teams) t.id = r.body.teams.find((x) => x.nr === t.nr).id;
  return { app, uhr, lk, kurs, teams, db: app.locals.db };
}

/* Funkraum-Kurzwege (Routen ab Plan M7 Task 134) */
async function anlegen(f, typ, { rollen, optionen } = {}) {
  return (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/funk`).send({ typ, rollen, optionen }).expect(200)).body;
}
const aktion = (f, id, a) => f.lk.post(`/api/lehrer/funk/${id}/status`).send({ aktion: a });
async function starte(f, typ, o = {}) {
  const sz = await anlegen(f, typ, o);
  await aktion(f, sz.id, 'starten').expect(200);
  return sz;
}
const stand = (c, id, seit = 0) => c.get(`/api/funk/${id}/stand?seit=${seit}`);
const regie = (f, id, seit = 0, ansicht = 'regie') => f.lk.get(`/api/lehrer/funk/${id}/stand?seit=${seit}&ansicht=${ansicht}`);

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

module.exports = { NAMEN, festerZufall, kursMitTeams, anlegen, starte, aktion, stand, regie, fundstellen };
