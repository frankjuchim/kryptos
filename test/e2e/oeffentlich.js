'use strict';
/*
 * e2e – Szenario 14 „Öffentlich und Verbund-Wege“ (Plan M9 Task 216, TECHNIK §15). Läuft nach Szenario 13 im App-Start
 * mit den echten Seeds, jeweils in neuen Browser-Kontexten:
 *  ohne Anmeldung: Startseite („Anmelden über InfoLabs“, Gastmodus, keine Cookies), /themen und /themen#niveaus,
 *  /datenschutz (Entwurf-Kasten, Platzhalter, Link auf <Portal>/datenschutz), 404-Seite im Designsystem, /robots.txt,
 *  /spiel → Dev-Portal mit ziel=/spiel, „Abbrechen“ → /?abgebrochen=1 mit Hinweis;
 *  Mika: „Abmelden“ (lokal) und „Überall abmelden“ über <Dev-Portal>/sso/abmelden?ruecksprung=…;
 *  Ida K. im gesperrten Kurs (Verbund kurs-aendern {aktiv:false} per Dev-Portal-Knopf) → Seite „Kurs abgeschaltet“, danach
 *  wieder eingeschaltet. 360 px ohne Querscrollen; Kontrastmessung hell/dunkel für /, /themen, /datenschutz, 404.
 */
const assert = require('node:assert/strict');
const { anmelden, gehe, keinQuerScrollen, kontraste } = require('./hilfen');
const { neueSeite } = require('./schueler');

/** Kurs im Dev-Portal für Kryptos ab- bzw. einschalten (Formular „Kryptos für den Kurs“). */
async function kursAktiv(page, ctx, kurs, aktiv) {
  await page.goto(ctx.portal + '/');
  const form = page.locator('form[action="/verbund/aktiv"]');
  await form.locator('select[name="kurs"]').selectOption(kurs);
  await form.locator('select[name="aktiv"]').selectOption(aktiv ? 'true' : 'false');
  await form.locator('button[type="submit"]').click();
  await page.locator('pre', { hasText: '→ 200' }).waitFor();
}

