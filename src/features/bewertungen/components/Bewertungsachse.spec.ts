// @vitest-environment jsdom
/**
 * Component-Spec für den Emit-Vertrag von `Bewertungsachse.vue` (ADR-0027,
 * PO-2026-09-13-001, erweitert um ADR-0035/PO-2026-09-27-004) — nicht für
 * Sichtbarkeit/Trefferfläche/`accent-color`, die bleiben dem Rauchtest
 * vorbehalten (ADR-0027 Punkt 4).
 *
 * Gegenstand: welches Ereignis am Regler-Handler löst welches Emit aus, und
 * seit ADR-0035 zusätzlich der Vertrag von `uebernimmOffeneEingabe`. Der
 * erste Fall schlägt gegen den Stand vor PO-2026-09-13-001 nachweislich
 * fehl — dort schrieb `aufReglerTippen` nur den lokalen Textzustand und
 * emittierte nie.
 *
 * `FakeResizeObserver` (Vorbild `useMitwachsendesTextfeld.spec.ts`): jsdom
 * kennt `ResizeObserver` nicht — sobald ein Test das Kommentarfeld öffnet,
 * bindet `useMitwachsendesTextfeld` einen echten `ResizeObserver`, der ohne
 * diesen Ersatz mit `ReferenceError` abbricht. Höhen-/Layout-Zusicherungen
 * sind hier trotzdem nicht Gegenstand (bleiben dem Rauchtest vorbehalten).
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Bewertungsachse from './Bewertungsachse.vue'

class FakeResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

let ungetrenntesGlobalResizeObserver: typeof ResizeObserver | undefined

beforeEach(() => {
  ungetrenntesGlobalResizeObserver = globalThis.ResizeObserver
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  globalThis.ResizeObserver = ungetrenntesGlobalResizeObserver as typeof ResizeObserver
})

function mounten(wert: number | null = null) {
  return mount(Bewertungsachse, {
    props: {
      achseName: 'ambiente',
      label: 'Ambiente',
      wert,
      kommentar: null,
    },
  })
}

describe('Bewertungsachse — Regler-Commit (PO-2026-09-13-001)', () => {
  it('ein einzelnes input-Ereignis am Regler erzeugt genau ein wert-geaendert mit dem Wert', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')
    const element = regler.element as HTMLInputElement

    // Bewusst NUR `input` triggern, nicht `setValue()` (das feuert
    // zusätzlich `change`, ADR-0027: gegen den Vor-Korrektur-Stand wäre ein
    // Test, der beide Ereignisse feuert, wertlos — dort committete `change`
    // bereits, nur `input` schrieb ausschließlich den lokalen Textzustand).
    element.value = '7'
    await regler.trigger('input')

    const emits = wrapper.emitted('wert-geaendert')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual([7])
  })

  it('eine Zeigerbedienung ohne Wertänderung im Zustand null erzeugt wert-geaendert mit 0', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')

    // Der Regler steht optisch bereits auf 0 (`:value="wert ?? 0"`), ein
    // Tipp auf das linke Bahnende ändert den nativen Wert deshalb NICHT —
    // kein `input`-Ereignis. Nur der `pointerup`-Pfad kann diesen Fall
    // committen.
    expect((regler.element as HTMLInputElement).value).toBe('0')
    await regler.trigger('pointerup')

    const emits = wrapper.emitted('wert-geaendert')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual([0])
  })

  it('eine Tastenbedienung ohne Wertänderung im Zustand null erzeugt wert-geaendert mit 0', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')

    await regler.trigger('keyup', { key: 'ArrowDown' })

    const emits = wrapper.emitted('wert-geaendert')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual([0])
  })

  it('eine irrelevante Taste (z. B. Tab) committet im Zustand null nichts', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')

    await regler.trigger('keyup', { key: 'Tab' })

    expect(wrapper.emitted('wert-geaendert')).toBeUndefined()
  })

  it('pointerup committet nichts mehr, sobald bereits ein Wert gesetzt ist', async () => {
    const wrapper = mounten(4)
    const regler = wrapper.find('input[type="range"]')

    await regler.trigger('pointerup')

    expect(wrapper.emitted('wert-geaendert')).toBeUndefined()
  })

  it('ein Nicht-Ganzzahl-/Bereichswert am Regler-Pfad kommt gerundet und geklemmt an', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')

    // jsdom klemmt/rundet `value` bei type="range" nicht selbst — genau der
    // Fall, den `rundenUndKlemmen` im Regler-Pfad abfangen muss (ADR-0007
    // Punkt 7, PO-2026-09-13-001).
    await regler.setValue('12.6')

    const emits = wrapper.emitted('wert-geaendert')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual([10])
  })

  it('Fokussieren allein erzeugt kein Emit', async () => {
    const wrapper = mounten(null)
    const regler = wrapper.find('input[type="range"]')

    await regler.trigger('focus')

    expect(wrapper.emitted('wert-geaendert')).toBeUndefined()
  })
})

describe('Bewertungsachse — Zahleneingabe (unverändert, ADR-0007)', () => {
  it('Leeren des Zahlenfeldes erzeugt wert-geaendert: null und kein kommentar-geaendert', async () => {
    const wrapper = mounten(6)
    const zahlenfeld = wrapper.find('input[type="number"]')

    // `setValue()` triggert bereits `input` UND `change` (@vue/test-utils) —
    // ein zusätzliches `trigger('change')` würde den Commit doppelt auslösen.
    await zahlenfeld.setValue('')

    expect(wrapper.emitted('wert-geaendert')).toEqual([[null]])
    expect(wrapper.emitted('kommentar-geaendert')).toBeUndefined()
  })
})

/**
 * `uebernimmOffeneEingabe` (PO-2026-09-27-004, ADR-0035): die eine
 * exponierte Methode, mit der `Ortebereich.vue` unbestätigte Entwürfe
 * dieser Achse bei einem externen Auslöser (Route verlassen,
 * `visibilitychange`→`hidden`, `pagehide`) abholt — synchron, ohne
 * `anlass`-Parameter, läuft durch die bestehenden Commit-Funktionen.
 */
