#!/usr/bin/env node
'use strict';
/*
 * End-to-End-Test (Playwright, Chromium): kompletter Durchlauf mit den Beispielaufgaben (test/fixtures/welt_beispiel.json).
 *   Lehrkraft registriert sich → Superadmin gibt frei → Kurs anlegen → Schüler tritt per Link bei → löst alle Aufgaben
 *   über die echte Oberfläche (jede Interaktionsart) → Training → Boss-Kampf → Profil/Scoreboard/Kata → Beamer-Board
 *   → Lehrkraft-Auswertung → Superadmin-Verwaltung. Screenshots (iPad 1024×768 und Smartphone 390×844) nach docs/.
 *
 * Aufruf: npm run e2e   (Chromium: PLAYWRIGHT_BROWSERS_PATH oder CHROMIUM_PATH; Standard /opt/pw-browsers/…)
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

const APP = path.join(__dirname, '..', '..');
const DOCS = path.join(APP, 'docs');
const PORT = 3000 + Math.floor(Math.random() * 2000) + 2000;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_PW = 'e2e-admin-passwort-1';

function chromiumPfad() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const basis = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (fs.existsSync(basis)) {
    for (const d of fs.readdirSync(basis).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      const p = path.join(basis, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined; // Playwright-Standard
}

async function starteServer() {
  const daten = fs.mkdtempSync(path.join(os.tmpdir(), 'aql-e2e-'));
  const proc = spawn(process.execPath, ['src/server.js'], {
    cwd: APP,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: daten,
      ADMIN_EMAIL: 'admin',
      ADMIN_PASSWORD: ADMIN_PW,
      SESSION_SECRET: 'e2e-geheimnis-0123456789',
      TRUST_PROXY: 'false',
      WELT_DATEIEN: path.join(APP, 'test', 'fixtures', 'welt_beispiel.json')
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  proc.stdout.on('data', (d) => (log += d));
  proc.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(BASE + '/healthz');
      if (r.ok) return { proc, log: () => log };
    } catch {
      /* noch nicht bereit */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('Server startet nicht:\n' + log);
}

