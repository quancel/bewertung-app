# ADR-0011: Master-Detail als geteilter Baustein — ein Adressraum, eine Bereichsansicht

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `app-shell`, `orte`, `karte`
- **task_id**: `PO-2026-09-07-012`
- **Korrigiert am**: 2026-09-11 — Begründung zu Punkt 4 (siehe Abschnitt
  „Korrektur"); Entscheidung unverändert
- **Präzisiert durch**: ADR-0032 (2026-09-27): Punkt 5, „an genau einer
  Stelle", schließt die wörtliche Negation derselben Bedingung in derselben
  Datei ein. Breitenabhängige Sichtbarkeit wird auf ihren Bereich begrenzt,
  statt sie zu überschreiben.
- **Präzisiert durch**: ADR-0033 (2026-09-27): Zur Schnittstelle aus
  Punkt 1 kommt eine exponierte Methode `setzeDetailVersatzZurueck()`. Den
  Versatz aus Punkt 6 setzt der Baustein zurück, die Bereichsansicht löst
  das nur aus.
- **Nachtrag zu Punkt 6**: 2026-09-28, Rückläufer PO-2026-09-27-003. Ab `lg`
  ist jede Spalte ein abgeschlossener Scroll-Bereich. Siehe Abschnitt
  „Nachtrag zu Punkt 6". Die Entscheidung bleibt unverändert, kein
  `superseded by`.

## Kontext

PO-2026-09-07-012 zeigt ab `lg` Ortsliste und Detailansicht gleichzeitig,
**ohne** eine neue Adresse einzuführen: dieselbe Detailadresse aus
PO-2026-09-07-011 wird oberhalb der Grenze anders dargestellt. Der
Adressraum ist ab PO-2026-09-07-007 offline ausgeliefert und gilt als
veröffentlicht.

Damit stellt sich die Frage, wo der Split gebaut wird. `app-shell` darf nicht
aus `features/` importieren, kennt also weder Ortsliste noch Ortsdetail. Der
Bereich Karte (PO-2026-09-07-006) soll denselben Rahmen später vorfinden,
ohne einen eigenen Split anzulegen. Und zwei getrennte Routen-Komponenten für
Liste und Detail bedeuten bei jedem Wechsel ein Aus- und Einhängen — genau
das, was die Kriterien zu Scrollposition, Auswahl und Fokus verhindern
sollen.

## Entscheidung

1. **Der Split ist ein zustandsloser Baustein in `src/shared/ui/`**
   (`MasterDetail.vue`) mit zwei Slots (`liste`, `detail`) und einem Flag
   „Detail geöffnet". Er kennt weder Orte noch Karte, hält keinen Zustand und
   spricht keinen Store an. `app-shell` liefert den Rahmen drumherum, nicht
   den Split selbst.
2. **Je Bereich genau eine Bereichsansicht.** `features/orte/views/` bekommt
   `Ortebereich.vue`; sie bindet den Store an, liest `ortId` aus der Route und
   entscheidet über den Baustein, was zu sehen ist: unterhalb `lg` Liste
   **oder** Detail, ab `lg` Liste **und** Detail.
3. **Beide bestehenden Routen-Einträge zeigen ab -012 auf diese
   Bereichsansicht.** `path` und `name` bleiben Zeichen für Zeichen wie in
   -001 angelegt (`/orte` → `orte`, `/orte/:ortId` → `ort-detail`). Es kommt
   keine Route hinzu, keine wird verschachtelt, keine entfällt. Der Wechsel
   zwischen beiden Adressen hängt dieselbe Komponente **nicht** aus:
   Scrollposition der Liste, Auswahl-Hervorhebung und Fokusführung ergeben
   sich daraus, statt nachgebaut zu werden.
4. **Die Adresse ist die einzige Quelle der Auswahl.** Es gibt keinen
   zusätzlichen „ausgewählter Ort"-Zustand neben `route.params.ortId`. Öffnen
   ist `push`, Schließen ist derselbe History-Schritt wie Browser-Zurück,
   Löschen des gewählten Ortes ist `replace` auf `/orte`.
   **Begründung (korrigiert, siehe unten):** `replace` **ersetzt** den
   History-Eintrag der gelöschten Detailadresse, statt einen weiteren
   anzuhängen. Mit `push` bliebe `/orte/:ortId` als vorheriger Eintrag
   stehen, und **Browser-Zurück** führte auf einen Ort, den es nicht mehr
   gibt — die Meldung „Adresse ohne Ziel" (ADR-0010) als Ergebnis einer
   Aktion, die der Nutzer gerade selbst ausgelöst hat.
5. **`lg` wird an genau einer Stelle ausgewertet** — in der Bereichsansicht
   bzw. im Baustein, per CSS. Der Breitenwechsel ist ein reiner
   Layoutwechsel bei gleicher Adresse: kein Navigations-Event, kein Refetch,
   kein Zurückspringen zur Liste.
6. **Ab `lg` scrollen beide Spalten selbst, unterhalb `lg` scrollt das
   Fenster.** Das `scrollBehavior` aus ADR-0010 bleibt unverändert und wirkt
   ab `lg` folgenlos, weil die Seite selbst nicht mehr scrollt. Beim Wechsel
   des gewählten Ortes beginnt die Detail-Spalte oben; die Listen-Spalte
   behält ihren Versatz.

## Konsequenzen

- Positiv: Der veröffentlichte Adressraum bleibt unangetastet — -007 muss
  nicht erneut angefasst werden.
- Positiv: -006 findet Baustein und Muster vor und baut eine
  `Kartenbereich`-Ansicht nach demselben Schnitt, ohne einen zweiten Split zu
  erfinden.
- Positiv: Vier Kriterien (Scrollposition, Auswahl-Hervorhebung bei
  Filterwechsel, Fokusrückgabe, Breitenwechsel bei offenem Detail) folgen aus
  der Struktur, statt einzeln abgesichert zu werden.
- Negativ/Trade-off: `Ortebereich.vue` ist die einzige Ansicht des Bereichs
  und wächst mit -003, -004 und -005 mit. Wird sie unübersichtlich, wird
  **innerhalb** von `features/orte/` in Komponenten geschnitten — nicht in
  eine zweite Route.
- Negativ/Trade-off: Ein Teil von -012 liegt in `features/orte/`, obwohl das
  Paket `app-shell` zugeordnet ist. Das ist gewollt: Der wiederverwendbare
  Anteil ist der Baustein, der Rest ist seine erste Anwendung. Ein Split in
  zwei Pakete hätte zwei voneinander abhängige Hälften ohne eigenen Nutzen
  erzeugt.
- Betrifft künftig: **-003/-004** bauen Werkzeugleiste und Filter in die
  Listen-Spalte (Richtwert ~400px); ein klebender Kopf klebt dort an der
  Spalte, nicht am Fenster. **-005** und **-006** liegen in der
  Detail-Spalte und folgen ADR-0012. **-009** bleibt einspaltig und benutzt
  den Baustein nicht.

## Korrektur der Begründung zu Punkt 4 (2026-09-11)

Die **Anforderung** in Punkt 4 (`replace` beim Löschen) ist unverändert
gültig und war es immer. Falsch war bis zum 2026-09-11 ihre **Begründung**:
Dort stand, ohne `replace` lande ein **Neuladen** nach dem Löschen auf
„Adresse ohne Ziel". Das trifft nicht zu — nach einem `push('/orte')` ist die
Adresszeile bereits `/orte`, ein Neuladen ist folgenlos. Der tatsächliche
Schaden ist **Browser-Zurück** auf die tote Detailadresse.

Gefunden hat das der `product-owner` bei der Abnahme (bestätigt vom
`frontend-lead`); die Stelle im Code war tatsächlich als `push` gebaut und
ist mit `dfa27ff` auf `replace` korrigiert. Kein `superseded by`: Weder die
Entscheidung noch der geforderte Code ändert sich, nur der Satz, mit dem sie
begründet ist.

## Nachtrag zu Punkt 6 (2026-09-28, Rückläufer PO-2026-09-27-003)

- **Befund**: `npm run smoke` meldet
  `desktop-1280/ortsliste-legende: Fenster scrollt ab lg (Dokument 1074px,
  Ansichtsfenster 900px)`. Ab `lg` scrollt also das Fenster, obwohl Punkt 6
  das ausschließt. Die Zusicherung (`pruefeMasterDetailSpalten`, ADR-0032
  Punkt 6) läuft seit -002. Rot wurde sie erst, als ein bestimmter Inhalt
  zufällig vorlag.
- **Gemeldete Ursache, nicht bestätigt**: Der Lead nennt den impliziten
  `min-height: auto` der Grid-Items. Für diese beiden Elemente ist das nach
  CSS Grid §6.6 nicht zu erwarten, denn sie sind selbst Scroll-Container, und
  deren automatische Mindestgröße ist 0. Der Lauf selbst spricht auch
  dagegen: `ortsliste-zonen` läuft unmittelbar davor mit **demselben** Bestand
  und meldet nichts. `pruefeScrollVersatzUndFokusBeiOrtswechsel` verlangt mit
  14 Orten als Vorbedingung, dass beide Spalten intern scrollen.
- **Zweiter Kandidat**: `.ortszeile__sr-hervorhebung` (neu in -003,
  ADR-0034 Punkt 5) ist `position: absolute` ohne positionierten Vorfahren.
  Ihr Containing Block ist deshalb der initiale Containing Block, nicht die
  Spalte. Die Spalte schneidet sie nicht ab, und ihre statische Position tief
  in der Liste verlängert das **Dokument**. Das passt zum Unterschied zwischen
  den beiden Ansichten: Nach „Gesamtnote" stehen die hervorgehobenen Zeilen
  oben (`-zonen`, grün), nach „Bezeichnung" stehen sie unten (`-legende`,
  rot). Welcher Kandidat trägt, stellt die Diagnose des Leads fest.
