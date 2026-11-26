# Größenbudget der Gedächtnisdateien

Gilt für die Rollen, die `.claude/context/` und `CLAUDE.md` **schreiben** (`architekt`,
`ux-ui-designer`, `design-concept`) und für die Leads, die Berichte liefern.

**Warum.** Jede Rolle und jede Sitzung lädt diese Dateien. Im Referenzprojekt war
`CLAUDE.md` auf 66 KB und `code-conventions.md` auf 60 KB gewachsen, `design-conventions.md`
auf 1641 Zeilen — obwohl dort „< 150 Zeilen" stand. Eine Regel ohne Prüfung wächst
mit jedem Paket. Jeder Aufruf zahlt diese Größe, und jede Änderung an `CLAUDE.md`
entwertet den gemeinsamen Anfang aller Aufrufe für den Prompt-Cache.

## Budget — zwei Arten

**Hart: `CLAUDE.md`, 150 Zeilen.** Der Harness lädt sie vollständig bei jeder Sitzung und
jedem Subagent; selektives Lesen gibt es dort nicht. Jede Zeile wird immer bezahlt.

**Richtwert: Dateien unter `.claude/context/`, ca. 12 KB je Hauptdatei.** Sie werden nicht
automatisch geladen, sondern von den Rollen gelesen. Entscheidend ist deshalb nicht die
Gesamtgröße, sondern **was ein Aufruf tatsächlich liest**: Ist jede Themendatei im
Register der Hauptdatei verlinkt und liest die Rolle nur, was zum Paket gehört, kostet ein
großes Gesamtvolumen nichts. Gemessen wird in KB, weil Zeilen unterschiedlich lang sind.

| Datei | Maß | Wert | Schreibt |
|---|---|---|---|
| `CLAUDE.md` | Zeilen, **hart** | 150 | Nutzer / Leads nur nach Absprache |
| `.claude/context/*.md` (Hauptdatei) | KB, Richtwert | 12 | die jeweilige schreibende Rolle |

`scripts/check-context-size.py` meldet: für `CLAUDE.md` **WARNUNG** über 150 und
**DRINGEND** über 300 Zeilen; für die Dateien unter `.claude/context/` **HINWEIS** über
12 KB und **WARNUNG** über 24 KB. Außerdem **WARNUNG**, wenn eine Themendatei in der
Hauptdatei nicht verlinkt ist — das **Register ist Pflicht**, es macht den Richtwert
erst tragfähig. Das Skript informiert nur.

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
