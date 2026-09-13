# ADR-0026: Die Sichtbarkeits-Kennung gilt für die geöffnete Detailinstanz, nicht für die Ort-ID (Präzisierung von ADR-0025 Punkt 3)

- **Status**: accepted
- **Datum**: 2026-09-13
- **Bounded Context(s)**: `orte`
- **task_id**: `PO-2026-09-12-005` (Meldung des `frontend-lead` nach der Umsetzung)

## Kontext

Der `frontend-lead` hat ADR-0025 Punkt 3 wörtlich umgesetzt — einschließlich
des Satzes, die Kennung werde **„nie zurückgenommen"** — und den dort
ausdrücklich verbotenen Reset-Watcher nicht ergänzt. Das war nach der
Rangfolge richtig (ADR schlägt `design-conventions.md`, kein Patt). Er hat
die Folge gemeldet statt sie stillschweigend aufzulösen:

`Ortebereich.vue` ist für `/orte` und `/orte/:ortId` **dieselbe, nie
unmountende Instanz** (`onBeforeRouteUpdate` statt `onBeforeRouteLeave`).
Eine Kennung, die nie zurückgenommen wird, überlebt damit auch das Schließen
und Wiederöffnen **desselben** Ortes. Beobachtbarer Fall: Ort X ohne
Koordinaten, Suche nicht benutzt, „Koordinaten von Hand eintragen" gedrückt,
**nichts eingetragen**, Detailansicht geschlossen, X in derselben Sitzung
erneut geöffnet → die Felder stehen weiterhin offen, obwohl Kriterium 8 von
PO-2026-09-12-005 den Button verlangt („Beim erneuten Öffnen desselben Ortes
gilt wieder die Regel aus den Kriterien 1–4; der aufgeklappte Zustand wird
nicht gespeichert"). Dasselbe verlangt `design-conventions.md` →
„Bedingt sichtbare Formularabschnitte (Reveal ohne Rückweg)": sichtbar bleibt
der Abschnitt **„für die Lebensdauer der aktuell geöffneten Instanz"**, beim
erneuten Öffnen „derselben oder einer anderen" gilt die Regel wieder von vorn.

**„Nie zurückgenommen" war kein abgewogener Gegenentwurf zu Kriterium 8,
sondern zu weit geraten.** Drei Belege, alle in ADR-0025 selbst:

1. Der Satz steht dort als **Begründung für Kriterium 7** („einmal sichtbar
   bleibt sichtbar") und Kriterium 9 (Ortswechsel A→B). Beide Kriterien
   spielen ausschließlich **innerhalb** einer geöffneten Detailansicht. Der
   Fall „schließen und denselben Ort wieder öffnen" kommt in keinem von
   beiden vor und ist in ADR-0025 nirgends erwogen.
2. ADR-0025 sagt unter „Alternativen" wörtlich das Gegenteil seines eigenen
   Punktes 3: Ein Schlüssel im Store `einstellungen` sei verworfen, weil
   „der Zustand das Schließen des Ortes gerade **nicht** überdauern" solle.
   Punkt 3 und die Alternativen-Begründung widersprechen einander — die
   Absicht steht bereits im ADR, nur Punkt 3 formuliert sie falsch.
3. Das Wort „nie" war beim Schreiben **kostenlos**, weil die Komponente
   nicht unmountet: Ohne Unmount fällt nicht auf, dass „Ort-ID" und
   „geöffnete Detailinstanz" zwei verschiedene Lebensdauern sind. Die
   Eigenschaft ist ein Nebeneffekt der Komponentenstruktur, keine
   Entscheidung.

## Nutzersicht: warum das Zurücknehmen auch fachlich richtig ist

Die Regelwerks-Konsistenz allein würde die Entscheidung nicht tragen. Sie
trägt aus der Nutzersicht:

- **Der Zustand überlebt nur genau dann, wenn nichts daraus geworden ist.**
  Hat die Nutzerin tatsächlich eine Koordinate eingetragen, ist der Abschnitt
  ohnehin sichtbar — über `breite !== null || laenge !== null`, ganz ohne
  Kennung. Beobachtbar ist „nie zurückgenommen" deshalb **ausschließlich** im
  Fall „aufgeklappt, nichts eingetragen, geschlossen". Das ist der Fall, in
  dem die Absicht **aufgegeben** wurde. Ein Zustand, der nur die aufgegebene
  Absicht konserviert und die verfolgte gar nicht erst betrifft, hat keinen
  Nutzen, den man gegen die Konvention abwägen könnte.
- **Es geht keine Nutzereingabe verloren.** Zurückgenommen wird ein
  Sichtbarkeits-Schalter, kein Wert. Wer etwas eingetragen hat, sieht es
  unverändert wieder.
- **„Reveal ohne Rückweg" darf nicht „nie wieder" heißen.** Innerhalb der
  geöffneten Ansicht ist der Reveal bewusst nicht rücknehmbar (kein Toggle).
  Überlebte er zusätzlich das Schließen, hätte die Nutzerin in der ganzen
  Sitzung **keinen** Weg zurück zum ruhigen Ausgangszustand — ein
  Fehlklick wäre endgültig. Die Nicht-Rücknehmbarkeit im Kleinen ist nur
  vertretbar, weil das Verlassen der Instanz sie im Großen auflöst.
- **Der Abschnitt ist ein Notnagel, kein Formularfeld.** Der vorgesehene Weg
  ist die Ortssuche (ADR-0020). Der Ausgangszustand „Suche zuerst, Button
  darunter" ist die eigentliche Führung; sie beim Wiederöffnen
  wiederherzustellen ist die Absicht des Musters, nicht ein Verlust.

## Entscheidung

1. **ADR-0025 Punkt 3 gilt unverändert fort mit einer Präzisierung der
   Lebensdauer:** Die Kennung bindet an die **geöffnete Detailinstanz**. Die
   Ort-ID ist die Art, wie diese Instanz identifiziert wird, solange sie
   offen ist — sie ist nicht selbst der Geltungsbereich. Mit dem Schließen
   der Detailansicht endet die Instanz, und die Kennung wird auf `null`
   zurückgenommen.
2. **Nur beim Schließen, nicht beim Ortswechsel.** Für A→B bleibt der
   **Vergleich** der Kennung mit der geöffneten `ortId` die Absicherung,
   genau wie bisher — kein Reset-Watcher auf dem Wechsel, das Verbot aus
   ADR-0025 Punkt 3 bleibt dort in Kraft und behält seinen Zweck.
   Das ist bewusst doppelt abgesichert: Fällt die Rücknahme aus Punkt 1
   später jemandem zum Opfer, bleibt der **schwerere** Fehler — Ort B zeigt
   den Zustand von Ort A — trotzdem unmöglich.
3. **Die Rücknahme sitzt an der Stelle, die „die Detailinstanz ist beendet"
   bereits abbildet**: im vorhandenen `watch(ortId, …)` in
   `Ortebereich.vue`, im bestehenden Zweig `!neu && alt`. Das ist der
   Schließen-Zweig, den die Fokusrückgabe ohnehin benutzt — keine zweite
   Mechanik, kein neuer Watcher. **Nicht** in `onBeforeRouteUpdate`: Das ist
   ein Navigations-Guard, der vor der bestätigten Navigation läuft; eine
   abgebrochene Navigation setzte den Zustand einer weiterhin offenen
   Detailansicht zurück.
4. **Ein Breakpoint-Wechsel nimmt nichts zurück.** Unter-/Überschreiten von
   `lg` bei offener Detailspalte ist ein reiner CSS-Layoutwechsel ohne
   Navigations-Event (ADR-0011, `design-conventions.md` →
   „Master-Detail"); `ortId` ändert sich dabei nicht, der Zweig aus Punkt 3
   läuft also nicht. Das ist richtig so: Die Instanz bleibt geöffnet.
5. **ADR-0025 Punkt 4 gilt weiter und wird mitpräzisiert.** Jeder weitere
   Zustand, der diese Komponentengrenze verlässt, trägt die Ort-ID **und**
   endet mit der geöffneten Instanz — beendet an derselben Stelle wie
   Punkt 3. ADR-0025 Punkte 1, 2, 5, 6 und 7 bleiben unberührt.
6. **Kein neuer Prüfstand.** Die Korrektur ist eine Zuweisung in einem
   vorhandenen Zweig einer View. ADR-0023 Punkt 4 gilt unverändert: Eine
   Component-Test-Infrastruktur (`@vue/test-utils`) entsteht erst, wenn ein
   Paket sie fachlich braucht; dieses ADR ist **kein** Auftrag dazu, und der
   Rauchtest bekommt dafür keine neue Zusicherung (er prüft Eigenschaften der
   Ansicht, nicht Verhaltensabläufe, ADR-0023 Punkt 1). Kriterium 8 ist damit
   bei der Abnahme **am Code** zu prüfen — der Schließen-Zweig macht es an
   einer Stelle ablesbar.

## Konsequenzen

- Positiv: Kriterium 8, `design-conventions.md` und ADR-0025 sagen wieder
  dasselbe; ADR-0025 ist auch mit sich selbst wieder konsistent (siehe
  Beleg 2 oben).
- Positiv: Der strukturelle Kern von ADR-0025 bleibt unbeschädigt — die
  ID-Bindung trägt weiter den Ortswechsel, `:key` trägt weiter den
  Instanzzustand der Ortssuche, es kommt kein Store und keine Persistenz
  dazu.
- Negativ/Trade-off, offen benannt: Die Rücknahme ist eine **Zuweisung an
  einer benannten Naht**, keine Struktur, die den Fehler unmöglich macht. Wer
  später einen zweiten instanzgebundenen Zustand danebenstellt, muss ihn dort
  mit beenden (Punkt 5). Der Preis ist bewusst gezahlt: Die strukturelle
  Alternative — den Abschnitt in eine eigene, mit `:key="ortId"` innerhalb
  des Detailblocks gemountete Komponente ziehen — ist für eine Korrektur
  dieser Größe unverhältnismäßig (siehe „Alternativen"). Punkt 2 begrenzt den
  Schaden eines vergessenen Falls auf den harmloseren der beiden.
- Betrifft künftig: Jeder bedingt sichtbare Abschnitt im Ortsdetail. Die
  Frage, die ADR-0025 nicht gestellt hat, gehört ab jetzt zu jedem
  instanzgebundenen Zustand: **Wann endet die Instanz — und ist das dieselbe
  Lebensdauer wie die der ID, an der der Zustand hängt?**

## Alternativen (kurz)

- **Kriterium 8 umformulieren („überlebt kein Neuladen")** — verworfen:
  `design-conventions.md` meint nachweislich mehr als Persistenz („für die
  Lebensdauer der aktuell geöffneten Instanz", „beim erneuten Öffnen
  derselben … gilt die Regel wieder von vorn"). Das ist eine getroffene
  Entscheidung des `ux-ui-designer`, keine unscharfe Formulierung. Sie
  umzuschreiben, damit sie zu einem Nebeneffekt der Komponentenstruktur
  passt, hieße das Verhalten von der Implementierung bestimmen zu lassen.
- **Kriterium 8 streichen, das Verhalten bleibt** — verworfen aus der
  Nutzersicht oben: Der Zustand überlebt ausschließlich dort, wo nichts
  daraus geworden ist, und nähme der Nutzerin den einzigen verbliebenen Weg
  zurück in den Ausgangszustand.
- **Den Koordinaten-Abschnitt in eine eigene Komponente mit
  `:key="ortId"` innerhalb des Detailblocks ziehen** — strukturell sauberer
  (der Block wird beim Schließen ohnehin ausgehängt, Zustand wäre
  strukturell weg, ganz wie bei `Ortssuche` in ADR-0025 Punkt 5), aber für
  diese Korrektur verworfen: Der Suchzustand als Auslöser müsste als Prop
  hinein und dort erneut eingerastet werden — mehr bewegte Teile an fertigem,
  grünem Code als der behobene Fehler wiegt. Bleibt die Rückfallposition,
  sobald ein **zweiter** instanzgebundener Zustand im Ortsdetail dazukommt;
  dann kippt die Abwägung, weil Punkt 5 ab da mehr als einen Fall zu
  erinnern verlangt. (Nicht zu verwechseln mit der in ADR-0025 verworfenen
  Alternative: Die zog **Ortssuche und Felder gemeinsam** in eine Komponente
  und ordnete damit das Formular um „Adresse" herum um — eine UI-Entscheidung
  des `ux-ui-designer`. Der Abschnitt allein ist bereits ein
  zusammenhängender Block an derselben Stelle; an der Anordnung ändert sich
  nichts.)
- **`watch(ortId)` setzt bei jeder Änderung unbedingt zurück** — verworfen:
  Das machte den ID-Vergleich zum toten Code und legte beide Fälle auf eine
  einzige Zeile. Punkt 2 will die Fälle bewusst getrennt absichern.
