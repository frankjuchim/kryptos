/* Kryptos – Seite /labor (TECHNIK §10.1, M4 Task 53): Kopfzeile für beide Rollen, Werkzeug-Raster nach Epoche mit
   Freigaben (Schüler: GET /api/labor, Lehrkraft: GET /api/lehrer/werkzeuge – alles frei), gesperrte Werkzeuge mit Grund,
   Boss-Banner; #/<id> öffnet das Werkzeug als Vollseite über KRLabor (Modul wird nachgeladen) mit der Umgebung für die
   Reiter-Regeln (Schüler: niveau/welten aus /api/labor; Lehrkraft: alle Reiter + Hinweis, M6 E71/E87);
   #/<id>?reiter=a,b (Level-Karten) wird zur Voreinstellung { reiter } – nur Reiter des Werkzeugs (M6 Task 125);
   &level=W5-L3 setzt den Level-Kontext der Reiter-Regeln (nichtImLevel, Review M6).
   Review M6: /api/labor vor jedem Raster/Werkzeug frisch; bei Rückkehr in den Tab neu gefragt (KRLabor.wache) und ein
   offenes Werkzeug bei laufendem Kampf geschlossen (KRLabor.sperreAlle).
   M10 (E178, E193): Chips „Zusatz“/„Kür“ im Raster (Feld art) und unter dem Raster die Karte „Vier Arten, eine Nachricht
   zu schützen“ – Herkunft: Krypto-Werkstatt (Ideen von A. Bodendiek), index.html @59004d9 – docs/FREMDCODE.md;
   eigenes Beispielwort, alle Rechnungen über Krypto.*. */
'use strict';

