'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const { createApp, VERSION } = require('./app');

const log = (...a) => console.log(new Date().toISOString(), ...a);

const PORT = Number(process.env.PORT) || 80;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const SEED_DIR = process.env.SEED_DIR || path.join(__dirname, '..', 'seed');
// Nur für Entwicklung/Tests: zusätzliche Welt-Dateien (durch Komma getrennt), z. B. test/fixtures/welt_beispiel.json
const WELT_DATEIEN = (process.env.WELT_DATEIEN || '').split(',').map((s) => s.trim()).filter(Boolean);

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 16) {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  log('WARNUNG: SESSION_SECRET fehlt oder ist kürzer als 16 Zeichen – es wird ein zufälliges Geheimnis verwendet.',
    'Nach jedem Neustart müssen sich alle neu anmelden. Bitte SESSION_SECRET setzen!');
}
const adminEmail = (process.env.ADMIN_EMAIL || 'admin').trim();
const adminPassword = process.env.ADMIN_PASSWORD || '';
if (!adminPassword) log('WARNUNG: ADMIN_PASSWORD ist nicht gesetzt – der Superadmin-Login ist deaktiviert.');
else if (adminPassword.length < 10) log('HINWEIS: ADMIN_PASSWORD ist kurz. Empfohlen sind mindestens 10 Zeichen.');

const trustProxyEnv = process.env.TRUST_PROXY;
const trustProxy = trustProxyEnv === undefined ? 1 : /^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv === 'true';

const app = createApp({
  dbFile: path.join(DATA_DIR, 'algoquest.db'),
  sessionSecret,
  adminEmail,
  adminPassword,
  seedDir: SEED_DIR,
  weltDateien: WELT_DATEIEN.map((f) => path.resolve(f)),
  trustProxy,
  log
});

const server = app.listen(PORT, () => log(`Algo Quest Lab ${VERSION} läuft auf Port ${PORT} (Daten: ${DATA_DIR})`));

function shutdown(sig) {
  log(`${sig} empfangen, fahre herunter …`);
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
