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

**Stand: 2026-09-13** — sechsundzwanzig ADRs. **0026** ist nach der Umsetzung
von PO-2026-09-12-005 entstanden: Der `frontend-lead` hat gemeldet, dass
ADR-0025 Punkt 3 („die Kennung wird nie zurückgenommen") mit
Akzeptanzkriterium 8 desselben Pakets kollidiert, weil `Ortebereich.vue` beim
Schließen nicht unmountet. Kein `superseded by` — **Präzisierung** eines
Punktes wie bei ADR-0021/0022, beide ADRs bleiben `accepted`; ADR-0025 trägt
den Verweis im Kopf. 0023–0025 beim Einordnen der
**Korrekturrunde vom 2026-09-12** (PO-2026-09-12-001 bis -005, Befunde aus
echter Nutzung auf einem iPhone): 0023 zu den Verifikationsebenen (Anlass:
der Datenverlust aus -001 kam durch 224 grüne Tests), 0024 zur Reichweite
einer projektweiten Interaktionsregel über Context-Grenzen (-003), 0025 zum
Zustand über die Komponentengrenze im Ortsdetail (-005). **0023 Punkt 5 ist
noch am selben Tag neu gefasst worden**, nachdem der Nutzer die zugehörige
`user_question` anders entschieden hat als der Architekt angenommen hatte
(kein WebKit im Rauchtest statt Engine-Liste); der frühere Entwurf steht im
Abschnitt „Revision" — kein `superseded by`, er war nie in Kraft. **Kein ADR**
bekommen
hat PO-2026-09-12-002 (gestapelte Koordinatenfelder): ADR-0012 ist davon nicht
berührt und die Ursache — fehlendes `min-width: 0` — steht dort bereits als
Punkt 4.

0022 ist in der **Nachpflege
nach der Abnahme** entstanden (Präzisierung von ADR-0013). Bei derselben
Nachpflege wurde die **Begründung** zu ADR-0011 Punkt 4 korrigiert — die
Entscheidung selbst ist unverändert, deshalb kein `superseded by`; die alte
Fassung steht im Abschnitt „Korrektur" des ADR. 0019 und 0020 wurden am
2026-09-11 **inhaltlich ersetzt**, nachdem der Nutzer die zugehörigen
`user_questions` anders entschieden hat als der Architekt angenommen hatte;
beide tragen den früheren Entwurf im Abschnitt „Revision" (kein
`superseded by`: die Entwürfe waren nie in Kraft, es existierte kein Code
dagegen). 0018 ist an Punkt 6 präzisiert. 0001–0003 beim Einordnen von
PO-2026-09-07-010, 0004–0006 beim Einordnen von PO-2026-09-07-001
(Gerätespeicher), 0007–0008 beim Einordnen von PO-2026-09-07-002 (erste
Formaterweiterung), 0009 beim Einordnen von PO-2026-09-07-003 (erste
Anzeigeeinstellung), 0010 beim Einordnen von PO-2026-09-07-011
(Grundnavigation), 0011–0012 beim Einordnen von PO-2026-09-07-012
(zweispaltiges Grundlayout), 0013 beim erneuten Einordnen von
PO-2026-09-07-003 (Werkzeugleiste), 0014 beim Einordnen von
PO-2026-09-07-004 (zweite Formaterweiterung), 0015 beim Einordnen von
PO-2026-09-07-007 (Offline-Auslieferung), 0016 beim Einordnen von
PO-2026-09-07-005 (Bilder), 0017 beim Einordnen von PO-2026-09-07-009
(Export/Import) sowie 0018–0021 beim Einordnen von PO-2026-09-07-006
(Kartenansicht) und PO-2026-09-07-008 (Ortssuche).

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
| [0015](0015-offline-auslieferung-service-worker.md) | Offline-Auslieferung über einen generierten Service Worker; Update im Prompt-Modus | app-shell | accepted | 2026-09-10 |
| [0016](0016-bilder-eigener-store-und-einbindung.md) | Bilder — eigener Object Store ohne Rückverweis im Ort, Verkleinerung beim Hinzufügen, Einbindung ins Ortsdetail | medien, orte, datensicherung, app-shell | accepted | 2026-09-10 |
| [0017](0017-export-import-container-und-zusammenfuehrung.md) | Export-/Import-Container, Zusammenführungsregeln und der Bereich Daten | datensicherung, orte, medien, app-shell | accepted | 2026-09-10 |
| [0018](0018-kartenbibliothek-und-tile-anbieter.md) | Kartenbibliothek Leaflet, OSM-Rasterkacheln als einziger Fremd-Host der Karte | karte, app-shell | accepted | 2026-09-10 |
| [0019](0019-zuschnitt-des-bereichs-karte.md) | Die Karte ist eine zweite Ansicht des Bereichs Orte — Umschalter in der Werkzeugleiste, Adresse über den Query-Parameter `ansicht` | karte, orte, app-shell | accepted | 2026-09-11 |
| [0020](0020-ortssuche-anbieter-und-abfragemodell.md) | Ortssuche — Photon als Geocoder, Suche beim Tippen, im Context `orte` statt `karte` | orte, karte, app-shell | accepted | 2026-09-11 |
| [0021](0021-netzzustand-im-ui.md) | Netzzustand im UI — erlaubt an der netzabhängigen Bedienstelle, verboten in der Auslieferungsmechanik (Präzisierung von ADR-0015 Punkt 6) | app-shell, karte, orte | accepted | 2026-09-10 |
| [0022](0022-reine-lib-funktionen-ueber-context-grenzen.md) | Reine `lib`-Funktionen über Context-Grenzen (Präzisierung von ADR-0013 Punkt 2/3) | orte, karte, bewertungen, tags, medien, datensicherung | accepted | 2026-09-11 |
| [0023](0023-verifikationsebenen-vitest-und-rauchtest.md) | Verifikationsebenen — was Vitest prüft, was der Rauchtest prüft, und warum kein Browser-Test-Runner dazukommt | app-shell, orte, medien, datensicherung | accepted | 2026-09-12 |
| [0024](0024-projektweite-interaktionsregeln-in-shared.md) | Projektweite Interaktionsregeln liegen einmal in `src/shared/`, und ein Paket darf sie über die Context-Grenze hinweg anbinden | orte, tags | accepted | 2026-09-12 |
| [0025](0025-zustand-ueber-die-komponentengrenze-im-ortsdetail.md) | Zustand über die Komponentengrenze im Ortsdetail — Ortssuche meldet ihren wirksamen Zustand, die Sichtbarkeit rastet an der Ort-ID ein | orte | accepted (Punkt 3 präzisiert durch 0026) | 2026-09-12 |
| [0026](0026-lebensdauer-der-sichtbarkeits-kennung.md) | Die Sichtbarkeits-Kennung gilt für die geöffnete Detailinstanz, nicht für die Ort-ID (Präzisierung von ADR-0025 Punkt 3) | orte | accepted | 2026-09-13 |

**Status-Werte** wörtlich wie im ADR selbst: `proposed` · `accepted` ·
`superseded by ADR-NNNN`.

**Mehrere Contexts** in einer Zeile kommagetrennt — cross-context ADRs sind
genau die, die man beim Filtern nicht übersehen darf.

Neue ADRs nach dem Muster in [`0000-template.md`](0000-template.md) als
`NNNN-titel-in-kebab-case.md` anlegen.
