# Größenbudget der Gedächtnisdateien

Gilt für die Rollen, die `.claude/context/` und `CLAUDE.md` **schreiben** (`architekt`,
`ux-ui-designer`, `design-concept`) und für die Leads, die Berichte liefern.

**Warum.** Jede Rolle und jede Sitzung lädt diese Dateien. Im Referenzprojekt war
`CLAUDE.md` auf 66 KB und `code-conventions.md` auf 60 KB gewachsen, `design-conventions.md`
auf 1641 Zeilen — obwohl dort „< 150 Zeilen" stand. Eine Regel ohne Prüfung wächst
mit jedem Paket. Jeder Aufruf zahlt diese Größe, und jede Änderung an `CLAUDE.md`
entwertet den gemeinsamen Anfang aller Aufrufe für den Prompt-Cache.

## Budget (Zeilen der Hauptdatei)

| Datei | Soll | Schreibt |
|---|---|---|
| `CLAUDE.md` | 150 | Nutzer / Leads nur nach Absprache |
| `.claude/context/context-map.md` | 100 | `architekt` |
| `.claude/context/code-conventions.md` | 120 | `architekt` |
| `.claude/context/learnings.md` | 120 | `architekt` |
| `.claude/context/design-concept.md` | 120 | `design-concept` |
| `.claude/context/design-conventions.md` | 150 | `ux-ui-designer` |

`scripts/check-context-size.py` meldet Überschreitungen (Soll) und starke Überschreitungen
(das Doppelte). Es informiert nur.

## Was bei Überschreitung gilt

Die schreibende Rolle **kuratiert vor dem nächsten Anhängen**, im Nachpflege-Modus:

1. **Details in Themendateien auslagern**: `.claude/context/<datei-ohne-endung>/<thema>.md`.
   Die Hauptdatei behält die **Regel** in einer Zeile und ein **Register** mit Verweis
   („Formulare → `design-conventions/formulare.md`"). Themendateien zählen nicht gegen
   das Budget, die Hauptdatei muss aber auf jede verweisen.
2. **Veraltetes löschen**, nicht anhängen. Erledigte Befunde, Messläufe und
   Paket-Chronik gehören nicht ins Gedächtnis.
3. **Nachweise je Paket** (Rot-Nachweise, Mutationslisten, Messwerte, Zeilennummern
   in Skripten) gehören nach `docs/pakete/<task_id>.md`, nicht in `CLAUDE.md` und
   nicht in die Konventionen. Zeilenangaben veralten mit jeder Änderung.

## Lesen: Register zuerst

Wer eine Gedächtnisdatei liest, liest die Hauptdatei und danach **nur** die Themendatei
(und das ADR), die zum Paket gehört — nicht den ganzen Ordner. ADRs über `adr/INDEX.md`.
