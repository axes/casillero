import { describe, expect, it } from 'vitest'
import { acknowledgeDevil, continueAfterSummary, offeringPoints, pilePoints } from '../src/engine'
import type { GameConfig, GameState } from '../src/engine'
import { gameConfig } from '../src/engine'
import { advance, bankIncursion, facedRaid, fleePending, ready, voteAll } from './helpers'

function curve(partial: Partial<GameConfig> = {}): GameConfig {
  return { ...gameConfig, ...partial }
}

function playBanks(raids: readonly number[], config: GameConfig = gameConfig): GameState {
  let state = ready(undefined, 1, config)
  for (let incursion = 0; incursion < raids.length; incursion += 1) {
    const count = raids[incursion] ?? 0
    state = bankIncursion(state, count)
    state = incursion === raids.length - 1 ? continueAfterSummary(state) : advance(state)
  }
  return state
}

describe('puntaje, ofrenda y victoria', () => {
  it('cada botella vale según la incursión y 14 alcanza', () => {
    const state = playBanks([2, 3, 2])
    expect(state.phase).toBe('final')
    const score = state.finalScore
    expect(score?.offering).toBe(14)
    expect(score?.threshold).toBe(14)
    expect(score?.offeringMet).toBe(true)
    expect(score?.outcome).toBe('winner')
    expect(score?.winners).toEqual([0])
    expect(score?.breakdown.map((row) => row.points)).toEqual([6, 3, 5])
    expect(score?.breakdown[0]?.byIncursion).toEqual([1, 2, 3])
    expect(offeringPoints(state)).toBe(14)
  })

  it('bajo 14 no gana nadie', () => {
    const state = playBanks([1, 1, 1])
    expect(state.finalScore?.offering).toBe(6)
    expect(state.finalScore?.offeringMet).toBe(false)
    expect(state.finalScore?.outcome).toBe('offering-failed')
    expect(state.finalScore?.winners).toEqual([])
  })

  it('un empate en el máximo se comparte', () => {
    const config = curve({
      incursions: 1,
      startDice: [1],
      startCounters: [0],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      offeringThreshold: 2,
    })
    const state = playBanks([2], config)
    expect(state.finalScore?.offering).toBe(2)
    expect(state.finalScore?.outcome).toBe('tie')
    expect(state.finalScore?.winners).toEqual([0, 1])
  })

  it('la mancha de la tercera deja fuera a quien seguía dentro', () => {
    let state = ready()
    state = advance(bankIncursion(state, 5))
    state = advance(bankIncursion(state, 5))
    expect(offeringPoints(state)).toBe(15)
    expect(state.counters).toBe(1)
    state = facedRaid(state, 1)
    state = voteAll(state, (playerId) => (playerId === 2 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    state = facedRaid(state, 6)
    expect(state.counters).toBe(2)
    state = voteAll(state, 'continue')
    state = acknowledgeDevil(facedRaid(state, 6))
    state = continueAfterSummary(state)
    expect(state.finalScore?.offering).toBe(15)
    expect(state.finalScore?.breakdown.map((row) => row.points)).toEqual([4, 6, 5])
    expect(state.finalScore?.winners).toEqual([1])
    expect(state.finalScore?.breakdown[2]?.eligible).toBe(false)
  })

  it('si el Diablo mancha a toda la mesa, nadie gana', () => {
    let state = ready()
    state = advance(bankIncursion(state, 5))
    state = advance(bankIncursion(state, 5))
    state = facedRaid(state, 6)
    state = voteAll(state, 'continue')
    state = acknowledgeDevil(facedRaid(state, 6))
    state = continueAfterSummary(state)
    expect(state.finalScore?.offering).toBe(15)
    expect(state.finalScore?.outcome).toBe('no-eligible')
    expect(state.finalScore?.winners).toEqual([])
  })

  it('lo expuesto no suma a la ofrenda', () => {
    const state = facedRaid(ready(), 1)
    expect(offeringPoints(state)).toBe(0)
    expect(pilePoints(state.players[state.activePlayerId]?.exposed ?? [], state.config)).toBe(1)
  })
})
