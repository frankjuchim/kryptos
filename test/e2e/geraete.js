'use strict';
/*
 * e2e – Geräte, Dunkelmodus, Tastatur (TECHNIK §15 Nr. 9): jede Seite auf 1280 × 800, 768 × 1024 und 360 × 740 ohne
 * horizontales Scrollen, auf 768/360 Touch-Ziele ≥ 44 px; Beamer 1920 × 1080; Dunkelmodus; Tastatur-Durchlauf einer
 * Bit-Aufgabe nur mit keyboard.press und sichtbarem Fokusrahmen.
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe, keinQuerScrollen, ziele44, kontraste } = require('./hilfen');
const { neueSeite } = require('./schueler');

const VIEWPORTS = [
  [1280, 800],
  [768, 1024],
  [360, 740]
];

/** Seite laden, Ruhe abwarten (Animationen/Polling), prüfen. */
async function pruefeSeite(page, url, ort, breite) {
  await gehe(page, url);
  await page.waitForTimeout(150);
  await keinQuerScrollen(page, ort);
  if (breite <= 768) await ziele44(page, ort);
}

async function szenario9(ctx) {
  const gk = ctx.kurse.gk;
  const lk = ctx.kurse.lk;
  const oeffentlich = ['/', '/themen', '/themen#niveaus', '/gast', '/datenschutz', `/board/${encodeURIComponent(ctx.boardSchluessel)}`, '/404-gibt-es-nicht'];
  const schuelerSeiten = ['/spiel#/', '/spiel#/epoche/9', '/spiel#/level/W9-L5', '/spiel#/aufgabe/W9-L5-02', '/spiel#/aufgabe/W9-L3-01', '/spiel#/aufgabe/W9-L6-06', '/spiel#/profil', '/spiel#/scoreboard', '/spiel#/warmup', '/labor', '/funkraum', '/werkstatt'];
  const lehrerSeiten = ['/lehrer#/', `/lehrer#/kurs/${lk}/einstellungen`, `/lehrer#/kurs/${lk}/auswertung`, '/lehrer#/vorschau/welt/9', `/lehrer/urkunden?kurs=${lk}`, '/beamer/funkraum/1', '/labor#/skytale', '/labor#/vigenere', '/labor#/signatur']; // Labor als Lehrkraft: alle Reiter (M6 Task 128)

  const pub = await neueSeite(ctx, {}, 'Szenario 9 (öffentlich)');
  const mika = await neueSeite(ctx, {}, 'Szenario 9 (Mika)');
  await anmelden(mika.page, ctx, 'Mika R.', '/spiel');
  const frau = await neueSeite(ctx, {}, 'Szenario 9 (Frau M.)');
  await anmelden(frau.page, ctx, 'Frau M.', '/lehrer');

  for (const [w, hgt] of VIEWPORTS) {
    for (const p of [pub.page, mika.page, frau.page]) await p.setViewportSize({ width: w, height: hgt });
    for (const s of oeffentlich) await pruefeSeite(pub.page, ctx.basis + s, `${w} ${s}`, w);
    for (const s of schuelerSeiten) {
      await pruefeSeite(mika.page, ctx.basis + s, `${w} Mika ${s}`, w);
      if (s === '/spiel#/') await foto(mika.page, `${w}-zeitleiste`);
      if (s === '/spiel#/aufgabe/W9-L5-02') await foto(mika.page, `${w}-aufgabe`);
    }
    for (const s of lehrerSeiten) {
      await pruefeSeite(frau.page, ctx.basis + s, `${w} Frau M. ${s}`, w);
      if (s.endsWith('/einstellungen')) await foto(frau.page, `${w}-lehrkraft-einstellungen`);
    }
  }

  // Kontraste (Review M4 W1): alle Seiten hell und dunkel, ruhig (keine Einblendungen während der Messung)
  const gastSeiten = ['/gast#/schueler', '/gast#/schueler/aufgabe/W8-L1-01', '/gast#/lehrkraft/auswertung', '/gast#/lehrkraft/einstellungen'];
  const verstoesse = [];
  for (const schema of ['light', 'dark']) {
    const opt = { colorScheme: schema, reducedMotion: 'reduce' };
    const p = await neueSeite(ctx, opt, `Kontrast ${schema} (öffentlich)`);
    const m = await neueSeite(ctx, opt, `Kontrast ${schema} (Mika)`);
    await anmelden(m.page, ctx, 'Mika R.', '/spiel');
    const f = await neueSeite(ctx, opt, `Kontrast ${schema} (Frau M.)`);
    await anmelden(f.page, ctx, 'Frau M.', '/lehrer');
    const a = await neueSeite(ctx, opt, `Kontrast ${schema} (Admin)`);
    await anmelden(a.page, ctx, 'Admin', '/lehrer');
    const runde = [
      [p.page, [...oeffentlich, ...gastSeiten]],
      [m.page, schuelerSeiten],
      [f.page, [...lehrerSeiten, `/lehrer#/kurs/${lk}/schueler`, `/lehrer#/kurs/${lk}/scoreboard`, '/lehrer#/materialien']],
      [a.page, ['/lehrer#/admin/inhalte', '/lehrer#/admin/wartung']]
    ];
    for (const [page, seiten] of runde) {
      for (const s of seiten) {
        await gehe(page, ctx.basis + s);
        await page.waitForTimeout(100);
        verstoesse.push(...(await kontraste(page, `${schema} ${s}`)));
      }
    }
    // Zustände mit Rückmeldung: falsche Antwort in einer Aufgabe
    await gehe(m.page, ctx.basis + '/spiel#/aufgabe/W9-L5-05');
    await m.page.locator('input.chiffre-zeile').fill('QQ');
    await m.page.locator('#pruefen').click();
    await m.page.locator('.feedback').first().waitFor();
    verstoesse.push(...(await kontraste(m.page, `${schema} Aufgabe mit Rückmeldung`)));
    for (const x of [p, m, f, a]) await x.kontext.close();
  }
  assert.deepEqual(verstoesse, [], `Kontraste unter WCAG AA:\n  ${verstoesse.join('\n  ')}`);

  // Beamer 1920 × 1080
  await pub.page.setViewportSize({ width: 1920, height: 1080 });
  await pruefeSeite(pub.page, `${ctx.basis}/board/${encodeURIComponent(ctx.boardSchluessel)}`, '1920 Board', 1920);
  await foto(pub.page, 'beamer-board');
  await frau.page.setViewportSize({ width: 1920, height: 1080 });
  await pruefeSeite(frau.page, ctx.basis + '/beamer/funkraum/1', '1920 Beamer', 1920);
  for (const x of [pub, mika, frau]) await x.kontext.close();

  // Dunkelmodus
  const dunkelMika = await neueSeite(ctx, { colorScheme: 'dark' }, 'Szenario 9 (dunkel, Mika)');
  await anmelden(dunkelMika.page, ctx, 'Mika R.', '/spiel');
  await gehe(dunkelMika.page, ctx.basis + '/spiel#/');
  await dunkelMika.page.locator('a.tor').first().waitFor();
  await foto(dunkelMika.page, 'dunkel-zeitleiste');
  await gehe(dunkelMika.page, ctx.basis + '/spiel#/aufgabe/W9-L5-03');
  await dunkelMika.page.locator('#pruefen').waitFor();
  const hg = await dunkelMika.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(hg, 'rgb(26, 34, 56)', 'Dunkelmodus: Hintergrund --papier dunkel');
  await foto(dunkelMika.page, 'dunkel-aufgabe');
  await dunkelMika.kontext.close();
  const dunkelFrau = await neueSeite(ctx, { colorScheme: 'dark' }, 'Szenario 9 (dunkel, Frau M.)');
  await anmelden(dunkelFrau.page, ctx, 'Frau M.', '/lehrer');
  await gehe(dunkelFrau.page, `${ctx.basis}/lehrer#/kurs/${gk}/auswertung`);
  await dunkelFrau.page.locator('.fallen-profil').waitFor();
  await foto(dunkelFrau.page, 'dunkel-lehrkraft');
  await dunkelFrau.kontext.close();

  // Tastatur-Durchlauf (Ida): nur keyboard.press, sichtbarer Fokusrahmen
  const ida = await neueSeite(ctx, {}, 'Szenario 9 (Tastatur)');
  await anmelden(ida.page, ctx, 'Ida K.', '/spiel');
  await gehe(ida.page, ctx.basis + '/spiel#/aufgabe/W9-L6-03');
  await ida.page.locator('#pruefen').waitFor();
  const fokus = () =>
    ida.page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { bit: false, pruefen: false, rahmen: false, text: 'body (Fokus verloren)' };
      const s = getComputedStyle(el);
      return { bit: el.matches('button.bit'), pruefen: el.id === 'pruefen', rahmen: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, text: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} „${(el.textContent || '').trim().slice(0, 30)}“` };
    });
  async function tabBis(ziel) {
    for (let i = 0; i < 80; i++) {
      await ida.page.keyboard.press('Tab');
      const f = await fokus();
      assert.ok(f.rahmen, `Fokusrahmen sichtbar: ${f.text}`);
      if (f[ziel]) return;
    }
    throw new Error(`Tastatur: ${ziel} nicht erreicht`);
  }
  await tabBis('bit');
  for (const b of '01001011') await ida.page.keyboard.press(b);
  await tabBis('pruefen');
  await ida.page.keyboard.press('Enter');
  await ida.page.locator('.feedback.ok', { hasText: 'Richtig' }).waitFor();
  // Review M4 W3: Fokus geht nach dem Prüfen nicht verloren, sondern liegt auf der Rückmeldung
  const nachPruefen = await ida.page.evaluate(() => {
    const el = document.activeElement;
    return { body: !el || el === document.body, feedback: !!(el && el.classList.contains('feedback')), text: el ? `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}` : '-' };
  });
  assert.ok(!nachPruefen.body && nachPruefen.feedback, `Fokus nach dem Prüfen auf der Rückmeldung (ist ${nachPruefen.text})`);
  await ida.page.keyboard.press('Tab');
  const weiter = await fokus();
  assert.ok(weiter.rahmen, `Tab nach der Rückmeldung: sichtbarer Fokus (${weiter.text})`);
  await ida.kontext.close();
}

module.exports = { szenario9 };
