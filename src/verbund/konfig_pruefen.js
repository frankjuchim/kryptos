'use strict';
// Kern-Kandidat lab-kern: Konfiguration prüfen, ohne den Server zu starten (M9 Task 205, E151; `npm run konfig:pruefen`).
// Liest dieselben Umgebungsvariablen wie src/server.js (ladeKonfig) und prüft DATA_DIR auf Schreibrecht.
// Exit 0 mit Zusammenfassung ohne Geheimnisse, sonst Exit 1 mit der deutschen Meldung. Nie Schlüssel oder Secret ausgeben.

const { ladeKonfig, konfigZusammenfassung, pruefeDatenDir } = require('./konfig');

try {
  const konfig = ladeKonfig(process.env);
  pruefeDatenDir(konfig.dataDir);
  console.log('✔ Konfiguration in Ordnung');
  console.log(JSON.stringify(konfigZusammenfassung(konfig), null, 2));
} catch (e) {
  console.error(`✘ ${e.message}`);
  process.exit(1);
}
