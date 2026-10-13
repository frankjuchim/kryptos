'use strict';
// Funkraum-Seite, Poller, Netz, Szenen und Beamer im Attrappen-DOM (Plan M7 Tasks 151–155).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const SEITE = ['common.js', 'krypto/oberflaeche.js', 'shared/krypto.js', 'render.js', 'krypto/diagnose_chips.js', 'krypto/bloecke.js', 'krypto/labor/registry.js', 'krypto/kopfzeile.js', 'krypto/funkpoll.js', 'krypto/funknetz.js', 'krypto/funkraum_szenen.js', 'krypto/funkraum.js'];
const SITZUNG = { status: 200, body: { rolle: 'schueler', name: 'Mika R.', kurs: { id: 'k:1', name: 'LK 13 (eA)', niveau: 'eA' }, kurse: [] } };
const TEAMS = [{ id: 1, nr: 1, name: 'Team Skytale', rolle: 'alice' }, { id: 2, nr: 2, name: 'Team Scheibe', rolle: 'bob' }, { id: 3, nr: 3, name: 'Team Quadrat', rolle: 'eve' }];
const stand = (v, extra = {}) => ({ id: 7, typ: 'botenlauf', titel: 'Botenlauf', version: v, status: 'laeuft', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], ich: { team: TEAMS[0], rolle: 'alice', partner: 2 }, teams: TEAMS, nachrichten: [], ereignisse: [], anzeigen: { runde: 1 }, werkzeuge: [], boss: false, ...extra });
const funk = (szenario, team = TEAMS[0]) => ({ status: 200, body: { szenario, team } });

test('KRPoll: ETag/seit, 304 ohne Daten, Rückfall 2 → 4 → 8 → 15 s, Pause bei hidden, Ende bei 404', async () => {
  let n = 0;
  const k = D.lade(['common.js', 'krypto/funkpoll.js'], {
    zeitraffer: 1000,
    fetch: {
      'GET /api/funk/7/stand': (b, { query, headers }) => {
        n++;
        if (n === 1) return { status: 200, headers: { etag: '"7-3"' }, body: { version: 3 } };
        if (n === 2) {
          assert.equal(query.seit, '3');
          assert.equal(headers['If-None-Match'], '"7-3"');
          return { status: 304 };
        }
        if (n <= 6) return { netzfehler: true };
        if (n === 7) return { status: 200, headers: { etag: '"7-4"' }, body: { version: 4 } };
        return { status: 404, body: { error: 'Unbekannt.' } };
      }
    }
  });
  const daten = [];
  const zustaende = [];
  k.wert('KRPoll').starte({ url: (s) => `/api/funk/7/stand?seit=${s}`, intervall: 2000, beiDaten: (d) => daten.push(d.version), beiZustand: (z) => zustaende.push(z) });
  await k.ruhe();
  assert.deepEqual(daten, [3, 4]);
  assert.deepEqual(k.timer.map((t) => t.ms).slice(0, 7), [2000, 2000, 2000, 4000, 8000, 15000, 2000]);
  assert.ok(zustaende.includes('gestoert') && zustaende.at(-1) === 'ende');
  assert.equal(n, 8, 'nach 404 kein weiterer Abruf');
  assert.ok(k.anfragen.every((a) => a.headers.Accept === 'application/json'));
});

test('KRPoll: kein Abruf bei hidden, sofort beim Zurückkehren; mischen führt Nachrichten und Ereignisse nach id zusammen; nach auswertung 15 s', async () => {
  let n = 0;
  const k = D.lade(['common.js', 'krypto/funkpoll.js'], {
    zeitraffer: 1000,
    fetch: {
      'GET /api/funk/7/stand': (b, { query }) => {
        n++;
        if (query.seit === '0') return { status: 200, body: { id: 7, version: 2, status: 'laeuft', nachrichten: [{ id: 1, inhalt: 'ABC', angekommen: false }], ereignisse: [{ id: 1, code: 'gesendet' }] } };
        if (n === 2) return { status: 200, body: { id: 7, version: 3, status: 'auswertung', nachrichten: [{ id: 1, inhalt: 'ABC', angekommen: true }, { id: 2, inhalt: 'XY' }], ereignisse: [{ id: 2, code: 'angekommen' }] } };
        return { status: 404, body: { error: 'weg' } };
      }
    }
  });
  k.verstecke(true);
  const staende = [];
  const p = k.wert('KRPoll').starte({ url: (s) => `/api/funk/7/stand?seit=${s}`, intervall: 2000, mischen: true, beiDaten: (d) => staende.push(k.roh(d)) });
  await k.ruhe();
  assert.equal(n, 0, 'versteckt: kein Abruf');
  k.verstecke(false);
  await k.ruhe(); // Zeitraffer: 1. Vollstand, 2. Delta (2 s später), 3. 404 (15 s später) → Stopp
  assert.equal(n, 3);
  // Delta: angekommen ersetzt, neue Nachricht und neues Ereignis ergänzt
  const letzter = staende.at(-1);
  assert.deepEqual(letzter.nachrichten.map((x) => [x.id, !!x.angekommen]), [[1, true], [2, false]]);
  assert.deepEqual(letzter.ereignisse.map((e) => e.id), [1, 2]);
  assert.equal(p.version(), 3);
  assert.ok(k.timer.some((t) => t.ms === 15000), 'nach auswertung alle 15 s');
});

