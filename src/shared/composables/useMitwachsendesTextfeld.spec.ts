// @vitest-environment jsdom
/**
 * Component-Spec für `useMitwachsendesTextfeld.ts` (PO-2026-09-27-001).
 * jsdom hat kein Layout (`scrollHeight`/`clientHeight`/`getBoundingClientRect`
 * liefern konstant 0) und implementiert `ResizeObserver` nicht (ADR-0027,
 * code-conventions.md „Nicht in jsdom zusichern: Sichtbarkeit …") — eine
 * Höhen- oder Sichtbarkeitszusicherung gehört deshalb in den Rauchtest, nicht
 * hierher. Gegenstand dieser Spec ist ausschließlich der Ab- und Aufbau von
 * `ResizeObserver` und nativem `input`-Listener über den Lebenszyklus des
 * gebundenen Feldes (Mount, Feldwechsel, Unmount) — die einzige Eigenschaft,
 * die sich ohne echtes Layout sinnvoll und dauerhaft zusichern lässt.
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { useMitwachsendesTextfeld } from './useMitwachsendesTextfeld'

class FakeResizeObserver {
  static instanzen: FakeResizeObserver[] = []
  beobachtet: Element[] = []
  getrennt = false

  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instanzen.push(this)
  }

  observe(ziel: Element): void {
    this.beobachtet.push(ziel)
  }

  unobserve(ziel: Element): void {
    this.beobachtet = this.beobachtet.filter((el) => el !== ziel)
  }

  disconnect(): void {
    this.getrennt = true
  }
}

const TestKomponente = defineComponent({
  props: {
    offen: { type: Boolean, default: true },
  },
  setup(props) {
    const feldRef = ref<HTMLTextAreaElement | null>(null)
    const wertRef = ref('')
    useMitwachsendesTextfeld(feldRef, wertRef)
    return { feldRef, wertRef, props }
  },
  template: `<textarea v-if="offen" ref="feldRef" v-model="wertRef" />`,
})

describe('useMitwachsendesTextfeld — Auf-/Abbau von Observer und Listener', () => {
  let ungetrenntesGlobalResizeObserver: typeof ResizeObserver | undefined

  beforeEach(() => {
    FakeResizeObserver.instanzen = []
    ungetrenntesGlobalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = FakeResizeObserver
  })

  afterEach(() => {
    globalThis.ResizeObserver = ungetrenntesGlobalResizeObserver as typeof ResizeObserver
  })

  it('beobachtet das Feld nach dem Mount und trennt beim Unmount', async () => {
    const wrapper = mount(TestKomponente)
    // `flush: 'post'` (s. Composable-Kommentar) — auch der `immediate`-Aufruf
    // wartet auf den nächsten Tick, bevor `feldRef.value` ausgewertet wird.
    await nextTick()
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement

    expect(FakeResizeObserver.instanzen).toHaveLength(1)
    const beobachter = FakeResizeObserver.instanzen[0]
    expect(beobachter.beobachtet).toContain(feld)
    expect(beobachter.getrennt).toBe(false)

    const entferneListener = vi.spyOn(feld, 'removeEventListener')

    wrapper.unmount()

    expect(beobachter.getrennt).toBe(true)
    expect(entferneListener).toHaveBeenCalledWith('input', expect.any(Function))
  })

  it('trennt den Observer des alten Feldes, sobald es aus dem DOM verschwindet', async () => {
    const wrapper = mount(TestKomponente, { props: { offen: true } })
    await nextTick()
    expect(FakeResizeObserver.instanzen).toHaveLength(1)
    const ersterBeobachter = FakeResizeObserver.instanzen[0]
    expect(ersterBeobachter.getrennt).toBe(false)

    await wrapper.setProps({ offen: false })

    expect(ersterBeobachter.getrennt).toBe(true)
  })
})
