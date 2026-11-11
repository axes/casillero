import { CEPAS, EVENT_IDS, type GameConfig } from '../config'
import { shuffle, type RngState } from './rng'
import type { Bottle, DeckCard, EventCard, EventId } from './types'

export function eventTotal(config: GameConfig): number {
  return EVENT_IDS.reduce((sum, id) => sum + config.events[id].count, 0)
}

export function makeBottleDeck(rng: RngState, config: GameConfig): { rng: RngState; deck: Bottle[] } {
  const deck: Bottle[] = []
  for (let index = 0; index < config.bottleCount; index += 1) {
    deck.push({
      kind: 'bottle',
      id: `botella-${index + 1}`,
      cepa: CEPAS[index % CEPAS.length] ?? 'Carmenère',
      drawnInIncursion: -1,
    })
  }
  const shuffled = shuffle(rng, deck)
  return { rng: shuffled.rng, deck: shuffled.items }
}

export function freshEvents(incursionIndex: number, config: GameConfig): EventCard[] {
  const cards: EventCard[] = []
  for (const id of EVENT_IDS) {
    const count = config.events[id].count
    for (let copy = 0; copy < count; copy += 1) {
      cards.push({
        kind: 'event',
        id: `evento-${incursionIndex}-${id}-${copy + 1}`,
        event: id,
      })
    }
  }
  return cards
}

/** Saca los eventos que quedaron y mezcla un mazo fresco con las botellas que siguen. */
export function restockDeck(
  rng: RngState,
  deck: readonly DeckCard[],
  incursionIndex: number,
  config: GameConfig,
): { rng: RngState; deck: DeckCard[] } {
  const bottles = deck.filter((card): card is Bottle => card.kind === 'bottle')
  if (!config.eventsRestockEachIncursion) {
    return { rng, deck: bottles.map((bottle) => ({ ...bottle })) }
  }
  const mixed = shuffle(rng, [...bottles.map((bottle) => ({ ...bottle })), ...freshEvents(incursionIndex, config)])
  return { rng: mixed.rng, deck: mixed.items }
}

export function isEvent(card: DeckCard, event: EventId): boolean {
  return card.kind === 'event' && card.event === event
}
