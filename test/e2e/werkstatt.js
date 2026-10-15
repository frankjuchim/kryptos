'use strict';
/*
 * e2e – Szenario 15 „Werkstatt-Werkzeuge“ (Plan M10 Task 237, E191, Review Focus 2–4) auf den echten Seeds:
 *  1. Frau M. setzt den LK 13 (eA) auf die Welten 0–1: Mika sieht Polybios ohne Playfair und das Angreifer-Labor ohne
 *     Schlüsselraum; die Lehrkraft selbst sieht beide Reiter ohne Welt-Freigabe. Danach Welten 0–3.
 *  2. Mika (Touch-Gerät) öffnet jedes neue bzw. geänderte Werkzeug über das Raster, bedient es am Objekt und vergleicht
 *     das Ergebnis mit Krypto (Node): Skytale-Stab, Playfair, Morse-Trommel, Nullchiffre-Brief, Enigma, Angreifer-Labor;
 *     Nachspiel im Einzelschritt; Wischen über den Stempelkasten erzeugt nichts; Herkunftszeile sichtbar. Fotos kr-31…36.
 *  3. 360 px: kein Querscrollen, Touch-Ziele ≥ 44 px in allen Reitern; Kontraste hell und dunkel; reduzierte Bewegung:
 *     nach Handgriffen keine laufenden Animationen (document.getAnimations()).
 *  4. Gast: Chiffrierscheibe der Werkstatt mit Herkunftszeile. Boss-Kampf (Nia T.) starten → /labor#/enigma gesperrt.
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe, keinQuerScrollen, ziele44, kontraste, Krypto: K } = require('./hilfen');
const { neueSeite } = require('./schueler');
const { kursId, einstellen, kursWaehlen } = require('./inhalte');

const HERKUNFT = 'Ideen von A. Bodendiek (Krypto-Werkstatt)';
const zustand = (p) => p.evaluate(() => JSON.parse(JSON.stringify(KRLabor.aktiv().zustand())));
const flaeche = (p) => p.locator('.werkzeug-flaeche');

async function oeffne(page, ctx, pfad) {
  await gehe(page, `${ctx.basis}/labor#/${pfad}`);
  const id = pfad.split('?')[0];
  await page.waitForFunction((x) => typeof KRLabor !== 'undefined' && KRLabor.hat(x) && KRLabor.aktiv() && KRLabor.aktiv().zustand(), id);
}
const tippe = async (page, sel) => {
  await page.locator(sel).first().click();
};

/** Wischen per Touch (CDP) über ein Element: Start, 60 px seitwärts, Ende – darf keinen Klick auslösen */
async function wischen(page, sel) {
  const box = await page.locator(sel).first().boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 10, y: y + i * 4 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await page.waitForTimeout(150);
}

/** je Werkzeug: Handgriffe am Objekt → [ist, soll]; Foto */
const WERKZEUGE = [
  {
    pfad: 'skytale?reiter=skytale', foto: 'labor-skytale-stab',
    async handgriffe(p) {
      for (const b of 'ZEBRA') await tippe(p, `button.station-stempel[data-buchstabe="${b}"]`);
      await tippe(p, 'button.stab-abwickeln');
      await p.waitForTimeout(2200); // Runde für Runde je 0,7 s auf das Band (für das Foto ganz abgewickelt)
      const z = await zustand(p);
      return [z.ausgabe, K.skytale('zebra', z.umfang)];
    }
  },
  {
    pfad: 'quadrat?reiter=playfair', foto: 'labor-quadrat-playfair',
    async handgriffe(p) {
      for (const b of 'WI') await tippe(p, `.quadrat-feld[data-buchstabe="${b}"]`);
      const z = await zustand(p);
      const s = K.playfairSchritte('wi', z.schluesselwort)[0];
      assert.equal(z.regel, s.regel);
      return [z.ausgabe, s.ergebnis];
    }
  },
  {
    pfad: 'signale?reiter=morse', foto: 'labor-signale-morse',
    async handgriffe(p) {
      await tippe(p, '.signale-tafel [data-buchstabe="S"]');
      for (let i = 0; i < 3; i++) await tippe(p, 'button.signale-trommel-rand');
      await tippe(p, 'button.signale-pause');
      return [(await zustand(p)).ausgabe, K.morse('s')];
    }
  },
  {
    pfad: 'verstecke?reiter=nullchiffre', foto: 'labor-verstecke-brief',
    async handgriffe(p) {
      for (const b of 'TEE') {
        await tippe(p, `button.station-stempel[data-buchstabe="${b}"]`);
        await tippe(p, '.verstecke-vorschlaege button');
      }
      return [K.nullchiffre((await zustand(p)).brief), 'TEE'];
    }
  },
  {
    pfad: 'enigma?reiter=maschine', foto: 'labor-enigma',
    async handgriffe(p) {
      for (let i = 0; i < 5; i++) await tippe(p, '.enigma-taste[data-buchstabe="A"]');
      const z = await zustand(p);
      assert.equal(z.stellung, 'AAF');
      return [z.ausgabe, K.enigma('aaaaa', z.einstellung)];
    }
  },
  {
    pfad: 'analyse?reiter=vergleich', foto: 'labor-analyse',
    async handgriffe(p) {
      await tippe(p, '.analyse-verfahren [data-verfahren="caesar"]');
      await tippe(p, '.analyse-vorhersage [data-form="verschoben"]');
      await tippe(p, 'button.analyse-ansehen');
      const z = await zustand(p);
      assert.equal(z.gezeigt, true);
      return [z.geheimtext, K.caesar(z.klartext, 3)];
    }
  }
];