const KRLaborSeite = (() => {
  const { h } = AQ;
  const GRUND = KRLabor.GRUND; // Texte der Sperrgründe (registry.js)
  // Karte „Vier Arten“ (E193): eigenes Wort, in keinem Material; der Brief versteckt es (je Wort der erste Buchstabe)
  const BEISPIEL = { wort: 'tulpe', k: 3, umfang: 2, brief: 'Tagsüber unterhalten lustige Papageien Elefanten' };
  const ART_CHIP = { zusatz: 'Zusatz', kuer: 'Kür' };
  let daten = null; // { rolle, boss, niveau, welten, werkzeuge: [{ id, titel, welt, frei, grund }] }
  let offen = null;

  function zurueck(sitzung) {
    return sitzung.rolle === 'schueler' ? { href: '/spiel#/', text: 'Zur Zeitleiste' } : { href: '/lehrer#/', text: 'Zur Kursübersicht' };
  }

  async function lade(sitzung) {
    if (sitzung.rolle === 'schueler') {
      const r = await AQ.api('GET', '/api/labor');
      return { rolle: 'schueler', boss: !!r.boss, niveau: r.niveau === 'gA' ? 'gA' : 'eA', welten: Array.isArray(r.welten) ? r.welten : [], werkzeuge: Array.isArray(r.werkzeuge) ? r.werkzeuge : [] };
    }
    const liste = await AQ.api('GET', '/api/lehrer/werkzeuge');
    return { rolle: sitzung.rolle, boss: false, werkzeuge: (Array.isArray(liste) ? liste : []).map((w) => ({ ...w, frei: true, grund: null })) };
  }

  /** Chip „Zusatz“ (nicht im KC) bzw. „Kür“ (Vertiefung) – E178 */
  function artChip(w) {
    return ART_CHIP[w.art] ? h('span', { class: `chip werkzeug-art art-${w.art}` }, ART_CHIP[w.art]) : null;
  }

  function karte(w) {
    if (w.frei) {
      return h('a', { class: 'werkzeug-karte', href: `#/${w.id}`, 'data-epoche': String(w.welt) }, h('span', { class: 'werkzeug-kopf' }, KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }), h('b', { class: 'werkzeug-name' }, w.titel), artChip(w)), h('span', { class: 'werkzeug-ort' }, 'Öffnen'));
    }
    return h(
      'div',
      { class: 'werkzeug-karte gesperrt', 'data-epoche': String(w.welt) },
      h('span', { class: 'werkzeug-kopf' }, KR.symbol('icons', 'i-labor', { klasse: 'werkzeug-symbol' }), h('b', { class: 'werkzeug-name' }, w.titel), artChip(w)),
      h('p', { class: 'werkzeug-grund' }, GRUND[w.grund] || GRUND.lehrkraft)
    );
  }

  /** Karte „Vier Arten, eine Nachricht zu schützen“ (Werkstatt-Startseite, E193) – null ohne Bibliothek */
  function vierArten() {
    if (typeof Krypto === 'undefined') return null;
    const B = BEISPIEL;
    const klar = Krypto.klein(Krypto.nurBuchstaben(B.wort));
    const arten = [
      { art: 'Substitution', titel: 'Buchstaben ersetzen', vorher: klar, nachher: Krypto.caesar(B.wort, B.k), text: 'Jeder Buchstabe wird durch einen anderen ersetzt, die Reihenfolge bleibt. Beispiele: Caesar, Freimaurer, Polybios, Playfair, Enigma.' },
      { art: 'Transposition', titel: 'Reihenfolge vertauschen', vorher: klar, nachher: Krypto.skytale(B.wort, B.umfang, 'ver', { fuellzeichen: null }), text: 'Die Buchstaben bleiben dieselben, nur ihre Plätze ändern sich. Beispiele: Skytale, Pflügen, Fleißner-Schablone.' },
      { art: 'Codierung', titel: 'Anders darstellen', vorher: klar, nachher: Krypto.morse(B.wort), text: 'Zeichen werden nach einer öffentlichen Tabelle übersetzt, zum Beispiel in Morsezeichen. Es gibt keinen Schlüssel: Wer die Tabelle kennt, liest mit.' },
      { art: 'Steganographie', titel: 'Existenz verbergen', vorher: B.brief, nachher: Krypto.klein(Krypto.nullchiffre(B.brief)), text: 'Die Nachricht wird versteckt, sodass niemand merkt, dass es sie gibt. Wird sie entdeckt, ist sie ohne Verschlüsselung sofort lesbar.' }
    ];
    const karte = h(
      'section',
      { class: 'labor-vier-arten', 'aria-labelledby': 'labor-vier-titel' },
      h('h2', { id: 'labor-vier-titel' }, 'Vier Arten, eine Nachricht zu schützen'),
      h('p', { class: 'text-2' }, 'Dieselbe Nachricht, viermal anders behandelt.'),
      h(
        'div',
        { class: 'labor-vier-raster' },
        arten.map((a) =>
          h(
            'div',
            { class: 'labor-vier-art' },
            h('p', { class: 'labor-vier-name' }, a.art),
            h('h3', null, a.titel),
            h('p', { class: 'labor-vier-demo' }, h('span', { class: 'labor-vier-vorher' }, a.vorher), h('span', { class: 'labor-vier-pfeil', 'aria-hidden': 'true' }, ' → '), h('span', { class: 'sr' }, ' wird zu '), h('span', { class: 'labor-vier-nachher' }, a.nachher)),
            h('p', { class: 'labor-vier-text' }, a.text)
          )
        )
      )
    );
    if (typeof KRStation !== 'undefined') KRStation.herkunft(karte);
    return karte;
  }

  function raster(haupt, sitzung) {
    KR.epoche(6);
    const welten = [...new Set(daten.werkzeuge.map((w) => w.welt))].sort((a, b) => a - b);
    const weg = zurueck(sitzung);
    AQ.mount(
      haupt,
      h(
        'div',
        { class: 'wrap labor' },
        h('h1', null, 'Kryptolabor'),
        h('p', { class: 'text-2' }, 'Werkzeuge zum Ausprobieren – geordnet nach Epochen. Nichts davon wird bewertet.'),
        daten.boss ? h('div', { class: 'rueckmeldung info labor-banner', role: 'status' }, h('p', null, GRUND.boss)) : null,
        welten.map((nr) =>
          h(
            'section',
            { class: 'labor-epoche', 'data-epoche': String(nr), 'aria-labelledby': `labor-epoche-${nr}` },
            h('h2', { id: `labor-epoche-${nr}` }, KR.WELTEN_KURZ[nr] || `Epoche ${nr}`),
            h('div', { class: 'labor-raster' }, daten.werkzeuge.filter((w) => w.welt === nr).map(karte))
          )
        ),
        vierArten(),
        h('p', null, h('a', { class: 'knopf knopf-zweit', href: weg.href }, weg.text))
      )
    );
  }

  /** Voreinstellung aus dem Hash-Parameter „?reiter=a,b“ (Level-Karten, E70): nur Reiter des Werkzeugs, sonst {}. */
  function voreinstellungAus(id, abfrage) {
    const w = KRLabor.werkzeug(id);
    const m = /(?:^|&)reiter=([^&]*)/.exec(abfrage || '');
    if (!w || !m) return {};
    let roh = '';
    try {
      roh = decodeURIComponent(m[1]);
    } catch {
      return {};
    }
    const reiter = [...new Set(roh.split(','))].filter((r) => w.reiter.includes(r));
    return reiter.length ? { reiter } : {};
  }

  /** Level-Kontext aus „?level=W5-L3“ (Level-Karten, Review M6): nur gültige Level-ids (Format wie im Validator), sonst null. */
  function levelAus(abfrage) {
    const m = /(?:^|&)level=([^&]*)/.exec(abfrage || '');
    if (!m) return null;
    let roh = '';
    try {
      roh = decodeURIComponent(m[1]);
    } catch {
      return null;
    }
    return /^W\d-L\d{1,2}[a-z]?$/.test(roh) ? roh : null;
  }

  function vollseite(haupt, id, voreinstellung = {}, level = null) {
    const w = daten.werkzeuge.find((x) => x.id === id);
    if (!w) {
      KR.fehler(haupt, new Error('Dieses Werkzeug gibt es nicht.'), { zurueck: { href: '#/', text: 'Zum Labor' } });
      return;
    }
    KR.epoche(w.welt);
    if (!w.frei) {
      AQ.mount(
        haupt,
        h('div', { class: 'wrap labor' }, h('h1', null, w.titel), h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, GRUND[w.grund] || GRUND.lehrkraft)), h('p', null, h('a', { class: 'knopf knopf-zweit', href: '#/' }, 'Zum Labor')))
      );
      return;
    }
    const flaeche = h('div', { class: 'werkzeug-flaeche' });
    // Umgebung für die Reiter-Regeln (E71); Lehrkräfte sehen alle Reiter und einen Hinweis darauf (E87)
    const lehrkraft = daten.rolle !== 'schueler';
    const umgebung = lehrkraft ? { modus: 'labor', rolle: 'lehrkraft' } : { modus: 'labor', rolle: 'schueler', niveau: daten.niveau, welten: daten.welten, ...(level ? { level } : {}) };
    AQ.mount(
      haupt,
      h(
        'section',
        { class: 'labor-vollseite', 'data-epoche': String(w.welt), 'aria-labelledby': 'werkzeug-titel' },
        h('div', { class: 'werkzeug-kopfband' }, KR.symbol('icons', 'i-labor'), h('h1', { id: 'werkzeug-titel' }, w.titel), h('span', { class: 'werkzeug-epoche' }, KR.WELTEN_KURZ[w.welt] || '')),
        lehrkraft ? h('p', { class: 'labor-lehrkraft-hinweis text-2', role: 'note' }, 'Für Schülerinnen und Schüler gelten Reiter-Regeln (Welt, Niveau).') : null,
        flaeche,
        h('div', { class: 'labor-steuerleiste' }, h('a', { class: 'knopf knopf-zweit', href: '#/' }, KR.symbol('icons', 'i-pfeil-l'), 'Zum Labor'))
      )
    );
    offen = KRLabor.oeffne(id, voreinstellung, flaeche, umgebung);
  }

  let routeNr = 0;
  /** Route: Freigaben vor jedem Raster/Werkzeug frisch aus /api/labor (Review M6: alter Tab, Kampf in einem anderen Tab). */
  async function route(haupt, sitzung) {
    if (offen) {
      offen.schliesse();
      offen = null;
    }
    const meine = ++routeNr;
    const [pfad, abfrage] = (location.hash || '').replace(/^#\/?/, '').split('?');
    let id = '';
    try {
      id = decodeURIComponent(pfad.split('/')[0] || '');
    } catch {
      id = '?';
    }
    const neu = await lade(sitzung);
    if (meine !== routeNr) return;
    daten = neu;
    if (id) vollseite(haupt, id, voreinstellungAus(id, abfrage), levelAus(abfrage));
    else raster(haupt, sitzung);
    if (typeof haupt.focus === 'function') haupt.focus();
  }

  /** Rückkehr in den Tab: Freigaben neu; hat inzwischen ein Kampf begonnen, offenes Werkzeug schließen (mit Hinweis)
      bzw. das Raster mit Banner neu zeigen. */
  async function pruefe(haupt, sitzung) {
    if (sitzung.rolle !== 'schueler' || !daten) return;
    const neu = await lade(sitzung);
    const warBoss = daten.boss;
    daten = neu;
    if (!neu.boss || warBoss) return;
    if (offen) KRLabor.sperreAlle('boss');
    else if (!(location.hash || '').replace(/^#\/?/, '')) raster(haupt, sitzung);
  }

  async function start() {
    const haupt = document.getElementById('haupt');
    KR.laden(haupt);
    try {
      const sitzung = await AQ.api('GET', '/api/sitzung');
      KRKopf.baue({ rolle: sitzung.rolle, aktiv: 'labor', sitzung });
      await route(haupt, sitzung);
      window.addEventListener('hashchange', () => route(haupt, sitzung).catch((e) => KR.fehler(haupt, e, { zurueck: { href: '#/', text: 'Zum Labor' } })));
      KRLabor.wache(() => pruefe(haupt, sitzung));
    } catch (e) {
      KR.fehler(haupt, e, { zurueck: { href: '/', text: 'Zur Startseite' } });
    }
  }
  document.addEventListener('DOMContentLoaded', start);
  return { start, BEISPIEL };
})();
