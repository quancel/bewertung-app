import { describe, expect, it } from 'vitest'
import { wendeMigrationsketteAn, type RohBestand } from './index'
import { SCHEMA_VERSION } from '../schema'
import v1Bestand from './__fixtures__/v1-bestand.json'

describe('wendeMigrationsketteAn', () => {
  it('liefert den Bestand unverändert (Identität) bei gleicher Version', () => {
    const rohBestand: RohBestand = v1Bestand as RohBestand

    const ergebnis = wendeMigrationsketteAn(rohBestand)

    expect(ergebnis).toEqual({ status: 'ok', bestand: rohBestand })
  })

  it('lehnt eine unbekannte, neuere Version ab und lässt den Bestand unangetastet', () => {
    const zuNeu: RohBestand = { schemaVersion: SCHEMA_VERSION + 1, orte: [] }

    const ergebnis = wendeMigrationsketteAn(zuNeu)

    expect(ergebnis).toEqual({ status: 'version_zu_neu' })
  })

  it('das Fixture trägt bereits die aktuelle v1-SCHEMA_VERSION', () => {
    expect((v1Bestand as RohBestand).schemaVersion).toBe(1)
    expect(SCHEMA_VERSION).toBe(1)
  })
})
