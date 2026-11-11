import type { ActionCard, ActionPayload, GameState, LootCard, PlayerState } from './types'

export function targetsPlayer(action: ActionCard['action']): boolean {
  return action === 'saqueo' || action === 'quebranto' || action === 'trasiego' || action === 'vistazo'
}

export function isTheft(action: ActionCard['action']): boolean {
  return action === 'saqueo' || action === 'quebranto' || action === 'trasiego'
}

export function addDice(state: GameState, amount: number, persistent: boolean): number {
  const room = state.config.maxDice - state.diceCount
  const added = Math.max(0, Math.min(amount, room))
  state.diceCount += added
  if (persistent) state.guardiaDice = Math.min(state.diceCount, state.guardiaDice + added)
  return added
}

export function removeDice(state: GameState, amount: number): number {
  const removable = Math.min(amount, state.diceCount - state.guardiaDice, state.diceCount - state.config.minDice)
  const removed = Math.max(0, removable)
  state.diceCount -= removed
  return removed
}

function player(state: GameState, id: number): PlayerState {
  const found = state.players[id]
  if (!found || found.id !== id) throw new Error('Ese asiento no está.')
  return found
}

function takeBottle(cards: LootCard[], id: string): LootCard {
  const index = cards.findIndex((card) => card.id === id)
  if (index < 0) throw new Error('Esa botella no está.')
  const card = cards[index]
  if (!card) throw new Error('Esa botella no está.')
  cards.splice(index, 1)
  return card
}

export function applyAction(state: GameState, actorId: number, card: ActionCard, payload: ActionPayload): void {
  const actor = player(state, actorId)
  const targetId = payload.targetId
  if (isTheft(card.action)) {
    if (targetId === undefined) throw new Error('Falta el rival.')
    const target = player(state, targetId)
    if (target.id === actor.id) throw new Error('No puedes apuntarte a ti.')
    if (target.escondite) throw new Error('Está escondido: no se le roba, ni se le quiebra, ni se le traspasa.')
  }

  switch (card.action) {
    case 'saqueo': {
      const target = player(state, targetId ?? -1)
      const bottle = takeBottle(target.secured, payload.bottleId ?? '')
      actor.secured = [...actor.secured, bottle]
      return
    }
    case 'quebranto': {
      const target = player(state, targetId ?? -1)
      const bottle = takeBottle(target.secured, payload.bottleId ?? '')
      state.lootDiscard = [...state.lootDiscard, bottle]
      return
    }
    case 'trasiego': {
      const target = player(state, targetId ?? -1)
      const given = takeBottle(actor.secured, payload.giveId ?? '')
      const taken = takeBottle(target.secured, payload.takeId ?? '')
      actor.secured = [...actor.secured, taken]
      target.secured = [...target.secured, given]
      return
    }
    case 'delacion': {
      addDice(state, 1, false)
      return
    }
    case 'alarma': {
      addDice(state, 2, false)
      return
    }
    case 'escondite': {
      actor.escondite = true
      return
    }
    case 'vistazo': {
      if (targetId === undefined || targetId === actor.id) throw new Error('Hay que mirar a un rival.')
      player(state, targetId)
      state.peek = { viewerId: actor.id, targetId }
      return
    }
    case 'sombra': {
      actor.sombra = true
      return
    }
    case 'tranca':
      throw new Error('La tranca se juega cuando te apuntan, no al empezar la noche.')
    default:
      return
  }
}

export function canAnswerWithTranca(state: GameState, targetId: number): boolean {
  return player(state, targetId).hand.some((card) => card.action === 'tranca')
}
