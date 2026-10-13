# Schriften (selbst gehostet)

Alle Schriften stehen unter der **SIL Open Font License 1.1 (OFL)**. Die Lizenztexte liegen unverändert (Copyright-Zeile
und vollständiger OFL-Text aus der `LICENSE`-Datei des jeweiligen Pakets) in `LIZENZEN/OFL-<Familie>.txt`. Keine der
Lizenzen nennt einen „Reserved Font Name“; die Teilmengen behalten ihre Namen und Copyright-Einträge (`name`-Tabelle).
Die Schriften werden nur mit der Plattform ausgeliefert, nicht einzeln verkauft (OFL §1).

Bezug: ausschließlich aus der npm-Registry per `npm pack` (keine Abhängigkeit in `package.json`), Teilmengen mit
`fontTools.subset` über `werkzeuge/schriften_bauen.py`, Prüfung mit `werkzeuge/schriften_pruefen.py` (TECHNIK §11.4).

| Datei | Paket@Version | Quelldatei im Paket | Unicode-Bereich | Lizenz |
|---|---|---|---|---|
| `Fraunces-Variable.woff2` | `@fontsource-variable/fraunces@5.3.0` | `files/fraunces-latin-opsz-normal.woff2` (Achsen `opsz`, `wght` 100–900) | LATEIN | OFL 1.1, `LIZENZEN/OFL-Fraunces.txt` |
| `AtkinsonHyperlegible-Regular.woff2` | `@fontsource/atkinson-hyperlegible@5.3.0` | `files/atkinson-hyperlegible-latin-400-normal.woff2` | LATEIN | OFL 1.1, `LIZENZEN/OFL-AtkinsonHyperlegible.txt` |
| `AtkinsonHyperlegible-Bold.woff2` | `@fontsource/atkinson-hyperlegible@5.3.0` | `files/atkinson-hyperlegible-latin-700-normal.woff2` | LATEIN | OFL 1.1, `LIZENZEN/OFL-AtkinsonHyperlegible.txt` |
| `JetBrainsMono-Regular.woff2` | `@fontsource/jetbrains-mono@5.3.0` | `files/jetbrains-mono-latin-400-normal.woff2` (ohne `calt`, `liga`, `dlig`) | LATEIN | OFL 1.1, `LIZENZEN/OFL-JetBrainsMono.txt` |
| `JetBrainsMono-Bold.woff2` | `@fontsource/jetbrains-mono@5.3.0` | `files/jetbrains-mono-latin-700-normal.woff2` (ohne `calt`, `liga`, `dlig`) | LATEIN | OFL 1.1, `LIZENZEN/OFL-JetBrainsMono.txt` |
| `NotoSansMath-Symbole.woff2` | `@fontsource/noto-sans-math@5.3.0` | `files/noto-sans-math-latin-400-normal.woff2` | `U+2190-2193, U+21D2, U+21D4, U+2260-2261, U+2264-2265, U+2295, U+03C6, U+2605, U+2713` (← ↑ → ↓ ⇒ ⇔ ≠ ≡ ≤ ≥ ⊕ φ ★ ✓) | OFL 1.1, `LIZENZEN/OFL-NotoSansMath.txt` |
| `NotoSansSymbols2-Symbole.woff2` | `@fontsource/noto-sans-symbols-2@5.3.0` | `files/noto-sans-symbols-2-symbols-400-normal.woff2` | `U+2717-2718` (✗ ✘) | OFL 1.1, `LIZENZEN/OFL-NotoSansSymbols2.txt` |

LATEIN = `U+0020-007E, U+00A0-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2013-2014, U+2018-201A,
U+201C-201E, U+2022, U+2026, U+2039-203A, U+20AC, U+2122, U+2212` (Latin, Latin-1 mit ä ö ü ß, · – „“ ‚‘ … €).

Die beiden Noto-Teilmengen bilden die Familie **„KR Symbole“** (`schriften.css`, je mit `unicode-range`); sie steht in
jedem Schriftstapel direkt hinter der Hausschrift, weil keine der drei Hausschriften ⊕ ★ ✓ ✗ enthält (Fraunces und
Atkinson auch ← → ≡ φ nicht). JetBrains Mono ohne Programmier-Ligaturen: In Java-Code soll `!=` stehen, nicht ≠
(zusätzlich `font-variant-ligatures: none` in `basis.css`).

## Neu bauen

Die Pakete sind Daten aus dem Netz: nur entpacken und lesen, nichts darin ausführen. Ordner im Scratchpad, nicht im Repo.

```bash
S=<scratchpad>/fontpack
mkdir -p "$S" && cd "$S"
for p in @fontsource-variable/fraunces@5.3.0 @fontsource/atkinson-hyperlegible@5.3.0 @fontsource/jetbrains-mono@5.3.0 \
         @fontsource/noto-sans-math@5.3.0 @fontsource/noto-sans-symbols-2@5.3.0; do npm pack "$p" --silent; done
for t in *.tgz; do mkdir -p "${t%.tgz}" && tar xzf "$t" -C "${t%.tgz}"; done
pip install fonttools brotli
cd <repo> && python3 -I werkzeuge/schriften_bauen.py --quelle "$S"
python3 -I werkzeuge/schriften_pruefen.py
```

`schriften_pruefen.py` prüft je Rolle (Überschrift = Fraunces, Text = Atkinson Regular und Bold, Mono = JetBrains Mono
Regular und Bold) Latin-1 vollständig und die Sonderzeichen `⊕←→≡≠≤≥·–„“φ★✓✗` in „Hausschrift ∪ KR Symbole“ sowie je
Datei die Lizenzdatei; die CI führt es im Job `inhalte` aus.
