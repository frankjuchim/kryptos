'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./hilfen_funk');
const { TEXT1, TEXT2, FUNKGITTER, CAESAR } = F;
const K = require('../public/static/js/shared/krypto.js');
const ZAUN_XOR = { version: 1, name: 'Zaun und XOR', stufen: [{ typ: 'gartenzaun', param: { zeilen: 3 } }, { typ: 'xor', param: { schluessel: '$w' } }] };

async function arena(n = 2) {
  const f = await F.kursMitTeams(n);
  f.arena = (await f.lk.post(`/api/lehrer/kurse/${f.kurs.id}/arena`).send({}).expect(200)).body;
  f.einreichen = (t, body) => t.c.post(`/api/arena/${f.arena.id}/chiffre`).send(body);
  return f;
}

test('Werkstatt prüfen: FUNKGITTER-Beispiel (W3 Tabelle B), ohne Hinweise, speichert nichts', async () => {
  const f = await arena();
  const r = await f.teams[0].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'FUNKE' }, text: 'Wetterbericht fuer die Nordsee' }).expect(200);
  assert.deepEqual([r.body.ok, r.body.geheimtext, r.body.rueck], [true, 'IMYIW BWHJS JDBPS NGRGQ EYVBL IY', true]);
  assert.equal(r.body.zwischen[0], 'BYGDIWVRBMHBGPYJLQSISIENWJY');
  assert.equal('hinweise' in r.body, false);
  assert.deepEqual(F.fundstellen(f.db, 'FUNKE'), []);
});

test('Einreichen: Geheimtext in Fünfergruppen, Hash statt Klartext, Schlüssel nirgends; überschreibbar', async () => {
  const f = await arena();
  const r = await f.einreichen(f.teams[0], { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'Zuerst wird mit Vigenère verschlüsselt, danach spaltenweise umgestellt.' }).expect(200);
  assert.ok(r.body.geheimtext.startsWith('MRESE IEAUI SIRUT'));
  const zeile = f.db.prepare('SELECT * FROM arena_chiffren').get();
  assert.deepEqual([zeile.klartext_laenge, JSON.parse(zeile.verfahren).stufen[0].param.schluessel], [167, '$wort']);
  assert.match(zeile.klartext_hash, /^[0-9a-f]{64}$/);
  for (const nadel of ['LATERNE', 'Laterne', 'AMNORDTOR', 'Am Nordtor', 'Hafenstadt', 'WAECHTER']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
  await f.einreichen(f.teams[0], { verfahren: ZAUN_XOR, schluessel: { w: 'FUNK' }, klartext: TEXT1, beschreibung: 'Neu' }).expect(200);
  const neu = f.db.prepare('SELECT geheimtext FROM arena_chiffren').get().geheimtext;
  assert.match(neu, /^([0-9A-F]{2} )*[0-9A-F]{2}$/);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM arena_chiffren').get().n, 1);
  assert.equal((await f.teams[0].c.get('/api/arena').expect(200)).body.eigene.beschreibung, 'Neu');
  assert.equal((await f.teams[1].c.get('/api/arena').expect(200)).body.eigene, null);
});

test('Einreichen abgelehnt: Typregel, Platzhalter fehlt, Text zu kurz/lang, Beschreibung leer/zu lang, Zusatzfeld, falsche Phase, ohne Team', async () => {
  const H = require('./helpers');
  const f = await arena();
  const ok = { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'B' };
  const xorVorn = { version: 1, stufen: [{ typ: 'xor', param: { schluessel: 'AB' } }, { typ: 'umkehrung' }] };
  for (const [aend, muster] of [
    [{ verfahren: xorVorn, schluessel: {} }, /XOR darf nur als letzte Stufe/],
    [{ schluessel: {} }, /keinen Wert für „\$wort“/],
    [{ klartext: TEXT1.slice(0, 100) }, /150 bis 300 Buchstaben \(jetzt \d+\)/],
    [{ klartext: TEXT1 + TEXT1 }, /150 bis 300 Buchstaben \(jetzt 334\)/],
    [{ beschreibung: '   ' }, /Beschreibung/],
    [{ beschreibung: 'x'.repeat(2001) }, /Beschreibung/],
    [{ verfahren: { ...FUNKGITTER, geheim: 'LATERNE' } }, /Unbekanntes Feld im Verfahren: geheim/]
  ]) {
    const r = await f.einreichen(f.teams[0], { ...ok, ...aend }).expect(400);
    assert.match(r.body.error + JSON.stringify(r.body.details || []), muster);
  }
  const ohne = await H.schuelerClient(f.app, f.kurs, 'Jan P.');
  await ohne.post(`/api/arena/${f.arena.id}/chiffre`).send(ok).expect(403);
  await f.einreichen(f.teams[0], ok).expect(200);
  await f.einreichen(f.teams[1], ok).expect(200);
  await f.lk.post(`/api/lehrer/arena/${f.arena.id}/phase`).send({ phase: 'angriff' }).expect(200);
  await f.einreichen(f.teams[0], ok).expect(409);
  assert.deepEqual(F.fundstellen(f.db, 'LATERNE'), []);
});

test('Grenze: 20 Einreichungen je Team in 10 min; Prüfen 60/min', async () => {
  const f = await arena();
  const ok = { verfahren: FUNKGITTER, schluessel: { wort: 'LATERNE' }, klartext: TEXT1, beschreibung: 'B' };
  for (let i = 0; i < 20; i++) await f.einreichen(f.teams[0], ok).expect(200);
  const r = await f.einreichen(f.teams[0], ok).expect(429);
  assert.ok(Number(r.headers['retry-after']) >= 1);
  for (let i = 0; i < 60; i++) await f.teams[1].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'A' }, text: 'a' }).expect(200);
  await f.teams[1].c.post('/api/werkstatt/pruefen').send({ verfahren: FUNKGITTER, schluessel: { wort: 'A' }, text: 'a' }).expect(429);
  assert.equal(K.nurBuchstaben(TEXT1).length, 167);
});

