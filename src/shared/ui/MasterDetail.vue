<script setup lang="ts">
/**
 * MasterDetail — zustandsloser Layout-Baustein für die Zweispaltigkeit ab
 * `lg` (ADR-0011, PO-2026-09-07-012). Kennt weder Orte noch Karte, hält
 * keinen eigenen Zustand und bindet keinen Store an: zwei Slots (`liste`,
 * `detail`) plus das Flag `detailOffen`, das steuert, welcher Slot
 * unterhalb `lg` sichtbar ist. Die Bereichsansicht (`Ortebereich.vue`,
 * künftig `Kartenbereich.vue`) entscheidet, was in die Slots kommt und
 * leitet `detailOffen` ausschließlich aus `route.params` ab (ADR-0011
 * Punkt 4) — dieser Baustein selbst kennt keine Route.
 *
 * Beide Slot-Inhalte bleiben in JEDER Breite im DOM gemountet (nur per CSS
 * `display` ausgeblendet, kein `v-if`): ein Wechsel der Fensterbreite bei
 * offenem Detail bleibt dadurch ein reiner CSS-Layoutwechsel (ADR-0011
 * Punkt 5, ADR-0012) — kein Aus-/Einhängen, kein Refetch, kein Sprung der
 * Listen-Scrollposition.
 *
 * Ab `lg` (1024px, siehe --breakpoint-lg — Custom Properties werten in
 * @media nicht aus) sind beide Spalten gleichzeitig sichtbar, unabhängig
 * vom Flag `detailOffen`, und scrollen unabhängig voneinander (ADR-0011
 * Punkt 6): die Wurzel bekommt eine feste Höhe von einer vollen
 * Viewporthöhe (dieser Block sitzt ohne Chrome oberhalb von ihm exakt am
 * oberen Fensterrand — Nav-Rail und Bottom-Tabs sind `position: fixed` und
 * nehmen daher keinen Platz im Fluss ein), die Spalten scrollen intern.
 * Unterhalb `lg` scrollt weiterhin das Fenster wie gehabt.
 *
 * Nachtrag ADR-0011 P6 (2026-09-28, Rückläufer PO-2026-09-27-003): Ab `lg`
 * ist jede Spalte ein ABGESCHLOSSENER Scroll-Bereich — weder ihr eigener
 * Inhalt noch ein darin absolut positioniertes Element darf die Spalte oder
 * das Dokument verlängern. Drei Deklarationen im `@media (min-width:
 * 1024px)`-Block darunter setzen das um: (1) Wurzel `grid-template-rows:
 * minmax(0, 1fr)` — Gegenstück zur Spaltenspur `minmax(0, 1fr)`, macht die
 * Zeile exakt die feste Höhe statt implizit `auto`; (2) Spalten `min-height:
 * 0` — Gegenstück zu `min-width: 0` (ADR-0012 Punkt 4); (3) Spalten
 * `position: relative` — macht den Scroll-Container zum Containing Block
 * seiner absolut positionierten Nachfahren (kein `z-index`, kein neuer
 * Stapelkontext). Befund, der zur Korrektur führte: `.ortszeile__sr-
 * hervorhebung` (ADR-0034 Punkt 5) ist `position: absolute` ohne
 * positionierten Vorfahren; ohne (3) ist ihr Containing Block der initiale
 * Containing Block (Dokument) statt der Listen-Spalte, ihre statische
 * Position tief in der Liste verlängerte dadurch NICHT die Spalte (beide
 * Spalten blieben ≤ Viewporthöhe, s. ADR), sondern das Dokument selbst —
 * das Fenster scrollte, obwohl beide Spalten intern hätten scrollen sollen.
 * Per Diagnose bestätigt (Befundlage B, nicht A): (3) allein behebt den
 * gemessenen roten Fall vollständig, (1) und (2) allein je nicht — sie
 * bleiben trotzdem stehen, weil jede eine eigene, sonst mögliche Art
 * abschließt, auf die eine Spalte das Dokument verlängern könnte (s.
 * ADR-0011, Abschnitt „Nachtrag zu Punkt 6").
 *
 * Sichtbarkeit strukturell auf ihren Breitenbereich begrenzt (Korrektur
 * PO-2026-09-26-002, ADR-0032): Jede Regel, die eine Spalte in Abhängigkeit
 * von `detailOffen` ausblendet, gilt NUR unterhalb `lg`
 * (`@media not all and (min-width: 1024px)`) — sie steht nie unbedingt und
 * verlässt sich nie darauf, von einer ab-`lg`-Regel per höherer Spezifität
 * oder späterer Reihenfolge übersticht zu werden. Außerhalb dieses Blocks
 * setzt keine Regel `display: none` auf eine Spalte; der `@media
 * (min-width: 1024px)`-Block unten enthält deshalb nur noch Grid-Layout und
 * Scroll-Container-Eigenschaften, kein `display: block` mehr. Beide
 * `@media`-Bedingungen stehen als wörtliches Paar (dieselbe Bedingung, ein
 * Mal negiert) in dieser Datei — das gilt nach ADR-0011 Punkt 5/ADR-0028
 * Punkt 2 weiterhin als „eine Stelle".
 *
 * Exponierte Methode `setzeDetailVersatzZurueck()` (ADR-0033, Korrektur zu
 * ADR-0011 Punkt 6): Der Baustein besitzt den Scroll-Container der
 * Detail-Spalte, also gehört auch das Zurücksetzen seines Versatzes hierher
 * — nicht einer DOM-Suche in der Bereichsansicht. Die Methode setzt
 * ausschließlich `scrollTop = 0` am eigenen Wrapper, synchron, ohne
 * Rückgabewert, ohne Breitenprüfung (kein `matchMedia`, ADR-0028 Punkt 4):
 * Unterhalb `lg` ist der Wrapper kein Scroll-Container (teils sogar
 * `display: none`), die Zuweisung bleibt dort wirkungslos statt das Fenster
 * zu treffen. Wann sie aufgerufen wird, entscheidet ausschließlich die
 * Bereichsansicht (sie allein kennt die Route) — der Baustein bleibt
 * zustandslos und bekommt dafür weder Watcher noch Prop noch eigenen
 * Zustand (ADR-0033 Punkt 3). Der Listen-Wrapper bekommt keine
 * symmetrische Methode (ADR-0033 Punkt 5).
 */