test('Funkraum-Seite: Rolle, Rollenkarte, Netz mit Tabelle, Senden mit sichtbarer Umlaut-Ersetzung, 429-Meldung', async () => {
  const gesendet = [];
  const k = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 7, typ: 'botenlauf', titel: 'Botenlauf', status: 'laeuft', phase: 'runde-1' }),
      'GET /api/funk/7/stand': { status: 200, headers: { etag: '"7-5"' }, body: stand(5) },
      'POST /api/funk/7/nachrichten': (b) => {
        gesendet.push(b);
        return gesendet.length === 1 ? { status: 200, body: { nachricht: { id: 1 } } } : { status: 429, body: { error: 'Höchstens eine Nachricht je Team in 10 Sekunden.' } };
      }
    }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'p.funk-rolle')), /Ihr seid Alice – Team Skytale/);
  assert.match(k.text(k.eins(k.document, '.funk-rollenkarte')), /Verschlüsselt mit Caesar und eurem geheimen Schlüssel/);
  assert.match(k.text(k.eins(k.document, 'p.funk-phase')), /Runde 1 \(1 von 3\)/);
  assert.equal(k.alle(k.document, 'table.funk-netz-tabelle tbody tr').length, 3);
  const netz = k.eins(k.document, 'svg.funk-netz');
  assert.equal(netz.getAttribute('role'), 'img');
  assert.match(netz.getAttribute('aria-label'), /3 Teams/);
  assert.equal(k.alle(netz, 'g.knoten.sonder').length, 1, 'Eve mit Sonder-Umriss');
  assert.match(k.text(k.eins(netz, 'g.knoten.sonder')), /Eve/, 'Rolle als Text, nicht nur Farbe');
  k.tippe(k.eins(k.document, 'textarea.funk-text'), 'grüße');
  assert.match(k.text(k.eins(k.document, 'p.funk-ersetzt')), /ü → UE.*ß → SS/);
  assert.equal(k.eins(k.document, 'button.funk-senden-knopf').disabled, true, 'ohne Klartext gesperrt');
  k.tippe(k.eins(k.document, 'input.funk-klartext'), 'gruesse');
  k.klick(k.eins(k.document, 'button.funk-senden-knopf'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet[0]), { text: 'GRUESSE', klartext: 'gruesse' });
  k.tippe(k.eins(k.document, 'textarea.funk-text'), 'ABC!');
  assert.equal(k.eins(k.document, 'button.funk-senden-knopf').disabled, true);
  assert.match(k.text(k.eins(k.document, 'p.funk-fehler')), /Nur A–Z, 0–9 und Leerzeichen/);
  // 429 als Meldung
  k.eins(k.document, 'textarea.funk-text').value = '';
  k.tippe(k.eins(k.document, 'textarea.funk-text'), 'XYZ');
  k.tippe(k.eins(k.document, 'input.funk-klartext'), 'abc');
  k.klick(k.eins(k.document, 'button.funk-senden-knopf'));
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'form.funk-senden p.funk-ergebnis')), /Höchstens eine Nachricht je Team/);
  // Stand-Abruf mit seit und Accept; nach dem Senden sofort neu abgefragt
  const abrufe = k.anfragen.filter((a) => a.pfad === '/api/funk/7/stand');
  assert.ok(abrufe.length >= 2);
  assert.equal(abrufe[0].query.seit, '0');
  assert.equal(abrufe[1].headers['If-None-Match'], '"7-5"');
  k.wert('KRFunkraum').stopp();
});

test('Leerzustände: kein Szenario, kein Team, Team spielt nicht mit, Pause sperrt Eingaben, Auswertung ohne Nachrichten', async () => {
  const lade = (fetch) => D.lade(SEITE, { url: 'http://x.test/funkraum', fetch: { 'GET /api/sitzung': SITZUNG, ...fetch } });
  let k = lade({ 'GET /api/funk': funk(null) });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.leer-zustand')), /Gerade läuft in deinem Kurs kein Funkraum-Szenario/);
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt), 'sieht alle 20 s nach');
  k.wert('KRFunkraum').stopp();

  k = lade({ 'GET /api/funk': { status: 429, body: { error: 'Zu viele Anfragen. Bitte warte kurz.' } } });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.leer-zustand')), /gerade sehr gefragt/);
  assert.ok(k.timer.some((t) => t.ms === 10000 && !t.wiederholt), '429: neuer Versuch nach 10 s');
  k.wert('KRFunkraum').stopp();

  k = lade({ 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }, null) });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.leer-zustand')), /Du bist keinem Team zugeteilt/);

  k = lade({ 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }), 'GET /api/funk/7/stand': { status: 200, body: stand(3, { ich: { team: TEAMS[0], rolle: null, partner: null } }) } });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-szene')), /Dein Team spielt diesmal nicht mit – schau auf den Beamer/);
  assert.equal(k.alle(k.document, 'textarea.funk-text').length, 0);
  k.wert('KRFunkraum').stopp();

  k = lade({ 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'pausiert', phase: 'runde-1' }), 'GET /api/funk/7/stand': { status: 200, body: stand(3, { status: 'pausiert' }) } });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-banner')), /Pause – deine Lehrkraft hat den Funkraum angehalten/);
  k.tippe(k.eins(k.document, 'textarea.funk-text'), 'ABC');
  assert.equal(k.eins(k.document, 'button.funk-senden-knopf').disabled, true);
  assert.equal(k.eins(k.document, 'textarea.funk-text').disabled, true);
  k.wert('KRFunkraum').stopp();

  k = lade({ 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'auswertung', phase: 'aufloesung' }), 'GET /api/funk/7/stand': { status: 200, body: stand(9, { status: 'auswertung', phase: 'aufloesung', auswertung: { zeilen: [{ nachricht: 1, runde: 1, von: 1, an: 2, angekommen: true, geknackt: true, sekunden: 70, besonderheit: null }], je: { 1: { gesendet: 1, geknackt: 1 } } } }) } });
  await k.ruhe();
  const a = k.text(k.eins(k.document, '.funk-auswertung-bereich'));
  assert.match(a, /Alle Nachrichten wurden gelöscht/);
  assert.match(a, /Team Skytale/);
  assert.equal(k.alle(k.document, 'form.funk-senden').length, 0);
  k.wert('KRFunkraum').stopp();
});

test('Funkraum: Verbindung gestört → Hinweis, danach automatisch weiter; 404 → Leerzustand „geschlossen“', async () => {
  let n = 0;
  const k = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    zeitraffer: 1000,
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }),
      'GET /api/funk/7/stand': () => {
        n++;
        if (n === 1) return { status: 200, body: stand(3) };
        if (n === 2) return { netzfehler: true };
        if (n === 3) {
          assert.match(k.text(k.eins(k.document, 'p.funk-verbindung')), /Verbindung unterbrochen – wird wiederhergestellt/);
          return { status: 200, body: stand(4) };
        }
        return { status: 404, body: { error: 'Szenario nicht gefunden.' } };
      }
    }
  });
  await k.ruhe();
  await new Promise((r) => setTimeout(r, 30));
  await k.ruhe();
  assert.ok(n >= 4);
  assert.match(k.text(k.eins(k.document, '.leer-zustand')), /Das Szenario wurde geschlossen/);
  k.wert('KRFunkraum').stopp();
});

