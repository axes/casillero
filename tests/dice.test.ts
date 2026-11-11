import { describe, expect, it } from 'vitest'
import { countersFromRoll, threatBand } from '../src/engine'

describe('marcas por tirada', () => {
  it('sin un 6 no suma marca', () => {
    expect(countersFromRoll([1, 2, 3], 1)).toBe(0)
    expect(countersFromRoll([2, 2, 2], 1)).toBe(0)
  })

  it('varios 6 en la misma tirada suman una sola marca', () => {
    expect(countersFromRoll([6], 1)).toBe(1)
    expect(countersFromRoll([6, 6], 1)).toBe(1)
    expect(countersFromRoll([6, 6, 6], 1)).toBe(1)
  })

  it('el tope se lee de la config', () => {
    expect(countersFromRoll([6, 6, 6], 2)).toBe(2)
    expect(countersFromRoll([6], 2)).toBe(1)
  })

  it('un doble no hace nada si no es un 6', () => {
    expect(countersFromRoll([5, 5, 5], 1)).toBe(0)
  })
})

describe('amenaza', () => {
  it('traduce 0, 1, 2 y 3 marcas', () => {
    expect(threatBand(0, 3)).toBe(0)
    expect(threatBand(1, 3)).toBe(1)
    expect(threatBand(2, 3)).toBe(2)
    expect(threatBand(3, 3)).toBe(3)
  })
})
