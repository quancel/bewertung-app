# Design-Historie — bewertung-app

> Stand: 2026-11-25. Verdichtete Änderungshistorie von `design-conventions.md`
> und `design/*.md`: eine Zeile je Runde mit dem Kern der Entscheidung.
> **Nur Historie, keine geltenden Regeln** — gültig ist ausschließlich, was in
> der Hauptdatei bzw. den Themendateien steht. Rücklink:
> [design-conventions.md](../design-conventions.md).

## Runden

| Runde | Datum / Paket | Kern der Entscheidung |
|-------|---------------|-----------------------|
| A | 2026-09-07 (010/001/002) | Tokens, Zustände, Formulare angelegt. Runde 2 von 002: Wert 0 und „nicht bewertet" sind getrennte Zustände. |
| B | 003/004 | Sortieren/Filtern. Runde 2 von 004: UND/ODER-Verknüpfung des Tag-Filters. |
| C | 005/006/008 | Karte, Bilder, Ortssuche. |
| D | 007/009 | Update-Hinweis der Offline-Auslieferung, Export/Import. |
| — | 011 (Runde 2), 012 | Navigation, Zurück-Verhalten, Navigationschrome-Regel; Master-Detail ab `lg`. |
| — | Nachtrag 003/004 | Werkzeugleiste für die ~400px-Listen-Spalte: zwei Zeilen bleiben zwei Zeilen, Tag-Filter-Zurücksetzen an festen rechten Rand. Eine frühere breitenumschaltende Einzeilen-Variante ab `lg` ersatzlos gestrichen. |
| — | Nachtrag 006 (ADR-0019) | Ansichtsumschalter in Zeile 1, dritter Karten-Leerzustand, Abschnitt „Ansichtswechsel innerhalb eines Bereichs". Zweite Nachtragsrunde: zweizahlige Kartenansicht-Trefferzahl samt Kurzform-Schwelle. |
| — | Korrektur 2026-09-11 (012) | 180ms-Crossfade des Master-Detail-Inhaltswechsels ersatzlos gestrichen (nie gebaut, nicht gefordert, Ghosting-Risiko); Inhaltswechsel ist projektweit ein Sprung. |
| — | Korrektur 2026-09-11 (Ortssuche) | „Lädt"-Regel gilt nur für Aktionen mit eigenem auslösenden Bedienelement, nie für Type-ahead ohne Button; Ladehinweis-Text als Konvention unter „Listen". |
| — | Korrektur 2026-09-12 (PO-2026-09-12-003) | Hinweistexte der Ortssuche stehen im Dokumentfluss, nur die Trefferliste überlagert (vorher: gemeinsame Überlagerungsfläche verdeckte auf schmalen Geräten Folgefelder). Vorschlagsliste schließt auch bei Blur/Tap außerhalb. |
| — | Korrektur 2026-09-12 (PO-2026-09-12-002) | Koordinatenzeile ragte auf 320–390px aus dem Bildschirm: Zahlenfeld-Paare stehen untereinander. |
| — | 2026-09-12 (PO-2026-09-12-005) | Koordinatenfelder werden vom gleichberechtigten Feldpaar zum Notnagel; Abschnitt „Bedingt sichtbare Formularabschnitte (Reveal ohne Rückweg)". |
| 4 | 2026-09-13 (PO-2026-09-13-001/-002) | Regler-Thumb einer frischen Achse war per `opacity: 0` unauffindbar: Thumb immer sichtbar, „nicht gesetzt"/„gesetzt" über Farbe statt Sichtbarkeit. Zweiter, unabhängiger Fehler im Commit-Pfad. |
| 5 | 2026-09-15 (Nachprüfung `architekt`) | Jeder Eingabepfad (auch nativer Regler) läuft durch Runden-und-Klemmen-Logik (ADR-0007 Punkt 7); bei `null` gibt es am linken Bahnende kein `input` — Zusatz-Commit auf `pointerup`/`keyup`. Baseline „Farbe nie alleiniger Bedeutungsträger" über die drei Nachbar-Auszeichnungen benannt. |
| 6 | 2026-09-16 (PO-2026-09-16-001) | iOS Safari: `accent-color` tönt bei `range` nur die gefüllte Bahn links vom Thumb, bei Position 0 ist nichts sichtbar. Thumb trägt Sichtbarkeit selbst (`::-webkit-slider-thumb`/`::-moz-range-thumb`). |
| 7 | 2026-09-17 (PO-2026-09-16-001) | Runde 6 vom `architekt` als unerfüllbar zurückgewiesen (Degradations-Satz führte in den Fehler zurück). Nutzerentscheidung: `appearance: none` auch auf dem `<input>`, Bahn und Thumb komplett selbst gezeichnet; `accent-color` entfällt; Bahn sitzt als Anker auf dem `<input>` selbst. |
| 8 | 2026-09-17 | Thumb-Durchmesser 24px wird benannte Design-Festlegung (Auffindbarkeit nach drei Korrekturrunden), nicht mehr freie Bemessung des Leads. |
| 9 | 2026-09-26 (PO-2026-09-26-001) | Unbestätigter Tag-Text verschwand lautlos beim Verlassen des Feldes. Nutzerentscheidung: gilt als gewollter Wert, Commit über vier Auslöser; „Text verwerfen" und „unbestätigter Entwurf" abgelehnt. Einzige Ausnahme von „Autosave ohne Bestätigung": Rückkehr-Markierung. Ort-A-Text im Feld von Ort B → `:key`-Remount wie `Ortssuche`. |
| 10 | 2026-09-26 (PO-2026-09-26-002) | Listen-Spalte ab `lg` bei offenem Detail ausgeblendet (Spezifität einer unbedingten Regel). Kein neues Verhalten: Zweispaltigkeit gilt strukturell, Ausblendregeln müssen auf < 1024px begrenzt sein. |
| 11 | 2026-09-26 (PO-2026-09-26-003) | Fokus in die Detailspalte auch bei Wechsel A → B; Detail-Spalte beginnt bei A → B bei Versatz 0, Listen-Spalte behält ihren. Wiederherstellung des in ADR-0011 Punkt 6 Gemeinten, kein neues Verhalten. |
| 12 | 2026-09-27 (PO-2026-09-27-001) | Kommentarfelder schnitten nach zwei Zeilen ab: mehrzeilige Felder wachsen mit dem Inhalt, kein Resize-Handle. |
| 13 | 2026-09-27 (PO-2026-09-27-002) | Anfangsnotiz (100 Zeichen, nie Zeilenumbruch): „Kurztextfeld mit Zeichenobergrenze" und „Ortszeile: Sekundärzeile"; Wrap statt Kürzen jetzt bindend. |
| 14 | 2026-09-27 (PO-2026-09-27-003) | Zonenfarben (fünf) und Hervorhebungs-Schatten (zwei Stufen) der Ortsliste; Kombination mit der Auswahlkante in einer `box-shadow`-Deklaration. |
| 15 | 2026-09-27 (PO-2026-09-27-004) | Kommentar einer Bewertungsachse ging bei Ortswechsel u. a. verloren: Commit über dasselbe Vier-Auslöser-Muster wie Tags, kein Enter-Commit, keine Rückkehr-Markierung. Ursache war der fehlende ortsgebundene `:key` an `Bewertungsachse.vue` (inzwischen gesetzt, siehe CLAUDE.md). |
| 16 | 2026-09-28 (Meldung `frontend-lead`) | Kopfzeile der Ortsliste bei 320px: Button-Label brach intern um. `@container`-Fallback auf zwei Zeilen unter 360px, keine Icon-only-Variante. |
| 17 | 2026-11-24 (PO-2026-11-24-001…007) | Neu: Gewichtung der Gesamtnote, Karten-Marker/Namen/Ausschnitt, Quick-Look-Sheet, Bildvorschau. Zonen-Träger: Plakette statt Text + 2px-Rand (Zone 8 lag farblich zu nah an der Zahl ohne Zone), Hairline-Schatten, beschrifteter Legenden-Auslöser statt Icon-only (Nutzer fand die Legende nicht). Vom Nutzer bestätigt: Plakette, Hairline, „Sortierpunkte" = Wert-Slot, „Bearbeiten" als Sekundär-Button, Ausschnitt nach Filteränderung wiederherstellen. |
| 18 | 2026-11-25 (Nachpflege nach Abnahme) | Verbindliche Texte für Orte ohne Gesamtnote, Zoom-Knopf „voll" ausgeblendet/inert, Flick-Regel der Schnellansicht (Nutzer bestätigt), Abschnitt „Zieh- und Wisch-Schwellen", Listen-Zeilenabstand `--space-8`, Legendensatz bestätigt (kein zweiter Erklärsatz). |
| 19 | 2026-11-25 (Kuratierung) | Datei von ~1640 auf < 300 Zeilen verdichtet, Detailwissen in `design/*.md` ausgelagert; keine inhaltliche Änderung. Der Hinweis „`Bewertungsachse.vue` wird bei Ortswechsel nicht neu gemountet" entfiel als überholt (Remount seit PO-2026-09-27-004, siehe CLAUDE.md). |