test('Ticker: Texte aus Ereignis-Codes mit Teamnamen; Sonderkarten bleiben verdeckt; aria-live erst nach dem Aufbau', async () => {
  const ereignisse = [
    { id: 1, code: 'status', daten: { status: 'laeuft' }, zeit: '2026-10-13T08:00:00Z', version: 2 },
    { id: 2, code: 'gesendet', daten: { nachricht: 11, von: 1, an: 2 }, zeit: '2026-10-13T08:00:10Z', version: 3 },
    { id: 3, code: 'geknackt', daten: { nachricht: 11, team: 3, sekunden: 70 }, zeit: '2026-10-13T08:01:20Z', version: 4 },
    { id: 4, code: 'sonderkarte', daten: { team: 1 }, zeit: '2026-10-13T08:02:00Z', version: 5 }
  ];
  const k = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }),
      'GET /api/funk/7/stand': { status: 200, body: stand(5, { nachrichten: [{ id: 11, von: 1, an: 2, art: 'nachricht', inhalt: 'OHSAL AKLUW HZZ', lesbar: true, angekommen: false, geknackt: true, zeit: '2026-10-13T08:00:10Z', version: 4 }], ereignisse }) }
    }
  });
  await k.ruhe();
  const t = k.eins(k.document, 'ol.funk-ticker');
  assert.match(k.text(t), /Team Quadrat hat eine Nachricht von Team Skytale geknackt \(nach 1:10 min\)/);
  assert.match(k.text(t), /Team Skytale hat eine Nachricht an Team Scheibe gesendet/);
  assert.doesNotMatch(k.text(t), /Sonderkarte|sonderkarte/);
  assert.equal(t.getAttribute('aria-live'), 'polite');
  assert.equal(k.alle(k.document, 'svg.funk-netz circle.nachricht.geknackt').length, 1);
  assert.equal(k.alle(k.document, 'svg.funk-netz circle.fliegt').length, 0, 'erster Aufbau ohne Flug');
  k.wert('KRFunkraum').stopp();
});

test('Kopfzeile: Funkraum-Punkt aus GET /api/funk, alle 20 s, nicht bei hidden; Lehrkraft fragt nicht', async () => {
  const BASIS = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js'];
  let laeuft = true;
  const k = D.lade(BASIS, { fetch: { 'GET /api/funk': () => funk(laeuft ? { id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' } : null), 'GET /api/profil': { status: 200, body: {} } } });
  k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'zeitleiste', sitzung: { kurse: [] } });
  await k.ruhe();
  assert.equal(k.alle(k.document, '#kopf .kopf-nav a.funk').length, 1);
  assert.ok(k.timer.some((t) => t.ms === 20000 && t.wiederholt));
  // neu aufgebaut: Punkt bleibt, kein zweiter Timer
  k.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'profil', sitzung: { kurse: [] } });
  assert.equal(k.alle(k.document, '#kopf .kopf-nav a.funk').length, 1);
  assert.equal(k.timer.filter((t) => t.ms === 20000).length, 1);
  const vorher = k.anfragen.filter((a) => a.pfad === '/api/funk').length;
  k.verstecke(true);
  k.wert('KRKopf')._funkPruefe();
  await k.ruhe();
  assert.equal(k.anfragen.filter((a) => a.pfad === '/api/funk').length, vorher, 'hidden: keine Abfrage');
  k.verstecke(false);
  laeuft = false;
  k.wert('KRKopf')._funkPruefe();
  await k.ruhe();
  assert.equal(k.alle(k.document, '#kopf .kopf-nav a.funk').length, 0);

  const l = D.lade(BASIS, { fetch: {} });
  l.wert('KRKopf').baue({ rolle: 'lehrkraft', aktiv: 'kurse', sitzung: {} });
  await l.ruhe();
  assert.equal(l.anfragen.filter((a) => a.pfad === '/api/funk').length, 0);
  // Funkraum-Seite pollt selbst
  const f = D.lade(BASIS, { fetch: {} });
  f.wert('KRKopf').baue({ rolle: 'schueler', aktiv: 'funkraum', sitzung: { kurse: [] } });
  await f.ruhe();
  assert.equal(f.anfragen.filter((a) => a.pfad === '/api/funk').length, 0);
});

/* ---------- Task 152: Szenen Botenlauf und Wettknacken ---------- */
const LABOR = ['krypto/labor/bausteine.js', 'krypto/labor/scheibe.js', 'krypto/labor/haeufigkeit.js', 'krypto/labor/substitution.js'];
const SEITE_MIT_LABOR = [...SEITE, ...LABOR];
const BOTE = { id: 11, von: 1, an: 2, angezeigtVon: null, art: 'nachricht', inhalt: 'OHSAL AKLUW HZZ', lesbar: true, ausgeblendet: false, angekommen: false, geknackt: false, zeit: '2026-10-13T08:00:00Z', version: 4 };
const SCHEIBE = [{ id: 'scheibe', voreinstellung: { reiter: ['alle', 'scheibe', 'text'] } }];

test('Wettknacken: Werkbank-Haken sendet die Zuordnung, Anteil erscheint mit Komma; Analysator mit Reiter Bigramme', async () => {
  const puts = [];
  const k = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 8, typ: 'wettknacken', status: 'laeuft', phase: 'knacken' }),
      'GET /api/funk/8/stand': { status: 200, body: stand(2, { id: 8, typ: 'wettknacken', phase: 'knacken', phasen: ['knacken', 'aufloesung'], ich: { team: TEAMS[0], rolle: 'knacker', anteil: 0 }, anzeigen: { geheimtext: 'DHCPQ NRUMV UDNCU', laenge: 15, hinweise: ['U ≙ e'] }, werkzeuge: [{ id: 'haeufigkeit', voreinstellung: { text: 'DHCPQ NRUMV UDNCU', reiter: ['histogramm', 'bigramme'] } }, { id: 'substitution', voreinstellung: { text: 'DHCPQ NRUMV UDNCU' } }] }) },
      'PUT /api/funk/8/zuordnung': (b) => {
        puts.push(b);
        return puts.length === 1 ? { status: 200, body: { anteil: 0.193 } } : { status: 429, body: { error: 'Höchstens eine Zuordnung je Team in 2 Sekunden.' } };
      }
    }
  });
  // Umgebung der eingebetteten Werkzeuge abfangen (vor dem ersten Rendern – die Abrufe laufen erst nach setImmediate)
  const L = k.wert('KRLabor');
  const echt = L.oeffne;
  const umgebung = {};
  L.oeffne = (id, v, c, u) => {
    umgebung[id] = u;
    return echt(id, v, c, u);
  };
  await k.ruhe();
  assert.equal(umgebung.substitution.modus, 'funkraum');
  assert.equal(umgebung.haeufigkeit.modus, 'funkraum');
  umgebung.substitution.beiAenderung({ U: 'e', Y: '' }); // die Werkbank ruft das entprellt auf (M6 Task 115); leere Felder fallen weg
  await k.ruhe();
  assert.deepEqual(k.roh(puts), [{ zuordnung: { U: 'e' } }]);
  assert.match(k.text(k.eins(k.document, 'p.funk-anteil')), /19,3 %/);
  assert.equal(k.eins(k.document, '.funk-anteil-balken').getAttribute('aria-valuenow'), '19');
  assert.ok(k.eins(k.document, 'div.funk-werkzeug[data-werkzeug="haeufigkeit"] [role=tab][data-reiter="bigramme"]'));
  assert.ok(k.eins(k.document, '.funk-werkzeug[data-werkzeug="substitution"]'));
  assert.match(k.text(k.eins(k.document, 'ul.funk-hinweise')), /U ≙ e/);
  assert.match(k.text(k.eins(k.document, '.funk-geheimtext')), /DHCPQ/);
  // 429 still: keine Fehlermeldung, Anteil bleibt
  umgebung.substitution.beiAenderung({ U: 'e', Y: 'c' });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'p.funk-anteil')), /19,3 %/);
  assert.equal(k.alle(k.document, '.funk-wett .fehler').length, 0);
  k.wert('KRFunkraum').stopp();
});

