'use strict';
// Lehrkraft-Tabs „Teams“ und „Funkraum“ (Plan M7 Tasks 149, 150) im Attrappen-DOM.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const NAMEN = ['Team Skytale', 'Team Scheibe', 'Team Quadrat', 'Team Lochstreifen', 'Team Enigma', 'Team Schlüsselpaar', 'Team Siegel', 'Team Chronoskop', 'Team Tafel', 'Team Manuskript', 'Team Lochkarte', 'Team Kompass'];
const LEHRER = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js', 'krypto/lehrer.js', 'krypto/funkpoll.js', 'krypto/lehrer_funkraum.js'];
const KURS = { id: 5, kurs: 'k:17', name: 'LK 13 (eA)', aktiv: true, einstellungen: { welten: [9], niveau: 'eA', werkzeuge: {} } };
const TEAMS = { teams: [{ id: 1, nr: 1, name: 'Team Skytale', mitglieder: [{ id: 11, name: 'Mika R.' }] }], ohneTeam: [{ id: 12, name: 'Ida K.' }, { id: 13, name: 'Ole B.' }], namen: NAMEN };
const seiteLehrer = (k) => k.document.body.classList.add('seite-lehrer');
const GRUND = (kurs = KURS) => ({
  'GET /api/sitzung': { status: 200, body: { rolle: 'lehrkraft', name: 'Frau M.', kurse: [] } },
  'GET /api/lehrer/kurse': { status: 200, body: [kurs] },
  'GET /api/lehrer/kurse/5': { status: 200, body: kurs }
});

test('verteile: alphabetisch, reihum, Namen in Listenreihenfolge', () => {
  const k = D.lade(LEHRER);
  const v = k.roh(k.wert('KRLehrerFunk').verteile([{ id: 3, name: 'Ole B.' }, { id: 1, name: 'Ida K.' }, { id: 2, name: 'Mika R.' }, { id: 4, name: 'Nia T.' }], 2, NAMEN));
  assert.deepEqual(v, [{ nr: 1, name: 'Team Skytale', mitglieder: [1, 4] }, { nr: 2, name: 'Team Scheibe', mitglieder: [2, 3] }]);
  // Grenzen: 2–12 Teams, nie mehr Teams als Schülerinnen und Schüler (keine leeren Tischgruppen)
  const f = k.wert('KRLehrerFunk');
  assert.equal(k.roh(f.verteile([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], 20, NAMEN)).length, 3);
  assert.equal(k.roh(f.verteile([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], 1, NAMEN)).length, 2);
  assert.deepEqual(k.roh(f.verteile([], 3, NAMEN)), []);
});

test('Teams-Tab: Zuteilen, Speichern sendet den Sollstand, 409 zeigt die Meldung', async () => {
  let gesendet = null;
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/teams', vorher: seiteLehrer,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS },
      'PUT /api/lehrer/kurse/5/teams': (b) => {
        gesendet = b;
        return gesendet.teams.length === 0 ? { status: 409, body: { error: 'Team Skytale spielt gerade im Funkraum.' } } : { status: 200, body: TEAMS };
      }
    }
  });
  await k.ruhe();
  const sel = k.eins(k.document, 'select.zuteilen[data-id="12"]');
  k.waehle(sel, '1');
  k.klick(k.eins(k.document, 'button.teams-speichern'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet), { teams: [{ nr: 1, name: 'Team Skytale', mitglieder: [11, 12] }] });
  k.klick(k.eins(k.document, 'button.team-entfernen'));
  k.klick(k.eins(k.document, 'button.teams-speichern'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet), { teams: [] });
  assert.match(k.text(k.eins(k.document, 'p.fehler')), /spielt gerade im Funkraum/);
  assert.equal(k.eins(k.document, 'p.fehler').getAttribute('role'), 'alert');
});

