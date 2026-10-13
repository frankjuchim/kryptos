'use strict';
// Gast-Demo seed/gast/demo.json (Plan M5 Task 99, Delta §12): eigene Daten, nie aus Welten, Akten, Bossen, Warm-up oder
// Videos. Prüfling: Eingaben, Geheimtexte und Lösungen der Demo (nur Buchstaben, ≥ 6) dürfen in keinem Text des Korpus
// (Seeds W0–W6, Warm-up, Materialquellen, Videos) vorkommen – auch nicht ohne Leerzeichen (Fünfergruppen).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');

const R = S.WURZEL;
const DEMO = path.join(R, 'seed', 'gast', 'demo.json');
const norm = (t) => String(t).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const dateien = (ordner, re) => (fs.existsSync(ordner) ? fs.readdirSync(ordner).filter((f) => re.test(f)).map((f) => path.join(ordner, f)) : []);

/** Korpus ohne die Gast-Demo: je Datei der Text nur aus Buchstaben (Leerzeichen und Fünfergruppen fallen weg). */
function korpus() {
  const liste = [...dateien(path.join(R, 'seed', 'welten'), /\.json$/), ...dateien(path.join(R, 'seed', 'warmup'), /\.json$/), path.join(R, 'quellen', 'pruefwerte', 'videos.json')];
  const mat = path.join(R, 'quellen', 'material');
  for (const w of fs.readdirSync(mat).filter((x) => /^W\d$/.test(x))) liste.push(...dateien(path.join(mat, w), /\.json$/));
  const vid = path.join(R, 'materialien', 'Videos');
  for (const v of fs.readdirSync(vid)) if (fs.existsSync(path.join(vid, v, 'video.json'))) liste.push(path.join(vid, v, 'video.json'));
  return liste.filter((p) => fs.existsSync(p)).map((p) => ({ p, text: norm(S.texte(json(p))).replace(/[^a-z]/g, '') }));
}

/** Eingaben, Geheimtexte (Blöcke haeufigkeit/text), Lösungstexte und Schlüssel der Demo. */
function pruefling(demo) {
  const out = new Set();
  const neu = (t) => {
    const n = norm(t).replace(/[^a-z]/g, '');
    if (n.length >= 6) out.add(n);
  };
  const lauf = (x, schluessel) => {
    if (Array.isArray(x)) return x.forEach((y) => lauf(y, schluessel));
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === 'string' && ['eingabe', 'text', 'klartext', 'schluessel'].includes(k) && !(schluessel === 'inhalt' && k === 'text')) neu(v);
      else if (typeof v === 'object') lauf(v, k === 'inhalt' ? 'inhalt' : schluessel);
    }
  };
  for (const a of demo.aufgaben) {
    lauf(a.interaktion);
    lauf(a.loesung);
    for (const b of a.inhalt || []) if (b.t === 'haeufigkeit' && typeof b.text === 'string') neu(b.text);
  }
  return [...out];
}

test('seed/gast/demo.json: Delta §12 (sechs Aufgaben W8-L1-01 … 06), Inhalt wie die validierte e2e-Vorlage', () => {
  const d = json(DEMO);
  const vorlage = json(path.join(R, 'test', 'e2e', 'seed', 'gast', 'demo.json'));
  assert.equal(d.welt, 8);
  assert.equal(d.titel, 'Probe-Akte');
  assert.deepEqual(d.aufgaben.map((a) => a.id), ['W8-L1-01', 'W8-L1-02', 'W8-L1-03', 'W8-L1-04', 'W8-L1-05', 'W8-L1-06']);
  assert.deepEqual({ ...d, _hinweis: null }, { ...vorlage, _hinweis: null }, 'Kopie der e2e-Vorlage (nur _hinweis angepasst)');
  assert.match(d._hinweis, /Gast-Demo \(Delta §12\)/);
  assert.match(d._hinweis, /nie aus Welten, Akten, Bossen oder\s+Videos/);
});

test('Gast-Demo: keine Eingabe, kein Geheimtext und keine Lösung kommt im Korpus vor (Welten, Akten, Bossen, Warm-up, Videos)', () => {
  const K = korpus();
  assert.ok(K.length >= 30, `nur ${K.length} Dateien im Korpus`);
  const p = pruefling(json(DEMO));
  for (const w of ['nordlicht', 'sonnenuhr', 'uvykspjoa', 'lotgetnhx']) assert.ok(p.includes(w), `${w} fehlt im Prüfling`);
  const treffer = p.flatMap((w) => K.filter((k) => k.text.includes(w)).map((k) => `${w} in ${path.relative(R, k.p)}`));
  assert.deepEqual(treffer, []);
});
