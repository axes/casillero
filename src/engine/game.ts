import { gameConfig, type GameConfig } from '../config'
import { addDice, applyAction, canAnswerWithTranca, isTheft, removeDice, targetsPlayer } from './actions'
import { dealActions, dealPiles } from './deck'
import { rollHasSix } from './dice'
import { nextInt, normalizeSeed, rngFromSeed } from './rng'
import { scoreGame } from './score'
import type {
  ActionCard,
  ActionPayload,
  BodegaEventCard,
  GameState,
  LeaveChoice,
  LootCard,
  NightEndReason,
  PendingAction,
  PlayerState,
} from './types'

function draft(state: GameState): GameState {
  return structuredClone(state)
}

function seatOrder(state: GameState): number[] {
  const count = state.players.length
  return Array.from({ length: count }, (_, step) => (state.firstPlayerId + step) % count)
}

function playerAt(state: GameState, id: number): PlayerState {
  const player = state.players[id]
  if (!player || player.id !== id) throw new Error('Ese asiento no está.')
  return player
}

function insideIds(state: GameState): number[] {
  return state.players.filter((player) => player.inside).map((player) => player.id)
}

function bankPlayer(player: PlayerState): LootCard[] {
  const taken = player.exposed
  player.exposed = []
  player.secured = [...player.secured, ...taken]
  return taken
}

function discardExposed(state: GameState, player: PlayerState): LootCard[] {
  const lost = player.exposed
  player.exposed = []
  state.lootDiscard = [...state.lootDiscard, ...lost]
  return lost
}

function endNight(state: GameState, reason: NightEndReason, lost: LootCard[][], sombraSaved: number[]): GameState {
  state.nightEnd = { reason, lost, sombraSaved }
  state.phase = reason === 'six' ? 'devil' : 'night-end'
  state.votes = []
  state.pending = null
  return state
}

function loseOrSaveInside(state: GameState): { lost: LootCard[][]; sombraSaved: number[] } {
  const lost = state.players.map(() => [] as LootCard[])
  const sombraSaved: number[] = []
  for (const player of state.players) {
    if (!player.inside) continue
    if (player.sombra) {
      bankPlayer(player)
      sombraSaved.push(player.id)
    } else if (state.config.exposedLostOnSix) {
      lost[player.id] = discardExposed(state, player)
    } else {
      bankPlayer(player)
    }
  }
  return { lost, sombraSaved }
}

function bankInside(state: GameState): void {
  for (const player of state.players) {
    if (player.inside) bankPlayer(player)
  }
}

function resolveBodegaEvent(state: GameState, card: BodegaEventCard): void {
  const spec = state.config.events[card.event]
  if (card.event === 'silencio') {
    removeDice(state, spec.removeDice ?? 1)
    return
  }
  addDice(state, spec.addDice ?? 0, spec.persistent === true)
}

function validateConfig(config: GameConfig): void {
  if (config.nights < 1 || config.maxRoundsPerNight < 1) throw new Error('La partida necesita noches y rondas.')
  if (config.minDice < 1 || config.maxDice < config.minDice) throw new Error('El rango de dados no es válido.')
  if (config.startDice < config.minDice || config.startDice > config.maxDice) throw new Error('El dado inicial no cabe.')
  const loot = config.loot['1'] + config.loot['2'] + config.loot['3']
  const events = config.events.ruido.count + config.events.barricaCae.count + config.events.silencio.count + config.events.guardia.count
  if (loot + events !== config.bodegaSize) throw new Error('La bodega no suma sus cartas.')
  const actionTotal = Object.values(config.actions.cards).reduce((sum, count) => sum + count, 0)
  if (actionTotal !== config.actions.deckSize) throw new Error('Las acciones no suman el mazo.')
  if (config.actions.handLimit < 1 || config.actions.playsPerNight < 1) throw new Error('La mano de acciones no es válida.')
}

