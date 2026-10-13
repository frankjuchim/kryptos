/* Kryptos – Lehrkraft-Seite /lehrer (TECHNIK §11.1, §7.2, §13.4; M4 Tasks 62–64): Kurse kommen aus dem Portal (kein
   Anlegen, Löschen, Umbenennen, keine Codes, kein Beitritt). Hash-Router:
     #/ Kursliste · #/kurs/<id>/<tab> · #/vorschau[/welt/<nr>|/aufgabe/<id>] · #/materialien · #/admin/<tab>
   <id> ist immer die LOKALE Kurs-id aus GET /api/lehrer/kurse (E21); die Portal-Kennung (kurs, „k:1“) nur als Text.
   Startet nur auf body.seite-lehrer; sonst stellt KRLehrer nur Bausteine bereit (Gastmodus). Texte nur als Textknoten. */
'use strict';

const KRLehrer = (() => {
  const { h, api, toast, mount } = AQ;
  let sitzung = null;
  let haupt = null;
  let kurseAnfrage = null;
  let routeNr = 0;
  let tabFokus = false; // Tabwechsel per Tab-Leiste: danach Fokus auf den neuen Tab statt auf die Überschrift
  const aufraeumer = new Set();
  const ROUTEN = new Map(); // name → async (teile, r) => void
  const TABS = []; // [{ key, label, render(kurs, box, ctx) }]
  const BEREICH = { '': 'kurse', kurs: 'kurse', vorschau: 'aufgaben', materialien: 'materialien', admin: 'verwaltung' };

  /* ---------- Hilfen ---------- */

  const enc = encodeURIComponent;
  const zeit = (iso) => (iso ? KR.zeitText(iso) : '–');
  const niveauChip = (n) => h('span', { class: `chip chip-niveau niveau-${n === 'gA' ? 'kern' : 'eA'} chip-kursniveau`, title: n === 'gA' ? 'Grundkurs (gA)' : 'Leistungskurs (eA)' }, n === 'gA' ? 'gA' : 'eA');

  /** Kurse (GET /api/lehrer/kurse) mit Cache; { neu: true } lädt neu. */
  function kurse({ neu = false } = {}) {
    if (neu || !kurseAnfrage) {
      kurseAnfrage = api('GET', '/api/lehrer/kurse');
      kurseAnfrage.catch(() => (kurseAnfrage = null));
    }
    return kurseAnfrage;
  }

  function seite(titel, ...inhalt) {
    document.title = `${titel} · Kryptos`;
    mount(haupt, ...inhalt);
    const h1 = haupt.querySelector('h1');
    if (h1) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function fehler(e, zurueck = { href: '#/', text: 'Zur Kursliste' }) {
    if (e && e.status === 401) return;
    document.title = 'Fehler · Kryptos';
    mount(haupt, h('div', { class: 'wrap lehrer-seite' }, h('div', { class: 'fehler-ziel' })));
    KR.fehler(haupt.querySelector('.fehler-ziel'), e, { zurueck });
  }

  function beimVerlassen(fn) {
    aufraeumer.add(fn);
  }

  const istAdmin = () => !!(sitzung && sitzung.rolle === 'superadmin');

  /* ---------- Kursliste ---------- */

  /** Tabelle der Kurse (Name · Kennung · Lehrkraft (nur Admin) · Schüler · zuletzt aktiv · Niveau · Zustand). */
  function kursListeTabelle(liste, { admin = false, link = (k) => `#/kurs/${k.id}/schueler` } = {}) {
    if (!liste.length) {
      return h('div', { class: 'leer-zustand karte' }, KR.symbol('icons', 'i-portal'), h('p', null, 'Noch keine Kurse. Kurse legen Sie im Portal an und schalten Kryptos dort frei.'));
    }
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'kurs-tabelle' },
        h('caption', { class: 'sr' }, 'Ihre Kurse'),
        h(
          'thead',
          null,
          h('tr', null, h('th', { scope: 'col' }, 'Kurs'), h('th', { scope: 'col' }, 'Kennung'), admin ? h('th', { scope: 'col' }, 'Lehrkraft') : null, h('th', { scope: 'col', class: 'zahl' }, 'Schüler'), h('th', { scope: 'col' }, 'zuletzt aktiv'), h('th', { scope: 'col' }, 'Niveau'), h('th', { scope: 'col' }, 'Zustand'))
        ),
        h(
          'tbody',
          null,
          liste.map((k) =>
            h(
              'tr',
              { class: k.aktiv ? null : 'abgeschaltet' },
              h('th', { scope: 'row' }, h('a', { class: 'kurs-link', href: link(k) }, k.name)),
              h('td', { class: 'mono' }, k.kurs || '–'),
              admin ? h('td', null, k.lehrkraft || '–') : null,
              h('td', { class: 'zahl' }, String(k.schueler || 0)),
              h('td', null, zeit(k.zuletztAktiv)),
              h('td', null, niveauChip(k.einstellungen && k.einstellungen.niveau)),
              h('td', null, k.aktiv ? h('span', { class: 'text-2' }, 'aktiv') : h('span', { class: 'chip chip-neutral' }, '⏸ abgeschaltet'))
            )
          )
        )
      )
    );
  }

  async function kursliste(_teile, r) {
    const liste = await kurse({ neu: true });
    if (!r.gueltig()) return;
    seite(
      'Kurse',
      h(
        'div',
        { class: 'wrap lehrer-seite' },
        h('h1', null, 'Ihre Kurse'),
        h('p', { class: 'text-2 lesen' }, 'Kurse, Namen und Schülerkonten verwalten Sie im Portal InfoLabs. Hier stellen Sie ein, was Ihr Kurs in Kryptos sieht, und verfolgen den Lernstand.'),
        kursListeTabelle(liste, { admin: istAdmin() })
      )
    );
  }

  /* ---------- Kurs mit Tabs ---------- */

  /** Tab registrieren (Reihenfolge = Registrierung). render(kurs, box, { neu }) füllt box. */
  function tab(key, label, render) {
    const i = TABS.findIndex((t) => t.key === key);
    const t = { key, label, render };
    if (i >= 0) TABS[i] = t;
    else TABS.push(t);
  }

  function tabLeiste(kurs, aktiv) {
    const knoepfe = TABS.map((t) =>
      h(
        'button',
        { type: 'button', role: 'tab', id: `tab-${t.key}`, 'data-tab': t.key, 'aria-selected': t.key === aktiv ? 'true' : 'false', 'aria-controls': 'tab-inhalt', tabindex: t.key === aktiv ? '0' : '-1' },
        t.label
      )
    );
    const gehe = (key) => {
      tabFokus = true;
      location.hash = `#/kurs/${kurs.id}/${key}`;
    };
    knoepfe.forEach((b, i) => {
      b.addEventListener('click', () => gehe(TABS[i].key));
      b.addEventListener('keydown', (e) => {
        const n = TABS.length;
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j === null) return;
        e.preventDefault();
        gehe(TABS[j].key);
      });
    });
    return h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Bereiche des Kurses' }, knoepfe);
  }

  async function kursRoute(teile, r) {
    const [idRoh, tabRoh] = teile;
    const liste = await kurse();
    if (!r.gueltig()) return;
    const eintrag = liste.find((k) => String(k.id) === String(idRoh));
    if (!eintrag) return fehler(new Error('Kurs nicht gefunden.'));
    const kurs = await api('GET', `/api/lehrer/kurse/${enc(eintrag.id)}`);
    if (!r.gueltig()) return;
    const t = TABS.find((x) => x.key === tabRoh) || TABS[0];
    if (t.key !== tabRoh && history && history.replaceState) history.replaceState(null, '', `#/kurs/${kurs.id}/${t.key}`);
    const vonTab = tabFokus;
    tabFokus = false;
    const box = h('div', { class: 'tab-inhalt', id: 'tab-inhalt', role: 'tabpanel', 'aria-labelledby': `tab-${t.key}` }, h('p', { class: 'laden', role: 'status' }, 'Wird geladen …'));
    seite(
      `${kurs.name} – ${t.label}`,
      h(
        'div',
        { class: 'wrap lehrer-seite' },
        h('nav', { class: 'brotkrumen', 'aria-label': 'Brotkrümel' }, h('a', { href: '#/' }, 'Kurse'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', { 'aria-current': 'page' }, kurs.name)),
        h(
          'div',
          { class: 'kurs-kopf' },
          h('h1', null, kurs.name),
          niveauChip(kurs.einstellungen.niveau),
          h('span', { class: 'mono text-2' }, kurs.kurs),
          kurs.aktiv ? null : h('span', { class: 'chip chip-neutral' }, '⏸ im Portal abgeschaltet')
        ),
        kurs.aktiv ? null : h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, 'Dieser Kurs ist im Portal abgeschaltet – Einstellungen nur lesbar.')),
        tabLeiste(kurs, t.key),
        box
      )
    );
    const fokus = haupt.querySelector(`#tab-${t.key}`);
    if (fokus && vonTab) fokus.focus(); // Tastaturwechsel der Tabs: Fokus bleibt auf dem Tab
    try {
      await t.render(kurs, box, { r });
    } catch (e) {
      if (r.gueltig() && !(e && e.status === 401)) KR.fehler(box, e);
    }
  }

  /* ---------- Tab Schülerinnen und Schüler ---------- */

  function schuelerTabelle(liste) {
    if (!liste.length) return h('div', { class: 'leer-zustand' }, h('p', null, 'Noch niemand aus diesem Kurs war in Kryptos. Schülerinnen und Schüler erscheinen hier nach ihrer ersten Anmeldung über das Portal.'));
    const sortiert = [...liste].sort((a, b) => (b.aktiv === a.aktiv ? b.punkte - a.punkte || a.name.localeCompare(b.name, 'de') : a.aktiv ? -1 : 1));
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'schueler-tabelle' },
        h('caption', { class: 'sr' }, 'Schülerinnen und Schüler des Kurses'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col', class: 'zahl' }, 'Punkte'), h('th', { scope: 'col', class: 'zahl' }, 'gelöst'), h('th', { scope: 'col' }, 'Rang'), h('th', { scope: 'col' }, 'zuletzt aktiv'))),
        h(
          'tbody',
          null,
          sortiert.map((s) =>
            h(
              'tr',
              { class: s.aktiv ? null : 'inaktiv' },
              h('th', { scope: 'row' }, s.name, s.aktiv ? null : h('span', { class: 'klein text-2 inaktiv-hinweis' }, ' – nicht mehr im Kurs (Portal)')),
              h('td', { class: 'zahl' }, String(s.punkte)),
              h('td', { class: 'zahl' }, String(s.geloest)),
              h('td', null, s.rang || '–'),
              h('td', null, zeit(s.zuletztAktiv))
            )
          )
        )
      )
    );
  }

  tab('schueler', 'Schülerinnen und Schüler', async (kurs, box) => {
    const liste = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/schueler`);
    mount(
      box,
      h('p', { class: 'text-2 lesen' }, 'Namen und Kurszugehörigkeit kommen aus dem Portal. Wer dort aus dem Kurs genommen wird, bleibt hier mit seinem Lernstand sichtbar, bis das Portal die Daten löscht.'),
      schuelerTabelle(liste)
    );
  });

  /* ---------- Tab Einstellungen ---------- */

  const BOSS = [
    ['auto', 'Automatisch', 'Der Boss öffnet sich, sobald 60 % der Kern-Level-Punkte der Epoche erreicht sind.'],
    ['gesperrt', 'Gesperrt', 'Niemand kann den Boss starten.'],
    ['offen', 'Offen', 'Der Boss ist sofort für alle freigeschaltet.']
  ];

  /** Eingabefeld mit value als Attribut (Radio/Checkbox: Attribut = Wert, auch für [value="…"]-Selektoren). */
  function feld(type, name, wert, an) {
    const x = h('input', { type, name, checked: !!an });
    x.setAttribute('value', wert);
    return x;
  }

  function radio(name, wert, aktuell, text, erklaerung) {
    return h(
      'label',
      { class: 'wahl' },
      feld('radio', name, wert, aktuell === wert),
      h('span', null, h('b', null, text), erklaerung ? h('span', { class: 'klein text-2 wahl-text' }, erklaerung) : null)
    );
  }

  function checkbox(name, wert, an, text, erklaerung) {
    return h(
      'label',
      { class: 'wahl' },
      feld('checkbox', name, wert, an),
      h('span', null, h('b', null, text), erklaerung ? h('span', { class: 'klein text-2 wahl-text' }, erklaerung) : null)
    );
  }

  /** Wert einer Radio-Gruppe in form. */
  const gewaehlt = (form, name) => {
    const r = [...form.querySelectorAll(`input[name="${name}"]`)].find((x) => x.checked);
    return r ? r.value : null;
  };

  /**
   * Einstellungs-Formular. kurs: { id, aktiv, einstellungen, boardSchluessel }; o.werkzeuge: [{ id, titel, welt }],
   * o.welten: [{ nr, titel }]; o.nurLesen: alles gesperrt (Gast/abgeschaltet). o.speichern(einstellungen) → Kurs,
   * o.boardNeu() → { boardSchluessel }. Sendet nur geänderte Schlüssel (bei werkzeuge nur geänderte ids).
   */
  function einstellungen(kurs, o = {}) {
    let stand = kurs;
    const nurLesen = !!o.nurLesen || !kurs.aktiv;
    const e = () => stand.einstellungen || {};
    const welten = Array.isArray(o.welten) ? o.welten : [];
    const werkzeuge = Array.isArray(o.werkzeuge) ? o.werkzeuge : [];
    const boardLink = h('a', { class: 'knopf knopf-zweit board-link', href: `/board/${enc(stand.boardSchluessel || '')}`, target: '_blank', rel: 'noopener' }, 'Board öffnen');

    const neuKnopf = h('button', { type: 'button', class: 'knopf knopf-leise board-neu', disabled: nurLesen }, 'Neuen Board-Link erzeugen');
    neuKnopf.addEventListener('click', async () => {
      const ok = await AQ.bestaetigen('Neuen Board-Link erzeugen?', 'Der bisherige Link funktioniert danach nicht mehr – zum Beispiel, wenn er außerhalb des Kurses geteilt wurde.', { ok: 'Neuen Link erzeugen' });
      if (!ok) return;
      try {
        const r = await (o.boardNeu ? o.boardNeu() : api('POST', `/api/lehrer/kurse/${enc(stand.id)}/board-schluessel`, {}));
        stand = { ...stand, boardSchluessel: r.boardSchluessel };
        boardLink.setAttribute('href', `/board/${enc(r.boardSchluessel)}`);
        toast('Neuer Board-Link erzeugt.');
      } catch (err) {
        toast(err.message, true);
      }
    });

    const form = h(
      'form',
      { class: 'einstellungen', novalidate: true },
      h(
        'fieldset',
        { class: 'karte' },
        h('legend', null, 'Welten'),
        h('p', { class: 'klein text-2' }, 'Nur freigeschaltete Epochen erscheinen auf der Zeitleiste Ihres Kurses.'),
        welten.length ? h('div', { class: 'wahl-raster' }, welten.map((w) => checkbox('welt', String(w.nr), (e().welten || []).includes(w.nr), `Welt ${w.nr} · ${w.titel}`))) : h('p', { class: 'text-2' }, 'Noch keine Welten geladen.')
      ),
      h('fieldset', { class: 'karte' }, h('legend', null, 'Boss'), BOSS.map(([w, t, x]) => radio('boss', w, e().boss || 'auto', t, x))),
      h(
        'fieldset',
        { class: 'karte' },
        h('legend', null, 'Niveau'),
        radio('niveau', 'eA', e().niveau || 'eA', 'eA – Leistungskurs', 'Alle Level und Aufgaben (Kern und eA).'),
        radio('niveau', 'gA', e().niveau || 'eA', 'gA – Grundkurs', 'Nur Kern-Inhalte.'),
        h('p', { class: 'klein text-2' }, 'Im gA-Kurs sind eA-Level und eA-Aufgaben ausgeblendet. Lernstände bleiben erhalten.')
      ),
      h('fieldset', { class: 'karte' }, h('legend', null, 'Kür'), radio('kuer', 'frei', e().kuer || 'frei', 'Frei', 'Kür-Level sind sichtbar (freiwillig).'), radio('kuer', 'gesperrt', e().kuer || 'frei', 'Gesperrt', 'Kür-Level sind ausgeblendet.')),
      h(
        'fieldset',
        { class: 'karte' },
        h('legend', null, 'Werkzeuge im Kryptolabor'),
        h('p', { class: 'klein text-2' }, '„Automatisch“: Das Werkzeug wird mit seiner Epoche frei. Im Boss-Kampf ist das Labor immer geschlossen.'),
        werkzeuge.length
          ? h(
              'div',
              { class: 'scroll-x' },
              h(
                'table',
                { class: 'werkzeug-tabelle' },
                h('caption', { class: 'sr' }, 'Freigabe je Werkzeug'),
                h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Werkzeug'), h('th', { scope: 'col' }, 'Epoche'), h('th', { scope: 'col' }, 'Freigabe'))),
                h(
                  'tbody',
                  null,
                  werkzeuge.map((w) => {
                    const wert = (e().werkzeuge || {})[w.id] || 'auto';
                    const id = `werkzeug-${w.id}`;
                    return h(
                      'tr',
                      null,
                      h('th', { scope: 'row' }, h('label', { for: id }, w.titel)),
                      h('td', null, KR.WELTEN_KURZ[w.welt] || `Welt ${w.welt}`),
                      h(
                        'td',
                        null,
                        h(
                          'select',
                          { name: id, id },
                          [['auto', 'automatisch'], ['frei', 'frei'], ['gesperrt', 'gesperrt']].map(([v, t]) => h('option', { value: v, selected: v === wert }, t))
                        )
                      )
                    );
                  })
                )
              )
            )
          : h('p', { class: 'text-2' }, 'Noch keine Werkzeuge.')
      ),
      h('fieldset', { class: 'karte' }, h('legend', null, 'Scoreboard'), checkbox('scoreboard', 'ja', e().scoreboard !== false, 'Scoreboard für Schülerinnen und Schüler', 'Rangliste des Kurses in der Schüleransicht.')),
      h(
        'fieldset',
        { class: 'karte' },
        h('legend', null, 'Beamer-Board'),
        checkbox('beamer', 'ja', !!e().beamer, 'Beamer-Board einschalten', 'Öffentliche Seite ohne Anmeldung – nur wer den Link kennt, sieht sie.'),
        h('p', { class: 'knopf-reihe' }, boardLink, neuKnopf)
      ),
      h('p', { class: 'klein text-2' }, 'Den Kursnamen ändern Sie im Portal.'),
      h('p', { class: 'knopf-reihe' }, h('button', { type: 'submit', class: 'knopf knopf-primaer', disabled: nurLesen }, 'Speichern'))
    );

    if (nurLesen) form.querySelectorAll('input, select').forEach((x) => (x.disabled = true));

    /** Nur geänderte Schlüssel gegenüber dem letzten Stand. */
    function aenderungen() {
      const alt = e();
      const aus = {};
      if (welten.length) {
        const gezeigt = new Set(welten.map((w) => w.nr));
        const an = [...form.querySelectorAll('input[name="welt"]')].filter((x) => x.checked).map((x) => Number(x.value));
        const neu = [...new Set([...(alt.welten || []).filter((n) => !gezeigt.has(n)), ...an])].sort((a, b) => a - b);
        const vorher = [...(alt.welten || [])].sort((a, b) => a - b);
        if (neu.join(',') !== vorher.join(',')) aus.welten = neu;
      }
      for (const [name, standard] of [['boss', 'auto'], ['niveau', 'eA'], ['kuer', 'frei']]) {
        const v = gewaehlt(form, name);
        if (v && v !== (alt[name] || standard)) aus[name] = v;
      }
      for (const name of ['scoreboard', 'beamer']) {
        const x = form.querySelector(`input[name="${name}"]`);
        const vorher = name === 'scoreboard' ? alt.scoreboard !== false : !!alt.beamer;
        if (x && x.checked !== vorher) aus[name] = x.checked;
      }
      const wz = {};
      for (const w of werkzeuge) {
        const sel = form.querySelector(`select[name="werkzeug-${w.id}"]`);
        if (sel && sel.value !== ((alt.werkzeuge || {})[w.id] || 'auto')) wz[w.id] = sel.value;
      }
      if (Object.keys(wz).length) aus.werkzeuge = wz;
      return aus;
    }

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (nurLesen) return;
      const neu = aenderungen();
      if (!Object.keys(neu).length) return toast('Keine Änderungen.');
      const knopf = form.querySelector('button[type="submit"]');
      knopf.disabled = true;
      try {
        stand = await (o.speichern ? o.speichern(neu) : api('PATCH', `/api/lehrer/kurse/${enc(stand.id)}`, { einstellungen: neu }));
        kurseAnfrage = null;
        toast('Gespeichert.');
      } catch (err) {
        toast(err.message, true);
      } finally {
        knopf.disabled = false;
      }
    });
    return form;
  }

  tab('einstellungen', 'Einstellungen', async (kurs, box) => {
    const [werkzeuge, vorschau] = await Promise.all([api('GET', '/api/lehrer/werkzeuge').catch(() => []), api('GET', '/api/lehrer/vorschau').catch(() => ({ welten: [] }))]);
    mount(box, einstellungen(kurs, { werkzeuge, welten: (vorschau.welten || []).map((w) => ({ nr: w.nr, titel: w.titel })) }));
  });

  /* ---------- Router ---------- */

  ROUTEN.set('', kursliste);
  ROUTEN.set('kurs', kursRoute);

  /** Route registrieren (Vorschau, Materialien, Verwaltung in Tasks 63/64; M7 ergänzt weitere). */
  function route(name, fn) {
    ROUTEN.set(name, fn);
  }

  function teileDerAdresse() {
    try {
      return (location.hash || '').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    } catch {
      return [''];
    }
  }

  async function navigiere() {
    for (const fn of aufraeumer) {
      try {
        fn();
      } catch {
        /* weiter */
      }
    }
    aufraeumer.clear();
    const meine = ++routeNr;
    const r = { gueltig: () => meine === routeNr };
    let [name, ...rest] = teileDerAdresse();
    if (!ROUTEN.has(name || '')) {
      if (history && history.replaceState) history.replaceState(null, '', '#/');
      name = '';
      rest = [];
    }
    KRKopf.aktiv(BEREICH[name || ''] || null);
    KR.epoche(6);
    KRKopf.epoche('Bereich für Lehrkräfte');
    KR.laden(haupt);
    try {
      await ROUTEN.get(name || '')(rest, r);
    } catch (e) {
      if (r.gueltig()) fehler(e);
    }
  }

  async function start() {
    if (!document.body.classList.contains('seite-lehrer')) return;
    haupt = document.getElementById('haupt');
    KR.laden(haupt);
    try {
      sitzung = await api('GET', '/api/sitzung');
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
      return;
    }
    if (!sitzung || !['lehrkraft', 'superadmin'].includes(sitzung.rolle)) {
      location.replace('/');
      return;
    }
    KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'kurse', sitzung });
    window.addEventListener('hashchange', navigiere);
    await navigiere();
  }
  document.addEventListener('DOMContentLoaded', start);

  return {
    tab,
    route,
    seite,
    fehler,
    beimVerlassen,
    kurse,
    istAdmin,
    niveauChip,
    kursListeTabelle,
    schuelerTabelle,
    einstellungen,
    sitzung: () => sitzung,
    neu: navigiere
  };
})();
