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
import {
  berechneKartenausschnitt,
  bildeMengenKennung,
  liegtMarkerImAusschnitt,
} from '../lib/kartenausschnitt'
import { bestimmeSichtbareEtiketten, type EtikettKandidat, type Rechteck } from '../lib/etikettKollision'
import { berechnePanVersatz, liegtUnterVerdeckung } from '../lib/verdeckung'
import { leseGemerktenAusschnitt, merkeAusschnitt } from './kartenausschnittSitzung'
import type { KartenOrt, KartenPanAuftrag, KartenVerdeckung } from '../model/karte.types'

/**
 * 1×1 transparentes GIF als `errorTileUrl` (Constraint KACHELAUSFALL): keine
 * kaputten Bild-Icons, wenn eine Kachel ohne Netz oder wegen eines
 * Netzfehlers ausbleibt — die Fläche bleibt `--color-neutral-100`
 * (`.karte-container`-Hintergrund in `Kartenflaeche.vue`), kein
 * Layoutsprung.
 */
const TRANSPARENTE_KACHEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7'

/**
 * Trefferfläche des Markers in px = Token `--karte-marker-treffer`
 * (tokens.css). `L.divIcon` braucht Größe und Anker als Zahl; der Anker ist
 * die Mitte der Fläche, also der Mittelpunkt von Scheibe bzw. Punkt.
 */
const MARKER_TREFFERFLAECHE = 44

/** Abstand Etikett zum Rand der Kartenfläche in px (design-conventions.md: 8px = `--space-8`). */
const ETIKETT_RANDABSTAND = 8

