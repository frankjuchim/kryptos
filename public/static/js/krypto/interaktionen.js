/* Kryptos – Interaktionen im Client (Delta §8, TECHNIK §4.4), registriert über AQI.registriere:
   chiffre (Task 54), zuordnung (Task 55), schaubild-ergaenzen und bits-rechnen (Task 56). Prüfung NUR auf dem Server: Die Oberfläche berechnet nie eine Lösung (auch nicht zur Längen-
   bestimmung, E26) und zeigt Lösungen nur aus Server-Antworten. Antwortformen = Server-Verträge
   (src/krypto/interaktionen/*.js, bereinige). Alles als DOM-Textknoten (AQ.h), keine Inline-Styles (CSP). */
'use strict';

const KRI = (() => {
  const { h, toast } = AQ;

  /** Anzeigenamen der Verfahren (verfahren.name geht vor). */
  const VERFAHREN = Object.freeze({
    caesar: 'Caesar',
    atbash: 'Atbash',
    affin: 'Affine Chiffre',
    substitution: 'Monoalphabetische Substitution',
    vigenere: 'Vigenère',
    autokey: 'Autokey',
    porta: 'Porta',
    playfair: 'Playfair',
    kreuzquadrat: 'Kreuzquadrat',
    zweiquadrat_zahl: 'Zwei-Quadrat',
    polybios: 'Polybios',
    adfgvx: 'ADFGVX',
    gartenzaun: 'Gartenzaun',
    skytale: 'Skytale',
    fleissner: 'Fleißner-Schablone',
    spaltentransposition: 'Spaltentransposition',
    umkehrung: 'Umkehrung',
    xor: 'XOR',
    baukasten: 'Baukasten',
    frei: 'Fremdes Verfahren'
  });

  /* ================= chiffre (Delta §8.1) ================= */

  /** Längentreue Verfahren (ein Ausgabezeichen je Eingabezeichen). */
  const LAENGENTREU = new Set(['caesar', 'atbash', 'affin', 'substitution', 'vigenere', 'autokey', 'porta', 'gartenzaun', 'umkehrung']);
  /** Verfahren, bei denen Zeichen i der Ausgabe zu Zeichen i der Eingabe gehört (für „zu Geheimtextbuchstabe D“). */
  const ZEICHENTREU = new Set(['caesar', 'atbash', 'affin', 'substitution', 'vigenere', 'autokey', 'porta']);
  const MIT_ZIFFERN = new Set(['polybios', 'adfgvx', 'xor']);
  const MAX_KAESTCHEN = 60;

  const istObjekt = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const typVon = (ia) => (istObjekt(ia && ia.verfahren) ? String(ia.verfahren.typ || '') : '');

  /** Eingabe normalisiert (Ziffern nur bei polybios/adfgvx/xor, Delta §5.1). */
  function eingabeNorm(ia) {
    const t = String((ia && ia.eingabe) ?? '');
    return MIT_ZIFFERN.has(typVon(ia)) ? Krypto.normalisieren(t) : Krypto.nurBuchstaben(t);
  }

  /**
   * Kästchenzahl (E26): nur für längentreue Fälle aus der Eingabelänge, sonst null. Nie über Krypto.verfahren.anwenden
   * (die Lösung wird im Client nicht berechnet).
   */
  function laenge(ia) {
    if (!istObjekt(ia)) return null;
    const typ = typVon(ia);
    const n = eingabeNorm(ia).length;
    if (!n) return null;
    if (LAENGENTREU.has(typ)) return n;
    if (typ === 'spaltentransposition') return ia.verfahren.fuellzeichen ? null : n;
    if (typ === 'polybios' || typ === 'adfgvx') {
      if (ia.richtung === 'ver') return 2 * n;
      if (ia.richtung === 'ent') return n % 2 ? null : n / 2;
      return null;
    }
    if (typ === 'xor' && ia.ausgabe === 'hex' && ia.richtung === 'ver') return 2 * n;
    return null;
  }

  /** Anzeigename des Verfahrens. */
  function verfahrensName(ia) {
    const v = istObjekt(ia && ia.verfahren) ? ia.verfahren : {};
    if (typeof v.name === 'string' && v.name.trim()) return v.name;
    if (v.typ === 'baukasten' && istObjekt(v.verfahren) && typeof v.verfahren.name === 'string' && v.verfahren.name.trim()) return v.verfahren.name;
    return VERFAHREN[v.typ] || String(v.typ || 'Verfahren');
  }

  /** Zeichen, die ein Kästchen annimmt (nach Krypto-Normalisierung, GROSS). */
  function zeichenRegel(ia) {
    const typ = typVon(ia);
    if (ia.ausgabe === 'hex') return /^[0-9A-F]$/;
    if (MIT_ZIFFERN.has(typ) || typ === 'frei' || typ === 'baukasten') return /^[A-Z0-9]$/;
    return /^[A-Z]$/;
  }

  function teilChiffre(ia, kontext, nr) {
    const richtung = ia.richtung === 'ver' ? 'ver' : 'ent';
    const zahlen = ia.ausgabe === 'zahlen';
    const verdeckt = ia.schluesselVerdeckt === true;
    const regel = zeichenRegel(ia);
    const n = laenge(ia);
    const eingabe = eingabeNorm(ia);
    const darstellung = ia.darstellung === 'zeile' ? 'zeile' : ia.darstellung === 'zeichenweise' || (n !== null && n <= MAX_KAESTCHEN) ? 'zeichenweise' : 'zeile';
    const zeichentreu = n !== null && ZEICHENTREU.has(typVon(ia)) && n === eingabe.length;
    const gruppe = ia.gruppe === 0 ? 0 : 5;
    let gesperrt = false;

    const kopf = h(
      'div',
      { class: 'chiffre-kopf' },
      h('span', { class: 'chiffre-verfahren' }, `Verfahren: ${verfahrensName(ia)}`),
      h('span', { class: 'chiffre-richtung' }, richtung === 'ver' ? ' · verschlüsseln' : ' · entschlüsseln'),
      verdeckt ? h('span', { class: 'chiffre-verdeckt' }, ' · Schlüssel verdeckt') : null
    );
    const eingabeEl = richtung === 'ent' ? KRB.geheimtext(ia.eingabe, { positionen: false }) : KRB.geheimtext(ia.eingabe, { art: 'klar' });
    const ergebnis = h('p', { class: 'chiffre-ergebnis', 'aria-live': 'polite' });
    const box = h('div', { class: 'chiffre' + (darstellung === 'zeile' ? ' chiffre-als-zeile' : '') }, kopf, eingabeEl);

    /* ---------- Darstellung „zeile“ ---------- */
    let zeile = null;
    let vorschau = null;
    let zeichenFeedback = null;
    function zeichneVorschau() {
      if (!vorschau) return;
      const v = String(zeile.value || '');
      vorschau.textContent = zahlen ? v.trim().split(/[\s,;]+/).filter(Boolean).join(' ') : Krypto.gruppieren(Krypto.normalisieren(v), 5);
    }
    /* ---------- Darstellung „zeichenweise“ ---------- */
    const kaestchen = [];
    let reihe = null;
    let mehrKnopf = null;
    const hilfsArten = (Array.isArray(ia.hilfszeilen) ? ia.hilfszeilen : []).filter((x) => ['zahlen', 'schluessel', 'positionen'].includes(x) && !(x === 'schluessel' && verdeckt));

    /** Wert der Hilfszeile art an Position i (Text, '' = leer). */
    const hilfsWerte = {
      zahlen: (() => {
        try {
          return Krypto.zahlen(String(ia.eingabe ?? ''), ia.basis === 0 ? 0 : 1);
        } catch {
          return [];
        }
      })(),
      schluessel: (() => {
        const v = istObjekt(ia.verfahren) ? ia.verfahren : {};
        const s = typeof v.schluessel === 'string' ? Krypto.nurBuchstaben(v.schluessel) : '';
        if (!s || !['vigenere', 'porta', 'autokey'].includes(v.typ)) return null;
        return (i) => (v.typ === 'autokey' ? (i < s.length ? s[i] : '·') : s[i % s.length]);
      })()
    };
    const HILFS_LABEL = { zahlen: ['Zahl', 'Zahlenwerte der Eingabe'], schluessel: ['Schl.', 'Schlüssel'], positionen: ['Pos.', 'Positionen ab 0'] };
    function hilfsText(art, i) {
      if (art === 'positionen') return i % 5 === 0 ? String(i) : '';
      if (art === 'zahlen') return hilfsWerte.zahlen[i] === undefined ? '' : String(hilfsWerte.zahlen[i]);
      return hilfsWerte.schluessel ? hilfsWerte.schluessel(i) : '';
    }
    const hilfsArtenAktiv = hilfsArten.filter((art) => art !== 'schluessel' || hilfsWerte.schluessel);

    function kaestchenLabel(i, gesamt) {
      const basis = `${zahlen ? 'Zahl' : 'Zeichen'} ${i + 1} von ${gesamt}`;
      if (!zeichentreu || i >= eingabe.length) return basis;
      return richtung === 'ent' ? `${basis}, zu Geheimtextbuchstabe ${eingabe[i]}` : `${basis}, zu Klartextbuchstabe ${eingabe[i].toLowerCase()}`;
    }

    function neuesKaestchen() {
      const el = h('input', {
        class: 'kaestchen' + (zahlen ? ' zahl' : ''),
        type: 'text',
        maxlength: zahlen ? 2 : 1,
        inputmode: zahlen ? 'numeric' : ia.ausgabe === 'hex' ? 'text' : null,
        autocapitalize: 'characters',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: 'false'
      });
      el.addEventListener('input', () => eingabeIn(el));
      el.addEventListener('keydown', (ev) => taste(el, ev));
      el.addEventListener('focus', () => el.select());
      el.addEventListener('paste', (ev) => {
        const t = ev.clipboardData && ev.clipboardData.getData('text');
        if (typeof t !== 'string') return;
        ev.preventDefault();
        verteile(kaestchen.indexOf(el), t);
      });
      return el;
    }

    /** Zeichen eines Textes für Kästchen (normalisiert, nur erlaubte Zeichen); Zahlen: Ziffernfolgen. */
    function zerlege(t) {
      if (zahlen) return String(t).split(/[^0-9]+/).filter(Boolean).map((z) => z.slice(0, 2));
      return [...Krypto.normalisieren(String(t))].filter((c) => regel.test(c));
    }

    /** Text ab Kästchen i auf die folgenden Kästchen verteilen (Einfügen, Umlaut ä → AE). */
    function verteile(i, t) {
      if (i < 0 || gesperrt) return;
      const teile = zerlege(t);
      if (!teile.length) {
        kaestchen[i].value = '';
        geaendert(i);
        return;
      }
      let j = i;
      for (const z of teile) {
        if (j >= kaestchen.length) {
          if (!mehrKnopf) break;
          kaestchenAnhaengen(1);
        }
        kaestchen[j].value = z;
        markeWeg(kaestchen[j]);
        j++;
      }
      const ziel = kaestchen[Math.min(j, kaestchen.length - 1)];
      ziel.focus();
      geaendert(j - 1);
    }

    function markeWeg(el) {
      el.classList.remove('ok', 'falsch', 'loesung');
      el.removeAttribute('aria-invalid');
    }

    function eingabeIn(el) {
      const i = kaestchen.indexOf(el);
      const roh = String(el.value || '');
      if (gesperrt) return;
      markeWeg(el);
      if (roh === '') {
        geaendert(i);
        return;
      }
      if (zahlen) {
        const z = roh.replace(/[^0-9]/g, '').slice(0, 2);
        el.value = z;
        // Weiterspringen, wenn die Zahl fertig sein muss (zwei Ziffern oder erste Ziffer ≥ 3)
        if (z.length === 2 || (z.length === 1 && Number(z) >= 3)) {
          if (i + 1 < kaestchen.length) kaestchen[i + 1].focus();
        } else if (document.activeElement !== el) el.focus();
        geaendert(i);
        return;
      }
      const zeichen = zerlege(roh);
      if (zeichen.length > 1) return verteile(i, roh);
      el.value = zeichen[0] || '';
      if (el.value && i + 1 < kaestchen.length) kaestchen[i + 1].focus();
      else if (document.activeElement !== el) el.focus();
      geaendert(i);
    }

    function taste(el, ev) {
      const i = kaestchen.indexOf(el);
      if (ev.key === 'Backspace' && !el.value && i > 0) {
        ev.preventDefault();
        const vor = kaestchen[i - 1];
        vor.focus();
        if (!gesperrt && vor.value) {
          vor.value = '';
          markeWeg(vor);
          geaendert(i - 1);
        }
      } else if (ev.key === 'ArrowLeft' && i > 0) {
        ev.preventDefault();
        kaestchen[i - 1].focus();
      } else if (ev.key === 'ArrowRight' && i + 1 < kaestchen.length) {
        ev.preventDefault();
        kaestchen[i + 1].focus();
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        kaestchen[0].focus();
      } else if (ev.key === 'End') {
        ev.preventDefault();
        kaestchen[kaestchen.length - 1].focus();
      }
    }

    /** Kästchen neu gliedern (Gruppen zu 5, Hilfszeilen je Gruppe darüber, aria-label mit Gesamtzahl). */
    function gliedere() {
      const gesamt = kaestchen.length;
      const g = gruppe || gesamt || 1;
      const bloecke = [];
      for (let start = 0; start < gesamt; start += g) {
        const idx = [];
        for (let i = start; i < Math.min(gesamt, start + g); i++) idx.push(i);
        bloecke.push(
          h(
            'div',
            { class: 'kaestchen-block' },
            hilfsArtenAktiv.map((art) => h('div', { class: `hilfszeile hilfszeile-${art}`, 'aria-hidden': 'true' }, idx.map((i) => h('span', { class: 'hz' }, hilfsText(art, i))))),
            h('span', { class: 'kaestchen-gruppe', role: 'group', 'aria-label': `Zeichen ${start + 1} bis ${idx[idx.length - 1] + 1}` }, idx.map((i) => h('span', { class: 'kaestchen-zelle' }, kaestchen[i])))
          )
        );
      }
      kaestchen.forEach((el, i) => el.setAttribute('aria-label', kaestchenLabel(i, gesamt)));
      const labels = hilfsArtenAktiv.length
        ? h(
            'div',
            { class: 'hilfszeilen-labels', 'aria-hidden': 'true' },
            hilfsArtenAktiv.map((art) => h('span', { class: `hz-label hz-label-${art}` }, HILFS_LABEL[art][0])),
            h('span', { class: 'hz-label hz-label-antwort' }, zahlen ? 'Zahlen' : 'Antwort')
          )
        : null;
      AQ.mount(reihe, labels, bloecke);
    }

    function kaestchenAnhaengen(anzahl) {
      for (let k = 0; k < anzahl; k++) {
        const el = neuesKaestchen();
        if (gesperrt) el.disabled = true;
        kaestchen.push(el);
      }
      gliedere();
    }

    if (darstellung === 'zeichenweise') {
      reihe = h('div', { class: 'kaestchen-reihe' });
      const srHilfe = hilfsArtenAktiv.map((art) =>
        h('p', { class: 'sr' }, `${HILFS_LABEL[art][1]} (Hilfszeile): ${Array.from({ length: Math.max(n ?? eingabe.length, 0) }, (_, i) => hilfsText(art, i)).filter((x) => x !== '').join(' ')}`)
      );
      const legende = hilfsArtenAktiv.length ? h('p', { class: 'hilfszeilen-legende', 'aria-hidden': 'true' }, `Über den Kästchen: ${hilfsArtenAktiv.map((art) => HILFS_LABEL[art][1]).join(' · ')}`) : null;
      box.appendChild(h('div', { class: 'kaestchen-rahmen scroll-x' }, srHilfe, legende, reihe));
      for (let i = 0; i < (n ?? eingabe.length); i++) kaestchen.push(neuesKaestchen());
      gliedere();
      if (n === null) {
        mehrKnopf = h('button', { type: 'button', class: 'knopf knopf-zweit mehr-kaestchen', onclick: () => {
          if (gesperrt) return;
          kaestchenAnhaengen(1);
          kaestchen[kaestchen.length - 1].focus();
        } }, '＋ Kästchen');
        box.appendChild(h('div', { class: 'knopf-reihe' }, mehrKnopf));
      }
    } else {
      zeile = h('input', { class: 'chiffre-zeile', type: 'text', 'aria-label': 'Antwort', autocomplete: 'off', autocorrect: 'off', autocapitalize: zahlen ? 'off' : 'characters', spellcheck: 'false', inputmode: zahlen ? 'numeric' : null });
      vorschau = h('div', { class: 'chiffre-zeile-vorschau', 'aria-hidden': 'true' });
      zeichenFeedback = h('div', { class: 'zeichen-feedback', 'aria-hidden': 'true' });
      zeile.addEventListener('input', () => {
        zeile.classList.remove('ok', 'falsch', 'loesung');
        zeile.removeAttribute('aria-invalid');
        zeichenFeedback.replaceChildren();
        zeichneVorschau();
        kontext.geaendert();
      });
      box.appendChild(h('div', { class: 'chiffre-zeile-rahmen' }, zeile, vorschau, zeichenFeedback));
    }
    box.appendChild(ergebnis);

    /* ---------- Schrittprüfung (Präfix ab Position 0) ---------- */
    function wertVon(el) {
      if (!zahlen) return el.value || '';
      return el.value === '' ? null : Number(el.value);
    }
    async function geaendert(i) {
      ergebnis.textContent = '';
      kontext.geaendert();
      if (i < 0 || !kontext.schrittAktiv(self)) return;
      const praefix = kaestchen.slice(0, i + 1);
      if (!praefix.length || praefix.some((el) => el.value === '')) return;
      const antwort = zahlen ? praefix.map(wertVon) : praefix.map((el) => el.value).join('');
      const r = await kontext.schritt(nr, antwort);
      if (!r) return;
      const falsch = r.ok === false && Number.isInteger(r.ersteFalschePosition) ? r.ersteFalschePosition : r.ok === false ? i : null;
      praefix.forEach((el, j) => {
        if (falsch !== null && j > falsch) return;
        const ok = falsch === null || j < falsch;
        el.classList.toggle('ok', ok);
        el.classList.toggle('falsch', !ok);
        if (ok) el.removeAttribute('aria-invalid');
        else el.setAttribute('aria-invalid', 'true');
      });
      if (falsch !== null) toast(`Zeichen ${falsch + 1} stimmt nicht (Fehlversuch).`, true);
      else if (r.vollstaendig) ergebnis.textContent = 'Alle Zeichen richtig.';
    }

    /* ---------- Antwort, Rückmeldung, Lösung ---------- */
    function setzeKaestchen(werte) {
      if (werte.length > kaestchen.length && mehrKnopf) kaestchenAnhaengen(werte.length - kaestchen.length);
      kaestchen.forEach((el, i) => {
        const w = werte[i];
        el.value = w === null || w === undefined || w === '_' ? '' : String(w);
        markeWeg(el);
      });
    }
    /** Text (kanonische Form, '_' = leeres Kästchen) bzw. Zahlen in eine Liste je Kästchen zerlegen. */
    function alsWerte(a) {
      if (Array.isArray(a)) return a.map((x) => (x === null || x === undefined ? '' : String(x)));
      const t = String(a ?? '');
      if (zahlen) return t.split(/[\s,;]+/).filter(Boolean).map((x) => (x === '_' ? '' : x));
      return t
        .split('_')
        .map((stueck) => [...Krypto.normalisieren(stueck)])
        .reduce((acc, z, k) => (k ? [...acc, '', ...z] : z), []);
    }

    const self = {
      kind: 'chiffre',
      ui: box,
      antwort() {
        if (zeile) return zeile.value;
        return kaestchen.map(wertVon);
      },
      leer() {
        if (zeile) return String(zeile.value || '').trim() === '';
        return kaestchen.every((el) => el.value === '');
      },
      setze(a) {
        if (a === null || a === undefined) return;
        if (istObjekt(a)) a = a.text ?? a.zeichen;
        if (zeile) {
          zeile.value = Array.isArray(a) ? a.map((x) => (x === null || x === '' ? '_' : x)).join(zahlen ? ' ' : '') : String(a ?? '');
          zeichneVorschau();
          return;
        }
        setzeKaestchen(alsWerte(a));
      },
      feedback(r) {
        if (!r) return;
        const z = Array.isArray(r.zeichen) ? r.zeichen : null;
        if (zeile) {
          zeile.classList.toggle('ok', !!r.ok);
          zeile.classList.toggle('falsch', !r.ok);
          zeile.setAttribute('aria-invalid', r.ok ? 'false' : 'true');
          if (z) {
            const zeichen = zahlen ? String(zeile.value || '').split(/[\s,;]+/).filter(Boolean) : [...Krypto.normalisieren(String(zeile.value || ''))];
            zeichenFeedback.replaceChildren(...z.map((ok, i) => h('span', { class: 'zf ' + (ok ? 'ok' : 'falsch') }, h('span', { class: 'zf-zeichen' }, zeichen[i] ?? '·'), h('span', { class: 'zf-marke' }, ok ? '✓' : '✗'))));
          }
        } else if (z) {
          kaestchen.forEach((el, i) => {
            const ok = z[i] === true;
            el.classList.toggle('ok', ok);
            el.classList.toggle('falsch', !ok);
            el.setAttribute('aria-invalid', ok ? 'false' : 'true');
          });
        }
        if (z) ergebnis.textContent = `${z.filter((x) => x === true).length} von ${z.length} Zeichen richtig`;
      },
      loesung(lo, muster) {
        const text = istObjekt(lo) && lo.text !== undefined ? lo.text : muster;
        if (text === undefined || text === null) return;
        if (zeile) {
          zeile.value = zahlen ? String(text) : Krypto.gruppieren(Krypto.normalisieren(String(text)), 5);
          zeile.classList.remove('ok', 'falsch');
          zeile.classList.add('loesung');
          zeichenFeedback.replaceChildren();
          zeichneVorschau();
          return;
        }
        setzeKaestchen(alsWerte(text));
        kaestchen.forEach((el) => el.classList.add('loesung'));
      },
      sperren(an) {
        gesperrt = !!an;
        kaestchen.forEach((el) => (el.disabled = gesperrt));
        if (zeile) zeile.disabled = gesperrt;
        if (mehrKnopf) mehrKnopf.disabled = gesperrt;
      }
    };
    return self;
  }

  /* ================= zuordnung (Delta §8.2, E28: Tippen/Tastatur, kein Ziehen) ================= */

  const MAX_VERLAUF = 20;

  function teilZuordnung(ia, kontext) {
    const geheim = Krypto.nurBuchstaben(String(ia.geheimtext ?? ''));
    const anzahl = Krypto.haeufigkeiten(geheim);
    const vorkommend = Object.keys(anzahl).filter((g) => anzahl[g] > 0);
    const vorgabe = {};
    if (istObjekt(ia.vorgabe)) {
      for (const [g, kl] of Object.entries(ia.vorgabe)) {
        const gg = Krypto.nurBuchstaben(String(g));
        const kk = Krypto.nurBuchstaben(String(kl ?? ''));
        if (gg.length === 1 && kk.length === 1 && anzahl[gg] > 0) vorgabe[gg] = kk;
      }
    }
    /** aktuelle Zuordnung Geheim → Klar (GROSS, '' = nicht vergeben) */
    let zu = {};
    const leereZuordnung = () => Object.fromEntries(vorkommend.map((g) => [g, vorgabe[g] || '']));
    zu = leereZuordnung();
    const verlauf = [];
    let sortierung = 'haeufigkeit';
    let gesperrt = false;

    const felder = new Map();
    const eintraege = new Map();
    const doppeltSr = new Map();
    const klarSpans = new Map(vorkommend.map((g) => [g, []]));

    const rueckgaengig = h('button', { type: 'button', class: 'knopf knopf-zweit rueckgaengig', disabled: true }, '↶ Rückgängig');
    const zuruecksetzen = h('button', { type: 'button', class: 'knopf knopf-zweit zuruecksetzen' }, 'Alles zurücksetzen');
    const sortKnoepfe = [
      ['haeufigkeit', 'nach Häufigkeit'],
      ['alphabetisch', 'alphabetisch']
    ].map(([wert, text]) => {
      const b = h('button', { type: 'button', class: 'knopf knopf-leise', 'aria-pressed': String(wert === sortierung) }, text);
      b.addEventListener('click', () => {
        sortierung = wert;
        sortKnoepfe.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        ordne();
      });
      return b;
    });
    const leiste = h('ul', { class: 'zuordnung-leiste', 'aria-label': 'Geheimbuchstaben und zugeordnete Klartextbuchstaben' });
    for (const g of vorkommend) {
      const fest = Object.hasOwn(vorgabe, g);
      const feld = h('input', {
        class: 'z-feld',
        type: 'text',
        maxlength: 1,
        autocapitalize: 'characters',
        autocomplete: 'off',
        autocorrect: 'off',
        spellcheck: 'false',
        'aria-label': `Geheimbuchstabe ${g}, ${anzahl[g]}-mal, Klartext:`,
        value: zu[g],
        disabled: fest
      });
      feld.addEventListener('input', () => eingabe(g, feld));
      feld.addEventListener('keydown', (ev) => taste(g, ev));
      feld.addEventListener('focus', () => feld.select());
      const sr = h('span', { class: 'sr' });
      doppeltSr.set(g, sr);
      const li = h(
        'li',
        { class: 'z-eintrag' + (fest ? ' vorgabe' : ''), 'data-g': g },
        h('span', { class: 'z-buchstabe', 'aria-hidden': 'true' }, g),
        h('span', { class: 'z-anzahl', 'aria-hidden': 'true' }, `${anzahl[g]}×`),
        feld,
        fest ? h('span', { class: 'sr' }, 'vorgegeben') : null,
        h('span', { class: 'z-marke', 'aria-hidden': 'true' }),
        sr
      );
      felder.set(g, feld);
      eintraege.set(g, li);
    }
    function ordne() {
      const reihe = [...vorkommend].sort((x, y) => (sortierung === 'alphabetisch' ? x.localeCompare(y) : anzahl[y] - anzahl[x] || x.localeCompare(y)));
      AQ.mount(leiste, reihe.map((g) => eintraege.get(g)));
    }
    ordne();

    // Text in Fünfergruppen: oben Geheimbuchstabe, unten Klartext (klein) bzw. ·
    const gruppen = [];
    for (let i = 0; i < geheim.length; i += 5) gruppen.push(geheim.slice(i, i + 5));
    const text = h(
      'div',
      { class: 'zuordnung-text', 'aria-hidden': 'true' },
      gruppen.map((gr) =>
        h(
          'span',
          { class: 'z-gruppe' },
          [...gr].map((g) => {
            const klar = h('span', { class: 'z-klar' }, '·');
            klarSpans.get(g).push(klar);
            return h('span', { class: 'z-paar' }, h('span', { class: 'z-geheim' }, g), klar);
          })
        )
      )
    );
    // Review M4 K4: die Live-Vorschau wird nicht angesagt (ändert sich bei jedem Buchstaben); angesagt wird nur der
    // Anteil nach dem Prüfen – entprellt über eine eigene Live-Region
    const vorschau = h('p', { class: 'zuordnung-vorschau' });
    const anteil = h('p', { class: 'zuordnung-anteil' });
    const ansage = h('p', { class: 'zuordnung-ansage sr', 'aria-live': 'polite' });
    let ansageTimer = null;
    function sageAnteil(text) {
      anteil.textContent = text;
      clearTimeout(ansageTimer);
      ansageTimer = setTimeout(() => {
        if (ansage.textContent !== text) ansage.textContent = text;
      }, 300);
    }
    let vorschauTimer = null;
    let vorschauZuletzt = 0;
    const klartext = () => [...geheim].map((g) => (zu[g] ? zu[g].toLowerCase() : '·')).join('');
    function vorschauJetzt() {
      vorschauTimer = null;
      vorschauZuletzt = Date.now();
      vorschau.textContent = `Klartext: ${Krypto.gruppieren(klartext(), 5)}`;
    }
    /** Vorschau höchstens alle 400 ms (Screenreader-Ansage gedrosselt) */
    function vorschauSpaeter() {
      if (vorschauTimer) return;
      vorschauTimer = setTimeout(vorschauJetzt, Math.max(0, 400 - (Date.now() - vorschauZuletzt)));
    }

    function zeichne() {
      const zaehler = {};
      for (const g of vorkommend) if (zu[g]) zaehler[zu[g]] = (zaehler[zu[g]] || 0) + 1;
      for (const g of vorkommend) {
        const f = felder.get(g);
        if (f.value !== zu[g]) f.value = zu[g];
        for (const sp of klarSpans.get(g)) sp.textContent = zu[g] ? zu[g].toLowerCase() : '·';
        const doppelt = !!zu[g] && zaehler[zu[g]] > 1;
        eintraege.get(g).classList.toggle('doppelt', doppelt);
        doppeltSr.get(g).textContent = doppelt ? 'doppelt vergeben' : '';
      }
      rueckgaengig.disabled = gesperrt || !verlauf.length;
      vorschauSpaeter();
    }
    function merke() {
      verlauf.push({ ...zu });
      if (verlauf.length > MAX_VERLAUF) verlauf.shift();
    }
    function markeWeg(g) {
      const li = eintraege.get(g);
      li.classList.remove('ok', 'falsch');
      li.querySelector('.z-marke').textContent = '';
      felder.get(g).removeAttribute('aria-invalid');
    }
    function eingabe(g, feld) {
      if (gesperrt || Object.hasOwn(vorgabe, g)) return;
      const roh = String(feld.value || '');
      const n = roh.trim() === '' ? '' : /^[A-Za-z]$/.test(roh.trim()) ? roh.trim().toUpperCase() : null;
      if (n === null) {
        toast('Nur Buchstaben A–Z.', true);
        feld.value = zu[g];
        if (!zu[g]) feld.value = '';
        return;
      }
      if (n === zu[g]) return zeichne();
      merke();
      zu[g] = n;
      markeWeg(g);
      zeichne();
      kontext.geaendert();
    }
    function taste(g, ev) {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      const offen = [...leiste.querySelectorAll('input.z-feld')].filter((f) => !f.disabled);
      const i = offen.indexOf(felder.get(g));
      const j = ev.key === 'ArrowLeft' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= offen.length) return;
      ev.preventDefault();
      offen[j].focus();
    }
    rueckgaengig.addEventListener('click', () => {
      if (gesperrt || !verlauf.length) return;
      zu = verlauf.pop();
      vorkommend.forEach(markeWeg);
      zeichne();
      kontext.geaendert();
    });
    zuruecksetzen.addEventListener('click', () => {
      if (gesperrt) return;
      merke();
      zu = leereZuordnung();
      vorkommend.forEach(markeWeg);
      sageAnteil('');
      zeichne();
      kontext.geaendert();
    });

    const steuerung = h(
      'div',
      { class: 'zuordnung-steuerung knopf-reihe', role: 'group', 'aria-label': 'Werkbank' },
      h('span', { class: 'knopf-reihe', role: 'group', 'aria-label': 'Reihenfolge der Leiste' }, sortKnoepfe),
      rueckgaengig,
      zuruecksetzen
    );
    const haupt = h('div', { class: 'zuordnung-haupt' }, leiste, h('figure', { class: 'zuordnung-figur' }, h('figcaption', { class: 'sr' }, 'Geheimtext mit zugeordnetem Klartext'), text), vorschau, anteil, ansage);
    const seiten = ia.haeufigkeit === true ? h('aside', { class: 'zuordnung-haeufigkeit', 'aria-label': 'Häufigkeiten des Geheimtextes' }, KRB.haeufigkeit({ quelle: 'text', text: geheim, referenz: 'deutsch', sortierung: 'absteigend', titel: 'Häufigkeiten im Geheimtext' })) : null;
    const box = h('div', { class: 'zuordnung' + (seiten ? ' mit-haeufigkeit' : '') }, steuerung, h('div', { class: 'zuordnung-flaeche' }, haupt, seiten));
    zeichne();
    vorschauJetzt();

    const self = {
      kind: 'zuordnung',
      ui: box,
      antwort() {
        return { zuordnung: { ...zu } };
      },
      leer() {
        return vorkommend.every((g) => Object.hasOwn(vorgabe, g) || !zu[g]);
      },
      setze(a) {
        if (!istObjekt(a)) return;
        const z = istObjekt(a.zuordnung) ? a.zuordnung : a;
        for (const g of vorkommend) {
          if (Object.hasOwn(vorgabe, g)) continue;
          const v = Krypto.nurBuchstaben(String(z[g] ?? ''));
          zu[g] = v.length === 1 ? v : '';
        }
        vorkommend.forEach(markeWeg);
        zeichne();
      },
      feedback(r) {
        if (!r) return;
        if (typeof r.anteil === 'number') sageAnteil(`${Math.round(r.anteil * 100)} % der Textstellen richtig`);
        if (istObjekt(r.buchstaben)) {
          for (const [g, ok] of Object.entries(r.buchstaben)) {
            const li = eintraege.get(g);
            if (!li) continue;
            li.classList.toggle('ok', !!ok);
            li.classList.toggle('falsch', !ok);
            li.querySelector('.z-marke').textContent = ok ? '✓' : '✗';
            felder.get(g).setAttribute('aria-invalid', ok ? 'false' : 'true');
          }
        }
      },
      loesung(lo, muster) {
        const z = (istObjekt(lo) && istObjekt(lo.zuordnung) && lo.zuordnung) || (istObjekt(muster) && istObjekt(muster.zuordnung) && muster.zuordnung) || {};
        for (const g of vorkommend) {
          const v = Krypto.nurBuchstaben(String(z[g] ?? ''));
          zu[g] = v.length === 1 ? v : zu[g];
          markeWeg(g);
          felder.get(g).classList.add('loesung');
        }
        zeichne();
        if (vorschauTimer) clearTimeout(vorschauTimer);
        vorschauJetzt();
        if (istObjekt(lo) && typeof lo.klartext === 'string') vorschau.textContent = `Klartext: ${Krypto.gruppieren(lo.klartext.toLowerCase(), 5)}`;
      },
      sperren(an) {
        gesperrt = !!an;
        for (const [g, f] of felder) f.disabled = gesperrt || Object.hasOwn(vorgabe, g);
        zuruecksetzen.disabled = gesperrt;
        rueckgaengig.disabled = gesperrt || !verlauf.length;
      }
    };
    return self;
  }

  /* ================= schaubild-ergaenzen (Delta §8.3, E27: Chips in der Listenansicht) ================= */

  const SCHLUESSEL_ARTEN = Object.freeze({ oeffentlich: 'öffentlicher Schlüssel', privat: 'privater Schlüssel', sitzung: 'Sitzungsschlüssel' });

  function teilSchaubild(ia, kontext) {
    const felderDef = istObjekt(ia.felder) ? ia.felder : {};
    const aufgabe = kontext && kontext.aufgabe;
    const block = aufgabe && Array.isArray(aufgabe.inhalt) && istObjekt(aufgabe.inhalt[ia.block]) ? aufgabe.inhalt[ia.block] : {};
    const akteure = (Array.isArray(block.akteure) ? block.akteure : []).filter((a) => istObjekt(a) && typeof a.id === 'string');
    const nameVon = (id) => {
      const a = akteure.find((x) => x.id === id);
      return a ? String(a.name ?? a.id) : String(id);
    };
    /** Nummer des Schritts, dessen Text [[id]] enthält */
    const schrittNr = (id) => {
      const st = (Array.isArray(block.schritte) ? block.schritte : []).find((x) => istObjekt(x) && String(x.text ?? '').includes(`[[${id}]]`));
      return st ? String(st.nr ?? '') : '?';
    };
    const els = new Map(); // id → { typ, el, marke?, art?, inhaber?, summary? }
    let gesperrt = false;
    const ergebnis = h('p', { class: 'sb-ergebnis', 'aria-live': 'polite' });

    function chipText(e) {
      const a = e.art.value;
      const i = e.inhaber.value;
      return a && i ? `${SCHLUESSEL_ARTEN[a] || a} von ${nameVon(i)}` : 'Schlüssel wählen';
    }
    function markeWeg(e) {
      e.el.classList.remove('ok', 'falsch', 'loesung');
      e.marke.textContent = '';
    }
    function baueFeld(id) {
      const f = istObjekt(felderDef[id]) ? felderDef[id] : {};
      const nr = schrittNr(id);
      const marke = h('span', { class: 'sb-marke', 'aria-hidden': 'true' });
      if (f.typ === 'schluessel') {
        const arten = Array.isArray(f.arten) ? f.arten.filter((x) => Object.hasOwn(SCHLUESSEL_ARTEN, x)) : Object.keys(SCHLUESSEL_ARTEN);
        const inhaber = Array.isArray(f.inhaber) ? f.inhaber.map(String) : akteure.map((a) => a.id);
        const art = h('select', { class: 'sb-art', 'aria-label': `Schritt ${nr}: Schlüsselart` }, h('option', { value: '' }, '– Schlüsselart –'), arten.map((x) => h('option', { value: x }, SCHLUESSEL_ARTEN[x])));
        const inh = h('select', { class: 'sb-inhaber', 'aria-label': `Schritt ${nr}: Inhaber` }, h('option', { value: '' }, '– Inhaber –'), inhaber.map((x) => h('option', { value: x }, `von ${nameVon(x)}`)));
        const text = h('span', { class: 'sb-chip-text' }, 'Schlüssel wählen');
        const summary = h('summary', null, text, marke);
        const el = h('details', { class: 'sb-chip' }, summary, h('span', { class: 'sb-wahl' }, art, inh));
        const e = { typ: 'schluessel', el, marke, art, inhaber: inh, text };
        const neu = () => {
          markeWeg(e);
          text.textContent = chipText(e);
          if (art.value && inh.value) el.open = false;
          kontext.geaendert();
        };
        art.addEventListener('change', neu);
        inh.addEventListener('change', neu);
        // Escape schließt die Auswahl und gibt den Fokus an den Chip zurück
        el.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape' && el.open) {
            el.open = false;
            summary.focus();
          }
        });
        return e;
      }
      if (f.typ === 'auswahl') {
        const optionen = Array.isArray(f.optionen) ? f.optionen.map(String) : [];
        const sel = h('select', { class: 'sb-auswahl', 'aria-label': `Schritt ${nr}: Auswahl` }, h('option', { value: '' }, '–'), (optionen.length >= 3 ? AQ.mische(optionen) : optionen).map((o) => h('option', { value: o }, o)));
        const el = h('span', { class: 'sb-feld' }, sel, marke);
        const e = { typ: 'auswahl', el, marke, eingabe: sel };
        sel.addEventListener('change', () => {
          markeWeg(e);
          kontext.geaendert();
        });
        return e;
      }
      const inp = h('input', { class: 'sb-text', type: 'text', 'aria-label': `Schritt ${nr}: Eingabe`, autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', maxlength: 200 });
      const el = h('span', { class: 'sb-feld' }, inp, marke);
      const e = { typ: 'text', el, marke, eingabe: inp };
      inp.addEventListener('input', () => {
        markeWeg(e);
        kontext.geaendert();
      });
      return e;
    }
    function setzeFeld(e, v) {
      if (e.typ === 'schluessel') {
        e.art.value = istObjekt(v) && v.art ? String(v.art) : '';
        e.inhaber.value = istObjekt(v) && v.inhaber ? String(v.inhaber) : '';
        e.text.textContent = chipText(e);
        return;
      }
      const s = v === null || v === undefined ? '' : String(v);
      if (e.typ === 'auswahl' && s && ![...e.eingabe.querySelectorAll('option')].some((o) => o.value === s)) e.eingabe.appendChild(h('option', { value: s }, s));
      e.eingabe.value = s;
    }
    const alleEingaben = (e) => (e.typ === 'schluessel' ? [e.art, e.inhaber] : [e.eingabe]);

    const self = {
      kind: 'schaubild-ergaenzen',
      besitzt: (id) => Object.hasOwn(felderDef, id),
      feld(id) {
        if (!els.has(id)) els.set(id, baueFeld(id));
        return els.get(id).el;
      },
      ui: h('div', { class: 'sb-teil' }, h('p', { class: 'hint' }, 'Ergänze die Lücken in den Schritten des Schaubilds.'), ergebnis),
      antwort() {
        const a = {};
        for (const [id, e] of els) {
          if (e.typ === 'schluessel') {
            if (e.art.value && e.inhaber.value) a[id] = { art: e.art.value, inhaber: e.inhaber.value };
          } else if (String(e.eingabe.value || '').trim() !== '') a[id] = e.eingabe.value;
        }
        return a;
      },
      leer() {
        return Object.keys(self.antwort()).length === 0;
      },
      setze(a) {
        if (!istObjekt(a)) return;
        for (const [id, e] of els) {
          setzeFeld(e, a[id]);
          markeWeg(e);
        }
      },
      feedback(r) {
        if (!r || !istObjekt(r.felder)) return;
        let richtig = 0;
        for (const [id, ok] of Object.entries(r.felder)) {
          const e = els.get(id);
          if (ok) richtig++;
          if (!e) continue;
          e.el.classList.toggle('ok', !!ok);
          e.el.classList.toggle('falsch', !ok);
          e.marke.textContent = ok ? ' ✓' : ' ✗';
          alleEingaben(e).forEach((x) => x.setAttribute('aria-invalid', ok ? 'false' : 'true'));
        }
        ergebnis.textContent = `${richtig} von ${Object.keys(r.felder).length} Lücken richtig`;
      },
      loesung(lo, muster) {
        for (const [id, e] of els) {
          const l = istObjekt(lo) ? lo[id] : undefined;
          const v = Array.isArray(l) ? l[0] : l !== undefined ? l : istObjekt(muster) ? muster[id] : undefined;
          if (v === undefined || v === null) continue;
          setzeFeld(e, v);
          markeWeg(e);
          e.el.classList.add('loesung');
        }
      },
      sperren(an) {
        gesperrt = !!an;
        for (const e of els.values()) alleEingaben(e).forEach((x) => (x.disabled = gesperrt));
      }
    };
    return self;
  }

  /* ================= bits-rechnen (Delta §8.4) ================= */

  const LEER = '·';

  function teilBits(ia, kontext) {
    const op = String(ia.operation || '');
    const gruppe = ia.gruppe === 8 ? 8 : 4;
    const normBits = (x) => (typeof x === 'string' ? Krypto.normBits(x) : '');
    const labels = Array.isArray(ia.labels) ? ia.labels.map(String) : [];
    const box = h('div', { class: 'bits-rechnen' });
    let gesperrt = false;
    let textFeld = null;
    const ergebnis = h('p', { class: 'bits-ergebnis', 'aria-live': 'polite' });

    /** Bit-Zeilen wie Block bits (KRB.bits) plus Ergebniszeile */
    function tafel(zeilen, ergebnisLabel, ergebnisEl, markiert) {
      const b = KRB.bits({ gruppe, zeilen, markiert });
      if (ergebnisEl) b.appendChild(h('div', { class: 'bits-zeile bits-ergebniszeile' }, h('span', { class: 'bits-label' }, ergebnisLabel), h('span', { class: 'bits-werte' }, ergebnisEl)));
      return b;
    }

    // Länge der Ergebniszeile
    let n = Number.isInteger(ia.laenge) && ia.laenge > 0 ? ia.laenge : null;
    if (n === null && op === 'xor' && Array.isArray(ia.operanden) && ia.operanden.length) n = normBits(ia.operanden[0]).length || null;
    if (n === null && op === 'ascii' && ia.richtung === 'zu-bits') n = 8 * String(ia.text ?? '').length || null;
    if (n === null && (op === 'kryptos16' || op === 'lawine')) n = 16;
    if (n === null) n = 8;
    n = Math.min(n, 64);

    /* ---------- Bit-Schaltflächen ---------- */
    const werte = [];
    const knoepfe = [];
    const lawine = op === 'lawine';
    function beschrifte(i) {
      const b = knoepfe[i];
      if (lawine) {
        b.textContent = String(i);
        b.setAttribute('aria-pressed', String(werte[i] === '1'));
        b.setAttribute('aria-label', `Bit ${i + 1} von ${n} (Position ${i}), ${werte[i] === '1' ? 'verändert' : 'unverändert'}`);
        return;
      }
      b.textContent = werte[i] || LEER;
      b.setAttribute('aria-pressed', String(werte[i] === '1'));
      b.setAttribute('aria-label', `Bit ${i + 1} von ${n}, ${werte[i] ? `Wert ${werte[i]}` : 'leer'}`);
    }
    function markeWeg(i) {
      knoepfe[i].classList.remove('ok', 'falsch', 'loesung');
    }
    function setzeBit(i, v) {
      if (gesperrt) return;
      werte[i] = v;
      markeWeg(i);
      ergebnis.textContent = '';
      beschrifte(i);
      kontext.geaendert();
    }
    /** Review M4 K5: roving tabindex – die Bitfolge ist ein Tabstopp (zuletzt fokussiertes Bit), Pfeiltasten wechseln. */
    function tabStopp(i) {
      knoepfe.forEach((x, j) => x.setAttribute('tabindex', j === i ? '0' : '-1'));
    }
    function geheZu(i) {
      tabStopp(i);
      knoepfe[i].focus();
    }
    let eingabe = null;
    if (op !== 'ascii' || ia.richtung !== 'zu-text') {
      for (let i = 0; i < n; i++) {
        werte.push('');
        const ende = (i + 1) % gruppe === 0 && i < n - 1;
        const b = h('button', { type: 'button', class: 'bit' + (lawine ? ' lawine' : '') + (ende ? ' gruppe-ende' : ''), tabindex: i === 0 ? '0' : '-1' });
        b.addEventListener('click', () => {
          if (lawine) setzeBit(i, werte[i] === '1' ? '' : '1');
          else setzeBit(i, werte[i] === '' ? '0' : werte[i] === '0' ? '1' : '0');
        });
        b.addEventListener('focus', () => tabStopp(i));
        b.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowLeft' && i > 0) {
            ev.preventDefault();
            geheZu(i - 1);
          } else if (ev.key === 'ArrowRight' && i + 1 < n) {
            ev.preventDefault();
            geheZu(i + 1);
          } else if (ev.key === 'Home' || ev.key === 'End') {
            ev.preventDefault();
            geheZu(ev.key === 'Home' ? 0 : n - 1);
          } else if (!lawine && (ev.key === '0' || ev.key === '1')) {
            ev.preventDefault();
            setzeBit(i, ev.key);
            if (i + 1 < n) geheZu(i + 1);
          } else if (!lawine && (ev.key === 'Backspace' || ev.key === 'Delete')) {
            ev.preventDefault();
            setzeBit(i, '');
            if (ev.key === 'Backspace' && i > 0 && !werte[i]) geheZu(i - 1);
          }
        });
        knoepfe.push(b);
      }
      knoepfe.forEach((_, i) => beschrifte(i));
      eingabe = h(
        'div',
        { class: 'bits-eingabe' + (lawine ? ' bits-lawine' : ''), role: 'group', 'aria-label': lawine ? 'Ergebnis: veränderte Bits antippen' : 'Ergebnis: Bits eintragen (Tasten 0 und 1)' },
        // je Gruppe ein nicht umbrechender Abschnitt (schmale Geräte brechen nur zwischen Gruppen um)
        Array.from({ length: Math.ceil(n / gruppe) }, (_, g) => h('span', { class: 'bit-gruppe' }, knoepfe.slice(g * gruppe, (g + 1) * gruppe)))
      );
    }

    switch (op) {
      case 'xor': {
        const ops = Array.isArray(ia.operanden) ? ia.operanden : [];
        const std = ops.length === 2 ? ['M', 'K', 'C'] : [...ops.map((_, i) => `Operand ${i + 1}`), 'Ergebnis'];
        const zeilen = ops.map((x, i) => ({ label: labels[i] ?? std[i], bits: String(x) }));
        zeilen.push({ trenner: '⊕' });
        box.appendChild(tafel(zeilen, labels[ops.length] ?? std[ops.length], eingabe));
        break;
      }
      case 'kryptos16':
        box.appendChild(h('p', { class: 'bits-hinweis' }, `Runden: ${ia.runden ?? 1}, Richtung: ${ia.richtung === 'ent' ? 'ent' : 'ver'}`));
        box.appendChild(tafel([{ label: labels[0] ?? 'Block', bits: String(ia.block ?? '') }, { label: labels[1] ?? 'Schlüssel K', bits: String(ia.schluessel ?? '') }, { trenner: '→' }], labels[2] ?? 'Ergebnis', eingabe));
        break;
      case 'lawine': {
        const kippe = Number.isInteger(ia.kippe) ? ia.kippe : null;
        box.appendChild(h('p', { class: 'bits-hinweis' }, `Runden: ${ia.runden ?? 1}. Gekippt wird das Bit an Position ${kippe} (markiert). Tippe die Bits an, die sich am Ende unterscheiden.`));
        const t = tafel([{ label: labels[0] ?? 'Block', bits: String(ia.block ?? '') }, { label: labels[1] ?? 'Schlüssel K', bits: String(ia.schluessel ?? '') }], labels[2] ?? 'verändert', eingabe, kippe === null ? [] : [kippe]);
        // markiert ist nur das gekippte Bit des Blocks, nicht die Schlüsselzeile
        t.querySelectorAll('.bits-zeile').forEach((z, j) => {
          if (j === 0) return;
          z.querySelectorAll('.bit.markiert').forEach((b) => {
            b.classList.remove('markiert');
            b.removeAttribute('aria-current');
          });
        });
        box.appendChild(t);
        break;
      }
      case 'ascii':
        if (ia.richtung === 'zu-text') {
          const bits = normBits(String(ia.bits ?? ''));
          textFeld = h('input', { class: 'bits-text', type: 'text', maxlength: Math.max(1, Math.floor(bits.length / 8)), 'aria-label': 'Zeichen', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false' });
          textFeld.addEventListener('input', () => {
            textFeld.classList.remove('ok', 'falsch', 'loesung');
            ergebnis.textContent = '';
            kontext.geaendert();
          });
          box.appendChild(tafel([{ label: labels[0] ?? 'Bits', bits }], labels[1] ?? 'Zeichen', textFeld));
        } else {
          // Rohtext zeigen (ASCII 32–126, Groß/Klein und Leerzeichen zählen) – keine Krypto-Normalisierung
          const t = String(ia.text ?? '');
          box.appendChild(h('p', { class: 'bits-ascii' }, h('span', { 'aria-hidden': 'true' }, 'Text: ', h('code', { class: 'ascii-text' }, t)), h('span', { class: 'sr' }, `Text, buchstabiert: ${[...t].map((c) => (c === ' ' ? 'Leerzeichen' : c)).join(' ')}`)));
          box.appendChild(tafel([], labels[0] ?? 'Bits', eingabe));
        }
        break;
      default:
        box.appendChild(tafel([], labels[0] ?? 'Ergebnis', eingabe));
    }
    box.appendChild(ergebnis);

    function setzeBits(s) {
      const folge = [...String(s ?? '')].filter((c) => c === '0' || c === '1' || c === '?');
      knoepfe.forEach((_, i) => {
        werte[i] = folge[i] === '0' || folge[i] === '1' ? folge[i] : '';
        markeWeg(i);
        beschrifte(i);
      });
    }
    function setzePositionen(liste) {
      const p = new Set((Array.isArray(liste) ? liste : []).map(Number));
      knoepfe.forEach((_, i) => {
        werte[i] = p.has(i) ? '1' : '';
        markeWeg(i);
        beschrifte(i);
      });
    }

    const self = {
      kind: 'bits-rechnen',
      ui: box,
      antwort() {
        if (textFeld) return textFeld.value;
        if (lawine) return werte.map((w, i) => (w === '1' ? i : -1)).filter((i) => i >= 0);
        return werte.map((w) => w || '?').join(''); // ? = leere Stelle (Delta §8.4), Positionen bleiben erhalten
      },
      leer() {
        if (textFeld) return String(textFeld.value || '').trim() === '';
        return werte.every((w) => !w);
      },
      setze(a) {
        if (a === null || a === undefined) return;
        if (textFeld) {
          textFeld.value = String(istObjekt(a) ? a.text ?? '' : a);
          return;
        }
        if (lawine) return setzePositionen(istObjekt(a) ? a.positionen : a);
        setzeBits(istObjekt(a) ? a.bits : a);
      },
      feedback(r) {
        if (!r) return;
        if (textFeld) {
          textFeld.classList.toggle('ok', !!r.ok);
          textFeld.classList.toggle('falsch', !r.ok);
          textFeld.setAttribute('aria-invalid', r.ok ? 'false' : 'true');
          return;
        }
        if (lawine || !Array.isArray(r.bits)) return; // lawine: keine Einzelrückmeldung vor dem Lösen
        // ? hält leere Stellen fest (Delta §8.4): r.bits ist über alle Positionen positionsgenau
        knoepfe.forEach((b, i) => {
          markeWeg(i);
          b.classList.add(r.bits[i] === true && werte[i] ? 'ok' : 'falsch');
        });
        const richtig = knoepfe.filter((b) => b.classList.contains('ok')).length;
        ergebnis.textContent = `${richtig} von ${n} Bits richtig`;
      },
      loesung(lo, muster) {
        if (textFeld) {
          textFeld.value = istObjekt(lo) && typeof lo.text === 'string' ? lo.text : String(muster ?? '');
          textFeld.classList.remove('ok', 'falsch');
          textFeld.classList.add('loesung');
          return;
        }
        if (lawine) setzePositionen(istObjekt(lo) && Array.isArray(lo.positionen) ? lo.positionen : muster);
        else setzeBits(normBits(istObjekt(lo) && typeof lo.bits === 'string' ? lo.bits : typeof muster === 'string' ? muster : ''));
        knoepfe.forEach((b) => b.classList.add('loesung'));
      },
      sperren(an) {
        gesperrt = !!an;
        knoepfe.forEach((b) => (b.disabled = gesperrt));
        if (textFeld) textFeld.disabled = gesperrt;
      }
    };
    return self;
  }

  AQI.registriere('chiffre', teilChiffre);
  AQI.registriere('zuordnung', teilZuordnung);
  AQI.registriere('schaubild-ergaenzen', teilSchaubild);
  AQI.registriere('bits-rechnen', teilBits);
  AQI.schrittArten.add('chiffre');
  AQI.schrittAus.add('chiffre');

  return { VERFAHREN, laenge, verfahrensName };
})();
