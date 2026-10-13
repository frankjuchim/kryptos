'use strict';
/*
 * e2e – Funkraum (TECHNIK §15 Nr. 5, Plan M7 Task 160, E117, E118): Botenlauf mit drei Teams und Beamer.
 * Frau M. verteilt Mika R., Nia T. und Ole B. automatisch auf drei Teams (alphabetisch: Skytale = Mika, Scheibe = Nia,
 * Quadrat = Ole), legt den Botenlauf an (Vorschlag: Skytale ↔ Scheibe, Quadrat = Eve) und startet ihn; der Beamer läuft
 * mit reduzierter Bewegung (keine Klasse „fliegt“). Mika (Alice) verschlüsselt mit der eingebetteten Scheibe (k = 7,
 * Ergebnis = Krypto.caesar) und sendet; Nia (Bob) meldet den Empfang; Ole (Eve) knackt über „Alle Verschiebungen“; die
 * Lehrkraft blendet Nias Quittung aus; Phasen bis zur Auflösung, Beenden → Inhalte weg (Stand und Datenbankdatei), danach
 * Schließen (Szenario 6 nutzt die Teams weiter). 360 px bei Mika ohne Querscrollen. Keine Fotos (E118).
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { anmelden, beobachte, gehe, keinQuerScrollen, Krypto: K } = require('./hilfen');
const { neueSeite } = require('./schueler');
const { kursWaehlen, kursId } = require('./lehrkraft');

const LANG = 15000; // Polling 2 s, Ticker gedrosselt (höchstens eine Ansage je 5 s)
const KLAR = 'haltet den pass';
const QUITTUNG = 'befehl erhalten';
const k = 7;

/** lokale id des LK 13 (aus Szenario 7a oder über die Kursliste) */
async function lkKurs(ctx, page) {
  if (!ctx.kurse) ctx.kurse = { lk: await kursId(page, ctx, 'LK 13 (eA)'), gk: await kursId(page, ctx, 'GK 12 (gA)') };
  return ctx.kurse.lk;
}

/** Schülerin/Schüler anmelden, im LK 13 und auf ziel */
async function schuelerSeite(ctx, wer, ziel, optionen = {}) {
  const s = await neueSeite(ctx, optionen, `${ctx.szenario} (${wer})`);
  await anmelden(s.page, ctx, wer, '/spiel');
  if (wer === 'Mika R.') await kursWaehlen(s.page, 'LK 13 (eA)');
  await gehe(s.page, ctx.basis + ziel);
  return s;
}

/**
 * Teams im LK 13 (einmal je Lauf): Mika, Ole und Nia melden sich an (Teilnahme; Mika schon ab Szenario 1), Frau M. verteilt alle automatisch auf drei
 * Teams und speichert. Liefert { lk, teams: { 'Mika R.': 'Team Skytale', … } }.
 */
