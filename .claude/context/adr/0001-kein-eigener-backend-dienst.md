# ADR-0001: Kein eigener Backend-Dienst — rein clientseitige Vue-Anwendung

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `app-shell`, `orte`, `bewertungen`, `tags`, `medien`, `karte`, `datensicherung`
- **task_id**: `PO-2026-09-07-010` (erstes eingeordnetes Paket; die Entscheidung gilt projektweit)

## Kontext

Der Nutzer hat den Backend-Stack ausdrücklich dem Architekten überlassen und
„kein Backend" als zulässiges Ergebnis benannt, das dann als ADR festzuhalten
ist. Die Anforderungen lassen für einen eigenen Dienst keine Aufgabe übrig:
Das Gerät ist der **endgültige** Speicherort (kein Zwischenpuffer), es gibt
keine Authentifizierung, keine Mehrbenutzer-Fähigkeit, keinen Sync zwischen
Geräten und keine Warteschlange. Schreiben ohne Netz ist abgeschlossen, nicht
aufgeschoben. Netz wird nur für drei Zwecke gebraucht: Kartenkacheln, eine
optionale Ortssuche und das Ausliefern neuer Versionen.

## Entscheidung

Es wird **kein eigener Backend-Dienst** gebaut. Das Produkt ist ein statisch
ausgeliefertes Vue-3-SPA (TypeScript, Vite, Pinia, vue-router).

- Der Gerätespeicher ist der Datenbestand; der Zugriff darauf liegt in
  `src/persistence/` (Regeln: ADR-0003).
- Es gibt kein `services/`, kein `libs/contracts/`, keine API-Endpunkte, keine
  Event-Schemata, keine serverseitigen Migrationen.
- Kartenkacheln und die optionale Ortssuche sind **direkte Aufrufe an
  Fremdanbieter aus dem Client**, jeweils mit einem definierten Ausfallpfad,
  der die App vollständig bedienbar lässt.
- Auslieferung: statisches Bundle über HTTPS plus Service Worker
  (PO-2026-09-07-007). Kein Server-Laufzeitanteil.

## Konsequenzen

- Positiv: Kein Betrieb, keine fremden Daten in fremder Hand, keine
  Auth-Fläche. **Alle Arbeitspakete dieses Features sind
  `routing: "frontend"`**; der `backend-lead` wird nicht gerufen,
  `frontend_start` ist durchgängig `independent`, `backend_contract` bleibt
  `null`.
- Negativ/Trade-off: Die Datensicherung liegt beim Nutzer — genau deshalb ist
  PO-2026-09-07-009 (Export/Import) kein Komfort-, sondern ein
  Substanz-Paket. Ein Gerätewechsel ist manuell.
- Negativ/Trade-off: Ein Fremdanbieter, der einen **geheim zu haltenden**
  Schlüssel verlangt, ist so nicht bedienbar — ein ausgeliefertes Bundle kann
  kein Geheimnis tragen. Trifft das bei PO-2026-09-07-006 (Tiles) oder
  PO-2026-09-07-008 (Ortssuche) zu, ist entweder ein schlüsselloser Anbieter
  zu wählen oder das Paket zu streichen (008 ist laut Request ausdrücklich
  streichbar). Ein Proxy-Dienst würde dieses ADR **ablösen** und braucht ein
  eigenes ADR — er wird nicht nebenbei eingeführt.
- Betrifft künftig: Für PO-2026-09-07-007 folgt daraus Service Worker **ohne**
  Web-App-Manifest/Installierbarkeit in v1 — ein installierbares PWA braucht
  ein App-Icon, und `design-concept.md` schließt Logo, App-Icon und Wortmarke
  ausdrücklich aus. Offline-Fähigkeit hängt nicht am Manifest.

## Alternativen (kurz)

- **Schlanker BFF/Proxy „für später"** — verworfen: Er hätte heute keinen
  Zweck außer Schlüsselverwaltung, die es noch nicht gibt, und würde Betrieb,
  Deployment und einen zweiten Lead-Pfad erzwingen.
- **Backend mit Datenhaltung und Sync** — verworfen: widerspricht den
  ausdrücklichen Nicht-Zielen (kein Login, kein Teilen, keine Synchronisation)
  und der Setzung „das Gerät ist der endgültige Speicherort".
