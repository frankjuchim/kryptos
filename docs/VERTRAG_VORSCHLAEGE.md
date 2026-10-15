# Vorschläge für den Vertrag des Plattform-Verbunds InfoLabs (Kryptos)

> **Durch labs-Vertrag v1.2 überstimmt (Entscheidung der Lehrkraft, 12.10.2026).** Verbindlich ist
> `frankjuchim/labs/VERTRAG.md` **Version 1.2** (Commit `3f48c5c`: Anforderungsniveaus – jede Plattform ist für eA und gA,
> Niveau-Übersicht ohne Anmeldung nach §9, Manifest-Felder `niveaus` KANN und `urls.niveaus` SOLL). Kryptos erfüllt diese
> Fassung vollständig (`vertrag: "1.2"`, `niveaus: ["eA", "gA"]`, `urls.niveaus: "/themen#niveaus"`, `GET /api/niveaus`;
> TECHNIK §6.1, §6.9, §6.10). Der frühere Kryptos-Entwurf „Version 1.2“ (unten, Teile A–H, **nur noch Archiv**) gilt
> **nicht**: Nichts davon wird still umgesetzt, und keine Regel daraus geht dem labs-Vertrag vor. Die Datei hieß bis
> dahin `docs/VERTRAG_VORSCHLAG_v1.2.md`.
>
> **Stand Kryptos 1.1.2:** Verbindlich ist inzwischen labs `VERTRAG.md` **Version 1.3** (Commit `2b8803b`, Nebenversion:
> Einstieg über `/sso/start`, `kurs-aendern` legt unbekannte Kurse an, Sandbox-Regel §9, Liste bekannter Fähigkeiten in
> §7). Kryptos erfüllt v1.3 (TECHNIK §6.10). Die Tabelle unten beschreibt v1.2; geändert hat sich für Kryptos nur die
> Zeile „Fähigkeiten“ (siehe V3).

## Was labs v1.2 regelt und was daraus für Kryptos folgt

| Punkt | labs v1.2 | Kryptos |
|---|---|---|
| Niveaus im Manifest | `niveaus` (KANN): für welche Niveaus die Plattform gedacht ist, ohne Angabe eA und gA | `["eA", "gA"]` |
| Niveau-Übersicht | §9 MUSS: ohne Anmeldung, welche Welten, Level, Aufgaben, Materialien für welches Niveau; `urls.niveaus` (SOLL) | `/themen#niveaus` (Seite) + `GET /api/niveaus` (Daten) |
| `anteil` und Rangschwellen | §6/§9: Anteil an den **Level-Punkten der freigeschalteten Welten** – nichts zu Niveau, Ergänzung oder Kür | alle für den Kurs **sichtbaren** Level-Aufgaben der freigeschalteten Welten (Ergänzung und Kür zählen mit; eA-Aufgaben im gA-Kurs sind ausgeblendet) – TECHNIK §8.3 |
| Kursübersicht | Format §6 ohne Feld `niveau` | **kein** Feld `niveau` |
| Fähigkeiten | freie Liste (v1.3: Liste bekannter Namen in §7) | bis 1.1.1 `labor`, `funkraum`, `arena`, `niveau` (freie Werte); ab 1.1.2 nur Namen aus §7 |

## Mögliche Vorschläge für eine spätere Version (Abstimmung mit dem Portal)

Nicht übernommene Punkte des alten Entwurfs, die weiterhin sinnvoll wären. Sie gelten erst, wenn das Portal-Repo sie in
`VERTRAG.md` aufnimmt (neue Version, Eintrag in §14); bis dahin richtet sich Kryptos nach labs v1.2.

1. **V1 – Kursniveau in der Kursübersicht** (alter Teil A.4): optionales Feld `"niveau": "eA" | "gA"` in
   `GET /api/verbund/kurse/:kursId/uebersicht`, damit das Portal Anteile von gA- und eA-Kursen nicht ungekennzeichnet
   nebeneinanderstellt. Dazu Begriff „Niveau“ in §2 (alter Teil A.2).
2. **V2 – `anteil`/Rang nur über bewertete Inhalte** (alter Teil A.4, früher „Vorschlag (c)“): Ergänzungen (RSA, DH) und
   Kür zählen in `punkte`, aber nicht in `anteil` und in den Rangschwellen (Design §3.2: fairer Vergleich). labs v1.2
   lässt offen, ob freiwillige Inhalte zu den „Level-Punkten der freigeschalteten Welten“ gehören; Kryptos rechnet bis zur
   Klärung vertragsnah mit allen sichtbaren Level-Aufgaben. Vorschlagstext für §9 „Vergleichbarkeit“: „Inhalte, die die
   Plattform als freiwillig kennzeichnet (Ergänzung, Kür), zählen in `punkte`, aber nicht in `anteil` und Rangschwellen.“
