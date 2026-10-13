/* Kryptos – Lehrkraft-Tabs „Teams“ und „Funkraum“ (TECHNIK §11.1, §12.2, §12.5, §13.4; Plan M7 Tasks 149, 150).
   Teams = feste Tischgruppen des Kurses (Namen aus TEAM_NAMEN, E106): Zuteilen, Mitglieder entfernen, Teams anlegen und
   entfernen, automatisch verteilen; gespeichert wird der Sollstand (PUT, Fehler des Servers als Meldung).
   Lädt nach lehrer.js und registriert die Tabs bei KRLehrer. Texte nur als Textknoten, Lehrkräfte werden gesiezt. */
'use strict';

const KRLehrerFunk = (() => {
  const { h, api, toast, mount } = AQ;
  const enc = encodeURIComponent;
  const MAX_TEAMS = 12;

  /**
   * Automatisch verteilen: alphabetisch nach Name, reihum auf die Teams 1…anzahl, Namen in Listenreihenfolge.
   * anzahl wird auf 2…12 und höchstens auf die Zahl der Schülerinnen und Schüler begrenzt (keine leeren Tischgruppen).
   * @param {{ id: number, name: string }[]} schueler
   * @returns {{ nr: number, name: string, mitglieder: number[] }[]}
   */
  function verteile(schueler, anzahl, namen) {
    const liste = [...(schueler || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'de') || a.id - b.id);
    if (!liste.length) return [];
    const n = Math.max(1, Math.min(Math.max(2, Math.floor(Number(anzahl)) || 2), MAX_TEAMS, liste.length, (namen || []).length || MAX_TEAMS));
    const teams = Array.from({ length: n }, (_, i) => ({ nr: i + 1, name: namen[i], mitglieder: [] }));
    liste.forEach((s, i) => teams[i % n].mitglieder.push(s.id));
    return teams;
  }

  /* ---------- Tab „Teams“ (Task 149) ---------- */

  /**
   * Teams-Ansicht in box. Zustand lokal bis „Teams speichern“ (PUT mit dem Sollstand).
   * @param {object} kurs   Kurs aus GET /api/lehrer/kurse/:id
   * @param {Element} box   Tab-Inhalt
   * @param {object} daten  GET /api/lehrer/kurse/:id/teams → { teams, ohneTeam, namen }
   */
  function teamsAnsicht(kurs, box, daten) {
    const nurLesen = !kurs.aktiv;
    const namen = daten.namen || [];
    let zustand = null; // { teams: [{ nr, name, mitglieder: [{ id, name }] }], ohneTeam: [{ id, name }] }
    let geaendert = false;
    let fehlerText = '';
    let fokusNach = null; // Selektor, der nach dem Neuzeichnen den Fokus bekommt (Tastatur)

    function uebernehme(d) {
      zustand = {
        teams: (d.teams || []).map((t) => ({ nr: t.nr, name: t.name, mitglieder: (t.mitglieder || []).map((m) => ({ id: m.id, name: m.name })) })).sort((a, b) => a.nr - b.nr),
        ohneTeam: (d.ohneTeam || []).map((m) => ({ id: m.id, name: m.name }))
      };
      geaendert = false;
    }

    const sortiere = (l) => l.sort((a, b) => a.name.localeCompare(b.name, 'de') || a.id - b.id);
    const aendern = (fn, fokus = null) => {
      fn();
      geaendert = true;
      fehlerText = '';
      fokusNach = fokus;
      zeichne();
    };

    function mitgliedEntfernen(team, m) {
      aendern(() => {
        team.mitglieder = team.mitglieder.filter((x) => x.id !== m.id);
        zustand.ohneTeam.push(m);
        sortiere(zustand.ohneTeam);
      }, `select.zuteilen[data-id="${m.id}"]`);
    }

    function zuteilen(sid, nr) {
      const team = zustand.teams.find((t) => t.nr === nr);
      const m = zustand.ohneTeam.find((x) => x.id === sid);
      if (!team || !m) return;
      aendern(() => {
        zustand.ohneTeam = zustand.ohneTeam.filter((x) => x.id !== sid);
        team.mitglieder.push(m); // hinten anhängen (Reihenfolge der Zuteilung)
      }, `button.mitglied[data-id="${sid}"]`);
    }

    function teamEntfernen(team) {
      aendern(() => {
        zustand.teams = zustand.teams.filter((t) => t !== team);
        zustand.ohneTeam.push(...team.mitglieder);
        sortiere(zustand.ohneTeam);
      }, 'button.team-neu');
    }

    function teamNeu() {
      const nrn = new Set(zustand.teams.map((t) => t.nr));
      const vergeben = new Set(zustand.teams.map((t) => t.name));
      let nr = 1;
      while (nrn.has(nr)) nr++;
      const name = namen.find((n) => !vergeben.has(n));
      if (nr > MAX_TEAMS || !name) return;
      aendern(() => zustand.teams.push({ nr, name, mitglieder: [] }), `select.team-name[data-nr="${nr}"]`);
    }

    function verteilen(anzahl) {
      const alle = [...zustand.teams.flatMap((t) => t.mitglieder), ...zustand.ohneTeam];
      const name = new Map(alle.map((m) => [m.id, m.name]));
      const neu = verteile(alle, anzahl, namen);
      aendern(() => {
        zustand.teams = neu.map((t) => ({ nr: t.nr, name: t.name, mitglieder: t.mitglieder.map((id) => ({ id, name: name.get(id) })) }));
        zustand.ohneTeam = [];
      }, 'button.teams-speichern');
    }

    async function speichern(knopf) {
      knopf.disabled = true;
      const soll = { teams: zustand.teams.map((t) => ({ nr: t.nr, name: t.name, mitglieder: t.mitglieder.map((m) => m.id) })) };
      try {
        const antwort = await api('PUT', `/api/lehrer/kurse/${enc(kurs.id)}/teams`, soll);
        uebernehme(antwort);
        fehlerText = '';
        fokusNach = 'button.teams-speichern';
        zeichne();
        toast('Teams gespeichert.');
      } catch (e) {
        if (e && e.status === 401) return;
        fehlerText = (e && e.message) || 'Speichern fehlgeschlagen.';
        fokusNach = 'p.fehler';
        zeichne();
      }
    }

    function teamZeile(t) {
      const andere = new Set(zustand.teams.filter((x) => x !== t).map((x) => x.name));
      const nameWahl = h(
        'select',
        { class: 'team-name', 'data-nr': String(t.nr), 'aria-label': `Name von Team ${t.nr}`, disabled: nurLesen },
        namen.map((n) => h('option', { value: n, disabled: andere.has(n), selected: n === t.name }, n))
      );
      nameWahl.value = t.name;
      nameWahl.addEventListener('change', () => aendern(() => (t.name = nameWahl.value), `select.team-name[data-nr="${t.nr}"]`));
      return h(
        'tr',
        { 'data-nr': String(t.nr) },
        h('th', { scope: 'row', class: 'zahl' }, String(t.nr)),
        h('td', null, nameWahl),
        h(
          'td',
          null,
          t.mitglieder.length
            ? h(
                'ul',
                { class: 'mitglieder' },
                t.mitglieder.map((m) =>
                  h(
                    'li',
                    null,
                    h(
                      'button',
                      { type: 'button', class: 'chip mitglied', 'data-id': String(m.id), 'aria-label': `${m.name} aus ${t.name} entfernen`, disabled: nurLesen, onclick: () => mitgliedEntfernen(t, m) },
                      m.name,
                      h('span', { 'aria-hidden': 'true' }, ' ×')
                    )
                  )
                )
              )
            : h('span', { class: 'text-2' }, 'noch niemand')
        ),
        h('td', null, h('button', { type: 'button', class: 'knopf knopf-leise team-entfernen', 'aria-label': `${t.name} entfernen`, disabled: nurLesen, onclick: () => teamEntfernen(t) }, 'Entfernen'))
      );
    }

    function ohneTeamListe() {
      if (!zustand.ohneTeam.length) return h('p', { class: 'text-2' }, 'Alle aktiven Schülerinnen und Schüler sind einem Team zugeteilt.');
      return h(
        'ul',
        { class: 'ohne-team' },
        zustand.ohneTeam.map((m) => {
          const wahl = h(
            'select',
            { class: 'zuteilen', 'data-id': String(m.id), 'aria-label': `${m.name} einem Team zuteilen`, disabled: nurLesen || !zustand.teams.length },
            h('option', { value: '' }, 'Team wählen …'),
            zustand.teams.map((t) => h('option', { value: String(t.nr) }, t.name))
          );
          wahl.addEventListener('change', () => {
            if (wahl.value) zuteilen(m.id, Number(wahl.value));
          });
          return h('li', null, h('span', { class: 'ohne-team-name' }, m.name), wahl);
        })
      );
    }

    function zeichne() {
      const anzahl = h('input', { type: 'number', class: 'verteilen-anzahl', id: 'verteilen-anzahl', min: '2', max: String(MAX_TEAMS), step: '1', inputmode: 'numeric', value: String(Math.min(MAX_TEAMS, Math.max(2, zustand.teams.length || 4))), disabled: nurLesen });
      const speichernKnopf = h('button', { type: 'button', class: 'knopf knopf-primaer teams-speichern', disabled: nurLesen }, 'Teams speichern');
      speichernKnopf.addEventListener('click', () => speichern(speichernKnopf));
      const volle = zustand.teams.length >= MAX_TEAMS || !namen.some((n) => !zustand.teams.some((t) => t.name === n));
      mount(
        box,
        h(
          'section',
          { class: 'teams-tab', 'aria-labelledby': 'teams-titel' },
          h('h2', { id: 'teams-titel' }, 'Teams (Tischgruppen)'),
          h('p', { class: 'text-2 lesen' }, 'Für Funkraum und Knack-Arena arbeiten Ihre Schülerinnen und Schüler in festen Tischgruppen. Die Teams tragen feste Namen; jede Person gehört zu höchstens einem Team. Änderungen gelten erst nach „Teams speichern“.'),
          nurLesen ? h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, 'Dieser Kurs ist im Portal abgeschaltet – Teams nur lesbar.')) : null,
          zustand.teams.length
            ? h(
                'div',
                { class: 'scroll-x' },
                h(
                  'table',
                  { class: 'teams-tabelle' },
                  h('caption', { class: 'sr' }, 'Teams des Kurses'),
                  h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'zahl' }, 'Nr.'), h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col' }, 'Mitglieder'), h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Aktion')))),
                  h('tbody', null, zustand.teams.map(teamZeile))
                )
              )
            : h('div', { class: 'leer-zustand' }, h('p', null, 'Noch keine Teams. Legen Sie Teams an oder lassen Sie den Kurs automatisch verteilen.')),
          h('h3', null, `Ohne Team (${zustand.ohneTeam.length})`),
          ohneTeamListe(),
          h(
            'div',
            { class: 'knopf-reihe teams-werkzeuge' },
            h('button', { type: 'button', class: 'knopf knopf-zweit team-neu', disabled: nurLesen || volle, onclick: teamNeu }, 'Team hinzufügen'),
            h(
              'span',
              { class: 'verteilen-feld' },
              h('label', { for: 'verteilen-anzahl' }, 'Anzahl Teams'),
              anzahl,
              h('button', { type: 'button', class: 'knopf knopf-zweit verteilen', disabled: nurLesen, onclick: () => verteilen(anzahl.value) }, 'Automatisch verteilen')
            )
          ),
          fehlerText ? h('p', { class: 'fehler rueckmeldung falsch', role: 'alert', tabindex: '-1' }, fehlerText) : null,
          h('div', { class: 'knopf-reihe' }, speichernKnopf, geaendert ? h('span', { class: 'text-2 teams-ungespeichert', role: 'status' }, 'Ungespeicherte Änderungen') : null)
        )
      );
      if (fokusNach) {
        const el = box.querySelector(fokusNach) || box.querySelector('button.teams-speichern');
        if (el && typeof el.focus === 'function') el.focus();
        fokusNach = null;
      }
    }

    uebernehme(daten);
    zeichne();
    return { ungespeichert: () => geaendert };
  }

  if (typeof KRLehrer !== 'undefined' && KRLehrer.tab) {
    KRLehrer.tab('teams', 'Teams', async (kurs, box, { r } = {}) => {
      const daten = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/teams`);
      if (r && !r.gueltig()) return;
      teamsAnsicht(kurs, box, daten);
    });
  }

  return { verteile, teamsAnsicht };
})();
