import type { Die } from './types'

export interface DiceResolution {
  dice: Die[]
  candleLit: boolean
  absorbedIndex: number | null
  devil: boolean
  lockedCount: number
}

export function lockedCount(dice: readonly Die[]): number {
  return dice.reduce((count, die) => count + (die.locked ? 1 : 0), 0)
}

export function freeDiceCount(dice: readonly Die[]): number {
  return dice.reduce((count, die) => count + (die.locked ? 0 : 1), 0)
}

/**
 * 0 duerme, 1 escuchó algo, 2 está cerca, 3 aparece.
 * Con el umbral en 3, un seis bloqueado es “escuchó” y dos es “está cerca”.
 */
export function threatBand(locked: number, devilAt: number): 0 | 1 | 2 | 3 {
  if (locked <= 0) return 0
  if (locked >= devilAt) return 3
  if (locked >= devilAt - 1) return 2
  return 1
}

function assertFace(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    throw new Error('Dado fuera de rango.')
  }
}

/**
 * Aplica una tirada ya resuelta.
 * Con la vela encendida se perdona exactamente un 6 (el primero de la tirada):
 * no se bloquea y la vela se apaga. Los 6 que vengan en el mismo tiro sí se bloquean.
 * Así, 6-6-6 con la vela y cero dados trabados deja dos 6, no al Diablo.
 * Los dobles y triples no hacen nada: v0.2 no tiene efectos especiales de dado.
 */
export function resolveDice(args: {
  dice: readonly Die[]
  rolls: readonly number[]
  candleLit: boolean
  candleAbsorbs: boolean
  devilAt: number
  specialDiceEffects: boolean
}): DiceResolution {
  const next = args.dice.map((die) => ({ ...die }))
  let absorb = args.candleLit && args.candleAbsorbs
  let candleLit = args.candleLit
  let absorbedIndex: number | null = null
  let rollIndex = 0

  if (args.specialDiceEffects) {
    // Reservado. El prototipo v0.2 no traduce dobles ni triples en nada.
  }

  for (let index = 0; index < next.length; index += 1) {
    const die = next[index]
    if (!die || die.locked) continue
    const value = args.rolls[rollIndex]
    rollIndex += 1
    if (value === undefined) {
      throw new Error('Faltan tiradas para los dados libres.')
    }
    assertFace(value)
    die.value = value
    if (value !== 6) continue
    if (absorb) {
      absorb = false
      candleLit = false
      absorbedIndex = index
      continue
    }
    die.locked = true
  }

  if (rollIndex !== args.rolls.length) {
    throw new Error('Sobran tiradas para los dados libres.')
  }

  const locked = lockedCount(next)
  return {
    dice: next,
    candleLit,
    absorbedIndex,
    devil: locked >= args.devilAt,
    lockedCount: locked,
  }
}
