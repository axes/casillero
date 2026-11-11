import { describe, expect, it } from 'vitest'
import { nextInt, rngFromSeed, shuffle } from '../src/engine'

describe('semilla', () => {
  it('repite la misma secuencia', () => {
    const roll = (seed: number) => {
      let rng = rngFromSeed(seed)
      const values: number[] = []
      for (let index = 0; index < 8; index += 1) {
        const next = nextInt(rng, 1, 6)
        rng = next.rng
        values.push(next.value)
      }
      return values
    }
    expect(roll(42)).toEqual(roll(42))
    expect(roll(42)).not.toEqual(roll(43))
    expect(roll(42).every((face) => face >= 1 && face <= 6)).toBe(true)
  })

  it('baraja sin perder ni duplicar', () => {
    const cards = ['a', 'b', 'c', 'd']
    const once = shuffle(rngFromSeed(7), cards)
    const twice = shuffle(rngFromSeed(7), cards)
    expect(twice.items).toEqual(once.items)
    expect([...once.items].sort()).toEqual([...cards])
  })
})
