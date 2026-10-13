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

  /* ---------- Tab Auswertung (Task 63) ---------- */

  /** Stufe 0–4 eines Anteils (Fläche + Text, nie nur Farbe). */
  function stufe(anteil) {
    const a = Math.max(0, Math.min(1, Number(anteil) || 0));
    if (a <= 0) return 0;
    if (a >= 1) return 4;
    if (a < 1 / 3) return 1;
    if (a < 2 / 3) return 2;
    return 3;
  }

  /** Fortschrittsmatrix: Spalten je sichtbarem Level, Zeilen je Schüler, Zellen mit Prozent als Text. */
  function matrixTabelle(m, { niveau = 'eA' } = {}) {
    const levels = (m && m.levels) || [];
    const zeilen = (m && m.zeilen) || [];
    if (!zeilen.length) return h('p', { class: 'text-2' }, 'Noch keine Schülerinnen und Schüler.');
    return h(
      'div',
      { class: 'matrix-block' },
      h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'matrix-lehrkraft' },
          h('caption', { class: 'sr' }, 'Fortschritt je Level in Prozent der Level-Punkte'),
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              h('th', { scope: 'col', class: 'matrix-ecke' }, `Niveau: ${niveau === 'gA' ? 'gA' : 'eA'}`),
              levels.map((l) => h('th', { scope: 'col', title: l.titel, 'data-epoche': l.welt >= 0 && l.welt <= 6 ? String(l.welt) : null }, h('span', { 'aria-hidden': 'true' }, l.nr || l.id), h('span', { class: 'sr' }, `${l.nr || l.id} ${l.titel}`)))
            )
          ),
          h(
            'tbody',
            null,
            zeilen.map((z) =>
              h(
                'tr',
                { class: z.aktiv === false ? 'inaktiv' : null },
                h('th', { scope: 'row' }, z.name, z.aktiv === false ? h('span', { class: 'klein text-2 inaktiv-hinweis' }, ' – nicht mehr im Kurs') : null),
                (z.werte || []).map((w) => {
                  const st = stufe(w.anteil);
                  return h('td', { class: `matrix-zelle stufe-${st}`, title: `${w.punkte} Punkte · ${w.geloest} gelöst${w.angesehen ? ` · ${w.angesehen} Lösung angesehen` : ''}` }, st === 0 ? '—' : KR.prozent(w.anteil));
                })
              )
            )
          )
        )
      ),
      h(
        'p',
        { class: 'matrix-legende klein text-2' },
        'Anteil der Level-Punkte: ',
        [['stufe-0', '— nichts'], ['stufe-1', 'unter 34 %'], ['stufe-2', '34–66 %'], ['stufe-3', 'über 66 %'], ['stufe-4', '100 %']].map(([k, t]) => h('span', { class: `legende-feld ${k}` }, t))
      )
    );
  }

  /** Boss-Ergebnisse: bester Versuch je Schüler und Welt. */
  function bossTabelle(b) {
    const welten = (b && b.welten) || [];
    const zeilen = (b && b.zeilen) || [];
    if (!welten.length || !zeilen.length) return h('p', { class: 'text-2' }, 'Noch keine Boss-Kämpfe.');
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'boss-tabelle' },
        h('caption', { class: 'sr' }, 'Boss-Ergebnisse (bester Versuch)'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Name'), welten.map((w) => h('th', { scope: 'col' }, `Welt ${w.nr}: ${w.titel}`)))),
        h(
          'tbody',
          null,
          zeilen.map((z) =>
            h(
              'tr',
              { class: z.aktiv === false ? 'inaktiv' : null },
              h('th', { scope: 'row' }, z.name, z.aktiv === false ? h('span', { class: 'klein text-2' }, ' – nicht mehr im Kurs') : null),
              (z.werte || []).map((v) => h('td', null, v ? `${v.punkte}/${v.max} (${v.versuche} ${v.versuche === 1 ? 'Versuch' : 'Versuche'})` : '—'))
            )
          )
        )
      )
    );
  }

  /** Fallen-Profil des Kurses: je Falle Fehlversuche (Balken + Text) und betroffene Schüler. */
  function fallenProfil(f) {
    const liste = Array.isArray(f) ? f : [];
    const max = Math.max(1, ...liste.map((x) => x.fehlversuche || 0));
    return h(
      'ul',
      { class: 'fallen-profil' },
      liste.map((x) =>
        h(
          'li',
          { class: x.fehlversuche ? null : 'leer' },
          h('a', { class: 'chip chip-falle', href: `/themen#fallen-${x.p}` }, `${x.p} ${KR.FALLEN[x.p] || x.titel || ''}`.trim()),
          AQ.progress((x.fehlversuche || 0) / max, 'fallen-balken'),
          h('span', { class: 'klein' }, `${x.fehlversuche || 0} Fehlversuche · ${x.schueler || 0} von ${x.schuelerGesamt || 0} Schülern`)
        )
      )
    );
  }

  /** Aufgabenstatistik: nur bearbeitete Aufgaben, schwierigste zuerst; häufigste falsche Antworten als Text. */
  function aufgabenStatistik(liste) {
    const bearbeitet = (Array.isArray(liste) ? liste : []).filter((a) => a.versucht > 0).sort((a, b) => (a.quote ?? 1) - (b.quote ?? 1) || b.versucht - a.versucht);
    if (!bearbeitet.length) return h('p', { class: 'text-2' }, 'Noch keine Aufgabe bearbeitet.');
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'aufgaben-statistik' },
        h('caption', { class: 'sr' }, 'Aufgabenstatistik, schwierigste zuerst'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Aufgabe'), h('th', { scope: 'col', class: 'zahl' }, 'versucht'), h('th', { scope: 'col', class: 'zahl' }, 'Lösungsquote'), h('th', { scope: 'col', class: 'zahl' }, 'Ø Fehlversuche'), h('th', { scope: 'col' }, 'häufige falsche Antworten'))),
        h(
          'tbody',
          null,
          bearbeitet.map((a) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, h('a', { href: `#/vorschau/aufgabe/${enc(a.id)}` }, a.titel), h('div', { class: 'klein text-2 mono' }, a.id)),
              h('td', { class: 'zahl' }, String(a.versucht)),
              h('td', { class: 'zahl' }, a.quote === null ? '–' : KR.prozent(a.quote)),
              h('td', { class: 'zahl' }, a.fehlversucheSchnitt === null ? '–' : (Math.round(a.fehlversucheSchnitt * 10) / 10).toLocaleString('de-DE')),
              h('td', null, (a.falscheAntworten || []).length ? h('ul', { class: 'falsche-antworten' }, a.falscheAntworten.map((f) => h('li', null, h('code', null, f.antwort), ` × ${f.anzahl}`))) : '–')
            )
          )
        )
      )
    );
  }

  function csvKnoepfe(kursId) {
    return h(
      'p',
      { class: 'knopf-reihe' },
      [['uebersicht', 'Übersicht (CSV)'], ['matrix', 'Matrix (CSV)'], ['aufgaben', 'Aufgaben (CSV)']].map(([art, text]) =>
        h('a', { class: 'knopf knopf-zweit', href: `/api/lehrer/kurse/${enc(kursId)}/export.csv?art=${art}`, download: '' }, KR.symbol('icons', 'i-download'), text)
      )
    );
  }

  tab('auswertung', 'Auswertung', async (kurs, box) => {
    const d = await api('GET', `/api/lehrer/kurse/${enc(kurs.id)}/auswertung`);
    mount(
      box,
      h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-matrix' }, h('h2', { id: 'aw-matrix' }, 'Fortschritt je Level'), matrixTabelle(d.matrix, { niveau: d.niveau })),
      h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-fallen' }, h('h2', { id: 'aw-fallen' }, 'Fallen-Profil des Kurses'), h('p', { class: 'klein text-2' }, 'Fehlversuche mit erkannter Falle (Diagnose der Prüfer). Der Link führt zur Erläuterung.'), fallenProfil(d.fallen)),
      h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-boss' }, h('h2', { id: 'aw-boss' }, 'Boss-Ergebnisse'), bossTabelle(d.boss)),
      h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-aufgaben' }, h('h2', { id: 'aw-aufgaben' }, 'Aufgabenstatistik'), aufgabenStatistik(d.aufgaben)),
      h('section', { class: 'auswertung-teil', 'aria-labelledby': 'aw-csv' }, h('h2', { id: 'aw-csv' }, 'Export'), csvKnoepfe(kurs.id))
    );
  });

  /* ---------- Tab Scoreboard (Task 63) ---------- */

  function scoreboardTabelle(sb) {
    const liste = (sb && sb.liste) || [];
    if (!liste.length) return h('p', { class: 'text-2' }, 'Noch keine Punkte.');
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'scoreboard-tabelle' },
        h('caption', { class: 'sr' }, 'Scoreboard des Kurses'),
        h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'zahl' }, 'Platz'), h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col', class: 'zahl' }, 'Punkte'), h('th', { scope: 'col', class: 'zahl' }, 'gelöst'), h('th', { scope: 'col', class: 'zahl' }, 'Abzeichen'))),
        h(
          'tbody',
          null,
          liste.map((r) =>
            h(
              'tr',
              { class: r.aktiv === false ? 'inaktiv' : null },
              h('td', { class: 'zahl' }, `${r.platz}.`),
              h('th', { scope: 'row' }, r.name, r.aktiv === false ? h('span', { class: 'klein text-2' }, ' – nicht mehr im Kurs') : null),
              h('td', { class: 'zahl' }, String(r.punkte)),
              h('td', { class: 'zahl' }, String(r.geloest || 0)),
              h('td', { class: 'zahl' }, String(r.abzeichen || 0))
            )
          )
        )
      )
    );
  }

  tab('scoreboard', 'Scoreboard', async (kurs, box, { r }) => {
    const pfad = `/api/lehrer/kurse/${enc(kurs.id)}/scoreboard`;
    const ziel = h('div', { 'aria-live': 'polite' }, scoreboardTabelle(await api('GET', pfad)));
    mount(box, h('p', { class: 'klein text-2' }, 'Aktualisiert sich alle 20 Sekunden. Das Beamer-Board schalten Sie unter „Einstellungen“ ein.'), ziel);
    const t = setInterval(async () => {
      if (!r.gueltig()) return clearInterval(t);
      try {
        mount(ziel, scoreboardTabelle(await api('GET', pfad)));
      } catch {
        /* nächster Versuch */
      }
    }, 20000);
    beimVerlassen(() => clearInterval(t));
  });

  /* ---------- Vorschau (Task 63) ---------- */

  const istEpoche = (nr) => Number.isInteger(nr) && nr >= 0 && nr <= 6;
  const vorschauNiveau = (n) => AQ.niveau(n || 'kern', { vorschau: true });

  function aufgabeZeile(a) {
    return h(
      'li',
      { class: 'vorschau-aufgabe' },
      h('a', { href: `#/vorschau/aufgabe/${enc(a.id)}` }, a.titel),
      h('span', { class: 'aufgabe-meta' }, AQ.sterne(a.stufe), h('span', { class: 'klein text-2' }, ` ${a.punkte} P. · ${KR.KATEGORIEN[a.kategorie] || a.kategorie}`)),
      vorschauNiveau(a.niveau),
      a.gAAusgeblendet && a.niveau !== 'eA' ? h('span', { class: 'klein text-2' }, 'im gA-Kurs ausgeblendet') : null,
      (a.fallen || []).map((p) => KRDiag.chip(p)),
      h('span', { class: 'klein text-2 mono' }, a.id)
    );
  }

  async function vorschauRoute(teile, r) {
    const [art, wert] = teile;
    if (art === 'aufgabe' && wert) return vorschauAufgabe(wert, r);
    const d = await api('GET', '/api/lehrer/vorschau');
    if (!r.gueltig()) return;
    const welten = d.welten || [];
    if (art === 'welt') {
      const w = welten.find((x) => String(x.nr) === String(wert));
      if (!w) return fehler(new Error('Diese Welt gibt es nicht.'), { href: '#/vorschau', text: 'Zur Aufgaben-Übersicht' });
      KR.epoche(w.nr, { farbe: w.farbe, akzentHell: w.akzentHell });
      KRKopf.epoche(w.titel);
      return seite(
        `Vorschau ${w.titel}`,
        h(
          'div',
          { class: 'wrap lehrer-seite vorschau' },
          h('nav', { class: 'brotkrumen', 'aria-label': 'Brotkrümel' }, h('a', { href: '#/vorschau' }, 'Aufgaben'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', { 'aria-current': 'page' }, `Welt ${w.nr}`)),
          h('h1', null, `Welt ${w.nr} · ${w.titel}`),
          h('p', { class: 'text-2 lesen' }, 'Vorschau mit allen Inhalten und Lösungen. Niveau-Chips zeigen, was ein gA-Kurs nicht sieht.'),
          w.archivfund && w.archivfund.aufgabe
            ? h('section', { class: 'karte archivfund-karte' }, h('span', { class: 'etikett' }, 'Archivfund'), h('h2', null, w.archivfund.titel || w.archivfund.aufgabe.titel), h('p', null, h('a', { href: `#/vorschau/aufgabe/${enc(w.archivfund.aufgabe.id)}` }, 'Archivfund ansehen')))
            : null,
          (w.levels || []).map((l) =>
            h(
              'section',
              { class: 'karte vorschau-level', 'aria-labelledby': `vl-${l.id}` },
              h(
                'div',
                { class: 'vorschau-level-kopf' },
                h('h2', { id: `vl-${l.id}` }, h('span', { class: 'mono' }, l.nr || l.id), ' ', l.titel),
                vorschauNiveau(l.niveau),
                l.rolle ? h('span', { class: 'chip chip-rolle rolle-' + l.rolle }, AQ.rolleText(l.rolle).replace(/^\S+\s/, '')) : null,
                l.gAAusgeblendet && l.niveau !== 'eA' ? h('span', { class: 'klein text-2' }, 'im gA-Kurs ausgeblendet') : null
              ),
              (l.aufgaben || []).length ? h('ol', { class: 'vorschau-aufgaben' }, l.aufgaben.map(aufgabeZeile)) : h('p', { class: 'text-2' }, 'Keine Aufgaben.')
            )
          ),
          w.boss
            ? h('section', { class: 'karte vorschau-level boss-pool', 'aria-labelledby': 'vl-boss' }, h('h2', { id: 'vl-boss' }, `Boss: ${w.boss.titel}`), h('p', { class: 'klein text-2' }, `${w.boss.anzahl} Aufgaben aus dem Pool, ${w.boss.dauerMin} Minuten. Im gA-Kurs zieht der Boss nur Kern-Aufgaben.`), h('ol', { class: 'vorschau-aufgaben' }, (w.boss.pool || []).map(aufgabeZeile)))
            : null
        )
      );
    }
    seite(
      'Aufgaben',
      h(
        'div',
        { class: 'wrap lehrer-seite vorschau' },
        h('h1', null, 'Aufgaben-Vorschau'),
        h('p', { class: 'text-2 lesen' }, 'Alle Welten mit Leveln, Aufgaben und Lösungen – nur für Lehrkräfte. Schülerstände werden dabei nicht verändert.'),
        welten.length
          ? h(
              'ul',
              { class: 'vorschau-welten' },
              welten.map((w) => {
                const li = h(
                  'li',
                  { 'data-epoche': istEpoche(w.nr) ? String(w.nr) : null },
                  h('a', { class: 'karte karte-link', href: `#/vorschau/welt/${w.nr}` }, h('b', null, `Welt ${w.nr} · ${w.titel}`), h('span', { class: 'klein text-2' }, `${(w.levels || []).length} Level · ${w.aufgabenAnzahl || 0} Aufgaben${w.boss ? ' · Boss' : ''}`))
                );
                if (!istEpoche(w.nr) && w.farbe) li.style.setProperty('--akzent', w.farbe);
                return li;
              })
            )
          : h('p', { class: 'text-2' }, 'Noch keine Inhalte geladen.')
      )
    );
  }

  async function vorschauAufgabe(id, r) {
    const d = await api('GET', `/api/lehrer/vorschau/${enc(id)}`);
    if (!r.gueltig()) return;
    const a = d.aufgabe;
    const o = d.ort || {};
    const w = o.welt || { nr: 6, titel: '' };
    KR.epoche(w.nr, { farbe: w.farbe });
    KRKopf.epoche(w.titel);
    const ctrl = AQI.aufgabe(a, { modus: 'vorschau', vorschau: true, zusatz: { werkzeugFrei: () => true } });
    ctrl.loesung(d.loesung, d.muster);
    ctrl.sperren(true);
    const nav = (aid, text) => (aid ? h('a', { class: 'knopf knopf-zweit', href: `#/vorschau/aufgabe/${enc(aid)}` }, text) : null);
    seite(
      `Vorschau ${a.titel}`,
      h(
        'div',
        { class: 'wrap lehrer-seite vorschau aufgabe-seite' },
        h(
          'nav',
          { class: 'brotkrumen', 'aria-label': 'Brotkrümel' },
          h('a', { href: '#/vorschau' }, 'Aufgaben'),
          h('span', { 'aria-hidden': 'true' }, '›'),
          h('a', { href: `#/vorschau/welt/${w.nr}` }, `Welt ${w.nr}`),
          h('span', { 'aria-hidden': 'true' }, '›'),
          h('span', null, o.level ? `${o.level.nr || o.level.id} ${o.level.titel}` : o.boss ? `Boss-Pool: ${o.boss.titel}` : 'Archivfund'),
          o.anzahl ? [h('span', { 'aria-hidden': 'true' }, '›'), h('span', { 'aria-current': 'page' }, `${o.index + 1} von ${o.anzahl}`)] : null
        ),
        h(
          'div',
          { class: 'aufgabe-kopf' },
          h('h1', null, a.titel),
          AQ.sterne(a.stufe),
          h('span', { class: 'pill gold' }, `${a.punkte} ${a.punkte === 1 ? 'Punkt' : 'Punkte'}`),
          a.kategorie ? h('span', { class: 'pill' }, KR.KATEGORIEN[a.kategorie] || a.kategorie) : null,
          vorschauNiveau(a.niveau),
          (a.fallen || []).map((p) => KRDiag.chip(p)),
          h('span', { class: 'chip chip-neutral mono' }, a.id)
        ),
        h('div', { class: 'rueckmeldung info' }, h('p', null, 'Vorschau mit eingesetzter Lösung. Nur lesend – Schülerstände werden nicht verändert.')),
        h('section', { class: 'card' }, ctrl.el),
        d.tipps && d.tipps.length ? h('section', { class: 'card' }, h('h2', null, '💡 Tipps'), d.tipps.map((t, i) => h('div', { class: 'tipp-box' }, h('strong', null, `Tipp ${i + 1}: `), AQR.md(t, null, 'span')))) : null,
        d.erklaerung && d.erklaerung.length ? h('section', { class: 'card erklaerung' }, h('h2', null, '📖 Erklärung'), AQR.bloecke(d.erklaerung, null)) : null,
        h('p', { class: 'knopf-reihe' }, nav(o.vorher, '← vorherige Aufgabe'), h('a', { class: 'knopf knopf-zweit', href: `#/vorschau/welt/${w.nr}` }, 'Übersicht der Welt'), nav(o.nachher, 'nächste Aufgabe →'))
      )
    );
  }

  /* ---------- Materialien (Task 63) ---------- */

  const ART = { praesentation: 'Präsentation', lehrerhinweise: 'Lehrerhinweise', klausur: 'Klausur', loesung: 'Lösung', akte: 'Akte', erwartungshorizont: 'Erwartungshorizont' };

  function materialEintrag(e) {
    return h(
      'li',
      { class: 'material-eintrag' },
      h('b', null, e.titel),
      h('span', { class: 'klein text-2' }, [ART[e.art] || e.art, (e.ds || []).length ? `DS ${e.ds.join(', ')}` : null].filter(Boolean).join(' · ')),
      h(
        'span',
        { class: 'knopf-reihe' },
        (e.dateien || []).map((d) => (d.url ? h('a', { class: 'knopf knopf-zweit', href: d.url, target: '_blank', rel: 'noopener' }, KR.symbol('icons', 'i-download'), d.label || 'PDF') : h('span', { class: 'klein text-2' }, `${d.label || 'Datei'}: noch nicht vorhanden`)))
      )
    );
  }

  async function materialienRoute(_teile, r) {
    const d = await api('GET', '/api/lehrer/materialien');
    if (!r.gueltig()) return;
    const welten = d.welten || [];
    seite(
      'Materialien',
      h(
        'div',
        { class: 'wrap lehrer-seite materialien' },
        h('h1', null, 'Materialien'),
        h('p', { class: 'text-2 lesen' }, 'Präsentationen, Lehrerhinweise, Lösungen und Klausuren – nur für Lehrkräfte. Die Akten für Schülerinnen und Schüler stehen auch auf der Seite „Themen“.'),
        welten.length ? h('nav', { class: 'sprungleiste', 'aria-label': 'Welten' }, welten.map((w) => h('a', { class: 'chip', href: `#material-welt-${w.nr}` }, `Welt ${w.nr}`))) : null,
        (d.allgemein || []).length ? h('section', { class: 'karte', 'aria-labelledby': 'material-allgemein' }, h('h2', { id: 'material-allgemein' }, 'Allgemein'), h('ul', { class: 'material-liste' }, d.allgemein.map(materialEintrag))) : null,
        welten.map((w) =>
          h('section', { class: 'karte material-welt', id: `material-welt-${w.nr}`, 'data-epoche': istEpoche(w.nr) ? String(w.nr) : null, 'aria-labelledby': `material-welt-${w.nr}-titel` }, h('h2', { id: `material-welt-${w.nr}-titel` }, istEpoche(w.nr) ? `Welt ${w.nr} · ${KR.WELTEN_KURZ[w.nr] || 'Die Zeitmaschine'}` : `Welt ${w.nr}`), h('ul', { class: 'material-liste' }, (w.eintraege || []).map(materialEintrag)))
        ),
        !welten.length && !(d.allgemein || []).length ? h('p', { class: 'text-2' }, 'Auf diesem Server liegen noch keine Materialien.') : null
      )
    );
    // Sprunglinks innerhalb der Hash-Route: scrollen statt navigieren
    haupt.querySelectorAll('.sprungleiste a').forEach((a) =>
      a.addEventListener('click', (e) => {
        const ziel = document.getElementById(a.getAttribute('href').slice(1));
        if (!ziel) return;
        e.preventDefault();
        if (typeof ziel.scrollIntoView === 'function') ziel.scrollIntoView();
      })
    );
  }

  /* ---------- Router ---------- */

  ROUTEN.set('', kursliste);
  ROUTEN.set('kurs', kursRoute);
  ROUTEN.set('vorschau', vorschauRoute);
  ROUTEN.set('materialien', materialienRoute);

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
    matrixTabelle,
    bossTabelle,
    fallenProfil,
    aufgabenStatistik,
    scoreboardTabelle,
    sitzung: () => sitzung,
    neu: navigiere
  };
})();
