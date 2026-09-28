import { describe, expect, it } from 'vitest'
import { ANFANGSNOTIZ_MAX_ZEICHEN, normalisiereAnfangsnotiz } from './anfangsnotiz'

describe('normalisiereAnfangsnotiz', () => {
  it('lässt einen kurzen, einzeiligen Text unverändert', () => {
    expect(normalisiereAnfangsnotiz('Sehr gemütlich')).toBe('Sehr gemütlich')
  })

  it('leert zu null bei leerem Text', () => {
    expect(normalisiereAnfangsnotiz('')).toBeNull()
  })

  it('leert zu null bei reinem Leerraum (kein Trim des Ergebnisses selbst, nur zur Leer-Prüfung)', () => {
    expect(normalisiereAnfangsnotiz('   ')).toBeNull()
  })

  it('behält tippbare Leerzeichen am Rand — kein Trim des Rückgabewerts', () => {
    expect(normalisiereAnfangsnotiz('Text ')).toBe('Text ')
    expect(normalisiereAnfangsnotiz(' Text')).toBe(' Text')
  })

  it('fasst einen Lauf von \\n zu einem Leerzeichen zusammen', () => {
    expect(normalisiereAnfangsnotiz('Zeile1\nZeile2')).toBe('Zeile1 Zeile2')
    expect(normalisiereAnfangsnotiz('Zeile1\n\n\nZeile2')).toBe('Zeile1 Zeile2')
  })

  it('fasst \\r\\n als EINEN Lauf zusammen, nicht als zwei Leerzeichen', () => {
    expect(normalisiereAnfangsnotiz('Zeile1\r\nZeile2')).toBe('Zeile1 Zeile2')
  })

  it('behandelt \\r, U+2028, U+2029, U+0085, \\v und \\f ebenfalls als Zeilenumbruch', () => {
    expect(normalisiereAnfangsnotiz('a\rb')).toBe('a b')
    expect(normalisiereAnfangsnotiz('a\u2028b')).toBe('a b')
    expect(normalisiereAnfangsnotiz('a\u2029b')).toBe('a b')
    expect(normalisiereAnfangsnotiz('a\u0085b')).toBe('a b')
    expect(normalisiereAnfangsnotiz('a\vb')).toBe('a b')
    expect(normalisiereAnfangsnotiz('a\fb')).toBe('a b')
  })

  it('kürzt auf ANFANGSNOTIZ_MAX_ZEICHEN (100) UTF-16-Codeeinheiten', () => {
    const text = 'a'.repeat(150)
    const ergebnis = normalisiereAnfangsnotiz(text)
    expect(ergebnis).toHaveLength(ANFANGSNOTIZ_MAX_ZEICHEN)
    expect(ergebnis).toBe('a'.repeat(100))
  })

  it('lässt genau 100 Zeichen unangetastet', () => {
    const text = 'a'.repeat(ANFANGSNOTIZ_MAX_ZEICHEN)
    expect(normalisiereAnfangsnotiz(text)).toBe(text)
  })

  it('zerschneidet beim Kürzen kein Surrogatpaar (Emoji an der Grenze)', () => {
    // 99 ASCII-Zeichen + ein Emoji (2 UTF-16-Codeeinheiten) an Position 99/100:
    // ein Schnitt bei exakt 100 würde das führende Surrogat abtrennen.
    const text = 'a'.repeat(99) + '😀' + 'weiterer Text'
    const ergebnis = normalisiereAnfangsnotiz(text)!
    // Das komplette Surrogatpaar bleibt entweder ganz drin oder ganz draußen —
    // nie ein einzelnes, verwaistes Surrogat am Ende.
    const letzteEinheit = ergebnis.charCodeAt(ergebnis.length - 1)
    const istVerwaistesFuehrendesSurrogat = letzteEinheit >= 0xd800 && letzteEinheit <= 0xdbff
    expect(istVerwaistesFuehrendesSurrogat).toBe(false)
    expect(ergebnis.length).toBeLessThanOrEqual(ANFANGSNOTIZ_MAX_ZEICHEN)
  })

  it('kürzt NACH dem Zusammenfassen der Zeilenumbrüche, nicht davor', () => {
    // Roh 102 Zeichen (100 'a' + \n + 'b'); nach Normalisierung des \n zu
    // einem Leerzeichen sind es weiterhin 102 Zeichen vor dem Kürzen — Kürzung
    // greift auf das bereits umbruchfreie Ergebnis.
    const text = 'a'.repeat(100) + '\n' + 'b'
    const ergebnis = normalisiereAnfangsnotiz(text)
    expect(ergebnis).toBe('a'.repeat(100))
    expect(ergebnis).not.toContain('\n')
  })
})
