import { describe, expect, it } from 'vitest'
import { createGame, gameConfig, stepRaid } from '../src/engine'
import type { GameConfig } from '../src/engine'
import { bankIncursion, facedRaid, fleePending, ready, voteAll } from './helpers'

describe('mesa y bodega', () => {
  it('acepta de 3 a 6 y rechaza el resto', () => {
    expect(createGame(['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín'], 1).players).toHaveLength(6)
    expect(() => createGame(['Rosa', 'Mateo'], 1)).toThrow(/3 a 6/)
    expect(() => createGame(['Rosa', 'Mateo', ' '], 1)).toThrow(/nombre/)
  })

  it('la misma semilla arma la misma bodega', () => {
    const once = createGame(['Rosa', 'Mateo', 'Camila'], 21)
    const twice = createGame(['Rosa', 'Mateo', 'Camila'], 21)
    expect(once.deck.map((card) => card.id)).toEqual(twice.deck.map((card) => card.id))
    expect(once.deck.filter((card) => card.kind === 'bottle')).toHaveLength(gameConfig.bottleCount)
    expect(once.deck.filter((card) => card.kind === 'event')).toHaveLength(12)
  })

  it('si se acaba el mazo, lo expuesto se asegura', () => {
    let state = ready()
    state = { ...state, deck: [] }
    state = stepRaid(state, [])
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('cellar-empty')
  })

  it('el tope en solitario se lee de la config y en v0.3 no existe', () => {
    expect(gameConfig.soloSaqueoCap).toBeNull()
    const config: GameConfig = { ...gameConfig, soloSaqueoCap: 1 }
    let state = ready(undefined, 1, config)
    state = facedRaid(state, 1)
    state = voteAll(state, (playerId) => (playerId === 0 ? 'continue' : 'exit'))
    state = fleePending(state, () => 'flee')
    state = facedRaid(state, 1)
    expect(state.soloRaids).toBe(1)
    expect(state.phase).toBe('vote')
    state = voteAll(state, 'continue')
    state = stepRaid(state, [])
    expect(state.phase).toBe('summary')
    expect(state.currentRecord?.reason).toBe('solo-cap')
    expect(state.players[0]?.secured).toHaveLength(2)
  })

  it('en v0.3 el cierre no revela misteriosas', () => {
    const state = bankIncursion(ready(), 1)
    expect(state.currentRecord?.mystery).toEqual([])
    expect(state.config.mysteryBottles).toBe(0)
  })
})
