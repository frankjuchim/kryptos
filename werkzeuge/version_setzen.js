#!/usr/bin/env node
'use strict';
// Version setzen (TECHNIK §11.6, Cache-Busting): package.json, package-lock.json (oben und packages[""]) und jedes
// ?v=<alt> in <wurzel>/public/**/*.html – auch veraltete Werte werden auf die neue Version gesetzt (auch Sprite-Verweise
// <use href="/static/img/x.svg?v=<alt>#id">; der Anker #id bleibt stehen).
//
//   node werkzeuge/version_setzen.js <x.y.z|patch|minor|major> [--wurzel <ordner>]
//
// Nur node:fs/node:path, ohne Abhängigkeiten.
const fs = require('node:fs');
const path = require('node:path');

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function fehler(text) {
  console.error(text);
  process.exit(1);
}

/** neue Version aus alter Version und Argument (patch|minor|major|x.y.z), sonst null */
function naechste(alt, arg) {
  if (SEMVER.test(arg)) return arg;
  const m = SEMVER.exec(alt);
  if (!m) return null;
  const [ma, mi, pa] = m.slice(1).map(Number);
  if (arg === 'patch') return `${ma}.${mi}.${pa + 1}`;
  if (arg === 'minor') return `${ma}.${mi + 1}.0`;
  if (arg === 'major') return `${ma + 1}.0.0`;
  return null;
}

function htmlDateien(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return htmlDateien(p);
    return e.name.endsWith('.html') ? [p] : [];
  });
}

/** JSON-Datei lesen, ändern und mit 2 Leerzeichen und abschließendem Zeilenumbruch schreiben */
function jsonAendern(datei, aendern) {
  const daten = JSON.parse(fs.readFileSync(datei, 'utf8'));
  aendern(daten);
  fs.writeFileSync(datei, JSON.stringify(daten, null, 2) + '\n');
}

function main(argv) {
  const args = argv.slice(2);
  let wurzel = path.join(__dirname, '..');
  const i = args.indexOf('--wurzel');
  if (i >= 0) {
    if (!args[i + 1]) fehler('Fehler: --wurzel braucht einen Ordner.');
    wurzel = path.resolve(args[i + 1]);
    args.splice(i, 2);
  }
  if (args.length !== 1) fehler('Aufruf: node werkzeuge/version_setzen.js <x.y.z|patch|minor|major> [--wurzel <ordner>]');

  const paket = path.join(wurzel, 'package.json');
  if (!fs.existsSync(paket)) fehler(`Fehler: ${paket} fehlt.`);
  const alt = JSON.parse(fs.readFileSync(paket, 'utf8')).version;
  const neu = naechste(alt, args[0]);
  if (!neu) fehler(`Fehler: ungültige Version „${args[0]}“ (erlaubt: x.y.z, patch, minor, major).`);

  const geaendert = ['package.json'];
  jsonAendern(paket, (d) => { d.version = neu; });
  const lock = path.join(wurzel, 'package-lock.json');
  if (fs.existsSync(lock)) {
    jsonAendern(lock, (d) => {
      d.version = neu;
      if (d.packages && d.packages['']) d.packages[''].version = neu;
    });
    geaendert.push('package-lock.json');
  }
  let html = 0;
  for (const p of htmlDateien(path.join(wurzel, 'public'))) {
    const vorher = fs.readFileSync(p, 'utf8');
    const nachher = vorher.replace(/\?v=[^"'&\s>#]+/g, `?v=${neu}`); // # gehört zum Sprite-Anker (…svg?v=x#id)
    if (nachher !== vorher) {
      fs.writeFileSync(p, nachher);
      html++;
    }
  }
  console.log(`Version ${alt} → ${neu} (${geaendert.join(', ')}, ${html} HTML-Dateien)`);
}

main(process.argv);
