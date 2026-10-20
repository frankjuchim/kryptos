'use strict';
/*
 * e2e – Szenario 16 „Werkzeuge in den Aufgaben“ (Plan M11 Task 251, E228, Review Focus 1–5) auf den echten Seeds:
 *  1. Mika R. (LK 13, Welten 0–6): W2-L1-02 – Panel eingeklappt, labor/vigenere.js erst nach dem Klick (M12: W0-Aufgaben
 *     mit Werkstatt-Objekt klappen von selbst auf – W0-L1-04 offen, Schalter „Skytale-Stab benutzen“); geführt am
 *     Holzstab (Geheimtext aufgewickelt, eine Zeilenmarke markiert, keine Ersatztabelle), kein Klartext im DOM (Text und
 *     Attribute), Foto kr-37; Zeile 1 mit richtigen und falschen Einträgen → Panel bis auf den Eintrag unverändert (kein
 *     Orakel), Einträge im Band „Dein Klartext“. Aufgabe richtig lösen →
 *     Vergleich ✓/✗, Foto kr-39; nächste Aufgabe (W0-L1-05) ohne Vergleich.
 *  2. W4-L2-04 bei 1280 px: Seitenleiste rechts, Antwortfeld links (Bounding Boxes), Foto kr-38. W0-L2-04: Brute-Force-Liste
 *     erlaubt (L60, 25 Zeilen k = 1 … 25 plus k = 0).
 *  3. 360 px: kein Querscrollen, Antwort mit offenem Panel erreichbar, Touch-Ziele ≥ 44 px; Tastatur (Schalter mit Enter,
 *     Weiter mit →, Enter im Panel prüft nicht); reduzierte Bewegung ohne laufende Animationen.
 *     3b (1.3.2): Tablet mit Touch – hoch klebt die Antwort (W3-L4-01: Werkzeug und Antwort zugleich im Bild), quer ab
 *     960 px Seitenleiste neben der Antwort und unter der Kopfzeile.
 *  4. Ole B.: zweiter Tab startet den Boss-Kampf → das offene Panel im ersten Tab schließt mit Grund.
 *  5. Freies Labor: /labor#/scheibe mit IMOTQ (k = 12, häppchenweise getippt) → „Schritt für Schritt“, kein „wache“;
 *     eigener Text → frei. /werkstatt: Probelauf mit „boje“ (Umkehrung + Caesar 3) → neutraler Hinweis.
 *  6. Lehrkraft-Vorschau W4-L2-04: Schritte mit den richtigen Werten. Gast: Demo-Aufgabe 1 geführt.
 *  Keine Konsolen-/CSP-Fehler (beobachte).
 */
const assert = require('node:assert/strict');
const { anmelden, foto, gehe, keinQuerScrollen, ziele44 } = require('./hilfen');
const { neueSeite, aufgabe } = require('./schueler');
const { kursId, einstellen, kursWaehlen, kaestchen } = require('./inhalte');

const ALLE = [0, 1, 2, 3, 4, 5, 6];
const N = (t) => String(t).toUpperCase().replace(/[^A-Z]/g, '');

/** Text und alle Attributwerte der Seite (normalisiert A–Z) – Prüfung „kein Klartext im DOM“ */
const domText = (page) =>
  page.evaluate(() => {
    const teile = [document.body.innerText];
    for (const el of document.body.querySelectorAll('*')) for (const a of el.attributes) teile.push(a.value);
    for (const f of document.body.querySelectorAll('input, textarea')) teile.push(f.value);
    return teile.join(' ');
  });

/** Panel der Aufgabe aufklappen (M12 E232: W0-Werkstatt-Aufgaben sind schon offen) und warten, bis das Werkzeug steht */
async function aufklappen(page, { gefuehrt = true } = {}) {
  const s = page.locator('button.werkzeug-schalter').first();
  await page.waitForTimeout(50);
  if ((await s.getAttribute('aria-expanded')) !== 'true') await s.click();
  assert.equal(await s.getAttribute('aria-expanded'), 'true');
  if (gefuehrt) await page.locator('.werkzeug-panel-flaeche section.gefuehrt').waitFor();
  else await page.locator('.werkzeug-panel-inhalt > :not(.laden)').first().waitFor();
}

