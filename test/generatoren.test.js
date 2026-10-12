'use strict';
// Generatoren (Trainingsplatz): deterministisch, Lösung korrekt (unabhängig nachgerechnet), Grenzfälle, Tageslimit.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/content/generators');
const C = require('../src/content/checker');
const Baum = require('../public/static/js/shared/baum');
const { validiereWelt } = require('../src/content/validator');
const H = require('./helpers');

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

function codeZeilen(a) {
  return a.inhalt.find((b) => b.t === 'code').code.split('\n');
}

test('Alle Generatoren: deterministisch, Musterantwort richtig, Format gültig (Validator)', () => {
  for (const key of Object.keys(G.GENERATOREN)) {
    const aufgaben = [];
    for (const seed of SEEDS.slice(0, 60)) {
      const a = G.erzeuge(key, seed);
      assert.deepEqual(G.erzeuge(key, seed), a, `${key} deterministisch`);
      assert.equal(C.pruefeAufgabe(a, C.musterantwortAufgabe(a)).ok, true, `${key}/${seed}`);
      aufgaben.push({ ...a, id: `W7-L1-${String(aufgaben.length + 1).padStart(2, '0')}` });
    }
    const v = validiereWelt({ version: 2, welt: 7, titel: 'Gen', farbe: '#123456', levels: [{ id: 'W7-L1', titel: 'x', aufgaben: aufgaben.map((a) => a.id) }], aufgaben }, { datei: key });
    assert.deepEqual(v.fehler, [], key);
  }
  assert.notDeepEqual(G.erzeuge('stapel', 1), G.erzeuge('stapel', 2));
});

test('Stapel/Schlange: Simulation der Befehlsfolge ergibt die Lösung; nie pop auf leerem Stapel', () => {
  for (const art of ['stapel', 'schlange']) {
    for (const seed of SEEDS) {
      const a = G.erzeuge(art, seed);
      const inhalt = [...a.interaktion.start];
      const vars = {};
      for (const z of codeZeilen(a)) {
        let m;
        if ((m = /^s\.push\((\d+)\);$/.exec(z)) || (m = /^q\.enqueue\((\d+)\);$/.exec(z))) inhalt.push(Number(m[1]));
        else if ((m = /^s\.push\(x \+ 1\);$/.exec(z))) inhalt.push(vars.x + 1);
        else if ((m = /^q\.enqueue\(y \* 2\);$/.exec(z))) inhalt.push(vars.y * 2);
        else if ((m = /^(?:int )?([xy]) = \(Integer\) ([sq])\.(pop|dequeue)\(\);$/.exec(z))) {
          assert.ok(inhalt.length > 0, 'kein Zugriff auf leere Struktur');
          vars[m[1]] = m[2] === 's' ? inhalt.pop() : inhalt.shift();
        } else if (z === 's.pop();') {
          assert.ok(inhalt.length > 0);
          inhalt.pop();
        } else if (z === 'q.dequeue();') {
          assert.ok(inhalt.length > 0);
          inhalt.shift();
        } else assert.fail('unbekannte Zeile: ' + z);
      }
      assert.deepEqual(a.loesung.inhalt, inhalt.map(String), `${art}/${seed}`);
      // Variablen werden nur einmal deklariert
      assert.ok(codeZeilen(a).filter((z) => z.startsWith('int ')).length <= 1);
    }
  }
});

test('Dynamische Reihung: nur gültige Indizes, Lösung stimmt', () => {
  for (const seed of SEEDS) {
    const a = G.erzeuge('dynarray', seed);
    const d = [...a.interaktion.start];
    for (const z of codeZeilen(a)) {
      let m;
      if ((m = /^d\.append\((\d+)\);$/.exec(z))) d.push(Number(m[1]));
      else if ((m = /^d\.insertAt\((\d+), (\d+)\);$/.exec(z))) {
        assert.ok(Number(m[1]) <= d.length);
        d.splice(Number(m[1]), 0, Number(m[2]));
      } else if ((m = /^d\.setItem\((\d+), (\d+)\);$/.exec(z))) {
        assert.ok(Number(m[1]) < d.length);
        d[Number(m[1])] = Number(m[2]);
      } else if ((m = /^d\.delete\((\d+)\);$/.exec(z))) {
        assert.ok(Number(m[1]) < d.length);
        d.splice(Number(m[1]), 1);
      } else assert.fail(z);
    }
    assert.deepEqual(a.loesung.inhalt, d.map(String));
  }
});

