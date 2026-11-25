# Bilder und Bildvorschau (Vollbild)

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Bilder", „Bildvorschau (Vollbild) (PO-2026-11-24-006)". Wisch-
> Schwellen: [zieh-wisch-schwellen.md](zieh-wisch-schwellen.md).

## Bilder

- **Speichermangel beim Hinzufügen** ist der Anwendungsfall von
  `--color-warning` (siehe „Zustände" → Warnung): manuell schließbarer Banner
  im Detailbereich (kein Modal, kein Auto-Dismiss — die Bedingung besteht
  fort), Icon + Text, sagt konkret, was zu tun ist.
- **Leeres Bilder-Raster**: kein Platzhaltertext; die „Bild
  hinzufügen"-Aktion (Primär-Button) steht immer sichtbar.
- **Bild löschen** nutzt die Bestätigungsdialog-Konvention für schwer
  rückgängig machbare Aktionen (ein gelöschtes Bild ist endgültig weg).

## Bildvorschau (Vollbild) (PO-2026-11-24-006)

- **Modaler Vollbild-Dialog** (`role="dialog"`, `aria-modal="true"`), Fläche
  `--color-neutral-900` deckend. Aufbau: Kopfleiste 56px (rechts „×" 44×44,
  `aria-label` „Vorschau schließen"), Bildfläche (Rest, `object-fit:
  contain`, nie beschnitten, nie von Bedienelementen überdeckt), Fußleiste
  64px + `env(safe-area-inset-bottom)` mit „‹", „{n} von {m}" (14px, weiß,
  `aria-live="polite"`) und „›". Die Pfeile stehen **nicht** über dem Bild.
  Bedienelemente 44×44, Icon `--color-neutral-0`, Fläche transparent,
  Fokusring **weiß** (2px, Offset 2px; die Standardfarbe erreicht auf
  Dunkelgrau keine 3:1 — dialoglokale Ausnahme der Farbe, nicht der Stärke).
- **Blättern**: Pfeile, Pfeiltasten links/rechts, horizontales Wischen
  (Schwellen: [zieh-wisch-schwellen.md](zieh-wisch-schwellen.md)). Jeder
  Wechsel ist ein **Sprung**, kein Finger-Folgen, keine Slide-Animation.
  **Kein Umbruch** an den Enden: der jeweilige Pfeil ist `aria-disabled` mit
  40 % Deckkraft (Fokusring bleibt). Bei einem Bild entfallen Fußleiste,
  Pfeile und Zähler.
- **Schließen**: „×", Esc, System-Zurück (Verlaufseintrag ohne eigene Adresse,
  ADR-0036; Blättern erzeugt keine). Fokus beim Öffnen auf „×", danach
  gefangen (Tab zirkuliert ×, ‹, ›); beim Schließen auf die Kachel des
  zuletzt gezeigten Bildes (aus der Schnellansicht geöffnet: auf die
  Streifen-Kachel). Kein Löschen, keine Zoomgeste. Alt-Text „Bild {n} von {m}
  von {Bezeichnung}". Öffnen/Schließen: Fade 180ms.
