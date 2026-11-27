# Namenskonventionen; Routen, Ansichten, neue Bereiche

> Themendatei von `.claude/context/code-conventions.md` (Abschnitte
> „Namenskonventionen" und „Routen, Ansichten, neue Bereiche"). Single-Writer:
> `architekt`. Maßgeblich ist dieser Wortlaut samt Ausnahmen, nicht die
> Kurzzeile im Register.

## Namenskonventionen

**Framework-Vokabular englisch, Domänen-Vokabular deutsch** (ADR-0002).

- Ordner kebab-case; Feature-Ordner heißt **exakt** wie der `bounded_context`.
- SFC: PascalCase mit deutschem Domänenwort (`Ortsliste.vue`). **Einteilige
  deutsche Komposita sind erlaubt** — die Vue-Regel „multi-word" schützt vor
  HTML-Kollisionen, `Ortsliste` kollidiert mit keiner. Nicht „korrigieren".
- Typen: PascalCase deutsch (`Ort`, `Bewertung`). Stores:
  `<context>.store.ts` / `use<Context>Store`. Composables: `use<Name>()`.
  Sonstige TS-Dateien kebab-case. Tests: `*.spec.ts` neben der Datei.

## Routen, Ansichten, neue Bereiche

- **Adressschema** `/<bereich>` und `/<bereich>/:<id>`; `/` leitet auf
  `/orte`. Route-Name einer **neuen** flachen Route = Pfad ohne
  Schrägstrich. Die ausgelieferten Namen sind eingefroren, wie sie sind:
  `orte`, `ort-detail` (für `/orte/:ortId`), `daten`, `adresse-ohne-ziel`.
  Navigiert wird per Name, nie per zusammengesetztem Pfad aus einem Namen.
  **Routen bleiben flach**, keine Elternroute als Layout-Träger; die
  Sammelroute `/:pfad(.*)*` steht als **letzter** Eintrag in
  `app/router/routes.ts`. `path` und `name` einer ausgelieferten Route werden
  **nie** geändert (ADR-0010/0011).
- **Beide Routen eines Bereichs zeigen auf dieselbe Bereichsansicht** in
  `features/<context>/views/`, die den Parameter aus der Route liest. Kein
  zweiter „ausgewählt"-Zustand neben `route.params` (ADR-0011).
- **Neuer Bereich**: flache Route **vor** der Sammelroute + **angehängter**
  Eintrag im Register von `app/layout/Bereichsnavigation.vue` (nie einfügen
  oder umsortieren, ADR-0010) + Icon. Nicht jeder Bereich ist zweispaltig.
- **Zweite Ansicht eines bestehenden Bereichs**: kein Routen-Eintrag, keine
  Navigation, sondern ein Query-Parameter (`/orte?ansicht=karte`, ADR-0019).
  Die Ansicht leitet sich allein daraus ab — kein Store-Flag, keine
  Anzeigeeinstellung. Unbekannter/fehlender Wert = Standardansicht **ohne**
  `replace`. Parametername und -wert sind ab Auslieferung eingefroren.
- **Eingefrorene Query-Parameter**: `ansicht` (Wert `karte`, ADR-0019) und
  `ort` (Ort-ID, nur zusammen mit `ansicht=karte`, ADR-0039). Bei `ort`
  gilt: Öffnen ist `push`, Wechsel ist `replace`, Schließen ist
  `back()` **nur**, wenn `history.state.back` auf die Karte **ohne** `ort`
  auflöst (`router.resolve`), sonst `replace` ohne `ort` (ADR-0039
  Nachtrag zu P1). Eine
  unbekannte oder nicht sichtbare ID wird **erst nach dem Laden des
  Stores** per `replace` entfernt. Das ist die einzige Ausnahme von „ohne
  `replace`".
- **Modaler Zustand, der über Zurück schließen soll, bekommt einen
  Verlaufseintrag ohne eigene Adresse** (ADR-0036), keinen neuen
  Query-Parameter. Er wird über den Router angelegt, nie über rohes
  `history.pushState`. Eine Vorwärts-Navigation oder ein Neuladen öffnet
  ihn nie, und `scrollBehavior` scrollt bei gleicher `fullPath` nicht.
  Bauform: `medien/composables/useVorschauVerlaufseintrag.ts`
  (`router.push({ …, state: { bildvorschau: true }, force: true })`, ohne
  `force` entsteht kein Eintrag; Schließerkennung über `popstate`). Der
  Esc-Handler sitzt am Dialog selbst mit `stopPropagation`, damit die
  `document`-Listener darunterliegender Sheets nicht mitschließen. Der
  Fokus wird mit `focus({ preventScroll: true })` zurückgegeben.
