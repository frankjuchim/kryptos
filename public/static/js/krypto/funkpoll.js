/* Kryptos – gemeinsamer Poller KRPoll (TECHNIK §12.4, Plan M7 Task 151, E109, E110) für Funkraum-Seite, Beamer und
   Lehrkraft-Regie: eigenes fetch mit If-None-Match (letzter ETag) und ?seit=<Version>; 304 → nichts; 200 → beiDaten.
   Rückfall bei Netzfehler/5xx 2 → 4 → 8 → 15 s, danach alle 15 s; nach dem ersten Erfolg wieder das Intervall.
   Pause bei document.hidden, sofortiger Abruf beim Zurückkehren. Nach status 'auswertung' nur noch alle 15 s.
   401 mit anmelden → SSO-Start wie AQ.api; 403/404 → beiZustand('ende', fehler) und Stopp.
   mischen: true → beiDaten bekommt den zusammengeführten Stand (Nachrichten und Ereignisse nach id; die Antwort auf
   ?seit=v enthält nur Neues und Geändertes, E109). Antworten mit `voll: true` (Phasen-/Statuswechsel, anderes Team oder
   andere Rolle – Review M7 W2/K3) ersetzen den Stand, sonst blieben z. B. verdeckte Mallory-Umschläge verdeckt.
   429: nächster Abruf nach `Retry-After` Sekunden (mindestens das Intervall), ohne Rückfall-Anzeige (Review M7 K6). */
'use strict';

const KRPoll = (() => {
  const RUECKFALL = Object.freeze([2000, 4000, 8000, 15000]);
  const NACH_AUSWERTUNG = 15000;

  /** Stand zusammenführen: Nachrichten (nach id ersetzen) und Ereignisse (nach id ergänzen), sonst das Neue */
  function mische(alt, neu) {
    if (!alt || !neu || alt.id !== neu.id || neu.voll === true) return neu;
    const nachrichten = new Map((alt.nachrichten || []).map((n) => [n.id, n]));
    for (const n of neu.nachrichten || []) nachrichten.set(n.id, n);
    const ereignisse = new Map((alt.ereignisse || []).map((e) => [e.id, e]));
    for (const e of neu.ereignisse || []) ereignisse.set(e.id, e);
    return {
      ...neu,
      nachrichten: [...nachrichten.values()].sort((a, b) => a.id - b.id),
      ereignisse: [...ereignisse.values()].sort((a, b) => a.id - b.id)
    };
  }

  /**
   * Poller starten.
   * @param {{ url: (seit: number) => string, intervall?: number, beiDaten?: Function, beiZustand?: Function,
   *           mischen?: boolean, sofort?: boolean }} o
   *   beiZustand(z, fehler?): 'ok' | 'gestoert' | 'ende'
   * @returns {{ stopp(): void, jetzt(): Promise<void>, version(): number, stand(): object|null }}
   */
  function starte(o) {
    const intervall = Number(o.intervall) > 0 ? Number(o.intervall) : 2000;
    let etag = null;
    let version = 0;
    let stand = null;
    let timer = null;
    let laeuft = false; // Abruf unterwegs
    let gestoppt = false;
    let fehlerZahl = 0;
    let zustand = 'ok';
    let auswertung = false;
    let warteBis = 0; // ms aus Retry-After (429), gilt für den nächsten Abruf

    const melde = (z, fehler) => {
      if (z === zustand && z !== 'ende') return;
      zustand = z;
      if (typeof o.beiZustand === 'function') o.beiZustand(z, fehler);
    };
    const versteckt = () => typeof document !== 'undefined' && (document.hidden === true || document.visibilityState === 'hidden');

    function plane(ms) {
      if (gestoppt) return;
      clearTimeout(timer);
      timer = setTimeout(los, ms);
    }

    function naechsteWartezeit() {
      if (warteBis > 0) {
        const ms = warteBis;
        warteBis = 0;
        return Math.max(ms, intervall);
      }
      if (fehlerZahl > 0) return RUECKFALL[Math.min(fehlerZahl - 1, RUECKFALL.length - 1)];
      return auswertung ? Math.max(intervall, NACH_AUSWERTUNG) : intervall;
    }

    async function abruf() {
      const kopf = { Accept: 'application/json' };
      if (etag) kopf['If-None-Match'] = etag;
      let res;
      try {
        res = await fetch(o.url(version), { method: 'GET', headers: kopf, credentials: 'same-origin' });
      } catch {
        fehlerZahl++;
        melde('gestoert');
        return;
      }
      if (gestoppt) return;
      if (res.status === 304) {
        fehlerZahl = 0;
        melde('ok');
        return;
      }
      let daten = null;
      const ct = (res.headers && res.headers.get('content-type')) || '';
      if (ct.includes('application/json')) {
        try {
          daten = await res.json();
        } catch {
          daten = null;
        }
      }
      if (res.status === 401 && daten && daten.anmelden) {
        stopp();
        location.href = '/sso/start?ziel=' + encodeURIComponent(location.pathname + location.hash);
        return;
      }
      if (res.status === 403 || res.status === 404) {
        const e = new Error((daten && daten.error) || `Fehler ${res.status}`);
        e.status = res.status;
        stopp();
        melde('ende', e);
        return;
      }
      if (res.status === 429) {
        // Grenze erreicht: so lange warten, wie der Server sagt – kein Rückfall, keine Störungsanzeige
        const s = Number((res.headers && res.headers.get('retry-after')) || 0);
        warteBis = (Number.isFinite(s) && s > 0 ? Math.min(s, 300) : 15) * 1000;
        return;
      }
      if (!res.ok || !daten) {
        // 5xx oder Antwort ohne JSON: wie ein Netzfehler (Rückfall)
        fehlerZahl++;
        melde('gestoert');
        return;
      }
      fehlerZahl = 0;
      const neu = res.headers && res.headers.get('etag');
      if (neu) etag = neu;
      stand = o.mischen ? mische(stand, daten) : daten;
      if (Number.isInteger(daten.version)) version = daten.version;
      auswertung = daten.status === 'auswertung';
      melde('ok');
      if (typeof o.beiDaten === 'function') o.beiDaten(stand);
    }

    async function los() {
      if (gestoppt) return;
      if (versteckt()) return; // pausiert – visibilitychange holt nach
      if (laeuft) return;
      laeuft = true;
      try {
        await abruf();
      } finally {
        laeuft = false;
      }
      plane(naechsteWartezeit());
    }

    function sichtbar() {
      if (gestoppt || versteckt()) return;
      clearTimeout(timer);
      los();
    }
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', sichtbar);

    function stopp() {
      gestoppt = true;
      clearTimeout(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', sichtbar);
    }

    if (o.sofort === false) plane(intervall);
    else los();

    return {
      stopp,
      /** sofort abrufen (z. B. nach einer eigenen Aktion); erfüllt, wenn der Abruf fertig ist */
      async jetzt() {
        if (gestoppt) return;
        clearTimeout(timer);
        if (laeuft) return;
        laeuft = true;
        try {
          await abruf();
        } finally {
          laeuft = false;
        }
        plane(naechsteWartezeit());
      },
      version: () => version,
      stand: () => stand
    };
  }

  return { starte, mische, RUECKFALL };
})();
