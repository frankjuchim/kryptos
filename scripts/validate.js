#!/usr/bin/env node
'use strict';
// Inhalts-Validator (SPEC §9).
//   npm run validate                    → prüft seed/welten/*.json
//   node scripts/validate.js <datei> …  → prüft einzelne Dateien
//   Optionen: --ohne-hinweise (nur Fehler), --json (maschinenlesbar)
const fs = require('node:fs');
const path = require('node:path');
const { validiereDateien, formatiere } = require('../src/content/validator');

const args = process.argv.slice(2);
const json = args.includes('--json');
const ohneHinweise = args.includes('--ohne-hinweise');
let dateien = args.filter((a) => !a.startsWith('--'));
if (!dateien.length) {
  const dir = path.join(__dirname, '..', 'seed', 'welten');
  dateien = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json')).sort().map((f) => path.join(dir, f))
    : [];
  if (!dateien.length) {
    console.log('Keine Welt-Dateien in seed/welten gefunden.');
    process.exit(0);
  }
}
const ergebnisse = validiereDateien(dateien);
if (json) console.log(JSON.stringify(ergebnisse, null, 2));
else console.log(formatiere(ergebnisse, { warnungen: !ohneHinweise }));
process.exit(ergebnisse.some((r) => r.fehler.length) ? 1 : 0);