async function teamsEinteilen(ctx, page) {
  const lk = await lkKurs(ctx, page);
  if (ctx.teams) return ctx.teams;
  for (const wer of ['Mika R.', 'Ole B.', 'Nia T.']) {
    const s = await neueSeite(ctx, {}, `${ctx.szenario} (${wer}, Anmeldung)`);
    await anmelden(s.page, ctx, wer, '/spiel');
    await s.kontext.close();
  }
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${lk}/teams`);
  await page.locator('section', { has: page.locator('h2#teams-titel') }).waitFor();
  await page.locator('input.verteilen-anzahl').fill('3');
  await page.locator('button.verteilen').click();
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'PUT' && /\/teams$/.test(r.url()) && r.ok()), page.locator('button.teams-speichern').click()]);
  await page.locator('#toast', { hasText: 'Teams gespeichert.' }).waitFor();
  const daten = await page.evaluate((id) => fetch(`/api/lehrer/kurse/${id}/teams`).then((r) => r.json()), lk);
  assert.equal(daten.teams.length, 3, 'drei Teams');
  assert.equal(daten.ohneTeam.length, 0, 'alle zugeteilt');
  const teams = {};
  for (const t of daten.teams) for (const m of t.mitglieder) teams[m.name] = t.name;
  assert.deepEqual(teams, { 'Mika R.': 'Team Skytale', 'Nia T.': 'Team Scheibe', 'Ole B.': 'Team Quadrat' }, 'Verteilung alphabetisch');
  ctx.teams = { lk, teams };
  return ctx.teams;
}

/** Regie-Knopf mit Bestätigungsdialog */
async function mitBestaetigung(page, knopf, ok) {
  await knopf.click();
  await page.locator('dialog[open] button', { hasText: ok }).click();
}

async function szenario5(ctx) {
  ctx.szenario = 'Szenario 5';
  const lk = await neueSeite(ctx, {}, 'Szenario 5 (Frau M.)');
  const lp = lk.page;
  await anmelden(lp, ctx, 'Frau M.', '/lehrer');
  const { lk: kurs } = await teamsEinteilen(ctx, lp);

  // Botenlauf anlegen: Vorschlag Skytale ↔ Scheibe, Quadrat = Eve
  await gehe(lp, `${ctx.basis}/lehrer#/kurs/${kurs}/funkraum`);
  await lp.locator('article.szenario-wahl[data-typ="botenlauf"] button', { hasText: 'Anlegen' }).click();
  await lp.locator('table.rollen').waitFor();
  const rolleVon = (name) => lp.locator(`table.rollen select.rolle[aria-label="Rolle von ${name}"]`);
  assert.equal(await rolleVon('Team Skytale').inputValue(), 'alice');
  assert.equal(await rolleVon('Team Scheibe').inputValue(), 'bob');
  assert.equal(await rolleVon('Team Quadrat').inputValue(), 'eve');
  await lp.locator('button.aktion[data-aktion="starten"]').click();
  await lp.locator('section.funk-regie p.funk-status', { hasText: 'Runde 1' }).waitFor();
  const szId = /\/beamer\/funkraum\/(\d+)$/.exec(await lp.locator('a.beamer-oeffnen').first().getAttribute('href'))[1];

  // Beamer 1920 × 1080 mit reduzierter Bewegung
  const beamer = await lk.kontext.newPage();
  beamer.setDefaultTimeout(LANG);
  beobachte(beamer, 'Szenario 5 (Beamer)', ctx.fehler);
  await beamer.setViewportSize({ width: 1920, height: 1080 });
  await beamer.emulateMedia({ reducedMotion: 'reduce' });
  await gehe(beamer, `${ctx.basis}/beamer/funkraum/${szId}`);
  await beamer.locator('svg.funk-netz g.knoten').nth(2).waitFor();
  await beamer.locator('img.beamer-qr').waitFor();
  assert.ok(await beamer.locator('img.beamer-qr').evaluate((img) => img.complete && img.naturalWidth > 0), 'QR-Code geladen');

  const mika = await schuelerSeite(ctx, 'Mika R.', '/funkraum');
  const nia = await schuelerSeite(ctx, 'Nia T.', '/funkraum');
  const ole = await schuelerSeite(ctx, 'Ole B.', '/funkraum');
  for (const [s, rolle] of [[mika, 'Alice'], [nia, 'Bob'], [ole, 'Eve']]) await s.page.locator('p.funk-rolle', { hasText: `Ihr seid ${rolle}` }).waitFor({ timeout: LANG });

  // 2. Mika (Alice): Scheibe im Funkraum um 7 drehen, Ergebnis = Krypto.caesar, senden
  const mp = mika.page;
  const scheibe = mp.locator('div.funk-werkzeug[data-werkzeug="scheibe"]');
  await scheibe.locator('textarea.labor-eingabe').fill(KLAR);
  const zustand = () => mp.evaluate(() => KRLabor.aktiv().zustand());
  for (let z = await zustand(); z.k !== k; z = await zustand()) await scheibe.locator(z.k < k ? 'button.scheibe-plus' : 'button.scheibe-minus').click();
  const z = await zustand();
  assert.equal(z.richtung, 'ver', 'Alice verschlüsselt');
  assert.equal(z.ausgabe, K.caesar(KLAR, k), 'Scheibe = Krypto.caesar');
  const geheim = K.gruppieren(z.ausgabe);
  assert.equal(geheim, 'OHSAL AKLUW HZZ');
  await mp.locator('form.funk-senden textarea.funk-text').fill(geheim);
  await mp.locator('form.funk-senden input.funk-klartext').fill(KLAR);
  await mp.locator('form.funk-senden button.funk-senden-knopf').click();
  await mp.locator('form.funk-senden p.funk-ergebnis', { hasText: 'Gesendet.' }).waitFor();
  const nid = await mp.locator('ol.funk-post li.funk-nachricht').first().getAttribute('data-id', { timeout: LANG });
  // Beamer: Punkt und Geheimtext-Vorschau (≤ 4 s)
  await beamer.locator(`svg.funk-netz circle.nachricht[data-id="${nid}"]`).waitFor({ timeout: 4000 });
  await beamer.locator('svg.funk-netz text.nachricht-vorschau', { hasText: 'OHSAL AKLUW HZ' }).waitFor({ timeout: 4000 });

  // 3. Nia (Bob) meldet den Empfang → „angekommen“ bei Mika und am Beamer
  const np = nia.page;
  const empfang = np.locator(`form.funk-empfangen[data-nachricht="${nid}"]`);
  await empfang.waitFor({ timeout: LANG });
  await empfang.locator('input.funk-klartext').fill(KLAR);
  await empfang.locator('button[type="submit"]').click();
  await empfang.locator('p.funk-ergebnis', { hasText: 'Stimmt – angekommen.' }).waitFor();
  await mp.locator(`li.funk-nachricht[data-id="${nid}"] span.chip.angekommen`).waitFor({ timeout: LANG });
  await beamer.locator(`svg.funk-netz circle.nachricht.angekommen[data-id="${nid}"]`).waitFor({ timeout: LANG });

  // 4. Ole (Eve): Nachricht in der Scheibe öffnen, „Alle Verschiebungen“, k = 7 ergibt den Klartext → melden
  const op = ole.page;
  const eveNachricht = op.locator(`li.funk-nachricht[data-id="${nid}"]`);
  await eveNachricht.waitFor({ timeout: LANG });
  await eveNachricht.locator('button.in-scheibe').click();
  const zeile = op.locator('div.funk-werkzeug[data-werkzeug="scheibe"] table.alle-tabelle tbody tr', { hasText: `k = ${k}` });
  await zeile.waitFor();
  const kandidat = (await zeile.locator('td.ergebnis').textContent()).trim();
  assert.equal(K.nurBuchstaben(kandidat), K.nurBuchstaben(KLAR), 'Zeile k = 7 ist der Klartext');
  const knacken = op.locator(`form.funk-knacken[data-nachricht="${nid}"]`);
  await knacken.locator('input.funk-klartext').fill(KLAR);
  await knacken.locator('button[type="submit"]').click();
  await knacken.locator('p.funk-ergebnis', { hasText: /Stimmt – geknackt/ }).waitFor();
  const geknacktText = 'Team Quadrat hat eine Nachricht von Team Skytale geknackt';
  for (const p of [mp, np, op, beamer]) await p.locator('ol.funk-ticker li', { hasText: geknacktText }).waitFor({ timeout: LANG });
  assert.match(await beamer.locator('ol.funk-ticker li', { hasText: geknacktText }).textContent(), /geknackt \(nach /);

  // 5. Nia sendet eine Quittung, die Lehrkraft blendet sie aus → bei Ole „ausgeblendet“, Inhalt leer
  const quittung = K.gruppieren(K.caesar(QUITTUNG, k));
  await np.locator('form.funk-senden textarea.funk-text').fill(quittung);
  await np.locator('form.funk-senden input.funk-klartext').fill(QUITTUNG);
  await np.locator('form.funk-senden button.funk-senden-knopf').click();
  await np.locator('form.funk-senden p.funk-ergebnis', { hasText: 'Gesendet.' }).waitFor();
  const regieZeile = lp.locator('li.regie-nachricht', { hasText: quittung });
  await regieZeile.waitFor({ timeout: LANG });
  const qid = await regieZeile.getAttribute('data-id');
  await regieZeile.locator('button.ausblenden').click();
  await lp.locator(`li.regie-nachricht.ausgeblendet[data-id="${qid}"]`).waitFor({ timeout: LANG });
  const oleQuittung = op.locator(`li.funk-nachricht[data-id="${qid}"]`);
  await oleQuittung.locator('span.chip.ausgeblendet').waitFor({ timeout: LANG });
  assert.equal((await oleQuittung.locator('code.funk-inhalt').textContent()).trim(), '(ausgeblendet)');
  const oleStand = await op.evaluate((id) => fetch(`/api/funk/${id}/stand`).then((r) => r.json()), szId);
  const qn = oleStand.nachrichten.find((n) => String(n.id) === qid);
  assert.ok(qn && qn.ausgeblendet && qn.inhalt === '', 'ausgeblendete Nachricht ohne Inhalt');
  assert.ok(!JSON.stringify(oleStand).includes(quittung), 'Quittung nirgends im Stand der Eve');

  // 7a. 360 px bei Mika: kein Querscrollen; Beamer mit reduzierter Bewegung: keine Klasse „fliegt“
  await mp.setViewportSize({ width: 360, height: 740 });
  await mp.waitForTimeout(300);
  await keinQuerScrollen(mp, 'Funkraum 360 px (Mika)');
  await mp.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await beamer.locator('.fliegt').count(), 0, 'reduzierte Bewegung: nichts fliegt');

  // 6. Phasen bis zur Auflösung, Tabelle am Beamer
  for (const phase of ['Runde 2', 'Runde 3', 'Auflösung']) {
    await lp.locator('button.aktion[data-aktion="phase"]').click();
    await lp.locator('section.funk-regie p.funk-status', { hasText: `Phase: ${phase}` }).waitFor({ timeout: LANG });
  }
  const tabelle = beamer.locator('table.beamer-auswertung');
  await tabelle.waitFor({ timeout: LANG });
  const zeilen = await tabelle.locator('tbody tr').allTextContents();
  assert.ok(zeilen.some((t) => t.includes('Team Skytale') && t.includes('✓ ja')), `Auflösung: Mikas Befehl geknackt (${zeilen.join(' | ')})`);
  assert.equal(await beamer.locator('.fliegt').count(), 0, 'reduzierte Bewegung: nichts fliegt (Auflösung)');

  // Beenden → bei allen „Alle Nachrichten wurden gelöscht.“, Beamer „Beendet“
  await mitBestaetigung(lp, lp.locator('button.aktion[data-aktion="beenden"]'), 'Beenden');
  await lp.locator('section.funk-regie h2', { hasText: 'Auswertung' }).waitFor({ timeout: LANG });
  for (const p of [mp, np, op]) await p.locator('.funk-auswertung-bereich', { hasText: 'Alle Nachrichten wurden gelöscht.' }).waitFor({ timeout: LANG });
  await beamer.locator('p.beamer-phase', { hasText: 'Beendet – alle Nachrichten sind gelöscht.' }).waitFor({ timeout: LANG });
  const regie = await lp.evaluate((id) => fetch(`/api/lehrer/funk/${id}/stand`).then((r) => r.json()), szId);
  assert.equal(regie.status, 'auswertung');
  assert.ok((regie.nachrichten || []).every((n) => !n.inhalt), 'Regie-Stand ohne Inhalte');
  assert.ok(!JSON.stringify(regie).includes('OHSAL'), 'kein Geheimtext im Regie-Stand');
  // Datenbank: keine Fundstelle des Geheimtexts in der Datei (auch nicht im WAL)
  for (const datei of ['kryptos.db', 'kryptos.db-wal']) {
    const pfad = path.join(ctx.dataDir, datei);
    if (!fs.existsSync(pfad)) continue;
    const roh = fs.readFileSync(pfad);
    for (const nadel of ['OHSAL', quittung.split(' ')[0]]) assert.ok(!roh.includes(nadel), `${datei} enthält „${nadel}“ nach dem Beenden`);
  }

  // Schließen (Szenario 6 nutzt die Teams weiter; Teams mit Rolle in einem laufenden Szenario wären gesperrt)
  await mitBestaetigung(lp, lp.locator('button.aktion[data-aktion="schliessen"]'), 'Löschen');
  await lp.locator('article.szenario-wahl[data-typ="botenlauf"]').waitFor({ timeout: LANG });

  for (const s of [mika, nia, ole]) await s.kontext.close();
  await lk.kontext.close();
}

module.exports = { szenario5, teamsEinteilen, schuelerSeite, lkKurs, mitBestaetigung, LANG };
