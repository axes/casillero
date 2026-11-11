import { gameConfig, type GameConfig } from '../config'
import { makeDeck } from './deck'
import { freeDiceCount, resolveDice } from './dice'
import { splitFlight } from './flight'
import { nextInt, normalizeSeed, rngFromSeed } from './rng'
import { scoreGame } from './score'
import type {
  Bottle,
  CastVote,
  Departure,
  Die,
  EndReason,
  FlightChoice,
  GameState,
  IncursionRecord,
  PlayerState,
  Vote,
} from './types'

function draft(state: GameState): GameState {
  return structuredClone(state)
}

function playerAt(state: GameState, playerId: number): PlayerState {
  const player = state.players[playerId]
  if (!player || player.id !== playerId) {
    throw new Error('Ese asiento no está en la mesa.')
  }
  return player
}

function insidePlayers(state: GameState): PlayerState[] {
  return state.players.filter((player) => player.inside)
}

function orderFrom(players: readonly PlayerState[], startId: number, include: (player: PlayerState) => boolean): number[] {
  const ids: number[] = []
  const count = players.length
  for (let step = 0; step < count; step += 1) {
    const id = (startId + step) % count
    const player = players[id]
    if (player && include(player)) ids.push(player.id)
  }
  return ids
}

function nextInsideId(players: readonly PlayerState[], fromId: number): number | null {
  const count = players.length
  for (let step = 1; step <= count; step += 1) {
    const id = (fromId + step) % count
    if (players[id]?.inside) return id
  }
  return null
}

function startingPlayerId(state: GameState): number {
  if (!state.config.rotateFirstActorEachIncursion) return 0
  return state.incursionIndex % state.players.length
}

function initialDice(config: GameConfig, incursionIndex: number): Die[] {
  const locked = Math.min(config.startLocked[incursionIndex] ?? 0, config.dice)
  return Array.from({ length: config.dice }, (_, index) =>
    index < locked ? { value: 6, locked: true } : { value: 0, locked: false },
  )
}

function bury(state: GameState, bottles: readonly Bottle[]): void {
  if (bottles.length === 0) return
  if (state.config.discardLostBottles) {
    state.discard.push(...bottles)
    return
  }
  state.deck.push(...bottles)
}

function emptyPiles(count: number): Bottle[][] {
  return Array.from({ length: count }, () => [])
}

function giveSecured(state: GameState, player: PlayerState, bottles: Bottle[]): void {
  if (bottles.length === 0) return
  player.secured = [...player.secured, ...bottles]
  const gained = state.gainedThisIncursion[player.id] ?? []
  state.gainedThisIncursion[player.id] = [...gained, ...bottles]
}

function markLost(state: GameState, playerId: number, bottles: Bottle[]): void {
  if (bottles.length === 0) return
  const lost = state.lostThisIncursion[playerId] ?? []
  state.lostThisIncursion[playerId] = [...lost, ...bottles]
  bury(state, bottles)
}

function secureInside(state: GameState): GameState {
  for (const player of state.players) {
    if (!player.inside || player.exposed.length === 0) continue
    const taken = player.exposed
    player.exposed = []
    giveSecured(state, player, taken)
  }
  return state
}

function drawMystery(state: GameState): Bottle[] {
  const revealed: Bottle[] = []
  for (let index = 0; index < state.config.mysteryBottles && state.deck.length > 0; index += 1) {
    const card = state.deck[0]
    if (!card) break
    state.deck = state.deck.slice(1)
    revealed.push(card)
  }
  state.mysteryRevealed = revealed.map((bottle) => ({ ...bottle }))
  state.discard.push(...revealed.map((bottle) => ({ ...bottle })))
  return state.mysteryRevealed.map((bottle) => ({ ...bottle }))
}

function finishIncursion(state: GameState, reason: EndReason): GameState {
  const mystery = drawMystery(state)
  const record: IncursionRecord = {
    index: state.incursionIndex,
    name: state.config.incursionNames[state.incursionIndex] ?? `Incursión ${state.incursionIndex + 1}`,
    reason,
    raids: state.raidsThisIncursion,
    gained: state.gainedThisIncursion.map((pile) => pile.slice()),
    lost: state.lostThisIncursion.map((pile) => pile.slice()),
    stainedIds: state.stainedThisIncursion.slice(),
    mystery,
  }
  state.history = [...state.history, record]
  state.currentRecord = record
  state.phase = 'summary'
  state.votes = []
  state.pendingFlight = []
  return state
}