test('Einreichen: Hash = HMAC(Arena-Salz, nurBuchstaben), XOR-Grenzfall 300 Buchstaben ≤ 900 Zeichen, eigene Hinweise sofort, Rechte', async () => {
  const crypto = require('node:crypto');
  const H = require('./helpers');
  const f = await arena();
  await f.einreichen(f.teams[0], { verfahren: CAESAR, schluessel: { k: 7 }, klartext: TEXT1, beschreibung: '  Caesar  ' }).expect(200);
  const zeile = f.db.prepare('SELECT * FROM arena_chiffren').get();
  const salz = f.db.prepare('SELECT salz FROM arena').get().salz;
  assert.equal(zeile.klartext_hash, crypto.createHmac('sha256', salz).update(K.nurBuchstaben(TEXT1)).digest('hex'));
  assert.equal(zeile.beschreibung, 'Caesar');
  const eigene = (await f.teams[0].c.get('/api/arena').expect(200)).body.eigene;
  assert.deepEqual([eigene.klartextLaenge, eigene.hinweise.map((h) => h.p), eigene.verfahren.stufen[0].param.k], [167, [null], '$k']);
  // 300 Buchstaben nach Zaun + XOR: 300 Hex-Paare = 899 Zeichen (TECHNIK §9.4)
  const text300 = 'abcdefghij'.repeat(30);
  const r = await f.einreichen(f.teams[1], { verfahren: ZAUN_XOR, schluessel: { w: 'FUNK' }, klartext: text300, beschreibung: 'B' }).expect(200);
  assert.equal(r.body.geheimtext.length, 899);
  await f.einreichen(f.teams[1], { verfahren: ZAUN_XOR, schluessel: { w: 'FUNK' }, klartext: text300 + 'a', beschreibung: 'B' }).expect(400);
  // Eingaben: Klartext fehlt, Zusatzfeld im Körper und in einer Stufe, Verfahren kein Objekt
  for (const body of [
    { verfahren: CAESAR, schluessel: { k: 7 }, beschreibung: 'B' },
    { verfahren: CAESAR, schluessel: { k: 7 }, klartext: 42, beschreibung: 'B' },
    { verfahren: CAESAR, schluessel: { k: 7 }, klartext: TEXT1, beschreibung: 'B', schluesselText: 'LATERNE' },
    { verfahren: { ...CAESAR, stufen: [{ typ: 'caesar', param: { k: '$k' }, notiz: 'SCHLUESSELNOTIZ' }] }, schluessel: { k: 7 }, klartext: TEXT1, beschreibung: 'B' },
    { verfahren: 'CAESAR', schluessel: { k: 7 }, klartext: TEXT1, beschreibung: 'B' }
  ]) await f.einreichen(f.teams[0], body).expect(400);
  // fremde Arena 404, gesperrter Kurs 403, Prüfen ohne Text 400
  // (zweiter Kurs in derselben App – eine zweite App hätte eine eigene Datenbank mit derselben Arena-id)
  const k2 = await H.kursAnlegen(f.lk, 'GK 12 (gA)');
  const a2 = (await f.lk.post(`/api/lehrer/kurse/${k2.id}/arena`).send({}).expect(200)).body;
  await f.teams[0].c.post(`/api/arena/${a2.id}/chiffre`).send({ verfahren: CAESAR, schluessel: { k: 7 }, klartext: TEXT1, beschreibung: 'B' }).expect(404);
  await f.teams[0].c.post('/api/werkstatt/pruefen').send({ verfahren: CAESAR, schluessel: { k: 7 } }).expect(400);
  f.db.prepare('UPDATE kurse SET aktiv = 0 WHERE id = ?').run(f.kurs.id);
  await f.einreichen(f.teams[0], { verfahren: CAESAR, schluessel: { k: 7 }, klartext: TEXT1, beschreibung: 'B' }).expect(403);
  for (const nadel of ['SCHLUESSELNOTIZ', 'LATERNE', 'ABCDEFGHIJABCDEFGHIJ', 'abcdefghijabcdefghij']) assert.deepEqual(F.fundstellen(f.db, nadel), [], nadel);
});
