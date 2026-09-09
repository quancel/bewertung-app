# ADR-0014: Tag-Modell — Feld im Ort-Datensatz, abgeleitetes Vokabular, case-insensitive Identität

- **Status**: accepted
- **Datum**: 2026-09-09
- **Bounded Context(s)**: `tags`, `orte`, `datensicherung`
- **task_id**: `PO-2026-09-07-004` (zweite Formaterweiterung nach ADR-0003)

## Kontext

PO-2026-09-07-004 erweitert das gespeicherte Format zum zweiten Mal (nach
-002) und schreibt damit etwas fest, das ab -009 in jeder Exportdatei steht.
Drei Fragen sind vor dem Bauen zu entscheiden, weil ihre Umkehr eine
Migration kostet: Wo liegen die Tags eines Ortes? Woher kommt die Liste
„alle je vergebenen Tags", die Vorschläge und Filterleiste speisen? Und wann
sind zwei eingetippte Tags derselbe Tag?

Die Akzeptanzkriterien fordern nebenbei etwas, das ohne Entscheidung leicht
zu einem Aufräum-Mechanismus wird: „Wird ein Tag am letzten verbliebenen Ort
entfernt, erscheint er nicht mehr in den Vorschlägen und nicht mehr in der
Filterleiste" und „es bleibt kein Filter auf einen Tag stehen, den es nicht
mehr gibt".

## Entscheidung

1. **Tags sind ein Feld im Ort-Datensatz**: `tags: string[]` (ADR-0004
   Punkt 5 — ein Ort ist ein Datensatz). Kein eigener Object Store, kein
   eigener Pinia-Store (ADR-0008 Punkt 2/3); geschrieben wird über das
   öffentliche API von `useOrteStore`.
2. **Das Tag-Vokabular wird abgeleitet, nicht gespeichert.** Die Menge aller
   Tags entsteht als reine Funktion über alle Orte (`src/shared/lib/`). Es
   gibt kein Tag-Register und keine Referenzzählung. Damit ist „ein Tag
   verschwindet mit seinem letzten Ort" strukturell erfüllt statt durch eine
   Aufräumroutine, die man vergessen kann.
3. **Zwei Tags sind identisch, wenn sie nach `toLocaleLowerCase('de')` und
   Trimmen gleich sind.** Gespeichert wird die Schreibweise, in der ein Tag
   im Bestand zuerst vergeben wurde; die spätere abweichende Schreibweise
   wird auf sie abgebildet, nicht danebengestellt. Identität gilt einheitlich
   für Dedup am Ort, Vorschläge, Vokabular und Filter — nicht je Stelle neu
   entschieden. *(Unter Vorbehalt der Rückfrage im Handoff von -004.)*
4. **Ein Tag ist ein getrimmter, nicht-leerer String.** Leereingaben und
   reine Leerzeichen erzeugen keinen Tag — stillschweigend, ohne
   Fehlermeldung. Innenliegende Leerzeichen sind erlaubt; bestätigt wird mit
   Enter, nicht mit Leertaste.
5. **Die Reihenfolge im Array trägt keine Bedeutung.** Angezeigt wird
   überall alphabetisch über `Intl.Collator('de')` — dieselbe Collator-Regel
   wie beim Sekundärschlüssel der Sortierung (ADR-0009 Punkt 10).
6. **Der Migrationsschritt schreibt `tags: []` aktiv in jeden Ort** (Muster
   aus ADR-0007 Punkt 1). Nicht ein fehlendes Feld, kein `?? []` beim Lesen
   (ADR-0005). Dateiname nach `code-conventions.md` = Zielversion; nach -002
   ist das `migrations/003-tags.ts` mit Fixture `__fixtures__/v3-bestand.json`.
7. **Zwischen `einstellungen` und `orte` gibt es keine referenzielle
   Integrität.** Der gespeicherte Filterzustand nennt Tag-Namen; Namen, zu
   denen es kein Tag mehr gibt, werden beim Lesen und beim Auswerten still
   verworfen (ADR-0006 Punkt 4, ADR-0009 Punkt 5). Kein Aufräumen des
   Gerätezustands beim Ändern des Bestands, keine Meldung.
8. **Von der Filterzeile wird nur die Verknüpfung persistiert**
   (`orte.tagfilter`, ADR-0009 Punkt 3). Die aktive Tag-Auswahl lebt im
   Ansichtszustand von `useOrteStore`: sie überdauert Navigation und den
   Wechsel Liste↔Detail, nicht das Neuladen. *(Unter Vorbehalt der Rückfrage
   im Handoff von -004; die Gegenentscheidung ändert nur den Inhalt des
   Schlüssels, nicht seine Lage.)*
