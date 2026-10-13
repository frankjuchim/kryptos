'use strict';
// Kryptolabor: Signatur- & Zertifikats-Simulator (W5 §9.2, Plan M6 Task 124, E69, E90). Eigene Beispielwerte
// (Orchestrator, offene Entscheidung 6): Schlüssel, Nachricht, Kollisionspaar und DH-Zahlen kommen in keinem Material vor.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { oeffne, Krypto: K } = require('./hilfen_labor');

const manip = (w, art) => w.k.klick(w.k.eins(w.flaeche, `button.manipulation[data-art="${art}"]`));
const WURZEL = path.join(__dirname, '..');
// eigene Werte des Werkzeugs (= BEISPIEL in labor/signatur.js)
const ALICE = { N: 85, e: 7, d: 55 };
const NACHRICHT = 'die laterne brennt';
const KOLLISION = ['bringe zwei krapfen', 'bringe zwanzig krapfen'];
const SCHLUESSEL = { alice: [5, 17, 7], bob: [7, 17, 5], mallory: [3, 23, 3], trent: [5, 19, 5] };
const DH = { p: 43, g: 3, a: 8, b: 13, m: 5 };

test('Signatur: KH 22, Signatur und Prüfung gültig – Werte aus der Bibliothek', () => {
  const w = oeffne('signatur');
  const z = w.zustand();
  const h = K.hashZahl(NACHRICHT, { verfahren: 'kh', modul: ALICE.N });
  assert.equal(h, 22);
  assert.deepEqual([z.h1, z.signatur, z.h2, z.gueltig], [h, K.rsa.signieren(h, ALICE.d, ALICE.N), K.rsa.pruefen(K.rsa.signieren(h, ALICE.d, ALICE.N), ALICE.e, ALICE.N), true]);
});

test('Mallorys Eingriffe: ungültig bei Nachricht/Signatur/Hash/eigener Signatur, gültig bei Schlüsselserver, Kollision, Replay', () => {
  const erwartet = { nachricht: [false, /Integrität verletzt/], signatur: [false, /passt nicht zur Nachricht/], 'hash-statt-signatur': [false, /Ein Hashwert ist keine Signatur/], 'mallory-signiert': [false, /kann Alices Signatur nicht erzeugen/], schluesselserver: [true, /falschen Schlüssel/], kollision: [true, /Kollisionsresistenz/], replay: [true, /Wiederholung/] };
  for (const [art, [gueltig, text]] of Object.entries(erwartet)) {
    const w = oeffne('signatur');
    manip(w, art);
    assert.equal(w.zustand().gueltig, gueltig, art);
    assert.match(w.zustand().lerntext, text, art);
  }
  const w = oeffne('signatur');
  manip(w, 'nachricht');
  // E69: Mallory ändert den ersten Buchstaben um +1
  assert.deepEqual([w.zustand().h1, w.zustand().h2], [K.hashZahl('eie laterne brennt', { verfahren: 'kh', modul: ALICE.N }), 22]);
  const k = oeffne('signatur');
  manip(k, 'kollision');
  assert.equal(K.kryptosHash(KOLLISION[0]).wert, K.kryptosHash(KOLLISION[1]).wert);
  assert.match(k.text('.kanal'), /bringe zwanzig krapfen/);
});

test('SHA-256-Modus: Kollision deaktiviert, alle Eingriffe außer Schlüsselserver und Replay ungültig', () => {
  const w = oeffne('signatur');
  w.k.klick(w.k.eins(w.flaeche, '.hash-wahl [data-hash="sha256"]'));
  assert.equal(w.k.eins(w.flaeche, 'button.manipulation[data-art="kollision"]').disabled, true);
  assert.equal(w.zustand().h1, K.hashZahl(NACHRICHT, { verfahren: 'sha256', modul: ALICE.N }));
  for (const [art, gueltig] of [['nachricht', false], ['signatur', false], ['hash-statt-signatur', false], ['mallory-signiert', false], ['schluesselserver', true], ['replay', true]]) {
    const v = oeffne('signatur');
    v.k.klick(v.k.eins(v.flaeche, '.hash-wahl [data-hash="sha256"]'));
    manip(v, art);
    assert.equal(v.zustand().gueltig, gueltig, art);
  }
});

