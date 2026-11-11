import type { FinalScore, GameState, LootCard, ScoreRow } from './types'

export function lootPoints(cards: readonly LootCard[]): number {
  return cards.reduce((sum, card) => sum + card.points, 0)
}

export function scoreGame(state: GameState): FinalScore {
  const rows: ScoreRow[] = state.players.map((player) => ({
    playerId: player.id,
    name: player.name,
    points: lootPoints(player.secured),
    bottles: player.secured.length,
    leftover: state.piles[player.id]?.length ?? 0,
  }))
  const best = Math.max(...rows.map((row) => row.points))
  let contenders = rows.filter((row) => row.points === best)
  if (state.config.tiebreakLeftoverPile && contenders.length > 1) {
    const most = Math.max(...contenders.map((row) => row.leftover))
    contenders = contenders.filter((row) => row.leftover === most)
  }
  const winners = contenders.map((row) => row.playerId)
  return { rows, winners, tie: winners.length > 1 }
}
