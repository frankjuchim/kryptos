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

  /** Werkzeug-Freigaben (GET /api/labor), je Route einmal ({ neu: true } fragt neu); liefert werkzeugFrei(id)
      (unbekannt/Fehler → false), niveau, welten und laborUmgebung (Reiter-Regeln, M6 E71). */
  function labor({ neu = false } = {}) {
    if (neu || !laborAnfrage) {
      laborAnfrage = api('GET', '/api/labor')
        .then((r) => {
          const liste = Array.isArray(r && r.werkzeuge) ? r.werkzeuge : [];
          const niveau = r && r.niveau === 'gA' ? 'gA' : 'eA';
          const weltenFrei = Array.isArray(r && r.welten) ? r.welten : [];
          return {
            boss: !!(r && r.boss),
            niveau,
            welten: weltenFrei,
            werkzeuge: liste,
            werkzeugFrei: (id) => liste.some((w) => w.id === id && w.frei),
            // Umgebung für Werkzeug-Dialoge in Aufgaben: Reiter-Regeln des aktiven Kurses (M6 E71, Task 125)
            laborUmgebung: { modus: 'lab', rolle: 'schueler', niveau, welten: weltenFrei, ...(r && r.boss ? { gesperrt: 'boss' } : {}) }
          };
        })
        .catch(() => ({ boss: false, niveau: 'eA', welten: [], werkzeuge: [], werkzeugFrei: () => false, laborUmgebung: { modus: 'lab', rolle: 'schueler', niveau: 'eA', welten: [] } }));
    }
    return laborAnfrage;
  }

  /** Umgebung für einen Werkzeug-Dialog, frisch aus /api/labor (Review M6: Kampf in einem anderen Tab); gesperrt, wenn
      ein Kampf läuft oder das Werkzeug inzwischen nicht mehr frei ist. extra (z. B. { level }) wird angehängt. */
  async function laborFrisch(id, extra = {}) {
    const l = await labor({ neu: true });
    const w = l.werkzeuge.find((x) => x && x.id === id);
    const gesperrt = l.boss ? 'boss' : w && !w.frei ? w.grund || 'lehrkraft' : null;
    return { ...l.laborUmgebung, ...(gesperrt ? { gesperrt } : {}), ...extra };
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
        h('p', { class: 'text-2' }, aktive.length > 1 ? 'Du bist in mehreren Kursen. Punkte, Fortschritt und Scoreboard gehören immer zum gewählten Kurs.' : aktive.length === 1 ? 'Du bist zurzeit nur in einem Kurs – Punkte, Fortschritt und Scoreboard gehören zu diesem Kurs. Weitere Kurse vergibt deine Lehrkraft im Portal.' : 'Du bist zurzeit in keinem aktiven Kurs. Kurse vergibt deine Lehrkraft im Portal.'),
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
    // M11 (E218): gelöste bzw. angesehene Aufgabe → geführte Werkzeuge vergleichen sofort
    if (d.zustand && d.zustand.status && d.zustand.status !== 'offen') KRPanel.freigeben(d.aufgabe.id);
    const ansicht = AQA.ansicht({
      aufgabe: d.aufgabe,
      zustand: d.zustand,
      loesung: d.loesung,
      muster: d.muster,
      erklaerung: d.erklaerung,
      modus: 'lab',
      zusatz: { aufgabeId: d.aufgabe.id, werkzeugFrei: lab.werkzeugFrei, laborUmgebung: { ...lab.laborUmgebung, level: o.level.id }, laborFrisch: (wid) => laborFrisch(wid, { level: o.level.id }) }, // Level-Kontext für Reiter-Regeln (MitM in W5-L3)
      anzeige: KRDiag.anzeige,
      kursNiveau: w.niveau || (sitzung.kurs && sitzung.kurs.niveau) || 'eA',
      pruefen: (body) => api('POST', `${pfad}/pruefen`, body),
      tipp: () => api('POST', `${pfad}/tipp`, {}),
      aufdecken: async () => {
        const x = await api('POST', `${pfad}/aufdecken`, {});
        KRPanel.freigeben(d.aufgabe.id); // Lösung angesehen → Vergleich im Werkzeug (E218)
        return x;
      },
      weiter: o.nachher ? { href: `#/aufgabe/${enc(o.nachher)}`, text: 'Nächste Aufgabe →' } : { href: `#/level/${enc(o.level.id)}`, text: 'Zurück zum Level →' },
      abzeichenToast,
      nachLoesen: (x) => {
        KRPanel.freigeben(d.aufgabe.id); // gelöst → Vergleich im Werkzeug (E218)
        welten({ neu: true }).catch(() => {});
        if (x && x.punkteErhalten) KRKopf.rangNeu(); // Rang-Plakette sofort aktualisieren
      }
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
    if (d.zustand && d.zustand.status && d.zustand.status !== 'offen') KRPanel.freigeben(d.aufgabe.id);
    const ansicht = AQA.ansicht({
      aufgabe: d.aufgabe,
      zustand: d.zustand,
      loesung: d.loesung,
      muster: d.muster,
      erklaerung: d.erklaerung,
      modus: 'lab',
      zusatz: { aufgabeId: d.aufgabe.id, werkzeugFrei: lab.werkzeugFrei, laborUmgebung: lab.laborUmgebung, laborFrisch: (wid) => laborFrisch(wid) },
      anzeige: KRDiag.anzeige,
      pruefen: (body) => api('POST', `${pfad}/pruefen`, body),
      tipp: () => api('POST', `${pfad}/tipp`, {}),
      aufdecken: async () => {
        const x = await api('POST', `${pfad}/aufdecken`, {});
        KRPanel.freigeben(d.aufgabe.id);
        return x;
      },
      punkteText: () => '✔ Entschlüsselt! (Archivfund – ohne Punkte)',
      ohnePunkte: 'Archivfund – ohne Punkte',
      kopfZusatz: h('span', { class: 'chip chip-neutral' }, 'Einstiegsrätsel der Epoche'),
      weiter: { href: `#/epoche/${d.welt.nr}`, text: 'Zur Epoche →' },
      nachLoesen: () => {
        KRPanel.freigeben(d.aufgabe.id);
        welten({ neu: true }).catch(() => {});
      }
    });
    seite(
      d.titel || d.aufgabe.titel,
      h('div', { class: 'wrap aufgabe-seite archivfund-seite' }, KRLevel.brotkrumen(d.welt, h('span', { 'aria-current': 'page' }, `Archivfund: ${d.titel || d.aufgabe.titel}`)), ansicht)
    );
  }

  /* ---------- Routen (Task 59): Trainingsplatz, Boss, Kampf, Warm-up ---------- */

  const zeit = (iso) => KR.zeitText(iso);

  async function trainingRoute(nr, r) {
    const info = await api('GET', `/api/training/${enc(nr)}`);
    if (!r.gueltig()) return;
    epoche(await weltVon(info.welt));
    const gens = Array.isArray(info.generatoren) ? info.generatoren : [];
    let wahl = AQ.lade('kr_training_' + info.welt.nr, '');
    if (wahl && !gens.some((g) => g.key === wahl)) wahl = '';
    const stand = h('p', { class: 'training-stand', 'aria-live': 'polite' });
    const box = h('div', { class: 'training-aufgabe' });
    const zeigeStand = () => {
      stand.textContent = `Trainingspunkte heute ${info.heute} von ${info.maxProTag} Punkten · insgesamt ${info.geloestGesamt} Trainingsaufgaben gelöst.`;
    };
    const zustandVon = (x, moeglich) => ({ status: x.status, fehlversuche: x.fehlversuche || 0, tipps: [], tippsGenutzt: 0, punkte: x.punkte || x.punkteErhalten || 0, moeglich });
    function zeige(t) {
      if (!r.gueltig()) return;
      const pfad = `/api/training/aufgabe/${enc(t.id)}`;
      AQ.mount(
        box,
        AQA.ansicht({
          aufgabe: t.aufgabe,
          zustand: zustandVon(t, info.heute < info.maxProTag ? 1 : 0),
          loesung: t.loesung,
          muster: t.muster,
          erklaerung: t.erklaerung,
          modus: 'training',
          zusatz: { laborFrisch: (wid) => laborFrisch(wid) }, // Werkzeug-Blöcke: Freigaben vor dem Öffnen frisch (Review M6)
          anzeige: KRDiag.anzeige,
          pruefen: async (body) => {
            const x = await api('POST', `${pfad}/pruefen`, body);
            info.heute = x.heute;
            if (x.geloest) info.geloestGesamt++;
            zeigeStand();
            return { ...x, zustand: zustandVon(x, info.heute < info.maxProTag ? 1 : 0) };
          },
          aufdecken: async () => {
            const x = await api('POST', `${pfad}/aufdecken`, {});
            return { ...x, zustand: zustandVon({ ...x, punkte: 0 }, 0) };
          },
          abzeichenToast,
          weiter: {
            href: `#/training/${info.welt.nr}`,
            text: 'Neue Aufgabe →',
            onclick: (e) => {
              e.preventDefault();
              neu();
            }
          },
          kopfZusatz: info.heute >= info.maxProTag ? h('span', { class: 'chip chip-neutral' }, 'Tageslimit erreicht – weiter üben ohne Punkte') : null
        })
      );
    }
    async function neu() {
      try {
        zeige(await api('POST', `/api/training/${info.welt.nr}/neu`, wahl ? { generator: wahl } : {}));
      } catch (e) {
        toast(e.message, true);
      }
    }
    const auswahl = h(
      'div',
      { class: 'chip-reihe training-wahl', role: 'group', 'aria-label': 'Aufgabentyp' },
      [{ key: '', titel: 'Zufall' }, ...gens].map((g) =>
        h(
          'button',
          {
            type: 'button',
            class: 'chip',
            'aria-pressed': wahl === g.key ? 'true' : 'false',
            onclick: (e) => {
              wahl = g.key;
              AQ.speichere('kr_training_' + info.welt.nr, wahl);
              auswahl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
              e.currentTarget.setAttribute('aria-pressed', 'true');
              neu();
            }
          },
          g.titel || g.key
        )
      )
    );
    zeigeStand();
    seite(
      `Trainingsplatz · ${info.welt.titel}`,
      h(
        'div',
        { class: 'wrap aufgabe-seite training-seite' },
        KRLevel.brotkrumen(info.welt, h('span', { 'aria-current': 'page' }, 'Trainingsplatz')),
        h('section', { class: 'karte' }, h('h1', null, 'Trainingsplatz'), h('p', null, 'Zufällig erzeugte Übungsaufgaben. 1 Punkt je gelöster Aufgabe, höchstens 30 Punkte am Tag.'), stand, auswahl),
        box
      )
    );
    if (info.offen) {
      try {
        zeige(await api('GET', `/api/training/aufgabe/${enc(info.offen)}`));
        return;
      } catch {
        /* neue Aufgabe */
      }
    }
    await neu();
  }

  async function bossRoute(nr, r) {
    const st = await api('GET', `/api/boss/${enc(nr)}`);
    if (!r.gueltig()) return;
    epoche(await weltVon(st.welt));
    const best = st.bester;
    const start = st.laufend
      ? h('a', { class: 'knopf knopf-messing boss-start', href: `#/kampf/${st.laufend.id}` }, 'Kampf fortsetzen')
      : h(
          'button',
          {
            type: 'button',
            class: 'knopf knopf-messing boss-start',
            disabled: !st.frei || !!st.gesperrtBis,
            onclick: async () => {
              const ok = await AQ.bestaetigen('Kampf beginnen?', `Du hast ${st.boss.dauerMin} Minuten für ${st.boss.anzahl} Aufgaben. Der Timer läuft sofort weiter, auch wenn du die Seite verlässt. Während des Kampfs gibt es kein Feedback und keine Werkzeuge.`, { ok: 'Kampf beginnen' });
              if (!ok) return;
              try {
                const k = await api('POST', `/api/boss/${st.welt.nr}/start`, {});
                location.hash = `#/kampf/${k.id}`;
              } catch (e) {
                toast(e.message, true);
              }
            }
          },
          'Kampf beginnen'
        );
    seite(
      st.boss.titel,
      h(
        'div',
        { class: 'wrap aufgabe-seite boss-seite' },
        KRLevel.brotkrumen(st.welt, h('span', { 'aria-current': 'page' }, 'Boss')),
        h(
          'section',
          { class: 'karte boss-karte' + (best && best.besiegt ? ' besiegt' : st.frei ? ' bereit' : ' gesperrt') },
          h('span', { class: 'etikett' }, 'Boss der Epoche'),
          h('h1', null, st.boss.titel),
          st.boss.rahmen ? h('div', { class: 'boss-rahmen' }, AQR.md(st.boss.rahmen, null, 'div')) : null,
          h(
            'ul',
            { class: 'boss-regeln' },
            h('li', null, `${st.boss.anzahl} Aufgaben, ${st.boss.dauerMin} Minuten`),
            h('li', null, 'Kein Feedback während des Kampfs – Auswertung am Ende'),
            h('li', null, 'Im Kampf gibt es keine Werkzeuge und kein Kryptolabor'),
            h('li', null, 'Besiegt ab 50 % der Punkte; es zählt dein bester Versuch'),
            h('li', null, 'Nach einem Kampf: 12 Stunden Pause bis zum nächsten Versuch')
          ),
          !st.frei ? h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, st.grund || 'Der Boss ist noch gesperrt.')) : null,
          st.gesperrtBis ? h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, `Nächster Versuch ab ${zeit(st.gesperrtBis)}.`)) : null,
          best ? h('div', { class: 'rueckmeldung ' + (best.besiegt ? 'ok' : 'info') }, h('p', null, `Bester Versuch: ${best.punkte} von ${best.maxPunkte} Punkten (${KR.prozent(best.anteil)})${best.besiegt ? ' – besiegt' : ''}`)) : null,
          h('p', { class: 'knopf-reihe' }, start)
        ),
        Array.isArray(st.versuche) && st.versuche.length
          ? h(
              'section',
              { class: 'karte' },
              h('h2', null, 'Deine Versuche'),
              h('div', { class: 'scroll-x' }, h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Beendet'), h('th', { scope: 'col' }, 'Punkte'), h('th', { scope: 'col' }, h('span', { class: 'sr' }, 'Auswertung')))), h('tbody', null, st.versuche.map((v) => h('tr', null, h('td', null, zeit(v.ende)), h('td', { class: 'zahl' }, `${v.punkte}/${v.maxPunkte}`), h('td', null, h('a', { href: `#/kampf/${v.id}` }, 'Auswertung ansehen')))))))
            )
          : null
      )
    );
  }

  async function kampfRoute(id, r) {
    const k = await api('GET', `/api/boss/kampf/${enc(id)}`);
    if (!r.gueltig()) return;
    epoche(await weltVon(k.welt));
    if (!k.laeuft) return kampfErgebnis(k);
    KRKopf.laborLink(false);
    beimVerlassen(() => KRKopf.laborLink(true));
    const versatz = Date.parse(k.serverZeit) - Date.now();
    const deadline = Date.parse(k.deadline);
    const antworten = new Map(k.aufgaben.map((a) => [a.id, a.antwort]));
    const ctrls = new Map();
    const speicherTimer = new Map();
    let beendet = false;
    const timerEl = h('div', { class: 'boss-timer', role: 'timer', 'aria-live': 'off' }, '--:--');
    const hinweis = h('p', { class: 'sr', 'aria-live': 'polite' });
    const status = h('p', { class: 'boss-speicher text-2', 'aria-live': 'polite' });

    async function speichere(aid) {
      const c = ctrls.get(aid);
      if (!c || beendet) return;
      clearTimeout(speicherTimer.get(aid));
      speicherTimer.delete(aid);
      const antwort = c.antwort();
      try {
        await api('PUT', `/api/boss/kampf/${enc(id)}/antwort`, { aufgabeId: aid, antwort });
        antworten.set(aid, antwort);
        status.textContent = 'Antwort gespeichert ✓';
      } catch (e) {
        if (e.status === 409) return beenden(true);
        status.textContent = 'Speichern fehlgeschlagen: ' + e.message;
      }
    }
    async function alleSpeichern() {
      await Promise.all([...speicherTimer.keys()].map((aid) => speichere(aid)));
    }
    async function beenden(automatisch) {
      if (beendet) return;
      if (!automatisch) {
        const offen = k.aufgaben.filter((a) => {
          const c = ctrls.get(a.id);
          return c ? c.leer() : true;
        }).length;
        const ok = await AQ.bestaetigen('Kampf beenden?', offen ? `${offen} Aufgabe(n) sind noch unbeantwortet. Danach wird ausgewertet.` : 'Danach wird ausgewertet – Antworten können nicht mehr geändert werden.', { ok: 'Beenden und auswerten' });
        if (!ok) return;
        await alleSpeichern();
      }
      beendet = true;
      clearInterval(uhr);
      try {
        const erg = await api('POST', `/api/boss/kampf/${enc(id)}/beenden`, {});
        if (automatisch) toast('Die Zeit ist abgelaufen – der Kampf wurde ausgewertet.', 'gold');
        if (r.gueltig()) kampfErgebnis(erg.aufgaben ? erg : await api('GET', `/api/boss/kampf/${enc(id)}`));
      } catch (e) {
        if (r.gueltig()) fehler(e);
      }
    }
    let gewarnt = false;
    function tick() {
      const rest = deadline - (Date.now() + versatz);
      const sek = Math.max(0, Math.ceil(rest / 1000));
      timerEl.textContent = `${String(Math.floor(sek / 60)).padStart(2, '0')}:${String(sek % 60).padStart(2, '0')}`;
      timerEl.setAttribute('aria-label', `noch ${Math.floor(sek / 60)} Minuten ${sek % 60} Sekunden`);
      timerEl.classList.toggle('knapp', sek <= 300);
      if (sek <= 300 && sek > 0 && !gewarnt) {
        gewarnt = true;
        hinweis.textContent = 'noch 5 Minuten';
      }
      if (rest <= 0 && !beendet) alleSpeichern().finally(() => beenden(true));
    }
    const uhr = setInterval(tick, 500);
    beimVerlassen(() => {
      clearInterval(uhr);
      for (const t of speicherTimer.values()) clearTimeout(t);
    });
    const liste = k.aufgaben.map((a, i) => {
      const c = AQI.aufgabe(a, {
        modus: 'boss',
        onChange: () => {
          status.textContent = 'ungespeichert …';
          clearTimeout(speicherTimer.get(a.id));
          speicherTimer.set(a.id, setTimeout(() => speichere(a.id), 800));
        }
      });
      if (a.antwort !== null && a.antwort !== undefined) c.setze(a.antwort);
      ctrls.set(a.id, c);
      return h('section', { class: 'karte boss-aufgabe', 'aria-labelledby': `ba-${i}` }, h('div', { class: 'aufgabe-kopf' }, h('h2', { id: `ba-${i}` }, `Aufgabe ${i + 1}: ${a.titel}`), AQ.sterne(a.stufe), h('span', { class: 'pill gold' }, `${a.punkte} Punkte`)), c.el);
    });
    tick();
    seite(
      k.titel,
      h(
        'div',
        { class: 'wrap aufgabe-seite kampf-seite' },
        h('header', { class: 'kampf-kopf tinte textur' }, h('div', null, h('span', { class: 'etikett' }, 'Boss-Kampf'), h('h1', null, k.titel), h('p', null, 'Kein Feedback, keine Werkzeuge. Antworten werden automatisch gespeichert.')), timerEl, hinweis),
        liste,
        h('div', { class: 'aktionen kampf-aktionen' }, status, h('button', { type: 'button', class: 'knopf knopf-gefahr', onclick: () => beenden(false) }, 'Kampf beenden'))
      )
    );
  }

  function kampfErgebnis(k) {
    KRKopf.laborLink(true);
    const liste = (k.aufgaben || []).map((a, i) => {
      const teile = [h('div', { class: 'aufgabe-kopf' }, h('h3', null, `${a.ok ? '✓' : '✗'} Aufgabe ${i + 1}: ${a.titel}`), h('span', { class: 'pill ' + (a.ok ? 'gold' : 'red') }, `${a.erreicht || 0}/${a.punkte || 0} Punkte`)), KRDiag.chips(a.diagnose)];
      if (a.interaktion) {
        const c = AQI.aufgabe(a, { modus: 'boss' });
        c.setze(a.antwort);
        c.sperren(true);
        teile.push(h('h4', null, 'Deine Antwort'), c.el);
        if (a.loesung !== undefined) {
          const c2 = AQI.aufgabe(a, { modus: 'boss' }); // mit Inhalt: Lücken stehen oft im Text
          c2.loesung(a.loesung, a.muster);
          c2.sperren(true);
          teile.push(h('h4', null, 'Lösung'), c2.el);
        }
      }
      if (Array.isArray(a.erklaerung) && a.erklaerung.length) teile.push(h('section', { class: 'erklaerung' }, h('h4', null, 'Erklärung'), AQR.bloecke(a.erklaerung, null)));
      return h('section', { class: 'karte boss-ergebnis-aufgabe ' + (a.ok ? 'ok' : 'falsch') }, teile);
    });
    const kopf = h(
      'section',
      { class: 'karte boss-ergebnis' + (k.besiegt ? ' besiegt' : '') },
      h('span', { class: 'etikett' }, 'Auswertung'),
      h('h1', null, k.besiegt ? `${k.titel} besiegt!` : `${k.titel} – diesmal nicht besiegt`),
      k.besiegt ? KR.symbol('siegel', 's-boss', { klasse: 'siegel voll', titel: 'Boss besiegt' }) : null,
      h('p', { class: 'zahl boss-punkte' }, `${k.punkte} von ${k.maxPunkte} Punkten (${KR.prozent(k.anteil)}) · ${(k.aufgaben || []).filter((a) => a.ok).length} von ${(k.aufgaben || []).length} Aufgaben richtig`),
      AQ.progress(k.anteil),
      h('p', { class: 'text-2' }, 'Es zählt dein bester Versuch. Ein neuer Versuch ist nach 12 Stunden möglich.')
    );
    seite(
      `Auswertung · ${k.titel}`,
      h('div', { class: 'wrap aufgabe-seite kampf-ergebnis' }, KRLevel.brotkrumen(k.welt, h('a', { href: `#/boss/${k.welt.nr}` }, k.titel), h('span', { 'aria-current': 'page' }, 'Auswertung')), kopf, h('h2', null, 'Auswertung je Aufgabe'), liste, h('p', null, h('a', { class: 'knopf knopf-zweit', href: `#/epoche/${k.welt.nr}` }, 'Zur Epoche')))
    );
    if (k.besiegt && !AQ.ruhig()) setTimeout(() => AQ.effekt.funken(document.querySelector('.boss-ergebnis h1'), { stark: true }), 250);
  }

  async function warmupRoute(_arg, r) {
    epoche(null);
    const meta = await api('GET', '/api/kata/meta');
    if (!r.gueltig()) return;
    const st = { welt: '', kategorie: '', karte: null, info: null, offen: false, zuletzt: null, statistik: null };
    const gemerkt = AQ.lade('kr_warmup_filter', {});
    if (gemerkt && typeof gemerkt.welt === 'string') st.welt = gemerkt.welt;
    if (gemerkt && typeof gemerkt.kategorie === 'string') st.kategorie = gemerkt.kategorie;
    const weltName = (nr) => {
      const w = (meta.weltNamen || []).find((x) => x.nr === nr);
      return w ? `Welt ${nr} – ${w.name}` : `Welt ${nr}`;
    };
    const katName = (k) => KR.KATEGORIEN[k] || k;
    const filterBox = h('section', { class: 'karte warmup-filter' });
    const karteBox = h('section', { class: 'warmup-karte-box', 'aria-live': 'polite' });
    const statBox = h('section', { class: 'karte warmup-statistik' });
    const params = () => ({ ...(st.welt !== '' ? { welt: st.welt } : {}), ...(st.kategorie ? { kategorie: st.kategorie } : {}) });
    function filter() {
      const welt = h('select', { id: 'wu-welt', onchange: (e) => ((st.welt = e.target.value), geaendert()) }, h('option', { value: '' }, 'Alle Welten'), (meta.welten || []).map((w) => h('option', { value: String(w.welt), selected: String(w.welt) === st.welt }, `${weltName(w.welt)} (${w.anzahl})`)));
      const kat = h('select', { id: 'wu-kat', onchange: (e) => ((st.kategorie = e.target.value), geaendert()) }, h('option', { value: '' }, 'Alle Kategorien'), (meta.kategorien || []).map((k) => h('option', { value: k.kategorie, selected: k.kategorie === st.kategorie }, `${katName(k.kategorie)} (${k.anzahl})`)));
      AQ.mount(filterBox, h('div', { class: 'warmup-filter-reihe' }, h('label', { for: 'wu-welt' }, 'Welt', welt), h('label', { for: 'wu-kat' }, 'Kategorie', kat), h('button', { type: 'button', class: 'knopf knopf-messing karte-ziehen', onclick: () => ziehen(false) }, 'Karte ziehen')));
    }
    function geaendert() {
      AQ.speichere('kr_warmup_filter', { welt: st.welt, kategorie: st.kategorie });
      st.karte = null;
      st.info = null;
      karte();
      statistik();
    }
    function karte() {
      const c = st.karte;
      if (!c) {
        const i = st.info;
        if (i && i.reason === 'nichts_faellig') AQ.mount(karteBox, h('div', { class: 'karte' }, h('h2', null, 'Alles erledigt!'), h('p', null, `Gerade ist keine Karte fällig. Nächste Fälligkeit: ${zeit(i.naechsteFaelligkeit)}.`), h('button', { type: 'button', class: 'knopf knopf-zweit', onclick: () => ziehen(true) }, 'Trotzdem weiter üben')));
        else if (i && i.reason === 'keine_karten') AQ.mount(karteBox, h('p', { class: 'leer-zustand' }, 'Für diesen Filter gibt es keine Karten.'));
        else AQ.mount(karteBox, h('p', { class: 'text-2' }, 'Wähle Welt und Kategorie und ziehe eine Karte.'));
        return;
      }
      const i = st.info || {};
      AQ.mount(
        karteBox,
        h(
          'article',
          { class: 'karte warmup-karte' },
          h('div', { class: 'chip-reihe' }, h('span', { class: 'chip chip-neutral' }, weltName(c.welt)), h('span', { class: 'chip chip-neutral' }, katName(c.kategorie)), h('span', { class: 'chip chip-neutral' }, i.neu ? 'neu' : `Fach ${i.fach}`), c.minuten ? h('span', { class: 'chip chip-neutral' }, `${c.minuten} min`) : null),
          h('h2', null, c.titel),
          h('div', { class: 'warmup-text' }, AQR.md(c.aufgabe, null, 'div')),
          c.code ? h('pre', { class: 'code-pre' }, c.code) : null,
          st.offen
            ? h(
                'div',
                { class: 'warmup-loesung' },
                h('h3', null, 'Lösung'),
                h('div', { class: 'warmup-text' }, AQR.md(c.loesung, null, 'div')),
                c.loesungCode ? h('pre', { class: 'code-pre' }, c.loesungCode) : null,
                h('p', { class: 'text-2' }, 'Wie lief es? Schätze dich ehrlich ein:'),
                h('div', { class: 'knopf-reihe' }, h('button', { type: 'button', class: 'knopf knopf-primaer', onclick: () => antwort('gewusst') }, '✓ gewusst'), h('button', { type: 'button', class: 'knopf knopf-zweit', onclick: () => antwort('teilweise') }, '≈ teilweise'), h('button', { type: 'button', class: 'knopf knopf-zweit', onclick: () => antwort('nicht') }, '✗ nicht gewusst'))
              )
            : h('div', { class: 'knopf-reihe' }, h('button', { type: 'button', class: 'knopf knopf-primaer', onclick: () => ((st.offen = true), karte()) }, 'Lösung aufdecken'), h('button', { type: 'button', class: 'knopf knopf-zweit', onclick: () => ziehen(false) }, 'Andere Karte'))
        )
      );
    }
    async function statistik() {
      try {
        const q = new URLSearchParams(params()).toString();
        const x = await api('GET', '/api/kata/statistik' + (q ? '?' + q : ''));
        const f = Array.isArray(x.faecher) ? x.faecher : [];
        AQ.mount(
          statBox,
          h('h2', null, 'Deine Kartei'),
          h('ul', { class: 'warmup-faecher' }, [['neu', x.neu], ...[1, 2, 3, 4, 5].map((n) => [`Fach ${n}`, f[n] || 0])].map(([l, n]) => h('li', null, h('b', { class: 'zahl' }, String(n)), h('span', null, l)))),
          h('p', { class: 'text-2' }, `${x.faellig} von ${x.gesamt} Karten jetzt fällig · ${x.wiederholungen} Wiederholungen · gewusst ${x.gewusst} · teilweise ${x.teilweise} · nicht gewusst ${x.nicht}`),
          h('p', { class: 'text-2' }, 'Fächer: 1 = jedes Mal · 2 = nach 1 Tag · 3 = nach 3 Tagen · 4 = nach 7 Tagen · 5 = nach 14 Tagen. „Nicht gewusst“ schickt die Karte zurück in Fach 1.')
        );
      } catch {
        /* Statistik ist Beiwerk */
      }
    }
    async function ziehen(trotzdem) {
      try {
        const x = await api('POST', '/api/kata/ziehen', { ...params(), excludeId: st.karte ? st.karte.id : st.zuletzt, force: !!trotzdem });
        st.info = x;
        st.karte = x.card;
        st.offen = false;
        karte();
      } catch (e) {
        toast(e.message, true);
      }
    }
    async function antwort(ergebnis) {
      const c = st.karte;
      try {
        const x = await api('POST', '/api/kata/antwort', { kataId: c.id, ergebnis });
        toast(x.fach > x.vorher ? `Stark! Die Karte wandert in Fach ${x.fach}.` : x.fach === 1 && x.vorher !== 1 ? 'Zurück in Fach 1 – die kommt bald wieder.' : `Die Karte bleibt in Fach ${x.fach}.`);
        abzeichenToast(x.neueAbzeichen);
        st.zuletzt = c.id;
        statistik();
        await ziehen(false);
      } catch (e) {
        toast(e.message, true);
      }
    }
    filter();
    karte();
    seite('Warm-up', h('div', { class: 'wrap aufgabe-seite warmup-seite' }, h('h1', null, 'Warm-up'), h('p', { class: 'text-2' }, 'Erst auf Papier lösen, dann die Lösung aufdecken und ehrlich einschätzen. Sichere Karten wandern ins nächste Fach und kommen seltener dran. Keine Punkte.'), filterBox, karteBox, statBox));
    await statistik();
  }

  /* ---------- Routen (Task 60): Profil, Scoreboard ---------- */

  async function profilRoute(_arg, r) {
    epoche(null);
    const p = await api('GET', '/api/profil');
    if (!r.gueltig()) return;
    if (p.rang) KRKopf.rang(p.rang);
    seite('Profil', KRProfil.ansicht(p));
  }

  async function scoreboardRoute(weltRoh, r) {
    epoche(null);
    const d = await welten();
    if (!r.gueltig()) return;
    if (!d.scoreboard) {
      seite('Scoreboard', h('div', { class: 'wrap aufgabe-seite' }, h('h1', null, 'Scoreboard'), h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, 'Das Scoreboard ist in deinem Kurs ausgeschaltet.'))));
      return;
    }
    const welt = weltRoh !== undefined && weltRoh !== '' && /^\d+$/.test(weltRoh) ? Number(weltRoh) : null;
    const url = '/api/scoreboard' + (welt === null ? '' : `?welt=${welt}`);
    const sb = await api('GET', url);
    if (!r.gueltig()) return;
    const box = h('div', { class: 'scoreboard-box', 'aria-live': 'polite' }, KRProfil.scoreboardTabelle(sb));
    const stand = h('p', { class: 'text-2' });
    const zeitStempel = () => (stand.textContent = `Aktualisiert sich alle 20 s (zuletzt ${new Date().toLocaleTimeString('de-DE')}).`);
    zeitStempel();
    const knopf = (text, aktiv, hash) => h('button', { type: 'button', class: 'chip', 'aria-pressed': aktiv ? 'true' : 'false', onclick: () => (location.hash = hash) }, text);
    seite(
      'Scoreboard',
      h(
        'div',
        { class: 'wrap aufgabe-seite scoreboard-seite' },
        h('h1', null, 'Scoreboard'),
        h('div', { class: 'chip-reihe training-wahl', role: 'group', 'aria-label': 'Wertung' }, knopf('Gesamt', sb.welt === null || sb.welt === undefined, '#/scoreboard'), (sb.welten || []).map((w) => knopf(w.titel || `Welt ${w.nr}`, sb.welt === w.nr, `#/scoreboard/${w.nr}`))),
        h('section', { class: 'karte' }, box, stand)
      )
    );
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const neu = await api('GET', url);
        if (r.gueltig()) {
          AQ.mount(box, KRProfil.scoreboardTabelle(neu));
          zeitStempel();
        }
      } catch {
        /* nächster Versuch in 20 s */
      }
    }, 20000);
    beimVerlassen(() => clearInterval(t));
  }

  ROUTEN.set('profil', profilRoute);
  ROUTEN.set('scoreboard', scoreboardRoute);
  ROUTEN.set('training', trainingRoute);
  ROUTEN.set('boss', bossRoute);
  ROUTEN.set('kampf', kampfRoute);
  ROUTEN.set('warmup', warmupRoute);
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
    KRPanel.schliesseAlle(); // M11 (E215): Werkzeug-Panels schließen beim Seitenwechsel
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
    // Rückkehr in den Tab: Kampf in einem anderen Tab begonnen → offene Werkzeug-Dialoge schließen (Review M6)
    KRLabor.wache(async () => {
      if ((await labor({ neu: true })).boss) KRLabor.sperreAlle('boss');
    });
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
