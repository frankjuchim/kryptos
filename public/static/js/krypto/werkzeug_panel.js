/* Kryptos – Aufgaben-Panel „Werkzeug“ (Plan M11 Task 247, E214–E218, E221). Statt eines Dialogs klappt das Werkzeug
   in der Aufgabe auf: Schalter button[aria-expanded][aria-controls] „Werkzeug: <Titel>“, Fläche section[role=region]
   (anfangs hidden), Fuß mit Hinweis und Zweitlink „Im Labor öffnen“. Das Modul lädt beim ersten Aufklappen
   (KRLabor.oeffne, Freigaben vorher frisch über ctx.laborFrisch). Mit gefuehrt: true startet es geführt mit den Werten
   der Voreinstellung (umgebung.gefuehrt = { aufgabe }); verglichen wird erst nach der Freigabe (KRPanel.freigeben →
   KRGefuehrt.freigeben, auch vor dem Laden gemerkt). Höchstens ein offenes Werkzeug je Seite; schliesseAlle beim
   Seitenwechsel. Tasten bleiben im Panel. Texte nur als Textknoten, Lernende geduzt. Speichert nichts. */
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
      h('span', { class: 'werkzeug-schalter-text' }, typeof o.schalter === 'string' && o.schalter ? o.schalter : `Werkzeug: ${name}`),
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
      { class: 'werkzeug-panel' + (frei ? '' : ' gesperrt'), 'data-epoche': w ? String(w.welt) : null },
      schalter,
      frei ? null : h('p', { class: 'werkzeug-grund' }, 'Deine Lehrkraft schaltet dieses Werkzeug später frei.'),
      bereich
    );
    // Tasten bleiben im Werkzeug (z. B. Enter löst nie das Prüfen der Aufgabe aus)
    bereich.addEventListener('keydown', (e) => e.stopPropagation());
    bereich.addEventListener('keyup', (e) => e.stopPropagation());

    let steuer = null;
    let lauf = 0;
    const eintrag = {
      schliesse() {
        lauf += 1;
        if (steuer) steuer.schliesse();
        steuer = null;
        AQ.clear(flaeche);
        bereich.hidden = true;
        delete el.dataset.offen;
        schalter.setAttribute('aria-expanded', 'false');
        OFFEN.delete(eintrag);
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
    return el;
  }

  return { panel, schliesseAlle, freigeben, offen };
})();
