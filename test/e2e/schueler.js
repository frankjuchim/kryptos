'use strict';
/*
 * e2e – Schüler-Szenarien (TECHNIK §15): Nr. 1 Start → Zeitleiste (auch mit reduzierter Bewegung), Nr. 2 alle neuen
 * Interaktionen (chiffre mit Schrittprüfung und Diagnose, zuordnung, schaubild-ergaenzen, bits-rechnen, Lösung zeigen),
 * Nr. 3 Boss im gA-Kurs (Task 67).
 */
const assert = require('node:assert/strict');
const { anmelden, beobachte, foto, gehe, RICHTIG, Krypto } = require('./hilfen');

const ZEIT = 10000;

async function neueSeite(ctx, optionen, name) {
  const kontext = await ctx.browser.newContext({ viewport: { width: 1280, height: 800 }, ...optionen });
  const page = await kontext.newPage();
  page.setDefaultTimeout(ZEIT);
  beobachte(page, name, ctx.fehler);
  return { kontext, page };
}

/** Aufgabe öffnen und warten, bis die Ansicht steht. */
async function aufgabe(page, ctx, id) {
  await gehe(page, `${ctx.basis}/spiel#/aufgabe/${id}`);
  await page.locator('#pruefen').waitFor();
}

async function richtig(page) {
  await page.locator('#pruefen').click();
  await page.locator('.feedback.ok', { hasText: 'Richtig' }).waitFor();
}

