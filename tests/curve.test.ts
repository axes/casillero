import { describe, expect, it } from 'vitest'
import { eventTotal, gameConfig, performRaid } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { advance, bankIncursion, facedRaid, ready } from './helpers'

describe('curva v0.3', () => {
  it('parte de la config', () => {
    expect(gameConfig).toMatchObject({
      incursions: 3,
      startDice: [1, 1, 1],
      minDice: 1,
      maxDice: 3,
      devilAtCounters: 3,
      maxCountersPerRoll: 1,
      startCounters: [0, 1, 1],
      valueMultiplier: [1, 2, 3],
      incursionNames: ['Las tinajas', 'Las cavas', 'La sacristía'],
      offeringThreshold: 14,
      fleePenalty: 1,
      mysteryBottles: 0,
      specialDiceEffects: false,
      candleAbsorbsFirstSix: false,
      startLocked: [0, 0, 0],
      bottleCount: 40,
      eventsRestockEachIncursion: true,
    })
    expect(eventTotal(gameConfig)).toBe(12)
  })

  it('entra siempre con un dado y con 0, 1 y 1 marcas', () => {
    let state = ready()
    expect(state.incursionIndex).toBe(0)
    expect(state.diceCount).toBe(1)
    expect(state.counters).toBe(0)
    expect(state.deck.filter((card) => card.kind === 'event')).toHaveLength(12)
    expect(state.deck.filter((card) => card.kind === 'bottle')).toHaveLength(40)

    state = advance(bankIncursion(state, 1))
    expect(state.incursionIndex).toBe(1)
    expect(state.config.incursionNames[1]).toBe('Las cavas')
    expect(state.diceCount).toBe(1)
    expect(state.counters).toBe(1)
    expect(state.activePlayerId).toBe(1)
    expect(state.deck.filter((card) => card.kind === 'event')).toHaveLength(12)
    expect(state.deck.filter((card) => card.kind === 'bottle')).toHaveLength(39)

    state = advance(bankIncursion(state, 1))
    expect(state.incursionIndex).toBe(2)
    expect(state.counters).toBe(1)
    expect(state.diceCount).toBe(1)
    expect(state.activePlayerId).toBe(2)
  })

  it('puede no rotar al primero de cada incursión', () => {
    const fixed: GameConfig = { ...gameConfig, rotateFirstActorEachIncursion: false }
    let state = ready(undefined, 1, fixed)
    state = advance(bankIncursion(state, 1))
    expect(state.activePlayerId).toBe(0)
  })

  it('la primera tirada de las tinajas no puede despertar al Diablo', () => {
    const state = facedRaid(ready(), 6)
    expect(state.phase).toBe('vote')
    expect(state.counters).toBe(1)
    expect(state.lastRaid?.addedFromSix).toBe(true)
    expect(state.lastRaid?.rolls).toEqual([6])
  })

  it('en cavas la primera tirada llega a 2, no a 3', () => {
    let state = advance(bankIncursion(ready(), 1))
    state = facedRaid(state, 6)
    expect(state.counters).toBe(2)
    expect(state.phase).toBe('vote')
  })

  it('performRaid tira solo los dados en juego y respeta la semilla', () => {
    const once = performRaid(ready(undefined, 99))
    const twice = performRaid(ready(undefined, 99))
    expect(once.lastRaid?.rolls).toEqual(twice.lastRaid?.rolls)
    expect(once.lastRaid?.card.id).toBe(twice.lastRaid?.card.id)
    expect(once.phase).toBe(twice.phase)
  })
})