describe('Bewertungsachse — uebernimmOffeneEingabe (PO-2026-09-27-004, ADR-0035)', () => {
  it('gibt einen offenen Zahl- UND Kommentar-Entwurf in einem Aufruf ab', async () => {
    const wrapper = mounten(null)
    const zahlenfeld = wrapper.find('input[type="number"]')
    ;(zahlenfeld.element as HTMLInputElement).value = '7'
    await zahlenfeld.trigger('input') // nur getippt, nicht committet (kein change/blur)

    const kommentarOeffnen = wrapper.findAll('button').find((btn) => btn.text() === 'Kommentar hinzufügen')
    await kommentarOeffnen?.trigger('click')
    await wrapper.find('textarea').setValue('Ein offener Kommentar')

    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')).toEqual([[7]])
    expect(wrapper.emitted('kommentar-geaendert')).toEqual([['Ein offener Kommentar']])
  })

  it('übernimmt einen offenen Zahlenwert gerundet und geklemmt', async () => {
    const wrapper = mounten(null)
    const zahlenfeld = wrapper.find('input[type="number"]')
    ;(zahlenfeld.element as HTMLInputElement).value = '12.6'
    await zahlenfeld.trigger('input') // nur getippt, nicht committet

    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')).toEqual([[10]])
  })

  it('ein geleertes Zahlenfeld ergibt wert-geaendert: null, nie kommentar-geaendert', async () => {
    const wrapper = mounten(6)
    const zahlenfeld = wrapper.find('input[type="number"]')
    ;(zahlenfeld.element as HTMLInputElement).value = ''
    await zahlenfeld.trigger('input')

    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')).toEqual([[null]])
    expect(wrapper.emitted('kommentar-geaendert')).toBeUndefined()
  })

  it('badInput (z. B. ein getipptes "-") erzeugt kein Emit', async () => {
    const wrapper = mounten(6)
    const zahlenfeld = wrapper.find('input[type="number"]')
    const element = zahlenfeld.element as HTMLInputElement
    // jsdom kennt `validity.badInput` nicht selbst — hier wie eine invalide
    // Zwischenkette ("-") simuliert, die der Browser als leer meldet, aber
    // als `badInput` markiert.
    element.value = ''
    Object.defineProperty(element, 'validity', {
      configurable: true,
      value: { badInput: true } as ValidityState,
    })

    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')).toBeUndefined()
  })

  it('zwei Aufrufe im selben Tick ohne neue Eingabe erzeugen höchstens ein Emit je Feld', async () => {
    const wrapper = mounten(null)
    await wrapper.find('input[type="number"]').setValue('4')
    const kommentarOeffnen = wrapper.findAll('button').find((btn) => btn.text() === 'Kommentar hinzufügen')
    await kommentarOeffnen?.trigger('click')
    await wrapper.find('textarea').setValue('Ein Kommentar')

    const vm = wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }
    vm.uebernimmOffeneEingabe()
    vm.uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')?.length).toBe(1)
    expect(wrapper.emitted('kommentar-geaendert')?.length).toBe(1)
  })

  it('ohne offenen Entwurf löst der Aufruf kein Emit aus', () => {
    const wrapper = mounten(5)
    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('wert-geaendert')).toBeUndefined()
    expect(wrapper.emitted('kommentar-geaendert')).toBeUndefined()
  })

  it('ruft nie aufZuruecksetzen auf — emittiert deshalb nie kommentar-geaendert', async () => {
    const wrapper = mounten(5)
    const zahlenfeld = wrapper.find('input[type="number"]')
    ;(zahlenfeld.element as HTMLInputElement).value = ''
    await zahlenfeld.trigger('input')

    ;(wrapper.vm as unknown as { uebernimmOffeneEingabe: () => void }).uebernimmOffeneEingabe()

    expect(wrapper.emitted('kommentar-geaendert')).toBeUndefined()
  })
})
