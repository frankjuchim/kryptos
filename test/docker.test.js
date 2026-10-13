// Docker-Tauglichkeit ohne Docker-Daemon (TECHNIK §16.2, M5 Task 103): Dockerfile und .dockerignore werden gegen den
// Dateibaum abgeglichen, daraus der Inhalt von /app im Laufzeit-Image nachgebildet (Stufe 2, ohne node_modules) und in
// einem Arbeitsordner aufgebaut. Dort laufen der Inhalts-Validator und der Server (NODE_ENV=production) – so fällt auf,
// wenn eine COPY-Quelle fehlt, .dockerignore etwas Nötiges ausschließt oder der Server zur Laufzeit eine Datei außerhalb
// des Images braucht (Akten, Lösungen, Lehrkraft-PDFs, Seeds, Skripte).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const WURZEL = path.join(__dirname, '..');
const lies = (p) => fs.readFileSync(path.join(WURZEL, p), 'utf8');

/** .dockerignore als Regelliste [{ muster: RegExp, ausnahme }] (Docker: Muster ab Wurzel, `*` ohne `/`, `**` beliebig). */
function ignoreRegeln() {
  return lies('.dockerignore')
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z && !z.startsWith('#'))
    .map((z) => {
      const ausnahme = z.startsWith('!');
      const roh = (ausnahme ? z.slice(1) : z).replace(/^\/+|\/+$/g, '');
      const re = roh
        .split(/(\*\*|\*|\?)/)
        .map((t) => (t === '**' ? '.*' : t === '*' ? '[^/]*' : t === '?' ? '[^/]' : t.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
        .join('');
      return { roh, ausnahme, muster: new RegExp(`^${re}$`) };
    });
}

/** Ist der Pfad (relativ zur Wurzel, mit `/`) im Build-Kontext? Letzte passende Regel gewinnt; ein Muster trifft auch Unterpfade. */
function imKontext(rel, regeln) {
  const teile = rel.split('/');
  const praefixe = teile.map((_, i) => teile.slice(0, i + 1).join('/'));
  let drin = true;
  for (const r of regeln) if (praefixe.some((p) => r.muster.test(p))) drin = r.ausnahme;
  return drin;
}

/** Alle Dateien unter rel (rekursiv, relativ zur Wurzel). */
function dateien(rel) {
  const abs = path.join(WURZEL, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => dateien(`${rel}/${e.name}`));
}

/** COPY-Anweisungen der Laufzeit-Stufe (ohne --from): [{ quellen, ziel }] */
function copyAnweisungen() {
  const zeilen = lies('Dockerfile').replace(/\\\n/g, ' ').split('\n');
  const stufen = [];
  for (const z of zeilen) {
    if (/^FROM\s/i.test(z)) stufen.push([]);
    else if (/^COPY\s/i.test(z) && stufen.length) stufen[stufen.length - 1].push(z);
  }
  const letzte = stufen[stufen.length - 1];
  return letzte
    .filter((z) => !/--from=/.test(z))
    .map((z) => {
      const teile = z.trim().split(/\s+/).slice(1).filter((t) => !t.startsWith('--'));
      return { quellen: teile.slice(0, -1), ziel: teile[teile.length - 1] };
    });
}

/** Inhalt von /app im Image: Map Image-Pfad → Repo-Pfad (nur Dateien im Build-Kontext). */
function imageInhalt() {
  const regeln = ignoreRegeln();
  const inhalt = new Map();
  for (const { quellen, ziel } of copyAnweisungen()) {
    const zielOrdner = ziel.replace(/^\.\/?/, '').replace(/\/$/, '');
    for (const q of quellen) {
      const abs = path.join(WURZEL, q);
      const istDatei = fs.existsSync(abs) && fs.statSync(abs).isFile();
      for (const d of dateien(q).filter((x) => imKontext(x, regeln))) {
        let imImage;
        if (istDatei) imImage = quellen.length > 1 || ziel.endsWith('/') ? path.posix.join(zielOrdner, path.posix.basename(q)) : zielOrdner;
        else imImage = path.posix.join(zielOrdner, path.posix.relative(q, d));
        inhalt.set(imImage, d);
      }
    }
  }
  return inhalt;
}

test('Dockerfile: jede COPY-Quelle existiert und liegt (mit Inhalt) im Build-Kontext', () => {
  const regeln = ignoreRegeln();
  const anweisungen = copyAnweisungen();
  assert.ok(anweisungen.length >= 8, 'COPY-Anweisungen der Laufzeit-Stufe gefunden');
  for (const { quellen } of anweisungen) {
    for (const q of quellen) {
      assert.ok(fs.existsSync(path.join(WURZEL, q)), `COPY-Quelle fehlt: ${q}`);
      const drin = dateien(q).filter((d) => imKontext(d, regeln) && !d.endsWith('.gitkeep'));
      assert.ok(drin.length > 0, `COPY-Quelle ohne Dateien im Build-Kontext (.dockerignore?): ${q}`);
    }
  }
});

test('.dockerignore: Ausnahmen (!) zeigen auf vorhandene Pfade, Werkzeuge/Tests/Quellen bleiben draußen', () => {
  const regeln = ignoreRegeln();
  for (const r of regeln.filter((x) => x.ausnahme)) assert.ok(fs.existsSync(path.join(WURZEL, r.roh)), `Ausnahme ohne Pfad: !${r.roh}`);
  for (const rel of ['test/helpers.js', 'werkzeuge/akten_pdf.py', 'quellen', 'docs/TECHNIK.md', 'scripts/abdeckung.js', 'materialien/Welt0_Antike/2_Akten/KR_W0_Akte1_Skytale_von_Sparta.docx', 'materialien/Loesungen_Akten', 'node_modules/express/package.json', 'data/kryptos.db', '.git/HEAD']) {
    assert.equal(imKontext(rel, regeln), false, `${rel} darf nicht in den Build-Kontext`);
  }
  for (const rel of ['src/server.js', 'seed/akten.json', 'materialien/Akten_PDF/Welt_0_Antike/KR_W0_Akte1_Skytale_von_Sparta.pdf', 'materialien/Lehrkraft_PDF/verzeichnis.json', 'scripts/validate.js', 'docs/AUFGABENFORMAT_KRYPTO.md']) {
    assert.equal(imKontext(rel, regeln), true, `${rel} muss in den Build-Kontext`);
  }
});

test('Image-Inhalt: Akten, Lehrkraft-Verzeichnis, Demo-PDFs und relative require() liegen im Image; keine Lösung unter /app/akten', () => {
  const inhalt = imageInhalt();
  const hat = (p) => inhalt.has(p);
  // Server-Code: jede relative require() löst im Image auf
  for (const [imPfad] of inhalt) {
    if (!/^(src|scripts)\/.*\.js$/.test(imPfad)) continue;
    const code = fs.readFileSync(path.join(WURZEL, inhalt.get(imPfad)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); // ohne Kommentare
    for (const m of code.matchAll(/require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
      const basis = path.posix.normalize(path.posix.join(path.posix.dirname(imPfad), m[1]));
      const kandidaten = [basis, `${basis}.js`, `${basis}.json`, `${basis}/index.js`];
      assert.ok(kandidaten.some(hat), `${imPfad}: require('${m[1]}') fehlt im Image`);
    }
  }
  // Akten laut seed/akten.json unter /app/akten (dort sucht der Server zuerst, src/app.js)
  const akten = JSON.parse(lies('seed/akten.json'));
  for (const wk of akten.werkzeugkarten) assert.ok(hat(`akten/${wk.datei}`), `Werkzeugkarte fehlt im Image: ${wk.datei}`);
  for (const w of akten.welten) for (const a of [...(w.akten || []), ...(w.weitere || [])]) assert.ok(hat(`akten/${w.ordner}/${a.datei}`), `Akte fehlt im Image: ${w.ordner}/${a.datei}`);
  // Lehrkraft-Verzeichnis: Akten_PDF/… → /app/akten, alles andere → /app/materialien
  const verz = JSON.parse(lies('materialien/Lehrkraft_PDF/verzeichnis.json'));
  const pfade = JSON.stringify(verz).match(/"pfad":\s*"[^"]+"/g).map((x) => JSON.parse(x.replace(/^"pfad":\s*/, '')));
  assert.ok(pfade.length > 50, 'Lehrkraft-Verzeichnis gelesen');
  for (const p of pfade) assert.ok(hat(p.startsWith('Akten_PDF/') ? `akten/${p.slice(10)}` : `materialien/${p}`), `Lehrkraft-Datei fehlt im Image: ${p}`);
  // Demo-PDFs
  const demo = JSON.parse(lies('seed/demo_materialien.json'));
  for (const p of demo.schueler) assert.ok(hat(`akten/${p}`), `Demo-PDF fehlt: ${p}`);
  for (const p of demo.lehrkraft) assert.ok(hat(`materialien/${p}`), `Demo-PDF fehlt: ${p}`);
  // Seeds, Videos, Gast, Formatdateien
  for (const p of ['seed/welten/welt0.json', 'seed/welten/welt1.json', 'seed/welten/welt2.json', 'seed/gast/demo.json', 'seed/videos.json', 'seed/warmup/w0.json', 'docs/AUFGABENFORMAT_KRYPTO.md', 'public/static/js/shared/krypto.js', 'package-lock.json']) {
    assert.ok(hat(p), `${p} fehlt im Image`);
  }
  // Schülerbereich ohne Lösungen
  for (const [p] of inhalt) if (p.startsWith('akten/')) assert.doesNotMatch(p, /_LSG|_EH|Klausur|Funkraum/i, `nur Lehrkraft: ${p}`);
  // nichts aus test/, werkzeuge/, quellen/
  for (const [, quelle] of inhalt) assert.doesNotMatch(quelle, /^(test|werkzeuge|quellen|prototyp|node_modules|data)\//, `gehört nicht ins Image: ${quelle}`);
});

test('Image-Nachbau: Validator und Server (production) laufen nur mit den Dateien aus dem Image', { timeout: 60000 }, async () => {
  const inhalt = imageInhalt();
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-image-'));
  try {
    for (const [imPfad, quelle] of inhalt) {
      fs.mkdirSync(path.join(app, path.dirname(imPfad)), { recursive: true });
      fs.copyFileSync(path.join(WURZEL, quelle), path.join(app, imPfad));
    }
    fs.symlinkSync(path.join(WURZEL, 'node_modules'), path.join(app, 'node_modules'), 'dir');

    const v = spawnSync(process.execPath, ['scripts/validate.js'], { cwd: app, encoding: 'utf8' });
    assert.equal(v.status, 0, `Validator im Image:\n${v.stdout}\n${v.stderr}`);

    const { publicKey } = crypto.generateKeyPairSync('ed25519');
    const port = 20000 + Math.floor(Math.random() * 20000);
    const daten = path.join(app, 'data');
    fs.mkdirSync(daten);
    const kind = spawn(process.execPath, ['src/server.js'], {
      cwd: app,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        PORT: String(port),
        DATA_DIR: daten,
        TZ: 'Europe/Berlin',
        AUTH_MODUS: 'portal',
        PLATTFORM_ID: 'kryptos',
        PORTAL_URL: 'https://portal.example',
        PORTAL_PUBLIC_KEY: publicKey.export({ type: 'spki', format: 'pem' }),
        PLATTFORM_URL: 'https://kryptos.example',
        SESSION_SECRET: crypto.randomBytes(24).toString('hex'),
        TRUST_PROXY: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let log = '';
    kind.stdout.on('data', (d) => (log += d));
    kind.stderr.on('data', (d) => (log += d));
    const basis = `http://127.0.0.1:${port}`;
    try {
      let bereit = false;
      for (let i = 0; i < 100 && !bereit && kind.exitCode === null; i++) {
        try {
          bereit = (await fetch(basis + '/healthz')).ok;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      assert.ok(bereit, `Server im Image startet nicht:\n${log}`);
      const themen = await (await fetch(basis + '/api/themen')).json();
      assert.deepEqual(themen.welten.map((w) => w.nr), [0, 1, 2]);
      for (const w of themen.welten) for (const l of w.levels) assert.ok(l.akte && l.akte.url, `Akte mit URL für ${l.id}`);
      assert.ok(themen.werkzeugkarten.every((x) => x.url), 'Werkzeugkarten mit URL');
      const demo = JSON.parse(lies('seed/demo_materialien.json'));
      for (const p of demo.schueler) assert.equal((await fetch(`${basis}/akten/${p}`)).status, 200, `Demo-PDF ${p}`);
      for (const p of demo.lehrkraft) assert.equal((await fetch(`${basis}/lehrkraft/dateien/${p}`)).status, 200, `Demo-PDF ${p}`);
      assert.equal((await fetch(`${basis}/akten/Welt_0_Antike/KR_W0_Akte2_Caesars_Botschaft.pdf`)).status, 401, 'Akte ohne Anmeldung');
      const manifest = await (await fetch(basis + '/api/plattform')).json();
      assert.equal(manifest.id, 'kryptos');
      assert.equal(manifest.umfang.welten, 3);
    } finally {
      kind.kill('SIGTERM');
      await new Promise((r) => (kind.exitCode !== null ? r() : kind.once('exit', r)));
    }
  } finally {
    fs.rmSync(app, { recursive: true, force: true });
  }
});
