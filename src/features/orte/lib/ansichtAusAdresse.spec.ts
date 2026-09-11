import { describe, expect, it } from 'vitest'
import { leiteAnsichtAusAdresse } from './ansichtAusAdresse'

describe('leiteAnsichtAusAdresse', () => {
  it('liefert "karte" auf /orte mit ansicht=karte', () => {
    expect(leiteAnsichtAusAdresse('orte', 'karte')).toBe('karte')
  })

  it('liefert "liste", wenn der Parameter fehlt', () => {
    expect(leiteAnsichtAusAdresse('orte', undefined)).toBe('liste')
  })

  it('liefert "liste" bei einem unbekannten Wert (keine Korrektur, nur Rückfall)', () => {
    expect(leiteAnsichtAusAdresse('orte', 'liste')).toBe('liste')
    expect(leiteAnsichtAusAdresse('orte', 'Karte')).toBe('liste')
    expect(leiteAnsichtAusAdresse('orte', '')).toBe('liste')
  })

  it('ignoriert den Parameter auf der Detailadresse — immer "liste"', () => {
    expect(leiteAnsichtAusAdresse('ort-detail', 'karte')).toBe('liste')
  })

  it('liefert "liste" auf jeder anderen Route', () => {
    expect(leiteAnsichtAusAdresse('daten', 'karte')).toBe('liste')
    expect(leiteAnsichtAusAdresse('adresse-ohne-ziel', 'karte')).toBe('liste')
    expect(leiteAnsichtAusAdresse(undefined, 'karte')).toBe('liste')
  })

  it('behandelt ein Array (mehrfacher Query-Parameter) als unbekannten Wert', () => {
    expect(leiteAnsichtAusAdresse('orte', ['karte', 'karte'])).toBe('liste')
  })
})
