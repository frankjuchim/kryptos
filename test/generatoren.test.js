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
  const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: G.GENERATOREN[key].niveau, ...(G.GENERATOREN[key].niveau === 'kuer' ? { kuer: true } : {}), rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
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

test('erzeuge setzt das Niveau des Generators (Niveau-Chip im Trainingsplatz, Review M8 Fund 6)', async () => {
  assert.equal(G.erzeuge('test_ea', 3).niveau, 'eA');
  assert.equal(G.erzeuge('test_eins', 3).niveau, 'kern');
  for (const [key, g] of Object.entries(G.GENERATOREN)) assert.equal(G.erzeuge(key, 11).niveau, g.niveau, key);
  for (const key of ['kryptos16_runde', 'kryptos16_teilschritt', 'w4_rsa_ver', 'w4_inverses', 'w5_signatur', 'koinzidenz', 'friedman']) {
    assert.notEqual(G.GENERATOREN[key].niveau, 'kern', `${key} ist kein Kern-Generator`);
  }
  let seed = 1;
  const { s } = await H.szenario({ trainingSeed: () => seed++ });
  const t = (await s.post('/api/training/9/neu').send({ generator: 'test_ea' })).body;
  assert.equal(t.aufgabe.niveau, 'eA', 'Trainingsaufgabe trägt das Niveau');
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
    const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', niveau: G.GENERATOREN[key].niveau, ...(G.GENERATOREN[key].niveau === 'kuer' ? { kuer: true } : {}), rolle: 'kryptografie', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
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

test('Trainingsplatz Welt 2: koinzidenz und friedman (eA) fehlen im gA-Kurs', async () => {
  const { s, lk, kurs } = await H.szenario();
  assert.ok((await s.get('/api/training/2')).body.generatoren.some((g) => g.key === 'koinzidenz'));
  assert.ok((await s.get('/api/training/2')).body.generatoren.some((g) => g.key === 'friedman'));
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual((await s.get('/api/training/2')).body.generatoren.map((g) => g.key), ['vigenere', 'kasiski', 'vigenere_zeichen', 'teiltext', 'playfair', 'porta']);
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
  // Plan M8 Task 191: WOERTER_W5 neu (mauer steht jetzt im Korpus); apfel: 1, 19, 63 → 5, 20, 72 → 14
  const m = grundpruefung('w5_kryptoshash').find((a) => /„apfel“/.test(a.inhalt[0].md));
  assert.ok(m, 'apfel kommt vor');
  assert.deepEqual(m.loesung._fehlmuster.h.map((f) => f.wert).sort(), ['594', '9']);
  assert.equal(m.loesung.h[0], '14');
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

test('Alle Kryptos-Generatoren registriert (12 Pflicht nach Design §7.6 + DH/RSA + Ergänzungen W0–W2, Plan M5 Tasks 91/92; W3–W6 Plan M8 Tasks 192–194)', () => {
  assert.deepEqual(Object.keys(G.GENERATOREN).filter((k) => !k.startsWith('test_')).sort(), ['adfgvx_stufe1', 'affin', 'ascii_bits', 'caesar_ent', 'caesar_paar', 'caesar_ver', 'friedman', 'haeufigkeit_caesar', 'invers_mod26', 'kasiski', 'koinzidenz', 'kryptos16_runde', 'kryptos16_teilschritt', 'mod_a1', 'otp', 'otp_doppelt', 'playfair', 'porta', 'schluesselwort_alphabet', 'skytale', 'spaltentransposition', 'substitution_ver_ent', 'teiltext', 'vigenere', 'vigenere_zeichen', 'w4_dh', 'w4_inverses', 'w4_modpotenz', 'w4_rsa_schluessel', 'w4_rsa_ver', 'w4_schluesselanzahl', 'w5_kollision', 'w5_kryptoshash', 'w5_pruefsumme', 'w5_schutzziele', 'w5_signatur', 'xor_bytes', 'eves_uhrwerk', 'zeitplan', 'fallen_mix'].sort());
  // jede Welt 0–6 hat einen Trainingsplatz (Welt 6 seit Plan M8 Task 194)
  for (const w of [0, 1, 2, 3, 4, 5, 6]) assert.ok(G.generatorenFuerWelt(w).length > 0, `Welt ${w}`);
});

test('Entschlüsselungs-Generatoren liefern Klartext klein (Design §6.2, Plan M5 E58)', () => {
  for (const key of ['caesar_ent', 'affin', 'vigenere', 'skytale', 'substitution_ver_ent', 'playfair']) {
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

/* ---------- Plan M5 Task 92: weitere Generatoren Welt 2 (W2 §8 Nr. 4–8) ---------- */

const A1 = (c) => c.toUpperCase().charCodeAt(0) - 64; // A = 1 … Z = 26
const B1 = (n) => String.fromCharCode(64 + ((((n - 1) % 26) + 26) % 26) + 1);

test('vigenere_zeichen: A = 1-Formel ((p + s − 2) mod 26) + 1, Stufe 2 umgekehrt, Fehlmuster ±1 → P1', () => {
  const stufen = new Set();
  for (const a of grundpruefung('vigenere_zeichen')) {
    const md = a.inhalt[0].md;
    assert.match(md, /Nummerierung: A = 1/);
    const s = /s = ([A-Z])\b/.exec(md)[1];
    assert.notEqual(s, 'A', 'Schlüsselbuchstabe A ändert nichts');
    stufen.add(a.stufe);
    if (a.stufe === 1) {
      const p = /p = ([a-z])\b/.exec(md)[1];
      const c = B1(((A1(p) + A1(s) - 2) % 26) + 1);
      assert.equal(a.loesung.c[0], c);
      const fm = a.loesung._fehlmuster.c.map((f) => [f.wert, f.p]);
      assert.deepEqual(fm.sort(), [[B1(A1(c) + 1), 'P1'], [B1(A1(c) - 1), 'P1']].sort());
    } else {
      const c = /c = ([A-Z])\b/.exec(md)[1];
      const p = B1((((A1(c) - A1(s)) % 26) + 26) % 26 + 1).toLowerCase();
      assert.equal(a.loesung.p[0], p);
      assert.equal(B1(((A1(p) + A1(s) - 2) % 26) + 1), c, 'Probe');
      assert.deepEqual(C.pruefeAufgabe(a, { p: B1(A1(p) + 1) }, { diagnose: true }).diagnose.map((d) => d.p), ['P1']);
    }
  }
  assert.deepEqual([...stufen].sort(), [1, 2]);
});

test('teiltext: Positionen j − 1, j − 1 + k, … (ab 0), Fehlmuster T_{j±1} → P1', () => {
  for (const a of grundpruefung('teiltext')) {
    const md = a.inhalt[0].md;
    const k = Number(/Schlüssellänge (\d)/.exec(md)[1]);
    const j = Number(/Teiltext T_?(\d)/.exec(md.replace(/[₁₂₃₄]/g, (x) => '₁₂₃₄'.indexOf(x) + 1))[1]);
    const g = nurAZ(/`([A-Z ]+)`/.exec(md)[1]);
    assert.ok([2, 3, 4].includes(k) && j >= 1 && j <= k);
    assert.ok(g.length >= 12 && g.length <= 20);
    assert.match(md, new RegExp(`Positionen ab 0: ${j - 1}, ${j - 1 + k}`));
    let t = '';
    for (let i = j - 1; i < g.length; i += k) t += g[i];
    assert.equal(a.loesung.t[0], t);
    for (const f of a.loesung._fehlmuster.t) {
      assert.equal(f.p, 'P1');
      assert.notEqual(f.wert, t);
    }
  }
});

test('playfair: drei Regeln aus dem Merkkasten unabhängig nachgerechnet, Fall in der Erklärung', () => {
  const faelle = new Set();
  const richtungen = new Set();
  for (const a of grundpruefung('playfair')) {
    const ia = a.interaktion;
    const schl = ia.verfahren.schluessel;
    assert.ok(W.PLAYFAIR_W2.includes(schl));
    assert.ok(a.inhalt.some((b) => b.t === 'quadrat' && b.art === 'playfair' && b.schluessel === schl));
    // Quadrat: Schlüsselwort ohne Wiederholung, Rest ohne J
    const q = [...new Set(schl.replace(/J/g, 'I') + 'ABCDEFGHIKLMNOPQRSTUVWXYZ')].join('');
    const pos = (c) => [Math.floor(q.indexOf(c) / 5), q.indexOf(c) % 5];
    const bei = (z, s) => q[((z + 5) % 5) * 5 + ((s + 5) % 5)];
    const ver = (x, y) => {
      const [zx, sx] = pos(x), [zy, sy] = pos(y);
      if (zx === zy) return ['Zeile', bei(zx, sx + 1) + bei(zy, sy + 1)];
      if (sx === sy) return ['Spalte', bei(zx + 1, sx) + bei(zy + 1, sy)];
      return ['Rechteck', bei(zx, sy) + bei(zy, sx)];
    };
    const [klar, geheim] = ia.richtung === 'ver' ? [ia.eingabe, a.loesung.text] : [a.loesung.text, ia.eingabe];
    const kp = nurAZ(klar);
    assert.equal(kp.length, 2);
    assert.notEqual(kp[0], kp[1]);
    assert.ok(!kp.includes('J'));
    const [fall, erg] = ver(kp[0], kp[1]);
    assert.equal(nurAZ(geheim), erg);
    assert.match(a.erklaerung[0].md, new RegExp(fall));
    assert.equal(a.stufe, ia.richtung === 'ver' ? 1 : 2);
    if (ia.richtung === 'ent') assert.equal(a.loesung.text, a.loesung.text.toLowerCase());
    faelle.add(fall);
    richtungen.add(ia.richtung);
  }
  assert.deepEqual([...faelle].sort(), ['Rechteck', 'Spalte', 'Zeile']);
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
});

test('porta: Tafelwert über die Tafel-Konstruktion, Porta-Tafel als Block', () => {
  // Tafel: Schlüsselpaar j = ⌊s/2⌋ (A/B = 0 …), Kopfzeile a–m; Zeile j ist N…Z um j nach rechts rotiert
  const zeile = (j) => { const u = 'NOPQRSTUVWXYZ'; return u.slice(13 - j) + u.slice(0, 13 - j); };
  for (const a of grundpruefung('porta')) {
    const ia = a.interaktion;
    const s = ia.verfahren.schluessel;
    assert.equal(s.length, 1);
    const j = Math.floor((s.charCodeAt(0) - 65) / 2);
    const x = nurAZ(ia.eingabe);
    assert.equal(x.length, 1);
    const i = x.charCodeAt(0) - 65;
    const erw = i < 13 ? zeile(j)[i] : String.fromCharCode(65 + zeile(j).indexOf(x));
    assert.equal(nurAZ(a.loesung.text), erw);
    const tafel = a.inhalt.find((b) => b.t === 'tabelle');
    assert.ok(tafel, 'Porta-Tafel');
    assert.deepEqual(tafel.zeilen.map((r) => r.slice(1).join('')), Array.from({ length: 13 }, (_, n) => zeile(n)));
  }
});

test('friedman (eA): alle 14 Kombinationen n ∈ {501, 1001}, k ∈ 2 … 8 liefern gerundet k', () => {
  const kombis = new Set();
  for (const a of grundpruefung('friedman', 300)) {
    const md = a.inhalt[0].md;
    const n = Number(/n = (\d+)/.exec(md)[1]);
    const I = Number(/I = (0,\d{4})\b/.exec(md)[1].replace(',', '.'));
    const k = Number(a.loesung.k[0]);
    assert.ok([501, 1001].includes(n) && k >= 2 && k <= 8);
    const I_erw = Math.round((((n - k) * 0.076 + n * (k - 1) * 0.038) / ((n - 1) * k)) * 10000) / 10000;
    assert.equal(I, I_erw);
    const schaetzung = ((0.076 - 0.038) * n) / ((n - 1) * I - 0.038 * n + 0.076);
    assert.equal(Math.round(schaetzung), k);
    kombis.add(`${n}:${k}`);
  }
  for (const n of [501, 1001]) for (let k = 2; k <= 8; k++) {
    const I = Math.round((((n - k) * 0.076 + n * (k - 1) * 0.038) / ((n - 1) * k)) * 10000) / 10000;
    assert.equal(Math.round(((0.076 - 0.038) * n) / ((n - 1) * I - 0.038 * n + 0.076)), k, `${n}, ${k}`);
  }
  assert.equal(kombis.size, 14, 'alle Kombinationen kommen vor');
  assert.equal(G.GENERATOREN.friedman.niveau, 'eA');
});

// M5-Inhaltsprüfung: eine Sprachregelung für Verschiebungen wie in Specs, Akten und Lab – Verschlüsseln „nach rechts“
// (nach Z weiter mit A), Entschlüsseln „nach links“ (vor A weiter mit Z); nicht „nach hinten/vorn“, „vorwärts“,
// „zurückgeschoben“.
test('Generatoren: Richtungsangaben einheitlich „nach rechts“ / „nach links“', () => {
  const ALT = /nach hinten|nach vorn|vorwärts|rückwärts verschoben|zurückgeschoben/i;
  const texte = (a) => JSON.stringify([a.inhalt, a.tipps, a.erklaerung, a.titel]);
  let rechts = 0;
  let links = 0;
  for (const key of Object.keys(G.GENERATOREN)) {
    for (const s of SEEDS.slice(0, 20)) {
      const t = texte(G.erzeuge(key, s));
      assert.doesNotMatch(t, ALT, key);
      if (/nach rechts/.test(t)) rechts++;
      if (/nach links/.test(t)) links++;
    }
  }
  assert.ok(rechts > 0 && links > 0, `nach rechts ${rechts}, nach links ${links}`);
});

/* ---------- Plan M8 Task 192: Trainingsplatz Welt 3 (SPEC W3 §8) ---------- */

const { spawnSync } = require('node:child_process');
const nodePath = require('node:path');
/** Python-Zwilling über werkzeuge/krypto/bruecke.py: Aufträge [{ f, args }] → Ergebnisse (ohne python3: null). */
function zwilling(auftraege) {
  const r = spawnSync('python3', ['-I', nodePath.join(__dirname, '..', 'werkzeuge', 'krypto', 'bruecke.py')], { input: auftraege.map((a) => JSON.stringify(a)).join('\n') + '\n', encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return r.stdout.trim().split('\n').map((z) => JSON.parse(z)).map((x, i) => {
    assert.ok(x.ok, `${JSON.stringify(auftraege[i])}: ${JSON.stringify(x)}`);
    return x.r;
  });
}
const PYTHON = !spawnSync('python3', ['--version']).error;
/** unabhängig: ASCII-Bits (A = 65) ohne Trenner, XOR zweier Bitfolgen */
const asciiBits = (t) => [...t.toUpperCase()].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
const xorStr = (a, b) => [...nurBits(a)].map((x, i) => (x === nurBits(b)[i] ? '0' : '1')).join('');
const SEEDS500 = Array.from({ length: 500 }, (_, i) => i * 104729 + 3);
const VIDEO_ASCII = new Set(VIDEOS.filter((v) => v.verfahren === 'textZuBits').map((v) => v.eingabe[0]));

test('ascii_bits: ASCII (A = 65) beide Richtungen, keine Video-Zeichen, Alphabetnummer statt ASCII → P1', () => {
  const richtungen = new Set();
  for (const a of grundpruefung('ascii_bits')) {
    const ia = a.interaktion;
    richtungen.add(ia.richtung);
    assert.match(a.inhalt[0].md, /A = 65/);
    if (ia.richtung === 'zu-bits') {
      assert.match(ia.text, /^[A-Z]$/);
      assert.ok(!VIDEO_ASCII.has(ia.text), `Video-Zeichen ${ia.text}`);
      assert.equal(a.loesung.bits, asciiBits(ia.text));
      const alphabet = (ia.text.charCodeAt(0) - 64).toString(2).padStart(8, '0');
      assert.equal(C.pruefeAufgabe(a, alphabet, { diagnose: true }).diagnose[0].p, 'P1');
    } else {
      assert.equal(ia.richtung, 'zu-text');
      assert.equal(nurBits(ia.bits), asciiBits(a.loesung.text));
      assert.ok(!VIDEO_ASCII.has(a.loesung.text), `Video-Zeichen ${a.loesung.text}`);
    }
  }
  assert.deepEqual([...richtungen].sort(), ['zu-bits', 'zu-text']);
  if (PYTHON) {
    const aufgaben = SEEDS500.slice(0, 50).map((s) => G.erzeuge('ascii_bits', s));
    const r = zwilling(aufgaben.map((a) => ({ f: 'textZuBits', args: [a.interaktion.text || a.loesung.text, { gruppe: 0 }] })));
    aufgaben.forEach((a, i) => assert.equal(r[i], a.loesung.bits || nurBits(a.interaktion.bits)));
  }
});

test('otp: C = ASCII(W) ⊕ K bzw. zurück, Wortliste W3, OR statt XOR → P4; otp_doppelt: M2 = D ⊕ M1', () => {
  const richtungen = new Set();
  for (const a of grundpruefung('otp')) {
    const teile = Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion];
    const lo = Array.isArray(a.loesung) ? a.loesung : [a.loesung];
    const [x, k] = teile[0].operanden.map(nurBits);
    assert.equal(lo[0].bits, xorStr(x, k));
    if (teile.length === 1) {
      richtungen.add('ver');
      const wort = /Verschlüssele `([A-Z]+)`/.exec(a.inhalt[0].md)[1];
      assert.ok(W.WOERTER_W3.includes(wort.toLowerCase()) && wort.length >= 3 && wort.length <= 5, wort);
      assert.equal(x, asciiBits(wort));
      const oder = [...x].map((b, i) => (b === '1' || k[i] === '1' ? '1' : '0')).join('');
      if (oder !== lo[0].bits) assert.equal(C.pruefeAufgabe(a, oder, { diagnose: true }).diagnose[0].p, 'P4');
    } else {
      richtungen.add('ent');
      assert.deepEqual(teile.map((t) => t.kind), ['bits-rechnen', 'gaps']);
      assert.equal(asciiBits(lo[1].wort[0]), lo[0].bits);
      assert.ok(W.WOERTER_W3.includes(lo[1].wort[0].toLowerCase()));
    }
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
  for (const a of grundpruefung('otp_doppelt')) {
    const [, d, m1] = /C₁ ⊕ C₂ = `([01 ]+)`.*erste Nachricht lautet `([A-Z]+)`/.exec(a.inhalt[0].md);
    const m2 = a.loesung.wort[0];
    assert.ok(m1 !== m2 && m1.length === m2.length && m1.length >= 4 && m1.length <= 6);
    assert.ok([m1, m2].every((m) => W.WOERTER_W3.includes(m.toLowerCase())));
    assert.equal(xorStr(asciiBits(m1), asciiBits(m2)), nurBits(d));
  }
  if (PYTHON) {
    const aufgaben = SEEDS500.slice(0, 50).map((s) => G.erzeuge('otp', s));
    const r = zwilling(aufgaben.map((a) => ({ f: 'xorBits', args: [].concat(a.interaktion)[0].operanden })));
    aufgaben.forEach((a, i) => assert.equal(nurBits(r[i]), [].concat(a.loesung)[0].bits));
  }
});

test('kryptos16_teilschritt (eA): S-Box, S⁻¹, Transposition, Rundenschlüssel nach W3 §0a; S statt S⁻¹ → P3', () => {
  const S = [0xc, 0xf, 0x3, 0x9, 0x7, 0xa, 0x8, 0x6, 0x1, 0x2, 0x4, 0xe, 0xb, 0x5, 0xd, 0x0];
  const SI = S.map((_, i) => S.indexOf(i));
  const nib = (x) => [12, 8, 4, 0].map((s) => (x >> s) & 0xf);
  const ausNib = (n) => (n[0] << 12) | (n[1] << 8) | (n[2] << 4) | n[3];
  const trans = (x) => { const b = x.toString(2).padStart(16, '0'); let o = ''; for (let s = 0; s < 4; s++) for (let z = 0; z < 4; z++) o += b[z * 4 + s]; return parseInt(o, 2); };
  const rotLinks = (k, r) => { const n = ((r - 1) % 4) * 4; return ((k << n) | (k >>> (16 - n))) & 0xffff; };
  const b16 = (x) => x.toString(2).padStart(16, '0');
  const schritte = new Set();
  for (const a of grundpruefung('kryptos16_teilschritt')) {
    const ia = a.interaktion;
    assert.equal(ia.operation, 'kryptos16');
    schritte.add(ia.schritt);
    if (ia.schritt === 'rundenschluessel') {
      const k = parseInt(nurBits(ia.schluessel), 2);
      assert.ok(ia.runden >= 2 && ia.runden <= 4);
      assert.equal(a.loesung.bits, b16(rotLinks(k, ia.runden)));
    } else {
      const x = parseInt(nurBits(ia.block), 2);
      const soll = ia.schritt === 'sbox' ? ausNib(nib(x).map((v) => S[v])) : ia.schritt === 'sbox-inv' ? ausNib(nib(x).map((v) => SI[v])) : trans(x);
      assert.equal(a.loesung.bits, b16(soll));
      assert.notEqual(soll, x, 'Ergebnis ≠ Eingabe');
      if (ia.schritt !== 'transposition') {
        const falsch = ausNib(nib(x).map((v) => (ia.schritt === 'sbox' ? SI : S)[v]));
        if (falsch !== soll) assert.equal(C.pruefeAufgabe(a, b16(falsch), { diagnose: true }).diagnose[0].p, 'P3');
      }
    }
  }
  assert.deepEqual([...schritte].sort(), ['rundenschluessel', 'sbox', 'sbox-inv', 'transposition']);
  assert.equal(G.GENERATOREN.kryptos16_teilschritt.niveau, 'eA');
});

/** ADFGVX-Quadrat unabhängig: Schlüsselzeichen ohne Doppelte, dann A–Z, dann 0–9 */
function adfgvxQuadrat(schluessel) {
  const q = [];
  for (const c of `${schluessel}ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`) if (!q.includes(c)) q.push(c);
  return q;
}
test('adfgvx_stufe1: Paare Zeile/Spalte aus dem Quadrat, ver/ent, Zeile und Spalte vertauscht → P4', () => {
  const richtungen = new Set();
  const KOPF = 'ADFGVX';
  for (const a of grundpruefung('adfgvx_stufe1')) {
    const ia = a.interaktion;
    const schl = ia.verfahren.schluessel;
    assert.ok([...W.ADFGVX_W3, 'ZEPPELIN18'].includes(schl), schl);
    assert.ok(a.inhalt.some((b) => b.t === 'quadrat' && b.schluessel === schl && b.kopf === KOPF));
    const q = adfgvxQuadrat(schl);
    const paare = (t, tausch = false) => [...t.toUpperCase()].map((c) => { const i = q.indexOf(c); const [z, s] = [KOPF[Math.floor(i / 6)], KOPF[i % 6]]; return tausch ? s + z : z + s; }).join('');
    richtungen.add(ia.richtung);
    const [klar, geheim] = ia.richtung === 'ver' ? [ia.eingabe, a.loesung.text] : [a.loesung.text, ia.eingabe];
    assert.match(klar, /^[a-z0-9]{3,6}$/);
    assert.equal(geheim.replace(/ /g, '').toUpperCase(), paare(klar));
    if (ia.richtung === 'ver') {
      const t = paare(klar, true);
      if (t !== paare(klar)) assert.equal(C.pruefeAufgabe(a, t, { diagnose: true }).diagnose[0].p, 'P4');
    }
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
});

/** Spaltentransposition unabhängig: Zeilen füllen, Spalten in alphabetischer Schlüsselreihenfolge (gleiche Buchstaben von links) lesen */
function spalten(text, schl) {
  const t = text.toUpperCase();
  const reihe = [...schl].map((c, i) => [c, i]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1])).map((x) => x[1]);
  let out = '';
  for (const s of reihe) for (let i = s; i < t.length; i += schl.length) out += t[i];
  return out;
}
test('spaltentransposition: Reihenfolge alphabetisch, ver/ent, Wortlisten W3, gleich lange Spalten → P4, falsche Richtung → P3', () => {
  const richtungen = new Set();
  let p4 = 0;
  for (const a of grundpruefung('spaltentransposition')) {
    const ia = a.interaktion;
    const schl = ia.verfahren.schluessel;
    assert.ok(W.SPALTEN_W3.includes(schl), schl);
    richtungen.add(ia.richtung);
    const [klar, geheim] = ia.richtung === 'ver' ? [ia.eingabe, a.loesung.text] : [a.loesung.text, ia.eingabe];
    assert.ok(W.KLARTEXTE_W3.includes(klar.toLowerCase()), klar);
    assert.equal(spalten(klar, schl), nurAZ(geheim));
    const m = a.inhalt.find((b) => b.t === 'matrix');
    assert.deepEqual(m.kopf, [...schl]);
    assert.equal(m.zeilen.length, Math.ceil(klar.length / schl.length));
    if (ia.richtung === 'ver') {
      // Gegenrichtung: Spalten in Schlüsselreihenfolge wieder auf die Zeilen verteilt (unabhängig)
      const reihe = [...schl].map((c, i) => [c, i]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1])).map((x) => x[1]);
      const t = klar.toUpperCase(); const out = Array(t.length); let j = 0;
      for (const sp of reihe) for (let i = sp; i < t.length; i += schl.length) out[i] = t[j++];
      const gegen = out.join('');
      if (gegen !== nurAZ(geheim)) assert.equal(C.pruefeAufgabe(a, gegen, { diagnose: true }).diagnose[0].p, 'P3');
    }
    if (ia.richtung === 'ent' && klar.length % schl.length) {
      // Fehlrechnung unabhängig: alle Spalten ⌈n/c⌉ lang angenommen, dann zeilenweise gelesen
      const reihe = [...schl].map((c, i) => [c, i]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[1] - y[1])).map((x) => x[1]);
      const g = nurAZ(geheim); const zl = Math.ceil(g.length / schl.length); const sp = [];
      reihe.forEach((s, r) => { sp[s] = g.slice(r * zl, (r + 1) * zl); });
      let falsch = ''; for (let z = 0; z < zl; z++) for (const x of sp) falsch += x[z] || '';
      if (falsch !== nurAZ(klar)) { assert.equal(C.pruefeAufgabe(a, falsch, { diagnose: true }).diagnose[0].p, 'P4'); p4++; }
    }
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
  assert.ok(p4 > 20, `nur ${p4} Aufgaben mit kurzer letzter Zeile`);
});

test('Trainingsplatz Welt 3: kryptos16_teilschritt (eA) fehlt im gA-Kurs, die übrigen sind sichtbar', async () => {
  const { s, lk, kurs } = await H.szenario();
  const keys = async () => (await s.get('/api/training/3')).body.generatoren.map((g) => g.key);
  assert.deepEqual(await keys(), ['xor_bytes', 'kryptos16_runde', 'kryptos16_teilschritt', 'ascii_bits', 'otp', 'otp_doppelt', 'adfgvx_stufe1', 'spaltentransposition']);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { niveau: 'gA' } }).expect(200);
  assert.deepEqual(await keys(), ['xor_bytes', 'ascii_bits', 'otp', 'otp_doppelt', 'adfgvx_stufe1', 'spaltentransposition']);
});

test('Zwilling (bruecke.py) rechnet ADFGVX-Stufe 1, Spaltentransposition und KRYPTOS-16-Einzelschritte nach (je 50 Seeds)', { skip: !PYTHON && 'python3 fehlt' }, () => {
  const lauf = (key, auftrag, vergleich) => {
    const aufgaben = SEEDS500.slice(0, 50).map((s) => G.erzeuge(key, s));
    const r = zwilling(aufgaben.map(auftrag));
    aufgaben.forEach((a, i) => vergleich(a, r[i]));
  };
  lauf('adfgvx_stufe1', (a) => ({ f: 'verfahren.anwenden', args: [a.interaktion.verfahren, a.interaktion.eingabe, a.interaktion.richtung] }), (a, r) => assert.equal(String(r).replace(/\s+/g, '').toUpperCase(), a.loesung.text.toUpperCase()));
  lauf('spaltentransposition', (a) => ({ f: 'spaltentransposition', args: [a.interaktion.eingabe, a.interaktion.verfahren.schluessel, a.interaktion.richtung] }), (a, r) => assert.equal(nurAZ(r), nurAZ(a.loesung.text)));
  lauf('kryptos16_teilschritt', (a) => {
    const ia = a.interaktion;
    if (ia.schritt === 'rundenschluessel') return { f: 'kryptos16.rundenschluessel', args: [parseInt(nurBits(ia.schluessel), 2), ia.runden] };
    const x = parseInt(nurBits(ia.block), 2);
    return ia.schritt === 'transposition' ? { f: 'kryptos16.transponiere', args: [x] } : { f: 'kryptos16.sbox', args: [x, ia.schritt === 'sbox' ? 'ver' : 'ent'] };
  }, (a, r) => assert.equal(r.toString(2).padStart(16, '0'), a.loesung.bits));
});

/* ---------- Plan M8 Task 193: Trainingsplatz Welten 4 und 5 (SPEC W4 §8, W5 §8) ---------- */

const potenzSchleife = (b, e, m) => { let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };
const ggtZ = (x, y) => (y ? ggtZ(y, x % y) : x);
const khZ = (t) => { let h = 0; for (const c of t.toLowerCase()) h = (3 * h + (c.charCodeAt(0) - 96)) % 29; return h; };

test('w4_modpotenz (Ergänzung): gˣ mod p mit Primitivwurzel g, Fehlmuster ohne Reduktion → P2', () => {
  for (const a of grundpruefung('w4_modpotenz')) {
    const [, g, x, p] = /Berechne (\d+)\^(\d+) mod (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok([7, 11, 13, 17, 19, 23].includes(p) && x >= 2 && x <= 9);
    assert.equal(new Set([...Array(p - 1).keys()].map((i) => potenzSchleife(g, i + 1, p))).size, p - 1, 'Primitivwurzel');
    assert.equal(a.loesung.r[0], String(potenzSchleife(g, x, p)));
    if (g ** x >= p) assert.ok(a.loesung._fehlmuster.r.some((f) => f.wert === String(g ** x) && f.p === 'P2'));
  }
  assert.equal(G.GENERATOREN.w4_modpotenz.niveau, 'ergaenzung');
});

test('w4_rsa_schluessel (Ergänzung): N, φ, d; e kleinstes zulässiges aus {3, 5, 7, 11, 13}, d ≠ e; φ = N − 1 → P7', () => {
  for (const a of grundpruefung('w4_rsa_schluessel')) {
    const [, p, q, e] = /p = (\d+), q = (\d+), e = (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok(p !== q && [3, 5, 7, 11, 13, 17, 19].includes(p) && [3, 5, 7, 11, 13, 17, 19].includes(q) && p * q <= 323);
    assert.ok(!(p * q === 133), 'Video-Schlüssel (7, 19) ausgeschlossen');
    const phi = (p - 1) * (q - 1);
    let d = 1; while ((d * e) % phi !== 1) d++;
    assert.notEqual(d, e);
    const kleinstes = [3, 5, 7, 11, 13].find((x) => { if (x >= phi || ggtZ(x, phi) !== 1) return false; let y = 1; while ((y * x) % phi !== 1) y++; return y !== x; });
    assert.equal(e, kleinstes);
    assert.deepEqual([a.loesung.N[0], a.loesung.phi[0], a.loesung.d[0]], [p * q, phi, d].map(String));
    assert.ok(a.loesung._fehlmuster.phi.some((f) => f.wert === String(p * q - 1) && f.p === 'P7'));
  }
});

test('w4_inverses (Kür): a · a⁻¹ ≡ 1 mod m, kleinster positiver Rest; negativer Euklid-Koeffizient → P2', () => {
  let negativ = 0;
  for (const a of grundpruefung('w4_inverses')) {
    const [, x, m] = /Inverse von (\d+) modulo (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok([26, 29, 31, 40, 48, 60, 72, 96].includes(m) && ggtZ(x, m) === 1 && x >= 2 && x < m);
    const inv = Number(a.loesung.i[0]);
    assert.ok(inv >= 1 && inv < m && (x * inv) % m === 1);
    const f = (a.loesung._fehlmuster || {}).i || [];
    if (f.length) { negativ++; assert.equal(f[0].p, 'P2'); assert.equal(Number(f[0].wert) + m, inv); }
  }
  assert.ok(negativ > 0);
  assert.equal(G.GENERATOREN.w4_inverses.niveau, 'kuer');
});

test('w5_kollision: Musterlösung erfüllt hash-ziel, Ziel nie KH eines reservierten Paars, Varianten A (andere Nachricht) und B (Präfix)', () => {
  const RESERVIERT = new Set([22, 18, 8, 0]); // heute/morgen, ueberweise…, treffen…, sonne/geheim (SPEC W5 §0a)
  const varianten = new Set();
  for (let seed = 1; seed <= 1000; seed++) {
    const a = G.erzeuge('w5_kollision', seed * 7 + 1);
    const ia = a.interaktion;
    assert.equal(ia.kind, 'hash-ziel');
    assert.ok(!RESERVIERT.has(ia.ziel), `Ziel ${ia.ziel}`);
    assert.equal(khZ(a.loesung.beispiel), ia.ziel);
    assert.equal(C.pruefeAufgabe(a, { text: a.loesung.beispiel }).ok, true);
    if (ia.ungleich) {
      varianten.add('A');
      assert.ok(W.WOERTER_W5.includes(ia.ungleich[0]));
      assert.equal(khZ(ia.ungleich[0]), ia.ziel);
      assert.notEqual(a.loesung.beispiel, ia.ungleich[0]);
      assert.equal(C.pruefeAufgabe(a, { text: ia.ungleich[0] }).ok, false);
    } else {
      varianten.add('B');
      assert.match(ia.praefix, /^[a-z]{2}$/);
      assert.ok(a.loesung.beispiel.startsWith(ia.praefix));
    }
  }
  assert.deepEqual([...varianten].sort(), ['A', 'B']);
  grundpruefung('w5_kollision');
});

test('w5_pruefsumme: S und G (mod 29) für Wort und Vertauschung, Auswahl aus den berechneten Gleichheiten', () => {
  const S = (t) => [...t].reduce((s, c) => s + c.charCodeAt(0) - 96, 0) % 29;
  const Gw = (t) => [...t].reduce((s, c, i) => s + (i + 1) * (c.charCodeAt(0) - 96), 0) % 29;
  const antworten = new Set();
  for (const a of grundpruefung('w5_pruefsumme')) {
    const [, x, y] = /„([a-z]+)“ und „([a-z]+)“/.exec(a.inhalt[0].md);
    assert.ok(x !== y && [...x].sort().join('') === [...y].sort().join(''), 'Vertauschung');
    assert.ok(W.WOERTER_W5.includes(x));
    const lo = a.loesung;
    assert.deepEqual([lo[0].sa[0], lo[0].sb[0], lo[0].ga[0], lo[0].gb[0]], [S(x), S(y), Gw(x), Gw(y)].map(String));
    const soll = Gw(x) !== Gw(y) ? 'G' : 'keine';
    const opt = a.interaktion[1].optionen.find((o) => lo[1].richtig.includes(o.id));
    assert.equal(opt.md, soll);
    antworten.add(soll);
  }
  assert.ok(antworten.has('G'));
});

test('w5_signatur (Ergänzung): s³ mod N, Urteil gültig/ungültig, kein Fixpunkt; Prüfung mit d statt e → P9', () => {
  const urteile = new Set();
  let mitD = 0;
  for (const a of grundpruefung('w5_signatur')) {
    const [, N, h, s] = /\((\d+), 3\)\. Hashwert der empfangenen Nachricht: (\d+)\. Signatur s = (\d+)/.exec(a.inhalt[0].md).map(Number);
    assert.ok([55, 33, 51].includes(N) && h >= 2 && h <= 28 && h < N);
    const x = potenzSchleife(s, 3, N);
    assert.equal(a.loesung.x[0], String(x));
    const urteil = x === h ? 'gültig' : 'ungültig';
    assert.equal(a.loesung.urteil[0], urteil);
    urteile.add(urteil);
    const fm = ((a.loesung._fehlmuster || {}).x || []);
    assert.ok(fm.every((f) => f.p === 'P9' && f.wert === String(potenzSchleife(s, { 55: 27, 33: 7, 51: 11 }[N], N))));
    if (fm.length) mitD++;
  }
  assert.deepEqual([...urteile].sort(), ['gültig', 'ungültig']);
  assert.ok(mitD > 100, `Fehlmuster d statt e nur ${mitD}-mal`);
  assert.equal(G.GENERATOREN.w5_signatur.niveau, 'ergaenzung');
});

test('w5_schutzziele: Bausteine mit fester Lösung (Akte W5·2 Auftrag 4), alle erreichbar, Mehrfachauswahl der vier Schutzziele', () => {
  const SOLL = { 'nur verschlüsseln': ['Vertraulichkeit'], 'nur signieren': ['Integrität', 'Authentizität', 'Verbindlichkeit'], 'signieren und verschlüsseln': ['Vertraulichkeit', 'Integrität', 'Authentizität', 'Verbindlichkeit'] };
  const gesehen = new Set();
  for (const a of grundpruefung('w5_schutzziele')) {
    assert.equal(a.interaktion.kind, 'choice');
    assert.equal(a.interaktion.mehrfach, true);
    assert.deepEqual(a.interaktion.optionen.map((o) => o.md).sort(), ['Authentizität', 'Integrität', 'Verbindlichkeit', 'Vertraulichkeit']);
    const baustein = Object.keys(SOLL).find((b) => a.titel.endsWith(b));
    assert.ok(baustein, a.titel);
    gesehen.add(baustein);
    assert.deepEqual(a.interaktion.optionen.filter((o) => a.loesung.richtig.includes(o.id)).map((o) => o.md).sort(), [...SOLL[baustein]].sort());
  }
  assert.equal(gesehen.size, Object.keys(SOLL).length);
});

test('Trainingsplatz Welten 4/5: Kür-Generator nur bei freigegebener Kür, Ergänzungen immer', async () => {
  const { s, lk, kurs } = await H.szenario();
  const keys = async (w) => (await s.get(`/api/training/${w}`)).body.generatoren.map((g) => g.key);
  assert.deepEqual(await keys(4), ['w4_schluesselanzahl', 'w4_dh', 'w4_rsa_ver', 'w4_modpotenz', 'w4_rsa_schluessel', 'w4_inverses']);
  assert.deepEqual(await keys(5), ['w5_kryptoshash', 'w5_kollision', 'w5_pruefsumme', 'w5_signatur', 'w5_schutzziele']);
  await lk.patch(`/api/lehrer/kurse/${kurs.id}`).send({ einstellungen: { kuer: 'gesperrt' } }).expect(200);
  assert.ok(!(await keys(4)).includes('w4_inverses'));
});

test('Zwilling (bruecke.py) rechnet die Generatoren der Welten 4/5 nach (je 50 Seeds)', { skip: !PYTHON && 'python3 fehlt' }, () => {
  const lauf = (key, auftrag, vergleich) => {
    const aufgaben = SEEDS500.slice(0, 50).map((s) => G.erzeuge(key, s));
    const r = zwilling(aufgaben.map(auftrag));
    aufgaben.forEach((a, i) => vergleich(a, r[i]));
  };
  lauf('w4_modpotenz', (a) => ({ f: 'modpow', args: /Berechne (\d+)\^(\d+) mod (\d+)/.exec(a.inhalt[0].md).slice(1).map(Number) }), (a, r) => assert.equal(String(r), a.loesung.r[0]));
  lauf('w4_rsa_schluessel', (a) => ({ f: 'rsa.schluessel', args: /p = (\d+), q = (\d+), e = (\d+)/.exec(a.inhalt[0].md).slice(1).map(Number) }), (a, r) => assert.deepEqual([r.N, r.phi, r.d].map(String), [a.loesung.N[0], a.loesung.phi[0], a.loesung.d[0]]));
  lauf('w4_inverses', (a) => ({ f: 'inverses', args: /Inverse von (\d+) modulo (\d+)/.exec(a.inhalt[0].md).slice(1).map(Number) }), (a, r) => assert.equal(String(r), a.loesung.i[0]));
  lauf('w5_kollision', (a) => ({ f: 'kryptosHash', args: [a.loesung.beispiel] }), (a, r) => assert.equal(r.wert, a.interaktion.ziel));
  lauf('w5_pruefsumme', (a) => ({ f: 'pruefsumme', args: [/„([a-z]+)“ und/.exec(a.inhalt[0].md)[1], 'gewichtet'] }), (a, r) => assert.equal(String(r), a.loesung[0].ga[0]));
  lauf('w5_signatur', (a) => { const [, N, , s] = /\((\d+), 3\)\. Hashwert der empfangenen Nachricht: (\d+)\. Signatur s = (\d+)/.exec(a.inhalt[0].md).map(Number); return { f: 'modpow', args: [s, 3, N] }; }, (a, r) => assert.equal(String(r), a.loesung.x[0]));
});

/* ---------- Plan M8 Task 194: Trainingsplatz Welt 6 (SPEC W6 §8) ---------- */

/** Eves Uhrwerk unabhängig: Ring (Block 8, X), Pendel-Vigenère (A = Verschiebung 0) */
const ringZ = (t, s, ent = false) => { let x = t.toUpperCase(); while (x.length % 8) x += 'X'; let o = ''; for (let b = 0; b < x.length; b += 8) { const blk = x.slice(b, b + 8); const f = [...Array(8).keys()].map((j) => (j * s) % 8); if (!ent) o += f.map((i) => blk[i]).join(''); else { const r = Array(8); f.forEach((i, j) => { r[i] = blk[j]; }); o += r.join(''); } } return o; };
const pendelZ = (w, n) => { const p = w.length === 1 ? w : w + [...w.slice(1, -1)].reverse().join(''); let o = ''; while (o.length < n) o += p; return o.slice(0, n); };
const vigZ = (t, k, vz = 1) => [...t].map((c, i) => String.fromCharCode(65 + (((c.charCodeAt(0) - 65 + vz * (k.charCodeAt(i % k.length) - 65)) % 26) + 26) % 26)).join('');

test('eves_uhrwerk: Ring + Pendel unabhängig, ver/ent invers, X am Ende toleriert, Diagnose P3/P4 (1000 Seeds)', () => {
  const richtungen = new Set();
  const diagnosen = new Set();
  for (let seed = 1; seed <= 1000; seed++) {
    const a = G.erzeuge('eves_uhrwerk', seed * 13 + 5);
    const { t, pendel } = a.interaktion.verfahren;
    assert.ok([3, 5, 7].includes(t) && W.PENDEL_W6.includes(pendel));
    const klar = a.interaktion.richtung === 'ver' ? a.interaktion.eingabe : a.loesung.text.replace(/x+$/, '');
    assert.ok(W.KLARTEXTE_W6.includes(klar), klar);
    const z = ringZ(klar, t);
    const geheim = vigZ(z, pendelZ(pendel, z.length));
    richtungen.add(a.interaktion.richtung);
    if (a.interaktion.richtung === 'ver') {
      assert.equal(nurAZ(a.loesung.text), geheim);
      if (seed <= 60) {
        let pad = klar.toUpperCase();
        while (pad.length % 8) pad += 'X';
        const kandidaten = [
          ['P3', ringZ(vigZ(pad, pendelZ(pendel, pad.length)), t)], // Stufen vertauscht
          ['P3', vigZ(ringZ(pad, t, true), pendelZ(pendel, pad.length))], // Ring in der Gegenrichtung
          ['P4', vigZ(z, pendel)] // Pendelwort zyklisch statt Pendel
        ];
        for (const [p, falsch] of kandidaten) if (falsch !== geheim) { const d = C.pruefeAufgabe(a, falsch, { diagnose: true }).diagnose; assert.equal(d[0].p, p, `${seed} ${p}`); diagnosen.add(p); }
      }
    } else {
      assert.equal(nurAZ(a.interaktion.eingabe), geheim);
      assert.equal(C.pruefeAufgabe(a, klar).ok, true, 'ohne Füll-X');
      assert.equal(C.pruefeAufgabe(a, a.loesung.text).ok, true, 'mit Füll-X');
    }
  }
  assert.deepEqual([...richtungen].sort(), ['ent', 'ver']);
  assert.deepEqual([...diagnosen].sort(), ['P3', 'P4']);
  grundpruefung('eves_uhrwerk');
  if (PYTHON) {
    const aufgaben = SEEDS500.slice(0, 50).map((s) => G.erzeuge('eves_uhrwerk', s));
    const r = zwilling(aufgaben.map((a) => ({ f: 'verfahren.anwenden', args: [a.interaktion.verfahren, a.interaktion.eingabe, a.interaktion.richtung] })));
    aufgaben.forEach((a, i) => assert.equal(nurAZ(r[i]), nurAZ(a.loesung.text)));
  }
});

test('zeitplan: BE · Takt (eA 2,25 / gA 2,2), Summe 30 bzw. 25, Lösung ± 0,5 akzeptiert, ± 0,6 nicht', () => {
  const fragen = new Set();
  for (const a of grundpruefung('zeitplan')) {
    const md = a.inhalt[0].md;
    const eA = /eA/.test(md);
    const takt = eA ? 2.25 : 2.2;
    const be = [...md.matchAll(/\(([a-j])\) (\d) BE/g)].map((m) => Number(m[2]));
    assert.ok(be.length >= 7 && be.length <= 10 && be.every((b) => b >= 2 && b <= 6));
    assert.equal(be.reduce((s, b) => s + b, 0), eA ? 30 : 25);
    const feld = a.interaktion.felder.min;
    assert.equal(feld.toleranz, 0.5);
    let soll;
    let m;
    if ((m = /Wie viele Minuten sind für Teilaufgabe \(([a-j])\)/.exec(md))) { soll = be['abcdefghij'.indexOf(m[1])] * takt; fragen.add('a'); }
    else if ((m = /bis einschließlich Teilaufgabe \(([a-j])\)/.exec(md))) { soll = be.slice(0, 'abcdefghij'.indexOf(m[1]) + 1).reduce((s, b) => s + b, 0) * takt; fragen.add('b'); }
    else { m = /Nach (\d+) Minuten sind Teilaufgaben mit (\d+) BE erledigt/.exec(md); soll = Number(m[1]) - Number(m[2]) * takt; fragen.add('c'); }
    const zahl = Number(a.loesung.min[0].replace(',', '.'));
    assert.ok(Math.abs(zahl - soll) < 1e-9, `${zahl} ≠ ${soll}`);
    const pr = (x) => C.pruefeAufgabe(a, { min: String(x).replace('.', ',') }).ok;
    assert.equal(pr(+(soll + 0.5).toFixed(2)), true);
    assert.equal(pr(+(soll - 0.5).toFixed(2)), true);
    assert.equal(pr(+(soll + 0.6).toFixed(2)), false);
    assert.equal(pr(+(soll - 0.6).toFixed(2)), false);
  }
  assert.deepEqual([...fragen].sort(), ['a', 'b', 'c']);
});

test('fallen_mix: Schülerlösung enthält genau die gewählte Falle (unabhängig nachgerechnet), Falle und Ergebnis nötig', () => {
  const gesehen = new Set();
  for (const a of grundpruefung('fallen_mix', 120)) {
    const md = a.inhalt.map((b) => b.md || '').join(' ');
    const falle = a.loesung.falle[0].slice(0, 2);
    gesehen.add(`${a.kategorie}:${falle}`);
    assert.deepEqual(a.fallen, [], 'kein Fallen-Chip (die Falle ist die Antwort)');
    let m;
    if ((m = /Verschlüssele `([a-z]+)` mit Caesar, Verschiebung k = (\d+)\. Schülerlösung: `([A-Z ]+)`/.exec(md))) {
      const [, w, k, s0] = m;
      const s = nurAZ(s0);
      const richtig = za(az(w).map((x) => x + Number(k)));
      assert.equal(a.loesung.ergebnis[0], richtig);
      if (falle === 'P1') assert.ok([za(az(w).map((x) => x + Number(k) + 1)), za(az(w).map((x) => x + Number(k) - 1))].includes(s));
      else { assert.equal(falle, 'P2'); assert.equal(s, richtig.replace(/Z/g, 'A')); assert.ok(richtig.includes('Z')); }
    } else if ((m = /Entschlüssele `([A-Z ]+)` mit Caesar, Verschiebung k = (\d+)\. Schülerlösung: `([a-z]+)`/.exec(md))) {
      const [, g0, k, s] = m;
      const g = nurAZ(g0);
      assert.equal(falle, 'P3');
      assert.equal(a.loesung.ergebnis[0], za(az(g).map((x) => x - Number(k))).toLowerCase());
      assert.equal(s.toUpperCase(), za(az(g).map((x) => x + Number(k))));
    } else if ((m = /Berechne \((\d+) − (\d+)\) mod 26\. Schülerlösung: (−?\d+)/.exec(md))) {
      const [, x, y, s] = m;
      assert.equal(falle, 'P2');
      assert.equal(a.loesung.ergebnis[0], String((((Number(x) - Number(y)) % 26) + 26) % 26));
      assert.equal(Number(s.replace('−', '-')), Number(x) - Number(y));
    } else if ((m = /Vigenère, Schlüsselwort (\w+) .*?(Verschlüssele|Entschlüssele) `([\w ]+)`\. Schülerlösung: `([\w ]+)`/.exec(md))) {
      const [, key, art, t, s] = m;
      const vz = art === 'Verschlüssele' ? 1 : -1;
      const ks = [...key].map((c) => c.charCodeAt(0) - 65);
      const rechne = (txt, sh, v) => za(az(txt).map((x, i) => x + v * (ks[i % ks.length] + sh)));
      assert.equal(nurAZ(a.loesung.ergebnis[0]), rechne(t, 0, vz));
      if (falle === 'P1') assert.equal(nurAZ(s), rechne(t, 1, vz));
      else { assert.equal(falle, 'P3'); assert.equal(nurAZ(s), rechne(t, 0, -vz)); }
    } else {
      m = /(\d+) Personen .*Schülerlösung: (\d+) Schlüssel/.exec(md);
      assert.ok(m, md);
      const n = Number(m[1]);
      assert.equal(falle, 'P7');
      assert.equal(Number(m[2]), n * (n - 1));
      assert.equal(a.loesung.ergebnis[0], String((n * (n - 1)) / 2));
    }
    // nur Falle richtig oder nur Ergebnis richtig reicht nicht
    const andere = a.interaktion.felder.falle.optionen.find((o) => o !== a.loesung.falle[0]);
    assert.equal(C.pruefeAufgabe(a, { falle: andere, ergebnis: a.loesung.ergebnis[0] }).ok, false);
    assert.equal(C.pruefeAufgabe(a, { falle: a.loesung.falle[0], ergebnis: 'zzz' }).ok, false);
  }
  for (const k of ['verschluesseln:P1', 'verschluesseln:P2', 'entschluesseln:P3', 'modulo:P2', 'substitution-poly:P1', 'substitution-poly:P3', 'schluesselraum:P7']) assert.ok(gesehen.has(k), k);
});

test('fallen_mix (Review M8 Fund 2): die Schülerlösung ist in keinem Fall zugleich das richtige Ergebnis (5000 Seeds)', () => {
  const norm = (x) => String(x).replace(/−/g, '-').replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  const falsch = [];
  for (let seed = 1; seed <= 5000; seed++) {
    const a = G.erzeuge('fallen_mix', seed);
    const md = a.inhalt.map((b) => b.md || '').join(' ');
    const m = /Schülerlösung: (?:`([^`]+)`|(−?\d+))/.exec(md);
    assert.ok(m, md);
    if (norm(m[1] ?? m[2]) === norm(a.loesung.ergebnis[0])) falsch.push(`${seed}: ${md.slice(0, 120)}`);
  }
  assert.deepEqual(falsch, []);
});

test('Trainingsplatz Welt 6: drei Generatoren (eves_uhrwerk, zeitplan, fallen_mix)', async () => {
  const { s } = await H.szenario();
  assert.deepEqual((await s.get('/api/training/6')).body.generatoren.map((g) => g.key), ['eves_uhrwerk', 'zeitplan', 'fallen_mix']);
});
