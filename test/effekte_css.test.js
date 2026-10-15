'use strict';
// Nachtrag M11: AQ.effekt.schweben („+20“ über der Rückmeldung) hängt div.schweben an body an. Ohne Kryptos-Regel stand der
// Text 1,6 s ungestylt unten links auf der Seite. Die Regel steht in aufgaben.css: fixiert, ohne Klicks, unsichtbar ohne
// Animation; die Animation nur ohne reduzierte Bewegung und ohne „Bewegung aus“ (AQ.ruhig() lässt sie ohnehin weg).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('./dom_attrappe');

const CSS = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', 'aufgaben.css'), 'utf8');
const regel = (sel, text = CSS) => {
  const m = new RegExp(`(^|\\n)\\s*${sel.replace(/[.[\]()"=:]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(text);
  return m ? m[2] : null;
};

test('schweben_hat_kryptos_regel: fixiert, ohne Klicks, ohne Animation unsichtbar', () => {
  const r = regel('.schweben');
  assert.ok(r, '.schweben in aufgaben.css');
  assert.match(r, /position:\s*fixed/);
  assert.match(r, /pointer-events:\s*none/);
  assert.match(r, /opacity:\s*0/, 'ohne Animation unsichtbar');
  assert.doesNotMatch(r, /animation/, 'Animation nur im Bewegungsblock');
  assert.match(r, /var\(--messing/, 'Farbe aus den Tokens');
});

test('schweben_animation_nur_mit_bewegung', () => {
  const a = CSS.indexOf('@media (prefers-reduced-motion: no-preference)');
  const block = CSS.slice(a, CSS.indexOf('\n}\n', a));
  assert.match(block, /:root:not\(\[data-bewegung="aus"\]\) \.schweben \{ animation: kr-schweben/);
  assert.match(CSS, /@keyframes kr-schweben/);
});

test('schweben_bei_ruhig_kein_element', () => {
  const k = D.lade(['common.js']);
  k.window.matchMedia = () => ({ matches: true }); // prefers-reduced-motion: reduce
  const el = k.document.createElement('p');
  k.document.body.appendChild(el);
  k.wert('AQ').effekt.schweben(el, '+20');
  assert.equal(k.alle(k.document.body, '.schweben').length, 0);
});
