# Code Conventions — bewertung-app

> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin.** Die Leads
> liefern Vorschläge über `notes_for_conventions` im Handoff.
>
> Zweck: Ordnerstruktur und Namenskonventionen stehen **einmal**
> beschrieben, statt von jedem Lead und jedem gespawnten Subagent neu aus
> dem Repo erraten zu werden. Gerade die Subagents sehen nur ihr
> Sub-Handoff — ohne diese Datei haben ausgerechnet sie die geringste
> Kenntnis der Projektkonventionen.
>
> Kompakt halten (Faustregel: < 120 Zeilen). Hier steht nur die **Regel**;
> die Begründung gehört ins ADR.

**Stand: noch nicht befüllt.** Das Repo enthält noch keinen Code. Der
`architekt` legt die Konventionen im Modus `vorgegeben` fest — Grundlage ist
die Greenfield-Referenzstruktur des `agent-team`-Plugins
(`context-templates/greenfield-structure.md`) — und begründet Abweichungen
im ADR.

- **Modus**: `analysiert` (aus bestehendem Code abgeleitet) | `vorgegeben`
  (Greenfield, per ADR-NNNN festgelegt)
- **Zuletzt geprüft**: YYYY-MM-DD

## Frontend

### Ordnerstruktur

~~~
<z.B.
src/app/
  <feature>/
    components/<component-name>/   # je Komponente ein Ordner
    store/                         # NgRx: actions, reducer, effects, selectors
    <feature>.facade.ts
  shared/                          # nur wirklich feature-übergreifend
>
~~~

### Namenskonventionen

- Dateien: `<z.B. kebab-case mit Typ-Suffix: .component.ts / .facade.ts / .effects.ts>`
- Klassen/Symbole: `<z.B. PascalCase mit Typ-Suffix>`
- Tests: `<z.B. *.spec.ts direkt neben der getesteten Datei>`

### Wo was hingehört

- Neue Komponente: `<Pfadregel>`
- Neuer State/Store: `<Pfadregel>`
- Geteiltes UI-Element: `<Pfadregel — und ab wann etwas nach shared/ darf>`

## Backend

### Service-/Modul-Layout

~~~
<z.B.
services/<service-name>/
  src/api/          # HTTP-Handler, keine Geschäftslogik
  src/domain/       # Geschäftslogik, frei von Framework-Imports
  src/infra/        # DB, Messaging, externe Clients
  migrations/
>
~~~

### Namenskonventionen

- Dateien/Pakete: `<...>`
- Endpunkte: `<z.B. /api/v1/<ressource> im Plural, kebab-case>`
- Events: `<z.B. <context>.<ressource>.<vergangenheitsform>>`

### Wo was hingehört

- Neuer Endpunkt: `<Pfadregel>`
- Neues Event: `<Pfadregel>`
- Neue Migration: `<Pfadregel + Tooling, mit dem sie erzeugt wird>`

## Abweichungen

Stellen im Repo, die bewusst von obigen Regeln abweichen — hier aufgeführt,
damit sie nicht bei nächster Gelegenheit „korrigiert" werden.

- `<Pfad>`: `<warum das so bleibt>`
