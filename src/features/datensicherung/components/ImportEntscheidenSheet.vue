<script setup lang="ts">
/**
 * Entscheidung „Ersetzen" oder „Ergänzen" vor einem Import in einen nicht
 * leeren Bestand (design_notes PO-2026-09-07-009, ADR-0017 Punkt 6/7): zwei
 * GLEICHWERTIG gestaltete Optionen ohne Voreinstellung — kein Vorauswahl,
 * keine der beiden optisch als „empfohlen" hervorgehoben. „Ersetzen" trägt
 * die Warnfarbe (drohender, angekündigter Datenverlust, KEINE Fehlerfarbe:
 * design-concept.md, design-conventions.md „Zustände" → Warnung), „Ergänzen"
 * bleibt neutral im Primärton.
 *
 * Schließen ohne Auswahl (Escape/Backdrop, `Sheet.vue`) ändert nichts — dafür
 * reicht das eingebaute Verhalten von `Sheet.vue`, es gibt bewusst keinen
 * dritten „Abbrechen"-Button neben den zwei gleichwertigen Optionen. Während
 * ein Import läuft (`aktiverModus` gesetzt), wird das Schließen unterdrückt
 * (siehe `aufSchliessenVersuch`) — ein Import mitten im Schreibvorgang
 * abzubrechen wäre kein sauberer Zustand.
 *
 * Ladezustand erst ab spürbar > 400 ms (design-conventions.md „Zustände" →
 * „Lädt"): `gesperrt` sperrt beide Buttons SOFORT gegen Doppel-Tap,
 * `aktiverModus` schaltet den Button-Inhalt auf Spinner + Kurztext erst um,
 * wenn die Aufruferin (`Datenbereich.vue`) das nach 400 ms freigibt.
 */
import PrimaerButton from '../../../shared/ui/PrimaerButton.vue'
import Sheet from '../../../shared/ui/Sheet.vue'

defineProps<{
  offen: boolean
  /** Sperrt beide Buttons, sobald irgendein Import läuft — unabhängig davon,
   * ob der Spinner schon sichtbar ist. */
  gesperrt: boolean
  /** Nur gesetzt, wenn der 400ms-Schwellwert bereits überschritten ist —
   * sonst `null`, auch während `gesperrt` bereits `true` ist. */
  aktiverModus: 'ergaenzen' | 'ersetzen' | null
}>()

const emit = defineEmits<{
  ergaenzen: []
  ersetzen: []
  schliessen: []
}>()

function aufSchliessenVersuch(): void {
  emit('schliessen')
}
</script>

<template>
  <Sheet
    :offen="offen"
    label="Import: Ergänzen oder ersetzen"
    @schliessen="aufSchliessenVersuch"
  >
    <h2 class="import-entscheiden__titel">
      Bestand importieren
    </h2>
    <p class="import-entscheiden__intro">
      Es sind bereits Orte vorhanden. Wähle, wie der Import damit umgehen soll.
    </p>

    <div class="import-entscheiden__optionen">
      <div class="import-entscheiden__option">
        <PrimaerButton
          type="button"
          :disabled="gesperrt"
          @click="emit('ergaenzen')"
        >
          <span
            v-if="aktiverModus === 'ergaenzen'"
            class="import-entscheiden__spinner-inhalt"
          >
            <span
              class="import-entscheiden__spinner"
              aria-hidden="true"
            />
            Wird importiert…
          </span>
          <template v-else>
            Ergänzen
          </template>
        </PrimaerButton>
        <p class="import-entscheiden__hinweis">
          Bestehende Orte bleiben, importierte kommen dazu.
        </p>
      </div>

      <div class="import-entscheiden__option">
        <button
          type="button"
          class="import-entscheiden__ersetzen"
          :disabled="gesperrt"
          @click="emit('ersetzen')"
        >
          <span
            v-if="aktiverModus === 'ersetzen'"
            class="import-entscheiden__spinner-inhalt"
          >
            <span
              class="import-entscheiden__spinner"
              aria-hidden="true"
            />
            Wird importiert…
          </span>
          <template v-else>
            Ersetzen
          </template>
        </button>
        <p class="import-entscheiden__hinweis">
          Der bestehende Bestand geht dabei verloren.
        </p>
      </div>
    </div>
  </Sheet>
</template>

<style scoped>
.import-entscheiden__titel {
  margin-bottom: var(--space-8);
  font-size: var(--font-size-20);
}

.import-entscheiden__intro {
  margin-bottom: var(--space-24);
  color: var(--text-muted);
  font-size: var(--font-size-14);
}

.import-entscheiden__optionen {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.import-entscheiden__option {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.import-entscheiden__option :deep(.primaer-button) {
  width: 100%;
}

.import-entscheiden__ersetzen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  width: 100%;
  min-height: 44px;
  padding: var(--space-12) var(--space-16);
  border: none;
  border-radius: var(--radius-8);
  background-color: var(--color-warning);
  color: var(--text-on-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.import-entscheiden__ersetzen:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.import-entscheiden__hinweis {
  color: var(--text-muted);
  font-size: var(--font-size-14);
  text-align: center;
}

.import-entscheiden__spinner-inhalt {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
}

.import-entscheiden__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(255 255 255 / 40%);
  border-top-color: var(--text-on-primary);
  border-radius: var(--radius-full);
  animation: import-entscheiden-drehen 720ms linear infinite;
}

@keyframes import-entscheiden-drehen {
  to {
    transform: rotate(360deg);
  }
}
</style>
