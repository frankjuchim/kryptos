'use strict';
/*
 * e2e – Szenario 12 „Welten 3–6 spielbar“ mit den echten Seeds (Plan M8 Task 202, TECHNIK §15). Läuft nach Szenario 11
 * im selben App-Start (SEED_DIR=seed, ohne WELT_DATEIEN). Fotos archivfund-w3, aufgabe-bits-schritt, aufgabe-hash-ziel, aufgabe-uhrwerk, 360-aufgabe-w3, dunkel-zeitleiste (Plan M9 Task 217). Ablauf:
 *  1. Frau M. schaltet im LK 13 (eA) alle sieben Welten frei (Boss „Offen“ aus Szenario 11), im GK 12 (gA) ebenfalls,
 *     dort Kür gesperrt.
 *  2. Mika R. (LK 13) löst je Welt den Archivfund und je neue Interaktion eine Aufgabe: W3 `bits-rechnen` mit `schritt`
 *     (W3-L2-03), ADFGVX `chiffre` + Block `quadrat` (W3-L4-01), Werkstatt-Karte in 3.3 führt nach /werkstatt; W4
 *     `schaubild-ergaenzen` (W4-L2-06), `match` als Kategorien (W4-L2-03); W5 `hash-ziel` mit eigener Kollision
 *     (W5-L1-07: erst „tee“ falsch, dann „eis“) – die Rückmeldung zeigt nur den KH-Wert, nie das Lösungsbeispiel;
 *     W6 `chiffre` `uhrwerk` (W6-L2-04), `lines` mit zwei Zeilen (W6-L1-11), Skytale im Ring-Modus über die Level-Karte 6.2.
 *     Je Welt den Boss starten und im Bestätigungsdialog abbrechen (25 min, W6 30 min) – kein Kampf beginnt.
 *  3. GK 12 (gA): Level 3.2/3.3 unsichtbar, Kür (3.K2, 4.K3) erst nach „Kür: Frei“.
 *  4. 360 px ohne Querscrollen auf jeder besuchten Seite; Kontrastmessung (WCAG AA) wie Szenario 9, hell und dunkel.
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe, keinQuerScrollen, kontraste, Krypto } = require('./hilfen');
const { neueSeite, aufgabe } = require('./schueler');
const { kursId, einstellen, kursWaehlen, kaestchen } = require('./inhalte');

const ALLE = [0, 1, 2, 3, 4, 5, 6];

async function richtig(page, text = 'Richtig') {
  await page.locator('#pruefen').click();
  await page.locator('.feedback.ok', { hasText: text }).waitFor();
}

/** Bits über die Tastatur eintragen (erste Bit-Taste fokussieren, dann 0/1 – der Fokus wandert weiter). */
async function bits(page, folge) {
  await page.locator('button.bit').first().focus();
  for (const b of folge) await page.keyboard.press(b);
}

