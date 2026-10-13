'use strict';
/*
 * e2e – Kryptolabor (TECHNIK §15 Nr. 4, Plan M6 Task 128): jedes freigegebene Werkzeug öffnen, eine Rechnung, Ergebnis
 * gegen Krypto (Node); gesperrtes Werkzeug (Chiffrierscheibe aus 7a) wird nicht geladen; Nachspiel per Tastatur; Dialog
 * aus einer Aufgabe mit Rückkehr des Fokus; 360 px ohne Querscrollen, Touch-Ziele; reduzierte Bewegung.
 * Keine Fotos (E88). Stellt die Werkzeug-Einstellungen von 7a am Ende wieder her (Scheibe bleibt gesperrt).
 */
const assert = require('node:assert/strict');
const { anmelden, gehe, keinQuerScrollen, ziele44, Krypto: K } = require('./hilfen');
const { neueSeite } = require('./schueler');
const { kursWaehlen } = require('./lehrkraft');

// alle Werkzeuge außer der in 7a gesperrten Chiffrierscheibe
const IDS = ['skytale', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur'];
const zustand = (p) => p.evaluate(() => JSON.parse(JSON.stringify(KRLabor.aktiv().zustand())));
const flaeche = (p) => p.locator('.werkzeug-flaeche');

/** je Werkzeug: Bedienung im Browser → [ist, soll] mit soll aus Krypto (Node) */
const RECHNUNG = {
  skytale: async (p) => {
    await flaeche(p).locator('textarea.labor-eingabe').fill('wir halten den pass');
    const z = await zustand(p);
    return [z.ausgabe, K.skytale('wir halten den pass', z.umfang)];
  },
  haeufigkeit: async (p) => {
    const text = 'Die Lupe zaehlt jeden Buchstaben';
    await flaeche(p).locator('textarea.labor-eingabe').fill(text);
    const e = await flaeche(p).locator('table.haeufigkeit-tabelle').first().evaluate((t) => {
      const zeile = [...t.querySelectorAll('tbody tr')].find((tr) => tr.firstElementChild && tr.firstElementChild.textContent.trim() === 'E');
      return zeile ? Number(zeile.children[1].textContent.trim()) : null;
    });
    return [e, K.haeufigkeiten(text).E];
  },
  substitution: async (p) => {
    await flaeche(p).locator('input.zuordnung').first().fill('e');
    const z = await zustand(p);
    return [z.klartext, K.teilsubstitution(z.text, z.zuordnung)];
  },
  vigenere: async (p) => {
    await flaeche(p).locator('[role="tab"][data-reiter="verschluesseln"]').click();
    await flaeche(p).locator('textarea.labor-eingabe').fill('kerze');
    await flaeche(p).locator('input.vg-schluessel').fill('LICHT');
    return [(await zustand(p)).ausgabe, K.vigenere('kerze', 'LICHT')];
  },
  bitlupe: async (p) => {
    await flaeche(p).locator('[role="tab"][data-reiter="xor"]').click();
    await flaeche(p).locator('textarea.labor-eingabe').fill('FUNK');
    await flaeche(p).locator('input.xor-schluessel').fill('AB');
    return [(await zustand(p)).ergebnisHex, K.xor('FUNK', 'AB')];
  },
  runden: async (p) => {
    const z = await zustand(p);
    assert.equal(z.variante, 'kryptos16');
    return [z.ergebnis, K.hex(K.kryptos16.verschluesseln(Number.parseInt(z.block, 16), Number.parseInt(z.schluessel, 16), { runden: z.runden }))];
  },
  modulo: async (p) => {
    await flaeche(p).locator('input.uhr-a').fill('23');
    await flaeche(p).locator('input.uhr-b').fill('7');
    const z = await zustand(p);
    return [z.zeiger, K.mod(30, z.m)];
  },
  rsa: async (p) => {
    const z = await zustand(p);
    return [z.d, K.rsa.schluessel(z.p, z.q, z.e).d];
  },
  hash: async (p) => {
    await flaeche(p).locator('textarea.labor-eingabe').first().fill('nebel');
    return [(await zustand(p)).wert, K.kryptosHash('nebel').wert];
  },
  signatur: async (p) => {
    const z = await zustand(p);
    const alice = K.rsa.schluessel(5, 17, 7); // Alices Beispielschlüssel im Simulator (eigene Werte, Task 124)
    return [z.signatur, K.rsa.signieren(z.h1, alice.d, alice.N)];
  }
};

/** Alle Werkzeuge (außer der Scheibe) im LK 13 auf wert setzen ('frei' | 'auto'). */
async function werkzeugeSetzen(page, ctx, wert) {
  await gehe(page, `${ctx.basis}/lehrer#/kurs/${ctx.kurse.lk}/einstellungen`);
  await page.locator('form.einstellungen').waitFor();
  for (const id of IDS) await page.locator(`select[name="werkzeug-${id}"]`).selectOption(wert);
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'PATCH' && r.ok()), page.locator('form.einstellungen button[type="submit"]').click()]);
}

async function oeffne(page, ctx, id) {
  await gehe(page, `${ctx.basis}/labor#/${id}`);
  // KRLabor ist ein const im klassischen Skript – kein window-Eigenschaft, daher typeof
  await page.waitForFunction((x) => typeof KRLabor !== 'undefined' && KRLabor.hat(x) && KRLabor.aktiv() && KRLabor.aktiv().zustand(), id);
}

