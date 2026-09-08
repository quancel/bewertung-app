# ADR-0008: Feldbesitz und Ableitungen über Context-Grenzen im Ort-Datensatz

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `orte`, `bewertungen`, `tags`, `medien`, `datensicherung`
- **task_id**: `PO-2026-09-07-002` (erstmals nötig, gilt ab hier projektweit)

## Kontext

Zwei bereits getroffene Entscheidungen geraten in PO-2026-09-07-002 zum ersten
Mal aneinander. ADR-0004 legt fest: **ein Ort ist genau ein Datensatz**,
Bewertungen und Tags sind Felder darin. Die Context Map legt fest:
`bewertungen`, `tags` und `medien` dürfen `orte` lesen, **`orte` aber keinen
von ihnen** — es gibt keinen Rückweg. Zugleich zeigt die Ortsliste (Context
`orte`) laut Design die Gesamtnote und ab -003 den Wert einer Einzelachse,
und ab -004 filtert sie nach Tags. Ohne Regel bleiben nur zwei schlechte
Auswege: `orte` importiert doch aus `bewertungen` (Zyklus, die Context Map
wäre nicht mehr haltbar), oder jeder Context bekommt seinen eigenen Store und
schreibt eigenständig denselben Datensatz zurück — was ADR-0005 Punkt 1
aushebelt, weil dann zwei Stores im selben Tab beanspruchen, die Wahrheit zu
sein.

## Entscheidung

1. **Der Ort-Datensatz hat im Arbeitsspeicher genau einen Besitzer:
   `useOrteStore`.** Er ist die einzige Stelle, die einen Ort lädt, hält und
   über die Persistenzschicht zurückschreibt.
2. **Contexts, die Felder im Ort-Datensatz bearbeiten, führen dafür keinen
   eigenen Store** und rufen `src/persistence/` nicht selbst auf. Sie ändern
   über das öffentliche API des `orte`-Stores. Das gilt für `bewertungen`
   (-002) und `tags` (-004).
3. **Einen eigenen Store hat nur, wer einen eigenen Object Store hat.** Das
   trifft ab -005 auf `medien` zu (Store `bilder`, ADR-0004) und auf niemanden
   sonst.
4. **Der Context bleibt trotzdem der Eigentümer der Bedeutung.** Typen,
   Wertebereiche, Voreinstellungen und die Bearbeitungsoberfläche seiner
   Felder liegen in seinem Feature-Ordner. Was wandert, ist nur der
   Schreibweg, nicht die Zuständigkeit.
5. **Typen fließen über `persistence/schema.ts`.** `orte` bezieht die Form
   der Bewertungsfelder aus dem dort zusammengesetzten Ort-Typ, nicht aus
   `features/bewertungen/model/`. Ein Feature-zu-Feature-Import entsteht
   dadurch nicht.
6. **Reine Ableitungen auf Ort-Feldern liegen in `src/shared/lib/`** —
   zustandslose Funktionen ohne Store- und Speicherzugriff (Gesamtnote und
   „N von 4 Achsen" aus -002, das Tag-Prädikat aus -004). Sie haben von
   Anfang an zwei Nutzer: die Detailansicht des besitzenden Contexts und die
   Ortsliste.
7. **Darstellungsbausteine, die in der Ortsliste erscheinen und einem anderen
   Context gehören, liegen in `src/shared/ui/`** (die Intensitäts-Balken\-
   anzeige aus -002). Sie sind präsentational und kennen keinen Store.
8. **Die Regel „nach `shared/` erst ab zwei Nutzern" ist damit erfüllt, nicht
   umgangen.** Der zweite Nutzer ist die Ortsliste, und er existiert im selben
   Paket — nicht erst vermutet für später.

## Konsequenzen

- Positiv: Die Context Map bleibt wörtlich gültig; es entsteht kein Zyklus
  und keine Ausnahme, die beim nächsten Paket erneut verhandelt werden müsste.
- Positiv: ADR-0005 bleibt tragfähig, weil es im Arbeitsspeicher weiterhin
  genau eine Wahrheit je Ort gibt. Andernfalls wäre der Mehr-Tab-Fall, den
  der Nutzer bewusst hingenommen hat, schon **innerhalb eines Tabs**
  eingetreten.
- Negativ/Trade-off: `bewertungen` und `tags` sind damit Contexts ohne
  eigenen persistenten Store — ungewohnt, aber die Folge davon, dass ihre
  Daten im selben Datensatz liegen. Wer das ändern will, muss ADR-0004
  Punkt 5 ablösen, nicht dieses ADR umgehen.
- Negativ/Trade-off: `src/shared/` füllt sich früher als bei strikter
  Auslegung von „erst ab zwei Nutzern". Punkt 8 begrenzt das auf den Fall
  „wird nachweislich schon jetzt von zwei Contexts gebraucht".
- Betrifft künftig: **-003** nutzt die Ableitungen aus `shared/lib/` und legt
  keine eigenen an. **-004** legt das Tag-Prädikat dort ab und schreibt Tags
  über den `orte`-Store. **-005** ist die Ausnahme nach Punkt 3 und bekommt
  einen eigenen Store. **-012** verändert daran nichts — es ist Layout.

## Alternativen (kurz)

- **`orte` darf lesend aus `bewertungen` importieren** — verworfen: Es gäbe
  einen Import-Zyklus mit der bereits erlaubten Gegenrichtung, und die
  einzige klar gerichtete Beziehung der Context Map wäre keine mehr.
- **Je Context ein eigener Store auf demselben Datensatz** — verworfen:
  zwei Wahrheiten je Ort im selben Tab; der zuletzt schreibende Store
  überschreibt den anderen (ADR-0005 Punkt 1).
- **Bewertungen und Tags in eigene Object Stores** — verworfen: ADR-0004
  Punkt 5 hat das bereits abgewogen; sie werden immer gemeinsam mit dem Ort
  gelesen und geschrieben.
- **Gesamtnote im `orte`-Context berechnen** — verworfen: Die Rechenregel
  gehört fachlich zu `bewertungen`; in `orte` kopiert stünde sie zweimal da
  und liefe auseinander.
