# ADR-0031: Schreiben beim Entladen der Seite — gehärteter Schreibweg, aber keine Zusicherung (Präzisierung von ADR-0005 Punkt 2/5 und seiner Risikoaussage; benannte Ausnahme zu ADR-0023 Punkt 2)

- **Status**: accepted — **Vorbehalt**: Punkt 5 hängt an der offenen
  Nutzerfrage vom 2026-09-26 (Rückläufer PO-2026-09-26-001). Entscheidet der
  Nutzer anders als angenommen, wird Punkt 5 neu gefasst (Abschnitt
  „Revision"), die Punkte 1–4 und 6 bleiben.
- **Datum**: 2026-09-26
- **Bounded Context(s)**: `orte`, `tags`, `bewertungen`, `app-shell`
- **task_id**: `PO-2026-09-26-001` (Rückläufer des `frontend-lead`)

## Kontext

Rauchtest-Fall (b) aus PO-2026-09-26-001: Text im **fokussierten** Tag-Feld,
danach echtes Neuladen. `pagehide` übernimmt den Text korrekt in den Store und
stößt `persistiereOrt` an — der Tag fehlt nach dem Neuladen trotzdem,
reproduzierbar. Mit einem künstlich vorgezogenen `visibilitychange` (Dokument
lebt danach weiter) überlebt er mit demselben Code. Die Ursache ist nicht das
Paket: Bei jedem Feld, dessen letzte Änderung noch nicht geschrieben ist, wird
der Schreibvorgang **im Entladen selbst** erst angestoßen. Das gilt seit
PO-2026-09-07-001 genauso für Bezeichnung und Adresse (`@input` → Store,
`@blur` → Schreiben) und Breite/Länge (`@change`). ADR-0005 nennt als einzigen
Verlustweg „ein Tab-Schluss im selben Moment, in dem die Transaktion läuft".
Das ist falsch beschrieben: Der Fall tritt nicht zufällig ein, er tritt **jedes
Mal** ein, wenn neu geladen oder geschlossen wird, während der Fokus noch im
geänderten Feld steht.

## Entscheidung

1. **Kein Mechanismus im Rahmen von ADR-0001/0004 sichert zu, dass ein
   Schreibvorgang abschließt, der erst beim Entladen angestoßen wird.**
   Handler für `pagehide`/`visibilitychange` können nicht warten.
   IndexedDB-Transaktionen sind asynchron, ob eine angefangene Transaktion
   zu Ende läuft, entscheidet der Browser. Zugesichert ist nur:
   (a) Jeder der vier Auslöser übernimmt die offene Eingabe in den Store und
   stößt den Schreibvorgang an (ADR-0005 Punkt 5, ADR-0030).
   (b) Solange das Dokument danach weiterlebt, kommt der Schreibvorgang an.
   Dazu gehören Feld verlassen, Route verlassen, Enter und
   `visibilitychange`→`hidden` bei App- oder Tab-Wechsel.
2. **Der Schreibweg für den Ort-Datensatz wird gehärtet, und zwar als
   Struktur in `src/persistence/orte-repository.ts`, nicht als
   Aufrufkonvention.** Gelten zwei Bedingungen — die Datenbankverbindung ist
   offen (`oeffneDatenbank()` gecacht) und für die ID steht kein älterer
   Schreibvorgang aus —, dann liegt zwischen Auslöser und `put()` **keine
   Task-Grenze**, nur Microtasks. Direkt nach dem `put()` wird die
   Transaktion **ausdrücklich committet** (`IDBTransaction.commit()`). Ohne
   `commit()` muss die Rückmeldung des `put()` erst im Dokument ankommen,
   bevor der Auto-Commit greift — genau diesen Rückweg gibt es beim Entladen
   nicht mehr. Verfügbarkeit wird zur Laufzeit geprüft; fehlt `commit()`,
   bleibt der Auto-Commit (heutiges Verhalten). Ob das den Fall in Chromium
   tatsächlich rettet, ist **nicht belegt**. Belegt wird es mit dem Messlauf
   des Leads (Punkt 6), nicht mit diesem ADR.
3. **Das Verlassen der Seite wird nie durch einen Dialog aufgehalten.** Das
   ist die **Wirkung**, die ADR-0005 mit „kein `beforeunload`" verbieten
   wollte, und sie gilt weiter. Die Variante „`beforeunload` nur als
   Absicherung für einen bereits ausstehenden Schreibvorgang" hilft dem Fall
   nicht. `beforeunload` feuert **vor** `pagehide`, zu diesem Zeitpunkt
   steht noch kein Schreibvorgang aus. Hilfreich wäre `beforeunload` nur als
   **fünfter Auslöser**. Den gibt es in dieser Runde nicht (siehe
   „Alternativen").
4. **Kein zweiter Speicherweg für das Entladen.** `navigator.sendBeacon`
   schickt eine HTTP-Anfrage an einen Server — den es nach ADR-0001 nicht
   gibt. Ein synchroner Ausweich-Speicher (`localStorage`-Journal, beim
   nächsten Start in IndexedDB eingespielt) wäre der einzige Weg mit
   annähernder Zusicherung. Er bräuchte aber einen zweiten Gerätespeicher
   (widerspricht ADR-0004 und code-conventions „kein `localStorage`"),
   einen Wiederherstellungspfad beim Start und eigene Regeln für Export,
   Import und mehrere Tabs. Das wäre ein eigenes Vorhaben mit
   Nutzerentscheidung, keine Korrektur in einem Paket.
5. **Akzeptanzkriterien und Zusicherungen versprechen „überlebt" nur für
   Fälle aus Punkt 1(b).** „Überlebt ein sofortiges Neuladen oder Schließen,
   während der Fokus noch im geänderten Feld steht" ist eine **benannte
   Grenze**, kein Kriterium. Das gilt projektweit für jedes Feld im
   Ortsdetail, nicht nur für Tags. Der `product-owner` formuliert Kriterien
   entsprechend, und der `architekt` prüft das beim Einordnen.
6. **Rauchtest: Die Grenze wird gemeldet, der Exit-Code hängt nicht an ihr.**
   Das ist eine benannte Ausnahme nach ADR-0023 Punkt 7 zu ADR-0023 Punkt 2.
   Auf eine Eigenschaft, die niemand zusichern kann, lässt sich keine harte
   Zusicherung bauen — ein dauerhaft roter Rauchtest verdeckt jeden künftigen
   echten Befund. ADR-0023 Punkt 6 duldet Rot nur, solange ein
   geschnittenes Paket den Befund behebt.
   - **Hart (Exit-Code 1):** Das Zusammenspiel beim Auslöser `pagehide` wird
     am **weiterlebenden** Dokument geprüft: ein `pagehide` im Dokument
     selbst ausgelöst, der Fokus bleibt im Feld. Eigenschaft: Der **erste**
     `put()`, den dieser Auslöser anstößt, trägt den Tag, und nach dem
     Neuladen ist die Pille da. Das prüft die Verdrahtung und ADR-0030
     Punkt 4, also „erst abholen, dann schreiben". Das Mittel — etwa
     aufgezeichnete `put()`-Werte — wählt und verifiziert der Lead. Der
     Rot-Nachweis läuft gegen einen Stand ohne Abholen in `pagehide`
     (ADR-0027 Punkt 8).
   - **Gemeldet, nicht hart:** Der echte Reload mit Fokus im Feld läuft
     weiter und gibt je Lauf „erhalten" oder „verloren" als benannte Grenze
     aus, mit Verweis auf dieses ADR. Das folgt demselben Muster wie „auf
     WebKit ungeprüft" (ADR-0029). Der Fall wird nicht gestrichen, er ist das
     Warnsystem dafür, ob Punkt 2 in Chromium trägt.

## Konsequenzen

- Positiv: Die Risikoaussage von ADR-0005 stimmt wieder. Der Verlustfall ist
  benannt und reproduzierbar, er ist kein seltener Zufall. Kriterien, die
  strukturell nicht erfüllbar sind, fallen beim Einordnen auf, nicht erst
  bei der Abnahme.
- Positiv: Punkt 2 härtet alle Felder des Ortsdetails auf einmal, weil alle
  denselben Schreibweg nehmen.
- Negativ/Trade-off: Der Verlust bleibt möglich, wenn am Desktop
  neu geladen, geschlossen oder über die Adresszeile weggegangen wird und der
  Fokus noch im geänderten Feld steht. Mobil (App-Wechsel, Sperren,
  Tab-Übersicht) läuft vorher `visibilitychange` bei lebendem Dokument; dort
  greift Punkt 1(b).
- Negativ/Trade-off: Steht für dieselbe ID noch ein älterer Schreibvorgang
  aus, wartet der neue in der Warteschlange (ADR-0005 Punkt 3). Er wird dann
  über eine Task-Grenze hinweg abgeschickt, und Punkt 2 greift nicht. Das
  wird bewusst hingenommen: Die Warteschlange bleibt unverändert.
- Betrifft künftig: `product-owner` beim Formulieren von „überlebt"-Kriterien
  (Punkt 5); `architekt` beim Einordnen und bei der Warteschlange;
  `frontend-lead` bei jedem neuen Schreibweg in `src/persistence/` für
  inline bearbeitete Datensätze (Punkt 2). `Bewertungsachse.vue` ist **nicht**
  von dieser Grenze betroffen, sondern hat eine härtere Lücke: Ihr
  Kommentar- und Zahlenentwurf erreicht bei `pagehide` den Store gar nicht.
  Diese Lücke ist deterministisch, nicht zeitabhängig, und steht als
  bekannter Kandidat in ADR-0030 Punkt 8.

## Alternativen (kurz)

- **`beforeunload` mit Bestätigungsdialog, solange geschrieben wird** —
  verworfen. Das ist genau die Wirkung, die ADR-0005 ausschließt: ein
  sichtbarer Dialog bei unsichtbarem Autosave. Außerdem greift es in Fall
  (b) nicht, weil zum `beforeunload`-Zeitpunkt noch nichts aussteht.
- **`beforeunload` ohne Dialog als fünfter Auslöser** (kein
  `preventDefault`, kein `returnValue`) — **zurückgestellt, nicht
  verworfen**. Beim Neuladen oder Weggehen über die Adresszeile gewönne es
  die Zeit bis zum Eintreffen des neuen Dokuments, beim Schließen des Tabs
  kaum. In Firefox nimmt ein dauerhaft registrierter Listener der Seite
  den Back/Forward-Cache. Sauber wäre nur eine Registrierung, solange eine
  Änderung ungeschrieben ist — dafür bräuchte es einen Zustand
  „ungeschrieben", den es heute nicht gibt. Wiedervorlage, falls der
  Messlauf aus Punkt 6 zeigt, dass Punkt 2 allein nicht trägt, und der
  Nutzer die Grenze aus Punkt 5 nicht hinnehmen will.
- **`navigator.sendBeacon`** — verworfen, weil kein Server existiert
  (ADR-0001).
- **Synchroner `localStorage`-Journal beim Entladen** — nicht in dieser Runde
  (Punkt 4). Das wäre ein eigenes Paket mit ADR-Abweichung von ADR-0004.
- **Harte Rauchtest-Zusicherung auf den echten Reload beibehalten** —
  verworfen. Sie wäre entweder dauerhaft rot oder zufallsabhängig und würde
  die Aussagekraft des gesamten Rauchtests untergraben (Punkt 6).
