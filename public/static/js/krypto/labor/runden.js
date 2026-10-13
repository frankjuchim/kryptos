/* Kryptos – Labor-Werkzeug „Runden-Labor“ (W3 §9.2, §6, Plan M6 Tasks 119/120, E83). Die 4 × 4-Bitmatrizen sind die
   Objekte: KRYPTOS-16 (auch „ohne S-Box“) und RM-16 Runde für Runde, Schritt für Schritt aufdecken; ein Bit antippen
   kippt es (Lawine, zwei Läufe nebeneinander) bzw. verfolgt seinen Weg durch die Runden.
   Rechnet nur über Krypto.*; Indexarithmetik nur für Zeilen/Spalten der Matrizen. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  // Standard = Testvektor des Lernverfahrens (W3 §0a), kein Lab-Wert
  const BEISPIEL = { block: 'OK', schluessel: 'A36D' };
  const REITER_TITEL = { runden: 'Runde für Runde', lawine: 'Lawine', verfolgung: 'Bit-Verfolgung', modi: 'ECB vs. CBC', fehler: 'Fehler einbauen', enigma: 'Mini-Enigma' };
  const GEBAUT = ['runden', 'lawine', 'verfolgung'];
  const VARIANTEN = [
    { id: 'kryptos16', titel: 'KRYPTOS-16' },
    { id: 'ohneSBox', titel: 'ohne S-Box' },
    { id: 'rm16', titel: 'RM-16' }
  ];
  const MITTE_TITEL = { kryptos16: 'nach S-Box', ohneSBox: 'S-Box ausgelassen', rm16: 'nach Zeilenrotation' };
  // Mittelwerte aus W3 §0a.8 (Info neben dem Zähler, keine Rechnung im Werkzeug)
  const LAWINE_MITTEL = ['16,4 %', '43,1 %', '48,2 %', '49,4 %'];
  const HEX4 = /^[0-9A-Fa-f]{4}$/;

  /** Bitnummer 1 … 16 (b1 = höchstwertig, zeilenweise) ↔ Zeile/Spalte ab 1 – reine Indexarithmetik der Matrix. */
  const POSITION = [];
  for (let z = 1; z <= 4; z++) for (let s = 1; s <= 4; s++) POSITION.push({ bit: 4 * (z - 1) + s, z, s });
  const ortVon = (bit) => POSITION[bit - 1];

  const istKryptoFehler = (e) => e && e.name === 'KryptoFehler';
  const bits16 = (n) => Krypto.byteZuBits(n, 16);
  const vonBits = (b) => Krypto.bitsZuByte(b);
  const einsen = (bits) => [...bits].filter((c) => c === '1').length;
  /** Maske mit Einsen an den Bitnummern der Menge (für Krypto.xorBits). */
  const maske = (menge) => POSITION.map((p) => (menge.has(p.bit) ? '1' : '0')).join('');

  /** Block: 2 Zeichen (ASCII der Anlage) oder 4 Hexziffern → 16-Bit-Zahl; sonst KryptoFehler. */
  function leseBlock(eingabe) {
    const t = String(eingabe ?? '').trim();
    if (HEX4.test(t) && [...t].length === 4) return vonBits(Krypto.vonHex(t).map((b) => Krypto.byteZuBits(b)).join(''));
    if ([...t].length === 2) return vonBits(Krypto.textZuBytes(t).map((b) => Krypto.byteZuBits(b)).join(''));
    throw new Krypto.KryptoFehler('Klartextblock: 2 Zeichen (z. B. OK) oder 4 Hexziffern (z. B. 4F4B).');
  }
  function leseSchluessel(eingabe) {
    const t = String(eingabe ?? '').replace(/\s+/g, '');
    if (HEX4.test(t)) return vonBits(Krypto.vonHex(t).map((b) => Krypto.byteZuBits(b)).join(''));
    if (/^[01]{16}$/.test(t)) return vonBits(t);
    throw new Krypto.KryptoFehler('Schlüssel: 4 Hexziffern (16 Bit), z. B. A36D.');
  }

  /** Protokoll je Variante: { ergebnis, runden: [{ runde, eingang, schluessel, nachXor, mitte, nachTransposition }] } */
  function protokoll(block, schluessel, runden, variante) {
    if (variante === 'rm16') {
      const p = Krypto.rm16.verschluesseln(block, schluessel, { runden, protokoll: true });
      return { ergebnis: p.ergebnis, runden: p.runden.map((r) => ({ ...r, mitte: r.nachRotation })) };
    }
    const p = Krypto.kryptos16.verschluesseln(block, schluessel, { runden, protokoll: true, sbox: variante === 'kryptos16' });
    return { ergebnis: p.ergebnis, runden: p.runden.map((r) => ({ ...r, mitte: r.nachSBox })) };
  }

  /**
   * 4 × 4-Bitmatrix als echte Tabelle (caption mit Titel und Hex). o = { titel, klasse, zelle(bit) → Klassen,
   * knopf: { beiKlick(bit), gedrueckt(bit), gesperrt }, verdeckt }. Bits als Knöpfe: Pfeiltasten wandern (Roving).
   */
  function bitmatrix(wert, o = {}) {
    const b = bits16(wert);
    const knoepfe = [];
    const zeilen = [1, 2, 3, 4].map((z) =>
      h(
        'tr',
        null,
        POSITION.filter((p) => p.z === z).map((p) => {
          const v = o.verdeckt ? '?' : b[p.bit - 1];
          const kl = typeof o.zelle === 'function' && !o.verdeckt ? o.zelle(p.bit) : '';
          if (!o.knopf) return h('td', { class: kl || null }, v);
          const an = typeof o.knopf.gedrueckt === 'function' && o.knopf.gedrueckt(p.bit);
          const kn = h('button', { type: 'button', class: `bit${kl ? ' ' + kl : ''}`, 'data-bit': String(p.bit), 'aria-pressed': String(!!an), tabindex: p.bit === 1 ? '0' : '-1', disabled: !!o.knopf.gesperrt, 'aria-label': `Bit ${p.bit} (Zeile ${p.z}, Spalte ${p.s}): ${v}` }, v);
          if (!o.knopf.gesperrt) kn.addEventListener('click', () => o.knopf.beiKlick(p.bit));
          knoepfe.push(kn);
          return h('td', { class: kl || null }, kn);
        })
      )
    );
    const tabelle = h('table', { class: `bitgitter ${o.klasse || 'bitmatrix'}${o.verdeckt ? ' verdeckt' : ''}` }, h('caption', null, o.titel || '', h('span', { class: 'bitgitter-hex' }, o.verdeckt ? '= ?' : `= ${Krypto.hex(wert)}`)), h('tbody', null, zeilen));
    if (knoepfe.length && !o.knopf.gesperrt) {
      tabelle.addEventListener('keydown', (e) => {
        const t = e.target;
        if (!t.dataset || !t.dataset.bit) return;
        const p = Number(t.dataset.bit);
        const ort = ortVon(p);
        const ziel = { ArrowRight: ort.s < 4 ? p + 1 : null, ArrowLeft: ort.s > 1 ? p - 1 : null, ArrowDown: ort.z < 4 ? p + 4 : null, ArrowUp: ort.z > 1 ? p - 4 : null, Home: 1, End: 16 }[e.key];
        if (ziel === undefined) return;
        e.preventDefault();
        if (ziel === null) return;
        for (const k of knoepfe) k.setAttribute('tabindex', Number(k.dataset.bit) === ziel ? '0' : '-1');
        knoepfe[ziel - 1].focus();
      });
    }
    return tabelle;
  }

  /** Radiogruppe (role=radio, ←/→). */
  function radiogruppe(liste, wert, attr, aria, klasse, beiWechsel) {
    let jetzt = wert;
    const knoepfe = liste.map((x) => h('button', { type: 'button', role: 'radio', [`data-${attr}`]: x.id }, x.titel));
    const zeige = () => {
      for (const kn of knoepfe) {
        const an = kn.getAttribute(`data-${attr}`) === jetzt;
        kn.setAttribute('aria-checked', String(an));
        kn.setAttribute('tabindex', an ? '0' : '-1');
      }
    };
    const setze = (id, fokus) => {
      jetzt = id;
      zeige();
      if (fokus) knoepfe.find((k) => k.getAttribute(`data-${attr}`) === id).focus();
      beiWechsel(id);
    };
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
    return { element: h('div', { class: `labor-basis ${klasse}`, role: 'radiogroup', 'aria-label': aria }, knoepfe), sperre: (an) => knoepfe.forEach((k) => (k.disabled = !!an)) };
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('runden', v, umgebung).filter((r) => GEBAUT.includes(r));
    if (!reiterListe.length) reiterListe.push('runden');
    let variante = VARIANTEN.some((x) => x.id === v.variante) ? v.variante : 'kryptos16';
    let blockEingabe = typeof v.block === 'string' ? v.block.slice(0, 16) : BEISPIEL.block;
    let schluesselEingabe = typeof v.schluessel === 'string' ? v.schluessel.slice(0, 20) : BEISPIEL.schluessel;
    let runden = Number.isInteger(v.runden) && v.runden >= 1 && v.runden <= 4 ? v.runden : variante === 'rm16' ? 3 : 4;
    let block = null;
    let schluessel = null;
    let p = null; // Protokoll
    let nachspiel = null;
    let schrittweise = false;
    const gekippt = { klartext: new Set(), schluessel: new Set() };
    let verfolgt = null; // Bitnummer
    let zaehler = [];
    let weg = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h(
      'div',
      { class: 'labor-werkzeug runden-werkzeug' },
      umgebung && umgebung.rolle === 'lehrkraft'
        ? h('p', { class: 'runden-lehrkraft text-2', role: 'note' }, 'Hinweis für Lehrkräfte: Mit „RM-16“ rechnet das Runden-Labor die Teilaufgaben b) und d) des Papier-Bosses W3 vor. Sperren Sie das Runden-Labor in der Papier-Boss-Stunde über die Werkzeug-Freigaben des Kurses.')
        : null,
      r.element
    );
    container.appendChild(wurzel);

    function rechne() {
      block = null;
      schluessel = null;
      p = null;
      const fehler = [];
      try {
        block = leseBlock(blockEingabe);
      } catch (e) {
        if (!istKryptoFehler(e)) throw e;
        fehler.push(e.message);
      }
      try {
        schluessel = leseSchluessel(schluesselEingabe);
      } catch (e) {
        if (!istKryptoFehler(e)) throw e;
        fehler.push(e.message);
      }
      if (block !== null && schluessel !== null) p = protokoll(block, schluessel, runden, variante);
      return fehler;
    }

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
    }

    /** Gemeinsame Steuerung (Block, Schlüssel, Runden, Variante); beiAenderung baut nur den Inhalt neu. */
    function steuerung(beiAenderung) {
      const feld = (klasse, titel, wert, setze) => {
        const id = B.neueId(klasse);
        const f = h('input', { type: 'text', id, class: klasse, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
        f.value = wert;
        f.addEventListener('input', () => {
          setze(f.value.slice(0, 20));
          aktualisiere();
        });
        return { element: h('div', { class: 'labor-textfeld runden-feld' }, h('label', { for: id }, titel), f), f };
      };
      const fb = feld('runden-block', 'Klartextblock (2 Zeichen oder 4 Hex)', blockEingabe, (x) => (blockEingabe = x));
      const fk = feld('runden-schluessel', 'Schlüssel K (4 Hex)', schluesselEingabe, (x) => (schluesselEingabe = x));
      const zahl = B.zahl({ beschriftung: 'Runden R', min: 1, max: 4, wert: runden, beiWechsel: (n) => { runden = n; aktualisiere(); } });
      const wahl = radiogruppe(VARIANTEN, variante, 'variante', 'Variante', 'runden-variante', (x) => {
        variante = x;
        if (x === 'rm16') {
          runden = 3;
          zahl.setze(3);
        }
        aktualisiere();
      });
      const hinweisOrt = h('div', { class: 'runden-hinweis' });
      const ergebnis = h('p', { class: 'runden-ergebnis', 'aria-live': 'polite' });
      const element = h('div', { class: 'runden-steuerung' }, h('div', { class: 'labor-steuer' }, fb.element, fk.element, zahl.element), wahl.element, hinweisOrt, ergebnis);
      function aktualisiere() {
        const fehler = rechne();
        AQ.clear(hinweisOrt);
        for (const f of fehler) hinweisOrt.appendChild(B.hinweis('warnung', f));
        if (variante === 'rm16' && p) hinweisOrt.appendChild(B.hinweis('info', 'RM-16: Zeilenrotation statt S-Box – Zeile z wird um z − 1 Stellen nach links rotiert (W3 §6).'));
        if (variante === 'ohneSBox' && p) hinweisOrt.appendChild(B.hinweis('info', 'Ohne S-Box ist jede Runde linear: XOR und Transposition – gut zu sehen, aber leicht zu brechen.'));
        ergebnis.textContent = p ? `Geheimtextblock nach ${runden} ${runden === 1 ? 'Runde' : 'Runden'}: ${Krypto.hex(p.ergebnis)} = ${Krypto.gruppieren(bits16(p.ergebnis), 4)}` : '';
        beiAenderung();
      }
      return {
        element,
        aktualisiere,
        sperre(an) {
          fb.f.disabled = !!an;
          fk.f.disabled = !!an;
          zahl.sperre(an);
          wahl.sperre(an);
        }
      };
    }

    /* ======================= Runde für Runde ======================= */
    function baueRunden() {
      const inhalt = h('div', { class: 'runden-inhalt' });
      const nsOrt = h('div', { class: 'runden-nachspiel' });
      const schalterId = B.neueId('schrittweise');
      const schalter = h('input', { type: 'checkbox', id: schalterId, class: 'schrittweise' });
      schalter.checked = schrittweise;
      const st = steuerung(() => {
        zeigeNachspiel();
      });
      schalter.addEventListener('change', () => {
        schrittweise = schalter.checked;
        zeigeNachspiel();
      });
      r.flaeche.append(st.element, h('label', { class: 'runden-schalter', for: schalterId }, schalter, 'Schritt für Schritt aufdecken'), nsOrt, inhalt);

      /** Reihenfolge der aufdeckbaren Matrizen: Runde 1 Eingang, dann je Runde XOR, Mitte, Transposition. */
      function folge() {
        const f = [];
        p.runden.forEach((rd) => {
          if (rd.runde === 1) f.push({ runde: 1, art: 'eingang' });
          f.push({ runde: rd.runde, art: 'nachXor' }, { runde: rd.runde, art: 'mitte' }, { runde: rd.runde, art: 'nachTransposition' });
        });
        return f;
      }
      function zeigeRunden(sichtbar) {
        AQ.clear(inhalt);
        if (!p) return;
        const f = folge();
        const offen = new Set(f.slice(0, sichtbar === undefined ? f.length : sichtbar + 1).map((x) => `${x.runde}-${x.art}`));
        const istOffen = (runde, art) => (art === 'eingang' && runde > 1 ? offen.has(`${runde - 1}-nachTransposition`) : offen.has(`${runde}-${art}`));
        for (const rd of p.runden) {
          const fig = (art, titel) => h('figure', { class: 'runde-schritt' }, bitmatrix(rd[art], { titel, verdeckt: !istOffen(rd.runde, art) }));
          inhalt.appendChild(
            h(
              'section',
              { class: 'runde', 'aria-label': `Runde ${rd.runde}` },
              h('h3', null, `Runde ${rd.runde}`),
              h(
                'div',
                { class: 'runde-matrizen' },
                fig('eingang', 'Eingang'),
                h('figure', { class: 'runde-schritt runde-schluessel' }, bitmatrix(rd.schluessel, { titel: `Rundenschlüssel K${rd.runde}`, klasse: 'schluesselmatrix' })),
                fig('nachXor', `nach XOR mit K${rd.runde}`),
                fig('mitte', MITTE_TITEL[variante]),
                fig('nachTransposition', 'nach Transposition')
              )
            )
          );
        }
      }
      function zeigeNachspiel() {
        schliesseTeile();
        AQ.clear(nsOrt);
        if (!p || !schrittweise) {
          zeigeRunden();
          return;
        }
        const texte = { eingang: (rd) => `Runde ${rd.runde}: Eingang ${Krypto.hex(rd.eingang)}`, nachXor: (rd) => `Runde ${rd.runde}: XOR mit K${rd.runde} = ${Krypto.hex(rd.schluessel)} → ${Krypto.hex(rd.nachXor)}`, mitte: (rd) => (variante === 'kryptos16' ? `Runde ${rd.runde}: S-Box auf jede Zeile → ${Krypto.hex(rd.mitte)}` : variante === 'rm16' ? `Runde ${rd.runde}: Zeilenrotation → ${Krypto.hex(rd.mitte)}` : `Runde ${rd.runde}: S-Box ausgelassen → ${Krypto.hex(rd.mitte)}`), nachTransposition: (rd) => `Runde ${rd.runde}: Transposition (Zeile ↔ Spalte) → ${Krypto.hex(rd.nachTransposition)}` };
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Runde für Runde aufdecken',
          schritte: folge().map((x) => ({ text: texte[x.art](p.runden[x.runde - 1]), daten: x })),
          zeige(_s, i) {
            zeigeRunden(i);
          },
          beiLauf: (an) => {
            st.sperre(an);
            schalter.disabled = !!an;
          }
        });
      }
      st.aktualisiere();
    }

    /* ======================= Lawine ======================= */
    function baueLawine() {
      const eingabe = h('div', { class: 'lawine-eingabe' });
      const laeufe = h('div', { class: 'laeufe' });
      const zaehlerOrt = h('div', { class: 'lawine-zaehler-ort' });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise lawine-zurueck' }, 'Alle Bits zurückkippen');
      zurueck.addEventListener('click', () => {
        gekippt.klartext.clear();
        gekippt.schluessel.clear();
        zeige();
      });
      const st = steuerung(() => zeige());
      r.flaeche.append(st.element, h('p', { class: 'text-2' }, 'Tippe ein Bit des Klartextblocks oder des Schlüssels an – es kippt. Lauf B rechnet mit den gekippten Bits.'), eingabe, zurueck, zaehlerOrt, laeufe);
      function zeige() {
        AQ.clear(eingabe);
        AQ.clear(laeufe);
        AQ.clear(zaehlerOrt);
        zaehler = [];
        if (!p) return;
        const kippe = (menge, bit) => {
          if (menge.has(bit)) menge.delete(bit);
          else menge.add(bit);
          zeige();
          const kn = eingabe.querySelector(`.${menge === gekippt.klartext ? 'lawine-klartext' : 'lawine-schluessel'} button.bit[data-bit="${bit}"]`);
          if (kn) kn.focus();
        };
        const bB = vonBits(Krypto.xorBits(bits16(block), maske(gekippt.klartext)));
        const kB = vonBits(Krypto.xorBits(bits16(schluessel), maske(gekippt.schluessel)));
        eingabe.append(
          h('figure', { class: 'lawine-klartext' }, bitmatrix(bB, { titel: 'Klartextblock (Lauf B)', klasse: 'eingabematrix', zelle: (bit) => (gekippt.klartext.has(bit) ? 'anders' : ''), knopf: { beiKlick: (bit) => kippe(gekippt.klartext, bit), gedrueckt: (bit) => gekippt.klartext.has(bit) } })),
          h('figure', { class: 'lawine-schluessel' }, bitmatrix(kB, { titel: 'Schlüssel (Lauf B)', klasse: 'eingabematrix', zelle: (bit) => (gekippt.schluessel.has(bit) ? 'anders' : ''), knopf: { beiKlick: (bit) => kippe(gekippt.schluessel, bit), gedrueckt: (bit) => gekippt.schluessel.has(bit) } }))
        );
        const pB = protokoll(bB, kB, runden, variante);
        const diff = p.runden.map((rd, i) => Krypto.xorBits(bits16(rd.nachTransposition), bits16(pB.runden[i].nachTransposition)));
        zaehler = diff.map(einsen);
        const lauf = (klasse, titel, prot, anfang) =>
          h(
            'div',
            { class: `lauf ${klasse}` },
            h('h3', null, titel),
            h('div', { class: 'lauf-matrizen' }, bitmatrix(anfang, { titel: 'Klartextblock' }), prot.runden.map((rd, i) => bitmatrix(rd.nachTransposition, { titel: `nach Runde ${rd.runde}`, zelle: (bit) => (diff[i][bit - 1] === '1' ? 'anders' : '') })))
          );
        laeufe.append(lauf('lauf-a', 'Lauf A – ohne Kippen', p, block), lauf('lauf-b', 'Lauf B – mit gekippten Bits', pB, bB));
        zaehlerOrt.append(
          h(
            'div',
            { class: 'scroll-x' },
            h(
              'table',
              { class: 'labor-tabelle lawine-zaehler' },
              h('caption', null, 'Gekippte Bits nach jeder Runde (Lauf A gegen Lauf B)'),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Runde'), h('th', { scope: 'col' }, 'gekippte Bits'), h('th', { scope: 'col' }, 'Anteil (Linie = 8 von 16)'))),
              h(
                'tbody',
                null,
                zaehler.map((n, i) => {
                  const balken = h('span', { class: 'lawine-balken' }, h('span', { class: 'lawine-fuellung' }), h('span', { class: 'lawine-linie', 'aria-hidden': 'true' }));
                  balken.style.setProperty('--anteil', `${(n * 100) / 16}%`);
                  return h('tr', null, h('th', { scope: 'row' }, `Runde ${i + 1}`), h('td', null, `${n} von 16`), h('td', null, balken));
                })
              )
            )
          ),
          h('p', { class: 'lawine-info text-2' }, `Zum Vergleich KRYPTOS-16 im Mittel über alle Klartexte (W3 §0a.8): ${LAWINE_MITTEL.slice(0, runden).join(' · ')} – ideal sind 50 % (8 von 16 Bits). Hier zählt nur dieser eine Lauf.`)
        );
      }
      st.aktualisiere();
    }

    /* ======================= Bit-Verfolgung ======================= */
    function baueVerfolgung() {
      const eingabe = h('div', { class: 'verfolgung-eingabe' });
      const inhalt = h('div', { class: 'verfolgung-inhalt' });
      const liste = h('ol', { class: 'verfolgung-liste', 'aria-live': 'polite' });
      const st = steuerung(() => zeige());
      r.flaeche.append(st.element, h('p', { class: 'text-2' }, 'Tippe ein Bit des Klartextblocks an – sein Weg durch die Runden und die beteiligten Schlüsselbits werden hervorgehoben.'), eingabe, liste, inhalt);
      const ortText = (bit) => {
        const o = ortVon(bit);
        return `Bit ${bit} (Zeile ${o.z}, Spalte ${o.s})`;
      };
      function zeige() {
        AQ.clear(eingabe);
        AQ.clear(inhalt);
        AQ.clear(liste);
        weg = null;
        if (!p) return;
        if (verfolgt) weg = Krypto.kryptos16.bitweg(verfolgt, { variante, runden });
        const schluesselBits = new Set(weg ? weg.schluesselbits : []);
        eingabe.append(
          h('figure', { class: 'verfolgung-klartext' }, bitmatrix(block, { titel: 'Klartextblock – Bit wählen', klasse: 'eingabematrix', zelle: (bit) => (bit === verfolgt ? 'weg' : ''), knopf: { beiKlick: (bit) => { verfolgt = bit; zeige(); const kn = eingabe.querySelector(`.verfolgung-klartext button.bit[data-bit="${bit}"]`); if (kn) kn.focus(); }, gedrueckt: (bit) => bit === verfolgt } })),
          h('figure', { class: 'verfolgung-schluessel' }, bitmatrix(schluessel, { titel: 'Schlüssel K – beteiligte Bits', klasse: 'eingabematrix', zelle: (bit) => (schluesselBits.has(bit) ? 'weg' : ''), knopf: { gesperrt: true, gedrueckt: (bit) => schluesselBits.has(bit) } }))
        );
        if (!weg) {
          liste.appendChild(h('li', null, 'Noch kein Bit gewählt.'));
          return;
        }
        weg.runden.forEach((wr, i) => {
          const rd = p.runden[i];
          const menge = (l) => new Set(l);
          const xor = menge(wr.nachXor);
          const mitte = menge(wr.nachMitte);
          const trans = menge(wr.nachTransposition);
          const mitteKlasse = variante === 'kryptos16' ? 'beeinflusst' : 'weg';
          inhalt.appendChild(
            h(
              'section',
              { class: 'runde verfolgung-runde', 'aria-label': `Runde ${wr.runde}` },
              h('h3', null, `Runde ${wr.runde}`),
              h(
                'div',
                { class: 'runde-matrizen' },
                bitmatrix(rd.nachXor, { titel: `nach XOR mit K${wr.runde}`, zelle: (bit) => (xor.has(bit) ? 'weg' : '') }),
                bitmatrix(rd.mitte, { titel: MITTE_TITEL[variante], zelle: (bit) => (mitte.has(bit) ? mitteKlasse : '') }),
                bitmatrix(rd.nachTransposition, { titel: 'nach Transposition', zelle: (bit) => (trans.has(bit) ? 'weg' : '') })
              )
            )
          );
          const mitteText = variante === 'kryptos16' ? `nach S-Box beeinflusst ${wr.nachMitte.length} Bits (ganze Zeilen: ${wr.nachMitte.join(', ')})` : `${MITTE_TITEL[variante]} ${wr.nachMitte.map(ortText).join(', ')}`;
          liste.appendChild(h('li', null, `Runde ${wr.runde}: nach XOR ${wr.nachXor.map(ortText).join(', ')} mit Schlüsselbit ${wr.schluessel.join(', ')} von K · ${mitteText} · nach Transposition ${wr.nachTransposition.length > 4 ? `${wr.nachTransposition.length} Bits` : wr.nachTransposition.map(ortText).join(', ')}`));
        });
        liste.appendChild(h('li', null, `Beteiligte Schlüsselbits von K: ${weg.schluesselbits.join(', ')}`));
      }
      st.aktualisiere();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'runden') baueRunden();
      else if (id === 'lawine') baueLawine();
      else if (id === 'verfolgung') baueVerfolgung();
    }
    baue(r.aktiv());

    const hexOder = (n) => (n === null || n === undefined ? null : Krypto.hex(n));
    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return {
          reiter: r.aktiv(),
          variante,
          block: hexOder(block),
          schluessel: hexOder(schluessel),
          runden,
          ergebnis: p ? Krypto.hex(p.ergebnis) : null,
          protokoll: p ? p.runden.map((x) => ({ runde: x.runde, eingang: Krypto.hex(x.eingang), schluessel: Krypto.hex(x.schluessel), nachXor: Krypto.hex(x.nachXor), mitte: Krypto.hex(x.mitte), nachTransposition: Krypto.hex(x.nachTransposition) })) : [],
          gekippt: { klartext: [...gekippt.klartext].sort((a, b) => a - b), schluessel: [...gekippt.schluessel].sort((a, b) => a - b) },
          zaehler,
          weg
        };
      }
    };
  }

  KRLabor.registriere('runden', { titel: 'Runden-Labor', oeffne });
})();
