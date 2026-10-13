'use strict';
// Teams (Tischgruppen) je Kurs (Plan M7 Task 133, TECHNIK §12.2, §13.4, E106).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');
const { TEAM_NAMEN } = require('../src/krypto/fach');

async function aufbau() {
  const { app, lk, kurs, s } = await H.szenario();
  const ida = await H.schuelerClient(app, kurs, 'Ida K.');
  const ole = await H.schuelerClient(app, kurs, 'Ole B.');
  return { app, lk, kurs, s, ida, ole };
}
const put = (f, teams) => f.lk.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({ teams });

test('Teams anlegen: Namen aus TEAM_NAMEN, Mitglieder, ohneTeam', async () => {
  const f = await aufbau();
  const r = await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id, f.ida.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [] }]).expect(200);
  assert.deepEqual(r.body.teams.map((t) => [t.nr, t.name, t.mitglieder.map((m) => m.name)]), [[1, 'Team Skytale', ['Lena S.', 'Ida K.']], [2, 'Team Scheibe', []]]);
  assert.deepEqual(r.body.ohneTeam.map((m) => m.name), ['Ole B.']);
  assert.deepEqual(r.body.namen, TEAM_NAMEN);
  const g = await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(200);
  assert.deepEqual(g.body, r.body);
});

test('Sollstand in place: Team-ids bleiben je nr; fehlende Teams werden gelöscht', async () => {
  const f = await aufbau();
  const a = (await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.ida.id] }]).expect(200)).body;
  const b = (await put(f, [{ nr: 1, name: 'Team Quadrat', mitglieder: [f.s.id, f.ole.id] }]).expect(200)).body;
  assert.equal(b.teams[0].id, a.teams[0].id);
  assert.equal(b.teams[0].name, 'Team Quadrat');
  assert.equal(H.zaehle(f.app, 'teams', 'kurs_id = ?', f.kurs.id), 1);
  assert.deepEqual(b.ohneTeam.map((m) => m.name), ['Ida K.']);
  // teamVon / mitglieder des Dienstes
  const teams = f.app.locals.teams;
  assert.deepEqual(teams.teamVon(f.ole.id), { id: a.teams[0].id, nr: 1, name: 'Team Quadrat' });
  assert.equal(teams.teamVon(f.ida.id), null);
  assert.deepEqual(teams.mitglieder(a.teams[0].id).map((m) => m.name), ['Lena S.', 'Ole B.']);
  assert.equal(teams.imEinsatz(a.teams[0].id), null);
  // leerer Sollstand löscht alle Teams
  assert.deepEqual((await put(f, []).expect(200)).body.teams, []);
  assert.equal(H.zaehle(f.app, 'team_mitglieder'), 0);
});

test('Validierung: freier Name, doppelter Name/nr, nr 13, fremde oder inaktive Teilnahme, doppelt zugeordnet → 400', async () => {
  const f = await aufbau();
  const fremd = await H.schuelerClient(f.app, H.kurs(f.app, 'GK 12 (gA)'), 'Nia T.');
  for (const teams of [
    [{ nr: 1, name: 'Die Hacker', mitglieder: [] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [] }, { nr: 2, name: 'Team Skytale', mitglieder: [] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [] }, { nr: 1, name: 'Team Scheibe', mitglieder: [] }],
    [{ nr: 13, name: 'Team Skytale', mitglieder: [] }],
    [{ nr: 0, name: 'Team Skytale', mitglieder: [] }],
    [{ nr: 1.5, name: 'Team Skytale', mitglieder: [] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [fremd.id] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.s.id] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id, f.s.id] }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: ['x'] }],
    [{ nr: 1, name: 'Team Skytale' }],
    [{ nr: 1, name: 'Team Skytale', mitglieder: [], extra: 1 }],
    ['Team Skytale'],
    TEAM_NAMEN.concat(['Team Skytale']).map((name, i) => ({ nr: i + 1, name, mitglieder: [] }))
  ]) await put(f, teams).expect(400);
  await f.lk.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({}).expect(400);
  await f.lk.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({ teams: 'alle' }).expect(400);
  f.app.locals.db.prepare('UPDATE schueler SET aktiv = 0 WHERE id = ?').run(f.ole.id);
  await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.ole.id] }]).expect(400);
  assert.equal(H.zaehle(f.app, 'teams'), 0, 'nichts geschrieben');
  // zwölf Teams sind erlaubt
  await put(f, TEAM_NAMEN.map((name, i) => ({ nr: i + 1, name, mitglieder: [] }))).expect(200);
});