test('Wettknacken: fertig zeigt „Geschafft! Platz 1“', async () => {
  const k = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    vorher: (kk) => (kk.medien['(prefers-reduced-motion: reduce)'] = true),
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 8, typ: 'wettknacken', status: 'laeuft', phase: 'knacken' }),
      'GET /api/funk/8/stand': { status: 200, body: stand(9, { id: 8, typ: 'wettknacken', phase: 'knacken', phasen: ['knacken', 'aufloesung'], ich: { team: TEAMS[0], rolle: 'knacker', anteil: 0.97, fertig: true, platz: 1 }, anzeigen: { geheimtext: 'DHCPQ', laenge: 5, hinweise: [] }, werkzeuge: [] }) }
    }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-fertig')), /Geschafft! Platz 1/);
  assert.match(k.text(k.eins(k.document, 'p.funk-anteil')), /97 %/);
  assert.equal(k.alle(k.document, '.funken').length, 0, 'reduzierte Bewegung: keine Funken');
  k.wert('KRFunkraum').stopp();
});

test('Botenlauf: Bob meldet Empfang, Eve knackt – Ergebnis, Ticker und Scheibe mit Reiter „alle“', async () => {
  const posts = [];
  const bob = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }, TEAMS[1]),
      'GET /api/funk/7/stand': { status: 200, body: stand(5, { ich: { team: TEAMS[1], rolle: 'bob', partner: 1 }, nachrichten: [BOTE], werkzeuge: SCHEIBE }) },
      'POST /api/funk/7/empfangen': (b) => {
        posts.push(b);
        return { status: 200, body: { richtig: posts.length === 1 } };
      }
    }
  });
  await bob.ruhe();
  const form = bob.eins(bob.document, 'form.funk-empfangen[data-nachricht="11"]');
  bob.tippe(bob.eins(form, 'input.funk-klartext'), 'haltet den pass');
  bob.klick(bob.eins(form, 'button'));
  await bob.ruhe();
  assert.deepEqual(bob.roh(posts[0]), { nachricht: 11, klartext: 'haltet den pass' });
  assert.match(bob.text(bob.eins(form, 'p.funk-ergebnis')), /Stimmt – angekommen/);
  bob.klick(bob.eins(form, 'button'));
  await bob.ruhe();
  assert.match(bob.text(bob.eins(form, 'p.funk-ergebnis')), /Stimmt nicht/);
  // Bob: Scheibe mit Text-Reiter zuerst; „In der Scheibe öffnen“ übernimmt den Geheimtext
  assert.ok(bob.eins(bob.document, 'div.funk-werkzeug[data-werkzeug="scheibe"] [role=tab][data-reiter="text"]'));
  assert.ok(bob.eins(bob.document, 'form.funk-senden input.funk-klartext'), 'Quittung über das Senden-Formular');
  bob.wert('KRFunkraum').stopp();

  let geknackt = false;
  const eve = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }, TEAMS[2]),
      'GET /api/funk/7/stand': () => ({
        status: 200,
        body: stand(geknackt ? 6 : 5, {
          ich: { team: TEAMS[2], rolle: 'eve', partner: null },
          nachrichten: [{ ...BOTE, geknackt }],
          ereignisse: geknackt ? [{ id: 9, code: 'geknackt', daten: { nachricht: 11, team: 3, sekunden: 70 }, zeit: '2026-10-13T08:01:10Z', version: 6 }] : [],
          werkzeuge: SCHEIBE
        })
      }),
      'POST /api/funk/7/knacken': (b) => {
        posts.push(b);
        geknackt = true;
        return { status: 200, body: { richtig: true } };
      }
    }
  });
  await eve.ruhe();
  assert.ok(eve.eins(eve.document, 'div.funk-werkzeug[data-werkzeug="scheibe"] [role=tab][data-reiter="alle"]'));
  assert.match(eve.text(eve.eins(eve.document, 'li.funk-nachricht[data-id="11"]')), /gesendet vor/);
  const kn = eve.eins(eve.document, 'form.funk-knacken[data-nachricht="11"]');
  eve.tippe(eve.eins(kn, 'input.funk-klartext'), 'haltet den pass');
  eve.klick(eve.eins(kn, 'button[type="submit"]'));
  await eve.ruhe();
  assert.deepEqual(eve.roh(posts.at(-1)), { nachricht: 11, klartext: 'haltet den pass' });
  assert.match(eve.text(eve.eins(kn, 'p.funk-ergebnis')), /Stimmt – geknackt nach 1:10 min/);
  assert.match(eve.text(eve.eins(eve.document, 'ol.funk-ticker')), /geknackt \(nach 1:10 min\)/);
  // „In der Scheibe öffnen“ legt den Geheimtext in den Reiter „alle“
  eve.klick(eve.eins(eve.document, 'li.funk-nachricht[data-id="11"] button.in-scheibe'));
  await eve.ruhe();
  assert.equal(eve.eins(eve.document, 'div.funk-werkzeug[data-werkzeug="scheibe"] textarea.labor-eingabe').value, 'OHSAL AKLUW HZZ');
  eve.wert('KRFunkraum').stopp();
});

