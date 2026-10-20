'use strict';
// Lehrkraft-Bereich mit demselben Aufbau wie Algo Quest (Auftrag der Lehrkraft, 14.10.2026): Hauptnavigation,
// Kursliste, Kurs-Reiter, Aufgaben-Vorschau, Materialien und Verwaltung in gleicher Reihenfolge und mit gleichen
// Bezeichnungen; Kryptos-Extras (Teams, Funkraum, Knack-Arena, Labor, Wartung) jeweils am Ende.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
const LEHRER = [...BASIS, 'shared/krypto.js', 'render.js', 'interact.js', 'krypto/diagnose_chips.js', 'krypto/labor/registry.js', 'krypto/werkzeug_panel.js', 'krypto/bloecke.js', 'krypto/interaktionen.js', 'aufgabe.js', 'krypto/lehrer.js'];
const LEHRER_ALLE = [...LEHRER, 'krypto/funkpoll.js', 'krypto/lehrer_funkraum.js', 'krypto/lehrer_arena.js'];
const SITZUNG_L = { rolle: 'lehrkraft', name: 'Frau M.', kurse: [{ id: 'k:1', name: 'LK 13 (eA)', aktiv: true }], portal: 'https://portal.test' };
const SITZUNG_A = { ...SITZUNG_L, rolle: 'superadmin', name: 'Admin' };
const KURS = { id: 3, kurs: 'k:1', name: 'LK 13 (eA)', aktiv: true, einstellungen: { welten: [9], boss: 'auto', scoreboard: true, beamer: true, niveau: 'eA', kuer: 'frei', werkzeuge: {} }, boardSchluessel: 'abcdefgh1234', lehrkraft: 'Frau M.', schueler: 2, zuletztAktiv: null };
const KURS2 = { ...KURS, id: 4, kurs: 'k:2', name: 'GK 12 (gA)', lehrkraft: 'Herr T.', schueler: 5 };
const VORSCHAU = { welten: [{ nr: 9, titel: 'Testwelt', farbe: '#5B6B7C', maxPunkte: 70, aufgabenAnzahl: 2, levels: [{ id: 'W9-L1', nr: '1', titel: 'Blöcke', niveau: 'kern', rolle: 'kryptografie', ds: [1, 2], maxPunkte: 40, gAAusgeblendet: false, aufgaben: [{ id: 'W9-L1-01', titel: 'Lücke', stufe: 1, punkte: 10, kategorie: 'begriffe', niveau: 'kern', fallen: ['P3'], arten: ['gaps'], gAAusgeblendet: false }, { id: 'W9-L1-02', titel: 'Scheibe', stufe: 2, punkte: 30, kategorie: 'verschluesseln', niveau: 'eA', fallen: [], arten: ['chiffre'], gAAusgeblendet: true }] }], boss: null, archivfund: null }] };
const fetchL = (extra = {}, sitzung = SITZUNG_L) => ({
  'GET /api/sitzung': { status: 200, body: sitzung },
  'GET /api/lehrer/kurse': { status: 200, body: [KURS, KURS2] },
  'GET /api/lehrer/kurse/3': { status: 200, body: KURS },
  'GET /api/lehrer/kurse/3/schueler': { status: 200, body: [{ id: 1, name: 'Mika R.', aktiv: true, punkte: 30, geloest: 3, rang: 'Schreiber', zuletztAktiv: null }] },
  'GET /api/lehrer/werkzeuge': { status: 200, body: [] },
  'GET /api/lehrer/vorschau': { status: 200, body: VORSCHAU },
  'GET /api/lehrer/teams/3': { status: 200, body: { teams: [], ohneTeam: [] } },
  ...extra
});
const seiteLehrer = (k) => k.document.body.classList.add('seite-lehrer');
const lade = (hash, extra, sitzung, dateien = LEHRER) => D.lade(dateien, { url: 'http://x.test/lehrer' + hash, fetch: fetchL(extra, sitzung), vorher: seiteLehrer });
const haupt = (k) => k.document.getElementById('haupt');
const spalten = (k, tabelle) => k.alle(tabelle, 'thead th').map((th) => k.text(th));

