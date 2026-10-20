/* Kryptos – Aufgaben-Panel „Werkzeug“ (Plan M11 Task 247, E214–E218, E221). Statt eines Dialogs klappt das Werkzeug
   in der Aufgabe auf: Schalter button[aria-expanded][aria-controls] „<Objekt> benutzen“ (M12 E231, z. B. „Skytale-Stab
   benutzen“; objektName), Fläche section[role=region]
   (anfangs hidden), Fuß mit Hinweis und Zweitlink „Im Labor öffnen“. Das Modul lädt beim ersten Aufklappen
   (KRLabor.oeffne, Freigaben vorher frisch über ctx.laborFrisch). Mit gefuehrt: true startet es geführt mit den Werten
   der Voreinstellung (umgebung.gefuehrt = { aufgabe }); verglichen wird erst nach der Freigabe (KRPanel.freigeben →
   KRGefuehrt.freigeben, auch vor dem Laden gemerkt). Höchstens ein offenes Werkzeug je Seite; schliesseAlle beim
   Seitenwechsel. Tasten bleiben im Panel, Esc klappt es zu. Texte nur als Textknoten, Lernende geduzt. Speichert nichts.
   M12 (E232): Block-Feld offen: true klappt das Panel beim Anzeigen auf (W0-Werkstatt-Aufgaben). */
'use strict';

