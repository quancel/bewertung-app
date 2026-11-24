<script setup lang="ts">
/**
 * Gemeinsame Regler-Bauform (PO-2026-11-24-002): Bahn und Thumb des
 * `<input type="range">`, vollstaendig selbst gezeichnet. Zwei Nutzer — die
 * Bewertungsachse (`features/bewertungen`) und die eigenen Gewichte
 * (`features/orte`) —, deshalb hier in `shared/ui/` statt kopiert
 * (code-conventions.md „Nach shared/ erst ab zwei Nutzern"; ADR-0037).
 *
 * Die Komponente ist ein einziges `<input>` als Wurzel: Ereignisse
 * (`input`, `pointerup`, `keyup`), `id`, `class` fuer die Layoutangaben des
 * Nutzers (`flex`, `min-width`, `grid-area`) und `aria-*` fallen durch
 * (Attribut-Fallthrough). Sie hat keinen eigenen Zustand und emittiert nichts;
 * die Commit-Logik gehoert dem Nutzer. Layout (`flex: 1`, `min-width: 0`)
 * steht bewusst NICHT hier, sondern am Nutzer.
 *
 * `::-webkit-slider-thumb` und `::-moz-range-thumb` sowie `appearance: none`
 * auf Thumb UND `<input>` bleiben erhalten (ADR-0029): faellt ein
 * vendor-spezifischer Pseudo-Selektor in einer Engine aus, bleibt die Bahn
 * trotzdem sichtbar. Auf WebKit ungeprueft (ADR-0029).
 */
withDefaults(
  defineProps<{
    wert: number
    min?: number
    max?: number
    /** „Nicht gesetzt": neutrale Thumb-Farbe, Groesse und Form unveraendert. */
    leer?: boolean
  }>(),
  { min: 0, max: 10, leer: false },
)
</script>

<template>
  <input
    type="range"
    class="regler"
    :class="{ 'regler--leer': leer }"
    :min="min"
    :max="max"
    step="1"
    :value="wert"
  >
</template>

<style scoped>
/* Regler-Bahn und -Thumb werden vollstaendig selbst gezeichnet
   (design-conventions.md "Werte mit Bereich, bei denen 0 gueltig ist" ->
   "Regler-Bahn und -Thumb", siebte Runde, PO-2026-09-16-001). Anker-Prinzip:
   appearance: none jetzt auch am <input> selbst (nicht nur am
   Thumb-Pseudo-Element wie in der sechsten Runde) UND Rahmen/Radius/
   Hintergrund/Hoehe der Bahn stehen direkt auf diesem Basis-Selektor, nicht
   nur auf den Track-Pseudo-Elementen weiter unten -- faellt ein
   vendor-spezifischer Pseudo-Selektor in einer Engine aus, bleibt die Bahn
   trotzdem sichtbar, ausfallen kann dann nur noch der Thumb.
   `accent-color` entfaellt ersatzlos: ohne native Bahn hat es in keiner
   Engine mehr eine Wirkung.

   Korrektur aus der Abnahme (PO-2026-09-16-001, zwei Befunde): Die
   44x44px-Trefferflaeche entsteht jetzt ueber einen TRANSPARENTEN
   `border-width: 18px 0` statt ueber `padding: 18px 0` -- Masse unveraendert
   (8px Bahn + 2x18px = 44px), nur das Mittel getauscht. Grund: `outline`
   kennt nur EINEN Versatz fuer alle vier Seiten (`outline-offset`); bei
   Padding nur vertikal (18px oben/unten, 0px links/rechts) zog derselbe
   Versatz den Rahmen faelschlich auch an beiden Enden 18px nach innen
   (Befund 1 -- die Bahn endete sichtbar vor dem linken/rechten Ende, obwohl
   die Flaeche volle Breite hatte). Ein inset-`box-shadow` dagegen beginnt
   IMMER an der Innenkante des Rahmens (Padding-Box), unabhaengig davon, ob
   der Rahmen pro Achse unterschiedlich breit ist -- mit 18px oben/unten und
   0px links/rechts faellt diese Innenkante exakt auf die 8px hohe, volle
   Breite messende Bahn, ganz ohne manuellen Versatz-Wert. Der eigentliche
   Bahn-Rahmen steht deshalb weiter unten als `box-shadow`, nicht mehr als
   `outline`. */
