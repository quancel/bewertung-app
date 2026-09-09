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