test('Zertifikat: grün; Schlüssel getauscht → Signatur ✗; Datum, Sperrliste, Kette, Name; Wurzel nur für Lehrkraft', () => {
  const w = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' } });
  assert.equal(w.zustand().ampel, 'gruen');
  assert.match(w.text('.ampel'), /grün/);
  manip(w, 'schluessel-tauschen');
  assert.equal(w.zustand().pruefungen.find((p) => p.art === 'signatur').ok, false);
  assert.match(w.text('.ampel'), /rot/);
  for (const [art, pruefung] of [['datum', 'gueltigkeit'], ['sperren', 'sperrliste'], ['selbst-signiert', 'kette'], ['anderer-name', 'name']]) {
    const v = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' } });
    manip(v, art);
    assert.equal(v.zustand().pruefungen.find((p) => p.art === pruefung).ok, false, art);
    assert.equal(v.zustand().ampel, 'rot');
  }
  assert.equal(w.k.alle(w.flaeche, '[data-art="wurzel-einschleusen"]').length, 0);
  const l = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' }, umgebung: { rolle: 'lehrkraft' } });
  manip(l, 'selbst-signiert');
  manip(l, 'wurzel-einschleusen');
  assert.equal(l.zustand().ampel, 'gruen');
  assert.match(l.zustand().lerntext, /Vertrauensanker/);
});

test('Zertifikat: Datum vorstellen per Regler (E90), kein Zugriff auf die Systemuhr', () => {
  const w = oeffne('signatur', { voreinstellung: { szene: 'zertifikat' } });
  assert.match(w.text('.zert-datum'), /1\. Juni 2026/);
  const regler = w.k.eins(w.flaeche, '.labor-zahl [role="spinbutton"]');
  w.k.taste(regler, 'End');
  assert.equal(w.zustand().pruefungen.find((p) => p.art === 'gueltigkeit').ok, false);
  w.k.taste(regler, 'Home');
  assert.equal(w.zustand().ampel, 'gruen');
  const src = fs.readFileSync(path.join(WURZEL, 'public/static/js/krypto/labor/signatur.js'), 'utf8');
  assert.doesNotMatch(src, /new Date|Date\.now/);
});

test('MitM mit Diffie-Hellman: Werte aus Krypto.dh, Zertifikate an zeigt den scheiternden Schritt', () => {
  const w = oeffne('signatur', { voreinstellung: { szene: 'mitm' } });
  assert.match(w.text('.mitm-ablauf'), /①/);
  w.k.klick(w.k.eins(w.flaeche, 'input.mitm-dh'));
  const m = w.zustand().mitm;
  const { p, g, a, b, m: mm } = DH;
  assert.deepEqual([m.A, m.B, m.M, m.kAlice, m.kBob, m.ohneMallory], [K.dh.oeffentlich(g, a, p), K.dh.oeffentlich(g, b, p), K.dh.oeffentlich(g, mm, p), K.dh.gemeinsam(K.dh.oeffentlich(g, mm, p), a, p), K.dh.gemeinsam(K.dh.oeffentlich(g, mm, p), b, p), K.dh.gemeinsam(K.dh.oeffentlich(g, b, p), a, p)]);
  assert.deepEqual([m.A, m.B, m.M, m.kAlice, m.kBob, m.ohneMallory], [25, 12, 28, 24, 34, 14]);
  w.k.klick(w.k.eins(w.flaeche, 'input.mitm-zertifikate'));
  assert.match(w.text('.mitm-scheitert'), /Schritt ③/);
});

