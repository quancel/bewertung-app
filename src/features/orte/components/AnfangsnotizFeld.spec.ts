// @vitest-environment jsdom
/**
 * Component-Spec für `AnfangsnotizFeld.vue` (PO-2026-09-27-002, ADR-0027
 * Punkt 4): Gegenstand ist der Handler-/Emit-Weg — Enter-Wirkungslosigkeit,
 * Einfügen mit Zeilenumbruch/über 100 Zeichen, DOM-Nachziehen,
 * Zählersichtbarkeit. NICHT Gegenstand (bleibt dem Rauchtest vorbehalten,
 * code-conventions.md „Nicht in jsdom zusichern"): Sichtbarkeit, Höhe,
 * tatsächlicher Umbruch, „überlebt ein Neuladen".
 *
 * `FakeResizeObserver` (Vorbild `Bewertungsachse.spec.ts`/
 * `useMitwachsendesTextfeld.spec.ts`): jsdom kennt `ResizeObserver` nicht —
 * `useMitwachsendesTextfeld` bindet beim Mount einen echten, der ohne diesen
 * Ersatz mit `ReferenceError` abbräche.
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AnfangsnotizFeld from './AnfangsnotizFeld.vue'
import { ANFANGSNOTIZ_MAX_ZEICHEN } from '../lib/anfangsnotiz'

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

function mounten(wert: string | null = null) {
  return mount(AnfangsnotizFeld, { props: { wert } })
}

describe('AnfangsnotizFeld', () => {
  it('zeigt den übergebenen Wert im Feld', () => {
    const wrapper = mounten('Sehr gemütlich')
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement

    expect(feld.value).toBe('Sehr gemütlich')
  })

  it('zeigt bei null-Wert ein leeres Feld mit dem --leer-Modifier', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')

    expect((feld.element as HTMLTextAreaElement).value).toBe('')
    expect(feld.classes()).toContain('anfangsnotiz-feld__eingabe--leer')
  })

  it('emittiert bei jedem input-Ereignis den aktuellen Feldtext', async () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')
    const element = feld.element as HTMLTextAreaElement

    element.value = 'Erster Eindruck'
    await feld.trigger('input')

    expect(wrapper.emitted('eingabe')).toEqual([['Erster Eindruck']])
  })

  it('emittiert verlassen bei blur, kein eingabe-Emit dabei', async () => {
    const wrapper = mounten('Text')
    const feld = wrapper.find('textarea')

    await feld.trigger('blur')

    expect(wrapper.emitted('verlassen')).toHaveLength(1)
    expect(wrapper.emitted('eingabe')).toBeUndefined()
  })

  it('Enter fügt keinen Zeilenumbruch ein (keydown.enter mit preventDefault)', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement
    const ereignis = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })

    feld.dispatchEvent(ereignis)

    expect(ereignis.defaultPrevented).toBe(true)
  })

  it('unterdrückt beforeinput mit inputType insertLineBreak (virtuelle Tastaturen, keyCode 229)', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement
    const ereignis = new Event('beforeinput', { cancelable: true }) as InputEvent & { inputType: string }
    Object.defineProperty(ereignis, 'inputType', { value: 'insertLineBreak' })

    feld.dispatchEvent(ereignis)

    expect(ereignis.defaultPrevented).toBe(true)
  })

  it('unterdrückt beforeinput mit inputType insertParagraph ebenfalls', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement
    const ereignis = new Event('beforeinput', { cancelable: true }) as InputEvent & { inputType: string }
    Object.defineProperty(ereignis, 'inputType', { value: 'insertParagraph' })

    feld.dispatchEvent(ereignis)

    expect(ereignis.defaultPrevented).toBe(true)
  })

  it('lässt beforeinput mit einem anderen inputType unangetastet (z. B. insertText)', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement
    const ereignis = new Event('beforeinput', { cancelable: true }) as InputEvent & { inputType: string }
    Object.defineProperty(ereignis, 'inputType', { value: 'insertText' })

    feld.dispatchEvent(ereignis)

    expect(ereignis.defaultPrevented).toBe(false)
  })

  it('zieht das DOM nach, wenn Einfügen einen Zeilenumbruch enthält — Feldtext danach ohne \\n, eingabe-Emit trägt den normalisierten Text', async () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')
    const element = feld.element as HTMLTextAreaElement

    element.value = 'Zeile1\nZeile2'
    element.selectionStart = element.value.length
    await feld.trigger('input')

    expect(element.value).toBe('Zeile1 Zeile2')
    expect(wrapper.emitted('eingabe')).toEqual([['Zeile1 Zeile2']])
  })

  it('zieht das DOM nach, wenn Einfügen mehr als 100 Zeichen liefert — auf 100 gekürzt', async () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')
    const element = feld.element as HTMLTextAreaElement

    const text = 'a'.repeat(150)
    element.value = text
    element.selectionStart = text.length
    await feld.trigger('input')

    expect(element.value).toHaveLength(ANFANGSNOTIZ_MAX_ZEICHEN)
    expect(wrapper.emitted('eingabe')?.[0]).toEqual(['a'.repeat(ANFANGSNOTIZ_MAX_ZEICHEN)])
  })

  it('zieht das DOM NICHT nach, wenn die Normalisierung den Text nicht ändert (Caret bleibt unangetastet)', async () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')
    const element = feld.element as HTMLTextAreaElement

    element.value = 'Normaler Text'
    element.selectionStart = 5
    await feld.trigger('input')

    // Kein erzwungener `setSelectionRange`-Aufruf nötig, weil sich der Wert
    // nicht ändert — Nachweis über den unveränderten Feldtext.
    expect(element.value).toBe('Normaler Text')
    expect(wrapper.emitted('eingabe')).toEqual([['Normaler Text']])
  })

  it('stört eine laufende IME-Komposition nicht, selbst wenn die Normalisierung den Text ändern würde', () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea').element as HTMLTextAreaElement

    feld.value = 'Zeile1\nZeile2'
    const ereignis = new Event('input') as InputEvent & { isComposing: boolean }
    Object.defineProperty(ereignis, 'isComposing', { value: true })
    feld.dispatchEvent(ereignis)

    // Während der Komposition bleibt der rohe Feldtext unangetastet.
    expect(feld.value).toBe('Zeile1\nZeile2')
  })

  it('zeigt den Zähler nur bei Fokus, im Format {aktuell}/100', async () => {
    const wrapper = mounten('12345')
    expect(wrapper.find('.anfangsnotiz-feld__zaehler').exists()).toBe(false)

    await wrapper.find('textarea').trigger('focus')
    expect(wrapper.find('.anfangsnotiz-feld__zaehler').text()).toBe(`5/${ANFANGSNOTIZ_MAX_ZEICHEN}`)

    await wrapper.find('textarea').trigger('blur')
    expect(wrapper.find('.anfangsnotiz-feld__zaehler').exists()).toBe(false)
  })

  it('der Zähler zeigt die Länge des NORMALISIERTEN, nicht des rohen Textes', async () => {
    const wrapper = mounten(null)
    const feld = wrapper.find('textarea')
    const element = feld.element as HTMLTextAreaElement
    await feld.trigger('focus')

    element.value = 'Zeile1\nZeile2'
    element.selectionStart = element.value.length
    await feld.trigger('input')

    expect(wrapper.find('.anfangsnotiz-feld__zaehler').text()).toBe(`13/${ANFANGSNOTIZ_MAX_ZEICHEN}`)
  })

  it('setzt maxlength als Komfort-Attribut auf 100', () => {
    const wrapper = mounten(null)
    expect(wrapper.find('textarea').attributes('maxlength')).toBe(String(ANFANGSNOTIZ_MAX_ZEICHEN))
  })

  it('hat rows="2" als Mindesthöhe', () => {
    const wrapper = mounten(null)
    expect(wrapper.find('textarea').attributes('rows')).toBe('2')
  })

  it('setzt den Platzhalter "noch nichts eingetragen"', () => {
    const wrapper = mounten(null)
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('noch nichts eingetragen')
  })
})
