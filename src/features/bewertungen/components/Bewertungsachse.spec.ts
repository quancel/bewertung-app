// @vitest-environment jsdom
/**
 * Component-Spec für den Emit-Vertrag von `Bewertungsachse.vue` (ADR-0027,
 * PO-2026-09-13-001) — nicht für Sichtbarkeit/Trefferfläche/`accent-color`,
 * die bleiben dem Rauchtest vorbehalten (ADR-0027 Punkt 4).
 *
 * Gegenstand: welches Ereignis am Regler-Handler löst welches Emit aus. Der
 * erste Fall schlägt gegen den Stand vor PO-2026-09-13-001 nachweislich
 * fehl — dort schrieb `aufReglerTippen` nur den lokalen Textzustand und
 * emittierte nie.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Bewertungsachse from './Bewertungsachse.vue'

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
