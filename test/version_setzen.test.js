'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { spawnSync } = require('node:child_process');
const SKRIPT = path.join(__dirname, '..', 'werkzeuge', 'version_setzen.js');
function wurzel() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kr-version-'));
  fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify({ name: 'x', version: '0.1.9' }, null, 2) + '\n');
  fs.writeFileSync(path.join(d, 'package-lock.json'), JSON.stringify({ name: 'x', version: '0.1.9', packages: { '': { name: 'x', version: '0.1.9' } } }, null, 2) + '\n');
  fs.mkdirSync(path.join(d, 'public', 'fehler'), { recursive: true });
  fs.writeFileSync(path.join(d, 'public', 'a.html'), '<link href="/static/css/a.css?v=0.1.9"><script src="/static/js/a.js?v=0.1.9"></script><svg><use href="/static/img/icons.svg?v=0.1.9#i-labor"></use></svg>');
  fs.writeFileSync(path.join(d, 'public', 'fehler', 'b.html'), '<link href="/static/css/a.css?v=0.1.8">');
  return d;
}
const lauf = (...a) => spawnSync(process.execPath, [SKRIPT, ...a], { encoding: 'utf8' });
test('patch, minor und feste Version; alle ?v= (auch veraltete) werden gesetzt', () => {
  const d = wurzel();
  let r = lauf('patch', '--wurzel', d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /0\.1\.9 → 0\.1\.10 \(package\.json, package-lock\.json, 2 HTML-Dateien\)/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '0.1.10');
  const lock = JSON.parse(fs.readFileSync(path.join(d, 'package-lock.json')));
  assert.deepEqual([lock.version, lock.packages[''].version], ['0.1.10', '0.1.10']);
  assert.equal((fs.readFileSync(path.join(d, 'public', 'a.html'), 'utf8').match(/\?v=0\.1\.10/g) || []).length, 3);
  assert.match(fs.readFileSync(path.join(d, 'public', 'a.html'), 'utf8'), /icons\.svg\?v=0\.1\.10#i-labor"/, 'Sprite-Anker bleibt erhalten');
  assert.match(fs.readFileSync(path.join(d, 'public', 'fehler', 'b.html'), 'utf8'), /\?v=0\.1\.10/);
  assert.equal(lauf('minor', '--wurzel', d).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '0.2.0');
  assert.equal(lauf('1.0.0', '--wurzel', d).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(d, 'package.json'))).version, '1.0.0');
  assert.equal(lauf('irgendwas', '--wurzel', d).status, 1);
});
