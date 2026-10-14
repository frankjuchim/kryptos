'use strict';
/*
 * e2e – Szenario 11 „Welten 0–2 spielbar“ mit den echten Seeds (M5 Task 101, TECHNIK §15). Eigener App-Start mit
 * SEED_DIR=seed ohne WELT_DATEIEN (hilfen.starte({ echt: true })). Ablauf:
 *  1. Frau M. öffnet die Welten 0–2 im LK 13 (eA) mit Boss „Offen“, im GK 12: Niveau gA, Kür gesperrt.
 *  2. Mika R. (LK 13): Zeitleiste – Antike, Bagdad, Renaissance offen, Epochen 3–6 „noch verschlüsselt“ (ohne Seed oder im Kurs nicht freigegeben); Archivfund W0
 *     (0 Punkte), W0-L1-03 (+10 Punkte), W0-L2-02 mit falscher Richtung → Fallen-Chip P3; Level-Seite 0.1 mit „Akte als
 *     PDF“ (200, application/pdf); QR-Ziel /level/0.4 → Level-Seite; Boss W0: Start, eine Antwort, Abgabe, Auswertung mit Lösung.
 *  3. Mika im GK 12 (gA): Level 2.3 (eA) fehlt, Kür K1 erst nach „Kür: Frei“ durch Frau M.
 *  4. 360 px ohne Querscrollen. Keine neuen Fotos (Grenze 30 aus M4).
 */
const assert = require('node:assert/strict');
const { anmelden, gehe, keinQuerScrollen } = require('./hilfen');
const { neueSeite, aufgabe } = require('./schueler');
const fs = require('node:fs');
const path = require('node:path');

/** Welten mit Seed (Plan M8: W3–W6 kommen Task für Task dazu) – die Einstellungen bieten genau diese an. */
const SEED_WELTEN = fs.readdirSync(path.join(__dirname, '..', '..', 'seed', 'welten')).map((d) => /^welt(\d)\.json$/.exec(d)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);

/** Kurs in der Kursliste der Lehrkraft öffnen; liefert die lokale id. */
async function kursId(page, ctx, name) {
  await gehe(page, ctx.basis + '/lehrer#/');
  const link = page.locator('table.kurs-tabelle a', { hasText: name });
  await link.waitFor();
  const m = /#\/kurs\/(\d+)\//.exec((await link.getAttribute('href')) || '');
  assert.ok(m, `lokale Kurs-id für ${name}`);
  return m[1];
}