const fehlerListe = [];
function beobachte(page, name) {
  page.on('pageerror', (e) => fehlerListe.push(`[${name}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource: the server responded with a status of (400|401|403|404|409|429)/.test(t)) return; // erwartete API-Antworten
    fehlerListe.push(`[${name}] console: ${t}`);
  });
}

let schritt = 0;
async function foto(page, name, opt = {}) {
  const datei = path.join(DOCS, `${name}.png`);
  await page.waitForTimeout(150);
  // Für ganzseitige Bilder die „klebende“ Aktionsleiste an ihren Platz im Fluss setzen (nur für das Foto)
  if (opt.voll !== false) await page.evaluate(() => document.querySelectorAll('.aktionen').forEach((e) => (e.style.position = 'static')));
  await page.screenshot({ path: datei, fullPage: opt.voll !== false });
  schritt++;
  console.log(`  📸 ${path.relative(APP, datei)}`);
}

async function bestaetige(page) {
  const d = page.locator('dialog[open]');
  await d.waitFor();
  await d.locator('button').first().click();
}

/* ---------- Interaktionen über die Oberfläche ---------- */

async function oeffneAufgabe(page, id) {
  await page.goto(`${BASE}/spiel#/aufgabe/${id}`);
  await page.locator('.aufgabe-kopf h1').waitFor();
}

async function luecke(page, id, wert) {
  const el = page.locator(`[aria-label="Lücke ${id}"]`);
  if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption(wert);
  else await el.fill(wert);
}

async function pruefen(page) {
  const antwort = page.waitForResponse((r) => r.url().includes('/pruefen') && r.request().method() === 'POST');
  await page.locator('#pruefen').click();
  return (await antwort).json();
}

async function schrittKlick(page, locator) {
  const antwort = page.waitForResponse((r) => r.url().includes('/pruefen'));
  await locator.click();
  return (await antwort).json();
}

async function erwarteGeloest(page) {
  await page.locator('.feedback.ok').waitFor({ timeout: 5000 });
  await page.locator('.erklaerung').waitFor();
}

const LOESER = {
  async 'W9-L1-01'(page) {
    await luecke(page, 'g1', '9');
    await luecke(page, 'g2', '2'); // absichtlich falsch
    await luecke(page, 'g3', '4');
    await luecke(page, 'g4', 'length');
    const r = await pruefen(page);
    assert.equal(r.ok, false);
    await page.locator('.feedback.falsch').waitFor();
    await page.locator('[aria-label="Lücke g2"].falsch').waitFor();
    await foto(page, 'aufgabe_gaps_feedback');
    await luecke(page, 'g2', '3');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L1-02'(page) {
    await page.getByRole('button', { name: /Tipp/ }).click();
    await page.locator('.tipp-box').waitFor();
    for (const [k, v] of Object.entries({ c1: '1', c2: '3', c3: '6', art: 'zählschleife', op: '<' })) await luecke(page, k, v);
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L1-03'(page) {
    await luecke(page, 'g1', '≤');
    await luecke(page, 'g2', 'anzahl');
    await foto(page, 'aufgabe_struktogramm');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L1-04'(page) {
    await page.locator('.option', { hasText: 'c Held(name: Zeichenkette)' }).click();
    await foto(page, 'aufgabe_choice');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L1-05'(page) {
    await page.locator('.option', { hasText: 'liefert 2' }).click();
    await page.locator('.option', { hasText: 'r[1][2] == 8' }).click();
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L1-06'(page) {
    for (const [knoten, begriff] of [['Knoten 8', 'Wurzel'], ['Knoten 13', 'Blatt'], ['Knoten 6', 'innerer Knoten']]) {
      await page.locator('.match-zeile', { hasText: knoten }).getByRole('button', { name: begriff, exact: true }).click();
    }
    await foto(page, 'aufgabe_match');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-01'(page) {
    for (const t of ['int m = r[0];', 'for (int i = 1; i < r.length; i++) {', 'if (r[i] > m) m = r[i];', '}', 'return m;']) {
      await page.locator('.puzzle-liste').first().locator('.puzzle-teil .txt', { hasText: t }).first().click();
    }
    await foto(page, 'aufgabe_order');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-02'(page) {
    // Bug-Hunt gestuft: Teil b) (verrät die Zeile) ist erst nach richtigem Teil a) sichtbar
    const g1 = page.locator('[aria-label="Lücke g1"]');
    assert.equal(await g1.isVisible(), false, 'Teil b) darf vor Teil a) nicht sichtbar sein');
    const teilA = async () => {
      const antwort = page.waitForResponse((r) => r.url().includes('/pruefen') && r.request().method() === 'POST');
      await page.locator('.stufe-box button').click();
      return (await antwort).json();
    };
    await page.locator('.code .zeile.waehlbar').nth(0).click();
    assert.equal((await teilA()).ok, false);
    assert.equal(await g1.isVisible(), false);
    await page.locator('.code .zeile.waehlbar').nth(0).click();
    await page.locator('.code .zeile.waehlbar').nth(2).click();
    assert.equal((await teilA()).ok, true);
    await g1.waitFor({ state: 'visible' });
    await luecke(page, 'g1', '<');
    await foto(page, 'aufgabe_lines_bughunt');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-03'(page) {
    const folge = ['', 'L', 'LL', 'LR', 'LRL', 'LRR', 'R', 'RR', 'RRL'];
    // ein falscher Schritt (zählt als Fehlversuch) …
    let r = await schrittKlick(page, page.locator('g.knoten[data-pfad="R"]'));
    assert.equal(r.ok, false);
    for (const p of folge) {
      r = await schrittKlick(page, page.locator(`g.knoten[data-pfad="${p}"]`));
      assert.equal(r.ok, true, 'Schritt ' + p);
      if (p === 'LR') await foto(page, 'aufgabe_tree_klick');
    }
    assert.equal(r.geloest, true);
  },
  async 'W9-L2-04'(page) {
    for (const [pfad, wert] of [['LR', '4'], ['RR', '9'], ['LL', '1']]) {
      await page.locator(`g.slot[aria-label^="leere Stelle ${pfad} "]`).click();
      await page.locator('.chip-wert', { hasText: wert }).click();
    }
    await foto(page, 'aufgabe_tree_bauen');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-05'(page) {
    const zelle = (i) => page.locator('button.zelle').nth(i);
    await zelle(0).click();
    await foto(page, 'aufgabe_array_tausch');
    await schrittKlick(page, zelle(1));
    await zelle(1).click();
    await schrittKlick(page, zelle(2));
    await zelle(2).click();
    const r = await schrittKlick(page, zelle(3));
    assert.equal(r.geloest, true, 'letzter Tausch löst die Aufgabe');
  },
  async 'W9-L2-06'(page) {
    for (const i of [4, 7]) await schrittKlick(page, page.locator('button.zelle').nth(i));
    await foto(page, 'aufgabe_array_klick');
    const r = await schrittKlick(page, page.locator('button.zelle').nth(5));
    assert.equal(r.geloest, true);
  },
  async 'W9-L2-07'(page) {
    for (const [z, s] of [[0, 1], [0, 3], [1, 0], [1, 2], [2, 2]]) await page.locator(`td[data-r="${z}"][data-c="${s}"]`).click();
    await foto(page, 'aufgabe_grid');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-08'(page) {
    await page.getByRole('button', { name: '3 entfernen' }).click();
    const eingabe = page.getByRole('textbox', { name: 'Neues Element' });
    await eingabe.fill('5');
    await eingabe.press('Enter');
    await eingabe.fill('1');
    await page.getByRole('button', { name: /enqueue/ }).click();
    await foto(page, 'aufgabe_adtsim');
    assert.equal((await pruefen(page)).ok, true);
  },
  async 'W9-L2-09'(page) {
    // Lösung zeigen statt lösen (0 Punkte)
    await page.getByRole('button', { name: /Lösung zeigen/ }).click();
    await bestaetige(page);
    await page.locator('.feedback.info').waitFor();
    await foto(page, 'aufgabe_loesung_angezeigt');
    return 'angesehen';
  }
};

async function bossAntwort(page, id) {
  switch (id) {
    case 'W9-B-01':
      return luecke(page, 'g1', '3');
    case 'W9-B-02':
      return luecke(page, 'g1', '2');
    case 'W9-B-06':
      return luecke(page, 'g1', '3');
    case 'W9-B-03':
      return page.locator('.option', { hasText: 'equals' }).click();
    case 'W9-B-04': {
      const e = page.getByRole('textbox', { name: 'Neues Element' });
      await e.fill('1');
      await e.press('Enter');
      await e.fill('3');
      return e.press('Enter');
    }
    case 'W9-B-05':
      for (const p of ['L', '', 'R']) await page.locator(`g.knoten[data-pfad="${p}"]`).click();
      return undefined;
    default:
      throw new Error('unbekannte Boss-Aufgabe ' + id);
  }
}

/* ---------- Ablauf ---------- */

(async () => {
  fs.mkdirSync(DOCS, { recursive: true });
  const server = await starteServer();
  const browser = await chromium.launch({ executablePath: chromiumPfad() });
  const IPAD = { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, hasTouch: true };
  const HANDY = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  try {
    /* 1) Lehrkraft beantragt Zugang */
    console.log('1) Lehrkraft registriert sich');
    const lkCtx = await browser.newContext(IPAD);
    const lk = await lkCtx.newPage();
    beobachte(lk, 'lehrkraft');
    await lk.goto(BASE + '/lehrer');
    await lk.fill('#r-name', 'Frau Beispiel');
    await lk.fill('#r-mail', 'beispiel@schule.de');
    await lk.fill('#r-schule', 'Max-Planck-Gymnasium');
    await lk.fill('#r-pw', 'lehrkraft-passwort-1');
    await lk.fill('#r-msg', 'LK Informatik, Abitur 2027');
    await lk.getByRole('button', { name: 'Zugang beantragen' }).click();
    await lk.locator('.callout.ok').waitFor();
    await foto(lk, 'lehrkraft_registrierung');

    /* 2) Superadmin gibt frei */
    console.log('2) Superadmin gibt frei');
    const suCtx = await browser.newContext(IPAD);
    const su = await suCtx.newPage();
    beobachte(su, 'superadmin');
    await su.goto(BASE + '/lehrer');
    await su.fill('#l-mail', 'admin');
    await su.fill('#l-pw', ADMIN_PW);
    await su.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await su.getByRole('link', { name: /Verwaltung/ }).click();
    await su.locator('.callout.gold', { hasText: 'Frau Beispiel' }).waitFor();
    await foto(su, 'superadmin_anfragen');
    await su.getByRole('button', { name: '✔ Freigeben' }).click();
    await bestaetige(su);
    await su.locator('text=Keine offenen Anfragen.').waitFor();

    /* 3) Lehrkraft meldet sich an, legt Kurs an */
    console.log('3) Kurs anlegen');
    await lk.fill('#l-mail', 'beispiel@schule.de');
    await lk.fill('#l-pw', 'lehrkraft-passwort-1');
    await lk.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await lk.fill('#k-name', 'LK Informatik 13');
    await lk.getByRole('button', { name: '＋ Anlegen' }).click();
    await lk.locator('img.qr').waitFor();
    await lk.waitForFunction(() => document.querySelector('img.qr').complete && document.querySelector('img.qr').naturalWidth > 0);
    const kurscode = (await lk.locator('h1 .pill').textContent()).trim();
    assert.match(kurscode, /^[A-Z2-9]{6}$/);
    await foto(lk, 'lehrkraft_beitritt_qr');
    await lk.getByRole('tab', { name: /Einstellungen/ }).click();
    await lk.locator('#e-boss').selectOption('offen');
    await lk.getByText('Beamer-Board aktiv').click();
    await lk.getByRole('button', { name: 'Speichern' }).click();
    await lk.locator('#toast:not([hidden])', { hasText: 'Gespeichert' }).waitFor();
    await foto(lk, 'lehrkraft_einstellungen');

    /* 4) Schüler tritt bei (iPad) */
    console.log('4) Schüler tritt bei');
    const sCtx = await browser.newContext(IPAD);
    const s = await sCtx.newPage();
    beobachte(s, 'schueler');
    await s.goto(`${BASE}/k/${kurscode}`);
    await s.locator('#kurs-info:not([hidden])').waitFor();
    await foto(s, 'schueler_start');
    await s.fill('#neu-name', 'Lena S.');
    await s.getByRole('button', { name: 'Beitreten' }).click();
    await s.locator('#code-box:not([hidden])').waitFor();
    const code = (await s.locator('#code-wert').textContent()).trim();
    assert.match(code, /^[A-Z]{3}-\d{3}$/);
    await foto(s, 'schueler_code');
    await s.check('#code-ok');
    await s.locator('#code-los').click();
    await s.locator('.welt-karte').first().waitFor();
    await foto(s, 'weltkarte_start');

    // Mitschüler für das Scoreboard (über die API, gleiche Herkunft)
    const mit = await browser.newContext();
    for (const [name, aufgaben] of [['Tim T.', ['W9-L1-04']], ['Mia K.', ['W9-L1-04', 'W9-L1-06']]]) {
      const r = await mit.request.post(BASE + '/api/schueler/beitreten', { headers: { Origin: BASE }, data: { kurscode, name } });
      assert.equal(r.status(), 201);
      const RICHTIG = require('../fixtures/antworten').RICHTIG;
      for (const id of aufgaben) await mit.request.post(`${BASE}/api/aufgaben/${id}/pruefen`, { headers: { Origin: BASE }, data: { antwort: RICHTIG[id] } });
      await mit.clearCookies();
    }

    /* 5) Level-Seite und alle Aufgaben über die Oberfläche */
    console.log('5) Aufgaben lösen');
    await s.locator('a.lvl', { hasText: 'Blöcke und Lücken' }).click();
    await s.locator('.aufgaben-liste').waitFor();
    await foto(s, 'level_seite');
    for (const id of Object.keys(LOESER)) {
      await oeffneAufgabe(s, id);
      const status = await LOESER[id](s);
      if (status !== 'angesehen') {
        await erwarteGeloest(s);
        if (id === 'W9-L1-01') await foto(s, 'aufgabe_geloest_erklaerung');
      }
      console.log(`  ✔ ${id}`);
    }
    await s.goto(BASE + '/spiel#/');
    await s.locator('.welt-karte').first().waitFor();
    await foto(s, 'weltkarte');

    /* 6) Trainingsplatz (Welt 4 – Generator) */
    console.log('6) Trainingsplatz');
    await s.goto(BASE + '/spiel#/training/4');
    await s.locator('.aufgabe-kopf').waitFor();
    await s.getByRole('button', { name: 'Stapel-Befehlsfolgen' }).click();
    await s.locator('.aufgabe-kopf h1', { hasText: 'Stapel' }).waitFor();
    await foto(s, 'trainingsplatz');

    /* 7) Boss-Kampf */
    console.log('7) Boss-Kampf');
    await s.goto(BASE + '/spiel#/boss/9');
    await s.getByRole('button', { name: /Kampf beginnen/ }).click();
    await bestaetige(s);
    await s.locator('.timer').waitFor();
    const navKnoepfe = s.locator('.boss-nav button');
    const n = await navKnoepfe.count();
    const ids = [];
    for (let i = 0; i < n; i++) {
      await navKnoepfe.nth(i).click();
      const titel = await s.locator('.aufgabe-kopf h2', { hasText: `Aufgabe ${i + 1}:` }).textContent();
      const id = { 'Ganzzahlige Division': 'W9-B-01', Rest: 'W9-B-02', 'Vergleich von Zeichenketten': 'W9-B-03', Stapel: 'W9-B-04', Inorder: 'W9-B-05', 'Höhe': 'W9-B-06' }[titel.replace(/^Aufgabe \d+: /, '').trim()];
      ids.push(id);
      await bossAntwort(s, id);
      const gespeichert = s.waitForResponse((r) => r.url().includes('/antwort') && r.request().method() === 'PUT');
      await s.getByRole('button', { name: /Antwort speichern/ }).click();
      await gespeichert;
      if (i === 1) await foto(s, 'boss_kampf');
    }
    await s.getByRole('button', { name: /Kampf beenden/ }).click();
    await bestaetige(s);
    await s.locator('.boss-ergebnis').waitFor();
    const ergebnis = await s.locator('.boss-ergebnis .gross').textContent();
    const [p, max] = ergebnis.split('/').map((x) => Number(x.trim()));
    assert.equal(p, max, 'alle Boss-Aufgaben richtig: ' + ergebnis + ' ' + ids.join());
    await s.locator('details').first().locator('summary').click();
    await s.locator('details[open] .erklaerung').waitFor();
    await foto(s, 'boss_ergebnis');

    /* 8) Profil, Scoreboard, Kata */
    console.log('8) Profil, Scoreboard, Kata');
    await s.goto(BASE + '/spiel#/profil');
    await s.locator('.abzeichen-grid').waitFor();
    const abz = await s.locator('.abzeichen:not(.fehlt)').count();
    assert.ok(abz >= 3, 'Abzeichen erhalten: ' + abz); // Erste Schritte, Boss besiegt, Makellos (+ Weltenbummler nur ohne weitere Welten)
    await foto(s, 'profil');
    await s.goto(BASE + '/spiel#/scoreboard');
    await s.locator('table.liste tr.ich').waitFor();
    assert.match(await s.locator('table.liste tbody tr').first().textContent(), /Lena S\./);
    await foto(s, 'scoreboard');
    await s.goto(BASE + '/spiel#/kata');
    await s.getByRole('button', { name: /Karte ziehen/ }).first().click();
    await s.locator('.kata-card').waitFor();
    await s.getByRole('button', { name: /Lösung aufdecken/ }).click();
    await foto(s, 'kata');

    /* 9) Beamer-Board */
    console.log('9) Beamer-Board');
    const bCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const b = await bCtx.newPage();
    beobachte(b, 'board');
    await b.goto(`${BASE}/board/${kurscode}`);
    await b.locator('.board-liste').waitFor();
    assert.match(await b.locator('body').textContent(), /hat den Testwelt-Boss besiegt/);
    await foto(b, 'beamer_board', { voll: false });

    /* 10) Lehrkraft: Schülerliste, Auswertung */
    console.log('10) Lehrkraft-Auswertung');
    await lk.getByRole('tab', { name: /Schüler/ }).click();
    await lk.locator('td', { hasText: 'Lena S.' }).waitFor();
    await foto(lk, 'lehrkraft_kurs_schueler');
    await lk.getByRole('tab', { name: /Auswertung/ }).click();
    await lk.locator('table.matrix').waitFor();
    await foto(lk, 'lehrkraft_auswertung');
    const dl = lk.waitForEvent('download');
    await lk.getByRole('button', { name: /Übersicht \(CSV\)/ }).click();
    const datei = await dl;
    const csv = fs.readFileSync(await datei.path(), 'utf8');
    assert.match(csv, /Lena S\.;/);

    /* 10b) Urkunden */
    console.log('10b) Urkunden');
    await lk.getByRole('link', { name: /Urkunden/ }).click();
    await lk.locator('.cert-page').first().waitFor();
    assert.equal(await lk.locator('.cert-page').count(), 3, 'eine Urkunde je Schüler');
    assert.match(await lk.locator('.cert-page').first().textContent(), /Lena S\..*Großmeister|Lena S\./s);
    await lk.locator('#u-platz').selectOption('top3');
    await foto(lk, 'urkunden_optionen', { voll: false });
    await lk.locator('#u-auswahl').selectOption('einzeln');
    await lk.locator('.cert-auswahl label', { hasText: 'Lena S.' }).click();
    assert.equal(await lk.locator('.cert-page').count(), 1);
    await lk.emulateMedia({ media: 'print' });
    await foto(lk, 'urkunde_druckansicht');
    const pdf = await lk.pdf({ preferCSSPageSize: true, printBackground: true });
    const seitenPdf = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    assert.equal(seitenPdf, 1, 'genau eine A4-Seite je Urkunde');
    await lk.emulateMedia({ media: 'screen' });

    /* 10c) Aufgaben-Vorschau (echte Welt 4, falls geladen) */
    console.log('10c) Aufgaben-Vorschau');
    await lk.goto(BASE + '/lehrer#/vorschau');
    await lk.locator('.welt-karte').first().waitFor();
    await foto(lk, 'vorschau_welten');
    const vw = (await (await lkCtx.request.get(BASE + '/api/lehrer/vorschau')).json()).welten;
    const w4 = vw.find((w) => w.nr === 4) || vw.find((w) => w.nr === 9);
    await lk.goto(`${BASE}/lehrer#/vorschau/welt/${w4.nr}`);
    await lk.locator('.level-kopf').first().waitFor();
    await foto(lk, 'vorschau_welt');
    const alle = [...w4.levels.flatMap((l) => l.aufgaben), ...(w4.boss ? w4.boss.pool : [])];
    for (const [art, name] of [['adtsim', 'vorschau_aufgabe_adtsim'], ['lines', 'vorschau_aufgabe_bughunt'], ['gaps', 'vorschau_aufgabe_luecken']]) {
      const a = alle.find((x) => x.arten.includes(art));
      if (!a) continue;
      await lk.goto(`${BASE}/lehrer#/vorschau/aufgabe/${a.id}`);
      await lk.locator('.aufgabe-kopf h1').waitFor();
      await lk.locator('.erklaerung').waitFor();
      await foto(lk, name);
    }
    // Struktogramm (echter Inhalt, falls vorhanden) in der Vorschau
    const sgId = await lk.evaluate(async (base) => {
      const r = await fetch(base + '/api/lehrer/vorschau');
      const ws = (await r.json()).welten;
      for (const w of ws) for (const l of w.levels) for (const a of l.aufgaben) {
        const d = await (await fetch(base + '/api/lehrer/vorschau/' + a.id)).json();
        if (d.aufgabe.inhalt.some((b) => b.t === 'struktogramm' && JSON.stringify(b).includes('"wenn"')) && w.nr !== 9) return a.id;
      }
      return null;
    }, BASE);
    if (sgId) {
      await lk.goto(`${BASE}/lehrer#/vorschau/aufgabe/${sgId}`);
      await lk.locator('.sg').first().waitFor();
      await foto(lk, 'vorschau_struktogramm');
    }

    /* 11) Superadmin: Konten, Inhalte */
    console.log('11) Superadmin');
    await su.goto(BASE + '/lehrer#/admin/lehrkraefte');
    await su.locator('td', { hasText: 'beispiel@schule.de' }).waitFor();
    await foto(su, 'superadmin_lehrkraefte');
    await su.goto(BASE + '/lehrer#/admin/inhalte');
    await su.locator('text=Seed-Bericht').waitFor();
    await foto(su, 'superadmin_inhalte');

    /* 12) Smartphone */
    console.log('12) Smartphone-Ansicht');
    const hCtx = await browser.newContext(HANDY);
    const hp = await hCtx.newPage();
    beobachte(hp, 'handy');
    await hp.goto(BASE + '/');
    await hp.getByRole('tab', { name: 'Weiterspielen' }).click();
    assert.ok(await hp.locator('#w-kurs').isHidden(), 'Weiterspielen ohne Kurscode');
    await hp.fill('#w-name', 'lena s.');
    await hp.fill('#w-code', code.replace('-', '').toLowerCase());
    await hp.getByRole('button', { name: 'Weiterspielen' }).click();
    await hp.locator('.welt-karte').first().waitFor();
    await foto(hp, 'handy_weltkarte');
    const keinScroll = async (wo) => {
      const breit = await hp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(breit <= 1, `kein horizontales Scrollen auf dem Handy (${wo}): ${breit}px`);
    };
    await keinScroll('Weltkarte');
    await oeffneAufgabe(hp, 'W9-L2-01');
    await keinScroll('Puzzle');
    await foto(hp, 'handy_aufgabe_puzzle');
    for (const id of ['W9-L1-02', 'W9-L2-02', 'W9-L2-03', 'W9-L2-04', 'W9-L2-05', 'W9-L2-07', 'W9-L2-09']) {
      await oeffneAufgabe(hp, id);
      await keinScroll(id);
    }
    await oeffneAufgabe(hp, 'W9-L1-03');
    await foto(hp, 'handy_aufgabe_struktogramm');
    await hp.goto(BASE + '/spiel#/profil');
    await hp.locator('.abzeichen-grid').waitFor();
    await foto(hp, 'handy_profil');
    // keine horizontale Scrollleiste der Seite
    const breit = await hp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(breit <= 1, 'kein horizontales Scrollen auf dem Handy: ' + breit);

    assert.deepEqual(fehlerListe, [], 'keine JS-/CSP-Fehler in der Konsole');
    console.log(`\nE2E erfolgreich: ${schritt} Screenshots in docs/.`);
  } catch (e) {
    console.error('\nE2E FEHLGESCHLAGEN:', e && e.stack ? e.stack : e);
    if (fehlerListe.length) console.error('Konsolenfehler:\n' + fehlerListe.join('\n'));
    console.error('Server-Log:\n' + server.log().split('\n').slice(-30).join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.proc.kill();
  }
})();