3. **V3 – Verzeichnis der Fähigkeiten** (alter Teil B, §7.1) mit `labor`, `funkraum`, `arena`, `niveau`, damit das
   Portal sie anzeigen kann. **Teilweise erledigt durch v1.3:** §7 nennt jetzt bekannte Fähigkeiten (u. a. `sql-konsole`,
   `live`), aber nicht die vier Kryptos-Namen; Kryptos meldet sie deshalb seit 1.1.2 nicht mehr. Offen bleibt, sie in die
   Liste aufzunehmen (Nebenversion).
4. **V4 – Regeln für zwischen Konten ausgetauschte Inhalte** (alter Teil C: Kursgrenze, Whitelist, Ausblenden,
   Löschfristen 24 h/30 Tage, Einschluss in `loeschen`). Kryptos hält diese Regeln als **eigene, strengere** Festlegung
   ohnehin ein (TECHNIK §9, §12) – sie widersprechen dem Vertrag nicht.
5. **V5 – Oberfläche** (alter Teil D): Portal-Link, Touch-Ziele, Kontraste als MUSS; eigenes Designsystem mit Begründung
   erlaubt. Bis dahin bleibt es bei der begründeten SOLL-Abweichung im README.
6. **V6 – Gemeinsamer Kern `lab-kern`** (alter Teil E): Naht-Regel, Abweichungsprotokoll, Auslagerung in drei Schritten.
7. **V7 – `vertrag_pruefen.js`** (alter Teil F): Prüfung der Fähigkeiten-Kennungen und `pruefeKursuebersicht`.
8. **V8 – Kursniveau aus dem Portal** (offene Frage 2 unten): Portal führt LK/GK je Kurs und gibt es per `kurs-aendern` weiter.

Eine neue Version würde (nach labs v1.3) frühestens **1.4** heißen; der Text unten müsste dafür an labs v1.2 angepasst werden (Teil A
überschneidet sich mit dem angenommenen `niveaus`, das dort „gedacht für“ statt „je Kurs unterschieden“ bedeutet).

---

## Archiv: früherer Kryptos-Entwurf (unverändert, überholt)

> **Von:** Plattform Kryptos (`kryptos`) · **An:** Portal-Repo `frankjuchim/labs`, Datei `VERTRAG.md` (derzeit v1.1)
> **Stand:** 12.10.2026 · **Art:** Nebenversion (nur Ergänzungen und Präzisierungen; keine MUSS-Pflicht entfällt oder
> wird umbenannt; Plattformen nach v1.0/v1.1 bleiben gültig, `vertrag_pruefen.js` akzeptiert weiter jede 1.x).
>
> **Warum:** Kryptos braucht Dinge, die v1.1 nicht regelt (Niveau gA/eA, neue Fähigkeiten, Inhalte, die Schüler
> untereinander austauschen, ein eigenes Designsystem). VERTRAG §13.4: „Vertrag zuerst ändern, dann bauen“ und
> „Weicht dein Projekt ab …, schlage eine Vertragsänderung vor … statt still abzuweichen“. Bis zur Annahme hält
> Kryptos v1.1 ein (keine Felder `niveaus`/`niveau`, `vertrag: "1.1"`); die Fähigkeiten `labor`, `funkraum`, `arena`,
> `niveau` stehen schon heute in der (freien) Liste.
>
> **Umsetzung nach Annahme:** (1) Diese Textstellen in `VERTRAG.md` übernehmen, (2) `scripts/vertrag_pruefen.js`
> anpassen (Abschnitt F), (3) `docs/INTEGRATION.md` ergänzen (Abschnitt G), (4) Test-Plattform und Portal-Tests
> ergänzen, (5) Plattformen kopieren `vertrag_pruefen.js` neu. Kryptos stellt danach auf `vertrag: "1.2"` um.
> Dieses Dokument ändert das Portal-Repo **nicht** – die Übernahme entscheidet Frank im Portal-Repo.

Übersicht der Änderungen:

