/* Kryptos – Renderer der Krypto-Blöcke (Delta §7, TECHNIK §4.4), registriert über AQR.registriere:
   Geheimtext-Zeile (Hilfsfunktion), alphabet, haeufigkeit, bits (Task 51). Alles als DOM/SVG mit Textknoten
   (AQ.h/AQ.s), Rechnungen nur über Krypto (shared/krypto.js), Höhen/Positionen als SVG-Attribute (CSP: keine
   Inline-Styles). Lücken [[id]] über ctx.gap(id); Hervorhebungen nie nur über Farbe (Rahmen, Symbol, aria-current). */
'use strict';

const KRB = (() => {
  const { h, s } = AQ;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LUECKE_RE = /^\s*\[\[([A-Za-z0-9_-]{1,40})\]\]\s*$/;

  let zaehler = 0;
  /** eindeutige id kr-<n> (für aria-describedby, SVG-Muster) */
  function neueId() {
    zaehler += 1;
    return `kr-${zaehler}`;
  }

  /** Lücken-Element zu id (ctx.gap) oder Platzhalter wie im Kern. */
  function luecke(id, ctx) {
    const el = ctx && typeof ctx.gap === 'function' ? ctx.gap(id) : null;
    return el || h('span', { class: 'luecke', 'aria-label': 'Lücke' }, '…');
  }
  /** Ist der Wert eine ganze Lücke „[[id]]“? → id, sonst null. */
  function lueckenId(wert) {
    const m = typeof wert === 'string' ? LUECKE_RE.exec(wert) : null;
    return m ? m[1] : null;
  }

  /** Zahl in deutscher Schreibweise mit einer Nachkommastelle. */
  function komma(x, stellen = 1) {
    return (Math.round(Number(x) * 10 ** stellen) / 10 ** stellen).toFixed(stellen).replace('.', ',');
  }

  /* ---------- Geheimtext-Zeile ---------- */

  /**
   * Geheimtext (GROSS, Fünfergruppen) bzw. Klartext (klein) als Zeile mit Screenreader-Fassung, Positionsleiste,
   * Kopieren und „buchstabenweise vorlesen“.
   */
  function geheimtext(text, { art = 'geheim', gruppe = 5, positionen = false, kopieren = true } = {}) {
    const klar = art === 'klar';
    let roh = Krypto.normalisieren(String(text ?? ''));
    if (klar) roh = roh.toLowerCase();
    const n = Number.isInteger(gruppe) && gruppe > 0 ? gruppe : roh.length || 1;
    const gruppen = [];
    for (let i = 0; i < roh.length; i += n) gruppen.push(roh.slice(i, i + n));
    const name = klar ? 'Klartext' : 'Geheimtext';
    const sr = h('span', { class: 'sr' }, `${name}, buchstabiert: ${gruppen.map((g) => [...g].join(' ')).join(', ')}`);
    const zeile = h('span', { class: 'geheimtext-gruppen', 'aria-hidden': 'true' }, gruppen.map((g) => h('span', { class: 'gruppe' }, g)));
    const box = h('div', { class: klar ? 'klartext klartext-zeile' : 'geheimtext' });
    box.appendChild(h('div', { class: 'geheimtext-text' }, zeile, sr));
    if (positionen) {
      box.appendChild(h('div', { class: 'positionen', 'aria-hidden': 'true' }, gruppen.map((g, i) => h('span', null, String(i * n)))));
    }
    const knoepfe = h('div', { class: 'geheimtext-knoepfe' });
    if (kopieren) {
      knoepfe.appendChild(
        h(
          'button',
          {
            type: 'button',
            class: 'knopf knopf-leise kopieren',
            onclick: async () => {
              try {
                await navigator.clipboard.writeText(roh);
                AQ.toast('Kopiert.');
              } catch {
                AQ.toast('Kopieren ist hier nicht möglich.', true);
              }
            }
          },
          'Kopieren'
        )
      );
    }
    const vorlesen = h('button', { type: 'button', class: 'knopf knopf-leise vorlesen', 'aria-pressed': 'false' }, 'buchstabenweise vorlesen');
    vorlesen.addEventListener('click', () => {
      const an = vorlesen.getAttribute('aria-pressed') !== 'true';
      vorlesen.setAttribute('aria-pressed', String(an));
      box.classList.toggle('vorlesen', an);
    });
    knoepfe.appendChild(vorlesen);
    box.appendChild(knoepfe);
    return box;
  }

  /* ---------- alphabet (Delta §7.1) ---------- */

  function alphabet(b, ctx) {
    const basis = b.basis === 0 ? 0 : 1;
    const nummer = basis === 1 ? 'A = 1 … Z = 26' : 'A = 0 … Z = 25';
    const markiert = new Set((Array.isArray(b.markiert) ? b.markiert : []).filter((i) => Number.isInteger(i)));
    const zeilen = (Array.isArray(b.zeilen) ? b.zeilen : []).map((z) => ({
      label: String((z && z.label) ?? ''),
      werte: Array.isArray(z && z.werte) ? z.werte : [...String((z && z.werte) ?? '')]
    }));
    const titel = b.titel ? String(b.titel) : '';

    function zelle(z, i) {
      const w = z.werte[i];
      const id = lueckenId(w);
      const td = h('td', { class: markiert.has(i) ? 'markiert' : null });
      if (id) {
        const el = luecke(id, ctx);
        el.setAttribute('aria-label', `${z.label || 'Wert'} zu ${ALPHABET[i]}`);
        el.classList.add('luecke');
        td.appendChild(el);
      } else td.appendChild(document.createTextNode(String(w ?? '')));
      return td;
    }

    function teil(von, bis) {
      const spalten = [];
      for (let i = von; i < bis; i++) spalten.push(i);
      return h(
        'table',
        { class: 'alphabet-teil' },
        h('thead', null, h('tr', null, h('td', { class: 'ecke' }), spalten.map((i) => h('th', { scope: 'col', class: markiert.has(i) ? 'markiert' : null }, ALPHABET[i])))),
        h(
          'tbody',
          null,
          b.zahlen === false ? null : h('tr', { class: 'zahlen' }, h('th', { scope: 'row' }, nummer), spalten.map((i) => h('td', { class: markiert.has(i) ? 'markiert' : null }, String(i + basis)))),
          zeilen.map((z) => h('tr', null, h('th', { scope: 'row' }, z.label), spalten.map((i) => zelle(z, i))))
        )
      );
    }

    return h(
      'figure',
      { class: 'alphabet', role: 'group', 'aria-label': titel || `Alphabetleiste, Nummerierung ${nummer}` },
      h('figcaption', null, titel || `Alphabetleiste, Nummerierung ${nummer}`),
      h('div', { class: 'alphabet-haelften' }, h('div', { class: 'scroll-x' }, teil(0, 13)), h('div', { class: 'scroll-x' }, teil(13, 26)))
    );
  }

  /* ---------- haeufigkeit (Delta §7.2) ---------- */

  const BREITE = 520;
  const HOEHE = 220;
  const LINKS = 12;
  const BASIS_Y = 186;
  const MAX_H = 150;

  function haeufigkeit(b) {
    const id = neueId();
    const tabId = `${id}-tabelle`;
    const musterId = `schraffur-${id}`;
    const anzahl = {};
    if (b.quelle === 'werte') {
      const w = b.werte && typeof b.werte === 'object' ? b.werte : {};
      for (const c of ALPHABET) anzahl[c] = Number(w[c]) > 0 ? Number(w[c]) : 0;
    } else Object.assign(anzahl, Krypto.haeufigkeiten(String(b.text ?? '')));
    const summe = ALPHABET.split('').reduce((x, c) => x + anzahl[c], 0);
    const prozent = (c) => (summe ? (anzahl[c] / summe) * 100 : 0);
    const mitReferenz = b.referenz === 'deutsch';
    const proz = b.einheit === 'prozent';
    const wert = (c) => (proz ? prozent(c) : anzahl[c]);
    const deutsch = (c) => (proz ? Krypto.DEUTSCH[c] : (Krypto.DEUTSCH[c] * summe) / 100);
    const markiert = new Set((Array.isArray(b.markiert) ? b.markiert : []).map((c) => String(c).toUpperCase()));
    const max = Math.max(1e-9, ...ALPHABET.split('').map((c) => Math.max(wert(c), mitReferenz ? deutsch(c) : 0)));
    const titel = b.titel ? String(b.titel) : 'Häufigkeiten';
    let sortierung = b.sortierung === 'absteigend' ? 'absteigend' : 'alphabetisch';

    const svg = s('svg', { class: 'histogramm', role: 'img', 'aria-label': `${titel} (Säulendiagramm)`, 'aria-describedby': tabId, viewBox: `0 0 ${BREITE} ${HOEHE}`, focusable: 'false' });
    const tbody = h('tbody');
    const tabelle = h(
      'table',
      { class: 'haeufigkeit-tabelle', id: tabId, hidden: true },
      h('caption', null, `${titel} als Tabelle`),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Buchstabe'), h('th', { scope: 'col' }, 'Anzahl'), h('th', { scope: 'col' }, 'Prozent'), mitReferenz ? h('th', { scope: 'col' }, 'Deutsch %') : null)),
      tbody
    );

    function reihenfolge() {
      const liste = ALPHABET.split('');
      if (sortierung === 'absteigend') liste.sort((x, y) => anzahl[y] - anzahl[x] || x.localeCompare(y));
      return liste;
    }

    function zeichne() {
      const liste = reihenfolge();
      const slot = (BREITE - 2 * LINKS) / 26;
      const bw = mitReferenz ? slot * 0.5 : slot * 0.7;
      const dw = slot * 0.28;
      const hoehe = (v) => Math.round((v / max) * MAX_H * 100) / 100;
      AQ.mount(
        svg,
        s(
          'defs',
          null,
          s('pattern', { id: musterId, patternUnits: 'userSpaceOnUse', width: 4, height: 4, patternTransform: 'rotate(45)' }, s('rect', { class: 'schraffur-grund', x: 0, y: 0, width: 4, height: 4 }), s('line', { class: 'schraffur-linie', x1: 0, y1: 0, x2: 0, y2: 4 }))
        ),
        s('line', { class: 'achse', x1: LINKS, y1: BASIS_Y, x2: BREITE - LINKS, y2: BASIS_Y }),
        liste.map((c, i) => {
          const x = LINKS + i * slot + (slot - bw - (mitReferenz ? dw : 0)) / 2;
          const hb = hoehe(wert(c));
          const teile = [s('rect', { class: 'balken' + (markiert.has(c) ? ' markiert' : ''), 'data-buchstabe': c, x: x.toFixed(2), y: (BASIS_Y - hb).toFixed(2), width: bw.toFixed(2), height: hb })];
          if (mitReferenz) {
            const hd = hoehe(deutsch(c));
            teile.push(s('rect', { class: 'balken-deutsch', 'data-buchstabe': c, x: (x + bw).toFixed(2), y: (BASIS_Y - hd).toFixed(2), width: dw.toFixed(2), height: hd, fill: `url(#${musterId})` }));
          }
          if (markiert.has(c)) {
            const mx = x + bw / 2;
            const my = BASIS_Y - hb - 4;
            teile.push(s('path', { class: 'marke-dreieck', d: `M ${mx.toFixed(2)} ${my.toFixed(2)} l -5 -8 h 10 z` }));
          }
          teile.push(s('text', { class: 'buchstabe' + (markiert.has(c) ? ' markiert' : ''), x: (LINKS + i * slot + slot / 2).toFixed(2), y: BASIS_Y + 18 }, c));
          return s('g', null, teile);
        })
      );
      AQ.mount(
        tbody,
        liste.map((c) =>
          h(
            'tr',
            { class: markiert.has(c) ? 'markiert' : null },
            h('th', { scope: 'row' }, c),
            h('td', null, Number.isInteger(anzahl[c]) ? String(anzahl[c]) : komma(anzahl[c])),
            h('td', null, komma(prozent(c))),
            mitReferenz ? h('td', null, komma(Krypto.DEUTSCH[c], 2)) : null
          )
        )
      );
      for (const k of sortKnoepfe) k.setAttribute('aria-pressed', String(k.dataset.sortierung === sortierung));
    }

    const sortKnoepfe = [
      ['alphabetisch', 'alphabetisch'],
      ['absteigend', 'nach Häufigkeit']
    ].map(([wert_, text]) =>
      h(
        'button',
        {
          type: 'button',
          class: 'knopf knopf-zweit',
          'aria-pressed': 'false',
          dataset: { sortierung: wert_ },
          onclick: () => {
            sortierung = wert_;
            zeichne();
          }
        },
        text
      )
    );
    const alsTabelle = h('button', { type: 'button', class: 'knopf knopf-leise als-tabelle', 'aria-expanded': 'false', 'aria-controls': tabId }, 'Als Tabelle');
    alsTabelle.addEventListener('click', () => {
      const zeigen = tabelle.hidden;
      tabelle.hidden = !zeigen;
      alsTabelle.setAttribute('aria-expanded', String(zeigen));
      alsTabelle.textContent = zeigen ? 'Tabelle ausblenden' : 'Als Tabelle';
    });
    zeichne();

    return h(
      'figure',
      { class: 'haeufigkeit' },
      h('figcaption', null, titel),
      h('div', { class: 'haeufigkeit-steuerung knopf-reihe', role: 'group', 'aria-label': 'Sortierung und Ansicht' }, sortKnoepfe, alsTabelle),
      svg,
      mitReferenz ? h('p', { class: 'haeufigkeit-legende' }, h('span', { class: 'legende-text' }, 'Volle Säule: dieser Text · schraffierte Säule: Deutsch (Beutelspacher)')) : null,
      h('div', { class: 'scroll-x' }, tabelle)
    );
  }

  /* ---------- bits (Delta §7.4) ---------- */

  function bits(b, ctx) {
    const gruppe = b.gruppe === 0 ? 0 : b.gruppe === 8 ? 8 : 4;
    const markiert = new Set((Array.isArray(b.markiert) ? b.markiert : []).filter((i) => Number.isInteger(i)));
    const box = h('div', { class: 'bits', role: 'group', 'aria-label': b.titel ? String(b.titel) : 'Bitfolgen' });
    for (const z of Array.isArray(b.zeilen) ? b.zeilen : []) {
      if (!z || typeof z !== 'object') continue;
      if (z.trenner !== undefined) {
        const sym = String(z.trenner);
        box.appendChild(h('div', { class: 'bits-trenner' }, h('span', { class: 'bits-symbol', role: 'img', 'aria-label': { '⊕': 'XOR', '=': 'ergibt', '→': 'wird zu' }[sym] || sym }, sym), h('span', { class: 'bits-linie', 'aria-hidden': 'true' })));
        continue;
      }
      const label = String(z.label ?? '');
      const id = lueckenId(z.bits);
      if (id) {
        const el = luecke(id, ctx);
        el.classList.add('bits-luecke');
        el.setAttribute('aria-label', `${label}: Bits eintragen`);
        el.setAttribute('inputmode', 'numeric');
        el.setAttribute('autocomplete', 'off');
        box.appendChild(h('div', { class: 'bits-zeile' }, h('span', { class: 'bits-label' }, label), h('span', { class: 'bits-werte' }, el)));
        continue;
      }
      const folge = String(z.bits ?? '').replace(/\s+/g, '');
      const gruppen = [];
      for (let i = 0; i < folge.length; i += gruppe || folge.length || 1) gruppen.push([...folge.slice(i, i + (gruppe || folge.length))].join(' '));
      box.appendChild(
        h(
          'div',
          { class: 'bits-zeile' },
          h('span', { class: 'bits-label', 'aria-hidden': 'true' }, label),
          h(
            'span',
            { class: 'bits-werte', 'aria-hidden': 'true' },
            [...folge].map((c, i) => {
              const ende = gruppe && (i + 1) % gruppe === 0 && i < folge.length - 1;
              const m = markiert.has(i);
              return h('span', { class: 'bit' + (ende ? ' gruppe-ende' : '') + (m ? ' markiert' : ''), 'aria-current': m ? 'true' : null }, c);
            })
          ),
          h('span', { class: 'sr' }, `${label}: ${gruppen.join(', ')}`)
        )
      );
    }
    return box;
  }

  AQR.registriere('alphabet', alphabet);
  AQR.registriere('haeufigkeit', haeufigkeit);
  AQR.registriere('bits', bits);

  return { geheimtext, alphabet, haeufigkeit, bits, neueId, luecke, lueckenId };
})();
