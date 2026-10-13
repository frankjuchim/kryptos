/* Kryptos – Schüler-Seite: Profil (Rang, Punkte, Artefakte, Abzeichen, Fallen-Radar, Fortschritt je Epoche,
   Darstellung), Scoreboard-Tabelle, Abzeichen-Toast (M4 Task 60). Abzeichen-Symbole im Client aus dem Sprite
   abzeichen.svg (E32), Emoji des Servers nur als Rückfall. Texte nur als Textknoten. */
'use strict';

const KRProfil = (() => {
  const { h, s } = AQ;

  /** Artefakte der Epochen 0–6 (Design §2.4), Sprite-ids in abzeichen.svg */
  const ARTEFAKT = Object.freeze(['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen', 'a-schluessel', 'a-siegel', 'a-kern']);
  const ARTEFAKT_NAME = Object.freeze(['Skytale', 'Al-Kindis Manuskript', 'Vigenère-Tafel', 'Lochstreifen', 'Schlüsselpaar', 'Siegel', 'Chronoskop-Kern']);
  const FEST = Object.freeze({
    erste_schritte: 'a-stern',
    fleissig: 'a-stern',
    unermuedlich: 'a-stern',
    weltenbummler: 'a-stern',
    ohne_tipp: 'a-stern',
    zehnerserie: 'a-serie',
    makellos: 'a-siegel',
    fallensucher: 'a-falle',
    trainingsprofi: 'a-training',
    kata_meister: 'a-warmup',
    funkraum_veteran: 'a-funk',
    arena_knacker: 'a-knacker',
    unknackbar: 'a-unknackbar'
  });
  /** Symbole in abzeichen.svg (Test: Abgleich mit dem Sprite) – Server-Icons (Hook abzeichenAnzeige, Plan M7 E112) nur aus dieser Liste */
  const SPRITE = Object.freeze(['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen', 'a-schluessel', 'a-siegel', 'a-kern', 'a-stern', 'a-serie', 'a-falle', 'a-training', 'a-warmup', 'a-welt', 'a-funk', 'a-knacker', 'a-unknackbar']);
  const FALLEN_IDS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'];

  /**
   * Sprite-id zu einem Abzeichen oder null (dann Emoji des Servers bzw. Stern). icon (vom Server, z. B. „a-knacker“) hat
   * Vorrang, wenn es ^a-[a-z]+$ erfüllt und im Sprite vorhanden ist; sonst die bisherige Abbildung nach dem Schlüssel.
   */
  function symbol(key, icon) {
    if (typeof icon === 'string' && /^a-[a-z]+$/.test(icon)) return SPRITE.includes(icon) ? icon : null;
    const k = String(key || '');
    let m = /^boss(\d+)_besiegt$/.exec(k);
    if (m) return ARTEFAKT[Number(m[1])] || 'a-siegel';
    m = /^welt\d+_gemeistert$/.exec(k);
    if (m) return 'a-welt';
    return Object.prototype.hasOwnProperty.call(FEST, k) ? FEST[k] : null;
  }

  function abzeichenBild(a, klasse = 'abzeichen-bild') {
    const id = symbol(a.key, a.icon);
    if (id) return KR.symbol('abzeichen', id, { klasse });
    // Rückfall: Emoji des Servers, nie eine Sprite-Kennung als Text
    const emoji = typeof a.icon === 'string' && a.icon && !/^a-/.test(a.icon) && a.icon.length <= 8 ? a.icon : '★';
    return h('span', { class: klasse + ' abzeichen-emoji', 'aria-hidden': 'true' }, emoji);
  }

  /** Abzeichen-Toast je neuem Abzeichen (nacheinander). */
  function abzeichenToast(neu) {
    if (!Array.isArray(neu) || !neu.length) return;
    neu.forEach((b, i) =>
      setTimeout(() => {
        AQ.toast(`Abzeichen: ${b.name}`, 'gold');
        const t = document.getElementById('toast');
        if (t) {
          const id = symbol(b.key, b.icon);
          if (id) t.insertBefore(KR.symbol('abzeichen', id), t.firstChild);
          AQ.effekt.funken(t, { stark: true });
        }
      }, 300 + 1800 * i)
    );
  }

  /** Fallen-Radar: SVG mit 10 Achsen (Radius ∝ Fehlversuche/Maximum) und Tabelle als Text-Alternative. */
  let radarNr = 0;
  function radar(fallen) {
    const liste = FALLEN_IDS.map((p) => (Array.isArray(fallen) ? fallen.find((f) => f.p === p) : null) || { p, titel: KR.FALLEN[p] || p, fehlversuche: 0 });
    const max = Math.max(1, ...liste.map((f) => Number(f.fehlversuche) || 0));
    const R = 80;
    const C = 110;
    const punkt = (i, r) => {
      const w = -Math.PI / 2 + (2 * Math.PI * i) / liste.length;
      return [C + r * Math.cos(w), C + r * Math.sin(w)];
    };
    const tid = `fallen-tabelle-${++radarNr}`;
    const svg = s(
      'svg',
      { class: 'radar', viewBox: '0 0 220 220', role: 'img', 'aria-label': 'Fallen-Radar: Fehlversuche je typischer Falle', 'aria-describedby': tid, focusable: 'false' },
      [0.25, 0.5, 0.75, 1].map((f) => s('polygon', { class: 'radar-ring', points: liste.map((_, i) => punkt(i, R * f).map((x) => x.toFixed(1)).join(',')).join(' ') })),
      liste.map((f, i) => {
        const [x, y] = punkt(i, R);
        const [tx, ty] = punkt(i, R + 16);
        return s('g', null, s('line', { class: 'radar-achse', x1: C, y1: C, x2: x.toFixed(1), y2: y.toFixed(1) }), s('text', { class: 'radar-label', x: tx.toFixed(1), y: (ty + 4).toFixed(1) }, f.p));
      }),
      s('polygon', { class: 'radar-wert', points: liste.map((f, i) => punkt(i, (R * (Number(f.fehlversuche) || 0)) / max).map((x) => x.toFixed(1)).join(',')).join(' ') })
    );
    const tabelle = h(
      'table',
      { class: 'fallen-tabelle', id: tid },
      h('caption', null, 'Fehlversuche je typischer Falle'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Falle'), h('th', { scope: 'col' }, 'Kurztitel'), h('th', { scope: 'col' }, 'Fehlversuche'))),
      h('tbody', null, liste.map((f) => h('tr', null, h('th', { scope: 'row' }, h('a', { href: `/themen#fallen-${f.p}` }, f.p)), h('td', null, f.titel || KR.FALLEN[f.p] || ''), h('td', { class: 'zahl' }, String(Number(f.fehlversuche) || 0)))))
    );
    return h('figure', { class: 'fallen-radar' }, svg, h('div', { class: 'scroll-x' }, tabelle));
  }

  function rangKarte(rang) {
    const r = rang || {};
    const a = Math.max(0, Math.min(1, Number(r.anteil) || 0));
    const rest = r.naechster ? Math.max(0, Math.round((r.naechster.ab - a) * 100)) : null;
    return h(
      'section',
      { class: 'karte profil-rang', 'aria-labelledby': 'profil-rang' },
      h('span', { class: 'etikett' }, 'Rang'),
      h('div', { class: 'profil-rang-zeile' }, KREpoche.ring(a), h('div', null, h('h2', { id: 'profil-rang' }, r.name || '–'), h('p', null, `${KR.prozent(a)} der Level-Punkte aller freigeschalteten Epochen`), h('p', { class: 'text-2' }, r.naechster ? `noch ${rest} % bis ${r.naechster.name}` : 'höchster Rang erreicht'))),
      h('ol', { class: 'rangleiter rangleiter-hell' }, KR.RAENGE.map((n, i) => h('li', { class: i === r.index ? 'jetzt' : i < r.index ? 'erreicht' : null, 'aria-current': i === r.index ? 'step' : null }, h('i', { 'aria-hidden': 'true' }), n)))
    );
  }

  function darstellung() {
    const thema = KR.thema();
    const radio = (wert, text) => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'profil-thema', value: wert, checked: thema === wert, onchange: () => KR.thema(wert) }), text);
    return h(
      'section',
      { class: 'karte profil-darstellung' },
      h('h2', null, 'Darstellung'),
      h('fieldset', { class: 'profil-wahl' }, h('legend', null, 'Thema'), radio('hell', 'Hell'), radio('dunkel', 'Dunkel'), radio('auto', 'Automatisch (wie das Gerät)')),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: KR.bewegung() === 'aus', onchange: (e) => KR.bewegung(e.target.checked ? 'aus' : 'auto') }), 'Bewegung reduzieren')
    );
  }

  /** Profil-Ansicht: p = GET /api/profil */
  function ansicht(p) {
    const punkte = p.punkte || {};
    const abzeichen = Array.isArray(p.abzeichen) ? p.abzeichen : [];
    const welten = Array.isArray(p.welten) ? p.welten : [];
    const besiegt = (nr) => {
      const w = welten.find((x) => x.nr === nr);
      return !!(w && w.boss && w.boss.max && w.boss.punkte / w.boss.max >= 0.5 - 1e-9) || abzeichen.some((a) => a.key === `boss${nr}_besiegt` && a.erhalten);
    };
    return h(
      'div',
      { class: 'wrap profil-seite' },
      h('h1', null, `Profil: ${p.name || ''}`),
      p.kurs && p.kurs.name ? h('p', { class: 'text-2' }, `Kurs „${p.kurs.name}“ · Name und Kurse verwaltest du im Portal.`) : null,
      h(
        'div',
        { class: 'profil-raster' },
        rangKarte(p.rang),
        h(
          'section',
          { class: 'karte profil-punkte' },
          h('span', { class: 'etikett' }, 'Punkte'),
          h('p', { class: 'profil-zahl zahl' }, String(punkte.gesamt || 0)),
          h('p', { class: 'text-2' }, `Level ${punkte.level || 0} · Boss ${punkte.boss || 0} · Training ${punkte.training || 0}`),
          h('p', { class: 'text-2' }, `${p.geloest || 0} Aufgaben gelöst`, p.serie ? ` · Serie ohne Fehlversuch ${p.serie.serie} (Rekord ${p.serie.serie_max})` : '')
        )
      ),
      h(
        'section',
        { class: 'karte', 'aria-labelledby': 'profil-artefakte' },
        h('h2', { id: 'profil-artefakte' }, 'Artefakte'),
        h(
          'ul',
          { class: 'regal regal-hell' },
          ARTEFAKT.map((id, nr) => {
            const hat = besiegt(nr);
            return h('li', { class: 'artefakt' + (hat ? ' hat' : '') }, KR.symbol('abzeichen', id, { klasse: 'artefakt-bild' }), h('span', null, hat ? ARTEFAKT_NAME[nr] : `Epoche ${nr}: noch offen`));
          })
        )
      ),
      h(
        'section',
        { class: 'karte', 'aria-labelledby': 'profil-abzeichen' },
        h('h2', { id: 'profil-abzeichen' }, `Abzeichen (${abzeichen.filter((a) => a.erhalten).length} von ${abzeichen.length})`),
        h(
          'ul',
          { class: 'abzeichen-raster' },
          abzeichen.map((a) => h('li', { class: 'abzeichen' + (a.erhalten ? ' erhalten' : ' offen') }, abzeichenBild(a), h('b', null, a.name), h('span', { class: 'text-2' }, a.beschreibung || ''), h('span', { class: 'abzeichen-status' }, a.erhalten ? (a.am ? `✓ erhalten am ${new Date(a.am).toLocaleDateString('de-DE')}` : '✓ erhalten') : 'noch offen')))
        )
      ),
      h('section', { class: 'karte', 'aria-labelledby': 'profil-fallen' }, h('h2', { id: 'profil-fallen' }, 'Deine Fallen'), h('p', { class: 'text-2' }, 'Fehlversuche bei Aufgaben mit einer typischen Falle (P1–P10). Übe gezielt dort, wo das Radar am weitesten ausschlägt.'), radar(p.fallen)),
      h(
        'section',
        { class: 'karte', 'aria-labelledby': 'profil-epochen' },
        h('h2', { id: 'profil-epochen' }, 'Fortschritt je Epoche'),
        welten.length
          ? h(
              'ul',
              { class: 'profil-epochen' },
              welten.map((w) => h('li', null, h('span', { class: 'profil-epoche-kopf' }, h('b', null, w.titel), h('span', { class: 'text-2 zahl' }, w.frei ? `${w.punkte}/${w.maxPunkte} Level-Punkte` + (w.boss ? ` · Boss ${w.boss.punkte}/${w.boss.max}` : '') + (w.training ? ` · Training ${w.training}` : '') : 'noch verschlüsselt')), AQ.progress(w.maxPunkte ? w.punkte / w.maxPunkte : 0)))
            )
          : h('p', { class: 'leer-zustand' }, 'Noch keine Epochen.')
      ),
      darstellung()
    );
  }

  /** Scoreboard-Tabelle (eigene Zeile mit „(du)“ und aria-current). */
  function scoreboardTabelle(d) {
    const liste = Array.isArray(d && d.liste) ? d.liste : [];
    if (!liste.length) return h('p', { class: 'leer-zustand' }, 'Noch keine Einträge.');
    const mitRang = liste.some((r) => r.rang);
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'scoreboard-tabelle' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Platz'), h('th', { scope: 'col' }, 'Name'), h('th', { scope: 'col', class: 'zahl' }, 'Punkte'), h('th', { scope: 'col' }, mitRang ? 'Rang' : 'Abzeichen'))),
        h('tbody', null, liste.map((r) => h('tr', { class: r.ich ? 'ich' : null, 'aria-current': r.ich ? 'true' : null }, h('td', { class: 'zahl' }, String(r.platz)), h('td', null, r.name + (r.ich ? ' (du)' : '')), h('td', { class: 'zahl' }, String(r.punkte)), h('td', null, mitRang ? String(r.rang && r.rang.name ? r.rang.name : r.rang || '') : String(r.abzeichen ?? '')))))
      )
    );
  }

  return { ARTEFAKT, ARTEFAKT_NAME, SPRITE, symbol, radar, ansicht, abzeichenToast, scoreboardTabelle };
})();