test('Teams-Tab: Name wählen (vergebene deaktiviert), Mitglied entfernen, neues Team, automatisch verteilen', async () => {
  let gesendet = null;
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/teams', vorher: seiteLehrer,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS },
      'PUT /api/lehrer/kurse/5/teams': (b) => {
        gesendet = b;
        return { status: 200, body: TEAMS };
      }
    }
  });
  await k.ruhe();
  // Mitglied-Chip entfernt Mika aus dem Team → erscheint unter „ohne Team“
  k.klick(k.eins(k.document, 'button.mitglied[data-id="11"]'));
  assert.ok(k.eins(k.document, 'select.zuteilen[data-id="11"]'));
  // neues Team: nächste freie Nummer und nächster freier Name
  k.klick(k.eins(k.document, 'button.team-neu'));
  const namen = k.alle(k.document, 'select.team-name');
  assert.equal(namen.length, 2);
  assert.equal(namen[1].value, 'Team Scheibe');
  const deaktiviert = k.alle(namen[1], 'option').filter((o) => o.disabled).map((o) => o.value);
  assert.deepEqual(deaktiviert, ['Team Skytale'], 'vom anderen Team vergebener Name ist deaktiviert');
  k.waehle(namen[1], 'Team Enigma');
  k.waehle(k.eins(k.document, 'select.zuteilen[data-id="13"]'), '2');
  k.klick(k.eins(k.document, 'button.teams-speichern'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet), { teams: [{ nr: 1, name: 'Team Skytale', mitglieder: [] }, { nr: 2, name: 'Team Enigma', mitglieder: [13] }] });
  // automatisch verteilen: alle drei auf zwei Teams
  const anzahl = k.eins(k.document, 'input.verteilen-anzahl');
  k.tippe(anzahl, '2');
  k.klick(k.eins(k.document, 'button.verteilen'));
  assert.equal(k.alle(k.document, 'ul.ohne-team li').length, 0);
  assert.match(k.text(k.eins(k.document, '.teams-ungespeichert')), /Ungespeicherte Änderungen/);
  k.klick(k.eins(k.document, 'button.teams-speichern'));
  await k.ruhe();
  assert.deepEqual(k.roh(gesendet), { teams: [{ nr: 1, name: 'Team Skytale', mitglieder: [12, 13] }, { nr: 2, name: 'Team Scheibe', mitglieder: [11] }] });
  assert.equal(k.alle(k.document, '.teams-ungespeichert').length, 0, 'nach dem Speichern Stand des Servers');
});

test('Teams-Tab: gesperrter Kurs nur lesend', async () => {
  const gesperrt = { ...KURS, aktiv: false };
  const k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/5/teams', vorher: seiteLehrer, fetch: { ...GRUND(gesperrt), 'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS } } });
  await k.ruhe();
  for (const sel of ['button.teams-speichern', 'button.team-neu', 'button.verteilen', 'button.team-entfernen', 'select.team-name', 'select.zuteilen', 'button.mitglied']) {
    for (const el of k.alle(k.document, sel)) assert.ok(el.disabled, sel);
  }
  assert.match(k.text(k.eins(k.document, '.tab-inhalt')), /nur lesbar/);
});

/* ---------- Task 150: Funkraum-Regie ---------- */
const DREI = { ...TEAMS, teams: [1, 2, 3].map((nr) => ({ id: nr, nr, name: NAMEN[nr - 1], mitglieder: [{ id: 10 + nr, name: 'X' }] })), ohneTeam: [] };

