/* Kryptos – Renderer der Krypto-Blöcke (Delta §7, TECHNIK §4.4), registriert über AQR.registriere:
   Geheimtext-Zeile (Hilfsfunktion), alphabet, haeufigkeit, bits (Task 51), quadrat, matrix, schaubild (Task 52), werkzeug (Task 53). Alles als DOM/SVG mit Textknoten
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
  function geheimtext(text, { art = 'geheim', gruppe = 5, positionen = false, kopieren = true, unveraendert = false, markiert = [] } = {}) {
    const klar = art === 'klar';
    // unveraendert: Text wie im Seed (fremde Verfahren `frei`: Wortgrenzen und Schreibweise gehören zum Verfahren)
    let roh = unveraendert ? String(text ?? '').trim() : Krypto.normalisieren(String(text ?? ''));
    if (klar && !unveraendert) roh = roh.toLowerCase();
    const n = Number.isInteger(gruppe) && gruppe > 0 ? gruppe : roh.length || 1;
    const gruppen = [];
    // unveraendert: Gruppen = Wörter bzw. Gruppen des Seeds (Zeilenumbruch zwischen ihnen wie bei Fünfergruppen)
    if (unveraendert) gruppen.push(...roh.split(/\s+/).filter(Boolean));
    else for (let i = 0; i < roh.length; i += n) gruppen.push(roh.slice(i, i + n));
    const name = klar ? 'Klartext' : 'Geheimtext';
    const sr = h('span', { class: 'sr' }, `${name}, buchstabiert: ${gruppen.map((g) => [...g.replace(/\s+/g, '')].join(' ')).join(', ')}`);
    // Markierungen (M6 E86): [{ von, laenge, art }] mit Positionen ab 0 im normalisierten Text – mark.markiert (unterstrichen),
    // Beschreibung für Screenreader über aria-describedby
    const marken = (Array.isArray(markiert) ? markiert : []).filter((m) => m && Number.isInteger(m.von) && Number.isInteger(m.laenge) && m.laenge > 0 && m.von >= 0);
    // M6 Task 115: je Markierung optional eine eigene Klasse (klasse) und data-von; aneinanderstoßende Markierungen
    // bleiben getrennte <mark> (eine Fundstelle = ein Element, auch bei gleicher Art)
    const markeAn = (pos) => marken.find((x) => pos >= x.von && pos < x.von + x.laenge) || null;
    const klasseVon = (m) => (typeof m.klasse === 'string' && /^[a-z][a-z0-9-]*$/.test(m.klasse) ? ` ${m.klasse}` : '');
    function gruppeMitMarken(g, start) {
      const kinder = [];
      let lauf = null;
      [...g].forEach((ch, j) => {
        const m = markeAn(start + j);
        if (m === null) {
          lauf = null;
          kinder.push(ch);
        } else if (lauf && lauf.m === m) lauf.el.appendChild(document.createTextNode(ch));
        else {
          lauf = { m, el: h('mark', { class: `markiert art-${String(m.art ?? 'a')}${klasseVon(m)}`, 'data-von': String(m.von) }, ch) };
          kinder.push(lauf.el);
        }
      });
      return h('span', { class: 'gruppe' }, kinder);
    }
    let start = 0;
    const zeile = h(
      'span',
      { class: 'geheimtext-gruppen', 'aria-hidden': 'true' },
      gruppen.map((g) => {
        const el = marken.length ? gruppeMitMarken(g, start) : h('span', { class: 'gruppe' }, g);
        start += g.length;
        return el;
      })
    );
    const box = h('div', { class: klar ? 'klartext klartext-zeile' : 'geheimtext' });
    if (marken.length) {
      const id = neueId();
      box.setAttribute('aria-describedby', id);
      box.appendChild(h('span', { class: 'sr', id }, `Markiert: ${marken.map((m) => `Position ${m.von} bis ${m.von + m.laenge - 1}`).join(', ')}`));
    }
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

  /** deutsche Buchstaben nach Häufigkeit (Beutelspacher), Gleichstand alphabetisch – Rang i ↔ i-häufigster Buchstabe */
  function deutschNachRang() {
    return ALPHABET.split('').sort((x, y) => Krypto.DEUTSCH[y] - Krypto.DEUTSCH[x] || x.localeCompare(y));
  }

  /**
   * Histogramm mit Tabellen-Alternative. M6 Task 114: referenzRang (bei Sortierung nach Häufigkeit liegt die Referenz
   * ebenfalls sortiert daneben, Spalte „Deutsch (Rang)“), einheitUmschalter (Knöpfe absolut/relativ) und beiAnsicht
   * ({ sortierung, einheit } nach jedem Umschalten – für Werkzeuge, die den Zustand kennen müssen).
   */
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
    const mitRang = mitReferenz && b.referenzRang === true;
    const umschalter = b.einheitUmschalter === true;
    let proz = b.einheit === 'prozent';
    const wert = (c) => (proz ? prozent(c) : anzahl[c]);
    const deutsch = (c) => (proz ? Krypto.DEUTSCH[c] : (Krypto.DEUTSCH[c] * summe) / 100);
    const markiert = new Set((Array.isArray(b.markiert) ? b.markiert : []).map((c) => String(c).toUpperCase()));
    const titel = b.titel ? String(b.titel) : 'Häufigkeiten';
    let sortierung = b.sortierung === 'absteigend' ? 'absteigend' : 'alphabetisch';
    const deutschRang = mitRang ? deutschNachRang() : [];

    const svg = s('svg', { class: 'histogramm', role: 'img', 'aria-label': `${titel} (Säulendiagramm)`, 'aria-describedby': tabId, viewBox: `0 0 ${BREITE} ${HOEHE}`, focusable: 'false' });
    const tbody = h('tbody');
    const tabelle = h(
      'table',
      { class: 'haeufigkeit-tabelle', id: tabId, hidden: true },
      h('caption', null, `${titel} als Tabelle`),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Buchstabe'), h('th', { scope: 'col' }, 'Anzahl'), h('th', { scope: 'col' }, 'Prozent'), mitReferenz ? h('th', { scope: 'col' }, 'Deutsch %') : null, mitRang ? h('th', { scope: 'col' }, 'Deutsch (Rang)') : null)),
      tbody
    );

    function nachHaeufigkeit() {
      return ALPHABET.split('').sort((x, y) => anzahl[y] - anzahl[x] || x.localeCompare(y));
    }
    function reihenfolge() {
      return sortierung === 'absteigend' ? nachHaeufigkeit() : ALPHABET.split('');
    }

    function zeichne() {
      const liste = reihenfolge();
      const rangVon = new Map(nachHaeufigkeit().map((c, i) => [c, i]));
      // Referenz je Slot: nach Rang sortiert (referenzRang + absteigend) oder zum Buchstaben des Slots
      const referenzVon = (c, i) => (mitRang && sortierung === 'absteigend' ? deutschRang[i] : c);
      const max = Math.max(1e-9, ...ALPHABET.split('').map((c) => Math.max(wert(c), mitReferenz ? deutsch(c) : 0)));
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
            const r = referenzVon(c, i);
            const hd = hoehe(deutsch(r));
            teile.push(s('rect', { class: 'balken-deutsch', 'data-buchstabe': r, x: (x + bw).toFixed(2), y: (BASIS_Y - hd).toFixed(2), width: dw.toFixed(2), height: hd, fill: `url(#${musterId})` }));
            if (r !== c) teile.push(s('text', { class: 'buchstabe-deutsch', x: (x + bw + dw / 2).toFixed(2), y: BASIS_Y + 32 }, Krypto.klein(r)));
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
            mitReferenz ? h('td', null, komma(Krypto.DEUTSCH[c], 2)) : null,
            mitRang ? h('td', { class: 'deutsch-rang' }, `${deutschRang[rangVon.get(c)]} ${komma(Krypto.DEUTSCH[deutschRang[rangVon.get(c)]], 2)}`) : null
          )
        )
      );
      for (const k of sortKnoepfe) k.setAttribute('aria-pressed', String(k.dataset.sortierung === sortierung));
      for (const k of einheitKnoepfe) k.setAttribute('aria-pressed', String((k.dataset.einheit === 'relativ') === proz));
    }
    function melde() {
      if (typeof b.beiAnsicht === 'function') b.beiAnsicht({ sortierung, einheit: proz ? 'relativ' : 'absolut' });
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
            melde();
          }
        },
        text
      )
    );
    const einheitKnoepfe = umschalter
      ? [
          ['absolut', 'absolut'],
          ['relativ', 'relativ (%)']
        ].map(([wert_, text]) =>
          h(
            'button',
            {
              type: 'button',
              class: 'knopf knopf-zweit',
              'aria-pressed': 'false',
              dataset: { einheit: wert_ },
              onclick: () => {
                proz = wert_ === 'relativ';
                zeichne();
                melde();
              }
            },
            text
          )
        )
      : [];
    const alsTabelle = h('button', { type: 'button', class: 'knopf knopf-leise als-tabelle', 'aria-expanded': 'false', 'aria-controls': tabId }, 'Als Tabelle');
    alsTabelle.addEventListener('click', () => {
      const zeigen = tabelle.hidden;
      tabelle.hidden = !zeigen;
      alsTabelle.setAttribute('aria-expanded', String(zeigen));
      alsTabelle.textContent = zeigen ? 'Tabelle ausblenden' : 'Als Tabelle';
    });
    zeichne();

    const legende = mitRang ? 'Volle Säule: dieser Text · schraffierte Säule: Deutsch (Beutelspacher); nach Häufigkeit sortiert steht Rang neben Rang' : 'Volle Säule: dieser Text · schraffierte Säule: Deutsch (Beutelspacher)';
    return h(
      'figure',
      { class: 'haeufigkeit' },
      h('figcaption', null, titel),
      h(
        'div',
        { class: 'haeufigkeit-steuerung knopf-reihe', role: 'group', 'aria-label': 'Sortierung und Ansicht' },
        sortKnoepfe,
        umschalter ? h('span', { class: 'haeufigkeit-einheit', role: 'group', 'aria-label': 'Einheit' }, einheitKnoepfe) : null,
        alsTabelle
      ),
      svg,
      mitReferenz ? h('p', { class: 'haeufigkeit-legende' }, h('span', { class: 'legende-text' }, legende)) : null,
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

  /* ---------- Zelle mit Lücke oder Text (quadrat, matrix) ---------- */
  function zellInhalt(wert, ctx, label) {
    const id = lueckenId(wert);
    if (id) {
      const el = luecke(id, ctx);
      el.classList.add('luecke');
      if (label) el.setAttribute('aria-label', label);
      return el;
    }
    return AQR.mitLuecken(String(wert ?? ''), ctx);
  }

  /* ---------- quadrat (Delta §7.3) ---------- */

  const QUADRAT_TITEL = { vigenere: 'Vigenère-Quadrat (Anlage)', playfair: 'Playfair-Quadrat', polybios: 'Polybios-Quadrat', frei: 'Quadrat' };

  function quadrat(b, ctx) {
    const art = Object.prototype.hasOwnProperty.call(QUADRAT_TITEL, b.art) ? b.art : 'frei';
    const hv = b.hervorheben && typeof b.hervorheben === 'object' ? b.hervorheben : {};
    const zellenHervor = new Set((Array.isArray(hv.zellen) ? hv.zellen : []).filter((z) => Array.isArray(z)).map(([z, sp]) => `${z},${sp}`));
    const caption = h('caption', null, b.titel ? String(b.titel) : QUADRAT_TITEL[art]);
    const tabelle = h('table', { class: `quadrat quadrat-${art}` }, caption);
    let hinweis = null;

    if (art === 'vigenere') {
      const zeilen = Array.isArray(b.ausschnitt) && b.ausschnitt.length ? b.ausschnitt.map((x) => String(x).toUpperCase()) : ALPHABET.split('');
      let hz = hv.zeile ? String(hv.zeile).toUpperCase() : null;
      let hs = hv.spalte ? ALPHABET.indexOf(String(hv.spalte).toUpperCase()) : -1;
      // M6 Task 116: Zellen tragen data-zeile/data-spalte; waehlbar → Roving-tabindex, Pfeiltasten, Enter/Leertaste/Klick
      // wählen (beiWahl(zeile, spalte)); b.steuer.waehle(zeile, spalte) setzt die Hervorhebung ohne Rückmeldung
      const waehlbar = b.waehlbar === true;
      const kopfZellen = ALPHABET.split('').map((c) => h('th', { scope: 'col' }, c));
      const zeilenEl = [];
      const zellen = zeilen.map((z) => {
        const k = Krypto.wert(z) - 1;
        const reihe = ALPHABET.split('').map((c) => h('td', { 'data-zeile': z, 'data-spalte': c }, Krypto.caesar(c, k)));
        zeilenEl.push(h('tr', null, h('th', { scope: 'row' }, z), reihe));
        return reihe;
      });
      function markiere() {
        kopfZellen.forEach((th, i) => th.classList.toggle('hervor', i === hs));
        zeilen.forEach((z, r) => {
          const zeileHervor = z === hz;
          zeilenEl[r].classList.toggle('hervor', zeileHervor);
          zellen[r].forEach((td, i) => {
            const schnitt = zeileHervor && i === hs;
            td.classList.toggle('schnitt', schnitt);
            td.classList.toggle('hervor', schnitt || i === hs || (waehlbar && zeileHervor));
            if (schnitt) td.setAttribute('aria-label', `Schnittpunkt: ${td.textContent}`);
            else td.removeAttribute('aria-label');
            if (waehlbar) td.setAttribute('aria-selected', String(schnitt));
          });
        });
      }
      function fokusZelle(r, i, fokus) {
        for (const reihe of zellen) for (const td of reihe) td.setAttribute('tabindex', '-1');
        const td = zellen[r][i];
        td.setAttribute('tabindex', '0');
        if (fokus) td.focus();
      }
      function waehle(z, sp, melden) {
        const r = zeilen.indexOf(String(z).toUpperCase());
        const i = ALPHABET.indexOf(String(sp).toUpperCase());
        if (r < 0 || i < 0) return;
        hz = zeilen[r];
        hs = i;
        markiere();
        if (waehlbar) fokusZelle(r, i, false);
        if (melden && typeof b.beiWahl === 'function') b.beiWahl(hz, ALPHABET[i]);
      }
      if (waehlbar) {
        zellen.forEach((reihe, r) =>
          reihe.forEach((td, i) => {
            td.addEventListener('click', () => waehle(zeilen[r], ALPHABET[i], true));
            td.addEventListener('keydown', (e) => {
              const ziel = { ArrowRight: [r, i + 1], ArrowLeft: [r, i - 1], ArrowDown: [r + 1, i], ArrowUp: [r - 1, i], Home: [r, 0], End: [r, 25] }[e.key];
              if (ziel) {
                e.preventDefault();
                const [nr, ni] = ziel;
                if (nr >= 0 && nr < zeilen.length && ni >= 0 && ni < 26) fokusZelle(nr, ni, true);
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                waehle(zeilen[r], ALPHABET[i], true);
                td.focus();
              }
            });
          })
        );
        const r0 = Math.max(0, zeilen.indexOf(hz));
        fokusZelle(r0, Math.max(0, hs), false);
        tabelle.setAttribute('role', 'grid');
      }
      if (b.steuer && typeof b.steuer === 'object') b.steuer.waehle = (z, sp) => waehle(z, sp, false);
      markiere();
      tabelle.appendChild(h('thead', null, h('tr', null, h('td', { class: 'ecke' }), kopfZellen)));
      tabelle.appendChild(h('tbody', null, zeilenEl));
      hinweis = h('p', { class: 'quadrat-hinweis' }, 'Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe (Schlüssel A = Verschiebung 0).');
    } else {
      let zellen;
      let koepfe = null;
      if (art === 'playfair') {
        const ij = b.ij === 'J' ? 'J' : 'I';
        const anders = ij === 'I' ? 'J' : 'I';
        zellen = Krypto.quadrat(String(b.schluessel ?? ''), { ij }).map((r) => [...r].map((c) => (c === ij ? `${ij}/${anders}` : c)));
        koepfe = { zeilen: '12345', spalten: '12345' };
      } else if (art === 'polybios') {
        const groesse = b.groesse === 6 ? 6 : 5;
        zellen = Array.isArray(b.zellen) ? b.zellen : Krypto.quadrat(String(b.schluessel ?? ''), { groesse }).map((r) => [...r]);
        const kopf = b.kopf ?? '123456'.slice(0, groesse);
        koepfe = typeof kopf === 'object' && kopf ? { zeilen: String(kopf.zeilen ?? ''), spalten: String(kopf.spalten ?? '') } : { zeilen: String(kopf), spalten: String(kopf) };
      } else {
        zellen = Array.isArray(b.zellen) ? b.zellen : [];
        if (b.kopf) koepfe = typeof b.kopf === 'object' ? { zeilen: String(b.kopf.zeilen ?? ''), spalten: String(b.kopf.spalten ?? '') } : { zeilen: String(b.kopf), spalten: String(b.kopf) };
      }
      const breite = Math.max(0, ...zellen.map((r) => (Array.isArray(r) ? r.length : 0)));
      if (koepfe) {
        tabelle.appendChild(h('thead', null, h('tr', null, h('td', { class: 'ecke' }), Array.from({ length: breite }, (_, i) => h('th', { scope: 'col' }, koepfe.spalten[i] ?? '')))));
      }
      tabelle.appendChild(
        h(
          'tbody',
          null,
          zellen.map((r, z) =>
            h(
              'tr',
              null,
              koepfe ? h('th', { scope: 'row' }, koepfe.zeilen[z] ?? '') : null,
              (Array.isArray(r) ? r : []).map((w, sp) => h('td', { class: zellenHervor.has(`${z},${sp}`) ? 'hervor' : null }, zellInhalt(w, ctx, `Zelle Zeile ${z + 1}, Spalte ${sp + 1}`)))
            )
          )
        )
      );
    }
    return h('div', { class: 'quadrat-rahmen' }, h('div', { class: 'scroll-x' }, tabelle), hinweis);
  }

  /* ---------- matrix (Delta §7.6) ---------- */

  function fleissnerRaster(n, loecher, { nummer = null, klasse = 'schablone' } = {}) {
    const frei = new Set(loecher.map(([z, sp]) => `${z},${sp}`));
    return h(
      'table',
      { class: klasse },
      h(
        'tbody',
        null,
        Array.from({ length: n }, (_, zi) =>
          h(
            'tr',
            null,
            Array.from({ length: n }, (_, si) => {
              const key = `${zi + 1},${si + 1}`;
              if (!frei.has(key)) return h('td', { class: 'zu' }, h('span', { class: 'sr' }, 'zu'));
              return h('td', { class: 'loch', 'data-zelle': key }, h('span', { 'aria-hidden': 'true' }, nummer === null ? '○' : String(nummer)), h('span', { class: 'sr' }, nummer === null ? 'Loch' : `Loch, Stellung ${nummer}`));
            })
          )
        )
      )
    );
  }

  function matrix(b, ctx) {
    const box = h('div', { class: 'matrix-rahmen' });
    if (b.titel) box.appendChild(h('p', { class: 'matrix-titel' }, String(b.titel)));
    if (Array.isArray(b.schablone) && Number.isInteger(b.groesse)) {
      const n = b.groesse;
      const links = b.drehung === 'links';
      const drehe = ([z, sp]) => (links ? [n + 1 - sp, z] : [sp, n + 1 - z]);
      if (b.zeige === 'stellungen') {
        const reihe = h('div', { class: 'stellungen' });
        let stellung = b.schablone.map((l) => l.slice());
        for (let r = 1; r <= 4; r++) {
          if (r > 1) reihe.appendChild(h('span', { class: 'drehpfeil', 'aria-hidden': 'true' }, links ? '↺' : '↻'));
          reihe.appendChild(h('figure', { class: 'stellung' }, h('figcaption', null, `Stellung ${r}`), fleissnerRaster(n, stellung, { nummer: r })));
          stellung = stellung.map(drehe);
        }
        box.appendChild(h('div', { class: 'scroll-x' }, reihe));
        box.appendChild(h('p', { class: 'matrix-leserichtung' }, links ? '↺ Drehung nach links (gegen den Uhrzeigersinn)' : '↻ Drehung nach rechts (im Uhrzeigersinn)'));
      } else {
        box.appendChild(h('div', { class: 'scroll-x' }, fleissnerRaster(n, b.schablone)));
      }
      return box;
    }
    const zeilen = Array.isArray(b.zeilen) ? b.zeilen : [];
    const breite = Math.max(0, ...zeilen.map((r) => (Array.isArray(r) ? r.length : 0)), Array.isArray(b.kopf) ? b.kopf.length : 0);
    const markiert = new Set((Array.isArray(b.markiert) ? b.markiert : []).filter((z) => Array.isArray(z)).map(([z, sp]) => `${z},${sp}`));
    const tabelle = h('table', { class: 'matrix' });
    if (Array.isArray(b.kopf)) {
      let rf = null;
      if (b.reihenfolge === true) rf = Krypto.spaltenReihenfolge(b.kopf.join(''));
      else if (Array.isArray(b.reihenfolge)) rf = b.reihenfolge;
      tabelle.appendChild(
        h(
          'thead',
          null,
          h('tr', null, b.kopf.map((c) => h('th', { scope: 'col' }, String(c)))),
          rf ? h('tr', { class: 'reihenfolge' }, rf.map((x) => h('td', null, String(x)))) : null
        )
      );
    }
    tabelle.appendChild(
      h(
        'tbody',
        null,
        zeilen.map((r, z) =>
          h(
            'tr',
            null,
            Array.from({ length: breite }, (_, sp) => {
              const w = Array.isArray(r) ? r[sp] : undefined;
              const kl = markiert.has(`${z},${sp}`) ? 'markiert' : null;
              if (w === undefined || w === null || w === '') return h('td', { class: 'leer' + (kl ? ' ' + kl : ''), 'aria-label': 'leer' });
              return h('td', { class: kl }, zellInhalt(w, ctx, `Zelle Zeile ${z + 1}, Spalte ${sp + 1}`));
            })
          )
        )
      )
    );
    box.appendChild(h('div', { class: 'scroll-x' }, tabelle));
    if (b.leserichtung === 'spaltenweise' || b.leserichtung === 'zeilenweise') {
      box.appendChild(h('p', { class: 'matrix-leserichtung' }, b.leserichtung === 'spaltenweise' ? '↓ spaltenweise lesen' : '→ zeilenweise lesen'));
    }
    return box;
  }

  /* ---------- schaubild (Delta §7.5, E27) ---------- */

  const KREIS = (nr) => (nr >= 1 && nr <= 20 ? String.fromCharCode(0x2460 + nr - 1) : `(${nr})`);

  /** Text für das SVG: Lücken → „?“, Mini-Markdown-Zeichen weg. */
  function svgText(t) {
    return String(t ?? '').replace(AQR.GAP_RE, '?').replace(/\*\*|`/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2');
  }
  /** Wortweise auf Zeilen von höchstens max Zeichen umbrechen. */
  function umbrechen(text, max) {
    const zeilen = [];
    let z = '';
    for (const w of text.split(/\s+/).filter(Boolean)) {
      if (z && (z + ' ' + w).length > max) {
        zeilen.push(z);
        z = w;
      } else z = z ? z + ' ' + w : w;
    }
    if (z) zeilen.push(z);
    return zeilen.length ? zeilen : [''];
  }

  function schaubild(b, ctx) {
    const id = neueId();
    const akteure = (Array.isArray(b.akteure) ? b.akteure : []).filter((a) => a && typeof a === 'object');
    const schritte = (Array.isArray(b.schritte) ? b.schritte : []).filter((x) => x && typeof x === 'object');
    const name = new Map(akteure.map((a) => [a.id, String(a.name ?? a.id)]));
    const spalte = new Map(akteure.map((a, i) => [a.id, i]));
    const ABSTAND = 170;
    const breite = 40 + akteure.length * ABSTAND;
    const xVon = (aid) => 20 + ABSTAND / 2 + (spalte.get(aid) ?? 0) * ABSTAND;
    const ZEILE = 15;

    // Zeilen vorbereiten (Höhe je Schritt aus dem Umbruch)
    let y = 78;
    const plan = schritte.map((st) => {
      const selbst = st.von === st.an;
      const weite = selbst ? 140 : Math.max(ABSTAND, Math.abs(xVon(st.an) - xVon(st.von))) - 30;
      const zeilen = umbrechen(svgText(st.text), Math.max(12, Math.floor(weite / 6.8)));
      const hoehe = selbst ? zeilen.length * ZEILE + 18 : zeilen.length * ZEILE + 20;
      const eintrag = { st, selbst, zeilen, y };
      y += hoehe + 16;
      return eintrag;
    });
    const hoeheGesamt = y + 10;
    const pfeilId = `pfeil-${id}`;

    const svg = s(
      'svg',
      { class: 'schaubild-svg', 'aria-hidden': 'true', focusable: 'false', viewBox: `0 0 ${breite} ${hoeheGesamt}` },
      s('defs', null, s('marker', { id: pfeilId, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto-start-reverse' }, s('path', { class: 'pfeil-spitze', d: 'M 0 0 L 10 5 L 0 10 z' }))),
      akteure.map((a) => {
        const x = xVon(a.id);
        const art = ['angreifer', 'ca', 'server'].includes(a.art) ? a.art : 'person';
        const symbol =
          art === 'angreifer'
            ? s('g', { class: 'akteur-symbol' }, s('use', { href: KR.sprite('icons', 'i-schild'), x: x - 62, y: 18, width: 18, height: 18 }), s('line', { class: 'kreuz', x1: x - 62, y1: 36, x2: x - 44, y2: 18 }))
            : art === 'ca'
              ? s('use', { class: 'akteur-symbol', href: KR.sprite('siegel', 's-ca'), x: x - 62, y: 18, width: 18, height: 18 })
              : null;
        return s(
          'g',
          { class: `akteur akteur-${art}` },
          s('line', { class: 'lebenslinie', x1: x, y1: 54, x2: x, y2: hoeheGesamt - 6 }),
          s('rect', { class: 'akteur-kopf', x: x - 75, y: 10, width: 150, height: 44, rx: 10 }),
          symbol,
          s('text', { class: 'akteur-name' + (String(a.name ?? a.id).length > 14 ? ' lang' : ''), x: symbol ? x + 9 : x, y: 37 }, String(a.name ?? a.id))
        );
      }),
      plan.map(({ st, selbst, zeilen, y: y0 }) => {
        const nr = String(st.nr ?? '');
        if (selbst) {
          const x = xVon(st.von);
          const hh = zeilen.length * ZEILE + 14;
          return s(
            'g',
            { class: 'schritt schritt-vor-ort' },
            s('rect', { class: 'handlung', x: x - 70, y: y0, width: 140, height: hh, rx: 6 }),
            s('circle', { class: 'nummer', cx: x - 70, cy: y0, r: 11 }),
            s('text', { class: 'nummer-text', x: x - 70, y: y0 + 4 }, nr),
            s('text', { class: 'schritt-text', x, y: y0 + 18 }, zeilen.map((z, i) => s('tspan', { x, dy: i ? ZEILE : 0 }, z)))
          );
        }
        const x1 = xVon(st.von);
        const x2 = xVon(st.an);
        const mitte = (x1 + x2) / 2;
        const yl = y0 + zeilen.length * ZEILE + 10;
        return s(
          'g',
          { class: 'schritt' },
          s('text', { class: 'schritt-text', x: mitte, y: y0 + 10 }, zeilen.map((z, i) => s('tspan', { x: mitte, dy: i ? ZEILE : 0 }, z))),
          s('line', { class: 'pfeil', x1, y1: yl, x2: x2 + (x2 > x1 ? -2 : 2), y2: yl, 'marker-end': `url(#${pfeilId})` }),
          s('circle', { class: 'nummer', cx: x1 + (x2 > x1 ? 16 : -16), cy: yl, r: 11 }),
          s('text', { class: 'nummer-text', x: x1 + (x2 > x1 ? 16 : -16), y: yl + 4 }, nr)
        );
      })
    );

    const hatLuecken = schritte.some((st) => /\[\[[A-Za-z0-9_-]{1,40}\]\]/.test(String(st.text ?? '')));
    const liste = h(
      'ol',
      { class: 'schaubild-liste' + (hatLuecken ? ' sichtbar' : ''), 'aria-label': `${b.titel ? String(b.titel) : 'Ablauf'}: Schritte` },
      schritte.map((st) =>
        h(
          'li',
          null,
          h('span', { class: 'schritt-kopf' }, `${KREIS(Number(st.nr))} ${st.von === st.an ? name.get(st.von) || String(st.von) : `${name.get(st.von) || st.von} → ${name.get(st.an) || st.an}`}:`),
          ' ',
          AQR.inline(String(st.text ?? ''), ctx)
        )
      )
    );
    svg.style.setProperty('--sb-breite', `${breite}px`); // CSSOM (CSP): natürliche Breite als Obergrenze
    return h('figure', { class: 'schaubild' }, b.titel ? h('figcaption', null, String(b.titel)) : null, h('div', { class: 'schaubild-flaeche' }, svg), liste);
  }

  /* ---------- werkzeug (Delta §7.7) ---------- */

  function werkzeug(b, ctx) {
    if (ctx && ctx.modus === 'boss') return null; // im Boss-Kampf kein Werkzeug, keine Labor-Links
    const w = typeof KRLabor !== 'undefined' ? KRLabor.werkzeug(b.id) : null;
    const name = w ? w.titel : String(b.id ?? 'Werkzeug');
    const frei = !(ctx && typeof ctx.werkzeugFrei === 'function') || ctx.werkzeugFrei(b.id) !== false;
    const knopf = h('button', { type: 'button', class: 'knopf knopf-primaer werkzeug-oeffnen', disabled: !frei }, b.titel ? String(b.titel) : `${name} öffnen`);
    knopf.addEventListener('click', () => {
      const modus = ctx && ctx.modus === 'gast' ? 'gast' : 'lab';
      // Umgebung für die Reiter-Regeln (rolle, niveau, welten – M6 E71) kommt von der Seite über ctx.laborUmgebung
      const extra = ctx && ctx.laborUmgebung && typeof ctx.laborUmgebung === 'object' ? ctx.laborUmgebung : {};
      KRLabor.dialog(b.id, b.voreinstellung, { ...extra, modus });
    });
    return h(
      'div',
      { class: 'werkzeug-karte' + (frei ? '' : ' gesperrt'), 'data-epoche': w ? String(w.welt) : null },
      h('div', { class: 'werkzeug-kopf' }, KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }), h('span', { class: 'werkzeug-ort' }, 'Im Kryptolabor'), h('b', { class: 'werkzeug-name' }, name)),
      knopf,
      frei ? null : h('p', { class: 'werkzeug-grund' }, 'Deine Lehrkraft schaltet dieses Werkzeug später frei.')
    );
  }

  AQR.registriere('alphabet', alphabet);
  AQR.registriere('haeufigkeit', haeufigkeit);
  AQR.registriere('bits', bits);
  AQR.registriere('quadrat', quadrat);
  AQR.registriere('matrix', matrix);
  AQR.registriere('schaubild', schaubild);
  AQR.registriere('werkzeug', werkzeug);

  return { geheimtext, alphabet, haeufigkeit, bits, quadrat, matrix, schaubild, werkzeug, neueId, luecke, lueckenId };
})();
