/**
 * Ortssuche gegen Photon (ADR-0020) — die EINZIGE Stelle im Projekt, die den
 * Anbieter kennt: Endpunkt, Parameter und Antwortform. Kein
 * Anbieter-Feldname (`features`, `properties`, `geometry`, `osm_id`, …)
 * verlässt diese Datei; nach außen gibt es nur {@link Ortsvorschlag} und
 * {@link OrtssucheZustand}.
 *
 * Antwortform gegen den laufenden Dienst verifiziert (2026-09-11, siehe
 * Bericht des `frontend-lead`): GeoJSON-`FeatureCollection`,
 * `Access-Control-Allow-Origin: *` bei gesetztem `Origin`-Header (Browser-
 * Fetch funktioniert ohne weitere CORS-Konfiguration), `limit` wird
 * unverändert übernommen (kein serverseitiger Deckel unter 20 getestet),
 * `lang=de` liefert deutsche Bezeichnungen. Feldbestand in `properties`
 * bestätigt: `name`, `street`, `housenumber`, `postcode`, `city`,
 * `district`, `state`, `country`, `countrycode` — kein `display_name` wie
 * bei Nominatim.
 *
 * **Koordinaten-Reihenfolge (ADR-0020 Punkt 2, der wahrscheinlichste Fehler
 * dieses Pakets):** `geometry.coordinates` ist GeoJSON, also
 * `[longitude, latitude]` — gegenüber der Alltagsschreibweise vertauscht.
 * `laenge = coordinates[0]`, `breite = coordinates[1]`. Siehe
 * `geocoding.spec.ts` für den dedizierten Test.
 *
 * Ergebnis statt Ausnahme (ADR-0020 Punkt 4, Muster ADR-0005): kein `throw`,
 * kein verschlucktes `try/catch`. Datensparsam (ADR-0020 Punkt 5): es wird
 * ausschließlich der eingetippte Suchtext übertragen — kein `lat`/`lon`,
 * keine `bbox`, keine IDs, keine Telemetrie, keine gespeicherten Antworten.
 * Kein `no-referrer` in irgendeiner Form (ADR-0018 Punkt 3) — es wird nichts
 * an Referrer-Verhalten geändert.
 */

const PHOTON_ENDPUNKT = 'https://photon.komoot.io/api/'

/** ADR-0020 Punkt 3: erst ab drei (getrimmten) Zeichen wird überhaupt
 * gesucht — nie bei leerer oder reiner Leerraum-Eingabe. */
const MINDEST_SUCHLAENGE = 3
/** design_notes PO-2026-09-07-008: entprellt nach der letzten Eingabe. */
const DEBOUNCE_MS = 300
/** design_notes: "spürbar länger als 400ms" zeigt einen Ladezustand. */
const LADEZUSTAND_SCHWELLE_MS = 400
/**
 * "Jede Anfrage hat eine Zeitüberschreitung" (ADR-0020 Punkt 3) — der
 * Architekt nennt keinen genauen Wert; 8s ist eine bewusste, für eine
 * Type-ahead-Adresssuche großzügige Wahl, damit ein nur langsamer statt
 * ausgefallener Dienst nicht vorschnell als Fehler erscheint.
 */
const ANFRAGE_ZEITLIMIT_MS = 8000

/** Die drei Zielwerte, mit denen `useOrteStore.aktualisiereFeld` aufgerufen
 * wird — bewusst keine anderen Feldnamen als im Ort-Datensatz (ADR-0020
 * Punkt 6: kein neues Feld, keine Formatänderung). */
export interface OrtsvorschlagWerte {
  adresse: string
  breite: number
  laenge: number
}

/** Ein Treffer der Ortssuche: fertige Anzeigezeile plus die drei
 * Zielwerte, mit denen sie übereinstimmt (ADR-0020 Punkt 2). */
export interface Ortsvorschlag {
  anzeige: string
  werte: OrtsvorschlagWerte
}

/** Ausdrückliches, unterscheidbares Ergebnis EINER Anfrage (ADR-0020 Punkt
 * 4) — "Fehler" und "Zeitüberschreitung" sind bewusst ein gemeinsamer Fall,
 * so wie ADR-0020 sie auch als "Fehler/Zeitüberschreitung" führt: Beides
 * mündet in denselben Text ("Suche gerade nicht möglich…"), eine feinere
 * Unterscheidung hätte keinen eigenen Text und damit keinen Zweck. */
