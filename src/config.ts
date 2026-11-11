/**
 * Valores del prototipo digital v0.2.
 * El motor lee esta configuración: la vista no debe repetir estos números.
 * Fuente: docs/casillero-reglas-v0.2.md
 */
export interface GameConfig {
  playersMin: number
  playersMax: number
  incursions: number
  /** Cantidad de dados. Cada dado es un d6; el 6 es la cara que se bloquea. */
  dice: number
  devilAtLockedSixes: number
  /** Dados que ya entran bloqueados en 6, por incursión. */
  startLocked: readonly number[]
  /** Si la vela se come el primer 6 de esa incursión. */
  candleAbsorbsFirstSix: readonly boolean[]
  /** Puntos de cada botella asegurada en esa incursión. */
  valueMultiplier: readonly number[]
  incursionNames: readonly string[]
  offeringThreshold: number
  /** Cartas que se pierden al huir. */
  fleePenalty: number
  /** La salida segura exige que todos los que siguen dentro voten salir. */
  unanimousLeave: boolean
  /** El 666 de la última incursión mancha a quienes seguían dentro. */
  lastIncursionDevilIneligible: boolean
  rotateFirstActorEachIncursion: boolean
  /** Las botellas perdidas no vuelven al mazo en esta partida. */
  discardLostBottles: boolean
  /** Tope de saqueos si queda una sola persona. null = sin tope (v0.2). */
  soloSaqueoCap: number | null
  /** Botellas que se revelan al cerrar la incursión. 0 en este prototipo. */
  mysteryBottles: number
  /** Dobles, triples y eventos de dado. Apagado en v0.2. */
  specialDiceEffects: boolean
}

export const gameConfig = {
  playersMin: 3,
  playersMax: 6,
  incursions: 3,
  dice: 3,
  devilAtLockedSixes: 3,
  startLocked: [0, 0, 1],
  candleAbsorbsFirstSix: [true, false, false],
  valueMultiplier: [1, 2, 3],
  incursionNames: ['Las tinajas', 'Las cavas', 'La sacristía'],
  offeringThreshold: 20,
  fleePenalty: 1,
  unanimousLeave: true,
  lastIncursionDevilIneligible: true,
  rotateFirstActorEachIncursion: true,
  discardLostBottles: true,
  soloSaqueoCap: null,
  mysteryBottles: 0,
  specialDiceEffects: false,
} as const satisfies GameConfig

export const BODEGA_SIZE = 72

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
