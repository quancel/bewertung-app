/**
 * Leaflet-Anbindung der Kartenfläche (ADR-0018, ADR-0019, ADR-0021,
 * PO-2026-09-07-006). Kapselt den kompletten Umgang mit der Fremdbibliothek
 * an einer Stelle — `Kartenflaeche.vue` bleibt dadurch ein dünnes Template
 * plus Verdrahtung. Kein Vue-Reactivity-Wrapping der Karteninstanz selbst
 * (ADR-0018 Punkt 7): `map`, die Kachelebene und die Marker-Map liegen in
 * lokalen, NICHT-reaktiven Variablen (kein `ref()`/`reactive()`), damit Vue
 * sie nicht tief proxied und Leaflets interne Identitätsvergleiche intakt
 * bleiben.
 *
 * NICHT unit-testbar unter `vitest`/`environment: 'node'` (Constraint
 * TESTS) — dieses Modul braucht echtes DOM und die Leaflet-Bibliothek.
 * Getrennt getestet sind ausschließlich die reinen Berechnungen, die dieses
 * Modul aufruft: `../lib/kartenausschnitt.ts`. Die Verdrahtung selbst
 * (Marker-Erzeugung, Fokus, Tastaturbedienung, Kachel-Neuzeichnen bei
 * Netzrückkehr) ist nur durch manuelles Prüfen im Browser abgesichert.
 */
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { berechneKartenausschnitt } from '../lib/kartenausschnitt'
import type { KartenOrt } from '../model/karte.types'

/**
 * 1×1 transparentes GIF als `errorTileUrl` (Constraint KACHELAUSFALL): keine
 * kaputten Bild-Icons, wenn eine Kachel ohne Netz oder wegen eines
 * Netzfehlers ausbleibt — die Fläche bleibt `--color-neutral-100`
 * (`.karte-container`-Hintergrund in `Kartenflaeche.vue`), kein
 * Layoutsprung.
 */
const TRANSPARENTE_KACHEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7'

export interface LeafletKarteApi {
  /** Bewegt den Tastaturfokus auf den Marker mit dieser Ort-ID, sofern er
   * aktuell existiert — no-op sonst (z. B. weil der Ort inzwischen aus dem
   * Filter gefallen ist). */
  fokussiereMarker(ortId: string): void
}

