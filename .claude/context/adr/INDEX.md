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

**Stand: 2026-09-08** — drei ADRs, entstanden beim Einordnen des ersten
Arbeitspakets (PO-2026-09-07-010).

| ADR | Titel | Bounded Context | Status | Datum |
|-----|-------|-----------------|--------|-------|
| [0001](0001-kein-eigener-backend-dienst.md) | Kein eigener Backend-Dienst — rein clientseitige Vue-Anwendung | app-shell, orte, bewertungen, tags, medien, karte, datensicherung | accepted | 2026-09-08 |
| [0002](0002-projektstruktur-vue-spa.md) | Projektstruktur und Benennung für ein Vue-SPA (Abweichung von der Greenfield-Referenz) | app-shell (projektweit) | accepted | 2026-09-08 |
| [0003](0003-versioniertes-datenformat-und-migrationskette.md) | Versioniertes lokales Datenformat mit vorwärtsgerichteter Migrationskette | orte, bewertungen, tags, medien, datensicherung, app-shell | accepted | 2026-09-08 |

**Status-Werte** wörtlich wie im ADR selbst: `proposed` · `accepted` ·
`superseded by ADR-NNNN`.

**Mehrere Contexts** in einer Zeile kommagetrennt — cross-context ADRs sind
genau die, die man beim Filtern nicht übersehen darf.

Neue ADRs nach dem Muster in [`0000-template.md`](0000-template.md) als
`NNNN-titel-in-kebab-case.md` anlegen.
