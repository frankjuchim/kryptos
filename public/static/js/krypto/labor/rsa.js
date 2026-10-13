/* Kryptos – Labor-Werkzeug „RSA-Rechenwerk“ (W4 §9.2, Plan M6 Task 122). Die Rechenvorlage der Akte als Objekt:
   Schlüssel aus p, q, e mit Probe und Warnungen, Ver-/Entschlüsseln als Quadrier- und Produktkette (Nachspiel Zeile für
   Zeile), Eve-Modus „N zerlegen“ nur per Probedivision mit Zähler, Euklid-Tabelle (Kür: erst abwärts, dann rückwärts) und
   „Text als Zahlen“ mit dem Hinweis, dass buchstabenweise RSA eine monoalphabetische Substitution ist (P5).
   Rechnet nur über Krypto.*; Grundrechenarten nur für die Anzeige („3 · 27 = 81“). Speichert nichts. */
'use strict';
(() => {
  const { h } = AQ;
  const B = KRLaborBau;
  // eigene Beispielwerte (in keinem Material): p = 11, q = 17, e = 3, Klarzahl 20, Wort „hammer“
  const BEISPIEL = { p: 11, q: 17, e: 3, m: 20, text: 'hammer' };
  const REITER_TITEL = { rechenwerk: 'Rechenwerk', euklid: 'Euklid-Tabelle (Kür)', text: 'Text als Zahlen' };
  const MAX_PRIM = 47;
  const HOCH = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const hochgestellt = (n) => [...String(n)].map((c) => HOCH[c]).join('');
  const minus = (n) => (n < 0 ? `−${-n}` : String(n));
  const zahlVon = (t) => (/^\s*\d{1,6}\s*$/.test(String(t ?? '')) ? Number(String(t).trim()) : null);

  /** Primzahlen 3 … 47 (über Krypto.istPrim). */
  const PRIMZAHLEN = [];
  for (let n = 3; n <= MAX_PRIM; n++) if (Krypto.istPrim(n)) PRIMZAHLEN.push(n);

  /** Auswahlfeld mit Beschriftung. */
  function auswahl(klasse, titel, werte, wert, beiWechsel) {
    const id = B.neueId(klasse);
    const s = h('select', { id, class: `rsa-auswahl ${klasse}` }, werte.map((x) => h('option', { value: String(x) }, String(x))));
    s.value = String(wert);
    s.addEventListener('change', () => beiWechsel(Number(s.value)));
    return { element: h('div', { class: 'labor-textfeld rsa-feld' }, h('label', { for: id }, titel), s), feld: s };
  }

  function oeffne(container, voreinstellung, umgebung) {
    const v = voreinstellung || {};
    const reiterListe = KRLabor.reiterFuer('rsa', v, umgebung);
    const prim = (x) => (Number.isInteger(x) && PRIMZAHLEN.includes(x) ? x : null);
    const st = { p: prim(v.p) ?? BEISPIEL.p, q: prim(v.q) ?? BEISPIEL.q, e: Number.isInteger(v.e) ? v.e : BEISPIEL.e, richtung: 'ver', eingabe: BEISPIEL.m, text: '' };
    const z = { p: null, q: null, e: null, N: null, phi: null, d: null, warnungen: [], m: null, c: null, kette: [], eve: null, euklid: null };
    let nachspiel = null;

    const r = B.reiter(reiterListe.map((id) => ({ id, titel: REITER_TITEL[id] })), { aktiv: reiterListe[0], beiWechsel: baue });
    const wurzel = h('div', { class: 'labor-werkzeug rsa-werkzeug' }, r.element);
    container.appendChild(wurzel);

    function schliesseTeile() {
      if (nachspiel) nachspiel.schliesse();
      nachspiel = null;
    }

    /** Schlüssel aus st berechnen → { ok, grund } und z füllen. */
    function schluessel() {
      z.p = st.p;
      z.q = st.q;
      z.N = null;
      z.phi = null;
      z.d = null;
      z.e = null;
      if (st.p === st.q) return { ok: false, grund: 'gleich' };
      const liste = Krypto.rsa.eKandidaten(st.p, st.q); // 3 ≤ e < φ, ggT(e, φ) = 1
      if (!liste.includes(st.e)) st.e = liste.includes(BEISPIEL.e) ? BEISPIEL.e : liste[0];
      const k = Krypto.rsa.schluessel(st.p, st.q, st.e);
      Object.assign(z, { N: k.N, phi: k.phi, e: k.e, d: k.d });
      return { ok: true, liste };
    }

    /** Steuerzeile p, q, e (gemeinsam für alle Reiter) */
    function steuerung(neu) {
      const fp = auswahl('rsa-p', 'Primzahl p', PRIMZAHLEN, st.p, (x) => { st.p = x; neu(); });
      const fq = auswahl('rsa-q', 'Primzahl q', PRIMZAHLEN, st.q, (x) => { st.q = x; neu(); });
      const eId = B.neueId('rsa-e');
      const fe = h('select', { id: eId, class: 'rsa-auswahl rsa-e' });
      fe.addEventListener('change', () => { st.e = Number(fe.value); neu(); });
      const element = h('div', { class: 'labor-steuer rsa-steuer' }, fp.element, fq.element, h('div', { class: 'labor-textfeld rsa-feld' }, h('label', { for: eId }, 'öffentlicher Exponent e'), fe));
      return {
        element,
        /** e-Liste neu setzen */
        setzeE(liste) {
          AQ.clear(fe);
          for (const e of liste || []) fe.appendChild(h('option', { value: String(e) }, String(e)));
          fe.disabled = !liste || !liste.length;
          if (liste && liste.length) fe.value = String(st.e);
        }
      };
    }

    const HINWEIS_GLEICH = 'p = q: N = p² ist leicht zu zerlegen und φ(N) wäre nicht (p − 1)² – wähle zwei verschiedene Primzahlen.';

    /* ======================= Rechenwerk ======================= */
    function baueRechenwerk() {
      const hinweisOrt = h('div', { class: 'rsa-hinweise' });
      const schl = h('div', { class: 'rsa-schluessel' });
      const probe = h('p', { class: 'rsa-probe' });
      const warnungen = h('ul', { class: 'rsa-warnungen' });
      const richtung = B.richtung({ wert: st.richtung, beiWechsel: (x) => { st.richtung = x; rechne(); }, texte: { ver: 'Verschlüsseln (mit e)', ent: 'Entschlüsseln (mit d)' } });
      const mId = B.neueId('rsa-m');
      const mFeld = h('input', { type: 'text', inputmode: 'numeric', id: mId, class: 'zahl-eingabe rsa-m', autocomplete: 'off', spellcheck: 'false' });
      mFeld.value = String(st.eingabe ?? '');
      const mLabel = h('label', { for: mId }, 'Klarzahl m');
      mFeld.addEventListener('input', () => { st.eingabe = zahlVon(mFeld.value); rechne(); });
      const ergebnis = h('p', { class: 'rsa-ergebnis' });
      const ketteOrt = h('div', { class: 'rsa-kette' });
      const nsOrt = h('div', { class: 'rsa-nachspiel' });
      const eveKnopf = h('button', { type: 'button', class: 'knopf knopf-zweit eve-zerlegen' }, 'Eve: N zerlegen (Probedivision)');
      const eveErgebnis = h('p', { class: 'eve-ergebnis', 'aria-live': 'polite' });
      const ansage = B.ansager(); // ein entprellter Live-Bereich statt Schlüssel/Warnungen/Ergebnis einzeln (Review M6)
      let erstesMal = true;
      const steuer = steuerung(rechne);
      r.flaeche.append(
        ansage.element,
        steuer.element,
        hinweisOrt,
        schl,
        probe,
        h('div', { class: 'labor-steuer rsa-rechnen' }, richtung.element, h('div', { class: 'labor-textfeld rsa-feld' }, mLabel, mFeld)),
        warnungen,
        ergebnis,
        nsOrt,
        ketteOrt,
        h('div', { class: 'eve-bereich rsa-eve' }, h('p', { class: 'text-2' }, 'Eve kennt nur N und e. Dieses Werkzeug zerlegt N nur durch Ausprobieren der Teiler 2, 3, 4, …'), eveKnopf, eveErgebnis)
      );
      eveKnopf.addEventListener('click', () => {
        if (z.N === null) return;
        const pd = Krypto.probedivision(z.N);
        z.eve = { teiler: pd.teiler, versuche: pd.versuche };
        eveErgebnis.textContent = pd.teiler === null ? `Kein Teiler gefunden nach ${pd.versuche} Versuchen – N ist prim.` : `${pd.teiler} gefunden nach ${pd.versuche} Versuchen: N = ${z.N} = ${pd.teiler} · ${z.N / pd.teiler}. Damit kennt Eve φ(N) und kann d berechnen – bei Zahlen mit Hunderten Stellen ist Ausprobieren hoffnungslos langsam.`;
      });

      function rechne() {
        rechneRechenwerk();
        if (!erstesMal) ansage.sage(ergebnis.textContent || z.warnungen.join(' ') || hinweisOrt.textContent);
        erstesMal = false;
      }
      function rechneRechenwerk() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(schl);
        AQ.clear(warnungen);
        AQ.clear(ketteOrt);
        AQ.clear(nsOrt);
        probe.textContent = '';
        ergebnis.textContent = '';
        eveErgebnis.textContent = '';
        z.eve = null;
        z.warnungen = [];
        z.m = null;
        z.c = null;
        z.kette = [];
        mLabel.textContent = st.richtung === 'ver' ? 'Klarzahl m' : 'Geheimzahl c';
        const s = schluessel();
        steuer.setzeE(s.ok ? s.liste : null);
        eveKnopf.disabled = !s.ok;
        if (!s.ok) {
          hinweisOrt.appendChild(B.hinweis('warnung', HINWEIS_GLEICH));
          return;
        }
        const { p, q, N, phi, e, d } = z;
        schl.append(
          h('p', { class: 'rsa-zeile' }, `N = p · q = ${p} · ${q} = ${N}`),
          h('p', { class: 'rsa-zeile' }, `φ(N) = (p − 1) · (q − 1) = ${p - 1} · ${q - 1} = ${phi}`),
          h('p', { class: 'rsa-zeile rsa-paar' }, `öffentlicher Schlüssel (N, e) = (${N}, ${e}) · privater Schlüssel (N, d) = (${N}, ${d})`)
        );
        const tr = Krypto.teileMitRest(e * d, phi);
        probe.textContent = `Probe: e · d = ${e} · ${d} = ${e * d} = ${tr.q} · ${phi} + ${tr.r} ${tr.r === 1 ? '✓' : '✗'}`;
        const warne = (t) => {
          z.warnungen.push(t);
          warnungen.appendChild(h('li', null, h('span', { class: 'rsa-warn-symbol', 'aria-hidden': 'true' }, '⚠ '), t));
        };
        if (d === e) warne('schwacher Schlüssel: privater Schlüssel = öffentlicher Schlüssel (d = e) – wer e kennt, kennt d.');
        const x = st.eingabe;
        const wort = st.richtung === 'ver' ? 'Klarzahl' : 'Geheimzahl';
        if (x === null) {
          warne(`Gib die ${wort} als ganze Zahl ein.`);
          return;
        }
        if (x >= N) {
          warne(`${wort} muss kleiner als N sein (${x} ≥ ${N}).`);
          return;
        }
        const exp = st.richtung === 'ver' ? e : d;
        const proto = Krypto.modpow(x, exp, N, { protokoll: true });
        const y = st.richtung === 'ver' ? Krypto.rsa.verschluesseln(x, e, N) : Krypto.rsa.entschluesseln(x, d, N);
        if (st.richtung === 'ver') {
          z.m = x;
          z.c = y;
          if (x === 0 || x === 1) warne(`Klarzahl ${x}: ${x}ᵉ = ${x} – Geheimzahl = Klarzahl.`);
          else if (y === x) warne(`Fixpunkt: ${x}${hochgestellt(e)} mod ${N} = ${x} – Geheimzahl = Klarzahl.`);
        } else {
          z.c = x;
          z.m = y;
        }
        ergebnis.textContent = st.richtung === 'ver' ? `c = m${hochgestellt(e)} mod N = ${x}${hochgestellt(e)} mod ${N} = ${y}` : `m = c${hochgestellt(d)} mod N = ${x}${hochgestellt(d)} mod ${N} = ${y}`;
        kette(proto, x, exp, N);
      }

      /** Quadrierkette (Tabelle) und Produktkette (Liste) aus dem modpow-Protokoll; Nachspiel Zeile für Zeile. */
      function kette(proto, basis, exp, N) {
        const schritte = proto.schritte;
        let zweier = 1;
        const zeilen = [];
        const produkte = [];
        const texte = [];
        schritte.forEach((sch, i) => {
          const gebraucht = sch.exponent > 0 && Krypto.mod(sch.exponent, 2) === 1;
          const letzte = i === schritte.length - 1;
          const potenz = letzte ? '–' : `${basis}${hochgestellt(zweier)}`;
          // Zwischenergebnis nach dieser Zeile (= Ergebnis der nächsten Protokollzeile)
          const danach = letzte ? sch.ergebnis : schritte[i + 1].ergebnis;
          const eintrag = { exponent: sch.exponent, potenz: letzte ? null : zweier, wert: sch.basis, gebraucht, ergebnis: danach };
          z.kette.push(eintrag);
          zeilen.push(h('tr', { class: gebraucht ? 'gebraucht' : null, 'data-zeile': String(i) }, h('th', { scope: 'row' }, String(sch.exponent)), h('td', null, potenz), h('td', null, letzte ? '–' : String(sch.basis)), h('td', null, letzte ? '–' : gebraucht ? '✓ gebraucht' : '–'), h('td', null, letzte ? `${danach} = Ergebnis` : String(danach))));
          let produktText = null;
          if (gebraucht && !letzte) {
            const prod = sch.ergebnis * sch.basis;
            const tr = Krypto.teileMitRest(prod, N);
            produktText = `${sch.ergebnis} · ${sch.basis} = ${prod} = ${tr.q} · ${N} + ${tr.r} → ${tr.r}`;
            produkte.push(h('li', { 'data-zeile': String(i) }, produktText));
          }
          texte.push(letzte ? `Rest-Exponent 0: fertig – Ergebnis ${sch.ergebnis}.` : `Rest-Exponent ${sch.exponent}: ${basis}${hochgestellt(zweier)} mod ${N} = ${sch.basis}${gebraucht ? ` – ungerade, also gebraucht: ${produktText}` : ' – gerade, nicht gebraucht'}; danach quadrieren.`);
          zweier *= 2;
        });
        const tabelle = h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'labor-tabelle quadrierkette' },
            h('caption', null, `Quadrierkette ${basis}${hochgestellt(exp)} mod ${N} (Exponent halbieren, Basis quadrieren)`),
            h('thead', null, h('tr', null, ['Rest-Exponent', 'Potenz', `Wert mod ${N}`, 'Rest-Exponent ungerade?', 'Zwischenergebnis danach'].map((t) => h('th', { scope: 'col' }, t)))),
            h('tbody', null, zeilen)
          )
        );
        const produktListe = h('ol', { class: 'produktkette', 'aria-label': 'Produktkette' }, produkte);
        ketteOrt.append(tabelle, h('h3', { class: 'rsa-unter' }, 'Produktkette'), produktListe);
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Quadrier- und Produktkette Zeile für Zeile',
          start: schritte.length - 1,
          schritte: texte.map((text, i) => ({ text, daten: { i } })),
          zeige(sch) {
            const i = sch.daten.i;
            for (const zl of zeilen) zl.classList.toggle('kommt', Number(zl.dataset.zeile) > i);
            for (const li of produkte) li.classList.toggle('kommt', Number(li.dataset.zeile) > i);
            for (const zl of zeilen) zl.classList.toggle('aktuell', Number(zl.dataset.zeile) === i);
          }
        });
      }
      rechne();
    }

    /* ======================= Euklid-Tabelle (Kür) ======================= */
    function baueEuklid() {
      const hinweisOrt = h('div', { class: 'rsa-hinweise' });
      const kopf = h('p', { class: 'rsa-zeile' });
      const ort = h('div', { class: 'euklid-ort' });
      const nsOrt = h('div', { class: 'rsa-nachspiel' });
      const ende = h('p', { class: 'euklid-ende', 'aria-live': 'polite' });
      const steuer = steuerung(rechne);
      r.flaeche.append(steuer.element, hinweisOrt, kopf, nsOrt, ort, ende);
      function rechne() {
        schliesseTeile();
        AQ.clear(hinweisOrt);
        AQ.clear(ort);
        AQ.clear(nsOrt);
        kopf.textContent = '';
        ende.textContent = '';
        z.euklid = null;
        const s = schluessel();
        steuer.setzeE(s.ok ? s.liste : null);
        if (!s.ok) {
          hinweisOrt.appendChild(B.hinweis('warnung', HINWEIS_GLEICH));
          return;
        }
        const { phi, e } = z;
        const eu = Krypto.erweiterterEuklid(phi, e);
        const d = Krypto.mod(eu.y, phi);
        z.euklid = { schritte: eu.schritte, ggt: eu.ggt, x: eu.x, y: eu.y, d };
        kopf.textContent = `Gesucht: d mit e · d mod φ = 1, also ${e} · d mod ${phi} = 1. Der erweiterte Euklid liefert x, y mit ${phi} · x + ${e} · y = ggT = ${eu.ggt}.`;
        const n = eu.schritte.length;
        const zellen = [];
        const zeilen = eu.schritte.map((sch, i) => {
          const c = {
            a: h('td', null, String(sch.a)),
            b: h('td', null, String(sch.b)),
            q: h('td', null, sch.q === null ? '–' : String(sch.q)),
            r: h('td', null, sch.r === null ? '–' : String(sch.r)),
            x: h('td', { class: 'rueck' }, minus(sch.x)),
            y: h('td', { class: 'rueck' }, minus(sch.y))
          };
          zellen.push(c);
          return h('tr', { 'data-zeile': String(i) }, h('th', { scope: 'row' }, String(i + 1)), c.a, c.b, c.q, c.r, c.x, c.y);
        });
        ort.appendChild(h('div', { class: 'scroll-x' }, h('table', { class: 'labor-tabelle euklid-tabelle' }, h('caption', null, `Erweiterter Euklid für a = φ = ${phi}, b = e = ${e}`), h('thead', null, h('tr', null, ['Zeile', 'a', 'b', 'q', 'r', 'x', 'y'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', null, zeilen))));
        const schritte = [];
        eu.schritte.forEach((sch, i) => schritte.push({ text: sch.q === null ? `Abwärts, Zeile ${i + 1}: b = 0 – Ende, ggT = a = ${sch.a}.` : `Abwärts, Zeile ${i + 1}: ${sch.a} = ${sch.q} · ${sch.b} + ${sch.r}.`, daten: { ab: i, rueck: n } }));
        for (let i = n - 1; i >= 0; i--) {
          const sch = eu.schritte[i];
          const t = i === n - 1 ? `Rückwärts, Zeile ${i + 1}: Start x = ${sch.x}, y = ${sch.y}.` : `Rückwärts, Zeile ${i + 1}: x = y von unten = ${minus(sch.x)}, y = x − q · y von unten = ${minus(sch.y)}.`;
          schritte.push({ text: t, daten: { ab: n - 1, rueck: i } });
        }
        const endText = `d = y mod φ = ${minus(eu.y)} mod ${phi} = ${d}`;
        nachspiel = KRLabor.nachspiel(nsOrt, {
          titel: 'Erst abwärts (a, b, q, r), dann rückwärts (x, y)',
          start: 0,
          schritte,
          zeige(sch, idx) {
            const { ab, rueck } = sch.daten;
            zellen.forEach((c, i) => {
              for (const k of ['a', 'b', 'q', 'r']) c[k].classList.toggle('kommt', i > ab);
              for (const k of ['x', 'y']) c[k].classList.toggle('kommt', i < rueck);
              zeilen[i].classList.toggle('aktuell', rueck === n ? i === ab : i === rueck);
            });
            ende.textContent = idx === schritte.length - 1 ? `${endText} ✓ (Probe: ${e} · ${d} = ${e * d} = ${Krypto.teileMitRest(e * d, phi).q} · ${phi} + 1)` : 'd erscheint, wenn die Tabelle rückwärts bis oben gefüllt ist.';
          }
        });
      }
      rechne();
    }

    /* ======================= Text als Zahlen ======================= */
    function baueText() {
      const hinweisOrt = h('div', { class: 'rsa-hinweise' });
      const ort = h('div', { class: 'text-ort' });
      const steuer = steuerung(rechne);
      const feld = B.textfeld({ beschriftung: 'Text (A = 1 … Z = 26, buchstabenweise)', max: 40, wert: st.text, art: 'klartext', beiEingabe: (t) => { st.text = t; rechne(); }, zeilen: 2, platzhalter: `z. B. ${BEISPIEL.text}` });
      r.flaeche.append(hinweisOrt, steuer.element, feld.element, ort);
      function rechne() {
        AQ.clear(hinweisOrt);
        AQ.clear(ort);
        hinweisOrt.appendChild(B.hinweis('falle', 'Buchstabenweise RSA ist eine monoalphabetische Substitution – unsicher (P5)! Gleiche Buchstaben ergeben gleiche Zahlen; Eve macht eine Häufigkeitsanalyse.', { falle: 'P5' }));
        const s = schluessel();
        steuer.setzeE(s.ok ? s.liste : null);
        if (!s.ok) {
          hinweisOrt.appendChild(B.hinweis('warnung', HINWEIS_GLEICH));
          return;
        }
        if (z.N <= 26) {
          hinweisOrt.appendChild(B.hinweis('warnung', `N = ${z.N} ist zu klein: Buchstabenwerte bis 26 müssen kleiner als N sein.`));
          return;
        }
        const buchstaben = [...Krypto.nurBuchstaben(st.text)];
        if (!buchstaben.length) return;
        const klar = Krypto.zahlen(st.text);
        const geheim = klar.map((m) => Krypto.rsa.verschluesseln(m, z.e, z.N));
        const anzahl = new Map();
        for (const m of klar) anzahl.set(m, (anzahl.get(m) || 0) + 1);
        const doppelt = (m) => anzahl.get(m) > 1;
        z.m = klar;
        z.c = geheim;
        ort.appendChild(
          h(
            'div',
            { class: 'scroll-x' },
            h(
              'table',
              { class: 'labor-tabelle text-zahlen' },
              h('caption', null, `Buchstabe für Buchstabe: c = m${hochgestellt(z.e)} mod ${z.N}`),
              h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Buchstabe'), buchstaben.map((b, i) => h('th', { scope: 'col', class: doppelt(klar[i]) ? 'gleich' : null }, Krypto.klein(b))))),
              h(
                'tbody',
                null,
                h('tr', null, h('th', { scope: 'row' }, 'Klarzahl m'), klar.map((m) => h('td', { class: `klar${doppelt(m) ? ' gleich' : ''}` }, String(m)))),
                h('tr', null, h('th', { scope: 'row' }, 'Geheimzahl c'), geheim.map((c, i) => h('td', { class: `geheim${doppelt(klar[i]) ? ' gleich' : ''}` }, doppelt(klar[i]) ? `${c} ●` : String(c))))
              )
            )
          )
        );
        if ([...anzahl.values()].some((n) => n > 1)) ort.appendChild(h('p', { class: 'text-2' }, '● gleiche Buchstaben → gleiche Geheimzahlen: Das Muster des Klartextes bleibt sichtbar.'));
      }
      rechne();
    }

    function baue(id) {
      schliesseTeile();
      AQ.clear(r.flaeche);
      if (id === 'rechenwerk') baueRechenwerk();
      else if (id === 'euklid') baueEuklid();
      else if (id === 'text') baueText();
    }
    baue(r.aktiv());

    return {
      schliesse() {
        schliesseTeile();
      },
      zustand() {
        return { reiter: r.aktiv(), ...z, warnungen: [...z.warnungen], kette: z.kette.map((x) => ({ ...x })) };
      }
    };
  }

  KRLabor.registriere('rsa', { titel: 'RSA-Rechenwerk', oeffne });
})();
