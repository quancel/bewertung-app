<script setup lang="ts">
/**
 * Listenzeile (design_notes PO-2026-09-07-001): Bezeichnung als Primärzeile,
 * Adresse nur als Sekundärzeile, wenn vorhanden — sonst schlicht weggelassen
 * (kein Platzhalter, kein Badge, kein Warn-Icon). Präsentational, kennt
 * keinen Store.
 *
 * Gesamtnote (PO-2026-09-07-002, design_notes): fehlt sie ganz, bleibt die
 * Spalte leer (kein „0,0"-Ersatzwert); bei Teilbewertung ergänzt ein
 * gemuteter Zusatz „aus N von 4 Achsen", der bei 4 von 4 entfällt. Diese
 * Teilbewertungs-Kennzeichnung bleibt sichtbar, unabhängig vom aktuellen
 * Sortierkriterium (Kriterium der Detailansicht aus -002).
 *
 * Wertanzeige nach Sortierkriterium (design_notes PO-2026-09-07-003): Wird
 * nach einer Einzelachse sortiert, zeigt die Zeile den Intensitätsbalken +
 * Zahl GENAU dieser Achse statt der Gesamtnote — die Reihenfolge der Liste
 * bleibt so nachvollziehbar. `zeigeWert=false` (Gruppe „ohne Wert") blendet
 * den gesamten Wert-Slot aus, unabhängig vom Kriterium.
 *
 * Auswahl-Hervorhebung (PO-2026-09-07-012, design-conventions.md
 * „Master-Detail (ab lg)"): `ausgewaehlt` kommt von `Ortebereich.vue`, das
 * `route.params.ortId` gegen diesen Ort vergleicht — diese Komponente
 * bleibt store- und routenfrei und bekommt das Ergebnis nur als Prop.
 *
 * Sekundärzeile: Anfangsnotiz vor Adresse (PO-2026-09-27-002,
 * design-conventions.md „Ortszeile: Sekundärzeile (Adresse/Anfangsnotiz)"):
 * Hat der Ort eine Anfangsnotiz, zeigt die Zeile sie statt der Adresse — reine
 * Ableitung aus Props, kein Zwischenzustand, reagiert also ohne Neuladen auf
 * eine Änderung ab `lg`. Ohne beides entfällt die Zeile ganz (unverändert).
 *
 * Zonenfarbe + Hervorhebungs-Schatten (PO-2026-09-27-003, ADR-0034,
 * design-concept.md „Ausnahme Ortsliste"): reine Anzeigeregel, die Logik
 * lebt in `features/orte/lib/zonen.ts` — diese Komponente bindet nur noch
 * an. Die Zone hängt am UNGERUNDETEN Wert, den der Wert-Slot GERADE zeigt
 * (Achsenwert oder Gesamtnote, je nachdem welcher Zweig rendert), nie am
 * formatierten String (ADR-0007 Punkt 6). Der Hervorhebungs-Schatten liest
 * dagegen unabhängig davon direkt Geschmack/Preis-Leistung aus
 * `ort.bewertungen` und gilt deshalb auch in der Gruppe „ohne Wert"
 * (`zeigeWert=false`).
 */
import { computed } from 'vue'
import type { OrtDatensatz } from '../../../persistence/schema'
import { berechneGesamtnote, formatiereGesamtnote, zaehleAusgefuellteAchsen } from '../../../shared/lib/gesamtnote'
import Intensitaetsbalken from '../../../shared/ui/Intensitaetsbalken.vue'
import { bestimmeHervorhebung, bestimmeZone } from '../lib/zonen'
import { ACHSEN_KRITERIEN, type AchsenKriterium, type SortierKriterium } from '../model/ansicht'

