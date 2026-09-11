# ADR-0019: Die Karte ist eine zweite Ansicht des Bereichs Orte — Umschalter in der Werkzeugleiste, Adresse über den Query-Parameter `ansicht`

- **Status**: accepted
- **Datum**: 2026-09-11 (ersetzt den Entwurf vom 2026-09-10, siehe
  „Revision" am Ende)
- **Bounded Context(s)**: `karte`, `orte`, `app-shell`
- **task_id**: `PO-2026-09-07-006`

## Nutzerentscheidungen vom 2026-09-10 (gesetzt, nicht abgeleitet)

Zwei Punkte dieses ADR sind **Entscheidungen des Nutzers**, nicht Ableitungen
des Architekten. Wer sie später anders vorfindet, als er sie erwartet, hat
keinen Architekturfehler gefunden:

1. **Die Karte bekommt die volle Breite und ist über einen Umschalter
   Liste/Karte in der Werkzeugleiste erreichbar** — ausdrücklich **nicht**
   über einen Eintrag in der Bereichsnavigation und **nicht** in der rechten
   Spalte neben der Liste.
2. **Die Karte folgt dem aktiven Tag-Filter** — sie zeigt nur, was der Filter
   übrig lässt, nicht alle Orte mit Koordinaten.

Alles Weitere unten ist die Umsetzung dieser beiden Setzungen.

## Kontext

`karte` steht seit ADR-0001 in der Context-Map, hat aber bis
PO-2026-09-07-006 keine einzige Datei. Der Umschalter sitzt laut Entscheidung 1
in `Werkzeugleiste.vue` — einem Baustein, der `orte` gehört (ADR-0013) und ab
`lg` in der ~400px schmalen Listen-Spalte lebt (ADR-0011). „Volle Breite" und
„Bedienelement in der schmalen Spalte" schließen sich in derselben Ansicht
aus: Läge die Karte über der vollen Breite und die Werkzeugleiste bliebe in
der Spalte, wäre der Rückweg nicht erreichbar. Entscheidung 2 verschärft das
— wenn der Tag-Filter bestimmt, welche Marker zu sehen sind, muss er in der
Kartenansicht sichtbar sein, sonst verschwinden Marker ohne sichtbaren Grund.

Dazu kommt die Adressfrage: Ist der Umschalter eine Adresse oder reiner
Ansichtszustand? Der Adressraum ist seit PO-2026-09-07-007 offline
ausgeliefert und nach ADR-0010/0011 eingefroren.

## Entscheidung

1. **Die Kartenansicht ist kein eigener Bereich, sondern eine zweite Ansicht
   des Bereichs Orte** — adressiert über den Query-Parameter `ansicht`:
   `/orte?ansicht=karte`. Es kommt **kein** Routen-Eintrag hinzu;
   `src/app/router/routes.ts` bleibt unverändert, `path` und `name` aller
   bestehenden Routen ebenso (ADR-0010/0011).
2. **Ein Query-Parameter ist eine Adresse, kein Zustand.** Er ist
   verlinkbar, überlebt das Neuladen und erzeugt History-Einträge — genau die
   drei Eigenschaften, die ADR-0011 Punkt 4 zum Grund macht, solche Zustände
   nicht neben der Adresse zu führen. Er gilt ab Auslieferung wie ein Pfad als
   **eingefroren**: Name `ansicht`, Wert `karte`. Fehlt er oder trägt er einen
   unbekannten Wert, gilt die Listenansicht — die Adresse wird dabei **nicht**
   korrigiert (kein `replace`, keine History-Schleife). Auf einer
   Detailadresse (`/orte/:ortId`) hat der Parameter keine Bedeutung und wird
   nicht gesetzt.
3. **Offline trägt das ohne Änderung an -007.** Eine Navigation auf
   `/orte?ansicht=karte` ist eine Navigation wie jede andere;
   `navigateFallback: '/index.html'` beantwortet sie, `vue-router` löst danach
   Pfad **und** Query im Client auf (ADR-0015 Punkt 4). Der `pwa`-Block in
   `vite.config.ts` wird nicht angefasst.
4. **`app/layout/Bereichsnavigation.vue` bleibt unangetastet.** Es gibt keinen
   Karten-Eintrag. Der Eintrag „Orte" bleibt in der Kartenansicht
   hervorgehoben, weil `istAktiv` den **Pfad** prüft und der Query daran
   nichts ändert. Die Regel aus -011/ADR-0010 („ein neuer Bereich hängt seinen
   Eintrag selbst an") greift hier nicht und wird auch nicht verletzt: Die
   Karte ist kein Bereich. Kein Kriterium aus -011 bricht — dort ging es um
   die Chrome-Grenze und darum, dass Einträge angehängt statt eingefügt
   werden.
5. **In der Kartenansicht wird `MasterDetail.vue` nicht gerendert.** Der
   Aufbau ist in jeder Breite derselbe: Kopfzeile und Werkzeugleiste über die
   volle Inhaltsbreite, darunter die Karte über die volle Inhaltsbreite. Die
   Werkzeugleiste bleibt sichtbar, weil sie den Rückweg trägt **und** den
   Filter zeigt, der die Marker bestimmt. Sie ist derselbe Baustein wie in der
   Listen-Spalte, nur in einem breiteren Container — ADR-0012 verlangt genau
   dafür Container-Abfragen statt Fensterbreiten; es entsteht **keine zweite
   Werkzeugleisten-Variante**.
6. **Die Kartenansicht existiert nur ohne offene Detailansicht.** Umschalten
   auf Karte ist `push('/orte?ansicht=karte')` — eine offene Detailadresse
   wird dabei verlassen. Umschalten auf Liste ist `push('/orte')`. Ein
   Marker-Klick ist `push` auf `/orte/:ortId`; Browser-Zurück führt damit auf
   die Karte zurück, und die Schließen-Aktion der Detailansicht tut dasselbe,
   weil sie laut ADR-0011 Punkt 4 `router.back()` ist. Das Löschen des
   gewählten Ortes bleibt `replace('/orte')` und landet in der Liste — dafür
   wird kein Sonderfall gebaut.
7. **`Ortebereich.vue` bleibt die eine Bereichsansicht** (ADR-0011 Punkt 2)
   und leitet die Ansicht ausschließlich aus der Adresse ab. Es gibt **keinen**
   zweiten Ansichtszustand daneben: kein Flag im Store, keine
   Anzeigeeinstellung in `einstellungen`. Wächst die Datei unübersichtlich,
   wird **innerhalb** von `features/orte/` in präsentationale Komponenten
   geschnitten, nicht in eine zweite Route (ADR-0011).
8. **`karte` ist ab -006 ein rein präsentationaler Context**: `components/`,
   `composables/`, `lib/`, `model/` — **keine** View, keine Route, kein
   Pinia-Store, kein Zugriff auf `useOrteStore` oder `persistence/`. Damit
   gilt die gewöhnliche Richtung aus ADR-0013: `Ortebereich.vue` importiert
   `Kartenflaeche.vue` und bindet sie über Props und Emits an, wie die
   Bausteine aus `bewertungen`, `tags` und `medien`. `karte` importiert
   nichts aus `orte`; sein Prop-Typ steht in
   `features/karte/model/karte.types.ts` und importiert nichts — auch nicht
   `OrtDatensatz`, damit eine spätere Formatänderung die Karte nicht berührt.
   `useNetzzustand` (ADR-0021) ist kein Store und hebt die Store-Freiheit
   nicht auf.
   **Der Context bleibt bestehen, statt in `orte` aufzugehen**, weil er die
   Fremd-Bibliothek kapselt: ADR-0018 Punkt 6 („Leaflet nur in
   `features/karte/`") ist nur prüfbar, solange es diesen Ordner gibt. Läge
   die Kartenfläche in `orte`, wäre Leaflet im größten Feature des Projekts
   überall importierbar.
9. **Datenauswahl folgt dem Filter, nicht der Sortierung.** Gezeichnet wird
   `orteGefiltert`, eingeschränkt auf Orte mit **beiden** Koordinaten
   (`breite !== null && laenge !== null` — kein Falsy-Test, `0` ist gültig).
   Die **Sortierung bleibt ohne Wirkung**: Marker haben keine Reihenfolge, es
   gibt keine Liste, die sie zeigen könnte; `sortierErgebnis` wird in der
   Kartenansicht nicht ausgewertet. Das ist keine offene Stelle, sondern eine
   Feststellung — der Nutzer wurde nach dem Filter gefragt, und für die
   Sortierung gibt es auf einer Karte nichts zu entscheiden. Ob das
   Sortier-Bedienelement in der Kartenansicht sichtbar bleibt, ist eine
   Design-, keine Architekturfrage.
10. **Drei unterscheidbare Leerzustände**, wie es `design-conventions.md`
    verlangt („zwei Zustände mit unterschiedlicher Ursache tragen nie
    denselben Text"): (a) Bestand leer — greift bereits vor der Ansicht;
    (b) Filter lässt überhaupt keinen Ort übrig — der vorhandene
    „keine Treffer"-Zustand; (c) **neu**: es gibt Orte in der Auswahl, aber
    keiner davon hat Koordinaten. (c) entsteht erst durch Entscheidung 2 und
    hat noch keinen entworfenen Text.
11. **Der Kartenblock wird per `v-if` gemountet, nie per `v-show`.** Leaflet
    misst seinen Container; in einem ausgeblendeten Container entsteht eine
    0×0-Karte. Preis: Beim Wechsel Liste ↔ Karte gehen die Scrollposition der
    Liste und der Kartenausschnitt verloren. Das ist bewusst — ein
    Ansichtswechsel ist kein Adresswechsel innerhalb derselben Ansicht, für
    den ADR-0011 Punkt 3 die Erhaltung zugesagt hat.
12. **`Kartenflaeche.vue` wird asynchron eingebunden**
    (`defineAsyncComponent(() => import(...))`). `/orte` ist die Startroute;
    ein statischer Import legte Leaflet ins Einstiegs-Bundle und machte
    ADR-0018 Punkt 6 wirkungslos. Präzisierung zu ADR-0018 Punkt 6, das von
    einer eigenen Kartenroute ausging.

## Konsequenzen

- Positiv: Kein neuer Routen-Eintrag, kein neuer Bereich, keine Änderung an
  `routes.ts`, `Bereichsnavigation.vue`, `MasterDetail.vue` oder -007. Die
  Karte ist trotzdem verlinkbar und überlebt das Neuladen.
- Positiv: Die Bereichsnavigation zeigt weiterhin einen aktiven Bereich. Ein
  eigener Pfad ohne Navigationseintrag hätte den Nutzer in der Navigation
  „nirgendwo" stehen lassen.
- Positiv: Filter und Umschalter stehen in der Kartenansicht am selben Ort wie
  in der Liste — der Zusammenhang „Filter bestimmt Marker" ist sichtbar,
  statt erklärt werden zu müssen.
- Negativ/Trade-off: `Ortebereich.vue` bekommt einen vierten Zweig neben den
  drei vorhandenen und wächst weiter. Der Ausweg steht in ADR-0011: schneiden
  innerhalb von `features/orte/`, nicht in eine zweite Route.
- Negativ/Trade-off: Der Ansichtswechsel verwirft Listen-Scrollposition und
  Kartenausschnitt (Punkt 11).
- Negativ/Trade-off: `?ansicht=karte` ist eine Adressform, die genauso
  eingefroren ist wie ein Pfad, aber weniger sichtbar. Wer den Adressraum
  liest, findet sie nicht in `routes.ts` — deshalb steht sie in
  `context-map.md` und `code-conventions.md`.
- Betrifft künftig: Ein späteres Clustering, ein Kartenfilter oder ein
  persistierter Ausschnitt sind eigene Pakete. Ein persistierter Ausschnitt
  bräuchte einen Schlüssel nach ADR-0006/0009 und ein eigenes ADR. Weitere
  Ansichten desselben Bereichs (etwa eine Zeitachse) folgen demselben Muster:
  ein Wert mehr für `ansicht`, kein neuer Bereich.

## Alternativen (kurz)

- **Eigener Bereich `/karte` mit Eintrag in der Bereichsnavigation** — war
  der Entwurf des Architekten vom 2026-09-10 und ist durch Nutzerentscheidung 1
  ersetzt.
- **Eigener Pfad `/karte` ohne Navigationseintrag** — verworfen:
  `istAktiv` in `Bereichsnavigation.vue` prüft den Pfad-Präfix; auf `/karte`
  wäre **kein** Bereich hervorgehoben, obwohl der Nutzer inhaltlich bei den
  Orten ist. Ein Pfad außerhalb jedes Bereichs widerspricht ADR-0010.
- **`/orte/karte` als statisches Segment** — verworfen: steht im selben
  Adressraum wie `/orte/:ortId` und macht die Detailroute für jeden Leser
  mehrdeutig, auch wenn eine UUID nie „karte" heißt.
- **Reiner Ansichtszustand ohne Adresse (`ref` in der Bereichsansicht)** —
  verworfen: nicht verlinkbar, überlebt kein Neuladen, und nach einem
  Marker-Klick führte Browser-Zurück in die Liste statt auf die Karte.
- **Ansicht als Anzeigeeinstellung in `einstellungen`** (wie Sortierung,
  ADR-0009) — verworfen: Die App startete dann in der Karte, weil die
  Einstellung die letzte Wahl überdauert. Der Ansichtswechsel ist eine
  Navigation, keine Konfiguration.
- **Werkzeugleiste bleibt in einer schmalen Spalte, Karte daneben** —
  verworfen: widerspricht Nutzerentscheidung 1 („volle Breite").
- **Kartenfläche nach `features/orte/` verschieben und `karte` streichen** —
  verworfen: Dann wäre Leaflet im größten Feature überall importierbar und
  ADR-0018 Punkt 6 nicht mehr prüfbar.

## Revision

Der Entwurf vom 2026-09-10 sah einen **eigenen einspaltigen Bereich `/karte`
mit flacher Route und Eintrag in der Bereichsnavigation** vor, dazu eine
`Kartenbereich.vue` in `features/karte/views/`, die `useOrteStore` selbst
anband, und eine Karte, die **alle** Orte mit Koordinaten zeigt (unabhängig
vom Tag-Filter). Beide Punkte wurden dem Nutzer als `user_questions`
vorgelegt und am 2026-09-10 anders entschieden (siehe oben). Damit entfallen
aus dem Entwurf: die eigene Route, der Navigationseintrag, das Karten-Icon,
`features/karte/views/`, der Store-Zugriff aus `karte` heraus und die
Entkopplung vom Filter. Die Umkehrung des Store-Zugriffs hat eine Folge, die
leicht übersehen wird: Weil `karte` jetzt **nichts** mehr aus `orte`
importiert, besteht der Feature-Zyklus nicht mehr, mit dem der Entwurf die
Verlagerung der Ortssuche begründet hat — ADR-0020 Punkt 1 trägt sich
seither auf den übrigen, unabhängigen Gründen.
