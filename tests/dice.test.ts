import { describe, expect, it } from 'vitest'
import { lockedCount, resolveDice, threatBand } from '../src/engine'
import type { Die } from '../src/engine'

function openDice(count = 3): Die[] {
  return Array.from({ length: count }, () => ({ value: 0, locked: false }))
}

function roll(dice: Die[], rolls: number[], candleLit = false, candleAbsorbs = false) {
  return resolveDice({
    dice,
    rolls,
    candleLit,
    candleAbsorbs,
    devilAt: 3,
    specialDiceEffects: false,
  })
}

describe('bloqueo de seises', () => {
  it('traba cada 6 natural y deja libres las otras caras', () => {
    const resolved = roll(openDice(), [6, 2, 6])
    expect(resolved.dice.map((die) => die.locked)).toEqual([true, false, true])
    expect(resolved.dice.map((die) => die.value)).toEqual([6, 2, 6])
    expect(resolved.lockedCount).toBe(2)
    expect(resolved.devil).toBe(false)
    expect(resolved.absorbedIndex).toBeNull()
  })

  it('no vuelve a tirar un dado ya bloqueado', () => {
    const start: Die[] = [
      { value: 6, locked: true },
      { value: 0, locked: false },
      { value: 0, locked: false },
    ]
    const resolved = roll(start, [4, 6])
    expect(resolved.dice[0]).toEqual({ value: 6, locked: true })
    expect(resolved.dice[1]).toEqual({ value: 4, locked: false })
    expect(resolved.dice[2]).toEqual({ value: 6, locked: true })
    expect(resolved.lockedCount).toBe(2)
  })

  it('rechaza una cantidad de tiradas que no calza', () => {
    expect(() => roll(openDice(), [1, 2])).toThrow(/tiradas/)
    expect(() => roll(openDice(), [1, 2, 3, 4])).toThrow(/tiradas/)
  })

  it('un doble o un triple no hace nada si los efectos especiales están apagados', () => {
    const plain = roll(openDice(), [2, 2, 2])
    expect(plain.lockedCount).toBe(0)
    expect(plain.devil).toBe(false)
    const flagged = resolveDice({
      dice: openDice(),
      rolls: [2, 2, 2],
      candleLit: false,
      candleAbsorbs: false,
      devilAt: 3,
      specialDiceEffects: true,
    })
    expect(flagged.dice.map((die) => die.locked)).toEqual([false, false, false])
    expect(lockedCount(flagged.dice)).toBe(0)
  })
})

describe('vela', () => {
  it('el primer 6 apaga la vela y no bloquea ese dado', () => {
    const resolved = roll(openDice(), [6, 3, 4], true, true)
    expect(resolved.candleLit).toBe(false)
    expect(resolved.absorbedIndex).toBe(0)
    expect(resolved.dice[0]).toEqual({ value: 6, locked: false })
    expect(resolved.lockedCount).toBe(0)
    expect(resolved.devil).toBe(false)
  })

  it('si en el mismo tiro salen más seises, solo perdona uno', () => {
    const resolved = roll(openDice(), [6, 6, 6], true, true)
    expect(resolved.absorbedIndex).toBe(0)
    expect(resolved.dice.map((die) => die.locked)).toEqual([false, true, true])
    expect(resolved.candleLit).toBe(false)
    expect(resolved.devil).toBe(false)
  })

  it('el siguiente 6, ya a oscuras, sí se bloquea', () => {
    const first = roll(openDice(), [1, 6, 2], true, true)
    const second = roll(first.dice, [6, 5, 4], first.candleLit, true)
    expect(first.lockedCount).toBe(0)
    expect(second.dice[0]).toEqual({ value: 6, locked: true })
    expect(second.lockedCount).toBe(1)
    expect(second.absorbedIndex).toBeNull()
  })
})

describe('amenaza', () => {
  it('traduce 0, 1, 2 y 3 seises', () => {
    expect(threatBand(0, 3)).toBe(0)
    expect(threatBand(1, 3)).toBe(1)
    expect(threatBand(2, 3)).toBe(2)
    expect(threatBand(3, 3)).toBe(3)
  })
})
