'use strict';
// Rahmen-Baustein KRStation (Plan M10 Task 224, E170, E172–E174, E186, E196, E197): Port der Helfer der Krypto-Werkstatt
// (Ideen von A. Bodendiek) – Bewegung, Flug, Stempelkasten, Bänder, Kurzanleitung, Erklärfeld, „Mehr ausprobieren“,
// Hintergrund, Antippen ohne Wischen, Greifen, Ton (Standard aus), Funken, Sperre, Herkunftszeile.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');
const { BASIS } = require('./hilfen_labor');

/** Rahmen laden (ohne Werkzeug); opt.ruhig → prefers-reduced-motion */
function rahmen(opt = {}) {
  const k = D.lade(BASIS, {
    zeitraffer: 100,
    vorher(kk) {
      if (opt.ruhig) kk.medien['(prefers-reduced-motion: reduce)'] = true;
    }
  });
  const ziel = k.document.createElement('div');
  k.document.getElementById('haupt').appendChild(ziel);
  return { k, S: k.wert('KRStation'), ziel };
}

test('BASIS lädt station.js nach bausteine.js; KRStation hat die Schnittstelle des Plans', () => {
  assert.ok(BASIS.includes('krypto/labor/station.js'));
  assert.ok(BASIS.indexOf('krypto/labor/station.js') > BASIS.indexOf('krypto/labor/bausteine.js'));
  const { S } = rahmen();
  for (const f of ['bewegung', 'flug', 'stempel', 'baender', 'anleitung', 'erklaerung', 'mehr', 'hintergrund', 'tippen', 'greifen', 'ton', 'tonSchalter', 'funken', 'sperre', 'herkunft']) {
    assert.equal(typeof S[f], 'function', f);
  }
});