function advanceActionTurn(state: GameState): void {
  const count = state.players.length
  const current = state.actionTurn
  if (current === null) throw new Error('Nadie está jugando acciones.')
  const next = (current + 1) % count
  if (next === state.firstPlayerId) {
    state.actionTurn = null
    state.phase = 'ready'
    return
  }
  state.actionTurn = next
  state.phase = 'actions'
}

function spend(state: GameState, player: PlayerState, cardId: string): ActionCard {
  const index = player.hand.findIndex((card) => card.id === cardId)
  if (index < 0) throw new Error('Esa carta no está en la mano.')
  const card = player.hand[index]
  if (!card) throw new Error('Esa carta no está en la mano.')
  player.hand = player.hand.filter((held) => held.id !== cardId)
  state.actionDiscard = [...state.actionDiscard, card]
  return card
}

export function createGame(names: readonly string[], seed: number, config: GameConfig = gameConfig): GameState {
  validateConfig(config)
  const trimmed = names.map((name) => name.trim())
  if (trimmed.length < config.playersMin || trimmed.length > config.playersMax) {
    throw new Error(`La mesa es de ${config.playersMin} a ${config.playersMax} jugadores.`)
  }
  if (trimmed.some((name) => name.length === 0)) throw new Error('Cada quien necesita un nombre.')

  const normalized = normalizeSeed(seed)
  let rng = rngFromSeed(normalized)
  const piles = dealPiles(rng, config, trimmed.length)
  rng = piles.rng
  const actions = dealActions(rng, config)
  rng = actions.rng
  const state: GameState = {
    config: structuredClone(config) as GameConfig,
    seed: normalized,
    rng,
    piles: piles.piles,
    actionDeck: actions.deck,
    actionDiscard: [],
    lootDiscard: [],
    players: trimmed.map((name, id) => ({
      id,
      name,
      exposed: [],
      secured: [],
      hand: [],
      inside: true,
      escondite: false,
      sombra: false,
    })),
    nightIndex: 0,
    round: 0,
    phase: 'curtain',
    firstPlayerId: 0,
    actionTurn: null,
    diceCount: config.startDice,
    guardiaDice: 0,
    faces: [],
    pending: null,
    peek: null,
    votes: [],
    lastDrawn: [],
    lastRoll: null,
    nightEnd: null,
    trimQueue: [],
    finalScore: null,
  }
  return state
}

export function enterNight(state: GameState): GameState {
  if (state.phase !== 'curtain') throw new Error('La cortina no está cerrada.')
  const next = draft(state)
  const count = next.players.length
  next.firstPlayerId = next.config.rotateFirstPlayer ? next.nightIndex % count : 0
  next.round = 0
  next.diceCount = next.config.startDice
  next.guardiaDice = 0
  next.faces = []
  next.votes = []
  next.lastDrawn = []
  next.lastRoll = null
  next.nightEnd = null
  next.pending = null
  next.peek = null
  for (const player of next.players) {
    player.inside = true
    player.exposed = []
    player.escondite = false
    player.sombra = false
  }
  if (next.nightIndex + 1 >= next.config.actions.playFromNight) {
    next.phase = 'actions'
    next.actionTurn = next.firstPlayerId
  } else {
    next.phase = 'ready'
    next.actionTurn = null
  }
  return next
}

export function passAction(state: GameState, playerId: number): GameState {
  if (state.phase !== 'actions' || state.actionTurn !== playerId) throw new Error('No es el turno de esa acción.')
  const next = draft(state)
  advanceActionTurn(next)
  return next
}

