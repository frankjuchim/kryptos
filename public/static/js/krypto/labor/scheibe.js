/* Kryptos – Labor-Werkzeug „Chiffrierscheibe“ (W0 §9.2, Plan M6 Task 111, Plan M10 Task 226).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/caesar.html @59004d9 – docs/FREMDCODE.md
   M10: Die Scheibe sieht aus wie in der Werkstatt – Messing-Grundscheibe mit dem Klartext außen (klein), Papierscheibe mit
   dem Geheimtext innen (GROSS), Fenster über dem gewählten Buchstaben, Nabe „a → D · Verschiebung 3“. Geschrieben wird am
   Objekt: außen antippen (Verschlüsseln) bzw. innen antippen (Entschlüsseln) – der Buchstabe fliegt in die Bänder.
   Schlüsselwechsel mitten in einer Nachricht nur über „Neue Nachricht mit neuem Schlüssel“. Nachspielen der eigenen
   Nachricht über KRLabor.nachspiel. Bleibt aus M6: Innenring ziehen/Pfeiltasten/±, Alphabet-Leiste als Tabelle mit
   Nummern (A = 1 oder A = 0) und Formel-Modus (Falle P2), Reiter „Text-Modus“ und „Alle Verschiebungen“.
   Rechnet nur über Krypto.*; Geometrie (Winkel, Koordinaten) ist Darstellung. Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  const BEISPIEL = { text: 'zinnober', geheimtext: 'HLNSZ WOPC' }; // eigene Wörter (Review M6), in keinem Material
  const REITER_TITEL = { scheibe: 'Scheibe', text: 'Text-Modus', alle: 'Alle Verschiebungen' };
  const MITTE = 160;
  const SCHRITT = 360 / 26; // Grad je Rastung
  const BUCHSTABEN = [...Krypto.ALPHABET];
  const MAX = 200; // Zeichen je Nachricht
  // Radien nach der Werkstatt-Scheibe (560er-Bild, hier auf 320 verkleinert)
  const R = { aussen: 153, segAussen: 152, segInnen: 116.6, klar: 135, innen: 115.4, geheim: 100.6, innenRand: 68.6, fenster: 69.7, nabe: 67.4, stift: 9.7 };

  /** Punkt auf dem Kreis (0° oben, im Uhrzeigersinn). */
  function punkt(r, grad) {
    const b = (grad * Math.PI) / 180;
    return [MITTE + r * Math.sin(b), MITTE - r * Math.cos(b)];
  }
  /** Ringsegment (Keil) um den Winkel grad zwischen r1 und r2 */
  function keil(grad, r1, r2) {
    const [x1, y1] = punkt(r1, grad - SCHRITT / 2);
    const [x2, y2] = punkt(r2, grad - SCHRITT / 2);
    const [x3, y3] = punkt(r2, grad + SCHRITT / 2);
    const [x4, y4] = punkt(r1, grad + SCHRITT / 2);
    return `M${x1} ${y1}L${x2} ${y2}A${r2} ${r2} 0 0 1 ${x3} ${y3}L${x4} ${y4}A${r1} ${r1} 0 0 0 ${x1} ${y1}Z`;
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('scheibe', v, umgebung);
    const ruhig = AQ.ruhig();
    let k = Number.isInteger(v.k) && v.k >= 0 && v.k <= 25 ? v.k : 3;
    let basis = v.basis === 0 ? 0 : 1;
    let richtung = v.richtung === 'ent' ? 'ent' : 'ver';
    let text = typeof v.text === 'string' ? v.text.slice(0, MAX) : '';
    // Funkraum (M7 Task 152): beginnt die Voreinstellung mit dem Reiter „alle“, ist text der abgefangene Geheimtext
    let abgefangen = Array.isArray(v.reiter) && v.reiter[0] === 'alle' && text.trim() ? text : BEISPIEL.geheimtext;
    let aktiv = null; // gewählter Klartextbuchstabe (GROSS)
    let gesperrt = false;
    let nachspiel = null;
    let alle = null;
    let schreibSperre = null; // () => true, wenn der Schlüssel gerade nicht wechseln darf (Reiter Scheibe)
    let wennK = null;
    let zuletzt = null;

    /* ---------- Scheibe (SVG nach der Werkstatt) ---------- */
    const messingId = B.neueId('scheibe-messing');
    const verlauf = s('radialGradient', { id: messingId, cx: '35%', cy: '35%', r: '70%' }, s('stop', { offset: '0', class: 'scheibe-messing-1' }), s('stop', { offset: '.55', class: 'scheibe-messing-2' }), s('stop', { offset: '1', class: 'scheibe-messing-3' }));
    const aussen = s('g', { class: 'scheibe-aussen' });
    const innen = s('g', { class: 'scheibe-innen' });
    const fenster = s('path', { class: 'scheibe-fenster', d: keil(0, R.fenster, R.segAussen) });
    const nabeText = s('text', { class: 'scheibe-nabe-buchstabe', x: MITTE, y: MITTE - 25 }, '');
    const nabeZeile = s('text', { class: 'scheibe-nabe-zeile', x: MITTE, y: MITTE + 27 }, '');
    aussen.appendChild(s('circle', { class: 'scheibe-grund', cx: MITTE, cy: MITTE, r: R.aussen }));
    innen.append(s('circle', { class: 'scheibe-papier', cx: MITTE, cy: MITTE, r: R.innen }));
    const aussenZeichen = [];
    const innenZeichen = [];
    BUCHSTABEN.forEach((b, i) => {
      const w = i * SCHRITT;
      const [lx1, ly1] = punkt(R.segInnen, w - SCHRITT / 2);
      const [lx2, ly2] = punkt(R.segAussen, w - SCHRITT / 2);
      aussen.appendChild(s('line', { class: 'scheibe-teilung', x1: lx1, y1: ly1, x2: lx2, y2: ly2 }));
      const seg = s('path', { class: 'scheibe-segment', d: keil(w, R.segInnen, R.segAussen), 'data-buchstabe': Krypto.klein(b) });
      const [x, y] = punkt(R.klar, w);
      const t = s('text', { class: 'scheibe-klar', x, y, transform: `rotate(${w} ${x} ${y})` }, Krypto.klein(b));
      aussen.append(seg, t);
      aussenZeichen.push({ b, seg, t });
      const [ix1, iy1] = punkt(R.innenRand, w - SCHRITT / 2);
      const [ix2, iy2] = punkt(R.innen, w - SCHRITT / 2);
      innen.appendChild(s('line', { class: 'scheibe-teilung-innen', x1: ix1, y1: iy1, x2: ix2, y2: iy2 }));
      const segI = s('path', { class: 'scheibe-segment-innen', d: keil(w, R.innenRand, R.innen), 'data-buchstabe': b });
      const [xi, yi] = punkt(R.geheim, w);
      const ti = s('text', { class: 'scheibe-geheim', x: xi, y: yi, transform: `rotate(${w} ${xi} ${yi})` }, b);
      innen.append(segI, ti);
      innenZeichen.push({ b, seg: segI, t: ti });
    });
    const svg = s(
      'svg',
      { class: 'scheibe-ringe', viewBox: '0 0 320 320', 'aria-hidden': 'true', focusable: 'false' },
      s('defs', null, verlauf),
      aussen,
      innen,
      fenster,
      s('circle', { class: 'scheibe-nabe', cx: MITTE, cy: MITTE, r: R.nabe }),
      nabeText,
      nabeZeile,
      s('circle', { class: 'scheibe-stift', cx: MITTE, cy: MITTE, r: R.stift, fill: `url(#${messingId})` }),
      s('path', { class: 'scheibe-klammer', d: `M${MITTE - 5} ${MITTE}H${MITTE + 5}` })
    );
    S.greifen(svg, (p) => {
      const r = Math.hypot(p.x - MITTE, p.y - MITTE);
      return r >= R.innenRand && r <= R.innen; // nur die innere Scheibe wird gezogen
    });

    const kAnzeige = h('output', { class: 'scheibe-k', 'aria-hidden': 'true' }); // angesagt wird k über aria-valuetext des Drehknopfs
    const schluesselAnzeige = h('span', { class: 'scheibe-schluessel', 'aria-hidden': 'true' });
    const minus = h('button', { type: 'button', class: 'knopf knopf-leise scheibe-minus', 'aria-label': 'Innenring zurückdrehen (k − 1)' }, '−');
    const plus = h('button', { type: 'button', class: 'knopf knopf-leise scheibe-plus', 'aria-label': 'Innenring weiterdrehen (k + 1)' }, '+');
    const drehknopf = h('div', { class: 'scheibe-drehknopf', role: 'slider', tabindex: '0', 'aria-label': 'Innenring der Chiffrierscheibe', 'aria-valuemin': '0', 'aria-valuemax': '25', 'aria-orientation': 'horizontal' }, svg);
    const hilfe = h('p', { class: 'scheibe-hilfe text-2' }, 'Innenring ziehen oder mit den Pfeiltasten drehen.');
    const steuer = h(
      'div',
      { class: 'scheibe-schluesselfeld' },
      h('span', { class: 'scheibe-feldtitel' }, 'Schlüssel: Was steht unter dem a?'),
      h('div', { class: 'scheibe-steuer' }, minus, schluesselAnzeige, plus, kAnzeige)
    );
    const scheibe = h('div', { class: 'scheibe' }, drehknopf, hilfe);

    const basisKnoepfe = [1, 0].map((n) => h('button', { type: 'button', role: 'radio', 'data-basis': String(n) }, n === 1 ? 'A = 1 … Z = 26' : 'A = 0 … Z = 25'));
    const basisWahl = h('div', { class: 'labor-basis', role: 'radiogroup', 'aria-label': 'Nummerierung' }, basisKnoepfe);

    /* ---------- Alphabetleiste (eine Tabelle, Klartext als Knöpfe → Formel) ---------- */
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
    const formel = h('p', { class: 'scheibe-formel leer', 'aria-live': 'polite' }, 'Tippe einen Buchstaben der Leiste an – dann erscheint die Rechnung.');
    const hinweisOrt = h('div', { class: 'scheibe-hinweis' });

    /* ---------- Anzeige ---------- */
    function zeigeScheibe(animiert) {
      const geheim = Krypto.caesar(Krypto.ALPHABET, k);
      innen.classList.toggle('animiert', !!animiert && !ruhig);
      fenster.classList.toggle('animiert', !ruhig);
      innen.style.setProperty('--drehung', `${-k * SCHRITT}deg`);
      kAnzeige.textContent = `k = ${k}`;
      schluesselAnzeige.textContent = geheim[0];
      nabeText.textContent = geheim[0];
      nabeZeile.textContent = `a → ${geheim[0]} · Verschiebung ${k}`;
      drehknopf.setAttribute('aria-valuenow', String(k));
      drehknopf.setAttribute('aria-valuetext', `k = ${k}: a wird zu ${Krypto.caesar('a', k)}`);
      const ziel = aktiv ? Krypto.caesar(aktiv, k) : null;
      for (const z of aussenZeichen) z.t.classList.toggle('aktiv', z.b === aktiv);
      for (const z of innenZeichen) z.t.classList.toggle('aktiv', z.b === ziel);
      fenster.style.setProperty('--fenster', `${aktiv ? Krypto.wert(aktiv, 0) * SCHRITT : 0}deg`);
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
      formel.classList.remove('leer');
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
      if (typeof schreibSperre === 'function' && schreibSperre(kNeu)) return;
      k = kNeu;
      zeigeScheibe(animiert);
      if (typeof wennK === 'function') wennK();
    }

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

    // Ziehen am Innenring: Winkel → nächste Rastung (nur Darstellung)
    let zug = null;
    let gezogen = false; // nach einem Zug kein „Antippen“ des Innenrings
    function koordinaten(e) {
      const r = svg.getBoundingClientRect();
      const x = r.width ? ((e.clientX - r.left) * 320) / r.width : e.clientX;
      const y = r.height ? ((e.clientY - r.top) * 320) / r.height : e.clientY;
      return { x, y };
    }
    function winkelVon(e) {
      const { x, y } = koordinaten(e);
      return (Math.atan2(x - MITTE, MITTE - y) * 180) / Math.PI;
    }
    svg.addEventListener('pointerdown', (e) => {
      gezogen = false;
      if (gesperrt) return;
      const { x, y } = koordinaten(e);
      const r = Math.hypot(x - MITTE, y - MITTE);
      if (r < R.innenRand || r > R.innen) return;
      zug = { start: winkelVon(e), k, id: e.pointerId };
      if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', (e) => {
      if (!zug) return;
      let delta = winkelVon(e) - zug.start;
      while (delta > 180) delta -= 360;
      while (delta <= -180) delta += 360;
      if (Math.abs(delta) < SCHRITT * 0.35) return;
      gezogen = true;
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
    KRStation.herkunft(wurzel);

    let objekt = null; // Teile des Reiters „Scheibe“ (Bänder, Antippen)
    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
      if (alle) alle.schliesse();
      alle = null;
      if (objekt) objekt.schliesse();
      objekt = null;
      gesperrt = false;
      S.sperre(wurzel, false);
      wennK = null;
      schreibSperre = null;
    }

    /* ---------- Reiter „Scheibe“: am Objekt schreiben (Werkstatt) ---------- */
    let nachricht = []; // [[ein, aus], …] – bleibt beim Reiterwechsel erhalten
    function baueObjekt() {
      let bereit = false; // Bänder melden Änderungen erst nach dem Aufbau
      let offenNachspiel = null;
      let gewuenscht = null; // gewünschtes k, solange die Nachricht nicht leer ist
      let zuletztGedreht = false;
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const richtungWahl = B.richtung({ wert: richtung, beiWechsel: (x) => wechsleRichtung(x) });
      const baender = S.baender({ beiAenderung: (bd) => nachAenderung(bd) });
      const sperrHinweis = h('div', { class: 'scheibe-sperre', role: 'status' });
      const feld = B.textfeld({ beschriftung: 'Nachricht eintippen (statt antippen)', max: MAX, art: richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => aufTippen(t) });
      const tippen = h('details', { class: 'scheibe-tippen labor-details' }, h('summary', null, 'Text eintippen'), h('div', { class: 'labor-details-inhalt' }, feld.element));
      const nachspielOrt = h('div', { class: 'scheibe-nachspiel' });
      const nachspielKnopf = h('button', { type: 'button', class: 'knopf knopf-zweit station-nachspielen' }, '▶ Nachspielen');
      const nachspielEnde = h('button', { type: 'button', class: 'knopf knopf-leise station-nachspiel-ende', hidden: true }, '■ Nachspiel beenden');
      const mehrInhalt = [];
      if (reiterListe.includes('alle')) {
        const knopf = h('button', { type: 'button', class: 'knopf knopf-leise scheibe-zu-alle' }, 'Alle Verschiebungen ausprobieren');
        knopf.addEventListener('click', () => r.waehle('alle', { fokus: true }));
        mehrInhalt.push(h('p', { class: 'text-2' }, 'Eve kennt das Verfahren, aber nicht den Schlüssel: Sie dreht die Scheibe auf alle Stellungen und liest jedes Mal. Dein Geheimtext wird dabei übernommen.'), knopf);
      }
      mehrInhalt.push(h('p', { class: 'text-2' }, 'Rechnung zu einem Buchstaben: Tippe ihn in der Leiste unter der Scheibe an.'));
      const mehr = S.mehr(null, 'Mehr ausprobieren', 'alle Schlüssel testen, Rechnung', ...mehrInhalt);
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüsselraum', zeilen: [['Schlüssel', 'ein Buchstabe (was unter dem a steht)'], ['Möglichkeiten', `${Krypto.schluesselraum('caesar').anzahl}, davon 25 sinnvoll`], ['Art', 'monoalphabetische Substitution']] },
        { titel: 'Warum unsicher?', text: 'Nach höchstens 25 Drehungen ist jeder Schlüssel ausprobiert (Brute Force). Auch die Häufigkeitsanalyse hilft: Der häufigste Geheimtextbuchstabe steht meist für e.' },
        { titel: 'Kerckhoffs', text: 'Wie die Scheibe funktioniert, darf jeder wissen. Geheim ist nur die Einstellung – der Schlüssel.' }
      ]);
      // Anordnung wie in der Werkstatt: Bühne (Anleitung, Scheibe, Erklärung) | Bedienspalte; darunter Leiste und Formel
      const buehne = h('div', { class: 'scheibe-buehne' }, anleitung.element, scheibe, erklaerung.element);
      const rechts = h('div', { class: 'scheibe-bedienung' }, richtungWahl.element, steuer, sperrHinweis, baender.element, tippen, h('div', { class: 'knopf-reihe' }, nachspielKnopf, nachspielEnde), nachspielOrt, mehr);
      const unten = h('div', { class: 'scheibe-unten' }, leiste, h('div', { class: 'scheibe-formelteil' }, basisWahl, formel, hinweisOrt));
      const soGehts = S.soGehts(null, ['Innere Scheibe drehen: Der Schlüsselbuchstabe steht unter dem äußeren a.', 'Klartextbuchstaben außen suchen, direkt darunter innen ablesen.', 'Entschlüsseln: innen suchen, außen ablesen.']);
      r.flaeche.append(h('div', { class: 'scheibe-objekt' }, buehne, rechts, unten), soGehts, hintergrund);

      const titel = () => (richtung === 'ver' ? ['Klartext', 'Geheimtext', [false, true]] : ['Geheimtext', 'Klartext', [true, false]]);
      const schritte = () =>
        richtung === 'ver' ? ['Scheibe drehen', 'Buchstaben außen antippen', 'Geheimtext ablesen'] : ['Scheibe auf den Schlüssel drehen', 'Buchstaben innen antippen', 'Klartext ablesen'];
      function eintrag(b) {
        // b GROSS; Verschlüsseln: [klar, geheim], Entschlüsseln: [geheim, klar]
        return richtung === 'ver' ? [Krypto.klein(b), Krypto.caesar(b, k)] : [b, Krypto.klein(Krypto.caesar(b, k, 'ent'))];
      }
      function nachAenderung(bd) {
        if (!bereit) return;
        nachricht = bd.eintraege;
        anleitung.setze(nachricht.length ? 2 : zuletztGedreht ? 1 : 0);
        zeigeSperre();
      }
      function zeigeSperre() {
        AQ.clear(sperrHinweis);
        if (!nachricht.length) {
          hilfe.textContent = 'Innenring ziehen oder mit den Pfeiltasten drehen.';
          return;
        }
        hilfe.textContent = '🔒 Die Scheibe bleibt fest, solange du schreibst.';
        if (gewuenscht !== null) {
          const knopf = h('button', { type: 'button', class: 'knopf knopf-zweit scheibe-neu-schluessel' }, `Neue Nachricht mit k = ${gewuenscht}`);
          knopf.addEventListener('click', () => {
            const ziel = gewuenscht;
            gewuenscht = null;
            baender.leeren();
            feld.setze('');
            setzeK(ziel);
            erklaerung.sage('Neue Nachricht', `Die Scheibe steht jetzt auf k = ${k}: Unter dem a steht ${Krypto.caesar('A', k)}.`);
          });
          sperrHinweis.append(h('p', null, 'Neue Nachricht mit neuem Schlüssel? Während du schreibst, darf sich der Schlüssel nicht ändern.'), knopf);
        }
      }
      schreibSperre = (kNeu) => {
        if (!nachricht.length) {
          zuletztGedreht = true;
          anleitung.setze(1);
          return false;
        }
        gewuenscht = kNeu;
        zeigeSperre();
        erklaerung.sage('Scheibe festgehalten', 'Während du eine Nachricht schreibst, bleibt der Schlüssel gleich. Willst du einen anderen Schlüssel, beginne eine neue Nachricht.');
        return true;
      };
      wennK = () => erklaerung.sage('Schlüssel eingestellt', `Unter dem a steht jetzt ${Krypto.caesar('A', k)}: Jeder Buchstabe wird um ${k} ${k === 1 ? 'Stelle' : 'Stellen'} verschoben.`);
      function beschriften() {
        const [o, u, g] = titel();
        baender.beschrifte(o, u, g);
        anleitung.texte(schritte());
      }
      function wechsleRichtung(x) {
        richtung = x;
        gewuenscht = null;
        baender.leeren();
        feld.setze('');
        beschriften();
        aktiv = null;
        zeigeScheibe(false);
        erklaerung.sage(x === 'ver' ? 'Verschlüsseln' : 'Entschlüsseln', x === 'ver' ? 'Tippe die Klartextbuchstaben auf dem äußeren Ring an.' : 'Stelle zuerst denselben Schlüssel ein wie beim Verschlüsseln. Dann tippe die Geheimtextbuchstaben auf der inneren Scheibe an.');
      }
      function schreibe(b, von) {
        if (gesperrt) {
          erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
          return;
        }
        if (nachricht.length >= MAX) return;
        gewuenscht = null;
        const [ein, aus] = eintrag(b);
        aktiv = richtung === 'ver' ? b : Krypto.caesar(b, k, 'ent');
        baender.push(ein, aus); // zuerst schreiben, dann fliegen (Review Focus 5)
        feld.setze(baender.text(0));
        zeigeScheibe(false);
        const ziel = richtung === 'ver' ? innenZeichen.find((z) => z.b === Krypto.caesar(b, k)) : aussenZeichen.find((z) => z.b === aktiv);
        S.flug(von, baender.letztes(0), ein, { klasse: 'klar' });
        S.flug(ziel.t, baender.letztes(1), aus);
        erklaerung.sage(
          `Buchstabe ${nachricht.length}`,
          richtung === 'ver' ? `Außen ${ein}, innen direkt darunter ${aus}.` : `Innen ${ein}, außen direkt darüber ${aus}.`
        );
      }
      function aufTippen(t) {
        if (gesperrt) return;
        gewuenscht = null;
        baender.setze([...Krypto.nurBuchstaben(t)].slice(0, MAX).map(eintrag));
      }
      const klickAussen = (z) => () => {
        if (richtung === 'ver') schreibe(z.b, z.t);
        else erklaerung.sage('Hinweis', 'Beim Entschlüsseln suchst du den Geheimtextbuchstaben auf der inneren Scheibe.');
      };
      const klickInnen = (z) => () => {
        if (gezogen) return;
        if (richtung === 'ent') schreibe(z.b, z.t);
        else erklaerung.sage('Hinweis', 'Beim Verschlüsseln tippst du den Klartextbuchstaben auf dem äußeren Ring an. Die innere Scheibe drehst du durch Ziehen.');
      };
      const weg = [];
      for (const z of aussenZeichen) {
        const f = klickAussen(z);
        z.seg.addEventListener('click', f);
        weg.push(() => z.seg.removeEventListener('click', f));
      }
      for (const z of innenZeichen) {
        const f = klickInnen(z);
        z.seg.addEventListener('click', f);
        weg.push(() => z.seg.removeEventListener('click', f));
      }

      /* Nachspielen der eigenen Nachricht (KRLabor.nachspiel; Handgriffe währenddessen gesperrt) */
      function beendeNachspiel() {
        if (!offenNachspiel) return;
        offenNachspiel.liste.schliesse();
        const alt = offenNachspiel.items;
        offenNachspiel = null;
        nachspiel = null;
        baender.setze(alt);
        gesperrt = false;
        S.sperre(wurzel, false);
        richtungWahl.sperre(false);
        feld.sperre(false);
        nachspielKnopf.hidden = false;
        nachspielEnde.hidden = true;
        aktiv = null;
        zeigeScheibe(false);
        erklaerung.sage('Nachspiel beendet', 'Deine Nachricht ist unverändert.');
      }
      nachspielEnde.addEventListener('click', beendeNachspiel);
      nachspielKnopf.addEventListener('click', () => {
        if (!nachricht.length) {
          erklaerung.sage('Nachspielen', 'Erzeuge zuerst an der Scheibe eine Nachricht. Danach kannst du sie hier in Ruhe nachspielen.');
          return;
        }
        const items = nachricht.map((e) => [...e]);
        gesperrt = true;
        S.sperre(wurzel, true);
        richtungWahl.sperre(true);
        feld.sperre(true);
        nachspielKnopf.hidden = true;
        nachspielEnde.hidden = false;
        zeigeScheibe(false);
        const schritteListe = [
          { text: `Schlüssel: Die innere Scheibe steht auf k = ${k}. Unter dem a steht ${Krypto.caesar('A', k)}.`, daten: { n: 0, b: 'A' } },
          ...items.map((e, i) => ({
            text: richtung === 'ver' ? `Buchstabe ${i + 1} von ${items.length}: außen ${e[0]} suchen, innen direkt darunter ablesen: ${e[1]}.` : `Buchstabe ${i + 1} von ${items.length}: innen ${e[0]} suchen, außen direkt darüber ablesen: ${e[1]}.`,
            daten: { n: i + 1, b: richtung === 'ver' ? Krypto.nurBuchstaben(e[0]) : Krypto.nurBuchstaben(e[1]) }
          }))
        ];
        const liste = KRLabor.nachspiel(nachspielOrt, {
          titel: 'Deine Nachricht in Ruhe ansehen',
          schritte: schritteListe,
          zeige(schritt, _i, { animiert }) {
            baender.setze(items.slice(0, schritt.daten.n));
            aktiv = schritt.daten.b;
            zeigeScheibe(false);
            if (animiert && schritt.daten.n > 0) {
              const zA = aussenZeichen.find((z) => z.b === aktiv);
              const zI = innenZeichen.find((z) => z.b === Krypto.caesar(aktiv, k));
              const [von, nach] = richtung === 'ver' ? [zA, zI] : [zI, zA];
              S.flug(von.t, baender.letztes(0), items[schritt.daten.n - 1][0], { klasse: 'klar' });
              S.flug(nach.t, baender.letztes(1), items[schritt.daten.n - 1][1]);
            }
          }
        });
        offenNachspiel = { liste, items };
        nachspiel = { schliesse: beendeNachspiel };
      });

      beschriften();
      bereit = true;
      baender.setze(nachricht);
      feld.setze(baender.text(0));
      erklaerung.sage(
        'Bereit',
        richtung === 'ver' ? 'Drehe die innere Scheibe auf einen Schlüssel und tippe dann auf dem äußeren Ring die Buchstaben deiner Nachricht an.' : 'Stelle den Schlüssel ein und tippe die Geheimtextbuchstaben auf der inneren Scheibe an.'
      );
      zeigeScheibe(false);
      return {
        schliesse() {
          if (offenNachspiel) beendeNachspiel();
          for (const f of weg) f();
        },
        baender
      };
    }

    let ausgabeText = '';
    function baueText() {
      const feld = B.textfeld({ beschriftung: 'Text (bis 200 Zeichen)', max: MAX, wert: text, platzhalter: `z. B. ${BEISPIEL.text}`, art: richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => { text = t; rechne(); } });
      const ri = B.richtung({ wert: richtung, beiWechsel: (x) => { richtung = x; nachricht = []; rechne(); } });
      const aus = B.ausgabe({ beschriftung: 'Ergebnis', art: 'frei' });
      const nsOrt = h('div', { class: 'scheibe-nachspiel' });
      r.flaeche.append(h('div', { class: 'scheibe-bereich' }, h('div', { class: 'scheibe-buehne' }, scheibe, steuer), h('div', { class: 'scheibe-text' }, feld.element, ri.element, aus.element, nsOrt)));
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
      zeigeScheibe(false);
    }

    function baueAlle() {
      const feld = B.textfeld({ beschriftung: 'Abgefangener Geheimtext', max: MAX, wert: abgefangen, art: 'geheimtext', beiEingabe: (t) => { abgefangen = t; liste(); } });
      const ort = h('div', { class: 'scheibe-alle' });
      r.flaeche.append(feld.element, h('p', { class: 'text-2' }, 'Probiere alle 26 Verschiebungen. Welche Zeile ergibt einen sinnvollen Text? Das entscheidest du.'), ort);
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

    function eigenerGeheimtext() {
      const geheim = nachricht.map((e) => e[richtung === 'ver' ? 1 : 0]).join('');
      return geheim || null;
    }

    function baue(id) {
      const vorher = zuletzt;
      // Wechsel zu „Alle Verschiebungen“: der eigene Geheimtext (Text-Modus oder Scheibe) wird zum abgefangenen
      if (id === 'alle' && vorher === 'text' && richtung === 'ver' && ausgabeText) abgefangen = ausgabeText;
      if (id === 'alle' && vorher === 'scheibe' && eigenerGeheimtext()) abgefangen = eigenerGeheimtext();
      schliesseTeile();
      AQ.clear(r.flaeche);
      zuletzt = id;
      if (id === 'scheibe') objekt = baueObjekt();
      else if (id === 'text') baueText();
      else if (id === 'alle') baueAlle();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        const amObjekt = r.aktiv() === 'scheibe';
        const eingabe = nachricht.map((e) => e[0]).join('');
        const ausgabe = nachricht.map((e) => e[1]).join('');
        return {
          reiter: r.aktiv(),
          k,
          basis,
          richtung,
          text,
          eingabe: amObjekt ? eingabe : text,
          ausgabe: amObjekt ? ausgabe : Krypto.caesar(text, k, richtung),
          aktiv,
          gesperrt
        };
      }
    };
  }

  KRLabor.registriere('scheibe', { titel: 'Chiffrierscheibe', oeffne });
})();