test('Team im Einsatz (Rolle in laufendem Szenario / Chiffre in offener Arena) wird nicht gelöscht → 409 (E106)', async () => {
  const f = await aufbau();
  const a = (await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [f.ida.id] }]).expect(200)).body;
  const db = f.app.locals.db;
  const sz = db.prepare("INSERT INTO funk_szenarien (kurs_id, typ, status, phase, endet_spaetestens, created_at) VALUES (?, 'botenlauf', 'laeuft', 'runde-1', '2099-01-01', '2026-10-13')").run(f.kurs.id).lastInsertRowid;
  db.prepare("INSERT INTO funk_rollen (szenario_id, team_id, rolle) VALUES (?, ?, 'eve')").run(sz, a.teams[1].id);
  const r = await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }]).expect(409);
  assert.match(r.body.error, /Team Scheibe spielt gerade im Funkraum/);
  await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }, { nr: 2, name: 'Team Scheibe', mitglieder: [] }]).expect(200); // Mitglieder ändern geht
  assert.equal(f.app.locals.teams.imEinsatz(a.teams[1].id), 'funkraum');
  // beendetes Szenario hält das Team nicht mehr fest
  db.prepare("UPDATE funk_szenarien SET status = 'auswertung' WHERE id = ?").run(sz);
  // Chiffre in offener Arena
  const ar = db.prepare("INSERT INTO arena (kurs_id, status, salz, created_at) VALUES (?, 'werkstatt', 's', '2026-10-13')").run(f.kurs.id).lastInsertRowid;
  db.prepare("INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, eingereicht_at) VALUES (?, ?, '{}', 'B', 'ABC', 'h', 3, '2026-10-13')").run(ar, a.teams[1].id);
  const r2 = await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }]).expect(409);
  assert.match(r2.body.error, /Team Scheibe hat eine Chiffre in der offenen Arena/);
  db.prepare("UPDATE arena SET status = 'geschlossen', geschlossen_at = '2026-10-13' WHERE id = ?").run(ar);
  await put(f, [{ nr: 1, name: 'Team Skytale', mitglieder: [f.s.id] }]).expect(200);
  assert.equal(H.zaehle(f.app, 'teams', 'kurs_id = ?', f.kurs.id), 1);
});

test('Rechte: fremde Lehrkraft 404, Schüler 401, gesperrter Kurs 403', async () => {
  const f = await aufbau();
  const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
  await fremd.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(404);
  await fremd.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({ teams: [] }).expect(404);
  await f.s.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(401);
  await f.s.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).send({ teams: [] }).expect(401);
  await f.lk.put(`/api/lehrer/kurse/${f.kurs.id}/teams`).unset('Origin').send({ teams: [] }).expect(403);
  f.app.locals.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(f.kurs.id);
  await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/teams`).expect(200);
  await put(f, []).expect(403);
});

test('hilfen_funk.kursMitTeams: n Teams über die echte Route, je ein Schüler', async () => {
  const F = require('./hilfen_funk');
  const f = await F.kursMitTeams(3);
  assert.deepEqual(f.teams.map((t) => [t.nr, t.name, t.c.name]), [[1, 'Team Skytale', 'Mika R.'], [2, 'Team Scheibe', 'Ida K.'], [3, 'Team Quadrat', 'Ole B.']]);
  assert.ok(f.teams.every((t) => Number.isInteger(t.id)));
  const z = F.festerZufall(['0102', 'ff']);
  assert.deepEqual([...z(3)], [1, 2, 0]);
  assert.deepEqual([...z(1)], [255]);
  assert.deepEqual([...z(2)], [0, 0]);
  // zufallBytes landet im ctx (E113, K41)
  const g = await F.kursMitTeams(2, { zufallBytes: F.festerZufall(['abcd']) });
  assert.deepEqual([...g.app.locals.ctx.zufallBytes(2)], [0xab, 0xcd]);
  assert.equal(H.makeApp().locals.ctx.zufallBytes(16).length, 16);
});
