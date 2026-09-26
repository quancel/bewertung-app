// @vitest-environment jsdom
/**
 * Component-Spec für den Emit-Vertrag von `TagEingabe.vue` (PO-2026-09-26-001,
 * ADR-0030) — nicht für Sichtbarkeit/Fade-in/„überlebt ein Neuladen", die
 * bleiben dem Rauchtest vorbehalten (code-conventions.md „Tests und
 * Verifikation").
 *
 * Gegenstand: welcher Auslöser committet (`tag-hinzugefuegt`) und welcher
 * nicht — inklusive der neuen exponierten Methode `uebernimmOffeneEingabe`
 * (ADR-0030 Punkt 3) und der Rückkehr-Markierung (Punkt 7). Rot-Nachweis
 * gegen den Stand vor PO-2026-09-26-001: Dort committete ausschließlich
 * Enter/Vorschlag-Klick — jeder `focusout`-Test unten schlug fehl (kein
 * Handler vorhanden, kein Emit), und `uebernimmOffeneEingabe` existierte als
 * exponierte Methode überhaupt nicht (`wrapper.vm.uebernimmOffeneEingabe`
 * wäre `undefined` gewesen, ein Aufruf hätte eine TypeError geworfen).
 */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TagEingabe from './TagEingabe.vue'

function mounten(tags: string[] = [], vokabular: string[] = []) {
  return mount(TagEingabe, {
    props: { tags, vokabular },
  })
}

beforeEach(() => {
  // jsdom kennt kein reales Fenster-Fokus-Konzept — explizit gesetzt, damit
  // die Tests nicht von einem Umgebungs-Default abhängen (ADR-0030 Punkt 2:
  // die Unterscheidung "Feld verlassen" vs. "Dokument verliert Fokus" hängt
  // genau an `document.hasFocus()`).
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TagEingabe — Feld verlassen (focusout), PO-2026-09-26-001', () => {
  it('focusout nach außen committet den getrimmten Rohtext, genau ein Emit', async () => {
    const wrapper = mounten()
    const input = wrapper.find('input')
    await input.setValue('  Café  ')

    const aussenElement = document.createElement('button')
    document.body.appendChild(aussenElement)
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: aussenElement })

    const emits = wrapper.emitted('tag-hinzugefuegt')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual(['Café'])
    aussenElement.remove()
  })

  it('focusout auf einen Vorschlags-Button (innerhalb des Feldbereichs) committet nicht', async () => {
    const wrapper = mounten([], ['Berlin', 'Bremen'])
    const input = wrapper.find('input')
    await input.setValue('Ber')

    const vorschlagButton = wrapper.find('.tag-eingabe__vorschlag').element
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: vorschlagButton })

    expect(wrapper.emitted('tag-hinzugefuegt')).toBeUndefined()
  })

  it('eine per Pfeiltaste nur markierte Vorschlagszeile wird bei focusout ignoriert — committet wird der rohe Text', async () => {
    const wrapper = mounten([], ['Berlin', 'Bremen'])
    const input = wrapper.find('input')
    await input.setValue('Ber')
    await input.trigger('keydown.down') // markiert den ersten Vorschlag, bestätigt ihn NICHT

    const aussenElement = document.createElement('button')
    document.body.appendChild(aussenElement)
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: aussenElement })

    const emits = wrapper.emitted('tag-hinzugefuegt')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual(['Ber'])
    aussenElement.remove()
  })

  it('leeres Feld erzeugt bei focusout kein Emit', async () => {
    const wrapper = mounten()
    const aussenElement = document.createElement('button')
    document.body.appendChild(aussenElement)
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: aussenElement })

    expect(wrapper.emitted('tag-hinzugefuegt')).toBeUndefined()
    aussenElement.remove()
  })

  it('nur Leerzeichen im Feld erzeugt bei focusout kein Emit', async () => {
    const wrapper = mounten()
    await wrapper.find('input').setValue('    ')
    const aussenElement = document.createElement('button')
    document.body.appendChild(aussenElement)
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: aussenElement })

    expect(wrapper.emitted('tag-hinzugefuegt')).toBeUndefined()
    aussenElement.remove()
  })

  it('verliert das DOKUMENT selbst den Fokus (relatedTarget null, hasFocus() false), committet focusout NICHT', async () => {
    const wrapper = mounten()
    await wrapper.find('input').setValue('Unbestätigt')

    vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    await wrapper.find('.tag-eingabe__feldbereich').trigger('focusout', { relatedTarget: null })

    expect(wrapper.emitted('tag-hinzugefuegt')).toBeUndefined()
  })
})