- **Entscheidung (normativ ist die Eigenschaft)**: Ab `lg` ist jede Spalte
  ein **abgeschlossener Scroll-Bereich**. Wie hoch ihr Inhalt ist und was in
  ihm absolut positioniert ist, verlängert weder die Spalte noch das Dokument.
  Der Überschuss wird in der Spalte gescrollt. Mittel sind drei Deklarationen
  im `@media (min-width: 1024px)`-Block von `MasterDetail.vue`:
  1. Wurzel `grid-template-rows: minmax(0, 1fr)`. Das ist das Gegenstück zur
     vorhandenen Spaltenspur `minmax(0, 1fr)`. Die Zeile ist damit genau die
     feste Höhe und nicht implizit `auto`.
  2. Spalten `min-height: 0`, das Gegenstück zu `min-width: 0` (ADR-0012
     Punkt 4).
  3. Spalten `position: relative`. Der Scroll-Container ist damit der
     Containing Block seiner absolut positionierten Nachfahren. Kein
     `z-index`, also kein neuer Stapelkontext.
  Alle drei bleiben stehen, auch wenn die Diagnose nur eine als tragend
  ausweist. Jede schließt eine eigene Art ab, auf die eine Spalte das
  Dokument verlängern kann. Das Ergebnis der Diagnose wird hier in der
  Nachpflege nachgetragen.
