# Karte: Quick-Look-Sheet (Schnellansicht)

> Stand: 2026-11-25. Rücklink: [design-conventions.md](../design-conventions.md).
> Enthält: „Karte: Quick-Look-Sheet (PO-2026-11-24-005)". Schwellen der
> Ziehgeste: [zieh-wisch-schwellen.md](zieh-wisch-schwellen.md). Marker:
> [karte.md](karte.md).

Eigene, **nicht modale** Komponente (nicht `Sheet.vue`: kein Backdrop, die
Karte bleibt bedienbar, ein Tipp auf einen anderen Marker wechselt den
Inhalt). `role="dialog"`, **ohne** `aria-modal`, `aria-label`
„Schnellansicht: {Bezeichnung}".

- **Lage**: unten im Kartenbereich, über der Bottom-Tab-Leiste (bleibt
  sichtbar). Bis `md` volle Breite, ab `md` max. 480px linksbündig mit 16px
  Rand. **Bottom-Sheet in jeder Breite**, kein Seitenpanel. Radius 16px oben,
  Schatten wie `Sheet.vue`. Leaflet-Bedienelemente und Attribution rücken um
  die Sheet-Höhe nach oben (CSS-Variable); die Quellenangabe bleibt immer
  sichtbar (Lizenzpflicht). **Zoom-Knopf bei „voll"** wird **ausgeblendet und
  `inert`** (`karte-steuerung--verdeckt`: `visibility: hidden`), in „halb"
  und „eingeklappt" bleibt er bedienbar; Mausrad-/Pinch-Zoom bleibt in jedem
  Zustand möglich (entschieden 2026-11-25).
- **Zustände** (Höhe vom Karten-Bereich H): eingeklappt 80px (Griff + Zeile
  Bezeichnung links, Gesamtnote rechts, „×"), halb 50 % von H (min 280px),
  voll H − 56px (ein Streifen Karte bleibt).
- **Einrasten nach Loslassen** (vom Nutzer bestätigt 2026-11-25, eindeutig):
  Tempo **über 0,5px/ms** (strikt größer, Betrag der Höhenänderung) → nächster
  Zustand **in Wischrichtung** (nicht übernächster; am Ende der Skala bleibt
  es dort), auch wenn ein anderer näher läge (40px-Flick nach oben: ab
  „eingeklappt" → „halb", ab „halb" → „voll"). Bis 0,5px/ms: nächstgelegene
  Höhe. Unter dem Flick-Mindestweg wird das Tempo ignoriert (siehe
  [zieh-wisch-schwellen.md](zieh-wisch-schwellen.md)). Settle 240ms ease-out;
  reduzierte Bewegung: Sprung. Ziehen nur am Griff und an der Kopfzeile, nie
  im scrollenden Inhalt (`overscroll-behavior: contain`).
- **Ohne Geste**: Der Griff ist ein Button (44px hoch über die volle Breite,
  sichtbarer Balken 36×4px), `aria-label` „Größe der Schnellansicht ändern,
  aktuell {eingeklappt|halb|voll}"; Enter/Leertaste/Tipp = nächstgrößerer
  Zustand, aus „voll" zurück auf „halb"; Pfeil hoch/runter = einen Zustand
  größer/kleiner. „×" (44×44, `aria-label` „Schnellansicht schließen") und Esc
  schließen. Ein Tipp auf die leere Karte schließt **nicht**.
- **Inhalt** (nur lesend), Reihenfolge: Kopf (Bezeichnung `<h2>` 20px 600,
  Gesamtnote 16px 600 rechts, ohne Zonenfarbe) → Bildstreifen (nur mit
  Bildern) → Anfangsnotiz → Adresse (14px `--text-muted`) → Tags (neutrale
  Pillen) → vier Achsen (Name, Zahl + Intensitätsbalken oder „Noch nicht
  bewertet", Kommentar). „Halb": Anfangsnotiz und jeder Kommentar auf 2
  Zeilen geklemmt (Auslassungszeichen), Inhalt scrollt; „voll": alles
  vollständig, `overflow-wrap: anywhere`. Fußzeile (halb/voll, fest unten,
  56px): **„Bearbeiten" als Sekundär-Button** (Rahmen; die Primäraktion der
  Karten-Ansicht ist „Ort hinzufügen", max. eine pro Ansicht).
- **Bildstreifen**: horizontal scrollend, Kacheln 96×72px (4:3, Radius 12px,
  `object-fit: cover`), Gap 8px, `scroll-snap-type: x proximity`, Reihenfolge
  wie das Raster, Kachel = Button „Bild {n} von {m} vergrößern" (öffnet die
  [Bildvorschau](bildvorschau.md)). Kein Bild → Abschnitt entfällt ganz.
- **Öffnen/Wechsel**: Slide-up 240ms ease-out auf „halb" (reduzierte Bewegung:
  Fade 180ms). Wechsel auf einen anderen Marker: Inhalt springt, Zustand
  bleibt, Adresse per `replace` (kein zusätzlicher Verlaufseintrag). Liegt der
  Marker unter der Sheet-Oberkante, verschiebt die Karte minimal (`panBy`,
  240ms, 24px über der Oberkante, nie Zoom); eine Rückkehr per Zurück
  verschiebt nicht erneut. Fokus beim Öffnen und Wechsel auf die `<h2>`
  (`tabindex="-1"`), beim Schließen zurück auf den Marker.
- **Adresse/Verlauf**: Öffnen = `push` mit `ort=<id>`, Schließen entfernt ihn;
  Zurück schließt. Die Größe steht nicht in der Adresse. Direktaufruf/Neuladen
  mit gültiger Id öffnet auf „halb". **Unbekannte oder nicht sichtbare Id:
  Karte ohne Sheet, kein Hinweis**, der Parameter wird per `replace`
  entfernt (anders als „Adresse ohne Ziel", weil die Seite selbst gültig
  ist). Fällt der Ort durch eine Filteränderung aus der Karte, schließt das
  Sheet (Slide 240ms), der Fokus bleibt.
- **Überdeckung**: Marker, deren Mittelpunkt unter einem offenen Sheet liegt,
  werden `inert` (aus Tab-Folge und Zeigerereignissen), darüber wieder aktiv.
  Die Verdeckungsprüfung nimmt `inert`-Elemente als benannte Bedingung aus
  (ADR-0023 Punkt 7).
