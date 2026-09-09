import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ladeAlleOrteMock, speichereOrtMock, loescheOrtMock } = vi.hoisted(() => ({
  ladeAlleOrteMock: vi.fn(),
  speichereOrtMock: vi.fn(),
  loescheOrtMock: vi.fn(),
}))

vi.mock('../../../persistence/orte-repository', () => ({
  ladeAlleOrte: ladeAlleOrteMock,
  speichereOrt: speichereOrtMock,
  loescheOrt: loescheOrtMock,
}))

import { useOrteStore } from './orte.store'

describe('useOrteStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ladeAlleOrteMock.mockReset()
    speichereOrtMock.mockReset()
    loescheOrtMock.mockReset()
    speichereOrtMock.mockResolvedValue({ status: 'geschrieben' })
    loescheOrtMock.mockResolvedValue({ status: 'geschrieben' })
  })

  it('lädt einmalig und liest bei erneutem Aufruf nicht erneut', async () => {
    ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
    const store = useOrteStore()

    await store.sicherstellenGeladen()
    await store.sicherstellenGeladen()

    expect(ladeAlleOrteMock).toHaveBeenCalledTimes(1)
  })

  it('legt einen Ort mit ausschließlich der Bezeichnung an und persistiert ihn vollständig', async () => {
    const store = useOrteStore()

    const neuerOrt = await store.legeOrtAn('Café Sonnenschein')

    expect(neuerOrt.bezeichnung).toBe('Café Sonnenschein')
    expect(neuerOrt.adresse).toBeNull()
    expect(neuerOrt.breite).toBeNull()
    expect(neuerOrt.laenge).toBeNull()
    expect(store.orte).toHaveLength(1)
    expect(speichereOrtMock).toHaveBeenCalledWith(neuerOrt)
  })

  it('aktualisiereFeld ändert nur den Arbeitsspeicher, kein Schreibvorgang', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    speichereOrtMock.mockClear()

    store.aktualisiereFeld(ort.id, { adresse: 'Musterstraße 1' })

    expect(store.ortNachId(ort.id)?.adresse).toBe('Musterstraße 1')
    expect(speichereOrtMock).not.toHaveBeenCalled()
  })

  it('persistiereOrt schreibt den vollständigen aktuellen Stand aus dem Store', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    store.aktualisiereFeld(ort.id, { breite: 52.5, laenge: 13.4 })
    speichereOrtMock.mockClear()

    await store.persistiereOrt(ort.id)

    expect(speichereOrtMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: ort.id, breite: 52.5, laenge: 13.4 }),
    )
  })

  it('meldet einen fehlgeschlagenen Schreibvorgang sichtbar über den Store', async () => {
    speichereOrtMock.mockResolvedValueOnce({ status: 'geschrieben' })
    speichereOrtMock.mockResolvedValueOnce({
      status: 'schreiben_fehlgeschlagen',
      grund: 'speicher_voll',
    })
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    await store.persistiereOrt(ort.id)

    expect(store.schreibfehlerFuer(ort.id).value).toBe('speicher_voll')
  })

  it('legt einen neuen Ort mit allen vier Achsen aktiv als „nicht bewertet" an', async () => {
    const store = useOrteStore()

    const neuerOrt = await store.legeOrtAn('Ausgangsname')

    expect(neuerOrt.bewertungen).toEqual({
      ambiente: { wert: null, kommentar: null },
      zeit: { wert: null, kommentar: null },
      geschmack: { wert: null, kommentar: null },
      preisLeistung: { wert: null, kommentar: null },
    })
  })

  it('aktualisiereAchse setzt einen Achsenwert, ohne den Kommentar zu berühren', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 0 })

    expect(store.ortNachId(ort.id)?.bewertungen.ambiente).toEqual({ wert: 0, kommentar: null })
  })

  it('aktualisiereAchse setzt beim Zurücksetzen ausschließlich den Wert auf null — der Kommentar bleibt erhalten', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 8, kommentar: 'Sehr gemütlich' })

    store.aktualisiereAchse(ort.id, 'ambiente', { wert: null })

    expect(store.ortNachId(ort.id)?.bewertungen.ambiente).toEqual({
      wert: null,
      kommentar: 'Sehr gemütlich',
    })
  })

  it('aktualisiereAchse ändert nur die betroffene Achse, die übrigen bleiben unverändert', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    store.aktualisiereAchse(ort.id, 'zeit', { wert: 5 })

    const bewertungen = store.ortNachId(ort.id)?.bewertungen
    expect(bewertungen?.zeit).toEqual({ wert: 5, kommentar: null })
    expect(bewertungen?.ambiente).toEqual({ wert: null, kommentar: null })
    expect(bewertungen?.geschmack).toEqual({ wert: null, kommentar: null })
    expect(bewertungen?.preisLeistung).toEqual({ wert: null, kommentar: null })
  })

  it('aktualisiereAchse aktualisiert geaendertAm', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    const vorher = store.ortNachId(ort.id)?.geaendertAm

    await new Promise((resolve) => setTimeout(resolve, 2))
    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 4 })

    expect(store.ortNachId(ort.id)?.geaendertAm).not.toBe(vorher)
  })

  it('löscht einen Ort nur nach erfolgreichem Schreibvorgang aus dem Store', async () => {
    loescheOrtMock.mockResolvedValueOnce({
      status: 'schreiben_fehlgeschlagen',
      grund: 'unbekannt',
    })
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Wird gelöscht')

    const erfolgFehlgeschlagen = await store.loescheOrt(ort.id)
    expect(erfolgFehlgeschlagen).toBe(false)
    expect(store.ortNachId(ort.id)).toBeDefined()

    loescheOrtMock.mockResolvedValueOnce({ status: 'geschrieben' })
    const erfolg = await store.loescheOrt(ort.id)
    expect(erfolg).toBe(true)
    expect(store.ortNachId(ort.id)).toBeUndefined()
  })
})