test('flug und bewegung: ruhig → sofort, kein animate', async () => {
  const { k, S, ziel } = rahmen({ ruhig: true });
  const a = k.document.createElement('span');
  const b = k.document.createElement('span');
  ziel.append(a, b);
  let fertig = false;
  S.flug(a, b, 'K').then(() => {
    fertig = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(fertig, true, 'Flug sofort fertig');
  assert.equal(k.animiert.length, 0, 'kein animate bei reduzierter Bewegung');
  const aufrufe = [];
  await S.bewegung(400, (e, p) => aufrufe.push([e, p]));
  assert.deepEqual(aufrufe, [[1, 1]], 'genau einmal der Endzustand');
  assert.equal(k.document.querySelectorAll('.station-flug').length, 0, 'kein Klon');
});

test('flug ohne ruhig: Klon fliegt per animate und verschwindet; bewegung endet bei 1', async () => {
  const { k, S, ziel } = rahmen();
  const a = k.document.createElement('span');
  const b = k.document.createElement('span');
  ziel.append(a, b);
  const p = S.flug(a, b, 'Q');
  assert.equal(k.animiert.length, 1);
  assert.equal(k.document.querySelectorAll('.station-flug').length, 1);
  await k.ruhe();
  await p;
  assert.equal(k.document.querySelectorAll('.station-flug').length, 0, 'Klon entfernt');
  const werte = [];
  const lauf20 = S.bewegung(20, (e) => werte.push(e));
  await k.ruhe();
  await lauf20;
  assert.equal(werte[werte.length - 1], 1);
  const lauf = S.bewegung(5000, () => {});
  assert.equal(typeof lauf.abbrechen, 'function');
  lauf.abbrechen();
});

test('schnelle_stempel_verlieren_nichts: 20 Klicks A…T ergeben 20 Zeichen in Reihenfolge', async () => {
  const { k, S, ziel } = rahmen();
  const baender = S.baender({ oben: 'Klartext', unten: 'Geheimtext', gruppe: [false, true] });
  ziel.appendChild(baender.element);
  const kasten = S.stempel(ziel, (b, knopf) => {
    baender.push(b.toLowerCase(), b); // zuerst schreiben, dann fliegen (Review Focus 5)
    S.flug(knopf, baender.letztes(1), b);
  });
  assert.equal(k.alle(kasten.element, 'button.station-stempel').length, 26);
  for (const b of 'ABCDEFGHIJKLMNOPQRST') k.klick(k.eins(ziel, `button.station-stempel[data-buchstabe="${b}"]`));
  assert.equal(baender.text(0), 'abcdefghijklmnopqrst');
  assert.equal(baender.text(1), 'ABCDEFGHIJKLMNOPQRST');
  assert.equal(baender.eintraege.length, 20);
  await k.ruhe();
  assert.equal(baender.text(0), 'abcdefghijklmnopqrst', 'Flüge ändern nichts');
  // Geheimtext GROSS in Fünfergruppen, Klartext klein
  const geheim = k.eins(ziel, '.station-baender output.geheim');
  assert.equal(k.text(geheim).replace(/\s+/g, ''), 'ABCDEFGHIJKLMNOPQRST');
  assert.equal(k.alle(geheim, '.station-luecke').length, 3, 'Fünfergruppen');
  assert.equal(k.alle(k.eins(ziel, '.station-baender output.klar'), '.station-luecke').length, 0, 'Klartext ohne Gruppen');
  assert.equal(k.text(k.eins(ziel, '.station-baender output.klar')).replace(/\s+/g, ''), 'abcdefghijklmnopqrst');
  // ⌫ Zurück, ✕ Neue Nachricht, Kopieren
  k.klick(k.eins(ziel, 'button.station-zurueck'));
  assert.equal(baender.text(1), 'ABCDEFGHIJKLMNOPQRS');
  k.klick(k.eins(ziel, 'button.station-kopieren'));
  await k.ruhe();
  assert.deepEqual(k.zwischenablage, ['ABCDEFGHIJKLMNOPQRS']);
  k.klick(k.eins(ziel, 'button.station-neu'));
  assert.equal(baender.eintraege.length, 0);
});

test('Stempelkasten: Buchstabentasten bei Fokus im Kasten, Touch-Ziele über die Klasse', () => {
  const { k, S, ziel } = rahmen();
  const gestempelt = [];
  const kasten = S.stempel(ziel, (b) => gestempelt.push(b));
  k.taste(k.eins(kasten.element, 'button.station-stempel[data-buchstabe="A"]'), 'm');
  assert.deepEqual(gestempelt, ['M']);
  kasten.setze(false);
  k.klick(k.eins(ziel, 'button.station-stempel[data-buchstabe="B"]'));
  assert.deepEqual(gestempelt, ['M'], 'gesperrt');
  kasten.markiere('C');
  assert.ok(k.eins(ziel, 'button.station-stempel[data-buchstabe="C"]').classList.contains('markiert'));
});

test('tippen_nach_wischen_ohne_wirkung: Finger wirkt erst beim Loslassen ohne Wischen (> 12 px)', () => {
  const { k, S, ziel } = rahmen();
  const el = k.document.createElement('div');
  ziel.appendChild(el);
  let n = 0;
  S.tippen(el, () => n++);
  k.zeiger(el, 'pointerdown', { clientX: 0, clientY: 0, pointerType: 'touch' });
  k.zeiger(el, 'pointermove', { clientX: 0, clientY: 20, pointerType: 'touch' });
  k.zeiger(el, 'pointerup', { clientX: 0, clientY: 20, pointerType: 'touch' });
  assert.equal(n, 0, 'Wischen erzeugt nichts');
  k.zeiger(el, 'pointerdown', { clientX: 5, clientY: 5, pointerType: 'touch' });
  assert.equal(n, 0, 'erst beim Loslassen');
  k.zeiger(el, 'pointerup', { clientX: 6, clientY: 7, pointerType: 'touch' });
  assert.equal(n, 1, 'Antippen ohne Bewegung');
  k.zeiger(el, 'pointerdown', { clientX: 5, clientY: 5, pointerType: 'touch' });
  k.zeiger(el, 'pointercancel', { clientX: 5, clientY: 5, pointerType: 'touch' });
  assert.equal(n, 1, 'Abbruch (Seite scrollt) erzeugt nichts');
  k.zeiger(el, 'pointerdown', { pointerType: 'mouse' });
  assert.equal(n, 2, 'Maus sofort');
});

test('greifen: Klasse für touch-action, touchstart auf ziehbarem Teil verhindert Scrollen', () => {
  const { k, S, ziel } = rahmen();
  const svg = k.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ziel.appendChild(svg);
  S.greifen(svg, (_p, t) => t && t.getAttribute && t.getAttribute('data-ziehbar') === 'ja');
  assert.ok(svg.classList.contains('station-greifbar'));
  const ring = k.document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('data-ziehbar', 'ja');
  svg.appendChild(ring);
  const ev = new (k.wert('Event'))('touchstart', { bubbles: true, cancelable: true });
  ev.touches = [{ clientX: 1, clientY: 1 }];
  ring.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
  const ev2 = new (k.wert('Event'))('touchstart', { bubbles: true, cancelable: true });
  ev2.touches = [{ clientX: 1, clientY: 1 }];
  svg.dispatchEvent(ev2);
  assert.equal(ev2.defaultPrevented, false, 'außerhalb des ziehbaren Teils scrollt die Seite');
});

test('sperre: Stempel deaktiviert, Hinweis sichtbar, danach wieder frei', () => {
  const { k, S, ziel } = rahmen();
  const wurzel = k.document.createElement('div');
  ziel.appendChild(wurzel);
  S.stempel(wurzel, () => {});
  S.sperre(wurzel, true);
  assert.equal(wurzel.dataset.gesperrt, 'ja');
  assert.ok(k.alle(wurzel, 'button.station-stempel').every((b) => b.disabled));
  assert.match(k.text(k.eins(wurzel, '.station-sperrhinweis')), /Während des Nachspielens ist die Eingabe gesperrt\./);
  S.sperre(wurzel, false);
  assert.equal(wurzel.dataset.gesperrt, undefined);
  assert.ok(k.alle(wurzel, 'button.station-stempel').every((b) => !b.disabled));
  assert.equal(k.alle(wurzel, '.station-sperrhinweis').length, 0);
});

test('herkunft: Text und Klasse', () => {
  const { k, S, ziel } = rahmen();
  const p = S.herkunft(ziel);
  assert.equal(p.localName, 'p');
  assert.ok(p.classList.contains('werkzeug-herkunft'));
  assert.equal(k.text(k.eins(ziel, 'p.werkzeug-herkunft')), 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
});

test('ton: Standard aus, keine AudioContext-Erzeugung ohne Schalter; Schalter an → Ton', () => {
  const { k, S, ziel } = rahmen();
  S.ton('rand');
  assert.equal(k.audio, 0);
  const schalter = S.tonSchalter(ziel);
  assert.equal(schalter.an(), false);
  const knopf = k.eins(ziel, 'button.station-ton');
  assert.equal(knopf.getAttribute('aria-pressed'), 'false');
  S.ton('fell');
  assert.equal(k.audio, 0);
  k.klick(knopf);
  assert.equal(schalter.an(), true);
  S.ton('klopf');
  assert.equal(k.audio, 1);
  S.ton('rand');
  assert.equal(k.audio, 1, 'ein AudioContext genügt');
  k.klick(knopf);
  assert.equal(schalter.an(), false);
});

test('anleitung, erklaerung, mehr, hintergrund: Textknoten, aria-current, details', () => {
  const { k, S, ziel } = rahmen();
  const a = S.anleitung(ziel, ['Scheibe drehen', 'Buchstaben außen antippen', 'Geheimtext ablesen']);
  const punkte = k.alle(ziel, 'ol.station-anleitung li');
  assert.equal(punkte.length, 3);
  assert.equal(punkte[0].getAttribute('aria-current'), 'step');
  a.setze(2);
  assert.equal(punkte[2].getAttribute('aria-current'), 'step');
  assert.equal(punkte[0].getAttribute('aria-current'), null);
  assert.ok(punkte[0].classList.contains('erledigt'));
  a.texte(['a', 'b', 'c']);
  assert.match(k.text(punkte[1]), /b/);
  const e = S.erklaerung(ziel);
  e.sage('Schritt 1', 'a wird zu D.');
  assert.equal(k.text(k.eins(ziel, '.station-erklaerung-titel')), 'Schritt 1');
  assert.equal(k.text(k.eins(ziel, '.station-erklaerung-text')), 'a wird zu D.');
  const m = S.mehr(ziel, 'Mehr ausprobieren', 'Alle Schlüssel, Raster', k.document.createTextNode('Inhalt'));
  assert.equal(m.localName, 'details');
  assert.ok(m.classList.contains('station-mehr'));
  assert.match(k.text(m), /Inhalt/);
  const hg = S.hintergrund(ziel, [{ titel: 'Schlüsselraum', zeilen: [['Schlüssel', '26']] }, { titel: 'Geschichte', text: 'Soll schon …' }]);
  assert.ok(hg.classList.contains('station-hintergrund'));
  assert.equal(k.alle(hg, 'dt').length, 1);
  assert.match(k.text(hg), /Soll schon/);
});

test('funken: ohne ruhig Funken, mit ruhig nichts', () => {
  const a = rahmen();
  const el = a.k.document.createElement('span');
  a.ziel.appendChild(el);
  a.S.funken(el);
  assert.equal(a.k.document.querySelectorAll('.funken').length, 1);
  const b = rahmen({ ruhig: true });
  const el2 = b.k.document.createElement('span');
  b.ziel.appendChild(el2);
  b.S.funken(el2);
  assert.equal(b.k.document.querySelectorAll('.funken').length, 0);
});

test('KRLabor.lade: fehlt station.js, wird es nach bausteine.js und vor dem Modul nachgeladen', async () => {
  const k = D.lade(BASIS.filter((d) => d !== 'krypto/labor/station.js'), { zeitraffer: 100 });
  const f = k.document.createElement('div');
  k.wert('KRLabor').oeffne('scheibe', {}, f, { modus: 'labor' });
  assert.deepEqual(k.skripte.filter((s) => s.includes('/labor/')), ['/static/js/krypto/labor/station.js']);
  D.fuehreAus(k, ['krypto/labor/station.js']);
  k.skriptEreignis('/static/js/krypto/labor/station.js', 'load');
  await k.ruhe();
  // M11 Task 242: nach station.js kommen Erkenner und Erkenner-Daten (in BASIS schon geladen), dann das Modul
  assert.deepEqual(k.skripte.filter((s) => s.includes('/labor/')), ['/static/js/krypto/labor/station.js', '/static/js/krypto/labor/scheibe.js']);
});

test('baender mit Gruppengröße (Zahlenpaare) und ungefaehr für große Anzahlen (Plan M10 Task 229)', () => {
  const { S, ziel } = rahmen();
  const b = S.baender({ oben: 'Klartext', unten: 'Zahlenpaare', gruppe: [false, true], gruppen: [0, 2] });
  ziel.appendChild(b.element);
  for (const [x, y] of [['w', '52'], ['o', '34'], ['l', '31']]) b.push(x, y);
  assert.equal(b.ausgaben[1].textContent, '52 34 31');
  assert.equal(b.ausgaben[0].textContent, 'wol');
  assert.equal(b.text(1), '523431', 'Rohtext ohne Lücken');
  b.beschrifte('Klartext (Paare)', 'Geheimtext', [false, true], [2, 5]);
  assert.equal(b.ausgaben[0].textContent, 'wo l');
  assert.equal(S.ungefaehr('15511210043330985984000000'), '≈ 1,6 · 10²⁵');
  assert.equal(S.ungefaehr('403291461126605635584000000'), '≈ 4,0 · 10²⁶');
  assert.equal(S.ungefaehr('26'), '26');
  assert.equal(S.ungefaehr('312000'), '312.000');
  assert.equal(S.ungefaehr('9995000'), '≈ 1,0 · 10⁷');
});

test('baender wortweise: ein Eintrag = ein Wort (Brief der Nullchiffre, Plan M10 Task 231)', () => {
  const { S, ziel } = rahmen();
  const b = S.baender({ oben: 'Nachricht', unten: 'Brief', woerter: [false, true] });
  ziel.appendChild(b.element);
  b.push('g', 'Gabel ');
  b.push('u', 'Ufer ');
  assert.equal(b.ausgaben[1].querySelectorAll('.station-wort').length, 2);
  assert.equal(b.ausgaben[1].textContent, 'GabelUfer');
  assert.equal(b.ausgaben[0].textContent, 'gu');
});
