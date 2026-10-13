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
/** Caesar-Einzelbuchstaben der Videos (Buchstabe:k:Richtung), z. B. t + 6 → Z (Review M3 K7). */
const VIDEO_CAESAR_EINZEL = new Set(VIDEOS.filter((v) => v.verfahren === 'caesar' && nurAZ(v.eingabe[0]).length === 1).map((v) => `${nurAZ(v.eingabe[0])}:${v.eingabe[1]}:${v.richtung}`));
/** Zahl-Eingaben je Verfahren (z. B. schluesselanzahl n, dh/rsa-Tupel, mod a, m). */
const VIDEO_ZAHLEN = new Set(VIDEOS.filter((v) => Array.isArray(v.eingabe) && v.eingabe.every(Number.isInteger)).map((v) => `${v.verfahren}:${v.eingabe.join(',')}`));

/** Kollision einer Generator-Aufgabe mit einem Video-Beispiel (Eingabetext, XOR-Paar, Zahl-Eingabe) oder null. */
function videoKollision(a) {
  const ia = a.interaktion || {};
  const texte = [];
  if (ia.kind === 'chiffre') texte.push(ia.eingabe, a.loesung.text);
  for (const b of a.inhalt || []) if (typeof b.md === 'string') for (const m of b.md.matchAll(/`([^`]+)`|\*\*([^*]+)\*\*|„([^“]+)“/g)) texte.push(m[1] || m[2] || m[3]);
  for (const t of texte) if (typeof t === 'string' && !istBits(t) && VIDEO_TEXTE.has(nurAZ(t))) return `Text ${t}`;
  if (ia.kind === 'bits-rechnen' && ia.operation === 'xor' && VIDEO_XOR.has(ia.operanden.map(nurBits).sort().join('|'))) return 'XOR-Paar';
  // Zahl-Eingaben aus dem Aufgabentext (Schlüsselanzahl, DH, RSA)
  const md = (a.inhalt || []).map((b) => b.md || '').join(' ');
  const zahlen = [];
  let m;
  if ((m = /(\d+) Personen/.exec(md))) zahlen.push(`schluesselanzahl:${m[1]}`);
  if ((m = /p = (\d+), g = (\d+)\. Alice wählt a = (\d+), Bob wählt b = (\d+)/.exec(md))) zahlen.push(`dh.oeffentlich:${m[2]},${m[3]},${m[1]}`, `dh.oeffentlich:${m[2]},${m[4]},${m[1]}`);
  if ((m = /\(N, e\) = \((\d+), (\d+)\)\. Verschlüssele die Klarzahl m = (\d+)/.exec(md))) zahlen.push(`rsa.verschluesseln:${m[3]},${m[2]},${m[1]}`);
  // Modulo mit A = 1 (mod_a1): (p + k − 1) mod 26 und der Caesar-Schritt Buchstabe p + k (Review M3 K7)
  if ((m = /für p = (\d+) \(([A-Z])\) und k = (\d+)/.exec(md))) {
    zahlen.push(`mod:${Number(m[1]) + Number(m[3]) - 1},26`);
    if (VIDEO_CAESAR_EINZEL.has(`${m[2]}:${m[3]}:ver`)) return `caesar:${m[2]}:${m[3]}`;
  }
  for (const z of zahlen) if (VIDEO_ZAHLEN.has(z)) return z;
  return null;
}

test('Video-Abgleich erkennt Video-Eingaben', () => {
  assert.ok(VIDEO_TEXTE.has('TREFFPUNKTAMBRUNNEN') && VIDEO_TEXTE.has('ZIFFER'));
  assert.ok(VIDEO_ZAHLEN.has('schluesselanzahl:4') && VIDEO_ZAHLEN.has('dh.oeffentlich:2,5,29') && VIDEO_ZAHLEN.has('rsa.verschluesseln:10,5,133'));
  assert.equal(videoKollision({ inhalt: [{ t: 'text', md: '11 Personen kommunizieren' }], interaktion: { kind: 'gaps' }, loesung: {} }), 'schluesselanzahl:11');
  assert.equal(videoKollision({ inhalt: [], interaktion: { kind: 'chiffre', eingabe: 'nachtwache' }, loesung: { text: 'X' } }), 'Text nachtwache');
  assert.equal(videoKollision({ inhalt: [], interaktion: { kind: 'bits-rechnen', operation: 'xor', operanden: ['1001 1100', '0100 1010'] }, loesung: {} }), 'XOR-Paar');
  // Review M3 K7: mod-Einträge (26 mod 26, 27 mod 26) und Caesar-Einzelbuchstaben (t + 6) der Videos
  assert.ok(VIDEO_ZAHLEN.has('mod:26,26') && VIDEO_ZAHLEN.has('mod:27,26') && VIDEO_CAESAR_EINZEL.has('T:6:ver'));
  const modA1 = (p, k) => ({ inhalt: [{ t: 'text', md: `Berechne c = ((p + k − 1) mod 26) + 1 für p = ${p} (${String.fromCharCode(64 + p)}) und k = ${k}: c = [[c]]` }], interaktion: { kind: 'gaps' }, loesung: {} });
  assert.equal(videoKollision(modA1(20, 6)), 'caesar:T:6');
  assert.equal(videoKollision(modA1(14, 13)), 'mod:26,26');
  assert.equal(videoKollision(modA1(14, 14)), 'mod:27,26');
  assert.equal(videoKollision(modA1(3, 4)), null);
});

test('mod_a1: Video-Eingaben (26 mod 26, 27 mod 26, t/u/r/e mit k = 6) kommen in 5000 Seeds nie vor (Review M3 K7)', () => {
  for (let seed = 1; seed <= 5000; seed++) {
    const a = G.erzeuge('mod_a1', seed);
    assert.equal(videoKollision(a), null, `Seed ${seed}: ${a.inhalt[0].md}`);
  }
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
    assert.match(a.interaktion.eingabe, /^([A-Z]{5} )*[A-Z]{1,5}$/, 'Fünfergruppen'); // auch kurze Wörter (toga → 4 Buchstaben)
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

test('Generatoren: Fallen und Fehlmuster-Fallen passen zur Kategorie (kein Plausibilitäts-Hinweis, Review M3 K4)', () => {
  for (const key of Object.keys(G.GENERATOREN).filter((k) => !k.startsWith('test_'))) {
    const aufgaben = SEEDS.slice(0, 40).map((seed, i) => ({ ...G.erzeuge(key, seed), id: `W7-L1-${String(i + 1).padStart(2, '0')}` }));
    const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: 'kern', rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
    assert.deepEqual(v.warnungen.filter((w) => /passt nicht zur Kategorie/.test(w.meldung)).map((w) => w.meldung), [], key);
  }
  assert.ok(G.erzeuge('koinzidenz', 1).fallen.includes('P4'), 'koinzidenz: Paare doppelt gezählt = Verfahrensregel P4');
  assert.equal(G.erzeuge('koinzidenz', 1).loesung._fehlmuster.z[0].p, 'P4');
});

test('koinzidenz: gekürzter Bruch (GONDOLIERE 2/45, KASSETTE 3/28)', () => {
  const ggt = (x, y) => (y ? ggt(y, x % y) : x);
  const gesehen = new Map();
  for (const a of grundpruefung('koinzidenz')) {
    const w = /von \*\*([A-Z]+)\*\*/.exec(a.inhalt[0].md)[1];
    const h = {}; for (const c of w) h[c] = (h[c] || 0) + 1;
    const zae = Object.values(h).reduce((s, x) => s + x * (x - 1), 0), nen = w.length * (w.length - 1), g = ggt(zae, nen);
    assert.deepEqual([a.loesung.z[0], a.loesung.n[0]], [String(zae / g), String(nen / g)]);
    gesehen.set(w, `${a.loesung.z[0]}/${a.loesung.n[0]}`);
  }
  // Handrechnung: GONDOLIERE O 2·1 + E 2·1 = 4, 10 · 9 = 90 → 2/45; KASSETTE S, E, T je 2·1 = 6, 8 · 7 = 56 → 3/28
  assert.equal(gesehen.get('GONDOLIERE'), '2/45');
  assert.equal(gesehen.get('KASSETTE'), '3/28');
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

test('Trainingsplatz: offene Aufgabe eines nach Niveauwechsel unsichtbaren Generators → 404, nicht in info.offen (Review M3 K3)', async () => {
  const { s, lk, kurs } = await H.szenario();
  const t = (await s.post('/api/training/2/neu').send({ generator: 'koinzidenz' }).expect(201)).body;
  assert.equal((await s.get('/api/training/2')).body.offen, t.id);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  await s.get(`/api/training/aufgabe/${t.id}`).expect(404);
  await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: { z: '1', n: '2' } }).expect(404);
  await s.post(`/api/training/aufgabe/${t.id}/aufdecken`).send({}).expect(404);
  assert.equal((await s.get('/api/training/2')).body.offen, null);
  // sichtbarer Generator in derselben Welt bleibt erreichbar
  const v = (await s.post('/api/training/2/neu').send({ generator: 'vigenere' }).expect(201)).body;
  await s.get(`/api/training/aufgabe/${v.id}`).expect(200);
  assert.equal((await s.get('/api/training/2')).body.offen, v.id);
  // zurück im eA-Kurs ist die alte koinzidenz-Aufgabe (wurde durch „neu“ verworfen) nicht mehr da
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'eA' } }).expect(200);
  await s.get(`/api/training/aufgabe/${t.id}`).expect(404);
});

/* ---------- Welt 4 und 5 (Task 39) ---------- */

const potenz = (b, e, m) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };

test('w4_schluesselanzahl: Formeln n(n−1)/2 und 2n bzw. Zuwachs n und 2', () => {
  const varianten = new Set();
  for (const a of grundpruefung('w4_schluesselanzahl')) {
    const n = Number(/(\d+) Personen/.exec(a.inhalt[0].md)[1]);
    assert.ok(n >= 3 && n <= 40 && ![4, 5, 11, 17].includes(n), `n = ${n} (Video-Werte ausgeschlossen)`);
    const v2 = /kommt eine weitere hinzu/.test(a.inhalt[0].md);
    varianten.add(v2);
    assert.deepEqual([a.loesung.sym[0], a.loesung.asym[0]], v2 ? [String(n), '2'] : [String((n * (n - 1)) / 2), String(2 * n)]);
    if (!v2) assert.deepEqual([a.loesung._fehlmuster.sym[0].wert, a.loesung._fehlmuster.asym[0].wert], [String(n * (n - 1)), String(n)]);
    else assert.equal(a.loesung._fehlmuster, undefined);
  }
  assert.equal(varianten.size, 2);
});

test('w5_kryptoshash: eigene Hash-Schleife, keine reservierten Wörter, Fehlmuster A = 0', () => {
  let mitZustaenden = 0;
  for (const a of grundpruefung('w5_kryptoshash')) {
    const wort = /KH\(„([a-z]+)“\)/.exec(a.inhalt[0].md)[1];
    assert.ok(!['nebel', 'heute', 'morgen', 'ueberweise', 'zwei', 'tausend', 'euro'].includes(wort));
    let h = 0; const z = [];
    for (const c of wort) { h = (3 * h + (c.charCodeAt(0) - 96)) % 29; z.push(h); }
    assert.equal(a.loesung.h[0], String(h));
    z.forEach((x, i) => { if (a.loesung[`z${i + 1}`]) assert.equal(a.loesung[`z${i + 1}`][0], String(x)); });
    if (a.loesung.z1) { mitZustaenden++; assert.equal(a.stufe, 2); assert.ok(a.loesung[`z${wort.length}`]); }
  }
  assert.ok(mitZustaenden > 0 && mitZustaenden < 300);
  const m = grundpruefung('w5_kryptoshash').find((a) => /„mauer“/.test(a.inhalt[0].md));
  assert.ok(m, 'mauer kommt vor');
  assert.deepEqual(m.loesung._fehlmuster.h.map((f) => f.wert).sort(), ['1302', '21']);
  assert.equal(m.loesung.h[0], '26');
});

test('w4_dh und w4_rsa_ver: Potenzen per Schleife, g ist Primitivwurzel, Niveau ergaenzung', () => {
  for (const a of grundpruefung('w4_dh')) {
    const [, p, g, x, y] = /p = (\d+), g = (\d+)\. Alice wählt a = (\d+), Bob wählt b = (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok([11, 13, 17, 19, 23].includes(p) && x !== y && x >= 2 && x <= 8 && y >= 2 && y <= 8);
    assert.equal(new Set([...Array(p - 1).keys()].map((i) => potenz(g, i + 1, p))).size, p - 1, 'Primitivwurzel');
    const A = potenz(g, x, p), B = potenz(g, y, p);
    assert.deepEqual([a.loesung.A[0], a.loesung.B[0], a.loesung.K[0]], [A, B, potenz(B, x, p)].map(String));
    assert.equal(potenz(A, y, p), potenz(B, x, p));
    assert.notEqual(potenz(B, x, p), 1);
  }
  for (const a of grundpruefung('w4_rsa_ver')) {
    const [, N, e, m] = /\(N, e\) = \((\d+), (\d+)\)\. Verschlüssele die Klarzahl m = (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok(m >= 2 && m <= N - 2);
    assert.equal(a.loesung.c[0], String(potenz(m, e, N)));
    assert.notEqual(potenz(m, e, N), m);
  }
  assert.deepEqual(['w4_dh', 'w4_rsa_ver'].map((k) => G.GENERATOREN[k].niveau), ['ergaenzung', 'ergaenzung']);
});

test('Alle 19 Kryptos-Generatoren registriert (12 Pflicht nach Design §7.6 + DH/RSA + W0/W1-Ergänzungen, Plan M5 Task 91)', () => {
  assert.deepEqual(Object.keys(G.GENERATOREN).filter((k) => !k.startsWith('test_')).sort(), ['affin', 'caesar_ent', 'caesar_paar', 'caesar_ver', 'haeufigkeit_caesar', 'invers_mod26', 'kasiski', 'koinzidenz', 'kryptos16_runde', 'mod_a1', 'schluesselwort_alphabet', 'skytale', 'substitution_ver_ent', 'vigenere', 'w4_dh', 'w4_rsa_ver', 'w4_schluesselanzahl', 'w5_kryptoshash', 'xor_bytes']);
  // jede Welt 0–5 hat einen Trainingsplatz, Welt 6 (Zeitmaschine) keinen eigenen Generator
  for (const w of [0, 1, 2, 3, 4, 5]) assert.ok(G.generatorenFuerWelt(w).length > 0, `Welt ${w}`);
});

test('Entschlüsselungs-Generatoren liefern Klartext klein (Design §6.2, Plan M5 E58)', () => {
  for (const key of ['caesar_ent', 'affin', 'vigenere', 'skytale', 'substitution_ver_ent']) {
    let ent = 0;
    for (let s = 1; s <= 40; s++) {
      const a = G.erzeuge(key, s);
      if (a.interaktion.richtung !== 'ent') continue;
      ent++;
      assert.equal(a.loesung.text, a.loesung.text.toLowerCase(), key);
    }
    assert.ok(ent > 0, `${key}: keine Entschlüsselungsaufgabe in 40 Seeds`);
  }
});

/* ---------- Plan M5 Task 91: weitere Generatoren Welten 0 und 1 (W0 §8, W1 §8) ---------- */

/** Skytale unabhängig: Raster mit u Zeilen zeilenweise füllen (ohne Füllung: letzte Zeile kürzer), spaltenweise lesen. */
function skytaleRaster(text, u, fuellen = true) {
  let t = nurAZ(text);
  const m = Math.ceil(t.length / u);
  if (fuellen) t += 'X'.repeat(u * m - t.length);
  let out = '';
  for (let s = 0; s < m; s++) for (let z = 0; z < u; z++) if (z * m + s < t.length) out += t[z * m + s];
  return out;
}

test('skytale: Raster unabhängig nachgerechnet, ver/ent, Füllzeichen X, Diagnose P3/P4', () => {
  const richtungen = new Set();
  let p3 = 0;
  for (const a of grundpruefung('skytale')) {
    const ia = a.interaktion;
    const u = ia.verfahren.umfang;
    assert.ok([2, 3, 4, 5].includes(u), `u = ${u}`);
    assert.equal(a.kategorie, 'transposition');
    assert.match(a.inhalt[0].md, new RegExp(`Umfang u = ${u} .*Füllzeichen X`));
    richtungen.add(ia.richtung);
    if (ia.richtung === 'ver') {
      const woerter = ia.eingabe.split(' ');
      assert.ok(woerter.length >= 2 && woerter.length <= 3 && woerter.every((w) => W.WOERTER_ANTIKE.includes(w)), ia.eingabe);
      const n = nurAZ(ia.eingabe).length;
      assert.ok(n >= 8 && n <= 24, `${n} Buchstaben`);
      assert.equal(a.loesung.text, skytaleRaster(ia.eingabe, u));
      assert.ok(u * Math.ceil(n / u) - n < Math.ceil(n / u), 'keine Zeile nur aus Füllzeichen');
      // X fehlt → P4 (nur wenn aufgefüllt wurde)
      // (bei quadratischem Raster u = m mit genau einer Lücke gleicht das Raster ohne Füllung der P3-Umkehrung – dann P3)
      if (n % u) {
        const ohne = skytaleRaster(ia.eingabe, u, false);
        const ps = C.pruefeAufgabe(a, ohne, { diagnose: true }).diagnose.map((d) => d.p);
        assert.ok(ps.includes('P4') || (Math.ceil(n / u) === u && ps[0] === 'P3'), `${ia.eingabe}/${u}: ${ps}`);
      }
      // zeilenweise statt spaltenweise: Klartext spaltenweise eintragen, zeilenweise lesen → P3
      if (n % u === 0) {
        const t = nurAZ(ia.eingabe), m = n / u;
        let falsch = '';
        for (let z = 0; z < u; z++) for (let s = 0; s < m; s++) falsch += t[s * u + z];
        if (falsch !== a.loesung.text) { p3++; assert.equal(C.pruefeAufgabe(a, falsch, { diagnose: true }).diagnose[0].p, 'P3'); }
      }
    } else {
      assert.equal(a.loesung.text, a.loesung.text.toLowerCase(), 'Klartext klein');
      assert.equal(skytaleRaster(a.loesung.text, u), nurAZ(ia.eingabe), 'Klartext ergibt den Geheimtext');
      assert.match(ia.eingabe, /^([A-Z]{5} )*[A-Z]{1,5}$/, 'Fünfergruppen');
      const ohneX = a.loesung.text.replace(/x+$/, '');
      if (ohneX !== a.loesung.text) assert.deepEqual(a.loesung.alternativen, [ohneX]);
      assert.equal(C.pruefeAufgabe(a, ohneX).ok, true, 'abschließende X dürfen fehlen');
    }
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
  assert.ok(p3 > 0, 'P3-Fall geprüft');
});

test('substitution_ver_ent: Schlüsselwort-Alphabet unabhängig, Alphabet-Leiste, Diagnose P3', () => {
  const richtungen = new Set();
  for (const a of grundpruefung('substitution_ver_ent')) {
    const ia = a.interaktion;
    const wort = ia.verfahren.schluesselwort;
    assert.ok(W.SCHLUESSELWOERTER_W1.includes(wort.toLowerCase()), wort);
    const ohne = [...new Set(wort)].join('');
    const alph = ohne + [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter((c) => !ohne.includes(c)).join('');
    const leiste = a.inhalt.find((b) => b.t === 'alphabet');
    assert.ok(leiste, 'Block alphabet');
    assert.deepEqual(leiste.zeilen.map((z) => z.werte), ['abcdefghijklmnopqrstuvwxyz', alph]);
    const ver = (t) => [...nurAZ(t)].map((c) => alph[c.charCodeAt(0) - 65]).join('');
    const ent = (t) => [...nurAZ(t)].map((c) => String.fromCharCode(65 + alph.indexOf(c))).join('');
    const [klar, geheim] = ia.richtung === 'ver' ? [ia.eingabe, a.loesung.text] : [a.loesung.text, ia.eingabe];
    assert.ok(W.WOERTER_BAGDAD.includes(klar.toLowerCase().replace(/ /g, '')), klar);
    assert.equal(ver(klar), nurAZ(geheim));
    assert.notEqual(nurAZ(klar), nurAZ(geheim), 'kein unveränderter Text');
    if (ia.richtung === 'ent') assert.equal(a.loesung.text, a.loesung.text.toLowerCase());
    const falsch = ia.richtung === 'ver' ? ent(ia.eingabe) : ver(ia.eingabe);
    if (falsch !== nurAZ(a.loesung.text)) assert.equal(C.pruefeAufgabe(a, falsch, { diagnose: true }).diagnose[0].p, 'P3');
    richtungen.add(ia.richtung);
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
});

test('haeufigkeit_caesar: e eindeutig häufigster Klartextbuchstabe, k entschlüsselt, Top 5, Fehlmuster P1/P3', () => {
  for (const a of grundpruefung('haeufigkeit_caesar', 300)) {
    const k = Number(a.loesung.k[0]);
    assert.ok(k >= 1 && k <= 25);
    const block = a.inhalt.find((b) => b.t === 'haeufigkeit');
    assert.equal(block.quelle, 'text');
    const geheim = nurAZ(block.text);
    assert.ok(geheim.length >= 60 && geheim.length <= 120, `${geheim.length} Buchstaben`);
    assert.match(a.inhalt.map((b) => b.md || '').join(' '), /Nummerierung: A = 1/);
    const klar = za(az(geheim).map((x) => x - k));
    const zaehl = {};
    for (const c of klar) zaehl[c] = (zaehl[c] || 0) + 1;
    const sortiert = Object.entries(zaehl).sort((x, y) => y[1] - x[1]);
    assert.equal(sortiert[0][0], 'E', klar);
    assert.ok(sortiert[0][1] > sortiert[1][1], 'e eindeutig am häufigsten');
    // Top 5 des Geheimtextes im Text
    const gz = {};
    for (const c of geheim) gz[c] = (gz[c] || 0) + 1;
    const top = Object.entries(gz).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 5);
    for (const [c, n] of top) assert.match(a.inhalt[0].md, new RegExp(`${c} ${n}\\b`));
    // Fehlmuster
    const d = (x) => (C.pruefeAufgabe(a, { k: String(x) }, { diagnose: true }).diagnose || []).map((y) => y.p);
    if (k + 1 <= 25) assert.deepEqual(d(k + 1), ['P1']);
    if (k - 1 >= 0) assert.deepEqual(d(k - 1), ['P1']);
    if (26 - k !== k) assert.deepEqual(d(26 - k), ['P3']);
  }
});

test('schluesselwort_alphabet: Rest ab dem letzten Schlüsselwortbuchstaben → P4 „Kryptos-Regel: Rest ab A“', () => {
  let geprueft = 0;
  for (const seed of SEEDS.slice(0, 60)) {
    const a = G.erzeuge('schluesselwort_alphabet', seed);
    const [, wort, n] = /Schlüsselwort ([A-Z]+) .*ersten (\d+)/.exec(a.inhalt[0].md);
    const ohne = [...new Set(wort)].join('');
    const letzter = ohne.charCodeAt(ohne.length - 1) - 65;
    const rest = [];
    for (let i = 1; i <= 26; i++) { const c = String.fromCharCode(65 + ((letzter + i) % 26)); if (!ohne.includes(c)) rest.push(c); }
    const falsch = (ohne + rest.join('')).slice(0, Number(n));
    if (falsch === a.loesung.a[0]) continue;
    geprueft++;
    const d = C.pruefeAufgabe(a, { a: falsch }, { diagnose: true }).diagnose;
    assert.equal(d[0].p, 'P4');
    assert.equal(d[0].code, 'rest_ab_letztem');
    assert.match(d[0].text, /Rest ab A/);
  }
  assert.ok(geprueft > 30, `${geprueft}`);
});

test('affin (ent): t nach statt vor der Multiplikation abgezogen → P3', () => {
  let geprueft = 0;
  for (const a of grundpruefung('affin')) {
    if (a.interaktion.richtung !== 'ent') continue;
    const { a: m, b: t } = a.interaktion.verfahren;
    const inv = Number(/m⁻¹ = (\d+)/.exec(a.inhalt[0].md)[1]);
    const falsch = za(az(a.interaktion.eingabe).map((c) => inv * c - t));
    if (falsch === nurAZ(a.loesung.text) || t === 0) continue;
    geprueft++;
    assert.equal(C.pruefeAufgabe(a, falsch, { diagnose: true }).diagnose[0].p, 'P3', `${m}, ${t}`);
  }
  assert.ok(geprueft > 10);
});
