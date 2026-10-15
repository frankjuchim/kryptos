/* Kryptos – Labor-Werkzeug „Polybios & Playfair“ (Plan M10 Task 229, E180, E186).
   Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), stationen/polybios.html und stationen/playfair.html @59004d9 – docs/FREMDCODE.md
   Polybios: 5 × 5-Quadrat auf Papier mit Kopf „Spalte 1–5“/„Zeile 1–5“ (I/J in einem Feld); Buchstaben antippen → Zeile und
   Spalte leuchten, das Zahlenpaar fliegt ins Band; entschlüsseln: erst die Zeile, dann die Spalte antippen. „Mehr
   ausprobieren“: eigenes Quadrat mit Schlüsselwort (Stempel, doppelte Buchstaben gestrichen), Fackeltelegraph,
   Klopfzeichen (sichtbar als Schlagfolge, Ton nur mit Schalter). Playfair (ab Welt 2, E180): Schlüsselquadrat, zwei Felder
   antippen = Paar, „Aktuelles Paar“ und „Welche Regel?“ mit markierten Ziel-Feldern, „Nachricht abschließen“, Übung (Ziele
   selbst finden, Rückmeldung nur zur Regel), „Ein Buchstabe – viele Bilder“. Rechnet nur über Krypto.* (polybios, quadrat,
   playfairSchritte, schluesselraum); Positionen im Quadrat sind Darstellung. Speichert nichts. */
