/* Algo Quest Lab – Interaktionen (SPEC §5): gaps, choice, order, lines, match, tree (klick/bauen), array (tausch/klick),
 * grid, adtsim; mehrteilige Aufgaben; Schrittprüfung; Feedback; Lösungsanzeige. Prüfung erfolgt NUR auf dem Server. */
'use strict';

const AQI = (() => {
  const { h, toast, mische } = AQ;
  const R = AQR;

  function art(ia) {
    if (!ia) return '';
    return ia.kind === 'tree' || ia.kind === 'array' ? `${ia.kind}:${ia.modus}` : ia.kind;
  }
  const SCHRITT = ['tree:klick', 'array:tausch', 'array:klick', 'order'];

  function knopf(text, onclick, cls = 'btn secondary small', attrs = {}) {
    return h('button', { type: 'button', class: cls, onclick, ...attrs }, text);
  }

  /* ================= Teile ================= */

  /** Lückentext: Felder werden beim Rendern der Blöcke über ctx.gap(id) erzeugt. */
  function teilGaps(ia, kontext) {
    const felder = new Map();
    const t = {
      kind: 'gaps',
      besitzt: (id) => Object.prototype.hasOwnProperty.call(ia.felder || {}, id),
      feld(id) {
        if (felder.has(id)) return felder.get(id);
        const f = ia.felder[id] || {};
        let el;
        const label = `Lücke ${id}`;
        if (f.typ === 'auswahl') {
          // ab drei Optionen bei jedem Anzeigen neu mischen (die Lösung soll nicht an fester Stelle stehen);
          // Zweierlisten wie wahr/falsch bleiben in der gewohnten Reihenfolge
          const optionen = (f.optionen || []).length >= 3 ? mische(f.optionen) : f.optionen || [];
          el = h('select', { class: 'luecke', 'aria-label': label }, h('option', { value: '' }, '–'), optionen.map((o) => h('option', { value: String(o) }, String(o))));
        } else {
          el = h('input', {
            class: 'luecke',
            type: 'text',
            'aria-label': label,
            autocomplete: 'off',
            autocapitalize: 'off',
            autocorrect: 'off',
            spellcheck: 'false',
            inputmode: f.typ === 'zahl' ? 'decimal' : 'text'
          });
          const breite = f.breite || (f.typ === 'zahl' ? 4 : 8);
          el.style.width = `calc(${Math.max(2, breite)}ch + 1.2em)`;
        }
        el.addEventListener('input', () => {
          el.classList.remove('ok', 'falsch');
          kontext.geaendert();
        });
        el.addEventListener('change', () => kontext.geaendert());
        felder.set(id, el);
        return el;
      },
      ui: null,
      antwort() {
        const a = {};
        for (const id of Object.keys(ia.felder || {})) a[id] = felder.has(id) ? felder.get(id).value : '';
        return a;
      },
      leer() {
        return Object.values(t.antwort()).every((v) => String(v).trim() === '');
      },
      setze(a) {
        if (!a) return;
        for (const [id, v] of Object.entries(a)) if (felder.has(id)) felder.get(id).value = v ?? '';
      },
      feedback(r) {
        if (!r || !r.felder) return;
        for (const [id, ok] of Object.entries(r.felder)) {
          const el = felder.get(id);
          if (!el) continue;
          el.classList.toggle('ok', !!ok);
          el.classList.toggle('falsch', !ok);
          el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        }
      },
      loesung(lo, muster) {
        for (const [id, el] of felder) {
          const v = muster && muster[id] !== undefined ? muster[id] : Array.isArray(lo && lo[id]) ? lo[id][0] : '';
          if (el.tagName === 'SELECT' && ![...el.options].some((o) => o.value === String(v))) el.appendChild(h('option', { value: String(v) }, String(v)));
          el.value = v;
          el.classList.remove('ok', 'falsch');
          el.classList.add('loesung');
          const alle = Array.isArray(lo && lo[id]) ? lo[id] : [];
          if (alle.length > 1) el.title = 'Auch richtig: ' + alle.slice(1).join(' | ');
        }
      },
      sperren(an) {
        for (const el of felder.values()) el.disabled = an;
      }
    };
    return t;
  }

  function teilChoice(ia, kontext) {
    const gewaehlt = new Set();
    const optionen = mische(ia.optionen || []);
    const els = new Map();
    let gesperrt = false;
    const box = h('div', { class: 'optionen', role: ia.mehrfach ? 'group' : 'radiogroup', 'aria-label': ia.mehrfach ? 'Mehrfachauswahl' : 'Einfachauswahl' });
    for (const o of optionen) {
      const el = h('button', { type: 'button', class: 'option' + (ia.mehrfach ? ' mehrfach' : ''), role: ia.mehrfach ? 'checkbox' : 'radio', 'aria-checked': 'false' }, h('span', { class: 'marke', 'aria-hidden': 'true' }), h('span', { class: 'txt' }, o.md !== undefined ? R.md(o.md, null, 'span') : h('code', null, o.code)));
      el.addEventListener('click', () => {
        if (gesperrt) return;
        if (ia.mehrfach) {
          if (gewaehlt.has(o.id)) gewaehlt.delete(o.id);
          else gewaehlt.add(o.id);
        } else {
          gewaehlt.clear();
          gewaehlt.add(o.id);
        }
        zeichne();
        kontext.geaendert();
      });
      els.set(o.id, el);
      box.appendChild(el);
    }
    function zeichne() {
      for (const [id, el] of els) {
        el.setAttribute('aria-checked', gewaehlt.has(id) ? 'true' : 'false');
        el.classList.remove('falsch');
      }
    }
    return {
      kind: 'choice',
      ui: h('div', null, ia.mehrfach ? h('p', { class: 'hint' }, 'Mehrere Antworten können richtig sein.') : null, box),
      antwort: () => [...gewaehlt],
      leer: () => gewaehlt.size === 0,
      setze(a) {
        gewaehlt.clear();
        for (const x of Array.isArray(a) ? a : []) gewaehlt.add(x);
        zeichne();
      },
      feedback() {},
      loesung(lo) {
        const richtig = new Set((lo && lo.richtig) || []);
        for (const [id, el] of els) {
          el.classList.toggle('loesung', richtig.has(id));
          el.classList.toggle('falsch', gewaehlt.has(id) && !richtig.has(id));
        }
      },
      sperren(an) {
        gesperrt = an;
        for (const el of els.values()) el.disabled = an;
      }
    };
  }

  function teilText(t) {
    return t.code !== undefined ? h('span', { class: 'txt' }, t.code) : h('span', { class: 'txt md' }, R.md(t.md, null, 'span'));
  }

  /** Parsons-Puzzle: Bausteine antippen → in die Lösung übernehmen, dort verschieben/entfernen. */
  function teilOrder(ia, kontext, nr) {
    const teile = new Map((ia.teile || []).map((t) => [t.id, t]));
    let pool = mische([...teile.keys()]);
    let folge = [];
    let gesperrt = false;
    let markiere = null;
    const poolBox = h('div', { class: 'puzzle-liste', role: 'list', 'aria-label': 'Bausteine' });
    const folgeBox = h('div', { class: 'puzzle-liste', role: 'list', 'aria-label': 'Deine Reihenfolge' });
    const loesungBox = h('div');
    const self = {
      kind: 'order',
      ui: h(
        'div',
        null,
        h('div', { class: 'puzzle' }, h('div', null, h('h3', null, 'Bausteine (antippen zum Übernehmen)'), poolBox), h('div', null, h('h3', null, 'Deine Lösung (Reihenfolge)'), folgeBox)),
        loesungBox
      ),
      antwort: () => [...folge],
      leer: () => folge.length === 0,
      setze(a) {
        folge = (Array.isArray(a) ? a : []).filter((id) => teile.has(id));
        pool = [...teile.keys()].filter((id) => !folge.includes(id));
        zeichne();
      },
      feedback(r) {
        markiere = r && r.ok === false && Number.isInteger(r.ersteFalschePosition) ? r.ersteFalschePosition : null;
        zeichne();
      },
      loesung(lo) {
        const rf = (lo && lo.reihenfolgen && lo.reihenfolgen[0]) || [];
        if (kontext.vorschau) {
          self.setze(rf);
          markiere = rf.length; // alles grün
          zeichne();
          return;
        }
        AQ.mount(loesungBox, h('h3', null, 'Lösung'), h('div', { class: 'puzzle-liste' }, rf.map((id, i) => h('div', { class: 'puzzle-teil richtig' }, h('span', { class: 'pos' }, String(i + 1)), teilText(teile.get(id) || { md: id })))));
      },
      sperren(an) {
        gesperrt = an;
        zeichne();
      }
    };
    async function schritt() {
      if (!kontext.schrittAktiv(self)) return;
      const r = await kontext.schritt(nr, [...folge]);
      if (r && r.ok === false) {
        const weg = folge.pop();
        pool.push(weg);
        zeichne();
        toast('Dieser Baustein passt hier nicht (Fehlversuch).', true);
      }
    }
    function zeichne() {
      AQ.clear(poolBox);
      AQ.clear(folgeBox);
      if (!pool.length) poolBox.appendChild(h('p', { class: 'hint' }, 'Alle Bausteine verwendet.'));
      for (const id of pool) {
        const t = teile.get(id);
        const el = h('div', { class: 'puzzle-teil', role: 'listitem' }, teilText(t), h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'übernehmen', disabled: gesperrt, onclick: nehmen }, '→'));
        el.querySelector('.txt').addEventListener('click', nehmen);
        function nehmen() {
          if (gesperrt) return;
          pool = pool.filter((x) => x !== id);
          folge.push(id);
          markiere = null;
          zeichne();
          kontext.geaendert();
          schritt();
        }
        poolBox.appendChild(el);
      }
      if (!folge.length) folgeBox.appendChild(h('p', { class: 'hint' }, 'Tippe links auf die Bausteine in der richtigen Reihenfolge.'));
      folge.forEach((id, i) => {
        const t = teile.get(id);
        const cls = markiere !== null ? (i < markiere ? ' richtig' : i === markiere ? ' falsch' : '') : '';
        const zurueck = () => {
          if (gesperrt) return;
          folge.splice(i, 1);
          pool.push(id);
          markiere = null;
          zeichne();
          kontext.geaendert();
        };
        const el = h(
          'div',
          { class: 'puzzle-teil' + cls, role: 'listitem' },
          h('span', { class: 'pos' }, String(i + 1)),
          teilText(t),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'nach oben', disabled: gesperrt || i === 0, onclick: () => tausche(i, i - 1) }, '↑'),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'nach unten', disabled: gesperrt || i === folge.length - 1, onclick: () => tausche(i, i + 1) }, '↓'),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'zurücklegen', disabled: gesperrt, onclick: zurueck }, '✕')
        );
        folgeBox.appendChild(el);
      });
    }
    function tausche(i, j) {
      [folge[i], folge[j]] = [folge[j], folge[i]];
      markiere = null;
      zeichne();
      kontext.geaendert();
    }
    zeichne();
    return self;
  }

  /** Bug-Hunt: Zeilen im Code-Block antippen. */
  function teilLines(ia, kontext) {
    const gewaehlt = new Set();
    let zeilen = [];
    let gesperrt = false;
    const info = h('p', { class: 'hint' }, `Tippe ${ia.anzahl === 1 ? 'die fehlerhafte Zeile' : `${ia.anzahl} Zeilen`} im Code an.`);
    function zeichne() {
      zeilen.forEach((el, i) => {
        const an = gewaehlt.has(i + 1);
        el.classList.toggle('gewaehlt', an);
        el.setAttribute('aria-pressed', an ? 'true' : 'false');
      });
      info.textContent = `Gewählt: ${gewaehlt.size ? [...gewaehlt].sort((a, b) => a - b).map((z) => 'Zeile ' + z).join(', ') : '—'} (${ia.anzahl} ${ia.anzahl === 1 ? 'Zeile' : 'Zeilen'} gesucht)`;
    }
    return {
      kind: 'lines',
      block: ia.block,
      klick(nr) {
        if (gesperrt) return;
        if (gewaehlt.has(nr)) gewaehlt.delete(nr);
        else {
          if (ia.anzahl === 1) gewaehlt.clear();
          else if (gewaehlt.size >= ia.anzahl) return toast(`Höchstens ${ia.anzahl} Zeilen wählen.`);
          gewaehlt.add(nr);
        }
        zeichne();
        kontext.geaendert();
      },
      registriere(els) {
        zeilen = els;
        zeichne();
      },
      ui: info,
      antwort: () => [...gewaehlt].sort((a, b) => a - b),
      leer: () => gewaehlt.size === 0,
      setze(a) {
        gewaehlt.clear();
        for (const z of Array.isArray(a) ? a : []) gewaehlt.add(z);
        zeichne();
      },
      feedback() {},
      loesung(lo) {
        const s = new Set((lo && lo.zeilen) || []);
        zeilen.forEach((el, i) => el.classList.toggle('loesung', s.has(i + 1)));
      },
      sperren(an) {
        gesperrt = an;
      }
    };
  }

  function teilMatch(ia, kontext) {
    const wahl = {};
    const zeilen = new Map();
    let gesperrt = false;
    const box = h('div');
    // Elemente bei jedem Anzeigen neu mischen (in der Datei stehen sie oft nach Lösungskategorie geordnet)
    for (const e of mische(ia.elemente || [])) {
      const knoepfe = (ia.kategorien || []).map((k) =>
        h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => {
          if (gesperrt) return;
          wahl[e.id] = wahl[e.id] === k.id ? undefined : k.id;
          if (wahl[e.id] === undefined) delete wahl[e.id];
          zeichne();
          kontext.geaendert();
        } }, R.md(k.md, null, 'span'))
      );
      const z = h('div', { class: 'match-zeile' }, h('div', { class: 'el' }, R.md(e.md, null, 'span')), h('div', { class: 'seg', role: 'group', 'aria-label': 'Kategorie wählen' }, knoepfe));
      zeilen.set(e.id, { z, knoepfe });
      box.appendChild(z);
    }
    function zeichne() {
      for (const e of ia.elemente || []) {
        const { z, knoepfe } = zeilen.get(e.id);
        z.classList.remove('ok', 'falsch');
        (ia.kategorien || []).forEach((k, i) => knoepfe[i].setAttribute('aria-pressed', wahl[e.id] === k.id ? 'true' : 'false'));
      }
    }
    return {
      kind: 'match',
      ui: box,
      antwort: () => ({ ...wahl }),
      leer: () => Object.keys(wahl).length === 0,
      setze(a) {
        for (const k of Object.keys(wahl)) delete wahl[k];
        Object.assign(wahl, a || {});
        zeichne();
      },
      feedback(r) {
        if (!r || !r.elemente) return;
        for (const [id, ok] of Object.entries(r.elemente)) {
          const z = zeilen.get(id);
          if (z) {
            z.z.classList.toggle('ok', ok);
            z.z.classList.toggle('falsch', !ok);
          }
        }
      },
      loesung(lo) {
        this.setze(lo || {});
        for (const { z } of zeilen.values()) z.classList.add('ok');
      },
      sperren(an) {
        gesperrt = an;
        for (const { knoepfe } of zeilen.values()) knoepfe.forEach((b) => (b.disabled = an));
      }
    };
  }

  /** Baum: Knoten in einer Reihenfolge anklicken (Traversierung, Suchpfad …). */
  function teilTreeKlick(ia, kontext, nr) {
    let baum = null;
    try {
      baum = AQBaum.parse(String(ia.baum));
    } catch {
      baum = null;
    }
    let folge = [];
    let gesperrt = false;
    let loesungFolge = null;
    let falsch = null;
    const svgBox = h('div');
    const status = h('p', { class: 'hint', 'aria-live': 'polite' });
    const self = {
      kind: 'tree:klick',
      ui: h('div', null, svgBox, status, h('div', { class: 'btn-row' }, knopf('↶ Letzten Schritt zurück', () => {
        if (gesperrt) return;
        folge.pop();
        zeichne();
        kontext.geaendert();
      }), knopf('Neu beginnen', () => {
        if (gesperrt) return;
        folge = [];
        zeichne();
        kontext.geaendert();
      }))),
      antwort: () => [...folge],
      leer: () => folge.length === 0,
      setze(a) {
        folge = Array.isArray(a) ? [...a] : [];
        zeichne();
      },
      feedback(r) {
        if (r && r.ok === false && Number.isInteger(r.ersteFalschePosition)) {
          falsch = folge[r.ersteFalschePosition] ?? null;
          zeichne();
        }
      },
      loesung(lo) {
        loesungFolge = (lo && lo.folge) || [];
        zeichne();
      },
      sperren(an) {
        gesperrt = an;
      }
    };
    async function klick(pfad) {
      if (gesperrt) return;
      folge.push(pfad);
      falsch = null;
      zeichne();
      kontext.geaendert();
      if (kontext.schrittAktiv(self)) {
        const r = await kontext.schritt(nr, [...folge]);
        if (r && r.ok === false) {
          falsch = folge.pop();
          zeichne();
          toast('Falscher Knoten (Fehlversuch).', true);
        }
      }
    }
    function zeichne() {
      const m = new Map();
      const quelle = loesungFolge || folge;
      quelle.forEach((p, i) => m.set(p, { cls: loesungFolge ? 'loesung' : 'besucht', nr: i + 1 }));
      if (falsch !== null && !loesungFolge) m.set(falsch, { ...(m.get(falsch) || {}), cls: 'falsch' });
      AQ.mount(svgBox, R.baumSvg(baum, { klick: gesperrt || loesungFolge ? null : klick, markierung: m, label: 'Binärbaum zum Anklicken' }));
      const namen = folge.map((p) => (AQBaum.knotenAn(baum, p) || { v: '?' }).v);
      status.textContent = loesungFolge ? 'Lösung: ' + loesungFolge.map((p) => (AQBaum.knotenAn(baum, p) || { v: '?' }).v).join(', ') : folge.length ? 'Deine Reihenfolge: ' + namen.join(', ') : 'Tippe die Knoten nacheinander an.';
    }
    zeichne();
    return self;
  }

  /** Baum bauen: Werte an leeren Stellen einfügen, Knoten ändern oder (mit Teilbaum) entfernen. */
  function teilTreeBauen(ia, kontext) {
    let start = null;
    try {
      start = AQBaum.parse(ia.start === undefined ? '-' : String(ia.start));
    } catch {
      start = null;
    }
    let baum = AQBaum.kopie(start);
    let auswahl = null; // { art: 'slot'|'knoten', pfad }
    let gesperrt = false;
    let loesungBaum = null;
    const svgBox = h('div');
    const panel = h('div', { class: 'sim-box', 'aria-live': 'polite' });
    const loesungBox = h('div');
    const werte = Array.isArray(ia.werte) ? ia.werte.map(String) : [];
    const zuruecksetzen = knopf('Zurücksetzen', () => {
      if (gesperrt) return;
      baum = AQBaum.kopie(start);
      auswahl = null;
      zeichne();
      kontext.geaendert();
    });
    function benutzt() {
      return AQBaum.knotenListe(baum).map((k) => k.v);
    }
    function setzeWert(pfad, v) {
      const wert = String(v).trim();
      if (!wert || /[(),]/.test(wert)) return toast('Bitte einen gültigen Wert eingeben (ohne Klammern und Kommas).', true);
      const alt = AQBaum.knotenAn(baum, pfad);
      baum = AQBaum.setzeAn(baum, pfad, { v: wert, l: alt ? alt.l : null, r: alt ? alt.r : null });
      auswahl = null;
      zeichne();
      kontext.geaendert();
    }
    function zeichnePanel() {
      AQ.clear(panel);
      panel.hidden = gesperrt;
      zuruecksetzen.hidden = gesperrt;
      if (gesperrt) return;
      if (!auswahl) {
        panel.appendChild(h('p', { class: 'hint' }, 'Tippe auf eine leere Stelle (+), um einen Wert einzufügen, oder auf einen Knoten, um ihn zu ändern oder zu entfernen.'));
        return;
      }
      const eingabe = h('input', { type: 'text', 'aria-label': 'Wert', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Wert' });
      eingabe.style.maxWidth = '9rem';
      eingabe.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') setzeWert(auswahl.pfad, eingabe.value);
      });
      const b = benutzt();
      const chips = werte.length ? h('div', { class: 'chips' }, werte.map((w) => h('button', { type: 'button', class: 'chip-wert' + (b.includes(w) ? ' benutzt' : ''), onclick: () => setzeWert(auswahl.pfad, w) }, w))) : null;
      if (auswahl.art === 'slot') {
        panel.append(h('p', null, h('strong', null, 'Leere Stelle: '), 'Wert einfügen'), chips || '', h('div', { class: 'row' }, eingabe, knopf('Einfügen', () => setzeWert(auswahl.pfad, eingabe.value), 'btn small'), knopf('Abbrechen', () => {
          auswahl = null;
          zeichne();
        })));
      } else {
        const k = AQBaum.knotenAn(baum, auswahl.pfad);
        eingabe.value = k ? k.v : '';
        panel.append(h('p', null, h('strong', null, `Knoten ${k ? k.v : ''}: `), 'ändern oder entfernen'), chips || '', h('div', { class: 'row' }, eingabe, knopf('Wert ändern', () => setzeWert(auswahl.pfad, eingabe.value), 'btn small'), knopf('Entfernen (mit Teilbaum)', () => {
          baum = AQBaum.setzeAn(baum, auswahl.pfad, null);
          auswahl = null;
          zeichne();
          kontext.geaendert();
        }, 'btn danger small'), knopf('Abbrechen', () => {
          auswahl = null;
          zeichne();
        })));
      }
      setTimeout(() => eingabe.focus({ preventScroll: true }), 0);
    }
    function zeichne() {
      const m = new Map();
      if (auswahl && auswahl.art === 'knoten') m.set(auswahl.pfad, { cls: 'aktiv' });
      AQ.mount(
        svgBox,
        R.baumSvg(baum, {
          slots: !gesperrt,
          slotKlick: (p) => {
            auswahl = { art: 'slot', pfad: p };
            zeichne();
          },
          klick: gesperrt ? null : (p) => {
            auswahl = { art: 'knoten', pfad: p };
            zeichne();
          },
          markierung: m,
          label: 'Baum bauen'
        })
      );
      zeichnePanel();
      if (loesungBaum !== null) AQ.mount(loesungBox, h('h3', null, 'Lösung'), R.baumSvg(loesungBaum, { label: 'Lösungsbaum' }));
    }
    const self = {
      kind: 'tree:bauen',
      ui: h('div', null, werte.length ? h('p', { class: 'hint' }, 'Zu verwendende Werte: ', werte.join(', ')) : null, svgBox, panel, h('div', { class: 'btn-row' }, zuruecksetzen), loesungBox),
      antwort: () => AQBaum.stringify(baum),
      leer: () => false,
      setze(a) {
        try {
          baum = AQBaum.parse(typeof a === 'string' ? a : '-');
        } catch {
          baum = AQBaum.kopie(start);
        }
        zeichne();
      },
      feedback() {},
      loesung(lo) {
        if (kontext.vorschau) return self.setze(String(lo && lo.baum));
        try {
          loesungBaum = AQBaum.parse(String(lo && lo.baum));
        } catch {
          loesungBaum = null;
        }
        zeichne();
      },
      sperren(an) {
        gesperrt = an;
        auswahl = null;
        zeichne();
      }
    };
    zeichne();
    return self;
  }

  /** Reihung: Tausch-Modus (Sortierschritte) oder Klick-Modus (z. B. mitte bei binärer Suche). */
  function teilArray(ia, kontext, nr) {
    const tausch = ia.modus === 'tausch';
    const start = (ia.start || []).map((x) => x);
    let werte = [...start];
    let schritte = []; // tausch: [[i,j]], klick: [i]
    let erster = null;
    let gesperrt = false;
    let loesungAnzeige = null;
    const box = h('div', { class: 'scroll-x' });
    const protokoll = h('p', { class: 'tausch-protokoll', 'aria-live': 'polite' });
    const loesungBox = h('div');
    function anwenden() {
      werte = [...start];
      if (tausch) for (const [i, j] of schritte) [werte[i], werte[j]] = [werte[j], werte[i]];
    }
    async function pruefeSchritt() {
      if (!kontext.schrittAktiv(self)) return;
      const r = await kontext.schritt(nr, schritte.map((x) => (Array.isArray(x) ? [...x] : x)));
      if (r && r.ok === false) {
        schritte.pop();
        anwenden();
        zeichne();
        toast(tausch ? 'Dieser Tausch ist nicht richtig (Fehlversuch).' : 'Das ist nicht der richtige Index (Fehlversuch).', true);
      }
    }
    function klick(i) {
      if (gesperrt) return;
      if (tausch) {
        if (erster === null) {
          erster = i;
          zeichne();
          return;
        }
        if (erster === i) {
          erster = null;
          zeichne();
          return;
        }
        schritte.push([erster, i]);
        erster = null;
      } else schritte.push(i);
      anwenden();
      zeichne();
      kontext.geaendert();
      pruefeSchritt();
    }
    function zeichne() {
      const klickNr = new Map();
      if (!tausch) schritte.forEach((i, k) => klickNr.set(i, [...(klickNr.get(i) || []), k + 1]));
      AQ.mount(
        box,
        h(
          'div',
          { class: 'reihung', role: 'group', 'aria-label': tausch ? 'Reihung – zwei Felder antippen zum Tauschen' : 'Reihung – Felder nacheinander antippen' },
          werte.map((w, i) =>
            h(
              'button',
              {
                type: 'button',
                class: 'zelle' + (erster === i ? ' gewaehlt' : '') + (klickNr.has(i) ? ' geklickt' : ''),
                'aria-label': `Index ${i}, Wert ${w}` + (erster === i ? ', ausgewählt' : ''),
                'aria-pressed': erster === i ? 'true' : 'false',
                disabled: gesperrt,
                onclick: () => klick(i)
              },
              h('div', { class: 'wert' }, String(w)),
              h('div', { class: 'idx' }, String(i)),
              tausch ? null : h('div', { class: 'klick-nr' }, klickNr.has(i) ? klickNr.get(i).join(',') : '')
            )
          )
        )
      );
      protokoll.textContent = tausch
        ? schritte.length
          ? 'Tausche: ' + schritte.map(([i, j]) => `(${i} ↔ ${j})`).join(', ')
          : erster !== null
            ? `Index ${erster} gewählt – jetzt den Tauschpartner antippen.`
            : 'Noch kein Tausch.'
        : schritte.length
          ? 'Angetippt: ' + schritte.join(' → ')
          : 'Noch nichts angetippt.';
      if (loesungAnzeige) AQ.mount(loesungBox, loesungAnzeige);
    }
    const self = {
      kind: tausch ? 'array:tausch' : 'array:klick',
      ui: h('div', null, box, protokoll, h('div', { class: 'btn-row' }, knopf('↶ Rückgängig', () => {
        if (gesperrt) return;
        schritte.pop();
        erster = null;
        anwenden();
        zeichne();
        kontext.geaendert();
      }), knopf('Zurücksetzen', () => {
        if (gesperrt) return;
        schritte = [];
        erster = null;
        anwenden();
        zeichne();
        kontext.geaendert();
      })), loesungBox),
      fertigKnopf: !!ia.fertigKnopf,
      antwort: () => schritte.map((x) => (Array.isArray(x) ? [...x] : x)),
      leer: () => !tausch && schritte.length === 0,
      setze(a) {
        schritte = Array.isArray(a) ? a.map((x) => (Array.isArray(x) ? [...x] : x)) : [];
        anwenden();
        zeichne();
      },
      feedback(r) {
        if (r && r.ok === false && Number.isInteger(r.ersteFalschePosition)) protokoll.textContent += ` – ab Schritt ${r.ersteFalschePosition + 1} stimmt es nicht.`;
      },
      loesung(lo) {
        if (kontext.vorschau) self.setze(tausch ? (lo && lo.tausche) || [] : (lo && lo.folge) || []);
        if (tausch) {
          const t = (lo && lo.tausche) || [];
          const w = [...start];
          for (const [i, j] of t) [w[i], w[j]] = [w[j], w[i]];
          loesungAnzeige = h('div', { class: 'callout' }, h('strong', null, 'Lösung: '), t.length ? t.map(([i, j]) => `(${i} ↔ ${j})`).join(', ') : 'kein Tausch nötig', h('br'), 'Ergebnis: ', w.join(', '));
        } else {
          loesungAnzeige = h('div', { class: 'callout' }, h('strong', null, 'Lösung: '), ((lo && lo.folge) || []).map((i) => `Index ${i} (${start[i]})`).join(' → '));
        }
        zeichne();
      },
      sperren(an) {
        gesperrt = an;
        erster = null;
        zeichne();
      }
    };
    zeichne();
    return self;
  }

  function teilGrid(ia, kontext) {
    let zellen = [];
    let gesperrt = false;
    const key = (r, c) => `${r},${c}`;
    const tds = new Map();
    const tab = R.raster(ia.raster || [], null, {
      klick: (r, c) => {
        if (gesperrt) return;
        const k = key(r, c);
        if (zellen.some((z) => key(z[0], z[1]) === k)) zellen = zellen.filter((z) => key(z[0], z[1]) !== k);
        else zellen.push([r, c]);
        zeichne();
        kontext.geaendert();
      }
    });
    tab.querySelectorAll('td').forEach((td) => tds.set(key(td.dataset.r, td.dataset.c), td));
    function zeichne() {
      const an = new Set(zellen.map((z) => key(z[0], z[1])));
      for (const [k, td] of tds) {
        td.classList.toggle('markiert', an.has(k));
        td.setAttribute('aria-selected', an.has(k) ? 'true' : 'false');
      }
    }
    return {
      kind: 'grid',
      ui: h('div', null, tab, h('p', { class: 'hint' }, 'Tippe Zellen an, um sie zu markieren (nochmal tippen hebt die Markierung auf).')),
      antwort: () => zellen.map((z) => [Number(z[0]), Number(z[1])]),
      leer: () => zellen.length === 0,
      setze(a) {
        zellen = Array.isArray(a) ? a.map((z) => [Number(z[0]), Number(z[1])]) : [];
        zeichne();
      },
      feedback() {},
      loesung(lo) {
        const s = new Set(((lo && lo.zellen) || []).map((z) => key(z[0], z[1])));
        for (const [k, td] of tds) td.classList.toggle('loesung', s.has(k));
      },
      sperren(an) {
        gesperrt = an;
      }
    };
  }

  /** ADT-Simulation: Endzustand als Folge von Elementen bauen (Stapel unten → oben, Schlange vorn → hinten). */
  function teilAdtsim(ia, kontext) {
    const start = (ia.start || []).map(String);
    let inhalt = [...start];
    let gesperrt = false;
    let markiere = null;
    const vorschau = h('div');
    const editor = h('div', { class: 'chips', role: 'list' });
    const loesungBox = h('div');
    const eingabe = h('input', { type: 'text', 'aria-label': 'Neues Element', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Wert' });
    eingabe.style.maxWidth = '9rem';
    const richtung = ia.art === 'stapel' ? 'unten → oben (rechts ist oben)' : ia.art === 'schlange' ? 'vorn → hinten' : 'Index 0 → Ende';
    const hinzu = { stapel: 'push (oben drauf)', schlange: 'enqueue (hinten an)', dynarray: 'append (ans Ende)' }[ia.art] || 'hinzufügen';
    function add() {
      if (gesperrt) return;
      const v = eingabe.value.trim();
      if (!v) return eingabe.focus();
      inhalt.push(v);
      eingabe.value = '';
      markiere = null;
      zeichne();
      kontext.geaendert();
      eingabe.focus();
    }
    eingabe.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        add();
      }
    });
    function zeichne() {
      AQ.mount(vorschau, R.adt(ia.art, inhalt, null));
      AQ.clear(editor);
      if (!inhalt.length) editor.appendChild(h('span', { class: 'hint' }, '(leer)'));
      inhalt.forEach((v, i) => {
        editor.appendChild(
          h(
            'span',
            { class: 'chip' + (markiere !== null && i >= markiere ? ' falsch' : ''), role: 'listitem', 'aria-label': `Element ${i + 1}: ${v}` },
            v,
            h('button', { type: 'button', 'aria-label': `${v} nach links`, disabled: gesperrt || i === 0, onclick: () => schiebe(i, i - 1) }, '◀'),
            h('button', { type: 'button', 'aria-label': `${v} nach rechts`, disabled: gesperrt || i === inhalt.length - 1, onclick: () => schiebe(i, i + 1) }, '▶'),
            h('button', { type: 'button', 'aria-label': `${v} entfernen`, disabled: gesperrt, onclick: () => {
              inhalt.splice(i, 1);
              markiere = null;
              zeichne();
              kontext.geaendert();
            } }, '✕')
          )
        );
      });
    }
    function schiebe(i, j) {
      [inhalt[i], inhalt[j]] = [inhalt[j], inhalt[i]];
      markiere = null;
      zeichne();
      kontext.geaendert();
    }
    const werte = Array.isArray(ia.werte) ? ia.werte.map(String) : [];
    const self = {
      kind: 'adtsim',
      ui: h(
        'div',
        { class: 'sim-box' },
        h('div', { class: 'richtung' }, `Endzustand bauen – Reihenfolge: ${richtung}`),
        vorschau,
        h('div', { class: 'spacer' }),
        editor,
        h('div', { class: 'spacer' }),
        h('div', { class: 'row' }, eingabe, knopf(`＋ ${hinzu}`, add, 'btn small'), knopf('Zurück auf Startzustand', () => {
          if (gesperrt) return;
          inhalt = [...start];
          markiere = null;
          zeichne();
          kontext.geaendert();
        }), knopf('Alles leeren', () => {
          if (gesperrt) return;
          inhalt = [];
          markiere = null;
          zeichne();
          kontext.geaendert();
        })),
        werte.length ? h('div', { class: 'chips' }, h('span', { class: 'hint' }, 'Werte:'), werte.map((w) => h('button', { type: 'button', class: 'chip-wert', onclick: () => {
          eingabe.value = w;
          add();
        } }, w))) : null,
        loesungBox
      ),
      antwort: () => [...inhalt],
      leer: () => false,
      setze(a) {
        inhalt = Array.isArray(a) ? a.map(String) : [...start];
        zeichne();
      },
      feedback(r) {
        markiere = r && r.ok === false && Number.isInteger(r.ersteFalschePosition) ? r.ersteFalschePosition : null;
        zeichne();
      },
      loesung(lo) {
        if (kontext.vorschau) return self.setze((lo && lo.inhalt) || []);
        AQ.mount(loesungBox, h('h3', null, 'Lösung'), R.adt(ia.art, (lo && lo.inhalt) || [], null));
      },
      sperren(an) {
        gesperrt = an;
        eingabe.disabled = an;
        zeichne();
      }
    };
    zeichne();
    return self;
  }

  /* ================= Aufgabe (alle Teile) ================= */

  /**
   * @param {object} aufgabe öffentliche Aufgabe {inhalt, interaktion}
   * @param {object} opt { schritt: async (teil, antwort) => Ergebnis | undefined, onChange }
   */
  function aufgabe(a, opt = {}) {
    const ias = Array.isArray(a.interaktion) ? a.interaktion : [a.interaktion];
    const mehrteilig = Array.isArray(a.interaktion);
    const schrittSchalter = h('input', { type: 'checkbox' });
    const schrittArten = ias.filter((ia) => SCHRITT.includes(art(ia)));
    schrittSchalter.checked = AQ.lade('aql_schritt', true) && schrittArten.some((ia) => art(ia) !== 'order');
    schrittSchalter.addEventListener('change', () => AQ.speichere('aql_schritt', schrittSchalter.checked));
    const kontext = {
      vorschau: !!opt.vorschau, // Lehrkraft-Vorschau: Lösung direkt in die Interaktion einsetzen
      geaendert: () => opt.onChange && opt.onChange(),
      schrittAktiv: (teil) => !!opt.schritt && schrittSchalter.checked && SCHRITT.includes(teil.kind),
      schritt: (nr, antwort) => opt.schritt(nr, antwort)
    };
    const teile = ias.map((ia, i) => {
      switch (art(ia)) {
        case 'gaps':
          return teilGaps(ia, kontext);
        case 'choice':
          return teilChoice(ia, kontext);
        case 'order':
          return teilOrder(ia, kontext, i);
        case 'lines':
          return teilLines(ia, kontext);
        case 'match':
          return teilMatch(ia, kontext);
        case 'tree:klick':
          return teilTreeKlick(ia, kontext, i);
        case 'tree:bauen':
          return teilTreeBauen(ia, kontext);
        case 'array:tausch':
        case 'array:klick':
          return teilArray(ia, kontext, i);
        case 'grid':
          return teilGrid(ia, kontext);
        case 'adtsim':
          return teilAdtsim(ia, kontext);
        default:
          return { kind: '?', ui: h('p', { class: 'muted' }, 'Unbekannte Interaktion.'), antwort: () => null, leer: () => true, setze() {}, feedback() {}, loesung() {}, sperren() {} };
      }
    });
    const ctx = {
      gap(id) {
        const t = teile.find((x) => x.kind === 'gaps' && x.besitzt(id));
        return t ? t.feld(id) : null;
      },
      zeilenWahl(blockIndex) {
        const t = teile.find((x) => x.kind === 'lines' && x.block === blockIndex);
        return t ? { klick: (nr) => t.klick(nr), registriere: (els) => t.registriere(els) } : null;
      }
    };
    const inhaltEl = R.bloecke(a.inhalt, ctx);
    const teilEls = [];
    const box = h('div', { class: 'aufgabe-box' }, inhaltEl);
    ias.forEach((ia, i) => {
      const t = teile[i];
      const frage = typeof ia.frage === 'string' ? ia.frage : typeof ia.md === 'string' ? ia.md : null;
      const zusatz = Array.isArray(ia.inhalt) ? R.bloecke(ia.inhalt, ctx) : null;
      // Lücken-Teile ohne eigene Frage stehen direkt im Inhalt – dafür keinen leeren Kasten anzeigen
      const brauchtBox = t.kind !== 'gaps' || frage || zusatz;
      if (!brauchtBox) {
        teilEls.push(null);
        return;
      }
      const el = h('div', { class: 'teil' + (mehrteilig ? '' : ' einzeln'), role: 'group', 'aria-label': mehrteilig ? `Teil ${i + 1}` : 'Antwort' }, mehrteilig && !(frage && /^\s*[a-z]\)/.test(frage)) ? h('div', { class: 'teil-kopf' }, `Teil ${String.fromCharCode(97 + i)})`) : null, frage ? R.md(frage, ctx) : null, zusatz, t.ui);
      if (!mehrteilig && t.kind !== 'gaps') el.classList.remove('teil');
      teilEls.push(el);
      box.appendChild(el);
    });
    if (opt.schritt && schrittArten.length) {
      box.appendChild(h('label', { class: 'check small' }, schrittSchalter, 'Jeden Schritt sofort prüfen (ein falscher Schritt zählt als Fehlversuch)'));
    }

    /* Bug-Hunt gestuft: Beginnt eine mehrteilige Aufgabe mit der Zeilenwahl (lines), verraten die späteren Teile
       („b) Korrigiere: …“) die fehlerhafte Zeile. Deshalb erscheinen sie erst, wenn Teil a) richtig ist
       (Boss-Kampf ohne Feedback: wenn Teil a) festgelegt ist). Lehrkraft-Vorschau und Lösungsansicht zeigen alles. */
    const gestuft = !kontext.vorschau && mehrteilig && ias.length > 1 && art(ias[0]) === 'lines' && !!teilEls[0];
    let stufeOffen = false;
    const spaeter = [];
    let stufeBox = null;
    function freischalten() {
      if (!stufeOffen) return;
      stufeOffen = false;
      spaeter.forEach((el) => el.classList.remove('stufe-versteckt'));
      if (stufeBox) stufeBox.remove();
    }
    async function stufePruefen() {
      if (!stufeOffen) return null;
      if (teile[0].leer()) {
        toast('Wähle zuerst die fehlerhafte Zeile.', true);
        return null;
      }
      if (!opt.teilPruefen) {
        // Boss-Kampf: ohne Rückmeldung festlegen
        teile[0].sperren(true);
        freischalten();
        kontext.geaendert();
        return null;
      }
      const r = await opt.teilPruefen(0, teile[0].antwort());
      if (!r) return null;
      teile[0].feedback({ ok: !!r.ok });
      teilEls[0].classList.toggle('ok', !!r.ok);
      teilEls[0].classList.toggle('falsch', !r.ok);
      if (r.ok) {
        teile[0].sperren(true);
        freischalten();
      }
      return r;
    }
    if (gestuft) {
      const spaetereLuecken = new Set(ias.slice(1).filter((ia) => ia.kind === 'gaps').flatMap((ia) => Object.keys(ia.felder || {})));
      let ab = -1;
      (a.inhalt || []).forEach((b, i) => {
        if (ab >= 0) return;
        const luecken = [...JSON.stringify(b).matchAll(/\[\[([A-Za-z0-9_-]+)\]\]/g)].map((m) => m[1]);
        const teilKopf = typeof b.md === 'string' && /^\s*\*\*\s*(?:[b-z]\)|Teil\s*[2-9])/.test(b.md);
        if (teilKopf || luecken.some((g) => spaetereLuecken.has(g))) ab = i;
      });
      if (ab >= 0) inhaltEl.querySelectorAll('[data-block]').forEach((el) => Number(el.dataset.block) >= ab && spaeter.push(el));
      teilEls.slice(1).forEach((el) => el && spaeter.push(el));
      if (spaeter.length) {
        stufeOffen = true;
        spaeter.forEach((el) => el.classList.add('stufe-versteckt'));
        stufeBox = h(
          'div',
          { class: 'stufe-box' },
          h('p', { class: 'hint' }, opt.teilPruefen ? 'Finde zuerst die fehlerhafte Zeile. Teil b) erscheint, sobald Teil a) richtig ist.' : 'Lege zuerst die fehlerhafte Zeile fest. Danach erscheint Teil b) – die Zeile kannst du dann nicht mehr ändern.'),
          h('button', { class: 'btn secondary small', type: 'button', onclick: () => stufePruefen() }, opt.teilPruefen ? '✔ Teil a) prüfen' : 'Teil a) festlegen →')
        );
        teilEls[0].appendChild(stufeBox);
      }
    }

    return {
      /** true, solange bei einem Bug-Hunt nur Teil a) sichtbar ist */
      stufeOffen: () => stufeOffen,
      stufePruefen,
      el: box,
      teile,
      mehrteilig,
      fertigKnopf: teile.some((t) => t.fertigKnopf),
      antwort() {
        const a2 = teile.map((t) => t.antwort());
        return mehrteilig ? a2 : a2[0];
      },
      leer() {
        return teile.every((t) => t.leer());
      },
      setze(antwort) {
        if (antwort === null || antwort === undefined) return;
        if (mehrteilig) teile.forEach((t, i) => t.setze(Array.isArray(antwort) ? antwort[i] : undefined));
        else teile[0].setze(antwort);
        // gespeicherte Boss-Antwort mit festgelegter Zeile: Teil a) bleibt gesperrt, Teil b) sichtbar
        if (stufeOffen && !opt.teilPruefen && !teile[0].leer()) {
          teile[0].sperren(true);
          freischalten();
        }
      },
      feedback(r) {
        if (!r || !Array.isArray(r.teile)) return;
        r.teile.forEach((x, i) => {
          teile[i] && teile[i].feedback(x);
          if (teilEls[i] && mehrteilig) {
            teilEls[i].classList.toggle('ok', !!x.ok);
            teilEls[i].classList.toggle('falsch', !x.ok);
          }
        });
      },
      loesung(loesung, muster) {
        freischalten();
        teile.forEach((t, i) => t.loesung(mehrteilig ? (loesung || [])[i] : loesung, mehrteilig ? (muster || [])[i] : muster));
      },
      sperren(an) {
        if (an) freischalten();
        teile.forEach((t) => t.sperren(an));
        schrittSchalter.disabled = an;
      }
    };
  }

  return { aufgabe, art };
})();
