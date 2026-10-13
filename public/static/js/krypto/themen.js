/* Kryptos – Themen und Niveaus /themen (M4 Task 61, VERTRAG labs v1.2 §9): öffentliche Übersicht ohne Lösungen.
   Feste Anker: #welten (je Welt #welt-<nr>), #niveaus („Was ist für welches Niveau?“, Daten GET /api/niveaus),
   #kategorien, #fallen (je Falle #fallen-P1 … #fallen-P10 – Ziel der Diagnose-Chips), #werkzeuge.
   Daten: GET /api/themen und GET /api/niveaus. Fehlt ein Abschnitt im HTML, wird er angelegt. Texte nur als Textknoten.
   Kein externer Link auf die Krypto-Werkstatt, bis die Erlaubnis geklärt ist (Design O11, M4 Festlegung 7). */
'use strict';

const KRThemen = (() => {
  const { h, mount } = AQ;

  /** Behälter der Abschnitte: .themen im #haupt (HTML), sonst #haupt selbst. */
  function behaelter() {
    const haupt = document.getElementById('haupt');
    return (haupt && haupt.querySelector('.themen')) || haupt;
  }

  /** Abschnitt #id holen oder anlegen; Inhalt kommt in #<id>-inhalt (ebenso). */
  function abschnitt(id, titel) {
    let sek = document.getElementById(id);
    if (!sek) {
      sek = h('section', { id, class: 'themen-abschnitt', 'aria-labelledby': `${id}-titel` }, h('h2', { id: `${id}-titel` }, titel));
      behaelter().appendChild(sek);
    }
    let inhalt = document.getElementById(`${id}-inhalt`);
    if (!inhalt) {
      inhalt = h('div', { id: `${id}-inhalt` });
      sek.appendChild(inhalt);
    }
    return inhalt;
  }

  const chip = (n) => AQ.niveau(n);
  const istEpoche = (nr) => Number.isInteger(nr) && nr >= 0 && nr <= 6;

  /* ---------- #welten ---------- */

  function akte(l) {
    const b = l.abBlatt;
    if (!b) return null;
    if (b.url) return h('a', { class: 'akte-link', href: b.url }, KR.symbol('icons', 'i-download'), b.titel, ' (PDF)');
    return h('span', { class: 'text-2' }, b.titel, ' – nach der Anmeldung');
  }

  function weltAbschnitt(w) {
    const attrs = { id: `welt-${w.nr}`, class: 'themen-welt karte', 'data-epoche': String(w.nr), 'aria-labelledby': `welt-${w.nr}-titel` };
    const sek = h(
      'section',
      attrs,
      h('h3', { id: `welt-${w.nr}-titel` }, istEpoche(w.nr) ? `Welt ${w.nr} · ${w.titel}` : w.titel),
      w.ds ? h('p', { class: 'text-2 klein' }, `Doppelstunden ${w.ds[0]}–${w.ds[1]}`) : null,
      h(
        'ul',
        { class: 'themen-level' },
        (w.levels || []).map((l) =>
          h(
            'li',
            null,
            h('span', { class: 'mono themen-nr' }, l.nr || l.id),
            h(
              'span',
              { class: 'themen-level-rumpf' },
              h('span', { class: 'themen-level-titel' }, l.titel),
              chip(l.niveau),
              h('span', { class: 'text-2 klein' }, `${l.aufgaben} ${l.aufgaben === 1 ? 'Aufgabe' : 'Aufgaben'}`),
              akte(l)
            )
          )
        )
      ),
      h(
        'dl',
        { class: 'themen-extras' },
        w.boss ? [h('dt', null, 'Boss'), h('dd', null, `${w.boss.titel} – ${w.boss.anzahl} Aufgaben, ${w.boss.dauerMin} Minuten`)] : null,
        w.training && w.training.length ? [h('dt', null, 'Trainingsplatz'), h('dd', null, w.training.join(' · '))] : null,
        [h('dt', null, 'Warm-up'), h('dd', null, w.warmup ? `${w.warmup} Karten` : 'noch keine Karten')],
        (w.weitere || []).length
          ? [h('dt', null, 'Weitere Akten'), h('dd', null, h('ul', { class: 'themen-weitere' }, w.weitere.map((x) => h('li', null, x.url ? h('a', { href: x.url }, x.titel) : x.titel))))]
          : null
      )
    );
    if (!istEpoche(w.nr) && w.farbe) sek.style.setProperty('--akzent', w.farbe);
    return sek;
  }

  function welten(d) {
    const liste = d.welten || [];
    mount(
      abschnitt('welten', 'Epochen und Level'),
      liste.length ? liste.map(weltAbschnitt) : h('p', { class: 'text-2' }, 'Noch keine Epochen geladen.'),
      h('p', { class: 'text-2 klein' }, 'Akten (Arbeitsblätter) stehen nach der Anmeldung als PDF bereit. Lösungen gibt es nur für Lehrkräfte.')
    );
  }

  /* ---------- #niveaus ---------- */

  const imKurs = (w) => (w === true ? 'ja (gefordert)' : w === 'frei' ? 'freiwillig' : 'nein (ausgeblendet)');
  const KURZ = { kern: 'Kern', eA: 'eA', ergaenzung: 'E', kuer: 'Kür' };

  function anzahlen(z) {
    const teile = Object.entries(z || {}).map(([n, a]) => `${a} ${KURZ[n] || n}`);
    return teile.length ? teile.join(' · ') : '–';
  }

  function tabelle(caption, kopf, zeilen) {
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'niveau-tabelle' },
        caption ? h('caption', { class: 'klein' }, caption) : null,
        h('thead', null, h('tr', null, kopf.map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', null, zeilen)
      )
    );
  }

  function niveauKategorien(d) {
    return tabelle(
      'Niveau-Kennzeichen und Kursart',
      ['Kennzeichen', 'Bedeutung', 'im gA-Kurs', 'im eA-Kurs'],
      (d.kategorien || []).map((k) => h('tr', null, h('td', null, chip(k.id)), h('td', null, k.lang), h('td', null, imKurs(k.gA)), h('td', null, imKurs(k.eA))))
    );
  }

  function kurzuebersicht(d) {
    const zelle = (levels) => (levels.length ? h('ul', null, levels.map((l) => h('li', null, h('strong', null, l.id), ' ', l.titel.replace(/^Kür:\s*/, '')))) : '–');
    return tabelle(
      'Level je Welt und Niveau',
      ['Welt', 'gA und eA (Kern)', 'nur eA', 'freiwillig (Kür)'],
      (d.welten || []).map((w) =>
        h(
          'tr',
          null,
          h('th', { scope: 'row' }, h('a', { href: `#niveau-welt-${w.nr}` }, `Welt ${w.nr}`), h('div', { class: 'klein' }, w.titel)),
          h('td', null, zelle(w.levels.filter((l) => l.niveau === 'kern' || l.niveau === 'ergaenzung'))),
          h('td', null, zelle(w.levels.filter((l) => l.niveau === 'eA'))),
          h('td', null, zelle(w.levels.filter((l) => l.niveau === 'kuer')))
        )
      )
    );
  }

  function niveauWelt(w) {
    const sek = h(
      'section',
      { id: `niveau-welt-${w.nr}`, class: 'niveau-welt-abschnitt', 'data-epoche': istEpoche(w.nr) ? String(w.nr) : null, 'aria-labelledby': `niveau-welt-titel-${w.nr}` },
      h('h4', { class: 'niveau-welt', id: `niveau-welt-titel-${w.nr}` }, `Welt ${w.nr} · ${w.titel}`, w.epoche ? h('div', { class: 'klein' }, w.epoche) : null),
      tabelle(
        null,
        ['Level', 'Titel', 'Niveau', 'Lab-Aufgaben', 'Akte'],
        w.levels.map((l) =>
          h(
            'tr',
            null,
            h('th', { scope: 'row' }, l.id),
            h('td', null, l.titel),
            h('td', null, chip(l.niveau)),
            h('td', null, anzahlen(l.aufgaben), l.hinweis ? h('div', { class: 'klein' }, l.hinweis) : null),
            h('td', null, l.akte ? [l.akte.name, l.akte.hinweis ? h('div', { class: 'klein' }, l.akte.hinweis) : null] : '–')
          )
        )
      ),
      w.boss ? h('p', { class: 'klein' }, `Online-Boss „${w.boss.titel}“ – Aufgaben-Pool: ${anzahlen(w.boss.pool)}. Im gA-Kurs zieht der Boss nur Kern-Aufgaben.`) : null
    );
    if (!istEpoche(w.nr) && w.farbe) sek.style.setProperty('--akzent', w.farbe);
    return sek;
  }

  function niveaus(d) {
    mount(
      document.getElementById('niveau-inhalt'),
      h('h3', null, 'Kennzeichen und Kursart'),
      niveauKategorien(d),
      h('h3', null, 'Level je Welt'),
      kurzuebersicht(d),
      (d.welten || []).map(niveauWelt),
      (d.weitere || []).length ? [h('h3', null, 'Materialien und Funktionen'), h('dl', { class: 'niveau-legende' }, d.weitere.map((x) => [h('dt', null, h('strong', null, x.titel)), h('dd', null, x.text)]))] : null
    );
  }

  /** #niveau-inhalt liegt im statischen Abschnitt #niveaus (HTML); fehlt er, wird er dort angelegt. */
  function niveauZiel() {
    if (document.getElementById('niveau-inhalt')) return;
    let sek = document.getElementById('niveaus');
    if (!sek) {
      sek = h('section', { id: 'niveaus', class: 'themen-abschnitt', 'aria-labelledby': 'niveaus-titel' }, h('h2', { id: 'niveaus-titel' }, 'Was ist für welches Niveau?'));
      behaelter().appendChild(sek);
    }
    sek.appendChild(h('div', { id: 'niveau-inhalt', 'aria-live': 'polite' }));
  }

  /* ---------- #kategorien, #fallen ---------- */

  const ortText = (o) => `Welt ${o.welt} · ${o.nr || o.id} ${o.titel}${o.anzahl > 1 ? ` (${o.anzahl})` : ''}`;

  function kategorien(d) {
    const liste = d.kategorien || [];
    mount(
      abschnitt('kategorien', 'Aufgaben nach Art'),
      liste.length
        ? h(
            'ul',
            { class: 'themen-querschnitt' },
            liste.map((k) =>
              h('li', { class: 'karte' }, h('b', null, KR.KATEGORIEN[k.kategorie] || k.kategorie), h('span', { class: 'text-2 klein' }, ` · ${k.anzahl} ${k.anzahl === 1 ? 'Aufgabe' : 'Aufgaben'}`), h('p', { class: 'klein' }, k.orte.map(ortText).join(' · ')))
            )
          )
        : h('p', { class: 'text-2' }, 'Noch keine Aufgaben.')
    );
  }

  function fallen(d) {
    mount(
      abschnitt('fallen', 'Typische Fallen P1–P10'),
      h('p', { class: 'text-2' }, 'Diese Fehler passieren in Klausuren am häufigsten. Die Rückmeldungen im Lab verweisen hierher.'),
      h(
        'div',
        { class: 'fallen-raster' },
        (d.fallen || []).map((f) =>
          h(
            'article',
            { id: `fallen-${f.p}`, class: 'karte falle-karte', 'aria-labelledby': `fallen-${f.p}-titel` },
            h('h3', { id: `fallen-${f.p}-titel` }, h('span', { class: 'chip chip-falle' }, f.p), ' ', f.titel || KR.FALLEN[f.p] || ''),
            f.text ? h('p', null, f.text) : null,
            h('p', { class: 'text-2 klein' }, f.anzahl ? `${f.anzahl} ${f.anzahl === 1 ? 'Aufgabe übt' : 'Aufgaben üben'} diese Falle: ${(f.orte || []).map(ortText).join(' · ')}` : 'Noch keine Lab-Aufgabe zu dieser Falle.')
          )
        )
      )
    );
  }

  /* ---------- #werkzeuge ---------- */

  function werkzeuge() {
    const ziel = abschnitt('werkzeuge', 'Werkzeuge');
    if (ziel.firstChild) return; // statischer Text im HTML
    mount(
      ziel,
      h('p', null, 'Im Kryptolabor gibt es Werkzeuge zum Ausprobieren – von der Chiffrierscheibe bis zum Häufigkeits-Analysator. Sie stehen nach der Anmeldung bereit; die Lehrkraft schaltet sie je Kurs frei. Im Boss-Kampf ist das Labor geschlossen.'),
      h('p', null, h('a', { class: 'knopf knopf-zweit', href: '/gast' }, 'Im Gastmodus ausprobieren'))
    );
  }

  /** Nach dem Laden zum Anker der Adresse springen (Inhalte kommen asynchron). */
  function zumAnker() {
    const id = (location.hash || '').replace(/^#/, '');
    if (!id) return;
    let el = null;
    try {
      el = document.getElementById(decodeURIComponent(id));
    } catch {
      el = null;
    }
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView();
  }

  async function start() {
    KR.epoche(6);
    const sitzung = await AQ.api('GET', '/api/sitzung').catch(() => ({}));
    const rolle = sitzung && ['schueler', 'lehrkraft', 'superadmin'].includes(sitzung.rolle) ? sitzung.rolle : null;
    KRKopf.baue({ rolle, aktiv: rolle ? null : 'themen', sitzung: sitzung || {} });
    const laden = document.querySelector('#haupt > .laden');
    if (laden) laden.remove();
    niveauZiel();
    const [t, n] = await Promise.all([AQ.api('GET', '/api/themen').catch((e) => e), AQ.api('GET', '/api/niveaus').catch((e) => e)]);
    if (t instanceof Error) KR.fehler(abschnitt('welten', 'Epochen und Level'), new Error('Die Themen konnten nicht geladen werden. Bitte lade die Seite neu.'));
    else {
      welten(t);
      kategorien(t);
      fallen(t);
    }
    if (n instanceof Error) KR.fehler(document.getElementById('niveau-inhalt'), new Error('Die Niveau-Übersicht konnte nicht geladen werden. Bitte lade die Seite neu.'));
    else niveaus(n);
    werkzeuge();
    zumAnker();
  }
  document.addEventListener('DOMContentLoaded', start);

  return { start };
})();
