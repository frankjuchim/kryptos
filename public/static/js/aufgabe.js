/* Lab-Kern – Aufgaben-Ansicht (Prüfen, Tipp, Lösung zeigen, Erklärung) für Schüler-Oberfläche und Gastmodus. */
'use strict';
const AQA = (() => {
  const { h, mount, toast, sterne, bestaetigen } = AQ;


  /**
   * Aufgaben-Ansicht.
   * @param {object} cfg { aufgabe, zustand, loesung?, muster?, erklaerung?, pruefen(body), tipp?(), aufdecken(), weiter?, kopfZusatz,
   *   nachLoesen?, abzeichenToast?, punkteText?(r), modus? ('lab'|'boss'|'vorschau'|'gast'|'training', an AQI.aufgabe),
   *   zusatz? (ctx-Zusatz, z. B. werkzeugFrei), kursNiveau? ('eA'|'gA'), anzeige? { kategorie(slug) → Text,
   *   falle(p) → Element, diagnose(liste) → Element|null }, ohnePunkte? (Text statt Punkte im Kopf, z. B. Archivfund;
   *   Rückmeldungen dann ohne Punktzahlen) } – K36: ohne anzeige wie im Kern
   */
  function aufgabenAnsicht(cfg) {
    const a = cfg.aufgabe;
    const modus = cfg.modus || 'lab';
    const anzeige = cfg.anzeige || {};
    const ohnePunkte = !!cfg.ohnePunkte;
    /** „ Noch bis zu x Punkte möglich.“ – nicht bei Aufgaben ohne Punkte. */
    const restText = () => (!ohnePunkte && zustand && zustand.status === 'offen' ? ` Noch bis zu ${zustand.moeglich} Punkte möglich.` : '');
    let zustand = cfg.zustand;
    const feedbackBox = h('div', { 'aria-live': 'polite' });
    const tippBox = h('div');
    const erklaerungBox = h('div');
    const aktionen = h('div', { class: 'btn-row' });
    const ctrlBox = h('div');
    let ctrl;

    function baue(mitLoesung) {
      ctrl = AQI.aufgabe(a, {
        modus,
        zusatz: cfg.zusatz,
        // Bug-Hunt gestuft: Teil a) (Zeilenwahl) einzeln prüfen, danach erscheint Teil b)
        teilPruefen: mitLoesung ? null : async (teil, antwort) => {
          try {
            const r = await cfg.pruefen({ antwort, teilweise: true, teil });
            zustand = r.zustand || zustand;
            if (r.ok) mount(feedbackBox, h('div', { class: 'feedback ok' }, '✔ Richtig, das ist die fehlerhafte Zeile. Weiter mit Teil b).'));
            else {
              mount(feedbackBox, h('div', { class: 'feedback falsch' }, '✘ Das ist nicht die fehlerhafte Zeile.' + restText()));
            }
            return r;
          } catch (e) {
            toast(e.message, true);
            return null;
          }
        },
        schritt: mitLoesung ? null : async (teil, antwort) => {
          try {
            const r = await cfg.pruefen({ antwort, teilweise: true, teil });
            zustand = r.zustand || zustand;
            if (r.ok === false) zeigeStand(diagnoseVon(r));
            if (r.geloest || (r.ok && r.vollstaendig)) geloest(r);
            return r;
          } catch (e) {
            toast(e.message, true);
            return null;
          }
        }
      });
      mount(ctrlBox, ctrl.el);
    }

    /** Diagnose der Server-Antwort (oben oder je Teil) als Element über anzeige.diagnose, sonst null (K36). */
    function diagnoseVon(r) {
      if (!r || typeof anzeige.diagnose !== 'function') return null;
      const liste = [...(Array.isArray(r.diagnose) ? r.diagnose : []), ...(Array.isArray(r.teile) ? r.teile.flatMap((t) => (t && Array.isArray(t.diagnose) ? t.diagnose : [])) : [])];
      return liste.length ? anzeige.diagnose(liste) : null;
    }

    function zeigeStand(diagnose = null) {
      if (!zustand) return;
      if (zustand.status === 'offen' && zustand.fehlversuche) {
        mount(feedbackBox, h('div', { class: 'feedback falsch' }, ohnePunkte ? `Fehlversuche: ${zustand.fehlversuche}.` : `Fehlversuche: ${zustand.fehlversuche} – du kannst noch bis zu ${zustand.moeglich} Punkte erreichen.`, diagnose));
      } else if (diagnose) mount(feedbackBox, h('div', { class: 'feedback falsch' }, diagnose));
    }

    function zeigeTipps() {
      const t = (zustand && zustand.tipps) || [];
      mount(tippBox, t.map((x, i) => h('div', { class: 'tipp-box' }, h('strong', null, `💡 Tipp ${i + 1}: `), AQR.md(x, null, 'span'))));
    }

    function zeigeLoesung(d) {
      ctrl.loesung(d.loesung, d.muster);
      ctrl.sperren(true);
      mount(erklaerungBox, d.erklaerung && d.erklaerung.length ? h('section', { class: 'card erklaerung' }, h('h2', null, '📖 Erklärung'), AQR.bloecke(d.erklaerung, null)) : null);
    }

    function geloest(r) {
      const txt = cfg.punkteText ? cfg.punkteText(r) : r.punkteErhalten ? `✔ Richtig! +${r.punkteErhalten} ${r.punkteErhalten === 1 ? 'Punkt' : 'Punkte'}` : '✔ Richtig!';
      const fb = h('div', { class: 'feedback ok jubel' }, txt, zustand && zustand.status === 'angesehen' ? ' (nach dem Ansehen der Lösung – keine Punkte)' : '');
      mount(feedbackBox, fb);
      AQ.effekt.funken(fb);
      if (r.punkteErhalten) AQ.effekt.schweben(fb, `+${r.punkteErhalten}`);
      if (r.loesung !== undefined) zeigeLoesung(r);
      else ctrl.sperren(true);
      if (cfg.abzeichenToast) cfg.abzeichenToast(r.neueAbzeichen);
      knoepfe(true);
      fokusHalten();
      if (cfg.nachLoesen) cfg.nachLoesen(r);
    }

    async function pruefen() {
      if (ctrl.stufeOffen && ctrl.stufeOffen()) return ctrl.stufePruefen();
      if (ctrl.leer()) return toast('Bitte gib zuerst eine Antwort ein.', true);
      try {
        const r = await cfg.pruefen({ antwort: ctrl.antwort() });
        zustand = r.zustand || zustand;
        ctrl.feedback(r);
        if (r.ok) {
          if (r.geloest || (zustand && zustand.status !== 'offen') || r.status === 'geloest') return geloest(r);
          mount(feedbackBox, h('div', { class: 'feedback ok' }, '✔ Richtig! (bereits gelöst – keine weiteren Punkte)'));
          return;
        }
        let detail = '';
        if (r.felder) {
          const f = Object.values(r.felder).filter((x) => !x).length;
          detail = ` ${f} von ${Object.keys(r.felder).length} ${Object.keys(r.felder).length === 1 ? 'Lücke ist' : 'Lücken sind'} noch falsch (rot markiert).`;
        } else if (Array.isArray(r.teile) && r.teile.length > 1) {
          detail = ` Richtig: ${r.teile.filter((t) => t.ok).length} von ${r.teile.length} Teilen.`;
        } else if (Number.isInteger(r.ersteFalschePosition)) {
          detail = ` Bis Position ${r.ersteFalschePosition} stimmt es – danach nicht mehr.`;
        }
        const fb = h('div', { class: 'feedback falsch' }, '✘ Leider noch nicht richtig.' + detail + restText(), diagnoseVon(r));
        mount(feedbackBox, fb);
        AQ.effekt.wackeln(fb);
      } catch (e) {
        toast(e.message, true);
      }
    }

    async function tipp() {
      try {
        const r = await cfg.tipp();
        zustand = r.zustand;
        zeigeTipps();
        knoepfe(false);
      } catch (e) {
        toast(e.message, true);
      }
    }

    async function aufdecken() {
      const ok = await bestaetigen('Lösung zeigen?', ohnePunkte ? 'Du kannst die Aufgabe danach weiter üben.' : 'Danach bekommst du für diese Aufgabe 0 Punkte. Du kannst sie aber weiter üben.', { ok: 'Lösung zeigen', gefahr: !!(zustand && zustand.status === 'offen') });
      if (!ok) return;
      try {
        const r = await cfg.aufdecken();
        zustand = r.zustand || { ...zustand, status: 'angesehen' };
        zeigeLoesung(r);
        mount(feedbackBox, h('div', { class: 'feedback info' }, 'Lösung angezeigt. Lies die Erklärung und versuche es später noch einmal.'));
        knoepfe(true);
        fokusHalten();
      } catch (e) {
        toast(e.message, true);
      }
    }

    function nochmal() {
      baue(false);
      mount(feedbackBox);
      mount(erklaerungBox);
      knoepfe(false, true);
    }

    /**
     * Fokus nach dem Abschluss (Review M4 W3, K36): Der fokussierte Knopf („Prüfen“, „Lösung zeigen“) verschwindet mit
     * knoepfe(true) – ging der Fokus dabei verloren (body, entfernt, deaktiviert), bekommt ihn die Rückmeldung
     * (tabindex=-1, Ansage über aria-live), ohne Rückmeldung der Weiter-Link („Nächste Aufgabe“).
     */
    function fokusHalten() {
      const akt = document.activeElement;
      if (akt && akt !== document.body && akt.isConnected !== false && !akt.disabled) return;
      const ziel = feedbackBox.firstElementChild || aktionen.querySelector('a, button');
      if (!ziel) return;
      if (ziel === feedbackBox.firstElementChild) ziel.setAttribute('tabindex', '-1');
      ziel.focus();
    }

    function knoepfe(fertig, ueben = false) {
      const tippsUebrig = cfg.tipp && a.tippsAnzahl ? a.tippsAnzahl - ((zustand && zustand.tippsGenutzt) || 0) : 0;
      const offen = !fertig;
      mount(
        aktionen,
        offen ? h('button', { class: 'btn big', type: 'button', id: 'pruefen', onclick: pruefen }, ctrl.fertigKnopf ? '✔ Fertig – prüfen' : '✔ Prüfen') : null,
        offen && cfg.tipp && a.tippsAnzahl && zustand && zustand.status === 'offen' ? h('button', { class: 'btn gold', type: 'button', disabled: tippsUebrig <= 0, onclick: tipp }, `💡 Tipp (${Math.max(0, tippsUebrig)})`) : null,
        offen && !ueben && zustand && zustand.status === 'offen' ? h('button', { class: 'btn secondary', type: 'button', onclick: aufdecken }, '👁 Lösung zeigen') : null,
        fertig ? h('button', { class: 'btn secondary', type: 'button', onclick: nochmal }, '↻ Nochmal üben') : null,
        cfg.weiter ? h('a', { class: 'btn ' + (fertig ? '' : 'secondary') + ' right', href: cfg.weiter.href, onclick: cfg.weiter.onclick || null }, cfg.weiter.text) : null
      );
    }

    /** Niveau-Chip (K36): in der Vorschau immer, sonst nur für eA/Ergänzung/Kür (Kern ist der Normalfall). */
    function niveauChip() {
      const n = { alle: 'kern', plus: 'kuer' }[a.niveau] || a.niveau || 'kern';
      const vorschau = modus === 'vorschau';
      if (!vorschau && !['eA', 'ergaenzung', 'kuer'].includes(n)) return null;
      return AQ.niveau(n, { kursNiveau: cfg.kursNiveau, vorschau });
    }

    baue(false);
    zeigeTipps();
    const fertig = zustand && zustand.status !== 'offen';
    if (fertig && cfg.loesung !== undefined) {
      zeigeLoesung(cfg);
      mount(feedbackBox, h('div', { class: zustand.status === 'geloest' ? 'feedback ok' : 'feedback info' }, zustand.status === 'geloest' ? (ohnePunkte ? '✔ Gelöst.' : `✔ Gelöst – ${zustand.punkte} ${zustand.punkte === 1 ? 'Punkt' : 'Punkte'} erhalten.`) : zustand.nachgeloest ? 'Lösung angesehen und danach selbst gelöst.' : ohnePunkte ? 'Du hast dir die Lösung angesehen.' : 'Du hast dir die Lösung angesehen (0 Punkte).'));
    } else zeigeStand();
    knoepfe(fertig);
    return h(
      'div',
      null,
      h(
        'div',
        { class: 'aufgabe-kopf' },
        h('h1', null, a.titel),
        sterne(a.stufe),
        ohnePunkte
          ? h('span', { class: 'pill' }, typeof cfg.ohnePunkte === 'string' ? cfg.ohnePunkte : 'ohne Punkte')
          : h('span', { class: 'pill gold' }, zustand && zustand.status === 'geloest' ? `${zustand.punkte}/${a.punkte} Punkte` : `${a.punkte} ${a.punkte === 1 ? 'Punkt' : 'Punkte'}`),
        a.kategorie ? h('span', { class: 'pill' }, typeof anzeige.kategorie === 'function' ? anzeige.kategorie(a.kategorie) : a.kategorie) : null,
        niveauChip(),
        (a.fallen || []).map((p) => (typeof anzeige.falle === 'function' ? anzeige.falle(p) : h('span', { class: 'pill red', title: 'Typische Falle' }, '⚠ ' + p))),
        cfg.kopfZusatz || null
      ),
      h('section', { class: 'card' }, ctrlBox, tippBox, feedbackBox),
      erklaerungBox,
      h('div', { class: 'aktionen' }, aktionen)
    );
  }

  return { ansicht: aufgabenAnsicht };
})();
