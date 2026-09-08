# ADR-0007: Achsenwert-Modell — „nicht bewertet" ist ein ausdrücklich gespeichertes `null`, die Gesamtnote wird nie gespeichert

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `bewertungen`, `orte`, `datensicherung`
- **task_id**: `PO-2026-09-07-002` (erste Formaterweiterung nach ADR-0003)

## Kontext

PO-2026-09-07-002 trennt zwei Dinge, die technisch beide „kein Wert" aussehen
könnten: Der Achsenwert **0** ist eine gültige Bewertung, geht in die
Gesamtnote ein und senkt sie; **„nicht bewertet"** geht nicht ein. Ein Ort
kann zu einer nicht bewerteten Achse trotzdem einen Kommentar tragen, und das
Zurücksetzen einer Achse darf ihn nicht mitnehmen. Gleichzeitig ist dies die
erste Erweiterung des Formats aus PO-2026-09-07-001: Ein v1-Bestand kennt
keine Achsen und muss nach der Migration an allen vier Achsen „nicht
bewertet" tragen — **nicht** den Wert 0 und **keine** Gesamtnote 0,0.
Jede Darstellung, in der „fehlt" und „ist 0" ineinander fallen können,
erzeugt genau diesen Fehler.

## Entscheidung

1. **`wert: number | null`, mit ausdrücklich gespeichertem `null`** für „nicht
   bewertet". Nicht ein fehlendes Feld, nicht `undefined`, nicht `-1`, nicht
   `0`. Der Migrationsschritt v1 → v2 **schreibt diese `null` aktiv** in jeden
   Ort; danach ist der Zustand im Bestand vorhanden und nicht bloß abwesend.
2. **Wert und Kommentar sind Geschwister, nicht verschachtelt**:
   `{ wert: number | null, kommentar: string | null }` je Achse. Zurücksetzen
   setzt ausschließlich `wert` auf `null` und fasst `kommentar` nicht an.
   Läge der Kommentar unterhalb des Wertes, wäre sein Verlust beim
   Zurücksetzen nicht zu vermeiden, sondern nur zu umgehen.
3. **Vier feste, benannte Achsen als Objekt**, nicht als Liste:
   `ambiente`, `zeit`, `geschmack`, `preisLeistung`. Eine spätere fünfte
   Achse ist damit ein additives Feld mit eigenem Migrationsschritt; bei einer
   Liste hinge die Bedeutung an der Position.
4. **Ein leerer Kommentar wird als `null` gespeichert, nie als `""`.** Zwei
   Schreibweisen für „nichts" wären für den Import (-009) und jede
   Leer-Prüfung eine dauerhafte Fehlerquelle.
5. **Die Gesamtnote wird nicht gespeichert.** Sie ist eine reine Ableitung
   aus den ausgefüllten Achsen und wird bei jedem Zugriff berechnet — im
   Bestand, in der Exportdatei und im Store existiert sie nicht. Damit kann
   sie nicht veralten, braucht keinen Migrationsschritt und keine
   Neuberechnungspflicht in -004/-005.
6. **Gerechnet wird ungerundet, gerundet wird nur zur Anzeige.** Die
   Berechnung liefert eine Zahl (oder `null`, wenn keine Achse ausgefüllt
   ist); die Formatierung auf eine Nachkommastelle mit Komma ist eine
   **getrennte** Funktion. Ein gerundeter Wert wird nie zurückgelesen,
   verglichen oder erneut gerundet.
7. **Gültigkeit wird beim Eingeben hergestellt, nicht beim Lesen.** Im
   Bestand liegen ausschließlich ganze Zahlen von 0 bis 10 oder `null`.
   Reihenfolge an der Eingabe: **erst runden, dann klemmen**; ein geleertes
   Feld wird zu `null` und **nicht** geklemmt. Der Lesepfad korrigiert nichts
   und ersetzt nichts — das wäre der stille Ersatzwert, den ADR-0003 und
   ADR-0005 ausschließen.

## Konsequenzen

- Positiv: Das Akzeptanzkriterium „ein Bestand von vor diesem Paket wacht
  nicht mit vier Nullen auf" ist am Datenmodell entschieden, nicht an der
  Sorgfalt einzelner Lesestellen.
- Positiv: -003 kann nach Gesamtnote und nach jeder Einzelachse auf dem
  ungerundeten Wert sortieren und „Achse leer" sauber von „Achse ist 0"
  trennen, ohne dafür etwas Zusätzliches zu speichern.
- Negativ/Trade-off: `number | null` erzwingt an jeder Lesestelle eine
  ausdrückliche Fallunterscheidung. Das ist gewollt — `?? 0` wäre kürzer und
  genau der Fehler.
- Negativ/Trade-off: Die Gesamtnote wird häufig neu berechnet (Liste,
  Sortierung). Bei vier Zahlen je Ort ist das messbar folgenlos.
- Betrifft künftig: **-003** sortiert auf der berechneten, ungerundeten Note
  und darf sie nicht zwischenspeichern. **-009** exportiert keine Gesamtnote
  und füllt beim Import fehlende Achsen nicht mit 0 — dasselbe Kriterium
  steht dort bereits. **-004/-005** erben die Regeln 1, 4 und 7 für ihre
  eigenen neuen Felder.

## Alternativen (kurz)

- **Feld weglassen statt `null` speichern** — verworfen: „nicht vorhanden"
  ist von „ging verloren" nicht zu unterscheiden und lädt an jeder Lesestelle
  zu einem Ersatzwert ein.
- **`0` als „nicht bewertet" und ein separates Kennzeichen** — verworfen:
  Zwei Felder für einen Zustand, die auseinanderlaufen können; genau der Fall,
  den das Paket ausdrücklich ausschließt.
- **Gesamtnote mitspeichern** (für schnelleres Sortieren in -003) —
  verworfen: Sie müsste bei jeder Achsenänderung mitgeschrieben werden, könnte
  veralten, landete in jeder Exportdatei und bräuchte bei jeder künftigen
  Änderung der Rechenregel eine Migration.
- **Gerundete Gesamtnote speichern oder vergleichen** — verworfen:
  Zwei Orte mit angezeigter „7,3" sind nicht notwendig gleich; -003 verlangt
  ausdrücklich das Gegenteil.
