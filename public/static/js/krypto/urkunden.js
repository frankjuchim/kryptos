/* Kryptos – Urkunden /lehrer/urkunden?kurs=<id> (M4 Task 64, DESIGNSYSTEM §10, E34): je Schülerin und Schüler eine
   Urkunde A4 quer (Tinte-Rahmen mit Messing-Doppellinie, Titel, Name, Rang, Punkte/Platz optional, sieben
   Artefakt-Siegel – erreicht = Abzeichen boss<n>_besiegt, sonst Umriss –, Datum). Auswahl alle/einzeln, Datum,
   Text-Optionen, Drucken (window.print, Layout in druck.css). Daten: GET /api/lehrer/kurse/<id>/urkunden. Textknoten. */
'use strict';

const KRUrkunden = (() => {
  const { h, mount, api } = AQ;
  /** Artefakte der Epochen 0–6 (= KRProfil.ARTEFAKT/ARTEFAKT_NAME in profil.js; Sprite abzeichen.svg). */
  const ARTEFAKT = Object.freeze(['a-skytale', 'a-manuskript', 'a-tafel', 'a-lochstreifen', 'a-schluessel', 'a-siegel', 'a-kern']);
  const ARTEFAKT_NAME = Object.freeze(['Skytale', 'Al-Kindis Manuskript', 'Vigenère-Tafel', 'Lochstreifen', 'Schlüsselpaar', 'Siegel', 'Chronoskop-Kern']);
  const STANDARD_TEXT = 'hat als Chronistin oder Chronist des Archivs die Zeitreise der Geheimschriften angetreten.';

  /** „2026-10-13“ (input type=date) → „13. Oktober 2026“; ungültig → Text unverändert. */
  function datumText(wert) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(wert || ''));
    if (!m) return String(wert || '');
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function heute() {
    const d = new Date();
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  /** Erreichte Epochen (0–6) aus den Abzeichen-Schlüsseln boss<n>_besiegt. */
  function besiegt(abzeichen) {
    const s = new Set();
    for (const a of abzeichen || []) {
      const m = /^boss(\d+)_besiegt$/.exec(String((a && a.key) || ''));
      if (m) s.add(Number(m[1]));
    }
    return s;
  }

  function siegelReihe(abzeichen) {
    const erreicht = besiegt(abzeichen);
    return h(
      'ul',
      { class: 'urkunde-siegel', 'aria-label': `Artefakte: ${erreicht.size} von 7 Epochen gemeistert` },
      ARTEFAKT.map((id, nr) =>
        h(
          'li',
          { class: 'siegel' + (erreicht.has(nr) ? ' erreicht' : ' umriss') },
          KR.symbol('abzeichen', id, { klasse: 'siegel-bild' }),
          h('span', { class: 'siegel-text' }, erreicht.has(nr) ? ARTEFAKT_NAME[nr] : `Epoche ${nr}`)
        )
      )
    );
  }

  /** Eine Urkunde. o: { kurs, datum, text, punkte, platz } */
  function urkunde(s, o) {
    return h(
      'article',
      { class: 'urkunde', 'data-id': String(s.id), 'aria-label': `Urkunde für ${s.name}` },
      h(
        'div',
        { class: 'urkunde-rahmen' },
        h('p', { class: 'urkunde-kopf' }, 'Archiv der verborgenen Schriften'),
        h('h2', { class: 'urkunde-titel' }, 'Urkunde'),
        h('p', { class: 'urkunde-name' }, s.name),
        h('p', { class: 'urkunde-text' }, o.text || STANDARD_TEXT),
        h('p', { class: 'urkunde-rang' }, 'Rang: ', h('b', null, s.rang || '–')),
        o.punkte || o.platz
          ? h('p', { class: 'urkunde-zahlen' }, [o.punkte ? `${s.punkte} ${s.punkte === 1 ? 'Punkt' : 'Punkte'} · ${s.geloest} ${s.geloest === 1 ? 'gelöste Aufgabe' : 'gelöste Aufgaben'}` : null, o.platz && s.platz ? `Platz ${s.platz} im Kurs` : null].filter(Boolean).join(' · '))
          : null,
        siegelReihe(s.abzeichen),
        h(
          'div',
          { class: 'urkunde-fuss' },
          h('p', { class: 'urkunde-datum' }, h('span', null, o.kurs ? `${o.kurs} · ` : ''), datumText(o.datum)),
          h('p', { class: 'urkunde-unterschrift' }, h('span', { class: 'linie', 'aria-hidden': 'true' }), 'Lehrkraft'),
          h('p', { class: 'urkunde-marke' }, 'Kryptos – Die Zeitreise der Geheimschriften')
        )
      )
    );
  }

  function ansicht(d, kursId) {
    const schueler = d.schueler || [];
    const auswahl = h('select', { name: 'auswahl', id: 'urk-auswahl' }, h('option', { value: 'alle' }, `alle (${schueler.length})`), schueler.map((s) => h('option', { value: String(s.id) }, s.name)));
    const datum = h('input', { type: 'date', name: 'datum', id: 'urk-datum' });
    datum.value = heute();
    const text = h('input', { type: 'text', name: 'text', id: 'urk-text', maxlength: '160', placeholder: STANDARD_TEXT });
    const punkte = h('input', { type: 'checkbox', name: 'punkte', checked: true });
    const platz = h('input', { type: 'checkbox', name: 'platz' });
    const liste = h('div', { class: 'urkunden-liste' });

    function zeichne() {
      const o = { kurs: d.kurs && d.kurs.name, datum: datum.value, text: text.value.trim(), punkte: punkte.checked, platz: platz.checked };
      const wahl = auswahl.value;
      mount(
        liste,
        schueler.length
          ? schueler.map((s) => {
              const el = urkunde(s, o);
              if (wahl !== 'alle' && String(s.id) !== wahl) el.hidden = true;
              return el;
            })
          : h('p', { class: 'text-2' }, 'Noch keine Schülerinnen und Schüler in diesem Kurs.')
      );
    }
    for (const x of [auswahl, datum, text, punkte, platz]) {
      x.addEventListener('change', zeichne);
      if (x === text) x.addEventListener('input', zeichne);
    }
    zeichne();

    const drucken = h('button', { type: 'button', class: 'knopf knopf-primaer drucken' }, KR.symbol('icons', 'i-drucken'), 'Drucken');
    drucken.addEventListener('click', () => window.print());
    return h(
      'div',
      { class: 'wrap urkunden-seite' },
      h(
        'div',
        { class: 'urkunden-steuerung' },
        h('nav', { class: 'brotkrumen', 'aria-label': 'Brotkrümel' }, h('a', { href: '/lehrer#/' }, 'Kurse'), h('span', { 'aria-hidden': 'true' }, '›'), h('a', { href: `/lehrer#/kurs/${encodeURIComponent(kursId)}/schueler` }, (d.kurs && d.kurs.name) || 'Kurs'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', { 'aria-current': 'page' }, 'Urkunden')),
        h('h1', null, 'Urkunden'),
        h('p', { class: 'text-2 lesen' }, 'Je Schülerin und Schüler eine Seite A4 quer. Im Druckdialog „Hintergrundgrafiken“ einschalten, damit Rahmen und Siegel farbig erscheinen.'),
        h(
          'div',
          { class: 'urkunden-optionen karte' },
          h('label', { for: 'urk-auswahl' }, 'Urkunden für', auswahl),
          h('label', { for: 'urk-datum' }, 'Datum', datum),
          h('label', { for: 'urk-text', class: 'breit' }, 'Text (optional)', text),
          h('label', { class: 'wahl' }, punkte, 'Punkte und gelöste Aufgaben zeigen'),
          h('label', { class: 'wahl' }, platz, 'Platz im Kurs zeigen'),
          h('p', { class: 'knopf-reihe' }, drucken)
        )
      ),
      liste
    );
  }

  async function start() {
    const haupt = document.getElementById('haupt');
    KR.laden(haupt);
    let sitzung = null;
    try {
      sitzung = await api('GET', '/api/sitzung');
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
      return;
    }
    if (!sitzung || !['lehrkraft', 'superadmin'].includes(sitzung.rolle)) {
      location.replace('/');
      return;
    }
    KR.epoche(6);
    if (typeof KRKopf !== 'undefined') {
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'kurse', sitzung });
      KRKopf.epoche('Urkunden');
    }
    const kursId = new URLSearchParams(location.search).get('kurs') || '';
    if (!/^\d{1,9}$/.test(kursId)) {
      KR.fehler(haupt, new Error('Kurs nicht gefunden.'), { zurueck: { href: '/lehrer#/', text: 'Zur Kursliste' } });
      return;
    }
    try {
      const d = await api('GET', `/api/lehrer/kurse/${encodeURIComponent(kursId)}/urkunden`);
      document.title = `Urkunden ${d.kurs ? d.kurs.name : ''} · Kryptos`.replace('  ', ' ');
      mount(haupt, ansicht(d, kursId));
    } catch (e) {
      if (e && e.status === 401) return;
      KR.fehler(haupt, e, { zurueck: { href: '/lehrer#/', text: 'Zur Kursliste' } });
    }
  }
  document.addEventListener('DOMContentLoaded', start);

  return { urkunde, datumText, besiegt, ARTEFAKT };
})();
