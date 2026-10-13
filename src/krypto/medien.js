'use strict';
// Kryptos: Akte (PDF) und Erklärvideo je Level für die Level-Seite (Plan M5 Task 98, K38, TECHNIK §13.1).
// Dienst-Option `levelMedien(level) → { akteDatei: { titel, url } | null, video: { nr, titel, url } | null }`:
//  - akteDatei aus seed/akten.json (Zuordnung `level`), nur wenn die PDF ausgeliefert werden kann (/akten/…, nur nach Anmeldung)
//  - video aus Level-Feld `video` ({ nr, titel }), url aus seed/videos.json – nur https-Adressen, sonst null (Videos sind
//    bis zur Veröffentlichung nicht öffentlich, E51; die Seite verlinkt nur mit url, E35)

const pfadUrl = (datei) => '/akten/' + datei.split('/').map(encodeURIComponent).join('/');

/**
 * @param {{ verzeichnis: object|null, pdfVorhanden: (datei: string) => boolean, videos: Array|null }} q
 *   verzeichnis = seed/akten.json, videos = seed/videos.json `videos`
 */
function createLevelMedien({ verzeichnis, pdfVorhanden = () => false, videos = null }) {
  const akteZu = new Map();
  for (const w of (verzeichnis && Array.isArray(verzeichnis.welten) && verzeichnis.welten) || []) {
    for (const a of Array.isArray(w.akten) ? w.akten : []) {
      const datei = `${w.ordner}/${a.datei}`;
      if (!pdfVorhanden(datei)) continue;
      const eintrag = { titel: `Akte W${w.welt}·${a.nr} – ${a.titel}`, url: pfadUrl(datei) };
      for (const id of Array.isArray(a.level) ? a.level : []) akteZu.set(id, eintrag);
    }
  }
  const videoUrl = new Map();
  for (const v of Array.isArray(videos) ? videos : []) {
    if (v && Number.isInteger(v.nr) && typeof v.url === 'string' && /^https:\/\/[^\s"<>]+$/.test(v.url)) videoUrl.set(v.nr, v.url);
  }
  return (l) => ({
    akteDatei: akteZu.has(l.id) ? { ...akteZu.get(l.id) } : null,
    video: l.video && Number.isInteger(l.video.nr) ? { nr: l.video.nr, titel: l.video.titel, url: videoUrl.get(l.video.nr) || null } : null
  });
}

module.exports = { createLevelMedien };