| Teil | Abschnitt | Inhalt |
|---|---|---|
| A | Kopf, §2, §6, §7 | Niveau: optionales Manifest-Feld `niveaus`, optionales Feld `niveau` in der Kursübersicht |
| B | §7 (neu §7.1) | Verzeichnis bekannter `faehigkeiten`-Werte inkl. `labor`, `funkraum`, `arena`, `niveau` |
| C | §10, §6, §12 | Regel für Inhalte, die zwischen Konten ausgetauscht werden (Funkraum, Arena) |
| D | §9 | Präzisierung „Oberfläche (SOLL)“: eigenes Design erlaubt unter Bedingungen, Begründung im README |
| E | §13.3 | Stand des gemeinsamen Kerns und Vorschlag für das gemeinsame Vorgehen (`lab-kern`) |
| F | `scripts/vertrag_pruefen.js` | Prüfung der neuen optionalen Felder |
| G | `docs/INTEGRATION.md` | Hinweise und Testfälle |
| H | §14 | Versionseintrag |

---

## Teil A – Niveau (gA/eA)

### A.1 Kopf

**bisher:**

```
# Der Plattform-Verbund InfoLabs – Vertrag v1.1

> **Status:** Vertrag **v1.1 (verbindlich)**. Maßgeblich ist diese Datei im Repository **`frankjuchim/labs`**
```

**neu:**

```
# Der Plattform-Verbund InfoLabs – Vertrag v1.2

> **Status:** Vertrag **v1.2 (verbindlich)**. Maßgeblich ist diese Datei im Repository **`frankjuchim/labs`**
```

**bisher:**

```
> **Verweis aus einer Plattform:** „Verbindlich ist der Vertrag des Plattform-Verbunds:
> https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.1)“.
```

**neu:**

```
> **Verweis aus einer Plattform:** „Verbindlich ist der Vertrag des Plattform-Verbunds:
> https://github.com/frankjuchim/labs/blob/main/VERTRAG.md (Version 1.2)“.
```

(Ebenso im Startprompt in §13: „(Version 1.1)“ → „(Version 1.2)“.)

### A.2 §2 Begriffe – neue Zeile am Ende der Tabelle

**neu (Zeile anhängen):**

```
| **Niveau** | Anforderungsniveau eines Kurses: `eA` (erhöhtes Anforderungsniveau, Leistungskurs) oder `gA` (grundlegendes Anforderungsniveau, Grundkurs). Plattformen, die beide Niveaus unterscheiden, melden das im Manifest (`niveaus`, §7); das Niveau eines Kurses ist eine Kurs-Einstellung der Plattform (§3) |
```

### A.3 §7 Manifest – neues optionales Feld `niveaus`

**bisher:**

```
`urls.ssoEnde` (KANN): Pfad des SSO-Rücksprungs; das Portal schlägt `basis + urls.ssoEnde` als Rücksprung-Adresse vor
(der Superadmin bestätigt sie). Das Portal verlinkt Schüler mit „Weiter zu …“ auf `basis + urls.ssoStart`.
```

**neu:**

```
`urls.ssoEnde` (KANN): Pfad des SSO-Rücksprungs; das Portal schlägt `basis + urls.ssoEnde` als Rücksprung-Adresse vor
(der Superadmin bestätigt sie). Das Portal verlinkt Schüler mit „Weiter zu …“ auf `basis + urls.ssoStart`.
`niveaus` (KANN, ab v1.2): Liste der Niveaus, die die Plattform je Kurs unterscheidet, Werte `"eA"` und/oder `"gA"`
(z. B. `["eA", "gA"]`). Wer das Feld angibt, MUSS die Fähigkeit `niveau` (§7.1) melden und die Kursübersicht (§6) um
`niveau` ergänzen. Fehlt das Feld, gilt die Plattform als niveauneutral (Inhalte für alle Kurse gleich).
```

### A.4 §6 Kursübersicht – optionales Feld `niveau`

**bisher:**

~~~
Antwort der Kursübersicht (`anteil` = Anteil an den Level-Punkten der freigeschalteten Welten, 0…1):

```json
{ "kurs": "k:17", "stand": "2026-10-11T10:00:00Z",
  "schueler": [{ "sub": "s:1042", "punkte": 120, "geloest": 14, "anteil": 0.31, "zuletzt": "2026-10-10T09:12:00Z" }],
  "welten":   [{ "nr": 0, "titel": "Die Akademie", "anteil": 0.55 }] }
```
~~~

**neu:**

~~~
Antwort der Kursübersicht (`anteil` = Anteil an den Level-Punkten der freigeschalteten Welten, 0…1):

