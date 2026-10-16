/* Kryptos – Rahmen „geführter Modus“ der Labor-Werkzeuge (Plan M11 Task 243, E203, E206, E207, E210).
   Das Werkzeug zeigt die Mechanik mit den Werten der Aufgabe, hebt nur den aktuellen Schritt hervor (Eingabeseite), die
   Lernenden lesen bzw. rechnen jeden Schritt selbst und tragen ihn ein. Vor der Freigabe (Aufgabe gelöst oder Lösung
   angesehen → KRGefuehrt.freigeben(aufgabeId)) steht kein Schrittergebnis im DOM, nichts wird bewertet oder eingefärbt,
   hook.korrekt() wird nicht aufgerufen; Folgeschritte entstehen aus den Einträgen. Im freien Labor gibt es keine
   Freigabe. Hook je Werkzeug (E207): gefuehrt(container, werte, umgebung) → { schritte: [{ text, feld: { beschriftung,
   art: 'buchstabe'|'text'|'zahl'|'bits' } }], markiere(i, eintraege), korrekt() → string[], nachFreigabe?(richtig) }.
   Einträge zeigt der Hook nur in Elementen mit der Klasse gefuehrt-eintrag (Prüfung „kein Orakel“).
   M12 (E233): Hook-Flag objekt: true → die Mechanik (das Objekt der Station) steht als Erstes; viertes Hook-Argument
   steuer = { trage(wert), index() }: Eintrag am Objekt (Stempel, Klick) wie im Eingabefeld, danach weiter.
   Rahmen ohne Verfahrensrechnung (Normalisierung über Krypto.*), speichert nichts, kein setInterval. */
'use strict';