test('Funkraum-Regie: Anlegen sendet Typ und Rollen; Beenden fragt nach; Ausblenden ruft die Route', async () => {
  const aufrufe = [];
  let zustand = null;
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
      'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: zustand } }),
      'POST /api/lehrer/kurse/5/funk': (b) => {
        aufrufe.push(['anlegen', b]);
        zustand = { id: 7, typ: b.typ, status: 'vorbereitung', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], rollen: [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'eve' }] };
        return { status: 200, body: zustand };
      },
      'POST /api/lehrer/funk/7/status': (b) => {
        aufrufe.push(['status', b.aktion]);
        zustand = { ...zustand, status: b.aktion === 'starten' ? 'laeuft' : 'auswertung' };
        return { status: 200, body: zustand };
      },
      'GET /api/lehrer/funk/7/stand': () => ({ status: 200, body: { ...zustand, version: 3, nachrichten: [{ id: 11, von: 1, an: 2, art: 'nachricht', inhalt: 'OHSAL', lesbar: true }], ereignisse: [], teams: [], anzeigen: {} } }),
      'POST /api/lehrer/funk/7/nachrichten/11/ausblenden': () => {
        aufrufe.push(['ausblenden', 11]);
        return { status: 200, body: { ok: true } };
      }
    }
  });
  await k.ruhe();
  assert.equal(k.alle(k.document, 'article.szenario-wahl').length, 5);
  k.klick(k.eins(k.document, 'article.szenario-wahl[data-typ="botenlauf"] button'));
  await k.ruhe();
  assert.equal(k.alle(k.document, 'table.rollen select.rolle').length, 3);
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="starten"]'));
  await k.ruhe();
  k.klick(k.eins(k.document, 'button.ausblenden[data-id="11"]'));
  await k.ruhe();
  k.bestaetigen = false;
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="beenden"]'));
  await k.ruhe();
  assert.deepEqual(aufrufe.map((a) => (a[0] === 'anlegen' ? a[1].typ : a[1])), ['botenlauf', 'starten', 11]);
  assert.equal(k.eins(k.document, 'a.beamer-oeffnen').getAttribute('href'), '/beamer/funkraum/7');
  assert.equal(k.eins(k.document, 'a.beamer-oeffnen').getAttribute('rel'), 'noopener');
  // mit Bestätigung wird beendet
  k.bestaetigen = true;
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="beenden"]'));
  await k.ruhe();
  assert.deepEqual(aufrufe[aufrufe.length - 1], ['status', 'beenden']);
});

test('Funkraum-Regie pollt (Task 151): ETag und seit, Delta wird zusammengeführt, 304 zeichnet nicht neu, Szenario weg → Auswahl', async () => {
  let n = 0;
  let weg = false;
  const beobachtet = {};
  const LAUF = { id: 7, typ: 'botenlauf', titel: 'Botenlauf', status: 'laeuft', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], rollen: [{ teamId: 1, team: 'Team Skytale', rolle: 'alice', partnerId: 2 }, { teamId: 2, team: 'Team Scheibe', rolle: 'bob', partnerId: 1 }, { teamId: 3, team: 'Team Quadrat', rolle: 'eve', partnerId: null }], teams: [], anzeigen: {}, optionen: {}, stumm: {} };
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    zeitraffer: 1000,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
      'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: weg ? null : { id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' } } }),
      'GET /api/lehrer/funk/7/stand': (b, { query, headers }) => {
        n++;
        assert.equal(query.ansicht, 'regie');
        if (n === 1) {
          assert.equal(query.seit, '0');
          return { status: 200, headers: { etag: '"7-3"' }, body: { ...LAUF, version: 3, nachrichten: [{ id: 11, von: 1, an: 2, art: 'nachricht', inhalt: 'OHSAL', lesbar: true }], ereignisse: [{ id: 1, code: 'status', daten: { status: 'laeuft' }, zeit: '2026-10-13T08:00:00Z', version: 2 }] } };
        }
        if (n === 2) {
          assert.equal(query.seit, '3');
          assert.equal(headers['If-None-Match'], '"7-3"');
          beobachtet.vor304 = k.document.getElementById('haupt').querySelector('.funk-regie');
          return { status: 304 };
        }
        if (n === 3) {
          beobachtet.nach304 = k.document.getElementById('haupt').querySelector('.funk-regie');
          return { status: 200, headers: { etag: '"7-4"' }, body: { ...LAUF, version: 4, nachrichten: [{ id: 12, von: 2, an: 1, art: 'nachricht', inhalt: 'QUITT', lesbar: true }], ereignisse: [] } };
        }
        beobachtet.nachrichten = k.alle(k.document, 'li.regie-nachricht').map((li) => li.getAttribute('data-id'));
        weg = true;
        return { status: 404, body: { error: 'Szenario nicht gefunden.' } };
      }
    }
  });
  await k.ruhe();
  assert.ok(n >= 4);
  assert.equal(beobachtet.vor304, beobachtet.nach304, '304: Regie bleibt stehen');
  assert.deepEqual(beobachtet.nachrichten, ['12', '11'], 'Delta zusammengeführt');
  assert.equal(k.alle(k.document, 'article.szenario-wahl').length, 5, 'nach 404 wieder die Auswahl');
  assert.ok(k.timer.some((t) => t.ms === 3000));
});

