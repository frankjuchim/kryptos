/* Kryptos – Theme-Schicht (TECHNIK §11.2, DESIGNSYSTEM): Thema, Bewegung, Epoche, Ornamente, Symbole, Entsiegeln,
   Zeitsprung, Lade-/Fehlerzustand. Lädt synchron im <head> nach common.js, damit Thema und Bewegung vor dem ersten
   Zeichnen feststehen (kein Aufblitzen im Dunkelmodus). Alle Ausgaben als Textknoten (AQ.h/AQ.s). */
'use strict';

const KR = (() => {
  const html = document.documentElement;
  const SPRITES = '/static/img/';

  /** Cache-Version aus dem eigenen Skript-Tag (…/oberflaeche.js?v=x.y.z, gesetzt von werkzeuge/version_setzen.js). */
  const VERSION = (() => {
    const eigen = document.currentScript || [...document.querySelectorAll('script[src]')].find((x) => /\/krypto\/oberflaeche\.js(\?|$)/.test(x.getAttribute('src') || ''));
    const m = eigen ? /[?&]v=([^&#]+)/.exec(eigen.getAttribute('src') || '') : null;
    return m ? m[1] : '';
  })();

  /** Verweis auf ein Symbol im Sprite mit Cache-Version: /static/img/<datei>.svg?v=<Version>#<id>. */
  function sprite(datei, id) {
    return `${SPRITES}${datei}.svg${VERSION ? `?v=${encodeURIComponent(VERSION)}` : ''}#${id}`;
  }

  /** Thema lesen (ohne Wert) oder setzen und im Profil speichern: auto | hell | dunkel. */
  function thema(wert) {
    if (wert === undefined) return AQ.einstellung('thema');
    AQ.einstellung('thema', wert);
    html.setAttribute('data-theme', wert);
    weltfarbeAnwenden();
    return wert;
  }

  /** Dunkel dargestellt? (data-theme="dunkel" oder „auto“ mit dunklem System) */
  function dunkel() {
    const t = html.getAttribute('data-theme');
    if (t === 'dunkel') return true;
    if (t === 'hell') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // Weltfarbe einer Welt ohne Epochen-Thema (8 Gast, 9 Labor/Fixture): inline per CSSOM. Im Dunkelmodus gilt wie in
  // epochen.css der helle Akzent – Inline-Werte überstimmen die Stylesheet-Regel, deshalb hier.
  let weltfarbe = null;
  function weltfarbeAnwenden() {
    if (!weltfarbe) {
      html.style.removeProperty('--akzent');
      html.style.removeProperty('--akzent-hell');
      return;
    }
    html.style.setProperty('--akzent', dunkel() ? weltfarbe.hell : weltfarbe.farbe);
    html.style.setProperty('--akzent-hell', weltfarbe.hell);
  }

  /** Bewegung lesen oder setzen: auto | aus (aus = alle Animationen enden, siehe CSS :root[data-bewegung="aus"]). */
  function bewegung(wert) {
    if (wert === undefined) return AQ.einstellung('bewegung');
    AQ.einstellung('bewegung', wert);
    html.setAttribute('data-bewegung', wert);
    return wert;
  }

  /** Epoche setzen: 0–6 über data-epoche (epochen.css), sonst Akzent per CSSOM (Manifest-/Weltfarbe). */
  function epoche(nr, { farbe, akzentHell } = {}) {
    html.setAttribute('data-epoche', String(nr));
    const bekannt = Number.isInteger(Number(nr)) && Number(nr) >= 0 && Number(nr) <= 6;
    weltfarbe = !bekannt && farbe ? { farbe, hell: akzentHell || farbe } : null;
    weltfarbeAnwenden();
  }

  /** Kurztitel der Epochen 0–5 für das Labor-Raster (Welt 6 hat keine Werkzeuge). */
  const WELTEN_KURZ = Object.freeze(['Antike', 'Bagdad', 'Renaissance', 'Maschinenzeitalter', 'Stanford 1976', 'Das Netz']);

  const ORNAMENT = ['o-maeander', 'o-girih', 'o-ranke', 'o-lochstreifen', 'o-scan', 'o-netz', 'o-zahnrad'];

  /** Symbol aus einem Sprite (icons, ornamente, siegel, abzeichen); mit titel als Bild beschriftet, sonst dekorativ. */
  function symbol(datei, id, { klasse, titel } = {}) {
    const attrs = { class: klasse || null, focusable: 'false' };
    if (titel) {
      attrs.role = 'img';
      attrs['aria-label'] = titel;
    } else attrs['aria-hidden'] = 'true';
    return AQ.s('svg', attrs, titel ? AQ.s('title', null, titel) : null, AQ.s('use', { href: sprite(datei, id) }));
  }

  /** Ornament der Epoche nr (dekorativ). */
  function ornament(nr, { klasse } = {}) {
    const id = ORNAMENT[Number(nr)] || ORNAMENT[6];
    return symbol('ornamente', id, { klasse: klasse || 'ornament' });
  }

  const GROSS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Text „entsiegeln“: jeder Buchstabe rotiert (Caesar) von einem zufälligen Start zum Ziel, alle zusammen in dauer ms.
   * aria-label sofort; bei reduzierter Bewegung sofort vollständig (kein Timer).
   */
  function entsiegeln(el, text, { dauer = 600 } = {}) {
    const ziel = String(text);
    el.setAttribute('aria-label', ziel);
    if (AQ.ruhig()) {
      el.textContent = ziel;
      return Promise.resolve();
    }
    const zeichen = [...ziel].map((c) => {
      const i = GROSS.indexOf(c.toUpperCase());
      if (i < 0) return { c, fertig: true };
      const start = Math.floor(Math.random() * 26);
      return { c, i, start, schritte: (i - start + 26) % 26, klein: c !== c.toUpperCase() };
    });
    const t0 = Date.now();
    return new Promise((resolve) => {
      function bild() {
        const t = Math.min(1, (Date.now() - t0) / Math.max(1, dauer));
        if (t >= 1) {
          el.textContent = ziel;
          return resolve();
        }
        AQ.mount(
          el,
          zeichen.map((z) => {
            if (z.fertig) return AQ.h('span', { 'aria-hidden': 'true' }, z.c);
            const n = Math.round(z.schritte * t);
            const b = GROSS[(z.start + n) % 26];
            const da = n >= z.schritte;
            return AQ.h('span', { class: da ? null : 'roh', 'aria-hidden': 'true' }, z.klein ? b.toLowerCase() : b);
          })
        );
        setTimeout(bild, 40);
      }
      bild();
    });
  }

  /** Zeitsprung beim Epochenwechsel: Ziffernring dreht, Akzent wechselt (500 ms); bei reduzierter Bewegung sofort. */
  function zeitsprung({ nr, titel, jahr } = {}) {
    if (AQ.ruhig()) {
      epoche(nr);
      return Promise.resolve();
    }
    const box = AQ.h(
      'div',
      { class: 'zeitsprung an', 'aria-hidden': 'true' },
      AQ.s('svg', { viewBox: '0 0 48 48', focusable: 'false' }, AQ.s('g', { class: 'ring-dreh' }, AQ.s('use', { href: sprite('icons', 'logo-ring') }))),
      AQ.h('div', { class: 'zeitsprung-text' }, jahr ? AQ.h('div', { class: 'mono' }, jahr) : null, titel ? AQ.h('b', null, titel) : null)
    );
    document.body.appendChild(box);
    epoche(nr);
    return new Promise((resolve) =>
      setTimeout(() => {
        box.remove();
        resolve();
      }, 500)
    );
  }

  /** Ladezustand in ziel. */
  function laden(ziel, text = 'Wird geladen …') {
    return AQ.mount(ziel, AQ.h('p', { class: 'laden', role: 'status' }, text));
  }

  /** Fehlerkasten in ziel (Meldung als Text), optional mit Rückweg { href, text } oder href. */
  function fehler(ziel, e, { zurueck } = {}) {
    const weg = typeof zurueck === 'string' ? { href: zurueck, text: 'Zurück' } : zurueck;
    return AQ.mount(
      ziel,
      AQ.h(
        'div',
        { class: 'fehler-box', role: 'alert' },
        AQ.h('p', null, (e && e.message) || String(e || 'Unbekannter Fehler.')),
        weg ? AQ.h('p', null, AQ.h('a', { class: 'knopf knopf-zweit', href: weg.href }, weg.text || 'Zurück')) : null
      )
    );
  }

  /** Datum und Uhrzeit in deutscher Schreibweise (Europe/Berlin); ungültig → „–“. */
  function zeitText(iso) {
    if (!iso) return '–';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '–';
    return d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /** Anteil 0…1 als „62 %“. */
  function prozent(x) {
    return Math.round(Math.max(0, Math.min(1, Number(x) || 0)) * 100) + ' %';
  }

  /** Anzeigenamen der Lab-Kategorien (= LAB_KATEGORIE_NAMEN in src/krypto/fach.js, Test client_aufgabe). */
  const KATEGORIEN = Object.freeze({
    begriffe: 'Grundbegriffe',
    transposition: 'Transposition',
    'substitution-mono': 'Monoalphabetische Substitution',
    'substitution-poly': 'Polyalphabetische Substitution',
    modulo: 'Modulo-Rechnen',
    verschluesseln: 'Verschlüsseln',
    entschluesseln: 'Entschlüsseln',
    einordnen: 'Verfahren einordnen',
    haeufigkeitsanalyse: 'Häufigkeitsanalyse',
    'kasiski-friedman': 'Kasiski- und Friedman-Test',
    schluesselraum: 'Schlüsselraum',
    'sicherheit-beurteilen': 'Sicherheit beurteilen',
    'bits-xor': 'Bits und XOR',
    blockchiffre: 'Blockchiffre',
    schluesselaustausch: 'Schlüsselaustausch',
    asymmetrisch: 'Asymmetrische Verfahren',
    hybrid: 'Hybridverfahren',
    hash: 'Hashfunktionen',
    signatur: 'Digitale Signatur',
    zertifikat: 'Zertifikate',
    protokoll: 'Protokolle und Angriffe',
    struktogramm: 'Struktogramm',
    implementierung: 'Implementierung',
    'fremde-chiffre': 'Fremde Chiffre',
    gesellschaft: 'Datenschutz und Gesellschaft'
  });

  /** Kurztitel der Fallen P1–P10 (= FALLEN[p].titel in src/krypto/fach.js, Design §3.3). */
  const FALLEN = Object.freeze({
    P1: 'Zählbasis verwechselt',
    P2: 'Modulo falsch',
    P3: 'Umkehrung falsch',
    P4: 'Verfahrensregel übersehen',
    P5: 'Falsch eingeordnet',
    P6: 'Häufigkeitsanalyse pauschal',
    P7: 'Schlüsselraum falsch',
    P8: 'Kombination überschätzt',
    P9: 'Schlüsselrollen verwechselt',
    P10: 'Operator verfehlt'
  });

  /** Ränge (= RAENGE in src/krypto/fach.js, Schwellen 0/10/30/55/80 % der Level-Punkte; Test client_seiten). */
  const RAENGE = Object.freeze(['Lehrling', 'Schreiber', 'Chiffreur', 'Kryptoanalytiker', 'Meister der Chiffren']);

  // sofort anwenden (vor dem ersten Zeichnen)
  html.setAttribute('data-theme', AQ.einstellung('thema'));
  html.setAttribute('data-bewegung', AQ.einstellung('bewegung'));
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', weltfarbeAnwenden);
  }

  return { VERSION, thema, bewegung, epoche, KATEGORIEN, FALLEN, RAENGE, WELTEN_KURZ, ORNAMENT, ornament, sprite, symbol, entsiegeln, zeitsprung, laden, fehler, zeitText, prozent };
})();
