/**
 * 0 duerme, 1 escuchó algo, 2 está cerca, 3 aparece.
 * La marca es un contador, no un dado bloqueado.
 */
export function threatBand(counters: number, devilAt: number): 0 | 1 | 2 | 3 {
  if (counters <= 0) return 0
  if (counters >= devilAt) return 3
  if (counters >= devilAt - 1) return 2
  return 1
}

export function clampDice(count: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, count))
}

/**
 * Una tirada suma como máximo `maxPerRoll` marcas, y solo si salió algún 6.
 * Con el tope en 1, varios 6 en la misma tirada dejan una sola marca.
 * Los dobles y triples no agregan nada más.
 */
export function countersFromRoll(rolls: readonly number[], maxPerRoll: number): number {
  let sixes = 0
  for (const face of rolls) {
    if (!Number.isInteger(face) || face < 1 || face > 6) {
      throw new Error('Dado fuera de rango.')
    }
    if (face === 6) sixes += 1
  }
  if (sixes <= 0 || maxPerRoll <= 0) return 0
  return Math.min(maxPerRoll, sixes)
}
