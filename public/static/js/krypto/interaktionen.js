/* Kryptos – Interaktionen im Client (Delta §8, TECHNIK §4.4), registriert über AQI.registriere:
   chiffre (Task 54). Prüfung NUR auf dem Server: Die Oberfläche berechnet nie eine Lösung (auch nicht zur Längen-
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

  AQI.registriere('chiffre', teilChiffre);
  AQI.schrittArten.add('chiffre');
  AQI.schrittAus.add('chiffre');

  return { VERFAHREN, laenge, verfahrensName };
})();
