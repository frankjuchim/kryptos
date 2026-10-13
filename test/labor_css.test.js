'use strict';
// Review M6 W4: Klassen der Labor-Werkzeuge dürfen nicht unbeabsichtigt von allgemeinen Regeln in aufgaben.css/komponenten.css
// getroffen werden (z. B. `.stellungen { display: flex }` auf der Stellungstabelle der Mini-Enigma). Geprüft wird jeder
// Selektor dieser Dateien, dessen Klassen alle in labor/*.js vorkommen. Erlaubt sind nur bewusst geteilte Bausteine.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const JS = path.join(__dirname, '..', 'public', 'static', 'js', 'krypto', 'labor');
const CSS = path.join(__dirname, '..', 'public', 'static', 'css');

// bewusst geteilte Bausteine der Oberfläche (Knöpfe, Hinweise, Zustände) – Klassen, die allein nichts verraten
const GEMEINSAM = new Set(['knopf', 'knopf-leise', 'knopf-primaer', 'knopf-zweit', 'knopf-reihe', 'scroll-x', 'sr', 'text-2', 'leer-zustand', 'laden', 'lang', 'rueckmeldung', 'info', 'wrap', 'chip', 'chip-falle']);
// bewusst geteilte Darstellung aus den Aufgaben-Blöcken (Alphabet-Leiste der Scheibe, Geheimtext-Zeilen, Fallen-Chip)
const ERLAUBT = new Set([
  '.geheimtext',
  'figure.alphabet',
  'figure.alphabet figcaption',
  '.alphabet-teil',
  '.alphabet-teil th',
  '.alphabet-teil td',
  '.alphabet-teil thead th',
  '.alphabet-teil td.ecke',
  '.alphabet-teil tbody th[scope="row"]',
  '.alphabet-teil tr.zahlen td',
  '.alphabet-teil .markiert',
  '.alphabet-teil thead th.markiert',
  '.chip-falle.aktiv'
]);

/** Klassen aus den Werkzeug-Modulen: class/klasse-Attribute (auch Template-Teile) und classList-Aufrufe. */
function laborKlassen() {
  const k = new Set();
  for (const f of fs.readdirSync(JS).filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(JS, f), 'utf8');
    for (const m of s.matchAll(/(?:class|klasse):\s*(?:'([^']*)'|`([^`]*)`|"([^"]*)")/g)) for (const x of (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (/^[a-z][\w-]*$/.test(x)) k.add(x);
    for (const m of s.matchAll(/classList\.(?:add|toggle|remove|contains)\(\s*'([^']+)'/g)) k.add(m[1]);
  }
  return k;
}

/** Selektoren einer CSS-Datei (ohne Kommentare, @media-Köpfe ausgelassen). */
function selektoren(datei) {
  const s = fs.readFileSync(path.join(CSS, datei), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const aus = [];
  for (const m of s.matchAll(/([^{}]+)\{/g)) {
    const kopf = m[1].trim();
    if (kopf.startsWith('@')) continue;
    for (const sel of kopf.split(',')) aus.push(sel.trim().replace(/\s+/g, ' '));
  }
  return aus;
}

test('Selbstprüfung: die Klassen-Sammlung findet Werkzeug-Klassen', () => {
  const k = laborKlassen();
  for (const x of ['werkzeug-flaeche', 'labor-eingabe', 'scheibe-leiste', 'bitgitter']) assert.ok(k.has(x), x);
});

test('Labor-Klassen kollidieren nicht mit allgemeinen Selektoren in aufgaben.css und komponenten.css', () => {
  const k = laborKlassen();
  const treffer = [];
  for (const datei of ['aufgaben.css', 'komponenten.css']) {
    for (const sel of selektoren(datei)) {
      const klassen = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
      if (!klassen.length || !klassen.every((x) => k.has(x)) || klassen.every((x) => GEMEINSAM.has(x))) continue;
      if (!ERLAUBT.has(sel)) treffer.push(`${datei}: ${sel}`);
    }
  }
  assert.deepEqual(treffer, [], 'Werkzeug-Klassen mit Präfix benennen (z. B. enigma-, fleissner-, werkbank-)');
});
