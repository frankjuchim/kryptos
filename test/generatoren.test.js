'use strict';
// Generatoren (Trainingsplatz): Rahmen mit Registry und Niveau-Filter (TECHNIK §8.2), Kryptos-Generatoren
// (Design §7.6, Welt-Specs §8): deterministisch je Seed, Musterantwort richtig, Validator ohne Fehler, Lösung im Test
// unabhängig nachgerechnet (eigene Rechnung, nicht der Code-Pfad des Generators).
require('../src/krypto').registriere();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/content/generators');
const C = require('../src/content/checker');
const { validiereWelt } = require('../src/content/validator');
const H = require('./helpers');
const VIDEOS = require('../quellen/pruefwerte/videos.json').werte;

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

/** Deterministisch, Musterantwort richtig, Validator ohne Fehler; liefert die Aufgaben zu allen 300 Seeds. */
function grundpruefung(key, anzahl = 60) {
  const aufgaben = [];
  for (const seed of SEEDS.slice(0, anzahl)) {
    const a = G.erzeuge(key, seed);
    assert.deepEqual(G.erzeuge(key, seed), a, `${key} deterministisch`);
    assert.equal(C.pruefeAufgabe(a, C.musterantwortAufgabe(a)).ok, true, `${key}/${seed}`);
    aufgaben.push({ ...a, id: `W7-L1-${String(aufgaben.length + 1).padStart(2, '0')}` });
  }
  const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: 'kern', rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
  assert.deepEqual(v.fehler, [], key);
  const alle = SEEDS.map((s) => G.erzeuge(key, s));
  for (const a of alle) assert.equal(videoKollision(a), null, `${key}: ${a.id}`);
  return alle;
}

/* ---------- Video-Beispiele (Design §11: kommen in keinem anderen Material vor) ---------- */

const nurAZ = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');
const nurBits = (s) => String(s).replace(/[^01]/g, '');
const istBits = (s) => typeof s === 'string' && /^[01 ]+$/.test(s) && nurBits(s).length >= 8;
/** Texte (≥ 3 Buchstaben) aus Eingaben und Ergebnissen der Video-Beispiele. */
const VIDEO_TEXTE = new Set(
  VIDEOS.flatMap((v) => [...(Array.isArray(v.eingabe) ? v.eingabe : []), v.erwartet])
    .filter((x) => typeof x === 'string' && !istBits(x))
    .map(nurAZ)
    .filter((x) => x.length >= 3)
);
/** XOR-Operandenpaare der Videos (ungeordnet). */
const VIDEO_XOR = new Set(VIDEOS.filter((v) => v.verfahren === 'xorBits').map((v) => v.eingabe.map(nurBits).sort().join('|')));
/** Zahl-Eingaben je Verfahren (z. B. schluesselanzahl n, dh/rsa-Tupel). */
const VIDEO_ZAHLEN = new Set(VIDEOS.filter((v) => Array.isArray(v.eingabe) && v.eingabe.every(Number.isInteger)).map((v) => `${v.verfahren}:${v.eingabe.join(',')}`));