/** Einstellungen eines Kurses setzen: { welten: [0,1,2], boss, niveau, kuer } (nur gesetzte Felder). */
async function einstellen(page, ctx, kurs, { welten, boss, niveau, kuer }) {
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${kurs}/einstellungen`);
  await page.locator('form.einstellungen').waitFor();
  if (welten) {
    const boxen = page.locator('input[name="welt"]');
    const werte = await boxen.evaluateAll((l) => l.map((x) => Number(x.value)));
    assert.deepEqual(werte, SEED_WELTEN, 'Einstellungen bieten genau die Welten mit Seed aus dem Katalog');
    for (const w of werte) {
      const box = page.locator(`input[name="welt"][value="${w}"]`);
      if (welten.includes(w)) await box.check();
      else await box.uncheck();
    }
  }
  if (boss) await page.locator(`input[name="boss"][value="${boss}"]`).check();
  if (niveau) await page.locator(`input[name="niveau"][value="${niveau}"]`).check();
  if (kuer) await page.locator(`input[name="kuer"][value="${kuer}"]`).check();
  const knopf = page.locator('form.einstellungen button[type="submit"]');
  const antwort = page.waitForResponse((r) => r.request().method() === 'PATCH', { timeout: 3000 }).catch(() => null);
  await knopf.click();
  const r = await antwort;
  // „Keine Änderungen.“ (Standardwerte schon gesetzt) ist ebenfalls in Ordnung
  if (r) assert.ok(r.ok(), `Einstellungen gespeichert (${r.status()})`);
  await page.locator('#toast', { hasText: /Gespeichert\.|Keine Änderungen\./ }).waitFor();
}

/** Kurs in der Kopfzeile wechseln (Schüler mit mehreren Kursen). */
async function kursWaehlen(page, name) {
  const wahl = page.locator('#kopf-kurs');
  await page.locator('details.menue > summary').click();
  const ziel = await wahl.locator('option', { hasText: name }).getAttribute('value');
  if ((await wahl.inputValue()) !== ziel) {
    await wahl.selectOption(ziel);
    await Promise.all([page.waitForEvent('load'), page.locator('button.kurs-wechseln').click()]);
    await page.waitForLoadState('networkidle');
  } else await page.locator('details.menue > summary').click();
}

/** Antwort der chiffre-Interaktion eintragen: Kästchen (zeichenweise) oder Zeile (Transpositionen, darstellung „zeile“). */
async function kaestchen(page, text) {
  await page.locator('input.kaestchen, input.chiffre-zeile').first().waitFor();
  const zeile = page.locator('input.chiffre-zeile');
  if (await zeile.count()) return zeile.fill(text);
  const k = page.locator('input.kaestchen');
  assert.equal(await k.count(), text.length, `Kästchen für ${text.length} Zeichen`);
  for (let i = 0; i < text.length; i++) await k.nth(i).fill(text[i]);
}

async function szenario11(ctx) {
  // 1) Lehrkraft
  const lehrer = await neueSeite(ctx, {}, 'Szenario 11 (Frau M.)');
  await anmelden(lehrer.page, ctx, 'Frau M.', '/lehrer');
  const lk = await kursId(lehrer.page, ctx, 'LK 13 (eA)');
  const gk = await kursId(lehrer.page, ctx, 'GK 12 (gA)');
  await einstellen(lehrer.page, ctx, lk, { welten: [0, 1, 2], boss: 'offen' });
  await einstellen(lehrer.page, ctx, gk, { welten: [0, 1, 2], niveau: 'gA', kuer: 'gesperrt' });

  // 2) Mika im LK 13
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 11 (Mika)');
  await anmelden(page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(page, 'LK 13 (eA)');
  await gehe(page, ctx.basis + '/spiel#/');
  for (const [nr, name] of [[0, 'Die Antike'], [1, 'Das Haus der Weisheit'], [2, 'Le chiffre indéchiffrable']]) {
    const tor = page.locator(`a.tor[href="#/epoche/${nr}"]`);
    await tor.waitFor();
    assert.match(await tor.getAttribute('aria-label'), new RegExp(name), `Tor ${nr} offen (${name})`);
  }
  // Epochen 3–6: ohne Seed bzw. im Kurs nicht freigegeben – beides „noch verschlüsselt“
  const zu = page.locator('.tor.gesperrt');
  assert.equal(await zu.count(), 4, 'Epochen 3–6 gesperrt');
  for (let i = 0; i < 4; i++) assert.match(await zu.nth(i).innerText(), /noch verschlüsselt/);

  // Archivfund W0: 0 Punkte, danach „Archivfund ansehen“ auf der Epochen-Seite
  await gehe(page, `${ctx.basis}/spiel#/archivfund/0`);
  await page.locator('#pruefen').waitFor();
  await kaestchen(page, 'DIEFLOTTELAEUFTBEINEUMONDAUS');
  await page.locator('#pruefen').click();
  await page.locator('.feedback.ok', { hasText: 'Archivfund – ohne Punkte' }).waitFor();
  await gehe(page, `${ctx.basis}/spiel#/epoche/0`);
  await page.locator('.archivfund-karte a', { hasText: 'Archivfund ansehen' }).waitFor();
  assert.equal(await page.locator('a.karte-akte').count(), 4, 'Epoche 0: vier Level-Karten');

  // W0-L1-03: richtig, +10 Punkte
  await aufgabe(page, ctx, 'W0-L1-03');
  await kaestchen(page, 'WTPIEARNSHDSAEXLNX');
  await page.locator('#pruefen').click();
  await page.locator('.feedback.ok', { hasText: '+10 Punkte' }).waitFor();

  // W0-L2-02: in die falsche Richtung verschoben → Fallen-Chip P3
  await aufgabe(page, ctx, 'W0-L2-02');
  await kaestchen(page, 'UYAFC');
  await page.locator('#pruefen').click();
  await page.locator('.feedback.falsch').getByText(/^P3\b/).first().waitFor();

  // Level-Seite 0.1: Akte als PDF
  await gehe(page, `${ctx.basis}/spiel#/level/W0-L1`);
  const akte = page.locator('a.akte-pdf');
  await akte.waitFor();
  const pdf = await kontext.request.get(ctx.basis + (await akte.getAttribute('href')));
  assert.equal(pdf.status(), 200, 'Akte W0·1 abrufbar');
  assert.match(pdf.headers()['content-type'] || '', /^application\/pdf/);

  // QR-Ziel der Akte W0·4
  await page.goto(ctx.basis + '/level/0.4');
  await page.waitForURL(/\/spiel#\/level\/W0-L4$/);
  await page.locator('.level-seite h1').waitFor();

  // Boss W0 (Boss „Offen“): starten, eine Antwort, abgeben, Auswertung mit Lösung
  await gehe(page, `${ctx.basis}/spiel#/boss/0`);
  await page.getByRole('button', { name: 'Kampf beginnen' }).click();
  await page.locator('dialog[open]').getByRole('button', { name: 'Kampf beginnen' }).click();
  await page.waitForURL(/#\/kampf\//);
  const teile = page.locator('section.boss-aufgabe');
  await teile.first().waitFor();
  assert.equal(await teile.count(), 8, 'Boss W0: acht Aufgaben');
  assert.equal(await page.locator('a[href^="/labor"]').count(), 0, 'kein Labor-Link im Boss');
  // eine Antwort: erste Aufgabe mit Auswahl-Knopf, Antwortzeile, Kästchen oder Textfeld (Ziehung ist zufällig)
  let beantwortet = false;
  for (let i = 0; i < 8 && !beantwortet; i++) {
    const t = teile.nth(i);
    if (await t.locator('button.option').count()) await t.locator('button.option').first().click();
    else if (await t.locator('input.chiffre-zeile, input.kaestchen, input[type="text"]').count()) await t.locator('input.chiffre-zeile, input.kaestchen, input[type="text"]').first().fill('A');
    else continue;
    beantwortet = true;
  }
  assert.ok(beantwortet, 'eine Boss-Aufgabe beantwortet');
  await page.locator('.boss-speicher', { hasText: 'gespeichert' }).waitFor();
  await page.getByRole('button', { name: 'Kampf beenden' }).click();
  await page.locator('dialog[open]').getByRole('button', { name: 'Beenden und auswerten' }).click();
  const ergebnis = page.locator('section.boss-ergebnis-aufgabe');
  await ergebnis.first().waitFor();
  assert.equal(await ergebnis.count(), 8, 'Auswertung aller acht Aufgaben');
  await ergebnis.first().locator('h4', { hasText: 'Lösung' }).waitFor();

  // 3) Mika im GK 12 (gA, Kür gesperrt): kein Level 2.3, kein K1
  await kursWaehlen(page, 'GK 12 (gA)');
  await gehe(page, `${ctx.basis}/spiel#/epoche/2`);
  await page.locator('a.karte-akte').first().waitFor();
  assert.equal(await page.locator('a[href="#/level/W2-L3"]').count(), 0, 'gA: Level 2.3 (eA) fehlt');
  assert.equal(await page.locator('a[href="#/level/W2-L5"]').count(), 0, 'Kür gesperrt: K1 fehlt');
  assert.equal(await page.locator('a[href="#/level/W2-L1"]').count(), 1, 'Level 2.1 da');

  await einstellen(lehrer.page, ctx, gk, { kuer: 'frei' });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.locator('a[href="#/level/W2-L5"]').waitFor();
  assert.equal(await page.locator('a[href="#/level/W2-L3"]').count(), 0, 'gA: Level 2.3 bleibt ausgeblendet');
  await lehrer.kontext.close();
  await kontext.close();

  // 4) 360 px ohne Querscrollen (Ida K., GK 12)
  const klein = await neueSeite(ctx, { viewport: { width: 360, height: 740 } }, 'Szenario 11 (360 px)');
  await anmelden(klein.page, ctx, 'Ida K.', '/spiel');
  for (const [route, warte] of [
    ['/spiel#/', 'a.tor'],
    ['/spiel#/epoche/1', 'a.karte-akte'],
    ['/spiel#/level/W1-L3', '.level-seite h1'],
    ['/spiel#/aufgabe/W2-L1-06', '#pruefen'],
    ['/spiel#/archivfund/2', '#pruefen'],
    ['/spiel#/boss/2', '.boss-karte'],
    ['/themen', '#welt-2']
  ]) {
    await gehe(klein.page, ctx.basis + route);
    await klein.page.locator(warte).first().waitFor();
    await keinQuerScrollen(klein.page, `360 px ${route}`);
  }
  await klein.kontext.close();
}

module.exports = { szenario11 };
