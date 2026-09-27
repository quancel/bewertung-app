/**
 * Lässt ein `<textarea>` mit seinem Inhalt mitwachsen, statt intern zu
 * scrollen (design-conventions.md „Mehrzeilige Textfelder wachsen mit dem
 * Inhalt", ADR-0024, PO-2026-09-27-001). Genau einmal implementiert, erster
 * Nutzer ist `Bewertungsachse.vue` — die Anfangsnotiz aus PO-2026-09-27-002
 * bindet als zweiter Nutzer an. Bewusst generisch: kennt weder Achsen noch
 * Bewertungen, nur ein Feld-Ref und einen beobachteten Wert. Bauform wie
 * `useNetzzustand.ts`/`useSchliesseBeiAussenaktion.ts`: zustandslos je
 * Aufrufer, alle Listener/Observer werden beim Unmount entfernt.
 *
 * Nur JavaScript, kein `field-sizing: content` (Chromium-exklusiv) und keine
 * neue Laufzeitabhängigkeit (Architekt-Vorgabe). Nur APIs aus dem Bestand von
 * Safari 15: `scrollHeight`, `ResizeObserver`, `document.fonts`.
 *
 * Fünf Auslöser, weil weder der Wert allein noch das `input`-Ereignis allein
 * genügen:
 * (a) Mount — sobald `feldRef` ein Element trägt (Öffnen über „Kommentar
 *     hinzufügen" oder ein bereits vorhandener Kommentar beim ersten Anzeigen
 *     der Komponente).
 * (b) externe Wertänderung — `wertRef` ändert sich, ohne dass im selben
 *     Feld getippt wurde (Ortswechsel A→B, `Bewertungsachse.vue` wird dabei
 *     heute NICHT neu gemountet).
 * (c) natives `input`-Ereignis zusätzlich zu (b): `v-model` aktualisiert den
 *     gebundenen Wert während einer IME-Komposition erst bei `compositionend`
 *     — das native Ereignis liefert den tatsächlichen, aktuellen Feldinhalt,
 *     unabhängig davon, ob `wertRef` schon nachgezogen hat.
 * (d) Breitenänderung — ein `ResizeObserver` auf dem Feld selbst, aber nur
 *     wenn sich die tatsächliche Breite (`contentRect.width`) geändert hat.
 *     Ohne diese Wächter würde jede von dieser Funktion selbst gesetzte
 *     Höhenänderung eine neue Beobachtung auslösen (Endlosschleife) — die
 *     Höhe zählt hier bewusst nicht als Auslöser.
 * (e) einmal nach `document.fonts.ready` — Inter lädt mit `font-display:
 *     swap`, ein Schriftartwechsel kann den Zeilenumbruch ändern, ohne dass
 *     sich Wert oder Breite ändern.
 *
 * Ohne Layout-Box (`clientWidth === 0`, z. B. eine Detail-Spalte, die
 * unterhalb `lg` per `display: none` liegt) wird nicht gemessen — der
 * `ResizeObserver` meldet das Sichtbarwerden später als Breitenänderung
 * (0 → tatsächliche Breite) und holt die Messung dann nach.
 *
 * Mindesthöhe kommt ausschließlich aus `rows="2"` am Element selbst (keine
 * zusätzliche Pixel-Konstante hier). Rahmenbreiten werden aus dem
 * berechneten Stil gelesen, nicht fest codiert (global `box-sizing:
 * border-box`, `base.css`).
 *
 * Scroll-Sicherheit: Ein kurzzeitiges `height: auto` zur Messung würde das
 * Feld auf seine intrinsische (Rows-)Höhe zurückfallen lassen — schrumpft in
 * diesem Moment der umgebende Wrapper mit, kann ein scrollender Vorfahr
 * (die Detail-Spalte in `MasterDetail.vue`, ADR-0033) seinen `scrollTop` auf
 * die kleinere Gesamthöhe klemmen, und dieser Versatz kehrt danach nicht von
 * selbst zurück. Deshalb wird — wenn ein `wrapperRef` übergeben ist — dessen
 * aktuelle Höhe für die Dauer der Messung explizit fixiert: Der Vorfahr sieht
 * während der synchronen Messung keine Größenänderung, nur das `<textarea>`
 * selbst springt intern kurz auf seine Rows-Höhe und sofort wieder auf die
 * neue Zielhöhe. Kein Suchen eines „nächsten scrollbaren Vorfahren" über
 * `closest`/eine `parentElement`-Kette und kein Zugriff auf das DOM von
 * `MasterDetail.vue` (ADR-0033) — der Wrapper ist ausschließlich der vom
 * Aufrufer übergebene.
 */
