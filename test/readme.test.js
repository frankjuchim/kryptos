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
