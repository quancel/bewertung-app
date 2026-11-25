# Formulare und Eingabefelder

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: Formulare (Detailregeln), Mehrzeilige Textfelder, Kurztextfeld mit
> Zeichenobergrenze, Bedingt sichtbare Formularabschnitte, Vorschlagsliste,
> Netzabhängige Type-ahead-Aktion. Commit-Regeln: [commit-ohne-enter.md](commit-ohne-enter.md).
> Regler/Achsenwerte: [regler-bewertungsachse.md](regler-bewertungsachse.md).

## Formulare (Detailregeln)

Kernregeln (Pflichtfelder, Klemmen, Autosave) stehen in der Hauptdatei.

- **Zahleneingabe ist bei Regler-Pendants die primäre Quelle**; der Regler ist
  unterstützend, bidirektional synchron, **immer mit sichtbarem, bedienbarem
  Thumb** (auch ohne Wert, PO-2026-09-13-002) und committet auf **jedes**
  `input`-Ereignis, nicht erst auf `change`.
- **Jeder** Eingabepfad eines Achsenwertes (auch der native Regler) läuft
  durch dieselbe Runden-und-Klemmen-Logik (ADR-0007 Punkt 7): Was aus dem
  `<input>` kommt, ist zunächst ein String; „bereits gültige Zahl" wäre eine
  Annahme über Browserverhalten und dauerhaft passende `min`/`max`/`step`.
- **Sonderbehandlung bei `null`**: Steht der Regler bei „nicht bewertet"
  optisch auf 0, löst ein Tipp aufs linke Bahnende **kein** `input` aus. Der
  Regler committet deshalb zusätzlich bei `pointerup` und bei `keyup` auf
  Pfeil-/Pos1-/Ende-/Bild-Tasten — **nur solange der Wert `null` ist**.