test('Botenlauf: Alice sieht die Befehlskarte (sechs Befehle) und die Scheibe zum Verschlüsseln', async () => {
  const k = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    fetch: { 'GET /api/sitzung': SITZUNG, 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }), 'GET /api/funk/7/stand': { status: 200, body: stand(5, { werkzeuge: SCHEIBE }) } }
  });
  await k.ruhe();
  assert.deepEqual(k.alle(k.document, 'ul.befehle li').map((li) => k.text(li)), ['marschiert nach norden', 'haltet den pass', 'schickt zwei kohorten', 'wartet auf das signal', 'brecht das lager ab', 'rueckt bei sonnenaufgang vor']);
  assert.ok(k.eins(k.document, 'div.funk-werkzeug[data-werkzeug="scheibe"] [role=tab][data-reiter="text"]'));
  // Boss-Kampf sperrt die eingebetteten Werkzeuge
  k.wert('KRFunkraum').stopp();
  const b = D.lade(SEITE_MIT_LABOR, {
    url: 'http://x.test/funkraum',
    fetch: { 'GET /api/sitzung': SITZUNG, 'GET /api/funk': funk({ id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' }), 'GET /api/funk/7/stand': { status: 200, body: stand(5, { werkzeuge: [], boss: true }) } }
  });
  await b.ruhe();
  assert.match(b.text(b.eins(b.document, 'div.funk-werkzeug[data-werkzeug="scheibe"]')), /Während eines Boss-Kampfs sind die Werkzeuge gesperrt/);
  b.wert('KRFunkraum').stopp();
});

/* ---------- Task 153: Szenen „Der doppelte Schlüssel“ und „Schlüsseltausch“ ---------- */
const BAUSTEINE = ['HEUTE', 'MORGEN', 'UM', '6', '7', '8', '9', 'UHR', 'AM', 'BEIM', 'HAFEN', 'BAHNHOF', 'NORDTOR', 'MARKT', 'NORD', 'SUED', 'TREFFEN', 'ABHOLEN', 'PAKET', 'BOOT', 'ZUG'];
const DEMO_KEY = '1D C0 FD 7A B3 6C B4 DB 68 9E D3 74 B5 6E 06 AB 8A 96 CA 68 00 11 22 33 44 55 66 77 88 99 AA BB';
const C1 = '55 85 A8 2E F6 4C 8C FB 3D D6 81 54 F4 23 26 E3 CB D0 8F 26';
const C2 = '50 8F AF 3D F6 22 94 99 29 D6 9D 3C FA 28 26 E5 C5 C4 8E';
const OTP_ALICE = [{ id: 'bitlupe', voreinstellung: { reiter: ['xor'], modus: 'otp', schluesselart: 'hex' } }];
const otpStand = (v, ich, extra = {}) => stand(v, { id: 10, typ: 'doppelter-schluessel', titel: 'Der doppelte Schlüssel', phase: 'funken', phasen: ['funken', 'lauschen', 'aufloesung'], ich, anzeigen: { eveGewinnt: false }, ...extra });
const SEITE_BITLUPE = [...SEITE, 'krypto/labor/bausteine.js', 'krypto/labor/bitlupe.js', 'krypto/labor/modulo.js'];

test('Doppelter Schlüssel: Bausteine bauen den Spruch, Abschnitt 1 erneut nur für das Sparschwein-Paar sichtbar', async () => {
  const gesendet = [];
  let nachrichten = [];
  const k = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 10, typ: 'doppelter-schluessel', status: 'laeuft', phase: 'funken' }),
      'GET /api/funk/10/stand': () => ({ status: 200, body: otpStand(3 + nachrichten.length, { team: TEAMS[0], rolle: 'alice', partner: 2, bausteine: BAUSTEINE, erneutErlaubt: false, abschnitte: [DEMO_KEY, DEMO_KEY.split(' ').reverse().join(' ')] }, { nachrichten, werkzeuge: OTP_ALICE }) }),
      'POST /api/funk/10/nachrichten': (b) => {
        gesendet.push(b);
        nachrichten = [...nachrichten, { id: 20 + nachrichten.length, von: 1, an: 2, art: 'nachricht', inhalt: b.text, lesbar: true, angekommen: false, geknackt: false, zeit: '2026-10-13T08:00:00Z', version: 4 }];
        return { status: 200, body: { nachricht: { id: 20 } } };
      }
    }
  });
  await k.ruhe();
  assert.equal(k.alle(k.document, 'code.abschnitt').length, 2);
  assert.match(k.text(k.eins(k.document, 'code.abschnitt[data-nr="1"]')), /^1D C0 FD/);
  const knopf = (w) => k.alle(k.document, 'button.baustein').find((b) => b.getAttribute('data-wort') === w);
  for (const w of ['HEUTE', '8', 'UHR']) k.klick(knopf(w));
  assert.equal(k.text(k.eins(k.document, 'p.funk-spruch')), 'HEUTE 8 UHR');
  for (const w of ['AM', 'HAFEN']) k.klick(knopf(w));
  assert.equal(k.text(k.eins(k.document, 'p.funk-spruch')), 'HEUTE 8 UHR AM HAFEN');
  assert.equal(knopf('BAHNHOF').disabled, true, 'würde 24 Zeichen überschreiten');
  assert.equal(knopf('UM').disabled, false);
  // erster Spruch: nur Abschnitt 1
  assert.deepEqual(k.alle(k.document, 'select.abschnitt option').map((o) => o.value), ['1']);
  // Bit-Lupe mit dem Abschnitt-Schlüssel (so lang wie der Spruch)
  k.klick(k.eins(k.document, 'button.in-bitlupe'));
  await k.ruhe();
  const L = k.wert('KRLabor');
  assert.equal(L.aktiv().zustand().ergebnisHex, '5585A82EF64C8CFB3DD68154F42326E3CBD08F26');
  k.klick(k.eins(k.document, 'button.hex-uebernehmen'));
  assert.equal(k.eins(k.document, 'input.funk-hex').value, C1);
  k.klick(k.eins(k.document, 'form.funk-otp-senden button[type="submit"]'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet[0]), { text: C1, klartext: 'HEUTE 8 UHR AM HAFEN', abschnitt: 1 });
  // zweiter Spruch: ohne Sparschwein nur Abschnitt 2
  assert.deepEqual(k.alle(k.document, 'select.abschnitt option').map((o) => o.value), ['2']);
  // Rücktaste
  k.klick(knopf('ZUG'));
  k.klick(k.eins(k.document, 'button.baustein-zurueck'));
  assert.equal(k.text(k.eins(k.document, 'p.funk-spruch')), '–');
  k.wert('KRFunkraum').stopp();

  // Sparschwein-Paar: nach dem ersten Spruch Abschnitt 1 und 2
  const s = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 10, typ: 'doppelter-schluessel', status: 'laeuft', phase: 'funken' }),
      'GET /api/funk/10/stand': { status: 200, body: otpStand(5, { team: TEAMS[0], rolle: 'alice', partner: 2, bausteine: BAUSTEINE, erneutErlaubt: true, abschnitte: [DEMO_KEY, DEMO_KEY] }, { nachrichten: [{ id: 20, von: 1, an: 2, art: 'nachricht', inhalt: C1, lesbar: true, zeit: '2026-10-13T08:00:00Z', version: 4 }], werkzeuge: OTP_ALICE }) }
    }
  });
  await s.ruhe();
  assert.deepEqual(s.alle(s.document, 'select.abschnitt option').map((o) => o.value), ['1', '2']);
  assert.match(s.text(s.eins(s.document, '.funk-sparschwein')), /Nachschub an Schlüsselstreifen ist knapp/);
  s.wert('KRFunkraum').stopp();
});

