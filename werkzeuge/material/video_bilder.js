#!/usr/bin/env node
'use strict';
/*
 * Bildschirmfotos der Plattform für die Erklärvideos (Plan M9 Task 213, E156): startet Kryptos mit den echten Seeds und
 * dem Dev-Portal (test/e2e/hilfen.js), meldet sich mit den Pseudonymen an und fotografiert 1600 × 900
 * (deviceScaleFactor 1):
 *   zeitleiste.png  – Zeitleiste (Mika R.)
 *   level.png       – Level 0.2 „Caesars Botschaft“
 *   aufgabe.png     – Gast-Demo-Aufgabe mit falscher Antwort (Richtung vertauscht) und Fallen-Chip P3
 *   boss.png        – Boss-Start der Antike
 *   labor_funk.png  – links Kryptolabor-Übersicht, rechts Funkraum-Beamer (Botenlauf mit drei Teams)
 *   profil.png      – Profil mit Rang und Artefakt nach dem Boss der Antike
 * Aufruf: node werkzeuge/material/video_bilder.js <ausgabeordner>
 * Nur Pseudonyme (Mika R., Ole B., Nia T., Frau M.); keine Codes, keine Klarnamen.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../../test/e2e/hilfen');
const { kaestchen } = require('../../test/e2e/inhalte');

const GROESSE = { width: 1600, height: 900 };
const ziel = path.resolve(process.argv[2] || '.');

/** Seed-Lösung → Antwort der Prüf-API (chiffre: Text, gaps: erste Variante je Feld, choice: richtig, Teile: Liste). */
function antwortAus(loesung) {
  if (Array.isArray(loesung)) return loesung.map(antwortAus);
  if (!loesung || typeof loesung !== 'object') return loesung;
  if (typeof loesung.text === 'string') return loesung.text;
  if (Array.isArray(loesung.richtig)) return loesung.richtig;
  if (loesung.zuordnung) return loesung.zuordnung;
  if (loesung.reihenfolge) return loesung.reihenfolge;
  const o = {};
  for (const [k, v] of Object.entries(loesung)) if (!k.startsWith('_')) o[k] = Array.isArray(v) ? v[0] : v;
  return o;
}