async function szenario14(ctx) {
  /* Ohne Anmeldung */
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 14 (öffentlich)');
  await gehe(page, ctx.basis + '/');
  await page.locator('#kopf a.anmelden', { hasText: 'Anmelden über InfoLabs' }).waitFor();
  assert.ok(await page.locator('a[href="/gast"]').count(), 'Link zum Gastmodus');
  await gehe(page, ctx.basis + '/themen');
  await page.locator('#welten').waitFor();
  // Sprungziel wie der Manifest-Link des Portals (urls.niveaus): frisch geladen, Inhalte kommen asynchron
  await gehe(page, ctx.basis + '/');
  await gehe(page, ctx.basis + '/themen#niveaus');
  await page.locator('#niveau-inhalt .niveau-welt-abschnitt').first().waitFor();
  assert.equal(await page.locator('#niveau-inhalt .niveau-welt-abschnitt').count(), 7, 'sieben Welten');
  assert.match(await page.locator('#niveau-inhalt').textContent(), /eA/, 'eA-Kennzeichnung');
  await page.waitForFunction(() => { const r = document.getElementById('niveaus').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 && window.scrollY > 0; }, null, { timeout: 3000 }); // Sprungziel #niveaus im Blick
  await gehe(page, ctx.basis + '/datenschutz');
  await page.locator('.rueckmeldung.info', { hasText: 'Entwurf' }).waitFor();
  for (const t of ['[Name der Schule]', '[Hoster, Standort in der EU]']) await page.getByText(t, { exact: false }).first().waitFor();
  await page.waitForFunction((p) => document.getElementById('portal-datenschutz').getAttribute('href') === p + '/datenschutz', ctx.portal);
  const r404 = await page.goto(ctx.basis + '/404-gibt-es-nicht');
  assert.equal(r404.status(), 404);
  await page.locator('h1', { hasText: 'Seite nicht gefunden' }).waitFor();
  assert.equal(await page.locator('link[href^="/static/css/tokens.css"]').count(), 1, '404 im Designsystem');
  const robots = await kontext.request.get(ctx.basis + '/robots.txt');
  assert.match(await robots.text(), /^Disallow: \/$/m);
  assert.deepEqual((await kontext.cookies(ctx.basis)).map((c) => c.name), [], 'keine Cookies auf öffentlichen Seiten');

  // /spiel ohne Sitzung → Dev-Portal mit ziel=/spiel; „Abbrechen“ → /?abgebrochen=1
  await page.goto(ctx.basis + '/spiel');
  await page.waitForURL((u) => u.toString().startsWith(ctx.portal + '/sso/autorisieren'));
  assert.equal(new URL(page.url()).searchParams.get('ziel'), '/spiel');
  await page.getByRole('link', { name: 'Abbrechen' }).click();
  await page.waitForURL((u) => u.toString() === ctx.basis + '/?abgebrochen=1');
  await page.locator('.rueckmeldung.info', { hasText: 'Die Anmeldung wurde abgebrochen' }).waitFor();

  // 360 px ohne Querscrollen; Kontraste hell und dunkel
  await page.setViewportSize({ width: 360, height: 740 });
  for (const p of ['/', '/themen', '/themen#niveaus', '/datenschutz', '/404-gibt-es-nicht']) {
    await gehe(page, ctx.basis + p);
    await keinQuerScrollen(page, `360 px ${p}`);
  }
  await kontext.close();
  const verstoesse = [];
  for (const schema of ['light', 'dark']) {
    const k = await neueSeite(ctx, { colorScheme: schema, reducedMotion: 'reduce' }, `Szenario 14 (Kontrast ${schema})`);
    for (const p of ['/', '/themen', '/datenschutz', '/404-gibt-es-nicht']) {
      await gehe(k.page, ctx.basis + p);
      await k.page.waitForTimeout(100);
      verstoesse.push(...(await kontraste(k.page, `${schema} ${p}`)));
    }
    await k.kontext.close();
  }
  assert.deepEqual(verstoesse, [], 'Kontraste');

  /* Mika: Abmelden (lokal), Überall abmelden (über das Dev-Portal) */
  const mika = await neueSeite(ctx, {}, 'Szenario 14 (Mika)');
  await anmelden(mika.page, ctx, 'Mika R.', '/spiel');
  await mika.page.locator('details.menue > summary').click();
  await mika.page.locator('button.abmelden').click();
  await mika.page.waitForURL((u) => u.toString() === ctx.basis + '/');
  assert.equal((await mika.kontext.cookies(ctx.basis)).filter((c) => c.name === 'kr_s').length, 0, 'kr_s gelöscht');
  await anmelden(mika.page, ctx, 'Mika R.', '/spiel');
  const wege = [];
  mika.page.on('request', (r) => r.isNavigationRequest() && wege.push(r.url()));
  await mika.page.locator('details.menue > summary').click();
  await mika.page.locator('button.abmelden-ueberall').click();
  await mika.page.waitForURL((u) => u.toString() === ctx.basis + '/');
  assert.ok(wege.some((u) => u.startsWith(`${ctx.portal}/sso/abmelden?ruecksprung=${encodeURIComponent(ctx.basis + '/')}`)), `über das Dev-Portal: ${wege.join(' → ')}`);
  assert.equal((await mika.kontext.cookies(ctx.basis)).filter((c) => c.name === 'kr_s').length, 0, 'kr_s gelöscht');
  await mika.kontext.close();

  /* Ida K. im gesperrten Kurs (GK 12, k:2) – danach wieder eingeschaltet */
  const portal = await neueSeite(ctx, {}, 'Szenario 14 (Dev-Portal)');
  const ida = await neueSeite(ctx, {}, 'Szenario 14 (Ida)');
  await anmelden(ida.page, ctx, 'Ida K.', '/spiel');
  const vorher = ctx.fehler.length;
  try {
    await kursAktiv(portal.page, ctx, 'k:2', false);
    const api = await ida.page.evaluate(async () => (await fetch('/api/profil')).status);
    assert.equal(api, 403, 'API im gesperrten Kurs');
    await ida.page.goto(ctx.basis + '/spiel');
    await anmeldenFalls(ida.page, ctx, 'Ida K.');
    await ida.page.locator('h1', { hasText: 'Kurs abgeschaltet' }).waitFor();
    await ida.page.getByText('Kryptos ist für deinen Kurs gerade abgeschaltet', { exact: false }).waitFor();
    await ida.page.setViewportSize({ width: 360, height: 740 });
    await keinQuerScrollen(ida.page, '360 px Kurs abgeschaltet');
  } finally {
    await kursAktiv(portal.page, ctx, 'k:2', true);
  }
  // erwartete 403 der Seite „Kurs abgeschaltet“ (Antwort auf /sso/ende) bzw. von /api/profil sind kein Fehler
  const neu = ctx.fehler.splice(vorher);
  ctx.fehler.push(...neu.filter((f) => !/status of 403\b/.test(f) || !/\/sso\/ende|\/api\/profil/.test(f)));
  await ida.page.setViewportSize({ width: 1280, height: 800 });
  await anmelden(ida.page, ctx, 'Ida K.', '/spiel');
  assert.equal(new URL(ida.page.url()).pathname, '/spiel', 'nach dem Einschalten wieder in Kryptos');
  await ida.kontext.close();
  await portal.kontext.close();
}

/** Steht die Seite im Dev-Portal (Kontenauswahl), das Konto wählen. */
async function anmeldenFalls(page, ctx, wer) {
  await page.waitForLoadState('networkidle');
  if (!page.url().startsWith(ctx.portal)) return;
  await page.getByRole('link', { name: new RegExp('^' + wer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
  await page.waitForURL((u) => u.toString().startsWith(ctx.basis));
  await page.waitForLoadState('networkidle');
}

module.exports = { szenario14 };
