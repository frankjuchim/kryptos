'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const { spawnSync } = require('node:child_process');
const FONTS = path.join(__dirname, '..', 'public', 'static', 'fonts');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'public', 'static', 'css', 'schriften.css'), 'utf8');
const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'schriften_pruefen.py');
const DATEIEN = ['Fraunces-Variable.woff2', 'AtkinsonHyperlegible-Regular.woff2', 'AtkinsonHyperlegible-Bold.woff2', 'JetBrainsMono-Regular.woff2', 'JetBrainsMono-Bold.woff2', 'NotoSansMath-Symbole.woff2', 'NotoSansSymbols2-Symbole.woff2'];
const fonttools = spawnSync('python3', ['-c', 'import fontTools, brotli']).status === 0;
test('sieben WOFF2-Dateien, klein, je ein @font-face mit font-display: swap, keine externen URLs', () => {
  for (const d of DATEIEN) {
    const b = fs.readFileSync(path.join(FONTS, d));
    assert.equal(b.subarray(0, 4).toString('latin1'), 'wOF2', `${d}: kein WOFF2`);
    assert.ok(b.length < 100 * 1024, `${d}: ${b.length} Bytes`);
    assert.ok(CSS.includes(`url("/static/fonts/${d}")`), `${d} fehlt in schriften.css`);
  }
  assert.equal((CSS.match(/@font-face/g) || []).length, 7);
  assert.equal((CSS.match(/font-display:\s*swap/g) || []).length, 7);
  assert.equal((CSS.match(/font-family:\s*'KR Symbole'/g) || []).length, 2);
  assert.equal((CSS.match(/unicode-range:/g) || []).length, 2, 'nur die Symbol-Teilmengen haben unicode-range');
  assert.doesNotMatch(CSS, /https?:\/\/|fonts\.googleapis/);
});
test('LIESMICH nennt Paket, Version und Teilmengen-Befehl je Datei', () => {
  const l = fs.readFileSync(path.join(FONTS, 'LIESMICH.md'), 'utf8');
  for (const p of ['@fontsource-variable/fraunces@5.3.0', '@fontsource/atkinson-hyperlegible@5.3.0', '@fontsource/jetbrains-mono@5.3.0', '@fontsource/noto-sans-math@5.3.0', '@fontsource/noto-sans-symbols-2@5.3.0', 'schriften_bauen.py', 'OFL']) assert.ok(l.includes(p), p);
  for (const d of DATEIEN) assert.ok(l.includes(d), d);
});
test('schriften_pruefen.py: alles abgedeckt; ein fremdes Zeichen wird gemeldet', { skip: !fonttools && 'fonttools/brotli fehlt (pip install fonttools brotli)' }, () => {
  let r = spawnSync('python3', ['-I', SKRIPT], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /7 Dateien, alle Zeichen abgedeckt/);
  r = spawnSync('python3', ['-I', SKRIPT, '--zeichen', '≜'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /fehlt: ueberschrift .*U\+225C/);
});
