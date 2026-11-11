import { describe, expect, it } from 'vitest'
import { castVote, chooseFlight, createGame, performRaid, resolveVotes } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig } from '../src/engine'
import { facedRaid, fleePending, ready, voteAll } from './helpers'

describe('unanimidad', () => {
  it('si todos los que siguen dentro votan salir, aseguran el botín', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, 'exit')
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('safe-exit')
    expect(state.players[0]?.secured).toHaveLength(1)
    expect(state.players[0]?.exposed).toHaveLength(0)
    expect(state.players[1]?.secured).toHaveLength(0)
    expect(state.discard).toHaveLength(0)
  })

  it('un solo voto de seguir impide la salida segura', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 1 ? 'continue' : 'exit'))
    expect(state.phase).toBe('flight')
    state = fleePending(state, () => 'stay')
    expect(state.phase).toBe('ready')
    expect(state.players.every((player) => player.inside)).toBe(true)
    expect(state.players[0]?.exposed).toHaveLength(1)
    expect(state.players[0]?.secured).toHaveLength(0)
    expect(state.activePlayerId).toBe(1)
  })

  it('quien ya está fuera no vota, y el resto sí puede salir unánime', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 1 ? 'exit' : 'continue'))
    state = chooseFlight(state, 1, 'flee')
    expect(state.players[1]?.inside).toBe(false)
    expect(state.phase).toBe('ready')
    state = facedRaid(state, 1)
    expect(() => castVote(state, 1, 'exit')).toThrow(/no vota/)
    state = castVote(state, state.activePlayerId === 2 ? 2 : 0, 'exit')
    const other = state.players.find((player) => player.inside && !state.votes.some((vote) => vote.playerId === player.id))
    state = castVote(state, other?.id ?? -1, 'exit')
    state = resolveVotes(state)
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('safe-exit')
    expect(state.players[1]?.inside).toBe(false)
  })

  it('si queda una persona, su voto de salir es unánime', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    expect(state.players.filter((player) => player.inside).map((player) => player.id)).toEqual([0])
    state = facedRaid(state, 1)
    state = voteAll(state, 'exit')
    expect(state.phase).toBe('summary')
    expect(state.players[0]?.secured).toHaveLength(2)
  })

  it('si todos quieren seguir, el saqueo rota', () => {
    let state = facedRaid(ready(), 1)
    state = voteAll(state, 'continue')
    expect(state.phase).toBe('ready')
    expect(state.activePlayerId).toBe(1)
    expect(state.revealedVotes.map((vote) => vote.vote)).toEqual(['continue', 'continue', 'continue'])
  })

  it('sin la regla de unanimidad, salir es una salida segura individual', () => {
    const config: GameConfig = { ...gameConfig, unanimousLeave: false }
    let state = facedRaid(ready(undefined, 1, config), 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'exit' : 'continue'))
    expect(state.phase).toBe('ready')
    expect(state.players[0]?.inside).toBe(false)
    expect(state.players[0]?.secured).toHaveLength(1)
    expect(state.discard).toHaveLength(0)
    expect(state.activePlayerId).toBe(1)
  })

  it('no se saquea durante la presentación de la incursión', () => {
    const state = createGame(['Rosa', 'Mateo', 'Camila'], 1)
    expect(state.phase).toBe('intro')
    expect(() => performRaid(state)).toThrow(/No es momento/)
  })
})