test('Funkraum-Regie: zu wenige Teams → Hinweis mit Link auf den Teams-Tab', async () => {
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    fetch: { ...GRUND(), 'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS }, 'GET /api/lehrer/kurse/5/funk': { status: 200, body: { szenario: null } } }
  });
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.tab-inhalt')), /Bitte zuerst Teams einteilen/);
  assert.ok(k.eins(k.document, 'a[href="#/kurs/5/teams"]'));
  // Wettknacken braucht 2 Teams, alle übrigen 3: mit einem Team ist jedes Anlegen gesperrt
  for (const b of k.alle(k.document, 'article.szenario-wahl button')) assert.ok(b.disabled);
});

test('Funkraum-Regie: Rollen tauschen (PUT), Phase, Stumm, Beenden mit Auswertung, Schließen', async () => {
  const aufrufe = [];
  let zustand = { id: 8, typ: 'doppelter-schluessel', status: 'vorbereitung', phase: 'funken', phasen: ['funken', 'lauschen', 'aufloesung'], rollen: [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'eve', partnerId: null }], optionen: {} };
  let anzeigen = {};
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
      'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: zustand } }),
      'PUT /api/lehrer/funk/8/rollen': (b) => {
        aufrufe.push(['rollen', b.rollen]);
        zustand = { ...zustand, rollen: b.rollen };
        return { status: 200, body: zustand };
      },
      'POST /api/lehrer/funk/8/status': (b) => {
        aufrufe.push(['status', b.aktion]);
        if (b.aktion === 'schliessen') {
          zustand = null;
          return { status: 200, body: { geschlossen: true } };
        }
        zustand = { ...zustand, status: { starten: 'laeuft', phase: 'laeuft', beenden: 'auswertung' }[b.aktion], phase: b.aktion === 'phase' ? 'lauschen' : zustand.phase };
        return { status: 200, body: zustand };
      },
      'GET /api/lehrer/funk/8/stand': () => ({ status: 200, body: { ...zustand, version: 4, nachrichten: [], ereignisse: [{ id: 1, code: 'phase', daten: { phase: 'funken' }, zeit: '2026-10-13T08:00:00Z', version: 2 }], teams: DREI.teams.map((t) => ({ id: t.id, nr: t.nr, name: t.name })), anzeigen, auswertung: zustand.status === 'auswertung' ? { sprueche: [{ nachricht: 1, team: 1, abschnitt: 1, geknackt: true }], vergleiche: [], eveGewinnt: true } : null } }),
      'POST /api/lehrer/funk/8/teams/1/stumm': (b) => {
        aufrufe.push(['stumm', b.sekunden]);
        return { status: 200, body: { ok: true } };
      }
    }
  });
  await k.ruhe();
  // Rollen tauschen: Team 3 nimmt nicht teil → PUT ohne Team 3
  k.waehle(k.eins(k.document, 'select.rolle[data-team="3"]'), '');
  k.klick(k.eins(k.document, 'button.rollen-speichern'));
  await k.ruhe();
  assert.deepEqual(k.roh(aufrufe[0]), ['rollen', [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }]]);
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="starten"]'));
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-regie')), /Nächste Phase: Lauschen/);
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="phase"]'));
  await k.ruhe();
  assert.equal(k.alle(k.document, 'button.stumm[data-team="3"]').length, 0, 'Team ohne Rolle: kein Stumm-Knopf');
  k.klick(k.eins(k.document, 'button.stumm[data-team="1"]'));
  await k.ruhe();
  k.bestaetigen = true;
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="beenden"]'));
  await k.ruhe();
  assert.ok(k.eins(k.document, 'table.auswertung-funk'), 'Auswertungstabelle');
  k.klick(k.eins(k.document, 'button.aktion[data-aktion="schliessen"]'));
  await k.ruhe();
  assert.deepEqual(aufrufe.slice(1).map((a) => a[1]), ['starten', 'phase', 60, 'beenden', 'schliessen']);
  assert.equal(k.alle(k.document, 'article.szenario-wahl').length, 5, 'nach dem Schließen wieder die Auswahl');
});

