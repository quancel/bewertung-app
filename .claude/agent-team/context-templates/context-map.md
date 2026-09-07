# Context Map (Template)

> Diese Datei ist eine **Vorlage**. Kopiere sie ins Ziel-Repo nach
> `.claude/context/context-map.md` und fülle sie dort mit den echten
> Bounded Contexts des Projekts. Der `architekt`-Agent liest/schreibt diese
> Datei ausschließlich im Ziel-Repo, nicht in diesem Plugin.
>
> Single-Writer: Nur der `architekt`-Agent aktualisiert diese Datei.
> Andere Agents lesen sie nur.

Halte diese Datei kompakt (Faustregel: < 100 Zeilen). Sie ist ein Register,
kein Design-Dokument — Details gehören in ADRs.

## Bounded Contexts

| Context      | Repo/Service      | Zuständigkeit (1 Satz)                        | Owner-Team |
|--------------|--------------------|-------------------------------------------------|------------|
| `<name>`     | `<repo-oder-service>` | `<wofür dieser Context verantwortlich ist>`   | `<team>`   |

## Schnittstellen zwischen Contexts

Nur die Beziehungen, die für Routing-Entscheidungen relevant sind — kein
vollständiges Sequenzdiagramm.

- `<context-a>` → `<context-b>`: `<Art der Abhängigkeit, z.B. "sync REST", "async Event X">`

## Bekannte Grenzen / bewusst nicht geteilt

- `<z.B. "kein direkter DB-Zugriff zwischen context-a und context-b, nur über Event Y">`
