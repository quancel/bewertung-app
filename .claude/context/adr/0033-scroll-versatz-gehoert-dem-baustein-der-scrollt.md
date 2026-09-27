# ADR-0033: Den Scroll-Versatz einer Master-Detail-Spalte setzt der Baustein zurück, der sie scrollt — die Bereichsansicht löst nur aus (Präzisierung von ADR-0011 Punkt 1/6; zweite Art exponierter Methode neben ADR-0030 Punkt 3)

- **Status**: accepted
- **Datum**: 2026-09-27
- **Bounded Context(s)**: `app-shell`, `orte`
- **task_id**: `PO-2026-09-26-003`

## Kontext

ADR-0011 Punkt 6 sagt seit -012: „Beim Wechsel des gewählten Ortes beginnt
die Detail-Spalte oben; die Listen-Spalte behält ihren Versatz." Gebaut war
das nie. Ab `lg` scrollt nicht das Fenster, sondern das Spalten-Element in
`shared/ui/MasterDetail.vue` (`overflow-y: auto`, ADR-0032). Das
`scrollBehavior` des Routers (`{ top: 0 }` bzw. `savedPosition`) wirkt nur auf
das Fenster und erreicht die Spalte deshalb nicht. Bei A→B bleibt
`.ortsdetail` dasselbe DOM-Element, nur der Inhalt wechselt, also bleibt auch
der Versatz stehen. Beobachtbar: In Ort A nach unten scrollen, Ort B wählen,
und B beginnt mitten im Formular.

Den Auslöser kennt nur `Ortebereich.vue` (`watch(ortId)`, ADR-0011 Punkt 4).
Den Scroll-Container besitzt nur `MasterDetail.vue`: Er steckt in dessen
Template und dessen CSS, und nur dort wird entschieden, ob er in einer
bestimmten Breite überhaupt scrollt. Laut ADR-0011 Punkt 1 besteht die
Schnittstelle des Bausteins aus zwei Slots und einem Flag. Ein Weg „setze
deinen Versatz zurück" gehört nicht dazu. ADR-0030 Punkt 3 hat genau eine Art
exponierter Methode zugelassen, und zwar für präsentationale Komponenten
fremder Contexts. Diese Art ist das nicht.

## Entscheidung

1. **Die Bereichsansicht greift nicht in das DOM des Bausteins.**
   Ausgeschlossen sind in `Ortebereich.vue` (und in jeder künftigen Ansicht,
   die `MasterDetail` benutzt) `querySelector`/`closest` auf Klassen des
   Bausteins, ein Hangeln über `parentElement` und die Suche nach dem
   „nächsten scrollbaren Vorfahren". Beobachtbarer Fehlerfall: ADR-0032 hat
   den Baustein gerade erst umgebaut. Ein umbenannter Wrapper oder ein
   zusätzlicher Wrapper macht eine DOM-Suche still wirkungslos, und
   Typecheck, Lint und Vitest bleiben grün. Die Vorfahren-Suche fände
   unterhalb `lg` das Dokument selbst und setzte den **Fenster**-Versatz
   zurück. Damit wäre „unterhalb `lg` keine Änderung" verletzt.
2. **`MasterDetail.vue` bekommt über `defineExpose` genau eine synchrone
   Methode: `setzeDetailVersatzZurueck()`.** Sie setzt `scrollTop = 0` am
   eigenen Wrapper der Detail-Spalte, den sie über eine Template-Ref
   erreicht, und tut sonst nichts. Kein `scrollIntoView`, kein
   `window.scrollTo`, kein `behavior: 'smooth'`, kein Rückgabewert. Die
   Methode prüft auch keine Breite (kein `matchMedia`, ADR-0028 Punkt 4).
   Dass sie breitenunabhängig richtig wirkt, folgt aus dem CSS, das der
   Baustein ohnehin besitzt: Unterhalb `lg` ist der Wrapper kein
   Scroll-Container, ohne offenes Detail sogar `display: none`, und die
   Zuweisung bleibt dort ohne Wirkung. Der Name ist über
   `InstanceType<typeof MasterDetail>` typisiert. Eine Umbenennung meldet
   also der Typecheck, bei einem Selektor-String bliebe sie unbemerkt.
3. **Der Baustein bleibt zustandslos und entscheidet nicht, wann.** Es gibt
   keinen Watcher im Baustein, keine Prop als „Inhaltsschlüssel" und keinen
   eigenen Auslöser. Wann zurückgesetzt wird, weiß allein die
   Bereichsansicht, weil nur sie die Route kennt. Beobachtbarer Grund: Mit
   einem Prop-Watcher im Baustein liefen Scroll-Reset und Fokus in zwei
   Watchern, deren Reihenfolge niemand festlegt. Die `design_notes` von -003
   verlangen dagegen ausdrücklich einen Mechanismus und keinen zweiten
   Watcher.