test('Funkraum-Regie: Wettknacken-Hinweise und Fortschritt, Mallory-Station und Zertifikat', async () => {
  const aufrufe = [];
  const lauf = (typ, phase, phasen, rollen, anzeigen, ereignisse = []) => ({ id: 9, typ, status: 'laeuft', phase, phasen, rollen, optionen: {}, version: 5, nachrichten: [], ereignisse, teams: DREI.teams.map((t) => ({ id: t.id, nr: t.nr, name: t.name })), anzeigen });
  let stand = lauf('wettknacken', 'knacken', ['knacken', 'aufloesung'], [1, 2, 3].map((i) => ({ teamId: i, rolle: 'knacker', partnerId: null })), { fortschritt: [{ team: 1, anteil: 0.42, fertig: false, platz: null }, { team: 2, anteil: 0.96, fertig: true, platz: 1 }] }, [{ id: 3, code: 'hinweis', daten: { nr: 1 }, zeit: '2026-10-13T08:00:00Z', version: 4 }]);
  const fetch = {
    ...GRUND(),
    'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
    'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: stand } }),
    'GET /api/lehrer/funk/9/stand': () => ({ status: 200, body: stand }),
    'POST /api/lehrer/funk/9/hinweis': (b) => (aufrufe.push(['hinweis', b.nr]), { status: 200, body: { ok: true } }),
    'POST /api/lehrer/funk/9/station': () => (aufrufe.push(['station']), { status: 200, body: { weitergeleitet: 2 } }),
    'POST /api/lehrer/funk/9/zertifikat': (b) => (aufrufe.push(['zertifikat', b]), { status: 200, body: { ok: true, text: 'ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE' } })
  };
  let k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/5/funkraum', vorher: seiteLehrer, fetch });
  await k.ruhe();
  assert.ok(k.eins(k.document, 'button.hinweis[data-nr="1"]').disabled, 'Hinweis 1 schon gesendet');
  k.klick(k.eins(k.document, 'button.hinweis[data-nr="2"]'));
  await k.ruhe();
  assert.match(k.text(k.eins(k.document, '.funk-fortschritt')), /42 %/);
  assert.match(k.text(k.eins(k.document, '.funk-fortschritt')), /Platz 1/);
  stand = lauf('mallory', 'mit-zertifikaten', ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'], [{ teamId: 1, rolle: 'alice', partnerId: 2 }, { teamId: 2, rolle: 'bob', partnerId: 1 }, { teamId: 3, rolle: 'mallory', partnerId: null }], {});
  k = D.lade(LEHRER, { url: 'http://x.test/lehrer#/kurs/5/funkraum', vorher: seiteLehrer, fetch });
  await k.ruhe();
  k.klick(k.eins(k.document, 'button.station-leeren'));
  await k.ruhe();
  const form = k.eins(k.document, 'form.zertifikat');
  assert.equal(k.eins(form, 'input.zertifikat-etikett').value, 'S23', 'Schlüsselnummer des ersten Bob-Teams vorbelegt');
  k.klick(k.eins(form, 'button.zertifikat-ausstellen'));
  await k.ruhe();
  assert.deepEqual(k.roh(aufrufe), [['hinweis', 2], ['station'], ['zertifikat', { teamId: 2, etikett: 'S23', ausstellen: true }]]);
  assert.match(k.text(k.eins(k.document, '.tab-inhalt')), /ZERTIFIKAT TEAM SCHEIBE S23 GUELTIG HEUTE/);
});

test('Funkraum-Regie: Szenario-Liste des Clients = SZENARIEN des Servers; Sparschwein-Auswahl nur Alice-Teams', async () => {
  const S = require('../src/krypto/funkraum/szenarien');
  const k = D.lade(LEHRER);
  const C = k.roh(k.wert('KRLehrerFunk').SZENARIEN);
  assert.deepEqual(Object.keys(C), S.TYPEN);
  for (const typ of S.TYPEN) {
    const { titel, welt, ds, teamsMin, phasen } = S.SZENARIEN[typ];
    assert.deepEqual({ titel: C[typ].titel, welt: C[typ].welt, ds: C[typ].ds, teamsMin: C[typ].teamsMin, phasen: C[typ].phasen }, { titel, welt, ds, teamsMin, phasen: [...phasen] }, typ);
    for (let n = 2; n <= 12; n++) {
      const teams = Array.from({ length: n }, (_, i) => ({ id: 11 + i, nr: i + 1 }));
      assert.deepEqual(k.roh(k.wert('KRLehrerFunk').vorschlag(typ, teams)), S.rollenVorschlag(typ, teams), `${typ} ${n}`);
    }
  }
  let gesendet = null;
  const k2 = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    fetch: { ...GRUND(), 'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI }, 'GET /api/lehrer/kurse/5/funk': { status: 200, body: { szenario: null } }, 'POST /api/lehrer/kurse/5/funk': (b) => ((gesendet = b), { status: 400, body: { error: 'Test' } }) }
  });
  await k2.ruhe();
  const wahl = k2.eins(k2.document, 'select.option-wiederholer');
  assert.deepEqual(k2.alle(wahl, 'option').map((o) => o.value), ['', '1']);
  k2.waehle(wahl, '1');
  k2.klick(k2.eins(k2.document, 'article.szenario-wahl[data-typ="doppelter-schluessel"] button.knopf-primaer'));
  await k2.ruhe();
  assert.deepEqual(k2.roh(gesendet), { typ: 'doppelter-schluessel', optionen: { wiederholerTeamId: 1 } });
  assert.match(k2.text(k2.eins(k2.document, 'p.fehler')), /Test/);
});

