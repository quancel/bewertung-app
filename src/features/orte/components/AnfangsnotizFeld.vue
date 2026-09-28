<script setup lang="ts">
/**
 * Anfangsnotiz-Feld (PO-2026-09-27-002, design-conventions.md „Kurztextfeld
 * mit Zeichenobergrenze"). Präsentational, kennt keinen Store
 * (code-conventions.md „components/ kennt keinen Store").
 *
 * KEIN lokaler Entwurf, deshalb KEINE exponierte Methode (Architekt-Vorgabe,
 * anders als `TagEingabe`/`Bewertungsachse`-Kommentar): Jede Eingabe geht
 * SOFORT über das `eingabe`-Emit zum Store-Setter
 * (`useOrteStore.aktualisiereAnfangsnotiz`), dasselbe Muster wie Bezeichnung
 * und Adresse in `Ortebereich.vue`
 * (`aufBezeichnungEingabe`/`aufAdresseEingabe` + `@blur="persistiereJetzt"`).
 * ADR-0030 Punkt 8 gilt nur für Komponenten, die einen Entwurf lokal halten —
 * hier gibt es keinen, deshalb kein `defineExpose`, kein
 * `document`/`window`-Listener.
 *
 * Auto-Grow ausschließlich über das geteilte
 * `shared/composables/useMitwachsendesTextfeld.ts` (PO-2026-09-27-001,
 * zweiter Nutzer, NICHT verändert) — generische Schnittstelle (Feld-Ref +
 * beobachteter Wert), kennt diese Komponente nicht.
 *
 * Enter bleibt wirkungslos (design-conventions.md): `keydown` auf Enter mit
 * `preventDefault`, ZUSÄTZLICH `beforeinput` mit `inputType`
 * `insertLineBreak`/`insertParagraph` — virtuelle Tastaturen liefern beim
 * Bestätigen oft nur `keyCode 229` ohne auswertbaren `key`. Die
 * Zeilenumbruch-Normalisierung in `normalisiereAnfangsnotiz` bleibt zusätzlich
 * als Fallback bestehen (z. B. bei einem eingefügten mehrzeiligen Text), ist
 * aber nicht das primäre Mittel gegen Enter selbst.
 *
 * DOM-Nachziehen nach der Normalisierung: Ändert `normalisiereAnfangsnotiz`
 * den getippten/eingefügten Text (Kürzung auf 100 Zeichen, Zeilenumbruch zu
 * Leerzeichen), schreibt `aufInput` den normalisierten Wert direkt auf
 * `el.value` zurück — NUR wenn er sich unterscheidet (sonst würde jeder
 * gewöhnliche Tastendruck die Caret-Position resetten) und NIE während einer
 * laufenden IME-Komposition (`event.isComposing`).
 *
 * Kein lokaler Wertzustand außer Fokus/Zählersichtbarkeit (Architekt-Vorgabe):
 * `fokussiert` und `zaehlerWert` sind reine Anzeigezustände dieser
 * Komponente, kein Entwurf — der eigentliche Wert bleibt bei jedem Tastendruck
 * ausschließlich im Store (über das Emit), nicht hier.
 */
import { computed, ref } from 'vue'
import { useMitwachsendesTextfeld } from '../../../shared/composables/useMitwachsendesTextfeld'
import { ANFANGSNOTIZ_MAX_ZEICHEN, normalisiereAnfangsnotiz } from '../lib/anfangsnotiz'

const props = defineProps<{
  /** Aktueller, bereits normalisierter Wert aus dem Store — `null` = leer. */
  wert: string | null
}>()

const emit = defineEmits<{
  /** Bei JEDEM `input`-Ereignis, mit dem aktuellen (ggf. DOM-korrigierten)
   * Feldtext — die View reicht ihn ungeprüft an den Store-Setter weiter, der
   * selbst normalisiert (Gate sitzt dort, nicht hier). */
  eingabe: [text: string]
  /** Feld verlassen (`blur`) — die View ruft daraufhin `persistiereJetzt` auf,
   * dasselbe Muster wie Bezeichnung/Adresse. */
  verlassen: []
}>()

const feldRef = ref<HTMLTextAreaElement | null>(null)
const wertRef = computed(() => props.wert ?? '')
useMitwachsendesTextfeld(feldRef, wertRef)