import { onBeforeUnmount, watch, type Ref } from 'vue'

export function useMitwachsendesTextfeld(
  feldRef: Ref<HTMLTextAreaElement | null>,
  wertRef: Ref<string>,
  wrapperRef?: Ref<HTMLElement | null>,
): void {
  let beobachter: ResizeObserver | null = null
  let gebundenesFeld: HTMLTextAreaElement | null = null
  let letzteBreite = 0

  function berechneHoehe(feld: HTMLTextAreaElement): void {
    // Keine Layout-Box (z. B. unterhalb `lg` per `display: none` verborgen)
    // — nicht messen, der ResizeObserver holt es beim Sichtbarwerden nach.
    if (feld.clientWidth === 0) return

    const wrapper = wrapperRef?.value ?? null
    const fixierteWrapperHoehe = wrapper ? wrapper.offsetHeight : null
    if (wrapper && fixierteWrapperHoehe !== null) {
      wrapper.style.height = `${fixierteWrapperHoehe}px`
    }

    feld.style.height = 'auto'
    const stil = getComputedStyle(feld)
    const rahmen = parseFloat(stil.borderTopWidth) + parseFloat(stil.borderBottomWidth)
    feld.style.height = `${feld.scrollHeight + rahmen}px`

    if (wrapper) wrapper.style.height = ''
  }

  function aufInput(event: Event): void {
    berechneHoehe(event.target as HTMLTextAreaElement)
  }

  function binden(feld: HTMLTextAreaElement): void {
    feld.addEventListener('input', aufInput)

    beobachter = new ResizeObserver((eintraege) => {
      const breite = eintraege[0]?.contentRect.width ?? feld.clientWidth
      // Nur bei tatsächlicher Breitenänderung neu berechnen — sonst löst die
      // von `berechneHoehe` selbst gesetzte Höhe eine Endlosschleife aus.
      if (breite === letzteBreite) return
      letzteBreite = breite
      berechneHoehe(feld)
    })
    beobachter.observe(feld)

    gebundenesFeld = feld
    letzteBreite = feld.clientWidth
    berechneHoehe(feld)
  }

  function loesen(): void {
    gebundenesFeld?.removeEventListener('input', aufInput)
    beobachter?.disconnect()
    beobachter = null
    gebundenesFeld = null
  }

  // `flush: 'post'`: läuft erst NACH dem DOM-Update, `feldRef.value` ist an
  // dieser Stelle bereits das tatsächlich gemountete (oder beim Entfernen:
  // bereits `null` gesetzte) Element — nicht der Zwischenstand während des
  // Patches. `immediate: true` deckt Auslöser (a) ab.
  watch(
    feldRef,
    (feld) => {
      loesen()
      if (feld) binden(feld)
    },
    { immediate: true, flush: 'post' },
  )

  // Auslöser (b): externe Wertänderung, z. B. Ortswechsel ohne Neumount.
  // `flush: 'post'` aus demselben Grund wie oben: `v-model` selbst schreibt
  // den neuen Wert erst im Render-Effekt des Aufrufers ins DOM
  // (`feld.value`) — ein `pre`-Watcher (Vue-Standard) liefe VOR diesem
  // Render und würde `scrollHeight` noch gegen den alten Feldinhalt messen
  // (beobachtet: Höhe blieb nach einem Ortswechsel A→B→A auf dem
  // Zwischenstand von B stehen, obwohl `wertRef` bereits A trug).
  watch(
    wertRef,
    () => {
      if (feldRef.value) berechneHoehe(feldRef.value)
    },
    { flush: 'post' },
  )

  // Auslöser (e): einmalig, nachdem alle Schriftarten geladen sind. Auf
  // `document.fonts` verzichten Umgebungen ohne diese API (z. B. jsdom in
  // Component-Tests) — die optionale Verkettung überspringt den Aufruf dann
  // vollständig, statt eine Ausnahme zu werfen.
  document.fonts?.ready.then(() => {
    if (feldRef.value) berechneHoehe(feldRef.value)
  })

  onBeforeUnmount(loesen)
}
