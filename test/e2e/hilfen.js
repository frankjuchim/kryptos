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

/**
 * Kontraste aller sichtbaren Texte (Review M4 W1): berechnete Textfarbe gegen den effektiven Hintergrund (Stapel der
 * Hintergrundfarben bis zur ersten deckenden Fläche, Deckkraft der Vorfahren eingerechnet). Soll ≥ 4,5 : 1, großer
 * Text (≥ 24 px oder fett ≥ 18,66 px) ≥ 3 : 1. Ausgenommen: deaktivierte Bedienelemente (WCAG 1.4.3), aria-hidden,
 * Flächen mit Verlauf (nicht berechenbar). Liefert die Verstöße als Text.
 */
async function kontraste(page, ort) {
  return page.evaluate((ort) => {
    function rgba(s) {
      const m = /rgba?\(([^)]+)\)/.exec(s || '');
      if (!m) return null;
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function lum({ r, g, b }) {
      const f = (c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function mix(o, u) {
      return { r: o.r * o.a + u.r * (1 - o.a), g: o.g * o.a + u.g * (1 - o.a), b: o.b * o.a + u.b * (1 - o.a), a: 1 };
    }
    function hintergrund(el) {
      const stapel = [];
      let verlauf = false;
      for (let x = el; x && x.nodeType === 1; x = x.parentElement) {
        const s = getComputedStyle(x);
        if (s.backgroundImage && s.backgroundImage !== 'none' && !/url\(/.test(s.backgroundImage)) verlauf = true;
        const c = rgba(s.backgroundColor);
        if (c && c.a > 0) {
          stapel.push(c);
          if (c.a >= 1) break;
        }
      }
      let farbe = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = stapel.length - 1; i >= 0; i--) farbe = mix(stapel[i], farbe);
      return { farbe, verlauf };
    }
    const aus = [];
    const gesehen = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      if (!['', 'auto'].includes(el.getAttribute('aria-hidden') || '') || el.closest('[aria-hidden="true"]')) continue;
      if (!([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || (el.matches('input, select, textarea') && el.value))) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (el.disabled || el.closest('[disabled], [aria-disabled="true"]')) continue;
      let deck = 1;
      for (let x = el; x && x.nodeType === 1; x = x.parentElement) deck *= parseFloat(getComputedStyle(x).opacity);
      if (deck === 0) continue;
      const { farbe, verlauf } = hintergrund(el);
      if (verlauf) continue;
      const roh = rgba(s.color);
      if (!roh) continue;
      const vg = mix({ ...roh, a: roh.a * deck }, farbe);
      const L1 = lum(vg);
      const L2 = lum(farbe);
      const k = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(s.fontSize);
      const gross = px >= 24 || (parseInt(s.fontWeight, 10) >= 700 && px >= 18.66);
      const soll = gross ? 3 : 4.5;
      if (k + 0.005 >= soll) continue;
      const t = (el.value || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      const schluessel = `${el.tagName}.${el.className}|${t}`;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      aus.push(`${ort}: ${k.toFixed(2)} < ${soll} ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} „${t}“ (Text ${s.color} auf rgb(${Math.round(farbe.r)}, ${Math.round(farbe.g)}, ${Math.round(farbe.b)}))`);
    }
    return aus;
  }, ort);
}

/** Hash-Route im laufenden Seitenskript öffnen und auf Ruhe warten. */
async function gehe(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

module.exports = { chromiumPfad, starte, anmelden, beobachte, foto, fotosLeeren, keinQuerScrollen, ziele44, kontraste, gehe, RICHTIG, Krypto, WURZEL };
