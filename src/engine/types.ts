import type { ACTION_IDS, EVENT_IDS } from '../config'
import type { GameConfig } from '../config'

export type EventId = (typeof EVENT_IDS)[number]
export type ActionId = (typeof ACTION_IDS)[number]
export type LeaveChoice = 'leave' | 'stay'

export interface LootCard {
  kind: 'loot'
  id: string
  points: 1 | 2 | 3
  name: string
}

export interface BodegaEventCard {
  kind: 'event'
  id: string
  event: EventId
}

export type BodegaCard = LootCard | BodegaEventCard

export interface ActionCard {
  id: string
  action: ActionId
}

export interface PlayerState {
  id: number
  name: string
  exposed: LootCard[]
  secured: LootCard[]
  hand: ActionCard[]
  inside: boolean
  escondite: boolean
  sombra: boolean
}

export interface ActionPayload {
  targetId?: number
  bottleId?: string
  giveId?: string
  takeId?: string
}

export interface PendingAction {
  actorId: number
  card: ActionCard
  payload: ActionPayload
}

export interface DrawnThisRound {
  playerId: number
  card: BodegaCard
}

export type NightEndReason = 'six' | 'all-left' | 'auto-bank'

export interface NightEnd {
  reason: NightEndReason
  lost: LootCard[][]
  sombraSaved: number[]
}

export type Phase =
  | 'curtain'
  | 'actions'
  | 'tranca'
  | 'peek'
  | 'ready'
  | 'vote'
  | 'roll'
  | 'devil'
  | 'night-end'
  | 'trim'
  | 'final'

export interface ScoreRow {
  playerId: number
  name: string
  points: number
  bottles: number
  leftover: number
}

export interface FinalScore {
  rows: ScoreRow[]
  winners: number[]
  tie: boolean
}

export interface GameState {
  config: GameConfig
  seed: number
  rng: { s: number }
  piles: BodegaCard[][]
  actionDeck: ActionCard[]
  actionDiscard: ActionCard[]
  lootDiscard: LootCard[]
  players: PlayerState[]
  nightIndex: number
  round: number
  phase: Phase
  firstPlayerId: number
  actionTurn: number | null
  diceCount: number
  guardiaDice: number
  faces: number[]
  pending: PendingAction | null
  peek: { viewerId: number; targetId: number } | null
  votes: { playerId: number; choice: LeaveChoice }[]
  lastDrawn: DrawnThisRound[]
  lastRoll: { rolls: number[]; six: boolean } | null
  nightEnd: NightEnd | null
  trimQueue: number[]
  finalScore: FinalScore | null
}
