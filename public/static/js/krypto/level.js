/* Kryptos – Schüler-Seite: Level-Ansicht (M4 Task 58). Brotkrumen, Akten-Kopf, „Archivwissen“ (Intro-Blöcke),
   Aufgabenliste mit Status, Kategorie und Punkten, Kryptolabor-Karten nur für freigegebene Werkzeuge, Online-IDE-Karte
   mit Schalter „erledigt“, Erklärvideo-Hinweis (E35, ohne Link), Navigation vorher/nachher. Texte nur als Textknoten. */
'use strict';

const KRLevel = (() => {
  const { h, api, toast } = AQ;
  const enc = encodeURIComponent;

  const STATUS = {
    geloest: ['✓', 'gelöst'],
    angesehen: ['👁', 'Lösung angesehen'],
    offen: ['○', 'offen']
  };

  function statusChip(a) {
    const st = a.status === 'angesehen' && a.nachgeloest ? ['✓', 'Lösung angesehen · nachgelöst'] : STATUS[a.status] || STATUS.offen;
    return h('span', { class: `chip status-chip status-${a.status || 'offen'}` }, h('span', { 'aria-hidden': 'true' }, st[0] + ' '), st[1]);
  }

  function brotkrumen(welt, ...rest) {
    const teile = [h('a', { href: '#/' }, 'Zeitleiste'), h('a', { href: `#/epoche/${welt.nr}` }, welt.titel), ...rest];
    const out = [];
    teile.forEach((t, i) => {
      if (i) out.push(h('span', { 'aria-hidden': 'true' }, '›'));
      out.push(t);
    });
    return h('nav', { class: 'brotkrumen', 'aria-label': 'Brotkrumen' }, out);
  }

  function aufgabenListe(aufgaben, niveau) {
    return h(
      'ol',
      { class: 'aufgaben-liste' },
      aufgaben.map((a, i) =>
        h(
          'li',
          { class: 'aufgabe-eintrag status-' + (a.status || 'offen') },
          h(
            'a',
            { href: `#/aufgabe/${enc(a.id)}` },
            h('span', { class: 'aufgabe-nr', 'aria-hidden': 'true' }, String(i + 1)),
            h(
              'span',
              { class: 'aufgabe-text' },
              h('b', null, a.titel),
              h('span', { class: 'aufgabe-meta' }, AQ.sterne(a.stufe), a.kategorie ? ` · ${KR.KATEGORIEN[a.kategorie] || a.kategorie}` : '')
            ),
            h('span', { class: 'chip-reihe' }, statusChip(a), KREpoche.niveauChip(a.niveau, niveau), h('span', { class: 'chip chip-neutral zahl' }, `${a.status === 'offen' ? 0 : a.erreicht || 0}/${a.punkte} P.`))
          )
        )
      )
    );
  }

  function werkzeugKarten(ids, werkzeuge, werkzeugFrei) {
    const frei = (Array.isArray(ids) ? ids : []).filter((id) => werkzeugFrei(id));
    if (!frei.length) return null;
    return h(
      'section',
      { class: 'level-labor', 'aria-labelledby': 'level-labor-titel' },
      h('h2', { id: 'level-labor-titel' }, 'Im Kryptolabor ausprobieren'),
      h(
        'div',
        { class: 'labor-raster' },
        frei.map((id) => {
          const w = (werkzeuge || []).find((x) => x.id === id);
          return h('a', { class: 'werkzeug-karte werkzeug-link', href: `/labor#/${enc(id)}` }, KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }), h('b', { class: 'werkzeug-name' }, w ? w.titel : id), h('span', { class: 'werkzeug-ort' }, 'Im Labor öffnen'));
        })
      )
    );
  }

  function ideKarte(l, erledigt) {
    if (!l.ide) return null;
    const cb = h('input', { type: 'checkbox', class: 'ide-erledigt', checked: !!erledigt });
    cb.addEventListener('change', async () => {
      try {
        await api('POST', `/api/levels/${enc(l.id)}/ide`, { erledigt: cb.checked });
        toast(cb.checked ? 'Als erledigt markiert.' : 'Markierung entfernt.');
      } catch (e) {
        cb.checked = !cb.checked;
        toast(e.message, true);
      }
    });
    return h(
      'section',
      { class: 'karte ide-karte' },
      h('h2', null, 'Programmieren in der Online-IDE'),
      h('p', null, l.ide),
      h('p', { class: 'text-2' }, 'Diese Aufgaben bearbeitest du in der Online-IDE. Das Häkchen ist nur für deinen Überblick und bringt keine Punkte.'),
      h('label', { class: 'check' }, cb, 'In der IDE erledigt')
    );
  }

  /** Level-Ansicht: d = GET /api/levels/:id; werkzeugFrei(id), werkzeuge = Liste aus GET /api/labor. */
  function ansicht(d, { werkzeugFrei = () => false, werkzeuge = [] } = {}) {
    const l = d.level;
    AQ.speichere('kr_zuletzt', l.id);
    const zeichen = KREpoche.aktenzeichen(l);
    return h(
      'div',
      { class: 'wrap level-seite' },
      brotkrumen(d.welt, h('span', { 'aria-current': 'page' }, l.titel)),
      h(
        'header',
        { class: 'karte karte-akte level-kopf' },
        h('span', { class: 'aktenzeichen' }, zeichen),
        h('h1', null, l.titel),
        h('span', { class: 'chip-reihe' }, l.rolle ? h('span', { class: 'chip chip-neutral' }, AQ.rolleText(l.rolle)) : null, KREpoche.niveauChip(l.niveau, d.niveau), h('span', { class: 'chip chip-neutral zahl' }, `${l.maxPunkte || 0} Punkte erreichbar`))
      ),
      Array.isArray(l.intro) && l.intro.length
        ? h('section', { class: 'archivwissen', 'aria-labelledby': 'archivwissen-titel' }, h('h2', { id: 'archivwissen-titel' }, KR.ornament(d.welt.nr, { klasse: 'ornament-initial' }), 'Archivwissen'), AQR.bloecke(l.intro, null))
        : null,
      h('section', { class: 'level-aufgaben', 'aria-labelledby': 'aufgaben-titel' }, h('h2', { id: 'aufgaben-titel' }, 'Aufgaben'), d.aufgaben.length ? aufgabenListe(d.aufgaben, d.niveau) : h('p', { class: 'leer-zustand' }, 'Für dein Niveau gibt es hier keine Aufgaben.')),
      werkzeugKarten(l.werkzeug, werkzeuge, werkzeugFrei),
      ideKarte(l, d.ideErledigt),
      l.video && l.video.titel ? h('p', { class: 'video-hinweis' }, h('span', { 'aria-hidden': 'true' }, '▶ '), `Erklärvideo Nr. ${l.video.nr}: ${l.video.titel}`) : null,
      h(
        'nav',
        { class: 'knopf-reihe level-nav', 'aria-label': 'Weitere Level' },
        d.vorher ? h('a', { class: 'knopf knopf-zweit', href: `#/level/${enc(d.vorher.id)}` }, '← ', d.vorher.titel) : null,
        h('a', { class: 'knopf knopf-zweit', href: `#/epoche/${d.welt.nr}` }, 'Zur Epoche'),
        d.nachher ? h('a', { class: 'knopf knopf-zweit', href: `#/level/${enc(d.nachher.id)}` }, d.nachher.titel, ' →') : null
      )
    );
  }

  return { ansicht, brotkrumen, statusChip };
})();
