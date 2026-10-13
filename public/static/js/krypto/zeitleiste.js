/* Kryptos – Schüler-Seite: Zeitleiste mit Epochen-Toren (Design §7.1, DESIGNSYSTEM, Prototyp Abschnitt 2, M4 Task 57).
   Tore nach jahr.von (sonst nr) auf einer logarithmischen Zeitachse (−500 … 2026), ab 720 px frei positioniert (CSSOM
   --x/--w), darunter als senkrechte Liste (CSS). Gesperrte Epochen nur als Geheimtext „noch verschlüsselt“ (E31).
   Neu freigeschaltete Epochen werden einmal entsiegelt (localStorage kr_entsiegelt). Texte nur als Textknoten. */
'use strict';

const KRZeitleiste = (() => {
  const { h, s } = AQ;
  const LOG_MAX = Math.log10(2026 + 600);
  const BREIT_AB = 720; // ab dieser Fensterbreite: Tore frei auf der Achse, darunter senkrechte Liste
  const SPEICHER = { kr_entsiegelt: 'kr_entsiegelt', kr_zuletzt: 'kr_zuletzt' };

  /** Die sieben Epochen (Titel = fach.WELTEN, Test) – Tore für Epochen ohne Seed „noch verschlüsselt“ (E31, vorläufig
      festgelegt: sichtbar, nicht anklickbar). Jahre nur für die Lage auf der Zeitachse. */
  const EPOCHEN = Object.freeze(
    [
      [0, 'Die Antike', -500, '500 v. Chr.'],
      [1, 'Das Haus der Weisheit', 850, 'um 850'],
      [2, 'Le chiffre indéchiffrable', 1553, '16.–19. Jh.'],
      [3, 'Das Maschinenzeitalter', 1917, '1917–1977'],
      [4, 'Das Schlüsselproblem', 1976, '1976'],
      [5, 'Das Netz', 1995, 'heute'],
      [6, 'Die Zeitmaschine', 2026, 'Endgegner']
    ].map(([nr, titel, von, anzeige]) => Object.freeze({ nr, titel, jahr: Object.freeze({ von, anzeige }) }))
  );

  /** Welten des Servers + Platzhalter für Epochen 0–6 ohne Seed (gesperrt). */
  function mitPlatzhaltern(welten) {
    const da = new Set(welten.map((w) => w.nr));
    return [...welten, ...EPOCHEN.filter((e) => !da.has(e.nr)).map((e) => ({ nr: e.nr, titel: e.titel, jahr: e.jahr, frei: false, platzhalter: true, levels: [], boss: null }))];
  }

  const begrenzt = (x) => Math.max(0, Math.min(1, Number(x) || 0));

  /** Position eines Jahres auf [0, 1]: (log10(jahr + 600) − 2) / (log10(2626) − 2); −500 → 0, 2026 → 1. */
  function position(jahr) {
    const j = Number(jahr);
    if (!Number.isFinite(j) || j + 600 <= 100) return 0;
    return begrenzt((Math.log10(j + 600) - 2) / (LOG_MAX - 2));
  }

  /**
   * px-Positionen aus Anteilen (aufsteigend sortiert): aufsteigend, Mindestabstand abstand, im Bereich [0, breite].
   * Passt das nicht, werden die Tore gleichmäßig verteilt.
   */
  function verteile(anteile, breite, abstand = 140) {
    const n = anteile.length;
    if (!n) return [];
    const b = Math.max(0, Number(breite) || 0);
    if (n === 1) return [begrenzt(anteile[0]) * b];
    if ((n - 1) * abstand > b) return anteile.map((_, i) => (b * i) / (n - 1));
    const x = anteile.map((a) => begrenzt(a) * b);
    for (let i = 1; i < n; i++) x[i] = Math.max(x[i], x[i - 1] + abstand);
    if (x[n - 1] > b) {
      x[n - 1] = b;
      for (let i = n - 2; i >= 0; i--) x[i] = Math.min(x[i], x[i + 1] - abstand);
    }
    return x;
  }

  /** Titel als Geheimtext (Caesar k = 13, GROSS, nur Buchstaben; Umlaute nach Kryptos-Regel). */
  function geheim(text) {
    const t = String(text || '')
      .toUpperCase()
      .replace(/Ä/g, 'AE')
      .replace(/Ö/g, 'OE')
      .replace(/Ü/g, 'UE')
      .replace(/ß/g, 'SS')
      .normalize('NFD')
      .replace(/[^A-Z]/g, '');
    return [...t].map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + 13) % 26) + 65)).join('') || 'XXXX';
  }

  const sortiert = (welten) => [...welten].sort((a, b) => {
    const ja = a.jahr && Number.isFinite(Number(a.jahr.von)) ? Number(a.jahr.von) : null;
    const jb = b.jahr && Number.isFinite(Number(b.jahr.von)) ? Number(b.jahr.von) : null;
    if (ja !== null && jb !== null && ja !== jb) return ja - jb;
    if (ja !== null && jb === null) return -1;
    if (ja === null && jb !== null) return 1;
    return a.nr - b.nr;
  });

  const jahrText = (w) => (w.jahr && w.jahr.anzeige ? String(w.jahr.anzeige) : `Welt ${w.nr}`);

  /** Status eines freien Tors als Text (Fortschritt nie nur als Ring). */
  function statusText(w) {
    const levels = Array.isArray(w.levels) ? w.levels.filter((l) => !l.kuer) : [];
    const begonnen = levels.filter((l) => (l.geloest || 0) > 0 || (l.punkte || 0) > 0).length;
    const teile = [`${begonnen} von ${levels.length} Level begonnen`];
    if (w.boss && w.boss.besiegt) teile.push('Boss besiegt');
    else if (w.boss && w.boss.frei) teile.push('Boss bereit');
    return teile.join(' · ');
  }

  /** Torbogen (SVG 120 × 160): Fläche, Ornament, Rand, Fortschrittsring oder Schloss, Artefakt. */
  function torBild(w, frei) {
    const bogen = 'M6 156V60a54 54 0 0 1 108 0v96z';
    const r = 28;
    const umfang = 2 * Math.PI * r;
    const a = begrenzt(w.anteil);
    const orn = KR.ORNAMENT[w.nr] || KR.ORNAMENT[6];
    const innen = frei
      ? [
          s('circle', { class: 'tor-ring-spur', cx: 60, cy: 72, r }),
          a > 0 ? s('circle', { class: 'tor-ring', cx: 60, cy: 72, r, transform: 'rotate(-90 60 72)', 'stroke-dasharray': `${(umfang * a).toFixed(1)} ${umfang.toFixed(1)}` }) : null,
          s('text', { class: 'tor-prozent', x: 60, y: 79 }, `${Math.round(a * 100)} %`)
        ]
      : [s('g', { class: 'tor-schloss', transform: 'translate(60 76)' }, s('rect', { x: -13, y: -4, width: 26, height: 20, rx: 3 }), s('path', { d: 'M-8 -4v-6a8 8 0 0 1 16 0v6' }))];
    const artefakt = KRProfil.ARTEFAKT[w.nr];
    return s(
      'svg',
      { class: 'tor-bogen', viewBox: '0 0 120 160', 'aria-hidden': 'true', focusable: 'false' },
      s('path', { class: 'tor-flaeche', d: bogen }),
      s('use', { class: 'tor-ornament', href: KR.sprite('ornamente', orn), x: 22, y: 26, width: 76, height: 76 }),
      s('path', { class: 'tor-rand', d: bogen }),
      innen,
      artefakt ? s('use', { class: 'tor-artefakt', href: KR.sprite('abzeichen', artefakt), x: 47, y: 118, width: 26, height: 26 }) : null
    );
  }

  function tor(w, { neu }) {
    if (!w.frei) {
      return h(
        'div',
        { class: 'tor gesperrt', 'aria-disabled': 'true' },
        h('span', { class: 'tor-bild' }, torBild(w, false)),
        h('span', { class: 'tor-jahr' }, jahrText(w)),
        h('span', { class: 'tor-name geheim', 'aria-hidden': 'true' }, geheim(w.titel)),
        h('span', { class: 'tor-status' }, 'noch verschlüsselt')
      );
    }
    const name = h('span', { class: 'tor-name' }, neu ? geheim(w.titel) : w.titel);
    if (neu) KR.entsiegeln(name, w.titel);
    const status = statusText(w);
    const a = h(
      'a',
      { class: 'tor', href: `#/epoche/${w.nr}`, 'aria-label': `${w.titel}, ${jahrText(w)}, ${KR.prozent(w.anteil)} der Level-Punkte, ${status}` },
      h(
        'span',
        { class: 'tor-bild' },
        neu ? h('span', { class: 'tor-neu', 'aria-hidden': 'true' }, 'NEU') : null,
        torBild(w, true),
        w.boss && w.boss.besiegt ? h('span', { class: 'tor-siegel' }, KR.symbol('siegel', 's-boss')) : null
      ),
      h('span', { class: 'tor-jahr' }, jahrText(w)),
      name,
      h('span', { class: 'tor-status' }, status)
    );
    // Zeitsprung beim Epochenwechsel (ohne reduzierte Bewegung), danach erst navigieren
    a.addEventListener('click', (e) => {
      if (AQ.ruhig() || e.defaultPrevented) return;
      e.preventDefault();
      KR.zeitsprung({ nr: w.nr, titel: w.titel, jahr: w.jahr && w.jahr.anzeige }).then(() => {
        location.hash = `#/epoche/${w.nr}`;
      });
    });
    return a;
  }

  /** Tore auf der Achse anordnen (ab 720 px Fensterbreite), sonst die senkrechte Liste der CSS. */
  function anordnen(ol = document.querySelector('ol.tore')) {
    if (!ol) return;
    const lis = [...ol.children].filter((li) => li.classList && li.classList.contains('tor-li'));
    const breit = (window.innerWidth || 0) >= BREIT_AB;
    const b = ol.getBoundingClientRect().width || ol.clientWidth || 0;
    if (!breit || !b || !lis.length) {
      ol.classList.remove('gemessen');
      lis.forEach((li) => {
        li.style.removeProperty('--x');
        li.style.removeProperty('--w');
      });
      return;
    }
    const torBreite = Math.max(72, Math.min(132, Math.floor(b / lis.length) - 8));
    const px = verteile(lis.map((li) => Number(li.getAttribute('data-anteil')) || 0), b - torBreite, torBreite + 8);
    lis.forEach((li, i) => {
      li.style.setProperty('--x', `${Math.round(px[i])}px`);
      li.style.setProperty('--w', `${torBreite}px`);
    });
    ol.classList.add('gemessen');
  }
  let wartet = null;
  window.addEventListener('resize', () => {
    clearTimeout(wartet);
    wartet = setTimeout(() => anordnen(), 120);
  });

  function rangleiter(rang, punkte) {
    if (!rang || !rang.name) return null;
    const index = Number.isInteger(rang.index) ? rang.index : KR.RAENGE.indexOf(rang.name);
    return h(
      'div',
      { class: 'rang-karte' },
      h('div', { class: 'rang-karte-kopf' }, h('b', null, rang.name), h('span', { class: 'zahl' }, [punkte && Number.isFinite(punkte.gesamt) ? `${punkte.gesamt} Punkte` : null, KR.prozent(rang.anteil)].filter(Boolean).join(' · '))),
      h(
        'ol',
        { class: 'rangleiter', 'aria-label': `Rang: ${rang.name}, ${KR.prozent(rang.anteil)} der Level-Punkte` },
        KR.RAENGE.map((n, i) => h('li', { class: i === index ? 'jetzt' : i < index ? 'erreicht' : null, 'aria-current': i === index ? 'step' : null }, h('i', { 'aria-hidden': 'true' }), n))
      ),
      rang.naechster ? h('p', { class: 'rang-naechster' }, `Nächster Rang: ${rang.naechster.name} ab ${Math.round(rang.naechster.ab * 100)} %`) : h('p', { class: 'rang-naechster' }, 'Höchster Rang erreicht.')
    );
  }

  /** „Weiter, wo du warst“: letztes Level (kr_zuletzt) oder die erste freie Epoche. */
  function weiter(welten) {
    const id = AQ.lade(SPEICHER.kr_zuletzt, null);
    for (const w of welten) {
      if (!w.frei) continue;
      const l = (w.levels || []).find((x) => x.id === id);
      if (l) {
        return h(
          'div',
          { class: 'weiter-karte' },
          h('span', { class: 'etikett' }, 'Weiter, wo du warst'),
          h('h2', null, l.titel),
          h('p', null, `${w.titel} · ${l.geloest || 0} von ${l.anzahl || 0} Aufgaben gelöst`),
          h('p', { class: 'knopf-reihe' }, h('a', { class: 'knopf knopf-messing', href: `#/level/${encodeURIComponent(l.id)}` }, 'Weiterarbeiten'), h('a', { class: 'knopf knopf-zweit', href: `#/epoche/${w.nr}` }, 'Zur Epoche'))
        );
      }
    }
    const erste = welten.find((w) => w.frei);
    if (!erste) return h('div', { class: 'weiter-karte' }, h('span', { class: 'etikett' }, 'Weiter'), h('p', null, 'Noch ist keine Epoche freigeschaltet. Deine Lehrkraft öffnet die erste Epoche.'));
    return h(
      'div',
      { class: 'weiter-karte' },
      h('span', { class: 'etikett' }, 'Deine Reise beginnt'),
      h('h2', null, erste.titel),
      h('p', { class: 'knopf-reihe' }, h('a', { class: 'knopf knopf-messing', href: `#/epoche/${erste.nr}` }, 'Epoche betreten'))
    );
  }

  function regal(welten) {
    return h(
      'ul',
      { class: 'regal', 'aria-label': 'Artefakte der sieben Epochen' },
      KRProfil.ARTEFAKT.map((id, nr) => {
        const w = welten.find((x) => x.nr === nr);
        const hat = !!(w && w.boss && w.boss.besiegt);
        const name = KRProfil.ARTEFAKT_NAME[nr];
        return h(
          'li',
          { class: 'artefakt' + (hat ? ' hat' : '') },
          KR.symbol('abzeichen', id, { klasse: 'artefakt-bild' }),
          h('span', { 'aria-hidden': hat ? null : 'true' }, hat ? name : '?'),
          hat ? null : h('span', { class: 'sr' }, `Artefakt der Epoche ${nr}: noch nicht gefunden`)
        );
      })
    );
  }

  function kapitel(welten) {
    return h(
      'div',
      { class: 'kapitel-liste' },
      welten.map((w) =>
        w.kapitel && w.kapitel.titel
          ? h('article', { class: 'kapitel' }, h('span', { class: 'mono' }, jahrText(w)), h('b', null, w.kapitel.titel), typeof w.kapitel.md === 'string' ? AQR.md(w.kapitel.md, null) : null)
          : h('div', { class: 'kapitel zu' }, h('span', { class: 'mono' }, jahrText(w)), h('b', null, w.frei ? w.titel : `Epoche ${w.nr}`), h('p', null, 'noch versiegelt'))
      )
    );
  }

  /** Zeitleiste: daten = Antwort von GET /api/welten; name aus der Sitzung, rang/punkte aus GET /api/profil. */
  function ansicht(daten, { name = '', rang = null, punkte = null } = {}) {
    const geladen = Array.isArray(daten && daten.welten) ? daten.welten : [];
    const welten = sortiert(mitPlatzhaltern(geladen));
    const gemerkt = AQ.lade(SPEICHER.kr_entsiegelt, []);
    const bekannt = new Set(Array.isArray(gemerkt) ? gemerkt.filter(Number.isInteger) : []);
    const frei = welten.filter((w) => w.frei).map((w) => w.nr);
    const ol = h(
      'ol',
      { class: 'tore', 'aria-label': 'Epochen der Zeitreise' },
      welten.map((w) => h('li', { class: 'tor-li', 'data-anteil': String(position(w.jahr && w.jahr.von !== undefined ? w.jahr.von : -500 + 300 * w.nr)) }, tor(w, { neu: w.frei && !bekannt.has(w.nr) })))
    );
    AQ.speichere(SPEICHER.kr_entsiegelt, [...new Set([...bekannt, ...frei])].sort((a, b) => a - b));
    const offen = welten.find((w) => w.frei && !(w.boss && w.boss.besiegt));
    return h(
      'section',
      { class: 'zeitleiste nacht textur', 'aria-labelledby': 'zl-titel' },
      h(
        'div',
        { class: 'wrap zl-kopf' },
        h(
          'div',
          null,
          h('span', { class: 'etikett' }, 'Archiv der verborgenen Schriften'),
          h('h1', { id: 'zl-titel' }, `Willkommen zurück, ${name || 'Chronist'}${/[.!?]$/.test(name || '') ? '' : '.'}`),
          h('p', null, offen ? `Das Chronoskop steht bereit. Als Nächstes wartet „${offen.titel}“.` : geladen.length ? 'Alle offenen Epochen sind gemeistert – warte auf die nächste Freischaltung.' : 'Noch ist keine Epoche geladen.')
        ),
        rangleiter(rang, punkte)
      ),
      h(
        'div',
        { class: 'zeitachse' },
        h(
          'div',
          { class: 'wrap' },
          h('p', { class: 'sr' }, 'Zeitleiste von 500 v. Chr. bis heute'),
          h('div', { class: 'zeitachse-hinweis', 'aria-hidden': 'true' }, h('span', null, '500 v. Chr.'), h('span', null, 'nicht maßstäblich'), h('span', null, 'heute')),
          ol
        )
      ),
      h(
        'div',
        { class: 'wrap zl-unten' },
        h('div', { class: 'panel-tinte' }, weiter(welten), h('h2', { class: 'etikett' }, 'Artefakte'), regal(welten)),
        h('div', { class: 'panel-tinte' }, h('h2', { class: 'etikett' }, 'Entsiegelte Kapitel der Kryptogeschichte'), kapitel(welten.filter((w) => !w.platzhalter)))
      )
    );
  }

  return { EPOCHEN, position, verteile, geheim, ansicht, anordnen };
})();