async function szenario4(ctx) {
  const lk = await neueSeite(ctx, {}, 'Szenario 4 (Frau M.)');
  await anmelden(lk.page, ctx, 'Frau M.', '/lehrer');
  await werkzeugeSetzen(lk.page, ctx, 'frei');

  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 4 (Mika)');
  const geladen = [];
  page.on('request', (r) => {
    const m = /\/static\/js\/krypto\/labor\/(\w+)\.js/.exec(r.url());
    if (m) geladen.push(m[1]);
  });
  await anmelden(page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(page, 'LK 13 (eA)');
  await gehe(page, `${ctx.basis}/labor`);
  await page.locator('section.labor-epoche').first().waitFor();
  assert.equal(await page.locator('a.werkzeug-karte').count(), IDS.length, 'zehn freigegebene Werkzeuge');
  await page.locator('.werkzeug-karte.gesperrt', { hasText: 'Chiffrierscheibe' }).getByText('Deine Lehrkraft schaltet dieses Werkzeug später frei.').waitFor();
  await gehe(page, `${ctx.basis}/labor#/scheibe`);
  await page.locator('.labor').getByText('Deine Lehrkraft schaltet dieses Werkzeug später frei.').waitFor();
  assert.ok(!geladen.includes('scheibe'), 'gesperrtes Werkzeug wird nicht geladen');

  for (const id of IDS) {
    await oeffne(page, ctx, id);
    const [ist, soll] = await RECHNUNG[id](page);
    assert.ok(soll !== null && soll !== undefined && soll !== '', `${id}: Erwartung vorhanden`);
    assert.deepEqual(ist, soll, `${id}: Ergebnis = Krypto`);
  }
  assert.ok(!geladen.includes('scheibe'), 'Scheibe auch später nicht geladen');

  // Reiter-Regeln des Kurses (E71): Ring und MitM (Orchestrator) nur mit freigeschalteter Welt 6, Koinzidenz nur eA
  const umgebung = await page.evaluate(() => fetch('/api/labor').then((r) => r.json()));
  const welt6 = umgebung.welten.includes(6);
  if (process.env.E2E_NUR) console.log(`  Szenario 4: welten ${umgebung.welten.join(',')}, niveau ${umgebung.niveau}`);
  await oeffne(page, ctx, 'skytale');
  assert.equal(await page.locator('[role="tab"][data-reiter="ring"]').count(), welt6 ? 1 : 0, `Ring ${welt6 ? 'mit' : 'ohne'} Welt 6`);
  await oeffne(page, ctx, 'signatur');
  assert.equal(await page.locator('[role="tab"][data-reiter="mitm"]').count(), welt6 ? 1 : 0, `MitM ${welt6 ? 'mit' : 'ohne'} Welt 6`);
  await oeffne(page, ctx, 'vigenere');
  assert.equal(await page.locator('[role="tab"][data-reiter="koinzidenz"]').count(), umgebung.niveau === 'eA' ? 1 : 0, 'Koinzidenz nur eA');

  // Nachspiel per Tastatur (Skytale): Leiste fokussieren, → einen Schritt weiter
  await oeffne(page, ctx, 'skytale');
  await flaeche(page).locator('textarea.labor-eingabe').fill('wir halten den pass');
  const leiste = flaeche(page).locator('.nachspiel').first();
  await leiste.locator('.nachspiel-vor').focus();
  const vorher = await leiste.locator('.nachspiel-zaehler').textContent();
  const nr = Number(/Schritt (\d+) von/.exec(vorher)[1]);
  await page.keyboard.press('ArrowRight');
  assert.match(await leiste.locator('.nachspiel-zaehler').textContent(), new RegExp(`Schritt ${nr + 1} von`));

  // Dialog aus der Aufgabe W9-L3-01 (Häufigkeits-Analysator mit Voreinstellung), Esc → Fokus zurück
  await gehe(page, `${ctx.basis}/spiel#/aufgabe/W9-L3-01`);
  await page.locator('button.werkzeug-oeffnen').click();
  await page.locator('dialog.werkzeug-dialog table.haeufigkeit-tabelle').first().waitFor({ state: 'attached' });
  assert.equal(await page.locator('dialog.werkzeug-dialog textarea.labor-eingabe').inputValue(), 'IMQRH AGTZF', 'Voreinstellung aus der Aufgabe');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog.werkzeug-dialog').count(), 0);
  assert.equal(await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('werkzeug-oeffnen')), true, 'Fokus zurück auf dem Knopf');

  // 360 px: kein Querscrollen in allen Werkzeugen, Touch-Ziele ≥ 44 px
  await page.setViewportSize({ width: 360, height: 740 });
  for (const id of IDS) {
    await oeffne(page, ctx, id);
    await keinQuerScrollen(page, `/labor#/${id}`);
  }
  await oeffne(page, ctx, 'skytale');
  await ziele44(page, '/labor#/skytale');

  // reduzierte Bewegung: keine Animationen
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await oeffne(page, ctx, 'modulo');
  await flaeche(page).locator('input.uhr-b').fill('5');
  assert.equal(await page.locator('.werkzeug-flaeche .animiert').count(), 0, 'keine Animation bei reduzierter Bewegung');
  await kontext.close();

  await werkzeugeSetzen(lk.page, ctx, 'auto'); // Stand von 7a wiederherstellen (Scheibe bleibt gesperrt)
  await lk.kontext.close();
}

module.exports = { szenario4 };
