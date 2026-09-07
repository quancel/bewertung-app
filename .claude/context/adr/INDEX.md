# ADR-Index — bewertung-app

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

**Stand: noch keine ADRs.** Das erste entsteht voraussichtlich mit der
Greenfield-Struktur (`code-conventions.md`, Modus `vorgegeben`).

| ADR | Titel | Bounded Context | Status | Datum |
|-----|-------|-----------------|--------|-------|
| —   | —     | —               | —      | —     |

**Status-Werte** wörtlich wie im ADR selbst: `proposed` · `accepted` ·
`superseded by ADR-NNNN`.

**Mehrere Contexts** in einer Zeile kommagetrennt — cross-context ADRs sind
genau die, die man beim Filtern nicht übersehen darf.

Neue ADRs nach dem Muster in [`0000-template.md`](0000-template.md) als
`NNNN-titel-in-kebab-case.md` anlegen.
