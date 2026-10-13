/* Kryptos – Labor-Werkzeug „Hash-Labor“ (W5 §9.1, Plan M6 Task 123, E68, E75, E89). KRYPTOS-Hash Schritt für Schritt
   (Rundentabelle im Nachspiel), Lawinen-Vergleich mit SHA-256 (Bitraster 16 × 16), Kollisionssuche im Schubfach
   (29 Fächer, jedes Wort fällt in sein Fach), Kollisionsbaukasten (Beitrag 3ʲ · Δ mod 29, ausgleichen), Passwort & Salz
   (drei erfundene Konten, Login-Simulation) und Prüfsummen S/G.
   Rechnet nur über Krypto.* (kryptosHash, sha256, pruefsumme, byteZuBits, vonHex, xorBits, buchstabe). Der Zufall für das
   Salz kommt aus umgebung.zufall (Standard crypto.getRandomValues) – Ablaufsteuerung, keine Rechnung. Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  // eigene Beispielwörter (in keinem Material, keinem Seed, keinem Video)
  const BEISPIEL = { schritte: 'Kamin 3', lawineA: 'segel', lawineB: 'segem', baukasten: 'zange', pruefA: 'eimer', pruefB: 'reime' };
  const REITER_TITEL = { schritte: 'KRYPTOS-Hash Schritt für Schritt', lawine: 'Lawinen-Vergleich', kollision: 'Kollisionssuche', baukasten: 'Kollisionsbaukasten', passwort: 'Passwort & Salz', pruefsumme: 'Prüfsummen' };
  const FAECHER = 29;
  const HOCH = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const hochgestellt = (n) => [...String(n)].map((c) => HOCH[c]).join('');
  const normal = (t) => Krypto.klein(Krypto.nurBuchstaben(t));
  const KONTEN = ['konto1@schule.example', 'konto2@schule.example', 'konto3@schule.example'];

  /** Standard-Zufall (Ablaufsteuerung): Zahl in [0, 1) aus crypto.getRandomValues. */
  function standardZufall() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  }

  /** Eingabefeld (input) mit Beschriftung; Länge im Code begrenzt (Voreinstellungen bleiben erhalten). */
  function feld(klasse, titel, wert, max, beiEingabe, { platzhalter = null, art = 'text' } = {}) {
    const id = B.neueId(klasse);
    const f = h('input', { type: art, id, class: `hash-eingabe ${klasse}`, autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', placeholder: platzhalter });
    f.value = String(wert ?? '').slice(0, max);
    f.addEventListener('input', () => {
      if (f.value.length > max) f.value = f.value.slice(0, max);
      beiEingabe(f.value);
    });
    return { element: h('div', { class: 'labor-textfeld hash-feld' }, h('label', { for: id }, titel), f), feld: f };
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
    return h('div', { class: `labor-basis ${klasse}`, role: 'radiogroup', 'aria-label': aria }, knoepfe);
  }

  /** 256 Bits eines SHA-256-Werts (64 Hexziffern) als Zeichenkette aus 0/1. */
  const bitsVon = (hex) => Krypto.vonHex(hex).map((b) => Krypto.byteZuBits(b)).join('');

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('hash', v, umgebung);
    const ruhig = AQ.ruhig();
    const zufall = umgebung && typeof umgebung.zufall === 'function' ? umgebung.zufall : standardZufall;
    const vText = typeof v.text === 'string' && v.text.length <= 60 ? v.text : null;
    const z = { wert: null, runden: [], khA: null, khB: null, shaA: null, shaB: null, verschiedeneBits: null, faecher: [], kollisionNach: null, baukasten: null, konten: [], login: null, pruefsummen: null };
    let nachspiel = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    container.appendChild(h('div', { class: 'labor-werkzeug hash-werkzeug' }, r.element));
    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
    }

    /* ======================= Schritt für Schritt ======================= */
    const schritt = { text: vText ?? BEISPIEL.schritte };
    function baueSchritte() {
      const feldT = B.textfeld({ beschriftung: 'Text (bis 60 Zeichen)', max: 60, wert: schritt.text, art: 'frei', zeilen: 2, beiEingabe: (t) => { schritt.text = t; rechne(); } });
      const norm = h('p', { class: 'labor-normal hash-normal', 'aria-live': 'polite' });
      const ort = h('div', { class: 'hash-runden-ort' });
      const nsOrt = h('div', { class: 'hash-nachspiel' });
      const ergebnis = h('p', { class: 'hash-ergebnis', 'aria-live': 'polite' });
      r.flaeche.append(B.hinweis('info', 'Normalisierung: nur a–z (ä → ae, ö → oe, ü → ue, ß → ss) – Ziffern und Leerzeichen entfallen.'), feldT.element, norm, h('p', { class: 'text-2 hash-regel' }, 'Eine Runde je Buchstabe: h ← (3 · h + w) mod 29, Start h = 0, A = 1 … Z = 26.'), nsOrt, ort, ergebnis);
      function rechne() {
        schliesseTeile();
        AQ.clear(ort);
        AQ.clear(nsOrt);
        const n = normal(schritt.text);
        norm.textContent = `normalisiert: ${n || '(leer)'}`;
        const kh = Krypto.kryptosHash(schritt.text, { protokoll: true });
        z.wert = kh.wert;
        z.runden = kh.schritte.map((s) => ({ ...s }));
        if (!kh.schritte.length) {
          ergebnis.textContent = 'Leerer Text: KH = 0.';
          return;
        }
        const zeilen = kh.schritte.map((s, i) => h('tr', { 'data-runde': String(i) }, h('th', { scope: 'row' }, s.buchstabe), h('td', null, String(s.w)), h('td', null, String(s.vorher)), h('td', null, String(s.summe)), h('td', null, String(s.nachher))));
        ort.appendChild(h('div', { class: 'scroll-x' }, h('table', { class: 'labor-tabelle runden-tabelle' }, h('caption', null, `Rundentabelle KRYPTOS-Hash für „${n}“`), h('thead', null, h('tr', null, ['Buchstabe', 'w', 'h vorher', '3 · h + w', 'h neu = … mod 29'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, zeilen))));
        const texte = kh.schritte.map((s, i) => {
          const tr = Krypto.teileMitRest(s.summe, FAECHER);
          return { text: `Runde ${i + 1}: ${s.buchstabe} (w = ${s.w}): 3 · ${s.vorher} + ${s.w} = ${s.summe} = ${tr.q} · 29 + ${tr.r} → h = ${s.nachher}`, daten: { i } };
        });
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Runde für Runde',
          start: 0,
          schritte: texte,
          zeige(sch, idx) {
            const i = sch.daten.i;
            for (const zl of zeilen) {
              zl.classList.toggle('kommt', Number(zl.dataset.runde) > i);
              zl.classList.toggle('aktuell', Number(zl.dataset.runde) === i);
            }
            ergebnis.textContent = idx === texte.length - 1 ? `KH(${n}) = ${kh.wert}` : 'KH erscheint nach der letzten Runde.';
          }
        });
      }
      rechne();
    }

    /* ======================= Lawinen-Vergleich ======================= */
    const lawine = { a: BEISPIEL.lawineA, b: BEISPIEL.lawineB };
    function baueLawine() {
      const fa = feld('lawine-a', 'Text A (bis 200 Zeichen)', lawine.a, 200, (t) => { lawine.a = t; rechne(); });
      const fb = feld('lawine-b', 'Text B (bis 200 Zeichen)', lawine.b, 200, (t) => { lawine.b = t; rechne(); });
      const kh = h('div', { class: 'lawine-kh', 'aria-live': 'polite' });
      const sha = h('div', { class: 'lawine-sha' });
      const zaehler = h('p', { class: 'lawine-zaehler', 'aria-live': 'polite' });
      const raster = h('div', { class: 'lawine-raster' });
      r.flaeche.append(h('div', { class: 'labor-steuer hash-zwei' }, fa.element, fb.element), h('h3', { class: 'hash-unter' }, 'KRYPTOS-Hash (5 Bit)'), kh, h('h3', { class: 'hash-unter' }, 'SHA-256 (256 Bit)'), sha, zaehler, raster);
      function rechne() {
        AQ.clear(kh);
        AQ.clear(sha);
        AQ.clear(raster);
        const ka = Krypto.kryptosHash(lawine.a).wert;
        const kb = Krypto.kryptosHash(lawine.b).wert;
        const sa = Krypto.sha256(lawine.a);
        const sb = Krypto.sha256(lawine.b);
        const bitsA = bitsVon(sa);
        const bitsB = bitsVon(sb);
        const diff = Krypto.xorBits(bitsA, bitsB);
        const khDiff = Krypto.xorBits(Krypto.byteZuBits(ka, 5), Krypto.byteZuBits(kb, 5));
        const anders = [...diff].filter((c) => c === '1').length;
        Object.assign(z, { khA: ka, khB: kb, shaA: sa, shaB: sb, verschiedeneBits: anders });
        kh.append(
          h('p', { class: 'hash-zeile' }, `A: KH = ${ka} = ${Krypto.byteZuBits(ka, 5)}`),
          h('p', { class: 'hash-zeile' }, `B: KH = ${kb} = ${Krypto.byteZuBits(kb, 5)}`),
          h('p', { class: 'text-2' }, `${[...khDiff].filter((c) => c === '1').length} von 5 Bits verschieden – bei einer kleinen Änderung ändert sich der KRYPTOS-Hash kaum (keine Lawine).`)
        );
        sha.append(h('p', { class: 'hash-zeile hash-hex' }, `A: ${Krypto.gruppieren(sa, 8)}`), h('p', { class: 'hash-zeile hash-hex' }, `B: ${Krypto.gruppieren(sb, 8)}`));
        zaehler.textContent = `${anders} von 256 Bits verschieden${anders ? ' – etwa die Hälfte: Lawineneffekt.' : ' – gleiche Eingabe, gleicher Hashwert.'}`;
        const zeilen = [];
        for (let i = 0; i < 16; i++) {
          const zellen = [];
          for (let j = 0; j < 16; j++) {
            const p = i * 16 + j;
            const an = diff[p] === '1';
            zellen.push(h('td', { class: an ? 'anders' : null }, bitsB[p], an ? h('span', { class: 'sr' }, ' verschieden') : null));
          }
          zeilen.push(h('tr', null, h('th', { scope: 'row' }, `${i * 16 + 1}–${i * 16 + 16}`), zellen));
        }
        raster.appendChild(h('div', { class: 'scroll-x' }, h('table', { class: 'labor-tabelle bitraster' }, h('caption', null, 'Bits von SHA-256(B); umrandet mit Punkt = anders als bei A'), h('tbody', null, zeilen))));
      }
      rechne();
    }

    /* ======================= Kollisionssuche (Schubfach) ======================= */
    function baueKollision() {
      const inhalt = Array.from({ length: FAECHER }, () => []);
      let anzahl = 0;
      z.faecher = inhalt.map(() => []);
      z.kollisionNach = null;
      const fw = feld('kollision-wort', 'Wort eingeben, dann Enter', '', 40, () => {});
      const einwerfen = h('button', { type: 'button', class: 'knopf knopf-zweit kollision-einwerfen' }, 'Einwerfen');
      const leeren = h('button', { type: 'button', class: 'knopf knopf-leise kollision-leeren' }, 'Leeren');
      const meldung = h('p', { class: 'kollision-meldung', 'aria-live': 'polite' });
      const faecher = h('ol', { class: 'faecher', start: '0', 'aria-label': '29 Fächer (KRYPTOS-Hash 0 … 28)' });
      const lis = inhalt.map((_, i) => h('li', { 'data-fach': String(i) }, h('span', { class: 'fach-nr' }, String(i)), h('span', { class: 'fach-woerter' })));
      faecher.append(...lis);
      r.flaeche.append(
        h('div', { class: 'labor-steuer' }, fw.element, einwerfen, leeren),
        meldung,
        h('p', { class: 'faecher-info' }, 'Spätestens beim 30. Wort ist eine Kollision sicher: 29 Fächer, 30 Wörter (Schubfachprinzip). Bei SHA-256 mit 2²⁵⁶ Fächern findest du so nie eine.'),
        faecher
      );
      function zeige() {
        lis.forEach((li, i) => {
          li.classList.toggle('belegt', inhalt[i].length > 0);
          li.classList.toggle('kollision', inhalt[i].length > 1);
          li.querySelector('.fach-woerter').textContent = inhalt[i].join(', ');
        });
        z.faecher = inhalt.map((x) => [...x]);
      }
      function wirf() {
        const wort = fw.feld.value.trim();
        const n = normal(wort);
        if (!n) {
          meldung.textContent = 'Das Wort braucht mindestens einen Buchstaben.';
          return;
        }
        if (inhalt.some((f) => f.includes(n))) {
          meldung.textContent = `„${n}“ liegt schon in einem Fach – nimm ein anderes Wort.`;
          return;
        }
        const fach = Krypto.kryptosHash(n).wert;
        inhalt[fach].push(n);
        anzahl += 1;
        fw.feld.value = '';
        zeige();
        const li = lis[fach];
        li.classList.remove('neu');
        if (!ruhig) li.classList.add('neu');
        if (inhalt[fach].length > 1 && z.kollisionNach === null) {
          z.kollisionNach = anzahl;
          meldung.textContent = `Kollision nach ${anzahl} Wörtern: „${inhalt[fach].join('“ und „')}“ landen beide in Fach ${fach}.`;
        } else meldung.textContent = `„${n}“ fällt in Fach ${fach} (Wort ${anzahl}).${z.kollisionNach !== null ? ` Erste Kollision nach ${z.kollisionNach} Wörtern.` : ''}`;
      }
      fw.feld.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        wirf();
      });
      einwerfen.addEventListener('click', wirf);
      leeren.addEventListener('click', () => {
        for (const f of inhalt) f.length = 0;
        anzahl = 0;
        z.kollisionNach = null;
        meldung.textContent = 'Alle Fächer geleert.';
        zeige();
      });
      zeige();
    }

    /* ======================= Kollisionsbaukasten ======================= */
    const bau = { wort: vText !== null ? normal(vText).slice(0, 12) || BEISPIEL.baukasten : BEISPIEL.baukasten, j: 1, neu: '' };
    function baueBaukasten() {
      const fw = feld('baukasten-wort', 'Wort (bis 12 Buchstaben)', bau.wort, 12, (t) => { bau.wort = t; rechne(true); });
      const zahlJ = B.zahl({ beschriftung: 'Position j vom Ende', min: 1, max: Math.max(1, normal(bau.wort).length - 1), wert: bau.j, beiWechsel: (j) => { bau.j = j; rechne(false); } });
      const nId = B.neueId('baukasten-buchstabe');
      const fn = h('input', { type: 'text', id: nId, class: 'hash-eingabe baukasten-buchstabe', maxlength: '1', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off' });
      fn.addEventListener('input', () => { bau.neu = fn.value; rechne(false); });
      const anzeige = h('p', { class: 'baukasten-wortanzeige', 'aria-live': 'polite' });
      const beitrag = h('p', { class: 'baukasten-beitrag', 'aria-live': 'polite' });
      const knopf = h('button', { type: 'button', class: 'knopf knopf-primaer ausgleichen' }, 'Ausgleichen mit dem letzten Buchstaben');
      const ergebnis = h('div', { class: 'baukasten-ergebnis', 'aria-live': 'polite' });
      r.flaeche.append(
        h('p', { class: 'text-2' }, 'Ändert man den Buchstaben j Stellen vor dem Ende um Δ, ändert sich der Hash um 3ʲ · Δ mod 29. Der letzte Buchstabe kann das wieder ausgleichen.'),
        h('div', { class: 'labor-steuer' }, fw.element, zahlJ.element, h('div', { class: 'labor-textfeld hash-feld' }, h('label', { for: nId }, 'neuer Buchstabe'), fn)),
        anzeige,
        beitrag,
        knopf,
        ergebnis
      );
      function rechne(wortNeu) {
        AQ.clear(ergebnis);
        const w = normal(bau.wort);
        if (wortNeu) zahlJ.grenzen(1, Math.max(1, w.length - 1));
        bau.j = zahlJ.wert();
        z.baukasten = { wort: null, beitrag: null };
        bau.aus = null;
        knopf.disabled = true;
        if (w.length < 2) {
          anzeige.textContent = 'Das Wort braucht mindestens zwei Buchstaben.';
          beitrag.textContent = '';
          return;
        }
        const i = w.length - 1 - bau.j;
        anzeige.textContent = `${w}: Position j = ${bau.j} vom Ende ist „${w[i]}“, der letzte Buchstabe „${w[w.length - 1]}“ gleicht aus. KH(${w}) = ${Krypto.kryptosHash(w).wert}.`;
        const n = normal(bau.neu);
        if (n.length !== 1) {
          beitrag.textContent = 'Wähle einen neuen Buchstaben a–z.';
          return;
        }
        const aus = Krypto.kryptosHash.ausgleichen(w, bau.j, n);
        let potenz = 1;
        for (let k = 0; k < bau.j; k++) potenz *= 3;
        const delta = Krypto.wert(n) - Krypto.wert(w[i]);
        beitrag.textContent = `${w[i]} → ${n}: Δ = ${Krypto.wert(n)} − ${Krypto.wert(w[i])} = ${delta}; Beitrag 3${hochgestellt(bau.j)} · Δ mod 29 = ${potenz} · ${delta < 0 ? `(${delta})` : delta} mod 29 = ${aus.beitrag}`;
        z.baukasten = { wort: null, beitrag: aus.beitrag };
        knopf.disabled = false;
        bau.aus = aus;
      }
      knopf.addEventListener('click', () => {
        const aus = bau.aus;
        AQ.clear(ergebnis);
        if (!aus) return;
        const w = normal(bau.wort);
        if (aus.wort === null) {
          z.baukasten = { wort: null, beitrag: aus.beitrag };
          ergebnis.appendChild(B.hinweis('warnung', 'Kein Buchstabe gleicht aus – anderen Buchstaben wählen.'));
          return;
        }
        const a = Krypto.kryptosHash(w).wert;
        const b = Krypto.kryptosHash(aus.wort).wert;
        z.baukasten = { wort: aus.wort, beitrag: aus.beitrag, khAlt: a, khNeu: b };
        ergebnis.appendChild(B.hinweis(a === b ? 'ok' : 'warnung', `Neues Wort „${aus.wort}“: KH(${aus.wort}) = ${b}, KH(${w}) = ${a} – ${a === b ? 'gleich: Kollision gebaut.' : 'verschieden.'}`));
      });
      rechne(true);
    }

    /* ======================= Passwort & Salz ======================= */
    const pw = { konten: null, verfahren: 'kh', ohneSalz: false, login: 0 };
    function salz() {
      const zwei = () => Krypto.buchstabe(1 + Math.floor(zufall() * 26));
      return zwei() + zwei();
    }
    function bauePasswort() {
      if (!pw.konten) pw.konten = KONTEN.map((name) => ({ name, salz: salz(), passwort: '' }));
      const tabelleOrt = h('div', { class: 'passwort-ort' });
      const felder = pw.konten.map((k, i) =>
        feld('konto-passwort', `Passwort für ${k.name}`, k.passwort, 40, (t) => {
          pw.konten[i].passwort = t;
          rechne();
        }, { platzhalter: 'Übungspasswort' })
      );
      const salzId = B.neueId('ohne-salz');
      const schalter = h('input', { type: 'checkbox', id: salzId, class: 'ohne-salz' });
      schalter.checked = pw.ohneSalz;
      schalter.addEventListener('change', () => { pw.ohneSalz = schalter.checked; rechne(); });
      const wahl = radiogruppe([{ id: 'kh', titel: 'KRYPTOS-Hash' }, { id: 'sha256', titel: 'SHA-256 (gekürzt)' }], pw.verfahren, 'verfahren', 'Hashverfahren', 'passwort-verfahren', (x) => { pw.verfahren = x; rechne(); });
      const kontoId = B.neueId('login-konto');
      const kontoWahl = h('select', { id: kontoId, class: 'rsa-auswahl login-konto' }, pw.konten.map((k, i) => h('option', { value: String(i) }, k.name)));
      kontoWahl.addEventListener('change', () => { pw.login = Number(kontoWahl.value); });
      const login = feld('login-passwort', 'Passwort beim Anmelden', '', 40, () => {}, { platzhalter: 'Übungspasswort' });
      const loginKnopf = h('button', { type: 'button', class: 'knopf knopf-primaer login' }, 'Anmelden');
      const loginErgebnis = h('div', { class: 'login-ergebnis', 'aria-live': 'polite' });
      r.flaeche.append(
        h('p', { class: 'labor-hinweis hinweis-warnung passwort-warnung', role: 'status' }, h('span', { class: 'labor-hinweis-symbol', 'aria-hidden': 'true' }, '⚠'), h('span', { class: 'labor-hinweis-text' }, 'Nur Übung – gib nie ein echtes Passwort ein. Echte Dienste nutzen Argon2/bcrypt (mit Salz und absichtlich langsam). MD5 und SHA-1: gebrochen – nicht verwenden.')),
        h('div', { class: 'labor-steuer' }, wahl, h('label', { class: 'runden-schalter hash-schalter', for: salzId }, schalter, 'ohne Salz')),
        h('div', { class: 'passwort-felder' }, felder.map((f) => f.element)),
        tabelleOrt,
        h('h3', { class: 'hash-unter' }, 'Anmeldung simulieren'),
        h('div', { class: 'labor-steuer' }, h('div', { class: 'labor-textfeld hash-feld' }, h('label', { for: kontoId }, 'Konto'), kontoWahl), login.element, loginKnopf),
        loginErgebnis
      );
      const gespeichert = (k, passwort) => {
        if (!passwort) return null;
        const eingabe = (pw.ohneSalz ? '' : k.salz) + passwort;
        return pw.verfahren === 'kh' ? Krypto.kryptosHash(eingabe).wert : Krypto.sha256(eingabe).slice(0, 16);
      };
      function rechne() {
        AQ.clear(tabelleOrt);
        z.konten = pw.konten.map((k) => ({ name: k.name, salz: k.salz, wert: gespeichert(k, k.passwort) }));
        const werte = z.konten.map((k) => k.wert);
        const doppelt = (x) => x !== null && werte.filter((y) => y === x).length > 1;
        tabelleOrt.appendChild(
          B.tabelle({
            caption: `Gespeicherte Werte (${pw.verfahren === 'kh' ? 'KRYPTOS-Hash' : 'SHA-256, gekürzt auf 16 Hexziffern'}${pw.ohneSalz ? ', ohne Salz' : ''})`,
            kopf: ['Konto', 'Salz', 'gespeichert'],
            zeilen: z.konten.map((k) => [k.name, pw.ohneSalz ? '–' : k.salz, k.wert === null ? '–' : `${k.wert}${pw.verfahren === 'sha256' ? ' (gekürzt)' : ''}${doppelt(k.wert) ? ' ● gleich' : ''}`]),
            klasse: 'passwort-tabelle'
          })
        );
        if (werte.some(doppelt)) tabelleOrt.appendChild(h('p', { class: 'text-2' }, pw.ohneSalz ? '● Gleiche Passwörter ergeben ohne Salz gleiche Werte – wer einen kennt, kennt alle.' : '● Gleicher Wert trotz Salz – beim KRYPTOS-Hash mit nur 29 Werten ist das eine Kollision.'));
      }
      loginKnopf.addEventListener('click', () => {
        AQ.clear(loginErgebnis);
        const k = pw.konten[pw.login];
        const versuch = gespeichert(k, login.feld.value);
        const soll = gespeichert(k, k.passwort);
        const ok = versuch !== null && soll !== null && versuch === soll;
        z.login = { konto: k.name, ok, versuch, soll };
        loginErgebnis.appendChild(B.hinweis(ok ? 'ok' : 'warnung', ok ? `Anmeldung erfolgreich: Der Wert ${versuch} stimmt mit dem gespeicherten Wert überein.` : `Anmeldung abgelehnt: ${versuch === null ? 'kein Passwort' : versuch} ≠ ${soll === null ? 'kein gespeicherter Wert' : soll}.`));
      });
      rechne();
    }

    /* ======================= Prüfsummen ======================= */
    const pruef = { a: BEISPIEL.pruefA, b: BEISPIEL.pruefB };
    function bauePruefsumme() {
      const fa = feld('pruef-a', 'Text 1 (bis 30 Zeichen)', pruef.a, 30, (t) => { pruef.a = t; rechne(); });
      const fb = feld('pruef-b', 'Text 2 (bis 30 Zeichen)', pruef.b, 30, (t) => { pruef.b = t; rechne(); });
      const s = h('p', { class: 'pruef-s', 'aria-live': 'polite' });
      const g = h('p', { class: 'pruef-g', 'aria-live': 'polite' });
      r.flaeche.append(
        h('p', { class: 'text-2' }, 'S(t) = Summe der Buchstabenwerte mod 29 · G(t) = Σ i · wᵢ mod 29 (Position i ab 1).'),
        h('div', { class: 'labor-steuer hash-zwei' }, fa.element, fb.element),
        s,
        g
      );
      function rechne() {
        const S = [Krypto.pruefsumme(pruef.a, 'summe'), Krypto.pruefsumme(pruef.b, 'summe')];
        const G = [Krypto.pruefsumme(pruef.a, 'gewichtet'), Krypto.pruefsumme(pruef.b, 'gewichtet')];
        z.pruefsummen = { S, G };
        const zeile = (el, name, w) => {
          const gleich = w[0] === w[1];
          el.classList.toggle('gleich', gleich);
          el.classList.toggle('verschieden', !gleich);
          el.textContent = `${gleich ? '= ' : '≠ '}${name}: ${w[0]} und ${w[1]} – ${gleich ? 'gleich' : 'verschieden'}`;
        };
        zeile(s, 'Summen-Prüfsumme S', S);
        zeile(g, 'gewichtete Prüfsumme G', G);
      }
      rechne();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'schritte') baueSchritte();
      else if (id === 'lawine') baueLawine();
      else if (id === 'kollision') baueKollision();
      else if (id === 'baukasten') baueBaukasten();
      else if (id === 'passwort') bauePasswort();
      else if (id === 'pruefsumme') bauePruefsumme();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: r.aktiv(), ...z };
      }
    };
  }

  KRLabor.registriere('hash', { titel: 'Hash-Labor', oeffne });
})();
