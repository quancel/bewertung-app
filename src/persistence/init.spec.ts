import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import { initialisiereBestand, _resetFuerTests as resetInit } from './init'

async function raeumeStoresAuf(): Promise<void> {
  resetDb()
  resetInit()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('meta')
  await geoeffnet.db.clear('orte')
  await geoeffnet.db.clear('einstellungen')
  await geoeffnet.db.clear('bilder')
  resetDb()
  resetInit()
}

describe('initialisiereBestand', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('legt bei einer leeren Datenbank den aktuellen Bestand an (Erststart, keine Migration)', async () => {
    const ergebnis = await initialisiereBestand()
    expect(ergebnis).toEqual({ status: 'bereit' })

    const geoeffnet = await oeffneDatenbank()
    if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
    const meta = await geoeffnet.db.get('meta', 'bestand')
    expect(meta).toEqual({ id: 'bestand', schemaVersion: 4 })
  })

  it('lässt einen Bestand mit aktueller Version unverändert', async () => {
    await initialisiereBestand()
    resetInit()
    const ergebnisZweiterStart = await initialisiereBestand()

    expect(ergebnisZweiterStart).toEqual({ status: 'bereit' })
    const geoeffnet = await oeffneDatenbank()
    if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
    const meta = await geoeffnet.db.get('meta', 'bestand')
    expect(meta).toEqual({ id: 'bestand', schemaVersion: 4 })
  })

  it('lehnt einen Bestand mit unbekannter, neuerer Version ab und überschreibt nichts', async () => {
    const geoeffnet = await oeffneDatenbank()
    if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
    await geoeffnet.db.put('meta', { id: 'bestand', schemaVersion: 99 })
    await geoeffnet.db.put('orte', {
      id: 'ort-1',
      bezeichnung: 'Bleibt unangetastet',
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
    })

    const ergebnis = await initialisiereBestand()

    expect(ergebnis).toEqual({ status: 'version_zu_neu' })
    const metaNachher = await geoeffnet.db.get('meta', 'bestand')
    expect(metaNachher).toEqual({ id: 'bestand', schemaVersion: 99 })
    const orteNachher = await geoeffnet.db.getAll('orte')
    expect(orteNachher).toHaveLength(1)
  })

  it('meldet "speicher_nicht_verfuegbar", wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await initialisiereBestand()
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
    }
  })
})
