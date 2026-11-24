# ADR-0037: Gewichtete Gesamtnote: Gewichtung als Anzeigeeinstellung von `orte`, Pflichtparameter der reinen Berechnung, ein Rundungsschritt für Anzeige und Zone (löst ADR-0034 Punkt 3/4 ab, präzisiert ADR-0007 Punkt 6)

- **Status**: accepted
- **Datum**: 2026-11-24
- **Bounded Context(s)**: `orte`, `bewertungen`, `karte`
- **task_id**: `PO-2026-11-24-001`, `PO-2026-11-24-002`

## Kontext

Ab -001 lässt sich die Gesamtnote global am Gerät gewichten: fünf feste
Szenarien (1:1:1:1 bzw. 2:1:1:1), ab -002 auch eigene Gewichte von 0 bis 10.
Drei Fragen sind offen. Wem gehört die Einstellung? `bewertungen` hat
keinen Store und darf keinen bekommen (ADR-0008, ADR-0013 Punkt 3). Wie
wird verhindert, dass eine Stelle ungewichtet rechnet? Liste, Detail,
Sortierung und Karte müssen denselben Wert zeigen. Und gilt die Zone
weiter am ungerundeten Wert? ADR-0034 Punkt 3 hat die Übereinstimmung von
Zone und Anzeige strukturell begründet, denn die Nenner waren 1 bis 4. Mit
eigenen Gewichten sind die Nenner 1 bis 40. Beispiel: Geschmack 8 mit
Gewicht 10, Ambiente 8 mit Gewicht 9, Zeit 7 mit Gewicht 1 ergibt
159/20 = 7,95. Das wird als „8,0" angezeigt, liegt aber unter der
Zonengrenze. Das ist genau der Fehlerfall, den ADR-0034 Punkt 3 nennt:
„8,0" ohne Zonenfarbe.

## Entscheidung

1. **Die Gewichtung ist eine Anzeigeeinstellung des Contexts `orte`**
   (ADR-0006, ADR-0009). Schlüssel `orte.gewichtung` im Object Store
   `einstellungen`. Typ, Voreinstellung (Ausgewogen), Szenariotabelle
   (Name, Sekundärzeile, Gewichte) und Prüffunktion stehen in
   `features/orte/model/ansicht.ts`. Der Zustand lebt in `useOrteStore`
   neben Sortierung und Tag-Filter. Kriterium aus ADR-0009: zuständig ist,
   wem die konfigurierte **Ansicht** gehört (Liste, Detail und die
   Kartenansicht rendert `Ortebereich.vue`), nicht der Context, der die
   Achsen trägt. Kein Bestandsfeld, keine `SCHEMA_VERSION`, kein Export,
   der Import fasst sie nicht an.
2. **Wertform als Objekt, das -002 erweitert, ohne -001 zu brechen.** -001
   speichert `{ szenario }`, -002 ergänzt `szenario: 'eigene'` und
   `eigeneGewichte` (vier ganze Zahlen 0–10, mindestens eine > 0). Die
   Prüffunktion fällt still auf Ausgewogen zurück (ADR-0006 Punkt 4), und
   ein gültiges Szenario mit fehlenden oder ungültigen `eigeneGewichte`
   bekommt 1:1:1:1. Die Wahl eines festen Szenarios lässt `eigeneGewichte`
   stehen.
3. **Die Berechnung bleibt eine reine Funktion in `shared/lib/gesamtnote.ts`,
   die Gewichte sind ein Pflichtparameter** (`berechneGesamtnote(bewertungen,
   gewichte)`, ohne Default). Das ist Struktur und keine Konvention: Ein
   Aufrufer ohne Gewichte kompiliert nicht. Der Typ der Gewichte
   (`AchsenGewichte`) steht in `gesamtnote.ts`, `ansicht.ts` bleibt
   importfrei und strukturell kompatibel. Regel: Summe(Gewicht × Wert) /
   Summe(Gewicht) über die Achsen mit Wert. `null` fällt samt Gewicht
   heraus, 0 ist ein Wert.
