/* Kryptos – Labor-Werkzeug „Substitutions-Werkbank“ (W1 §9.2, Plan M6 Task 115, E74, E78). Der Geheimtext ist das
   Objekt: jede Zuordnung verändert sofort den Live-Klartext darunter. Zuordnungstabelle (Anzahl, Rang, Eingabefeld je
   Geheimbuchstabe), Konflikte sichtbar, Rückgängig/Wiederholen, Hinweise (Referenzrang, häufige Bigramme/Trigramme,
   Musterwortsuche), Verlauf zum Nachspielen, Funkraum-Haken umgebung.beiAenderung (höchstens alle 2 s).
   Kein Richtig/Falsch, keine automatische Lösung. Rechnet nur über Krypto.*; speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  // erfunden: Krypto.substitution('die werkbank deckt jede wahl prompt im lesetext auf', Krypto.schluesselwortAlphabet('tinte'))
  const BEISPIEL = { text: 'EFAWA QHITL HEANH SGAEA WTDJO QMKOS FKJAR ASAXS TUB' };
  const BUCHSTABEN = [...Krypto.ALPHABET];
  const MAX = 3000;
  const FUNK_MS = 2000;

  /** deutsche Buchstaben nach Häufigkeit (Beutelspacher), Gleichstand alphabetisch. */
  const DEUTSCH_RANG = BUCHSTABEN.slice().sort((x, y) => Krypto.DEUTSCH[y] - Krypto.DEUTSCH[x] || x.localeCompare(y));

  /** Zuordnung bereinigen: Geheim GROSS → genau ein Klartextbuchstabe klein. */
  function bereinige(z) {
    const aus = {};
    if (!z || typeof z !== 'object' || Array.isArray(z)) return aus;
    for (const [g, k] of Object.entries(z)) {
      const gn = Krypto.nurBuchstaben(String(g));
      const kn = Krypto.nurBuchstaben(String(k ?? ''));
      if (gn.length === 1 && kn.length === 1) aus[gn] = Krypto.klein(kn);
    }
    return aus;
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const u = umgebung || {};
    let text = Krypto.nurBuchstaben(typeof v.text === 'string' ? v.text.slice(0, MAX) : BEISPIEL.text);
    const vorgabe = bereinige(v.vorgabe);
    let zuordnung = { ...vorgabe };
    const verlauf = [{ zuordnung: { ...vorgabe }, text: 'Start' }];
    let zeiger = 0;
    let hinweiseAn = false;
    let muster = '';
    let funkTimer = null;
    let nachspiel = null;

    /* ---------- Aufbau ---------- */
    const feldText = B.textfeld({
      beschriftung: 'Geheimtext (bis 3 000 Zeichen)',
      max: MAX,
      wert: typeof v.text === 'string' ? v.text.slice(0, MAX) : BEISPIEL.text,
      art: 'geheimtext',
      zeilen: 2,
      beiEingabe: (t) => {
        text = Krypto.nurBuchstaben(t);
        zeigeAlles();
      }
    });
    const textOrt = h('div', { class: 'werkbank-text' });
    const klartext = h('p', { class: 'werkbank-klartext', 'aria-live': 'polite' });
    const fortschritt = h('p', { class: 'werkbank-fortschritt' });
    const hinweisOrt = h('div', { class: 'werkbank-hinweise' });

    const felder = new Map();
    const zellen = { anzahl: new Map(), rang: new Map(), referenz: new Map() };
    const referenzZeilen = [];
    function haelfte(von, bis) {
      const spalten = BUCHSTABEN.slice(von, bis);
      const kopf = spalten.map((g) => h('th', { scope: 'col', 'data-geheim': g }, h('span', { class: 'werkbank-geheim' }, g), vorgabe[g] ? h('span', { class: 'werkbank-schloss', 'aria-hidden': 'true', title: 'vorgegeben' }, ' 🔒') : null));
      const zeile = (titel, art) => h('tr', { class: `werkbank-${art}` }, h('th', { scope: 'row' }, titel), spalten.map((g) => {
        const td = h('td', { class: art, 'data-geheim': g });
        zellen[art].set(g, td);
        return td;
      }));
      const ref = zeile('Deutsch (Rang)', 'referenz');
      referenzZeilen.push(ref);
      const eingaben = spalten.map((g) => {
        const f = h('input', { type: 'text', class: 'zuordnung', 'data-geheim': g, maxlength: '1', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': vorgabe[g] ? `Klartext zu ${g} (vorgegeben)` : `Klartext zu ${g}` });
        if (vorgabe[g]) f.readOnly = true;
        felder.set(g, f);
        return h('td', { class: 'eingabe' }, f, h('span', { class: 'konflikt-zeichen', 'aria-hidden': 'true' }));
      });
      return h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'werkbank' },
          h('caption', { class: 'sr' }, `Zuordnungstabelle ${spalten[0]} bis ${spalten[spalten.length - 1]}: Geheimbuchstabe, Anzahl, Rang, Klartextbuchstabe`),
          h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'ecke' }, 'Geheim'), kopf)),
          h('tbody', null, zeile('Anzahl', 'anzahl'), zeile('Rang', 'rang'), ref, h('tr', { class: 'werkbank-klar' }, h('th', { scope: 'row' }, 'Klartext'), eingaben))
        )
      );
    }
    const tabelle = h('div', { class: 'werkbank-haelften' }, haelfte(0, 13), haelfte(13, 26));

    const knopf = (klasse, text, titel) => h('button', { type: 'button', class: `knopf knopf-leise ${klasse}`, title: titel || null }, text);
    const kZurueck = knopf('rueckgaengig', '↶ Rückgängig', 'Strg + Z');
    const kWieder = knopf('wiederholen', '↷ Wiederholen', 'Strg + Y');
    const kReset = knopf('zuruecksetzen', 'Alle zurücksetzen');
    const hinweisSchalter = h('input', { type: 'checkbox', class: 'hinweise-an', id: B.neueId('werkbank-hinweise') });
    const musterFeld = h('input', { type: 'text', class: 'muster', id: B.neueId('werkbank-muster'), maxlength: '12', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'z. B. ABA' });
    const musterStatus = h('p', { class: 'muster-status text-2', role: 'status' });
    const hinweisBereich = h(
      'div',
      { class: 'werkbank-hilfen', hidden: true },
      h('div', { class: 'labor-textfeld werkbank-muster' }, h('label', { for: musterFeld.id }, 'Zeige Stellen mit Muster (2–12 Buchstaben, z. B. ABA)'), musterFeld, musterStatus),
      h('p', { class: 'werkbank-legende text-2' }, 'Markiert im Geheimtext: durchgezogen = Musterfundstelle, gestrichelt = häufigste Bigramme, gepunktet = häufigstes Trigramm.')
    );
    const steuer = h(
      'div',
      { class: 'werkbank-steuer' },
      h('div', { class: 'knopf-reihe' }, kZurueck, kWieder, kReset),
      h('label', { class: 'werkbank-schalter', for: hinweisSchalter.id }, hinweisSchalter, ' Hinweise')
    );
    const verlaufOrt = h('div', { class: 'verlauf-ort' });
    const verlaufText = h('p', { class: 'verlauf-klartext' });
    const verlauf_ = B.details('Verlauf nachspielen', [verlaufText, verlaufOrt], { klasse: 'werkbank-verlauf' });

    const wurzel = h(
      'div',
      { class: 'labor-werkzeug werkbank-werkzeug' },
      feldText.element,
      textOrt,
      h('div', { class: 'werkbank-klartext-rahmen' }, h('span', { class: 'werkbank-klartext-titel' }, 'Live-Klartext'), klartext),
      fortschritt,
      hinweisOrt,
      steuer,
      hinweisBereich,
      tabelle,
      verlauf_,
      h('p', { class: 'werkbank-grenze text-2' }, 'Die Werkbank sagt nicht, ob eine Zuordnung stimmt – sie zeigt nur, was daraus folgt.')
    );
    container.appendChild(wurzel);

    /* ---------- Anzeige ---------- */
    function konfliktGruppen() {
      const nachKlar = new Map();
      for (const [g, k] of Object.entries(zuordnung)) {
        if (!nachKlar.has(k)) nachKlar.set(k, []);
        nachKlar.get(k).push(g);
      }
      return [...nachKlar].filter(([, gs]) => gs.length > 1);
    }

    function markierungen() {
      if (!hinweiseAn || !text) return [];
      const m = [];
      if (muster) {
        try {
          for (const p of Krypto.musterSuchen(text, muster)) m.push({ von: p, laenge: muster.length, art: 'a', klasse: 'muster' });
        } catch (e) {
          if (!e || e.name !== 'KryptoFehler') throw e;
        }
      }
      if (text.length >= 3) for (const t of Krypto.ngramme(text, { n: 3, top: 1 }).filter((x) => x.anzahl > 1)) for (const p of t.positionen) m.push({ von: p, laenge: 3, art: 'c', klasse: 'trigramm' });
      if (text.length >= 2) for (const b of Krypto.ngramme(text, { n: 2, top: 3 }).filter((x) => x.anzahl > 1)) for (const p of b.positionen) m.push({ von: p, laenge: 2, art: 'b', klasse: 'bigramm' });
      return m;
    }

    function zeigeMuster() {
      if (!muster) {
        musterStatus.textContent = '';
        return;
      }
      try {
        const treffer = Krypto.musterSuchen(text, muster);
        musterStatus.textContent = treffer.length ? `${muster.toUpperCase()}: ${treffer.length} ${treffer.length === 1 ? 'Stelle' : 'Stellen'} (Positionen ${treffer.join(', ')}, ab 0)` : `${muster.toUpperCase()}: keine Stelle gefunden.`;
      } catch (e) {
        if (!e || e.name !== 'KryptoFehler') throw e;
        musterStatus.textContent = e.message;
      }
    }

    function zeigeAlles() {
      const anzahl = Krypto.haeufigkeiten(text);
      const rang = Krypto.rangfolge(text);
      AQ.mount(textOrt, text ? KRB.geheimtext(text, { kopieren: false, positionen: true, markiert: markierungen() }) : h('p', { class: 'text-2' }, 'Gib oben einen Geheimtext ein.'));
      const live = text ? Krypto.teilsubstitution(text, zuordnung) : '';
      AQ.mount(
        klartext,
        Krypto.gruppieren(live)
          .split(' ')
          .map((gr, i) => [i ? ' ' : null, h('span', { class: 'gruppe' }, [...gr].map((c) => (c === '·' ? c : h('b', { class: 'bekannt' }, c))))])
      );
      const konflikte = konfliktGruppen();
      const imKonflikt = new Set(konflikte.flatMap(([, gs]) => gs));
      for (const g of BUCHSTABEN) {
        const f = felder.get(g);
        if (document.activeElement !== f || f.value !== (zuordnung[g] || '')) f.value = zuordnung[g] || '';
        const r = rang.indexOf(g);
        zellen.anzahl.get(g).textContent = String(anzahl[g]);
        zellen.rang.get(g).textContent = r < 0 ? '–' : String(r + 1);
        zellen.referenz.get(g).textContent = r < 0 ? '–' : Krypto.klein(DEUTSCH_RANG[r]);
        f.classList.toggle('konflikt', imKonflikt.has(g));
        f.setAttribute('aria-invalid', String(imKonflikt.has(g)));
        f.nextSibling.textContent = imKonflikt.has(g) ? '!' : '';
        f.closest('td').classList.toggle('fehlt', anzahl[g] === 0);
      }
      for (const z of referenzZeilen) z.hidden = !hinweiseAn;
      hinweisBereich.hidden = !hinweiseAn;
      AQ.clear(hinweisOrt);
      for (const [k, gs] of konflikte) hinweisOrt.appendChild(B.hinweis('warnung', `${k} ist schon ${gs.slice(0, -1).join(', ')} zugeordnet (jetzt auch ${gs[gs.length - 1]}).`));
      const verschieden = rang.length;
      const zugeordnet = rang.filter((g) => zuordnung[g]).length;
      fortschritt.textContent = `${zugeordnet} von ${verschieden} verschiedenen Geheimbuchstaben zugeordnet`;
      kZurueck.disabled = zeiger <= 0;
      kWieder.disabled = zeiger >= verlauf.length - 1;
      zeigeMuster();
      if (verlauf_.open) baueVerlauf();
    }

    /* ---------- Änderungen, Verlauf, Funkraum ---------- */
    function melde() {
      if (typeof u.beiAenderung !== 'function' || funkTimer) return;
      funkTimer = setTimeout(() => {
        funkTimer = null;
        u.beiAenderung({ ...zuordnung });
      }, FUNK_MS);
    }
    function aendere(neu, beschreibung) {
      zuordnung = neu;
      verlauf.splice(zeiger + 1);
      verlauf.push({ zuordnung: { ...neu }, text: beschreibung });
      zeiger = verlauf.length - 1;
      zeigeAlles();
      melde();
    }
    function setze(g, k) {
      if (vorgabe[g]) return;
      const alt = zuordnung[g] || '';
      if (alt === k) return;
      const neu = { ...zuordnung };
      if (k) neu[g] = k;
      else delete neu[g];
      aendere(neu, k ? `${g} ↦ ${k}` : `${g} gelöscht`);
    }
    function springe(stand) {
      zeiger = stand;
      zuordnung = { ...verlauf[zeiger].zuordnung };
      zeigeAlles();
      melde();
    }
    const rueckgaengig = () => zeiger > 0 && springe(zeiger - 1);
    const wiederholen = () => zeiger < verlauf.length - 1 && springe(zeiger + 1);
    kZurueck.addEventListener('click', rueckgaengig);
    kWieder.addEventListener('click', wiederholen);
    kReset.addEventListener('click', () => {
      if (Object.keys(zuordnung).length !== Object.keys(vorgabe).length) aendere({ ...vorgabe }, 'alle zurückgesetzt');
    });

    function baueVerlauf() {
      if (nachspiel) nachspiel.schliesse();
      AQ.clear(verlaufOrt);
      const schritte = verlauf.slice(0, zeiger + 1).map((s, i) => ({ text: i ? `Schritt ${i}: ${s.text}` : 'Start: noch nichts zugeordnet', daten: { i } }));
      nachspiel = KRLabor.nachspiel(verlaufOrt, {
        titel: 'Jede Zuordnung ein Schritt',
        start: schritte.length - 1,
        schritte,
        zeige(_s, i) {
          verlaufText.textContent = text ? Krypto.gruppieren(Krypto.teilsubstitution(text, verlauf[i].zuordnung)) : '';
        },
        beiLauf(an) {
          for (const f of felder.values()) f.disabled = an;
          feldText.sperre(an);
        }
      });
    }
    verlauf_.addEventListener('toggle', () => {
      if (verlauf_.open) baueVerlauf();
      else if (nachspiel) {
        nachspiel.schliesse();
        nachspiel = null;
      }
    });

    /* ---------- Tastatur und Eingabe ---------- */
    const reihenfolge = () => BUCHSTABEN.map((g) => felder.get(g));
    function naechstes(g) {
      const i = BUCHSTABEN.indexOf(g);
      return BUCHSTABEN.slice(i + 1).find((x) => text.includes(x) && !vorgabe[x]) || null;
    }
    for (const [g, f] of felder) {
      f.addEventListener('focus', () => {
        if (typeof f.select === 'function') f.select();
      });
      f.addEventListener('input', () => {
        if (vorgabe[g]) return;
        const roh = Krypto.nurBuchstaben(f.value);
        const k = roh ? Krypto.klein(roh.slice(-1)) : '';
        f.value = k;
        setze(g, k);
        if (k) {
          const n = naechstes(g);
          if (n) felder.get(n).focus();
        }
      });
      f.addEventListener('keydown', (e) => {
        const liste = reihenfolge();
        const i = liste.indexOf(f);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const ziel = liste[i + (e.key === 'ArrowRight' ? 1 : -1)];
          if (ziel) ziel.focus();
          e.preventDefault();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          if (!vorgabe[g]) {
            f.value = '';
            setze(g, '');
          }
        }
      });
    }
    wurzel.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target && e.target.localName === 'textarea')) return;
      const taste = String(e.key).toLowerCase();
      if (taste === 'z' && !e.shiftKey) {
        e.preventDefault();
        rueckgaengig();
      } else if (taste === 'y' || (taste === 'z' && e.shiftKey)) {
        e.preventDefault();
        wiederholen();
      }
    });
    hinweisSchalter.addEventListener('change', () => {
      hinweiseAn = hinweisSchalter.checked;
      zeigeAlles();
    });
    musterFeld.addEventListener('input', () => {
      muster = musterFeld.value.trim();
      zeigeAlles();
    });

    zeigeAlles();

    return {
      schliesse() {
        if (funkTimer) clearTimeout(funkTimer);
        funkTimer = null;
        if (nachspiel) nachspiel.schliesse();
        nachspiel = null;
      },
      zustand() {
        const rang = Krypto.rangfolge(text);
        return {
          text,
          zuordnung: { ...zuordnung },
          klartext: text ? Krypto.teilsubstitution(text, zuordnung) : '',
          konflikte: konfliktGruppen().flatMap(([, gs]) => gs).sort(),
          zugeordnet: rang.filter((g) => zuordnung[g]).length,
          verschieden: rang.length
        };
      }
    };
  }

  KRLabor.registriere('substitution', { titel: 'Substitutions-Werkbank', oeffne });
})();
