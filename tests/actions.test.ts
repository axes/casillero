import { describe, expect, it } from 'vitest'
import {
  acknowledgePeek,
  enterNight,
  playAction,
  respondTranca,
  type ActionCard,
  type GameState,
} from '../src/engine'
import { curtain, giveLoot, passAllActions } from './helpers'

function card(action: ActionCard['action'], id?: string): ActionCard {
  return { id: id ?? action, action }
}

function atNightTwo(hands: ActionCard[][]): GameState {
  const state = curtain(undefined, 2, { ...curtain().config, rotateFirstPlayer: false })
  return enterNight({
    ...state,
    nightIndex: 1,
    phase: 'curtain',
    players: state.players.map((player, index) => ({
      ...player,
      hand: hands[index] ?? [],
      secured: index === 1 ? [giveLoot(3, 'reserva-m'), giveLoot(1, 'joven-m')] : index === 0 ? [giveLoot(2, 'mia')] : [],
    })),
  })
}

describe('cartas de acción', () => {
  it('Saqueo toma una botella segura', () => {
    let state = atNightTwo([[card('saqueo')], [], []])
    expect(state.actionTurn).toBe(0)
    state = playAction(state, 0, 'saqueo', { targetId: 1, bottleId: 'reserva-m' })
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toContain('reserva-m')
    expect(state.players[1]?.secured.map((bottle) => bottle.id)).toEqual(['joven-m'])
    expect(state.actionDiscard.map((held) => held.id)).toContain('saqueo')
  })

  it('Quebranto manda una botella segura al descarte', () => {
    const state = playAction(atNightTwo([[card('quebranto')], [], []]), 0, 'quebranto', {
      targetId: 1,
      bottleId: 'joven-m',
    })
    expect(state.lootDiscard.map((bottle) => bottle.id)).toEqual(['joven-m'])
    expect(state.players[1]?.secured.map((bottle) => bottle.id)).toEqual(['reserva-m'])
  })

  it('Trasiego cambia una botella segura por otra', () => {
    const state = playAction(atNightTwo([[card('trasiego')], [], []]), 0, 'trasiego', {
      targetId: 1,
      giveId: 'mia',
      takeId: 'reserva-m',
    })
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toEqual(['reserva-m'])
    expect(state.players[1]?.secured.map((bottle) => bottle.id)).toContain('mia')
  })

  it('Delación y Alarma suben el dado de la noche', () => {
    const delacion = playAction(atNightTwo([[card('delacion')], [], []]), 0, 'delacion')
    expect(delacion.diceCount).toBe(2)
    const alarma = playAction(atNightTwo([[card('alarma')], [], []]), 0, 'alarma')
    expect(alarma.diceCount).toBe(3)
    const capped = playAction(
      {
        ...atNightTwo([[card('alarma', 'a2')], [], []]),
        diceCount: 3,
      },
      0,
      'a2',
    )
    expect(capped.diceCount).toBe(3)
  })

  it('Escondite impide saqueo, quebranto y trasiego', () => {
    let state = atNightTwo([[card('escondite')], [card('saqueo', 's2')], []])
    state = playAction(state, 0, 'escondite')
    state = passAllActions(state)
    state = enterNight({ ...state, nightIndex: 1, phase: 'curtain' })
    // La noche ya empezó; el escondite se limpia al entrar. Se marca a mano para el turno siguiente.
    state = {
      ...state,
      players: state.players.map((player) => (player.id === 0 ? { ...player, escondite: true, hand: [] } : player)),
      phase: 'actions',
      actionTurn: 1,
    }
    expect(() => playAction(state, 1, 's2', { targetId: 0, bottleId: 'mia' })).toThrow(/escondido/)
  })

  it('Vistazo muestra la mano y Sombra se queda en la persona', () => {
    let state = atNightTwo([[card('vistazo')], [card('saqueo', 'oculta')], []])
    state = playAction(state, 0, 'vistazo', { targetId: 1 })
    expect(state.phase).toBe('peek')
    expect(state.peek).toEqual({ viewerId: 0, targetId: 1 })
    expect(state.players[1]?.hand.map((held) => held.action)).toEqual(['saqueo'])
    state = acknowledgePeek(state)
    expect(state.actionTurn).toBe(1)

    const sombra = playAction(atNightTwo([[card('sombra')], [], []]), 0, 'sombra')
    expect(sombra.players[0]?.sombra).toBe(true)
  })

  it('Tranca cancela un ataque que te apunta', () => {
    let state = atNightTwo([[card('saqueo')], [card('tranca')], []])
    state = playAction(state, 0, 'saqueo', { targetId: 1, bottleId: 'reserva-m' })
    expect(state.phase).toBe('tranca')
    state = respondTranca(state, true)
    expect(state.players[1]?.secured.map((bottle) => bottle.id)).toContain('reserva-m')
    expect(state.players[0]?.secured.map((bottle) => bottle.id)).toEqual(['mia'])
    expect(state.actionDiscard.map((held) => held.action).sort()).toEqual(['saqueo', 'tranca'])
    expect(state.phase).toBe('actions')
  })

  it('sin tranca el ataque sigue', () => {
    let state = atNightTwo([[card('quebranto')], [card('tranca')], []])
    state = playAction(state, 0, 'quebranto', { targetId: 1, bottleId: 'joven-m' })
    state = respondTranca(state, false)
    expect(state.lootDiscard.map((bottle) => bottle.id)).toEqual(['joven-m'])
    expect(state.players[1]?.hand.map((held) => held.action)).toEqual(['tranca'])
  })
})
