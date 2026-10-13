/* Kryptos – Knack-Arena: Ansicht für Teams auf /werkstatt#/arena (TECHNIK §9.4–§9.6, SPEC W3 §9.4, Plan M7 Task 157,
   E101, E104). Polling über KRPoll auf /api/arena (5 s), danach die Chiffren-Liste. Je Chiffre Team, Verfahrensname,
   Stufen (Parameter „geheim“), Beschreibung, Geheimtext, Status, Versuche; eigene Chiffre markiert und ohne Angriff.
   Angriff per Klartext oder per Schlüssel (je Platzhalter ein Feld); Grenzen des Servers (1 je 30 s je Chiffre, 60 je
   10 min) als Hinweis, 429 als Meldung. Beurteilung (Vorlage WK3) in der Phase „Beurteilung“. Listen werden je Chiffre
   abgeglichen (keine Neuaufbauten), damit Eingaben beim Polling erhalten bleiben. Texte nur als Textknoten. */
'use strict';

const KRArena = (() => {
  const { h } = AQ;
  const enc = encodeURIComponent;
  const INTERVALL = 5000;
  const BEURTEILUNG_MAX = 4000;
  const PHASE = Object.freeze({
    keine: 'Gerade ist keine Arena offen. Eure Lehrkraft öffnet sie im Unterricht.',
    werkstatt: 'Die Angriffsphase beginnt, wenn eure Lehrkraft sie startet. Bis dahin seht ihr nur eure eigene Chiffre.',
    angriff: 'Angriffsphase: Knackt die Verfahren der anderen Teams – per Klartext oder per Schlüssel.',
    beurteilung: 'Die Angriffsphase ist vorbei. Beurteilt jetzt euer eigenes Verfahren.',
    geschlossen: 'Die Arena ist geschlossen – nur lesen.'
  });
  /** Gliederung der Beurteilung (Vorlage WK3, Akte W3·3 Archivwissen 5) */
  const VORLAGE = Object.freeze([
    'Schlüsselraum: Wie viele Schlüssel gibt es? Reicht das gegen Ausprobieren?',
    'Häufigkeitsanalyse: Bleiben Häufigkeiten oder Wortgrenzen sichtbar?',
    'Schwache Schlüssel: Gibt es Schlüssel, die (fast) nichts verändern?',
    'Known-Plaintext: Was verrät ein bekanntes Klartext-Geheimtext-Paar?',
    'Fehlerfortpflanzung: Was passiert, wenn ein Zeichen falsch übertragen wird?',
    'Urteil: „Insgesamt ist unser Verfahren …, weil …“'
  ]);
  const LABOR = Object.freeze([
    ['/labor#/haeufigkeit', 'Häufigkeits-Analysator'],
    ['/labor#/vigenere', 'Vigenère-Werkbank'],
    ['/labor#/bitlupe', 'Bit-Lupe']
  ]);
  const ART = Object.freeze({ wort: 'Wort', zahl: 'Zahl' });

  /**
   * Ansicht in ort aufbauen.
   * @param {HTMLElement} ort
   * @param {{ info: () => object, setzeInfo?: (d: object) => void }} o
   * @returns {{ schliesse(): void, jetzt(): Promise<void> }}
   */
  function zeige(ort, o = {}) {
    let info = typeof o.info === 'function' ? o.info() : {};
    let status = null;
    let chiffren = [];
    let geschlossen = false;
    const karten = new Map(); // id → { el, aktualisiere(c) }
    let bekannte = null; // Abzeichen-Schlüssel
    let uhr = null;

    const phaseEl = h('p', { class: 'arena-phase rueckmeldung info', role: 'status' });
    const restzeitEl = h('p', { class: 'arena-restzeit' });
    const liste = h('ol', { class: 'arena-chiffren', 'aria-label': 'Eingereichte Chiffren' });
    const leer = h('p', { class: 'arena-leer text-2' });
    const beurteilungOrt = h('div', { class: 'arena-beurteilung-ort' });
    const labor = h(
      'aside',
      { class: 'arena-labor-hinweis karte', 'aria-labelledby': 'arena-labor-titel' },
      h('h2', { id: 'arena-labor-titel' }, 'Im Kryptolabor untersuchen'),
      h('p', { class: 'text-2 klein' }, 'Kopiert den Geheimtext (Knopf „Kopieren“) und fügt ihn im Werkzeug ein. Brute Force gehört ins Labor – die Arena prüft höchstens einen Versuch je 30 Sekunden.'),
      h('ul', { class: 'arena-labor-liste' }, LABOR.map(([href, text]) => h('li', null, h('a', { class: 'knopf knopf-zweit arena-labor', href }, text))))
    );
    AQ.mount(ort, h('div', { class: 'arena' }, h('div', { class: 'arena-kopf' }, phaseEl, restzeitEl), h('div', { class: 'arena-raster' }, h('div', { class: 'arena-haupt' }, leer, liste, beurteilungOrt), labor)));

    /* ---------- Abzeichen-Toast ---------- */
    async function abzeichenPruefen() {
      if (typeof KRProfil === 'undefined') return;
      try {
        const p = await AQ.api('GET', '/api/profil');
        const jetzt = Array.isArray(p && p.abzeichen) ? p.abzeichen : [];
        if (bekannte) {
          const neu = jetzt.filter((a) => a && !bekannte.has(a.key));
          if (neu.length) KRProfil.abzeichenToast(neu);
        }
        bekannte = new Set(jetzt.map((a) => a && a.key));
      } catch {
        /* still */
      }
    }

    /* ---------- Restzeit ---------- */
    function restzeit() {
      const bis = info.arena && info.arena.status === 'angriff' && info.arena.angriffBis ? Date.parse(info.arena.angriffBis) : NaN;
      if (Number.isNaN(bis)) {
        restzeitEl.hidden = true;
        return;
      }
      const s = Math.max(0, Math.round((bis - Date.now()) / 1000));
      restzeitEl.hidden = false;
      restzeitEl.textContent = s > 0 ? `Restzeit: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` : 'Die Zeit ist um – gleich beginnt die Beurteilung.';
    }

    /* ---------- Karte einer Chiffre ---------- */
    function angriffsFormular(c, karte) {
      let reiter = 'klartext';
      const ergebnis = h('p', { class: 'arena-ergebnis', 'aria-live': 'polite' });
      const rest = h('p', { class: 'arena-rest text-2 klein' });
      const klar = h('textarea', { class: 'arena-klartext', rows: '3', maxlength: '2000', 'aria-label': `Klartext-Vorschlag für die Chiffre von ${c.team.name}` });
      const felder = (c.schluesselFelder || []).map((f) => {
        const id = `arena-${c.id}-${f.name}`;
        const input = h('input', {
          id,
          class: 'arena-schluessel',
          'data-name': f.name,
          type: f.art === 'zahl' ? 'number' : 'text',
          inputmode: f.art === 'zahl' ? 'numeric' : null,
          min: f.art === 'zahl' ? String(f.min) : null,
          max: f.art === 'zahl' ? String(f.max) : null,
          maxlength: f.art === 'wort' ? String(f.max) : null,
          autocomplete: 'off',
          spellcheck: 'false'
        });
        const bereich = f.art === 'zahl' ? `${f.min}–${f.max}` : `${f.min}–${f.max} Buchstaben`;
        return h('div', { class: 'arena-feld' }, h('label', { for: id }, `${f.name} `, h('span', { class: 'text-2 klein' }, `(${ART[f.art] || f.art}, ${bereich}; Stufe ${(f.stufen || []).join(', ')})`)), input);
      });
      const panelKlar = h('div', { class: 'arena-panel', 'data-reiter': 'klartext' }, h('p', { class: 'text-2 klein' }, 'Gezählt werden nur die Buchstaben A–Z; Groß/Klein, Leerzeichen und Satzzeichen sind egal.'), klar);
      const panelSchl = h('div', { class: 'arena-panel', 'data-reiter': 'schluessel', hidden: true }, felder.length ? felder : h('p', { class: 'text-2' }, 'Dieses Verfahren hat keinen Schlüssel – versucht es mit dem Klartext.'));
      const knopfReiter = (id, text) =>
        h('button', { type: 'button', class: 'knopf knopf-zweit arena-reiter', 'data-reiter': id, 'aria-pressed': id === reiter ? 'true' : 'false', onclick: () => waehle(id) }, text);
      const reiterK = knopfReiter('klartext', 'Klartext');
      const reiterS = knopfReiter('schluessel', 'Schlüssel');
      function waehle(id) {
        reiter = id;
        reiterK.setAttribute('aria-pressed', String(id === 'klartext'));
        reiterS.setAttribute('aria-pressed', String(id === 'schluessel'));
        panelKlar.hidden = id !== 'klartext';
        panelSchl.hidden = id !== 'schluessel';
      }
      const senden = h('button', { type: 'submit', class: 'knopf knopf-primaer arena-senden' }, 'Versuch senden');
      let sperreBis = 0;
      let sperrTimer = null;
      const form = h('form', { class: 'arena-angriff', 'aria-label': `Angriff auf die Chiffre von ${c.team.name}`, novalidate: true }, h('div', { class: 'arena-reiter-zeile', role: 'group', 'aria-label': 'Angriff per' }, reiterK, reiterS), panelKlar, panelSchl, senden, ergebnis, rest);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let body;
        if (reiter === 'klartext') body = { klartext: klar.value };
        else {
          const schluessel = {};
          for (const f of c.schluesselFelder || []) {
            const el = form.querySelector(`input.arena-schluessel[data-name="${f.name}"]`);
            const v = el ? String(el.value).trim() : '';
            schluessel[f.name] = f.art === 'zahl' && /^-?\d{1,6}$/.test(v) ? Number(v) : v;
          }
          body = { schluessel };
        }
        senden.disabled = true;
        ergebnis.className = 'arena-ergebnis';
        try {
          const r = await AQ.api('POST', `/api/arena/${enc(info.arena.id)}/chiffren/${enc(c.id)}/angriff`, body);
          ergebnis.textContent = r.erfolg ? 'Geknackt!' : 'Leider nicht.';
          ergebnis.classList.add(r.erfolg ? 'ok' : 'falsch');
          const r1 = r.rest || {};
          rest.textContent = `Nächster Versuch auf diese Chiffre in ${r1.chiffre ?? 30} s · noch ${r1.team ?? '–'} Versuche in 10 min`;
          sperreBis = Date.now() + (Number(r1.chiffre) || 30) * 1000;
          clearTimeout(sperrTimer);
          sperrTimer = setTimeout(() => {
            if (Date.now() >= sperreBis) rest.textContent = 'Nächster Versuch auf diese Chiffre möglich.';
          }, (Number(r1.chiffre) || 30) * 1000);
          if (r.erfolg) {
            karte.erfolg = true;
            abzeichenPruefen();
          }
          await neuLaden();
        } catch (err) {
          ergebnis.textContent = err.message;
          ergebnis.classList.add('fehler');
        } finally {
          senden.disabled = false;
        }
      });
      return { form, schliesse: () => clearTimeout(sperrTimer) };
    }

    function karte(c) {
      const k = { erfolg: false, angriff: null };
      const statusEl = h('p', { class: 'arena-status' });
      const hinweiseOrt = h('div', { class: 'arena-hinweise' });
      const angriffOrt = h('div', { class: 'arena-angriff-ort' });
      const stufen = (c.stufen || []).map((st, i) => {
        const p = Object.entries(st.param || {}).map(([n, w]) => `${n}: ${w}`).join(', ');
        return `${i + 1}. ${st.kuerzel}${p ? ` (${p})` : ''}`;
      });
      const el = h(
        'li',
        { class: `arena-chiffre karte${c.eigene ? ' eigene' : ''}`, 'data-id': String(c.id) },
        h('h3', { class: 'arena-chiffre-titel' }, c.team.name, c.eigene ? h('span', { class: 'chip chip-eigene' }, 'eure Chiffre') : null),
        c.name ? h('p', { class: 'arena-verfahren' }, h('strong', null, c.name)) : null,
        h('p', { class: 'arena-stufen' }, 'Stufen: ', stufen.join(' → ')),
        h('details', { class: 'arena-beschreibung-bereich', open: true }, h('summary', null, 'Beschreibung'), h('p', { class: 'arena-beschreibung' }, c.beschreibung || '–')),
        h('div', { class: 'arena-geheimtext' }, KRB.geheimtext(c.geheimtext || '', { unveraendert: true })),
        h('p', { class: 'text-2 klein' }, `${c.klartextLaenge} Buchstaben Klartext`),
        statusEl,
        hinweiseOrt,
        angriffOrt
      );
      k.el = el;
      k.aktualisiere = (neu) => {
        const von = Array.isArray(neu.geknacktVon) && neu.geknacktVon.length ? ` von ${neu.geknacktVon.map((x) => x.name).join(', ')}` : '';
        const zeit = Number.isInteger(neu.geknacktNachSek) ? ` nach ${neu.geknacktNachSek} s` : '';
        AQ.mount(
          statusEl,
          h('span', { class: `chip ${neu.geknackt ? 'geknackt' : 'ungeknackt'}` }, neu.geknackt ? `🔓 geknackt${von}${zeit}` : '🔒 ungeknackt'),
          ' · ',
          `${neu.versuche} ${neu.versuche === 1 ? 'Versuch' : 'Versuche'}`
        );
        const hw = Array.isArray(neu.hinweise) ? neu.hinweise : null;
        AQ.mount(hinweiseOrt, hw && hw.length ? h('ul', { class: 'arena-hinweis-liste' }, hw.map((x) => h('li', null, x.p ? KRDiag.chip(x.p) : null, x.p ? ' ' : null, x.text))) : null);
        const angreifbar = !neu.eigene && status === 'angriff';
        if (angreifbar && !k.angriff) {
          k.angriff = angriffsFormular(neu, k);
          AQ.mount(angriffOrt, k.angriff.form);
        } else if (!angreifbar && k.angriff) {
          k.angriff.schliesse();
          k.angriff = null;
          AQ.clear(angriffOrt);
        }
      };
      return k;
    }

    function abgleich() {
      const ids = new Set(chiffren.map((c) => c.id));
      for (const [id, k] of karten) {
        if (!ids.has(id)) {
          if (k.angriff) k.angriff.schliesse();
          k.el.remove();
          karten.delete(id);
        }
      }
      // eigene zuerst, dann nach Liste des Servers (Team-Nummer)
      const sortiert = [...chiffren].sort((a, b) => Number(b.eigene) - Number(a.eigene));
      sortiert.forEach((c, i) => {
        let k = karten.get(c.id);
        if (!k) {
          k = karte(c);
          karten.set(c.id, k);
        }
        k.aktualisiere(c);
        if (liste.children[i] !== k.el) liste.insertBefore(k.el, liste.children[i] || null);
      });
      leer.textContent = chiffren.length ? '' : status === 'werkstatt' ? 'Ihr habt noch keine Chiffre eingereicht – baut sie im Baukasten.' : 'Keine Chiffren.';
      leer.hidden = chiffren.length > 0;
    }

    /* ---------- Beurteilung ---------- */
    let beurteilungAn = false;
    function beurteilung() {
      const an = status === 'beurteilung' && chiffren.some((c) => c.eigene);
      if (an === beurteilungAn) return;
      beurteilungAn = an;
      if (!an) return AQ.clear(beurteilungOrt);
      const text = h('textarea', { id: 'arena-beurteilung-text', rows: '10', maxlength: String(BEURTEILUNG_MAX), placeholder: 'Insgesamt ist unser Verfahren …, weil …', 'aria-describedby': 'arena-beurteilung-zaehler' });
      text.value = (info.eigene && info.eigene.beurteilung) || '';
      const zaehler = h('p', { id: 'arena-beurteilung-zaehler', class: 'text-2 klein' });
      const meldung = h('p', { class: 'arena-beurteilung-meldung', 'aria-live': 'polite' });
      const zaehle = () => (zaehler.textContent = `${text.value.length} / ${BEURTEILUNG_MAX} Zeichen`);
      text.addEventListener('input', () => {
        zaehle();
        meldung.textContent = '';
      });
      zaehle();
      const form = h(
        'form',
        { class: 'arena-beurteilung karte', 'aria-labelledby': 'arena-beurteilung-titel', novalidate: true },
        h('h2', { id: 'arena-beurteilung-titel' }, 'Beurteilung eures Verfahrens'),
        h('p', { class: 'text-2' }, 'Gliederung nach der Vorlage (Akte W3·3): Nur eure Lehrkraft und euer Team lesen die Beurteilung.'),
        h('ol', { class: 'arena-vorlage' }, VORLAGE.map((v) => h('li', null, v))),
        h('label', { for: 'arena-beurteilung-text' }, 'Eure Beurteilung'),
        text,
        zaehler,
        h('button', { type: 'submit', class: 'knopf knopf-primaer' }, 'Speichern'),
        meldung
      );
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        meldung.className = 'arena-beurteilung-meldung';
        try {
          await AQ.api('PUT', `/api/arena/${enc(info.arena.id)}/beurteilung`, { text: text.value });
          meldung.textContent = 'Gespeichert.';
          meldung.classList.add('ok');
          if (info.eigene) info.eigene.beurteilung = text.value.trim();
        } catch (err) {
          meldung.textContent = err.message;
          meldung.classList.add('fehler');
        }
      });
      AQ.mount(beurteilungOrt, form);
    }

    /* ---------- Daten ---------- */
    async function beiDaten(d) {
      if (geschlossen) return;
      info = { ...info, arena: d.arena || null, team: d.team || null, eigene: d.eigene || null, teilnahme: d.teilnahme ?? info.teilnahme };
      if (typeof o.setzeInfo === 'function') o.setzeInfo(info);
      const neuStatus = info.arena ? info.arena.status : 'keine';
      const wechsel = status !== null && neuStatus !== status;
      status = neuStatus;
      phaseEl.textContent = info.team || !info.arena ? PHASE[status] : `${PHASE[status]} Du bist keinem Team zugeteilt – angreifen kann nur ein Team.`;
      restzeit();
      if (info.arena && info.team) {
        try {
          chiffren = await AQ.api('GET', `/api/arena/${enc(info.arena.id)}/chiffren`);
        } catch {
          chiffren = [];
        }
      } else chiffren = [];
      if (geschlossen) return;
      abgleich();
      beurteilung();
      if (wechsel) abzeichenPruefen();
    }

    /** Liste sofort neu laden (nach einem eigenen Angriff: Versuche, Status) */
    async function neuLaden() {
      if (geschlossen || !info.arena || !info.team) return;
      try {
        chiffren = await AQ.api('GET', `/api/arena/${enc(info.arena.id)}/chiffren`);
      } catch {
        return;
      }
      if (!geschlossen) abgleich();
    }

    const poller = KRPoll.starte({
      url: () => '/api/arena',
      intervall: INTERVALL,
      beiDaten: (d) => {
        beiDaten(d);
      },
      beiZustand: (z) => {
        ort.classList.toggle('gestoert', z === 'gestoert');
      }
    });
    abzeichenPruefen();
    uhr = setInterval(restzeit, 1000);

    return {
      jetzt: () => poller.jetzt(),
      schliesse() {
        geschlossen = true;
        poller.stopp();
        clearInterval(uhr);
        for (const k of karten.values()) if (k.angriff) k.angriff.schliesse();
      }
    };
  }

  return { zeige, VORLAGE };
})();
