import { describe, expect, it } from 'vitest'
import { chooseFlight, splitFlight } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig, rngFromSeed } from '../src/engine'
import { facedRaid, fleePending, ready, voteAll } from './helpers'

function fleeRosaAfterTwoBottles(seed = 5, config: GameConfig = gameConfig) {
  let state = ready(undefined, seed, config)
  state = facedRaid(state, 1)
  state = voteAll(state, 'continue')
  state = facedRaid(state, 1)
  state = voteAll(state, 'continue')
  state = facedRaid(state, 1)
  state = voteAll(state, 'continue')
  state = facedRaid(state, 1)
  const exposed = state.players[0]?.exposed.map((bottle) => bottle.id) ?? []
  state = voteAll(state, (playerId) => (playerId === 0 ? 'exit' : 'continue'))
  expect(state.phase).toBe('flight')
  expect(state.pendingFlight[0]).toBe(0)
  state = chooseFlight(state, 0, 'flee')
  return { state, exposed }
}

describe('huida individual', () => {
  it('mezcla el botín, pierde una carta y asegura el resto', () => {
    const first = fleeRosaAfterTwoBottles(5)
    const second = fleeRosaAfterTwoBottles(5)
    const rosa = first.state.players[0]
    expect(first.exposed).toHaveLength(2)
    expect(rosa?.inside).toBe(false)
    expect(rosa?.exposed).toHaveLength(0)
    expect(rosa?.secured).toHaveLength(1)
    expect(first.state.discard).toHaveLength(1)
    const kept = rosa?.secured[0]?.id
    const lost = first.state.discard[0]?.id
    expect([kept, lost].sort()).toEqual([...first.exposed].sort())
    expect(second.state.discard[0]?.id).toBe(lost)
    expect(second.state.players[0]?.secured[0]?.id).toBe(kept)
    expect(first.state.phase).toBe('ready')
    expect(first.state.players[1]?.inside).toBe(true)
    expect(first.state.players[2]?.inside).toBe(true)
  })

  it('huir sin botín no cuesta carta y deja fuera de la incursión', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 2 ? 'exit' : 'continue'))
    state = fleePending(state, () => 'flee')
    expect(state.players[2]?.inside).toBe(false)
    expect(state.players[2]?.secured).toHaveLength(0)
    expect(state.discard).toHaveLength(0)
    expect(state.departures).toEqual([{ playerId: 2, kind: 'flee', lost: [] }])
  })

  it('con una sola carta, la huida se la lleva completa', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'exit' : 'continue'))
    state = chooseFlight(state, 0, 'flee')
    expect(state.players[0]?.secured).toHaveLength(0)
    expect(state.discard).toHaveLength(1)
    expect(state.discard[0]?.id).toBe(state.lastRaid?.card.id)
  })

  it('la pena se lee de la config', () => {
    const config: GameConfig = { ...gameConfig, fleePenalty: 2 }
    const { state, exposed } = fleeRosaAfterTwoBottles(8, config)
    expect(exposed).toHaveLength(2)
    expect(state.players[0]?.secured).toHaveLength(0)
    expect(state.discard).toHaveLength(2)
    expect(state.discard.map((bottle) => bottle.id).sort()).toEqual([...exposed].sort())
  })

  it('la mezcla es estable para la misma semilla', () => {
    const bottles = [
      { kind: 'bottle' as const, id: 'botella-1', cepa: 'País', drawnInIncursion: 0 },
      { kind: 'bottle' as const, id: 'botella-2', cepa: 'Syrah', drawnInIncursion: 0 },
      { kind: 'bottle' as const, id: 'botella-3', cepa: 'Carmenère', drawnInIncursion: 0 },
    ]
    const once = splitFlight(rngFromSeed(11), bottles, 1)
    const twice = splitFlight(rngFromSeed(11), bottles, 1)
    expect(once.lost.map((bottle) => bottle.id)).toEqual(twice.lost.map((bottle) => bottle.id))
    expect(once.lost).toHaveLength(1)
    expect([...once.lost, ...once.kept].map((bottle) => bottle.id).sort()).toEqual(['botella-1', 'botella-2', 'botella-3'])
  })

  it('quien queda solo y vota salir asegura todo: no es una huida', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    state = facedRaid(state, 1)
    state = voteAll(state, 'exit')
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('safe-exit')
    expect(state.players[0]?.secured).toHaveLength(2)
    expect(state.discard).toHaveLength(0)
  })
})
