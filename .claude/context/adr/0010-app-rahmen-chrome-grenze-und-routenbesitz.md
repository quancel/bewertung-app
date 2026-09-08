# ADR-0010: App-Rahmen — Grenze der Navigationschrome, Routenbesitz und eine Meldung an zwei Orten

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `app-shell`, `orte`
- **task_id**: `PO-2026-09-07-011`

## Kontext

PO-2026-09-07-011 legt erstmals einen App-Rahmen um die bereits vorhandene
Ortsliste und Detailansicht (PO-2026-09-07-001). Dabei sind drei Fragen zu
klären, die keine der beteiligten Rollen allein beantworten kann:

1. Der Rahmen muss auf einen Zustand verzweigen, der aus `src/persistence/`
   kommt (Bestand gesperrt), darf aber nicht aus `features/` importieren.
2. Die Meldung „Adresse ohne Ziel" wird an zwei Stellen gebraucht: an der
   Sammelroute (`app-shell`) und in der Detailansicht bei unbekannter Ort-ID
   (`orte`). `app-shell` wird von niemandem importiert (context-map.md),
   `orte` darf nicht aus `app/` importieren — ein direkter Weg existiert also
   nicht.
3. PO-2026-09-07-007 liefert danach genau diesen Adressraum offline aus. Was
   -011 an Routen anlegt, ist damit faktisch veröffentlicht.

## Entscheidung

1. **Der Rahmen ist eine Komponente, keine Route.** `App.vue` entscheidet vor
   dem `<router-view>`: Ist einer der beiden Sperrzustände aus
   `src/persistence/` aktiv (unbekannte neuere `SCHEMA_VERSION`, Gerätespeicher
   nicht verfügbar — ADR-0004), rendert es die vollflächige Meldung **ohne**
   Rahmen und ohne `<router-view>`. Sonst rendert es den Rahmen (Skip-Link,
   Bereichsnavigation, `<main id="main-content">`) um das `<router-view>`.
   Damit hängt die Chrome-Grenze nicht an Routen-Metadaten, die jedes spätere
   Paket beim Anlegen einer Route mitpflegen müsste.
2. **Der Sperrzustand wird einmal ermittelt und gelesen, nicht zweimal
   geprüft.** `src/persistence/` (aus -001) stellt ihn als ein ausdrückliches
   Ergebnis bereit (ADR-0005 Punkt „Ergebnisse statt Ausnahmen"); der Rahmen
   liest ihn nur. Kein zweiter Öffnungsversuch der Datenbank aus `app/`, keine
   eigene Auswertung der `SCHEMA_VERSION` außerhalb von `persistence/`
   (ADR-0003).
3. **Die Meldung „Adresse ohne Ziel" ist ein Baustein in `src/shared/ui/`**
   (`AdresseOhneZiel.vue`), kein Bestandteil von `app/`. Sie hat von Anfang an
   zwei Nutzer und erfüllt damit die Schwelle aus `code-conventions.md`. Die
   Sammelroute nutzt sie unmittelbar als Routen-Komponente; die Detailansicht
   in `features/orte/views/` rendert sie bei unbekannter Ort-ID **an Ort und
   Stelle**, ohne Weiterleitung.
4. **Kein Redirect auf eine Fehleradresse.** Eine Detailadresse zu einem nicht
   vorhandenen Ort behält ihre Adresse und zeigt die Meldung im Inhalt. Ein
   Redirect würde die Adresse austauschen, den History-Stapel verändern und
   den Fall „gelöscht, dann Browser-Zurück" in einen zweiten, abweichenden
   Ablauf zwingen.
5. **-011 legt genau eine Route an: die Sammelroute** (`/:pfad(.*)*`,
   Name `adresse-ohne-ziel`), als letzten Eintrag in
   `src/app/router/index.ts`. Bestehende Routen aus -001 werden weder
   umbenannt noch verschoben noch in eine Elternroute eingehängt.
6. **Scrollposition über `scrollBehavior`, nicht über `<keep-alive>`.** Der
   Router gibt `savedPosition` zurück und sonst den Seitenanfang. Der
   Anzeigezustand der Liste überlebt das Aus- und Einhängen ohnehin, weil er
   im Store liegt (ADR-0009); ein `<keep-alive>` wäre eine zweite,
   unsichtbare Zustandsquelle daneben und würde mit der Bereichsansicht aus
   ADR-0011 kollidieren.

## Konsequenzen

- Positiv: Jede später hinzukommende Route bekommt den Rahmen automatisch;
  kein Paket muss beim Anlegen einer Route an Chrome-Metadaten denken.
- Positiv: Die Regel „`app-shell` importiert nicht aus `features/`" bleibt
  ohne Ausnahme haltbar — der Rahmen kennt nur `persistence/` und
  `shared/ui/`.
- Negativ/Trade-off: `App.vue` trägt eine Fallunterscheidung, die streng
  genommen Zustandslogik ist. Sie ist auf **eine** Abfrage begrenzt; wächst
  sie, gehört sie in eine Rahmen-Komponente unter `src/app/layout/`, nicht in
  einen globalen Store (den `code-conventions.md` ausschließt).
- Negativ/Trade-off: Der Sperrzustand muss feststehen, bevor der Rahmen
  rendert. -001 legt damit die Startreihenfolge fest; -011 erbt sie und darf
  sie nicht umgehen.
- Betrifft künftig: **-006** und **-009** hängen ihren Bereichseintrag in
  dieselbe Navigationsebene und legen ihre Route flach daneben. **-007**
  liefert den nach -011/-012 vorhandenen Adressraum offline aus und findet
  die Sammelroute vor. **-012** ändert die Routen-Komponenten, nicht die
  Adressen (ADR-0011).

## Alternativen (kurz)

- **Chrome über `route.meta.chrome`** — verworfen: Der Sperrzustand ist keine
  Route. Jede spätere Route müsste das Flag mitpflegen, und ein vergessenes
  Flag fällt erst im Sperrfall auf, also fast nie.
- **Layout als Elternroute mit Kind-Routen** — verworfen: -011 müsste die
  Routen aus -001 umhängen; Adressraum und Routennamen sind aber ab -007
  veröffentlicht, und -011 soll ausdrücklich einfangen statt umbauen.
- **Meldungskomponente in `src/app/`** — verworfen: `features/orte/` bräuchte
  dann einen Import aus `app/`, den context-map.md ausschließt.
- **Weiterleitung auf eine eigene `/nicht-gefunden`-Adresse** — verworfen:
  erzeugt eine zusätzliche Adresse (die -012 ausdrücklich vermeidet) und
  einen zweiten History-Eintrag hinter jedem gelöschten Ort.
