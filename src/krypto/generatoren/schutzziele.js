'use strict';
// Generator Welt 5 (SPEC W5 §8 w5_schutzziele): Welche Schutzziele erreicht ein Szenario? Die Spec nennt 24 Bausteine, listet
// sie aber nicht; vorläufig (Plan M8 Task 193, offene Entscheidung) nur die Bausteine mit fester Lösung aus SPEC W5
// Akte W5·2 Auftrag 4 (Lösungstabelle). Optionen in fester Reihenfolge, der Client mischt. Fünfte Option „Verfügbarkeit“
// (nie richtig – kein Verfahren der Kryptografie sichert sie): sonst wären bei „signieren und verschlüsseln“ alle
// Optionen richtig (Lösungsverrat K6, Entscheidung der Lehrkraft 14.10.2026).

const txt = (md) => ({ t: 'text', md });
const ZIELE = Object.freeze([['v', 'Vertraulichkeit'], ['i', 'Integrität'], ['a', 'Authentizität'], ['b', 'Verbindlichkeit'], ['f', 'Verfügbarkeit']]);
const BAUSTEINE = Object.freeze([
  { name: 'nur verschlüsseln', szenario: 'Alice verschlüsselt ihre Nachricht an Bob hybrid (Sitzungsschlüssel mit Bobs öffentlichem Schlüssel) und signiert sie nicht.', richtig: ['v'], begruendung: 'Nur Bob kann lesen. Bobs öffentlichen Schlüssel kennt aber jeder – jeder könnte so eine Nachricht erzeugen oder unterschieben: keine Authentizität, keine Verbindlichkeit.' },
  { name: 'nur signieren', szenario: 'Alice signiert ihre Nachricht mit ihrem privaten Schlüssel und sendet sie unverschlüsselt an Bob.', richtig: ['i', 'a', 'b'], begruendung: 'Die Signatur sichert Integrität, Authentizität und Verbindlichkeit – ohne Verschlüsselung ist die Nachricht aber für alle lesbar.' },
  { name: 'signieren und verschlüsseln', szenario: 'Alice signiert ihre Nachricht mit ihrem privaten Schlüssel und verschlüsselt Nachricht und Signatur danach hybrid für Bob.', richtig: ['v', 'i', 'a', 'b'], begruendung: 'Signatur und Verschlüsselung zusammen erreichen alle vier Schutzziele.' }
]);

function schutzziele(z) {
  const b = z.pick(BAUSTEINE);
  return {
    titel: `Schutzziele: ${b.name}`,
    stufe: b.richtig.length === 4 ? 1 : 2,
    kategorie: 'signatur',
    fallen: ['P9'],
    inhalt: [txt(`Welche Schutzziele werden im folgenden Szenario erreicht? ${b.szenario}`)],
    interaktion: { kind: 'choice', mehrfach: true, optionen: ZIELE.map(([id, md]) => ({ id, md })) },
    loesung: { richtig: [...b.richtig] },
    tipps: ['Vertraulichkeit entsteht nur durch Verschlüsselung.', 'Integrität, Authentizität und Verbindlichkeit entstehen durch die Signatur mit dem privaten Schlüssel der Absenderin.'],
    erklaerung: [txt(`Erreicht: ${ZIELE.filter(([id]) => b.richtig.includes(id)).map(([, n]) => `**${n}**`).join(', ')}. ${b.begruendung} Verfügbarkeit sichert keines der Verfahren.`)]
  };
}

module.exports = {
  w5_schutzziele: { titel: 'Schutzziele', welten: [5], niveau: 'kern', make: schutzziele }
};
