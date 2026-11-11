import { describe, expect, it } from 'vitest'
import { BODEGA_SIZE, createGame, stepRaid } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { gameConfig } from '../src/engine'
import { bankIncursion, fleePending, ready, voteAll } from './helpers'

describe('mesa y bodega', () => {
  it('acepta de 3 a 6 y rechaza el resto', () => {
    expect(createGame(['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín'], 1).players).toHaveLength(6)
    expect(() => createGame(['Rosa', 'Mateo'], 1)).toThrow(/3 a 6/)
    expect(() => createGame(['Rosa', 'Mateo', ' '], 1)).toThrow(/nombre/)
  })

  it('la misma semilla arma la misma bodega', () => {
    const once = createGame(['Rosa', 'Mateo', 'Camila'], 21)
    const twice = createGame(['Rosa', 'Mateo', 'Camila'], 21)
    expect(once.deck.map((bottle) => bottle.id)).toEqual(twice.deck.map((bottle) => bottle.id))
    expect(once.deck).toHaveLength(BODEGA_SIZE)
    expect(new Set(once.deck.map((bottle) => bottle.id)).size).toBe(BODEGA_SIZE)
  })

  it('si se acaban las botellas, lo expuesto se asegura y la incursión cierra', () => {
    let state = ready()
    state = { ...state, deck: [] }
    state = stepRaid(state, [])
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('cellar-empty')
  })

  it('el tope en solitario se lee de la config y en v0.2 no existe', () => {
    expect(gameConfig.soloSaqueoCap).toBeNull()
    const config: GameConfig = { ...gameConfig, soloSaqueoCap: 1 }
    let state = ready(undefined, 1, config)
    state = stepRaid(state, [1, 2, 3])
    state = voteAll(state, (playerId) => (playerId === 0 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    state = stepRaid(state, [1, 2, 3])
    expect(state.soloRaids).toBe(1)
    expect(state.phase).toBe('vote')
    state = voteAll(state, 'continue')
    expect(state.phase).toBe('ready')
    state = stepRaid(state, [1, 2, 3])
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('solo-cap')
    expect(state.players[0]?.secured).toHaveLength(2)
  })

  it('las botellas misteriosas se revelan al cierre si la config lo pide', () => {
    const config: GameConfig = { ...gameConfig, mysteryBottles: 2 }
    const state = bankIncursion(ready(undefined, 1, config), 1)
    expect(state.currentRecord?.mystery).toHaveLength(2)
    expect(state.mysteryRevealed.map((bottle) => bottle.id)).toEqual(state.currentRecord?.mystery.map((bottle) => bottle.id))
    expect(state.deck).toHaveLength(BODEGA_SIZE - 3)
    for (const bottle of state.currentRecord?.mystery ?? []) {
      expect(state.deck.map((card) => card.id)).not.toContain(bottle.id)
    }
  })

  it('en v0.2 el cierre no revela misteriosas', () => {
    const state = bankIncursion(ready(), 1)
    expect(state.currentRecord?.mystery).toEqual([])
    expect(state.config.mysteryBottles).toBe(0)
  })
})