- **Zahlenfeld-Paare (z. B. Koordinaten) stehen untereinander**, je ein volles
  Feld pro Zeile, kein Flex-Row (PO-2026-09-12-002: bei 320px bleiben
  nebeneinander ~136px je Feld, „-179.999999" braucht ~120px Text). Ohne
  Breitenumbruch/Container Query. **Ausnahme**: Zahl+Regler der
  Bewertungsachse (feste 64px-Zahl neben schrumpfendem Regler,
  `min-width: 0`) — die Zahl ist kurz (0–10, max. 2 Nachkommastellen).

## Mehrzeilige Textfelder wachsen mit dem Inhalt

Erstmals für die vier Achsen-Kommentare (PO-2026-09-27-001); gilt für jedes
künftige mehrzeilige Textfeld, nicht für einzeilige wie Bezeichnung/Adresse.

- **Keine Obergrenze, kein internes Scrollen**: Inhalt immer vollständig
  sichtbar (Öffnen, Tippen, Einfügen, Löschen); die Höhe folgt der Zeilenzahl.
- **Kein Resize-Handle** (`resize: none`): ein von Hand verkleinertes Feld
  bliebe ohne Eingabe-Ereignis dauerhaft mit Scrollleiste stehen.
- **Neuberechnung nicht nur bei `input`**: auch bei programmatischem
  Inhaltswechsel (Öffnen über „Kommentar hinzufügen", erstes Anzeigen eines
  vorhandenen Kommentars, Wertwechsel von außen) und bei reiner
  Breitenänderung ohne Textänderung.
- **Höhe springt**, keine Anwachs-/Schrumpf-Animation.
- Muss in **jedem** unterstützten Browser wirken (kein bloß optisches,
  degradierbares Detail; der Rauchtest prüft nur Chromium, ADR-0023 Punkt 5).
- Lange leerzeichenlose Zeichenfolgen brechen im Feld um.
- Ein neu geöffnetes leeres Feld startet auf Mindesthöhe (zwei Zeilen).

## Kurztextfeld mit Zeichenobergrenze

Erstmals Anfangsnotiz (PO-2026-09-27-002, max. 100 Zeichen); gilt für jedes
Feld mit reinem Fließtext und harter Obergrenze ohne gespeicherten Zeilenumbruch.

- **Wert ohne `\n`, Anzeige trotzdem mehrzeilig wachsend** nach „Mehrzeilige
  Textfelder" (Feld-Chrome wie Bezeichnung/Adresse: 1px `--border`, Radius
  8px, Platzhalter „noch nichts eingetragen", Mindesthöhe zwei Zeilen). Ein
  einzeiliges `<input>` mit horizontalem Scrollen ist **kein** Ersatz.
- **Enter bleibt wirkungslos** (`keydown` Enter: `preventDefault`). Commit nur
  über die vier Auslöser aus [commit-ohne-enter.md](commit-ohne-enter.md), kein fünfter.
- **Zeichenzähler nur bei Fokus**, „{aktuell}/{Grenze}", `--text-muted`/
  `font-size-14`, direkt unter dem Feld; keine Farbeskalation (die Grenze ist
  kein Fehler, das Feld nimmt nur nichts mehr an).
- **Keine Rückkehr-Markierung** (ein Textfeld ändert beim Commit seine Form nicht).

## Bedingt sichtbare Formularabschnitte (Reveal ohne Rückweg)

Erstmals Koordinatenfelder als Notnagel (PO-2026-09-12-005).

- **Reveal statt Toggle**: genau **ein** Bedienelement zeigt den Abschnitt,
  kein Wiedereinklappen. Bis dahin ein zurückhaltender Text-Button
  (`--color-primary-700`, kein Rahmen/Fläche), min. 44×44px,
  `aria-expanded="false"`, `aria-controls` auf die stabile ID des Wrappers.
  Aktiviert ersetzt der Abschnitt den Button an derselben Stelle.
- **Einmal sichtbar, bleibt sichtbar** für die Lebensdauer der geöffneten
  Instanz (ein zustandsgesteuertes Erscheinen zieht kein zustandsgesteuertes
  Verschwinden nach sich). Beim erneuten Öffnen derselben oder einer anderen
  Instanz gilt die Sichtbarkeitsregel von vorn, der Zustand wird nicht
  gespeichert (ADR-0006/ADR-0009 sinngemäß). Bei mehreren Instanzen in einer
  Ansicht ist die Kennung an die Instanz-ID gebunden.
- **Fokus wandert nur bei manueller Auslösung** ins erste Feld; bei
  automatischem Einblenden (z. B. fehlgeschlagener Abruf) bleibt er.
- **Mehrere unabhängige Auslöser** sind ODER-verknüpft, nie exklusiv.
- Ein-/Ausblenden 180ms ease-out; reduzierte Bewegung ersetzt statt entfällt.

## Vorschlagsliste (Autocomplete)

Tag-Eingabe und Ortssuche. Unter dem Feld, max. ~6 Einträge, Teilstring
case-insensitive, Pfeiltasten + Enter; Escape **und** Blur/Tap außerhalb
schließen (PO-2026-09-12-003; gilt für jedes Vorkommen). Ein am selben Ort
bereits vergebener Tag, erneut exakt bestätigt: nichts passiert (kein zweiter
Pill, keine Meldung).

## Netzabhängige Type-ahead-Aktion (z. B. Ortssuche)

Läuft beim Tippen ohne eigenes auslösendes Element (die „Lädt"-Regel aus
„Zustände" greift hier nicht).

- Vier unterscheidbare, immer gemutete Texte ohne Icon/Warn-/Fehlerfarbe:
  **lädt** („Suche läuft…", Schwelle > 400 ms nach der letzten Eingabe, kein
  Spinner), **kein Netz**, **kein Treffer**, **Suchfehler/Zeitüberschreitung**.
- **Nur die tatsächliche Trefferliste** (Vorschlagsliste + Attribution) ist
  eine überlagernde, absolut positionierte Fläche (aktiv bedientes
  Auswahlmenü). **Alle vier Hinweistexte stehen im normalen Dokumentfluss**
  unter dem Feld und schieben Folgefelder nach unten — auch „lädt", damit beim
  Wechsel zwischen den Texten kein Sprung zwischen Überlagerung und Fluss
  entsteht.
- Ein-/Ausblenden des Hinweis-Blocks 180ms ease-out, reduzierte Bewegung
  ersetzt statt entfällt.
- **Koordinaten-Notnagel** (PO-2026-09-12-005): Der bedingt sichtbare
  Koordinaten-Abschnitt (Reveal-Button oder beide Felder) steht direkt unter
  dem Hinweis im selben Fluss. Auslöser (ODER): bereits hinterlegter Wert
  (`breite !== null || laenge !== null`, `0` ist gültig, ADR-0020 Punkt 6) ·
  **kein Netz** (`zeigeKeinNetzHinweis`), **keine Treffer** oder **Fehler/
  Zeitüberschreitung** (`zustand.status`) · manueller Reveal. `laedt`,
  `treffer`, `inaktiv` lösen nicht aus. Felder bleiben in allen Fällen
  bedienbar.