/** Nr. 1: Start → „Anmelden über InfoLabs“ → Dev-Portal → Zeitleiste → Epoche. */
async function szenario1(ctx) {
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 1');
  await gehe(page, ctx.basis + '/');
  await page.getByRole('link', { name: 'Anmelden über InfoLabs' }).first().click();
  await page.getByRole('link', { name: /^Mika R\./ }).click();
  await page.waitForURL((u) => u.toString().startsWith(ctx.basis + '/spiel'));
  await page.locator('h1', { hasText: 'Willkommen zurück, Mika R.' }).waitFor();
  const tor = page.locator('a.tor[href="#/epoche/9"]');
  await tor.waitFor();
  await page.waitForTimeout(1200); // Entsiegeln abwarten (Foto)
  await foto(page, 'zeitleiste');
  await tor.click();
  await page.waitForURL(/#\/epoche\/9$/);
  await page.locator('a.karte-akte').first().waitFor();
  assert.ok((await page.locator('a.karte-akte').count()) >= 4, 'Epoche zeigt mindestens vier Level-Karten');
  await foto(page, 'epoche');
  await kontext.close();

  // Reduzierte Bewegung: Tor-Namen sofort vollständig, kein Zeitsprung
  const ruhig = await neueSeite(ctx, { reducedMotion: 'reduce' }, 'Szenario 1 (ruhig)');
  await anmelden(ruhig.page, ctx, 'Mika R.', '/spiel');
  await ruhig.page.locator('a.tor[href="#/epoche/9"]').waitFor();
  assert.equal(await ruhig.page.locator('.tor-name span.roh').count(), 0, 'reduzierte Bewegung: kein Entsiegeln');
  const name = await ruhig.page.locator('a.tor[href="#/epoche/9"] .tor-name').textContent();
  assert.equal((name || '').trim(), 'Die Testwelt', 'Tor-Name sofort lesbar');
  await ruhig.page.locator('a.tor[href="#/epoche/9"]').click();
  assert.equal(await ruhig.page.locator('.zeitsprung').count(), 0, 'reduzierte Bewegung: kein Zeitsprung');
  await ruhig.page.waitForURL(/#\/epoche\/9$/);
  await ruhig.page.locator('a.karte-akte').first().waitFor();
  await ruhig.kontext.close();
}

/** Nr. 2: alle neuen Interaktionen mit Mika. */
async function szenario2(ctx) {
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 2');
  await anmelden(page, ctx, 'Mika R.', '/spiel');

  // chiffre (Caesar ent): Schrittprüfung, Diagnose P3, Tipp, richtige Antwort
  await aufgabe(page, ctx, 'W9-L5-01');
  const schalter = page.getByLabel('Jeden Schritt sofort prüfen', { exact: false });
  await schalter.check();
  const k = page.locator('input.kaestchen');
  assert.equal(await k.count(), 12, 'zwölf Kästchen (Eingabelänge)');
  await k.nth(0).fill('Z');
  await page.locator('input.kaestchen.ok').first().waitFor();
  await k.nth(1).fill('U');
  await page.waitForFunction(() => document.querySelectorAll('input.kaestchen.ok').length >= 2);
  await schalter.uncheck();
  const falsch = 'FABKXRGKYYOM';
  for (let i = 0; i < falsch.length; i++) await k.nth(i).fill(falsch[i]);
  await page.locator('#pruefen').click();
  await page.locator('.feedback.falsch').getByText('P3 Umkehrung falsch').waitFor();
  await foto(page, 'aufgabe-chiffre-p3', { ganz: true });
  await page.getByRole('button', { name: /Tipp/ }).click();
  await page.locator('.tipp-box').first().waitFor();
  const loesung = RICHTIG['W9-L5-01'].toUpperCase();
  for (let i = 0; i < loesung.length; i++) await k.nth(i).fill(loesung[i]);
  await richtig(page);
  await page.locator('.erklaerung').waitFor();

  // zuordnung: Felder tippen, Vorschau zeigt den Klartext klein
  await aufgabe(page, ctx, 'W9-L3-02');
  for (const [g, x] of Object.entries(RICHTIG['W9-L3-02'])) await page.locator(`li.z-eintrag[data-g="${g}"] input.z-feld`).fill(x);
  // Vorschau (gedrosselt, höchstens alle 400 ms) zeigt den Klartext klein
  await page.waitForFunction(() => (document.querySelector('.zuordnung-vorschau') || {}).textContent.replace(/\s/g, '').includes('geheimtreffen'));
  await foto(page, 'aufgabe-zuordnung', { ganz: true });
  await richtig(page);

  // schaubild-ergaenzen: Schlüssel-Chips
  await aufgabe(page, ctx, 'W9-L6-05');
  const chips = page.locator('details.sb-chip');
  for (const [i, art] of [[0, 'privat'], [1, 'oeffentlich']]) {
    await chips.nth(i).locator('summary').click();
    await chips.nth(i).locator('select.sb-art').selectOption(art);
    await chips.nth(i).locator('select.sb-inhaber').selectOption('A');
  }
  await foto(page, 'aufgabe-schaubild', { ganz: true });
  await richtig(page);

  // bits-rechnen über die Tastatur
  await aufgabe(page, ctx, 'W9-L6-01');
  await page.locator('button.bit').first().focus();
  for (const b of '00100001') await page.keyboard.press(b);
  await foto(page, 'aufgabe-bits', { ganz: true });
  await richtig(page);

  // Lösung zeigen: Rückfrage bestätigen, Kästchen gesperrt mit der Lösung
  await aufgabe(page, ctx, 'W9-L5-02');
  await page.getByRole('button', { name: /Lösung zeigen/ }).click();
  await page.locator('dialog[open]').getByRole('button', { name: 'Lösung zeigen' }).click();
  await page.locator('.feedback.info').waitFor();
  const werte = await page.locator('input.kaestchen').evaluateAll((l) => l.map((x) => x.value).join(''));
  assert.equal(werte, 'BOGRZNWSK');
  assert.ok(await page.locator('input.kaestchen').first().isDisabled(), 'Kästchen gesperrt');
  await foto(page, 'aufgabe-loesung', { ganz: true });
  await kontext.close();
}

/** Nr. 3: Boss im gA-Kurs (Ida, nur k:2 – nach Szenario 7a gA und Boss offen). */
async function szenario3(ctx) {
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 3');
  await anmelden(page, ctx, 'Ida K.', '/spiel');
  await gehe(page, `${ctx.basis}/spiel#/boss/9`);
  await page.getByRole('button', { name: /Kampf beginnen/ }).click();
  await page.locator('dialog[open]').getByRole('button').last().click();
  await page.waitForURL(/#\/kampf\//);
  const teile = page.locator('.boss-aufgabe');
  await teile.first().waitFor();
  assert.equal(await teile.count(), 3, 'drei Boss-Aufgaben');
  assert.equal(await page.locator('.werkzeug-karte').count(), 0, 'kein Werkzeug im Boss');
  assert.equal(await page.locator('a[href^="/labor"]').count(), 0, 'kein Labor-Link im Boss');
  const ids = await teile.evaluateAll((l) => l.map((x) => x.getAttribute('data-id')));
  assert.deepEqual([...ids].sort(), ['W9-B-01', 'W9-B-03', 'W9-B-05']);
  await foto(page, 'boss-kampf', { ganz: true });
  for (const id of ids) {
    const box = page.locator(`.boss-aufgabe[data-id="${id}"]`);
    if (id === 'W9-B-01') await box.locator('input').first().fill('3');
    else if (id === 'W9-B-03') await box.locator('label', { hasText: /.+/ }).filter({ has: page.locator('input[value="b"]') }).first().click();
    else {
      const falsch = Krypto.vigenere('XZWJNHYVCX', 'EIS', 'ver');
      const k = box.locator('input.kaestchen');
      if ((await k.count()) > 0) for (let i = 0; i < falsch.length; i++) await k.nth(i).fill(falsch[i]);
      else await box.locator('input.chiffre-zeile').fill(falsch);
    }
    await box.getByRole('button', { name: /speichern|Antwort festlegen|festlegen/i }).first().click();
    await box.getByText(/gespeichert/i).first().waitFor();
  }
  await page.getByRole('button', { name: /Kampf beenden/ }).click();
  await page.locator('dialog[open]').getByRole('button').last().click();
  const b05 = page.locator('.boss-ergebnis[data-id="W9-B-05"]');
  await b05.waitFor();
  await b05.getByText('P3 Umkehrung falsch').first().waitFor();
  assert.ok(((await b05.textContent()) || '').toLowerCase().includes('lösung'), 'Auswertung zeigt die Lösung');
  await page.locator('a[href^="/labor"]').first().waitFor();
  await foto(page, 'boss-auswertung', { ganz: true });
  await kontext.close();
}

module.exports = { szenario1, szenario2, szenario3, neueSeite, aufgabe, richtig };
