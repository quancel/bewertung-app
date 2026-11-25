# Gewichtung der Gesamtnote

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Gewichtung der Gesamtnote (PO-2026-11-24-001/-002)". Zonen nach
> Gewichtung: [zonen-ortsliste.md](zonen-ortsliste.md).

Gerätezustand (ADR-0006), kein Bestandsfeld. Szenarien: Ausgewogen (Standard),
Fokus Geschmack, Fokus Ambiente, Fokus Preis-Leistung, Fokus Zeit, Eigene.

- **Ein Gewichtungs-Sheet** (`Sheet.vue`-Chrome), drei Einstiege, alle öffnen
  dasselbe Sheet: (1) im Sortier-Sheet eine Zeile am Ende unter dem
  Gruppentitel „Gesamtnote": „Gewichtung: {Name}" mit Chevron (schließt das
  Sortier-Sheet, öffnet das Gewichtungs-Sheet); (2) im Ortsdetail unter der
  Gesamtnote ein Text-Button „Gewichtung: {Name}", immer sichtbar; (3) eine
  Hinweiszeile zwischen Werkzeugleiste und Liste/Karte, **nur wenn nicht
  Ausgewogen**: „Gesamtnote nach Gewichtung „{Name}" · Ändern", 14px
  `--text-muted`, Text-Button „Ändern", scrollt mit (nicht sticky). Bei
  Ausgewogen schweigt die Liste, jede Abweichung steht über Liste UND Karte.
- **Inhalt**: Titel „Gewichtung der Gesamtnote", Satz „Bestimmt, wie stark
  jede Achse in die Gesamtnote eingeht. Gilt für Liste, Detail und Karte.",
  sechs Zeilen (Name 16px + Sekundärzeile 14px `--text-muted`: „Alle Achsen
  zählen gleich" / „Geschmack zählt doppelt" … / „Du legst die Gewichte
  selbst fest"), je mind. 48px, Button-Liste wie das Sortier-Sheet
  (`aria-pressed`, aktive Zeile `--color-primary-50` + Haken-Icon 20px). Wirkt
  sofort; **schließt bei festen Szenarien** (240ms), **bleibt bei „Eigene" offen**.
- **„Eigene"**: unter der Zeile klappt (180ms ease-out, Reveal) ein Block mit
  vier Zeilen auf. Zeile = Achsenname + Anteil (14px `--text-muted`, „33 %",
  bei Gewicht 0 „zählt nicht") + Regler (Bahn/Thumb nach
  [regler-bewertungsachse.md](regler-bewertungsachse.md), immer „gesetzter"
  Thumb, 0–10, Schritt 1) + Zahlenfeld 64px (ganzzahlig, klemmt 0–10,
  committet auf jedes `input`, kein Enter). Unter 400px Container-Breite:
  Name+Anteil+Zahlenfeld oben, Regler darunter über die volle Breite; ab 400px
  einzeilig (Name 112px · Regler flex · Zahl 64px). Leeres Zahlenfeld → beim
  Verlassen zurück auf den bisherigen Wert (ein Gewicht ist nie „nicht
  gesetzt"). Das Sheet scrollt intern (max 90vh).
- **Letztes Gewicht über 0**: Die einzige Achse mit Gewicht > 0 trägt statt
  des Anteils „100 % · muss zählen", Regler `min=1`, Zahlenfeld klemmt auf 1.
  Ein Versuch, sie auf 0 zu setzen (auch am Regler), lässt den Wert auf 1 und
  zeigt unter dem Block eine Statuszeile (`role="status"`, 14px `--text`):
  „Mindestens eine Achse muss zählen." Sie bleibt bis zur nächsten
  Gewichtsänderung (kein Timer).
- **Ort ohne Gesamtnote wegen Gewicht 0** ist NICHT derselbe Zustand wie „noch
  nicht bewertet". Verbindliche Texte:

  | Ort | „noch nicht bewertet" | „keine Note wegen Gewicht 0" |
  |-----|-----------------------|------------------------------|
  | Gruppenüberschrift (Sortierung nach Gesamtnote, 32px Abstand, gemutet) | „{n} Ort/Orte ohne Bewertung in Gesamtnote" | „{n} Ort/Orte ohne Gesamtnote bei dieser Gewichtung" |
  | Ortsdetail | „Noch nicht bewertet" | „Keine Gesamtnote bei dieser Gewichtung" + Zusatz „Die bewerteten Achsen zählen mit Gewicht 0." (14px `--text-muted`) |
  | Schnellansicht (Kopf, rechts) | „Noch nicht bewertet" | „Keine Gesamtnote bei dieser Gewichtung", **ohne** Zusatz |
  | Marker, zugänglicher Name | „{Bezeichnung}, keine Gesamtnote" | „{Bezeichnung}, keine Gesamtnote bei dieser Gewichtung" |

  Reihenfolge der Endgruppen: zuerst „ohne Bewertung", dann „ohne Gesamtnote
  bei dieser Gewichtung"; leere Gruppe entfällt; Singular bei n = 1 („1 Ort").
  Marker sehen in beiden Fällen gleich aus (Punkt ohne Zahl).
