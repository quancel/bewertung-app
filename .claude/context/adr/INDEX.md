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

**Stand: 2026-09-09** — vierzehn ADRs. 0001–0003 beim Einordnen von
PO-2026-09-07-010, 0004–0006 beim Einordnen von PO-2026-09-07-001
(Gerätespeicher), 0007–0008 beim Einordnen von PO-2026-09-07-002 (erste
Formaterweiterung), 0009 beim Einordnen von PO-2026-09-07-003 (erste
Anzeigeeinstellung), 0010 beim Einordnen von PO-2026-09-07-011
(Grundnavigation), 0011–0012 beim Einordnen von PO-2026-09-07-012
(zweispaltiges Grundlayout), 0013 beim erneuten Einordnen von
PO-2026-09-07-003 (Werkzeugleiste) und 0014 beim Einordnen von
PO-2026-09-07-004 (zweite Formaterweiterung).

| ADR | Titel | Bounded Context | Status | Datum |
|-----|-------|-----------------|--------|-------|
| [0001](0001-kein-eigener-backend-dienst.md) | Kein eigener Backend-Dienst — rein clientseitige Vue-Anwendung | app-shell, orte, bewertungen, tags, medien, karte, datensicherung | accepted | 2026-09-08 |
| [0002](0002-projektstruktur-vue-spa.md) | Projektstruktur und Benennung für ein Vue-SPA (Abweichung von der Greenfield-Referenz) | app-shell (projektweit) | accepted | 2026-09-08 |
| [0003](0003-versioniertes-datenformat-und-migrationskette.md) | Versioniertes lokales Datenformat mit vorwärtsgerichteter Migrationskette | orte, bewertungen, tags, medien, datensicherung, app-shell | accepted | 2026-09-08 |
| [0004](0004-indexeddb-als-geraetespeicher.md) | IndexedDB als Gerätespeicher; Bestandsstruktur und Trennung von IDB-Version und SCHEMA_VERSION | orte, bewertungen, tags, medien, datensicherung, app-shell | accepted | 2026-09-08 |
| [0005](0005-schreibmodell-bei-inline-autosave.md) | Schreibmodell bei Inline-Autosave — vollständiger Datensatz aus dem Speicher, ohne Entprellung | orte, bewertungen, tags, medien, app-shell | accepted | 2026-09-08 |
| [0006](0006-anzeigeeinstellungen-getrennt-vom-bestand.md) | Anzeigeeinstellungen sind Gerätezustand, nicht Bestandsinhalt | orte, tags, datensicherung, app-shell | accepted | 2026-09-08 |
| [0007](0007-achsenwert-modell-null-statt-null.md) | Achsenwert-Modell — „nicht bewertet" ist ein ausdrücklich gespeichertes `null`, die Gesamtnote wird nie gespeichert | bewertungen, orte, datensicherung | accepted | 2026-09-08 |
| [0008](0008-feldbesitz-und-ableitungen-ueber-context-grenzen.md) | Feldbesitz und Ableitungen über Context-Grenzen im Ort-Datensatz | orte, bewertungen, tags, medien, datensicherung | accepted | 2026-09-08 |
| [0009](0009-ansichtszustand-der-ortsliste.md) | Ansichtszustand der Ortsliste gehört dem Context `orte` — und Gerätezustand darf eine Voreinstellung haben | orte, tags, datensicherung | accepted | 2026-09-08 |
| [0010](0010-app-rahmen-chrome-grenze-und-routenbesitz.md) | App-Rahmen — Grenze der Navigationschrome, Routenbesitz und eine Meldung an zwei Orten | app-shell, orte | accepted | 2026-09-08 |
| [0011](0011-master-detail-als-geteilter-baustein.md) | Master-Detail als geteilter Baustein — ein Adressraum, eine Bereichsansicht | app-shell, orte, karte | accepted | 2026-09-08 |
| [0012](0012-breitenlogik-am-container-statt-am-viewport.md) | Breitenabhängige Layouts richten sich nach ihrem Container, nicht nach dem Viewport | app-shell, orte, medien, karte, bewertungen, tags | accepted | 2026-09-08 |
| [0013](0013-fremde-bausteine-in-den-ortsansichten.md) | Fremde Bausteine in den Ortsansichten — Import-Richtung und die Slot-Naht der Werkzeugleiste | orte, bewertungen, tags, medien | accepted | 2026-09-09 |
| [0014](0014-tag-modell-abgeleitetes-vokabular.md) | Tag-Modell — Feld im Ort-Datensatz, abgeleitetes Vokabular, case-insensitive Identität | tags, orte, datensicherung | accepted | 2026-09-09 |

**Status-Werte** wörtlich wie im ADR selbst: `proposed` · `accepted` ·
`superseded by ADR-NNNN`.

**Mehrere Contexts** in einer Zeile kommagetrennt — cross-context ADRs sind
genau die, die man beim Filtern nicht übersehen darf.

Neue ADRs nach dem Muster in [`0000-template.md`](0000-template.md) als
`NNNN-titel-in-kebab-case.md` anlegen.