const props = withDefaults(
  defineProps<{
    ort: OrtDatensatz
    ausgewaehlt?: boolean
    /** Aktuelles Sortierkriterium der Liste (ADR-0009) — steuert, ob die
     * Gesamtnote oder eine einzelne Achse gezeigt wird. */
    sortierKriterium?: SortierKriterium
    /** `false` in der Gruppe „ohne Wert": kein Wert-Slot, auch keine
     * Gesamtnote (design_notes PO-2026-09-07-003). */
    zeigeWert?: boolean
  }>(),
  { ausgewaehlt: false, sortierKriterium: 'bezeichnung', zeigeWert: true },
)

function istAchsenKriterium(kriterium: SortierKriterium): kriterium is AchsenKriterium {
  return (ACHSEN_KRITERIEN as readonly string[]).includes(kriterium)
}

// Reine Ableitung aus shared/lib/ (ADR-0008 Punkt 6) — kein Import aus
// features/bewertungen/.
const gesamtnote = computed(() => berechneGesamtnote(props.ort.bewertungen))
const ausgefuellteAchsen = computed(() => zaehleAusgefuellteAchsen(props.ort.bewertungen))

// Nur bei einer Einzelachse als Kriterium gesetzt; in der Gruppe „mit Wert"
// (siehe `sortiereOrte`) ist der Wert dann garantiert nicht `null`.
const achsenWert = computed(() =>
  istAchsenKriterium(props.sortierKriterium) ? props.ort.bewertungen[props.sortierKriterium].wert : null,
)

// Priorität per Wahrheitswert (design-conventions.md „Ortszeile:
// Sekundärzeile (Adresse/Anfangsnotiz)"): Anfangsnotiz VOR Adresse, ohne
// beides bleibt die Sekundärzeile ganz weg (s. Template unten).
const sekundaerzeile = computed(() => props.ort.anfangsnotiz || props.ort.adresse)

/** Der UNGERUNDETE Wert, den der Wert-Slot GERADE zeigt (ADR-0034 Punkt 3):
 * Achsenwert, wenn dieser Zweig rendert, sonst die Gesamtnote, wenn jener
 * rendert — `null`, wenn keiner der beiden einen Wert zeigt (Gruppe „ohne
 * Wert" oder fehlende Bewertung). Spiegelt exakt die v-if/v-else-if-Bedingung
 * im Template. */
const wertFuerZone = computed(() => {
  if (props.zeigeWert && achsenWert.value !== null) return achsenWert.value
  if (props.zeigeWert && gesamtnote.value !== null) return gesamtnote.value
  return null
})

const zone = computed(() => bestimmeZone(wertFuerZone.value))

/** Lokale Custom Property als Inline-Style auf dem Wert-Slot (ADR-0034
 * Punkt 2): Tokenname kommt unverändert aus `ZONEN`, nie aus dem Schlüssel
 * zusammengebaut. `undefined` ohne Zone — der Slot bekommt dann auch nicht
 * die `--zone`-Modifier-Klasse (Template), Rahmen/Zahlenfarbe bleiben aus. */
const zonenStil = computed(() =>
  zone.value ? { '--ortszeile-zonenfarbe': `var(${zone.value.tokenName})` } : undefined,
)

// Hervorhebung (ADR-0034 Punkt 5): unabhängig von Zone/Sortierung/Gruppe,
// liest `ort.bewertungen` direkt — gilt deshalb auch in der Gruppe „ohne
// Wert" (zeigeWert=false).
const hervorhebungsErgebnis = computed(() => bestimmeHervorhebung(props.ort.bewertungen))
</script>

