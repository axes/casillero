import { describe, expect, it } from 'vitest'
import { gameConfig, lockedCount, performRaid, stepRaid } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { advance, bankIncursion, ready } from './helpers'

describe('curva de las tres incursiones', () => {
  it('parte de la config, no de números sueltos', () => {
    expect(gameConfig).toMatchObject({
      incursions: 3,
      dice: 3,
      devilAtLockedSixes: 3,
      startLocked: [0, 0, 1],
      candleAbsorbsFirstSix: [true, false, false],
      valueMultiplier: [1, 2, 3],
      incursionNames: ['Las tinajas', 'Las cavas', 'La sacristía'],
      offeringThreshold: 20,
      fleePenalty: 1,
      mysteryBottles: 0,
      specialDiceEffects: false,
      soloSaqueoCap: null,
    })
  })

  it('la primera tiene vela, la segunda es normal y la tercera entra con un 6', () => {
    let state = ready()
    expect(state.incursionIndex).toBe(0)
    expect(state.config.incursionNames[0]).toBe('Las tinajas')
    expect(state.candleLit).toBe(true)
    expect(lockedCount(state.dice)).toBe(0)
    expect(state.activePlayerId).toBe(0)

    state = advance(bankIncursion(state, 1))
    expect(state.incursionIndex).toBe(1)
    expect(state.config.incursionNames[1]).toBe('Las cavas')
    expect(state.candleLit).toBe(false)
    expect(lockedCount(state.dice)).toBe(0)
    expect(state.activePlayerId).toBe(1)
    expect(state.players.every((player) => player.inside)).toBe(true)

    state = advance(bankIncursion(state, 1))
    expect(state.incursionIndex).toBe(2)
    expect(state.config.incursionNames[2]).toBe('La sacristía')
    expect(state.candleLit).toBe(false)
    expect(state.dice[0]).toEqual({ value: 6, locked: true })
    expect(lockedCount(state.dice)).toBe(1)
    expect(state.dice.filter((die) => !die.locked)).toHaveLength(2)
    expect(state.activePlayerId).toBe(2)
  })

  it('puede rotar o no al primero de cada incursión según la config', () => {
    const fixed: GameConfig = { ...gameConfig, rotateFirstActorEachIncursion: false }
    let state = ready(undefined, 1, fixed)
    state = bankIncursion(state, 1)
    state = advance(state)
    expect(state.incursionIndex).toBe(1)
    expect(state.activePlayerId).toBe(0)
  })

  it('la primera tirada de la sacristía usa dos dados y puede ser el Diablo', () => {
    let state = ready()
    state = advance(bankIncursion(state, 1))
    state = advance(bankIncursion(state, 1))
    expect(() => stepRaid(state, [6, 6, 6])).toThrow(/no calza/)
    const woken = stepRaid(state, [6, 6])
    expect(woken.phase).toBe('devil')
    expect(woken.lastRaid?.rolls).toEqual([6, 6])
    const spared = stepRaid(state, [6, 1])
    expect(spared.phase).toBe('vote')
    expect(lockedCount(spared.dice)).toBe(2)
  })

  it('performRaid tira solo los dados libres y respeta la semilla', () => {
    const once = performRaid(ready(undefined, 99))
    const twice = performRaid(ready(undefined, 99))
    expect(once.lastRaid?.rolls).toEqual(twice.lastRaid?.rolls)
    expect(once.players[0]?.exposed[0]?.id).toBe(twice.players[0]?.exposed[0]?.id)
    expect(once.lastRaid?.rolls).toHaveLength(3)
    let late = ready(undefined, 3)
    late = advance(bankIncursion(late, 1))
    late = advance(bankIncursion(late, 1))
    const sacristy = performRaid(late)
    expect(sacristy.lastRaid?.rolls).toHaveLength(2)
  })
})
