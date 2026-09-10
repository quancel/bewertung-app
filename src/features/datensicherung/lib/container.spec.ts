import { describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { entpackeBestand, packeBestand, type BestandContainerDaten } from './container'
import type { OrtDatensatz } from '../../../persistence/schema'

function beispielOrt(teil: Partial<OrtDatensatz> = {}): OrtDatensatz {
  return {
    id: 'ort-1',
    bezeichnung: 'Café Sonnenschein',
    adresse: null,
    breite: null,
    laenge: null,
    geaendertAm: '2026-09-08T10:00:00.000Z',
    bewertungen: {
      ambiente: { wert: null, kommentar: null },
      zeit: { wert: null, kommentar: null },
      geschmack: { wert: null, kommentar: null },
      preisLeistung: { wert: null, kommentar: null },
    },
    tags: [],
    ...teil,
  }
}

function bestandMitBild(): BestandContainerDaten {
  return {
    schemaVersion: 4,
    orte: [beispielOrt()],
    bilder: [
      {
        id: 'bild-1',
        ortId: 'ort-1',
        hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
        mimeTyp: 'image/webp',
        breite: 4,
        hoehe: 4,
        blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/webp' }),
      },
    ],
  }
}

async function blobBytes(blob: Blob): Promise<number[]> {
  return Array.from(new Uint8Array(await blob.arrayBuffer()))
}

describe('container (pack/entpack)', () => {
  it('packt und entpackt einen Bestand samt Bild verlustfrei', async () => {
    const bestand = bestandMitBild()

    const gepackt = await packeBestand(bestand)
    const entpackt = await entpackeBestand(gepackt)

    expect(entpackt.status).toBe('ok')
    if (entpackt.status !== 'ok') return
    expect(entpackt.bestand.schemaVersion).toBe(4)
    expect(entpackt.bestand.orte).toEqual(bestand.orte)
    expect(entpackt.bestand.bilder).toHaveLength(1)
    expect(entpackt.bestand.bilder[0]?.id).toBe('bild-1')
    expect(entpackt.bestand.bilder[0]?.mimeTyp).toBe('image/webp')
    await expect(blobBytes(entpackt.bestand.bilder[0]!.blob)).resolves.toEqual([1, 2, 3, 4])
  })

  it('meldet "beschaedigt" bei einem kaputten ZIP', async () => {
    const kaputterContainer = new Blob([new Uint8Array([1, 2, 3])])

    const ergebnis = await entpackeBestand(kaputterContainer)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('meldet "beschaedigt", wenn `bestand.json` fehlt', async () => {
    const gepackt = zipSync({ 'irgendwas.txt': strToU8('kein bestand.json') })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('meldet "beschaedigt" bei fehlender oder falscher formatKennung', async () => {
    const gepackt = zipSync({
      'bestand.json': strToU8(JSON.stringify({ formatKennung: 'fremdes-format', schemaVersion: 4, orte: [] })),
    })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('meldet "beschaedigt" bei fehlendem schemaVersion', async () => {
    const gepackt = zipSync({
      'bestand.json': strToU8(JSON.stringify({ formatKennung: 'bewertung-app-bestand', orte: [] })),
    })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('meldet "beschaedigt", wenn ein Bildeintrag ohne Metadatensatz vorliegt', async () => {
    const gepackt = zipSync({
      'bestand.json': strToU8(JSON.stringify({ formatKennung: 'bewertung-app-bestand', schemaVersion: 4, orte: [], bilder: [] })),
      'bilder/verwaist': new Uint8Array([1]),
    })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('meldet "beschaedigt", wenn ein Metadatensatz ohne Bildeintrag vorliegt', async () => {
    const gepackt = zipSync({
      'bestand.json': strToU8(
        JSON.stringify({
          formatKennung: 'bewertung-app-bestand',
          schemaVersion: 4,
          orte: [],
          bilder: [
            {
              id: 'fehlt',
              ortId: 'ort-1',
              hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
              mimeTyp: 'image/webp',
              breite: 4,
              hoehe: 4,
            },
          ],
        }),
      ),
    })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis).toEqual({ status: 'beschaedigt' })
  })

  it('akzeptiert einen Container ohne `bilder`-Feld (Format vor PO-2026-09-07-005)', async () => {
    const gepackt = zipSync({
      'bestand.json': strToU8(
        JSON.stringify({ formatKennung: 'bewertung-app-bestand', schemaVersion: 1, orte: [beispielOrt()] }),
      ),
    })
    const container = new Blob([gepackt as BlobPart])

    const ergebnis = await entpackeBestand(container)

    expect(ergebnis.status).toBe('ok')
    if (ergebnis.status !== 'ok') return
    expect(ergebnis.bestand.bilder).toEqual([])
  })
})
