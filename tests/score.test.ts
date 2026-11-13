import { describe, expect, it } from 'vitest'
import { continueAfterNight, enterNight, scoreGame } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig } from '../src/engine'
import { curtain, giveLoot, night, passAllActions, round } from './helpers'

function finishCautious(config: GameConfig = gameConfig) {
  let state = night(curtain(undefined, 5, config))
  for (let index = 0; index < config.nights; index += 1) {
    if (state.phase === 'curtain') state = enterNight(state)
    if (state.phase === 'actions') state = passAllActions(state)
    state = round(state, 'leave', 1)
    state = continueAfterNight(state)
  }
  return state
}

describe('puntos y empate', () => {
  it('gana quien más aseguró', () => {
    const state = finishCautious()
    expect(state.phase).toBe('final')
    expect(state.finalScore?.winners.length).toBeGreaterThan(0)
    const best = Math.max(...(state.finalScore?.rows.map((row) => row.points) ?? [0]))
    expect(state.finalScore?.rows.filter((row) => state.finalScore?.winners.includes(row.playerId)).every((row) => row.points === best)).toBe(true)
  })

  it('un empate de puntos se comparte, sin mirar la pila', () => {
    let state = curtain()
    state = {
      ...state,
      players: state.players.map((player, index) => ({
        ...player,
        secured: index === 2 ? [] : [giveLoot(2, `p-${index}`)],
      })),
      piles: state.piles.map((pile, index) => (index === 0 ? pile.slice(0, 1) : pile)),
    }
    const score = scoreGame(state)
    expect(score.winners).toEqual([0, 1])
    expect(score.tie).toBe(true)
    expect(score.rows[0]?.leftover).not.toBe(score.rows[1]?.leftover)
  })

  it('con el desempate de la config, gana quien más cartas conserva', () => {
    const config: GameConfig = { ...gameConfig, tiebreakLeftoverPile: true }
    let state = curtain(undefined, 1, config)
    state = {
      ...state,
      players: state.players.map((player) => ({ ...player, secured: [giveLoot(1, `eq-${player.id}`)] })),
      piles: [[giveLoot(1, 'solo')], [giveLoot(1, 'a'), giveLoot(1, 'b')], []],
    }
    const score = scoreGame(state)
    expect(score.winners).toEqual([1])
    expect(score.tie).toBe(false)
  })

  it('no hay ofrenda ni mancha', () => {
    expect(gameConfig.offeringThreshold).toBeNull()
    expect(gameConfig.lastIncursionDevilIneligible).toBe(false)
    expect(gameConfig.devilCounters).toBe(false)
    expect(gameConfig.nights).toBe(4)
    const state = finishCautious()
    expect(state.nightIndex).toBe(3)
    expect(state.finalScore).not.toBeNull()
  })
})
