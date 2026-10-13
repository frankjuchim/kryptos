'use strict';
// Lehrkraft-Tabs „Teams“ und „Funkraum“ (Plan M7 Tasks 149, 150) im Attrappen-DOM.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('./dom_attrappe');

const NAMEN = ['Team Skytale', 'Team Scheibe', 'Team Quadrat', 'Team Lochstreifen', 'Team Enigma', 'Team Schlüsselpaar', 'Team Siegel', 'Team Chronoskop', 'Team Tafel', 'Team Manuskript', 'Team Lochkarte', 'Team Kompass'];
const LEHRER = ['common.js', 'krypto/oberflaeche.js', 'krypto/kopfzeile.js', 'krypto/lehrer.js', 'krypto/lehrer_funkraum.js'];
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
    const teams = [1, 2, 3, 4, 5].map((nr) => ({ id: 10 + nr, nr }));
    assert.deepEqual(k.roh(k.wert('KRLehrerFunk').vorschlag(typ, teams)), S.rollenVorschlag(typ, teams), typ);
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
