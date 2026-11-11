import type { GameConfig } from '../config'
import { clampDice } from './dice'
import { splitFlight } from './flight'
import type { Bottle, EventId, EventResolution, GameState, PlayerState } from './types'

export function emptyResolution(event: EventId): EventResolution {
  return {
    event,
    diceDelta: 0,
    counterDelta: 0,
    devil: false,
    lost: [],
    swapWith: null,
    choice: null,
    extraBottle: null,
  }
}

export function adjustDice(state: GameState, delta: number): number {
  const next = clampDice(state.diceCount + delta, state.config.minDice, state.config.maxDice)
  const applied = next - state.diceCount
  state.diceCount = next
  if (next > state.faces.length) {
    while (state.faces.length < next) state.faces.push(0)
  } else if (next < state.faces.length) {
    state.faces = state.faces.slice(0, next)
  }
  return applied
}

export function pullFirstBottle(state: GameState): Bottle | null {
  const index = state.deck.findIndex((card) => card.kind === 'bottle')
  if (index < 0) return null
  const card = state.deck[index]
  if (!card || card.kind !== 'bottle') return null
  state.deck = state.deck.filter((_, cardIndex) => cardIndex !== index)
  return { ...card, drawnInIncursion: state.incursionIndex }
}

function loseOneExposed(state: GameState, player: PlayerState): Bottle | null {
  if (player.exposed.length === 0) return null
  const split = splitFlight(state.rng, player.exposed, 1)
  state.rng = split.rng
  player.exposed = split.kept
  const lost = split.lost[0] ?? null
  if (!lost) return null
  const pile = state.lostThisIncursion[player.id] ?? []
  state.lostThisIncursion[player.id] = [...pile, lost]
  if (state.config.discardLostBottles) state.discard.push(lost)
  else state.deck.push(lost)
  return lost
}

function richestClockwise(state: GameState, active: PlayerState): PlayerState | null {
  let best = -1
  for (const player of state.players) {
    if (!player.inside || player.id === active.id) continue
    if (player.exposed.length > active.exposed.length) best = Math.max(best, player.exposed.length)
  }
  if (best < 0) return null
  const count = state.players.length
  for (let step = 1; step <= count; step += 1) {
    const candidate = state.players[(active.id + step) % count]
    if (candidate?.inside && candidate.exposed.length === best && candidate.exposed.length > active.exposed.length) {
      return candidate
    }
  }
  return null
}

/**
 * Resuelve un evento ya robado. Encrucijada no elige todavía: deja la elección pendiente.
 * Pisada puede despertar al Diablo sin tirada.
 */
export function resolveEvent(state: GameState, event: EventId, config: GameConfig): EventResolution {
  const resolution = emptyResolution(event)
  const spec = config.events[event]
  if (config.specialDiceEffects) {
    // v0.3 no apila dobles ni triples encima de los eventos.
  }

  if (event === 'ruido' || event === 'barricaCae') {
    resolution.diceDelta = adjustDice(state, spec.addDice ?? 0)
    return resolution
  }
  if (event === 'silencio') {
    resolution.diceDelta = adjustDice(state, -(spec.removeDice ?? 0))
    return resolution
  }
  if (event === 'vela') {
    if (state.counters > 0) {
      state.counters -= 1
      resolution.counterDelta = -1
    } else {
      resolution.diceDelta = adjustDice(state, -1)
    }
    return resolution
  }
  if (event === 'eco') {
    const threshold = spec.loseExposedIfAtLeast ?? 2
    const lost: Bottle[][] = state.players.map(() => [])
    const count = state.players.length
    for (let step = 0; step < count; step += 1) {
      const player = state.players[(state.activePlayerId + step) % count]
      if (!player?.inside || player.exposed.length < threshold) continue
      const bottle = loseOneExposed(state, player)
      if (bottle) lost[player.id] = [bottle]
    }
    resolution.lost = lost
    return resolution
  }
  if (event === 'encrucijada') {
    return resolution
  }
  if (event === 'pisada') {
    const gain = spec.addCounter ?? 1
    const before = state.counters
    state.counters = Math.min(config.devilAtCounters, state.counters + gain)
    resolution.counterDelta = state.counters - before
    resolution.devil = state.counters >= config.devilAtCounters
    return resolution
  }
  if (event === 'trasiego') {
    const active = state.players[state.activePlayerId]
    if (!active) return resolution
    const other = richestClockwise(state, active)
    if (!other) return resolution
    const swapped = active.exposed
    active.exposed = other.exposed
    other.exposed = swapped
    resolution.swapWith = other.id
  }
  return resolution
}