/* ---------- Task 158: Tab „Arena“ ---------- */
const LEHRER_ARENA = [...LEHRER, 'shared/krypto.js', 'krypto/diagnose_chips.js', 'krypto/lehrer_arena.js'];
const TEAMS3 = { teams: [1, 2, 3].map((i) => ({ id: i, nr: i, name: NAMEN[i - 1], mitglieder: [{ id: 10 + i, name: `S${i}` }] })), ohneTeam: [], namen: NAMEN };
const REGIE = (status, extra = {}) => ({ id: 4, kursId: 5, status, angriffBis: null, createdAt: '2026-10-13T08:00:00Z', geschlossenAt: null, chiffren: 2, ...extra });
const LK_CHIFFRE = (id, team, extra = {}) => ({
  id,
  team,
  name: id === 1 ? 'FUNKGITTER' : null,
  stufen: [{ typ: 'vigenere', kuerzel: 'VIG', param: { schluessel: 'geheim' } }],
  schluesselFelder: [],
  beschreibung: `Beschreibung ${team.name}`,
  geheimtext: 'MRESE IEAUI',
  klartextLaenge: 167,
  geknackt: false,
  versuche: 0,
  eigene: false,
  hinweise: [{ p: 'P8', text: 'Stufen 1 und 2 verschmelzen.' }],
  geknacktVon: [],
  geknacktNachSek: null,
  beurteilung: null,
  versucheJeTeam: {},
  ...extra
});
function ladeArenaTab(regie, ansicht, routen = {}) {
  return D.lade(LEHRER_ARENA, {
    url: 'http://x.test/lehrer#/kurs/5/arena',
    vorher: seiteLehrer,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: TEAMS3 },
      'GET /api/lehrer/kurse/5/arena': { status: 200, body: { arena: regie } },
      'GET /api/lehrer/arena/4': { status: 200, body: ansicht },
      ...routen
    }
  });
}

test('Arena-Tab: ohne Arena „Arena anlegen“; Werkstatt zeigt eingereichte Chiffren, Start sendet angriffBis = jetzt + 25 min', async () => {
  let angelegt = 0;
  const k = ladeArenaTab(null, null, { 'POST /api/lehrer/kurse/5/arena': () => (angelegt++, { status: 200, body: REGIE('werkstatt', { chiffren: 0 }) }) });
  await k.ruhe();
  assert.match(k.text(k.document.body), /Teams/);
  k.klick(k.eins(k.document, 'button.arena-anlegen'));
  await k.ruhe();
  assert.equal(angelegt, 1);

  const phasen = [];
  const w = ladeArenaTab(REGIE('werkstatt'), { ...REGIE('werkstatt'), chiffren: [LK_CHIFFRE(1, { id: 1, name: 'Team Skytale' }), LK_CHIFFRE(2, { id: 2, name: 'Team Scheibe' })] }, {
    'POST /api/lehrer/arena/4/phase': (b) => (phasen.push(b), { status: 200, body: REGIE('angriff', { angriffBis: b.angriffBis }) })
  });
  await w.ruhe();
  const liste = w.text(w.eins(w.document, '.lk-arena-chiffren'));
  assert.match(liste, /Team Skytale/);
  assert.match(liste, /FUNKGITTER/);
  assert.match(liste, /VIG/);
  assert.match(liste, /Beschreibung Team Skytale/);
  assert.match(liste, /P8/);
  assert.equal(w.eins(w.document, 'input.dauer').value, '25');
  const vor = Date.now();
  w.klick(w.eins(w.document, 'button.angriff-starten'));
  await w.ruhe();
  assert.equal(phasen.length, 1);
  assert.equal(phasen[0].phase, 'angriff');
  const bis = Date.parse(phasen[0].angriffBis);
  assert.ok(bis >= vor + 25 * 60e3 - 1000 && bis <= Date.now() + 25 * 60e3 + 1000, 'jetzt + 25 min');
  // Link zum Beamer und QR zur Werkstatt
  assert.equal(w.eins(w.document, 'a.beamer-oeffnen').getAttribute('href'), '/beamer/arena/4');
  assert.equal(w.eins(w.document, 'img.arena-qr').getAttribute('src'), '/api/lehrer/qr.svg?ziel=werkstatt');
});

