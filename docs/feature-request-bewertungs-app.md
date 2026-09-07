# Feature-Request: Bewertungs-App (Erstauftrag)

Der Auftrag, mit dem das Agent-Team gestartet wird. Zum Auslösen den Block
unten vollständig in eine Claude-Code-Session kopieren — er beginnt mit
`/orchestrate` und ist genau so gemeint, wie er dasteht.

Er ist in mehreren Runden mit dem Nutzer geschärft worden. Drei Festlegungen
sind dabei bewusst getroffen und stehen im Text, weil sie sonst jede Rolle
anders errät: Schreiben ohne Netz ist **abgeschlossen** (keine Sync-Queue),
Pflichtfeld eines Ortes ist **nur die Bezeichnung**, und ein Ort ohne
Koordinaten ist ein **Normalzustand**, kein Validierungsfehler.

Die fünf Punkte unter „Bewusst offen" sind nicht vergessen, sondern
absichtlich offen: Sie gehören über `user_questions` an den Nutzer, nicht in
eine Annahme.

```
/orchestrate Baue eine private Bewertungs-App für Orte, die ich selbst besucht habe — im Geist von Tripadvisor oder Google Reviews, aber ausschließlich für meine eigenen Daten. Greenfield: Das Repo enthält bisher keinen Anwendungscode.

## Kernfunktionen

- Orte verwalten: einfaches CRUD. Anlegen, lesen, ändern, löschen — jedes Feld jederzeit nachträglich änderbar. Keine Zustandsmaschine, keine Entwurfs-/Freigabe-Stufen.
- Ein Ort darf unvollständig gespeichert werden. Pflicht ist nur eine Bezeichnung; Koordinaten, Adresse, Bewertungen, Bilder und Tags dürfen leer bleiben und später ergänzt werden. Das gilt ausdrücklich auch für Orte, die ohne Netz angelegt wurden — die Position wird dann eben später nachgetragen.
- Karte: Die Orte lassen sich auf einer Karte anzeigen. Orte ohne Koordinaten erscheinen dort nicht, bleiben in der Liste aber vollwertig; wie das im UI kenntlich wird, entscheidet der Designer.
- Bilder: Zu jedem Ort lassen sich Bilder zuordnen.
- Bewertung: Vier Achsen, je 0–10 — Ambiente, Zeit, Geschmack, Preis/Leistung. Zu jeder Achse optional ein Kommentar.
- Tags: Frei definierbare eigene Tags je Ort.
- Sortierung: Die Liste ist sortierbar.

## Technische Vorgaben (bindend)

- Frontend: Vue. Das ist gesetzt.
- Backend: Entscheidung des Architekten. Ich gebe keinen Stack vor, nur die Anforderung — was für diese Art der Speicherung tatsächlich nötig ist und nicht mehr. Wenn aus den Anforderungen unten folgt, dass gar kein eigener Backend-Dienst gebraucht wird, ist "kein Backend" das richtige Ergebnis; dann bitte als ADR festhalten, statt vorsorglich einen Dienst zu bauen.
- Daten clientseitig: Orte, Bewertungen, Kommentare, Bilder und Tags liegen auf dem Gerät. Das Gerät ist der endgültige Speicherort, nicht ein Zwischenpuffer.
- Keine Authentifizierung: kein Login, keine Nutzerverwaltung.

## Offline-Verhalten

Internet ist grundsätzlich vorhanden, und Kartenkacheln oder andere Standard-Ressourcen dürfen aus dem Netz geladen werden. Die App selbst muss aber ohne Netz vollständig bedienbar sein:

- Lesen ohne Netz: Liste öffnen und sortieren, einen Ort mit seinen Bewertungen, Kommentaren, Tags und Bildern ansehen.
- Schreiben ohne Netz: Orte anlegen, bearbeiten und löschen, bewerten, Kommentare schreiben, Bilder hinzufügen, Tags vergeben. Und zwar abgeschlossen — kein "wird gespeichert, sobald wieder Netz da ist", keine Warteschlange, kein Sync-Zustand im UI. Was gespeichert ist, ist gespeichert.
- Ohne Netz bleiben die Kartenkacheln leer. Das ist ausdrücklich in Ordnung. Die Karte darf dabei aber nicht die App blockieren, kaputt aussehen oder Fehler werfen — ein ruhiger Hinweis genügt, und alle Ortsdaten bleiben lesbar und bearbeitbar.
- Der Client lädt die App einmal und kann sie danach benutzen, ohne sie erneut aus dem Netz zu holen.

Netz wird damit nur noch für dreierlei gebraucht: Kartenkacheln, eine eventuelle Ortssuche beim Anlegen oder Nachtragen, und das Ausliefern einer neuen Version.

## Design

Ansprechend, leicht, modern, übersichtlich. Es gibt kein bestehendes Corporate Design — Farbsystem, Typografie und Charakter sind frei zu entwerfen. Das Konzept entsteht als Neuentwurf; die Markenfragen bitte an mich stellen, statt sie zu setzen.

## Bewusst offen — bitte fragen, nicht raten

Diese Punkte habe ich absichtlich nicht entschieden. Klärt sie über user_questions, statt eine Annahme durchzuziehen:

1. "Zeit" als Bewertungsachse ist mehrdeutig — Wartezeit, Aufenthaltsdauer, Service-Tempo? Ich muss sagen, was ich meine.
2. Gesamtnote: Soll aus den vier Achsen eine aggregierte Note entstehen, und wenn ja wie gewichtet — oder stehen die vier Werte nebeneinander?
3. Sortierung: nach welchen Kriterien, und ist Filtern nach Tags Teil davon?
4. Bilder: wie viele je Ort, sollen sie beim Hinzufügen verkleinert werden, und was passiert bei knappem Gerätespeicher?
5. Datensicherung: Clientseitige Daten sind weg, wenn der Browser-Speicher geleert wird. Soll es Export/Import geben?

## Nicht-Ziele

Kein Login, keine Mehrbenutzer-Fähigkeit, kein Teilen, keine Synchronisation zwischen Geräten. Keine fremden Bewertungen, kein Import aus Google oder Tripadvisor. Keine Inhalte anderer Personen.

## Hinweise an die Rollen

- Architekt: Die Greenfield-Referenzstruktur des Plugins beschreibt Angular/NgRx und Microservices. Beides passt hier nicht — Vue ist gesetzt, und ein Microservice-Zuschnitt wäre für eine clientseitig speichernde App vermutlich zu groß. Weiche bewusst ab und begründe die Abweichung im ADR, statt die Referenz zu übertragen. Lege code-conventions.md im Modus "vorgegeben" für Vue an.
- UX/UI-Designer: Der Zustand "keine Netzverbindung, Karte leer" ist ein regulärer Zustand dieser App, kein Fehlerfall. Er gehört in die Design-Konventionen wie Leer- und Ladezustand auch. Dasselbe gilt für den unvollständigen Ort — auch das ist normal, kein Validierungsfehler.
- Product Owner: Schneide so, dass früh etwas Benutzbares entsteht — einen Ort anlegen, bewerten, in der Liste sehen. Karte, Bilder und Tags bauen darauf auf.
```
