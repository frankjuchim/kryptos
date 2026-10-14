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
  const treffer = (text) => [
    ...[...text.matchAll(/\/static\/img\/([\w/-]+\.svg)(?:\?v=[^"'#\s]*)?#([\w-]+)/g)].map((m) => [m[1], m[2]]),
    ...[...text.matchAll(/\b(?:symbol|sprite)\('([\w-]+)',\s*'([\w-]+)'/g)].map((m) => [m[1] + '.svg', m[2]])
  ];
  for (const q of quellen) for (const [datei, id] of treffer(lies(q))) {
    assert.ok(ids.has(datei), `${path.relative(PUB, q)}: ${datei} fehlt`);
    assert.ok(ids.get(datei).has(id), `${path.relative(PUB, q)}: #${id} fehlt in ${datei}`);
  }
  for (let n = 0; n <= 6; n++) {
    const t = lies(path.join(IMG, 'texturen', `epoche-${n}.svg`));
    const werte = [...t.matchAll(/opacity="([\d.]+)"/g)].map((m) => Number(m[1]));
    assert.ok(werte.length && werte.every((x) => x <= 0.06), `epoche-${n}.svg: Deckkraft ${werte}`);
    assert.doesNotMatch(t, /<script|on\w+=|href="http/i);
  }
  assert.match(lies(path.join(CSS, 'epochen.css')), /--textur:\s*url\("\/static\/img\/texturen\/epoche-0\.svg"\)/);
});
test('Aufgaben-Knopfleiste: auf dem Handy nicht klebend (verdeckt sonst Inhalt), klebend nur mit Platz und scroll-padding', () => {
  const css = lies(path.join(CSS, 'aufgaben.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const grund = css.match(/(?:^|\n)\.aktionen\s*\{([^}]*)\}/);
  assert.ok(grund, '.aktionen-Regel fehlt');
  assert.doesNotMatch(grund[1], /position:\s*sticky/, '.aktionen außerhalb einer Media-Query nicht sticky');
  const mq = css.match(/@media \(min-width: 768px\) and \(min-height: 640px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(mq, 'Media-Query für die klebende Leiste fehlt');
  assert.match(mq[1], /\.aktionen\s*\{[^}]*position:\s*sticky/);
  assert.match(mq[1], /scroll-padding-bottom/);
});
test('Review M4 W1: Linkfarbe auf Tinte/Nacht/Kopf gilt nicht für Knöpfe (Messing-Knopf behält --nacht)', () => {
  const css = lies(path.join(CSS, 'komponenten.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].split(',').map((s) => s.trim());
    if (!/(^|;)\s*color\s*:\s*var\(--auf-tinte\)/.test(m[2])) continue;
    for (const s of sel) {
      if (/^\.(tinte|nacht|kopf)\s+a$/.test(s)) assert.fail(`„${s}“ färbt auch a.knopf (Messing-Knopf 2,1 : 1) – a:not(.knopf) verwenden`);
    }
  }
});

test('Labor-Werkzeuge setzen per CSSOM nur Custom Properties; Farbwerte nur als --mischung im Farbmischer (M6 E80)', () => {
  const DIR = path.join(PUB, 'static', 'js', 'krypto', 'labor');
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.js'))) {
    const src = lies(path.join(DIR, f));
    for (const m of src.matchAll(/style\.setProperty\(\s*(['`])([^'`]*)\1/g)) assert.match(m[2], /^--/, `${f}: setProperty nur für --Variablen`);
    assert.doesNotMatch(src, /\.style\.(?!setProperty)\w+\s*=/, `${f}: keine direkten style-Zuweisungen`);
    const farben = [...src.matchAll(/setProperty\(\s*'(--[\w-]+)'\s*,\s*`?(?:rgb|#)/g)].map((m) => m[1]);
    for (const v of farben) assert.ok(f === 'modulo.js' && v === '--mischung', `${f}: Farbwert per CSSOM nur --mischung im Farbmischer (${v})`);
  }
});

// Spezifität (a, b, c) eines einfachen Selektors; :not/:is/:has zählen ihr stärkstes Argument, :where zählt nicht
function spezifitaet(sel) {
  let a = 0, b = 0, c = 0;
  let s = sel;
  const klammer = /:(not|is|has|where)\(((?:[^()]|\([^()]*\))*)\)/;
  let m;
  while ((m = s.match(klammer))) {
    if (m[1] !== 'where') {
      const best = m[2].split(',').map((x) => spezifitaet(x.trim())).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0];
      a += best[0]; b += best[1]; c += best[2];
    }
    s = s.replace(m[0], ' ');
  }
  s = s.replace(/\[[^\]]*\]/g, () => { b++; return ' '; });
  s = s.replace(/::[\w-]+/g, () => { c++; return ' '; });
  s = s.replace(/#[\w-]+/g, () => { a++; return ' '; });
  s = s.replace(/\.[\w-]+/g, () => { b++; return ' '; });
  s = s.replace(/:[\w-]+/g, () => { b++; return ' '; });
  for (const t of s.split(/[\s>+~]+/)) if (/^[a-z][\w-]*$/i.test(t)) c++;
  return [a, b, c];
}
const groesser = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

test('Zustandsrahmen (ok/falsch/loesung) an Eingabefeldern schlagen die Eingabe-Grundregel aus basis.css (bits-text, hash-ziel …)', () => {
  assert.deepEqual(spezifitaet('input:not([type="checkbox"]):not([type="radio"])'), [0, 2, 1]);
  assert.deepEqual(spezifitaet('.hashziel input.hashziel-eingabe.ok'), [0, 3, 1]);
  const basis = lies(path.join(CSS, 'basis.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const grund = [...basis.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /border\s*:/.test(m[2]))
    .flatMap((m) => m[1].split(',').map((s) => s.trim())).filter((s) => /^input\b/.test(s));
  assert.ok(grund.length, 'Eingabe-Grundregel in basis.css nicht gefunden');
  const schwelle = grund.map(spezifitaet).sort(groesser).pop();
  // Klassen, die Eingabefelder tragen (h('input', { class: … }) und Lücken-Felder der gaps)
  const klassen = new Set(['luecke']);
  for (const p of alle(path.join(PUB, 'static', 'js'), '.js')) {
    for (const m of lies(p).matchAll(/h\('input',\s*\{\s*class:\s*'([\w\s-]+)'/g)) for (const k of m[1].split(/\s+/)) klassen.add(k);
  }
  assert.ok(klassen.has('bits-text') && klassen.has('kaestchen'));
  const verstoesse = [];
  for (const p of alle(CSS, '.css')) {
    if (path.basename(p) === 'basis.css') continue;
    const css = lies(p).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|;)\s*(border|background)[\w-]*\s*:/.test(m[2])) continue;
      for (const s of m[1].split(',').map((x) => x.trim())) {
        const letzter = s.split(/[\s>+~]+/).pop();
        if (!/\.(ok|falsch|loesung)\b/.test(letzter)) continue;
        if (/^(span|select|div|td|button|label)\b/.test(letzter)) continue;
        const k = [...letzter.matchAll(/\.([\w-]+)/g)].map((x) => x[1]).find((x) => klassen.has(x));
        if (k && groesser(spezifitaet(s), schwelle) < 0) verstoesse.push(`${path.basename(p)}: ${s}`);
      }
    }
  }
  assert.deepEqual(verstoesse, [], 'zu schwach gegen basis.css input:not(…) – Zustandsrahmen bleibt unsichtbar');
});
test('[hidden] gewinnt gegen id-Regeln mit display (Toast verschwand nie, Fund M9 Task 217)', () => {
  for (const p of alle(CSS, '.css')) {
    const n = path.basename(p);
    if (n === 'druck.css') continue;
    const css = lies(p).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/(^|;)\s*display\s*:\s*(?!none)/.test(m[2])) continue;
      for (const sel of m[1].split(',')) {
        const id = /#([\w-]+)(?![\w-]*\[hidden\])/.exec(sel);
        if (!id || /:not\(\[hidden\]\)/.test(sel)) continue;
        const regel = new RegExp(`#${id[1]}\\[hidden\\][^{]*\\{[^}]*display\\s*:\\s*none`);
        assert.match(css, regel, `${n}: #${id[1]} setzt display – Regel #${id[1]}[hidden] { display: none } fehlt`);
      }
    }
  }
});
