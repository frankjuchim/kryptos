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
