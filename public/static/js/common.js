/* Lab-Kern – gemeinsame Hilfsfunktionen (kein Build, Vanilla JS, keine Inline-Skripte) */
'use strict';

const AQ = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /** DOM-Element erzeugen – Texte werden immer als Textknoten eingefügt (XSS-sicher). */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    setAttrs(el, attrs);
    appendAll(el, children);
    return el;
  }

  /** SVG-Element erzeugen. */
  function s(tag, attrs, ...children) {
    const el = document.createElementNS(SVG_NS, tag);
    setAttrs(el, attrs);
    appendAll(el, children);
    return el;
  }

  function setAttrs(el, attrs) {
    if (!attrs) return;
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else el.style[sk] = sv;
        }
      } else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }

  function appendAll(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  function mount(el, ...children) {
    clear(el);
    appendAll(el, children);
    return el;
  }

  async function api(method, url, body) {
    const opts = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(url, opts);
    } catch {
      // neutral formuliert: common.js dient der Schüler- (du) und der Lehrkraft-Seite (Sie) – Review M4 K1/K35
      const e = new Error('Keine Verbindung zum Server. Bitte die Netzwerkverbindung prüfen.');
      e.status = 0;
      throw e;
    }
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) data = await res.json();
    if (res.status === 401 && data && data.anmelden) {
      zurAnmeldung();
      return new Promise(() => {}); // Seite wechselt; keine Fehlermeldung anzeigen
    }
    if (!res.ok) {
      // Antwort ohne JSON (HTML-Fehlerseite eines Proxys bei 500/502/503/504): verständlich statt „Fehler 502“
      const ohneJson = !ct.includes('application/json');
      const text = data && data.error ? data.error : ohneJson && res.status >= 500 ? `Der Server antwortet gerade nicht (Fehler ${res.status}). Bitte später erneut versuchen.` : ohneJson ? `Unerwartete Antwort vom Server (Fehler ${res.status}). Bitte später erneut versuchen.` : `Fehler ${res.status}`;
      const err = new Error(text);
      err.status = res.status;
      err.data = data;
      err.details = data && data.details;
      throw err;
    }
    return data;
  }

  /* Vor der stillen Neuanmeldung (401): registrierte Aufräum-Funktionen, z. B. Werkstatt-Entwürfe auf geteilten Tablets
     löschen (Kryptos, Review M7 K5); Fehler einer Funktion halten die Umleitung nicht auf. */
  const vorAnmeldungListe = [];
  function vorAnmeldung(fn) {
    if (typeof fn === 'function' && !vorAnmeldungListe.includes(fn)) vorAnmeldungListe.push(fn);
  }
  /** Kryptos: keine eigene Anmeldung – still über das Portal neu anmelden (TECHNIK §6.4); Hash bleibt im ziel erhalten */
  function zurAnmeldung() {
    for (const fn of vorAnmeldungListe) {
      try {
        fn();
      } catch {
        /* weiter */
      }
    }
    location.href = '/sso/start?ziel=' + encodeURIComponent(location.pathname + location.hash);
  }

  let toastTimer;
  function toast(msg, art = '') {
    let t = document.getElementById('toast');
    if (!t) {
      t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = art === true ? 'err' : art || '';
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), art === true || art === 'err' ? 6000 : 3500);
  }

  function fmtDatum(iso) {
    if (!iso) return '–';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  function progress(fraction, cls = '') {
    const pct = Math.round(Math.max(0, Math.min(1, fraction || 0)) * 100);
    return h('div', { class: 'progress ' + cls, role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': `${pct} Prozent` }, h('span', { style: { width: pct + '%' } }));
  }

  function prozent(x) {
    return Math.round((x || 0) * 100) + ' %';
  }

  function sterne(stufe) {
    return h('span', { class: 'sterne', 'aria-label': `Stufe ${stufe}`, title: `Stufe ${stufe}` }, '★'.repeat(stufe) + '☆'.repeat(Math.max(0, 3 - stufe)));
  }

  /** Bestätigungsdialog (Promise<boolean>). */
  function bestaetigen(titel, text, { ok = 'OK', abbrechen = 'Abbrechen', gefahr = false, eingabe = null } = {}) {
    return new Promise((resolve) => {
      const feld = eingabe ? h('input', { type: 'text', 'aria-label': eingabe.label || 'Bestätigung', autocomplete: 'off', placeholder: eingabe.platzhalter || '' }) : null;
      const okBtn = h('button', { class: 'btn ' + (gefahr ? 'danger' : ''), type: 'button' }, ok);
      const d = h(
        'dialog',
        { 'aria-labelledby': 'dlg-titel' },
        h('h2', { id: 'dlg-titel' }, titel),
        typeof text === 'string' ? h('p', null, text) : text,
        feld ? h('div', { class: 'field' }, h('label', null, eingabe.label), feld) : null,
        h('div', { class: 'btn-row' }, okBtn, h('button', { class: 'btn secondary', type: 'button', onclick: () => fertig(false) }, abbrechen))
      );
      function fertig(v) {
        d.close();
        d.remove();
        resolve(v);
      }
      okBtn.addEventListener('click', () => {
        if (feld) {
          if (eingabe.muss !== undefined && feld.value.trim() !== eingabe.muss) {
            feld.setAttribute('aria-invalid', 'true');
            feld.focus();
            toast('Die Eingabe stimmt nicht.', true);
            return;
          }
          return fertig(feld.value);
        }
        fertig(true);
      });
      d.addEventListener('cancel', (e) => {
        e.preventDefault();
        fertig(false);
      });
      document.body.appendChild(d);
      d.showModal();
      (feld || okBtn).focus();
    });
  }

  function download(url) {
    const a = h('a', { href: url, download: '' });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
      r.readAsText(file, 'utf-8');
    });
  }

  /** Mischen (Fisher-Yates). */
  function mische(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function speichere(key, wert) {
    try {
      localStorage.setItem(key, JSON.stringify(wert));
    } catch {
      /* egal */
    }
  }
  function lade(key, standard) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? standard : v;
    } catch {
      return standard;
    }
  }

  /* ---------- Profil-Einstellungen (nur in diesem Browser) ---------- */
  const EINSTELLUNGEN = { thema: ['auto', 'hell', 'dunkel'], bewegung: ['auto', 'aus'] };
  const EINSTELLUNGEN_SCHLUESSEL = 'kr_einstellungen';
  function einstellungenLesen() {
    try {
      const v = JSON.parse(localStorage.getItem(EINSTELLUNGEN_SCHLUESSEL));
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch {
      return {};
    }
  }
  /** einstellung(name) liest, einstellung(name, wert) schreibt; unbekannter Name/Wert → TypeError. */
  function einstellung(name, wert) {
    const erlaubt = Object.prototype.hasOwnProperty.call(EINSTELLUNGEN, name) ? EINSTELLUNGEN[name] : null;
    if (!erlaubt) throw new TypeError('Unbekannte Einstellung: ' + name);
    if (wert === undefined) {
      const v = einstellungenLesen()[name];
      return erlaubt.includes(v) ? v : erlaubt[0];
    }
    if (!erlaubt.includes(wert)) throw new TypeError(`Einstellung ${name}: ungültiger Wert.`);
    const alle = einstellungenLesen();
    alle[name] = wert;
    try {
      localStorage.setItem(EINSTELLUNGEN_SCHLUESSEL, JSON.stringify(alle));
    } catch {
      /* Speicher gesperrt – Einstellung gilt nur bis zum Neuladen */
    }
    return wert;
  }

  /* ---------- Effekte (rein dekorativ, aria-hidden; bei „Bewegung reduzieren“ aus) ---------- */
  /** true, wenn das System reduzierte Bewegung wünscht oder im Profil „Bewegung aus“ gewählt ist. */
  function ruhig() {
    const medien = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !!medien || einstellung('bewegung') === 'aus';
  }
  // Ausnahme von der Token-Regel (nur dieser Effekt, dekorativ): Messing, Papier, Akzente als feste Farben
  const FUNKEN_FARBEN = ['#D9A441', '#B07D2B', '#FBF7EE', '#7BC67E', '#E8957B'];

  /** Funkenregen an einem Element (richtige Antwort, Boss besiegt …). stark = mehr und weiter. */
  function funken(el, { stark = false } = {}) {
    if (!el || ruhig()) return;
    const r = el.getBoundingClientRect();
    const box = h('div', { class: 'funken', 'aria-hidden': 'true' });
    box.style.left = r.left + Math.min(r.width, 220) / 2 + 'px';
    box.style.top = r.top + r.height / 2 + 'px';
    const n = stark ? 70 : 28;
    for (let i = 0; i < n; i++) {
      const f = h('span', { class: i % 3 ? 'funke' : 'funke stern' });
      const winkel = Math.random() * Math.PI * 2;
      const weite = (stark ? 120 : 60) + Math.random() * (stark ? 220 : 110);
      f.style.setProperty('--dx', Math.cos(winkel) * weite + 'px');
      f.style.setProperty('--dy', Math.sin(winkel) * weite - (stark ? 80 : 40) + 'px');
      f.style.setProperty('--dreh', Math.round(Math.random() * 720 - 360) + 'deg');
      f.style.background = FUNKEN_FARBEN[i % FUNKEN_FARBEN.length];
      f.style.animationDelay = Math.random() * 0.12 + 's';
      f.style.animationDuration = (stark ? 1.3 : 0.9) + Math.random() * 0.5 + 's';
      box.appendChild(f);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), stark ? 2400 : 1700);
  }

  /** aufsteigender Text (z. B. „+8“) über einem Element */
  function schweben(el, text) {
    if (!el || ruhig()) return;
    const r = el.getBoundingClientRect();
    const t = h('div', { class: 'schweben', 'aria-hidden': 'true' }, text);
    t.style.left = r.left + Math.min(r.width, 220) / 2 + 'px';
    t.style.top = r.top + 'px';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1600);
  }

  /** kurzes Wackeln (falsche Antwort) */
  function wackeln(el) {
    if (!el || ruhig()) return;
    el.classList.remove('wackeln');
    void el.offsetWidth; // Animation neu starten
    el.classList.add('wackeln');
  }

  const effekt = { funken, schweben, wackeln };

  /* ---------- Niveau (Kryptos, DESIGNSYSTEM §5): Kern · eA · Ergänzung · Kür ---------- */
  const NIVEAU_TEXT = {
    kern: { kurz: 'K', lang: 'Kern – für gA und eA' },
    eA: { kurz: 'eA', lang: 'nur erhöhtes Niveau (eA)' },
    ergaenzung: { kurz: 'E', lang: 'Ergänzung – freiwillig für gA und eA' },
    kuer: { kurz: 'Kür', lang: 'Kür – Vertiefung über das Abitur hinaus' }
  };
  const NIVEAU_ALT = { alle: 'kern', plus: 'kuer' };
  /** Niveau-Chip; vorschau: Lehrkraft-Vorschau (eA-Inhalte mit Hinweis „im gA-Kurs ausgeblendet“). */
  function niveau(n, { kursNiveau = 'eA', vorschau = false } = {}) {
    const id = NIVEAU_ALT[n] || (Object.prototype.hasOwnProperty.call(NIVEAU_TEXT, n) ? n : 'kern');
    const t = NIVEAU_TEXT[id];
    const zusatz = vorschau && id === 'eA' ? ' · im gA-Kurs ausgeblendet' : '';
    return h('span', { class: `chip chip-niveau niveau-${id}`, title: t.lang + zusatz }, t.kurz + zusatz);
  }

  function rolleText(rolle) {
    return { kryptografie: '🛡 Kryptografie', kryptoanalyse: '🔍 Kryptoanalyse' }[rolle] || '';
  }

  return { SVG_NS, h, s, clear, mount, api, vorAnmeldung, zurAnmeldung, toast, fmtDatum, progress, prozent, sterne, bestaetigen, download, readFile, mische, speichere, lade, effekt, ruhig, einstellung, niveau, NIVEAU_TEXT, rolleText };
})();