test('Kopfzeile Lehrkraft wie Algo Quest: Kurse · Aufgaben · Materialien · Themen · (Verwaltung) · Labor, dann Portal · Name · Abmelden', () => {
  for (const [sitzung, erwartet] of [
    [SITZUNG_L, ['Kurse', 'Aufgaben', 'Materialien', 'Themen', 'Labor']],
    [SITZUNG_A, ['Kurse', 'Aufgaben', 'Materialien', 'Themen', 'Verwaltung', 'Labor']]
  ]) {
    const k = D.lade(BASIS, {});
    k.wert('KRKopf').baue({ rolle: sitzung.rolle, aktiv: 'kurse', sitzung });
    const kopf = k.document.getElementById('kopf');
    const nav = k.eins(kopf, 'nav.kopf-seiten');
    assert.deepEqual(k.alle(nav, 'a').map((a) => k.text(a)), erwartet, sitzung.rolle);
    assert.equal(k.eins(nav, 'a[href="/themen"]').getAttribute('data-bereich'), 'themen');
    assert.ok(k.eins(nav, 'a[href="/labor"]'), 'Labor als Kryptos-Zusatz am Ende der Hauptnavigation');
    const rechts = k.eins(kopf, '.kopf-nav');
    const reihe = [...rechts.children].map((x) => (x.classList.contains('kopf-name') ? 'Name' : x.classList.contains('abmelden') ? 'Abmelden' : x.classList.contains('menue') ? 'Menü' : k.text(x)));
    assert.deepEqual(reihe, ['Portal', 'Name', 'Abmelden', 'Menü'], sitzung.rolle);
    assert.equal(k.text(k.eins(rechts, '.kopf-name')), sitzung.name);
    assert.ok(k.eins(kopf, 'details.menue button.abmelden-ueberall'), 'Überall abmelden im Menü');
  }
});

test('Kopfzeile Schüler wie Algo Quest: Zeitleiste · Warm-up · Profil · (Scoreboard) · Themen, Labor rechts neben dem Portal', () => {
  for (const [scoreboard, erwartet] of [
    [true, ['Zeitleiste', 'Warm-up', 'Profil', 'Scoreboard', 'Themen']],
    [false, ['Zeitleiste', 'Warm-up', 'Profil', 'Themen']]
  ]) {
    const k = D.lade(BASIS, {});
    k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'themen', scoreboard, sitzung: { rolle: 'schueler', name: 'Mika R.', kurse: [], portal: 'https://portal.test' } });
    const kopf = k.document.getElementById('kopf');
    const nav = k.eins(kopf, 'nav.kopf-seiten');
    assert.deepEqual(k.alle(nav, 'a').map((a) => k.text(a)), erwartet, `scoreboard ${scoreboard}`);
    const themen = k.eins(nav, 'a[href="/themen"]');
    assert.equal(themen.getAttribute('data-bereich'), 'themen');
    assert.equal(themen.getAttribute('aria-current'), 'page', 'aktiver Bereich Themen');
    assert.equal(k.alle(kopf, 'nav.kopf-seiten a[href="/labor"]').length, 0);
    assert.ok(k.eins(kopf, '.kopf-nav a[href="/labor"]'));
    assert.equal(k.alle(kopf, '.kopf-nav .kopf-name').length, 0);
  }
  // Boss-Kampf: nur das Labor verschwindet, Themen bleibt (öffentliche Übersicht ohne Lösungen)
  const k = D.lade(BASIS, {});
  const kopfzeile = k.wert('KRKopf');
  kopfzeile.baue({ rolle: 'schueler', aktiv: 'zeitleiste', sitzung: { rolle: 'schueler', name: 'Mika R.', kurse: [] } });
  kopfzeile.laborLink(false);
  const kopf = k.document.getElementById('kopf');
  assert.equal(k.alle(kopf, 'a[href="/labor"]').length, 0);
  assert.ok(k.eins(kopf, 'nav.kopf-seiten a[href="/themen"]'));
  // öffentlich unverändert: Themen · Gastmodus
  const o = D.lade(BASIS, {});
  o.wert('KRKopf').baue({ rolle: null, aktiv: 'themen', sitzung: {} });
  assert.deepEqual(o.alle(o.document.getElementById('kopf'), 'nav.kopf-seiten a').map((a) => o.text(a)), ['Themen', 'Gastmodus']);
});