test('Arena-Tab: Versuche-Matrix, Beurteilungen gesammelt, Beenden/Schließen/Löschen mit Bestätigung', async () => {
  const aufrufe = [];
  const ansicht = {
    ...REGIE('beurteilung'),
    chiffren: [
      LK_CHIFFRE(1, { id: 1, name: 'Team Skytale' }, { geknackt: true, geknacktVon: [{ id: 2, name: 'Team Scheibe' }], geknacktNachSek: 70, versuche: 3, versucheJeTeam: { 2: { gesamt: 2, erfolg: 1 }, 3: { gesamt: 1, erfolg: 0 } }, beurteilung: 'Insgesamt ist unser Verfahren stark, weil …' }),
      LK_CHIFFRE(2, { id: 2, name: 'Team Scheibe' }, { beurteilung: null })
    ]
  };
  const k = ladeArenaTab(REGIE('beurteilung'), ansicht, {
    'POST /api/lehrer/arena/4/phase': (b) => (aufrufe.push(['phase', b]), { status: 200, body: REGIE('geschlossen') }),
    'DELETE /api/lehrer/arena/4': () => (aufrufe.push(['loeschen']), { status: 200, body: { ok: true } })
  });
  await k.ruhe();
  const matrix = k.eins(k.document, 'table.arena-matrix');
  const zeile = (team) => k.alle(matrix, 'tbody tr').find((tr) => k.text(tr.querySelector('th')) === team);
  assert.deepEqual(k.alle(zeile('Team Scheibe'), 'td').map((td) => k.text(td)), ['2 · geknackt ✓', 'eigene']);
  assert.deepEqual(k.alle(zeile('Team Quadrat'), 'td').map((td) => k.text(td)), ['1', '0']);
  assert.deepEqual(k.alle(zeile('Team Skytale'), 'td').map((td) => k.text(td)), ['eigene', '0']);
  const b = k.text(k.eins(k.document, 'section.beurteilungen'));
  assert.match(b, /Insgesamt ist unser Verfahren stark/);
  assert.match(b, /Team Scheibe.*noch keine Beurteilung/);
  k.bestaetigen = true;
  k.klick(k.eins(k.document, 'button.arena-schliessen'));
  await k.ruhe();
  assert.deepEqual(k.roh(aufrufe[0]), ['phase', { phase: 'geschlossen' }]);
  k.bestaetigen = undefined;
  k.klick(k.eins(k.document, 'button.arena-loeschen'));
  await k.ruhe();
  const dialog = k.eins(k.document, 'dialog');
  assert.match(k.text(dialog), /Alle Chiffren, Beurteilungen und Versuche werden gelöscht\./);
  k.klick(k.eins(dialog, '.btn-row button'));
  await k.ruhe();
  assert.deepEqual(k.roh(aufrufe.at(-1)), ['loeschen']);
});

