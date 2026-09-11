# ADR-0018: Kartenbibliothek Leaflet, OSM-Rasterkacheln als einziger Fremd-Host der Karte

- **Status**: accepted
- **Datum**: 2026-09-10
- **Bounded Context(s)**: `karte`, `app-shell`
- **task_id**: `PO-2026-09-07-006`

## Kontext

`design-concept.md` weist Kartenstil und Tile-Anbieter ausdrücklich dem
Architekten zu („gestalterisch relevant, aber eine Architektur-/Lizenz­
entscheidung"). PO-2026-09-07-006 ist zugleich die **erste** Stelle im
Projekt, an der überhaupt ein fremder Host im Spiel ist: ADR-0001 und
`design-concept.md` verbieten Fremd-Hosts für Schriften und Icons, weil sie
die Offline-Zusage brechen; Kartenkacheln sind einer von genau drei erlaubten
Netz-Zwecken und damit die bewusste Ausnahme.

Zu entscheiden sind vier Dinge, die später teuer sind: die **Bibliothek**
(Lizenz, Bundle, Ausfallverhalten), der **Kachel-Anbieter** (Lizenz,
Nutzungsbedingungen, Schlüsselfreiheit — ein ausgeliefertes Bundle kann kein
Geheimnis tragen, ADR-0001), wie **Bibliothek, CSS und Marker** selbst in den
Precache kommen statt am Netz zu hängen, und wie sich das zum generierten
Service Worker aus ADR-0015 verhält.

## Entscheidung

1. **Leaflet (1.9.x) als Kartenbibliothek**, als normale Abhängigkeit in
   `package.json`. Lizenz **BSD-2-Clause** — permissiv, keine Copyleft-Pflicht
   auf das eigene Bundle, keine Registrierung, kein Schlüssel. Größenordnung
   40 KB gzip JS plus CSS. **Kein Wrapper-Paket** (`vue-leaflet` o. ä.): eine
   zweite Abhängigkeit für einen dünnen Adapter, den ein Composable in
   `features/karte/composables/` in wenigen Zeilen selbst leistet.
2. **Rasterkacheln, keine Vektorkacheln.** Der Ausfallpfad des Produkts ist
   „Kachelfläche bleibt leer, Marker bleiben" (`design-concept.md`,
   `design-conventions.md`). Rasterkacheln sind einzelne `<img>`-Anfragen:
   Fällt eine aus, fehlt genau ein Bild, während Marker, Zoom und Bedienung
   weiterlaufen. Vektorkacheln brauchen zusätzlich Style-JSON, Glyphen und
   Sprites vom selben Fremd-Host — ohne Netz fehlen dann auch Beschriftungen
   und Symbole, und der WebGL-Kontext ist ein zweiter Ausfallweg, den niemand
   entworfen hat.
