import { ACTION_IDS, EVENT_IDS, LOOT_NAMES, type GameConfig } from '../config'
import { shuffle, type RngState } from './rng'
import type { ActionCard, ActionId, BodegaCard, LootCard } from './types'

export function pileSizeFor(config: GameConfig, players: number): number {
  const key = String(players) as '3' | '4' | '5' | '6'
  const size = config.pileSizeByPlayers[key]
  if (!size) throw new Error('No hay tamaño de pila para esa mesa.')
  return size
}

export function makeBodega(config: GameConfig): BodegaCard[] {
  const cards: BodegaCard[] = []
  let n = 0
  const pushLoot = (points: 1 | 2 | 3, count: number) => {
    for (let copy = 0; copy < count; copy += 1) {
      n += 1
      cards.push({
        kind: 'loot',
        id: `botin-${points}-${n}`,
        points,
        name: LOOT_NAMES[points],
      })
    }
  }
  pushLoot(1, config.loot['1'])
  pushLoot(2, config.loot['2'])
  pushLoot(3, config.loot['3'])
  for (const id of EVENT_IDS) {
    const count = config.events[id].count
    for (let copy = 0; copy < count; copy += 1) {
      n += 1
      cards.push({ kind: 'event', id: `evento-${id}-${copy + 1}`, event: id })
    }
  }
  if (cards.length !== config.bodegaSize) {
    throw new Error('La bodega no suma 60 cartas.')
  }
  return cards
}

export function makeActionDeck(config: GameConfig): ActionCard[] {
  const cards: ActionCard[] = []
  for (const id of ACTION_IDS) {
    const count = config.actions.cards[id]
    for (let copy = 0; copy < count; copy += 1) {
      cards.push({ id: `accion-${id}-${copy + 1}`, action: id as ActionId })
    }
  }
  if (cards.length !== config.actions.deckSize) {
    throw new Error('El mazo de acciones no cuadra.')
  }
  return cards
}

export function dealPiles(rng: RngState, config: GameConfig, players: number): { rng: RngState; piles: BodegaCard[][] } {
  const size = pileSizeFor(config, players)
  if (size * players !== config.bodegaSize) {
    throw new Error('Las pilas no reparten la bodega entera.')
  }
  const shuffled = shuffle(rng, makeBodega(config))
  const piles: BodegaCard[][] = Array.from({ length: players }, () => [])
  shuffled.items.forEach((card, index) => {
    const seat = index % players
    piles[seat]?.push(card)
  })
  return { rng: shuffled.rng, piles }
}

export function dealActions(rng: RngState, config: GameConfig): { rng: RngState; deck: ActionCard[] } {
  const shuffled = shuffle(rng, makeActionDeck(config))
  return { rng: shuffled.rng, deck: shuffled.items }
}

export function loot(points: 1 | 2 | 3, id: string): LootCard {
  return { kind: 'loot', id, points, name: LOOT_NAMES[points] }
}
