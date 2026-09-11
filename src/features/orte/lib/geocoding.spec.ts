import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { erstelleOrtssucheClient, sucheOrt, type OrtssucheZustand } from './geocoding'

function photonAntwort(features: unknown[]): Response {
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Ein Treffer nach dem echten Feldbestand von `photon.komoot.io` (verifiziert
 * am 2026-09-11, siehe Modul-Kommentar in `geocoding.ts`). */
function photonFeature(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'Feature',
    properties: {
      osm_id: 48773037,
      osm_key: 'highway',
      osm_value: 'pedestrian',
      name: 'Marienplatz',
      city: 'München',
      state: 'Bayern',
      country: 'Deutschland',
      postcode: '80331',
      ...overrides,
    },
    // Reale Antwort: München liegt bei ca. 11.58 Ost / 48.14 Nord —
    // coordinates[0] ist die östliche (Länge), coordinates[1] die nördliche
    // (Breite) Koordinate.
    geometry: { type: 'Point', coordinates: [11.5769575, 48.1367436] },
  }
}

beforeEach(() => {
  vi.stubGlobal('navigator', { onLine: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('sucheOrt', () => {
  it('bildet einen Treffer inklusive der vertauschten GeoJSON-Koordinatenreihenfolge ab', async () => {
    const fetchMock = vi.fn().mockResolvedValue(photonAntwort([photonFeature()]))
    vi.stubGlobal('fetch', fetchMock)

    const ergebnis = await sucheOrt('Marienplatz München', new AbortController().signal)

    expect(ergebnis.status).toBe('treffer')
    if (ergebnis.status !== 'treffer') throw new Error('unerwarteter Status')
    expect(ergebnis.vorschlaege).toHaveLength(1)
    const [vorschlag] = ergebnis.vorschlaege
    // laenge = coordinates[0] (Ost/West), breite = coordinates[1] (Nord/Süd)
    // — GENAU umgekehrt zur Alltagsschreibweise (ADR-0020 Punkt 2).
    expect(vorschlag!.werte.laenge).toBe(11.5769575)
    expect(vorschlag!.werte.breite).toBe(48.1367436)
    expect(vorschlag!.werte.adresse).toBe('Marienplatz, 80331 München, Deutschland')
    expect(vorschlag!.anzeige).toBe(vorschlag!.werte.adresse)
  })

  it('setzt die Adresse aus street/housenumber statt aus name zusammen, wenn eine Straße vorhanden ist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      photonAntwort([
        photonFeature({
          name: 'Irrelevanter POI-Name',
          street: 'Hauptstraße',
          housenumber: '1',
          city: 'Berlin',
          postcode: '10317',
          country: 'Deutschland',
        }),
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const ergebnis = await sucheOrt('Hauptstraße 1 Berlin', new AbortController().signal)

    expect(ergebnis.status).toBe('treffer')
    if (ergebnis.status !== 'treffer') throw new Error('unerwarteter Status')
    expect(ergebnis.vorschlaege[0]!.werte.adresse).toBe('Hauptstraße 1, 10317 Berlin, Deutschland')
  })

  it('liefert "keine_treffer" bei einer leeren FeatureCollection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(photonAntwort([])))

    const ergebnis = await sucheOrt('xyzxyzxyz', new AbortController().signal)

    expect(ergebnis).toEqual({ status: 'keine_treffer' })
  })

  it('liefert "kein_netz", ohne überhaupt eine Anfrage zu senden, wenn navigator.onLine false ist', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const ergebnis = await sucheOrt('münchen', new AbortController().signal)

    expect(ergebnis).toEqual({ status: 'kein_netz' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('liefert "fehler" statt eine Ausnahme zu werfen, wenn die Antwort nicht ok ist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))

    const ergebnis = await sucheOrt('münchen', new AbortController().signal)

    expect(ergebnis).toEqual({ status: 'fehler' })
  })

  it('liefert "fehler" statt eine Ausnahme zu werfen, wenn fetch ablehnt (z. B. Netzwerkfehler mitten in der Anfrage)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const ergebnis = await sucheOrt('münchen', new AbortController().signal)

    expect(ergebnis).toEqual({ status: 'fehler' })
  })

  it('bricht bei einer externen Signal-Abbruchmeldung ab und gibt das Fetch-Signal als abgebrochen weiter', async () => {
    let weitergereichtesSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_url: unknown, init: { signal: AbortSignal }) => {
      weitergereichtesSignal = init.signal
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Abgebrochen', 'AbortError')))
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const aussenController = new AbortController()
    const ergebnisPromise = sucheOrt('münchen', aussenController.signal)
    aussenController.abort()

    const ergebnis = await ergebnisPromise

    expect(ergebnis).toEqual({ status: 'fehler' })
    expect(weitergereichtesSignal?.aborted).toBe(true)
  })

  it('bricht nach Zeitüberschreitung selbstständig ab, auch ohne äußeren Abbruch', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url: unknown, init: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Abgebrochen', 'AbortError')))
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const ergebnisPromise = sucheOrt('münchen', new AbortController().signal)
    await vi.advanceTimersByTimeAsync(8000)

    const ergebnis = await ergebnisPromise
    expect(ergebnis).toEqual({ status: 'fehler' })
  })
})

describe('erstelleOrtssucheClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('sucht nicht unterhalb der Mindestlänge — keine Anfrage, sofortiger Zustand "inaktiv"', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const zustaende: OrtssucheZustand[] = []
    const client = erstelleOrtssucheClient((zustand) => zustaende.push(zustand))

    client.sucheEingabe('ab')
    client.sucheEingabe('  ')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(zustaende).toEqual([{ status: 'inaktiv' }, { status: 'inaktiv' }])
  })

  it('entprellt nach der letzten Eingabe (300ms) statt bei jedem Tastendruck zu suchen', async () => {
    const fetchMock = vi.fn().mockResolvedValue(photonAntwort([photonFeature()]))
    vi.stubGlobal('fetch', fetchMock)
    const client = erstelleOrtssucheClient(() => {})

    client.sucheEingabe('mün')
    client.sucheEingabe('münc')
    client.sucheEingabe('münch')
    await vi.advanceTimersByTimeAsync(299)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0].toString()).toContain('q=m%C3%BCnch')
  })

  it('zeigt "laedt", wenn eine Anfrage spürbar länger als 400ms dauert', async () => {
    let freigeben: (() => void) | undefined
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          freigeben = () => resolve(photonAntwort([photonFeature()]))
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const zustaende: OrtssucheZustand[] = []
    const client = erstelleOrtssucheClient((zustand) => zustaende.push(zustand))

    client.sucheEingabe('münchen')
    await vi.advanceTimersByTimeAsync(300) // Debounce löst die Anfrage aus
    await vi.advanceTimersByTimeAsync(399)
    expect(zustaende).toEqual([])

    await vi.advanceTimersByTimeAsync(1)
    expect(zustaende).toEqual([{ status: 'laedt' }])

    freigeben?.()
    await vi.runOnlyPendingTimersAsync()
    expect(zustaende.at(-1)).toEqual({ status: 'treffer', vorschlaege: expect.any(Array) })
  })

  it('bricht eine laufende Anfrage ab, sobald eine neue Suche startet', async () => {
    const signale: AbortSignal[] = []
    const fetchMock = vi.fn((_url: unknown, init: { signal: AbortSignal }) => {
      signale.push(init.signal)
      return new Promise(() => {}) // löst nie auf, nur der Abbruch zählt hier
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = erstelleOrtssucheClient(() => {})

    client.sucheEingabe('münchen')
    await vi.advanceTimersByTimeAsync(300)
    expect(signale).toHaveLength(1)
    expect(signale[0]!.aborted).toBe(false)

    client.sucheEingabe('münchenberg')
    await vi.advanceTimersByTimeAsync(300)
    expect(signale).toHaveLength(2)
    expect(signale[0]!.aborted).toBe(true)
  })

  it('verwirft eine Antwort, die verspätet in falscher Reihenfolge eintrifft', async () => {
    const antworten: Array<{ resolve: (r: Response) => void }> = []
    const fetchMock = vi.fn(() => {
      return new Promise<Response>((resolve) => {
        antworten.push({ resolve })
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const zustaende: OrtssucheZustand[] = []
    const client = erstelleOrtssucheClient((zustand) => zustaende.push(zustand))

    client.sucheEingabe('münchen')
    await vi.advanceTimersByTimeAsync(300)
    client.sucheEingabe('münchenberg')
    await vi.advanceTimersByTimeAsync(300)
    expect(antworten).toHaveLength(2)

    // Die JÜNGERE Anfrage (münchenberg) antwortet zuerst, die ÄLTERE
    // (münchen) erst danach — die ältere, verspätete Antwort darf keinen
    // Zustand mehr auslösen (ADR-0020 Punkt 3).
    antworten[1]!.resolve(photonAntwort([]))
    await vi.runOnlyPendingTimersAsync()
    antworten[0]!.resolve(photonAntwort([photonFeature()]))
    await vi.runOnlyPendingTimersAsync()

    expect(zustaende).toEqual([{ status: 'keine_treffer' }])
  })

  it('löst bei unverändert wiederholtem Suchtext keine neue Anfrage aus, sondern gibt die letzte Antwort zurück', async () => {
    const fetchMock = vi.fn().mockResolvedValue(photonAntwort([photonFeature()]))
    vi.stubGlobal('fetch', fetchMock)
    const zustaende: OrtssucheZustand[] = []
    const client = erstelleOrtssucheClient((zustand) => zustaende.push(zustand))

    client.sucheEingabe('münchen')
    await vi.advanceTimersByTimeAsync(300)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const ersteAntwort = zustaende.at(-1)

    client.sucheEingabe('münchen')
    await vi.advanceTimersByTimeAsync(300)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(zustaende.at(-1)).toEqual(ersteAntwort)
  })
})