function applyDevil(state: GameState): GameState {
  const lastIncursion = state.incursionIndex === state.config.incursions - 1
  for (const player of state.players) {
    if (!player.inside) continue
    if (player.exposed.length > 0) {
      const lost = player.exposed
      player.exposed = []
      markLost(state, player.id, lost)
    }
    if (lastIncursion && state.config.lastIncursionDevilIneligible) {
      player.stained = true
      if (!state.stainedThisIncursion.includes(player.id)) {
        state.stainedThisIncursion.push(player.id)
      }
    }
  }
  state.phase = 'devil'
  return state
}

function setupIncursion(state: GameState): GameState {
  const index = state.incursionIndex
  state.candleLit = state.config.candleAbsorbsFirstSix[index] ?? false
  state.dice = initialDice(state.config, index)
  state.activePlayerId = startingPlayerId(state)
  state.raidsThisIncursion = 0
  state.soloRaids = 0
  state.votes = []
  state.revealedVotes = []
  state.pendingFlight = []
  state.departures = []
  state.gainedThisIncursion = emptyPiles(state.players.length)
  state.lostThisIncursion = emptyPiles(state.players.length)
  state.stainedThisIncursion = []
  state.currentRecord = null
  state.lastRaid = null
  state.mysteryRevealed = []
  state.phase = 'intro'
  for (const player of state.players) {
    player.inside = true
    player.exposed = []
  }
  return state
}

function validateConfig(config: GameConfig): void {
  if (!Number.isInteger(config.playersMin) || !Number.isInteger(config.playersMax)) {
    throw new Error('El rango de jugadores no es válido.')
  }
  if (config.playersMin < 1 || config.playersMax < config.playersMin) {
    throw new Error('El rango de jugadores no es válido.')
  }
  if (!Number.isInteger(config.incursions) || config.incursions < 1) {
    throw new Error('La partida necesita al menos una incursión.')
  }
  if (!Number.isInteger(config.dice) || config.dice < 1) {
    throw new Error('Tiene que haber dados.')
  }
  if (!Number.isInteger(config.devilAtLockedSixes) || config.devilAtLockedSixes < 1) {
    throw new Error('El umbral del Diablo no es válido.')
  }
  const parallel = [config.startLocked, config.candleAbsorbsFirstSix, config.valueMultiplier, config.incursionNames]
  if (parallel.some((list) => list.length !== config.incursions)) {
    throw new Error('La curva de incursiones no está completa en la config.')
  }
  for (let index = 0; index < config.incursions; index += 1) {
    const locked = config.startLocked[index] ?? 0
    if (!Number.isInteger(locked) || locked < 0 || locked >= config.dice) {
      throw new Error('startLocked deja la incursión sin dados libres.')
    }
    if (locked >= config.devilAtLockedSixes) {
      throw new Error('La incursión no puede empezar con el Diablo despierto.')
    }
    const multiplier = config.valueMultiplier[index] ?? -1
    if (!Number.isInteger(multiplier) || multiplier < 0) {
      throw new Error('El valor del vino no es válido.')
    }
  }
  if (!Number.isInteger(config.offeringThreshold) || config.offeringThreshold < 0) {
    throw new Error('La ofrenda no es válida.')
  }
  if (!Number.isInteger(config.fleePenalty) || config.fleePenalty < 0) {
    throw new Error('La pena de huida no es válida.')
  }
  if (config.soloSaqueoCap !== null && (!Number.isInteger(config.soloSaqueoCap) || config.soloSaqueoCap < 0)) {
    throw new Error('El tope de saqueo en solitario no es válido.')
  }
  if (!Number.isInteger(config.mysteryBottles) || config.mysteryBottles < 0) {
    throw new Error('Las botellas misteriosas no son válidas.')
  }
}

function autoEnd(state: GameState): GameState | null {
  if (state.phase !== 'ready') return null
  const inside = insidePlayers(state)
  const cap = state.config.soloSaqueoCap
  if (cap !== null && inside.length === 1 && state.soloRaids >= cap) {
    return finishIncursion(secureInside(state), 'solo-cap')
  }
  if (state.deck.length === 0) {
    return finishIncursion(secureInside(state), 'cellar-empty')
  }
  return null
}

