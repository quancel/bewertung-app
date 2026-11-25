// @vitest-environment jsdom
/**
 * Component-Spec für den Emit-Vertrag von `GewichtungSheet.vue` (ADR-0027,
 * PO-2026-11-24-002) — nicht für Sichtbarkeit/Trefferfläche/Thumb-Darstellung,
 * die bleiben dem Rauchtest vorbehalten (ADR-0027 Punkt 4).
 *
 * Gegenstand: welches Ereignis am Regler bzw. Zahlenfeld löst welches Emit aus
 * („eine Bedienung genügt": jedes `input` committet, kein Enter), dass ein
 * geleertes Zahlenfeld NIE committet und beim Verlassen zum bisherigen Wert
 * zurückkehrt, und was die letzte Achse über 0 zeigt. Das Gate selbst
 * (Klemmen, „muss zählen") ist reine Logik und steht in `lib/gewichtung.spec.ts`.
 * `Teleport` ist ersetzt, damit der Inhalt des Sheets im gemounteten Baum steht.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Gewichte } from '../model/ansicht'
import GewichtungSheet from './GewichtungSheet.vue'

const EINS: Gewichte = { ambiente: 1, zeit: 1, geschmack: 1, preisLeistung: 1 }

function mounte(teil: Partial<{ szenario: string; eigeneGewichte: Gewichte; mussZaehlenHinweis: boolean }> = {}) {
  return mount(GewichtungSheet, {
    props: { offen: true, szenario: 'eigene', eigeneGewichte: EINS, mussZaehlenHinweis: false, ...teil } as never,
    global: { stubs: { Teleport: true } },
  })
}

/** jsdom kennt kein `PointerEvent`: ein `MouseEvent` mit dem Typnamen genügt dem Handler. */
function zeiger(ziel: Element, typ: string, clientX: number): void {
  ziel.dispatchEvent(new MouseEvent(typ, { clientX, bubbles: true }))
}

describe('GewichtungSheet: Szenarioliste', () => {
  it('zeigt sechs Szenarien, „Eigene" zuletzt', () => {
    const sheet = mounte({ szenario: 'ausgewogen' })
    const namen = sheet.findAll('.gewichtung-sheet__name').map((knoten) => knoten.text())
    expect(namen).toEqual([
      'Ausgewogen',
      'Fokus Geschmack',
      'Fokus Ambiente',
      'Fokus Preis-Leistung',
      'Fokus Zeit',
      'Eigene',
    ])
  })

  it('ein festes Szenario meldet die Wahl UND schließt das Sheet', async () => {
    const sheet = mounte({ szenario: 'ausgewogen' })
    await sheet.findAll('.gewichtung-sheet__eintrag')[1]!.trigger('click')
    expect(sheet.emitted('szenario-gewaehlt')).toEqual([['fokus-geschmack']])
    expect(sheet.emitted('schliessen')).toHaveLength(1)
  })

  it('„Eigene" meldet die Wahl und lässt das Sheet OFFEN', async () => {
    const sheet = mounte({ szenario: 'ausgewogen' })
    await sheet.findAll('.gewichtung-sheet__eintrag')[5]!.trigger('click')
    expect(sheet.emitted('szenario-gewaehlt')).toEqual([['eigene']])
    expect(sheet.emitted('schliessen')).toBeUndefined()
  })

  it('der Gewichtsblock steht nur bei „Eigene" im Baum', () => {
    expect(mounte({ szenario: 'fokus-zeit' }).findAll('.gewicht-zeile')).toHaveLength(0)
    expect(mounte({ szenario: 'eigene' }).findAll('.gewicht-zeile')).toHaveLength(4)
  })
})