<template>
  <RouterLink
    :to="`/orte/${ort.id}`"
    class="ortszeile"
    :class="{
      'ortszeile--ausgewaehlt': ausgewaehlt,
      'ortszeile--hervorhebung-schwach': hervorhebungsErgebnis.hervorhebung === 'schwach',
      'ortszeile--hervorhebung-stark': hervorhebungsErgebnis.hervorhebung === 'stark',
      'ortszeile--hervorhebung-beide': hervorhebungsErgebnis.hervorhebung === 'beide',
    }"
    :aria-current="ausgewaehlt ? 'true' : undefined"
  >
    <span class="ortszeile__hauptzeile">
      <span class="ortszeile__bezeichnung">{{ ort.bezeichnung }}</span>
      <span
        v-if="zeigeWert && achsenWert !== null"
        class="ortszeile__achsenwert"
        :class="{ 'ortszeile__achsenwert--zone': zone }"
        :style="zonenStil"
      >
        <Intensitaetsbalken :wert="achsenWert" />
      </span>
      <span
        v-else-if="zeigeWert && gesamtnote !== null"
        class="ortszeile__gesamtnote"
        :class="{ 'ortszeile__gesamtnote--zone': zone }"
        :style="zonenStil"
      >
        <span class="ortszeile__gesamtnote-wert">{{ formatiereGesamtnote(gesamtnote) }}</span>
        <span
          v-if="ausgefuellteAchsen < 4"
          class="ortszeile__gesamtnote-zusatz"
        >aus {{ ausgefuellteAchsen }} von 4 Achsen</span>
      </span>
    </span>
    <span
      v-if="sekundaerzeile"
      class="ortszeile__adresse"
    >{{ sekundaerzeile }}</span>
    <!-- Screenreader-Text der Hervorhebung (ADR-0034 Punkt 5, letztes Kind im
         RouterLink): führende Leerzeichen EXPLIZIT im interpolierten String,
         nicht über Template-Whitespace — verschmilzt sonst je nach
         Compiler-Whitespace-Behandlung mit dem vorangehenden Text zu einem
         Wort. -->
    <span
      v-if="hervorhebungsErgebnis.screenreaderText"
      class="ortszeile__sr-hervorhebung"
    >{{ ' ' + hervorhebungsErgebnis.screenreaderText }}</span>
  </RouterLink>
</template>

<style scoped>
.ortszeile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-16);
  border-radius: var(--radius-12);
  text-decoration: none;
  color: inherit;
  /* Auswahlkante und Hervorhebungs-Schatten als getrennte Layer, EINE
     box-shadow-Deklaration (ADR-0034, design-conventions.md „Kombination mit
     der Auswahlkante"): `.ortszeile--ausgewaehlt` und die drei
     Hervorhebungs-Modifier setzen jeweils nur ihre eigene Custom Property,
     nie ein eigenes `box-shadow` — sonst würde eine Regel die andere
     ersetzen statt zu ergänzen (CSS kennt pro Element nur einen wirksamen
     `box-shadow`-Wert). Neutraler Fallback, wenn keins von beidem aktiv ist. */
  --ortszeile-schatten-auswahl: 0 0 0 0 transparent;
  --ortszeile-schatten-hervorhebung: 0 0 0 0 transparent;
  box-shadow: var(--ortszeile-schatten-auswahl), var(--ortszeile-schatten-hervorhebung);
}

.ortszeile:hover {
  background-color: var(--surface-muted);
}

/* Auswahl-Hervorhebung ab lg (design-conventions.md „Master-Detail"): linke
   3px-Kante + Fläche --color-primary-50. Bleibt bestehen, auch wenn die
   Zeile durch eine künftige Filteränderung aus der Liste fällt — sie ist
   dann schlicht nicht mehr im DOM, keine Sonderbehandlung hier nötig. Setzt
   NUR die Auswahl-Property (s. o.) — bleibt dadurch in jeder Kombination aus
   Zone und/oder Hervorhebungs-Schatten sichtbar (ADR-0034). */
.ortszeile--ausgewaehlt {
  background-color: var(--color-primary-50);
  --ortszeile-schatten-auswahl: inset 3px 0 0 var(--color-primary-600);
}

.ortszeile--ausgewaehlt:hover {
  background-color: var(--color-primary-50);
}

/* Hervorhebungs-Schatten (ADR-0034 Punkt 5, design-conventions.md „Ortsliste:
   Zonenfarben und Hervorhebungs-Schatten"): unabhängig von Zone,
   Sortierkriterium und Gruppe — gilt auch in der Gruppe „ohne Wert".
   `bestimmeHervorhebung` liefert genau einen von vier Werten, deshalb ist
   stets höchstens eine der drei Klassen aktiv. */
