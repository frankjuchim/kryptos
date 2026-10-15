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
// Welten mit Seed (Plan M8: W3–W6 kommen Task für Task dazu) und Welten mit Akten in seed/akten.json (Akten W3–W6: Task 199)
const SEED_WELTEN = fs.readdirSync(path.join(WURZEL, 'seed', 'welten')).map((d) => /^welt(\d)\.json$/.exec(d)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
const AKTEN_WELTEN = new Set(JSON.parse(lies('seed/akten.json')).welten.map((w) => w.welt));

/** .dockerignore als Regelliste [{ muster: RegExp, ausnahme }] (Docker: Muster ab Wurzel, `*` ohne `/`, `**` beliebig). */
function ignoreRegeln() {
  return lies('.dockerignore')
    .split('\n')
    .map((z) => z.trim())
    .filter((z) => z && !z.startsWith('#'))
    .map((z) => {
      const ausnahme = z.startsWith('!');
      const roh = (ausnahme ? z.slice(1) : z).replace(/^\/+|\/+$/g, '');
      // „**/“ trifft wie bei Docker auch null Ordner (z. B. „**/*.pem“ auch „neu.pem“ in der Wurzel)
      const re = roh
        .split(/(\*\*\/|\*\*|\*|\?)/)
        .map((t) => (t === '**/' ? '(?:.*/)?' : t === '**' ? '.*' : t === '*' ? '[^/]*' : t === '?' ? '[^/]' : t.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
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
  for (const p of ['seed/welten/welt0.json', 'seed/welten/welt1.json', 'seed/welten/welt2.json', 'seed/gast/demo.json', 'seed/funkraum/wettknacken.json', 'seed/videos.json', 'seed/warmup/w0.json', 'docs/AUFGABENFORMAT_KRYPTO.md', 'public/static/js/shared/krypto.js', 'package-lock.json']) {
    assert.ok(hat(p), `${p} fehlt im Image`);
  }
  // Schülerbereich ohne Lösungen
  // (Probeklausur W6 = Papier-Boss der Welt 6, Schülerfassung – erlaubt, Plan M8 Task 199; Klausur/Nachschreibklausur nie)
  for (const [p] of inhalt) if (p.startsWith('akten/')) assert.doesNotMatch(p, /_LSG|_EH|(^|[/_])Klausur|Nachschreib|Funkraum/i, `nur Lehrkraft: ${p}`);
  // nichts aus test/, werkzeuge/, quellen/
  for (const [, quelle] of inhalt) assert.doesNotMatch(quelle, /^(test|werkzeuge|quellen|prototyp|node_modules|data)\//, `gehört nicht ins Image: ${quelle}`);
});

/** Image-Inhalt in einen Arbeitsordner kopieren (node_modules als Verweis). Liefert den Ordner. */
function baueNachbau() {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-image-'));
  for (const [imPfad, quelle] of imageInhalt()) {
    fs.mkdirSync(path.join(app, path.dirname(imPfad)), { recursive: true });
    fs.copyFileSync(path.join(WURZEL, quelle), path.join(app, imPfad));
  }
  fs.symlinkSync(path.join(WURZEL, 'node_modules'), path.join(app, 'node_modules'), 'dir');
  return app;
}

/** Umgebung wie im Dockerfile + CapRover-Variablen (Produktion). */
function nachbauEnv({ port, daten, publicKey, secret }) {
  return {
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
    SESSION_SECRET: secret,
    TRUST_PROXY: '1'
  };
}

/** Server im Nachbau starten und auf /healthz warten. Liefert { basis, log(), stop() }. */
async function starteNachbau(app, env) {
  const kind = spawn(process.execPath, ['src/server.js'], { cwd: app, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  kind.stdout.on('data', (d) => (log += d));
  kind.stderr.on('data', (d) => (log += d));
  const basis = `http://127.0.0.1:${env.PORT}`;
  const stop = async () => {
    if (kind.exitCode === null) kind.kill('SIGTERM');
    await new Promise((r) => (kind.exitCode !== null ? r() : kind.once('exit', r)));
  };
  let bereit = false;
  for (let i = 0; i < 150 && !bereit && kind.exitCode === null; i++) {
    try {
      bereit = (await fetch(basis + '/healthz')).ok;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!bereit) {
    await stop();
    assert.fail(`Server im Image startet nicht:\n${log}`);
  }
  return { basis, log: () => log, stop };
}

const zufallsPort = () => 20000 + Math.floor(Math.random() * 20000);

test('Image-Nachbau: Validator und Server (production) laufen nur mit den Dateien aus dem Image', { timeout: 60000 }, async () => {
  const app = baueNachbau();
  try {
    const v = spawnSync(process.execPath, ['scripts/validate.js'], { cwd: app, encoding: 'utf8' });
    assert.equal(v.status, 0, `Validator im Image:\n${v.stdout}\n${v.stderr}`);

    const { publicKey } = crypto.generateKeyPairSync('ed25519');
    const daten = path.join(app, 'data');
    fs.mkdirSync(daten);
    const server = await starteNachbau(app, nachbauEnv({ port: zufallsPort(), daten, publicKey, secret: crypto.randomBytes(24).toString('hex') }));
    const basis = server.basis;
    try {
      const themen = await (await fetch(basis + '/api/themen')).json();
      assert.deepEqual(themen.welten.map((w) => w.nr), SEED_WELTEN);
      for (const w of themen.welten.filter((x) => AKTEN_WELTEN.has(x.nr))) for (const l of w.levels) assert.ok(l.akte && l.akte.url, `Akte mit URL für ${l.id}`);
      assert.ok(themen.werkzeugkarten.every((x) => x.url), 'Werkzeugkarten mit URL');
      const demo = JSON.parse(lies('seed/demo_materialien.json'));
      for (const p of demo.schueler) assert.equal((await fetch(`${basis}/akten/${p}`)).status, 200, `Demo-PDF ${p}`);
      for (const p of demo.lehrkraft) assert.equal((await fetch(`${basis}/lehrkraft/dateien/${p}`)).status, 200, `Demo-PDF ${p}`);
      assert.equal((await fetch(`${basis}/akten/Welt_0_Antike/KR_W0_Akte2_Caesars_Botschaft.pdf`)).status, 401, 'Akte ohne Anmeldung');
      const manifest = await (await fetch(basis + '/api/plattform')).json();
      assert.equal(manifest.id, 'kryptos');
      assert.equal(manifest.umfang.welten, SEED_WELTEN.length);
    } finally {
      await server.stop();
    }
  } finally {
    fs.rmSync(app, { recursive: true, force: true });
  }
});

// ── M9 Task 206: Build-Kontext ohne Geheimnisse, Dockerfile-Vorgaben, Neustart mit Daten, Vertragsprüfung ──

/** Alle Dateien des Arbeitsbaums (relativ, mit `/`), ohne .git; Ordner außerhalb des Kontexts ohne Ausnahme darunter werden übersprungen. */
function alleDateien(regeln = ignoreRegeln()) {
  const ausnahmen = regeln.filter((r) => r.ausnahme).map((r) => r.roh);
  const aus = [];
  const lauf = (rel) => {
    for (const e of fs.readdirSync(path.join(WURZEL, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (r === '.git') continue;
      if (e.isDirectory()) {
        if (!imKontext(r, regeln) && !ausnahmen.some((a) => a.startsWith(r + '/'))) continue;
        lauf(r);
      } else aus.push(r);
    }
  };
  lauf('');
  return aus;
}
const TEXT_ENDUNG = /\.(js|json|html|css|md|txt|svg|yml|yaml|sh|py|csv|pem|key|env)$|(^|\/)[^./]+$/;

test('Build-Kontext: keine Schlüssel, Geheimnisse, Datenbanken', () => {
  const regeln = ignoreRegeln();
  const verboten = /\.(pem|key|p12|pfx|db|db-wal|db-shm|sqlite3?)$|(^|\/)\.env|(^|\/)data\//;
  const kontext = alleDateien(regeln).filter((d) => imKontext(d, regeln));
  assert.ok(kontext.length > 100, 'Build-Kontext gelesen');
  assert.deepEqual(kontext.filter((d) => verboten.test(d)), []);
  const mitSchluessel = kontext.filter((d) => TEXT_ENDUNG.test(d) && fs.statSync(path.join(WURZEL, d)).size < 2e6 && /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(lies(d)));
  assert.deepEqual(mitSchluessel, []);
});

test('.dockerignore schließt *.pem, *.key, *.db*, .env* und data*/ aus – auch wenn sie später angelegt werden', () => {
  const regeln = ignoreRegeln();
  for (const rel of ['neu.pem', 'src/neu.pem', 'public/static/x/portal-schluessel.pem', 'neu.key', 'src/geheim.key', 'zert.p12', 'src/zert.pfx',
    'kryptos.db', 'src/kryptos.db', 'seed/kryptos.db-wal', 'kryptos.db-shm', 'data/kryptos.db', 'data-e2e/kryptos.db', 'data2/x.json',
    '.env', '.env.local', 'src/.env', 'public/.env.production', 'test/devportal/devportal.pem']) {
    assert.equal(imKontext(rel, regeln), false, `${rel} darf nie in den Build-Kontext`);
  }
  // Gegenprobe: normale Dateien bleiben drin
  for (const rel of ['src/verbund/konfig.js', 'public/static/js/shared/krypto.js', 'seed/welten/welt0.json']) assert.equal(imKontext(rel, regeln), true, rel);
});

test('Dockerfile/captain-definition: Port 80, DATA_DIR=/app/data, VOLUME, USER node, HEALTHCHECK /healthz, NODE_ENV=production, AUTH_MODUS=portal, kein ENV mit SESSION_SECRET/PORTAL_PUBLIC_KEY', () => {
  const df = lies('Dockerfile');
  const cap = JSON.parse(lies('captain-definition'));
  assert.equal(cap.schemaVersion, 2);
  assert.equal(cap.dockerfilePath, './Dockerfile');
  const letzteStufe = df.slice(df.lastIndexOf('\nFROM '));
  const env = (letzteStufe.match(/^ENV[\s\S]*?[^\\]\n/m) || [''])[0];
  for (const [k, v] of [['NODE_ENV', 'production'], ['PORT', '80'], ['DATA_DIR', '/app/data'], ['AUTH_MODUS', 'portal'], ['PLATTFORM_ID', 'kryptos'], ['TZ', 'Europe/Berlin']]) {
    assert.match(env, new RegExp(`\\b${k}=${v.replace(/[/.]/g, '\\$&')}\\b`), `ENV ${k}=${v}`);
  }
  assert.doesNotMatch(df, /^\s*(ENV|ARG)\b[^\n]*(SESSION_SECRET|PORTAL_PUBLIC_KEY|PRIVATE)/m, 'keine Geheimnisse im Dockerfile');
  assert.match(letzteStufe, /^EXPOSE 80$/m);
  assert.match(letzteStufe, /^VOLUME \["\/app\/data"\]$/m);
  assert.match(letzteStufe, /^USER node$/m);
  assert.match(letzteStufe, /chown -R node:node \/app\/data/);
  assert.match(letzteStufe, /^HEALTHCHECK[\s\S]*\/healthz/m);
  assert.match(letzteStufe, /^CMD \["node", "src\/server\.js"\]$/m);
  // USER node steht nach allen RUN-Anweisungen der Laufzeit-Stufe (sonst liefe etwas als root nach dem Wechsel)
  assert.ok(letzteStufe.lastIndexOf('\nRUN ') < letzteStufe.indexOf('\nUSER node'), 'USER node nach den RUN-Anweisungen');
});

/** Pfade + Größen eines Baums (ohne node_modules-Verweis und ohne ausgelassene Ordner). */
function baumStand(wurzel, ohne) {
  const aus = [];
  const lauf = (rel) => {
    for (const e of fs.readdirSync(path.join(wurzel, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (ohne.includes(r)) continue;
      if (e.isDirectory()) lauf(r);
      else aus.push(`${r}:${fs.lstatSync(path.join(wurzel, r)).size}`);
    }
  };
  lauf('');
  return aus.sort();
}

/** Schüler-Anmeldung über /sso/start → /sso/ende mit einem selbst signierten Portal-Token; liefert den Cookie-Kopf. */
async function anmelden(basis, privateKey, { sub = 's:7', name = 'Mika R.', kurse = [{ id: 'k:1', name: 'LK 13 (eA)', rolle: 'mitglied' }] } = {}) {
  const { signiere } = require('../src/jwt');
  const cookies = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map((c) => c.split(';')[0]).filter((c) => !/=$/.test(c));
  const r1 = await fetch(`${basis}/sso/start?ziel=${encodeURIComponent('/spiel')}`, { redirect: 'manual' });
  assert.equal(r1.status, 302);
  const ziel = new URL(r1.headers.get('location'));
  const iat = Math.floor(Date.now() / 1000);
  const token = signiere({ iss: 'https://portal.example', aud: 'kryptos', sub, rolle: 'schueler', name, kurse, iat, exp: iat + 90, jti: crypto.randomUUID(), v: 1 }, privateKey);
  const q = new URLSearchParams({ token, state: ziel.searchParams.get('state'), ziel: ziel.searchParams.get('ziel') || '/spiel' });
  const r2 = await fetch(`${basis}/sso/ende?${q}`, { redirect: 'manual', headers: { cookie: cookies(r1).join('; ') } });
  assert.equal(r2.status, 302, `/sso/ende: ${r2.status}`);
  const c = cookies(r2);
  assert.ok(c.some((x) => x.startsWith('kr_s=')), 'Schüler-Cookie gesetzt');
  return c.join('; ');
}

test('Image-Nachbau: zweiter Start auf demselben DATA_DIR behält den Lernstand; vertrag_pruefen.js → Exit 0', { timeout: 90000 }, async () => {
  const app = baueNachbau();
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const daten = path.join(app, 'data');
    fs.mkdirSync(daten);
    const env = nachbauEnv({ port: zufallsPort(), daten, publicKey, secret: crypto.randomBytes(24).toString('hex') });
    const vorher = baumStand(app, ['data', 'node_modules']);
    const aufgabe = JSON.parse(lies('seed/welten/welt0.json')).aufgaben.find((a) => a.id === 'W0-L1-06');

    // 1. Start: Konto über /sso/ende, Aufgabe lösen
    let server = await starteNachbau(app, env);
    let cookie;
    try {
      assert.match(server.log(), /Konfiguration: \{/, 'Startzeile');
      cookie = await anmelden(server.basis, privateKey);
      const r = await fetch(`${server.basis}/api/aufgaben/${aufgabe.id}/pruefen`, {
        method: 'POST',
        headers: { cookie, origin: server.basis, 'content-type': 'application/json' },
        body: JSON.stringify({ antwort: aufgabe.loesung.text })
      });
      const b = await r.json();
      assert.equal(r.status, 200, JSON.stringify(b));
      assert.equal(b.ok, true, JSON.stringify(b));
    } finally {
      await server.stop();
    }
    assert.ok(fs.existsSync(path.join(daten, 'kryptos.db')), 'Datenbank in DATA_DIR');

    // 2. Neustart auf demselben DATA_DIR (wie Update mit bestehendem Volume)
    server = await starteNachbau(app, { ...env, PORT: String(zufallsPort()) });
    try {
      const h = await (await fetch(`${server.basis}/healthz`)).json();
      assert.equal(h.version, JSON.parse(lies('package.json')).version);
      const profil = await (await fetch(`${server.basis}/api/profil`, { headers: { cookie } })).json();
      assert.ok(profil.punkte && profil.punkte.gesamt > 0 && profil.geloest === 1, `Lernstand nach dem Neustart: ${JSON.stringify(profil).slice(0, 300)}`);

      // 3. Vertragsprüfung gegen den laufenden Nachbau
      const vp = spawnSync(process.execPath, [path.join(WURZEL, 'scripts', 'vertrag_pruefen.js'), server.basis], { encoding: 'utf8', timeout: 30000 });
      assert.equal(vp.status, 0, vp.stdout + vp.stderr);
      assert.match(vp.stdout, /erfüllt Vertrag v1\.3 .* Anmeldung: portal/);
      assert.doesNotMatch(vp.stdout, /⚠/, 'v1.3: keine Hinweise (SSO-Einstieg leitet zum Portal)');
      const log = server.log();
      assert.ok(!log.includes(env.SESSION_SECRET) && !log.includes('BEGIN'), 'keine Geheimnisse im Log');
    } finally {
      await server.stop();
    }

    // 4. Der Server schreibt nur in DATA_DIR (Review Focus 4)
    assert.deepEqual(baumStand(app, ['data', 'node_modules']), vorher);
  } finally {
    fs.rmSync(app, { recursive: true, force: true });
  }
});