3. **Kachel-Anbieter ist der Standard-Kachelserver von OpenStreetMap**
   (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, ohne
   `{s}`-Subdomain-Schema, `maxZoom: 19`). Er ist der einzige ernsthaft
   verfügbare Anbieter **ohne API-Schlüssel**; alle Alternativen (MapTiler,
   Stadia, Thunderforest, Carto mit Konto) verlangen einen Schlüssel, der in
   einem statischen Bundle offen läge — ADR-0001 schließt das aus.
   Damit ist die Kartendarstellung an die **OSM Tile Usage Policy** gebunden:
   - Attribution ist **Pflicht**, sichtbar an der Karte („© OpenStreetMap-
     Mitwirkende"). Leaflets `attributionControl` bleibt an; die Attribution
     ist keine Stilfrage und wird nicht wegoptimiert.
   - Kein Bulk-Download, kein Vorabladen von Kacheln, kein eigener
     Kachel-Cache (siehe Punkt 5).
   - Die Anwendung identifiziert sich über den **Referer** ihrer eigenen
     Origin. Ein `User-Agent` ist aus dem Browser nicht setzbar (verbotener
     Header-Name); deshalb darf weder `<meta name="referrer" content="no-referrer">`
     noch eine `referrerPolicy`, die die Origin unterdrückt, gesetzt werden.
   Die Wahl trägt, solange die App das bleibt, was sie ist: ein persönliches
   Werkzeug ohne Login, mit dem Gerät als endgültigem Speicher (ADR-0001).
4. **Marker sind `L.divIcon`, keine Bilddateien.** Das Marker-Aussehen kommt
   aus eigenem Markup plus CSS (`--color-accent-500`, einziger
   Verwendungszweck laut `design-concept.md`). Damit entfällt zugleich der
   bekannte Bundler-Fallstrick, dass Leaflets Standard-Icon seine PNGs relativ
   zur Bibliothek nachlädt, und der Marker ist als DOM-Element fokussierbar
   und beschriftbar (Tastaturbedienung laut `design_notes`).
5. **Der Service Worker aus ADR-0015 wird nicht angefasst.** Kein
   `runtimeCaching`, keine Strategie, kein Handler für den Kachel-Host —
   ADR-0015 Punkt 8 gilt unverändert. Konkret heißt das:
   - **Bibliothek, CSS und alle von Leaflets CSS emittierten Bilder landen
     über den normalen Vite-Build im Bundle** und damit automatisch in der
     generierten Precache-Liste (`globPatterns` decken `js`, `css`, `png`,
     `svg` bereits ab). Ein neues Dateiformat kommt nicht hinzu; die Liste in
     `vite.config.ts` bleibt, wie sie ist.
   - **Kacheln werden nie precacht.** Sie sind Fremd-Inhalt, ihr Ausfall ist
     ein entworfener Zustand und die OSM-Policy verbietet das Vorratsladen.
   - `navigateFallback` ist unberührt: Kachelanfragen sind `<img>`-Anfragen,
     keine Navigationen, und laufen ohne Zutun des Service Workers ins Netz.
   - `scripts/verify-precache.mjs` bekommt eine zusätzliche Prüfung: **in
     `dist/sw.js` darf kein Fremd-Host vorkommen**. Das ist die billigste
     Absicherung gegen ein späteres, versehentliches `runtimeCaching`.
6. **Leaflet wird ausschließlich in `src/features/karte/` importiert** — Code
   wie CSS. Kein Import in `main.ts`, `src/styles/`, `src/shared/` oder einem
   anderen Feature. Damit die Bibliothek den Einstieg nicht belastet, muss
   sie zusätzlich in einem **eigenen, lazy geladenen Chunk** liegen.
   *(Präzisiert am 2026-09-11:* Dieses ADR ging von einer eigenen Kartenroute
   aus, deren Lazy-Import das von selbst erledigt hätte. Seit ADR-0019 ist die
   Karte eine Ansicht des Bereichs Orte — und `/orte` ist die **Startroute**.
   Ein statischer Import der Kartenfläche aus `Ortebereich.vue` legte Leaflet
   damit ins Einstiegs-Bundle. Die Einbindung erfolgt deshalb asynchron
   (`defineAsyncComponent`), siehe ADR-0019 Punkt 12.*)*
7. **Die Leaflet-Karteninstanz ist kein reaktiver Zustand.** Sie wird in einer
   nicht-reaktiven Referenz gehalten (`shallowRef`/lokale Variable), nie in
   `ref()`/`reactive()`: Vue würde sie sonst tief proxyen, was Leaflets
   interne Identitätsvergleiche bricht. Beim Unmount wird `map.remove()`
   aufgerufen.

## Konsequenzen

- Positiv: Keine Registrierung, kein Schlüssel, keine Lizenzpflicht auf den
  eigenen Code — die Karte fügt der Auslieferung keinen neuen Betriebsanteil
  hinzu.
- Positiv: Der entworfene Offline-Zustand fällt aus der Technikwahl heraus,
  statt nachgebaut zu werden: fehlende Kacheln sind fehlende Bilder, alles
  andere läuft weiter.
- Negativ/Trade-off: Der Kachelserver erfährt bei jeder Nutzung den
  betrachteten Kartenausschnitt — also ungefähr, wo die eigenen Orte liegen.
  Das ist mit jedem Online-Kartendienst so und der Preis dafür, dass es
  überhaupt Kartenbild gibt; die Ortsdaten selbst verlassen das Gerät nicht.
- Negativ/Trade-off: Die OSM-Policy ist an eine bescheidene Nutzung gebunden.
  Würde die App nennenswert verbreitet, wäre ein bezahlter Anbieter nötig —
  und der brächte einen Schlüssel ins Bundle. Das wäre eine Ablösung von
  ADR-0001 und braucht dann ein eigenes ADR, keine stille Umstellung der
  Kachel-URL.
- Negativ/Trade-off: Rasterkacheln sehen bei hoher Pixeldichte weniger scharf
  aus als Vektorkacheln und der Kartenstil ist nicht anpassbar. Das ist
  bewusst in Kauf genommen — `design-concept.md` verlangt keinen eigenen
  Kartenstil.
- Betrifft künftig: Jedes Paket, das Leaflet-Funktionen ergänzt (Clustering,
  Zeichnen), prüft Lizenz und Bundle-Anteil des Plugins erneut und importiert
  es weiter nur in `features/karte/`. Ein Wechsel des Kachel-Anbieters ist
  eine ADR-Frage, keine Konfigurationsfrage.

## Alternativen (kurz)

- **MapLibre GL JS (Vektorkacheln)** — verworfen: deutlich größeres Bundle,
  WebGL als zusätzlicher Ausfallweg, und der Offline-Zustand wäre schlechter
  (Style, Glyphen und Sprites kämen ebenfalls vom Fremd-Host). Ein
  schlüsselloser Vektor-Endpunkt existiert praktisch nicht.
- **Mapbox GL JS** — verworfen: proprietäre Lizenz ab v2 und Schlüsselpflicht.
- **OpenLayers** — verworfen: kann mehr, als hier gebraucht wird, bei größerem
  Bundle und aufwendigerer API; der Vorteil bliebe ungenutzt.
- **Statische Kartenbilder (Static-Map-API)** — verworfen: alle Anbieter
  verlangen Schlüssel, und ein Bild kennt keine anklickbaren, tastaturfähigen
  Marker.
- **Kacheln im Service Worker cachen, damit die Karte offline etwas zeigt** —
  verworfen: widerspricht ADR-0015 Punkt 8 und der OSM-Policy, und der
  entworfene Zustand ist ausdrücklich die leere Kachelfläche, nicht ein
  zufälliger Ausschnitt von gestern.
- **Eigenes Kachel-Hosting** — verworfen: das ist ein Betriebsanteil, den
  ADR-0001 gerade ausschließt.
