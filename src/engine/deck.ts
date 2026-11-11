import { BODEGA_SIZE, CEPAS } from '../config'
import { shuffle, type RngState } from './rng'
import type { Bottle } from './types'

export function makeDeck(rng: RngState): { rng: RngState; deck: Bottle[] } {
  const deck: Bottle[] = []
  for (let index = 0; index < BODEGA_SIZE; index += 1) {
    deck.push({
      id: `botella-${index + 1}`,
      cepa: CEPAS[index % CEPAS.length] ?? 'Carmenère',
      drawnInIncursion: -1,
    })
  }
  const shuffled = shuffle(rng, deck)
  return { rng: shuffled.rng, deck: shuffled.items }
}
