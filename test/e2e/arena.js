'use strict';
/*
 * e2e – Knack-Arena (TECHNIK §15 Nr. 6, Plan M7 Task 161): Teams aus Szenario 5 (Skytale = Mika R., Scheibe = Nia T.,
 * Quadrat = Ole B.; das Funkraum-Szenario ist geschlossen). Frau M. legt die Arena an; Mika baut FUNKGITTER (Vigenère +
 * Spaltentransposition, ein geteilter Schlüssel LATERNE) mit Text 1, Ole „Nur Caesar“ (k = 7) mit Text 2 – Werkstatt-Hinweis
 * „Nur Substitutionsstufen“ sichtbar –, beide reichen ein (Nia nicht). Angriffsphase 25 min, Beamer mit zwei Karten (nie
 * Beschreibung); Ole greift Mikas Chiffre mit falschem Schlüssel an („Leider nicht.“), Mika knackt Oles Caesar per Klartext
 * („Geknackt!“, Ticker am Beamer, Toast „Arena-Knacker“). Ende der Angriffsphase → Toast „Unknackbar“ bei Mika; beide
 * beurteilen, die Lehrkraft sieht beide, Ole nie Mikas Beurteilung. Schließen und Löschen → „keine Arena offen“.
 * 360 px ohne Querscrollen. Keine Fotos (E118).
 */
const assert = require('node:assert/strict');
const { anmelden, beobachte, gehe, keinQuerScrollen, Krypto: K } = require('./hilfen');
const { neueSeite } = require('./schueler');
const { teamsEinteilen, schuelerSeite, mitBestaetigung, LANG } = require('./funkraum');
const { TEXT1, TEXT2 } = require('../hilfen_funk');

const BESCHREIBUNG_MIKA = 'Stufe 1 Vigenere mit dem Schluesselwort, Stufe 2 Spaltentransposition mit demselben Wort. Entschluesseln in umgekehrter Reihenfolge.';
const BESCHREIBUNG_OLE = 'Eine Stufe Caesar mit der Verschiebung k. Entschluesseln: um k zurueck.';
const BEURTEILUNG_MIKA = 'Insgesamt ist unser Verfahren recht sicher, weil Vigenere die Haeufigkeiten verwischt und die Spalten die Wortgrenzen zerstoeren.';
const BEURTEILUNG_OLE = 'Insgesamt ist unser Verfahren schwach, weil es nur 25 Schluessel gibt und die Haeufigkeiten erhalten bleiben.';

/** Werkstatt: Stufen über die Testschnittstelle, Felder per Tastatur, Prüfung abwarten, einreichen */
async function einreichen(page, { stufen, name, text, beschreibung, hinweis = null }) {
  await page.locator('p.werkstatt-phase', { hasText: 'Die Arena ist offen' }).waitFor({ timeout: LANG });
  await page.evaluate((s) => KRWerkstatt.setzeStufen(s), stufen);
  await page.locator('input.werkstatt-name').fill(name);
  await page.locator('textarea.werkstatt-klartext').fill(text);
  await page.locator('textarea.werkstatt-beschreibung').fill(beschreibung);
  await page.locator('button.werkstatt-einreichen:enabled').waitFor();
  if (hinweis) await page.locator('ul.werkstatt-hinweise li', { hasText: hinweis }).waitFor();
  const z = await page.evaluate(() => KRWerkstatt.zustand());
  assert.ok(z.pruefung && z.pruefung.ok, 'Verfahren umkehrbar');
  await Promise.all([page.waitForResponse((r) => /\/api\/arena\/\d+\/chiffre$/.test(r.url()) && r.request().method() === 'POST' && r.ok()), page.locator('button.werkstatt-einreichen').click()]);
  await page.locator('section.werkstatt-eigene code.werkstatt-eingereicht').waitFor();
  return z;
}

