/* Kryptos – Bausteine der Labor-Werkzeuge (Plan M6 Task 110, DESIGNSYSTEM §5): Reiterleiste, Textfeld mit
   Live-Normalisierung, Zahlregler, Richtungsschalter, Ausgabe mit Kopieren, Hinweis, Tabelle, aufklappbarer Bereich.
   Alles per Tastatur bedienbar (WCAG 2.1 AA), Touch-Ziele ≥ 44 px (labor.css), Ausgaben nur als Textknoten.
   Fachliche Rechnungen (Normalisierung, Gruppen) ausschließlich über Krypto.*; speichert nichts. */
'use strict';

const KRLaborBau = (() => {
  const { h } = AQ;
  let zaehler = 0;
  const neueId = (vor) => {
    zaehler += 1;
    return `${vor}-${zaehler}`;
  };

  /**
   * Reiterleiste (role=tablist) + Fläche (role=tabpanel). liste: [{ id, titel }]; ←/→, Pos1/Ende wechseln sofort.
   * → { element, leiste, flaeche, aktiv(), waehle(id) }
   */
  function reiter(liste, { aktiv, beiWechsel } = {}) {
    const eintraege = (Array.isArray(liste) ? liste : []).filter((r) => r && typeof r.id === 'string');
    let jetzt = eintraege.some((r) => r.id === aktiv) ? aktiv : eintraege.length ? eintraege[0].id : null;
    const flaecheId = neueId('labor-flaeche');
    const knoepfe = eintraege.map((r) => h('button', { type: 'button', role: 'tab', class: 'labor-tab', id: neueId('labor-tab'), 'data-reiter': r.id, 'aria-controls': flaecheId }, r.titel));
    const leiste = h('div', { class: 'labor-reiter', role: 'tablist', 'aria-label': 'Bereiche des Werkzeugs', hidden: knoepfe.length < 2 }, knoepfe);
    const flaeche = h('div', { class: 'labor-reiterflaeche', role: 'tabpanel', id: flaecheId, tabindex: '-1' });
    function markiere() {
      for (const b of knoepfe) {
        const an = b.dataset.reiter === jetzt;
        b.setAttribute('aria-selected', String(an));
        b.setAttribute('tabindex', an ? '0' : '-1');
        if (an) flaeche.setAttribute('aria-labelledby', b.id);
      }
    }
    function waehle(id, { fokus = false } = {}) {
      const b = knoepfe.find((x) => x.dataset.reiter === id);
      if (!b) return;
      const neu = id !== jetzt;
      jetzt = id;
      markiere();
      if (fokus) b.focus();
      if (neu && typeof beiWechsel === 'function') beiWechsel(id);
    }
    for (const b of knoepfe) {
      b.addEventListener('click', () => waehle(b.dataset.reiter));
      b.addEventListener('keydown', (e) => {
        const i = knoepfe.indexOf(b);
        const n = knoepfe.length;
        const ziel = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (ziel === undefined) return;
        e.preventDefault();
        waehle(knoepfe[ziel].dataset.reiter, { fokus: true });
      });
    }
    markiere();
    const element = h('div', { class: 'labor-reiter-rahmen' }, leiste, flaeche);
    return { element, leiste, flaeche, aktiv: () => jetzt, waehle };
  }

  /** Buchstabenzahl als Text „n = 18 Buchstaben“ (bzw. Bits/Zeichen je Art). */
  function laenge(art, wert) {
    try {
      if (art === 'bits') return `n = ${Krypto.normBits(wert).length} Bits`;
      if (art === 'frei') return `n = ${[...wert].length} Zeichen`;
      const n = Krypto.nurBuchstaben(wert).length;
      return `n = ${n} ${n === 1 ? 'Buchstabe' : 'Buchstaben'}`;
    } catch {
      return '';
    }
  }

  /**
   * Textfeld mit Beschriftung, maxlength und Längenanzeige. art: klartext | geheimtext | bits | frei (Anzeige-Hinweis).
   * → { element, feld, wert(), setze(t), sperre(an) }
   */
  function textfeld({ beschriftung = 'Text', max = 200, wert = '', art = 'klartext', beiEingabe, zeilen = 3, platzhalter = null } = {}) {
    const id = neueId('labor-text');
    const feld = h('textarea', { id, class: `labor-eingabe art-${art}`, maxlength: String(max), rows: String(zeilen), spellcheck: 'false', autocomplete: 'off', autocapitalize: art === 'geheimtext' ? 'characters' : 'off', placeholder: platzhalter });
    feld.value = String(wert ?? '').slice(0, max);
    const anzeige = h('p', { class: 'labor-laenge', 'aria-live': 'off' }, laenge(art, feld.value));
    feld.addEventListener('input', () => {
      anzeige.textContent = laenge(art, feld.value);
      if (typeof beiEingabe === 'function') beiEingabe(feld.value);
    });
    const element = h('div', { class: 'labor-textfeld' }, h('label', { for: id }, beschriftung), feld, anzeige);
    return {
      element,
      feld,
      wert: () => feld.value,
      setze(t) {
        feld.value = String(t ?? '').slice(0, max);
        anzeige.textContent = laenge(art, feld.value);
      },
      sperre(an) {
        feld.disabled = !!an;
      }
    };
  }

  /**
   * Zahlregler: − / Wert (role=spinbutton) / +. ↑/→ +1, ↓/← −1, Bild↑/↓ ±5, Pos1/Ende Grenzen.
   * → { element, wert(), setze(n), grenzen(min, max), sperre(an) }
   */
  function zahl({ beschriftung = 'Zahl', min = 0, max = 10, wert = min, beiWechsel, format, minusText = '−', plusText = '+', minusLabel, plusLabel } = {}) {
    let lo = min;
    let hi = max;
    const begrenze = (n) => Math.max(lo, Math.min(hi, Math.round(Number(n))));
    let jetzt = begrenze(Number.isFinite(Number(wert)) ? wert : min);
    const fmt = typeof format === 'function' ? format : (n) => String(n);
    const labelId = neueId('labor-zahl');
    const minus = h('button', { type: 'button', class: 'knopf knopf-leise zahl-minus', 'aria-label': minusLabel || `${beschriftung} verkleinern` }, minusText);
    const plus = h('button', { type: 'button', class: 'knopf knopf-leise zahl-plus', 'aria-label': plusLabel || `${beschriftung} vergrößern` }, plusText);
    const anzeige = h('output', { class: 'zahl-wert', role: 'spinbutton', tabindex: '0', 'aria-labelledby': labelId });
    let gesperrt = false;
    function zeige() {
      anzeige.textContent = fmt(jetzt);
      anzeige.setAttribute('aria-valuemin', String(lo));
      anzeige.setAttribute('aria-valuemax', String(hi));
      anzeige.setAttribute('aria-valuenow', String(jetzt));
      anzeige.setAttribute('aria-valuetext', fmt(jetzt));
      minus.disabled = gesperrt || jetzt <= lo;
      plus.disabled = gesperrt || jetzt >= hi;
    }
    function setze(n, melden = false) {
      const neu = begrenze(n);
      const anders = neu !== jetzt;
      jetzt = neu;
      zeige();
      if (anders && melden && typeof beiWechsel === 'function') beiWechsel(jetzt);
    }
    minus.addEventListener('click', () => setze(jetzt - 1, true));
    plus.addEventListener('click', () => setze(jetzt + 1, true));
    anzeige.addEventListener('keydown', (e) => {
      if (gesperrt) return;
      const neu = { ArrowUp: jetzt + 1, ArrowRight: jetzt + 1, ArrowDown: jetzt - 1, ArrowLeft: jetzt - 1, PageUp: jetzt + 5, PageDown: jetzt - 5, Home: lo, End: hi }[e.key];
      if (neu === undefined) return;
      e.preventDefault();
      setze(neu, true);
    });
    zeige();
    const element = h('div', { class: 'labor-zahl' }, h('span', { class: 'zahl-beschriftung', id: labelId }, beschriftung), h('div', { class: 'zahl-steuer' }, minus, anzeige, plus));
    return {
      element,
      wert: () => jetzt,
      setze: (n) => setze(n, false),
      grenzen(a, b) {
        lo = a;
        hi = b;
        setze(jetzt, false);
      },
      sperre(an) {
        gesperrt = !!an;
        anzeige.setAttribute('aria-disabled', String(gesperrt));
        zeige();
      }
    };
  }

  /** Richtungsschalter Verschlüsseln/Entschlüsseln (role=radiogroup, ←/→). → { element, wert(), setze(w), sperre(an) } */
  function richtung({ wert = 'ver', beiWechsel, texte = { ver: 'Verschlüsseln', ent: 'Entschlüsseln' } } = {}) {
    let jetzt = wert === 'ent' ? 'ent' : 'ver';
    const knoepfe = ['ver', 'ent'].map((r) => h('button', { type: 'button', role: 'radio', class: 'labor-richtung-wahl', 'data-richtung': r }, texte[r]));
    function zeige() {
      for (const b of knoepfe) {
        const an = b.dataset.richtung === jetzt;
        b.setAttribute('aria-checked', String(an));
        b.setAttribute('tabindex', an ? '0' : '-1');
      }
    }
    function setze(r, { melden = false, fokus = false } = {}) {
      if (r !== 'ver' && r !== 'ent') return;
      const anders = r !== jetzt;
      jetzt = r;
      zeige();
      if (fokus) knoepfe.find((b) => b.dataset.richtung === r).focus();
      if (anders && melden && typeof beiWechsel === 'function') beiWechsel(jetzt);
    }
    for (const b of knoepfe) {
      b.addEventListener('click', () => setze(b.dataset.richtung, { melden: true }));
      b.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        setze(jetzt === 'ver' ? 'ent' : 'ver', { melden: true, fokus: true });
      });
    }
    zeige();
    const element = h('div', { class: 'labor-richtung', role: 'radiogroup', 'aria-label': 'Richtung' }, knoepfe);
    return {
      element,
      wert: () => jetzt,
      setze: (r) => setze(r),
      sperre(an) {
        for (const b of knoepfe) b.disabled = !!an;
      }
    };
  }

  /** Anzeigeform einer Ausgabe (Geheimtext GROSS in Fünfergruppen, Klartext klein, Bits in Vierergruppen). */
  function anzeigeVon(art, roh) {
    if (!roh) return '';
    if (art === 'geheimtext') return Krypto.gruppieren(roh);
    if (art === 'klartext') return Krypto.klein(roh);
    if (art === 'bits') return Krypto.gruppieren(roh, 4);
    return roh;
  }

  const ANSAGE_MS = 500;
  /**
   * Entprellte Ansage für Screenreader (Review M6): span.sr.labor-ansage[aria-live=polite]; sage(text) schreibt erst nach
   * 500 ms Ruhe – beim Tippen kommt nur die letzte Ansage an. → { element, sage(text) }
   */
  function ansager() {
    const element = h('span', { class: 'sr labor-ansage', 'aria-live': 'polite' });
    let timer = null;
    return {
      element,
      sage(text) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          element.textContent = String(text ?? '');
        }, ANSAGE_MS);
      }
    };
  }

  /**
   * Ausgabe (output, nicht live) mit Kopierknopf und entprellter Ansage „Ergebnis aktualisiert, n Zeichen“ (erste Belegung
   * still); Kopieren ohne Leerzeichen der Gruppen. → { element, ausgabe, setze(wert), wert() }
   */
  function ausgabe({ beschriftung = 'Ergebnis', art = 'geheimtext' } = {}) {
    const id = neueId('labor-ausgabe');
    const out = h('output', { class: `labor-ausgabe art-${art}`, id, 'aria-live': 'off' });
    const ansage = ansager();
    let belegt = false;
    let roh = '';
    const kopieren = h('button', { type: 'button', class: 'knopf knopf-leise labor-kopieren', disabled: true }, 'Kopieren');
    kopieren.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(roh.replace(/\s+/g, ''));
        AQ.toast('Kopiert.');
      } catch {
        AQ.toast('Kopieren ist hier nicht möglich.', true);
      }
    });
    const element = h('div', { class: 'labor-ausgabe-rahmen' }, h('span', { class: 'labor-ausgabe-titel', id: `${id}-t` }, beschriftung), out, kopieren, ansage.element);
    out.setAttribute('aria-labelledby', `${id}-t`);
    return {
      element,
      ausgabe: out,
      setze(wert) {
        const neu = String(wert ?? '');
        const geaendert = neu !== roh;
        roh = neu;
        out.textContent = anzeigeVon(art, roh);
        kopieren.disabled = !roh;
        if (belegt && geaendert) {
          const n = [...roh.replace(/\s+/g, '')].length;
          ansage.sage(n ? `Ergebnis aktualisiert, ${n} Zeichen` : 'Ergebnis leer');
        }
        belegt = true;
      },
      wert: () => roh
    };
  }

  const SYMBOL = { info: 'ℹ', warnung: '⚠', falle: '⚠', ok: '✓' };
  /** Hinweis p.labor-hinweis[role=status] (Symbol + Text, Art info/warnung/falle/ok, optional Fallen-Chip). */
  function hinweis(art, text, { falle } = {}) {
    const a = SYMBOL[art] ? art : 'info';
    return h(
      'p',
      { class: `labor-hinweis hinweis-${a}`, role: 'status' },
      h('span', { class: 'labor-hinweis-symbol', 'aria-hidden': 'true' }, SYMBOL[a]),
      falle && typeof KRDiag !== 'undefined' ? KRDiag.chip(falle) : falle ? h('span', { class: 'chip chip-falle' }, falle) : null,
      h('span', { class: 'labor-hinweis-text' }, String(text ?? ''))
    );
  }

  /**
   * Echte Tabelle in div.scroll-x: caption, Kopf (th scope=col), Zeilen (erste Zelle th scope=row, wenn zeilenkopf).
   * Zellen sind Texte oder Knoten. → div.scroll-x
   */
  function tabelle({ caption, kopf = [], zeilen = [], klasse = '', zeilenkopf = true } = {}) {
    const zelle = (x, i) => (zeilenkopf && i === 0 ? h('th', { scope: 'row' }, x) : h('td', null, x));
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: `labor-tabelle ${klasse}`.trim() },
        caption ? h('caption', null, caption) : null,
        kopf.length ? h('thead', null, h('tr', null, kopf.map((k) => h('th', { scope: 'col' }, k)))) : null,
        h('tbody', null, zeilen.map((z) => h('tr', null, z.map(zelle))))
      )
    );
  }

  /** Aufklappbarer Bereich „Mehr ausprobieren“: details > summary + Inhalt. */
  function details(titel, inhalt, { klasse = '', offen = false } = {}) {
    return h('details', { class: `labor-details ${klasse}`.trim(), open: offen }, h('summary', null, titel), h('div', { class: 'labor-details-inhalt' }, inhalt));
  }

  /* ---------- Erkenner (Plan M11 Task 243, E209, E210) ---------- */

  const NICHT_VERFUEGBAR = 'Mit diesen Werten gibt es hier keinen Schritt-für-Schritt-Modus. Probier eigene Werte aus.';
  const HINWEISE = new WeakMap(); // ort → angezeigter Hinweis „nicht verfügbar“
  /**
   * Vor jeder Ausgabe eines rechnenden Reiters: Eingaben in den Verlauf, dann fragen, ob der Erkenner Aufgabenwerte
   * erkennt. Erkannt und o.gefuehrt (Funktion) → geführten Modus starten ('gefuehrt'); erkannt ohne geführten Modus →
   * neutraler Hinweis in ort ('nicht-verfuegbar'), das Modul gibt dann nichts aus; sonst 'frei'. Lehrkraft: immer frei.
   */
  function erkenne(ort, wr, eingaben, umgebung, verlauf, o = {}) {
    if (verlauf && typeof verlauf.merke === 'function') verlauf.merke(eingaben);
    const alt = ort ? HINWEISE.get(ort) : null;
    if (alt) {
      alt.remove();
      HINWEISE.delete(ort);
    }
    const E = typeof KRErkenner !== 'undefined' ? KRErkenner : null;
    if (!E || !E.erkannt(wr, eingaben, umgebung, verlauf)) return 'frei';
    if (typeof o.gefuehrt === 'function') {
      o.gefuehrt();
      return 'gefuehrt';
    }
    if (ort) {
      const el = h('div', { class: 'labor-nicht-verfuegbar' }, hinweis('info', NICHT_VERFUEGBAR));
      ort.appendChild(el);
      HINWEISE.set(ort, el);
    }
    return 'nicht-verfuegbar';
  }

  /** Erstes Textfeld in ort fokussieren, Schreibmarke ans Ende (aufgeklappte details) – nach dem Umschalten weitertippen */
  function fokusAmEnde(ort) {
    const f = ort && (ort.querySelector('section.gefuehrt textarea.labor-eingabe') || ort.querySelector('textarea.labor-eingabe, input.labor-eingabe'));
    if (!f) return false;
    for (let el = f.parentNode; el && el !== ort; el = el.parentNode) if (el.localName === 'details') el.open = true;
    f.focus();
    const n = String(f.value).length;
    if (typeof f.setSelectionRange === 'function') f.setSelectionRange(n, n);
    return true;
  }

  return { reiter, textfeld, zahl, richtung, ausgabe, ansager, hinweis, tabelle, details, neueId, erkenne, fokusAmEnde, NICHT_VERFUEGBAR };
})();
