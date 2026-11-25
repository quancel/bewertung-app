# Master-Detail (ab `lg`)

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Master-Detail (ab `lg`)". Navigation/Zurück-Aktion: Hauptdatei.

- **Zwei Spalten innerhalb des 1120px-Containers** (nicht die Nav-Rail-Spalte):
  Liste fixe Breite (~400px), Detail nimmt den Rest (Mindestbreite, damit
  Formulare/Bilder-Raster nicht gequetscht werden), 24px Abstand, 1px
  `--border` als Spaltentrennung. Beide Spalten scrollen unabhängig.
- **Die Zweispaltigkeit gilt ab `lg` strukturell** — unabhängig vom Inhalt
  der Detail-Spalte (gewählter Ort, „Adresse ohne Ziel", gefilterter
  Leerzustand mit ausgewähltem Ort) und von jeder Sichtbarkeits-Logik
  unterhalb `lg` (PO-2026-09-26-002, ADR-0011 Punkt 2/5/6): eine Regel, die
  die Listen-Spalte vom „Detail offen"-Zustand abhängig ausblendet, muss selbst
  auf < 1024px begrenzt sein und darf sich nicht auf Spezifität oder
  Reihenfolge einer anderen Regel verlassen.
- **Keine automatische Vorauswahl.** Ohne gewählten Ort zeigt die zweite
  Spalte einen ruhigen typografischen Hinweis ohne Primär-Aktion (bewusste
  Abweichung vom „Leer"-Muster) — z. B. „Wähle einen Ort aus der Liste, um
  Details zu sehen." **Nicht** bei leerem Bestand oder null Filtertreffern
  (dort bleibt der jeweilige Leerzustand die einzige Aussage). Keine
  Fehler-/Warnfarbe.
- **Auswahl-Hervorhebung** in der Liste: linke 3px-Kante `--color-primary-600`
  + Fläche `--color-primary-50` + `aria-current="true"`. Bleibt, auch wenn der
  Ort durch eine Filteränderung aus der sichtbaren Liste fällt.
- **Schließen ab `lg`**: Icon-only „×" (`aria-label` „Detailansicht
  schließen"), sticky an der Stelle der mobilen Zurück-Aktion, ersetzt dort
  „Zurück". Derselbe History-Schritt wie Browser-Zurück. Erneuter Klick auf die
  gewählte Zeile schließt nicht (kein Toggle).
- **Wechsel des Inhalts** (Auswahl ↔ leer, Ort A ↔ Ort B): **Sprung, keine
  Zustandsanimation**, kein Crossfade. Gründe: Auswahl ↔ leer überblendet
  strukturell verschiedene Inhalte (Doppel-Eindruck); A ↔ B überblendet zwei
  fast positionsgleiche Formulare (Ghosting); Auswahl-Hervorhebung und
  Fokusbewegung bestätigen den Wechsel bereits (Bewegung erklärt, dekoriert
  nicht — design-concept.md „Motion"). Einheitlich mit dem Ansichtswechsel
  Liste ↔ Karte.
- **Fokus**: Jeder Wechsel des Detailinhalts auf einen (anderen) Ort — Öffnen
  ohne Auswahl **und** Wechsel A → B — bewegt den Fokus auf „Detailansicht
  schließen" (kein zweites Zielelement), unabhängig vom Auslöser (Klick,
  Browser-Zurück/-Vor, Deep-Link): es gibt nur eine Quelle
  (`route.params.ortId`, ADR-0011 Punkt 4) und einen Fokus-Mechanismus.
  Schließen oder Löschen gibt den Fokus auf die zugehörige Listenzeile bzw.
  die nachrückende Zeile, nicht an den Listenanfang.
- **Scroll-Position beim Wechsel** (zu ADR-0011 Punkt 6): Die Detail-Spalte
  beginnt bei jedem Wechsel A → B bei Versatz 0, unabhängig von Auslöser (derselbe
  `watch(ortId)`-Mechanismus wie beim Fokus). Die Listen-Spalte behält ihren
  Versatz, solange die neue Zeile sichtbar ist; liegt sie außerhalb, scrollt
  sie ohne Animation **gerade so weit**, dass die Zeile sichtbar wird
  (`scrollIntoView({block: 'nearest'})` oder gleichwertig; kein Zentrieren,
  kein Scroll-zum-Anfang, kein `smooth`). Nur ab `lg`; darunter vollflächige
  Detailansicht mit eigenem Scrollcontainer (ADR-0033).
- **Breakpoint-Wechsel bei offener Detailspalte**: Unter `lg` vollflächige
  Detailansicht (nicht zurück zur Liste); über `lg` derselbe Ort offen,
  zweispaltig. Reiner CSS-Layoutwechsel bei gleicher Adresse: kein
  Navigations-Event, kein Refetch, keine Reflow-Animation.
- **Breitenabhängige Layouts in der Detail-Spalte** (z. B. Bilder-Raster)
  richten sich nach der Spaltenbreite, nicht nach der Viewport-Breite.
