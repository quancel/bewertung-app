/**
 * Generische Lese-/Schreib-API für den Object Store `einstellungen`
 * (ADR-0004, ADR-0006, ADR-0009). Kennt keine einzelne Einstellung
 * inhaltlich — Typ, Voreinstellung und Prüffunktion liegen je Einstellung
 * im besitzenden Feature (`model/ansicht.ts`, z. B.
 * `features/orte/model/ansicht.ts`).
 *
 * Der Store ist ohne `keyPath` angelegt (out-of-line keys, siehe `db.ts`):
 * der Schlüssel wird bei `get`/`put` mitgegeben, nicht aus dem Wert
 * gelesen.
 *
 * Andere Leseregel als `orte-repository.ts`: Ein fehlender oder
 * unbekannter Schlüssel ist hier kein Fehlerfall, sondern der erwartete
 * Normalfall (ADR-0009 Punkt 5) — ob ein gelesener Wert *gültig* ist,
 * prüft und entscheidet ausschließlich der Aufrufer über seine eigene
 * Prüffunktion; dieses Modul reicht ihn unverändert durch.
 *
 * Ein fehlgeschlagenes Schreiben wird dem Nutzer nicht gemeldet und bricht
 * nichts ab (ADR-0009 Punkt 6) — `schreibeEinstellung` liefert dennoch ein
 * Ergebnis zurück, ohne dass ein Aufrufer verpflichtet wäre, es
 * auszuwerten.
 */
import { oeffneDatenbank } from './db'

export type LadeEinstellungErgebnis =
  | { status: 'geladen'; wert: unknown }
  | { status: 'nicht_vorhanden' }
  | { status: 'speicher_nicht_verfuegbar' }

export type SchreibeEinstellungErgebnis =
  | { status: 'geschrieben' }
  | { status: 'fehlgeschlagen' }

export async function ladeEinstellung(schluessel: string): Promise<LadeEinstellungErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'speicher_nicht_verfuegbar' }
  }

  try {
    const wert = await geoeffnet.db.get('einstellungen', schluessel)
    if (wert === undefined) return { status: 'nicht_vorhanden' }
    return { status: 'geladen', wert }
  } catch {
    return { status: 'speicher_nicht_verfuegbar' }
  }
}

export async function schreibeEinstellung(
  schluessel: string,
  wert: unknown,
): Promise<SchreibeEinstellungErgebnis> {
  const geoeffnet = await oeffneDatenbank()
  if (geoeffnet.status === 'speicher_nicht_verfuegbar') {
    return { status: 'fehlgeschlagen' }
  }

  try {
    await geoeffnet.db.put('einstellungen', wert, schluessel)
    return { status: 'geschrieben' }
  } catch {
    return { status: 'fehlgeschlagen' }
  }
}