'use strict';
(() => {
  const { h, s } = AQ;
  const B = KRLaborBau;
  const S = KRStation;
  const BEISPIEL = { playfair: 'LEUCHTFEUER' }; // eigenes Schlüsselwort, in keinem Material
  // M11 (E211): Die frühere Sperrliste D17 steckt jetzt in den Erkenner-Daten (labor/erkenner/quadrat.js). Ein Quadrat
  // aus einer Aufgabe baut das Werkzeug geführt auf (die Lernenden tragen die Felder ein), statt es fertig zu zeigen.
  const REITER_TITEL = { polybios: 'Polybios', playfair: 'Playfair' };
  const MAX = 120; // Buchstaben je Nachricht
  const REGELN = {
    rechteck: { titel: 'Rechteck', ver: 'Ecke in der eigenen Zeile', ent: 'Ecke in der eigenen Zeile' },
    zeile: { titel: 'Gleiche Zeile', ver: 'je eins nach rechts', ent: 'je eins nach links' },
    spalte: { titel: 'Gleiche Spalte', ver: 'je eins nach unten', ent: 'je eins nach oben' }
  };
  // Mini-Bild je Regel (3 × 3 Kästchen): q = Quelle, z = Ziel
  const REGEL_BILD = { rechteck: ['q.z', '...', 'z.q'], zeile: ['...', 'qqz', '...'], spalte: ['.q.', '.q.', '.z.'] };

  /** Schlüsselwort aus der Voreinstellung: nur Buchstaben, höchstens 25 */
  function wortVon(x) {
    if (typeof x !== 'string') return null;
    try {
      return Krypto.nurBuchstaben(x).slice(0, 25);
    } catch {
      return null;
    }
  }

  /** kürzestes Schlüsselwort desselben Quadrats (gleiches Quadrat = gleiche Signatur, D17) – nur über Krypto.quadrat */
  function kuerzester(wort) {
    if (!wort) return '';
    let q;
    try {
      q = Krypto.quadrat(wort).join('');
    } catch {
      return wort;
    }
    for (let n = 0; n <= 25; n++) {
      try {
        if (Krypto.quadrat(q.slice(0, n)).join('') === q) return q.slice(0, n);
      } catch {
        /* weiter */
      }
    }
    return wort;
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('quadrat', v, umgebung);
    const wortFrei = KRLabor.erlaubt('quadrat.schluesselwort', umgebung); // im Level 0.4/2.4 fest (L55)
    const vorRoh = wortFrei ? wortVon(v.schluesselwort) : null;
    const vorWort = vorRoh || null;
    const vorRichtung = v.richtung === 'ent' ? 'ent' : 'ver';
    const stand = {
      polybios: { richtung: vorRichtung, wort: vorWort || '', liste: [] },
      playfair: { richtung: vorRichtung, wort: vorWort && vorWort.length >= 3 ? vorWort : BEISPIEL.playfair, liste: [] }
    };
    const vorText = typeof v.text === 'string' ? v.text.slice(0, 200) : '';
    let gesperrt = false;
    let teil = null; // aktueller Reiter-Aufbau { schliesse, zustand }
    // M11 (E208, E210, E214): Erkenner-Verlauf, Start im geführten Modus (Panel), laufender geführter Modus
    const erkVerlauf = typeof KRErkenner !== 'undefined' ? KRErkenner.verlauf() : null;
    let fuehrung = umgebung && umgebung.gefuehrt && typeof umgebung.gefuehrt === 'object' ? umgebung.gefuehrt : null;
    let gefuehrt = null;
    const mitGefuehrt = typeof KRGefuehrt !== 'undefined';
    /** Aufgabenwerte (Text, Schlüsselwort) erkannt? → geführter Modus und true */
    function erkenne(id, text, ort) {
      const z = stand[id];
      const e = { texte: text ? [text] : [], schluessel: z.wort ? [kuerzester(z.wort)] : [] };
      return B.erkenne(ort, `quadrat.${id}`, e, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt ? () => starteGefuehrt(id, { text: text || '', schluesselwort: z.wort, richtung: z.richtung }) : null }) !== 'frei';
    }

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug quadrat-werkzeug' }, r.element);
    container.appendChild(wurzel);
    KRStation.herkunft(wurzel);

    /* ---------- gemeinsame Teile ---------- */

    /** Quadrat als Knopf-Raster; mitKopf → Zeilen-/Spaltenköpfe 1–5 (Polybios). → { element, felder, koepfe, zeichne(zeilen, wort, aufbau) } */
    function brett({ mitKopf, titel }) {
      const felder = new Map(); // Buchstabe → Knopf
      const koepfe = { zeile: [], spalte: [] };
      const raster = h('div', { class: `quadrat-raster${mitKopf ? ' mit-kopf' : ''}`, role: 'group', 'aria-label': titel });
      const element = h('div', { class: 'quadrat-papier' }, mitKopf ? h('span', { class: 'quadrat-achse quadrat-achse-spalte', 'aria-hidden': 'true' }, 'Spalte') : null, mitKopf ? h('span', { class: 'quadrat-achse quadrat-achse-zeile', 'aria-hidden': 'true' }, 'Zeile') : null, raster, mitKopf ? null : h('p', { class: 'quadrat-unterschrift' }, titel));
      function kopf(art, n) {
        const k = h('button', { type: 'button', class: `quadrat-kopf quadrat-kopf-${art}`, [`data-${art}`]: String(n), 'aria-label': `${art === 'zeile' ? 'Zeile' : 'Spalte'} ${n}` }, String(n));
        koepfe[art].push(k);
        return k;
      }
      function zeichne(zeilen, wort, aufbau = false) {
        AQ.clear(raster);
        felder.clear();
        koepfe.zeile.length = 0;
        koepfe.spalte.length = 0;
        const imWort = new Set(Krypto.nurBuchstaben(wort || '').replace(/J/g, 'I'));
        if (mitKopf) {
          raster.appendChild(h('span', { class: 'quadrat-ecke', 'aria-hidden': 'true' }));
          for (let sp = 1; sp <= 5; sp++) raster.appendChild(kopf('spalte', sp));
        }
        zeilen.forEach((zeile, z) => {
          if (mitKopf) raster.appendChild(kopf('zeile', z + 1));
          [...zeile].forEach((b, sp) => {
            const ij = b === 'I' && !zeilen.join('').includes('J');
            const knopf = h(
              'button',
              { type: 'button', class: `quadrat-feld${imWort.has(b) ? ' kw' : ''}${ij ? ' ij' : ''}`, 'data-buchstabe': b, 'data-zeile': String(z + 1), 'data-spalte': String(sp + 1), 'aria-label': `${ij ? 'I und J' : b}, Zeile ${z + 1}, Spalte ${sp + 1}` },
              ij ? 'I/J' : b
            );
            if (aufbau && !AQ.ruhig()) {
              knopf.classList.add('aufbau');
              knopf.style.setProperty('--i', String(z * 5 + sp));
            }
            felder.set(b, knopf);
            raster.appendChild(knopf);
          });
        });
      }
      return { element, felder, koepfe, zeichne };
    }

    /** Lage eines Buchstabens im Brett (Darstellung, aus den data-Attributen) → [Zeile, Spalte] ab 1 */
    function lage(br, b) {
      const f = br.felder.get(b);
      return f ? [Number(f.dataset.zeile), Number(f.dataset.spalte)] : [0, 0];
    }

    /** Markierungen im Brett: an (Quelle), ziel (Ergebnis), Köpfe an */
    function markiere(br, { an = [], ziel = [], zeile = 0, spalte = 0 } = {}) {
      for (const [b, f] of br.felder) {
        f.classList.toggle('an', an.includes(b));
        f.classList.toggle('ziel', ziel.includes(b));
        f.removeAttribute('data-nr');
      }
      an.forEach((b, i) => {
        const f = br.felder.get(b);
        if (f && an.length > 1 && an[0] !== an[1]) f.setAttribute('data-nr', String(i + 1));
      });
      br.koepfe.zeile.forEach((k, i) => k.classList.toggle('an', i + 1 === zeile));
      br.koepfe.spalte.forEach((k, i) => k.classList.toggle('an', i + 1 === spalte));
    }

    /**
     * Schlüsselwort-Werkbank (Werkstatt „Schlüsselwort ändern“): Stempel, Streifen mit gestrichenen Doppelten, Aufbauen
     * (mindestens 3 Buchstaben), optional Standardquadrat. → { element, sperre(an), schliesse() }
     */
    function wortWerkbank(o) {
      if (!wortFrei) {
        return { element: h('p', { class: 'quadrat-wort-fest text-2' }, 'Das Schlüsselwort ist im Level fest.'), sperre() {}, schliesse() {} };
      }
      return wortWerkbankFrei(o);
    }
    function wortWerkbankFrei({ standard, beiNeu }) {
      let entwurf = '';
      const aendern = h('button', { type: 'button', class: 'knopf knopf-leise quadrat-wort-aendern' }, 'Schlüsselwort ändern');
      const streifen = h('div', { class: 'quadrat-wort-streifen', 'aria-live': 'polite' });
      const hinweis = h('p', { class: 'quadrat-wort-hinweis text-2', 'aria-live': 'polite' });
      const stempel = S.stempel(null, (b) => {
        if (entwurf.length >= 25) return;
        entwurf += b;
        zeigeStreifen();
      }, { beschriftung: 'Stempel für das Schlüsselwort' });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise quadrat-wort-zurueck' }, '⌫ Stempel');
      const aufbauen = h('button', { type: 'button', class: 'knopf knopf-zweit quadrat-wort-aufbauen' }, 'Quadrat aufbauen');
      const std = standard ? h('button', { type: 'button', class: 'knopf knopf-leise quadrat-wort-standard' }, 'Standardquadrat') : null;
      const abbrechen = h('button', { type: 'button', class: 'knopf knopf-leise quadrat-wort-abbrechen' }, 'Abbrechen');
      const box = h(
        'div',
        { class: 'quadrat-wort-editor', hidden: true },
        h('p', { class: 'text-2' }, 'Stempel ein Wort (mindestens 3 Buchstaben). Doppelte Buchstaben werden gestrichen, J zählt als I.'),
        streifen,
        stempel.element,
        h('div', { class: 'knopf-reihe' }, zurueck, aufbauen, std, abbrechen),
        hinweis
      );
      function zeigeStreifen() {
        AQ.clear(streifen);
        const gesehen = new Set();
        for (const b of entwurf) {
          const c = b === 'J' ? 'I' : b;
          const doppelt = gesehen.has(c);
          gesehen.add(c);
          streifen.appendChild(h('span', { class: `quadrat-wort-zeichen${doppelt ? ' doppelt' : ''}` }, h('span', { class: 'quadrat-wort-b' }, b), doppelt ? h('span', { class: 'quadrat-wort-notiz' }, 'doppelt') : b === 'J' ? h('span', { class: 'quadrat-wort-notiz' }, '= I') : null));
        }
        hinweis.textContent = '';
      }
      function schliesse() {
        box.hidden = true;
        aendern.hidden = false;
      }
      aendern.addEventListener('click', () => {
        entwurf = '';
        zeigeStreifen();
        box.hidden = false;
        aendern.hidden = true;
      });
      zurueck.addEventListener('click', () => {
        entwurf = entwurf.slice(0, -1);
        zeigeStreifen();
      });
      aufbauen.addEventListener('click', () => {
        if (entwurf.length < 3) {
          hinweis.textContent = 'Mindestens 3 Buchstaben – ohne Schlüsselwort gäbe es kein Geheimnis.';
          return;
        }
        schliesse();
        beiNeu(entwurf);
      });
      if (std) {
        std.addEventListener('click', () => {
          schliesse();
          beiNeu('');
        });
      }
      abbrechen.addEventListener('click', schliesse);
      const element = h('div', { class: 'quadrat-wort' }, aendern, box);
      return {
        element,
        sperre(an) {
          aendern.disabled = !!an;
          if (an) schliesse();
        },
        schliesse
      };
    }

    function regelKarten() {
      const karten = Object.keys(REGELN).map((id) => {
        const bild = h('span', { class: 'quadrat-regel-bild', 'aria-hidden': 'true' }, REGEL_BILD[id].join('').split('').map((c) => h('span', { class: c === 'q' ? 'q' : c === 'z' ? 'z' : '' })));
        const unter = h('span', { class: 'quadrat-regel-unter text-2' });
        const karte = h('div', { class: 'quadrat-regel', 'data-regel': id }, bild, h('span', { class: 'quadrat-regel-text' }, h('span', { class: 'quadrat-regel-titel' }, REGELN[id].titel), unter));
        return { id, karte, unter };
      });
      return {
        element: h('div', { class: 'quadrat-regeln' }, h('p', { class: 'quadrat-panel-titel' }, 'Welche Regel?'), karten.map((k) => k.karte)),
        setze(regel, richtung) {
          for (const k of karten) {
            k.karte.classList.toggle('an', k.id === regel);
            k.unter.textContent = REGELN[k.id][richtung];
          }
        }
      };
    }

    function schliesseTeil() {
      if (teil) teil.schliesse();
      teil = null;
      if (gefuehrt) gefuehrt.schliesse();
      gefuehrt = null;
      gesperrt = false;
      S.sperre(r.flaeche, false);
    }

    /* ---------- Reiter „Polybios“ ---------- */
    function bauePolybios() {
      const z = stand.polybios;
      let bereit = false;
      let offeneZeile = 0; // Entschlüsseln: angetippte Zeile
      let klopfLauf = 0;
      const br = brett({ mitKopf: true, titel: 'Polybios-Quadrat' });
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const gross = h('span', { class: 'quadrat-gross', 'aria-hidden': 'true' }, '?');
      const kz = h('span', { class: 'quadrat-kz-z' }, '·');
      const ks = h('span', { class: 'quadrat-kz-s' }, '·');
      const panel = h(
        'div',
        { class: 'quadrat-panel' },
        h('p', { class: 'quadrat-panel-titel' }, 'Aktueller Buchstabe'),
        gross,
        h('p', { class: 'quadrat-koordinaten' }, kz, ' ', ks),
        h('p', { class: 'quadrat-panel-unter text-2' }, 'Zeile · Spalte'),
        h('p', { class: 'quadrat-panel-quadrat text-2' })
      );
      const quadratName = panel.lastChild;
      const richtungWahl = B.richtung({ wert: z.richtung, beiWechsel: (x) => wechsleRichtung(x) });
      const schluesselInfo = h('p', { class: 'quadrat-schluessel' });
      const sperrNotiz = h('p', { class: 'quadrat-sperrnotiz text-2' });
      const baender = S.baender({ beiAenderung: (bd) => nachAenderung(bd) });
      const feld = B.textfeld({ beschriftung: 'Nachricht eintippen (statt antippen)', max: MAX, art: z.richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => aufTippen(t) });
      const tippen = h('details', { class: 'quadrat-tippen labor-details' }, h('summary', null, 'Text eintippen'), h('div', { class: 'labor-details-inhalt' }, feld.element));
      const nsOrt = h('div', { class: 'quadrat-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => zeigeAlles(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const werkbank = wortWerkbank({
        standard: true,
        beiNeu: (w) => {
          z.wort = w;
          if (erkenne('polybios', '', null)) return;
          zeichneBrett(true);
          erklaerung.sage(w ? 'Neues Quadrat' : 'Standardquadrat', w ? `Erst kommen die Buchstaben von ${w} (ohne Doppelte), dann der Rest des Alphabets.` : 'Das Quadrat ist wieder alphabetisch geordnet – das kennt jeder.');
        }
      });
      // Fackeltelegraph: links so viele Fackeln wie die Zeile, rechts wie die Spalte
      const flammen = { links: [], rechts: [] };
      const fackelGruppe = (seite, x0) =>
        s(
          'g',
          { class: `quadrat-fackeln-${seite}` },
          s('rect', { class: 'quadrat-mauer', x: x0 - 8, y: 118, width: 156, height: 14, rx: 3 }),
          [0, 1, 2, 3, 4].map((i) => {
            const x = x0 + 14 + i * 32;
            const flamme = s('path', { class: 'quadrat-flamme', d: `M${x} 20 C${x + 11} 36 ${x + 9} 52 ${x} 58 C${x - 9} 52 ${x - 11} 36 ${x} 20 Z` });
            flammen[seite].push(flamme);
            return s('g', null, s('line', { class: 'quadrat-fackelstab', x1: x, y1: 58, x2: x, y2: 118 }), flamme);
          }),
          s('text', { class: 'quadrat-fackel-text', x: x0 + 70, y: 148 }, seite === 'links' ? 'links = Zeile' : 'rechts = Spalte')
        );
      const fackeln = s('svg', { class: 'quadrat-fackeln', viewBox: '0 0 360 156', role: 'img', 'aria-label': 'Fackeltelegraph' }, fackelGruppe('links', 8), fackelGruppe('rechts', 194));
      const klopfen = h('div', { class: 'quadrat-klopfen', 'aria-live': 'polite' });
      const klopfStart = h('button', { type: 'button', class: 'knopf knopf-leise quadrat-klopfen-start' }, '▶ Klopfen vorführen');
      const tonKnopf = S.tonSchalter(null);
      const mehr = S.mehr(
        null,
        'Mehr ausprobieren',
        'Schlüsselwort, Fackeln, Klopfzeichen',
        h('p', { class: 'quadrat-mehr-titel' }, 'Eigenes Quadrat mit Schlüsselwort'),
        werkbank.element,
        h('p', { class: 'quadrat-mehr-titel' }, 'Fackeltelegraph'),
        h('p', { class: 'text-2' }, 'Für jeden Buchstaben: links so viele Fackeln wie die Zeile, rechts so viele wie die Spalte.'),
        fackeln,
        h('p', { class: 'quadrat-mehr-titel' }, 'Klopfzeichen'),
        h('p', { class: 'text-2' }, 'Erst die Zeile klopfen, kurze Pause, dann die Spalte. So geht jeder Buchstabe durch eine Wand.'),
        klopfen,
        h('div', { class: 'knopf-reihe' }, klopfStart, tonKnopf.element)
      );
      const soGehts = S.soGehts(null, ['Suche den Buchstaben im 5 × 5-Quadrat (I und J teilen sich ein Feld).', 'Lies zuerst die Zeile (links), dann die Spalte (oben) ab – das ist sein Zahlenpaar.', 'Entschlüsseln: Tippe die Zeile und dann die Spalte an – wo sie sich kreuzen, steht der Buchstabe.']);
      const raum = Krypto.schluesselraum('playfair'); // gleicher Raum: jede Anordnung von 25 Buchstaben
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüssel', zeilen: [['Standardquadrat', 'öffentlich → nur eine Codierung'], ['Schlüsselwort', 'zuerst das Wort, dann der Rest'], ['Möglichkeiten', `${raum.formel} ${S.ungefaehr(raum.anzahl)}`]] },
        { titel: 'Schwachstelle', text: 'Ein Buchstabe bekommt immer dasselbe Zahlenpaar. Wer zählt, welches Paar am häufigsten vorkommt, findet schnell das e.' },
        { titel: 'Signale', text: 'Polybios soll im 2. Jahrhundert v. Chr. vorgeschlagen haben, Buchstaben mit Fackeln zu melden. Fünf Stufen genügen – genauso funktioniert das Klopfen an einer Wand.' }
      ]);
      const buehne = h('div', { class: 'quadrat-buehne' }, anleitung.element, h('div', { class: 'quadrat-tisch' }, br.element, panel), erklaerung.element);
      const rechts = h('div', { class: 'quadrat-bedienung' }, richtungWahl.element, h('div', { class: 'quadrat-schluesselfeld' }, h('span', { class: 'quadrat-feldtitel' }, 'Schlüssel: Welches Quadrat?'), schluesselInfo, sperrNotiz), baender.element, nk.element, nsOrt, tippen, mehr);
      r.flaeche.append(h('div', { class: 'quadrat-objekt' }, buehne, rechts), soGehts, hintergrund);

      const zeilen = () => Krypto.quadrat(z.wort);
      function zeichneBrett(aufbau = false) {
        br.zeichne(zeilen(), z.wort, aufbau);
        for (const [b, f] of br.felder) f.addEventListener('click', () => klickFeld(b, f));
        for (const art of ['zeile', 'spalte']) for (const k of br.koepfe[art]) k.addEventListener('click', () => klickKopf(art, Number(k.dataset[art]), k));
        br.element.classList.toggle('ent', z.richtung === 'ent');
        schluesselInfo.textContent = z.wort ? `Schlüsselwort ${z.wort}` : 'Standardquadrat (A–Z ohne J, öffentlich)';
        quadratName.textContent = z.wort ? `Quadrat mit ${z.wort}` : 'Standardquadrat';
        zeigeAlles();
      }
      const paarVon = (b) => Krypto.polybios(b, { schluessel: z.wort });
      function eintrag(b) {
        // b GROSS (Klartextbuchstabe); Verschlüsseln [klar, Paar], Entschlüsseln [Paar, klar]
        const p = paarVon(b);
        return z.richtung === 'ver' ? [Krypto.klein(b), p] : [p, Krypto.klein(b)];
      }
      function klarVon(e) {
        return Krypto.nurBuchstaben(z.richtung === 'ver' ? e[0] : e[1]);
      }
      function zeigeBuchstabe(b) {
        const [zl, sp] = b ? lage(br, b) : [0, 0];
        gross.textContent = b ? (b === 'I' && br.felder.get('I').classList.contains('ij') ? 'I/J' : b) : '?';
        gross.classList.toggle('ij', b === 'I' && !!br.felder.get('I') && br.felder.get('I').classList.contains('ij'));
        kz.textContent = zl ? String(zl) : '·';
        ks.textContent = sp ? String(sp) : '·';
        markiere(br, { an: b ? [b] : [], zeile: zl, spalte: sp });
        flammen.links.forEach((f, i) => f.classList.toggle('an', i < zl));
        flammen.rechts.forEach((f, i) => f.classList.toggle('an', i < sp));
      }
      function zeigeKlopfen(aktuell = -1) {
        AQ.clear(klopfen);
        z.liste.forEach((e, i) => {
          const [zl, sp] = lage(br, klarVon(e));
          klopfen.appendChild(h('span', { class: `quadrat-schlaege${i === aktuell ? ' aktuell' : ''}` }, '•'.repeat(zl), ' ', '•'.repeat(sp)));
        });
        klopfStart.disabled = gesperrt || !z.liste.length;
      }
      function zeigeAlles() {
        const letzte = z.liste.length ? klarVon(z.liste[z.liste.length - 1]) : null;
        if (z.richtung === 'ent' && offeneZeile) markiere(br, { zeile: offeneZeile });
        else zeigeBuchstabe(letzte);
        werkbank.sperre(gesperrt || z.liste.length > 0);
        sperrNotiz.textContent = z.liste.length ? '🔒 Das Quadrat bleibt fest, solange du schreibst. „✕ Neue Nachricht“ gibt es frei.' : '';
        anleitung.setze(z.liste.length ? 2 : 0);
        zeigeKlopfen();
        nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e, i) => {
                  const b = klarVon(e);
                  const [zl, sp] = lage(br, b);
                  return { text: `Buchstabe ${i + 1} von ${z.liste.length}: ${Krypto.klein(b)} steht in Zeile ${zl}, Spalte ${sp} → ${zl}${sp}.`, daten: { n: i + 1, b } };
                }),
                zeige(st) {
                  baender.setze(z.liste.slice(0, st.daten.n));
                  zeigeBuchstabe(st.daten.b);
                }
              }
            : null
        );
      }
      function nachAenderung(bd) {
        if (!bereit || gesperrt) return;
        z.liste = bd.eintraege;
        offeneZeile = 0;
        zeigeAlles();
      }
      function beschriften() {
        const ver = z.richtung === 'ver';
        baender.beschrifte(ver ? 'Klartext' : 'Geheimtext (Zahlenpaare)', ver ? 'Geheimtext (Zahlenpaare)' : 'Klartext', ver ? [false, true] : [true, false], ver ? [0, 2] : [2, 0]);
        anleitung.texte(ver ? ['Buchstaben antippen', 'Zeile, dann Spalte', 'Zahlenpaare ablesen'] : ['Zeile antippen', 'Spalte antippen', 'Klartext ablesen']);
      }
      function wechsleRichtung(x) {
        z.richtung = x;
        z.liste = [];
        offeneZeile = 0;
        beschriften();
        baender.leeren();
        feld.setze('');
        br.element.classList.toggle('ent', x === 'ent');
        erklaerung.sage(x === 'ver' ? 'Verschlüsseln' : 'Entschlüsseln', x === 'ver' ? 'Tippe im Quadrat die Buchstaben deiner Nachricht an.' : 'Tippe zuerst die Zeile (links) an, dann die Spalte (oben). Wo sie sich kreuzen, steht der Buchstabe.');
      }
      function schreibe(b, von) {
        if (z.liste.length >= MAX) return;
        const [ein, aus] = eintrag(b);
        if (erkenne('polybios', `${baender.text(0)}${ein}`, null)) return;
        baender.push(ein, aus);
        feld.setze(baender.text(0));
        const [zl, sp] = lage(br, b);
        S.flug(von, baender.letztes(0), ein, { klasse: z.richtung === 'ver' ? 'klar' : '' });
        S.flug(br.felder.get(b), baender.letztes(1), aus, { klasse: z.richtung === 'ver' ? '' : 'klar' });
        erklaerung.sage(`Buchstabe ${z.liste.length}`, z.richtung === 'ver' ? `${Krypto.klein(b)} steht in Zeile ${zl} und Spalte ${sp}: Zahlenpaar ${zl}${sp}.` : `Zeile ${zl} und Spalte ${sp} kreuzen sich bei ${Krypto.klein(b)}.`);
      }
      function klickFeld(b, f) {
        if (gesperrt) return erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.richtung === 'ent') return erklaerung.sage('Hinweis', 'Beim Entschlüsseln tippst du zuerst die Zeile (Zahl links) und dann die Spalte (Zahl oben) an.');
        schreibe(b, f);
      }
      function klickKopf(art, n, k) {
        if (gesperrt) return erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (z.richtung === 'ver') return erklaerung.sage('Hinweis', 'Beim Verschlüsseln tippst du den Buchstaben im Quadrat an – Zeile und Spalte leuchten dann von selbst.');
        if (art === 'zeile') {
          offeneZeile = n;
          markiere(br, { zeile: n });
          anleitung.setze(1);
          erklaerung.sage(`Zeile ${n}`, 'Jetzt die Spalte oben antippen.');
          return;
        }
        if (!offeneZeile) return erklaerung.sage('Erst die Zeile', 'Tippe zuerst die Zeile (links) an, dann die Spalte.');
        const b = Krypto.polybios(`${offeneZeile}${n}`, { schluessel: z.wort }, 'ent');
        offeneZeile = 0;
        schreibe(b, k);
      }
      function aufTippen(t) {
        if (gesperrt) return;
        offeneZeile = 0;
        if (erkenne('polybios', t, null)) return;
        if (z.richtung === 'ver') {
          baender.setze([...Krypto.nurBuchstaben(t)].slice(0, MAX).map((b) => eintrag(b === 'J' ? 'I' : b)));
          return;
        }
        const ziffern = String(t).replace(/[^1-5]/g, '');
        const paare = [];
        for (let i = 0; i + 1 < ziffern.length && paare.length < MAX; i += 2) paare.push(ziffern.slice(i, i + 2));
        baender.setze(paare.map((p) => eintrag(Krypto.polybios(p, { schluessel: z.wort }, 'ent'))));
        if (ziffern.length && Krypto.mod(ziffern.length, 2) === 1) erklaerung.sage('Halbes Paar', 'Die letzte Ziffer hat noch keinen Partner – ein Buchstabe braucht Zeile und Spalte.');
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        richtungWahl.sperre(an);
        feld.sperre(an);
        for (const b of baender.element.querySelectorAll('button')) b.disabled = an || b.disabled;
        werkbank.sperre(an || z.liste.length > 0);
        if (an) klopfLauf += 1;
        klopfStart.disabled = an || !z.liste.length;
      }
      function wartet(ms) {
        return new Promise((ok) => setTimeout(ok, ms));
      }
      klopfStart.addEventListener('click', async () => {
        if (gesperrt || !z.liste.length) return;
        const lauf = ++klopfLauf;
        klopfStart.disabled = true;
        const liste = z.liste.map((e) => lage(br, klarVon(e)));
        for (let i = 0; i < liste.length; i++) {
          if (lauf !== klopfLauf) return;
          zeigeKlopfen(i);
          klopfStart.disabled = true;
          for (const [teilN, pause] of [[liste[i][0], 450], [liste[i][1], 800]]) {
            for (let j = 0; j < teilN; j++) {
              S.ton('klopf');
              await wartet(220);
              if (lauf !== klopfLauf) return;
            }
            await wartet(pause);
          }
        }
        if (lauf === klopfLauf) zeigeKlopfen();
      });

      beschriften();
      if (erkenne('polybios', naechsterText !== null ? naechsterText : z.liste.length ? baender.text(0) : ohneVorText ? '' : vorText, null)) return { schliesse() {}, zustand: () => ({ paar: null, regel: null }) };
      zeichneBrett(false);
      bereit = true;
      baender.setze(z.liste);
      if (naechsterText !== null) {
        feld.setze(naechsterText);
        aufTippen(naechsterText);
      } else if (!z.liste.length && vorText && !ohneVorText && r.aktiv() === reiterListe[0]) {
        feld.setze(vorText);
        aufTippen(vorText);
      }
      erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Tippe im Quadrat einen Buchstaben an. Zeile und Spalte ergeben sein Zahlenpaar.' : 'Tippe die Zeile und dann die Spalte an. Wo sie sich kreuzen, steht der Buchstabe.');
      return {
        schliesse() {
          klopfLauf += 1;
          nk.schliesse();
        },
        tippe(t) {
          feld.setze(t);
          aufTippen(t);
        },
        zustand: () => ({ paar: null, regel: null })
      };
    }

    /* ---------- Reiter „Playfair“ (ab Welt 2) ---------- */
    function bauePlayfair() {
      const z = stand.playfair;
      let bereit = false;
      let erster = null; // angetippter erster Buchstabe des Paars
      let uebung = null; // { schritt, notiz, stufe, fehler }
      const br = brett({ mitKopf: false, titel: 'Schlüsselquadrat' });
      const anleitung = S.anleitung(null, []);
      const erklaerung = S.erklaerung(null);
      const pa = h('span', { class: 'quadrat-paar-b' }, '');
      const pb = h('span', { class: 'quadrat-paar-b' }, '');
      const ra = h('span', { class: 'quadrat-paar-e' }, '');
      const rb = h('span', { class: 'quadrat-paar-e' }, '');
      const xNotiz = h('p', { class: 'quadrat-x-notiz text-2' });
      const regeln = regelKarten();
      const panel = h('div', { class: 'quadrat-panel' }, h('p', { class: 'quadrat-panel-titel' }, 'Aktuelles Paar'), h('p', { class: 'quadrat-paar', 'aria-live': 'polite' }, pa, pb, h('span', { class: 'quadrat-paar-pfeil', 'aria-hidden': 'true' }, '→'), ra, rb), xNotiz, regeln.element);
      const richtungWahl = B.richtung({ wert: z.richtung, beiWechsel: (x) => wechsleRichtung(x) });
      const schluesselInfo = h('p', { class: 'quadrat-schluessel quadrat-schluessel-wort' });
      const sperrNotiz = h('p', { class: 'quadrat-sperrnotiz text-2' });
      const baender = S.baender({ beiAenderung: (bd) => nachAenderung(bd) });
      const abschliessen = h('button', { type: 'button', class: 'knopf knopf-zweit quadrat-abschliessen' }, 'Nachricht abschließen');
      const feld = B.textfeld({ beschriftung: 'Nachricht eintippen (statt antippen)', max: MAX, art: z.richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => aufTippen(t) });
      const tippen = h('details', { class: 'quadrat-tippen labor-details' }, h('summary', null, 'Text eintippen'), h('div', { class: 'labor-details-inhalt' }, feld.element));
      const nsOrt = h('div', { class: 'quadrat-nachspiel' });
      const nk = S.nachspielKnopf(nsOrt, { sperre: (an) => sperre(an), beiEnde: () => zeigeAlles(), beiLeer: (t) => erklaerung.sage('Nachspielen', t) });
      const uebungSchalter = h('input', { type: 'checkbox', class: 'quadrat-uebung' });
      const bilder = h('div', { class: 'quadrat-bilder' });
      const werkbank = wortWerkbank({
        standard: false,
        beiNeu: (w) => {
          z.wort = w;
          if (erkenne('playfair', '', null)) return;
          zeichneBrett(true);
          erklaerung.sage('Neues Schlüsselquadrat', `Erst kommen die Buchstaben von ${w} (ohne Doppelte, J als I), dann der Rest des Alphabets.`);
        }
      });
      const mehr = S.mehr(
        null,
        'Mehr ausprobieren',
        'Übung, Beobachtung, Schlüsselwort',
        h('label', { class: 'quadrat-uebung-zeile' }, uebungSchalter, h('span', null, 'Übung: Ergebnis selbst im Quadrat finden')),
        h('p', { class: 'quadrat-mehr-titel' }, 'Ein Buchstabe – viele Bilder'),
        h('p', { class: 'text-2' }, 'Derselbe Klartextbuchstabe wird je nach Partner anders verschlüsselt.'),
        bilder,
        h('p', { class: 'quadrat-mehr-titel' }, 'Anderes Schlüsselwort'),
        werkbank.element
      );
      const soGehts = S.soGehts(null, [
        'Die Nachricht wird in Paare zerlegt. Zwei gleiche Buchstaben trennt ein X, ein einzelner Rest bekommt ein X.',
        'Rechteck: Jeder Buchstabe nimmt die Ecke in seiner eigenen Zeile.',
        'Gleiche Zeile: je eins nach rechts. Gleiche Spalte: je eins nach unten.',
        'Entschlüsseln: nach links bzw. nach oben.'
      ]);
      const raum = Krypto.schluesselraum('playfair');
      const hintergrund = S.hintergrund(null, [
        { titel: 'Schlüsselraum', zeilen: [['Schlüssel', 'Schlüsselwort → 5 × 5-Quadrat'], ['Möglichkeiten', `${raum.formel} ${S.ungefaehr(raum.anzahl)}`], ['Ersetzt werden', 'Paare: 25 · 24 = 600']] },
        { titel: 'Angriff', text: 'Einzelne Buchstaben zu zählen hilft wenig. Gleiche Paare werden aber immer gleich verschlüsselt – bei langen Texten verraten häufige Paare das Quadrat.' },
        { titel: 'Geschichte', text: 'Das Verfahren wird Charles Wheatstone zugeschrieben (1854); bekannt wurde es unter dem Namen von Lord Playfair.' }
      ]);
      const buehne = h('div', { class: 'quadrat-buehne' }, anleitung.element, h('div', { class: 'quadrat-tisch' }, br.element, panel), erklaerung.element);
      const rechts = h('div', { class: 'quadrat-bedienung' }, richtungWahl.element, h('div', { class: 'quadrat-schluesselfeld' }, h('span', { class: 'quadrat-feldtitel' }, 'Schlüssel: das Schlüsselwort'), schluesselInfo, sperrNotiz), baender.element, h('div', { class: 'knopf-reihe' }, abschliessen, nk.element), nsOrt, tippen, mehr);
      r.flaeche.append(h('div', { class: 'quadrat-objekt' }, buehne, rechts), soGehts, hintergrund);

      const regelText = (st) => {
        const nach = REGELN[st.regel][z.richtung];
        if (st.regel === 'rechteck') return `Rechteck: Jeder Buchstabe nimmt die Ecke in seiner eigenen Zeile → ${st.ergebnis}.`;
        return `${REGELN[st.regel].titel}: ${nach} → ${st.ergebnis}.`;
      };
      function zeichneBrett(aufbau = false) {
        br.zeichne(Krypto.quadrat(z.wort), z.wort, aufbau);
        for (const [b, f] of br.felder) f.addEventListener('click', () => klickFeld(b, f));
        schluesselInfo.textContent = z.wort;
        zeigeAlles();
      }
      function zeigePaar(st, mitErgebnis = true) {
        pa.textContent = st ? st.paar[0] : '';
        pb.textContent = st ? st.paar[1] : '';
        ra.textContent = st && mitErgebnis ? st.ergebnis[0] : st ? '?' : '';
        rb.textContent = st && mitErgebnis ? st.ergebnis[1] : st ? '?' : '';
        regeln.setze(st && mitErgebnis ? st.regel : null, z.richtung);
        markiere(br, { an: st ? [...st.paar] : erster ? [erster] : [], ziel: st && mitErgebnis ? [...st.ergebnis] : [] });
      }
      function zeigeBilder() {
        AQ.clear(bilder);
        if (z.richtung !== 'ver') {
          bilder.appendChild(h('p', { class: 'text-2' }, 'Diese Beobachtung gibt es beim Verschlüsseln.'));
          return;
        }
        const bild = new Map();
        for (const e of z.liste) {
          const paar = e[0].toUpperCase();
          const [x, y] = [paar[0], paar[1]];
          if (!bild.has(x)) bild.set(x, new Set());
          bild.get(x).add(e[1][0]);
          if (!e.eingefuegt) {
            if (!bild.has(y)) bild.set(y, new Set());
            bild.get(y).add(e[1][1]);
          }
        }
        const viele = [...bild].filter(([, m]) => m.size > 1).sort((a, b) => b[1].size - a[1].size || (a[0] < b[0] ? -1 : 1));
        if (!z.liste.length) bilder.appendChild(h('p', { class: 'text-2' }, 'Verschlüssle zuerst einige Paare.'));
        else if (!viele.length) bilder.appendChild(h('p', { class: 'text-2' }, 'Noch keiner – schreib weiter.'));
        else for (const [b, m] of viele) bilder.appendChild(h('p', { class: 'quadrat-bild' }, h('span', { class: 'quadrat-bild-b' }, b), ` → ${[...m].sort().join(', ')}`));
      }
      function zeigeAlles() {
        const letzte = z.liste.length ? z.liste[z.liste.length - 1] : null;
        if (uebung) zeigePaar(uebung.schritt, false);
        else zeigePaar(letzte && !erster ? letzte.schritt : null);
        if (!letzte && !uebung) xNotiz.textContent = '';
        werkbank.sperre(gesperrt || z.liste.length > 0);
        sperrNotiz.textContent = z.liste.length ? '🔒 Das Quadrat bleibt fest, solange du schreibst. „✕ Neue Nachricht“ gibt es frei.' : '';
        abschliessen.hidden = z.richtung !== 'ver';
        abschliessen.disabled = gesperrt;
        anleitung.setze(uebung ? 2 : erster ? 1 : z.liste.length ? 2 : 0);
        zeigeBilder();
        nk.setze(
          z.liste.length
            ? {
                titel: 'Deine Nachricht in Ruhe ansehen',
                start: -1,
                schritte: z.liste.map((e, i) => ({ text: `Paar ${i + 1} von ${z.liste.length}: ${e.schritt.paar} – ${regelText(e.schritt)}`, daten: { n: i + 1 } })),
                zeige(st) {
                  const n = st.daten.n;
                  baender.setze(z.liste.slice(0, n).map((e) => [e[0], e[1]]));
                  zeigePaar(z.liste[n - 1].schritt);
                }
              }
            : null
        );
      }
      function nachAenderung(bd) {
        if (!bereit || gesperrt) return;
        if (bd.eintraege.length < z.liste.length) {
          // ⌫ Zurück oder ✕ Neue Nachricht: angefangenes Paar und Übung verwerfen
          z.liste = z.liste.slice(0, bd.eintraege.length);
          erster = null;
          uebung = null;
        }
        zeigeAlles();
      }
      function beschriften() {
        const ver = z.richtung === 'ver';
        baender.beschrifte(ver ? 'Klartext (Paare)' : 'Geheimtext (Paare)', ver ? 'Geheimtext' : 'Klartext', ver ? [false, true] : [true, false], ver ? [2, 5] : [2, 2]);
        anleitung.texte(ver ? ['Ersten Buchstaben antippen', 'Zweiten antippen', 'Geheimtext ablesen'] : ['Ersten Geheimbuchstaben antippen', 'Zweiten antippen', 'Klartext ablesen']);
      }
      function wechsleRichtung(x) {
        z.richtung = x;
        z.liste = [];
        erster = null;
        uebung = null;
        beschriften();
        baender.leeren();
        feld.setze('');
        erklaerung.sage(x === 'ver' ? 'Verschlüsseln' : 'Entschlüsseln', x === 'ver' ? 'Tippe je zwei Buchstaben nacheinander an.' : 'Tippe je zwei Geheimtextbuchstaben an. Gleiche Zeile → nach links, gleiche Spalte → nach oben.');
      }
      function eintrag(st, eingefuegt) {
        const ver = z.richtung === 'ver';
        const e = [ver ? Krypto.klein(st.paar) : st.paar, ver ? st.ergebnis : Krypto.klein(st.ergebnis)];
        e.schritt = st;
        e.eingefuegt = !!eingefuegt;
        return e;
      }
      function schrittVon(paar) {
        return Krypto.playfairSchritte(paar, z.wort, z.richtung)[0];
      }
      function fuehreAus(st, notiz, eingefuegt, von) {
        if (z.liste.length >= MAX) return;
        const e = eintrag(st, eingefuegt);
        if (erkenne('playfair', `${baender.text(0)}${e[0]}`, null)) return;
        z.liste.push(e);
        baender.push(e[0], e[1]);
        feld.setze('');
        S.flug(von || br.felder.get(st.paar[1]), baender.letztes(0), e[0], { klasse: z.richtung === 'ver' ? 'klar' : '' });
        S.flug(br.felder.get(st.ergebnis[1]), baender.letztes(1), e[1], { klasse: z.richtung === 'ver' ? '' : 'klar' });
        zeigeAlles();
        if (erster) markiere(br, { an: [erster], ziel: [...st.ergebnis] });
        erklaerung.sage(`Paar ${z.liste.length}: ${st.paar}`, `${notiz ? `${notiz} ` : ''}${regelText(st)}`);
      }
      function starte(paar, notiz, eingefuegt, von) {
        const st = schrittVon(paar);
        if (uebungSchalter.checked) {
          uebung = { schritt: st, notiz, eingefuegt, stufe: 0, fehler: 0 };
          zeigeAlles();
          erklaerung.sage('Übung', `${notiz ? `${notiz} ` : ''}Tippe das Ergebnis für ${st.paar[0]} an, dann das für ${st.paar[1]}.`);
          return;
        }
        xNotiz.textContent = eingefuegt ? notiz : '';
        fuehreAus(st, notiz, eingefuegt, von);
      }
      function uebungKlick(b, f) {
        const u = uebung;
        const ziel = u.schritt.ergebnis[u.stufe];
        const quelle = u.schritt.paar[u.stufe];
        if (b !== ziel) {
          u.fehler += 1;
          f.classList.add('quadrat-falsch');
          setTimeout(() => f.classList.remove('quadrat-falsch'), 500);
          const nach = REGELN[u.schritt.regel][z.richtung];
          const warum = u.schritt.regel === 'rechteck' ? `Rechteck: ${quelle} nimmt die Ecke in seiner eigenen Zeile.` : `${REGELN[u.schritt.regel].titel}: der Nachbar ${nach.replace('je eins ', '')}.`;
          if (u.fehler >= 2) regeln.setze(u.schritt.regel, z.richtung);
          erklaerung.sage('Noch nicht', `${b} passt nicht zu ${quelle}. ${u.fehler >= 2 ? warum : 'Schau, wo die beiden Buchstaben im Quadrat liegen: gleiche Zeile, gleiche Spalte oder Rechteck?'}`);
          return;
        }
        f.classList.add('ziel');
        if (u.stufe === 0) {
          u.stufe = 1;
          ra.textContent = b;
          erklaerung.sage('Richtig!', `${quelle} → ${b}. Jetzt das Ergebnis für ${u.schritt.paar[1]}.`);
          return;
        }
        uebung = null;
        S.funken(f);
        xNotiz.textContent = u.eingefuegt ? u.notiz : '';
        fuehreAus(u.schritt, `Richtig! ${u.notiz || ''}`.trim(), u.eingefuegt, f);
      }
      const fuell = (a) => (a === 'X' ? 'Q' : 'X');
      function klickFeld(b, f) {
        if (gesperrt) return erklaerung.sage('Nachspielen läuft', 'Während des Nachspielens ist die Eingabe gesperrt.');
        if (uebung) return uebungKlick(b, f);
        if (!erster) {
          erster = b;
          zeigePaar(null);
          pa.textContent = b;
          pb.textContent = '?';
          anleitung.setze(1);
          erklaerung.sage('Erster Buchstabe', `${b} gewählt. Tippe den zweiten Buchstaben an.`);
          return;
        }
        const a = erster;
        if (a === b) {
          if (z.richtung === 'ent') return erklaerung.sage('Kein gültiges Paar', 'Im Geheimtext bilden zwei gleiche Buchstaben nie ein Paar. Prüfe deine Eingabe.');
          erster = b; // der zweite gleiche Buchstabe beginnt das nächste Paar
          return starte(a + fuell(a), `Zwei gleiche Buchstaben dürfen kein Paar bilden – deshalb kommt ein ${fuell(a)} dazwischen: ${a}${fuell(a)}.`, true, f);
        }
        erster = null;
        starte(a + b, '', false, f);
      }
      abschliessen.addEventListener('click', () => {
        if (gesperrt) return;
        if (uebung) return erklaerung.sage('Übung offen', 'Finde zuerst das Ergebnis des aktuellen Paars.');
        if (!erster) return erklaerung.sage('Nachricht abschließen', z.liste.length ? 'Alle Buchstaben stehen in Paaren – fertig.' : 'Es gibt noch keine Nachricht.');
        const a = erster;
        erster = null;
        starte(a + fuell(a), `Das letzte ${a} hat keinen Partner – deshalb wird ein ${fuell(a)} angehängt: ${a}${fuell(a)}.`, true, br.felder.get(a));
      });
      uebungSchalter.addEventListener('change', () => {
        if (!uebungSchalter.checked && uebung) {
          const u = uebung;
          uebung = null;
          fuehreAus(u.schritt, u.notiz, u.eingefuegt);
          return;
        }
        erklaerung.sage(uebungSchalter.checked ? 'Übung an' : 'Übung aus', uebungSchalter.checked ? 'Nach jedem Paar tippst du das Ergebnis selbst im Quadrat an.' : 'Die Ergebnisse erscheinen wieder von selbst.');
      });
      function aufTippen(t) {
        if (gesperrt) return;
        erster = null;
        uebung = null;
        if (!Krypto.nurBuchstaben(t)) {
          z.liste = [];
          baender.leeren();
          return;
        }
        if (erkenne('playfair', t, null)) return;
        try {
          const schritte = Krypto.playfairSchritte(t, z.wort, z.richtung).slice(0, MAX);
          const roh = Krypto.nurBuchstaben(t).replace(/J/g, 'I');
          let pos = 0;
          z.liste = schritte.map((st) => {
            // eingefügt: das zweite Zeichen des Paars steht nicht an dieser Stelle im Text
            const eingefuegt = z.richtung === 'ver' && roh[pos + 1] !== st.paar[1];
            pos += eingefuegt ? 1 : 2;
            return eintrag(st, eingefuegt);
          });
          bereit = false;
          baender.setze(z.liste.map((e) => [e[0], e[1]]));
          bereit = true;
          zeigeAlles();
        } catch (fehler) {
          erklaerung.sage('So geht es nicht', fehler && fehler.message ? fehler.message : 'Diese Eingabe passt nicht.');
        }
      }
      function sperre(an) {
        gesperrt = an;
        S.sperre(r.flaeche, an);
        richtungWahl.sperre(an);
        feld.sperre(an);
        uebungSchalter.disabled = an;
        abschliessen.disabled = an;
        for (const b of baender.element.querySelectorAll('button')) b.disabled = an || b.disabled;
        werkbank.sperre(an || z.liste.length > 0);
      }

      beschriften();
      if (erkenne('playfair', naechsterText !== null ? naechsterText : z.liste.length ? baender.text(0) : ohneVorText ? '' : vorText, null)) return { schliesse() {}, zustand: () => ({ paar: null, regel: null }) };
      zeichneBrett(false);
      bereit = true;
      baender.setze(z.liste.map((e) => [e[0], e[1]]));
      if (naechsterText !== null) {
        feld.setze(naechsterText);
        aufTippen(naechsterText);
      } else if (!z.liste.length && vorText && !ohneVorText && r.aktiv() === reiterListe[0]) {
        feld.setze(vorText);
        aufTippen(vorText);
      }
      erklaerung.sage('Bereit', z.richtung === 'ver' ? 'Tippe im Quadrat nacheinander zwei Buchstaben an. Das ist ein Paar.' : 'Tippe je zwei Geheimtextbuchstaben an.');
      return {
        schliesse() {
          nk.schliesse();
        },
        tippe(t) {
          feld.setze(t);
          aufTippen(t);
        },
        zustand() {
          const letzte = z.liste.length ? z.liste[z.liste.length - 1].schritt : null;
          const st = uebung ? uebung.schritt : letzte;
          return { paar: st ? st.paar : null, regel: st ? st.regel : null };
        }
      };
    }

    /* ---------- Geführter Modus (M11 Task 244, E208): Quadrat geführt aufbauen, aktueller Buchstabe bzw. aktuelles Paar ---------- */

    const OHNE_J = [...Krypto.ALPHABET].filter((b) => b !== 'J');
    /** Aufbau-Schritte eines Schlüsselquadrats: Schlüsselwort-Streifen (nächster Buchstabe markiert), Felder aus Einträgen */
    function aufbau(container, wort) {
      const eindeutig = [...new Set(Krypto.nurBuchstaben(wort).replace(/J/g, 'I'))];
      const streifen = eindeutig.map((b) => h('span', { class: 'quadrat-wort-zeichen gefuehrt-zelle' }, b));
      container.appendChild(h('p', { class: 'quadrat-wort-streifen' }, h('span', { class: 'quadrat-feldtitel' }, 'Schlüsselwort ohne Doppelte (J = I): '), streifen));
      const rest = OHNE_J.map((b) => h('span', { class: 'quadrat-rest-zeichen' }, b));
      // gestrichen wird aus deinen Einträgen (Klasse gefuehrt-eintrag: Darstellung der Einträge, kein Urteil)
      container.appendChild(h('p', { class: 'quadrat-rest' }, h('span', { class: 'quadrat-feldtitel' }, 'Dann der Rest des Alphabets (ohne J) – deine benutzten Buchstaben sind gestrichen: '), h('span', { class: 'gefuehrt-eintrag quadrat-rest-liste' }, rest)));
      const schritte = OHNE_J.map((_, i) => ({ text: i < eindeutig.length ? `Feld ${i + 1} (Zeile ${Krypto.teileMitRest(i, 5).q + 1}, Spalte ${Krypto.teileMitRest(i, 5).r + 1}): nächster Buchstabe des Schlüsselworts` : `Feld ${i + 1} (Zeile ${Krypto.teileMitRest(i, 5).q + 1}, Spalte ${Krypto.teileMitRest(i, 5).r + 1}): nächster noch nicht benutzter Buchstabe`, feld: { beschriftung: 'Buchstabe für das Feld', art: 'buchstabe' } }));
      return {
        schritte,
        markiere(i, eintraege) {
          streifen.forEach((sp, j) => sp.classList.toggle('gefuehrt-markiert', j === i));
          const benutzt = new Set(eintraege.slice(0, 25).filter(Boolean));
          rest.forEach((sp) => sp.classList.toggle('benutzt', benutzt.has(sp.textContent)));
        },
        korrekt: () => Krypto.quadrat(wort).join('').split('')
      };
    }
    function polybiosHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const wort = wortVon(werte.schluesselwort) || '';
      const auf = wort ? aufbau(container, wort) : null;
      const n0 = auf ? 25 : 0;
      const fest = wort ? null : Krypto.quadrat('');
      const raster = KRGefuehrt.raster(container, { zeilen: 5, spalten: 5, caption: wort ? 'Dein Quadrat (Zeile, Spalte ab 1)' : 'Standardquadrat (Zeile, Spalte ab 1; I/J ein Feld)', inhalt: fest ? (zz, ss) => fest[zz][ss] : null });
      const band = KRGefuehrt.band(container, ver ? 'Deine Zahlenpaare' : 'Dein Klartext');
      const roh = String(werte.text || '');
      const eingabe = ver ? [...Krypto.nurBuchstaben(roh).replace(/J/g, 'I')].slice(0, MAX) : (roh.replace(/[^1-5]/g, '').match(/[1-5]{2}/g) || []).slice(0, MAX);
      const schritte = [...(auf ? auf.schritte : []), ...eingabe.map((x) => (ver ? { text: `Buchstabe ${Krypto.klein(x)}: Zeile und Spalte`, feld: { beschriftung: 'Zahlenpaar (Zeile, Spalte)', art: 'zahl' } } : { text: `Zahlenpaar ${x}: Zeile ${x[0]}, Spalte ${x[1]}`, feld: { beschriftung: 'Klartextbuchstabe', art: 'buchstabe' } }))];
      const lageIn = (eintraege, b) => {
        if (fest) {
          for (let zz = 0; zz < 5; zz++) for (let ss = 0; ss < 5; ss++) if (fest[zz][ss] === b) return [zz, ss];
          return null;
        }
        const j = eintraege.slice(0, 25).findIndex((x) => x === b);
        return j >= 0 ? [Krypto.teileMitRest(j, 5).q, Krypto.teileMitRest(j, 5).r] : null;
      };
      return {
        schritte,
        markiere(i, eintraege) {
          raster.leeren();
          if (!fest) eintraege.slice(0, 25).forEach((x, j) => x && raster.eintrag(Krypto.teileMitRest(j, 5).q, Krypto.teileMitRest(j, 5).r, x));
          if (auf) auf.markiere(i < 25 ? i : -1, eintraege);
          raster.markiere([]);
          raster.kopfMarke([], []);
          if (i >= n0) {
            const x = eingabe[i - n0];
            if (ver) {
              const l = lageIn(eintraege, x);
              raster.markiere(l ? [l] : []);
            } else raster.kopfMarke([Number(x[0]) - 1], [Number(x[1]) - 1]);
          }
          band.setze(eintraege.slice(n0).map((x) => (ver ? x : Krypto.klein(x))));
        },
        korrekt: () => [...(auf ? auf.korrekt() : []), ...eingabe.map((x) => (ver ? Krypto.polybios(x, wort ? { schluessel: wort } : {}) : Krypto.klein(Krypto.polybios(x, wort ? { schluessel: wort } : {}, 'ent'))))]
      };
    }
    function playfairHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const wort = wortVon(werte.schluesselwort) || BEISPIEL.playfair;
      const auf = aufbau(container, wort);
      const raster = KRGefuehrt.raster(container, { zeilen: 5, spalten: 5, caption: 'Dein Schlüsselquadrat', zeilenKopf: () => '', spaltenKopf: () => '' });
      const band = KRGefuehrt.band(container, ver ? 'Dein Geheimtext' : 'Dein Klartext');
      const roh = Krypto.nurBuchstaben(String(werte.text || '')).replace(/J/g, 'I').slice(0, MAX);
      let paare = [];
      try {
        paare = ver ? Krypto.playfairPaare(roh) : roh.match(/[A-Z]{2}/g) || [];
      } catch {
        paare = [];
      }
      const np = paare.length;
      const schritte = [...auf.schritte];
      // Verschlüsseln: Paare selbst bilden (Füllzeichen X), dann je Paar die Regel anwenden
      if (ver) for (let j = 0; j < np; j++) schritte.push({ text: `Paar ${j + 1}: die nächsten zwei Buchstaben deiner Nachricht (gleiche trennt ein X, ein Rest bekommt ein X)`, feld: { beschriftung: 'Paar (zwei Buchstaben)', art: 'text' } });
      for (let j = 0; j < np; j++) schritte.push({ text: ver ? `Paar ${j + 1} verschlüsseln: dein Paar aus Schritt ${25 + j + 1}` : `Geheimtextpaar ${paare[j]}`, feld: { beschriftung: ver ? 'Geheimtextpaar' : 'Klartextpaar', art: 'text' } });
      const textLeiste = ver && roh ? KRGefuehrt.leiste(container, roh, { titel: 'Deine Nachricht (Positionen ab 0)' }) : null;
      const lageIn = (eintraege, b) => {
        const j = eintraege.slice(0, 25).findIndex((x) => x === b);
        return j >= 0 ? [Krypto.teileMitRest(j, 5).q, Krypto.teileMitRest(j, 5).r] : null;
      };
      return {
        schritte,
        markiere(i, eintraege) {
          raster.leeren();
          eintraege.slice(0, 25).forEach((x, j) => x && raster.eintrag(Krypto.teileMitRest(j, 5).q, Krypto.teileMitRest(j, 5).r, x));
          auf.markiere(i < 25 ? i : -1, eintraege);
          raster.markiere([]);
          if (textLeiste) textLeiste.markiere([]);
          const start = ver ? 25 + np : 25;
          if (i >= start) {
            const j = i - start;
            const paar = ver ? Krypto.nurBuchstaben(eintraege[25 + j] || '').replace(/J/g, 'I').slice(0, 2) : paare[j];
            raster.markiere([...paar].map((b) => lageIn(eintraege, b)).filter(Boolean));
          }
          band.setze(eintraege.slice(start).map((x) => (ver ? Krypto.nurBuchstaben(x) : Krypto.klein(Krypto.nurBuchstaben(x)))));
        },
        korrekt() {
          const erg = paare.map((p) => Krypto.playfairSchritte(p, wort, ver ? 'ver' : 'ent')[0].ergebnis);
          return [...auf.korrekt(), ...(ver ? paare : []), ...erg.map((x) => (ver ? x : Krypto.klein(x)))];
        }
      };
    }
    const HOOKS = { polybios: polybiosHook, playfair: playfairHook };
    function starteGefuehrt(id, werte) {
      const fokus = typeof document !== 'undefined' && document.activeElement && wurzel.contains(document.activeElement);
      if (teil) teil.schliesse();
      teil = null;
      if (gefuehrt) gefuehrt.schliesse();
      gesperrt = false;
      S.sperre(r.flaeche, false);
      AQ.clear(r.flaeche);
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : (umgebung && typeof umgebung.aufgabe === 'string' && umgebung.aufgabe) || null,
        titel: 'Polybios & Playfair',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          stand.polybios.wort = '';
          stand.playfair.wort = BEISPIEL.playfair;
          stand[id].liste = [];
          baue(id, { ohneText: true });
        },
        text: {
          beschriftung: werte.richtung === 'ent' ? 'Geheimtext' : 'Klartext',
          wert: werte.text || '',
          fokus,
          beiAenderung: (t) => {
            fuehrung = null;
            stand[id].liste = [];
            naechsterText = t;
            try {
              baue(id, { ohneText: true });
            } finally {
              naechsterText = null;
            }
            B.fokusAmEnde(r.flaeche);
          }
        }
      });
      if (fokus && !werte.text) gefuehrt.element.querySelector('input.gefuehrt-eintrag-feld').focus();
    }

    let ohneVorText = false;
    let naechsterText = null; // Text aus dem geführten Abschnitt (Weitertippen), solange neu gebaut wird
    function baue(id, { ohneText = false } = {}) {
      schliesseTeil();
      AQ.clear(r.flaeche);
      if (ohneText) ohneVorText = true;
      if (fuehrung && mitGefuehrt && HOOKS[id]) {
        const w = { text: vorText, schluesselwort: stand[id].wort, richtung: stand[id].richtung, ...(fuehrung.werte || {}) };
        fuehrung = { aufgabe: fuehrung.aufgabe };
        starteGefuehrt(id, w);
        return;
      }
      teil = id === 'playfair' ? bauePlayfair() : bauePolybios();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeil();
      },
      zustand() {
        const id = r.aktiv();
        const z = stand[id] || stand.polybios;
        const extra = teil ? teil.zustand() : { paar: null, regel: null };
        return {
          reiter: id,
          richtung: z.richtung,
          schluesselwort: z.wort,
          eingabe: z.liste.map((e) => e[0]).join(''),
          ausgabe: z.liste.map((e) => e[1]).join(''),
          paar: extra.paar,
          regel: extra.regel,
          gesperrt
        };
      }
    };
  }

  KRLabor.registriere('quadrat', { titel: 'Polybios & Playfair', oeffne });
})();