test('Kopfzeile Schüler ohne Angabe zum Scoreboard (Labor, Funkraum, Werkstatt): fragt GET /api/welten und ergänzt den Link vor Themen', async () => {
  for (const [an, erwartet] of [
    [true, ['Zeitleiste', 'Warm-up', 'Profil', 'Scoreboard', 'Themen']],
    [false, ['Zeitleiste', 'Warm-up', 'Profil', 'Themen']]
  ]) {
    const k = D.lade(BASIS, { fetch: { 'GET /api/welten': { status: 200, body: { scoreboard: an, welten: [] } }, 'GET /api/profil': { status: 200, body: {} }, 'GET /api/funk': { status: 200, body: {} } } });
    k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'labor', sitzung: { rolle: 'schueler', name: 'Mika R.', kurse: [] } });
    await k.ruhe();
    assert.deepEqual(k.alle(k.document.getElementById('kopf'), 'nav.kopf-seiten a').map((a) => k.text(a)), erwartet, `scoreboard ${an}`);
  }
  // ausdrücklich angegeben (Spiel-Seite, Themen): keine zusätzliche Anfrage
  const k = D.lade(BASIS, { fetch: { 'GET /api/profil': { status: 200, body: {} }, 'GET /api/funk': { status: 200, body: {} } } });
  k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'zeitleiste', scoreboard: false, sitzung: { rolle: 'schueler', name: 'Mika R.', kurse: [] } });
  await k.ruhe();
  assert.ok(!k.anfragen.some((x) => x.pfad === '/api/welten'));
});
test('Kursliste wie Algo Quest: „Meine Kurse“ bzw. „Alle Kurse“, Spalten Kurs · Kurscode · (Lehrkraft) · Schüler · zuletzt aktiv, Öffnen-Knopf', async () => {
  let k = lade('#/');
  await k.ruhe();
  assert.equal(k.text(k.eins(haupt(k), 'h1')), 'Meine Kurse');
  let t = k.eins(haupt(k), 'table.kurs-tabelle');
  assert.deepEqual(spalten(k, t), ['Kurs', 'Kurscode', 'Schüler', 'zuletzt aktiv', 'Niveau', 'Zustand', 'Aktion']);
  const zeile = k.alle(t, 'tbody tr')[0];
  assert.match(k.text(zeile), /Portal/);
  assert.match(k.text(zeile), /k:1/);
  assert.ok(k.eins(zeile, 'a.knopf[href="#/kurs/3/schueler"]'), 'Öffnen-Knopf');
  k = lade('#/', {}, SITZUNG_A);
  await k.ruhe();
  assert.equal(k.text(k.eins(haupt(k), 'h1')), 'Alle Kurse');
  t = k.eins(haupt(k), 'table.kurs-tabelle');
  assert.deepEqual(spalten(k, t), ['Kurs', 'Kurscode', 'Lehrkraft', 'Schüler', 'zuletzt aktiv', 'Niveau', 'Zustand', 'Aktion']);
});

test('Kurs-Reiter wie Algo Quest: Schüler · Beitritt & QR · Auswertung · Scoreboard · Einstellungen, danach Teams · Funkraum · Knack-Arena; Urkunden als Knopf im Kurskopf', async () => {
  const k = lade('#/kurs/3/schueler', {}, SITZUNG_L, LEHRER_ALLE);
  await k.ruhe();
  const tabs = k.alle(haupt(k), '.tabs[role="tablist"] [role="tab"]');
  assert.deepEqual(tabs.map((b) => b.getAttribute('data-tab')), ['schueler', 'beitritt', 'auswertung', 'scoreboard', 'einstellungen', 'teams', 'funkraum', 'arena']);
  assert.deepEqual(tabs.map((b) => k.text(b)), ['Schüler', 'Beitritt & QR', 'Auswertung', 'Scoreboard', 'Einstellungen', 'Teams', 'Funkraum', 'Knack-Arena']);
  assert.ok(k.eins(haupt(k), '.kurs-kopf a.knopf[href="/lehrer/urkunden?kurs=3"]'), 'Urkunden-Knopf');
  assert.match(k.text(k.eins(haupt(k), '.tab-inhalt h2')), /^Schüler \(1\)$/);
  k.taste(tabs[0], 'ArrowRight');
  await k.ruhe();
  assert.equal(k.window.location.hash, '#/kurs/3/beitritt');
});

test('Alter Reiter #/kurs/<id>/urkunden führt zur Urkunden-Seite', async () => {
  const k = lade('#/kurs/3/urkunden');
  await k.ruhe();
  assert.equal(k.navigiert.at(-1), '/lehrer/urkunden?kurs=3');
});

test('Reiter „Beitritt & QR“: Beitritt über das Portal, QR-Code zu Kryptos, Beamer-Board', async () => {
  let k = lade('#/kurs/3/beitritt');
  await k.ruhe();
  const box = k.eins(haupt(k), '#tab-inhalt');
  assert.match(k.text(box), /Beitritt über das Portal/);
  assert.match(k.text(box), /Kurscode/);
  assert.ok(k.eins(box, 'a[href="https://portal.test/"]'), 'Link zum Portal');
  assert.equal(k.eins(box, 'img.qr').getAttribute('src'), '/api/lehrer/qr.svg?ziel=start');
  assert.ok(k.eins(box, 'a[href="/board/abcdefgh1234"]'), 'Beamer-Board aktiv');
  k = lade('#/kurs/3/beitritt', { 'GET /api/lehrer/kurse/3': { status: 200, body: { ...KURS, einstellungen: { ...KURS.einstellungen, beamer: false } } } });
  await k.ruhe();
  assert.match(k.text(haupt(k)), /Beamer-Board ist ausgeschaltet/);
});