const fokussiert = ref(false)
// Länge des NORMALISIERTEN Feldtexts (design-conventions.md „Zeichenzähler
// nur bei Fokus"), synchron aus dem `input`-Ereignis nachgeführt — nicht aus
// `props.wert` abgeleitet, weil dessen Rückweg über Emit → Store → Prop
// mindestens einen Render-Tick hinter der tatsächlichen Eingabe liegen kann.
const zaehlerWert = ref(0)

function aktualisiereZaehler(feld: HTMLTextAreaElement): void {
  zaehlerWert.value = (normalisiereAnfangsnotiz(feld.value) ?? '').length
}

function aufInput(event: Event): void {
  const feld = event.target as HTMLTextAreaElement
  const roh = feld.value
  const normalisiert = normalisiereAnfangsnotiz(roh) ?? ''
  const komponiertGerade = (event as InputEvent).isComposing === true

  // Nur nachziehen, wenn sich der Text dadurch ändert, und nie während einer
  // laufenden IME-Komposition (s. Skript-Kommentar oben) — Caret-Position
  // bleibt bei jedem gewöhnlichen Tastendruck unangetastet.
  if (!komponiertGerade && normalisiert !== roh) {
    const caretVorher = feld.selectionStart ?? normalisiert.length
    feld.value = normalisiert
    const caretNachher = Math.min(caretVorher, normalisiert.length)
    feld.setSelectionRange(caretNachher, caretNachher)
  }

  aktualisiereZaehler(feld)
  emit('eingabe', feld.value)
}

function aufFokus(): void {
  fokussiert.value = true
  if (feldRef.value) aktualisiereZaehler(feldRef.value)
}

function aufBlur(): void {
  fokussiert.value = false
  emit('verlassen')
}

function aufKeydownEnter(event: KeyboardEvent): void {
  event.preventDefault()
}

// Fallback für virtuelle Tastaturen (Skript-Kommentar oben): `keydown`
// liefert dort oft nur `keyCode 229`, `beforeinput` meldet stattdessen einen
// eindeutigen `inputType`.
function aufBeforeinput(event: Event): void {
  const inputType = (event as InputEvent).inputType
  if (inputType === 'insertLineBreak' || inputType === 'insertParagraph') {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="anfangsnotiz-feld">
    <textarea
      id="ortsdetail-anfangsnotiz"
      ref="feldRef"
      class="anfangsnotiz-feld__eingabe"
      :class="{ 'anfangsnotiz-feld__eingabe--leer': !wert }"
      rows="2"
      :maxlength="ANFANGSNOTIZ_MAX_ZEICHEN"
      placeholder="noch nichts eingetragen"
      :value="wert ?? ''"
      @input="aufInput"
      @focus="aufFokus"
      @blur="aufBlur"
      @keydown.enter="aufKeydownEnter"
      @beforeinput="aufBeforeinput"
    />
    <span
      v-if="fokussiert"
      class="anfangsnotiz-feld__zaehler"
    >{{ zaehlerWert }}/{{ ANFANGSNOTIZ_MAX_ZEICHEN }}</span>
  </div>
</template>

<style scoped>
/* Gleiche Feld-Chrome wie Bezeichnung/Adresse (design_notes,
   `.ortsdetail__eingabe` in `Ortebereich.vue`) — Scoped-CSS reicht über keine
   Komponentengrenze, deshalb hier dieselben Token-Werte dupliziert statt der
   fremden Klasse referenziert. Auto-Grow ausschließlich über
   `useMitwachsendesTextfeld.ts` (JS), kein `field-sizing: content`
   (code-conventions.md „Mehrzeilige Textfelder wachsen mit dem Inhalt"). */
.anfangsnotiz-feld {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anfangsnotiz-feld__eingabe {
  width: 100%;
  min-height: 44px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border);
  border-radius: var(--radius-8);
  background-color: var(--surface);
  color: var(--text);
  font-size: var(--font-size-16);
  overflow-y: hidden;
  overflow-wrap: break-word;
  resize: none;
}

.anfangsnotiz-feld__eingabe::placeholder {
  color: var(--text-muted);
}

.anfangsnotiz-feld__eingabe--leer {
  background-color: var(--surface-muted);
  color: var(--text-muted);
}

/* Zeichenzähler nur bei Fokus (design-conventions.md „Kurztextfeld mit
   Zeichenobergrenze"): normaler Fluss direkt unter dem Feld, keine
   Farbeskalation, nie absolut positioniert über dem Folgeelement (Ortssuche)
   — sonst schlägt die Verdeckungsprüfung des Rauchtests an. */
.anfangsnotiz-feld__zaehler {
  color: var(--text-muted);
  font-size: var(--font-size-14);
}
</style>