test('Review M7 K1: gesperrter Kurs – Arena löschen und Funkraum schließen bleiben bedienbar, alles andere gesperrt', async () => {
  const gesperrt = { ...KURS, aktiv: false };
  const a = ladeArenaTab(REGIE('geschlossen'), { ...REGIE('geschlossen'), chiffren: [] }, { ...GRUND(gesperrt) });
  await a.ruhe();
  assert.equal(a.eins(a.document, 'button.arena-loeschen').disabled, false);
  const neu = a.eins(a.document, 'button.arena-anlegen');
  assert.ok(!neu || neu.disabled, 'Neue Arena anlegen bleibt gesperrt');

  const AUS = { id: 7, typ: 'botenlauf', titel: 'Botenlauf', version: 9, status: 'auswertung', phase: 'aufloesung', phasen: [], rollen: [], teams: [], nachrichten: [], ereignisse: [], anzeigen: {}, optionen: {}, stumm: {}, auswertung: { zeilen: [], je: {} } };
  const k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    fetch: {
      ...GRUND(gesperrt),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
      'GET /api/lehrer/kurse/5/funk': { status: 200, body: { szenario: { id: 7, typ: 'botenlauf', status: 'auswertung', phase: 'aufloesung' } } },
      'GET /api/lehrer/funk/7/stand': { status: 200, headers: { etag: '"7-9"' }, body: AUS }
    }
  });
  await k.ruhe();
  assert.equal(k.eins(k.document, 'button[data-aktion="schliessen"]').disabled, false);
  k.wert('KRPoll'); // geladen
});

test('Review M7 W4: Regie-Polling – Fokus auf einem Knopf bleibt, Live-Regionen bleiben dieselben Knoten', async () => {
  let n = 0;
  const beob = {};
  let k = null;
  const LAUF = { id: 7, typ: 'botenlauf', titel: 'Botenlauf', status: 'laeuft', phase: 'runde-1', phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'], rollen: [{ teamId: 1, team: 'Team Skytale', rolle: 'alice', partnerId: 2 }, { teamId: 2, team: 'Team Scheibe', rolle: 'bob', partnerId: 1 }, { teamId: 3, team: 'Team Quadrat', rolle: 'eve', partnerId: null }], teams: [], anzeigen: {}, optionen: {}, stumm: {} };
  const N11 = { id: 11, von: 1, an: 2, art: 'nachricht', inhalt: 'OHSAL', lesbar: true };
  const knopf = () => k.document.getElementById('haupt').querySelector('button.ausblenden[data-id="11"]');
  const region = (sel) => k.document.getElementById('haupt').querySelector(sel);
  k = D.lade(LEHRER, {
    url: 'http://x.test/lehrer#/kurs/5/funkraum',
    vorher: seiteLehrer,
    zeitraffer: 1000,
    fetch: {
      ...GRUND(),
      'GET /api/lehrer/kurse/5/teams': { status: 200, body: DREI },
      'GET /api/lehrer/kurse/5/funk': () => ({ status: 200, body: { szenario: n >= 3 ? null : { id: 7, typ: 'botenlauf', status: 'laeuft', phase: 'runde-1' } } }),
      'GET /api/lehrer/funk/7/stand': () => {
        n++;
        if (n === 1) return { status: 200, headers: { etag: '"7-3"' }, body: { ...LAUF, version: 3, voll: true, nachrichten: [N11], ereignisse: [] } };
        if (n === 2) {
          knopf().focus();
          beob.status = region('.funk-status');
          beob.verbindung = region('.funk-verbindung');
          return { status: 200, headers: { etag: '"7-4"' }, body: { ...LAUF, version: 4, voll: false, nachrichten: [{ id: 12, von: 2, an: 1, art: 'nachricht', inhalt: 'QUITT', lesbar: true }], ereignisse: [] } };
        }
        if (n === 3) {
          beob.fokus = k.document.activeElement === knopf() && !!knopf();
          beob.zwoelf = !!k.document.getElementById('haupt').querySelector('li.regie-nachricht[data-id="12"]');
          beob.gleicheRegionen = region('.funk-status') === beob.status && region('.funk-verbindung') === beob.verbindung;
        }
        return { status: 404, body: { error: 'Szenario nicht gefunden.' } };
      }
    }
  });
  await k.ruhe();
  assert.ok(n >= 3);
  assert.ok(beob.zwoelf, 'neu gezeichnet');
  assert.ok(beob.fokus, 'Fokus auf „Ausblenden“ von Nachricht 11 wiederhergestellt');
  assert.ok(beob.gleicheRegionen, 'Live-Regionen nicht ersetzt');
});
