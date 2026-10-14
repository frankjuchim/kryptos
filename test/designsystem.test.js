'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const { kontrast } = require('../src/krypto/validierung');
const { WELTEN } = require('../src/krypto/fach');
const CSS = path.join(__dirname, '..', 'public', 'static', 'css');
const lies = (f) => fs.readFileSync(path.join(CSS, f), 'utf8');
/** Custom Properties des ersten Regelblocks mit genau diesem Selektor. */
function block(text, selektor) {
  const i = text.indexOf(selektor + ' {');
  assert.ok(i >= 0, `Block ${selektor} fehlt`);
  const ende = text.indexOf('}', i);
  return Object.fromEntries([...text.slice(i, ende).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const T = lies('tokens.css');
const E = lies('epochen.css');
const HELL = block(T, ':root');
const DUNKEL = { ...HELL, ...block(T, ':root[data-theme="dunkel"]') };
const AKZENT_HELL = ['#E8957B', '#7FA8E0', '#D98C8C', '#A9C27A', '#5FD39A', '#5CC8D2', '#D9A441'];
test('Grundfarben = DESIGNSYSTEM §2.1', () => {
  const soll = { '--tinte': '#14213D', '--nacht': '#0B1426', '--tinte-2': '#22335A', '--messing': '#B07D2B', '--messing-hell': '#D9A441', '--messing-dunkel': '#8A5F1A', '--papier': '#FBF7EE', '--papier-2': '#F2EADB', '--linie': '#D8CDB8', '--text': '#1B1B1F', '--text-2': '#4A4A55', '--ok': '#2E7D32', '--fehler': '#B3261E', '--hinweis': '#1F4E8C', '--ok-flaeche': '#EDF6EB' };
  for (const [k, v] of Object.entries(soll)) assert.equal(HELL[k], v, k);
  assert.deepEqual(block(T, ':root[data-theme="dunkel"]'), block(T, ':root[data-theme="auto"]'), 'dunkel = auto im Dunkelmodus');
  assert.match(T, /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\[data-theme="auto"\] \{/);
});
test('Epochen = fach.WELTEN (Akzent) und DESIGNSYSTEM §2.2 (Akzent hell)', () => {
  for (const w of WELTEN) {
    const b = block(E, `[data-epoche="${w.nr}"]`);
    assert.equal(b['--akzent'], w.farbe, `Welt ${w.nr}`);
    assert.equal(b['--akzent-hell'], AKZENT_HELL[w.nr], `Welt ${w.nr} hell`);
  }
  assert.match(E, /:root\[data-theme="dunkel"\]\[data-epoche\][\s\S]*--akzent:\s*var\(--akzent-hell\)/);
});
const PAARE = [['--text', '--papier'], ['--text-2', '--papier'], ['--text', '--papier-2'], ['--text-2', '--papier-2'], ['--text', '--karte'], ['--text-2', '--karte'], ['--messing-dunkel', '--papier'], ['--messing-dunkel', '--karte'], ['--ok', '--papier'], ['--ok', '--karte'], ['--ok', '--ok-flaeche'], ['--fehler', '--papier'], ['--fehler', '--fehler-flaeche'], ['--hinweis', '--papier'], ['--hinweis', '--hinweis-flaeche'], ['--auf-tinte', '--tinte'], ['--auf-tinte', '--tinte-2'], ['--auf-tinte', '--tinte-3'], ['--auf-tinte-2', '--tinte'], ['--auf-tinte-2', '--tinte-2'], ['--auf-tinte-2', '--nacht'], ['--messing-hell', '--tinte'], ['--messing-hell', '--tinte-2'], ['--messing-hell', '--nacht'], ['--ok-hell', '--tinte'], ['--fehler-hell', '--tinte'],
  // Niveau-Chips (Task 45): Text + Rand auf allen Inhaltsflächen
  ...['--niveau-kern', '--niveau-eA', '--niveau-ergaenzung', '--niveau-kuer'].flatMap((n) => [[n, '--papier'], [n, '--papier-2'], [n, '--karte']]),
  // Knöpfe und aktive Fallen-Chips
  ['--papier', '--fehler'], ['--auf-akzent', '--fehler'], ['--nacht', '--messing-hell']];
test('Kontraste ≥ 4,5 : 1 – hell und dunkel, je Epoche (WCAG AA)', () => {
  for (const [name, t] of [['hell', HELL], ['dunkel', DUNKEL]]) {
    for (const [v, h] of PAARE) assert.ok(kontrast(t[v], t[h]) >= 4.5, `${name}: ${v} auf ${h} = ${kontrast(t[v], t[h]).toFixed(2)}`);
    for (const w of WELTEN) {
      const akzent = name === 'hell' ? w.farbe : AKZENT_HELL[w.nr];
      for (const h of ['--papier', '--karte']) assert.ok(kontrast(akzent, t[h]) >= 4.5, `${name} Welt ${w.nr}: Akzent auf ${h}`);
      assert.ok(kontrast(t['--auf-akzent'], akzent) >= 4.5, `${name} Welt ${w.nr}: Knopftext auf Akzent`);
      for (const h of ['--tinte', '--nacht']) assert.ok(kontrast(AKZENT_HELL[w.nr], t[h]) >= 4.5, `Welt ${w.nr}: Akzent hell auf ${h}`);
    }
  }
});
test('E25/E37: Akzent und --ok nie als Text auf --papier-2', () => {
  for (const f of fs.readdirSync(CSS).filter((x) => x.endsWith('.css'))) {
    for (const m of lies(f).matchAll(/\{([^}]*)\}/g)) {
      const r = m[1];
      if (/background(-color)?:\s*var\(--papier-2\)/.test(r)) assert.doesNotMatch(r, /(^|[^-])color:\s*var\(--(akzent|ok)\)/, `${f}: ${r.trim().slice(0, 80)}`);
    }
  }
});

test('Farbmischer-Töpfe (M6 E80): --farbe-gelb/-rot/-blau hell und dunkel ≥ 3 : 1 auf Papier, Karte, Papier-2 (Grafik, WCAG 1.4.11)', () => {
  const AUTO = { ...HELL, ...block(T, ':root[data-theme="auto"]') };
  for (const [name, t] of [['hell', HELL], ['dunkel', DUNKEL], ['auto', AUTO]]) {
    for (const f of ['--farbe-gelb', '--farbe-rot', '--farbe-blau']) {
      assert.ok(t[f], `${name}: ${f} fehlt`);
      for (const h of ['--papier', '--karte', '--papier-2']) assert.ok(kontrast(t[f], t[h]) >= 3, `${name}: ${f} auf ${h} = ${kontrast(t[f], t[h]).toFixed(2)}`);
    }
  }
});

test('Review M7 K7: Grafiklinien im Funkraum-Netz ≥ 3 : 1 (WCAG 1.4.11) – eigene Token hell, dunkel, Beamer', () => {
  const AUTO = { ...HELL, ...block(T, ':root[data-theme="auto"]') };
  for (const [name, t] of [['hell', HELL], ['dunkel', DUNKEL], ['auto', AUTO]]) {
    assert.ok(t['--netz-linie'], `${name}: --netz-linie fehlt`);
    for (const h of ['--karte', '--papier', '--papier-2']) assert.ok(kontrast(t['--netz-linie'], t[h]) >= 3, `${name}: --netz-linie auf ${h} = ${kontrast(t['--netz-linie'], t[h]).toFixed(2)}`);
  }
  for (const h of ['--nacht', '--tinte']) assert.ok(kontrast(HELL['--netz-linie-nacht'], HELL[h]) >= 3, `--netz-linie-nacht auf ${h}`);
  const F = lies('funkraum.css');
  assert.match(F, /\.funk-netz \.netz-linie \{ stroke: var\(--netz-linie\);/);
  assert.match(F, /\.funk-netz \.nachricht\.ausgeblendet \{ fill: var\(--netz-linie\);/);
  assert.match(F, /\.nacht \.funk-netz \.netz-linie \{ stroke: var\(--netz-linie-nacht\);/);
  assert.doesNotMatch(F, /netz-linie \{ stroke: var\(--(linie|tinte-3)\)/);
});