function applyRaid(state: GameState, rolls: readonly number[], rng: GameState['rng']): GameState {
  if (state.phase !== 'ready') {
    throw new Error('No es momento de saquear.')
  }
  const ended = autoEnd(draft(state))
  if (ended) return ended

  const next = draft(state)
  next.rng = rng
  next.departures = []
  next.revealedVotes = []
  const free = freeDiceCount(next.dice)
  if (rolls.length !== free) {
    throw new Error('La cantidad de dados no calza con los que siguen libres.')
  }
  if (next.deck.length === 0) {
    return finishIncursion(secureInside(next), 'cellar-empty')
  }

  const top = next.deck[0]
  if (!top) {
    return finishIncursion(secureInside(next), 'cellar-empty')
  }
  const drawn: Bottle = { ...top, drawnInIncursion: next.incursionIndex }
  next.deck = next.deck.slice(1)

  const player = playerAt(next, next.activePlayerId)
  if (!player.inside) {
    throw new Error('Quien roba ya no está en la incursión.')
  }
  player.exposed = [...player.exposed, drawn]

  const rolledIndices: number[] = []
  for (let index = 0; index < next.dice.length; index += 1) {
    if (!next.dice[index]?.locked) rolledIndices.push(index)
  }

  const resolved = resolveDice({
    dice: next.dice,
    rolls,
    candleLit: next.candleLit,
    candleAbsorbs: next.config.candleAbsorbsFirstSix[next.incursionIndex] ?? false,
    devilAt: next.config.devilAtLockedSixes,
    specialDiceEffects: next.config.specialDiceEffects,
  })
  next.dice = resolved.dice
  next.candleLit = resolved.candleLit
  next.raidsThisIncursion += 1
  if (insidePlayers(next).length === 1) next.soloRaids += 1
  next.raidSerial += 1
  next.lastRaid = {
    playerId: player.id,
    drawn,
    rolls: [...rolls],
    rolledIndices,
    absorbedIndex: resolved.absorbedIndex,
    devil: resolved.devil,
    lockedCount: resolved.lockedCount,
  }
  next.votes = []
  if (resolved.devil) return applyDevil(next)
  next.phase = 'vote'
  return next
}

function leaveSafely(state: GameState, player: PlayerState): Departure {
  const taken = player.exposed
  player.exposed = []
  giveSecured(state, player, taken)
  player.inside = false
  return { playerId: player.id, kind: 'safe-leave', lost: [] }
}

export function createGame(names: readonly string[], seed: number, config: GameConfig = gameConfig): GameState {
  validateConfig(config)
  const trimmed = names.map((name) => name.trim())
  if (trimmed.length < config.playersMin || trimmed.length > config.playersMax) {
    throw new Error(`La mesa es de ${config.playersMin} a ${config.playersMax} jugadores.`)
  }
  if (trimmed.some((name) => name.length === 0)) {
    throw new Error('Cada quien necesita un nombre.')
  }

  const normalized = normalizeSeed(seed)
  let rng = rngFromSeed(normalized)
  const built = makeDeck(rng)
  rng = built.rng
  const players: PlayerState[] = trimmed.map((name, id) => ({
    id,
    name,
    exposed: [],
    secured: [],
    inside: true,
    stained: false,
  }))

  const state: GameState = {
    config: structuredClone(config) as GameConfig,
    seed: normalized,
    rng,
    deck: built.deck,
    discard: [],
    players,
    incursionIndex: 0,
    phase: 'intro',
    candleLit: false,
    dice: [],
    activePlayerId: 0,
    raidsThisIncursion: 0,
    soloRaids: 0,
    votes: [],
    revealedVotes: [],
    pendingFlight: [],
    departures: [],
    gainedThisIncursion: emptyPiles(players.length),
    lostThisIncursion: emptyPiles(players.length),
    stainedThisIncursion: [],
    history: [],
    currentRecord: null,
    lastRaid: null,
    mysteryRevealed: [],
    finalScore: null,
    raidSerial: 0,
  }
  return setupIncursion(state)
}

export function confirmIntro(state: GameState): GameState {
  if (state.phase !== 'intro') throw new Error('La incursión ya empezó.')
  const next = draft(state)
  next.phase = 'ready'
  return next
}

/** Tira los dados libres con la semilla de la partida. */
export function performRaid(state: GameState): GameState {
  if (state.phase !== 'ready') throw new Error('No es momento de saquear.')
  const ended = autoEnd(draft(state))
  if (ended) return ended
  const free = freeDiceCount(state.dice)
  let rng = state.rng
  const rolls: number[] = []
  for (let index = 0; index < free; index += 1) {
    const face = nextInt(rng, 1, 6)
    rng = face.rng
    rolls.push(face.value)
  }
  return applyRaid(state, rolls, rng)
}

/** Igual que un saqueo, pero con las caras ya decididas. El azar de la huida no se mueve. */
export function stepRaid(state: GameState, rolls: readonly number[]): GameState {
  return applyRaid(state, rolls, state.rng)
}

