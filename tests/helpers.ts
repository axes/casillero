import {
  castVote,
  createGame,
  drawRound,
  enterNight,
  passAction,
  resolveRoll,
  resolveVotes,
  type GameConfig,
  type GameState,
  type LeaveChoice,
  type LootCard,
  gameConfig,
  loot,
} from '../src/engine'

export function curtain(names = ['Rosa', 'Mateo', 'Camila'], seed = 1, config: GameConfig = gameConfig): GameState {
  return createGame(names, seed, config)
}

export function night(state: GameState = curtain()): GameState {
  return enterNight(state)
}

export function giveLoot(points: 1 | 2 | 3, id: string): LootCard {
  return loot(points, id)
}

/** Pone botín conocido arriba de cada pila, en el orden en que se robará. */
export function stock(state: GameState, tops: LootCard[][]): GameState {
  return {
    ...state,
    piles: state.piles.map((pile, index) => [...(tops[index] ?? []), ...pile]),
  }
}

export function voteAll(state: GameState, choice: LeaveChoice | ((id: number) => LeaveChoice)): GameState {
  let next = state
  for (const player of next.players) {
    if (!player.inside) continue
    const pick = typeof choice === 'function' ? choice(player.id) : choice
    next = castVote(next, player.id, pick)
  }
  return resolveVotes(next)
}

export function round(state: GameState, choice: LeaveChoice | ((id: number) => LeaveChoice), face = 1): GameState {
  let next = drawRound(state)
  if (next.phase === 'night-end' || next.phase === 'devil') return next
  next = voteAll(next, choice)
  if (next.phase !== 'roll') return next
  const rolls = Array.from({ length: next.diceCount }, () => face)
  return resolveRoll(next, rolls)
}

export function passAllActions(state: GameState): GameState {
  let next = state
  while (next.phase === 'actions' && next.actionTurn !== null) {
    next = passAction(next, next.actionTurn)
  }
  return next
}
