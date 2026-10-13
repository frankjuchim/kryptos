/* Kryptos – Seite /funkraum (Gerüst M4, E20): Kopfzeile + Leerzustand. Szenarien, Rollen und Polling folgen in M7;
   bis dahin keine API-Aufrufe außer /api/sitzung. */
'use strict';

const KRFunkraum = (() => {
  const { h } = AQ;
  async function start() {
    const haupt = document.getElementById('haupt');
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'funkraum', sitzung });
      AQ.mount(
        haupt,
        h(
          'div',
          { class: 'wrap geruest' },
          h('h1', null, 'Funkraum'),
          h(
            'div',
            { class: 'leer-zustand' },
            KR.symbol('icons', 'i-funk'),
            h('p', null, 'Gerade läuft in deinem Kurs kein Funkraum-Szenario. Deine Lehrkraft startet es im Unterricht.'),
            h('p', { class: 'klein' }, 'Der Funkraum kommt bald.'),
            h('a', { class: 'knopf knopf-zweit', href: '/spiel#/' }, 'Zur Zeitleiste')
          )
        )
      );
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/spiel#/', text: 'Zur Zeitleiste' } });
    }
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start };
})();
