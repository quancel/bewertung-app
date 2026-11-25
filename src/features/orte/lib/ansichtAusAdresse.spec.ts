import { describe, expect, it } from 'vitest'
import { leiteAnsichtAusAdresse, leiteOrtIdAusAdresse, tragtOrtParameterMitBedeutung } from './ansichtAusAdresse'

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

describe('leiteOrtIdAusAdresse (ADR-0039)', () => {
  it('liefert die ID nur auf /orte mit ansicht=karte', () => {
    expect(leiteOrtIdAusAdresse('orte', 'karte', 'abc')).toBe('abc')
  })

  it('ignoriert den Parameter in der Liste und auf der Detailadresse', () => {
    expect(leiteOrtIdAusAdresse('orte', undefined, 'abc')).toBeNull()
    expect(leiteOrtIdAusAdresse('orte', 'liste', 'abc')).toBeNull()
    expect(leiteOrtIdAusAdresse('ort-detail', 'karte', 'abc')).toBeNull()
    expect(leiteOrtIdAusAdresse('daten', 'karte', 'abc')).toBeNull()
  })

  it('liefert null bei fehlendem, leerem oder mehrfachem Wert', () => {
    expect(leiteOrtIdAusAdresse('orte', 'karte', undefined)).toBeNull()
    expect(leiteOrtIdAusAdresse('orte', 'karte', '')).toBeNull()
    expect(leiteOrtIdAusAdresse('orte', 'karte', ['a', 'b'])).toBeNull()
  })
})

describe('tragtOrtParameterMitBedeutung (ADR-0039 Punkt 2)', () => {
  it('ja, sobald der Parameter in der Kartenansicht steht — auch leer oder mehrfach', () => {
    expect(tragtOrtParameterMitBedeutung('orte', 'karte', 'abc')).toBe(true)
    expect(tragtOrtParameterMitBedeutung('orte', 'karte', '')).toBe(true)
    expect(tragtOrtParameterMitBedeutung('orte', 'karte', ['a', 'b'])).toBe(true)
  })

  it('nein ohne Parameter, in der Liste und auf anderen Routen (dort wird nichts korrigiert)', () => {
    expect(tragtOrtParameterMitBedeutung('orte', 'karte', undefined)).toBe(false)
    expect(tragtOrtParameterMitBedeutung('orte', undefined, 'abc')).toBe(false)
    expect(tragtOrtParameterMitBedeutung('ort-detail', 'karte', 'abc')).toBe(false)
  })
})
