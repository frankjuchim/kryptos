#!/usr/bin/env node
'use strict';
/*
 * Ende-zu-Ende mit dem echten Portal (Plan M9 Task 212, E155, E166; INTEGRATION §6): eine lokale Kopie von labs
 * (LABS_DIR, z. B. per `git -C /home/user/labs archive` im Scratchpad, mit `npm ci`) und Kryptos laufen als Kindprozesse.
 *   Portal: Admin trägt Kryptos ein (Manifest + /healthz, Rücksprung bestätigen) → Lehrkraft fragt Zugang an → Freigabe
 *   + Freischaltung Kryptos → Kurs „Informatik LK 13“ mit Kryptos → Schüler tritt mit Kurscode bei → „Weiter zu Kryptos“
 *   → /spiel; Lehrkraft meldet sich auf Kryptos über das Portal an → /lehrer; Mika löst W0-L1-03; Portal benennt den Kurs
 *   um (Verbund kurs-aendern), lädt den Lernstand (Kennzahlen ohne Codes), entfernt Mika (Verbund loeschen → in Kryptos
 *   keine Zeile mehr); „Überall abmelden“ in Kryptos beendet auch die Portal-Sitzung.
 * Kryptos läuft mit NODE_ENV=production und http://localhost (E149-Ausnahme); PORTAL_PUBLIC_KEY wird zur Startzeit des
 * Tests vom Portal geholt (nur hier, nie im Server). Nicht in CI (labs ist privat). labs wird nie verändert.
 *
 * Aufruf: LABS_DIR=<pfad> npm run e2e:portal [-- --bilder <ordner>]   (ohne LABS_DIR: „übersprungen“, Exit 0)
 * --bilder: portal_beitritt.png, portal_code.png, portal_weiter.png (1280 × 800, Kurscode und persönlicher Code maskiert)
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const H = require('./hilfen');

const LABS_DIR = process.env.LABS_DIR ? path.resolve(process.env.LABS_DIR) : null;
const BILDER = (() => {
  const i = process.argv.indexOf('--bilder');
  return i > 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null;
})();
const ADMIN_PW = 'e2e-admin-passwort-1';
const LK_PW = 'lehrkraft-passwort-1';
const GROSS = { width: 1280, height: 800 };

/** Kindprozess starten und auf /healthz warten. */
async function starteProzess(name, skript, env, basis) {
  const kind = spawn(process.execPath, [skript], { env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  kind.stdout.on('data', (d) => (log += d));
  kind.stderr.on('data', (d) => (log += d));
  const stop = async () => {
    if (kind.exitCode === null) {
      kind.kill('SIGTERM');
      await new Promise((r) => kind.once('exit', r));
    }
  };
  const bis = Date.now() + 20000;
  while (Date.now() < bis && kind.exitCode === null) {
    try {
      if ((await fetch(basis + '/healthz')).ok) return { stop, log: () => log };
    } catch {
      /* noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  await stop();
  throw new Error(`${name} startet nicht:\n${log}`);
}

/**
 * Zeilen mit einem Wert in irgendeiner TEXT-Spalte (gleich bzw. enthalten) – wie test/datenschutz.test.js. Ausgenommen ist
 * der Löschvermerk `loeschungen` (Art, Kennung, Zeit – ohne Namen; TECHNIK §7.3), der genau diese Kennung festhält.
 */
function fundstellen(dbDatei, wert, { enthalten = false } = {}) {
  const Database = require('better-sqlite3');
  const db = new Database(dbDatei, { readonly: true, fileMustExist: true });
  try {
    const treffer = [];
    for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'loeschungen'").all()) {
      for (const sp of db.prepare(`PRAGMA table_info("${name}")`).all()) {
        if (!/TEXT|^$/i.test(sp.type)) continue;
        const sql = enthalten ? `SELECT COUNT(*) AS n FROM "${name}" WHERE instr("${sp.name}", ?) > 0` : `SELECT COUNT(*) AS n FROM "${name}" WHERE "${sp.name}" = ?`;
        if (db.prepare(sql).get(wert).n) treffer.push(`${name}.${sp.name}`);
      }
    }
    return treffer;
  } finally {
    db.close();
  }
}

async function main() {
  if (!LABS_DIR) {
    console.log('Ende-zu-Ende mit dem Portal: übersprungen (LABS_DIR nicht gesetzt).');
    return;
  }
  assert.ok(fs.existsSync(path.join(LABS_DIR, 'src', 'server.js')), `LABS_DIR ohne src/server.js: ${LABS_DIR}`);
  assert.ok(fs.existsSync(path.join(LABS_DIR, 'node_modules')), `LABS_DIR ohne node_modules (npm ci im Scratchpad): ${LABS_DIR}`);
  if (BILDER) fs.mkdirSync(BILDER, { recursive: true });

  const { chromium } = require('playwright-core');
  const [kPort, pPort] = await H.freiePorts();
  const portalUrl = `http://localhost:${pPort}`;
  const basis = `http://localhost:${kPort}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kryptos-portal-e2e-'));
  const portalDaten = path.join(tmp, 'portal');
  const kryptosDaten = path.join(tmp, 'kryptos');
  const prozesse = [];
  let browser = null;
  const fehler = [];
  try {
    /* 1. Portal */
    const portal = await starteProzess(
      'Portal',
      path.join(LABS_DIR, 'src', 'server.js'),
      { PORT: String(pPort), DATA_DIR: portalDaten, PORTAL_URL: portalUrl, ADMIN_EMAIL: 'admin', ADMIN_PASSWORD: ADMIN_PW, SESSION_SECRET: crypto.randomBytes(24).toString('hex'), ERLAUBE_HTTP: '1', PORTAL_SCRYPT_N: '1024', TRUST_PROXY: '0' },
      portalUrl
    );
    prozesse.push(portal);

    /* 2. Kryptos mit dem öffentlichen Schlüssel des Portals (zur Startzeit des Tests geholt, E166) */
    const pem = await (await fetch(portalUrl + '/sso/schluessel.pem')).text();
    assert.match(pem, /BEGIN PUBLIC KEY/);
    const secret = crypto.randomBytes(24).toString('hex');
    const kryptos = await starteProzess(
      'Kryptos',
      path.join(H.WURZEL, 'src', 'server.js'),
      { NODE_ENV: 'production', PORT: String(kPort), DATA_DIR: kryptosDaten, PLATTFORM_URL: basis, PORTAL_URL: portalUrl, PORTAL_PUBLIC_KEY: pem, SESSION_SECRET: secret, SEED_DIR: path.join(H.WURZEL, 'seed'), TRUST_PROXY: 'false' },
      basis
    );
    prozesse.push(kryptos);

    /* 3. Vertragsprüfung gegen das laufende Kryptos */
    const vp = spawnSync(process.execPath, [path.join(H.WURZEL, 'scripts', 'vertrag_pruefen.js'), basis], { encoding: 'utf8', timeout: 30000 });
    assert.equal(vp.status, 0, vp.stdout + vp.stderr);
    assert.match(vp.stdout, /erfüllt Vertrag v1\.2 .* Anmeldung: portal/);

    browser = await chromium.launch({ executablePath: H.chromiumPfad() });
    const seite = async (name) => {
      const c = await browser.newContext({ viewport: GROSS, locale: 'de-DE' });
      const p = await c.newPage();
      H.beobachte(p, name, fehler);
      return p;
    };

    /* 4. Admin trägt Kryptos ein (Ampel grün), bestätigt die Rücksprung-Adresse */
    const admin = await seite('Admin');
    await admin.goto(portalUrl + '/#lehrkraft');
    await admin.click('#tab-lehrkraft');
    await admin.fill('#l-email', 'admin');
    await admin.fill('#l-passwort', ADMIN_PW);
    await admin.click('#form-lehrkraft button[type="submit"]');
    await admin.waitForURL(/\/lehrkraft/);
    await admin.goto(portalUrl + '/lehrkraft#/admin/plattformen');
    await admin.fill('input[name="basis"]', basis);
    await admin.click('text=Manifest abrufen und eintragen');
    await admin.waitForSelector('text=Vorschlag');
    assert.ok(await admin.locator(`text=${basis}/sso/ende`).count(), 'Vorschlag für den Rücksprung');
    await admin.click('button:has-text("Vorschlag")');
    await admin.waitForSelector('text=Noch nicht freigegeben', { state: 'detached' });
    await admin.waitForSelector('.ampel.ok');

    /* 5. Lehrkraft fragt Zugang an, Admin gibt frei und schaltet Kryptos frei, Lehrkraft legt den Kurs an */
    const lk = await seite('Lehrkraft');
    await lk.goto(portalUrl + '/');
    await lk.click('#tab-lehrkraft');
    await lk.click('summary');
    await lk.fill('#r-name', 'Frau M.');
    await lk.fill('#r-email', 'frau.m@schule.example');
    await lk.fill('#r-schule', 'Beispielschule');
    await lk.fill('#r-passwort', LK_PW);
    await lk.fill('#r-nachricht', 'Bitte Kryptos freischalten.');
    await lk.click('#form-registrieren button[type="submit"]');
    await lk.waitForSelector('text=Ihre Anfrage wird geprüft');
    await admin.goto(portalUrl + '/lehrkraft#/admin/lehrkraefte');
    await admin.click('tr:has-text("frau.m@schule.example") >> text=Freigeben');
    await admin.waitForSelector('tr:has-text("frau.m@schule.example") >> text=Deaktivieren');
    await admin.check('tr:has-text("frau.m@schule.example") >> label:has-text("Kryptos") >> input');
    await admin.waitForSelector('text=Kryptos: freigeschaltet');
    await lk.click('#tab-lehrkraft');
    await lk.fill('#l-email', 'frau.m@schule.example');
    await lk.fill('#l-passwort', LK_PW);
    await lk.click('#form-lehrkraft button[type="submit"]');
    await lk.waitForURL(/\/lehrkraft/);
    await lk.fill('#k-name', 'Informatik LK 13');
    await lk.click('#form-neu button[type="submit"]');
    await lk.waitForURL(/#\/kurs\/\d+/);
    const portalKursUrl = lk.url();
    const kurscode = (await lk.textContent('.kurskopf .code-gross')).trim();
    assert.match(kurscode, /^[A-HJ-NP-Z2-9]{6}$/);

    /* 6. Mika tritt mit dem Kurscode bei und wechselt per SSO zu Kryptos */
    const mika = await seite('Mika R.');
    await mika.goto(`${portalUrl}/?kurs=${kurscode}`);
    await mika.waitForSelector('#kurs-info:has-text("Informatik LK 13")');
    await mika.fill('#b-name', 'Mika R.');
    if (BILDER) await mika.screenshot({ path: path.join(BILDER, 'portal_beitritt.png'), mask: [mika.locator('#b-kurscode, #kurs-info .code, .code, .code-gross')], maskColor: '#14213D' });
    await mika.click('#form-beitreten button[type="submit"]');
    await mika.waitForSelector('#code-box:not([hidden])');
    assert.match((await mika.textContent('#code-wert')).trim(), /^[A-HJ-NP-Z]{3}-[2-9]{3}$/);
    if (BILDER) await mika.screenshot({ path: path.join(BILDER, 'portal_code.png'), mask: [mika.locator('#code-wert')], maskColor: '#14213D' });
    await mika.check('#code-ok');
    await mika.click('#code-weiter');
    await mika.waitForURL(/\/schueler$/);
    const weiter = mika.locator('a.weiter:has-text("Kryptos")');
    await weiter.waitFor();
    if (BILDER) await mika.screenshot({ path: path.join(BILDER, 'portal_weiter.png') });
    await weiter.click();
    await mika.waitForURL((u) => u.toString().startsWith(basis + '/spiel'));
    await mika.waitForLoadState('networkidle');
    await mika.locator('.zeitleiste, #zeitleiste, [data-ansicht="zeitleiste"]').first().waitFor();
    const sitzung = await mika.evaluate(async () => (await fetch('/api/sitzung')).json());
    assert.equal(sitzung.rolle, 'schueler');
    assert.equal(sitzung.name, 'Mika R.');
    assert.equal(sitzung.kurs && sitzung.kurs.name, 'Informatik LK 13');

    /* 7. Lehrkraft meldet sich auf Kryptos über das Portal an (Start auf der Plattform) → /lehrer mit dem Kurs */
    await lk.goto(basis + '/');
    await lk.click('a.anmelden');
    await lk.waitForURL((u) => u.toString().startsWith(basis + '/lehrer'));
    await H.gehe(lk, basis + '/lehrer#/');
    await lk.locator('table.kurs-tabelle a', { hasText: 'Informatik LK 13' }).waitFor();

    // Mika löst W0-L1-03 (alle Welten sind im neuen Kurs frei)
    const w0 = JSON.parse(fs.readFileSync(path.join(H.WURZEL, 'seed', 'welten', 'welt0.json'), 'utf8'));
    const aufgabe = w0.aufgaben.find((a) => a.id === 'W0-L1-03');
    const geloest = await mika.evaluate(async (a) => {
      const r = await fetch(`/api/aufgaben/${a.id}/pruefen`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ antwort: a.antwort }) });
      return r.json();
    }, { id: aufgabe.id, antwort: aufgabe.loesung.text });
    assert.equal(geloest.ok, true, JSON.stringify(geloest));

    /* 8. Portal: Kurs umbenennen → Verbund kurs-aendern; Lernstand laden (Kennzahlen, keine Codes) */
    await lk.goto(portalKursUrl);
    const nameForm = lk.locator('form:has(input[aria-label="Kursname"])');
    await nameForm.locator('input').fill('Informatik LK 13 (Kryptologie)');
    await nameForm.locator('button').click();
    await lk.waitForSelector('text=Kurs umbenannt.');
    let umbenannt = false;
    for (let i = 0; i < 50 && !umbenannt; i++) {
      await H.gehe(lk, basis + '/lehrer#/');
      umbenannt = (await lk.locator('table.kurs-tabelle a', { hasText: 'Informatik LK 13 (Kryptologie)' }).count()) > 0;
      if (!umbenannt) await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(umbenannt, 'Kursname in Kryptos nach kurs-aendern');
    await lk.goto(portalKursUrl);
    await lk.click('text=Lernstand auf Kryptos laden');
    // nur die Kennzahlen-Tabelle unter dem Knopf (die Schülerliste des Portals zeigt der Lehrkraft die Codes)
    const kennzahlen = lk.locator('div.abstand:has(> button:has-text("Lernstand auf Kryptos laden")) table');
    await kennzahlen.locator('td', { hasText: 'Mika R.' }).first().waitFor();
    const tabelle = await kennzahlen.textContent();
    assert.doesNotMatch(tabelle, /[A-HJ-NP-Z]{3}-[2-9]{3}/, 'kein persönlicher Code in den Kennzahlen');
    assert.match(tabelle, /Mika R\.\s*\d+/, 'Punkte in den Kennzahlen');

    /* 9. Portal: Mika aus dem Kurs entfernen → Konto ohne Kurs → Verbund loeschen → in Kryptos keine Zeile mehr */
    const dbDatei = path.join(kryptosDaten, 'kryptos.db');
    const Database = require('better-sqlite3');
    const db = new Database(dbDatei, { readonly: true });
    const mikaSub = db.prepare("SELECT sub FROM konten WHERE name = 'Mika R.'").get().sub;
    db.close();
    assert.match(mikaSub, /^s:\d+$/);
    await lk.reload();
    await lk.locator('tr:has-text("Mika R.") button:has-text("Entfernen")').first().click();
    await lk.locator('dialog[open] button:has-text("Entfernen")').click();
    await lk.waitForSelector('tr:has-text("Mika R.") button:has-text("Entfernen")', { state: 'detached' });
    let weg = false;
    for (let i = 0; i < 100 && !weg; i++) {
      weg = fundstellen(dbDatei, mikaSub).length === 0 && fundstellen(dbDatei, 'Mika R.', { enthalten: true }).length === 0;
      if (!weg) await new Promise((r) => setTimeout(r, 200));
    }
    const vermerk = new Database(dbDatei, { readonly: true });
    assert.equal(vermerk.prepare('SELECT COUNT(*) AS n FROM loeschungen WHERE schluessel = ?').get(mikaSub).n, weg ? 1 : 0, 'Löschvermerk mit Kennung');
    vermerk.close();
    assert.ok(weg, `Mika in Kryptos noch vorhanden: ${fundstellen(dbDatei, mikaSub).concat(fundstellen(dbDatei, 'Mika R.', { enthalten: true })).join(', ')}`);
    // Verbund-Aufträge im Portal: alle erledigt
    await admin.goto(portalUrl + '/lehrkraft#/admin/verbund');
    await admin.waitForSelector('h1:has-text("Verbund-Aufträge")');
    const status = await admin.locator('tbody tr td:nth-child(5) .chip').allTextContents();
    assert.ok(status.length >= 2, `Aufträge: ${status.join(', ')}`);
    assert.ok(status.every((s) => s === 'erledigt'), `Aufträge: ${status.join(', ')}`);
    const zwecke = await admin.locator('tbody tr td:nth-child(3)').allTextContents();
    for (const z of ['kurs-aendern', 'loeschen']) assert.ok(zwecke.includes(z), `Auftrag ${z}: ${zwecke.join(', ')}`);

    /* 10. „Überall abmelden“ in Kryptos (Lehrkraft) → Portal /sso/abmelden → Portal-Sitzung beendet */
    await H.gehe(lk, basis + '/lehrer#/');
    const ueber = [];
    lk.on('request', (r) => r.isNavigationRequest() && ueber.push(r.url()));
    await lk.locator('details.menue > summary').click();
    await lk.locator('button.abmelden-ueberall').click();
    await lk.waitForURL((u) => !u.toString().startsWith(basis + '/lehrer'));
    await lk.waitForLoadState('networkidle');
    assert.ok(ueber.some((u) => u.startsWith(portalUrl + '/sso/abmelden?ruecksprung=')), `über das Portal abgemeldet: ${ueber.join(' → ')}`);
    // Portal-Sitzung beendet: Aufruf mit den Cookies des Browser-Kontexts der Lehrkraft
    const st = (await lk.context().request.get(portalUrl + '/api/lehrkraft/ich')).status();
    assert.equal(st, 401, `Portal-Sitzung nach „Überall abmelden“ noch aktiv (${st})`);

    // Konsolen- und CSP-Fehler auf beiden Seiten
    assert.deepEqual(fehler, [], 'Fehler im Browser:\n  ' + fehler.join('\n  '));
    console.log(`Ende-zu-Ende mit dem Portal: alles grün (labs ${LABS_DIR}).`);
  } finally {
    if (browser) await browser.close();
    for (const p of prozesse.reverse()) await p.stop();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('✘ Ende-zu-Ende mit dem Portal fehlgeschlagen:', e.stack || e.message);
  process.exit(1);
});