describe('TagEingabe — Klick auf Vorschlag (unverändert, ADR-0013)', () => {
  it('mousedown auf einen Vorschlag committet genau einmal den Vorschlag, nicht den Teiltext', async () => {
    const wrapper = mounten([], ['Berlin', 'Bremen'])
    await wrapper.find('input').setValue('Ber')

    await wrapper.find('.tag-eingabe__vorschlag').trigger('mousedown')

    const emits = wrapper.emitted('tag-hinzugefuegt')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual(['Berlin'])
  })
})

describe('TagEingabe — uebernimmOffeneEingabe (ADR-0030 Punkt 3)', () => {
  it('übernimmt den offenen Text für beide Anlässe mit genau einem Emit', async () => {
    const wrapper = mounten()
    await wrapper.find('input').setValue('Hintergrund-Tag')

    wrapper.vm.uebernimmOffeneEingabe('hintergrund')

    const emits = wrapper.emitted('tag-hinzugefuegt')
    expect(emits).toHaveLength(1)
    expect(emits![0]).toEqual(['Hintergrund-Tag'])
  })

  it('ein zweiter Aufruf ohne neue Eingabe erzeugt keinen zweiten Commit', async () => {
    const wrapper = mounten()
    await wrapper.find('input').setValue('Nur einmal')

    wrapper.vm.uebernimmOffeneEingabe('verlassen')
    wrapper.vm.uebernimmOffeneEingabe('verlassen')

    expect(wrapper.emitted('tag-hinzugefuegt')).toHaveLength(1)
  })

  it('leeres Feld ist bei uebernimmOffeneEingabe ein No-op', async () => {
    const wrapper = mounten()

    wrapper.vm.uebernimmOffeneEingabe('hintergrund')

    expect(wrapper.emitted('tag-hinzugefuegt')).toBeUndefined()
  })
})

describe('TagEingabe — Rückkehr-Markierung (design-conventions.md „Rückkehr aus dem Hintergrund", ADR-0030 Punkt 7)', () => {
  it('anlass "hintergrund" mit einem am Ort neuen Tag markiert die Pille nach Prop-Update UND Rückkehr des Dokuments', async () => {
    const wrapper = mounten([])
    await wrapper.find('input').setValue('Neu')

    wrapper.vm.uebernimmOffeneEingabe('hintergrund')
    await wrapper.setProps({ tags: ['Neu'] })

    // Vor der Rückkehr des Dokuments (visibilitychange) ist die Pille zwar
    // vorhanden, aber noch NICHT als übernommen markiert — die Komponente
    // beobachtet die Rückkehr selbst NUR für die Darstellung (ADR-0030
    // Punkt 7), nicht für den bereits erfolgten Commit.
    let pille = wrapper.find('.tag-eingabe__pill')
    expect(pille.classes()).not.toContain('tag-eingabe__pill--uebernommen')

    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()

    pille = wrapper.find('.tag-eingabe__pill')
    expect(pille.classes()).toContain('tag-eingabe__pill--uebernommen')
    expect(pille.find('button').attributes('aria-label')).toBe('Neu (automatisch übernommen) entfernen')
    expect(pille.text()).toContain('übernommen')
  })

  it('ein (case-insensitiv) bereits am Ort vorhandener Tag bekommt keine Markierung', async () => {
    const wrapper = mounten(['Berlin'])
    await wrapper.find('input').setValue('BERLIN')

    wrapper.vm.uebernimmOffeneEingabe('hintergrund')
    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()

    const pille = wrapper.find('.tag-eingabe__pill')
    expect(pille.classes()).not.toContain('tag-eingabe__pill--uebernommen')
    expect(pille.find('button').attributes('aria-label')).toBe('Berlin entfernen')
  })

  it('anlass "verlassen" setzt keine Rückkehr-Markierung', async () => {
    const wrapper = mounten([])
    await wrapper.find('input').setValue('Neu')

    wrapper.vm.uebernimmOffeneEingabe('verlassen')
    await wrapper.setProps({ tags: ['Neu'] })
    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()

    const pille = wrapper.find('.tag-eingabe__pill')
    expect(pille.classes()).not.toContain('tag-eingabe__pill--uebernommen')
  })

  it('ein input-Ereignis im Feld beendet eine bestehende Rückkehr-Markierung', async () => {
    const wrapper = mounten([])
    const input = wrapper.find('input')
    await input.setValue('Neu')

    wrapper.vm.uebernimmOffeneEingabe('hintergrund')
    await wrapper.setProps({ tags: ['Neu'] })
    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tag-eingabe__pill').classes()).toContain('tag-eingabe__pill--uebernommen')

    await input.setValue('w')

    expect(wrapper.find('.tag-eingabe__pill').classes()).not.toContain('tag-eingabe__pill--uebernommen')
  })
})
