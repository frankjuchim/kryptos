/* Kryptos – Speicher des Erkenner-Verlaufs je Tab (Review-Fund 3 nach M11): KRErkenner.verlauf() legt hier nach jeder
   Eingabe die Fortsetzungen ab, die das Ende der bisherigen Eingabe zu Aufgabenwerten ergänzen würden – Zeichen aus den
   Aufgabendaten, nie die Eingaben selbst. So erkennt das Werkzeug Häppchen auch nach dem Neuladen. sessionStorage
   (nur dieser Tab, gelöscht beim Schließen), jeder Zugriff mit try/catch; ohne Speicher arbeitet der Erkenner wie zuvor. */
'use strict';

const KRErkennerSpeicher = (() => {
  const SCHLUESSEL = 'kr-erkenner';
  function alles() {
    try {
      const x = JSON.parse(sessionStorage.getItem(SCHLUESSEL) || '{}');
      return x && typeof x === 'object' && !Array.isArray(x) ? x : {};
    } catch {
      return {};
    }
  }
  return {
    lade(id) {
      const x = alles()[id];
      return x && typeof x === 'object' ? x : null;
    },
    speichere(id, daten) {
      try {
        const x = alles();
        x[id] = daten;
        sessionStorage.setItem(SCHLUESSEL, JSON.stringify(x));
      } catch {
        /* privates Fenster, Speicher voll: ohne Neuladen-Schutz */
      }
    }
  };
})();
