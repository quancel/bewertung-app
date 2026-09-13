/**
 * Projektweite Interaktionsregel für eine aktiv bediente Auswahlliste
 * (Trefferliste der Ortssuche, Tag-Vorschlagsliste): schließt zusätzlich zu
 * Escape bei **Blur** (Fokus verlässt die Liste, z. B. per Tab) und bei
 * **Tap/Klick außerhalb** (design-conventions.md „Vorschlagsliste
 * (Autocomplete)", Ergänzung PO-2026-09-12-003; ADR-0024).
 *
 * Genau einmal implementiert, angebunden von
 * `features/orte/components/Ortssuche.vue` **und**
 * `features/tags/components/TagEingabe.vue` (ADR-0024 Punkt 1). `shared/`
 * ist kein Bounded Context — es entsteht kein Feature-zu-Feature-Import
 * (ADR-0013/0022 bleiben unberührt).
 *
 * Zustandslos je Aufrufer, gleiche Bauform wie `useNetzzustand.ts`
 * (ADR-0021 Punkt 5): kein Store, keine Singleton-Instanz. Der Listener
 * hängt NUR, solange `istOffen` wahr ist, und wird beim Aushängen der
 * aufrufenden Komponente in jedem Fall entfernt (ADR-0024 Punkt 6).
 *
 * Zwei Mechanismen, weil sie unterschiedliche Auslöser abdecken:
 * - **`pointerdown`** auf `document`, nicht `click` — ein Klick-Event
 *   kommt auf Touchgeräten zu spät (ADR-0024 Punkt 6). Ziel außerhalb von
 *   `containerRef` schließt.
 * - **`focusout`** (bubbelt, anders als `blur`) auf `containerRef` selbst —
 *   deckt das Verlassen per Tastatur (Tab) ab. `event.relatedTarget` wird
 *   gegen den Container geprüft, damit ein Tab **innerhalb** der Liste
 *   (z. B. auf einen Vorschlags-Button) sie nicht fälschlich schließt.
 *
 * Das bestehende `@mousedown.prevent` an den Vorschlags-Buttons bleibt in
 * den Komponenten bestehen — ohne es schließt die Liste, bevor die Auswahl
 * ankommt (ADR-0024 Punkt 6).
 */
import { onBeforeUnmount, watch, type Ref } from 'vue'

export function useSchliesseBeiAussenaktion(
  istOffen: Ref<boolean>,
  containerRef: Ref<HTMLElement | null>,
  schliessen: () => void,
): void {
  function istInnerhalbContainer(ziel: EventTarget | null): boolean {
    return ziel instanceof Node && (containerRef.value?.contains(ziel) ?? false)
  }

  function aufPointerDown(event: PointerEvent): void {
    if (!istInnerhalbContainer(event.target)) schliessen()
  }

  function aufFocusOut(event: FocusEvent): void {
    if (!istInnerhalbContainer(event.relatedTarget)) schliessen()
  }

  function aktivieren(): void {
    document.addEventListener('pointerdown', aufPointerDown)
    containerRef.value?.addEventListener('focusout', aufFocusOut)
  }

  function deaktivieren(): void {
    document.removeEventListener('pointerdown', aufPointerDown)
    containerRef.value?.removeEventListener('focusout', aufFocusOut)
  }

  watch(istOffen, (offen) => {
    if (offen) aktivieren()
    else deaktivieren()
  })

  onBeforeUnmount(deaktivieren)
}