export function useLeafletKarte(
  containerRef: Ref<HTMLElement | null>,
  orte: Ref<readonly KartenOrt[]>,
  aufOrtAusgewaehlt: (ortId: string) => void,
  online: Ref<boolean>,
): LeafletKarteApi {
  let karte: L.Map | null = null
  let kachelEbene: L.TileLayer | null = null
  const markerJeId = new Map<string, L.Marker>()

  function navigiere(ortId: string): void {
    aufOrtAusgewaehlt(ortId)
  }

  /**
   * `L.divIcon` statt Bilddatei (ADR-0018 Punkt 4) — Farbe ausschließlich
   * `--color-accent-500` (design-concept.md, einziger Verwendungszweck).
   * Der Farbwert kommt über die normale CSS-Kaskade (`.karte-marker__punkt`
   * in `Kartenflaeche.vue`, UNSCOPED), nicht über einen hier hartkodierten
   * Wert.
   */
  function erzeugeIcon(): L.DivIcon {
    return L.divIcon({
      className: 'karte-marker-icon',
      html: '<span class="karte-marker__punkt"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
  }

  /**
   * Tastaturbedienung (design_notes: „Tab bewegt den Fokus zwischen
   * Markern, Enter öffnet die Detailansicht, im Fokus sind Fokusring und
   * Beschriftung gemeinsam sichtbar"): Leaflets eigene `keyboard`-Option
   * verschiebt stattdessen den KARTENAUSSCHNITT per Pfeiltaste — hier
   * bewusst aus (`keyboard: false`), eigene Tastaturbedienung über das vom
   * Marker erzeugte DOM-Element selbst.
   */
  function erzeugeMarker(ort: KartenOrt): L.Marker {
    const marker = L.marker([ort.breite, ort.laenge], { icon: erzeugeIcon(), keyboard: false })
    marker.on('add', () => {
      const element = marker.getElement()
      if (!element) return
      element.classList.add('karte-marker')
      element.setAttribute('role', 'button')
      element.setAttribute('tabindex', '0')
      element.setAttribute('aria-label', ort.bezeichnung)

      const label = document.createElement('span')
      label.className = 'karte-marker__label'
      label.textContent = ort.bezeichnung
      element.appendChild(label)

      const aufAktivierung = (event: Event): void => {
        if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        navigiere(ort.id)
      }
      element.addEventListener('click', aufAktivierung)
      element.addEventListener('keydown', aufAktivierung)
    })
    return marker
  }

  /**
   * Marker aus den Props nachführen (Constraint DATENAUSWAHL): nicht
   * einmalig beim Mount, weil der Store asynchron lädt und sich der Filter
   * zur Laufzeit ändert. Bestehende Marker werden per ID abgeglichen statt
   * pauschal neu erzeugt — ein Ort, der Koordinaten behält, verliert dabei
   * keinen eigenen Fokus-/Hover-Zustand.
   */
  function aktualisiereMarker(): void {
    if (!karte) return
    const aktuelleIds = new Set(orte.value.map((ort) => ort.id))

    for (const [id, marker] of markerJeId) {
      if (!aktuelleIds.has(id)) {
        marker.remove()
        markerJeId.delete(id)
      }
    }

    for (const ort of orte.value) {
      const bestehender = markerJeId.get(ort.id)
      if (bestehender) {
        bestehender.setLatLng([ort.breite, ort.laenge])
        continue
      }
      const marker = erzeugeMarker(ort)
      marker.addTo(karte)
      markerJeId.set(ort.id, marker)
    }
  }

  /**
   * `fitBounds`/`setView` beim Aufbau und bei jeder Änderung der
   * Markermenge (Constraint KARTENAUSSCHNITT) — kein Nachführen bei reinem
   * Pan/Zoom des Nutzers, weil diese Funktion dafür gar nicht aufgerufen
   * wird. Reine Berechnung in `../lib/kartenausschnitt.ts`.
   */
  function wendeKartenausschnittAn(): void {
    if (!karte) return
    const ausschnitt = berechneKartenausschnitt(orte.value)
    if (ausschnitt.art === 'leer') return
    if (ausschnitt.art === 'einzel') {
      karte.setView([ausschnitt.mittelpunkt.breite, ausschnitt.mittelpunkt.laenge], 14)
      return
    }
    karte.fitBounds(
      [
        [ausschnitt.suedwesten.breite, ausschnitt.suedwesten.laenge],
        [ausschnitt.nordosten.breite, ausschnitt.nordosten.laenge],
      ],
      { padding: [32, 32] },
    )
  }

  onMounted(() => {
    if (!containerRef.value) return

    karte = L.map(containerRef.value, { attributionControl: true }).setView([0, 0], 2)

    // OSM-Standard-Kachelserver, ohne {s}-Subdomain, kein API-Schlüssel
    // (ADR-0018 Punkt 3). Attribution ist Pflicht und bleibt sichtbar.
    kachelEbene = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap-Mitwirkende',
      errorTileUrl: TRANSPARENTE_KACHEL,
    }).addTo(karte)

    aktualisiereMarker()
    wendeKartenausschnittAn()
  })

  watch(orte, () => {
    aktualisiereMarker()
    wendeKartenausschnittAn()
  })

  // ADR-0021 Punkt 2b: einen bereits sichtbar fehlgeschlagenen Fremd-Abruf
  // (leere Kachelfläche) an GENAU dieser Stelle wiederholen, wenn das Netz
  // zurück ist — kein Reload, keine Navigation, kein globaler Zustand.
  watch(online, (istOnline) => {
    if (istOnline) kachelEbene?.redraw()
  })

  onBeforeUnmount(() => {
    markerJeId.clear()
    karte?.remove()
    karte = null
    kachelEbene = null
  })

  function fokussiereMarker(ortId: string): void {
    markerJeId.get(ortId)?.getElement()?.focus()
  }

  return { fokussiereMarker }
}
