#!/usr/bin/env node
'use strict';
/*
 * Objektbilder der Werkstatt-Werkzeuge für Folien und Videos (Plan M10 Task 236, E192): startet Kryptos mit den echten
 * Seeds und dem Dev-Portal (test/e2e/hilfen.js), meldet die Lehrkraft „Frau M.“ an, öffnet /labor#/<id>, führt ein paar
 * Handgriffe aus und fotografiert die Werkzeugfläche (ohne Kopfzeile, hell; Aufnahme mit deviceScaleFactor 2, Endbild mit 1). Das Foto wird auf
 * 1600 × 900 gesetzt, unten rechts mit der Herkunftszeile „Ideen von A. Bodendiek (Krypto-Werkstatt)“.
 * Aufruf: node werkzeuge/material/labor_bilder.js [ausgabeordner]   (Standard: materialien/Bilder/Labor)
 * Schreibt dazu quellen.json (Bild → Werkzeug, Reiter, Herkunft). Nur Pseudonyme, keine Codes.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../../test/e2e/hilfen');

const GROESSE = { width: 1600, height: 900 };
const HERKUNFT = 'Ideen von A. Bodendiek (Krypto-Werkstatt)';
const ziel = path.resolve(process.argv[2] || path.join(H.WURZEL, 'materialien', 'Bilder', 'Labor'));

const klick = async (p, sel) => {
  await p.locator(sel).first().click();
  await p.waitForTimeout(60);
};
const stempel = async (p, wort, sel = 'button.station-stempel') => {
  for (const b of wort) await klick(p, `${sel}[data-buchstabe="${b}"]`);
};

/** Bild → { werkzeug, reiter, ausschnitt (Selektor), handgriffe(page) } */
const BILDER = {
  'scheibe.png': {
    werkzeug: 'scheibe', reiter: 'scheibe', ausschnitt: '.scheibe-buehne',
    async handgriffe(p) {
      for (const b of 'mango') await klick(p, `.scheibe-aussen [data-buchstabe="${b}"]`);
    }
  },
  'skytale.png': {
    werkzeug: 'skytale', reiter: 'skytale', ausschnitt: '.stab-buehne',
    async handgriffe(p) {
      await stempel(p, 'ZEBRA');
    }
  },
  'schablone.png': {
    werkzeug: 'skytale', reiter: 'fleissner', ausschnitt: '.stab-buehne',
    async handgriffe(p) {
      await stempel(p, 'BIRNE');
    }
  },
  'polybios.png': {
    werkzeug: 'quadrat', reiter: 'polybios', ausschnitt: '.quadrat-buehne',
    async handgriffe(p) {
      for (const b of 'KIWIS') await klick(p, `.quadrat-feld[data-buchstabe="${b}"]`);
    }
  },
  'playfair.png': {
    werkzeug: 'quadrat', reiter: 'playfair', ausschnitt: '.quadrat-buehne',
    async handgriffe(p) {
      for (const b of 'BALKON') await klick(p, `.quadrat-feld[data-buchstabe="${b}"]`);
    }
  },
  'trommel.png': {
    werkzeug: 'signale', reiter: 'morse', ausschnitt: '.signale-buehne',
    async handgriffe(p) {
      await klick(p, '.signale-tafel [data-buchstabe="S"]');
      for (let i = 0; i < 3; i++) await klick(p, 'button.signale-trommel-rand');
      await klick(p, 'button.signale-pause');
      await klick(p, '.signale-tafel [data-buchstabe="O"]');
      await klick(p, 'button.signale-trommel-fell');
    }
  },
  'freimaurer.png': {
    werkzeug: 'signale', reiter: 'freimaurer', ausschnitt: '.signale-buehne',
    async handgriffe(p) {
      for (const [f, n, pk] of [['gitter', 6, true], ['kreuz', 2, false], ['gitter', 5, false]]) await klick(p, `.signale-schluesselbild [data-figur="${f}"][data-feld="${n}"][data-punkt="${pk}"]`);
    }
  },
  'brief.png': {
    werkzeug: 'verstecke', reiter: 'nullchiffre', ausschnitt: '.verstecke-buehne',
    async handgriffe(p) {
      for (const b of 'GUT') {
        await klick(p, `button.station-stempel[data-buchstabe="${b}"]`);
        await klick(p, '.verstecke-vorschlaege button');
      }
    }
  },
  'enigma.png': {
    werkzeug: 'enigma', reiter: 'maschine', ausschnitt: '.enigma-gehaeuse',
    async handgriffe(p) {
      await p.locator('details.enigma-tagesschluessel > summary').click();
      await klick(p, 'button.enigma-beispiel');
      await p.locator('details.enigma-tagesschluessel > summary').click();
      for (const b of 'PINIE') await klick(p, `.enigma-taste[data-buchstabe="${b}"]`);
    }
  },
  'stromweg.png': {
    werkzeug: 'enigma', reiter: 'innenleben', ausschnitt: '.enigma-schaubild',
    async handgriffe(p) {
      await klick(p, '.enigma-wahl [data-buchstabe="A"]');
    }
  }
};

async function main() {
  fs.mkdirSync(ziel, { recursive: true });
  const ctx = await H.starte({ echt: true });
  const browser = await chromium.launch({ executablePath: H.chromiumPfad() });
  const neu = async (dsf = 1) => (await browser.newContext({ viewport: GROESSE, deviceScaleFactor: dsf, reducedMotion: 'reduce', colorScheme: 'light' })).newPage();
  const quellen = { hinweis: 'Objektbilder der Labor-Werkzeuge (Plan M10 Task 236, E192); erzeugt mit werkzeuge/material/labor_bilder.js', bilder: {} };
  try {
    const lk = await neu(2); // Ausschnitt scharf aufnehmen, Endbild 1600 × 900 bei deviceScaleFactor 1
    await H.anmelden(lk, ctx, 'Frau M.', '/lehrer');
    const leinwand = await neu();
    for (const [datei, b] of Object.entries(BILDER)) {
      await H.gehe(lk, `${ctx.basis}/labor#/${b.werkzeug}?reiter=${b.reiter}`);
      await lk.locator(b.ausschnitt).first().waitFor();
      await b.handgriffe(lk);
      await lk.waitForTimeout(400);
      const roh = await lk.locator(b.ausschnitt).first().screenshot();
      await leinwand.setContent(`<html><body style="margin:0;width:1600px;height:900px;overflow:hidden;background:#FBF7EE;font-family:sans-serif">
        <div style="position:absolute;inset:32px 32px 64px;display:flex;align-items:center;justify-content:center">
          <img style="width:100%;height:100%;object-fit:contain" src="data:image/png;base64,${roh.toString('base64')}"></div>
        <p style="position:absolute;right:36px;bottom:18px;margin:0;font-size:22px;color:#4A4A4A">${HERKUNFT}</p></body></html>`);
      await leinwand.waitForTimeout(100);
      await leinwand.screenshot({ path: path.join(ziel, datei) });
      quellen.bilder[datei] = { werkzeug: b.werkzeug, reiter: b.reiter, herkunft: HERKUNFT };
      console.log('✔', path.join(path.relative(process.cwd(), ziel), datei));
    }
    fs.writeFileSync(path.join(ziel, 'quellen.json'), `${JSON.stringify(quellen, null, 2)}\n`);
  } finally {
    await browser.close();
    await ctx.beenden();
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
