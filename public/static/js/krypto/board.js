/* Kryptos – Beamer-Board /board/<schluessel> (M4 Task 61, Design §2.4): öffentliches Scoreboard eines Kurses auf
   --nacht, 1920 × 1080 ohne Scrollen bei ≤ 30 Zeilen. GET /api/board/<schluessel> alle 20 s; Tabelle Platz · Name ·
   Punkte · Gelöst (· Rang, wenn der Server ihn liefert), Welt-Fortschritt je Epoche (Balken + Prozent als Text), Erfolge-Ticker (aria-live). Keine Kopfzeile
   (Beamer), keine Anmeldung. Texte nur als Textknoten. */
'use strict';

const KRBoard = (() => {
  const { h, mount } = AQ;
  const INTERVALL = 20000;
  let haupt = null;
  let timer = null;

  function schluessel() {
    const m = /^\/board\/([^/]+)\/?$/.exec(location.pathname || '');
    try {
      return m ? decodeURIComponent(m[1]) : '';
    } catch {
      return '';
    }
  }

  function liste(d) {
    const zeilen = (d.liste || []).slice(0, 30);
    const mitRang = zeilen.some((r) => r.rang);
    if (!zeilen.length) return h('p', { class: 'leer-zustand' }, 'Noch keine Punkte – das Board füllt sich mit den ersten gelösten Aufgaben.');
    return h(
      'table',
      { class: 'board-liste' },
      h('caption', { class: 'sr' }, 'Rangliste des Kurses'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Platz'), h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col', class: 'zahl' }, 'Punkte'), h('th', { scope: 'col', class: 'zahl' }, 'Gelöst'), mitRang ? h('th', { scope: 'col' }, 'Rang') : null)),
      h(
        'tbody',
        null,
        zeilen.map((r) =>
          h(
            'tr',
            { class: r.platz <= 3 ? `podest platz-${r.platz}` : null },
            h('td', { class: 'zahl board-platz' }, r.platz <= 3 ? `${r.platz}. ★` : `${r.platz}.`),
            h('td', { class: 'board-name' }, r.name),
            h('td', { class: 'zahl' }, String(r.punkte)),
            h('td', { class: 'zahl' }, String(r.geloest || 0)),
            mitRang ? h('td', null, r.rang || '') : null
          )
        )
      )
    );
  }

  function welten(d) {
    const ws = d.welten || [];
    if (!ws.length) return null;
    return h(
      'section',
      { class: 'board-welten', 'aria-labelledby': 'board-welten-titel' },
      h('h2', { id: 'board-welten-titel', class: 'etikett' }, 'Fortschritt je Epoche'),
      h(
        'ul',
        null,
        ws.map((w) => {
          const li = h(
            'li',
            { class: 'board-welt', 'data-epoche': w.nr >= 0 && w.nr <= 6 ? String(w.nr) : null },
            h('span', { class: 'board-welt-titel' }, w.titel),
            AQ.progress(w.anteil),
            h('span', { class: 'zahl board-welt-wert' }, KR.prozent(w.anteil))
          );
          if (!(w.nr >= 0 && w.nr <= 6) && w.farbe) li.style.setProperty('--akzent-hell', w.farbe);
          return li;
        })
      )
    );
  }

  function erfolge(d) {
    const liste = d.erfolge || [];
    return h(
      'section',
      { class: 'board-erfolge', 'aria-labelledby': 'board-erfolge-titel' },
      h('h2', { id: 'board-erfolge-titel', class: 'etikett' }, 'Neueste Erfolge'),
      h('ul', { 'aria-live': 'polite' }, liste.length ? liste.map((e) => h('li', null, e.text)) : h('li', { class: 'text-2' }, 'Noch keine Erfolge.'))
    );
  }

  function zeige(d) {
    document.title = `Scoreboard ${d.kurs && d.kurs.name ? d.kurs.name : ''} · Kryptos`.replace('  ', ' ');
    mount(
      haupt,
      h(
        'div',
        { class: 'board nacht textur' },
        h(
          'header',
          { class: 'board-kopf' },
          h('span', { class: 'logo', 'aria-hidden': 'true' }, KR.symbol('icons', 'logo-ring'), h('span', null, 'KRYPTOS')),
          h('h1', null, d.kurs && d.kurs.name ? d.kurs.name : 'Scoreboard'),
          h('p', { class: 'board-meta' }, `${d.schueler || 0} ${d.schueler === 1 ? 'Chronist' : 'Chronistinnen und Chronisten'} · aktualisiert alle 20 Sekunden`)
        ),
        h('div', { class: 'board-raster' }, h('section', { class: 'board-tabelle', 'aria-label': 'Rangliste' }, liste(d)), h('div', { class: 'board-seite' }, welten(d), erfolge(d)))
      )
    );
  }

  function nichtGefunden() {
    if (timer) clearInterval(timer);
    timer = null;
    document.title = 'Kein Board · Kryptos';
    mount(
      haupt,
      h('div', { class: 'board nacht textur' }, h('div', { class: 'board-leer' }, h('h1', null, 'Scoreboard'), h('p', null, 'Kein Board für diesen Schlüssel (oder im Kurs ausgeschaltet).'), h('p', null, h('a', { class: 'knopf knopf-zweit', href: '/' }, 'Zur Startseite'))))
    );
  }

  async function laden() {
    const k = schluessel();
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(k)) return nichtGefunden();
    try {
      zeige(await AQ.api('GET', `/api/board/${encodeURIComponent(k)}`));
    } catch (e) {
      if (e && e.status === 404) return nichtGefunden();
      // Netzfehler: letzte Anzeige stehen lassen; ohne Anzeige Fehler zeigen
      if (!haupt.querySelector('.board')) KR.fehler(haupt, e);
    }
  }

  async function start() {
    haupt = document.getElementById('haupt');
    KR.epoche(6);
    document.documentElement.classList.add('beamer-seite');
    await laden();
    if (haupt.querySelector('.board-leer')) return;
    timer = setInterval(laden, INTERVALL);
  }
  document.addEventListener('DOMContentLoaded', start);

  return { schluessel };
})();
