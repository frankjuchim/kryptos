/* Kryptos – Labor-Werkzeug „Vigenère-Werkbank“ (W2 §9.1, W6 §9.1, Plan M6 Tasks 116/117). Das Quadrat ist das
   Objekt: Zelle antippen → Zeile, Spalte, Kreuzung und die Rechnung; Ver-/Entschlüsseln (Vigenère, Autokey, Porta,
   ab Welt 6 Pendel und frei) Buchstabe für Buchstabe nachspielen. Angriff: Kasiski, Teiltexte, Koinzidenzindex (eA),
   Verschiebung je Spalte, manuelle Korrektur – jeder Schritt sichtbar, keine automatische „Antwort“.
   Rechnet nur über Krypto.*; Grundrechenarten nur für die Anzeige einer Rechnung. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = { klartext: 'pflaume', schluessel: 'GLOBUS' };
  const REITER_TITEL = { quadrat: 'Quadrat', verschluesseln: 'Ver-/Entschlüsseln', kasiski: 'Kasiski', teiltexte: 'Teiltexte', koinzidenz: 'Koinzidenzindex', verschiebung: 'Verschiebung', korrektur: 'Korrektur' };
  const MODI = [
    { id: 'vigenere', titel: 'Vigenère' },
    { id: 'autokey', titel: 'Autokey' },
    { id: 'porta', titel: 'Porta' },
    { id: 'pendel', titel: 'Pendel' },
    { id: 'frei', titel: 'frei' }
  ];
  const BUCHSTABEN = [...Krypto.ALPHABET];
  const MAX = 2000;

  /** Ein Buchstabe A–Z aus einer Eingabe (letzter getippter) oder ''. */
  const einBuchstabe = (x) => {
    const n = Krypto.nurBuchstaben(String(x ?? ''));
    return n ? n.slice(-1) : '';
  };

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('vigenere', v, umgebung);
    const modusErlaubt = (m) => KRLabor.erlaubt(`vigenere.modus.${m}`, umgebung);
    const mitText = typeof v.text === 'string';
    let text = mitText ? v.text.slice(0, MAX) : BEISPIEL.klartext;
    // M11: Schlüsselwort auch aus der Voreinstellung (Aufgaben-Panel, E217)
    let wort = typeof v.schluessel === 'string' ? Krypto.nurBuchstaben(v.schluessel).slice(0, 20) : mitText ? '' : BEISPIEL.schluessel;
    let modus = MODI.some((m) => m.id === v.modus) && modusErlaubt(v.modus) ? v.modus : 'vigenere';
    let richtung = v.richtung === 'ent' ? 'ent' : 'ver';
    let basis = 1;
    let zelle = null; // { zeile, spalte } im Quadrat
    let nachspiel = null;
    const A = analyse(v);
    let zuletzt = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug vigenere-werkzeug' }, r.element);
    container.appendChild(wurzel);

    let analyseTimer = null; // Entprellung der Analyse-Eingabe (Review M6)
    // M11 (E208–E210, E214): Erkenner-Verlauf, Start im geführten Modus (Panel), laufender geführter Modus
    const erkVerlauf = typeof KRErkenner !== 'undefined' ? KRErkenner.verlauf() : null;
    let fuehrung = umgebung && umgebung.gefuehrt && typeof umgebung.gefuehrt === 'object' ? umgebung.gefuehrt : null;
    let gefuehrt = null;
    const mitGefuehrt = typeof KRGefuehrt !== 'undefined';
    function schliesseTeile() {
      if (analyseTimer) clearTimeout(analyseTimer);
      analyseTimer = null;
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
      if (gefuehrt) gefuehrt.schliesse();
      gefuehrt = null;
    }
    /** Aufgabenwerte erkannt? → geführter Modus (Hook) bzw. Hinweis „nicht verfügbar“ in ort; true = nichts ausgeben */
    function erkenne(id, eingaben, ort) {
      const werte = { text, schluessel: wort, modus, richtung, k: A.st.k };
      return B.erkenne(ort, `vigenere.${id}`, eingaben, umgebung, erkVerlauf, { gefuehrt: mitGefuehrt && HOOKS[id] ? () => starteGefuehrt(id, werte) : null }) !== 'frei';
    }

    /* ======================= Reiter 1: Quadrat ======================= */
    function baueQuadrat() {
      const felder = {};
      const feld = (art, titel) => {
        const id = B.neueId(`vq-${art}`);
        const f = h('input', { type: 'text', id, class: `vq-${art}`, maxlength: '1', autocomplete: 'off', spellcheck: 'false', autocapitalize: art === 'klar' ? 'off' : 'characters' });
        felder[art] = f;
        return h('div', { class: 'vq-feld' }, h('label', { for: id }, titel), f);
      };
      const rechner = h('div', { class: 'vq-rechner' }, feld('klar', 'Klartext p'), h('span', { class: 'vq-op', 'aria-hidden': 'true' }, '+'), feld('schluessel', 'Schlüssel s'), h('span', { class: 'vq-op', 'aria-hidden': 'true' }, '→'), feld('geheim', 'Geheimtext c'));
      const rechnung = h('p', { class: 'vq-rechnung', 'aria-live': 'polite' }, 'Tippe eine Zelle des Quadrats an oder gib zwei der drei Buchstaben ein.');
      const steuer = {};
      const quadrat = KRB.quadrat({
        t: 'quadrat',
        art: 'vigenere',
        waehlbar: true,
        steuer,
        hervorheben: zelle ? { zeile: zelle.zeile, spalte: zelle.spalte } : {},
        beiWahl(z, sp) {
          zelle = { zeile: z, spalte: sp };
          felder.klar.value = Krypto.klein(sp);
          felder.schluessel.value = z;
          felder.geheim.value = Krypto.vigenere(sp, z);
          zeigeRechnung('ver');
        }
      });
      const basisKnoepfe = [1, 0].map((n) => h('button', { type: 'button', role: 'radio', 'data-basis': String(n) }, n === 1 ? 'Nummer A = 1 … 26' : 'Verschiebung 0 … 25'));
      const basisWahl = h('div', { class: 'labor-basis', role: 'radiogroup', 'aria-label': 'Alphabetleiste' }, basisKnoepfe);
      const alphabetOrt = h('div', { class: 'vq-alphabet' });
      function zeigeAlphabet() {
        for (const kn of basisKnoepfe) {
          const an = kn.dataset.basis === String(basis);
          kn.setAttribute('aria-checked', String(an));
          kn.setAttribute('tabindex', an ? '0' : '-1');
        }
        AQ.mount(alphabetOrt, KRB.alphabet({ t: 'alphabet', basis, zeilen: [], titel: basis === 1 ? 'Alphabetleiste, Nummer A = 1 … Z = 26' : 'Alphabetleiste, Verschiebung A = 0 … Z = 25' }));
        zeigeRechnung(letzte);
      }
      for (const kn of basisKnoepfe) {
        kn.addEventListener('click', () => {
          basis = Number(kn.dataset.basis);
          zeigeAlphabet();
        });
        kn.addEventListener('keydown', (e) => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
          e.preventDefault();
          basis = basis === 1 ? 0 : 1;
          zeigeAlphabet();
          basisKnoepfe.find((x) => x.dataset.basis === String(basis)).focus();
        });
      }

      let letzte = null; // 'ver' | 'ent'
      function zeigeRechnung(art) {
        letzte = art;
        const P = einBuchstabe(felder.klar.value);
        const S = einBuchstabe(felder.schluessel.value);
        const C = einBuchstabe(felder.geheim.value);
        if (!art || !P || !S || !C) return;
        const [p, s, c] = [P, S, C].map((x) => Krypto.wert(x, basis));
        if (basis === 1) {
          rechnung.textContent = art === 'ver' ? `c = ((p + s − 2) mod 26) + 1 = ((${p} + ${s} − 2) mod 26) + 1 = ${c} → ${C}` : `p = ((c − s) mod 26) + 1 = ((${c} − ${s}) mod 26) + 1 = ${p} → ${Krypto.klein(P)}`;
        } else {
          rechnung.textContent = art === 'ver' ? `c = (p + s) mod 26 = (${p} + ${s}) mod 26 = ${c} → ${C}` : `p = (c − s) mod 26 = (${c} − ${s}) mod 26 = ${p} → ${Krypto.klein(P)}`;
        }
        zelle = { zeile: S, spalte: P };
        steuer.waehle(S, P);
      }
      /** Schlüsselbuchstabe s mit vigenere(p, s) = c – über Krypto.alleCaesar (Verschiebung k) und Krypto.buchstabe. */
      function schluesselAus(P, C) {
        const k = Krypto.alleCaesar(C).findIndex((x) => x.text === P);
        return Krypto.buchstabe(k, 0);
      }
      function eingabe(art) {
        const f = felder[art];
        const b = einBuchstabe(f.value);
        f.value = art === 'klar' ? Krypto.klein(b) : b;
        const P = einBuchstabe(felder.klar.value);
        const S = einBuchstabe(felder.schluessel.value);
        const C = einBuchstabe(felder.geheim.value);
        if (!b) return;
        if (art === 'klar') {
          if (S) felder.geheim.value = Krypto.vigenere(P, S);
          else if (C) felder.schluessel.value = schluesselAus(P, C);
          zeigeRechnung('ver');
        } else if (art === 'schluessel') {
          if (P) {
            felder.geheim.value = Krypto.vigenere(P, S);
            zeigeRechnung('ver');
          } else if (C) {
            felder.klar.value = Krypto.klein(Krypto.vigenere(C, S, 'ent'));
            zeigeRechnung('ent');
          }
        } else if (S) {
          felder.klar.value = Krypto.klein(Krypto.vigenere(C, S, 'ent'));
          zeigeRechnung('ent');
        } else if (P) {
          felder.schluessel.value = schluesselAus(P, C);
          zeigeRechnung('ver');
        }
      }
      for (const art of ['klar', 'schluessel', 'geheim']) {
        felder[art].addEventListener('input', () => eingabe(art));
        felder[art].addEventListener('focus', () => typeof felder[art].select === 'function' && felder[art].select());
      }
      if (zelle) {
        felder.klar.value = Krypto.klein(zelle.spalte);
        felder.schluessel.value = zelle.zeile;
        felder.geheim.value = Krypto.vigenere(zelle.spalte, zelle.zeile);
        letzte = 'ver';
      }
      r.flaeche.append(h('div', { class: 'vq-bereich' }, h('div', { class: 'vq-rechnerteil' }, rechner, rechnung), quadrat), h('div', { class: 'vq-leiste' }, basisWahl, alphabetOrt));
      zeigeAlphabet();
    }

    /* ======================= Reiter 2: Ver-/Entschlüsseln ======================= */
    function baueVerschluesseln() {
      const modi = MODI.filter((m) => ['vigenere', 'autokey', 'porta'].includes(m.id) || modusErlaubt(m.id));
      const modusKnoepfe = modi.map((m) => h('button', { type: 'button', role: 'radio', 'data-modus': m.id }, m.titel));
      const modusWahl = h('div', { class: 'vg-modus labor-basis', role: 'radiogroup', 'aria-label': 'Verfahren' }, modusKnoepfe);
      const feld = B.textfeld({ beschriftung: richtung === 'ver' ? 'Klartext (bis 2 000 Zeichen)' : 'Geheimtext (bis 2 000 Zeichen)', max: MAX, wert: text, art: richtung === 'ver' ? 'klartext' : 'geheimtext', beiEingabe: (t) => { text = t; rechne(); } });
      const wortId = B.neueId('vg-schluessel');
      const wortFeld = h('input', { type: 'text', id: wortId, class: 'vg-schluessel', maxlength: '20', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters' });
      wortFeld.value = wort;
      wortFeld.addEventListener('input', () => {
        wort = wortFeld.value;
        rechne();
      });
      const ri = B.richtung({ wert: richtung, beiWechsel: (x) => { richtung = x; baue('verschluesseln'); } });
      const info = h('div', { class: 'vg-info' });
      const zeilenOrt = h('div', { class: 'vg-zeilen-ort' });
      const quadratZeile = h('div', { class: 'vg-quadratzeile' });
      const aus = B.ausgabe({ beschriftung: richtung === 'ver' ? 'Geheimtext' : 'Klartext', art: 'frei' });
      const nsOrt = h('div', { class: 'vg-nachspiel' });
      function zeigeModus() {
        for (const kn of modusKnoepfe) {
          const an = kn.dataset.modus === modus;
          kn.setAttribute('aria-checked', String(an));
          kn.setAttribute('tabindex', an ? '0' : '-1');
        }
      }
      modusKnoepfe.forEach((kn, i) => {
        kn.addEventListener('click', () => {
          modus = kn.dataset.modus;
          zeigeModus();
          rechne();
        });
        kn.addEventListener('keydown', (e) => {
          const schritt = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (!schritt) return;
          e.preventDefault();
          const ziel = modusKnoepfe[Krypto.mod(i + schritt, modusKnoepfe.length)];
          modus = ziel.dataset.modus;
          zeigeModus();
          ziel.focus();
          rechne();
        });
      });
      function sperre(an) {
        feld.sperre(an);
        wortFeld.disabled = an;
        ri.sperre(an);
        for (const kn of modusKnoepfe) kn.disabled = an;
      }

      /** Ergebnis, Strom und die drei Zeilen; KryptoFehler → Hinweis. */
      function ergebnis() {
        const t = Krypto.nurBuchstaben(text);
        const s = Krypto.nurBuchstaben(wort).slice(0, 20);
        if (!t || !s) return { t, s, aus: '', strom: '' };
        const folge = modus === 'pendel' ? Krypto.pendelFolge(s) : s;
        const ausgabe = modus === 'autokey' ? Krypto.autokey(t, s, richtung) : modus === 'porta' ? Krypto.porta(t, s, richtung) : Krypto.vigenere(t, folge, richtung);
        const strom = Krypto.schluesselstrom(t, s, { modus: modus === 'autokey' ? 'autokey' : modus === 'pendel' ? 'pendel' : 'vigenere', richtung });
        return { t, s, aus: ausgabe, strom };
      }
      let stand = { t: '', s: '', aus: '', strom: '' };
      function zeilen(bis) {
        const { t, aus: ergebnisText, strom } = stand;
        const klar = richtung === 'ver' ? t : ergebnisText;
        const geheim = richtung === 'ver' ? ergebnisText : t;
        const teilweise = modus === 'autokey' && richtung === 'ent' && bis >= 0;
        const zelle_ = (zeichen, i, klasse) => h('td', { class: [klasse, i === bis ? 'aktuell' : null].filter(Boolean).join(' ') || null }, teilweise && i > bis && klasse !== 'geheim' ? '' : zeichen);
        AQ.mount(
          zeilenOrt,
          h(
            'div',
            { class: 'scroll-x' },
            h(
              'table',
              { class: 'vg-zeilen' },
              h('caption', { class: 'sr' }, 'Klartext, Schlüsselstrom und Geheimtext untereinander'),
              h('tbody', null,
                h('tr', { class: 'klar' }, h('th', { scope: 'row' }, 'Klartext'), [...klar].map((c, i) => zelle_(Krypto.klein(c), i, 'klar'))),
                h('tr', { class: 'strom' }, h('th', { scope: 'row' }, 'Schlüsselstrom'), [...strom].map((c, i) => zelle_(c, i, 'strom'))),
                h('tr', { class: 'geheim' }, h('th', { scope: 'row' }, 'Geheimtext'), [...geheim].map((c, i) => zelle_(c, i, 'geheim'))))
            )
          )
        );
        AQ.clear(quadratZeile);
        if (bis >= 0 && modus !== 'porta' && strom[bis] && klar[bis]) {
          quadratZeile.append(KRB.quadrat({ t: 'quadrat', art: 'vigenere', ausschnitt: [strom[bis]], hervorheben: { zeile: strom[bis], spalte: klar[bis] }, titel: `Zeile ${strom[bis]} des Vigenère-Quadrats` }));
        }
      }
      function zeigeInfo() {
        AQ.clear(info);
        const s = Krypto.nurBuchstaben(wort).slice(0, 20);
        if (!s) {
          info.append(B.hinweis('info', 'Gib ein Schlüsselwort ein (1–20 Buchstaben).'));
          return;
        }
        if (modus === 'porta') {
          info.append(B.hinweis('info', 'Porta ist involutorisch: Ver- = Entschlüsseln (dieselbe Tafel in beide Richtungen).'));
          const paare = BUCHSTABEN.filter((_, i) => i < 13).map((_, i) => BUCHSTABEN[2 * i] + BUCHSTABEN[2 * i + 1]);
          info.append(B.tabelle({ caption: 'Porta-Tafel: Zeile je Schlüsselpaar, Klartext a–m', kopf: ['Schlüssel', ...BUCHSTABEN.slice(0, 13).map((c) => Krypto.klein(c))], zeilen: paare.map((p) => [p, ...Krypto.porta('ABCDEFGHIJKLM', p[0])]), klasse: 'porta-tafel' }));
        } else if (modus === 'pendel') {
          const folge = Krypto.pendelFolge(s);
          info.append(h('p', { class: 'vg-pendel' }, `Pendelfolge ${folge} · Periode ${s.length === 1 ? 'L = 1' : '2L − 2'} = ${folge.length}`));
        } else if (modus === 'frei') {
          info.append(h('p', { class: 'vg-frei' }, `Freie Schlüsselfolge ${s} · Periode ${s.length}`));
        } else if (modus === 'autokey') {
          info.append(h('p', { class: 'vg-autokey text-2' }, richtung === 'ver' ? 'Strom = Schlüsselwort, danach der Klartext selbst.' : 'Strom = Schlüsselwort, danach der schon entschlüsselte Klartext – er entsteht Zeichen für Zeichen.'));
        }
      }
      function rechne() {
        zeigeInfo();
        if (erkenne('verschluesseln', { texte: [text], schluessel: [Krypto.nurBuchstaben(wort)].filter(Boolean) }, info)) {
          stand = { t: '', s: '', aus: '', strom: '' };
          aus.setze('');
          if (nachspiel) nachspiel.schliesse();
          nachspiel = null;
          return;
        }
        try {
          stand = ergebnis();
        } catch (e) {
          if (!e || e.name !== 'KryptoFehler') throw e;
          stand = { t: '', s: '', aus: '', strom: '' };
          info.append(B.hinweis('warnung', e.message));
        }
        aus.setze(richtung === 'ver' ? Krypto.gruppieren(stand.aus) : Krypto.klein(stand.aus));
        zeilen(-1);
        if (nachspiel) nachspiel.schliesse();
        nachspiel = null;
        const { t, aus: ergebnisText, strom } = stand;
        if (!ergebnisText) return;
        const klar = richtung === 'ver' ? t : ergebnisText;
        const geheim = richtung === 'ver' ? ergebnisText : t;
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Buchstabe für Buchstabe',
          start: -1,
          schritte: [...klar].map((p, i) => {
            const S = strom[i];
            const C = geheim[i];
            const pk = Krypto.klein(p);
            let erkl;
            if (modus === 'porta') erkl = richtung === 'ver' ? `${pk} → ${C} (Tafelzeile ${S})` : `${C} → ${pk} (Tafelzeile ${S})`;
            else if (richtung === 'ver') erkl = `${pk} (${Krypto.wert(p)}) mit ${S} (${Krypto.wert(S)}): ((${Krypto.wert(p)} + ${Krypto.wert(S)} − 2) mod 26) + 1 = ${Krypto.wert(C)} → ${C}`;
            else erkl = `${C} (${Krypto.wert(C)}) mit ${S} (${Krypto.wert(S)}): ((${Krypto.wert(C)} − ${Krypto.wert(S)}) mod 26) + 1 = ${Krypto.wert(p)} → ${pk}${modus === 'autokey' ? ` – ${pk} kommt in den Strom` : ''}`;
            return { text: `Buchstabe ${i + 1}: ${erkl}`, daten: { i } };
          }),
          zeige: (_s, i) => zeilen(i),
          beiLauf: sperre
        });
      }
      zeigeModus();
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, modusWahl, ri.element),
        feld.element,
        h('div', { class: 'labor-textfeld vg-wort' }, h('label', { for: wortId }, modus === 'frei' ? 'Schlüsselfolge (1–20 Buchstaben)' : 'Schlüsselwort (1–20 Buchstaben)'), wortFeld),
        info,
        zeilenOrt,
        aus.element,
        quadratZeile,
        nsOrt
      );
      rechne();
    }

    /* ======================= Reiter 3–7: Angriff (Task 117) ======================= */
    /** Zustand des Angriffs (ohne DOM): Mindestlänge, ausgeschlossene Abstände, Annahme k, Korrektur-Schlüssel. */
    function analyse(vor) {
      const st = {
        min: 3,
        aus: new Set(),
        k: Number.isInteger(vor.schluessellaenge) && vor.schluessellaenge >= 1 && vor.schluessellaenge <= 20 ? vor.schluessellaenge : 1,
        schluessel: null // null = Vorschläge aus Reiter 6
      };
      function berechne() {
        const t = Krypto.nurBuchstaben(text);
        const kas = Krypto.kasiski(t, { min: st.min });
        const teiler = Krypto.teilerTabelle(kas.abstaende.filter((d) => !st.aus.has(d)), { von: 2, bis: 20 });
        let maximum = null;
        for (let x = 2; x <= 20; x++) if (teiler[x] > 0 && (maximum === null || teiler[x] >= teiler[maximum])) maximum = x;
        const icMittel = {};
        for (let x = 1; x <= 20; x++) icMittel[x] = Krypto.mittlererKoinzidenzindex(t, x);
        const teile = Krypto.teiltexte(t, st.k);
        const schaetzung = teile.map((x) => Krypto.verschiebungSchaetzen(x));
        const vorschlag = schaetzung.map((x) => x.buchstabe).join('');
        const schluessel = st.schluessel && st.schluessel.length === st.k ? st.schluessel : vorschlag;
        return {
          t,
          kas,
          teiler,
          maximum,
          ic: Krypto.koinzidenzindex(t),
          bruch: Krypto.koinzidenzindexBruch(t),
          friedman: Krypto.friedman(t),
          icMittel,
          teile,
          schaetzung,
          vorschlag,
          schluessel,
          klartext: t ? Krypto.klein(Krypto.vigenere(t, schluessel, 'ent')) : ''
        };
      }
      return {
        st,
        berechne,
        zustand() {
          const b = berechne();
          return { wiederholungen: b.kas.wiederholungen, teiler: b.teiler, maximum: b.maximum, ic: b.ic, friedman: b.friedman, icMittel: b.icMittel, k: st.k, vorschlag: b.vorschlag, schluessel: b.schluessel, klartext: b.klartext };
        }
      };
    }

    const komma = (x, stellen) => (x === null || x === undefined ? '–' : x.toFixed(stellen).replace('.', ','));
    const ARTEN = ['a', 'b', 'c'];

    /** Balken 0 … 1 (CSSOM --anteil, CSP-konform). */
    function balken(anteil, klasse = '') {
      const b = h('span', { class: `vg-balken ${klasse}`.trim(), 'aria-hidden': 'true' });
      b.style.setProperty('--anteil', String(Math.max(0, Math.min(1, anteil))));
      return b;
    }

    function baueAnalyse(id) {
      const kopf = B.textfeld({ beschriftung: 'Geheimtext (bis 2 000 Zeichen)', max: MAX, wert: text, art: 'geheimtext', zeilen: 3, beiEingabe: (t) => { text = t; A.st.schluessel = null; spaeter(); } });
      // Analyse (Kasiski, Koinzidenz, Teiltexte …) erst nach 300 ms Tipp-Pause neu zeichnen
      const spaeter = () => {
        if (analyseTimer) clearTimeout(analyseTimer);
        analyseTimer = setTimeout(() => {
          analyseTimer = null;
          zeichne();
        }, 300);
      };
      const zeileOrt = h('div', { class: 'vg-textzeile' });
      const inhalt = h('div', { class: 'vg-inhalt' });
      r.flaeche.append(kopf.element, zeileOrt, inhalt);
      function zeichne() {
        const mitK = ['teiltexte', 'verschiebung', 'korrektur'].includes(id);
        if (erkenne(id, { texte: [text], schluessel: mitK ? [`k=${A.st.k}`] : [] }, inhalt)) {
          AQ.clear(zeileOrt);
          for (const x of [...inhalt.childNodes]) if (!x.classList || !x.classList.contains('labor-nicht-verfuegbar')) x.remove();
          return;
        }
        const b = A.berechne();
        const marken = id === 'kasiski' ? b.kas.wiederholungen.flatMap((w, i) => w.positionen.map((p) => ({ von: p, laenge: w.folge.length, art: ARTEN[Krypto.mod(i, 3)], klasse: 'wiederholung' }))) : [];
        AQ.mount(zeileOrt, b.t ? KRB.geheimtext(b.t, { positionen: true, kopieren: false, markiert: marken }) : h('p', { class: 'text-2' }, 'Gib oben einen Geheimtext ein.'));
        AQ.clear(inhalt);
        if (!b.t) return;
        ({ kasiski: zeigeKasiski, teiltexte: zeigeTeiltexte, koinzidenz: zeigeKoinzidenz, verschiebung: zeigeVerschiebung, korrektur: zeigeKorrektur })[id](b, zeichne);
      }
      // Regler und Schalter behalten den Fokus: sie liegen außerhalb von „inhalt“ oder werden nach dem Zeichnen wieder fokussiert
      if (id === 'kasiski') {
        const zm = B.zahl({ beschriftung: 'Mindestlänge der Folgen', min: 3, max: 6, wert: A.st.min, beiWechsel: (x) => { A.st.min = x; zeichne(); } });
        r.flaeche.insertBefore(h('div', { class: 'labor-steuer' }, zm.element), inhalt);
      } else if (id === 'teiltexte') {
        const zk = B.zahl({ beschriftung: 'angenommene Schlüssellänge k', min: 1, max: 20, wert: A.st.k, format: (x) => `k = ${x}`, beiWechsel: (x) => { A.st.k = x; A.st.schluessel = null; zeichne(); } });
        r.flaeche.insertBefore(h('div', { class: 'labor-steuer' }, zk.element, schalterReferenz.element, schalterVerschoben.element), inhalt);
      }
      zeichne();
    }

    /** Kleiner Schalter (Checkbox mit Beschriftung). */
    function schalter(klasse, titel, an) {
      const id = B.neueId(klasse);
      const box = h('input', { type: 'checkbox', id, class: klasse });
      box.checked = an;
      return { element: h('label', { class: 'vg-schalter', for: id }, box, ` ${titel}`), box };
    }
    const schalterReferenz = schalter('referenz-an', 'Referenz Deutsch einblenden', true);
    const schalterVerschoben = schalter('verschoben-an', 'um den Schlüsselbuchstaben zurückschieben (Reiter 6/7)', false);
    for (const sch of [schalterReferenz, schalterVerschoben]) {
      sch.box.addEventListener('change', () => {
        if (zuletzt !== 'teiltexte') return;
        baue('teiltexte');
        sch.box.focus();
      });
    }

    function zeigeKasiski(b, zeichne) {
      const inhalt = r.flaeche.querySelector('.vg-inhalt');
      const ws = b.kas.wiederholungen;
      if (!ws.length) {
        inhalt.append(B.hinweis('info', `Keine Wiederholung ab ${A.st.min} Buchstaben gefunden.`));
        return;
      }
      const abstandZelle = (d) => {
        const id = B.neueId('zufall');
        const box = h('input', { type: 'checkbox', id, class: 'zufall', 'data-abstand': String(d), 'aria-label': `Abstand ${d} als Zufallstreffer ausschließen` });
        box.checked = A.st.aus.has(d);
        box.addEventListener('change', () => {
          if (box.checked) A.st.aus.add(d);
          else A.st.aus.delete(d);
          zeichne();
          const neu = r.flaeche.querySelector(`input.zufall[data-abstand="${d}"]`);
          if (neu) neu.focus();
        });
        return h('label', { class: 'vg-abstand', for: id }, box, h('span', null, `${d} = ${Krypto.primfaktoren(d).join(' · ')}`));
      };
      inhalt.append(
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'labor-tabelle wiederholungen' },
            h('caption', null, 'Wiederholungen (Positionen ab 0) – Haken: Abstand als Zufallstreffer ausschließen'),
            h('thead', null, h('tr', null, ['Folge', 'Positionen', 'Abstände = Primfaktoren'].map((x) => h('th', { scope: 'col' }, x)))),
            h('tbody', null, ws.map((w, i) => h('tr', { class: `art-${ARTEN[Krypto.mod(i, 3)]}` }, h('th', { scope: 'row', class: 'vg-folge' }, w.folge), h('td', null, w.positionen.join(', ')), h('td', { class: 'vg-abstaende' }, w.abstaende.map(abstandZelle)))))
          )
        )
      );
      const werte = Object.keys(b.teiler).map(Number);
      const hoechst = b.maximum === null ? 0 : b.teiler[b.maximum];
      inhalt.append(
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'labor-tabelle teiler' },
            h('caption', null, `Teilertabelle: Wie viele der ${b.kas.abstaende.length - b.kas.abstaende.filter((d) => A.st.aus.has(d)).length} Abstände sind durch t teilbar?`),
            h('thead', null, h('tr', null, ['t', 'Anzahl', 'Balken', ''].map((x) => h('th', { scope: 'col' }, x)))),
            h(
              'tbody',
              null,
              werte.map((t) => {
                const max = hoechst > 0 && b.teiler[t] === hoechst;
                return h('tr', { 'data-t': String(t), class: max ? 'maximum' : null }, h('th', { scope: 'row' }, String(t)), h('td', null, String(b.teiler[t])), h('td', { class: 'vg-balken-zelle' }, balken(hoechst ? b.teiler[t] / hoechst : 0)), h('td', { class: 'vg-marke' }, max ? '★ Maximum' : ''));
              })
            )
          )
        ),
        h('p', { class: 'text-2 vg-grenze' }, 'Die Tabelle zählt nur. Welche Schlüssellänge passt, entscheidest du – prüfe sie mit Teiltexten und Koinzidenzindex.')
      );
    }

    function zeigeTeiltexte(b) {
      const inhalt = r.flaeche.querySelector('.vg-inhalt');
      const mitRef = schalterReferenz.box.checked;
      const zurueck = schalterVerschoben.box.checked;
      const liste = h('div', { class: 'vg-teiltexte' });
      b.teile.forEach((teil, j) => {
        const sb = b.schluessel[j];
        const zeigeText = zurueck && teil ? Krypto.caesar(teil, Krypto.wert(sb, 0), 'ent') : teil;
        liste.append(
          h(
            'section',
            { class: 'vg-teiltext' },
            h('h3', null, `T${j + 1}: Positionen ${j}, ${j + A.st.k}, ${j + 2 * A.st.k}, … · ${teil.length} Buchstaben${zurueck ? ` · um ${sb} zurückgeschoben` : ''}`),
            h('p', { class: 'geheimtext teiltext-zeile' }, teil ? Krypto.gruppieren(teil) : '–'),
            KRB.haeufigkeit({ t: 'haeufigkeit', quelle: 'text', text: zeigeText, referenz: mitRef ? 'deutsch' : null, titel: `Häufigkeiten in T${j + 1}${zurueck ? ` (zurückgeschoben um ${sb})` : ''}` })
          )
        );
      });
      inhalt.append(liste);
    }

    function zeigeKoinzidenz(b) {
      const inhalt = r.flaeche.querySelector('.vg-inhalt');
      const n = b.t.length;
      if (!b.bruch) {
        inhalt.append(B.hinweis('info', 'Für den Koinzidenzindex braucht der Text mindestens zwei Buchstaben.'));
        return;
      }
      let friedman;
      if (n < 30) friedman = 'Friedman: Text zu kurz (erst ab n = 30).';
      else if (b.friedman === null || b.friedman <= 0) friedman = 'I ≤ I_Z: Schlüssel etwa so lang wie der Text.';
      else friedman = `Friedman: k ≈ (I_D − I_Z)·n / ((n − 1)·I − I_Z·n + I_D) ≈ ${komma(b.friedman, 2)}`;
      const skala = h('div', { class: 'vg-skala', 'aria-hidden': 'true' }, balken(b.ic / 0.1, 'vg-skala-wert'), h('span', { class: 'vg-ref vg-ref-z' }, 'I_Z'), h('span', { class: 'vg-ref vg-ref-d' }, 'I_D'));
      inhalt.append(
        h(
          'div',
          { class: 'kennzahlen' },
          h('p', { class: 'kennzahl-bruch' }, `I = Σ nᵢ(nᵢ − 1) / (n(n − 1)) = ${b.bruch.zaehler} / ${b.bruch.nenner}`),
          h('p', { class: 'kennzahl-wert' }, `I ≈ ${komma(b.ic, 4)}`),
          skala,
          h('p', { class: 'kennzahl-referenz text-2' }, 'Referenzlinien: zufällige Buchstaben I_Z = 0,038 · deutscher Text I_D = 0,076.'),
          h('p', { class: 'friedman' }, friedman)
        )
      );
      const icK = b.teile.map((x) => Krypto.koinzidenzindex(x));
      inhalt.append(h('p', { class: 'vg-ic-teile' }, `Bei k = ${A.st.k} (Reiter Teiltexte): ${icK.map((x, j) => `T${j + 1} ${komma(x, 4)}`).join(' · ')}`));
      inhalt.append(
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'labor-tabelle ic-mittel' },
            h('caption', null, 'Mittlerer Koinzidenzindex der Teiltexte für k = 1 … 20 (▲ = mindestens 0,060)'),
            h('thead', null, h('tr', null, ['k', 'mittlerer I', 'Balken', ''].map((x) => h('th', { scope: 'col' }, x)))),
            h(
              'tbody',
              null,
              Object.keys(b.icMittel).map((x) => {
                const wert = b.icMittel[x];
                const hoch = wert !== null && wert >= 0.06;
                return h('tr', { 'data-k': x, class: hoch ? 'hoch' : null }, h('th', { scope: 'row' }, x), h('td', null, komma(wert, 4)), h('td', { class: 'vg-balken-zelle' }, h('div', { class: 'vg-skala' }, balken((wert || 0) / 0.1), h('span', { class: 'vg-ref vg-ref-z' }), h('span', { class: 'vg-ref vg-ref-d' }))), h('td', { class: 'vg-marke' }, hoch ? '▲' : ''));
              })
            )
          )
        )
      );
    }

    function zeigeVerschiebung(b) {
      const inhalt = r.flaeche.querySelector('.vg-inhalt');
      inhalt.append(B.hinweis('warnung', 'Vorschlag ist ein Hinweis, keine Lösung – Prüfe am Klartext!'));
      const zeilen = b.teile.map((teil, j) => {
        const sch = b.schaetzung[j];
        const haeufig = Krypto.rangfolge(teil)[0];
        const schnell = haeufig ? Krypto.buchstabe(Krypto.alleCaesar(haeufig).findIndex((x) => x.text === 'E'), 0) : '–';
        return [
          `T${j + 1}`,
          String(teil.length),
          `${sch.buchstabe} (Nummer ${Krypto.wert(sch.buchstabe)})`,
          sch.kandidaten.map((x) => `${x.buchstabe}: χ = ${komma(x.wert, 3)}`).join(' · '),
          haeufig ? `${haeufig} ↦ e → ${schnell}` : '–'
        ];
      });
      inhalt.append(
        B.tabelle({ caption: `Verschiebung je Teiltext bei k = ${A.st.k}: Korrelation mit Deutsch χ(v) = Σ p_D(x) · f_T(x + v)`, kopf: ['Teiltext', 'Länge', 'Vorschlag', 'drei beste Kandidaten', 'Schnellmethode'], zeilen, klasse: 'verschiebung' }),
        h('p', { class: 'vg-vorschlag' }, `Zusammen: ${b.vorschlag} – übernimm ihn im Reiter Korrektur und prüfe, ob ein sinnvoller Text entsteht.`)
      );
    }

    function zeigeKorrektur(b, zeichne) {
      const inhalt = r.flaeche.querySelector('.vg-inhalt');
      const k = A.st.k;
      const sch = b.schluessel;
      const setze = (j, buchstabe, fokus) => {
        const neu = [...sch];
        neu[j] = buchstabe;
        A.st.schluessel = neu.join('');
        zeichne();
        if (fokus) {
          const el = r.flaeche.querySelector(`.korrektur-feld[data-spalte="${j}"] ${fokus}`);
          if (el) el.focus();
        }
      };
      const felder = [...sch].map((c, j) => {
        const minus = h('button', { type: 'button', class: 'knopf knopf-leise zahl-minus', 'aria-label': `Spalte ${j + 1}: Buchstabe zurück` }, '−');
        const plus = h('button', { type: 'button', class: 'knopf knopf-leise zahl-plus', 'aria-label': `Spalte ${j + 1}: Buchstabe weiter` }, '+');
        const f = h('input', { type: 'text', maxlength: '1', autocomplete: 'off', spellcheck: 'false', 'aria-label': `Schlüsselbuchstabe Spalte ${j + 1}` });
        f.value = c;
        minus.addEventListener('click', () => setze(j, Krypto.buchstabe(Krypto.wert(c, 0) - 1, 0), '.zahl-minus'));
        plus.addEventListener('click', () => setze(j, Krypto.buchstabe(Krypto.wert(c, 0) + 1, 0), '.zahl-plus'));
        f.addEventListener('focus', () => typeof f.select === 'function' && f.select());
        f.addEventListener('input', () => {
          const x = einBuchstabe(f.value);
          if (x) setze(j, x, 'input');
        });
        return h('div', { class: 'korrektur-feld', 'data-spalte': String(j) }, h('span', { class: 'korrektur-nr' }, String(j + 1)), minus, f, plus);
      });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise korrektur-vorschlag' }, `Vorschläge wiederherstellen (${b.vorschlag})`);
      zurueck.addEventListener('click', () => {
        A.st.schluessel = null;
        zeichne();
      });
      const perioden = [];
      for (let i = 0; i < b.klartext.length; i += k) perioden.push(b.klartext.slice(i, i + k));
      const live = h(
        'p',
        { class: 'korrektur-klartext', 'aria-live': 'polite' },
        perioden.map((p, pi) => [pi ? ' ' : null, h('span', { class: 'periode' }, [...p].map((c, j) => h('span', { class: `spalte-${j} farbe-${Krypto.mod(j, 5)}`, title: `Spalte ${j + 1} (Schlüssel ${sch[j]})` }, c)))])
      );
      inhalt.append(
        h('div', { class: 'korrektur-felder', role: 'group', 'aria-label': `Schlüsselwort mit ${k} Buchstaben` }, felder),
        zurueck,
        h('div', { class: 'werkbank-klartext-rahmen' }, h('span', { class: 'werkbank-klartext-titel' }, `Live-Entschlüsselung mit ${sch} (Blöcke à k = ${k}, Spalten markiert)`), live),
        B.details('Als Tabelle (eine Spalte je Schlüsselbuchstabe)', B.tabelle({ caption: 'Klartext nach Spalten', kopf: [...sch].map((c, j) => `${j + 1}: ${c}`), zeilen: perioden.map((p) => [...p]), zeilenkopf: false, klasse: 'korrektur-tabelle' })),
        h('p', { class: 'text-2' }, 'Nichts wird gespeichert – probiere ruhig aus.')
      );
    }

    /* ---------- Geführter Modus (M11 Task 244, E208): Zeile/Spalte der Tafel, Positionsleiste, Zählen ---------- */

    function verschluesselnHook(container, werte) {
      const ver = werte.richtung !== 'ent';
      const md = MODI.some((m) => m.id === werte.modus) ? werte.modus : 'vigenere';
      const s0 = Krypto.nurBuchstaben(String(werte.schluessel || '')).slice(0, 20) || 'A';
      const ein = [...Krypto.nurBuchstaben(String(werte.text || ''))].slice(0, 300);
      const pendel = md === 'pendel' ? Krypto.pendelFolge(s0, Math.max(1, ein.length)) : null;
      /** Schlüsselbuchstabe für Stelle i – Autokey entschlüsseln: aus deinen Einträgen (folgeAus) */
      const schluesselBei = (i, e) => {
        if (md === 'pendel') return pendel[i];
        if (md === 'autokey') return i < s0.length ? s0[i] : ver ? ein[i - s0.length] : Krypto.nurBuchstaben(e[i - s0.length] || '') || '?';
        return s0[Krypto.mod(i, s0.length)];
      };
      const porta = md === 'porta';
      const tafel = porta
        ? KRGefuehrt.raster(container, { zeilen: 13, spalten: 13, caption: 'Porta-Tafel: Zeile je Schlüsselpaar, Kopf = Klartext a–m', zeilenKopf: (zz) => BUCHSTABEN[2 * zz] + BUCHSTABEN[2 * zz + 1], spaltenKopf: (ss) => Krypto.klein(BUCHSTABEN[ss]), inhalt: (zz, ss) => Krypto.porta('ABCDEFGHIJKLM', BUCHSTABEN[2 * zz])[ss] })
        : KRGefuehrt.raster(container, { zeilen: 26, spalten: 26, caption: 'Vigenère-Quadrat: Zeile = Schlüsselbuchstabe, Spalte = Klartextbuchstabe', zeilenKopf: (zz) => BUCHSTABEN[zz], spaltenKopf: (ss) => Krypto.klein(BUCHSTABEN[ss]), inhalt: (zz, ss) => Krypto.vigenere(BUCHSTABEN[ss], BUCHSTABEN[zz]) });
      const band = KRGefuehrt.band(container, ver ? 'Dein Geheimtext' : 'Dein Klartext');
      return {
        schritte: ein.map((x, i) => ({
          text: (e) => {
            const sb = schluesselBei(i, e);
            if (porta) return `Buchstabe ${ver ? Krypto.klein(x) : x}, Schlüssel ${sb}: Tafelzeile ${sb}`;
            return ver ? `Klartext ${Krypto.klein(x)}, Schlüssel ${sb}: Zeile ${sb}, Spalte ${Krypto.klein(x)}` : `Geheimtext ${x}, Schlüssel ${sb}: in Zeile ${sb} suchen`;
          },
          feld: { beschriftung: ver ? 'Geheimtextbuchstabe' : 'Klartextbuchstabe', art: 'buchstabe' }
        })),
        markiere(i, eintraege) {
          const sb = schluesselBei(i, eintraege);
          const x = ein[i];
          if (porta) {
            const zeile = sb === '?' ? [] : [Krypto.teileMitRest(Krypto.wert(sb, 0), 2).q];
            tafel.kopfMarke(zeile, Krypto.wert(x, 0) < 13 ? [Krypto.wert(x, 0)] : []);
          } else tafel.kopfMarke(sb === '?' ? [] : [Krypto.wert(sb, 0)], ver ? [Krypto.wert(x, 0)] : []);
          band.setze(eintraege.map((y) => (ver ? y : Krypto.klein(y))));
        },
        korrekt() {
          const t = ein.join('');
          const aus = md === 'autokey' ? Krypto.autokey(t, s0, ver ? 'ver' : 'ent') : porta ? Krypto.porta(t, s0, ver ? 'ver' : 'ent') : Krypto.vigenere(t, pendel || s0, ver ? 'ver' : 'ent');
          return [...aus].map((y) => (ver ? y : Krypto.klein(y)));
        }
      };
    }
    function kasiskiHook(container, werte) {
      const t = Krypto.nurBuchstaben(String(werte.text || '')).slice(0, 600);
      const leiste = KRGefuehrt.leiste(container, t, { titel: 'Geheimtext (Positionen ab 0) – suche Folgen ab 3 Buchstaben, die mehrfach vorkommen' });
      let kas = { wiederholungen: [] };
      try {
        kas = Krypto.kasiski(t, { min: 3 });
      } catch {
        kas = { wiederholungen: [] };
      }
      const anzahl = Math.min(3, kas.wiederholungen.length);
      const schritte = [];
      for (let j = 0; j < anzahl; j++) {
        schritte.push({ text: `Folge ${j + 1}: Welche Buchstabenfolge findest du mehrfach?`, feld: { beschriftung: 'Folge', art: 'text' } });
        schritte.push({ text: `Folge ${j + 1}: Position des ersten Vorkommens (ab 0)`, feld: { beschriftung: 'Position', art: 'zahl' } });
        schritte.push({ text: `Folge ${j + 1}: Position des nächsten Vorkommens (ab 0)`, feld: { beschriftung: 'Position', art: 'zahl' } });
        schritte.push({ text: `Folge ${j + 1}: Abstand der beiden Vorkommen`, feld: { beschriftung: 'Abstand', art: 'zahl' } });
      }
      return {
        schritte,
        markiere(i, e) {
          // markiert werden nur Stellen aus deinen früheren Einträgen dieser Folge (keine automatische Suche)
          const j = Krypto.teileMitRest(i, 4).q;
          const folge = Krypto.nurBuchstaben(e[4 * j] || '');
          const pos = [];
          for (const k of [1, 2]) {
            const p = Number(e[4 * j + k]);
            if (4 * j + k < i && e[4 * j + k] !== '' && Number.isInteger(p) && p >= 0) for (let x = 0; x < Math.max(1, folge.length); x++) pos.push(p + x);
          }
          leiste.markiere(pos);
        },
        korrekt: () => kas.wiederholungen.slice(0, anzahl).flatMap((w) => [w.folge, String(w.positionen[0]), String(w.positionen[1]), String(w.abstaende[0])])
      };
    }
    function teiltexteHook(container, werte) {
      const t = Krypto.nurBuchstaben(String(werte.text || '')).slice(0, 600);
      const k = Number.isInteger(werte.k) && werte.k >= 1 ? werte.k : 1;
      const leiste = KRGefuehrt.leiste(container, t, { titel: `Geheimtext (Positionen ab 0), Schlüssellänge k = ${k}` });
      const baender = Array.from({ length: k }, (_, j) => KRGefuehrt.band(container, `T${j + 1}`));
      const positionen = [];
      for (let j = 0; j < k; j++) for (let p = j; p < t.length; p += k) positionen.push({ j, p });
      return {
        schritte: positionen.map(({ j, p }) => ({ text: `Teiltext T${j + 1}: Buchstabe an Position ${p}`, feld: { beschriftung: 'Buchstabe', art: 'buchstabe' } })),
        markiere(i, e) {
          leiste.markiere([positionen[i].p]);
          baender.forEach((bd, j) => bd.setze(positionen.map((x, n) => (x.j === j ? e[n] : null)).filter((x) => x !== null)));
        },
        korrekt: () => positionen.map(({ p }) => t[p])
      };
    }
    function koinzidenzHook(container, werte) {
      const t = Krypto.nurBuchstaben(String(werte.text || '')).slice(0, 600);
      KRGefuehrt.leiste(container, t, { titel: `Text (n = ${t.length} Buchstaben, Positionen ab 0)` });
      const alphabet = KRGefuehrt.raster(container, { zeilen: 1, spalten: 26, caption: 'Zähle jeden Buchstaben selbst', zeilenKopf: () => 'nᵢ', spaltenKopf: (ss) => BUCHSTABEN[ss] });
      const schritte = BUCHSTABEN.map((b) => ({ text: `Wie oft kommt ${b} vor?`, feld: { beschriftung: `Anzahl n(${b})`, art: 'zahl' } }));
      schritte.push({ text: 'Zähler: Σ nᵢ(nᵢ − 1) aus deinen Anzahlen', feld: { beschriftung: 'Σ nᵢ(nᵢ − 1)', art: 'zahl' } });
      schritte.push({ text: `Nenner: n(n − 1) mit n = ${t.length}`, feld: { beschriftung: 'n(n − 1)', art: 'zahl' } });
      schritte.push({ text: 'I = Zähler : Nenner (4 Nachkommastellen, mit Komma)', feld: { beschriftung: 'I', art: 'zahl' } });
      return {
        schritte,
        markiere(i, e) {
          alphabet.leeren();
          e.slice(0, 26).forEach((x, j) => x && alphabet.eintrag(0, j, x));
          alphabet.kopfMarke([], i < 26 ? [i] : []);
        },
        korrekt() {
          const hf = Krypto.haeufigkeiten(t);
          const br = Krypto.koinzidenzindexBruch(t);
          return [...BUCHSTABEN.map((b) => String(hf[b] || 0)), String(br ? br.zaehler : 0), String(br ? br.nenner : 0), (Krypto.koinzidenzindex(t) || 0).toFixed(4).replace('.', ',')];
        }
      };
    }
    const HOOKS = { verschluesseln: verschluesselnHook, kasiski: kasiskiHook, teiltexte: teiltexteHook, koinzidenz: koinzidenzHook };
    function starteGefuehrt(id, werte) {
      const fokus = typeof document !== 'undefined' && document.activeElement && wurzel.contains(document.activeElement);
      schliesseTeile();
      AQ.clear(r.flaeche);
      zuletzt = id;
      gefuehrt = KRGefuehrt.starte(r.flaeche, HOOKS[id], {
        werte,
        umgebung,
        aufgabe: fuehrung && fuehrung.aufgabe ? fuehrung.aufgabe : null,
        titel: 'Vigenère-Werkbank',
        beiEigeneWerte: () => {
          if (erkVerlauf) erkVerlauf.leeren();
          fuehrung = null;
          text = '';
          wort = '';
          baue(id);
        },
        text: {
          beschriftung: id === 'verschluesseln' && werte.richtung !== 'ent' ? 'Klartext' : 'Geheimtext',
          wert: werte.text || '',
          fokus,
          beiAenderung: (t) => {
            text = t;
            baue(id);
            B.fokusAmEnde(r.flaeche);
          }
        }
      });
    }

    function baue(id) {
      if (fuehrung && mitGefuehrt && HOOKS[id]) {
        const w = { text, schluessel: wort, modus, richtung, k: A.st.k, ...(fuehrung.werte || {}) };
        fuehrung = { aufgabe: fuehrung.aufgabe };
        starteGefuehrt(id, w);
        return;
      }
      schliesseTeile();
      AQ.clear(r.flaeche);
      zuletzt = id;
      if (id === 'quadrat') baueQuadrat();
      else if (id === 'verschluesseln') baueVerschluesseln();
      else baueAnalyse(id);
    }
    baue(r.aktiv());

    function zustandVer() {
      const t = Krypto.nurBuchstaben(text);
      const s = Krypto.nurBuchstaben(wort).slice(0, 20);
      if (!t || !s) return { strom: '', ausgabe: '' };
      try {
        const folge = modus === 'pendel' ? Krypto.pendelFolge(s) : s;
        return {
          strom: Krypto.schluesselstrom(t, s, { modus: modus === 'autokey' ? 'autokey' : modus === 'pendel' ? 'pendel' : 'vigenere', richtung }),
          ausgabe: modus === 'autokey' ? Krypto.autokey(t, s, richtung) : modus === 'porta' ? Krypto.porta(t, s, richtung) : Krypto.vigenere(t, folge, richtung)
        };
      } catch {
        return { strom: '', ausgabe: '' };
      }
    }

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: zuletzt, modus, richtung, text, schluessel: Krypto.nurBuchstaben(wort), ...zustandVer(), zelle, ...(A ? A.zustand() : {}) };
      }
    };
  }

  KRLabor.registriere('vigenere', { titel: 'Vigenère-Werkbank', oeffne });
})();
