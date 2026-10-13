'use strict';
/*
 * e2e – Lehrkraft (TECHNIK §15 Nr. 7): 7a Einstellungen (Niveau gA, Boss offen, Beamer-Board, Werkzeug gesperrt),
 * Auswertung, Vorschau, Materialien, Urkunden; 7b Wirkung bei den Schülerinnen und Schülern (gA blendet eA aus,
 * gesperrtes Werkzeug fehlt auf der Level-Karte und ist im Labor gesperrt).
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe } = require('./hilfen');
const { neueSeite } = require('./schueler');

/** Kurs in der Kursliste öffnen; liefert die lokale id aus dem Link. */
async function kursId(page, ctx, name) {
  await gehe(page, ctx.basis + '/lehrer#/');
  const link = page.locator('table.kurs-tabelle a', { hasText: name });
  await link.waitFor();
  const href = await link.getAttribute('href');
  const m = /#\/kurs\/(\d+)\//.exec(href || '');
  assert.ok(m, `lokale Kurs-id im Link (${href})`);
  return m[1];
}

async function speichern(page) {
  // auf die PATCH-Antwort warten – ein noch sichtbarer Toast des vorigen Speicherns zählt nicht
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'PATCH' && r.ok()), page.locator('form.einstellungen button[type="submit"]').click()]);
  await page.locator('#toast', { hasText: 'Gespeichert.' }).waitFor();
}

/** Kurs über das Menü der Kopfzeile wählen (Menü → #kopf-kurs → button.kurs-wechseln); ohne Wechsel nur Menü schließen. */
async function kursWaehlen(page, name) {
  const wahl = page.locator('#kopf-kurs');
  await page.locator('details.menue > summary').click();
  const wert = await wahl.locator('option', { hasText: name }).getAttribute('value');
  if ((await wahl.inputValue()) !== wert) {
    await wahl.selectOption(wert);
    await Promise.all([page.waitForEvent('load'), page.locator('button.kurs-wechseln').click()]);
  } else await page.locator('details.menue > summary').click();
}

async function szenario7a(ctx) {
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 7a');
  await anmelden(page, ctx, 'Frau M.', '/lehrer');
  await page.locator('table.kurs-tabelle').waitFor();
  assert.equal(await page.locator('table.kurs-tabelle tbody tr').count(), 2, 'zwei Kurse aus dem Portal');
  await foto(page, 'lehrkraft-kurse');
  const gk = await kursId(page, ctx, 'GK 12 (gA)');
  const lk = await kursId(page, ctx, 'LK 13 (eA)');
  ctx.kurse = { gk, lk };

  // GK 12: Niveau gA, Boss offen, Beamer-Board an
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${gk}/einstellungen`);
  await page.locator('form.einstellungen').waitFor();
  await page.locator('input[name="niveau"][value="gA"]').check();
  await page.locator('input[name="boss"][value="offen"]').check();
  await page.locator('input[name="beamer"]').check();
  assert.equal(await page.locator('a.board-link').isVisible(), false, 'Board-Link erst nach dem Speichern (Review M4 K3)');
  await speichern(page);
  // Review M4 W2: Niveau-Chip im Kurskopf zeigt sofort das gespeicherte Niveau
  assert.equal((await page.locator('.kurs-kopf .chip-kursniveau').textContent()).trim(), 'gA', 'Niveau-Chip nach dem Speichern');
  await foto(page, 'lehrkraft-einstellungen', { ganz: true });
  const href = await page.locator('a.board-link').getAttribute('href');
  ctx.boardSchluessel = decodeURIComponent((href || '').replace('/board/', ''));
  assert.ok(ctx.boardSchluessel.length >= 8, 'Board-Schlüssel');

  // LK 13: Chiffrierscheibe gesperrt
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/einstellungen`);
  await page.locator('select[name="werkzeug-scheibe"]').selectOption('gesperrt');
  await speichern(page);

  // Auswertung LK 13: Mikas Zeile mit Text in den Zellen
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/auswertung`);
  const zeile = page.locator('table.matrix-lehrkraft tbody tr', { hasText: 'Mika R.' });
  await zeile.waitFor();
  const zellen = await zeile.locator('td').allTextContents();
  assert.ok(zellen.length > 0 && zellen.every((t) => t.trim().length > 0), 'Zellen mit Text (nie nur Farbe)');
  await page.locator('.fallen-profil').waitFor();
  await foto(page, 'lehrkraft-auswertung', { ganz: true });

  // Vorschau: eA-Level mit Hinweis, Aufgabe mit eingesetzter Lösung
  await gehe(page, `${ctx.basis}/lehrer#/vorschau/welt/9`);
  await page.locator('section.vorschau-level', { has: page.locator('#vl-W9-L3') }).getByText('im gA-Kurs ausgeblendet').first().waitFor();
  await gehe(page, `${ctx.basis}/lehrer#/vorschau/aufgabe/W9-L5-01`);
  await page.locator('input.kaestchen').first().waitFor();
  const werte = await page.locator('input.kaestchen').evaluateAll((l) => l.map((x) => x.value).join(''));
  assert.equal(werte.toLowerCase(), 'zuverlaessig', 'Vorschau zeigt die Lösung');
  await foto(page, 'lehrkraft-vorschau', { ganz: true });

  // Materialien und Urkunden
  await gehe(page, `${ctx.basis}/lehrer#/materialien`);
  await page.locator('h1', { hasText: 'Materialien' }).waitFor();
  await gehe(page, `${ctx.basis}/lehrer/urkunden?kurs=${lk}`);
  await page.locator('.urkunde').first().waitFor();
  await foto(page, 'urkunde');
  await kontext.close();
}

async function szenario7b(ctx) {
  // Ida (nur GK 12, jetzt gA): eA-Level W9-L3 weder sichtbar noch direkt erreichbar
  const ida = await neueSeite(ctx, {}, 'Szenario 7b (Ida)');
  await anmelden(ida.page, ctx, 'Ida K.', '/spiel');
  await gehe(ida.page, `${ctx.basis}/spiel#/epoche/9`);
  await ida.page.locator('a.karte-akte').first().waitFor();
  assert.equal(await ida.page.locator('a[href="#/level/W9-L3"]').count(), 0, 'gA: keine eA-Level-Karte');
  await gehe(ida.page, `${ctx.basis}/spiel#/level/W9-L3`);
  await ida.page.getByText('Level nicht gefunden.').waitFor();
  await ida.kontext.close();

  // Mika im LK 13: Chiffrierscheibe gesperrt
  const mika = await neueSeite(ctx, {}, 'Szenario 7b (Mika)');
  await anmelden(mika.page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(mika.page, 'LK 13 (eA)');
  await gehe(mika.page, `${ctx.basis}/spiel#/level/W9-L1`);
  await mika.page.locator('.aufgaben-liste').waitFor();
  assert.equal(await mika.page.locator('a[href^="/labor#/scheibe"]').count(), 0, 'gesperrtes Werkzeug ohne Labor-Karte');
  await gehe(mika.page, `${ctx.basis}/labor`);
  const karte = mika.page.locator('.werkzeug-karte.gesperrt', { hasText: 'Chiffrierscheibe' });
  await karte.waitFor();
  await karte.getByText('Deine Lehrkraft schaltet dieses Werkzeug später frei.').waitFor();
  await mika.kontext.close();
}

module.exports = { szenario7a, szenario7b, kursWaehlen };
