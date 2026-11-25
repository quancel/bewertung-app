# ADR-0040: Benannte Ausnahmen der Rauchtest-Zusicherungen: ein Register, Gegenprobe am synthetischen DOM als Pflicht, und die Abschneider-Ausnahme folgt dem Containing Block (Erweiterung von ADR-0023 Punkt 7)

- **Status**: accepted
- **Datum**: 2026-11-25
- **Bounded Context(s)**: `app-shell` (projektweit, `scripts/smoke.mjs`), `karte`, `orte`, `medien`
- **task_id**: Nachpflege zu `PO-2026-11-24-004` und `PO-2026-11-24-005`

## Kontext

ADR-0023 Punkt 7 erlaubt Ausnahmen von einer Zusicherung, wenn sie als
benannte Bedingung formuliert sind. Bis -003 gab es drei, alle in
`pruefeVerdeckung()`: aktive Auswahlliste, fixierte Chrome, hinter
`aria-modal`. Mit -004 und -005 kamen in einem Lauf vier weitere dazu, und
erstmals betrifft eine davon `pruefeUeberlauf()`:

1. `[inert]`-Teilbaum (Verdeckung, ADR-0039 Punkt 7).
2. Nicht modale Überlagerung (`role="dialog"` ohne `aria-modal`), deren
   Rechteck vollständig auf dem Rechteck des Elements liegt (Verdeckung,
   Anlass: der fokussierbare Kartencontainer unter der Schnellansicht).
3. Horizontaler Scroll-Streifen (`overflow-x: auto|scroll` bei
   `overflow-y: hidden|clip`): Sein nicht sichtbarer Teil ist kein
   Überstand (Verdeckung und Überlauf, Anlass: `Bildstreifen.vue`).
4. Abschneider: Liegt **irgendein** DOM-Vorfahr mit `overflow-x:
   hidden|clip` (oder ein Streifen nach 3) vollständig im Bildschirm, ist
   der Überstand eines Elements kein Befund (Überlauf, Anlass:
   Leaflet-Kacheln, danach die Bildkachel im Streifen).

Jede Ausnahme kann einen echten Befund verschlucken. Die Nachpflege hat
alle vier am Code (`scripts/smoke.mjs`, `pruefeVerdeckung` ab Zeile 995,
`pruefeUeberlauf` ab Zeile 1177, `pruefeAusnahmenGegenprobe` ab Zeile 4907)
gegengelesen. Dabei fielen zwei Lücken auf:

- **Ausnahme 4 läuft über die DOM-Vorfahren, nicht über den Containing
  Block.** `overflow` schneidet nur Nachfahren ab, deren Containing Block
  der Abschneider selbst oder ein Element in ihm ist. Ein Element mit
  `position: fixed`, oder mit `position: absolute` ohne positionierten
  Vorfahren innerhalb des Abschneiders, wird **nicht** abgeschnitten, auch
  wenn es im DOM darin steht. Die Ausnahme erklärt seinen Überstand trotzdem
  für unsichtbar. Das ist genau der Mechanismus aus ADR-0011, Nachtrag zu
  Punkt 6 (`.ortszeile__sr-hervorhebung` entkam der Spalte). Der
  beobachtbare Fehlerfall: Ein absolut positioniertes Element in einer
  Karten- oder Streifenfläche ohne `position: relative` ragt sichtbar aus
  dem Bildschirm, und `pruefeUeberlauf()` bleibt grün.
- **Für Ausnahme 4 mit `hidden|clip` fehlt die Gegenprobe.**
  `pruefeAusnahmenGegenprobe()` hat Fälle für Streifen, für den nicht
  abschneidenden Container und für den zu breiten Streifen. Ein Fall
  „`overflow-x: hidden`-Abschneider im Bildschirm, Kind ragt hinaus → kein
  Befund" und der Gegenfall „absolut positioniertes Kind entkommt dem
  Abschneider → Befund" fehlen. Der -004-Bericht und `CLAUDE.md` nennen eine
  Gegenprobe für diese Ausnahme. Im heutigen `scripts/smoke.mjs` steht sie
  nicht, ob sie nur einmalig lief oder später verloren ging, ist offen.
- Kleiner: Ausnahme 2 greift auch, wenn das Rechteck der Überlagerung dem
  des Elements **gleich** ist (Toleranz ±1px). Dann ist das Element
  vollständig verdeckt und nicht mehr „über den freien Teil bedienbar", wie
  die Begründung im Prüfcode sagt.

## Entscheidung

1. **Alle sieben Ausnahmen bleiben gültig.** Jede ist an eine Eigenschaft
   gebunden, keine an eine Klasse oder ID. Die Begründungen stimmen für die
   Anlassfälle.