9. **Das Tag-Prädikat ist eine reine Funktion in `src/shared/lib/`**
   (ADR-0008 Punkt 6): `(tags, aktiveTags, verknuepfung) => boolean`. Eine
   leere Auswahl liefert in **beiden** Modi „alle Orte"; ein einzelner
   aktiver Tag liefert in beiden Modi dasselbe. Es gibt keine Sonderregel für
   „genau ein Tag".
10. **Gefiltert wird vor dem Sortieren.** Die Bereichsansicht bildet
    `sortiere(filtere(orte))`. Die Gruppe „ohne Wert" (ADR-0009 Punkt 9)
    entsteht auf der bereits gefilterten Menge; die Trefferzahl in Zeile 1
    nennt gefilterte gegen gesamte Menge. Es gibt genau eine Reihenfolge
    dieser beiden Schritte, damit Gruppengröße und Trefferzahl nicht
    auseinanderlaufen können.

## Konsequenzen

- Positiv: Zwei Akzeptanzkriterien (Tag verschwindet mit seinem letzten Ort;
  kein Filter auf einen nicht mehr existierenden Tag) folgen aus Punkt 2 und
  7, statt einzeln abgesichert zu werden.
- Positiv: -009 exportiert Tags als Teil des Ort-Datensatzes, ohne eine
  zweite Sammlung mitführen zu müssen; der Import „Ergänzen" führt zwei
  Geräte zusammen, ohne Tag-IDs abgleichen zu müssen.
- Negativ/Trade-off: Das Vokabular wird bei jeder Anzeige neu abgeleitet.
  Bei Hunderten Orten mit je wenigen Tags ist das folgenlos; wird es das
  nicht, ist der Ort der Änderung ein Memo in `shared/lib/`, kein
  gespeichertes Register.
- Negativ/Trade-off: Ohne Register gibt es kein „Tag global umbenennen" und
  kein „Tag global löschen". Beides ist in -004 nicht gefordert und wäre ein
  eigenes Paket — es bräuchte kein neues Datenmodell, sondern einen Schreibweg
  über alle betroffenen Orte.
- Negativ/Trade-off: Punkt 3 macht „Pizza" und „pizza" zu einem Tag. Das ist
  bewusst die umkehrbare Richtung: von case-insensitiv nach case-sensitiv zu
  wechseln kostet nichts, umgekehrt müssten bereits entstandene Doppel im
  Bestand zusammengeführt werden.
- Betrifft künftig: **-005** erbt Punkt 6 (Feld aktiv schreiben) für seinen
  eigenen Migrationsschritt. **-009** exportiert `tags` als Feld und
  `einstellungen` weiterhin gar nicht. **-003** wird von Punkt 10 berührt,
  baut ihn aber nicht: Bis -004 ist die gefilterte Menge die Gesamtmenge.

## Alternativen (kurz)

- **Eigener Object Store `tags` mit IDs, Orte referenzieren IDs** —
  verworfen: ADR-0004 Punkt 5 hat das für Bewertungen und Tags bereits
  abgewogen; Tags werden immer mit dem Ort gelesen und geschrieben, und ein
  Register bräuchte Aufräumen, Migration und eine zweite Löschkaskade.
- **Tag-Vokabular als gespeicherte Liste neben den Orten** — verworfen:
  zweite Wahrheit über denselben Sachverhalt; sie kann von den tatsächlich
  vergebenen Tags abweichen, und genau dann sieht der Nutzer Vorschläge für
  Tags, die es nicht gibt.
- **Case-sensitive Tags** — verworfen als Voreinstellung: erzeugt für den
  Nutzer unsichtbare Dubletten in Vorschlagsliste und Filterleiste, und die
  spätere Korrektur wäre eine Datenzusammenführung statt einer Codeänderung.
- **Normalisierte Kleinschreibung speichern** — verworfen: Der Nutzer sähe
  seine Tags nie so, wie er sie eingetippt hat; die Anzeige wäre eine
  Rückverwandlung, die es nicht gibt.
- **Aktive Tag-Auswahl beim Ändern des Bestands aktiv aufräumen** —
  verworfen: schreibender Nebeneffekt einer Bestandsänderung auf den
  Gerätezustand; Punkt 7 erreicht dasselbe beim Lesen, ohne Schreibvorgang.