async function szenario15(ctx) {
  // 1) Lehrkraft: Welten 0–1, Reiter-Regeln (E180); Lehrkraft sieht alles
  const lehrer = await neueSeite(ctx, {}, 'Szenario 15 (Frau M.)');
  await anmelden(lehrer.page, ctx, 'Frau M.', '/lehrer');
  const lk = await kursId(lehrer.page, ctx, 'LK 13 (eA)');
  await einstellen(lehrer.page, ctx, lk, { welten: [0, 1], boss: 'offen' });
  await oeffne(lehrer.page, ctx, 'quadrat');
  assert.equal(await lehrer.page.locator('[role="tab"][data-reiter="playfair"]').count(), 1, 'Lehrkraft: Playfair ohne Welt-Freigabe');
  await oeffne(lehrer.page, ctx, 'analyse');
  assert.equal(await lehrer.page.locator('[role="tab"][data-reiter="schluesselraum"]').count(), 1, 'Lehrkraft: Schlüsselraum');

  const { kontext, page } = await neueSeite(ctx, { hasTouch: true }, 'Szenario 15 (Mika)');
  await anmelden(page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(page, 'LK 13 (eA)');
  await oeffne(page, ctx, 'quadrat');
  assert.equal(await page.locator('[role="tab"][data-reiter="playfair"]').count(), 0, 'Welten 0–1: kein Playfair');
  await oeffne(page, ctx, 'analyse');
  assert.equal(await page.locator('[role="tab"][data-reiter="schluesselraum"]').count(), 0, 'Welten 0–1: kein Schlüsselraum');
  await einstellen(lehrer.page, ctx, lk, { welten: [0, 1, 2, 3] });

  // 2) über das Raster öffnen, am Objekt bedienen, Ergebnis = Krypto, Herkunft, Foto
  for (const w of WERKZEUGE) {
    const id = w.pfad.split('?')[0];
    await gehe(page, `${ctx.basis}/labor#/`);
    await page.reload();
    await page.locator(`a.werkzeug-karte[href="#/${id}"]`).click();
    await page.waitForFunction((x) => typeof KRLabor !== 'undefined' && KRLabor.aktiv() && KRLabor.hat(x), id);
    await oeffne(page, ctx, w.pfad);
    const [ist, soll] = await w.handgriffe(page);
    assert.ok(soll, `${id}: Erwartung vorhanden`);
    assert.deepEqual(ist, soll, `${id}: Ergebnis = Krypto`);
    assert.equal((await page.locator('p.werkzeug-herkunft').first().textContent()).trim(), HERKUNFT, `${id}: Herkunftszeile`);
    await page.evaluate(() => document.querySelector('.werkzeug-flaeche').scrollIntoView({ block: 'start' })); // Foto ab dem Werkzeug-Kopf
    await page.waitForTimeout(500);
    await foto(page, w.foto);
  }

  // Wischen über den Stempelkasten erzeugt nichts; Nachspiel im Einzelschritt (Skytale)
  await oeffne(page, ctx, 'skytale?reiter=skytale');
  const vorher = (await zustand(page)).text;
  await wischen(page, 'button.station-stempel[data-buchstabe="M"]');
  assert.equal((await zustand(page)).text, vorher, 'Wischen über den Stempelkasten stempelt nicht');
  await tippe(page, 'button.station-stempel[data-buchstabe="M"]');
  assert.notEqual((await zustand(page)).text, vorher, 'Antippen stempelt');
  await tippe(page, 'button.station-nachspielen');
  const leiste = flaeche(page).locator('.nachspiel').first();
  const z0 = await leiste.locator('.nachspiel-zaehler').textContent();
  await leiste.locator('.nachspiel-vor').click();
  const n0 = Number(/Schritt (\d+) von/.exec(z0)[1]);
  assert.match(await leiste.locator('.nachspiel-zaehler').textContent(), new RegExp(`Schritt ${n0 + 1} von`));
  assert.equal(await page.locator('button.station-stempel').first().isDisabled(), true, 'Stempel während des Nachspiels gesperrt');
  await tippe(page, 'button.station-nachspiel-ende');

  // 3) 360 px, Touch-Ziele, Kontraste hell/dunkel, reduzierte Bewegung
  await page.setViewportSize({ width: 360, height: 740 });
  for (const id of ['scheibe', 'skytale', 'quadrat', 'signale', 'verstecke', 'enigma', 'analyse']) {
    if (id === 'scheibe' && !(await page.evaluate(() => fetch('/api/labor').then((r) => r.json()).then((d) => d.werkzeuge.some((w) => w.id === 'scheibe' && w.frei))))) continue;
    await oeffne(page, ctx, id);
    const reiter = await flaeche(page).locator('[role="tab"]').evaluateAll((l) => l.map((x) => x.dataset.reiter));
    for (const r of reiter.length ? reiter : [null]) {
      if (r) await flaeche(page).locator(`[role="tab"][data-reiter="${r}"]`).first().click();
      const ort = `/labor#/${id}${r ? ` (${r})` : ''} bei 360 px`;
      await keinQuerScrollen(page, ort);
      await ziele44(page, ort);
      // M10-Review Fund 3: bei 360 px jede Taste und Buchse ganz sichtbar (kein verdecktes Weiterscrollen im Gehäuse)
      const verdeckt = await page.evaluate(() => [...document.querySelectorAll('.werkzeug-flaeche .enigma-taste, .werkzeug-flaeche .enigma-buchse, .werkzeug-flaeche .enigma-lampe')].filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width) return false;
        for (let x = el.parentElement; x; x = x.parentElement) {
          const s = getComputedStyle(x);
          if (s.overflowX === 'visible') continue;
          const k = x.getBoundingClientRect();
          if (r.left < k.left - 1 || r.right > k.right + 1) return true;
        }
        return r.left < 0 || r.right > innerWidth;
      }).map((el) => el.dataset.buchstabe));
      assert.deepEqual(verdeckt, [], `${ort}: verdeckte Tasten/Buchsen/Lampen`);
      for (const schema of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: schema });
        await page.waitForTimeout(500); // Farbübergänge der Knöpfe auslaufen lassen
        const v = await kontraste(page, `${ort} ${schema}`);
        assert.deepEqual(v, [], `Kontraste ${ort} ${schema}`);
      }
      await page.emulateMedia({ colorScheme: 'light' });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const w of WERKZEUGE) {
    await oeffne(page, ctx, w.pfad);
    await page.reload();
    await oeffne(page, ctx, w.pfad);
    await w.handgriffe(page);
    await page.waitForTimeout(100);
    const laufend = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    assert.equal(laufend, 0, `${w.pfad}: reduzierte Bewegung ohne laufende Animationen`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // 4) Gast: Werkstatt-Scheibe mit Herkunftszeile
  const gast = await neueSeite(ctx, {}, 'Szenario 15 (Gast)');
  await gehe(gast.page, ctx.basis + '/gast#/labor/scheibe');
  await gast.page.locator('svg.scheibe-ringe').waitFor();
  assert.equal((await gast.page.locator('p.werkzeug-herkunft').first().textContent()).trim(), HERKUNFT);
  await gast.kontext.close();

  // Boss-Kampf starten → Labor (auch die Enigma) gesperrt. Nia T. (LK 13): Mika hat Boss 0 in Szenario 11 schon gekämpft
  // (Sperrfrist), Nia hat noch keinen Kampf.
  const nia = await neueSeite(ctx, {}, 'Szenario 15 (Nia)');
  await anmelden(nia.page, ctx, 'Nia T.', '/spiel');
  await gehe(nia.page, `${ctx.basis}/spiel#/boss/0`);
  await nia.page.getByRole('button', { name: 'Kampf beginnen' }).click();
  await nia.page.locator('dialog[open]').getByRole('button', { name: /beginnen|Los/ }).click();
  await nia.page.waitForURL(/#\/kampf\//);
  await gehe(nia.page, `${ctx.basis}/labor#/enigma`);
  await nia.page.getByText('Während eines Boss-Kampfs ist das Labor geschlossen.').first().waitFor();
  assert.equal(await nia.page.locator('.enigma-taste').count(), 0, 'Enigma im Kampf nicht bedienbar');
  await nia.kontext.close();

  await kontext.close();
  await lehrer.kontext.close();
}

module.exports = { szenario15 };
