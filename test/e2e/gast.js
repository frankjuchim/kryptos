'use strict';
/*
 * e2e – Gastmodus (TECHNIK §15 Nr. 8): ohne Anmeldung sechs Demo-Aufgaben (test/e2e/seed/gast/demo.json), zwei davon
 * lösen, Demo-Kurs mit Fallen-Profil und nur lesenden Einstellungen, Labor-Platz der Chiffrierscheibe.
 */
const assert = require('node:assert/strict');
const { foto, gehe, Krypto } = require('./hilfen');
const { neueSeite, richtig } = require('./schueler');
const DEMO = require('./seed/gast/demo.json');

async function szenario8(ctx) {
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 8');
  // Review M4: der Gastmodus schreibt nichts – keine Cookies, kein localStorage, keine Schreib-Endpunkte außer Prüfen/Tipp der Demo
  const schreibend = [];
  page.on('request', (r) => {
    if (r.method() === 'GET' || r.method() === 'HEAD') return;
    const pfad = new URL(r.url()).pathname;
    if (!/^\/api\/gast\/aufgaben\/W8-[\w-]+\/(pruefen|tipp)$/.test(pfad)) schreibend.push(`${r.method()} ${pfad}`);
  });
  await gehe(page, ctx.basis + '/gast');
  await page.locator('a.gast-karte').first().waitFor();
  // Review M4 K9: Überschrift mit Abstand zur Kopfzeile (wie die übrigen Seiten)
  const abstand = await page.evaluate(() => document.querySelector('main h1').getBoundingClientRect().top - document.getElementById('kopf').getBoundingClientRect().bottom);
  assert.ok(abstand >= 24, `Abstand h1 ↔ Kopfzeile ${abstand} px (mindestens 24)`);
  await foto(page, 'gast-start');
  await page.locator('a.gast-karte', { hasText: 'Als Schülerin/Schüler' }).click();
  await page.locator('.aufgaben-liste').waitFor();
  assert.equal(await page.locator('.aufgaben-liste a').count(), 6, 'sechs Demo-Aufgaben');
  await page.getByText('Nichts wird gespeichert.').first().waitFor();

  // W8-L1-01: Caesar mit der Lösung aus der Demo-Datei
  await page.locator('a[href="#/schueler/aufgabe/W8-L1-01"]').click();
  await page.locator('#pruefen').waitFor();
  assert.equal(await page.locator('.werkzeug-karte.gesperrt').count(), 0, 'Scheibe im Gastmodus frei');
  const loesung = DEMO.aufgaben[0].loesung.text.toUpperCase();
  const k = page.locator('input.kaestchen');
  for (let i = 0; i < loesung.length; i++) await k.nth(i).fill(loesung[i]);
  await richtig(page);
  await foto(page, 'gast-aufgabe', { ganz: true });

  // W8-L1-04: XOR über die Tastatur
  await gehe(page, ctx.basis + '/gast#/schueler/aufgabe/W8-L1-04');
  await page.locator('button.bit').first().focus();
  for (const b of DEMO.aufgaben[3].loesung.bits) await page.keyboard.press(b);
  await richtig(page);

  // Demo-Kurs: Auswertung mit Fallen-Profil, Einstellungen nur lesend
  await gehe(page, ctx.basis + '/gast#/lehrkraft/auswertung');
  await page.locator('.fallen-profil').waitFor();
  await foto(page, 'gast-lehrkraft', { ganz: true });
  await gehe(page, ctx.basis + '/gast#/lehrkraft/einstellungen');
  await page.locator('form.einstellungen').waitFor();
  const offen = await page.locator('form.einstellungen').locator('input, select, button[type="submit"]').evaluateAll((l) => l.filter((x) => !x.disabled).length);
  assert.equal(offen, 0, 'Einstellungen nur lesend');

  // Labor-Platz: Chiffrierscheibe (M6 Task 126, wird nachgeladen) – per Tastatur drehen, Text verschlüsseln, Ergebnis = Krypto
  await gehe(page, ctx.basis + '/gast#/labor/scheibe');
  const knopf = page.locator('.scheibe-drehknopf');
  await knopf.waitFor();
  await knopf.focus();
  const kStart = Number(await knopf.getAttribute('aria-valuenow'));
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  const kWert = Number(await knopf.getAttribute('aria-valuenow'));
  assert.equal(kWert, (kStart + 3) % 26, 'dreimal → dreht den Innenring um drei weiter');
  await page.locator('[role="tab"][data-reiter="text"]').click();
  await page.locator('textarea.labor-eingabe').fill('kryptolabor');
  const ausgabe = (await page.locator('output.labor-ausgabe').first().textContent()).replace(/\s+/g, '');
  assert.equal(ausgabe, Krypto.caesar('kryptolabor', kWert), 'Scheibe rechnet wie Krypto');
  // andere Werkzeuge gibt es im Gastmodus nicht – und sie werden nicht nachgeladen
  const geladen = [];
  page.on('request', (r) => { if (/\/krypto\/labor\/vigenere\.js/.test(r.url())) geladen.push(r.url()); });
  await gehe(page, ctx.basis + '/gast#/labor/vigenere');
  await page.getByText('Im Gastmodus gibt es nur die Chiffrierscheibe.').waitFor();
  assert.deepEqual(geladen, [], 'kein Nachladen anderer Werkzeuge');
  assert.deepEqual(schreibend, [], 'Gastmodus: keine schreibenden Anfragen');
  assert.deepEqual((await kontext.cookies()).map((c) => c.name), [], 'Gastmodus: keine Cookies');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [], 'Gastmodus: kein localStorage');
  await kontext.close();
}

module.exports = { szenario8 };