/** Zustand des geführten Panels ohne den Eintrag selbst: Klassen, Status-Attribute, Vergleich, Fazit, Hinweis */
const panelZustand = (page) =>
  page.evaluate(() => {
    const s = document.querySelector('.werkzeug-panel-flaeche section.gefuehrt');
    const klassen = [...s.querySelectorAll('*')].map((el) => `${el.tagName}.${[...el.classList].sort().join('.')}|${el.getAttribute('aria-invalid') || ''}|${el.getAttribute('aria-current') || ''}`);
    const text = (sel) => [...s.querySelectorAll(sel)].map((x) => x.textContent).join('|');
    return { klassen, frei: s.dataset.freigegeben || '', vergleich: text('.gefuehrt-vergleich'), fazit: text('.gefuehrt-fazit'), hinweis: text('.gefuehrt-hinweis'), live: text('[aria-live]:not(.gefuehrt-eintrag)') };
  });

async function szenario16(ctx) {
  const lehrer = await neueSeite(ctx, {}, 'Szenario 16 (Frau M.)');
  await anmelden(lehrer.page, ctx, 'Frau M.', '/lehrer');
  const lk = await kursId(lehrer.page, ctx, 'LK 13 (eA)');
  await einstellen(lehrer.page, ctx, lk, { welten: ALLE, boss: 'offen' });

  // 1) W2-L1-02: eingeklappt, Laden erst beim Klick
  const { kontext, page } = await neueSeite(ctx, {}, 'Szenario 16 (Mika)');
  const anfragen = [];
  page.on('request', (r) => anfragen.push(r.url()));
  await anmelden(page, ctx, 'Mika R.', '/spiel');
  await kursWaehlen(page, 'LK 13 (eA)');
  await aufgabe(page, ctx, 'W2-L1-02');
  const schalter = page.locator('button.werkzeug-schalter');
  assert.equal(await schalter.count(), 1, 'W2-L1-02: ein Werkzeug-Panel');
  assert.match(await schalter.innerText(), /Vigenère-Quadrat benutzen/);
  assert.equal(await schalter.getAttribute('aria-expanded'), 'false', 'eingeklappt');
  assert.equal(await page.locator('.werkzeug-panel-flaeche').isHidden(), true);
  assert.ok(!anfragen.some((u) => /\/labor\/vigenere\.js/.test(u)), 'labor/vigenere.js vor dem Klick nicht geladen');
  await aufklappen(page);
  assert.ok(anfragen.some((u) => /\/labor\/vigenere\.js/.test(u)), 'labor/vigenere.js beim Aufklappen geladen');
  // W0-L1-04: Werkstatt-Objekt – von selbst aufgeklappt (M12 E232)
  await aufgabe(page, ctx, 'W0-L1-04');
  assert.match(await schalter.innerText(), /Skytale-Stab benutzen/);
  await page.locator('.werkzeug-panel-flaeche section.gefuehrt').waitFor();
  assert.equal(await schalter.getAttribute('aria-expanded'), 'true', 'W0-L1-04 offen');
  // M12 (E235): der Geheimtext ist auf den Holzstab gewickelt – keine Ersatztabelle, Zeile für Zeile lesen
  assert.equal(await page.locator('.werkzeug-panel-flaeche table.gefuehrt-tabelle').count(), 0, 'keine Ersatztabelle');
  await page.locator('.werkzeug-panel-flaeche .gefuehrt-mechanik svg.stab-objekt').waitFor();
  const aufStab = await page.locator('.werkzeug-panel-flaeche svg .stab-buchstabe').evaluateAll((l) => l.map((x) => x.textContent).join(''));
  assert.equal(aufStab, 'NUMRABOUCKREHOGHSMEXCMNXHTFX', 'Geheimtext aufgewickelt (im DOM in Geheimtext-Reihenfolge)');
  assert.equal(await page.locator('.werkzeug-panel-flaeche .gefuehrt-markiert').count(), 1, 'genau eine Zeilenmarke markiert');
  const loesung = 'NACHSCHUBKOMMTMORGENFRUEH';
  const ohneKlartext = async (ort) => {
    const t = N(await domText(page));
    for (const stueck of [loesung, 'NACHSCHUB', 'MORGENFRUEH', 'KOMMTMORGEN']) assert.ok(!t.includes(stueck), `${ort}: „${stueck}“ im DOM`);
  };
  await ohneKlartext('W0-L1-04 aufgeklappt');

  // kein Orakel: Zeile 1 mit richtigen und falschen Einträgen – nur der Eintrag ändert sich
  const feld = page.locator('.werkzeug-panel-flaeche input.gefuehrt-eintrag-feld');
  await feld.fill('a');
  const z0 = await panelZustand(page);
  for (const x of ['nachsch', 'qqqqqqq', 'nach', 'z']) {
    await feld.fill(x);
    assert.deepEqual(await panelZustand(page), z0, `Zeile 1 mit „${x}“: Panel unverändert (kein Orakel)`);
    assert.equal(await page.locator('.werkzeug-panel-flaeche .stab-gefuehrt-band .gefuehrt-eintrag').first().textContent(), x, `Eintrag ${x} im Band`);
  }
  await feld.fill('nachsch');
  await page.locator('.werkzeug-panel-flaeche .stab-bild').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await foto(page, 'aufgabe-panel-gefuehrt');
  // Enter im Panel löst kein Prüfen aus
  await feld.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.feedback').count(), 0, 'Enter im Panel prüft die Aufgabe nicht');

  // richtig lösen → Vergleich
  await kaestchen(page, 'nachschubkommtmorgenfruehxxx');
  await page.locator('#pruefen').click();
  await page.locator('.feedback.ok').waitFor();
  await page.locator('.werkzeug-panel-flaeche section.gefuehrt[data-freigegeben="ja"]').waitFor();
  const vergleich = await page.locator('.werkzeug-panel-flaeche .gefuehrt-vergleich').allTextContents();
  assert.ok(vergleich.some((t) => t.startsWith('✓')) && vergleich.some((t) => t.startsWith('✗')), 'Vergleich ✓/✗ nach dem Lösen');
  await page.locator('.werkzeug-panel-flaeche .gefuehrt-fazit').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => !document.querySelector('.schweben')); // „+20“ (AQ.effekt.schweben) abwarten
  await foto(page, 'aufgabe-panel-vergleich');
  // nächste Aufgabe: ohne Vergleich
  await aufgabe(page, ctx, 'W0-L1-05');
  await aufklappen(page);
  assert.equal(await page.locator('.werkzeug-panel-flaeche section.gefuehrt[data-freigegeben]').count(), 0, 'W0-L1-05: kein Vergleich');
  assert.equal(await page.locator('.werkzeug-panel-flaeche .gefuehrt-vergleich').evaluateAll((l) => l.filter((x) => x.textContent.trim()).length), 0);

  // Review nach M11: je Welt eine Aufgabe – kein Klartext bzw. keine Lösungszahl im Panel, kein Orakel im ersten Schritt
  const JE_WELT = [
    ['W1-L1-07', { texte: ['DIESTERNESTEHENHELL'], zahlen: [] }, false],
    ['W2-L1-02', { texte: ['HCGHFZ'], zahlen: [] }, true],
    ['W3-L1-04', { texte: [], bits: ['010001010100100101010011', '001011001000101001101111'], zahlen: ['69'] }, true],
    ['W4-L2-04', { texte: [], zahlen: ['51', '32', '13'] }, true],
    ['W5-L1-02', { texte: [], zahlen: ['20', '65', '26'] }, true],
    ['W6-L2-03', { texte: ['LHTHPPMI', 'MDLOHLNE'], zahlen: [] }, true]
  ];
  for (const [id, loesung, gefuehrt] of JE_WELT) {
    await aufgabe(page, ctx, id);
    await aufklappen(page, { gefuehrt });
    const t = N(await domText(page));
    for (const x of loesung.texte) assert.ok(!t.includes(x), `${id}: „${x}“ im DOM`);
    const bitsText = (await domText(page)).replace(/[^01]/g, '');
    for (const b of loesung.bits || []) assert.ok(!bitsText.includes(b), `${id}: Lösungsbits im DOM`);
    const zellen = await page.locator('.werkzeug-panel-flaeche table td').evaluateAll((l) => l.map((td) => td.textContent.trim()));
    for (const z of loesung.zahlen) assert.ok(!zellen.includes(z), `${id}: Lösungszahl ${z} in einer Zelle`);
    if (gefuehrt) {
      const f = page.locator('.werkzeug-panel-flaeche input.gefuehrt-eintrag-feld');
      await f.fill('1');
      const z0 = await panelZustand(page);
      await f.fill('7');
      assert.deepEqual(await panelZustand(page), z0, `${id}: kein Orakel im ersten Schritt`);
    }
  }

  // 2) W4-L2-04 bei 1280 px: Seitenleiste rechts, Antwort links
  await page.setViewportSize({ width: 1280, height: 800 });
  await aufgabe(page, ctx, 'W4-L2-04');
  await aufklappen(page);
  const panelBox = await page.locator('.werkzeug-panel-flaeche').boundingBox();
  const antwortBox = await page.locator('input.luecke').first().boundingBox();
  assert.ok(panelBox && antwortBox, 'Boxen vorhanden');
  assert.ok(panelBox.x >= antwortBox.x + antwortBox.width - 1, `Seitenleiste rechts (${Math.round(panelBox.x)}) neben dem Antwortfeld (${Math.round(antwortBox.x + antwortBox.width)})`);
  assert.equal(await page.locator('.werkzeug-panel-flaeche').evaluate((el) => getComputedStyle(el).position), 'fixed');
  await page.locator('.werkzeug-panel-flaeche input, .werkzeug-panel-flaeche select').first().waitFor();
  await foto(page, 'aufgabe-panel-seitenleiste');
  await ohneKlartext('W4-L2-04'); // (Text-Lösung irrelevant, Zahlen prüft K12)

  // W0-L2-04: Liste erlaubt (L60)
  await aufgabe(page, ctx, 'W0-L2-04');
  await aufklappen(page, { gefuehrt: false });
  await page.locator('.werkzeug-panel-flaeche table.alle-tabelle tbody tr').first().waitFor();
  assert.equal(await page.locator('.werkzeug-panel-flaeche table.alle-tabelle tbody tr').count(), 26, 'W0-L2-04: alle Verschiebungen k = 0 … 25');
  // Esc klappt das Panel zu, Fokus zurück auf dem Schalter
  await page.locator('.werkzeug-panel-flaeche button.werkzeug-zuklappen').focus();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('button.werkzeug-schalter').getAttribute('aria-expanded'), 'false', 'Esc schließt das Panel');
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('werkzeug-schalter')), true, 'Fokus auf dem Schalter');

  // 3) 360 px, Tastatur, reduzierte Bewegung
  await page.setViewportSize({ width: 360, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await aufgabe(page, ctx, 'W0-L2-02');
  await page.locator('.werkzeug-panel-flaeche section.gefuehrt').waitFor(); // offen (M12 E232)
  await page.locator('button.werkzeug-schalter').focus();
  await page.keyboard.press('Enter'); // zu …
  assert.equal(await page.locator('button.werkzeug-schalter').getAttribute('aria-expanded'), 'false');
  await page.keyboard.press('Enter'); // … und mit der Tastatur wieder auf
  await page.locator('.werkzeug-panel-flaeche section.gefuehrt').waitFor();
  await keinQuerScrollen(page, 'W0-L2-02 mit Panel bei 360 px');
  await ziele44(page, 'W0-L2-02 mit Panel bei 360 px');
  // im Panel (die Kopfleiste blendet beim Epochenwechsel nur ihre Randfarbe über – keine Bewegung)
  // Übergänge von 0,01 ms (basis.css bei reduzierter Bewegung) sind keine Bewegung – nur sie können hier kurz „laufen“
  const laufend = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && Number(a.effect.getComputedTiming().duration) > 1 && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.werkzeug-panel')).map((a) => `${a.animationName || a.transitionProperty || 'js'} @ ${a.effect && a.effect.target ? a.effect.target.className : '?'}`));
  assert.deepEqual(laufend, [], 'reduzierte Bewegung: keine laufenden Animationen');
  // Tastatur: Eintrag, → zum nächsten Schritt
  const feld2 = page.locator('.werkzeug-panel-flaeche input.gefuehrt-eintrag-feld');
  await feld2.focus();
  await page.keyboard.type('w');
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('.werkzeug-panel-flaeche .gefuehrt-zaehler').textContent(), /Schritt 2 von/);
  // antwort_erreichbar_mit_panel: Antwortfeld und Prüfen-Knopf erreichbar und nicht verdeckt
  for (const sel of ['input.kaestchen, input.chiffre-zeile', '#pruefen']) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    const frei = await el.evaluate((x) => {
      const r = x.getBoundingClientRect();
      const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!oben && (oben === x || x.contains(oben));
    });
    assert.ok(frei, `${sel}: mit offenem Panel erreichbar (360 px)`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 });

  // 5) Freies Labor: Aufgabenwerte → geführt, eigener Text → frei
  await gehe(page, `${ctx.basis}/labor#/scheibe`);
  await page.waitForFunction(() => typeof KRLabor !== 'undefined' && KRLabor.aktiv() && KRLabor.aktiv().zustand());
  await page.getByRole('tab', { name: 'Text-Modus' }).click();
  await page.locator('.labor-richtung [data-richtung="ent"]').first().click();
  for (let i = 0; i < 26 && (await page.evaluate(() => KRLabor.aktiv().zustand().k)) !== 12; i++) await page.locator('.scheibe-plus').first().click();
  assert.equal(await page.evaluate(() => KRLabor.aktiv().zustand().k), 12);
  const ein = page.locator('textarea.labor-eingabe').first();
  await ein.fill('');
  await ein.focus();
  for (const teil of ['IM', 'OT', 'Q']) await page.keyboard.type(teil, { delay: 30 });
  await page.locator('section.gefuehrt').waitFor();
  assert.match(await page.locator('section.gefuehrt').innerText(), /Schritt für Schritt/);
  assert.ok(!N(await domText(page)).includes('WACHE'), 'Labor: kein „wache“ im DOM');
  await page.locator('.gefuehrt-eigene').click(); // „Eigene Werte“ verlässt den geführten Modus
  await page.getByRole('tab', { name: 'Text-Modus' }).click();
  const ein2 = page.locator('textarea.labor-eingabe').first();
  await ein2.fill('');
  await ein2.focus();
  await page.keyboard.type('zinnober');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('section.gefuehrt').count(), 0, 'eigener Text: frei');

  // Werkstatt: Probelauf mit Aufgabenwerten (W3-L3-04) → Hinweis statt Geheimtext
  await gehe(page, `${ctx.basis}/werkstatt`);
  await page.waitForFunction(() => typeof KRWerkstatt !== 'undefined');
  await page.evaluate(() => KRWerkstatt.setzeStufen([{ typ: 'umkehrung' }, { typ: 'caesar', param: { k: 3 } }]));
  await page.locator('textarea.werkstatt-klartext').fill('boje');
  await page.locator('p.werkstatt-nicht-verfuegbar').waitFor({ state: 'visible' });
  assert.ok(!N(await domText(page)).includes('HMRE'), 'Werkstatt: kein Geheimtext von boje');
  await kontext.close();

  // 3b) Tablet (1.3.2) mit Touch: hoch (768 × 1024, 800 × 1280) klebt die kompakte Antwort über der Knopfleiste – Werkzeug
  //     und Antwort zugleich im Bild, nichts verdeckt; quer (1024 × 768) Seitenleiste neben der Antwort, unter der Kopfzeile
  for (const [w, hgt] of [[768, 1024], [800, 1280], [1024, 768]]) {
    const t = await neueSeite(ctx, { viewport: { width: w, height: hgt }, hasTouch: true, isMobile: true }, `Szenario 16 (Tablet ${w})`);
    await anmelden(t.page, ctx, 'Mika R.', '/spiel'); // Nia T. steht seit Szenario 12 im Boss-Kampf (Labor gesperrt)
    await kursWaehlen(t.page, 'LK 13 (eA)');
    await aufgabe(t.page, ctx, 'W3-L4-01');
    await aufklappen(t.page);
    const ort = `W3-L4-01 bei ${w} × ${hgt}`;
    await keinQuerScrollen(t.page, ort);
    await ziele44(t.page, ort);
    const lage = await t.page.evaluate(() => {
      const f = document.querySelector('.werkzeug-panel-flaeche');
      const g = document.querySelector('.aufgabe-box > [role="group"]');
      const fest = getComputedStyle(f).position === 'fixed';
      if (!fest) {
        const fr = f.getBoundingClientRect();
        window.scrollTo({ top: fr.top + scrollY + Math.min(fr.height, innerHeight) / 2 - innerHeight / 2, behavior: 'instant' });
      } else g.scrollIntoView({ block: 'center', behavior: 'instant' });
      const gr = g.getBoundingClientRect();
      const fr = f.getBoundingClientRect();
      const feld = g.querySelector('input');
      const fe = feld.getBoundingClientRect();
      const oben = document.elementFromPoint(fe.left + fe.width / 2, fe.top + fe.height / 2);
      const kopf = document.getElementById('kopf').getBoundingClientRect();
      window.scrollTo({ top: 0, behavior: 'instant' });
      const pk = document.querySelector('.werkzeug-panel-kopf').getBoundingClientRect();
      return {
        fest,
        klebt: g.classList.contains('antwort-klebt'),
        antwortImBild: gr.top >= 0 && gr.bottom <= innerHeight,
        werkzeugImBild: Math.min(fr.bottom, innerHeight) - Math.max(fr.top, 0) > innerHeight * 0.3,
        feldFrei: !!oben && (oben === feld || feld.contains(oben)),
        nebeneinander: gr.right <= fr.left + 1,
        panelUnterKopf: pk.top >= kopf.bottom - 1
      };
    });
    assert.ok(lage.antwortImBild && lage.werkzeugImBild, `${ort}: Werkzeug und Antwort zugleich im Bild (${JSON.stringify(lage)})`);
    assert.ok(lage.feldFrei, `${ort}: Antwortfeld nicht verdeckt`);
    if (w < 960) assert.ok(!lage.fest && lage.klebt, `${ort}: im Fluss, Antwort klebt`);
    else assert.ok(lage.fest && !lage.klebt && lage.nebeneinander && lage.panelUnterKopf, `${ort}: Seitenleiste neben der Antwort, unter der Kopfzeile (${JSON.stringify(lage)})`);
    // Zuklappen: Antwort klebt nicht mehr
    await t.page.locator('button.werkzeug-schalter').first().click();
    assert.equal(await t.page.locator('.antwort-klebt').count(), 0, `${ort}: zugeklappt klebt nichts`);
    await t.kontext.close();
  }

  // 4) Ole B.: Boss-Kampf im zweiten Tab → offenes Panel schließt mit Grund
  const ole = await neueSeite(ctx, {}, 'Szenario 16 (Ole)');
  await anmelden(ole.page, ctx, 'Ole B.', '/spiel');
  await aufgabe(ole.page, ctx, 'W0-L1-04');
  await aufklappen(ole.page);
  const tab2 = await ole.kontext.newPage();
  await gehe(tab2, `${ctx.basis}/spiel#/boss/0`);
  await tab2.getByRole('button', { name: 'Kampf beginnen' }).click();
  await tab2.locator('dialog[open]').getByRole('button', { name: /beginnen|Los/ }).click();
  await tab2.waitForURL(/#\/kampf\//);
  await ole.page.bringToFront();
  await ole.page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await ole.page.locator('.werkzeug-panel-flaeche .werkzeug-gesperrt', { hasText: 'Während eines Boss-Kampfs ist das Labor geschlossen.' }).waitFor();
  assert.equal(await ole.page.locator('.werkzeug-panel-flaeche section.gefuehrt').count(), 0, 'Panel im Kampf geschlossen');
  await ole.kontext.close();

  // 6) Lehrkraft-Vorschau W4-L2-04: richtige Werte sichtbar
  await gehe(lehrer.page, `${ctx.basis}/lehrer#/vorschau/aufgabe/W4-L2-04`);
  await aufklappen(lehrer.page);
  await lehrer.page.locator('.werkzeug-panel-flaeche section.gefuehrt[data-freigegeben="ja"]').waitFor();
  const lv = (await lehrer.page.locator('.werkzeug-panel-flaeche .gefuehrt-vergleich').allTextContents()).join(' ');
  assert.match(lv, /richtig wäre: 51\b/, 'Vorschau: N = 51');
  assert.match(lv, /richtig wäre: 13\b/, 'Vorschau: d = 13');
  await lehrer.kontext.close();

  // Gast: Demo-Aufgabe 1 geführt
  const gast = await neueSeite(ctx, {}, 'Szenario 16 (Gast)');
  await gehe(gast.page, `${ctx.basis}/gast#/schueler/aufgabe/W8-L1-01`);
  await gast.page.locator('button.werkzeug-schalter').waitFor();
  await aufklappen(gast.page);
  assert.equal(await gast.page.locator('.werkzeug-panel-flaeche section.gefuehrt[data-freigegeben]').count(), 0, 'Gast: kein Vergleich vor dem Lösen');
  await gast.kontext.close();
}

module.exports = { szenario16 };
