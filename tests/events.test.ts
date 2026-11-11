import { describe, expect, it } from 'vitest'
import { confirmIntro, continueAfterSummary, gameConfig, stepRaid } from '../src/engine'
import type { Bottle, DeckCard, EventId, GameState } from '../src/engine'
import { facedRaid, ready, voteAll } from './helpers'

function eventCard(event: EventId, id?: string): DeckCard {
  return { kind: 'event', id: id ?? event, event }
}

function bottle(id: string): Bottle {
  return { kind: 'bottle', id, cepa: id, drawnInIncursion: -1 }
}

function withTop(state: GameState, cards: DeckCard[]): GameState {
  return { ...state, deck: [...cards, ...state.deck] }
}

describe('eventos de la bodega', () => {
  it('Ruido, Barrica y Silencio respetan el piso 1 y el techo 3', () => {
    let state = withTop(ready(), [eventCard('ruido'), eventCard('ruido', 'r2'), eventCard('ruido', 'r3')])
    state = stepRaid(state, [1, 1])
    expect(state.diceCount).toBe(2)
    state = voteAll(state, 'continue')
    state = stepRaid(state, [1, 1, 1])
    expect(state.diceCount).toBe(3)
    state = voteAll(state, 'continue')
    state = stepRaid(state, [1, 1, 1])
    expect(state.diceCount).toBe(3)
    expect(state.lastRaid?.event?.diceDelta).toBe(0)

    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('barricaCae')]), [1, 1, 1])
    expect(state.diceCount).toBe(3)

    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('silencio')]), [1, 1])
    expect(state.diceCount).toBe(2)
    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('silencio', 's2')]), [1])
    expect(state.diceCount).toBe(1)
    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('silencio', 's3')]), [1])
    expect(state.diceCount).toBe(1)
    expect(state.lastRaid?.event?.diceDelta).toBe(0)
  })

  it('Barrica con un dado salta a tres', () => {
    const state = stepRaid(withTop(ready(), [eventCard('barricaCae')]), [1, 1, 1])
    expect(state.diceCount).toBe(3)
    expect(state.lastRaid?.event?.diceDelta).toBe(2)
    expect(state.phase).toBe('vote')
  })

  it('la Vela apaga una marca, o un dado si no hay marca', () => {
    let state = facedRaid(ready(), 6)
    expect(state.counters).toBe(1)
    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('vela')]), [1])
    expect(state.counters).toBe(0)
    expect(state.diceCount).toBe(1)
    expect(state.lastRaid?.event?.counterDelta).toBe(-1)

    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('ruido')]), [1, 1])
    expect(state.diceCount).toBe(2)
    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('vela', 'vela-2')]), [1])
    expect(state.counters).toBe(0)
    expect(state.diceCount).toBe(1)
    expect(state.lastRaid?.event?.diceDelta).toBe(-1)
  })

  it('Pisada en dos marcas despierta al Diablo sin tirada', () => {
    let state = facedRaid(ready(), 6)
    state = voteAll(state, 'continue')
    state = facedRaid(state, 6)
    expect(state.counters).toBe(2)
    state = voteAll(state, 'continue')
    state = stepRaid(withTop(state, [eventCard('pisada')]), [])
    expect(state.phase).toBe('devil')
    expect(state.counters).toBe(3)
    expect(state.lastRaid?.devilFrom).toBe('pisada')
    expect(state.lastRaid?.rolls).toBeNull()
  })

  it('el Eco saca una botella a quien tiene dos o más', () => {
    let state = ready()
    const exposed = [bottle('a'), bottle('b')]
    state = {
      ...state,
      players: state.players.map((player) => {
        if (player.id === 0) return { ...player, exposed: [bottle('a1'), bottle('a2')] }
        if (player.id === 2) return { ...player, exposed: [bottle('c1'), bottle('c2')] }
        return { ...player, exposed: [bottle('b1')] }
      }),
    }
    void exposed
    state = stepRaid(withTop(state, [eventCard('eco')]), [1])
    expect(state.players[0]?.exposed).toHaveLength(1)
    expect(state.players[1]?.exposed).toHaveLength(1)
    expect(state.players[2]?.exposed).toHaveLength(1)
    expect(state.discard).toHaveLength(2)
    expect(state.phase).toBe('vote')
  })

  it('Encrucijada ofrece botella y dado, o pasar', () => {
    const base = withTop(ready(), [eventCard('encrucijada'), bottle('extra')])
    const taken = stepRaid(base, [2, 3], 'take')
    expect(taken.players[0]?.exposed.map((card) => card.id)).toContain('extra')
    expect(taken.diceCount).toBe(2)
    expect(taken.lastRaid?.rolls).toEqual([2, 3])
    expect(taken.phase).toBe('vote')

    const passed = stepRaid(base, [4], 'pass')
    expect(passed.players[0]?.exposed).toHaveLength(0)
    expect(passed.diceCount).toBe(1)
    expect(passed.lastRaid?.event?.choice).toBe('pass')
  })

  it('Trasiego cambia el botín con quien más tiene; un empate sigue el sentido de la mesa', () => {
    let state = ready()
    state = {
      ...state,
      players: state.players.map((player) => {
        if (player.id === 1) return { ...player, exposed: [bottle('m1'), bottle('m2'), bottle('m3')] }
        if (player.id === 2) return { ...player, exposed: [bottle('c1'), bottle('c2'), bottle('c3')] }
        return { ...player, exposed: [bottle('r1')] }
      }),
    }
    state = stepRaid(withTop(state, [eventCard('trasiego')]), [1])
    expect(state.lastRaid?.event?.swapWith).toBe(1)
    expect(state.players[0]?.exposed).toHaveLength(3)
    expect(state.players[1]?.exposed.map((card) => card.id)).toEqual(['r1'])
    expect(state.players[2]?.exposed).toHaveLength(3)

    let quiet = ready()
    quiet = {
      ...quiet,
      players: quiet.players.map((player) => ({ ...player, exposed: player.id === 0 ? [bottle('solo')] : [] })),
    }
    quiet = stepRaid(withTop(quiet, [eventCard('trasiego', 'nada')]), [1])
    expect(quiet.lastRaid?.event?.swapWith).toBeNull()
    expect(quiet.players[0]?.exposed.map((card) => card.id)).toEqual(['solo'])
  })

  it('los eventos se reponen aunque ya hayan salido', () => {
    let state = stepRaid(withTop(ready(), [eventCard('silencio')]), [1])
    expect(state.diceCount).toBe(1)
    state = voteAll(state, 'exit')
    const next = confirmIntro(continueAfterSummary(state))
    expect(next.deck.filter((card) => card.kind === 'event')).toHaveLength(12)
    expect(next.deck.filter((card) => card.kind === 'bottle')).toHaveLength(gameConfig.bottleCount)
    expect(next.counters).toBe(1)
  })
})
