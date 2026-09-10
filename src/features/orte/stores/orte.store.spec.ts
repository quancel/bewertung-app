import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ladeAlleOrteMock, speichereOrtMock, loescheOrtMock, ladeEinstellungMock, schreibeEinstellungMock } =
  vi.hoisted(() => ({
    ladeAlleOrteMock: vi.fn(),
    speichereOrtMock: vi.fn(),
    loescheOrtMock: vi.fn(),
    ladeEinstellungMock: vi.fn(),
    schreibeEinstellungMock: vi.fn(),
  }))

vi.mock('../../../persistence/orte-repository', () => ({
  ladeAlleOrte: ladeAlleOrteMock,
  speichereOrt: speichereOrtMock,
  loescheOrt: loescheOrtMock,
}))

vi.mock('../../../persistence/einstellungen-repository', () => ({
  ladeEinstellung: ladeEinstellungMock,
  schreibeEinstellung: schreibeEinstellungMock,
}))

import { useOrteStore } from './orte.store'

describe('useOrteStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ladeAlleOrteMock.mockReset()
    speichereOrtMock.mockReset()
    loescheOrtMock.mockReset()
    ladeEinstellungMock.mockReset()
    schreibeEinstellungMock.mockReset()
    speichereOrtMock.mockResolvedValue({ status: 'geschrieben' })
    loescheOrtMock.mockResolvedValue({ status: 'geschrieben' })
    ladeEinstellungMock.mockResolvedValue({ status: 'nicht_vorhanden' })
    schreibeEinstellungMock.mockResolvedValue({ status: 'geschrieben' })
  })

  it('lädt einmalig und liest bei erneutem Aufruf nicht erneut', async () => {
    ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
    const store = useOrteStore()

    await store.sicherstellenGeladen()
    await store.sicherstellenGeladen()

    expect(ladeAlleOrteMock).toHaveBeenCalledTimes(1)
  })

  it('legt einen Ort mit ausschließlich der Bezeichnung an und persistiert ihn vollständig', async () => {
    const store = useOrteStore()

    const neuerOrt = await store.legeOrtAn('Café Sonnenschein')

    expect(neuerOrt.bezeichnung).toBe('Café Sonnenschein')
    expect(neuerOrt.adresse).toBeNull()
    expect(neuerOrt.breite).toBeNull()
    expect(neuerOrt.laenge).toBeNull()
    expect(store.orte).toHaveLength(1)
    expect(speichereOrtMock).toHaveBeenCalledWith(neuerOrt)
  })

  it('aktualisiereFeld ändert nur den Arbeitsspeicher, kein Schreibvorgang', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    speichereOrtMock.mockClear()

    store.aktualisiereFeld(ort.id, { adresse: 'Musterstraße 1' })

    expect(store.ortNachId(ort.id)?.adresse).toBe('Musterstraße 1')
    expect(speichereOrtMock).not.toHaveBeenCalled()
  })

  it('persistiereOrt schreibt den vollständigen aktuellen Stand aus dem Store', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    store.aktualisiereFeld(ort.id, { breite: 52.5, laenge: 13.4 })
    speichereOrtMock.mockClear()

    await store.persistiereOrt(ort.id)

    expect(speichereOrtMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: ort.id, breite: 52.5, laenge: 13.4 }),
    )
  })

  it('meldet einen fehlgeschlagenen Schreibvorgang sichtbar über den Store', async () => {
    speichereOrtMock.mockResolvedValueOnce({ status: 'geschrieben' })
    speichereOrtMock.mockResolvedValueOnce({
      status: 'schreiben_fehlgeschlagen',
      grund: 'speicher_voll',
    })
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    await store.persistiereOrt(ort.id)

    expect(store.schreibfehlerFuer(ort.id).value).toBe('speicher_voll')
  })

  it('legt einen neuen Ort mit allen vier Achsen aktiv als „nicht bewertet" an', async () => {
    const store = useOrteStore()

    const neuerOrt = await store.legeOrtAn('Ausgangsname')

    expect(neuerOrt.bewertungen).toEqual({
      ambiente: { wert: null, kommentar: null },
      zeit: { wert: null, kommentar: null },
      geschmack: { wert: null, kommentar: null },
      preisLeistung: { wert: null, kommentar: null },
    })
  })

  it('aktualisiereAchse setzt einen Achsenwert, ohne den Kommentar zu berühren', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 0 })

    expect(store.ortNachId(ort.id)?.bewertungen.ambiente).toEqual({ wert: 0, kommentar: null })
  })

  it('aktualisiereAchse setzt beim Zurücksetzen ausschließlich den Wert auf null — der Kommentar bleibt erhalten', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 8, kommentar: 'Sehr gemütlich' })

    store.aktualisiereAchse(ort.id, 'ambiente', { wert: null })

    expect(store.ortNachId(ort.id)?.bewertungen.ambiente).toEqual({
      wert: null,
      kommentar: 'Sehr gemütlich',
    })
  })

  it('aktualisiereAchse ändert nur die betroffene Achse, die übrigen bleiben unverändert', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')

    store.aktualisiereAchse(ort.id, 'zeit', { wert: 5 })

    const bewertungen = store.ortNachId(ort.id)?.bewertungen
    expect(bewertungen?.zeit).toEqual({ wert: 5, kommentar: null })
    expect(bewertungen?.ambiente).toEqual({ wert: null, kommentar: null })
    expect(bewertungen?.geschmack).toEqual({ wert: null, kommentar: null })
    expect(bewertungen?.preisLeistung).toEqual({ wert: null, kommentar: null })
  })

  it('aktualisiereAchse aktualisiert geaendertAm', async () => {
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Ausgangsname')
    const vorher = store.ortNachId(ort.id)?.geaendertAm

    await new Promise((resolve) => setTimeout(resolve, 2))
    store.aktualisiereAchse(ort.id, 'ambiente', { wert: 4 })

    expect(store.ortNachId(ort.id)?.geaendertAm).not.toBe(vorher)
  })

  it('löscht einen Ort nur nach erfolgreichem Schreibvorgang aus dem Store', async () => {
    loescheOrtMock.mockResolvedValueOnce({
      status: 'schreiben_fehlgeschlagen',
      grund: 'unbekannt',
    })
    const store = useOrteStore()
    const ort = await store.legeOrtAn('Wird gelöscht')

    const erfolgFehlgeschlagen = await store.loescheOrt(ort.id)
    expect(erfolgFehlgeschlagen).toBe(false)
    expect(store.ortNachId(ort.id)).toBeDefined()

    loescheOrtMock.mockResolvedValueOnce({ status: 'geschrieben' })
    const erfolg = await store.loescheOrt(ort.id)
    expect(erfolg).toBe(true)
    expect(store.ortNachId(ort.id)).toBeUndefined()
  })

  describe('Sortierung der Ortsliste (ADR-0009)', () => {
    it('startet mit der Voreinstellung Bezeichnung aufsteigend, wenn nichts gespeichert ist', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.sortierung).toEqual({ kriterium: 'bezeichnung', richtung: 'aufsteigend' })
    })

    it('übernimmt eine gültig gespeicherte Sortierung beim Laden', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      ladeEinstellungMock.mockResolvedValue({
        status: 'geladen',
        wert: { kriterium: 'gesamtnote', richtung: 'absteigend' },
      })
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.sortierung).toEqual({ kriterium: 'gesamtnote', richtung: 'absteigend' })
    })

    it('fällt bei einem ungültigen gespeicherten Wert still auf die Voreinstellung zurück — ohne Meldung', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      ladeEinstellungMock.mockResolvedValue({
        status: 'geladen',
        wert: { kriterium: 'unbekannt', richtung: 'absteigend' },
      })
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.sortierung).toEqual({ kriterium: 'bezeichnung', richtung: 'aufsteigend' })
    })

    it('setzeSortierKriterium setzt die Anfangsrichtung des neuen Kriteriums und persistiert', () => {
      const store = useOrteStore()

      store.setzeSortierKriterium('geaendertAm')

      expect(store.sortierung).toEqual({ kriterium: 'geaendertAm', richtung: 'absteigend' })
      expect(schreibeEinstellungMock).toHaveBeenCalledWith('orte.sortierung', {
        kriterium: 'geaendertAm',
        richtung: 'absteigend',
      })
    })

    it('setzeSortierKriterium mit dem bereits aktiven Kriterium lässt eine zuvor umgeschaltete Richtung unangetastet', () => {
      const store = useOrteStore()
      store.schalteSortierrichtungUm()
      schreibeEinstellungMock.mockClear()

      store.setzeSortierKriterium('bezeichnung')

      expect(store.sortierung).toEqual({ kriterium: 'bezeichnung', richtung: 'absteigend' })
      expect(schreibeEinstellungMock).not.toHaveBeenCalled()
    })

    it('schalteSortierrichtungUm kehrt die Richtung um, unabhängig vom Kriterium', () => {
      const store = useOrteStore()

      store.schalteSortierrichtungUm()
      expect(store.sortierung.richtung).toBe('absteigend')

      store.schalteSortierrichtungUm()
      expect(store.sortierung.richtung).toBe('aufsteigend')
    })

    it('ein fehlgeschlagenes Schreiben der Sortierung wird nicht gemeldet und bricht nichts ab', () => {
      schreibeEinstellungMock.mockResolvedValue({ status: 'fehlgeschlagen' })
      const store = useOrteStore()

      expect(() => store.setzeSortierKriterium('gesamtnote')).not.toThrow()
      expect(store.sortierung.kriterium).toBe('gesamtnote')
    })

    it('orteGefiltert ist bis PO-2026-09-07-004 die Identität von orte', async () => {
      const store = useOrteStore()
      await store.legeOrtAn('Ausgangsname')

      expect(store.orteGefiltert).toEqual(store.orte)
    })

    it('sortierErgebnis sortiert orteGefiltert nach dem aktuellen Kriterium und trennt „ohne Wert" ab', async () => {
      const store = useOrteStore()
      const mitWert = await store.legeOrtAn('Bewertet')
      await store.legeOrtAn('Unbewertet')
      store.aktualisiereAchse(mitWert.id, 'ambiente', { wert: 7 })
      store.setzeSortierKriterium('ambiente')

      expect(store.sortierErgebnis.mitWert.map((ort) => ort.id)).toEqual([mitWert.id])
      expect(store.sortierErgebnis.ohneWert).toHaveLength(1)
    })
  })

  describe('Tags und Tag-Filter (ADR-0014, PO-2026-09-07-004)', () => {
    it('legt einen neuen Ort mit leeren Tags an', async () => {
      const store = useOrteStore()

      const neuerOrt = await store.legeOrtAn('Ausgangsname')

      expect(neuerOrt.tags).toEqual([])
    })

    it('fuegeTagHinzu ergänzt einen getrimmten Tag im Arbeitsspeicher, kein Schreibvorgang', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      speichereOrtMock.mockClear()

      store.fuegeTagHinzu(ort.id, '  Café  ')

      expect(store.ortNachId(ort.id)?.tags).toEqual(['Café'])
      expect(speichereOrtMock).not.toHaveBeenCalled()
    })

    it('fuegeTagHinzu erzeugt bei Leereingabe still keinen Tag', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')

      store.fuegeTagHinzu(ort.id, '   ')

      expect(store.ortNachId(ort.id)?.tags).toEqual([])
    })

    it('ein erneut eingetippter, bereits vergebener Tag führt zu keinem zweiten Eintrag', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')

      store.fuegeTagHinzu(ort.id, 'pizza')

      expect(store.ortNachId(ort.id)?.tags).toEqual(['Pizza'])
    })

    it('übernimmt bereits im Bestand vergebene Schreibweise bei abweichender Groß-/Kleinschreibung an einem anderen Ort', async () => {
      const store = useOrteStore()
      const ortA = await store.legeOrtAn('Ort A')
      const ortB = await store.legeOrtAn('Ort B')
      store.fuegeTagHinzu(ortA.id, 'Pizza')

      store.fuegeTagHinzu(ortB.id, 'PIZZA')

      expect(store.ortNachId(ortB.id)?.tags).toEqual(['Pizza'])
    })

    it('entferneTagVonOrt entfernt einen Tag case-insensitiv', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')

      store.entferneTagVonOrt(ort.id, 'PIZZA')

      expect(store.ortNachId(ort.id)?.tags).toEqual([])
    })

    it('tagVokabular leitet sich alphabetisch sortiert über alle Orte ab', async () => {
      const store = useOrteStore()
      const ortA = await store.legeOrtAn('Ort A')
      const ortB = await store.legeOrtAn('Ort B')
      store.fuegeTagHinzu(ortA.id, 'Zebra')
      store.fuegeTagHinzu(ortB.id, 'Apfel')

      expect(store.tagVokabular).toEqual(['Apfel', 'Zebra'])
    })

    it('ein Tag am letzten verbliebenen Ort entfernt verschwindet aus Vokabular und aktivem Filter', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')
      store.schalteTagAktiv('Pizza')
      expect(store.aktiveTags).toEqual(['Pizza'])

      store.entferneTagVonOrt(ort.id, 'Pizza')

      expect(store.tagVokabular).toEqual([])
      expect(store.aktiveTags).toEqual([])
    })

    it('startet mit der Voreinstellung UND, wenn keine Verknüpfung gespeichert ist', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.tagfilterEinstellung).toEqual({ verknuepfung: 'und' })
    })

    it('übernimmt eine gültig gespeicherte Verknüpfung beim Laden', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      ladeEinstellungMock.mockImplementation((schluessel: string) =>
        schluessel === 'orte.tagfilter'
          ? Promise.resolve({ status: 'geladen', wert: { verknuepfung: 'oder' } })
          : Promise.resolve({ status: 'nicht_vorhanden' }),
      )
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.tagfilterEinstellung).toEqual({ verknuepfung: 'oder' })
    })

    it('fällt bei einer fehlenden/ungültigen gespeicherten Verknüpfung still auf UND zurück', async () => {
      ladeAlleOrteMock.mockResolvedValue({ status: 'geladen', orte: [] })
      ladeEinstellungMock.mockImplementation((schluessel: string) =>
        schluessel === 'orte.tagfilter'
          ? Promise.resolve({ status: 'geladen', wert: { verknuepfung: 'xor' } })
          : Promise.resolve({ status: 'nicht_vorhanden' }),
      )
      const store = useOrteStore()

      await store.sicherstellenGeladen()

      expect(store.tagfilterEinstellung).toEqual({ verknuepfung: 'und' })
    })

    it('setzeTagVerknuepfung ändert die Verknüpfung und persistiert sie, die Auswahl bleibt erhalten', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')
      store.schalteTagAktiv('Pizza')

      store.setzeTagVerknuepfung('oder')

      expect(store.tagfilterEinstellung).toEqual({ verknuepfung: 'oder' })
      expect(store.aktiveTags).toEqual(['Pizza'])
      expect(schreibeEinstellungMock).toHaveBeenCalledWith('orte.tagfilter', { verknuepfung: 'oder' })
    })

    it('schalteTagAktiv schaltet einen Tag im Filter an und wieder aus', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')

      store.schalteTagAktiv('Pizza')
      expect(store.aktiveTags).toEqual(['Pizza'])

      store.schalteTagAktiv('Pizza')
      expect(store.aktiveTags).toEqual([])
    })

    it('entferneTagAusFilter entfernt genau einen Tag, die übrigen bleiben aktiv', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')
      store.fuegeTagHinzu(ort.id, 'Pasta')
      store.schalteTagAktiv('Pizza')
      store.schalteTagAktiv('Pasta')

      store.entferneTagAusFilter('Pizza')

      expect(store.aktiveTags).toEqual(['Pasta'])
    })

    it('setzeTagfilterZurueck leert die Auswahl, die Verknüpfung bleibt unverändert', async () => {
      const store = useOrteStore()
      const ort = await store.legeOrtAn('Ausgangsname')
      store.fuegeTagHinzu(ort.id, 'Pizza')
      store.schalteTagAktiv('Pizza')
      store.setzeTagVerknuepfung('oder')

      store.setzeTagfilterZurueck()

      expect(store.aktiveTags).toEqual([])
      expect(store.tagfilterEinstellung).toEqual({ verknuepfung: 'oder' })
    })

    it('orteGefiltert wendet UND/ODER auf die aktive Tag-Auswahl an', async () => {
      const store = useOrteStore()
      const beide = await store.legeOrtAn('Beide Tags')
      const nurPizza = await store.legeOrtAn('Nur Pizza')
      const keiner = await store.legeOrtAn('Kein Tag')
      store.fuegeTagHinzu(beide.id, 'Pizza')
      store.fuegeTagHinzu(beide.id, 'Pasta')
      store.fuegeTagHinzu(nurPizza.id, 'Pizza')
      store.schalteTagAktiv('Pizza')
      store.schalteTagAktiv('Pasta')

      expect(store.orteGefiltert.map((ort) => ort.id)).toEqual([beide.id])

      store.setzeTagVerknuepfung('oder')

      expect(store.orteGefiltert.map((ort) => ort.id).sort()).toEqual([beide.id, nurPizza.id].sort())
      expect(store.orteGefiltert.some((ort) => ort.id === keiner.id)).toBe(false)
    })

    it('orteGefiltert liefert alle Orte bei leerer Tag-Auswahl', async () => {
      const store = useOrteStore()
      await store.legeOrtAn('A')
      await store.legeOrtAn('B')

      expect(store.orteGefiltert).toHaveLength(2)
    })
  })
})