```json
{ "kurs": "k:17", "stand": "2026-10-11T10:00:00Z", "niveau": "gA",
  "schueler": [{ "sub": "s:1042", "punkte": 120, "geloest": 14, "anteil": 0.31, "zuletzt": "2026-10-10T09:12:00Z" }],
  "welten":   [{ "nr": 0, "titel": "Die Akademie", "anteil": 0.55 }] }
```

`niveau` (ab v1.2, Pflicht für Plattformen mit `niveaus` im Manifest, sonst weglassen): das für den Kurs eingestellte
Niveau (`"eA"` | `"gA"`). Bei solchen Plattformen beziehen sich `anteil` (Schüler und Welten) und die Rangschwellen
(§9) **nur auf die Level-Punkte der Inhalte, die für dieses Niveau sichtbar und bewertet sind** – Ergänzungen und
Vertiefungen („Kür“) zählen in `punkte`, aber nie in `anteil`. Damit bleiben Anteile über Plattformen und Kurse
vergleichbar.
~~~

---

## Teil B – Verzeichnis der Fähigkeiten

### B.1 §7 – Satz zu `faehigkeiten` und neuer Unterabschnitt §7.1

**bisher:**

```
Pflichtfelder prüft `scripts/vertrag_pruefen.js` (§12): `vertrag`, `id`, `name`, `titel`, `themenfeld`, `kurs`,
`beschreibung`, `version`, `basis`, `urls.{start,gast,themen,lehrkraft,datenschutz,healthz}`, `auth.{modus,sso}`
(bei `sso: true` auch `urls.ssoStart`), `umfang`, `faehigkeiten` (mit `gast`).
```

**neu:**

```
Pflichtfelder prüft `scripts/vertrag_pruefen.js` (§12): `vertrag`, `id`, `name`, `titel`, `themenfeld`, `kurs`,
`beschreibung`, `version`, `basis`, `urls.{start,gast,themen,lehrkraft,datenschutz,healthz}`, `auth.{modus,sso}`
(bei `sso: true` auch `urls.ssoStart`), `umfang`, `faehigkeiten` (mit `gast`; Werte nach §7.1).
```

**neu (Unterabschnitt nach dem letzten Absatz von §7 einfügen):**

```
### §7.1 Verzeichnis der Fähigkeiten

`faehigkeiten` ist eine Liste von Kennungen (`^[a-z][a-z0-9-]{1,30}$`). Das Portal zeigt bekannte Werte mit
Bezeichnung und Symbol an und übergeht unbekannte stillschweigend. Neue Werte SOLLEN vor ihrer Verwendung hier
eingetragen werden (Nebenversion); bis dahin sind sie erlaubt, werden aber nicht angezeigt.

| Wert | seit | Bedeutung |
|---|---|---|
| `gast` | 1.0 | Gastmodus `/gast` ohne Anmeldung, eigene Demo-Aufgaben (**Pflicht**) |
| `themen` | 1.0 | Themenseite `/themen` ohne Lösungen |
| `lehrkraft-materialien` | 1.0 | Downloads für angemeldete Lehrkräfte (Lösungen, Präsentationen …) mit Whitelist |
| `boss` | 1.0 | Boss-Kämpfe (Abitur-Probe auf Zeit, ohne Feedback im Kampf) |
| `training` | 1.0 | Trainingsplatz mit Zufallsaufgaben aus Generatoren |
| `warmup` | 1.0 | Warm-up-Karten (Leitner, ohne Punkte) |
| `scoreboard` | 1.0 | Kurs-Scoreboard (abschaltbar) |
| `beamer` | 1.0 | Beamer-Board des Kurses |
| `urkunden` | 1.0 | druckbare Urkunden |
| `fallen-profil` | 1.0 | Fallen P1–P10 je Schüler und Kurs |
| `labor` | 1.2 | interaktive Werkzeuge zum Rechnen/Entdecken, je Kurs freigebbar, im Boss gesperrt |
| `funkraum` | 1.2 | Live-Szenarien im Kurs, in denen Teams einander Nachrichten schicken (§10 „Ausgetauschte Inhalte“) |
| `arena` | 1.2 | Wettbewerb, in dem Teams eigene Lösungen/Verfahren veröffentlichen und gegenseitig bearbeiten (§10 „Ausgetauschte Inhalte“) |
| `niveau` | 1.2 | Kurs-Einstellung gA/eA mit Wirkung auf Sichtbarkeit, Boss und Anteil (§6, §7 `niveaus`) |
```

---

