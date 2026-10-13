'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const F = require('./hilfen_funk');
const K = require('../public/static/js/shared/krypto.js');
const SEED = require('../seed/funkraum/wettknacken.json');
const extra = { funkraumDatei: path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json') };

test('Seed: 486 Buchstaben, Lösung bildet auf den Klartext ab, nicht in Lab-Seeds', () => {
  const t = SEED.texte[0];
  assert.equal(K.nurBuchstaben(t.geheimtext).length, 486);
  assert.equal(K.teilsubstitution(t.geheimtext, Object.fromEntries(Object.entries(t.loesung.zuordnung).map(([g, k]) => [g, k.toLowerCase()]))).replace(/\s/g, ''), K.nurBuchstaben(t.klartext).toLowerCase());
  for (const w of [0, 1, 2]) assert.ok(!JSON.stringify(require(`../seed/welten/welt${w}.json`)).includes('DHCPQ NRUMV'));
});

test('Wettknacken: Anteil nach E97, nur eigener Wert, Fortschritt am Beamer, fertig ≥ 95 % mit Platz', async () => {
  const f = await F.kursMitTeams(2, { extra });
  const sz = await F.starte(f, 'wettknacken');
  const [a, b] = f.teams;
  const setze = (t, z) => t.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: z });
  assert.deepEqual((await setze(a, { U: 'e' }).expect(200)).body, { anteil: 0.193 });
  await setze(a, { U: 'e' }).expect(429);
  f.uhr.vor(2000);
  assert.equal((await setze(a, { U: 'E', Y: 'c', C: 'h' }).expect(200)).body.anteil, 0.284);
  await setze(b, { U: 'ee' }).expect(400);
  await setze(b, { u: 'e', U: 'n' }).expect(400); // doppelt nach Großschreibung
  const sa = (await F.stand(a.c, sz.id)).body;
  assert.equal(sa.ich.anteil, 0.284);
  assert.equal('loesung' in sa.anzeigen, false);
  assert.ok(!JSON.stringify(sa).includes('IMHAUS') && !JSON.stringify(sa).includes('im haus'), 'keine Lösung, kein Klartext');
  assert.ok(!JSON.stringify((await F.stand(b.c, sz.id)).body).includes('0.284'), 'fremder Anteil unsichtbar');
  assert.deepEqual((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.fortschritt.map((x) => [x.team, x.anteil]), [[a.id, 0.284], [b.id, 0]]);
  f.uhr.vor(2000);
  const voll = Object.fromEntries(Object.entries(SEED.texte[0].loesung.zuordnung));
  assert.equal((await setze(b, voll).expect(200)).body.anteil, 1);
  const fertig = (await F.regie(f, sz.id)).body.ereignisse.filter((e) => e.code === 'fertig');
  assert.deepEqual(fertig.map((e) => e.daten), [{ team: b.id, platz: 1 }]);
  // Hinweise der Lehrkraft, Klartext erst in der Auflösung und nur am Beamer
  await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 1 }).expect(200);
  assert.deepEqual((await F.stand(a.c, sz.id)).body.anzeigen.hinweise, ['U ≙ e']);
  assert.equal((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.klartext, undefined);
  await F.aktion(f, sz.id, 'phase').expect(200);
  assert.match((await F.regie(f, sz.id, 0, 'beamer')).body.anzeigen.klartext, /^im haus der weisheit/);
  assert.equal((await F.stand(a.c, sz.id)).body.anzeigen.klartext, undefined);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  assert.deepEqual(F.fundstellen(f.db, '"U":"E"'), []);
});

test('Wettknacken: Werkzeuge eingebettet (Analysator + Werkbank, E98); ohne Seed nicht anlegbar', async () => {
  const f = await F.kursMitTeams(2, { extra });
  const sz = await F.starte(f, 'wettknacken');
  assert.deepEqual((await F.stand(f.teams[0].c, sz.id)).body.werkzeuge.map((w) => w.id), ['haeufigkeit', 'substitution']);
  const g = await F.kursMitTeams(2); // ohne funkraumDatei (makeApp: seedDir null)
  await g.lk.post(`/api/lehrer/kurse/${g.kurs.id}/funk`).send({ typ: 'wettknacken' }).expect(400);
});

test('Wettknacken: Hinweise je einmal, fremder Fortschritt im Ticker unsichtbar, nach der Ziellinie Platz 2, Auflösung sperrt', async () => {
  const f = await F.kursMitTeams(3, { extra });
  const sz = await F.starte(f, 'wettknacken');
  const [a, b, c] = f.teams;
  const voll = SEED.texte[0].loesung.zuordnung;
  await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 4 }).expect(400);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 3 }).expect(200);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 3 }).expect(409);
  await f.lk.post(`/api/lehrer/funk/${sz.id}/hinweis`).send({ nr: 1 }).expect(200);
  assert.deepEqual((await F.stand(c.c, sz.id)).body.anzeigen.hinweise, ['U ≙ e', 'RUM ≙ der']);
  await a.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(200);
  await b.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: voll }).expect(200);
  const ticker = (await F.stand(a.c, sz.id)).body.ereignisse;
  assert.deepEqual(ticker.filter((e) => e.code === 'fortschritt').map((e) => e.daten.team), [a.id], 'nur eigener Fortschritt');
  assert.deepEqual(ticker.filter((e) => e.code === 'fertig').map((e) => e.daten), [{ team: b.id, platz: 1 }]);
  f.uhr.vor(2000);
  await a.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: voll }).expect(200);
  assert.deepEqual((await F.stand(a.c, sz.id)).body.ich, { ...(await F.stand(a.c, sz.id)).body.ich, anteil: 1, fertig: true, platz: 2 });
  const regie = (await F.regie(f, sz.id)).body.anzeigen;
  assert.deepEqual(Object.keys(regie.verlauf).map(Number), [a.id, b.id, c.id]);
  assert.equal(regie.verlauf[a.id].length, 1, 'höchstens ein Punkt je 30 s');
  await F.aktion(f, sz.id, 'phase').expect(200);
  f.uhr.vor(2000);
  await c.c.put(`/api/funk/${sz.id}/zuordnung`).send({ zuordnung: { U: 'e' } }).expect(409);
  await F.aktion(f, sz.id, 'beenden').expect(200);
  const ausw = (await F.stand(c.c, sz.id)).body.auswertung;
  assert.deepEqual(ausw.teams.map((t) => [t.team, t.anteil, t.platz]), [[a.id, 1, 2], [b.id, 1, 1], [c.id, 0, null]]);
  assert.equal(ausw.hinweise, 2);
});

test('Wettknacken-Lader: ungültige Datei oder falsche Lösung → Text verworfen, Log-Zeile', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const W = require('../src/krypto/funkraum/typen/wettknacken');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-wett-'));
  const kaputt = JSON.parse(JSON.stringify(SEED));
  kaputt.texte[0].loesung.zuordnung.U = 'N';
  fs.writeFileSync(path.join(dir, 'falsch.json'), JSON.stringify(kaputt));
  fs.writeFileSync(path.join(dir, 'kein.json'), '{');
  const zeilen = [];
  assert.deepEqual(W.texte(path.join(dir, 'falsch.json'), (z) => zeilen.push(z)), []);
  assert.deepEqual(W.texte(path.join(dir, 'kein.json'), (z) => zeilen.push(z)), []);
  assert.deepEqual(W.texte(path.join(dir, 'fehlt.json'), (z) => zeilen.push(z)), []);
  assert.equal(zeilen.length, 3);
  assert.match(zeilen[0], /Zuordnung bildet nicht/);
  assert.equal(W.texte(extra.funkraumDatei).length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
