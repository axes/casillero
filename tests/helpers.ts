import {
  castVote,
  chooseFlight,
  confirmIntro,
  continueAfterSummary,
  createGame,
  resolveVotes,
  stepRaid,
  type FlightChoice,
  type GameConfig,
  type GameState,
  type Vote,
  gameConfig,
} from '../src/engine'

export const names3 = ['Rosa', 'Mateo', 'Camila'] as const

export function ready(names: readonly string[] = names3, seed = 1, config: GameConfig = gameConfig): GameState {
  return confirmIntro(createGame(names, seed, config))
}

export function voteAll(state: GameState, vote: Vote | ((playerId: number) => Vote)): GameState {
  let next = state
  for (const player of next.players) {
    if (!player.inside) continue
    const choice = typeof vote === 'function' ? vote(player.id) : vote
    next = castVote(next, player.id, choice)
  }
  return resolveVotes(next)
}

export function fleePending(state: GameState, choiceFor: (playerId: number) => FlightChoice): GameState {
  let next = state
  while (next.phase === 'flight') {
    const playerId = next.pendingFlight[0]
    if (playerId === undefined) break
    next = chooseFlight(next, playerId, choiceFor(playerId))
  }
  return next
}

/** Deja una botella arriba para que el saqueo no dispare un evento. */
export function putBottleFirst(state: GameState): GameState {
  const index = state.deck.findIndex((card) => card.kind === 'bottle')
  if (index <= 0) return state
  const card = state.deck[index]
  if (!card) return state
  return {
    ...state,
    deck: [card, ...state.deck.slice(0, index), ...state.deck.slice(index + 1)],
  }
}

/** Saqueo de botella con todos los dados en la misma cara. 1 no marca; 6 marca. */
export function facedRaid(state: GameState, face = 1): GameState {
  const topped = putBottleFirst(state)
  const rolls = Array.from({ length: topped.diceCount }, () => face)
  return stepRaid(topped, rolls)
}

/** Cierra la incursión actual con `raids` botellas sin seises y salida unánime en el último. */
export function bankIncursion(state: GameState, raids: number): GameState {
  let next = state
  if (next.phase === 'intro') next = confirmIntro(next)
  for (let index = 0; index < raids; index += 1) {
    next = facedRaid(next, 1)
    if (next.phase !== 'vote') throw new Error(`El saqueo no llegó a votar: ${next.phase}`)
    next = voteAll(next, index === raids - 1 ? 'exit' : 'continue')
  }
  if (next.phase !== 'summary') {
    throw new Error(`La incursión no cerró: ${next.phase}`)
  }
  return next
}

export function advance(state: GameState): GameState {
  const next = continueAfterSummary(state)
  return next.phase === 'intro' ? confirmIntro(next) : next
}
