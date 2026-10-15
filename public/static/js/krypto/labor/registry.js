/* Kryptos – Labor-Registry im Client (TECHNIK §10.1/§10.2, M4 Task 53, M6 Task 110): Werkzeugliste (= src/krypto/werkzeuge.js,
   Test labor.test.js), Registrierung der Werkzeug-Module, Öffnen in einem Container oder in einem <dialog> mit Kopfband
   im Epochenakzent, Fokusfalle, Esc und Rückkehr des Fokus. M6: Nachladen der Module (lade, E72), Reiter-Regeln nach
   Welt und Niveau (REITER_REGELN, erlaubt, reiterFuer – E71, E87), Nachspiel-Modus (nachspiel, E67) und die
   Brute-Force-Demo „Alle Schlüssel ausprobieren“ (alleSchluessel) – Werkzeuge bauen keine eigenen Abspieler.
   Noch nicht gebaute Werkzeuge (BEREIT) zeigen „noch in Arbeit“ statt eines Ladefehlers. Review M6: sperreAlle(grund)
   schließt alle offenen Werkzeuge (Boss-Kampf in einem anderen Tab), wache(pruefe) fragt bei Rückkehr in den Tab neu. */
'use strict';

const KRLabor = (() => {
  const { h } = AQ;

  // = src/krypto/werkzeuge.js ohne Voreinstellungs-Schlüssel (Test labor.test.js); reiter: Reihenfolge = Anzeige (M6 E73)
  const WERKZEUGE = Object.freeze(
    [
      { id: 'skytale', titel: 'Skytale & Gitter', welt: 0, reiter: ['skytale', 'gartenzaun', 'fleissner', 'pfluegen', 'ring'] },
      { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, reiter: ['scheibe', 'text', 'alle'] },
      { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, reiter: ['histogramm', 'bigramme', 'teiltexte', 'kennzahlen'] },
      { id: 'substitution', titel: 'Substitutions-Werkbank', welt: 1, reiter: [] },
      { id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, reiter: ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur'] },
      { id: 'bitlupe', titel: 'Bit-Lupe', welt: 3, reiter: ['zeichen', 'xor', 'doppelnutzung'] },
      { id: 'runden', titel: 'Runden-Labor', welt: 3, reiter: ['runden', 'lawine', 'verfolgung', 'modi', 'fehler', 'enigma'] },
      { id: 'modulo', titel: 'Modulo-Uhr & Farbmischer', welt: 4, reiter: ['uhr', 'tabelle', 'inverses', 'farbmischer'] },
      { id: 'rsa', titel: 'RSA-Rechenwerk', welt: 4, reiter: ['rechenwerk', 'euklid', 'text'] },
      { id: 'hash', titel: 'Hash-Labor', welt: 5, reiter: ['schritte', 'lawine', 'kollision', 'baukasten', 'passwort', 'pruefsumme'] },
      { id: 'signatur', titel: 'Signatur- & Zertifikats-Simulator', welt: 5, reiter: ['signatur', 'zertifikat', 'mitm'] },
      // M10 (E177, E178): Werkstatt-Stationen (docs/FREMDCODE.md); art: kern | zusatz | kuer
      { id: 'quadrat', titel: 'Polybios & Playfair', welt: 0, reiter: ['polybios', 'playfair'] },
      { id: 'signale', titel: 'Codes & Signale', welt: 0, reiter: ['morse', 'klopfcode', 'freimaurer'], art: 'zusatz' },
      { id: 'verstecke', titel: 'Versteckte Botschaften', welt: 0, reiter: ['nullchiffre', 'punkte'], art: 'zusatz' },
      { id: 'enigma', titel: 'Enigma', welt: 3, reiter: ['maschine', 'innenleben', 'vorfuehren', 'glossar'], art: 'kuer' },
      { id: 'analyse', titel: 'Angreifer-Labor', welt: 1, reiter: ['vergleich', 'schluesselraum', 'trainer', 'blick'] }
    ].map((w) => Object.freeze({ ...w, reiter: Object.freeze(w.reiter), art: w.art || 'kern' }))
  );
  const NACH_ID = new Map(WERKZEUGE.map((w) => [w.id, w]));
  const MODULE = new Map();
  // Werkzeuge, deren Modul gebaut ist (labor/<id>.js vorhanden). Andere zeigen „noch in Arbeit“, ohne ein Skript
  // anzufordern (kein 404); echte Ladefehler gebauter Module bleiben Fehler. Mit jedem neuen Modul ergänzen (M6).
  const BEREIT = new Set(['skytale', 'scheibe', 'haeufigkeit', 'substitution', 'vigenere', 'bitlupe', 'runden', 'modulo', 'rsa', 'hash', 'signatur', 'quadrat', 'signale', 'verstecke', 'enigma', 'analyse']);
  /** Ist das Modul des Werkzeugs gebaut (nachladbar)? */
  function bereit(id) {
    return BEREIT.has(id);
  }

  /** Eintrag zur id oder null. */
  function werkzeug(id) {
    return NACH_ID.get(id) || null;
  }

  /** Werkzeug-Modul registrieren: { titel, oeffne(container, voreinstellung, umgebung) → { schliesse() } }. */
  function registriere(id, modul) {
    if (!NACH_ID.has(id)) throw new Error(`Unbekanntes Werkzeug „${id}“.`);
    if (MODULE.has(id)) throw new Error(`Werkzeug „${id}“ ist bereits registriert.`);
    if (!modul || typeof modul.oeffne !== 'function') throw new Error('Werkzeug-Registrierung ungültig.');
    MODULE.set(id, modul);
  }

  function hat(id) {
    return MODULE.has(id);
  }

  /* ---------- Nachladen (E72) ---------- */

  const SKRIPTE = new Map(); // src → Promise
  const PFAD = '/static/js/krypto/labor/';
  function version() {
    return typeof KR !== 'undefined' && KR.VERSION ? `?v=${encodeURIComponent(KR.VERSION)}` : '';
  }
  /** <script src> einmal an document.head hängen (synchron) und auf load/error warten. */
  function skript(src) {
    if (SKRIPTE.has(src)) return SKRIPTE.get(src);
    const p = new Promise((ok, fehler) => {
      const el = document.createElement('script');
      el.addEventListener('load', () => ok());
      el.addEventListener('error', () => {
        SKRIPTE.delete(src);
        el.remove();
        fehler(new Error('Skript konnte nicht geladen werden.'));
      });
      el.setAttribute('src', src);
      document.head.appendChild(el);
    });
    SKRIPTE.set(src, p);
    return p;
  }
  /** Rahmen und Daten fürs Erkennen da? (M11: labor/erkenner.js und labor/erkenner/<id>.js) */
  const erkennerDa = (id) => typeof KRErkenner !== 'undefined' && KRErkenner.hatDaten(id) && typeof KRGefuehrt !== 'undefined';
  /** Werkzeug-Modul (und einmal labor/bausteine.js, danach labor/station.js – Plan M10 Task 224; M11 Tasks 242/243:
      labor/erkenner.js, labor/gefuehrt.js und die Erkenner-Daten labor/erkenner/<id>.js) nachladen; Promise erfüllt,
      sobald das Modul registriert ist. */
  function lade(id) {
    if (!NACH_ID.has(id)) return Promise.reject(new Error('Dieses Werkzeug gibt es nicht.'));
    const bauDa = () => typeof KRLaborBau !== 'undefined';
    const stationDa = () => typeof KRStation !== 'undefined';
    if (MODULE.has(id) && bauDa() && stationDa() && erkennerDa(id)) return Promise.resolve();
    const modul = () =>
      MODULE.has(id)
        ? Promise.resolve()
        : skript(`${PFAD}${id}.js${version()}`).then(() => {
            if (!MODULE.has(id)) throw new Error('Werkzeug hat sich nicht registriert.');
          });
    const daten = () => (erkennerDa(id) ? modul() : skript(`${PFAD}erkenner/${id}.js${version()}`).then(modul));
    const gefuehrt = () => (typeof KRGefuehrt !== 'undefined' ? daten() : skript(`${PFAD}gefuehrt.js${version()}`).then(daten));
    const erkenner = () => (typeof KRErkenner !== 'undefined' ? gefuehrt() : skript(`${PFAD}erkenner.js${version()}`).then(gefuehrt));
    // synchron anhängen, was schon geht (kein Umweg über Mikroaufgaben)
    const nachBau = () => (stationDa() ? erkenner() : skript(`${PFAD}station.js${version()}`).then(erkenner));
    return bauDa() ? nachBau() : skript(`${PFAD}bausteine.js${version()}`).then(nachBau);
  }

  /* ---------- Reiter-Regeln (E71, E87) ---------- */

  const REITER_REGELN = Object.freeze({
    'haeufigkeit.teiltexte': Object.freeze({ welt: 2 }),
    'haeufigkeit.kennzahlen': Object.freeze({ welt: 2, niveau: 'eA' }),
    'vigenere.koinzidenz': Object.freeze({ niveau: 'eA' }),
    'skytale.ring': Object.freeze({ welt: 6 }),
    'vigenere.modus.pendel': Object.freeze({ welt: 6 }),
    'vigenere.modus.frei': Object.freeze({ welt: 6 }),
    // Orchestrator (M6): Die MitM-Szene zeigt den Ablauf von W5-L3-04 (Lösung) – im Level-Kontext W5-L3 (Welt 5 Level 5.3)
    // ausgeblendet, im freien Labor vorläufig erst mit freigeschalteter Welt 6 (Lehrkräfte sehen sie immer)
    'signatur.mitm': Object.freeze({ welt: 6, nichtImLevel: Object.freeze(['W5-L3']) }),
    // M10 E180: Playfair rechnet W2-L4 vor, der Schlüsselraum W1-L1-04 (26! bei 10⁹/s) – erst ab Welt 2; Optionen der
    // Angreifer-Reiter nach Welt; die Vorführung „keine Fixpunkte“ beantwortet W3-K2-03 – nicht im Level-Kontext W3-L5
    'quadrat.playfair': Object.freeze({ welt: 2 }),
    'analyse.schluesselraum': Object.freeze({ welt: 2 }),
    'analyse.verfahren.playfair': Object.freeze({ welt: 2 }),
    'analyse.verfahren.vigenere': Object.freeze({ welt: 2 }),
    'analyse.verfahren.enigma': Object.freeze({ welt: 3 }),
    'enigma.vorfuehren': Object.freeze({ nichtImLevel: Object.freeze(['W3-L5']) }),
    // M10 L55 (Task 239): In den Level-Karten 0.4/2.4 bleibt das Schlüsselwort fest (Standardquadrat bzw. eigenes
    // Beispielwort) – mit eigenem Schlüsselwort rechnete das Werkzeug die Aufgaben (KORINTH, RIALTO, GALEERE) vor
    'quadrat.schluesselwort': Object.freeze({ nichtImLevel: Object.freeze(['W0-L4', 'W2-L4']) })
  });
  /** Ist der Reiter/Modus „<id>.<reiter>“ in dieser Umgebung sichtbar? Lehrkraft oder fehlende Angaben → ja;
      umgebung.level (Level-id der Aufgabe) sperrt Reiter mit nichtImLevel. */
  function erlaubt(schluessel, umgebung) {
    const regel = REITER_REGELN[schluessel];
    const u = umgebung || {};
    if (!regel || u.rolle === 'lehrkraft') return true;
    if (regel.nichtImLevel && typeof u.level === 'string' && regel.nichtImLevel.includes(u.level)) return false;
    if (regel.welt !== undefined && Array.isArray(u.welten) && !u.welten.includes(regel.welt)) return false;
    if (regel.niveau !== undefined && u.niveau && u.niveau !== regel.niveau) return false;
    return true;
  }
  /** Sichtbare Reiter eines Werkzeugs: Voreinstellung (wenn gültig) oder alle, gefiltert nach den Regeln. */
  function reiterFuer(id, voreinstellung, umgebung) {
    const w = werkzeug(id);
    if (!w || !w.reiter.length) return [];
    const v = voreinstellung && Array.isArray(voreinstellung.reiter) ? voreinstellung.reiter : null;
    const gueltig = v && v.length > 0 && v.every((r) => w.reiter.includes(r)) && new Set(v).size === v.length;
    const liste = (gueltig ? v : w.reiter).filter((r) => erlaubt(`${id}.${r}`, umgebung));
    if (liste.length) return liste;
    const erster = w.reiter.find((r) => erlaubt(`${id}.${r}`, umgebung));
    return [erster || w.reiter[0]];
  }

  /* ---------- Öffnen ---------- */

  // Gründe für gesperrte Werkzeuge (= /api/labor grund; Labor-Seite und zweite Sicherung in oeffne, M6 Task 127)
  const GRUND = Object.freeze({
    lehrkraft: 'Deine Lehrkraft schaltet dieses Werkzeug später frei.',
    welt: 'Wird mit der Epoche freigeschaltet.',
    boss: 'Während eines Boss-Kampfs ist das Labor geschlossen.'
  });

  let zuletzt = null;
  /** Das zuletzt geöffnete Steuerobjekt (nur lesend, e2e): { schliesse(), zustand() }. */
  function aktiv() {
    return zuletzt;
  }
  const OFFEN = new Set(); // offene Werkzeuge (Steuerobjekte mit sperre(grund)) – für sperreAlle (Review M6, alter Tab)
  const GESCHLOSSEN = 'Das Werkzeug wurde geschlossen.';

  function grundAnzeige(container, grund, geschlossen) {
    AQ.mount(
      container,
      h(
        'div',
        { class: 'leer-zustand werkzeug-gesperrt', role: 'status' },
        KR.symbol('icons', 'i-labor'),
        h('p', { class: 'leer-zustand-text' }, GRUND[grund] || GRUND.lehrkraft),
        geschlossen ? h('p', { class: 'text-2' }, GESCHLOSSEN) : null
      )
    );
  }

  /** Alle offenen Werkzeuge schließen und an ihrer Stelle den Grund zeigen (z. B. Boss-Kampf in einem anderen Tab).
      Liefert die Zahl der geschlossenen Werkzeuge. */
  function sperreAlle(grund) {
    let n = 0;
    for (const s of [...OFFEN]) {
      s.sperre(grund);
      n++;
    }
    return n;
  }

  /** Bei Rückkehr in den Tab (visibilitychange → sichtbar, focus) pruefe() aufrufen – nie zwei Anfragen gleichzeitig.
      pruefe: async () => void (fragt z. B. GET /api/labor und ruft sperreAlle). Liefert eine Abmelde-Funktion. */
  function wache(pruefe) {
    let laeuft = false;
    const los = () => {
      if (laeuft || (typeof document.visibilityState === 'string' && document.visibilityState === 'hidden')) return;
      laeuft = true;
      Promise.resolve()
        .then(pruefe)
        .catch(() => {})
        .then(() => {
          laeuft = false;
        });
    };
    document.addEventListener('visibilitychange', los);
    window.addEventListener('focus', los);
    return () => {
      document.removeEventListener('visibilitychange', los);
      window.removeEventListener('focus', los);
    };
  }

  /** Werkzeug in container öffnen; liefert { schliesse(), zustand() }. Fehlt das Modul, wird es nachgeladen.
      umgebung.gesperrt ('boss'|'lehrkraft'|'welt') → nur der Grund, kein Modul (M6 Task 127). */
  function oeffne(id, voreinstellung, container, umgebung = { modus: 'labor' }) {
    const v = voreinstellung && typeof voreinstellung === 'object' && !Array.isArray(voreinstellung) ? voreinstellung : {};
    const u = umgebung || { modus: 'labor' };
    let innen = null;
    let zu = false;
    function starte() {
      AQ.clear(container);
      const r = MODULE.get(id).oeffne(container, v, u);
      innen = r && typeof r === 'object' ? r : {};
    }
    const steuer = {
      schliesse() {
        zu = true;
        OFFEN.delete(steuer);
        if (innen && typeof innen.schliesse === 'function') innen.schliesse();
        innen = null;
      },
      zustand() {
        return innen && typeof innen.zustand === 'function' ? innen.zustand() : null;
      },
      /** Werkzeug schließen und den Grund mit Hinweis „geschlossen“ zeigen (sperreAlle). */
      sperre(grund) {
        steuer.schliesse();
        grundAnzeige(container, grund, true);
      }
    };
    zuletzt = steuer;
    if (u.gesperrt) {
      // zweite Sicherung für alle Aufrufer (Boss-Sperre, TECHNIK §10.3): kein Modul, kein Nachladen, nur der Grund
      grundAnzeige(container, u.gesperrt, false);
      return steuer;
    }
    OFFEN.add(steuer);
    if (MODULE.has(id) && typeof KRLaborBau !== 'undefined' && typeof KRStation !== 'undefined' && erkennerDa(id)) {
      starte();
      return steuer;
    }
    if (!BEREIT.has(id)) {
      AQ.mount(container, h('div', { class: 'leer-zustand', role: 'status' }, KR.symbol('icons', 'i-labor'), h('p', { class: 'leer-zustand-text' }, 'Dieses Werkzeug ist noch in Arbeit.'), h('p', { class: 'text-2' }, 'Es kommt mit einer der nächsten Versionen.')));
      return steuer;
    }
    AQ.mount(container, h('p', { class: 'laden', role: 'status' }, 'Wird geladen …'));
    lade(id).then(
      () => {
        if (!zu) starte();
      },
      () => {
        if (zu) return;
        AQ.mount(container, h('div', { class: 'leer-zustand', role: 'status' }, KR.symbol('icons', 'i-labor'), h('p', { class: 'leer-zustand-text' }, 'Dieses Werkzeug konnte nicht geladen werden.'), h('p', { class: 'text-2' }, 'Bitte lade die Seite neu.')));
      }
    );
    return steuer;
  }

  const FOKUSSIERBAR = ['a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]', 'summary'];
  function fokussierbare(el) {
    return [...el.querySelectorAll(FOKUSSIERBAR.join(', '))].filter((x) => !x.disabled && x.getAttribute('tabindex') !== '-1' && !x.hidden);
  }

  /** Werkzeug als <dialog class="werkzeug-dialog"> über der Aufgabe öffnen. */
  function dialog(id, voreinstellung, umgebung = { modus: 'lab' }) {
    const w = werkzeug(id);
    const ausloeser = document.activeElement;
    const titelId = `werkzeug-titel-${id}`;
    const flaeche = h('div', { class: 'werkzeug-flaeche' });
    const schliessen = h('button', { type: 'button', class: 'knopf knopf-leise werkzeug-schliessen', 'aria-label': 'Werkzeug schließen' }, KR.symbol('icons', 'i-schliessen'), h('span', { class: 'lang' }, 'Schließen'));
    const d = h(
      'dialog',
      { class: 'werkzeug-dialog', 'aria-labelledby': titelId, 'data-epoche': w ? String(w.welt) : null },
      h('div', { class: 'werkzeug-kopfband' }, KR.symbol('icons', 'i-labor'), h('h2', { id: titelId }, w ? w.titel : 'Werkzeug'), schliessen),
      flaeche
    );
    let offen = null;
    let fertig = false;
    function zu() {
      if (fertig) return;
      fertig = true;
      if (offen) offen.schliesse();
      if (d.open) d.close();
      d.remove();
      if (ausloeser && typeof ausloeser.focus === 'function') ausloeser.focus();
    }
    schliessen.addEventListener('click', zu);
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      zu();
    });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        zu();
        return;
      }
      if (e.key !== 'Tab') return;
      const liste = fokussierbare(d);
      if (!liste.length) return;
      const erstes = liste[0];
      const letztes = liste[liste.length - 1];
      if (e.shiftKey && (document.activeElement === erstes || !d.contains(document.activeElement))) {
        e.preventDefault();
        letztes.focus();
      } else if (!e.shiftKey && (document.activeElement === letztes || !d.contains(document.activeElement))) {
        e.preventDefault();
        erstes.focus();
      }
    });
    document.body.appendChild(d);
    offen = oeffne(id, voreinstellung, flaeche, umgebung);
    d.showModal();
    schliessen.focus();
    return d;
  }

  /* ---------- Nachspiel (E67) ---------- */

  const TEMPO = Object.freeze({ einzel: { titel: 'Einzelschritt', ms: 0 }, zeitlupe: { titel: 'Zeitlupe', ms: 2400 }, normal: { titel: 'Normal', ms: 900 } });

  /**
   * Nachspiel-Leiste in ziel: o = { titel, schritte: [{ text, daten }], zeige(schritt, index, { animiert }), start, beiLauf(an) }.
   * Schritte sind Zustände; zeige baut den Zustand i vollständig (idempotent). Tempo „Einzelschritt“ (Standard),
   * „Zeitlupe“ (2400 ms), „Normal“ (900 ms). Bei reduzierter Bewegung (AQ.ruhig) nur Einzelschritt, nie animiert.
   * → { element, gehe(i), vor(), zurueck(), anfang(), ende(), abspielen(), pause(), tempo(t), index(), laeuft(), schliesse() }
   */
  function nachspiel(ziel, o = {}) {
    const schritte = Array.isArray(o.schritte) && o.schritte.length ? o.schritte : [{ text: '' }];
    const zeige = typeof o.zeige === 'function' ? o.zeige : () => {};
    const ruhig = AQ.ruhig();
    let index = Number.isInteger(o.start) && o.start >= -1 && o.start < schritte.length ? o.start : 0;
    let tempoWahl = 'einzel';
    let timer = null;
    let laeuftJetzt = false;
    let fertig = false;

    const knopf = (klasse, text, aria) => h('button', { type: 'button', class: `knopf knopf-leise ${klasse}`, 'aria-label': aria || null }, text);
    const kAnfang = knopf('nachspiel-anfang', '⏮ Anfang', 'Zum Anfang');
    const kZurueck = knopf('nachspiel-zurueck', '◀ Schritt zurück');
    const kAbspielen = h('button', { type: 'button', class: 'knopf knopf-zweit nachspiel-abspielen', 'aria-pressed': 'false', disabled: ruhig }, '▶ Abspielen');
    const kVor = knopf('nachspiel-vor', 'Schritt vor ▶');
    const kEnde = knopf('nachspiel-ende', 'Ende ⏭', 'Zum Ende');
    const zaehler = h('span', { class: 'nachspiel-zaehler' });
    const text = h('p', { class: 'nachspiel-text', 'aria-live': 'polite' });
    const tempoKnoepfe = Object.keys(TEMPO).map((t) => h('button', { type: 'button', role: 'radio', class: 'nachspiel-tempo-wahl', 'data-tempo': t, 'aria-checked': String(t === tempoWahl), tabindex: t === tempoWahl ? '0' : '-1' }, TEMPO[t].titel));
    const tempoGruppe = h('div', { class: 'nachspiel-tempo', role: 'radiogroup', 'aria-label': 'Tempo', hidden: ruhig }, tempoKnoepfe);
    const element = h(
      'div',
      { class: 'nachspiel', role: 'group', 'aria-label': 'Nachspielen' },
      o.titel ? h('p', { class: 'nachspiel-titel' }, String(o.titel)) : null,
      h('div', { class: 'nachspiel-leiste' }, kAnfang, kZurueck, kAbspielen, kVor, kEnde),
      h('div', { class: 'nachspiel-status' }, zaehler, tempoGruppe),
      ruhig ? h('p', { class: 'nachspiel-ruhig text-2' }, 'Bewegung reduziert: Schritt für Schritt mit „Schritt vor“, → oder Leertaste.') : null,
      text
    );

    function anzeigen(animiert) {
      const i = index;
      zaehler.textContent = `Schritt ${i + 1} von ${schritte.length}`;
      text.textContent = i >= 0 ? String(schritte[i].text ?? '') : '';
      kAnfang.disabled = i <= 0;
      kZurueck.disabled = i <= 0;
      kVor.disabled = i >= schritte.length - 1;
      kEnde.disabled = i >= schritte.length - 1;
      if (i >= 0) zeige(schritte[i], i, { animiert: !!animiert && !ruhig && tempoWahl !== 'einzel' });
    }
    /** Ansage (Review M6): im Tempo „Normal“ während des Abspielens still, sonst live; beim Verstummen-Ende den aktuellen
        Schritt einmal neu schreiben, damit er angesagt wird. */
    function liveSetzen() {
      const still = laeuftJetzt && tempoWahl === 'normal';
      const war = text.getAttribute('aria-live');
      text.setAttribute('aria-live', still ? 'off' : 'polite');
      if (war === 'off' && !still) {
        const t = text.textContent;
        text.textContent = '';
        setTimeout(() => {
          if (!fertig && !text.textContent) text.textContent = t;
        }, 50);
      }
    }
    function setzeLauf(an) {
      if (laeuftJetzt === an) return;
      laeuftJetzt = an;
      liveSetzen();
      if (an) ziel.dataset.nachspiel = 'laeuft';
      else delete ziel.dataset.nachspiel;
      kAbspielen.setAttribute('aria-pressed', String(an));
      kAbspielen.textContent = an ? '⏸ Anhalten' : '▶ Abspielen';
      if (typeof o.beiLauf === 'function') o.beiLauf(an);
    }
    function gehe(i, animiert = false) {
      if (fertig) return;
      const neu = Math.max(0, Math.min(schritte.length - 1, Number(i) || 0));
      index = neu;
      anzeigen(animiert);
    }
    function pause() {
      if (timer) clearTimeout(timer);
      timer = null;
      setzeLauf(false);
    }
    function takt() {
      timer = null;
      if (fertig || !laeuftJetzt) return;
      gehe(index + 1, true);
      if (index >= schritte.length - 1) pause();
      else timer = setTimeout(takt, TEMPO[tempoWahl].ms);
    }
    function tempo(t) {
      if (!TEMPO[t] || ruhig) return tempoWahl;
      tempoWahl = t;
      for (const b of tempoKnoepfe) {
        const an = b.dataset.tempo === t;
        b.setAttribute('aria-checked', String(an));
        b.setAttribute('tabindex', an ? '0' : '-1');
      }
      if (laeuftJetzt && t === 'einzel') pause();
      liveSetzen();
      return tempoWahl;
    }
    function abspielen() {
      if (fertig || ruhig) return;
      if (tempoWahl === 'einzel') tempo('normal');
      if (index >= schritte.length - 1) gehe(0, false);
      setzeLauf(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(takt, TEMPO[tempoWahl].ms);
    }
    const vor = () => {
      pause();
      gehe(index + 1, false);
    };
    const zurueck = () => {
      pause();
      gehe(index - 1, false);
    };
    const anfang = () => {
      pause();
      gehe(0, false);
    };
    const ende = () => {
      pause();
      gehe(schritte.length - 1, false);
    };
    kAnfang.addEventListener('click', anfang);
    kZurueck.addEventListener('click', zurueck);
    kVor.addEventListener('click', vor);
    kEnde.addEventListener('click', ende);
    kAbspielen.addEventListener('click', () => (laeuftJetzt ? pause() : abspielen()));
    for (const b of tempoKnoepfe) b.addEventListener('click', () => tempo(b.dataset.tempo));
    element.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && ['input', 'textarea', 'select'].includes(t.localName)) return;
      if (t && t.getAttribute && t.getAttribute('role') === 'radio' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const liste = Object.keys(TEMPO);
        const neu = liste[(liste.indexOf(tempoWahl) + (e.key === 'ArrowRight' ? 1 : liste.length - 1)) % liste.length];
        tempo(neu);
        const ziel2 = tempoKnoepfe.find((b) => b.dataset.tempo === neu);
        if (ziel2) ziel2.focus();
        e.preventDefault();
        return;
      }
      const aktion = { ArrowRight: vor, ArrowLeft: zurueck, Home: anfang, End: ende, ' ': ruhig ? vor : () => (laeuftJetzt ? pause() : abspielen()) }[e.key];
      if (!aktion) return;
      e.preventDefault();
      aktion();
    });
    ziel.appendChild(element);
    anzeigen(false);
    return {
      element,
      gehe: (i) => {
        pause();
        gehe(i, false);
      },
      vor,
      zurueck,
      anfang,
      ende,
      abspielen,
      pause,
      tempo,
      index: () => index,
      laeuft: () => laeuftJetzt,
      schliesse() {
        pause();
        fertig = true;
        element.remove();
      }
    };
  }

  /* ---------- Alle Schlüssel ausprobieren (Brute-Force-Demo) ---------- */

  /**
   * Tabelle aller Versuche + Nachspiel „Nacheinander ausprobieren“. o = { titel, schluessel: [...], beschriftung(k),
   * probiere(k) → Text (nur Krypto.*), anmerkung(k), zeichen, eingabe }. Keine Zeile wird als richtig markiert.
   */
  function alleSchluessel(ziel, o = {}) {
    const liste = Array.isArray(o.schluessel) ? o.schluessel : [];
    const beschriftung = typeof o.beschriftung === 'function' ? o.beschriftung : (k) => String(k);
    const zeichen = Number.isInteger(o.zeichen) && o.zeichen > 0 ? o.zeichen : 20;
    const kurz = (t, n) => (t.length > n ? `${t.slice(0, n)}…` : t);
    const versuche = liste.map((k) => {
      let ergebnis = '';
      let anmerkung = typeof o.anmerkung === 'function' ? o.anmerkung(k) : null;
      try {
        ergebnis = Krypto.klein(String(o.probiere(k)));
      } catch (e) {
        if (!e || e.name !== 'KryptoFehler') throw e;
        anmerkung = 'passt nicht';
      }
      return { k, ergebnis, anmerkung };
    });
    const zeilen = versuche.map((v) =>
      h(
        'tr',
        { 'data-schluessel': String(v.k) },
        h('th', { scope: 'row' }, h('span', { class: 'zeiger', 'aria-hidden': 'true' }), beschriftung(v.k)),
        h('td', { class: 'ergebnis' }, kurz(v.ergebnis, zeichen)),
        h('td', { class: 'anmerkung' }, v.anmerkung || '')
      )
    );
    const titel = o.titel ? String(o.titel) : 'Alle Schlüssel ausprobieren';
    const box = h(
      'div',
      { class: 'alle-schluessel' },
      h('div', { class: 'scroll-x' }, h('table', { class: 'alle-tabelle' }, h('caption', null, titel), h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Schlüssel'), h('th', { scope: 'col' }, 'Ergebnis'), h('th', { scope: 'col' }, 'Anmerkung'))), h('tbody', null, zeilen)))
    );
    ziel.appendChild(box);
    const eingabe = o.eingabe ? String(o.eingabe) : '';
    const ns = nachspiel(box, {
      titel: 'Nacheinander ausprobieren',
      start: o.start === -1 ? -1 : 0,
      schritte: versuche.map((v) => ({
        text: v.anmerkung === 'passt nicht' && !v.ergebnis ? `${beschriftung(v.k)}: passt nicht.` : `${beschriftung(v.k)}: ${eingabe ? `${kurz(eingabe, 5)} → ` : ''}${kurz(v.ergebnis, 5)} Sinnvoller Text oder Buchstabensalat?`,
        daten: { k: v.k }
      })),
      zeige(_s, i) {
        zeilen.forEach((z, j) => {
          z.classList.toggle('aktuell', j === i);
          z.querySelector('.zeiger').textContent = j === i ? '▶ ' : '';
          if (j === i) z.setAttribute('aria-current', 'true');
          else z.removeAttribute('aria-current');
        });
      }
    });
    return { element: box, nachspiel: ns, schliesse: () => ns.schliesse() };
  }

  return { WERKZEUGE, REITER_REGELN, GRUND, werkzeug, registriere, hat, bereit, lade, erlaubt, reiterFuer, oeffne, aktiv, sperreAlle, wache, dialog, nachspiel, alleSchluessel };
})();
