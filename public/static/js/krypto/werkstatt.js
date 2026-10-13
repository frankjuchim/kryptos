/* Kryptos – Seite /werkstatt: Chiffren-Werkstatt mit Baukasten-Editor (TECHNIK §9.1–§9.4, SPEC W3 Tabelle B, Plan M7
   Task 156, E104, E105). Teams kombinieren 1–4 Stufen aus Krypto.baukasten.STUFEN; jeder Stufenparameter wird ein
   Platzhalter ($s1, $s2 …, „wie Stufe n“ = derselbe Platzhalter), der Schlüssel bleibt geheim (Kerckhoffs). Prüfen und
   Rechnen nur über Krypto.baukasten.* im Browser (eigene Hinweise sofort, E104); Klartext und Schlüssel gehen nur beim
   Einreichen an den Server und werden dort nicht gespeichert. Entwurf nur im Browser (localStorage
   `kr-werkstatt:<teilnahme>`, try/catch), gelöscht mit „Entwurf verwerfen“ und beim Abmelden (KRKopf). Router: `#/`
   Editor, `#/arena` Knack-Arena (KRArena, Task 157). Texte nur als Textknoten, Lernende geduzt. */
'use strict';

const KRWerkstatt = (() => {
  const { h } = AQ;
  const enc = encodeURIComponent;
  const B = Krypto.baukasten;
  const STUFE = Object.fromEntries(B.STUFEN.map((s) => [s.typ, s]));
  const PRAEFIX = 'kr-werkstatt:';
  const PAUSE = 300; // Live-Prüfung entprellt
  const MIN = 150;
  const MAX = 300;
  const BESCHREIBUNG_MAX = 2000;
  const EINORDNUNG = Object.freeze({ mono: 'monoalphabetische Substitution', poly: 'polyalphabetische Substitution', transposition: 'Transposition' });
  const PARAM_NAME = Object.freeze({ k: 'Verschiebung k', schluesselwort: 'Schlüsselwort', schluessel: 'Schlüsselwort', zeilen: 'Schienen h', block: 'Blocklänge n', um: 'Drehung r' });
  const OHNE_TEAM = 'Du bist keinem Team zugeteilt – die Werkstatt funktioniert trotzdem, einreichen kannst du nur mit Team.';
  const TABLET = 'Auf geteilten Tablets nach der Stunde abmelden – dann wird der Entwurf gelöscht.';
  const PHASE_TEXT = Object.freeze({
    keine: 'Gerade ist keine Arena offen – ihr könnt trotzdem entwerfen und prüfen. Einreichen geht, sobald eure Lehrkraft die Arena öffnet.',
    werkstatt: 'Die Arena ist offen: Reicht euer Verfahren bis zum Start der Angriffsphase ein (ändern geht bis dahin).',
    angriff: 'Die Angriffsphase läuft – Einreichen ist nicht mehr möglich. Greift die Verfahren der anderen Teams an.',
    beurteilung: 'Die Angriffsphase ist vorbei. Beurteilt jetzt euer Verfahren in der Arena.',
    geschlossen: 'Die Arena ist geschlossen. Ihr könnt hier weiter entwerfen und prüfen.'
  });

  let uid = 0;
  const neueStufe = (typ = 'caesar', werte = {}, teilen = {}) => ({ uid: ++uid, typ, werte: { ...werte }, teilen: { ...teilen } });

  /* ---------- Zustand ---------- */
  let haupt = null;
  let rolle = null;
  let info = { arena: null, team: null, eigene: null, teilnahme: null };
  let stufen = [neueStufe('caesar')];
  let felder = null; // { name, klartext, beschreibung, ... } Elemente
  let ergebnis = null; // letzte Prüfung
  let timer = null;
  let geaendert = false;
  let arenaTimer = null;
  let ansichtArena = null;

  /* ---------- Entwurf (E105) ---------- */
  const entwurfName = () => (info.teilnahme !== null && info.teilnahme !== undefined ? PRAEFIX + info.teilnahme : null);
  function entwurfLaden() {
    const n = entwurfName();
    if (!n) return null;
    try {
      const roh = localStorage.getItem(n);
      const d = roh ? JSON.parse(roh) : null;
      return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
    } catch {
      return null;
    }
  }
  function entwurfSpeichern(z) {
    const n = entwurfName();
    if (!n) return;
    try {
      localStorage.setItem(n, JSON.stringify({ verfahren: z.verfahren, schluessel: z.schluessel, klartext: z.klartext, beschreibung: z.beschreibung }));
    } catch {
      /* ohne Speicher läuft alles weiter */
    }
  }
  function entwurfLoeschen() {
    const n = entwurfName();
    if (!n) return;
    try {
      localStorage.removeItem(n);
    } catch {
      /* nichts */
    }
  }

  /* ---------- Modell ↔ Verfahren ---------- */

  /** Parameter (Name, Beschreibung) einer Stufe */
  const parameter = (typ) => Object.entries((STUFE[typ] || {}).parameter || {});

  /** Ziel einer Teilung „n:param“ → { index, param } oder null (nur frühere Stufen mit gleicher Parameterart) */
  function teilZiel(i, p) {
    const t = stufen[i].teilen[p];
    if (!t) return null;
    const j = stufen.findIndex((s) => s.uid === t.uid);
    if (j < 0 || j >= i) return null;
    const spec = STUFE[stufen[i].typ].parameter[p];
    const ziel = STUFE[stufen[j].typ].parameter[t.param];
    if (!spec || !ziel || ziel.art !== spec.art) return null;
    return { index: j, param: t.param };
  }

  /**
   * Teilungen nach Umordnen/Entfernen gültig halten: Zeigt eine Stufe auf eine spätere (oder fehlende) Stufe, übernimmt sie
   * deren Wert; die spätere Stufe teilt dann umgekehrt („gleicher Schlüssel“ bleibt erhalten).
   */
  function normalisiereTeilen(werteVorher) {
    stufen.forEach((st, i) => {
      for (const [p, spec] of parameter(st.typ)) {
        const t = st.teilen[p];
        if (!t) continue;
        const j = stufen.findIndex((s) => s.uid === t.uid);
        const ziel = j >= 0 ? stufen[j] : null;
        const zs = ziel ? STUFE[ziel.typ].parameter[t.param] : null;
        const passt = !!zs && zs.art === spec.art;
        if (passt && j < i) continue;
        delete st.teilen[p];
        st.werte[p] = werteVorher.get(`${st.uid}:${p}`) ?? st.werte[p] ?? '';
        if (passt && j > i && !ziel.teilen[t.param]) ziel.teilen[t.param] = { uid: st.uid, param: p };
      }
    });
  }

  /** aktuelle (aufgelöste) Werte aller Parameter: „uid:param“ → Wert – vor einer Strukturänderung merken */
  function werteMerken() {
    const m = new Map();
    stufen.forEach((st, i) => {
      for (const [p] of parameter(st.typ)) {
        const z = teilZiel(i, p);
        m.set(`${st.uid}:${p}`, z ? stufen[z.index].werte[z.param] ?? '' : st.werte[p] ?? '');
      }
    });
    return m;
  }

  /** Wert aus einem Eingabefeld nach Parameterart: Zahl als Ganzzahl, Wort ohne Leerzeichen am Rand */
  function wertVon(spec, roh) {
    const s = String(roh ?? '').trim();
    if (spec.art === 'zahl') return /^-?\d{1,6}$/.test(s) ? Number(s) : s;
    return s;
  }

  /** { verfahren, schluessel } aus dem Modell: jeder Parameter ein Platzhalter, geteilte Parameter derselbe */
  function baue() {
    const verfahren = { version: 1 };
    const name = felder ? felder.name.value.trim() : '';
    if (name) verfahren.name = name;
    verfahren.stufen = [];
    const schluessel = {};
    const platz = [];
    let zaehler = 0;
    stufen.forEach((st, i) => {
      platz[i] = {};
      const param = {};
      for (const [p, spec] of parameter(st.typ)) {
        const z = teilZiel(i, p);
        if (z && platz[z.index][z.param]) {
          platz[i][p] = platz[z.index][z.param];
        } else {
          const n = 's' + ++zaehler;
          platz[i][p] = n;
          schluessel[n] = wertVon(spec, st.werte[p]);
        }
        param[p] = '$' + platz[i][p];
      }
      verfahren.stufen.push(Object.keys(param).length ? { typ: st.typ, param } : { typ: st.typ });
    });
    return { verfahren, schluessel };
  }

  /** Modell aus einem Verfahren (Platzhalter oder Konstanten) und dem Schlüssel (Entwurf, eigene Chiffre) */
  function ausVerfahren(verfahren, schluessel = {}) {
    const liste = verfahren && Array.isArray(verfahren.stufen) ? verfahren.stufen.filter((s) => s && STUFE[s.typ]).slice(0, B.MAX_STUFEN) : [];
    if (!liste.length) return [neueStufe('caesar')];
    const gesehen = new Map(); // Platzhalter → { uid, param }
    const neu = [];
    for (const s of liste) {
      const st = neueStufe(s.typ);
      for (const [p] of parameter(s.typ)) {
        const w = s.param ? s.param[p] : undefined;
        if (typeof w === 'string' && w.startsWith('$')) {
          const name = w.slice(1);
          if (gesehen.has(name)) st.teilen[p] = gesehen.get(name);
          else {
            gesehen.set(name, { uid: st.uid, param: p });
            const v = schluessel && typeof schluessel === 'object' ? schluessel[name] : undefined;
            st.werte[p] = v === undefined || v === null ? '' : String(v);
          }
        } else st.werte[p] = w === undefined || w === null ? '' : String(w);
      }
      neu.push(st);
    }
    // XOR nur zuletzt
    const x = neu.findIndex((s) => s.typ === 'xor');
    if (x >= 0 && x !== neu.length - 1) neu.push(neu.splice(x, 1)[0]);
    return neu;
  }

  /** Test-/e2e-Schnittstelle: [{ typ, param: { name: wert }, teilen: { name: stufenNr } }] */
  function setzeStufen(liste) {
    const neu = [];
    for (const e of Array.isArray(liste) ? liste.slice(0, B.MAX_STUFEN) : []) {
      if (!e || !STUFE[e.typ]) continue;
      const st = neueStufe(e.typ);
      for (const [p, spec] of parameter(e.typ)) {
        const t = e.teilen && e.teilen[p];
        if (Number.isInteger(t) && t >= 1 && t <= neu.length) {
          const ziel = neu[t - 1];
          const passend = parameter(ziel.typ).filter(([, s]) => s.art === spec.art).map(([q]) => q);
          const q = passend.includes(p) ? p : passend[0];
          if (q) {
            st.teilen[p] = { uid: ziel.uid, param: q };
            continue;
          }
        }
        const w = e.param ? e.param[p] : undefined;
        st.werte[p] = w === undefined || w === null ? '' : String(w);
      }
      neu.push(st);
    }
    stufen = neu.length ? neu : [neueStufe('caesar')];
    geaendert = true;
    zeichneStufen();
    plane();
  }

  /** Zustand für Tests, e2e und den Entwurf */
  function zustand() {
    const { verfahren, schluessel } = baue();
    return {
      verfahren,
      schluessel,
      klartext: felder ? felder.klartext.value : '',
      beschreibung: felder ? felder.beschreibung.value : '',
      pruefung: ergebnis ? { ok: ergebnis.ok, fehler: [...ergebnis.fehler], hinweise: ergebnis.hinweise.map((x) => ({ ...x })) } : null
    };
  }

  /* ---------- Editor ---------- */

  let fokusNach = null; // { nr, klasse } nach dem Neuzeichnen

  function bewege(i, d) {
    const j = i + d;
    if (j < 0 || j >= stufen.length) return;
    if (stufen[i].typ === 'xor' || stufen[j].typ === 'xor') return; // XOR bleibt zuletzt
    const vorher = werteMerken();
    const neu = stufen.slice();
    [neu[i], neu[j]] = [neu[j], neu[i]];
    stufen = neu;
    normalisiereTeilen(vorher);
    geaendert = true;
    zeichneStufen();
    plane();
  }

  function stufeElement(st, i) {
    const nr = i + 1;
    const letzte = i === stufen.length - 1;
    const def = STUFE[st.typ];
    const typ = h(
      'select',
      { class: 'stufe-typ', 'aria-label': `Stufe ${nr}: Art` },
      B.STUFEN.filter((s) => !s.nurZuletzt || letzte).map((s) => h('option', { value: s.typ, selected: s.typ === st.typ }, `${s.name} (${s.kuerzel})`))
    );
    typ.value = st.typ;
    typ.addEventListener('change', () => {
      const vorher = werteMerken();
      st.typ = typ.value;
      st.werte = {};
      st.teilen = {};
      normalisiereTeilen(vorher);
      geaendert = true;
      fokusNach = { nr, klasse: 'stufe-typ' };
      zeichneStufen();
      plane();
    });
    const knopf = (klasse, text, label, aus, f) => h('button', { type: 'button', class: `knopf knopf-leise ${klasse}`, 'aria-label': label, title: label, disabled: aus, onclick: f }, text);
    const hoch = knopf('stufe-hoch', '↑', `Stufe ${nr} nach oben`, i === 0 || st.typ === 'xor', () => {
      fokusNach = { nr: nr - 1, klasse: 'stufe-hoch' };
      bewege(i, -1);
    });
    const runter = knopf('stufe-runter', '↓', `Stufe ${nr} nach unten`, letzte || st.typ === 'xor' || stufen[i + 1].typ === 'xor', () => {
      fokusNach = { nr: nr + 1, klasse: 'stufe-runter' };
      bewege(i, 1);
    });
    const weg = knopf('stufe-entfernen', '✕', `Stufe ${nr} entfernen`, stufen.length <= 1, () => {
      const vorher = werteMerken();
      stufen = stufen.filter((x) => x !== st);
      normalisiereTeilen(vorher);
      geaendert = true;
      fokusNach = { nr: Math.min(nr, stufen.length), klasse: 'stufe-typ' };
      zeichneStufen();
      plane();
    });
    const params = parameter(st.typ).map(([p, spec]) => {
      const id = `stufe-${st.uid}-${p}`;
      // Teilen: frühere Stufen mit gleicher Parameterart (E104, „gleicher Schlüssel wie Stufe n“)
      const ziele = [];
      for (let j = 0; j < i; j++) {
        const gleich = parameter(stufen[j].typ).filter(([, s]) => s.art === spec.art);
        for (const [q] of gleich) ziele.push({ wert: `${stufen[j].uid}:${q}`, text: `wie Stufe ${j + 1}${gleich.length > 1 ? ` (${PARAM_NAME[q] || q})` : ''}` });
      }
      const z = teilZiel(i, p);
      const geteilt = z ? `${stufen[z.index].uid}:${z.param}` : '';
      const eingabe = h('input', {
        id,
        class: 'stufe-param',
        'data-param': p,
        type: spec.art === 'zahl' ? 'number' : 'text',
        inputmode: spec.art === 'zahl' ? 'numeric' : null,
        min: spec.art === 'zahl' ? String(spec.min) : null,
        max: spec.art === 'zahl' ? String(spec.max) : null,
        maxlength: spec.art === 'wort' ? String(spec.max) : null,
        autocomplete: 'off',
        autocapitalize: spec.art === 'wort' ? 'characters' : null,
        spellcheck: 'false',
        value: st.werte[p] ?? ''
      });
      eingabe.hidden = !!z;
      eingabe.addEventListener('input', () => {
        st.werte[p] = eingabe.value;
        geaendert = true;
        plane();
      });
      const bereich = spec.art === 'zahl' ? `${spec.min}–${spec.max}` : `${spec.min}–${spec.max} Buchstaben`;
      let teilen = null;
      if (ziele.length) {
        teilen = h('select', { class: 'stufe-teilen', 'aria-label': `Stufe ${nr}: ${PARAM_NAME[p] || p} – eigener Schlüssel oder wie eine frühere Stufe` }, h('option', { value: '' }, 'eigener Schlüssel'), ziele.map((t) => h('option', { value: t.wert }, t.text)));
        teilen.value = geteilt;
        teilen.addEventListener('change', () => {
          if (teilen.value) {
            const [u, q] = teilen.value.split(':');
            st.teilen[p] = { uid: Number(u), param: q };
          } else {
            delete st.teilen[p];
            const zz = z ? stufen[z.index].werte[z.param] : '';
            if (!st.werte[p] && zz) st.werte[p] = zz;
          }
          geaendert = true;
          fokusNach = { nr, klasse: 'stufe-teilen', param: p };
          zeichneStufen();
          plane();
        });
      }
      return h('div', { class: 'stufe-feld', 'data-param': p }, h('label', { for: id }, `${PARAM_NAME[p] || p} `, h('span', { class: 'text-2 klein' }, `(${bereich})`)), h('div', { class: 'stufe-feld-zeile' }, teilen, eingabe));
    });
    const li = h(
      'li',
      { class: 'stufe', 'data-nr': String(nr), 'data-typ': st.typ },
      h('div', { class: 'stufe-kopf' }, h('span', { class: 'stufe-nr' }, `Stufe ${nr}`), typ, h('span', { class: 'stufe-knoepfe' }, hoch, runter, weg)),
      params.length ? h('div', { class: 'stufe-parameter' }, params) : h('p', { class: 'text-2 klein stufe-ohne' }, 'ohne Schlüssel'),
      h('p', { class: 'text-2 klein stufe-einordnung' }, `${def.kuerzel} · ${EINORDNUNG[def.einordnung] || def.einordnung}${def.nurZuletzt ? ' · nur als letzte Stufe' : ''}`)
    );
    // Tastatur: Alt + ↑/↓ verschiebt die Stufe
    li.addEventListener('keydown', (e) => {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      const d = e.key === 'ArrowUp' ? -1 : 1;
      const t = e.target && e.target.classList ? [...e.target.classList].find((c) => c.startsWith('stufe-')) : null;
      fokusNach = { nr: nr + d, klasse: t || 'stufe-typ', param: e.target && e.target.getAttribute ? e.target.getAttribute('data-param') : null };
      bewege(i, d);
    });
    return li;
  }

  function zeichneStufen() {
    if (!felder) return;
    AQ.mount(felder.liste, stufen.map(stufeElement));
    felder.neu.disabled = stufen.length >= B.MAX_STUFEN;
    if (fokusNach) {
      const li = felder.liste.querySelector(`li.stufe[data-nr="${fokusNach.nr}"]`);
      const kandidat = li ? [...li.querySelectorAll(`.${fokusNach.klasse}`)].find((x) => !x.disabled && (!fokusNach.param || x.getAttribute('data-param') === fokusNach.param || (x.closest && x.closest(`[data-param="${fokusNach.param}"]`)))) : null;
      const ziel = kandidat || (li && li.querySelector('.stufe-typ'));
      if (ziel && typeof ziel.focus === 'function') ziel.focus();
      fokusNach = null;
    }
  }

  function neueStufeAnhaengen() {
    if (stufen.length >= B.MAX_STUFEN) return;
    const st = neueStufe('caesar');
    const letzte = stufen[stufen.length - 1];
    if (letzte && letzte.typ === 'xor') stufen = [...stufen.slice(0, -1), st, letzte];
    else stufen = [...stufen, st];
    geaendert = true;
    fokusNach = { nr: stufen.indexOf(st) + 1, klasse: 'stufe-typ' };
    zeichneStufen();
    plane();
  }

  /* ---------- Live-Prüfung ---------- */

  function plane() {
    // nach einer Änderung gilt „Eingereicht“ nicht mehr für den Entwurf
    if (felder && felder.meldung.querySelector('.rueckmeldung.ok')) AQ.clear(felder.meldung);
    clearTimeout(timer);
    timer = setTimeout(pruefe, PAUSE);
  }

  const darstellung = (verfahren, roh) => {
    const l = verfahren.stufen[verfahren.stufen.length - 1];
    return l && l.typ === 'xor' ? (String(roh).match(/../g) || []).join(' ') : Krypto.gruppieren(roh, 5);
  };

  function pruefe() {
    clearTimeout(timer);
    timer = null;
    if (!felder) return;
    const z = zustand();
    const text = z.klartext;
    const mitText = Krypto.nurBuchstaben(text).length > 0;
    let p;
    try {
      p = B.pruefe(z.verfahren, z.schluessel, { klartext: mitText ? text : null });
    } catch (e) {
      p = { ok: false, fehler: [e && e.message ? e.message : 'Prüfung nicht möglich.'], hinweise: [] };
    }
    let geheim = '';
    let zwischen = [];
    if (p.ok && mitText) {
      try {
        const v = B.verschluesseln(z.verfahren, z.schluessel, text, { protokoll: true });
        geheim = v.geheimtext;
        zwischen = v.stufen;
      } catch (e) {
        p = { ok: false, fehler: [e && e.message ? e.message : 'Verschlüsseln nicht möglich.'], hinweise: p.hinweise };
      }
    }
    ergebnis = { ...p, geheim: geheim ? darstellung(z.verfahren, geheim) : '', mitText };
    // Anzeige
    AQ.mount(felder.fehler, p.fehler.map((f) => h('li', null, f)));
    felder.fehlerBereich.hidden = !p.fehler.length;
    AQ.mount(felder.hinweise, p.hinweise.map((x) => h('li', { class: 'werkstatt-hinweis' }, x.p ? KRDiag.chip(x.p) : null, x.p ? ' ' : null, h('span', null, x.text))));
    felder.hinweiseBereich.hidden = !p.hinweise.length;
    felder.rueck.textContent = !p.ok ? '' : mitText ? 'Entschlüsseln liefert den Klartext ✓ (auch für „Ebbe und Flut“ und einen Text der Länge 1)' : 'Umkehrbar für „Ebbe und Flut“ und einen Text der Länge 1 ✓ – schreibt jetzt euren Text.';
    felder.rueck.classList.toggle('ok', p.ok);
    felder.rueck.hidden = !p.ok;
    felder.geheim.textContent = ergebnis.geheim || '–';
    AQ.mount(felder.zwischen, zwischen.map((s, i) => h('li', null, h('span', { class: 'zwischen-stufe' }, `Stufe ${i + 1} · ${s.kuerzel}: `), h('code', null, i === zwischen.length - 1 ? ergebnis.geheim : s.typ === 'xor' ? darstellung({ stufen: [s] }, s.ergebnis) : Krypto.gruppieren(s.ergebnis, 5)))));
    felder.zwischenBereich.hidden = !zwischen.length;
    laengeZeigen();
    einreichenPruefen();
    if (geaendert) entwurfSpeichern(z);
  }

  function laengeZeigen() {
    const n = Krypto.nurBuchstaben(felder.klartext.value).length;
    felder.laenge.textContent = `${n} Buchstaben (${MIN}–${MAX})`;
    felder.laenge.classList.toggle('ok', n >= MIN && n <= MAX);
    felder.zaehler.textContent = `${felder.beschreibung.value.length} / ${BESCHREIBUNG_MAX} Zeichen`;
  }

  /** Bedingungen fürs Einreichen (Checkliste mit Symbol, nicht nur Farbe) */
  function bedingungen() {
    const n = Krypto.nurBuchstaben(felder.klartext.value).length;
    return [
      { ok: !!info.team, text: info.team ? `Team: ${info.team.name}` : 'Team zugeteilt' },
      { ok: !!info.arena && info.arena.status === 'werkstatt', text: 'Arena in der Werkstatt-Phase' },
      { ok: !!ergebnis && ergebnis.ok, text: 'Umkehrbarkeitsprüfung bestanden' },
      { ok: n >= MIN && n <= MAX, text: `eigener Text mit ${MIN}–${MAX} Buchstaben` },
      { ok: felder.beschreibung.value.trim().length > 0, text: 'Verfahrensbeschreibung' }
    ];
  }

  function einreichenPruefen() {
    if (!felder) return;
    const liste = bedingungen();
    AQ.mount(felder.checkliste, liste.map((b) => h('li', { class: b.ok ? 'erfuellt' : 'offen' }, h('span', { class: 'check-symbol', 'aria-hidden': 'true' }, b.ok ? '✓' : '○'), h('span', { class: 'sr' }, b.ok ? 'erfüllt: ' : 'offen: '), b.text)));
    felder.einreichen.disabled = rolle !== 'schueler' || felder.sendet || !liste.every((b) => b.ok);
  }

  async function einreichen() {
    if (felder.einreichen.disabled) return;
    const z = zustand();
    felder.sendet = true;
    einreichenPruefen();
    AQ.clear(felder.meldung);
    try {
      const body = { verfahren: z.verfahren, schluessel: z.schluessel, klartext: z.klartext, beschreibung: z.beschreibung.trim() };
      const r = await AQ.api('POST', `/api/arena/${enc(info.arena.id)}/chiffre`, body);
      info.eigene = { ...(info.eigene || {}), verfahren: z.verfahren, geheimtext: r.geheimtext, beschreibung: body.beschreibung };
      AQ.mount(felder.meldung, h('div', { class: 'rueckmeldung ok', role: 'status' }, h('p', null, 'Eingereicht – ihr könnt bis zum Start der Angriffsphase noch ändern.')));
      eigeneZeigen();
    } catch (e) {
      const details = Array.isArray(e.details) ? e.details.filter((d) => typeof d === 'string') : [];
      AQ.mount(felder.meldung, h('div', { class: 'rueckmeldung fehler', role: 'alert' }, h('p', null, e.message), details.length > 1 ? h('ul', null, details.map((d) => h('li', null, d))) : null));
    } finally {
      felder.sendet = false;
      einreichenPruefen();
    }
  }

  function eigeneZeigen() {
    if (!felder) return;
    const e = info.eigene;
    if (!e || !e.geheimtext) {
      AQ.clear(felder.eigene);
      felder.eigene.hidden = true;
      return;
    }
    felder.eigene.hidden = false;
    AQ.mount(felder.eigene, h('h3', null, 'Eure eingereichte Chiffre'), h('p', { class: 'text-2 klein' }, 'So sehen die anderen Teams euren Geheimtext in der Angriffsphase:'), h('code', { class: 'werkstatt-eingereicht' }, e.geheimtext));
  }

  function phaseZeigen() {
    if (!felder) return;
    AQ.mount(
      felder.phase,
      h('p', { class: 'werkstatt-team' }, info.team ? ['Ihr baut als ', h('strong', null, info.team.name), '.'] : OHNE_TEAM),
      h('p', { class: 'werkstatt-phase' }, PHASE_TEXT[info.arena ? info.arena.status : 'keine'] || '')
    );
    if (felder.arenaLink) felder.arenaLink.hidden = !(info.arena && info.arena.status !== 'werkstatt' && typeof KRArena !== 'undefined');
  }

  /** GET /api/arena erneut (Phasenwechsel durch die Lehrkraft) */
  async function aktualisiereArena() {
    if (rolle !== 'schueler') return;
    try {
      const d = await AQ.api('GET', '/api/arena');
      info = { ...info, arena: d.arena, team: d.team, eigene: d.eigene, teilnahme: d.teilnahme ?? info.teilnahme };
    } catch {
      return;
    }
    phaseZeigen();
    eigeneZeigen();
    einreichenPruefen();
  }

  async function verwerfen() {
    const ja = await AQ.bestaetigen('Entwurf verwerfen?', 'Stufen, Schlüssel, Text und Beschreibung werden in diesem Browser gelöscht. Eine eingereichte Chiffre bleibt in der Arena.', { ok: 'Verwerfen', gefahr: true });
    if (!ja) return;
    entwurfLoeschen();
    stufen = [neueStufe('caesar')];
    felder.name.value = '';
    felder.klartext.value = '';
    felder.beschreibung.value = '';
    geaendert = false;
    zeichneStufen();
    pruefe();
    AQ.toast('Entwurf verworfen.');
  }

  /* ---------- Seite ---------- */

  function editor() {
    const f = {};
    f.name = h('input', { id: 'werkstatt-name', class: 'werkstatt-name', type: 'text', maxlength: '40', autocomplete: 'off', placeholder: 'z. B. Die Zickzack-Lawine' });
    f.liste = h('ol', { class: 'stufen', 'aria-label': 'Stufen des Verfahrens' });
    f.neu = h('button', { type: 'button', class: 'knopf knopf-zweit stufe-neu', onclick: neueStufeAnhaengen }, '+ Stufe hinzufügen');
    f.klartext = h('textarea', { id: 'werkstatt-klartext', class: 'werkstatt-klartext', rows: '6', maxlength: '3000', spellcheck: 'true', 'aria-describedby': 'werkstatt-laenge werkstatt-text-hinweis' });
    f.laenge = h('p', { id: 'werkstatt-laenge', class: 'werkstatt-laenge klein', 'aria-live': 'polite' });
    f.beschreibung = h('textarea', { id: 'werkstatt-beschreibung', class: 'werkstatt-beschreibung', rows: '5', maxlength: String(BESCHREIBUNG_MAX), 'aria-describedby': 'werkstatt-zaehler werkstatt-vorlage' });
    f.zaehler = h('p', { id: 'werkstatt-zaehler', class: 'text-2 klein' });
    f.fehler = h('ol', { class: 'werkstatt-fehler' });
    f.fehlerBereich = h('div', { class: 'werkstatt-fehler-bereich rueckmeldung fehler', role: 'status' }, h('p', null, h('strong', null, 'Noch nicht umkehrbar:')), f.fehler);
    f.hinweise = h('ul', { class: 'werkstatt-hinweise' });
    f.hinweiseBereich = h('div', { class: 'werkstatt-hinweise-bereich' }, h('h3', null, 'Werkstatt-Hinweise'), h('p', { class: 'text-2 klein' }, 'Hinweise blockieren nicht – sie zeigen typische Schwächen.'), f.hinweise);
    f.rueck = h('p', { class: 'werkstatt-rueck', 'aria-live': 'polite' });
    f.geheim = h('output', { class: 'werkstatt-geheimtext', for: 'werkstatt-klartext', 'aria-label': 'Geheimtext' });
    f.zwischen = h('ol', { class: 'werkstatt-zwischen-liste' });
    f.zwischenBereich = h('details', { class: 'werkstatt-zwischen' }, h('summary', null, 'Zwischenergebnisse je Stufe'), f.zwischen);
    f.checkliste = h('ul', { class: 'werkstatt-checkliste', 'aria-label': 'Bedingungen fürs Einreichen' });
    f.einreichen = h('button', { type: 'button', class: 'knopf knopf-primaer werkstatt-einreichen', disabled: true, onclick: einreichen }, 'Einreichen');
    f.meldung = h('div', { class: 'werkstatt-meldung' });
    f.eigene = h('section', { class: 'werkstatt-eigene karte', hidden: true });
    f.phase = h('div', { class: 'werkstatt-kopf-info' });
    f.arenaLink = h('a', { class: 'knopf knopf-zweit werkstatt-zur-arena', href: '#/arena', hidden: true }, 'Zur Arena');
    f.sendet = false;

    for (const el of [f.name, f.klartext, f.beschreibung]) {
      el.addEventListener('input', () => {
        geaendert = true;
        if (el !== f.name) laengeZeigen();
        plane();
      });
    }
    const form = h(
      'form',
      { class: 'baukasten', 'aria-labelledby': 'werkstatt-bau-titel', novalidate: true },
      h('h2', { id: 'werkstatt-bau-titel' }, 'Baukasten'),
      h('p', { class: 'text-2' }, 'Euer Verfahren wird öffentlich – nur der Schlüssel bleibt geheim (Kerckhoffs). Kombiniert 1 bis 4 Stufen; XOR nur als letzte Stufe. Mit Alt + ↑/↓ verschiebt ihr eine Stufe.'),
      h('div', { class: 'feld' }, h('label', { for: 'werkstatt-name' }, 'Name des Verfahrens ', h('span', { class: 'text-2 klein' }, '(freiwillig, bis 40 Zeichen)')), f.name),
      f.liste,
      f.neu,
      h('div', { class: 'feld' }, h('label', { for: 'werkstatt-klartext' }, 'Euer Klartext'), h('p', { id: 'werkstatt-text-hinweis', class: 'text-2 klein' }, 'Selbst formulierter deutscher Text, keine Personennamen, nichts abgeschrieben. Gezählt werden die Buchstaben A–Z (Umlaute werden aufgelöst).'), f.klartext, f.laenge),
      h('div', { class: 'feld' }, h('label', { for: 'werkstatt-beschreibung' }, 'Verfahrensbeschreibung'), h('p', { id: 'werkstatt-vorlage', class: 'text-2 klein' }, 'Abitur-Stil: Stufen in Reihenfolge, Schlüsselformat je Stufe, wie man entschlüsselt. Den Schlüssel selbst nicht hineinschreiben!'), f.beschreibung, f.zaehler)
    );
    form.addEventListener('submit', (e) => e.preventDefault());
    const pruefung = h(
      'section',
      { class: 'werkstatt-pruefung', 'aria-labelledby': 'werkstatt-pruef-titel' },
      h('h2', { id: 'werkstatt-pruef-titel' }, 'Prüfung'),
      f.rueck,
      f.fehlerBereich,
      h('div', { class: 'werkstatt-ausgabe' }, h('h3', null, 'Geheimtext'), f.geheim, f.zwischenBereich),
      f.hinweiseBereich,
      h('h3', null, 'Einreichen'),
      f.checkliste,
      h('div', { class: 'werkstatt-einreichen-zeile' }, f.einreichen, f.arenaLink),
      f.meldung,
      f.eigene,
      h('div', { class: 'werkstatt-entwurf' }, h('p', { class: 'text-2 klein' }, 'Euer Entwurf (mit Schlüssel und Text) bleibt nur in diesem Browser. ', TABLET), h('button', { type: 'button', class: 'knopf knopf-zweit entwurf-verwerfen', onclick: verwerfen }, 'Entwurf verwerfen'))
    );
    felder = f;
    return h('div', { class: 'werkstatt-raster' }, form, pruefung);
  }

  function zeigeEditor() {
    if (ansichtArena && typeof ansichtArena.schliesse === 'function') ansichtArena.schliesse();
    ansichtArena = null;
    const alt = felder ? zustand() : null;
    const kopf = h('div', { class: 'werkstatt-kopf' });
    const inhalt = editor();
    AQ.mount(haupt, h('div', { class: 'wrap werkstatt' }, h('h1', null, 'Chiffren-Werkstatt'), kopf, reiter('editor'), inhalt));
    kopf.appendChild(felder.phase);
    if (alt) {
      felder.name.value = alt.verfahren.name || '';
      felder.klartext.value = alt.klartext;
      felder.beschreibung.value = alt.beschreibung;
    }
    zeichneStufen();
    phaseZeigen();
    eigeneZeigen();
    pruefe();
  }

  /** Reiter Werkstatt/Arena (die Arena-Ansicht kommt aus KRArena, Task 157) */
  function reiter(aktiv) {
    if (typeof KRArena === 'undefined' || rolle !== 'schueler') return null;
    const link = (id, href, text) => h('a', { class: `reiter-link${aktiv === id ? ' aktiv' : ''}`, href, 'aria-current': aktiv === id ? 'page' : null }, text);
    return h('nav', { class: 'werkstatt-reiter', 'aria-label': 'Werkstatt und Arena' }, link('editor', '#/', 'Baukasten'), link('arena', '#/arena', 'Knack-Arena'));
  }

  function route() {
    if ((location.hash || '').startsWith('#/arena') && typeof KRArena !== 'undefined' && rolle === 'schueler') {
      if (felder) clearTimeout(timer);
      const z = felder ? zustand() : null;
      felder = null;
      const ort = h('div', { class: 'werkstatt-arena-ort' });
      AQ.mount(haupt, h('div', { class: 'wrap werkstatt' }, h('h1', null, 'Knack-Arena'), reiter('arena'), ort));
      ansichtArena = KRArena.zeige(ort, { info: () => info, aktualisiere: aktualisiereArena });
      merkeZustand = z;
      return;
    }
    zeigeEditor();
    if (merkeZustand) {
      felder.name.value = merkeZustand.verfahren.name || '';
      felder.klartext.value = merkeZustand.klartext;
      felder.beschreibung.value = merkeZustand.beschreibung;
      merkeZustand = null;
      pruefe();
    }
  }
  let merkeZustand = null;

  async function start() {
    haupt = document.getElementById('haupt');
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      rolle = sitzung.rolle;
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'werkstatt', sitzung });
      if (rolle === 'schueler') {
        const d = await AQ.api('GET', '/api/arena');
        info = { arena: d.arena || null, team: d.team || null, eigene: d.eigene || null, teilnahme: d.teilnahme ?? null };
      }
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/spiel#/', text: 'Zur Zeitleiste' } });
      return;
    }
    KR.epoche(3);
    // Entwurf laden; sonst die eingereichte Chiffre (ohne Schlüssel und Text)
    const d = entwurfLaden();
    if (d && d.verfahren) stufen = ausVerfahren(d.verfahren, d.schluessel);
    else if (info.eigene && info.eigene.verfahren) stufen = ausVerfahren(info.eigene.verfahren, {});
    route();
    if (d) {
      felder.name.value = (d.verfahren && typeof d.verfahren.name === 'string' && d.verfahren.name) || '';
      felder.klartext.value = typeof d.klartext === 'string' ? d.klartext : '';
      felder.beschreibung.value = typeof d.beschreibung === 'string' ? d.beschreibung : '';
      pruefe();
    } else if (info.eigene && felder) {
      felder.name.value = (info.eigene.verfahren && info.eigene.verfahren.name) || '';
      felder.beschreibung.value = info.eigene.beschreibung || '';
      pruefe();
    }
    window.addEventListener('hashchange', route);
    // Phasenwechsel der Lehrkraft mitbekommen (Arena-Ansicht pollt selbst)
    if (rolle === 'schueler') {
      arenaTimer = setInterval(() => {
        if (document.hidden === true || !felder) return;
        aktualisiereArena();
      }, 15000);
    }
  }

  document.addEventListener('DOMContentLoaded', start);
  return { start, setzeStufen, zustand, aktualisiereArena, pruefe, PRAEFIX, _stopp: () => clearInterval(arenaTimer) };
})();