test('Auswertung in der Reihenfolge von Algo Quest: Export · Fortschrittsmatrix · Boss · Fallen · Aufgabenstatistik mit Welt-Filter', async () => {
  const ausw = { kurs: KURS, niveau: 'eA', matrix: { levels: [], zeilen: [] }, boss: { welten: [], zeilen: [] }, fallen: [], aufgaben: [{ id: 'W9-L1-01', titel: 'Lücke', welt: 9, versucht: 2, quote: 0.5, fehlversucheSchnitt: 1, falscheAntworten: [] }, { id: 'W0-L1-01', titel: 'Andere', welt: 0, versucht: 1, quote: 1, fehlversucheSchnitt: 0, falscheAntworten: [] }] };
  const k = lade('#/kurs/3/auswertung', { 'GET /api/lehrer/kurse/3/auswertung': { status: 200, body: ausw } });
  await k.ruhe();
  const titel = k.alle(haupt(k), '.auswertung-teil h2').map((x) => k.text(x));
  assert.deepEqual(titel, ['Export', 'Fortschrittsmatrix (% der Level-Punkte)', 'Boss-Ergebnisse (bester Versuch)', 'Fallen-Profil des Kurses', 'Aufgabenstatistik']);
  const filter = k.eins(haupt(k), 'select[name="aw-welt"]');
  assert.equal(k.alle(haupt(k), 'table.aufgaben-statistik tbody tr').length, 2);
  k.waehle(filter, '9');
  await k.ruhe();
  assert.deepEqual(k.alle(haupt(k), 'table.aufgaben-statistik tbody tr').map((z) => k.text(k.eins(z, 'a'))), ['Lücke']);
});

test('Scoreboard wie Algo Quest: Spalten Platz · Name · Punkte · Abzeichen · gelöst, Welt-Filter fragt ?welt=', async () => {
  const sb = (_b, { query }) => ({ status: 200, body: { welt: query.welt ? Number(query.welt) : null, liste: [{ id: 1, name: 'Mika R.', punkte: 30, abzeichen: 1, geloest: 3, platz: 1 }] } });
  const k = lade('#/kurs/3/scoreboard', { 'GET /api/lehrer/kurse/3/scoreboard': sb });
  await k.ruhe();
  assert.deepEqual(spalten(k, k.eins(haupt(k), 'table.scoreboard-tabelle')), ['Platz', 'Name', 'Punkte', 'Abzeichen', 'gelöst']);
  assert.match(k.text(haupt(k)), /für Schüler sichtbar/);
  k.waehle(k.eins(haupt(k), 'select[name="sb-welt"]'), '9');
  await k.ruhe();
  assert.equal(k.anfragen.filter((a) => a.pfad === '/api/lehrer/kurse/3/scoreboard').at(-1).query.welt, '9');
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt));
});

test('Aufgaben-Vorschau wie Algo Quest: „Aufgaben der Welten“, Level mit Aufgabentabelle (Aufgabe · Stufe · Punkte · Kategorie · Interaktion · Fallen)', async () => {
  let k = lade('#/vorschau');
  await k.ruhe();
  assert.match(k.text(k.eins(haupt(k), 'h1')), /Aufgaben der Welten/);
  assert.ok(k.eins(haupt(k), 'a[href="#/vorschau/welt/9"]'));
  k = lade('#/vorschau/welt/9');
  await k.ruhe();
  assert.match(k.text(k.eins(haupt(k), '.brotkrumen')), /Aufgaben › Welt 9/);
  assert.match(k.text(haupt(k)), /1 Level · 2 Aufgaben · 70 Level-Punkte/);
  const lv = k.eins(haupt(k), 'section.vorschau-level');
  assert.match(k.text(k.eins(lv, 'h2')), /Level 1 – Blöcke/);
  assert.match(k.text(lv), /DS 1, 2 · 2 Aufgaben · 40 Punkte/);
  const t = k.eins(lv, 'table.vorschau-tabelle');
  assert.deepEqual(spalten(k, t), ['Aufgabe', 'Stufe', 'Punkte', 'Kategorie', 'Interaktion', 'Fallen']);
  assert.ok(k.eins(t, 'a[href="#/vorschau/aufgabe/W9-L1-01"]'));
  assert.match(k.text(t), /Lücken/);
  assert.match(k.text(t), /im gA-Kurs ausgeblendet/);
});

