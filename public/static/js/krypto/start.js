/* Kryptos – Startseite / (M4 Task 61, Design §2.2, Prototyp Abschnitt 1): angemeldete Besucher gehen direkt in ihren
   Bereich (Schüler → /spiel, Lehrkraft/Admin → /lehrer); sonst Tinte-Startseite mit Logo-Ring, Rahmenhandlung,
   Figuren, „Anmelden über InfoLabs“, Gastmodus, Themen und den Zahlen aus dem Manifest. Keine eigene Anmeldung.
   Texte nur als Textknoten (AQ.h). */
'use strict';

const KRStart = (() => {
  const { h } = AQ;

  /** Figuren der Rahmenhandlung (Design §2.2); Eve und Mallory sind die Angreifer (Fehler-Rand). */
  const FIGUREN = Object.freeze([
    ['Alice', 'schreibt geheime Botschaften', false],
    ['Bob', 'soll sie lesen – und nur er', false],
    ['Eve', 'lauscht mit', true],
    ['Mallory', 'fälscht und schaltet sich dazwischen', true],
    ['Trent', 'vertrauenswürdige dritte Stelle', false]
  ]);

  /** Fakten aus GET /api/plattform (umfang); ohne Antwort null (dann ausgeblendet). */
  function fakten(m) {
    const u = m && m.umfang;
    if (!u) return null;
    const zeilen = [
      [u.welten, u.welten === 1 ? 'Epoche' : 'Epochen'],
      [u.level, 'Level'],
      [u.aufgaben, 'Aufgaben'],
      [u.bosse, u.bosse === 1 ? 'Boss' : 'Bosse']
    ].filter(([n]) => Number.isFinite(Number(n)) && Number(n) > 0);
    if (!zeilen.length) return null;
    return h(
      'ul',
      { class: 'start-fakten', 'aria-label': 'Kryptos in Zahlen' },
      zeilen.map(([n, text]) => h('li', null, h('b', { class: 'zahl' }, String(n)), ' ', h('span', null, text)))
    );
  }

  function ansicht({ abgebrochen, manifest }) {
    const untertitel = h('p', { class: 'start-untertitel' }, 'Die Zeitreise der Geheimschriften');
    KR.entsiegeln(untertitel, 'Die Zeitreise der Geheimschriften');
    return h(
      'section',
      { class: 'start tinte textur', 'aria-labelledby': 'start-titel' },
      h(
        'div',
        { class: 'wrap start-innen' },
        h('span', { class: 'start-ring', 'aria-hidden': 'true' }, KR.symbol('icons', 'logo-ring', { klasse: 'start-ring-svg' })),
        h(
          'div',
          { class: 'start-text' },
          h('h1', { id: 'start-titel' }, 'KRYPTOS'),
          untertitel,
          abgebrochen
            ? h('div', { class: 'rueckmeldung info', role: 'status' }, h('p', null, 'Die Anmeldung wurde abgebrochen. Du kannst es erneut versuchen oder den Gastmodus ausprobieren.'))
            : null,
          h(
            'p',
            { class: 'start-story' },
            'Im Archiv der verborgenen Schriften steht das Chronoskop – eine Maschine, mit der du in jede Epoche reisen kannst, in der Menschen Geheimnisse ausgetauscht haben. Seit Jahrtausenden schreiben sich Alice und Bob geheime Botschaften, und seit Jahrtausenden lauscht Eve. Als Chronistin oder Chronist wechselst du die Seiten: Du sicherst Botschaften als Kryptografin oder Kryptograf und knackst abgefangene Nachrichten als Kryptoanalytikerin oder Kryptoanalytiker.'
          ),
          h(
            'ul',
            { class: 'figuren', 'aria-label': 'Figuren' },
            FIGUREN.map(([name, rolle, angreifer]) => h('li', { class: 'figur' + (angreifer ? ' angreifer' : '') }, h('b', null, name), h('span', null, rolle)))
          ),
          h(
            'p',
            { class: 'knopf-reihe start-knoepfe' },
            h('a', { class: 'knopf knopf-primaer knopf-messing', href: '/sso/start?ziel=' + encodeURIComponent('/spiel') }, KR.symbol('icons', 'i-portal'), 'Anmelden über InfoLabs'),
            h('a', { class: 'knopf knopf-zweit', href: '/gast' }, 'Gastmodus'),
            h('a', { class: 'knopf knopf-zweit', href: '/themen' }, 'Themen und Niveaus')
          ),
          fakten(manifest)
        )
      )
    );
  }

  async function start() {
    const haupt = document.getElementById('haupt');
    let sitzung = null;
    try {
      sitzung = await AQ.api('GET', '/api/sitzung');
    } catch {
      sitzung = null; // ohne Server-Antwort: Startseite trotzdem zeigen
    }
    if (sitzung && sitzung.rolle === 'schueler') return location.replace('/spiel');
    if (sitzung && (sitzung.rolle === 'lehrkraft' || sitzung.rolle === 'superadmin')) return location.replace('/lehrer');
    KR.epoche(6);
    KRKopf.baue({ rolle: null, sitzung: sitzung || {} });
    const manifest = await AQ.api('GET', '/api/plattform').catch(() => null);
    const abgebrochen = new URLSearchParams(location.search).get('abgebrochen') === '1';
    document.title = 'Kryptos – Die Zeitreise der Geheimschriften';
    AQ.mount(haupt, ansicht({ abgebrochen, manifest }));
  }
  document.addEventListener('DOMContentLoaded', start);

  return { ansicht, FIGUREN };
})();
