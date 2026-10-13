/* Kryptos – Lehrkraft-Tab „Knack-Arena“ (TECHNIK §9.7, §13.4, Plan M7 Task 158, E102, E103): Arena anlegen, eingereichte
   Chiffren (Team, Name, Stufen, Beschreibung, Länge, Hinweise), Phasen steuern (Angriffsphase mit Dauer → angriffBis,
   beenden, schließen, löschen mit Bestätigung), Versuche-Matrix (Angreifer × Ziel), Beurteilungen gesammelt (nur hier),
   Link zum Beamer und QR-Code zur Werkstatt. Aktualisiert sich alle 5 s (KRPoll), aber nicht, solange ein Eingabefeld den
   Fokus hat. Lädt nach lehrer.js und registriert den Tab bei KRLehrer. Texte nur als Textknoten, Lehrkräfte gesiezt. */
'use strict';

const KRLehrerArena = (() => {
  const { h, api, mount } = AQ;
  const enc = encodeURIComponent;
  const DAUER = 25;
  const STATUS = Object.freeze({ werkstatt: 'Werkstatt', angriff: 'Angriffsphase', beurteilung: 'Beurteilung', geschlossen: 'geschlossen' });
  const ERKLAERUNG = Object.freeze({
    werkstatt: 'Die Teams bauen und reichen ein (je Team eine Chiffre, änderbar bis zum Start). Andere Chiffren sind für die Teams unsichtbar.',
    angriff: 'Alle Verfahren und Geheimtexte sind sichtbar; die Teams greifen an (höchstens 1 Versuch je 30 s und Chiffre).',
    beurteilung: 'Die Teams beurteilen ihr Verfahren. „Unknackbar“ ist vergeben.',
    geschlossen: 'Die Arena ist geschlossen und nur lesbar. Sie wird 30 Tage nach dem Schließen automatisch gelöscht.'
  });

  /**
   * Arena-Ansicht in box.
   * @param {object} kurs  Kurs aus GET /api/lehrer/kurse/:id
   * @param {Element} box
   * @param {object} teamsDaten  GET /api/lehrer/kurse/:id/teams
   */
  function arenaAnsicht(kurs, box, teamsDaten) {
    const nurLesen = !kurs.aktiv;
    const teams = (teamsDaten.teams || []).slice().sort((a, b) => a.nr - b.nr);
    let meldung = { text: '', fehler: false };
    let dauer = String(DAUER);
    let poll = null;
    let pollId = null;
    let wartend = null;

    const fehlerZeile = () => (meldung.text ? h('p', { class: meldung.fehler ? 'fehler rueckmeldung falsch' : 'rueckmeldung ok', role: meldung.fehler ? 'alert' : 'status' }, meldung.text) : null);
    const eingabeAktiv = () => {
      const a = document.activeElement;
      return !!a && box.contains(a) && ['input', 'select', 'textarea'].includes(a.localName);
    };
    function stoppePoll() {
      if (poll) poll.stopp();
      poll = null;
      pollId = null;
    }
    if (typeof KRLehrer !== 'undefined' && typeof KRLehrer.beimVerlassen === 'function') KRLehrer.beimVerlassen(stoppePoll);
    box.addEventListener('focusout', () =>
      setTimeout(() => {
        if (wartend && !eingabeAktiv() && box.isConnected) {
          const a = wartend;
          wartend = null;
          zeige(a);
        }
      }, 0)
    );

    async function ausfuehren(fn, erfolg) {
      try {
        await fn();
        meldung = { text: erfolg, fehler: false };
      } catch (e) {
        if (e && e.status === 401) return;
        meldung = { text: (e && e.message) || 'Das hat nicht geklappt.', fehler: true };
      }
      await lade();
    }

    async function lade() {
      const { arena } = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/arena`);
      if (!arena) {
        stoppePoll();
        return ohneArena();
      }
      const ansicht = await api('GET', `/api/lehrer/arena/${enc(arena.id)}`);
      zeige(ansicht);
      if (typeof KRPoll !== 'undefined' && arena.status !== 'geschlossen' && pollId !== arena.id) {
        stoppePoll();
        pollId = arena.id;
        poll = KRPoll.starte({
          url: () => `/api/lehrer/arena/${enc(arena.id)}`,
          intervall: 5000,
          sofort: false,
          beiDaten: (a) => {
            if (!box.isConnected) return stoppePoll();
            if (eingabeAktiv()) wartend = a;
            else zeige(a);
            if (a.status === 'geschlossen') stoppePoll();
          },
          beiZustand: (z) => {
            if (!box.isConnected) return stoppePoll();
            if (z === 'ende') {
              stoppePoll();
              lade().catch(() => {});
            }
          }
        });
      } else if (arena.status === 'geschlossen') stoppePoll();
    }

    /* --- ohne Arena --- */
    function ohneArena() {
      const mitMitgliedern = teams.filter((t) => (t.mitglieder || []).length);
      const anlegen = h('button', { type: 'button', class: 'knopf knopf-primaer arena-anlegen', disabled: nurLesen }, 'Arena anlegen');
      anlegen.addEventListener('click', () => ausfuehren(() => api('POST', `/api/lehrer/kurse/${enc(kurs.id)}/arena`, {}), 'Arena angelegt – die Werkstatt ist offen.'));
      mount(
        box,
        h(
          'section',
          { class: 'arena-tab', 'aria-labelledby': 'arena-titel' },
          h('h2', { id: 'arena-titel' }, 'Knack-Arena'),
          h('p', { class: 'text-2 lesen' }, 'Die Teams entwerfen in der Chiffren-Werkstatt ein Verfahren aus 1 bis 4 Stufen und reichen es mit einem eigenen Text ein; danach greifen sie die Verfahren der anderen Teams an (W3 §9.4, DS 11).'),
          h('p', { class: 'text-2 lesen' }, `Dafür brauchen Sie Teams (Tab „Teams“, derzeit ${mitMitgliedern.length} mit Mitgliedern). Die Werkstatt öffnet sofort nach dem Anlegen.`),
          fehlerZeile(),
          h('div', { class: 'knopf-reihe' }, anlegen)
        )
      );
    }

    /* --- mit Arena --- */
    function phaseKnopf(a, ziel, text, art, frage, body = {}) {
      const b = h('button', { type: 'button', class: `knopf ${art}`, disabled: nurLesen }, text);
      b.addEventListener('click', async () => {
        if (frage && !(await AQ.bestaetigen(frage[0], frage[1], { ok: frage[2] || text, gefahr: true }))) return;
        const extra = typeof body === 'function' ? body() : body;
        if (extra === null) return;
        ausfuehren(() => api('POST', `/api/lehrer/arena/${enc(a.id)}/phase`, { phase: ziel, ...extra }), `Phase: ${STATUS[ziel]}.`);
      });
      return b;
    }

    function steuerung(a) {
      const knoepfe = [];
      if (a.status === 'werkstatt') {
        const feld = h('input', { type: 'number', class: 'dauer', id: 'arena-dauer', min: '1', max: '180', step: '1', inputmode: 'numeric', value: dauer, disabled: nurLesen });
        feld.addEventListener('input', () => (dauer = feld.value));
        const start = phaseKnopf(a, 'angriff', 'Angriffsphase starten', 'knopf-primaer angriff-starten', null, () => {
          const m = Number(feld.value);
          if (!Number.isInteger(m) || m < 1 || m > 180) {
            meldung = { text: 'Die Dauer ist eine ganze Zahl von 1 bis 180 Minuten.', fehler: true };
            zeige(a);
            return null;
          }
          return { angriffBis: new Date(Date.now() + m * 60e3).toISOString() };
        });
        knoepfe.push(h('label', { for: 'arena-dauer', class: 'arena-dauer-label' }, 'Dauer der Angriffsphase (Minuten) ', feld), start);
      }
      if (a.status === 'angriff') knoepfe.push(phaseKnopf(a, 'beurteilung', 'Angriffsphase beenden', 'knopf-primaer arena-beenden', ['Angriffsphase beenden?', 'Danach sind keine Angriffe mehr möglich; ungeknackte Chiffren erhalten „Unknackbar“.', 'Beenden']));
      if (a.status === 'beurteilung') knoepfe.push(phaseKnopf(a, 'geschlossen', 'Arena schließen', 'knopf-zweit arena-schliessen', ['Arena schließen?', 'Die Teams können danach nur noch lesen. Die Arena wird 30 Tage nach dem Schließen gelöscht.', 'Schließen']));
      const loeschen = h('button', { type: 'button', class: 'knopf knopf-gefahr arena-loeschen', disabled: nurLesen }, 'Arena löschen');
      loeschen.addEventListener('click', async () => {
        if (!(await AQ.bestaetigen('Arena löschen?', 'Alle Chiffren, Beurteilungen und Versuche werden gelöscht.', { ok: 'Löschen', gefahr: true }))) return;
        stoppePoll();
        ausfuehren(() => api('DELETE', `/api/lehrer/arena/${enc(a.id)}`), 'Arena gelöscht.');
      });
      knoepfe.push(loeschen);
      if (a.status === 'geschlossen') {
        const neu = h('button', { type: 'button', class: 'knopf knopf-primaer arena-anlegen', disabled: nurLesen }, 'Neue Arena anlegen');
        neu.addEventListener('click', () => ausfuehren(() => api('POST', `/api/lehrer/kurse/${enc(kurs.id)}/arena`, {}), 'Arena angelegt – die Werkstatt ist offen.'));
        knoepfe.unshift(neu);
      }
      return h('div', { class: 'knopf-reihe arena-steuerung' }, knoepfe);
    }

    function chiffreKarte(c) {
      const stufen = (c.stufen || []).map((st, i) => {
        const p = Object.entries(st.param || {}).map(([n, w]) => `${n}: ${w}`).join(', ');
        return `${i + 1}. ${st.kuerzel}${p ? ` (${p})` : ''}`;
      });
      const hinweise = Array.isArray(c.hinweise) ? c.hinweise : [];
      const status = c.geknackt ? `geknackt${c.geknacktVon && c.geknacktVon.length ? ` von ${c.geknacktVon.map((x) => x.name).join(', ')}` : ''}${Number.isInteger(c.geknacktNachSek) ? ` nach ${c.geknacktNachSek} s` : ''}` : 'ungeknackt';
      return h(
        'li',
        { class: 'lk-arena-chiffre', 'data-id': String(c.id) },
        h('h4', null, c.team.name, c.name ? ` · ${c.name}` : ''),
        h('p', { class: 'arena-stufen' }, 'Stufen: ', stufen.join(' → ')),
        h('p', { class: 'arena-beschreibung' }, c.beschreibung || '–'),
        h('p', { class: 'text-2 klein' }, `${c.klartextLaenge} Buchstaben · ${c.versuche} ${c.versuche === 1 ? 'Versuch' : 'Versuche'} · ${c.geknackt ? '🔓' : '🔒'} ${status}`),
        hinweise.length ? h('ul', { class: 'arena-hinweis-liste' }, hinweise.map((x) => h('li', null, x.p && typeof KRDiag !== 'undefined' ? KRDiag.chip(x.p) : x.p ? `${x.p} ` : null, x.p ? ' ' : null, x.text))) : null
      );
    }

    /** Matrix Angreifer (Zeilen: alle Teams) × Ziel (Spalten: Chiffren) */
    function matrix(a) {
      if (!a.chiffren.length) return null;
      const zelle = (t, c) => {
        if (c.team.id === t.id) return 'eigene';
        const v = (c.versucheJeTeam || {})[t.id];
        if (!v || !v.gesamt) return '0';
        return v.erfolg ? `${v.gesamt} · geknackt ✓` : String(v.gesamt);
      };
      return h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'arena-matrix' },
          h('caption', null, 'Versuche: Angreifer (Zeilen) × Ziel (Spalten)'),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Angreifer'), a.chiffren.map((c) => h('th', { scope: 'col' }, c.team.name)))),
          h('tbody', null, teams.map((t) => h('tr', null, h('th', { scope: 'row' }, t.name), a.chiffren.map((c) => h('td', { class: zelle(t, c).includes('✓') ? 'erfolg' : null }, zelle(t, c))))))
        )
      );
    }

    function zeige(a) {
      const bis = a.status === 'angriff' && a.angriffBis ? ` · bis ${new Date(a.angriffBis).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr` : '';
      mount(
        box,
        h(
          'section',
          { class: 'arena-tab', 'aria-labelledby': 'arena-titel' },
          h('h2', { id: 'arena-titel' }, 'Knack-Arena'),
          h('p', { class: 'arena-status', role: 'status' }, h('strong', null, STATUS[a.status] || a.status), bis, ` · ${a.chiffren.length} ${a.chiffren.length === 1 ? 'Chiffre' : 'Chiffren'} eingereicht`),
          h('p', { class: 'text-2 lesen' }, ERKLAERUNG[a.status] || ''),
          fehlerZeile(),
          steuerung(a),
          h(
            'div',
            { class: 'arena-beamer-zeile' },
            h('a', { class: 'knopf knopf-zweit beamer-oeffnen', href: `/beamer/arena/${a.id}`, target: '_blank', rel: 'noopener' }, 'Beamer öffnen'),
            h('figure', { class: 'arena-qr-rahmen' }, h('img', { class: 'arena-qr', src: '/api/lehrer/qr.svg?ziel=werkstatt', alt: 'QR-Code zur Werkstatt', width: '120', height: '120' }), h('figcaption', { class: 'text-2 klein' }, 'Werkstatt öffnen'))
          ),
          h('h3', null, 'Eingereichte Chiffren'),
          a.chiffren.length ? h('ol', { class: 'lk-arena-chiffren' }, a.chiffren.map(chiffreKarte)) : h('p', { class: 'text-2 lk-arena-chiffren' }, 'Noch keine Chiffre eingereicht.'),
          a.status !== 'werkstatt' ? matrix(a) : null,
          a.status === 'beurteilung' || a.status === 'geschlossen'
            ? h(
                'section',
                { class: 'beurteilungen', 'aria-labelledby': 'arena-beurteilungen-titel' },
                h('h3', { id: 'arena-beurteilungen-titel' }, 'Beurteilungen der Teams'),
                h('p', { class: 'text-2 klein' }, 'Nur hier sichtbar – nie auf dem Beamer oder im Portal.'),
                h('dl', { class: 'beurteilungen-liste' }, a.chiffren.map((c) => h('div', null, h('dt', null, c.team.name), h('dd', { class: c.beurteilung ? 'beurteilung-text' : 'text-2' }, c.beurteilung || 'noch keine Beurteilung'))))
              )
            : null
        )
      );
    }

    return lade();
  }

  if (typeof KRLehrer !== 'undefined' && KRLehrer.tab) {
    KRLehrer.tab('arena', 'Knack-Arena', async (kurs, box, { r } = {}) => {
      const teamsDaten = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/teams`);
      if (r && !r.gueltig()) return;
      await arenaAnsicht(kurs, box, teamsDaten);
    });
  }

  return { arenaAnsicht };
})();
