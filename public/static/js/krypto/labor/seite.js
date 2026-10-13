/* Kryptos – Seite /labor (TECHNIK §10.1, M4 Task 53): Kopfzeile für beide Rollen, Werkzeug-Raster nach Epoche mit
   Freigaben (Schüler: GET /api/labor, Lehrkraft: GET /api/lehrer/werkzeuge – alles frei), gesperrte Werkzeuge mit Grund,
   Boss-Banner; #/<id> öffnet das Werkzeug als Vollseite über KRLabor (ohne Modul: „noch in Arbeit“). */
'use strict';

const KRLaborSeite = (() => {
  const { h } = AQ;
  const GRUND = {
    lehrkraft: 'Deine Lehrkraft schaltet dieses Werkzeug später frei.',
    welt: 'Wird mit der Epoche freigeschaltet.',
    boss: 'Während eines Boss-Kampfs ist das Labor geschlossen.'
  };
  let daten = null; // { rolle, boss, werkzeuge: [{ id, titel, welt, frei, grund }] }
  let offen = null;

  function zurueck(sitzung) {
    return sitzung.rolle === 'schueler' ? { href: '/spiel#/', text: 'Zur Zeitleiste' } : { href: '/lehrer#/', text: 'Zur Kursübersicht' };
  }

  async function lade(sitzung) {
    if (sitzung.rolle === 'schueler') {
      const r = await AQ.api('GET', '/api/labor');
      return { rolle: 'schueler', boss: !!r.boss, werkzeuge: Array.isArray(r.werkzeuge) ? r.werkzeuge : [] };
    }
    const liste = await AQ.api('GET', '/api/lehrer/werkzeuge');
    return { rolle: sitzung.rolle, boss: false, werkzeuge: (Array.isArray(liste) ? liste : []).map((w) => ({ ...w, frei: true, grund: null })) };
  }

  function karte(w) {
    if (w.frei) {
      return h('a', { class: 'werkzeug-karte', href: `#/${w.id}`, 'data-epoche': String(w.welt) }, KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }), h('b', { class: 'werkzeug-name' }, w.titel), h('span', { class: 'werkzeug-ort' }, 'Öffnen'));
    }
    return h(
      'div',
      { class: 'werkzeug-karte gesperrt', 'data-epoche': String(w.welt) },
      KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }),
      h('b', { class: 'werkzeug-name' }, w.titel),
      h('p', { class: 'werkzeug-grund' }, GRUND[w.grund] || GRUND.lehrkraft)
    );
  }

  function raster(haupt, sitzung) {
    KR.epoche(6);
    const welten = [...new Set(daten.werkzeuge.map((w) => w.welt))].sort((a, b) => a - b);
    const weg = zurueck(sitzung);
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'wrap labor' },
        h('h1', null, 'Kryptolabor'),
        h('p', { class: 'text-2' }, 'Werkzeuge zum Ausprobieren – geordnet nach Epochen. Nichts davon wird bewertet.'),
        daten.boss ? h('div', { class: 'rueckmeldung info labor-banner', role: 'status' }, h('p', null, GRUND.boss)) : null,
        welten.map((nr) =>
          h(
            'section',
            { class: 'labor-epoche', 'data-epoche': String(nr), 'aria-labelledby': `labor-epoche-${nr}` },
            h('h2', { id: `labor-epoche-${nr}` }, KR.WELTEN_KURZ[nr] || `Epoche ${nr}`),
            h('div', { class: 'labor-raster' }, daten.werkzeuge.filter((w) => w.welt === nr).map(karte))
          )
        ),
        h('p', null, h('a', { class: 'knopf knopf-zweit', href: weg.href }, weg.text))
      )
    );
  }

  function vollseite(haupt, id) {
    const w = daten.werkzeuge.find((x) => x.id === id);
    if (!w) {
      KR.fehler(haupt, new Error('Dieses Werkzeug gibt es nicht.'), { zurueck: { href: '#/', text: 'Zum Labor' } });
      return;
    }
    KR.epoche(w.welt);
    if (!w.frei) {
      AQ.mount(
        haupt,
        h('div', { class: 'wrap labor' }, h('h1', null, w.titel), h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, GRUND[w.grund] || GRUND.lehrkraft)), h('p', null, h('a', { class: 'knopf knopf-zweit', href: '#/' }, 'Zum Labor')))
      );
      return;
    }
    const flaeche = h('div', { class: 'werkzeug-flaeche' });
    AQ.mount(
      haupt,
      h(
        'section',
        { class: 'labor-vollseite', 'data-epoche': String(w.welt), 'aria-labelledby': 'werkzeug-titel' },
        h('div', { class: 'werkzeug-kopfband' }, KR.symbol('icons', 'i-labor'), h('h1', { id: 'werkzeug-titel' }, w.titel), h('span', { class: 'werkzeug-epoche' }, KR.WELTEN_KURZ[w.welt] || '')),
        flaeche,
        h('div', { class: 'labor-steuerleiste' }, h('a', { class: 'knopf knopf-zweit', href: '#/' }, KR.symbol('icons', 'i-pfeil-l'), 'Zum Labor'))
      )
    );
    offen = KRLabor.oeffne(id, {}, flaeche, { modus: 'labor' });
  }

  function route(haupt, sitzung) {
    if (offen) {
      offen.schliesse();
      offen = null;
    }
    const id = decodeURIComponent((location.hash || '').replace(/^#\/?/, '').split('/')[0] || '');
    if (id) vollseite(haupt, id);
    else raster(haupt, sitzung);
    if (typeof haupt.focus === 'function') haupt.focus();
  }

  async function start() {
    const haupt = document.getElementById('haupt');
    KR.laden(haupt);
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'labor', sitzung });
      daten = await lade(sitzung);
      route(haupt, sitzung);
      window.addEventListener('hashchange', () => route(haupt, sitzung));
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
    }
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start };
})();
