import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import { speichereOrt, loescheOrt, ladeAlleOrte } from './orte-repository'
import type { OrtDatensatz } from './schema'

function beispielOrt(teil: Partial<OrtDatensatz> = {}): OrtDatensatz {
  return {
    id: 'ort-1',
    bezeichnung: 'Café Sonnenschein',
    adresse: null,
    breite: null,
    laenge: null,
    geaendertAm: '2026-09-08T10:00:00.000Z',
    ...teil,
  }
}

/** Leert alle Stores, statt die Datenbank zu löschen (vermeidet das
 * `blocked`-Event von `deleteDatabase`, solange eine Verbindung offen ist). */
async function raeumeStoresAuf(): Promise<void> {
  resetDb()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('meta')
  await geoeffnet.db.clear('orte')
  await geoeffnet.db.clear('einstellungen')
}

describe('orte-repository', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('liefert eine leere Liste aus einer frischen Datenbank', async () => {
    const ergebnis = await ladeAlleOrte()

    expect(ergebnis).toEqual({ status: 'geladen', orte: [] })
  })

  it('speichert einen Ort vollständig und lädt ihn unverändert zurück', async () => {
    const ort = beispielOrt()

    const schreibErgebnis = await speichereOrt(ort)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis).toEqual({ status: 'geladen', orte: [ort] })
  })

  it('serialisiert angestaute Schreibvorgänge je Ort-ID — der letzte Stand gewinnt', async () => {
    const ersterLauf = speichereOrt(beispielOrt({ bezeichnung: 'Erster Stand' }))
    const zweiterLauf = speichereOrt(beispielOrt({ bezeichnung: 'Zweiter Stand' }))

    await Promise.all([ersterLauf, zweiterLauf])

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis.status).toBe('geladen')
    if (ladeErgebnis.status === 'geladen') {
      expect(ladeErgebnis.orte).toHaveLength(1)
      expect(ladeErgebnis.orte[0]?.bezeichnung).toBe('Zweiter Stand')
    }
  })

  it('löscht einen Ort — danach ist er nicht mehr in der Liste', async () => {
    const ort = beispielOrt()
    await speichereOrt(ort)

    const loeschErgebnis = await loescheOrt(ort.id)
    expect(loeschErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis).toEqual({ status: 'geladen', orte: [] })
  })

  it('meldet "speicher_nicht_verfuegbar", wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await ladeAlleOrte()
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })
})