test('Doppelter Schlüssel: Eve vergleicht ein Paar in der Bit-Lupe (c1/c2), Bob entschlüsselt mit seinem Abschnitt', async () => {
  const funks = [{ id: 20, von: 1, an: 2, art: 'nachricht', inhalt: C1, lesbar: true, zeit: '2026-10-13T08:00:00Z', version: 4 }, { id: 21, von: 1, an: 2, art: 'nachricht', inhalt: C2, lesbar: true, zeit: '2026-10-13T08:01:00Z', version: 5 }];
  const eve = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 10, typ: 'doppelter-schluessel', status: 'laeuft', phase: 'lauschen' }, TEAMS[2]),
      'GET /api/funk/10/stand': { status: 200, body: otpStand(6, { team: TEAMS[2], rolle: 'eve', partner: null, bausteine: BAUSTEINE, paare: [[20, 21]] }, { phase: 'lauschen', nachrichten: funks, werkzeuge: [{ id: 'bitlupe', voreinstellung: { reiter: ['doppelnutzung', 'xor'] } }] }) },
      'POST /api/funk/10/knacken': { status: 200, body: { richtig: false } }
    }
  });
  await eve.ruhe();
  assert.equal(eve.alle(eve.document, 'ul.funk-paare li').length, 1);
  eve.klick(eve.eins(eve.document, 'ul.funk-paare button'));
  await eve.ruhe();
  assert.deepEqual(eve.roh(eve.wert('KRLabor').aktiv().zustand().statistik), { beginnen000: 16, von: 19 });
  assert.equal(eve.alle(eve.document, 'ul.funk-woerter li').length, 21, 'Wortkarten');
  assert.ok(eve.eins(eve.document, 'form.funk-knacken[data-nachricht="20"]'));
  eve.wert('KRFunkraum').stopp();

  const bob = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 10, typ: 'doppelter-schluessel', status: 'laeuft', phase: 'funken' }, TEAMS[1]),
      'GET /api/funk/10/stand': { status: 200, body: otpStand(6, { team: TEAMS[1], rolle: 'bob', partner: 1, bausteine: BAUSTEINE, erneutErlaubt: false, abschnitte: [DEMO_KEY, DEMO_KEY] }, { nachrichten: funks.slice(0, 1), werkzeuge: OTP_ALICE }) }
    }
  });
  await bob.ruhe();
  const li = bob.eins(bob.document, 'li.funk-nachricht[data-id="20"]');
  bob.klick(bob.eins(li, 'button.in-bitlupe'));
  await bob.ruhe();
  const zeichen = bob.alle(bob.document, '.funk-werkzeug[data-werkzeug="bitlupe"] tr.doppel-zeichen td').map((c) => bob.text(c)).join('').replace(/␣/g, ' ');
  assert.equal(zeichen, 'HEUTE 8 UHR AM HAFEN');
  assert.ok(bob.eins(li, 'form.funk-empfangen'));
  bob.wert('KRFunkraum').stopp();
});

test('Schlüsseltausch: Geheimzahl bleibt im Browser; öffentlich und K-Meldung senden nur Zahlen', async () => {
  const k = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 9, typ: 'schluesseltausch', status: 'laeuft', phase: 'runde-1' }),
      'GET /api/funk/9/stand': { status: 200, body: stand(4, { id: 9, typ: 'schluesseltausch', phasen: ['runde-1', 'runde-2', 'aufloesung'], anzeigen: { runde: 1, p: 23, g: 5 } }) },
      'POST /api/funk/9/oeffentlich': { status: 200, body: { ok: true } },
      'POST /api/funk/9/k-melden': { status: 200, body: { ok: true } }
    }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-parameter')), /p = 23.*g = 5/);
  k.tippe(k.eins(k.document, 'input.geheimzahl'), '7');
  assert.match(k.text(k.eins(k.document, '.funk-dh')), /Eure Geheimzahl verlässt dieses Tablet nicht/);
  k.tippe(k.eins(k.document, 'form.oeffentlich input'), '17');
  k.klick(k.eins(k.document, 'form.oeffentlich button'));
  k.tippe(k.eins(k.document, 'form.k-melden input'), '8');
  k.klick(k.eins(k.document, 'form.k-melden button'));
  await k.ruhe();
  const posts = k.anfragen.filter((a) => a.methode === 'POST');
  assert.deepEqual(posts.map((a) => [a.pfad, k.roh(a.body)]), [['/api/funk/9/oeffentlich', { wert: 17 }], ['/api/funk/9/k-melden', { k: 8 }]]);
  assert.ok(!JSON.stringify(k.roh(k.anfragen)).includes('geheim'));
  k.wert('KRFunkraum').stopp();
});

