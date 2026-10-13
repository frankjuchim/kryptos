'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');

const phase = (f, id, body) => f.lk.post(`/api/lehrer/arena/${id}/phase`).send(body);
function einreichenRoh(f, arenaId, teamId) { // bis Task 144 per SQL
  f.db.prepare("INSERT INTO arena_chiffren (arena_id, team_id, verfahren, beschreibung, geheimtext, klartext_hash, klartext_laenge, eingereicht_at) VALUES (?, ?, '{}', 'B', 'ABCDE', 'h', 150, 'z')").run(arenaId, teamId);
}

test('Phasen: werkstatt → angriff (≥ 2 Chiffren) → beurteilung → geschlossen; alles andere 409; eine offene Arena je Kurs', async () => {
  const f = await F.kursMitTeams(3);
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  assert.equal(a.status, 'werkstatt');
  assert.equal('salz' in a, false);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(409);
  await phase(f, a.id, { phase: 'beurteilung' }).expect(409);
  einreichenRoh(f, a.id, f.teams[0].id);
  assert.match((await phase(f, a.id, { phase: 'angriff' }).expect(409)).body.error, /mindestens zwei/);
  einreichenRoh(f, a.id, f.teams[1].id);
  await phase(f, a.id, { phase: 'angriff' }).expect(200);
  await phase(f, a.id, { phase: 'werkstatt' }).expect(409);
  await phase(f, a.id, { phase: 'beurteilung' }).expect(200);
  const z = (await phase(f, a.id, { phase: 'geschlossen' }).expect(200)).body;
  assert.ok(z.geschlossenAt);
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'geschlossen');
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200); // neue Arena nach dem Schließen
});

test('Frist angriff_bis: beim nächsten Zugriff beurteilung (E102), auch über den Wartungsjob', async () => {
  const f = await F.kursMitTeams(2);
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  einreichenRoh(f, a.id, f.teams[0].id);
  einreichenRoh(f, a.id, f.teams[1].id);
  const bis = new Date(f.uhr() + 25 * 60e3).toISOString();
  await phase(f, a.id, { phase: 'angriff', angriffBis: new Date(f.uhr() - 1000).toISOString() }).expect(400);
  await phase(f, a.id, { phase: 'angriff', angriffBis: bis }).expect(200);
  f.uhr.vor(25 * 60e3 - 1000);
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'angriff');
  f.uhr.vor(2000);
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena.status, 'beurteilung');
  const g = await F.kursMitTeams(2);
  const b = (await g.lk.post(`/api/lehrer/kurse/${g.kurs.id}/arena`).send({}).expect(200)).body;
  einreichenRoh(g, b.id, g.teams[0].id);
  einreichenRoh(g, b.id, g.teams[1].id);
  await phase(g, b.id, { phase: 'angriff', angriffBis: new Date(g.uhr() + 60e3).toISOString() }).expect(200);
  g.uhr.vor(61e3);
  assert.equal(g.app.locals.wartung.lauf().anzahlen.arenaFrist, 1);
  assert.equal(g.db.prepare('SELECT status FROM arena').get().status, 'beurteilung');
});

test('Rechte: Schüler ohne Team sieht team null; fremde Lehrkraft 404; gesperrter Kurs 403 (schreibend); Löschen löscht alles', async () => {
  const H = require('./helpers');
  const f = await F.kursMitTeams(2);
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
  assert.equal((await ohne.get('/api/arena').expect(200)).body.team, null);
  const fremd = await H.lehrkraftClient(f.app, { name: 'Herr B.' });
  await fremd.post(`/api/lehrer/arena/${a.id}/phase`).send({ phase: 'angriff' }).expect(404);
  await fremd.delete(`/api/lehrer/arena/${a.id}`).expect(404);
  einreichenRoh(f, a.id, f.teams[0].id);
  f.db.prepare('UPDATE kurse SET aktiv = 0').run();
  await f.lk.delete(`/api/lehrer/arena/${a.id}`).expect(403);
  f.db.prepare('UPDATE kurse SET aktiv = 1').run();
  await f.lk.delete(`/api/lehrer/arena/${a.id}`).expect(200);
  for (const t of ['arena', 'arena_chiffren', 'arena_versuche']) assert.equal(f.db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0, t);
});

test('Regie-Stand je Kurs, Eingaben (Phase, angriffBis ≤ 3 h, Zusatzfeld), Haken beim Phasenwechsel, kein Salz in Antworten', async () => {
  const H = require('./helpers');
  const f = await F.kursMitTeams(2);
  assert.deepEqual((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/arena`).expect(200)).body, { arena: null });
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.arena, null);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({ geheim: 1 }).expect(400);
  await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({ angriffBis: 'morgen' }).expect(400);
  const a = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  const salz = f.db.prepare('SELECT salz FROM arena').get().salz;
  assert.match(salz, /^[A-Za-z0-9_-]{43}$/);
  await phase(f, a.id, { phase: 'irgendwas' }).expect(400);
  einreichenRoh(f, a.id, f.teams[0].id);
  einreichenRoh(f, a.id, f.teams[1].id);
  await phase(f, a.id, { phase: 'angriff', angriffBis: new Date(f.uhr() + 3 * 3600e3 + 60e3).toISOString() }).expect(400);
  const gesehen = [];
  f.app.locals.arena.beimPhasenwechsel.push((zeile) => gesehen.push([zeile.id, zeile.status]));
  const r = (await phase(f, a.id, { phase: 'angriff', angriffBis: new Date(f.uhr() + 60e3).toISOString() }).expect(200)).body;
  assert.deepEqual([r.status, r.chiffren], ['angriff', 2]);
  const lk = (await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/arena`).expect(200)).body;
  assert.equal(lk.arena.angriffBis, r.angriffBis);
  f.uhr.vor(61e3);
  assert.equal((await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/arena`).expect(200)).body.arena.status, 'beurteilung');
  assert.deepEqual(gesehen, [[a.id, 'beurteilung']]);
  const s = (await f.teams[0].c.get('/api/arena').expect(200)).body;
  assert.deepEqual(s.team, { id: f.teams[0].id, nr: 1, name: 'Team Skytale' });
  for (const body of [a, r, lk, s]) assert.ok(!JSON.stringify(body).includes(salz));
  // anderer Kurs sieht diese Arena nicht; gesperrter Kurs: Schüler 403, Lehrkraft liest
  const k2 = await H.kursAnlegen(f.lk, 'GK 12 (gA)');
  const fremd = await H.schuelerClient(f.app, k2, 'Lea W.');
  assert.equal((await fremd.get('/api/arena').expect(200)).body.arena, null);
  f.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(f.kurs.id);
  await f.teams[0].c.get('/api/arena').expect(403);
  await f.lk.get(`/api/lehrer/kurse/${f.kurs.id}/arena`).expect(200);
  await phase(f, a.id, { phase: 'geschlossen' }).expect(403);
});