const KRPanel = (() => {
  const { h } = AQ;
  const OFFEN = new Set(); // { schliesse() } der aufgeklappten Panels
  const FREI = new Set(); // freigegebene Aufgaben (Seitenaufruf)
  const enc = encodeURIComponent;
  let nr = 0;

  /** Aufgabe freigeben (gelöst oder Lösung angesehen); laufende geführte Werkzeuge vergleichen sofort */
  function freigeben(aufgabeId) {
    if (typeof aufgabeId !== 'string' || !aufgabeId) return 0;
    FREI.add(aufgabeId);
    return typeof KRGefuehrt !== 'undefined' ? KRGefuehrt.freigeben(aufgabeId) : 0;
  }
  /** Alle Panels zuklappen (Seitenwechsel, Boss-Sperre); Einträge gehen verloren. → Zahl */
  function schliesseAlle() {
    let n = 0;
    for (const p of [...OFFEN]) {
      p.schliesse();
      n += 1;
    }
    return n;
  }
  const offen = () => OFFEN.size;

  /*
   * Tablet hoch (1.3.2, Auftrag der Lehrkraft „alle Ansichten gut mit dem Tablet“): Unter 960 px steht das offene Werkzeug
   * im Fluss über der Antwort – bei hohen Werkzeugen lägen Werkzeug und Antwortfeld mehr als eine Bildschirmhöhe
   * auseinander. Ist die Antwort kompakt (höchstens 30 % der Höhe, ein Antwortteil), klebt sie wie die Knopfleiste am
   * unteren Rand (.antwort-klebt, labor.css), bis sie an ihrer eigenen Stelle steht; ein Lückentext vor dem Werkzeug
   * klebt oben (.antwort-klebt-oben). Ab 960 px Seitenleiste (labor.css).
   */
  const TABLET_HOCH = '(min-width: 768px) and (max-width: 959.98px) and (min-height: 640px)';
  const KLEBT = 'antwort-klebt'; // Antwort nach dem Werkzeug: klebt unten über der Knopfleiste
  const KLEBT_OBEN = 'antwort-klebt-oben'; // Lückentext vor dem Werkzeug (z. B. RSA): klebt oben
  /** Antwort zum Panel: die Antwortteile der Aufgabe (nach dem Inhalt) oder – ohne Antwortteil – der eine Block mit Lücken */
  function antwortZu(panelEl, box) {
    const teile = [...box.children].filter((x) => x.getAttribute && x.getAttribute('role') === 'group');
    if (teile.length) return { els: teile, oben: false };
    const inhalt = [...box.children].find((x) => x.classList && x.classList.contains('inhalt'));
    if (!inhalt) return null;
    const bloecke = [...inhalt.children];
    const eigen = bloecke.findIndex((b) => b.contains(panelEl));
    const luecken = bloecke.filter((b, i) => i !== eigen && b.querySelector('input.luecke, select.luecke'));
    if (luecken.length !== 1 || eigen < 0) return null;
    return { els: luecken, oben: bloecke.indexOf(luecken[0]) < eigen };
  }
  function antwortKleben(panelEl, an) {
    const box = panelEl && typeof panelEl.closest === 'function' ? panelEl.closest('.aufgabe-box') : null;
    if (!box) return;
    for (const x of box.querySelectorAll(`.${KLEBT}, .${KLEBT_OBEN}`)) x.classList.remove(KLEBT, KLEBT_OBEN);
    const wurzel = document.documentElement;
    if (wurzel && wurzel.style) wurzel.style.removeProperty('--antwort-hoehe');
    if (!an || typeof matchMedia !== 'function' || !matchMedia(TABLET_HOCH).matches) return;
    const ziel = antwortZu(panelEl, box);
    if (!ziel) return;
    const hoehe = (x) => (x.getBoundingClientRect ? x.getBoundingClientRect().height || 0 : 0);
    const summe = ziel.els.reduce((n, x) => n + hoehe(x), 0);
    const vh = typeof innerHeight === 'number' && innerHeight > 0 ? innerHeight : 1024;
    if (summe > vh * 0.3) return;
    const leiste = document.querySelector('.aktionen');
    let unten = leiste && leiste.getBoundingClientRect ? leiste.getBoundingClientRect().height || 0 : 0;
    // mehrere Antwortteile (z. B. Schlüssel und Klartext) stapeln sich: jeder klebt über den folgenden
    for (const t of [...ziel.els].reverse()) {
      t.style.setProperty('--aktionen-hoehe', `${Math.round(unten)}px`);
      unten += hoehe(t);
      t.classList.add(ziel.oben ? KLEBT_OBEN : KLEBT);
    }
    if (wurzel && wurzel.style) wurzel.style.setProperty('--antwort-hoehe', `${Math.round(summe)}px`);
  }
  /** nach dem Einhängen messen (offen: true klappt schon vor dem Einhängen auf) */
  function antwortKlebenSpaeter(panelEl) {
    const los = () => {
      if (panelEl.dataset && panelEl.dataset.offen) antwortKleben(panelEl, true);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(los);
    else los();
  }
  /** Seitenleiste (ab 960 px): oben nur so viel Platz, wie die Kopfzeile gerade sichtbar ist (--kopf-sichtbar) */
  let kopfGeplant = false;
  function kopfSichtbar() {
    if (kopfGeplant || !OFFEN.size) return;
    kopfGeplant = true;
    const los = () => {
      kopfGeplant = false;
      const kopf = document.getElementById('kopf');
      if (!kopf || !kopf.getBoundingClientRect) return;
      document.documentElement.style.setProperty('--kopf-sichtbar', `${Math.max(0, Math.round(kopf.getBoundingClientRect().bottom))}px`);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(los);
    else los();
  }
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('scroll', kopfSichtbar, { passive: true });
  // Drehen des Tablets: neu entscheiden
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', () => OFFEN.forEach((p) => p.el && antwortKlebenSpaeter(p.el)));

  // M12 (E231): anschauliches Objekt je Werkzeug und Reiter für den Schalter „<Objekt> benutzen“
  const OBJEKT = Object.freeze({
    'skytale.skytale': 'Skytale-Stab',
    'skytale.gartenzaun': 'Gartenzaun',
    'skytale.fleissner': 'Fleißner-Karton',
    'skytale.pfluegen': 'Pflugfeld',
    'skytale.ring': 'Ring',
    scheibe: 'Chiffrierscheibe',
    'scheibe.leiste': 'Alphabet-Leiste',
    'quadrat.polybios': 'Polybios-Quadrat',
    'quadrat.playfair': 'Playfair-Quadrat',
    'quadrat.adfgvx': 'ADFGVX-Quadrat',
    'quadrat.spalten': 'Spalten-Raster',
    'signale.morse': 'Morse-Tafel',
    'signale.klopfcode': 'Klopf-Gitter',
    'signale.freimaurer': 'Freimaurer-Gitter',
    'vigenere.quadrat': 'Vigenère-Quadrat',
    'vigenere.verschluesseln': 'Vigenère-Quadrat',
    bitlupe: 'Bit-Lupe',
    'runden.enigma': 'Mini-Enigma',
    'modulo.uhr': 'Modulo-Uhr',
    'modulo.farbmischer': 'Farbmischer',
    enigma: 'Enigma'
  });
  /** Name des Objekts für Werkzeug id und Voreinstellung (erster Reiter), sonst der Werkzeugname */
  function objektName(id, voreinstellung) {
    const w = typeof KRLabor !== 'undefined' ? KRLabor.werkzeug(id) : null;
    const r = voreinstellung && Array.isArray(voreinstellung.reiter) && typeof voreinstellung.reiter[0] === 'string' ? voreinstellung.reiter[0] : w && w.reiter[0];
    return OBJEKT[`${id}.${r}`] || OBJEKT[id] || (w ? w.titel : String(id ?? 'Werkzeug'));
  }

  /** Link ins Labor mit Reitern und Level (wie die Level-Karten) */
  function laborLink(id, v, umgebung) {
    const r = v && Array.isArray(v.reiter) ? v.reiter.filter((x) => typeof x === 'string' && /^[a-z]+$/.test(x)) : [];
    const level = umgebung && typeof umgebung.level === 'string' && /^W\d-L\d{1,2}[a-z]?$/.test(umgebung.level) ? umgebung.level : null;
    const teile = [...(r.length ? [`reiter=${r.join(',')}`] : []), ...(level ? [`level=${level}`] : [])];
    return `/labor#/${enc(id)}${teile.length ? `?${teile.join('&')}` : ''}`;
  }

  /**
   * Panel für einen Block { id, titel?, voreinstellung?, gefuehrt?, hinweis? } im ctx der Aufgabe (modus, aufgabeId,
   * laborUmgebung, laborFrisch, werkzeugFrei). Im Boss-Kampf null. o = { schalter: Text des Schalters (Level-Karte:
   * „Hier ausprobieren“), ohneLink: true (die Karte verlinkt das Labor schon) }.
   */
  function panel(b, ctx = {}, o = {}) {
    if (ctx.modus === 'boss') return null;
    const w = typeof KRLabor !== 'undefined' ? KRLabor.werkzeug(b.id) : null;
    const name = w ? w.titel : String(b.id ?? 'Werkzeug');
    const frei = typeof ctx.werkzeugFrei !== 'function' || ctx.werkzeugFrei(b.id) !== false;
    const modus = ctx.modus === 'gast' || ctx.modus === 'vorschau' ? ctx.modus : 'lab';
    const extra = ctx.laborUmgebung && typeof ctx.laborUmgebung === 'object' ? ctx.laborUmgebung : {};
    const aufgabe = typeof ctx.aufgabeId === 'string' && ctx.aufgabeId ? ctx.aufgabeId : null;
    nr += 1;
    const sId = `werkzeug-schalter-${nr}`;
    const fId = `werkzeug-flaeche-${nr}`;
    const chips = [];
    if (w && w.art === 'zusatz') chips.push(h('span', { class: 'werkzeug-art art-zusatz' }, 'Zusatz'));
    if (w && w.art === 'kuer') chips.push(h('span', { class: 'werkzeug-art art-kuer' }, 'Kür'));
    if (b.gefuehrt === true) chips.push(h('span', { class: 'chip werkzeug-gefuehrt-chip' }, 'Schritt für Schritt'));
    const schalter = h(
      'button',
      { type: 'button', id: sId, class: 'werkzeug-schalter', 'aria-expanded': 'false', 'aria-controls': fId, disabled: !frei },
      KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }),
      h('span', { class: 'werkzeug-schalter-text' }, typeof o.schalter === 'string' && o.schalter ? o.schalter : `${objektName(b.id, b.voreinstellung)} benutzen`),
      chips,
      h('span', { class: 'werkzeug-pfeil', 'aria-hidden': 'true' }, '▾')
    );
    const flaeche = h('div', { class: 'werkzeug-panel-inhalt' });
    const link = h('a', { class: 'knopf knopf-leise werkzeug-labor-link', href: laborLink(b.id, b.voreinstellung, extra) }, 'Im Labor öffnen');
    const fuss = h('div', { class: 'werkzeug-panel-fuss' }, typeof b.hinweis === 'string' && b.hinweis ? h('p', { class: 'werkzeug-hinweis text-2' }, b.hinweis) : null, o.ohneLink ? null : link);
    const zu = h('button', { type: 'button', class: 'knopf knopf-leise werkzeug-zuklappen', 'aria-label': `Werkzeug ${name} schließen` }, KR.symbol('icons', 'i-schliessen'), h('span', { class: 'lang' }, 'Schließen'));
    const bereich = h(
      'section',
      { id: fId, class: 'werkzeug-panel-flaeche', role: 'region', 'aria-labelledby': sId, hidden: true },
      h('div', { class: 'werkzeug-panel-kopf' }, h('b', { class: 'werkzeug-name' }, name), zu),
      b.titel ? h('p', { class: 'werkzeug-auftrag' }, String(b.titel)) : null,
      flaeche,
      fuss
    );
    const el = h(
      'div',
      { class: 'werkzeug-panel' + (frei ? '' : ' gesperrt') + (b.offen === true && frei ? ' panel-offen-start' : ''), 'data-epoche': w ? String(w.welt) : null },
      schalter,
      frei ? null : h('p', { class: 'werkzeug-grund' }, 'Deine Lehrkraft schaltet dieses Werkzeug später frei.'),
      bereich
    );
    // Tasten bleiben im Werkzeug (z. B. Enter löst nie das Prüfen der Aufgabe aus)
    // Esc klappt das Panel zu (Nachtrag M11), außer ein Werkzeug hat die Taste schon selbst verbraucht
    bereich.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape' && !e.defaultPrevented) {
        e.preventDefault();
        eintrag.schliesse();
        schalter.focus();
      }
    });
    bereich.addEventListener('keyup', (e) => e.stopPropagation());

    let steuer = null;
    let lauf = 0;
    const eintrag = {
      el,
      schliesse() {
        lauf += 1;
        if (steuer) steuer.schliesse();
        steuer = null;
        AQ.clear(flaeche);
        bereich.hidden = true;
        delete el.dataset.offen;
        schalter.setAttribute('aria-expanded', 'false');
        OFFEN.delete(eintrag);
        antwortKleben(el, false);
      }
    };
    function starte(umgebung) {
      const u = { ...umgebung, modus };
      if (aufgabe) u.aufgabe = aufgabe; // Freigabe auch, wenn der Erkenner erst später umschaltet
      if (b.gefuehrt === true) u.gefuehrt = { aufgabe };
      if (aufgabe && FREI.has(aufgabe) && typeof KRGefuehrt !== 'undefined') KRGefuehrt.freigeben(aufgabe);
      steuer = KRLabor.oeffne(b.id, b.voreinstellung, flaeche, u);
      // gefuehrt.js erst jetzt nachgeladen? Freigabe nach dem Start nachholen
      if (aufgabe && FREI.has(aufgabe) && typeof KRGefuehrt === 'undefined') {
        KRLabor.lade(b.id).then(() => {
          if (FREI.has(aufgabe) && typeof KRGefuehrt !== 'undefined') KRGefuehrt.freigeben(aufgabe);
        }, () => {});
      }
    }
    function oeffne() {
      schliesseAlle();
      OFFEN.add(eintrag);
      el.dataset.offen = 'ja';
      bereich.hidden = false;
      schalter.setAttribute('aria-expanded', 'true');
      antwortKlebenSpaeter(el);
      kopfSichtbar();
      const meiner = ++lauf;
      if (typeof ctx.laborFrisch !== 'function') {
        starte(extra);
        return;
      }
      AQ.mount(flaeche, h('p', { class: 'laden', role: 'status' }, 'Wird geladen …'));
      Promise.resolve()
        .then(() => ctx.laborFrisch(b.id))
        .catch(() => null)
        .then((neu) => {
          if (meiner !== lauf) return;
          starte(neu && typeof neu === 'object' ? neu : extra);
        });
    }
    zu.addEventListener('click', () => {
      eintrag.schliesse();
      schalter.focus();
    });
    schalter.addEventListener('click', () => {
      if (schalter.disabled) return;
      if (OFFEN.has(eintrag)) eintrag.schliesse();
      else oeffne();
    });
    // M12 (E232): offen – nach dem Einhängen der Aufgabe aufklappen (Mikroaufgabe; Navigation schließt vorher alle)
    if (b.offen === true && frei) {
      Promise.resolve().then(() => {
        if (!OFFEN.has(eintrag) && !schalter.disabled) oeffne();
      });
    }
    return el;
  }

  return { panel, schliesseAlle, freigeben, offen, objektName };
})();
