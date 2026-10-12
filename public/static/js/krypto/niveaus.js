/* Kryptos – Niveau-Übersicht „Was ist für welches Niveau?“ auf /themen#niveaus (VERTRAG labs v1.2 §9).
   Lädt GET /api/niveaus (öffentlich) und baut die Tabellen nur über DOM-Textknoten (AQ.h). Schlichte Fassung bis M4. */
'use strict';

(() => {
  const { h, mount } = AQ;
  const ziel = document.getElementById('niveau-inhalt');
  if (!ziel) return;

  const KURZ = { kern: 'Kern', eA: 'eA', ergaenzung: 'E', kuer: 'Kür' };
  const chip = (n) => h('span', { class: 'niveau-chip niveau-' + n, title: n }, KURZ[n] || n);
  const imKurs = (w) => (w === true ? 'ja (gefordert)' : w === 'frei' ? 'freiwillig' : 'nein (ausgeblendet)');

  /** { kern: 5, eA: 1 } → „5 Kern · 1 eA“ */
  function anzahlen(z) {
    const teile = Object.entries(z || {}).map(([n, a]) => `${a} ${KURZ[n] || n}`);
    return teile.length ? teile.join(' · ') : '–';
  }

  /** Spalten der Kurzübersicht: welche Level einer Welt für gA und eA, nur eA, freiwillig */
  function kurzuebersicht(d) {
    const zelle = (levels) => (levels.length ? h('ul', null, levels.map((l) => h('li', null, h('strong', null, l.id), ' ', l.titel.replace(/^Kür:\s*/, '')))) : '–');
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'niveau-tabelle' },
        h('caption', { class: 'klein' }, 'Level je Welt und Niveau'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Welt'), h('th', { scope: 'col' }, 'gA und eA (Kern)'), h('th', { scope: 'col' }, 'nur eA'), h('th', { scope: 'col' }, 'freiwillig (Kür)'))),
        h(
          'tbody',
          null,
          d.welten.map((w) =>
            h(
              'tr',
              null,
              h('th', { scope: 'row' }, h('a', { href: '#niveau-welt-' + w.nr }, `Welt ${w.nr}`), h('div', { class: 'klein' }, w.titel)),
              h('td', null, zelle(w.levels.filter((l) => l.niveau === 'kern' || l.niveau === 'ergaenzung'))),
              h('td', null, zelle(w.levels.filter((l) => l.niveau === 'eA'))),
              h('td', null, zelle(w.levels.filter((l) => l.niveau === 'kuer')))
            )
          )
        )
      )
    );
  }

  /** Legende mit „im gA-Kurs / im eA-Kurs“ */
  function kategorien(d) {
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'niveau-tabelle' },
        h('caption', { class: 'klein' }, 'Niveau-Kennzeichen und Kursart'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Kennzeichen'), h('th', { scope: 'col' }, 'Bedeutung'), h('th', { scope: 'col' }, 'im gA-Kurs'), h('th', { scope: 'col' }, 'im eA-Kurs'))),
        h('tbody', null, d.kategorien.map((k) => h('tr', null, h('td', null, chip(k.id)), h('td', null, k.lang), h('td', null, imKurs(k.gA)), h('td', null, imKurs(k.eA)))))
      )
    );
  }

  function welt(w) {
    const zeilen = w.levels.map((l) =>
      h(
        'tr',
        null,
        h('th', { scope: 'row' }, l.id),
        h('td', null, l.titel),
        h('td', null, chip(l.niveau)),
        h('td', null, anzahlen(l.aufgaben), l.hinweis ? h('div', { class: 'klein' }, l.hinweis) : null),
        h('td', null, l.akte ? [l.akte.name, l.akte.hinweis ? h('div', { class: 'klein' }, l.akte.hinweis) : null] : '–')
      )
    );
    return h(
      'section',
      { id: 'niveau-welt-' + w.nr, 'aria-labelledby': 'niveau-welt-titel-' + w.nr },
      h('h3', { class: 'niveau-welt', id: 'niveau-welt-titel-' + w.nr, style: { '--welt': w.farbe } }, `Welt ${w.nr} · ${w.titel}`, w.epoche ? h('div', { class: 'klein' }, w.epoche) : null),
      h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'niveau-tabelle' },
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Level'), h('th', { scope: 'col' }, 'Titel'), h('th', { scope: 'col' }, 'Niveau'), h('th', { scope: 'col' }, 'Lab-Aufgaben'), h('th', { scope: 'col' }, 'Akte'))),
          h('tbody', null, zeilen)
        )
      ),
      w.boss ? h('p', { class: 'klein' }, `Online-Boss „${w.boss.titel}“ – Aufgaben-Pool: ${anzahlen(w.boss.pool)}. Im gA-Kurs zieht der Boss nur Kern-Aufgaben.`) : null
    );
  }

  function weitere(d) {
    return h('dl', { class: 'niveau-legende' }, d.weitere.map((x) => [h('dt', null, h('strong', null, x.titel)), h('dd', null, x.text)]));
  }

  fetch('/api/niveaus', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then((r) => {
      if (!r.ok) throw new Error('Status ' + r.status);
      return r.json();
    })
    .then((d) =>
      mount(
        ziel,
        h('h3', null, 'Kennzeichen und Kursart'),
        kategorien(d),
        h('h3', null, 'Level je Welt'),
        kurzuebersicht(d),
        d.welten.map(welt),
        h('h3', null, 'Materialien und Funktionen'),
        weitere(d)
      )
    )
    .catch(() => mount(ziel, h('p', { class: 'hinweis' }, 'Die Niveau-Übersicht konnte nicht geladen werden. Bitte lade die Seite neu.')));
})();
