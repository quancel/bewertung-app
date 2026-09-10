# ADR-0015: Offline-Auslieferung über einen generierten Service Worker; Update im Prompt-Modus

- **Status**: accepted
- **Datum**: 2026-09-10
- **Bounded Context(s)**: `app-shell`
- **task_id**: `PO-2026-09-07-007`

## Kontext

Die Kernzusage des Projekts ist, dass die App **einmal** aus dem Netz kommt
und danach vollständig ohne Netz bedienbar ist (ADR-0001). Dafür fehlt bisher
alles: `package.json` enthält keine Service-Worker-Abhängigkeit,
`vite.config.ts` registriert nur `@vitejs/plugin-vue`, `index.html` bindet
nichts ein (geprüft 2026-09-10).

Drei Dinge sind zu entscheiden, die kein späteres Paket nachholen kann, ohne
den ersten Auslieferungsstand zu brechen: **wie** die Dateiliste entsteht,
**wie** ein Tiefenlink ohne Netz auf die App trifft, und **wann** eine neue
Version wirksam wird. Der letzte Punkt ist an ADR-0005 gebunden: Die App
speichert inline beim Verlassen des Feldes; ein erzwungener Reload verlöre
genau das Feld, in dem gerade getippt wird.

## Entscheidung

1. **Generierter Service Worker über `vite-plugin-pwa` (Workbox,
   `generateSW`).** Die Precache-Liste entsteht aus dem Build, nicht von Hand.
   Ein handgeschriebener Service Worker müsste die gehashten Dateinamen des
   Vite-Builds selbst einsammeln — das ist genau die Aufgabe, die das Plugin
   erfüllt, und eine handgepflegte Liste veraltet beim ersten vergessenen
   Asset unbemerkt. `injectManifest` ist nicht nötig, weil es keine eigene
   Service-Worker-Logik gibt.
2. **Kein Web-App-Manifest, keine Installierbarkeit** (`manifest: false`).
   ADR-0001 hat das bereits festgehalten: Ein installierbares PWA braucht ein
   App-Icon, und `design-concept.md` schließt Logo, App-Icon und Wortmarke
   aus. Offline-Fähigkeit hängt nicht am Manifest.
3. **Die Precache-Liste umfasst ausdrücklich `woff2` und `svg`.** Die
   Vorgabe-`globPatterns` von `vite-plugin-pwa`
   (`**/*.{js,css,html,ico,png,svg}`) enthalten **kein** `woff2` — die
   lokal ausgelieferte Inter-Datei (`src/assets/fonts/inter-variable-latin.woff2`,
   eingebunden per `@font-face` in `src/styles/base.css`) fiele damit aus dem
   Cache, und der Start ohne Netz zeigte die Systemschrift. Das ist genau das
   Kriterium, das -007 nachweisen soll; der Vorgabewert wird deshalb
   überschrieben, nicht übernommen.
4. **Tiefenlinks laufen über `navigateFallback: '/index.html'`, nicht über
   eine Liste der Routen.** Jede Navigation, für die kein Precache-Eintrag
   existiert, wird mit dem App-Einstieg beantwortet; welcher Adresse sie
   entspricht, entscheidet danach `vue-router` im Client. Damit liefert -007
   den Adressraum aus ADR-0010/0011 (`/` → `/orte`, `/orte`,
   `/orte/:ortId`, Sammelroute `/:pfad(.*)*`) vollständig offline aus, **ohne
   ihn zu kennen**. Ein später ergänzter Bereich (`/daten` aus -009, Karte aus
   -006) funktioniert dadurch ohne Änderung an -007. Eine Routenliste im
   Service Worker wäre eine zweite Quelle für den Adressraum, die bei jedem
   neuen Bereich stillschweigend veraltet.
5. **Update im Prompt-Modus, nie automatisch** (`registerType: 'prompt'`).
   Der neue Service Worker geht in `waiting` und übernimmt **ausschließlich**
   auf Nutzeraktion (`skipWaiting` erst beim Klick auf „Jetzt laden", danach
   ein Reload). Kein `autoUpdate`, kein `clientsClaim` ohne Nutzeraktion, kein
   Reload aus einem `controllerchange`-Handler heraus. Grund: ADR-0005 —
   der Schreibvorgang hängt am Verlassen des Feldes.
6. **Der bloße Wechsel Netz ↔ kein Netz löst nichts aus.** Es gibt keinen
   `online`/`offline`-Listener, der eine Meldung, einen Reload oder einen
   Zustand im UI erzeugt. Sichtbar wird ausschließlich das *tatsächliche
   Vorliegen* einer neuen Version.
