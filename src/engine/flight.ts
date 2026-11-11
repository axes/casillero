import { shuffle, type RngState } from './rng'
import type { Bottle } from './types'

/**
 * Mezcla el botín expuesto y pierde las primeras `penalty` cartas de esa mezcla.
 * Si hay menos cartas que la pena, se pierden todas. Con cero cartas no se pierde nada.
 */
export function splitFlight(
  rng: RngState,
  exposed: readonly Bottle[],
  penalty: number,
): { rng: RngState; lost: Bottle[]; kept: Bottle[] } {
  const mixed = shuffle(rng, exposed)
  const losses = Math.min(Math.max(penalty, 0), mixed.items.length)
  return {
    rng: mixed.rng,
    lost: mixed.items.slice(0, losses),
    kept: mixed.items.slice(losses),
  }
}
