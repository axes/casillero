import { describe, expect, it } from 'vitest'
import { drawRound, resolveRoll, type BodegaEventCard, type EventId } from '../src/engine'
import { giveLoot, night, voteAll } from './helpers'

function event(name: EventId, id: string): BodegaEventCard {
  return { kind: 'event', id, event: name }
}

describe('eventos de la bodega', () => {
  it('Ruido y Barrica suman dados, con techo en 3', () => {
    let state = night()
    state = {
      ...state,
      piles: [
        [event('ruido', 'r'), giveLoot(1, 'a')],
        [giveLoot(1, 'b')],
        [giveLoot(1, 'c')],
      ],
    }
    state = drawRound(state)
    expect(state.diceCount).toBe(2)
    state = voteAll(state, 'stay')
    state = resolveRoll(state, [1, 1])
    state = {
      ...state,
      piles: [[event('barricaCae', 'bar'), ...state.piles[0]!], state.piles[1]!, state.piles[2]!],
    }
    state = drawRound(state)
    expect(state.diceCount).toBe(3)
    state = voteAll(state, 'stay')
    state = resolveRoll(state, [1, 2, 3])
    state = {
      ...state,
      piles: [[event('ruido', 'r2'), ...state.piles[0]!], state.piles[1]!, state.piles[2]!],
    }
    state = drawRound(state)
    expect(state.diceCount).toBe(3)
    expect(state.phase).toBe('night-end')
  })

  it('Guardia no deja que Silencio baje ese dado', () => {
    let state = night()
    state = {
      ...state,
      piles: [
        [event('guardia', 'g'), event('silencio', 's'), giveLoot(1, 'a')],
        [giveLoot(1, 'b'), giveLoot(1, 'b2'), giveLoot(1, 'b3')],
        [giveLoot(1, 'c'), giveLoot(1, 'c2'), giveLoot(1, 'c3')],
      ],
    }
    state = drawRound(state)
    expect(state.diceCount).toBe(2)
    expect(state.guardiaDice).toBe(1)
    state = voteAll(state, 'stay')
    state = resolveRoll(state, [1, 2])
    state = drawRound(state)
    expect(state.diceCount).toBe(1)
    expect(state.guardiaDice).toBe(1)
    state = voteAll(state, 'stay')
    state = resolveRoll(state, [1])
    state = {
      ...state,
      piles: [[event('silencio', 's2'), ...state.piles[0]!], state.piles[1]!, state.piles[2]!],
    }
    state = drawRound(state)
    expect(state.diceCount).toBe(1)
    expect(state.phase).toBe('night-end')
  })

  it('un solo 6 alcanza, y Sombra asegura lo suyo', () => {
    let state = night()
    state = {
      ...state,
      players: state.players.map((player, index) => (index === 0 ? { ...player, sombra: true } : player)),
      piles: [
        [giveLoot(3, 'salva')],
        [giveLoot(2, 'cae')],
        [giveLoot(1, 'tambien')],
      ],
    }
    state = drawRound(state)
    state = voteAll(state, 'stay')
    state = resolveRoll(state, [6])
    expect(state.phase).toBe('devil')
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toEqual(['salva'])
    expect(state.players[1]?.secured).toHaveLength(0)
    expect(state.players[2]?.secured).toHaveLength(0)
    expect(state.nightEnd?.sombraSaved).toEqual([0])
  })
})
