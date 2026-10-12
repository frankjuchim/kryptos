/* Algo Quest Lab – Darstellung der Inhaltsblöcke (SPEC §4): Mini-Markdown, Code, Struktogramm (EH §5),
 * Tabelle, Baum (SVG), Reihung, Raster, Klassenkarte (EH §6), ADT, Hinweis. Alles als DOM – nie innerHTML. */
'use strict';

const AQR = (() => {
  const { h, s } = AQ;
  const GAP_RE = /\[\[([A-Za-z0-9_-]{1,40})\]\]/g;

  /** Platzhalter, falls eine Lücke kein Feld hat (sollte der Validator verhindern). */
  function lueckeOderText(id, ctx) {
    const n = ctx && ctx.gap ? ctx.gap(id) : null;
    return n || h('span', { class: 'luecke', 'aria-label': 'Lücke' }, '…');
  }

  /** Text mit Lücken [[id]] → Knotenliste. format(textteil) darf Textteile weiter umwandeln (z. B. Syntaxfarben). */
  function mitLuecken(text, ctx, format) {
    const out = [];
    const str = String(text ?? '');
    let last = 0;
    for (const m of str.matchAll(GAP_RE)) {
      if (m.index > last) out.push(format ? format(str.slice(last, m.index)) : str.slice(last, m.index));
      out.push(lueckeOderText(m[1], ctx));
      last = m.index + m[0].length;
    }
    if (last < str.length) out.push(format ? format(str.slice(last)) : str.slice(last));
    return out;
  }

  /* ---------- Mini-Markdown: **fett**, *kursiv*, `code`, Absätze, Listen „- “, Lücken [[id]] ---------- */

  function inline(text, ctx) {
    const out = [];
    let i = 0;
    let puffer = '';
    const flush = () => {
      if (puffer) out.push(puffer);
      puffer = '';
    };
    while (i < text.length) {
      const rest = text.slice(i);
      const gm = /^\[\[([A-Za-z0-9_-]{1,40})\]\]/.exec(rest);
      if (gm) {
        flush();
        out.push(lueckeOderText(gm[1], ctx));
        i += gm[0].length;
        continue;
      }
      if (text[i] === '`') {
        const j = text.indexOf('`', i + 1);
        if (j > i) {
          flush();
          out.push(h('code', null, mitLuecken(text.slice(i + 1, j), ctx)));
          i = j + 1;
          continue;
        }
      }
      if (text.startsWith('**', i)) {
        const j = text.indexOf('**', i + 2);
        if (j > i + 2) {
          flush();
          out.push(h('strong', null, inline(text.slice(i + 2, j), ctx)));
          i = j + 2;
          continue;
        }
      }
      // *kursiv*: nur am Wortanfang (davor Anfang/Leerraum/Klammer) und mit Buchstabe/Ziffer danach –
      // so bleiben "*", 2*3*4 oder a * b unverändert.
      if (text[i] === '*' && text[i + 1] !== '*' && (i === 0 || /[\s(\[„–]/.test(text[i - 1])) && /[\p{L}\p{N}`]/u.test(text[i + 1] || '')) {
        let j = i + 1;
        while (j < text.length && (text[j] !== '*' || text[j + 1] === '*' || /\s/.test(text[j - 1]) || /[\p{L}\p{N}]/u.test(text[j + 1] || ''))) j++;
        if (j < text.length && j > i + 1) {
          flush();
          out.push(h('em', null, inline(text.slice(i + 1, j), ctx)));
          i = j + 1;
          continue;
        }
      }
      puffer += text[i];
      i++;
    }
    flush();
    return out;
  }

  function md(text, ctx, tag = 'div') {
    const wurzel = h(tag, { class: 'md' });
    const absaetze = String(text ?? '')
      .replace(/\r\n?/g, '\n')
      .split(/\n\s*\n/);
    for (const abs of absaetze) {
      if (!abs.trim()) continue;
      const zeilen = abs.split('\n');
      let liste = null;
      let para = null;
      for (const z of zeilen) {
        const lm = /^\s*[-•]\s+(.*)$/.exec(z);
        if (lm) {
          para = null;
          if (!liste) {
            liste = h('ul');
            wurzel.appendChild(liste);
          }
          liste.appendChild(h('li', null, inline(lm[1], ctx)));
        } else {
          liste = null;
          if (!para) {
            para = h('p');
            wurzel.appendChild(para);
          } else para.appendChild(h('br'));
          for (const n of inline(z, ctx)) para.appendChild(n instanceof Node ? n : document.createTextNode(n));
        }
      }
    }
    return wurzel;
  }

  /* ---------- Code mit Zeilennummern, Lücken und einfacher Syntaxhervorhebung ---------- */

  const JAVA_KW = new Set(
    'abstract boolean break byte case catch char class continue default do double else extends final finally float for if implements import instanceof int interface long new null private protected public return short static super switch this throw throws try void while true false var'.split(' ')
  );

  function hebeHervor(text) {
    const frag = document.createDocumentFragment();
    const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
    let last = 0;
    for (const m of text.matchAll(re)) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      let cls = null;
      if (m[1]) cls = 'kom';
      else if (m[2] || m[3]) cls = 'str';
      else if (m[4]) cls = 'zahl';
      else if (m[5] && JAVA_KW.has(m[5])) cls = 'kw';
      frag.appendChild(cls ? h('span', { class: cls }, m[0]) : document.createTextNode(m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  /**
   * Code-Block. opt.zeilenKlick(nr, el) macht Zeilen wählbar (Bug-Hunt).
   * @returns {HTMLElement} mit .zeilen (Array der Zeilen-Elemente, 1-basiert über index+1)
   */
  function code(b, ctx, opt = {}) {
    const nummern = b.nummern !== false;
    const markiere = new Set(Array.isArray(b.markiere) ? b.markiere : []);
    const zeilen = String(b.code ?? '').replace(/\r\n?/g, '\n').split('\n');
    const els = [];
    const box = h('div', { class: 'code' + (nummern ? '' : ' ohne-nr'), role: 'group', 'aria-label': 'Java-Code' });
    zeilen.forEach((z, i) => {
      const nr = i + 1;
      const el = h('div', { class: 'zeile' + (markiere.has(nr) ? ' mark' : '') }, nummern ? h('span', { class: 'nr', 'aria-hidden': 'true' }, String(nr)) : null, h('span', { class: 'txt' }, mitLuecken(z, ctx, hebeHervor)));
      if (opt.zeilenKlick) {
        el.classList.add('waehlbar');
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-pressed', 'false');
        el.setAttribute('aria-label', `Zeile ${nr}: ${z.trim()}`);
        const los = (e) => {
          if (e.target && e.target.closest && e.target.closest('.luecke')) return;
          opt.zeilenKlick(nr, el);
        };
        el.addEventListener('click', los);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            los(e);
          }
        });
      }
      els.push(el);
      box.appendChild(el);
    });
    box.zeilen = els;
    return box;
  }

  /* ---------- Struktogramm nach EH §5 (Kasten-Notation als HTML/CSS) ---------- */

  function sgText(t, ctx) {
    return mitLuecken(t, ctx);
  }

  function sgFolge(knoten, ctx) {
    const f = h('div', { class: 'sg-folge' });
    const liste = Array.isArray(knoten) ? knoten : [];
    if (!liste.length) f.appendChild(h('div', { class: 'sg-leer', 'aria-label': 'leer' }, '∅'));
    for (const k of liste) f.appendChild(sgKnoten(k, ctx));
    return f;
  }

  function dreieck(bedingung, ctx) {
    const svg = s('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, s('line', { x1: '0', y1: '0', x2: '50', y2: '100', stroke: '#23364d', 'stroke-width': '1.5', 'vector-effect': 'non-scaling-stroke' }), s('line', { x1: '100', y1: '0', x2: '50', y2: '100', stroke: '#23364d', 'stroke-width': '1.5', 'vector-effect': 'non-scaling-stroke' }));
    return h('div', { class: 'sg-dreieck' }, svg, h('span', { class: 'bed' }, sgText(bedingung, ctx)), h('span', { class: 'w' }, 'wahr'), h('span', { class: 'f' }, 'falsch'));
  }

  function mitPraefix(t, praefix) {
    const str = String(t ?? '');
    return str.trim().toLowerCase().startsWith(praefix.trim().toLowerCase()) ? str : praefix + str;
  }

  function sgKnoten(k, ctx) {
    if (!k || typeof k !== 'object') return h('div', { class: 'sg-anw' }, '?');
    if ('wenn' in k) {
      return h('div', { class: 'sg-wenn', role: 'group', 'aria-label': 'Verzweigung' }, dreieck(k.wenn, ctx), h('div', { class: 'sg-zweige' }, sgFolge(k.dann, ctx), sgFolge(k.sonst, ctx)));
    }
    if ('wiederhole' in k) {
      const fuss = typeof k.bis === 'string' ? mitPraefix(k.bis, 'bis ') : mitPraefix(k.solange, 'solange ');
      return h('div', { class: 'sg-schleife fuss', role: 'group', 'aria-label': 'fußgesteuerte Schleife' }, h('div', { class: 'innen' }, sgFolge(k.wiederhole, ctx)), h('div', { class: 'kopf' }, sgText(fuss, ctx)));
    }
    if ('solange' in k || 'zaehle' in k || 'fuer' in k) {
      const kopf = 'solange' in k ? mitPraefix(k.solange, 'solange ') : mitPraefix('zaehle' in k ? k.zaehle : k.fuer, 'für ');
      return h('div', { class: 'sg-schleife', role: 'group', 'aria-label': 'kopfgesteuerte Schleife' }, h('div', { class: 'kopf' }, sgText(kopf, ctx)), h('div', { class: 'innen' }, sgFolge(k.rumpf, ctx)));
    }
    if ('gib' in k) {
      const t = String(k.gib);
      return h('div', { class: 'sg-gib' }, /zurück\s*$/.test(t) || /^gib\b/.test(t) ? sgText(t, ctx) : ['gib ', ...sgText(t, ctx), ' zurück']);
    }
    if ('aufruf' in k) return h('div', { class: 'sg-aufruf' }, sgText(k.aufruf, ctx));
    if ('kommentar' in k && !('anw' in k)) return h('div', { class: 'sg-kommentar' }, '// ', sgText(k.kommentar, ctx));
    return h('div', { class: 'sg-anw' }, sgText(k.anw, ctx));
  }

  function struktogramm(b, ctx) {
    return h('div', { class: 'sg', role: 'figure', 'aria-label': 'Struktogramm' + (b.kopf ? ': ' + b.kopf.replace(GAP_RE, '…') : '') }, b.kopf ? h('div', { class: 'sg-kopf' }, sgText(b.kopf, ctx)) : null, h('div', { class: 'sg-rumpf' }, sgFolge(b.rumpf, ctx)));
  }

  /* ---------- Tabelle, Reihung, Raster, Klassenkarte, ADT ---------- */

  function tabelle(b, ctx) {
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'trace' },
        h('thead', null, h('tr', null, (b.kopf || []).map((k) => h('th', { scope: 'col' }, mitLuecken(k, ctx))))),
        h('tbody', null, (b.zeilen || []).map((z) => h('tr', null, (z || []).map((c) => h('td', null, mitLuecken(c ?? '', ctx))))))
      )
    );
  }

  function farbKlasse(f) {
    const v = String(f || '');
    return /^#[0-9A-Fa-f]{6}$/.test(v) ? null : 'm-' + v.toLowerCase();
  }

  function reihung(b, ctx) {
    const markiert = b.markiert || {};
    const mitIdx = b.indizes !== false;
    return h(
      'div',
      { class: 'scroll-x' },
      h(
        'div',
        { class: 'reihung', role: 'list', 'aria-label': 'Reihung' },
        (b.werte || []).map((w, i) => {
          const f = markiert[String(i)];
          const z = h('div', { class: 'zelle' + (f && farbKlasse(f) ? ' ' + farbKlasse(f) : ''), role: 'listitem', 'aria-label': `Index ${i}: ${w}` }, h('div', { class: 'wert' }, mitLuecken(w ?? '', ctx)), mitIdx ? h('div', { class: 'idx' }, String(i)) : null);
          if (f && !farbKlasse(f)) z.firstChild.style.background = f;
          return z;
        })
      )
    );
  }

  function raster(zeilen, ctx, opt = {}) {
    const spalten = Math.max(0, ...zeilen.map((z) => (Array.isArray(z) ? z.length : 0)));
    const tab = h(
      'table',
      { class: 'raster', role: opt.klick ? 'grid' : 'table', 'aria-label': `Raster mit ${zeilen.length} Zeilen und ${spalten} Spalten` },
      h('thead', null, h('tr', null, h('th', null, ''), Array.from({ length: spalten }, (_, c) => h('th', { scope: 'col' }, String(c))))),
      h(
        'tbody',
        null,
        zeilen.map((z, r) =>
          h(
            'tr',
            null,
            h('th', { scope: 'row' }, String(r)),
            Array.from({ length: spalten }, (_, c) => {
              const td = h('td', null, mitLuecken(Array.isArray(z) && z[c] !== undefined ? z[c] : '', ctx));
              td.dataset.r = r;
              td.dataset.c = c;
              if (opt.klick) {
                td.classList.add('waehlbar');
                td.setAttribute('tabindex', '0');
                td.setAttribute('role', 'gridcell');
                td.setAttribute('aria-selected', 'false');
                td.setAttribute('aria-label', `Zeile ${r}, Spalte ${c}: ${Array.isArray(z) ? z[c] : ''}`);
                td.addEventListener('click', () => opt.klick(r, c, td));
                td.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    opt.klick(r, c, td);
                  }
                });
              }
              return td;
            })
          )
        )
      )
    );
    return h('div', { class: 'scroll-x' }, tab);
  }

  function klassenkarte(b, ctx) {
    return h(
      'div',
      { class: 'klassenkarte', role: 'figure', 'aria-label': 'Klassenkarte ' + (b.name || '') },
      h('div', { class: 'kk-name' }, mitLuecken(b.name, ctx)),
      h('div', { class: 'kk-teil' }, (b.attribute || []).map((a) => h('div', null, mitLuecken(a, ctx)))),
      h('div', { class: 'kk-teil' }, (b.methoden || []).map((m) => h('div', null, mitLuecken(m, ctx))))
    );
  }

  /** ADT-Darstellung: Stapel (letztes = oben), Schlange (erstes = vorn), dynamische Reihung (mit Indizes). */
  function adt(art, inhalt, ctx) {
    const werte = Array.isArray(inhalt) ? inhalt : [];
    if (art === 'stapel') {
      return h(
        'div',
        { class: 'adt', role: 'figure', 'aria-label': `Stapel (unten → oben): ${werte.join(', ') || 'leer'}` },
        h('div', { class: 'adt-spalte' }, h('span', { class: 'adt-label' }, '↓ oben'), h('div', { class: 'adt-stapel' }, werte.length ? werte.map((w) => h('div', { class: 'adt-el' }, mitLuecken(w, ctx))) : h('span', { class: 'adt-leer' }, 'leer')), h('span', { class: 'adt-label' }, 'unten'))
      );
    }
    if (art === 'schlange') {
      return h(
        'div',
        { class: 'adt', role: 'figure', 'aria-label': `Schlange (vorn → hinten): ${werte.join(', ') || 'leer'}` },
        h('span', { class: 'adt-label' }, 'vorn ←'),
        h('div', { class: 'adt-schlange' }, werte.length ? werte.map((w) => h('div', { class: 'adt-el' }, mitLuecken(w, ctx))) : h('span', { class: 'adt-leer' }, 'leer')),
        h('span', { class: 'adt-label' }, '← hinten')
      );
    }
    return h(
      'div',
      { class: 'adt', role: 'figure', 'aria-label': `dynamische Reihung: ${werte.join(', ') || 'leer'}` },
      werte.length ? h('div', { class: 'reihung' }, werte.map((w, i) => h('div', { class: 'zelle' }, h('div', { class: 'wert' }, mitLuecken(w, ctx)), h('div', { class: 'idx' }, String(i))))) : h('span', { class: 'adt-leer' }, 'leer')
    );
  }

  /* ---------- Baum als SVG ---------- */

  /**
   * Baum zeichnen.
   * @param {object|null} wurzel Knoten {v,l,r}
   * @param {object} opt { klick(pfad), slots: bool, slotKlick(pfad), markierung: Map(pfad → {cls, nr}), label }
   */
  function baumSvg(wurzel, opt = {}) {
    // Erweiterter Baum: leere Kindplätze als Slots (nur im Baumodus)
    function erweitere(n, p) {
      if (!n) return opt.slots ? { slot: true, pfad: p } : null;
      return { v: n.v, pfad: p, l: erweitere(n.l, p + 'L'), r: erweitere(n.r, p + 'R') };
    }
    const e = erweitere(wurzel, '');
    const pos = [];
    let x = 0;
    let maxY = 0;
    (function lauf(k, y, eltern) {
      if (!k) return;
      if (!k.slot) lauf(k.l, y + 1, k);
      pos.push({ k, x: x++, y, eltern });
      if (y > maxY) maxY = y;
      if (!k.slot) lauf(k.r, y + 1, k);
    })(e, 0, null);
    const DX = 52;
    const DY = 66;
    const R = 20;
    const breite = Math.max(1, x) * DX + 20;
    const hoehe = (maxY + 1) * DY + 10;
    const svg = s('svg', { class: 'baum-svg', viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, role: 'img', 'aria-label': opt.label || 'Binärbaum' });
    const lage = new Map(pos.map((p) => [p.k, { cx: 10 + p.x * DX + DX / 2, cy: 10 + p.y * DY + R + 4 }]));
    for (const p of pos) {
      if (!p.eltern) continue;
      const a = lage.get(p.eltern);
      const b = lage.get(p.k);
      svg.appendChild(s('line', { x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy, class: p.k.slot ? 'slot-linie' : null }));
    }
    for (const p of pos) {
      const { cx, cy } = lage.get(p.k);
      if (p.k.slot) {
        const g = s('g', { class: 'slot', tabindex: '0', role: 'button', 'aria-label': `leere Stelle ${p.k.pfad || 'Wurzel'} – Wert einfügen` }, s('circle', { cx, cy, r: R - 4 }), s('text', { x: cx, y: cy }, '+'));
        const los = () => opt.slotKlick && opt.slotKlick(p.k.pfad, g);
        g.addEventListener('click', los);
        g.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            los();
          }
        });
        svg.appendChild(g);
        continue;
      }
      const m = opt.markierung ? opt.markierung.get(p.k.pfad) : null;
      const g = s('g', { class: 'knoten' + (opt.klick ? ' klickbar' : '') + (m && m.cls ? ' ' + m.cls : ''), 'data-pfad': p.k.pfad }, s('circle', { cx, cy, r: R }), s('text', { x: cx, y: cy }, String(p.k.v)));
      if (m && m.nr !== undefined) {
        g.appendChild(s('circle', { class: 'order', cx: cx + R - 2, cy: cy - R + 2, r: 9 }));
        g.appendChild(s('text', { class: 'order', x: cx + R - 2, y: cy - R + 2 }, String(m.nr)));
      }
      if (opt.klick) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Knoten ${p.k.v}` + (m && m.nr !== undefined ? `, Schritt ${m.nr}` : ''));
        const los = () => opt.klick(p.k.pfad, g);
        g.addEventListener('click', los);
        g.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            los();
          }
        });
      }
      svg.appendChild(g);
    }
    if (!pos.length) svg.appendChild(s('text', { x: breite / 2, y: hoehe / 2 }, '(leerer Baum)'));
    return h('div', { class: 'scroll-x' }, svg);
  }

  /* ---------- Blöcke ---------- */

  function block(b, i, ctx) {
    if (!b || typeof b !== 'object') return null;
    let el;
    switch (b.t) {
      case 'text':
        el = md(b.md, ctx);
        break;
      case 'hinweis':
        el = h('div', { class: 'hinweis', role: 'note' }, md(b.md, ctx));
        break;
      case 'code': {
        const lc = ctx && ctx.zeilenWahl ? ctx.zeilenWahl(i) : null;
        el = code(b, ctx, lc ? { zeilenKlick: lc.klick } : {});
        if (lc) lc.registriere(el.zeilen);
        break;
      }
      case 'struktogramm':
        el = h('div', { class: 'scroll-x' }, struktogramm(b, ctx));
        break;
      case 'tabelle':
        el = tabelle(b, ctx);
        break;
      case 'baum': {
        let t = null;
        try {
          t = AQBaum.parse(String(b.baum));
        } catch {
          el = h('p', { class: 'muted' }, '(Baum nicht darstellbar)');
          break;
        }
        el = baumSvg(t, { label: 'Binärbaum ' + b.baum });
        break;
      }
      case 'reihung':
        el = reihung(b, ctx);
        break;
      case 'raster':
        el = raster(Array.isArray(b.zeilen) ? b.zeilen : [], ctx);
        break;
      case 'klassenkarte':
        el = h('div', { class: 'scroll-x' }, klassenkarte(b, ctx));
        break;
      case 'adt':
        el = h('div', { class: 'scroll-x' }, adt(b.art, b.inhalt, ctx));
        break;
      default:
        el = h('p', { class: 'muted' }, `(unbekannter Block „${b.t}“)`);
    }
    if (el) el.classList.add('block', 'block-' + b.t);
    return el;
  }

  function bloecke(liste, ctx) {
    const box = h('div', { class: 'inhalt' });
    (Array.isArray(liste) ? liste : []).forEach((b, i) => {
      const el = block(b, i, ctx);
      if (el) {
        el.dataset.block = String(i);
        box.appendChild(el);
      }
    });
    return box;
  }

  return { GAP_RE, md, inline, mitLuecken, code, struktogramm, tabelle, reihung, raster, klassenkarte, adt, baumSvg, block, bloecke };
})();