export function playAction(state: GameState, playerId: number, cardId: string, payload: ActionPayload = {}): GameState {
  if (state.phase !== 'actions' || state.actionTurn !== playerId) throw new Error('No es el turno de esa acción.')
  const next = draft(state)
  const actor = playerAt(next, playerId)
  const card = actor.hand.find((held) => held.id === cardId)
  if (!card) throw new Error('Esa carta no está en la mano.')
  if (card.action === 'tranca') throw new Error('La tranca se juega cuando te apuntan.')
  const targetId = payload.targetId
  if (targetsPlayer(card.action) && targetId !== undefined && isTheft(card.action)) {
    const target = playerAt(next, targetId)
    if (target.escondite) throw new Error('Está escondido: no se le roba, ni se le quiebra, ni se le traspasa.')
  }
  spend(next, actor, cardId)
  if (targetId !== undefined && targetsPlayer(card.action) && canAnswerWithTranca(next, targetId)) {
    next.pending = { actorId: playerId, card, payload }
    next.phase = 'tranca'
    return next
  }
  applyAction(next, playerId, card, payload)
  if (next.peek) {
    next.phase = 'peek'
    return next
  }
  advanceActionTurn(next)
  return next
}

export function respondTranca(state: GameState, use: boolean): GameState {
  if (state.phase !== 'tranca' || !state.pending) throw new Error('Nadie te está apuntando.')
  const next = draft(state)
  const pending: PendingAction = next.pending!
  const target = playerAt(next, pending.payload.targetId ?? -1)
  if (use) {
    const tranca = target.hand.find((card) => card.action === 'tranca')
    if (!tranca) throw new Error('No tienes tranca.')
    spend(next, target, tranca.id)
    next.pending = null
    next.peek = null
    advanceActionTurn(next)
    return next
  }
  applyAction(next, pending.actorId, pending.card, pending.payload)
  next.pending = null
  if (next.peek) {
    next.phase = 'peek'
    return next
  }
  advanceActionTurn(next)
  return next
}

export function acknowledgePeek(state: GameState): GameState {
  if (state.phase !== 'peek') throw new Error('Nadie está mirando una mano.')
  const next = draft(state)
  next.peek = null
  advanceActionTurn(next)
  return next
}

export function drawRound(state: GameState): GameState {
  if (state.phase !== 'ready') throw new Error('No es momento de robar.')
  if (!state.config.simultaneousDraw || !state.config.personalPiles) {
    throw new Error('Esta versión roba a la vez, cada quien de su pila.')
  }
  const next = draft(state)
  next.round += 1
  next.lastRoll = null
  const drawn = []
  for (const id of seatOrder(next)) {
    const person = playerAt(next, id)
    if (!person.inside) continue
    const pile = next.piles[id] ?? []
    const card = pile[0]
    if (!card) continue
    next.piles[id] = pile.slice(1)
    drawn.push({ playerId: id, card })
    if (card.kind === 'loot') person.exposed = [...person.exposed, card]
  }
  for (const item of drawn) {
    if (item.card.kind === 'event') resolveBodegaEvent(next, item.card)
  }
  next.lastDrawn = drawn
  if (next.round >= next.config.maxRoundsPerNight && next.config.autoBankAfterLastRound) {
    bankInside(next)
    return endNight(next, 'auto-bank', next.players.map(() => []), [])
  }
  next.votes = []
  next.phase = 'vote'
  return next
}

export function castVote(state: GameState, playerId: number, choice: LeaveChoice): GameState {
  if (state.phase !== 'vote') throw new Error('Ahora no se decide si seguir.')
  if (choice !== 'leave' && choice !== 'stay') throw new Error('Esa decisión no se entiende.')
  const next = draft(state)
  const person = playerAt(next, playerId)
  if (!person.inside) throw new Error('Quien ya salió no decide.')
  if (next.votes.some((vote) => vote.playerId === playerId)) throw new Error('Esa decisión ya está.')
  next.votes = [...next.votes, { playerId, choice }]
  return next
}