.ortszeile--hervorhebung-schwach {
  --ortszeile-schatten-hervorhebung: var(--shadow-hervorhebung-schwach);
}

.ortszeile--hervorhebung-stark {
  --ortszeile-schatten-hervorhebung: var(--shadow-hervorhebung-stark);
}

.ortszeile--hervorhebung-beide {
  --ortszeile-schatten-hervorhebung: var(--shadow-hervorhebung-schwach), var(--shadow-hervorhebung-stark);
}

.ortszeile__hauptzeile {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-8);
}

.ortszeile__bezeichnung {
  /* ADR-0034 Constraint LAYOUT: statt den Wert-Slot bei einer langen
     Bezeichnung zu verkleinern, darf dieses Element unter seine
     Inhaltsbreite schrumpfen (Flex-Item-Default `min-width: auto` verhindert
     das sonst). */
  min-width: 0;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--text);
}

.ortszeile__achsenwert {
  flex-shrink: 0;
}

/* Zonenfarbe (ADR-0034): Rahmen + Zahlenfarbe nur, wenn der Wert-Slot eine
   Zone hat (Modifier-Klasse `--zone`, s. Skript) — Werte < 8, die Gruppe
   „ohne Wert" und fehlende Bewertungen bekommen WEDER Rahmen NOCH
   Zahlenfarbe (design-conventions.md). Die Farbe selbst kommt aus der
   lokalen Custom Property `--ortszeile-zonenfarbe`, die die Komponente
   inline auf genau diesem Slot setzt. */
.ortszeile__achsenwert--zone,
.ortszeile__gesamtnote--zone {
  border-left: 2px solid var(--ortszeile-zonenfarbe);
  padding-left: var(--space-8);
}

/* Nur der Achsenwert reicht die Zonenfarbe an den Intensitätsbalken weiter
   (dessen eigener CSS-Hook, Intensitaetsbalken.vue) — die Balkenfüllung
   selbst bleibt unverändert (design-conventions.md, bewusste Vereinfachung,
   kein zweites Farbsystem am selben Balken). */
.ortszeile__achsenwert--zone {
  --intensitaetsbalken-zahl-farbe: var(--ortszeile-zonenfarbe);
}

.ortszeile__gesamtnote {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  flex-shrink: 0;
}

.ortszeile__gesamtnote-wert {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary-700);
}

/* Bei einer Zone übernimmt NUR die Zahl die Zonenfarbe — der Zusatz „aus N
   von 4 Achsen" bleibt --text-muted (design-conventions.md). */
.ortszeile__gesamtnote--zone .ortszeile__gesamtnote-wert {
  color: var(--ortszeile-zonenfarbe);
}

.ortszeile__gesamtnote-zusatz {
  font-size: var(--font-size-14);
  color: var(--text-muted);
}

/* Screenreader-Text der Hervorhebung (ADR-0034 Punkt 5): gleiches
   clip-Muster wie `.ortebereich__sr-titel`. */
.ortszeile__sr-hervorhebung {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Wrap statt Kürzen, jetzt bindend (design-conventions.md „Ortszeile:
   Sekundärzeile (Adresse/Anfangsnotiz)"): kein `line-clamp`, kein
   `text-overflow`, kein `white-space: nowrap`/`pre-line` — reiner Fließtext,
   der über so viele Zeilen wächst, wie der Inhalt braucht.
   `overflow-wrap: anywhere` bricht auch ein einzelnes, zusammenhängendes
   100-Zeichen-„Wort" innerhalb der Zeile um, statt „nichts ragt aus dem
   Bildschirm" zu verletzen. */
.ortszeile__adresse {
  font-size: var(--font-size-14);
  color: var(--text-muted);
  overflow-wrap: anywhere;
}
</style>
