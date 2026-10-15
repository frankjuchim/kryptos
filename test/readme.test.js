'use strict';
// README: Betriebsanleitung (Plan M9 Task 218) – Umgebungsvariablen, npm-Skripte, Portal-Eintrag durch den Superadmin.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WURZEL = path.join(__dirname, '..');
const lies = (rel) => fs.readFileSync(path.join(WURZEL, rel), 'utf8');
const README = lies('README.md');
const betrieb = (() => {
  const a = README.indexOf('## 6. Betrieb');
  const b = README.indexOf('\n## 7.', a);
  assert.ok(a > 0 && b > a, 'Abschnitt „## 6. Betrieb“');
  return README.slice(a, b);
})();

test('readme_betrieb: jede Umgebungsvariable aus ladeKonfig und dem Dockerfile steht in README §6', () => {
  const konfig = lies('src/verbund/konfig.js');
  const namen = new Set([...konfig.matchAll(/\be\.([A-Z][A-Z_]+)\b/g), ...konfig.matchAll(/pflicht\('([A-Z_]+)'\)/g)].map((m) => m[1]));
  const docker = lies('Dockerfile').replace(/\\\n/g, ' ');
  for (const zeile of docker.split('\n').filter((z) => /^ENV\s/.test(z))) for (const m of zeile.matchAll(/\b([A-Z][A-Z_]+)=/g)) namen.add(m[1]);
  for (const n of ['PLATTFORM_URL', 'PORTAL_URL', 'PORTAL_PUBLIC_KEY', 'SESSION_SECRET', 'DATA_DIR', 'TRUST_PROXY']) assert.ok(namen.has(n), `${n} im Code gefunden`);
  for (const n of namen) assert.ok(betrieb.includes(`\`${n}`), `${n} fehlt in README §6`);
  // nicht setzen
  for (const n of ['VERTRAG_VERSION', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) assert.ok(betrieb.includes(n), `${n} (nicht setzen) fehlt`);
});

test('readme_befehle: jedes npm-Skript aus package.json steht im README', () => {
  const skripte = Object.keys(JSON.parse(lies('package.json')).scripts);
  for (const s of skripte) {
    const befehl = ['start', 'test'].includes(s) ? `npm ${s}` : `npm run ${s}`;
    assert.ok(README.includes(befehl), `${befehl} fehlt im README`);
  }
});

test('readme_portal_eintrag: Schritte „Plattformen“, „/sso/ende“, „freischalten“, „vertrag_pruefen.js https://kryptos.frankjuchim.de“, „Freigabe der Lehrkraft“', () => {
  for (const s of ['Plattformen', 'https://kryptos.frankjuchim.de/sso/ende', 'freischalten', 'node scripts/vertrag_pruefen.js https://kryptos.frankjuchim.de', 'Freigabe der Lehrkraft', 'Persistent Directory', '/app/data', 'Konfiguration:', '/healthz', 'Backup']) {
    assert.ok(betrieb.includes(s), `README §6: ${s}`);
  }
  assert.match(betrieb, /⚠️/, 'Warnkasten main = live');
});

// ---- M10 Task 238: Doku zu den Werkstatt-Werkzeugen (TECHNIK §10/§15, DESIGNSYSTEM §2/§6, FREMDCODE, README) ----
const TECHNIK = lies('docs/TECHNIK.md');
const abschnitt = (text, von, bis) => {
  const a = text.indexOf(von);
  const b = text.indexOf(bis, a + von.length);
  assert.ok(a >= 0 && b > a, `Abschnitt „${von}“`);
  return text.slice(a, b);
};

test('doku_registry: TECHNIK §10.2 hat je Werkzeug der Server-Registry eine Zeile mit Welt, Art und Reitern', () => {
  const { WERKZEUGE } = require('../src/krypto/werkzeuge');
  const tabelle = abschnitt(TECHNIK, '### 10.2 Registry', '### 10.3');
  const zeilen = tabelle.split('\n').filter((z) => /^\| `[a-z]+` \|/.test(z));
  assert.equal(zeilen.length, WERKZEUGE.length, 'eine Zeile je Werkzeug');
  for (const w of WERKZEUGE) {
    const z = zeilen.find((x) => x.startsWith(`| \`${w.id}\` |`));
    assert.ok(z, `${w.id} in TECHNIK §10.2`);
    const spalten = z.split('|').map((s) => s.trim());
    assert.equal(spalten[3], String(w.welt), `${w.id}: Welt`);
    assert.equal(spalten[4], w.art, `${w.id}: Art`);
    const reiter = [...spalten[5].matchAll(/`([a-z]+)`/g)].map((m) => m[1]);
    assert.deepEqual(reiter, [...w.reiter], `${w.id}: Reiter in Anzeige-Reihenfolge`);
  }
});

test('doku_reiter_regeln: jede Regel aus KRLabor.REITER_REGELN steht in TECHNIK §10.1', () => {
  const quelle = lies('public/static/js/krypto/labor/registry.js');
  const regeln = abschnitt(quelle, 'const REITER_REGELN', '});');
  const schluessel = [...regeln.matchAll(/'([a-z]+\.[a-z.]+)':/g)].map((m) => m[1]);
  assert.ok(schluessel.includes('quadrat.schluesselwort') && schluessel.length >= 14, 'Regeln gefunden');
  const t101 = abschnitt(TECHNIK, '### 10.1 Seitenstruktur', '### 10.2');
  for (const s of schluessel) assert.ok(t101.includes(`\`${s}\``), `${s} fehlt in TECHNIK §10.1`);
});

test('doku_station: TECHNIK §10.1 beschreibt KRStation mit allen Bausteinen und die Herkunftszeile', () => {
  const quelle = lies('public/static/js/krypto/labor/station.js');
  const namen = /return \{ ([A-Za-z, ]+) \};\n\}\)\(\);/.exec(quelle)[1].split(', ');
  const t101 = abschnitt(TECHNIK, '### 10.1 Seitenstruktur', '### 10.2');
  assert.ok(t101.includes('KRStation'));
  for (const n of namen) assert.ok(t101.includes(`\`${n}\``), `KRStation.${n} fehlt in TECHNIK §10.1`);
  assert.ok(t101.includes('Ideen von A. Bodendiek'), 'Namensnennung');
  assert.ok(abschnitt(TECHNIK, '### 11.3', '### 11.4').includes('labor_objekte.css'), '§11.3 labor_objekte.css');
});

