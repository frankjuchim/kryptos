'use strict';
const path = require('node:path');
const { createApp, VERSION } = require('./app');
const { ladeKonfig, konfigZusammenfassung, pruefeDatenDir } = require('./verbund/konfig');

const log = (...a) => console.log(new Date().toISOString(), ...a);

// Verbund-Konfiguration (TECHNIK §6.1): fehlt etwas oder ist es ungültig, startet Kryptos nicht (außer NODE_ENV=test).
let konfig;
try {
  konfig = ladeKonfig(process.env, { test: process.env.NODE_ENV === 'test' });
  // Schreibprobe vor dem Öffnen der Datenbank (K45, M9 Review Focus 1: leeres CapRover-Volume gehört root)
  pruefeDatenDir(konfig.dataDir);
} catch (e) {
  console.error(`Kryptos startet nicht. ${e.message}`);
  console.error('Pflicht: PLATTFORM_URL, PORTAL_URL, PORTAL_PUBLIC_KEY, SESSION_SECRET (≥ 32 Zeichen); AUTH_MODUS nur „portal“.');
  process.exit(1);
}

const SEED_DIR = process.env.SEED_DIR || path.join(__dirname, '..', 'seed');
// Nur für Entwicklung/Tests: zusätzliche Welt-Dateien (durch Komma getrennt), z. B. test/fixtures/welt_beispiel.json
const WELT_DATEIEN = (process.env.WELT_DATEIEN || '').split(',').map((s) => s.trim()).filter(Boolean);

let app;
try {
  app = createApp({
    dbFile: path.join(konfig.dataDir, 'kryptos.db'),
    sessionSecret: konfig.sessionSecret,
    konfig,
    seedDir: SEED_DIR,
    weltDateien: WELT_DATEIEN.map((f) => path.resolve(f)),
    trustProxy: konfig.trustProxy,
    log
  });
} catch (e) {
  // z. B. fremde Datenbank (meta.app ≠ kryptos) oder neueres Schema (src/db.js)
  console.error(`Kryptos startet nicht. ${e.message}`);
  process.exit(1);
}

const server = app.listen(konfig.port, () => {
  log(`Kryptos ${VERSION} läuft auf Port ${konfig.port} (Daten: ${konfig.dataDir}, Portal: ${konfig.portalUrl})`);
  // Startzeile ohne Geheimnisse (K45, M9 E151): IDs, URLs, Anzahl und Fingerabdrücke der Portal-Schlüssel
  log('Konfiguration:', JSON.stringify(konfigZusammenfassung(konfig)));
  // Wartungsjob (TECHNIK §7.4): sofort und danach stündlich
  app.locals.wartung.starte();
});

function shutdown(sig) {
  log(`${sig} empfangen, fahre herunter …`);
  app.locals.wartung.stop();
  server.close(() => {
    try {
      app.locals.db.close();
    } catch {
      /* egal */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
