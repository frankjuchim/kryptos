'use strict';
// Plan M8 Task 200 (E141): scripts/abdeckung.js prüft die Abdeckung aus den Spec-Matrizen §11.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SKRIPT = path.join(__dirname, '..', 'scripts', 'abdeckung.js');
const SEED = path.join(__dirname, '..', 'seed');
const lauf = (...args) => spawnSync(process.execPath, [SKRIPT, ...args], { encoding: 'utf8' });

test('abdeckung.js: Parser-Selbsttest', () => {
  const r = lauf('--selbsttest');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const A = require(SKRIPT);
  assert.deepEqual(A.idsAusZelle(0, 'W0-L2-03, W0-L3-04, 06, 07'), ['W0-L2-03', 'W0-L3-04', 'W0-L3-06', 'W0-L3-07']);
  assert.deepEqual(A.idsAusZelle(4, 'W4-K3-01 … -03'), ['W4-L3-01', 'W4-L3-02', 'W4-L3-03']);
  assert.deepEqual(A.idsAusZelle(3, 'W3-L1-00'), ['W3-A-01']);
});

test('abdeckung.js: echte Seeds ohne Lücke (Exit 0)', () => {
  const r = lauf('--json');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).luecken, []);
});

test('abdeckung.js: absichtliche Lücke (W0 ohne Boss-Aufgabe zu „modulares Rechnen“) → Exit 1 mit genau dieser Lücke', () => {
  const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-abdeckung-'));
  fs.cpSync(SEED, ziel, { recursive: true });
  const datei = path.join(ziel, 'welten', 'welt0.json');
  const w = JSON.parse(fs.readFileSync(datei, 'utf8'));
  w.boss.pool = w.boss.pool.filter((id) => id !== 'W0-B-07');
  fs.writeFileSync(datei, JSON.stringify(w));
  const r = lauf('--json', '--welt', '0', '--seed', ziel);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  const { luecken } = JSON.parse(r.stdout);
  assert.equal(luecken.length, 1, JSON.stringify(luecken));
  assert.equal(luecken[0].welt, 0);
  assert.equal(luecken[0].regel, 'kc');
  assert.match(luecken[0].luecke, /modulares Rechnen.*Boss/);
  // Ausgabe als Tabelle ohne --json
  const t = lauf('--welt', '0', '--seed', ziel);
  assert.equal(t.status, 1);
  assert.match(t.stdout, /Welt 0 · kc · .*modulares Rechnen/);
  fs.rmSync(ziel, { recursive: true, force: true });
});
