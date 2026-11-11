import type { GameConfig } from '../config'
import type { Bottle, FinalScore, GameState, ScoreRow } from './types'

export function bottleValue(bottle: Bottle, config: GameConfig): number {
  if (bottle.drawnInIncursion < 0) return 0
  return config.valueMultiplier[bottle.drawnInIncursion] ?? 0
}

export function pilePoints(bottles: readonly Bottle[], config: GameConfig): number {
  return bottles.reduce((sum, bottle) => sum + bottleValue(bottle, config), 0)
}

export function offeringPoints(state: GameState): number {
  return state.players.reduce((sum, player) => sum + pilePoints(player.secured, state.config), 0)
}

export function scoreGame(state: GameState): FinalScore {
  const { config } = state
  const breakdown: ScoreRow[] = state.players.map((player) => {
    const byIncursion = config.valueMultiplier.map(() => 0)
    for (const bottle of player.secured) {
      const index = bottle.drawnInIncursion
      const value = bottleValue(bottle, config)
      if (index >= 0 && index < byIncursion.length) {
        byIncursion[index] = (byIncursion[index] ?? 0) + value
      }
    }
    const points = byIncursion.reduce((sum, value) => sum + value, 0)
    return {
      playerId: player.id,
      name: player.name,
      points,
      bottles: player.secured.length,
      byIncursion,
      eligible: !player.stained,
      stained: player.stained,
    }
  })

  const offering = breakdown.reduce((sum, row) => sum + row.points, 0)
  const threshold = config.offeringThreshold
  const offeringMet = offering >= threshold
  if (!offeringMet) {
    return { offering, threshold, offeringMet, winners: [], breakdown, outcome: 'offering-failed' }
  }

  const eligible = breakdown.filter((row) => row.eligible)
  if (eligible.length === 0) {
    return { offering, threshold, offeringMet, winners: [], breakdown, outcome: 'no-eligible' }
  }

  const best = Math.max(...eligible.map((row) => row.points))
  const winners = eligible.filter((row) => row.points === best).map((row) => row.playerId)
  return {
    offering,
    threshold,
    offeringMet,
    winners,
    breakdown,
    outcome: winners.length > 1 ? 'tie' : 'winner',
  }
}