async function szenario6(ctx) {
  ctx.szenario = 'Szenario 6';
  const lk = await neueSeite(ctx, {}, 'Szenario 6 (Frau M.)');
  const lp = lk.page;
  await anmelden(lp, ctx, 'Frau M.', '/lehrer');
  const { lk: kurs, teams } = await teamsEinteilen(ctx, lp);
  assert.equal(teams['Mika R.'], 'Team Skytale');
  assert.equal(teams['Ole B.'], 'Team Quadrat');

  // 1. Arena anlegen
  await gehe(lp, `${ctx.basis}/lehrer#/kurs/${kurs}/arena`);
  await lp.locator('button.arena-anlegen').click();
  await lp.locator('p.arena-status', { hasText: '0 Chiffren eingereicht' }).waitFor({ timeout: LANG });
  const arenaId = /\/beamer\/arena\/(\d+)$/.exec(await lp.locator('a.beamer-oeffnen').getAttribute('href'))[1];

  // 2. Mika: FUNKGITTER mit Text 1; Ole: Nur Caesar (k = 7) mit Text 2 und Hinweis
  const mika = await schuelerSeite(ctx, 'Mika R.', '/werkstatt');
  const ole = await schuelerSeite(ctx, 'Ole B.', '/werkstatt');
  const zm = await einreichen(mika.page, {
    stufen: [{ typ: 'vigenere', param: { schluessel: 'LATERNE' } }, { typ: 'spaltentransposition', teilen: { schluessel: 1 } }],
    name: 'FUNKGITTER',
    text: TEXT1,
    beschreibung: BESCHREIBUNG_MIKA
  });
  assert.deepEqual(zm.schluessel, { s1: 'LATERNE' }, 'ein geteilter Schlüssel');
  assert.deepEqual(zm.verfahren.stufen.map((s) => s.param.schluessel), ['$s1', '$s1']);
  assert.equal(K.nurBuchstaben(TEXT1).length, 167);
  const mikaGeheim = (await mika.page.locator('code.werkstatt-eingereicht').textContent()).replace(/\s+/g, '');
  assert.equal(mikaGeheim, K.baukasten.verschluesseln(zm.verfahren, zm.schluessel, TEXT1).geheimtext.replace(/\s+/g, ''), 'Geheimtext = Krypto.baukasten');
  assert.ok(mikaGeheim.startsWith('MRESEIEAUISIRUT'), 'Wert aus dem Plan (MRESE IEAUI SIRUT …)');
  const zo = await einreichen(ole.page, { stufen: [{ typ: 'caesar', param: { k: 7 } }], name: 'Nur Caesar', text: TEXT2, beschreibung: BESCHREIBUNG_OLE, hinweis: 'Nur Substitutionsstufen' });
  assert.deepEqual(zo.schluessel, { s1: 7 });

  // 3. Angriffsphase (25 min), Beamer mit zwei Karten – nie eine Beschreibung
  await lp.locator('li.lk-arena-chiffre').nth(1).waitFor({ timeout: LANG });
  await lp.locator('input.dauer').fill('25');
  await lp.locator('button.angriff-starten').click();
  await lp.locator('button.arena-beenden').waitFor({ timeout: LANG });
  const beamer = await lk.kontext.newPage();
  beamer.setDefaultTimeout(LANG);
  beobachte(beamer, 'Szenario 6 (Beamer)', ctx.fehler);
  await beamer.setViewportSize({ width: 1920, height: 1080 });
  await gehe(beamer, `${ctx.basis}/beamer/arena/${arenaId}`);
  await beamer.locator('li.beamer-arena-karte').nth(1).waitFor();
  assert.equal(await beamer.locator('li.beamer-arena-karte').count(), 2, 'zwei Karten');
  assert.match(await beamer.locator('p.beamer-restzeit').textContent(), /^2[45]:\d\d$/, 'Restzeit-Uhr');
  const beamerText = await beamer.locator('body').textContent();
  for (const b of [BESCHREIBUNG_MIKA, BESCHREIBUNG_OLE]) assert.ok(!beamerText.includes(b.slice(0, 30)), 'Beamer ohne Beschreibung');

  // 4. Arena-Ansicht: Ole greift Mikas Chiffre mit falschem Schlüssel an, Mika knackt Oles Caesar per Klartext
  const mp = mika.page;
  const op = ole.page;
  await gehe(mp, `${ctx.basis}/werkstatt#/arena`);
  await gehe(op, `${ctx.basis}/werkstatt#/arena`);
  const fremd = (p) => p.locator('li.arena-chiffre:not(.eigene)', { has: p.locator('form.arena-angriff') });
  await fremd(op).waitFor({ timeout: LANG });
  await fremd(mp).waitFor({ timeout: LANG });
  assert.equal(await mp.locator('li.arena-chiffre.eigene form.arena-angriff').count(), 0, 'eigene Chiffre ohne Angriff');
  const oleAngriff = fremd(op).locator('form.arena-angriff');
  await oleAngriff.locator('button.arena-reiter[data-reiter="schluessel"]').click();
  await oleAngriff.locator('input.arena-schluessel[data-name="s1"]').fill('LATERNA');
  await oleAngriff.locator('button.arena-senden').click();
  await oleAngriff.locator('p.arena-ergebnis', { hasText: 'Leider nicht.' }).waitFor();
  assert.match(await oleAngriff.locator('p.arena-rest').textContent(), /Nächster Versuch auf diese Chiffre in \d+ s · noch 59 Versuche/);

  const mikaAngriff = fremd(mp).locator('form.arena-angriff');
  await mikaAngriff.locator('textarea.arena-klartext').fill(TEXT2);
  await mikaAngriff.locator('button.arena-senden').click();
  await mikaAngriff.locator('p.arena-ergebnis', { hasText: 'Geknackt!' }).waitFor();
  await mp.locator('#toast', { hasText: 'Abzeichen: Arena-Knacker' }).waitFor({ timeout: LANG });
  await beamer.locator('ol.arena-ticker li', { hasText: 'Team Skytale hat die Chiffre von Team Quadrat geknackt' }).waitFor({ timeout: LANG });
  await beamer.locator('li.beamer-arena-karte.geknackt', { hasText: 'Team Quadrat' }).waitFor({ timeout: LANG });

  // 360 px ohne Querscrollen (Arena-Ansicht)
  await mp.setViewportSize({ width: 360, height: 740 });
  await mp.waitForTimeout(300);
  await keinQuerScrollen(mp, 'Knack-Arena 360 px (Mika)');
  await mp.setViewportSize({ width: 1280, height: 800 });

  // 5. Ende der Angriffsphase → „Unknackbar“ bei Mika; Beurteilungen
  await mitBestaetigung(lp, lp.locator('button.arena-beenden'), 'Beenden');
  await mp.locator('#toast', { hasText: 'Abzeichen: Unknackbar' }).waitFor({ timeout: LANG });
  for (const [p, text] of [[mp, BEURTEILUNG_MIKA], [op, BEURTEILUNG_OLE]]) {
    const form = p.locator('form.arena-beurteilung');
    await form.waitFor({ timeout: LANG });
    await form.locator('#arena-beurteilung-text').fill(text);
    await form.locator('button[type="submit"]').click();
    await form.locator('p.arena-beurteilung-meldung', { hasText: 'Gespeichert.' }).waitFor();
  }
  const sammlung = lp.locator('section.beurteilungen');
  await sammlung.locator('dd.beurteilung-text').nth(1).waitFor({ timeout: LANG });
  const gesammelt = await sammlung.textContent();
  assert.ok(gesammelt.includes(BEURTEILUNG_MIKA) && gesammelt.includes(BEURTEILUNG_OLE), 'Lehrkraft sieht beide Beurteilungen');
  await op.reload();
  await op.locator('form.arena-beurteilung').waitFor({ timeout: LANG });
  assert.ok(!(await op.locator('body').textContent()).includes(BEURTEILUNG_MIKA), 'Ole sieht Mikas Beurteilung nicht');
  const oleDaten = await op.evaluate(async (id) => JSON.stringify([await (await fetch('/api/arena')).json(), await (await fetch(`/api/arena/${id}/chiffren`)).json()]), arenaId);
  assert.ok(!oleDaten.includes(BEURTEILUNG_MIKA.slice(0, 40)), 'Mikas Beurteilung in keiner Antwort an Ole');
  assert.ok(oleDaten.includes(BEURTEILUNG_OLE.slice(0, 40)), 'eigene Beurteilung ist da');
  assert.ok(!(await beamer.locator('body').textContent()).includes(BEURTEILUNG_MIKA.slice(0, 30)), 'Beamer ohne Beurteilung');
  const profil = await mp.evaluate(() => fetch('/api/profil').then((r) => r.json()));
  const keys = (profil.abzeichen || []).map((a) => a.key);
  assert.ok(keys.includes('arena_knacker') && keys.includes('unknackbar'), `Mikas Abzeichen (${keys.join(', ')})`);

  // 6. Schließen und löschen → keine Arena
  await mitBestaetigung(lp, lp.locator('button.arena-schliessen'), 'Schließen');
  await lp.locator('button.arena-loeschen').waitFor({ timeout: LANG });
  await lp.locator('p.arena-status', { hasText: 'geschlossen' }).waitFor({ timeout: LANG });
  await mitBestaetigung(lp, lp.locator('button.arena-loeschen'), 'Löschen');
  await lp.locator('button.arena-anlegen', { hasText: 'Arena anlegen' }).waitFor({ timeout: LANG });
  await beamer.getByText('Keine Arena geöffnet.').waitFor({ timeout: LANG });
  await gehe(mp, `${ctx.basis}/werkstatt#/arena`);
  await mp.locator('p.arena-phase', { hasText: 'Gerade ist keine Arena offen.' }).waitFor({ timeout: LANG });
  await keinQuerScrollen(mp, 'Werkstatt ohne Arena');

  for (const s of [mika, ole]) await s.kontext.close();
  await lk.kontext.close();
}

module.exports = { szenario6 };
