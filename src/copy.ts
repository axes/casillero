import type { ActionId, EventId, FinalScore, GameState } from './engine'

export function lootLabel(points: number): string {
  if (points === 1) return 'Vino joven'
  if (points === 2) return 'Reserva'
  return 'Gran reserva'
}

export function eventName(event: EventId): string {
  switch (event) {
    case 'ruido':
      return 'Ruido'
    case 'barricaCae':
      return 'Barrica cae'
    case 'silencio':
      return 'Silencio'
    case 'guardia':
      return 'Guardia'
  }
}

export function eventRule(event: EventId): string {
  switch (event) {
    case 'ruido':
      return 'Suma un dado esta noche. No se pasa de tres.'
    case 'barricaCae':
      return 'Suma dos dados esta noche. No se pasa de tres.'
    case 'silencio':
      return 'Quita un dado. El de la Guardia no baja.'
    case 'guardia':
      return 'Suma un dado que Silencio no puede bajar esta noche.'
  }
}

export function actionName(action: ActionId): string {
  switch (action) {
    case 'saqueo':
      return 'Saqueo'
    case 'quebranto':
      return 'Quebranto'
    case 'trasiego':
      return 'Trasiego'
    case 'delacion':
      return 'Delación'
    case 'alarma':
      return 'Alarma'
    case 'tranca':
      return 'Tranca'
    case 'escondite':
      return 'Escondite'
    case 'vistazo':
      return 'Vistazo'
    case 'sombra':
      return 'Sombra'
  }
}

export function actionRule(action: ActionId): string {
  switch (action) {
    case 'saqueo':
      return 'Te llevas una botella segura de un rival.'
    case 'quebranto':
      return 'Tiras al descarte una botella segura de un rival.'
    case 'trasiego':
      return 'Cambias una botella segura tuya por una de un rival.'
    case 'delacion':
      return 'La noche empieza con un dado más.'
    case 'alarma':
      return 'La noche empieza con dos dados más.'
    case 'tranca':
      return 'Cancela una acción que te acaba de apuntar.'
    case 'escondite':
      return 'Esta noche no te roban, no te quiebran y no te trasiegan.'
    case 'vistazo':
      return 'Miras la mano de un rival.'
    case 'sombra':
      return 'Si sale un 6, tú igual aseguras lo de esta noche.'
  }
}

export function outcomeCopy(score: FinalScore): string {
  const names = score.winners.map((id) => score.rows.find((row) => row.playerId === id)?.name ?? 'Alguien')
  if (score.tie) {
    const joined = names.length === 2 ? `${names[0]} y ${names[1]}` : names.join(', ')
    return `Empate entre ${joined}. Se reparten la cava.`
  }
  const points = score.rows.find((row) => row.playerId === score.winners[0])?.points ?? 0
  return `Gana ${names[0]} con ${points} puntos.`
}

export function nightEndCopy(state: GameState): string {
  const reason = state.nightEnd?.reason
  if (reason === 'six') return 'Salió un 6. El Diablo los descubrió: quienes seguían dentro pierden lo de esta noche.'
  if (reason === 'auto-bank') return 'Tercera ronda sin 6. Quienes seguían dentro aseguran el botín.'
  return 'Todos salieron. Lo de esta noche queda asegurado.'
}