/** Boss-Seite: Regeln nennen die Zeit, „Kampf beginnen“ öffnet den Dialog, Abbrechen startet keinen Kampf. */
async function bossAbbrechen(page, ctx, welt, minuten) {
  await gehe(page, `${ctx.basis}/spiel#/boss/${welt}`);
  await page.locator('.boss-karte').waitFor();
  await page.locator('.boss-karte li', { hasText: `8 Aufgaben, ${minuten} Minuten` }).waitFor();
  await page.getByRole('button', { name: 'Kampf beginnen' }).click();
  const dialog = page.locator('dialog[open]');
  await dialog.getByText(`Du hast ${minuten} Minuten für 8 Aufgaben.`, { exact: false }).waitFor();
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await page.locator('dialog[open]').waitFor({ state: 'detached' });
  assert.doesNotMatch(page.url(), /#\/kampf\//, `Boss W${welt}: abgebrochen, kein Kampf`);
  await page.getByRole('button', { name: 'Kampf beginnen' }).waitFor();
}

async function szenario12(ctx) {
  // 1) Lehrkraft: alle sieben Welten
  const lehrer = await neueSeite(ctx, {}, 'Szenario 12 (Frau M.)');
  await anmelden(lehrer.page, ctx, 'Frau M.', '/lehrer');
  const lk = await kursId(lehrer.page, ctx, 'LK 13 (eA)');
  const gk = await kursId(lehrer.page, ctx, 'GK 12 (gA)');
  await einstellen(lehrer.page, ctx, lk, { welten: ALLE, boss: 'offen' });
  await einstellen(lehrer.page, ctx, gk, { welten: ALLE, niveau: 'gA', kuer: 'gesperrt' });

  // 2) Mika im LK 13
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 12 (Mika)');
  await anmelden(page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(page, 'LK 13 (eA)');
  await gehe(page, ctx.basis + '/spiel#/');
  for (const nr of ALLE) await page.locator(`a.tor[href="#/epoche/${nr}"]`).waitFor();
  assert.equal(await page.locator('.tor.gesperrt').count(), 0, 'alle sieben Epochen offen');

  // --- Welt 3 ---
  await gehe(page, `${ctx.basis}/spiel#/archivfund/3`);
  await page.locator('#pruefen').waitFor();
  await bits(page, '01000110010101010100111001001011');
  await page.getByLabel('Lücke wort').fill('FUNK');
  await richtig(page, 'Archivfund – ohne Punkte');
  await foto(page, 'archivfund-w3');

  await aufgabe(page, ctx, 'W3-L2-03'); // bits-rechnen kryptos16, schritt transposition
  await page.locator('.aufgabe-box').getByText('Transposition der 4×4-Bitmatrix', { exact: false }).first().waitFor();
  await bits(page, '0110101011010100');
  await richtig(page);
  await page.locator('.feedback.ok').first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await foto(page, 'aufgabe-bits-schritt');

  await aufgabe(page, ctx, 'W3-L4-01'); // ADFGVX: Quadrat + chiffre
  await page.locator('.quadrat-rahmen table').first().waitFor();
  await kaestchen(page, 'AFGAGGGV');
  await richtig(page);

  await gehe(page, `${ctx.basis}/spiel#/level/W3-L3`);
  const werkstatt = page.locator('section.werkstatt-karte a[href="/werkstatt"]');
  await werkstatt.waitFor();
  await Promise.all([page.waitForURL((u) => u.pathname === '/werkstatt'), werkstatt.click()]);
  await page.locator('body.seite-werkstatt').waitFor();
  await bossAbbrechen(page, ctx, 3, 25);

  // --- Welt 4 ---
  await gehe(page, `${ctx.basis}/spiel#/archivfund/4`);
  await page.locator('#pruefen').waitFor();
  await kaestchen(page, 'KURIERKAMNIEANSCHLUESSELVERLOREN');
  await richtig(page, 'Archivfund – ohne Punkte');

  await aufgabe(page, ctx, 'W4-L2-06'); // schaubild-ergaenzen
  for (const [schritt, art, inhaber] of [[2, 'oeffentlich', 'B'], [4, 'privat', 'B'], [5, 'sitzung', 'A']]) {
    const chip = page.locator('details.sb-chip', { has: page.getByLabel(`Schritt ${schritt}: Schlüsselart`) });
    await chip.locator('summary').click();
    await chip.getByLabel(`Schritt ${schritt}: Schlüsselart`).selectOption(art);
    await chip.getByLabel(`Schritt ${schritt}: Inhaber`).selectOption(inhaber);
  }
  await richtig(page);

  await aufgabe(page, ctx, 'W4-L2-03'); // match als Kategorien
  const kat = { 'Festplatte eines Laptops': 'symmetrisch', 'Webseite über HTTPS': 'hybrid', 'Sitzungsschlüssel an einen Server': 'asymmetrisch', 'WLAN-Verkehr': 'symmetrisch', 'E-Mail an eine fremde Person': 'hybrid', '4-GB-Videodatei': 'symmetrisch' };
  for (const [el, k] of Object.entries(kat)) {
    await page.locator('.match-zeile', { hasText: el }).getByRole('button', { name: k, exact: true }).click();
  }
  await richtig(page);
  await bossAbbrechen(page, ctx, 4, 25);

  // --- Welt 5 ---
  await gehe(page, `${ctx.basis}/spiel#/archivfund/5`);
  await page.locator('#pruefen').waitFor();
  await page.getByLabel('Lücke n').fill('2');
  for (const t of ['Die Datei ist verändert.', 'Der Domainname ist ein anderer.', 'Auch die gefälschte Seite hat ein Schloss-Symbol']) {
    await page.locator('button.option', { hasText: t }).click();
  }
  await richtig(page, 'Archivfund – ohne Punkte');

  await aufgabe(page, ctx, 'W5-L1-07'); // hash-ziel: eigene Kollision
  const feld = page.locator('input.hashziel-eingabe');
  await feld.fill('tee');
  await page.locator('#pruefen').click();
  await page.locator('.feedback.falsch').first().waitFor();
  await page.locator('p.hashziel-wert', { hasText: `Dein Text hat den KRYPTOS-Hash ${Krypto.kryptosHash('tee').wert}.` }).waitFor();
  assert.ok(!(await page.locator('main, body').first().innerText()).includes('haffk'), 'Rückmeldung verrät das Lösungsbeispiel nicht');
  await page.locator('p.hashziel-wert').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await foto(page, 'aufgabe-hash-ziel');
  assert.equal(Krypto.kryptosHash('eis').wert, 4);
  await feld.fill('eis');
  await richtig(page);
  // nach dem Lösen bleibt die eigene Kollision mit ihrem KH-Wert stehen (kein Lösungsbeispiel)
  await page.locator('p.hashziel-wert', { hasText: 'Dein Text hat den KRYPTOS-Hash 4.' }).waitFor();
  assert.equal(await feld.inputValue(), 'eis');
  assert.ok(!(await page.locator('.hashziel').innerText()).includes('haffk'), 'Eingabe und Rückmeldung ohne Lösungsbeispiel (die Erklärung nennt es)');
  await bossAbbrechen(page, ctx, 5, 25);

  // --- Welt 6 ---
  await gehe(page, `${ctx.basis}/spiel#/archivfund/6`);
  await page.locator('#pruefen').waitFor();
  await kaestchen(page, 'HEBELISTVERBOGEN');
  await richtig(page, 'Archivfund – ohne Punkte');

  await aufgabe(page, ctx, 'W6-L2-04'); // chiffre uhrwerk
  await kaestchen(page, 'ZEITZONE');
  await richtig(page);
  await foto(page, 'aufgabe-uhrwerk');

  await aufgabe(page, ctx, 'W6-L1-11'); // lines mit zwei Zeilen
  const zeilen = page.locator('.code .zeile.waehlbar');
  await zeilen.nth(1).click();
  await zeilen.nth(5).click();
  await page.locator('p.hint', { hasText: 'Gewählt: Zeile 2, Zeile 6' }).waitFor();
  await richtig(page);

  await gehe(page, `${ctx.basis}/spiel#/level/W6-L2`);
  const sky = page.locator('a.werkzeug-link[href^="/labor#/skytale"]');
  await sky.waitFor();
  assert.match(await sky.getAttribute('href'), /reiter=ring/);
  await sky.click();
  await page.waitForURL(/\/labor#\/skytale/);
  await page.waitForFunction(() => typeof KRLabor !== 'undefined' && KRLabor.aktiv() && KRLabor.aktiv().zustand() && KRLabor.aktiv().zustand().reiter === 'ring');
  await bossAbbrechen(page, ctx, 6, 30);

  // 3) GK 12 (gA, Kür gesperrt): 3.2/3.3 fehlen, Kür erst nach Freischaltung
  await kursWaehlen(page, 'GK 12 (gA)');
  await gehe(page, `${ctx.basis}/spiel#/epoche/3`);
  await page.locator('a.karte-akte').first().waitFor();
  for (const id of ['W3-L2', 'W3-L3', 'W3-L5']) assert.equal(await page.locator(`a[href="#/level/${id}"]`).count(), 0, `gA, Kür gesperrt: ${id} fehlt`);
  for (const id of ['W3-L1', 'W3-L4']) assert.equal(await page.locator(`a[href="#/level/${id}"]`).count(), 1, `${id} da`);
  await gehe(page, `${ctx.basis}/spiel#/epoche/4`);
  await page.locator('a.karte-akte').first().waitFor();
  assert.equal(await page.locator('a[href="#/level/W4-L3"]').count(), 0, 'Kür K3 gesperrt');
  await einstellen(lehrer.page, ctx, gk, { kuer: 'frei' });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.locator('a[href="#/level/W4-L3"]').waitFor();
  await gehe(page, `${ctx.basis}/spiel#/epoche/3`);
  await page.locator('a[href="#/level/W3-L5"]').waitFor();
  for (const id of ['W3-L2', 'W3-L3']) assert.equal(await page.locator(`a[href="#/level/${id}"]`).count(), 0, `gA: ${id} bleibt ausgeblendet`);
  await lehrer.kontext.close();
  await kontext.close();

  // 4a) 360 px ohne Querscrollen: Mika (LK 13, eA-Seiten) und Ida K. (GK 12)
  const seitenMika = [
    ['/spiel#/aufgabe/W3-L2-03', '.aufgabe-box'], // gelöst: ohne Prüfen-Knopf
    ['/spiel#/level/W3-L3', 'section.werkstatt-karte'],
    ['/werkstatt', 'body.seite-werkstatt'],
    ['/labor#/skytale?reiter=ring&level=W6-L2', '.werkzeug-flaeche']
  ];
  const seitenIda = [
    ['/spiel#/', 'a.tor'],
    ['/spiel#/epoche/3', 'a.karte-akte'],
    ['/spiel#/archivfund/3', '#pruefen'],
    ['/spiel#/aufgabe/W3-L4-01', '#pruefen'],
    ['/spiel#/archivfund/4', '#pruefen'],
    ['/spiel#/aufgabe/W4-L2-06', '#pruefen'],
    ['/spiel#/aufgabe/W4-L2-03', '#pruefen'],
    ['/spiel#/archivfund/5', '#pruefen'],
    ['/spiel#/aufgabe/W5-L1-07', '#pruefen'],
    ['/spiel#/archivfund/6', '#pruefen'],
    ['/spiel#/aufgabe/W6-L2-04', '#pruefen'],
    ['/spiel#/aufgabe/W6-L1-11', '#pruefen'],
    ['/spiel#/level/W6-L2', '.level-seite h1'],
    ['/spiel#/boss/6', '.boss-karte'],
    ['/themen', '#welt-6']
  ];
  for (const [name, seiten, kurs] of [['Mika R.', seitenMika, 'LK 13 (eA)'], ['Ida K.', seitenIda, null]]) {
    const klein = await neueSeite(ctx, { viewport: { width: 360, height: 740 } }, `Szenario 12 (360 px, ${name})`);
    await anmelden(klein.page, ctx, name, '/spiel');
    if (kurs) await kursWaehlen(klein.page, kurs);
    for (const [route, warte] of seiten) {
      await gehe(klein.page, ctx.basis + route);
      await klein.page.locator(warte).first().waitFor();
      await keinQuerScrollen(klein.page, `360 px ${route}`);
      if (name === 'Ida K.' && route === '/spiel#/aufgabe/W3-L4-01') await foto(klein.page, '360-aufgabe-w3');
    }
    await klein.kontext.close();
  }

  // 4b) Kontraste (WCAG AA) hell und dunkel wie Szenario 9 – Ida K. (GK 12, Kür frei)
  const verstoesse = [];
  for (const schema of ['light', 'dark']) {
    const k = await neueSeite(ctx, { colorScheme: schema, reducedMotion: 'reduce' }, `Szenario 12 (Kontrast ${schema})`);
    await anmelden(k.page, ctx, 'Ida K.', '/spiel');
    for (const [route, warte] of [...seitenIda, ['/spiel#/level/W4-L3', '.level-seite h1']]) {
      await gehe(k.page, ctx.basis + route);
      await k.page.locator(warte).first().waitFor();
      await k.page.waitForTimeout(100);
      verstoesse.push(...(await kontraste(k.page, `${schema} ${route}`)));
      if (schema === 'dark' && route === '/spiel#/') await foto(k.page, 'dunkel-zeitleiste');
    }
    // Zustand mit Rückmeldung: hash-ziel falsch
    await aufgabe(k.page, ctx, 'W5-L1-07');
    await k.page.locator('input.hashziel-eingabe').fill('tee');
    await k.page.locator('#pruefen').click();
    await k.page.locator('.feedback').first().waitFor();
    verstoesse.push(...(await kontraste(k.page, `${schema} hash-ziel mit Rückmeldung`)));
    await k.kontext.close();
  }
  assert.deepEqual(verstoesse, [], `Kontraste unter WCAG AA:\n  ${verstoesse.join('\n  ')}`);
}

module.exports = { szenario12 };
