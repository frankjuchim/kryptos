/* Kryptos – Schüler-Seite: Epoche (Design §7.1, Prototyp Abschnitt 3, M4 Task 57). Kopf auf Tinte mit Ornament,
   Epochenwechsel, Archivfund, Level-Karten als Akten (Aktenzeichen, Rolle, Niveau nur ≠ Kern, Fortschritt mit Text),
   Kür-Abschnitt, Trainingsplatz, Boss (frei/gesperrt mit Grund/besiegt), Link auf die Akten der Epoche.
   Die Oberfläche zeigt nur, was der Server liefert (gA-Kurse bekommen keine eA-Level, M3). */
'use strict';

const KREpoche = (() => {
  const { h, s } = AQ;
  const enc = encodeURIComponent;
  const STATUS = { offen: 'offen', geloest: 'entschlüsselt', angesehen: 'Lösung angesehen' };

  /** Fortschrittsring (Text daneben, nie nur Ring). */
  function ring(anteil, groesse = 'gross') {
    const r = 26;
    const u = 2 * Math.PI * r;
    const a = Math.max(0, Math.min(1, Number(anteil) || 0));
    return h(
      'span',
      { class: `ring ring-${groesse}`, 'aria-hidden': 'true' },
      s('svg', { viewBox: '0 0 64 64', focusable: 'false' }, s('circle', { class: 'ring-spur', cx: 32, cy: 32, r }), a > 0 ? s('circle', { class: 'ring-wert', cx: 32, cy: 32, r, 'stroke-dasharray': `${(u * a).toFixed(2)} ${u.toFixed(2)}` }) : null),
      h('span', { class: 'ring-text' }, KR.prozent(a))
    );
  }

  /** Aktenzeichen: Beginn von akte bis „ – “, sonst „Level <nr>“. */
  function aktenzeichen(l) {
    if (typeof l.akte === 'string' && l.akte.trim()) return l.akte.split(' – ')[0].trim();
    return `Level ${l.nr}`;
  }

  /** Niveau-Chip nur für eA, Ergänzung, Kür (Kern ist der Normalfall). */
  function niveauChip(n, kursNiveau) {
    return ['eA', 'ergaenzung', 'kuer'].includes(n) ? AQ.niveau(n, { kursNiveau }) : null;
  }

  function levelKarte(l, niveau) {
    const anzahl = l.anzahl || 0;
    const fertig = anzahl > 0 && (l.geloest || 0) >= anzahl;
    return h(
      'a',
      { class: 'karte karte-akte level-karte' + (fertig ? ' fertig' : ''), href: `#/level/${enc(l.id)}` },
      h('span', { class: 'akte-kopf' }, h('span', { class: 'aktenzeichen' }, aktenzeichen(l)), fertig ? KR.symbol('siegel', 's-siegel', { klasse: 'siegel siegel-klein voll', titel: 'Alle Aufgaben gelöst' }) : null),
      h('span', { class: 'akte-titel' }, l.titel),
      h('span', { class: 'chip-reihe' }, l.rolle ? h('span', { class: 'chip chip-neutral' }, AQ.rolleText(l.rolle)) : null, niveauChip(l.niveau, niveau)),
      h('span', { class: 'akte-fortschritt' }, h('span', { class: 'zahl' }, `${l.geloest || 0}/${anzahl} gelöst`), AQ.progress(l.anteil))
    );
  }

  function archivfundKarte(w) {
    const af = w.archivfund;
    if (!af) return null;
    const st = STATUS[af.status] || 'offen';
    return h(
      'section',
      { class: 'karte archivfund-karte', 'aria-labelledby': `af-${w.nr}` },
      h('span', { class: 'etikett' }, 'Archivfund · Einstiegsrätsel der Epoche'),
      h('h2', { id: `af-${w.nr}` }, af.titel),
      h('p', null, h('span', { class: 'chip chip-neutral' }, af.status === 'geloest' ? '✓ ' : '', st), ' Zählt nicht für Punkte – nur für die Neugier.'),
      h('p', null, h('a', { class: 'knopf knopf-primaer', href: `#/archivfund/${w.nr}` }, af.status === 'offen' || !af.status ? 'Archivfund öffnen' : 'Archivfund ansehen'))
    );
  }

  function trainingKarte(w) {
    if (!w.training) return null;
    return h(
      'a',
      { class: 'karte karte-link training-karte', href: `#/training/${w.nr}` },
      h('span', { class: 'etikett' }, 'Trainingsplatz'),
      h('b', null, 'Zufallsaufgaben zum Üben'),
      h('span', { class: 'text-2' }, '1 Punkt je gelöster Aufgabe, höchstens 30 Punkte am Tag.')
    );
  }

  function bossKarte(w) {
    const b = w.boss;
    if (!b) return null;
    let zustand;
    if (b.besiegt) zustand = h('p', { class: 'boss-zustand' }, KR.symbol('siegel', 's-boss', { klasse: 'siegel siegel-klein voll' }), ' besiegt – das Artefakt gehört dir.');
    else if (b.frei) zustand = h('p', { class: 'boss-zustand' }, 'bereit – stell dich dem Boss.');
    else zustand = h('p', { class: 'boss-zustand gesperrt' }, '🔒 ', b.grund || 'noch gesperrt');
    return h(
      'section',
      { class: 'karte boss-karte' + (b.besiegt ? ' besiegt' : b.frei ? ' bereit' : ' gesperrt'), 'aria-labelledby': `boss-${w.nr}` },
      h('span', { class: 'etikett' }, 'Boss der Epoche'),
      h('h2', { id: `boss-${w.nr}` }, b.titel),
      zustand,
      b.bester && b.bester.max ? h('p', { class: 'text-2' }, `Bester Versuch: ${b.bester.punkte} von ${b.bester.max} Punkten`) : null,
      h('p', null, h('a', { class: 'knopf ' + (b.frei && !b.besiegt ? 'knopf-messing' : 'knopf-zweit'), href: `#/boss/${w.nr}` }, b.frei || b.besiegt ? 'Zum Boss' : 'Regeln ansehen'))
    );
  }

  /** Etikett „Welt <nr> · <epoche> · <jahr.anzeige>“ (Jahr nur, wenn es nicht schon in der Epoche steht). */
  function etikett(w) {
    const teile = [`Welt ${w.nr}`];
    if (w.epoche) teile.push(w.epoche);
    if (w.jahr && w.jahr.anzeige && !String(w.epoche || '').includes(w.jahr.anzeige)) teile.push(w.jahr.anzeige);
    return teile.join(' · ');
  }

  /** Epochen-Ansicht: w = Welt aus GET /api/welten; niveau = Kursniveau; welten = alle (für den Epochenwechsel). */
  function ansicht(w, { niveau = 'eA', welten = [] } = {}) {
    const levels = Array.isArray(w.levels) ? w.levels : [];
    const pflicht = levels.filter((l) => !l.kuer);
    const kuer = levels.filter((l) => l.kuer);
    const andere = welten.filter((x) => x.frei && x.nr !== w.nr);
    return h(
      'div',
      { class: 'epoche' },
      h(
        'header',
        { class: 'epoche-kopf tinte textur' },
        KR.ornament(w.nr, { klasse: 'epoche-ornament' }),
        h(
          'div',
          { class: 'wrap epoche-kopf-innen' },
          h(
            'div',
            null,
            h('nav', { class: 'brotkrumen', 'aria-label': 'Brotkrumen' }, h('a', { href: '#/' }, 'Zeitleiste'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', { 'aria-current': 'page' }, w.titel)),
            h('span', { class: 'etikett' }, etikett(w)),
            h('h1', null, w.titel),
            andere.length ? h('nav', { class: 'epoche-wechsel', 'aria-label': 'Epoche wechseln' }, andere.map((x) => h('a', { class: 'chip epoche-pille', href: `#/epoche/${x.nr}` }, x.titel))) : null
          ),
          h('div', { class: 'epoche-fortschritt' }, ring(w.anteil), h('span', { class: 'zahl' }, `${w.punkte || 0} von ${w.maxPunkte || 0} Level-Punkten`))
        )
      ),
      h(
        'div',
        { class: 'wrap epoche-inhalt' },
        archivfundKarte(w),
        h(
          'section',
          { class: 'akten', 'aria-labelledby': 'akten-titel' },
          h('h2', { id: 'akten-titel' }, 'Level'),
          pflicht.length ? h('div', { class: 'akten-raster' }, pflicht.map((l) => levelKarte(l, niveau))) : h('p', { class: 'leer-zustand' }, 'In dieser Epoche gibt es noch keine Level.')
        ),
        kuer.length ? h('section', { class: 'kuer', 'aria-labelledby': 'kuer-titel' }, h('h2', { id: 'kuer-titel' }, 'Kür – freiwillig'), h('p', { class: 'text-2' }, 'Vertiefung über das Abitur hinaus. Zählt für den Rang, nicht für den Boss.'), h('div', { class: 'akten-raster' }, kuer.map((l) => levelKarte(l, niveau)))) : null,
        h('div', { class: 'epoche-extras' }, trainingKarte(w), bossKarte(w)),
        h('p', null, h('a', { class: 'knopf knopf-leise', href: `/themen#welt-${w.nr}` }, 'Akten dieser Epoche'))
      )
    );
  }

  return { ansicht, aktenzeichen, ring, niveauChip, STATUS };
})();