const KRGefuehrt = (() => {
  const { h } = AQ;
  const FREI = new Set(); // freigegebene Aufgaben (dieser Seitenaufruf)
  const LAUF = new Set(); // laufende Instanzen

  const HINWEIS_AUFGABE = 'Lies den markierten Schritt ab und trage dein Ergebnis ein. Rückmeldung bekommst du, wenn die Aufgabe gelöst ist.';
  const HINWEIS_FREI = 'Lies den markierten Schritt ab und trage dein Ergebnis ein. Mit eigenen Werten rechnet das Werkzeug frei.';
  const HINWEIS_VORSCHAU = 'Vorschau für Lehrkräfte: Die Lernenden sehen die richtigen Werte erst, wenn die Aufgabe gelöst ist.';

  /** Eintrag normalisieren je Feldart (nur Darstellung/Vergleich) */
  function norm(art, wert) {
    const roh = String(wert ?? '').trim();
    if (!roh) return '';
    if (art === 'zahl') return roh.replace(/\s+/g, '').replace(/^\+/, '');
    if (art === 'bits') return Krypto.normBits(roh).replace(/[^01]/g, '');
    if (art === 'buchstabe') return Krypto.nurBuchstaben(roh).slice(-1);
    return Krypto.normalisieren(roh);
  }
  const gleich = (art, a, b) => norm(art, a) !== '' && norm(art, a) === norm(art, b);

  /**
   * Geführten Modus in ziel starten. hook = gefuehrt-Funktion des Werkzeugs; o = { werte, umgebung, aufgabe,
   * beiEigeneWerte, titel, text: { beschriftung, wert, art, beiAenderung(t), fokus }, felder: { felder: [{ name,
   * beschriftung, wert, art, optionen }], beiAenderung(werte, name), fokus } } – text und felder: die Angaben bleiben
   * änderbar, das Werkzeug startet dann neu. → { element, eintraege(), index(), gehe(i), schliesse(), freigegeben() }
   */
  function starte(ziel, hook, o = {}) {
    const umgebung = o.umgebung || {};
    const aufgabe = typeof o.aufgabe === 'string' && o.aufgabe ? o.aufgabe : null;
    const vorschau = umgebung.rolle === 'lehrkraft';
    const mechanik = h('div', { class: 'gefuehrt-mechanik' });
    const steuer = { trage: (wert) => trage(wert), index: () => i };
    const h_ = typeof hook === 'function' ? hook(mechanik, o.werte || {}, umgebung, steuer) : hook;
    const schritte = (h_ && Array.isArray(h_.schritte) ? h_.schritte : []).filter(Boolean);
    const n = schritte.length;
    const eintraege = schritte.map(() => '');
    let i = 0;
    let richtig = null; // nach der Freigabe: korrekt()
    let zu = false;

    const textVon = (j) => {
      const t = schritte[j].text;
      return String(typeof t === 'function' ? t(eintraege.slice()) : t ?? '');
    };
    const feldVon = (j) => schritte[j].feld || { beschriftung: 'Dein Eintrag', art: 'text' };
    const zaehler = h('p', { class: 'gefuehrt-zaehler', 'aria-live': 'polite' });
    const feldId = KRLaborBau.neueId('gefuehrt-feld');
    const beschriftung = h('label', { for: feldId, class: 'gefuehrt-beschriftung' });
    const feld = h('input', { type: 'text', id: feldId, class: 'gefuehrt-eintrag-feld', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off' });
    const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise gefuehrt-zurueck' }, '◀ Zurück');
    const weiter = h('button', { type: 'button', class: 'knopf knopf-zweit gefuehrt-weiter' }, 'Weiter ▶');
    const liste = h('ol', { class: 'gefuehrt-schritte', 'aria-label': 'Schritte' });
    const zeilen = schritte.map((_, j) =>
      h('li', { class: 'gefuehrt-schritt' }, h('span', { class: 'gefuehrt-zeiger', 'aria-hidden': 'true' }), h('span', { class: 'gefuehrt-text' }), h('span', { class: 'gefuehrt-wert' }, h('span', { class: 'gefuehrt-eintrag' })), h('span', { class: 'gefuehrt-vergleich' }))
    );
    for (const z of zeilen) liste.appendChild(z);
    const fazit = h('p', { class: 'gefuehrt-fazit', role: 'status' });
    const eigene = typeof o.beiEigeneWerte === 'function' ? h('button', { type: 'button', class: 'knopf knopf-leise gefuehrt-eigene' }, 'Eigene Werte') : null;
    const hinweis = h('p', { class: 'gefuehrt-hinweis text-2' }, vorschau ? HINWEIS_VORSCHAU : aufgabe ? HINWEIS_AUFGABE : HINWEIS_FREI);
    // Text der Angaben bleibt änderbar (z. B. beim Weitertippen nach dem Umschalten): das Werkzeug baut die Schritte neu
    const textfeld = o.text && typeof o.text.beiAenderung === 'function'
      ? KRLaborBau.textfeld({ beschriftung: o.text.beschriftung || 'Text', max: o.text.max || 300, wert: o.text.wert || '', art: o.text.art || 'frei', zeilen: 2, beiEingabe: (t) => o.text.beiAenderung(t) })
      : null;
    // Weitere Angaben (Zahlen, Schlüssel) bleiben ebenso änderbar: o.felder = { felder: [{ name, beschriftung, wert, art,
    // optionen }], beiAenderung(werte), fokus } – das Werkzeug startet mit den neuen Werten neu
    const angaben = o.felder && Array.isArray(o.felder.felder) && typeof o.felder.beiAenderung === 'function' ? o.felder : null;
    const angabenFelder = [];
    const angabenElement = angaben
      ? h(
          'div',
          { class: 'labor-steuer gefuehrt-angaben' },
          angaben.felder.map((f) => {
            const id = KRLaborBau.neueId('gefuehrt-angabe');
            const el = Array.isArray(f.optionen)
              ? h('select', { id, class: 'gefuehrt-angabe', 'data-name': f.name }, f.optionen.map((x) => h('option', { value: String(x) }, String(x))))
              : h('input', { type: 'text', id, class: `gefuehrt-angabe${f.art === 'zahl' ? ' zahl-eingabe' : ''}`, 'data-name': f.name, inputmode: f.art === 'zahl' ? 'numeric' : 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', maxlength: String(f.max || 40) });
            el.value = String(f.wert ?? '');
            angabenFelder.push(el);
            const melde = () => angaben.beiAenderung(Object.fromEntries(angabenFelder.map((x) => [x.dataset.name, x.value])), f.name);
            el.addEventListener(Array.isArray(f.optionen) ? 'change' : 'input', melde);
            return h('div', { class: 'labor-textfeld gefuehrt-angabe-feld' }, h('label', { for: id }, f.beschriftung || f.name), el);
          })
        )
      : null;
    const objekt = !!(h_ && h_.objekt === true);
    const element = h(
      'section',
      { class: `gefuehrt${objekt ? ' gefuehrt-mit-objekt' : ''}`, 'data-modus': 'gefuehrt', 'aria-label': o.titel ? `Schritt für Schritt: ${o.titel}` : 'Schritt für Schritt' },
      h('div', { class: 'gefuehrt-kopf' }, h('h3', { class: 'gefuehrt-titel' }, 'Schritt für Schritt'), eigene),
      hinweis,
      objekt ? mechanik : null,
      textfeld ? textfeld.element : null,
      angabenElement,
      objekt ? null : mechanik,
      zaehler,
      h('div', { class: 'gefuehrt-eingabe' }, beschriftung, feld),
      h('div', { class: 'knopf-reihe gefuehrt-knoepfe' }, zurueck, weiter),
      h('div', { class: 'gefuehrt-liste scroll-y' }, liste),
      fazit
    );

    function zeige() {
      if (!n) {
        zaehler.textContent = 'Mit diesen Werten gibt es keine Schritte.';
        feld.disabled = true;
        zurueck.disabled = true;
        weiter.disabled = true;
        return;
      }
      const f = feldVon(i);
      zaehler.textContent = `Schritt ${i + 1} von ${n}: ${textVon(i)}`;
      beschriftung.textContent = f.beschriftung || 'Dein Eintrag';
      feld.setAttribute('inputmode', f.art === 'zahl' || f.art === 'bits' ? 'numeric' : 'text');
      if (f.art === 'buchstabe') feld.setAttribute('maxlength', '1');
      else feld.removeAttribute('maxlength');
      if (feld.value !== eintraege[i]) feld.value = eintraege[i];
      zurueck.disabled = i <= 0;
      weiter.disabled = i >= n - 1;
      zeilen.forEach((z, j) => {
        const an = j === i;
        z.classList.toggle('aktuell', an);
        if (an) z.setAttribute('aria-current', 'step');
        else z.removeAttribute('aria-current');
        z.querySelector('.gefuehrt-zeiger').textContent = an ? '▶' : '';
        z.querySelector('.gefuehrt-text').textContent = `${j + 1}. ${textVon(j)}`;
        z.querySelector('.gefuehrt-eintrag').textContent = eintraege[j] || '–';
      });
      if (typeof h_.markiere === 'function') h_.markiere(i, eintraege.slice());
      if (richtig) vergleich();
    }

    function vergleich() {
      let gut = 0;
      zeilen.forEach((z, j) => {
        const art = feldVon(j).art;
        // leerer richtiger Wert (Review-Fund 8): Zeile wird nicht gebraucht – richtig ist, sie leer zu lassen
        const leer = richtig[j] === '';
        const ok = leer ? !norm(art, eintraege[j]) : gleich(art, eintraege[j], richtig[j]);
        if (ok) gut += 1;
        z.classList.toggle('gefuehrt-richtig', ok);
        z.classList.toggle('gefuehrt-falsch', !ok);
        z.querySelector('.gefuehrt-vergleich').textContent = ok ? (leer ? '✓ richtig leer gelassen' : '✓ richtig') : leer ? '✗ hier bleibt es leer' : `✗ richtig wäre: ${richtig[j] ?? '–'}`;
      });
      fazit.textContent = `Vergleich: ${gut} von ${n} Schritten stimmen mit deinen Einträgen überein.`;
    }

    function freigeben() {
      if (zu || richtig || !h_ || typeof h_.korrekt !== 'function') return;
      richtig = (h_.korrekt() || []).map((x) => String(x ?? ''));
      element.dataset.freigegeben = 'ja';
      hinweis.textContent = vorschau ? HINWEIS_VORSCHAU : 'Die Aufgabe ist gelöst – vergleiche deine Schritte mit den richtigen.';
      vergleich();
      if (typeof h_.nachFreigabe === 'function') h_.nachFreigabe(richtig.slice());
    }

    function gehe(j) {
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, Number(j) || 0));
      zeige();
    }
    function setzeEintrag(wert) {
      const art = feldVon(i).art;
      eintraege[i] = art === 'buchstabe' ? norm(art, wert) : String(wert).slice(0, 80);
      if (feld.value !== eintraege[i]) feld.value = eintraege[i];
    }
    feld.addEventListener('input', () => {
      if (!n) return;
      setzeEintrag(feld.value);
      zeige();
    });
    /** Eintrag am Objekt (M12 E233): wie getippt, dann weiter (letzter Schritt bleibt stehen) */
    function trage(wert) {
      if (!n || zu) return;
      setzeEintrag(String(wert ?? ''));
      if (i < n - 1) i += 1;
      zeige();
    }
    feld.addEventListener('keydown', (e) => {
      const anfang = typeof feld.selectionStart !== 'number' || feld.selectionStart === 0;
      const ende = typeof feld.selectionEnd !== 'number' || feld.selectionEnd >= String(feld.value).length;
      if ((e.key === 'ArrowLeft' && anfang) || (e.key === 'ArrowRight' && ende) || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Tasten bleiben im Werkzeug (kein „Prüfen“ der Aufgabe)
        gehe(i + (e.key === 'ArrowLeft' ? -1 : 1));
        feld.focus();
      }
    });
    zurueck.addEventListener('click', () => gehe(i - 1));
    weiter.addEventListener('click', () => gehe(i + 1));
    if (eigene) eigene.addEventListener('click', () => o.beiEigeneWerte());

    ziel.appendChild(element);
    const inst = {
      aufgabe,
      freigeben,
      element,
      eintraege: () => eintraege.slice(),
      index: () => i,
      gehe,
      freigegeben: () => !!richtig,
      schliesse() {
        zu = true;
        LAUF.delete(inst);
        element.remove();
      }
    };
    LAUF.add(inst);
    zeige();
    if (vorschau || (aufgabe && FREI.has(aufgabe))) freigeben();
    const fokusAngabe = angaben && angaben.fokus ? angabenFelder.find((x) => x.dataset.name === angaben.fokus) : null;
    if (fokusAngabe) {
      fokusAngabe.focus();
      const n = String(fokusAngabe.value).length;
      if (typeof fokusAngabe.setSelectionRange === 'function') fokusAngabe.setSelectionRange(n, n);
    }
    if (textfeld && o.text.fokus) {
      textfeld.feld.focus();
      const n = String(textfeld.feld.value).length;
      if (typeof textfeld.feld.setSelectionRange === 'function') textfeld.feld.setSelectionRange(n, n);
    }
    return inst;
  }

  /** Aufgabe freigeben (gelöst oder Lösung angesehen): alle laufenden geführten Werkzeuge dieser Aufgabe vergleichen */
  function freigeben(aufgabeId) {
    if (typeof aufgabeId !== 'string' || !aufgabeId) return 0;
    FREI.add(aufgabeId);
    let n = 0;
    for (const inst of [...LAUF]) {
      if (inst.aufgabe === aufgabeId) {
        inst.freigeben();
        n += 1;
      }
    }
    return n;
  }
  const freigegeben = (aufgabeId) => FREI.has(aufgabeId);

  /* ---------- Bausteine für die Mechanik der Hooks (nur Darstellung) ---------- */

  /**
   * Raster als Tabelle: o = { zeilen, spalten, caption, zeilenKopf(z) → Text, spaltenKopf(s) → Text, inhalt(z, s) → fester
   * Text (Angaben, z. B. Geheimtext im Raster) }. Einträge stehen in span.gefuehrt-eintrag.
   * → { element, zelle(z, s), markiere(liste [[z, s]]), eintrag(z, s, text), leeren(), kopfMarke(zeilen, spalten) }
   */
  function raster(ziel, o = {}) {
    const zz = Number.isInteger(o.zeilen) && o.zeilen > 0 ? o.zeilen : 0;
    const ss = Number.isInteger(o.spalten) && o.spalten > 0 ? o.spalten : 0;
    const zellen = [];
    const zKopf = [];
    const sKopf = [];
    const kopf = h('tr', null, h('td', { class: 'ecke' }), Array.from({ length: ss }, (_, s) => {
      const th = h('th', { scope: 'col' }, o.spaltenKopf ? String(o.spaltenKopf(s)) : String(s + 1));
      sKopf.push(th);
      return th;
    }));
    const zeilen = Array.from({ length: zz }, (_, z) => {
      const th = h('th', { scope: 'row' }, o.zeilenKopf ? String(o.zeilenKopf(z)) : String(z + 1));
      zKopf.push(th);
      const reihe = Array.from({ length: ss }, (_, s) => {
        const fest = o.inhalt ? o.inhalt(z, s) : null;
        const td = h('td', { class: 'gefuehrt-zelle' }, fest === null || fest === undefined ? h('span', { class: 'gefuehrt-eintrag' }) : String(fest));
        return td;
      });
      zellen.push(reihe);
      return h('tr', null, th, reihe);
    });
    const element = mitTitel(o.caption, h('table', { class: 'labor-tabelle gefuehrt-tabelle' }, h('thead', null, kopf), h('tbody', null, zeilen)));
    if (ziel) ziel.appendChild(element);
    const zelle = (z, s) => (zellen[z] && zellen[z][s]) || null;
    return {
      element,
      zelle,
      markiere(liste) {
        for (const r of zellen) for (const td of r) td.classList.remove('gefuehrt-markiert');
        for (const [z, s] of liste || []) {
          const td = zelle(z, s);
          if (td) td.classList.add('gefuehrt-markiert');
        }
      },
      kopfMarke(zListe = [], sListe = []) {
        zKopf.forEach((th, j) => th.classList.toggle('gefuehrt-markiert', zListe.includes(j)));
        sKopf.forEach((th, j) => th.classList.toggle('gefuehrt-markiert', sListe.includes(j)));
      },
      eintrag(z, s, text) {
        const td = zelle(z, s);
        const sp = td && td.querySelector('.gefuehrt-eintrag');
        if (sp) sp.textContent = String(text ?? '');
      },
      leeren() {
        for (const r of zellen) for (const td of r) {
          const sp = td.querySelector('.gefuehrt-eintrag');
          if (sp) sp.textContent = '';
        }
      }
    };
  }

  /** Band „Dein Ergebnis“: Einträge der Reihe nach (span.gefuehrt-eintrag). → { element, setze(liste) } */
  function band(ziel, titel = 'Deine Einträge') {
    const aus = h('span', { class: 'gefuehrt-eintrag gefuehrt-band-text' });
    const element = h('p', { class: 'gefuehrt-band' }, h('span', { class: 'gefuehrt-band-titel' }, `${titel}: `), aus);
    if (ziel) ziel.appendChild(element);
    return {
      element,
      setze(liste) {
        aus.textContent = (liste || []).map((x) => String(x || '·')).join(' ');
      }
    };
  }

  /** Tabelle im waagerechten Scrollbereich; der Titel steht darüber (bleibt beim schmalen Bildschirm ganz lesbar) */
  function mitTitel(titel, tabelle) {
    if (!titel) return h('div', { class: 'scroll-x' }, tabelle);
    const id = KRLaborBau.neueId('gefuehrt-tabelle');
    tabelle.setAttribute('aria-labelledby', id);
    return h('div', { class: 'gefuehrt-tabellen-block' }, h('p', { class: 'gefuehrt-tabellen-titel', id }, String(titel)), h('div', { class: 'scroll-x' }, tabelle));
  }

  /**
   * Positionsleiste (Positionen ab 0, EH §5) für einen Text der Angaben: o = { titel }. → { element, markiere(positionen) }
   */
  function leiste(ziel, text, o = {}) {
    const zeichen = [...String(text ?? '')];
    const kopf = zeichen.map((_, p) => h('th', { scope: 'col' }, String(p)));
    const zellen = zeichen.map((c) => h('td', { class: 'gefuehrt-zelle' }, c));
    const element = mitTitel(o.titel || 'Positionen ab 0', h('table', { class: 'labor-tabelle gefuehrt-tabelle gefuehrt-leiste' }, h('thead', null, h('tr', { class: 'gefuehrt-positionen' }, kopf)), h('tbody', null, h('tr', null, zellen))));
    if (ziel) ziel.appendChild(element);
    return {
      element,
      markiere(liste) {
        zellen.forEach((td, p) => td.classList.toggle('gefuehrt-markiert', (liste || []).includes(p)));
        kopf.forEach((th, p) => th.classList.toggle('gefuehrt-markiert', (liste || []).includes(p)));
      }
    };
  }

  return { starte, freigeben, freigegeben, norm, raster, band, leiste, HINWEIS_AUFGABE, HINWEIS_FREI };
})();
