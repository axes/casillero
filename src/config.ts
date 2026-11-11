/**
 * Prototipo digital v0.4.
 * Fuente: docs/casillero-reglas-v0.4.md
 * El diseñador cerró tres preguntas abiertas: 4 noches, el 6 pierde lo expuesto,
 * y el empate se comparte (tiebreakLeftoverPile en false).
 */
export interface DiceEventSpec {
  count: number
  addDice?: number
  removeDice?: number
  persistent?: boolean
}

export interface GameConfig {
  playersMin: number
  playersMax: number
  nights: number
  maxRoundsPerNight: number
  startDice: number
  minDice: number
  maxDice: number
  sharedDie: boolean
  sixEndsNight: boolean
  devilCounters: boolean
  exposedLostOnSix: boolean
  autoBankAfterLastRound: boolean
  simultaneousDraw: boolean
  personalPiles: boolean
  pileSizeByPlayers: Readonly<Record<'3' | '4' | '5' | '6', number>>
  bodegaSize: number
  loot: Readonly<Record<'1' | '2' | '3', number>>
  events: {
    ruido: DiceEventSpec
    barricaCae: DiceEventSpec
    silencio: DiceEventSpec
    guardia: DiceEventSpec
  }
  actions: {
    deckSize: number
    drawAfterEachNightExceptLast: boolean
    handLimit: number
    playFromNight: number
    playsPerNight: number
    cards: {
      saqueo: number
      quebranto: number
      trasiego: number
      delacion: number
      alarma: number
      tranca: number
      escondite: number
      vistazo: number
      sombra: number
    }
  }
  tiebreakLeftoverPile: boolean
  curtainShowsScores: boolean
  rotateFirstPlayer: boolean
  offeringThreshold: number | null
  lastIncursionDevilIneligible: boolean
}

export const gameConfig = {
  playersMin: 3,
  playersMax: 6,
  nights: 4,
  maxRoundsPerNight: 3,
  startDice: 1,
  minDice: 1,
  maxDice: 3,
  sharedDie: true,
  sixEndsNight: true,
  devilCounters: false,
  exposedLostOnSix: true,
  autoBankAfterLastRound: true,
  simultaneousDraw: true,
  personalPiles: true,
  pileSizeByPlayers: { 3: 20, 4: 15, 5: 12, 6: 10 },
  bodegaSize: 60,
  loot: { 1: 24, 2: 16, 3: 10 },
  events: {
    ruido: { count: 4, addDice: 1 },
    barricaCae: { count: 2, addDice: 2 },
    silencio: { count: 2, removeDice: 1 },
    guardia: { count: 2, addDice: 1, persistent: true },
  },
  actions: {
    deckSize: 30,
    drawAfterEachNightExceptLast: true,
    handLimit: 3,
    playFromNight: 2,
    playsPerNight: 1,
    cards: {
      saqueo: 5,
      quebranto: 4,
      trasiego: 3,
      delacion: 4,
      alarma: 2,
      tranca: 3,
      escondite: 3,
      vistazo: 3,
      sombra: 3,
    },
  },
  tiebreakLeftoverPile: false,
  curtainShowsScores: true,
  rotateFirstPlayer: true,
  offeringThreshold: null,
  lastIncursionDevilIneligible: false,
} as const satisfies GameConfig

export const LOOT_NAMES = {
  1: 'Vino joven',
  2: 'Reserva',
  3: 'Gran reserva',
} as const

export const ACTION_IDS = [
  'saqueo',
  'quebranto',
  'trasiego',
  'delacion',
  'alarma',
  'tranca',
  'escondite',
  'vistazo',
  'sombra',
] as const

export const EVENT_IDS = ['ruido', 'barricaCae', 'silencio', 'guardia'] as const
