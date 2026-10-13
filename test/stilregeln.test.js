'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const PUB = path.join(__dirname, '..', 'public');
const CSS = path.join(PUB, 'static', 'css');
const IMG = path.join(PUB, 'static', 'img');
const alle = (d, endung) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? alle(path.join(d, e.name), endung) : e.name.endsWith(endung) ? [path.join(d, e.name)] : []));
const lies = (p) => fs.readFileSync(p, 'utf8');
test('Farben nur in tokens.css/epochen.css (und druck.css), kein !important außer druck.css', () => {
  for (const p of alle(CSS, '.css')) {
    const n = path.basename(p);
    const ohneKommentar = lies(p).replace(/\/\*[\s\S]*?\*\//g, '');
    if (!['tokens.css', 'epochen.css', 'druck.css'].includes(n)) {
      assert.doesNotMatch(ohneKommentar, /#[0-9a-fA-F]{3,8}\b/, `${n}: Hex-Farbe – Token verwenden`);
      assert.doesNotMatch(ohneKommentar, /\brgba?\((?!11,\s*20,\s*38)/, `${n}: rgb()/rgba() nur für den Schatten-Token`);
    }
    if (n !== 'druck.css') assert.doesNotMatch(ohneKommentar, /!important/, `${n}: !important`);
  }
});
test('Touch-Ziele und reduzierte Bewegung in basis.css', () => {
  const b = lies(path.join(CSS, 'basis.css'));
  assert.match(b, /min-height:\s*var\(--ziel\)/);
  assert.match(b, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(b, /:root\[data-bewegung="aus"\]/);
  assert.match(b, /font-variant-ligatures:\s*none/);
});
test('jede verwendete Sprite-id existiert; Texturen höchstens 6 % Deckkraft', () => {
  const ids = new Map();
  for (const p of alle(IMG, '.svg')) ids.set(path.relative(IMG, p), new Set([...lies(p).matchAll(/<symbol id="([\w-]+)"/g)].map((m) => m[1])));
  const quellen = [...alle(path.join(PUB, 'static', 'js'), '.js'), ...alle(PUB, '.html'), ...alle(CSS, '.css')];
  for (const q of quellen) for (const m of lies(q).matchAll(/\/static\/img\/([\w/-]+\.svg)#([\w-]+)/g)) {
    assert.ok(ids.has(m[1]), `${path.relative(PUB, q)}: ${m[1]} fehlt`);
    assert.ok(ids.get(m[1]).has(m[2]), `${path.relative(PUB, q)}: #${m[2]} fehlt in ${m[1]}`);
  }
  for (let n = 0; n <= 6; n++) {
    const t = lies(path.join(IMG, 'texturen', `epoche-${n}.svg`));
    const werte = [...t.matchAll(/opacity="([\d.]+)"/g)].map((m) => Number(m[1]));
    assert.ok(werte.length && werte.every((x) => x <= 0.06), `epoche-${n}.svg: Deckkraft ${werte}`);
    assert.doesNotMatch(t, /<script|on\w+=|href="http/i);
  }
  assert.match(lies(path.join(CSS, 'epochen.css')), /--textur:\s*url\("\/static\/img\/texturen\/epoche-0\.svg"\)/);
});
