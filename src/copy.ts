import type { EndReason, FinalScore, GameState } from './engine'
import { pilePoints } from './engine'

const WINE_KIND = ['Vino joven', 'Reserva', 'Gran reserva'] as const

export function wineKind(index: number): string {
  return WINE_KIND[index] ?? `Incursión ${index + 1}`
}

export function threatCopy(band: 0 | 1 | 2 | 3): { title: string; line: string } {
  switch (band) {
    case 0:
      return { title: 'Duerme', line: 'El Diablo duerme.' }
    case 1:
      return { title: 'Escuchó algo', line: 'El Diablo escuchó algo.' }
    case 2:
      return { title: 'Está cerca', line: 'El Diablo está cerca.' }
    default:
      return { title: 'Aparece', line: 'El Diablo aparece.' }
  }
}

export function endCopy(reason: EndReason): string {
  switch (reason) {
    case 'safe-exit':
      return 'Salieron de acuerdo. El botín expuesto pasa entero a la colección segura.'
    case 'devil':
      return 'Apareció el Diablo. Quienes seguían dentro perdieron lo expuesto. Lo ya asegurado no se toca.'
    case 'all-fled':
      return 'Nadie se quedó en la bodega. Cada huida dejó su carta en el descarte.'
    case 'cellar-empty':
      return 'No quedaban botellas en la bodega. Lo expuesto se asegura.'
    case 'solo-cap':
      return 'El saqueo en solitario llegó a su tope. Lo expuesto se asegura.'
  }
}

export function endShort(reason: EndReason): string {
  switch (reason) {
    case 'safe-exit':
      return 'salida segura'
    case 'devil':
      return 'el Diablo'
    case 'all-fled':
      return 'todos huyeron'
    case 'cellar-empty':
      return 'bodega vacía'
    case 'solo-cap':
      return 'tope en solitario'
  }
}

export function describeRaid(state: GameState): string | null {
  const raid = state.lastRaid
  if (!raid) return null
  const name = state.players[raid.playerId]?.name ?? 'Alguien'
  const faces = raid.rolls.join(', ')
  let line = `${name} robó un ${raid.drawn.cepa}. Dados: ${faces}.`
  if (raid.absorbedIndex !== null) line += ' La vela se comió un 6.'
  if (raid.devil) line += ' Tres seises: despierta el Diablo.'
  return line
}

export function describeDepartures(state: GameState): string | null {
  if (state.phase === 'ready' && state.departures.length > 0) {
    return state.departures
      .map((departure) => {
        const name = state.players[departure.playerId]?.name ?? 'Alguien'
        if (departure.kind === 'flee') {
          if (departure.lost.length === 0) return `${name} huyó sin perder botellas.`
          const lost = departure.lost.map((bottle) => bottle.cepa).join(' y ')
          return `${name} huyó y perdió ${lost}.`
        }
        if (departure.kind === 'stay') return `${name} se queda y arriesga.`
        return `${name} salió con el botín asegurado.`
      })
      .join(' ')
  }
  if (
    state.phase === 'ready' &&
    state.revealedVotes.length > 0 &&
    state.revealedVotes.every((vote) => vote.vote === 'continue')
  ) {
    return 'Nadie quiso salir. La incursión sigue.'
  }
  return null
}

export function joinNames(names: readonly string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

export function outcomeCopy(score: FinalScore): string {
  if (score.outcome === 'offering-failed') {
    return `La ofrenda quedó en ${score.offering} de ${score.threshold}. No alcanza. El Diablo se queda con la bodega.`
  }
  if (score.outcome === 'no-eligible') {
    return 'La ofrenda está completa, pero el Diablo manchó a quienes seguían dentro en la última incursión. Nadie se la lleva.'
  }
  const winners = score.winners.map((id) => score.breakdown.find((row) => row.playerId === id)?.name ?? 'Alguien')
  const stained = score.breakdown.filter((row) => row.stained).map((row) => row.name)
  const stainNote = stained.length > 0 ? ` Quedaron manchados, fuera de la carrera: ${joinNames(stained)}.` : ''
  if (score.outcome === 'tie') {
    return `Empate entre ${joinNames(winners)}. Se reparten la bodega.${stainNote}`
  }
  const points = score.breakdown.find((row) => row.playerId === score.winners[0])?.points ?? 0
  return `Gana ${winners[0]} con ${points} puntos.${stainNote}`
}

export function fleeHint(exposed: number, penalty: number): string {
  if (exposed === 0) return 'No tienes botín expuesto: huir no te cuesta una carta.'
  if (exposed <= penalty) return 'Si huyes, pierdes todo lo expuesto y quedas fuera de esta incursión.'
  const noun = penalty === 1 ? '1 botella al azar' : `${penalty} botellas al azar`
  return `Si huyes, mezclas el botín y pierdes ${noun}. El resto queda en tu colección. Quedas fuera hasta la próxima incursión.`
}

export function pointsLabel(bottles: Parameters<typeof pilePoints>[0], config: Parameters<typeof pilePoints>[1]): string {
  const points = pilePoints(bottles, config)
  const noun = points === 1 ? 'punto' : 'puntos'
  return `${points} ${noun}`
}
