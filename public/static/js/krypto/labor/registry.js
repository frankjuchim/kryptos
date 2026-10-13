/* Kryptos – Labor-Registry im Client (TECHNIK §10.2, M4 Task 53): Werkzeugliste (= src/krypto/werkzeuge.js, Test
   labor.test.js), Registrierung der Werkzeug-Module (M6), Öffnen in einem Container oder in einem <dialog> mit Kopfband
   im Epochenakzent, Fokusfalle, Esc und Rückkehr des Fokus. Ohne Modul: Leerzustand „noch in Arbeit“. */
'use strict';

const KRLabor = (() => {
  const { h } = AQ;

  // = src/krypto/werkzeuge.js ohne Voreinstellungs-Schlüssel (Test labor.test.js); reiter: Reihenfolge = Anzeige (M6 E73)
  const WERKZEUGE = Object.freeze(
    [
      { id: 'skytale', titel: 'Skytale & Gitter', welt: 0, reiter: ['skytale', 'gartenzaun', 'fleissner', 'ring'] },
      { id: 'scheibe', titel: 'Chiffrierscheibe', welt: 0, reiter: ['scheibe', 'text', 'alle'] },
      { id: 'haeufigkeit', titel: 'Häufigkeits-Analysator', welt: 1, reiter: ['histogramm', 'bigramme', 'teiltexte', 'kennzahlen'] },
      { id: 'substitution', titel: 'Substitutions-Werkbank', welt: 1, reiter: [] },
      { id: 'vigenere', titel: 'Vigenère-Werkbank', welt: 2, reiter: ['quadrat', 'verschluesseln', 'kasiski', 'teiltexte', 'koinzidenz', 'verschiebung', 'korrektur'] },
      { id: 'bitlupe', titel: 'Bit-Lupe', welt: 3, reiter: ['zeichen', 'xor', 'doppelnutzung'] },
      { id: 'runden', titel: 'Runden-Labor', welt: 3, reiter: ['runden', 'lawine', 'verfolgung', 'modi', 'fehler', 'enigma'] },
      { id: 'modulo', titel: 'Modulo-Uhr & Farbmischer', welt: 4, reiter: ['uhr', 'tabelle', 'inverses', 'farbmischer'] },
      { id: 'rsa', titel: 'RSA-Rechenwerk', welt: 4, reiter: ['rechenwerk', 'euklid', 'text'] },
      { id: 'hash', titel: 'Hash-Labor', welt: 5, reiter: ['schritte', 'lawine', 'kollision', 'baukasten', 'passwort', 'pruefsumme'] },
      { id: 'signatur', titel: 'Signatur- & Zertifikats-Simulator', welt: 5, reiter: ['signatur', 'zertifikat', 'mitm'] }
    ].map((w) => Object.freeze({ ...w, reiter: Object.freeze(w.reiter) }))
  );
  const NACH_ID = new Map(WERKZEUGE.map((w) => [w.id, w]));
  const MODULE = new Map();

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

  /** Werkzeug in container öffnen; liefert { schliesse() }. Ohne Modul: Leerzustand. */
  function oeffne(id, voreinstellung, container, umgebung = { modus: 'labor' }) {
    const modul = MODULE.get(id);
    if (!modul) {
      AQ.mount(container, h('div', { class: 'leer-zustand' }, KR.symbol('icons', 'i-labor'), h('p', { class: 'leer-zustand-text' }, 'Dieses Werkzeug ist noch in Arbeit.')));
      return { schliesse() {} };
    }
    AQ.clear(container);
    const r = modul.oeffne(container, voreinstellung && typeof voreinstellung === 'object' ? voreinstellung : {}, umgebung || { modus: 'labor' });
    return r && typeof r.schliesse === 'function' ? r : { schliesse() {} };
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

  return { WERKZEUGE, werkzeug, registriere, hat, oeffne, dialog };
})();