test('Materialien wie Algo Quest: Titel, Warnhinweis, Tabelle Material · DS · PDF mit Schloss für Lehrkraft-Dateien', async () => {
  const m = { allgemein: [], welten: [{ nr: 9, eintraege: [{ art: 'praesentation', titel: 'Folien Welt 9', ds: [1], dateien: [{ label: 'PDF', url: '/lehrkraft/dateien/b.pdf', lehrkraft: true }, { label: 'Akte', url: '/akten/a.pdf', lehrkraft: false }] }] }] };
  const k = lade('#/materialien', { 'GET /api/lehrer/materialien': { status: 200, body: m } });
  await k.ruhe();
  assert.equal(k.text(k.eins(haupt(k), 'h1')), 'Materialien für Lehrkräfte');
  assert.match(k.text(haupt(k)), /Bitte nicht an Schülerinnen und Schüler weitergeben/);
  const t = k.eins(k.document.getElementById('material-welt-9'), 'table.material-tabelle');
  assert.deepEqual(spalten(k, t), ['Material', 'DS', 'PDF']);
  assert.match(k.text(k.eins(t, 'a[href="/lehrkraft/dateien/b.pdf"]')), /🔒/);
  assert.doesNotMatch(k.text(k.eins(t, 'a[href="/akten/a.pdf"]')), /🔒/);
  assert.match(k.text(k.eins(haupt(k), '.sprungleiste')), /Welt 9 Testwelt/);
});

test('Verwaltung wie Algo Quest: Lehrkräfte & Anfragen · Inhalte · Warm-up-Import · Backup & Verbund, danach Wartung; alte Hashes weitergeleitet', async () => {
  const extra = { 'GET /api/plattform': { status: 200, body: { vertrag: '1.3', id: 'kryptos', version: '0.4.7', basis: 'https://kryptos.test', auth: { modus: 'portal', portal: 'https://portal.test', sso: true } } } };
  let k = lade('#/admin', extra, SITZUNG_A);
  await k.ruhe();
  assert.equal(k.text(k.eins(haupt(k), 'h1')), 'Verwaltung (Admin)');
  const tabs = k.alle(haupt(k), '.tabs [role="tab"]');
  assert.deepEqual(tabs.map((b) => b.id), ['admin-tab-lehrkraefte', 'admin-tab-inhalte', 'admin-tab-kata', 'admin-tab-backup', 'admin-tab-wartung']);
  assert.deepEqual(tabs.map((b) => k.text(b)), ['Lehrkräfte & Anfragen', 'Inhalte', 'Warm-up-Import', 'Backup & Verbund', 'Wartung']);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true', '#/admin öffnet Lehrkräfte & Anfragen');
  // Lehrkräfte aus der Kursliste (Kryptos kennt keine Konten-Verwaltung; die liegt im Portal)
  const t = k.eins(haupt(k), 'table.lehrkraefte-tabelle');
  assert.deepEqual(k.alle(t, 'tbody th').map((x) => k.text(x)), ['Frau M.', 'Herr T.']);
  assert.match(k.text(haupt(k)), /im Portal/);
  assert.ok(k.eins(haupt(k), 'a[href="https://portal.test/"]'));
  assert.ok(!k.anfragen.some((a) => a.pfad === '/api/admin/lehrkraefte'), 'keine entfernte Admin-Route');
  // alter Hash #/admin/warmup → #/admin/kata
  k = lade('#/admin/warmup', { ...extra, 'GET /api/admin/katas': { status: 200, body: [] } }, SITZUNG_A);
  await k.ruhe();
  assert.equal(k.window.location.hash, '#/admin/kata');
  assert.equal(k.eins(haupt(k), '#admin-tab-kata').getAttribute('aria-selected'), 'true');
  // Backup & Verbund: Verbund-Angaben aus dem Manifest, Backup, Wiederherstellen
  k = lade('#/admin/backup', extra, SITZUNG_A);
  await k.ruhe();
  const text = k.text(haupt(k));
  assert.match(text, /Verbund InfoLabs/);
  assert.match(text, /Vertrag 1\.3/);
  assert.ok(k.eins(haupt(k), 'a[href="/api/admin/backup"]'));
  assert.match(text, /Backup wiederherstellen/);
});
