/* Kryptos – Beamer-Ansicht /beamer/funkraum/:id und /beamer/arena/:id (Gerüst M4, E20): Nacht-Vollbild ohne Kopfzeile,
   Titel aus dem Pfad, Leerzustand. Keine API-Aufrufe – die Funkraum-/Arena-API entsteht in M7. */
'use strict';

const KRBeamer = (() => {
  const { h } = AQ;
  const TITEL = { funkraum: 'Funkraum', arena: 'Knack-Arena' };

  /** Art aus dem Pfad: 'funkraum' | 'arena' | null */
  function art(pfad = location.pathname) {
    const m = /^\/beamer\/(funkraum|arena)\/\d+$/.exec(pfad);
    return m ? m[1] : null;
  }

  function start() {
    const haupt = document.getElementById('haupt');
    const titel = TITEL[art()] || 'Beamer';
    document.title = `${titel} · Beamer · Kryptos`;
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'beamer-flaeche' },
        h('div', { class: 'beamer-titel' }, KR.symbol('icons', 'logo-ring'), h('h1', null, titel)),
        h(
          'div',
          { class: 'leer-zustand' },
          KR.ornament(6),
          h('p', null, 'Kein laufendes Szenario.'),
          h('a', { class: 'knopf knopf-zweit', href: '/lehrer#/' }, 'Zurück zur Lehrkraft-Ansicht')
        )
      )
    );
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start, art };
})();
