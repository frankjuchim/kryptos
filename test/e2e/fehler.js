'use strict';
/*
 * e2e – Fehlerzustände (Review M4): Server-500 und Netzwerkfehler per route-Abfangen; die Oberfläche zeigt einen
 * verständlichen Hinweis statt roher Fehlercodes oder HTML. Die erwarteten Konsolenmeldungen (500/502, abgebrochene
 * Verbindung) werden hier selbst geprüft und nicht als Fehler gesammelt.
 */
const assert = require('node:assert/strict');
const { anmelden, gehe } = require('./hilfen');

const HTML_502 = '<!doctype html><html><body><h1>502 Bad Gateway</h1><p>nginx</p></body></html>';

async function seite(ctx, name) {
  const kontext = await ctx.browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await kontext.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => ctx.fehler.push(`${name}: Seitenfehler ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/status of (404|500|502)\b|ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(t)) return; // hier erwartet
    ctx.fehler.push(`${name}: Konsole ${t}`);
  });
  return { kontext, page };
}

async function szenario10(ctx) {
  // Schüler: Prüfen bekommt eine HTML-Fehlerseite (502) → Toast mit verständlichem Hinweis
  const s = await seite(ctx, 'Szenario 10 (Mika)');
  await anmelden(s.page, ctx, 'Mika R.', '/spiel');
  await s.page.route('**/api/aufgaben/*/pruefen', (r) => r.fulfill({ status: 502, contentType: 'text/html', body: HTML_502 }));
  await gehe(s.page, `${ctx.basis}/spiel#/aufgabe/W9-L5-06`);
  await s.page.locator('input.kaestchen').first().fill('A');
  await s.page.locator('#pruefen').click();
  await s.page.locator('#toast', { hasText: 'Der Server antwortet gerade nicht (Fehler 502). Bitte später erneut versuchen.' }).waitFor();
  assert.doesNotMatch(await s.page.locator('#toast').textContent(), /<|nginx/i, 'kein HTML im Hinweis');
  await s.page.unroute('**/api/aufgaben/*/pruefen');

  // Schüler: Netzwerk weg beim Laden eines Levels → Fehlerbox mit Rückweg
  await s.page.route('**/api/levels/**', (r) => r.abort('internetdisconnected'));
  await gehe(s.page, `${ctx.basis}/spiel#/level/W9-L1`);
  await s.page.getByText('Keine Verbindung zum Server. Bitte die Netzwerkverbindung prüfen.').waitFor();
  await s.page.getByRole('link', { name: 'Zur Zeitleiste', exact: true }).waitFor();
  await s.page.unroute('**/api/levels/**');
  await s.kontext.close();

  // Lehrkraft: Server-500 (JSON) im Tab Schülerinnen und Schüler → Fehlertext im Tab, Kopf und Tabs bleiben
  const l = await seite(ctx, 'Szenario 10 (Frau M.)');
  await anmelden(l.page, ctx, 'Frau M.', '/lehrer');
  await l.page.route('**/api/lehrer/kurse/*/schueler', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Interner Fehler.' }) }));
  await gehe(l.page, `${ctx.basis}/lehrer#/kurs/${ctx.kurse.gk}/schueler`);
  await l.page.locator('#tab-inhalt').getByText('Interner Fehler.').waitFor();
  assert.equal(await l.page.locator('.tabs[role="tablist"]').count(), 1, 'Tabs bleiben bedienbar');
  await l.page.unroute('**/api/lehrer/kurse/*/schueler');
  // Lehrkraft: HTML-500 → verständlicher Hinweis (neutral)
  await l.page.route('**/api/lehrer/kurse/*/auswertung', (r) => r.fulfill({ status: 500, contentType: 'text/html', body: HTML_502 }));
  await gehe(l.page, `${ctx.basis}/lehrer#/kurs/${ctx.kurse.gk}/auswertung`);
  await l.page.locator('#tab-inhalt').getByText('Der Server antwortet gerade nicht (Fehler 500). Bitte später erneut versuchen.').waitFor();
  await l.kontext.close();
}

module.exports = { szenario10 };