## Teil C – Inhalte, die zwischen Konten ausgetauscht werden

### C.1 §10 Datenschutz im Verbund – neuer Absatz

**bisher:**

```
- Plattformen verarbeiten pseudonym (`sub` + Anzeigename) und geben Lernstände nur an das Portal weiter (§6, nur
  Kennzahlen). Zwischen Plattformen fließen keine Daten.
```

**neu:**

```
- Plattformen verarbeiten pseudonym (`sub` + Anzeigename) und geben Lernstände nur an das Portal weiter (§6, nur
  Kennzahlen). Zwischen Plattformen fließen keine Daten.
- **Ausgetauschte Inhalte (ab v1.2, MUSS für Plattformen mit `funkraum`, `arena` oder vergleichbaren Funktionen):**
  Inhalte, die ein Konto erstellt und die andere Konten sehen (Nachrichten, veröffentlichte Lösungen oder Verfahren,
  Beurteilungen), sind nur zulässig, wenn
  1. sie **nur innerhalb eines Kurses** sichtbar sind (Lehrkräfte des Kurses eingeschlossen; nie kursübergreifend,
     nie öffentlich, nie im Beamer-Board ohne Anmeldung, nie in Kursübersicht oder Manifest);
  2. freie Eingaben **serverseitig auf eine Whitelist** beschränkt sind, die dem Zweck genügt (z. B. Nachrichten nur
     `^[A-Z0-9 ]{1,160}$`); Freitexte über die Whitelist hinaus (z. B. Beurteilungen) sind nur für das eigene Team und
     die Lehrkräfte sichtbar;
  3. Anzeigen nur **Team- oder Rollennamen aus einer festen Liste** zeigen, keine frei gewählten Namen;
  4. Lehrkräfte des Kurses jeden Beitrag sofort **ausblenden** können (Inhalt wird dabei gelöscht);
  5. sie **gelöscht** werden: Live-Inhalte (Nachrichten in Echtzeit-Szenarien) mit dem Ende des Szenarios, **spätestens
     24 Stunden** nach dessen Beginn; länger bestehende Wettbewerbsinhalte spätestens 30 Tage nach Abschluss, in jedem
     Fall mit dem Kurs;
  6. sie in die **Löschung über §6** eingeschlossen sind: `loeschen {sub}` entfernt alle Beiträge und Versuche, die
     diesem Konto zugeordnet sind, sowie Team-Inhalte, wenn das Team danach keine Mitglieder mehr hat;
     `loeschen {kurs}` entfernt alles;
  7. Lösungen, deren Prüfung serverseitig erfolgt, nur als **Hash mit geheimem Salz** gespeichert werden, wenn der
     Klartext selbst nicht gebraucht wird;
  8. die Plattform-Datenschutzseite die Fristen und Zwecke nennt und auf die zentrale Erklärung (§10) verweist.
```

### C.2 §6 – Klarstellung zur Löschung

**bisher:**

```
| `POST /api/verbund/loeschen` `{ "sub": "s:1042" }` oder `{ "kurs": "k:17" }` | `loeschen` | **MUSS** (ab `portal`/`beides`) | alle Daten des Kontos bzw. des Kurses auf der Plattform löschen; idempotent; Antwort `{ "geloescht": n }` |
```

**neu:**

```
| `POST /api/verbund/loeschen` `{ "sub": "s:1042" }` oder `{ "kurs": "k:17" }` | `loeschen` | **MUSS** (ab `portal`/`beides`) | alle Daten des Kontos bzw. des Kurses auf der Plattform löschen – einschließlich ausgetauschter Inhalte nach §10; idempotent; Antwort `{ "geloescht": n }` |
```

### C.3 §12 Vertragsprüfung – Testfälle ergänzen

**bisher:**

```
- Ab Phase 1 kommen SSO- und Verbund-API-Tests hinzu: Token mit falscher Signatur, falschem `aud`, falschem `iss`,
  abgelaufen, `exp − iat` zu groß, wiederverwendet, falscher `state` → abgelehnt; Verbund-API ohne Token, mit falschem
  `zweck` → 401; Löschung idempotent (Liste in `docs/INTEGRATION.md` §5).
```

**neu:**

