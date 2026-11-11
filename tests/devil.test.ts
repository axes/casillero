import { describe, expect, it } from 'vitest'
import { acknowledgeDevil } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig } from '../src/engine'
import { advance, bankIncursion, facedRaid, fleePending, ready, voteAll } from './helpers'

describe('el Diablo', () => {
  it('tres marcas lo despiertan y se pierde solo lo expuesto', () => {
    let state = advance(bankIncursion(ready(), 1))
    const saved = state.players[0]?.secured.map((bottle) => bottle.id)
    expect(saved).toHaveLength(1)
    expect(state.counters).toBe(1)
    state = facedRaid(state, 6)
    expect(state.counters).toBe(2)
    state = voteAll(state, 'continue')
    state = facedRaid(state, 6)
    expect(state.phase).toBe('devil')
    expect(state.counters).toBe(3)
    expect(state.players.every((player) => player.exposed.length === 0)).toBe(true)
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toEqual(saved)
    expect(state.players.every((player) => !player.stained)).toBe(true)
    const lostId = state.lastRaid?.card.kind === 'bottle' ? state.lastRaid.card.id : ''
    expect(state.discard.map((bottle) => bottle.id)).toContain(lostId)
    state = acknowledgeDevil(state)
    expect(state.currentRecord?.reason).toBe('devil')
    expect(state.currentRecord?.mystery).toEqual([])
  })

  it('lo ya asegurado sobrevive', () => {
    let state = advance(bankIncursion(ready(), 2))
    const before = state.players.map((player) => player.secured.length)
    expect(before.reduce((sum, value) => sum + value, 0)).toBe(2)
    state = facedRaid(state, 6)
    state = voteAll(state, 'continue')
    state = acknowledgeDevil(facedRaid(state, 6))
    expect(state.players.map((player) => player.secured.length)).toEqual(before)
  })

  it('en la última incursión mancha solo a quienes seguían dentro', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startDice: [1],
      startCounters: [2],
      valueMultiplier: [1],
      incursionNames: ['La sacristía'],
      offeringThreshold: 1,
    }
    let state = ready(undefined, 1, config)
    state = facedRaid(state, 1)
    state = voteAll(state, 'continue')
    state = facedRaid(state, 1)
    state = voteAll(state, 'continue')
    state = facedRaid(state, 1)
    state = voteAll(state, 'continue')
    state = facedRaid(state, 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'exit' : 'continue'))
    state = fleePending(state, () => 'flee')
    expect(state.players[0]?.inside).toBe(false)
    expect(state.players[0]?.secured).toHaveLength(1)
    state = facedRaid(state, 6)
    expect(state.phase).toBe('devil')
    expect(state.players[0]?.stained).toBe(false)
    expect(state.players[1]?.stained).toBe(true)
    expect(state.players[2]?.stained).toBe(true)
    expect(state.players[0]?.secured).toHaveLength(1)
  })

  it('la mancha se puede apagar desde la config', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startDice: [1],
      startCounters: [2],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      lastIncursionDevilIneligible: false,
    }
    const state = facedRaid(ready(undefined, 1, config), 6)
    expect(state.phase).toBe('devil')
    expect(state.players.every((player) => !player.stained)).toBe(true)
  })

  it('si el descarte está apagado, la botella perdida vuelve al fondo', () => {
    const config: GameConfig = {
      ...gameConfig,
      incursions: 1,
      startDice: [1],
      startCounters: [2],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      discardLostBottles: false,
    }
    const state = facedRaid(ready(undefined, 1, config), 6)
    expect(state.phase).toBe('devil')
    expect(state.discard).toHaveLength(0)
    const lostId = state.lastRaid?.card.kind === 'bottle' ? state.lastRaid.card.id : ''
    expect(state.deck.at(-1)?.id).toBe(lostId)
  })
})
