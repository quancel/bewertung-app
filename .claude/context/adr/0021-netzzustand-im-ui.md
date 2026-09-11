# ADR-0021: Netzzustand im UI — erlaubt an der netzabhängigen Bedienstelle, verboten in der Auslieferungsmechanik (Präzisierung von ADR-0015 Punkt 6)

- **Status**: accepted
- **Datum**: 2026-09-10
- **Bounded Context(s)**: `app-shell`, `karte`, `orte`
- **task_id**: `PO-2026-09-07-006` (gilt gleichermaßen für `PO-2026-09-07-008`)

## Kontext

ADR-0015 Punkt 6 sagt: „Der bloße Wechsel Netz ↔ kein Netz löst nichts aus.
Es gibt keinen `online`/`offline`-Listener, der eine Meldung, einen Reload
oder einen Zustand im UI erzeugt." Gemeint war die Update-Mechanik: Sichtbar
werden soll ausschließlich das tatsächliche Vorliegen einer neuen Version.

Wörtlich gelesen ist der Satz projektweit und verbietet genau das, was
-006 und -008 im Design brauchen: den Hinweis-Chip „kein Netz für Kacheln",
das Nachladen der Kacheln bei Netzrückkehr, und den gemuteten Text im
Suchfeld, **bevor** der Nutzer erst tippen und einen Fehlschlag erleben muss.
Da ein ADR (Rang 1) über `design_notes` (Rang 4) steht, müsste der
`frontend-lead` diese Design-Vorgaben verwerfen oder das Paket blockieren.
Der Fehler liegt in der Vorgabe, nicht im Design.

## Entscheidung

1. **Für `app-shell` und die Auslieferungs-/Update-Mechanik gilt ADR-0015
   Punkt 6 unverändert weiter**: kein Reload, keine Meldung, kein Toast und
   keine Navigation aus einem Netzwechsel. Dieses ADR löst ADR-0015 nicht ab
   und ändert dort keine Zeile.
2. **Ein Feature darf `navigator.onLine` lesen und auf `online`/`offline`
   hören** — ausschließlich für zwei Zwecke:
   (a) einen **gemuteten Hinweis unmittelbar an der netzabhängigen
   Bedienstelle** ein- und ausblenden;
   (b) einen bereits sichtbar fehlgeschlagenen Fremd-Abruf **an genau dieser
   Stelle** wiederholen (Kacheln neu zeichnen, wenn das Netz zurück ist).
3. **Verboten bleibt**: Reload, Navigation, Toast oder Dialog, ein App-weiter
   Offline-Balken, das Sperren eines Feldes (`disabled`), jeder Schreibzugriff
   auf den Bestand und jede Fehler- oder Warnfarbe. Fehlendes Netz ist ein
   regulärer Zustand dieser App, kein Mangel (`design-concept.md`).
4. **`navigator.onLine` ist nur in einer Richtung verlässlich.** `false`
   heißt sicher „kein Netz" und darf den Vorab-Hinweis auslösen. `true` ist
   keine Zusage, dass ein Host erreichbar ist — die Wahrheit ist immer das
   Ergebnis des tatsächlichen Abrufs. Fehlertexte kommen deshalb nie aus
   `onLine`, sondern aus dem Ergebnis (ADR-0020 Punkt 4).
5. **Kein Netzzustand in einem Pinia-Store und kein globaler Listener in
   `main.ts`.** Der Zustand ist flüchtig und gehört an die Komponente:
   Listener werden beim Einhängen registriert und beim Aushängen entfernt.
   Weil ihn ab -006/-008 zwei Contexts brauchen, liegt er als
   `src/shared/composables/useNetzzustand.ts` (zustandslos je Aufrufer,
   keine Singleton-Instanz). Entfällt -008, wandert er nach
   `features/karte/composables/` zurück — eine reine Verschiebung.

## Konsequenzen

- Positiv: Die entworfenen Zustände aus `design-conventions.md` („Karte",
  „Netzabhängige Aktion ohne Erfolg") sind umsetzbar, ohne dass ein Lead ein
  ADR überstimmen oder blockieren muss.
- Positiv: Die Grenze ist prüfbar formuliert — nicht „welches API", sondern
  „welche Wirkung": Hinweis und Wiederholung an der Bedienstelle ja, alles
  Globale nein.
- Negativ/Trade-off: Zwei Regeln zum selben Browser-API, die man
  auseinanderhalten muss. Deshalb steht die Unterscheidung kurz in
  `code-conventions.md` und wird als `constraint` in betroffene Pakete
  aufgenommen — gespawnte Subagents sehen die Datei nicht zwingend.
- Betrifft künftig: Jedes weitere Paket mit Fremdnetz-Zugriff. Ein Paket, das
  einen globalen Offline-Zustand einführen will, löst dieses ADR ab, statt es
  auszulegen.

## Alternativen (kurz)

- **ADR-0015 Punkt 6 wörtlich anwenden** — verworfen: Der Nutzer erlebte
  dann erst einen Fehlschlag, bevor er erfährt, dass die Suche gerade nicht
  geht, und die Kacheln blieben nach Netzrückkehr leer, bis jemand neu lädt.
  Beides widerspricht dem entworfenen Verhalten.
- **ADR-0015 ablösen und neu schreiben** — verworfen: Sieben seiner acht
  Punkte gelten unverändert; eine Ablösung machte die Historie unlesbarer,
  statt sie zu klären. Präzedenz für diese Form ist ADR-0016 Punkt 9/10, das
  ADR-0013 Punkt 3 ebenfalls präzisiert, ohne es abzulösen.
- **Globaler Offline-Indikator im App-Rahmen** — verworfen: macht den
  Normalzustand „ohne Netz" zu einer dauerhaften Meldung und widerspricht
  `design-concept.md` („fehlende Daten sind neutral", keine Mangel-Sprache).
