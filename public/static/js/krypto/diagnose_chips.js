/* Kryptos – Diagnose-Chips (M4 Task 50, Delta §9.1): erkannte Fallen als Chip „P3 Umkehrung falsch“ mit Link auf die
   Fallen-Übersicht und dem Diagnose-Text des Servers. Texte nur als Textknoten. */
'use strict';

const KRDiag = (() => {
  const { h } = AQ;
  const MAX = 2;

  /** Fallen-Chip: a.chip.chip-falle → /themen#fallen-<p>, Text „P3 Umkehrung falsch“. */
  function chip(p) {
    const titel = KR.FALLEN[p];
    return h('a', { class: 'chip chip-falle', href: `/themen#fallen-${p}`, title: titel ? `Typische Falle ${p}: ${titel}` : 'Typische Falle' }, titel ? `${p} ${titel}` : String(p));
  }

  /** Diagnose-Liste [{ p, code, text }] → div.diagnose (höchstens zwei Einträge) oder null. */
  function chips(liste) {
    const eintraege = (Array.isArray(liste) ? liste : []).filter((d) => d && typeof d === 'object').slice(0, MAX);
    if (!eintraege.length) return null;
    return h(
      'div',
      { class: 'diagnose', role: 'note' },
      eintraege.map((d) => h('div', { class: 'diagnose-eintrag' }, d.p ? chip(d.p) : null, d.text ? h('p', { class: 'diagnose-text' }, d.text) : null))
    );
  }

  /** Anzeige-Hooks für AQA.ansicht (alle Kryptos-Seiten). */
  const anzeige = Object.freeze({ kategorie: (s) => KR.KATEGORIEN[s] || s, falle: chip, diagnose: chips });

  return { chip, chips, anzeige };
})();
