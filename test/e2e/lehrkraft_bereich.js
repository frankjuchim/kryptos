'use strict';
/*
 * e2e – Szenario 13 „Lehrkraft-Bereich im Algo-Quest-Aufbau“ (Plan M9 Task 215, E161, TECHNIK §15). Läuft nach den
 * Szenarien 11 und 12 im selben App-Start mit den echten Seeds (Kurseinstellungen aus 11/12: LK 13 eA mit allen Welten,
 * GK 12 gA). Frau M. (1280 × 800) geht die Ordnung der anderen Labs vollständig ab:
 *  Kopfzeile Kurse · Aufgaben · Materialien · Themen · Labor (Admin zusätzlich Verwaltung vor Labor) und Portal;
 *  Kurse mit Niveau-Chip und Urkunden-Knopf; Kurs-Reiter Schüler · Beitritt & QR · Auswertung · Scoreboard · Einstellungen ·
 *  Teams · Funkraum · Knack-Arena (je Überschrift, keine Fehlermeldung; QR-Code, CSV, Board-Link ohne Anmeldung);
 *  Urkunden; Aufgaben-Vorschau Welt 3 → Level 3.2 (eA) → W3-L2-03 mit Lösung; Materialien je Welt mit Download (Lösung W0)
 *  und Funkraum-Rollenkarte W3; Themen #niveaus; Verwaltung (Admin) mit fünf Reitern, Backup-JSON, Wartung.
 *  360 px ohne Querscrollen, Touch-Ziele ≥ 44 px. Fotos lehrkraft-kurse, -auswertung, -einstellungen, -materialien, verwaltung (Task 217).
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe, keinQuerScrollen, ziele44 } = require('./hilfen');
const { neueSeite } = require('./schueler');
const { kursId } = require('./inhalte');

const REITER = ['Schüler', 'Beitritt & QR', 'Auswertung', 'Scoreboard', 'Einstellungen', 'Teams', 'Funkraum', 'Knack-Arena'];
const ADMIN_REITER = ['Lehrkräfte & Anfragen', 'Inhalte', 'Warm-up-Import', 'Backup & Verbund', 'Wartung'];

const texte = (loc) => loc.evaluateAll((l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));

/** Reiter-Inhalt fertig: Überschrift sichtbar, kein „Wird geladen“, keine Fehlerbox. */
async function reiterFertig(page, ort) {
  const box = page.locator('#tab-inhalt, #admin-inhalt').first();
  await box.locator('h2, h3, legend').first().waitFor();
  await page.waitForLoadState('networkidle');
  await page.locator('#tab-inhalt .laden, #admin-inhalt .laden').waitFor({ state: 'detached' });
  assert.equal(await box.locator('.fehler-box').count(), 0, `${ort}: Fehlermeldung`);
}

/** Kopfzeile: Reihenfolge der Bereiche und Portal-Link. */
async function kopfzeile(page, erwartet) {
  const nav = page.locator('#kopf nav.kopf-seiten a');
  await nav.first().waitFor();
  assert.deepEqual(await texte(nav), erwartet, 'Kopfzeile');
  assert.equal(await page.locator('#kopf a[aria-label="Zurück ins Portal InfoLabs"]').count(), 1, 'Portal-Link');
}

