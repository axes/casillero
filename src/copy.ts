import type { EndReason, EventId, FinalScore, GameState } from './engine'
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

export function eventTitle(event: EventId): string {
  switch (event) {
    case 'ruido':
      return 'Ruido'
    case 'barricaCae':
      return 'Barrica cae'
    case 'silencio':
      return 'Silencio'
    case 'vela':
      return 'Vela'
    case 'eco':
      return 'Eco'
    case 'encrucijada':
      return 'Encrucijada'
    case 'pisada':
      return 'Pisada'
    case 'trasiego':
      return 'Trasiego'
  }
}

export function eventRule(event: EventId): string {
  switch (event) {
    case 'ruido':
      return 'Suma un dado. No se puede pasar de tres.'
    case 'barricaCae':
      return 'Suma dos dados. No se puede pasar de tres.'
    case 'silencio':
      return 'Quita un dado. Siempre queda al menos uno.'
    case 'vela':
      return 'Si hay una marca, la apaga. Si no hay, quita un dado.'
    case 'eco':
      return 'Quien sigue dentro con dos o más botellas expuestas pierde una.'
    case 'encrucijada':
      return 'Quien roba elige: una botella más y un dado, o pasar.'
    case 'pisada':
      return 'Suma una marca. Si llega a tres, el Diablo aparece al tiro, sin tirar.'
    case 'trasiego':
      return 'Si alguien tiene más botellas expuestas que quien roba, cambian el botín.'
  }
}

function diceWord(count: number): string {
  return count === 1 ? '1 dado' : `${count} dados`
}

export function describeEvent(state: GameState): string | null {
  const raid = state.lastRaid
  const resolution = raid?.event
  if (!raid || !resolution) return null
  const name = state.players[raid.playerId]?.name ?? 'Alguien'
  switch (resolution.event) {
    case 'ruido':
    case 'barricaCae':
      if (resolution.diceDelta === 0) return 'Ya estaban en tres dados. Esto no suma más.'
      return resolution.event === 'ruido'
        ? `El sótano se inquieta. Ahora hay ${diceWord(raid.diceAfter)}.`
        : `La barrica se viene abajo. De ${raid.diceBefore} pasan a ${diceWord(raid.diceAfter)}.`
    case 'silencio':
      return resolution.diceDelta === 0
        ? 'Ya había un solo dado. El silencio no cambia nada.'
        : `El sótano se calma. Queda ${diceWord(raid.diceAfter)}.`
    case 'vela':
      if (resolution.counterDelta < 0) return `La vela apaga una marca. El Diablo queda en ${raid.countersAfterEvent}.`
      if (resolution.diceDelta < 0) return `No había marca. La vela apaga un dado. Queda ${diceWord(raid.diceAfter)}.`
      return 'No había marca y ya quedaba un dado. La vela no cambia nada.'
    case 'eco': {
      const losses = resolution.lost.flatMap((pile, playerId) =>
        pile.map((bottle) => `${state.players[playerId]?.name ?? 'Alguien'} pierde un ${bottle.cepa}`),
      )
      return losses.length > 0 ? `${losses.join('. ')}.` : 'Nadie tenía dos botellas expuestas. El eco no se lleva nada.'
    }
    case 'encrucijada':
      if (resolution.choice === 'take' && resolution.extraBottle) {
        return `${name} se lleva un ${resolution.extraBottle.cepa} y ahora hay ${diceWord(raid.diceAfter)}.`
      }
      if (resolution.choice === 'pass') return `${name} pasa. Los dados siguen igual.`
      return `${name}, ¿te llevas otra botella y un dado, o pasas?`
    case 'pisada':
      return resolution.devil
        ? 'Una pisada. Con eso el Diablo despierta, sin tirar.'
        : `Una pisada en la oscuridad. El Diablo queda en ${raid.countersAfterEvent}.`
    case 'trasiego': {
      if (resolution.swapWith === null) return `Nadie tenía más que ${name}. El trasiego no mueve nada.`
      const other = state.players[resolution.swapWith]?.name ?? 'alguien'
      return `${name} y ${other} cambian el botín expuesto.`
    }
  }
}

export function describeRaid(state: GameState): string | null {
  const raid = state.lastRaid
  if (!raid) return null
  const name = state.players[raid.playerId]?.name ?? 'Alguien'
  if (raid.card.kind === 'event') {
    const effect = describeEvent(state)
    const faces = raid.rolls ? ` Dados: ${raid.rolls.join(', ')}.` : ''
    const mark = raid.addedFromSix ? ' Salió un 6: una marca más.' : ''
    const devil = raid.devil && raid.devilFrom === 'roll' ? ' El Diablo aparece.' : ''
    return `${eventTitle(raid.card.event)}. ${effect ?? ''}${faces}${mark}${devil}`
  }
  const faces = raid.rolls ? raid.rolls.join(', ') : 'sin tirada'
  let line = `${name} robó un ${raid.card.cepa}. Dados: ${faces}.`
  if (raid.addedFromSix) line += ' Salió un 6: una marca más.'
  if (raid.devil) line += ' El Diablo aparece.'
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