.regler {
  appearance: none;
  -webkit-appearance: none;
  /* Lokale Ausnahme vom globalen `box-sizing: border-box` (base.css): nur
     im content-box-Modell bleiben Bahnhoehe (8px, deckungsgleich mit
     `.intensitaetsbalken__spur`) und der Rahmen der Trefferflaeche
     unabhaengig rechenbar -- unter border-box wuerde ein zu grosser Rahmen
     die deklarierte Hoehe verdraengen statt sie zu ergaenzen. */
  box-sizing: content-box;
  height: 8px;
  padding: 0;
  /* Trefferflaeche 44x44px (design-conventions.md): 2x18px + 8px Bahnhoehe
     = 44px -- ueber einen transparenten Rahmen statt Padding (siehe
     Kommentarblock oben), damit die Innenkante des Rahmens (Padding-Box)
     exakt auf die sichtbare Bahn faellt. Der 24px-Thumb (siehe
     Pseudo-Elemente unten) braucht mit denselben 18px ebenfalls >= 44px,
     ist also nicht der bestimmende Faktor. */
  border-style: solid;
  border-color: transparent;
  border-width: 18px 0;
  margin: 0;
  background-color: var(--surface);
  /* Ohne background-clip wuerde die Flaeche die gesamte Trefferflaeche
     (44px) einfaerben statt nur die 8px hohe Bahn. */
  background-clip: content-box;
  border-radius: var(--radius-full);
  cursor: pointer;
  /* Sichtbarer Bahn-Rahmen, siehe Kommentarblock oben: liegt an der
     Innenkante des transparenten Rahmens an, also exakt um die 8px hohe,
     volle Breite messende Bahn -- in jedem Zustand identisch, keine
     Fuellung (der Intensitaetsbalken darunter zeigt den Fuellstand bereits,
     design-conventions.md). Bewusst OHNE `:focus-visible`-Ausnahme (Befund
     2 der Abnahme): ein `box-shadow` ist eine andere CSS-Eigenschaft als
     der `outline`-Fokusring gleich darunter, beide bleiben deshalb
     gleichzeitig sichtbar, der Fokusring ergaenzt den Bahn-Rahmen statt ihn
     zu ersetzen. */
  box-shadow: inset 0 0 0 1px var(--border);
}

/* Fokusring -- ergaenzt den permanenten Bahn-Rahmen (`box-shadow` oben),
   ersetzt ihn nicht (Befund 2 der Abnahme). Fallback, falls eine
   WebKit-Version den globalen `:focus-visible`-Ring (base.css) bei
   `appearance: none` zusaetzlich unterdrueckt (design-conventions.md
   "Fokusring") -- dieselben Fokusring-Tokens wie die globale Regel, keine
   neuen Werte. Hier nicht verifizierbar: kein WebKit-Testlauf moeglich
   (ADR-0023 Punkt 5, ADR-0029). */
.regler:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* Track-Pseudo-Elemente bekommen nur einen Reset, kein eigenes Aussehen --
   die Bahn-Optik kommt vom Basis-Selektor oben und soll durchscheinen
   (Anker-Prinzip). Gleiche Hoehe/Radius wie oben, rein informativ fuer die
   interne Boxberechnung der jeweiligen Engine. */
.regler::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
}

.regler::-moz-range-track {
  height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
}

/* Thumb -- Werte aus der sechsten Runde (design-conventions.md), unabhaengig
   von der Bahnfrage: eigener 2px-Rahmen + Fuellfarbe in JEDEM Zustand,
   Groesse/Form aendern sich zwischen den Zustaenden nicht, nur die Farbe.
   24px Durchmesser ist seit der achten Korrektur-Runde (2026-09-17) eine
   benannte Design-Festlegung in design-conventions.md ("Regler-Bahn und
   -Thumb" -> "Thumb"), keine freie Bemessungsgroesse des Frontend-Leads
   mehr: dreimal so hoch wie die 8px-Bahn (damit der Thumb auch im "nicht
   gesetzt"-Zustand als eigenstaendiges Element erkennbar bleibt) und
   zugleich die bestehende Icon-Basisgroesse der Anwendung
   (design-concept.md "Ikonografie") -- kein isolierter, nur hier
   verwendeter Wert. Vorgemerkt als Token-Kandidat fuer tokens.css
   (z. B. `--regler-thumb-groesse`), sobald ein zweiter Verwendungsort
   hinzukommt; bis dahin bleibt der Literalwert hier im Feature-Code.
   Basisregel = "gesetzt" (inkl. 0): Primaerton, Kontrast ca. 6,1:1. */
.regler::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  /* WebKit richtet den Thumb sonst an der Oberkante der Bahn aus statt ihn
     zu zentrieren: (Bahnhoehe 8px - Thumb 24px) / 2. */
  margin-top: -8px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-600);
  background-color: var(--color-primary-600);
  cursor: pointer;
  transition:
    background-color var(--duration-120) var(--ease-out),
    border-color var(--duration-120) var(--ease-out);
}

.regler::-moz-range-thumb {
  /* Firefox zentriert den Thumb auf der Bahn automatisch, kein
     margin-top-Ausgleich noetig. */
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-600);
  background-color: var(--color-primary-600);
  cursor: pointer;
  transition:
    background-color var(--duration-120) var(--ease-out),
    border-color var(--duration-120) var(--ease-out);
}

/* "Nicht gesetzt": neutrale Farbe wie jede andere fehlende Angabe
   (design-concept.md "Fehlende Daten sind neutral"), Kontrast ca. 4,8:1.
   Vorherige Fassung blendete den Thumb bei `null` per `opacity: 0` komplett
   aus -- dadurch war der Regler erst nach mehrfachem zufaelligen Antippen
   auffindbar (Nutzermeldung 2026-09-13); Groesse/Form bleiben deshalb hier
   unangetastet, nur Rahmen-/Fuellfarbe wechseln. */
.regler--leer::-webkit-slider-thumb {
  border-color: var(--text-muted);
  background-color: var(--surface);
}

.regler--leer::-moz-range-thumb {
  border-color: var(--text-muted);
  background-color: var(--surface);
}
</style>