test('doku_e2e: TECHNIK §15 nennt Szenario 15 und den Foto-Satz mit der Länge von FOTO_LISTE', () => {
  const { FOTO_LISTE } = require('./e2e/hilfen');
  const t15 = abschnitt(TECHNIK, '## 15. Tests', '## 16.');
  assert.match(t15, /Nr\. 15/);
  assert.match(t15, /^15\. Werkstatt-Werkzeuge/m);
  assert.ok(t15.includes(`kr-${String(FOTO_LISTE.length).padStart(2, '0')}-`), `Foto-Satz bis kr-${FOTO_LISTE.length}`);
  for (const n of FOTO_LISTE.slice(30)) assert.ok(t15.includes(n), `Foto ${n} in §15`);
});

test('doku_design: DESIGNSYSTEM §2 nennt jedes --mat-*-Token, §6 Flug/Bewegung der Werkzeuge', () => {
  const DS = lies('docs/DESIGNSYSTEM.md');
  const tokens = new Set([...lies('public/static/css/tokens.css').matchAll(/(--mat-[a-z0-9-]+):/g)].map((m) => m[1].replace(/-\d+$/, '-N')));
  const s2 = abschnitt(DS, '## 2. Farb-Token', '## 3.');
  for (const t of tokens) assert.ok(s2.includes(`\`${t}\``), `${t} fehlt in DESIGNSYSTEM §2`);
  const s6 = abschnitt(DS, '## 6. Bewegung', '## 7.');
  for (const w of ['KRStation.bewegung', 'KRStation.flug', 'prefers-reduced-motion']) assert.ok(s6.includes(w), `${w} in §6`);
});

test('doku_fremdcode: FREMDCODE nennt je Zeile einen Kryptos-Commit (Hash statt „Task N“)', () => {
  const F = lies('docs/FREMDCODE.md');
  const zeilen = F.split('\n').filter((z) => /^\| `[^`]+` \|/.test(z));
  assert.ok(zeilen.length >= 10, 'Tabelle mit Fremdcode-Zeilen');
  for (const z of zeilen) {
    const letzte = z.split('|').map((s) => s.trim())[4]; // Spalte „Kryptos-Commit“
    assert.match(letzte, /^`[0-9a-f]{7,40}`(, `[0-9a-f]{7,40}`)*$/, `Kryptos-Commit als Hash: ${z.slice(0, 80)}`);
  }
});

test('doku_readme: README §4.1 nennt M10 (1.1.0) und §8 die Werkstatt-Werkzeuge mit Namensnennung', () => {
  assert.match(abschnitt(README, '### 4.1', '\n## 5.'), /\| M10 /);
  assert.match(README, /1\.1\.0/);
  const s8 = README.slice(README.indexOf('## 8. Lizenz und Quellen')); // letzter Abschnitt
  assert.match(s8, /Ideen von A\. Bodendiek/);
});