test('BST einfügen: Ergebnis ist Suchbaum mit allen Werten; Inorder sortiert', () => {
  for (const seed of SEEDS) {
    const a = G.erzeuge('bst', seed);
    const t = Baum.parse(a.loesung.baum);
    const start = Baum.parse(a.interaktion.start);
    const inorder = Baum.inorder(t).map((p) => Number(Baum.knotenAn(t, p).v));
    assert.deepEqual(inorder, [...inorder].sort((x, y) => x - y));
    assert.equal(Baum.anzahl(t), Baum.anzahl(start) + a.interaktion.werte.length);
  }
  // Grenzfall: leerer Startbaum kommt vor
  assert.ok(SEEDS.some((s) => G.erzeuge('bst', s).interaktion.start === '-'));
});

test('Traversierung: Folge besucht jeden Knoten genau einmal in der richtigen Ordnung', () => {
  const gesehen = new Set();
  for (const seed of SEEDS) {
    const a = G.erzeuge('traversierung', seed);
    const t = Baum.parse(a.interaktion.baum);
    const art = /Preorder|Inorder|Postorder|Levelorder/.exec(a.titel)[0];
    gesehen.add(art);
    assert.equal(a.loesung.folge.length, Baum.anzahl(t));
    assert.equal(new Set(a.loesung.folge).size, Baum.anzahl(t));
    if (art === 'Inorder') {
      const w = a.loesung.folge.map((p) => Number(Baum.knotenAn(t, p).v));
      assert.deepEqual(w, [...w].sort((x, y) => x - y));
    }
    if (art === 'Preorder') assert.equal(a.loesung.folge[0], '');
    if (art === 'Postorder') assert.equal(a.loesung.folge[a.loesung.folge.length - 1], '');
  }
  assert.equal(gesehen.size, 4);
  // Levelorder an festem Baum
  const t = Baum.parse('8(3(1,6),10(-,14))');
  assert.deepEqual(Baum.levelorder(t), ['', 'L', 'R', 'LL', 'LR', 'RR']);
});

test('Sortieren (ein Durchlauf): Tausche entsprechen dem Verfahren; Ergebnis passt', () => {
  for (const verfahren of ['bubble', 'selection', 'insertion']) {
    for (const seed of SEEDS.slice(0, 100)) {
      const a = G.erzeuge(verfahren, seed);
      const auf = /aufsteigend/.test(a.inhalt[0].md);
      const d = Number(/(\d)\. Durchlauf/.exec(a.titel)[1]);
      const r = [...a.interaktion.start];
      const vor = (x, y) => (auf ? x < y : x > y);
      const t = [];
      const n = r.length;
      if (verfahren === 'bubble') {
        for (let j = 0; j < n - d; j++) if (vor(r[j + 1], r[j])) {
          [r[j], r[j + 1]] = [r[j + 1], r[j]];
          t.push([j, j + 1]);
        }
      } else if (verfahren === 'selection') {
        let b = d - 1;
        for (let j = d; j < n; j++) if (vor(r[j], r[b])) b = j;
        if (b !== d - 1) t.push([d - 1, b]);
      } else {
        for (let j = d; j > 0 && vor(r[j], r[j - 1]); j--) {
          [r[j], r[j - 1]] = [r[j - 1], r[j]];
          t.push([j - 1, j]);
        }
      }
      assert.deepEqual(a.loesung.tausche, t, `${verfahren}/${seed}`);
      assert.ok(a.loesung.tausche.length > 0, 'mindestens ein Tausch');
      assert.equal(a.interaktion.fertigKnopf, true);
    }
  }
});

test('Binäre Suche: mitte = (lo + hi) / 2 ganzzahlig; gefunden oder lo > hi', () => {
  let gefunden = 0;
  let nicht = 0;
  for (const seed of SEEDS) {
    const a = G.erzeuge('binsuche', seed);
    const r = a.interaktion.start;
    const x = Number(/nach \*\*(\d+)\*\*/.exec(a.inhalt[0].md)[1]);
    let lo = 0;
    let hi = r.length - 1;
    const f = [];
    while (lo <= hi) {
      const m = Math.floor((lo + hi) / 2);
      f.push(m);
      if (r[m] === x) break;
      if (r[m] < x) lo = m + 1;
      else hi = m - 1;
    }
    assert.deepEqual(a.loesung.folge, f);
    if (r.includes(x)) gefunden++;
    else nicht++;
    assert.ok(f.length <= Math.ceil(Math.log2(r.length + 1)));
  }
  assert.ok(gefunden > 0 && nicht > 0, 'beide Fälle kommen vor');
});

