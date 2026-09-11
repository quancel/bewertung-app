# ADR-0020: Ortssuche — Photon als Geocoder, Suche beim Tippen, im Context `orte` statt `karte`

- **Status**: accepted
- **Datum**: 2026-09-11 (ersetzt den Entwurf vom 2026-09-10, siehe
  „Revision" am Ende)
- **Bounded Context(s)**: `orte`, `karte`, `app-shell`
- **task_id**: `PO-2026-09-07-008`

## Nutzerentscheidung vom 2026-09-10 (gesetzt, nicht abgeleitet)

**Anbieter ist Photon (`photon.komoot.io`), und die Suche läuft beim Tippen**
— so, wie die `design_notes` und `design-conventions.md` sie entworfen haben
(entprellte Vorschlagsliste). Der Architekt hatte Nominatim mit ausdrücklicher
Suchaktion vorgeschlagen; der Nutzer hat die Alternative gewählt, in Kenntnis
des Nachteils (informelle Nutzungsbedingungen ohne Betreiberzusage). Wer das
später anders erwartet, hat keinen Architekturfehler gefunden.

## Kontext

PO-2026-09-07-008 schickt **Nutzereingaben** an einen fremden Dienst — eine
Stufe schärfer als die Kartenkacheln aus ADR-0018, die nur einen Ausschnitt
anfragen. Die App hat keine Server-Seite, auf der ein Schlüssel liegen könnte
(ADR-0001); ein Anbieter mit API-Schlüssel hätte ihn im ausgelieferten
Bundle. Das Paket ist laut Request ausdrücklich streichbar.

Nominatim schied aus, weil seine Usage Policy auf eine Anfrage pro Sekunde
deckelt und Auto-Complete-Suche ausdrücklich als unzulässige Nutzung führt —
die entworfene Interaktion wäre damit nicht erlaubt gewesen. Photon ist genau
für diesen Fall gebaut.

## Was über Photon festgehalten ist

Ehrlich getrennt nach Belegbarkeit, damit später niemand das eine für das
andere hält:

- **Software**: Photon ist quelloffen (Apache-2.0) und lässt sich selbst
  betreiben. Die Daten stammen aus OpenStreetMap und stehen unter **ODbL** —
  Attribution ist Pflicht, sichtbar an der Trefferliste.
- **Öffentlicher Endpunkt**: `photon.komoot.io` wird von komoot kostenlos
  bereitgestellt, ausdrücklich für Type-ahead-Suche. Es gibt **keine
  dokumentierte Rate-Begrenzung, keine Verfügbarkeitszusage und keinen
  Vertrag** — nur die Bitte um faire Nutzung und den Hinweis, für hohe Last
  selbst zu hosten. Das ist der Preis der Nutzerentscheidung und der Grund
  für die Sparsamkeitsregeln in Punkt 3.
- **Antwortform**: GeoJSON-`FeatureCollection`. Je Treffer
  `geometry.coordinates` als **`[longitude, latitude]`** (GeoJSON-Reihenfolge,
  also `laenge` zuerst) und `properties` mit u. a. `name`, `street`,
  `housenumber`, `postcode`, `city`, `district`, `state`, `country`,
  `countrycode`, `osm_id`, `osm_key`, `osm_value`. Ein fertiges Anzeigefeld
  wie Nominatims `display_name` gibt es **nicht**; die lesbare Zeile wird
  zusammengesetzt.
- **Nicht geprüft**: Der Architekt konnte die Antwortform in dieser Sitzung
  **nicht gegen den laufenden Dienst prüfen** (kein Netzzugriff im
  Werkzeugsatz). Die Feldnamen oben stammen aus der öffentlichen
  Dokumentation. Der `frontend-lead` prüft Feldbestand, CORS-Header und
  Parameterverhalten im ersten Durchstich, **bevor** er die UI baut. Genau
  dafür steht das Anbieterwissen an einer einzigen Stelle (Punkt 2): Weicht
  die Antwort ab, ändert sich eine Datei und sonst nichts.

## Entscheidung

1. **Die Ortssuche gehört zum Context `orte`, nicht zu `karte`.** Sie füllt
   ausschließlich Felder des Ort-Datensatzes (`adresse`, `breite`, `laenge`),
   deren Besitzer `useOrteStore` ist (ADR-0008); ihr einziger Einsatzort ist
   die Detailansicht in `features/orte/`; und sie braucht von der Karte
   nichts — kein Leaflet, keine Kachel, keinen Marker. `karte` ist seit
   ADR-0019 Punkt 8 ein rein präsentationaler Context um eine Fremd-Bibliothek;
   ein HTTP-Client für Adressen hätte dort nichts zu suchen. Dateien:
   `src/features/orte/lib/geocoding.ts` und
   `src/features/orte/components/Ortssuche.vue`.
2. **Anbieterwissen steht genau an einer Stelle**: `geocoding.ts`. Nur diese
   Datei kennt Endpunkt (`https://photon.komoot.io/api/`), Parameter
   (`q`, `limit=6`, `lang=de`) und Antwortform. Außerhalb existiert kein
   Anbieter-Feldname (`features`, `properties`, `geometry`, `osm_id`). Sie
   liefert je Treffer eine **fertige Anzeigezeile** und die drei Zielwerte
   `{ adresse, breite, laenge }`; die Zusammensetzung der Adresse aus
   `street`/`housenumber`/`postcode`/`city`/`country` (mit `name` als
   Rückfall, wenn es keine Straße gibt) steht dort, nicht in der Komponente.
   **`laenge = coordinates[0]`, `breite = coordinates[1]`** — die
   GeoJSON-Reihenfolge ist lon/lat und damit vertauscht gegenüber der
   Alltagsschreibweise; die Umkehrung ist der wahrscheinlichste Fehler dieses
   Pakets und gehört in einen Test.
3. **Suche beim Tippen, aber sparsam.** Entprellt nach der letzten Eingabe
   (300ms, `design_notes`), **erst ab drei Zeichen**, nie bei leerer oder nur
   aus Leerraum bestehender Eingabe. Eine laufende Anfrage wird bei einer
   neuen abgebrochen (`AbortController`); Antworten in falscher Reihenfolge
   werden verworfen. Ein unverändert wiederholter Suchtext erzeugt **keine**
   neue Anfrage, sondern zeigt die letzte Antwort. Jede Anfrage hat eine
   Zeitüberschreitung. Diese Regeln sind kein Komfort, sondern die
   Gegenleistung für einen Dienst ohne Rate-Zusage.
4. **Ergebnis statt Ausnahme** (Muster aus ADR-0005): `geocoding.ts` liefert
   ein unterscheidbares Ergebnis — Treffer · keine Treffer · kein Netz ·
   Fehler/Zeitüberschreitung. Kein `throw`, kein verschlucktes `try/catch`.
   Die drei gemuteten Texte der `design_notes` hängen genau an dieser
   Unterscheidung.
5. **Datensparsamkeit ist Teil der Entscheidung.** Übertragen wird
   ausschließlich der eingetippte Suchtext. **Kein `lat`/`lon`-Bias und keine
   `bbox`**, obwohl Photon das anbietet: Das würde den Aufenthalts- oder
   Bestandsort mitsenden, ohne dass der Nutzer danach gefragt hat. Keine
   Ort-IDs, keine vorhandenen Koordinaten, keine Telemetrie. Antworten werden
   nicht gespeichert; persistiert wird nur die Übernahme, über
   `useOrteStore` wie jede andere Feldänderung (ADR-0005). Die Anwendung
   identifiziert sich — wie bei den Kacheln — über den **Referer** ihrer
   Origin; ein `User-Agent` ist aus dem Browser nicht setzbar, weshalb
   `no-referrer` in keiner Form gesetzt werden darf (ADR-0018 Punkt 3).
6. **Kein neues Feld, keine Formatänderung.** `adresse`, `breite` und `laenge`
   existieren seit PO-2026-09-07-001. `SCHEMA_VERSION` bleibt 4, kein
   Migrationsschritt, kein Fixture. Übernommene Werte sind danach gewöhnliche,
   einzeln editier- und löschbare Felder — kein „gesperrt, weil aus der Suche
   übernommen"-Zustand. Leere Werte bleiben `null`, nie `''` oder `0`
   (`0` ist eine gültige Koordinate).
7. **Die Streichbarkeit bleibt erhalten.** Zwei neue Dateien plus eine
   Einbindung; kein anderes Paket hängt daran, `karte` erst recht nicht. Der
   Weg „von Hand eintragen" bleibt vollständig und unberührt.

## Konsequenzen

- Positiv: Die entworfene Interaktion bleibt unverändert gültig — es muss
  weder eine `design_note` noch ein Eintrag in `design-conventions.md`
  überstimmt oder nachgepflegt werden.
- Positiv: Kein Schlüssel im Bundle, keine Registrierung, kein Konto, kein
  Betriebsanteil — ADR-0001 bleibt unangetastet.
- Negativ/Trade-off: Der Dienst kann ohne Vorwarnung verschwinden, langsamer
  werden oder die Nutzung einschränken; es gibt niemanden, bei dem man das
  reklamieren könnte. **Was dann passiert, ist bereits entworfen**: Der
  Ausfallpfad („Suche gerade nicht möglich. … trag die Daten von Hand ein.")
  ist ein regulärer Zustand, das Formular bleibt vollständig bedienbar, und
  das Paket ist streichbar. Ein Wechsel — auf Nominatim mit ausdrücklicher
  Suchaktion, auf eine selbst betriebene Photon-Instanz oder auf gar keine
  Suche — ändert `geocoding.ts` und höchstens den Auslöser, sonst nichts.
- Negativ/Trade-off: Jeder Tastendruck kann (nach Entprellung) eine Anfrage
  an einen Fremd-Host auslösen. Das ist der Unterschied zur ausdrücklichen
  Suchaktion und der Grund, warum Punkt 3 nicht verhandelbar ist.
- Betrifft künftig: Jeder weitere Fremddienst-Zugriff folgt dieser Bauform —
  eine Datei kennt den Anbieter, ausdrückliches Ergebnis statt Ausnahme,
  Datensparsamkeit als Vorgabe, Ausfallpfad im Feature. Die drei erlaubten
  Netz-Zwecke aus ADR-0001 bleiben abschließend.

## Alternativen (kurz)

- **Nominatim mit ausdrücklicher Suchaktion (kein Type-ahead)** — war der
  Vorschlag des Architekten vom 2026-09-10: dokumentierte Policy, aber die
  Policy deckelt auf 1 Anfrage/Sekunde und verbietet Auto-Complete. Durch
  Nutzerentscheidung ersetzt; bleibt die naheliegende Rückfallposition, falls
  Photon ausfällt.
- **Anbieter mit API-Schlüssel (Google, Mapbox, MapTiler, HERE)** — verworfen:
  Der Schlüssel läge im ausgelieferten Bundle. ADR-0001 hält das ausdrücklich
  als Ausschlusskriterium fest.
- **Eigener Proxy, der den Schlüssel hält** — verworfen: Das ist ein
  Backend-Dienst und löste ADR-0001 ab. Für eine optionale Bequemlichkeit der
  falsche Preis.
- **Selbst betriebene Photon-Instanz** — verworfen für dieses Paket: dieselbe
  Ablösung von ADR-0001 (Betrieb, Hardware, OSM-Import). Bleibt der Weg, falls
  die Nutzung je über „fair" hinauswächst.
- **Paket streichen, Koordinaten nur von Hand** — weiterhin zulässig und
  jederzeit möglich, aber nicht nötig.
- **Ortssuche in `karte`, weil beide Netz-Zwecke zusammengehören** —
  verworfen: „braucht Netz" ist eine Infrastruktur-Eigenschaft, keine
  fachliche Zusammengehörigkeit. Die Suche schreibt `orte`-Felder und wird
  nur dort benutzt.

## Revision

Der Entwurf vom 2026-09-10 entschied **Nominatim ohne Type-ahead** und
überstimmte dafür die entprellte Suche aus den `design_notes` sowie den
Eintrag „Vorschlagsliste (Autocomplete) … wiederholt für die Ortssuche (008)"
in `design-conventions.md`; daraus folgte ein Nachpflege-Auftrag an den
`ux-ui-designer`. Beides ist mit der Nutzerentscheidung vom 2026-09-10
**hinfällig** — die Konvention und die `design_notes` gelten unverändert, und
der Nachpflege-Auftrag entfällt ersatzlos. Ebenfalls aus dem Entwurf
gestrichen: der Mindestabstand von einer Sekunde zwischen zwei Anfragen (eine
Nominatim-Auflage) und der `email`-Parameter-Ausschluss (ein
Nominatim-Parameter). An ihre Stelle treten die Sparsamkeitsregeln in Punkt 3.
Punkt 1 (Context `orte`) stand im Entwurf auch auf dem Argument, ein Import
aus `karte` erzeuge einen Feature-Zyklus; das ist seit ADR-0019 Punkt 8 nicht
mehr der Fall, die übrigen Gründe tragen die Entscheidung aber unverändert.