describe('GewichtungSheet: eigene Gewichte', () => {
  it('ein Regler-`input` committet sofort die Zahl dieser Achse', async () => {
    const sheet = mounte()
    const regler = sheet.findAll('.gewicht-zeile')[2]!.find('input[type="range"]')
    ;(regler.element as HTMLInputElement).value = '8'
    await regler.trigger('input')
    expect(sheet.emitted('gewicht-geaendert')).toEqual([['geschmack', 8]])
  })

  it('ein Zahlenfeld-`input` committet ohne Enter und ohne Feldwechsel', async () => {
    const sheet = mounte()
    const feld = sheet.findAll('.gewicht-zeile')[1]!.find('input[type="number"]')
    await feld.setValue('6')
    expect(sheet.emitted('gewicht-geaendert')).toEqual([['zeit', 6]])
  })

  it('ein geleertes Zahlenfeld committet nichts und kehrt beim Verlassen zum bisherigen Wert zurück', async () => {
    const sheet = mounte({ eigeneGewichte: { ambiente: 4, zeit: 1, geschmack: 1, preisLeistung: 1 } })
    const feld = sheet.findAll('.gewicht-zeile')[0]!.find('input[type="number"]')
    await feld.setValue('')
    expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
    expect((feld.element as HTMLInputElement).value).toBe('')
    await feld.trigger('blur')
    expect((feld.element as HTMLInputElement).value).toBe('4')
    expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
  })

  it('das Zahlenfeld zeigt nach dem Commit den Wert, den der Store zurückgibt (Gate)', async () => {
    const sheet = mounte()
    const feld = sheet.findAll('.gewicht-zeile')[3]!.find('input[type="number"]')
    await feld.setValue('99')
    // Die View hat das Gate befragt und die Prop auf 10 gesetzt.
    await sheet.setProps({ eigeneGewichte: { ...EINS, preisLeistung: 10 } })
    expect((feld.element as HTMLInputElement).value).toBe('10')
  })

  it('zeigt den Anteil je Achse, bei Gewicht 0 „zählt nicht"', () => {
    const sheet = mounte({ eigeneGewichte: { ambiente: 0, zeit: 1, geschmack: 1, preisLeistung: 1 } })
    const anteile = sheet.findAll('.gewicht-zeile__anteil').map((knoten) => knoten.text())
    expect(anteile).toEqual(['zählt nicht', '33 %', '33 %', '33 %'])
  })

  it('die einzige zählende Achse zeigt „100 % · muss zählen" und ihr Regler hat min=1', () => {
    const sheet = mounte({ eigeneGewichte: { ambiente: 0, zeit: 0, geschmack: 5, preisLeistung: 0 } })
    const zeilen = sheet.findAll('.gewicht-zeile')
    expect(zeilen[2]!.find('.gewicht-zeile__anteil').text()).toBe('100 % · muss zählen')
    expect(zeilen[2]!.find('input[type="range"]').attributes('min')).toBe('1')
    expect(zeilen[0]!.find('input[type="range"]').attributes('min')).toBe('0')
    expect(zeilen[0]!.find('.gewicht-zeile__anteil').text()).toBe('zählt nicht')
  })

  it('die Statuszeile (role=status) trägt den Text nur bei gesetztem Hinweis', async () => {
    const sheet = mounte()
    const status = sheet.find('[role="status"]')
    expect(status.text()).toBe('')
    await sheet.setProps({ mussZaehlenHinweis: true })
    expect(sheet.find('[role="status"]').text()).toBe('Mindestens eine Achse muss zählen.')
  })

  describe('Versuch am Regler der letzten zählenden Achse', () => {
    const NUR_GESCHMACK: Gewichte = { ambiente: 0, zeit: 0, geschmack: 1, preisLeistung: 0 }
    const reglerGeschmack = (sheet: ReturnType<typeof mounte>) =>
      sheet.findAll('.gewicht-zeile')[2]!.find('input[type="range"]')

    it.each(['ArrowLeft', 'ArrowDown', 'Home', 'PageDown'])('%s am Minimum meldet 0 (das Gate klemmt)', async (key) => {
      const sheet = mounte({ eigeneGewichte: NUR_GESCHMACK })
      await reglerGeschmack(sheet).trigger('keydown', { key })
      expect(sheet.emitted('gewicht-geaendert')).toEqual([['geschmack', 0]])
    })

    it('Pfeil rechts und andere Tasten melden nichts', async () => {
      const sheet = mounte({ eigeneGewichte: NUR_GESCHMACK })
      await reglerGeschmack(sheet).trigger('keydown', { key: 'ArrowRight' })
      await reglerGeschmack(sheet).trigger('keydown', { key: 'End' })
      expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
    })

    it('Pfeil links über dem Minimum meldet keinen Versuch (das `input` übernimmt)', async () => {
      const sheet = mounte({ eigeneGewichte: { ...NUR_GESCHMACK, geschmack: 5 } })
      await reglerGeschmack(sheet).trigger('keydown', { key: 'ArrowLeft' })
      expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
    })

    it('eine Achse, die nicht die letzte zählende ist, meldet bei Pos1 nichts', async () => {
      const sheet = mounte()
      await sheet.findAll('.gewicht-zeile')[0]!.find('input[type="range"]').trigger('keydown', { key: 'Home' })
      expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
    })

    it('Ziehen nach links bis an den Bahnrand meldet 0, bloßes Greifen und Loslassen nicht', async () => {
      const sheet = mounte({ eigeneGewichte: NUR_GESCHMACK })
      const regler = reglerGeschmack(sheet)
      regler.element.getBoundingClientRect = () => ({ left: 100 }) as DOMRect
      zeiger(regler.element, 'pointerdown', 112)
      zeiger(regler.element, 'pointerup', 112)
      expect(sheet.emitted('gewicht-geaendert')).toBeUndefined()
      zeiger(regler.element, 'pointerdown', 112)
      zeiger(regler.element, 'pointermove', 60)
      expect(sheet.emitted('gewicht-geaendert')).toEqual([['geschmack', 0]])
      zeiger(regler.element, 'pointerup', 60)
      zeiger(regler.element, 'pointermove', 50)
      expect(sheet.emitted('gewicht-geaendert')).toHaveLength(1)
    })
  })
})
