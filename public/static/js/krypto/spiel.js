/* Kryptos – Schüler-Seite /spiel (TECHNIK §11.1/§11.2, Design §7.1, M4 Tasks 57–60): Sitzung, Kopfzeile, Hash-Router.
   Routen: #/ Zeitleiste · #/epoche/<nr> · #/level/<id> · #/aufgabe/<id> · #/archivfund/<nr> · #/training/<nr> ·
   #/boss/<nr> · #/kampf/<id> · #/warmup · #/profil · #/scoreboard[/<nr>] · #/kurs; Unbekanntes → #/.
   Keine eigene Anmeldung (401 → still über das Portal, AQ.api). Ansichten liegen in zeitleiste.js, epoche.js, level.js,
   profil.js; hier nur Daten holen, Epoche/Kopfzeile setzen und einhängen. Texte nur als Textknoten. */
'use strict';

const KRSpiel = (() => {
  const { h, api, toast } = AQ;
  let sitzung = null;
  let haupt = null;
  let weltenAnfrage = null;
  let laborAnfrage = null;
  let routeNr = 0;
  const aufraeumer = new Set(); // Funktionen, die beim Routenwechsel laufen (Timer, Kopfzeile)
  const ROUTEN = new Map(); // name → async (arg, r) => void
  const BEREICH = { '': 'zeitleiste', epoche: 'zeitleiste', level: 'zeitleiste', aufgabe: 'zeitleiste', archivfund: 'zeitleiste', training: 'zeitleiste', boss: 'zeitleiste', kampf: 'zeitleiste', warmup: 'warmup', profil: 'profil', scoreboard: 'scoreboard' };

  /** Welten (GET /api/welten) mit Cache; { neu: true } lädt neu (nach dem Lösen). */
  function welten({ neu = false } = {}) {
    if (neu || !weltenAnfrage) {
      weltenAnfrage = api('GET', '/api/welten');
      weltenAnfrage.catch(() => (weltenAnfrage = null));
    }
    return weltenAnfrage;
  }

  /** Werkzeug-Freigaben (GET /api/labor), je Route einmal; liefert werkzeugFrei(id) (unbekannt/Fehler → false). */
  function labor() {
    if (!laborAnfrage) {
      laborAnfrage = api('GET', '/api/labor')
        .then((r) => {
          const liste = Array.isArray(r && r.werkzeuge) ? r.werkzeuge : [];
          return { boss: !!(r && r.boss), werkzeuge: liste, werkzeugFrei: (id) => liste.some((w) => w.id === id && w.frei) };
        })
        .catch(() => ({ boss: false, werkzeuge: [], werkzeugFrei: () => false }));
    }
    return laborAnfrage;
  }

  /** Ansicht einhängen: Titel „<titel> · Kryptos“, #haupt füllen, h1 fokussieren. */
  function seite(titel, ...inhalt) {
    document.title = `${titel} · Kryptos`;
    AQ.mount(haupt, ...inhalt);
    const h1 = haupt.querySelector('h1');
    if (h1) {
      if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
      h1.focus();
    }
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }

  function fehler(e) {
    if (e && e.status === 401) return; // AQ.api leitet still zum Portal
    document.title = 'Fehler · Kryptos';
    KR.fehler(haupt, e, { zurueck: { href: '#/', text: 'Zur Zeitleiste' } });
    const box = haupt.querySelector('.fehler-box');
    if (box) box.classList.add('wrap');
  }

  /** Epoche der Ansicht setzen (Akzent, Kopfzeilen-Text). */
  function epoche(w) {
    if (!w) {
      KR.epoche(6);
      KRKopf.epoche('Archiv der verborgenen Schriften');
      return;
    }
    KR.epoche(w.nr, { farbe: w.farbe, akzentHell: w.akzentHell });
    KRKopf.epoche(w.titel);
  }

  /** Aufräumen beim nächsten Routenwechsel (Timer, Kopfzeilen-Zustand). */
  function beimVerlassen(fn) {
    aufraeumer.add(fn);
  }

  /* ---------- Routen (Task 57) ---------- */

  async function zeitleiste(_arg, r) {
    epoche(null);
    const [d, p] = await Promise.all([welten(), api('GET', '/api/profil').catch(() => null)]);
    if (!r.gueltig()) return;
    seite('Zeitleiste', KRZeitleiste.ansicht(d, { name: sitzung.name, rang: p && p.rang, punkte: p && p.punkte }));
    requestAnimationFrame(() => KRZeitleiste.anordnen());
  }

  /** Freie Welt nr aus dem Cache (gesperrt/unbekannt → Fehler mit Text). */
  async function freieWelt(nrRoh) {
    const d = await welten();
    const nr = Number(nrRoh);
    const w = (d.welten || []).find((x) => x.nr === nr);
    if (!w) throw new Error('Diese Epoche gibt es nicht.');
    if (!w.frei) throw new Error('Diese Epoche ist noch verschlüsselt.');
    return { d, w };
  }

  async function epocheRoute(nr, r) {
    const { d, w } = await freieWelt(nr);
    if (!r.gueltig()) return;
    epoche(w);
    seite(w.titel, KREpoche.ansicht(w, { niveau: d.niveau, welten: d.welten }));
  }

  function kurs(_arg, r) {
    if (!r.gueltig()) return;
    epoche(null);
    const jetzt = sitzung.kurs && sitzung.kurs.id;
    const aktive = (sitzung.kurse || []).filter((k) => k.aktiv);
    seite(
      'Kurs wählen',
      h(
        'div',
        { class: 'wrap stapel seite-kurs' },
        h('h1', null, 'Kurs wählen'),
        h('p', { class: 'text-2' }, 'Du bist in mehreren Kursen. Punkte, Fortschritt und Scoreboard gehören immer zum gewählten Kurs.'),
        aktive.length
          ? h(
              'ul',
              { class: 'kurs-liste' },
              aktive.map((k) =>
                h(
                  'li',
                  { class: 'karte kurs-karte' },
                  h('b', null, k.name),
                  k.id === jetzt ? h('span', { class: 'chip chip-neutral' }, '✓ aktueller Kurs') : null,
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'knopf ' + (k.id === jetzt ? 'knopf-zweit' : 'knopf-primaer') + ' kurs-waehlen',
                      onclick: async (e) => {
                        e.currentTarget.disabled = true;
                        try {
                          await api('POST', '/api/sitzung/kurs', { kurs: k.id });
                          location.hash = '#/';
                          location.reload();
                        } catch (err) {
                          e.currentTarget.disabled = false;
                          toast(err.message, true);
                        }
                      }
                    },
                    'Diesen Kurs wählen'
                  )
                )
              )
            )
          : h('p', { class: 'leer-zustand' }, 'Du bist in keinem aktiven Kurs.'),
        h('p', null, h('a', { class: 'knopf knopf-zweit', href: '#/' }, 'Zur Zeitleiste'))
      )
    );
  }

  /* ---------- Routen (Task 58): Level, Aufgabe, Archivfund ---------- */

  const enc = encodeURIComponent;
  const abzeichenToast = (neu) => typeof KRProfil.abzeichenToast === 'function' && KRProfil.abzeichenToast(neu);

  /** Welt-Kopf aus einer Antwort ({ nr, titel, farbe }) – akzentHell aus dem Welten-Cache, falls vorhanden. */
  async function weltVon(w) {
    try {
      const d = await welten();
      return (d.welten || []).find((x) => x.nr === w.nr) || w;
    } catch {
      return w;
    }
  }

  async function levelRoute(id, r) {
    const [d, lab] = await Promise.all([api('GET', `/api/levels/${enc(id)}`), labor()]);
    if (!r.gueltig()) return;
    epoche(await weltVon(d.welt));
    seite(d.level.titel, KRLevel.ansicht(d, { werkzeugFrei: lab.werkzeugFrei, werkzeuge: lab.werkzeuge }));
  }

  async function aufgabeRoute(id, r) {
    const [d, lab, w] = await Promise.all([api('GET', `/api/aufgaben/${enc(id)}`), labor(), welten().catch(() => ({}))]);
    if (!r.gueltig()) return;
    const o = d.ort;
    const pfad = `/api/aufgaben/${enc(id)}`;
    epoche(await weltVon(o.welt));
    const ansicht = AQA.ansicht({
      aufgabe: d.aufgabe,
      zustand: d.zustand,
      loesung: d.loesung,
      muster: d.muster,
      erklaerung: d.erklaerung,
      modus: 'lab',
      zusatz: { werkzeugFrei: lab.werkzeugFrei },
      anzeige: KRDiag.anzeige,
      kursNiveau: w.niveau || (sitzung.kurs && sitzung.kurs.niveau) || 'eA',
      pruefen: (body) => api('POST', `${pfad}/pruefen`, body),
      tipp: () => api('POST', `${pfad}/tipp`, {}),
      aufdecken: () => api('POST', `${pfad}/aufdecken`, {}),
      weiter: o.nachher ? { href: `#/aufgabe/${enc(o.nachher)}`, text: 'Nächste Aufgabe →' } : { href: `#/level/${enc(o.level.id)}`, text: 'Zurück zum Level →' },
      abzeichenToast,
      nachLoesen: () => welten({ neu: true }).catch(() => {})
    });
    seite(
      d.aufgabe.titel,
      h(
        'div',
        { class: 'wrap aufgabe-seite' },
        KRLevel.brotkrumen(o.welt, h('a', { href: `#/level/${enc(o.level.id)}` }, o.level.titel), h('span', { 'aria-current': 'page' }, `Aufgabe ${o.index + 1} von ${o.anzahl}`)),
        ansicht
      )
    );
  }

  async function archivfundRoute(nr, r) {
    const pfad = `/api/archivfund/${enc(nr)}`;
    const [d, lab] = await Promise.all([api('GET', pfad), labor()]);
    if (!r.gueltig()) return;
    epoche(await weltVon(d.welt));
    const ansicht = AQA.ansicht({
      aufgabe: d.aufgabe,
      zustand: d.zustand,
      loesung: d.loesung,
      muster: d.muster,
      erklaerung: d.erklaerung,
      modus: 'lab',
      zusatz: { werkzeugFrei: lab.werkzeugFrei },
      anzeige: KRDiag.anzeige,
      pruefen: (body) => api('POST', `${pfad}/pruefen`, body),
      tipp: () => api('POST', `${pfad}/tipp`, {}),
      aufdecken: () => api('POST', `${pfad}/aufdecken`, {}),
      punkteText: () => '✔ Entschlüsselt! (Archivfund – ohne Punkte)',
      kopfZusatz: h('span', { class: 'chip chip-neutral' }, 'Archivfund · Einstiegsrätsel der Epoche'),
      weiter: { href: `#/epoche/${d.welt.nr}`, text: 'Zur Epoche →' },
      nachLoesen: () => welten({ neu: true }).catch(() => {})
    });
    seite(
      d.titel || d.aufgabe.titel,
      h('div', { class: 'wrap aufgabe-seite archivfund-seite' }, KRLevel.brotkrumen(d.welt, h('span', { 'aria-current': 'page' }, `Archivfund: ${d.titel || d.aufgabe.titel}`)), ansicht)
    );
  }

  ROUTEN.set('level', levelRoute);
  ROUTEN.set('aufgabe', aufgabeRoute);
  ROUTEN.set('archivfund', archivfundRoute);
  ROUTEN.set('', zeitleiste);
  ROUTEN.set('epoche', epocheRoute);
  ROUTEN.set('kurs', kurs);

  /** Route registrieren (weitere Ansichten in Tasks 58–60). */
  function route(name, fn) {
    ROUTEN.set(name, fn);
  }

  /* ---------- Router ---------- */

  function teileDerAdresse() {
    try {
      return (location.hash || '').replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    } catch {
      return [''];
    }
  }

  async function navigiere() {
    for (const fn of aufraeumer) {
      try {
        fn();
      } catch {
        /* weiter */
      }
    }
    aufraeumer.clear();
    laborAnfrage = null;
    const t = document.getElementById('toast');
    if (t && !t.classList.contains('gold')) t.hidden = true;
    const meine = ++routeNr;
    const r = { gueltig: () => meine === routeNr };
    let [name, arg, ...rest] = teileDerAdresse();
    if (!ROUTEN.has(name || '')) {
      if (history && history.replaceState) history.replaceState(null, '', '#/');
      name = '';
      arg = undefined;
    }
    KRKopf.aktiv(BEREICH[name || ''] || null);
    KR.laden(haupt);
    try {
      await ROUTEN.get(name || '')(arg, r, rest);
    } catch (e) {
      if (r.gueltig()) fehler(e);
    }
  }

  async function start() {
    haupt = document.getElementById('haupt');
    KR.laden(haupt);
    try {
      sitzung = await api('GET', '/api/sitzung');
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
      return;
    }
    if (!sitzung || sitzung.rolle !== 'schueler') {
      location.replace('/');
      return;
    }
    let scoreboard = false;
    try {
      scoreboard = !!(await welten()).scoreboard;
    } catch {
      /* Fehler zeigt die Route */
    }
    KRKopf.baue({ rolle: 'schueler', aktiv: 'zeitleiste', sitzung, scoreboard });
    window.addEventListener('hashchange', navigiere);
    await navigiere();
  }
  document.addEventListener('DOMContentLoaded', start);

  return {
    welten,
    labor,
    seite,
    fehler,
    epoche,
    beimVerlassen,
    route,
    sitzung: () => sitzung,
    neu: navigiere
  };
})();