export type SucheErgebnis =
  | { status: 'treffer'; vorschlaege: Ortsvorschlag[] }
  | { status: 'keine_treffer' }
  | { status: 'kein_netz' }
  | { status: 'fehler' }

/** Zustand einer laufenden Type-ahead-Suche — ergänzt {@link SucheErgebnis}
 * um zwei rein zeitliche Zwischenzustände, die nicht aus einer einzelnen
 * Anfrage stammen: `inaktiv` (Eingabe leer/zu kurz, nichts anzuzeigen) und
 * `laedt` (Anfrage läuft bereits spürbar lang, design_notes). */
export type OrtssucheZustand = { status: 'inaktiv' } | { status: 'laedt' } | SucheErgebnis

// --- Anbieterwissen: nur unterhalb dieser Zeile bekannt --------------------

interface PhotonEigenschaften {
  name?: string
  street?: string
  housenumber?: string
  postcode?: string
  city?: string
  country?: string
}

interface PhotonFeature {
  properties?: PhotonEigenschaften
  geometry?: { coordinates?: unknown }
}

interface PhotonFeatureCollection {
  features: PhotonFeature[]
}

function istFeatureCollection(wert: unknown): wert is PhotonFeatureCollection {
  return (
    typeof wert === 'object' &&
    wert !== null &&
    Array.isArray((wert as { features?: unknown }).features)
  )
}

function nichtLeer(wert: string | undefined): wert is string {
  return typeof wert === 'string' && wert.trim() !== ''
}

/**
 * Setzt die Anzeigezeile/Adresse aus `street`/`housenumber`/`postcode`/
 * `city`/`country` zusammen, mit `name` als Rückfall, wenn es keine Straße
 * gibt (ADR-0020 Punkt 2) — z. B. bei Städten, Plätzen oder Points of
 * Interest ohne eigene Adresse. Liefert `''`, wenn nicht einmal das reicht;
 * ein solcher Treffer wird beim Mapping verworfen (siehe unten), statt ein
 * leeres Pflichtfeld `adresse` zu erzeugen (ADR-0020 Punkt 6: leere Werte
 * bleiben `null`, nie `''`).
 */
function komponiereAdresse(eigenschaften: PhotonEigenschaften): string {
  const strasse = [eigenschaften.street, eigenschaften.housenumber].filter(nichtLeer).join(' ')
  const kopf = strasse !== '' ? strasse : nichtLeer(eigenschaften.name) ? eigenschaften.name : ''
  const ortsteil = [eigenschaften.postcode, eigenschaften.city].filter(nichtLeer).join(' ')
  return [kopf, ortsteil, eigenschaften.country].filter(nichtLeer).join(', ')
}

function mappeAufVorschlag(feature: PhotonFeature): Ortsvorschlag | null {
  const koordinaten = feature.geometry?.coordinates
  if (!Array.isArray(koordinaten) || koordinaten.length < 2) return null
  const [laenge, breite] = koordinaten as unknown[]
  // GeoJSON: [longitude, latitude] — laenge zuerst (ADR-0020 Punkt 2).
  if (typeof laenge !== 'number' || typeof breite !== 'number') return null

  const adresse = komponiereAdresse(feature.properties ?? {})
  if (adresse === '') return null

  return { anzeige: adresse, werte: { adresse, breite, laenge } }
}

/**
 * Eine einzelne Anfrage an Photon. Bricht bei `aussenSignal.abort()` sofort
 * ab (Abbruch einer laufenden Anfrage durch eine neue, ADR-0020 Punkt 3) und
 * trägt zusätzlich ein eigenes Zeitlimit. Übertragen wird ausschließlich
 * `suchtext` — kein `lat`/`lon`, keine `bbox` (ADR-0020 Punkt 5).
 */
