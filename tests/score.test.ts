import { describe, expect, it } from 'vitest'
import { acknowledgeDevil, continueAfterSummary, offeringPoints, pilePoints, stepRaid } from '../src/engine'
import type { GameConfig, GameState } from '../src/engine'
import { gameConfig } from '../src/engine'
import { advance, bankIncursion, fleePending, ready, voteAll } from './helpers'

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
  it('cada botella vale según la incursión en que se robó', () => {
    const state = playBanks([2, 3, 4])
    expect(state.phase).toBe('final')
    const score = state.finalScore
    expect(score?.offering).toBe(20)
    expect(score?.offeringMet).toBe(true)
    expect(score?.outcome).toBe('winner')
    expect(score?.winners).toEqual([2])
    expect(score?.breakdown.map((row) => row.points)).toEqual([6, 6, 8])
    expect(score?.breakdown[2]?.byIncursion).toEqual([0, 2, 6])
    expect(offeringPoints(state)).toBe(20)
  })

  it('bajo 20 no gana nadie, aunque alguien tenga más puntos', () => {
    const state = playBanks([1, 3, 4])
    expect(state.finalScore?.offering).toBe(19)
    expect(state.finalScore?.offeringMet).toBe(false)
    expect(state.finalScore?.outcome).toBe('offering-failed')
    expect(state.finalScore?.winners).toEqual([])
    expect(Math.max(...(state.finalScore?.breakdown.map((row) => row.points) ?? [0]))).toBeGreaterThan(0)
  })

  it('un empate en el máximo se comparte', () => {
    const config = curve({
      incursions: 1,
      startLocked: [0],
      candleAbsorbsFirstSix: [false],
      valueMultiplier: [1],
      incursionNames: ['Prueba'],
      offeringThreshold: 2,
    })
    const state = playBanks([2], config)
    expect(state.finalScore?.offering).toBe(2)
    expect(state.finalScore?.outcome).toBe('tie')
    expect(state.finalScore?.winners).toEqual([0, 1])
  })

  it('el 666 de la tercera mancha a quienes estaban dentro: gana quien ya se había ido', () => {
    let state = ready()
    state = advance(bankIncursion(state, 4))
    state = advance(bankIncursion(state, 8))
    expect(offeringPoints(state)).toBe(20)
    expect(state.incursionIndex).toBe(2)
    expect(state.activePlayerId).toBe(2)
    state = stepRaid(state, [1, 2])
    state = voteAll(state, (playerId) => (playerId === 2 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    expect(state.players[2]?.inside).toBe(true)
    state = acknowledgeDevil(stepRaid(state, [6, 6]))
    state = continueAfterSummary(state)
    expect(state.finalScore?.offeringMet).toBe(true)
    expect(state.finalScore?.offering).toBe(20)
    expect(state.finalScore?.breakdown.find((row) => row.playerId === 2)?.stained).toBe(true)
    expect(state.finalScore?.winners).toEqual([1])
    expect(state.finalScore?.breakdown.map((row) => row.points)).toEqual([6, 7, 7])
    expect(state.finalScore?.breakdown[1]?.eligible).toBe(true)
    expect(state.finalScore?.breakdown[2]?.eligible).toBe(false)
  })

  it('si el Diablo mancha a toda la mesa, la ofrenda no corona a nadie', () => {
    let state = ready()
    state = advance(bankIncursion(state, 4))
    state = advance(bankIncursion(state, 8))
    state = acknowledgeDevil(stepRaid(state, [6, 6]))
    state = continueAfterSummary(state)
    expect(state.finalScore?.offering).toBe(20)
    expect(state.finalScore?.outcome).toBe('no-eligible')
    expect(state.finalScore?.winners).toEqual([])
    expect(state.finalScore?.breakdown.every((row) => row.stained)).toBe(true)
  })

  it('lo expuesto no suma a la ofrenda', () => {
    const state = stepRaid(ready(), [1, 2, 3])
    expect(offeringPoints(state)).toBe(0)
    expect(pilePoints(state.players[0]?.exposed ?? [], state.config)).toBe(1)
  })
})
