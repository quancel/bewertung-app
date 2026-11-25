# Zieh- und Wisch-Schwellen

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Zieh- und Wisch-Schwellen (2026-11-25)". Verwendet von
> [schnellansicht.md](schnellansicht.md) und [bildvorschau.md](bildvorschau.md).

Zwei verschiedene Größen, jede an genau einer Stelle; beides ist Entprellung,
keine Bedienungsgrenze.

- **Tipp-Schwelle: 4px** (`ZIEH_SCHWELLE_PX`, Schnellansicht). Nur wo dasselbe
  Element auf Tipp **und** Ziehen reagiert (Griff). Bis 4px Gesamtweg = Tipp,
  darüber = Zug. Die Bildvorschau hat keine Tipp-Aktion auf dem Bild, also keine
  Tipp-Schwelle.
- **Flick-Mindestweg: 10px** (Bildvorschau **und** Schnellansicht,
  `FLICK_MIN_WEG_PX`). Ein Flick (Tempo > 0,5px/ms) zählt nur bei mindestens
  10px Weg; darunter wird das Tempo ignoriert. Schnellansicht: unter 10px
  gilt beim Loslassen der nächstgelegene Zustand statt der Wischrichtungs-Regel.
- **Wisch ohne Flick** (Bildvorschau): ≥ 48px horizontaler Weg, horizontal
  dominant (|dx| > |dy|). Das Tempo 0,5px/ms ist in beiden Gesten gleich.
- Nicht ein einziger Wert: 4px trennt Tipp von Zug (Treffsicherheit des
  44px-Griffs), 10px trennt Flick von Zucken (5px in 8ms) — verschiedene
  Fehler, verschiedene Folgen.
