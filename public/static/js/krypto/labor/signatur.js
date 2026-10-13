/* Kryptos – Labor-Werkzeug „Signatur- & Zertifikats-Simulator“ (W5 §9.2, Plan M6 Task 124, E69, E90). Eine Bühne mit
   Akteuren (Alice, Bob, Mallory, Trent, Schlüsselserver, Vertrauensspeicher): Mallorys Eingriffe sind Knöpfe am Kanal,
   die Prüfung antwortet sofort; Ablauf ①–⑦ als nummerierte Pfeile (KRB.schaubild) und im Nachspiel. Szenen Signatur,
   Zertifikat (immer SHA-256, E69; festes Szenendatum mit Regler, keine Systemuhr, E90) und Man-in-the-Middle (RSA oder
   Diffie-Hellman, „Zertifikate an“ zeigt den scheiternden Schritt).
   Eigene Beispielwerte (Orchestrator): Schlüssel, Nachricht, Kollisionspaar und DH-Zahlen kommen in keinem Material vor
   (Test labor_signatur.test.js) – das Werkzeug rechnet keine Akte vor.
   Rechnet nur über Krypto.* (hashZahl, rsa.signieren/pruefen/schluessel/verschluesseln/entschluesseln, dh.*, sha256).
   Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  const BEISPIEL = {
    nachricht: 'die laterne brennt',
    kollision: ['bringe zwei krapfen', 'bringe zwanzig krapfen'],
    schluessel: { alice: [5, 17, 7], bob: [7, 17, 5], mallory: [3, 23, 3], trent: [5, 19, 5] },
    dh: { p: 43, g: 3, a: 8, b: 13, m: 5 },
    mitmZahl: 20
  };
  const REITER_TITEL = { signatur: 'Signatur', zertifikat: 'Zertifikat', mitm: 'Man-in-the-Middle' };
  const KREIS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
  const HOCH = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const hochgestellt = (n) => [...String(n)].map((c) => HOCH[c]).join('');
  // Schlüssel aus der Bibliothek (N, e, d)
  const S = Object.fromEntries(Object.entries(BEISPIEL.schluessel).map(([n, [p, q, e]]) => [n, Krypto.rsa.schluessel(p, q, e)]));
  const paar = (k) => `(${k.N}, ${k.e})`;
  const privat = (k) => `(${k.N}, ${k.d})`;
  // Szenendatum fest (E90): 1. Juni 2026 + 0 … 12 Monate
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const DATEN = Array.from({ length: 13 }, (_, i) => {
    const m = 5 + i;
    const jahr = m >= 12 ? 2027 : 2026;
    const monat = m >= 12 ? m - 12 : m;
    return { iso: `${jahr}-${String(monat + 1).padStart(2, '0')}-01`, text: `1. ${MONATE[monat]} ${jahr}` };
  });
  const GUELTIG = { von: '2026-01-01', bis: '2026-12-31' };

  /** Mallorys Standardänderung (E69): erster Buchstabe + 1 (z → a). */
  function geaendert(text) {
    const i = [...text].findIndex((c) => /[a-z]/i.test(c));
    if (i < 0) return `${text}x`;
    const neu = Krypto.buchstabe(Krypto.mod(Krypto.wert(text[i]), 26) + 1);
    return text.slice(0, i) + Krypto.klein(neu) + text.slice(i + 1);
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

  /** Schalter (Checkbox mit Beschriftung). */
  function schalter(klasse, titel, an, beiWechsel) {
    const id = B.neueId(klasse);
    const c = h('input', { type: 'checkbox', id, class: klasse });
    c.checked = !!an;
    c.addEventListener('change', () => beiWechsel(c.checked));
    return h('label', { class: 'runden-schalter sig-schalter', for: id }, c, titel);
  }

  /** Nachspiel-Hervorhebung im Schaubild (SVG-Schritt und Listeneintrag) */
  function hebeHervor(figur, i) {
    const svgSchritte = figur.querySelectorAll('.schaubild-svg .schritt, .schaubild-svg .schritt-vor-ort');
    const li = figur.querySelectorAll('.schaubild-liste li');
    [...svgSchritte].forEach((g, j) => g.classList.toggle('aktuell', j === i));
    [...li].forEach((x, j) => {
      x.classList.toggle('aktuell', j === i);
      if (j === i) x.setAttribute('aria-current', 'step');
      else x.removeAttribute('aria-current');
    });
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('signatur', v, umgebung);
    const lehrkraft = !!(umgebung && umgebung.rolle === 'lehrkraft');
    const start = typeof v.szene === 'string' && reiterListe.includes(v.szene) ? v.szene : reiterListe[0];
    const z = { szene: start, hash: 'kh', h1: null, h2: null, signatur: null, gueltig: null, lerntext: '', pruefungen: [], ampel: null, mitm: null };
    let nachspiel = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: start, beiWechsel: baue });
    container.appendChild(h('div', { class: 'labor-werkzeug signatur-werkzeug' }, r.element));
    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
    }

    /* ======================= Signatur ======================= */
    const sig = { hash: 'kh', manip: null, malloryText: '' };
    const MANIP = [
      { art: 'nachricht', titel: 'Nachricht ändern (ein Zeichen)' },
      { art: 'signatur', titel: 'Signatur ändern' },
      { art: 'hash-statt-signatur', titel: 'Nachricht ändern + Hashwert statt Signatur' },
      { art: 'mallory-signiert', titel: 'Nachricht ändern + mit Mallorys Schlüssel signieren' },
      { art: 'schluesselserver', titel: 'Alices Schlüssel auf dem Schlüsselserver ersetzen' },
      { art: 'kollision', titel: 'Kollision einsetzen' },
      { art: 'replay', titel: 'Alte Nachricht erneut senden (Replay)' }
    ];
    const LERN = {
      ok: 'Signatur gültig: H₁ = H₂ – die Nachricht stammt von Alice und ist unverändert.',
      nachricht: 'Integrität verletzt – jede Änderung ändert den Hashwert.',
      signatur: 'Signatur passt nicht zur Nachricht.',
      'hash-statt-signatur': 'Ein Hashwert ist keine Signatur.',
      'mallory-signiert': 'Mallory kann Alices Signatur nicht erzeugen.',
      schluesselserver: 'Bob prüft mit dem falschen Schlüssel – Zertifikate nötig (Modus ‚Zertifikat‘).',
      kollision: 'Signatur nur so stark wie die Kollisionsresistenz.',
      replay: 'Signatur schützt nicht vor Wiederholung – Zeitstempel/Nummer mitsignieren.',
      zufall: 'Zufällig derselbe Hashwert: Die geänderte Nachricht kollidiert – die Signatur bleibt gültig. Signatur nur so stark wie die Kollisionsresistenz.'
    };
    function rechneSignatur() {
      const verfahren = sig.hash;
      const A = S.alice;
      const M = S.mallory;
      const art = sig.manip;
      const original = art === 'kollision' ? BEISPIEL.kollision[0] : BEISPIEL.nachricht;
      const mallorys = sig.malloryText.trim() ? sig.malloryText.trim() : geaendert(original);
      const hz = (t, k) => Krypto.hashZahl(t, { verfahren, modul: k.N });
      const h0 = hz(original, A);
      const s0 = Krypto.rsa.signieren(h0, A.d, A.N);
      let gesendet = original;
      let gesendetS = s0;
      let bobSchluessel = A;
      if (art === 'nachricht') gesendet = mallorys;
      else if (art === 'signatur') gesendetS = Krypto.mod(s0 + 1, A.N);
      else if (art === 'hash-statt-signatur') {
        gesendet = mallorys;
        gesendetS = hz(mallorys, A);
      } else if (art === 'mallory-signiert' || art === 'schluesselserver') {
        gesendet = mallorys;
        gesendetS = Krypto.rsa.signieren(hz(mallorys, M), M.d, M.N);
        if (art === 'schluesselserver') bobSchluessel = M;
      } else if (art === 'kollision') gesendet = BEISPIEL.kollision[1];
      const h1 = hz(gesendet, bobSchluessel);
      const h2 = Krypto.rsa.pruefen(Krypto.mod(gesendetS, bobSchluessel.N), bobSchluessel.e, bobSchluessel.N);
      const gueltig = h1 === h2;
      let lern = !art ? LERN.ok : LERN[art];
      if (gueltig && ['nachricht', 'hash-statt-signatur', 'mallory-signiert', 'signatur'].includes(art)) lern = LERN.zufall;
      if (!gueltig && ['schluesselserver', 'kollision', 'replay'].includes(art)) lern = 'Ungültig – Mallorys Eingriff fällt hier auf.';
      return { verfahren, original, h0, s0, gesendet, gesendetS, bobSchluessel, h1, h2, gueltig, lern, art };
    }
    function baueSignatur() {
      const wahl = radiogruppe([{ id: 'kh', titel: 'KRYPTOS-Hash (schwacher Hash)' }, { id: 'sha256', titel: 'SHA-256 (gekürzt)' }], sig.hash, 'hash', 'Hashverfahren', 'hash-wahl', (x) => {
        sig.hash = x;
        if (x === 'sha256' && sig.manip === 'kollision') sig.manip = null;
        zeige();
      });
      const knoepfe = MANIP.map((m) => h('button', { type: 'button', class: 'knopf knopf-leise manipulation', 'data-art': m.art, 'aria-pressed': 'false' }, m.titel));
      const kollNotiz = h('p', { class: 'text-2 kollision-notiz' });
      const mId = B.neueId('mallory-text');
      const mFeld = h('input', { type: 'text', id: mId, class: 'hash-eingabe mallory-text', maxlength: '60', autocomplete: 'off', spellcheck: 'false', placeholder: 'leer: erster Buchstabe + 1' });
      mFeld.addEventListener('input', () => { sig.malloryText = mFeld.value.slice(0, 60); zeige(); });
      const zurueck = h('button', { type: 'button', class: 'knopf knopf-leise manipulation-aus' }, 'Kein Eingriff');
      const orte = { alice: h('div', { class: 'akteur-inhalt' }), kanal: h('div', { class: 'akteur-inhalt' }), server: h('div', { class: 'akteur-inhalt' }), bob: h('div', { class: 'akteur-inhalt' }) };
      const buehne = h(
        'div',
        { class: 'buehne' },
        h('section', { class: 'akteur', 'data-akteur': 'alice', 'aria-label': 'Alice' }, h('h3', null, 'Alice'), orte.alice),
        h(
          'div',
          { class: 'kanal', role: 'group', 'aria-label': 'Kanal – Mallory-Zone' },
          h('h3', null, 'Kanal (Mallory-Zone)'),
          orte.kanal,
          h('div', { class: 'manipulationen' }, knoepfe, zurueck),
          kollNotiz,
          h('div', { class: 'labor-textfeld hash-feld' }, h('label', { for: mId }, 'Mallorys Nachricht (höchstens 60 Zeichen)'), mFeld)
        ),
        h('section', { class: 'akteur', 'data-akteur': 'schluesselserver', 'aria-label': 'Schlüsselserver' }, h('h3', null, 'Schlüsselserver'), orte.server),
        h('section', { class: 'akteur', 'data-akteur': 'bob', 'aria-label': 'Bob' }, h('h3', null, 'Bob'), orte.bob)
      );
      const ergebnis = h('div', { class: 'pruefung-ort', 'aria-live': 'polite' });
      const ablauf = h('div', { class: 'sig-ablauf' });
      const nsOrt = h('div', { class: 'sig-nachspiel' });
      r.flaeche.append(
        wahl,
        h('p', { class: 'text-2' }, `Schlüssel: Alice ${paar(S.alice)}/${privat(S.alice)} · Bob ${paar(S.bob)}/${privat(S.bob)} · Mallory ${paar(S.mallory)}/${privat(S.mallory)} – kleine Zahlen, nur zum Zeigen.`),
        buehne,
        ergebnis,
        nsOrt,
        ablauf
      );
      knoepfe.forEach((k) => k.addEventListener('click', () => { sig.manip = sig.manip === k.dataset.art ? null : k.dataset.art; zeige(); }));
      zurueck.addEventListener('click', () => { sig.manip = null; zeige(); });
      function zeige() {
        schliesseTeile();
        const w = rechneSignatur();
        Object.assign(z, { hash: w.verfahren, h1: w.h1, h2: w.h2, signatur: w.gesendetS, gueltig: w.gueltig, lerntext: w.lern });
        for (const k of knoepfe) {
          k.setAttribute('aria-pressed', String(k.dataset.art === sig.manip));
          if (k.dataset.art === 'kollision') k.disabled = sig.hash !== 'kh';
        }
        kollNotiz.textContent = sig.hash === 'kh' ? '' : 'Kollision nur beim schwachen Hash.';
        const A = S.alice;
        const hText = (t, k) => (w.verfahren === 'kh' ? `KH(${Krypto.klein(Krypto.nurBuchstaben(t))}) = ${Krypto.kryptosHash(t).wert} → mod ${k.N} = ${Krypto.hashZahl(t, { verfahren: 'kh', modul: k.N })}` : `SHA-256: ${Krypto.sha256(t).slice(0, 8)}… → als Zahl mod ${k.N} = ${Krypto.hashZahl(t, { verfahren: 'sha256', modul: k.N })}`);
        const zeile = (n, text) => h('p', { class: 'buehne-zeile', 'data-schritt': String(n) }, h('span', { class: 'buehne-nr', 'aria-hidden': 'true' }, KREIS[n - 1]), ' ', text);
        AQ.mount(orte.alice, zeile(1, `Nachricht m = „${w.original}“`), zeile(2, `H = ${hText(w.original, A)}`), zeile(3, `Signatur s = H${hochgestellt(A.d)} mod ${A.N} = ${w.h0}${hochgestellt(A.d)} mod ${A.N} = ${w.s0}`));
        AQ.mount(orte.kanal, zeile(4, `übertragen: „${w.gesendet}“ und s = ${w.gesendetS}${w.art === 'replay' ? ' – zum zweiten Mal' : ''}`));
        AQ.mount(orte.server, zeile(6, `„Alices öffentlicher Schlüssel“: ${paar(w.bobSchluessel)}${w.bobSchluessel === S.mallory ? ' – in Wahrheit Mallorys!' : ''}`));
        AQ.mount(orte.bob, zeile(5, `H₁ = ${hText(w.gesendet, w.bobSchluessel)}`), zeile(6, `H₂ = s${hochgestellt(w.bobSchluessel.e)} mod ${w.bobSchluessel.N} = ${w.h2}`), zeile(7, `Vergleich: H₁ = ${w.h1}, H₂ = ${w.h2} → ${w.gueltig ? 'gleich' : 'verschieden'}`));
        AQ.mount(ergebnis, h('p', { class: `pruefung-ergebnis ${w.gueltig ? 'gueltig' : 'ungueltig'}` }, w.gueltig ? 'gültig ✓' : 'ungültig ✗'), h('p', { class: 'lerntext' }, w.lern));
        const figur = KRB.schaubild(
          {
            titel: 'Ablauf der Signaturprüfung',
            akteure: [{ id: 'alice', name: 'Alice' }, { id: 'kanal', name: 'Mallory (Kanal)', art: 'angreifer' }, { id: 'server', name: 'Schlüsselserver', art: 'server' }, { id: 'bob', name: 'Bob' }],
            schritte: [
              { nr: 1, von: 'alice', an: 'alice', text: `schreibt „${w.original}“` },
              { nr: 2, von: 'alice', an: 'alice', text: `Hashwert H = ${w.h0}` },
              { nr: 3, von: 'alice', an: 'alice', text: `signiert mit dem privaten Schlüssel: s = ${w.s0}` },
              { nr: 4, von: 'alice', an: 'bob', text: `Nachricht und s = ${w.gesendetS} über den Kanal` },
              { nr: 5, von: 'bob', an: 'bob', text: `H₁ = ${w.h1} aus der empfangenen Nachricht` },
              { nr: 6, von: 'server', an: 'bob', text: `öffentlicher Schlüssel ${paar(w.bobSchluessel)} → H₂ = ${w.h2}` },
              { nr: 7, von: 'bob', an: 'bob', text: `Vergleich: ${w.gueltig ? 'gültig' : 'ungültig'}` }
            ]
          },
          {}
        );
        AQ.mount(ablauf, figur);
        const texte = ['Alice schreibt die Nachricht.', `Alice berechnet den Hashwert H = ${w.h0}.`, `Alice signiert mit ihrem privaten Schlüssel ${privat(A)}: s = ${w.s0}.`, `Nachricht und Signatur gehen über den Kanal – hier kann Mallory eingreifen.`, `Bob berechnet H₁ = ${w.h1} aus der empfangenen Nachricht.`, `Bob holt den öffentlichen Schlüssel ${paar(w.bobSchluessel)} vom Schlüsselserver und rechnet H₂ = ${w.h2}.`, `Bob vergleicht: ${w.gueltig ? 'gleich – gültig' : 'verschieden – ungültig'}.`];
        const zeilen = [...buehne.querySelectorAll('.buehne-zeile[data-schritt]')];
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Ablauf ①–⑦',
          start: texte.length - 1,
          schritte: texte.map((text, i) => ({ text: `${KREIS[i]} ${text}`, daten: { i } })),
          zeige(sch) {
            const i = sch.daten.i;
            for (const el of zeilen) {
              const n = Number(el.dataset.schritt) - 1;
              el.classList.toggle('kommt', n > i);
              el.classList.toggle('aktuell', n === i);
            }
            hebeHervor(figur, i);
          }
        });
      }
      zeige();
    }

    /* ======================= Zertifikat ======================= */
    const zert = { tausch: false, andererName: false, selbst: false, monate: 0, gesperrt: false, wurzel: false };
    const zertText = (c) => `name=${c.name};schluessel=${c.schluessel.N},${c.schluessel.e};gueltig=${GUELTIG.von}..${GUELTIG.bis};aussteller=${c.aussteller}`;
    function rechneZertifikat() {
      const T = S.trent;
      const M = S.mallory;
      const basis = zert.selbst ? { name: 'bob.example', schluessel: M, aussteller: 'Mallory Root', signierer: M } : zert.andererName ? { name: 'mallory.example', schluessel: M, aussteller: 'Trent CA', signierer: T } : { name: 'bob.example', schluessel: S.bob, aussteller: 'Trent CA', signierer: T };
      const hz = (t, k) => Krypto.hashZahl(t, { verfahren: 'sha256', modul: k.N });
      const hSigniert = hz(zertText(basis), basis.signierer);
      const s = Krypto.rsa.signieren(hSigniert, basis.signierer.d, basis.signierer.N);
      const gezeigt = zert.tausch ? { ...basis, schluessel: basis.schluessel === M ? S.bob : M } : basis;
      const speicher = { 'Trent CA': T };
      if (zert.wurzel) speicher['Mallory Root'] = M;
      const ausstellerSchluessel = speicher[gezeigt.aussteller] || (gezeigt.aussteller === 'Mallory Root' ? M : null);
      const h1 = hz(zertText(gezeigt), ausstellerSchluessel);
      const h2 = Krypto.rsa.pruefen(s, ausstellerSchluessel.e, ausstellerSchluessel.N);
      const datum = DATEN[zert.monate];
      const imSpeicher = !!speicher[gezeigt.aussteller];
      const p = [
        { art: 'signatur', titel: 'Signatur der CA', ok: h1 === h2, text: h1 === h2 ? `${imSpeicher ? `mit dem Schlüssel von „${gezeigt.aussteller}“ aus dem Vertrauensspeicher` : 'nur mit dem Schlüssel aus dem Zertifikat selbst (beweist nichts)'}: s${hochgestellt(ausstellerSchluessel.e)} mod ${ausstellerSchluessel.N} = ${h2} = Hashwert ${h1}` : `Hashwert des Zertifikats ${h1} ≠ ${h2} aus der Signatur – der Inhalt wurde nach dem Signieren verändert.` },
        { art: 'name', titel: 'Name', ok: gezeigt.name === 'bob.example', text: gezeigt.name === 'bob.example' ? 'bob.example – wie erwartet' : `${gezeigt.name} ≠ erwarteter Name bob.example` },
        { art: 'gueltigkeit', titel: 'Gültigkeit', ok: datum.iso >= GUELTIG.von && datum.iso <= GUELTIG.bis, text: `${datum.text}, gültig vom 1. Januar 2026 bis 31. Dezember 2026` },
        { art: 'sperrliste', titel: 'Sperrliste', ok: !(zert.gesperrt && !zert.selbst && !zert.andererName), text: zert.gesperrt && !zert.selbst && !zert.andererName ? 'Trent hat Bobs Zertifikat gesperrt (Schlüssel gestohlen).' : 'nicht gesperrt' },
        { art: 'kette', titel: 'Kette', ok: imSpeicher, text: imSpeicher ? `endet bei „${gezeigt.aussteller}“ im Vertrauensspeicher` : `„${gezeigt.aussteller}“ ist kein Vertrauensanker – die Kette endet nicht im Vertrauensspeicher` }
      ];
      const alleOk = p.every((x) => x.ok);
      const LERN = {
        signatur: 'Signatur der CA passt nicht – die Signatur deckt den gesamten Inhalt ab, auch den Schlüssel.',
        name: 'Name ≠ erwarteter Name: Ein gültiges Zertifikat nützt nur für den Namen, auf den es lautet.',
        gueltigkeit: 'Gültigkeitszeitraum überschritten.',
        sperrliste: 'Gesperrt: Gestohlene Schlüssel stehen auf der Sperrliste – immer mitprüfen.',
        kette: 'Kette endet nicht im Vertrauensspeicher: „Mallory Root“ ist kein vorinstallierter Vertrauensanker.'
      };
      const erster = p.find((x) => !x.ok);
      const lern = alleOk ? (zert.wurzel && zert.selbst ? 'Wer den Vertrauensanker kontrolliert, kontrolliert alles.' : `Alle Prüfungen bestanden: Alice kann dem Schlüssel ${paar(gezeigt.schluessel)} für ${gezeigt.name} vertrauen.`) : LERN[erster.art];
      return { gezeigt, s, h1, h2, datum, pruefungen: p, ampel: alleOk ? 'gruen' : 'rot', lern, speicher };
    }
    function baueZertifikat() {
      const MZ = [
        { art: 'schluessel-tauschen', titel: 'Öffentlichen Schlüssel im Zertifikat austauschen' },
        { art: 'anderer-name', titel: 'Gültiges Zertifikat für mallory.example vorlegen' },
        { art: 'selbst-signiert', titel: 'Selbst signiertes Zertifikat („Mallory Root“)' },
        { art: 'datum', titel: 'Datum über die Gültigkeit hinaus stellen' },
        { art: 'sperren', titel: 'Trent sperrt Bobs Zertifikat' }
      ];
      if (lehrkraft) MZ.push({ art: 'wurzel-einschleusen', titel: 'Lehrkraft: „Mallory Root“ in Alices Vertrauensspeicher einfügen' });
      const knoepfe = MZ.map((m) => h('button', { type: 'button', class: `knopf knopf-leise manipulation${m.art === 'wurzel-einschleusen' ? ' lehrkraft-schalter' : ''}`, 'data-art': m.art, 'aria-pressed': 'false' }, m.titel));
      const regler = B.zahl({ beschriftung: 'Datum vorstellen (Monate)', min: 0, max: 12, wert: zert.monate, format: (n) => DATEN[n].text, beiWechsel: (n) => { zert.monate = n; zeige(); } });
      const datumZeile = h('p', { class: 'zert-datum', 'aria-live': 'polite' });
      const orte = { trent: h('div', { class: 'akteur-inhalt' }), zert: h('div', { class: 'akteur-inhalt' }), speicher: h('div', { class: 'akteur-inhalt' }), alice: h('div', { class: 'akteur-inhalt' }) };
      const buehne = h(
        'div',
        { class: 'buehne' },
        h('section', { class: 'akteur', 'data-akteur': 'trent', 'aria-label': 'Trent (CA)' }, h('h3', null, 'Trent CA'), orte.trent),
        h('div', { class: 'kanal', role: 'group', 'aria-label': 'Zertifikat – Mallory-Zone' }, h('h3', null, 'Zertifikat, das Alice erhält'), orte.zert, h('div', { class: 'manipulationen' }, knoepfe)),
        h('section', { class: 'akteur', 'data-akteur': 'vertrauensspeicher', 'aria-label': 'Vertrauensspeicher' }, h('h3', null, 'Alices Vertrauensspeicher'), orte.speicher),
        h('section', { class: 'akteur', 'data-akteur': 'alice', 'aria-label': 'Alice' }, h('h3', null, 'Alice prüft'), orte.alice)
      );
      const ampelOrt = h('div', { class: 'pruefung-ort', 'aria-live': 'polite' });
      const ablauf = h('div', { class: 'sig-ablauf' });
      r.flaeche.append(h('p', { class: 'labor-hinweis hinweis-info', role: 'status' }, h('span', { class: 'labor-hinweis-symbol', 'aria-hidden': 'true' }, 'ℹ'), h('span', { class: 'labor-hinweis-text' }, 'Zertifikate immer mit SHA-256: Der KRYPTOS-Hash ignoriert Ziffern – ein ausgetauschter Schlüssel fiele nicht auf.')), h('div', { class: 'labor-steuer' }, regler.element, datumZeile), buehne, ampelOrt, ablauf);
      const SCHALTER = { 'schluessel-tauschen': 'tausch', 'anderer-name': 'andererName', 'selbst-signiert': 'selbst', sperren: 'gesperrt', 'wurzel-einschleusen': 'wurzel' };
      knoepfe.forEach((k) =>
        k.addEventListener('click', () => {
          const a = k.dataset.art;
          if (a === 'datum') {
            zert.monate = zert.monate > 0 ? 0 : 7;
            regler.setze(zert.monate);
          } else zert[SCHALTER[a]] = !zert[SCHALTER[a]];
          zeige();
        })
      );
      function zeige() {
        const w = rechneZertifikat();
        Object.assign(z, { hash: 'sha256', pruefungen: w.pruefungen.map((p) => ({ art: p.art, ok: p.ok })), ampel: w.ampel, lerntext: w.lern, h1: w.h1, h2: w.h2, signatur: w.s, gueltig: w.ampel === 'gruen' });
        for (const k of knoepfe) {
          const a = k.dataset.art;
          k.setAttribute('aria-pressed', String(a === 'datum' ? zert.monate > 0 : !!zert[SCHALTER[a]]));
        }
        datumZeile.textContent = `Szenendatum: ${w.datum.text}`;
        const T = S.trent;
        AQ.mount(orte.trent, h('p', { class: 'buehne-zeile' }, `prüft Bobs Identität ✓ und signiert mit ${privat(T)}`), h('p', { class: 'buehne-zeile' }, `öffentlicher Schlüssel ${paar(T)}`));
        AQ.mount(orte.zert, h('p', { class: 'zert-text' }, zertText(w.gezeigt)), h('p', { class: 'buehne-zeile' }, `Signatur s = ${w.s} (über SHA-256, erste 8 Hexziffern als Zahl)`));
        AQ.mount(orte.speicher, h('ul', null, Object.entries(w.speicher).map(([n, k]) => h('li', null, `${n} ${paar(k)}`))));
        AQ.mount(orte.alice, h('ul', { class: 'zert-pruefungen' }, w.pruefungen.map((p) => h('li', { class: p.ok ? 'ok' : 'nicht-ok', 'data-pruefung': p.art }, h('span', { class: 'pruef-symbol', 'aria-hidden': 'true' }, p.ok ? '✓' : '✗'), h('strong', null, `${p.titel}: `), h('span', { class: 'sr' }, p.ok ? 'bestanden, ' : 'nicht bestanden, '), p.text))));
        AQ.mount(ampelOrt, h('div', { class: 'ampel', 'data-farbe': w.ampel }, h('span', { class: 'ampel-licht', 'aria-hidden': 'true' }, w.ampel === 'gruen' ? '●' : '■'), h('span', { class: 'ampel-text' }, w.ampel === 'gruen' ? 'Ampel grün – Zertifikat akzeptiert' : 'Ampel rot – Zertifikat abgelehnt')), h('p', { class: 'lerntext' }, w.lern));
        AQ.mount(
          ablauf,
          KRB.schaubild(
            {
              titel: 'Ablauf der Zertifikatsprüfung',
              akteure: [{ id: 'bob', name: 'Bob' }, { id: 'trent', name: 'Trent CA', art: 'ca' }, { id: 'alice', name: 'Alice' }, { id: 'speicher', name: 'Vertrauensspeicher', art: 'server' }],
              schritte: [
                { nr: 1, von: 'bob', an: 'trent', text: 'beantragt ein Zertifikat (Trent prüft die Identität)' },
                { nr: 2, von: 'trent', an: 'trent', text: 'signiert Name, Schlüssel, Gültigkeit, Aussteller' },
                { nr: 3, von: 'trent', an: 'alice', text: 'Alice erhält das Zertifikat' },
                { nr: 4, von: 'speicher', an: 'alice', text: 'Schlüssel des Ausstellers für die Prüfungen' },
                { nr: 5, von: 'alice', an: 'alice', text: `Ampel ${w.ampel === 'gruen' ? 'grün' : 'rot'}` }
              ]
            },
            {}
          )
        );
      }
      zeige();
    }

    /* ======================= Man-in-the-Middle ======================= */
    const mitm = { dh: false, zertifikate: false };
    function baueMitm() {
      const steuer = h('div', { class: 'labor-steuer' }, schalter('mitm-dh', 'Variante Diffie-Hellman', mitm.dh, (x) => { mitm.dh = x; zeige(); }), schalter('mitm-zertifikate', 'Zertifikate an', mitm.zertifikate, (x) => { mitm.zertifikate = x; zeige(); }));
      const werte = h('div', { class: 'mitm-werte', 'aria-live': 'polite' });
      const scheitert = h('div', { class: 'mitm-scheitert', 'aria-live': 'polite' });
      const nsOrt = h('div', { class: 'sig-nachspiel' });
      const ablauf = h('div', { class: 'sig-ablauf mitm-ablauf' });
      r.flaeche.append(steuer, werte, scheitert, nsOrt, ablauf);
      function zeige() {
        schliesseTeile();
        const Bs = S.bob;
        const M = S.mallory;
        let schritte;
        const daten = { variante: mitm.dh ? 'dh' : 'rsa', zertifikate: mitm.zertifikate, scheitert: mitm.zertifikate ? 3 : null };
        if (mitm.dh) {
          const { p, g, a, b, m } = BEISPIEL.dh;
          const A = Krypto.dh.oeffentlich(g, a, p);
          const Bz = Krypto.dh.oeffentlich(g, b, p);
          const Mz = Krypto.dh.oeffentlich(g, m, p);
          const kAlice = Krypto.dh.gemeinsam(Mz, a, p);
          const kBob = Krypto.dh.gemeinsam(Mz, b, p);
          const ohne = Krypto.dh.gemeinsam(Bz, a, p);
          Object.assign(daten, { p, g, A, B: Bz, M: Mz, kAlice, kBob, ohneMallory: ohne, malloryAlice: Krypto.dh.gemeinsam(A, m, p), malloryBob: Krypto.dh.gemeinsam(Bz, m, p) });
          AQ.mount(werte, h('p', { class: 'buehne-zeile' }, `öffentlich: p = ${p}, g = ${g} · geheim: Alice a, Bob b, Mallory m (Zahlen eigens gewählt)`), h('p', { class: 'buehne-zeile' }, `Ohne Mallory hätten beide K = ${ohne}. Mit Mallory: Alice ${kAlice}, Bob ${kBob} – Mallory kennt beide.`));
          schritte = [
            { nr: 1, von: 'bob', an: 'mallory', text: `Bob sendet B = ${g}^b mod ${p} = ${Bz} – Mallory fängt ihn ab` },
            { nr: 2, von: 'mallory', an: 'alice', text: `Mallory sendet M = ${g}^m mod ${p} = ${Mz} als „Bobs Wert“` },
            { nr: 3, von: 'alice', an: 'mallory', text: `Alice sendet A = ${A} und rechnet K = M^a mod ${p} = ${kAlice}` },
            { nr: 4, von: 'mallory', an: 'mallory', text: `Mallory rechnet A^m mod ${p} = ${daten.malloryAlice} (Schlüssel mit Alice)` },
            { nr: 5, von: 'mallory', an: 'bob', text: `Mallory sendet M = ${Mz} als „Alices Wert“, rechnet B^m mod ${p} = ${daten.malloryBob}` },
            { nr: 6, von: 'bob', an: 'bob', text: `Bob rechnet K = M^b mod ${p} = ${kBob} – er merkt nichts` }
          ];
        } else {
          const m = BEISPIEL.mitmZahl;
          const c1 = Krypto.rsa.verschluesseln(m, M.e, M.N);
          const gelesen = Krypto.rsa.entschluesseln(c1, M.d, M.N);
          const neu = gelesen + 1;
          const c2 = Krypto.rsa.verschluesseln(neu, Bs.e, Bs.N);
          const beiBob = Krypto.rsa.entschluesseln(c2, Bs.d, Bs.N);
          Object.assign(daten, { m, c1, gelesen, neu, c2, beiBob });
          AQ.mount(werte, h('p', { class: 'buehne-zeile' }, `Bob ${paar(Bs)}/${privat(Bs)} · Mallory ${paar(M)}/${privat(M)} · Alices Klarzahl ${m}`), h('p', { class: 'buehne-zeile' }, `Bob erhält ${beiBob} statt ${m} – und merkt nichts.`));
          schritte = [
            { nr: 1, von: 'bob', an: 'mallory', text: `Bob sendet seinen öffentlichen Schlüssel ${paar(Bs)} – Mallory behält ihn` },
            { nr: 2, von: 'mallory', an: 'alice', text: `Mallory sendet Alice ${paar(M)} als „Bobs Schlüssel“` },
            { nr: 3, von: 'alice', an: 'mallory', text: `Alice verschlüsselt ${m} mit ${paar(M)}: ${c1}` },
            { nr: 4, von: 'mallory', an: 'mallory', text: `Mallory entschlüsselt mit ${privat(M)}: ${gelesen}, liest und ändert in ${neu}` },
            { nr: 5, von: 'mallory', an: 'bob', text: `Mallory verschlüsselt ${neu} mit Bobs ${paar(Bs)}: ${c2}` },
            { nr: 6, von: 'bob', an: 'bob', text: `Bob entschlüsselt mit ${privat(Bs)}: ${beiBob}` }
          ];
        }
        z.mitm = daten;
        AQ.clear(scheitert);
        if (mitm.zertifikate) {
          scheitert.appendChild(
            B.hinweis(
              'ok',
              mitm.dh
                ? `Der Angriff scheitert bei Schritt ③: Alice prüft vor dem Weiterrechnen das Zertifikat zum Wert ${daten.M} – er ist nicht von Bob signiert (Trent bestätigt nur Bobs Schlüssel). Alice bricht ab.`
                : `Der Angriff scheitert bei Schritt ③: Bevor Alice verschlüsselt, prüft sie das Zertifikat zu ${paar(M)} – es lautet auf mallory.example, nicht auf bob.example. Alice bricht ab.`
            )
          );
        }
        const figur = KRB.schaubild({ titel: mitm.dh ? 'Man-in-the-Middle beim Diffie-Hellman-Austausch' : 'Man-in-the-Middle beim Schlüsselaustausch', akteure: [{ id: 'alice', name: 'Alice' }, { id: 'mallory', name: 'Mallory', art: 'angreifer' }, { id: 'bob', name: 'Bob' }], schritte }, {});
        if (mitm.zertifikate) {
          const li = figur.querySelectorAll('.schaubild-liste li')[2];
          if (li) li.classList.add('scheitert');
          const g3 = figur.querySelectorAll('.schaubild-svg .schritt')[2];
          if (g3) g3.classList.add('scheitert');
        }
        AQ.mount(ablauf, figur);
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Ablauf ①–⑥',
          start: 0,
          schritte: schritte.map((s, i) => ({ text: `${KREIS[i]} ${s.text}${mitm.zertifikate && i === 2 ? ' – hier prüft Alice das Zertifikat und bricht ab.' : ''}`, daten: { i } })),
          zeige: (sch) => hebeHervor(figur, sch.daten.i)
        });
      }
      zeige();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      z.szene = id;
      if (id === 'signatur') baueSignatur();
      else if (id === 'zertifikat') baueZertifikat();
      else if (id === 'mitm') baueMitm();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { ...z, pruefungen: z.pruefungen.map((p) => ({ ...p })), mitm: z.mitm ? { ...z.mitm } : null };
      }
    };
  }

  KRLabor.registriere('signatur', { titel: 'Signatur- & Zertifikats-Simulator', oeffne });
})();