async function szenario13(ctx) {
  // Ole B. und Nia T. melden sich einmal an (sie erscheinen in Kryptos erst nach ihrer ersten Anmeldung)
  for (const name of ['Ole B.', 'Nia T.']) {
    const s = await neueSeite(ctx, {}, `Szenario 13 (${name})`);
    await anmelden(s.page, ctx, name, '/spiel');
    await s.kontext.close();
  }

  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 13 (Frau M.)');
  await anmelden(page, ctx, 'Frau M.', '/lehrer');
  await kopfzeile(page, ['Kurse', 'Aufgaben', 'Materialien', 'Themen', 'Labor']);

  // Kurse: LK 13 und GK 12 mit Niveau-Chip
  const lk = await kursId(page, ctx, 'LK 13 (eA)');
  await kursId(page, ctx, 'GK 12 (gA)');
  await foto(page, 'lehrkraft-kurse');

  // Kurs-Reiter in Reihenfolge, je Reiter Überschrift ohne Fehler
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/schueler`);
  await page.locator('.kurs-kopf h1', { hasText: 'LK 13 (eA)' }).waitFor();
  assert.ok(/eA/.test(await page.locator('.kurs-kopf').textContent()), 'Niveau-Chip eA im Kurskopf');
  await page.locator('.kurs-kopf a.kurs-urkunden', { hasText: 'Urkunden' }).waitFor();
  assert.deepEqual(await texte(page.locator('.tabs[role="tablist"] [role="tab"]')), REITER, 'Kurs-Reiter');
  const keys = await page.locator('.tabs[role="tablist"] [role="tab"]').evaluateAll((l) => l.map((x) => x.dataset.tab));
  for (const [i, key] of keys.entries()) {
    await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/${key}`);
    await page.locator(`#tab-${key}[aria-selected="true"]`).waitFor(); // Reiter ${REITER[i]} aktiv
    await reiterFertig(page, `Reiter ${REITER[i]}`);
  }

  // Schüler: Mika R., Ole B., Nia T.
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/schueler`);
  await reiterFertig(page, 'Schüler');
  const namen = await texte(page.locator('table.schueler-tabelle tbody th'));
  for (const n of ['Mika R.', 'Ole B.', 'Nia T.']) assert.ok(namen.some((x) => x.startsWith(n)), `${n} in der Schülerliste (${namen.join(', ')})`);

  // Beitritt & QR: Hinweis auf das Portal, QR-Code (SVG, 200)
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/beitritt`);
  await reiterFertig(page, 'Beitritt & QR');
  await page.locator('#tab-inhalt', { hasText: 'Portal InfoLabs' }).waitFor();
  const qr = page.locator('img.qr');
  await qr.waitFor();
  // das Bild lädt nach networkidle gelegentlich noch (eigene Anfrage) – bis zu 5 s warten
  assert.ok(await qr.evaluate((img) => (img.complete && img.naturalWidth > 0) || new Promise((ok) => { img.addEventListener('load', () => ok(img.naturalWidth > 0)); img.addEventListener('error', () => ok(false)); setTimeout(() => ok(img.complete && img.naturalWidth > 0), 5000); })), 'QR-Code geladen');
  const qrAntwort = await kontext.request.get(`${ctx.basis}${await qr.getAttribute('src')}`);
  assert.equal(qrAntwort.status(), 200);
  assert.match(qrAntwort.headers()['content-type'], /image\/svg\+xml/);

  // Auswertung: Matrix mit Mika, CSV mit Kopfzeile und Mika
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/auswertung`);
  await reiterFertig(page, 'Auswertung');
  await page.locator('#tab-inhalt table', { hasText: 'Mika R.' }).first().waitFor();
  await foto(page, 'lehrkraft-auswertung');
  const csvLink = page.locator('#tab-inhalt a[href*="export.csv?art=uebersicht"]');
  const csv = await kontext.request.get(ctx.basis + (await csvLink.getAttribute('href')));
  assert.equal(csv.status(), 200);
  assert.match(csv.headers()['content-type'], /text\/csv/);
  const csvText = await csv.text();
  assert.ok(csvText.split('\n')[0].length > 5, 'CSV-Kopfzeile');
  assert.match(csvText, /Mika R\./);

  // Einstellungen: alle sieben Welten, Niveau, Kür, Werkzeuge; Beamer-Board einschalten für den Board-Link
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/einstellungen`);
  await page.locator('form.einstellungen').waitFor();
  assert.deepEqual(await page.locator('input[name="welt"]').evaluateAll((l) => l.map((x) => Number(x.value))), [0, 1, 2, 3, 4, 5, 6]);
  for (const sel of ['input[name="niveau"][value="eA"]', 'input[name="niveau"][value="gA"]', 'input[name="kuer"]', 'form.einstellungen select']) assert.ok(await page.locator(sel).count(), sel);
  await foto(page, 'lehrkraft-einstellungen');
  const beamer = page.locator('input[name="beamer"]');
  if (!(await beamer.isChecked())) {
    await beamer.check();
    await page.locator('form.einstellungen button[type="submit"]').click();
    await page.locator('#toast', { hasText: 'Gespeichert.' }).waitFor();
  }

  // Scoreboard: Rangliste; Board-Link öffnet /board/<schluessel> ohne Anmeldung
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/scoreboard`);
  await reiterFertig(page, 'Scoreboard');
  await page.locator('table.scoreboard-tabelle', { hasText: 'Mika R.' }).waitFor();
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/beitritt`);
  const boardHref = await page.locator('#tab-inhalt a[href^="/board/"]').getAttribute('href');
  assert.match(boardHref, /^\/board\/[\w-]+$/);
  const anonym = await neueSeite(ctx, {}, 'Szenario 13 (Board ohne Anmeldung)');
  await gehe(anonym.page, ctx.basis + boardHref);
  assert.equal(new URL(anonym.page.url()).pathname, boardHref, 'Board ohne Weiterleitung zur Anmeldung');
  await anonym.page.locator('body', { hasText: 'Mika R.' }).waitFor();
  await anonym.kontext.close();

  // Urkunden: Mika, Druckansicht ohne Querscrollen
  await gehe(page, `${ctx.basis}/lehrer/urkunden?kurs=${lk}`);
  await page.locator('.urkunde', { hasText: 'Mika R.' }).first().waitFor();
  await page.emulateMedia({ media: 'print' });
  await keinQuerScrollen(page, 'Urkunden (Druck)');
  await page.emulateMedia({ media: 'screen' });

  // Aufgaben: Vorschau Welt 3 → Level 3.2 mit eA-Hinweis → W3-L2-03 mit Lösung
  await gehe(page, `${ctx.basis}/lehrer#/vorschau`);
  await page.locator('a[href="#/vorschau/welt/3"]').click();
  const level32 = page.locator('section.vorschau-level', { has: page.locator('#vl-W3-L2') });
  await level32.waitFor();
  assert.match(await level32.locator('.vorschau-level-kopf').textContent(), /eA/, 'Level 3.2 mit eA-Kennzeichnung');
  await gehe(page, `${ctx.basis}/lehrer#/vorschau/aufgabe/W3-L2-03`);
  await page.locator('.aufgabe-kopf .chip', { hasText: 'W3-L2-03' }).waitFor();
  await page.locator('.rueckmeldung.info', { hasText: 'Vorschau mit eingesetzter Lösung' }).waitFor();
  await page.locator('section.erklaerung').waitFor();

  // Materialien: je Welt 0–6, Download „Lösung“ W0 (PDF, 200), Funkraum-Rollenkarte W3
  await gehe(page, `${ctx.basis}/lehrer#/materialien`);
  for (let w = 0; w <= 6; w++) await page.locator(`#material-welt-${w}`).waitFor();
  await foto(page, 'lehrkraft-materialien');
  const loesung = page.locator('#material-welt-0 a[href*="Loesungen_Portal"]').first();
  const pdf = await kontext.request.get(new URL(await loesung.getAttribute('href'), ctx.basis).toString());
  assert.equal(pdf.status(), 200);
  assert.match(pdf.headers()['content-type'], /application\/pdf/);
  await page.locator('#material-welt-3 tr.material-eintrag', { hasText: 'Funkraum' }).first().waitFor();

  // Themen: #niveaus mit sieben Welten
  await gehe(page, `${ctx.basis}/themen#niveaus`);
  await page.locator('#niveau-inhalt .niveau-welt-abschnitt').first().waitFor();
  assert.equal(await page.locator('#niveau-inhalt .niveau-welt-abschnitt').count(), 7);

  // 360 px: Kurse, Auswertung, Einstellungen ohne Querscrollen, Touch-Ziele ≥ 44 px
  await page.setViewportSize({ width: 360, height: 740 });
  for (const [ort, url] of [['Kurse', '/lehrer#/'], ['Auswertung', `/lehrer#/kurs/${lk}/auswertung`], ['Einstellungen', `/lehrer#/kurs/${lk}/einstellungen`]]) {
    await gehe(page, ctx.basis + url);
    await page.locator('main h1').first().waitFor();
    await page.locator('.laden').waitFor({ state: 'detached' });
    await keinQuerScrollen(page, `360 px ${ort}`);
    await ziele44(page, `360 px ${ort}`);
  }
  await kontext.close();

  // Admin: Verwaltung vor Labor; fünf Reiter; Backup-JSON ohne Funkraum/sso_jti; Wartung mit letztem Lauf
  const admin = await neueSeite(ctx, {}, 'Szenario 13 (Admin)');
  await anmelden(admin.page, ctx, 'Admin', '/lehrer');
  await kopfzeile(admin.page, ['Kurse', 'Aufgaben', 'Materialien', 'Themen', 'Verwaltung', 'Labor']);
  await gehe(admin.page, `${ctx.basis}/lehrer#/admin`);
  assert.deepEqual(await texte(admin.page.locator('.tabs[role="tablist"] [role="tab"]')), ADMIN_REITER, 'Reiter der Verwaltung');
  await reiterFertig(admin.page, 'Verwaltung');
  await foto(admin.page, 'verwaltung');
  for (const key of ['lehrkraefte', 'inhalte', 'kata', 'backup', 'wartung']) {
    await gehe(admin.page, `${ctx.basis}/lehrer#/admin/${key}`);
    await reiterFertig(admin.page, `Verwaltung ${key}`);
  }
  await gehe(admin.page, `${ctx.basis}/lehrer#/admin/backup`);
  const backup = await admin.kontext.request.get(new URL(await admin.page.locator('a[href="/api/admin/backup"]').getAttribute('href'), ctx.basis).toString());
  assert.equal(backup.status(), 200);
  const b = await backup.json();
  assert.equal(b.app, 'kryptos');
  const meta = Object.fromEntries((b.tables.meta || []).map((z) => [z.key, z.value]));
  assert.equal(meta.app, 'kryptos', 'meta.app');
  for (const t of ['sso_jti', 'loeschungen', 'funk_szenarien', 'funk_nachrichten', 'funk_rollen', 'funk_ereignisse', 'arena', 'arena_chiffren', 'arena_versuche']) assert.ok(!(t in b.tables), `${t} nicht im Backup`);
  await gehe(admin.page, `${ctx.basis}/lehrer#/admin/wartung`);
  await admin.page.locator('#admin-inhalt h2', { hasText: 'Letzter Wartungslauf' }).waitFor();
  await admin.page.locator('#admin-inhalt dl dt', { hasText: 'Zeit' }).waitFor();
  await admin.kontext.close();
}

module.exports = { szenario13 };
