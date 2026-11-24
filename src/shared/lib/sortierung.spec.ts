import { describe, expect, it } from 'vitest'
import { sortiereOrte } from './sortierung'
import type { OrtDatensatz } from '../../persistence/schema'
import type { OrteSortierung } from '../../features/orte/model/ansicht'

const AUSGEWOGEN = { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 }
const FOKUS_GESCHMACK = { ambiente: 1, zeit: 1, geschmack: 2, preisLeistung: 1 }

function ort(teil: Partial<OrtDatensatz> & { id: string; bezeichnung: string }): OrtDatensatz {
  return {
    adresse: null,
    breite: null,
    laenge: null,
    anfangsnotiz: null,
    geaendertAm: '2026-09-08T10:00:00.000Z',
    bewertungen: {
      ambiente: { wert: null, kommentar: null },
      zeit: { wert: null, kommentar: null },
      geschmack: { wert: null, kommentar: null },
      preisLeistung: { wert: null, kommentar: null },
    },
    tags: [],
    ...teil,
  }
}

describe('sortiereOrte', () => {
  it('sortiert nach Bezeichnung aufsteigend über Intl.Collator("de")', () => {
    const orte = [
      ort({ id: '1', bezeichnung: 'Österreich-Café' }),
      ort({ id: '2', bezeichnung: 'Apfelstube' }),
      ort({ id: '3', bezeichnung: 'Zebra-Bar' }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'bezeichnung', richtung: 'aufsteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['2', '1', '3'])
    expect(ergebnis.ohneWert).toEqual([])
  })

  it('sortiert nach Bezeichnung absteigend', () => {
    const orte = [
      ort({ id: '1', bezeichnung: 'Apfelstube' }),
      ort({ id: '2', bezeichnung: 'Zebra-Bar' }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'bezeichnung', richtung: 'absteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['2', '1'])
  })

  it('sortiert nach zuletzt geändert, neueste zuerst bei absteigend', () => {
    const orte = [
      ort({ id: '1', bezeichnung: 'A', geaendertAm: '2026-09-01T00:00:00.000Z' }),
      ort({ id: '2', bezeichnung: 'B', geaendertAm: '2026-09-08T00:00:00.000Z' }),
      ort({ id: '3', bezeichnung: 'C', geaendertAm: '2026-09-05T00:00:00.000Z' }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'geaendertAm', richtung: 'absteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['2', '3', '1'])
    expect(ergebnis.ohneWert).toEqual([])
  })

  it('sortiert nach Gesamtnote und gruppiert unbewertete Orte gesammelt ans Ende', () => {
    const orte = [
      ort({ id: '1', bezeichnung: 'Hoch bewertet', bewertungen: bewertungen({ ambiente: 9 }) }),
      ort({ id: '2', bezeichnung: 'Unbewertet' }),
      ort({ id: '3', bezeichnung: 'Niedrig bewertet', bewertungen: bewertungen({ ambiente: 2 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'gesamtnote', richtung: 'absteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['1', '3'])
    expect(ergebnis.ohneWert.map((o) => o.id)).toEqual(['2'])
  })

  it('behandelt einen Ort mit einer einzigen ausgefüllten Achse vor einem mit vier Achsen und niedrigerem Mittelwert (absteigend)', () => {
    const orte = [
      ort({
        id: 'vier-achsen',
        bezeichnung: 'Vier Achsen',
        bewertungen: bewertungen({ ambiente: 5, zeit: 5, geschmack: 5, preisLeistung: 5 }),
      }),
      ort({
        id: 'eine-achse',
        bezeichnung: 'Eine Achse',
        bewertungen: bewertungen({ ambiente: 9 }),
      }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'gesamtnote', richtung: 'absteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['eine-achse', 'vier-achsen'])
  })

  it('sortiert nach jeder Einzelachse und trennt 0 von "nicht bewertet"', () => {
    const orte = [
      ort({ id: 'null', bezeichnung: 'Ohne Wert' }),
      ort({ id: 'null-wert', bezeichnung: 'Mit Null', bewertungen: bewertungen({ ambiente: 0 }) }),
      ort({ id: 'hoch', bezeichnung: 'Mit Zehn', bewertungen: bewertungen({ ambiente: 10 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'ambiente', richtung: 'aufsteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['null-wert', 'hoch'])
    expect(ergebnis.ohneWert.map((o) => o.id)).toEqual(['null'])
  })

  it('sortiert jede der vier Einzelachsen unabhängig voneinander', () => {
    const orte = [
      ort({ id: '1', bezeichnung: 'A', bewertungen: bewertungen({ zeit: 3, geschmack: 8 }) }),
      ort({ id: '2', bezeichnung: 'B', bewertungen: bewertungen({ zeit: 8, geschmack: 3 }) }),
    ]

    const nachZeit = sortiereOrte(orte, { kriterium: 'zeit', richtung: 'aufsteigend' }, AUSGEWOGEN)
    expect(nachZeit.mitWert.map((o) => o.id)).toEqual(['1', '2'])

    const nachGeschmack = sortiereOrte(orte, { kriterium: 'geschmack', richtung: 'aufsteigend' }, AUSGEWOGEN)
    expect(nachGeschmack.mitWert.map((o) => o.id)).toEqual(['2', '1'])

    const nachPreisLeistung = sortiereOrte(orte, { kriterium: 'preisLeistung', richtung: 'aufsteigend' }, AUSGEWOGEN)
    expect(nachPreisLeistung.ohneWert.map((o) => o.id)).toEqual(['1', '2'])
  })

  it('löst Gleichstand über Bezeichnung, dann ID auf — unabhängig von der Richtung', () => {
    const orte = [
      ort({ id: 'b', bezeichnung: 'Bar', bewertungen: bewertungen({ ambiente: 5 }) }),
      ort({ id: 'a', bezeichnung: 'Anfang', bewertungen: bewertungen({ ambiente: 5 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'ambiente', richtung: 'aufsteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['a', 'b'])
  })

  it('löst vollständigen Gleichstand (gleicher Wert, gleiche Bezeichnung) über die ID auf', () => {
    const orte = [
      ort({ id: 'z-id', bezeichnung: 'Gleich', bewertungen: bewertungen({ ambiente: 5 }) }),
      ort({ id: 'a-id', bezeichnung: 'Gleich', bewertungen: bewertungen({ ambiente: 5 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'ambiente', richtung: 'aufsteigend' }

    const ergebnis = sortiereOrte(orte, sortierung, AUSGEWOGEN)

    expect(ergebnis.mitWert.map((o) => o.id)).toEqual(['a-id', 'z-id'])
  })

  it('sortiert die Gesamtnote nach den übergebenen Gewichten (Szenariowechsel ändert die Reihenfolge)', () => {
    const orte = [
      ort({ id: 'geschmack', bezeichnung: 'Geschmack', bewertungen: bewertungen({ ambiente: 5, zeit: 5, geschmack: 10, preisLeistung: 5 }) }),
      ort({ id: 'ambiente', bezeichnung: 'Ambiente', bewertungen: bewertungen({ ambiente: 9, zeit: 5, geschmack: 5, preisLeistung: 5 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'gesamtnote', richtung: 'absteigend' }

    // Ausgewogen: 25/4 = 6,25 gegen 24/4 = 6 -> „geschmack" vorn.
    expect(sortiereOrte(orte, sortierung, AUSGEWOGEN).mitWert.map((o) => o.id)).toEqual(['geschmack', 'ambiente'])
    const fokusAmbiente = { ambiente: 3, zeit: 1, geschmack: 1, preisLeistung: 1 }
    // Ambiente dreifach gewichtet: (15 + 5 + 10 + 5) / 6 = 5,83 gegen (27 + 5 + 5 + 5) / 6 = 7 -> „ambiente" vorn.
    expect(sortiereOrte(orte, sortierung, fokusAmbiente).mitWert.map((o) => o.id)).toEqual(['ambiente', 'geschmack'])
    // Fokus Geschmack: 35/5 = 7 gegen 29/5 = 5,8 -> „geschmack" vorn.
    expect(sortiereOrte(orte, sortierung, FOKUS_GESCHMACK).mitWert.map((o) => o.id)).toEqual(['geschmack', 'ambiente'])
  })

  it('Reihenfolge liest den Rohwert, nicht das gerundete Zehntel (ADR-0037 Punkt 5)', () => {
    // Beide zeigen „8,0" (zehntel 80), aber 7,95 liegt unter 8,00 — das
    // Zehntel allein würde sie gleichsetzen und alphabetisch ordnen.
    const gewichte = { ambiente: 9, zeit: 1, geschmack: 10, preisLeistung: 0 }
    const orte = [
      ort({ id: 'a-knapp', bezeichnung: 'A knapp', bewertungen: bewertungen({ ambiente: 8, zeit: 7, geschmack: 8 }) }),
      ort({ id: 'z-genau', bezeichnung: 'Z genau', bewertungen: bewertungen({ ambiente: 8, zeit: 8, geschmack: 8 }) }),
    ]
    const sortierung: OrteSortierung = { kriterium: 'gesamtnote', richtung: 'absteigend' }

    expect(sortiereOrte(orte, sortierung, gewichte).mitWert.map((o) => o.id)).toEqual(['z-genau', 'a-knapp'])
  })

  it('mutiert das übergebene Array nicht', () => {
    const orte = [
      ort({ id: '2', bezeichnung: 'Zebra' }),
      ort({ id: '1', bezeichnung: 'Apfel' }),
    ]
    const kopie = [...orte]

    sortiereOrte(orte, { kriterium: 'bezeichnung', richtung: 'aufsteigend' }, AUSGEWOGEN)

    expect(orte).toEqual(kopie)
  })
})

function bewertungen(
  teil: Partial<Record<'ambiente' | 'zeit' | 'geschmack' | 'preisLeistung', number>>,
): OrtDatensatz['bewertungen'] {
  return {
    ambiente: { wert: teil.ambiente ?? null, kommentar: null },
    zeit: { wert: teil.zeit ?? null, kommentar: null },
    geschmack: { wert: teil.geschmack ?? null, kommentar: null },
    preisLeistung: { wert: teil.preisLeistung ?? null, kommentar: null },
  }
}
