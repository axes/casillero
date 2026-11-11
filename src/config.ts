/**
 * Valores del prototipo digital v0.3.
 * El motor lee esta configuración: la vista no debe repetir estos números.
 * Fuente: docs/casillero-reglas-v0.3.md
 * candleAbsorbsFirstSix y startLocked quedan apagados: la vela ahora es una carta.
 */
export interface EventSpec {
  count: number
  addDice?: number
  removeDice?: number
  removeCounterOrDie?: boolean
  loseExposedIfAtLeast?: number
  choiceBottleAndDie?: boolean
  addCounter?: number
  swapWithRichestExposed?: boolean
}

export interface GameConfig {
  playersMin: number
  playersMax: number
  incursions: number
  /** Dados con los que entra cada incursión. */
  startDice: readonly number[]
  minDice: number
  maxDice: number
  devilAtCounters: number
  /** Tope de marcas que una tirada puede sumar, aunque salgan varios 6. */
  maxCountersPerRoll: number
  /** Marcas del Diablo al entrar a cada incursión. */
  startCounters: readonly number[]
  valueMultiplier: readonly number[]
  incursionNames: readonly string[]
  offeringThreshold: number
  fleePenalty: number
  unanimousLeave: boolean
  lastIncursionDevilIneligible: boolean
  rotateFirstActorEachIncursion: boolean
  discardLostBottles: boolean
  /** Botellas de la bodega. No vuelven si se pierden. */
  bottleCount: number
  /** Al empezar cada incursión se reponen las 12 cartas de evento. */
  eventsRestockEachIncursion: boolean
  events: {
    ruido: EventSpec
    barricaCae: EventSpec
    silencio: EventSpec
    vela: EventSpec
    eco: EventSpec
    encrucijada: EventSpec
    pisada: EventSpec
    trasiego: EventSpec
  }
  /** Heredado de v0.2. En v0.3 no se usa: la vela es una carta. */
  candleAbsorbsFirstSix: boolean
  /** Heredado de v0.2. En v0.3 los dados no se bloquean. */
  startLocked: readonly number[]
  soloSaqueoCap: number | null
  mysteryBottles: number
  /** Dobles y triples. Apagado: el caos entra por los eventos. */
  specialDiceEffects: boolean
}

export const gameConfig = {
  playersMin: 3,
  playersMax: 6,
  incursions: 3,
  startDice: [1, 1, 1],
  minDice: 1,
  maxDice: 3,
  devilAtCounters: 3,
  maxCountersPerRoll: 1,
  startCounters: [0, 1, 1],
  valueMultiplier: [1, 2, 3],
  incursionNames: ['Las tinajas', 'Las cavas', 'La sacristía'],
  offeringThreshold: 14,
  fleePenalty: 1,
  unanimousLeave: true,
  lastIncursionDevilIneligible: true,
  rotateFirstActorEachIncursion: true,
  discardLostBottles: true,
  bottleCount: 40,
  eventsRestockEachIncursion: true,
  events: {
    ruido: { count: 3, addDice: 1 },
    barricaCae: { count: 2, addDice: 2 },
    silencio: { count: 2, removeDice: 1 },
    vela: { count: 1, removeCounterOrDie: true },
    eco: { count: 1, loseExposedIfAtLeast: 2 },
    encrucijada: { count: 1, choiceBottleAndDie: true },
    pisada: { count: 1, addCounter: 1 },
    trasiego: { count: 1, swapWithRichestExposed: true },
  },
  candleAbsorbsFirstSix: false,
  startLocked: [0, 0, 0],
  soloSaqueoCap: null,
  mysteryBottles: 0,
  specialDiceEffects: false,
} as const satisfies GameConfig

export const CEPAS = [
  'Carmenère',
  'Cabernet',
  'País',
  'Syrah',
  'Cinsault',
  'Carignan',
  'Merlot',
  'Moscatel',
  'Semillón',
  'Chardonnay',
  'Sauvignon',
  'Pedro Jiménez',
] as const

export const EVENT_IDS = [
  'ruido',
  'barricaCae',
  'silencio',
  'vela',
  'eco',
  'encrucijada',
  'pisada',
  'trasiego',
] as const
