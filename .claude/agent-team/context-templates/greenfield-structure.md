# Referenzstruktur für neue Projekte (Greenfield-Default)

> **Diese Datei wird nicht ins Ziel-Repo kopiert.** Sie ist die Quelle, aus
> der der `architekt` schöpft, wenn er `code-conventions.md` im Modus
> `vorgegeben` anlegt — also bei einem neuen oder noch leeren Projekt. Er
> überträgt die passenden Teile in die Instanzdatei des Ziel-Repos und passt
> sie an; diese Referenz bleibt unverändert im Plugin.
>
> **Bei einem bestehenden Projekt ist sie irrelevant.** Dort gilt Modus
> `analysiert`: Was im Repo tatsächlich existiert, gewinnt — auch wenn es
> von dieser Referenz abweicht. Diese Struktur wird niemals einem
> bestehenden Projekt übergestülpt.
>
> Sie ist eine **Setzung, keine Wahrheit**: Ein Default, damit über Projekte
> hinweg Einheitlichkeit entsteht, statt dass bei jedem Greenfield etwas
> Neues erfunden wird. Wenn ein Projekt gute Gründe für etwas anderes hat,
> gewinnen die Gründe — dann aber bewusst und im ADR festgehalten.

## Frontend (Angular / NgRx)

~~~
src/
  app/
    core/                            # einmalig instanziiert: Interceptors, Guards,
                                     #   app-weite Services. Kein Feature-Code.
    shared/
      ui/<component-name>/           # wiederverwendbare, zustandslose Bausteine
      pipes/ · directives/
    features/
      <feature>/
        components/<component-name>/ # präsentational, kennt den Store nicht
        containers/<container-name>/ # an die Facade angebunden
        store/
          <feature>.actions.ts
          <feature>.reducer.ts
          <feature>.effects.ts
          <feature>.selectors.ts
        <feature>.facade.ts          # einzige Brücke zwischen UI und Store
        <feature>.routes.ts
        models/
    app.routes.ts
  styles/
    _tokens.scss                     # Design-Tokens gemäß design-concept.md
~~~

**Regeln, die die Struktur tragen** — ohne sie ist die Ordnerliste wertlos:

- Komponenten greifen **nie** direkt auf den Store zu, nur über die Facade
  des Features. Das hält den State-Umbau lokal.
- Ein Feature importiert **nicht** aus einem anderen Feature. Austausch läuft
  über den Store oder über Routen-Parameter.
- Nach `shared/` darf etwas erst, wenn es von **mindestens zwei** Features
  genutzt wird — nicht vorsorglich.
- `core/` enthält nur Dinge, die genau einmal existieren. Alles andere ist
  Feature oder Shared.

**Benennung**

- Dateien: kebab-case mit Typ-Suffix (`discount-code.component.ts`,
  `cart.facade.ts`, `cart.effects.ts`)
- Klassen/Symbole: PascalCase mit demselben Suffix (`CartFacade`)
- Tests: `*.spec.ts` direkt neben der getesteten Datei

## Backend (Microservices)

~~~
services/
  <service-name>/
    src/
      api/          # HTTP-Handler/Controller: Transport, Validierung, Mapping.
                    #   Keine Geschäftslogik.
      domain/       # Geschäftslogik und Modelle. Frei von Framework- und
                    #   DB-Imports.
      infra/        # Repositories, Messaging, externe Clients.
      config/
    migrations/
    tests/
      unit/ · integration/
    <manifest>      # package.json | pom.xml | go.mod | pyproject.toml
libs/
  contracts/        # geteilte API-/Event-Contracts, versioniert
~~~

**Regeln, die die Struktur tragen**

- Abhängigkeitsrichtung: `api → domain ← infra`. Die Domain hängt von
  **nichts** ab. Ein Import von `infra` in `domain` ist ein Fehler, kein
  Stilfrage.
- Kein geteiltes Datenbankschema zwischen Services — Austausch über API oder
  Events.
- Nach `libs/` gehören nur echte Contracts (Payload-Typen, Event-Schemata),
  kein geteilter Geschäftscode. Geteilte Logik zwischen Services ist meist
  ein Zeichen für einen falschen Schnitt.

**Benennung**

- Endpunkte: `/api/v1/<ressource>` — Plural, kebab-case
- Events: `<context>.<ressource>.<vergangenheitsform>`, z.B.
  `checkout.discount-code.redeemed`
- Migrationen: fortlaufend mit Zeitstempel-Präfix, immer über das
  Repo-Tooling erzeugt, nie von Hand geschrieben

## Was der Architekt beim Übertragen tun muss

1. Nur die Teile übernehmen, die zum Projekt passen (ein reines
   Frontend-Projekt bekommt keinen Backend-Abschnitt).
2. Platzhalter durch die echten Namen ersetzen.
3. Modus auf `vorgegeben` setzen und das ADR verlinken.
4. Bewusste Abweichungen von dieser Referenz im ADR begründen — nicht
   stillschweigend anders machen.