test('Schlüsseltausch: Eve sieht p, g, A, B je Paar und gibt Tipps ohne Rückmeldung ab; Modulo-Uhr nur Reiter „uhr“', async () => {
  const tipps = [];
  const kanal = [
    { id: 30, von: 1, an: 2, art: 'oeffentlich', inhalt: 'A 17', lesbar: true, zeit: '2026-10-13T08:00:00Z', version: 4 },
    { id: 31, von: 2, an: 1, art: 'oeffentlich', inhalt: 'B 4', lesbar: true, zeit: '2026-10-13T08:00:10Z', version: 5 }
  ];
  const k = D.lade(SEITE_BITLUPE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 9, typ: 'schluesseltausch', status: 'laeuft', phase: 'runde-1' }, TEAMS[2]),
      'GET /api/funk/9/stand': { status: 200, body: stand(6, { id: 9, typ: 'schluesseltausch', phasen: ['runde-1', 'runde-2', 'aufloesung'], ich: { team: TEAMS[2], rolle: 'eve', partner: null, tipps: {} }, nachrichten: kanal, ereignisse: [{ id: 1, code: 'phase', daten: { phase: 'runde-1' }, zeit: '2026-10-13T07:59:00Z', version: 2 }], anzeigen: { runde: 1, p: 23, g: 5 }, werkzeuge: [{ id: 'modulo', voreinstellung: { reiter: ['uhr'], modul: 23, g: 5 } }] }) },
      'POST /api/funk/9/knacken': (b) => {
        tipps.push(b);
        return { status: 200, body: { ok: true } };
      }
    }
  });
  await k.ruhe();
  const zeile = k.eins(k.document, 'table.funk-dh-paare tbody tr');
  assert.deepEqual(k.alle(zeile, 'td').map((c) => k.text(c)).slice(0, 4), ['23', '5', '17', '4']);
  const f = k.eins(k.document, 'form.funk-tipp[data-paar="1"]');
  k.tippe(k.eins(f, 'input'), '8');
  k.klick(k.eins(f, 'button'));
  await k.ruhe();
  assert.deepEqual(k.roh(tipps), [{ paar: 1, k: 8 }]);
  assert.match(k.text(k.eins(f, 'p.funk-ergebnis')), /Tipp gespeichert – die Auflösung zeigt, ob er stimmt/);
  assert.doesNotMatch(k.text(f), /richtig|falsch/);
  assert.deepEqual(k.alle(k.document, '.funk-werkzeug[data-werkzeug="modulo"] [role=tab]').map((t) => t.getAttribute('data-reiter')), ['uhr']);
  k.wert('KRFunkraum').stopp();
});

/* ---------- Task 154: Szene „Mallory im Netz“ ---------- */
const MTEAMS = [{ id: 1, nr: 1, name: 'Team Skytale', rolle: 'alice' }, { id: 2, nr: 2, name: 'Team Scheibe', rolle: 'bob' }, { id: 3, nr: 3, name: 'Team Quadrat', rolle: 'mallory' }];
const mStand = (v, ich, extra = {}) => stand(v, { id: 12, typ: 'mallory', titel: 'Mallory im Netz', phase: 'ohne-zertifikate', phasen: ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'], teams: MTEAMS, ich, anzeigen: {}, ...extra });

test('Mallory: Station leitet weiter, ändert einen offenen Umschlag, schiebt einen Schlüssel unter; alle weiterleiten', async () => {
  const posts = [];
  const station = [
    { id: 40, art: 'schluessel', inhalt: 'S23', lesbar: true, etikett: null, von: 2, angezeigtVon: 2, ziel: 1 },
    { id: 41, art: 'nachricht', inhalt: 'LIEFERE 5 KISTEN AN TOR 3', lesbar: true, etikett: 'S41', von: 1, angezeigtVon: 1, ziel: 2 },
    { id: 42, art: 'nachricht', inhalt: 'UMSCHLAG S23', lesbar: false, etikett: 'S23', von: 1, angezeigtVon: 1, ziel: 2 }
  ];
  const k = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 12, typ: 'mallory', status: 'laeuft', phase: 'ohne-zertifikate' }, MTEAMS[2]),
      'GET /api/funk/12/stand': { status: 200, body: mStand(5, { team: MTEAMS[2], rolle: 'mallory', partner: null, etiketten: ['S41', 'S42'], station }) },
      'POST /api/funk/12/mallory': (b) => {
        posts.push(b);
        return { status: 200, body: { ok: true, nachricht: 50 } };
      }
    }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-simulation')), /Simulation: Die Plattform verschließt die Umschläge/);
  assert.equal(k.alle(k.document, 'ol.station > li').length, 3);
  // fremder Umschlag: kein Inhalt, kein Textfeld
  const fremd = k.eins(k.document, 'ol.station > li[data-id="42"]');
  assert.doesNotMatch(k.text(fremd), /LIEFERE|TREFFEN/);
  assert.equal(k.alle(fremd, 'textarea').length, 0);
  // offener Umschlag ändern und neu verschließen
  const offen = k.eins(k.document, 'ol.station > li[data-id="41"]');
  assert.match(k.text(offen), /LIEFERE 5 KISTEN AN TOR 3/);
  assert.equal(k.eins(offen, 'textarea.funk-text').value, 'LIEFERE 5 KISTEN AN TOR 3', 'Inhalt zum Bearbeiten vorbelegt');
  k.eins(offen, 'textarea.funk-text').value = '';
  k.tippe(k.eins(offen, 'textarea.funk-text'), 'liefere 5 kisten an tor 8');
  k.waehle(k.eins(offen, 'select.neu-verschliessen'), 'S23');
  k.klick(k.eins(offen, 'button.ersetzen'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts.at(-1)), { aktion: 'ersetzen', nachricht: 41, text: 'LIEFERE 5 KISTEN AN TOR 8', etikett: 'S23' });
  // Schlüssel: Nummer ersetzen
  const sch = k.eins(k.document, 'ol.station > li[data-id="40"]');
  k.waehle(k.eins(sch, 'select.etikett-ersetzen'), 'S42');
  k.klick(k.eins(sch, 'button.ersetzen'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts.at(-1)), { aktion: 'ersetzen', nachricht: 40, etikett: 'S42' });
  k.klick(k.eins(fremd, 'button.weiterleiten'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts.at(-1)), { aktion: 'weiterleiten', nachricht: 42 });
  // Schlüssel unterschieben (Phase 1: nur ohne Zertifikat)
  const f = k.eins(k.document, 'form.schluessel-unterschieben');
  assert.deepEqual(k.alle(f, 'select.zertifikat-art option').map((o) => o.value), ['keins']);
  k.waehle(k.eins(f, 'select.an'), '1');
  k.waehle(k.eins(f, 'select.etikett'), 'S41');
  k.klick(k.eins(f, 'button[type="submit"]'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts.at(-1)), { aktion: 'schluessel', an: 1, etikett: 'S41', zertifikat: 'keins' });
  const vorher = posts.length;
  k.klick(k.eins(k.document, 'button.alle-weiterleiten'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts.slice(vorher)).map((p) => [p.aktion, p.nachricht]), [['weiterleiten', 40], ['weiterleiten', 41], ['weiterleiten', 42]]);
  k.wert('KRFunkraum').stopp();
});

