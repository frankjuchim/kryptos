'use strict';
/*
 * Hilfen für den e2e-Durchlauf (M4 Tasks 66/67, TECHNIK §15): Dev-Portal + Kryptos als Kindprozess auf freien Ports,
 * Anmeldung über das Dev-Portal, Fehler-Beobachtung, Fotos nach docs/screenshots/, Prüfungen für Querscrollen und
 * Touch-Ziele. Alles über localhost (Cookies, Rücksprung zeichengenau).
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');

const WURZEL = path.join(__dirname, '..', '..');
const FOTOS = path.join(WURZEL, 'docs', 'screenshots');
const RICHTIG = require('../fixtures/antworten').RICHTIG;
const Krypto = require('../../public/static/js/shared/krypto.js');

/** Chromium: CHROMIUM_PATH, sonst neuestes /opt/pw-browsers/chromium-<n>/chrome-linux/chrome (PLAYWRIGHT_BROWSERS_PATH). */
function chromiumPfad() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const basis = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (fs.existsSync(basis)) {
    const kandidaten = fs
      .readdirSync(basis)
      .filter((x) => /^chromium-\d+$/.test(x))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of kandidaten) {
      const p = path.join(basis, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined; // Playwright-Standard (CI: npx playwright-core install chromium)
}

/** Ist der Port frei? */
function frei(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.listen(port, () => s.close(() => resolve(true)));
  });
}

async function freiePorts() {
  for (let i = 0; i < 50; i++) {
    const port = 4000 + Math.floor(Math.random() * 1900);
    if ((await frei(port)) && (await frei(port + 100))) return [port, port + 100];
  }
  throw new Error('Keine freien Ports gefunden.');
}

/**
 * Dev-Portal und Kryptos starten. Liefert { basis, portal, beenden(), log() }.
 */
async function starte() {
  const [port, portalPort] = await freiePorts();
  const basis = `http://localhost:${port}`;
  const portal = `http://localhost:${portalPort}`;
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-e2e-'));
  const { starte: startePortal } = require('../devportal/server');
  const { server, publicPem } = await startePortal({ port: portalPort, portalUrl: portal, plattformUrl: basis, dataDir });
  const kind = spawn(process.execPath, [path.join(WURZEL, 'src', 'server.js')], {
    cwd: WURZEL,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      DATA_DIR: dataDir,
      PORTAL_URL: portal,
      PORTAL_PUBLIC_KEY: publicPem,
      PLATTFORM_URL: basis,
      PLATTFORM_ID: 'kryptos',
      AUTH_MODUS: 'portal',
      SESSION_SECRET: 'e2e-nur-lokal-0123456789abcdef-0123456789',
      TRUST_PROXY: 'false',
      WELT_DATEIEN: path.join(WURZEL, 'test', 'fixtures', 'welt_beispiel.json'),
      SEED_DIR: path.join(WURZEL, 'test', 'e2e', 'seed')
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  kind.stdout.on('data', (d) => (log += d));
  kind.stderr.on('data', (d) => (log += d));
  let beendet = false;
  const beenden = async () => {
    if (beendet) return;
    beendet = true;
    if (kind.exitCode === null) kind.kill('SIGTERM');
    await new Promise((r) => server.close(() => r()));
    fs.rmSync(dataDir, { recursive: true, force: true });
  };
  const bis = Date.now() + 10000;
  while (Date.now() < bis) {
    if (kind.exitCode !== null) break;
    try {
      const r = await fetch(basis + '/healthz');
      if (r.ok) return { basis, portal, beenden, log: () => log };
    } catch {
      /* noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  await beenden();
  throw new Error(`Kryptos startet nicht:\n${log}`);
}

/** Über das Dev-Portal anmelden: wer = 'Mika R.' | 'Ida K.' | 'Frau M.' | 'Admin'. */
async function anmelden(page, ctx, wer, ziel = '/') {
  await page.goto(ctx.basis + '/sso/start?ziel=' + encodeURIComponent(ziel));
  await page.getByRole('link', { name: new RegExp('^' + wer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
  await page.waitForURL((u) => u.toString().startsWith(ctx.basis));
  await page.waitForLoadState('networkidle');
}

const ERWARTET = /status of (400|401|403|404|409|429)\b/;

/** Seitenfehler und Konsolenfehler sammeln (erwartete Ressourcen-Status ausgenommen). */
function beobachte(page, name, fehler) {
  page.on('pageerror', (e) => fehler.push(`${name}: Seitenfehler ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (ERWARTET.test(t)) return;
    fehler.push(`${name}: Konsole ${t} (${page.url()})`);
  });
}

let fotoNr = 0;
/** Foto docs/screenshots/m4-<nr>-<name>.png (E2E_FOTOS=0 schaltet aus). */
async function foto(page, name, { ganz = false } = {}) {
  fotoNr++;
  if (process.env.E2E_FOTOS === '0') return null;
  fs.mkdirSync(FOTOS, { recursive: true });
  const datei = path.join(FOTOS, `m4-${String(fotoNr).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: datei, fullPage: ganz });
  return datei;
}

/** Ältere Fotos dieses Laufs entfernen (vor dem ersten Foto). */
function fotosLeeren() {
  if (process.env.E2E_FOTOS === '0' || !fs.existsSync(FOTOS)) return;
  for (const f of fs.readdirSync(FOTOS)) if (/^m4-\d\d-.*\.png$/.test(f)) fs.rmSync(path.join(FOTOS, f));
}

/** Kein horizontales Seiten-Scrollen (scrollWidth ≤ innerWidth), sonst Fehler mit den drei breitesten Elementen. */
async function keinQuerScrollen(page, ort) {
  const r = await page.evaluate(() => {
    const w = window.innerWidth;
    const sw = document.documentElement.scrollWidth;
    if (sw <= w) return null;
    const breit = [...document.querySelectorAll('body *')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.right > w + 0.5)
      .sort((a, b) => b.r.right - a.r.right)
      .slice(0, 3)
      .map((x) => `${x.el.tagName.toLowerCase()}${x.el.id ? '#' + x.el.id : ''}.${[...x.el.classList].join('.')} (rechts ${Math.round(x.r.right)})`);
    return { w, sw, breit };
  });
  if (r) throw new Error(`${ort}: horizontales Scrollen (${r.sw} > ${r.w}): ${r.breit.join(', ')}`);
}

/** Alle sichtbaren Bedienelemente ≥ 44 × 44 px (Toleranz 0,5 px). */
async function ziele44(page, ort) {
  const klein = await page.evaluate(() => {
    const sel = 'button, [role="tab"], .knopf, .kopf-link, input.kaestchen, button.bit, select, summary';
    return [...document.querySelectorAll(sel)]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none') return false;
        if (el.closest('[hidden], dialog:not([open]), details:not([open]) > :not(summary)')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, t: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} „${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}“` };
      })
      .filter((x) => x.w < 43.5 || x.h < 43.5)
      .map((x) => `${x.t} ${Math.round(x.w)}×${Math.round(x.h)}`);
  });
  if (klein.length) throw new Error(`${ort}: Touch-Ziele unter 44 px: ${klein.slice(0, 8).join('; ')}`);
}

/** Hash-Route im laufenden Seitenskript öffnen und auf Ruhe warten. */
async function gehe(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

module.exports = { chromiumPfad, starte, anmelden, beobachte, foto, fotosLeeren, keinQuerScrollen, ziele44, gehe, RICHTIG, Krypto, WURZEL };
