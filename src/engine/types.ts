import type { EVENT_IDS } from '../config'
import type { GameConfig } from '../config'

export type EventId = (typeof EVENT_IDS)[number]

export interface Bottle {
  kind: 'bottle'
  id: string
  cepa: string
  /** Incursión en la que se robó. -1 mientras sigue en la bodega. */
  drawnInIncursion: number
}

export interface EventCard {
  kind: 'event'
  id: string
  event: EventId
}

export type DeckCard = Bottle | EventCard

export type Vote = 'exit' | 'continue'
export type FlightChoice = 'flee' | 'stay'
export type CrossroadsChoice = 'take' | 'pass'

export type Phase =
  | 'intro'
  | 'ready'
  | 'crossroads'
  | 'roll'
  | 'vote'
  | 'flight'
  | 'devil'
  | 'summary'
  | 'final'

export type EndReason = 'safe-exit' | 'devil' | 'all-fled' | 'cellar-empty' | 'solo-cap'

export interface PlayerState {
  id: number
  name: string
  exposed: Bottle[]
  secured: Bottle[]
  inside: boolean
  stained: boolean
}

export interface CastVote {
  playerId: number
  vote: Vote
}

export type DepartureKind = 'flee' | 'stay' | 'safe-leave'

export interface Departure {
  playerId: number
  kind: DepartureKind
  lost: Bottle[]
}

export interface EventResolution {
  event: EventId
  diceDelta: number
  counterDelta: number
  devil: boolean
  /** Botellas que el Eco hizo perder, por asiento. */
  lost: Bottle[][]
  /** Asiento con el que el Trasiego cambió el botín. null si no hubo cambio. */
  swapWith: number | null
  choice: CrossroadsChoice | null
  extraBottle: Bottle | null
}

export interface LastRaid {
  playerId: number
  card: DeckCard
  /** null si esta carta no llegó a tirada (Pisada que despierta, o Encrucijada aún sin elegir). */
  rolls: number[] | null
  faces: number[]
  diceBefore: number
  diceAfter: number
  countersBefore: number
  /** Marcas después de la carta y antes de los dados. */
  countersAfterEvent: number
  countersAfter: number
  addedFromSix: boolean
  devil: boolean
  devilFrom: 'roll' | 'pisada' | null
  event: EventResolution | null
}

export interface IncursionRecord {
  index: number
  name: string
  reason: EndReason
  raids: number
  gained: Bottle[][]
  lost: Bottle[][]
  stainedIds: number[]
  mystery: DeckCard[]
}

export interface ScoreRow {
  playerId: number
  name: string
  points: number
  bottles: number
  byIncursion: number[]
  eligible: boolean
  stained: boolean
}

export type ScoreOutcome = 'offering-failed' | 'no-eligible' | 'winner' | 'tie'

export interface FinalScore {
  offering: number
  threshold: number
  offeringMet: boolean
  winners: number[]
  breakdown: ScoreRow[]
  outcome: ScoreOutcome
}

export interface GameState {
  config: GameConfig
  seed: number
  rng: { s: number }
  deck: DeckCard[]
  discard: Bottle[]
  players: PlayerState[]
  incursionIndex: number
  phase: Phase
  /** Dados en juego, entre minDice y maxDice. */
  diceCount: number
  /** Última cara de cada dado. 0 si ese dado todavía no se tira. */
  faces: number[]
  /** Marcas del Diablo en esta incursión. */
  counters: number
  activePlayerId: number
  raidsThisIncursion: number
  soloRaids: number
  votes: CastVote[]
  revealedVotes: CastVote[]
  pendingFlight: number[]
  departures: Departure[]
  gainedThisIncursion: Bottle[][]
  lostThisIncursion: Bottle[][]
  stainedThisIncursion: number[]
  history: IncursionRecord[]
  currentRecord: IncursionRecord | null
  lastRaid: LastRaid | null
  mysteryRevealed: DeckCard[]
  finalScore: FinalScore | null
  raidSerial: number
}