test('Mallory: Alice sieht Zertifikatsstatus mit Symbol und Text, sendet die Auftragskarte; Bob sieht fremde Umschläge nicht', async () => {
  const posts = [];
  const schluessel = [
    { nachricht: 50, etikett: 'S23', von: 2, phase: 'mit-zertifikaten', zertifikat: { status: 'gueltig', text: 'ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE' } },
    { nachricht: 51, etikett: 'S41', von: 2, phase: 'mit-zertifikaten', zertifikat: { status: 'siegel', text: 'ZERTIFIKAT TEAM SCHEIBE S41 GUELTIG HEUTE' } },
    { nachricht: 52, etikett: 'S42', von: 2, phase: 'mit-zertifikaten', zertifikat: { status: 'name', text: 'ZERTIFIKAT TEAM QUADRAT S42 GUELTIG HEUTE' } },
    { nachricht: 53, etikett: 'S42', von: 2, phase: 'mit-zertifikaten', zertifikat: { status: 'fehlt' } }
  ];
  const k = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 12, typ: 'mallory', status: 'laeuft', phase: 'mit-zertifikaten' }, MTEAMS[0]),
      'GET /api/funk/12/stand': { status: 200, body: mStand(8, { team: MTEAMS[0], rolle: 'alice', partner: 2, auftrag: 'TREFFEN UM 14 UHR AM HAFEN', schluessel }, { phase: 'mit-zertifikaten' }) },
      'POST /api/funk/12/nachrichten': (b) => {
        posts.push(b);
        return { status: 200, body: { nachricht: { id: 60 } } };
      }
    }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, 'p.auftragskarte')), /TREFFEN UM 14 UHR AM HAFEN/);
  const li = (id) => k.eins(k.document, `ul.schluessel-angebote li[data-nachricht="${id}"]`);
  assert.match(k.text(li(50)), /✓.*Siegel gültig, Name passt/);
  assert.match(k.text(li(51)), /✗.*Siegel ungültig/);
  assert.match(k.text(li(52)), /✗.*Name passt nicht: ZERTIFIKAT TEAM QUADRAT S42/);
  assert.match(k.text(li(53)), /✗.*kein gültiges Zertifikat/);
  k.klick(k.eins(li(50), 'button.umschlag-senden[data-etikett="S23"]'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts), [{ etikett: 'S23' }]);
  // roter Status in Phase 2 fragt nach – Abbrechen sendet nichts
  k.bestaetigen = false;
  k.klick(k.eins(li(51), 'button.umschlag-senden'));
  await k.ruhe();
  assert.equal(posts.length, 1);
  k.bestaetigen = true;
  k.klick(k.eins(li(51), 'button.umschlag-senden'));
  await k.ruhe();
  assert.deepEqual(k.roh(posts[1]), { etikett: 'S41' });
  k.wert('KRFunkraum').stopp();

  const meld = [];
  const bob = D.lade(SEITE, {
    url: 'http://x.test/funkraum',
    fetch: {
      'GET /api/sitzung': SITZUNG,
      'GET /api/funk': funk({ id: 12, typ: 'mallory', status: 'laeuft', phase: 'ohne-zertifikate' }, MTEAMS[1]),
      'GET /api/funk/12/stand': { status: 200, body: mStand(8, { team: MTEAMS[1], rolle: 'bob', partner: 1, etikett: 'S23', zertifikat: null }, { nachrichten: [{ id: 70, von: 3, an: 2, angezeigtVon: 1, art: 'nachricht', inhalt: 'UMSCHLAG S41', lesbar: false, angekommen: false, geknackt: false, zeit: '2026-10-13T08:00:00Z', version: 6 }, { id: 71, von: 3, an: 2, angezeigtVon: 1, art: 'nachricht', inhalt: 'LIEFERE 5 KISTEN AN TOR 8', lesbar: true, angekommen: false, geknackt: false, zeit: '2026-10-13T08:00:00Z', version: 7 }] }) },
      'POST /api/funk/12/oeffentlich': (b) => {
        meld.push(['oeffentlich', b]);
        return { status: 200, body: { ok: true } };
      },
      'POST /api/funk/12/empfangen': (b) => {
        meld.push(['empfangen', b]);
        return { status: 200, body: { ok: true } };
      }
    }
  });
  await bob.ruhe();
  assert.match(bob.text(bob.eins(bob.document, '.funk-bob-nummer')), /S23/);
  const zu = bob.eins(bob.document, 'li.funk-nachricht[data-id="70"]');
  assert.match(bob.text(zu), /Umschlag für S41 – du kannst ihn nicht öffnen/);
  assert.equal(bob.alle(zu, 'button.auftrag-melden').length, 0);
  bob.klick(bob.eins(bob.document, 'button.schluessel-veroeffentlichen'));
  bob.klick(bob.eins(bob.document, 'li.funk-nachricht[data-id="71"] button.auftrag-melden'));
  await bob.ruhe();
  assert.deepEqual(bob.roh(meld), [['oeffentlich', {}], ['empfangen', { nachricht: 71 }]]);
  bob.wert('KRFunkraum').stopp();
});
