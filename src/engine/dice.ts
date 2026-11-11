export function clampDice(count: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, count))
}

export function rollHasSix(rolls: readonly number[]): boolean {
  for (const face of rolls) {
    if (!Number.isInteger(face) || face < 1 || face > 6) throw new Error('Dado fuera de rango.')
    if (face === 6) return true
  }
  return false
}

/** 0 calmo, 1 se nota, 2 tensión, 3 el Diablo. Lo usa la vista, no las reglas. */
export function pressureLevel(round: number, diceCount: number, devil: boolean): 0 | 1 | 2 | 3 {
  if (devil) return 3
  let level: 0 | 1 | 2 = 0
  if (round >= 1 || diceCount >= 2) level = 1
  if (round >= 2 || diceCount >= 3) level = 2
  return level
}
