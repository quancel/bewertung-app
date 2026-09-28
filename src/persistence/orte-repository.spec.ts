import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { oeffneDatenbank, _resetFuerTests as resetDb } from './db'
import { speichereOrt, loescheOrt, ladeAlleOrte } from './orte-repository'
import type { OrtDatensatz } from './schema'

function beispielOrt(teil: Partial<OrtDatensatz> = {}): OrtDatensatz {
  return {
    id: 'ort-1',
    bezeichnung: 'Café Sonnenschein',
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

/** Leert alle Stores, statt die Datenbank zu löschen (vermeidet das
 * `blocked`-Event von `deleteDatabase`, solange eine Verbindung offen ist). */
async function raeumeStoresAuf(): Promise<void> {
  resetDb()
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
  await geoeffnet.db.clear('meta')
  await geoeffnet.db.clear('orte')
  await geoeffnet.db.clear('einstellungen')
  await geoeffnet.db.clear('bilder')
}

describe('orte-repository', () => {
  beforeEach(async () => {
    await raeumeStoresAuf()
  })

  afterEach(async () => {
    await raeumeStoresAuf()
  })

  it('liefert eine leere Liste aus einer frischen Datenbank', async () => {
    const ergebnis = await ladeAlleOrte()

    expect(ergebnis).toEqual({ status: 'geladen', orte: [] })
  })

  it('speichert einen Ort vollständig und lädt ihn unverändert zurück', async () => {
    const ort = beispielOrt()

    const schreibErgebnis = await speichereOrt(ort)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis).toEqual({ status: 'geladen', orte: [ort] })
  })

  it('serialisiert angestaute Schreibvorgänge je Ort-ID — der letzte Stand gewinnt', async () => {
    const ersterLauf = speichereOrt(beispielOrt({ bezeichnung: 'Erster Stand' }))
    const zweiterLauf = speichereOrt(beispielOrt({ bezeichnung: 'Zweiter Stand' }))

    await Promise.all([ersterLauf, zweiterLauf])

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis.status).toBe('geladen')
    if (ladeErgebnis.status === 'geladen') {
      expect(ladeErgebnis.orte).toHaveLength(1)
      expect(ladeErgebnis.orte[0]?.bezeichnung).toBe('Zweiter Stand')
    }
  })

  it('löscht einen Ort — danach ist er nicht mehr in der Liste', async () => {
    const ort = beispielOrt()
    await speichereOrt(ort)

    const loeschErgebnis = await loescheOrt(ort.id)
    expect(loeschErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis).toEqual({ status: 'geladen', orte: [] })
  })

  it('löscht einen Ort kaskadierend samt aller seiner Bilder, andere Orte bleiben unangetastet (ADR-0004 Punkt 8, ADR-0016 Punkt 8)', async () => {
    const ortA = beispielOrt({ id: 'ort-a' })
    const ortB = beispielOrt({ id: 'ort-b' })
    await speichereOrt(ortA)
    await speichereOrt(ortB)

    const geoeffnet = await oeffneDatenbank()
    if (geoeffnet.status !== 'geoeffnet') throw new Error('Datenbank hätte offen sein müssen')
    await geoeffnet.db.put('bilder', {
      id: 'bild-a1',
      ortId: 'ort-a',
      hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
      mimeTyp: 'image/webp',
      breite: 4,
      hoehe: 4,
      blob: new Blob(['x'], { type: 'image/webp' }),
    })
    await geoeffnet.db.put('bilder', {
      id: 'bild-a2',
      ortId: 'ort-a',
      hinzugefuegtAm: '2026-09-10T09:00:00.000Z',
      mimeTyp: 'image/webp',
      breite: 4,
      hoehe: 4,
      blob: new Blob(['y'], { type: 'image/webp' }),
    })
    await geoeffnet.db.put('bilder', {
      id: 'bild-b1',
      ortId: 'ort-b',
      hinzugefuegtAm: '2026-09-10T08:00:00.000Z',
      mimeTyp: 'image/webp',
      breite: 4,
      hoehe: 4,
      blob: new Blob(['z'], { type: 'image/webp' }),
    })

    const loeschErgebnis = await loescheOrt('ort-a')
    expect(loeschErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis.status).toBe('geladen')
    if (ladeErgebnis.status === 'geladen') {
      expect(ladeErgebnis.orte.map((eintrag) => eintrag.id)).toEqual(['ort-b'])
    }

    const verbleibendeBilder = await geoeffnet.db.getAll('bilder')
    expect(verbleibendeBilder.map((bild) => bild.id)).toEqual(['bild-b1'])
  })

  it('speichert einen Ort, wie ihn der Pinia-Store tatsächlich übergibt — als reaktives Objekt (ADR-0023 Punkt 3, PO-2026-09-12-001)', async () => {
    // `useOrteStore` hält `orte` in einem `ref`; `ortNachId` liefert deshalb
    // im Betrieb kein einfaches Objekt, sondern eines hinter einem
    // Vue-Reaktivitäts-Proxy — auch für nur teilweise neu zusammengesetzte
    // Achsen (siehe `aktualisiereAchse`). Dieser Test benutzt das ECHTE
    // Repository gegen `fake-indexeddb`, keinen Mock.
    const reaktiverOrt = reactive(beispielOrt())
    const teilweiseNeuZusammengesetzt = {
      ...reaktiverOrt,
      bewertungen: {
        ...reaktiverOrt.bewertungen,
        ambiente: { ...reaktiverOrt.bewertungen.ambiente, wert: 7 },
      },
    }

    const schreibErgebnis = await speichereOrt(teilweiseNeuZusammengesetzt)
    expect(schreibErgebnis).toEqual({ status: 'geschrieben' })

    const ladeErgebnis = await ladeAlleOrte()
    expect(ladeErgebnis.status).toBe('geladen')
    if (ladeErgebnis.status === 'geladen') {
      expect(ladeErgebnis.orte).toEqual([
        { ...beispielOrt(), bewertungen: { ...beispielOrt().bewertungen, ambiente: { wert: 7, kommentar: null } } },
      ])
    }
  })

  it(
    'committet den Schreibvorgang direkt nach put() — nur Microtasks dazwischen, keine Task-Grenze (ADR-0031 Punkt 2, Rückläufer PO-2026-09-26-001)',
    async () => {
      // Rot-Nachweis (ADR-0027 Punkt 8): Vor dieser Härtung rief
      // `tatsaechlichSpeichern` die `db.put(...)`-Kurzform auf, die NIE
      // `IDBTransaction.prototype.commit` aufruft — dieser Test hätte den
      // `commitSpy` nie invoziert gesehen und wäre an der
      // `commitSpy`-Prüfung gescheitert.
      const reihenfolge: string[] = []

      // `vi.spyOn` ruft ohne eigene `mockImplementation` transparent durch —
      // hier bewusst MIT `mockImplementation`, die selbst noch die
      // ursprüngliche Implementierung aufruft, weil wir den exakten
      // Aufrufzeitpunkt (vor/nach der Task-Grenze) protokollieren wollen,
      // ohne das tatsächliche Verhalten zu verändern.
      const putOriginal = globalThis.IDBObjectStore.prototype.put
      const putSpy = vi
        .spyOn(globalThis.IDBObjectStore.prototype, 'put')
        .mockImplementation(function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
          reihenfolge.push('put')
          return putOriginal.apply(this, args)
        })

      const commitOriginal = globalThis.IDBTransaction.prototype.commit
      const commitSpy = vi
        .spyOn(globalThis.IDBTransaction.prototype, 'commit')
        .mockImplementation(function (this: IDBTransaction) {
          reihenfolge.push('commit')
          return commitOriginal.apply(this)
        })

      try {
        // Eine ECHTE Task-Grenze (setTimeout), VOR dem Schreibaufruf
        // eingeplant — läuft nach der Spezifikation garantiert erst, nachdem
        // die Microtask-Warteschlange vollständig abgearbeitet ist. `put()`
        // und `commit()` liegen beide auf dem Microtask-Weg zwischen
        // `speichereOrt()` und dem eigentlichen IndexedDB-Aufruf (der
        // `.then()` der Warteschlange plus das `await oeffneDatenbank()` auf
        // die bereits gecachte Verbindung) — sie MÜSSEN also vor diesem
        // Marker in `reihenfolge` erscheinen, wenn Punkt 2 hält.
        let schreibErgebnis: ReturnType<typeof speichereOrt> | undefined
        await new Promise<void>((fertig) => {
          setTimeout(() => {
            reihenfolge.push('task-grenze')
            fertig()
          }, 0)
          schreibErgebnis = speichereOrt(beispielOrt())
        })
        // Den eigentlichen Schreibvorgang sauber zu Ende laufen lassen, statt
        // ihn über das Testende hinaus offen zu lassen (der Store schreibt
        // in denselben, testübergreifend genutzten `fake-indexeddb`-Zustand).
        await schreibErgebnis

        const putIndex = reihenfolge.indexOf('put')
        const commitIndex = reihenfolge.indexOf('commit')
        const taskGrenzeIndex = reihenfolge.indexOf('task-grenze')

        expect(commitIndex, `commit() wurde nicht aufgerufen (Reihenfolge: ${reihenfolge.join(', ')})`).toBeGreaterThanOrEqual(0)
        expect(putIndex, `put() wurde nicht aufgerufen (Reihenfolge: ${reihenfolge.join(', ')})`).toBeGreaterThanOrEqual(0)
        // Kernaussage von ADR-0031 Punkt 2: commit() liegt VOR der
        // Task-Grenze — trägt das Microtask-Scheduling von `fake-indexeddb`
        // diese Aussage in einem künftigen Lauf nicht mehr, schlägt genau
        // diese Zeile fehl (siehe Bericht).
        expect(commitIndex).toBeLessThan(taskGrenzeIndex)
        expect(putIndex).toBeLessThan(taskGrenzeIndex)
      } finally {
        putSpy.mockRestore()
        commitSpy.mockRestore()
      }
    },
  )

  it('meldet "speicher_nicht_verfuegbar", wenn die Datenbank nicht geöffnet werden kann', async () => {
    const echtesIndexedDB = globalThis.indexedDB
    resetDb()
    // @ts-expect-error -- bewusst kaputtmachen, um den Sperrzustand auszulösen
    globalThis.indexedDB = undefined

    try {
      const ergebnis = await ladeAlleOrte()
      expect(ergebnis).toEqual({ status: 'speicher_nicht_verfuegbar' })
    } finally {
      globalThis.indexedDB = echtesIndexedDB
      resetDb()
    }
  })
})
