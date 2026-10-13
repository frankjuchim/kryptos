#!/usr/bin/env node
'use strict';
/*
 * End-to-End-Durchlauf (M4 Tasks 66/67, TECHNIK §15): Kryptos + Dev-Portal (test/devportal) mit der Fixture-Welt 9
 * (test/fixtures/welt_beispiel.json) und der e2e-Gast-Demo (test/e2e/seed). Szenarien in der Reihenfolge
 * 1 → 2 → 7a → 3 → 7b → 8 → 10 → 9 (4–6: Labor-Werkzeuge, Funkraum, Arena kommen mit M6/M7; 10 Fehlerzustände
 * und die Kontrastmessung in 9 aus dem Review M4). Danach Szenario 11 „Welten 0–2 spielbar“ (M5 Task 101) mit einem
 * zweiten App-Start auf den echten Seeds (seed/, ohne WELT_DATEIEN), ohne Fotos.
 * E2E_NUR=11 (o. Ä., Komma-Liste) führt nur die genannten Szenarien aus – zum Entwickeln; Fotos dann aus.
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
const fehlerzustaende = require('./fehler');
const inhalte = require('./inhalte');

const SZENARIEN = [
  ['1 Start → Zeitleiste', schueler.szenario1],
  ['2 Neue Interaktionen', schueler.szenario2],
  ['7a Lehrkraft: Einstellungen, Auswertung, Vorschau', lehrkraft.szenario7a],
  ['3 Boss im gA-Kurs', schueler.szenario3],
  ['7b Wirkung der Einstellungen', lehrkraft.szenario7b],
  ['8 Gastmodus', gast.szenario8],
  ['10 Fehlerzustände', fehlerzustaende.szenario10],
  ['9 Geräte, Dunkelmodus, Tastatur', geraete.szenario9]
];
/** Szenarien auf den echten Seeds (zweiter App-Start). */
const SZENARIEN_ECHT = [['11 Welten 0–2 mit den echten Seeds', inhalte.szenario11]];

const NUR = (process.env.E2E_NUR || '').split(',').map((x) => x.trim()).filter(Boolean);
const gewaehlt = ([name]) => !NUR.length || NUR.includes(name.split(' ')[0]);
if (NUR.length) process.env.E2E_FOTOS = '0';

/** Szenarien nacheinander; beim ersten Fehler Abbruch. Liefert true, wenn alle grün. */
async function lauf(ctx, liste) {
  for (const [name, fn] of liste.filter(gewaehlt)) {
    const t0 = Date.now();
    try {
      await fn(ctx);
      console.log(`✔ Szenario ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    } catch (e) {
      console.error(`✘ Szenario ${name}: ${e.stack || e.message}`);
      return false;
    }
  }
  return true;
}

async function main() {
  const ctx = await H.starte();
  ctx.fehler = [];
  let echt = null;
  let browser = null;
  let ok = true;
  try {
    browser = await chromium.launch({ executablePath: H.chromiumPfad() });
    ctx.browser = browser;
    if (!NUR.length) H.fotosLeeren();
    ok = await lauf(ctx, SZENARIEN);
    if (ok && SZENARIEN_ECHT.some(gewaehlt)) {
      echt = await H.starte({ echt: true });
      echt.fehler = ctx.fehler;
      echt.browser = browser;
      ok = await lauf(echt, SZENARIEN_ECHT);
      if (!ok) console.error('Server-Log echte Seeds (Ende):\n' + echt.log().split('\n').slice(-30).join('\n'));
    }
  } finally {
    if (browser) await browser.close();
    if (echt) await echt.beenden();
    await ctx.beenden();
  }
  // Fotos im Repo: höchstens 30 PNG, zusammen ≤ 5 MB (M4 Task 67)
  if (ok && process.env.E2E_FOTOS !== '0' && !NUR.length) {
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
