# Analysen und Verifikation

Arbeitsgrundlagen der Planung (Cowork, 12.10.2026). Nur lesen; nicht Teil der Plattform.

| Datei | Inhalt |
|---|---|
| `abitur_eA.md`, `abitur_gA.md` | Auswertung aller Abituraufgaben Kryptologie 2021–2026 (Operatoren, Verfahren, Formate, Fallen). Hinweis: Die Bearbeitungszeit eA beträgt nach EB-AVO 2025 270 min (im Bericht noch 300 min). |
| `kc_eh_operatoren.md` | KC 2017, Ergänzende Hinweise 2025, Operatorenliste, Abgleich mit den Inhalten |
| `material_lehrkraft.md` | Sichtung des bisherigen Unterrichtsmaterials (P01–P07, AB01–AB06 u. a.) mit Fehlerliste → `docs/FACHLICHE_KORREKTUREN.md` |
| `algoquest_bausteine.md` | Was aus AlgoQuest übernommen wird (Kern, Muster, Tests) |
| `verifikation.md` | Unabhängige Nachrechnung des Pakets (739 Prüfungen); alle Befunde sind in `docs/FACHLICHE_KORREKTUREN.md` Teil B abgearbeitet |
| `verifikation/` | Prüfskripte dieser Verifikation: `kv.py` (eigene Referenzimplementierungen), `w0a.py` … `w6*.py`, `nk.py`, `k16.py`, `chk.py` (Protokoll), `log.jsonl` (739 Einträge). Grundlage für Plan Task 18 (`quellen/pruefwerte/`). `pdfwerte.py`, `schueler.py` und `videos.py` enthalten absolute Pfade der Cowork-Umgebung und müssen vor einer Wiederverwendung angepasst werden. Stand der Werte: **vor** den Korrekturen aus Teil B (z. B. W6-B-15, NK gA f, Abi-Check W3·4). |