```
- Ab Phase 1 kommen SSO- und Verbund-API-Tests hinzu: Token mit falscher Signatur, falschem `aud`, falschem `iss`,
  abgelaufen, `exp − iat` zu groß, wiederverwendet, falscher `state` → abgelehnt; Verbund-API ohne Token, mit falschem
  `zweck` → 401; Löschung idempotent (Liste in `docs/INTEGRATION.md` §5).
- Plattformen mit ausgetauschten Inhalten (§10) testen zusätzlich: Whitelist serverseitig, Sichtbarkeit nur im eigenen
  Kurs, Ausblenden löscht den Inhalt, Löschfristen (mit steuerbarer Uhr), `loeschen {sub}` und `{kurs}` entfernen die
  ausgetauschten Inhalte.
```

---

## Teil D – Oberfläche (SOLL) präzisieren

### D.1 §9 Gemeinsame Regeln, letzter Spiegelstrich

**bisher:**

```
- **Oberfläche (SOLL):** Hausfarben (#1F4E79, Gold #B8860B, Grün #548235, Rot #C00000), eigene Plattformfarbe, in der
  Kopfzeile ein Link „⌂ Portal“, sobald `PORTAL_URL` gesetzt ist; Tablet-tauglich (Touch-Ziele ≥ 44 px).
```

**neu:**

```
- **Oberfläche:** in der Kopfzeile jeder angemeldeten Seite ein Link „⌂ Portal“ auf `PORTAL_URL`, sobald `PORTAL_URL`
  gesetzt ist (**MUSS**); Tablet-tauglich mit Touch-Zielen ≥ 44 × 44 px und ohne horizontales Seiten-Scrollen ab
  360 px Breite (**MUSS**); Kontraste nach WCAG 2.1 AA – Text ≥ 4,5 : 1, große Schrift und Bedienelemente ≥ 3 : 1,
  Rückmeldungen nie nur über Farbe (**MUSS**); Schriften und Grafiken selbst gehostet (§9 Technik). Gestaltung
  (**SOLL**): Hausfarben (#1F4E79, Gold #B8860B, Grün #548235, Rot #C00000) und die Plattformfarbe aus dem Manifest.
  Eine Plattform DARF stattdessen ein **eigenes Designsystem mit Themenfarben** verwenden (z. B. eine Farbe je Welt),
  wenn (1) die MUSS-Punkte dieses Spiegelstrichs erfüllt sind, (2) die Plattformfarbe des Manifests im Design vorkommt
  (Wiedererkennung im Portal), (3) die Begriffe nach §9 „Didaktik und Begriffe“ unverändert bleiben und (4) das
  README der Plattform die Abweichung in einem Abschnitt „Gestaltung und Verbund“ begründet und auf das Designsystem
  verweist (Datei mit Farb-Tokens und geprüften Kontrastwerten).
```

*Begründung:* Bisher war der Portal-Link nur SOLL – für die Orientierung im Verbund ist er aber wichtiger als die
Hausfarben. Barrierefreiheit wird verbindlich, die Farbwahl wird frei, aber begründungspflichtig. Bestehende
Plattformen (Algo Quest, Hausfarben + Portal-Link + 44 px) erfüllen die neue Fassung ohne Änderung.

---

## Teil E – Gemeinsamer Kern (§13.3)

### E.1 §13 Empfohlenes Vorgehen, Punkt 3

**bisher:**

```
3. **Gemeinsamer Kern:** Sicherheit, Sitzungen, SSO-Client, Prüfer, Renderer, Interaktionen und Aufgabenansicht sind
   auf allen Plattformen gleich. Spätestens mit der zweiten Plattform SOLL dieser Kern in ein eigenes Repository
   (z. B. `lab-kern`, als Git-Abhängigkeit) ausgelagert werden – sonst laufen mehrere Kopien auseinander.
```

**neu:**