test('Ausdruck → Typ und Wert: ganzzahlige Division, Casts, Verkettung, char-Arithmetik', () => {
  const typen = new Set();
  for (const seed of SEEDS) {
    const a = G.erzeuge('ausdruck', seed);
    const e = a.inhalt[1].code;
    const typ = a.loesung.typ[0];
    typen.add(typ);
    const wert = a.loesung.wert[0];
    let m;
    if ((m = /^(\d+) \/ (\d+)$/.exec(e))) assert.equal(wert, String(Math.trunc(m[1] / m[2])));
    if ((m = /^(\d+) % (\d+)$/.exec(e))) assert.equal(wert, String(m[1] % m[2]));
    if ((m = /^\(double\) \((\d+) \/ (\d+)\)$/.exec(e))) assert.equal(Number(wert), Math.trunc(m[1] / m[2]));
    if ((m = /^"Gold" \+ (\d+) \+ (\d+)$/.exec(e))) assert.equal(wert, `"Gold${m[1]}${m[2]}"`);
    if ((m = /^(\d+) \+ (\d+) \+ "Gold"$/.exec(e))) assert.equal(wert, `"${Number(m[1]) + Number(m[2])}Gold"`);
    if ((m = /^'(.)' \+ (\d+)$/.exec(e))) assert.equal(wert, String(m[1].charCodeAt(0) + Number(m[2])));
    if ((m = /^\(char\) \('(.)' \+ (\d+)\)$/.exec(e))) assert.equal(wert, `'${String.fromCharCode(m[1].charCodeAt(0) + Number(m[2]))}'`);
    if ((m = /^\(int\) (\d+)\.(\d+)$/.exec(e))) assert.equal(wert, m[1]);
    // Typfeld ist eine Auswahl
    assert.equal(a.interaktion.felder.typ.typ, 'auswahl');
    // Zeichenketten: mit und ohne Anführungszeichen akzeptiert
    if (typ === 'String') assert.equal(C.pruefeAufgabe(a, { typ: 'String', wert: wert.slice(1, -1) }).ok, true);
    if (typ === 'double') assert.equal(C.pruefeAufgabe(a, { typ: 'double', wert: wert.replace('.', ',') }).ok, true);
  }
  assert.deepEqual([...typen].sort(), ['String', 'boolean', 'char', 'double', 'int']);
});

test('Trainingsplatz-API: 1 Punkt je gelöster Aufgabe, max. 30 pro Tag, neuer Tag → wieder Punkte', async () => {
  const uhr = H.uhr(Date.parse('2026-10-08T10:00:00Z'));
  let seed = 1;
  const { s } = await H.szenario({ now: uhr, trainingSeed: () => seed++ });
  const info = (await s.get('/api/training/4')).body;
  assert.deepEqual(info.generatoren.map((g) => g.key), ['stapel', 'schlange', 'dynarray']);
  assert.equal((await s.get('/api/training/1')).status, 404, 'Welt 1 hat keinen Trainingsplatz');
  let summe = 0;
  for (let i = 0; i < 32; i++) {
    const s0 = seed;
    const t = (await s.post('/api/training/4/neu').send({ generator: 'stapel' })).body;
    assert.equal(t.status, 'offen');
    assert.ok(!JSON.stringify(t).includes('"loesung"'));
    const a = G.erzeuge('stapel', s0);
    const r = (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: a.loesung.inhalt })).body;
    assert.equal(r.ok, true, JSON.stringify(r));
    summe += r.punkteErhalten;
  }
  assert.equal(summe, 30, 'Tageslimit');
  uhr.vor(24 * 3600 * 1000);
  const s0 = seed;
  const t = (await s.post('/api/training/4/neu').send({})).body;
  const a = G.erzeuge(t.generator, s0);
  const r = (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: C.musterantwortAufgabe(a) })).body;
  assert.equal(r.punkteErhalten, 1, 'neuer Tag');
  const p = (await s.get('/api/profil')).body;
  assert.equal(p.punkte.training, 31);
  // fremde Trainingsaufgabe
  const fremd = await s.get('/api/training/aufgabe/999999');
  assert.equal(fremd.status, 404);
});

test('Trainingsplatz: Aufdecken zeigt Lösung, danach keine Punkte', async () => {
  let seed = 100;
  const { s } = await H.szenario({ trainingSeed: () => seed++ });
  const t = (await s.post('/api/training/2/neu').send({ generator: 'binsuche' })).body;
  const d = (await s.post(`/api/training/aufgabe/${t.id}/aufdecken`).send({})).body;
  assert.equal(d.status, 'angesehen');
  assert.ok(d.loesung.folge.length > 0);
  const r = (await s.post(`/api/training/aufgabe/${t.id}/pruefen`).send({ antwort: d.loesung.folge })).body;
  assert.equal(r.punkteErhalten, 0);
});
