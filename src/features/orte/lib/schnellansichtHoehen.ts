/**
 * Reine Höhenlogik der Schnellansicht (PO-2026-11-24-005, design-conventions.md
 * „Karte: Quick-Look-Sheet"): drei Zustände, ihre Höhen aus der Höhe des
 * Kartenbereichs und das Einrasten nach einer Ziehgeste. Kein DOM, kein Router
 * — `Schnellansicht.vue` misst und rendert, diese Datei rechnet (und ist
 * deshalb unter `environment: 'node'` testbar).
 */
export type SchnellansichtZustand = 'eingeklappt' | 'halb' | 'voll'

export interface SchnellansichtHoehen {
  eingeklappt: number
  halb: number
  voll: number
}

/** Eingeklappt: Griff + eine Zeile (design-conventions.md). */
export const HOEHE_EINGEKLAPPT = 80
/** Halb: 50 % des Kartenbereichs, mindestens so hoch. */
export const HOEHE_HALB_MINIMUM = 280
/** Voll: Kartenbereich minus ein Streifen Karte oben. */
export const ABSTAND_VOLL_OBEN = 56
/** Wischtempo (px/ms), ab dem in Wischrichtung eingerastet wird statt zum nächstgelegenen. */
export const SCHNAPP_TEMPO_PX_PRO_MS = 0.5

/** Flick-Mindestweg (wie `WISCH_MIN_WEG_TEMPO_PX` in `Bildvorschau.vue`). */
export const FLICK_MIN_WEG_PX = 10

export const SCHNELLANSICHT_ZUSTAENDE: readonly SchnellansichtZustand[] = ['eingeklappt', 'halb', 'voll']

/** Höhen der drei Zustände bei gegebener Höhe `bereich` des Kartenbereichs;
 * `eingeklappt <= halb <= voll` gilt auch bei sehr kleinem Bereich. */
export function bestimmeHoehen(bereich: number): SchnellansichtHoehen {
  const voll = Math.max(bereich - ABSTAND_VOLL_OBEN, HOEHE_EINGEKLAPPT)
  const halb = Math.min(Math.max(Math.round(bereich / 2), HOEHE_HALB_MINIMUM), voll)
  return { eingeklappt: HOEHE_EINGEKLAPPT, halb, voll }
}

/**
 * Zustand nach dem Loslassen. `hoehe` ist die aktuelle Höhe, `tempo` die
 * Geschwindigkeit der Höhenänderung in px/ms (positiv = wächst). Langsam: der
 * nächstgelegene Zustand. Schneller als `SCHNAPP_TEMPO_PX_PRO_MS`: der nächste
 * Zustand in Wischrichtung (der kleinste größere bzw. größte kleinere), am Ende
 * der Skala der äußerste. Beträgt der Weg der Geste (`weg`, px, Betrag) weniger
 * als `FLICK_MIN_WEG_PX`, wird das Tempo ignoriert (design-conventions.md
 * „Zieh- und Wisch-Schwellen"): ein 5px-Zug in 8ms ist kein Flick. Ohne `weg`
 * gilt kein Mindestweg.
 */
export function rasteEin(
  hoehe: number,
  hoehen: SchnellansichtHoehen,
  tempo: number,
  weg: number = Number.POSITIVE_INFINITY,
): SchnellansichtZustand {
  const kandidaten = SCHNELLANSICHT_ZUSTAENDE.map((zustand) => ({ zustand, hoehe: hoehen[zustand] }))
  if (weg >= FLICK_MIN_WEG_PX && Math.abs(tempo) > SCHNAPP_TEMPO_PX_PRO_MS) {
    if (tempo > 0) return kandidaten.find((k) => k.hoehe > hoehe + 1)?.zustand ?? 'voll'
    return [...kandidaten].reverse().find((k) => k.hoehe < hoehe - 1)?.zustand ?? 'eingeklappt'
  }
  let naechster = kandidaten[0]!
  for (const k of kandidaten) {
    if (Math.abs(k.hoehe - hoehe) < Math.abs(naechster.hoehe - hoehe)) naechster = k
  }
  return naechster.zustand
}

/** Griff-Button (Enter/Leertaste/Tipp): nächstgrößerer Zustand, aus „voll" zurück auf „halb". */
export function zustandNachGriffAktivierung(zustand: SchnellansichtZustand): SchnellansichtZustand {
  if (zustand === 'eingeklappt') return 'halb'
  if (zustand === 'halb') return 'voll'
  return 'halb'
}

/** Pfeil hoch: einen Zustand größer (am Ende unverändert). */
export function zustandGroesser(zustand: SchnellansichtZustand): SchnellansichtZustand {
  return zustand === 'eingeklappt' ? 'halb' : 'voll'
}

/** Pfeil runter: einen Zustand kleiner (am Anfang unverändert). */
export function zustandKleiner(zustand: SchnellansichtZustand): SchnellansichtZustand {
  return zustand === 'voll' ? 'halb' : 'eingeklappt'
}

/** Begrenzt eine gezogene Höhe auf den erlaubten Bereich. */
export function begrenzeHoehe(hoehe: number, hoehen: SchnellansichtHoehen): number {
  return Math.min(Math.max(hoehe, hoehen.eingeklappt), hoehen.voll)
}
