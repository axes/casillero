import { describe, expect, it } from 'vitest'
import { acknowledgeDevil, stepRaid } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig } from '../src/engine'
import { advance, bankIncursion, fleePending, ready, voteAll } from './helpers'

describe('666', () => {
  it('tres seises despiertan al Diablo y se pierde solo lo expuesto', () => {
    let state = advance(bankIncursion(ready(), 1))
    const saved = state.players[0]?.secured.map((bottle) => bottle.id)
    expect(saved).toHaveLength(1)
    state = stepRaid(state, [6, 6, 6])
    expect(state.phase).toBe('devil')
    expect(state.lastRaid?.devil).toBe(true)
    expect(state.players.every((player) => player.exposed.length === 0)).toBe(true)
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toEqual(saved)
    expect(state.players[1]?.secured).toHaveLength(0)
    const lostId = state.lastRaid?.drawn.id
    expect(state.discard.map((bottle) => bottle.id)).toContain(lostId)
    expect(state.deck.map((bottle) => bottle.id)).not.toContain(lostId)
    expect(state.players.every((player) => !player.stained)).toBe(true)

    state = acknowledgeDevil(state)
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('devil')
    expect(state.currentRecord?.mystery).toEqual([])
  })

  it('con la vela encendida un 666 no lo despierta; el seis siguiente ya cuenta', () => {
    let state = stepRaid(ready(), [6, 6, 6])
    expect(state.phase).toBe('vote')
    expect(state.candleLit).toBe(false)
    expect(state.lastRaid?.devil).toBe(false)
    expect(state.dice.filter((die) => die.locked)).toHaveLength(2)
    state = voteAll(state, 'continue')
    state = stepRaid(state, [6])
    expect(state.phase).toBe('devil')
    expect(state.discard).toHaveLength(2)
  })

  it('quien ya había asegurado en la incursión anterior no pierde esa colección', () => {
    let state = advance(bankIncursion(ready(), 2))
    const before = state.players.map((player) => player.secured.length)
    expect(before).toEqual([1, 1, 0])
    state = acknowledgeDevil(stepRaid(state, [6, 6, 6]))
    expect(state.players.map((player) => player.secured.length)).toEqual(before)
  })

  it('en la última incursión mancha solo a quienes seguían dentro', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startLocked: [0],
      candleAbsorbsFirstSix: [false],
      valueMultiplier: [1],
      incursionNames: ['La sacristía'],
      offeringThreshold: 1,
    }
    let state = ready(undefined, 1, config)
    state = stepRaid(state, [1, 2, 3])
    state = voteAll(state, 'continue')
    state = stepRaid(state, [1, 2, 3])
    state = voteAll(state, 'continue')
    state = stepRaid(state, [1, 2, 3])
    state = voteAll(state, 'continue')
    state = stepRaid(state, [1, 2, 3])
    state = voteAll(state, (playerId) => (playerId === 0 ? 'exit' : 'continue'))
    state = fleePending(state, () => 'flee')
    expect(state.players[0]?.inside).toBe(false)
    expect(state.players[0]?.secured).toHaveLength(1)
    expect(state.phase).toBe('ready')
    state = stepRaid(state, [6, 6, 6])
    expect(state.phase).toBe('devil')
    expect(state.players[0]?.stained).toBe(false)
    expect(state.players[1]?.stained).toBe(true)
    expect(state.players[2]?.stained).toBe(true)
    expect(state.players[0]?.secured).toHaveLength(1)
    expect(state.players[1]?.exposed).toHaveLength(0)
    expect(state.players[1]?.secured).toHaveLength(0)
  })

  it('la mancha se puede apagar desde la config', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startLocked: [0],
      candleAbsorbsFirstSix: [false],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      lastIncursionDevilIneligible: false,
    }
    const state = stepRaid(ready(undefined, 1, config), [6, 6, 6])
    expect(state.players.every((player) => !player.stained)).toBe(true)
  })

  it('si el descarte está apagado, la botella perdida vuelve al fondo', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startLocked: [0],
      candleAbsorbsFirstSix: [false],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      discardLostBottles: false,
    }
    const state = stepRaid(ready(undefined, 1, config), [6, 6, 6])
    expect(state.discard).toHaveLength(0)
    expect(state.deck.at(-1)?.id).toBe(state.lastRaid?.drawn.id)
  })
})