async function main() {
  fs.mkdirSync(ziel, { recursive: true });
  const ctx = await H.starte({ echt: true });
  const browser = await chromium.launch({ executablePath: H.chromiumPfad() });
  const seite = async (opt = {}) => (await browser.newContext({ viewport: GROESSE, deviceScaleFactor: 1, reducedMotion: 'reduce', ...opt })).newPage();
  const foto = async (page, name) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ziel, name) });
    console.log('✔', path.join(path.relative(process.cwd(), ziel), name));
  };
  try {
    // Lehrkraft: LK 13 mit allen Welten und Boss „Offen“, Teams für den Funkraum
    const lk = await seite();
    await H.anmelden(lk, ctx, 'Frau M.', '/lehrer');
    const schueler = {};
    for (const name of ['Mika R.', 'Ole B.', 'Nia T.']) {
      schueler[name] = await seite();
      await H.anmelden(schueler[name], ctx, name, '/spiel');
    }
    await H.gehe(lk, ctx.basis + '/lehrer#/');
    const href = await lk.locator('table.kurs-tabelle a', { hasText: 'LK 13 (eA)' }).getAttribute('href');
    const kurs = /#\/kurs\/(\d+)\//.exec(href)[1];
    await H.gehe(lk, `${ctx.basis}/lehrer#/kurs/${kurs}/einstellungen`);
    await lk.locator('form.einstellungen').waitFor();
    for (const box of await lk.locator('input[name="welt"]').all()) await box.check();
    await lk.locator('input[name="boss"][value="offen"]').check();
    await lk.locator('form.einstellungen button[type="submit"]').click();
    await lk.locator('#toast', { hasText: /Gespeichert\.|Keine Änderungen\./ }).waitFor();

    const mika = schueler['Mika R.'];
    // Mika im LK 13
    await mika.locator('details.menue > summary').click();
    const wahl = mika.locator('#kopf-kurs');
    const wert = await wahl.locator('option', { hasText: 'LK 13 (eA)' }).getAttribute('value');
    if ((await wahl.inputValue()) !== wert) {
      await wahl.selectOption(wert);
      await Promise.all([mika.waitForEvent('load'), mika.locator('button.kurs-wechseln').click()]);
    }

    // Lernstand: einige Aufgaben der Antike lösen (Fortschrittsring, Rang)
    const w0 = JSON.parse(fs.readFileSync(path.join(H.WURZEL, 'seed', 'welten', 'welt0.json'), 'utf8'));
    const pruefe = (url, body) => mika.evaluate(async ([u, b]) => (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(), [url, body]);
    for (const a of w0.aufgaben.filter((x) => /^W0-L[12]-0[1-6]$/.test(x.id))) await pruefe(`/api/aufgaben/${a.id}/pruefen`, { antwort: antwortAus(a.loesung) });
    // 4. Boss-Start der Antike (vor dem ersten Versuch)
    await H.gehe(mika, ctx.basis + '/spiel#/boss/0');
    await mika.locator('.boss-karte').waitFor();
    await foto(mika, 'boss.png');
    // Boss der Antike mit den Lösungen aus dem Seed → Artefakt im Profil
    const kampf = await pruefe('/api/boss/0/start', {});
    for (const a of kampf.aufgaben || []) {
      const s = w0.aufgaben.find((x) => x.id === a.id);
      await mika.evaluate(async ([id, aid, antwort]) => fetch(`/api/boss/kampf/${id}/antwort`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aufgabeId: aid, antwort }) }), [kampf.id, a.id, antwortAus(s.loesung)]);
    }
    const auswertung = await pruefe(`/api/boss/kampf/${kampf.id}/beenden`, {});
    if (!auswertung.besiegt) console.warn('⚠ Boss der Antike nicht besiegt – Profil ohne Artefakt');

    // 1. Zeitleiste (neu laden: der Lernstand kam über die API)
    await H.gehe(mika, ctx.basis + '/spiel#/');
    await mika.reload();
    await mika.waitForLoadState('networkidle');
    await mika.locator('a.tor').first().waitFor();
    await foto(mika, 'zeitleiste.png');
    // 2. Level 0.2
    await H.gehe(mika, ctx.basis + '/spiel#/level/W0-L2');
    await mika.locator('.aufgaben-liste').waitFor();
    await foto(mika, 'level.png');
    // 6. Profil mit Artefakt
    await H.gehe(mika, ctx.basis + '/spiel#/profil');
    await mika.locator('main h1').first().waitFor();
    await foto(mika, 'profil.png');

    // 3. Gast-Demo-Aufgabe mit vertauschter Richtung → P3
    const gast = await seite();
    const demo = JSON.parse(fs.readFileSync(path.join(H.WURZEL, 'seed', 'gast', 'demo.json'), 'utf8')).aufgaben[0];
    await H.gehe(gast, `${ctx.basis}/gast#/schueler/aufgabe/${demo.id}`);
    await gast.locator('#pruefen').waitFor();
    // falsche Richtung: verschlüsselt statt entschlüsselt (Falle P3)
    await kaestchen(gast, H.Krypto.caesar(demo.interaktion.eingabe, demo.interaktion.verfahren.k, 'ver').replace(/[^A-Za-z]/g, ''));
    await gast.locator('#pruefen').click();
    await gast.locator('.feedback.falsch').getByText(/^P3\b/).first().waitFor();
    await gast.locator('.feedback.falsch').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await foto(gast, 'aufgabe.png');

    // 5. Labor-Übersicht + Funkraum-Beamer (Botenlauf mit drei Teams)
    await H.gehe(lk, `${ctx.basis}/lehrer#/kurs/${kurs}/teams`);
    await lk.locator('input.verteilen-anzahl').fill('3');
    await lk.locator('button.verteilen').click();
    await Promise.all([lk.waitForResponse((r) => r.request().method() === 'PUT' && /\/teams$/.test(r.url()) && r.ok()), lk.locator('button.teams-speichern').click()]);
    await H.gehe(lk, `${ctx.basis}/lehrer#/kurs/${kurs}/funkraum`);
    await lk.locator('article.szenario-wahl[data-typ="botenlauf"] button', { hasText: 'Anlegen' }).click();
    await lk.locator('table.rollen').waitFor();
    await lk.locator('button.aktion[data-aktion="starten"]').click();
    await lk.locator('section.funk-regie p.funk-status', { hasText: 'Runde 1' }).waitFor();
    const szId = /\/beamer\/funkraum\/(\d+)$/.exec(await lk.locator('a.beamer-oeffnen').first().getAttribute('href'))[1];
    const halb = { width: 800, height: 900 };
    const beamer = await lk.context().newPage();
    await beamer.setViewportSize(halb);
    await H.gehe(beamer, `${ctx.basis}/beamer/funkraum/${szId}`);
    await beamer.locator('svg.funk-netz g.knoten').nth(2).waitFor();
    await beamer.waitForTimeout(500);
    const rechts = await beamer.screenshot();
    await mika.setViewportSize(halb);
    await H.gehe(mika, ctx.basis + '/labor');
    await mika.locator('main h1').first().waitFor();
    await mika.waitForTimeout(300);
    const links = await mika.screenshot();
    const bild = await seite();
    await bild.setContent(`<html><body style="margin:0;display:flex;width:1600px;height:900px;overflow:hidden">
      <img style="width:800px;height:900px" src="data:image/png;base64,${links.toString('base64')}">
      <img style="width:800px;height:900px;border-left:4px solid #B07D2B;box-sizing:border-box" src="data:image/png;base64,${rechts.toString('base64')}"></body></html>`);
    await bild.screenshot({ path: path.join(ziel, 'labor_funk.png') });
    console.log('✔', path.join(path.relative(process.cwd(), ziel), 'labor_funk.png'));
    // Szenario beenden (Inhalte gelöscht)
    await H.gehe(lk, `${ctx.basis}/lehrer#/kurs/${kurs}/funkraum`);
  } finally {
    await browser.close();
    await ctx.beenden();
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
