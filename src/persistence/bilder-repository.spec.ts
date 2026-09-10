import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import { ladeBilderFuerOrt, loescheBild, speichereBild } from './bilder-repository'
import type { BildDatensatz } from './schema'

function beispielBild(teil: Partial<BildDatensatz> = {}): BildDatensatz {
  return {
    id: 'bild-1',
    ortId: 'ort-1',
    hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
    mimeTyp: 'image/webp',
    breite: 800,
    hoehe: 600,
    blob: new Blob(['x'], { type: 'image/webp' }),
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
  await geoeffnet.db.clear('bilder')
}

describe('bilder-repository', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('liefert eine leere Liste für einen Ort ohne Bilder', async () => {
    const ergebnis = await ladeBilderFuerOrt('ort-1')

    expect(ergebnis).toEqual({ status: 'geladen', bilder: [] })
  })

  it('speichert ein Bild vollständig und lädt es über den ortId-Index unverändert zurück', async () => {
    const bild = beispielBild()

    const schreibErgebnis = await speichereBild(bild)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeBilderFuerOrt('ort-1')
    expect(ladeErgebnis).toEqual({ status: 'geladen', bilder: [bild] })
  })

  it('der ortId-Index liefert nur die Bilder des angefragten Ortes, andere bleiben außen vor', async () => {
    await speichereBild(beispielBild({ id: 'bild-a', ortId: 'ort-a' }))
    await speichereBild(beispielBild({ id: 'bild-b', ortId: 'ort-b' }))

    const ergebnisA = await ladeBilderFuerOrt('ort-a')
    expect(ergebnisA.status).toBe('geladen')
    if (ergebnisA.status === 'geladen') {
      expect(ergebnisA.bilder.map((bild) => bild.id)).toEqual(['bild-a'])
    }
  })

  it('löscht ein Bild — danach ist es nicht mehr in der Liste des Ortes', async () => {
    const bild = beispielBild()
    await speichereBild(bild)

    const loeschErgebnis = await loescheBild(bild.id)
    expect(loeschErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeBilderFuerOrt('ort-1')
    expect(ladeErgebnis).toEqual({ status: 'geladen', bilder: [] })
  })

  it('löscht genau ein Bild, andere Bilder desselben Ortes bleiben erhalten', async () => {
    await speichereBild(beispielBild({ id: 'bild-1' }))
    await speichereBild(beispielBild({ id: 'bild-2' }))

    await loescheBild('bild-1')

    const ladeErgebnis = await ladeBilderFuerOrt('ort-1')
    expect(ladeErgebnis.status).toBe('geladen')
    if (ladeErgebnis.status === 'geladen') {
      expect(ladeErgebnis.bilder.map((bild) => bild.id)).toEqual(['bild-2'])
    }
  })

  it('meldet "speicher_nicht_verfuegbar", wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await ladeBilderFuerOrt('ort-1')
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })
})
