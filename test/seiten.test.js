'use strict';
// Seitenprüfung (TECHNIK §11.2, §11.4–§11.6, §15): CSP-konforme HTML-Seiten, sicheres DOM-JavaScript,
// Cache-Versionen, Schriftlizenzen, keine Algo-Quest-Texte, lang="de".
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const VERSION = require('../package.json').version;

/** alle Dateien unterhalb von dir (rekursiv), relativ zu PUBLIC */
function alleDateien(dir) {
  if (!fs.existsSync(dir)) return [];
  const aus = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) aus.push(...alleDateien(p));
    else aus.push(p);
  }
  return aus;
}
const rel = (p) => path.relative(PUBLIC, p);
const lies = (p) => fs.readFileSync(p, 'utf8');

const htmlDateien = alleDateien(PUBLIC).filter((p) => p.endsWith('.html'));
const jsDateien = alleDateien(path.join(PUBLIC, 'static', 'js')).filter((p) => p.endsWith('.js'));
const TEXT_ENDUNGEN = /\.(html|js|css|svg|json|txt|md)$/;

test('es gibt HTML-Seiten und Skripte', () => {
  assert.ok(htmlDateien.length >= 5, 'HTML-Seiten fehlen');
  assert.ok(jsDateien.length >= 1, 'Skripte fehlen');
});

test('(a) HTML: keine Inline-Skripte, keine <style>-Blöcke, keine style-/on*-Attribute, keine externen Ressourcen', () => {
  for (const p of htmlDateien) {
    const f = rel(p);
    const html = lies(p);
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(m[1], /\ssrc="\/static\//, `${f}: Skript ohne lokale Quelle`);
      assert.equal(m[2].trim(), '', `${f}: Inline-Skript`);
    }
    assert.doesNotMatch(html, /<style\b/i, `${f}: <style>`);
    assert.doesNotMatch(html, /\sstyle\s*=/i, `${f}: style-Attribut`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${f}: Event-Handler-Attribut`);
    assert.doesNotMatch(html, /(src|href)\s*=\s*"(https?:)?\/\//i, `${f}: externe Ressource`);
  }
});

test('(b) JavaScript: kein innerHTML/outerHTML/insertAdjacentHTML/document.write/setAttribute(style), kein eval', () => {
  for (const p of jsDateien) {
    const js = lies(p);
    assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, rel(p));
    assert.doesNotMatch(js, /setAttribute\(\s*['"`]style['"`]/, `${rel(p)}: setAttribute('style', …) – CSSOM verwenden`);
    assert.doesNotMatch(js, /\beval\(|new Function\(/, rel(p));
  }
});

test('(c) kein „Algo Quest“ in public/**', () => {
  for (const p of alleDateien(PUBLIC).filter((x) => TEXT_ENDUNGEN.test(x))) {
    assert.doesNotMatch(lies(p), /algo\s*quest/i, rel(p));
  }
});

test('(d) jede HTML-Seite hat lang="de" und einen Titel', () => {
  for (const p of htmlDateien) {
    const html = lies(p);
    assert.match(html, /<html\b[^>]*\slang="de"/, `${rel(p)}: lang="de" fehlt`);
    assert.match(html, /<title>[^<]+<\/title>/, `${rel(p)}: <title> fehlt`);
  }
});

test('Cache-Versionen: jedes ?v= gleich der package.json-Version, verlinkte static-Dateien existieren', () => {
  for (const p of htmlDateien) {
    const html = lies(p);
    for (const m of html.matchAll(/\?v=([^"'&\s>]+)/g)) assert.equal(m[1], VERSION, `${rel(p)}: ?v=${m[1]} ≠ ${VERSION}`);
    for (const m of html.matchAll(/(?:src|href)="(\/static\/[^"?#]+)(?:\?v=([^"]+))?"/g)) {
      assert.ok(fs.existsSync(path.join(PUBLIC, m[1])), `${rel(p)}: ${m[1]} fehlt`);
      if (/\.(js|css)$/.test(m[1])) assert.equal(m[2], VERSION, `${rel(p)}: ${m[1]} ohne ?v=${VERSION}`);
    }
  }
});

test('Schriften: jede Schriftdatei hat eine Lizenz in fonts/LIZENZEN/OFL-<Familie>.txt (leerer Ordner ok)', () => {
  const fonts = path.join(PUBLIC, 'static', 'fonts');
  const schriften = alleDateien(fonts).filter((p) => /\.(woff2?|ttf|otf)$/i.test(p));
  for (const p of schriften) {
    const familie = path.basename(p).split(/[-.]/)[0];
    const lizenz = path.join(fonts, 'LIZENZEN', `OFL-${familie}.txt`);
    assert.ok(fs.existsSync(lizenz), `${rel(p)}: Lizenzdatei ${rel(lizenz)} fehlt`);
    assert.match(lies(lizenz), /SIL OPEN FONT LICENSE/i, `${rel(lizenz)}: kein OFL-Text`);
    assert.match(lies(lizenz), /Copyright/i, `${rel(lizenz)}: Copyright-Zeile fehlt`);
  }
});

test('SVG-Dateien ohne Skript und ohne externe Verweise', () => {
  const svgs = alleDateien(path.join(PUBLIC, 'static')).filter((p) => p.endsWith('.svg'));
  assert.ok(svgs.length >= 1, 'keine SVG-Dateien');
  for (const p of svgs) {
    const svg = lies(p);
    assert.doesNotMatch(svg, /<script/i, `${rel(p)}: <script>`);
    assert.doesNotMatch(svg, /\son\w+\s*=/i, `${rel(p)}: Event-Handler-Attribut`);
    assert.doesNotMatch(svg, /href\s*=\s*"(https?:)?\/\//i, `${rel(p)}: externer Verweis`);
  }
});
