# Fremdnetz, Netzzustand, Karte

> Themendatei von `.claude/context/code-conventions.md` (Abschnitt „Regeln, die
> die Struktur tragen", Teil Fremdnetz/Karte). Single-Writer: `architekt`.
> Maßgeblich ist dieser Wortlaut samt Ausnahmen, nicht die Kurzzeile im Register.

- **Fremdnetz-Zugriffe** nur für drei Zwecke (Kartenkacheln, Ortssuche,
  Versionsauslieferung), im Feature, das sie braucht, jeder mit Ausfallpfad
  (ADR-0018/0020):
  - **Genau ein Modul kennt den Anbieter** (`features/<context>/lib/<dienst>.ts`);
    kein Anbieter-Feldname außerhalb.
  - **Ausdrückliches Ergebnis statt Ausnahme**: Treffer · keine Treffer ·
    kein Netz · Fehler/Timeout sind unterscheidbar; jede Anfrage mit
    `AbortController` und Zeitüberschreitung.
  - **Datensparsam**: nur die Nutzereingabe, keine Bestandsdaten, keine IDs,
    kein Standort-Bias (`lat`/`lon`/`bbox`), keine Telemetrie. Antworten
    werden nicht gespeichert.
  - **Kein API-Schlüssel im Bundle** — ein Anbieter, der einen verlangt, ist
    nicht wählbar. **Referer nicht unterdrücken** (einzige Identifikation
    gegenüber OSM/Photon). **Attribution ist Pflicht**, sichtbar.
- **Netzzustand** (ADR-0021): `navigator.onLine` und `online`/`offline` nur
  **im Feature**, für einen gemuteten Hinweis an der netzabhängigen
  Bedienstelle und zum Wiederholen eines dort sichtbar fehlgeschlagenen
  Abrufs. Nie Reload, Navigation, Toast, globaler Offline-Balken,
  `disabled`, Store-Zustand. `onLine === false` ist verlässlich, `true` ist
  keine Zusage. Gemeinsame Stelle: `shared/composables/useNetzzustand.ts`.
- **Leaflet nur in `features/karte/`** (ADR-0018), Bibliothek **und** CSS.
  `Kartenflaeche.vue` wird asynchron eingebunden (`defineAsyncComponent`), da
  die Karte an der Startroute hängt. Karteninstanz in `shallowRef`, beim
  Unmount `map.remove()`. Marker als `L.divIcon`; ihre Styles nicht in
  `<style scoped>` (Leaflet-DOM trägt kein `data-v-`). Den Ausschnitt für
  die Sitzung hält ein nicht-reaktives Modul in `karte/composables/`, mit
  Mitte und Zoom, ohne Ort-Daten und ohne Store (ADR-0038). Bestehende
  Marker werden bei Inhaltsänderung aktualisiert (Note, Name, Label) statt
  nur verschoben. Das geschieht in-place und idempotent (`befuelleElement`),
  der Fokus bleibt dabei und es wird nicht eingepasst. Ein Etikett, das
  ausgeblendet werden kann, bleibt im Layout (`opacity`, nicht `display`).
  Nur so lassen sich Kollisionen am gerenderten Rechteck messen. Reine
  Geometrie liegt in `karte/lib/` (`etikettKollision.ts`, `verdeckung.ts`),
  nicht im Composable. `.karte-wrapper` trägt `isolation: isolate`. Ohne
  diesen Stapelkontext liegen Leaflets Bedienelemente (z-index 800/1000)
  über der festen App-Chrome und fangen deren Klicks ab.
