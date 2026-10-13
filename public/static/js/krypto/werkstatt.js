/* Kryptos – Seite /werkstatt (Gerüst M4, E20): Kopfzeile + Leerzustand. Die Chiffren-Werkstatt (Welt 3) folgt in M7;
   bis dahin keine API-Aufrufe außer /api/sitzung. */
'use strict';

const KRWerkstatt = (() => {
  const { h } = AQ;
  async function start() {
    const haupt = document.getElementById('haupt');
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'werkstatt', sitzung });
      AQ.mount(
        haupt,
        h(
          'div',
          { class: 'wrap geruest' },
          h('h1', null, 'Chiffren-Werkstatt'),
          h(
            'div',
            { class: 'leer-zustand' },
            KR.ornament(3),
            h('p', null, 'Die Chiffren-Werkstatt öffnet deine Lehrkraft in Welt 3.'),
            h('p', { class: 'klein' }, 'Die Werkstatt kommt bald.'),
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
