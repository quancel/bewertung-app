# <Projektname> (Vorlage für eine schlanke CLAUDE.md)

> Vorlage — nach `CLAUDE.md` im Ziel-Repo kopieren und füllen. **Budget: 150 Zeilen**
> (`rules/CONTEXT_BUDGET.md`). Diese Datei lädt **jede** Sitzung und **jeder** Subagent;
> jede Änderung entwertet den Prompt-Cache für alle Aufrufe. Sie ist eine **Landkarte**:
> Regeln, Befehle, Verweise. Keine Berichte, keine Paket-Chronik.

## Was das ist
<Zwei Sätze: Produkt, Zielgruppe, Stand.>

## Arbeitsweise
Feature-Arbeit startet mit `/orchestrate <Beschreibung>`. Nur die Leads schreiben Code.
Regelwerk: `.claude/agent-team/rules/`. Projektgedächtnis: `.claude/context/`
(eine schreibende Rolle je Datei).

## Befehle
| Zweck | Befehl |
|---|---|
| Installieren | `<…>` |
| Entwickeln | `<…>` |
| Typecheck / Lint / Test | `<…>` |
| Build | `<…>` |
| Rauchtest | `<…>` (Optionen: `--only <ansicht>`) |

## Auslieferung
<Wohin, wodurch ausgelöst, was manuell eingestellt sein muss. Max. 8 Zeilen.>

## Wohin was gehört (damit diese Datei klein bleibt)
- **Entscheidungen** → `.claude/context/adr/` · **Konventionen** → `code-conventions.md`
- **Nachweise je Paket** (Rot-Nachweise, Mutationslisten, Messwerte, Befunde) →
  `docs/pakete/<task_id>.md`. Hier steht höchstens ein Verweis.
- **Zeilennummern in Skripten gehören nie hierher**: sie veralten mit jeder Änderung.
- Neue Prüfungen im Rauchtest: Eigenschaft in einem Satz hier, Details in `docs/`.