test('Beispielwerte des Simulators kommen in keinem Material vor (Prüfwerte, Materialquellen, Seeds)', () => {
  const N = Object.values(SCHLUESSEL).map(([p, q]) => p * q);
  const norm = (t) => K.klein(K.nurBuchstaben(String(t)));
  const texte = new Set([NACHRICHT, ...KOLLISION].map(norm));
  const ordner = path.join(WURZEL, 'quellen', 'pruefwerte');
  for (const d of fs.readdirSync(ordner).filter((x) => x.endsWith('.json'))) {
    for (const e of JSON.parse(fs.readFileSync(path.join(ordner, d), 'utf8')).werte) {
      const ort = `${d} ${e.id}`;
      if (e.verfahren === 'rsa.schluessel') assert.ok(!N.includes(e.eingabe[0] * e.eingabe[1]), ort);
      if (/^(modpow|rsa\.)/.test(e.verfahren) && e.verfahren !== 'rsa.schluessel') assert.ok(!N.includes(e.eingabe[2]), ort);
      if (/^dh\./.test(e.verfahren)) assert.notEqual(e.eingabe[2], DH.p, ort);
      if (/kryptosHash|hashZahl|sha256|pruefsumme/.test(e.verfahren)) assert.ok(!texte.has(norm(e.eingabe[0])), ort);
    }
  }
  // Materialquellen und Seeds: weder die Texte noch die Schlüsselpaare
  const dateien = [];
  const sammle = (o) => { for (const x of fs.readdirSync(o, { withFileTypes: true })) { const p = path.join(o, x.name); if (x.isDirectory()) sammle(p); else if (x.name.endsWith('.json')) dateien.push(p); } };
  sammle(path.join(WURZEL, 'quellen', 'material'));
  sammle(path.join(WURZEL, 'seed'));
  const paare = Object.entries(SCHLUESSEL).flatMap(([, [p, q, e]]) => { const k = K.rsa.schluessel(p, q, e); return [new RegExp(`\\(\\s*${k.N}\\s*[,;|]\\s*${k.e}\\s*\\)`), new RegExp(`\\(\\s*${k.N}\\s*[,;|]\\s*${k.d}\\s*\\)`)]; });
  for (const d of dateien) {
    const inhalt = fs.readFileSync(d, 'utf8');
    const klein = norm(inhalt);
    for (const t of texte) assert.ok(!klein.includes(t), `${d}: ${t}`);
    for (const r of paare) assert.doesNotMatch(inhalt, r, d);
    assert.doesNotMatch(inhalt, /p\s*=\s*43\b/, d);
  }
});

const python = spawnSync('python3', ['--version'], { encoding: 'utf8' });
const ohnePython = python.error || python.status !== 0 ? 'python3 fehlt' : false;
test('Beispielwerte des Simulators: Python-Zwilling rechnet nach (pruefwerte.py), 0 Abweichungen und 0 Überschneidungen', { skip: ohnePython }, () => {
  const ordner = fs.mkdtempSync(path.join(os.tmpdir(), 'pruefwerte-signatur-'));
  try {
    const quelle = path.join(WURZEL, 'quellen', 'pruefwerte');
    for (const d of fs.readdirSync(quelle)) fs.copyFileSync(path.join(quelle, d), path.join(ordner, d));
    const werte = [];
    const eintrag = (id, verfahren, eingabe, erwartet, optionen, feld) => werte.push({ id: `LS-${id}`, ort: 'Kryptolabor Signatur-Simulator (Beispielwerte)', art: 'spec', verfahren, eingabe, ...(optionen ? { optionen } : {}), ...(feld ? { feld } : {}), erwartet });
    for (const [n, [p, q, e]] of Object.entries(SCHLUESSEL)) eintrag(`s-${n}`, 'rsa.schluessel', [p, q, e], K.rsa.schluessel(p, q, e));
    const h = K.hashZahl(NACHRICHT, { verfahren: 'kh', modul: ALICE.N });
    eintrag('h', 'hashZahl', [NACHRICHT], h, { verfahren: 'kh', modul: ALICE.N });
    eintrag('h-sha', 'hashZahl', [NACHRICHT], K.hashZahl(NACHRICHT, { verfahren: 'sha256', modul: ALICE.N }), { verfahren: 'sha256', modul: ALICE.N });
    eintrag('sig', 'rsa.signieren', [h, ALICE.d, ALICE.N], K.rsa.signieren(h, ALICE.d, ALICE.N));
    eintrag('k0', 'kryptosHash', [KOLLISION[0]], 23, null, 'wert');
    eintrag('k1', 'kryptosHash', [KOLLISION[1]], 23, null, 'wert');
    const { p, g, a, b, m } = DH;
    eintrag('A', 'dh.oeffentlich', [g, a, p], 25);
    eintrag('B', 'dh.oeffentlich', [g, b, p], 12);
    eintrag('M', 'dh.oeffentlich', [g, m, p], 28);
    eintrag('kA', 'dh.gemeinsam', [28, a, p], 24);
    eintrag('kB', 'dh.gemeinsam', [28, b, p], 34);
    eintrag('ohne', 'dh.gemeinsam', [12, a, p], 14);
    fs.writeFileSync(path.join(ordner, 'labor_signatur.json'), JSON.stringify({ beschreibung: 'Test', werte }));
    const r = spawnSync('python3', ['-I', path.join(WURZEL, 'werkzeuge/krypto/pruefwerte.py'), '--ordner', ordner], { cwd: WURZEL, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /0 Abweichungen, 0 Überschneidungen/);
    assert.doesNotMatch(r.stdout, /HINWEIS.*(laterne|krapfen)/i);
  } finally {
    fs.rmSync(ordner, { recursive: true, force: true });
  }
});
