# ADR-Index

> Vorlage — kopiere sie ins Ziel-Repo nach `.claude/context/adr/INDEX.md`.
>
> **Single-Writer: Nur der `architekt`-Agent schreibt hierhin.** Er pflegt
> den Index bei **jedem** neuen oder abgelösten ADR mit — ein Index, der
> hinterherhinkt, ist schlimmer als keiner, weil man sich auf ihn verlässt.
>
> Zweck: `adr/` ist die einzige Kontext-Datei ohne Größendeckel — die
> Entscheidungshistorie soll vollständig bleiben. Genau deshalb darf sie
> nicht komplett gelesen werden. Der Architekt liest **diesen Index** und
> öffnet dann nur die ADRs, deren `bounded_context` zum aktuellen Paket
> passt oder die als `superseded`-Kette dazugehören.
>
> Eine Zeile pro ADR. Keine Zusammenfassung des Inhalts — der Titel muss
> reichen, um zu entscheiden, ob das ADR relevant ist.

| ADR | Titel | Bounded Context | Status | Datum |
|-----|-------|-----------------|--------|-------|
| `0001` | `<Titel wie in der ADR-Datei>` | `<context>` | `accepted` | `YYYY-MM-DD` |
| `0002` | `<...>` | `<context>` | `superseded by ADR-0007` | `YYYY-MM-DD` |

**Status-Werte** wörtlich wie im ADR selbst: `proposed` · `accepted` ·
`superseded by ADR-NNNN`.

**Mehrere Contexts** in einer Zeile kommagetrennt — cross-context ADRs sind
genau die, die man beim Filtern nicht übersehen darf.