/** Von der Überlagerung (Schnellansicht, PO-2026-11-24-005) abhängige Eingaben. */
export interface LeafletKarteUeberlagerung {
  /** Von unten verdeckter Bereich, `null` = nichts verdeckt. */
  verdeckung: Ref<KartenVerdeckung | null | undefined>
  /** Ein neues Objekt je Nutzeraktion (Öffnen/Wechsel) löst das minimale Verschieben aus. */
  panAuftrag: Ref<KartenPanAuftrag | null | undefined>
}

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
  ausgewaehlteOrtId: Ref<string | null | undefined>,
  ueberlagerung: LeafletKarteUeberlagerung,
): LeafletKarteApi {
  let karte: L.Map | null = null
  let kachelEbene: L.TileLayer | null = null
  const markerJeId = new Map<string, L.Marker>()
  /** Zuletzt gesehener Ort je Marker — Klick-/Tastaturhandler und
   * Inhaltsabgleich lesen von hier, damit ein bestehender Marker bei
   * Inhaltsänderung nicht neu erzeugt werden muss (Fokus bleibt erhalten). */
  const ortJeId = new Map<string, KartenOrt>()
  let fokussierterMarkerId: string | null = null
  let etikettBerechnungGeplant = 0
  // ADR-0038: Der erste Aufbau mit GELADENER Markermenge entscheidet über
  // Wiederherstellen oder Einpassen; danach wird nur bei inhaltlicher
  // Änderung der Menge der Marker-IDs eingepasst.
  let ersterAufbauErledigt = false
  let letzteMengenKennung: string | null = null
  // Pan-Auftrag, der auf die Höhe der Überlagerung wartet (sie meldet sich erst
  // nach dem Einhängen): beim Öffnen kommt der Auftrag vor dem Maß.
  let ausstehenderPanOrtId: string | null = null

  function navigiere(ortId: string): void {
    aufOrtAusgewaehlt(ortId)
  }

  /**
   * `L.divIcon` statt Bilddatei (ADR-0018 Punkt 4). Das Icon trägt nur die
   * Trefferfläche (Token `--karte-marker-treffer`); der Inhalt (Scheibe oder
   * Punkt, Etikett) wird in `befuelleElement` gesetzt, damit er sich bei
   * Inhaltsänderung ohne neues Element nachführen lässt. Farben kommen über
   * die CSS-Kaskade (`Kartenflaeche.vue`, UNSCOPED), nicht aus JS.
   */
  function erzeugeIcon(): L.DivIcon {
    return L.divIcon({
      className: 'karte-marker-icon',
      html: '',
      iconSize: [MARKER_TREFFERFLAECHE, MARKER_TREFFERFLAECHE],
      iconAnchor: [MARKER_TREFFERFLAECHE / 2, MARKER_TREFFERFLAECHE / 2],
    })
  }

  /** Zugänglicher Name (unabhängig davon, ob das Etikett sichtbar ist). */
  function zugaenglicherName(ort: KartenOrt): string {
    if (ort.notentext !== null) return `${ort.bezeichnung}, Gesamtnote ${ort.notentext}`
    if (ort.ohneNoteGrund === 'ohne-gewicht') return `${ort.bezeichnung}, keine Gesamtnote bei dieser Gewichtung`
    return `${ort.bezeichnung}, keine Gesamtnote`
  }

  /** Setzt Name, Scheibe/Punkt und Etikett eines Markers aus dem Ort; das
   * Element selbst (und damit der Tastaturfokus) bleibt erhalten. */
  function befuelleElement(element: HTMLElement, ort: KartenOrt): void {
    element.setAttribute('aria-label', zugaenglicherName(ort))

    let koerper = element.querySelector<HTMLElement>('.karte-marker__koerper')
    if (!koerper) {
      koerper = document.createElement('span')
      element.appendChild(koerper)
    }
    koerper.className = ort.notentext !== null ? 'karte-marker__koerper karte-marker__scheibe' : 'karte-marker__koerper karte-marker__punkt'
    koerper.textContent = ort.notentext ?? ''

    let label = element.querySelector<HTMLElement>('.karte-marker__label')
    if (!label) {
      label = document.createElement('span')
      label.className = 'karte-marker__label karte-marker__label--aus'
      label.setAttribute('aria-hidden', 'true')
      element.appendChild(label)
    }
    label.textContent = ort.bezeichnung

    element.classList.toggle('karte-marker--mit-note', ort.notentext !== null)
    element.classList.toggle('karte-marker--gewaehlt', ort.id === ausgewaehlteOrtId.value)
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
      befuelleElement(element, ortJeId.get(ort.id) ?? ort)

      const aufAktivierung = (event: Event): void => {
        if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        navigiere(ort.id)
      }
      element.addEventListener('click', aufAktivierung)
      element.addEventListener('keydown', aufAktivierung)
      element.addEventListener('focus', () => {
        fokussierterMarkerId = ort.id
        planeEtikettBerechnung()
      })
      element.addEventListener('blur', () => {
        if (fokussierterMarkerId === ort.id) fokussierterMarkerId = null
        planeEtikettBerechnung()
      })
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
        ortJeId.delete(id)
        if (fokussierterMarkerId === id) fokussierterMarkerId = null
      }
    }

    for (const ort of orte.value) {
      ortJeId.set(ort.id, ort)
      const bestehender = markerJeId.get(ort.id)
      if (bestehender) {
        bestehender.setLatLng([ort.breite, ort.laenge])
        // Inhalt (Note, Name, Gewichtung) nachführen, ohne das Element zu
        // ersetzen und ohne den Ausschnitt anzufassen (ADR-0038 Punkt 5).
        const element = bestehender.getElement()
        if (element) befuelleElement(element, ort)
        continue
      }
      const marker = erzeugeMarker(ort)
      marker.addTo(karte)
      markerJeId.set(ort.id, marker)
    }
    planeEtikettBerechnung()
  }

  function rechteckVon(element: Element): Rechteck {
    const r = element.getBoundingClientRect()
    return { links: r.left, oben: r.top, rechts: r.right, unten: r.bottom }
  }

  /**
   * Misst Etiketten und Körper aller Marker und blendet kollidierende
   * Etiketten aus (PO-2026-11-24-004, reine Regel in `../lib/etikettKollision.ts`).
   * Gemessen werden die GERENDERTEN Rechtecke, nicht Rechenwerte — das
   * Etikett bleibt dafür auch im Zustand „aus" im Layout (nur `opacity`).
   * Läuft nach `moveend`/`zoomend`, bei Props-Änderung und bei
   * Fokuswechsel, nie während des Ziehens.
   */
  function berechneEtikettSichtbarkeit(): void {
    const container = containerRef.value
    if (!karte || !container) return
    const rahmen = container.getBoundingClientRect()
    const kandidaten: EtikettKandidat[] = []
    const versatzJeId = new Map<string, number>()

    for (const [id, marker] of markerJeId) {
      const ort = ortJeId.get(id)
      const element = marker.getElement()
      if (!ort || !element) continue
      const label = element.querySelector<HTMLElement>('.karte-marker__label')
      const koerper = element.querySelector<HTMLElement>('.karte-marker__koerper')
      if (!label || !koerper) continue

      const hatVorrang = id === ausgewaehlteOrtId.value || id === fokussierterMarkerId
      element.classList.toggle('karte-marker--vorrang', hatVorrang)
      label.style.setProperty('--karte-marker-etikett-versatz', '0px')

      let etikett = rechteckVon(label)
      // Horizontal im Kartenrahmen halten (8px Abstand), soweit es die Breite
      // erlaubt — nur für Marker, die selbst im Rahmen liegen: Das Etikett eines
      // Markers außerhalb würde sonst an den Rand gezogen und dort einen
      // Marker zeigen, den niemand sieht.
      let versatz = 0
      const mitteX = (etikett.links + etikett.rechts) / 2
      const markerImRahmen = mitteX >= rahmen.left && mitteX <= rahmen.right
      if (!markerImRahmen) {
        // kein Versatz
      } else if (etikett.links < rahmen.left + ETIKETT_RANDABSTAND) versatz = rahmen.left + ETIKETT_RANDABSTAND - etikett.links
      else if (etikett.rechts > rahmen.right - ETIKETT_RANDABSTAND) versatz = rahmen.right - ETIKETT_RANDABSTAND - etikett.rechts
      if (versatz !== 0) {
        versatzJeId.set(id, versatz)
        etikett = { ...etikett, links: etikett.links + versatz, rechts: etikett.rechts + versatz }
      }
      kandidaten.push({
        id,
        bezeichnung: ort.bezeichnung,
        rohwert: ort.rohwert,
        hatVorrang,
        etikett,
        koerper: rechteckVon(koerper),
      })
    }

    const sichtbar = bestimmeSichtbareEtiketten(kandidaten)
    for (const [id, marker] of markerJeId) {
      const label = marker.getElement()?.querySelector<HTMLElement>('.karte-marker__label')
      if (!label) continue
      label.style.setProperty('--karte-marker-etikett-versatz', `${versatzJeId.get(id) ?? 0}px`)
      label.classList.toggle('karte-marker__label--aus', !sichtbar.has(id))
    }
  }

  /** Fasst mehrere Auslöser eines Frames zu einer Messung zusammen. */
  function planeEtikettBerechnung(): void {
    if (etikettBerechnungGeplant) return
    etikettBerechnungGeplant = requestAnimationFrame(() => {
      etikettBerechnungGeplant = 0
      berechneEtikettSichtbarkeit()
    })
  }

  /**
   * `fitBounds`/`setView` beim ersten Aufbau ohne passenden gemerkten
   * Ausschnitt und bei jeder inhaltlichen Änderung der Menge der Marker-IDs
   * (Constraint KARTENAUSSCHNITT, ADR-0038) — kein Nachführen bei reinem
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

  /**
   * ADR-0038 Punkt 4: Gemerkten Ausschnitt als Startansicht setzen (ohne
   * Animation, ohne vorheriges Einpassen), sofern mindestens ein Marker darin
   * liegt. Liefert, ob wiederhergestellt wurde.
   */
  function stelleGemerktenAusschnittWiederHer(): boolean {
    if (!karte) return false
    const gemerkt = leseGemerktenAusschnitt()
    if (!gemerkt) return false
    karte.setView([gemerkt.breite, gemerkt.laenge], gemerkt.zoom, { animate: false })
    const grenzen = karte.getBounds()
    const liegtDrin = liegtMarkerImAusschnitt(orte.value, {
      suedwesten: { breite: grenzen.getSouth(), laenge: grenzen.getWest() },
      nordosten: { breite: grenzen.getNorth(), laenge: grenzen.getEast() },
    })
    return liegtDrin
  }

  /** Marker nachführen und den Ausschnitt nur dann anfassen, wenn es der
   * erste Aufbau mit Markern ist oder sich die ID-Menge ändert (ADR-0038). */
  function synchronisiere(): void {
    aktualisiereMarker()
    if (!karte || orte.value.length === 0) {
      aktualisiereVerdeckung()
      return
    }
    const kennung = bildeMengenKennung(orte.value)
    if (!ersterAufbauErledigt) {
      ersterAufbauErledigt = true
      letzteMengenKennung = kennung
      if (!stelleGemerktenAusschnittWiederHer()) wendeKartenausschnittAn()
      aktualisiereVerdeckung()
      return
    }
    if (kennung !== letzteMengenKennung) {
      letzteMengenKennung = kennung
      wendeKartenausschnittAn()
    }
    aktualisiereVerdeckung()
  }

  /**
   * PO-2026-11-24-005 (ADR-0039 Punkt 5/7): Marker, deren Mittelpunkt unter der
   * Überlagerung liegt, sind `inert` (aus Tab-Folge und Zeigerereignissen) und
   * wieder aktiv, sobald sie darüber liegen. Gleiches gilt für Leaflets
   * Bedienelemente oben (der Zoom-Knopf bei „voll"): die Überlagerung würde
   * sie überdecken, ohne dass sie ausweichen können — sie werden ausgeblendet
   * UND `inert`. Unten rücken Bedienelemente und Quellenangabe per
   * CSS-Variable (`--karte-verdeckt-unten`, `Kartenflaeche.vue`) nach oben.
   * Läuft nach `moveend`, Prop-Änderung und Bestandswechsel.
   */
  function aktualisiereVerdeckung(): void {
    const container = containerRef.value
    if (!karte || !container) return
    const verdeckung = ueberlagerung.verdeckung.value ?? null
    const hoehe = container.clientHeight
    for (const marker of markerJeId.values()) {
      const element = marker.getElement()
      if (!element) continue
      const verdeckt = liegtUnterVerdeckung(karte.latLngToContainerPoint(marker.getLatLng()), hoehe, verdeckung)
      if (verdeckt) element.setAttribute('inert', '')
      else element.removeAttribute('inert')
    }
    const rahmen = container.getBoundingClientRect()
    for (const steuerung of container.querySelectorAll<HTMLElement>('.leaflet-top .leaflet-control')) {
      const kasten = steuerung.getBoundingClientRect()
      const verdeckt =
        !!verdeckung &&
        verdeckung.hoehe > 0 &&
        kasten.bottom - rahmen.top > hoehe - verdeckung.hoehe &&
        kasten.right - rahmen.left > verdeckung.links &&
        kasten.left - rahmen.left < verdeckung.rechts
      steuerung.classList.toggle('karte-steuerung--verdeckt', verdeckt)
      if (verdeckt) steuerung.setAttribute('inert', '')
      else steuerung.removeAttribute('inert')
    }
  }

  /** Verschiebt die Karte minimal, bis der Marker über der Überlagerung liegt (nie Zoom). */
  function fuehrePanAus(ortId: string): void {
    const container = containerRef.value
    const marker = markerJeId.get(ortId)
    if (!karte || !container || !marker) return
    const versatz = berechnePanVersatz(
      karte.latLngToContainerPoint(marker.getLatLng()),
      container.clientHeight,
      ueberlagerung.verdeckung.value ?? null,
    )
    if (versatz <= 0) return
    const reduziert = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    karte.panBy([0, versatz], { animate: !reduziert, duration: 0.24 })
  }

  function merkeAktuellenAusschnitt(): void {
    if (!karte) return
    const mitte = karte.getCenter()
    merkeAusschnitt({ breite: mitte.lat, laenge: mitte.lng, zoom: karte.getZoom() })
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

    // Erst NACH dem Initial-`setView` registrieren: Dessen `moveend` (Mitte
    // 0/0, Zoom 2) würde sonst den gemerkten Ausschnitt überschreiben, bevor
    // er gelesen wird (ADR-0038 Punkt 3: gemerkt wird, was zuletzt zu sehen war).
    karte.on('moveend', merkeAktuellenAusschnitt)
    karte.on('moveend', planeEtikettBerechnung)
    karte.on('moveend', aktualisiereVerdeckung)
    karte.on('zoomend', planeEtikettBerechnung)

    synchronisiere()
  })

  watch(orte, synchronisiere)

  // Auswahl: nur Klassen nachführen (Größe/Ring), Element und Ausschnitt bleiben.
  watch(ausgewaehlteOrtId, (neueId) => {
    for (const [id, marker] of markerJeId) {
      marker.getElement()?.classList.toggle('karte-marker--gewaehlt', id === neueId)
    }
    planeEtikettBerechnung()
  })

  // Überlagerung (ADR-0039 Punkt 5): Maß ändert sich -> inert neu bestimmen und
  // einen wartenden Pan-Auftrag ausführen; ein neuer Auftrag wartet, bis ein Maß da ist.
  watch(ueberlagerung.verdeckung, (verdeckung) => {
    aktualisiereVerdeckung()
    if (ausstehenderPanOrtId && verdeckung && verdeckung.hoehe > 0) {
      const ortId = ausstehenderPanOrtId
      ausstehenderPanOrtId = null
      fuehrePanAus(ortId)
    }
  })

  watch(ueberlagerung.panAuftrag, (auftrag) => {
    if (!auftrag) {
      ausstehenderPanOrtId = null
      return
    }
    const verdeckung = ueberlagerung.verdeckung.value
    if (verdeckung && verdeckung.hoehe > 0) fuehrePanAus(auftrag.ortId)
    else ausstehenderPanOrtId = auftrag.ortId
  })

  // ADR-0021 Punkt 2b: einen bereits sichtbar fehlgeschlagenen Fremd-Abruf
  // (leere Kachelfläche) an GENAU dieser Stelle wiederholen, wenn das Netz
  // zurück ist — kein Reload, keine Navigation, kein globaler Zustand.
  watch(online, (istOnline) => {
    if (istOnline) kachelEbene?.redraw()
  })

  onBeforeUnmount(() => {
    markerJeId.clear()
    ortJeId.clear()
    if (etikettBerechnungGeplant) cancelAnimationFrame(etikettBerechnungGeplant)
    etikettBerechnungGeplant = 0
    karte?.off('moveend', merkeAktuellenAusschnitt)
    karte?.off('moveend', planeEtikettBerechnung)
    karte?.off('moveend', aktualisiereVerdeckung)
    karte?.off('zoomend', planeEtikettBerechnung)
    karte?.remove()
    karte = null
    kachelEbene = null
  })

  function fokussiereMarker(ortId: string): void {
    // preventScroll: Die Fokusrückgabe verschiebt den Ausschnitt nicht (ADR-0038 Punkt 7).
    markerJeId.get(ortId)?.getElement()?.focus({ preventScroll: true })
  }

  return { fokussiereMarker }
}