export function resolveVotes(state: GameState): GameState {
  if (state.phase !== 'vote') throw new Error('Ahora no se cierra la decisión.')
  const next = draft(state)
  const inside = next.players.filter((person) => person.inside)
  if (inside.some((person) => !next.votes.some((vote) => vote.playerId === person.id))) {
    throw new Error('Falta la decisión de alguien que sigue dentro.')
  }
  for (const person of inside) {
    const vote = next.votes.find((entry) => entry.playerId === person.id)
    if (vote?.choice === 'leave') {
      bankPlayer(person)
      person.inside = false
    }
  }
  next.votes = []
  if (insideIds(next).length === 0) return endNight(next, 'all-left', next.players.map(() => []), [])
  next.phase = 'roll'
  return next
}

export function resolveRoll(state: GameState, rolls: readonly number[]): GameState {
  if (state.phase !== 'roll') throw new Error('Ahora no se tira el dado.')
  if (!state.config.sharedDie) throw new Error('El dado de esta versión es compartido.')
  if (rolls.length !== state.diceCount) throw new Error('La cantidad de dados no calza.')
  const next = draft(state)
  const six = rollHasSix(rolls)
  next.faces = [...rolls]
  next.lastRoll = { rolls: [...rolls], six }
  if (six && next.config.sixEndsNight) {
    const outcome = loseOrSaveInside(next)
    return endNight(next, 'six', outcome.lost, outcome.sombraSaved)
  }
  next.phase = 'ready'
  return next
}

export function performRoll(state: GameState): GameState {
  if (state.phase !== 'roll') throw new Error('Ahora no se tira el dado.')
  let rng = state.rng
  const rolls: number[] = []
  for (let index = 0; index < state.diceCount; index += 1) {
    const face = nextInt(rng, 1, 6)
    rng = face.rng
    rolls.push(face.value)
  }
  const next = draft(state)
  next.rng = rng
  next.phase = 'roll'
  return resolveRoll(next, rolls)
}

export function acknowledgeDevil(state: GameState): GameState {
  if (state.phase !== 'devil' || !state.nightEnd) throw new Error('El Diablo no está en escena.')
  const next = draft(state)
  next.phase = 'night-end'
  return next
}

function openNextNight(state: GameState): GameState {
  if (state.nightIndex + 1 >= state.config.nights) {
    state.finalScore = scoreGame(state)
    state.phase = 'final'
    return state
  }
  state.nightIndex += 1
  state.round = 0
  state.diceCount = state.config.startDice
  state.guardiaDice = 0
  state.faces = []
  state.phase = 'curtain'
  state.nightEnd = null
  state.lastDrawn = []
  state.lastRoll = null
  return state
}

export function continueAfterNight(state: GameState): GameState {
  if (state.phase !== 'night-end') throw new Error('La noche no ha cerrado.')
  const next = draft(state)
  const last = next.nightIndex + 1 >= next.config.nights
  if (!last && next.config.actions.drawAfterEachNightExceptLast) {
    for (const id of seatOrder(next)) {
      const card = next.actionDeck[0]
      if (!card) break
      next.actionDeck = next.actionDeck.slice(1)
      const person = playerAt(next, id)
      person.hand = [...person.hand, card]
    }
    const queue = seatOrder(next).filter((id) => playerAt(next, id).hand.length > next.config.actions.handLimit)
    if (queue.length > 0) {
      next.trimQueue = queue
      next.phase = 'trim'
      return next
    }
  }
  return openNextNight(next)
}

export function discardDown(state: GameState, playerId: number, dropIds: readonly string[]): GameState {
  if (state.phase !== 'trim' || state.trimQueue[0] !== playerId) throw new Error('No te toca descartar.')
  const next = draft(state)
  const person = playerAt(next, playerId)
  const extra = person.hand.length - next.config.actions.handLimit
  if (dropIds.length !== extra) throw new Error('Hay que descartar justo lo que sobra.')
  for (const id of dropIds) spend(next, person, id)
  next.trimQueue = next.trimQueue.slice(1)
  if (next.trimQueue.length > 0) return next
  return openNextNight(next)
}

export function playerPoints(cards: readonly LootCard[]): number {
  return cards.reduce((sum, card) => sum + card.points, 0)
}
