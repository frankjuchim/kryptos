'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const SITZUNG_S = { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }, { id: 'k:2', name: 'GK 12 (gA)', aktiv: true }], portal: 'https://portal.test', version: '0.2.0' };
const lade = (fetch = {}) => D.lade(['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'], { fetch });
test('Thema und Bewegung werden beim Laden aus den Einstellungen gesetzt', () => {
  const k = D.lade(['common.js'], {});
  k.wert('AQ').einstellung('thema', 'dunkel');
  D.fuehreAus(k, ['krypto/oberflaeche.js']);
  assert.equal(k.document.documentElement.getAttribute('data-theme'), 'dunkel');
  k.wert('KR').bewegung('aus');
  assert.equal(k.document.documentElement.getAttribute('data-bewegung'), 'aus');
});
test('KR.epoche: 0–6 über data-epoche, sonst Akzent per CSSOM', () => {
  const k = lade();
  const KR = k.wert('KR');
  const html = k.document.documentElement;
  KR.epoche(2);
  assert.equal(html.getAttribute('data-epoche'), '2');
  assert.equal(html.style.getPropertyValue('--akzent'), '');
  KR.epoche(9, { farbe: '#5B6B7C', akzentHell: '#C9D3DD' });
  assert.equal(html.style.getPropertyValue('--akzent'), '#5B6B7C');
  assert.equal(html.style.getPropertyValue('--akzent-hell'), '#C9D3DD');
});
test('KR.epoche im Dunkelmodus: Weltfarbe ohne Epochen-Thema nimmt den hellen Akzent (Kontrast), auch nach Themenwechsel', () => {
  const k = lade();
  const KR = k.wert('KR');
  const html = k.document.documentElement;
  KR.thema('dunkel');
  KR.epoche(9, { farbe: '#5B6B7C', akzentHell: '#C9D3DD' });
  assert.equal(html.style.getPropertyValue('--akzent'), '#C9D3DD');
  KR.thema('hell');
  assert.equal(html.style.getPropertyValue('--akzent'), '#5B6B7C');
  k.medien['(prefers-color-scheme: dark)'] = true;
  KR.thema('auto');
  assert.equal(html.style.getPropertyValue('--akzent'), '#C9D3DD');
  KR.epoche(2);
  assert.equal(html.style.getPropertyValue('--akzent'), '');
});
test('KR.entsiegeln: bei reduzierter Bewegung sofort, aria-label sofort', async () => {
  const k = lade();
  k.medien['(prefers-reduced-motion: reduce)'] = true;
  const el = k.document.createElement('h2');
  const p = k.wert('KR').entsiegeln(el, 'Die Antike');
  assert.equal(el.getAttribute('aria-label'), 'Die Antike');
  assert.equal(k.text(el), 'Die Antike', 'ohne Animation sofort vollständig');
  await p;
});
test('Kopfzeile Schüler: Portal, Labor, Kurswahl (2 Kurse), aria-current, Abmelden', async () => {
  const k = lade({ 'POST /api/abmelden': { status: 200, body: { weiter: '/' } }, 'POST /api/sitzung/kurs': { status: 200, body: { ok: true, kurs: { id: 'k:2', name: 'GK 12 (gA)' } } } });
  k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'profil', sitzung: SITZUNG_S, scoreboard: true });
  const kopf = k.document.getElementById('kopf');
  assert.equal(k.eins(kopf, 'a.kopf-link[href="https://portal.test"]').textContent.includes('Portal'), true);
  assert.ok(k.eins(kopf, 'a[href="/labor"]'));
  assert.equal(k.eins(kopf, 'a[aria-current="page"]').getAttribute('href'), '/spiel#/profil');
  const wahl = k.eins(kopf, 'select[name="kurs"]');
  assert.deepEqual(k.alle(wahl, 'option').map((o) => o.value), ['k:1', 'k:2']);
  wahl.value = 'k:2';
  k.klick(k.eins(kopf, 'button.kurs-wechseln'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/sitzung/kurs').body, { kurs: 'k:2' });
  k.klick(k.eins(kopf, 'button.abmelden'));
  await k.ruhe();
  assert.deepEqual(k.anfragen.find((a) => a.pfad === '/api/abmelden').body, { ueberall: false });
  assert.equal(k.navigiert.at(-1), '/');
});
test('Kopfzeile Lehrkraft und Superadmin: Verwaltung nur für Superadmin, keine Kurswahl', () => {
  for (const [rolle, verwaltung] of [['lehrkraft', false], ['superadmin', true]]) {
    const k = lade();
    k.wert('KRKopf').baue({ rolle, aktiv: 'kurse', sitzung: { rolle, name: 'Frau M.', kurse: [], portal: 'https://portal.test' } });
    const kopf = k.document.getElementById('kopf');
    assert.equal(k.alle(kopf, 'a[href="/lehrer#/admin"]').length, verwaltung ? 1 : 0, rolle);
    assert.equal(k.alle(kopf, 'select[name="kurs"]').length, 0);
    assert.ok(k.eins(kopf, 'a[href="/labor"]'));
  }
});
test('Kopfzeile öffentlich, Rang-Badge, Funk-Punkt, Entsiegeln mit Animation, Fehlerkasten', async () => {
  const k = lade({ 'GET /api/profil': { status: 200, body: { rang: { name: 'Chiffreur', anteil: 0.62 } } } });
  const KRKopf = k.wert('KRKopf');
  KRKopf.baue({ rolle: null, aktiv: 'themen' });
  const kopf = k.document.getElementById('kopf');
  assert.equal(k.eins(kopf, 'a.anmelden').getAttribute('href'), '/sso/start?ziel=%2Fspiel');
  assert.equal(k.alle(kopf, 'button.abmelden, a[href="/labor"]').length, 0);
  assert.equal(k.eins(kopf, 'a[aria-current="page"]').getAttribute('href'), '/themen');
  KRKopf.baue({ rolle: 'schueler', aktiv: 'zeitleiste', sitzung: SITZUNG_S });
  await k.ruhe();
  assert.equal(k.anfragen.filter((a) => a.pfad === '/api/profil').length, 1);
  const rang = k.eins(kopf, 'a.rang');
  assert.equal(rang.hidden, false);
  assert.match(k.text(rang), /Chiffreur 62 %/);
  assert.equal(k.alle(kopf, 'select[name="kurs"]').length, 1);
  KRKopf.funkPunkt(true);
  KRKopf.funkPunkt(true);
  assert.equal(k.alle(kopf, 'a[href="/funkraum"] .punkt-funk').length, 1);
  KRKopf.funkPunkt(false);
  assert.equal(k.alle(kopf, 'a[href="/funkraum"]').length, 0);
  const KR = k.wert('KR');
  const el = k.document.createElement('h2');
  const fertig = KR.entsiegeln(el, 'Bagdad 850', { dauer: 30 });
  await k.ruhe(); // Attrappen-Timer sind unref – erst k.ruhe(), dann das Promise
  await fertig;
  assert.equal(k.text(el), 'Bagdad 850');
  assert.ok(k.timer.length > 0, 'mit Bewegung über Timer');
  const box = k.document.createElement('div');
  KR.fehler(box, new Error('<b>kaputt</b>'), { zurueck: { href: '/spiel#/', text: 'Zur Zeitleiste' } });
  assert.equal(k.text(k.eins(box, '.fehler-box p')), '<b>kaputt</b>');
  assert.equal(k.eins(box, 'a').getAttribute('href'), '/spiel#/');
  assert.equal(KR.prozent(0.616), '62 %');
});
test('Sprite-Verweise mit ?v=<Version> aus dem Skript-Tag von oberflaeche.js (Cache-Busting)', () => {
  const k = D.lade(['common.js', 'krypto/oberflaeche.js'], {
    vorher(k) {
      const sc = k.document.createElement('script');
      sc.setAttribute('src', '/static/js/krypto/oberflaeche.js?v=9.8.7');
      k.document.head.appendChild(sc);
    }
  });
  const KR = k.wert('KR');
  assert.equal(KR.sprite('icons', 'i-labor'), '/static/img/icons.svg?v=9.8.7#i-labor');
  assert.equal(k.eins(KR.symbol('siegel', 's-ca'), 'use').getAttribute('href'), '/static/img/siegel.svg?v=9.8.7#s-ca');
  const ohne = D.lade(['common.js', 'krypto/oberflaeche.js']);
  assert.equal(ohne.wert('KR').sprite('icons', 'i-labor'), '/static/img/icons.svg#i-labor', 'ohne Versionsquelle kein ?v=');
});