import { ref } from 'vue'

defineProps<{
  /** Entspricht "ist eine Detailadresse aktiv" — unabhängig davon, ob sie
   * sich auf einen vorhandenen Datensatz auflöst (ADR-0011 Punkt 4). */
  detailOffen: boolean
}>()

const detailWrapperRef = ref<HTMLDivElement | null>(null)

/** ADR-0033 Punkt 2: siehe Kopfkommentar. */
function setzeDetailVersatzZurueck(): void {
  if (detailWrapperRef.value) detailWrapperRef.value.scrollTop = 0
}

defineExpose({ setzeDetailVersatzZurueck })
</script>

<template>
  <div
    class="master-detail"
    :class="{ 'master-detail--detail-offen': detailOffen }"
  >
    <div class="master-detail__liste">
      <slot name="liste" />
    </div>
    <div
      ref="detailWrapperRef"
      class="master-detail__detail"
    >
      <slot name="detail" />
    </div>
  </div>
</template>

<style scoped>
.master-detail {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

/* Unterhalb lg (1024px, siehe --breakpoint-lg): genau eine Spalte sichtbar,
   abhängig von `detailOffen` (ADR-0032). Beide Regeln stehen NUR hier, nie
   unbedingt — die Ab-lg-Sichtbarkeit unten muss sich nie gegen sie
   durchsetzen. Disjunkt (ADR-0032 Punkt 4): je Spalte trifft in einem
   Zustand höchstens eine der beiden Regeln zu, nie beide gleichzeitig. */
@media not all and (min-width: 1024px) /* --breakpoint-lg */ {
  .master-detail--detail-offen .master-detail__liste {
    display: none;
  }

  .master-detail:not(.master-detail--detail-offen) .master-detail__detail {
    display: none;
  }
}

/* Ab lg (1024px, siehe --breakpoint-lg): beide Spalten gleichzeitig,
   unabhängig von `detailOffen` — reiner CSS-Layoutwechsel bei gleicher
   Adresse (ADR-0011). Spaltenbreiten/-abstand als Tokens (ADR-0012):
   Listen-Spalte --listen-spalte-breite (~400px), Abstand --space-24,
   Detail-Spalte nimmt den Rest mit min-width: 0, damit sie schrumpfen darf
   (ADR-0012 Punkt 4) statt von ihrem Inhalt aufgedrückt zu werden — UND
   min-height: 0, damit die feste Höhe (s. u.) trägt statt vom impliziten
   `min-height: auto` eines Grid-Items unterlaufen zu werden. Reine
   Grid-/Scroll-Container-Eigenschaften — keine Sichtbarkeitsregel hier
   (ADR-0032 Punkt 1): Sichtbarkeit wird nirgends „zurückgeholt", weil sie
   oben nie unbedingt verloren ging.

   Drei Deklarationen zu ADR-0011, Nachtrag zu Punkt 6 (2026-09-28): Jede
   Spalte ist ein ABGESCHLOSSENER Scroll-Bereich, weder ihr Inhalt noch ein
   darin absolut positioniertes Element darf sie oder das Dokument
   verlängern.
     1. `grid-template-rows: minmax(0, 1fr)` an der Wurzel — Gegenstück zur
        Spaltenspur `minmax(0, 1fr)`, damit die Zeile exakt die feste Höhe
        ist und nicht implizit `auto`. Fehlerfall ohne das: eine Spalte
        höher als `innerHeight` streckt die Grid-Zeile, das Fenster
        scrollt statt der Spalte (Befundlage A).
     2. `min-height: 0` an den Spalten (s. o., mit `min-width: 0`
        zusammengefasst) — Gegenstück zu `min-width: 0`.
     3. `position: relative` an den Spalten — macht den Scroll-Container
        zum Containing Block seiner absolut positionierten Nachfahren
        (kein `z-index`, kein neuer Stapelkontext). Fehlerfall ohne das:
        ein Nachfahre wie `.ortszeile__sr-hervorhebung` (`position:
        absolute` ohne positionierten Vorfahren, ADR-0034 Punkt 5) hat als
        Containing Block den initialen Containing Block (Dokument) statt
        der Spalte — seine statische Position tief in der Liste verlängert
        dadurch das Dokument, nicht die Spalte (Befundlage B, der hier
        tatsächlich aufgetretene Fall, per Diagnose bestätigt).
   Alle drei bleiben stehen, auch wenn im konkreten Fall nur (3) trägt —
   jede schließt eine eigene Art ab, auf die eine Spalte das Dokument
   verlängern kann. */
@media (min-width: 1024px) /* --breakpoint-lg */ {
  .master-detail {
    display: grid;
    grid-template-columns: var(--listen-spalte-breite) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: start;
    gap: var(--space-24);
    height: 100vh;
  }

  .master-detail__liste,
  .master-detail__detail {
    min-width: 0;
    min-height: 0;
    position: relative;
    height: 100%;
    overflow-y: auto;
  }

  .master-detail__liste {
    border-right: 1px solid var(--border);
  }
}
</style>