export function castVote(state: GameState, playerId: number, vote: Vote): GameState {
  if (state.phase !== 'vote') throw new Error('Ahora no se vota.')
  if (vote !== 'exit' && vote !== 'continue') throw new Error('Voto desconocido.')
  const next = draft(state)
  const player = playerAt(next, playerId)
  if (!player.inside) throw new Error('Quien ya salió no vota.')
  if (next.votes.some((cast) => cast.playerId === playerId)) {
    throw new Error('Ese voto ya está.')
  }
  next.votes = [...next.votes, { playerId, vote }]
  return next
}

export function resolveVotes(state: GameState): GameState {
  if (state.phase !== 'vote') throw new Error('Ahora no se cierra la votación.')
  const next = draft(state)
  const inside = insidePlayers(next)
  if (inside.length === 0) throw new Error('No queda nadie dentro.')
  if (inside.some((player) => !next.votes.some((cast) => cast.playerId === player.id))) {
    throw new Error('Falta el voto de alguien que sigue dentro.')
  }

  const revealed = inside.map((player) => {
    const cast = next.votes.find((entry) => entry.playerId === player.id)
    if (!cast) throw new Error('Falta un voto.')
    return cast
  })
  const voteOf = (playerId: number): Vote => {
    const cast = revealed.find((entry) => entry.playerId === playerId)
    if (!cast) throw new Error('Falta un voto.')
    return cast.vote
  }

  next.revealedVotes = revealed
  next.votes = []

  const everyoneExits = inside.every((player) => voteOf(player.id) === 'exit')
  if (next.config.unanimousLeave && everyoneExits) {
    return finishIncursion(secureInside(next), 'safe-exit')
  }

  if (!next.config.unanimousLeave) {
    const departures: Departure[] = []
    for (const player of inside) {
      if (voteOf(player.id) !== 'exit') continue
      departures.push(leaveSafely(next, player))
    }
    next.departures = departures
    if (insidePlayers(next).length === 0) {
      return finishIncursion(next, 'safe-exit')
    }
    const following = nextInsideId(next.players, next.activePlayerId)
    if (following === null) return finishIncursion(next, 'safe-exit')
    next.activePlayerId = following
    next.phase = 'ready'
    return next
  }

  const exiters = orderFrom(next.players, next.activePlayerId, (player) => player.inside && voteOf(player.id) === 'exit')
  if (exiters.length === 0) {
    const following = nextInsideId(next.players, next.activePlayerId)
    if (following === null) throw new Error('No queda nadie para el siguiente saqueo.')
    next.activePlayerId = following
    next.phase = 'ready'
    next.departures = []
    return next
  }

  next.pendingFlight = exiters
  next.phase = 'flight'
  next.departures = []
  return next
}

export function chooseFlight(state: GameState, playerId: number, choice: FlightChoice): GameState {
  if (state.phase !== 'flight') throw new Error('Nadie está huyendo ahora.')
  if (choice !== 'flee' && choice !== 'stay') throw new Error('Esa huida no se entiende.')
  const next = draft(state)
  const expected = next.pendingFlight[0]
  if (expected !== playerId) throw new Error('Le toca decidir a otra persona.')
  next.pendingFlight = next.pendingFlight.slice(1)
  const player = playerAt(next, playerId)
  if (!player.inside) throw new Error('Esa persona ya no está dentro.')

  if (choice === 'flee') {
    const split = splitFlight(next.rng, player.exposed, next.config.fleePenalty)
    next.rng = split.rng
    player.exposed = []
    giveSecured(next, player, split.kept)
    markLost(next, player.id, split.lost)
    player.inside = false
    next.departures = [...next.departures, { playerId, kind: 'flee', lost: split.lost }]
  } else {
    next.departures = [...next.departures, { playerId, kind: 'stay', lost: [] }]
  }

  if (next.pendingFlight.length > 0) return next
  if (insidePlayers(next).length === 0) return finishIncursion(next, 'all-fled')
  const following = nextInsideId(next.players, next.activePlayerId)
  if (following === null) return finishIncursion(next, 'all-fled')
  next.activePlayerId = following
  next.phase = 'ready'
  return next
}

export function acknowledgeDevil(state: GameState): GameState {
  if (state.phase !== 'devil') throw new Error('El Diablo no está en escena.')
  return finishIncursion(draft(state), 'devil')
}

export function continueAfterSummary(state: GameState): GameState {
  if (state.phase !== 'summary') throw new Error('La incursión todavía no cierra.')
  const next = draft(state)
  if (next.incursionIndex + 1 >= next.config.incursions) {
    next.finalScore = scoreGame(next)
    next.phase = 'final'
    return next
  }
  next.incursionIndex += 1
  return setupIncursion(next)
}

export function voteFor(votes: readonly CastVote[], playerId: number): Vote | null {
  return votes.find((cast) => cast.playerId === playerId)?.vote ?? null
}
