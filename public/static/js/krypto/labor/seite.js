/* Kryptos – Seite /labor (Gerüst M4 Task 48): Kopfzeile für beide Rollen und Hinweis. Werkzeug-Raster nach Epoche,
   Freigaben (GET /api/labor) und Vollseite #/<id> folgen in Task 53. */
'use strict';

const KRLaborSeite = (() => {
  const { h } = AQ;
  async function start() {
    const haupt = document.getElementById('haupt');
    KR.laden(haupt);
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'labor', sitzung });
      const zurueck = sitzung.rolle === 'schueler' ? ['/spiel#/', 'Zur Zeitleiste'] : ['/lehrer#/', 'Zur Kursübersicht'];
      AQ.mount(
        haupt,
        h(
          'div',
          { class: 'wrap geruest' },
          h('h1', null, 'Kryptolabor'),
          h(
            'div',
            { class: 'leer-zustand' },
            KR.symbol('icons', 'i-labor'),
            h('p', null, 'Das Kryptolabor wird gerade eingerichtet – die Werkzeuge kommen bald.'),
            h('a', { class: 'knopf knopf-zweit', href: zurueck[0] }, zurueck[1])
          )
        )
      );
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
    }
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start };
})();
