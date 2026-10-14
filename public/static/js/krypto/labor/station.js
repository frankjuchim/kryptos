/* Kryptos – Rahmen-Baustein der Labor-Werkzeuge „KRStation“ (Plan M10 Task 224, E170, E172–E174, E186, E196, E197).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), shared/portal.js @59004d9 – docs/FREMDCODE.md
   Portiert: Bewegung mit Easing, fliegende Buchstaben, Stempelkasten, Nachrichtenbänder, Kurzanleitung ①②③, Erklärfeld,
   „Mehr ausprobieren“, Hintergrund, Antippen ohne Wischen, Greifen ohne Scrollen, Ton, Funken – umgebaut für Kryptos:
   alles über AQ.h/AQ.s (Textknoten, kein HTML), Bewegung entfällt bei AQ.ruhig(), Web Animations API statt Stil-Templates,
   kein eigener Abspieler (Nachspielen über KRLabor.nachspiel), keine Speicherung, kein Server. Rechnet nichts; Darstellung
   von Klartext/Geheimtext über Krypto.klein/Krypto.gruppieren. */
'use strict';

const KRStation = (() => {
  const { h } = AQ;

  /** Easing der Werkstatt (quadratisch ein/aus), ohne Potenzen */
  function weich(p) {
    if (p < 0.5) return 2 * p * p;
    const q = -2 * p + 2;
    return 1 - (q * q) / 2;
  }

  /**
   * Bewegung über ms Millisekunden: schritt(e, p) je Frame (e = weich(p)). Bei reduzierter Bewegung genau einmal
   * schritt(1, 1). → Promise mit abbrechen()
   */
  function bewegung(ms, schritt) {
    let abgebrochen = false;
    let fertig;
    const p = new Promise((ok) => {
      fertig = ok;
    });
    p.abbrechen = () => {
      abgebrochen = true;
      fertig();
    };
    if (AQ.ruhig() || !(ms > 0) || typeof requestAnimationFrame !== 'function') {
      schritt(1, 1);
      fertig();
      return p;
    }
    let t0 = null;
    const frame = (jetzt) => {
      if (abgebrochen) return;
      if (t0 === null) t0 = jetzt;
      const anteil = Math.min(1, Math.max(0, (jetzt - t0) / ms));
      schritt(weich(anteil), anteil);
      if (anteil < 1) requestAnimationFrame(frame);
      else fertig();
    };
    requestAnimationFrame(frame);
    return p;
  }

  const FLUG_MS = 380;
  /**
   * Buchstabe fliegt von „von“ nach „nach“ (Elemente). Schreibt nichts – das Ziel ist schon vor dem Flug beschrieben
   * (schnelle Eingaben gehen nie verloren). Ohne el.animate oder bei reduzierter Bewegung sofort fertig.
   */
  function flug(von, nach, zeichen, { klasse = '' } = {}) {
    if (AQ.ruhig() || !von || !nach || typeof von.getBoundingClientRect !== 'function' || typeof nach.getBoundingClientRect !== 'function') return Promise.resolve();
    const klon = h('span', { class: `station-flug ${klasse}`.trim(), 'aria-hidden': 'true' }, String(zeichen ?? ''));
    if (typeof klon.animate !== 'function') return Promise.resolve();
    const a = von.getBoundingClientRect();
    const b = nach.getBoundingClientRect();
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - x0;
    const dy = b.top + b.height / 2 - y0;
    klon.style.setProperty('--flug-x', `${x0}px`);
    klon.style.setProperty('--flug-y', `${y0}px`);
    document.body.appendChild(klon);
    const anim = klon.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 - 40}px)) scale(1.12)`, opacity: 1, offset: 0.5 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 0.2 }
      ],
      { duration: FLUG_MS, easing: 'ease-in-out' }
    );
    return new Promise((ok) => {
      const ende = () => {
        klon.remove();
        ok();
      };
      if (anim && anim.finished && typeof anim.finished.then === 'function') anim.finished.then(ende, ende);
      else ende();
    });
  }

  /**
   * Stempelkasten: 26 Stempel (≥ 44 px über labor_objekte.css). beiStempel(buchstabe, knopf). Buchstabentasten wirken,
   * solange der Fokus im Kasten ist. → { element, setze(an), markiere(buchstabe | null) }
   */
  function stempel(ziel, beiStempel, { alphabet = Krypto.ALPHABET, beschriftung = 'Stempelkasten' } = {}) {
    const knoepfe = [...alphabet].map((b) => h('button', { type: 'button', class: 'station-stempel', 'data-buchstabe': b, 'aria-label': `Stempel ${b}` }, b));
    const element = h('div', { class: 'station-stempelkasten', role: 'group', 'aria-label': beschriftung }, knoepfe);
    let frei = true;
    const druecke = (knopf) => {
      if (!frei || knopf.disabled) return;
      if (!AQ.ruhig()) {
        knopf.classList.remove('gedrueckt');
        void knopf.offsetWidth; // Animation neu starten
        knopf.classList.add('gedrueckt');
      }
      if (typeof beiStempel === 'function') beiStempel(knopf.dataset.buchstabe, knopf);
    };
    for (const k of knoepfe) k.addEventListener('click', () => druecke(k));
    element.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typeof e.key !== 'string' || e.key.length !== 1) return;
      const b = Krypto.nurBuchstaben(e.key);
      if (b.length !== 1) return;
      const knopf = knoepfe.find((x) => x.dataset.buchstabe === b);
      if (!knopf) return;
      e.preventDefault();
      druecke(knopf);
    });
    if (ziel) ziel.appendChild(element);
    return {
      element,
      setze(an) {
        frei = !!an;
        for (const k of knoepfe) k.disabled = !frei;
      },
      markiere(buchstabe) {
        for (const k of knoepfe) k.classList.toggle('markiert', k.dataset.buchstabe === buchstabe);
      }
    };
  }

  /**
   * Zwei Nachrichtenbänder (output.labor-ausgabe): gruppe[i] = true → GROSS in Fünfergruppen (Geheimtext, Klasse „geheim“),
   * sonst klein (Klartext, Klasse „klar“). Knöpfe ⌫ Zurück, ✕ Neue Nachricht, Kopieren (unteres Band, ohne Leerzeichen).
   * → { element, push(ein, aus), pop(), leeren(), setze(eintraege), text(i), letztes(i), eintraege, beschrifte(oben, unten, gruppe) }
   */
  function baender({ oben = 'Klartext', unten = 'Geheimtext', gruppe = [false, true], beiAenderung } = {}) {
    let eintraege = [];
    let art = [...gruppe];
    const titel = [h('span', { class: 'station-band-titel' }, oben), h('span', { class: 'station-band-titel' }, unten)];
    const ausgaben = [0, 1].map((i) => {
      const id = KRLaborBau.neueId('station-band');
      titel[i].setAttribute('id', `${id}-t`);
      return h('output', { class: `labor-ausgabe station-band ${art[i] ? 'geheim' : 'klar'}`, id, 'aria-labelledby': `${id}-t`, 'aria-live': 'off' });
    });
    const ansage = KRLaborBau.ansager();
    const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise station-zurueck' }, '⌫ Zurück');
    const neu = h('button', { type: 'button', class: 'knopf knopf-leise station-neu' }, '✕ Neue Nachricht');
    const kopieren = h('button', { type: 'button', class: 'knopf knopf-leise station-kopieren' }, 'Kopieren');
    const element = h(
      'div',
      { class: 'station-baender' },
      h('div', { class: 'station-band-rahmen' }, titel[0], ausgaben[0]),
      h('div', { class: 'station-band-rahmen' }, titel[1], ausgaben[1]),
      h('div', { class: 'station-band-knoepfe knopf-reihe' }, zurueck, neu, kopieren),
      ansage.element
    );
    const roh = (i) => eintraege.map((e) => e[i]).join('');
    function zeichne(i, frisch) {
      const ziel = ausgaben[i];
      AQ.clear(ziel);
      const s = roh(i);
      const zeichen = [...(art[i] ? s.toUpperCase() : Krypto.klein(s))];
      let inGruppe = 0;
      zeichen.forEach((c, j) => {
        if (art[i] && inGruppe === 5) {
          ziel.appendChild(h('span', { class: 'station-luecke' }, ' '));
          inGruppe = 0;
        }
        inGruppe += 1;
        ziel.appendChild(h('span', { class: frisch && j === zeichen.length - 1 ? 'station-zeichen neu' : 'station-zeichen' }, c));
      });
    }
    function zeige(frisch = false) {
      zeichne(0, frisch);
      zeichne(1, frisch);
      const leer = eintraege.length === 0;
      zurueck.disabled = leer;
      neu.disabled = leer;
      kopieren.disabled = !roh(1);
      if (typeof beiAenderung === 'function') beiAenderung(api);
    }
    zurueck.addEventListener('click', () => {
      api.pop();
      ansage.sage(eintraege.length ? `Letztes Zeichen gelöscht, ${eintraege.length} Zeichen` : 'Nachricht leer');
    });
    neu.addEventListener('click', () => {
      api.leeren();
      ansage.sage('Neue Nachricht');
    });
    kopieren.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(roh(1).replace(/\s+/g, ''));
        AQ.toast('Kopiert.');
      } catch {
        AQ.toast('Kopieren ist hier nicht möglich.', true);
      }
    });
    const api = {
      element,
      push(ein, aus) {
        eintraege.push([String(ein ?? ''), String(aus ?? '')]);
        zeige(true);
      },
      pop() {
        const x = eintraege.pop();
        zeige(false);
        return x;
      },
      leeren() {
        eintraege = [];
        zeige(false);
      },
      setze(liste) {
        eintraege = (Array.isArray(liste) ? liste : []).map((e) => [String(e[0] ?? ''), String(e[1] ?? '')]);
        zeige(false);
      },
      text: (i) => roh(i),
      letztes(i) {
        const z = ausgaben[i].querySelectorAll('.station-zeichen');
        return z.length ? z[z.length - 1] : ausgaben[i];
      },
      get eintraege() {
        return eintraege.map((e) => [...e]);
      },
      beschrifte(o, u, g) {
        titel[0].textContent = o;
        titel[1].textContent = u;
        if (Array.isArray(g)) art = [...g];
        ausgaben.forEach((a, i) => {
          a.classList.toggle('geheim', !!art[i]);
          a.classList.toggle('klar', !art[i]);
        });
        zeige(false);
      },
      ausgaben
    };
    zeige(false);
    return api;
  }

  /** Kurzanleitung ①②③: ol.station-anleitung, aktiver Schritt aria-current="step". → { element, setze(i), texte(liste) } */
  function anleitung(ziel, schritte) {
    const punkte = [];
    const element = h('ol', { class: 'station-anleitung', 'aria-label': 'So geht es' });
    function texte(liste) {
      AQ.clear(element);
      punkte.length = 0;
      (Array.isArray(liste) ? liste : []).forEach((t, i) => {
        const li = h('li', { class: 'station-schritt' }, h('span', { class: 'station-schritt-nr', 'aria-hidden': 'true' }, String(i + 1)), h('span', { class: 'station-schritt-text' }, String(t)));
        punkte.push(li);
        element.appendChild(li);
      });
      setze(aktuell);
    }
    let aktuell = 0;
    function setze(i) {
      aktuell = Math.max(0, Math.min(punkte.length - 1, Number(i) || 0));
      punkte.forEach((li, j) => {
        if (j === aktuell) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
        li.classList.toggle('erledigt', j < aktuell);
        li.firstChild.textContent = j < aktuell ? '✓' : String(j + 1);
      });
    }
    texte(schritte);
    if (ziel) ziel.appendChild(element);
    return { element, setze, texte };
  }

  /** Erklärfeld unter dem Objekt (Titel + Satz, Textknoten), Ansage entprellt. → { element, sage(titel, text) } */
  function erklaerung(ziel) {
    const t = h('p', { class: 'station-erklaerung-titel' });
    const x = h('p', { class: 'station-erklaerung-text' });
    const ansage = KRLaborBau.ansager();
    const element = h('div', { class: 'station-erklaerung' }, t, x, ansage.element);
    if (ziel) ziel.appendChild(element);
    return {
      element,
      sage(titel, text) {
        t.textContent = String(titel ?? '');
        x.textContent = String(text ?? '');
        ansage.sage(`${titel ?? ''}: ${text ?? ''}`);
      }
    };
  }

  /** „Mehr ausprobieren“: details.station-mehr > summary (Titel + Stichworte) + Inhalt. → details */
  function mehr(ziel, titel = 'Mehr ausprobieren', stichworte = '', ...inhalt) {
    const element = h(
      'details',
      { class: 'station-mehr' },
      h('summary', null, h('span', { class: 'station-mehr-titel' }, String(titel)), stichworte ? h('span', { class: 'station-mehr-stichworte text-2' }, String(stichworte)) : null),
      h('div', { class: 'station-mehr-inhalt' }, inhalt)
    );
    if (ziel) ziel.appendChild(element);
    return element;
  }

  /** Hintergrund: details.station-hintergrund mit Karten { titel, zeilen?: [[dt, dd]], text? }. → details */
  function hintergrund(ziel, karten, { titel = 'Hintergrund', offen = false } = {}) {
    const element = h(
      'details',
      { class: 'station-hintergrund', open: offen },
      h('summary', null, String(titel)),
      h(
        'div',
        { class: 'station-hintergrund-karten' },
        (Array.isArray(karten) ? karten : []).map((k) =>
          h(
            'section',
            { class: 'station-karte' },
            h('h3', null, String(k.titel ?? '')),
            Array.isArray(k.zeilen) && k.zeilen.length ? h('dl', { class: 'station-kv' }, k.zeilen.map(([dt, dd]) => [h('dt', null, String(dt)), h('dd', null, String(dd))])) : null,
            k.text ? h('p', null, String(k.text)) : null
          )
        )
      )
    );
    if (ziel) ziel.appendChild(element);
    return element;
  }

  const WISCHEN = 12; // px
  /**
   * Antippen statt Aufsetzen: Maus und Stift wirken sofort; der Finger erst beim Loslassen und nur ohne Wischen
   * (> 12 px) – wer die Seite scrollt, erzeugt nichts. fn(ereignis der Berührung).
   */
  function tippen(el, fn) {
    el.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') {
        fn(ev);
        return;
      }
      const x0 = ev.clientX;
      const y0 = ev.clientY;
      const id = ev.pointerId;
      let gewischt = false;
      const weg = () => {
        el.removeEventListener('pointermove', bewegt);
        el.removeEventListener('pointerup', hoch);
        el.removeEventListener('pointercancel', hoch);
      };
      const bewegt = (e) => {
        if (e.pointerId === id && Math.hypot(e.clientX - x0, e.clientY - y0) > WISCHEN) gewischt = true;
      };
      const hoch = (e) => {
        if (e.pointerId !== id) return;
        weg();
        if (!gewischt && e.type === 'pointerup' && Math.hypot(e.clientX - x0, e.clientY - y0) <= WISCHEN) fn(ev);
      };
      el.addEventListener('pointermove', bewegt);
      el.addEventListener('pointerup', hoch);
      el.addEventListener('pointercancel', hoch);
    });
  }

  /**
   * Nur Ziehbares sperrt das Scrollen: Klasse station-greifbar (touch-action: manipulation); beginnt eine Berührung auf
   * einem ziehbaren Teil (test(punkt in SVG-Koordinaten, ziel) → true), verhindert touchstart das Scrollen.
   */
  function greifen(svg, test) {
    if (!svg) return;
    svg.classList.add('station-greifbar');
    svg.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        let p = { x: t.clientX, y: t.clientY };
        if (typeof svg.getScreenCTM === 'function' && typeof svg.createSVGPoint === 'function') {
          const m = svg.getScreenCTM();
          if (m) {
            const q = svg.createSVGPoint();
            q.x = t.clientX;
            q.y = t.clientY;
            p = q.matrixTransform(m.inverse());
          }
        }
        let treffer = false;
        try {
          treffer = !!test(p, e.target);
        } catch {
          treffer = false;
        }
        if (treffer && e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
  }

  /* ---------- Ton (E186: Schalter, Standard aus, nur nach Nutzeraktion, nichts gespeichert) ---------- */
  let tonAn = false;
  let audio = null;
  const KLANG = {
    rand: { welle: 'triangle', von: 420, bis: 220, laut: 0.25, dauer: 0.12 },
    fell: { welle: 'sine', von: 130, bis: 55, laut: 0.5, dauer: 0.35 },
    klopf: { welle: 'square', von: 300, bis: 160, laut: 0.15, dauer: 0.08 }
  };
  /** kurzer Klang (rand = kurz, fell = lang, klopf) – nur wenn ein Ton-Schalter an ist */
  function ton(art) {
    if (!tonAn) return;
    const k = KLANG[art] || KLANG.klopf;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio = audio || new Ctx();
      const t = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = k.welle;
      o.frequency.setValueAtTime(k.von, t);
      o.frequency.exponentialRampToValueAtTime(k.bis, t + k.dauer);
      g.gain.setValueAtTime(k.laut, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + k.dauer);
      o.connect(g);
      g.connect(audio.destination);
      o.start(t);
      o.stop(t + k.dauer + 0.05);
    } catch {
      /* ohne Ton weiter – jede Information ist auch sichtbar */
    }
  }
  /** Schalter „Ton“ (aria-pressed), beim Öffnen immer aus. → { element, an() } */
  function tonSchalter(ziel) {
    tonAn = false;
    const knopf = h('button', { type: 'button', class: 'knopf knopf-leise station-ton', 'aria-pressed': 'false' }, '🔇 Ton aus');
    knopf.addEventListener('click', () => {
      tonAn = !tonAn;
      knopf.setAttribute('aria-pressed', String(tonAn));
      knopf.textContent = tonAn ? '🔊 Ton an' : '🔇 Ton aus';
    });
    if (ziel) ziel.appendChild(knopf);
    return { element: knopf, an: () => tonAn };
  }

  /** Funken an einem Element (gelungener Schritt) – nur ohne reduzierte Bewegung */
  function funken(el) {
    if (!el || AQ.ruhig()) return;
    AQ.effekt.funken(el);
  }

  /** Handgriffe sperren, solange das Nachspiel läuft: data-gesperrt, Stempel aus, Hinweis oben im Werkzeug */
  function sperre(werkzeug, an) {
    if (!werkzeug) return;
    for (const k of werkzeug.querySelectorAll('button.station-stempel')) k.disabled = !!an;
    const alt = werkzeug.querySelector('.station-sperrhinweis');
    if (an) {
      werkzeug.dataset.gesperrt = 'ja';
      if (!alt) werkzeug.insertBefore(h('p', { class: 'station-sperrhinweis', role: 'status' }, 'Während des Nachspielens ist die Eingabe gesperrt.'), werkzeug.firstChild);
    } else {
      delete werkzeug.dataset.gesperrt;
      if (alt) alt.remove();
    }
  }

  /** Namensnennung am Ende der Werkzeugfläche (Erlaubnis 14.10.2026, docs/FREMDCODE.md) */
  function herkunft(ziel) {
    const p = h('p', { class: 'werkzeug-herkunft' }, 'Ideen von A. Bodendiek (Krypto-Werkstatt)');
    if (ziel) ziel.appendChild(p);
    return p;
  }

  return { bewegung, flug, stempel, baender, anleitung, erklaerung, mehr, hintergrund, tippen, greifen, ton, tonSchalter, funken, sperre, herkunft, weich };
})();
