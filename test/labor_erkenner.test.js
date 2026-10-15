'use strict';
// Erkenner für Aufgabenwerte (Plan M11 Task 242, E210–E213): Signaturen, Kennungen, Verlauf, Daten aus dem Generator.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const E = require('../public/static/js/krypto/labor/erkenner.js');
const P = require('../werkzeuge/krypto/prueflinge');
const Krypto = require('../public/static/js/shared/krypto.js');
const DATEN = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor', 'erkenner');

/** Daten-Dateien in den Erkenner laden (wie im Browser über <script>) */
function ladeDaten() {
  for (const d of fs.readdirSync(DATEN).filter((f) => f.endsWith('.js'))) new Function('KRErkenner', fs.readFileSync(path.join(DATEN, d), 'utf8'))(E);
}
ladeDaten();
const S = { rolle: 'schueler' };

test('signaturen_text_fenster', () => {
  const s = E.signaturen('skytale.skytale', { texte: ['numra bouck'] });
  for (const x of ['t:NUMRA', 't:UMRAB', 't:BOUCK']) assert.ok(s.includes(x), x);
  assert.ok(!s.includes('t:NUMRABOUCK'));
  const p = E.signaturen('scheibe.text', { texte: ['imotq'], schluessel: ['k=12'] });
  assert.ok(p.includes('t:IMOTQ|s:K=12'), 'Schlüssel normalisiert (GROSS)');
});

test('kurze_angabe_nur_als_token', () => {
  E.daten('testwerkzeug', { x: [E.kennung('t:AVE')] });
  assert.equal(E.erkannt('testwerkzeug.x', { texte: ['Ave!'] }, S), true);
  assert.equal(E.erkannt('testwerkzeug.x', { texte: ['Sklave'] }, S), false);
  assert.equal(E.erkannt('testwerkzeug.x', { texte: ['hallo ave'] }, S), true, 'Wort im Text');
});

test('paar_text_schluessel', () => {
  assert.equal(E.erkannt('vigenere.verschluesseln', { texte: ['gondel'], schluessel: ['BOTE'] }, S), true);
  assert.equal(E.erkannt('vigenere.verschluesseln', { texte: ['gondel'], schluessel: ['LUNA'] }, S), false);
  assert.equal(E.erkannt('scheibe.text', { texte: ['IMOTQ'], schluessel: ['k=12'] }, S), true);
  // Klartext (klein, ≥ 5 Zeichen) allein nur als ganzer Text – ein Wort daraus in einem eigenen Text schlägt nicht an
  assert.equal(E.erkannt('vigenere.verschluesseln', { texte: ['gondelfahrt'], schluessel: ['LUNA'] }, S), false);
});

test('zahlen_teilmengen', () => {
  assert.equal(E.erkannt('rsa.rechenwerk', { zahlen: [3, 17, 5] }, S), true);
  assert.equal(E.erkannt('rsa.rechenwerk', { zahlen: [3, 5, 7] }, S), false);
  assert.equal(E.erkannt('rsa.rechenwerk', { zahlen: [17, 3, 5, 101] }, S), true, 'Teilmenge der Eingaben');
});

test('kennung_8_hex', () => {
  assert.match(E.kennung('t:IMOTQ|s:K=12'), /^[0-9a-f]{8}$/);
  assert.equal(E.kennung('t:IMOTQ'), Krypto.sha256('KR-E1|t:IMOTQ').slice(0, 8).toLowerCase());
});

test('lehrkraft_nie_erkannt', () => {
  assert.equal(E.erkannt('scheibe.text', { texte: ['IMOTQ'], schluessel: ['k=12'] }, { rolle: 'lehrkraft' }), false);
});

test('verlauf_ueber_neue_nachricht', () => {
  const v = E.verlauf();
  v.merke({ texte: ['IMOT'], schluessel: ['k=12'] });
  assert.equal(E.erkannt('scheibe.scheibe', { texte: ['IMOT'], schluessel: ['k=12'] }, S, v), false, 'noch kein ganzes Fenster');
  v.merke({ texte: ['Q'], schluessel: ['k=12'] }); // „Neue Nachricht“, dann Q
  assert.equal(E.erkannt('scheibe.scheibe', { texte: ['Q'], schluessel: ['k=12'] }, S, v), true);
  v.leeren();
  assert.equal(E.erkannt('scheibe.scheibe', { texte: ['Q'], schluessel: ['k=12'] }, S, v), false, 'Eigene Werte leeren den Verlauf');
});