/** Kollision einer Generator-Aufgabe mit einem Video-Beispiel (Eingabetext, XOR-Paar, Zahl-Eingabe) oder null. */
function videoKollision(a) {
  const ia = a.interaktion || {};
  const texte = [];
  if (ia.kind === 'chiffre') texte.push(ia.eingabe, a.loesung.text);
  for (const b of a.inhalt || []) if (typeof b.md === 'string') for (const m of b.md.matchAll(/`([^`]+)`|\*\*([^*]+)\*\*|„([^“]+)“/g)) texte.push(m[1] || m[2] || m[3]);
  for (const t of texte) if (typeof t === 'string' && !istBits(t) && VIDEO_TEXTE.has(nurAZ(t))) return `Text ${t}`;
  if (ia.kind === 'bits-rechnen' && ia.operation === 'xor' && VIDEO_XOR.has(ia.operanden.map(nurBits).sort().join('|'))) return 'XOR-Paar';
  for (const z of a._videoZahlen || []) if (VIDEO_ZAHLEN.has(z)) return z;
  return null;
}

test('Video-Abgleich erkennt Video-Eingaben', () => {
  assert.ok(VIDEO_TEXTE.has('TREFFPUNKTAMBRUNNEN') && VIDEO_TEXTE.has('ZIFFER'));
  assert.ok(VIDEO_ZAHLEN.has('schluesselanzahl:4'));
  assert.equal(videoKollision({ inhalt: [], interaktion: { kind: 'chiffre', eingabe: 'nachtwache' }, loesung: { text: 'X' } }), 'Text nachtwache');
  assert.equal(videoKollision({ inhalt: [], interaktion: { kind: 'bits-rechnen', operation: 'xor', operanden: ['1001 1100', '0100 1010'] }, loesung: {} }), 'XOR-Paar');
});

/* ---------- Rahmen (Task 36) ---------- */

G.registriereGenerator('test_eins', { titel: 'Test: Eins', welten: [9], make: () => ({ titel: 'Eins', kategorie: 'modulo', inhalt: [{ t: 'text', md: '1 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['1'] }, erklaerung: [{ t: 'text', md: 'Eins.' }] }) });
G.registriereGenerator('test_ea', { titel: 'Test: eA', welten: [9], niveau: 'eA', make: () => ({ titel: 'Zwei', kategorie: 'modulo', inhalt: [{ t: 'text', md: '2 = [[g]]' }], interaktion: { kind: 'gaps', felder: { g: { typ: 'zahl' } } }, loesung: { g: ['2'] }, erklaerung: [{ t: 'text', md: 'Zwei.' }] }) });

test('Rahmen: Registry, Dopplung, Filter nach Welt und Sichtbarkeit, Algo-Quest-Generatoren entfernt', () => {
  assert.throws(() => G.registriereGenerator('test_eins', { titel: 'x', welten: [9], make: () => ({}) }), /bereits registriert/);
  assert.throws(() => G.registriereGenerator('Falsch-Name', { titel: 'x', welten: [9], make: () => ({}) }), /Generator/);
  assert.throws(() => G.registriereGenerator('test_niveau', { titel: 'x', welten: [9], niveau: 'plus', make: () => ({}) }), /niveau/);
  assert.deepEqual(G.generatorenFuerWelt(9).map((g) => g.key), ['test_eins', 'test_ea']);
  assert.deepEqual(G.generatorenFuerWelt(9)[1], { key: 'test_ea', titel: 'Test: eA', niveau: 'eA' });
  assert.deepEqual(G.generatorenFuerWelt(9, { sichtbar: (g) => g.niveau !== 'eA' }).map((g) => g.key), ['test_eins']);
  for (const alt of ['stapel', 'bst', 'bubble', 'ausdruck']) assert.equal(G.GENERATOREN[alt], undefined, alt);
  assert.equal(G.erzeuge('test_eins', 5).id, 'T-test_eins-5');
  assert.throws(() => G.erzeuge('gibtsnicht', 1), /Unbekannter Generator/);
  grundpruefung('test_eins', 5);
});

test('Trainingsplatz-API: 1 Punkt je Aufgabe, max. 30 pro Tag; eA-Generator nur im eA-Kurs', async () => {
  const uhr = H.uhr(Date.parse('2026-10-08T10:00:00Z'));
  let seed = 1;
  const { s, lk, kurs } = await H.szenario({ now: uhr, trainingSeed: () => seed++ });
  assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins', 'test_ea']);
  let summe = 0;
  for (let i = 0; i < 32; i++) {
    const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
    assert.ok(!JSON.stringify(t).includes('"loesung"'));
    summe += (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten;
  }
  assert.equal(summe, 30, 'Tageslimit');
  uhr.vor(24 * 3600 * 1000);
  const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
  assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 1, 'neuer Tag');
  const w9 = (await s.get('/api/welten')).body.welten.find((w) => w.nr === 9);
  if (w9) assert.equal(w9.training, true);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual((await s.get('/api/training/9')).body.generatoren.map((g) => g.key), ['test_eins']);
  assert.equal((await s.post('/api/training/9/neu').send({ generator: 'test_ea' })).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await s.post('/api/training/9/neu').send({})).body.generator, 'test_eins', 'Zufallswahl nur aus sichtbaren');
  assert.equal((await s.get('/api/training/aufgabe/999999')).status, 404);
});

test('Trainingsplatz: Aufdecken zeigt Lösung, danach keine Punkte', async () => {
  let seed = 100;
  const { s } = await H.szenario({ trainingSeed: () => seed++ });
  const t = (await s.post('/api/training/9/neu').send({ generator: 'test_eins' })).body;
  const d = (await s.post(`/api/training/aufgabe/${t.id}/aufdecken`).send({})).body;
  assert.deepEqual([d.status, d.loesung.g], ['angesehen', ['1']]);
  assert.equal((await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { g: '1' } })).body.punkteErhalten, 0);
});

/* ---------- Welt 0 und 1 (Task 37) ---------- */

const az = (s) => [...s.toUpperCase().replace(/[^A-Z]/g, '')].map((c) => c.charCodeAt(0) - 65); // A = 0
const za = (l) => l.map((n) => String.fromCharCode(65 + (((n % 26) + 26) % 26))).join('');
const W = require('../src/krypto/generatoren/woerter');

test('caesar_ver/caesar_ent: unabhängig nachgerechnet, Diagnose P3', () => {
  for (const a of grundpruefung('caesar_ver')) {
    const { k } = a.interaktion.verfahren;
    assert.equal(a.loesung.text, za(az(a.interaktion.eingabe).map((x) => x + k)));
    assert.match(a.inhalt[0].md, /Nummerierung: A = 1/);
    assert.ok(W.WOERTER_ANTIKE.includes(a.interaktion.eingabe));
    const p3 = za(az(a.interaktion.eingabe).map((x) => x - k));
    assert.equal(C.pruefeAufgabe(a, p3, { diagnose: true }).diagnose[0].p, 'P3');
  }
  for (const a of grundpruefung('caesar_ent')) {
    assert.equal(za(az(a.loesung.text).map((x) => x + a.interaktion.verfahren.k)), za(az(a.interaktion.eingabe)));
    assert.match(a.interaktion.eingabe, /^[A-Z]{5}( [A-Z]{5})*( [A-Z]{1,5})?$/, 'Fünfergruppen');
  }
  assert.notDeepEqual(G.erzeuge('caesar_ver', 1), G.erzeuge('caesar_ver', 2));
});

test('caesar_paar: k eindeutig durch Probieren aller 26 Schlüssel', () => {
  for (const a of grundpruefung('caesar_paar')) {
    const [, wort, geheim] = /`([a-z]+)` wurde mit Caesar zu `([A-Z ]+)`/.exec(a.inhalt[0].md);
    assert.ok(wort.length >= 3 && wort.length <= 6, wort);
    const ks = [...Array(26).keys()].filter((k) => za(az(wort).map((x) => x + k)) === geheim.replace(/ /g, ''));
    assert.deepEqual(ks.map(String), a.loesung.k);
    assert.ok(!a.loesung._fehlmuster.k.some((f) => f.wert === a.loesung.k[0]));
    const k = Number(a.loesung.k[0]);
    if (k !== 13) assert.ok(a.loesung._fehlmuster.k.some((f) => f.wert === String(26 - k) && f.p === 'P3'));
  }
});

test('mod_a1: Formel A = 1, mindestens 30 % mit p + k = 26', () => {
  let null26 = 0;
  for (const a of grundpruefung('mod_a1')) {
    const [, p, k] = /p = (\d+) .* k = (\d+)/.exec(a.inhalt[0].md).map(Number);
    const c = ((p + k - 1) % 26) + 1;
    assert.deepEqual([a.loesung.c[0], a.loesung.b[0]], [String(c), String.fromCharCode(64 + c)]);
    if (p + k === 26) { null26++; assert.ok(a.loesung._fehlmuster.c.some((f) => f.wert === '0' && f.p === 'P2')); }
    if (p + k > 26) assert.ok(a.loesung._fehlmuster.c.some((f) => f.wert === String(p + k) && f.p === 'P2'));
  }
  assert.ok(null26 >= 90, `nur ${null26} von 300 mit p + k = 26`);
});

test('affin: c = (m·p + t) mod 26 mit A = 0; invers_mod26: m · m⁻¹ ≡ 1', () => {
  const richtungen = new Set();
  for (const a of grundpruefung('affin')) {
    const { a: m, b: t } = a.interaktion.verfahren;
    const [klar, geheim] = a.interaktion.richtung === 'ver' ? [a.interaktion.eingabe, a.loesung.text] : [a.loesung.text, a.interaktion.eingabe];
    assert.equal(za(az(klar).map((p) => m * p + t)), za(az(geheim)));
    assert.match(a.inhalt[0].md, /Nummerierung: A = 0/);
    richtungen.add(a.interaktion.richtung);
    if (a.interaktion.richtung === 'ent') assert.equal((m * Number(/m⁻¹ = (\d+)/.exec(a.inhalt[0].md)[1])) % 26, 1);
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
  for (const a of grundpruefung('invers_mod26')) {
    const m = Number(/m = (\d+)/.exec(a.inhalt[0].md)[1]);
    assert.equal((m * Number(a.loesung.inv[0])) % 26, 1);
  }
});

test('schluesselwort_alphabet: Wort ohne Doppelte, Rest ab A', () => {
  for (const a of grundpruefung('schluesselwort_alphabet')) {
    const [, wort, n] = /Schlüsselwort ([A-ZÄÖÜ]+) .*ersten (\d+)/.exec(a.inhalt[0].md);
    const ohne = [...new Set(wort)].join('');
    const alph = ohne + [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !ohne.includes(c)).join('');
    assert.equal(a.loesung.a[0], alph.slice(0, Number(n)));
  }
});

test('Trainingsplatz Welt 0: caesar_ver mit Diagnose über die API', async () => {
  let seed = 7;
  const { s } = await H.szenario({ trainingSeed: () => seed++ });
  const t = (await s.post('/api/training/0/neu').send({ generator: 'caesar_ver' })).body;
  const a = G.erzeuge('caesar_ver', 7);
  const p3 = za(az(a.interaktion.eingabe).map((x) => x - a.interaktion.verfahren.k));
  const r = (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: p3 })).body;
  assert.equal(r.diagnose[0].p, 'P3');
});

/* ---------- Welt 2 und 3 (Task 38) ---------- */

test('vigenere: c = p + s (A = 0) je Stelle', () => {
  const richtungen = new Set();
  for (const a of grundpruefung('vigenere')) {
    const s = az(a.interaktion.verfahren.schluessel);
    const [p, c] = a.interaktion.richtung === 'ver' ? [a.interaktion.eingabe, a.loesung.text] : [a.loesung.text, a.interaktion.eingabe];
    assert.equal(za(az(p).map((x, i) => x + s[i % s.length])), za(az(c)));
    assert.match(a.inhalt[0].md, /Nummerierung: A = 1/);
    assert.equal(a.stufe, a.interaktion.richtung === 'ver' ? 1 : 2);
    richtungen.add(a.interaktion.richtung);
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
});

test('kasiski: Teilertabelle liefert k an erster Stelle; ohne Störabstand ist ggT = k', () => {
  const ggt = (x, y) => (y ? ggt(y, x % y) : x);
  let stoer = 0;
  for (const a of grundpruefung('kasiski')) {
    const d = /Abstände ([\d, ]+)\./.exec(a.inhalt[0].md)[1].split(/,\s*/).map(Number);
    const k = Number(a.loesung.k[0]);
    assert.ok(k >= 3 && k <= 8);
    const tab = [...Array(19).keys()].map((i) => i + 2).map((t) => [t, d.filter((x) => x % t === 0).length]).sort((x, y) => y[1] - x[1] || y[0] - x[0]);
    assert.equal(tab[0][0], k, d.join());
    if (a.stufe !== 3) assert.equal(d.reduce(ggt), k);
    else { stoer++; assert.equal(d.filter((x) => x % k !== 0).length, 1, 'genau ein Störabstand'); }
    const fm = a.loesung._fehlmuster.k.map((f) => Number(f.wert));
    assert.ok(fm.length <= 5 && !fm.includes(k));
    if (2 * k <= 20) assert.ok(fm.includes(2 * k));
  }
  assert.ok(stoer >= 45 && stoer <= 135, `Stufe 3: ${stoer} von 300`);
});

test('koinzidenz: gekürzter Bruch (BALLADE 2/21)', () => {
  const ggt = (x, y) => (y ? ggt(y, x % y) : x);
  const gesehen = new Map();
  for (const a of grundpruefung('koinzidenz')) {
    const w = /von \*\*([A-Z]+)\*\*/.exec(a.inhalt[0].md)[1];
    const h = {}; for (const c of w) h[c] = (h[c] || 0) + 1;
    const zae = Object.values(h).reduce((s, x) => s + x * (x - 1), 0), nen = w.length * (w.length - 1), g = ggt(zae, nen);
    assert.deepEqual([a.loesung.z[0], a.loesung.n[0]], [String(zae / g), String(nen / g)]);
    gesehen.set(w, `${a.loesung.z[0]}/${a.loesung.n[0]}`);
  }
  assert.equal(gesehen.get('BALLADE'), '2/21');
  assert.equal(gesehen.get('ANANAS'), '4/15');
  assert.equal(G.GENERATOREN.koinzidenz.niveau, 'eA');
});

test('xor_bytes: bitweise mit ^', () => {
  const laengen = new Set();
  for (const a of grundpruefung('xor_bytes')) {
    const [x, y] = a.interaktion.operanden.map((o) => o.replace(/ /g, ''));
    assert.match(a.interaktion.operanden[0], /^[01]{4}( [01]{4})+$/, 'Vierergruppen');
    assert.equal(a.loesung.bits, (parseInt(x, 2) ^ parseInt(y, 2)).toString(2).padStart(x.length, '0'));
    laengen.add(x.length);
  }
  assert.deepEqual([...laengen].sort(), [16, 8]);
});

test('kryptos16_runde: eigene Runde nach W3 §0a, keine schwachen Schlüssel, Niveau eA', () => {
  const S = [0xc, 0xf, 0x3, 0x9, 0x7, 0xa, 0x8, 0x6, 0x1, 0x2, 0x4, 0xe, 0xb, 0x5, 0xd, 0x0];
  const nib = (x) => [12, 8, 4, 0].map((s) => (x >> s) & 0xf);
  const ausNib = (n) => (n[0] << 12) | (n[1] << 8) | (n[2] << 4) | n[3];
  const trans = (x) => { const b = x.toString(2).padStart(16, '0'); let o = ''; for (let s = 0; s < 4; s++) for (let z = 0; z < 4; z++) o += b[z * 4 + s]; return parseInt(o, 2); };
  const runde = (x, k) => trans(ausNib(nib(x ^ k).map((v) => S[v])));
  const rot = (k) => ((k << 4) | (k >>> 12)) & 0xffff;
  assert.equal(runde(0x4f4b, 0xa36d), 0xd86e, 'Testvektor W3 §0a');
  for (const a of grundpruefung('kryptos16_runde')) {
    let x = parseInt(a.interaktion.block.replace(/ /g, ''), 2), k = parseInt(a.interaktion.schluessel.replace(/ /g, ''), 2);
    const [, xy] = /auf „([A-Z]{2})“/.exec(a.inhalt[0].md);
    assert.equal(x, (xy.charCodeAt(0) << 8) | xy.charCodeAt(1), 'Block = ASCII der zwei Buchstaben');
    assert.ok(new Set(nib(k)).size > 1, 'kein schwacher Schlüssel');
    for (let r = 0; r < a.interaktion.runden; r++) { x = runde(x, k); k = rot(k); }
    assert.equal(a.loesung.bits, x.toString(2).padStart(16, '0'));
  }
  assert.equal(G.GENERATOREN.kryptos16_runde.niveau, 'eA');
});

test('Trainingsplatz Welt 2: koinzidenz (eA) fehlt im gA-Kurs', async () => {
  const { s, lk, kurs } = await H.szenario();
  assert.ok((await s.get('/api/training/2')).body.generatoren.some((g) => g.key === 'koinzidenz'));
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual((await s.get('/api/training/2')).body.generatoren.map((g) => g.key), ['vigenere', 'kasiski']);
  assert.equal((await s.post('/api/training/3/neu').send({ generator: 'kryptos16_runde' })).status, 400);
});