4. **Das Ergebnis unterscheidet drei Fälle**: `wert` (mit `roh` und
   `zehntel`), `unbewertet` (keine Achse hat einen Wert) und ab -002
   `ohne-gewicht` (es gibt Werte, aber alle mit Gewicht 0). Die beiden
   Zustände ohne Note sind fachlich verschieden (design-conventions.md
   „Gewichtung") und dürfen nicht zu einem `null` zusammenfallen. Die
   Sortierung liefert für `ohne-gewicht` eine eigene Endgruppe nach
   `unbewertet`.
5. **Ein Rundungsschritt, ganzzahlig.** `zehntel` ist
   `Math.round(10 × Zähler / Nenner)` mit ganzzahligem Zähler
   (Σ Gewicht × Wert) und Nenner (Σ Gewicht). Halbe Zehntel runden auf,
   genau wie das bisherige `Intl.NumberFormat` bei positiven Werten.
   **Anzeige und Zone lesen beide `zehntel`.** Die Formatierung erzeugt
   daraus den String, die Zone vergleicht ganzzahlig mit den Zehntel-Grenzen
   (80, 85, 90, 95, 100). Ein String wird nie zurückgelesen. Damit gilt
   „Zone nach dem angezeigten Wert" für jeden Nenner, nicht nur für die
   heute erreichbaren. **Sortierung, Gleichstand und Marker-Vorrang lesen
   `roh`**, denn ADR-0007 Punkt 6 bleibt dort uneingeschränkt.
   Einzelachsenwerte (ganzzahlig) gehen als `wert × 10` in dieselbe
   Zonenfunktion, das betrifft die Balkenfüllung in -007.
6. **Ausgewogen ändert nichts.** Ein erschöpfender Vitest über alle 12⁴
   Achsenkombinationen belegt, dass die Anzeige bei Ausgewogen Zeichen für
   Zeichen gleich der bisherigen `Intl`-Formatierung des ungewichteten
   Mittels ist. Ein zweiter, über alle Kombinationen und die fünf festen
   Szenarien, belegt Zone(angezeigt) = Zone(`zehntel`). Für eigene Gewichte
   gilt das per Konstruktion. Ein Test mit konstruierten Grenzfällen
   (z. B. 159/20) sichert es zusätzlich ab.
7. **Wer rechnet**: `shared/lib/sortierung.ts` (Gewichte als Parameter),
   `useOrteStore` (stellt die aktuellen `AchsenGewichte` bereit und reicht
   sie an `sortiereOrte` weiter) und `Ortebereich.vue` (Detail, Props für
   `Ortszeile.vue`, ab -004 die Felder von `KartenOrt`). `Ortszeile.vue`,
   `ZonenLegende.vue` und `karte` rechnen **nicht** selbst, sie bekommen
   das fertige Ergebnis bzw. bei `karte` primitive Felder (ADR-0019
   Punkt 8). Die Hervorhebung (ADR-0034 Punkt 5) liest weiter die
   gespeicherten Achsenwerte und ist von der Gewichtung unberührt.

## Konsequenzen

- Positiv: Eine Stelle rechnet, eine Stelle rundet. Gleichheit über Liste,
  Detail und Karte folgt aus der Struktur.
- Positiv: Die Zonenregel hängt nicht mehr an einer Eigenschaft der
  Wertemenge, die die nächste Funktion wieder aufbricht.
- Negativ/Trade-off: `formatiereGesamtnote` und `bestimmeZone` ändern ihre
  Signatur (Zehntel statt Zahl). Alle Aufrufer ziehen in -001 mit, auch der
  Screenreader-Text in `zonen.ts`.
- Negativ/Trade-off: `shared/lib/` enthält jetzt eine Funktion mit einem
  Parameter, der aus einer `orte`-Einstellung stammt. Der Typ liegt
  trotzdem in `shared/lib/`, damit nichts aus `features/` importiert wird.
- Betrifft künftig: Jede neue Stelle, die eine Gesamtnote zeigt (-004
  Karte, -005 Schnellansicht), bekommt sie aus `Ortebereich.vue` und
  rechnet nicht selbst.

## Abgelöst

ADR-0034 **Punkt 3** (Zone am ungerundeten Wert, gestützt auf die Nenner
1–4) und **Punkt 4** (Vorbehalt für Nachkommawerte) sind durch Punkt 5
abgelöst. Punkt 4 hat diesen Fall vorhergesehen, aber nur ADR-0007 Punkt 7
als Auslöser genannt, nicht eine Gewichtung. ADR-0034 Punkte 1, 2 und 5
gelten unverändert.

## Alternativen (kurz)

- **Einstellung in `bewertungen` mit eigenem Store**: verworfen, verstößt
  gegen ADR-0008 (eigener Store nur bei eigenem Object Store).
- **`gewichte` mit Default 1:1:1:1**: verworfen. Ein vergessener Aufrufer
  zeigt dann still die ungewichtete Note, also genau „überall derselbe
  Wert" verletzt, ohne dass ein Test es bemerkt.
- **Zone weiter am Rohwert, Test über alle Gewichte**: verworfen. 11⁴
  Gewichte × 12⁴ Werte sind nicht erschöpfend testbar, und es gibt
  nachweislich Gegenbeispiele.
- **Ergebnis `number | null`**: verworfen, weil „ohne Gesamtnote bei
  dieser Gewichtung" dann nicht von „nicht bewertet" zu unterscheiden ist.