- **Warum kein neues ADR**: Es ist eine Korrektur innerhalb des bestehenden
  Musters. Die Umkehr kostet drei CSS-Zeilen in einer Datei, es gibt keinen
  Contract, keine Daten und keinen zweiten Context. Die Zahl früherer
  Korrekturen am Baustein (ADR-0032, ADR-0033) ist kein ADR-Kriterium. Beide
  waren neue Entscheidungen, nämlich Sichtbarkeitsstruktur und eine Art
  exponierter Methode. Diese hier ist keine.
- **Verifikation**: harte Rauchtest-Zusicherung ab `lg`, deterministisch
  statt vom zufällig angesammelten Bestand abhängig. Die Vorbedingung ist
  Teil der Zusicherung: Spalteninhalt höher als die Spalte **und** ein absolut
  positioniertes Element im Spalteninhalt unterhalb der sichtbaren
  Spaltenhöhe. Geprüft wird in beiden `detailOffen`-Zuständen. Die
  Zusicherung muss gegen den Stand vor der Korrektur rot werden (ADR-0027
  Punkt 8).

## Alternativen (kurz)

- **Zweite Route für die zweispaltige Darstellung** — verworfen: -012 fordert
  ausdrücklich keinen neuen Adressraum, und -007 hätte den alten Satz belegt.
- **Elternroute `/orte` mit Kind `:ortId`** — verworfen: hängt die Routen aus
  -001 um, obwohl -011/-012 ausdrücklich einfangen statt umbauen sollen; der
  Gewinn gegenüber einer gemeinsamen Komponente ist null.
- **Split-Komponente in `src/app/layout/`** — verworfen: Sie müsste Ortsliste
  und Ortsdetail kennen; `app-shell` importiert nicht aus `features/`.
- **Zwei Routen-Komponenten beibehalten und die Liste im Detail mitrendern** —
  verworfen: Die Detailansicht besäße dann die Liste, und der
  Auswahl-/Scrollzustand müsste über einen dritten Ort synchron gehalten
  werden.
- **Auswahl als Store-Zustand neben der Route** — verworfen: zwei Quellen für
  dieselbe Wahrheit; Browser-Zurück und Schließen-Aktion könnten
  auseinanderlaufen, was die Kriterien ausdrücklich verbieten.
