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

  /* ---------- Tab „Funkraum“ – Regie (Task 150) ---------- */

  /** Szenarien (Spiegel von SZENARIEN in src/krypto/funkraum/szenarien.js, Test) mit Lernziel aus den Welt-Specs §9.3 */
  const SZENARIEN = Object.freeze({
    botenlauf: { titel: 'Botenlauf', welt: 0, ds: 2, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' }, phasen: ['runde-1', 'runde-2', 'runde-3', 'aufloesung'],
      lernziel: 'Der Caesar-Schlüsselraum ist so klein, dass ein Angreifer, der das Verfahren kennt, jede Nachricht in Minuten liest.' },
    wettknacken: { titel: 'Wettknacken', welt: 1, ds: 4, teamsMin: 2, rollen: { alle: 'knacker' }, phasen: ['knacken', 'aufloesung'],
      lernziel: 'Die Häufigkeitsanalyse bricht eine monoalphabetische Substitution trotz 26! Schlüsseln – Schritt für Schritt, ohne Brute Force.' },
    'doppelter-schluessel': { titel: 'Der doppelte Schlüssel', welt: 3, ds: 9, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' }, phasen: ['funken', 'lauschen', 'aufloesung'],
      lernziel: 'Das One-Time-Pad ist nur bei einmaliger Schlüsselnutzung sicher; C1 ⊕ C2 = M1 ⊕ M2.' },
    schluesseltausch: { titel: 'Schlüsseltausch vor Eves Augen', welt: 4, ds: 12, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'eve' }, phasen: ['runde-1', 'runde-2', 'aufloesung'],
      lernziel: 'Zwei Teams vereinbaren über einen mitgelesenen Kanal einen gemeinsamen Schlüssel; Eve scheitert nur an der Größe der Zahlen.' },
    mallory: { titel: 'Mallory im Netz', welt: 5, ds: 16, teamsMin: 3, rollen: { paar: ['alice', 'bob'], sonder: 'mallory' }, phasen: ['ohne-zertifikate', 'mit-zertifikaten', 'aufloesung'],
      lernziel: 'Verschlüsselung ohne geprüfte Schlüssel ist nutzlos (Man-in-the-Middle); Zertifikate einer vertrauenswürdigen Stelle (Trent) decken den Angriff auf.' }
  });
  const ROLLE = { alice: 'Alice', bob: 'Bob', eve: 'Eve', mallory: 'Mallory', knacker: 'Knacker' };
  const PHASE = { 'runde-1': 'Runde 1', 'runde-2': 'Runde 2', 'runde-3': 'Runde 3', aufloesung: 'Auflösung', knacken: 'Knacken', funken: 'Funken', lauschen: 'Lauschen', 'ohne-zertifikate': 'Ohne Zertifikate', 'mit-zertifikaten': 'Mit Zertifikaten' };
  const STATUS = { vorbereitung: 'In Vorbereitung', laeuft: 'Läuft', pausiert: 'Pausiert', auswertung: 'Beendet – Auswertung' };
  const KARTEN = { doppelt: 'Doppelt verschlüsselt', zaun: 'Gartenzaun 3' };
  const EREIGNIS = {
    status: 'Status', phase: 'Phase', gesendet: 'gesendet', angekommen: 'angekommen', geknackt: 'geknackt', ausgeblendet: 'ausgeblendet', stumm: 'stumm geschaltet',
    hinweis: 'Hinweis', fortschritt: 'Fortschritt', fertig: 'fertig', oeffentlich: 'öffentlicher Wert', 'k-gemeldet': 'K gemeldet', tipp: 'Eve-Tipp',
    weitergeleitet: 'weitergeleitet', ersetzt: 'ersetzt', zertifikat: 'Zertifikat', gemeldet: 'gemeldet', sonderkarte: 'Sonderkarte'
  };
  const SPALTE = {
    nachricht: 'Nachricht', runde: 'Runde', von: 'von', an: 'an', angekommen: 'angekommen', geknackt: 'geknackt', sekunden: 'Sekunden', besonderheit: 'Besonderheit',
    team: 'Team', anteil: 'Anteil', fertig: 'fertig', platz: 'Platz', paar: 'Paar (Alice)', kGleich: 'K gleich', eveRichtig: 'Eve richtig', eveSekunden: 'Eve nach Sekunden',
    abschnitt: 'Abschnitt', c: 'Geheimtext', m: 'Klartext', a: 'Spruch A', b: 'Spruch B', nullen: 'Nullbytes', laenge: 'Länge', kAlice: 'K Alice', kBob: 'K Bob', kWahr: 'K wahr',
    eve: 'Eve', eve2: 'Eve 2', phase: 'Phase', gesendet: 'gesendet', ueberMallory: 'über Mallory', zertifikat: 'Zertifikat', hinweise: 'Hinweise', eveGewinnt: 'Eve gewinnt',
    je: 'Je Runde', zeilen: 'Nachrichten', teams: 'Teams', sprueche: 'Funksprüche', vergleiche: 'Vergleiche', meldungen: 'Meldungen'
  };
  const TEAM_SPALTEN = new Set(['team', 'von', 'an', 'paar']);

  /** Rollenvorschlag wie der Server (E107) – nur für die Auswahl „Sparschwein-Paar“ beim Anlegen */
  function vorschlag(typ, teams) {
    const k = SZENARIEN[typ];
    const t = [...teams].sort((a, b) => a.nr - b.nr);
    if (k.rollen.alle) return t.map((x) => ({ teamId: x.id, rolle: k.rollen.alle, partnerId: null }));
    const n = t.length;
    if (!n) return [];
    const paare = n - (n - 2 * Math.floor((n - 1) / 2));
    const out = [];
    for (let i = 0; i + 1 < paare; i += 2) out.push({ teamId: t[i].id, rolle: 'alice', partnerId: t[i + 1].id }, { teamId: t[i + 1].id, rolle: 'bob', partnerId: t[i].id });
    for (let i = paare; i < n; i++) out.push({ teamId: t[i].id, rolle: k.rollen.sonder, partnerId: null });
    return out;
  }

  /**
   * Funkraum-Regie in box: ohne Szenario Auswahl, sonst je Status Rollen (vorbereitung), Regie (laeuft/pausiert) oder
   * Auswertung. Lädt nach jeder Aktion neu; laufende Szenarien pollt KRPoll (Task 151).
   */
  function funkraumAnsicht(kurs, box, teamsDaten) {
    const nurLesen = !kurs.aktiv;
    const teams = (teamsDaten.teams || []).slice().sort((a, b) => a.nr - b.nr);
    const mitMitgliedern = teams.filter((t) => (t.mitglieder || []).length);
    const namen = new Map(teams.map((t) => [t.id, t.name]));
    const teamName = (id) => (id === null || id === undefined ? '–' : namen.get(id) || `Team ${id}`);
    let meldung = { text: '', fehler: false };
    let zertifikatText = '';
    let rollenEntwurf = null; // vorbereitung: [{ teamId, rolle, partnerId }]

    const fehlerZeile = () => (meldung.text ? h('p', { class: meldung.fehler ? 'fehler rueckmeldung falsch' : 'rueckmeldung ok', role: meldung.fehler ? 'alert' : 'status' }, meldung.text) : null);

    async function ausfuehren(fn, erfolg = '') {
      try {
        const r = await fn();
        meldung = { text: erfolg, fehler: false };
        return r;
      } catch (e) {
        if (e && e.status === 401) return null;
        meldung = { text: (e && e.message) || 'Das hat nicht geklappt.', fehler: true };
        return null;
      } finally {
        await lade();
      }
    }

    /* --- Polling der Regie (Plan M7 Task 151): KRPoll auf den Regie-Stand (ETag/seit, 3 s, Pause bei hidden); nach
       jeder Aktion sofort. Ein Neuzeichnen wartet, solange ein Eingabefeld der Regie den Fokus hat. --- */
    let poll = null;
    let pollId = null;
    let laedt = false;
    let wartend = null;
    const standUrl = (id, seit = 0) => `/api/lehrer/funk/${enc(id)}/stand?seit=${enc(seit)}&ansicht=regie`;
    function stoppePoll() {
      if (poll) poll.stopp();
      poll = null;
      pollId = null;
    }
    if (typeof KRLehrer !== 'undefined' && typeof KRLehrer.beimVerlassen === 'function') KRLehrer.beimVerlassen(stoppePoll);
    const eingabeAktiv = () => {
      const a = document.activeElement;
      return !!a && box.contains(a) && ['input', 'select', 'textarea'].includes(a.localName);
    };
    function zeigeStand(stand) {
      wartend = null;
      if (stand.status === 'auswertung') return auswertungAnsicht(stand);
      return regie(stand);
    }
    box.addEventListener('focusout', () =>
      setTimeout(() => {
        if (wartend && !eingabeAktiv() && box.isConnected) zeigeStand(wartend);
      }, 0)
    );
    function starteRegiePoll(id) {
      if (poll && pollId === id) return;
      stoppePoll();
      pollId = id;
      poll = KRPoll.starte({
        url: (seit) => standUrl(id, seit),
        intervall: 3000,
        mischen: true,
        sofort: false,
        beiDaten: (stand) => {
          if (!box.isConnected) return stoppePoll();
          if (laedt) return;
          if (eingabeAktiv()) wartend = stand;
          else zeigeStand(stand);
        },
        beiZustand: (z) => {
          if (!box.isConnected) return stoppePoll();
          if (z === 'ende') {
            stoppePoll();
            lade().catch(() => {});
            return;
          }
          const el = box.querySelector('.funk-verbindung');
          if (el) el.textContent = z === 'gestoert' ? 'Verbindung unterbrochen – wird wiederhergestellt' : 'Aktualisiert sich alle 3 Sekunden.';
        }
      });
    }

    async function lade() {
      const { szenario } = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/funk`);
      if (!szenario) {
        stoppePoll();
        return auswahl();
      }
      if (szenario.status === 'vorbereitung') {
        stoppePoll();
        return vorbereitung(szenario);
      }
      if (typeof KRPoll === 'undefined') return zeigeStand(await api('GET', standUrl(szenario.id)));
      starteRegiePoll(szenario.id);
      laedt = true;
      try {
        await poll.jetzt();
      } finally {
        laedt = false;
      }
      return zeigeStand((poll && poll.stand()) || (await api('GET', standUrl(szenario.id))));
    }

    /* --- ohne Szenario: Auswahl --- */
    function auswahl() {
      rollenEntwurf = null;
      const zuWenig = mitMitgliedern.length < 2;
      const karten = Object.entries(SZENARIEN).map(([typ, k]) => {
        const genug = mitMitgliedern.length >= k.teamsMin;
        let wiederholer = null;
        if (typ === 'doppelter-schluessel' && genug) {
          const alice = vorschlag(typ, mitMitgliedern).filter((r) => r.rolle === 'alice');
          wiederholer = h(
            'select',
            { class: 'option-wiederholer', id: 'option-wiederholer', disabled: nurLesen },
            h('option', { value: '' }, 'kein Sparschwein-Paar'),
            alice.map((r) => h('option', { value: String(r.teamId) }, `${teamName(r.teamId)} (Alice)`))
          );
        }
        const knopf = h('button', { type: 'button', class: 'knopf knopf-primaer', disabled: nurLesen || !genug }, 'Anlegen');
        knopf.addEventListener('click', () => {
          const body = { typ };
          if (wiederholer && wiederholer.value) body.optionen = { wiederholerTeamId: Number(wiederholer.value) };
          ausfuehren(() => api('POST', `/api/lehrer/kurse/${enc(kurs.id)}/funk`, body));
        });
        return h(
          'article',
          { class: 'karte szenario-wahl', 'data-typ': typ, 'data-epoche': String(k.welt), 'aria-labelledby': `szenario-${typ}` },
          h('h3', { id: `szenario-${typ}` }, k.titel),
          h('p', { class: 'text-2 klein' }, `Epoche ${k.welt} · DS ${k.ds} · ab ${k.teamsMin} Teams`),
          h('p', null, k.lernziel),
          wiederholer ? h('p', { class: 'option-feld' }, h('label', { for: 'option-wiederholer' }, 'Sparschwein-Paar (nutzt Abschnitt 1 zweimal, verdeckt): '), wiederholer) : null,
          genug ? null : h('p', { class: 'text-2 klein' }, `Dafür brauchen Sie mindestens ${k.teamsMin} Teams mit Mitgliedern.`),
          h('p', null, knopf)
        );
      });
      mount(
        box,
        h(
          'section',
          { class: 'funk-tab', 'aria-labelledby': 'funk-titel' },
          h('h2', { id: 'funk-titel' }, 'Funkraum'),
          h('p', { class: 'text-2 lesen' }, 'Wählen Sie ein Live-Szenario. Die Teams bekommen einen Rollenvorschlag, den Sie vor dem Start ändern können. Nachrichten bestehen nur aus A–Z, 0–9 und Leerzeichen und werden beim Beenden gelöscht.'),
          zuWenig ? h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, 'Bitte zuerst Teams einteilen: ', h('a', { href: `#/kurs/${kurs.id}/teams` }, 'zum Tab „Teams“'), '.')) : null,
          fehlerZeile(),
          h('div', { class: 'szenario-liste' }, karten)
        )
      );
    }

    /* --- vorbereitung: Rollen --- */
    function vorbereitung(sz) {
      const k = SZENARIEN[sz.typ] || { rollen: { alle: 'knacker' } };
      if (!rollenEntwurf || rollenEntwurf.id !== sz.id) rollenEntwurf = { id: sz.id, liste: (sz.rollen || []).map((r) => ({ teamId: r.teamId, rolle: r.rolle, partnerId: r.partnerId ?? null })) };
      const liste = rollenEntwurf.liste;
      const rolleVon = (id) => liste.find((r) => r.teamId === id) || null;
      const erlaubt = k.rollen.alle ? [k.rollen.alle] : [...k.rollen.paar, k.rollen.sonder];
      const zeilen = teams.map((t) => {
        const r = rolleVon(t.id);
        const rolleWahl = h('select', { class: 'rolle', 'data-team': String(t.id), 'aria-label': `Rolle von ${t.name}`, disabled: nurLesen }, h('option', { value: '' }, 'spielt nicht mit'), erlaubt.map((x) => h('option', { value: x }, ROLLE[x] || x)));
        rolleWahl.value = r ? r.rolle : '';
        rolleWahl.addEventListener('change', () => {
          const alt = rolleVon(t.id);
          rollenEntwurf.liste = liste.filter((x) => x.teamId !== t.id);
          for (const x of rollenEntwurf.liste) if (x.partnerId === t.id && !rolleWahl.value) x.partnerId = null;
          if (rolleWahl.value) rollenEntwurf.liste.push({ teamId: t.id, rolle: rolleWahl.value, partnerId: ['alice', 'bob'].includes(rolleWahl.value) && alt ? alt.partnerId : null });
          rollenEntwurf.liste.sort((a, b) => (teams.findIndex((x) => x.id === a.teamId) - teams.findIndex((x) => x.id === b.teamId)));
          vorbereitung(sz);
        });
        const paar = r && ['alice', 'bob'].includes(r.rolle);
        const partnerWahl = paar
          ? h('select', { class: 'partner', 'data-team': String(t.id), 'aria-label': `Partner von ${t.name}`, disabled: nurLesen }, h('option', { value: '' }, '–'), teams.filter((x) => x.id !== t.id).map((x) => h('option', { value: String(x.id) }, x.name)))
          : null;
        if (partnerWahl) {
          partnerWahl.value = r.partnerId ? String(r.partnerId) : '';
          partnerWahl.addEventListener('change', () => {
            const neu = partnerWahl.value ? Number(partnerWahl.value) : null;
            r.partnerId = neu;
            const gegen = neu ? rolleVon(neu) : null;
            if (gegen) {
              gegen.partnerId = t.id;
              if (['alice', 'bob'].includes(gegen.rolle)) gegen.rolle = r.rolle === 'alice' ? 'bob' : 'alice';
            }
            vorbereitung(sz);
          });
        }
        return h('tr', null, h('th', { scope: 'row' }, t.name), h('td', null, rolleWahl), h('td', null, partnerWahl || h('span', { class: 'text-2' }, '–')));
      });
      const speichern = h('button', { type: 'button', class: 'knopf knopf-zweit rollen-speichern', disabled: nurLesen }, 'Rollen speichern');
      speichern.addEventListener('click', () => ausfuehren(() => api('PUT', `/api/lehrer/funk/${enc(sz.id)}/rollen`, { rollen: rollenEntwurf.liste.map((r) => ({ teamId: r.teamId, rolle: r.rolle, partnerId: r.partnerId })) }), 'Rollen gespeichert.'));
      const wiederholer = sz.optionen && sz.optionen.wiederholerTeamId ? h('p', { class: 'text-2' }, `Sparschwein-Paar: ${teamName(sz.optionen.wiederholerTeamId)} (verdeckt; muss Alice bleiben).`) : null;
      mount(
        box,
        h(
          'section',
          { class: 'funk-tab funk-regie', 'aria-labelledby': 'funk-titel' },
          h('h2', { id: 'funk-titel' }, `${sz.titel || k.titel} – Vorbereitung`),
          h('p', { class: 'text-2 lesen' }, 'Prüfen Sie die Rollen. Teams ohne Rolle sehen „Dein Team spielt diesmal nicht mit – schau auf den Beamer.“ Alice und Bob bilden Paare; Änderungen speichern Sie vor dem Start.'),
          wiederholer,
          fehlerZeile(),
          h('div', { class: 'scroll-x' }, h('table', { class: 'rollen' }, h('caption', { class: 'sr' }, 'Rollen der Teams'), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Team'), h('th', { scope: 'col' }, 'Rolle'), h('th', { scope: 'col' }, 'Partner'))), h('tbody', null, zeilen))),
          h('div', { class: 'knopf-reihe' }, speichern, aktionKnopf(sz, 'starten', 'Starten', 'knopf-primaer'), aktionKnopf(sz, 'abbrechen', 'Abbrechen', 'knopf-leise', ['Szenario abbrechen?', 'Das Szenario wird ohne Auswertung gelöscht.']))
        )
      );
    }

    function aktionKnopf(sz, aktion, text, art = 'knopf-zweit', frage = null) {
      // Schließen/Abbrechen löschen nur – auch im gesperrten Kurs erlaubt (Review M7 K1)
      const loeschend = aktion === 'schliessen' || aktion === 'abbrechen';
      const b = h('button', { type: 'button', class: `knopf ${art} aktion`, 'data-aktion': aktion, disabled: nurLesen && !loeschend }, text);
      b.addEventListener('click', async () => {
        if (frage && !(await AQ.bestaetigen(frage[0], frage[1], { ok: frage[2] || text, gefahr: true }))) return;
        ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(sz.id)}/status`, { aktion }));
      });
      return b;
    }

    const regieKnopf = (klasse, text, fn, attrs = {}) => h('button', { type: 'button', class: `knopf ${klasse}`, disabled: nurLesen, onclick: fn, ...attrs }, text);

    /* --- Wert einer Tabellenzelle --- */
    function zelle(key, v) {
      if (v === null || v === undefined) return '–';
      if (typeof v === 'boolean') return v ? 'ja' : 'nein';
      if (TEAM_SPALTEN.has(key) && typeof v === 'number') return teamName(v);
      if (key === 'anteil' && typeof v === 'number') return `${Math.round(v * 100)} %`;
      if (key === 'phase' && PHASE[v]) return PHASE[v];
      if (key === 'besonderheit' && KARTEN[v]) return KARTEN[v];
      if (Array.isArray(v)) return v.length ? v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ') : '–';
      if (typeof v === 'object') return Object.entries(v).map(([a, b]) => `${SPALTE[a] || a}: ${zelle(a, b)}`).join(' · ');
      return String(v);
    }

    /** Daten (nur Zahlen, ids, Codes) als Tabelle(n) – Liste von Objekten → Tabelle, Objekt → Abschnitte */
    function datenAnzeige(wert, titel = null) {
      if (Array.isArray(wert)) {
        const zeilen = wert.filter((x) => x && typeof x === 'object');
        if (!zeilen.length) return h('p', { class: 'text-2' }, titel ? `${titel}: keine Einträge.` : 'Keine Einträge.');
        const spalten = [...new Set(zeilen.flatMap((z) => Object.keys(z)))].filter((s) => s !== 'verlauf');
        return h(
          'div',
          { class: 'scroll-x' },
          h('table', { class: 'auswertung-funk' }, titel ? h('caption', null, titel) : null, h('thead', null, h('tr', null, spalten.map((s) => h('th', { scope: 'col' }, SPALTE[s] || s)))), h('tbody', null, zeilen.map((z) => h('tr', null, spalten.map((s) => h('td', null, zelle(s, z[s])))))))
        );
      }
      if (wert && typeof wert === 'object') {
        const teile = [];
        const einfach = [];
        for (const [key, v] of Object.entries(wert)) {
          if (Array.isArray(v)) teile.push(datenAnzeige(v, SPALTE[key] || key));
          else if (v && typeof v === 'object' && Object.values(v).every((x) => x && typeof x === 'object')) teile.push(datenAnzeige(Object.entries(v).map(([nr, x]) => ({ runde: Number(nr) || nr, ...x })), SPALTE[key] || key));
          else einfach.push(h('div', null, h('dt', null, SPALTE[key] || key), h('dd', null, zelle(key, v))));
        }
        return h('div', { class: 'auswertung-teil' }, einfach.length ? h('dl', { class: 'funk-kennzahlen' }, einfach) : null, teile);
      }
      return h('p', null, zelle('', wert));
    }

    function ereignisText(e) {
      const d = e.daten || {};
      const teile = [EREIGNIS[e.code] || e.code];
      if (d.phase) teile.push(PHASE[d.phase] || d.phase);
      if (d.status) teile.push(STATUS[d.status] || d.status);
      if (d.team !== undefined) teile.push(teamName(d.team));
      if (d.von !== undefined) teile.push(`${teamName(d.von)} → ${teamName(d.an)}`);
      if (d.nr !== undefined) teile.push(`Nr. ${d.nr}`);
      if (d.prozent !== undefined) teile.push(`${d.prozent} %`);
      if (d.platz !== undefined) teile.push(`Platz ${d.platz}`);
      if (d.sekunden !== undefined) teile.push(`${d.sekunden} s`);
      return teile.join(' · ');
    }

    /* --- Typ-spezifische Regie --- */
    function typRegie(stand) {
      const a = stand.anzeigen || {};
      const rollen = stand.rollen || [];
      const teile = [];
      if (stand.typ === 'wettknacken') {
        const gesendet = new Set((stand.ereignisse || []).filter((e) => e.code === 'hinweis').map((e) => e.daten && e.daten.nr));
        teile.push(
          h('div', { class: 'knopf-reihe' }, h('span', null, 'Hinweise senden:'), [1, 2, 3].map((nr) =>
            regieKnopf('knopf-zweit hinweis', `Hinweis ${nr}${gesendet.has(nr) ? ' ✓' : ''}`, () => ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(stand.id)}/hinweis`, { nr }), `Hinweis ${nr} gesendet.`), { 'data-nr': String(nr), disabled: nurLesen || gesendet.has(nr) || stand.phase !== 'knacken' })
          ))
        );
        const f = a.fortschritt || [];
        teile.push(
          h('ul', { class: 'funk-fortschritt' }, f.map((x) => {
            const pct = Math.round((x.anteil || 0) * 100);
            return h('li', null, h('span', { class: 'funk-fortschritt-team' }, teamName(x.team)), h('span', { class: 'progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': `${teamName(x.team)}: ${pct} Prozent` }, h('span', { style: { '--wert': pct + '%' } })), h('span', { class: 'zahl' }, `${pct} %${x.fertig ? ` · fertig, Platz ${x.platz}` : ''}`));
          }))
        );
      }
      if (stand.typ === 'botenlauf' && stand.phase === 'runde-3') {
        teile.push(
          h('div', { class: 'sonderkarten' }, h('h3', null, 'Sonderkarten (Runde 3)'), rollen.filter((r) => r.rolle === 'alice').map((r) => {
            const wahl = h('select', { class: 'sonderkarte', 'data-team': String(r.teamId), 'aria-label': `Sonderkarte für ${teamName(r.teamId)}`, disabled: nurLesen }, h('option', { value: '' }, 'keine vermerkt'), Object.entries(KARTEN).map(([w, t]) => h('option', { value: w }, t)));
            wahl.addEventListener('change', () => wahl.value && ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(stand.id)}/sonderkarte`, { teamId: r.teamId, karte: wahl.value }), 'Sonderkarte vermerkt.'));
            return h('p', null, h('span', { class: 'sonderkarte-team' }, teamName(r.teamId)), ' ', wahl);
          }))
        );
      }
      if (stand.typ === 'schluesseltausch' && a.meldungen) teile.push(datenAnzeige(a.meldungen, 'Meldungen (nur Regie)'));
      if (stand.typ === 'doppelter-schluessel') {
        if (a.eveGewinnt !== undefined) teile.push(h('p', null, `Eve gewinnt bisher: ${a.eveGewinnt ? 'ja' : 'nein'}`));
        if (a.sprueche) teile.push(datenAnzeige(a.sprueche, 'Funksprüche (nur Regie)'));
        if (a.vergleiche) teile.push(datenAnzeige(a.vergleiche, 'Vergleiche C1 ⊕ C2'));
      }
      if (stand.typ === 'mallory') {
        teile.push(h('div', { class: 'knopf-reihe' }, regieKnopf('knopf-zweit station-leeren', 'Station leeren (alles unverändert weiterleiten)', () => ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(stand.id)}/station`, {}), 'Station geleert.'))));
        if (stand.phase === 'mit-zertifikaten') {
          const bobs = rollen.filter((r) => r.rolle === 'bob');
          const etikettVon = (id) => `S${23 + 4 * Math.max(0, bobs.findIndex((r) => r.teamId === id))}`;
          const team = h('select', { class: 'zertifikat-team', id: 'zertifikat-team', disabled: nurLesen }, bobs.map((r) => h('option', { value: String(r.teamId) }, teamName(r.teamId))));
          const etikett = h('input', { type: 'text', class: 'zertifikat-etikett', id: 'zertifikat-etikett', value: bobs.length ? etikettVon(bobs[0].teamId) : '', maxlength: '4', autocomplete: 'off', spellcheck: 'false', disabled: nurLesen });
          team.addEventListener('change', () => (etikett.value = etikettVon(Number(team.value))));
          const senden = (ausstellen) => ausfuehren(async () => {
            const r = await api('POST', `/api/lehrer/funk/${enc(stand.id)}/zertifikat`, { teamId: Number(team.value), etikett: etikett.value.trim().toUpperCase(), ausstellen });
            zertifikatText = r && r.text ? r.text : 'Zertifikat verweigert.';
          });
          teile.push(
            h(
              'form',
              { class: 'zertifikat', 'aria-labelledby': 'zertifikat-titel', onsubmit: (e) => e.preventDefault() },
              h('h3', { id: 'zertifikat-titel' }, 'Trent: Zertifikat'),
              h('p', { class: 'feld' }, h('label', { for: 'zertifikat-team' }, 'Bob-Team'), team),
              h('p', { class: 'feld' }, h('label', { for: 'zertifikat-etikett' }, 'Schlüsselnummer'), etikett),
              h('div', { class: 'knopf-reihe' }, regieKnopf('knopf-primaer zertifikat-ausstellen', 'Ausstellen', () => senden(true)), regieKnopf('knopf-zweit zertifikat-verweigern', 'Verweigern', () => senden(false))),
              zertifikatText ? h('p', { class: 'zertifikat-text mono', role: 'status' }, zertifikatText) : null
            )
          );
        }
      }
      if (a.auswertung) teile.push(h('h3', null, 'Auswertung (Auflösung)'), datenAnzeige(a.auswertung));
      return teile.length ? h('div', { class: 'funk-typ' }, teile) : null;
    }

    /* --- laeuft / pausiert --- */
    function regie(stand) {
      const k = SZENARIEN[stand.typ] || {};
      const phasen = stand.phasen || k.phasen || [];
      const i = phasen.indexOf(stand.phase);
      const naechste = i >= 0 && i + 1 < phasen.length ? phasen[i + 1] : null;
      const rollen = stand.rollen || [];
      const rolleVon = new Map(rollen.map((r) => [r.teamId, r]));
      const teamZeilen = teams.map((t) => {
        const r = rolleVon.get(t.id);
        return h(
          'tr',
          null,
          h('th', { scope: 'row' }, t.name),
          h('td', null, r ? ROLLE[r.rolle] || r.rolle : h('span', { class: 'text-2' }, 'spielt nicht mit')),
          h('td', null, r && r.partnerId ? teamName(r.partnerId) : '–'),
          h('td', null, r ? regieKnopf('knopf-leise stumm', '60 s stumm', () => ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(stand.id)}/teams/${enc(t.id)}/stumm`, { sekunden: 60 }), `${t.name} ist 60 Sekunden stumm.`), { 'data-team': String(t.id), 'aria-label': `${t.name} 60 Sekunden stumm schalten` }) : null)
        );
      });
      const nachrichten = (stand.nachrichten || []).slice().reverse();
      const ereignisse = (stand.ereignisse || []).slice(-15).reverse();
      mount(
        box,
        h(
          'section',
          { class: 'funk-tab funk-regie', 'aria-labelledby': 'funk-titel' },
          h('h2', { id: 'funk-titel' }, stand.titel || k.titel || 'Funkraum'),
          h('p', { class: 'funk-status', role: 'status' }, h('strong', null, STATUS[stand.status] || stand.status), ` · Phase: ${PHASE[stand.phase] || stand.phase}`, naechste ? ` · Nächste Phase: ${PHASE[naechste] || naechste}` : ' · letzte Phase'),
          h(
            'div',
            { class: 'knopf-reihe' },
            stand.status === 'pausiert' ? aktionKnopf(stand, 'fortsetzen', 'Fortsetzen', 'knopf-primaer') : aktionKnopf(stand, 'pausieren', 'Pausieren'),
            naechste ? aktionKnopf(stand, 'phase', `Weiter: ${PHASE[naechste] || naechste}`) : null,
            aktionKnopf(stand, 'beenden', 'Beenden', 'knopf-gefahr', ['Szenario beenden?', 'Alle Nachrichten und Schlüssel werden jetzt gelöscht. Übrig bleibt nur die Auswertung.', 'Beenden']),
            h('a', { class: 'knopf knopf-zweit beamer-oeffnen', href: `/beamer/funkraum/${stand.id}`, target: '_blank', rel: 'noopener' }, 'Beamer öffnen')
          ),
          h('p', { class: 'funk-verbindung text-2 klein', role: 'status' }, typeof KRPoll === 'undefined' ? '' : 'Aktualisiert sich alle 3 Sekunden.'),
          fehlerZeile(),
          typRegie(stand),
          h('h3', null, 'Teams'),
          h('div', { class: 'scroll-x' }, h('table', { class: 'funk-teams' }, h('caption', { class: 'sr' }, 'Teams und Rollen'), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Team'), h('th', { scope: 'col' }, 'Rolle'), h('th', { scope: 'col' }, 'Partner'), h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Moderation')))), h('tbody', null, teamZeilen))),
          h('h3', null, `Nachrichten (${nachrichten.length})`),
          nachrichten.length
            ? h(
                'ol',
                { class: 'regie-nachrichten' },
                nachrichten.map((n) =>
                  h(
                    'li',
                    { class: 'regie-nachricht' + (n.ausgeblendet ? ' ausgeblendet' : ''), 'data-id': String(n.id) },
                    h('span', { class: 'klein text-2' }, `${teamName(n.angezeigtVon ?? n.von)} → ${teamName(n.an)}${n.art && n.art !== 'nachricht' ? ` · ${n.art}` : ''}`),
                    h('code', { class: 'funk-inhalt' }, n.ausgeblendet ? '(ausgeblendet)' : n.inhalt || ''),
                    n.angekommen ? h('span', { class: 'chip angekommen' }, 'angekommen') : null,
                    n.geknackt ? h('span', { class: 'chip geknackt' }, 'geknackt') : null,
                    n.ausgeblendet ? null : regieKnopf('knopf-leise ausblenden', 'Ausblenden', () => ausfuehren(() => api('POST', `/api/lehrer/funk/${enc(stand.id)}/nachrichten/${enc(n.id)}/ausblenden`, {}), 'Nachricht ausgeblendet.'), { 'data-id': String(n.id), 'aria-label': `Nachricht ${n.id} ausblenden` })
                  )
                )
              )
            : h('p', { class: 'text-2' }, 'Noch keine Nachrichten.'),
          h('h3', null, 'Ereignisse'),
          ereignisse.length ? h('ol', { class: 'regie-ereignisse klein' }, ereignisse.map((e) => h('li', null, h('span', { class: 'text-2' }, KR.zeitText(e.zeit)), ' ', ereignisText(e)))) : h('p', { class: 'text-2' }, 'Noch keine Ereignisse.')
        )
      );
    }

    /* --- auswertung --- */
    function auswertungAnsicht(stand) {
      const k = SZENARIEN[stand.typ] || {};
      mount(
        box,
        h(
          'section',
          { class: 'funk-tab funk-regie', 'aria-labelledby': 'funk-titel' },
          h('h2', { id: 'funk-titel' }, `${stand.titel || k.titel || 'Funkraum'} – Auswertung`),
          h('p', { class: 'text-2 lesen' }, 'Das Szenario ist beendet. Nachrichten, Prüfwerte und Schlüssel sind gelöscht; übrig ist nur diese Auswertung aus Zahlen.'),
          fehlerZeile(),
          stand.auswertung ? datenAnzeige(stand.auswertung) : h('p', { class: 'text-2' }, 'Keine Auswertung vorhanden.'),
          h('div', { class: 'knopf-reihe' }, aktionKnopf(stand, 'schliessen', 'Szenario endgültig löschen', 'knopf-gefahr', ['Szenario endgültig löschen?', 'Auch die Auswertung wird gelöscht. Danach können Sie ein neues Szenario anlegen.', 'Löschen']), h('a', { class: 'knopf knopf-zweit beamer-oeffnen', href: `/beamer/funkraum/${stand.id}`, target: '_blank', rel: 'noopener' }, 'Beamer öffnen'))
        )
      );
    }

    return lade();
  }

  if (typeof KRLehrer !== 'undefined' && KRLehrer.tab) {
    KRLehrer.tab('funkraum', 'Funkraum', async (kurs, box, { r } = {}) => {
      const teamsDaten = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/teams`);
      if (r && !r.gueltig()) return;
      await funkraumAnsicht(kurs, box, teamsDaten);
    });
  }

  if (typeof KRLehrer !== 'undefined' && KRLehrer.tab) {
    KRLehrer.tab('teams', 'Teams', async (kurs, box, { r } = {}) => {
      const daten = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/teams`);
      if (r && !r.gueltig()) return;
      teamsAnsicht(kurs, box, daten);
    });
  }

  return { verteile, teamsAnsicht, SZENARIEN, vorschlag, funkraumAnsicht };
})();