```
3. **Gemeinsamer Kern:** Sicherheit, Sitzungen, SSO-Client, Prüfer, Renderer, Interaktionen und Aufgabenansicht sind
   auf allen Plattformen gleich. Spätestens mit der zweiten Plattform SOLL dieser Kern in ein eigenes Repository
   (z. B. `lab-kern`, als Git-Abhängigkeit) ausgelagert werden – sonst laufen mehrere Kopien auseinander.
   **Stand (Oktober 2026):** Der Kern liegt in drei Fassungen vor (Algo Quest als Original, AutomatenLab und Kryptos);
   die Auslagerung ist noch nicht erfolgt. **Gemeinsames Vorgehen bis dahin:**
   a) **Naht-Regel:** Fachspezifischer Code liegt in eigenen Ordnern (z. B. `src/<fach>/`, `public/static/js/<fach>/`);
      Kerndateien werden nur über **Erweiterungsstellen** (Registries für Blocktypen, Interaktionen, Normalisierungen,
      Validator-Prüfungen, Abzeichen; Optionen für Sichtbarkeit/Rangrelevanz) ergänzt.
   b) **Abweichungsprotokoll:** Jede Plattform führt `docs/KERN_ABWEICHUNGEN.md` (Datei · Änderung · Grund · Art ·
      rückführbar ja/nein) und nennt darin die Basisversion des Kerns.
   c) **Verbund-Code** (SSO-Empfänger, Verbund-API, Konten nach `sub`, Wartung) wird als Kern-Kandidat in einem
      eigenen Ordner (z. B. `src/verbund/`) gehalten; `src/jwt.js` und `scripts/vertrag_pruefen.js` bleiben
      byte-gleich zur Fassung in diesem Repository (Test in jeder Plattform).
   d) **Auslagerung in drei Schritten:** (1) Erweiterungsstellen aus der jüngsten Plattform in Algo Quest
      zurückführen (ohne Verhaltensänderung, Tests grün); (2) Repository `lab-kern` mit genau diesen Dateien und
      eigener Testsuite (Fixture-Welt mit allen Kern-Interaktionen), Versionierung nach SemVer, Einbindung als
      Git-Abhängigkeit mit fester Version; (3) Plattformen stellen nacheinander um, ihre `KERN_ABWEICHUNGEN.md` muss
      danach leer sein oder nur noch Einträge der Art „fachlich“ enthalten.
   e) **Zeitpunkt:** Schritt (1) beginnt, sobald Kryptos 1.0 läuft; vor dem Start einer vierten Plattform SOLL
      `lab-kern` 1.0 vorliegen.
```

---

## Teil F – `scripts/vertrag_pruefen.js` (maßgebliche Fassung im Portal-Repo)

Die Prüfung der neuen **optionalen** Felder ist rückwärtskompatibel (fehlen sie, ändert sich nichts).

**bisher:**

```js
  if (!Array.isArray(m.faehigkeiten)) f.push('faehigkeiten: Liste fehlt (z. B. "gast", "themen", "lehrkraft-materialien").');
  else if (!m.faehigkeiten.includes('gast')) f.push('faehigkeiten: "gast" ist Pflicht (Gastmodus /gast).');
  return f;
```

**neu:**

```js
  if (!Array.isArray(m.faehigkeiten)) f.push('faehigkeiten: Liste fehlt (z. B. "gast", "themen", "lehrkraft-materialien").');
  else {
    if (!m.faehigkeiten.includes('gast')) f.push('faehigkeiten: "gast" ist Pflicht (Gastmodus /gast).');
    if (m.faehigkeiten.some((x) => typeof x !== 'string' || !/^[a-z][a-z0-9-]{1,30}$/.test(x))) f.push('faehigkeiten: nur Kennungen aus a–z, 0–9, „-“ (§7.1).');
  }
  if (m.niveaus !== undefined) {
    if (!Array.isArray(m.niveaus) || !m.niveaus.length || m.niveaus.some((x) => !['eA', 'gA'].includes(x)) || new Set(m.niveaus).size !== m.niveaus.length) {
      f.push('niveaus: Liste aus "eA" und/oder "gA" (ab v1.2).');
    } else if (!(Array.isArray(m.faehigkeiten) && m.faehigkeiten.includes('niveau'))) {
      f.push('niveaus angegeben, aber Fähigkeit "niveau" fehlt (§7.1).');
    }
    if (text(m.vertrag) && /^1\.[01]$/.test(m.vertrag)) f.push('niveaus: erst ab Vertrag 1.2 – "vertrag" anheben.');
  }
  return f;
```

Neu exportiert (für die Portal-Seite der Kursübersicht und Plattform-Tests):

```js
/** Prüft eine Kursübersicht (§6). niveauPflicht = Manifest meldet niveaus. Liefert Fehlerliste. */
function pruefeKursuebersicht(u, { niveauPflicht = false } = {}) {
  const f = [];
  if (!u || typeof u !== 'object') return ['Kursübersicht ist kein JSON-Objekt.'];
  if (typeof u.kurs !== 'string' || !/^k:\d+$/.test(u.kurs)) f.push('kurs: Kurs-ID fehlt.');
  if (!Array.isArray(u.schueler)) f.push('schueler: Liste fehlt.');
  else for (const s of u.schueler) if (!/^s:\d+$/.test(s.sub) || !(s.anteil >= 0 && s.anteil <= 1)) f.push('schueler: sub/anteil ungültig.');
  if (!Array.isArray(u.welten)) f.push('welten: Liste fehlt.');
  if (u.niveau !== undefined && !['eA', 'gA'].includes(u.niveau)) f.push('niveau: "eA" oder "gA".');
  if (niveauPflicht && u.niveau === undefined) f.push('niveau: Pflicht für Plattformen mit niveaus im Manifest.');
  return f;
}
module.exports = { pruefeManifest, pruefeKursuebersicht, VERTRAG_HAUPTVERSION };
```

