// @vitest-environment jsdom
/**
 * Component-Spec für den Vertrag von `Schnellansicht.vue` (PO-2026-11-24-005,
 * ADR-0039): Rolle und Beschriftung, Emits, Zustandsfolge über den Griff, die
 * Esc-Regel. Nicht Gegenstand (bleibt dem Rauchtest): Höhen, Einrasten per
 * Geste, Überdeckung — jsdom hat kein Layout.
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { OrtDatensatz } from '../../../persistence/schema'
import Schnellansicht from './Schnellansicht.vue'

class FakeResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function ort(): OrtDatensatz {
  const leer = { wert: null, kommentar: null }
  return {
    id: 'o1',
    bezeichnung: 'Café Beispiel',
    adresse: 'Musterstraße 1',
    breite: 1,
    laenge: 2,
    anfangsnotiz: 'Notiz',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    bewertungen: {
      ambiente: { wert: 8, kommentar: 'Schön' },
      zeit: { ...leer },
      geschmack: { ...leer },
      preisLeistung: { ...leer },
    },
    tags: ['a'],
  } as unknown as OrtDatensatz
}

const mitNote = { art: 'wert', roh: 8, zehntel: 80 } as const

function mounten(gesamtnote: Parameters<typeof mount>[1] extends never ? never : unknown = mitNote) {
  return mount(Schnellansicht, {
    props: { ort: ort(), gesamtnote: gesamtnote as never },
    attachTo: document.body,
  })
}

let alterObserver: typeof ResizeObserver | undefined

beforeEach(() => {
  setActivePinia(createPinia())
  alterObserver = globalThis.ResizeObserver
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  globalThis.ResizeObserver = alterObserver as typeof ResizeObserver
  document.body.innerHTML = ''
})

describe('Schnellansicht', () => {
  it('ist ein nicht modaler Dialog mit der Bezeichnung im Namen', () => {
    const wrapper = mounten()
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('Schnellansicht: Café Beispiel')
    expect(dialog.attributes('aria-modal')).toBeUndefined()
    wrapper.unmount()
  })

  it('beginnt bei „halb" und schaltet über den Griff halb -> voll -> halb', async () => {
    const wrapper = mounten()
    const griff = wrapper.get('.schnellansicht__griff')
    expect(griff.attributes('aria-label')).toBe('Größe der Schnellansicht ändern, aktuell halb')
    await griff.trigger('click')
    expect(griff.attributes('aria-label')).toContain('aktuell voll')
    await griff.trigger('click')
    expect(griff.attributes('aria-label')).toContain('aktuell halb')
    wrapper.unmount()
  })

  it('Pfeiltasten am Griff ändern um einen Zustand und bleiben am Ende stehen', async () => {
    const wrapper = mounten()
    const griff = wrapper.get('.schnellansicht__griff')
    await griff.trigger('keydown', { key: 'ArrowDown' })
    expect(griff.attributes('aria-label')).toContain('aktuell eingeklappt')
    await griff.trigger('keydown', { key: 'ArrowDown' })
    expect(griff.attributes('aria-label')).toContain('aktuell eingeklappt')
    await griff.trigger('keydown', { key: 'ArrowUp' })
    await griff.trigger('keydown', { key: 'ArrowUp' })
    await griff.trigger('keydown', { key: 'ArrowUp' })
    expect(griff.attributes('aria-label')).toContain('aktuell voll')
    wrapper.unmount()
  })

  it('zeigt „Bearbeiten" nur außerhalb von „eingeklappt" und meldet den Klick', async () => {
    const wrapper = mounten()
    const bearbeiten = () => wrapper.findAll('button').find((b) => b.text() === 'Bearbeiten')
    expect(bearbeiten()).toBeDefined()
    await bearbeiten()!.trigger('click')
    expect(wrapper.emitted('bearbeiten')).toHaveLength(1)
    await wrapper.get('.schnellansicht__griff').trigger('keydown', { key: 'ArrowDown' })
    expect(bearbeiten()).toBeUndefined()
    wrapper.unmount()
  })

  it('„×" und Esc melden das Schließen', async () => {
    const wrapper = mounten()
    await wrapper.get('[aria-label="Schnellansicht schließen"]').trigger('click')
    expect(wrapper.emitted('schliessen')).toHaveLength(1)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('schliessen')).toHaveLength(2)
    wrapper.unmount()
  })

  it('Esc schließt nicht, solange ein modaler Dialog offen ist (das erste Esc gehört ihm)', () => {
    const wrapper = mounten()
    const modal = document.createElement('div')
    modal.setAttribute('aria-modal', 'true')
    document.body.appendChild(modal)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('schliessen')).toBeUndefined()
    wrapper.unmount()
  })

  it('zeigt die Gesamtnote ohne Zonenklasse; ohne Note stattdessen den Zustandstext', () => {
    const mit = mounten()
    expect(mit.get('.schnellansicht__note').text()).toBe('8,0')
    mit.unmount()
    const ohne = mounten({ art: 'unbewertet' })
    expect(ohne.find('.schnellansicht__note').exists()).toBe(false)
    expect(ohne.get('.schnellansicht__ohne-note').text()).toBe('Noch nicht bewertet')
    ohne.unmount()
    const ohneGewicht = mounten({ art: 'ohne-gewicht' })
    expect(ohneGewicht.get('.schnellansicht__ohne-note').text()).toBe('Keine Gesamtnote bei dieser Gewichtung')
    ohneGewicht.unmount()
  })

  it('meldet das Zielmaß der Überlagerung beim Einhängen', async () => {
    const wrapper = mounten()
    await new Promise((fertig) => setTimeout(fertig, 0))
    const meldungen = wrapper.emitted('verdeckung-geaendert')
    expect(meldungen?.length).toBeGreaterThan(0)
    expect(meldungen![0]![0]).toMatchObject({ hoehe: expect.any(Number) })
    wrapper.unmount()
  })
})
