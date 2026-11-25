// @vitest-environment jsdom
/**
 * Component-Spec für `Bildstreifen.vue` (PO-2026-11-24-005, ADR-0039 Punkt 6):
 * ohne Bilder rendert er NICHTS (kein Platzhalter, keine Lücke), mit Bildern
 * eine Kachel je Bild mit „Bild {n} von {m} vergrößern". Layout und das
 * Öffnen der Vorschau (Verlaufseintrag) sind Sache des Rauchtests.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Bildstreifen from './Bildstreifen.vue'

const BILDER = [
  { id: 'b2', ortId: 'o1', hinzugefuegtAm: '2026-01-02', mimeTyp: 'image/png', breite: 1, hoehe: 1, blob: new Blob(['b']) },
  { id: 'b1', ortId: 'o1', hinzugefuegtAm: '2026-01-01', mimeTyp: 'image/png', breite: 1, hoehe: 1, blob: new Blob(['a']) },
]

// Der Store liest über das Repository; hier ersetzt, damit kein IndexedDB-Bestand nötig ist.
vi.mock('../../../persistence/bilder-repository', () => ({
  ladeBilderFuerOrt: async (ortId: string) => ({ status: 'geladen', bilder: ortId === 'o1' ? BILDER : [] }),
  speichereBild: vi.fn(),
  loescheBild: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), currentRoute: { value: { path: '/', query: {}, hash: '' } } }) }))

beforeEach(() => {
  setActivePinia(createPinia())
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})

describe('Bildstreifen', () => {
  it('rendert ohne Bilder nichts', async () => {
    const wrapper = mount(Bildstreifen, { props: { ortId: 'leer' } })
    await flushPromises()
    expect(wrapper.find('.bildstreifen').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('streifenkachel')
  })

  it('zeigt eine Kachel je Bild in Rasterreihenfolge (nach Datum), benannt „Bild n von m vergrößern"', async () => {
    const wrapper = mount(Bildstreifen, { props: { ortId: 'o1', bezeichnung: 'Ort' } })
    await flushPromises()
    const kacheln = wrapper.findAll('.streifenkachel')
    expect(kacheln.map((k) => k.attributes('aria-label'))).toEqual(['Bild 1 von 2 vergrößern', 'Bild 2 von 2 vergrößern'])
    expect(kacheln.map((k) => k.attributes('data-bild-id'))).toEqual(['b1', 'b2'])
  })
})