export async function sucheOrt(suchtext: string, aussenSignal: AbortSignal): Promise<SucheErgebnis> {
  // `false` ist verlässlich und darf die Anfrage überspringen (ADR-0021
  // Punkt 4) — `true` ist keine Zusage, die Anfrage wird trotzdem versucht
  // und ein Fehlschlag danach zählt als 'fehler', nicht als 'kein_netz'.
  if (!navigator.onLine) return { status: 'kein_netz' }

  const controller = new AbortController()
  const weiterleiten = (): void => controller.abort()
  aussenSignal.addEventListener('abort', weiterleiten)
  const zeitlimit = setTimeout(() => controller.abort(), ANFRAGE_ZEITLIMIT_MS)

  try {
    const url = new URL(PHOTON_ENDPUNKT)
    url.searchParams.set('q', suchtext)
    url.searchParams.set('limit', '6')
    url.searchParams.set('lang', 'de')

    const antwort = await fetch(url, { signal: controller.signal })
    if (!antwort.ok) return { status: 'fehler' }

    const daten: unknown = await antwort.json()
    if (!istFeatureCollection(daten)) return { status: 'fehler' }

    const vorschlaege = daten.features
      .map(mappeAufVorschlag)
      .filter((vorschlag): vorschlag is Ortsvorschlag => vorschlag !== null)

    return vorschlaege.length === 0 ? { status: 'keine_treffer' } : { status: 'treffer', vorschlaege }
  } catch {
    // Deckt Netzwerkfehler, Abbruch (Zeitüberschreitung oder neue Anfrage)
    // und fehlerhaftes JSON ab — kein throw nach außen (ADR-0020 Punkt 4).
    return { status: 'fehler' }
  } finally {
    clearTimeout(zeitlimit)
    aussenSignal.removeEventListener('abort', weiterleiten)
  }
}

// --- Type-ahead-Orchestrierung (ADR-0020 Punkt 3) --------------------------

export interface OrtssucheClient {
  /** Bei jeder Eingabeänderung aufrufen. Entprellung, Mindestlänge, Abbruch
   * einer laufenden Anfrage, Verwerfen veralteter Antworten und
   * Wiederverwendung eines unveränderten Suchtexts laufen hier — kein
   * eigener Aufwand beim Aufrufer. */
  sucheEingabe(rohtext: string): void
  /** Timer und laufende Anfrage beenden, z. B. beim Aushängen der
   * aufrufenden Komponente. */
  zerstoere(): void
}

/**
 * Erstellt einen zustandsbehafteten Suchclient, der über `aufZustand`
 * jeden Zwischen- und Endzustand meldet ({@link OrtssucheZustand}). Reine
 * TS-Orchestrierung ohne Vue-Abhängigkeit — dadurch ohne
 * jsdom/@vue/test-utils testbar (Constraint TESTS).
 */
export function erstelleOrtssucheClient(aufZustand: (zustand: OrtssucheZustand) => void): OrtssucheClient {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let ladeTimer: ReturnType<typeof setTimeout> | undefined
  let laufenderController: AbortController | undefined
  let generation = 0
  let letzterSuchtext: string | null = null
  let letztesErgebnis: SucheErgebnis | null = null

  function raeumeLaufendeAnfrageAuf(): void {
    laufenderController?.abort()
    laufenderController = undefined
    if (ladeTimer !== undefined) {
      clearTimeout(ladeTimer)
      ladeTimer = undefined
    }
  }

  async function fuehreSucheAus(suchtext: string): Promise<void> {
    raeumeLaufendeAnfrageAuf()
    const controller = new AbortController()
    laufenderController = controller
    generation += 1
    const eigeneGeneration = generation

    ladeTimer = setTimeout(() => {
      if (eigeneGeneration === generation) aufZustand({ status: 'laedt' })
    }, LADEZUSTAND_SCHWELLE_MS)

    const ergebnis = await sucheOrt(suchtext, controller.signal)

    if (ladeTimer !== undefined) {
      clearTimeout(ladeTimer)
      ladeTimer = undefined
    }

    // Antworten in falscher Reihenfolge werden verworfen (ADR-0020 Punkt 3):
    // nur die jüngste Anfrage darf noch einen Zustand melden.
    if (eigeneGeneration !== generation) return

    letzterSuchtext = suchtext
    letztesErgebnis = ergebnis
    aufZustand(ergebnis)
  }

  function sucheEingabe(rohtext: string): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer)

    const suchtext = rohtext.trim()

    if (suchtext.length < MINDEST_SUCHLAENGE) {
      raeumeLaufendeAnfrageAuf()
      generation += 1
      letzterSuchtext = null
      letztesErgebnis = null
      aufZustand({ status: 'inaktiv' })
      return
    }

    // Unveränderter Suchtext: letzte Antwort wiederverwenden, keine neue
    // Anfrage (ADR-0020 Punkt 3).
    if (suchtext === letzterSuchtext && letztesErgebnis !== null) {
      aufZustand(letztesErgebnis)
      return
    }

    debounceTimer = setTimeout(() => {
      void fuehreSucheAus(suchtext)
    }, DEBOUNCE_MS)
  }

  function zerstoere(): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer)
    raeumeLaufendeAnfrageAuf()
  }

  return { sucheEingabe, zerstoere }
}
