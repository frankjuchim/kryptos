/* Kryptos – Labor-Werkzeug „Bit-Lupe“ (W3 §9.1, Plan M6 Task 118, E79). Die Bits sind das Objekt: Zeichen ↔ Bits
   (ASCII-Tabelle der Anlage), XOR mit antippbaren Ergebnisbits, die sich selbst erklären, Nachspiel „Bit für Bit“ und
   die Doppelnutzung eines One-Time-Pads mit Crib-Schieber (◀ ▶ statt Positionen eintippen). Zeigt nie einen Schlüssel
   und markiert nichts als „richtig“ – Eve muss urteilen.
   Rechnet nur über Krypto.*; Grundrechenarten nur für Anzeige und Indizes. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  // erfunden: HAFEN und TURME mit demselben Schlüssel (der Schlüssel steht nicht im Werkzeug)
  const BEISPIEL = { text: 'HALLO', schluessel: 'K', c1: '19 76 3C 64 3E', c2: '05 62 28 6C 35' };
  const REITER_TITEL = { zeichen: 'Zeichen ↔ Bits', xor: 'XOR', doppelnutzung: 'Doppelnutzung' };
  const MAX = 24; // Zeichen bzw. Bytes
  const CRIB_MAX = 12;
  const SCHLUESSELARTEN = [
    { id: 'text', titel: 'Text' },
    { id: 'hex', titel: 'Hex' },
    { id: 'bits', titel: 'Bits' }
  ];

  const istKryptoFehler = (e) => e && e.name === 'KryptoFehler';
  /** Anzeigeform eines Zeichens (Leerzeichen sichtbar). */
  const zeichenAnzeige = (ch) => (ch === ' ' ? '␣' : ch);
  /** Byte → druckbares Zeichen der Anlage oder · */
  function zeichenOderPunkt(b) {
    try {
      return Krypto.zeichenAusAscii(b);
    } catch (e) {
      if (!istKryptoFehler(e)) throw e;
      return '·';
    }
  }
  /** Bitfolge (Vielfaches von 8) → Bytes über Krypto.bitsZuByte. */
  function bitsZuBytes(bits) {
    const aus = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) aus.push(Krypto.bitsZuByte(bits.slice(i, i + 8)));
    return aus;
  }
  const bitsVon = (bytes) => bytes.map((b) => Krypto.byteZuBits(b)).join('');
  const vierer = (bits) => Krypto.gruppieren(bits, 4);
  /** Radiogruppe aus Knöpfen (role=radio), ←/→ wechselt. */
  function radiogruppe(liste, wert, attr, aria, beiWechsel) {
    let jetzt = wert;
    const knoepfe = liste.map((x) => h('button', { type: 'button', role: 'radio', [`data-${attr}`]: x.id }, x.titel));
    function zeige() {
      for (const kn of knoepfe) {
        const an = kn.getAttribute(`data-${attr}`) === jetzt;
        kn.setAttribute('aria-checked', String(an));
        kn.setAttribute('tabindex', an ? '0' : '-1');
      }
    }
    function setze(id, fokus) {
      jetzt = id;
      zeige();
      if (fokus) knoepfe.find((k) => k.getAttribute(`data-${attr}`) === id).focus();
      beiWechsel(id);
    }
    knoepfe.forEach((kn, i) => {
      kn.addEventListener('click', () => setze(kn.getAttribute(`data-${attr}`), false));
      kn.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        setze(liste[Krypto.mod(i + d, liste.length)].id, true);
      });
    });
    zeige();
    return { element: h('div', { class: 'labor-basis', role: 'radiogroup', 'aria-label': aria }, knoepfe), sperre: (an) => knoepfe.forEach((k) => (k.disabled = !!an)) };
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('bitlupe', v, umgebung);
    let text = typeof v.text === 'string' ? [...v.text].slice(0, MAX).join('') : BEISPIEL.text;
    let bitsEingabe = typeof v.bits === 'string' ? v.bits.slice(0, 300) : '';
    let umschalter = typeof v.bits === 'string' ? 'bits-zeichen' : 'zeichen-bits';
    let modus = v.modus === 'otp' ? 'otp' : 'wiederholung';
    let schluesselArt = 'text';
    let schluessel = typeof v.schluessel === 'string' ? v.schluessel.slice(0, 80) : BEISPIEL.schluessel;
    let c1 = BEISPIEL.c1;
    let c2 = BEISPIEL.c2;
    let crib = '';
    let cribPosition = 0;
    let nachspiel = null;
    // sichtbarer Zustand (zustand())
    let z = { bytes: [], ergebnisHex: '', cribErgebnis: '', statistik: null };

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug bitlupe-werkzeug' }, r.element);
    container.appendChild(wurzel);

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
    }

    /* ======================= Zeichen ↔ Bits ======================= */
    function baueZeichen() {
      const wahl = radiogruppe(
        [
          { id: 'zeichen-bits', titel: 'Zeichen → Bits' },
          { id: 'bits-zeichen', titel: 'Bits → Zeichen' }
        ],
        umschalter,
        'umschalter',
        'Richtung der Umwandlung',
        (x) => {
          umschalter = x;
          zeigeTeil();
        }
      );
      const teil = h('div', { class: 'bitlupe-teil' });
      r.flaeche.append(wahl.element, teil);
      function zeigeTeil() {
        AQ.clear(teil);
        if (umschalter === 'zeichen-bits') zeichenZuBits(teil);
        else bitsZuZeichen(teil);
      }
      zeigeTeil();
    }

    function zeichenZuBits(ort) {
      const feld = B.textfeld({ beschriftung: `Text (bis ${MAX} Zeichen)`, max: MAX, wert: text, art: 'frei', zeilen: 1, beiEingabe: (t) => { text = t; zeige(); } });
      const tabOrt = h('div', { class: 'bitlupe-tabelle' });
      const aus = B.ausgabe({ beschriftung: 'Bitfolge (Vierergruppen)', art: 'bits' });
      const hinweisOrt = h('div', { class: 'bitlupe-hinweis' });
      ort.append(feld.element, hinweisOrt, tabOrt, aus.element);
      function zeige() {
        const zeilen = [];
        const bytes = [];
        let fehlt = 0;
        for (const ch of [...text]) {
          try {
            const n = Krypto.ascii(ch);
            bytes.push(n);
            zeilen.push([zeichenAnzeige(ch), String(n), vierer(Krypto.byteZuBits(n)), Krypto.hex([n])]);
          } catch (e) {
            if (!istKryptoFehler(e)) throw e;
            fehlt += 1;
            zeilen.push(['·', 'kein Anlagezeichen', '–', '–']);
          }
        }
        AQ.clear(hinweisOrt);
        if (fehlt) hinweisOrt.appendChild(B.hinweis('info', 'Zeichen außerhalb der Anlage (ASCII 32–126, z. B. Umlaute) erscheinen als · und zählen nicht mit.'));
        AQ.mount(tabOrt, zeilen.length ? B.tabelle({ caption: 'Zeichen, ASCII-Wert, 8 Bit und Hex', kopf: ['Zeichen', 'ASCII dezimal', '8 Bit', 'Hex'], zeilen, klasse: 'bit-tabelle' }) : h('p', { class: 'text-2' }, 'Gib oben einen Text ein.'));
        aus.setze(bitsVon(bytes));
        z = { bytes, ergebnisHex: bytes.length ? Krypto.hex(bytes) : '', cribErgebnis: '', statistik: null };
      }
      zeige();
    }

    function bitsZuZeichen(ort) {
      const feld = B.textfeld({ beschriftung: 'Bitfolge (8 Bit je Zeichen, Leerzeichen erlaubt)', max: 300, wert: bitsEingabe, art: 'bits', zeilen: 2, platzhalter: 'z. B. 0100 1000 0100 1001', beiEingabe: (t) => { bitsEingabe = t; zeige(); } });
      const hinweisOrt = h('div', { class: 'bitlupe-hinweis' });
      const tabOrt = h('div', { class: 'bitlupe-tabelle' });
      const aus = B.ausgabe({ beschriftung: 'Zeichen', art: 'frei' });
      ort.append(feld.element, hinweisOrt, aus.element, tabOrt);
      function zeige() {
        AQ.clear(hinweisOrt);
        const bits = Krypto.normBits(bitsEingabe);
        if (/[^01]/.test(bits)) {
          hinweisOrt.appendChild(B.hinweis('warnung', 'Eine Bitfolge besteht nur aus 0 und 1.'));
          aus.setze('');
          AQ.clear(tabOrt);
          z = { bytes: [], ergebnisHex: '', cribErgebnis: '', statistik: null };
          return;
        }
        const bytes = bitsZuBytes(bits);
        const rest = bits.length - 8 * bytes.length;
        if (rest) hinweisOrt.appendChild(B.hinweis('info', `Noch ${8 - rest} ${8 - rest === 1 ? 'Bit' : 'Bits'} bis zum nächsten vollen Byte – ${rest} ${rest === 1 ? 'Bit wird' : 'Bits werden'} noch nicht gelesen.`));
        let zeichen;
        try {
          zeichen = bytes.length ? Krypto.bitsZuText(bitsVon(bytes)) : '';
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          zeichen = bytes.map(zeichenOderPunkt).join('');
          hinweisOrt.appendChild(B.hinweis('info', 'Bytes außerhalb der Anlage (ASCII 32–126) erscheinen als ·.'));
        }
        aus.setze(zeichen);
        const zeilen = bytes.map((b) => {
          const ch = zeichenOderPunkt(b);
          return [ch === '·' ? '·' : zeichenAnzeige(ch), ch === '·' ? `${b} – kein Anlagezeichen` : String(b), vierer(Krypto.byteZuBits(b)), Krypto.hex([b])];
        });
        AQ.mount(tabOrt, zeilen.length ? B.tabelle({ caption: 'Bytes der Bitfolge', kopf: ['Zeichen', 'ASCII dezimal', '8 Bit', 'Hex'], zeilen, klasse: 'bit-tabelle' }) : h('p', { class: 'text-2' }, 'Gib oben Bits ein – je 8 Bits ergeben ein Zeichen.'));
        z = { bytes, ergebnisHex: bytes.length ? Krypto.hex(bytes) : '', cribErgebnis: '', statistik: null };
      }
      zeige();
    }

    /* ======================= XOR ======================= */
    function baueXor() {
      const feld = B.textfeld({ beschriftung: `Text (bis ${MAX} Zeichen)`, max: MAX, wert: text, art: 'frei', zeilen: 1, beiEingabe: (t) => { text = t; rechne(); } });
      const artWahl = radiogruppe(SCHLUESSELARTEN, schluesselArt, 'schluesselart', 'Schlüssel eingeben als', (neu) => {
        // Schlüssel in die neue Schreibweise umrechnen (über die Bibliothek); ungültig → leer
        const bytes = schluesselBytes();
        schluesselArt = neu;
        schluessel = bytes ? schreibe(bytes) : '';
        sFeld.value = schluessel;
        rechne();
      });
      const modusWahl = radiogruppe(
        [
          { id: 'otp', titel: 'One-Time-Pad' },
          { id: 'wiederholung', titel: 'Schlüssel wiederholen' }
        ],
        modus,
        'modus',
        'Schlüsselverwendung',
        (x) => {
          modus = x;
          rechne();
        }
      );
      const sId = B.neueId('bitlupe-schluessel');
      const sFeld = h('input', { type: 'text', id: sId, class: 'xor-schluessel', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off' });
      sFeld.value = schluessel;
      sFeld.addEventListener('input', () => {
        schluessel = sFeld.value.slice(0, 300);
        rechne();
      });
      const hinweisOrt = h('div', { class: 'bitlupe-hinweis' });
      const bitsOrt = h('div', { class: 'xor-bloecke' });
      const erklaerung = h('p', { class: 'bit-erklaerung', 'aria-live': 'polite' }, 'Tippe ein Ergebnisbit an – dann erklärt es sich.');
      const aus = B.ausgabe({ beschriftung: 'Ergebnis (Hex)', art: 'hex' });
      const nsOrt = h('div', { class: 'xor-nachspiel' });
      r.flaeche.append(
        feld.element,
        h('div', { class: 'labor-steuer' }, h('div', { class: 'labor-textfeld xor-schluesselfeld' }, h('label', { for: sId }, 'Schlüssel'), sFeld), artWahl.element),
        modusWahl.element,
        hinweisOrt,
        bitsOrt,
        erklaerung,
        aus.element,
        nsOrt
      );

      function schreibe(bytes) {
        if (schluesselArt === 'hex') return Krypto.gruppieren(Krypto.hex(bytes), 2);
        if (schluesselArt === 'bits') return vierer(bitsVon(bytes));
        try {
          return Krypto.bytesZuText(bytes);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          return '';
        }
      }
      /** Schlüsselbytes je Eingabeart oder null (Meldung in fehlerText). */
      let fehlerText = '';
      function schluesselBytes() {
        fehlerText = '';
        try {
          if (schluesselArt === 'hex') return Krypto.vonHex(schluessel);
          if (schluesselArt === 'bits') {
            const b = Krypto.normBits(schluessel);
            if (/[^01]/.test(b)) throw new Krypto.KryptoFehler('Eine Bitfolge besteht nur aus 0 und 1.');
            if (b.length < 8 || b.length !== 8 * bitsZuBytes(b).length) throw new Krypto.KryptoFehler('Schlüsselbits: ein Vielfaches von 8 (ganze Bytes).');
            return bitsZuBytes(b);
          }
          return Krypto.textZuBytes(schluessel);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          fehlerText = e.message;
          return null;
        }
      }

      let gewaehlt = null;
      let daten = null; // { t, s, e } Bitfolgen
      function zeigeBits(markiert) {
        AQ.clear(bitsOrt);
        if (!daten) return;
        const n = daten.e.length;
        let byteRahmen = null;
        for (let i = 0; i < n; i += 4) {
          const teil = (x) => x.slice(i, i + 4);
          const byteNr = Math.floor(i / 8);
          const m = Number.isInteger(markiert) && markiert >= i && markiert < i + 4 ? [markiert - i] : [];
          const blk = KRB.bits({
            titel: `Byte ${byteNr + 1}, Bits ${i + 1} bis ${i + 4}`,
            gruppe: 4,
            waehlbar: true,
            start: i,
            gesamt: n,
            gewaehlt: gewaehlt,
            markiert: m,
            beiWahl: erklaere,
            zeilen: [{ label: 'Text', bits: teil(daten.t) }, { label: 'Schlüssel', bits: teil(daten.s) }, { trenner: '⊕' }, { label: 'Ergebnis', bits: teil(daten.e), ergebnis: true }]
          });
          // je Byte ein Rahmen „Byte 1: H ⊕ Q“ mit zwei Vierergruppen (brechen auf dem Handy untereinander um)
          if (Krypto.mod(i, 8) === 0) {
            const sByte = Krypto.bitsZuByte(daten.s.slice(i, i + 8));
            const sZeichen = zeichenOderPunkt(sByte);
            byteRahmen = h('div', { class: 'xor-vierer' });
            bitsOrt.appendChild(h('figure', { class: 'xor-byte' }, h('figcaption', null, `Byte ${byteNr + 1}: ${zeichenAnzeige(daten.zeichen[byteNr])} ⊕ ${sZeichen === '·' ? Krypto.hex([sByte]) : zeichenAnzeige(sZeichen)}`), byteRahmen));
          }
          byteRahmen.appendChild(h('div', { class: 'xor-block' }, blk));
        }
        const knoepfe = [...bitsOrt.querySelectorAll('button.ergebnisbit')];
        const aktiv = Number.isInteger(gewaehlt) ? gewaehlt : 0;
        knoepfe.forEach((kn, i) => kn.setAttribute('tabindex', i === aktiv ? '0' : '-1'));
      }
      // ein Tabstopp für alle Ergebnisbits; ← / → springen auch zum Nachbarblock
      bitsOrt.addEventListener('focusin', (e) => {
        const kn = e.target;
        if (!kn.classList || !kn.classList.contains('ergebnisbit')) return;
        for (const x of bitsOrt.querySelectorAll('button.ergebnisbit')) x.setAttribute('tabindex', x === kn ? '0' : '-1');
      });
      bitsOrt.addEventListener('keydown', (e) => {
        const kn = e.target;
        if (e.defaultPrevented || !kn.classList || !kn.classList.contains('ergebnisbit')) return;
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        const ziel = bitsOrt.querySelector(`button.ergebnisbit[data-index="${Number(kn.dataset.index) + d}"]`);
        if (!ziel) return;
        e.preventDefault();
        ziel.focus();
      });
      function erklaere(i) {
        gewaehlt = i;
        const [t, s, e] = [daten.t[i], daten.s[i], daten.e[i]];
        erklaerung.textContent = `Bit ${i + 1}: ${t} ⊕ ${s} – ${t === s ? 'gleich' : 'verschieden'} → ${e}`;
        for (const kn of bitsOrt.querySelectorAll('button.ergebnisbit')) kn.setAttribute('aria-pressed', String(Number(kn.dataset.index) === i));
      }

      function sperre(an) {
        feld.sperre(an);
        sFeld.disabled = !!an;
        artWahl.sperre(an);
        modusWahl.sperre(an);
      }

      function rechne() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(nsOrt);
        daten = null;
        gewaehlt = null;
        erklaerung.textContent = 'Tippe ein Ergebnisbit an – dann erklärt es sich.';
        z = { bytes: [], ergebnisHex: '', cribErgebnis: '', statistik: null };
        aus.setze('');
        let textBytes;
        try {
          textBytes = Krypto.textZuBytes(text);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          hinweisOrt.appendChild(B.hinweis('warnung', 'Im Text sind nur Zeichen der Anlage erlaubt (ASCII 32–126, keine Umlaute).'));
          zeigeBits();
          return;
        }
        const sBytes = schluesselBytes();
        if (!textBytes.length || !sBytes || !sBytes.length) {
          if (fehlerText && schluessel) hinweisOrt.appendChild(B.hinweis('warnung', fehlerText));
          zeigeBits();
          return;
        }
        if (modus === 'otp' && sBytes.length !== textBytes.length) {
          hinweisOrt.appendChild(B.hinweis('warnung', `Beim One-Time-Pad muss der Schlüssel so lang wie der Text sein: ${sBytes.length} statt ${textBytes.length} Byte.`));
          zeigeBits();
          return;
        }
        if (modus === 'wiederholung') hinweisOrt.appendChild(B.hinweis('info', 'Der Schlüssel wird wiederholt – das ist kein One-Time-Pad.'));
        const strom = textBytes.map((_, i) => sBytes[Krypto.mod(i, sBytes.length)]);
        const t = bitsVon(textBytes);
        const s = bitsVon(strom);
        const e = Krypto.xorBits(t, s);
        const ergebnisHex = Krypto.xor(textBytes, sBytes);
        daten = { t, s, e, zeichen: [...text] };
        z = { bytes: Krypto.vonHex(ergebnisHex), ergebnisHex, cribErgebnis: '', statistik: null };
        aus.setze(Krypto.gruppieren(ergebnisHex, 2));
        zeigeBits();
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Bit für Bit',
          start: -1,
          schritte: [...e].map((x, i) => ({ text: `Bit ${i + 1}: ${t[i]} ⊕ ${s[i]} = ${x} (${t[i] === s[i] ? 'gleich' : 'verschieden'})`, daten: { i } })),
          zeige(schritt) {
            zeigeBits(schritt.daten.i);
          },
          beiLauf: sperre
        });
      }
      rechne();
    }

    /* ======================= Doppelnutzung ======================= */
    function baueDoppel() {
      const hexFeld = (klasse, titel, wert, setze) => {
        const id = B.neueId(klasse);
        const f = h('input', { type: 'text', id, class: klasse, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
        f.value = wert;
        f.addEventListener('input', () => {
          setze(f.value.slice(0, 3 * MAX));
          rechne();
        });
        return { element: h('div', { class: 'labor-textfeld' }, h('label', { for: id }, titel), f), feld: f };
      };
      const f1 = hexFeld('doppel-c1', 'Geheimtext C1 (Hex)', c1, (x) => (c1 = x));
      const f2 = hexFeld('doppel-c2', 'Geheimtext C2 (Hex)', c2, (x) => (c2 = x));
      const hinweisOrt = h('div', { class: 'bitlupe-hinweis' });
      const tabOrt = h('div', { class: 'doppel-ort' });
      const statistik = h('p', { class: 'doppel-statistik', 'aria-live': 'polite' });
      const cribId = B.neueId('crib');
      const cribFeld = h('input', { type: 'text', id: cribId, class: 'crib', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
      cribFeld.value = crib;
      const links = h('button', { type: 'button', class: 'knopf knopf-leise crib-links', 'aria-label': 'Crib eine Position nach links' }, '◀');
      const rechts = h('button', { type: 'button', class: 'knopf knopf-leise crib-rechts', 'aria-label': 'Crib eine Position nach rechts' }, '▶');
      const schieber = h('div', { class: 'crib-schieber', role: 'slider', tabindex: '0', 'aria-label': 'Position des Cribs (← →)', 'aria-valuemin': '0' });
      const cribAus = h('p', { class: 'crib-ergebnis', 'aria-live': 'polite' });
      r.flaeche.append(
        h('div', { class: 'labor-steuer doppel-eingaben' }, f1.element, f2.element),
        hinweisOrt,
        tabOrt,
        statistik,
        h('div', { class: 'crib-bereich' }, h('div', { class: 'labor-textfeld' }, h('label', { for: cribId }, `Crib – vermutetes Wort (bis ${CRIB_MAX} Zeichen)`), cribFeld), h('div', { class: 'crib-steuer' }, links, schieber, rechts)),
        cribAus,
        h('p', { class: 'text-2' }, 'Schiebe den Crib über alle Positionen. Ergibt sich lesbarer Text? Das entscheidest du – das Werkzeug markiert nichts als richtig.')
      );
      cribFeld.addEventListener('input', () => {
        crib = [...cribFeld.value].slice(0, CRIB_MAX).join('');
        rechne();
      });
      const schiebe = (d) => {
        cribPosition += d;
        rechne();
      };
      links.addEventListener('click', () => schiebe(-1));
      rechts.addEventListener('click', () => schiebe(1));
      schieber.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        if (e.key === 'Home' || e.key === 'End') {
          e.preventDefault();
          cribPosition = e.key === 'Home' ? 0 : Number.MAX_SAFE_INTEGER;
          rechne();
          return;
        }
        if (!d) return;
        e.preventDefault();
        schiebe(d);
      });

      function rechne() {
        AQ.clear(hinweisOrt);
        let b1;
        let b2;
        try {
          b1 = Krypto.vonHex(c1);
          b2 = Krypto.vonHex(c2);
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          hinweisOrt.appendChild(B.hinweis('warnung', 'C1 und C2 als Hex eingeben: Paare aus 0–9 und A–F, z. B. 3C 64.'));
          AQ.clear(tabOrt);
          statistik.textContent = '';
          cribAus.textContent = '';
          z = { bytes: [], ergebnisHex: '', cribErgebnis: '', statistik: null };
          return;
        }
        const n = Math.min(b1.length, b2.length, MAX);
        if (b1.length !== b2.length) hinweisOrt.appendChild(B.hinweis('info', `C1 und C2 sind verschieden lang – verglichen werden die ersten ${n} Bytes.`));
        const ergebnisHex = n ? Krypto.xor(b1.slice(0, n), b2.slice(0, n)) : '';
        const bytes = n ? Krypto.vonHex(ergebnisHex) : [];
        const bitsListe = bytes.map((b) => Krypto.byteZuBits(b));
        const nullen = bitsListe.filter((x) => x.startsWith('000')).length;
        statistik.textContent = n ? `${nullen} von ${n} Bytes beginnen mit 000 – so sieht Buchstabe ⊕ Buchstabe aus.` : '';
        // Crib an der Position
        const cribZeichen = [...crib];
        let cribBytes = [];
        let cribOk = true;
        try {
          cribBytes = crib ? Krypto.textZuBytes(crib) : [];
        } catch (e) {
          if (!istKryptoFehler(e)) throw e;
          cribOk = false;
          hinweisOrt.appendChild(B.hinweis('warnung', 'Der Crib darf nur Zeichen der Anlage enthalten (ASCII 32–126, keine Umlaute).'));
        }
        const L = cribOk ? cribBytes.length : 0;
        // der Crib darf über das Ende hinausragen (alle Positionen 0 … n − 1); gerechnet wird der überlappende Teil
        const maxPos = Math.max(0, n - 1);
        cribPosition = Math.max(0, Math.min(maxPos, cribPosition));
        const ueberlapp = Math.min(L, n - cribPosition);
        let ergebnis = [];
        if (L && ueberlapp > 0) ergebnis = Krypto.vonHex(Krypto.xor(bytes.slice(cribPosition, cribPosition + ueberlapp), cribBytes.slice(0, ueberlapp))).map(zeichenOderPunkt);
        if (L && ueberlapp < L) hinweisOrt.appendChild(B.hinweis('info', `Der Crib ragt über das Ende hinaus – nur ${ueberlapp} von ${L} Zeichen liegen über C1 ⊕ C2.`));
        const cribErgebnis = ergebnis.join('');
        links.disabled = !L || cribPosition <= 0;
        rechts.disabled = !L || cribPosition >= maxPos;
        schieber.setAttribute('aria-valuemax', String(maxPos));
        schieber.setAttribute('aria-valuenow', String(cribPosition));
        schieber.setAttribute('aria-valuetext', `Position ${cribPosition}`);
        schieber.textContent = L ? `Position ${cribPosition} von 0 … ${maxPos}` : 'Position –';
        cribAus.textContent = cribErgebnis ? `An Position ${cribPosition}: (C1 ⊕ C2) ⊕ „${crib}“ = ${cribErgebnis} – ist das lesbar?` : L ? '' : 'Gib einen Crib ein, z. B. ein Wort, das im Klartext vorkommen könnte.';

        // Tabelle: Positionen, Hex, Bits, Deutung, Crib, Ergebnis
        const imCrib = (i) => ergebnis.length > 0 && i >= cribPosition && i < cribPosition + ueberlapp;
        const zelle = (i, inhalt, extra = '') => {
          const kl = [bitsListe[i] === '00000000' ? 'gleich' : bitsListe[i].startsWith('000') ? 'buchstabe' : '', imCrib(i) ? 'crib-feld' : '', extra].filter(Boolean).join(' ');
          return h('td', { class: kl || null }, inhalt);
        };
        const deutung = (i) => (bitsListe[i] === '00000000' ? '=' : bitsListe[i].startsWith('000') ? '·' : '');
        const tabelle = h(
          'table',
          { class: 'doppel-tabelle' },
          h('caption', null, 'C1 ⊕ C2 Byte für Byte'),
          h('thead', null, h('tr', null, h('th', { scope: 'row' }, 'Position'), bytes.map((_, i) => h('th', { scope: 'col' }, String(i))))),
          h(
            'tbody',
            null,
            h('tr', null, h('th', { scope: 'row' }, 'Hex'), bytes.map((b, i) => zelle(i, Krypto.hex([b])))),
            h('tr', { class: 'doppel-bits' }, h('th', { scope: 'row' }, 'Bits'), bitsListe.map((x, i) => zelle(i, vierer(x)))),
            h('tr', null, h('th', { scope: 'row' }, 'Deutung'), bytes.map((_, i) => zelle(i, deutung(i)))),
            h('tr', { class: 'doppel-crib' }, h('th', { scope: 'row' }, 'Crib'), bytes.map((_, i) => zelle(i, imCrib(i) ? zeichenAnzeige(cribZeichen[i - cribPosition]) : ''))),
            h('tr', { class: 'doppel-cribergebnis' }, h('th', { scope: 'row' }, '(C1 ⊕ C2) ⊕ Crib'), bytes.map((_, i) => zelle(i, imCrib(i) ? zeichenAnzeige(ergebnis[i - cribPosition]) : '', imCrib(i) && ergebnis[i - cribPosition] === '·' ? 'unlesbar' : '')))
          )
        );
        AQ.mount(tabOrt, n ? h('div', { class: 'doppel-tabelle-rahmen' }, h('div', { class: 'scroll-x' }, tabelle), h('p', { class: 'doppel-legende text-2' }, 'Deutung: = gleiche Zeichen (0000 0000, grün hinterlegt) · · Buchstabe ⊕ Buchstabe (beginnt mit 000, grau hinterlegt)')) : h('p', { class: 'text-2' }, 'Gib zwei Geheimtexte als Hex ein.'));
        z = { bytes, ergebnisHex, cribErgebnis, statistik: n ? { beginnen000: nullen, von: n } : null };
      }
      rechne();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'zeichen') baueZeichen();
      else if (id === 'xor') baueXor();
      else if (id === 'doppelnutzung') baueDoppel();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: r.aktiv(), umschalter, modus, bytes: z.bytes, ergebnisHex: z.ergebnisHex, cribPosition, cribErgebnis: z.cribErgebnis, statistik: z.statistik };
      }
    };
  }

  KRLabor.registriere('bitlupe', { titel: 'Bit-Lupe', oeffne });
})();
