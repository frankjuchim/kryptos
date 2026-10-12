'use strict';
// `npm run dev` (TECHNIK §16.4): startet das Dev-Portal (Port 3100) und Kryptos (Port 3000) als Kindprozess mit
// NODE_ENV=development und der Verbund-Konfiguration für das Dev-Portal. Daten in ./data (DATA_DIR).
// WELT_DATEIEN (optional) wird an Kryptos durchgereicht, z. B. WELT_DATEIEN=test/fixtures/welt_beispiel.json.

const path = require('node:path');
const { spawn } = require('node:child_process');
const { starte } = require('./server');

const WURZEL = path.join(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 3000);
const PORTAL_PORT = Number(process.env.DEVPORTAL_PORT || 3100);
const PLATTFORM_URL = `http://localhost:${PORT}`;
const PORTAL_URL = `http://localhost:${PORTAL_PORT}`;
const DATA_DIR = path.resolve(WURZEL, process.env.DATA_DIR || 'data');

async function main() {
  const { server, publicPem, pemDatei } = await starte({ port: PORTAL_PORT, portalUrl: PORTAL_URL, plattformUrl: PLATTFORM_URL, dataDir: DATA_DIR });
  console.log(`Dev-Portal: ${PORTAL_URL} (öffentlicher Schlüssel in ${path.relative(WURZEL, pemDatei)})`);

  const env = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(PORT),
    DATA_DIR,
    PORTAL_URL,
    PORTAL_PUBLIC_KEY: publicPem,
    PLATTFORM_URL,
    PLATTFORM_ID: 'kryptos',
    AUTH_MODUS: 'portal',
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev-nur-lokal-0123456789abcdef-0123456789',
    TRUST_PROXY: 'false'
  };
  const kind = spawn(process.execPath, [path.join(WURZEL, 'src', 'server.js')], { cwd: WURZEL, env, stdio: 'inherit' });
  console.log(`Kryptos: ${PLATTFORM_URL} – Anmeldung über ${PLATTFORM_URL}/sso/start oder ${PORTAL_URL}/`);

  let ende = false;
  const beenden = (code) => {
    if (ende) return;
    ende = true;
    if (kind.exitCode === null) kind.kill('SIGTERM');
    server.close(() => process.exit(code));
    setTimeout(() => process.exit(code), 3000).unref();
  };
  kind.on('exit', (code) => beenden(code || 0));
  process.on('SIGINT', () => beenden(0));
  process.on('SIGTERM', () => beenden(0));
}

main().catch((e) => {
  console.error(`npm run dev: ${e.message}`);
  process.exit(1);
});