7. **Caches sind nicht der Datenbestand.** Ein Versionswechsel leert alte
   Workbox-Caches (`cleanupOutdatedCaches: true`) und fasst IndexedDB **nie**
   an (ADR-0004). Kein `caches.delete()` von Hand, kein
   „Zurücksetzen"-Knopf, der beides vermischt.
8. **Kein Runtime-Caching für Fremd-Hosts.** Kartenkacheln (-006) und
   Ortssuche (-008) bekommen von -007 keine Caching-Strategie und keinen
   Handler. Ihre Ausfallpfade sind fachlich entschieden (leere Kachelfläche,
   gemuteter Hinweis) und liegen im jeweiligen Feature. Ein pauschaler
   `NetworkFirst` über fremde Ursprünge würde daraus stillschweigend eine
   dritte Variante machen, die niemand entworfen hat.

## Konsequenzen

- Positiv: Die Offline-Zusage hängt an einer generierten, vollständigen
  Dateiliste statt an Sorgfalt beim Nachtragen.
- Positiv: Punkt 4 entkoppelt -007 vom Adressraum. -009 und -006 dürfen
  Adressen ergänzen, ohne -007 erneut anzufassen — was ADR-0011 für die
  Darstellung bereits zugesagt hat, gilt damit auch für die Auslieferung.
- Negativ/Trade-off: Eine Build-Abhängigkeit (`vite-plugin-pwa`) plus ihre
  Workbox-Laufzeit im ausgelieferten Bundle. Sie ist ohne Datenmigration
  entfernbar; der Preis ist ein zweiter Konfigurationsort neben
  `vite.config.ts` (nämlich der `pwa`-Block darin) und eine Registrierung im
  Client (`virtual:pwa-register/vue`), die eine Typreferenz in
  `src/vite-env.d.ts` braucht.
- Negativ/Trade-off: Prompt-Modus heißt, dass ein Nutzer, der nie klickt,
  beliebig lange auf einer alten Version bleibt. Das ist gewollt — die
  Alternative kostet Eingaben.
- Negativ/Trade-off: Die Offline-Kriterien sind im Node-Testrunner nicht
  prüfbar (`vitest.config.ts`, `environment: 'node'`; es gibt weder eine
  Browser-Umgebung noch `@vue/test-utils`). Prüfbar ist die **Build-Ausgabe**:
  dass `dist/sw.js` entsteht und seine Precache-Liste `index.html`, das
  JS/CSS-Bundle und die `woff2`-Datei enthält. Der Rest (harter Reload ohne
  Netz, Tiefenlink ohne Netz, Update-Toast) ist eine Prüfung am laufenden
  Build.
- Betrifft künftig: **-006/-008** bringen ihre Netz-Zugriffe samt Ausfallpfad
  selbst mit und erben keine Caching-Strategie. **-009** ergänzt `/daten`,
  ohne den Service Worker anzufassen. **Jedes** Paket, das ein neues
  Dateiformat ins Bundle bringt (Schrift, Icon-Sprite, Wasm), prüft die
  `globPatterns` — Punkt 3 ist der Präzedenzfall.

## Alternativen (kurz)

- **Handgeschriebener Service Worker mit eigener Precache-Liste** —
  verworfen: Er müsste die gehashten Build-Dateinamen selbst ermitteln, also
  Workbox nachbauen; eine von Hand gepflegte Liste veraltet unbemerkt, und
  der Fehler zeigt sich erst offline.
- **`registerType: 'autoUpdate'`** — verworfen: lädt die Seite neu, sobald
  die neue Version bereitsteht, und verliert dabei das gerade bearbeitete
  Feld (ADR-0005). Die `design_notes` von -007 nennen genau diesen Grund.
- **Voll ausgestattete PWA mit Manifest und Installierbarkeit** — verworfen:
  braucht ein App-Icon, das `design-concept.md` ausschließt (ADR-0001).
- **`Cache-Control`-Header statt Service Worker** — verworfen: Ein
  HTTP-Cache beantwortet keine Navigation nach einem harten Neuladen ohne
  Netz und kennt keinen `navigateFallback`; der Anbieter des statischen Hosts
  ist zudem offen, seine Header sind also keine verlässliche Grundlage.
- **Precache-Liste um die Routen erweitern (`/orte`, `/orte/:ortId` …)** —
  verworfen: Eine Route ist keine Datei, und `:ortId` ist unendlich. Der
  Fallback aus Punkt 4 löst denselben Fall vollständig und ohne Pflege.
