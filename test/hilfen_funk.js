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

/* Arena (Plan M7 Tasks 144–146): erfundene Testtexte und Verfahren (nicht aus Lab/Akten) */
const TEXT1 = 'Am Nordtor der alten Hafenstadt stehen drei Waechter. Jeden Abend tauschen sie die Losung, damit kein Fremder durch das Tor kommt. Wer die Losung kennt, darf passieren und bringt Nachrichten in die Stadt.';
const TEXT2 = 'Der Leuchtturm blinkt dreimal kurz und einmal lang, wenn ein Schiff in den Hafen einlaufen darf. Bei Nebel bleibt das Licht aus und die Boote warten draussen vor der Mole bis zum Morgen.';
const FUNKGITTER = { version: 1, name: 'FUNKGITTER', stufen: [{ typ: 'vigenere', param: { schluessel: '$wort' } }, { typ: 'spaltentransposition', param: { schluessel: '$wort' } }] };
const CAESAR = { version: 1, name: 'Nur Caesar', stufen: [{ typ: 'caesar', param: { k: '$k' } }] };

/** Kurs mit n Teams, Arena und je Team einer Chiffre (gerade: FUNKGITTER/LATERNE/TEXT1, ungerade: Nur Caesar/k = 7/TEXT2),
    danach Phase `phase` (werkstatt | angriff | beurteilung) → f mit arenaId, cid(i), phase(name), angriff(t, ziel, body) */
async function arenaMitChiffren(n = 2, { phase = 'angriff', beschreibung = 'B', proTeam = 1, extra = {} } = {}) {
  const f = await kursMitTeams(n, { proTeam, extra });
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  f.arenaId = a.id;
  const ein = [[FUNKGITTER, { wort: 'LATERNE' }, TEXT1], [CAESAR, { k: 7 }, TEXT2]];
  for (let i = 0; i < n; i++) {
    const [v, schl, t] = ein[i % 2];
    await f.teams[i].c.post(`/api/arena/${a.id}/chiffre`).send({ verfahren: v, schluessel: schl, klartext: t, beschreibung }).expect(200);
  }
  f.phase = (name) => f.lk.post(`/api/lehrer/arena/${a.id}/phase`).send({ phase: name }).expect(200);
  const ids = () => f.db.prepare('SELECT id, team_id FROM arena_chiffren WHERE arena_id = ?').all(a.id);
  f.cid = (teamIdx) => ids().find((c) => c.team_id === f.teams[teamIdx].id).id;
  f.angriff = (teamIdx, ziel, body) => f.teams[teamIdx].c.post(`/api/arena/${a.id}/chiffren/${f.cid(ziel)}/angriff`).send(body);
  if (phase === 'angriff' || phase === 'beurteilung') await f.phase('angriff');
  if (phase === 'beurteilung') await f.phase('beurteilung');
  return f;
}

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

module.exports = { NAMEN, festerZufall, kursMitTeams, anlegen, starte, aktion, stand, regie, fundstellen, TEXT1, TEXT2, FUNKGITTER, CAESAR, arenaMitChiffren };
