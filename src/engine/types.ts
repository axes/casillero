import type { GameConfig } from '../config'

export interface Bottle {
  id: string
  cepa: string
  /** Incursión en la que se robó. -1 mientras sigue en la bodega. */
  drawnInIncursion: number
}

export interface Die {
  /** 1–6, o 0 si ese dado libre todavía no se tira en esta incursión. */
  value: number
  locked: boolean
}

export type Vote = 'exit' | 'continue'
export type FlightChoice = 'flee' | 'stay'

export type Phase = 'intro' | 'ready' | 'vote' | 'flight' | 'devil' | 'summary' | 'final'

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

export interface LastRaid {
  playerId: number
  drawn: Bottle
  rolls: number[]
  /** Índices del arreglo de dados que se lanzaron en este saqueo. */
  rolledIndices: number[]
  absorbedIndex: number | null
  devil: boolean
  lockedCount: number
}

export interface IncursionRecord {
  index: number
  name: string
  reason: EndReason
  raids: number
  gained: Bottle[][]
  lost: Bottle[][]
  stainedIds: number[]
  mystery: Bottle[]
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
  deck: Bottle[]
  discard: Bottle[]
  players: PlayerState[]
  incursionIndex: number
  phase: Phase
  candleLit: boolean
  dice: Die[]
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
  mysteryRevealed: Bottle[]
  finalScore: FinalScore | null
  raidSerial: number
}