2. **Register.** Die gültigen Ausnahmen der Rauchtest-Zusicherungen stehen
   in diesem ADR, je Zeile mit der Prüfung, der Bedingung und dem Gegenfall:

   | Prüfung | Bedingung (Eigenschaft) | Gegenfall, der Befund bleiben muss |
   |---|---|---|
   | Verdeckung | aktiv bediente Auswahlliste (absolut, Nachbar-`input`, enthält `button`) | Hinweisfläche ohne Button (ADR-0023 P7) |
   | Verdeckung | verdeckendes Element in fixierter Chrome, verdecktes nicht fixiert | lokale, absolut positionierte Überlagerung |
   | Verdeckung | hinter `aria-modal="true"` | Verdeckung innerhalb desselben Dialogs (bewusst ungeprüft, kein Fall) |
   | Verdeckung | Element in `[inert]`-Teilbaum | harte Gegen-Zusicherung „genau die verdeckten Marker sind `inert`" (ADR-0039 P7) |
   | Verdeckung | nicht modale Überlagerung liegt vollständig auf dem Element **und das Element behält einen sichtbaren Rest** | kleines Element teilweise darunter; Element gleich groß wie die Überlagerung |
   | Verdeckung, Überlauf | Punkt bzw. Überstand außerhalb des sichtbaren Teils eines horizontalen Streifens | vertikal scrollende Spalte; Streifen selbst zu breit |
   | Überlauf | ein Abschneider (`overflow-x: hidden|clip` oder Streifen), der **das Element tatsächlich abschneidet**, liegt vollständig im Bildschirm | Container ohne Abschneiden (Koordinatenzeile); `fixed`-Kind oder absolut positioniertes Kind, das dem Abschneider entkommt |

   Eine neue Ausnahme bekommt eine Zeile hier. Damit ist eine Änderung des
   ADR fällig, kein Kommentar im Skript.
3. **Jede Ausnahme hat in `pruefeAusnahmenGegenprobe()` zwei Fälle am
   synthetischen DOM**: einen, in dem sie greift (kein Befund), und den
   Gegenfall aus dem Register (Befund). Die harte Gegen-Zusicherung zu
   `[inert]` ersetzt dort den synthetischen Gegenfall nicht, sie ergänzt ihn.
   Die Gegenprobe wird wie jede Zusicherung rot nachgewiesen (ADR-0027
   Punkt 8): eine Mutation, die die Ausnahme verbreitert, macht sie rot.
4. **„Schneidet tatsächlich ab" folgt dem Containing Block, nicht dem
   DOM.** Für ein Element mit `position: fixed` zählt kein Vorfahr als
   Abschneider. Ausnahme: ein Vorfahr mit `transform`, `filter` oder
   `contain` wird zum Containing Block. Wer diesen Fall braucht, nimmt ihn
   ausdrücklich auf. Für `position: absolute` zählen nur Abschneider, die
   der nächste positionierte Vorfahr ist oder ihn enthalten. Für alle
   anderen Elemente gilt jeder DOM-Vorfahr. Das Mittel (`offsetParent`,
   berechnete `position` der Vorfahren) ist **vom Lead zu verifizieren**
   (learnings.md, 2026-09-15). Verbindlich ist die Eigenschaft: Ein
   Element, dessen Überstand sichtbar ist, bleibt ein Befund.
5. **Punkt 2 (gleich große Überlagerung) und Punkt 4 sind Auflagen an ein
   Folgepaket**, nicht an den Bestand. Bis dahin sind sie eine **benannte
   Lücke**: Ein Paket, das in einem Abschneider (Karte, Streifen, Spalte mit
   `overflow-x: hidden`) ein absolut oder fest positioniertes Element
   einführt, prüft dessen Überstand im Bildschirmfoto und sagt es im
   Bericht.

## Konsequenzen

- Positiv: Die Ausnahmen sind an einer Stelle aufzählbar. Ihre Reichweite
  steht neben ihrer Begründung (learnings.md, 2026-09-16: Reichweite
  ausschreiben statt den Namen als Deckung zu lesen).
- Positiv: Die Abschneider-Ausnahme verschluckt den Fehler nicht mehr, den
  das Projekt bereits einmal hatte (ADR-0011 Nachtrag P6).
- Negativ/Trade-off: Bis zum Folgepaket ist die Lücke aus Punkt 4 offen. Im
  heutigen Bestand ist kein Fall bekannt, in dem sie greift. Die
  Leaflet-Kacheln liegen in einem positionierten Container.
- Negativ/Trade-off: Jede neue Ausnahme kostet ein ADR-Update und zwei
  Gegenprobe-Fälle. Das ist Absicht.
- Betrifft künftig: `frontend-lead` bei jeder Änderung an
  `pruefeVerdeckung()`/`pruefeUeberlauf()`; `architekt` beim Einordnen eines
  Pakets, dessen Rauchtest eine neue Ausnahme braucht (`files_to_touch`:
  `scripts/smoke.mjs`, dieses ADR über den Architekten).

## Alternativen (kurz)

- **Ausnahmen nur im Skript-Kommentar führen**: verworfen. Sieben
  Ausnahmen in zwei Funktionen sind ohne Register nicht mehr überblickbar.
  Eine davon hat ihre Gegenprobe schon verloren, ohne dass es auffiel.
- **Abschneider-Ausnahme zurücknehmen, Leaflet-Kacheln per Selektor
  ausnehmen**: verworfen, widerspricht ADR-0023 Punkt 7.
- **Nur den nächsten Abschneider werten (Stand -004)**: verworfen. Die
  Bildkachel mit `overflow: hidden` ragt selbst aus dem Streifen und
  lieferte Fehlbefunde. Der Schnitt aller Abschneider ist richtig, sofern
  jeder davon das Element tatsächlich abschneidet (Punkt 4).