---

## Teil G – `docs/INTEGRATION.md` (Ergänzungen)

1. **§2 Manifest ergänzen:** Absatz „Niveau (ab v1.2, KANN): `niveaus: ['eA', 'gA']` und Fähigkeit `niveau` melden;
   dann trägt die Kursübersicht `niveau` und `anteil` bezieht sich nur auf die Inhalte dieses Niveaus.“
2. **§4 Kursübersicht:** Beispiel um `"niveau": "gA"` ergänzen (mit dem Hinweis „nur bei Plattformen mit `niveaus`“).
3. **§4 neu „Ausgetauschte Inhalte“:** Verweis auf VERTRAG §10 und die Pflicht, sie in `loeschen` einzuschließen.
4. **§5 Testfälle – neue Zeilen:**

| Fall | Erwartung |
|---|---|
| Manifest mit `niveaus` | `pruefeManifest` leer; Fähigkeit `niveau` vorhanden; `vertrag` ≥ 1.2 |
| Kursübersicht einer Plattform mit `niveaus` | enthält `niveau`; `pruefeKursuebersicht(u, { niveauPflicht: true })` leer |
| Ausgetauschte Inhalte: Eingabe außerhalb der Whitelist | 400 |
| Ausgetauschte Inhalte: Abruf aus einem fremden Kurs | 404 |
| `loeschen {sub}` nach Beiträgen im Funkraum/in der Arena | Beiträge und Versuche des Kontos entfernt |
| Löschfrist (Uhr + 24 h bzw. + 30 Tage nach Abschluss) | Inhalte entfernt |

5. **Test-Plattform** (`test/testplattform/app.js`): Option `niveaus` (Manifest + `niveau` in der Übersicht), damit das
   Portal die Anzeige testen kann; `test/vertrag.test.js` um `pruefeKursuebersicht` ergänzen.
6. **Portal (Kann, nicht Vertragsinhalt):** In der Kursübersicht des Portals das Niveau neben dem Plattformnamen
   anzeigen („Kryptos · gA“) und Anteile von Plattformen mit unterschiedlichem Niveau nicht ohne Kennzeichnung
   gegenüberstellen.

---

## Teil H – §14 Änderungen am Vertrag (neue Zeile)

**neu (Zeile anhängen):**

```
| 1.2 | 2026-10 | Niveau gA/eA: Begriff (§2), optionales Manifest-Feld `niveaus` (§7) und Feld `niveau` in der Kursübersicht mit niveau-bezogenem `anteil` (§6); Verzeichnis der Fähigkeiten §7.1 (neu: `labor`, `funkraum`, `arena`, `niveau`); Regeln für zwischen Konten ausgetauschte Inhalte (Kurs­grenze, Whitelist, Ausblenden, Löschfristen 24 h/30 Tage, Einschluss in die Löschung §6) mit Testfällen (§10, §6, §12); Oberfläche: Portal-Link, Touch-Ziele, Kontraste MUSS, eigenes Designsystem mit Begründung im README erlaubt (§9); Stand und Vorgehen gemeinsamer Kern (§13.3); `vertrag_pruefen.js`: Prüfung `niveaus`/`faehigkeiten`, neu `pruefeKursuebersicht` |
```

---

## Offene Fragen an die Lehrkraft (vor Annahme)

1. **Löschfrist Arena 30 Tage** nach Abschluss – passt das, oder lieber „mit Ende des Schulhalbjahres“ bzw. kürzer?
2. **Portal kennt das Niveau nicht:** Soll das Portal künftig beim Kurs „LK/GK“ führen und per `kurs-aendern`
   (`{ "niveau": "gA" }`) an Plattformen geben? (Bewusst **nicht** Teil von v1.2 – erst bei Bedarf als v1.3.)
3. **Portal-Link als MUSS** (Teil D) betrifft auch das AutomatenLab – ist das dort erfüllt bzw. vertretbar?
4. **Zeitpunkt `lab-kern`** (Teil E e): nach Kryptos 1.0 – einverstanden?
