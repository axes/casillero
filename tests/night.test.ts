import { describe, expect, it } from 'vitest'
import { acknowledgeDevil, continueAfterNight, drawRound, enterNight } from '../src/engine'
import type { GameState } from '../src/engine'
import { curtain, giveLoot, night, passAllActions, round, stock, voteAll } from './helpers'

describe('noche y rondas', () => {
  it('la primera noche no abre acciones y el robo es simultáneo', () => {
    let state = stock(curtain(), [
      [giveLoot(1, 'r'), giveLoot(2, 'r2')],
      [giveLoot(2, 'm'), giveLoot(1, 'm2')],
      [giveLoot(3, 'c'), giveLoot(1, 'c2')],
    ])
    state = night(state)
    expect(state.phase).toBe('ready')
    expect(state.diceCount).toBe(1)
    expect(state.nightIndex).toBe(0)
    state = round(state, 'leave', 1)
    expect(state.phase).toBe('night-end')
    expect(state.nightEnd?.reason).toBe('all-left')
    expect(state.players.map((player) => player.secured.reduce((sum, card) => sum + card.points, 0))).toEqual([1, 2, 3])
    expect(state.players.every((player) => !player.inside)).toBe(true)
  })

  it('salir asegura lo de la noche; un 6 se lleva lo de quienes siguieron', () => {
    let state = stock(night(), [
      [giveLoot(3, 'r')],
      [giveLoot(2, 'm')],
      [giveLoot(1, 'c')],
    ])
    state = round(state, (id) => (id === 0 ? 'leave' : 'stay'), 6)
    expect(state.phase).toBe('devil')
    expect(state.players[0]?.secured.map((card) => card.id)).toEqual(['r'])
    expect(state.players[1]?.exposed).toHaveLength(0)
    expect(state.players[2]?.exposed).toHaveLength(0)
    expect(state.players[1]?.secured).toHaveLength(0)
    expect(state.lootDiscard.map((card) => card.id).sort()).toEqual(['c', 'm'])
    state = acknowledgeDevil(state)
    expect(state.phase).toBe('night-end')
  })

  it('sin 6 se puede seguir, y la tercera ronda asegura sola', () => {
    let state = stock(night(), [
      [giveLoot(1, 'a1'), giveLoot(1, 'a2'), giveLoot(1, 'a3')],
      [giveLoot(1, 'b1'), giveLoot(1, 'b2'), giveLoot(1, 'b3')],
      [giveLoot(1, 'c1'), giveLoot(1, 'c2'), giveLoot(1, 'c3')],
    ])
    state = round(state, 'stay', 1)
    expect(state.phase).toBe('ready')
    expect(state.round).toBe(1)
    expect(state.players[0]?.exposed).toHaveLength(1)
    state = round(state, 'stay', 2)
    expect(state.phase).toBe('ready')
    expect(state.round).toBe(2)
    state = round(state, 'stay', 3)
    expect(state.phase).toBe('night-end')
    expect(state.nightEnd?.reason).toBe('auto-bank')
    expect(state.round).toBe(3)
    expect(state.lastRoll).toBeNull()
    expect(state.players.every((player) => player.exposed.length === 0)).toBe(true)
    expect(state.players.every((player) => player.secured.length === 3)).toBe(true)
  })

  it('una pila vacía no roba y la persona sigue dentro', () => {
    let state = night()
    state = { ...state, piles: [[], state.piles[1] ?? [], state.piles[2] ?? []] }
    state = stock(state, [[], [giveLoot(2, 'm')], [giveLoot(1, 'c')]])
    state = voteAll(drawRound(state), 'leave')
    expect(state.phase).toBe('night-end')
    expect(state.players[0]?.secured).toHaveLength(0)
    expect(state.players[1]?.secured).toHaveLength(1)
  })

  it('cuatro noches cierran la partida y cada quien roba una acción al terminar, menos la última', () => {
    let state = night()
    for (let index = 0; index < 4; index += 1) {
      state = round(openReady(state), 'leave', 1)
      expect(state.phase).toBe('night-end')
      state = continueAfterNight(state)
      if (index < 3) {
        expect(state.phase).toBe('curtain')
        expect(state.nightIndex).toBe(index + 1)
        expect(state.players.every((player) => player.hand.length === index + 1)).toBe(true)
      }
    }
    expect(state.phase).toBe('final')
    expect(state.finalScore?.rows).toHaveLength(3)
    expect(state.players.every((player) => player.hand.length === 3)).toBe(true)
  })
})

function openReady(state: GameState): GameState {
  let next = state.phase === 'curtain' ? enterNight(state) : state
  if (next.phase === 'actions') next = passAllActions(next)
  return next
}
