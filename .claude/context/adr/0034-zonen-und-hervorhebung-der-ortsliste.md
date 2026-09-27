# ADR-0034: Zonen und Hervorhebungen der Ortsliste — reine Funktionen in `features/orte/lib/`, die Zone wird am ungerundeten Wert bestimmt (Präzisierung von ADR-0008 Punkt 6, Anwendung von ADR-0007 Punkt 6/7)

- **Status**: accepted
- **Datum**: 2026-09-27
- **Bounded Context(s)**: `orte`, `bewertungen`
- **task_id**: `PO-2026-09-27-003`

## Kontext

PO-2026-09-27-003 färbt den angezeigten Wert einer Listenzeile nach fünf
Zonen (8 · 8,5 · 9 · 9,5 · 10). Außerdem bekommt eine Zeile bei Geschmack
bzw. Preis-Leistung ≥ 9 einen Hervorhebungs-Schatten. Beides wertet Felder
von `bewertungen` aus. ADR-0008 Punkt 6 legt „reine Ableitungen auf
Ort-Feldern" nach `src/shared/lib/`, begründet aber mit **zwei Nutzern von
Anfang an** (Punkt 8). Hier gibt es genau einen Nutzer, die Ortsliste samt
ihrer Legende. `design-concept.md` („Ausnahme Ortsliste") schließt jede
Ausweitung ausdrücklich aus. Zweitens verlangt das Kriterium die Zone „nach
dem **angezeigten** Wert", ADR-0007 Punkt 6 verbietet aber, einen
gerundeten Wert zu vergleichen.

## Entscheidung

1. **Zonenzuordnung, Hervorhebungs-Auswertung und der Screenreader-Text
   dazu sind reine Funktionen in `src/features/orte/lib/zonen.ts`**, nicht
   in `src/shared/lib/`. ADR-0008 Punkt 6 gilt für Ableitungen, die der
   besitzende Context **und** die Ortsliste brauchen (Gesamtnote,
   Tag-Prädikat). Eine Darstellungsregel, die nur die Ortsliste kennt,
   gehört dem Context `orte`. Braucht sie später ein zweiter Context, ist
   das nach `design-concept.md` eine Konzeptänderung, und erst dann zieht die
   Funktion nach `shared/lib/` um.
2. **Eine Tabelle, eine Stelle.** `zonen.ts` hält die fünf Zonen als eine
   Konstante: Schlüssel, Untergrenze, Wertebereich-Beschriftung und den
   **wörtlichen** Tokennamen (`'--color-zone-8-5'`). Zonenfunktion, Zeile und
   Legende lesen alle aus dieser Tabelle. Keine Komponente baut einen
   Tokennamen aus einem String zusammen, sonst findet ein Grep nach dem
   Tokennamen die Verwendung nicht.
3. **Die Zone wird am ungerundeten Wert bestimmt** (ADR-0007 Punkt 6). Das
   Kriterium „nach dem angezeigten Wert" ist trotzdem erfüllt, und zwar
   strukturell: Achsenwerte sind ganze Zahlen 0–10 (ADR-0007 Punkt 7), die
   Gesamtnote ist der Mittelwert von 1–4 davon, also k/1, k/2, k/3 oder k/4.
   Keiner dieser Werte liegt im Intervall [Grenze − 0,05; Grenze) einer
   Zonengrenze. Das Runden auf eine Nachkommastelle verschiebt also nie
   die Zone. Belegt wird das durch einen **erschöpfenden** Vitest über alle
   12⁴ Achsenkombinationen (0–10 oder `null`). Der Test vergleicht die Zone
   des Rohwerts mit der Zone des angezeigten Werts. Das Zurücklesen des
   formatierten Strings ist dabei nur im Test erlaubt, nie im
   Produktionscode. Beobachtbarer Fehlerfall, den der Test fängt: eine Zeile
   zeigt „8,0" ohne Zonenfarbe, weil der Rohwert 7,96 war.
4. **Lockert jemand ADR-0007 Punkt 7** (Nachkommawerte an einer Achse), wird
   der Test aus Punkt 3 rot, und diese Entscheidung ist neu zu treffen. Die
   Zone läuft dann über **einen** gemeinsamen Rundungsschritt, den
   Formatierung und Zone teilen, und nie über das Parsen der formatierten
   Anzeige.
5. **Die Hervorhebung liest die gespeicherten Achsenwerte direkt** (`>= 9`,
   `null` löst nie aus). Sie ist unabhängig von Sortierkriterium, Zone und
   Gruppe, gilt also auch in der Gruppe „ohne Wert". Die Reihenfolge ist fest:
   Geschmack vor Preis-Leistung, Geschmack = schwach, Preis-Leistung = stark.

## Konsequenzen

- Positiv: Die Logik prüft ein Vitest in `environment: 'node'`, der
  billigsten Ebene (ADR-0027). `Ortszeile.vue` bindet nur noch an.
- Positiv: Dass Gruppe „ohne Wert" keine Zone hat, folgt aus der Struktur.
  Die Zone hängt am Wert-Slot, und den rendert diese Gruppe nicht.
- Negativ/Trade-off: `shared/lib/` enthält nicht mehr **alle** Auswertungen
  von `bewertungen`-Feldern, die die Liste zeigt. Wer dort sucht, findet die
  Zonen nicht. `context-map.md` und `code-conventions.md` nennen die
  Ausnahme deshalb ausdrücklich.
- Betrifft künftig: Jedes Paket, das Zonen oder Hervorhebungen außerhalb der
  Ortsliste zeigen will (Konzeptänderung nötig), und jede Änderung an
  ADR-0007 Punkt 7.

## Alternativen (kurz)

- **`src/shared/lib/zonen.ts`** neben `gesamtnote.ts`: verworfen. Die Datei
  hätte einen einzigen Nutzer, und ihr Ort würde eine Wiederverwendung
  anbieten, die das Design-Konzept ausdrücklich ausschließt.
- **Zone am gerundeten bzw. formatierten Wert**: verworfen. Das verstößt
  gegen ADR-0007 Punkt 6, bringt bei den erreichbaren Werten nachweislich
  keinen Unterschied und würde einen String zurücklesen.
