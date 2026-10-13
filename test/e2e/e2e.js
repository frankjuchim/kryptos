#!/usr/bin/env node
'use strict';
/*
 * End-to-End-Durchlauf (M4 Tasks 66/67, TECHNIK §15): Kryptos + Dev-Portal (test/devportal) mit der Fixture-Welt 9
 * (test/fixtures/welt_beispiel.json) und der e2e-Gast-Demo (test/e2e/seed). Szenarien in der Reihenfolge
 * 1 → 2 → 7a → 3 → 7b → 8 → 9 (4–6: Labor-Werkzeuge, Funkraum, Arena kommen mit M6/M7).
 * Fotos nach docs/screenshots/m4-*.png (E2E_FOTOS=0 schaltet aus).
 *
 * Aufruf: npm run e2e   (Chromium: CHROMIUM_PATH oder PLAYWRIGHT_BROWSERS_PATH; Standard /opt/pw-browsers/…)
 */
const { chromium } = require('playwright-core');
const H = require('./hilfen');
const schueler = require('./schueler');
const lehrkraft = require('./lehrkraft');
const gast = require('./gast');
const geraete = require('./geraete');

const SZENARIEN = [
  ['1 Start → Zeitleiste', schueler.szenario1],
  ['2 Neue Interaktionen', schueler.szenario2],
  ['7a Lehrkraft: Einstellungen, Auswertung, Vorschau', lehrkraft.szenario7a],
  ['3 Boss im gA-Kurs', schueler.szenario3],
  ['7b Wirkung der Einstellungen', lehrkraft.szenario7b],
  ['8 Gastmodus', gast.szenario8],
  ['9 Geräte, Dunkelmodus, Tastatur', geraete.szenario9]
];

async function main() {
  const ctx = await H.starte();
  ctx.fehler = [];
  let browser = null;
  let ok = true;
  try {
    browser = await chromium.launch({ executablePath: H.chromiumPfad() });
    ctx.browser = browser;
    H.fotosLeeren();
    for (const [name, fn] of SZENARIEN) {
      const t0 = Date.now();
      try {
        await fn(ctx);
        console.log(`✔ Szenario ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      } catch (e) {
        ok = false;
        console.error(`✘ Szenario ${name}: ${e.stack || e.message}`);
        break;
      }
    }
  } finally {
    if (browser) await browser.close();
    await ctx.beenden();
  }
  // Fotos im Repo: höchstens 30 PNG, zusammen ≤ 5 MB (M4 Task 67)
  if (ok && process.env.E2E_FOTOS !== '0') {
    const fs = require('node:fs');
    const path = require('node:path');
    const ordner = path.join(H.WURZEL, 'docs', 'screenshots');
    const fotos = fs.readdirSync(ordner).filter((f) => /^m4-.*\.png$/.test(f));
    const groesse = fotos.reduce((s, f) => s + fs.statSync(path.join(ordner, f)).size, 0);
    if (fotos.length > 30 || groesse > 5 * 1024 * 1024) ctx.fehler.push(`Fotos: ${fotos.length} Dateien, ${(groesse / 1048576).toFixed(1)} MB (höchstens 30 und 5 MB)`);
    else console.log(`Fotos: ${fotos.length} Dateien, ${(groesse / 1048576).toFixed(1)} MB in docs/screenshots/`);
  }
  if (ctx.fehler.length) {
    ok = false;
    console.error('Fehler im Browser:\n  ' + ctx.fehler.join('\n  '));
  }
  if (!ok) {
    console.error('Server-Log (Ende):\n' + ctx.log().split('\n').slice(-30).join('\n'));
    process.exit(1);
  }
  console.log('e2e: alles grün.');
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
