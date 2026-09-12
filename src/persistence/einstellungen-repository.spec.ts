import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import { ladeEinstellung, schreibeEinstellung } from './einstellungen-repository'

/** Leert den Store, statt die Datenbank zu löschen (vermeidet das
 * `blocked`-Event von `deleteDatabase`, solange eine Verbindung offen ist). */
async function raeumeStoreAuf(): Promise<void> {
  resetDb()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('einstellungen')
}

describe('einstellungen-repository', () => {
  beforeEach(async () => {
    await raeumeStoreAuf()
  })

  afterEach(async () => {
    await raeumeStoreAuf()
  })

  it('meldet einen fehlenden Schlüssel als "nicht_vorhanden", nicht als Fehler', async () => {
    const ergebnis = await ladeEinstellung('orte.sortierung')

    expect(ergebnis).toEqual({ status: 'nicht_vorhanden' })
  })

  it('schreibt einen strukturierten Wert und liest ihn unverändert zurück', async () => {
    const wert = { kriterium: 'geaendertAm', richtung: 'absteigend' }

    const schreibErgebnis = await schreibeEinstellung('orte.sortierung', wert)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeEinstellung('orte.sortierung')
    expect(ladeErgebnis).toEqual({ status: 'geladen', wert })
  })

  it('überschreibt einen bestehenden Wert unter demselben Schlüssel', async () => {
    await schreibeEinstellung('orte.sortierung', { kriterium: 'bezeichnung', richtung: 'aufsteigend' })
    await schreibeEinstellung('orte.sortierung', { kriterium: 'gesamtnote', richtung: 'absteigend' })

    const ergebnis = await ladeEinstellung('orte.sortierung')
    expect(ergebnis).toEqual({
      status: 'geladen',
      wert: { kriterium: 'gesamtnote', richtung: 'absteigend' },
    })
  })

  it('hält zwei Schlüssel unabhängig voneinander auseinander', async () => {
    await schreibeEinstellung('orte.sortierung', { kriterium: 'bezeichnung', richtung: 'aufsteigend' })
    await schreibeEinstellung('orte.tagfilter', { modus: 'und' })

    expect(await ladeEinstellung('orte.sortierung')).toEqual({
      status: 'geladen',
      wert: { kriterium: 'bezeichnung', richtung: 'aufsteigend' },
    })
    expect(await ladeEinstellung('orte.tagfilter')).toEqual({
      status: 'geladen',
      wert: { modus: 'und' },
    })
  })

  it('schreibt einen Wert, wie ihn der Pinia-Store tatsächlich übergibt — als reaktives Objekt (ADR-0023 Punkt 3, PO-2026-09-12-001)', async () => {
    // `useOrteStore.sortierung`/`.tagfilterEinstellung` sind `ref`s auf ein
    // Objekt; `schreibeEinstellung(SCHLUESSEL, sortierung.value)` übergibt im
    // Betrieb deshalb ein reaktives Objekt, keinen Plain Object Literal.
    const reaktiverWert = reactive({ kriterium: 'geaendertAm', richtung: 'absteigend' })

    const schreibErgebnis = await schreibeEinstellung('orte.sortierung', reaktiverWert)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeEinstellung('orte.sortierung')
    expect(ladeErgebnis).toEqual({
      status: 'geladen',
      wert: { kriterium: 'geaendertAm', richtung: 'absteigend' },
    })
  })

  it('meldet "speicher_nicht_verfuegbar" beim Lesen, wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await ladeEinstellung('orte.sortierung')
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })

  it('meldet "fehlgeschlagen" beim Schreiben, wenn die Datenbank nicht geöffnet werden kann — bricht aber nichts ab', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await schreibeEinstellung('orte.sortierung', { kriterium: 'bezeichnung', richtung: 'aufsteigend' })
      expect(ergebnis).toEqual({ status: 'fehlgeschlagen' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })
})
