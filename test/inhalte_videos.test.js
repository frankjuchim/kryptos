'use strict';
// Video-Beispiele kommen in keiner Lab-, Boss-, Warm-up- oder Gast-Aufgabe vor (Design §11 „Beispiele eigens für
// Videos“; Plan M5 Task 73, Review Focus 6). Geprüft werden die Texte (≥ 6 Buchstaben) aus Eingaben und Ergebnissen
// von quellen/pruefwerte/videos.json gegen chiffre-Eingaben/-Lösungen, zuordnung-Texte, Texte in Backticks und
// haeufigkeit.text aller Seeds (seed/welten, seed/warmup, seed/gast). Ohne Seeds trivial grün.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('./hilfen_spec');

const VIDEOS = require('../quellen/pruefwerte/videos.json').werte;

/** Bekannte, von der Lehrkraft zu entscheidende Überschneidungen */
const BEKANNT = []; // W2-L1-06 nutzt seit der M5-Inhaltsprüfung eigene Wörter (nachtwache nur noch in Akte, Folie, Papier-Boss)
/** Video-Texte, die kein Beispiel im Sinne von Design §11 sind (Plattformname; Alphabete und Folgen wie EEEEEEE stehen in jedem Material) */
const KEIN_BEISPIEL = new Set(['KRYPTOS']);

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const istAlphabet = (t) => t.length === 26 && (ALPHABET + ALPHABET).includes(t);
const istBits = (s) => /^[01 ]+$/.test(s);

const VIDEO_WOERTER = [
  ...new Set(
    VIDEOS.flatMap((v) => [...(Array.isArray(v.eingabe) ? v.eingabe : []), v.erwartet])
      .filter((x) => typeof x === 'string' && !istBits(x))
      .map(S.normalisiert)
      .map((t) => t.replace(/[0-9]/g, ''))
      .filter((t) => t.length >= 6 && new Set(t).size >= 3 && !istAlphabet(t) && !KEIN_BEISPIEL.has(t))
  )
];

/** [{ id, text }] – prüfbare Texte einer Aufgabe bzw. Warm-up-Karte */
function kandidaten(id, obj) {
  const out = [];
  (function lauf(x) {
    if (typeof x === 'string') {
      for (const m of x.matchAll(/`([^`]+)`/g)) out.push(m[1]);
      return;
    }
    if (Array.isArray(x)) return x.forEach(lauf);
    if (!x || typeof x !== 'object') return;
    if (x.kind === 'chiffre' && typeof x.eingabe === 'string') out.push(x.eingabe);
    if (x.kind === 'zuordnung' && typeof x.geheimtext === 'string') out.push(x.geheimtext);
    if (x.t === 'haeufigkeit' && typeof x.text === 'string') out.push(x.text);
    Object.values(x).forEach(lauf);
  })(obj);
  for (const lo of [].concat(obj.loesung || [])) {
    if (!lo || typeof lo !== 'object') continue;
    for (const k of ['text', 'klartext']) if (typeof lo[k] === 'string') out.push(lo[k]);
    for (const alt of lo.alternativen || []) if (typeof alt === 'string') out.push(alt);
  }
  return out.map((text) => ({ id, text: S.normalisiert(text) }));
}

function seedDateien() {
  const liste = [];
  const ordner = (o) => {
    const p = path.join(S.WURZEL, 'seed', o);
    return fs.existsSync(p) ? fs.readdirSync(p).filter((d) => d.endsWith('.json')).map((d) => path.join(p, d)) : [];
  };
  for (const d of [...ordner('welten'), ...ordner('warmup'), ...ordner('gast')]) liste.push(d);
  return liste;
}

test('Video-Abgleich: Wortliste aus videos.json (≥ 6 Buchstaben) enthält die bekannten Video-Beispiele', () => {
  for (const w of ['TREFFPUNKTAMBRUNNEN', 'GEHEIMBOTSCHAFT', 'NACHTWACHE']) assert.ok(VIDEO_WOERTER.includes(w), w);
  assert.ok(!VIDEO_WOERTER.includes(ALPHABET), 'Alphabet ist kein Beispiel');
  const probe = kandidaten('X', { inhalt: [{ t: 'text', md: 'Entschlüssele `GTVAM PTVAX`.' }], interaktion: { kind: 'chiffre', eingabe: 'nachtwache' }, loesung: { text: 'GTVAMPTVAX' } });
  assert.ok(probe.some((k) => k.text.includes('NACHTWACHE')));
});

test('Video-Beispiele kommen in keinem Seed vor (Ausnahme: BEKANNT)', () => {
  const funde = [];
  for (const datei of seedDateien()) {
    let d;
    try {
      d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    } catch {
      continue; // ungültiges JSON meldet der Validator
    }
    const eintraege = [...(Array.isArray(d.aufgaben) ? d.aufgaben : []), ...(Array.isArray(d.karten) ? d.karten : [])];
    for (const e of eintraege) {
      for (const k of kandidaten(e.id, e)) {
        for (const wort of VIDEO_WOERTER) {
          if (!k.text.includes(wort)) continue;
          if (BEKANNT.some((b) => S.normalisiert(b.wort) === wort && b.aufgabe === e.id)) continue;
          funde.push(`${path.relative(S.WURZEL, datei)} › ${e.id}: ${wort}`);
        }
      }
    }
  }
  assert.deepEqual([...new Set(funde)], [], 'Video-Beispiele in Seeds');
});