test('daten_nur_kennungen', () => {
  const dateien = fs.readdirSync(DATEN).filter((f) => f.endsWith('.js'));
  assert.ok(dateien.length >= 8);
  for (const d of dateien) {
    const src = fs.readFileSync(path.join(DATEN, d), 'utf8');
    const ohneKopf = src.replace(/^\/\*[\s\S]*?\*\/\s*'use strict';\s*/, '');
    assert.match(ohneKopf, /^KRErkenner\.daten\('[a-z]+', \{/);
    const werte = [...ohneKopf.matchAll(/'([^']*)'/g)].map((m) => m[1]).slice(1);
    for (const w of werte) assert.match(w, /^[0-9a-f]{8}$/, `${d}: ${w}`);
    for (const k of [...ohneKopf.matchAll(/"([^"]*)":/g)].map((m) => m[1])) assert.match(k, /^[a-z*]+$/, `${d}: Reiter ${k}`);
  }
});

test('daten_ohne_loesungen', () => {
  // keine Kennung einer Lösungs-Signatur (Text-Fenster), die nicht zugleich in den Angaben eines Prüflings steht
  const alle = new Set();
  for (const d of fs.readdirSync(DATEN).filter((f) => f.endsWith('.js'))) for (const m of fs.readFileSync(path.join(DATEN, d), 'utf8').matchAll(/'([0-9a-f]{8})'/g)) alle.add(m[1]);
  const pl = P.prueflinge();
  const angabenFenster = new Set();
  for (const p of pl) for (const t of P.angaben(p).texte) for (const s of E.textSignaturen(t)) angabenFenster.add(s);
  const funde = [];
  for (const p of pl) {
    for (const x of p.werte.filter((w) => w.art === 'text' && P.zaehlt(w))) {
      for (const s of E.textSignaturen(x.n)) if (!angabenFenster.has(s) && alle.has(E.kennung(s))) funde.push(`${p.id}: ${s}`);
    }
  }
  assert.deepEqual(funde, []);
});

test('daten_aktuell', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'werkzeuge', 'krypto', 'erkenner_bauen.js'), '--pruefen'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

/** BEISPIEL-Werte eines Moduls (Zeichenketten im Objekt BEISPIEL) */
function beispiele() {
  const dir = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor');
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = /const BEISPIEL = (\{[\s\S]*?\n {2}\}|\{[^\n]*\});/.exec(src);
    if (!m) continue;
    // Alphabete (alle 26 Buchstaben, z. B. eine Beispiel-Zuordnung) sind keine Texte, die man eintippt
    const texte = [...m[1].matchAll(/'([^']{2,})'/g)].map((x) => x[1]).filter((t) => new Set(t.toUpperCase().replace(/[^A-Z]/g, '')).size < 26);
    out.push({ id: f.replace(/\.js$/, ''), texte });
  }
  return out;
}

test('kein_fehlalarm_bei_beispielen', () => {
  const W = require('../src/krypto/generatoren/woerter.js');
  const funk = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'funkraum', 'wettknacken.json'), 'utf8'));
  const funkTexte = [];
  (function lauf(x) { if (typeof x === 'string') funkTexte.push(x); else if (Array.isArray(x)) x.forEach(lauf); else if (x && typeof x === 'object') Object.values(x).forEach(lauf); })(funk);
  const woerter = [];
  (function lauf(x) { if (typeof x === 'string') woerter.push(x); else if (Array.isArray(x)) x.forEach(lauf); else if (x && typeof x === 'object') Object.values(x).forEach(lauf); })(W);
  const reiter = require('../src/krypto/werkzeuge').WERKZEUGE.flatMap((w) => (w.reiter.length ? w.reiter.map((r) => `${w.id}.${r}`) : [w.id])).concat(['baukasten']);
  const funde = [];
  for (const b of beispiele()) {
    for (const t of b.texte) {
      for (const wr of reiter.filter((x) => x.startsWith(`${b.id}.`) || x === b.id)) {
        if (E.erkannt(wr, { texte: [t], schluessel: b.texte.filter((s) => s !== t && /^[A-Z]+$/.test(s)) }, S)) funde.push(`${b.id} BEISPIEL „${t}“ in ${wr}`);
      }
    }
  }
  for (const t of [...funkTexte, ...woerter]) for (const wr of reiter) if (E.erkannt(wr, { texte: [t] }, S)) funde.push(`„${t}“ in ${wr}`);
  assert.deepEqual(funde, []);
});

test('groesse_je_datei', () => {
  for (const d of fs.readdirSync(DATEN)) assert.ok(fs.statSync(path.join(DATEN, d)).size <= 64 * 1024, `${d} zu groß`);
});

test('ausnahme_w0_l2_04', () => {
  assert.equal(E.erkannt('scheibe.alle', { texte: ['BLIZV INRIK VKRDK FI'] }, S), false, 'L60: Brute-Force-Liste erlaubt');
  assert.equal(E.erkannt('scheibe.alle', { texte: ['IMOTQ'] }, S), true, 'andere Aufgaben: Liste nicht verfügbar');
});
