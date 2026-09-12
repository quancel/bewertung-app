import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { sichereKopie } from './sichere-kopie'

/**
 * `fake-indexeddb` bildet den strukturierten Klon in JavaScript nach und
 * lehnt einen `Proxy` NICHT ab (ADR-0023) — ein Test dagegen hätte
 * PO-2026-09-12-001 nicht gefangen. Das eingebaute, spec-treue
 * `structuredClone()` (Node/V8 — dieselbe Klon-Implementierung, die auch
 * eine echte IndexedDB benutzt) lehnt einen `Proxy` dagegen ab, unabhängig
 * von jeder Browser-Engine. Diese Datei prüft deshalb bewusst gegen
 * `structuredClone()`, nicht gegen `fake-indexeddb` — nur so ist die
 * Zusicherung überhaupt scharf.
 */
describe('sichereKopie', () => {
  it('ein reaktives Objekt ist NICHT strukturiert klonbar — der eigentliche Befund von PO-2026-09-12-001', () => {
    const reaktiv = reactive({ id: '1', bezeichnung: 'Café' })

    expect(() => structuredClone(reaktiv)).toThrow(DOMException)
  })

  it('sichereKopie macht ein reaktives Objekt strukturiert klonbar und inhaltsgleich', () => {
    const reaktiv = reactive({ id: '1', bezeichnung: 'Café', tags: ['Pizza'] })

    const kopie = sichereKopie(reaktiv)

    expect(() => structuredClone(kopie)).not.toThrow()
    expect(kopie).toEqual({ id: '1', bezeichnung: 'Café', tags: ['Pizza'] })
  })

  it('entfernt auch einen NUR TIEF verschachtelten Proxy, der beim Nachbau nur eines Feldes entsteht', () => {
    // Nachbau von `useOrteStore.aktualisiereAchse`: Nur eine Achse wird per
    // Spread neu zusammengesetzt, die übrigen werden unverändert
    // durchgereicht — dabei bleiben sie hinter ihrem reaktiven Proxy.
    const ort = reactive({
      id: '1',
      bewertungen: {
        ambiente: { wert: null as number | null, kommentar: null as string | null },
        zeit: { wert: null as number | null, kommentar: null as string | null },
      },
    })
    const aktualisiert = {
      ...ort,
      bewertungen: {
        ...ort.bewertungen,
        ambiente: { ...ort.bewertungen.ambiente, wert: 5 },
      },
    }
    // Vorbedingung des Tests: Der Nachbau selbst erzeugt tatsächlich einen
    // tief verschachtelten Proxy (sonst prüfte dieser Test nichts).
    expect(() => structuredClone(aktualisiert)).toThrow(DOMException)

    const kopie = sichereKopie(aktualisiert)

    expect(() => structuredClone(kopie)).not.toThrow()
    expect(kopie).toEqual({
      id: '1',
      bewertungen: {
        ambiente: { wert: 5, kommentar: null },
        zeit: { wert: null, kommentar: null },
      },
    })
  })

  it('reicht einen Blob unverändert durch, statt ihn über seine (nicht vorhandenen) aufzählbaren Felder nachzubauen', async () => {
    const blob = new Blob(['x'], { type: 'image/webp' })

    const kopie = sichereKopie({ blob })

    expect(kopie.blob).toBe(blob)
    expect(kopie.blob).toBeInstanceOf(Blob)
    await expect(kopie.blob.text()).resolves.toBe('x')
  })

  it('kopiert Arrays reaktiver Elemente', () => {
    const orte = reactive([{ id: '1' }, { id: '2' }])

    const kopie = sichereKopie(orte)

    expect(() => structuredClone(kopie)).not.toThrow()
    expect(kopie).toEqual([{ id: '1' }, { id: '2' }])
  })

  it('lässt Primitive und null unverändert', () => {
    expect(sichereKopie(null)).toBeNull()
    expect(sichereKopie(42)).toBe(42)
    expect(sichereKopie('text')).toBe('text')
  })
})
