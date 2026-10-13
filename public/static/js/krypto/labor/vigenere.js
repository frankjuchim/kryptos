/* Kryptos – Labor-Werkzeug „Vigenère-Werkbank“ (W2 §9.1, W6 §9.1, Plan M6 Tasks 116/117). Das Quadrat ist das
   Objekt: Zelle antippen → Zeile, Spalte, Kreuzung und die Rechnung; Ver-/Entschlüsseln (Vigenère, Autokey, Porta,
   ab Welt 6 Pendel und frei) Buchstabe für Buchstabe nachspielen. Angriff: Kasiski, Teiltexte, Koinzidenzindex (eA),
   Verschiebung je Spalte, manuelle Korrektur – jeder Schritt sichtbar, keine automatische „Antwort“.
   Rechnet nur über Krypto.*; Grundrechenarten nur für die Anzeige einer Rechnung. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = { klartext: 'kerze', schluessel: 'LICHT' };
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
    let wort = mitText ? '' : BEISPIEL.schluessel;
    let modus = MODI.some((m) => m.id === v.modus) && modusErlaubt(v.modus) ? v.modus : 'vigenere';
    let richtung = v.richtung === 'ent' ? 'ent' : 'ver';
    let basis = 1;
    let zelle = null; // { zeile, spalte } im Quadrat
    let nachspiel = null;
    const A = analyse(v);

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug vigenere-werkzeug' }, r.element);
    container.appendChild(wurzel);

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
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
    function analyse() {
      return null;
    }
    function baueAnalyse() {
      r.flaeche.append(B.hinweis('info', 'Dieser Bereich ist noch in Arbeit.'));
    }

    let zuletzt = null;
    function baue(id) {
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
