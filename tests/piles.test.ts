import { describe, expect, it } from 'vitest'
import { gameConfig, makeActionDeck, makeBodega, pileSizeFor } from '../src/engine'
import { curtain } from './helpers'

describe('pilas de la bodega', () => {
  it('reparte 20, 15, 12 y 10 según la mesa', () => {
    expect(pileSizeFor(gameConfig, 3)).toBe(20)
    expect(pileSizeFor(gameConfig, 4)).toBe(15)
    expect(pileSizeFor(gameConfig, 5)).toBe(12)
    expect(pileSizeFor(gameConfig, 6)).toBe(10)
    for (const count of [3, 4, 5, 6]) {
      const names = ['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín'].slice(0, count)
      const state = curtain(names, 4)
      expect(state.piles).toHaveLength(count)
      expect(state.piles.every((pile) => pile.length === pileSizeFor(gameConfig, count))).toBe(true)
      const all = state.piles.flat()
      expect(all).toHaveLength(60)
      expect(new Set(all.map((card) => card.id)).size).toBe(60)
    }
  })

  it('arma 50 botines y 10 eventos, y 30 acciones', () => {
    const bodega = makeBodega(gameConfig)
    const loot = bodega.filter((card) => card.kind === 'loot')
    expect(loot.filter((card) => card.points === 1)).toHaveLength(24)
    expect(loot.filter((card) => card.points === 2)).toHaveLength(16)
    expect(loot.filter((card) => card.points === 3)).toHaveLength(10)
    expect(bodega.filter((card) => card.kind === 'event')).toHaveLength(10)
    expect(makeActionDeck(gameConfig)).toHaveLength(30)
  })

  it('la misma semilla reparte igual', () => {
    const once = curtain(['Rosa', 'Mateo', 'Camila'], 9)
    const twice = curtain(['Rosa', 'Mateo', 'Camila'], 9)
    expect(once.piles.map((pile) => pile.map((card) => card.id))).toEqual(
      twice.piles.map((pile) => pile.map((card) => card.id)),
    )
    expect(once.actionDeck.map((card) => card.id)).toEqual(twice.actionDeck.map((card) => card.id))
  })

  it('rechaza mesas fuera de 3 a 6', () => {
    expect(() => curtain(['Rosa', 'Mateo'])).toThrow(/3 a 6/)
    expect(() => curtain(['Rosa', 'Mateo', ' '])).toThrow(/nombre/)
  })
})