4. **Ausgelöst wird in `Ortebereich.vue` im bestehenden `watch(ortId)`,
   für jedes `neu !== null`**, also beim Öffnen ohne vorherige Auswahl und
   beim Wechsel A→B, unabhängig vom Auslöser. Nach `await nextTick()` gilt
   diese Reihenfolge: (a) `setzeDetailVersatzZurueck()`, (b) Fokus auf
   „Detailansicht schließen", (c) `scrolleZeileInSicht(neu)`. Der Versatz
   muss vor dem Fokus zurückgesetzt sein. So muss das Fokussieren des
   klebenden Kopfes nie selbst scrollen, und das Ergebnis hängt nicht davon
   ab, wie eine Engine `focus()` auf einem `position: sticky`-Element
   behandelt. Ein erneuter Aufruf desselben Ortes erreicht den Watcher gar
   nicht: `watch` vergleicht Werte, und ein `RouterLink` auf die aktuelle
   Adresse ist eine doppelte Navigation ohne Adresswechsel. Kriterium 2 folgt
   damit aus der Struktur und nicht aus einer Abfrage.
5. **Die Listen-Spalte bekommt keine Methode.** Ihr Mechanismus bleibt
   `scrollIntoView({ block: 'nearest' })` auf dem Zeilen-Element. Das
   Element gehört der Ansicht, es ist ihr eigener Slot-Inhalt, und die
   Ansicht muss dafür nicht wissen, welcher Vorfahr scrollt. Eine
   symmetrische zweite Methode „auf Vorrat" gibt es nicht.
6. **Reichweite.** Neben ADR-0030 Punkt 3 („gib deinen unbestätigten Stand
   ab") gibt es damit eine zweite Art imperativer Aufforderung: Ein geteilter
   Layout-Baustein in `shared/ui/`, der einen Scroll-Container besitzt, macht
   die **Operation auf diesem Container** als Methode verfügbar. Der Aufrufer
   löst sie aus, sie ist synchron, hat keinen Rückgabewert und führt keinen
   Zustand. Nicht gedeckt sind Getter (Versatz lesen), Fokus-Methoden und
   das Setzen beliebiger Werte. Jede weitere Art braucht ein eigenes ADR.
7. **Verifikation** (ADR-0023/0027): Harte Rauchtest-Zusicherung ab `lg`,
   formuliert als Eigenschaft. Nach A→B, einmal per Klick und einmal rein
   über den Browserverlauf, hat der Scroll-Container der Detail-Spalte den
   Versatz 0, und der Fokus liegt auf „Detailansicht schließen". Die
   Vorbedingung ist Teil der Zusicherung: Vor dem Wechsel muss bei Ort A
   tatsächlich ein Versatz > 0 erreicht sein. Wird er nicht erreicht, ist
   das ein Befund und kein stilles Grün. Rot-Nachweis gegen den Stand nach
   -002 (ADR-0027 Punkt 8). Keine Component-Spec für den Reset: jsdom hat
   kein Layout, und `scrollTop` sagt dort nichts (ADR-0027 Punkt 4).

## Konsequenzen

- Positiv: ADR-0011 Punkt 6 ist ab jetzt gebaut und nicht mehr nur
  behauptet. Fokus und Versatz hängen an derselben Stelle wie das Öffnen.
- Positiv: Der Baustein kann sein DOM ändern (Wrapper, Klassen), ohne dass
  ein Aufrufer bricht. Der Vertrag ist die typisierte Methode, nicht die
  Struktur.
- Negativ/Trade-off: Die Ansicht hält eine Template-Ref auf den Baustein und
  ruft ihn imperativ auf. Das ist eine engere Kopplung als Props. Vergisst
  eine künftige zweite Bereichsansicht den Aufruf, meldet das kein Typecheck,
  sondern erst der Rauchtest, sofern sie dort geprüft wird.
- Negativ/Trade-off: Ein Aufruf beim Öffnen ohne vorherige Auswahl ist heute
  fast immer wirkungslos, weil der Platzhalter kurz ist und der Versatz
  ohnehin 0. Er steht trotzdem da, damit Öffnen und Wechsel ein Pfad sind
  und keine zwei.
- Betrifft künftig: jede Ansicht, die `MasterDetail` benutzt, und den
  `architekt`, wenn jemand eine weitere Operation am Baustein verlangt
  (Punkt 6).

## Alternativen (kurz)

- **DOM-Query aus `Ortebereich.vue`** (`.master-detail__detail`) —
  verworfen: koppelt an eine interne, scoped Klasse. Die Umbenennung fällt
  in keiner statischen Prüfung auf (Punkt 1).
- **Nächsten scrollbaren Vorfahren suchen** — verworfen: Das ist Heuristik
  über berechnete Stile. Unterhalb `lg` träfe sie das Fenster (Punkt 1).
- **Prop `inhaltsSchluessel` plus Watcher im Baustein** — verworfen: zwei
  Watcher ohne festgelegte Reihenfolge, und die `design_notes` verlangen
  einen Mechanismus (Punkt 3).
- **`scrollBehavior` des Routers mit `el`** — verworfen: Es positioniert das
  **Fenster** relativ zu einem Element und setzt den Versatz eines inneren
  Containers nicht zurück. Außerdem müsste `app/router/` eine Klasse aus
  `shared/ui/` kennen.
- **`:key` auf dem Detail-Inhalt (Remount)** — verworfen: Das setzt den
  Versatz des umgebenden Containers nicht zurück, verwirft Instanzzustand
  ohne Not und verschiebt die Reihenfolge aus ADR-0030 Punkt 4/6.
- **Detail-Inhalt scrollt selbst statt der Spalte** — verworfen: ändert die
  Scroll-Struktur aus ADR-0011 Punkt 6 und ADR-0032 für eine Operation, die
  eine Zeile braucht.
