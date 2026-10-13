/* Kryptos – Labor-Werkzeug „Chiffrierscheibe“ (W0 §9.2, Plan M6 Task 111). Die Scheibe ist das Objekt: Innenring
   drehen (Ziehen, Pfeiltasten, ±), Buchstaben antippen → Rechnung (Formel-Modus mit Falle P2), Text-Modus mit
   Nachspiel „Buchstabe für Buchstabe“ und „Alle Verschiebungen“ (Brute-Force ohne automatische Erkennung).
   Rechnet nur über Krypto.*; Geometrie (Winkel, Koordinaten) ist Darstellung. Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = { text: 'zinnober', geheimtext: 'HLNSZ WOPC' }; // eigene Wörter (Review M6), in keinem Material
  const REITER_TITEL = { scheibe: 'Scheibe', text: 'Text-Modus', alle: 'Alle Verschiebungen' };
  const MITTE = 160;
  const SCHRITT = 360 / 26; // Grad je Rastung
  const BUCHSTABEN = [...Krypto.ALPHABET];

  /** Punkt auf dem Kreis (0° oben, im Uhrzeigersinn). */
  function punkt(r, grad) {
    const b = (grad * Math.PI) / 180;
    return [MITTE + r * Math.sin(b), MITTE - r * Math.cos(b)];
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('scheibe', v, umgebung);
    const ruhig = AQ.ruhig();
    let k = Number.isInteger(v.k) && v.k >= 0 && v.k <= 25 ? v.k : 3;
    let basis = v.basis === 0 ? 0 : 1;
    let richtung = v.richtung === 'ent' ? 'ent' : 'ver';
    let text = typeof v.text === 'string' ? v.text.slice(0, 200) : '';
    let abgefangen = BEISPIEL.geheimtext;
    let aktiv = null; // gewählter Klartextbuchstabe (GROSS)
    let gesperrt = false;
    let nachspiel = null;
    let alle = null;
    const aufraeumen = [];

    /* ---------- Scheibe (SVG) ---------- */
    const innen = s('g', { class: 'scheibe-innen' });
    const aussen = s('g', { class: 'scheibe-aussen' });
    const svg = s('svg', { class: 'scheibe-ringe', viewBox: '0 0 320 320', 'aria-hidden': 'true', focusable: 'false' },
      s('circle', { class: 'scheibe-ring-aussen', cx: MITTE, cy: MITTE, r: 156 }),
      s('circle', { class: 'scheibe-ring-innen', cx: MITTE, cy: MITTE, r: 112 }),
      aussen,
      innen,
      s('circle', { class: 'scheibe-nabe', cx: MITTE, cy: MITTE, r: 30 }),
      s('path', { class: 'scheibe-zeiger', d: 'M160 4 L153 -6 L167 -6 Z' })
    );
    const aussenZeichen = [];
    const innenZeichen = [];
    BUCHSTABEN.forEach((b, i) => {
      const winkel = i * SCHRITT;
      const [x, y] = punkt(140, winkel);
      const [xn, yn] = punkt(124, winkel);
      const t = s('text', { class: 'scheibe-klar', x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, Krypto.klein(b));
      const n = s('text', { class: 'scheibe-nummer', x: xn, y: yn, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, '');
      aussen.append(t, n);
      aussenZeichen.push({ b, t, n });
      const [xi, yi] = punkt(96, winkel);
      const [xin, yin] = punkt(78, winkel);
      const ti = s('text', { class: 'scheibe-geheim', x: xi, y: yi, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, b);
      const ni = s('text', { class: 'scheibe-nummer', x: xin, y: yin, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, '');
      innen.append(ti, ni);
      innenZeichen.push({ b, t: ti, n: ni });
    });

    const kAnzeige = h('output', { class: 'scheibe-k', 'aria-hidden': 'true' }); // angesagt wird k über aria-valuetext des Drehknopfs
    const minus = h('button', { type: 'button', class: 'knopf knopf-leise scheibe-minus', 'aria-label': 'Innenring zurückdrehen (k − 1)' }, '−');
    const plus = h('button', { type: 'button', class: 'knopf knopf-leise scheibe-plus', 'aria-label': 'Innenring weiterdrehen (k + 1)' }, '+');
    const drehknopf = h('div', { class: 'scheibe-drehknopf', role: 'slider', tabindex: '0', 'aria-label': 'Innenring der Chiffrierscheibe', 'aria-valuemin': '0', 'aria-valuemax': '25', 'aria-orientation': 'horizontal' }, svg);
    const scheibe = h('div', { class: 'scheibe' }, drehknopf, h('div', { class: 'scheibe-steuer' }, minus, kAnzeige, plus), h('p', { class: 'scheibe-hilfe text-2' }, 'Innenring ziehen oder mit den Pfeiltasten drehen.'));

    const basisKnoepfe = [1, 0].map((n) => h('button', { type: 'button', role: 'radio', 'data-basis': String(n) }, n === 1 ? 'A = 1 … Z = 26' : 'A = 0 … Z = 25'));
    const basisWahl = h('div', { class: 'labor-basis', role: 'radiogroup', 'aria-label': 'Nummerierung' }, basisKnoepfe);

    /* ---------- Alphabetleiste (eine Tabelle, Klartext als Knöpfe) ---------- */
    const kopfKnoepfe = BUCHSTABEN.map((b) => h('button', { type: 'button', class: 'scheibe-buchstabe', 'data-buchstabe': b, 'aria-label': `Rechnung für ${Krypto.klein(b)} zeigen` }, Krypto.klein(b)));
    const kopfZellen = kopfKnoepfe.map((kn) => h('th', { scope: 'col' }, kn));
    const nummernZellen = BUCHSTABEN.map(() => h('td'));
    const geheimZellen = BUCHSTABEN.map(() => h('td', { class: 'scheibe-geheimzelle' }));
    const nummernTitel = h('th', { scope: 'row' });
    const leiste = h(
      'div',
      { class: 'scroll-x' },
      h(
        'table',
        { class: 'alphabet alphabet-teil scheibe-leiste' },
        h('caption', { class: 'sr' }, 'Alphabetleiste: Klartext, Nummer und Geheimtext'),
        h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'ecke' }, 'Klartext'), kopfZellen)),
        h('tbody', null, h('tr', { class: 'zahlen' }, nummernTitel, nummernZellen), h('tr', null, h('th', { scope: 'row' }, 'Geheimtext'), geheimZellen))
      )
    );
    const formel = h('p', { class: 'scheibe-formel', 'aria-live': 'polite' }, 'Tippe einen Buchstaben der Leiste an – dann erscheint die Rechnung.');
    const hinweisOrt = h('div', { class: 'scheibe-hinweis' });

    /* ---------- Anzeige ---------- */
    function zeigeScheibe(animiert) {
      const geheim = Krypto.caesar(Krypto.ALPHABET, k);
      innen.classList.toggle('animiert', !!animiert && !ruhig);
      innen.style.setProperty('--drehung', `${-k * SCHRITT}deg`);
      kAnzeige.textContent = `k = ${k}`;
      drehknopf.setAttribute('aria-valuenow', String(k));
      drehknopf.setAttribute('aria-valuetext', `k = ${k}: a wird zu ${Krypto.caesar('a', k)}`);
      for (const z of aussenZeichen) {
        z.n.textContent = String(Krypto.wert(z.b, basis));
        z.t.classList.toggle('aktiv', z.b === aktiv);
      }
      const ziel = aktiv ? Krypto.caesar(aktiv, k) : null;
      for (const z of innenZeichen) {
        z.n.textContent = String(Krypto.wert(z.b, basis));
        z.t.classList.toggle('aktiv', z.b === ziel);
      }
      nummernTitel.textContent = basis === 1 ? 'A = 1 … Z = 26' : 'A = 0 … Z = 25';
      BUCHSTABEN.forEach((b, i) => {
        nummernZellen[i].textContent = String(Krypto.wert(b, basis));
        geheimZellen[i].textContent = geheim[i];
        const an = b === aktiv;
        for (const z of [kopfZellen[i], nummernZellen[i], geheimZellen[i]]) z.classList.toggle('markiert', an);
        kopfKnoepfe[i].setAttribute('aria-pressed', String(an));
      });
      for (const kn of basisKnoepfe) {
        const an = kn.dataset.basis === String(basis);
        kn.setAttribute('aria-checked', String(an));
        kn.setAttribute('tabindex', an ? '0' : '-1');
      }
      minus.disabled = gesperrt;
      plus.disabled = gesperrt;
      drehknopf.setAttribute('aria-disabled', String(gesperrt));
      zeigeFormel();
    }

    function zeigeFormel() {
      AQ.clear(hinweisOrt);
      if (!aktiv) return;
      const c = Krypto.caesar(aktiv, k);
      const p = Krypto.wert(aktiv, basis);
      const cw = Krypto.wert(c, basis);
      if (basis === 1) {
        formel.textContent = `${Krypto.klein(aktiv)}: c = ((p + k − 1) mod 26) + 1 = ((${p} + ${k} − 1) mod 26) + 1 = ${cw} → ${c}`;
        if (Krypto.mod(p + k, 26) === 0) hinweisOrt.appendChild(B.hinweis('falle', `p + k = ${p + k}: (p + k) mod 26 = 0 → Z – nicht A!`, { falle: 'P2' }));
      } else {
        formel.textContent = `${Krypto.klein(aktiv)}: c = (p + k) mod 26 = (${p} + ${k}) mod 26 = ${cw} → ${c}`;
      }
    }

    function setzeK(neu, animiert = true) {
      if (gesperrt) return;
      const kNeu = Krypto.mod(neu, 26);
      if (kNeu === k) return;
      k = kNeu;
      zeigeScheibe(animiert);
      if (typeof wennK === 'function') wennK();
    }
    let wennK = null;

    minus.addEventListener('click', () => setzeK(k - 1));
    plus.addEventListener('click', () => setzeK(k + 1));
    drehknopf.addEventListener('keydown', (e) => {
      const ziel = { ArrowRight: k + 1, ArrowUp: k + 1, ArrowLeft: k - 1, ArrowDown: k - 1, PageUp: k + 5, PageDown: k - 5, Home: 0, End: 25 }[e.key];
      if (ziel === undefined) return;
      e.preventDefault();
      setzeK(ziel);
    });
    for (const kn of basisKnoepfe) {
      kn.addEventListener('click', () => {
        basis = Number(kn.dataset.basis);
        zeigeScheibe(false);
      });
      kn.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        basis = basis === 1 ? 0 : 1;
        zeigeScheibe(false);
        basisKnoepfe.find((x) => x.dataset.basis === String(basis)).focus();
      });
    }
    for (const kn of kopfKnoepfe) {
      kn.addEventListener('click', () => {
        aktiv = kn.dataset.buchstabe;
        zeigeScheibe(false);
      });
    }

    // Ziehen am Ring: Winkel → nächste Rastung (nur Darstellung)
    let zug = null;
    function winkelVon(e) {
      const r = svg.getBoundingClientRect();
      const x = r.width ? ((e.clientX - r.left) * 320) / r.width : e.clientX;
      const y = r.height ? ((e.clientY - r.top) * 320) / r.height : e.clientY;
      return (Math.atan2(x - MITTE, MITTE - y) * 180) / Math.PI;
    }
    svg.addEventListener('pointerdown', (e) => {
      if (gesperrt) return;
      zug = { start: winkelVon(e), k, id: e.pointerId };
      if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', (e) => {
      if (!zug) return;
      let delta = winkelVon(e) - zug.start;
      while (delta > 180) delta -= 360;
      while (delta <= -180) delta += 360;
      setzeK(zug.k - Math.round(delta / SCHRITT), false);
    });
    const loslassen = (e) => {
      if (zug && svg.releasePointerCapture) svg.releasePointerCapture(e.pointerId);
      zug = null;
    };
    svg.addEventListener('pointerup', loslassen);
    svg.addEventListener('pointercancel', loslassen);

    /* ---------- Reiter ---------- */
    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug scheibe-werkzeug' }, r.element);
    container.appendChild(wurzel);

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
      if (alle) alle.schliesse();
      alle = null;
      gesperrt = false;
      wennK = null;
    }

    let ausgabeText = '';
    function baueText() {
      const feld = B.textfeld({ beschriftung: 'Text (bis 200 Zeichen)', max: 200, wert: text, platzhalter: `z. B. ${BEISPIEL.text}`, art: richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => { text = t; rechne(); } });
      const ri = B.richtung({ wert: richtung, beiWechsel: (x) => { richtung = x; rechne(); } });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const nsOrt = h('div', { class: 'scheibe-nachspiel' });
      r.flaeche.append(h('div', { class: 'scheibe-bereich' }, scheibe, h('div', { class: 'scheibe-text' }, feld.element, ri.element, aus.element, nsOrt)));
      function sperre(an) {
        gesperrt = an;
        feld.sperre(an);
        ri.sperre(an);
        zeigeScheibe(false);
      }
      function rechne() {
        ausgabeText = Krypto.caesar(text, k, richtung);
        aus.setze(richtung === 'ver' ? Krypto.gruppieren(ausgabeText) : Krypto.klein(ausgabeText));
        if (nachspiel) nachspiel.schliesse();
        const quelle = [...Krypto.nurBuchstaben(text)];
        nachspiel = quelle.length
          ? KRLabor.nachspiel(nsOrt, {
              titel: 'Buchstabe für Buchstabe',
              schritte: quelle.map((b) => {
                const z = Krypto.caesar(b, k, richtung);
                const klar = richtung === 'ver' ? b : z;
                const links = richtung === 'ver' ? Krypto.klein(b) : b;
                const rechts = richtung === 'ver' ? z : Krypto.klein(z);
                return { text: `${links} (${Krypto.wert(b, basis)}) → ${rechts} (${Krypto.wert(z, basis)})`, daten: { klar } };
              }),
              zeige(schritt) {
                aktiv = schritt.daten.klar;
                zeigeScheibe(false);
              },
              beiLauf: sperre
            })
          : null;
      }
      wennK = rechne;
      rechne();
    }

    function baueAlle() {
      const feld = B.textfeld({ beschriftung: 'Abgefangener Geheimtext', max: 200, wert: abgefangen, art: 'geheimtext', beiEingabe: (t) => { abgefangen = t; liste(); } });
      const ort = h('div', { class: 'scheibe-alle' });
      r.flaeche.append(feld.element, h('p', { class: 'text-2' }, 'Probiere alle 26 Verschiebungen. Welche Zeile ist lesbares Deutsch? Das entscheidest du.'), ort);
      function liste() {
        if (alle) alle.schliesse();
        AQ.clear(ort);
        const geheim = Krypto.nurBuchstaben(abgefangen);
        alle = KRLabor.alleSchluessel(ort, {
          titel: 'Alle Verschiebungen k = 0 … 25',
          schluessel: BUCHSTABEN.map((_, i) => i),
          beschriftung: (x) => `k = ${x}`,
          probiere: (x) => Krypto.alleCaesar(geheim)[x].text,
          anmerkung: (x) => (x === 0 ? '= Geheimtext (schwacher Schlüssel)' : null),
          zeichen: 20,
          eingabe: geheim
        });
      }
      liste();
    }

    function baue(id) {
      const vorher = zuletzt;
      schliesseTeile();
      AQ.clear(r.flaeche);
      // Wechsel aus dem Text-Modus (Verschlüsseln): eigene Ausgabe wird zum abgefangenen Geheimtext
      if (id === 'alle' && vorher === 'text' && richtung === 'ver' && ausgabeText) abgefangen = ausgabeText;
      zuletzt = id;
      if (id === 'scheibe') {
        r.flaeche.append(h('div', { class: 'scheibe-bereich' }, scheibe, h('div', { class: 'scheibe-formelteil' }, basisWahl, formel, hinweisOrt)), leiste);
        zeigeScheibe(false);
      } else if (id === 'text') baueText();
      else if (id === 'alle') baueAlle();
    }
    let zuletzt = null;
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
        for (const f of aufraeumen) f();
      },
      zustand() {
        return { reiter: r.aktiv(), k, basis, richtung, text, ausgabe: Krypto.caesar(text, k, richtung), aktiv };
      }
    };
  }

  KRLabor.registriere('scheibe', { titel: 'Chiffrierscheibe', oeffne });
})();
